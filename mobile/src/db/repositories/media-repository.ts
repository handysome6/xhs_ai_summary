/**
 * Media repository - CRUD operations for media files
 */
import {
  getDatabase,
  generateId,
  rowToObject,
  objectToRow,
} from '../repository';
import { TABLE_NAMES } from '../schema';
import { Media, CreateMediaInput, UpdateMediaInput, MediaDownloadStatus } from '../../models/media';

/**
 * Create media record
 */
export async function createMedia(input: CreateMediaInput): Promise<Media> {
  const db = await getDatabase();

  const media: Media = {
    id: generateId(),
    postId: input.postId,
    type: input.type,
    remoteUrl: input.remoteUrl,
    localPath: null,
    fileSize: input.fileSize ?? null,
    downloadStatus: 'pending',
    sortOrder: input.sortOrder,
  };

  const row = objectToRow(media, 'media');
  const columns = Object.keys(row);
  const placeholders = columns.map(() => '?').join(', ');
  const values = Object.values(row);

  await db.runAsync(
    `INSERT INTO ${TABLE_NAMES.MEDIA} (${columns.join(', ')}) VALUES (${placeholders})`,
    values as (string | number | null)[]
  );

  return media;
}

/**
 * Create multiple media records
 */
export async function createMediaBatch(inputs: CreateMediaInput[]): Promise<Media[]> {
  const results: Media[] = [];
  for (const input of inputs) {
    const media = await createMedia(input);
    results.push(media);
  }
  return results;
}

/**
 * Get media by ID
 */
export async function getMediaById(id: string): Promise<Media | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT * FROM ${TABLE_NAMES.MEDIA} WHERE id = ?`,
    [id]
  );

  if (!row) return null;
  return rowToObject<Media>(row, 'media');
}

/**
 * Get all media for a post
 */
export async function getMediaByPostId(postId: string): Promise<Media[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM ${TABLE_NAMES.MEDIA} WHERE post_id = ? ORDER BY sort_order ASC`,
    [postId]
  );

  return rows.map((row) => rowToObject<Media>(row, 'media'));
}

/**
 * Update media record
 */
export async function updateMedia(
  id: string,
  input: UpdateMediaInput
): Promise<Media | null> {
  const db = await getDatabase();

  const row = objectToRow(input, 'media');
  const setParts = Object.keys(row).map((col) => `${col} = ?`);
  const values = [...Object.values(row), id];

  await db.runAsync(
    `UPDATE ${TABLE_NAMES.MEDIA} SET ${setParts.join(', ')} WHERE id = ?`,
    values as (string | number | null)[]
  );

  return getMediaById(id);
}

/**
 * Update media download status
 */
export async function updateMediaStatus(
  id: string,
  status: MediaDownloadStatus,
  localPath?: string,
  fileSize?: number
): Promise<Media | null> {
  const update: UpdateMediaInput = { downloadStatus: status };
  if (localPath) update.localPath = localPath;
  if (fileSize) update.fileSize = fileSize;
  return updateMedia(id, update);
}

/**
 * Get pending media for download
 */
export async function getPendingMedia(limit?: number): Promise<Media[]> {
  const db = await getDatabase();

  let sql = `SELECT * FROM ${TABLE_NAMES.MEDIA} WHERE download_status = 'pending' ORDER BY sort_order ASC`;
  const params: number[] = [];

  if (limit) {
    sql += ' LIMIT ?';
    params.push(limit);
  }

  const rows = await db.getAllAsync<Record<string, unknown>>(sql, params);
  return rows.map((row) => rowToObject<Media>(row, 'media'));
}

/**
 * Delete media by post ID
 */
export async function deleteMediaByPostId(postId: string): Promise<boolean> {
  const db = await getDatabase();

  const result = await db.runAsync(
    `DELETE FROM ${TABLE_NAMES.MEDIA} WHERE post_id = ?`,
    [postId]
  );

  return result.changes > 0;
}

/**
 * Get media count by post ID
 */
export async function getMediaCountByPostId(postId: string): Promise<number> {
  const db = await getDatabase();

  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM ${TABLE_NAMES.MEDIA} WHERE post_id = ?`,
    [postId]
  );

  return result?.count ?? 0;
}
