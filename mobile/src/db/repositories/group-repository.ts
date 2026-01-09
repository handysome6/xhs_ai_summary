/**
 * Group repository - CRUD operations for post groups
 */
import {
  getDatabase,
  generateId,
  getCurrentTimestamp,
  rowToObject,
  objectToRow,
} from '../repository';
import { TABLE_NAMES } from '../schema';
import { Group, CreateGroupInput, UpdateGroupInput } from '../../models/group';

/**
 * Create a group
 */
export async function createGroup(input: CreateGroupInput): Promise<Group> {
  const db = await getDatabase();

  const group: Group = {
    id: generateId(),
    name: input.name,
    description: input.description ?? null,
    postCount: 0,
    createdAt: getCurrentTimestamp(),
  };

  const row = objectToRow(group, 'groups');
  const columns = Object.keys(row);
  const placeholders = columns.map(() => '?').join(', ');
  const values = Object.values(row);

  await db.runAsync(
    `INSERT INTO ${TABLE_NAMES.GROUPS} (${columns.join(', ')}) VALUES (${placeholders})`,
    values as (string | number | null)[]
  );

  return group;
}

/**
 * Get group by ID
 */
export async function getGroupById(id: string): Promise<Group | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT * FROM ${TABLE_NAMES.GROUPS} WHERE id = ?`,
    [id]
  );

  if (!row) return null;
  return rowToObject<Group>(row, 'groups');
}

/**
 * Get group by name
 */
export async function getGroupByName(name: string): Promise<Group | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT * FROM ${TABLE_NAMES.GROUPS} WHERE name = ?`,
    [name]
  );

  if (!row) return null;
  return rowToObject<Group>(row, 'groups');
}

/**
 * Get all groups
 */
export async function getAllGroups(): Promise<Group[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM ${TABLE_NAMES.GROUPS} ORDER BY post_count DESC, name ASC`
  );

  return rows.map((row) => rowToObject<Group>(row, 'groups'));
}

/**
 * Update a group
 */
export async function updateGroup(
  id: string,
  input: UpdateGroupInput
): Promise<Group | null> {
  const db = await getDatabase();

  const row = objectToRow(input, 'groups');
  const setParts = Object.keys(row).map((col) => `${col} = ?`);
  const values = [...Object.values(row), id];

  await db.runAsync(
    `UPDATE ${TABLE_NAMES.GROUPS} SET ${setParts.join(', ')} WHERE id = ?`,
    values as (string | number | null)[]
  );

  return getGroupById(id);
}

/**
 * Increment group post count
 */
export async function incrementGroupPostCount(id: string): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `UPDATE ${TABLE_NAMES.GROUPS} SET post_count = post_count + 1 WHERE id = ?`,
    [id]
  );
}

/**
 * Decrement group post count
 */
export async function decrementGroupPostCount(id: string): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `UPDATE ${TABLE_NAMES.GROUPS} SET post_count = MAX(0, post_count - 1) WHERE id = ?`,
    [id]
  );
}

/**
 * Delete a group
 */
export async function deleteGroup(id: string): Promise<boolean> {
  const db = await getDatabase();

  // First update all AI results to remove group reference
  await db.runAsync(
    `UPDATE ${TABLE_NAMES.AI_RESULTS} SET group_id = NULL WHERE group_id = ?`,
    [id]
  );

  const result = await db.runAsync(
    `DELETE FROM ${TABLE_NAMES.GROUPS} WHERE id = ?`,
    [id]
  );

  return result.changes > 0;
}

/**
 * Get or create group by name
 */
export async function getOrCreateGroup(name: string): Promise<Group> {
  const existing = await getGroupByName(name);
  if (existing) return existing;

  return createGroup({ name });
}

/**
 * Get group with post count from AI results
 */
export async function recalculateGroupPostCount(id: string): Promise<void> {
  const db = await getDatabase();

  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM ${TABLE_NAMES.AI_RESULTS} WHERE group_id = ?`,
    [id]
  );

  const count = result?.count ?? 0;

  await db.runAsync(
    `UPDATE ${TABLE_NAMES.GROUPS} SET post_count = ? WHERE id = ?`,
    [count, id]
  );
}
