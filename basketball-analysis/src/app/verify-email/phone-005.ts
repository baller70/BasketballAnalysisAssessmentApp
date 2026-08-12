/**
 * 005-verify-email — the PHONE geometry and type recipe for `/verify-email`, as
 * one CSS block that applies only below the 768px breakpoint.
 * ---------------------------------------------------------------------------
 * Built on 004's recipe (`src/app/signup/phone-004.ts`): its `Run` type, its
 * `runCss` emitter, its `tx`/`ty` two-lattice mechanism, its SVG-hairline
 * treatment (rule 11) and its colour method all transfer. NONE of its numbers
 * do — every value below is measured off `canonical/005-verify-email.png` at
 * 1:1. That canvas is 853x1844 device px at capture scale 853/393 = 2.170483,
 * so `D` converts one canonical device pixel to one CSS pixel.
 *
 * WHAT STATE CANONICAL IS IN (rule 17). 005 is NOT an empty form. It draws:
 *   - the address the code went to, "marcus@example.com.", in the lede;
 *   - four digits already typed, 2 8 4 7, in boxes one to four;
 *   - box FIVE focused — an orange border and a caret — and box six empty;
 *   - a live countdown mid-flight at "Resend code in 0:42".
 * The route map therefore drives 005 with a `fill` per digit and a `click` on
 * the fifth box, which is the sequence a real player produces by typing, and it
 * pins the countdown (see COUNTDOWN below). Capturing the route as-is would
 * shoot an empty form against a filled canonical — the invalid capture
 * `capture-ios.mjs`'s own docstring warns about.
 *
 * THE SCREEN IS NOT A FIDELITY JOB ALONE. Before this build the product had no
 * six-digit code at all: `VerificationToken` carried a link and nothing else,
 * and `/api/auth/verify-email` read `?token=`. Drawing six boxes on top of that
 * would have shipped six controls no endpoint could answer. The feature was
 * made real first — `issueEmailCode`/`consumeEmailCode` and
 * `POST /api/auth/verify-email-code` — and this file draws it second. The link
 * path is untouched and still verifies.
 *
 * COUNTDOWN. "Resend code in 0:42" is a live timer and therefore
 * nondeterministic across captures. It is pinned by
 * `sessionStorage['shotiq-verify-cooldown']`, which sets the countdown's value
 * and stops it ticking — the same class of deterministic entry 001 already uses
 * for `shotiq-splash-hold`, seeded from the route map, and never present for a
 * real player. Everything else about the timer is real: the value it counts
 * down from is `RESEND_COOLDOWN_SECONDS` served by the API, so the countdown
 * and the resend rate limit cannot disagree.
 *
 * `/verify-email` also draws a desktop screen. There is no canonical for it
 * (the canonical desktop set is 077-096 and this route is not in it), and
 * everything here is inside `@media (max-width: 767.98px)`, so above that width
 * not one declaration matches.
 */

/** canonical device px -> CSS px */
export const S = 853 / 393
export const D = (px: number) => px / S
const u = (px: number) => `${D(px).toFixed(4)}px`

/* --------------------------------------------------------------- colours ---
 * Screen-scoped, as 001-004 are: the global `--shotiq-color-*` tokens carry the
 * 20 desktop screens, so a disagreement on THIS canonical render is overridden
 * inside the phone media query and nowhere else.
 *
 *   role        value      how it was read
 *   paper       #FEFEFE    whole-canvas mean over a text-free strip:
 *                          254.03 / 253.86 / 253.96 (sd 0.57)
 *   ink         #000000    display / row labels / safe1 / wordmark all read
 *                          G/R 0.9996-1.0012, B/R 0.9987-1.0017 with a darkest
 *                          sample of exactly (0,0,0)
 *   graphite    #454751    lede1, the "Resend code in" label, DIDN'T GET THE
 *                          EMAIL?, safe2 and the chevrons read G/R 0.9876-0.9898
 *                          and B/R 0.9516-0.9566 — 004's graphite is G/R 0.9908,
 *                          B/R 0.9453, i.e. the same role, so the token
 *                          transferred rather than being re-invented
 *   orange      #FD4201    the plate interior by distance-shell plateau at
 *                          d in [10,20): (253.23, 67.04, 1.14), confirmed by two
 *                          raw interior samples at 65.7 and 66.5 green.
 *                          NOT 004's #FD3701 — that plate reads green 57.9 on
 *                          the same export chain, so the two screens genuinely
 *                          differ and copying 004's token would have been a
 *                          10-unit error over 83,000 pixels.
 *   box-rule    #050505    the code boxes' border: total ink across the stroke
 *                          is 249-268 units, i.e. ~1.0 device px of near-black
 *                          (rule 8 — at this width the peak, 119, is unsharp
 *                          overshoot and cannot be read as the colour)
 *   divider     #DDDDDD    the four help-list rules: ink 63.8-79.6 units over a
 *                          2.17 device px band
 */
const COLOURS = `
  /* CANONICAL'S PAPER IS NOT WHITE. Screens 001-004 each gained 0.4-0.6 of
     whole-screen mean |d| from this one token and on 004 it was found only at
     the very end, so it is set FIRST here rather than last. Canonical 005 reads
     254.03 / 253.86 / 253.96 (sd 0.57) over a text-free strip; a render left
     alone is exactly 255 everywhere, over the whole 853x1844 canvas.
     Screen-scoped: at 1440px the token still resolves #fff, so the 20 desktop
     screens cannot move. */
  --shotiq-color-paper:#FEFEFE;
  --s5-ink:#000000;
  --s5-graphite:#454751;
  --s5-orange:#FD4201;
  /* THE TONE COULD NEVER BE RIGHT AT THE OLD WIDTH, which is why it kept moving.
     Canonical's code-box border carries 272.3 ink units across the stroke
     (median over 250 crossings). At the 1.02 device px the render drew, even
     pure black yields 254 — so NO colour reached canonical's ink, and the token
     had been absorbing a geometry error: #050505 matched the ink and not the
     tone, #6D6D6D matched neither (149 against 272).
     Calibrated against a role this project has already solved (rule 51):
     canonical's help-list divider is a known 2.17 px stroke carrying 69.7 units,
     which implies 221.9 = #DDDDDD — exactly the shipped divider token, so the
     method reproduces a known answer. The same method on the box border gives
     272.3 units at a 1.725 px 50%-width, i.e. ~128.5 at 2.17 px. The stroke is
     widened to 2.17 in Marks005 and the tone set from that. */
  --s5-box-rule:#808080;
  --s5-divider:#DDDDDD;
  /* THE HEADER RULE KEEPS ITS OWN TOKEN AND ITS OWN VALUE IS THE DIVIDERS',
     which is a measured null rather than an oversight. Canonical carries 65.2
     units of ink across the header rule against 71.5 mean across the four
     help-list dividers, so a lighter tone looked indicated: 254 - 65.2/2.17 =
     223.9, i.e. #E0E0E0. Built and measured, it is WORSE — hdrRule 2.4985 ->
     2.6096 with n_over8 1226 -> 2338 — so the ink deficit is not a level error
     and the token stays at the dividers' value. The token itself is kept
     because the rule IS a separate role (it is the only full-bleed rule on the
     screen) and a future correction belongs on it, not on the dividers.
     The four dividers do not share one value in canonical either
     (80.8 / 67.1 / 74.4 / 63.8) and the render's flat 72.0 sits at their mean,
     which is why they are left alone. */
  --s5-header-rule:#DDDDDD;
`

export type Run = {
  x?: number        // canonical ink-left
  cx?: number       // canonical ink-centre (centred runs)
  top: number       // canonical 50%-crossing cap-top
  size: number      // CSS px
  weight: number
  scale: number     // scaleX
  sy?: number       // scaleY — cap height WITHOUT touching the advance
  skew?: number     // skewX, degrees (the display run is oblique)
  ls: number        // letter-spacing, em
  ws?: number       // word-spacing, CSS px
  stroke?: number   // -webkit-text-stroke-width, CSS px
  colour: string
  family?: string
  dx: number        // box-left -> ink-left, canonical px
  dy: number        // box-top  -> cap-top,  canonical px
  width?: number    // canonical px (centred runs)
  bang?: boolean    // !important on size/leading
  tx?: number       // sub-pixel horizontal nudge, CSS px, inside the transform
  ty?: number       // sub-row vertical nudge, CSS px, inside the transform
  ox?: number       // origin x of the positioned ancestor, canonical px
  oy?: number       // origin y of the positioned ancestor, canonical px
}

const GEIST = "var(--font-geist-sans)"
const TUNGSTEN = "var(--font-shotiq-display)"

/* ------------------------------------------------------------- geometry ---
 * Boxes, from the sub-pixel centroid of each border stroke (50% crossing on the
 * green plane, averaged over 50+ scan lines):
 *
 *   code boxes   stroke centre-lines, left edge then right edge
 *     0   50.45..155.90    1  180.42..285.74    2  309.18..414.40
 *     3  438.06..542.80    4  567.35..671.24    5  695.20..800.84
 *   all six      y 533.63..665.02, r 12.0
 *   plate        x  53.85..795.66  y  904.78..1016.32, r 11
 *   diff button  x  53.77..795.72  y 1048.14..1159.37, r 11, stroke 2.04
 *   dividers     y 1208.20 / 1380.49 / 1486.29 / 1599.45, x 56.5..795.5
 *   header rule  y 100.34, x 0..852 (full bleed — it is the only rule that is)
 *
 * The six code boxes' left edges are 129.97 / 128.76 / 128.88 / 129.29 / 127.85
 * apart. They do NOT share a pitch in canonical and are reproduced as measured
 * rather than regularised, exactly as 004's five field heights were.
 */
export const BOX_Y = 534.13
export const BOX_H = 131.39
export const BOX_R = 12.0
export const BOX_X = [50.45, 180.42, 309.18, 438.06, 567.35, 695.20]
export const BOX_W = [105.45, 105.32, 105.22, 104.74, 103.89, 105.64]
export const PLATE = { x: 53.85, y: 904.78, w: 741.81, h: 111.55, r: 11 }
/* MOVING THIS MOVES NOTHING — the container offset cancels, measured.
   `diffLab` reads L+1 R+1 and `diffMark` L+2 R+1 T+1 B+1, same-sign on every
   edge of both, so rule 15 says one cause and their shared container is the
   obvious place to fix it. Built, it is not: the children are positioned
   `left: u(x - ox)` with `ox = DIFFBTN.x`, so moving the container LEFT by 1
   moves each child's own left RIGHT by 1 and the two exactly cancel. The button
   rect moved, the label did not — diffBtn 9.2547 -> 9.9779 with diffLab
   unchanged at 23.4138.
   The border was already aligned; it is the CONTENTS that sit right. So the
   nudge belongs on the children after all, and rule 15's "one cause, one
   number" is about the cause, not about which coordinate happens to be shared.
   x stays where it was measured. */
export const DIFFBTN = { x: 53.77, y: 1048.14, w: 741.95, h: 111.23, r: 11 }
export const DIVIDERS = [1208.20, 1380.49, 1486.29, 1599.45]
export const DIVIDER_X = 56.5
export const DIVIDER_W = 739.0
export const HEADER_RULE = 100.34
/** The caret drawn inside the focused box. x 617.404..619.667, y 563.859..636.113. */
/* The caret's WIDTH is solved from ink mass, not from its 50% crossings: it is
   two pixels wide and unsharp-masked, so the crossings are overshoot (rule 8).
   Canonical carries 581.8 units of green ink across it against the render's
   427.0 at w 2.263, so 2.263 x 581.8/427.0 = 3.08. */
export const CARET = { x: 617.404, y: 563.859, w: 3.08, h: 72.254 }
/** "Resend email" is underlined: centroid y 845.1, x 335.4..515.8, ink 401 units. */
/* Same estimator: canonical 399.0 units against the render's 330.0 at h 1.75. */
export const LINK_RULE = { x: 335.4, y: 844.3, w: 180.4, h: 2.12 }

export const RUNS: Record<string, Run> = {
  /* SHOTIQ. Canonical 004's wordmark and this one share a cap to the pixel —
     both span rows 35..72 — and differ only in WIDTH, 192 device px there
     against 183 here. So the solved 004 lockup transfers with its size and
     weight untouched and its scaleX trimmed by 183/192: 1.0470 -> 0.9979. That
     is rule 32 used the safe way round — the two axes were read together, the
     vertical agreed exactly, and only the horizontal moved. */
  /* scale 0.9979 -> 1.0090: the first built capture came back 1.1% narrow at
     an EXACT cap (height ratio 1.000, width ratio 0.989), which is rule 32's
     signature for a pure horizontal error and nothing else. */
  wordmark: { x: 46.462, top: 34.805, size: 21.72, weight: 759, scale: 1.0090, ls: 0.0123,
              colour: "var(--s5-ink)", dx: 2.03, dy: 13.81, tx: 0.4607, ty: 1.2670 },
  /* VERIFY YOUR EMAIL — and unlike 004's headline this one is OBLIQUE.
     There is no italic Tungsten in the repository (the four cuts are medium,
     semibold, bold, black), so the slant is a skewX on the upright cut. It is
     measured rather than guessed: the three vertical stems inside "EMAIL" move
     -0.1028, -0.107 and -0.1056 device px of x per device px of y between rows
     232 and 304, i.e. dx/dy = -0.1051, which is skewX(-6.00deg).
     Cap 124.81 device px (228.686..353.492) and advance 528.43 (166.352..
     694.779). Tungsten Semibold's cap is 0.724 of its font-size on 004's solved
     values, so the seed size is 124.81 / 0.724 / 2.170483 = 79.4 CSS px. */
  /* First built capture: cap ratio 0.969 (3.1% short) and advance ratio 1.302
     (30% over) — BOTH axes wrong and in opposite directions, so the size and
     the scale are solved together rather than either alone (rule 32). Size
     79.4 -> 81.94 lands the cap; at that size the advance ratio would be
     1.302 x 1.032 = 1.344, so scaleX 1.00 -> 0.744. dy 30.0 -> 36.4 is the same
     6-device-px lift re-expressed at the new size. */
  /* Round 2: cap ratio EXACT (1.000) with the advance still 1.270 over, so
     scaleX alone again, 0.744 -> 0.586. Canonical's headline is far more
     condensed than 004's at the same face: per glyph it spends 0.245 of its cap
     against 004's 0.545, i.e. this canvas draws a compressed cut the repository
     does not contain (rule 54's situation, with no alternative to try — all
     four bundled Tungsten cuts share one width axis). The affine is what is
     shippable and it is stated as such.

     RULE 20 DISCHARGED PROPERLY — all four bundled cuts fitted to canonical's
     cap and advance and MEASURED in the shipping rasteriser, not argued about,
     with a rule-40 control reproducing the built capture's 26.6613 / 22721 /
     8.1420 exactly:
       tungsten_bold      26.6155      tungsten_medium   33.9990
       tungsten_semibold  26.6613      tungsten_black    45.5810
     Bold wins by 0.0458 of band — 0.0036 of whole screen — which is not a
     reason to change the face, so the shipped semibold stands and the residual
     is the FACE, in the rule 13 sense: the alternatives are measured and the
     correct cut is not in this repository. `-webkit-text-stroke-width` is a
     dead lever here in one direction and a losing one in the other: -0.10
     returns the control's number to four decimals (Chromium clamps a negative
     stroke to zero — a null that is a claim about the LEVER, rule 53) and
     +0.10 / +0.20 score 26.6704 / 26.9860.

     tx 1.3821 -> 1.11 WITH ws 0 -> 0.8, a COMPENSATED PAIR found on a 2-D grid
     rather than by sweeping either knob alone (rules 59, 61). The three words
     sat -1 / -4 / -2 device px left of canonical — a gap that opens along the
     run, which no single translation can close and which a per-word optimum
     scatter would have called noise. 26.6613 -> 24.5721, and 0.1654 of whole
     screen. Flat across tx 0.93-1.11 x ws 0.8-1.0 (24.57-24.87), so the
     trailing digits are the rung, not a precision claim.

     ROUND 4 — THE SKEW AND THE SCALE ARE ONE TRANSFORM, AND SOLVING THE
     ADVANCE SILENTLY UNSLANTED THE RUN. The emitted transform is
     'scaleX(s) skewX(k)', and CSS applies the RIGHT factor first, so the
     horizontal displacement the skew produces is multiplied by the scale:
     the matrix c term is s x tan(k), not tan(k). The -6.0 above was measured
     off canonical correctly and was correct WHEN IT WAS SET, at scale 1.00.
     Rounds 1 and 2 then moved scaleX 1.00 -> 0.744 -> 0.586 to land the
     advance, and each of those moves flattened the slant without touching
     the skew value or naming it in any band. Measured on the left stem of
     the E of EMAIL, which is a true vertical and fits a line to rms 0.29
     device px in both images:

       canonical  +6.082 deg      render (skew -6.0)  +3.554 deg

     and 0.586 x tan(6.00deg) = 0.0616 against the readback matrix's
     -0.0615911, which is the mechanism rather than a coincidence. Holding
     canonical's slope fixed, the skew that survives the scale is
     atan(0.10655 / 0.586) = 10.307 deg.

     Swept as a 2-D grid because skew about transform-origin 0 0 TRANSLATES
     the ink as well as shearing it, so skew and tx are a compensated pair by
     construction (rules 59, 61) — and the 1-D column proves it, every
     candidate at the old tx 1.11 scoring 40.5-58.5 against the control's
     24.57. Coarse 5 x 4 then fine 5 x 5, rule-40 control reproducing 24.5721
     / 6.7842 exactly on both. Bracketed on both axes at the optimum: skew
     10.1/10.2/10.3/10.4/10.5 -> 20.2189/20.2367/19.9365/19.9380/20.2745 and
     tx 4.30/4.45/4.60/4.75/4.90 -> 20.2274/20.0262/19.9365/20.3075/20.7553.
     The fine grid spans 19.93-20.91, so these are the rung and not a
     precision claim; 10.3 is kept because it is also the derived value.

     24.5721 -> 19.9365, and 0.3670 of whole screen. The built render's
     E-stem now reads +6.086 deg against canonical's +6.082.

     TWO THINGS THIS RETIRES. The advance ratio was 1.0076 and is now 1.0019
     WITHOUT touching scale — the extents were wide because the ink was
     upright, so the scale is not re-solved here (measured, not assumed). And
     the '-1 / -4 / -2 device px left' scatter recorded above was the missing
     slant seen edge-on: a shear displaces ink in proportion to its height, so
     it reads as a gap opening along the run. Re-measured on the shipped
     render, the per-word PIXEL optimum is dy0/dx0, dy0/dx-1, dy0/dx0 — worth
     0.0480 of whole screen in total, against this one value's 0.3670. Per-word
     placement is not the lever; it was the symptom. */
  display: { x: 166.352, top: 228.686, size: 81.94, weight: 600, scale: 0.586, skew: -10.3,
             ls: 0.0, colour: "var(--s5-ink)", family: TUNGSTEN, bang: true,
             ws: 0.8, dx: 1.2, dy: 36.4, tx: 4.60, ty: 0 },
  /* "Enter the code we sent to" — cap 23.35 device px, advance 348.30. */
  /* Cap ratio 1.000 exactly, advance 1.057 over — horizontal only. */
  /* ty +2 / -2 device px, and the OPPOSITE SIGNS are the finding: the two
     lines are not both misplaced, the gap between them is ~4 device px too
     large. A shared lever cannot express that and neither line alone reveals
     it — it is rule 57's opposite-sign signature, on a pair of runs rather
     than inside one band. lede1 9.5965 -> 5.5554, lede2 11.7684 -> 8.0204. */
  lede1: { cx: 429.352, top: 402.412, size: 15.2, weight: 400, scale: 0.908, ls: -0.004,
           colour: "var(--s5-graphite)", dx: 0, dy: 8.9, width: 348.3, tx: -1.8429, ty: 0.9215 },
  /* The address, semibold and ink rather than graphite (G/R 0.9999, B/R 0.9988
     against lede1's 0.9882 / 0.9536 — two different roles on two lines of one
     sentence, which is why they are two runs and not one wrapped paragraph). */
  /* Cap 1.067 over AND advance 1.168 over — both axes, so this one IS a size
     error with a scale trim on top: 16.4 -> 15.37, then 0.96 -> 0.877. */
  /* Round 2: cap 0.967 short, advance 0.997 — size up 3.4% and scaleX down to
     hold the advance the size change would widen. */
  /* Weight 600 -> 555 on an ink-mass reading of 1.0920, and unlike safe1's it
     was measured at a geometry that was already right: lede2 16.6947 ->
     11.7684 in the built capture. Kept. */
  lede2: { cx: 428.430, top: 442.572, size: 15.89, weight: 555, scale: 0.851, ls: -0.004,
           colour: "var(--s5-ink)", dx: 0, dy: 9.1, width: 319.9, tx: -1.3822, ty: -0.9215 },
  /* The four typed digits. Cap 59.1 device px (570.5..629.6) and ink widths
     22.96 / 24.36 / 26.38 / 22.74 — ink-width/cap 0.40, where an unscaled Geist
     digit sits near 0.63, so the run is condensed by about a third. */
  /* THE DIGITS ARE THE DISPLAY FACE, NOT THE BODY FACE, and the width said so
     before any pixel was scored. Canonical's four digits are 22.96 / 24.36 /
     26.38 / 22.74 device px of ink at a 59.1 px cap. Geist would need scaleX
     0.50 to reach that — a face squeezed to half its natural width, which is
     the shape rule 54 warns is a wrong-face symptom rather than a metric one.
     Tungsten at the cap that fits (59.1 / 0.724 / 2.170483 = 37.6 CSS px) is
     already that narrow with NO horizontal scale at all, which is what a
     correctly identified face looks like.
     The first capture measured Geist's cap at 0.637 of its font-size here
     against Tungsten's 0.724, which is where 37.6 comes from. */
  digit0: { cx: 102.840, top: 570.475, size: 39.3, weight: 400, scale: 1.0, ls: 0,
            colour: "var(--s5-ink)", family: TUNGSTEN, dx: 0, dy: 15.0, width: 105.45, tx: 0, ty: -0.4607 },
  digit1: { cx: 232.068, top: 570.461, size: 39.3, weight: 400, scale: 1.0, ls: 0,
            colour: "var(--s5-ink)", family: TUNGSTEN, dx: 0, dy: 15.0, width: 105.32, tx: 0, ty: -0.4607 },
  digit2: { cx: 360.964, top: 571.017, size: 39.3, weight: 400, scale: 1.0, ls: 0,
            colour: "var(--s5-ink)", family: TUNGSTEN, dx: 0, dy: 15.0, width: 105.22, tx: 0, ty: -0.4607 },
  digit3: { cx: 490.455, top: 571.048, size: 39.3, weight: 400, scale: 1.0, ls: 0,
            colour: "var(--s5-ink)", family: TUNGSTEN, dx: 0, dy: 15.0, width: 104.74, tx: 0, ty: -0.4607 },
  /* Boxes five and six are EMPTY in canonical, so these two runs have no ink to
     measure against. They are the box centres, carrying the same size and face
     as the four that were measured, because a player who keeps typing must not
     see the digits change shape halfway along the row. Stated, not fitted. */
  digit4: { cx: 619.295, top: 570.75, size: 39.3, weight: 400, scale: 1.0, ls: 0,
            colour: "var(--s5-ink)", family: TUNGSTEN, dx: 0, dy: 15.0, width: 103.89, tx: 0, ty: 0 },
  digit5: { cx: 748.020, top: 570.75, size: 39.3, weight: 400, scale: 1.0, ls: 0,
            colour: "var(--s5-ink)", family: TUNGSTEN, dx: 0, dy: 15.0, width: 105.64, tx: 0, ty: 0 },
  /* "Resend code in" (graphite) and "0:42" (orange, heavier) are two runs
     because they are two roles: the label reads G/R 0.9876 / B/R 0.9523 and the
     value is orange. One window over both would measure neither (rule 57). */
  /* Cap 0.963 short, advance 1.014 over: size 15.9 -> 16.5 with scaleX
     0.96 -> 0.912 to hold the advance the size change would have widened. */
  /* 400 -> 370 on an ink-mass reading of 1.0839: 15.2728 -> 14.1711. Kept. */
  resendLab: { x: 287.865, top: 730.490, size: 16.5, weight: 370, scale: 0.870, ls: -0.004,
               colour: "var(--s5-graphite)", dx: 2.6, dy: 10.2, tx: 0, ty: 0.3455 },
  /* The value is 23% wide at an exact cap — horizontal only, 0.96 -> 0.78. */
  /* Round 3 tried 0.785/dx 4.6 on a +1.077 width reading and the band went
     2.9743 -> 8.9320. Reverted: the round-2 pair is the measured optimum and
     the round-3 reading was the instrument, not the run. */
  resendVal: { x: 508.9, top: 730.490, size: 15.9, weight: 700, scale: 0.845, ls: -0.004,
               colour: "var(--s5-orange)", dx: 0.6, dy: 9.2, tx: 0, ty: 0.4607 },
  /* "Resend email", orange, underlined — the rule is drawn in Marks005 rather
     than as text-decoration, because Chromium clamps an underline to a whole
     CSS pixel and canonical's is 1.75 device px (rule 11). */
  /* `ox`/`oy` ON EVERY RUN THAT LIVES INSIDE A HIT TARGET. The hit targets are
     `position:absolute`, which makes each of them a containing block, so an
     absolutely-positioned run inside one resolves its `left`/`top` against the
     TARGET's corner and not against the screen. First capture: "Resend email"
     landed at the foot of the screen and all three help labels vanished off it
     entirely. Canonical coordinates go in; the parent's origin is subtracted
     out by `runCss`, exactly as `plateLab` and `diffLab` already did. */
  resendLink: { cx: 425.940, top: 810.824, size: 15.9, weight: 500, scale: 0.825, ls: -0.004,
                colour: "var(--s5-orange)", dx: 0, dy: 9.2, width: 174.9, tx: -1.3822, ty: 0,
                ox: 330, oy: 806 },
  /* "Open email app" on the plate — white on orange. */
  /* White on orange, so it is measured on the BLUE plane (orange B ~2, white
     255) rather than on green — on green the plate itself reads as ink and the
     bbox comes back as the whole button. Round 3: cap+descender 0.895 short,
     advance 1.080 over -> size 17.6 -> 19.66 with scaleX 0.96 -> 0.796. */
  /* Weight 600 -> 660: plateLab 22.7338 -> 16.0099, bracketed (700 gives
     16.2714, 540 gives 29.9542, 500 gives 31.0099). Its SIBLING on the
     outlined button below is already at its own optimum at 500 — 440 and 560
     both score worse — so the two button labels are NOT one role and were not
     solved as one (rule 14 says solve runs that share a role jointly; it does
     not say assume two runs share one). */
  plateLab: { x: 339.0, top: 946.0, size: 19.66, weight: 660, scale: 0.796, ls: -0.004,
              colour: "#FFFFFF", dx: 1.8, dy: 11.2, tx: 0, ty: 0,
              ox: PLATE.x, oy: PLATE.y },
  /* "Use a different email" inside the outlined button. */
  /* Cap 1.040 over, advance 1.193 over: size 15.6 -> 15.0, scaleX -> 0.837. */
  diffLab: { x: 348.0, top: 1093.0, size: 15.0, weight: 500, scale: 0.837, ls: -0.004,
             /* tx +0.5504 = RIGHT 1 device px. The direction was established by
                BUILDING both: left-1 took this band 23.4138 -> 35.8642 and left
                the residual asking for right-2, so the sign is not arguable. */
             colour: "var(--s5-ink)", dx: 0.8, dy: 8.2, tx: 0.5504, ty: -0.4607,
             ox: DIFFBTN.x, oy: DIFFBTN.y },
  /* "DIDN'T GET THE EMAIL?" — micro-caps, cap 20.57 device px, advance 272.03. */
  /* Cap exact, advance 1.186 over — horizontal only, 0.93 -> 0.784. */
  /* Round 2: cap 1.000, advance 1.000 — solved. 1 device px right, via tx. */
  /* 12.2615 -> 8.6672 on the same 2-D grid: weight stays at the honest 700 and
     scaleX 0.784 -> 0.81. Bracketed — 0.84 gives 12.9879 and 0.87 gives
     16.1385, and at 0.81 the weights 750 and 800 give 10.1115 and 11.4236. */
  didnt: { x: 59.317, top: 1251.083, size: 13.3, weight: 700, scale: 0.81, ls: 0.03,
           colour: "var(--s5-graphite)", dx: 0.8, dy: 5.0, tx: -0.4607, ty: 0 },
  /* THE THREE HELP LABELS ARE ONE ROLE AND ARE SOLVED JOINTLY (rule 14).
     Canonical sets them at one cap — the first glyph of each measures 22 / 22 /
     23 device px — so fitting each separately would let three different sizes
     each look locally plausible while the column read wrong.
     Round 2, from the built capture: the render's cap is 26.6 device px against
     canonical's 21.6 (both at coverage 0.06, so both carry the same halo) and
     the run is 585 device px against 428.9. Size 16.0 -> 13.0 lands the cap and
     scaleX 0.96 -> 0.866 lands what the size change leaves.
     A RESIDUAL IS STATED RATHER THAN CHASED: at that solve canonical's own
     glyphs are ~25% WIDER relative to their cap than Geist's while its run is
     the same length, i.e. canonical's body face has wide letters on tight
     sidebearings. fontTools puts Geist at 0.705 advance/char/cap and all three
     Boxed cuts at 0.675-0.691 against canonical's 0.5515 (rule 44 — read the
     fonts, do not argue from pixels), so NEITHER bundled face is canonical's
     and no scaleX can be right about the letters and the gaps at once. */
  /* WEIGHT WAS SWEPT HERE TOO AND FOUND NOTHING WORTH TAKING: 350 / 385 / 400 /
     420 / 440 at the shipped scale sum 62.77 / 60.82 / 60.16 / 60.61 / 60.12
     over the three bands, a 0.008 spread of whole screen between the best and
     the shipped 400 — and help1 and help2 want OPPOSITE directions (help1 is
     best at 400, help2 at 440), which says the residual is per-run horizontal
     registration rather than weight. 400 is the honest value and it stays.
     Round 3 makes the tension above explicit rather than picking a side: at
     size 13.0 the three runs land their LENGTH exactly (0.998 / 0.992 / 0.949)
     and their cap comes back 7-10% short (0.929 / 0.897 / 0.897). Raising the
     size to land the cap lengthens the run; lowering scaleX to hold the length
     narrows the glyphs further. Both are the same face gap measured from two
     directions. 13.9 / 0.809 lands the cap AND holds the length; what it
     spends is glyph width, which is the axis no lever on this screen can
     reach.
     MEASURED AND REVERTED. 13.9 / 0.809 took help1 20.3319 -> 22.2852, help2
     24.1773 -> 25.6114 and help3 15.6514 -> 16.6454 — every one of the three
     worse. So the LENGTH is the axis this band is scored on and the cap
     shortfall is the cheaper of the two errors; 13.0 / 0.866 stands, and the
     round-3 reasoning is kept because it was a real prediction that the band
     mean refuted. Weight 400 -> 385: ink mass R/C is 1.0349 and 1.0363 on
     help1 and help2 against a 0.9954 control on the wordmark, so the run is
     genuinely 3.5% heavy rather than reading heavy off canonical's bimodal
     small type (rule 51's control test, on this screen's own solved band). */
  /* THE VERTICAL WAS NEVER SWEPT ON THESE THREE, and it was the largest thing
     left on the screen. Every round moved size, scaleX and weight; this file's
     own note called the residual "per-run HORIZONTAL registration", and that
     sentence is what stopped anyone trying the other axis — rule 59's exact
     shape, a true diagnosis licensing a claim beyond its own mechanism.
     The three labels share a sign against their icons and chevrons (which want
     0 and -1), which is rule 15's one-container-offset signature on the label
     element rather than on the row.
     help1 20.3319 -> 7.7874, help2 24.1773 -> 21.1660, help3 15.6514 -> 12.8522.
     Values are CSS px inside the transform: +4, +2 and +2 device px. */
  help1: { ox: 56, oy: 1290, x: 169.384, top: 1320.903, size: 13.0, weight: 400, scale: 0.866, ls: -0.004,
           colour: "var(--s5-ink)", dx: 0.6, dy: 6.8, tx: 0, ty: 1.8429 },
  help2: { ox: 56, oy: 1392, x: 168.992, top: 1423.456, size: 13.0, weight: 400, scale: 0.866, ls: -0.004,
           colour: "var(--s5-ink)", dx: 0.6, dy: 6.8, tx: 0, ty: 0.9215 },
  help3: { ox: 56, oy: 1494, x: 170.419, top: 1531.877, size: 13.0, weight: 400, scale: 0.866, ls: -0.004,
           colour: "var(--s5-ink)", dx: 0.6, dy: 6.8, tx: 0, ty: 0.9215 },
  /* "Your account is safe" — cap 26.77 device px, no descender in the run. */
  /* Round 2: the cap matched EXACTLY on the first glyph (27 device px in both
     images) while the run ran 1.182 long — horizontal only, and the size is
     left alone precisely because the two axes were read together. */
  /* Round 3's 18.0 / 0.785 took this 19.6971 -> 22.8280. Reverted.
     THEN THE INK-MASS READING WAS WRONG ABOUT THE WEIGHT, IN THE OTHER
     DIRECTION. R/C came back 1.1265 — the heaviest run on the screen against a
     0.9954 control on the wordmark — and 600 -> 545 duly made it worse still,
     23.9317. The reason is rule 49: that mass was measured on the round-3
     build where this run was 3.4% OVERSIZED, so the extra ink was the size
     error and the weight solve was reading it. An ink parameter absorbs a
     geometric error, and a weight is only meaningful once the geometry is.
     Swept at the corrected size as a 2-D grid (weight x scaleX, rule 61) with
     a rule-40 control reproducing the built capture exactly:
       w600 sx0.812  19.6971 (control)   w680 sx0.812  11.1230  <- argmin
       w640 sx0.812  13.8046             w720 sx0.812  13.4610
       w600 sx0.84   18.3687             w680 sx0.84   23.0896
     Bracketed on both axes. Canonical's heading is a BOLD, not a semibold. */
  safe1: { x: 181.876, top: 1651.738, size: 17.4, weight: 680, scale: 0.812, ls: -0.004,
           colour: "var(--s5-ink)", dx: 0.8, dy: 9.0, tx: 0, ty: -0.4607 },
  /* Cap 1.074 over, advance 1.354 over: size 15.2 -> 14.15, scaleX -> 0.761. */
  /* Round 2: cap 1.000, advance 1.000 — solved; 1 device px right, via tx. */
  /* Same grid, same shape of finding: 400 -> 430 at the shipped scale,
     17.7767 -> 15.1605, bracketed (460 gives 16.2958, 500 gives 17.3839, and
     every scaleX 0.79+ is worse). */
  safe2: { x: 184.667, top: 1700.763, size: 14.15, weight: 430, scale: 0.761, ls: -0.004,
           colour: "var(--s5-graphite)", dx: 0.6, dy: 6.9, tx: -0.4607, ty: 0.4607 },
}

function runCss(name: string, r: Run) {
  const ox = r.ox ?? 0
  const oy = r.oy ?? 0
  const parts = [
    "position:absolute",
    "white-space:nowrap",
    "transform-origin:0 0",
    "margin:0",
    "padding:0",
    `font-family:${r.family ?? GEIST}`,
    `font-weight:${r.weight}`,
    `font-size:${r.size}px${r.bang ? " !important" : ""}`,
    `letter-spacing:${r.ls}em`,
    `color:${r.colour}`,
    `transform:scaleX(${r.scale})` +
      (r.sy !== undefined ? ` scaleY(${r.sy})` : "") +
      (r.skew !== undefined ? ` skewX(${r.skew}deg)` : "") +
      (r.tx || r.ty ? ` translate(${(r.tx ?? 0).toFixed(4)}px,${(r.ty ?? 0).toFixed(4)}px)` : ""),
    `top:${u(r.top - r.dy - oy)}`,
    `line-height:normal${r.bang ? " !important" : ""}`,
  ]
  if (r.ws) parts.push(`word-spacing:${r.ws}px`)
  if (r.stroke) parts.push(`-webkit-text-stroke-width:${r.stroke}px`)
  if (r.cx !== undefined) {
    const w = r.width ?? 400
    parts.push(`left:${u(r.cx - w / 2 - ox)}`)
    parts.push(`width:${u(w / r.scale)}`)
    parts.push("text-align:center")
  } else {
    parts.push(`left:${u((r.x ?? 0) - r.dx - ox)}`)
  }
  return `.s5 [data-s5="${name}"]{${parts.join(";")}}`
}

/** A transparent hit target over a box the overlay draws. */
function hitbox(name: string, x: number, y: number, w: number, h: number, r = 8) {
  return `.s5 [data-s5="${name}"]{position:absolute;left:${u(x)};top:${u(y)};width:${u(w)};` +
    `height:${u(h)};border:0;border-radius:${u(r)};background:transparent;padding:0;margin:0;display:block}`
}

/** A positioned drawn mark. `w`/`h` are the SVG BOX, not the ink. `ox`/`oy` are
 *  the origin of the positioned ancestor, for the marks that live inside a hit
 *  target — same correction as `Run.ox`/`Run.oy`. */
function markBox(name: string, x: number, y: number, w: number, h: number,
                 ox = 0, oy = 0, tx = 0, ty = 0) {
  // `tx`/`ty` are a SUB-PIXEL NUDGE IN CANONICAL DEVICE PX, and they are emitted
  // as a transform rather than folded into left/top on purpose. `left`/`top` are
  // layout properties and the browser rounds a box to whole device pixels when
  // it lays it out — that is rule 53 — so a fractional nudge there lands on 0, 1
  // or 2 px depending on where the box already sits. A transform is composited
  // after layout and is not rounded, so the nudge is exactly the nudge.
  //
  // This is the mechanism behind the reverts recorded on MARK_BOXES below: the
  // same intended 1 px moves that failed through left/top land to four decimals
  // through here.
  const shift = tx || ty ? `transform:translate(${u(tx)},${u(ty)});` : ""
  return `.s5 [data-s5="${name}"]{position:absolute;left:${u(x - ox)};top:${u(y - oy)};` +
    `${shift}width:${u(w)};height:${u(h)};padding:0;margin:0;display:block;border:0;background:transparent}`
}

/* Mark placement, in canonical device px. Every box below is the mark's own
   viewBox rectangle in canonical coordinates, so the SVG inside carries no
   scale of its own and one user unit is one canonical device pixel — the same
   construction Marks003/Marks004 use, and the reason a stroke antialiases at
   its true sub-pixel edge instead of being clamped to a whole CSS pixel.
     gear       ink 756..799 x   30..  75
     back       ink  45.. 78 x  136.. 169
     envelope   ink 241..301 x  939.. 984   (on the plate)
     envPencil  ink 246..311 x 1081..1135
     mailCheck  ink  58..117 x 1308..1354
     mailClock  ink  59..123 x 1411..1462
     help       ink  60..118 x 1512..1571
     chevrons   ink 777..790 x 1319..1343 / 1422..1446 / 1530..1555
     shield     ink  73..141 x 1635..1725 */
export const MARK_BOXES: Record<
  string,
  [number, number, number, number, number, number, number?, number?]
> = {
  /* Every mark box below was re-solved from the first built capture's ink
     bbox against canonical's, which is the only thing that pins a lucide
     drawing's inset — the drawings do not all inset by the same fraction and
     assuming they did left each mark wrong by a different amount. */
  /* ROUND 4 — A ONE-UNIT NUDGE HERE IS NOT A ONE-DEVICE-PIXEL MOVE, AND THAT
     IS WHY HALF OF THIS ROUND'S MARK EDITS WERE REVERTED.

     Each mark's window was scored against canonical at every (dy,dx) in +/-3
     device px and the minimum taken — a better instrument than comparing ink
     extents, because an extent is one thresholded row and moves with
     antialiasing while the minimum is over every pixel. Eight of ten marks
     showed a 1-2 device px optimum. All eight were applied. The BUILT capture
     then said:

       gear       11.6112 ->  8.9253   kept      (down 2 units)
       diffMark   37.9676 -> 32.0538   kept      (down 2 units)
       chev1       2.9223 ->  2.6768   kept      (up 1, right 1)
       back        8.1680 ->  9.8710   REVERTED  (worse)
       helpMark1  22.0527 -> 23.1614   REVERTED  (worse)
       plateMark  15.3721 -> 15.6625   REVERTED  (worse)
       chev2/3     unchanged to 4 dp   REVERTED  (the edit did nothing at all)

     The mechanism, measured rather than assumed. These numbers are canonical
     device px; `u()` converts them to CSS px, the browser lays the box out at a
     fractional CSS position, and the raster rounds. So the screen move per unit
     is not 1 — across marks that got the SAME size edit it came out at 1
     (diffMark), ~1.5 (gear) and 2 (back), and 0 for two of the chevrons. That
     also explains why three optima did not merely fail to close but flipped
     sign: back's went (+1,-1) -> (-1,+1), i.e. a 1-unit edit moved it 2.

     So a sub-pixel mark nudge cannot be PREDICTED from the shift search here
     the way a type parameter can be predicted from a sweep — the sweep injects
     the property the recipe emits, while this passes through a unit conversion
     and a rounding. It has to be verified by a build, and the ones that did not
     survive one are reverted rather than kept because their prediction was
     pretty. Residual left on the table by the three reverts: 0.0104 of whole
     screen, stated rather than forced (rule 13). */
  gear: [751, 28.96, 54, 51.0, 0, 0],
  back: [35.54, 127.54, 51.5, 51.5, 0, 0, 1.0, -1.0],
  plateMark: [237.2, 929.9, 69.6, 63.7, PLATE.x, PLATE.y, 0, 1.0],
  /* diffMark carries NO nudge: its shift-search optimum is already dy0 dx0 and
     equals its base (32.0538), so the sixth grade's recommendation to move it
     was a change with nothing to buy. Built with left-1 it went 32.0538 ->
     32.4834, which is the confirmation. */
  diffMark: [242.1, 1072.7, 76.8, 68.5, DIFFBTN.x, DIFFBTN.y],
  helpMark1: [53.65, 1299.8, 67.0, 61.5, 56, 1290],
  helpMark2: [58.24, 1403.15, 66.3, 61.8, 56, 1392],
  helpMark3: [56.4, 1507.6, 66.2, 67.5, 56, 1494],
  chev1: [762.4, 1309.0, 43.6, 43.2, 56, 1290, 1.0, 1.0],
  chev2: [761.4, 1414.0, 43.6, 43.2, 56, 1392, 1.0, 0],
  chev3: [761.4, 1522.0, 43.6, 43.2, 56, 1494, 1.0, 0],
  shield: [58.8, 1628, 97.4, 105.2, 0, 0],
}

export const PHONE_CSS = `@media (max-width: 767.98px){
.s5{${COLOURS.replace(/\s+/g, "")}position:relative;width:393px;height:852px;min-height:852px;
  overflow:hidden;background:var(--shotiq-color-paper);padding:0;margin:0}
.s5 [data-s5-contents]{display:contents}
.s5 [data-s5-off]{display:none!important}
.s5 [data-s5-iq]{color:var(--s5-orange)}
/* THE CARET IS DRAWN, NOT NATIVE. A blinking caret is a nondeterministic pixel
   and the capture harness forces caret-color transparent on every element, so a
   native caret could never appear in a canonical capture at all. Canonical 005
   draws one — a 2.26 x 72.25 device px orange bar in the focused box — so it is
   drawn in the overlay and gated on the live focus index. The player still sees
   a caret; it simply does not blink. */
${Object.keys(RUNS).map((k) => runCss(k, RUNS[k])).join("\n")}
${BOX_X.map((x, i) => hitbox(`code${i}`, x, BOX_Y, BOX_W[i], BOX_H, BOX_R)).join("\n")}
/* The six inputs are transparent hit targets: their VALUE is drawn by the
   digit runs above, which are separately positioned so each digit lands on its
   own box centre. An input cannot carry the run's scaleX and its own centring
   at once without the caret and selection geometry going with it. */
.s5 [data-s5^="code"]{color:transparent;caret-color:transparent;-webkit-text-fill-color:transparent;
  font-size:16px;text-align:center;outline:none;appearance:none;-webkit-appearance:none}
.s5 [data-s5^="code"]::selection{background:transparent}
${hitbox("plate", PLATE.x, PLATE.y, PLATE.w, PLATE.h, PLATE.r)}
${hitbox("diffBtn", DIFFBTN.x, DIFFBTN.y, DIFFBTN.w, DIFFBTN.h, DIFFBTN.r)}
${hitbox("resendLinkBox", 330, 806, 192, 44, 4)}
${hitbox("helpRow1", 56, 1290, 740, 88, 4)}
${hitbox("helpRow2", 56, 1392, 740, 92, 4)}
${hitbox("helpRow3", 56, 1494, 740, 100, 4)}
${Object.entries(MARK_BOXES).map(([k, m]) => markBox(k, ...m)).join("\n")}
/* THE SVG SIZING RULE IS SCOPED TO MARKS, and the first version was not.
   '.s5 [data-s5] svg' matches ANY svg inside ANY hit target, and the desktop
   lucide icons live inside those same targets carrying Tailwind's 'hidden'.
   Specificity 0,2,1 against '.hidden''s 0,1,0, so the rule UNHID every desktop
   icon on the phone: five approved-icon PNGs painted over the drawn marks in
   the first capture. The desktop icons now carry 'data-s5-off', which is
   'display:none!important' and cannot be lost to a specificity race, and the
   sizing rule keys off 'data-s5-mark' — an attribute only the drawn marks
   have. */
/* NO BACKTICKS ABOVE: this comment is emitted from inside a template literal,
   so a backtick around an identifier ends the string and the file stops
   parsing — the same trap Marks004 records twice. */
.s5 [data-s5-mark]{display:block}
/* A MARK THAT IS ITSELF THE POSITIONED BOX MUST NOT BE STRETCHED. The first
   version gave every data-s5-mark width:100%;height:100%, and for the marks
   that ALSO carry a data-s5 box that rule wins the cascade at equal
   specificity — so each one became the full width of its containing block,
   the SVG's default xMidYMid preserveAspectRatio centred the drawing in it,
   and five marks landed in the middle of the screen at the right size, which
   reads exactly like a placement bug rather than a sizing one.
   The 100% belongs only to the INNER span of a mark whose positioned box is
   its parent link (gear, back), which is what :not([data-s5]) selects. */
.s5 [data-s5-mark]:not([data-s5]){width:100%;height:100%}
.s5 [data-s5-mark] svg{width:100%;height:100%;display:block}
/* KEYBOARD FOCUS ON THE CODE BOXES IS THE DRAWN ORANGE BORDER, AND ADDING A
   RING ON TOP OF IT WAS A MEASURABLE DEFECT. The overlay already paints the
   focused box in orange at twice the unfocused weight, driven by the live focus
   index, so it is a real affordance for keyboard and pointer alike. The first
   version ALSO put a ':focus-visible' outline on the input, and the two painted
   together: canonical carries 387.8 units of green ink across that border and
   the render carried 767.0 — the ring, not the border, and exactly the doubling
   that a band mean reports as "too heavy" while the cause is a second element.
   The outline is gone; the border stays.
   The other five controls keep a ring, because nothing else marks them. */
.s5 [data-s5="plate"]:focus-visible,.s5 [data-s5="diffBtn"]:focus-visible,
.s5 [data-s5="resendLinkBox"]:focus-visible,.s5 [data-s5="helpRow1"]:focus-visible,
.s5 [data-s5="helpRow2"]:focus-visible,.s5 [data-s5="helpRow3"]:focus-visible{
  outline:${u(3.4)} solid var(--s5-orange);outline-offset:${u(1.5)}}
.s5 [data-s5="error"]{position:absolute;left:${u(56)};top:${u(690)};width:${u(740)};
  white-space:normal;text-align:center;font-family:${GEIST};font-size:12px;line-height:16px;
  color:var(--shotiq-color-reviewRed);margin:0}
.s5 [data-s5="overlay"]{position:absolute;left:0;top:0;pointer-events:none}
}`
