/**
 * AI Result repository - CRUD operations for AI analysis results
 */
import {
  getDatabase,
  generateId,
  getCurrentTimestamp,
  rowToObject,
  objectToRow,
} from '../repository';
import { TABLE_NAMES } from '../schema';
import { AIResult, CreateAIResultInput, ContentType } from '../../models/ai-result';

/**
 * Create AI result
 */
export async function createAIResult(input: CreateAIResultInput): Promise<AIResult> {
  const db = await getDatabase();

  const aiResult: AIResult = {
    id: generateId(),
    postId: input.postId,
    labels: input.labels,
    summary: input.summary,
    groupId: input.groupId ?? null,
    contentType: input.contentType ?? null,
    modelVersion: input.modelVersion,
    analyzedAt: getCurrentTimestamp(),
  };

  const row = objectToRow(aiResult, 'aiResults');
  const columns = Object.keys(row);
  const placeholders = columns.map(() => '?').join(', ');
  const values = Object.values(row);

  await db.runAsync(
    `INSERT INTO ${TABLE_NAMES.AI_RESULTS} (${columns.join(', ')}) VALUES (${placeholders})`,
    values as (string | number | null)[]
  );

  return aiResult;
}

/**
 * Get AI result by ID
 */
export async function getAIResultById(id: string): Promise<AIResult | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT * FROM ${TABLE_NAMES.AI_RESULTS} WHERE id = ?`,
    [id]
  );

  if (!row) return null;
  return rowToObject<AIResult>(row, 'aiResults');
}

/**
 * Get AI result by post ID
 */
export async function getAIResultByPostId(postId: string): Promise<AIResult | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT * FROM ${TABLE_NAMES.AI_RESULTS} WHERE post_id = ?`,
    [postId]
  );

  if (!row) return null;
  return rowToObject<AIResult>(row, 'aiResults');
}

/**
 * Get AI results by group ID
 */
export async function getAIResultsByGroupId(groupId: string): Promise<AIResult[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM ${TABLE_NAMES.AI_RESULTS} WHERE group_id = ? ORDER BY analyzed_at DESC`,
    [groupId]
  );

  return rows.map((row) => rowToObject<AIResult>(row, 'aiResults'));
}

/**
 * Get AI results by content type
 */
export async function getAIResultsByContentType(
  contentType: ContentType
): Promise<AIResult[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM ${TABLE_NAMES.AI_RESULTS} WHERE content_type = ? ORDER BY analyzed_at DESC`,
    [contentType]
  );

  return rows.map((row) => rowToObject<AIResult>(row, 'aiResults'));
}

/**
 * Update AI result group
 */
export async function updateAIResultGroup(
  id: string,
  groupId: string | null
): Promise<AIResult | null> {
  const db = await getDatabase();

  await db.runAsync(
    `UPDATE ${TABLE_NAMES.AI_RESULTS} SET group_id = ? WHERE id = ?`,
    [groupId, id]
  );

  return getAIResultById(id);
}

/**
 * Get all unique labels
 */
export async function getAllLabels(): Promise<string[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{ labels: string }>(
    `SELECT DISTINCT labels FROM ${TABLE_NAMES.AI_RESULTS}`
  );

  const allLabels = new Set<string>();
  for (const row of rows) {
    try {
      const labels = JSON.parse(row.labels);
      if (Array.isArray(labels)) {
        labels.forEach((label: string) => allLabels.add(label));
      }
    } catch {
      // Ignore parse errors
    }
  }

  return Array.from(allLabels).sort();
}

/**
 * Find posts by label
 */
export async function findPostIdsByLabel(label: string): Promise<string[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{ post_id: string; labels: string }>(
    `SELECT post_id, labels FROM ${TABLE_NAMES.AI_RESULTS}`
  );

  const postIds: string[] = [];
  for (const row of rows) {
    try {
      const labels = JSON.parse(row.labels);
      if (Array.isArray(labels) && labels.includes(label)) {
        postIds.push(row.post_id);
      }
    } catch {
      // Ignore parse errors
    }
  }

  return postIds;
}

/**
 * Delete AI result by post ID
 */
export async function deleteAIResultByPostId(postId: string): Promise<boolean> {
  const db = await getDatabase();

  const result = await db.runAsync(
    `DELETE FROM ${TABLE_NAMES.AI_RESULTS} WHERE post_id = ?`,
    [postId]
  );

  return result.changes > 0;
}
