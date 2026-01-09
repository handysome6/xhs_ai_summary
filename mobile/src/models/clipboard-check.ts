/**
 * Clipboard check model
 *
 * Represents a clipboard monitoring event for analytics and debugging.
 * Tracks when clipboard was checked, what content was found, and action taken.
 */

/**
 * Type of action taken during clipboard check
 */
export type ClipboardActionType =
  | 'prompted'           // Valid URL, showed prompt to user
  | 'ignored_invalid'    // Not a valid URL or non-XHS URL
  | 'ignored_duplicate'  // URL in deduplication window
  | 'ignored_empty';     // Clipboard was empty

/**
 * Clipboard check record (for analytics/debugging)
 */
export interface ClipboardCheck {
  /**
   * Unique identifier (UUID)
   */
  id: string;

  /**
   * SHA-256 hash of clipboard content (null if empty)
   */
  clipboardContentHash: string | null;

  /**
   * First 100 chars of clipboard content (for debugging)
   */
  clipboardContentPreview: string | null;

  /**
   * Action taken by clipboard monitor
   */
  actionTaken: ClipboardActionType;

  /**
   * Detected URL (null if not a URL)
   */
  urlDetected: string | null;

  /**
   * SHA-256 hash of normalized URL (null if invalid)
   */
  urlHash: string | null;

  /**
   * Whether clipboard content was a valid URL
   */
  isValidUrl: boolean;

  /**
   * When check occurred (Unix timestamp in milliseconds)
   */
  createdAt: number;
}

/**
 * Input for creating clipboard check record
 */
export interface CreateClipboardCheckInput {
  /**
   * SHA-256 hash of clipboard content (optional)
   */
  clipboardContentHash?: string;

  /**
   * Preview of clipboard content (optional, max 200 chars)
   */
  clipboardContentPreview?: string;

  /**
   * Action taken
   */
  actionTaken: ClipboardActionType;

  /**
   * Detected URL (optional)
   */
  urlDetected?: string;

  /**
   * URL hash (optional)
   */
  urlHash?: string;

  /**
   * Whether content was valid URL
   * @default false
   */
  isValidUrl?: boolean;
}

/**
 * Statistics for clipboard check analytics
 */
export interface ClipboardCheckStatistics {
  /**
   * Total clipboard checks
   */
  totalChecks: number;

  /**
   * Number of prompts shown
   */
  promptsShown: number;

  /**
   * Number of invalid URLs detected
   */
  invalidUrls: number;

  /**
   * Number of duplicates prevented
   */
  duplicatesPrevented: number;

  /**
   * Number of empty clipboard checks
   */
  emptyChecks: number;

  /**
   * Percentage breakdown
   */
  percentages: {
    prompted: number;
    ignoredInvalid: number;
    ignoredDuplicate: number;
    ignoredEmpty: number;
  };
}
