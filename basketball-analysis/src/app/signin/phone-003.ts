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
 *   role         canonical                                   global token
 *   ink          (2.0, 1.7, 1.5) eroded core k2, n 15,971    #111111
 *                on SIGN IN; (4.3,4.3,4.3) on the Apple
 *                label; (2.1,2.1,2.1) on the email value
 *   plate orange (252.64, 54.89, 0.91) over 18,000 flat px   #FD3701  <- KEPT
 *                — that IS the token, so it is not overridden
 *   text orange  (250.7, 60.4, 7.1) k2 n 796 on the IQ       #FD3701
 *   rule         1.82 device px of (210,212,217) under the   #EBECED
 *                wordmark; field borders (213,213,217);
 *                the two OR hairlines (218,218,222)
 *   green        (12.4, 155.6, 75.6) k2 on the check ring    (no token)
 *
 * The greys below 30px cannot be cored at all, so they are solved from total
 * ink at matched geometry.
 */
const COLOURS = `
  --shotiq-color-ink:#000000;
  --s3-rule:#D2D4D9;
  --s3-field-rule:#D5D5D9;
  --s3-hair:#DADADE;
  --s3-green:#0C9B4A;
  --s3-orange-text:#FA3B06;
  --s3-graphite:#4E525F;
  --s3-label:#4A4E5B;
  --s3-eyebrow:#8A8F97;
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
  /* SHOTIQ — Geist 700 at cap 40.67. Canonical advances 226 against Geist's 211
     at that cap, so scaleX runs slightly OVER 1 here; canonical's wordmark is
     the one run on this screen that is WIDER than Geist. */
  wordmark: { x: 44, top: 41.29, size: 25.315, weight: 700, scale: 1.073, ls: 0.0123,
              colour: "var(--shotiq-color-ink)", dx: 1.6, dy: 13.6 },
  eyebrow: { x: 51, top: 99.37, size: 12.326, weight: 400, scale: 1.010, ls: 0.1115,
             colour: "var(--s3-eyebrow)", dx: 1.2, dy: 9.0 },
  /* SIGN IN — Tungsten. Canonical's stem/cap is 16.840/118.857 = 0.1417, where
     Tungsten Medium draws 0.1141 and Semibold 0.1533, so neither cut lands it
     alone. Solving cap, stem and glyph-width sum together against the measured
     response (cap = 1.52f + 2.1705t, stem = s(0.233f + 2.1705t),
     Sw = s(3.28f + 13.02t) for Semibold) gives f 77.15, t 0.734, s 0.858.
     The Medium branch of the same solve wants t 2.96 — four times the stroke —
     and lands ink at 22,136 against canonical's 21,028 (+5.3%), where Semibold
     lands 21,340 (+1.5%). Semibold ships; the Medium alternative is measured,
     not asserted. */
  display: { x: 52, top: 226.77, size: 77.147, weight: 600, scale: 0.860, ls: 0.0547,
             ws: 7.14, stroke: 0.734, colour: "var(--shotiq-color-ink)", family: TUNGSTEN,
             bang: true, dx: 4.0, dy: 20.0 },
  body: { x: 52, top: 382.38, size: 13.455, weight: 500, scale: 0.940, ls: -0.0044,
          colour: "var(--s3-graphite)", dx: 1.0, dy: 9.4, lead: 38.14 },
  labelEmail: { x: 53, top: 527.31, size: 12.703, weight: 700, scale: 0.750, ls: 0.0514,
                colour: "var(--s3-label)", dx: 0.6, dy: 8.8 },
  helpEmail: { x: 53, top: 699.34, size: 11.710, weight: 500, scale: 0.859, ls: 0.0230,
               colour: "var(--s3-green)", dx: 0.8, dy: 8.2 },
  labelPass: { x: 53, top: 779.01, size: 12.688, weight: 700, scale: 0.732, ls: 0.0990,
               colour: "var(--s3-label)", dx: 0.6, dy: 8.8 },
  helpPass: { x: 53, top: 946.59, size: 11.618, weight: 500, scale: 0.866, ls: 0.0115,
              colour: "var(--s3-green)", dx: 0.8, dy: 8.2 },
  remember: { x: 96, top: 1019.66, size: 12.245, weight: 500, scale: 0.886, ls: -0.0018,
              colour: "var(--s3-graphite)", dx: 1.0, dy: 8.6 },
  forgot: { x: 604, top: 1019.71, size: 12.305, weight: 600, scale: 0.852, ls: -0.0072,
            colour: "var(--s3-orange-text)", dx: 1.2, dy: 8.6 },
  signinLab: { x: 418, top: 1143.21, size: 16.244, weight: 500, scale: 0.923, ls: -0.0325,
               colour: "#FFFFFF", dx: 1.2, dy: 11.4, ox: PLATE.x, oy: PLATE.y },
  or: { x: 412, top: 1280.99, size: 11.505, weight: 700, scale: 0.756, ls: 0.1014,
        colour: "var(--s3-eyebrow)", dx: 0.6, dy: 8.0 },
  appleLab: { x: 338, top: 1373.19, size: 15.769, weight: 500, scale: 0.812, ls: -0.0415,
              colour: "var(--shotiq-color-ink)", dx: 1.2, dy: 11.2, ox: BOX_X, oy: APPLE.y },
  googLab: { x: 331, top: 1502.42, size: 15.643, weight: 500, scale: 0.822, ls: -0.0410,
             colour: "var(--shotiq-color-ink)", dx: 1.2, dy: 11.2, ox: BOX_X, oy: GOOGLE.y },
  acct1: { cx: 419, top: 1654.30, size: 12.550, weight: 500, scale: 0.886, ls: -0.0056,
           colour: "var(--s3-graphite)", dx: 0, dy: 8.8, width: 500 },
  acct2: { cx: 426, top: 1708.37, size: 13.590, weight: 500, scale: 0.912, ls: 0.0021,
           colour: "var(--s3-orange-text)", dx: 0, dy: 9.6, width: 500 },
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
    `transform:scaleX(${r.scale})`,
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
  height:${u(110.81)};width:${u((800.4 - BOX_X) / 0.858)};
  transform:scaleX(0.858) translateY(${u(EMAIL_DY)});transform-origin:0 0;
  font-family:${GEIST};font-weight:400;font-size:14.936px;letter-spacing:0em;
  line-height:${u(110.81)};padding-left:${u((151 - 1.0 - BOX_X) / 0.858)};
  color:var(--shotiq-color-ink);background:transparent;border:0;outline:none;padding-top:0;
  padding-bottom:0;padding-right:0;margin:0}
/* 16 bullets, pitch 16.33 and diameter 9 canonical px. Chromium masks with
   U+2022 taken from the element's own font, so the diameter is set by the
   font-size and the pitch by the letter-spacing — two independent knobs, and
   no scaleX is needed. */
.s3 [data-s3="valuePass"]{position:absolute;left:${u(BOX_X)};top:${u(820.67)};
  height:${u(108.39)};width:${u(680)};transform:translateY(${u(PASS_DY)});
  font-family:${GEIST};font-weight:400;font-size:11.9px;letter-spacing:0.352em;
  line-height:${u(108.39)};padding-left:${u(152 - 1.0 - BOX_X)};
  color:var(--shotiq-color-ink);background:transparent;border:0;outline:none;padding-top:0;
  padding-bottom:0;padding-right:0;margin:0}
.s3 [data-s3="valuePass"]::placeholder,.s3 [data-s3="valueEmail"]::placeholder{
  color:var(--shotiq-color-muted);letter-spacing:0em}
.s3 [data-s3="eye"]{position:absolute;left:${u(729)};top:${u(857)};width:${u(52)};height:${u(41)};
  padding:0;margin:0;transform:none;display:block;color:var(--shotiq-color-ink)}
.s3 [data-s3="checkbox"]{position:absolute;left:${u(52.4)};top:${u(1015.0)};width:${u(27.4)};
  height:${u(27.4)};margin:0;padding:0;appearance:none;-webkit-appearance:none;background:transparent;
  border:0;border-radius:${u(6)};box-shadow:inset 0 0 0 ${u(2.5)} var(--s3-label)}
.s3 [data-s3="checkbox"]:checked{background:var(--shotiq-color-shotiqOrange);
  box-shadow:inset 0 0 0 ${u(2.5)} var(--shotiq-color-shotiqOrange)}
.s3 [data-s3="focus"]{display:block;position:absolute;left:${u(324 - PLATE.x)};top:${u(1124 - PLATE.y)};
  width:${u(66)};height:${u(66)}}
.s3 [data-s3="appleMark"]{display:block;position:absolute;left:${u(266 - BOX_X)};
  top:${u(1362 - APPLE.y)};width:${u(38)};height:${u(47)}}
.s3 [data-s3="googMark"]{display:block;position:absolute;left:${u(254 - BOX_X)};
  top:${u(1491 - GOOGLE.y)};width:${u(45)};height:${u(48)}}
.s3 [data-s3="appleMark"] svg,.s3 [data-s3="googMark"] svg,.s3 [data-s3="focus"] svg{
  width:100%;height:100%;display:block}
.s3 [data-s3="error"]{position:absolute;left:${u(52)};top:${u(1222)};width:${u(750)};
  white-space:normal;font-family:${GEIST};font-size:12px;line-height:16px;
  color:var(--shotiq-color-reviewRed);margin:0}
.s3 [data-s3="overlay"]{position:absolute;left:0;top:0;pointer-events:none}
}`
