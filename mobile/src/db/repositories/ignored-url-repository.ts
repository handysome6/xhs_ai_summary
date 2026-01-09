/**
 * Ignored URL repository - CRUD operations for deduplication tracking
 */
import {
  getDatabase,
  generateId,
  getCurrentTimestamp,
  rowToObject,
  objectToRow,
} from '../repository';
import { TABLE_NAMES } from '../schema';
import { CLIPBOARD_CONFIG } from '../../utils/constants';
import {
  IgnoredUrl,
  CreateIgnoredUrlInput,
  IgnoredUrlAction,
} from '../../models/ignored-url';

/**
 * Create or update ignored URL entry (upsert)
 * Uses url_hash as unique key
 */
export async function upsertIgnoredUrl(
  input: CreateIgnoredUrlInput
): Promise<IgnoredUrl> {
  const db = await getDatabase();
  const now = getCurrentTimestamp();
  const expirationMs = input.expirationMs ?? CLIPBOARD_CONFIG.DEDUPLICATION_WINDOW_MS;

  const ignoredUrl: IgnoredUrl = {
    id: generateId(),
    url: input.url,
    urlHash: input.urlHash,
    action: input.action,
    createdAt: now,
    expiresAt: now + expirationMs,
  };

  const row = objectToRow(ignoredUrl, 'ignoredUrls');

  // Use INSERT OR REPLACE for upsert behavior
  const columns = Object.keys(row);
  const placeholders = columns.map(() => '?').join(', ');
  const values = Object.values(row);

  await db.runAsync(
    `INSERT OR REPLACE INTO ${TABLE_NAMES.IGNORED_URLS} (${columns.join(', ')}) VALUES (${placeholders})`,
    values as (string | number | null)[]
  );

  return ignoredUrl;
}

/**
 * Check if URL hash is in deduplication window
 */
export async function isUrlRecentlyHandled(urlHash: string): Promise<boolean> {
  const db = await getDatabase();
  const now = getCurrentTimestamp();

  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT 1 as count FROM ${TABLE_NAMES.IGNORED_URLS} WHERE url_hash = ? AND expires_at > ? LIMIT 1`,
    [urlHash, now]
  );

  return !!result;
}

/**
 * Get ignored URL entry by hash (if not expired)
 */
export async function getIgnoredUrlByHash(
  urlHash: string
): Promise<IgnoredUrl | null> {
  const db = await getDatabase();
  const now = getCurrentTimestamp();

  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT * FROM ${TABLE_NAMES.IGNORED_URLS} WHERE url_hash = ? AND expires_at > ?`,
    [urlHash, now]
  );

  if (!row) return null;
  return rowToObject<IgnoredUrl>(row, 'ignoredUrls');
}

/**
 * Get all active ignored URLs (not expired)
 */
export async function getAllActiveIgnoredUrls(
  limit?: number
): Promise<IgnoredUrl[]> {
  const db = await getDatabase();
  const now = getCurrentTimestamp();

  let sql = `SELECT * FROM ${TABLE_NAMES.IGNORED_URLS} WHERE expires_at > ? ORDER BY created_at DESC`;
  const params: number[] = [now];

  if (limit) {
    sql += ' LIMIT ?';
    params.push(limit);
  }

  const rows = await db.getAllAsync<Record<string, unknown>>(sql, params);
  return rows.map((row) => rowToObject<IgnoredUrl>(row, 'ignoredUrls'));
}

/**
 * Delete expired ignored URL entries
 */
export async function deleteExpiredIgnoredUrls(): Promise<number> {
  const db = await getDatabase();
  const now = getCurrentTimestamp();

  const result = await db.runAsync(
    `DELETE FROM ${TABLE_NAMES.IGNORED_URLS} WHERE expires_at <= ?`,
    [now]
  );

  return result.changes;
}

/**
 * Get count of active ignored URLs by action
 */
export async function getIgnoredUrlCountsByAction(): Promise<
  Record<IgnoredUrlAction, number>
> {
  const db = await getDatabase();
  const now = getCurrentTimestamp();

  const rows = await db.getAllAsync<{ action: IgnoredUrlAction; count: number }>(
    `SELECT action, COUNT(*) as count FROM ${TABLE_NAMES.IGNORED_URLS} WHERE expires_at > ? GROUP BY action`,
    [now]
  );

  const counts: Record<IgnoredUrlAction, number> = {
    dismissed: 0,
    saved: 0,
  };

  rows.forEach((row) => {
    counts[row.action] = row.count;
  });

  return counts;
}

/**
 * Delete ignored URL by hash
 */
export async function deleteIgnoredUrlByHash(urlHash: string): Promise<boolean> {
  const db = await getDatabase();

  const result = await db.runAsync(
    `DELETE FROM ${TABLE_NAMES.IGNORED_URLS} WHERE url_hash = ?`,
    [urlHash]
  );

  return result.changes > 0;
}

/**
 * Get total count of active ignored URLs
 */
export async function getActiveIgnoredUrlCount(): Promise<number> {
  const db = await getDatabase();
  const now = getCurrentTimestamp();

  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM ${TABLE_NAMES.IGNORED_URLS} WHERE expires_at > ?`,
    [now]
  );

  return result?.count ?? 0;
}

/**
 * Delete all ignored URLs (for testing/reset)
 */
export async function deleteAllIgnoredUrls(): Promise<number> {
  const db = await getDatabase();

  const result = await db.runAsync(`DELETE FROM ${TABLE_NAMES.IGNORED_URLS}`);

  return result.changes;
}
