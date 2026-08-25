# ShotIQ — Handoff for Codex

Written 2026-08-06 by the Claude session on branch `claude/shotiq-production-build-txi5pl`.
Read this top to bottom before touching anything. Then read the ledger (below) —
**the ledger, not this file, is the source of truth for screen state.**

---

## 1. What this is

**ShotIQ** — a basketball shooting-form analysis app for Kevin Houston
(The Basketball Factory NJ). A player uploads or captures a photo/video of their
jump shot; the app runs pose detection, measures joint angles, grades the form,
names the flaws, and prescribes drills.

Two shipping surfaces, one codebase-ish:

- **Web app** — Next.js 14 App Router, `basketball-analysis/`. Prisma + Postgres.
  Deployed on a Contabo box at **https://shotiq.194-146-12-139.sslip.io**.
- **iOS app** — native SwiftUI, `basketball-analysis/ios-native/`. Bundle id
  `com.baller70.shotiq`, team `DD9G8RP575`. Installs onto Kevin's iPhone 11 Pro Max
  directly; also has a TestFlight/App Store lane.

The web app renders **two different component trees**: `usePhoneViewport` switches
between a 393pt phone tree and a 1440px desktop tree. They are different subtrees,
not one responsive layout. A fix in one does **not** fix the other.

---

## 2. Kevin's goals, in his own words

### The governing mandate

> "A placeholder portrays a feature I want to be real, so that when the user goes
> to use it, it actually works."

**Make placeholder FEATURES real — not just placeholder VALUES.** If a screen shows
a CROP button, pressing CROP must crop. If it draws a skeleton, that must be the
player's actual skeleton. Kevin has repeatedly been burned by things that *looked*
done and weren't, and he checks. Do not report something as working that you have
not driven and watched change.

### The fidelity campaign

Every screen must match its canonical design **measurably** — not "looks close."
There are 72 canonical iOS designs (001–072) and 20 desktop (077–096). The bar is
an **independent grader scoring A or A+**, with numbers.

### His process rule, which overrides everything else

> **ONE SCREEN AT A TIME, FINISHED COMPLETELY, THEN THE NEXT.**

Never spread partial work across screens. Never start a second screen while one is
in progress.

---

## 3. Where things stand

### Track A — feature reality (web + iOS). Largely DONE and deployed.

The web app is **live and current**. Confirmed by fetching the live site: the
release-frame angle bands render `150° – 180°` (elbow), `50° – 100°` (wrist),
`−5° – 5°` (release deviation).

The single biggest correctness fix of the last stretch, and the thing to understand
before touching any analysis code:

> **Every angle on an analysis record is sampled at ONE frame — the RELEASE frame.**
> `videoAnalysis.ts` samples there. So `angles.elbow` is ~150–180 (arm extended at
> release), `angles.wrist` is forearm elevation ~50–100, and `angles.release` is
> signed deviation from vertical (ideal 0, band ±5).
>
> Meanwhile bands, badge rules, the flaw engine and the drill chain had all been
> written describing the **set point** (elbow ~90), the dip, or a ball arc nothing
> measures. **The app was marking textbook shooting as wrong.** Fixed across five
> display surfaces, the badge route, the flaw engine and the drill recommender.
> Single source of truth is now `src/lib/analysis/angleBands.ts`.

Other feature work completed and pushed: real crop/rotate on PHOTO REVIEW
(`src/lib/image/cropImage.ts` + `PhotoReviewCrop` in `UploadPhone.tsx`), honest
empty states, real readiness checks on LiveCapture, real mechanic grades on
ShareResults, persisted dip knee angle, drills that address the flaw they name.

**ShotIQ is installed on Kevin's iPhone.** `** BUILD SUCCEEDED **`,
`App installed: bundleID com.baller70.shotiq`, zero compile errors.

### Track B — the screen-by-screen fidelity campaign. THIS IS THE ACTIVE WORK.

| # | screen | state |
|---|---|---|
| 001 | splash | **DONE — A+** |
| 002 | welcome | **DONE — A** |
| 003 | sign-in | **DONE — A** (whole-screen mean\|d\| 3.644) |
| **004** | **create-account** | **IN PROGRESS — 5.3669, NOT GRADED** |
| 005–072 | … | not started |
| 077–096 | desktop | 20 screens graded B+, held as a regression baseline |

---

## 4. Screen 004 — exactly where it is

Whole-screen **mean|d| 5.3669**. For calibration, 003 graded **A at 3.644**, so 004
is **not there yet**.

I independently verified this in a clean production build (the previous dist
predated the current 004 sources by two days and could not have contained the work
it was supposed to evidence — I reclaimed it, rebuilt, re-served, re-captured with
the shipping harness). **Every band reproduces to four decimals.** The work is real
and it is in the built output.

Open residuals, largest first:

```
display    14.3046    lede       12.7701    terms      10.6657
fieldEmail 10.1237    plate       8.4842    labConfirm  8.3835
eyePass     8.1379    checkbox    7.1859    eyeConf     7.1219
oneacct     6.3291    labPass     5.5681    labFirst    5.5350
monogram    5.5289    labLast     5.2666    signin      5.1897
fieldConf   4.7994    fieldPass   4.6804    helpPass    4.5714
wordmark    4.1879    labEmail    3.5891    fieldFirst  3.1399
fieldLast   2.9323    orrow       2.4379
```

**Two of these are documented as investigated and deliberately NOT shipped.** Do not
"fix" them without first defeating the stated reason:

- **lede 12.7701** — not colour, not weight (rule 51 control), position already
  optimal (the control beats every offset), stems median 2.0 px in both images. A
  (size, scale) valley floor near 12.01 exists but it is the **rule 32 degeneracy**:
  a diagonal ridge a band mean cannot resolve into one pair. Shipping an
  undetermined pair would be guessing.
- **monogram 5.5289** — this IS the shape error, not a placement error
  (L +1.05 R −0.35 T −1.13 B −0.21; 1.40px narrow, 0.92px tall, aspect 1.291 vs
  1.343). Closing it means re-tracing `src/app/signup/Marks004.tsx`, and a
  non-uniform scale would buy the extents at the cost of the stroke widths.

Source files for 004: `src/app/signup/page.tsx`, `src/app/signup/phone-004.ts`
(the box geometry), `src/app/signup/Marks004.tsx` (the vector marks).

---

## 5. BLOCKED RIGHT NOW — read this before planning

**The independent grader for 004 died on account quota, not on a code failure:**

```
Agent terminated early: You've hit your weekly limit · resets Aug 11, 12pm (UTC)
```

It had reproduced my numbers exactly and was moving on to the images when it was
cut off. So **004 cannot be graded until the quota resets on Aug 11**, by Claude at
least. Options: have Codex grade it itself (it must be genuinely adversarial and
follow the method rules), or wait.

The grader brief is written and ready at `scratchpad/BRIEF-004.md` (see §8 for the
scratchpad path). Adapt its shape for later screens.

**Also blocked, needs KEVIN not code:** the release-frame ideal ranges for **KNEE**
and **SHOULDER**. `scoreShootingForm` still grades release-frame angles against
set-point ideals for those two, so **a textbook release scores 69**. This needs
Kevin's coaching numbers. Ask him.

---

## 6. How to continue — the cycle

1. **Read `basketball-analysis/docs/SCREEN-LEDGER.md` first, every time.** It records
   which screen is DONE, which is in progress, each screen's measurements, and the
   52 accumulated method rules. If any instruction conflicts with the ledger, the
   ledger wins.
2. Identify the screen in progress. If one is in progress, continue it, start nothing else.
3. Verify yourself before trusting any builder's report: `tsc`, production build,
   capture, measure against canonical.
4. Send that ONE screen to an independent grader. Fresh grader if already graded once.
5. **A/A+** → commit, push, mark DONE in the ledger *with its measurements*, reclaim
   that screen's `.next-*` dir, then start the next screen in order.
   **Below A** → fix the specific measured defects, largest mean|d| buy-back first,
   re-measure. Do **not** move on.

### The commands that actually work

```bash
cd /home/user/BasketballAnalysisAssessmentApp/basketball-analysis

# typecheck
npx tsc --noEmit

# build into a per-screen dist (never build into a dist a server is serving from)
NEXT_DIST_DIR=.next-004v npx next build

# serve it
NEXT_DIST_DIR=.next-004v npx next start -p 3181

# capture screen 004 with the SHIPPING harness (rule 1 — not a bare chromium)
cd docs/shotiq
S=<scratch>/cap004-scratch OUT=<scratch>/cap004 PORT=3181 ONLY=004 node capture-ios.mjs

# measure
python3 -m measure.report004 <render>.png <canonical>.png
```

The measurement library is **committed** at `basketball-analysis/docs/shotiq/measure/`
and has a README. **Use it — do not write your own.** It exists precisely because
throwaway toolkits kept being rewritten and kept disagreeing with each other.

---

## 7. Gotchas that have each cost real hours

These are the ones most likely to bite you first. The full set of 52 is in the ledger
under "Method rules" — **read them before measuring anything.**

- **Rule 1 — measure in the SHIPPING rasteriser.** `capture-ios.mjs` launches with
  `--font-render-hinting=none`. A bare `chromium.launch()` hints stems to whole pixels
  and shifts advances; that alone produced a false +5px advance defect.
- **Rule 2 — probe colour from ERODED STROKE CORES, never band medians.** A band median
  is mostly background and will tell you every colour is white.
- **Rule 25 — name your estimator for every number.** A ratio threshold without a named
  estimator is a hand-picked column waiting to happen.
- **Rule 30 — a null from a segmenter is a claim about the segmenter** until proven
  otherwise. "I found no rule there" ≠ "there is no rule there."
- **Rule 32 — the (size, scale) degeneracy.** A band mean cannot resolve a diagonal
  ridge into one pair. Don't report one ridge as two findings.
- **Rules 49/50 — a band window that clips its own ink measures agreement with the
  crop, not with canonical.** Check every window you invent.
- **Rule 52 (new, learned this session) — an orphaned `next dev` corrupts a concurrent
  production build, and the errors name the SOURCE.** All 95 pages failed with
  `<Html> should not be imported outside of pages/_document` and
  `Cannot read properties of null (reading 'useContext')`. Neither is true of this
  codebase. The tell is `react-dom-server.browser.development.js` in the stack — the
  *development* react-dom inside a production build. `pgrep -af "next dev|next start"`
  and kill it. A failure common to every page is a claim about the environment until
  proven otherwise.
- **F39 — a GENERATED file that is also COMMITTED is a defect waiting to happen.**
  `ShotIQ.xcodeproj` is XcodeGen output *and* committed. It went stale:
  `PoseDetection.swift` and `CapturedPoseImage.swift` were tracked in git and on disk
  but **not members of the target**, so the entire on-device pose feature was never
  compiled and the build failed with `cannot find type 'DetectedPose' in scope`.
  CI never caught it because `ios-appstore.yml` runs `xcodegen generate` first and
  overwrites the stale file — **a check that regenerates its own input cannot detect
  that the input was wrong.** Now fixed both ways (script regenerates unconditionally;
  committed project regenerated).
- **The container is ephemeral and HAS rolled back mid-session.** Local commits vanished
  twice; only what was **pushed** survived. Push early, push often.

### Standing rulings — do not violate these

- Never edit the four measurement-tuned type roles in `globals.css` (they carry the
  20 desktop screens graded B+).
- Scope a colour disagreement to the screen; never change a global token.
- Never delete a region or pad dead space to improve a score.
- Never build into a dist dir while a server is serving from it.
- State physically unreachable residuals **with their numbers** rather than forcing
  them and breaking another metric.
- Do not commit a tree that fails `tsc`, or a screen that breaks its size invariant
  (iOS 393pt wide; desktop 900×1440 with one sidebar).

---

## 8. Environment

- **Repo:** `baller70/BasketballAnalysisAssessmentApp`
- **Branch:** `claude/shotiq-production-build-txi5pl` — develop and push here.
  Do **not** push elsewhere without explicit permission from Kevin.
- **App dir:** `basketball-analysis/` (note: `deploy.sh` lives here, **not** at repo root)
- **Ledger:** `basketball-analysis/docs/SCREEN-LEDGER.md` (~200KB — edit it with a
  single `s.index()` + an assert on the slice length; a past double-index bug produced
  a 265MB file and a rejected push)
- **Measurement library:** `basketball-analysis/docs/shotiq/measure/`
- **Capture harness:** `basketball-analysis/docs/shotiq/capture-ios.mjs`
- **Canonical designs:** `<scratchpad>/canonical` (iOS 001–072),
  `<scratchpad>/canonical-desktop` (077–096)
- **Deploy:** `cd /opt/shotiq/basketball-analysis && bash ./deploy.sh` on the box.
  A long build **outruns the bridge's HTTP header timeout** — run it detached and poll
  a log, or you will think it died when it is still going.
- **iOS install:** `scripts/install-on-device.sh`, run on Kevin's Mac with the phone
  attached. `DEVICE_UDID` accepts **either** id `devicectl` prints — the Identifier
  column (`37711652-…`) or the hardware udid (`00008030-…`).
- **Disk:** builds are ~850MB each. Check `df -h /`. Kill orphaned servers; remove the
  dist of any screen already marked DONE.

### Two things that do NOT work in this environment

- **Headless Chromium cannot reach external HTTPS** through the egress proxy —
  `example.com` resets identically. Localhost capture is fine. Don't waste time on it.
- Earlier prompts referenced `$SCRATCH/SCREEN-LEDGER.md`, `$SCRATCH/verify-desktop`
  and `$SCRATCH/BRIEF-002.md`. **The scratchpad ledger does not exist** — the ledger is
  the repo one. The desktop regression guard is described in the ledger under
  "The desktop regression guard."

---

## 9. If you do nothing else

1. Read the ledger.
2. Finish **004** — it is the one screen in progress. Get it graded (quota permitting)
   or drive down `display 14.3046` / `terms 10.6657` / `fieldEmail 10.1237`, which are
   the largest residuals with no documented reason not to touch them.
3. Ask Kevin for the **knee and shoulder release-frame ideals**. A correct shot scoring
   69 is a real defect and it is blocked on him, not on code.
4. Push everything. The container has eaten local commits twice.
