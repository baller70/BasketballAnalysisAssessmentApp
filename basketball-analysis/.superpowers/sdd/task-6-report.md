# Task 6 report — shot phase and confidence engine

## Delivered

- Added a UI-independent `ShotPhaseTracker` with canonical `gather`, `rise`, `set`, `release`, `follow-through`, `flight`, `rim-event`, and `complete` states.
- Added explicit detector hints (`released`, `ballInFlight`, `rimEvent`, and `shotComplete`) plus a conservative body-only movement fallback.
- Added confidence gating for canonical mechanics values. Every requested measurement is retained as either trusted or omitted with a machine-readable reason and human-readable explanation.
- Integrated the gate and phase tracker into `MoveNetProvider.analyzeForm`. The provider now emits `mechanics` and `canonicalObservation` sidecars while preserving the existing scoring and UI result shape.
- Added a provider reset hook for starting a new live capture sequence.

## Verification

- Focused phase, confidence, and native adapter tests: 9 passed.
- Full Vitest suite: 35 tests passed across 10 files.
- ESLint on all changed production files: passed.
- TypeScript check of changed modules: passed; the repository-wide check still reports the pre-existing missing dependency/type errors when run without a complete install.

## Concerns / follow-up

- Ball and rim detectors are not part of the current MoveNet provider contract. The phase engine therefore accepts their canonical observations when available and remains body-only until those signals arrive; body-only capture intentionally does not fabricate flight or rim events.
- The shared provider is stateful for live sequences. Call `resetShotPhase()` when a capture/session is restarted so a prior shot cannot influence the next one.
- Test execution required the existing workspace dependency install because this worktree had no local `node_modules`; no private footage or benchmark media was added.

## Integration review fixes

- Routed `usePoseDetection` live frames through `PoseProvider.analyzeForm`, retaining the legacy angle/feedback return shape while exposing the canonical mechanics and phase sidecars as optional `analysis` metadata.
- Propagated frame timestamps through uploaded-video sampling and the native Vision adapter (including the adapter's fallback analysis path). Live camera frames use the media timestamp or a monotonic frame-clock fallback when Safari reports `currentTime = 0`.
- Added the optional provider `reset()` session seam and invoked it for image, uploaded-video, and live start/stop/single-frame paths so phase/timestamp state cannot bleed into the next session.
- Made confidence gating side-consistent. MoveNet passes the same side-specific landmark chain used by its angle engine, while unsided gate requirements choose one side once and never mix opposite-side landmarks.
- Added focused integration coverage for MoveNet timestamp/sidecar/reset behavior, native timestamp forwarding/reset, side-consistent omissions, and the live hook provider seam.

## Integration verification

- `npm test -- --run`: **39 tests passed across 12 files**.
- `npx tsc --noEmit --pretty false`: **passed**.
- `npx eslint src/services/pose/types.ts src/services/pose/MoveNetProvider.ts src/lib/vision/confidenceGate.ts src/services/vision/NativeVisionAdapter.ts src/services/pose/index.ts src/services/videoAnalysis.ts src/hooks/usePoseDetection.ts`: **passed**.
