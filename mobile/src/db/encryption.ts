/**
 * SQLite encryption configuration
 * Uses expo-secure-store for key management
 *
 * Note: expo-sqlite doesn't natively support encryption.
 * This module prepares for SQLCipher integration when needed.
 * For now, it manages encryption keys securely for future use.
 */
import * as SecureStore from 'expo-secure-store';

/**
 * Secure store keys
 */
const ENCRYPTION_KEY_STORE_KEY = 'xhs_db_encryption_key';

/**
 * Generate a random encryption key
 */
function generateEncryptionKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const keyLength = 32;
  let key = '';

  for (let i = 0; i < keyLength; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return key;
}

/**
 * Get or create the database encryption key
 * Stored securely in the device's secure storage
 */
export async function getEncryptionKey(): Promise<string> {
  try {
    // Try to get existing key
    let key = await SecureStore.getItemAsync(ENCRYPTION_KEY_STORE_KEY);

    if (!key) {
      // Generate new key if none exists
      key = generateEncryptionKey();
      await SecureStore.setItemAsync(ENCRYPTION_KEY_STORE_KEY, key, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    }

    return key;
  } catch (error) {
    console.error('Failed to get/create encryption key:', error);
    throw new Error('Unable to access secure storage for encryption key');
  }
}

/**
 * Check if encryption key exists
 */
export async function hasEncryptionKey(): Promise<boolean> {
  try {
    const key = await SecureStore.getItemAsync(ENCRYPTION_KEY_STORE_KEY);
    return key !== null;
  } catch {
    return false;
  }
}

/**
 * Delete encryption key (for testing/reset)
 * WARNING: This will make encrypted data unreadable
 */
export async function deleteEncryptionKey(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(ENCRYPTION_KEY_STORE_KEY);
  } catch (error) {
    console.error('Failed to delete encryption key:', error);
  }
}

/**
 * Encryption configuration for future SQLCipher integration
 */
export interface EncryptionConfig {
  enabled: boolean;
  algorithm: string;
  keyDerivation: string;
}

/**
 * Default encryption configuration
 * Ready for SQLCipher when integrated
 */
export const DEFAULT_ENCRYPTION_CONFIG: EncryptionConfig = {
  enabled: false, // Set to true when SQLCipher is integrated
  algorithm: 'AES-256-CBC',
  keyDerivation: 'PBKDF2',
};

/**
 * Encryption status for app diagnostics
 */
export interface EncryptionStatus {
  keyExists: boolean;
  encryptionEnabled: boolean;
  algorithm: string;
}

/**
 * Get encryption status for diagnostics
 */
export async function getEncryptionStatus(): Promise<EncryptionStatus> {
  const keyExists = await hasEncryptionKey();

  return {
    keyExists,
    encryptionEnabled: DEFAULT_ENCRYPTION_CONFIG.enabled,
    algorithm: DEFAULT_ENCRYPTION_CONFIG.algorithm,
  };
}
