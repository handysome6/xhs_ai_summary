/**
 * Clipboard Prompt UI Interface
 *
 * Defines the contract for the clipboard detection prompt modal,
 * including state management, user actions, and offline indicators.
 */

/**
 * State for clipboard prompt modal
 */
export interface ClipboardPromptState {
  /**
   * Whether the prompt is currently visible
   */
  visible: boolean;

  /**
   * The URL detected in clipboard
   */
  url: string | null;

  /**
   * URL hash for deduplication tracking
   */
  urlHash: string | null;

  /**
   * Whether the device is currently offline
   */
  isOffline: boolean;

  /**
   * Whether the "Add to Library" action is in progress
   */
  isLoading: boolean;

  /**
   * Error message if save failed
   */
  error: string | null;
}

/**
 * Actions for clipboard prompt
 */
export interface ClipboardPromptActions {
  /**
   * Show the clipboard prompt with detected URL
   *
   * @param url - The URL to display
   * @param urlHash - SHA-256 hash of the URL
   * @param isOffline - Whether device is offline
   */
  showPrompt(url: string, urlHash: string, isOffline: boolean): void;

  /**
   * Hide the clipboard prompt
   */
  hidePrompt(): void;

  /**
   * Handle "Add to Library" button press
   * Saves URL to database and marks as saved for deduplication
   */
  handleAddToLibrary(): Promise<void>;

  /**
   * Handle "Dismiss" button press or backdrop tap
   * Marks URL as ignored for deduplication
   */
  handleDismiss(): Promise<void>;

  /**
   * Update offline status
   *
   * @param isOffline - New offline status
   */
  updateOfflineStatus(isOffline: boolean): void;

  /**
   * Clear any error messages
   */
  clearError(): void;
}

/**
 * Props for ClipboardPrompt component
 */
export interface ClipboardPromptProps {
  /**
   * Whether the modal is visible
   */
  visible: boolean;

  /**
   * The URL to display (truncated to 100 chars in UI)
   */
  url: string;

  /**
   * Whether device is offline
   * Shows visual indicator and "will sync later" message
   */
  isOffline: boolean;

  /**
   * Whether save operation is in progress
   */
  isLoading: boolean;

  /**
   * Error message to display (if any)
   */
  error: string | null;

  /**
   * Callback when user taps "Add to Library"
   */
  onAdd: () => Promise<void> | void;

  /**
   * Callback when user dismisses the prompt
   */
  onDismiss: () => Promise<void> | void;

  /**
   * Optional callback when modal is fully closed
   */
  onClose?: () => void;
}

/**
 * Result of user action on clipboard prompt
 */
export interface ClipboardPromptResult {
  /**
   * Action taken by user
   */
  action: 'added' | 'dismissed';

  /**
   * The URL that was handled
   */
  url: string;

  /**
   * URL hash for tracking
   */
  urlHash: string;

  /**
   * Whether action succeeded
   */
  success: boolean;

  /**
   * Error message if action failed
   */
  error: string | null;

  /**
   * Whether URL was saved offline (will sync later)
   */
  savedOffline?: boolean;
}

/**
 * Zustand store interface for clipboard prompt state
 */
export interface ClipboardPromptStore extends ClipboardPromptState, ClipboardPromptActions {
  // Combined state and actions for Zustand store
}

/**
 * Configuration for clipboard prompt UI
 */
export interface ClipboardPromptConfig {
  /**
   * Maximum URL length to display (chars)
   * Longer URLs are truncated with ellipsis
   * @default 100
   */
  maxUrlDisplayLength: number;

  /**
   * Animation duration for modal transitions (ms)
   * @default 300
   */
  animationDuration: number;

  /**
   * Whether to allow dismissal via backdrop tap
   * @default true
   */
  allowBackdropDismiss: boolean;

  /**
   * Whether to show offline indicator
   * @default true
   */
  showOfflineIndicator: boolean;

  /**
   * Duration to show success toast after adding (ms)
   * @default 2000
   */
  successToastDuration: number;
}

/**
 * Offline queue entry for links saved without connectivity
 */
export interface OfflineSyncQueueEntry {
  /**
   * Unique ID for queue entry
   */
  id: string;

  /**
   * The URL to sync
   */
  url: string;

  /**
   * URL hash
   */
  urlHash: string;

  /**
   * When entry was created (Unix timestamp)
   */
  createdAt: number;

  /**
   * Number of sync attempts made
   */
  retryCount: number;

  /**
   * Sync status
   */
  status: 'pending' | 'syncing' | 'synced' | 'failed';

  /**
   * Error message if sync failed
   */
  error: string | null;
}
