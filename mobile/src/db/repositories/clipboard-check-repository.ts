/**
 * Clipboard check repository - CRUD operations for clipboard monitoring analytics
 */
import {
  getDatabase,
  generateId,
  getCurrentTimestamp,
  rowToObject,
  objectToRow,
} from '../repository';
import { TABLE_NAMES } from '../schema';
import {
  ClipboardCheck,
  CreateClipboardCheckInput,
  ClipboardCheckStatistics,
  ClipboardActionType,
} from '../../models/clipboard-check';

/**
 * Create a new clipboard check record
 */
export async function createClipboardCheck(
  input: CreateClipboardCheckInput
): Promise<ClipboardCheck> {
  const db = await getDatabase();
  const now = getCurrentTimestamp();

  const check: ClipboardCheck = {
    id: generateId(),
    clipboardContentHash: input.clipboardContentHash ?? null,
    clipboardContentPreview: input.clipboardContentPreview ?? null,
    actionTaken: input.actionTaken,
    urlDetected: input.urlDetected ?? null,
    urlHash: input.urlHash ?? null,
    isValidUrl: input.isValidUrl ?? false,
    createdAt: now,
  };

  const row = objectToRow(check, 'clipboardChecks');
  const columns = Object.keys(row);
  const placeholders = columns.map(() => '?').join(', ');
  const values = Object.values(row);

  await db.runAsync(
    `INSERT INTO ${TABLE_NAMES.CLIPBOARD_CHECKS} (${columns.join(', ')}) VALUES (${placeholders})`,
    values as (string | number | null)[]
  );

  return check;
}

/**
 * Get clipboard checks within time range
 */
export async function getClipboardChecksInTimeRange(
  startTime: number,
  endTime: number,
  limit?: number
): Promise<ClipboardCheck[]> {
  const db = await getDatabase();

  let sql = `SELECT * FROM ${TABLE_NAMES.CLIPBOARD_CHECKS} WHERE created_at >= ? AND created_at <= ? ORDER BY created_at DESC`;
  const params: number[] = [startTime, endTime];

  if (limit) {
    sql += ' LIMIT ?';
    params.push(limit);
  }

  const rows = await db.getAllAsync<Record<string, unknown>>(sql, params);
  return rows.map((row) => rowToObject<ClipboardCheck>(row, 'clipboardChecks'));
}

/**
 * Get clipboard checks by action type
 */
export async function getClipboardChecksByAction(
  actionType: ClipboardActionType,
  limit?: number
): Promise<ClipboardCheck[]> {
  const db = await getDatabase();

  let sql = `SELECT * FROM ${TABLE_NAMES.CLIPBOARD_CHECKS} WHERE action_taken = ? ORDER BY created_at DESC`;
  const params: (string | number)[] = [actionType];

  if (limit) {
    sql += ' LIMIT ?';
    params.push(limit);
  }

  const rows = await db.getAllAsync<Record<string, unknown>>(sql, params);
  return rows.map((row) => rowToObject<ClipboardCheck>(row, 'clipboardChecks'));
}

/**
 * Get statistics for clipboard checks
 */
export async function getClipboardCheckStatistics(
  since: number
): Promise<ClipboardCheckStatistics> {
  const db = await getDatabase();

  // Get count by action type
  const countRows = await db.getAllAsync<{ action_taken: string; count: number }>(
    `SELECT action_taken, COUNT(*) as count FROM ${TABLE_NAMES.CLIPBOARD_CHECKS} WHERE created_at >= ? GROUP BY action_taken`,
    [since]
  );

  // Initialize counts
  let totalChecks = 0;
  let promptsShown = 0;
  let invalidUrls = 0;
  let duplicatesPrevented = 0;
  let emptyChecks = 0;

  // Aggregate counts
  countRows.forEach((row) => {
    const count = row.count;
    totalChecks += count;

    switch (row.action_taken) {
      case 'prompted':
        promptsShown = count;
        break;
      case 'ignored_invalid':
        invalidUrls = count;
        break;
      case 'ignored_duplicate':
        duplicatesPrevented = count;
        break;
      case 'ignored_empty':
        emptyChecks = count;
        break;
    }
  });

  // Calculate percentages
  const percentages = {
    prompted: totalChecks > 0 ? (promptsShown / totalChecks) * 100 : 0,
    ignoredInvalid: totalChecks > 0 ? (invalidUrls / totalChecks) * 100 : 0,
    ignoredDuplicate: totalChecks > 0 ? (duplicatesPrevented / totalChecks) * 100 : 0,
    ignoredEmpty: totalChecks > 0 ? (emptyChecks / totalChecks) * 100 : 0,
  };

  return {
    totalChecks,
    promptsShown,
    invalidUrls,
    duplicatesPrevented,
    emptyChecks,
    percentages,
  };
}

/**
 * Delete clipboard checks older than specified time
 */
export async function deleteClipboardChecksOlderThan(
  beforeTime: number
): Promise<number> {
  const db = await getDatabase();

  const result = await db.runAsync(
    `DELETE FROM ${TABLE_NAMES.CLIPBOARD_CHECKS} WHERE created_at < ?`,
    [beforeTime]
  );

  return result.changes;
}

/**
 * Get most recent clipboard check
 */
export async function getLatestClipboardCheck(): Promise<ClipboardCheck | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT * FROM ${TABLE_NAMES.CLIPBOARD_CHECKS} ORDER BY created_at DESC LIMIT 1`
  );

  if (!row) return null;
  return rowToObject<ClipboardCheck>(row, 'clipboardChecks');
}

/**
 * Get clipboard check count
 */
export async function getClipboardCheckCount(): Promise<number> {
  const db = await getDatabase();

  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM ${TABLE_NAMES.CLIPBOARD_CHECKS}`
  );

  return result?.count ?? 0;
}
