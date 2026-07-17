# ShotIQ Remaining Release Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the remaining ShotIQ release work with real ball-aware shot tracking, make/miss results, recoverable video uploads, and release evidence while preserving the existing ShotIQ UI and data.

**Architecture:** Keep MoveNet/Apple Vision as the canonical body-pose providers. Add a separate, throttled object-observation seam for the COCO-SSD `sports ball` class and a user-calibrated hoop region, then feed those observations into a pure trajectory/result engine shared by live and uploaded video. Persist large videos through authenticated S3 multipart APIs and a browser IndexedDB queue; keep analysis local-first when the network is unavailable.

**Tech Stack:** Next.js 14, React 18, TypeScript, Vitest, TensorFlow.js COCO-SSD, Capacitor 8/Apple Vision, IndexedDB, Prisma/PostgreSQL, AWS SDK v3/S3-compatible object storage.

## Global Constraints

- Preserve the existing ShotIQ navigation, colors, typography, capture controls, and stored user data.
- Web Safari and native iPhone remain equal requirements.
- Write a failing behavior test before each production behavior change.
- Never report a make or miss without a calibrated hoop, a trusted ball trajectory, and sufficient confidence.
- Never manufacture benchmark/device results; missing evidence remains explicitly incomplete.
- Do not copy competitor code, models, media, text, or artwork.
- Commit completed, verified slices directly to `main` and push them to GitHub, as requested by the user.

---

### Task 1: Correct the live scheduler and define the object-observation contract

**Files:**
- Create: `src/lib/vision/objectTracking.ts`
- Create: `tests/lib/vision/objectTracking.test.ts`
- Modify: `src/hooks/usePoseDetection.ts`
- Modify: `tests/hooks/usePoseDetection.test.tsx`

**Interfaces:**
- Produces: `ObjectDetection`, `BallObservation`, `RimCalibration`, `selectBallObservation(detections, previous)`, and normalized coordinate helpers.
- Produces: exactly one next-frame schedule per completed pose inference.

- [x] **Step 1: Write failing pure tests** for sports-ball selection, confidence rejection, nearest-track continuity, coordinate normalization, and invalid hoop calibration.
- [x] **Step 2: Run** `npx vitest run tests/lib/vision/objectTracking.test.ts` and confirm failure because the module does not exist.
- [x] **Step 3: Implement the minimal pure contract** with finite-number guards, confidence threshold `0.35`, normalized `[0,1]` coordinates, and prior-track distance selection.
- [x] **Step 4: Audit the live scheduler** and confirm the checked-in hook schedules exactly one `requestAnimationFrame` after inference; no production scheduler change is required.
- [x] **Step 5: Run** `npx vitest run tests/hooks/usePoseDetection.test.tsx` and retain the existing canonical-provider regression.
- [x] **Step 6: Run the object-tracking and hook tests together** and confirm both remain green.
- [x] **Step 7: Commit** the verified canonical object-tracking slice after focused and full tests pass (`0c38444`).

### Task 2: Add real on-device basketball tracking and ShotIQ hoop calibration

**Files:**
- Create: `src/services/vision/CocoBallDetector.ts`
- Create: `src/hooks/useObjectTracking.ts`
- Create: `src/components/live/HoopCalibrationOverlay.tsx`
- Create: `tests/services/vision/CocoBallDetector.test.ts`
- Create: `tests/hooks/useObjectTracking.test.tsx`
- Create: `tests/components/live/HoopCalibrationOverlay.test.tsx`
- Modify: `src/components/live/FullscreenLiveCamera.tsx`
- Modify: `src/lib/capture/guidedCapture.ts`

**Interfaces:**
- `CocoBallDetector.init(): Promise<void>` loads `@tensorflow-models/coco-ssd` once.
- `CocoBallDetector.detect(input): Promise<BallObservation | null>` accepts video/canvas/image input and maps only `sports ball` predictions.
- `useObjectTracking` throttles object inference to 6 FPS, exposes current ball/FPS/error, and never starts a second overlapping inference.
- `HoopCalibrationOverlay` maps one user tap into a normalized `RimCalibration`, supports clear/recalibrate, and stores calibration per camera/orientation.

- [x] **Step 1: Write failing detector tests** for model reuse, class filtering, confidence filtering, and coordinate mapping.
- [x] **Step 2: Run** `npx vitest run tests/services/vision/CocoBallDetector.test.ts` and confirm the missing implementation failure.
- [x] **Step 3: Implement the detector** using the already-installed official COCO-SSD package; no API keys or remote model are required.
- [x] **Step 4: Write failing hook tests** for 6 FPS throttling, no overlapping predictions, stop/reset behavior, surfaced initialization errors, and shared pose/object pixels.
- [x] **Step 5: Implement the hook** and verify its focused tests.
- [x] **Step 6: Write failing calibration component tests** for tap, persistence key, recalibration, orientation isolation, accessible controls, and visible ball tracking.
- [x] **Step 7: Implement the existing-style ShotIQ overlay** without moving or hiding record controls.
- [x] **Step 8: Wire live ball and hoop observations** into readiness and capture-session observations; the record override remains available, while shot-result tracking clearly says `Calibrate hoop` until calibration exists.
- [x] **Step 9: Run focused tests, full tests, type-check, lint, and build.**
- [x] **Step 10: Commit** `feat: add live ball tracking and hoop calibration` (`a8947f1`).

### Task 3: Classify trusted make/miss results from trajectory

**Files:**
- Create: `src/lib/vision/shotResult.ts`
- Create: `tests/lib/vision/shotResult.test.ts`
- Modify: `src/lib/vision/shotPhases.ts`
- Modify: `src/lib/live/shotDetection.ts`
- Modify: `src/components/live/FullscreenLiveCamera.tsx`
- Modify: `src/services/videoAnalysis.ts`
- Modify: `tests/services/videoAnalysis.test.ts`
- Modify: `src/lib/api/shotEvents.ts`

**Interfaces:**
- Produces: `ShotTrajectoryTracker.update({timestampMs, ball, rim}): ShotResultObservation`.
- Result is `make`, `miss`, or `unknown`; `make` requires downward center crossing through the calibrated rim window; `miss` requires a trusted near-rim approach followed by exit outside the cylinder; all other sequences remain `unknown`.
- Shot events persist result confidence and trajectory provenance without overwriting human corrections.

- [x] **Step 1: Write failing trajectory tests** for make, left/right/front miss, occlusion, upward pass, low confidence, stale frames, and no rim calibration.
- [x] **Step 2: Run** `npx vitest run tests/lib/vision/shotResult.test.ts` and confirm the module is missing.
- [x] **Step 3: Implement the pure tracker** with monotonic timestamps, bounded trajectory history, normalized rim geometry, and conservative confidence output.
- [x] **Step 4: Extend phase tests first** so normalized rim geometry cannot accidentally use the pixel-distance default.
- [x] **Step 5: Integrate live results** into shot-event creation, counter feedback, capture observations, and Results review while retaining `unknown` for body-only captures.
- [x] **Step 6: Extend uploaded-video sampling** to run the same throttled ball detector and shared trajectory engine; persist per-frame ball observations and the trusted result.
- [x] **Step 7: Run all focused tests, then full tests, type-check, lint, and build (36 files / 146 tests; lint has zero errors; 66-page build).**
- [x] **Step 8: Commit** `feat: classify trusted shot results`.

### Task 4: Add resumable authenticated video uploads and durable offline queueing

**Files:**
- Create: `src/app/api/media-uploads/route.ts`
- Create: `src/app/api/media-uploads/[uploadId]/parts/route.ts`
- Create: `src/app/api/media-uploads/[uploadId]/complete/route.ts`
- Create: `src/app/api/media-uploads/[uploadId]/abort/route.ts`
- Create: `src/lib/storage/multipartUpload.ts`
- Create: `src/lib/upload/uploadQueue.ts`
- Create: `src/lib/upload/resumableVideoUpload.ts`
- Create: `src/components/upload/UploadQueueStatus.tsx`
- Create: `tests/api/mediaUploads.test.ts`
- Create: `tests/lib/upload/uploadQueue.test.ts`
- Create: `tests/lib/upload/resumableVideoUpload.test.ts`
- Create: `tests/components/upload/UploadQueueStatus.test.tsx`
- Modify: `src/components/upload/VideoUpload.tsx`
- Modify: `src/components/live/FullscreenLiveCamera.tsx`
- Modify: `src/services/sessionStorage.ts`
- Modify: `src/app/api/save-analysis/route.ts`
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260717170000_resumable_media_uploads/migration.sql`

**Interfaces:**
- Authenticated API initiates an S3 multipart upload with a deterministic user-scoped key, presigns individual `UploadPart` requests, completes only the caller's upload, and supports explicit abort.
- `UploadQueueEntry` stores metadata and the original `Blob` in IndexedDB; completed part numbers/ETags are checkpointed after each part.
- `resumeQueuedUploads()` retries only unfinished parts on startup and browser `online`; queue status is visible and manually retryable.
- Completed media URL/key is attached idempotently to the exact analysis session.

- [x] **Step 1: Write failing API tests** for CSRF, authentication, ownership, filename/content-type validation, deterministic key scope, part signing, completion, and abort.
- [x] **Step 2: Run** the API tests and confirm missing-route failures.
- [x] **Step 3: Add the persistence model/migration and server multipart helpers**, then implement the four API operations using AWS SDK v3 commands and presigned URLs.
- [x] **Step 4: Write failing IndexedDB queue tests** with an injected storage adapter for enqueue, checkpoint, retry, completion, corruption, and quota failure.
- [x] **Step 5: Implement the queue and resumable client** using 8 MiB parts, sequential iPhone uploads, bounded exponential retry, and caller cancellation.
- [x] **Step 6: Write failing UI tests** for uploading, paused/offline, retrying, failed, and complete states.
- [x] **Step 7: Add the ShotIQ queue status UI** to video upload and live-save flows without blocking local analysis/navigation.
- [x] **Step 8: Link completed video media** to `UserAnalysis` by exact user/client session ID and verify an old retry cannot overwrite a newer capture identity.
- [x] **Step 9: Run migration validation, focused/full tests, type-check, lint, and build (40 files / 170 tests; lint has zero errors; 67-page build).**
- [x] **Step 10: Commit** `feat: add resumable video upload queue`.

### Task 5: Replace synthetic benchmark checks with enforceable release evidence

**Files:**
- Create: `src/lib/vision/benchmarkGate.ts`
- Create: `tests/lib/vision/benchmarkGate.test.ts`
- Create: `benchmarks/public/shotiq-release-fixture.json`
- Create: `scripts/run-vision-benchmark.ts`
- Create: `scripts/verify-device-matrix.ts`
- Create: `tests/scripts/releaseGates.test.ts`
- Modify: `.github/workflows/ci.yml`
- Modify: `DEPLOY_CONTABO.md`
- Create: `docs/validation/device-matrix.schema.json`

**Interfaces:**
- `evaluateBenchmarkGate(summary)` enforces FPS `>=15`, shot precision/recall `>=0.95`, make/miss accuracy `>=0.90`, non-null denominators, and zero promoted low-confidence measurements.
- Benchmark command consumes real JSON observations and exits nonzero on missing/failed evidence.
- Device-matrix command requires iPhone 11 and 12, Safari web and native, portrait/landscape, and front/rear entries with build/commit identity.

- [x] **Step 1: Write failing gate tests** for every threshold, missing denominators, fixture provenance, and low-confidence promotion.
- [x] **Step 2: Implement the gate and CLI** and confirm failure against deliberately incomplete evidence.
- [x] **Step 3: Add a small public deterministic fixture** containing observations and labels, not private footage; run the same production trajectory engine over it.
- [x] **Step 4: Add device-matrix schema/validator tests** that reject missing devices, modes, orientations, cameras, commit hashes, or metrics.
- [x] **Step 5: Update CI** so type-check, lint, unit tests, production build, public benchmark, and release-validator tests are mandatory. Physical matrix validation remains the strict pre-deploy command.
- [x] **Step 6: Run the benchmark and CI commands locally** (42 files / 185 tests, TypeScript clean, lint zero errors, benchmark gate passed, 67-page production build). The separate physical-device command correctly fails while measured iPhone evidence is absent.
- [x] **Step 7: Commit** `test: enforce vision release evidence`.

### Task 6: Verify native iPhone build and physical device matrix

**Files:**
- Modify: `ios/App/App/ShotIQVisionPlugin.swift`
- Modify: `tests/ios/ShotIQVisionGeometryTests.swift`
- Create: `docs/validation/shotiq-device-matrix.json`
- Modify: `DEPLOY_CONTABO.md`

**Interfaces:**
- Native plugin emits the same named/normalized body-pose contract as web and preserves orientation metadata.
- Device matrix contains only measured runs from the exact Git commit being released.

- [ ] **Step 1: Run TypeScript native-adapter tests and Swift geometry tests.**
- [ ] **Step 2: Run** `npm run cap:build:ios` and `xcodebuild` for the ShotIQ iOS target; fix only failures attributable to ShotIQ source/configuration.
- [ ] **Step 3: Install the signed build on an actual iPhone 11 and 12**, then record Safari/native, portrait/landscape, front/rear runs.
- [ ] **Step 4: Feed each run to the benchmark CLI** and record exact commit, model, FPS, pose completeness, shot precision/recall, make/miss accuracy, and phase error.
- [ ] **Step 5: Run the device-matrix validator** and require a zero exit code.
- [ ] **Step 6: Commit measured evidence** only after all combinations are present. If Xcode, signing, devices, or consented footage are unavailable, leave this task explicitly blocked rather than fabricating completion.

### Task 7: Final verification, GitHub delivery, and production deployment

**Files:**
- Modify: this plan only to check completed steps with verified evidence.

**Interfaces:**
- Produces one GitHub `main` commit chain, one matching production server commit, current migrations, healthy PM2 process, and passing public smoke routes.

- [ ] **Step 1: Re-read every plan requirement** and map it to code, tests, or measured device evidence.
- [ ] **Step 2: Run** `npm test -- --run`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, Prisma validation/migration status, benchmark gate, and device-matrix gate.
- [ ] **Step 3: Confirm the worktree contains no unrelated or uncommitted changes.**
- [ ] **Step 4: Push all verified commits directly to GitHub `main`.**
- [ ] **Step 5: SSH-deploy with `/opt/shotiq/basketball-analysis/deploy.sh`.**
- [ ] **Step 6: Verify server/GitHub commit parity, PM2 health, migration status, clean startup logs, and public Results/Training/Media/Upload routes.**
- [ ] **Step 7: Report the checked checklist, exact commits, test counts, live URLs, and any physical evidence blocker plainly.**

## Source References

- TensorFlow.js COCO-SSD official model repository: `https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd`
- AWS S3 multipart upload process: `https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html`
- MDN IndexedDB guide: `https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB`
- Apple Vision body pose request: `https://developer.apple.com/documentation/vision/vndetecthumanbodyposerequest`
