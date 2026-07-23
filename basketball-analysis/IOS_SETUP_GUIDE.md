# 📱 SHOTIQ AI - iOS App Setup Guide

This guide explains how to build and run the SHOTIQ AI iOS app using Capacitor.

## 🏗️ Architecture Overview

Your app now supports **three platforms** from a single codebase:

| Platform | Technology | Directory | Build Command |
|----------|-----------|-----------|---------------|
| **Web** | Next.js | `.next/` | `npm run build` |
| **Desktop** | Tauri | `src-tauri/` | `npm run tauri:build` |
| **iOS** | Capacitor | `ios/` | `npm run ios:build` |

All platforms share the same source code in `src/`.

## 📋 Prerequisites

1. **macOS** with Xcode 15+ installed
2. **Xcode Command Line Tools**: `xcode-select --install`
3. **CocoaPods** (optional, Capacitor uses SPM by default)
4. **Apple Developer Account** (for device testing and App Store)

## 🚀 Quick Start

### Verified pre-Xcode handoff

From Node 22, run the complete repository gate before handing the project to
the Mac/Xcode owner:

```bash
cd basketball-analysis
nvm use
npm install
npm run handoff:ios
```

`handoff:ios` runs the web/unit/browser verification, synchronizes Capacitor,
and validates the Xcode project, bundle/version/signing settings, permission
descriptions, Swift package plugins, custom Vision bridge, generated native
configuration, and bundled offline bootstrap page. A passing command means the
repository is **ready to be handed to Xcode**; compiling, signing, simulator,
and physical-device testing are the next Xcode phase, not prerequisites to the
handoff.

### Development Build

```bash
# Navigate to the basketball-analysis directory
cd basketball-analysis

# Verify/sync, then open Xcode
npm run handoff:ios
npm run cap:open:ios
```

This will:
1. Verify the web application and browser flows
2. Sync the server-backed native shell and plugins
3. Validate every required pre-Xcode artifact
4. Open Xcode

### Production Build

```bash
# Full production build
npm run ios:build

# Open Xcode to archive
npm run cap:open:ios
```

## 📁 Project Structure

```
basketball-analysis/
├── src/                      # Shared source code (all platforms)
├── src-tauri/                # Desktop app (Tauri)
├── ios/                      # iOS app (Capacitor) ← NEW
│   └── App/
│       ├── App/
│       │   ├── AppDelegate.swift
│       │   ├── Info.plist       # iOS permissions
│       │   └── Assets.xcassets/ # App icons
│       └── App.xcodeproj/       # Xcode project
├── out/                      # Static export for Capacitor
├── capacitor.config.ts       # Capacitor configuration
└── package.json              # Updated with iOS scripts
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run handoff:ios` | Complete pre-Xcode verification and Capacitor sync |
| `npm run verify:ios-handoff` | Validate the already-synced Xcode handoff artifacts |
| `npm run ios:dev` | Build and open Xcode for development |
| `npm run ios:build` | Build static export and sync to iOS |
| `npm run cap:sync:ios` | Sync web assets to iOS (after changes) |
| `npm run cap:open:ios` | Open iOS project in Xcode |

## 📱 Running on Device/Simulator

### Simulator
1. Run `npm run ios:dev`
2. In Xcode, select a simulator from the device dropdown
3. Press ▶️ (Run) or `Cmd + R`

### Physical Device
1. Connect your iPhone via USB
2. In Xcode, select your device from the dropdown
3. You may need to trust the developer certificate on your iPhone:
   - Go to Settings > General > Device Management
   - Trust your developer certificate
4. Press ▶️ (Run) or `Cmd + R`

## 🎨 App Icons

The iOS app icons are automatically set up from the existing Tauri icons.
Location: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

To update icons:
1. Replace icons in `src-tauri/icons/ios/`
2. Run `npm run cap:sync:ios`

## 🔐 Permissions

The app requests these permissions (configured in `Info.plist`):

| Permission | Purpose |
|------------|---------|
| Camera | Record shooting form videos |
| Photo Library | Select existing photos/videos |
| Photo Library Add | Save analyzed images |
| Microphone | Audio in video recordings |

## 🌐 API Configuration

### Development
For local development, the app can connect to your local backend:

1. Edit `capacitor.config.ts`:
```typescript
server: {
  url: 'http://localhost:3000',  // Uncomment this line
  cleartext: true,
}
```

2. Rebuild: `npm run cap:sync:ios`

### Production
The app connects to `https://api.shotiqai.com` by default.

Configure via environment variables:
- `NEXT_PUBLIC_API_URL` - Main API URL
- `NEXT_PUBLIC_MOBILE_API_URL` - Mobile-specific API URL

## 🐛 Troubleshooting

### "Could not find the web assets directory"
```bash
# Build the static export first
CAPACITOR_BUILD=true npm run build
npm run cap:sync:ios
```

### "No bundle URL present"
```bash
# Clean and rebuild
rm -rf out .next
npm run ios:build
```

### Xcode build fails
1. Clean build folder: `Cmd + Shift + K`
2. Delete derived data: `rm -rf ~/Library/Developer/Xcode/DerivedData`
3. Rebuild

### Camera not working in simulator
The iOS Simulator doesn't support camera. Test on a physical device.

## 📤 App Store Submission

1. **Archive the app**:
   - In Xcode: Product > Archive
   
2. **Configure signing**:
   - Select your team in Signing & Capabilities
   - Ensure you have a valid provisioning profile

3. **Upload to App Store Connect**:
   - Window > Organizer
   - Select your archive
   - Click "Distribute App"

## 🔄 Development Workflow

1. **Make changes** in `src/`
2. **Test on web**: `npm run dev`
3. **Sync to iOS**: `npm run cap:sync:ios`
4. **Test on iOS**: Run in Xcode

### Live Reload (Development)
For faster development, enable live reload:

1. Edit `capacitor.config.ts`:
```typescript
server: {
  url: 'http://YOUR_IP:3000',
  cleartext: true,
}
```

2. Run `npm run dev` (web server)
3. Run the app in Xcode

Changes will hot-reload on your device!

## 📚 Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor iOS Guide](https://capacitorjs.com/docs/ios)
- [App Store Connect](https://appstoreconnect.apple.com)

---

## 🎯 Platform Detection

Your code can detect the current platform:

```typescript
import { getPlatform, isMobile, isIOS } from '@/utils/platform';

// Check platform
if (isIOS()) {
  // iOS-specific code
}

if (isMobile()) {
  // Mobile (iOS or Android) code
}

const platform = getPlatform(); // 'web' | 'desktop' | 'ios' | 'android'
```

## 📸 Camera Usage

Use the Capacitor camera service:

```typescript
import { takePhoto, pickPhotos } from '@/services/capacitorCamera';

// Take a photo
const photo = await takePhoto({
  source: 'camera',
  quality: 90,
});

// Pick from gallery
const photos = await pickPhotos(7); // Up to 7 photos
```

---

**Your SHOTIQ AI app is now ready for iOS! 🏀📱**






