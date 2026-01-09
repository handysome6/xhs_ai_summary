# Feature Specification: Clipboard Share Link Detection

**Feature Branch**: `002-clipboard-share-detection`
**Created**: 2026-01-09
**Status**: Draft
**Input**: User description: "增加一个打开app时 / 后台转到前台时的新功能，检测剪贴板是否有新内容，新内容是否符合分享连接规范，如何符合就提示添加到资源库。Requirements & Logic - Trigger: App Launch (Cold Start), App comes to Foreground (Warm Start / AppState change from 'background' to 'active'). Clipboard Access: Read the current string content from the system clipboard. Constraint: Handle platform permissions gracefully (especially iOS 14+ 'pasted from' notifications). Only check if permission allows. Validation Logic: Check if the clipboard content is a valid URL (Regex validation), Check if the URL follows specific 'sharing link' formats (if applicable), Deduplication: Compare the current clipboard content with the last checked content. If it's the same link I rejected or saved 5 minutes ago, do NOT prompt again. UI/UX: If valid and new: Show a non-intrusive prompt (e.g., a Toast with action button, or a SnackBar, or a Modal depending on existing UI patterns). Content: 'Found a new link: [URL]. Add to Library?'. Action: If user clicks 'Add': Parse the link and save to the Resource Library database. If user dismisses: Mark this specific URL string as 'ignored' locally to prevent re-prompting immediately."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quick Share Link Capture on App Launch (Priority: P1)

A user copies a Xiaohongshu (XHS) share link from another app (WeChat, browser, etc.), then opens this app. The app detects the valid share link in the clipboard and prompts the user to add it to their resource library with a single tap, eliminating manual navigation and input.

**Why this priority**: This is the primary use case and core value proposition - enabling frictionless content capture when users actively intend to save content (evidenced by opening the app after copying a link).

**Independent Test**: Can be fully tested by copying a valid XHS share link, opening the app from a closed state, and verifying the prompt appears with correct link preview and "Add to Library" action works.

**Acceptance Scenarios**:

1. **Given** app is completely closed and user has a valid XHS share link in clipboard, **When** user launches the app, **Then** a non-intrusive prompt displays showing the detected link with options to "Add to Library" or dismiss
2. **Given** user sees the clipboard prompt, **When** user taps "Add to Library", **Then** the link is parsed and saved to the Resource Library database and confirmation is shown
3. **Given** user sees the clipboard prompt, **When** user dismisses the prompt, **Then** the prompt disappears and this specific URL is marked as "ignored" for 5 minutes

---

### User Story 2 - Automatic Detection on Foreground Return (Priority: P1)

A user is browsing social media, copies a share link, then switches back to this app. The app detects the new clipboard content and prompts the user to add it to their library without requiring them to manually paste or navigate.

**Why this priority**: This represents the most frequent workflow - users discovering content while multitasking and wanting to capture it quickly. Essential for app stickiness and user retention.

**Independent Test**: Can be fully tested by having the app running in background, copying a valid share link in another app, returning to this app, and verifying the prompt appears automatically.

**Acceptance Scenarios**:

1. **Given** app is in background and user copies a new valid share link, **When** app comes to foreground (AppState changes from 'background' to 'active'), **Then** clipboard is checked and prompt displays if content is new and valid
2. **Given** app returns to foreground with new clipboard content, **When** clipboard content is identical to a link user saved 3 minutes ago, **Then** no prompt is shown (deduplication logic applies)
3. **Given** app returns to foreground with new clipboard content, **When** clipboard content is identical to a link user dismissed 2 minutes ago, **Then** no prompt is shown (deduplication logic applies)

---

### User Story 3 - Permission-Aware Clipboard Access (Priority: P2)

On iOS 14+ devices where clipboard access triggers a system notification ("pasted from [app]"), the app handles permissions gracefully and only accesses clipboard when permission is granted, avoiding user friction or privacy concerns.

**Why this priority**: Critical for iOS user experience and App Store compliance, but secondary to core functionality. Without this, the app would work but create poor UX on newer iOS versions.

**Independent Test**: Can be tested on iOS 14+ device by denying clipboard permission and verifying the app doesn't crash or show errors, then granting permission and verifying detection works.

**Acceptance Scenarios**:

1. **Given** user is on iOS 14+ and has not granted clipboard permission, **When** app launches or returns to foreground, **Then** no clipboard check occurs and no permission error is shown to user
2. **Given** user is on iOS 14+ and grants clipboard permission, **When** app checks clipboard, **Then** system notification appears as expected and clipboard content is processed
3. **Given** user is on Android or iOS <14, **When** app checks clipboard, **Then** clipboard is accessed directly without permission checks

---

### User Story 4 - Invalid Content Handling (Priority: P3)

When clipboard contains non-URL content (plain text, images, etc.) or URLs that don't match XHS share link patterns, the app silently ignores the content without showing errors or prompts.

**Why this priority**: Important for smooth UX and avoiding false positives, but doesn't block core value delivery. Users won't notice when this works correctly - they only notice if it fails.

**Independent Test**: Can be tested by copying various invalid content types (random text, non-XHS URLs, etc.) and verifying no prompts or errors appear.

**Acceptance Scenarios**:

1. **Given** clipboard contains plain text that is not a URL, **When** app launches or returns to foreground, **Then** no prompt is shown and no errors occur
2. **Given** clipboard contains a valid URL but not an XHS share link format, **When** clipboard is checked, **Then** no prompt is shown (validation logic rejects it)
3. **Given** clipboard contains an image or other non-text content, **When** clipboard is checked, **Then** app handles gracefully without crashes or errors

---

### Edge Cases

- What happens when clipboard contains a valid share link but network is unavailable? Prompt appears with visual indicator showing offline status, allows save to local queue for later synchronization when connectivity is restored.
- How does system handle clipboard content that is a valid URL but extremely long (>1000 characters)? System truncates display in prompt (showing first 100 characters with ellipsis) but stores full URL for validation and saving (see FR-023 for implementation details).
- What happens if user rapidly switches between apps multiple times with same clipboard content? Deduplication logic prevents repeated prompts - first detection triggers prompt, subsequent foreground transitions within 5-minute window are silently ignored.
- How does deduplication work if user copies same link again after exactly 5 minutes? After 5 minutes, the ignored/saved record expires and prompt will appear again for the same URL, treating it as new content.
- What happens when user has previously saved a link, deleted it from library, then copies it again? System checks only the 5-minute deduplication window - if deleted link is copied after window expires, prompt appears normally as if it's a new link.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST monitor clipboard when app launches from closed state (cold start)
- **FR-002**: System MUST monitor clipboard when app transitions from background to foreground (AppState change from 'background' to 'active')
- **FR-003**: System MUST read string content from system clipboard when triggered
- **FR-004**: System MUST check platform-specific clipboard permissions before attempting to read (iOS 14+)
- **FR-005**: System MUST validate clipboard content is a properly formatted URL using regex pattern validation
- **FR-006**: System MUST validate clipboard URL matches XHS share link format patterns
- **FR-007**: System MUST compare current clipboard content against last checked content to detect new links
- **FR-008**: System MUST maintain local record of "ignored" URLs when user dismisses prompt
- **FR-009**: System MUST maintain local record of "saved" URLs when user adds to library
- **FR-010**: System MUST NOT re-prompt user for URLs that were ignored within past 5 minutes
- **FR-011**: System MUST NOT re-prompt user for URLs that were saved within past 5 minutes
- **FR-012**: System MUST display non-intrusive prompt when valid new share link is detected
- **FR-013**: Prompt MUST show detected URL and provide "Add to Library" action
- **FR-014**: Prompt MUST provide dismiss/close action
- **FR-015**: System MUST parse share link and save to Resource Library database when user selects "Add to Library"
- **FR-016**: System MUST mark URL as "ignored" locally when user dismisses prompt
- **FR-017**: System MUST handle clipboard access failures gracefully without showing errors to users
- **FR-018**: System MUST handle invalid clipboard content (non-URL, non-text) without crashes or errors
- **FR-019**: System MUST detect network connectivity status when displaying clipboard prompt
- **FR-020**: Prompt MUST display visual indicator (icon or text) showing offline status when network is unavailable
- **FR-021**: System MUST allow users to save links to local queue when offline
- **FR-022**: System MUST automatically synchronize queued links when network connectivity is restored
- **FR-023**: System MUST truncate long URLs (>1000 characters) in prompt display to first 100 characters with ellipsis while preserving full URL for processing

### Key Entities

- **Clipboard Check Record**: Represents a clipboard monitoring event with timestamp, clipboard content hash, and action taken (prompted/ignored/saved)
- **Ignored URL Entry**: Represents a user-dismissed link with URL string, timestamp of dismissal, and expiration time (5 minutes from dismissal)
- **Offline Sync Queue Entry**: Represents a link saved while offline with URL, timestamp, sync status, and retry count
- **Resource Library Entry**: Existing entity that stores saved share links (referenced by FR-015)

### Assumptions

- XHS share link URL format patterns are well-defined and stable (assumption: existing validation logic from Feature 001 can be reused)
- Resource Library database and save functionality already exist from Feature 001 (XHS Share Collection)
- Users typically copy share links with intent to save them, so clipboard monitoring adds value rather than being intrusive
- 5-minute deduplication window is sufficient to prevent annoyance while allowing re-prompting for genuinely repeated actions
- Network connectivity can be reliably detected through standard platform APIs
- Offline queue synchronization happens automatically without requiring user intervention

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can save a share link to their library within 3 seconds of opening the app (from the moment app launches to library save completion)
- **SC-002**: Users are never prompted more than once for the same URL within a 5-minute window, even across multiple app launches and foreground transitions
- **SC-003**: Clipboard monitoring completes within 500 milliseconds of app launch or foreground transition to avoid perceived lag
- **SC-004**: 0% of clipboard access attempts result in app crashes or visible errors to users
- **SC-005**: Users who copy valid share links and open the app see detection prompt in 95%+ of cases (excluding permission denials)
- **SC-006**: Users can dismiss unwanted clipboard prompts with a single tap and never see them again for that specific URL within the deduplication window
- **SC-007**: Users can save links while offline, with 100% of queued links successfully syncing when connectivity is restored (excluding invalid/expired links)
