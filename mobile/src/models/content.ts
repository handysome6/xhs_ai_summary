/**
 * Content entity - extracted text and metadata from XHS post
 */
export interface Content {
  id: string;
  postId: string;
  text: string;
  authorName: string | null;
  authorId: string | null;
  originalDate: number | null;
  viewCount: number | null;
  likeCount: number | null;
}

/**
 * Input for creating content
 */
export interface CreateContentInput {
  postId: string;
  text: string;
  authorName?: string;
  authorId?: string;
  originalDate?: number;
  viewCount?: number;
  likeCount?: number;
}

/**
 * Content response from crawl API
 */
export interface CrawledContent {
  title: string;
  text: string;
  authorName?: string;
  authorId?: string;
  originalDate?: string;
  viewCount?: number;
  likeCount?: number;
  media: CrawledMedia[];
}

export interface CrawledMedia {
  type: 'image' | 'video';
  url: string;
  width?: number;
  height?: number;
  fileSize?: number;
}
