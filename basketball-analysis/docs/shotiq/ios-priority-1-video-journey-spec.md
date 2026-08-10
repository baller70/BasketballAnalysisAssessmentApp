# ShotIQ iOS Priority 1 Video Journey Spec

Status: planning artifact only. Do not implement or install from this document until Kevin approves the plan.

## Purpose

The first functional repair must make the video path behave like the repo's intended ShotIQ product, not like a collection of disconnected placeholder pages.

Required customer journey:

1. Customer opens Analyze.
2. Customer chooses Upload video.
3. Customer selects a real video from Photos or Files.
4. App shows the same selected clip on Video Review with duration, orientation, size, and frame rate.
5. Customer taps Analyze video.
6. App shows processing progress and pose/landmark sampling feedback for that same clip.
7. App lands on Analysis Result Overview for that same analysis.
8. Results, breakdown, frame detail, flaws, elite match, media, and share must read the same result context.
9. The customer must never be sent to another upload screen to provide the same video again unless they explicitly tap Change video.

## Source Of Truth Order

1. 72-screen map: `basketball-analysis/docs/shotiq/ios-72-feature-functionality-map.md`
2. Old mobile build: `basketball-analysis/mobile`
3. Web/original repo behavior:
   - `basketball-analysis/src/components/shotiq/phone/VideoReview.tsx`
   - `basketball-analysis/src/components/upload/VideoUpload.tsx`
   - `basketball-analysis/src/components/shotiq/phone/results/AnalysisOverview.tsx`
   - `basketball-analysis/src/services/videoAnalysis.ts`
4. Native iOS implementation:
   - `basketball-analysis/ios-native/ShotIQ/Screens/Capture/CaptureFlow.swift`
   - `basketball-analysis/ios-native/ShotIQ/Screens/Analysis/AnalysisFlow.swift`
   - `basketball-analysis/ios-native/ShotIQ/Core/VideoPoseAnalysis.swift`
   - `basketball-analysis/ios-native/ShotIQ/Core/AnalysisResultPresentation.swift`

## Old Mobile Route Contract

The old mobile build gives the simple route spine that the native app must preserve:

- `AnalyzeHubScreen` screen 021 routes Upload video to `VideoUpload`.
- `VideoUploadScreen` screen 026 uses the video picker, then routes to `VideoReview`.
- `VideoReviewScreen` screen 027 reviews the selected rep and the primary CTA routes to `AnalysisProcessing`.
- `AnalysisProcessingScreen` screen 036 advances to `AnalysisResultOverview`.
- `AnalysisResultOverviewScreen` screen 038 displays the analyzed result, pose skeleton overlay, score, phase strip, and links to result detail screens.

The old mobile build is not enough by itself because it used placeholder media surfaces, but its navigation shape is correct: choose once, review once, analyze once, results once.

## Web/Repo Behavior To Preserve

The web video upload path has two important rules that must be copied into native:

- Accept the selected file first, then start analysis only after that selected file has landed in state.
- Fire analysis once per selected file, even if the view re-renders.

The web `VideoUpload` component documents the bug class directly: calling analysis in the same tick as accept can analyze `null`; it uses a started reference so the same file is not analyzed twice.

The web `VideoReview` component is also strict: it receives a `clip`, and its Analyze button analyzes that clip. Its Change button is the only customer action that should return to selection.

The web `AnalysisOverview` behavior matters for result truthfulness:

- Real measured metrics come from the saved analysis contract.
- Missing measurements print `Not measured` rather than fake numbers.
- The visible pose/wireframe belongs on the analyzed media/result, not only on a static placeholder.

## Native Current Route Points

Current native files already contain parts of the right shape:

- `VideoUploadView` screen 026 loads a `PickedVideoClip` from Photos or Files, shows a success toast, and navigates to `VideoReviewView(video: selectedVideo)`.
- `VideoReviewView` screen 027 displays `CaptureVideoPoseSurface(url: video.url, ...)` when a real clip exists.
- `VideoReviewView.analyzeVideo()` builds a `VideoAnalysisJob` with the clip and trim fractions.
- `AnalysisProcessingView(videoJob:)` runs `VideoPoseAnalyzer.analyze(job:)`, uploads/saves the result, stores `completedResult`, calls `app.rememberAnalysisMedia(...)`, and routes to `AnalysisResultOverviewView(initialResult:)`.
- `AnalysisResultOverviewView(initialResult:)` seeds its `AnalysisResultPresentation` from the passed result and only loads latest production analysis when no initial result was provided.

## Risk Points To Fix Before Installing

These are the likely sources of Kevin seeing a loop back to another upload/video screen:

- `VideoUploadView` uses `navigationDestination(isPresented: $go)` and passes `selectedVideo`, an optional state value, into the destination. This can build a destination with nil or stale state. The safer route contract is item-based navigation carrying the selected `PickedVideoClip` as the route value.
- `VideoReviewView` must never allow the primary Analyze CTA to proceed without a real clip. If no clip exists, it may show a toast and route to upload, but that should only be an empty-state recovery path, not the normal path.
- Processing must be keyed by the `VideoAnalysisJob` identity. A SwiftUI `.task` can run again if the view is recreated, so the implementation needs an already-started guard for the same job/session.
- Result overview must preserve the just-completed `completedResult`. It must not reload an empty/no-result state before the customer sees the analysis they just created.
- Result detail screens must receive the same `AnalysisResultPresentation`. Any screen that refetches latest or falls back to `.noResult` can make the journey feel like it lost the shot.
- Share/media/profile entry points must be gated. If no analysis exists, show "Analyze a shot first" with a route to Analyze. If an analysis exists, use it.

## Implementation Plan After Approval

1. Route selected video as data, not optional side state.
   - Replace 026's boolean `go` destination with an item route carrying `PickedVideoClip`.
   - Keep Photos and Files loading paths identical after metadata extraction.
   - Acceptance: after choosing a video, 027 always receives a non-nil clip.

2. Make analysis run exactly once for a selected job.
   - Keep `VideoAnalysisJob` as the single processing input.
   - Add a started-session guard in `AnalysisProcessingView` so SwiftUI rerenders cannot launch duplicate uploads/saves.
   - Acceptance: one tap on Analyze video creates one analysis job and one result navigation.

3. Preserve the result context through the result family.
   - Confirm 038 receives `completedResult`.
   - Audit 040-047, 050-053, 068-072 for presentation/context handoff instead of `.noResult` fallback.
   - Acceptance: "View shot breakdown", frame detail, flaws, elite match, and share open from the just-analyzed clip without asking for another upload.

4. Keep customer feedback visible.
   - Every upload/analyze/save/share action shows toast or progress.
   - Loading video, preparing analysis, pose sampling, upload/save completion, and recoverable errors must be visible.
   - Acceptance: the customer always sees what ShotIQ is doing and what they did correctly.

5. Install only after build proof.
   - Build with DerivedData on the external drive.
   - Install through the existing iPhone workflow/desktop bridge if the laptop cannot see the device.
   - Do not claim the phone has the change until install output confirms `com.baller70.shotiq` was installed.

## iPhone Proof Checklist

Kevin should be able to verify this exact path on the real app after approval, implementation, build, and install:

1. Open ShotIQ on the iPhone.
2. Tap Analyze.
3. Tap Upload video.
4. Pick a real shot video.
5. Expected: toast/progress says the video is loading, then ready.
6. Expected: Video Review opens with the chosen clip visible, not a placeholder-only screen.
7. Tap Analyze video.
8. Expected: processing screen opens, progress moves, and pose/landmark sampling appears for that clip when available.
9. Expected: app lands on Analysis Result Overview, not another upload screen.
10. Expected: media shows the analyzed video/frame or a truthful fallback, with pose/wireframe when pose was detected.
11. Tap View shot breakdown.
12. Expected: breakdown opens from the same result.
13. Tap Share analysis.
14. Expected: share screen opens from the same result or shows a clear actionable toast if sharing is unavailable.

## Non-Goals For This Slice

- Do not start training, workout, goals, settings, or visual-fidelity screens in this pass.
- Do not create new product behavior unless it is required to preserve the repo's existing video journey.
- Do not use simulator-only proof as final proof. The real iPhone install/test is the gate.

## Current Uninstalled Code State

There is a local code edit in `CaptureFlow.swift` that moves `VideoReviewView` processing navigation toward a safer associated-value route. It passed a local test build earlier, but it was not installed on Kevin's iPhone after Kevin stopped implementation and requested planning.

Treat that edit as an implementation candidate, not as shipped work. Before continuing, review it against this spec, finish the 026 route-data change, add the processing once-guard if missing, build on external storage, then install to the phone only after Kevin approves.
