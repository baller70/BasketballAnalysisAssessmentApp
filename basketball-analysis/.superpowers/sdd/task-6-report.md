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
