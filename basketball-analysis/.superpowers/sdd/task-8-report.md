# Task 8 — Coaching target, prescribed drill, and retest

## Delivered

- Added a deterministic, pure coaching-target selector. It normalizes detected flaws, chooses one highest-confidence target, attaches one existing drill from `drillDatabase`, and emits a baseline, target value, direction, cue, and confidence.
- Added retest evaluation with explicit `improved`, `no_change`, and `regression` outcomes. The comparison uses the target direction and a small proportional tolerance around the baseline.
- Added the persisted `CoachingTarget` Prisma model and a scoped `/api/coaching-targets` GET/POST/PATCH endpoint. Creating a target supersedes a previous active target; retesting is ownership-scoped and returns the updated target plus result message.
- Added the target card to Training/calendar. Players can see the cue and prescribed drill, add that drill to today's calendar, or start it immediately.
- Added an Analytics/History retest card. Players can submit the latest metric and see improvement/no-change/regression without leaving their progress view.

## Verification

- `npm test` — 9 files, 34 tests passed (including 5 new coaching-target tests).
- `npx tsc --noEmit` — passed.
- `npm run lint` — passed with existing repository warnings only.
- `npm run build` — passed; `/api/coaching-targets` included in the production route output.

## Concerns / follow-ups

- A database migration/deploy must be run for the new `coaching_targets` table before enabling the endpoint in production (`prisma migrate dev/deploy`).
- Cross-platform device smoke testing still requires a signed-in browser/native shell and a live database; the implementation keeps the existing Training/History surfaces usable when that API is unavailable.
