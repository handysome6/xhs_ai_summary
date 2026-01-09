# Tasks: Clipboard Share Link Detection

**Input**: Design documents from `/specs/002-clipboard-share-detection/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in specification - tasks focus on implementation

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Mobile React Native project structure:
- **Mobile app**: `mobile/src/`, `mobile/app/`
- **Database**: `mobile/src/db/`
- **Components**: `mobile/src/components/`
- **Services**: `mobile/src/services/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and configure clipboard monitoring infrastructure

- [ ] T001 Install expo-clipboard dependency in mobile/package.json
- [ ] T002 [P] Install expo-network dependency in mobile/package.json
- [ ] T003 [P] Add clipboard monitoring configuration constants to mobile/src/utils/constants.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema and core models that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Define ClipboardCheck TypeScript interface in mobile/src/models/clipboard-check.ts
- [ ] T005 [P] Define IgnoredUrl TypeScript interface in mobile/src/models/ignored-url.ts
- [ ] T006 Add database migration for clipboard_checks table in mobile/src/db/migrations.ts
- [ ] T007 Add database migration for ignored_urls table in mobile/src/db/migrations.ts
- [ ] T008 Update database schema file with table definitions in mobile/src/db/schema.ts
- [ ] T009 [P] Implement clipboard-check repository CRUD operations in mobile/src/db/repositories/clipboard-check-repository.ts
- [ ] T010 [P] Implement ignored-url repository with deduplication logic in mobile/src/db/repositories/ignored-url-repository.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Quick Share Link Capture on App Launch (Priority: P1) 🎯 MVP

**Goal**: Enable clipboard detection on cold start - user copies XHS link, opens app, sees prompt to add to library

**Independent Test**: Copy valid XHS share link, close app completely, open app, verify prompt appears within 1 second with "Add to Library" and "Dismiss" buttons

### Implementation for User Story 1

- [ ] T011 [P] [US1] Create clipboard monitoring service skeleton in mobile/src/services/clipboard-monitor.ts
- [ ] T012 [P] [US1] Create network monitoring service in mobile/src/services/network-monitor.ts
- [ ] T013 [US1] Implement checkClipboard() function with clipboard read logic in mobile/src/services/clipboard-monitor.ts
- [ ] T014 [US1] Implement clipboard content validation using existing validateXhsUrl() in mobile/src/services/clipboard-monitor.ts
- [ ] T015 [US1] Implement deduplication check using ignored-url repository in mobile/src/services/clipboard-monitor.ts
- [ ] T016 [US1] Implement recordClipboardCheck() to log analytics in mobile/src/services/clipboard-monitor.ts
- [ ] T017 [US1] Create ClipboardPrompt modal UI component in mobile/src/components/ClipboardPrompt.tsx
- [ ] T018 [US1] Add offline status indicator to ClipboardPrompt component in mobile/src/components/ClipboardPrompt.tsx
- [ ] T019 [US1] Implement URL truncation logic (100 chars max) in ClipboardPrompt component
- [ ] T020 [US1] Create clipboard prompt Zustand store in mobile/src/stores/clipboard-store.ts
- [ ] T021 [US1] Implement showPrompt() action in clipboard store
- [ ] T022 [US1] Implement handleAddToLibrary() action integrating with existing handleSharedUrl() in clipboard store
- [ ] T023 [US1] Implement handleDismiss() action with ignored URL tracking in clipboard store
- [ ] T024 [US1] Add clipboard check on app mount in mobile/app/_layout.tsx
- [ ] T025 [US1] Integrate ClipboardPrompt modal into root layout in mobile/app/_layout.tsx
- [ ] T026 [US1] Connect clipboard store to ClipboardPrompt component in mobile/app/_layout.tsx

**Checkpoint**: At this point, cold start clipboard detection should be fully functional - copy link, open app, see prompt, can add or dismiss

---

## Phase 4: User Story 2 - Automatic Detection on Foreground Return (Priority: P1)

**Goal**: Enable clipboard detection when app returns from background - user switches to another app, copies link, returns to this app, sees prompt

**Independent Test**: With app running in background, copy valid XHS link in another app, switch back to this app, verify prompt appears automatically

### Implementation for User Story 2

- [ ] T027 [US2] Create useAppState custom hook for AppState lifecycle management in mobile/src/hooks/useAppState.ts (if hooks directory exists, otherwise in clipboard-monitor.ts)
- [ ] T028 [US2] Add AppState event listener in root layout in mobile/app/_layout.tsx
- [ ] T029 [US2] Implement handleAppStateChange() callback to trigger clipboard check on 'active' state in mobile/app/_layout.tsx
- [ ] T030 [US2] Add debouncing logic (1 second) to prevent rapid repeated checks in clipboard-monitor service
- [ ] T031 [US2] Test foreground transition clipboard detection (manual test per quickstart.md)

**Checkpoint**: At this point, both cold start AND foreground transition clipboard detection should work independently

---

## Phase 5: User Story 3 - Permission-Aware Clipboard Access (Priority: P2)

**Goal**: Handle iOS 14+ clipboard permissions gracefully without crashes or intrusive errors

**Independent Test**: On iOS 14+ simulator, deny clipboard permission, verify no crashes or error messages, then grant permission and verify detection works

### Implementation for User Story 3

- [ ] T032 [US3] Add iOS platform detection logic in clipboard-monitor service
- [ ] T033 [US3] Implement iOS 14+ permission check before clipboard access in checkClipboard() function
- [ ] T034 [US3] Add try-catch error handling for clipboard permission denials in clipboard-monitor service
- [ ] T035 [US3] Log clipboard permission errors without displaying to user in clipboard-monitor service
- [ ] T036 [US3] Test on iOS 14+ simulator with permission denied scenario (manual test)
- [ ] T037 [US3] Test on Android emulator to verify direct clipboard access works (manual test)

**Checkpoint**: All platforms should now handle clipboard access safely - iOS with permission checks, Android with direct access

---

## Phase 6: User Story 4 - Invalid Content Handling (Priority: P3)

**Goal**: Silently ignore invalid clipboard content (non-URLs, non-XHS URLs, images) without errors or prompts

**Independent Test**: Copy various invalid content types (plain text, non-XHS URL, etc.), verify no prompts or errors appear

### Implementation for User Story 4

- [ ] T038 [US4] Add empty clipboard check in checkClipboard() function
- [ ] T039 [US4] Add non-URL content validation using existing regex patterns from url-validator
- [ ] T040 [US4] Add non-XHS URL rejection logic using existing XHS pattern matching
- [ ] T041 [US4] Implement silent failure for non-text clipboard content (images, files)
- [ ] T042 [US4] Add clipboard action logging for analytics (ignored_empty, ignored_invalid) in recordClipboardCheck()
- [ ] T043 [US4] Test with various invalid content types per edge cases in spec.md (manual test)

**Checkpoint**: All clipboard content types should be handled gracefully with no user-facing errors

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Enhancements affecting multiple user stories and final integration

- [ ] T044 [P] Implement clipboard check history cleanup (30-day retention) in clipboard-check repository
- [ ] T045 [P] Implement ignored URLs cleanup (expired entries every 10 minutes) in ignored-url repository
- [ ] T046 Add background cleanup task scheduling in mobile/app/_layout.tsx or appropriate lifecycle location
- [ ] T047 [P] Add performance logging for clipboard check duration (<500ms budget) in clipboard-monitor service
- [ ] T048 Implement offline link queue sync on network restoration in network-monitor service
- [ ] T049 [P] Add success toast notification using existing ShareConfirmation component after adding link
- [ ] T050 Update CLAUDE.md with clipboard monitoring feature documentation (if needed)
- [ ] T051 Run full manual test checklist from specs/002-clipboard-share-detection/quickstart.md
- [ ] T052 Verify all success criteria from spec.md are met (SC-001 through SC-007)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (US1 → US2 → US3 → US4)
- **Polish (Phase 7)**: Depends on desired user stories being complete (minimum US1+US2 for MVP)

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Extends US1 by adding AppState listener but is independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Adds permission handling to existing clipboard logic, independently testable
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Enhances validation logic, independently testable

### Within Each User Story

**User Story 1 (Cold Start Detection)**:
1. Services (T011, T012) can be built in parallel
2. Clipboard monitor core (T013-T016) must complete sequentially
3. UI component (T017-T019) can be built in parallel with store (T020-T023)
4. Integration (T024-T026) requires all previous tasks complete

**User Story 2 (Foreground Detection)**:
1. AppState hook (T027) can be built independently
2. Integration (T028-T029) requires US1 completion
3. Debouncing (T030) can be added in parallel with testing (T031)

**User Story 3 (Permissions)**:
1. All tasks (T032-T037) build on US1+US2 clipboard logic
2. Platform detection (T032-T035) can be sequential
3. Testing (T036-T037) happens after implementation

**User Story 4 (Invalid Content)**:
1. Validation tasks (T038-T042) enhance existing checkClipboard() logic
2. Can be done sequentially as they build on each other
3. Testing (T043) verifies all validation paths

### Parallel Opportunities

**Phase 1 (Setup)**: All tasks can run in parallel
- T001 + T002 + T003 (different dependencies/files)

**Phase 2 (Foundational)**: Models and repositories can run in parallel
- T004 + T005 (different model files)
- T009 + T010 (different repository files)
- Database migrations (T006-T008) should be sequential to ensure correct schema versioning

**Phase 3 (User Story 1)**: Multiple parallel paths
- T011 (clipboard service) + T012 (network service) - different files
- T017-T019 (UI component) + T020-T023 (store) - different concerns

**Phase 7 (Polish)**: Cleanup and documentation can run in parallel
- T044 + T045 + T047 + T050 (different files/concerns)

---

## Parallel Example: User Story 1

```bash
# Launch services in parallel (different files):
Task T011: "Create clipboard monitoring service skeleton"
Task T012: "Create network monitoring service"

# Launch UI and store in parallel (different concerns):
Task T017-T019: "ClipboardPrompt component implementation"
Task T020-T023: "Clipboard store implementation"
```

---

## Parallel Example: Foundational Phase

```bash
# Launch models in parallel (different files):
Task T004: "Define ClipboardCheck TypeScript interface"
Task T005: "Define IgnoredUrl TypeScript interface"

# Launch repositories in parallel (different files):
Task T009: "Implement clipboard-check repository"
Task T010: "Implement ignored-url repository"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T010) - **CRITICAL BLOCKING PHASE**
3. Complete Phase 3: User Story 1 (T011-T026)
4. **STOP and VALIDATE**: Test cold start clipboard detection independently
5. Complete Phase 4: User Story 2 (T027-T031)
6. **STOP and VALIDATE**: Test foreground transition clipboard detection independently
7. Deploy/demo MVP with core clipboard monitoring working

**MVP Deliverable**: Users can copy XHS links and have them automatically detected on both app launch and foreground return, with the ability to add to library or dismiss.

### Incremental Delivery

1. **Foundation** (Phase 1 + 2): Database schema, models, repositories ready
2. **MVP** (Phase 3 + 4): Cold start + foreground detection working → Deploy
3. **iOS Polish** (Phase 5): Add User Story 3 for iOS 14+ permission handling → Deploy
4. **Robustness** (Phase 6): Add User Story 4 for invalid content handling → Deploy
5. **Production Ready** (Phase 7): Cleanup, performance monitoring, full testing → Final Deploy

Each increment adds value without breaking previous functionality.

### Parallel Team Strategy

With 2 developers after Foundational phase completes:

**Option A (Story-based split)**:
- Developer A: User Story 1 + 3 (cold start + permissions)
- Developer B: User Story 2 + 4 (foreground + validation)

**Option B (Layer-based split for US1)**:
- Developer A: Backend (service + store) - T011-T016, T020-T023
- Developer B: Frontend (UI component) - T017-T019
- Both: Integration (T024-T026) together

**Recommended**: Option A for maximum independence

---

## Critical Path Analysis

**Longest dependency chain** (MVP scope):

```
Setup (T001-T003)
  ↓
Foundational - Database (T006-T008)
  ↓
Foundational - Repositories (T009-T010)
  ↓
US1 - Clipboard Service (T011, T013-T016)
  ↓
US1 - Clipboard Store (T020-T023)
  ↓
US1 - Integration (T024-T026)
  ↓
US2 - AppState Integration (T027-T029)
```

**Estimated critical path**: ~14 tasks (if done sequentially)

**Parallelization opportunities reduce this to**: ~8-9 effective task "rounds" if 2 developers work in parallel

---

## Success Criteria Mapping

Tasks mapped to Success Criteria from spec.md:

- **SC-001** (Save link in <3 seconds): T022 (handleAddToLibrary integration)
- **SC-002** (5-minute deduplication): T015 (deduplication check), T023 (track ignored URLs)
- **SC-003** (Clipboard check <500ms): T013-T016 (efficient clipboard logic), T047 (performance logging)
- **SC-004** (0% crashes): T034-T035 (error handling), T038-T041 (invalid content handling)
- **SC-005** (95%+ detection rate): T013 (clipboard read), T024 (cold start trigger), T027-T029 (foreground trigger)
- **SC-006** (Single tap dismiss): T023 (dismiss action with tracking)
- **SC-007** (Offline queue sync): T048 (network restoration sync)

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label (US1, US2, US3, US4) maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group (e.g., after T026, full US1 is done)
- Stop at any checkpoint to validate story independently
- Database migrations (T006-T008) must maintain schema version consistency
- Reuse existing utilities: validateXhsUrl(), handleSharedUrl(), hashUrl() from Feature 001
- Manual testing per quickstart.md is essential (T031, T036-T037, T043, T051)
- Performance budget (<500ms) must be verified with T047 logging

---

## Task Count Summary

**Total Tasks**: 52

**By Phase**:
- Phase 1 (Setup): 3 tasks
- Phase 2 (Foundational): 7 tasks
- Phase 3 (User Story 1 - P1): 16 tasks
- Phase 4 (User Story 2 - P1): 5 tasks
- Phase 5 (User Story 3 - P2): 6 tasks
- Phase 6 (User Story 4 - P3): 6 tasks
- Phase 7 (Polish): 9 tasks

**By User Story**:
- US1 (Quick Share Link Capture): 16 tasks
- US2 (Foreground Detection): 5 tasks
- US3 (Permission Handling): 6 tasks
- US4 (Invalid Content): 6 tasks
- Shared/Polish: 19 tasks (Setup + Foundational + Polish)

**Parallel Opportunities Identified**: 17 tasks marked [P] can run in parallel with others

**Suggested MVP Scope**: Phase 1 + 2 + 3 + 4 = 31 tasks (Setup + Foundational + US1 + US2)

**Minimum Viable Feature**: Phase 1 + 2 + 3 = 26 tasks (Setup + Foundational + US1 only)
