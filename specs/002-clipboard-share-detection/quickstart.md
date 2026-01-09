# Developer Quickstart: Clipboard Share Link Detection

**Feature**: 002-clipboard-share-detection
**Date**: 2026-01-09
**Target Audience**: Developers implementing clipboard monitoring

## Prerequisites

- Node.js 18+ and npm/yarn installed
- Expo CLI installed (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Emulator set up
- React Native development environment configured
- Existing XHS AI Summary mobile app from Feature 001 running

## Installation Steps

### 1. Install New Dependencies

```bash
cd mobile

# Install expo-clipboard
npx expo install expo-clipboard

# Install expo-network
npx expo install expo-network

# Verify expo-sqlite is already installed (should be from Feature 001)
npm list expo-sqlite
```

Expected output:
```
expo-clipboard@5.0.0
expo-network@6.0.0
expo-sqlite@13.0.0 (already installed)
```

### 2. Update Database Schema

The database migration will run automatically on next app launch. To manually trigger:

```typescript
// In mobile/src/db/migrations.ts (already implemented in Feature 001)
// Migration will detect schema version and apply v2 automatically

// To verify migration:
import { getDatabase } from './repository';

const db = await getDatabase();
const version = await db.getFirstAsync(
  'SELECT version FROM schema_metadata WHERE id = 1'
);
console.log('Current schema version:', version);
// Should output: { version: 2 }
```

### 3. Project Structure Check

Verify the following directories exist:

```bash
mobile/
├── src/
│   ├── components/      # ✅ Should exist
│   ├── db/
│   │   └── repositories/  # ✅ Should exist
│   ├── models/          # ✅ Should exist
│   ├── services/        # ✅ Should exist
│   ├── stores/          # ✅ Should exist
│   └── utils/           # ✅ Should exist
```

All directories should already exist from Feature 001.

## Development Setup

### 4. TypeScript Interfaces

Copy interface files from `specs/002-clipboard-share-detection/contracts/` to `mobile/src/types/`:

```bash
# Create types directory if it doesn't exist
mkdir -p mobile/src/types

# Copy interface files (for reference, actual implementation will use local imports)
cp specs/002-clipboard-share-detection/contracts/*.ts mobile/src/types/
```

**Note**: These are reference contracts. Actual implementation will define types locally in their respective files.

### 5. Environment Configuration

No new environment variables needed. Clipboard monitoring uses existing configuration from Feature 001.

Optional: Add clipboard monitoring config to `mobile/src/utils/constants.ts`:

```typescript
export const CLIPBOARD_CONFIG = {
  ENABLED: true,
  DEBOUNCE_MS: 1000,
  DEDUPLICATION_WINDOW_MS: 5 * 60 * 1000, // 5 minutes
  PREVIEW_MAX_LENGTH: 100,
  CLIPBOARD_READ_TIMEOUT_MS: 2000,
  CLEANUP_INTERVAL_MS: 10 * 60 * 1000, // 10 minutes
};
```

## Running the App

### 6. Start Development Server

```bash
cd mobile

# Start Expo dev server
npx expo start

# Press 'i' for iOS simulator
# Press 'a' for Android emulator
```

### 7. Test Clipboard Detection (Cold Start)

1. **Copy a valid XHS link** (use one of these examples):
   ```
   https://www.xiaohongshu.com/explore/65a1b2c3d4e5f6789012
   https://xhslink.com/abc123
   https://www.xiaohongshu.com/discovery/item/xyz789
   ```

2. **Close the app completely** (swipe away from app switcher)

3. **Open the app** → You should see clipboard prompt appear within 1 second

4. **Expected behavior**:
   - Modal slides up from bottom
   - Shows detected URL (truncated to 100 chars)
   - "Add to Library" and "Dismiss" buttons visible
   - If offline: Shows "📡 Offline - will sync later" indicator

### 8. Test Clipboard Detection (Foreground Transition)

1. **With app running**, switch to another app (e.g., Safari/Chrome)

2. **Copy a valid XHS link** in the other app

3. **Switch back to XHS AI Summary app** → Clipboard prompt should appear

4. **Expected behavior**: Same as cold start test

### 9. Test Deduplication Logic

1. **Copy XHS link and open app** → Prompt appears

2. **Tap "Dismiss"** → Prompt closes

3. **Immediately close and reopen app** → No prompt (deduplicated)

4. **Wait 6 minutes** → Copy same link again, open app → Prompt appears (dedup expired)

### 10. Test Offline Mode

1. **Enable airplane mode** on device/simulator

2. **Copy XHS link and open app** → Prompt appears with offline indicator

3. **Tap "Add to Library"** → Success message shows "Saved offline, will sync later"

4. **Disable airplane mode** → Link should sync automatically in background

## Testing Checklist

### Manual Testing (on Real Device)

#### iOS 14+ Specific Tests:
- [ ] First clipboard access shows iOS system notification "pasted from..."
- [ ] Subsequent accesses don't show notification (permission granted)
- [ ] Permission denial handled gracefully (no crash)
- [ ] No clipboard access if permission not granted

#### Android Tests:
- [ ] Clipboard read works without permission prompt
- [ ] No system notifications for clipboard access
- [ ] Hardware back button dismisses prompt correctly

#### Cross-Platform Tests:
- [ ] Cold start clipboard detection (<500ms)
- [ ] Foreground transition clipboard detection (<500ms)
- [ ] Deduplication prevents re-prompting (5-minute window)
- [ ] Offline indicator shows when network unavailable
- [ ] Long URLs (>1000 chars) truncated correctly in display
- [ ] Invalid URLs silently ignored (no error shown)
- [ ] Empty clipboard silently ignored (no error)
- [ ] Rapid app switching doesn't show multiple prompts

### Automated Testing (Unit Tests)

Run unit tests for clipboard monitoring logic:

```bash
cd mobile

# Run all tests
npm test

# Run specific test file
npm test clipboard-monitor.test.ts

# Run with coverage
npm test -- --coverage
```

**Expected test coverage**:
- `clipboard-monitor.ts`: >80% coverage
- `clipboard-check-repository.ts`: >90% coverage
- `ignored-url-repository.ts`: >90% coverage
- `clipboard-store.ts`: >80% coverage

### Database Verification

Check that database tables were created:

```typescript
// In React Native debugger console or via Expo dev tools

import { getDatabase } from './src/db/repository';

const db = await getDatabase();

// Check clipboard_checks table exists
const checks = await db.getAllAsync('SELECT * FROM clipboard_checks LIMIT 5');
console.log('Clipboard checks:', checks);

// Check ignored_urls table exists
const ignored = await db.getAllAsync('SELECT * FROM ignored_urls');
console.log('Ignored URLs:', ignored);

// Verify indexes exist
const indexes = await db.getAllAsync(`
  SELECT name FROM sqlite_master
  WHERE type = 'index' AND (
    name LIKE 'idx_clipboard_%' OR
    name LIKE 'idx_ignored_%'
  )
`);
console.log('Indexes:', indexes);
// Should show: idx_clipboard_checks_created, idx_clipboard_checks_action,
//              idx_ignored_urls_hash, idx_ignored_urls_expires
```

## Debugging Tips

### Enable Verbose Logging

Add debug logs to clipboard monitor service:

```typescript
// In mobile/src/services/clipboard-monitor.ts

const DEBUG = __DEV__; // Only in development

async function checkClipboard() {
  if (DEBUG) console.log('[ClipboardMonitor] Starting check...');

  const content = await Clipboard.getStringAsync();
  if (DEBUG) console.log('[ClipboardMonitor] Content:', content?.slice(0, 50));

  // ... rest of implementation
}
```

### Common Issues

**Issue**: Prompt doesn't appear on app launch

**Solution**:
1. Check AppState listener is registered in `app/_layout.tsx`
2. Verify `checkClipboard()` is called on mount
3. Check clipboard has valid XHS URL
4. Look for errors in console: `npx expo start --clear`

---

**Issue**: Prompt shows multiple times for same URL

**Solution**:
1. Verify deduplication logic in `isRecentlyHandled()`
2. Check database indexes exist: `idx_ignored_urls_hash`
3. Confirm expiration time calculation: `createdAt + 5 minutes`

---

**Issue**: iOS clipboard permission denied

**Solution**:
1. This is expected on iOS 14+ on first access
2. Check that code handles permission gracefully (try-catch)
3. Verify no error message shown to user
4. Grant permission in Settings → [App Name] → Paste from Other Apps

---

**Issue**: Offline indicator not showing

**Solution**:
1. Verify `expo-network` is installed correctly
2. Check network state listener in clipboard prompt component
3. Test with airplane mode (more reliable than WiFi toggle)
4. Check `isConnected` and `isInternetReachable` both false

### Performance Profiling

Monitor clipboard check performance:

```typescript
// In clipboard-monitor.ts

async function checkClipboard() {
  const startTime = Date.now();

  try {
    // ... clipboard check logic
  } finally {
    const duration = Date.now() - startTime;
    console.log(`[ClipboardMonitor] Check took ${duration}ms`);

    if (duration > 500) {
      console.warn('[ClipboardMonitor] Check exceeded 500ms budget!');
    }
  }
}
```

Expected times:
- Clipboard read: <100ms
- URL validation: <20ms
- Deduplication check: <10ms
- Total: <190ms (well under 500ms budget)

### Database Query Profiling

Check query performance with EXPLAIN QUERY PLAN:

```typescript
const db = await getDatabase();

// Profile deduplication query
const plan = await db.getAllAsync(`
  EXPLAIN QUERY PLAN
  SELECT 1 FROM ignored_urls
  WHERE url_hash = ? AND expires_at > ?
  LIMIT 1
`, ['sample_hash', Date.now()]);

console.log('Query plan:', plan);
// Should show: "SEARCH TABLE ignored_urls USING INDEX idx_ignored_urls_hash"
```

## Next Steps

After completing quickstart setup:

1. **Read the full specification**: `specs/002-clipboard-share-detection/spec.md`
2. **Review implementation plan**: `specs/002-clipboard-share-detection/plan.md`
3. **Study data model**: `specs/002-clipboard-share-detection/data-model.md`
4. **Implement tasks**: Run `/speckit.tasks` to generate task breakdown

## Troubleshooting

### Reset Database (if needed)

```typescript
// CAUTION: This will delete all data
import { getDatabase } from './src/db/repository';

const db = await getDatabase();
await db.execAsync('DROP TABLE IF EXISTS clipboard_checks');
await db.execAsync('DROP TABLE IF EXISTS ignored_urls');
await db.execAsync('UPDATE schema_metadata SET version = 1 WHERE id = 1');

// Then restart app to re-run migration
```

### Clear Clipboard Deduplication State

```typescript
// Clear all ignored URLs (reset deduplication)
const db = await getDatabase();
await db.execAsync('DELETE FROM ignored_urls');
```

### View Clipboard Check Analytics

```typescript
import { getStatistics } from './src/db/repositories/clipboard-check-repository';

const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
const stats = await getStatistics(last24Hours);

console.log('Clipboard monitoring stats (last 24h):', stats);
/*
Output example:
{
  totalChecks: 47,
  promptsShown: 12,
  invalidUrls: 18,
  duplicatesPrevented: 15,
  emptyChecks: 2,
  percentages: {
    prompted: 25.5,
    ignoredInvalid: 38.3,
    ignoredDuplicate: 31.9,
    ignoredEmpty: 4.3
  }
}
*/
```

## Support

- **Technical issues**: Check console logs with `npx expo start --clear`
- **Database issues**: Inspect SQLite with Expo DevTools → Storage
- **Performance issues**: Enable performance monitoring (see above)
- **iOS permission issues**: Reset simulator: Device → Erase All Content and Settings

## Resources

- [Expo Clipboard Docs](https://docs.expo.dev/versions/latest/sdk/clipboard/)
- [React Native AppState Docs](https://reactnative.dev/docs/appstate)
- [Expo Network Docs](https://docs.expo.dev/versions/latest/sdk/network/)
- [Expo SQLite Docs](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Feature 001 Documentation](../001-xhs-share-collection/)
