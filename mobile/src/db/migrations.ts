/**
 * Database migration system
 * Handles schema versioning and upgrades
 */
import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL, SCHEMA_VERSION, TABLE_NAMES } from './schema';

/**
 * Migration definition
 */
interface Migration {
  version: number;
  name: string;
  up: string;
  down: string;
}

/**
 * All migrations in order
 * Add new migrations here as the schema evolves
 */
const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    up: CREATE_TABLES_SQL,
    down: `
      DROP TABLE IF EXISTS posts_fts;
      DROP TABLE IF EXISTS download_tasks;
      DROP TABLE IF EXISTS ai_results;
      DROP TABLE IF EXISTS groups;
      DROP TABLE IF EXISTS media;
      DROP TABLE IF EXISTS content;
      DROP TABLE IF EXISTS posts;
      DROP TABLE IF EXISTS schema_metadata;
    `,
  },
  {
    version: 2,
    name: 'clipboard_monitoring',
    up: `
      -- Clipboard checks table: Analytics/debugging for clipboard monitoring events
      CREATE TABLE IF NOT EXISTS clipboard_checks (
        id TEXT PRIMARY KEY NOT NULL,
        clipboard_content_hash TEXT,
        clipboard_content_preview TEXT,
        action_taken TEXT NOT NULL,
        url_detected TEXT,
        url_hash TEXT,
        is_valid_url INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_clipboard_checks_created ON clipboard_checks(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_clipboard_checks_action ON clipboard_checks(action_taken);
      CREATE INDEX IF NOT EXISTS idx_clipboard_checks_url_hash ON clipboard_checks(url_hash);

      -- Ignored URLs table: Deduplication tracking (5-minute window)
      CREATE TABLE IF NOT EXISTS ignored_urls (
        id TEXT PRIMARY KEY NOT NULL,
        url TEXT NOT NULL,
        url_hash TEXT NOT NULL UNIQUE,
        action TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_ignored_urls_hash ON ignored_urls(url_hash);
      CREATE INDEX IF NOT EXISTS idx_ignored_urls_expires ON ignored_urls(expires_at);
      CREATE INDEX IF NOT EXISTS idx_ignored_urls_action ON ignored_urls(action);
    `,
    down: `
      DROP TABLE IF EXISTS ignored_urls;
      DROP TABLE IF EXISTS clipboard_checks;
    `,
  },
];

/**
 * Get current schema version from database
 */
async function getCurrentVersion(db: SQLite.SQLiteDatabase): Promise<number> {
  try {
    const result = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM ${TABLE_NAMES.SCHEMA_METADATA} WHERE key = 'schema_version'`
    );
    return result ? parseInt(result.value, 10) : 0;
  } catch {
    // Table doesn't exist yet
    return 0;
  }
}

/**
 * Set schema version in database
 */
async function setVersion(
  db: SQLite.SQLiteDatabase,
  version: number
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO ${TABLE_NAMES.SCHEMA_METADATA} (key, value) VALUES ('schema_version', ?)`,
    [version.toString()]
  );
}

/**
 * Run pending migrations
 */
export async function runMigrations(
  db: SQLite.SQLiteDatabase
): Promise<{ applied: number; currentVersion: number }> {
  const currentVersion = await getCurrentVersion(db);
  let appliedCount = 0;

  // Get migrations that need to be applied
  const pendingMigrations = MIGRATIONS.filter((m) => m.version > currentVersion);

  if (pendingMigrations.length === 0) {
    return { applied: 0, currentVersion };
  }

  // Sort by version to ensure order
  pendingMigrations.sort((a, b) => a.version - b.version);

  // Apply each migration in a transaction
  for (const migration of pendingMigrations) {
    console.log(`Applying migration ${migration.version}: ${migration.name}`);

    await db.execAsync(migration.up);
    await setVersion(db, migration.version);

    appliedCount++;
    console.log(`Migration ${migration.version} applied successfully`);
  }

  const newVersion = await getCurrentVersion(db);
  return { applied: appliedCount, currentVersion: newVersion };
}

/**
 * Check if database needs migration
 */
export async function needsMigration(
  db: SQLite.SQLiteDatabase
): Promise<boolean> {
  const currentVersion = await getCurrentVersion(db);
  return currentVersion < SCHEMA_VERSION;
}

/**
 * Get migration status
 */
export async function getMigrationStatus(
  db: SQLite.SQLiteDatabase
): Promise<{
  currentVersion: number;
  targetVersion: number;
  pendingCount: number;
}> {
  const currentVersion = await getCurrentVersion(db);
  const pendingCount = MIGRATIONS.filter(
    (m) => m.version > currentVersion
  ).length;

  return {
    currentVersion,
    targetVersion: SCHEMA_VERSION,
    pendingCount,
  };
}

/**
 * Reset database (for testing/development)
 * WARNING: This will delete all data
 */
export async function resetDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  // Run down migrations in reverse order
  const reversedMigrations = [...MIGRATIONS].reverse();

  for (const migration of reversedMigrations) {
    console.log(`Rolling back migration ${migration.version}: ${migration.name}`);
    await db.execAsync(migration.down);
  }

  // Re-run all migrations
  await runMigrations(db);
}
