/**
 * File management utilities for media downloads
 */
import * as FileSystem from 'expo-file-system';
import { MAX_VIDEO_SIZE_BYTES } from './constants';

/**
 * Base directory for downloaded media
 */
const MEDIA_DIRECTORY = `${FileSystem.documentDirectory}media/`;

/**
 * Subdirectories for different media types
 */
const DIRECTORIES = {
  images: `${MEDIA_DIRECTORY}images/`,
  videos: `${MEDIA_DIRECTORY}videos/`,
  temp: `${MEDIA_DIRECTORY}temp/`,
} as const;

/**
 * File info result
 */
export interface FileInfo {
  exists: boolean;
  size: number | null;
  modificationTime: number | null;
  uri: string;
}

/**
 * Download progress callback
 */
export type DownloadProgressCallback = (progress: number) => void;

/**
 * Download result
 */
export interface DownloadResult {
  success: boolean;
  localPath: string | null;
  fileSize: number | null;
  errorMessage: string | null;
}

/**
 * Initialize media directories
 */
export async function initializeDirectories(): Promise<void> {
  for (const dir of Object.values(DIRECTORIES)) {
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
  }
}

/**
 * Get directory for media type
 */
export function getMediaDirectory(type: 'image' | 'video'): string {
  return type === 'image' ? DIRECTORIES.images : DIRECTORIES.videos;
}

/**
 * Generate unique filename for media
 */
export function generateMediaFilename(
  postId: string,
  index: number,
  type: 'image' | 'video',
  extension?: string
): string {
  const ext = extension || (type === 'image' ? 'jpg' : 'mp4');
  return `${postId}_${index}.${ext}`;
}

/**
 * Get full path for media file
 */
export function getMediaPath(
  postId: string,
  index: number,
  type: 'image' | 'video',
  extension?: string
): string {
  const directory = getMediaDirectory(type);
  const filename = generateMediaFilename(postId, index, type, extension);
  return `${directory}${filename}`;
}

/**
 * Check file size before download
 */
export async function checkRemoteFileSize(url: string): Promise<number | null> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');
    return contentLength ? parseInt(contentLength, 10) : null;
  } catch {
    return null;
  }
}

/**
 * Download file with progress tracking
 */
export async function downloadFile(
  url: string,
  localPath: string,
  onProgress?: DownloadProgressCallback
): Promise<DownloadResult> {
  try {
    // Ensure directory exists
    const directory = localPath.substring(0, localPath.lastIndexOf('/') + 1);
    const dirInfo = await FileSystem.getInfoAsync(directory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    }

    // Create download resumable
    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      localPath,
      {},
      (downloadProgress) => {
        if (onProgress && downloadProgress.totalBytesExpectedToWrite > 0) {
          const progress =
            downloadProgress.totalBytesWritten /
            downloadProgress.totalBytesExpectedToWrite;
          onProgress(progress);
        }
      }
    );

    const result = await downloadResumable.downloadAsync();

    if (!result) {
      return {
        success: false,
        localPath: null,
        fileSize: null,
        errorMessage: 'Download returned no result',
      };
    }

    // Get file size
    const fileInfo = await FileSystem.getInfoAsync(result.uri);
    const fileSize = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : null;

    return {
      success: true,
      localPath: result.uri,
      fileSize,
      errorMessage: null,
    };
  } catch (error) {
    return {
      success: false,
      localPath: null,
      fileSize: null,
      errorMessage: error instanceof Error ? error.message : 'Download failed',
    };
  }
}

/**
 * Check if video size is within limit
 */
export async function isVideoWithinLimit(url: string): Promise<boolean> {
  const size = await checkRemoteFileSize(url);
  if (size === null) {
    // Can't determine size, allow download
    return true;
  }
  return size <= MAX_VIDEO_SIZE_BYTES;
}

/**
 * Get file info
 */
export async function getFileInfo(path: string): Promise<FileInfo> {
  try {
    const info = await FileSystem.getInfoAsync(path);

    if (!info.exists) {
      return {
        exists: false,
        size: null,
        modificationTime: null,
        uri: path,
      };
    }

    return {
      exists: true,
      size: 'size' in info ? info.size : null,
      modificationTime: 'modificationTime' in info ? info.modificationTime : null,
      uri: info.uri,
    };
  } catch {
    return {
      exists: false,
      size: null,
      modificationTime: null,
      uri: path,
    };
  }
}

/**
 * Delete file
 */
export async function deleteFile(path: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists) {
      await FileSystem.deleteAsync(path, { idempotent: true });
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete all media for a post
 */
export async function deletePostMedia(postId: string): Promise<void> {
  const directories = [DIRECTORIES.images, DIRECTORIES.videos];

  for (const dir of directories) {
    try {
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) continue;

      const files = await FileSystem.readDirectoryAsync(dir);
      const postFiles = files.filter((f) => f.startsWith(postId));

      for (const file of postFiles) {
        await FileSystem.deleteAsync(`${dir}${file}`, { idempotent: true });
      }
    } catch {
      // Ignore errors during cleanup
    }
  }
}

/**
 * Get total storage used by media
 */
export async function getStorageUsed(): Promise<number> {
  let totalSize = 0;
  const directories = [DIRECTORIES.images, DIRECTORIES.videos];

  for (const dir of directories) {
    try {
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) continue;

      const files = await FileSystem.readDirectoryAsync(dir);
      for (const file of files) {
        const fileInfo = await FileSystem.getInfoAsync(`${dir}${file}`);
        if (fileInfo.exists && 'size' in fileInfo) {
          totalSize += fileInfo.size;
        }
      }
    } catch {
      // Ignore errors
    }
  }

  return totalSize;
}

/**
 * Clear all downloaded media
 */
export async function clearAllMedia(): Promise<void> {
  try {
    const mediaInfo = await FileSystem.getInfoAsync(MEDIA_DIRECTORY);
    if (mediaInfo.exists) {
      await FileSystem.deleteAsync(MEDIA_DIRECTORY, { idempotent: true });
    }
    await initializeDirectories();
  } catch {
    // Ignore errors
  }
}

/**
 * Format bytes to human readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}
