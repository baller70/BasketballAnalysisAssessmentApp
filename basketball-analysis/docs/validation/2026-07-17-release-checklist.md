# ShotIQ Release Checklist — 2026-07-17

## Implemented

- [x] Canonical one-inference/one-next-frame pose scheduler and normalized object-observation contract.
- [x] On-device COCO-SSD sports-ball tracking with no overlapping inference.
- [x] Per-camera/per-orientation hoop calibration without hiding ShotIQ's capture controls.
- [x] Shared conservative make/miss/unknown trajectory engine for live and uploaded video.
- [x] Trusted result confidence/provenance persisted without overwriting human corrections.
- [x] Authenticated, CSRF-protected, user-owned S3 multipart upload APIs.
- [x] IndexedDB video queue with 8 MiB checkpoints, offline pause/resume, retry, and cancel.
- [x] Exact analysis/media session linking and cross-device video history.
- [x] Enforceable public benchmark and strict 16-combination iPhone device-matrix validator.
- [x] Native Apple Vision orientation metadata contract and eight EXIF-orientation mappings.
- [x] Previously untracked iPhone Safari, live-control, coordinate-space, and shooter-lock regression tests preserved in GitHub.

## Verified

- [x] Full Vitest suite: 46 files / 197 tests passed.
- [x] TypeScript: `npx tsc --noEmit` passed.
- [x] Lint: zero errors (existing warning backlog remains).
- [x] Prisma schema validation passed; production reports all six migrations current.
- [x] Public production-engine benchmark passed: 20 FPS, precision 1.00, recall 1.00, make/miss accuracy 1.00, phase error 0 on the deterministic CC0 fixture.
- [x] Local and Contabo production builds generated all 67 pages.
- [x] Capacitor iOS sync passed; native adapter and standalone Swift geometry tests passed.
- [x] GitHub Actions passed for the final runtime commit.
- [x] GitHub `main`, Contabo checkout, and deployed runtime matched commit `8b81ff42ec6662c7312e250b7a2ed81255c18a3e` before this documentation-only checklist commit.
- [x] PM2 `shotiq` is online; startup logs are clean; internal Results returned 200.
- [x] Public Results and Training returned 200; protected Media and Upload redirected to a working sign-in page; CSRF returned 200.

## Physical evidence still required

- [ ] Install full Xcode and complete a signed ShotIQ iOS target build.
- [ ] Connect an actual iPhone 11 and iPhone 12.
- [ ] Measure Safari and native modes in portrait/landscape with front/rear cameras (16 total runs).
- [ ] Save only those measured runs in `docs/validation/shotiq-device-matrix.json`.
- [ ] Run `npm run verify:device-matrix` successfully.

The deployed build is ready for physical validation. It is not represented as physically signed off: this Mac currently has only Command Line Tools, no full Xcode, and no connected iPhone 11/12, so the device matrix remains deliberately absent.
