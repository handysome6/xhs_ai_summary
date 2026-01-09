/**
 * Media entity - images and videos associated with a post
 */
export interface Media {
  id: string;
  postId: string;
  type: MediaType;
  remoteUrl: string;
  localPath: string | null;
  fileSize: number | null;
  downloadStatus: MediaDownloadStatus;
  sortOrder: number;
}

export type MediaType = 'image' | 'video';

export type MediaDownloadStatus =
  | 'pending'
  | 'downloading'
  | 'completed'
  | 'failed'
  | 'skipped';

/**
 * Input for creating media record
 */
export interface CreateMediaInput {
  postId: string;
  type: MediaType;
  remoteUrl: string;
  sortOrder: number;
  fileSize?: number;
}

/**
 * Input for updating media after download
 */
export interface UpdateMediaInput {
  localPath?: string;
  fileSize?: number;
  downloadStatus?: MediaDownloadStatus;
}
