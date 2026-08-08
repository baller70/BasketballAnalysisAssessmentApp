# ShotIQ iOS 72-Page Coverage Matrix - 2026-08-08

This matrix ties the canonical 72 iOS pages in
`basketball-analysis/docs/shotiq/screen-implementation-map.json` to the current
simulator proof artifacts. It is intentionally strict: screenshot proof means
the page rendered in the 2026-08-08 full UI regression; interaction proof means
the app-owned route/control was tapped and asserted by XCUITest or its key
content/actions were asserted by a focused feature test.

## Evidence Set

- Full UI result bundle:
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-UITests-2026-08-08-post-image-surfaces-v2.xcresult`
- Capture screenshot result bundle:
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-Capture-Harness-2026-08-08-v2.xcresult`
- Screenshot export:
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-UITests-2026-08-08-post-image-surfaces-v2-attachments-named-export2`
- Contact sheets:
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-UITests-2026-08-08-post-image-surfaces-v2-contact-sheets`
- Unit result bundle:
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-UnitTests-2026-08-08-post-image-surfaces.xcresult`
- Focused secondary-control result bundle:
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-SecondaryControls-2026-08-08-v20.xcresult`
- Focused onboarding-controls result bundle:
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-OnboardingControls-2026-08-08-v6.xcresult`
- Focused upload-quality pre-analysis result bundle:
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-UploadQualityPreAnalysis-2026-08-08-v1.xcresult`
- Focused photo-quality unit result bundle:
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-PhotoQuality-Unit-2026-08-08-v1.xcresult`
- Focused upload-quality measured-rows result bundle:
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-UploadQualityMeasuredRows-2026-08-08-v2.xcresult`

Current proof totals:

- Canonical iOS map entries: 72
- Canonical iOS pages with screenshot proof by slug: 72 / 72
- Full UI target: 23 tests passed, 0 failed, 0 skipped
- Capture screenshot target: 1 passed, 0 failed, 0 skipped
- Unit target: 39 passed, 0 failed, 1 skipped
- Focused secondary-control target: 1 passed, 0 failed, 0 skipped
- Focused onboarding-controls target: 1 passed, 0 failed, 0 skipped
- Focused upload-quality pre-analysis target: 1 passed, 0 failed, 0 skipped
- Focused photo-quality unit target: 2 passed, 0 failed, 0 skipped
- Focused upload-quality measured-rows target: 1 passed, 0 failed, 0 skipped
- Extra non-map iOS states captured: `capture-guide`, `points-system`
- No-image Swift screen-body audit: `NO_VISUAL_COUNT=0` after adding a
  capture-example photo to the extra `capture-guide` helper screen

## Matrix

| # | Canonical page | Screenshot | Interaction / feature proof | Remaining proof |
|---:|---|---|---|---|
| 1 | Splash | Yes | Held splash launches, tap advances to Welcome | None |
| 2 | Welcome | Yes | Sign in and Create account routes asserted | None |
| 3 | Sign In | Yes | Empty submit validation asserts `signin-error`; Forgot password route asserted | Backend credential sign-in |
| 4 | Create Account | Yes | Welcome to Create account route asserted | Backend signup success |
| 5 | Verify Email | Yes | Token/code state staged and rendered | Real email delivery/code flow |
| 6 | Forgot Password | Yes | Sign In to Forgot Password route asserted; reset-link route click-tested | Backend reset email delivery |
| 7 | Reset Password | Yes | Reset-token state staged and rendered | Real emailed token flow |
| 8 | Onboarding Intro | Yes | Build profile CTA route asserted | None |
| 9 | Physical Profile | Yes | Age/height/weight/wingspan steppers and unit toggles mutate values; Continue route asserted; inputs render with filled image surface | Native keyboard edge cases |
| 10 | Experience Body Type | Yes | Beginner and Slim / Lean selections mutate state; Continue route asserted | None |
| 11 | Shooting Profile | Yes | Left-handed, Developing, and Compact selections mutate state; Continue route asserted | None |
| 12 | Player Bio | Yes | Enhance-bio short-input validation toast/copy asserted; Review profile route asserted; profile image surface filled | Backend AI enhancement success |
| 13 | Onboarding Review | Yes | Left-handed/Beginner carry-forward asserted; Coaching Focus expander asserted; Complete profile fallback reaches camera primer | Backend profile save |
| 14 | Camera Permission Primer | Yes | Not now route to photo-library primer asserted | iOS camera permission alert |
| 15 | Photo Library Permission | Yes | Not now route to notification primer asserted | iOS photo permission alert |
| 16 | Notification Permission Primer | Yes | Not now completes onboarding and returns to a real home root | iOS notification permission alert |
| 17 | Home New Player | Yes | Analyze first shot, GET AI ANALYSIS, capture guide routes asserted | Backend first-user state |
| 18 | Home Standard | Yes | View latest analysis and drill card routes asserted | Live backend data parity |
| 19 | Home Professional | Yes | View all analytics and menu routes asserted | Live backend data parity |
| 20 | Profile Menu | Yes | Points, elite shooters routes asserted | None |
| 21 | Analyze Hub | Yes | Upload image, upload video, live camera, media, queue routes asserted | Real device source pickers |
| 22 | Photo Upload Source | Yes | Front/side/rear required; no-input toast; sample replaces guides | Real Photos picker images |
| 23 | Photo Review Crop | Yes | No-photo toast; sample photo advances to quality check | Real image crop gestures |
| 24 | Upload Quality Check | Yes | No-photo toast; sample photo quality/progress path asserted; pre-analysis header now proves source-safe READY/SIDE/AFTER copy and absence of old 82/24/15/62.5% measured-looking values; selected still images now measure brightness and actual pixel dimensions, and UI proof confirms `Image resolution`/pixel detail appears while `Video resolution`/`1080p` is absent | Real Vision pose on iPhone; real low-light/low-resolution selected media proof |
| 25 | Upload Queue | Yes | Analyze now advances through processing to result | Backend upload queue |
| 26 | Video Upload | Yes | Full-screen source options asserted | Real video library/files/camera pickers |
| 27 | Video Review | Yes | No-video toast asserted | Real selected video trimming |
| 28 | Live Camera Setup | Yes | Setup items asserted; setup-camera route asserted | Real camera pixels |
| 29 | Hoop Calibration | Yes | Confirm hoop route asserted | Real hoop detection/calibration |
| 30 | Readiness Check | Yes | Readiness items asserted; keep-position route asserted | Real camera readiness |
| 31 | Capture Ready | Yes | Countdown/start path reaches live recording | Real camera capture |
| 32 | Live Recording | Yes | Live shot/make/make-percent rails asserted; END ROUND route asserted | Real shot detection from camera |
| 33 | Live Form Feedback | Yes | Stop recording route asserted | Real live form model output |
| 34 | Shot Detected | Yes | Confirm make and mark miss actions asserted with toast | Real make/miss computer vision |
| 35 | Capture Review | Yes | Review counters/queues asserted after make/miss | Backend session persistence |
| 36 | Analysis Processing | Yes | Upload complete, pose, scoring, baseline, coaching steps asserted | Backend processing |
| 37 | Analysis Taking Longer | Yes | Long-running state staged and rendered | Real slow backend job |
| 38 | Analysis Result Overview | Yes | Result opened from home, queue, media; metrics/coaching asserted | Live backend result parity |
| 39 | No Analysis Yet | Yes | Home empty-state CTA route asserted | Backend empty account state |
| 40 | Analysis Error | Yes | Error state staged and rendered | Real failed backend job/retry |
| 41 | Shot Breakdown | Yes | Phase sequence, metrics, coaching asserted | Real generated phase frames |
| 42 | Frame Detail Skeleton | Yes | Skeleton/joint/annotation/basketball controls asserted | Real Vision drawable pose on iPhone |
| 43 | Annotation Toolbar | Yes | Annotation toolbar route asserted from frame detail | Save/share annotated output |
| 44 | Form Score | Yes | Score, breakdown, source coverage, insight, weakest metric route asserted | Live backend score history |
| 45 | Metric Detail | Yes | Measurements, ranges, confidence, correction cue, frame link asserted | Live metric derivation |
| 46 | Flaws Overview | Yes | Flaw tags, impact levels, confidence, affected phases asserted | Live flaw derivation |
| 47 | Flaw Detail | Yes | Evidence, impact, angles, fix cues, drill recommendation asserted | Live flaw evidence frames |
| 48 | Player Card | Yes | Stats, measurements, mechanics, customize/share/download labels asserted | System share/download sheet |
| 49 | Customize Player Card | Yes | Details, banner color, save card, saved sheet asserted | Real photo/export/share |
| 50 | Elite Match | Yes | Analysis route to elite match and choose shooter route asserted | Backend elite comparison |
| 51 | Photo Comparison | Yes | Elite shooter detail to comparison route asserted | Real uploaded user photo comparison |
| 52 | Elite Shooters | Yes | Profile menu and elite-match chooser routes asserted | Live catalog updates |
| 53 | Elite Shooter Detail | Yes | Klay detail and compare route asserted | Live catalog/video assets |
| 54 | Training Home | Yes | Quick start, my drills, calendar, drill detail, tracker routes asserted | Backend training plan sync |
| 55 | Quick Start | Yes | Start shot tracking route asserted | None |
| 56 | Discover Drills | Yes | Drill list route and drill selection asserted | Live drill catalog |
| 57 | Drill Detail | Yes | Start drill route asserted | None |
| 58 | My Drills | Yes | Discover route asserted | Saved-drill backend sync |
| 59 | Workout Calendar | Yes | Calendar route asserted | Calendar persistence |
| 60 | Drill Execution | Yes | Make/miss counters, toast feedback, end workout asserted | Real workout persistence |
| 61 | Shot Tracker | Yes | Recent workout card opens tracker | Real shot-session persistence |
| 62 | Workout Completion | Yes | End workout reaches completion | Backend completion save |
| 63 | Goals | Yes | Active goals, progress, create goal, goal-detail route asserted | Backend goal CRUD |
| 64 | Create Goal | Yes | Create-goal page rendered from Goals; metric tabs/target image asserted; category/type/unit controls, target dialog, target-linked toast, and Learn how route tested | Backend create goal |
| 65 | Goal Detail | Yes | Progress, technique snapshot, linked sessions, drills asserted; log-progress sheet, edit-goal sheet, and recommended-drill route tested | Backend goal updates |
| 66 | Analytics Cards | Yes | Filters, trends, session cards, shot type stats asserted | Backend aggregation parity |
| 67 | Analytics Detailed | Yes | Mechanics scorecard, comparison, arc range, shot rail asserted | Backend aggregation parity |
| 68 | My Media | Yes | Tabs, filtering, select/done workflow asserted | Real media library backend |
| 69 | Media Detail | Yes | Play toast, frame select toast, actions, linked analysis route asserted; download toast/alert, delete-confirmation toast, and sample-delete toast tested | Real playback/share/delete |
| 70 | Profile | Yes | Profile stats, physical/shooting/card/completion surfaces asserted | Backend profile edit/save |
| 71 | Settings Hub | Yes | Settings route asserted; edit-profile route, Automation/Data privacy expanders, toggles, and About alert tested | Backend settings persistence |
| 72 | Share Results | Yes | Share-results page route asserted from analysis/profile; Copy feedback plus share/save controls tested | iOS system share sheet |

## Current Physical-Device Blocker

The physical iPhone is not currently visible to this laptop/Xcode stack:

- `xcrun devicectl list devices`: `No devices found.`
- `xcrun xctrace list devices`: lists only `Kevin's MacBook Air` and simulators.
- `system_profiler SPUSBDataType`: shows the SanDisk external drive only.
- `system_profiler SPThunderboltDataType`: both Thunderbolt/USB4 receptacles
  report `No device connected`.

Because macOS itself does not see an iPhone, the remaining hardware-only proof
cannot be completed from this machine at this moment.

## Not Yet Proven By Simulator

These items remain outside simulator proof and must be validated on Kevin's
physical iPhone and/or the live backend before App Store submission:

- Native Vision pose detector draws full body wireframe/nodes on a real shooting
  image or video. Simulator proof reaches the pose path but reports
  `Pose detector unavailable on this simulator/device.` because Apple's
  `cnn_human_pose.espresso.weights` are unavailable there.
- Real live camera pixels replace live-camera placeholders through setup,
  calibration, readiness, recording, shot detection, make/miss, and review.
- Apple Photos picker, video picker, Files picker, camera permission, photo
  permission, notification permission, and iOS share sheets.
- Backend auth, signup, email verification, reset password token delivery,
  upload processing, media persistence, analytics aggregation, goals/settings
  persistence, and web/iOS database parity.
