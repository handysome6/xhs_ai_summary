# Tasks: XHS Share Collection

**Input**: Design documents from `/specs/001-xhs-share-collection/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/api.yaml

**Tests**: Tests are NOT explicitly requested in the feature specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Mobile app**: `mobile/` (React Native with Expo)
- **Backend API**: `api/` (Node.js/Express)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for both mobile app and backend API

- [x] T001 Create mobile project structure with Expo: `npx create-expo-app mobile --template expo-template-blank-typescript`
- [x] T002 Create API project structure: `mkdir api && cd api && npm init -y`
- [x] T003 [P] Configure mobile dependencies in mobile/package.json (expo-sqlite, expo-file-system, expo-task-manager, react-native-share-menu, axios, zustand)
- [x] T004 [P] Configure API dependencies in api/package.json (express, puppeteer, @anthropic-ai/sdk, dotenv, cors)
- [x] T005 [P] Configure TypeScript and ESLint for mobile in mobile/tsconfig.json and mobile/.eslintrc.js
- [x] T006 [P] Configure TypeScript and ESLint for API in api/tsconfig.json and api/.eslintrc.js
- [x] T007 [P] Create mobile environment config in mobile/.env and mobile/src/utils/constants.ts
- [x] T008 [P] Create API environment config in api/.env and api/src/config.ts
- [x] T009 Setup Expo Router file structure in mobile/app/_layout.tsx with tab navigation

**Checkpoint**: Both projects initialized with dependencies and configuration ready

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Mobile Foundation

- [x] T010 Create Post interface in mobile/src/models/post.ts
- [x] T011 [P] Create Content interface in mobile/src/models/content.ts
- [x] T012 [P] Create Media interface in mobile/src/models/media.ts
- [x] T013 [P] Create AIResult interface in mobile/src/models/ai-result.ts
- [x] T014 [P] Create Group interface in mobile/src/models/group.ts
- [x] T015 [P] Create DownloadTask interface in mobile/src/models/download-task.ts
- [x] T016 Create SQLite schema definitions in mobile/src/db/schema.ts (all tables: posts, content, media, ai_results, groups, download_tasks, posts_fts)
- [x] T017 Create database migrations in mobile/src/db/migrations.ts with version 1 initial schema
- [x] T018 Create repository base with database initialization in mobile/src/db/repository.ts
- [x] T018.5 Configure SQLite encryption using expo-secure-store for key management in mobile/src/db/encryption.ts (Constitution II compliance)
- [x] T019 [P] Create URL validator utility in mobile/src/utils/url-validator.ts (XHS URL patterns)
- [x] T020 [P] Create file manager utility in mobile/src/utils/file-manager.ts (paths, directories)
- [x] T021 Create API client service in mobile/src/services/api-client.ts (axios wrapper for backend)

### API Foundation

- [x] T022 Create Express server entry point in api/src/index.ts with middleware setup
- [x] T023 [P] Create health check route in api/src/routes/health.ts (GET /api/v1/health)
- [x] T024 [P] Create error handling middleware in api/src/middleware/error-handler.ts
- [x] T025 [P] Create request validation middleware in api/src/middleware/validator.ts

**Checkpoint**: Foundation ready - database schema, models, API server running - user story implementation can now begin

---

## Phase 3: User Story 1 - Share and View Posts (Priority: P1) 🎯 MVP

**Goal**: Users can share XHS post links to the app and view their saved collection

**Independent Test**: Share an XHS post link via system share sheet, open app, verify post appears in collection list with URL and timestamp

### Implementation for User Story 1

#### Share Intent Handling

- [ ] T026 [US1] Configure iOS Share Extension in mobile/ios/ (Info.plist, share extension target)
- [ ] T027 [US1] Configure Android Intent Filter in mobile/android/app/src/main/AndroidManifest.xml
- [x] T028 [US1] Implement share handler service in mobile/src/services/share-handler.ts (receive URL, validate, create post)
- [x] T029 [US1] Add share intent listener in mobile/app/_layout.tsx (useEffect on app mount)

#### Post Repository Operations

- [x] T030 [US1] Implement createPost() in mobile/src/db/repositories/post-repository.ts (insert with URL hash for dedup)
- [x] T031 [US1] Implement getPostByUrlHash() in mobile/src/db/repositories/post-repository.ts (duplicate detection)
- [x] T032 [US1] Implement getAllPosts() in mobile/src/db/repositories/post-repository.ts (ordered by created_at DESC)
- [x] T033 [US1] Implement deletePost() in mobile/src/db/repositories/post-repository.ts (cascade delete content, media)

#### UI Components

- [x] T034 [P] [US1] Create PostCard component in mobile/src/components/PostCard.tsx (URL, timestamp, status badge)
- [x] T035 [P] [US1] Create PostList component in mobile/src/components/PostList.tsx (FlatList with PostCard)
- [x] T036 [US1] Create usePosts hook in mobile/src/stores/post-store.ts (zustand store for posts state)
- [x] T037 [US1] Implement Home screen in mobile/app/(tabs)/index.tsx (PostList, empty state, pull-to-refresh)
- [x] T038 [US1] Add share confirmation toast/modal in mobile/src/components/ShareConfirmation.tsx
- [x] T039 [US1] Implement swipe-to-delete on PostCard in mobile/src/components/PostCard.tsx

**Checkpoint**: User Story 1 complete - users can share XHS links and view/delete posts in collection

---

## Phase 4: User Story 2 - Automatic Content Download (Priority: P2)

**Goal**: System automatically downloads post content (text, images, videos) for offline access

**Independent Test**: Share a post, wait for background processing, enable airplane mode, verify text and media viewable offline

### API Crawling Endpoint

- [x] T040 [US2] Implement XHS scraper service in api/src/services/xhs-scraper.ts (Puppeteer-based extraction)
- [x] T041 [US2] Implement crawl route in api/src/routes/crawl.ts (POST /api/v1/crawl per contract)
- [x] T042 [US2] Add URL validation and normalization in api/src/services/xhs-scraper.ts
- [x] T043 [US2] Handle XHS page variations and error cases in api/src/services/xhs-scraper.ts

### Mobile Download Manager

- [x] T044 [US2] Implement XHS crawler client in mobile/src/services/xhs-crawler.ts (calls API /crawl endpoint)
- [x] T045 [US2] Implement download manager in mobile/src/services/download-manager.ts (queue, progress, retry)
- [x] T046 [US2] Implement media download logic in mobile/src/services/download-manager.ts (images, videos with 100MB limit)
- [x] T047 [US2] Implement background task registration in mobile/src/services/download-manager.ts (expo-task-manager)

### Repository Extensions

- [x] T048 [US2] Implement createContent() in mobile/src/db/repositories/content-repository.ts
- [x] T049 [US2] Implement createMedia() in mobile/src/db/repositories/media-repository.ts
- [x] T050 [US2] Implement createDownloadTask() in mobile/src/db/repositories/post-repository.ts
- [x] T051 [US2] Implement updateDownloadTask() in mobile/src/db/repositories/post-repository.ts (status, progress, retry)
- [x] T052 [US2] Implement updatePostStatus() in mobile/src/db/repositories/post-repository.ts
- [x] T053 [US2] Implement getPostWithDetails() in mobile/src/db/repositories/post-repository.ts (joins content, media, ai_result)

### UI Components

- [x] T054 [P] [US2] Create DownloadProgress component in mobile/src/components/DownloadProgress.tsx (progress bar, status)
- [x] T055 [P] [US2] Create MediaViewer component in mobile/src/components/MediaViewer.tsx (image gallery, video player)
- [x] T056 [US2] Create useDownloadProgress hook in mobile/src/services/download-manager.ts (addProgressListener)
- [x] T057 [US2] Implement Post detail screen in mobile/app/post/[id].tsx (full content, media, download status)
- [x] T058 [US2] Add download status indicator to PostCard in mobile/src/components/PostCard.tsx
- [x] T059 [US2] Implement retry button for failed downloads in mobile/app/post/[id].tsx

**Checkpoint**: User Story 2 complete - posts auto-download content, viewable offline with progress indicators

---

## Phase 5: User Story 3 - AI-Powered Organization (Priority: P3)

**Goal**: System generates labels, summaries, and groups posts automatically using AI

**Independent Test**: Share multiple posts on different topics, wait for AI analysis, verify labels/summary appear, posts grouped by similarity

### API AI Analysis Endpoint

- [x] T060 [US3] Implement AI service in api/src/services/ai-analyzer.ts (Claude API integration)
- [x] T061 [US3] Implement analyze route in api/src/routes/analyze.ts (POST /api/v1/analyze per contract)
- [x] T062 [US3] Create AI prompt templates in api/src/services/ai-analyzer.ts (labels, summary, grouping)
- [x] T063 [US3] Handle AI API errors and rate limiting in api/src/services/ai-analyzer.ts

### Mobile AI Analyzer

- [x] T064 [US3] Implement AI analyzer client in mobile/src/services/ai-analysis.ts (calls API /analyze endpoint)
- [x] T065 [US3] Integrate AI analysis into download pipeline in mobile/src/services/download-manager.ts (trigger after content download)
- [x] T066 [US3] Implement group management logic in mobile/src/services/ai-analysis.ts (create/assign groups)

### Repository Extensions

- [x] T067 [US3] Implement createAIResult() in mobile/src/db/repositories/ai-result-repository.ts
- [x] T068 [US3] Implement createGroup() in mobile/src/db/repositories/group-repository.ts
- [x] T069 [US3] Implement getAllGroups() in mobile/src/db/repositories/group-repository.ts
- [x] T070 [US3] Implement getPostsByGroup() in mobile/src/db/repositories/search-repository.ts (filterByGroup)
- [x] T071 [US3] Implement updateGroupPostCount() in mobile/src/db/repositories/group-repository.ts

### UI Components

- [x] T072 [P] [US3] Create AIBadge component in mobile/src/components/AIBadge.tsx (visual indicator for AI content)
- [x] T073 [P] [US3] Create LabelChips component in mobile/src/components/LabelChips.tsx (display labels)
- [x] T074 [P] [US3] Create SummaryCard component in mobile/src/components/AISummary.tsx (AI summary display)
- [x] T075 [US3] Add AI labels and summary to Post detail screen in mobile/app/post/[id].tsx
- [x] T076 [US3] Add labels preview to PostCard in mobile/src/components/PostCard.tsx
- [x] T077 [US3] Implement Groups view in Home screen in mobile/app/(tabs)/index.tsx (toggle list/groups view)

**Checkpoint**: User Story 3 complete - posts have AI labels, summaries, and are automatically grouped

---

## Phase 6: User Story 4 - Search and Filter Collection (Priority: P4)

**Goal**: Users can search by keywords, filter by labels, and browse by groups

**Independent Test**: With 20+ posts, search for keyword and verify correct results, filter by label and verify only matching posts shown

### Repository Extensions

- [x] T078 [US4] Implement searchPosts() in mobile/src/db/repositories/search-repository.ts (FTS5 full-text search)
- [x] T079 [US4] Implement getPostsByLabel() in mobile/src/db/repositories/search-repository.ts (filterByLabel)
- [x] T080 [US4] Implement getAllLabels() in mobile/src/db/repositories/search-repository.ts (getSearchSuggestions)

### Search Service

- [x] T081 [US4] Implement search service in mobile/src/db/repositories/search-repository.ts (search, filter, combine)
- [x] T082 [US4] Create useSearch hook in mobile/app/(tabs)/search.tsx (debounced search, filter state)

### UI Components

- [x] T083 [P] [US4] Create SearchBar component in mobile/app/(tabs)/search.tsx (text input, clear button)
- [x] T084 [P] [US4] Create LabelFilter component in mobile/app/(tabs)/search.tsx (selectable label chips)
- [x] T085 [P] [US4] Create GroupSelector component in mobile/src/components/GroupSelector.tsx (group list)
- [x] T086 [US4] Implement Search screen in mobile/app/(tabs)/search.tsx (SearchBar, filters, results)
- [x] T087 [US4] Add search results highlighting in mobile/src/components/PostCard.tsx
- [x] T088 [US4] Implement filter persistence in mobile/app/(tabs)/search.tsx (useState)

**Checkpoint**: User Story 4 complete - users can search, filter by labels, browse by groups

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T089 Implement Settings screen in mobile/app/(tabs)/settings.tsx (storage usage, clear data, about)
- [x] T090 [P] Add storage usage calculation in mobile/src/utils/file-manager.ts
- [ ] T091 [P] Add network status monitoring in mobile/src/services/download-manager.ts (auto-retry on reconnect)
- [x] T092 Add error boundary and crash reporting in mobile/app/_layout.tsx
- [x] T093 [P] Add loading skeletons to PostList in mobile/src/components/PostList.tsx
- [ ] T094 [P] Add empty state illustrations to all screens
- [x] T095 Optimize list rendering with memo and virtualization in mobile/src/components/PostList.tsx
- [ ] T096 Add app icons and splash screen in mobile/assets/
- [ ] T097 Run quickstart.md validation - verify full flow works end-to-end
- [ ] T098 Performance profiling and optimization for 60fps scrolling

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - MVP functionality
- **User Story 2 (Phase 4)**: Depends on Foundational + requires API crawl endpoint
- **User Story 3 (Phase 5)**: Depends on User Story 2 (needs downloaded content for AI analysis)
- **User Story 4 (Phase 6)**: Depends on Foundational + benefits from US3 (labels for filtering)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

```text
Foundational (Phase 2)
        │
        ├──► User Story 1 (P1) - Share & View
        │           │
        │           ▼
        ├──► User Story 2 (P2) - Content Download
        │           │
        │           ▼
        ├──► User Story 3 (P3) - AI Organization
        │
        └──► User Story 4 (P4) - Search & Filter (can start after Phase 2, enhanced by US3)
```

### Within Each User Story

- Models/interfaces before services
- Repository methods before services that use them
- Services before UI components
- API endpoints before mobile services that call them
- Core implementation before UI integration

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T003-T008)
- All model interfaces in Foundational (T011-T015) can run in parallel
- All foundation utilities (T019-T020) can run in parallel
- Within US1: PostCard and PostList (T034-T035) can run in parallel
- Within US2: DownloadProgress and MediaViewer (T054-T055) can run in parallel
- Within US3: AIBadge, LabelChips, SummaryCard (T072-T074) can run in parallel
- Within US4: SearchBar, LabelFilter, GroupSelector (T083-T085) can run in parallel
- Polish tasks marked [P] can run in parallel (T090-T091, T093-T094)

---

## Parallel Example: User Story 1

```bash
# After T033 (repository methods) complete, launch UI tasks in parallel:
Task: "Create PostCard component in mobile/src/components/PostCard.tsx"
Task: "Create PostList component in mobile/src/components/PostList.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T009)
2. Complete Phase 2: Foundational (T010-T025)
3. Complete Phase 3: User Story 1 (T026-T039)
4. **STOP and VALIDATE**: Share an XHS link, verify it appears in collection
5. Deploy/demo if ready - users can save and view posts!

### Incremental Delivery

1. Setup + Foundational → Foundation ready (T001-T025)
2. Add User Story 1 → Test independently → MVP ready (T026-T039)
3. Add User Story 2 → Test offline access → Content archiving works (T040-T059)
4. Add User Story 3 → Test AI features → Smart organization works (T060-T077)
5. Add User Story 4 → Test search/filter → Full feature set complete (T078-T088)
6. Polish phase → Production-ready app (T089-T098)

### API-First for US2 and US3

For User Stories 2 and 3, implement API endpoints first:
1. US2: Complete T040-T043 (API crawl) before T044-T059 (mobile download)
2. US3: Complete T060-T063 (API analyze) before T064-T077 (mobile AI)

---

## Notes

- [P] tasks = different files, no dependencies within same phase
- [US#] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Mobile paths: `mobile/src/`, `mobile/app/`
- API paths: `api/src/`
- 100MB video limit enforced in T046
- FTS5 search implemented in T078 for fast offline search
