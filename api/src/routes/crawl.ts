/**
 * Crawl route - handles XHS post crawling requests
 */
import { Router, Request, Response } from 'express';
import { asyncHandler, Errors } from '../middleware/error-handler';
import { scrapePost, isValidXhsUrl } from '../services/xhs-scraper';

const router = Router();

/**
 * Crawl request body
 */
interface CrawlRequest {
  url: string;
}

/**
 * Crawl XHS post
 * POST /crawl
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { url } = req.body as CrawlRequest;

    // Validate request
    if (!url) {
      throw Errors.badRequest('URL is required');
    }

    if (typeof url !== 'string') {
      throw Errors.badRequest('URL must be a string');
    }

    // Validate XHS URL
    if (!isValidXhsUrl(url)) {
      throw Errors.validation('Invalid XHS URL. Must be a valid Xiaohongshu link.');
    }

    try {
      // Scrape the post
      const content = await scrapePost(url);

      res.json({
        success: true,
        data: content,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid XHS URL') {
        throw Errors.validation(error.message);
      }
      throw Errors.crawlFailed(
        error instanceof Error ? error.message : 'Failed to crawl post'
      );
    }
  })
);

export default router;
