<!--
Sync Impact Report:
- Version change: [INITIAL] → 1.0.0
- Modified principles: N/A (initial creation)
- Added sections: All core principles, Mobile Architecture, Data & Privacy, Governance
- Removed sections: N/A
- Templates requiring updates:
  ✅ .specify/templates/plan-template.md (reviewed, compatible)
  ✅ .specify/templates/spec-template.md (reviewed, compatible)
  ✅ .specify/templates/tasks-template.md (reviewed, compatible)
- Follow-up TODOs: None
-->

# XHS AI Summary Constitution

## Core Principles

### I. Cross-Platform First

Every feature MUST work consistently across iOS and Android platforms. Platform-specific code MUST be isolated behind shared interfaces. The app uses a cross-platform framework (React Native, Flutter, or similar) to maximize code sharing while maintaining native performance for critical paths.

**Rationale**: Resource efficiency and consistent user experience across platforms are essential for a personal utility app. Platform differences should be handled transparently without duplicating business logic.

### II. User Privacy & Data Isolation

User data MUST be stored in isolated, per-user containers. Content and AI analysis results MUST be accessible only to the owning user. No cross-user data sharing or aggregation without explicit consent. Local-first data storage with optional cloud sync.

**Rationale**: Users share personal content from Xiao Hong Shu. Privacy and data isolation are non-negotiable for trust and compliance with data protection regulations.

### III. Offline-Capable Core

Core functionality (viewing saved content, accessing AI analysis results) MUST work offline. Content downloading and AI analysis can require connectivity but MUST handle network failures gracefully with retry mechanisms and clear user feedback.

**Rationale**: Mobile users experience variable connectivity. Offline access to saved content ensures the app remains useful regardless of network conditions.

### IV. AI Analysis Transparency

AI analysis MUST provide clear, actionable insights. Analysis results MUST be versioned to support future model improvements. Users MUST be able to see what content was analyzed, when, and re-trigger analysis if needed.

**Rationale**: AI outputs vary by model and prompt. Transparency and versioning allow users to understand and trust the analysis while supporting iterative improvements.

### V. Simplicity & Performance

Keep the feature set minimal and focused. Prioritize fast app launch, smooth scrolling, and responsive UI. Avoid complex abstractions unless clearly justified. Download and analysis operations MUST run in the background without blocking the UI.

**Rationale**: Mobile users expect instant responsiveness. Background operations and simple architecture prevent performance bottlenecks that frustrate users.

## Mobile Architecture

### Platform Layer

- Native platform code (iOS/Android) isolated in platform-specific modules
- Shared business logic in cross-platform codebase
- Platform adapters for file system, networking, background tasks
- Native performance for media rendering and scrolling lists

### Data Flow

- Content URL → Download → Local Storage → AI Analysis → Results Storage
- All operations asynchronous with progress tracking
- Background task management for downloads and analysis
- Offline queue for failed operations with automatic retry

### Testing Requirements

- Unit tests for business logic (content parsing, data models)
- Integration tests for download → storage → analysis pipeline
- Platform-specific UI tests for critical user journeys
- Mock external dependencies (Xiao Hong Shu API, AI services)

## Data & Privacy

### Storage Strategy

- SQLite or equivalent for structured data (content metadata, analysis results)
- File system for downloaded media (images, videos)
- Per-user database encryption at rest
- Secure credential storage using platform keychains

### Content Attribution

- Preserve original author information from Xiao Hong Shu
- Respect platform terms of service
- Clear labeling of AI-generated analysis vs. original content
- No redistribution or commercial use of downloaded content

### Data Retention

- Users control retention: ability to delete individual items or all data
- Clear storage usage reporting
- Optional automatic cleanup of old content
- Export functionality for user data portability

## Governance

### Amendment Process

1. Proposed changes documented with justification
2. Impact assessment on existing features and architecture
3. Team review and approval (or user approval for personal projects)
4. Update all dependent templates and documentation
5. Migration plan for any breaking changes

### Constitution Compliance

- All feature specifications MUST reference relevant principles
- Implementation plans MUST include constitution check gate
- Code reviews MUST verify adherence to privacy and offline requirements
- Complexity additions MUST be justified against Principle V (Simplicity)

### Versioning Policy

- **MAJOR**: Changes to privacy model, platform support, or architectural principles
- **MINOR**: New principle added or significant expansion of existing guidance
- **PATCH**: Clarifications, wording improvements, non-semantic updates

**Version**: 1.0.0 | **Ratified**: 2026-01-08 | **Last Amended**: 2026-01-08
