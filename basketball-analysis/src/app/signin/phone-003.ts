/**
 * 003-sign-in — the PHONE geometry and type recipe for `/signin`, as one CSS
 * block that applies only below the 768px breakpoint.
 * ---------------------------------------------------------------------------
 * `/signin` draws two canonical screens: desktop 077-web-sign-in (graded B+,
 * one of the 20 desktop screens that must not regress) and iOS 003-sign-in.
 * They disagree on copy, on layout and on which controls exist, so the phone
 * rendering lives here as an absolutely-positioned layer inside
 * `@media (max-width: 767.98px)` — the same boundary `.shotiq-phone-flow` and
 * `ResponsiveTitle` already use. Above it, not one declaration here matches, so
 * 077 renders exactly as it did.
 *
 * The page keeps ONE set of form controls. A second, phone-only form would put
 * two `input[type=email]`, two `[data-testid=signin-submit]` and two "Create
 * account" links in the DOM, and both e2e specs that drive this screen resolve
 * their controls by CSS selector — they would fail Playwright's strict mode.
 * So the controls are shared and only their geometry is re-authored.
 *
 * EVERY number below is measured off canonical/003-sign-in.png at 1:1. That
 * canvas is 853x1844 device px at the capture scale 853/393 = 2.170483, so `D`
 * converts one canonical device pixel to one CSS pixel and each coordinate can
 * be read straight back off the PNG.
 *
 * Method (carried from 001 and 002 — do not relearn):
 *   - measure in the SHIPPING rasteriser (`--font-render-hinting=none`); a bare
 *     chromium.launch() hints stems and shifts advances, which produced a false
 *     +5px advance defect on 001;
 *   - weight on the GREEN channel (Chromium puts LCD subpixel AA on some runs
 *     and canonical is greyscale everywhere); ink on ORANGE on the BLUE channel
 *     (canonical's orange has B 0.7-3 and its black B 0, so blue is
 *     colour-independent);
 *   - cap height is the sub-pixel 50%-coverage crossing of a run's own peak, so
 *     it is independent of ink colour;
 *   - hairlines and field borders are `<rect>`s in an SVG whose viewBox is
 *     1 unit = 1 canonical device px, because Chromium pixel-snaps a background
 *     box (and clamps a CSS border) to a whole CSS pixel — canonical draws them
 *     at 1.80-1.82 device px, i.e. 0.84 CSS px, which no CSS border can reach;
 *   - canonical is unsharp-masked (a small-type stem reads
 *     248/255/[74 85]/255/248 — ringing on BOTH sides), so below ~30px an
 *     eroded stroke core is unobtainable and colour is solved from total ink at
 *     matched geometry instead.
 *
 * TWO THINGS THIS SCREEN ADDED TO THE METHOD.
 *
 * 1. Canonical 003 is the FILLED, VALIDATED state, not the empty form. It draws
 *    a typed address, sixteen mask bullets, a green ring beside the address and
 *    two "Looks good." lines — five bands that do not exist until the player
 *    types. The route map therefore drives 003 with `fill` + `blur` steps; that
 *    is the real user path and it is deterministic. Capturing the empty form
 *    measures a different screen, the same class of mistake as capturing
 *    /signin signed IN (which redirects away entirely).
 *
 * 2. Placement quantises on TWO different lattices and both need beating.
 *    `top` moves a run in steps of ~2 device px and `left` in steps of ~2.17
 *    (one whole CSS px), so neither alone can land a cap-top or an ink-left
 *    that falls between. A `translate()` INSIDE the element's own transform
 *    does better: vertically it halves the step to one device px, which is
 *    Skia's floor (it positions glyphs at sub-pixel x but snaps y to whole
 *    device rows), and horizontally it is continuous. Every run therefore
 *    carries `tx`/`ty` probed against the render. The worst residual left on
 *    the screen is 0.49 device px of cap-top, i.e. under a quarter of a CSS
 *    pixel, and it is a lattice residual rather than a modelling error.
 */

/** canonical device px -> CSS px */
export const S = 853 / 393
export const D = (px: number) => px / S
const u = (px: number) => `${D(px).toFixed(4)}px`

/* --------------------------------------------------------------- colours ---
 * Screen-scoped, exactly as 001 and 002 did: the global `--shotiq-color-*`
 * tokens carry the 20 desktop screens that grade B+, so a disagreement on THIS
 * canonical render is overridden inside the phone media query and nowhere else.
 *
 * HOW THESE WERE SOLVED. Every one of these roles is set below 30px, where
 * ledger rule 8 says an eroded stroke core is unobtainable — canonical's
 * unsharp mask overshoots the core darker and the surround lighter, so the
 * darkest pixel in a run is NOT the colour. Measured, canonical's body copy
 * peaks at coverage 0.914 and its field labels at 0.918, which no flat colour
 * anywhere near this grey can reach.
 *
 * Total ink alone does not pin a colour either: ink is the product of colour
 * and stroke area, and font-weight moves the area, so (colour, weight) is
 * degenerate against ink. What breaks the degeneracy is the NORMALISED
 * coverage CDF — the fraction of a run's ink above each coverage level, scaled
 * by the count above 0.25. That shape is nearly weight-invariant and it is set
 * by the colour's ceiling, because a flat colour plateaus every stroke core at
 * exactly d/255 while canonical's ramps past it.
 *
 * The method is calibrated on runs whose colour is KNOWN. Canonical draws
 * `Continue with Apple`, `Continue with Google` and the email value in pure
 * black (darkest sample 0,0,0; coverage reaches 1.000). At matched cap and
 * advance, matching total ink on those three lands their whole ladder at
 * 0.98-1.13 of canonical — so canonical's rasteriser and this one agree on the
 * coverage distribution once the colour is right, and any grey whose CDF shape
 * disagrees has the wrong colour, not the wrong weight.
 *
 * Sweeping each role's level and scoring the CDF against canonical over
 * coverage 0.28-0.95 gives a clean interior minimum in every case (RMS CDF
 * distance, lower is better):
 *
 *   graphite  d 168 .1533 | 177 .1302 | 186 .1035 | 195 .1262 | 204 .1458
 *   label     d 168 .1691 | 177 .1363 | 186 .0785 | 195 .1062 | 204 .1466
 *   eyebrow   d 105 .1174 | 112 .0869 | 119 .0954 | 126 .1122 | 133 .1451
 *   green     d 236 .0872 | 243 .0726 | 249 .0748 | 253 .0781 | 255 .1008
 *
 * Hue is fixed separately by the ink-weighted R:G:B ratio of (255 - channel)
 * over the whole run — a large sample, per rule 8. Canonical's greys read
 * G/R 0.9890, B/R 0.9335 over 2,407 px of body copy and agree to 0.002 across
 * five independent runs.
 *
 *   role         solved              was          note
 *   graphite     #454751 (d 186)     #4E525F      body lede, Remember me, the
 *                                                 account line
 *   label        #454751 (d 186)     #4A4E5B      EMAIL / PASSWORD. The fit
 *                                                 lands on the SAME value as
 *                                                 the body grey from two
 *                                                 independent runs (187.6 and
 *                                                 185.4), i.e. canonical sets
 *                                                 one grey here, not two.
 *   eyebrow      #8A8B93 (d 117)     #8A8F97      AI ANALYSIS, OR — the level
 *                                                 barely moved, the hue did
 *   green        #0D9144 (d 242)     #0C9B4A      the two validation lines and
 *                                                 the check ring
 *   orange text  #FD3701             #FA3B06      Forgot password?, Create
 *                                                 account, the IQ. The CDF fit
 *                                                 puts green at 54.9 where the
 *                                                 PLATE's flat orange measures
 *                                                 54.89 over 18,000 px, so the
 *                                                 text orange IS the plate
 *                                                 token and the screen no
 *                                                 longer disagrees with it at
 *                                                 all. Distance is identical
 *                                                 (.0829) for the token and for
 *                                                 the free fit.
 *   ink          #000000                          unchanged; verified black by
 *                                                 the three runs above
 *
 * What is NOT reachable, stated with its numbers: canonical's body copy has
 * 490 px above coverage 0.75 and 1 px above 0.9; at d 186 the ceiling is 0.729
 * so this render has 0 px above 0.75. That gap is the unsharp mask (rule 9) and
 * no flat colour closes it — d 200 puts 1,130 px above 0.75 against canonical's
 * 490 and makes the whole CDF worse (.1145 against .1035).
 */
const COLOURS = `
  --shotiq-color-ink:#000000;
  --s3-rule:#D2D4D9;
  --s3-field-rule:#D5D5D9;
  --s3-hair:#DADADE;
  --s3-green:#0D9144;
  --s3-orange-text:#FD3701;
  --s3-graphite:#454751;
  --s3-label:#454751;
  --s3-eyebrow:#8A8B93;
  --s3-or:#838489;
`

/* ------------------------------------------------------------ type recipe ---
 * Canonical's UI face is a condensed grotesque that is not in the Wilson X
 * pack, so every UI run is Geist at a cap-matched size with the residual width
 * carried on `scaleX` — the treatment 002 landed. `scaleX` thins vertical stems
 * by the same factor, so weight is raised to put the stem back.
 *
 * The scale is NOT one number. Measured at each run's own cap height against
 * Geist at that same cap:
 *
 *   run                     canonical adv   Geist adv   ratio
 *   EMAIL                          68          88.8     0.766
 *   Continue with Apple           249         323.8     0.769
 *   OR                             28          36.1     0.776
 *   Continue with Google          266         342.0     0.778
 *   Sign in (plate label)          94         108.6     0.866
 *   Forgot password?              195         221.5     0.880
 *   Remember me                   159         177.3     0.897
 *   Don't have an account?        263         293.1     0.897
 *   Create account                195         207.8     0.938
 *   Continue your training,...    372         386.0     0.964
 *
 * Two clusters — ~0.77 for the tracked caps and the SSO labels, 0.88-0.96 for
 * body copy — i.e. canonical genuinely sets more than one cut, the same finding
 * 002 made ("canonical's BUTTON label is a different cut again from its body
 * copy"). They are scaled separately rather than averaged.
 *
 * `dx` / `dy` are the measured offsets from an element's own box origin to the
 * run's ink-left and 50%-crossing cap-top, in canonical device px. They are not
 * derived from font metrics — they are read back off the live render, because
 * Chromium snaps text to whole device rows and the reachable set for a cap-top
 * is a plateau, not a point (001's finding).
 */
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
  lead?: number     // line box, canonical px (multi-line runs only)
  width?: number    // canonical px (centred runs)
  bang?: boolean    // !important on size/leading (PageTitle sets them inline)
  tx?: number       // sub-pixel horizontal nudge, CSS px, applied inside the
                    // transform AFTER scaleX (so it moves the ink by
                    // scale * tx). `left` snaps to a whole CSS pixel — 2.17
                    // device px — so on its own it leaves up to 1.1 device px
                    // of ink-left error with no interior value; Skia positions
                    // glyphs at sub-pixel x, so a translateX inside the same
                    // transform is continuous and closes it.
  ty?: number       // sub-row vertical nudge, CSS px, applied inside the
                    // transform. `top` alone lands the run on a TWO-device-px
                    // lattice; a translateY inside the same transform halves
                    // that to one device px, which is Skia's floor (it does
                    // sub-pixel glyph positioning horizontally only). Probed,
                    // per rule 12, not derived.
  ox?: number       // origin x of the positioned ancestor, canonical px
  oy?: number       // origin y of the positioned ancestor, canonical px
}

const GEIST = "var(--font-geist-sans)"
const TUNGSTEN = "var(--font-shotiq-display)"

/* Button content-box origins: the three buttons are the only positioned
   ancestors on the phone layer, so their children are authored relative to
   them. */
const PLATE = { x: 52.3, y: 1104.7, w: 748.05, h: 104.3 }
const APPLE = { y: 1335.01, h: 101.28 }
const GOOGLE = { y: 1462.18, h: 105.88 }
const BOX_X = 52.05
const BOX_W = 748.35
/* Vertical trim on the two field texts: with `line-height` set to the field
   height the run centres on the box, and canonical sets its value 2.5 device px
   below that centre and its bullet row 2.1 px below. Probed against the live
   render, not assumed. */
const EMAIL_DY = 0
const PASS_DY = 0

export const RUNS: Record<string, Run> = {
  /* SHOTIQ — Geist at cap 44.85. Canonical advances 225.78 against Geist's 214.6
     at that cap, so scaleX runs slightly OVER 1 here; the wordmark is the one
     run on this screen that is WIDER than Geist. */
  wordmark: { x: 44, top: 41.29, size: 25.856, weight: 759, scale: 1.0481, ls: 0.0123,
              colour: "var(--shotiq-color-ink)", dx: 2.03, dy: 13.81, tx: -0.0527, ty: -0.0958 },
  eyebrow: { x: 51, top: 99.37, size: 12.053, weight: 501, scale: 0.9977, ls: 0.1115,
             colour: "var(--s3-eyebrow)", dx: 0.0, dy: 5.28, tx: 0.4064, ty: 0.7938 },
  /* SIGN IN — Tungsten. Canonical's stem/cap is 16.840/118.857 = 0.1417, where
     Tungsten Medium draws 0.1141 and Semibold 0.1533, so neither cut lands it
     alone. Solving cap, stem and glyph-width sum together against the measured
     response (cap = 1.52f + 2.1705t, stem = s(0.233f + 2.1705t),
     Sw = s(3.28f + 13.02t) for Semibold) gives f 77.15, t 0.734, s 0.858; the
     size and scale were then closed on the render itself to f 75.99, s 0.8539,
     which lands cap 119.985 against canonical's 120.017 and advance 331.65
     against 331.81. The Medium branch of the same solve wants t 2.96 — four
     times the stroke — and lands ink at 22,136 against canonical's 21,028
     (+5.3%), where Semibold lands 20,635 (-2.0%). Semibold ships; the Medium
     alternative is measured, not asserted. */
  display: { x: 52, top: 226.77, size: 75.99, weight: 600, scale: 0.8539, ls: 0.0547,
             ws: 7.14, stroke: 0.734, colour: "var(--shotiq-color-ink)", family: TUNGSTEN,
             bang: true, dx: 3.01, dy: 30.4, tx: -0.5503, ty: 0.6055 },
  /* The two-line lede is ONE run, so its size, scaleX and weight are solved
     JOINTLY against both lines rather than fitted to line 1 (ledger rule 14).
     Fitting line 1 alone parked all the error on line 2 — cap -0.628, advance
     +1.62 and ink +5.1% at once, which is not a one-parameter error.
     The cause is a face metric, measured: canonical's x-height on both lines is
     16.02 and 16.03 device px where Geist at the matched ascender-to-descender
     extent draws 18.18 and 18.23 — 13.5% larger. Line 2, "analyses, and
     progress.", has no capital at all, so it is almost entirely x-height and
     carries the whole discrepancy; line 1 has a cap C and four ascenders and
     hides it.
     The obvious alternative — size the run so the x-height matches — was
     measured, not assumed: at 12.58px the x-heights agree and the run collapses
     to cap -3.14 / -3.90 and ink -11.2% / -7.2%, far worse on every metric.
     Geist is the only body-weight face in the pack (the rest are Tungsten
     display and Boxed), so the x-height ratio is not selectable, and the joint
     fit below is the minimax: cap +0.298 / -0.461, advance -0.31 / +1.50,
     ink -2.5% / +2.1%. */
  body: { x: 52, top: 382.38, size: 14.464, weight: 352, scale: 0.9027, ls: -0.0044,
          colour: "var(--s3-graphite)", dx: -0.86, tx: -0.0358, dy: 6.075, ty: 1.1626,
          lead: 35.989 },
  labelEmail: { x: 53, top: 527.31, size: 12.784, weight: 646, scale: 0.7444, ls: 0.0514,
                colour: "var(--s3-label)", dx: 1.68, dy: 6.13, tx: -0.2228, ty: 0.3096 },
  helpEmail: { x: 53, top: 699.34, size: 12.548, weight: 401, scale: 0.8149, ls: 0.0230,
               colour: "var(--s3-green)", dx: 1.85, dy: 5.5, tx: -0.2657, ty: -0.7418 },
  labelPass: { x: 53, top: 779.01, size: 12.627, weight: 722, scale: 0.7074, ls: 0.0990,
               colour: "var(--s3-label)", dx: 0.28, dy: 6.61, tx: 0.1042, ty: 0.0862 },
  helpPass: { x: 53, top: 946.59, size: 12.501, weight: 389, scale: 0.8221, ls: 0.0115,
              colour: "var(--s3-green)", dx: 2.05, dy: 6.11, tx: 0.8350, ty: 0.0438 },
  remember: { x: 96, top: 1019.66, size: 12.467, weight: 386, scale: 0.8854, ls: -0.0018,
              colour: "var(--s3-graphite)", dx: 1.45, dy: 4.4, tx: -0.3799, ty: -0.3709 },
  forgot: { x: 604, top: 1019.71, size: 13.125, weight: 375, scale: 0.8462, ls: -0.0072,
            colour: "var(--s3-orange-text)", dx: 2.25, dy: 4.88, tx: 0.7514, ty: -0.6017 },
  signinLab: { x: 418, top: 1143.21, size: 17.355, weight: 443, scale: 0.8806, ls: -0.0325,
               colour: "#FFFFFF", dx: 1.16, dy: 8.52, tx: 0.0105, ty: -0.5165, ox: PLATE.x, oy: PLATE.y },
  or: { x: 412, top: 1280.99, size: 11.538, weight: 740, scale: 0.7141, ls: 0.1014,
        colour: "var(--s3-or)", dx: 0.64, dy: 6.29, tx: -0.0194, ty: 0.7855 },
  appleLab: { x: 338, top: 1373.19, size: 16.810, weight: 440, scale: 0.7918, ls: -0.0415,
              colour: "var(--shotiq-color-ink)", dx: 2.06, dy: 7.12, tx: 0.2211, ty: 0.0369,
              ox: BOX_X, oy: APPLE.y },
  googLab: { x: 331, top: 1502.42, size: 16.753, weight: 438, scale: 0.7957, ls: -0.0410,
             colour: "var(--shotiq-color-ink)", dx: -0.15, dy: 8.01, tx: -0.8164, ty: -0.3727,
             ox: BOX_X, oy: GOOGLE.y },
  acct1: { cx: 419.11, top: 1654.30, size: 12.482, weight: 389, scale: 0.9171, ls: -0.0056,
           colour: "var(--s3-graphite)", dx: 0, dy: 3.45, tx: -0.0100, ty: -0.7597, width: 500 },
  acct2: { cx: 426.95, top: 1708.37, size: 13.807, weight: 416, scale: 0.9203, ls: 0.0021,
           colour: "var(--s3-orange-text)", dx: 0, dy: 7.06, tx: -0.5907, ty: 0.5004, width: 500 },
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
  ]
  parts.push(`line-height:${r.lead ? u(r.lead) : "normal"}${r.bang ? " !important" : ""}`)
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
  return `.s3 [data-s3="${name}"]{${parts.join(";")}}`
}

/* ------------------------------------------------------------- boxes ------
 * From the sub-pixel centroid of each border edge, with the border taken as
 * 1 CSS px (2.1705 device px):
 *   email field    outer 52.05..800.4  x  568.58..679.39   345.2 x 51.05 CSS
 *   password field outer 52.05..800.4  x  820.67..929.06   345.2 x 49.94 CSS
 *   Sign in plate        52.30..800.35 x 1104.70..1209.00  344.6 x 48.05 CSS
 *   Apple button   outer 52.05..800.4  x 1335.01..1436.29  345.2 x 46.66 CSS
 *   Google button  outer 52.05..800.4  x 1462.18..1568.06  345.2 x 48.79 CSS
 *
 * The four bordered boxes do NOT share a height in canonical. That is the
 * render's own jitter, not measurement noise: every edge is a 2-3 row ramp
 * whose centroid is stable to 0.05 px and the four widths agree to 0.5 px.
 * They are reproduced as measured rather than regularised, because the grade is
 * measured against this PNG.
 *
 * Corner radius, fitted to the leftmost-inked column per row down each corner:
 * 11.5 device px on the fields and SSO buttons, 13 on the plate — 5.3 and 6.0
 * CSS px, so `--shotiq-radius-control` (6px) carries all five.
 */
function hitbox(name: string, y: number, h: number) {
  return `.s3 [data-s3="${name}"]{position:absolute;left:${u(BOX_X)};top:${u(y)};width:${u(BOX_W)};` +
    `height:${u(h)};border:0;border-radius:6px;background:transparent;padding:0;margin:0;display:block}`
}

export const PHONE_CSS = `@media (max-width: 767.98px){
.s3{${COLOURS.replace(/\s+/g, "")}position:relative;width:393px;height:852px;min-height:852px;
  overflow:hidden;background:var(--shotiq-color-paper);padding:0;margin:0}
.s3 [data-s3-contents]{display:contents}
.s3 [data-s3-off]{display:none!important}
.s3 [data-s3-iq]{color:var(--s3-orange-text)}
${runCss("wordmark", RUNS.wordmark)}
${runCss("eyebrow", RUNS.eyebrow)}
${runCss("display", RUNS.display)}
${runCss("body", RUNS.body)}
${runCss("labelEmail", RUNS.labelEmail)}
${runCss("helpEmail", RUNS.helpEmail)}
${runCss("labelPass", RUNS.labelPass)}
${runCss("helpPass", RUNS.helpPass)}
${runCss("remember", RUNS.remember)}
${runCss("forgot", RUNS.forgot)}
${runCss("signinLab", RUNS.signinLab)}
${runCss("or", RUNS.or)}
${runCss("appleLab", RUNS.appleLab)}
${runCss("googLab", RUNS.googLab)}
${runCss("acct1", RUNS.acct1)}
${runCss("acct2", RUNS.acct2)}
${hitbox("apple", APPLE.y, APPLE.h)}
${hitbox("google", GOOGLE.y, GOOGLE.h)}
/* The plate fill and all four field borders are drawn in the overlay, not as
   CSS boxes: Chromium snaps a background box to whole CSS pixels and clamps a
   CSS border to one whole CSS pixel, where canonical draws 1.85 device px
   (0.85 CSS) hairlines and puts the plate's left edge at 52.30 device px. The
   button keeps its own transparent box so it is still a real hit target. */
.s3 [data-s3="plate"]{position:absolute;left:${u(PLATE.x)};top:${u(PLATE.y)};width:${u(PLATE.w)};
  height:${u(PLATE.h)};border:0;border-radius:6px;background:transparent;
  padding:0;margin:0;display:block}
/* The value and the bullet mask are the input's own text, so a wrapper cannot
   scale them: the input itself carries the scaleX and divides its width back
   out so the control still spans its field. */
.s3 [data-s3="valueEmail"]{position:absolute;left:${u(BOX_X)};top:${u(568.58)};
  height:${u(110.81)};width:${u((800.4 - BOX_X) / 0.8692)};
  transform:scaleX(0.8692) translateY(2.0245px);transform-origin:0 0;
  font-family:${GEIST};font-weight:330;font-size:14.918px;letter-spacing:0em;
  line-height:${u(110.81)};padding-left:${u((151 + 0.73 - BOX_X) / 0.8692)};
  color:var(--shotiq-color-ink);background:transparent;border:0;outline:none;padding-top:0;
  padding-bottom:0;padding-right:0;margin:0}
/* 16 bullets, pitch 16.33 and diameter 9.09 canonical px. Chromium masks with
   U+2022 taken from the element's own font, so the diameter is set by the
   font-size and the pitch by the letter-spacing — two independent knobs, and
   no scaleX is needed. At 11.9px/0.352em the previous values drew a 6.09px
   bullet on a 16.70 pitch: the right rhythm around a disc a third too small,
   which is why the mask read -57% on ink. */
.s3 [data-s3="valuePass"]{position:absolute;left:${u(BOX_X)};top:${u(820.67)};
  height:${u(108.39)};width:${u(680)};transform:translateY(-0.1503px);
  font-family:${GEIST};font-weight:400;font-size:18.859px;letter-spacing:0.10463em;
  line-height:${u(108.39)};padding-left:${u(152 - 1.52 - BOX_X)};
  color:var(--shotiq-color-ink);background:transparent;border:0;outline:none;padding-top:0;
  padding-bottom:0;padding-right:0;margin:0}
.s3 [data-s3="valuePass"]::placeholder,.s3 [data-s3="valueEmail"]::placeholder{
  color:var(--shotiq-color-muted);letter-spacing:0em}
.s3 [data-s3="eye"]{position:absolute;left:${u(729)};top:${u(857)};width:${u(52)};height:${u(41)};
  padding:0;margin:0;transform:none;display:block;color:var(--shotiq-color-ink)}
.s3 [data-s3="checkbox"]{position:absolute;left:${u(52.60)};top:${u(1015.35)};width:${u(28.4)};
  height:${u(28.0)};margin:0;padding:0;appearance:none;-webkit-appearance:none;background:transparent;
  border:0;border-radius:${u(6)};box-shadow:inset 0 0 0 ${u(3.06)} var(--s3-label);
  transform:translate(${u(0.87)},${u(-0.594)})}
.s3 [data-s3="checkbox"]:checked{background:var(--shotiq-color-shotiqOrange);
  box-shadow:inset 0 0 0 ${u(3.06)} var(--shotiq-color-shotiqOrange)}
.s3 [data-s3="focus"]{display:block;position:absolute;left:${u(324.44 - PLATE.x)};
  top:${u(1122.78 - PLATE.y)};width:${u(67.0)};height:${u(67.0)};
  transform:translate(${u(0.64)},${u(1.364)})}
.s3 [data-s3="appleMark"]{display:block;position:absolute;left:${u(263.95 - BOX_X)};
  top:${u(1361.4 - APPLE.y)};width:${u(39.14)};height:${u(48.41)}}
.s3 [data-s3="googMark"]{display:block;position:absolute;left:${u(255.55 - BOX_X)};
  top:${u(1492.25 - GOOGLE.y)};width:${u(44.24)};height:${u(47.18)};
  transform:translate(${u(-1.02)},${u(-0.947)})}
/* Ink corrections for the two provider marks, scoped HERE rather than in the
   markup: both components are shared DOM and desktop 077 is graded on their
   markup values. Canonical draws the Apple glyph pure black (darkest sample
   0,0,0) where the shared markup fills #111111 — a coverage ceiling of 0.933,
   which is most of the -11.5% ink the mark read. Canonical's Google G is a
   heavier cut than the stock 48-unit path: at matched cap the stock path reads
   -14.1% on red, -8.6% on green and -5.1% on blue, i.e. every arc is thin
   rather than one arc misplaced, so each arc is stroked in its own fill
   colour. */
.s3 [data-s3="appleMark"] path{fill:#000000}
.s3 [data-s3="googMark"] path{stroke-width:1.35}
.s3 [data-s3="appleMark"] svg,.s3 [data-s3="googMark"] svg,.s3 [data-s3="focus"] svg{
  width:100%;height:100%;display:block}
.s3 [data-s3="error"]{position:absolute;left:${u(52)};top:${u(1222)};width:${u(750)};
  white-space:normal;font-family:${GEIST};font-size:12px;line-height:16px;
  color:var(--shotiq-color-reviewRed);margin:0}
.s3 [data-s3="overlay"]{position:absolute;left:0;top:0;pointer-events:none}
}`
