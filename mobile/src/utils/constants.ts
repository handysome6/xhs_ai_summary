/**
 * Application constants
 */

// API Configuration
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';

// XHS URL Patterns
export const XHS_URL_PATTERNS = {
  FULL_URL: /^https?:\/\/(www\.)?xiaohongshu\.com\/explore\/[\w-]+/,
  SHORT_URL: /^https?:\/\/xhslink\.com\/[\w-]+/,
  DISCOVERY_URL: /^https?:\/\/(www\.)?xiaohongshu\.com\/discovery\/item\/[\w-]+/,
};

// Download limits
export const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
export const MAX_RETRY_COUNT = 3;
export const RETRY_DELAY_MS = 5000;

// Storage paths
export const POSTS_DIRECTORY = 'posts';
export const MEDIA_DIRECTORY = 'media';
export const CACHE_DIRECTORY = 'cache';

// UI Constants
export const POST_CARD_HEIGHT = 120;
export const THUMBNAIL_SIZE = 80;

// Download task statuses
export const DOWNLOAD_STATUS = {
  PENDING: 'pending',
  DOWNLOADING: 'downloading',
  COMPLETED: 'completed',
  PARTIAL: 'partial',
  FAILED: 'failed',
} as const;

// Task statuses
export const TASK_STATUS = {
  QUEUED: 'queued',
  CRAWLING: 'crawling',
  DOWNLOADING: 'downloading',
  ANALYZING: 'analyzing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

// Media types
export const MEDIA_TYPE = {
  IMAGE: 'image',
  VIDEO: 'video',
} as const;

// Content types for AI classification
export const CONTENT_TYPE = {
  TUTORIAL: 'tutorial',
  REVIEW: 'review',
  LIFESTYLE: 'lifestyle',
  TRAVEL: 'travel',
  FOOD: 'food',
  FASHION: 'fashion',
  OTHER: 'other',
} as const;
