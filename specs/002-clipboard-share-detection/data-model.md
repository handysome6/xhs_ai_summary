# Data Model: Clipboard Share Link Detection

**Feature**: 002-clipboard-share-detection
**Date**: 2026-01-09
**Database**: SQLite (expo-sqlite ~13.0.0)

## Overview

This feature adds 2 new tables to the existing SQLite schema for clipboard monitoring and deduplication. The schema follows the same patterns established in Feature 001 (XHS Share Collection) with UTC timestamps, TEXT primary keys (UUIDs), and proper indexing.

**Schema Version**: Migrating from v1 to v2
**Migration Strategy**: Additive only (no breaking changes to existing tables)

## New Tables

### 1. clipboard_checks

**Purpose**: Track clipboard monitoring events for analytics and debugging

**Schema**:
```sql
CREATE TABLE IF NOT EXISTS clipboard_checks (
  id TEXT PRIMARY KEY NOT NULL,
  clipboard_content_hash TEXT,
  clipboard_content_preview TEXT,
  action_taken TEXT NOT NULL CHECK(action_taken IN ('prompted', 'ignored_invalid', 'ignored_duplicate', 'ignored_empty')),
  url_detected TEXT,
  url_hash TEXT,
  is_valid_url INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_clipboard_checks_created ON clipboard_checks(created_at);
CREATE INDEX idx_clipboard_checks_action ON clipboard_checks(action_taken);
```

**Fields**:

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | TEXT | NO | UUID generated via `generateId()` utility |
| `clipboard_content_hash` | TEXT | YES | SHA-256 hash of clipboard content (NULL if clipboard empty) |
| `clipboard_content_preview` | TEXT | YES | First 100 chars of clipboard content for debugging |
| `action_taken` | TEXT | NO | One of: 'prompted', 'ignored_invalid', 'ignored_duplicate', 'ignored_empty' |
| `url_detected` | TEXT | YES | Full URL if XHS link detected (NULL otherwise) |
| `url_hash` | TEXT | YES | SHA-256 hash of normalized URL (NULL if not valid XHS URL) |
| `is_valid_url` | INTEGER | NO | Boolean: 1 if valid XHS URL, 0 otherwise |
| `created_at` | INTEGER | NO | Unix timestamp (milliseconds since epoch) |

**Constraints**:
- Primary key on `id` (UUID)
- CHECK constraint on `action_taken` for valid enum values
- Index on `created_at` for time-based queries (analytics)
- Index on `action_taken` for filtering by action type

**Data Retention**:
- Keep last 30 days of clipboard checks for debugging
- Auto-cleanup via scheduled task (delete WHERE created_at < NOW() - 30 days)
- Estimated storage: ~10KB per 100 records

**Example Queries**:
```sql
-- Get clipboard checks from last 24 hours
SELECT * FROM clipboard_checks
WHERE created_at > (strftime('%s', 'now') - 86400) * 1000
ORDER BY created_at DESC;

-- Count prompts shown in last week
SELECT COUNT(*) FROM clipboard_checks
WHERE action_taken = 'prompted'
  AND created_at > (strftime('%s', 'now') - 604800) * 1000;

-- Find duplicate detection rate
SELECT
  action_taken,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM clipboard_checks), 2) as percentage
FROM clipboard_checks
GROUP BY action_taken;
```

---

### 2. ignored_urls

**Purpose**: Store dismissed or saved URLs for 5-minute deduplication window

**Schema**:
```sql
CREATE TABLE IF NOT EXISTS ignored_urls (
  id TEXT PRIMARY KEY NOT NULL,
  url TEXT NOT NULL,
  url_hash TEXT NOT NULL UNIQUE,
  action TEXT NOT NULL CHECK(action IN ('dismissed', 'saved')),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX idx_ignored_urls_hash ON ignored_urls(url_hash);
CREATE INDEX idx_ignored_urls_expires ON ignored_urls(expires_at);
```

**Fields**:

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | TEXT | NO | UUID generated via `generateId()` utility |
| `url` | TEXT | NO | Full normalized URL |
| `url_hash` | TEXT | NO | SHA-256 hash of normalized URL (for fast lookups) |
| `action` | TEXT | NO | One of: 'dismissed' (user dismissed prompt), 'saved' (user added to library) |
| `created_at` | INTEGER | NO | Unix timestamp when action occurred |
| `expires_at` | INTEGER | NO | Unix timestamp when deduplication expires (created_at + 5 minutes) |

**Constraints**:
- Primary key on `id` (UUID)
- UNIQUE constraint on `url_hash` (one entry per URL)
- CHECK constraint on `action` for valid enum values
- Index on `url_hash` for O(1) deduplication lookups
- Index on `expires_at` for efficient cleanup queries

**Data Lifecycle**:
- Entries expire 5 minutes after creation
- Soft cleanup: Queries filter by `WHERE expires_at > NOW()`
- Hard cleanup: Background task deletes expired rows every 10 minutes
- Max records: ~500 (assuming 1-2 URLs/minute worst case)

**Deduplication Logic**:
```sql
-- Check if URL was recently handled (dismissed or saved)
SELECT 1 FROM ignored_urls
WHERE url_hash = ?
  AND expires_at > ?  -- Current timestamp
LIMIT 1;
```

**Insert/Update Pattern**:
```sql
-- Insert new ignored URL (upsert behavior via REPLACE)
REPLACE INTO ignored_urls (id, url, url_hash, action, created_at, expires_at)
VALUES (?, ?, ?, ?, ?, ?);
```

**Cleanup Query**:
```sql
-- Delete expired entries (run every 10 minutes)
DELETE FROM ignored_urls
WHERE expires_at < (strftime('%s', 'now') * 1000);
```

**Example Queries**:
```sql
-- Check if specific URL is in deduplication window
SELECT action, created_at, expires_at
FROM ignored_urls
WHERE url_hash = 'abc123def456'
  AND expires_at > (strftime('%s', 'now') * 1000);

-- Get all active ignored URLs
SELECT url, action, created_at, expires_at
FROM ignored_urls
WHERE expires_at > (strftime('%s', 'now') * 1000)
ORDER BY created_at DESC;

-- Count URLs by action type in current window
SELECT action, COUNT(*) as count
FROM ignored_urls
WHERE expires_at > (strftime('%s', 'now') * 1000)
GROUP BY action;
```

---

## Entity Relationships

```
┌─────────────────────┐
│  clipboard_checks   │  (Analytics/Debugging)
│─────────────────────│
│ id (PK)             │
│ clipboard_content_hash │
│ action_taken        │
│ url_detected        │
│ url_hash            │
│ created_at          │
└─────────────────────┘
         │
         │ (Loosely related via url_hash)
         │
         ▼
┌─────────────────────┐       ┌─────────────────────┐
│   ignored_urls      │       │       posts         │  (From Feature 001)
│─────────────────────│       │─────────────────────│
│ id (PK)             │       │ id (PK)             │
│ url                 │◄─────►│ url                 │
│ url_hash (UNIQUE)   │       │ url_hash (UNIQUE)   │  (Reuses hash function)
│ action              │       │ title               │
│ created_at          │       │ download_status     │
│ expires_at          │       │ created_at          │
└─────────────────────┘       └─────────────────────┘

Relationship: ignored_urls.url_hash matches posts.url_hash when action='saved'
Note: No foreign key constraint (ignored_urls expires independently)
```

**Key Points**:
- `clipboard_checks` is for analytics only, no foreign keys
- `ignored_urls` temporarily stores URL hashes that match `posts.url_hash`
- When user saves link, it goes to both `ignored_urls` (for dedup) and `posts` (permanent storage)
- URL hash function (`hashUrl()`) is shared utility from Feature 001

---

## Database Migration

**From**: Schema v1 (Feature 001 - 8 tables: posts, content, media, groups, ai_results, download_tasks, posts_fts, schema_metadata)

**To**: Schema v2 (Add 2 tables: clipboard_checks, ignored_urls)

**Migration SQL** (to be added in `mobile/src/db/migrations.ts`):

```typescript
// Migration 2: Add clipboard detection tables
export const migration_002_clipboard_detection = `
  -- Table 1: Clipboard check history
  CREATE TABLE IF NOT EXISTS clipboard_checks (
    id TEXT PRIMARY KEY NOT NULL,
    clipboard_content_hash TEXT,
    clipboard_content_preview TEXT,
    action_taken TEXT NOT NULL CHECK(action_taken IN ('prompted', 'ignored_invalid', 'ignored_duplicate', 'ignored_empty')),
    url_detected TEXT,
    url_hash TEXT,
    is_valid_url INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX idx_clipboard_checks_created ON clipboard_checks(created_at);
  CREATE INDEX idx_clipboard_checks_action ON clipboard_checks(action_taken);

  -- Table 2: Ignored URLs (deduplication)
  CREATE TABLE IF NOT EXISTS ignored_urls (
    id TEXT PRIMARY KEY NOT NULL,
    url TEXT NOT NULL,
    url_hash TEXT NOT NULL UNIQUE,
    action TEXT NOT NULL CHECK(action IN ('dismissed', 'saved')),
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );

  CREATE INDEX idx_ignored_urls_hash ON ignored_urls(url_hash);
  CREATE INDEX idx_ignored_urls_expires ON ignored_urls(expires_at);

  -- Update schema version
  UPDATE schema_metadata SET version = 2 WHERE id = 1;
`;

// Migration execution (in migrations.ts)
export async function runMigrations(db: SQLiteDatabase) {
  const currentVersion = await getCurrentSchemaVersion(db);

  if (currentVersion < 1) {
    await db.execAsync(migration_001_initial_schema);
  }

  if (currentVersion < 2) {
    await db.execAsync(migration_002_clipboard_detection);
  }

  // Future migrations go here
}
```

**Rollback Plan**: Drop tables if needed
```sql
DROP TABLE IF EXISTS clipboard_checks;
DROP TABLE IF EXISTS ignored_urls;
UPDATE schema_metadata SET version = 1 WHERE id = 1;
```

---

## TypeScript Interfaces

See `contracts/` directory for full interface definitions. Summary:

**ClipboardCheck Model**:
```typescript
interface ClipboardCheck {
  id: string;
  clipboardContentHash: string | null;
  clipboardContentPreview: string | null;
  actionTaken: ClipboardActionType;
  urlDetected: string | null;
  urlHash: string | null;
  isValidUrl: boolean;
  createdAt: number;
}

type ClipboardActionType =
  | 'prompted'
  | 'ignored_invalid'
  | 'ignored_duplicate'
  | 'ignored_empty';
```

**IgnoredUrl Model**:
```typescript
interface IgnoredUrl {
  id: string;
  url: string;
  urlHash: string;
  action: IgnoredUrlAction;
  createdAt: number;
  expiresAt: number;
}

type IgnoredUrlAction = 'dismissed' | 'saved';
```

**Repository Interfaces**: See `contracts/deduplication.interface.ts` for CRUD operations

---

## Data Validation Rules

### ClipboardCheck Validation:
- `id`: Must be valid UUID (generated via `generateId()`)
- `clipboardContentHash`: Optional SHA-256 hash (64 hex chars if present)
- `clipboardContentPreview`: Max 200 chars (truncated if longer)
- `actionTaken`: Must be one of 4 enum values
- `urlDetected`: Must be valid HTTP(S) URL if present
- `urlHash`: Must be SHA-256 hash (64 hex chars) if URL detected
- `isValidUrl`: Boolean (0 or 1)
- `createdAt`: Must be valid Unix timestamp (milliseconds)

### IgnoredUrl Validation:
- `id`: Must be valid UUID
- `url`: Must be valid HTTP(S) URL, max 2048 chars
- `urlHash`: Must be unique SHA-256 hash (64 hex chars)
- `action`: Must be 'dismissed' or 'saved'
- `createdAt`: Must be valid Unix timestamp
- `expiresAt`: Must be `createdAt + (5 * 60 * 1000)`

**Validation Implementation**: See `src/db/repositories/` for server-side validation logic

---

## Performance Considerations

### Query Performance:

| Query Type | Target Time | Optimization |
|------------|-------------|--------------|
| Deduplication check (ignored_urls) | <10ms | Index on url_hash (UNIQUE) |
| Insert clipboard check | <5ms | No foreign keys, simple insert |
| Cleanup expired URLs | <50ms | Index on expires_at, batched deletes |
| Analytics queries (last 24h) | <20ms | Index on created_at |

### Storage Estimates:

| Table | Max Records | Record Size | Total Storage |
|-------|-------------|-------------|---------------|
| `clipboard_checks` | ~10,000 (30 days) | ~200 bytes | ~2 MB |
| `ignored_urls` | ~500 (5 min window) | ~150 bytes | ~75 KB |

Total added storage: **~2.1 MB** (negligible on modern devices)

### Database Maintenance:

1. **Automatic Cleanup** (ignored_urls):
   - Triggered: Every 10 minutes in background
   - Query: `DELETE FROM ignored_urls WHERE expires_at < NOW()`
   - Duration: <50ms

2. **Manual Cleanup** (clipboard_checks):
   - Triggered: Weekly via settings menu or background task
   - Query: `DELETE FROM clipboard_checks WHERE created_at < (NOW() - 30 days)`
   - Duration: <100ms

---

## Testing Considerations

### Data Integrity Tests:
- ✅ UNIQUE constraint on `ignored_urls.url_hash` prevents duplicates
- ✅ CHECK constraints enforce valid enum values
- ✅ Indexes improve query performance (verify with EXPLAIN QUERY PLAN)
- ✅ Expiration logic prevents stale deduplication entries

### Migration Tests:
- ✅ Test v1 → v2 migration on existing database
- ✅ Verify schema_metadata.version increments
- ✅ Verify no data loss in existing tables
- ✅ Test idempotency (running migration twice has no effect)

### Edge Case Tests:
- ✅ Insert duplicate url_hash (should fail with UNIQUE constraint error)
- ✅ Insert invalid action_taken value (should fail CHECK constraint)
- ✅ Query with expired entries (should return empty result)
- ✅ Concurrent inserts/deletes (SQLite handles via locks)

---

## Summary

Two new tables added with clear separation of concerns:
- **clipboard_checks**: Analytics and debugging (long-term retention)
- **ignored_urls**: Deduplication state (short-term, auto-expiring)

Both tables follow existing conventions from Feature 001:
- TEXT primary keys (UUIDs)
- Integer timestamps (Unix milliseconds)
- Proper indexing for performance
- CHECK constraints for data integrity

Ready for implementation in Phase 2 (tasks generation).
