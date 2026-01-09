/**
 * Clipboard store - Zustand store for clipboard prompt state management
 */
import { create } from 'zustand';
import { handleSharedUrl, ShareResult } from '../services/share-handler';
import { getNetworkStatus } from '../services/network-monitor';
import {
  markUrlAsDismissed,
  markUrlAsSaved,
} from '../services/clipboard-monitor';

/**
 * Clipboard prompt data
 */
export interface ClipboardPromptData {
  /**
   * The detected URL
   */
  url: string;

  /**
   * URL hash for deduplication
   */
  urlHash: string;

  /**
   * Whether device is offline
   */
  isOffline: boolean;
}

/**
 * Clipboard store state
 */
interface ClipboardState {
  /**
   * Whether prompt is currently visible
   */
  isVisible: boolean;

  /**
   * Current prompt data (null when not showing)
   */
  promptData: ClipboardPromptData | null;

  /**
   * Last save result for showing confirmation
   */
  lastSaveResult: ShareResult | null;

  /**
   * Whether save operation is in progress
   */
  isSaving: boolean;
}

/**
 * Clipboard store actions
 */
interface ClipboardActions {
  /**
   * Show clipboard prompt with detected URL
   */
  showPrompt: (url: string, urlHash: string) => Promise<void>;

  /**
   * Handle "Add to Library" action
   */
  handleAddToLibrary: () => Promise<void>;

  /**
   * Handle "Dismiss" action
   */
  handleDismiss: () => Promise<void>;

  /**
   * Close prompt and clear state
   */
  closePrompt: () => void;

  /**
   * Clear last save result
   */
  clearSaveResult: () => void;
}

/**
 * Combined clipboard store type
 */
type ClipboardStore = ClipboardState & ClipboardActions;

/**
 * Create clipboard store
 */
export const useClipboardStore = create<ClipboardStore>((set, get) => ({
  // Initial state
  isVisible: false,
  promptData: null,
  lastSaveResult: null,
  isSaving: false,

  // Show clipboard prompt
  showPrompt: async (url: string, urlHash: string) => {
    try {
      // Check network status
      const networkStatus = await getNetworkStatus();
      const isOffline = !networkStatus.isConnected || !networkStatus.isInternetReachable;

      set({
        isVisible: true,
        promptData: {
          url,
          urlHash,
          isOffline,
        },
      });

      if (__DEV__) {
        console.log('[ClipboardStore] Showing prompt for URL:', url, { isOffline });
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[ClipboardStore] Error showing prompt:', error);
      }
    }
  },

  // Handle "Add to Library" action
  handleAddToLibrary: async () => {
    const { promptData } = get();
    if (!promptData) return;

    set({ isSaving: true });

    try {
      // Add URL to library using existing share handler
      const result = await handleSharedUrl(promptData.url);

      // Mark URL as saved for deduplication
      await markUrlAsSaved(promptData.url, promptData.urlHash);

      // Store result for confirmation display
      set({
        isVisible: false,
        lastSaveResult: result,
        isSaving: false,
        promptData: null,
      });

      if (__DEV__) {
        console.log('[ClipboardStore] Add to library result:', result);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[ClipboardStore] Error adding to library:', error);
      }

      // Show error result
      set({
        isVisible: false,
        lastSaveResult: {
          success: false,
          post: null,
          isDuplicate: false,
          errorMessage: error instanceof Error ? error.message : 'Failed to save link',
        },
        isSaving: false,
        promptData: null,
      });
    }
  },

  // Handle "Dismiss" action
  handleDismiss: async () => {
    const { promptData } = get();
    if (!promptData) return;

    try {
      // Mark URL as dismissed for deduplication
      await markUrlAsDismissed(promptData.url, promptData.urlHash);

      // Close prompt
      set({
        isVisible: false,
        promptData: null,
      });

      if (__DEV__) {
        console.log('[ClipboardStore] Prompt dismissed for URL:', promptData.url);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[ClipboardStore] Error dismissing prompt:', error);
      }

      // Close anyway even if marking failed
      set({
        isVisible: false,
        promptData: null,
      });
    }
  },

  // Close prompt without marking
  closePrompt: () => {
    set({
      isVisible: false,
      promptData: null,
    });
  },

  // Clear last save result
  clearSaveResult: () => {
    set({ lastSaveResult: null });
  },
}));

/**
 * Hook for clipboard prompt
 */
export function useClipboardPrompt() {
  const isVisible = useClipboardStore((state) => state.isVisible);
  const promptData = useClipboardStore((state) => state.promptData);
  const isSaving = useClipboardStore((state) => state.isSaving);
  const showPrompt = useClipboardStore((state) => state.showPrompt);
  const handleAddToLibrary = useClipboardStore((state) => state.handleAddToLibrary);
  const handleDismiss = useClipboardStore((state) => state.handleDismiss);
  const closePrompt = useClipboardStore((state) => state.closePrompt);

  return {
    isVisible,
    promptData,
    isSaving,
    showPrompt,
    handleAddToLibrary,
    handleDismiss,
    closePrompt,
  };
}

/**
 * Hook for clipboard save result
 */
export function useClipboardSaveResult() {
  const lastSaveResult = useClipboardStore((state) => state.lastSaveResult);
  const clearSaveResult = useClipboardStore((state) => state.clearSaveResult);

  return {
    lastSaveResult,
    clearSaveResult,
  };
}
