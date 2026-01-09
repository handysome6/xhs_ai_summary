/**
 * Post repository - CRUD operations for posts
 */
import {
  getDatabase,
  generateId,
  getCurrentTimestamp,
  rowToObject,
  objectToRow,
  buildWhereClause,
} from '../repository';
import { TABLE_NAMES } from '../schema';
import { Post, CreatePostInput, UpdatePostInput, PostDownloadStatus } from '../../models/post';

/**
 * Create a new post
 */
export async function createPost(input: CreatePostInput): Promise<Post> {
  const db = await getDatabase();
  const now = getCurrentTimestamp();

  const post: Post = {
    id: generateId(),
    url: input.url,
    urlHash: input.urlHash,
    title: input.title ?? null,
    downloadStatus: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  const row = objectToRow(post, 'posts');
  const columns = Object.keys(row);
  const placeholders = columns.map(() => '?').join(', ');
  const values = Object.values(row);

  await db.runAsync(
    `INSERT INTO ${TABLE_NAMES.POSTS} (${columns.join(', ')}) VALUES (${placeholders})`,
    values as (string | number | null)[]
  );

  return post;
}

/**
 * Get post by ID
 */
export async function getPostById(id: string): Promise<Post | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT * FROM ${TABLE_NAMES.POSTS} WHERE id = ?`,
    [id]
  );

  if (!row) return null;
  return rowToObject<Post>(row, 'posts');
}

/**
 * Get post by URL hash (for duplicate detection)
 */
export async function getPostByUrlHash(urlHash: string): Promise<Post | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT * FROM ${TABLE_NAMES.POSTS} WHERE url_hash = ?`,
    [urlHash]
  );

  if (!row) return null;
  return rowToObject<Post>(row, 'posts');
}

/**
 * Get all posts ordered by created_at DESC
 */
export async function getAllPosts(options?: {
  limit?: number;
  offset?: number;
  status?: PostDownloadStatus;
}): Promise<Post[]> {
  const db = await getDatabase();

  let sql = `SELECT * FROM ${TABLE_NAMES.POSTS}`;
  const params: (string | number)[] = [];

  if (options?.status) {
    sql += ' WHERE download_status = ?';
    params.push(options.status);
  }

  sql += ' ORDER BY created_at DESC';

  if (options?.limit) {
    sql += ' LIMIT ?';
    params.push(options.limit);
  }

  if (options?.offset) {
    sql += ' OFFSET ?';
    params.push(options.offset);
  }

  const rows = await db.getAllAsync<Record<string, unknown>>(sql, params);
  return rows.map((row) => rowToObject<Post>(row, 'posts'));
}

/**
 * Update a post
 */
export async function updatePost(
  id: string,
  input: UpdatePostInput
): Promise<Post | null> {
  const db = await getDatabase();

  const updateData = {
    ...input,
    updatedAt: getCurrentTimestamp(),
  };

  const row = objectToRow(updateData, 'posts');
  const setParts = Object.keys(row).map((col) => `${col} = ?`);
  const values = [...Object.values(row), id];

  await db.runAsync(
    `UPDATE ${TABLE_NAMES.POSTS} SET ${setParts.join(', ')} WHERE id = ?`,
    values as (string | number | null)[]
  );

  return getPostById(id);
}

/**
 * Update post download status
 */
export async function updatePostStatus(
  id: string,
  status: PostDownloadStatus
): Promise<Post | null> {
  return updatePost(id, { downloadStatus: status });
}

/**
 * Delete a post (cascades to content, media via FK)
 */
export async function deletePost(id: string): Promise<boolean> {
  const db = await getDatabase();

  const result = await db.runAsync(
    `DELETE FROM ${TABLE_NAMES.POSTS} WHERE id = ?`,
    [id]
  );

  return result.changes > 0;
}

/**
 * Get post count
 */
export async function getPostCount(): Promise<number> {
  const db = await getDatabase();

  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM ${TABLE_NAMES.POSTS}`
  );

  return result?.count ?? 0;
}

/**
 * Check if post exists by URL hash
 */
export async function postExistsByUrlHash(urlHash: string): Promise<boolean> {
  const post = await getPostByUrlHash(urlHash);
  return post !== null;
}
