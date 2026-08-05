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
 * COLOUR. Canonical's orange is read straight off the Sign-in plate, which is
 * 6611 px of flat fill: the median is exactly (253, 55, 1) — `--shotiq-color-
 * shotiqOrange` #FD3701 unchanged, so this screen does NOT override it. Two
 * roles do disagree with their tokens and are overridden SCOPE-LOCAL, as 001
 * did, because they carry the 20 desktop screens that grade B+:
 *
 *   role      canonical                     token             this screen
 *   ink       (3.2, 3.1, 2.9) eroded core    #111111 (17)      #000000
 *   graphite  solved from ink at matched     #5F646B           #4B505D
 *             geometry on two runs: 81.0     (95,100,107)      (75,80,93)
 *             and 81.9 in green, hue
 *             R:G:B = 1 : 0.975 : 0.903
 *             over 275k ink px
 *   rule      2 rows at 198-206, i.e. 0.45   #EBECED (235)     #C9C9C9
 *             per column under the lede,                        (+ #CFCFCF for
 *             0.40 on the two eyebrow rules                       the eyebrow)
 *             total coverage per column      = 0.15 coverage
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
} as React.CSSProperties

/* The UI grotesque, condensed to canonical's width — finding 1 above. */
const UI = (weight: number, size: number, scale: number) => ({
  fontFamily: "var(--font-geist-sans)",
  fontWeight: weight,
  fontSize: `${size}px`,
  transform: `scaleX(${scale})`,
})

const HEAD = [
  // text, font-size, letter-spacing, orange
  ["CAPTURE.", 62.63, -0.0283, false],
  ["ANALYZE.", 63.49, -0.0206, true],
  ["TRAIN.", 63.50, -0.031, false],
  ["TRACK.", 62.74, -0.0341, false],
] as const

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
/* Canonical draws the two rules that flank the eyebrow ~10% lighter than the
   one under the lede: 0.400 total coverage per column against 0.446. */
const FLANK_RULE = "#CFCFCF"

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
        <span style={{ color: "var(--shotiq-color-shotiqOrange)" }}>IQ</span>
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
        {HEAD.map(([text, size, ls, accent]) => (
          <div
            key={text}
            style={{
              fontSize: `${size}px`,
              letterSpacing: `${ls}em`,
              color: accent ? "var(--shotiq-color-shotiqOrange)" : "var(--shotiq-color-ink)",
            }}
          >
            {text}
          </div>
        ))}
      </div>

      <span
        aria-hidden="true"
        className="absolute bg-[var(--shotiq-color-rule)]"
        style={{ left: D(52), top: D(828.5), width: D(297), height: D(1.88) }}
      />

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
      <span aria-hidden="true" className="absolute" style={{ left: D(46), top: D(1086), width: D(226), height: D(1.88), background: FLANK_RULE }} />
      <span aria-hidden="true" className="absolute" style={{ left: D(574), top: D(1086), width: D(233), height: D(1.88), background: FLANK_RULE }} />
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
          transform: "scaleX(0.95)",
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
