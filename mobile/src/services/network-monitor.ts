/**
 * Network monitoring service
 * Detects network connectivity status for offline support
 */
import * as Network from 'expo-network';

/**
 * Network status
 */
export interface NetworkStatus {
  /**
   * Whether device is connected to network
   */
  isConnected: boolean;

  /**
   * Whether internet is actually reachable (not just connected to WiFi)
   */
  isInternetReachable: boolean;

  /**
   * Network type (wifi, cellular, etc.)
   */
  type: Network.NetworkStateType | null;
}

/**
 * Network status change listener
 */
export type NetworkStatusListener = (status: NetworkStatus) => void;

/**
 * Registered listeners
 */
const listeners: Set<NetworkStatusListener> = new Set();

/**
 * Current network status (cached)
 */
let currentStatus: NetworkStatus = {
  isConnected: true,
  isInternetReachable: true,
  type: null,
};

/**
 * Get current network status
 */
export async function getNetworkStatus(): Promise<NetworkStatus> {
  try {
    const networkState = await Network.getNetworkStateAsync();

    const status: NetworkStatus = {
      isConnected: networkState.isConnected ?? false,
      isInternetReachable: networkState.isInternetReachable ?? false,
      type: networkState.type,
    };

    // Update cached status
    currentStatus = status;

    return status;
  } catch (error) {
    if (__DEV__) {
      console.error('[NetworkMonitor] Error getting network status:', error);
    }
    // Return cached status on error
    return currentStatus;
  }
}

/**
 * Get cached network status (synchronous)
 * Note: May be stale, use getNetworkStatus() for fresh status
 */
export function getCachedNetworkStatus(): NetworkStatus {
  return currentStatus;
}

/**
 * Check if device is online
 */
export async function isOnline(): Promise<boolean> {
  const status = await getNetworkStatus();
  return status.isConnected && status.isInternetReachable;
}

/**
 * Check if device is offline
 */
export async function isOffline(): Promise<boolean> {
  return !(await isOnline());
}

/**
 * Add listener for network status changes
 * @returns Cleanup function to remove listener
 */
export function addNetworkListener(listener: NetworkStatusListener): () => void {
  listeners.add(listener);

  // Return cleanup function
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Notify all listeners of status change
 */
function notifyListeners(status: NetworkStatus): void {
  listeners.forEach((listener) => {
    try {
      listener(status);
    } catch (error) {
      if (__DEV__) {
        console.error('[NetworkMonitor] Error in listener:', error);
      }
    }
  });
}

/**
 * Start monitoring network status
 * Polls network status and notifies listeners on changes
 */
let monitoringInterval: NodeJS.Timeout | null = null;

export function startNetworkMonitoring(intervalMs: number = 5000): void {
  // Stop existing monitoring if any
  stopNetworkMonitoring();

  if (__DEV__) {
    console.log(`[NetworkMonitor] Starting monitoring (interval: ${intervalMs}ms)`);
  }

  // Initial check
  getNetworkStatus().then((status) => {
    if (__DEV__) {
      console.log('[NetworkMonitor] Initial status:', status);
    }
  });

  // Poll for changes
  monitoringInterval = setInterval(async () => {
    const newStatus = await getNetworkStatus();

    // Check if status changed
    if (
      newStatus.isConnected !== currentStatus.isConnected ||
      newStatus.isInternetReachable !== currentStatus.isInternetReachable
    ) {
      if (__DEV__) {
        console.log('[NetworkMonitor] Status changed:', newStatus);
      }
      currentStatus = newStatus;
      notifyListeners(newStatus);
    }
  }, intervalMs);
}

/**
 * Stop monitoring network status
 */
export function stopNetworkMonitoring(): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    if (__DEV__) {
      console.log('[NetworkMonitor] Monitoring stopped');
    }
  }
}

/**
 * Initialize network monitoring
 * Called on app startup
 */
export async function initializeNetworkMonitoring(): Promise<void> {
  // Get initial status
  await getNetworkStatus();

  // Start monitoring
  startNetworkMonitoring();

  if (__DEV__) {
    console.log('[NetworkMonitor] Initialized');
  }
}
