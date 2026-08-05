"use client"

/**
 * /welcome — canonical iOS screen 002-welcome.
 *
 * The signed-out landing surface. `/` (001-splash) forwards here once the auth
 * store has rehydrated and found no session; from here "Sign in" goes to
 * /signin (003) and "Create account" to /signup (004).
 *
 * EVERY number below is measured off canonical/002-welcome.png at 1:1. The
 * canonical canvas is 853x1844 device px at the capture scale 853/393 =
 * 2.170483, so `D` converts a canonical pixel to a CSS px and the mark overlay
 * is drawn in canonical pixels directly (viewBox 0 0 853 1844 laid out at
 * 393 CSS px wide, i.e. one user unit == one canonical pixel).
 *
 * Measurement method, carried over from 001:
 *   - cap heights are the sub-pixel distance between the 50%-coverage
 *     crossings of a run's own peak, so they are independent of ink colour;
 *   - weight is read from the 50%-crossing STEM WIDTH of a stem-only glyph and
 *     cross-checked against the area-at-coverage ladder on the GREEN channel
 *     (Chromium puts LCD subpixel AA on some runs and canonical is greyscale);
 *   - colour is solved from total ink at matched geometry, because canonical's
 *     small type never reaches full coverage — its PNG is unsharp-masked (a
 *     body stem reads 248 / 255 / [74 85] / 255 / 248 across its cross-section,
 *     i.e. ringing on both sides), so the darkest pixel overshoots the true ink
 *     and an eroded core cannot be sampled below ~30px.
 *
 * ----------------------------------------------------------------------------
 * TWO FACE-WIDTH FINDINGS, both measured across several strings so they are not
 * a one-string artifact. Both are handled with a horizontal scale rather than
 * with tracking, because tracking large enough to close them collapses the
 * inter-glyph gap to zero and welds the letters together.
 *
 * 1. Canonical's UI grotesque is ~10% NARROWER than Geist at matched cap
 *    height. Rendering seven canonical strings in Geist at each string's own
 *    canonical cap and comparing advance:
 *
 *      Instant AI analysis. Clear  canonical 275  Geist 295.6   0.930
 *      Better results.             canonical 154  Geist 167.7   0.918
 *      Get guided                  canonical  89  Geist  97.2   0.916
 *      Sign in                     canonical  90  Geist  96.6   0.932
 *      Monitor progress.           canonical 142  Geist 158.3   0.897
 *      AI breaks down              canonical 124  Geist 140.8   0.881
 *      Record from                 canonical  98  Geist 111.9   0.876
 *
 *    Boxed is no narrower (0.927 on the same body line), and the pack ships no
 *    other grotesque, so the residual is carried on `scaleX`. Weight is then
 *    raised to put the stem back, because scaleX thins vertical stems by the
 *    same factor.
 *
 * 2. Canonical's BUTTON label is a different cut again from its body copy:
 *    x-height/cap measures 0.712 on "Sign in" against 0.699 on the body
 *    paragraph, and its glyphs run 11% narrower than Geist at matched cap.
 *    "Sign in" and "Create account" need slightly different scales — 0.928 and
 *    0.877 — because canonical's S is 2.5% larger than its C where Geist draws
 *    the two the same.
 *
 * ----------------------------------------------------------------------------
 * Canonical, all in canonical (device) px. Cap is the 50%-crossing height of
 * the named glyph; advance is the ink bounding box at threshold 0.10.
 *
 *   run                 x        cap-top    advance   cap      green ink
 *   SHOTIQ              53        86.19       269    I 47.97     4461 (SHOT)
 *   AI ANALYSIS         54       159.92       210    A 20.74      874
 *   CAPTURE.            54       301.15       301    A 95.36    13797
 *   ANALYZE.            53       430.00       293    N 95.81    (orange)
 *   TRAIN.              53       559.07       208    R 95.93     9918
 *   TRACK.              53       689.11       224    R 95.24    10169
 *   rule                52       828          297    2 rows @ 198-206
 *   body line 1         56       863.33       275    I 18.54     1048
 *   body line 2         56       903.5        248                 951
 *   body line 3         56       944          154    B 18.58      613
 *   hero frame         415        99          408 x 894, radius 15.5
 *   BUILT FOR YOUR GAME 310      1071.65      230    B 29.04     2922
 *   flank rules         46-271 / 574-806      y 1086-1087
 *   step marks          see MARKS below       y 1156-1244
 *   step labels         92/282/491/690  1278.40  84/83/55/61  C 23.60
 *   step body           1323.27 / 1351 / 1379  R 13.87
 *   Sign in plate       46.66-804.82   1471.60-1565.23   r 14
 *   Sign in label      381      1505           90    S 24.13   area 791.3
 *   Create plate        48.1-804.6     1595.98-1685.96   ring 1.79
 *   Create label       322      1629          206    C 23.55   min-ink 1608
 *
 * COLOUR. Canonical's PLATE orange is read straight off the Sign-in plate,
 * which is 43,751 px of flat fill at erosion 6: the core is (253.2, 54.7, 0.6)
 * — `--shotiq-color-shotiqOrange` #FD3701 unchanged, so this screen does NOT
 * override the token. Canonical's TEXT orange is a different value and is
 * scoped separately; see `--shotiq-color-shotiqOrangeText` below. Three further
 * roles disagree with their tokens and are overridden SCOPE-LOCAL, as 001 did,
 * because they carry the 20 desktop screens that grade B+:
 *
 *   role      canonical                     token             this screen
 *   ink       (3.2, 3.1, 2.9) eroded core    #111111 (17)      #000000
 *   graphite  solved from ink at matched     #5F646B           #4B505D
 *             geometry on two runs: 81.0     (95,100,107)      (75,80,93)
 *             and 81.9 in green, hue
 *             R:G:B = 1 : 0.975 : 0.903
 *             over 275k ink px
 *   rule      1.92 device px of darkness 53   #EBECED (235)     #C9C9C9
 *             from y 828.08 under the lede;                      (+ #C8C8C8 at
 *             1.79 px of darkness 54 from      = 0.15 coverage     1.79 px for
 *             y 1086.00 on the two flanks                          the flanks)
 *   text      (253.0, 59.8, 2.6) eroded core  #FD3701 (253,55,1) #FD3C03
 *   orange    on ANALYZE., (251.6, 60.0, 4.0)                    (plate fill
 *             on IQ; the plate fill is a                          stays on the
 *             SEPARATE, verified role                             token)
 *
 * Canonical's paper reads 254 and its render carries a ~2-level lift at the
 * black end, so the 3-level gap on ink is the lift, not a defect.
 */

import React from "react"
import Link from "next/link"

/** canonical px -> CSS px */
const S = 853 / 393
const D = (px: number) => px / S

/* Screen-scoped ink roles — see the colour table above. Every colour reference
   below is still `var(--shotiq-color-…)`; only the values are scoped. */
const SCREEN_INK = {
  "--shotiq-color-ink": "#000000",
  "--shotiq-color-graphite": "#4B505D",
  "--shotiq-color-rule": "#C9C9C9",
  /* Canonical runs TWO oranges and the token carries only one of them. The
     Sign-in plate is 43,751 px of flat fill and its eroded core is dead stable
     at (253.2, 54.7, 0.6) from erosion 1 through 7 — that IS the token,
     #FD3701, and it is left alone. The TEXT orange is a different value:
     ANALYZE. reads (253.0, 59.8, 2.6) at erosion 5 (n 2185) and holds 59.6-60.4
     across erosions 2-7, and the wordmark's IQ reads (251.6, 60.0, 4.0) at
     erosion 3 (n 876). Both cores sit 8-10 px inside a flat glyph interior, so
     neither is unsharp ringing, and the two canonical oranges separate by
     dE76 1.26 — internally calibrated, not capture noise. Scope-local, like
     the three roles above: the token carries the 20 desktop screens.

     This override is applied ONLY to the two runs a deep core can prove. The
     step label ANALYZE and the Create-account label are 24 px caps whose
     erosion dies at depth 1 (n 177 and n 109, both already halo), and their
     green:blue ink ratio is contaminated by canonical's unsharp undershoot —
     measured on the Sign-in plate, whose colour is VERIFIED identical to the
     build's, canonical still reads 1.1% high on that ratio, and the bias grows
     with edge density (1.0% on the display run, 4.3-4.5% on the two small
     labels). At that size the role is unresolvable, so those two stay on the
     token. See ledger method rule "an eroded core is UNOBTAINABLE below ~30px". */
  "--shotiq-color-shotiqOrangeText": "#FD3C03",
} as React.CSSProperties

/* The UI grotesque, condensed to canonical's width — finding 1 above. */
const UI = (weight: number, size: number, scale: number) => ({
  fontFamily: "var(--font-geist-sans)",
  fontWeight: weight,
  fontSize: `${size}px`,
  transform: `scaleX(${scale})`,
})

/* ----------------------------------------------------- the display lede ----
 * The four display lines are the one place on this screen where the face's
 * width excess was carried on NEGATIVE tracking instead of on `scaleX`, and it
 * cost the inter-glyph gap. Measured at coverage 0.354 (threshold 90/254),
 * device px, green channel:
 *
 *   line       canonical widths / gaps            was
 *   CAPTURE.   33 39 34 33 35 35 30 13 / S48      39 43 [76] 39 39 30 11 / S24
 *   TRAIN.     34 35 39 13 36 12       / S38      41 39 43 11 42 11       / S20
 *   TRACK.     34 34 39 34 37 13       / S33      40 38 43 39 [52]        / S11
 *
 * Glyphs ran +10 to +21% wide and the gap total ran -47 to -67%; two runs lost
 * a segment boundary entirely because adjacent glyphs closed to touching.
 *
 * A horizontal scale alone cannot fix it, because scaleX thins the vertical
 * stems by the same factor and the stems were ALREADY 6-9% light. A stroke
 * alone cannot fix it either: at s=1 a stroke that lands the stem widens the
 * glyphs further. The two together are determined, not chosen. Writing f for
 * the font-size factor, s for scaleX and t for the stroke (device px), and
 * measuring the build's own base at f=s=1, t=0:
 *
 *     cap    = f*96.48 + t          -> canonical 96.24
 *     stem   = s*(f*10.995 + t)     -> canonical 11.799
 *     width  = s*(f*w0 + t)         -> canonical per-glyph
 *     hbar   = f*10.294 + t         -> canonical 11.636  (T crossbar)
 *
 * Only the first three can be satisfied at once. The shape parameter is
 * r = t/f: the stem/width ratio wants r = 4.95, the crossbar/cap ratio wants
 * r = 0.64, and no (f, s, t) — nor any scaleY, which scales cap and crossbar
 * together and so cannot separate them — satisfies both. r is set from the
 * charged pair (stem and width) and the crossbar is the residual. Swept live
 * against the canonical PNG at t = 1.2 / 1.3 / 1.4 / 1.45 / 1.5 / 1.6 / 1.7 /
 * 1.8 CSS px with s re-solved per line at each step, t = 1.5 is the knee:
 *
 *   t (CSS)   gap S err   stem err        crossbar   sigma6 blurred MAD
 *   1.3       0 0 -1 +1   -3.0 -2.9 -4.7   +8.4%      9.87
 *   1.5       +1 -1 0 -1  +0.2 -1.0 -1.2   +11%       8.91
 *   1.7       0 0 +1 0    +1.8 +0.7 +0.2   +15.8%     8.11
 *
 * Tungsten Semibold (600) was measured as the alternative to the stroke — its
 * stem/width ratio is 0.351 against canonical's 0.347, so it needs no stroke at
 * all — but at matched widths and cap it lands the crossbar at +11 to +14% and
 * the ink at +2.9 to +6.3%, i.e. no better, and its blurred MAD is 10.8-11.7
 * against 8.9 here. Medium plus the stroke ships.
 *
 * letter-spacing is then solved per line, not chosen: it is whatever holds the
 * ink advance at canonical's 301 / 293 / 208 / 224 once f, s and the stroke's
 * own +t of ink width are applied. All four come back POSITIVE.
 *
 * translateY is the third defect on this block. One `line-height` over four
 * different font-sizes put TRAIN. 1.07 device px high and TRACK. 1.22 low, and
 * the stroke moves every cap-top again (it grows the cap by t and the size
 * comes down to compensate). Each line carries its own, solved by iterating the
 * measured 50%-crossing cap-top against canonical's 301.14 / 429.80 / 559.01 /
 * 689.09. translateX is +1 device px on the two lines whose ink bbox the stroke
 * pushed 2 px left; it is deliberately NOT applied to the full bbox delta,
 * because the blurred-mass best fit says those runs are already registered and
 * a bigger shift takes sigma6 MAD from 8.1 back up to 10.8.
 */
const HEAD = [
  // text, font-size, letter-spacing (em), orange, scaleX, translateY, translateX
  ["CAPTURE.", 60.3609, 0.03435, false, 0.85516, 0.0028, 0] as const,
  ["ANALYZE.", 61.1897, 0.03795, true, 0.85868, -1.075, 0] as const,
  ["TRAIN.", 61.1994, 0.03140, false, 0.85177, -0.631, 0.5409] as const,
  ["TRACK.", 60.4670, 0.03294, false, 0.84747, -0.214, 0.5436] as const,
] as const

/* The stroke that carries the display stem — see the solve above. Applied to
   all four lines at one value; the per-line difference is carried on scaleX. */
const DISPLAY_STROKE = "1.5px"

const STEPS = [
  { label: "CAPTURE", cx: 134.3, bx: 133.3, ls: 0.0524, body: ["Record from", "any angle."], accent: false },
  { label: "ANALYZE", cx: 324.3, bx: 323.3, ls: 0.0712, body: ["AI breaks down", "every rep."], accent: true },
  { label: "TRAIN", cx: 519.8, bx: 517.3, ls: 0.0442, body: ["Get guided", "drills that fit", "your goals."], accent: false },
  { label: "TRACK", cx: 721.2, bx: 720.2, ls: 0.0473, body: ["Monitor progress.", "Stay consistent.", "Keep improving."], accent: false },
] as const

/* Body-copy scale and weight (finding 1). 0.903 is the mean of the seven
   string measurements; weight 440 puts the 50%-crossing stem back to
   canonical's 2.309 device px after the scale thins it. */
const BODY_SCALE = 0.868
const BODY_WEIGHT = 437
const STEP_SCALE = 0.818
const STEP_WEIGHT = 442
const BTN_SCALE = 0.877
const SIGNIN_SCALE = 0.928
const LABEL_SCALE = 0.94
const BTN_WEIGHT = 495
/* The four step labels were 2.6-4.0% light in GEOMETRY — measured on the BLUE
   channel, where canonical's orange (B 0.7-3) and its black (B 0) both read as
   full ink, so the number is colour-independent. Their advances and caps are
   already canonical's, so the deficit is stroke thickness, not width, and a
   hairline stroke is the only lever that adds thickness without adding width.
   Swept at 0.03 / 0.05 / 0.08 / 0.12 px against the blue-channel ink:

     stroke   CAPTURE  ANALYZE  TRAIN   TRACK
     0        -2.3%    -2.3%    -1.4%   -2.5%
     0.03     -0.2%    -0.7%    +0.2%   -0.8%
     0.05     +1.2%    +0.6%    +1.8%   +0.5%
     0.08     +3.7%    +2.9%    +4.1%   +2.6%

   0.05 ships: it holds all four inside +-2% and takes the ANALYZE label — the
   one the grade charged at -5.1% on the green channel — from -6.0% to -2.9%,
   into the same band as its three siblings. The residual on that label is NOT
   geometry: at 0.05 its blue-channel geometry is +0.6%, dead level with the
   other three, and the remaining green deficit is canonical's unsharp
   undershoot clipping the orange's blue channel. See the note on the text
   orange above for why the same artifact makes the label's colour unsolvable. */
const LABEL_STROKE = "0.05px"
/* Canonical draws the two rules that flank the eyebrow ~10% lighter than the
   one under the lede: 0.400 total coverage per column against 0.446.

   Both rules — and the one under the lede — are drawn as SVG rects inside the
   mark overlay rather than as absolutely-positioned boxes, because Chromium
   pixel-snaps a background box to a WHOLE CSS pixel: the lede rule was authored
   at top 828.5 / height 1.88 device px and painted at 829.11 / 2.170, i.e.
   three device rows (829 48, 830 54, 831 16) where canonical draws two
   (828 48.8, 829 52.7), 1.20 px low and 13% heavy. The overlay's viewBox is
   `0 0 853 1844` laid out at 393 CSS px, so one user unit is exactly one
   canonical device px and an SVG rect antialiases at its true sub-pixel edge.
   Solved from canonical's own rows: the lede rule is 1.92 px of #C9C9C9
   starting at y 828.08 (row 828 then reads 0.918 coverage, row 829 full, row
   830 nothing); the flank rules are 1.79 px of #C8C8C8 starting at y 1086.00. */
const FLANK_RULE = "#C8C8C8"

/* ---------------------------------------------------------------- marks ----
   Drawn in canonical pixels. Node centres and ring radii are measured off the
   canonical PNG by labelling connected components and their enclosed holes:
   a ring's inner diameter is its hole, its outer diameter its component box. */
const INK = "var(--shotiq-color-ink)"
const ORG = "var(--shotiq-color-shotiqOrange)"

function Bracket({ x, y, w, h, arm, sw }: { x: number; y: number; w: number; h: number; arm: number; sw: number }) {
  const o = sw / 2
  const d = [
    `M${x + arm} ${y + o} H${x + o} V${y + arm}`,
    `M${x + w - arm} ${y + o} H${x + w - o} V${y + arm}`,
    `M${x + arm} ${y + h - o} H${x + o} V${y + h - arm}`,
    `M${x + w - arm} ${y + h - o} H${x + w - o} V${y + h - arm}`,
  ].join(" ")
  return <path d={d} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="butt" />
}

function Marks() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0"
      width={393}
      height={1844 / S}
      viewBox="0 0 853 1844"
      fill="none"
    >
      {/* 1 — CAPTURE: framing bracket over a node run, one leg dashed */}
      <Bracket x={85} y={1162} w={97} h={82} arm={17} sw={2.8} />
      <path d="M115 1193.5 L138 1207.5 L157 1194" stroke={INK} strokeWidth={2.8} strokeLinejoin="round" />
      <path d="M114.8 1197 V1223.5" stroke={INK} strokeWidth={3} strokeDasharray="7 3.6" />
      {[
        [115, 1193.5],
        [157, 1194],
        [138, 1207.5],
        [114.5, 1227],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={4.2} stroke={ORG} strokeWidth={2.6} fill="var(--shotiq-color-paper)" />
      ))}

      {/* 2 — ANALYZE: the film gate, three cells, the scrub line on cell 3 */}
      <path d="M263 1177 V1233 M303 1177 V1233 M383 1177 V1233" stroke={INK} strokeWidth={2.79} />
      <path d="M261.6 1183 H384.4 M261.6 1228 H384.4" stroke={INK} strokeWidth={2.79} />
      <path d="M283.5 1201 V1210 M323 1201 V1210 M362 1201 V1210" stroke={INK} strokeWidth={2.79} />
      <path d="M343 1172.4 V1177.5" stroke={ORG} strokeWidth={2.79} />
      <path d="M343 1197.5 V1236.4" stroke={ORG} strokeWidth={2.85} />
      <circle cx={342.5} cy={1187} r={6.1} stroke={ORG} strokeWidth={2.8} fill="var(--shotiq-color-paper)" />

      {/* 3 — TRAIN: the live-capture peak, the working node held open */}
      <path d="M478 1196.2 L503.7 1165.7 L535.7 1218.6 L562.5 1184.5" stroke={INK} strokeWidth={2.97} strokeLinejoin="round" />
      <circle cx={478} cy={1196.2} r={5.0} stroke={INK} strokeWidth={3.08} fill="var(--shotiq-color-paper)" />
      <circle cx={503.7} cy={1165.7} r={5.35} stroke={INK} strokeWidth={2.86} fill="var(--shotiq-color-paper)" />
      <circle cx={562.5} cy={1184.5} r={5.25} stroke={INK} strokeWidth={2.97} fill="var(--shotiq-color-paper)" />
      <circle cx={535.7} cy={1218.6} r={12.2} stroke={ORG} strokeWidth={2.97} fill="var(--shotiq-color-paper)" />

      {/* 4 — TRACK: the rising node line, last node live */}
      <path d="M660.4 1226.8 L694 1187 L731 1211.5 L771.3 1163.7" stroke={INK} strokeWidth={2.97} strokeLinejoin="round" />
      <circle cx={660.4} cy={1226.8} r={5.8} stroke={INK} strokeWidth={2.76} fill="var(--shotiq-color-paper)" />
      <circle cx={694} cy={1187} r={5.6} stroke={INK} strokeWidth={2.86} fill="var(--shotiq-color-paper)" />
      <circle cx={731} cy={1211.5} r={5.25} stroke={INK} strokeWidth={2.86} fill="var(--shotiq-color-paper)" />
      <circle cx={771.3} cy={1163.7} r={6.1} stroke={ORG} strokeWidth={2.97} fill="var(--shotiq-color-paper)" />

      {/* the three step separators */}
      {[217.9, 422.9, 607.9].map((x) => (
        <path
          key={x}
          d={`M${x} 1199 L${x + 9.8} 1208.6 L${x} 1218.3`}
          stroke="var(--shotiq-color-muted)"
          strokeWidth={2.0}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {/* The three hairline rules. Here rather than in a positioned box so they
          land on their true sub-pixel rows — see the note on FLANK_RULE. */}
      <rect x={52.35} y={828.08} width={296.6} height={1.92} fill="var(--shotiq-color-rule)" />
      <rect x={46.97} y={1086.0} width={224.3} height={1.79} fill={FLANK_RULE} />
      <rect x={574.28} y={1086.0} width={232.5} height={1.79} fill={FLANK_RULE} />
    </svg>
  )
}

export default function WelcomePage() {
  return (
    <div
      data-testid="screen-ios-welcome"
      className="shotiq-canonical relative mx-auto min-h-[852px] w-full max-w-[393px] overflow-hidden bg-[var(--shotiq-color-paper)] text-[var(--shotiq-color-ink)]"
      style={SCREEN_INK}
    >
      {/* ---------------------------------------------------------- hero */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/canonical/002-hero.png"
        alt="Shooter at release with the pose graph and shot arc traced over the frame"
        width={408}
        height={894}
        className="absolute"
        style={{ left: D(415.5), top: D(99), width: D(408), height: D(894), borderRadius: D(15.5) }}
      />

      {/* ------------------------------------------------------- wordmark */}
      <div
        data-welcome="wordmark"
        className="absolute whitespace-nowrap"
        style={{
          left: D(50.4),
          top: D(70.9),
          fontFamily: "var(--font-geist-sans)",
          fontWeight: 775,
          fontSize: "31.09px",
          lineHeight: "36px",
          letterSpacing: "0.0378em",
        }}
      >
        <span style={{ color: "var(--shotiq-color-ink)" }}>SHOT</span>
        <span style={{ color: "var(--shotiq-color-shotiqOrangeText)" }}>IQ</span>
      </div>
      <div
        data-welcome="aianalysis"
        className="absolute whitespace-nowrap text-[var(--shotiq-color-graphite)]"
        style={{
          left: D(53.6),
          top: D(150.9),
          fontFamily: "var(--font-shotiq-inter)",
          fontWeight: 400,
          fontSize: "13.658px",
          lineHeight: "18px",
          letterSpacing: "0.1487em",
        }}
      >
        AI ANALYSIS
      </div>

      {/* ------------------------------------------------------ headline */}
      <div
        data-welcome="headline"
        className="shotiq-display absolute"
        style={{ left: D(51.25), top: D(293.25), lineHeight: `${D(129.26)}px` }}
      >
        {HEAD.map(([text, size, ls, accent, scale, dy, dx]) => (
          <div
            key={text}
            style={{
              fontSize: `${size}px`,
              letterSpacing: `${ls}em`,
              WebkitTextStrokeWidth: DISPLAY_STROKE,
              transform: `scaleX(${scale}) translateY(${dy}px) translateX(${dx}px)`,
              transformOrigin: "0 0",
              color: accent
                ? "var(--shotiq-color-shotiqOrangeText)"
                : "var(--shotiq-color-ink)",
            }}
          >
            {text}
          </div>
        ))}
      </div>

      {/* the rule under the lede is drawn in the mark overlay — see FLANK_RULE */}

      <p
        data-welcome="lede"
        className="absolute text-[var(--shotiq-color-graphite)]"
        style={{
          ...UI(BODY_WEIGHT, 12.098, BODY_SCALE),
          transformOrigin: "0 0",
          left: D(55),
          top: D(854),
          width: D(335),
          lineHeight: `${D(40.4)}px`,
          letterSpacing: "0.027em",
        }}
      >
        Instant AI analysis. Clear insights. Smarter reps. Better results.
      </p>

      {/* ------------------------------------------------- BUILT FOR ... */}
      {/* the two flanking rules are drawn in the mark overlay — see FLANK_RULE */}
      <div
        data-welcome="eyebrow"
        className="shotiq-display absolute whitespace-nowrap text-center"
        style={{
          left: D(424.6 - 200),
          top: D(1064.3),
          width: D(400),
          fontSize: "19.16px",
          lineHeight: "24px",
          letterSpacing: "-0.0056em",
          wordSpacing: "2px",
          /* +1.15 device px: canonical's B cap-top is 1071.65 and this run
             painted at 1070.50, a full device row high — the same
             one-line-height-over-several-sizes error the display block carried. */
          transform: "scaleX(0.95) translateY(0.26px)",
        }}
      >
        BUILT FOR YOUR GAME
      </div>

      {/* ---------------------------------------------------- step strip */}
      <Marks />
      {STEPS.map((s) => (
        <React.Fragment key={s.label}>
          <div
            className="shotiq-display absolute whitespace-nowrap text-center"
            style={{
              left: D(s.cx - 100),
              top: D(1271),
              width: D(200),
              fontSize: "15.575px",
              lineHeight: "20px",
              letterSpacing: `${s.ls}em`,
              transform: `scaleX(${LABEL_SCALE})`,
              WebkitTextStrokeWidth: LABEL_STROKE,
              color: s.accent ? "var(--shotiq-color-shotiqOrange)" : "var(--shotiq-color-ink)",
            }}
          >
            {s.label}
          </div>
          <div
            className="absolute text-center text-[var(--shotiq-color-graphite)]"
            style={{
              ...UI(STEP_WEIGHT, 9.156, STEP_SCALE),
              letterSpacing: "0.0304em",
              transformOrigin: "50% 0",
              left: D(s.bx - 110),
              top: D(1317.5),
              width: D(220),
              lineHeight: `${D(28)}px`,
            }}
          >
            {s.body.map((l) => (
              <div key={l}>{l}</div>
            ))}
          </div>
        </React.Fragment>
      ))}

      {/* ------------------------------------------------------- actions */}
      <Link
        href="/signin"
        data-testid="welcome-signin"
        className="absolute flex items-center justify-center bg-[var(--shotiq-color-shotiqOrange)]"
        style={{ left: D(47.0), top: D(1471.6), width: D(757.52), height: D(94.17), borderRadius: D(14) }}
      >
        <span
          className="whitespace-nowrap text-white"
          style={{ ...UI(BTN_WEIGHT, 14.96, SIGNIN_SCALE), lineHeight: `${D(56)}px`, letterSpacing: "-0.0129em" }}
        >
          Sign in
        </span>
      </Link>
      <Link
        href="/signup"
        data-testid="welcome-signup"
        className="absolute flex items-center justify-center bg-[var(--shotiq-color-paper)]"
        style={{
          left: D(46.75),
          top: D(1595.09),
          width: D(758.3),
          height: D(91.77),
          borderRadius: D(14),
          /* Chromium clamps a CSS `border` to a whole CSS pixel (2.17 device px
             here) and canonical draws 1.79, so the hairline is an inset ring:
             box-shadow spread is not rounded. */
          boxShadow: `inset 0 0 0 ${D(2.05)}px var(--shotiq-color-shotiqOrange)`,
        }}
      >
        <span
          className="whitespace-nowrap text-[var(--shotiq-color-shotiqOrange)]"
          style={{ ...UI(BTN_WEIGHT, 14.96, BTN_SCALE), lineHeight: `${D(56)}px`, letterSpacing: "0em" }}
        >
          Create account
        </span>
      </Link>
    </div>
  )
}
