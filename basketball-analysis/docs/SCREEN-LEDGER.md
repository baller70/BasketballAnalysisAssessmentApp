# Screen ledger — one screen at a time, finished, then the next

**Kevin's rule, overriding everything:** do not move on from a screen until it is
100% done. No partial work spread across screens. No coming back later.

> **Rebuilt 2026-08-05 05:20 UTC after a container rollback wiped the scratchpad.**
> The canonical design sets survived; this ledger, the briefs and the capture
> directories did not. Everything below was recovered from the commit messages on
> `main`, which is why the reasoning is written into them. Treat that as the
> lesson: **the scratchpad is not durable — git is.**

## Definition of DONE

1. Every canonical band present, in canonical order, at canonical position.
2. Type: cap height, advance width and ink density measured per ink run.
3. Colour: every role from **eroded stroke cores**, never band medians.
4. Geometry: cards, gutters, rules, bar strokes, icon sizes measured.
5. Imagery: right asset, right crop, right drawn size.
6. No overflow, truncation, overprinting, or one-word-per-line columns.
7. Reachable by a real user path AND deterministically by the harness.
8. Invariants: iOS 393pt wide; desktop 900x1440 with exactly one sidebar.
9. **An independent grader scores it A or A+.** Not "improved".
10. Committed and pushed.

## Order

iOS 001 -> 072, then desktop 077 -> 096.

## Status

| # | screen | state | grade | notes |
|---|---|---|---|---|
| 001 | splash | **DONE** | **A+** | second independent grader; A- refuted, all 3 defects closed |
| 002 | welcome | **DONE** | **A** | fresh grader refuted the A-; 6 defects closed; crossbar residual proven unreachable |
| 003 | sign-in | **DONE** | **A** | 4th grader; withdrew its own defect after its falsification proved unsatisfiable by construction; 3.644 mean \|d\| |
| 004 | create-account | IN PROGRESS | — | canonical is the FILLED state. Harness was reading a stale scratchpad route map and shooting the EMPTY form with "step fails 0" — fixed at 82a3a7f. display run solved 89.96 → 14.80 (scaleX 0.8539 → 1.0195, stroke 0.33); whole screen 11.457 → 11.112. Remaining bands, worst first: lede 21.19 (solved to 12.77 in-page, not yet baked), terms 20.08, labConfirm 16.45, monogram 13.80, oneacct 12.91 |
| 005+ | … | not started | — | |

## The native app has layout defects the 72 web rows above never measured

**Measured, with the type clamp in place, on the accessibility-size capture
(run 31017306748).** `docs/shotiq/simshot-layout-audit.py` reads the captured
PNGs — which nothing had ever done — and fails 8 of 75 screens:

| screen | defect, measured |
|---|---|
| 021 profile-menu | **13 consecutive short lines, narrowest 23px of 1178** — "DASHBOARD MODE" wraps as DASH / BOAR / D / MODE. **FIX WRITTEN, NOT YET VERIFIED** (f59bae6) |
| 005 create-account | 5 consecutive short lines, narrowest 67px |
| 058 shot-tracker | 5 consecutive short lines, narrowest 134px |
| 028 video-upload | 4 consecutive short lines, narrowest 65px |
| 044 form-score | 4 consecutive short lines, narrowest 127px |
| 024 elite-shooter-detail | ink down the right edge over 58% of the height; stat row overprints — `45.7%41.3%85.3%54.8%58.6%` with no gaps; tab row cut off |
| 040 analysis-result-overview | ink down the left edge over 74% of the height; tab row truncated |
| 026 analyze-hub | ink down the right edge over 19% of the height |

**THE CLAMP WAS NECESSARY AND IS NOT SUFFICIENT, and the record should say so.**
These were captured WITH the Dynamic Type clamp active, so they are not text-size
artefacts — they are defects at the design text size, and they are exactly what
Kevin meant by "almost every screen … alignment issues … running off the page".
Rule 38 explains why no capture had shown them; this table is what was actually
in the pixels once something looked.

### The native screens have no local verification loop — plan for it

This repo has **no Swift toolchain and no macOS**. A native fix cannot be
compiled, let alone measured, in this container: the only way to see whether it
worked is a simshots run on Kevin's Mac, which takes 11 minutes warm and has run
to 45+ minutes cold. So the web loop's rhythm — edit, rebuild, re-measure in
seconds — does not exist here, and pretending otherwise produces exactly the
failure this section is about: a fix asserted from reading the code.

Consequences to respect:
- **A native fix is UNVERIFIED until a capture comes back through
  `simshot-layout-audit.py`.** Say so in the commit, and do not mark anything
  done on the strength of the diff.
- Batch the *diagnosis* across screens if useful, but keep the *verification*
  per screen, because one capture measures all 75 at once — the run is the
  expensive part, not the screen.
- A cold run rebuilds DerivedData from scratch. Firing against a non-`main` ref
  costs the full build every time.

### The pattern behind 020, and why the earlier fix made it worse

020's segmented control used to collapse into "Analy sis" / "Traini ng". The
fix was `.fixedSize` on the control — which made it incompressible, so the
HStack squeezed the *next* most flexible child instead, and the label column
fell to under one word. **The defect moved; it did not go away.** Nothing
measured the screenshots afterwards, so it looked solved for months.

The mechanism to look for on 005, 058, 028 and 044: an over-budget `HStack`
containing both a `Spacer()` and a `Text`. Both are flexible, so the stack
splits the leftover width between them, and `Text` compresses furthest — so the
text loses. Removing the Spacer and giving the text column
`.frame(maxWidth: .infinity)` leaves nothing competing for the slack. Do NOT
reach for `.layoutPriority`: an HStack allocates to its least flexible children
first, so a `fixedSize` sibling already gets its ideal width, and a priority
number on the text column inverts that and starves the sibling instead.

Three of these edge findings needed a second estimator before they could be
trusted: a sheet over a dimmed backdrop shows its rounded top corner at both
edges and reads exactly 167 left / 152 right on FOUR different screens — one
shared component, not a defect. Counting edge pixels called all four clipped;
flagging on the vertical SPAN of the edge ink (a sheet corner spans ~3% of the
height, real clipping 19–74%) separates them.

**PAUSED, deliberately, and this is not the screen loop's fault.** Kevin's
phone was drawing the app clipped off both edges with the type oversized. That
is an app-wide defect on the surface he actually uses (native `ios-native`,
not the web tree these 72 rows measure), and it outranks fractions of a pixel
on `/signup`. Diagnosis, fix and guard are rules 37-38 and commits b77b89f /
94bf2ae. 004 resumes once the accessibility-size capture confirms or refutes
the fix — if it refutes it, the real cause is still loose and nothing else
matters until it is found.

## 003 — independent verification, before the grade

Re-measured from scratch rather than taken from the builder's report. The
measurement script shares no code with its solver.

- `tsc --noEmit` clean. Own production build into `.next-v3`, served on 3192.
- Capture via `ONLY=003`: 1/1, 0 gaps, 0 step failures, 0 wider than 393pt.
- Band alignment at matched threshold 160: **18 ink runs each side, worst
  |dtop| 1 device px, worst |dh| 1, mean dtop -0.06.** No shared sign, so no
  container offset (rule 15).
- Whole-screen mean |d| against canonical **3.772**, reproducing the builder's
  figure exactly by an independent route.
- **Desktop guard clean: 0 pixels differ** from the pre-003 baseline, and 077
  sits identically against canonical (mean 22.547 / 291,046 over 8 / 199,886
  over 32). Desktop DOM reads `rgb(17,17,17)` and `0px`, so the AppleMark and
  GoogleMark leak is closed in pixels and not merely in markup.

**Residual found here, then resolved — and it is NOT a defect, on any screen.**
The render's canvas is 1849 device px tall against canonical's 1844. Chasing it
gave a clean answer: **all 72 canonical PNGs are exactly 853x1844**, so the
canonical artboard is 393x850 pt (850 x 2.170483 = 1844.91), while the real
iPhone viewport this app renders into is 393x**852** pt (852 x 2.170483 =
1849.25). The 5 px is the artboard, not the app.

Consequences, which apply to every iOS screen and not just this one:

- **Never "fix" it.** Shrinking the capture viewport to 850pt to match would be
  gaming the metric against the real device size, and padding is already
  forbidden by the standing rulings.
- **Compare top-anchored, over the first 1844 rows.** Content is top-anchored
  and the ink extents agree exactly (y41-1730 on both sides here). A whole-image
  diff that bottom-anchors or resizes will manufacture a whole-screen offset.
- A grader reporting "the render is 5 px taller" has found the artboard, not a
  defect. Expect it on all 72.

### The grade, and why it moved

The fresh grader returned **A+** and attached a falsification to it: re-capture
with `--font-render-hinting=slight`, and if the lowercase x-height does not move
toward canonical and the headline's round-glyph overshoot does not collapse,
"residual §6 needs an app-side explanation and this grade drops."

**I ran it and it failed.** Whole-screen mean |d| went 3.7724 to 3.8553 — worse.
The three lowercase bands moved 0 / 0 / away. All six headline segment tops were
identical between `none` and `slight`.

The grader then verified the negative was a true negative rather than an inert
flag, which was the objection I could not rule out myself: hinting demonstrably
fired, snapping caps to exact integers (R 19.16 to 19.98, D 19.17 to 20.00,
L 19.16 to 20.00) and x-heights to exactly 15.00, with horizontal metrics
unchanged to 0.02 px — vertical-only, as `slight` should be. Grid-fitting
snapped x-height UP to 15.00 while canonical sits at 12.96-13.80. Snapping moves
to the nearest grid line, under 1 px; canonical is 1.2-2.0 px away. **It was
never reachable by that mechanism.**

The accepted explanation is the builder's, and it is app-side: canonical's body
face has an x-height 13.5% smaller relative to cap than Geist, the only
body-weight face in the pack (canonical 16.02/16.03 device px against Geist's
18.18/18.23 at matched extent). The grader independently re-derived it from
pixels — canonical's x/cap is 0.695-0.706 across five runs against the render's
0.772-0.783 — and independently confirmed the minimax: matching x-height needs
scale 0.894, which takes cap error from -0.25 to -2.36 device px, a 10x
degradation.

Grade **A**, not A+: the residual is real and page-wide at ~1.5 device px
(0.7 CSS px) on every lowercase run, so it is not at the rasteriser's floor. Not
A-, because A- requires a parameter change that was found and not made, and the
alternative was measured and is worse.

**The A is CONDITIONAL and the condition is open.** The grader's §6: the DISPLAY
face has deviations the Geist story does not explain — flat-cap 118.84 against
116.99 (-1.6%) while round-glyph height matches to 0.03 px; N stems 16.08/15.84
against 14.92/14.68 (-7.4%); word space 48.67 against 54.31 (+11.6%) while the
total block width matches to 0.15 px. Its ruling: if a closer display face
exists in the pack and was not tried, that is fixable and the grade drops to A-.

**It was not tried, and the challenge was well aimed.** All four cuts were then
solved to their own optimum, and **Bold does land the stem** — N stem 16.05
against canonical's 16.09, where Semibold reads 14.79.

It is still the wrong cut, and what settles it is rule 9's kind of measurement:
**I/N, the ratio of two ink widths inside the same run, from which scaleX
cancels entirely.** Canonical 0.3574; Semibold 0.3590, a 0.4% miss; Bold 0.4196,
out by 17%. Bold reaches the stem only by being squeezed to scaleX 0.789, which
thins the verticals into place while leaving horizontals and bowls Bold-thick,
and its ladder sits above 1.0 at every level (1.075-1.131) — genuinely heavy by
rule 4. Semibold is the only one of the four that straddles.

The stem residual is then unreachable, with rule 13's algebra. Canonical needs
I/N 0.3574 and stem/I 0.9013 simultaneously. Across the four cuts I/N RISES with
weight (0.2777 / 0.3477 / 0.4194 / 0.4821) while stem/I FALLS (0.8874 / 0.8432 /
0.8156 / 0.7807). Monotone in opposite directions, so I/N pins the weight just
above Semibold where stem/I is 0.843 against 0.9013 — 6.9% out, worse in either
direction, and these are four discrete OTFs with nothing in between.

The round-glyph overshoot is a family property, not a weight: every cut
overshoots the flat cap by +2.002 where canonical overshoots by +0.114.

**One real defect fell out of the exercise.** Word spacing was 7.14, putting the
word space 11.9% wide and dragging "IN" right by up to 3.80 px. Swept, 5.90 is
the joint minimum of glyph-position RMS (2.11 -> 0.98) and display-band mean |d|.
Verified independently: whole screen **3.7724 -> 3.6792**, display band
9.989 -> 8.568, and the 2,376 changed pixels are confined to y227-344 x302-382,
which is exactly the word "IN". Desktop 077 stays byte-identical to the pre-003
baseline (md5 69b2184b0f0e7553108d23c2aae71071), so the change is fully
phone-scoped.

The render therefore changed and the A no longer applies to it. A **fresh**
grader is running on the new capture (`verify-003b`, md5
ac331962d5c481cf477707e3d2b73ee6).

### 003 FINAL — A, closed

Fourth grader, on the shipping capture `834c8b18`. It graded A- on the footer
being undersized, then **withdrew its own defect** when its falsification was
run: the three targets are inversely coupled and mutually unsatisfiable
(size-ratio needs x1.065, its shape target x0.973, canonical's actual shape
x0.921), and its own `shape.py` table already contained the refutation with the
sign misread. Verified here independently by a different estimator: footer1's
`o` reads width x0.909 and height x1.103 against canonical, so no font-size
fixes it.

It also retired its ratio estimator as a fault-detector: "the face cancels
between two runs of one image" needs one shared face AND one shared scale on
both sides. Canonical has that (its `o` w/h fingerprint spans 0.826-0.869 across
five body runs). The render does not, because every run was solved to its own
advance and cap. The estimator survives only as a dispersion statistic.

**Accepted residuals, all bounded and recorded:** the body x-height and
wordmark/H1 letterform pack residuals; per-run vertical dispersion of 8.6-11.3%
including three runs the baseline fix itself regressed; and footer1 interior
word displacement of -2 to -3 px driven by the apostrophe and question-mark
advances, with both line ends correct to 1 px.

Final: whole screen **3.644** mean |d| (7.015 at the start), worst residual over
27 runs 0.74 device px of cap-top, 19/19 bands within 1 row, desktop 077
byte-identical to baseline, functional contract green.

### Defect 1 of 2 closed — the baseline split

Re-solved by moving size and scaleX together (rule 26), never font-size alone.
Verified here independently, sub-pixel bottom 50% crossing, R stem of "Remember
me" at x97-98 against F stem of "Forgot password?" at x604-605:

| | R baseline | F baseline | split |
|---|---|---|---|
| canonical | 1038.49 | 1038.68 | **0.19** |
| before | 1038.29 | 1040.36 | **2.07** |
| after | 1038.29 | 1038.34 | **0.06** |

Inside the pinned band of 0.4, and tighter than canonical's own internal split.
Whole screen 3.6792 -> 3.6546. Desktop 077 still byte-identical to the pre-003
baseline (md5 69b2184b0f0e7553108d23c2aae71071). The wordmark is the remaining
reachable defect.

### Final state under grade

Capture `verify-003c`, md5 `333f26638b495a3d0082c622efe7c823`, byte-identical to
the builder's final reported state and to the harness's own capture. Committed
through `aa1021e`.

- Whole-screen mean |d| against canonical **3.655**. Across the whole
  engagement: **7.015 -> 3.655**.
- Worst residuals over all 27 runs: capTop 0.72, run-extent 1.29, inkL 0.37,
  advance 2.32 (the display block width — the stated word-space trade), ink 4.4%
  (mask bullets).
- iOS harness 72/72, 72 distinct md5s, 0 gaps, 0 step failures, 0 wider than
  393pt. Desktop 077 unchanged from the pre-003 baseline.
- Functional contract re-run green: reveal toggle, live validation, empty-submit
  error and focus, bad-password error, real sign-in to /results/demo, signed-in
  redirect, both links.
- `tsc --noEmit` and `npm run lint` both clean.

**A worked example of rule 25.** The builder and I measure the checkbox-row
baselines with different estimators and get absolute values ~1.2 device px
apart — it reads canonical 1039.68/1039.70 and the render 1039.49/1039.50, I
read canonical 1038.49/1038.68 and the render 1038.29/1038.34. The offset is
consistent across BOTH images, so the quantity that matters agrees: split 0.01
against 0.06, both far inside the 0.4 band. Absolute positions from two
estimators are not comparable; a difference taken within one estimator is.

### A- defects closed — all four verified independently

| item | canonical | before | after |
|---|---|---|---|
| Google red (interior shell) | (240.4, 55.6, 45.0) | worst ch 11.4 | **0.6** |
| Google yellow | (252.2, 199.8, 15.7) | 11.8 | **0.8** |
| Google green | (33.6, 164.7, 82.4) | 18.4 | **0.6** |
| Google blue | (60.4, 135.0, 250.5) | 6.5 | **1.0** |
| lede L1->L2 baseline delta | 38.255 | 37.323 (-0.932) | **38.323 (+0.068)** |
| OR centre gap | 69.12 | 71.00 | **69.51** |
| OR rule lengths | 339.70 / 339.39 | 338.00 / 338.00 | **339.40 / 339.15** |
| iOS whole screen mean \|d\| | — | 3.6546 | **3.6443** |

By region: lede 9.204 -> 9.022, OR 1.796 -> 1.784, Google mark 9.133 -> 8.305.

**Desktop 077's baseline was NOT changed after all, and my replacing it was a
mistake I had to undo.** I told the builder to put the palette fix in shared
markup because canonical disagrees with the official palette on both surfaces,
and pre-emptively swapped the baseline. The builder measured the gate I had
attached — "confirm 077 improves" — and it failed: whole-image mean |d| 22.5465
-> 22.5467, mark-against-mark aligned on their own bboxes 59.03 -> 59.30, both
marginally worse. Only the per-arc plateau distance improved, 45.1 -> 38.0.

The gate is blind here and the builder said so: 077's own Google mark is 16x16
sitting 88 px from canonical's 21x19, so a pixel metric there compares our mark
against canonical's button interior and cannot score colour at all. It is very
likely the shared change would be right. **It stays out anyway** — 077 is not
the screen in progress, and "the metric cannot see it, trust me" is not a
standard worth starting to accept, least of all when it favours the change I
asked for. Inert `data-arc` hooks and the full analysis sit in `page.tsx`; it is
a four-line promotion when 077 gets its pass, by which time its mark will be the
right size and place for the guard to see the result.

Baseline restored to `69b2184b0f0e7553108d23c2aae71071` and confirmed against a
fresh capture. I caught it only because the builder's report said 0 differing
pixels where mine had said the baseline moved.

**Two of these needed my estimator fixed before they read true**, which is rule
25 twice more. An integer-row baseline probe said the lede fix made things
WORSE (38 -> 39 against canonical 38); sub-pixel says -0.932 -> +0.068. And the
OR rules returned "no runs" twice before I noticed the plateau was being
estimated across the loud "OR" glyphs.

### Grade bands pinned for the next 003 capture

The grader fixed these in advance so the grade cannot drift, and it reclassified
its own largest defect against its own interest — D1, the body x-height, is now
an **unreachable pack defect rather than a parameter defect**, because the only
lever is scale and scale is at its constrained optimum. It also corrected the
gap UPWARD while doing so: +10.6% on its estimator, not the +8.2% it graded on.
The reclassification is about reachability, not magnitude. Sizing to fix
x-height would take 12 advance widths from matched-to-0.3% to wrong-by-10.6%,
which is the strongest fidelity result on the screen.

- Baseline split <= 0.4 device px **and** wordmark H/S within ~2% of 1.146 -> **A**
- One of the two -> **A-**
- Wordmark measured across all three Boxed cuts with none reaching 1.146, i.e.
  it becomes unreachable like the H1, and the baseline closed -> **A**
- **A+ is NOT available on this screen with the current pack.** A 10.6% gap on a
  within-run outline invariant is roughly 20x the rasteriser floor. Do not let
  anyone argue it up.

A method note worth keeping: the first pass of this verification used one
permissive threshold and produced five false findings of 100+ px band
displacement, which were canonical's unsharp halo bridging bands the render
keeps separate. Sweeping the threshold (rule 6) collapsed the worst case to
1 device px. Rule 6 is not optional.

## The iOS baseline — 72 screens, and evidence the method works

Full sweep against the current build: **72/72 captured, 72 distinct md5s, 0
gaps, 0 step failures, 0 wider than 393pt.** Per-screen numbers in
`$SCRATCH/verify-ios-full/BASELINE.json`, measured top-anchored over canonical's
1844 rows (see the artboard note above).

The result is the strongest evidence so far that the one-screen-at-a-time method
is doing something real rather than moving numbers around. **The three finished
screens are the three best on the entire set, and it is not close:**

| screen | mean \|d\| | state |
|---|---|---|
| 001 splash | **2.493** | DONE, A+ |
| 003 sign-in | **3.772** | graded A, display-face condition open |
| 002 welcome | **6.528** | DONE, A |
| 033 live-form-feedback | 15.109 | best untouched screen |
| … | … | |
| 023 photo-review-crop | 55.018 | worst |

Across all 72 the mean is 30.488 and the median 29.390, so the untouched screens
sit around 30 and the finished ones sit under 7 — a factor of four to twelve.
003 currently measures better than 002, which a fresh grader scored A.

Worklist by distance, worst first: 023 (55.018), 018 (50.024), 060 (49.756),
068 (48.674), 051 (46.947), 053 (46.825), 042 (46.632), 061 (45.199),
055 (44.014), 007 (43.731). Note 018 was already known to have no phone
composition at all — it renders a reflowed desktop tree — and the measurement
independently puts it second worst.

Same caveat as the desktop table: this is a **regression and triage** baseline,
not a grade. A screen is compared to its own earlier capture, and the ordering
tells you where to spend a cycle, nothing more.

## The desktop regression baseline — 20 screens, rebuilt

`$SCRATCH/verify-desktop` now holds all 20 desktop screens captured from the
current build, with per-screen numbers in `BASELINE.json`. It replaces
`grade-web-r9`, which predates the PR #53 merge and therefore reports a
regression on every screen the merge touched. The capture asserts what it always
did: 20 distinct hashes, no overflow, one rail each.

**These numbers are a REGRESSION baseline, not a fidelity score.** They run from
18.058 (096) to 54.195 (094), mean 31.287, where iOS 003 sits at 3.772 — and
that gap is mostly structural, not quality. Canonical puts navigation in a top
bar so its content starts at x=0; this app puts it in a 196px sidebar by
standing ruling, which displaces every screen horizontally. No amount of type
work closes that, and a large absolute mean here means nothing on its own.
Compare a screen only against its own earlier capture.

Byte-identity is the stronger test where it is available. Desktop 077 came back
md5 `69b2184b0f0e7553108d23c2aae71071`, identical to the pre-003 baseline — the
capture harness's own duplicate check flagged it, which is a better proof that
003 changed nothing on desktop than any pixel threshold.

Worst first: 094 (54.195), 084 (43.082), 082 (38.836), 086 (37.867),
087 (35.904). Best: 096 (18.058), 081 (18.950), 095 (20.822).

## Method rules — thirty-six, each learned by getting something wrong

1. **Measure in the shipping rasteriser.** `capture-ios.mjs` launches with
   `--font-render-hinting=none`. A bare `chromium.launch()` hints stems to whole
   pixels and shifts advances — that alone produced a false +5px advance defect
   on 001, and explained an entire grader-vs-builder disagreement.
2. **Weight on the GREEN channel.** Chromium applies LCD subpixel AA to some runs
   at some sizes (fringes ~12px and ~21px CSS, neutral at 30px+); canonical is
   greyscale. On luminance such a run reads +7 to +13% heavy — a false defect.
3. **Ink on ORANGE runs on the BLUE channel.** Canonical's orange has B = 0.7-3
   and its black B = 0, so on blue both read as full ink and the measurement is
   colour-independent. On 002 a label read -5.1% on green and was called an
   outlier; on blue all four labels sat at -1.4 to -2.5% and it never was one.
4. **Area-ratio ladder for weight**, not raw density: area at coverage
   .25/.4/.5/.6/.75/.9. Below 1.0 at EVERY level = genuinely light; straddling
   1.0 = matched with a halo difference.
5. **Row-segment then column-segment. Never a fixed crop box or y-window.** A
   solid block adjacent to a run welds them into one row-run — 001's mark plate
   (y535-681) did this twice and produced two false findings of mine.
6. **Match thresholds.** Canonical carries a soft halo a crisper render does not;
   sweep rather than picking one.
7. **Cap height on a stem-only glyph (the I) at 50% coverage** — colour-independent.
8. **Canonical PNGs are unsharp-masked.** A small-type stem reads
   `248 / 255 / [74 85] / 255 / 248`, ringing BOTH sides. Below ~30px an eroded
   stroke core is UNOBTAINABLE — a colour defect reported from one cannot be
   real. Solve small-type colour from total ink at matched geometry, hue fixed by
   an R:G:B ratio over a large sample.
9. **Ladder tops read 0 on grey runs** — canonical has 10-14px above 0.8 coverage
   no flat-colour render can produce. Unsharp-mask overshoot, not ink.
10. **Font weight can silently resolve DOWN.** Boxed registers 400/600/800, so
    `font-medium` (500) rendered as 400 on 001.
11. **Chromium pixel-snaps background boxes to whole CSS pixels.** A rule authored
    at 828.5 device px with a 1.88px height painted at 829.11 / 2.170. Draw
    hairlines as `<rect>` in an SVG whose viewBox is 1 unit = 1 canonical device px.
12. **Text raster positions quantise** to whole device rows, so a cap-top has a
    plateau of reachable values. Probe the plateau and centre inside it.
13. **Prove a residual unreachable with algebra plus the measured alternative.**
    On 002 the display crossbar could not be matched: with font-size f, scaleX s
    and stroke t, the shape parameter r = t/f had to satisfy stem/width ~ 4.95 AND
    crossbar/cap ~ 0.64 — a 3.05x disagreement, invariant under scaleX and scaleY.
    The alternative cut was measured and shown worse. That is what "unreachable"
    must look like, not "I tried and it did not work".
14. **Solve related runs jointly, not one at a time.** Two runs sharing a token
    trade error back and forth indefinitely when tuned separately. On 003 body1
    and remember sat at -5.0% and +5.2% ink through several rounds of
    single-run tuning and closed as soon as they were solved together.
15. **Cap-top deltas that share a sign are ONE container offset.** On 003 five
    unrelated runs at three sizes read -3.32, -4.20, -3.35, -2.67 and -2.02:
    nothing positive. A per-run type error scatters around zero. Fixing that
    with five compensating leading tweaks lands the cap tops and leaves every
    inter-band gap wrong, and a grader measures gaps. After the container fix
    the same runs read +0.22, +0.28, -0.31, -0.32 and +0.33.
16. **A media query scopes CSS; it does not scope an SVG attribute.** 003's
    phone CSS lives in `@media (max-width: 767.98px)` and is genuinely
    desktop-neutral — but two ink corrections were made as markup attributes on
    `AppleMark` and `GoogleMark`, which are shared components, and they painted
    at every viewport. Route the correction through the media query instead: set
    `fill` on the path from inside it, and for a stroke keep `stroke="<colour>"`
    permanently with `stroke-width="0"` in the markup and raise the width only
    inside the query — a zero-width stroke paints nothing.

17. **Ask what STATE canonical is in before measuring a single band.** Canonical
    003 is not an empty sign-in form — it shows a typed address, a 16-character
    password masked to 16 bullets, a green validation ring and two "Looks good."
    lines, all of it live validation that does not exist until the player types.
    Measuring it against a default render compares two different screens, and
    several bands have no counterpart at all. The capture harness now has `fill`
    and `blur` steps for this; put the state in the route map so it is reached
    the way a player reaches it. **Check 004-007 for the same thing before
    starting them** — every form screen is a candidate.

Also: **check the ASSET, not just the CSS** (002 drew an entirely different
photograph at the right size and position), and **a large desktop-guard diff is
often live data** — 1,495 of 1,508 differing pixels on one run were 079's date
string rolling over at midnight.

18. **`tsc --noEmit` is not the lint gate.** CI ran red for ten commits on two
    unused constants in `phone-003.ts` that ESLint treats as errors and tsc does
    not flag at all under this config. Every verification runs `npm run lint`
    alongside tsc, and the CI conclusion gets checked after pushing rather than
    assumed.
19. **Ask a grader for a falsification, then actually run it.** 003's A+ came
    with one, it failed, and the grade moved to A. A grade whose reasoning has
    not been tested is an opinion. Equally: when the test comes back negative,
    check the instrument fired before believing the negative — `slight` hinting
    could have been inert at this scale, and the proof it was not is that caps
    snapped to exact integers while horizontal metrics held to 0.02 px.
20. **Try every cut in the family before calling a face residual unreachable.**
    003's display solve compared two of four Tungsten cuts and declared the
    better one final. A 7.4% thin stem is what an untried heavier cut would
    move. "Alternatives measured worse" means ALL of them.

21. **A ratio taken INSIDE a run is scaleX-invariant, and that is what identifies
    a face.** On 003 the display stem pointed at Tungsten Bold, and Bold does
    land it — 16.05 against canonical's 16.09 where Semibold reads 14.79. What
    disproved it was I/N, the ratio of two ink widths in the same run: canonical
    0.3574, Semibold 0.3590, Bold 0.4196. Absolute widths can always be fitted
    with scaleX; a within-run ratio cannot. Reach for one before concluding a
    face is right or wrong.
22. **Segmenting an N returns `nan` on exactly the cuts under test.** Its
    diagonal welds to the left stem near the top and the right stem near the
    bottom, so demanding three clean column segments fails on heavy weights —
    the ones a stem investigation is about. Read the RIGHT stem across the top
    of the glyph and the LEFT stem across the bottom. That reproduces
    canonical's 16.08 / 15.84 to within 0.02.

23. **md5 detects duplicates, NOT regressions.** Re-running the full iOS sweep
    after the 003 word-spacing change, four screens changed hash — 003 plus
    021, 041 and 071. Measured, the three extras differ by a **max delta of
    1 to 3 with ZERO pixels above 8**: rasteriser jitter between identical
    captures of the same build, not a leak. 003's real change reads 2,376 px
    above 8 with a max delta of 255. So md5 keeps its actual job — catching a
    redirect that ate a screen, which is what found 072 == 048 — and regression
    is judged on a pixel threshold. The desktop side already knew this shape:
    8 of its 20 are not byte-stable run to run. On iOS it is 3 of 72.

24. **Scrutinise a measurement that favours the build HARDER than one that does
    not.** Running the second grader's falsification, a hand-picked column band
    on the m's left stem gave x/cap 0.7336 -> 0.7039 under a x1.10 scale — a
    move of -0.0297, past the grader's own +/-0.02 threshold, which by its
    stated criterion would have invalidated its largest defect and raised the
    grade. Re-measured by rule 1 — per-column sub-pixel crossings across the
    whole run — the move is **+0.0025** and the finding stands. The wrong answer
    was the flattering one, it came from the exact shortcut rule 1 forbids, and
    it was one step from being reported. Three of this screen's false findings
    have now come from hasty measurement; this is the only one that would have
    been believed because it was welcome.

25. **A ratio threshold without a named estimator is a hand-picked column
    waiting to happen.** The grader set +/-0.02 on x/cap without saying how to
    measure x/cap, and the two reasonable readings disagreed by more than the
    threshold. The mechanism is sub-pixel phase: at a different size a glyph
    lands on a different phase, one column's top crossing moves ~0.5 px, and on
    a ~12 px x-height that is ~4% — about 0.03 on the ratio, almost exactly the
    spurious move. Percentile-over-all-columns averages the phase out. **Every
    threshold this project states must name its estimator.**
26. **Size and scaleX move TOGETHER, and that is the vertical degree of
    freedom.** Each run here is solved with its own size and its own scaleX, so
    a run can be made taller while holding its advance — and that is how 003's
    baselines came apart: "Forgot password?" was given a larger size with a
    narrower scaleX than "Remember me", both landed their advances, and the
    taller run split the baseline by 2.07 px against canonical's 0.19. Proof it
    is vertical-only rather than a size increase with tracking compensation:
    per-glyph ink widths match canonical at ratio 1.0000 and the gaps match too.
    **Never close a baseline by changing font-size alone** — the horizontal
    metrics on this screen are right (12 runs matched to 0.3%) and a bare size
    change moves them off.

27. **A brand palette is not evidence that the palette is right.** 003 shipped
    the official Google marks — `#EA4335 / #FBBC05 / #34A853 / #4285F4` — and
    every review passed over them because they were obviously correct. Canonical
    uses none of them: `#F0372D / #FDC80F / #21A552 / #3C86FA`. The thing that
    hides a defect like this is that it looks like the answer.
28. **Read a flat fill from the INTERIOR, never from its most saturated pixel.**
    Canonical is unsharp-masked, so the extreme pixel is overshoot. Probing the
    Google yellow by peak saturation gave (255, 204, 1); the distance-shell
    plateau at d in [3,4) — mask by hue, Euclidean distance transform, average
    only that shell — gives (252.2, 199.8, 15.7). Rule 8 applies to fills and
    not just to type.
29. **To rule out canonical's capture chain, measure a fill you already agree
    on.** The obvious objection to any colour finding is that canonical's export
    moved it. Three flat fills on the same image answer it: orange plate
    (252.0, 55.7, 1.5) against our (253, 55, 1), black (2.7, 2.3, 2.1) against
    (0,0,0), white (254.1) against (255) — all within 2 units, while the Google
    arcs differ by 6-20. A chain that leaves orange, black and white alone did
    not move the arcs.

30. **A threshold computed from a contaminated plateau reports NOTHING, which
    looks like no data rather than a broken read.** Measuring 003's OR rules,
    my first two attempts returned "0 runs". The rules are a hairline peaking at
    only 0.27 coverage while the "OR" glyphs between them peak ~10x higher, so a
    plateau estimated across the whole row lands the 50% threshold above the
    entire feature. Estimate the plateau OUTSIDE the loud neighbour. A null from
    a segmenter is a claim about the segmenter until proven otherwise.

31. **Do not replace a baseline before the change that justifies it has passed
    its own guard.** I swapped the desktop baseline in the same cycle I asked
    for a shared-markup change, the change failed its gate and was reverted, and
    the baseline sat wrong until the builder's report contradicted mine. A
    baseline is only as good as the last measurement that confirmed it — update
    it after the guard passes, never in anticipation.

32. **Matching a run's ADVANCE does not pin its SIZE — the two are degenerate.**
    Every run on 003 was solved to canonical's advance width, which leaves a
    whole family of (size, scaleX) pairs and lets the solver pick a wrong one
    silently. It did: `acct1` landed at size 12.482 with scaleX 0.9171 where
    `helpEmail` sits at 12.548 / 0.8149. Canonical's footer-to-helper size ratio
    is 1.0679; ours was 0.9947 — the footer is ~6.5% undersized and scaleX
    stretched it back onto the right advance. Nothing in an advance-based fit
    can see this.
    **Pin size from a within-image ratio between two runs, then let scaleX take
    up the advance.** An o-height ratio between two runs of the SAME image is
    exactly their font-size ratio, because the face cancels — which also makes
    it immune to the adjudicated x-height residual. A size-invariant shape
    check corroborates: `o`-width/`o`-height put canonical's five body runs in
    a 5.2% band while ours had the footer 4-15% off its own ramp.

33. **A falsification can be unsatisfiable by construction — check BOTH branches
    are physically reachable before running it.** 003's fourth grader asked for
    o w/h to "fall from 0.777 to 0.842" (0.842 is higher than 0.777 — the
    sentence is incoherent on its face) and for w/h and size to rise together.
    At a pinned advance they cannot: width goes as f·s and advance goes as f·s,
    so pinning the advance pins the width, height goes as f alone, and therefore
    **w/h goes as 1/size**. Its confirm branch was impossible for any render to
    satisfy, so the outcome fell in the gap between its two branches. A test only
    one branch can pass is not a test, and the claim it defends does not survive
    its removal. The grader found this itself and withdrew the defect.
34. **Matched width with excess height means the FACE, not the size.** The
    footer's `o` measures width x0.909-0.986 and height x1.068-1.103 against
    canonical depending on estimator — every estimator agrees on the direction.
    No font-size produces that: raising size worsens the height, lowering it
    worsens the width. Read the two axes together before calling anything a size
    error; a height gap alone is not evidence.

35. **The scratchpad toolkit had a crossing bug that inflated every extent by
    ~1 px, and it is invisible in deltas but fatal in ratios.** Its `cross()`
    placed the trailing edge at `i+1+frac` instead of `i+frac`. A delta between
    two runs measured the same way cancels it; a RATIO does not.
    **The display I/N figures in this file are affected.** Recorded as canonical
    0.3574 / Semibold 0.3590 / Bold 0.4196; re-measured with the corrected
    library, canonical reads **0.3426** and the shipped Semibold **0.3552**. So
    Semibold is ~3.7% off rather than the 0.4% recorded, and Bold's ~17% miss
    still loses by a wide margin — **the shipped decision stands, the precision
    claim does not.** Do not compare a new I/N against 0.3574.
    The committed library at `docs/shotiq/measure/` is the corrected one; every
    number in this file measured before it should be treated as an estimator of
    unknown calibration until re-run.

36. **A React portal cannot be hidden by a wrapper — gate it on the viewport.**
    `PhoneShell` portals into `<body>` as `position:fixed; z-index:60;
    max-width:393px`, so a `md:hidden` div around the *call site* never applies:
    the portal subtree is not a descendant of it and does not inherit
    `display:none`. Three call sites did this and the 393pt phone screen painted
    over the desktop app at every width. Use `usePhoneViewport()`, which exists
    for exactly this and says so in its own docstring.
    **Two of the three only appear on an account with NO DATA**, which is why
    every capture missed them — the grading account is seeded and Kevin's is
    empty. `docs/shotiq/phone-leak-audit.mjs` is the guard; it walks the app
    signed in at 1512x900 and fails on any visible fixed 393pt panel. Its route
    list is overridable with `ROUTES=` precisely because a seeded account cannot
    reach an empty state, and that is how the second leak was proven.

37. **"How this reaches the user" is a measurable claim, and I asserted it from
    a config file instead of measuring it.** I read `server.url` in
    `capacitor.config.ts`, saw the live host, and told Kevin — repeatedly, over
    days — that no Xcode build was needed. Two independent things falsify that,
    and one log line would have caught either: `server.url` is frozen into the
    binary at build time, so the value in the *repo* says nothing about the app
    already *installed*; and the phone does not run that project at all, it runs
    native SwiftUI from `ios-native/`. The evidence was one `device`-lane log
    away the whole time (`Debug-iphoneos/ShotIQ.app`, Swift files compiling).
    The same discipline the rest of this ledger applies to pixels applies here:
    **read the artefact, not the source that supposedly produced it.** Kevin
    kept saying he could not see the work; each time I re-explained the theory
    rather than checking what was actually on the device. When someone reports
    that the output is missing, that is data about the pipeline — treat a user's
    "I don't see it" exactly like a failing measurement.

38. **A capture at one configuration is not evidence about the configurations
    users run.** Kevin's phone was drawing screens wider than the display,
    centred and clipped off both edges — wordmark gone under the notch,
    "Progress" truncated to "Progre..." — while all 74 simulator screenshots
    came back clean. Both were true. A freshly created simulator boots at the
    DEFAULT text size, and that is the single configuration in which the defect
    is invisible.

    The defect: all ~176 type declarations in `ios-native` are
    `Font.custom(_:size:)`, which scales with the phone's Text Size setting,
    while everything around it — column widths, paddings, glyph sizes, the 853px
    canonical geometry — is fixed. Above the default the type grows and its
    containers do not, rows sum past the viewport, and the screen goes wide and
    centred (the same end state `CanonicalPhoto.swift` documents for an
    oversized child). There was not one `fixedSize:`, one `relativeTo:` or one
    `dynamicTypeSize` clamp in the whole target.

    This is the THIRD instance of one pattern, and the pattern is what matters:
    the grading account is seeded where Kevin's is empty (rule 36); a phone
    capture says nothing about the desktop tree at 1512px; and now, every
    capture ran at one text size. **Each time, the harness sampled the
    configuration where the bug does not exist and reported a clean bill of
    health.** Before trusting any sweep, ask what it holds FIXED that a real
    user varies — account state, viewport, text size, locale, reduce-motion —
    and either vary it or write down that the sweep says nothing about it.
    `scripts/simshots-config.sh` now pins the capture at `accessibility-medium`
    for exactly this reason, and it is re-included in `.gitignore` because the
    broker clones fresh and an untracked config would silently restore the
    blind spot.

39. **A CI job that dies mid-step is a null, and a null is not agreement.** The
    unclamped falsification arm (run 31021077649) was the one piece of evidence
    that could have confirmed *or refuted* the Dynamic Type diagnosis. It died
    14 minutes in: "Run guarded Xcode job" still marked in_progress, the upload
    step never reached, no artifact, and the logs 404 because GitHub never
    received them either. A runner interruption on the Mac — the device build
    and the clamped capture on the same runner either side of it both finished.

    The failure mode to guard against is quiet: an experiment set up to
    challenge a belief produces nothing, and the belief simply survives
    unchallenged. It is very easy to write "the run didn't come back, but the
    clamped arm looked fine" and move on, which converts a missing measurement
    into soft support for the claim. **The clamped arm can only show that the
    clamp pins layout across text sizes; it cannot show that unclamped type was
    what broke Kevin's phone.** That remains unproven, and the arm is queued
    rather than dropped.

    Two mechanical tells that a run produced nothing, both cheap to check before
    reading any pixels: `list_workflow_run_artifacts` returning `total_count: 0`,
    and a job whose steps show a later step still `pending` while the job itself
    reads `completed`. Also note the job API can serve stale `in_progress` state
    for a while — this job read as running 30 minutes after its own
    `completed_at`. Trust `completed_at` and the artifact list, not the status.

- Never edit the four measurement-tuned type roles in `globals.css`.
- Scope a colour disagreement to the screen; never change a global token — those
  roles carry the 20 desktop screens graded B+.
- Never delete a region or pad dead space to improve a score.
- Never build into a dist dir while a server serves from it.
- State physically unreachable residuals with their numbers rather than forcing
  them and breaking another metric.
- Do not commit a tree that fails `tsc` or a screen that breaks its size invariant.

## The desktop regression guard — how to run it properly

A screen that shares a route with a desktop screen needs a real before/after,
not a diff against whatever capture happens to be lying around. `/signin` draws
both iOS 003 and desktop 077, so 003 was guarded like this:

1. `git worktree add --detach <dir> <commit-before-this-screen>` and symlink
   `node_modules` into it. This gives a true "before" without touching the
   builder's working tree while it is still running.
2. Build both trees into their own `NEXT_DIST_DIR`, serve on their own ports.
3. Capture with a **bare `chromium.launch()`** — `capture-web.mjs` uses no
   flags, and every desktop grade on record was made in that rasteriser. Using
   `--font-render-hinting=none` here (correct for iOS) shifts text and swamps
   the diff. The two harnesses genuinely disagree, so never compare across them.
4. Capture `/signin` **signed out** in its own context, and assert the URL did
   not redirect.
5. Compare BOTH captures to canonical, not just to each other. "Changed" and
   "regressed" are different findings and only the second one matters.

Doing this on 003 separated two effects that a single diff would have blamed on
the screen in progress: 86,798 pixels moved since the last Aug 4 capture, of
which only 163 were the screen's own work.

## HOW THIS ACTUALLY REACHES KEVIN — the step that was missing all along

Kevin could not see any of the work, and the reason was not the branch. It was
that **nothing in CI deploys the live site.**

- **CORRECTED 2026-08-05 — the two bullets that used to sit here were both
  wrong, and between them they hid every screen change from Kevin for days.**

  Wrong claim 1: "the iOS app is a Capacitor shell, so it loads the live web
  app and no Xcode build is ever needed." Two separate errors.

  a. `server.url` in `capacitor.config.ts` is **compiled into the binary at
     build time.** An app installed *before* that line pointed at the live host
     keeps loading whatever URL it was built with, forever. A web deploy can
     never reach it. "No Xcode build is needed" is only true of a build made
     *after* the config changed — i.e. it is never true of the build already on
     the phone.
  b. More fundamentally: **the app on Kevin's phone is not the Capacitor shell
     at all.** It is a native SwiftUI app at `basketball-analysis/ios-native/`
     — 18,352 lines across `Screens/{Onboarding,Auth,Home,Capture,Analysis,
     Training,Elite,Goals}`, `Components/` and `Core/`. That is what the
     `device` lane builds and installs (run 31009524048 log: `Emplaced …
     Debug-iphoneos/ShotIQ.app`, then `App installed: bundleID
     com.baller70.shotiq`). Both iOS projects exist in the tree; only
     `ios-native` ships.

  **Consequence for this ledger's method.** A web deploy updates the *web* app
  and nothing else. Getting a screen onto the phone needs an Xcode build via the
  broker. So iOS screen work has TWO surfaces to keep in step — the phone tree
  in `src/components/shotiq/phone/` and the Swift screen in `ios-native/` — and
  a screen is not truly delivered to Kevin until the native side carries the
  same change and a `device` build has run. The commit history shows this has
  been happening (`iOS carried the same wrong hairline colour as web`,
  `confirmGreen was wrong on both platforms`), but it was never written down,
  so every wakeup rediscovered the wrong story.

- **Broker lanes** (repo `baller70/kcloud-xcode-runner`, self-hosted runner on
  Kevin's Mac, Xcode on `/Volumes/APPLICATIONS`). Fire by pushing a branch:
  `device/BasketballAnalysisAssessmentApp` installs onto the connected iPhone;
  `simshots/BasketballAnalysisAssessmentApp` boots a simulator, walks every
  canonical screen and publishes one PNG per screen as a run artifact. Use the
  **bare** form — the resolve regex is greedy and `-` is inside its character
  class, so `…--on--main` is swallowed into the repository name and the job
  fails the allowlist in ~15s. Bare defaults the ref to `main`.
- A green `device` run is not proof of an install: read the log for
  `App installed:` / `ShotIQ is on the phone`. A 90-second run is normal when
  DerivedData is warm — short duration is not evidence of a short-circuit.
- That host is a Contabo VPS. The app runs under **pm2 as `shotiq`**, cwd
  `/opt/shotiq/basketball-analysis`, `next start --port 3060`.
- The checkout at `/opt/shotiq` tracks `main` and **must be pulled by hand**.
  It was sitting on PR #52 while `main` had reached #54.
- Reach it with the exec bridge: POST to `$KC_FULL_BRIDGE_URL` with
  `Authorization: Bearer $KC_FULL_BRIDGE_TOKEN` and `{"command": "..."}`.
  Playwright cannot reach the host from this container (the browser bypasses
  the egress proxy and the connection resets); `curl` can.

**Deploy sequence — build BEFORE restart so a failure cannot take the app down:**

1. `cd /opt/shotiq && git checkout -- basketball-analysis/yarn.lock && git pull --ff-only origin main`
   (that lockfile is always dirty on the server; discard it)
2. Check whether deps changed between the server's old SHA and the new one. If
   not, skip install — the repo declares pnpm, so `yarn install` refuses.
3. `cd basketball-analysis && NODE_ENV=production NODE_OPTIONS=--max-old-space-size=4096 npx next build`
4. Only on exit 0: `pm2 restart shotiq --update-env`
5. Verify from outside: `curl -s https://shotiq.194-146-12-139.sslip.io/signin`
   and grep for a marker the new code has and the old does not — `data-s3=`
   worked here, reading 0 before and 5+ after.

**Deploy after every screen from now on**, and send Kevin the app-vs-design
image. Merging to `main` alone changes nothing he can see.

**And for an iOS screen, deploying the web is not enough either** — see the
correction above. The phone runs `ios-native`, so an iOS screen reaches Kevin
only when the Swift side carries the change and a `device/` build has installed
it. Web deploy + `device` build, both, or he sees nothing and says so.

## The measurement library — `docs/shotiq/measure/`

Every builder so far rewrote segmentation, sub-pixel crossings, the area ladder
and plateau colour reading into a scratchpad that dies with the container. That
is now a committed package: `image`, `segment`, `crossings`, `ladder`, `fill`,
`ratios`, `hairline`, `compare`, `capture`, plus `selftest`.

`python3 -m measure.selftest` from `docs/shotiq/` runs **37 checks against
screen 003's recorded numbers** — whole-screen mean |d| 3.6443, the four Google
arc plateaus, the baseline split, the OR rule ends, the display cap and stems,
the rule-32 size ratios — and asserts that an empty window raises and that a
plateau estimated across the loud "OR" glyphs raises. Run it before trusting a
measurement on a new screen.

Four numbers do not reproduce exactly and the expectations were NOT moved to fit
— each is documented in the README with its cause: the baseline split (all-column
modal estimator against the ledger's two-column stem band), the OR rule lengths
(the library normalises to canonical's own measured background of green 254, not
an assumed 255), the display I/N (rule 35 — the old toolkit's bug), and the
footer/helper size ratio (o-candidate selection). Three are estimator
differences of the kind rule 25 predicts; one is a genuine bug in the old code.

## Infrastructure notes

- **`pkill -f "next start"` kills the shell that runs it.** The pattern matches
  the killer's own command line, so a chain like
  `pkill -f "next start"; rm -rf .next && npx next build` dies at the first
  statement with exit 144 and neither the `rm` nor the build ever runs.
  The failure is not the dead command — it is what it leaves behind. `.next`
  survives from the PREVIOUS build, `next start` serves it happily, and a
  capture then measures the old code while every log says the build "was run".
  A stale dist measured as if fresh yields a plausible wrong number, which is
  the worst kind. Match on something that cannot match itself
  (`pkill -f "[n]ext start"`, or `next-server`), and prefer checking
  `ps aux | grep -c "[n]ext start"` first — usually there is nothing to kill.
  Confirm a build really happened by its own artefacts (`.next/BUILD_ID`
  changed, `prerender-manifest.json` present, exit 0 in the log), never by the
  absence of an error.

- **The ledger-first rule has now prevented acting on wrong state twice in one
  hour.** Scheduled wakeups that embed a state snapshot go stale the moment the
  work moves, and two consecutive ones asserted that the desktop baseline had
  been replaced with `b63899cf...` and that the Google palette lived in shared
  markup. Both were reverted within the cycle; the true baseline is
  `69b2184b0f0e7553108d23c2aae71071`. A cycle that trusted the prompt over this
  file would have treated the correct baseline as a regression and "fixed" it
  back. **Read this file first, every time, and let it win.**

- **The canonical sets are in git** at `docs/shotiq/canonical` (iOS 001-072) and
  `docs/shotiq/canonical-desktop` (077-096), with `.gitignore` negations because
  `*.png` is blanket-ignored. Use those, not the scratchpad copies. The builder
  brief template is at `docs/shotiq/SCREEN-BRIEF-TEMPLATE.md`; `BRIEF-002.md`
  was lost in the rollback.
- **The PR #53 merge cost desktop 077 fidelity**, before any 003 work. Against
  canonical it went from mean |d| 21.465 / 281,859 px over 8 (Aug 4) to
  22.547 / 291,046 at `daa0d1a`. That is the phone-shell work. 077 gets its own
  pass in the desktop sequence; it is recorded here so it is not later
  misattributed to whatever screen happens to be in progress.
- **PR #53 is MERGED** (`daa0d1a`). Follow-up work restarts the branch from
  `origin/main`, which is what recovered from the rollback.
- CI needs Node 22 (package.json declares `engines: >=22`), runs the Capacitor
  sync before tests with `NODE_ENV=production`, and mocks `prisma.shotEvent`.
- **The Pages deploy is blocked on a repo setting only Kevin can change:**
  Settings -> Pages -> Source = "GitHub Actions". The build compiles fine and
  fails at `configure-pages` with "Resource not accessible by integration".
- Capture harnesses (`capture-ios.mjs`, `capture-web.mjs`) and the grade
  directories were lost in the rollback and must be rebuilt before the next
  grading pass.
