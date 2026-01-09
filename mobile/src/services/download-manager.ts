/**
 * Download Manager - handles background download of post content and media
 */
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { crawlPost, CrawledContent } from './xhs-crawler';
import {
  downloadFile,
  getMediaPath,
  isVideoWithinLimit,
  initializeDirectories,
} from '../utils/file-manager';
import { MAX_VIDEO_SIZE_BYTES } from '../utils/constants';
import {
  getPostById,
  updatePostStatus,
  getAllPosts,
} from '../db/repositories/post-repository';
import {
  createContent,
  getContentByPostId,
} from '../db/repositories/content-repository';
import {
  createMediaBatch,
  getMediaByPostId,
  updateMediaStatus,
} from '../db/repositories/media-repository';
import { Post, PostDownloadStatus } from '../models/post';
import { MediaType } from '../models/media';
import { analyzePost } from './ai-analysis';

/**
 * Background task name
 */
const DOWNLOAD_TASK_NAME = 'xhs-content-download';

/**
 * Download queue
 */
interface DownloadQueueItem {
  postId: string;
  priority: number;
  addedAt: number;
}

const downloadQueue: DownloadQueueItem[] = [];
let isProcessing = false;

/**
 * Progress callback type
 */
export type DownloadProgressCallback = (
  postId: string,
  progress: number,
  status: PostDownloadStatus
) => void;

/**
 * Progress listeners
 */
const progressListeners: Set<DownloadProgressCallback> = new Set();

/**
 * Register progress listener
 */
export function addProgressListener(
  callback: DownloadProgressCallback
): () => void {
  progressListeners.add(callback);
  return () => progressListeners.delete(callback);
}

/**
 * Notify progress listeners
 */
function notifyProgress(
  postId: string,
  progress: number,
  status: PostDownloadStatus
): void {
  progressListeners.forEach((listener) => listener(postId, progress, status));
}

/**
 * Initialize download manager
 */
export async function initializeDownloadManager(): Promise<void> {
  await initializeDirectories();
}

/**
 * Add post to download queue
 */
export function queueDownload(postId: string, priority: number = 0): void {
  // Check if already in queue
  const exists = downloadQueue.some((item) => item.postId === postId);
  if (exists) return;

  downloadQueue.push({
    postId,
    priority,
    addedAt: Date.now(),
  });

  // Sort by priority (higher first), then by time (earlier first)
  downloadQueue.sort((a, b) => {
    if (a.priority !== b.priority) return b.priority - a.priority;
    return a.addedAt - b.addedAt;
  });

  // Start processing if not already
  processQueue();
}

/**
 * Process download queue
 */
async function processQueue(): Promise<void> {
  if (isProcessing || downloadQueue.length === 0) return;

  isProcessing = true;

  while (downloadQueue.length > 0) {
    const item = downloadQueue.shift();
    if (!item) continue;

    try {
      await downloadPost(item.postId);
    } catch (error) {
      console.error(`Failed to download post ${item.postId}:`, error);
    }
  }

  isProcessing = false;
}

/**
 * Download a single post
 */
export async function downloadPost(postId: string): Promise<boolean> {
  const post = await getPostById(postId);
  if (!post) return false;

  // Update status to downloading
  await updatePostStatus(postId, 'downloading');
  notifyProgress(postId, 0, 'downloading');

  try {
    // Step 1: Crawl content (30%)
    const crawlResult = await crawlPost(post.url);

    if (!crawlResult.success || !crawlResult.content) {
      await updatePostStatus(postId, 'failed');
      notifyProgress(postId, 0, 'failed');
      return false;
    }

    notifyProgress(postId, 0.3, 'downloading');

    // Step 2: Save content to database (40%)
    await saveContent(postId, crawlResult.content);
    notifyProgress(postId, 0.4, 'downloading');

    // Step 3: Download media (40% - 85%)
    const mediaSuccess = await downloadMedia(
      postId,
      crawlResult.content.media,
      (mediaProgress) => {
        const totalProgress = 0.4 + mediaProgress * 0.45;
        notifyProgress(postId, totalProgress, 'downloading');
      }
    );

    notifyProgress(postId, 0.85, 'downloading');

    // Step 4: AI Analysis (85% - 100%)
    try {
      await analyzePost(postId);
    } catch (error) {
      console.error('AI analysis failed (non-fatal):', error);
      // AI analysis failure is non-fatal - continue
    }

    // Update final status
    const finalStatus: PostDownloadStatus = mediaSuccess
      ? 'completed'
      : 'partial';
    await updatePostStatus(postId, finalStatus);
    notifyProgress(postId, 1, finalStatus);

    return true;
  } catch (error) {
    console.error(`Download failed for post ${postId}:`, error);
    await updatePostStatus(postId, 'failed');
    notifyProgress(postId, 0, 'failed');
    return false;
  }
}

/**
 * Save crawled content to database
 */
async function saveContent(
  postId: string,
  content: CrawledContent
): Promise<void> {
  // Check if content already exists
  const existing = await getContentByPostId(postId);
  if (existing) return;

  await createContent({
    postId,
    text: content.text,
    authorName: content.authorName,
    authorId: content.authorId,
    originalDate: content.originalDate,
    viewCount: content.viewCount,
    likeCount: content.likeCount,
  });

  // Update post title if we got one
  if (content.title) {
    const post = await getPostById(postId);
    if (post && !post.title) {
      // Would update title here - for now, this is handled by the crawl
    }
  }
}

/**
 * Download media files
 */
async function downloadMedia(
  postId: string,
  mediaItems: Array<{ type: 'image' | 'video'; url: string; fileSize?: number }>,
  onProgress: (progress: number) => void
): Promise<boolean> {
  if (mediaItems.length === 0) {
    onProgress(1);
    return true;
  }

  // Create media records
  const mediaRecords = await createMediaBatch(
    mediaItems.map((item, index) => ({
      postId,
      type: item.type as MediaType,
      remoteUrl: item.url,
      sortOrder: index,
      fileSize: item.fileSize,
    }))
  );

  let completedCount = 0;
  let hasFailures = false;

  for (const media of mediaRecords) {
    try {
      // Check video size limit
      if (media.type === 'video') {
        const withinLimit = await isVideoWithinLimit(media.remoteUrl);
        if (!withinLimit) {
          await updateMediaStatus(media.id, 'skipped');
          completedCount++;
          onProgress(completedCount / mediaRecords.length);
          continue;
        }
      }

      // Get local path
      const localPath = getMediaPath(
        postId,
        media.sortOrder,
        media.type as 'image' | 'video'
      );

      // Download file
      await updateMediaStatus(media.id, 'downloading');
      const result = await downloadFile(media.remoteUrl, localPath);

      if (result.success && result.localPath) {
        await updateMediaStatus(
          media.id,
          'completed',
          result.localPath,
          result.fileSize ?? undefined
        );
      } else {
        await updateMediaStatus(media.id, 'failed');
        hasFailures = true;
      }
    } catch (error) {
      console.error(`Failed to download media ${media.id}:`, error);
      await updateMediaStatus(media.id, 'failed');
      hasFailures = true;
    }

    completedCount++;
    onProgress(completedCount / mediaRecords.length);
  }

  return !hasFailures;
}

/**
 * Retry failed download
 */
export async function retryDownload(postId: string): Promise<boolean> {
  return downloadPost(postId);
}

/**
 * Get download status for a post
 */
export async function getDownloadStatus(postId: string): Promise<{
  status: PostDownloadStatus;
  mediaTotal: number;
  mediaCompleted: number;
  mediaFailed: number;
} | null> {
  const post = await getPostById(postId);
  if (!post) return null;

  const media = await getMediaByPostId(postId);

  return {
    status: post.downloadStatus,
    mediaTotal: media.length,
    mediaCompleted: media.filter((m) => m.downloadStatus === 'completed').length,
    mediaFailed: media.filter((m) => m.downloadStatus === 'failed').length,
  };
}

/**
 * Register background task
 */
export async function registerBackgroundTask(): Promise<void> {
  try {
    await BackgroundFetch.registerTaskAsync(DOWNLOAD_TASK_NAME, {
      minimumInterval: 60 * 15, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch (error) {
    console.error('Failed to register background task:', error);
  }
}

/**
 * Define background task
 */
TaskManager.defineTask(DOWNLOAD_TASK_NAME, async () => {
  try {
    // Get pending posts
    const posts = await getAllPosts({ status: 'pending' });

    for (const post of posts.slice(0, 5)) {
      // Limit to 5 per background run
      await downloadPost(post.id);
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background download task failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});
