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
