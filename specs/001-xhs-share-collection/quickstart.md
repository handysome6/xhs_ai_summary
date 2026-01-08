# Quickstart: XHS Share Collection

Get the XHS AI Summary app running locally for development.

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** or **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **Expo Go** app on your iOS/Android device (for testing)
- **Android Studio** or **Xcode** (for emulator/simulator testing)

## Project Setup

### 1. Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd xhs_ai_summary

# Install mobile app dependencies
cd mobile
npm install

# Install API dependencies
cd ../api
npm install
```

### 2. Environment Configuration

**Mobile App** (`mobile/.env`):
```env
API_BASE_URL=http://localhost:3000/api/v1
# For physical device testing, use your machine's local IP
# API_BASE_URL=http://192.168.1.100:3000/api/v1
```

**API Server** (`api/.env`):
```env
PORT=3000
NODE_ENV=development
ANTHROPIC_API_KEY=your-claude-api-key-here
```

### 3. Start Development Servers

**Terminal 1 - API Server**:
```bash
cd api
npm run dev
# Server starts at http://localhost:3000
```

**Terminal 2 - Mobile App**:
```bash
cd mobile
npx expo start
# Press 'i' for iOS simulator, 'a' for Android emulator
# Or scan QR code with Expo Go app
```

## Verify Installation

### API Health Check
```bash
curl http://localhost:3000/api/v1/health
# Expected: {"status":"healthy","timestamp":"...","version":"1.0.0"}
```

### Mobile App
1. Open app in Expo Go or simulator
2. Should see empty collection screen with "No saved posts" message
3. No errors in terminal

## Testing Share Intent (Development)

Since share intent requires a real device with XHS app, use the debug mode:

### Option 1: Debug Share Button
The app includes a debug button (development builds only) to simulate receiving a share:
1. Open the app
2. Tap "Debug: Simulate Share" button
3. Enter an XHS post URL
4. Verify post appears in collection

### Option 2: Deep Link Testing
```bash
# iOS Simulator
xcrun simctl openurl booted "xhsaisummary://share?url=https://www.xiaohongshu.com/explore/abc123"

# Android Emulator
adb shell am start -W -a android.intent.action.VIEW -d "xhsaisummary://share?url=https://www.xiaohongshu.com/explore/abc123"
```

## Project Structure Overview

```
xhs_ai_summary/
├── mobile/                 # React Native app
│   ├── app/                # Expo Router screens
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── services/       # Business logic
│   │   ├── db/             # SQLite database
│   │   ├── models/         # TypeScript types
│   │   └── hooks/          # React hooks
│   └── __tests__/          # Tests
├── api/                    # Node.js backend
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   └── services/       # Crawling & AI
│   └── tests/
└── specs/                  # Design documents
```

## Common Development Tasks

### Run Tests
```bash
# Mobile unit tests
cd mobile && npm test

# API tests
cd api && npm test

# E2E tests (requires running emulator)
cd mobile && npm run test:e2e
```

### Database Reset
```bash
# Clear app data (iOS Simulator)
xcrun simctl erase booted

# Or delete specific app data
# App Settings > XHS AI Summary > Clear Data
```

### View SQLite Database
```bash
# Export database from device/simulator
# Then open with SQLite browser
sqlite3 path/to/exported.db
.tables
SELECT * FROM posts LIMIT 5;
```

### Lint and Format
```bash
# Mobile
cd mobile && npm run lint && npm run format

# API
cd api && npm run lint && npm run format
```

## Troubleshooting

### "Cannot connect to API" on physical device
- Ensure device is on same network as development machine
- Use machine's local IP in `API_BASE_URL` (not `localhost`)
- Check firewall allows port 3000

### Share intent not working
- Share intent requires development build, not Expo Go
- Run `npx expo run:ios` or `npx expo run:android` for dev build

### XHS crawling fails
- XHS may block rapid requests; wait and retry
- Check if post URL is valid and public
- Verify Puppeteer is properly installed (`npm run check-puppeteer`)

### AI analysis returns errors
- Verify `ANTHROPIC_API_KEY` is set correctly
- Check API rate limits in Claude dashboard
- Review API logs for detailed error messages

## Next Steps

1. **Configure Share Extension**: Follow platform-specific guides in `docs/share-extension-setup.md`
2. **Add AI API Key**: Get key from [Anthropic Console](https://console.anthropic.com/)
3. **Build for Device**: Run `npx expo run:ios` or `npx expo run:android`
4. **Deploy API**: See `docs/deployment.md` for production setup

## Useful Commands Reference

| Command | Description |
|---------|-------------|
| `npx expo start` | Start Expo dev server |
| `npx expo start --clear` | Start with cache cleared |
| `npx expo run:ios` | Build and run on iOS |
| `npx expo run:android` | Build and run on Android |
| `npm test` | Run unit tests |
| `npm run lint` | Check code style |
| `npm run typecheck` | TypeScript type checking |
