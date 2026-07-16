# Task 7 — Shot review and corrections

Status: complete

## Delivered

- Added `ShotEvent` detector-output and append-only `ShotEventCorrection` Prisma models. A correction stores its canonical kind (`false_shot`, `make_miss`, `shooter`, or `phase`), JSON value, optional frame/time context, reason, owner, and creation time. Detector rows are never updated by review.
- Added `GET` and CSRF-protected `POST /api/shot-events/[id]/corrections`. Both operations derive the caller profile from the signed session and scope the event/correction query to that profile. The write path accepts the canonical `kind` field plus `type`/legacy aliases and normalizes make/miss and false-shot values.
- Added `ShotReviewTimeline`, an existing-style ShotIQ card/timeline with timestamps, confidence/phase metadata, event selection, false-shot, make/miss, shooter, and phase controls. Controls optimistically append a correction and sync through `csrfFetch`; demo/offline mode can keep review local.
- Inserted the timeline below the Results video player. Persisted `videoData.shotEvents` is used when available; legacy phase/frame output is normalized into review events so older Results sessions still get the review experience.

## Verification

- `npm test` — 10 files, 36 tests passed (including 7 new Task 7 tests).
- `npm run lint` — passed; repository retains existing warnings only.
- `npm run build` — passed; Prisma client generation, type checking, static generation, and route collection completed.
- `DATABASE_URL=postgresql://localhost/db npm exec --yes --package=prisma@6.7.0 prisma validate` — schema valid.

## Concerns / follow-ups

- The task brief called for a schema change but no migration file. Production rollout must run the normal Prisma migration workflow (or `prisma db push` in the configured environment) before enabling persisted shot-event review.
- Legacy/demo Results events use local IDs and pass `persist={false}` until a capture pipeline supplies persisted `shotEvents`; the correction API is ready for those persisted IDs.
- Build/lint output includes pre-existing warnings (image optimization and hook dependency warnings); none were introduced as errors by Task 7.

## Persistence and review hardening follow-up

- Added forward migration `20260716150000_shot_events` for both detector rows and append-only corrections, including ownership/session foreign keys, confidence storage, and review indexes.
- Added authenticated `POST/GET /api/shot-events`. Results video uploads and live camera recordings now attempt to persist real detector output and retain the returned server IDs; offline or signed-out sessions remain explicitly local rather than claiming persistence.
- `ShotReviewTimeline` hydrates corrections from the correction `GET` endpoint whenever persisted IDs are supplied, merging server and optimistic corrections without duplicates.
- Detector confidence is carried from sampled video frames, and events below the 0.60 trust threshold (or with no confidence) are marked review-only/untrusted. Their detector result and confidence are withheld from trusted numeric feedback until a human correction is made.

## Follow-up verification

- `npm test` — 11 files, 40 tests passed (including persistence API, correction hydration, and low-confidence review tests).
- `npx tsc --noEmit` — passed.
- `npm run build` — passed; Prisma generation, type checking, static page generation, and route collection completed.

## Live capture callback hardening

- Fixed the fullscreen live detector's stale callback closure. The callback is
  now stable for the lifetime of the detector loop and reads recording state,
  elapsed duration, current pose, and current feedback through refs at shot
  detection time. Starting detection before recording therefore no longer
  drops every live shot event, and recording controls do not restart the loop
  on each React render.
- Extracted `recordLiveShotDetection` into a small testable helper. It keeps
  confidence/score metadata and append-only event sequencing in one place.
- Added regression coverage for the idle-to-recording transition and the
  non-recording guard.

## Live capture verification

- `npm test` — 12 files, 42 tests passed.
- `npx tsc --noEmit` — passed after regenerating the Prisma client.
- `npm test -- --run tests/lib/live/shotDetection.test.ts` — 2 tests passed.

## Results/live recording follow-up

- Fullscreen live recording now marks the analysis store as `VIDEO` before handing the recording to Results, so the video tab and effective-video gate are selected for live sessions.
- Live stop adapts captured data URLs to the Results contract (`annotatedFramesBase64`, frame metadata, duration, and FPS) and keeps the latest captured frame list in a ref so the MediaRecorder callback cannot close over an empty initial state.
- If shot-event persistence returns `null`, detector rows remain in Results with stable local IDs and an explicit `reviewOnly` marker. The Results timeline renders and allows on-device corrections without attempting to call the server correction API for those rows; persisted rows retain normal hydration behavior.

## Follow-up verification

- `npm test` — 13 files, 45 tests passed (including 3 live Results adaptation regressions).
- `npx tsc --noEmit` — passed.
- `npm run build` — passed; Prisma generation, Next compilation/type checking, static generation, and route collection completed.
