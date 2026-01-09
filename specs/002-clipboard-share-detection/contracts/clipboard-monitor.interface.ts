/**
 * Clipboard Monitor Service Interface
 *
 * Defines the contract for clipboard monitoring functionality including
 * lifecycle hooks, deduplication logic, and clipboard content processing.
 */

/**
 * Configuration for clipboard monitoring behavior
 */
export interface ClipboardMonitorConfig {
  /**
   * Enable/disable clipboard monitoring globally
   * @default true
   */
  enabled: boolean;

  /**
   * Minimum time between clipboard checks (milliseconds)
   * Prevents redundant checks during rapid app state changes
   * @default 1000
   */
  debounceMs: number;

  /**
   * Deduplication window in milliseconds
   * @default 300000 (5 minutes)
   */
  deduplicationWindowMs: number;

  /**
   * Maximum length for clipboard content preview in logs
   * @default 100
   */
  previewMaxLength: number;

  /**
   * Timeout for clipboard read operations (milliseconds)
   * @default 2000
   */
  clipboardReadTimeoutMs: number;
}

/**
 * Result of clipboard monitoring check
 */
export interface ClipboardCheckResult {
  /**
   * Whether a valid XHS URL was detected
   */
  urlDetected: boolean;

  /**
   * The detected URL (if any)
   */
  url: string | null;

  /**
   * SHA-256 hash of the normalized URL
   */
  urlHash: string | null;

  /**
   * Action taken by the monitor
   */
  action: ClipboardMonitorAction;

  /**
   * Whether the URL should trigger a prompt
   */
  shouldPrompt: boolean;

  /**
   * Reason why prompt was not shown (if applicable)
   */
  skipReason: ClipboardSkipReason | null;
}

/**
 * Actions taken by clipboard monitor
 */
export type ClipboardMonitorAction =
  | 'prompted'          // Valid URL, shown prompt to user
  | 'ignored_empty'     // Clipboard was empty
  | 'ignored_invalid'   // Content was not a valid XHS URL
  | 'ignored_duplicate' // URL already handled within dedup window
  | 'ignored_permission'; // Clipboard permission denied (iOS 14+)

/**
 * Reasons for skipping clipboard prompt
 */
export type ClipboardSkipReason =
  | 'empty_clipboard'
  | 'invalid_url'
  | 'non_xhs_url'
  | 'recently_dismissed'
  | 'recently_saved'
  | 'permission_denied';

/**
 * Clipboard monitor service interface
 */
export interface IClipboardMonitor {
  /**
   * Check clipboard and process content if valid
   * Called on app launch (cold start) and foreground transitions
   *
   * @returns Result of clipboard check
   */
  checkClipboard(): Promise<ClipboardCheckResult>;

  /**
   * Check if a URL is in the deduplication window
   *
   * @param urlHash - SHA-256 hash of normalized URL
   * @returns True if URL was recently handled (dismissed or saved)
   */
  isRecentlyHandled(urlHash: string): Promise<boolean>;

  /**
   * Mark a URL as ignored (user dismissed prompt)
   * Adds entry to deduplication table with 5-minute expiration
   *
   * @param url - The URL that was dismissed
   * @param urlHash - SHA-256 hash of the URL
   */
  markAsIgnored(url: string, urlHash: string): Promise<void>;

  /**
   * Mark a URL as saved (user added to library)
   * Adds entry to deduplication table with 5-minute expiration
   *
   * @param url - The URL that was saved
   * @param urlHash - SHA-256 hash of the URL
   */
  markAsSaved(url: string, urlHash: string): Promise<void>;

  /**
   * Update configuration
   *
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<ClipboardMonitorConfig>): void;

  /**
   * Get current configuration
   */
  getConfig(): ClipboardMonitorConfig;

  /**
   * Enable clipboard monitoring
   */
  enable(): void;

  /**
   * Disable clipboard monitoring
   */
  disable(): void;

  /**
   * Clean up expired deduplication entries
   * Should be called periodically (e.g., every 10 minutes)
   *
   * @returns Number of expired entries removed
   */
  cleanupExpiredEntries(): Promise<number>;
}

/**
 * Clipboard content validation result
 */
export interface ClipboardValidationResult {
  /**
   * Whether clipboard contains text content
   */
  hasContent: boolean;

  /**
   * Raw clipboard content (if text)
   */
  content: string | null;

  /**
   * Whether content is a valid URL
   */
  isValidUrl: boolean;

  /**
   * Whether URL matches XHS patterns
   */
  isXhsUrl: boolean;

  /**
   * Normalized URL (if valid XHS URL)
   */
  normalizedUrl: string | null;

  /**
   * URL hash (SHA-256 of normalized URL)
   */
  urlHash: string | null;

  /**
   * Error message (if validation failed)
   */
  error: string | null;
}
