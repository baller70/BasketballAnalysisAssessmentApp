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
| P0-002 | VERIFYING | `#media` `#control` `#backend` | Native video upload, review, trim, frame extraction, analysis, and save pipeline. | Pick a real video, review that exact clip, trim it, analyze only the trimmed range, save result, and reopen it. Selected-video review, trim propagation, multipart upload, save-analysis handoff, trimmed-frame pose sampling, measured angle/score persistence, server video rendering, and app-local selected-video fallback are implemented and simulator-tested; release and wrist parity fields are now included. Needs real selected-video device/backend/web proof before `DONE`. |
| P0-003 | VERIFYING | `#analytics` `#pose` `#media` | Native analysis/result screens consume saved analysis instead of constants. | Screen 038 now passes the saved `AnalysisResultPresentation` into the immediate result-detail branch, and screens 041, 044, and 045 render/share the saved score, measured release/height/elbow/wrist values, saved score breakdown, missing-score state, source coverage, weakest-score CTA, and app-local selected photo/video fallback instead of their old demo constants when server media URLs are absent. Still needs the remaining result/flaw/frame/detail screens, true confidence/trend/history fields, real pose frames, and real device/backend/web proof before `DONE`. |
| P0-004 | OPEN | `#device` `#pose` `#analytics` `#media` | Live camera measured feedback and shot detection. | On Kevin's iPhone, record a real shot and prove skeleton/following, shot detection, confidence, form score, context, and replay come from the recording. |
| P0-005 | OPEN | `#media` `#backend` `#web-sync` | Media library, media detail, and share/export use real uploaded/captured media. | Upload/capture media on iOS, see it in iOS library and web library, open detail, share the matching result. |
| P0-006 | OPEN | `#analytics` `#backend` | Home, profile, goals, training, analytics, points, and trends aggregate real history. | Seed or create backend history, reload iOS and web, verify totals/trends/points match expected calculations. |

## Cross-Cutting Items

| ID | Status | Priority | Tags | Screen(s) | Work Item | Proof Gate |
| --- | --- | --- | --- | --- | --- | --- |
| G001 | OPEN | P0 | `#path` `#demo` | staged screens | Stop using staged canonical renders as functionality proof. | Any cleared screen has a production-path test separate from `-uiTestStage`. |
| G002 | OPEN | P0 | `#analytics` `#demo` | all analytics screens | Replace or label fixed native analytics values. | Static sweep finds no player-facing unproven constants on cleared screens. |
| G003 | OPEN | P0 | `#backend` `#web-sync` | iOS/web | Make iOS and web share result semantics. | Same saved result renders same meaning on both platforms. |
| G004 | OPEN | P0 | `#backend` `#web-sync` | auth/data sync | Prove native write/read and web read/write with configured secrets. | Auth-chain test passes in staging/prod. |
| G005 | OPEN | P1 | `#demo` | app-wide | Label intentional sample states. | Any sample screen visibly says demo/example and cannot be mistaken for player data. |
| G006 | OPEN | P0 | `#analytics` | app-wide | Build analytics provenance matrix. | Every visible number on cleared screens has source, formula, and test. |

## Capture And Upload Items

| ID | Status | Priority | Tags | Screen(s) | Work Item | Proof Gate |
| --- | --- | --- | --- | --- | --- | --- |
| G007 | OPEN | P2 | `#path` `#media` | 022 | Clarify photo vs video upload paths. | User can choose correct media path and tests prove picker accepts intended types. |
| G008 | OPEN | P0 | `#control` `#media` `#device` | 023 | Prove and fix photo crop on real selected image. | Before/after real image screenshot shows crop changed pixels and persisted to next screen. |
| G009 | OPEN | P1 | `#analytics` `#demo` | 023 | Remove or source analysis context from pre-analysis crop screen. | No measured-looking analytics appear before analysis unless sourced from history or demo-labeled. |
| G010 | OPEN | P0 | `#analytics` `#pose` | 024 | Replace fixed header analytics on quality check. | Header values come from prior history or are hidden/demo-labeled before new analysis. |
| G011 | OPEN | P1 | `#analytics` `#media` | 024 | Measure or relabel lighting and resolution checks. | Bad lighting/low-res sample produces failed checks, or rows are not presented as measured. |
| G012 | OPEN | P0 | `#path` `#backend` | 024/036 | Block no-image route from pretending analysis started. | Continue without selected media cannot open analysis processing as a real analysis. |
| G013 | OPEN | P0 | `#analytics` `#backend` | 024 | Replace broad grade-to-score mapping with real metric contract. | Saved score is reproducible from measured analysis fields. |
| G014 | VERIFYING | P0 | `#backend` `#analytics` | 024 to 038 | Pass saved analysis into native result UI. | Save response now carries `analysisResult` from 024 through 036 into 038, and 038 renders score/media/metric values from `ShotIQAnalysisResultDTO`; focused laptop XCTest proves the presentation mapping. If the backend returns no remote image URL, the selected/cropped local photo is preserved and rendered in the result path. Still needs end-to-end device/web round-trip proof before `DONE`. |
| G015 | OPEN | P1 | `#media` `#backend` `#demo` | 025 | Replace fake upload queue with real queued media/persistence. | Queue starts empty or from backend, adding media creates real item and status updates. |
| G016 | VERIFYING | P0 | `#media` `#control` | 026 | Load selected video instead of only navigating. | `VideoUploadView` now loads the selected `PhotosPickerItem` into a retained temporary video URL before navigation; focused laptop XCTest confirms the retained clip model. Still needs real picker/device-media recording before `DONE`. |
| G017 | VERIFYING | P0 | `#media` `#demo` | 027 | Review actual selected clip, not canonical media. | `VideoReviewView` now renders `VideoPlayer` for the selected clip and keeps canonical media only for explicit fallback/staged paths. Still needs real picker/device-media recording before `DONE`. |
| G018 | VERIFYING | P1 | `#media` `#analytics` | 027 | Read real duration, size, orientation, and FPS. | `PickedVideoClip` reads duration, dimensions, file size, and FPS from the selected asset; focused laptop XCTest proves the metadata formatting. Still needs real selected file proof before `DONE`. |
| G019 | VERIFYING | P0 | `#control` `#media` | 027 | Make trim controls affect analysis input. | `VideoReviewView` now builds a `VideoAnalysisJob` with selected clip plus trim fractions, and tests prove trim seconds/duration are computed from the real clip. Still needs device recording proving the backend payload contains the selected trim before `DONE`. |
| G020 | VERIFYING | P0 | `#media` `#pose` `#analytics` `#backend` | 027 to 038 | Implement native video analysis/save path. | Native now samples frames inside the selected trim window, runs Vision pose detection, computes measured elbow/knee/wrist/shoulder/hip/release angles and scores when joints are found, uploads selected videos through `/api/media-uploads`, completes multipart storage, calls `/api/save-analysis` with the same `clientSessionId`, and renders saved `videoUrl` or app-local selected clip in result UI. Needs real selected-video device/backend/web proof before `DONE`. |

## Live Camera And Shot Detection Items

| ID | Status | Priority | Tags | Screen(s) | Work Item | Proof Gate |
| --- | --- | --- | --- | --- | --- | --- |
| G021 | OPEN | P1 | `#device` `#analytics` | 028 | Make setup checks measured or demo-labeled. | Body/framing/lighting/stability checks change with real camera conditions. |
| G022 | OPEN | P1 | `#device` `#backend` | 029 | Persist hoop calibration and use it in shot detection. | Changed hoop target changes downstream shot/arc calculation. |
| G023 | OPEN | P1 | `#device` `#analytics` | 030 | Make readiness percentage measured. | Readiness changes with camera/body/hoop conditions and has source formula. |
| G024 | OPEN | P0 | `#device` `#analytics` | 032 | Replace fixed live-recording HUD values. | HUD values are generated from live session state and update during recording. |
| G025 | OPEN | P0 | `#device` `#pose` `#analytics` `#demo` | 033 | Replace demo feedback with measured live feedback or mark feature demo. | Form score, confidence, detected phase, and cue update from live pose stream. |
| G026 | OPEN | P0 | `#device` `#pose` | 033 | Prove skeleton follows real player while shooting. | Screen recording shows joints follow player motion with logged pose frames. |
| G027 | OPEN | P0 | `#device` `#pose` `#analytics` | 034 | Trigger shot-detected from real detector, not navigation. | Real shot opens detection card; non-shot does not. |
| G028 | OPEN | P0 | `#device` `#pose` `#media` | 034 | Draw skeleton/release arc over recorded clip. | Replay shows measured overlay aligned to real body/ball frames. |
| G029 | OPEN | P1 | `#backend` `#analytics` | 034 | Tie make/miss confirmation to measured shot event. | Confirmed event stores detector metadata and updates history/web totals. |
| G030 | OPEN | P1 | `#analytics` `#backend` | 035 | Make capture review summarize real captured shots. | Capture review totals match recorded session events and saved analysis. |

## Analysis Result Items

| ID | Status | Priority | Tags | Screen(s) | Work Item | Proof Gate |
| --- | --- | --- | --- | --- | --- | --- |
| G031 | OPEN | P0 | `#path` `#backend` | 036 | Processing only appears for real analysis jobs. | No-media/video-placeholder paths cannot create a fake processing/result flow. |
| G032 | OPEN | P2 | `#path` | 037 | Prove real long-running analysis timeout. | Slow analysis job opens taking-longer state and later resolves correctly. |
| G033 | OPEN | P0 | `#analytics` | 038 | Replace hard-coded six key metrics. | Metrics match saved analysis values and update when saved result changes. |
| G034 | OPEN | P0 | `#pose` `#media` | 038 | Replace demo skeleton on overview with real pose. | Skeleton overlay uses saved pose points from current analysis. |
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
| G045 | OPEN | P1 | `#analytics` `#backend` | 054 | Training home recommendations from real history/goals. | Seeded weakness/goal changes recommended drill and progress stats. |
| G046 | OPEN | P1 | `#analytics` | 055 | Quick start values from current user data. | Different user history changes form score/session context. |
| G047 | OPEN | P2 | `#control` `#backend` | 056 | Prove drill catalog filters and saved drills. | Filter/save/drill selection persists and syncs. |
| G048 | OPEN | P1 | `#analytics` | 057 | Drill detail uses player weakness/goals. | Drill detail target changes from selected real flaw/goal. |
| G049 | OPEN | P1 | `#backend` `#demo` | 058 | Saved drill list from backend. | Save/remove drill changes list after reload and web sync if applicable. |
| G050 | OPEN | P1 | `#analytics` `#backend` | 059 | Calendar summaries from workouts/shot events. | Workout API seed changes calendar percentages/streaks. |
| G051 | OPEN | P1 | `#media` `#analytics` | 060 | Drill execution media/cue from drill plan or live input. | Chosen drill displays correct media/cue and measured/live data where claimed. |
| G052 | OPEN | P1 | `#analytics` `#demo` | 061 | Remove fixed shot-tracker baselines and phase rail. | New session starts from zero or real history; phase/correction values have source. |
| G053 | OPEN | P1 | `#analytics` `#backend` | 062 | Workout completion uses real points/form/phase result. | Completion values match workout events, points rules, and analysis output. |

## Goals, Analytics, Media, Profile Items

| ID | Status | Priority | Tags | Screen(s) | Work Item | Proof Gate |
| --- | --- | --- | --- | --- | --- | --- |
| G054 | OPEN | P1 | `#backend` `#demo` | 063 | Remove fake fallback goals or label them. | Empty backend does not silently show fake personal goals. |
| G055 | OPEN | P1 | `#analytics` | 063 | Goal cards use real sessions/form/make/trends. | Goal card numbers reproduce from backend history and goal progress. |
| G056 | OPEN | P1 | `#backend` `#analytics` | 064 | Created goals affect recommendations/analytics. | New goal changes goals list and downstream training/analytics surfaces. |
| G057 | OPEN | P1 | `#analytics` | 065 | Goal detail uses real linked sessions and technique snapshot. | Linked sessions/trends/angles match saved workout and analysis records. |
| G058 | OPEN | P0 | `#analytics` `#backend` | 066 | Analytics cards load real history. | API seed changes cards, trends, share values, and deltas exactly. |
| G059 | OPEN | P0 | `#analytics` `#backend` | 067 | Detailed analytics aggregate real history. | Range/filter changes recompute rows, confidence, trends, and phase values. |
| G060 | OPEN | P0 | `#media` `#backend` | 068 | Media library lists real uploaded/captured media. | Upload/capture appears in media library after reload. |
| G061 | OPEN | P0 | `#media` `#analytics` | 069 | Media detail opens selected real media and analysis. | Selecting item opens matching media and saved metrics. |
| G062 | OPEN | P1 | `#analytics` `#backend` | 070 | Profile analytics from backend. | Points/score/shots/makes/badges match API data. |
| G063 | OPEN | P2 | `#control` `#analytics` | 071 | Settings actions plus real analytics context. | Settings persist; any analytics displayed have provenance. |
| G064 | OPEN | P1 | `#control` `#media` `#analytics` | 072 | Share latest real result. | Shared/exported card/text matches selected saved analysis and media. |

## Home, Elite, Onboarding, Auth Items

| ID | Status | Priority | Tags | Screen(s) | Work Item | Proof Gate |
| --- | --- | --- | --- | --- | --- | --- |
| G065 | OPEN | P1 | `#path` `#backend` | 003-007 | Prove full auth, verify email, reset token journeys. | Real signup, verify, forgot password, reset, sign-in, sign-out flows pass. |
| G066 | OPEN | P2 | `#demo` `#analytics` | 008-016 | Remove or label pre-analysis analytics in onboarding/permissions. | New user sees no fake measured stats before first analysis. |
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
remote media URL, which prevents the immediate result and shot breakdown screens
from falling back to stock/canonical pictures after a real picker/crop flow.
Remaining proof before
`P0-002` can move to `DONE`: real selected-video device/backend proof and
web/iOS round trip.

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
