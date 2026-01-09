/**
 * Share handler service
 * Handles incoming shared URLs from system share sheet
 */
import { validateXhsUrl, extractXhsUrls } from '../utils/url-validator';
import {
  createPost,
  getPostByUrlHash,
  postExistsByUrlHash,
} from '../db/repositories/post-repository';
import { Post } from '../models/post';

/**
 * Share handling result
 */
export interface ShareResult {
  success: boolean;
  post: Post | null;
  isDuplicate: boolean;
  errorMessage: string | null;
}

/**
 * Handle shared text content
 * Extracts XHS URLs and creates posts
 */
export async function handleSharedContent(text: string): Promise<ShareResult[]> {
  // Extract all XHS URLs from the shared text
  const urls = extractXhsUrls(text);

  if (urls.length === 0) {
    // Try treating the whole text as a URL
    const validation = await validateXhsUrl(text);
    if (validation.isValid && validation.normalizedUrl && validation.urlHash) {
      return [await processUrl(validation.normalizedUrl, validation.urlHash)];
    }

    return [
      {
        success: false,
        post: null,
        isDuplicate: false,
        errorMessage: 'No valid XHS URL found in shared content',
      },
    ];
  }

  // Process each URL
  const results: ShareResult[] = [];
  for (const url of urls) {
    const validation = await validateXhsUrl(url);
    if (validation.isValid && validation.normalizedUrl && validation.urlHash) {
      const result = await processUrl(validation.normalizedUrl, validation.urlHash);
      results.push(result);
    }
  }

  return results;
}

/**
 * Handle single shared URL
 */
export async function handleSharedUrl(url: string): Promise<ShareResult> {
  const validation = await validateXhsUrl(url);

  if (!validation.isValid) {
    return {
      success: false,
      post: null,
      isDuplicate: false,
      errorMessage: validation.errorMessage || 'Invalid URL',
    };
  }

  if (!validation.normalizedUrl || !validation.urlHash) {
    return {
      success: false,
      post: null,
      isDuplicate: false,
      errorMessage: 'Failed to process URL',
    };
  }

  return processUrl(validation.normalizedUrl, validation.urlHash);
}

/**
 * Process a validated URL
 */
async function processUrl(url: string, urlHash: string): Promise<ShareResult> {
  try {
    // Check for duplicates
    const existing = await getPostByUrlHash(urlHash);
    if (existing) {
      return {
        success: true,
        post: existing,
        isDuplicate: true,
        errorMessage: null,
      };
    }

    // Create new post
    const post = await createPost({
      url,
      urlHash,
    });

    return {
      success: true,
      post,
      isDuplicate: false,
      errorMessage: null,
    };
  } catch (error) {
    return {
      success: false,
      post: null,
      isDuplicate: false,
      errorMessage: error instanceof Error ? error.message : 'Failed to save post',
    };
  }
}

/**
 * Listener type for share events
 */
export type ShareListener = (results: ShareResult[]) => void;

/**
 * Share event listeners
 */
const listeners: Set<ShareListener> = new Set();

/**
 * Register a listener for share events
 */
export function addShareListener(listener: ShareListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Notify all listeners of share results
 */
export function notifyShareListeners(results: ShareResult[]): void {
  listeners.forEach((listener) => listener(results));
}
