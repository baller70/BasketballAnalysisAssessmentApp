# ShotIQ iOS Functionality And Analytics Gap Audit

Date: 2026-08-07
Branch: `claude/shotiq-production-build-txi5pl`
Repo: `BasketballAnalysisAssessmentApp`

This is the corrected audit standard. A ShotIQ screen is not working just because
it renders the canonical design or shows the same placeholder answer. The app
must prove the path that creates that answer.

## Audit Rule

A screen cannot be cleared unless all of these are true:

1. The real production user path can reach it without `-uiTestStage` or another
   test-only hook.
2. Buttons and controls perform the action their label implies.
3. User media is carried forward when the screen says it is reviewing,
   cropping, trimming, recording, or analyzing user media.
4. Skeletons, pose joints, phase labels, shot detection, and shot overlays are
   generated from real camera/photo/video input, not just canonical artwork.
5. Every analytic value has provenance: source, calculation, backend contract,
   and proof that it changes when the input changes.
6. iOS and web use the same backend meaning for the same analytic concept.
7. Demo/sample values are either clearly labeled as demo or removed from player
   analytics surfaces.

Under this standard, no iOS analytics screen is cleared yet.

## Evidence Used

- Source audit of SwiftUI screens under
  `basketball-analysis/ios-native/ShotIQ/Screens`.
- Source audit of native support code under
  `basketball-analysis/ios-native/ShotIQ/Core` and `Components`.
- Existing simulator screenshot run `31175380971`, which exported 75 screenshots.
- Existing evidence PNGs under
  `basketball-analysis/docs/shotiq/audit-evidence/2026-08-07-ios-functionality`.
- Existing web/shared tests: 35 tests passed for video analysis, crop image,
  resumable uploads, upload queue, and live overlay sizing.
- Existing local auth-chain attempt failed because `NEXTAUTH_SECRET` was not set,
  so backend sync was not proved locally.

Important boundary: the simulator screenshots prove rendering. They do not prove
real media selection, crop mutation, video trim, live pose tracking, shot
detection, analysis persistence, or web/iOS sync.

## Known Partial Real Functionality

These areas have some real code and should be preserved while being completed:

| Area | What is real | What is still not proved or not complete |
| --- | --- | --- |
| Native still pose check | `CapturedPoseImage` can run pose detection over a selected `UIImage`. | Most header analytics on the same screens are still fixed. End-to-end save-to-results is not proved. |
| Photo crop helper | `CROP` calls `shotiqCropped34(img)` when `image` is non-nil. | Staged crop screen uses `image: nil`, so existing screenshots do not prove before/after crop behavior on a real selected photo. |
| Native camera recording | `CameraService` can start an `AVCaptureSession`, record a `.mov`, and store `lastVideoURL`. | Live form feedback, shot detection confidence, form score, context, and coaching target are still fixed/static. |
| Manual drill execution | Make/miss buttons update local counts and `finish()` posts shot events/workout totals. | The drill media surface, coaching cue, form feedback, phase scores, and completion form score are not measured from the workout. |
| Goals create/update | Goals can be fetched/posted/patched through `/api/goals`. | Goal cards/detail screens mix real goal progress with fixed sessions, form score, make percentage, trends, and insights. |

## Screenshots Already Saved

| Evidence | Meaning |
| --- | --- |
| `071-photo-review-crop-staged.png` | Renders crop review UI only. Does not prove crop changes a selected image. |
| `072-upload-quality-check-staged.png` | Renders quality check UI only. Does not prove a real player was detected or analyzed. |
| `073-video-review-staged.png` | Renders video trim/review UI only. Does not prove a selected video is retained, trimmed, or analyzed. |
| `034-live-recording-click-walk.png` | Renders live recording screen only. Does not prove HUD values are live. |
| `035-live-form-feedback-click-walk.png` | Renders live feedback screen and visibly says `Demo`. Does not prove measured live feedback. |
| `036-shot-detected-click-walk.png` | Renders shot detected UI only. Does not prove a shot was detected from video. |

## Cross-Cutting Failures

| ID | Status | Gap |
| --- | --- | --- |
| G001 | Broken audit proof | Staged canonical screens are answer-key renders, not production-flow proof. `MainShellView.stagedRoot` directly opens `PhotoReviewCropView(image: nil)`, `UploadQualityCheckView()`, `VideoReviewView()`, `AnalysisTakingLongerView()`, and `AnalysisErrorView()` from `-uiTestStage`; see `basketball-analysis/ios-native/ShotIQ/App/ShotIQApp.swift:240`. |
| G002 | Analytics-unproven | Native screens repeatedly print player analytics directly in SwiftUI: `82`, `24`, `15`, `62.5%`, confidence values, phase scores, release/elbow/wrist/arc values, trend arrays, and flaw labels. A screenshot cannot distinguish those constants from real measured results. |
| G003 | Backend contract mismatch | Web has real-ish services and API-backed result pages in places, while many native result screens are constants. Updating iOS does not automatically update web unless both use the same saved analysis contract. |
| G004 | Backend sync not proved | The local iOS-to-web auth/write/read proof failed before app behavior due missing `NEXTAUTH_SECRET`. We still need a staging/prod proof that a native analysis appears correctly in the web app and vice versa. |
| G005 | Demo data not labeled consistently | Some screens say `Demo`; many other screens present sample numbers as if they were player analytics. Placeholder analytics must be visibly demo or backed by user data. |
| G006 | No analytics provenance matrix | There is no screen-by-screen matrix proving source and formula for form score, confidence, release angle, elbow alignment, wrist position, shot arc, make percentage, streaks, points, phase scores, or trend lines. |

## Capture And Upload Gaps

| ID | Screen(s) | Status | Gap |
| --- | --- | --- | --- |
| G007 | 022 photo-upload-source | Unproven/incorrect copy | The upload-source path talks about media but the photo picker path is image-only. Video is a separate screen. Need proof that the user understands and reaches the right path for photo versus video. |
| G008 | 023 photo-review-crop | Needs real proof | `CROP` only mutates `image` when a real `UIImage` exists. The staged proof opens `PhotoReviewCropView(image: nil)`, so existing evidence does not prove crop works on user media. See `CaptureFlow.swift:784`. |
| G009 | 023 photo-review-crop | Analytics-unproven | The crop/review screen still shows shot-form context and phase UI while no measured photo analysis has happened. Those values must be hidden, demo-labeled, or sourced from previous real history. |
| G010 | 024 upload-quality-check | Partial | The body/hand checks can use native pose detection for a selected photo, but header values `82`, `24`, `15`, `62.5%`, and primary target are fixed. See `CaptureFlow.swift:879`. |
| G011 | 024 upload-quality-check | Partial | Lighting and resolution remain canonical assertions. The code comment admits this pass measures pose only, so those quality rows are not actually measured. See `CaptureFlow.swift:846`. |
| G012 | 024 upload-quality-check | Broken path | If no selected image exists, `analyze()` routes straight to `AnalysisProcessingView()` with no upload or analysis. That lets placeholder state proceed as if analysis happened. See `CaptureFlow.swift:1020`. |
| G013 | 024 upload-quality-check | Weak analytics | The native still-image save maps grade letters to broad fixed scores `A=95`, `B=85`, `C=75`, `D=65`, `F=50`, instead of deriving the shown analytics from measured angle/pose values. See `CaptureFlow.swift:1064`. |
| G014 | 024 to 038 | Broken continuity | After save, the app routes to processing/result screens that still render hard-coded overview metrics. There is no proved handoff from saved `/api/save-analysis` data to the native result UI. |
| G015 | 025 upload-queue | Static fixture | Queue starts with fake items like `pullup-jumper.mov`, `spotup-three.mov`, fixed progress values, and hard-coded states. Real added media needs device proof and persistence proof. |
| G016 | 026 video-upload | Broken | A selected video only sets `go = true`. The video is not loaded, stored, uploaded, or passed forward. See `CaptureFlow.swift:1457`. |
| G017 | 027 video-review | Broken | `VideoReviewView` accepts no media argument and displays `CanonicalMediaSurface(key: "027-visual-001")`, so the review screen is reviewing a bundled canonical clip, not the user's selected video. See `CaptureFlow.swift:1484` and `CaptureFlow.swift:1547`. |
| G018 | 027 video-review | Broken | Video details are fixed: duration, orientation, file size, and frame rate are not read from the selected file. See `CaptureFlow.swift:1594`. |
| G019 | 027 video-review | Broken | Trim handles only update `trimStart`/`trimEnd`; `Analyze video` ignores the trim range and just opens `AnalysisProcessingView()`. See `CaptureFlow.swift:1554` and `CaptureFlow.swift:1615`. |
| G020 | 027 to 038 | Broken | There is no native video upload, frame extraction, phase segmentation, pose analysis, ball tracking, score calculation, or saved result before reaching the analysis screens. |

## Live Camera And Shot Detection Gaps

| ID | Screen(s) | Status | Gap |
| --- | --- | --- | --- |
| G021 | 028 live-camera-setup | Partial/unproven | Real camera viewfinder can exist, but setup checks are static green checks unless device proof shows body, hoop, lighting, stability, and framing are measured. |
| G022 | 029 hoop-calibration | Unproven | Hoop calibration UI needs proof that selected hoop position is persisted and used by shot detection/arc calculations. No current evidence shows that. |
| G023 | 030 readiness-check | Analytics-unproven | Readiness percentage and checklist must be measured from live camera state. Existing evidence only proves the screen can render. |
| G024 | 032 live-recording | Analytics-unproven | Recording HUD values such as shot count, make percentage, timer, quality touches, streak, and readiness are fixed-looking and not proved to come from live camera analysis. |
| G025 | 033 live-form-feedback | Broken | The screen visibly labels itself `Demo`; form score `82`, confidence `87%`, detected phase `Release`, and coaching text are constants layered over the live viewfinder. See `CaptureFlow.swift:2415` and `CaptureFlow.swift:2457`. |
| G026 | 033 live-form-feedback | Broken | The app does not prove that skeleton nodes follow the player while shooting. Existing live-feedback proof is a rendered demo screen, not a measured pose stream. |
| G027 | 034 shot-detected | Broken | The user reaches shot detected from a navigation button, not from a proved shot detector. `SHOT 12`, timestamp, `97%` confidence, context, form score `82`, and coaching target are fixed. See `CaptureFlow.swift:2552` and `CaptureFlow.swift:2580`. |
| G028 | 034 shot-detected | Partial | If `camera.lastVideoURL` exists, the screen can replay the recorded clip. But the code comment says the app draws neither pose skeleton nor release arc over that slot, so the canonical skeleton/arc result is not generated for the real clip. See `CaptureFlow.swift:2614`. |
| G029 | 034 shot-detected | Partial | Confirm Make/Mark Miss does post `/api/shot-events`, but this is manual confirmation after a static detected-shot card. It does not prove automatic detection or measured analytics. |
| G030 | 035 capture-review | Analytics-unproven | Capture review shows session-style analytics, but there is no proved link from recorded shots, selected clips, or measured form analysis into that summary. |

## Analysis Result Gaps

| ID | Screen(s) | Status | Gap |
| --- | --- | --- | --- |
| G031 | 036 analysis-processing | Broken continuity | Processing can be reached from no-image and video placeholder paths where no actual analysis was started. |
| G032 | 037 analysis-taking-longer | Unproven | This can be staged directly; no long-running analysis timeout path has been proved from real upload/video analysis. |
| G033 | 038 analysis-result-overview | Broken | Six key metrics are hard-coded: release height, release angle `52°`, elbow alignment `93%`, shot arc `46°`, spin `8.6`, centeredness `92%`. See `AnalysisFlow.swift:360`. |
| G034 | 038 analysis-result-overview | Broken | The main media surface is canonical and the skeleton overlay defaults to six demo keypoints unless a `DetectedPose` is passed. This screen passes none. See `AnalysisFlow.swift:398` and `AnalysisFlow.swift:580`. |
| G035 | 038 analysis-result-overview | Broken | Player name, session stats `24/15/62.5%`, form score `82`, Klay match `88%`, and elite comparison metrics are fixed or demo-sourced, not loaded from the just-analyzed shot. |
| G036 | 039 no-analysis-yet | Needs path proof | The empty state can render, but it needs proof that it appears only when the user truly has no saved analysis and not because backend fetch failed. |
| G037 | 040 analysis-error | Needs path proof | The error screen can be staged. It needs proof that failed upload/analyze/save routes here with the right retry path and without discarding user media. |
| G038 | 041 shot-breakdown | Broken | Shot breakdown uses canonical frames, fixed score `82`, points `2,840`, release/elbow/arc values, and phase breakdowns. No frame-by-frame measured result is passed in. |
| G039 | 042 frame-detail-skeleton | Broken | Toggleable skeleton/joints/ball UI is visual only unless a real pose is supplied. Current page uses canonical imagery and constants such as `82`, `24`, `15`, `62.5%`. |
| G040 | 043 annotation-toolbar | Unproven | Annotation tools render over canonical media. Need proof that annotations are drawn on the user's media, persisted, shared/exported, and restored. |
| G041 | 044 form-score | Broken | Form score `82`, confidence `76%`, trend arrays, score breakdown, insight text, impact `+11%`, and metric rows are fixed/demo values. See `AnalysisFlow.swift:1620`. |
| G042 | 045 metric-detail | Broken | Metric detail uses fixed ranges, confidence values, stat strip, canonical photo, and score bar. It does not receive a measured metric object from the latest analysis. |
| G043 | 046 flaws-overview | Broken | Flaw list, confidence values, impact labels, and supporting imagery are fixed; there is no proved flaw extraction from pose/video analysis. |
| G044 | 047 flaw-detail | Broken | Flaw detail uses fixed evidence frames, skeleton overlay, form score `82`, confidence, angle values, ideal range, and trend. It is not tied to a measured flaw. |

## Training Gaps

| ID | Screen(s) | Status | Gap |
| --- | --- | --- | --- |
| G045 | 054 training-home | Analytics-unproven | Recommendations, progress stats, and target cue cards must come from analysis history or user goals. Current evidence points to fixed player analytics. |
| G046 | 055 quick-start | Analytics-unproven | Quick start shows form score and session context but needs proof that the drill choices and values come from current user data. |
| G047 | 056 discover-drills | Unproven | Drill catalog may render, but needs proof that filters, saved drills, and recommendations are functional and not just a static catalog. |
| G048 | 057 drill-detail | Analytics-unproven | Drill detail shows coaching/analytics context and canonical media. Need proof it uses the player's real weakness/goals. |
| G049 | 058 my-drills | Static-looking | Saved drill list uses fixed examples; persistence and cross-device/web sync need proof. |
| G050 | 059 workout-calendar | Analytics-unproven | Calendar/session summaries show fixed field-goal percentages and streak context unless proved from `/api/workouts` and `/api/shot-events`. |
| G051 | 060 drill-execution | Partial | Manual make/miss count, undo, pause, timer, and save are real local functions. The media surface and coaching cue are still canonical/static and not measured from the workout. |
| G052 | 061 shot-tracker | Partial/broken analytics | Local make/miss increments are real, but the screen starts with fixed baseline `24` shots, `15` makes, fixed miss set, fixed `03:18`, fixed corrections, and fixed phase rail percentages. See `TrainingFlow.swift:1520`. |
| G053 | 062 workout-completion | Partial/broken analytics | Shots/makes/accuracy can come from the session, but points `+210`, form score `82`, score bar, phase scores `80/78/84/82/85`, and coaching result are fixed. See `TrainingFlow.swift:1755`. |

## Goals, Analytics, Media, Profile Gaps

| ID | Screen(s) | Status | Gap |
| --- | --- | --- | --- |
| G054 | 063 goals | Partial | Goals can load from `/api/goals`, but the model falls back to sample goals when the API returns empty. That can make fake goals look real. |
| G055 | 063 goals | Broken analytics | Goal cards mix backend progress with fixed stats like sessions, average form score `82`, make percentage, trend points, recent sessions, and insight text. |
| G056 | 064 create-goal | Partial | Goal creation can post to `/api/goals`, but linked metric options and help paths are fixed. Need proof that created goals affect analytics/training recommendations. |
| G057 | 065 goal-detail | Partial/broken analytics | Goal progress can patch `/api/goals`, but linked sessions, trend points, technique snapshot, elbow angle, target range, impact estimates, and recommendations are fixed. |
| G058 | 066 analytics-cards | Broken | Native analytics cards render fixed session summaries, trends, form score `82`, accuracy `62.5%`, and share text instead of a proved `/api/analysis-history` source. |
| G059 | 067 analytics-detailed | Broken | Detailed analytics use fixed comparison rows, confidence explanation, trend arrays, and phase values. No native proof of real analysis history aggregation. |
| G060 | 068 my-media | Broken/unproven | Media library uses fixed media entries and canonical thumbnails. Need proof it lists actual uploaded/captured media from shared backend storage. |
| G061 | 069 media-detail | Broken/unproven | Media detail uses canonical media, fixed session values, fixed share text, and fixed form score. Need proof it opens the selected real media item and its saved analysis. |
| G062 | 070 profile | Partial/broken analytics | Profile identity fields may be real, but points, form score, shots, makes, make percentage, and badges need backend provenance. |
| G063 | 071 settings-hub | Partial | Settings UI may be functional for account/preferences, but analytics summaries shown around it need provenance. |
| G064 | 072 share-results | Broken/unproven | Share text/cards use fixed results such as `15/24`, `62.5%`, and form score `82`. Need proof share exports the latest selected real analysis. |

## Home, Elite, Onboarding, Auth Gaps

| ID | Screen(s) | Status | Gap |
| --- | --- | --- | --- |
| G065 | 003-007 auth | Partial | Sign-in/signup/reset screens call backend paths, but verify-email and reset flows need real token/email proof. Staged auth screens are not proof of the full journey. |
| G066 | 008-016 onboarding/permissions | Mixed | Profile inputs may collect real state, but onboarding review and permission primers show analytics-style placeholders before any shot analysis exists. Those must be labeled as examples or removed. |
| G067 | 017-020 home/profile-menu | Broken analytics | Home/profile-menu render fixed or fallback stats including form score, shots, makes, make percentage, points, and target cue. Need proof from `/api/analysis-history`, `/api/shot-events`, `/api/points`, and profile data. |
| G068 | 048 player-card | Broken analytics | Player card uses fixed form score `82`, shots/makes/accuracy, points, stat blocks, and canonical player visuals. It is not a generated card from the player's real history. |
| G069 | 049 customize-player-card | Partial/broken | Customization controls may change local presentation, but the card data underneath is still fixed unless proved from real player analytics. |
| G070 | 050 elite-match | Broken | Elite match shows fixed user metrics, fixed Klay metrics, fixed match percentage, and canonical assets. It does not prove comparison from measured six-key-metric vectors. |
| G071 | 051 photo-comparison | Broken | Comparison shows fixed user/elite scores, angle differences, skeleton overlays, and canonical media. It is not a measured comparison of the user's latest shot. |
| G072 | 052 elite-shooters | Partial/unproven | Shooter database may have backend data, but navigation/detail and matching to the user's shot need proof. |
| G073 | 053 elite-shooter-detail | Broken/native analytics | Detail screen uses fixed stats, fixed contextual breakdowns, and canonical photos; it is not proved to load a selected shooter profile and compare against user data. |

## Desktop Web Follow-Up Gaps

The user rule is that iOS and web must follow the same backend. These are the
current web-side blockers or risks relevant to iOS fixes:

| ID | Web screen | Status | Gap |
| --- | --- | --- | --- |
| W001 | 089 desktop elite shooter detail | Missing route | `screen-implementation-map.md` records `/elite-shooters/[shooterId]` as missing. |
| W002 | 091 desktop drill execution | Missing route | `screen-implementation-map.md` records `/training/drills/[drillId]` as missing. |
| W003 | Web analytics/results | Contract risk | Web has analysis services and result routes, but native result pages often ignore saved analysis data. Any iOS fix must update the shared API/data shape so web receives the same result. |
| W004 | Web demo routes | Audit risk | Routes under `/results/demo` can show demo/canonical results. They must not be used as proof that user-specific analysis, media, or analytics persisted. |

## Required Proof Before Fixes Are Called Done

For each failing feature, capture these artifacts before marking it fixed:

1. A source note naming the exact data object that drives each displayed number.
2. A before/after screenshot or video from a real production path, not
   `-uiTestStage`.
3. A test that changes input media or shot results and proves the displayed
   analytics change.
4. A backend proof showing saved native results are visible on web with the same
   values.
5. A regression test for the button/control: crop, trim, analyze, record, stop,
   confirm make/miss, create goal, update goal, share/export.

## Highest Priority Fix Order

1. Build a shared `AnalysisResult` contract used by both native iOS and web.
2. Fix native video upload/review/trim so real selected video reaches analysis.
3. Fix native result screens to render saved analysis instead of constants.
4. Replace live feedback and shot detected demo values with measured camera
   pose/phase/shot state, or mark the feature as demo until measurement exists.
5. Fix media library/detail/share to use actual captured/uploaded media and the
   saved analysis attached to it.
6. Replace fixed profile/home/goals/analytics numbers with backend history
   aggregations.
7. Fill the two missing desktop web routes and make their data match the iOS
   equivalent.

## Bottom Line

The iOS app currently contains important building blocks: auth calls, camera
recording, still-photo pose detection, image upload, some save calls, goals API,
manual shot-event posting, and canonical visual screens. But the end-to-end
ShotIQ product promise is not yet real across most iOS pages. The biggest gap is
not layout. It is provenance: the app must generate the screenshot, skeleton,
shot phases, confidence, percentages, angles, score, flaws, trends, and web sync
from real user input and shared backend data.
