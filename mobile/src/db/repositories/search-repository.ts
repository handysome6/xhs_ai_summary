/**
 * Search repository - full-text search operations using FTS5
 */
import { getDatabase, rowToObject } from '../repository';
import { TABLE_NAMES } from '../schema';
import { Post } from '../../models/post';

/**
 * Search result with relevance
 */
export interface SearchResult {
  post: Post;
  matchCount: number;
  snippet: string | null;
}

/**
 * Index a post for full-text search
 */
export async function indexPost(
  postId: string,
  title: string | null,
  text: string,
  authorName: string | null,
  labels: string[],
  summary: string
): Promise<void> {
  const db = await getDatabase();

  // Check if already indexed
  const existing = await db.getFirstAsync<{ rowid: number }>(
    `SELECT rowid FROM ${TABLE_NAMES.POSTS_FTS} WHERE rowid = (
      SELECT rowid FROM posts WHERE id = ?
    )`,
    [postId]
  );

  const labelsText = labels.join(' ');

  if (existing) {
    // Update existing entry
    await db.runAsync(
      `UPDATE ${TABLE_NAMES.POSTS_FTS} SET
        title = ?, text = ?, author_name = ?, labels = ?, summary = ?
        WHERE rowid = (SELECT rowid FROM posts WHERE id = ?)`,
      [title || '', text, authorName || '', labelsText, summary, postId]
    );
  } else {
    // Insert new entry with matching rowid
    await db.runAsync(
      `INSERT INTO ${TABLE_NAMES.POSTS_FTS}(rowid, title, text, author_name, labels, summary)
        SELECT rowid, ?, ?, ?, ?, ? FROM posts WHERE id = ?`,
      [title || '', text, authorName || '', labelsText, summary, postId]
    );
  }
}

/**
 * Remove post from search index
 */
export async function removeFromIndex(postId: string): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `DELETE FROM ${TABLE_NAMES.POSTS_FTS} WHERE rowid = (
      SELECT rowid FROM posts WHERE id = ?
    )`,
    [postId]
  );
}

/**
 * Search posts by query
 */
export async function searchPosts(
  query: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<SearchResult[]> {
  const db = await getDatabase();

  if (!query.trim()) {
    return [];
  }

  // Escape special characters for FTS5
  const escapedQuery = query
    .replace(/['"]/g, '')
    .replace(/[+\-*]/g, ' ')
    .trim();

  if (!escapedQuery) {
    return [];
  }

  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  // Search with FTS5 and get matching posts
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT p.*,
            snippet(${TABLE_NAMES.POSTS_FTS}, 1, '<mark>', '</mark>', '...', 32) as snippet
     FROM ${TABLE_NAMES.POSTS} p
     JOIN ${TABLE_NAMES.POSTS_FTS} fts ON p.rowid = fts.rowid
     WHERE ${TABLE_NAMES.POSTS_FTS} MATCH ?
     ORDER BY rank
     LIMIT ? OFFSET ?`,
    [`${escapedQuery}*`, limit, offset]
  );

  return rows.map((row) => ({
    post: rowToObject<Post>(row, 'posts'),
    matchCount: 1, // FTS5 doesn't easily provide match count
    snippet: row.snippet as string | null,
  }));
}

/**
 * Filter posts by label
 */
export async function filterByLabel(
  label: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<Post[]> {
  const db = await getDatabase();

  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  // Get posts where AI result has the label
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT p.* FROM ${TABLE_NAMES.POSTS} p
     JOIN ${TABLE_NAMES.AI_RESULTS} ar ON p.id = ar.post_id
     WHERE ar.labels LIKE ?
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    [`%"${label}"%`, limit, offset]
  );

  return rows.map((row) => rowToObject<Post>(row, 'posts'));
}

/**
 * Filter posts by content type
 */
export async function filterByContentType(
  contentType: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<Post[]> {
  const db = await getDatabase();

  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT p.* FROM ${TABLE_NAMES.POSTS} p
     JOIN ${TABLE_NAMES.AI_RESULTS} ar ON p.id = ar.post_id
     WHERE ar.content_type = ?
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    [contentType, limit, offset]
  );

  return rows.map((row) => rowToObject<Post>(row, 'posts'));
}

/**
 * Filter posts by group
 */
export async function filterByGroup(
  groupId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<Post[]> {
  const db = await getDatabase();

  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT p.* FROM ${TABLE_NAMES.POSTS} p
     JOIN ${TABLE_NAMES.AI_RESULTS} ar ON p.id = ar.post_id
     WHERE ar.group_id = ?
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    [groupId, limit, offset]
  );

  return rows.map((row) => rowToObject<Post>(row, 'posts'));
}

/**
 * Get search suggestions based on existing content
 */
export async function getSearchSuggestions(
  partialQuery: string,
  limit: number = 5
): Promise<string[]> {
  const db = await getDatabase();

  if (!partialQuery.trim()) {
    return [];
  }

  // Get matching labels as suggestions
  const rows = await db.getAllAsync<{ labels: string }>(
    `SELECT DISTINCT labels FROM ${TABLE_NAMES.AI_RESULTS} WHERE labels != '[]' LIMIT 20`
  );

  const allLabels = new Set<string>();
  const lowerQuery = partialQuery.toLowerCase();

  for (const row of rows) {
    try {
      const labels = JSON.parse(row.labels);
      if (Array.isArray(labels)) {
        labels
          .filter((l: string) => l.toLowerCase().includes(lowerQuery))
          .forEach((label: string) => allLabels.add(label));
      }
    } catch {
      // Ignore parse errors
    }
  }

  return Array.from(allLabels).slice(0, limit);
}

/**
 * Rebuild full-text search index
 */
export async function rebuildSearchIndex(): Promise<number> {
  const db = await getDatabase();

  // Clear existing index
  await db.runAsync(`DELETE FROM ${TABLE_NAMES.POSTS_FTS}`);

  // Reindex all posts
  const result = await db.runAsync(
    `INSERT INTO ${TABLE_NAMES.POSTS_FTS}(rowid, title, text, author_name, labels, summary)
     SELECT p.rowid,
            COALESCE(p.title, ''),
            COALESCE(c.text, ''),
            COALESCE(c.author_name, ''),
            COALESCE(ar.labels, ''),
            COALESCE(ar.summary, '')
     FROM ${TABLE_NAMES.POSTS} p
     LEFT JOIN ${TABLE_NAMES.CONTENT} c ON p.id = c.post_id
     LEFT JOIN ${TABLE_NAMES.AI_RESULTS} ar ON p.id = ar.post_id`
  );

  return result.changes;
}
