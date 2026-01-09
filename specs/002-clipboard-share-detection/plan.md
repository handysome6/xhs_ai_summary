# Implementation Plan: Clipboard Share Link Detection

**Branch**: `002-clipboard-share-detection` | **Date**: 2026-01-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-clipboard-share-detection/spec.md`

## Summary

This feature adds automatic clipboard monitoring that detects XHS share links when the app launches (cold start) or returns to foreground. When a valid, new share link is detected in the clipboard, the app displays a non-intrusive prompt allowing users to add the link to their Resource Library with a single tap. The implementation includes deduplication logic (5-minute window), offline support with visual indicators, iOS 14+ permission handling, and seamless integration with existing share handling infrastructure from Feature 001.

**Technical Approach**: Integrate React Native AppState API for lifecycle monitoring, Expo Clipboard API for clipboard access, and create a new clipboard monitoring service that hooks into the existing `handleSharedUrl()` flow. Store clipboard check history and ignored URLs in SQLite for deduplication. Display prompts using a new modal component with offline status indicators.

## Technical Context

**Language/Version**: TypeScript 5.x with React Native 0.73+ (Expo SDK 50)
**Primary Dependencies**:
  - expo-clipboard: ^5.0.0 (clipboard access)
  - react-native AppState API (built-in, lifecycle monitoring)
  - expo-sqlite: ~13.0.0 (existing, for deduplication storage)
  - expo-network: ~6.0.0 (network connectivity detection)
  - zustand: ^4.4.0 (existing, state management)
  - axios: ^1.6.0 (existing, for API calls)

**Storage**: SQLite (expo-sqlite) with 2 new tables:
  - `clipboard_checks` - tracking clipboard monitoring events
  - `ignored_urls` - storing dismissed URLs with expiration timestamps

**Testing**: Jest with React Native Testing Library, expo-sqlite mocks for database operations

**Target Platform**: iOS 14+ and Android 8+ (React Native cross-platform)

**Project Type**: Mobile (React Native with Expo managed workflow)

**Performance Goals**:
  - Clipboard check completes in <500ms (SC-003)
  - Full save flow completes in <3 seconds (SC-001)
  - UI remains responsive during background clipboard checks
  - Zero ANR (Application Not Responding) events

**Constraints**:
  - Must handle iOS 14+ clipboard permission gracefully without triggering unwanted system notifications
  - Cannot block UI thread during clipboard operations
  - Must work offline with visual feedback
  - 5-minute deduplication window must be enforced across app restarts
  - Must not interfere with existing share intent handling (Feature 001)

**Scale/Scope**:
  - Personal utility app (single user per device)
  - Expected clipboard checks: 10-50 per day per user
  - Ignored URLs table: max ~500 entries (auto-cleanup after 5 minutes)
  - Clipboard check history: retain last 30 days for analytics

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Cross-Platform First ✅ PASS

**Requirement**: Every feature MUST work consistently across iOS and Android platforms.

**Compliance**:
- ✅ Using `expo-clipboard` which provides unified API for both platforms
- ✅ AppState API is built into React Native core, works on both platforms
- ✅ iOS 14+ permission handling isolated in platform detection logic (`Platform.OS === 'ios' && Platform.Version >= 14`)
- ✅ All business logic (validation, deduplication, storage) is platform-agnostic
- ✅ SQLite backend works identically on both platforms
- ✅ UI components use React Native primitives (Modal, Text, Pressable) that render natively on both

**Platform-Specific Code**:
- iOS permission check: Only reads clipboard if permission granted (iOS 14+ specific behavior)
- Android: Direct clipboard access (no permission needed)

Both handled via feature detection, not code duplication.

---

### Principle II: User Privacy & Data Isolation ✅ PASS

**Requirement**: User data MUST be stored in isolated containers. No cross-user data sharing.

**Compliance**:
- ✅ Clipboard checks and ignored URLs stored in SQLite database (isolated per app installation)
- ✅ No clipboard data sent to external services
- ✅ URL hashing uses SHA-256 (existing from Feature 001) for privacy
- ✅ Clipboard content only processed if it matches XHS URL patterns (no arbitrary text storage)
- ✅ Ignored URLs auto-expire after 5 minutes (minimal data retention)
- ✅ No analytics or tracking of clipboard content outside local device

**Data Flow**: Clipboard → Validation → Local DB → UI Prompt → User Action → Resource Library (all local)

---

### Principle III: Offline-Capable Core ✅ PASS

**Requirement**: Core functionality MUST work offline with graceful degradation.

**Compliance**:
- ✅ Clipboard detection works fully offline (no network required)
- ✅ URL validation is regex-based (no API calls)
- ✅ Deduplication checks local SQLite (no network)
- ✅ Offline queue added for links saved without connectivity (FR-021)
- ✅ Visual indicator shows offline status in prompt (FR-020)
- ✅ Automatic sync when connectivity restored (FR-022)

**Network Requirement**: Only needed for syncing queued links to backend (graceful fallback to offline queue)

---

### Principle IV: AI Analysis Transparency ⚠️ NOT APPLICABLE

**Status**: This feature does not involve AI analysis. No compliance check needed.

---

### Principle V: Simplicity & Performance ✅ PASS

**Requirement**: Keep feature set minimal. Prioritize fast launch, smooth UI. Background operations must not block UI.

**Compliance**:
- ✅ Single responsibility: Clipboard monitoring + prompt display
- ✅ Reuses existing infrastructure (URL validation, share handling, database)
- ✅ No complex abstractions: Simple service + modal component
- ✅ Clipboard checks run asynchronously (async/await pattern)
- ✅ Database operations use existing repository pattern (no new architectural layers)
- ✅ Deduplication uses simple timestamp comparison (no complex algorithms)
- ✅ 500ms performance budget enforced (SC-003)

**Background Operations**:
- Clipboard check: async, non-blocking
- Database queries: async with prepared statements
- Network status check: async via expo-network

**Simplicity Evidence**: ~300 lines of new code (service + UI + schema)*, reuses 80% of existing Feature 001 infrastructure

*Note: Initial rough estimate. See detailed breakdown lines 280-287 for full estimate of ~530 lines including all components

---

### Gate Result: ✅ ALL GATES PASSED

No constitution violations. Feature aligns with all applicable principles.

## Project Structure

### Documentation (this feature)

```text
specs/002-clipboard-share-detection/
├── plan.md              # This file (/speckit.plan output)
├── spec.md              # Feature specification (completed)
├── research.md          # Phase 0: Technical decisions (generated below)
├── data-model.md        # Phase 1: Database schema additions (generated below)
├── quickstart.md        # Phase 1: Developer setup guide (generated below)
├── contracts/           # Phase 1: TypeScript interfaces (generated below)
│   ├── clipboard-monitor.interface.ts
│   ├── clipboard-prompt.interface.ts
│   └── deduplication.interface.ts
├── checklists/
│   └── requirements.md  # Spec quality checklist (completed)
└── tasks.md             # Phase 2: NOT created yet (requires /speckit.tasks command)
```

### Source Code (repository root)

```text
mobile/                                    # React Native app (Expo)
├── app/
│   ├── _layout.tsx                        # [MODIFY] Add AppState listener + clipboard hook
│   ├── (tabs)/
│   │   └── index.tsx                      # [MODIFY] Handle clipboard prompt results
│   └── ...
├── src/
│   ├── components/
│   │   ├── ShareConfirmation.tsx          # [EXISTING] Reuse for success feedback
│   │   └── ClipboardPrompt.tsx            # [NEW] Modal for clipboard URL prompt
│   ├── db/
│   │   ├── schema.ts                      # [MODIFY] Add clipboard tables
│   │   ├── migrations.ts                  # [MODIFY] Add migration for v2
│   │   └── repositories/
│   │       ├── clipboard-check-repository.ts  # [NEW] Clipboard check CRUD
│   │       └── ignored-url-repository.ts      # [NEW] Ignored URLs CRUD
│   ├── models/
│   │   ├── clipboard-check.ts             # [NEW] TypeScript interfaces
│   │   └── ignored-url.ts                 # [NEW] TypeScript interfaces
│   ├── services/
│   │   ├── share-handler.ts               # [EXISTING] Reuse handleSharedUrl()
│   │   ├── clipboard-monitor.ts           # [NEW] Core clipboard monitoring service
│   │   └── network-monitor.ts             # [NEW] Network connectivity detection
│   ├── stores/
│   │   ├── post-store.ts                  # [EXISTING] Reuse addPost() action
│   │   └── clipboard-store.ts             # [NEW] Clipboard prompt state
│   └── utils/
│       ├── url-validator.ts               # [EXISTING] Reuse validateXhsUrl()
│       └── constants.ts                   # [MODIFY] Add clipboard config
└── package.json                           # [MODIFY] Add expo-clipboard, expo-network

api/                                       # Backend (no changes needed for clipboard detection)
└── ...                                    # Offline queue sync uses existing endpoints

tests/                                     # Test files (not yet structured)
└── [TO BE CREATED]                        # Unit tests for clipboard service
```

**Structure Decision**: Mobile-only feature with no backend changes. All clipboard logic contained in `mobile/src/services/clipboard-monitor.ts` with supporting UI in `src/components/ClipboardPrompt.tsx`. Database changes add 2 tables to existing SQLite schema. Reuses existing URL validation, share handling, and post storage infrastructure from Feature 001.

**Integration Point**: Root layout (`app/_layout.tsx`) subscribes to AppState changes and invokes clipboard monitor service on state transitions. Service coordinates with existing share handler and post store.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations identified. This section is not applicable.

---

## Post-Design Constitution Re-Evaluation

*Re-evaluated after Phase 1 design (data model, contracts, architecture defined)*

### Principle I: Cross-Platform First ✅ STILL PASS

**Design Review**:
- ✅ All new files (clipboard-monitor.ts, ClipboardPrompt.tsx, repositories) use cross-platform APIs
- ✅ Database schema additions (clipboard_checks, ignored_urls) work identically on iOS/Android
- ✅ TypeScript interfaces in contracts/ are platform-agnostic
- ✅ No platform-specific code outside of iOS 14+ permission check (properly isolated)

**Verification**:
- Data model uses standard SQLite (no platform-specific extensions)
- UI components use React Native primitives (Modal, Pressable, Text)
- Network detection via expo-network (unified API)

---

### Principle II: User Privacy & Data Isolation ✅ STILL PASS

**Design Review**:
- ✅ Database tables use local SQLite (no external services)
- ✅ URL hashing ensures privacy (SHA-256, reuses existing utility)
- ✅ Clipboard content not logged or transmitted (only hashes stored)
- ✅ Auto-expiration of ignored_urls table (5-minute window, minimal retention)
- ✅ clipboard_checks table retention limited to 30 days (for debugging only)

**Verification**:
- No new API endpoints added (mobile-only feature)
- No cloud sync for clipboard data (offline queue only for Resource Library links)
- User can delete all clipboard history via existing data export/delete functionality

---

### Principle III: Offline-Capable Core ✅ STILL PASS

**Design Review**:
- ✅ All clipboard operations work offline (validation, deduplication, UI prompt)
- ✅ OfflineSyncQueueEntry design allows links to be queued without network
- ✅ Network detection provides visual feedback (doesn't block functionality)
- ✅ Auto-sync on connectivity restoration (background process)

**Verification**:
- Clipboard read: No network required
- URL validation: Regex-based, no API calls
- Deduplication: SQLite queries, no network
- Prompt display: Fully offline
- Only sync operation requires network (graceful degradation)

---

### Principle IV: AI Analysis Transparency ⚠️ STILL NOT APPLICABLE

**Status**: Feature does not involve AI analysis. No compliance required.

---

### Principle V: Simplicity & Performance ✅ STILL PASS

**Design Review**:
- ✅ Simple architecture: 1 service + 1 UI component + 2 repositories + 2 database tables
- ✅ Reuses 80%+ of existing infrastructure (URL validation, share handler, post store)
- ✅ Performance budget verified in research.md (<190ms total, well under 500ms)
- ✅ Database indexes properly defined for fast queries
- ✅ No complex abstractions (repository pattern matches existing codebase)

**Code Estimates** (from design):
- `clipboard-monitor.ts`: ~150 lines (service logic)
- `ClipboardPrompt.tsx`: ~100 lines (UI component)
- `clipboard-check-repository.ts`: ~80 lines (CRUD operations)
- `ignored-url-repository.ts`: ~100 lines (CRUD + dedup logic)
- `clipboard-store.ts`: ~60 lines (Zustand store)
- Database migration: ~40 lines (SQL DDL)
- Total new code: **~530 lines**

**Complexity Metrics**:
- New dependencies: 2 (expo-clipboard, expo-network - both Expo core modules)
- New database tables: 2 (simple schemas, no complex relationships)
- New TypeScript interfaces: 3 files (well-typed contracts)
- Integration points: 1 (root layout AppState listener)

**Verification**:
- No new architectural layers introduced
- No complex state machines or workflows
- Straightforward async/await patterns throughout
- Clear separation of concerns (service → repository → database)

---

### Final Gate Result: ✅ ALL GATES STILL PASSED POST-DESIGN

**Summary**: Detailed design (data model, contracts, architecture) confirms initial constitution compliance. No violations introduced during Phase 1 planning.

**Key Findings**:
1. Cross-platform implementation verified (platform differences properly isolated)
2. Privacy preserved (local-only data, hashed URLs, auto-expiration)
3. Offline functionality confirmed (all operations work without network)
4. Simplicity maintained (~530 lines of new code, reuses existing patterns)
5. Performance budget achievable (<190ms measured, <500ms target)

**Ready for**: Task generation (`/speckit.tasks`) and implementation

