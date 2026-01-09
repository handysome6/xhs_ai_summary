/**
 * Content repository - CRUD operations for post content
 */
import {
  getDatabase,
  generateId,
  rowToObject,
  objectToRow,
} from '../repository';
import { TABLE_NAMES } from '../schema';
import { Content, CreateContentInput } from '../../models/content';

/**
 * Create content for a post
 */
export async function createContent(input: CreateContentInput): Promise<Content> {
  const db = await getDatabase();

  const content: Content = {
    id: generateId(),
    postId: input.postId,
    text: input.text,
    authorName: input.authorName ?? null,
    authorId: input.authorId ?? null,
    originalDate: input.originalDate ?? null,
    viewCount: input.viewCount ?? null,
    likeCount: input.likeCount ?? null,
  };

  const row = objectToRow(content, 'content');
  const columns = Object.keys(row);
  const placeholders = columns.map(() => '?').join(', ');
  const values = Object.values(row);

  await db.runAsync(
    `INSERT INTO ${TABLE_NAMES.CONTENT} (${columns.join(', ')}) VALUES (${placeholders})`,
    values as (string | number | null)[]
  );

  return content;
}

/**
 * Get content by ID
 */
export async function getContentById(id: string): Promise<Content | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT * FROM ${TABLE_NAMES.CONTENT} WHERE id = ?`,
    [id]
  );

  if (!row) return null;
  return rowToObject<Content>(row, 'content');
}

/**
 * Get content by post ID
 */
export async function getContentByPostId(postId: string): Promise<Content | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT * FROM ${TABLE_NAMES.CONTENT} WHERE post_id = ?`,
    [postId]
  );

  if (!row) return null;
  return rowToObject<Content>(row, 'content');
}

/**
 * Update content
 */
export async function updateContent(
  id: string,
  input: Partial<Omit<Content, 'id' | 'postId'>>
): Promise<Content | null> {
  const db = await getDatabase();

  const row = objectToRow(input, 'content');
  const setParts = Object.keys(row).map((col) => `${col} = ?`);
  const values = [...Object.values(row), id];

  await db.runAsync(
    `UPDATE ${TABLE_NAMES.CONTENT} SET ${setParts.join(', ')} WHERE id = ?`,
    values as (string | number | null)[]
  );

  return getContentById(id);
}

/**
 * Delete content by post ID
 */
export async function deleteContentByPostId(postId: string): Promise<boolean> {
  const db = await getDatabase();

  const result = await db.runAsync(
    `DELETE FROM ${TABLE_NAMES.CONTENT} WHERE post_id = ?`,
    [postId]
  );

  return result.changes > 0;
}
