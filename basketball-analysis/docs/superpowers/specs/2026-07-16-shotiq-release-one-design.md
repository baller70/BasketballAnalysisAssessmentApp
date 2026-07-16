# ShotIQ Release 1 Design

## Objective

Build onto the existing ShotIQ app and preserve its current navigation, typography, colors, screens, components, authentication, profiles, results, training experience, APIs, database, and storage. Add a trustworthy capture-to-improvement loop on web and native iPhone without importing competitor code, models, artwork, text, or media.

## Product rule

ShotIQ remains the visible product. New features extend the existing Upload/Live, Results, Training, Goals, and Profile surfaces. Internal implementations may be replaced or consolidated only when they cause unreliable tracking, duplicated history, or fabricated low-confidence measurements.

## Architecture

The web application and native iPhone application share one React product core, Next.js API, PostgreSQL database, media storage, mechanics engine, coaching engine, and training history. Camera and vision behavior is accessed through a canonical `VisionAdapter` contract. The web adapter uses browser camera APIs and worker-friendly inference. The native adapter uses Capacitor bridges to Apple Vision/Core ML when available. Both adapters emit the same ShotIQ capture, pose, shot-phase, and shot-event records.

## Release 1 workflow

1. Guided Capture asks for view and shooting hand, canonicalizes orientation, and evaluates full-body visibility, subject size, stability, and pose confidence. Hoop and ball checks become required when shot-result tracking is enabled.
2. ShotIQ Vision 2 tracks one selected shooter, body pose, ball, hoop, shot phases, and shot result. Live analysis is optimized for responsiveness; saved sessions receive a higher-accuracy post-session pass.
3. Results show a shot-by-shot timeline, phase markers, confidence-aware measurements, best-rep comparison, and repair controls for false shots, make/miss, shooter, and phase markers.
4. Coaching selects one highest-confidence priority, writes one original ShotIQ cue, assigns one existing drill, defines one metric target, and schedules a retest.
5. Training execution and retest results are saved to one database-backed player timeline.

## Guided Capture states

- `checking`: camera or model is not ready.
- `needs_attention`: the frame is analyzable but has one or more actionable capture issues.
- `ready`: all required checks have passed for the configured mode.
- `recording`: readiness is locked and the capture has started.

Readiness checks are pure domain logic and do not depend on React or a specific vision engine. The first implementation derives orientation, full-body visibility, subject size, and pose confidence from MoveNet. Ball/hoop and light/stability observations are optional inputs until their detectors land.

## Reliability behavior

- The preview, inference pixels, overlay, and recording use one canonical orientation transform.
- A tracked shooter is never silently replaced. Reacquisition is explicit and can require user confirmation.
- Measurements whose required landmarks do not meet confidence are omitted.
- Uncertain shot events remain reviewable and do not silently become official statistics.
- Interrupted uploads are visibly queued and resumable.
- Camera/model failures display an actionable ShotIQ message; there is no silent demo fallback.

## Release acceptance gates

- Web Safari and native iPhone are both release requirements.
- iPhone 11 and 12, portrait and landscape, front and rear cameras are in the test matrix.
- Live overlay reaches at least 15 FPS on supported phones under the documented capture setup.
- Shot-event detection reaches at least 95% precision and 95% recall on the approved benchmark.
- Make/miss classification reaches at least 90% accuracy when the rim is visible and the capture passes quality checks.
- Low-confidence measurements are never rendered as trusted numeric feedback.

## Clean-room and assets

- Implement product behavior from ShotIQ requirements and observed user outcomes, not from translated or structurally mirrored competitor code.
- Use original ShotIQ copy, names, thresholds, workflows, and visual components.
- Create new artwork with approved generation tools or licensed sources.
- Use clearly labeled replaceable placeholder videos until original ShotIQ instruction videos are supplied.
- Do not redistribute competitor models, media, text, artwork, drills, or private resources.

## Testing

- Pure unit tests for capture readiness, confidence gating, target locking, shot phases, corrections, and coaching targets.
- React component tests for readiness display and record gating.
- Adapter contract tests shared by web and native implementations.
- Browser tests for portrait/landscape transform parity.
- Native iPhone device tests for camera lifecycle, thermal behavior, FPS, and overlay alignment.
- Benchmark tests against consented, labeled basketball footage.

## Delivery order

1. Guided Capture domain model and UI integration.
2. Canonical vision adapter contract and current MoveNet web adapter.
3. Native iPhone adapter bridge.
4. Capture session, observations, and event schema/API.
5. Shot phase state machine and confidence-aware metrics.
6. Shot review and correction timeline.
7. One-flaw coaching target and training/retest integration.
8. Benchmark and cross-platform release gates.
