# ShotIQ Release 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reliable guided capture, cross-platform vision contract, reviewable shot analysis, and correction-to-retest loop to the existing ShotIQ product.

**Architecture:** Preserve the current ShotIQ React UI and backend. Add pure domain modules behind focused interfaces, then integrate them into existing Live, Results, Training, and history surfaces. Use platform adapters so browser and native iPhone capture produce the same canonical records.

**Tech Stack:** Next.js 14, React 18, TypeScript, Vitest, TensorFlow.js/MoveNet, Capacitor 8, Prisma/PostgreSQL, S3-compatible storage.

## Global Constraints

- Preserve the existing ShotIQ navigation, visual identity, screens, and user data.
- Web Safari and native iPhone are equal first-release requirements.
- New production behavior is written test-first.
- Do not copy competitor code, models, artwork, copy, videos, or private assets.
- New measurements must include confidence and must be omitted when untrustworthy.
- Commit directly to `main`, as previously requested by the user.

---

### Task 1: Guided Capture domain model

**Files:**
- Create: `src/lib/capture/guidedCapture.ts`
- Create: `tests/lib/capture/guidedCapture.test.ts`

**Interfaces:**
- Produces: `evaluateCaptureReadiness(input: CaptureReadinessInput): CaptureReadiness`
- Produces: `CaptureMode`, `CaptureObservation`, `CaptureCheck`, and `CaptureReadiness` types.

- [x] Write tests for checking, missing pose, orientation, full-body visibility, subject size, pose confidence, optional hoop/ball checks, and ready state.
- [x] Run the focused test and verify it fails because the module does not exist.
- [x] Implement the minimal pure evaluator.
- [x] Run the focused test and the full suite.

### Task 2: Existing Live camera readiness integration

**Files:**
- Create: `src/components/live/GuidedCaptureStatus.tsx`
- Create: `tests/components/live/GuidedCaptureStatus.test.tsx`
- Modify: `src/components/live/FullscreenLiveCamera.tsx`

**Interfaces:**
- Consumes: `evaluateCaptureReadiness` from Task 1.
- Produces: an existing-style ShotIQ readiness pill and actionable issue list.

- [x] Write component tests for checking, attention, and ready states.
- [x] Run tests and verify the missing component failure.
- [x] Implement the status component with current ShotIQ colors and typography.
- [x] Derive pose observations in `FullscreenLiveCamera` and render the component without moving existing controls.
- [x] Gate recording until pose readiness passes, while preserving a clearly labeled manual override for non-tracking recording.
- [x] Run component, service, lint, and build checks.

### Task 3: Canonical vision adapter contract

**Files:**
- Reuse: `src/services/pose/types.ts`
- Modify: `src/services/pose/MoveNetProvider.ts`
- Create: `src/services/pose/conversions.ts`
- Create: `tests/services/pose/conversions.test.ts`
- Modify: `src/hooks/usePoseDetection.ts`

**Interfaces:**
- Produces: a canonical provider-to-live pose conversion and model-aware adapter registry.
- Consumes: the existing `PoseProvider`/`MoveNetProvider` seam already present in ShotIQ.

- [x] Write conversion tests first.
- [x] Extend the existing web MoveNet adapter to preserve live-frame timestamps.
- [x] Route the hook through the canonical provider without changing visible behavior.
- [x] Keep provider readiness model-specific so image and multi-person live modes cannot silently use the wrong detector.
- [x] Run focused and full tests.

### Task 4: Native iPhone vision bridge

**Files:**
- Create: `src/services/vision/NativeVisionAdapter.ts`
- Create: `src/services/capacitorVision.ts`
- Create: `tests/services/vision/NativeVisionAdapter.test.ts`
- Modify: `capacitor.config.ts`

**Interfaces:**
- Implements: `VisionAdapter`.
- Falls back explicitly to `WebMoveNetAdapter` when the native plugin is unavailable.

- [x] Write native availability, success, and explicit fallback tests.
- [x] Implement the TypeScript bridge and adapter.
- [x] Add the Capacitor plugin configuration contract.
- [x] Run unit tests and generate/sync the iOS project.

### Task 5: Capture session database and API

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/app/api/capture-sessions/route.ts`
- Create: `src/app/api/capture-sessions/[id]/route.ts`
- Create: `tests/api/capture-sessions.test.ts`
- Create: `src/lib/api/captureSessionsClient.ts`

**Interfaces:**
- Produces persisted capture device/orientation/view/readiness/model metadata.

- [x] Write authenticated API tests first.
- [x] Add normalized capture-session and observation models.
- [x] Implement create/read/update routes and client.
- [x] Generate Prisma client and run migration/build checks.

### Task 6: Shot phase and confidence engine

**Files:**
- Create: `src/lib/vision/shotPhases.ts`
- Create: `src/lib/vision/confidenceGate.ts`
- Create: `tests/lib/vision/shotPhases.test.ts`
- Create: `tests/lib/vision/confidenceGate.test.ts`
- Modify: `src/services/pose/MoveNetProvider.ts`

**Interfaces:**
- Produces canonical gather, rise, set, release, follow-through, flight, rim-event, and complete states.
- Produces trusted/omitted mechanics measurements with reasons.

- [x] Write phase-transition and confidence-omission tests.
- [x] Implement the minimal state machine and confidence gate.
- [x] Integrate canonical observations from the adapter.
- [x] Run focused benchmark fixtures and full tests.

### Task 7: Shot review and corrections

**Files:**
- Create: `src/components/analysis/ShotReviewTimeline.tsx`
- Create: `src/app/api/shot-events/[id]/corrections/route.ts`
- Create: `tests/components/analysis/ShotReviewTimeline.test.tsx`
- Modify: `src/app/results/demo/page.tsx`
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces correction records for false shot, make/miss, shooter, and phase markers.

- [x] Write timeline and correction API tests first.
- [x] Add shot event and immutable correction records.
- [x] Implement the existing-style review timeline.
- [x] Insert it into the current Results experience.
- [x] Run tests, lint, and build.

### Task 8: Coaching target, prescribed drill, and retest

**Files:**
- Create: `src/lib/coaching/coachingTarget.ts`
- Create: `src/app/api/coaching-targets/route.ts`
- Create: `tests/lib/coaching/coachingTarget.test.ts`
- Modify: `src/components/training/WorkoutOrPass/WorkoutCalendar.tsx`
- Modify: `src/components/analytics/HistoricalDataSection.tsx`
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces one active coaching target with flaw, cue, drill, baseline, target value, and retest result.

- [x] Write target-selection and retest evaluation tests first.
- [x] Persist the normalized coaching target.
- [x] Insert the prescribed drill into the current Training/calendar flow.
- [x] Show improvement/no-change/regression on retest.
- [x] Run the full suite, lint, build, and cross-platform smoke tests.

### Task 9: Benchmark and deployment gates

**Files:**
- Create: `src/lib/vision/benchmark.ts`
- Create: `tests/lib/vision/benchmark.test.ts`
- Modify: `.github/workflows/ci.yml`
- Modify: `DEPLOY_CONTABO.md`

**Interfaces:**
- Produces reproducible FPS, pose completeness, shot precision/recall, make/miss, and phase error summaries.

- [x] Write metric-aggregation tests first.
- [x] Implement benchmark summaries without committing private footage.
- [x] Add CI gates for unit tests, lint, build, and public fixtures.
- [x] Document device validation for iPhone 11/12 web and native.
- [x] Deploy only after all gates pass.
