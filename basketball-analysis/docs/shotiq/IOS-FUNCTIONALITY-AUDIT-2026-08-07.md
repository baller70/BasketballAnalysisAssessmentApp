# ShotIQ iOS Functionality Audit

Date: 2026-08-07
Branch: `claude/shotiq-production-build-txi5pl`
Repo: `BasketballAnalysisAssessmentApp`

Kevin's rule for this audit: do not believe a feature is real because the code
or the screen says it is. Mark it real only after a running-app test, automated
test, or device/simulator evidence proves it.

## Evidence Status

| Status | Meaning |
| --- | --- |
| Verified | A command or running-app test passed in this session. |
| Failed | A command or running-app test failed in this session. |
| Blocked | The correct test could not run in this environment yet. |
| Code-only suspicion | The code strongly indicates a defect, but it still needs a running-app proof. |

## Tests Run This Session

| Area | Command | Result |
| --- | --- | --- |
| Web/shared video analysis, live overlay sizing, crop-image logic, resumable upload queue | `npm run test -- tests/services/videoAnalysis.test.ts tests/components/live/FullscreenLiveCamera.test.tsx tests/lib/image/cropImage.test.ts tests/lib/upload/resumableVideoUpload.test.ts tests/lib/upload/uploadQueue.test.ts` | Verified: 5 files, 35 tests passed. |
| Web production build | `npm run build` from `basketball-analysis/` | Verified: build completed successfully. |
| iOS-to-web Bearer auth/write/read proof | `npx playwright test tests/e2e/ios-auth-chain.spec.ts --project=desktop-chromium` | Failed in local environment before app behavior could be verified: signin/signup returned `500` because `NEXTAUTH_SECRET` was not configured. Server log: `NEXTAUTH_SECRET is not configured; refusing to issue a session`. |
| Native iOS screenshot/click walk | GitHub Actions broker run `31175380971` | Verified for staged rendering and tapped navigation only: Xcode 26.2/macOS 26.2 on Kevin's Mac mini, 9 UI tests passed, 75 screenshots exported. This does not verify real photo/video picker media, real camera frames, live pose detection, upload, or backend persistence. |
| Native iOS XCTest lane | GitHub Actions broker run `31176068459` | Blocked/pending: still running in `Run guarded Xcode job` as of this audit update. |
| Local native Xcode execution | `xcodebuild -version`, `xcrun simctl list devices available` | Blocked: this Mac has Command Line Tools only, not full Xcode/simulator tooling. |

## Screenshots

Bridge run `31175380971` exported 75 running-app simulator screenshots. I copied
the audit-relevant screenshots into
`basketball-analysis/docs/shotiq/audit-evidence/2026-08-07-ios-functionality/`.

Important evidence boundary: these screenshots prove the app can render staged
or click-walk screens on Kevin's Mac mini. They do not prove real media selection,
real crop mutation, real video trim, live camera pose tracking, upload, analysis,
or web/iOS backend sync.

| Screenshot | Evidence Type | What It Proves | What It Does Not Prove |
| --- | --- | --- | --- |
| [071-photo-review-crop-staged.png](audit-evidence/2026-08-07-ios-functionality/071-photo-review-crop-staged.png) | Staged screen | The crop review UI renders in a production simulator build. | That `CROP` mutates a user's selected photo. |
| [072-upload-quality-check-staged.png](audit-evidence/2026-08-07-ios-functionality/072-upload-quality-check-staged.png) | Staged screen | The quality-check UI renders with skeleton/check rows. | That Vision detected a real player or that upload/analysis persisted. |
| [073-video-review-staged.png](audit-evidence/2026-08-07-ios-functionality/073-video-review-staged.png) | Staged screen | The video review/trim UI renders. | That a selected video is retained, trimmed, uploaded, or analyzed. |
| [034-live-recording-click-walk.png](audit-evidence/2026-08-07-ios-functionality/034-live-recording-click-walk.png) | Click-walk screen | Navigation reaches live recording and the screen renders a recording HUD. | That the HUD values come from live camera/pose/ball data. |
| [035-live-form-feedback-click-walk.png](audit-evidence/2026-08-07-ios-functionality/035-live-form-feedback-click-walk.png) | Click-walk screen | Navigation reaches live feedback. The screen visibly labels the state `Demo`. | That feedback follows a real player or changes from live measurements. |
| [036-shot-detected-click-walk.png](audit-evidence/2026-08-07-ios-functionality/036-shot-detected-click-walk.png) | Click-walk screen | Navigation reaches shot detected and confirm controls render. | That a real shot was detected from recorded footage. |

Remaining screenshot slots for real-media/functionality proof:

| Screen | Needed Screenshot | Why |
| --- | --- | --- |
| 023 Photo Review Crop | Before/after tapping `CROP` on a real selected image | Still needed. Proves whether the crop button changes the actual image, not just the staged placeholder. |
| 024 Upload Quality Check | Real selected photo with/without detected skeleton | Still needed. Proves whether Vision detects the player's body and whether quality rows change from measured pose. |
| 026 Video Upload | After selecting a real video | Still needed. Proves whether the picked video is retained or only used as a navigation trigger. |
| 027 Video Review | Review screen after real video selection and after trim | Still needed. Proves whether the user's actual clip appears and whether trim affects analysis input. |
| 032 Live Recording | Camera recording with live overlay | Still needed on physical iPhone. Proves whether live camera is real and whether overlay values are measured or static. |
| 033 Live Form Feedback | Feedback while recording | Still needed on physical iPhone. Proves whether feedback follows the player or displays demo/static numbers. |
| 034 Shot Detected | After recording/ending a live session | Still needed on physical iPhone. Proves whether the recorded clip is replayed and whether skeleton/release arc are generated for it. |

## Findings So Far

### F001 - iOS Video Upload Does Not Prove It Analyzes The Selected Video

Status: Code-only suspicion, reinforced by staged simulator screenshot; needs
real video selection proof.

What the screen promises: screen 026 says "Upload a clear video of your shot for
AI analysis." Screen 027 says "Review your clip and adjust the range before we
analyze."

What the staged simulator screenshot shows: `073-video-review-staged.png`
renders the video-review screen with canned player stats and a canonical media
surface. It does not show any user-selected clip.

What the code currently shows: `VideoUploadView` stores only a `PhotosPickerItem`
and sets `go = true` when any video is selected. It does not load a video URL or
data and it opens `VideoReviewView()` with no media argument. `VideoReviewView`
renders `CanonicalMediaSurface(key: "027-visual-001")`, which is a bundled demo
surface, then `Analyze video` opens `AnalysisProcessingView()` without uploading,
extracting frames, running pose, or saving a video analysis.

Evidence references:

- `basketball-analysis/ios-native/ShotIQ/Screens/Capture/CaptureFlow.swift:1309`
- `basketball-analysis/ios-native/ShotIQ/Screens/Capture/CaptureFlow.swift:1457`
- `basketball-analysis/ios-native/ShotIQ/Screens/Capture/CaptureFlow.swift:1484`
- `basketball-analysis/ios-native/ShotIQ/Screens/Capture/CaptureFlow.swift:1547`
- `basketball-analysis/ios-native/ShotIQ/Screens/Capture/CaptureFlow.swift:1615`

Fix direction after approval: carry the selected video into review, display the
actual clip, apply trim to the selected time range, run the same phase/frame pose
analysis contract the web uses, then persist with the shared backend so web and
iOS stay in sync.

### F002 - iOS Video Trim Appears UI-only

Status: Code-only suspicion, reinforced by staged simulator screenshot; needs
real video drag/tap proof.

What the screen promises: "Drag the handles to trim your clip" and a `Trim`
button.

What the staged simulator screenshot shows: `073-video-review-staged.png`
renders trim handles on a canned clip. It does not prove that trimming changes
the analysis input.

What the code currently shows: the drag gestures mutate `trimStart` and
`trimEnd`; the `Trim` button resets those two local values to `0.1` and `0.8`.
No selected video, trim window, or frame range is passed into analysis.

Evidence references:

- `basketball-analysis/ios-native/ShotIQ/Screens/Capture/CaptureFlow.swift:1554`
- `basketball-analysis/ios-native/ShotIQ/Screens/Capture/CaptureFlow.swift:1568`
- `basketball-analysis/ios-native/ShotIQ/Screens/Capture/CaptureFlow.swift:1576`
- `basketball-analysis/ios-native/ShotIQ/Screens/Capture/CaptureFlow.swift:1620`

Fix direction after approval: bind trim controls to the actual clip range and
ensure `Analyze video` uses only the trimmed segment.

### F003 - Live Recording Records Video, But Live Feedback Values Look Static

Status: Mixed. Camera recording plumbing exists in code; simulator click-walk
shows demo/static feedback, not measured live feedback.

What is actually implemented: `CameraService` configures an `AVCaptureSession`,
adds photo/movie outputs, starts recording to a temporary `.mov`, and stores
`lastVideoURL` when recording finishes.

What the simulator click-walk shows: `034-live-recording-click-walk.png` and
`035-live-form-feedback-click-walk.png` render recording/feedback states, but
the feedback screen visibly says `Demo`. The HUD values are fixed-looking shots,
makes, make percentage, `00:42` timers, `Quality touches 50`, `Current streak 7`,
confidence, detected phase `Release`, form score `82`, and "Keep elbow stacked."
No running pose/ball detector has been proven to feed these values in the native
SwiftUI live recording and feedback screens.

Evidence references:

- `basketball-analysis/ios-native/ShotIQ/Core/CameraService.swift:20`
- `basketball-analysis/ios-native/ShotIQ/Core/CameraService.swift:71`
- `basketball-analysis/ios-native/ShotIQ/Core/CameraService.swift:100`
- `basketball-analysis/ios-native/ShotIQ/Screens/Capture/CaptureFlow.swift:2263`
- `basketball-analysis/ios-native/ShotIQ/Screens/Capture/CaptureFlow.swift:2305`
- `basketball-analysis/ios-native/ShotIQ/Screens/Capture/CaptureFlow.swift:2388`
- `basketball-analysis/ios-native/ShotIQ/Screens/Capture/CaptureFlow.swift:2457`
- `basketball-analysis/ios-native/ShotIQ/Screens/Capture/CaptureFlow.swift:2478`

Fix direction after approval: keep the real camera/recording path, but replace
static live feedback with measured pose/phase/shot state. If the native app
cannot run per-frame Vision fast enough, it should share the web live-analysis
contract or clearly label the feature as a recording-only beta.

### F004 - Shot Detected Can Replay A Recorded Clip, But The Analysis Is Static

Status: Code-only suspicion, reinforced by simulator click-walk screenshot; needs
physical-device proof with a real recorded shot.

What the screen promises: it detects a shot, shows confidence, score, context,
and coaching target.

What the simulator click-walk shows: `036-shot-detected-click-walk.png` renders
a shot-detected card with `Shot 12`, `97%` confidence, a skeleton/arc visual, and
confirm controls. This proves the screen exists, not that a real shot triggered
the analysis.

What the code currently shows: if `camera.lastVideoURL` exists, screen 034 uses
`VideoPlayer` to show the recorded clip. That is good. But score `82`,
confidence `97%`, context, phase strip, and coaching target are static, and the
comment says the app does not draw pose skeleton or release arc over this slot.

Evidence references:

- `basketball-analysis/ios-native/ShotIQ/Screens/Capture/CaptureFlow.swift:2557`
- `basketball-analysis/ios-native/ShotIQ/Screens/Capture/CaptureFlow.swift:2608`
- `basketball-analysis/ios-native/ShotIQ/Screens/Capture/CaptureFlow.swift:2616`
- `basketball-analysis/ios-native/ShotIQ/Screens/Capture/CaptureFlow.swift:2626`

Fix direction after approval: use the recorded clip to extract shot frames,
pose/ball evidence, confidence, make/miss candidate, score, and coaching target.

### F005 - Photo Crop Has Code, But Needs Real Input Proof

Status: Blocked until a real picked/captured image is tested on simulator/device;
staged simulator screenshot is not enough.

What the screen promises: "Adjust crop" and a `CROP` button.

What the staged simulator screenshot shows: `071-photo-review-crop-staged.png`
renders the crop UI over the canonical frame. It is not a before/after crop test.

What the code currently shows: when `image != nil`, the crop button replaces the
image with `shotiqCropped34(img)`. When the staged/canonical screen has
`image == nil`, the crop/rotate buttons are effectively no-ops because there is
no selected image to mutate.

Evidence references:

- `basketball-analysis/ios-native/ShotIQ/Screens/Capture/CaptureFlow.swift:646`
- `basketball-analysis/ios-native/ShotIQ/Screens/Capture/CaptureFlow.swift:688`
- `basketball-analysis/ios-native/ShotIQ/Screens/Capture/CaptureFlow.swift:741`
- `basketball-analysis/ios-native/ShotIQ/Screens/Capture/CaptureFlow.swift:784`

Fix direction after approval: first test with an obvious wide/tall image so the
crop result visibly changes; if it fails or looks unchanged, make crop
interactive/visible and add a regression test.

### F006 - Photo Quality Check And Still Analysis Are Partly Real, But Not Fully Proved On Device

Status: Web/shared tests verified adjacent logic; staged simulator screenshot
renders the quality-check UI; native real-photo/device proof pending.

What the staged simulator screenshot shows: `072-upload-quality-check-staged.png`
renders a skeleton/checklist over canonical media. It does not prove a real
photo was checked by Vision.

What the code currently shows: for a real still image, `UploadQualityCheckView`
uses `CapturedPoseImage`, records a detected pose, changes body/hand checks from
that pose, uploads the JPEG to `/api/upload`, calls `/api/vision-analyze`, and
persists through `/api/save-analysis`.

What is proven in this session: web/shared crop/video/live-overlay tests passed.
The local iOS-to-web Playwright proof could not verify because local auth/DB
environment is missing.

Evidence references:

- `basketball-analysis/ios-native/ShotIQ/Screens/Capture/CaptureFlow.swift:819`
- `basketball-analysis/ios-native/ShotIQ/Screens/Capture/CaptureFlow.swift:846`
- `basketball-analysis/ios-native/ShotIQ/Screens/Capture/CaptureFlow.swift:919`
- `basketball-analysis/ios-native/ShotIQ/Screens/Capture/CaptureFlow.swift:1019`
- `basketball-analysis/ios-native/ShotIQ/Screens/Capture/CaptureFlow.swift:1030`
- `basketball-analysis/ios-native/ShotIQ/Screens/Capture/CaptureFlow.swift:1052`
- `basketball-analysis/ios-native/ShotIQ/Screens/Capture/CaptureFlow.swift:1076`

Fix direction after approval: run the actual iPhone/simulator proof with a real
photo and verified backend, then fix any failure in crop, pose detection,
upload, vision analysis, or persistence.

## Immediate Next Tests

1. Wait for bridge run `31176068459`, download native XCTest logs, and record
   exactly which native tests passed/failed.
2. Add or use a real media test path for PhotosPicker/photo/video selection, so
   crop, trim, quality check, upload, analyze, and persistence can be proved
   with actual selected media rather than staged screens.
3. Run a real iPhone test for camera-only features that simulator cannot prove:
   live camera preview, recording, stop/end-round, replay, and pose/feedback.
4. Re-run `tests/e2e/ios-auth-chain.spec.ts` in an environment with
   `NEXTAUTH_SECRET` and Postgres configured, or point it at an approved
   configured staging server.
