# Implementation Plan: XHS Share Collection

**Branch**: `001-xhs-share-collection` | **Date**: 2026-01-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-xhs-share-collection/spec.md`

## Summary

Build a cross-platform mobile app using React Native that allows users to save Xiaohongshu (XHS) posts via system share functionality. The app will automatically download post content (text, images, videos up to 100MB) for offline access, and use AI services to generate labels, groupings, and summaries. Single-user per device with local SQLite storage.

## Technical Context

**Language/Version**: TypeScript 5.x with React Native 0.73+
**Primary Dependencies**: React Native, Expo (managed workflow), SQLite (expo-sqlite), axios, react-native-share-menu
**Storage**: SQLite for metadata/AI results, file system for media (images/videos)
**Testing**: Jest for unit tests, Detox for E2E tests
**Target Platform**: iOS 14+ and Android 10+ (cross-platform via React Native)
**Project Type**: Mobile application with optional backend API for AI processing
**Performance Goals**: <5s share-to-save, <1s search results, 60fps scrolling, <2min image downloads
**Constraints**: Offline-capable viewing, 100MB max video size, local-only storage (no auth)
**Scale/Scope**: Single-user, up to 1000+ posts, 4 main screens (Home, Post Detail, Search, Settings)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status | Notes |
|-----------|-------------|--------|-------|
| I. Cross-Platform First | Features work on iOS and Android | ✅ PASS | React Native ensures shared codebase |
| I. Cross-Platform First | Platform code isolated behind interfaces | ✅ PASS | Share handlers abstracted, native modules isolated |
| II. User Privacy & Data Isolation | Per-user isolated storage | ✅ PASS | Single-user device model, local SQLite |
| II. User Privacy & Data Isolation | Local-first storage | ✅ PASS | All data stored locally, no cloud required |
| III. Offline-Capable Core | Viewing works offline | ✅ PASS | SQLite + local files accessible offline |
| III. Offline-Capable Core | Graceful network failure handling | ✅ PASS | Retry queue with user feedback |
| IV. AI Analysis Transparency | Clear AI vs original content | ✅ PASS | UI badges distinguish AI content |
| IV. AI Analysis Transparency | Versioned analysis results | ✅ PASS | Model version stored with results |
| V. Simplicity & Performance | Minimal feature set | ✅ PASS | 4 user stories, focused scope |
| V. Simplicity & Performance | Background operations non-blocking | ✅ PASS | Downloads/AI run in background |

**Gate Result**: ✅ All constitution checks PASS

## Project Structure

### Documentation (this feature)

```text
specs/001-xhs-share-collection/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API schemas)
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
mobile/
├── app/                          # Expo Router app directory
│   ├── (tabs)/                   # Tab navigation
│   │   ├── index.tsx             # Home/Collection screen
│   │   ├── search.tsx            # Search & Filter screen
│   │   └── settings.tsx          # Settings screen
│   ├── post/
│   │   └── [id].tsx              # Post detail screen
│   └── _layout.tsx               # Root layout
├── src/
│   ├── components/               # Reusable UI components
│   │   ├── PostCard.tsx
│   │   ├── PostList.tsx
│   │   ├── MediaViewer.tsx
│   │   ├── DownloadProgress.tsx
│   │   ├── AIBadge.tsx
│   │   └── SearchBar.tsx
│   ├── services/                 # Business logic
│   │   ├── share-handler.ts      # System share intent handling
│   │   ├── xhs-crawler.ts        # Content extraction from XHS
│   │   ├── download-manager.ts   # Media download with queue
│   │   ├── ai-analyzer.ts        # AI service integration
│   │   └── search-service.ts     # Local search functionality
│   ├── db/                       # Database layer
│   │   ├── schema.ts             # SQLite schema definitions
│   │   ├── migrations.ts         # Schema migrations
│   │   └── repository.ts         # Data access methods
│   ├── models/                   # TypeScript types/interfaces
│   │   ├── post.ts
│   │   ├── content.ts
│   │   ├── ai-result.ts
│   │   └── download-task.ts
│   ├── hooks/                    # React hooks
│   │   ├── usePosts.ts
│   │   ├── useDownloadProgress.ts
│   │   └── useSearch.ts
│   └── utils/                    # Utilities
│       ├── url-validator.ts      # XHS URL validation
│       ├── file-manager.ts       # Local file operations
│       └── constants.ts
├── assets/                       # Static assets
└── __tests__/                    # Test files
    ├── unit/
    ├── integration/
    └── e2e/

api/                              # Backend API (Node.js/Express)
├── src/
│   ├── routes/
│   │   ├── crawl.ts              # XHS content crawling endpoint
│   │   └── analyze.ts            # AI analysis endpoint
│   ├── services/
│   │   ├── xhs-scraper.ts        # Puppeteer-based XHS scraper
│   │   └── ai-service.ts         # AI model integration
│   └── index.ts
└── tests/
```

**Structure Decision**: Mobile + API architecture selected. React Native app handles UI, local storage, and share handling. Lightweight Node.js API handles XHS crawling (requires server-side JS execution) and AI analysis (requires API keys that shouldn't be in mobile app).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Separate API server | XHS crawling requires server-side JS execution with Puppeteer; AI API keys must be secured | Client-side crawling blocked by CORS; embedding API keys in mobile app is insecure |

## Key Technical Decisions

### 1. Content Crawling Strategy

XHS posts require JavaScript execution to render content. Options:
- **Server-side Puppeteer** (selected): Reliable, handles dynamic content, keeps complexity off device
- Client-side WebView scraping: Complex, platform-specific, battery drain
- Reverse-engineering XHS API: Fragile, potentially ToS violation

### 2. AI Service Integration

For labeling, grouping, and summarization:
- **Cloud AI API** (selected): OpenAI/Claude API for Chinese language understanding
- On-device ML: Limited Chinese NLP models, large download size
- Custom model: Development cost too high for personal app

### 3. Local Storage Architecture

- **SQLite** for structured data: Fast queries, offline-capable, mature React Native support
- **File system** for media: Direct file access for images/videos, efficient for large files
- Realm/WatermelonDB considered but SQLite sufficient for single-user scale

### 4. Share Intent Handling

- **react-native-share-menu** for receiving shares from XHS app
- Platform-specific configuration for iOS Share Extension and Android Intent Filter
- Background processing queue for handling multiple rapid shares
