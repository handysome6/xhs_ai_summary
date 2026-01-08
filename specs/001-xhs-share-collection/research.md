# Research: XHS Share Collection

**Feature**: 001-xhs-share-collection
**Date**: 2026-01-08
**Status**: Complete

## Executive Summary

This document captures research findings for implementing the XHS Share Collection mobile app. Key decisions include using React Native with Expo for cross-platform development, a Node.js backend for XHS content crawling, and Claude/OpenAI APIs for AI-powered content analysis.

---

## 1. React Native Share Intent Handling

### Decision
Use `react-native-receive-sharing-intent` or `react-native-share-menu` for receiving shared URLs from XHS app.

### Rationale
- Mature libraries with active maintenance
- Support for both iOS Share Extension and Android Intent Filters
- Handle app launch from share action (cold start)
- Queue multiple shares when app receives them in rapid succession

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|--------------|
| Native modules from scratch | High development cost, maintenance burden |
| Expo ShareIntent (experimental) | Not yet stable in Expo SDK |
| Deep linking only | Doesn't support system share sheet |

### Implementation Notes
```typescript
// iOS: Info.plist configuration for Share Extension
// Android: AndroidManifest.xml intent-filter for text/plain MIME type
// Listen for share events on app mount
// Extract XHS URL from shared content
// Validate URL pattern: xiaohongshu.com/explore/* or xhslink.com/*
```

---

## 2. XHS Content Crawling

### Decision
Server-side crawling using Puppeteer (headless Chrome) on Node.js backend.

### Rationale
- XHS renders content via JavaScript - static HTML parsing insufficient
- Server-side avoids CORS restrictions that block client-side requests
- Puppeteer provides full browser environment for dynamic content
- Can handle anti-bot measures with proper configuration

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|--------------|
| Client-side WebView scraping | Platform-specific, battery drain, complex |
| Reverse-engineering XHS API | Fragile, potential ToS issues, auth required |
| Third-party scraping service | Cost, data privacy concerns |

### Implementation Notes
```typescript
// Puppeteer flow:
// 1. Navigate to XHS post URL
// 2. Wait for content to render (networkidle2)
// 3. Extract: title, text, author, images[], videoUrl?
// 4. Parse image URLs from <img> tags and CSS backgrounds
// 5. Handle pagination for long posts
// 6. Return structured JSON response
```

### XHS URL Patterns
- Full URL: `https://www.xiaohongshu.com/explore/{postId}`
- Short URL: `https://xhslink.com/{shortCode}` (redirects to full URL)
- App share format: May include tracking params to strip

---

## 3. Media Download Strategy

### Decision
Sequential download with priority queue, progress tracking, and automatic retry.

### Rationale
- Sequential prevents overwhelming device network/storage
- Priority queue handles multiple shares gracefully
- Retry mechanism handles intermittent network failures
- Progress tracking provides user feedback

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|--------------|
| Parallel downloads | Network congestion, battery drain |
| Download on demand only | Poor offline experience |
| Stream without caching | No offline support |

### Implementation Notes
```typescript
// Download manager responsibilities:
// 1. Queue downloads by post (text first, then images, then video)
// 2. Track progress per file and aggregate per post
// 3. Store to app's document directory (persists across updates)
// 4. Validate file integrity after download
// 5. Retry failed downloads with exponential backoff
// 6. Respect 100MB video limit - skip and notify user
```

### Storage Paths
- Images: `{documentDir}/posts/{postId}/images/{index}.jpg`
- Videos: `{documentDir}/posts/{postId}/video.mp4`
- Text stored in SQLite, not filesystem

---

## 4. AI Analysis Service

### Decision
Use Claude API (Anthropic) for Chinese language understanding, labeling, and summarization.

### Rationale
- Excellent Chinese language capabilities
- Structured output support for consistent label/summary format
- Reasonable cost for personal use volume
- API key secured on backend, not exposed in mobile app

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|--------------|
| OpenAI GPT-4 | Similar capability, Claude slightly better for Chinese |
| On-device ML | No good Chinese NLP models available, large download |
| Custom fine-tuned model | Development cost, hosting complexity |
| Baidu/Alibaba AI | API complexity, less developer-friendly |

### Implementation Notes
```typescript
// AI service flow:
// 1. Receive post text content from mobile app
// 2. Call Claude API with structured prompt:
//    - Generate 3-5 category labels
//    - Generate 2-3 sentence summary
//    - Suggest group ID based on content similarity
// 3. Parse structured response
// 4. Store results with model version for reproducibility
```

### Prompt Design
```text
Analyze this Xiaohongshu post and return JSON:
{
  "labels": ["category1", "category2", ...], // 3-5 relevant categories
  "summary": "Brief summary in 2-3 sentences",
  "contentType": "tutorial|review|lifestyle|travel|food|fashion|other"
}

Post content:
{text}
```

---

## 5. Local Database Schema

### Decision
SQLite with expo-sqlite, single database file, normalized schema.

### Rationale
- SQLite has excellent React Native support
- expo-sqlite works in Expo managed workflow
- Single file simplifies backup/restore
- Normalized schema enables efficient queries for search/filter

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|--------------|
| Realm | Larger bundle size, overkill for single-user |
| WatermelonDB | More complex setup, sync features unneeded |
| AsyncStorage | Not suitable for structured/queryable data |
| MMKV | Key-value only, no SQL queries |

### Schema Preview
```sql
-- Core tables
posts (id, url, title, created_at, download_status)
content (id, post_id, text, author, original_date)
media (id, post_id, type, url, local_path, size_bytes)
ai_results (id, post_id, labels_json, summary, group_id, model_version, analyzed_at)
download_tasks (id, post_id, status, progress, retry_count, error)
```

---

## 6. Search Implementation

### Decision
SQLite FTS5 (Full-Text Search) for local search across post content and AI summaries.

### Rationale
- Built into SQLite, no additional dependencies
- Fast full-text search with Chinese tokenization support
- Relevance ranking built-in
- Works offline

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|--------------|
| Simple LIKE queries | Too slow for large collections |
| External search service | Requires network, complexity |
| In-memory search | Memory constraints on mobile |

### Implementation Notes
```sql
-- FTS5 virtual table
CREATE VIRTUAL TABLE posts_fts USING fts5(
  title, text, summary,
  content='posts',
  tokenize='unicode61'
);

-- Search query
SELECT * FROM posts_fts WHERE posts_fts MATCH 'search terms';
```

---

## 7. Background Task Management

### Decision
Use expo-task-manager for background downloads and expo-background-fetch for periodic tasks.

### Rationale
- Official Expo solution for background execution
- Works within Expo managed workflow
- Handles iOS/Android background execution differences
- Integrates with app lifecycle

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|--------------|
| Native background modules | Requires ejecting from Expo |
| Foreground service only | Downloads stop when app backgrounded |
| Web workers | Limited in React Native environment |

### Implementation Notes
```typescript
// Task types:
// 1. Download task: Triggered when new post saved, continues in background
// 2. Retry task: Periodic check for failed downloads
// 3. AI analysis task: Triggered after download completes

// Task manager handles:
// - Task persistence across app restarts
// - Progress updates to UI
// - Battery-aware scheduling
```

---

## 8. Grouping Algorithm

### Decision
AI-driven semantic grouping via Claude API, with cached group assignments.

### Rationale
- Semantic understanding of content relationships
- No need for complex on-device ML
- Groups can evolve as more posts added
- Simple implementation via API call

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|--------------|
| Manual user grouping | Defeats automation goal |
| Label-based grouping | Too simplistic, misses semantic relationships |
| On-device clustering | No good models for Chinese text embeddings |

### Implementation Notes
```typescript
// Grouping flow:
// 1. When analyzing new post, include recent post summaries as context
// 2. AI suggests group_id or "new_group"
// 3. Store group_id with post
// 4. Display groups as browsable categories in UI
// 5. Periodically re-analyze ungrouped posts
```

---

## Dependencies Summary

### Mobile (React Native/Expo)
| Package | Purpose | Version |
|---------|---------|---------|
| expo | Managed workflow | ~50.x |
| expo-sqlite | Local database | ~13.x |
| expo-file-system | File operations | ~16.x |
| expo-task-manager | Background tasks | ~11.x |
| react-native-share-menu | Share intent | ^6.x |
| axios | HTTP client | ^1.6.x |
| zustand | State management | ^4.x |

### Backend (Node.js)
| Package | Purpose | Version |
|---------|---------|---------|
| express | HTTP server | ^4.18.x |
| puppeteer | Web scraping | ^22.x |
| @anthropic-ai/sdk | Claude API | ^0.x |
| dotenv | Environment config | ^16.x |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| XHS blocks crawling | Medium | High | User-agent rotation, rate limiting, fallback to manual entry |
| AI API costs | Low | Medium | Cache results, batch requests, monitor usage |
| XHS page structure changes | High | Medium | Modular scraper with easy selector updates |
| Large video downloads | Medium | Medium | Enforce 100MB limit, background download |
| Share intent edge cases | Medium | Low | Comprehensive URL validation, error handling |

---

## Open Questions (Resolved)

All technical questions resolved during research. Implementation can proceed.
