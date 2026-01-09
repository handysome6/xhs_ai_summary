/**
 * Ignored URL model
 *
 * Represents a URL that user has dismissed or saved, used for 5-minute deduplication window.
 * Prevents repeated prompts for the same URL.
 */

/**
 * Action that caused URL to be ignored
 */
export type IgnoredUrlAction =
  | 'dismissed'  // User dismissed the prompt
  | 'saved';     // User added to library

/**
 * Ignored URL entry (for deduplication)
 */
export interface IgnoredUrl {
  /**
   * Unique identifier (UUID)
   */
  id: string;

  /**
   * The full normalized URL
   */
  url: string;

  /**
   * SHA-256 hash of normalized URL
   */
  urlHash: string;

  /**
   * Action user took
   */
  action: IgnoredUrlAction;

  /**
   * When action occurred (Unix timestamp in milliseconds)
   */
  createdAt: number;

  /**
   * When entry expires (Unix timestamp in milliseconds)
   * @default createdAt + 5 minutes
   */
  expiresAt: number;
}

/**
 * Input for creating ignored URL entry
 */
export interface CreateIgnoredUrlInput {
  /**
   * The URL to ignore
   */
  url: string;

  /**
   * SHA-256 hash of the URL
   */
  urlHash: string;

  /**
   * Action taken
   */
  action: IgnoredUrlAction;

  /**
   * Optional custom expiration time (milliseconds from now)
   * @default 300000 (5 minutes)
   */
  expirationMs?: number;
}
