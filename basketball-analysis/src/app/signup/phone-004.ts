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
  display: { x: 69.04, top: 161.59, size: 49.63, weight: 600, scale: 0.8539, ls: 0.0547,
             ws: 3.85, stroke: 0.479, colour: "var(--shotiq-color-ink)", family: TUNGSTEN,
             bang: true, dx: 3.01, dy: 30.4, tx: 0, ty: 0 },
  lede1: { x: 69.24, top: 281.45, size: 14.464, weight: 352, scale: 0.9027, ls: -0.0044,
           colour: "var(--s4-graphite)", dx: -0.86, dy: 6.075, tx: 0, ty: 0 },
  lede2: { x: 68.91, top: 327.77, size: 14.464, weight: 352, scale: 0.9027, ls: -0.0044,
           colour: "var(--s4-graphite)", dx: -0.86, dy: 6.075, tx: 0, ty: 0 },
  oneacct: { x: 188.97, top: 444.30, size: 14.464, weight: 352, scale: 0.9027, ls: -0.0044,
             colour: "var(--s4-graphite)", dx: -0.86, dy: 6.075, tx: 0, ty: 0 },
  labFirst: { x: 69.39, top: 564.61, size: 14.30, weight: 700, scale: 0.640, ls: 0.0500,
              colour: "var(--shotiq-color-ink)", dx: 1.68, dy: 6.13, tx: 0, ty: 0 },
  labLast: { x: 69.39, top: 748.85, size: 14.30, weight: 700, scale: 0.640, ls: 0.0500,
             colour: "var(--shotiq-color-ink)", dx: 1.68, dy: 6.13, tx: 0, ty: 0 },
  labEmail: { x: 69.39, top: 931.45, size: 14.30, weight: 700, scale: 0.640, ls: 0.0500,
              colour: "var(--shotiq-color-ink)", dx: 1.68, dy: 6.13, tx: 0, ty: 0 },
  labPass: { x: 69.40, top: 1111.61, size: 14.30, weight: 700, scale: 0.640, ls: 0.0500,
             colour: "var(--shotiq-color-ink)", dx: 1.68, dy: 6.13, tx: 0, ty: 0 },
  labConfirm: { x: 69.35, top: 1316.29, size: 14.30, weight: 700, scale: 0.640, ls: 0.0500,
                colour: "var(--shotiq-color-ink)", dx: 1.68, dy: 6.13, tx: 0, ty: 0 },
  helpPass: { x: 69.56, top: 1263.08, size: 12.55, weight: 380, scale: 0.900, ls: -0.004,
              colour: "var(--s4-graphite)", dx: -0.5, dy: 5.5, tx: 0, ty: 0 },
  terms: { x: 129.34, top: 1484.20, size: 14.46, weight: 380, scale: 0.900, ls: -0.004,
           colour: "var(--shotiq-color-ink)", dx: -0.5, dy: 6.0, tx: 0, ty: 0 },
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
