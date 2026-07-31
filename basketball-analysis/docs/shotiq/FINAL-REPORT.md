# ShotIQ Production Build — Final Report

Branch `claude/shotiq-production-build-txi5pl` · 2026-07-31

Every number in this report was measured in this session and can be re-run with
the commands listed. Nothing here is estimated.

---

## 1. Screens

| Deliverable | Result |
|---|---|
| Sidecars authoritative | **92 / 92** — zero unresolved authority errors (`sidecar-authority-report.md`) |
| Desktop screens implemented & reachable | **20 / 20** — includes the two routes that did not exist (`/elite-shooters/[shooterId]`, `/training/drills/[drillId]`) |
| iOS screens authored (native SwiftUI) | **72 / 72** — structural check (72/72 screenIds present in source) |
| iOS screens — Expo/React Native port | **72 / 72 authored, registered, and COMPILED** — `expo export --platform ios` exit 0, 2.2MB Hermes bytecode bundle |
| SwiftUI target compiled via Xcode | 0 / 72 — still needs macOS (see §5); the Expo port removes this as the blocking path |

## 2. Visual measurement (desktop, per-screen table in `visual-proof-structural.md`)

| Metric | Baseline | Final |
|---|---|---|
| Screens measured | 18/18 | **20/20** |
| Mean SSIM vs canonical reference (styled) | 0.3380 | **0.5738** |
| Screens improved | — | 20/20 |
| **Structural acceptance gate (accepted criteria)** | 0/18 | **20/20 PASS** |

An earlier interim figure (0.6410) was measured against a stale server serving
unstyled pages and is superseded — see `visual-proof-structural.md` for the
correction and the enforced gate definition.

The 0.98 gate is not achievable against these references, proven in
`acceptance-gate-findings.md`: 0.0% of 8×8 patches in all 20 reference PNGs are
flat (they are generated rasters — the token `#FF5A1F` renders there as
`#FD6442`, `#111111` ink as `#4E5050`); sidecar elements cover only 55.15% of
canvas; photo asset binaries were never supplied; DIN Condensed is not
licensable for web. SSIM is therefore a regression signal (floor file:
`visual-proof-floor.json`, tolerance 0.02), and no screen is called "1:1".
The owner approved switching acceptance to the structural gate, which now
passes **20/20** and is enforced by `npm run proof:visual`'s exit code:
critical-region presence and containment, no broken same-origin assets, no JS
errors, canonical fonts loaded, SSIM non-regression.

## 3. Functional verification (web) — actual command results

```
npx tsc --noEmit                    → exit 0
npx vitest run                      → 212/212 tests, 50/50 files, exit 0
NODE_ENV=production npm run build   → exit 0, 67/67 static pages
REF_DIR=… npm run proof:visual      → 20/20 PASS (structural gate), exit 0
npx playwright test                 → 22/22 PASS, exit 0 (desktop + mobile
                                      viewports; browser provided by symlinking
                                      /usr/local/bin/chromium → the container's
                                      chromium-1194, the config's own fallback)
```

The e2e run surfaced and fixed a real regression: the canonical sign-in
rebuild had dropped the accessibility contract that failed validation moves
focus to the email field. Restored in the page (not the test).

Functionality preserved or added, not mocked:
- Sign-in keeps `useAuthStore.signIn`, error paths and profileComplete redirect.
- Dashboard renders real `/api/analysis-history` stats with honest empty states;
  professional/standard variants keyed off the preserved `dashboardViewStore`.
- Analyze: images run the preserved MediaPipe `PoseAnalysis` flow; videos
  enqueue into the resumable IndexedDB queue consumed by `UploadQueueManager`.
- Elite detail reads the DB-backed `/api/shooters` (Prisma + static fallback).
- Drill execution: make/miss/undo drive live make-%, last-24 strip, history and
  set rings; every mark POSTs to `/api/shot-events`; pause/resume clock.
- All `/results/demo` tabs, media, points, badges, profile, settings,
  elite-shooters, video-analysis and upload render inside the canonical shell;
  every previously reachable tab remains reachable.

## 4. iOS deliverable

`basketball-analysis/ios-native/` — SwiftUI, MVVM, async/await, Codable,
URLSession, Keychain (short-lived access + rotating refresh tokens), PhotosUI,
AVFoundation, UserNotifications, status bar hidden, tokens generated from the
same sidecar source as web. Pose overlays and charts are Canvas/Path with
normalized keypoints scaled through the surface transform (with a unit test
asserting proportional alignment). XCTest + XCUITest suites included.
Verification on Linux: 72/72 screenIds present; all 14 files (3,594 lines)
**pass the real Swift 6.1.2 parser** (`swiftc -parse`, toolchain from
swift.org for Ubuntu 24.04 — `ios-native/verify-parse.sh`). This is the
verification ceiling off-macOS: SwiftUI and Security are Apple-platform
frameworks, so type-check/build/XCTest still require Xcode. Xcode itself is
macOS-only software and cannot run in this Linux container - confirmed by
direct inspection (no xcodebuild/xcrun/swift preinstalled, not macOS).

## 5. Remaining external blockers (exact commands)

1. **iOS is no longer blocked for development.** The Expo port at
   `basketball-analysis/mobile/` compiles on Linux (`npm run export:ios`,
   verified exit 0) and runs immediately on a physical iPhone via Expo Go
   (`npx expo start` and scan the QR). What still needs external input:
   - a signed `.ipa` / TestFlight build: `eas build -p ios --profile preview`
     (simulator build, no Apple account) or `--profile production` (Apple
     signing) — both need an `EXPO_TOKEN` to run from this container;
   - the alternative native SwiftUI target still needs macOS + Xcode:
   ```bash
   brew install xcodegen
   cd basketball-analysis/ios-native && xcodegen generate
   xcodebuild -project ShotIQ.xcodeproj -scheme ShotIQ \
     -destination 'platform=iOS Simulator,name=iPhone 16' test
   # repeat with a second viewport, e.g. name=iPhone SE (3rd generation)
   ```
   Apple signing required for device installs.
2. **Playwright e2e — RESOLVED, no longer a blocker.** The public suite runs
   green here (22/22). Only auth-gated journey specs (none currently exist)
   would need `DATABASE_URL`/NextAuth secrets.
3. **Photo asset gap** — reference photographs were never supplied and
   `asset-registry.json` / `asset-request.json` were absent from the shared
   package; GPT Image 2 generation is not available in this session. Photo
   regions render as canonical media surfaces until assets are provided.
4. **Copy deck** — sidecar text is OCR-derived (`referenceTextMatched: false`
   on many elements); exact-text verification needs authored copy.

## 6. Commit history for this work

```
ebb44bf  sidecar authority + shared design tokens (92/92, zero errors)
65b2886  deterministic visual-proof harness + measured baseline (0.3380)
3298465  canonical sign-in rebuild + acceptance-gate findings
72a94a3  all 20 desktop screens + 2 missing routes
5c0f7f2  native SwiftUI iOS app — 72/72 screens authored + tests
9d40345  final report
7c3beef  structural acceptance gate adopted; 20/20 desktop PASS
4f6fa26  Expo iOS app — 72/72 screens, compiled (Hermes bundle, exit 0)
281e62d  SwiftUI target parse-verified with Swift 6.1.2 (14/14)
(this)   e2e suite green 22/22; sign-in focus regression fixed
```
