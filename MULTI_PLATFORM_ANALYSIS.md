# SHOTIQ AI - Multi-Platform Deployment Analysis

**Date:** December 27, 2025  
**Current State:** Next.js 14 Web Application  
**Target Platforms:** Web, Desktop (Tauri), iOS, Android

---

## 📊 CURRENT WEB APP ANALYSIS

### Framework & Architecture
- **Framework:** Next.js 14.2.28 (React 18.2.0)
- **Language:** TypeScript 5.x
- **Styling:** TailwindCSS 3.3.3
- **State Management:** Zustand 5.0.9
- **Data Fetching:** TanStack React Query 5.0.0
- **Database:** PostgreSQL with Prisma ORM 6.7.0
- **Authentication:** NextAuth.js 4.24.13

### Key Dependencies Analysis

#### ✅ Cross-Platform Compatible (90% of dependencies)
- **UI Components:** Radix UI (fully compatible)
- **Animations:** Framer Motion, GSAP (compatible)
- **Forms:** React Hook Form, Zod (compatible)
- **State:** Zustand (compatible)
- **HTTP:** Axios (compatible)
- **Icons:** Lucide React (compatible)
- **Charts:** Recharts, Plotly.js (compatible)
- **Utilities:** clsx, tailwind-merge, uuid (compatible)

#### ⚠️ Platform-Specific Adaptations Needed
1. **@aws-sdk/client-s3** - Works on all platforms, but needs platform-specific configurations
2. **@prisma/client** - Database access (web: remote, desktop: local SQLite option, mobile: SQLite)
3. **next-auth** - Web-specific, needs alternative for mobile/desktop
4. **@tensorflow/tfjs** - Works but performance varies by platform
5. **html-to-image** - Browser-specific, needs native alternatives for mobile
6. **react-dropzone** - Works but needs native file pickers on mobile

#### ❌ Web-Only (Need Alternatives)
1. **Next.js Server Components** - Need client-side alternatives for mobile
2. **Next.js API Routes** - Need to call external API or embed server
3. **next/image** - Need platform-specific image components

### Browser-Specific APIs Found (32 files)

**Storage APIs:**
- `localStorage` - Used extensively (32 files)
- `sessionStorage` - Used in session management
- `window` object - Used for browser detection and events
- `document` object - Used for DOM manipulation
- `navigator` object - Used for browser capabilities

**Key Files Using Browser APIs:**
1. `src/services/sessionStorage.ts` - Heavy localStorage usage
2. `src/hooks/useLocalStorage.ts` - localStorage wrapper
3. `src/services/gamificationService.ts` - localStorage for progress
4. `src/stores/authStore.ts` - Cookie management
5. `src/app/settings/page.tsx` - localStorage for settings
6. `src/components/analysis/*` - Video/canvas APIs
7. `src/lib/watermark.ts` - Canvas API
8. `src/lib/upload/uploadValidation.ts` - File API

---

## 🏗️ MULTI-PLATFORM ARCHITECTURE STRATEGY

### Platform Abstraction Layer Design

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
│              (Shared Business Logic - 90%)               │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│              Platform Abstraction Layer                  │
│  (Storage, FS, Navigation, Media, Notifications, Auth)  │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼───────┐  ┌───────▼────────┐  ┌──────▼──────┐
│  Web Platform │  │ Desktop (Tauri)│  │   Mobile    │
│   (Browser)   │  │  macOS/Win/Lin │  │  iOS/Android│
└───────────────┘  └────────────────┘  └─────────────┘
```

### Recommended Mobile Framework

**🎯 RECOMMENDATION: Tauri Mobile (Beta) + Capacitor Hybrid**

**Rationale:**
1. **Tauri Mobile** (currently in beta):
   - Same codebase as Tauri Desktop
   - Rust-based, lightweight
   - Direct native API access
   - Better performance than Capacitor alone
   - Smaller bundle size

2. **Capacitor** (fallback/supplement):
   - Mature, production-ready
   - Excellent plugin ecosystem
   - Easy migration path
   - Works with existing web code
   - Good community support

3. **NOT React Native** because:
   - Requires significant code rewrite
   - Different component library
   - Loses web code reusability
   - More maintenance overhead

---

## 📁 NEW MULTI-PLATFORM FILE STRUCTURE

```
basketball-analysis/
├── src/
│   ├── core/                          # ✅ SHARED: Business Logic (ALL platforms)
│   │   ├── analysis/
│   │   │   ├── biomechanical.ts
│   │   │   ├── formAnalysis.ts
│   │   │   ├── poseDetection.ts
│   │   │   └── scoring.ts
│   │   ├── gamification/
│   │   │   ├── achievements.ts
│   │   │   ├── levels.ts
│   │   │   └── points.ts
│   │   ├── matching/
│   │   │   ├── eliteComparison.ts
│   │   │   └── similarity.ts
│   │   └── validation/
│   │       ├── formValidation.ts
│   │       └── inputValidation.ts
│   │
│   ├── components/                    # ✅ SHARED: UI Components (ALL platforms)
│   │   ├── analysis/
│   │   ├── comparison/
│   │   ├── dashboard/
│   │   ├── gamification/
│   │   ├── profile/
│   │   ├── training/
│   │   ├── ui/                        # Base UI components
│   │   └── upload/
│   │
│   ├── features/                      # ✅ SHARED: Feature Modules (ALL platforms)
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── services/
│   │   ├── analysis/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── services/
│   │   ├── profile/
│   │   └── settings/
│   │
│   ├── platforms/                     # ⚠️ PLATFORM-SPECIFIC CODE
│   │   ├── web/                       # Web-only code
│   │   │   ├── components/
│   │   │   │   ├── NextImage.tsx
│   │   │   │   └── WebVideoPlayer.tsx
│   │   │   ├── pages/                 # Next.js pages
│   │   │   ├── api/                   # Next.js API routes
│   │   │   └── middleware.ts
│   │   │
│   │   ├── desktop/                   # Tauri desktop-only code
│   │   │   ├── commands/              # Rust commands
│   │   │   ├── components/
│   │   │   │   ├── TitleBar.tsx
│   │   │   │   └── NativeMenu.tsx
│   │   │   └── main.rs                # Tauri entry point
│   │   │
│   │   └── mobile/                    # Mobile-only code
│   │       ├── ios/                   # iOS-specific
│   │       │   ├── Info.plist
│   │       │   └── LaunchScreen.storyboard
│   │       ├── android/               # Android-specific
│   │       │   ├── AndroidManifest.xml
│   │       │   └── build.gradle
│   │       └── components/
│   │           ├── NativeCamera.tsx
│   │           └── NativeGallery.tsx
│   │
│   ├── api/                           # ✅ SHARED: API Layer (ALL platforms)
│   │   ├── client/
│   │   │   ├── analysis.ts
│   │   │   ├── auth.ts
│   │   │   ├── profile.ts
│   │   │   └── storage.ts
│   │   ├── adapters/                  # Platform-specific API adapters
│   │   │   ├── web.ts
│   │   │   ├── desktop.ts
│   │   │   └── mobile.ts
│   │   └── types/
│   │
│   ├── services/                      # ✅ SHARED: Business Services (ALL platforms)
│   │   ├── platform/                  # 🔑 PLATFORM ABSTRACTION LAYER
│   │   │   ├── storage/
│   │   │   │   ├── index.ts           # Platform-agnostic interface
│   │   │   │   ├── web.ts             # localStorage implementation
│   │   │   │   ├── desktop.ts         # Tauri storage implementation
│   │   │   │   └── mobile.ts          # AsyncStorage implementation
│   │   │   ├── filesystem/
│   │   │   │   ├── index.ts
│   │   │   │   ├── web.ts             # File API
│   │   │   │   ├── desktop.ts         # Tauri FS
│   │   │   │   └── mobile.ts          # Capacitor Filesystem
│   │   │   ├── navigation/
│   │   │   │   ├── index.ts
│   │   │   │   ├── web.ts             # Next.js router
│   │   │   │   ├── desktop.ts         # Tauri navigation
│   │   │   │   └── mobile.ts          # React Navigation
│   │   │   ├── media/
│   │   │   │   ├── index.ts
│   │   │   │   ├── web.ts             # HTML5 video
│   │   │   │   ├── desktop.ts         # Native video
│   │   │   │   └── mobile.ts          # Native camera/gallery
│   │   │   ├── notifications/
│   │   │   │   ├── index.ts
│   │   │   │   ├── web.ts             # Web notifications
│   │   │   │   ├── desktop.ts         # Tauri notifications
│   │   │   │   └── mobile.ts          # Push notifications
│   │   │   └── auth/
│   │   │       ├── index.ts
│   │   │       ├── web.ts             # NextAuth
│   │   │       ├── desktop.ts         # Tauri auth
│   │   │       └── mobile.ts          # Mobile auth
│   │   │
│   │   ├── analysis/                  # Analysis services
│   │   ├── coaching/                  # Coaching services
│   │   ├── comparison/                # Comparison services
│   │   └── gamification/              # Gamification services
│   │
│   ├── stores/                        # ✅ SHARED: State Management (ALL platforms)
│   │   ├── analysisStore.ts
│   │   ├── authStore.ts
│   │   ├── profileStore.ts
│   │   └── settingsStore.ts
│   │
│   ├── hooks/                         # ✅ SHARED: Custom Hooks (ALL platforms)
│   │   ├── useAnalysis.ts
│   │   ├── useAuth.ts
│   │   ├── useDebounce.ts
│   │   ├── usePlatform.ts             # 🔑 Platform detection hook
│   │   ├── useStorage.ts              # 🔑 Platform-agnostic storage hook
│   │   └── useNavigation.ts           # 🔑 Platform-agnostic navigation
│   │
│   ├── utils/                         # ✅ SHARED: Utilities (ALL platforms)
│   │   ├── constants.ts
│   │   ├── errors.ts
│   │   ├── formatting.ts
│   │   ├── platform.ts                # 🔑 Platform detection utilities
│   │   └── validation.ts
│   │
│   ├── config/                        # ⚠️ PLATFORM-SPECIFIC CONFIG
│   │   ├── index.ts                   # Platform detection & config loader
│   │   ├── web.ts                     # Web config
│   │   ├── desktop.ts                 # Desktop config
│   │   ├── mobile.ts                  # Mobile config
│   │   └── shared.ts                  # Shared config
│   │
│   ├── types/                         # ✅ SHARED: TypeScript Types (ALL platforms)
│   │   ├── index.ts
│   │   ├── analysis.ts
│   │   ├── platform.ts                # Platform-specific types
│   │   └── user.ts
│   │
│   └── data/                          # ✅ SHARED: Static Data (ALL platforms)
│       ├── drillDatabase.ts
│       ├── eliteShooters.ts
│       └── shootingFlawsDatabase.ts
│
├── public/                            # Static assets
│   ├── images/
│   ├── icons/
│   │   ├── web/                       # Web favicons
│   │   ├── desktop/                   # Desktop app icons
│   │   └── mobile/                    # Mobile app icons
│   └── fonts/
│
├── prisma/                            # Database schema
│   └── schema.prisma
│
├── config/                            # Build configurations
│   ├── web/
│   │   ├── next.config.mjs
│   │   └── .env.web
│   ├── desktop/
│   │   ├── tauri.conf.json
│   │   └── .env.desktop
│   └── mobile/
│       ├── capacitor.config.ts
│       ├── .env.ios
│       └── .env.android
│
├── scripts/                           # Build & deployment scripts
│   ├── build-web.sh
│   ├── build-desktop.sh
│   ├── build-ios.sh
│   └── build-android.sh
│
└── docs/                              # Documentation
    ├── PLATFORM_ABSTRACTION.md
    ├── BUILD_GUIDE.md
    └── DEPLOYMENT.md
```

---

## 🔑 PLATFORM ABSTRACTION LAYER IMPLEMENTATION

### Example: Storage Abstraction

```typescript
// src/services/platform/storage/index.ts
export interface PlatformStorage {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
  clear(): Promise<void>
  getAllKeys(): Promise<string[]>
}

// Auto-detect platform and export correct implementation
import { getPlatform } from '@/utils/platform'

let storage: PlatformStorage

const platform = getPlatform()

if (platform === 'web') {
  storage = await import('./web').then(m => m.webStorage)
} else if (platform === 'desktop') {
  storage = await import('./desktop').then(m => m.desktopStorage)
} else {
  storage = await import('./mobile').then(m => m.mobileStorage)
}

export { storage }
```

---

## 📱 RESPONSIVE DESIGN REQUIREMENTS

### Breakpoints
- **Mobile:** 375px - 767px (Portrait & Landscape)
- **Tablet:** 768px - 1023px
- **Desktop Browser:** 1024px - 1920px+
- **Desktop App:** 800px minimum, resizable
- **Touch Targets:** Minimum 44x44px (iOS), 48x48px (Android)

### Platform-Specific UI Adaptations
1. **Web:** Standard desktop UI, mouse interactions
2. **Desktop App:** Native title bar, system menus, keyboard shortcuts
3. **iOS:** Bottom tab bar, swipe gestures, iOS design guidelines
4. **Android:** Material Design, FAB buttons, Android patterns

---

## 🚀 BUILD CONFIGURATIONS

### Web Build (Existing)
```bash
npm run build:web
# Output: .next/ directory
# Deploy: Vercel, Netlify, or custom server
```

### Desktop Build (Tauri - To Add)
```bash
npm run build:desktop
# Output: src-tauri/target/release/
# Platforms: .dmg (macOS), .exe (Windows), .AppImage (Linux)
```

### iOS Build (Capacitor - To Add)
```bash
npm run build:ios
# Output: ios/ directory
# Deploy: Xcode → App Store
```

### Android Build (Capacitor - To Add)
```bash
npm run build:android
# Output: android/ directory
# Deploy: Android Studio → Google Play
```

---

## ⚠️ PLATFORM-SPECIFIC CHALLENGES

### 1. Database Access
- **Web:** Remote PostgreSQL via API
- **Desktop:** Local SQLite + optional remote sync
- **Mobile:** Local SQLite + optional remote sync
- **Solution:** Prisma supports multiple databases, add SQLite schema

### 2. File System Access
- **Web:** Limited (File API, downloads only)
- **Desktop:** Full file system access via Tauri
- **Mobile:** Sandboxed access via Capacitor
- **Solution:** Platform abstraction layer for FS operations

### 3. Authentication
- **Web:** NextAuth.js (session-based)
- **Desktop:** Token-based (store in secure storage)
- **Mobile:** Token-based (Keychain/Keystore)
- **Solution:** Unified auth service with platform adapters

### 4. Video Processing
- **Web:** HTML5 video, canvas processing
- **Desktop:** Native video libraries
- **Mobile:** Native camera/gallery access
- **Solution:** Platform-specific video components

### 5. Offline Support
- **Web:** Service workers, IndexedDB
- **Desktop:** Full offline capability
- **Mobile:** Full offline capability
- **Solution:** Progressive enhancement, sync when online

---

## 📊 DEPENDENCY COMPATIBILITY MATRIX

| Dependency | Web | Desktop | iOS | Android | Notes |
|------------|-----|---------|-----|---------|-------|
| React | ✅ | ✅ | ✅ | ✅ | Core framework |
| Next.js | ✅ | ⚠️ | ❌ | ❌ | Web only, use React for others |
| Zustand | ✅ | ✅ | ✅ | ✅ | State management |
| Radix UI | ✅ | ✅ | ⚠️ | ⚠️ | May need mobile alternatives |
| Framer Motion | ✅ | ✅ | ✅ | ✅ | Animations |
| TailwindCSS | ✅ | ✅ | ✅ | ✅ | Styling |
| Prisma | ✅ | ✅ | ✅ | ✅ | Add SQLite support |
| NextAuth | ✅ | ❌ | ❌ | ❌ | Web only, need alternative |
| AWS SDK | ✅ | ✅ | ✅ | ✅ | Works everywhere |
| TensorFlow.js | ✅ | ✅ | ⚠️ | ⚠️ | Performance varies |
| Axios | ✅ | ✅ | ✅ | ✅ | HTTP client |

---

## 🎯 IMPLEMENTATION PHASES

### Phase 1: Cleanup & Preparation (Current)
- Remove unused dependencies
- Fix linting errors
- Extract hardcoded values to config
- Document current architecture

### Phase 2: Platform Abstraction Layer
- Create storage abstraction
- Create filesystem abstraction
- Create navigation abstraction
- Create media abstraction
- Create auth abstraction

### Phase 3: Code Restructuring
- Move shared code to `/core`
- Move components to `/components`
- Create `/platforms` directory
- Update imports and paths

### Phase 4: Desktop (Tauri) Integration
- Install Tauri dependencies
- Create Tauri configuration
- Implement desktop-specific features
- Test and optimize

### Phase 5: Mobile (Capacitor) Integration
- Install Capacitor dependencies
- Create iOS/Android projects
- Implement mobile-specific features
- Test on devices

### Phase 6: Testing & Optimization
- Cross-platform testing
- Performance optimization
- Bug fixes
- Documentation

---

## 📈 ESTIMATED EFFORT

| Phase | Estimated Time | Complexity |
|-------|---------------|------------|
| Cleanup & Preparation | 2-3 days | Low |
| Platform Abstraction | 3-5 days | Medium |
| Code Restructuring | 3-4 days | Medium |
| Desktop Integration | 5-7 days | High |
| Mobile Integration | 7-10 days | High |
| Testing & Optimization | 5-7 days | Medium |
| **TOTAL** | **25-36 days** | **High** |

---

## ✅ SUCCESS CRITERIA

1. ✅ Web app continues to work without breaking changes
2. ✅ Desktop app runs natively on macOS, Windows, Linux
3. ✅ iOS app runs on iPhone and iPad
4. ✅ Android app runs on phones and tablets
5. ✅ 90%+ code sharing across platforms
6. ✅ Platform-specific optimizations where needed
7. ✅ Consistent UI/UX across platforms
8. ✅ All features work on all platforms
9. ✅ Offline support on desktop and mobile
10. ✅ App store ready (iOS App Store, Google Play, etc.)

---

**Next Steps:** Begin Phase 1 - Cleanup & Preparation
