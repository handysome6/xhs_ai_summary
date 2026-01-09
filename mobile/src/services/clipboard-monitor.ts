/**
 * Clipboard monitoring service
 * Handles automatic clipboard detection on app launch and foreground transitions
 */
import * as Clipboard from 'expo-clipboard';
import { Platform } from 'react-native';
import { validateXhsUrl } from '../utils/url-validator';
import { CLIPBOARD_CONFIG } from '../utils/constants';
import {
  createClipboardCheck,
} from '../db/repositories/clipboard-check-repository';
import {
  isUrlRecentlyHandled,
  upsertIgnoredUrl,
} from '../db/repositories/ignored-url-repository';
import { ClipboardActionType } from '../models/clipboard-check';

/**
 * Result of clipboard check
 */
export interface ClipboardCheckResult {
  /**
   * Whether a prompt should be shown
   */
  shouldPrompt: boolean;

  /**
   * The detected URL (if valid)
   */
  url: string | null;

  /**
   * URL hash for deduplication
   */
  urlHash: string | null;

  /**
   * Reason why prompt should not be shown (if applicable)
   */
  reason: 'empty' | 'invalid' | 'duplicate' | null;
}

/**
 * Last clipboard content hash to prevent duplicate checks
 */
let lastClipboardHash: string | null = null;

/**
 * Debounce timer for clipboard checks
 */
let checkDebounceTimer: NodeJS.Timeout | null = null;

/**
 * Check clipboard for new XHS share links
 * @returns Result indicating whether to show prompt
 */
export async function checkClipboard(): Promise<ClipboardCheckResult> {
  const startTime = Date.now();

  try {
    // Check if clipboard monitoring is enabled
    if (!CLIPBOARD_CONFIG.ENABLED) {
      return {
        shouldPrompt: false,
        url: null,
        urlHash: null,
        reason: null,
      };
    }

    // iOS 14+ permission check
    if (Platform.OS === 'ios' && typeof Platform.Version === 'string' && parseInt(Platform.Version, 10) >= 14) {
      const hasPermission = await Clipboard.hasStringAsync();
      if (!hasPermission) {
        if (__DEV__) {
          console.log('[ClipboardMonitor] iOS clipboard permission not granted');
        }
        return {
          shouldPrompt: false,
          url: null,
          urlHash: null,
          reason: null,
        };
      }
    }

    // Read clipboard content
    const clipboardContent = await Clipboard.getStringAsync();

    // Check if clipboard is empty
    if (!clipboardContent || clipboardContent.trim() === '') {
      await recordCheck({
        action: 'ignored_empty',
        clipboardContent: null,
      });
      return {
        shouldPrompt: false,
        url: null,
        urlHash: null,
        reason: 'empty',
      };
    }

    // Validate URL
    const validation = await validateXhsUrl(clipboardContent);

    // Check if URL is invalid
    if (!validation.isValid || !validation.normalizedUrl || !validation.urlHash) {
      await recordCheck({
        action: 'ignored_invalid',
        clipboardContent,
        url: clipboardContent,
      });
      return {
        shouldPrompt: false,
        url: null,
        urlHash: null,
        reason: 'invalid',
      };
    }

    // Check deduplication (5-minute window)
    const isDuplicate = await isUrlRecentlyHandled(validation.urlHash);
    if (isDuplicate) {
      await recordCheck({
        action: 'ignored_duplicate',
        clipboardContent,
        url: validation.normalizedUrl,
        urlHash: validation.urlHash,
        isValid: true,
      });
      return {
        shouldPrompt: false,
        url: validation.normalizedUrl,
        urlHash: validation.urlHash,
        reason: 'duplicate',
      };
    }

    // Valid, new URL - should prompt
    await recordCheck({
      action: 'prompted',
      clipboardContent,
      url: validation.normalizedUrl,
      urlHash: validation.urlHash,
      isValid: true,
    });

    // Log performance
    const duration = Date.now() - startTime;
    if (__DEV__) {
      console.log(`[ClipboardMonitor] Check completed in ${duration}ms`);
      if (duration > CLIPBOARD_CONFIG.CLIPBOARD_READ_TIMEOUT_MS) {
        console.warn(`[ClipboardMonitor] Check exceeded ${CLIPBOARD_CONFIG.CLIPBOARD_READ_TIMEOUT_MS}ms budget!`);
      }
    }

    return {
      shouldPrompt: true,
      url: validation.normalizedUrl,
      urlHash: validation.urlHash,
      reason: null,
    };
  } catch (error) {
    // Log error without displaying to user
    if (__DEV__) {
      console.error('[ClipboardMonitor] Error checking clipboard:', error);
    }
    return {
      shouldPrompt: false,
      url: null,
      urlHash: null,
      reason: null,
    };
  }
}

/**
 * Record clipboard check event for analytics
 */
async function recordCheck(params: {
  action: ClipboardActionType;
  clipboardContent: string | null;
  url?: string;
  urlHash?: string;
  isValid?: boolean;
}): Promise<void> {
  try {
    // Hash clipboard content for privacy (first 200 chars only)
    const contentPreview = params.clipboardContent
      ? params.clipboardContent.slice(0, 200)
      : null;

    await createClipboardCheck({
      clipboardContentPreview: contentPreview ?? undefined,
      actionTaken: params.action,
      urlDetected: params.url,
      urlHash: params.urlHash,
      isValidUrl: params.isValid ?? false,
    });
  } catch (error) {
    // Silently fail - analytics should not block functionality
    if (__DEV__) {
      console.error('[ClipboardMonitor] Failed to record check:', error);
    }
  }
}

/**
 * Mark URL as dismissed by user
 */
export async function markUrlAsDismissed(
  url: string,
  urlHash: string
): Promise<void> {
  await upsertIgnoredUrl({
    url,
    urlHash,
    action: 'dismissed',
  });
}

/**
 * Mark URL as saved by user
 */
export async function markUrlAsSaved(
  url: string,
  urlHash: string
): Promise<void> {
  await upsertIgnoredUrl({
    url,
    urlHash,
    action: 'saved',
  });
}

/**
 * Check clipboard with debouncing
 * Prevents rapid repeated checks on multiple state transitions
 */
export async function checkClipboardDebounced(): Promise<ClipboardCheckResult | null> {
  return new Promise((resolve) => {
    // Clear existing timer
    if (checkDebounceTimer) {
      clearTimeout(checkDebounceTimer);
    }

    // Set new timer
    checkDebounceTimer = setTimeout(async () => {
      const result = await checkClipboard();
      resolve(result);
    }, CLIPBOARD_CONFIG.DEBOUNCE_MS);
  });
}

/**
 * Initialize clipboard monitoring
 * Called on app startup
 */
export function initializeClipboardMonitoring(): void {
  if (__DEV__) {
    console.log('[ClipboardMonitor] Initialized with config:', {
      enabled: CLIPBOARD_CONFIG.ENABLED,
      debounceMs: CLIPBOARD_CONFIG.DEBOUNCE_MS,
      deduplicationWindowMs: CLIPBOARD_CONFIG.DEDUPLICATION_WINDOW_MS,
    });
  }
}
