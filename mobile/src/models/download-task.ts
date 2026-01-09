/**
 * DownloadTask entity - background download operation tracking
 */
export interface DownloadTask {
  id: string;
  postId: string;
  status: TaskStatus;
  progress: number;
  retryCount: number;
  errorMessage: string | null;
  createdAt: number;
  updatedAt: number;
}

export type TaskStatus =
  | 'queued'
  | 'crawling'
  | 'downloading'
  | 'analyzing'
  | 'completed'
  | 'failed';

/**
 * Input for creating a download task
 */
export interface CreateDownloadTaskInput {
  postId: string;
}

/**
 * Input for updating a download task
 */
export interface UpdateDownloadTaskInput {
  status?: TaskStatus;
  progress?: number;
  retryCount?: number;
  errorMessage?: string | null;
}
