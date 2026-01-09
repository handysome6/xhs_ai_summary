/**
 * SQLite schema definitions for all database tables
 * Uses expo-sqlite with FTS5 for full-text search
 */

/**
 * SQL statements to create all tables
 */
export const CREATE_TABLES_SQL = `
-- Posts table: Core entity for saved XHS posts
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY NOT NULL,
  url TEXT NOT NULL,
  url_hash TEXT NOT NULL UNIQUE,
  title TEXT,
  download_status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_posts_url_hash ON posts(url_hash);
CREATE INDEX IF NOT EXISTS idx_posts_download_status ON posts(download_status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- Content table: Extracted text content from posts
CREATE TABLE IF NOT EXISTS content (
  id TEXT PRIMARY KEY NOT NULL,
  post_id TEXT NOT NULL UNIQUE,
  text TEXT NOT NULL,
  author_name TEXT,
  author_id TEXT,
  original_date INTEGER,
  view_count INTEGER,
  like_count INTEGER,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_content_post_id ON content(post_id);

-- Media table: Images and videos associated with posts
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY NOT NULL,
  post_id TEXT NOT NULL,
  type TEXT NOT NULL,
  remote_url TEXT NOT NULL,
  local_path TEXT,
  file_size INTEGER,
  download_status TEXT NOT NULL DEFAULT 'pending',
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_media_post_id ON media(post_id);
CREATE INDEX IF NOT EXISTS idx_media_download_status ON media(download_status);

-- Groups table: AI-generated groupings of related posts
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  post_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(name);

-- AI Results table: AI-generated analysis for posts
CREATE TABLE IF NOT EXISTS ai_results (
  id TEXT PRIMARY KEY NOT NULL,
  post_id TEXT NOT NULL UNIQUE,
  labels TEXT NOT NULL,
  summary TEXT NOT NULL,
  group_id TEXT,
  content_type TEXT,
  model_version TEXT NOT NULL,
  analyzed_at INTEGER NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_results_post_id ON ai_results(post_id);
CREATE INDEX IF NOT EXISTS idx_ai_results_group_id ON ai_results(group_id);
CREATE INDEX IF NOT EXISTS idx_ai_results_content_type ON ai_results(content_type);

-- Download Tasks table: Background download operation tracking
CREATE TABLE IF NOT EXISTS download_tasks (
  id TEXT PRIMARY KEY NOT NULL,
  post_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  progress REAL NOT NULL DEFAULT 0,
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_download_tasks_post_id ON download_tasks(post_id);
CREATE INDEX IF NOT EXISTS idx_download_tasks_status ON download_tasks(status);

-- Full-text search virtual table for posts
CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
  title,
  text,
  author_name,
  labels,
  summary,
  content='',
  tokenize='unicode61'
);

-- Metadata table for schema version tracking
CREATE TABLE IF NOT EXISTS schema_metadata (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
`;

/**
 * SQL to drop all tables (for reset/testing)
 */
export const DROP_TABLES_SQL = `
DROP TABLE IF EXISTS posts_fts;
DROP TABLE IF EXISTS download_tasks;
DROP TABLE IF EXISTS ai_results;
DROP TABLE IF EXISTS groups;
DROP TABLE IF EXISTS media;
DROP TABLE IF EXISTS content;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS schema_metadata;
`;

/**
 * Current schema version
 */
export const SCHEMA_VERSION = 1;

/**
 * Table names as constants
 */
export const TABLE_NAMES = {
  POSTS: 'posts',
  CONTENT: 'content',
  MEDIA: 'media',
  GROUPS: 'groups',
  AI_RESULTS: 'ai_results',
  DOWNLOAD_TASKS: 'download_tasks',
  POSTS_FTS: 'posts_fts',
  SCHEMA_METADATA: 'schema_metadata',
} as const;

/**
 * Column mappings for TypeScript to SQLite conversion
 */
export const COLUMN_MAPPINGS = {
  posts: {
    id: 'id',
    url: 'url',
    urlHash: 'url_hash',
    title: 'title',
    downloadStatus: 'download_status',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  content: {
    id: 'id',
    postId: 'post_id',
    text: 'text',
    authorName: 'author_name',
    authorId: 'author_id',
    originalDate: 'original_date',
    viewCount: 'view_count',
    likeCount: 'like_count',
  },
  media: {
    id: 'id',
    postId: 'post_id',
    type: 'type',
    remoteUrl: 'remote_url',
    localPath: 'local_path',
    fileSize: 'file_size',
    downloadStatus: 'download_status',
    sortOrder: 'sort_order',
  },
  groups: {
    id: 'id',
    name: 'name',
    description: 'description',
    postCount: 'post_count',
    createdAt: 'created_at',
  },
  aiResults: {
    id: 'id',
    postId: 'post_id',
    labels: 'labels',
    summary: 'summary',
    groupId: 'group_id',
    contentType: 'content_type',
    modelVersion: 'model_version',
    analyzedAt: 'analyzed_at',
  },
  downloadTasks: {
    id: 'id',
    postId: 'post_id',
    status: 'status',
    progress: 'progress',
    retryCount: 'retry_count',
    errorMessage: 'error_message',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
} as const;
