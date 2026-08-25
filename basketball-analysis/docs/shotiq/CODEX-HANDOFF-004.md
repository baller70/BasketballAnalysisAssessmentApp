# Codex handoff: ShotIQ screen fidelity, screen 004

Date: 2026-08-07
Repo: `https://github.com/baller70/BasketballAnalysisAssessmentApp.git`
Branch: `claude/shotiq-production-build-txi5pl`
Branch head at this update: `1bb025b` (`Add shared ShotIQ analysis result contract`)
Primary app path: `basketball-analysis/`

## Current gate

Kevin's rule is the project rule: finish exactly one screen before starting the
next. Do not start screen 005 until screen 004 has an independent A or A+ grade,
is committed, and is pushed.

Screen 004 is `004-create-account`. It is still IN PROGRESS. Screens 001-003
are DONE at A/A+.

The previous autonomous continuation attempts were blocked by Anthropic's weekly
usage cap, not by a code issue. The observed reset time was 2026-08-11 12:00
UTC. After that reset, resume from this document and the ledger; do not restart
the project or begin screen 005.

Durable source of truth:

- `basketball-analysis/docs/SCREEN-LEDGER.md`
- `basketball-analysis/docs/shotiq/canonical/004-create-account.png`
- `basketball-analysis/docs/shotiq/ios-route-map.json`
- `basketball-analysis/docs/shotiq/measure/report004.py`
- `basketball-analysis/src/app/signup/phone-004.ts`
- `basketball-analysis/src/app/signup/Marks004.tsx`
- `basketball-analysis/docs/shotiq/IOS-FUNCTIONALITY-PROOF-LEDGER.md`

Do not use scratchpad paths as source of truth. The previous `scratchpad/BRIEF-004.md`
was not present in this checkout, and earlier stale scratchpad copies caused
invalid captures.

## What is already done

The original web production fix is done and verified on Contabo: `/results/demo`,
`/signin`, and `/guide` returned 200, and the deployed bundle contained the crop
fix and updated measurement bands:

- elbow: 150deg-180deg
- wrist: 50deg-100deg
- release: -5deg-5deg

The native iOS install is done. The device install scripts were fixed, the
Xcode project is regenerated before builds, the stale project exclusion of
`PoseDetection.swift` and `CapturedPoseImage.swift` was caught and fixed, and
the app installed on Kevin's iPhone 11 Pro Max as `com.baller70.shotiq`.

After the screen-004 handoff was first committed, this branch also added a
separate iOS functionality audit/proof stream:

- `f854d0d`, `eb8b955`, `850e879`: iOS functionality audit evidence and
  stricter evidence standards.
- `5227b0b`: robust iOS functionality analytics gap audit.
- `f1c718d`: `IOS-FUNCTIONALITY-PROOF-LEDGER.md`.
- `1bb025b`: shared `AnalysisResult` contract in backend TypeScript and native
  Swift DTOs. The proof ledger has `P0-001` at VERIFYING, not DONE.

Keep these two boards distinct. The pixel-fidelity board is still gated on
screen 004 only. The functionality board's current next item is `P0-001`, but
do not let it pull work onto multiple screens unless Kevin explicitly redirects
from the one-screen fidelity gate.

## Screen 004 status

Ledger state before this handoff:

- whole screen improved from `11.457` to `5.3669`
- independently verified from a clean production build in `.next-004v`
- open residuals led by display, lede, terms, fieldEmail, plate, labConfirm,
  eyePass, checkbox, eyeConf, oneacct, and monogram shape
- sent to an independent grader, but no grader result was durable in this repo

Fresh local verification on 2026-08-07, from this checkout:

1. Built production output with:
   `env -u NODE_ENV NODE_ENV=production NEXT_DIST_DIR=.next-004-codex ./node_modules/.bin/next build`
2. Confirmed `.next-004-codex/prerender-manifest.json` exists.
3. Served with:
   `env -u NODE_ENV NODE_ENV=production PORT=3181 NEXT_DIST_DIR=.next-004-codex ./node_modules/.bin/next start`
4. Captured only 004 through the committed route map:
   `ONLY=004 node docs/shotiq/capture-ios.mjs`

Capture result:

- captured: `1 / 1`
- steps: `7`
- step failures: `0`
- gaps: `0`
- wider than 393pt: `0`

`python3 -m measure.report004` on the fresh capture:

```text
whole screen   mean|d| 5.3396
display       14.3315
lede          12.5502
terms         10.5657
fieldEmail    10.0224
plate          8.4698
eyePass        8.1379
labConfirm     8.1204
checkbox       7.1859
eyeConf        7.1219
oneacct        6.2678
monogram       5.5289
orrow          2.4258
```

This reproduces the ledger state and is slightly better than the recorded
`5.3669`, but it is still not DONE. For calibration, screen 003 graded A around
`3.644`.

## Next action

Re-dispatch an independent grader for screen 004. The grader should inspect the
fresh production capture, canonical image, ledger entry, and `report004.py`
output. Ask for an A/A+/not-done verdict and falsification: if the grader says
not done, list measured defects in priority order; if the grader says A/A+,
include the falsification that justifies moving to screen 005.

If the grade is not A or A+, continue screen 004 only. Work largest residuals
first, and preserve the method rules in `SCREEN-LEDGER.md`.

## Important method rules for the next Codex

- Read `basketball-analysis/docs/SCREEN-LEDGER.md` in full before changing 004.
- Measure in the shipping rasteriser: `capture-ios.mjs` uses
  `--font-render-hinting=none`.
- Use the committed `ios-route-map.json`; screen 004 must be the filled,
  validated state reached by fill/click/blur steps.
- Before diagnosing a build failure affecting every route, run
  `pgrep -af "next dev|next start"`.
- Do not build into a dist directory currently served by `next start`.
- Use a custom `NEXT_DIST_DIR` and private port for each iteration.
- Report whole-screen mean beside every band report.
- Do not change global type roles or global colour tokens for a screen-local
  disagreement.
- Do not delete regions or pad dead space to improve a score.
- State physically unreachable residuals with measurements instead of forcing
  them.

## Local note from this handoff

The capture harness now uses `fileURLToPath(import.meta.url)` so it can find the
committed route map from repo paths containing spaces, such as
`/Volumes/TBF SKILLZ.INC/...`.
