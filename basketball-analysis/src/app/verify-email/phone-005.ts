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
  --s5-box-rule:#050505;
  --s5-divider:#DDDDDD;
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
export const BOX_Y = 533.63
export const BOX_H = 131.39
export const BOX_R = 12.0
export const BOX_X = [50.45, 180.42, 309.18, 438.06, 567.35, 695.20]
export const BOX_W = [105.45, 105.32, 105.22, 104.74, 103.89, 105.64]
export const PLATE = { x: 53.85, y: 904.78, w: 741.81, h: 111.55, r: 11 }
export const DIFFBTN = { x: 53.77, y: 1048.14, w: 741.95, h: 111.23, r: 11 }
export const DIVIDERS = [1208.20, 1380.49, 1486.29, 1599.45]
export const DIVIDER_X = 56.5
export const DIVIDER_W = 739.0
export const HEADER_RULE = 100.34
/** The caret drawn inside the focused box. x 617.404..619.667, y 563.859..636.113. */
export const CARET = { x: 617.404, y: 563.859, w: 2.263, h: 72.254 }
/** "Resend email" is underlined: centroid y 845.1, x 335.4..515.8, ink 401 units. */
export const LINK_RULE = { x: 335.4, y: 844.3, w: 180.4, h: 1.75 }

export const RUNS: Record<string, Run> = {
  /* SHOTIQ. Canonical 004's wordmark and this one share a cap to the pixel —
     both span rows 35..72 — and differ only in WIDTH, 192 device px there
     against 183 here. So the solved 004 lockup transfers with its size and
     weight untouched and its scaleX trimmed by 183/192: 1.0470 -> 0.9979. That
     is rule 32 used the safe way round — the two axes were read together, the
     vertical agreed exactly, and only the horizontal moved. */
  wordmark: { x: 46.462, top: 34.805, size: 21.72, weight: 759, scale: 0.9979, ls: 0.0123,
              colour: "var(--s5-ink)", dx: 2.03, dy: 13.81, tx: 0, ty: 1.2670 },
  /* VERIFY YOUR EMAIL — and unlike 004's headline this one is OBLIQUE.
     There is no italic Tungsten in the repository (the four cuts are medium,
     semibold, bold, black), so the slant is a skewX on the upright cut. It is
     measured rather than guessed: the three vertical stems inside "EMAIL" move
     -0.1028, -0.107 and -0.1056 device px of x per device px of y between rows
     232 and 304, i.e. dx/dy = -0.1051, which is skewX(-6.00deg).
     Cap 124.81 device px (228.686..353.492) and advance 528.43 (166.352..
     694.779). Tungsten Semibold's cap is 0.724 of its font-size on 004's solved
     values, so the seed size is 124.81 / 0.724 / 2.170483 = 79.4 CSS px. */
  display: { x: 166.352, top: 228.686, size: 79.4, weight: 600, scale: 1.00, skew: -6.0,
             ls: 0.0, colour: "var(--s5-ink)", family: TUNGSTEN, bang: true,
             dx: 1.2, dy: 30.0, tx: 0, ty: 0 },
  /* "Enter the code we sent to" — cap 23.35 device px, advance 348.30. */
  lede1: { cx: 429.352, top: 402.412, size: 15.2, weight: 400, scale: 0.96, ls: -0.004,
           colour: "var(--s5-graphite)", dx: 0, dy: 7.9, width: 348.3, tx: 0, ty: 0 },
  /* The address, semibold and ink rather than graphite (G/R 0.9999, B/R 0.9988
     against lede1's 0.9882 / 0.9536 — two different roles on two lines of one
     sentence, which is why they are two runs and not one wrapped paragraph). */
  lede2: { cx: 428.430, top: 442.572, size: 16.4, weight: 600, scale: 0.96, ls: -0.004,
           colour: "var(--s5-ink)", dx: 0, dy: 8.6, width: 319.9, tx: 0, ty: 0 },
  /* The four typed digits. Cap 59.1 device px (570.5..629.6) and ink widths
     22.96 / 24.36 / 26.38 / 22.74 — ink-width/cap 0.40, where an unscaled Geist
     digit sits near 0.63, so the run is condensed by about a third. */
  digit0: { cx: 102.840, top: 570.475, size: 37.6, weight: 500, scale: 0.66, ls: 0,
            colour: "var(--s5-ink)", dx: 0, dy: 0, width: 105.45, tx: 0, ty: 0 },
  digit1: { cx: 232.068, top: 570.461, size: 37.6, weight: 500, scale: 0.66, ls: 0,
            colour: "var(--s5-ink)", dx: 0, dy: 0, width: 105.32, tx: 0, ty: 0 },
  digit2: { cx: 360.964, top: 571.017, size: 37.6, weight: 500, scale: 0.66, ls: 0,
            colour: "var(--s5-ink)", dx: 0, dy: 0, width: 105.22, tx: 0, ty: 0 },
  digit3: { cx: 490.455, top: 571.048, size: 37.6, weight: 500, scale: 0.66, ls: 0,
            colour: "var(--s5-ink)", dx: 0, dy: 0, width: 104.74, tx: 0, ty: 0 },
  /* Boxes five and six are EMPTY in canonical, so these two runs have no ink to
     measure against. They are the box centres — 567.35 + 103.89/2 and 695.20 +
     105.64/2 — carrying the same size and scale as the four that were measured,
     because a player who keeps typing must not see the digits change shape
     halfway along the row. Nothing here is fitted; it is stated. */
  digit4: { cx: 619.295, top: 570.75, size: 37.6, weight: 500, scale: 0.66, ls: 0,
            colour: "var(--s5-ink)", dx: 0, dy: 0, width: 103.89, tx: 0, ty: 0 },
  digit5: { cx: 748.020, top: 570.75, size: 37.6, weight: 500, scale: 0.66, ls: 0,
            colour: "var(--s5-ink)", dx: 0, dy: 0, width: 105.64, tx: 0, ty: 0 },
  /* "Resend code in" (graphite) and "0:42" (orange, heavier) are two runs
     because they are two roles: the label reads G/R 0.9876 / B/R 0.9523 and the
     value is orange. One window over both would measure neither (rule 57). */
  resendLab: { x: 287.865, top: 730.490, size: 15.9, weight: 400, scale: 0.96, ls: -0.004,
               colour: "var(--s5-graphite)", dx: 0.6, dy: 8.2, tx: 0, ty: 0 },
  resendVal: { x: 508.9, top: 730.490, size: 15.9, weight: 700, scale: 0.96, ls: -0.004,
               colour: "var(--s5-orange)", dx: 0.6, dy: 8.2, tx: 0, ty: 0 },
  /* "Resend email", orange, underlined — the rule is drawn in Marks005 rather
     than as text-decoration, because Chromium clamps an underline to a whole
     CSS pixel and canonical's is 1.75 device px (rule 11). */
  resendLink: { cx: 425.940, top: 810.824, size: 15.9, weight: 500, scale: 0.96, ls: -0.004,
                colour: "var(--s5-orange)", dx: 0, dy: 8.2, width: 174.9, tx: 0, ty: 0 },
  /* "Open email app" on the plate — white on orange. */
  plateLab: { x: 339.0, top: 946.0, size: 17.6, weight: 600, scale: 0.96, ls: -0.004,
              colour: "#FFFFFF", dx: 0.8, dy: 9.2, tx: 0, ty: 0,
              ox: PLATE.x, oy: PLATE.y },
  /* "Use a different email" inside the outlined button. */
  diffLab: { x: 348.0, top: 1093.0, size: 15.6, weight: 500, scale: 0.96, ls: -0.004,
             colour: "var(--s5-ink)", dx: 0.8, dy: 8.2, tx: 0, ty: 0,
             ox: DIFFBTN.x, oy: DIFFBTN.y },
  /* "DIDN'T GET THE EMAIL?" — micro-caps, cap 20.57 device px, advance 272.03. */
  didnt: { x: 59.317, top: 1251.083, size: 13.3, weight: 700, scale: 0.93, ls: 0.03,
           colour: "var(--s5-graphite)", dx: 0.8, dy: 7.0, tx: 0, ty: 0 },
  help1: { x: 169.384, top: 1320.903, size: 16.0, weight: 400, scale: 0.96, ls: -0.004,
           colour: "var(--s5-ink)", dx: 0.6, dy: 8.3, tx: 0, ty: 0 },
  help2: { x: 168.992, top: 1423.456, size: 16.0, weight: 400, scale: 0.96, ls: -0.004,
           colour: "var(--s5-ink)", dx: 0.6, dy: 8.3, tx: 0, ty: 0 },
  help3: { x: 170.419, top: 1531.877, size: 16.0, weight: 400, scale: 0.96, ls: -0.004,
           colour: "var(--s5-ink)", dx: 0.6, dy: 8.3, tx: 0, ty: 0 },
  /* "Your account is safe" — cap 26.77 device px, no descender in the run. */
  safe1: { x: 181.876, top: 1651.738, size: 17.4, weight: 600, scale: 0.96, ls: -0.004,
           colour: "var(--s5-ink)", dx: 0.8, dy: 9.0, tx: 0, ty: 0 },
  safe2: { x: 184.667, top: 1700.763, size: 15.2, weight: 400, scale: 0.96, ls: -0.004,
           colour: "var(--s5-graphite)", dx: 0.6, dy: 7.9, tx: 0, ty: 0 },
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

/** A positioned drawn mark. `w`/`h` are the SVG BOX, not the ink. */
function markBox(name: string, x: number, y: number, w: number, h: number) {
  return `.s5 [data-s5="${name}"]{position:absolute;left:${u(x)};top:${u(y)};width:${u(w)};` +
    `height:${u(h)};padding:0;margin:0;display:block;border:0;background:transparent}`
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
const MARK_BOXES: Record<string, [number, number, number, number]> = {
  gear: [750, 24, 56, 58],
  back: [37, 128, 50, 50],
  plateMark: [235, 933, 73, 58],
  diffMark: [240, 1075, 78, 66],
  helpMark1: [52, 1302, 72, 58],
  helpMark2: [53, 1405, 77, 64],
  helpMark3: [54, 1506, 70, 71],
  chev1: [770, 1312, 28, 38],
  chev2: [770, 1415, 28, 38],
  chev3: [770, 1523, 28, 38],
  shield: [66, 1628, 82, 104],
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
${Object.entries(MARK_BOXES).map(([k, [x, y, w, h]]) => markBox(k, x, y, w, h)).join("\n")}
.s5 [data-s5] svg{width:100%;height:100%;display:block}
/* KEYBOARD FOCUS. The code inputs paint no text of their own, so the UA focus
   ring is the only thing that could show a keyboard user where they are — and
   'outline:none' above removed it. It is put back as the same orange box the
   canonical focused state already draws, so the visible affordance and the
   canonical render are the same thing rather than two states in tension. */
.s5 [data-s5^="code"]:focus-visible{outline:${u(3.4)} solid var(--s5-orange);
  outline-offset:${u(2)};border-radius:${u(BOX_R)}}
.s5 [data-s5="plate"]:focus-visible,.s5 [data-s5="diffBtn"]:focus-visible,
.s5 [data-s5="resendLinkBox"]:focus-visible,.s5 [data-s5="helpRow1"]:focus-visible,
.s5 [data-s5="helpRow2"]:focus-visible,.s5 [data-s5="helpRow3"]:focus-visible{
  outline:${u(3.4)} solid var(--s5-orange);outline-offset:${u(1.5)}}
.s5 [data-s5="error"]{position:absolute;left:${u(56)};top:${u(690)};width:${u(740)};
  white-space:normal;text-align:center;font-family:${GEIST};font-size:12px;line-height:16px;
  color:var(--shotiq-color-reviewRed);margin:0}
.s5 [data-s5="overlay"]{position:absolute;left:0;top:0;pointer-events:none}
}`
