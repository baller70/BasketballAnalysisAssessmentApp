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
| P0-001 | OPEN | `#analytics` `#backend` `#web-sync` | Shared `AnalysisResult` contract for form score, confidence, release angle, elbow/wrist values, shot arc, phase scores, flaws, media, and timestamps. | Same test shot produces one saved result that native and web both render with matching values. |
| P0-002 | OPEN | `#media` `#control` `#backend` | Native video upload, review, trim, frame extraction, analysis, and save pipeline. | Pick a real video, review that exact clip, trim it, analyze only the trimmed range, save result, and reopen it. |
| P0-003 | OPEN | `#analytics` `#pose` `#media` | Native analysis/result screens consume saved analysis instead of constants. | Change the input media/result and prove all visible scores, angles, confidence, skeleton, phase, and flaws change correctly. |
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
| G014 | OPEN | P0 | `#backend` `#analytics` | 024 to 038 | Pass saved analysis into native result UI. | Saved still-photo analysis opens overview with matching saved values. |
| G015 | OPEN | P1 | `#media` `#backend` `#demo` | 025 | Replace fake upload queue with real queued media/persistence. | Queue starts empty or from backend, adding media creates real item and status updates. |
| G016 | OPEN | P0 | `#media` `#control` | 026 | Load selected video instead of only navigating. | Test confirms selected video URL/data is retained after picker. |
| G017 | OPEN | P0 | `#media` `#demo` | 027 | Review actual selected clip, not canonical media. | Video review displays the selected clip and fails if no clip exists. |
| G018 | OPEN | P1 | `#media` `#analytics` | 027 | Read real duration, size, orientation, and FPS. | Video details match selected file metadata. |
| G019 | OPEN | P0 | `#control` `#media` | 027 | Make trim controls affect analysis input. | Analysis receives and stores selected trim start/end; frames outside trim are not used. |
| G020 | OPEN | P0 | `#media` `#pose` `#analytics` `#backend` | 027 to 038 | Implement native video analysis/save path. | Real video produces measured frames, phases, pose metrics, saved result, and result UI. |

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
| G038 | OPEN | P0 | `#analytics` `#pose` `#media` | 041 | Generate shot breakdown from measured frames. | Breakdown frames, score, angles, and phase values match saved frame analysis. |
| G039 | OPEN | P0 | `#pose` `#analytics` | 042 | Frame detail uses real pose and metrics. | Toggling overlay shows real saved joints/ball for selected frame. |
| G040 | OPEN | P2 | `#control` `#media` `#backend` | 043 | Make annotations real and persistent. | Draw annotation, save/share/export, reopen and see it on same media. |
| G041 | OPEN | P0 | `#analytics` | 044 | Replace fixed form score screen. | Score, confidence, breakdown, trend, insight, and impact come from saved result/history. |
| G042 | OPEN | P0 | `#analytics` | 045 | Replace fixed metric detail. | Metric detail receives measured metric object with value/range/confidence/source. |
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

Start with `P0-001`. Without a shared result contract, every downstream screen
will keep inventing its own numbers. `P0-001` should define the data shape,
source formulas, and web/iOS rendering contract before replacing individual
screens.
