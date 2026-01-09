/**
 * XHS (Xiaohongshu) scraper service
 * Uses Puppeteer for headless browser-based content extraction
 */
import puppeteer, { Browser, Page } from 'puppeteer';

/**
 * Scraped media item
 */
export interface ScrapedMedia {
  type: 'image' | 'video';
  url: string;
  fileSize?: number;
}

/**
 * Scraped post content
 */
export interface ScrapedPost {
  title: string;
  text: string;
  authorName: string | null;
  authorId: string | null;
  originalDate: number | null;
  viewCount: number | null;
  likeCount: number | null;
  media: ScrapedMedia[];
}

/**
 * XHS URL patterns
 */
const XHS_URL_PATTERNS = [
  /^https?:\/\/(www\.)?xiaohongshu\.com\/explore\//,
  /^https?:\/\/(www\.)?xiaohongshu\.com\/discovery\/item\//,
  /^https?:\/\/xhslink\.com\//,
];

/**
 * Browser instance (reused for performance)
 */
let browserInstance: Browser | null = null;

/**
 * Get or create browser instance
 */
async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });
  }
  return browserInstance;
}

/**
 * Validate XHS URL
 */
export function isValidXhsUrl(url: string): boolean {
  return XHS_URL_PATTERNS.some((pattern) => pattern.test(url));
}

/**
 * Normalize XHS URL
 */
export function normalizeXhsUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // Remove tracking parameters
    const paramsToRemove = [
      'xsec_token',
      'xsec_source',
      'source',
      'shareRedId',
      'appuid',
      'apptime',
      'share_from',
    ];

    paramsToRemove.forEach((param) => {
      urlObj.searchParams.delete(param);
    });

    // Ensure HTTPS
    urlObj.protocol = 'https:';

    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Extract content from XHS page
 */
async function extractContent(page: Page): Promise<ScrapedPost> {
  // Wait for content to load
  await page.waitForSelector('body', { timeout: 10000 });

  // Extract post data
  const postData = await page.evaluate(() => {
    // Try to find title
    const titleEl =
      document.querySelector('h1') ||
      document.querySelector('[class*="title"]') ||
      document.querySelector('.note-content h1');
    const title = titleEl?.textContent?.trim() || '';

    // Try to find text content
    const textEl =
      document.querySelector('.note-content') ||
      document.querySelector('[class*="desc"]') ||
      document.querySelector('.content');
    const text = textEl?.textContent?.trim() || '';

    // Try to find author
    const authorEl =
      document.querySelector('[class*="author"] [class*="name"]') ||
      document.querySelector('.author-name') ||
      document.querySelector('[class*="nickname"]');
    const authorName = authorEl?.textContent?.trim() || null;

    // Try to find author ID from URL
    const authorLink = document.querySelector(
      '[class*="author"] a'
    ) as HTMLAnchorElement | null;
    let authorId: string | null = null;
    if (authorLink?.href) {
      const match = authorLink.href.match(/\/user\/profile\/([a-zA-Z0-9]+)/);
      if (match) authorId = match[1];
    }

    // Try to find stats
    const likeEl = document.querySelector('[class*="like"] [class*="count"]');
    const likeCount = likeEl?.textContent
      ? parseInt(likeEl.textContent.replace(/\D/g, ''), 10) || null
      : null;

    // Try to find images
    const images: { type: 'image'; url: string }[] = [];
    const imageEls = document.querySelectorAll(
      '.swiper-slide img, .note-image img, [class*="carousel"] img'
    );
    imageEls.forEach((img) => {
      const src =
        (img as HTMLImageElement).src ||
        img.getAttribute('data-src') ||
        img.getAttribute('data-original');
      if (src && !src.includes('avatar') && !src.includes('profile')) {
        images.push({ type: 'image', url: src });
      }
    });

    // Try to find video
    const videos: { type: 'video'; url: string }[] = [];
    const videoEl = document.querySelector('video');
    if (videoEl) {
      const src =
        videoEl.src ||
        videoEl.querySelector('source')?.src ||
        videoEl.getAttribute('data-src');
      if (src) {
        videos.push({ type: 'video', url: src });
      }
    }

    return {
      title,
      text,
      authorName,
      authorId,
      likeCount,
      viewCount: null, // XHS doesn't always show view count
      originalDate: null, // Would need date parsing
      media: [...images, ...videos],
    };
  });

  return postData;
}

/**
 * Scrape XHS post
 */
export async function scrapePost(url: string): Promise<ScrapedPost> {
  // Validate URL
  if (!isValidXhsUrl(url)) {
    throw new Error('Invalid XHS URL');
  }

  // Normalize URL
  const normalizedUrl = normalizeXhsUrl(url);

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Set viewport and user agent
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Navigate to page
    await page.goto(normalizedUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait a bit for dynamic content
    await page.waitForTimeout(2000);

    // Extract content
    const content = await extractContent(page);

    // Validate we got something
    if (!content.title && !content.text && content.media.length === 0) {
      throw new Error('Failed to extract content from page');
    }

    return content;
  } finally {
    await page.close();
  }
}

/**
 * Close browser instance (for cleanup)
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

// Cleanup on process exit
process.on('exit', () => {
  closeBrowser();
});

process.on('SIGINT', () => {
  closeBrowser();
  process.exit();
});
