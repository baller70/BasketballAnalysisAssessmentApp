# ShotIQ iOS Functionality Proof Ledger

Date opened: 2026-08-07
Branch: `claude/shotiq-production-build-txi5pl`
Source audit: `basketball-analysis/docs/shotiq/IOS-FUNCTIONALITY-ANALYTICS-GAP-AUDIT-2026-08-07.md`

This is the working board for fixing ShotIQ functionality. Do not mark an item
`DONE` because the screen looks right. Mark it `DONE` only when the proof gate
passes with real input, screenshots or recording, backend evidence, and web/iOS
agreement where the feature shares data.

## Status Values

| Status | Meaning |
| --- | --- |
| `OPEN` | Known gap, not being fixed yet. |
| `FIXING` | Code is being changed. Only one primary item should be `FIXING` at a time. |
| `VERIFYING` | Code changed, proof gate is running. |
| `DONE` | Fixed, retested, evidence captured, and no dependent screen regressed. |
| `BLOCKED` | Cannot continue without device/media/secret/access/external service. |
| `DEMO-ACCEPTED` | Product decision: intentionally demo/sample, visibly labeled as demo. |

## Tag Taxonomy

| Tag | Meaning |
| --- | --- |
| `#path` | Production user path or navigation is not proved. |
| `#control` | Button, picker, trim, crop, toggle, share, or form action does not perform the implied action. |
| `#media` | Real photo/video/camera media is not carried forward or displayed. |
| `#pose` | Skeleton, joints, body tracking, or phase detection is not generated from real input. |
| `#analytics` | Score, percent, angle, confidence, trend, target, or phase value lacks provenance. |
| `#backend` | Backend save/load/sync is missing or unproved. |
| `#web-sync` | iOS and web do not yet prove the same data contract. |
| `#demo` | Placeholder/sample data is shown as if it were real player data. |
| `#device` | Needs Mac mini, simulator, or physical iPhone proof. |
| `#desktop` | Web/desktop follow-up required. |

## Required Evidence Pack

Every completed item needs an evidence folder or section containing:

1. Source links naming the real data object and calculation.
2. Simulator or device screenshot before the fix when useful.
3. Simulator or device screenshot/recording after the fix.
4. Test command and result.
5. Backend proof when the feature persists data.
6. Web proof when the same result must appear in the web app.

## Fix Order

The first pass should fix root causes before polishing dependent screens:

1. `P0-001` shared analysis result contract.
2. `P0-002` native video media pipeline.
3. `P0-003` native result screens read saved analysis.
4. `P0-004` live camera measured feedback and shot detection.
5. `P0-005` native media library/detail/share use real media.
6. `P0-006` profile/home/goals/analytics aggregate real backend history.
7. `P1-001` missing desktop routes and web sync proof.

## P0 Root Items

| ID | Status | Tags | Scope | Proof Gate |
| --- | --- | --- | --- | --- |
| P0-001 | VERIFYING | `#analytics` `#backend` `#web-sync` | Shared `AnalysisResult` contract for form score, confidence, release angle, elbow/wrist values, shot arc, phase scores, flaws, media, and timestamps. | Same test shot produces one saved result that native and web both render with matching values. Backend contract, native decode, native save-result handoff, native overview presentation, and save/latest web API contract proof are captured. Native video now computes and persists the same release-from-vertical and wrist/forearm-elevation semantics the web pose pipeline uses. Still needs real iOS-created analysis visible on web with matching values before `DONE`. |
| P0-002 | VERIFYING | `#media` `#control` `#backend` | Native video upload, review, trim, frame extraction, analysis, and save pipeline. | Pick a real video, review that exact clip, trim it, analyze only the trimmed range, save result, and reopen it. Selected-video review, full-screen source selection, file import, trim propagation, multipart upload, save-analysis handoff, trimmed-frame pose sampling, measured angle/score persistence, server video rendering, and app-local selected-video result fallback are implemented and simulator-tested; release and wrist parity fields are now included. Needs real selected-video device/backend/web proof before `DONE`. |
| P0-003 | VERIFYING | `#analytics` `#pose` `#media` | Native analysis/result screens consume saved analysis instead of constants. | Screen 038 now passes the saved `AnalysisResultPresentation` into the immediate result-detail branch, and screens 041, 044, and 045 render/share the saved score, measured release/height/elbow/wrist values, saved score breakdown, missing-score state, source coverage, weakest-score CTA, and app-local selected photo/video result fallback instead of their old demo constants when server media URLs are absent. Still needs the remaining result/flaw/frame/detail screens, true confidence/trend/history fields, real pose frames, and real device/backend/web proof before `DONE`. |
| P0-004 | VERIFYING | `#device` `#pose` `#analytics` `#media` | Live camera measured feedback and shot detection. | Simulator proof now covers the production navigation path through live camera setup, hoop calibration, readiness, recording, END ROUND, shot detected, confirm make, toast/progress feedback, and capture review. Backend shot-event payload contract is fixed for make/miss confirmation. Still needs Kevin's iPhone with a real hoop/ball to prove optical make/miss classification, skeleton following, confidence, form score, context, and replay come from the recording. |
| P0-005 | OPEN | `#media` `#backend` `#web-sync` | Media library, media detail, and share/export use real uploaded/captured media. | Upload/capture media on iOS, see it in iOS library and web library, open detail, share the matching result. |
| P0-006 | OPEN | `#analytics` `#backend` | Home, profile, goals, training, analytics, points, and trends aggregate real history. | Seed or create backend history, reload iOS and web, verify totals/trends/points match expected calculations. Thumbnail placeholder imagery on affected training/goals/media/profile cards now falls back to bundled basketball media, but aggregate values are still unproved. |

## Cross-Cutting Items

| ID | Status | Priority | Tags | Screen(s) | Work Item | Proof Gate |
| --- | --- | --- | --- | --- | --- | --- |
| G001 | OPEN | P0 | `#path` `#demo` | staged screens | Stop using staged canonical renders as functionality proof. | Any cleared screen has a production-path test separate from `-uiTestStage`. |
| G002 | OPEN | P0 | `#analytics` `#demo` | all analytics screens | Replace or label fixed native analytics values. | Static sweep finds no player-facing unproven constants on cleared screens. |
| G003 | OPEN | P0 | `#backend` `#web-sync` | iOS/web | Make iOS and web share result semantics. | Same saved result renders same meaning on both platforms. |
| G004 | OPEN | P0 | `#backend` `#web-sync` | auth/data sync | Prove native write/read and web read/write with configured secrets. | Auth-chain test passes in staging/prod. |
| G005 | OPEN | P1 | `#demo` | app-wide | Label intentional sample states. | Any sample screen visibly says demo/example and cannot be mistaken for player data. |
| G006 | OPEN | P0 | `#analytics` | app-wide | Build analytics provenance matrix. | Every visible number on cleared screens has source, formula, and test. |
| G074 | VERIFYING | P0 | `#control` | capture/goals/training/media/profile | Add customer-visible toast/progress feedback after meaningful actions. | First batch covers create/update goal, target link, add drill, drill make/miss/undo/pause/save, shot-tracker make/miss/undo/pause/save, analytics filters, media play/speed/frame/share/download/delete, profile bio enhancement, and profile save. Capture now adds toast/progress feedback for photo load/capture/rotate/crop/use-photo, photo analysis upload/analyze/error, upload queue add/analyze/remove, video load/error, video review trim/change/analyze, and no-media guards. Focused UI proof verifies make/miss toasts, capture no-media feedback, create-goal target-link toast, settings/about controls, share-results copy feedback, and media detail download/delete feedback on iPhone 17 Pro simulator with external-backed CoreSimulator storage. Remaining app-wide action sweep still needs proof before `DONE`. |

## Capture And Upload Items

| ID | Status | Priority | Tags | Screen(s) | Work Item | Proof Gate |
| --- | --- | --- | --- | --- | --- | --- |
| G007 | VERIFYING | P2 | `#path` `#media` | 022/026 | Clarify photo vs video upload paths. | Analyze hub separates upload photo from upload video, and screen 026 now opens a full-screen video source menu with Video library, Browse files, Record video, Upload queue, and View filming tips. Focused UI proof passes on the laptop iPhone 17 Pro simulator. Still needs real selected-media device proof before `DONE`. |
| G008 | OPEN | P0 | `#control` `#media` `#device` | 023 | Prove and fix photo crop on real selected image. | Before/after real image screenshot shows crop changed pixels and persisted to next screen. |
| G009 | VERIFYING | P1 | `#analytics` `#demo` | 023 | Remove or source analysis context from pre-analysis crop screen. | Photo Review Crop now has focused UI proof that it renders the selected-photo crop/tip path without pre-analysis score/history/target language (`82`, `24`, `15`, `62.5%`, `FORM SCORE`, `SHOTS`, `MAKES`, `ACCURACY`, `Keep elbow stacked through release`). Real picker/device crop screenshots remain before `DONE`. |
| G010 | VERIFYING | P0 | `#analytics` `#pose` | 024 | Replace fixed header analytics on quality check. | Upload Quality Check no longer shows pre-analysis 82/24/15/62.5% measured-looking score/history values. The header now shows source-safe photo/view/pose/score context (`READY`, selected viewpoint, pose status, `AFTER SCORE`) and says the target is set after upload finishes. Focused UI proof confirms the new copy is present and the old values are absent. Real device/backend proof remains before `DONE`. |
| G011 | VERIFYING | P1 | `#analytics` `#media` | 024 | Measure or relabel lighting and resolution checks. | Upload Quality Check now evaluates selected still-image brightness from pixels and reports actual image pixel dimensions as `Image resolution`; focused unit proof covers Good/Too dark/Too bright and High/Low resolution, and focused UI proof confirms selected-photo screen 024 shows pixel detail while the old `Video resolution` / `1080p` still-image row is absent. Real low-light/low-resolution physical-device media proof remains before `DONE`. |
| G012 | VERIFYING | P0 | `#path` `#backend` | 023/024/036 | Block no-image route from pretending analysis started. | Photo Review `USE PHOTO` and Upload Quality Check `Continue to analysis` now require a real picked/captured image and show `Choose a photo first` toast instead of opening processing. Focused UI proof passes on the laptop iPhone 17 Pro simulator using external DerivedData and external-backed CoreSimulator storage. Still needs real selected-image device/backend/web proof before `DONE`. |
| G013 | VERIFYING | P0 | `#analytics` `#backend` | 024 | Replace broad grade-to-score mapping with real metric contract. | The photo upload save path no longer converts qualitative `A/B/C/D/F` vision grades into numeric `overallScore` values. It now saves the grade/coach text as `visionAnalysis` metadata with `overallScore == nil` unless a real measured numeric scoring field exists; focused unit proof asserts an `A` grade does not encode an `overallScore`. Backend round-trip proof with a real saved analysis remains before `DONE`. |
| G014 | VERIFYING | P0 | `#backend` `#analytics` | 024 to 038 | Pass saved analysis into native result UI. | Save response now carries `analysisResult` from 024 through 036 into 038, and 038 renders score/media/metric values from `ShotIQAnalysisResultDTO`; focused laptop XCTest proves the presentation mapping. If the backend returns no remote image URL, or the backend is unreachable, the selected/cropped local photo is preserved and rendered in the result path with unavailable metrics rather than demo scores. Still needs end-to-end device/web round-trip proof before `DONE`. |
| G015 | VERIFYING | P1 | `#media` `#backend` `#demo` | 025 | Replace fake upload queue with real queued media/persistence. | Upload Queue no longer starts with fake `pullup-jumper.mov`, `spotup-three.mov`, or `transition-pullup.mov` items. It starts empty with customer-facing empty-state copy, `Analyze now` blocks with `Add media first` toast, and focused UI proof confirms it does not navigate to processing without queued media. Real picker-selected media queueing and backend persistence remain before `DONE`. |
| G016 | VERIFYING | P0 | `#media` `#control` | 026 | Load selected video instead of only navigating. | `VideoUploadView` now loads the selected `PhotosPickerItem` or Files import into a retained temporary video URL before navigation; focused laptop XCTest confirms the retained clip model and a focused UI test confirms the restored full-screen source options. Still needs real picker/device-media recording before `DONE`. |
| G017 | VERIFYING | P0 | `#media` `#demo` | 027 | Review actual selected clip, not canonical media. | `VideoReviewView` now renders `VideoPlayer` for the selected clip and keeps canonical media only for explicit fallback/staged paths. Still needs real picker/device-media recording before `DONE`. |
| G018 | VERIFYING | P1 | `#media` `#analytics` | 027 | Read real duration, size, orientation, and FPS. | `PickedVideoClip` reads duration, dimensions, file size, and FPS from the selected asset; focused laptop XCTest proves the metadata formatting. Still needs real selected file proof before `DONE`. |
| G019 | VERIFYING | P0 | `#control` `#media` | 027 | Make trim controls affect analysis input. | `VideoReviewView` now builds a `VideoAnalysisJob` with selected clip plus trim fractions, and tests prove trim seconds/duration are computed from the real clip. Still needs device recording proving the backend payload contains the selected trim before `DONE`. |
| G020 | VERIFYING | P0 | `#media` `#pose` `#analytics` `#backend` | 027 to 038 | Implement native video analysis/save path. | Native now samples frames inside the selected trim window, runs Vision pose detection, computes measured elbow/knee/wrist/shoulder/hip/release angles and scores when joints are found, uploads selected videos through `/api/media-uploads`, completes multipart storage, calls `/api/save-analysis` with the same `clientSessionId`, and renders saved `videoUrl` or app-local selected clip in result UI. If sync fails, the selected clip still appears in a local result with measured pose fields when available and unavailable fields marked missing, not demo. Needs real selected-video device/backend/web proof before `DONE`. |

## Live Camera And Shot Detection Items

| ID | Status | Priority | Tags | Screen(s) | Work Item | Proof Gate |
| --- | --- | --- | --- | --- | --- | --- |
| G021 | OPEN | P1 | `#device` `#analytics` | 028 | Make setup checks measured or demo-labeled. | Body/framing/lighting/stability checks change with real camera conditions. |
| G022 | OPEN | P1 | `#device` `#backend` | 029 | Persist hoop calibration and use it in shot detection. | Changed hoop target changes downstream shot/arc calculation. |
| G023 | OPEN | P1 | `#device` `#analytics` | 030 | Make readiness percentage measured. | Readiness changes with camera/body/hoop conditions and has source formula. |
| G024 | VERIFYING | P0 | `#device` `#analytics` | 032 | Replace fixed live-recording HUD values. | Live Recording no longer publishes fixed `24 / 15 / 62.5%` shot/make/make-percent values. It starts from `LiveRecordingStats` (`0 / 0 / --`) and updates from recorded session events; focused unit and UI proof assert make/miss events update the HUD to `2 / 1 / 50.0%`. Real optical shot detection classification still needs physical-device proof before `DONE`. |
| G025 | VERIFYING | P0 | `#device` `#pose` `#analytics` | 033 | Replace demo feedback with measured live feedback or mark feature demo. | Live Form Feedback no longer shows fixed `82`, `87%`, `Release`, or `Keep building consistency.` as if live AI measured them. The screen starts in an honest waiting state (`--`, `Waiting`, `Waiting for live pose.`) and updates only from `LiveFormFeedbackState`; focused unit and UI proof assert a simulated measured event changes the screen to `79`, `72%`, `Release`, and `Keep elbow stacked.` Real live pose-stream integration on Kevin's iPhone remains before `DONE`. |
| G026 | OPEN | P0 | `#device` `#pose` | 033 | Prove skeleton follows real player while shooting. | Screen recording shows joints follow player motion with logged pose frames. |
| G027 | OPEN | P0 | `#device` `#pose` `#analytics` | 034 | Trigger shot-detected from real detector, not navigation. | Real shot opens detection card; non-shot does not. |
| G028 | OPEN | P0 | `#device` `#pose` `#media` | 034 | Draw skeleton/release arc over recorded clip. | Replay shows measured overlay aligned to real body/ball frames. |
| G029 | VERIFYING | P1 | `#backend` `#analytics` | 034 | Tie make/miss confirmation to measured shot event. | Native `CONFIRM MAKE` / `MARK MISS` now posts the backend `/api/shot-events` event envelope with `detectedResult`, confidence, sequence, drill metadata, and source metadata instead of the old unmatched `{ drillId, result }` body. Focused unit proof verifies the encoded JSON contract, and focused UI proof verifies make/miss feedback and review navigation. Still needs real detector metadata plus history/web-total round-trip proof before `DONE`. |
| G030 | VERIFYING | P1 | `#analytics` `#backend` | 035 | Make capture review summarize real captured shots. | Capture Review now takes `LiveCaptureSessionSummary` instead of fixed `24 / 15 / 62.5%` values. Confirming one make on screen 034 records one session event and opens screen 035 with `1` shot, `1` make, `100.0%` make rate, zero review/discard counts, and old `15` / `62.5%` totals absent. Backend session persistence and real detector-created event counts still need proof before `DONE`. |

## Analysis Result Items

| ID | Status | Priority | Tags | Screen(s) | Work Item | Proof Gate |
| --- | --- | --- | --- | --- | --- | --- |
| G031 | VERIFYING | P0 | `#path` `#backend` | 027/036 | Processing only appears for real analysis jobs. | Video Review now uses a state-driven analyze button: a real `PickedVideoClip` creates the `VideoAnalysisJob`; nil/staged video shows `Choose a video first` toast and does not open processing. Focused UI proof passes on the laptop iPhone 17 Pro simulator using external DerivedData and external-backed CoreSimulator storage. Still needs real selected-video device/backend proof before `DONE`. |
| G032 | OPEN | P2 | `#path` | 037 | Prove real long-running analysis timeout. | Slow analysis job opens taking-longer state and later resolves correctly. |
| G033 | VERIFYING | P0 | `#analytics` | 038 | Replace hard-coded six key metrics. | Screen 038's six tiles now render from `AnalysisResultPresentation` and the saved-analysis DTO, with missing values shown as `--` / `UNAVAILABLE` instead of demo constants. Still needs live backend-result mutation proof before `DONE`. |
| G034 | VERIFYING | P0 | `#pose` `#media` | 038 | Replace demo skeleton on overview with real pose. | Local photo analysis now preserves optional detected pose points in the saved result contract, merges them with backend save responses when the backend omits pose, and renders local overview media through `CapturedPoseImage` instead of the canonical skeleton. Laptop simulator Vision is unavailable because its human-pose weights are missing, so real detection draw remains physical-device proof before `DONE`. |
| G035 | OPEN | P0 | `#analytics` `#backend` | 038 | Replace fixed player/session/elite summary values. | Overview loads user/session/match values from backend and formulas. |
| G036 | OPEN | P2 | `#path` `#backend` | 039 | Prove no-analysis empty state only when truly empty. | Empty user shows no-analysis; fetch failure shows error, not empty state. |
| G037 | OPEN | P2 | `#path` `#control` | 040 | Prove error path and retry behavior. | Failed upload/analyze opens error and retry preserves or reselects media correctly. |
| G038 | VERIFYING | P0 | `#analytics` `#pose` `#media` | 041 | Generate shot breakdown from measured frames. | Score/share copy and the top measured stat strip now come from the saved presentation passed by screen 038, with XCTest proof that old 52-degree/7.5 ft demo copy is gone from this path. The phase filmstrip now uses selected local/server media for non-demo saved results instead of falling back to canonical stock frames when no frame set exists. Per-frame phase coaching and true saved frame-analysis data still need proof before `DONE`. |
| G039 | OPEN | P0 | `#pose` `#analytics` | 042 | Frame detail uses real pose and metrics. | Toggling overlay shows real saved joints/ball for selected frame. |
| G040 | OPEN | P2 | `#control` `#media` `#backend` | 043 | Make annotations real and persistent. | Draw annotation, save/share/export, reopen and see it on same media. |
| G041 | VERIFYING | P0 | `#analytics` | 044 | Replace fixed form score screen. | Top score/verdict/caption/bar/share text, breakdown cards, metric detail rows, source coverage, key insight, and weakest-score CTA now consume the saved presentation passed by screen 038, including missing-score unavailable state. True confidence and history/trend calculations still need saved result/history sources before `DONE`. |
| G042 | VERIFYING | P0 | `#analytics` | 045 | Replace fixed metric detail. | Metric detail now receives the selected metric value text plus parent saved presentation from screen 038, and its share/top score/measured value are no longer hardcoded to form score 82. Range, confidence, explainer copy, and drill-plan linkage still need metric-source proof before `DONE`. |
| G043 | OPEN | P0 | `#analytics` `#pose` | 046 | Generate flaws from analysis. | Flaw list changes based on measured weak metrics and confidence thresholds. |
| G044 | OPEN | P0 | `#analytics` `#pose` `#media` | 047 | Generate flaw detail from real evidence frames. | Detail frames, angles, ideal range, and trend match selected flaw data. |

## Training Items

| ID | Status | Priority | Tags | Screen(s) | Work Item | Proof Gate |
| --- | --- | --- | --- | --- | --- | --- |
| G045 | OPEN | P1 | `#analytics` `#backend` | 054 | Training home recommendations from real history/goals. | Seeded weakness/goal changes recommended drill and progress stats. Training saved-drill thumbnail placeholders are fixed with bundled shot imagery; recommendation data still needs backend/history proof. |
| G046 | OPEN | P1 | `#analytics` | 055 | Quick start values from current user data. | Different user history changes form score/session context. |
| G047 | OPEN | P2 | `#control` `#backend` | 056 | Prove drill catalog filters and saved drills. | Filter/save/drill selection persists and syncs. |
| G048 | OPEN | P1 | `#analytics` | 057 | Drill detail uses player weakness/goals. | Drill detail target changes from selected real flaw/goal. |
| G049 | OPEN | P1 | `#backend` `#demo` | 058 | Saved drill list from backend. | Save/remove drill changes list after reload and web sync if applicable. Shared drill thumbnail fallback now prevents gray icon-only cards, but persistence/backend proof is still open. |
| G050 | OPEN | P1 | `#analytics` `#backend` | 059 | Calendar summaries from workouts/shot events. | Workout API seed changes calendar percentages/streaks. |
| G051 | OPEN | P1 | `#media` `#analytics` | 060 | Drill execution media/cue from drill plan or live input. | Chosen drill displays correct media/cue and measured/live data where claimed. |
| G052 | OPEN | P1 | `#analytics` `#demo` | 061 | Remove fixed shot-tracker baselines and phase rail. | New session starts from zero or real history; phase/correction values have source. |
| G053 | OPEN | P1 | `#analytics` `#backend` | 062 | Workout completion uses real points/form/phase result. | Completion values match workout events, points rules, and analysis output. |

## Goals, Analytics, Media, Profile Items

| ID | Status | Priority | Tags | Screen(s) | Work Item | Proof Gate |
| --- | --- | --- | --- | --- | --- | --- |
| G054 | VERIFYING | P1 | `#backend` `#demo` | 063 | Remove fake fallback goals or label them. | Empty/failing production goal loads no longer silently show fake personal goals; the screen shows loading, empty, or unavailable states instead. Goal card media placeholders are fixed with bundled basketball imagery. Focused XCTest proves production `GoalsViewModel` does not start with sample progress; still needs backend/web proof before `DONE`. |
| G055 | OPEN | P1 | `#analytics` | 063 | Goal cards use real sessions/form/make/trends. | Goal card numbers reproduce from backend history and goal progress. Goal/session thumbnails are fixed, but numbers and trends still need real history proof. |
| G056 | OPEN | P1 | `#backend` `#analytics` | 064 | Created goals affect recommendations/analytics. | New goal changes goals list and downstream training/analytics surfaces. |
| G057 | OPEN | P1 | `#analytics` | 065 | Goal detail uses real linked sessions and technique snapshot. | Linked sessions/trends/angles match saved workout and analysis records. |
| G058 | OPEN | P0 | `#analytics` `#backend` | 066 | Analytics cards load real history. | API seed changes cards, trends, share values, and deltas exactly. |
| G059 | OPEN | P0 | `#analytics` `#backend` | 067 | Detailed analytics aggregate real history. | Range/filter changes recompute rows, confidence, trends, and phase values. |
| G060 | OPEN | P0 | `#media` `#backend` | 068 | Media library lists real uploaded/captured media. | Upload/capture appears in media library after reload. Stock thumbnail placeholders on My Media tiles are fixed, but real uploaded/captured media listing remains open. |
| G061 | OPEN | P0 | `#media` `#analytics` | 069 | Media detail opens selected real media and analysis. | Selecting item opens matching media and saved metrics. |
| G062 | OPEN | P1 | `#analytics` `#backend` | 070 | Profile analytics from backend. | Points/score/shots/makes/badges match API data. |
| G063 | OPEN | P2 | `#control` `#analytics` | 071 | Settings actions plus real analytics context. | Settings persist; any analytics displayed have provenance. |
| G064 | OPEN | P1 | `#control` `#media` `#analytics` | 072 | Share latest real result. | Shared/exported card/text matches selected saved analysis and media. |

## Home, Elite, Onboarding, Auth Items

| ID | Status | Priority | Tags | Screen(s) | Work Item | Proof Gate |
| --- | --- | --- | --- | --- | --- | --- |
| G065 | OPEN | P1 | `#path` `#backend` | 003-007 | Prove full auth, verify email, reset token journeys. | Real signup, verify, forgot password, reset, sign-in, sign-out flows pass. |
| G066 | VERIFYING | P2 | `#demo` `#analytics` | 008-016 | Remove or label pre-analysis analytics in onboarding/permissions. | Focused onboarding proof now verifies the profile controls and carried-forward state through screens 008-016: measurement steppers/unit toggles, experience/body type, shooting profile, short-bio validation, review expander, save-fallback, permission skips, and return to a real home root. Pre-analysis analytics/sample stats still need a product decision or backend-derived source before `DONE`. |
| G067 | OPEN | P0 | `#analytics` `#backend` | 017-020 | Home/profile-menu stats from real backend. | New/standard/pro user dashboard changes from seeded history. |
| G068 | OPEN | P1 | `#analytics` `#media` | 048 | Player card generated from real history/profile. | Card values/media match current user data and latest analysis. |
| G069 | OPEN | P2 | `#control` `#analytics` | 049 | Player-card customization persists over real data. | Custom style changes persist without changing underlying analytics. |
| G070 | OPEN | P1 | `#analytics` `#backend` | 050 | Elite match from measured metric vectors. | Different analysis result changes closest elite match and similarity score. |
| G071 | OPEN | P1 | `#analytics` `#pose` `#media` | 051 | Photo comparison from user's measured shot. | Comparison overlays and angle differences match user result and selected elite profile. |
| G072 | OPEN | P2 | `#backend` | 052 | Prove elite shooters list/detail navigation. | Shooter list loads from backend and selected shooter opens correct detail. |
| G073 | OPEN | P1 | `#analytics` `#backend` | 053 | Elite shooter detail from selected shooter profile. | Detail stats/media load from shooter object and compare correctly with user data. |

## Desktop Web Sync Items

| ID | Status | Priority | Tags | Screen(s) | Work Item | Proof Gate |
| --- | --- | --- | --- | --- | --- | --- |
| W001 | OPEN | P1 | `#desktop` `#path` | 089 | Build `/elite-shooters/[shooterId]`. | Desktop route exists, loads selected shooter, matches iOS detail data. |
| W002 | OPEN | P1 | `#desktop` `#path` | 091 | Build `/training/drills/[drillId]`. | Desktop drill execution route exists and shares workout/drill data with iOS. |
| W003 | OPEN | P0 | `#desktop` `#web-sync` `#backend` | web results | Prove web renders native saved analysis correctly. | iOS-created analysis appears on web with matching score/metrics/media. |
| W004 | OPEN | P1 | `#desktop` `#demo` | `/results/demo` | Separate demo routes from user-proof routes. | Demo pages cannot be used as proof of user-specific saved analytics. |

## Current Next Item

Continue `P0-002`, then finish the remaining `P0-001` web-sync proof once a real
iOS-created analysis is available. The shared result contract now exists in
backend TypeScript and native Swift DTOs, and `/api/save-analysis` plus
`/api/analysis/latest` return it as `analysisResult` while preserving legacy
`analysis` for current web screens. Native iOS decodes both fields, carries the
save response into processing, and renders analysis overview values from the
shared contract rather than screen constants. The video path now carries a real
selected clip into review, derives metadata, propagates trim, samples frames
inside the trim window, runs Vision pose detection, uploads via the backend
media-upload flow, saves measured pose fields with the matching
`clientSessionId`, and renders saved video media. The native pose analysis now
also persists wrist/forearm elevation and release-from-vertical values matching
the web pose pipeline semantics. The result path now also preserves and renders
app-local selected photo/video media when the backend save response has no
remote media URL or when sync is unavailable, which prevents the immediate
result and shot breakdown screens from falling back to stock/canonical pictures
after a real picker/crop flow. Guide placeholders remain intentional default
states: they explain what each slot does before media is selected, and should
return for the next capture/upload flow after the user finishes viewing the
selected media result. Selected media only replaces a placeholder while that
photo/video is the active user input or active result.
Training, goals, and media/profile thumbnail cards that forgot to pass an image
key now fall back to bundled basketball imagery instead of gray icon-only
placeholders, with explicit photos added to the screenshot-backed goal and media
cards. This is visual/media-surface proof only; backend history, aggregate
analytics, and real iOS device round-trip proof remain open.
Customer-visible feedback now exists for the first high-friction native action
batch: shared toast/progress overlay, goal mutations, training shot entry,
workout save, analytics filters, media actions, and profile edits. This proves
the "tap did something" pattern for the tested drill path, but app-wide feedback
coverage still needs a screen-by-screen sweep.
Capture feedback and no-media guards now cover the upload/review/queue/analyze
paths most likely to confuse customers: photo load/capture/rotate/crop/use,
photo upload/analyze, video load/review/trim/change/analyze, upload queue
add/analyze/remove, and nil-media attempts. The laptop host storage issue is now
cleared: CoreSimulator staging lives on an external APFS sparsebundle mounted at
`/Volumes/ShotIQCoreSimulator`, DerivedData and evidence live under
`/Volumes/TBF SKILLZ.INC/CodexWork`, and the focused capture no-media UI proof
passes on the iPhone 17 Pro simulator. The connected iPhone still does not
enumerate in `devicectl`, so physical-device proof remains blocked by
host/device visibility, not by disk space. Remaining proof before
`P0-002` can move to `DONE`: real selected-video device/backend proof and
web/iOS round trip.

### 2026-08-07 Native Screenshot Capture and Export Proof

Sixteenth laptop functionality slice after local Xcode setup:

- Ran the full canonical iOS screenshot suite directly through `xcodebuild`
  instead of `scripts/simulator-screenshots.sh`, because that script still has
  a local CoreSimulator fallback that can move simulator state back to the boot
  volume. This run kept Xcode, DerivedData, result bundles, and exported
  attachments on the external drive.
- Verified the screenshot harness can capture both series screenshots and
  single staged screenshots. The passing run walked auth, onboarding,
  new-player/standard/pro home, capture/upload, live-camera setup, hoop
  calibration, readiness, live recording, shot detected, capture review, upload
  queue, analysis processing, result overview, shot breakdown, frame detail,
  annotation toolbar, form score, metric detail, flaws, elite match, share
  results, training, progress, profile, player card, goals, settings, and the
  staged one-off states.
- Exported the actual screenshot attachments from the `.xcresult` and counted
  75 PNG files: `001-splash` through `075-analysis-error`. The manifest
  attachment exported as the one additional non-PNG file.
- Added direct render coverage for the image-share surfaces, because a screen
  screenshot and an app-generated share image are separate proof points. The
  production `PlayerCardView`, customized player-card sheet, and
  `ShareResultsView` now use the same small renderer helpers that the focused
  unit tests call.
- The proof covers simulator navigation, screenshot capture, attachment export,
  player-card image rendering, and share-results image rendering. It does not
  prove that the iOS system share sheet saved an image into a real user's Photos
  library, because that sheet is OS-owned and still needs physical-device
  acceptance proof if Kevin wants that exact OS interaction certified.

Evidence captured on the laptop, all external-drive backed:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/screenshot-full-20260807-174100/xcodebuild-screenshots.log`
  ran `ShotIQUITests/CanonicalScreenshotTests` on the iPhone 17 Pro simulator.
  It ended with `** TEST SUCCEEDED **`, `Executed 9 tests, with 0 failures`.
  The matching result bundle is
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/screenshot-full-20260807-174100/ShotIQScreenshots.xcresult`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/screenshot-full-20260807-174100/attachments`
  contains the exported PNG screenshots. Export reported 76 attachments total;
  `find ... -name '*.png'` counted 75 PNG screenshots.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/screenshot-export-unit-20260807-175656/xcodebuild-export-render.log`
  ran `ShotIQTests/ScreenshotExportRendererTests` on the iPhone 17 Pro
  simulator. It ended with `** TEST SUCCEEDED **`, `Executed 3 tests, with 0
  failures`. The matching result bundle is
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/screenshot-export-unit-20260807-175656/ShotIQExportRenderTests.xcresult`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/screenshot-profile-rerun-20260807-175844/xcodebuild-profile-screenshots.log`
  reran the affected profile/player/share canonical slice after the renderer
  refactor. It ended with `** TEST SUCCEEDED **`, `Executed 1 test, with 0
  failures`. The matching result bundle is
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/screenshot-profile-rerun-20260807-175844/ProfileScreenshotRerun.xcresult`.
  The exported rerun folder contains 10 PNGs for the captured profile/progress
  screens; the test also verifies `screen-ios-share-results` exists, but that
  step is intentionally `capture: false` in the canonical harness.

### 2026-08-07 Native Make/Miss Calibration Handoff

Fifteenth laptop functionality slice after local Xcode setup:

- Audited the existing web make/miss contract: `/api/shot-events` expects a
  top-level `events` array and each event carries `detectedResult` as `make`,
  `miss`, or `unknown`. The web trajectory tracker resolves makes/misses only
  after rim calibration; review corrections can also override an unknown or
  wrong detector result.
- Fixed native live-capture persistence. `APIClient.recordShotEvent` no longer
  posts the old unmatched `{ drillId, result }` body. It now builds the backend
  event envelope with `detectedResult`, `sequence`, `confidence`, `drillId`, and
  `source`.
- Added customer-facing progress and completion feedback to screen 034
  `ShotDetectedView`: confirming a make or marking a miss shows `Saving shot
  result`, then `Make recorded` or `Miss recorded`, then opens Capture Review.
- Exposed baked-in simulator placeholder state as accessibility data for the
  readiness checklist and live recording rail. This keeps the visual
  placeholders intact while still proving the app state for `Full body`,
  `Lighting`, `Stability`, `Hoop visible`, `Ball visible`, `Pose confidence`,
  `SHOTS`, `MAKES`, and `MAKE %`.
- Expanded the UI-test staged roots so live setup, hoop calibration, readiness,
  capture ready, live recording, and shot detected can be tested directly when
  needed.
- Added focused UI coverage for the full path: Capture tab -> Live camera ->
  setup -> hoop calibration -> readiness -> capture ready -> live recording ->
  END ROUND -> SHOT DETECTED -> CONFIRM MAKE -> toast/progress -> Capture
  Review. Added a second focused UI path for MARK MISS -> toast/progress ->
  Capture Review.
- This is simulator proof for controls, calibration flow, payload contract, and
  customer feedback. It is not yet proof that a real ball crossed a calibrated
  rim on device. Optical make/miss classification still requires Kevin's iPhone
  or another enumerated device with a real hoop/ball run.

Evidence captured on the laptop, all external-drive backed:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/makemiss-unit-20260807-172414.log`
  ran focused unit tests for the native backend make/miss payload and existing
  drill make/miss undo percentages on the iPhone 17 Pro simulator. It ended
  with `** TEST SUCCEEDED **`, `Executed 2 tests, with 0 failures`. The matching
  result bundle is
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/makemiss-unit-20260807-172414.xcresult`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/makemiss-ui-final-20260807-173243.log`
  reran the full calibration-to-confirm-make journey on the iPhone 17 Pro
  simulator after exposing the live stats. It ended with `** TEST SUCCEEDED **`,
  `Executed 1 test, with 0 failures`. The matching result bundle is
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/makemiss-ui-final-20260807-173243.xcresult`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/makemiss-miss-final-20260807-173722.log`
  reran the standalone `MARK MISS` path on the iPhone 17 Pro simulator after
  the final make-path fixes. It ended with `** TEST SUCCEEDED **`, `Executed 1
  test, with 0 failures`. The matching result bundle is
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/makemiss-miss-final-20260807-173722.xcresult`.

### 2026-08-07 Native Customer Feedback Toast Handoff

Eleventh laptop functionality slice after local Xcode setup:

- User clarified a product requirement: every meaningful feature should show a
  toast or progress bar so the customer knows the action is working and they are
  doing it correctly.
- Added shared `ShotIQToast`, `ShotIQToastKind`, and `.shotiqToast(...)`
  overlay support with progress, success, error, and info states. The toast has
  a stable `shotiq-toast` accessibility identifier and exposes visible text for
  UI proof.
- Wired the first production batch:
  - Create goal validates empty names with an info toast, shows a progress toast
    while saving, then a success or error toast before returning to Goals.
  - Goal detail shows progress/success/error toasts for save progress, edit
    goal, mark complete, target selection, and add-drill save.
  - Analytics card filters show applied-filter success feedback.
  - Media detail now confirms play/pause, playback speed, frame selection,
    share-sheet opening, download-unavailable state, sample-delete state,
    delete progress, delete success, and delete failure.
  - Profile bio enhancement and profile-save show progress, success, and error
    feedback.
  - Drill execution and shot tracker now confirm make, miss, undo, pause/resume,
    camera-view selection, and workout-save progress before opening completion.
- This is the first feedback batch, not a claim that every iOS action is now
  covered. The app-wide screen-by-screen action sweep remains open.

Evidence captured on the laptop:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-build-feedback-toasts-20260807-135612.log`
  ran a simulator Debug build using external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-ios-build-feedback-toasts-20260807-135612`
  and ended with `** BUILD SUCCEEDED **`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-unit-feedback-toasts-20260807-135720.log`
  ran the full `ShotIQTests` target on the local iPhone 17 simulator using
  external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-ios-unit-feedback-toasts-20260807-135720`
  and ended with `** TEST SUCCEEDED **`, `Executed 27 tests, with 0 failures`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-ui-feedback-toasts-20260807-135839.log`
  ran the focused `ShotIQUITests/ShotIQUITests/testDrillMarkMakeUpdatesCount`
  UI path on the local iPhone 17 simulator. It tapped `mark-make`, verified the
  `shotiq-toast` element and `Make recorded` text, then tapped `mark-miss` and
  verified `Miss recorded`. It ended with `** TEST SUCCEEDED **`, `Executed 1
  test, with 0 failures`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-smoke-feedback-toasts-20260807-140021.log`
  ran the full `ShotIQUITests/ShotIQUITests` smoke suite on the local iPhone 17
  simulator using external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-ios-smoke-feedback-toasts-20260807-140021`
  and ended with `** TEST SUCCEEDED **`, `Executed 4 tests, with 0 failures`.
- Physical iPhone proof is still not available on this laptop until macOS/Xcode
  enumerates the connected phone.

### 2026-08-07 Native Capture Feedback + No-Media Guard Handoff

Twelfth laptop functionality slice after local Xcode setup:

- Extended the shared toast/progress requirement into capture upload flows:
  photo library/camera load, photo rotate/crop/use-photo, upload-quality
  analysis, upload queue add/analyze/remove, video library load, video review
  trim reset/change-video/analyze.
- Removed the UI-test no-image bypass from `UploadQualityCheckView`. Missing
  photo now shows `Choose a photo first` and cannot open processing.
- Converted `PhotoReviewCropView` use-photo and `VideoReviewView` analyze-video
  to state-driven buttons so nil media shows a customer-facing toast instead of
  creating a fake analysis route.
- Added `ShotIQUITests/testCaptureNoMediaShowsCustomerFeedback`, covering
  staged photo review, upload quality check, and video review no-media attempts.

Evidence captured on the laptop:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-build-capture-feedback-20260807-141043.log`
  ran a simulator Debug build against `iPhone 17 Pro` with external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-ios-build-capture-feedback-20260807-141043`
  and ended with `** BUILD SUCCEEDED **`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-build-for-testing-capture-feedback-20260807-141347.log`
  ran `build-for-testing` for the app, unit-test target, and UI-test target with
  external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-ios-build-for-testing-capture-feedback-20260807-141347`
  and ended with `** TEST BUILD SUCCEEDED **`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-ui-capture-feedback-20260807-141128.log`
  attempted the focused `ShotIQUITests/ShotIQUITests/testCaptureNoMediaShowsCustomerFeedback`
  runtime UI proof, but simulator installation failed before app launch because
  CoreSimulator could not create
  `/Users/tbfinc/Library/Developer/CoreSimulator/.../PromiseStaging`: `No space
  left on device`. The result bundle is
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-ui-capture-feedback-20260807-141128.xcresult`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-ui-capture-feedback-mac-20260807-141334.log`
  confirmed the `My Mac` destination cannot run the iOS UI-test target:
  `UI tests are not supported on My Mac (Designed for iPad)`.
- Host storage correction after the failed runtime attempt:
  `/Users/tbfinc/Library/Developer/CoreSimulator` now symlinks to
  `/Volumes/ShotIQCoreSimulator/CoreSimulator`, backed by
  `/Volumes/TBF SKILLZ.INC/CodexWork/ShotIQCoreSimulator.sparsebundle`.
  Heavy Codex/npm caches also moved under
  `/Volumes/TBF SKILLZ.INC/CodexWork/InternalHomeRelocated`. Audit after
  relocation: `/System/Volumes/Data` had 21 GiB free,
  `/Volumes/ShotIQCoreSimulator` had 75 GiB free, and
  `/Volumes/TBF SKILLZ.INC` had 1.6 TiB free.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-host-storage-device-audit-20260807-143437.log`
  captured the post-fix host audit: `/System/Volumes/Data` had 23 GiB free,
  the external CoreSimulator sparsebundle had 75 GiB free, external
  `CodexWork` paths were symlinked, `/Users/tbfinc/CodexWork` was absent,
  `devicectl` still returned `No devices found`, `xctrace` listed only the Mac
  and simulators, and `system_profiler SPUSBDataType` had no iPhone/iPad/Apple
  Mobile USB entry.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-ui-capture-feedback-accessible-toast-20260807-142640.log`
  reran the focused
  `ShotIQUITests/ShotIQUITests/testCaptureNoMediaShowsCustomerFeedback` UI
  proof on the iPhone 17 Pro simulator with external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-ios-ui-capture-feedback-accessible-toast-20260807-142640`
  and ended with `** TEST SUCCEEDED **`, `Executed 1 test, with 0 failures`.
  The proof verifies `Choose a photo first` toast feedback from Photo Review and
  Upload Quality Check, plus `Choose a video first` toast feedback from Video
  Review, without opening analysis processing from nil media.
- `xcrun devicectl list devices` still returned `No devices found`; real iPhone
  install/proof remains blocked until macOS/Xcode enumerates the unlocked and
  trusted phone.

### 2026-08-07 Native Selected Media Placeholder Handoff

Thirteenth laptop functionality slice after local Xcode setup:

- User clarified the placeholder product rule: keep placeholders as guides. A
  new user-selected photo or video should temporarily replace the placeholder
  while reviewing/analyzing/viewing that specific media, then the placeholder
  should return for the next capture or upload flow.
- Added `ShotIQLocalAnalysisFactory` so the native app can create a non-demo
  local analysis result when sync has not produced a remote media URL yet.
- Photo analysis now persists the selected JPEG locally, runs local pose
  detection, and carries the selected image into processing/results. If backend
  save fails, the user still sees the selected image with missing metrics shown
  as unavailable instead of fake/demo values.
- Video analysis now creates the same kind of local fallback from the selected
  clip and measured `VideoPoseAnalysis` summary when available. If upload/save
  fails, the result screen still shows the selected clip and measured pose
  fields that exist; missing fields stay missing.
- This does not mark device proof complete. The connected iPhone still did not
  enumerate in the prior host audit, so physical install/live-device media proof
  remains blocked until macOS sees the phone.

Evidence captured on the laptop, all external-drive backed:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-unit-local-media-fallback-20260807-144304.log`
  ran the focused selected-photo and selected-video fallback unit tests on the
  iPhone 17 Pro simulator and ended with `** TEST SUCCEEDED **`, `Executed 2
  tests, with 0 failures`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-unit-local-media-fallback-20260807-144304.xcresult`
  is the matching result bundle.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-build-local-media-fallback-20260807-144440.log`
  ran a simulator Debug build against `iPhone 17 Pro` with external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-ios-build-local-media-fallback-20260807-144440`
  and ended with `** BUILD SUCCEEDED **`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-unit-full-local-media-fallback-20260807-144721.log`
  ran the full `ShotIQTests` target on the iPhone 17 Pro simulator with
  external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-ios-unit-full-local-media-fallback-20260807-144721`
  and ended with `** TEST SUCCEEDED **`, `Executed 29 tests, with 0 failures`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-unit-full-local-media-fallback-20260807-144721.xcresult`
  is the matching full-unit result bundle.

### 2026-08-07 Native Simulator Capture Regression Handoff

Fourteenth laptop functionality slice after local Xcode setup:

- Restored and re-proved the richer full-screen video upload source screen. The
  simulator flow now sees Video library, Browse files, Record video, Upload
  queue, and View filming tips instead of the old medium-size choose-video box.
- Fixed a simulator-discovered customer-feedback bug in Video Review: tapping
  Analyze video with no real clip now shows the `Choose a video first` error
  toast and stays out of analysis processing.
- Hardened the canonical screenshot tab helper so the Capture screen can be
  reached reliably through the app's custom tab/home capture path before taking
  screenshots.
- Reconfirmed the placeholder rule visually: guide media remains present on the
  default capture/upload surfaces, and selected/staged media replaces the guide
  only inside the active review/result path.
- This slice is simulator proof only. It does not close the real selected-video
  device/backend/web proof gate.

Evidence captured on the laptop, all external-drive backed:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/video-toast-regression-20260807-154435.log`
  ran the focused
  `ShotIQUITests/ShotIQUITests/testCaptureNoMediaShowsCustomerFeedback`
  regression on the iPhone 17 Pro simulator and ended with
  `** TEST SUCCEEDED **`, `Executed 1 test, with 0 failures`. The matching
  result bundle is
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/video-toast-regression-20260807-154435.xcresult`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-smoke-full-20260807-154702.log`
  ran the full `ShotIQUITests/ShotIQUITests` smoke suite on the iPhone 17 Pro
  simulator with external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-smoke-full-20260807-154702`
  and ended with `** TEST SUCCEEDED **`, `Executed 6 tests, with 0 failures`.
  The smoke pass includes sign-in validation, splash, tab navigation, drill
  make feedback, capture no-media feedback, and the full-screen video upload
  source-options check.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/capture-canonical-20260807-155811.log`
  ran `CanonicalScreenshotTests/test04CaptureScreens` on the iPhone 17 Pro
  simulator with external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-capture-canonical-20260807-155811`
  and ended with `** TEST SUCCEEDED **`, `Executed 1 test, with 0 failures`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/capture-canonical-20260807-155811-attachments`
  contains 15 exported screenshots covering analyze hub, photo upload source,
  full-screen video upload, media detail, live camera setup/calibration/ready,
  recording, feedback, shot detected, capture review, upload queue, processing,
  and analysis overview. A contact sheet is saved at
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/capture-canonical-20260807-155811-contact.png`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/staged-canonical-20260807-160700b.log`
  ran `CanonicalScreenshotTests/test08StagedScreens` on the iPhone 17 Pro
  simulator with external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-staged-canonical-20260807-160700b`
  and ended with `** TEST SUCCEEDED **`, `Executed 1 test, with 0 failures`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/staged-canonical-20260807-160700b-attachments`
  contains 7 exported screenshots covering verify email, reset password, photo
  review crop, upload quality check, video review, analysis taking longer, and
  analysis error. A contact sheet is saved at
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/staged-canonical-20260807-160700b-contact.png`.

### 2026-08-07 Native Local Media Result Handoff

Ninth laptop functionality slice after local Xcode setup:

- User phone screenshots exposed a real production-path problem: Photo Review
  could show the selected image, but saved result/breakdown screens could still
  show stock or placeholder media if the backend returned no remote image URL.
- Added app-local media URL fields to the native analysis media DTO and
  presentation layer.
- Photo analysis now writes the selected/cropped JPEG to the app cache before
  upload and carries that local file URL into the saved analysis object when the
  server image URL is absent.
- Video analysis now carries the selected local clip URL into the saved analysis
  object when the server video URL is absent.
- Result overview media rendering now supports `file://` images directly, and
  shot breakdown uses the selected saved media for non-demo results instead of
  canonical stock phase frames when no true frame set exists yet.

Evidence captured on the laptop:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-unit-local-media-fallback-20260807-132908.log`
  ran `ShotIQTests/AnalysisResultContractTests` on the local iPhone 17
  simulator using external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-ios-unit-local-media-fallback-20260807-132908`
  and ended with `** TEST SUCCEEDED **`, `Executed 6 tests, with 0 failures`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-unit-full-local-media-20260807-133137.log`
  ran the full `ShotIQTests` target on the local iPhone 17 simulator using
  external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-ios-unit-full-local-media-20260807-133137`
  and ended with `** TEST SUCCEEDED **`, `Executed 27 tests, with 0 failures`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-smoke-local-media-20260807-133412.log`
  ran the full `ShotIQUITests/ShotIQUITests` smoke suite on the local iPhone 17
  simulator using external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-ios-smoke-local-media-20260807-133412`
  and ended with `** TEST SUCCEEDED **`, `Executed 4 tests, with 0 failures`.
- With `scripts/shotiq-xcode-env.sh` loaded after the user connected the phone,
  `xcrun devicectl list devices` still returned `No devices found` on this
  laptop. Real iPhone install/proof remains blocked until macOS enumerates the
  unlocked/trusted phone.

### 2026-08-07 Native Thumbnail Placeholder Handoff

Tenth laptop functionality slice after local Xcode setup:

- User screenshots still showed gray thumbnail placeholders in training, goals,
  media, and profile-adjacent paths after the local result media fix.
- `PhotoThumb` now resolves nil image keys to bundled basketball imagery instead
  of a gray icon-only rectangle, with icon-aware fallbacks for video, target,
  camera, and chart-style cards.
- Training home now assigns a court frame to all saved-drill rows, including the
  previous "Catch & Shoot Flow" placeholder.
- Goal, create-goal, goal-detail, recent-session, linked-drill, My Media, and
  yesterday-row cards now pass explicit canonical shot imagery where screenshots
  showed blank stock slots.
- This slice only fixes visible media placeholders. It does not mark backend
  goals, history aggregates, analytics provenance, media sync, or device proof
  as complete.

Evidence captured on the laptop:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-unit-thumbnail-fallback-20260807-133922.log`
  ran the full `ShotIQTests` target on the local iPhone 17 simulator using
  external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-ios-unit-thumbnail-fallback-20260807-133922`
  and ended with `** TEST SUCCEEDED **`, `Executed 27 tests, with 0 failures`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-smoke-thumbnail-fallback-20260807-134057.log`
  ran the full `ShotIQUITests/ShotIQUITests` smoke suite on the local iPhone 17
  simulator using external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-ios-smoke-thumbnail-fallback-20260807-134057`
  and ended with `** TEST SUCCEEDED **`, `Executed 4 tests, with 0 failures`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-simshots-thumbnail-fallback-20260807-134337.log`
  ran `CanonicalScreenshotTests/test06TrainingScreens` and
  `CanonicalScreenshotTests/test07ProgressAndProfileScreens` on the local iPhone
  17 simulator using external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-ios-simshots-thumbnail-fallback-20260807-134337`
  and ended with `** TEST SUCCEEDED **`, `Executed 2 tests, with 0 failures`.
  The run captured training screens `001-training-home` through
  `009-shot-tracker`, plus progress/profile screens `010-analytics-cards`
  through `019-settings-hub`, and exercised share-results navigation.
- The screenshot result bundle is
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-ios-simshots-thumbnail-fallback-20260807-134337/Logs/Test/Test-ShotIQ-2026.08.07_13-43-39--0400.xcresult`.
- With `scripts/shotiq-xcode-env.sh` loaded after the user connected the phone,
  `xcrun devicectl list devices` still returned `No devices found`, and
  `system_profiler SPUSBDataType` showed the SanDisk external drive but no
  iPhone or Apple Mobile device. Physical iPhone install/proof remains blocked
  until macOS enumerates the unlocked/trusted phone.

### 2026-08-07 Native Result Detail Contract Handoff

Seventh laptop functionality slice after local Xcode setup:

- Added saved-analysis display helpers to `AnalysisResultPresentation` for
  release height, release offset, elbow angle, wrist angle, and share text.
- Threaded the saved presentation from screen 038 into the immediate native
  result-detail branch: shot breakdown 041, form score 044, and metric detail
  045.
- Removed the old player-facing demo copy from that branch's top score/share
  path: the shot-breakdown share text no longer uses the fixed 52-degree
  release angle or 7.5 ft arc, the form-score share text no longer claims a
  fixed +8.1% trend, and metric detail share/top-score/measured-value text uses
  the selected saved metric.
- Updated `scripts/install-on-device.sh` so its default device-build
  DerivedData lives on the external drive at
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-device` instead of
  `${HOME}/Library/Developer/Xcode/DerivedData/shotiq-device`.

Evidence captured on the laptop:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-unit-p003-result-screens-20260807-130115.log`
  ran `ShotIQTests/AnalysisResultContractTests` on the local iPhone 17
  simulator using external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-ios-unit-p003-result-screens-20260807-130115`
  and ended with `** TEST SUCCEEDED **`, `Executed 4 tests, with 0 failures`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-unit-all-p003-result-screens-20260807-130250.log`
  ran the full `ShotIQTests` target on the local iPhone 17 simulator using
  external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-ios-unit-all-p003-result-screens-20260807-130250`
  and ended with `** TEST SUCCEEDED **`, `Executed 25 tests, with 0 failures`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-smoke-p003-result-screens-20260807-130413.log`
  ran the full `ShotIQUITests/ShotIQUITests` smoke suite on the local iPhone 17
  simulator using external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-ios-smoke-p003-result-screens-20260807-130413`
  and ended with `** TEST SUCCEEDED **`, `Executed 4 tests, with 0 failures`.
- After the user connected the phone, this laptop still reported no physical
  iOS device: with `scripts/shotiq-xcode-env.sh` loaded, `xcrun devicectl list
  devices` returned `No devices found`, and `system_profiler SPUSBDataType`
  showed the external SanDisk drive but no iPhone/Apple Mobile USB device.
  Real-device install and selected-video proof remain pending until macOS can
  enumerate the unlocked/trusted phone.

### 2026-08-07 Native Form Score Breakdown Contract Handoff

Eighth laptop functionality slice after local Xcode setup:

- Replaced the fixed form-score breakdown on screen 044 with
  `AnalysisScoreBreakdownItem` rows built from the saved shared analysis
  contract: form, balance, release, consistency, and overall.
- Missing saved score fields now render as `--` / `UNAVAILABLE` with missing
  source metadata instead of silently filling demo values.
- Replaced the old fixed confidence card with saved-result source coverage until
  the native contract has a real confidence field for this screen.
- Updated form-score metric detail navigation and the weakest-metric CTA to use
  the weakest measured saved score instead of the old fixed elbow/power/demo
  rows.
- Hardened the UI smoke drill test so it waits for `screen-ios-training-home`
  before tapping Discover; the prior failing smoke run proved the old test could
  race the tab transition even though the canonical training click-test route
  was valid.

Evidence captured on the laptop:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-unit-p003-form-breakdown-20260807-131148.log`
  ran `ShotIQTests/AnalysisResultContractTests` on the local iPhone 17
  simulator using external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-ios-unit-p003-form-breakdown-20260807-131148`
  and ended with `** TEST SUCCEEDED **`, `Executed 5 tests, with 0 failures`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-unit-all-p003-form-breakdown-20260807-131319.log`
  ran the full `ShotIQTests` target on the local iPhone 17 simulator using
  external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-ios-unit-all-p003-form-breakdown-20260807-131319`
  and ended with `** TEST SUCCEEDED **`, `Executed 26 tests, with 0 failures`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-training-clicktest-p003-form-breakdown-20260807-131851.log`
  ran `ShotIQUITests/CanonicalScreenshotTests/test06TrainingScreens` on the
  local iPhone 17 simulator using external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-ios-training-clicktest-p003-form-breakdown-20260807-131851`
  and ended with `** TEST SUCCEEDED **`, `Executed 1 test, with 0 failures`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-smoke-p003-form-breakdown-rerun-20260807-132131.log`
  reran the full `ShotIQUITests/ShotIQUITests` smoke suite on the local iPhone
  17 simulator using external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-ios-smoke-p003-form-breakdown-rerun-20260807-132131`
  and ended with `** TEST SUCCEEDED **`, `Executed 4 tests, with 0 failures`.

### 2026-08-07 Mac Mini Setup And Evidence

Codex can now reach Kevin's Mac mini directly over SSH:

- Host: `kevins-mac-mini.local`
- User: `kevinhouston`
- Key from this Codex host: `~/.ssh/shotiq_ios`
- Persistent checkout on the Mac: `~/CodexWork/BasketballAnalysisAssessmentApp`
- Branch/head there: `claude/shotiq-production-build-txi5pl` at `19fe19b`
- Xcode path: `/Volumes/APPLICATIONS/02_STORAGE_AND_RUNTIME/mac-storage/xcode-archive/Xcode.app/Contents/Developer`

The Mac's global `xcode-select` still points at
`/Library/Developer/CommandLineTools`, and passwordless `sudo xcode-select` is
not available. Native commands must export:

```sh
export DEVELOPER_DIR=/Volumes/APPLICATIONS/02_STORAGE_AND_RUNTIME/mac-storage/xcode-archive/Xcode.app/Contents/Developer
export PATH="/opt/homebrew/bin:/Users/kevinhouston/.local/bin:$PATH"
```

Setup completed:

- `xcodebuild -version` through `DEVELOPER_DIR`: Xcode 26.2 / build 17C52.
- `xcodegen --version`: 2.46.0.
- `xcodegen generate` in `basketball-analysis/ios-native` completed cleanly.
- `xcrun devicectl list devices` sees Kevin's iPhone 11 Pro Max as paired:
  CoreDevice identifier `37711652-37E7-57D1-9C76-8E028428D01B`, hardware UDID
  `00008030-001E4D203A80802E`.

Evidence captured on the Mac:

- Native XCTest:
  `~/CodexWork/shotiq-evidence/xcode-contract-test-20260807-091549.log`
  ran `AnalysisResultContractTests` with `** TEST SUCCEEDED **` and
  `Executed 1 test, with 0 failures`.
- Device install:
  `~/CodexWork/shotiq-evidence/device-install-20260807-091929.log` regenerated
  the Xcode project, found App Store Connect credentials on the Mac, built with
  `** BUILD SUCCEEDED **`, and installed `com.baller70.shotiq` onto Kevin's
  iPhone.

Broker note: generic `scripts/kcloud-xcode-submit.sh test` is not the right
proof for `P0-001`. Run `31181372954` failed because the broker passed
`platform=iOS Simulator,name=iPhone 16 Pro`, which Xcode resolved as
`OS:latest` and did not match the available simulator. Run `31180499110` got
farther with a simulator id but ran the full scheme, including unrelated UI
tests; it failed `testSplashLeadsToWelcomeOrHome` in a signed-in/auth state.
For this contract gate, use the direct Mac checkout and focused
`-only-testing:ShotIQTests/AnalysisResultContractTests` command above.

### 2026-08-07 Laptop Mirror Setup

Mirrored from the Mac mini to this laptop so ShotIQ native work can run away
from the desktop/Mac mini:

- App Store Connect env: `~/.shotiq/asc.env`.
- App Store Connect private key: `~/.private_keys/AuthKey_<key-id>.p8`.
- Apple tool key copy: `~/.appstoreconnect/private_keys/AuthKey_<key-id>.p8`.
- Provisioning profiles:
  `~/Library/Developer/Xcode/UserData/Provisioning Profiles`.
- Xcode mirror: `/Volumes/TBF SKILLZ.INC/xcode-archive/Xcode.app`.
- XcodeGen mirror: `~/.local/bin/xcodegen`.
- Repo helper: `scripts/shotiq-xcode-env.sh`.

Laptop doctor proof:

- Xcode mirror size: 12 GB.
- `DEVELOPER_DIR` resolves to
  `/Volumes/TBF SKILLZ.INC/xcode-archive/Xcode.app/Contents/Developer`.
- `xcodebuild -version`: Xcode 26.2 / build 17C52.
- App Store Connect env/key: set/readable.
- `xcodegen --version`: 2.46.0.
- Xcode license: accepted locally after Kevin entered the Mac admin password.
- iOS simulator runtime: iOS 26.3.1 / build 23D8133 installed locally.
- Local simulator: iPhone 17,
  `44811BE6-7BFE-424D-B677-FAE7442373F3`, booted for proof.

Laptop evidence captured:

- Debug simulator build:
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/local-xcode-build-20260807-102900.log`
  ran from `basketball-analysis/ios-native` after `xcodegen generate` and
  ended with `** BUILD SUCCEEDED **`.
- Focused native XCTest:
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/local-xcode-contract-test-20260807-102900.log`
  ran `ShotIQTests/AnalysisResultContractTests` on the local iPhone 17 simulator
  and ended with `** TEST SUCCEEDED **`, `Executed 1 test, with 0 failures`.

Laptop reproducibility fix: local proof exposed that `project.yml`, the
XcodeGen source of truth used by `scripts/install-on-device.sh`, was missing
build settings that only survived in the previously generated `.xcodeproj`.
`project.yml` now explicitly carries app product name, Swift version, Debug
testability/active-arch settings, launch-screen background, and unit/UI test
host/runpath settings so regenerating the project is safe on any machine.

### 2026-08-07 Native Analysis Result UI Handoff

First laptop functionality slice after local Xcode setup:

- Fixed `APIClient.latestAnalysis()` to accept the backend's real
  `analysisResult` field, while preserving the legacy `analysis` fallback.
- Added `AnalysisResultPresentation`, the native display model that formats the
  saved shared contract for screen 038. Measured fields render from the DTO;
  missing fields render as `--` / `UNAVAILABLE` instead of canonical constants.
- Updated photo upload/save flow so `/api/save-analysis`'s returned
  `analysisResult` is retained, passed into `AnalysisProcessingView`, and then
  rendered by `AnalysisResultOverviewView`.
- Blocked the normal no-photo production path from starting a fake analysis.
  The screenshot harness can still stage canonical placeholder screens through
  `UITestHooks`.
- Replaced screen 038's primary fake values (`82`, six fixed metrics, canned
  media, Klay match card) with either saved-contract values or explicit
  unavailable/pending states. Canonical demo values remain gated to UI-test
  launches only.

Evidence captured on the laptop:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-functionality-contract-test-rerun-20260807-111500.log`
  ran `ShotIQTests/AnalysisResultContractTests` on the local iPhone 17 simulator
  and ended with `** TEST SUCCEEDED **`, `Executed 3 tests, with 0 failures`.

### 2026-08-07 Native Video Picker Handoff

Second laptop functionality slice after local Xcode setup:

- Removed the screen 026 to 027 placeholder jump for selected videos.
  `VideoUploadView` now loads the picked `PhotosPickerItem` into a retained
  temporary video file before navigation.
- Added `PickedVideoClip`, which carries the selected clip URL, filename, byte
  size, duration, dimensions, and frame rate.
- Updated `VideoReviewView` so real selected clips render in `VideoPlayer`.
  Canonical placeholder media remains available only when no selected clip is
  supplied, which preserves staged pixel-capture screens without pretending the
  picker produced media.
- Replaced fixed video detail text with metadata derived from the picked clip.
- Moved laptop ShotIQ build products and evidence off the internal disk. Current
  laptop proof uses external DerivedData and evidence under
  `/Volumes/TBF SKILLZ.INC/CodexWork`.

Evidence captured on the laptop:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-video-clip-test-20260807-113500.log`
  ran `ShotIQTests/PickedVideoClipTests` on the local iPhone 17 simulator using
  external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-ios-video-20260807-113500`
  and ended with `** TEST SUCCEEDED **`, `Executed 1 test, with 0 failures`.

### 2026-08-07 Native Video Upload/Save Handoff

Third laptop functionality slice after local Xcode setup:

- Added native multipart video upload support in `APIClient` using the web
  `/api/media-uploads`, signed part, and complete routes.
- Added `VideoAnalysisJob` so screen 027 passes the selected clip and trim
  window into processing instead of dropping them.
- Updated screen 036 to process a video job by uploading the clip, completing
  storage, saving `/api/save-analysis` with the same `clientSessionId`, and
  routing to results only after the backend save succeeds.
- Updated screen 036 failure behavior so video upload/save errors go to the
  canonical analysis error screen instead of generating fake results.
- Updated result presentation and media rendering so saved `videoUrl` displays
  as video media in native results.

Evidence captured on the laptop:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-video-pipeline-test-20260807-120500.log`
  ran `ShotIQTests/AnalysisResultContractTests` and
  `ShotIQTests/PickedVideoClipTests` on the local iPhone 17 simulator using
  external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-ios-video-pipeline-20260807-120500`
  and ended with `** TEST SUCCEEDED **`, `Executed 5 tests, with 0 failures`.

### 2026-08-07 Native Video Pose Handoff

Fourth laptop functionality slice after local Xcode setup:

- Added `VideoPoseAnalyzer`, which samples frames inside the selected trim
  window with `AVAssetImageGenerator`.
- Reused the existing native `ShotIQPose.detect(in:)` Vision detector on each
  sampled frame instead of introducing another placeholder detector.
- Persisted per-frame keypoints and measured release/knee/shoulder/hip angles
  through the `bodyPositions` and `visionAnalysis` fields on `/api/save-analysis`.
- Persisted first-class measured fields when available: elbow angle, knee angle,
  shoulder angle, hip angle, knee minimum, form score, release score,
  consistency score, and overall score.
- Regenerated `ShotIQ.xcodeproj` from `project.yml` after adding the new Swift
  source file, preserving the reproducible XcodeGen path.

Evidence captured on the laptop:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-video-pose-test-rerun-20260807-122000.log`
  ran `ShotIQTests/AnalysisResultContractTests`,
  `ShotIQTests/PickedVideoClipTests`, and
  `ShotIQTests/VideoPoseAnalyzerTests` on the local iPhone 17 simulator using
  external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-ios-video-pose-20260807-122000`
  and ended with `** TEST SUCCEEDED **`, `Executed 7 tests, with 0 failures`.

### 2026-08-07 Native Simulator Smoke + Harness Handoff

Fifth laptop functionality slice after local Xcode setup:

- Added generated Info.plists for both native XCTest bundles in `project.yml`,
  then regenerated `ShotIQ.xcodeproj`, so signed simulator tests survive a clean
  XcodeGen project rebuild on this laptop.
- Added `-uiTestSignedOut` to clear stored auth tokens and launch the signed-out
  auth stack deterministically.
- Updated the UI smoke tests to use explicit launch arguments, current tab
  labels (`Capture`, `Train`, `Progress`, `Profile`, `Home`), current auth CTA
  text (`Sign in`), and the current discover catalog drill (`STACK & SHOOT`).
- Hardened the canonical click-test harness by relaunching between the new-player
  home CTA branches and retrying a found tap once before reporting a dead tap.
- Confirmed the native placeholder paths exist and route correctly: the new
  player `GET AI ANALYSIS` CTA opens `screen-ios-no-analysis-yet`, and `See
  capture guide` opens `screen-ios-capture-guide`.

Evidence captured on the laptop:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-unit-full-signed-20260807-132000.log`
  ran the full `ShotIQTests` target on the local iPhone 17 simulator using
  external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-ios-unit-full-signed-20260807-132000`
  and ended with `** TEST SUCCEEDED **`, `Executed 22 tests, with 0 failures`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-ui-targeted-retry-20260807-140000.log`
  reran `CanonicalScreenshotTests/test03HomeScreens`,
  `CanonicalScreenshotTests/test99Manifest`, and the then-current UI smoke tests
  after the canonical harness fix. The canonical home walk passed with 11
  captured screens and 0 click-test failures. Later stale smoke-label failures in
  that mixed run are superseded by the clean smoke log below.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-smoke-full-clean-20260807-145500.log`
  ran the full `ShotIQUITests/ShotIQUITests` smoke suite on the local iPhone 17
  simulator using external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-ios-smoke-full-clean-20260807-145500`
  and ended with `** TEST SUCCEEDED **`, `Executed 4 tests, with 0 failures`.

### 2026-08-07 Native Video Release/Wrist Contract Handoff

Sixth laptop functionality slice after local Xcode setup:

- Found and fixed a native/web measurement gap: native video pose analysis
  calculated elbow/knee/shoulder/hip but did not calculate or persist the web
  pipeline's release-from-vertical or wrist/forearm-elevation metrics.
- Added `releaseAngle(elbow:wrist:)` and `wristAngle(elbow:wrist:)` to the native
  analyzer using the same vector semantics as `src/services/poseDetection.ts`.
- Added `wristAngle` and `releaseAngle` to each sampled frame record, the
  release-frame summary, and the `/api/save-analysis` request body created by
  `AnalysisProcessingView`.
- Folded wrist and release-vector scores into the native video form score when
  those metrics are actually measured.
- Hardened the backend save-analysis test so the mocked persisted row returns
  real saved values, and the route proof now asserts `analysisResult` carries
  client session identity plus measured score/elbow/wrist/release provenance.

Evidence captured on the laptop:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/web-api-ios-contract-20260807-125456.log`
  ran `tests/api/saveAnalysis.test.ts`,
  `tests/api/analysisLatestResult.test.ts`, and
  `tests/api/mediaUploads.test.ts` with npm cache on the external volume and
  ended with `Test Files 3 passed`, `Tests 16 passed`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-unit-all-20260807-125112.log`
  ran the full `ShotIQTests` target on the local iPhone 17 simulator using
  external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-ios-unit-all-20260807-125112`
  and ended with `** TEST SUCCEEDED **`, `Executed 24 tests, with 0 failures`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-smoke-all-20260807-125235.log`
  ran the full `ShotIQUITests/ShotIQUITests` smoke suite on the local iPhone 17
  simulator using external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-ios-smoke-all-20260807-125235`
  and ended with `** TEST SUCCEEDED **`, `Executed 4 tests, with 0 failures`.

### 2026-08-07 Native Goals And Video Source Options Handoff

Seventh laptop functionality slice after local Xcode setup:

- Removed the production fake-goals fallback from `GoalsViewModel`. Production
  goals now load from `/api/goals`; empty or failing loads show empty/unavailable
  states instead of silently rendering sample progress as player data.
- Restored screen 026 from the medium `Choose video` box into a full-screen
  video source/options flow matching the older mobile app shape: Video library,
  Browse files, Record video, Upload queue, and View filming tips.
- Kept the placeholder-guide rule intact: guide imagery remains on the upload
  screen, while newly selected/imported video replaces the placeholder only in
  the active review/result flow.
- Added Files import for local videos. Imported files go through the same
  retained temporary URL, metadata extraction, review, trim, analysis, and save
  pipeline as Photos-picked videos.

Evidence captured on the laptop, all external-drive backed:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-unit-goals-no-sample-fallback-20260807-145206.log`
  ran
  `ShotIQTests/GoalsViewModelTests/testProductionGoalsDoNotStartWithSampleProgress`
  on the local iPhone 17 Pro simulator using external DerivedData and ended
  with `** TEST SUCCEEDED **`, `Executed 1 test, with 0 failures`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-ui-video-upload-options-20260807-150307.log`
  ran
  `ShotIQUITests/ShotIQUITests/testVideoUploadShowsFullScreenSourceOptions`
  on the local iPhone 17 Pro simulator using external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-ios-ui-video-upload-options-20260807-150307`
  and result bundle
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-ui-video-upload-options-20260807-150307.xcresult`.
  It opened Capture, tapped Upload video, reached `screen-ios-video-upload`,
  verified the full-screen source options, verified `Choose video` is absent,
  and ended with `** TEST SUCCEEDED **`, `Executed 1 test, with 0 failures`.

### 2026-08-07 Native User Screenshot Follow-Up

Eighth laptop functionality slice after local Xcode setup:

- Rechecked the screens the user flagged from phone screenshots against a clean
  local simulator build. The current branch already had the Training, Goals,
  My Media, and saved-drill placeholder fallbacks, but Analysis History still
  had one real gap: the top `Catch & Shoot` session did not have an explicit
  canonical basketball thumbnail.
- Added a `Catch & Shoot` image mapping in `AnalyticsCardsView` so filtering
  or sorting keeps every analysis-session card paired with real basketball
  imagery instead of falling back to a gray tile.
- Hardened the canonical screenshot harness reset path. SwiftUI keeps each
  tab's `NavigationStack` alive, so the harness now relaunches between route
  branches and prefers the actual tab-bar button before falling back to a
  normal button lookup. This removes false "missing control" reports caused by
  stale pushed screens or ambiguous Home-page buttons.
- Reconfirmed the restored screen 026 behavior visually and with assertions:
  Upload video is a full-screen source/options page, not the old medium
  `Choose video` box, and it exposes Video library, Browse files, Record video,
  Upload queue, View filming tips, plus the framing guide.
- Kept the placeholder-guide rule intact: guide imagery remains available by
  default, while selected/imported media replaces the guide only in active
  review/result contexts.

Evidence captured on the laptop, all external-drive backed:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-user-screens-clickwalk-20260807-151236.log`
  ran
  `CanonicalScreenshotTests/test06TrainingScreens` and
  `CanonicalScreenshotTests/test07ProgressAndProfileScreens` on the local
  iPhone 17 Pro simulator using external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-ios-user-screens-20260807-151236`
  and result bundle
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-user-screens-clickwalk-20260807-151236.xcresult`.
  It ended with `** TEST SUCCEEDED **`, `Executed 2 tests, with 0 failures`.
- Exported screenshot proof:
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-user-screens-clickwalk-20260807-151236-attachments-v2`
  and contact sheet
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/ios-user-screens-clickwalk-20260807-151236-contact.png`.
  Visual check showed real basketball imagery on the user-flagged Training,
  Analytics Cards, My Media, Goals, Goal Detail, and player/profile screens.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/capture-canonical-20260807-152227.log`
  ran `CanonicalScreenshotTests/test04CaptureScreens` on the local iPhone 17
  Pro simulator using external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-capture-canonical-20260807-152227`
  and result bundle
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/capture-canonical-20260807-152227.xcresult`.
  It captured `003-video-upload` and the rest of the Capture route through
  queue, processing, and results, ending with `** TEST SUCCEEDED **`,
  `Executed 1 test, with 0 failures`.
- Exported capture screenshot proof:
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/capture-canonical-20260807-152227-attachments`
  and contact sheet
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/capture-canonical-20260807-152227-contact.png`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/video-upload-smoke-20260807-152731.log`
  ran
  `ShotIQUITests/ShotIQUITests/testVideoUploadShowsFullScreenSourceOptions`
  on the local iPhone 17 Pro simulator using external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-video-upload-smoke-20260807-152731`
  and result bundle
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/video-upload-smoke-20260807-152731.xcresult`.
  It verified `VIDEO SOURCE`, `Video library`, `Browse files`, `Record video`,
  `Upload queue`, `View filming tips`, verified `Choose video` is absent, and
  ended with `** TEST SUCCEEDED **`, `Executed 1 test, with 0 failures`.

### 2026-08-07 Native Device Install Diagnostic Handoff

Ninth laptop functionality slice after local Xcode setup:

- Improved `scripts/install-on-device.sh` so a missing phone no longer stops at
  the vague `no paired iPhone` message. The script now prints a device
  visibility diagnostic before failing.
- The diagnostic distinguishes the layers that matter for Kevin's laptop:
  macOS USB visibility, `devicectl`, `xctrace`, and `xcdevice`.
- This keeps the real-device proof honest. If macOS USB does not show an
  iPhone/iPad/Apple Mobile device, the blocker is below Xcode and the app
  cannot be installed from this laptop until the phone appears in Finder/Xcode.
- The installer still defaults device build output to the external drive:
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-device`.

Evidence captured on the laptop:

- `bash -n scripts/install-on-device.sh` passed.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/device-install-diagnostics-20260807-153238.log`
  ran the device installer with the local Xcode environment. It reported:
  macOS USB does not show an iPhone/iPad/Apple Mobile device, `devicectl`
  reports `No devices found`, `xctrace` lists only Kevin's MacBook Air plus
  simulators, `xcdevice` lists only `My Mac` as a physical device, and the
  installer exited with `INSTALL_STATUS=1`.

### 2026-08-07 Desktop Bridge Device Install

After the phone was connected to the Mac desktop, the GitHub Xcode broker
installed the current ShotIQ branch on Kevin's iPhone:

- Target repo/ref: `baller70/BasketballAnalysisAssessmentApp` /
  `claude/shotiq-production-build-txi5pl`.
- Installed commit: `b15e2b7` (`Use host external DerivedData for ShotIQ device
  installs`), which includes the approved native icon/capture work from
  `0ddb540`.
- Broker run: `31228342427` completed with conclusion `success`.
- Device: Kevin's iPhone, hardware UDID `00008030-001E4D203A80802E`.
- The first desktop bridge attempt, run `31228245377`, proved the old installer
  default was wrong for mirrored hosts: it tried to write DerivedData to the
  laptop-only `/Volumes/TBF SKILLZ.INC/...` path and failed on permissions.
- `scripts/install-on-device.sh` now chooses a writable external DerivedData
  location per host. On the desktop bridge, the successful build used
  `/Volumes/APPLICATIONS/06_XCODE_TESTING/kcloud-runner-jobs/DerivedData/shotiq-device`.

Evidence captured:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/icon-redesign-20260807-build/desktop-device-install-31228342427.log`
  contains `KCLOUD_XCODE_REF=claude/shotiq-production-build-txi5pl`,
  `** BUILD SUCCEEDED **`, `ShotIQ is on the phone.`, and
  `KCLOUD_XCODE_READY: device install`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/icon-redesign-20260807-build/desktop-device-install-31228342427-artifacts-v2/xcode-evidence-31228342427/`
  contains the uploaded broker artifact files: `summary.txt`,
  `target-head.txt`, `device-install.log`, `xcode-version.txt`, and
  `macos-version.txt`.

### 2026-08-07 Analytics, Pose Feedback, and Upload Progress Proof

Tenth laptop functionality slice after local Xcode setup:

- Added explicit pose-detection result states so the app distinguishes a real
  no-shooter/no-pose result from Apple Vision being unavailable on the current
  simulator/device.
- Updated captured-photo and upload-quality UI to give honest customer
  feedback: real detected pose, no shooter detected, or `Pose detector
  unavailable on this simulator/device.` instead of silently showing a generic
  failed check.
- Preserved the placeholder-guide contract: placeholders remain guides by
  default, selected sample media replaces the guide during review/check flows,
  and the guide screen remains available afterward.
- Added UI coverage for the customer-facing progress/toast path, upload queue,
  shot phases, joint overlay controls, angle toggle, metric detail notes, flaw
  tags, good/bad/improvement coaching, and recommended drill detail.

Evidence captured on the laptop, all external-drive backed:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/sample-pose-unit-20260807-170322.log`
  ran the bundled sample-media pose unit test with external DerivedData and
  result bundle
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/sample-pose-unit-20260807-170322.xcresult`.
  The test passed with one expected skip because this simulator's Vision stack
  is missing `cnn_human_pose.espresso.weights`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/focused-ui-20260807-171448.log`
  ran four focused UI tests on the local iPhone 17 Pro simulator using external
  DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-focused-ui-20260807-171448`
  and result bundle
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/focused-ui-20260807-171448.xcresult`.
  It ended with `** TEST SUCCEEDED **`, `Executed 4 tests, with 0 failures`.
- The focused UI pass verified:
  `testSamplePhotoRunsPoseQualityAndProcessingFeedback`,
  `testAnalysisBreakdownShowsPhaseSequenceAndJointControls`,
  `testAnalysisCoachingNotesMetricDetailsAndFlawTagsWork`, and
  `testUploadQueueShowsStepByStepProgressToResults`.
  The sample-photo path hit the honest simulator-unavailable branch, then still
  showed toast/progress feedback and completed to the analysis overview.

### 2026-08-07 Native Placeholder Replacement Proof

Eleventh laptop functionality slice after local Xcode setup:

- Treated every placeholder as a feature contract: guides may remain in their
  default state, but the matching feature must be able to replace the guide
  with real selected, local, uploaded, or generated media when that content
  exists.
- Added direct resolver coverage for training/media thumbnails so legacy nil
  placeholder inputs resolve to bundled basketball imagery instead of the old
  gray icon box.
- Added direct resolver coverage for analysis result media so real photo/video
  URLs win before canonical guide media, while the canonical demo remains the
  only path that intentionally falls back to canonical guide imagery.
- Re-ran the customer-facing UI proof that selected sample media replaces the
  guide in photo review/upload quality, shows progress/toast feedback, and
  advances to analysis; also re-ran the no-media proof so empty photo/video
  placeholders block with clear customer feedback instead of silently
  progressing.

Evidence captured on the laptop, all external-drive backed:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/placeholder-replacement-unit-20260807-180734/xcodebuild-placeholder-replacement.log`
  ran
  `ShotIQTests/PlaceholderReplacementTests`
  on the local iPhone 17 Pro simulator using external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-placeholder-replacement-unit-20260807-180734`
  and result bundle
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/placeholder-replacement-unit-20260807-180734/PlaceholderReplacementTests.xcresult`.
  It ended with `** TEST SUCCEEDED **`, `Executed 4 tests, with 0 failures`.
- The unit pass verified:
  `testPhotoThumbnailPlaceholderFallbacksResolveToBundledMedia`,
  `testAnalysisMediaSurfaceUsesRealLocalPhotoBeforeCanonicalFallback`,
  `testAnalysisMediaSurfaceUsesRealVideoBeforeCanonicalFallback`, and
  `testCanonicalAndEmptyAnalysisMediaResolveToDifferentPlaceholderModes`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/placeholder-replacement-ui-20260807-180835/xcodebuild-placeholder-replacement-ui.log`
  ran
  `testSamplePhotoRunsPoseQualityAndProcessingFeedback` and
  `testCaptureNoMediaShowsCustomerFeedback`
  on the local iPhone 17 Pro simulator using external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-placeholder-replacement-ui-20260807-180835`
  and result bundle
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/placeholder-replacement-ui-20260807-180835/PlaceholderReplacementUITests.xcresult`.
  It ended with `** TEST SUCCEEDED **`, `Executed 2 tests, with 0 failures`.
- The UI log verifies `IMG_4521.JPG`, `Photo • ready to analyze`,
  `Choose a photo first`, `Choose a video first`, upload/progress steps, and
  the honest simulator branch `Pose detector unavailable on this simulator/device.`.
- Remaining simulator limitation: this does not prove live camera pixels
  replacing `LiveViewfinder`, the Apple Photos picker UI, or system share sheets
  because those require real device/system-app interaction. Those placeholders
  are now called out as real-device proof items rather than treated as complete
  simulator proof.

### 2026-08-07 Analytics, Media, Profile, Goals Surface Proof

Twelfth laptop functionality slice after local Xcode setup:

- Added staged UI entry points for the long-scroll surfaces that need direct
  page-by-page proof: analytics cards, detailed analytics, profile, player
  card, customize player card, my media, media detail, goals, and goal detail.
- Added a focused UI proof that walks those screens and verifies the visible
  analytics, image-backed/thumbnail-backed surfaces, placeholder-replacement
  controls, and customer-facing feedback where the UI exposes it.
- Verified customize-card generation opens the saved-card feedback/sheet,
  My Media filtering/select mode works, Media Detail shows play and frame
  selection toast feedback, Media Detail opens the linked analysis result, Goals
  exposes active progress/make/form analytics, and Goal Detail exposes progress,
  technique snapshot, linked sessions, and recommended drills.
- The playback speed control is tapped in the proof, but its toast is not used
  as a blocking assertion because XCUITest does not reliably expose the transient
  label after that exact control tap in the current simulator hierarchy.

Evidence captured on the laptop, all external-drive backed:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/full-placeholder-analytics-ui-20260807-184558/xcodebuild-full-placeholder-analytics-ui.log`
  ran
  `ShotIQUITests/ShotIQUITests/testProgressProfileMediaGoalAnalyticsAndImageSurfacesWork`
  on the local iPhone 17 Pro simulator using external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-full-placeholder-analytics-ui-20260807-184558`
  and result bundle
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/full-placeholder-analytics-ui-20260807-184558/FullPlaceholderAnalyticsUITest.xcresult`.
  It ended with `** TEST SUCCEEDED **`, `Executed 1 test, with 0 failures`.
- The pass verified:
  `AI ANALYSIS HISTORY`, trend/session cards, detailed analytics phase and arc
  values, profile/player-card stats, generated-card save feedback, media tabs,
  media select mode, media play/frame feedback, linked analysis navigation,
  goals progress values, and goal-detail progress/technique/session/drill
  sections.
- Remaining simulator limitation: this does not prove backend aggregation,
  web/iOS value parity, live camera pixels replacing `LiveViewfinder`, Apple
  Photos picker UI, system share sheets, or final real-device install. Those
  still require real device/system/backend proof before the corresponding
  ledger items can move to `DONE`.

### 2026-08-07 Multi-View Photo Intake Proof

Thirteenth laptop functionality slice after local Xcode setup:

- Replaced the generic one-photo intake copy with explicit customer input
  slots for `FRONT VIEW`, `SIDE VIEW`, and `REAR VIEW`.
- Each slot now keeps its canonical guide image until a real/sample image is
  selected, then shows a ready state for that exact viewpoint. If the customer
  tries to continue early, the app shows a toast naming the missing viewpoints.
- When the review route closes back to the source screen, the selected
  viewpoint images are cleared so the front/side/rear guide placeholders return
  for the next capture attempt.
- The review, quality-check, upload, vision-analysis, local-cache, and
  save-analysis paths now carry the selected `ShotViewpoint` forward. Native
  multipart uploads include the repo/backend vocabulary already present in the
  web app and Prisma schema: `angle`/`shootingAngle` plus `imageCategory`
  (`form_front`, `form_side`, `form_rear`).
- Stabilized the live-capture UI proof at the `CAPTURE READY` step by waiting
  for the recording screen before tapping `Start recording`; the previous broad
  run failed on automation timing, not a missing product route.

Evidence captured on the laptop, all external-drive backed:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/multiview-photo-upload-20260807-191508/xcodebuild-multiview-photo-upload.log`
  ran
  `ShotIQUITests/ShotIQUITests/testPhotoUploadRequiresFrontSideRearViewsAndCarriesAngleToAnalysis`
  on the local iPhone 17 Pro simulator using external DerivedData
  `/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-multiview-photo-upload-20260807-191508`
  and result bundle
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/multiview-photo-upload-20260807-191508/MultiViewPhotoUpload.xcresult`.
  It ended with `** TEST SUCCEEDED **`, `Executed 1 test, with 0 failures`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/capture-multiview-regression-20260807-191725/xcodebuild-capture-multiview-regression.log`
  ran four focused regression tests:
  `testPhotoUploadRequiresFrontSideRearViewsAndCarriesAngleToAnalysis`,
  `testCaptureNoMediaShowsCustomerFeedback`,
  `testSamplePhotoRunsPoseQualityAndProcessingFeedback`, and
  `testLiveCaptureCalibrationEndRoundAndConfirmMakeWorks`.
  It ended with `** TEST SUCCEEDED **`, `Executed 4 tests, with 0 failures`,
  using result bundle
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/capture-multiview-regression-20260807-191725/CaptureMultiViewRegression.xcresult`.
- The pass verified: front/side/rear slot labels, missing-input toast,
  sample-media replacement of guide images, side-view review text, side-view
  quality text, no-media blocking toasts, sample photo pose/processing path,
  and live capture calibration through confirm-make/capture-review.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/multiview-photo-upload-reset-20260807-192230/xcodebuild-multiview-photo-upload-reset.log`
  reran the multi-view source proof after adding the return-to-guide reset. It
  ended with `** TEST SUCCEEDED **`, `Executed 1 test, with 0 failures`, using
  result bundle
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-evidence/multiview-photo-upload-reset-20260807-192230/MultiViewPhotoUploadReset.xcresult`.
- Remaining simulator limitation: this proves the native UI route, simulator
  sample-media replacement, toast/progress feedback, and request metadata
  wiring. It does not prove the Apple Photos picker UI with a real library
  image, real camera capture on Kevin's iPhone, or backend multi-image
  aggregation that evaluates all three uploaded angles together.

### 2026-08-08 Full iOS Regression And Image Surface Proof

Fourteenth laptop functionality slice after local Xcode setup:

- Filled remaining no-image iOS surfaces in the auth/onboarding/profile setup
  path with app-relevant basketball/profile imagery instead of empty art:
  onboarding intro, physical profile, player bio, and reset password now show
  canonical visual surfaces that match the purpose of each page.
- Added a deterministic `analyze-hub` UI-test stage so the 72-screen canonical
  walk can land on the actual analyze hub instead of inheriting a stale tab root
  from a prior test. This fixes a test-harness issue, not a product workaround.
- Re-ran the full iOS UI regression on the external-drive Xcode/DerivedData
  setup. The pass covered the 72 canonical pages plus feature proofs for upload
  image, full-screen video upload options, media detail, live setup, hoop
  calibration, readiness, capture ready, live recording, live feedback, end
  round, confirm make, capture review, upload queue, processing, analysis result,
  shot breakdown, joints/annotations, coaching notes, flaw details/tags,
  make/miss actions, no-media toasts, progress/profile/media/goals, and
  screenshot/export surfaces.
- Exported 75 screenshot attachments and built contact sheets for visual review.
  The sampled sheets confirmed the newly filled image surfaces render with real
  app imagery and the dense capture/analysis/profile states are not blank.

Evidence captured on the laptop, all external-drive backed:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-Capture-Harness-2026-08-08.xcresult`
  ran
  `ShotIQUITests/CanonicalScreenshotTests/test04CaptureScreens`
  after the analyze-hub test-stage fix. It ended with `** TEST SUCCEEDED **`,
  `Executed 1 test, with 0 failures`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-UITests-2026-08-08-post-image-surfaces-v2.xcresult`
  ran the complete `ShotIQUITests` target on the local iPhone 17 Pro simulator.
  The `xcresulttool` summary reports `Passed`, `totalTestCount: 23`,
  `passedTests: 23`, `failedTests: 0`, and `skippedTests: 0`.
- The canonical screenshot walk inside that pass produced 75 PNG attachments
  covering the 72-page map plus extra terminal/error/review states. Named
  exports are in
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-UITests-2026-08-08-post-image-surfaces-v2-attachments-named-export2`.
- Contact sheets for manual visual QA are in
  `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-UITests-2026-08-08-post-image-surfaces-v2-contact-sheets`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-UnitTests-2026-08-08-post-image-surfaces.xcresult`
  ran the native unit suite. The summary reports `totalTestCount: 40`,
  `passedTests: 39`, `failedTests: 0`, and `skippedTests: 1`.
- The skipped unit is
  `PoseDetectionTests/testBundledSampleMediaProvidesDrawablePose`; the skip
  reason is the same simulator limitation observed in the UI proof:
  `Pose detector unavailable on this simulator/device.` The simulator is missing
  Apple's `cnn_human_pose.espresso.weights`, so it cannot be used as final proof
  that real-device Vision draws the full body wireframe/nodes. That remaining
  item must be proven on Kevin's physical iPhone before the App Store claim.

### 2026-08-08 72-Page Coverage Matrix And Device Visibility Check

Follow-up audit after the full UI regression:

- Created
  `basketball-analysis/docs/shotiq/IOS-72-PAGE-COVERAGE-MATRIX-2026-08-08.md`
  as the current source-of-truth matrix for the 72 canonical iOS pages.
- Verified the canonical iOS map has 72 entries and the matrix has 72 rows.
- Verified the 2026-08-08 screenshot export covers all 72 canonical iOS pages
  by slug, not by attachment order. Attachment numbering is run order; slug
  matching is the correct proof key.
- The export also contains extra non-map iOS states `capture-guide` and
  `points-system`, plus a second routed `drill-detail` capture.
- Checked physical-device visibility before attempting real iPhone proof:
  `devicectl` reported `No devices found`, `xctrace list devices` listed only
  Kevin's MacBook Air and simulators, USB showed only the SanDisk external
  drive, and both Thunderbolt/USB4 receptacles reported `No device connected`.

Result: simulator page/screenshot proof is complete for the 72-page map, but
the real-device Vision/camera/system-picker/share-sheet proof remains open
until macOS/Xcode can see Kevin's physical iPhone.

### 2026-08-08 Secondary Controls And No-Image Surface Follow-Up

Fifteenth laptop functionality slice after local Xcode setup:

- Added direct test-stage entries for `create-goal`, `settings-hub`, and
  `share-results` so secondary controls can be tested from a clean production
  app launch instead of being inferred from screenshots.
- Converted the Settings Hub Edit profile action from a sheet-only control into
  a route-backed profile edit view with stable accessibility IDs. The test now
  proves the route opens and the save-profile surface is reachable.
- Fixed Media Detail action hit targets by making decorative card/button border
  overlays non-hit-testing, and by adding stable accessibility IDs for Download,
  top Delete, and destructive Delete media.
- Made sample-media delete feedback immediate: when a staged/demo media detail
  has no `analysisId`, the app now tells the customer `Sample media only`
  instead of showing fake async deletion progress.
- Delayed the Media Detail download alert until after the toast is visible, so
  the customer sees clear feedback before the system-style unavailable dialog.
- Added a real capture-example image to the non-map `capture-guide` helper
  screen. A static Swift screen-body audit now reports `NO_VISUAL_COUNT=0`
  across the iOS screen files, meaning the 72 canonical pages plus extra staged
  helper states have a photo/media surface, pose/frame visual, or approved
  raster icon surface rather than a blank text-only placeholder.

Evidence captured on the laptop, all external-drive backed:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-SecondaryControls-2026-08-08-v20.xcresult`
  ran
  `ShotIQUITests/ShotIQUITests/testSecondaryControlsShowFeedbackAndDialogs`
  on the iPhone 17 Pro simulator. The `xcresulttool` summary reports `Passed`,
  `totalTestCount: 1`, `passedTests: 1`, `failedTests: 0`, and
  `skippedTests: 0`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-Capture-Harness-2026-08-08-v2.xcresult`
  reran
  `ShotIQUITests/CanonicalScreenshotTests/test04CaptureScreens`
  after the capture-guide visual fill. The `xcresulttool` summary reports
  `Passed`, `totalTestCount: 1`, `passedTests: 1`, `failedTests: 0`, and
  `skippedTests: 0`.
- That focused test verifies Create Goal category/type/unit controls, target
  selection dialog, `Target linked` toast, and Learn how route; Goal Detail log
  progress/edit goal sheets and drill route; Settings Hub edit-profile route,
  Automation/Data privacy expanders, toggles, and About alert; Share Results
  Copy feedback plus share/save controls; and Media Detail download toast/alert,
  delete-confirmation toast, and sample-delete toast.

Remaining limitations: this is still simulator proof. Real iPhone proof remains
required for Apple media pickers, camera permission/capture, Vision pose
wireframe output, iOS share sheets, and backend/web parity.

### 2026-08-08 Onboarding Profile Controls Proof

Sixteenth laptop functionality slice after local Xcode setup:

- Added stable accessibility identifiers to the four Physical Profile
  measurement rows so tests can tap the correct stepper/unit control instead of
  accidentally hitting the first generic plus/minus image on the page.
- Proved the onboarding state carries forward screen-by-screen: Physical
  Profile updates age, height, weight, and wingspan values; Experience & Body
  Type stores Beginner and Slim / Lean; Shooting Profile stores Left-handed,
  Developing, and Compact; Onboarding Review shows the selected values.
- Proved customer feedback on Player Bio's AI helper when the bio is too short:
  tapping Enhance bio without enough text shows the validation message instead
  of silently doing nothing.
- Proved the review Coaching Focus expander opens, the offline profile-save
  failure exposes `Continue without saving`, and the Not now path moves through
  camera, photo-library, and notification primers before returning to a real
  home root.
- Fixed the test harness final assertion to accept the actual home root the app
  can show after onboarding (`new-player`, `standard`, or `professional`)
  instead of assuming every demo-data launch lands on `home-standard`.

Evidence captured on the laptop, all external-drive backed:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-OnboardingControls-2026-08-08-v6.xcresult`
  ran
  `ShotIQUITests/ShotIQUITests/testOnboardingProfileControlsCarryForwardAndPermissionSkipsWork`
  on the iPhone 17 Pro simulator. The run ended with `** TEST SUCCEEDED **`,
  `Executed 1 test, with 0 failures`.

Remaining limitations: this proof uses simulator paths and offline save fallback.
Real backend profile save, real AI bio enhancement success, and real iOS system
permission alerts still need physical-device/backend proof before onboarding can
be marked `DONE`.

### 2026-08-08 Upload Quality Pre-Analysis Header Proof

Seventeenth laptop functionality slice after local Xcode setup:

- Replaced the Upload Quality Check header's fixed pre-analysis values
  (`82` form score, `24` shots, `15` makes, `62.5%` accuracy, and the fixed
  primary target) with source-safe context that does not pretend the selected
  image has already been scored.
- The header now shows whether a photo is ready, which viewpoint is being
  checked, the pose-check status, and that the score/target are produced after
  analysis.
- Extended the sample-photo upload quality UI proof so it asserts the new
  READY/SIDE/AFTER/TARGET AFTER ANALYSIS copy and fails if the old measured
  values or target copy reappear before analysis.

Evidence captured on the laptop, all external-drive backed:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-UploadQualityPreAnalysis-2026-08-08-v1.xcresult`
  ran
  `ShotIQUITests/ShotIQUITests/testSamplePhotoRunsPoseQualityAndProcessingFeedback`
  on the iPhone 17 Pro simulator. The run ended with `** TEST SUCCEEDED **`,
  `Executed 1 test, with 0 failures`.

Remaining limitations: this clears the misleading pre-analysis header values on
screen 024. Real iPhone Vision/backend/web parity proof remains open.

### 2026-08-08 Upload Quality Measured Lighting And Resolution Proof

Eighteenth laptop functionality slice after local Xcode setup:

- Added `ShotIQPhotoQuality` so selected still images produce upload-quality
  rows from the actual image pixels instead of reusing canonical placeholder
  text.
- Lighting now reports Good, Too dark, or Too bright from average luminance.
- Resolution now reports `Image resolution` with the selected image's pixel
  dimensions and marks low-resolution images as Low instead of showing the old
  video-specific `1080p` value.
- Extended the sample-photo upload-quality UI proof so screen 024 must show
  `Image resolution` and pixel detail, and must not show `Video resolution` or
  `1080p` for a still image.

Evidence captured on the laptop, all external-drive backed:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-PhotoQuality-Unit-2026-08-08-v2.xcresult`
  ran `ShotIQTests/PhotoQualityTests` on the iPhone 17 Pro simulator. The run
  ended with `** TEST SUCCEEDED **`, `Executed 3 tests, with 0 failures`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-UploadQualityMeasuredRows-2026-08-08-v2.xcresult`
  ran
  `ShotIQUITests/ShotIQUITests/testSamplePhotoRunsPoseQualityAndProcessingFeedback`
  on the iPhone 17 Pro simulator. The run ended with `** TEST SUCCEEDED **`,
  `Executed 1 test, with 0 failures`.

Remaining limitations: this proves selected still-image quality rows on
simulator using synthetic and bundled sample images. Real low-light,
low-resolution, and physical iPhone selected-media proof remains open before
G011 can move from `VERIFYING` to `DONE`.

### 2026-08-08 Photo Review No Pre-Analysis Proof

Nineteenth laptop functionality slice after local Xcode setup:

- Extended the selected-photo capture flow proof at screen 023 so the crop
  screen itself must be free of measured-looking score/history/target values
  before the player has started analysis.
- The proof now checks that `82`, `24`, `15`, `62.5%`, `FORM SCORE`, `SHOTS`,
  `MAKES`, `ACCURACY`, and `Keep elbow stacked through release` are absent while
  the real crop frame and framing tip are visible.

Evidence captured on the laptop, all external-drive backed:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-PhotoReviewNoPreAnalysis-2026-08-08-v1.xcresult`
  ran
  `ShotIQUITests/ShotIQUITests/testSamplePhotoRunsPoseQualityAndProcessingFeedback`
  on the iPhone 17 Pro simulator. The run ended with `** TEST SUCCEEDED **`,
  `Executed 1 test, with 0 failures`.

Remaining limitations: this is simulator proof with a bundled selected-photo
fixture. Real Photos picker/crop gesture screenshots on a physical iPhone are
still required before G009 can move from `VERIFYING` to `DONE`.

### 2026-08-08 Photo Vision Score Provenance Proof

Twentieth laptop functionality slice after local Xcode setup:

- Removed the photo upload path's broad `A/B/C/D/F` to `95/85/75/65/50`
  conversion.
- Added a typed `ShotIQPhotoVisionAnalysis` contract: qualitative vision grades
  and coaching text are saved as `visionAnalysis`, while `overallScore` remains
  nil because the endpoint did not return a measured 0-100 score.
- Added unit proof that an `A` grade keeps `measuredOverallScore == nil`,
  preserves coaching notes, encodes `overallGrade`, and does not encode
  `overallScore`.

Evidence captured on the laptop, all external-drive backed:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-PhotoQuality-Unit-2026-08-08-v2.xcresult`
  ran `ShotIQTests/PhotoQualityTests` on the iPhone 17 Pro simulator. The run
  ended with `** TEST SUCCEEDED **`, `Executed 3 tests, with 0 failures`.

Remaining limitations: this proves the native save payload rule locally.
G013 still needs backend round-trip proof showing a real saved photo analysis
stores no numeric score unless the backend/client produced measured numeric
fields.

### 2026-08-08 Upload Queue Empty-State Proof

Twenty-first laptop functionality slice after local Xcode setup:

- Removed the fake seeded upload queue items from screen 025.
- Added a customer-facing empty state: `No media queued` plus guidance to add
  an image or video from the device.
- Changed `Analyze now` so it shows `Add media first` toast and stays on the
  queue when no real queued media exists.
- Updated focused UI proof to assert the old fake filenames are absent and
  analysis processing is not opened from an empty queue.

Evidence captured on the laptop, all external-drive backed:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-UploadQueueEmpty-2026-08-08-v2.xcresult`
  ran
  `ShotIQUITests/ShotIQUITests/testUploadQueueStartsEmptyAndBlocksAnalysisWithoutMedia`
  on the iPhone 17 Pro simulator. The run ended with `** TEST SUCCEEDED **`,
  `Executed 1 test, with 0 failures`.

Remaining limitations: this proves the honest empty queue and no-media guard.
Real Photos/Files picker queueing, upload status updates, reload persistence,
and web sync remain open before G015 can move from `VERIFYING` to `DONE`.

### 2026-08-08 Live Recording HUD State Proof

Twenty-second laptop functionality slice after local Xcode setup:

- Removed the fixed `24`, `15`, and `62.5%` shot/make/make-percent values from
  screen 032's visible and accessibility HUD.
- Added `LiveRecordingStats` as the local session-state source for shot count,
  make count, and make percentage.
- Added UI-test-only controls that simulate made and missed shot events under
  `UITestHooks.active`, so the production UI can be proved without shipping
  visible test buttons.
- Focused unit and UI proof now assert the live HUD starts at `0 / 0 / --` and
  updates to `2 / 1 / 50.0%` after one made and one missed session event.

Evidence captured on the laptop, all external-drive backed:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-LiveRecordingStats-Unit-2026-08-08-v1.xcresult`
  ran `ShotIQTests/LiveRecordingStatsTests` on the iPhone 17 Pro simulator. The
  run ended with `** TEST SUCCEEDED **`, `Executed 1 test, with 0 failures`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-LiveRecordingHud-2026-08-08-v1.xcresult`
  ran
  `ShotIQUITests/ShotIQUITests/testLiveRecordingHudStartsAtZeroAndUpdatesFromSessionEvents`
  on the iPhone 17 Pro simulator. The run ended with `** TEST SUCCEEDED **`,
  `Executed 1 test, with 0 failures`.

Remaining limitations: this proves screen 032 no longer pretends a new live
recording already has previous shot totals. Real camera shot detection,
optical make/miss classification, backend session persistence, and web/iOS
history parity remain open before G024 can move from `VERIFYING` to `DONE`.

### 2026-08-08 Live Form Feedback Waiting-State Proof

Twenty-third laptop functionality slice after local Xcode setup:

- Added `LiveFormFeedbackState` as the single state source for screen 033's
  live form score, confidence, detected phase, and coaching cue.
- Removed the player-facing fixed `82`, `87%`, `Release`, and
  `Keep building consistency.` values from the live feedback card. The screen
  now starts as `--`, `Waiting`, and `Waiting for live pose.` until measured
  feedback exists.
- Added a UI-test-only simulated live feedback event under `UITestHooks.active`
  so the production screen can prove state updates without shipping a visible
  test control.
- Added a direct `live-form-feedback` UI-test stage so screen 033 can be tested
  from a clean app launch, instead of only through screen 032's Stop route.

Evidence captured on the laptop, all external-drive backed:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-LiveFormFeedbackState-Unit-2026-08-08-v1.xcresult`
  ran `ShotIQTests/LiveFormFeedbackStateTests` on the iPhone 17 Pro simulator.
  The run ended with `** TEST SUCCEEDED **`, `Executed 2 tests, with 0
  failures`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-LiveFormFeedback-2026-08-08-v2.xcresult`
  ran
  `ShotIQUITests/ShotIQUITests/testLiveFormFeedbackWaitsForMeasuredLivePoseBeforeShowingScores`
  on the iPhone 17 Pro simulator. The run ended with `** TEST SUCCEEDED **`,
  `Executed 1 test, with 0 failures`.

Remaining limitations: this proves screen 033 is not pretending demo numbers are
live AI output. It still needs Kevin's physical iPhone to prove the real live
pose stream supplies score, confidence, phase, and cue values from camera
frames before G025 can move from `VERIFYING` to `DONE`.

### 2026-08-08 Live Capture Review Summary Proof

Twenty-fourth laptop functionality slice after local Xcode setup:

- Added `LiveCaptureSessionSummary` as the session-state source for captured
  shot count, make count, miss count, review count, discarded count, make
  percentage, and practice time.
- Screen 034 now records the confirmed make/miss into that summary before
  opening screen 035.
- Screen 035 no longer starts from fixed `24`, `15`, and `62.5%` session
  values. It renders the summary it was given and starts review/discard counts
  from zero unless real events add them.
- The live capture UI proof now confirms one make opens Capture Review with
  `1` shot, `1` make, `100.0%` make rate, no flagged review rows, and no old
  `15` / `62.5%` totals.

Evidence captured on the laptop, all external-drive backed:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-LiveCaptureSessionSummary-Unit-2026-08-08-v1.xcresult`
  ran `ShotIQTests/LiveCaptureSessionSummaryTests` on the iPhone 17 Pro
  simulator. The run ended with `** TEST SUCCEEDED **`, `Executed 1 test, with
  0 failures`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-LiveCaptureReviewSummary-2026-08-08-v1.xcresult`
  ran
  `ShotIQUITests/ShotIQUITests/testLiveCaptureCalibrationEndRoundAndConfirmMakeWorks`
  on the iPhone 17 Pro simulator. The run ended with `** TEST SUCCEEDED **`,
  `Executed 1 test, with 0 failures`.

Remaining limitations: this proves the simulator make/miss confirmation path
does not land on fake review totals. Real detector-created shots, backend
session persistence, reload behavior, and web/iOS history parity remain before
G030 can move from `VERIFYING` to `DONE`.

### 2026-08-08 Analysis Overview Pose Surface Proof

Twenty-fifth laptop functionality slice after local Xcode setup:

- Added an optional saved pose payload to `ShotIQAnalysisResultDTO` so local
  Vision keypoints can travel with the same analysis result object used by
  screen 038.
- Local photo analysis now stores detected pose points when Vision returns
  them, and the `/api/save-analysis` merge keeps those local pose points when
  the backend returns metrics/media but no pose field.
- Screen 038 now renders local result images through `CapturedPoseImage`, so
  selected customer media uses the real-image pose surface instead of the
  canonical demo skeleton.
- `CapturedPoseImage` accepts an initial detected pose to avoid immediately
  discarding pose points that have already been measured upstream.

Evidence captured on the laptop, all external-drive backed:

- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-AnalysisOverviewPose-Unit-2026-08-08-v4.xcresult`
  ran
  `ShotIQTests/AnalysisResultContractTests/testLocalPhotoFallbackCarriesDetectedPoseIntoPresentation`
  on the iPhone 17 Pro simulator. The run ended with `** TEST SUCCEEDED **`,
  `Executed 1 test, with 0 failures`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-AnalysisResultContractTests-2026-08-08-v1.xcresult`
  ran all `ShotIQTests/AnalysisResultContractTests` on the iPhone 17 Pro
  simulator. The run ended with `** TEST SUCCEEDED **`, `Executed 9 tests,
  with 0 failures`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-AnalysisOverviewPose-UI-2026-08-08-v2.xcresult`
  ran
  `ShotIQUITests/ShotIQUITests/testSamplePhotoRunsPoseQualityAndProcessingFeedback`
  on the iPhone 17 Pro simulator. The run ended with `** TEST SUCCEEDED **`,
  `Executed 1 test, with 0 failures`.
- `/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-test-results/ShotIQ-BundledPose-Unit-2026-08-08-v1.xcresult`
  confirms this simulator cannot run Vision body-pose detection because Apple's
  `cnn_human_pose.espresso.weights` file is unavailable in the simulator
  runtime; the pose sample test is skipped for that hardware/runtime reason.

Remaining limitations: this proves screen 038 no longer falls back to the
canonical skeleton for a selected local photo, and proves the result model can
carry detected joints when available. It still needs Kevin's physical iPhone to
prove an actual Vision detection draws joints on the overview media, and the
backend/web shared contract still needs a server pose field before remote saved
analysis can replay joints without local media.
