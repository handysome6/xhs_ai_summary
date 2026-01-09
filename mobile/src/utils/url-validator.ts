/**
 * URL validation utilities for XHS (Xiaohongshu) links
 */
import { XHS_URL_PATTERNS } from './constants';
import * as Crypto from 'expo-crypto';

/**
 * Validation result
 */
export interface UrlValidationResult {
  isValid: boolean;
  normalizedUrl: string | null;
  urlHash: string | null;
  errorMessage: string | null;
  postId: string | null;
}

/**
 * Extract post ID from XHS URL
 */
function extractPostId(url: string): string | null {
  // Pattern for /explore/POST_ID or /discovery/item/POST_ID
  const exploreMatch = url.match(/\/explore\/([a-zA-Z0-9]+)/);
  if (exploreMatch) {
    return exploreMatch[1];
  }

  const discoveryMatch = url.match(/\/discovery\/item\/([a-zA-Z0-9]+)/);
  if (discoveryMatch) {
    return discoveryMatch[1];
  }

  // Short URL format: xhslink.com/xxx
  const shortMatch = url.match(/xhslink\.com\/([a-zA-Z0-9]+)/);
  if (shortMatch) {
    return shortMatch[1];
  }

  return null;
}

/**
 * Normalize XHS URL to canonical form
 */
function normalizeUrl(url: string): string {
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
 * Check if URL matches XHS patterns
 */
function matchesXhsPatterns(url: string): boolean {
  return XHS_URL_PATTERNS.some((pattern) => pattern.test(url));
}

/**
 * Generate SHA-256 hash of URL
 */
async function hashUrl(url: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    url
  );
  return digest;
}

/**
 * Validate and process XHS URL
 */
export async function validateXhsUrl(url: string): Promise<UrlValidationResult> {
  // Trim whitespace
  const trimmedUrl = url.trim();

  // Check if empty
  if (!trimmedUrl) {
    return {
      isValid: false,
      normalizedUrl: null,
      urlHash: null,
      errorMessage: 'URL cannot be empty',
      postId: null,
    };
  }

  // Check if it's a valid URL format
  try {
    new URL(trimmedUrl);
  } catch {
    return {
      isValid: false,
      normalizedUrl: null,
      urlHash: null,
      errorMessage: 'Invalid URL format',
      postId: null,
    };
  }

  // Check if URL matches XHS patterns
  if (!matchesXhsPatterns(trimmedUrl)) {
    return {
      isValid: false,
      normalizedUrl: null,
      urlHash: null,
      errorMessage: 'URL is not a valid Xiaohongshu link',
      postId: null,
    };
  }

  // Normalize URL
  const normalizedUrl = normalizeUrl(trimmedUrl);

  // Extract post ID
  const postId = extractPostId(normalizedUrl);

  // Generate hash
  const urlHash = await hashUrl(normalizedUrl);

  return {
    isValid: true,
    normalizedUrl,
    urlHash,
    errorMessage: null,
    postId,
  };
}

/**
 * Quick check if URL looks like XHS link (sync version)
 */
export function isXhsUrl(url: string): boolean {
  try {
    return matchesXhsPatterns(url.trim());
  } catch {
    return false;
  }
}

/**
 * Extract all XHS URLs from text
 */
export function extractXhsUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
  const matches = text.match(urlRegex) || [];

  return matches.filter((url) => isXhsUrl(url));
}
