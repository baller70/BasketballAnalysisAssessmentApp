# `measure` — the canonical-fidelity measurement library

Committed, documented, reusable. It exists because the first three finished
screens were each slow for the same reason: their builder wrote a throwaway
measurement toolkit in a scratchpad that does not survive a container restart,
and then rewrote it. **The scratchpad is not durable. Git is.** (Ledger, top of
file.) This is the durable version, extracted from the twenty-odd files that
measured screen 003.

Everything here cross-references the numbered method rules in
[`../../SCREEN-LEDGER.md`](../../SCREEN-LEDGER.md). Each of those rules was
learned by getting something wrong; the docstrings say which mistake.

---

## The three non-negotiables

**1. Every estimator names its estimator.** Every measuring function's docstring
opens with `ESTIMATOR:` and states what it thresholds on, what it normalises to,
and what it returns. Rule 25: *a ratio threshold without a named estimator is a
hand-picked column waiting to happen.* A grader once set ±0.02 on x/cap without
saying how to measure x/cap, and two reasonable readings disagreed by more than
the threshold. Three false findings on 003 came from unnamed thresholds; one of
them nearly raised a grade.

Objects carry their estimator too, so it can be printed next to any number:

```python
base = crossings.baseline(plane, band)
print(base.y, '—', base.estimator)
# 1038.48 — modal per-column bottom crossing at 0.50 absolute coverage,
#           KDE bandwidth 0.15 px over 123 columns;
#           role=neutral (rule 2 — weight on green, LCD-fringe safe);
#           coverage[g/dark_on_light] normalised to background 254
```

**2. A segmenter that finds nothing raises.** Rule 30: *a null from a segmenter
is a claim about the segmenter until proven otherwise.* On 003 the OR hairlines
returned "no runs" twice — a rule peaking at 0.27 coverage next to glyphs
peaking ten times higher, with the threshold estimated across both. Nothing in
this library returns `None`, `[]` or `nan` to mean "not found". `SegmentationError`
carries the whole threshold sweep in its message.

**3. Never a single hand-picked column.** Rule 24: *scrutinise a measurement
that favours the build harder than one that does not.* A hand-picked column band
on 003 moved x/cap by −0.0297, past a grader's own invalidation threshold, which
by its stated criterion would have raised the grade. Re-measured over all
columns, the move was +0.0025 and the finding stood. Every per-column quantity
here is reduced over the whole run; `bottom_crossings_by_column` is documented
as a primitive that must not be reported from directly.

---

## Install / run

Pure Python. Needs `numpy`, `scipy`, `Pillow` — all present.

```bash
cd basketball-analysis/docs/shotiq
python3 -m measure.selftest                    # 37 checks against screen 003
python3 -m measure.selftest --render path.png  # against a fresh capture
```

Exit code is non-zero if any check fails. The self-test prints measured against
expected for every number, with the ledger section each expectation came from.

---

## Modules

| module | what it provides |
|---|---|
| `image` | `load`, `channel`, `background_level`, `coverage`, `plane_for`, `Plane` |
| `segment` | `ink_band`, `glyph_segments`, `row_runs`, `column_runs`, `sweep_bands`, `true_runs`, `Band` |
| `crossings` | `crossings`, `vertical_extent`, `cap_height`, `advance`, `glyph_widths`, `glyph_heights`, `gaps`, `bottom_crossings_by_column`, `baseline`, `baseline_split`, `stem_width` |
| `ladder` | `ladder`, `ladder_ratio`, `ink_total`, `LEVELS` |
| `fill` | `hue_masks`, `shell_plateau`, `arc_plateaus`, `flat_fill`, `control_fills` |
| `ratios` | `counter_glyphs`, `find_o`, `size_ratio`, `aspect`, `width_ratio`, `x_over_cap`, `measure_run` |
| `hairline` | `hairline_rows`, `rule_ends`, `rule_pair` |
| `compare` | `top_anchored`, `mean_abs_diff`, `changed_pixels`, `band_report` |
| `capture` | `capture_ios`, `capture_variants`, `phone_context_js`, `PHONE_CONTEXT`, `IOS_LAUNCH_ARGS`, `desktop_launch_args` |
| `errors` | `MeasurementError`, `SegmentationError`, `PlateauError`, `WindowError` |
| `selftest` | the 37 checks, and screen 003's search windows as a worked reference |

### `image` — loading and channel selection

Everything downstream measures a `Plane`: a 2-D array of **coverage** in [0, 1]
plus the estimator that produced it. Coverage is ink fraction against *this
image's own background*, which is why the same code reads black type on white
paper and white type on an orange plate.

* **Rule 2 — weight on the GREEN channel.** Chromium applies LCD subpixel AA to
  some runs at some sizes (fringes ~12 px and ~21 px CSS, neutral at 30 px+);
  canonical is greyscale. On luminance such a run reads +7 to +13% heavy, which
  is a false defect.
* **Rule 3 — ink on ORANGE runs on the BLUE channel.** Canonical's orange has
  B = 0.7–3 and its black B = 0, so on blue both read as full ink and the
  measurement is colour-independent. On 002 a label read −5.1% on green and was
  called an outlier; on blue all four sat at −1.4 to −2.5% and it never was one.
* White ink on the orange plate is the same trick inverted:
  `polarity='light_on_dark'` on blue.

`ROLES` bakes those in: `plane_for(img, 'neutral' | 'orange' | 'green' |
'white_on_plate')`.

**The background is measured, not assumed.** `background_level` takes the modal
8-bit value — not the max (unsharp-mask overshoot, rule 8) and not the mean
(dragged by however much ink is in frame). Canonical 003's green background is
**254**, not 255: 861 k pixels at 254 against 281 k at 255. Normalising each
image to its own background is what makes canonical's 0.27-coverage hairline
comparable to the render's 0.26 one.

### `segment` — bands and glyphs, over a threshold sweep

* **Rule 5 — row-segment, then column-segment. Never a fixed crop box.** A solid
  block next to a run welds them into one row-run; 001's mark plate did it twice
  and produced two false findings. So you pass a generous *search window* and
  the ink inside it defines the band.
* **Rule 6 — sweep the threshold.** Canonical carries a soft halo a crisper
  render does not. One permissive threshold produced five false findings of
  100+ device px band displacement on 003; sweeping collapsed the worst case to
  1 device px. `ink_band` runs the whole pipeline at ten thresholds and keeps
  the result that is stable over the widest contiguous span, with the full table
  on `Band.sweep`.
* `expect=n` demands exactly *n* glyph segments and restricts the sweep to
  thresholds that deliver them. A heavy cut welds two letters at 0.08; the
  wordmark needs 0.12–0.50 depending on the cut. Without this the measurement
  silently changes what it is measuring.

### `crossings` — sub-pixel 50%-coverage crossings

A rasterised edge is a ramp two or three pixels wide; the shape's edge is where
that ramp passes half coverage. Integer bounds cannot see a 0.2 device px
baseline split. These can.

**Coordinate convention.** Sample `i` sits at coordinate `i`; the trailing
crossing is `i + (p[i] − L) / (p[i] − p[i+1])`. A hard-edged 3-pixel run
(`0,1,1,1,0`) measures lo 0.5, hi 3.5, extent **3.0**. The scratchpad helper
this replaces put the trailing crossing at `i + 1 + frac`, adding ~1.0 px to
every extent — invisible in a canonical-minus-render delta, fatal in a ratio.
See *Numbers that do not reproduce*.

* **Rule 7 — cap height on a stem-only glyph** at 50% coverage. `cap_height`
  *requires* the stem glyph's segment; there is no "whole run" default, because
  a round glyph silently adds its overshoot.
* `advance` carries rule 32's warning in its docstring: matching an advance does
  not pin a size, the two are degenerate in (font-size, scaleX).
* `baseline` is the modal per-column bottom crossing over **all** columns. A
  run's columns fall into three populations — flat feet on the baseline, round
  glyphs a few tenths under it, descenders 4–6 px under it and up to 10% of the
  columns. A mean is dragged by the descenders, a median by which glyphs happen
  to be in the word, a fixed percentile by both. The mode is the flat feet,
  which is what a baseline is. On 003 it is *identical to 0.001 px* at
  segmentation thresholds 0.06, 0.16 and 0.40.
* `baseline_split` is the reportable quantity (rule 25): absolute positions from
  two estimators are not comparable, a difference inside one estimator is.
* **Rule 22 — `stem_width` reads a stem where it is provably clean.** An N's
  diagonal welds to the left stem near the top and the right stem near the
  bottom, so demanding three clean column segments returns `nan` on exactly the
  heavy cuts a stem investigation is about. `rows=(0.74,0.90), side='L'`
  reproduces canonical 003's 16.08 and 15.85 to 0.01.

### `ladder` — weight as a shape

**Rule 4**: area at coverage 0.25 / 0.4 / 0.5 / 0.6 / 0.75 / 0.9, not raw
density. Total ink confounds thicker strokes with softer edges. `ladder_ratio`
returns a verdict: below 1.0 at *every* rung is genuinely light, above at every
rung genuinely heavy, straddling means matched outline with a halo difference —
which is what a correct canonical-versus-render comparison looks like.
**Rule 9**: rungs where canonical carries under 20 px are dropped and named,
because canonical's top rungs on a grey run are unsharp-mask overshoot, not ink.

### `fill` — flat colour by distance-shell plateau

**Rule 28**: read a flat fill from the interior, never from its most saturated
pixel. Mask by hue, Euclidean distance transform, average the shell at
`d ∈ [3,4)`. The outer 2–3 px of an arc are antialiasing against the paper *and*
against the neighbouring arc. Probing 003's Google yellow by peak saturation
gave (255, 204, 1); the shell plateau gives (252.2, 199.8, 15.7).

**Rule 27**: a brand palette is not evidence that the palette is right. 003
shipped the official Google marks and every review passed over them because they
looked correct. Canonical uses none of them.

**Rule 29**: `control_fills` answers the "canonical's export moved it" objection
with numbers — measure the orange plate, the black and the white you already
agree on. A chain that leaves those within 2 units did not move the arcs by 20.

### `ratios` — the invariants that settle a typeface

* **Rule 21 — a within-run ratio is scaleX-invariant.** On 003 the display stem
  pointed at Tungsten Bold, and Bold does land the stem (16.05 against
  canonical's 16.09 where Semibold reads 14.79). `I/N`, two ink widths in the
  same run, disproved it. An absolute width can always be fitted with scaleX; a
  within-run ratio cannot.
* **Rule 32 — `size_ratio` is the only thing that can see a wrongly-sized run.**
  An o-height ratio between two runs of the *same image* is exactly their
  font-size ratio, because the typeface cancels — which also makes it immune to
  003's adjudicated x-height residual. That is how the footer was caught sitting
  ~6.5% undersized with scaleX stretching it back onto a matched advance.
* The `o` is found by **shape**: an x-height segment with a closed counter, no
  ascender, no descender, and the widest aspect among those (`e` and `a` have
  counters too). `find_o` re-segments the band across 0.20–0.60 and keeps the
  threshold yielding the most candidates — lowercase welds below ~0.2 and
  fragments above ~0.6, so the count peaks where the letters are separated.
* `aspect` (o-width / o-height) is size-invariant: canonical 003's five body runs
  sit in a **5.1%** band, the render's in a **15.1%** band.

### `hairline` — thin rules beside loud neighbours

The whole module is **rule 30**. Every entry point takes the loud neighbour's
column span as an argument so the caller cannot forget to exclude it.
`rule_ends` sums coverage down the rule's row band (a 1–2 px rule has no single
row at full coverage), estimates the plateau as a percentile of the profile
above half its own peak **on the rule's own columns**, and crosses at half that.
`hairline_rows` pads the derived rows by 1 each side: a hairline's shoulder rows
sit below any usable threshold but carry the coverage that makes the crossing
land right — on 003 the padded band reproduces the ledger's lengths and the
unpadded one is 0.05 px short.

**Rule 11** is in the docstring too: Chromium pixel-snaps background boxes to
whole CSS pixels, so a hairline that measures 1 device px off is usually that
and not a spacing error. Draw them as `<rect>` in an SVG whose viewBox is 1 unit
= 1 canonical device px.

### `compare` — whole-screen and per-band

**The artboard, which applies to all 72 iOS screens.** All 72 canonical PNGs are
exactly 853×1844, so the canonical artboard is 393×850 pt. The real iPhone
viewport is 393×**852** pt. The render is 5 device px taller than canonical, on
every screen, forever. Never "fix" it — shrinking the capture viewport would be
gaming the metric against the real device size. **Compare top-anchored over
canonical's first 1844 rows**; a diff that bottom-anchors or resizes
manufactures a whole-screen offset. A grader reporting "the render is 5 px
taller" has found the artboard, not a defect.

**Rule 23**: md5 detects duplicates, not regressions. Three of 72 iOS screens
are not byte-stable run to run (8 of 20 on desktop); that jitter reads max delta
1–3 with zero pixels above 8, where 003's real change read 2,376 px above 8 with
max 255. Use `changed_pixels` for regression and md5 for its actual job —
catching a redirect that ate a screen, which is what found 072 == 048.

`band_report` is what shows a fix worked: on 003 the Google palette change read
lede 9.204 → 9.022, OR 1.796 → 1.784, Google mark 9.133 → 8.305 while the whole
screen moved 3.6546 → 3.6443.

### `capture` — shooting in the shipping rasteriser

* **Rule 1**: `--font-render-hinting=none`. A bare `chromium.launch()` hints
  stems to whole pixels and shifts advances; that alone produced a false +5 px
  advance defect on 001 and explained an entire grader-versus-builder
  disagreement.
* Phone context: 393×852 pt at `deviceScaleFactor` 2.170483, `isMobile: false`
  with `hasTouch: true`. The `isMobile: false` is deliberate — Chromium's
  `isMobile: true` is Android wide-viewport mode, which widens the layout
  viewport to content width (innerWidth 1450 on `/signin`), makes
  `window.scrollTo` inert and puts controls outside the visual viewport. iOS
  WKWebView does not do that.
* Mouse parked at (2,2) and `caret-color: transparent` before every shot. A
  stray hover once baked a false "highlighted row" defect into a screenshot; a
  blinking caret is a nondeterministic pixel.
* **Rule 17 — ask what STATE canonical is in before measuring a band.**
  Canonical 003 is not an empty form: typed address, 16 bullets, a green
  validation ring, two "Looks good." lines. Measuring it against a default
  render compares two different screens. `capture_variants(steps=[...])` takes
  `fill` / `click` / `blur` steps. **Check every form screen for this.**
* `capture_ios` shells out to `capture-ios.mjs` **unchanged**, so the capture
  that gets measured is the capture that gets graded. `capture_variants` renders
  N parameter sets from ONE page load — that is what makes a solver loop
  affordable.
* `desktop_launch_args()` returns `[]` and exists to make the iOS/desktop split
  explicit. Every desktop grade on record was made under a bare launch; the two
  harnesses genuinely disagree and captures must never be compared across them.

---

## Worked example — measuring one band end to end

The checkbox row on 003: "Remember me" on the left, "Forgot password?" on the
right. The defect that was closed there was a **baseline split** — the two runs
sitting on different baselines because one had been given a larger font-size and
a narrower scaleX to land the same advance (rule 26).

```python
import sys; sys.path.insert(0, 'basketball-analysis/docs/shotiq')
from measure import image, segment, crossings, ladder

img = image.load('basketball-analysis/docs/shotiq/canonical/003-sign-in.png')

# 1. A coverage plane. Rule 2 puts weight on green; the background is measured
#    off this image (254 here, not 255 — canonical's export desaturated white).
plane = image.plane_for(img, 'neutral')
print(plane.estimator)
# role=neutral (rule 2 — weight on green, LCD-fringe safe);
# coverage[g/dark_on_light] normalised to background 254

# 2. A band. The window is a generous SEARCH region, not a crop box (rule 5).
#    ink_band row-segments, then column-segments, at ten thresholds, and keeps
#    the answer stable over the widest span (rule 6).
band = segment.ink_band(plane, (1008, 1050, 90, 400))
print(band.y0, band.y1, band.x0, band.x1, band.nseg, band.threshold)
# 1019 1040 96 255 9 0.06
print(band.sweep[3])          # what the segmenter saw at 0.12, if you need it

# 3. Sub-pixel numbers.
adv  = crossings.advance(plane, band)          # rule 32: does NOT pin the size
base = crossings.baseline(plane, band)         # rule 24: every column votes
caps = crossings.cap_height(plane, band, band.segments[0])   # rule 7: the R
print(f'advance {adv.extent:.3f}  baseline {base.y:.3f} '
      f'({base.n_in_mode}/{base.n_columns} cols in the mode)  cap {caps.extent:.3f}')
# advance 157.091  baseline 1038.480 (51/123 cols in the mode)  cap 18.958

# 4. Weight as a shape, not a density (rule 4).
print(ladder.ladder(plane, band))
# {0.25: 1015, 0.4: 782, 0.5: 661, 0.6: 504, 0.75: 182, 0.9: 0}
#                                                       ^ rule 9: overshoot,
#                                                         not ink — dropped by
#                                                         ladder_ratio

# 5. THE number: the split between the two runs of this row, one estimator on
#    both (rule 25).
right = segment.ink_band(plane, (1008, 1050, 590, 810))
split, left_base, right_base = crossings.baseline_split(plane, band, right)
print(f'{left_base.y:.3f} / {right_base.y:.3f}  split {split:.3f}')
# 1038.480 / 1038.628  split 0.148        (canonical)
# 1038.321 / 1038.376  split 0.055        (the finished render)
# before the fix, the render's split was 2.07 — the grade band is <= 0.4
```

Two things to notice. First, `base.y` is **not** comparable to a baseline from
some other estimator — the ledger records this exact pair as 1038.49/1038.68 and
the builder's tool read 1039.68/1039.70, 1.2 device px apart. The *split* is
what transfers. Second, nothing above hard-codes a threshold: change
`ink_band`'s sweep and the baseline does not move (the self-test asserts that to
0.001 px).

---

## Validated numbers — `python3 -m measure.selftest`

**37 / 37 checks pass** against `docs/shotiq/canonical/003-sign-in.png` and the
render at `$SCRATCH/verify-003d/003-sign-in.png`.

| check | expected (ledger) | measured | tol |
|---|---|---|---|
| whole-screen mean \|d\|, top-anchored 1844 rows | 3.6443 | 3.6443 | 0.001 |
| rows compared (the artboard) | 1844 | 1844 | 0 |
| canonical Google red / yellow / green / blue, worst channel | 0 | 0.10 / 0.09 / 0.84 / 0.37 | 1.0 |
| render Google arcs vs canonical, worst channel | 0.6/0.8/0.6/1.0 | 0.70 / 0.79 / 0.57 / 1.37 | 1.5 |
| canonical baseline split | 0.19 | 0.148 | 0.06 |
| render baseline split | 0.06 | 0.055 | 0.06 |
| baseline threshold spread (0.06/0.16/0.40) | 0 | 0.000 | 0.001 |
| canonical OR rules, left / right / gap | 339.70 / 339.39 / 69.12 | 339.63 / 339.27 / 69.23 | 0.15 |
| render OR rules, left / right / gap | 339.40 / 339.15 / 69.51 | 339.40 / 339.15 / 69.51 | 0.05 |
| canonical wordmark H/S | 1.146 | 1.1461 | 0.005 |
| canonical display flat cap | 118.84 | 118.844 | 0.02 |
| canonical round-glyph overshoot | +0.114 | +0.1137 | 0.01 |
| canonical display word space | 48.67 | 48.670 | 0.02 |
| canonical N / N2 stem (rule 22) | 16.08 / 15.84 | 16.082 / 15.850 | 0.03 |
| render display flat cap | 116.99 | 116.986 | 0.02 |
| render round-glyph overshoot | +2.002 | +2.000 | 0.01 |
| render N stem (rule 22) | 14.92 | 14.915 | 0.03 |
| display block width delta | −2.32 | −2.316 | 0.02 |
| canonical footer/helper o-height size ratio | 1.0679 | 1.0589 | 0.015 |
| render footer/helper o-height size ratio | 0.9947 | 1.0018 | 0.015 |
| canonical o-aspect spread across five body runs | 5.2% | 5.10% | 1.0 pp |
| empty window raises | — | raises | contract |
| plateau estimated across the loud neighbour raises | — | raises | contract |

Diagnostics printed but not gated: the four canonical arc RGBs, both baselines
of the checkbox row, the OR lengths re-measured with the background pinned at
255, the render wordmark H/S (0.9987 — the open defect), display I/N on both
images, and the render's o-aspect spread (15.07%).

---

## Numbers that do not reproduce, and why

Three ledger figures this library does **not** return, stated rather than fitted.

**1. The baseline split reads 0.148 canonical / 0.055 render, not 0.19 / 0.06.**
The ledger's number came from a two-column stem band — the R stem of "Remember
me" at x97–98 against the F stem of "Forgot password?" at x604–605 — and this
library reads the modal bottom crossing over all 123 and 158 columns. Reproduced
exactly: the max profile over those two-column bands, crossed at 0.50 absolute
coverage, gives 1038.490 / 1038.676 canonical and 1038.288 / 1038.343 render —
i.e. **0.186 and 0.055**, the ledger's digits. The
all-column estimator gives 1038.480 / 1038.628 and 1038.321 / 1038.376. The
absolute values agree to 0.05 px; the canonical *split* differs by 0.04 px
because a two-column read is one sub-pixel phase and a 123-column read is the
average of many (rule 25's mechanism, exactly). The all-column estimator ships
as the estimator because rule 24 forbids the other one, and because it is
invariant to the segmentation threshold to 0.001 px where the stem band is not.
**Both are far inside the pinned 0.4 device px band, which is the question the
number is asked to answer.**

**2. Canonical's OR rules read 339.63 / 339.27 with a 69.23 gap, not 339.70 /
339.39 / 69.12.** This library normalises coverage to canonical's own measured
background — green **254**, its true modal value — where the ledger's estimator
assumed 255. On a 0.27-coverage hairline that one level matters: with
`background=255` this library returns **339.699 / 339.391 / 69.118**, the
ledger's numbers to three decimals, and the self-test prints both. The render is
unaffected (its background *is* 255) and matches to 0.005 px either way. Own-
background normalisation is the more defensible estimator and it is what the
library uses; the difference is 0.07 px on a 339 px rule.

**3. Display `I/N` reads 0.343 canonical / 0.355 render, where the ledger records
0.3574 / 0.3590.** This one is a **defect in the old toolkit, not a difference of
opinion.** Its crossing helper placed the trailing sub-pixel crossing at
`i + 1 + frac` instead of `i + frac`, adding ~1.0 px to every extent. That
cancels in the canonical-minus-render deltas it was mostly used for, and does
not cancel in a ratio: `(I+1)/(N+1) = 0.3558` against the true `I/N = 0.3426`.
Reproduce the ledger's figure by adding 1.0 to both widths. The *conclusion* it
supported is unaffected — the inflation compresses ratios toward 1.0
monotonically, so the ordering across the four Tungsten cuts is preserved and
Bold's 0.4196 still misses canonical by an order of magnitude more than
Semibold's — but **a new measurement of I/N must not be compared to 0.3574.**
Re-derive the cut comparison with this library before quoting it. Note that the
ledger's other display figures (flat cap 118.84, overshoot +0.114, word space
48.67, N stems 16.08 / 15.84) came from correct code and reproduce to 0.01.

**4. The canonical footer/helper size ratio reads 1.0589, not 1.0679** (render
1.0018, not 0.9947). Both are within 0.9% and both carry the finding — canonical
sets the footer ~5–7% larger than the helper line, ours sets it the same size —
but the o-detection differs in which candidates it keeps, so the third digit
does not transfer. Treat the *difference between the two images* as the
quantity, not the absolute ratio.

---

## What was NOT promoted from the scratchpad toolkit, and why

The scratchpad at `$SCRATCH/s3/` held about twenty Python and JS files. What did
not come across:

* **`params.py`, `gen.py`, `sweep.py` — the CSS emitter and the per-run
  parameter table.** Every number in `RUNS` is a solved value for screen 003
  (`x=44, top=41.29, size=25.315, weight=700, scale=1.073, ls=0.0123` …) and
  `runCss()` reproduces one specific screen's markup contract, `data-s3="…"`
  attributes and all. Zero of it transfers to 004. Screen-specific solved state
  belongs in the screen, not in a shared library.
* **`tune.py`, `solve.py`, `solve2.py`, `solve3.py`, `final.py`, `grid.py`,
  `cutsolve.py`, `blsolve.py`, `sizefix.py` — nine iterations of the same
  gradient-descent solver.** They are all `size *= c.cap/d.cap;
  scale *= c.adv/d.adv; weight -= gain*ink_error`, differing in gain, in which
  parameters are frozen, and in which of 003's runs are in the loop. The *loop*
  is trivial; the value was in the measurements it called, which are what got
  promoted. A generic solver would have to guess the caller's parameter space
  and would be rewritten anyway — and rule 32 says an advance-driven solve is
  the wrong loop regardless. `capture.capture_variants` promotes the part that
  actually saved time: N parameter sets from one page load.
* **`probe.py`'s `WIN` table and `cmp.py`'s `BANDS` table.** Screen 003's
  windows. They live in `selftest.WINDOWS` as a worked reference, not in the
  library surface.
* **`ceil.py` — the coverage-ceiling fit.** It fits a grey run's coverage
  ceiling `c` by matching its coverage CDF against a black run's CDF rescaled by
  `c`. Clever, and it was superseded on 003 by fixing hue from an R:G:B ratio
  over a large sample (rule 8's prescription). It is also fragile: it assumes
  the grey and black runs share an outline, which is true for 003's labels and
  not in general. Left out; if small-type colour comes back, `ladder.ink_total`
  plus `fill.control_fills` is the promoted route.
* **`m.py`'s `cross()`** — promoted but **corrected**. See *Numbers that do not
  reproduce* item 3.
* **`base.py`'s histogram-cluster baseline** — replaced by the KDE mode. The
  0.25-px-bin histogram then ±1.2 window is bin-phase-dependent: shifting the
  bin edges by 0.1 px moves the answer. The mode with a 0.15 px Gaussian kernel
  is the same idea without the arbitrary bins, and it is what makes the
  threshold-invariance check pass at 0.001 px.
* **`func.mjs` — the functional contract for 003.** Reveal toggle, live
  validation, empty-submit focus, bad password, real sign-in, both links.
  Genuinely valuable and genuinely screen-specific: every selector and every
  expected route is 003's. It belongs in a per-screen verification script, and
  the brief template should ask for one. Not a measurement library concern.
* **`dom.mjs`, `focus.mjs`, `web1.mjs`, `shot.mjs`, `cuts.mjs`** — one-off
  Playwright probes. Their *contract* (launch args, context, caret, parked
  mouse) is promoted into `capture.py`; the scripts themselves are 003's URL and
  003's selectors. `web1.mjs`'s one durable fact — the desktop guard uses a bare
  launch — is `capture.desktop_launch_args()`.
* **`disp.py`'s hard-coded `assert len(cs)==6`** — promoted as
  `ink_band(..., expect=6)`, which raises with the threshold sweep attached
  instead of an assertion with no context.
* **`wm.py`'s escalating-threshold retry** — promoted and generalised into the
  sweep, which was already the same idea written once for one run.
* **The dozens of `*.json` state files** (`best.json`, `final4.json`,
  `blvariants.json`, `sizefit.json`, …). Solver checkpoints for 003.

---

## Adding a screen

1. Read the ledger first, every time, and let it win over any prompt.
2. **Rule 17 first**: what state is canonical in? Every form screen is a
   candidate. Put the state in the route map so it is reached the way a player
   reaches it.
3. Write a `WINDOWS` dict of generous search regions with an ink role each.
   Never a crop box.
4. `measure_run` for the standard set per run; the specific modules for the
   question the screen actually raises.
5. Before concluding a face is right or wrong, reach for a within-run ratio
   (rule 21) and an o-height ratio between two runs (rule 32).
6. Guard the desktop screen that shares the route with a **bare-launch** capture
   of both trees, compared to canonical and not only to each other (ledger,
   "The desktop regression guard").
7. Add the screen's own reproduced numbers to `selftest.py`. If one does not
   reproduce, say so here — do not move the expectation.
