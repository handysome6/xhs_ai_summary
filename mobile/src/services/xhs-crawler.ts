/**
 * XHS Crawler client - communicates with backend crawl API
 */
import { xhsApi, CrawlResponse } from './api-client';

/**
 * Crawled content result
 */
export interface CrawledContent {
  title: string;
  text: string;
  authorName: string | null;
  authorId: string | null;
  originalDate: number | null;
  viewCount: number | null;
  likeCount: number | null;
  media: Array<{
    type: 'image' | 'video';
    url: string;
    fileSize?: number;
  }>;
}

/**
 * Crawl result
 */
export interface CrawlResult {
  success: boolean;
  content: CrawledContent | null;
  errorMessage: string | null;
}

/**
 * Crawl XHS post via backend API
 */
export async function crawlPost(url: string): Promise<CrawlResult> {
  try {
    const response = await xhsApi.crawl(url);

    if (!response.success || !response.data) {
      return {
        success: false,
        content: null,
        errorMessage: 'Crawl failed: no data returned',
      };
    }

    return {
      success: true,
      content: response.data,
      errorMessage: null,
    };
  } catch (error) {
    return {
      success: false,
      content: null,
      errorMessage:
        error instanceof Error ? error.message : 'Failed to crawl post',
    };
  }
}
