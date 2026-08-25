# ShotIQ iOS Functional Journey Rebuild Plan

Date: 2026-08-09

Purpose: stop patching isolated screens and rebuild the native iOS app around the real customer journeys. The app has 72 canonical iOS screens, but screenshots and staged screens are not enough. A customer must be able to tap the promised control, provide media, see progress, receive results, and continue into training/share/media without loops or fake output.

## Source Of Truth Order

Use these references together, in this order, before changing native code:

1. `basketball-analysis/docs/shotiq/ios-72-feature-functionality-map.md`
   - Defines all 72 screen promises, media proof needs, pose/wireframe requirements, and toast/progress expectations.
2. Old mobile build: `basketball-analysis/mobile`
   - Expo/React Native implementation with a simpler route spine.
   - Key files:
     - `basketball-analysis/mobile/App.tsx`
     - `basketball-analysis/mobile/src/registry.ts`
     - `basketball-analysis/mobile/src/screens/HomeCaptureFlow.tsx`
     - `basketball-analysis/mobile/src/screens/AnalysisEliteFlow.tsx`
     - `basketball-analysis/mobile/src/screens/TrainingMiscFlow.tsx`
     - `basketball-analysis/mobile/src/api.ts`
3. Original web/repo behavior:
   - `basketball-analysis/src/components/upload/VideoUpload.tsx`
   - `basketball-analysis/src/services/videoAnalysis.ts`
   - `basketball-analysis/src/components/shotiq/phone/VideoReview.tsx`
   - `basketball-analysis/src/components/shotiq/phone/results/AnalysisOverview.tsx`
   - `basketball-analysis/src/components/live/*`
   - `basketball-analysis/src/lib/analysis/*`
   - `basketball-analysis/src/lib/vision/*`
4. Current native SwiftUI app:
   - `basketball-analysis/ios-native/ShotIQ/App/ShotIQApp.swift`
   - `basketball-analysis/ios-native/ShotIQ/Screens/Capture/CaptureFlow.swift`
   - `basketball-analysis/ios-native/ShotIQ/Screens/Analysis/AnalysisFlow.swift`
   - `basketball-analysis/ios-native/ShotIQ/Screens/Training/TrainingFlow.swift`
   - `basketball-analysis/ios-native/ShotIQ/Screens/Elite/EliteFlow.swift`
   - `basketball-analysis/ios-native/ShotIQ/Screens/Goals/GoalsAnalyticsMediaProfile.swift`
   - `basketball-analysis/ios-native/ShotIQ/Core/VideoPoseAnalysis.swift`
   - `basketball-analysis/ios-native/ShotIQ/Core/AnalysisResultPresentation.swift`

## Current Worktree Warning

The current worktree is dirty. Some changes are from earlier work and must not be casually reverted. As of 2026-08-09 15:10 EDT, the active external-drive worktree has been regenerated with XcodeGen, built for generic iOS, synced through the desktop bridge, built with signing, and installed on Kevin's iPhone as `com.baller70.shotiq`.

- `CaptureFlow.swift`: `VideoReviewView` carries a `VideoAnalysisJob` into `AnalysisProcessingView(videoJob:)`, so a selected video is retained through trim, processing, and results instead of asking for a second upload.
- `AnalysisFlow.swift`: real video result surfaces force the ShotIQ pose overlay with skeleton, joints, annotation callouts, and processing branding when pose data exists.
- `CapturedPoseImage.swift`: real image result surfaces run Vision pose detection and draw the ShotIQ-style skeleton/angle guidance over the selected photo.
- `project.yml` and `ShotIQ/App/Info.plist`: `NSPhotoLibraryAddUsageDescription` is present so screens that save/export cards, annotated frames, media summaries, and result images have the required iOS permission string.

Do not assume the full 72-screen goal is complete. Continue from the feature map, and prove each journey against current source/device behavior before marking it done.

## Old Mobile Build Behavior To Preserve

The old mobile build is useful because it has a clear route spine:

- Main tabs:
  - Home -> `HomeProfessional`
  - Analyze -> `AnalyzeHub`
  - Training -> `TrainingHome`
  - Progress -> `AnalyticsCards`
  - Profile -> `Profile`
- Capture path:
  - `AnalyzeHubScreen`
  - `VideoUploadScreen`
  - `VideoReviewScreen`
  - `AnalysisProcessingScreen`
  - `AnalysisResultOverviewScreen`
- Image path:
  - `AnalyzeHubScreen`
  - `PhotoUploadSourceScreen`
  - `PhotoReviewCropScreen`
  - `UploadQualityCheckScreen`
  - `AnalysisProcessingScreen`
  - `AnalysisResultOverviewScreen`
- Live path:
  - `LiveCameraSetupScreen`
  - `HoopCalibrationScreen`
  - `ReadinessCheckScreen`
  - `CaptureReadyScreen`
  - `LiveRecordingScreen`
  - `LiveFormFeedbackScreen`
  - `ShotDetectedScreen`
  - `CaptureReviewScreen`
  - `AnalysisProcessingScreen`
- Results path:
  - `AnalysisResultOverviewScreen`
  - `ShotBreakdownScreen`
  - `FrameDetailSkeletonScreen`
  - `AnnotationToolbarScreen`
  - `FormScoreScreen`
  - `MetricDetailScreen`
  - `FlawsOverviewScreen`
  - `FlawDetailScreen`
  - `EliteMatchScreen`
  - `PhotoComparisonScreen`
  - `PlayerCardScreen`
  - `ShareResultsScreen`
- Training path:
  - `TrainingHomeScreen`
  - `QuickStartScreen`
  - `DrillExecutionScreen`
  - `WorkoutCompletionScreen`
  - `ShotTrackerScreen`

The native app can be more capable than the old mobile build, but it must not be less coherent. The old build proves the customer should not be sent through repeated media-pick screens after selecting and analyzing one video.

## Rebuild Rule

Do not fix screens one by one unless they are part of the active journey.

For every journey:

1. Define the start and expected end.
2. Trace the current native route/state.
3. Compare to old mobile route spine and original web/repo behavior.
4. Fix only the gaps that prevent that journey from working.
5. Add or update customer feedback: toast, progress, disabled/loading state, system prompt, or confirmation.
6. Build from external drive only.
7. Install to iPhone only after the journey compiles.
8. Verify on the iPhone by walking the journey, not by staged screenshots.

## Priority 1 - Video Upload To Results

Screens: 021, 025, 026, 027, 036, 038, 041, 042, 043, 044, 045, 046, 047, 068, 069, 072.

Customer path:

`Analyze tab -> Upload video -> choose one video -> review/trim -> Analyze video -> processing -> result overview -> breakdown/frame/flaws/share/media`

Expected behavior:

- Video picker or file browser loads exactly one selected clip.
- The selected clip appears on video review.
- Pressing Analyze video starts analysis for that selected clip.
- The customer sees progress while upload/pose/scoring happens.
- Processing cannot lose the clip or ask for another video unless the customer taps Change video.
- Results show the selected video or sampled release frame.
- Results show pose skeleton/keypoints when available.
- Results show measured angles and "Not measured" where the pipeline cannot answer.
- Share/media/player-card use the saved analysis result, not demo constants.

References:

- Old mobile: `VideoUploadScreen`, `VideoReviewScreen`, `AnalysisProcessingScreen`, `AnalysisResultOverviewScreen`.
- Web: `VideoUpload.tsx`, `videoAnalysis.ts`, `VideoReview.tsx`, `AnalysisOverview.tsx`.
- Native: `CaptureFlow.swift`, `AnalysisFlow.swift`, `VideoPoseAnalysis.swift`, `LocalAnalysisFallback.swift`, `AnalysisResultPresentation.swift`.

Known symptom to resolve:

- User selected a video, pressed analyze, and the app routed into another video-add screen instead of finishing at the result. That is a P0 journey failure.

Proof gate:

- On iPhone, choose a real video once.
- See that same video in review.
- Press Analyze video once.
- See processing.
- Land on Analysis Result Overview.
- Open Shot Breakdown.
- Open Frame Detail Skeleton.
- Open Share Results or Media Detail.
- No step asks for a second video unless the customer explicitly chooses Change video.

## Priority 2 - Image Upload To Results

Screens: 021, 022, 023, 024, 036, 038, 041, 042, 043, 044, 045, 046, 047, 068, 069, 072.

Customer path:

`Analyze tab -> Upload image -> choose/capture image -> review/crop -> quality check -> analyze -> result overview -> skeleton/metrics/share`

Expected behavior:

- Library, camera, and file import routes are real.
- Selected image is retained through review/crop and quality check.
- Quality check must not display fake measured analysis before analysis runs.
- Pressing Continue/Analyze starts a real analysis request or a documented local fallback.
- Result surfaces use the selected image and pose/keypoint data.
- Share/media use the saved analysis.

References:

- Old mobile: `PhotoUploadSourceScreen`, `PhotoReviewCropScreen`, `UploadQualityCheckScreen`.
- Web: `MediaUpload.tsx`, `PreUploadValidation.tsx`, `UploadedPoseOverlay.tsx`, `/api/vision-analyze`.
- Native: `CaptureFlow.swift`, `AnalysisFlow.swift`, `CapturedPoseImage.swift`.

Proof gate:

- On iPhone, choose or capture a real photo once.
- See that same photo on crop/review.
- Continue to quality check.
- Analyze.
- Land on Analysis Result Overview with image/pose evidence.

## Priority 3 - Live Camera Session

Screens: 028, 029, 030, 031, 032, 033, 034, 035, 036, 038.

Customer path:

`Live camera -> setup -> hoop calibration -> readiness -> countdown -> recording -> feedback -> shot detected -> session review -> analysis`

Expected behavior:

- Camera permission and preview are real.
- Record/stop controls are visible and reachable.
- Timer and shot state update while recording.
- Live form feedback shows pose/wireframe cues when pose exists.
- Shot detected and session review lead forward into analysis.

References:

- Old mobile: `LiveCameraSetupScreen` through `CaptureReviewScreen`.
- Web: `components/live/*`, `lib/live/*`, `lib/capture/*`.
- Native: `CameraService.swift`, `CaptureFlow.swift`, `VideoPoseAnalysis.swift`.

Proof gate:

- On iPhone, open live camera, grant permissions if needed, start recording, stop, review, analyze.

## Priority 4 - Results Family

Screens: 038 through 053 plus 072.

Expected behavior:

- Every results screen reads the same latest selected/saved analysis.
- The result overview is the hub.
- Breakdown, frame detail, metrics, flaws, elite match, player card, comparison, and share are not standalone demo pages in production.
- If data is missing, the app says "Not measured" or routes to capture. It must not invent measured values.

References:

- Old mobile: `AnalysisEliteFlow.tsx`.
- Web: `src/components/shotiq/phone/results/*`.
- Native: `AnalysisFlow.swift`, `EliteFlow.swift`, `GoalsAnalyticsMediaProfile.swift`, `AnalysisResultPresentation.swift`.

Proof gate:

- From a real image/video result, open every result-family route and confirm each screen carries the same result context.

## Priority 5 - Training Workflow

Screens: 054 through 062.

Customer path:

`Training -> quick start/drill -> record or manually track shots -> make/miss -> save workout -> completion summary`

Expected behavior:

- Training home exposes Start, Record, Upload, and Shot Tracker where promised.
- Make/miss buttons persist events.
- End workout saves a summary.
- Completion feeds points, analytics, goals, and shareable summaries.

References:

- Old mobile: `TrainingMiscFlow.tsx`.
- Web: `workoutsClient.ts`, `shotEvents.ts`, `/api/workouts`, `/api/shot-events`.
- Native: `TrainingFlow.swift`, `GoalsAnalyticsMediaProfile.swift`.

Proof gate:

- On iPhone, start a workout, mark makes/misses, undo one, end workout, see completion, then see the workout reflected in profile/analytics/share.

## Priority 6 - Goals, Analytics, Media, Profile, Settings

Screens: 063 through 071.

Expected behavior:

- Goals create, open, update, and complete real records.
- Analytics reflects completed workouts and saved analyses.
- Media library shows real saved/captured/uploaded items and opens detail.
- Profile edits persist.
- Settings toggles persist and external/system actions provide feedback.

References:

- Old mobile: `TrainingMiscFlow.tsx`, `api.ts`.
- Web: `/api/goals`, `/api/settings`, `/api/media`, `/api/analysis-history`.
- Native: `GoalsAnalyticsMediaProfile.swift`, `APIClient.swift`.

Proof gate:

- Create a goal, complete/update it, save a workout, open analytics, open media detail, change a setting, and confirm each action has toast/progress feedback.

## Do Not Start Until This Is Accepted

The next code pass should start with Priority 1 only: Video Upload To Results.

No other fixes should be mixed into that pass unless they directly block the video journey.

The first implementation checkpoint is complete only when the user can test this on the iPhone:

`Upload one video -> review it -> analyze it -> land on results -> open breakdown/frame/share without being asked for another video.`
