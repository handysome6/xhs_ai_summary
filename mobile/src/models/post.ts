/**
 * Post entity - represents a saved XHS post
 */
export interface Post {
  id: string;
  url: string;
  urlHash: string;
  title: string | null;
  downloadStatus: PostDownloadStatus;
  createdAt: number;
  updatedAt: number;
}

export type PostDownloadStatus =
  | 'pending'
  | 'downloading'
  | 'completed'
  | 'partial'
  | 'failed';

/**
 * Input for creating a new post
 */
export interface CreatePostInput {
  url: string;
  urlHash: string;
  title?: string;
}

/**
 * Input for updating a post
 */
export interface UpdatePostInput {
  title?: string;
  downloadStatus?: PostDownloadStatus;
}

/**
 * Post with all related data for UI display
 */
export interface PostWithDetails {
  post: Post;
  content: import('./content').Content | null;
  media: import('./media').Media[];
  aiResult: import('./ai-result').AIResult | null;
  downloadTask: import('./download-task').DownloadTask | null;
}
