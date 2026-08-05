/**
 * 004-create-account — the PHONE geometry and type recipe for `/signup`, as one
 * CSS block that applies only below the 768px breakpoint.
 * ---------------------------------------------------------------------------
 * Built on 003's recipe (`src/app/signin/phone-003.ts`) rather than from
 * scratch: 004 is the same form family, so its `Run` type, its `runCss`
 * emitter, its two-lattice `tx`/`ty` mechanism, its SVG-hairline treatment and
 * its colour method all transfer. What did NOT transfer is stated at each site.
 *
 * `/signup` also draws a desktop create-account screen (there is no canonical
 * for it — the canonical desktop set is 077-096 — so the guard is byte
 * identity against a pre-change capture at 1440x900 in a bare
 * `chromium.launch()`). Everything here is inside `@media (max-width:767.98px)`
 * and nothing above that width matches, so the desktop tree is untouched.
 *
 * EVERY number below is measured off canonical/004-create-account.png at 1:1.
 * That canvas is 853x1844 device px at capture scale 853/393 = 2.170483, so `D`
 * converts one canonical device pixel to one CSS pixel.
 *
 * WHAT STATE CANONICAL IS IN (ledger rule 17). 004 is the FILLED, VALIDATED
 * form, not an empty one: FIRST NAME "Jordan", LAST NAME "Ellis", EMAIL
 * "jordan.ellis@example.com", both password fields masked to NINE bullets, and
 * the terms checkbox TICKED. Eleven of the twenty bands do not exist until the
 * player types, and the checkbox ring changes colour when it does. The route
 * map therefore drives 004 with `fill` + `click` + `blur` steps — the real user
 * path, and deterministic.
 *
 * WHAT DID NOT TRANSFER FROM 003, measured:
 *   - the micro-cap label role. 003's EMAIL sits at advance/cap 3.35, 004's at
 *     2.81, and its PASSWORD 6.08 against 5.08 — 004's labels are ~16% more
 *     condensed at the same cap. Re-solved here, JOINTLY across all five labels
 *     (rule 14) rather than one fit per label, because canonical sets them at
 *     one cap: 22.02 / 21.81 / 22.03 / 21.92 / 21.92 device px, a 0.22 spread.
 *   - the box corner radius: 8.5 device px here against 003's 11.5 and 13.
 *   - the field border tone and weight, and the fact that this screen uses TWO
 *     rule tones where 003 uses one for its five boxes.
 *   - there is no topbar hairline and no eyebrow on 004.
 * WHAT DID TRANSFER, verified in pixels and reported in the build notes:
 *   the wordmark's Geist-759 solve, the Tungsten Semibold display cut, the
 *   graphite/orange/ink colour roles, the capture-frame mark (52.89 x 54.67
 *   here against 003's 53 x 55, same 15-unit arms, same 4.0 stroke, same r-9
 *   dot) and the whole `tx`/`ty` lattice mechanism.
 */

/** canonical device px -> CSS px */
export const S = 853 / 393
export const D = (px: number) => px / S
const u = (px: number) => `${D(px).toFixed(4)}px`

/* --------------------------------------------------------------- colours ---
 * Screen-scoped, as 001-003 did: the global `--shotiq-color-*` tokens carry the
 * 20 desktop screens, so a disagreement on THIS canonical render is overridden
 * inside the phone media query and nowhere else.
 *
 * Every role below 30px is solved from total ink at matched geometry and from
 * the ink-weighted (255 - channel) hue ratio over the whole run, never from an
 * eroded stroke core — canonical is unsharp-masked and at this size the core is
 * overshoot (rule 8). The flat fills (the plate, the rules) are read from the
 * INTERIOR by distance-shell plateau (rule 28).
 *
 *   role          value      how it was read
 *   ink           #000000    display / labels / Sign in read G/R 1.0010 and
 *                            B/R 1.0013 with darkest sample (0,0,0)
 *   graphite      #454751    lede + value + helper read G/R 0.9908-0.9924,
 *                            B/R 0.9453-0.9521 — 003's graphite is G/R 0.9892,
 *                            B/R 0.9355, i.e. the same role to within 2 units
 *                            of blue, so the token transferred
 *   orange        #FD3701    plate interior by distance-shell plateau at
 *                            d in [14,24): (253.2, 57.9, 0.9) against the
 *                            token's (253, 55, 1)
 *   red           #D92D20    the share mark's lower node, (217.7, 56.8, 39.8)
 *                            against the reviewRed token's (217, 45, 32)
 *   green         #0D9144    the checkbox ring and tick
 *   field-rule    #DBDCE0    darkest 5th percentile of the per-column peak
 *                            pixel down a field border: (219, 220, 224)
 *   hair          #D1D2D6    the OR rules and the Sign in border: (209,210,214)
 *   or            #838489    the OR label
 */
const COLOURS = `
  --shotiq-color-ink:#000000;
  --s4-field-rule:#DBDCE0;
  --s4-hair:#D1D2D6;
  --s4-green:#0D9144;
  --s4-orange:#FD3701;
  --s4-red:#D92D20;
  --s4-graphite:#454751;
  --s4-eye:#2C2E38;
  --s4-or:#838489;
`

export type Run = {
  x?: number        // canonical ink-left
  cx?: number       // canonical ink-centre (centred runs)
  top: number       // canonical 50%-crossing cap-top
  size: number      // CSS px
  weight: number
  scale: number     // scaleX
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

/* Box geometry, from the sub-pixel centroid of each border edge (fields, Sign
   in) and the 50%-crossing edge of the solid fill (plate):
     first    68.85..781.60 x  607.56.. 700.41
     last     68.85..781.60 x  792.71.. 884.54
     email    68.85..781.60 x  976.52..1067.87
     pass     68.85..781.60 x 1151.19..1244.09
     confirm  68.85..781.60 x 1356.35..1447.09
     plate    68.09..782.43 x 1544.11..1636.23
     sign in  68.86..781.60 x 1705.88..1796.63
   The five field heights are 92.85 / 91.83 / 91.35 / 92.90 / 90.74 — they do
   NOT share a height in canonical, and they are reproduced as measured rather
   than regularised, exactly as 003's four boxes were. */
const BOX_X = 68.85
const BOX_W = 712.75
const PLATE = { x: 68.09, y: 1544.11, w: 714.34, h: 92.12 }
const SIGNIN = { y: 1705.88, h: 90.75 }
const FIELDS: Record<string, [number, number]> = {
  first: [607.56, 92.85],
  last: [792.71, 91.83],
  email: [976.52, 91.35],
  pass: [1151.19, 92.90],
  confirm: [1356.35, 90.74],
}

export const RUNS: Record<string, Run> = {
  wordmark: { x: 40.87, top: 35.28, size: 21.72, weight: 759, scale: 1.0456, ls: 0.0123,
              colour: "var(--shotiq-color-ink)", dx: 2.03, dy: 13.81, tx: 0, ty: 0 },
  /* CREATE ACCOUNT. The size was right and the WIDTH was not, which is the one
     pairing rule 32 says to read together before calling anything a size error:
     cap height canonical/render came back 1.0009 — exact — while the advance
     came back 1.1928. Same face (Tungsten Semibold 600 confirmed *loaded*, not
     a fallback: `document.fonts` reports `__tungstenDisplay|600|loaded`, and a
     fallback would have faked this same signature), so the whole 19.28% is
     horizontal scale: 0.8539 x 1.192767 = 1.018524. The twelve inter-glyph
     gaps agree with the whole-run advance (ratios 1.13..1.26 about a 1.192
     mean, the spread being integer segmentation on 24-40px glyphs), which is
     what rules out a letter-spacing-only or word-spacing-only cause.
     dx and dy are re-solved rather than scaled: measured from the element's own
     box origin, the cap sat 19.841 canonical px below the box top (not the
     30.4 assumed) and the left bearing was 0.6725, which scales with scaleX to
     0.8022. x and top are canonical's own sub-pixel ink edges.
     scale 1.0195 and stroke 0.33 are the settled values: from 1.018524 the band
     mean fell 15.669 -> 14.801, and the surface is flat within 0.07 across
     sc 1.019..1.020 x stroke 0.28..0.43, so the remaining digits are noise.
     THE VERTICAL RESIDUAL IS UNREACHABLE, and it is the bulk of what is left.
     Chromium positions text sub-pixel HORIZONTALLY but snaps the baseline to a
     whole DEVICE pixel vertically, so `ty` and `top` both quantise: ty=-0.1094
     produced a byte-identical screenshot, ty=-0.2189 jumped the full -1.0 px,
     and moving the box -0.4608 scored identically while +0.4608 scored 19.75
     against 15.67. Both rungs were measured; this is the better one. The run
     therefore sits +0.475 (cap top) / +0.403 (foot) canonical px low and cannot
     be placed closer. Do not "fix" it — the two lattices are why `tx`/`ty` are
     inside the transform, and vertically there is nothing between the rungs. */
  display: { x: 69.008, top: 161.544, size: 49.63, weight: 600, scale: 1.0195, ls: 0.0547,
             ws: 3.85, stroke: 0.33, colour: "var(--shotiq-color-ink)", family: TUNGSTEN,
             bang: true, dx: 0.8073, dy: 19.8522, tx: 0, ty: 0 },
  /* The two lede lines. Solved JOINTLY (rule 14) — canonical sets them at one
     size, so fitting each on its own would let two different sizes both look
     locally plausible while the block reads wrong.

     Unlike the display run this IS a size error, and the pairing is what says
     so: cap height ratio canonical/render came back 0.90 and 0.92 against an
     advance ratio of 0.964 and 0.971, i.e. BOTH dimensions were over, where the
     display had an exact height and a short advance. 14.464 -> 13.2 with scaleX
     0.9027 -> 0.96.

     The cap was read off a flat-topped stem in each line (rule 7): the capital
     I of "ShotIQ" in line 1 (glyph 14 of 38) and the l of "goals" in line 2
     (glyph 12 of 27). Whole-line vertical extent is NOT usable here — line 1
     carries a Q descender and a comma, line 2 carries g and p descenders, so
     the two lines' full extents are not measuring the same thing and disagreed
     by 2%. Segment counts are asserted equal between canonical and render
     before any ratio is taken, so a mis-segmentation cannot masquerade as a
     size difference.

     dx/dy are per-line and are NOT shared: at the solved size the rendered cap
     sat 1.770 px low on line 1 and 4.987 px low on line 2. They differ because
     the recipe's `top` values were originally read off each line's whole-ink
     top, and line 2's tallest ink is an ascender where line 1's is a capital.
     Band mean |d| 21.19 -> 12.77. */
  lede1: { x: 69.24, top: 281.45, size: 13.2, weight: 352, scale: 0.96, ls: -0.0044,
           colour: "var(--s4-graphite)", dx: 0.493, dy: 7.845, tx: 0, ty: 0 },
  lede2: { x: 68.91, top: 327.77, size: 13.2, weight: 352, scale: 0.96, ls: -0.0044,
           colour: "var(--s4-graphite)", dx: 1.602, dy: 11.062, tx: 0, ty: 0 },
  /* "One account across web and iOS." Band 12.912 -> 6.329, at size 14.464 ->
     12.95 and scaleX 0.9027 -> 0.955.
     SOLVED ON ITS OWN, AND THAT MATTERED. It started from the same numbers the
     two lede lines did (14.464 / 0.9027) and its crossings predicted 13.12 /
     0.950, which is close enough to the lede's solved 13.2 / 0.96 to be tempting
     to just copy across as "one body role". It is not the same: the lede's exact
     values score 10.918 here against 8.513 for its own, and the settled answer
     is 12.95 / 0.955 at 6.329. Rule 14 says solve runs that SHARE a role
     jointly; it does not say assume two runs share one because they started from
     the same numbers.
     dx is unchanged at -0.86 because every dx candidate scored identically —
     layout lattice, so a new value would be invented precision. Per rule 40 the
     sweep carried a CONTROL at the recipe's own values, and it reproduced the
     built capture's 12.9118 exactly, which is what makes the rest of the run
     trustworthy. */
  oneacct: { x: 188.97, top: 444.30, size: 12.95, weight: 352, scale: 0.955, ls: -0.0044,
             colour: "var(--s4-graphite)", dx: -0.86, dy: 6.075, tx: 0, ty: 0 },
  /* THE FIVE MICRO-CAP LABELS, SOLVED JOINTLY (rule 14): size 14.30 -> 14.15,
     scaleX 0.640 -> 0.62. Summed band mean 44.347 -> 28.342.
       labFirst   7.933 -> 5.535     labPass    8.152 -> 5.568
       labLast    8.521 -> 5.267     labConfirm 16.447 -> 8.384
       labEmail   3.294 -> 3.589  <- the one that got WORSE, and it stays.
     labEmail regressing 0.295 while the other four gain 11.7 between them is
     the joint solve working as intended. Canonical sets these five at ONE cap;
     fitting each locally would let five different sizes each look plausible
     while the column reads wrong, which is the mistake rule 14 exists to stop.
     Do not "fix" labEmail on its own.

     What made this one screen-level defect rather than five: the advance ratios
     came back 0.9530 / 0.9338 / 0.9549 / 0.9438 / 0.9436 — one shared error of
     about 5.4%, not five independent ones. The band means looked wildly
     different (labConfirm 16.45 against labEmail 3.29) only because 5.4% of
     labConfirm's 212px run is 11.5px of accumulated drift while the same
     fraction of labEmail's 62px run is 3.3px. Run LENGTH, not defect size.

     dx stays 1.68: dx 1.13 and 1.68 score identically because the layout
     lattice quantises, so moving it would record precision that was never
     measured. Cap heights are not used here at all — the baseline snaps to a
     whole device pixel on this screen, which puts ~5% noise on any cap ratio
     (see the terms run). */
  labFirst: { x: 69.39, top: 564.61, size: 14.15, weight: 700, scale: 0.62, ls: 0.0500,
              colour: "var(--shotiq-color-ink)", dx: 1.68, dy: 6.13, tx: 0, ty: 0 },
  labLast: { x: 69.39, top: 748.85, size: 14.15, weight: 700, scale: 0.62, ls: 0.0500,
             colour: "var(--shotiq-color-ink)", dx: 1.68, dy: 6.13, tx: 0, ty: 0 },
  labEmail: { x: 69.39, top: 931.45, size: 14.15, weight: 700, scale: 0.62, ls: 0.0500,
              colour: "var(--shotiq-color-ink)", dx: 1.68, dy: 6.13, tx: 0, ty: 0 },
  labPass: { x: 69.40, top: 1111.61, size: 14.15, weight: 700, scale: 0.62, ls: 0.0500,
             colour: "var(--shotiq-color-ink)", dx: 1.68, dy: 6.13, tx: 0, ty: 0 },
  labConfirm: { x: 69.35, top: 1316.29, size: 14.15, weight: 700, scale: 0.62, ls: 0.0500,
                colour: "var(--shotiq-color-ink)", dx: 1.68, dy: 6.13, tx: 0, ty: 0 },
  helpPass: { x: 69.56, top: 1263.08, size: 12.55, weight: 380, scale: 0.900, ls: -0.004,
              colour: "var(--s4-graphite)", dx: -0.5, dy: 5.5, tx: 0, ty: 0 },
  /* "I agree to the Terms of Use and Privacy Policy." Band 20.078 -> 10.666,
     at size 14.46 -> 11.5 and scaleX 0.900 -> 0.95.
     SOLVED ON THE BAND MEAN, BECAUSE CAP HEIGHT IS NOT A USABLE ESTIMATOR HERE.
     The cap route looked like it was working and was not: measured on the
     capital I, the render's cap came out ~12% over canonical at EVERY size
     tried, which reads like a wrong face. It is not — the probe reports Geist
     Sans for this run and for the lede, and the lede solved cleanly on the same
     face. What gave it away is that the I's FOOT sat at exactly 1503.500 in
     three renders at three different font sizes. A real foot moves with size.
     Chromium snaps the text baseline to a whole device pixel (the same lattice
     that makes `ty` useless on the display run), the I sits on that baseline,
     so only the cap TOP moves and the cap height carries up to a whole pixel of
     quantisation on a ~19px cap — 5% noise, which is larger than the effect
     being solved for. The library's `clipped_hi` flag is False here, correctly:
     nothing is clipped, the estimator is simply quantised. Two crude estimators
     then disagreed about the size by 3% (11.56 from the terms cap, 11.93 scaled
     from the lede's), which is the tell that neither should be trusted.
     Segment counts also refuse to agree — canonical 38, render 27..36 depending
     on size, because glyphs touch at these widths — so every ratio guarded on
     equal segmentation rejects the whole sweep.
     The band mean needs no segmentation and no vertical crossing, and it is the
     fidelity number in any case.
     dx 0.5 and 1.5 score identically, as do dy 6.0 and 7.0 — both lattices
     quantise, so these digits are the rung, not a precision claim. */
  terms: { x: 129.34, top: 1484.20, size: 11.5, weight: 380, scale: 0.95, ls: -0.004,
           colour: "var(--shotiq-color-ink)", dx: 0.5, dy: 6.0, tx: 0, ty: 0 },
  createLab: { x: 353.65, top: 1577.54, size: 21.0, weight: 480, scale: 0.90, ls: -0.03,
               colour: "#FFFFFF", dx: 1.16, dy: 8.52, tx: 0, ty: 0, ox: PLATE.x, oy: PLATE.y },
  orLab: { x: 409.74, top: 1666.51, size: 11.538, weight: 740, scale: 0.7141, ls: 0.1014,
           colour: "var(--s4-or)", dx: 0.64, dy: 6.29, tx: 0, ty: 0 },
  signinLab: { x: 412.72, top: 1736.39, size: 21.0, weight: 480, scale: 0.90, ls: -0.03,
               colour: "var(--shotiq-color-ink)", dx: 1.16, dy: 8.52, tx: 0, ty: 0,
               ox: BOX_X, oy: SIGNIN.y },
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
  return `.s4 [data-s4="${name}"]{${parts.join(";")}}`
}

/** A transparent hit target over a box the overlay draws. */
function hitbox(name: string, y: number, h: number, x = BOX_X, w = BOX_W) {
  return `.s4 [data-s4="${name}"]{position:absolute;left:${u(x)};top:${u(y)};width:${u(w)};` +
    `height:${u(h)};border:0;border-radius:4px;background:transparent;padding:0;margin:0;display:block}`
}

/* The three name/email values are the inputs' OWN text, so a wrapper cannot
   scale them: the input itself carries the scaleX and divides its width back
   out so the control still spans its field.
     Jordan                    ink 94.11..185.57  cap-top  651.48
     Ellis                     ink 95.95..146.57  cap-top  828.36
     jordan.ellis@example.com  ink 93.12..442.58  cap-top 1013.76 */
function valueCss(name: string, box: [number, number], size: number, weight: number,
                  scale: number, padL: number, ty: number, ls = 0) {
  const [y, h] = box
  return `.s4 [data-s4="${name}"]{position:absolute;left:${u(BOX_X)};top:${u(y)};` +
    `height:${u(h)};width:${u(BOX_W / scale)};` +
    `transform:scaleX(${scale}) translateY(${ty.toFixed(4)}px);transform-origin:0 0;` +
    `font-family:${GEIST};font-weight:${weight};font-size:${size}px;letter-spacing:${ls}em;` +
    `line-height:${u(h)};padding-left:${u(padL / scale)};` +
    `color:var(--s4-graphite);background:transparent;border:0;outline:none;padding-top:0;` +
    `padding-bottom:0;padding-right:0;margin:0}`
}

/* The two masks. Chromium masks with U+2022 taken from the element's own font,
   so the bullet DIAMETER is set by the font-size and the PITCH by the
   letter-spacing — two independent knobs, and no scaleX is needed (003's
   finding, transferred). Canonical draws NINE bullets, x 95.34..311.51, on a
   pitch of 25.52 with an 11.6 diameter. */
function maskCss(name: string, box: [number, number], size: number, ls: number,
                 padL: number, ty: number) {
  const [y, h] = box
  return `.s4 [data-s4="${name}"]{position:absolute;left:${u(BOX_X)};top:${u(y)};` +
    `height:${u(h)};width:${u(BOX_W)};transform:translateY(${ty.toFixed(4)}px);` +
    `font-family:${GEIST};font-weight:400;font-size:${size}px;letter-spacing:${ls}em;` +
    `line-height:${u(h)};padding-left:${u(padL)};` +
    `color:var(--s4-graphite);background:transparent;border:0;outline:none;padding-top:0;` +
    `padding-bottom:0;padding-right:0;margin:0}`
}

export const VALUES = {
  first: { size: 15.0, weight: 340, scale: 0.90, padL: 25.0, ty: 0, ls: 0 },
  last: { size: 15.0, weight: 340, scale: 0.90, padL: 27.0, ty: 0, ls: 0 },
  email: { size: 15.0, weight: 340, scale: 0.90, padL: 24.0, ty: 0, ls: 0 },
}
export const MASKS = {
  pass: { size: 23.86, ls: 0.3072, padL: 25.0, ty: 0 },
  confirm: { size: 23.86, ls: 0.3072, padL: 25.0, ty: 0 },
}

/* Mark placement, in canonical device px.
     monogram    84.97..149.96 x  428.45.. 477.33
     eye (pass)  714.76..754.67 x 1183.00..1216.50
     eye (conf)  714.88..754.53 x 1386.28..1420.32   (+203.30 from the first)
     viewfinder  257.86..310.75 x 1562.65..1617.32
     share       334.38..372.61 x 1729.87..1771.66
     checkbox     68.19..107.89 x 1472.15..1511.60 */
const MARKS = `
.s4 [data-s4="monogram"]{position:absolute;left:${u(80)};top:${u(424)};width:${u(76)};height:${u(58)};
  display:block;pointer-events:none}
.s4 [data-s4="eyePass"]{position:absolute;left:${u(712)};top:${u(1180)};width:${u(46)};height:${u(42)};
  padding:0;margin:0;transform:none;display:block}
.s4 [data-s4="eyeConfirm"]{position:absolute;left:${u(712)};top:${u(1383.3)};width:${u(46)};height:${u(42)};
  padding:0;margin:0;transform:none;display:block}
.s4 [data-s4="focus"]{display:block;position:absolute;left:${u(252 - PLATE.x)};
  top:${u(1557 - PLATE.y)};width:${u(64)};height:${u(66)}}
.s4 [data-s4="shareMark"]{display:block;position:absolute;left:${u(330 - BOX_X)};
  top:${u(1726 - SIGNIN.y)};width:${u(48)};height:${u(50)}}
.s4 [data-s4="monogram"] svg,.s4 [data-s4="eyePass"] svg,.s4 [data-s4="eyeConfirm"] svg,
.s4 [data-s4="focus"] svg,.s4 [data-s4="shareMark"] svg{width:100%;height:100%;display:block}
.s4 [data-s4="checkbox"]{position:absolute;left:${u(68.19)};top:${u(1472.15)};width:${u(39.70)};
  height:${u(39.45)};margin:0;padding:0;appearance:none;-webkit-appearance:none;background:transparent;
  border:0;border-radius:${u(8)};box-shadow:none;display:block}
`

export const PHONE_CSS = `@media (max-width: 767.98px){
.s4{${COLOURS.replace(/\s+/g, "")}position:relative;width:393px;height:852px;min-height:852px;
  overflow:hidden;background:var(--shotiq-color-paper);padding:0;margin:0}
.s4 [data-s4-contents]{display:contents}
.s4 [data-s4-off]{display:none!important}
.s4 [data-s4-iq]{color:var(--s4-orange)}
.s4 [data-s4="terms"] a{color:var(--s4-orange);text-decoration:none}
${Object.keys(RUNS).map((k) => runCss(k, RUNS[k])).join("\n")}
${hitbox("plate", PLATE.y, PLATE.h, PLATE.x, PLATE.w)}
${hitbox("signinBox", SIGNIN.y, SIGNIN.h)}
${valueCss("valFirst", FIELDS.first, VALUES.first.size, VALUES.first.weight, VALUES.first.scale, VALUES.first.padL, VALUES.first.ty, VALUES.first.ls)}
${valueCss("valLast", FIELDS.last, VALUES.last.size, VALUES.last.weight, VALUES.last.scale, VALUES.last.padL, VALUES.last.ty, VALUES.last.ls)}
${valueCss("valEmail", FIELDS.email, VALUES.email.size, VALUES.email.weight, VALUES.email.scale, VALUES.email.padL, VALUES.email.ty, VALUES.email.ls)}
${maskCss("valPass", FIELDS.pass, MASKS.pass.size, MASKS.pass.ls, MASKS.pass.padL, MASKS.pass.ty)}
${maskCss("valConfirm", FIELDS.confirm, MASKS.confirm.size, MASKS.confirm.ls, MASKS.confirm.padL, MASKS.confirm.ty)}
.s4 [data-s4="valFirst"]::placeholder,.s4 [data-s4="valLast"]::placeholder,
.s4 [data-s4="valEmail"]::placeholder,.s4 [data-s4="valPass"]::placeholder,
.s4 [data-s4="valConfirm"]::placeholder{color:var(--shotiq-color-muted);letter-spacing:0em}
${MARKS}
.s4 [data-s4="error"]{position:absolute;left:${u(68)};top:${u(1815)};width:${u(714)};
  white-space:normal;font-family:${GEIST};font-size:12px;line-height:16px;
  color:var(--shotiq-color-reviewRed);margin:0}
.s4 [data-s4="overlay"]{position:absolute;left:0;top:0;pointer-events:none}
}`
