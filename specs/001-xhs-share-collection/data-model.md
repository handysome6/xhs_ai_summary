# Data Model: XHS Share Collection

**Feature**: 001-xhs-share-collection
**Date**: 2026-01-08
**Storage**: SQLite (expo-sqlite) + File System

---

## Entity Relationship Diagram

```text
┌─────────────────┐       ┌─────────────────┐
│      Post       │       │  DownloadTask   │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │◄──────│ post_id (FK)    │
│ url             │       │ status          │
│ url_hash        │       │ progress        │
│ title           │       │ retry_count     │
│ download_status │       │ error_message   │
│ created_at      │       │ created_at      │
│ updated_at      │       │ updated_at      │
└────────┬────────┘       └─────────────────┘
         │
         │ 1:1
         ▼
┌─────────────────┐
│     Content     │
├─────────────────┤
│ id (PK)         │
│ post_id (FK)    │
│ text            │
│ author_name     │
│ author_id       │
│ original_date   │
│ view_count      │
│ like_count      │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐       ┌─────────────────┐
│      Media      │       │    AIResult     │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ post_id (FK)    │       │ post_id (FK)    │
│ type            │       │ labels          │
│ remote_url      │       │ summary         │
│ local_path      │       │ group_id        │
│ file_size       │       │ content_type    │
│ download_status │       │ model_version   │
│ sort_order      │       │ analyzed_at     │
└─────────────────┘       └─────────────────┘

┌─────────────────┐
│     Group       │
├─────────────────┤
│ id (PK)         │
│ name            │
│ description     │
│ post_count      │
│ created_at      │
└─────────────────┘
```

---

## Entities

### Post

Primary entity representing a saved XHS post.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | TEXT | PK, UUID | Unique identifier |
| url | TEXT | NOT NULL | Original XHS post URL |
| url_hash | TEXT | UNIQUE, NOT NULL | SHA256 hash of normalized URL (for dedup) |
| title | TEXT | | Post title (extracted or first line of text) |
| download_status | TEXT | NOT NULL, DEFAULT 'pending' | Overall download state |
| created_at | INTEGER | NOT NULL | Unix timestamp when saved |
| updated_at | INTEGER | NOT NULL | Unix timestamp of last update |

**Download Status Values**:
- `pending` - Just saved, not yet processed
- `downloading` - Content extraction in progress
- `completed` - All content downloaded successfully
- `partial` - Some content failed (e.g., video too large)
- `failed` - Critical failure, needs retry

**Validation Rules**:
- URL must match XHS patterns: `xiaohongshu.com/explore/*` or `xhslink.com/*`
- url_hash computed from normalized URL (strip tracking params)

---

### Content

Extracted text content and metadata from the XHS post.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | TEXT | PK, UUID | Unique identifier |
| post_id | TEXT | FK → Post.id, UNIQUE | Parent post reference |
| text | TEXT | NOT NULL | Full post text content |
| author_name | TEXT | | Original author's display name |
| author_id | TEXT | | Original author's XHS ID |
| original_date | INTEGER | | Unix timestamp of original post |
| view_count | INTEGER | | View count at time of crawl |
| like_count | INTEGER | | Like count at time of crawl |

**Validation Rules**:
- text cannot be empty (at minimum, title should be present)
- One Content per Post (1:1 relationship)

---

### Media

Individual media files (images/videos) associated with a post.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | TEXT | PK, UUID | Unique identifier |
| post_id | TEXT | FK → Post.id | Parent post reference |
| type | TEXT | NOT NULL | 'image' or 'video' |
| remote_url | TEXT | NOT NULL | Original URL on XHS CDN |
| local_path | TEXT | | Relative path in app storage |
| file_size | INTEGER | | Size in bytes (null until downloaded) |
| download_status | TEXT | NOT NULL, DEFAULT 'pending' | Individual file status |
| sort_order | INTEGER | NOT NULL, DEFAULT 0 | Display order |

**Download Status Values**:
- `pending` - Not yet downloaded
- `downloading` - Download in progress
- `completed` - Successfully downloaded
- `failed` - Download failed
- `skipped` - Skipped (e.g., video > 100MB)

**Validation Rules**:
- type must be 'image' or 'video'
- Videos limited to 100MB (file_size <= 104857600)
- local_path format: `posts/{post_id}/media/{id}.{ext}`

---

### AIResult

AI-generated analysis results for a post.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | TEXT | PK, UUID | Unique identifier |
| post_id | TEXT | FK → Post.id, UNIQUE | Parent post reference |
| labels | TEXT | NOT NULL | JSON array of category labels |
| summary | TEXT | NOT NULL | 2-3 sentence summary |
| group_id | TEXT | FK → Group.id | Assigned group (nullable) |
| content_type | TEXT | | Primary content category |
| model_version | TEXT | NOT NULL | AI model identifier |
| analyzed_at | INTEGER | NOT NULL | Unix timestamp of analysis |

**Content Type Values**:
- `tutorial` - How-to guides, tips
- `review` - Product/service reviews
- `lifestyle` - Daily life content
- `travel` - Travel experiences
- `food` - Food and recipes
- `fashion` - Fashion and beauty
- `other` - Uncategorized

**Validation Rules**:
- labels must be valid JSON array with 3-5 strings
- summary should be 50-300 characters
- model_version tracks which AI model generated results

---

### Group

AI-generated groupings of related posts.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | TEXT | PK, UUID | Unique identifier |
| name | TEXT | NOT NULL | Group display name |
| description | TEXT | | Brief group description |
| post_count | INTEGER | NOT NULL, DEFAULT 0 | Cached count of posts |
| created_at | INTEGER | NOT NULL | Unix timestamp |

**Validation Rules**:
- name should be descriptive (5-50 characters)
- post_count updated via trigger when AIResult changes

---

### DownloadTask

Background download operation tracking.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | TEXT | PK, UUID | Unique identifier |
| post_id | TEXT | FK → Post.id | Target post |
| status | TEXT | NOT NULL, DEFAULT 'queued' | Task state |
| progress | REAL | NOT NULL, DEFAULT 0 | 0.0 to 1.0 completion |
| retry_count | INTEGER | NOT NULL, DEFAULT 0 | Number of retry attempts |
| error_message | TEXT | | Last error description |
| created_at | INTEGER | NOT NULL | Unix timestamp |
| updated_at | INTEGER | NOT NULL | Unix timestamp |

**Status Values**:
- `queued` - Waiting to start
- `crawling` - Extracting content from XHS
- `downloading` - Downloading media files
- `analyzing` - AI analysis in progress
- `completed` - All tasks done
- `failed` - Terminal failure

**State Transitions**:
```text
queued → crawling → downloading → analyzing → completed
           ↓            ↓             ↓
         failed       failed       failed
           ↓            ↓             ↓
         queued      queued        queued  (on retry)
```

---

## SQLite Schema

```sql
-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  url_hash TEXT NOT NULL UNIQUE,
  title TEXT,
  download_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (download_status IN ('pending', 'downloading', 'completed', 'partial', 'failed')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_download_status ON posts(download_status);

-- Content table
CREATE TABLE IF NOT EXISTS content (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL UNIQUE REFERENCES posts(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  author_name TEXT,
  author_id TEXT,
  original_date INTEGER,
  view_count INTEGER,
  like_count INTEGER
);

-- Media table
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  remote_url TEXT NOT NULL,
  local_path TEXT,
  file_size INTEGER,
  download_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (download_status IN ('pending', 'downloading', 'completed', 'failed', 'skipped')),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_media_post_id ON media(post_id);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  post_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- AI Results table
CREATE TABLE IF NOT EXISTS ai_results (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL UNIQUE REFERENCES posts(id) ON DELETE CASCADE,
  labels TEXT NOT NULL, -- JSON array
  summary TEXT NOT NULL,
  group_id TEXT REFERENCES groups(id) ON DELETE SET NULL,
  content_type TEXT CHECK (content_type IN ('tutorial', 'review', 'lifestyle', 'travel', 'food', 'fashion', 'other')),
  model_version TEXT NOT NULL,
  analyzed_at INTEGER NOT NULL
);

CREATE INDEX idx_ai_results_group_id ON ai_results(group_id);

-- Download Tasks table
CREATE TABLE IF NOT EXISTS download_tasks (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'crawling', 'downloading', 'analyzing', 'completed', 'failed')),
  progress REAL NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 1),
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_download_tasks_status ON download_tasks(status);

-- Full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
  title,
  text,
  summary,
  content='',
  tokenize='unicode61'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER posts_fts_insert AFTER INSERT ON content BEGIN
  INSERT INTO posts_fts(rowid, title, text, summary)
  SELECT p.rowid, p.title, NEW.text, COALESCE(ar.summary, '')
  FROM posts p
  LEFT JOIN ai_results ar ON ar.post_id = p.id
  WHERE p.id = NEW.post_id;
END;

CREATE TRIGGER posts_fts_update AFTER UPDATE ON ai_results BEGIN
  UPDATE posts_fts SET summary = NEW.summary WHERE rowid = (
    SELECT rowid FROM posts WHERE id = NEW.post_id
  );
END;

CREATE TRIGGER posts_fts_delete AFTER DELETE ON content BEGIN
  DELETE FROM posts_fts WHERE rowid = (
    SELECT rowid FROM posts WHERE id = OLD.post_id
  );
END;

-- Group post count trigger
CREATE TRIGGER update_group_count_insert AFTER INSERT ON ai_results
WHEN NEW.group_id IS NOT NULL BEGIN
  UPDATE groups SET post_count = post_count + 1 WHERE id = NEW.group_id;
END;

CREATE TRIGGER update_group_count_delete AFTER DELETE ON ai_results
WHEN OLD.group_id IS NOT NULL BEGIN
  UPDATE groups SET post_count = post_count - 1 WHERE id = OLD.group_id;
END;
```

---

## TypeScript Interfaces

```typescript
// models/post.ts
export interface Post {
  id: string;
  url: string;
  urlHash: string;
  title: string | null;
  downloadStatus: 'pending' | 'downloading' | 'completed' | 'partial' | 'failed';
  createdAt: number;
  updatedAt: number;
}

// models/content.ts
export interface Content {
  id: string;
  postId: string;
  text: string;
  authorName: string | null;
  authorId: string | null;
  originalDate: number | null;
  viewCount: number | null;
  likeCount: number | null;
}

// models/media.ts
export interface Media {
  id: string;
  postId: string;
  type: 'image' | 'video';
  remoteUrl: string;
  localPath: string | null;
  fileSize: number | null;
  downloadStatus: 'pending' | 'downloading' | 'completed' | 'failed' | 'skipped';
  sortOrder: number;
}

// models/ai-result.ts
export interface AIResult {
  id: string;
  postId: string;
  labels: string[];
  summary: string;
  groupId: string | null;
  contentType: 'tutorial' | 'review' | 'lifestyle' | 'travel' | 'food' | 'fashion' | 'other' | null;
  modelVersion: string;
  analyzedAt: number;
}

// models/group.ts
export interface Group {
  id: string;
  name: string;
  description: string | null;
  postCount: number;
  createdAt: number;
}

// models/download-task.ts
export interface DownloadTask {
  id: string;
  postId: string;
  status: 'queued' | 'crawling' | 'downloading' | 'analyzing' | 'completed' | 'failed';
  progress: number;
  retryCount: number;
  errorMessage: string | null;
  createdAt: number;
  updatedAt: number;
}

// Composite type for UI display
export interface PostWithDetails {
  post: Post;
  content: Content | null;
  media: Media[];
  aiResult: AIResult | null;
  downloadTask: DownloadTask | null;
}
```

---

## File System Structure

```text
{documentDirectory}/
├── posts/
│   ├── {post_id_1}/
│   │   ├── media/
│   │   │   ├── {media_id_1}.jpg
│   │   │   ├── {media_id_2}.jpg
│   │   │   └── {media_id_3}.mp4
│   │   └── thumbnail.jpg      # First image as thumbnail
│   └── {post_id_2}/
│       └── media/
│           └── ...
└── cache/
    └── thumbnails/            # Generated thumbnails for list view
```

---

## Migration Strategy

### Version 1 (Initial)
- Create all tables as defined above
- Initialize FTS5 virtual table

### Future Migrations
- Use migration version table to track applied migrations
- Each migration has up/down SQL scripts
- Run migrations on app launch before UI renders
