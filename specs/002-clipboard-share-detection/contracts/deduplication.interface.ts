/**
 * Deduplication Service Interface
 *
 * Defines contracts for clipboard check tracking and ignored URL management
 * to implement the 5-minute deduplication window.
 */

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
 * Type of action taken during clipboard check
 */
export type ClipboardActionType =
  | 'prompted'           // Valid URL, showed prompt to user
  | 'ignored_invalid'    // Not a valid URL or non-XHS URL
  | 'ignored_duplicate'  // URL in deduplication window
  | 'ignored_empty';     // Clipboard was empty

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
 * Repository interface for clipboard checks
 */
export interface IClipboardCheckRepository {
  /**
   * Create a new clipboard check record
   *
   * @param input - Check details
   * @returns Created record
   */
  create(input: CreateClipboardCheckInput): Promise<ClipboardCheck>;

  /**
   * Get clipboard checks within time range
   *
   * @param startTime - Start of range (Unix timestamp)
   * @param endTime - End of range (Unix timestamp)
   * @param limit - Max records to return
   * @returns Array of clipboard checks
   */
  getInTimeRange(
    startTime: number,
    endTime: number,
    limit?: number
  ): Promise<ClipboardCheck[]>;

  /**
   * Get clipboard checks by action type
   *
   * @param actionType - Filter by action
   * @param limit - Max records to return
   * @returns Array of matching checks
   */
  getByAction(
    actionType: ClipboardActionType,
    limit?: number
  ): Promise<ClipboardCheck[]>;

  /**
   * Get statistics for clipboard checks
   *
   * @param since - Start time for stats (Unix timestamp)
   * @returns Statistics summary
   */
  getStatistics(since: number): Promise<ClipboardCheckStatistics>;

  /**
   * Delete clipboard checks older than specified time
   *
   * @param beforeTime - Delete records before this time
   * @returns Number of records deleted
   */
  deleteOlderThan(beforeTime: number): Promise<number>;
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
   * When action occurred (Unix timestamp)
   */
  createdAt: number;

  /**
   * When entry expires (Unix timestamp)
   * @default createdAt + 5 minutes
   */
  expiresAt: number;
}

/**
 * Action that caused URL to be ignored
 */
export type IgnoredUrlAction =
  | 'dismissed'  // User dismissed the prompt
  | 'saved';     // User added to library

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

/**
 * Repository interface for ignored URLs
 */
export interface IIgnoredUrlRepository {
  /**
   * Create or update ignored URL entry (upsert)
   * Uses url_hash as unique key
   *
   * @param input - Ignored URL details
   * @returns Created/updated record
   */
  upsert(input: CreateIgnoredUrlInput): Promise<IgnoredUrl>;

  /**
   * Check if URL hash is in deduplication window
   *
   * @param urlHash - SHA-256 hash to check
   * @returns True if URL was recently handled
   */
  isRecentlyHandled(urlHash: string): Promise<boolean>;

  /**
   * Get ignored URL entry by hash (if not expired)
   *
   * @param urlHash - URL hash to lookup
   * @returns Ignored URL entry or null if not found/expired
   */
  getByHash(urlHash: string): Promise<IgnoredUrl | null>;

  /**
   * Get all active ignored URLs (not expired)
   *
   * @param limit - Max records to return
   * @returns Array of active ignored URLs
   */
  getAllActive(limit?: number): Promise<IgnoredUrl[]>;

  /**
   * Delete expired ignored URL entries
   *
   * @returns Number of entries deleted
   */
  deleteExpired(): Promise<number>;

  /**
   * Get count of active ignored URLs by action
   *
   * @returns Counts by action type
   */
  getCountsByAction(): Promise<Record<IgnoredUrlAction, number>>;

  /**
   * Delete ignored URL by hash
   *
   * @param urlHash - URL hash to delete
   * @returns True if deleted, false if not found
   */
  deleteByHash(urlHash: string): Promise<boolean>;
}

/**
 * Deduplication service combining both repositories
 */
export interface IDeduplicationService {
  /**
   * Record a clipboard check event
   */
  recordCheck(input: CreateClipboardCheckInput): Promise<ClipboardCheck>;

  /**
   * Check if URL should be deduplicated
   *
   * @param urlHash - URL hash to check
   * @returns Object with deduplication status and reason
   */
  shouldDeduplicate(urlHash: string): Promise<DeduplicationCheckResult>;

  /**
   * Mark URL as dismissed by user
   *
   * @param url - The URL
   * @param urlHash - URL hash
   */
  markAsDismissed(url: string, urlHash: string): Promise<void>;

  /**
   * Mark URL as saved by user
   *
   * @param url - The URL
   * @param urlHash - URL hash
   */
  markAsSaved(url: string, urlHash: string): Promise<void>;

  /**
   * Perform cleanup of expired entries
   *
   * @returns Cleanup summary
   */
  cleanup(): Promise<DeduplicationCleanupResult>;

  /**
   * Get analytics for clipboard monitoring
   *
   * @param timeRangeMs - Time range in milliseconds
   * @returns Analytics summary
   */
  getAnalytics(timeRangeMs: number): Promise<DeduplicationAnalytics>;
}

/**
 * Result of deduplication check
 */
export interface DeduplicationCheckResult {
  /**
   * Whether URL should be deduplicated (not shown)
   */
  shouldDeduplicate: boolean;

  /**
   * Reason for deduplication (if applicable)
   */
  reason: 'dismissed' | 'saved' | null;

  /**
   * When the URL was originally handled
   */
  originalTimestamp: number | null;

  /**
   * When deduplication expires
   */
  expiresAt: number | null;
}

/**
 * Result of cleanup operation
 */
export interface DeduplicationCleanupResult {
  /**
   * Number of expired ignored URLs deleted
   */
  ignoredUrlsDeleted: number;

  /**
   * Number of old clipboard checks deleted
   */
  clipboardChecksDeleted: number;

  /**
   * Total cleanup duration (milliseconds)
   */
  durationMs: number;
}

/**
 * Analytics summary for clipboard monitoring
 */
export interface DeduplicationAnalytics {
  /**
   * Time range covered (milliseconds)
   */
  timeRangeMs: number;

  /**
   * Clipboard check statistics
   */
  checks: ClipboardCheckStatistics;

  /**
   * Current active ignored URLs
   */
  activeIgnored: {
    total: number;
    dismissed: number;
    saved: number;
  };

  /**
   * Deduplication effectiveness
   */
  effectiveness: {
    /**
     * Percentage of checks that resulted in prompts
     */
    promptRate: number;

    /**
     * Percentage of checks that were deduplicated
     */
    deduplicationRate: number;

    /**
     * Average time between duplicate detections (milliseconds)
     */
    avgTimeBetweenDuplicates: number | null;
  };
}
