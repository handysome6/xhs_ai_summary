/**
 * Base repository class for database operations
 * Provides common CRUD operations with type safety
 */
import * as SQLite from 'expo-sqlite';
import { COLUMN_MAPPINGS } from './schema';

/**
 * Database instance singleton
 */
let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Database name
 */
const DATABASE_NAME = 'xhs_collection.db';

/**
 * Get or create database instance
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DATABASE_NAME);
    // Enable foreign keys
    await dbInstance.execAsync('PRAGMA foreign_keys = ON;');
  }
  return dbInstance;
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
}

/**
 * Convert camelCase to snake_case
 */
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Convert snake_case to camelCase
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert database row to TypeScript object
 */
export function rowToObject<T>(
  row: Record<string, unknown>,
  tableName: keyof typeof COLUMN_MAPPINGS
): T {
  const mappings = COLUMN_MAPPINGS[tableName];
  const result: Record<string, unknown> = {};

  for (const [tsKey, dbKey] of Object.entries(mappings)) {
    if (dbKey in row) {
      let value = row[dbKey];

      // Handle JSON arrays (labels in ai_results)
      if (tsKey === 'labels' && typeof value === 'string') {
        try {
          value = JSON.parse(value);
        } catch {
          value = [];
        }
      }

      result[tsKey] = value;
    }
  }

  return result as T;
}

/**
 * Convert TypeScript object to database row
 */
export function objectToRow(
  obj: Record<string, unknown>,
  tableName: keyof typeof COLUMN_MAPPINGS
): Record<string, unknown> {
  const mappings = COLUMN_MAPPINGS[tableName];
  const result: Record<string, unknown> = {};

  for (const [tsKey, dbKey] of Object.entries(mappings)) {
    if (tsKey in obj) {
      let value = obj[tsKey];

      // Handle JSON arrays (labels in ai_results)
      if (tsKey === 'labels' && Array.isArray(value)) {
        value = JSON.stringify(value);
      }

      result[dbKey] = value;
    }
  }

  return result;
}

/**
 * Base repository interface
 */
export interface Repository<T, CreateInput, UpdateInput> {
  findById(id: string): Promise<T | null>;
  findAll(options?: QueryOptions): Promise<T[]>;
  create(input: CreateInput): Promise<T>;
  update(id: string, input: UpdateInput): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
}

/**
 * Query options for findAll
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  where?: Record<string, unknown>;
}

/**
 * Generate UUID v4
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get current timestamp in milliseconds
 */
export function getCurrentTimestamp(): number {
  return Date.now();
}

/**
 * Build WHERE clause from conditions
 */
export function buildWhereClause(
  conditions: Record<string, unknown>
): { clause: string; values: unknown[] } {
  const parts: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(conditions)) {
    const snakeKey = toSnakeCase(key);
    if (value === null) {
      parts.push(`${snakeKey} IS NULL`);
    } else if (Array.isArray(value)) {
      const placeholders = value.map(() => '?').join(', ');
      parts.push(`${snakeKey} IN (${placeholders})`);
      values.push(...value);
    } else {
      parts.push(`${snakeKey} = ?`);
      values.push(value);
    }
  }

  return {
    clause: parts.length > 0 ? `WHERE ${parts.join(' AND ')}` : '',
    values,
  };
}

/**
 * Build INSERT statement
 */
export function buildInsertStatement(
  tableName: string,
  row: Record<string, unknown>
): { sql: string; values: unknown[] } {
  const columns = Object.keys(row);
  const placeholders = columns.map(() => '?').join(', ');
  const values = Object.values(row);

  return {
    sql: `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
    values,
  };
}

/**
 * Build UPDATE statement
 */
export function buildUpdateStatement(
  tableName: string,
  id: string,
  row: Record<string, unknown>
): { sql: string; values: unknown[] } {
  const setParts = Object.keys(row).map((col) => `${col} = ?`);
  const values = [...Object.values(row), id];

  return {
    sql: `UPDATE ${tableName} SET ${setParts.join(', ')} WHERE id = ?`,
    values,
  };
}
