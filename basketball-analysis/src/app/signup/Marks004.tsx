/**
 * 004-create-account — the phone screen's drawn marks, in canonical device px.
 *
 * Same construction as `Marks003`: the overlay's viewBox is `0 0 853 1844` laid
 * out at 393 CSS px wide, so one user unit is exactly one canonical device
 * pixel and every stroke antialiases at its true sub-pixel edge. Chromium
 * pixel-snaps a background box and clamps a CSS border to a whole CSS pixel,
 * where canonical draws 1.74-2.24 device px hairlines — so every rule, field
 * border and plate lives here rather than in a positioned box.
 *
 * Measured off canonical/004-create-account.png (stroke centre-lines,
 * 50%-crossing edges):
 *   field borders   x 68.85..781.60, stroke 1.74, (219,220,224)
 *     first   y  607.56.. 700.41      last    y  792.71.. 884.54
 *     email   y  976.52..1067.87      pass    y 1151.19..1244.09
 *     confirm y 1356.35..1447.09
 *   Sign in box     y 1705.88..1796.63, stroke 1.70, (209,210,214) — measured
 *                   separately and it is NOT the field tone: its border ink
 *                   sums 0.294 coverage-units against the fields' 0.231, and
 *                   its peak 0.173 against 0.133.
 *   plate           x 68.09..782.43 y 1544.11..1636.23, r 8.6, (253,58,1)
 *   OR rules        y 1673.81, h 1.70, x 68.12..387.85 and 460.78..782.42
 *   corner radius   8.5 device px on every box (3.9 CSS) — fitted to the
 *                   leftmost inked column per row down each corner. 003's
 *                   boxes are 11.5/13; this screen's are smaller and the two
 *                   must not be shared.
 *
 * There is NO topbar hairline on 004. 003 draws one at y145.38; row-segmenting
 * 004 at threshold 0.02 finds no ink at all between y72 and y161, so the
 * desktop header's `border-b` is turned off on the phone rather than restyled.
 */
import React from "react"

/** The JE monogram. Not a font — canonical draws it as geometry: one long
 *  crossbar, a J stem that hooks left, and three E arms.
 *    crossbar  x  89.15..149.78  y 428.45..435.28
 *    J stem    centre x 112.0, w 6.80, hook centre-line r 11.8 about
 *              (100.2, 462.12), outer bottom 477.32, outer left 84.97
 *    E arms    y 442.52/456.60/470.64, each 6.8 tall, x 121.4..149.9
 */
export function Monogram() {
  const INK = "var(--shotiq-color-ink)"
  return (
    <svg viewBox="80 424 76 58" width="100%" height="100%" fill="none" aria-hidden="true">
      <rect x={89.15} y={428.45} width={60.63} height={6.83} fill={INK} />
      <path d="M112 431.9 V462.12 A11.8 11.8 0 0 1 88.4 464.6"
            stroke={INK} strokeWidth={6.8} fill="none" strokeLinecap="butt" />
      <rect x={121.82} y={442.52} width={28.06} height={6.85} fill={INK} />
      <rect x={121.87} y={456.60} width={28.09} height={6.76} fill={INK} />
      <rect x={121.00} y={470.64} width={28.84} height={6.69} fill={INK} />
    </svg>
  )
}

/** The reveal control's eye, in its own canonical-unit viewBox. Canonical draws
 *  BOTH password fields in the hidden state, so the slash is always present at
 *  rest and `off` merely tracks the live control.
 *    almond   x 714.80..754.70  y 1184.50..1214.51, centre (734.75, 1199.50)
 *    pupil    r 6.6 on the same centre
 *    slash    (717.5, 1182.0) -> (752.5, 1218.5), stroke 3.6 round
 *  The path is 003's EyeMark scaled to this screen's almond (x1.0262 wide,
 *  x1.0471 tall); the construction transferred unchanged, only the numbers did
 *  not.
 */
export function EyeMark004({ off, dy = 0 }: { off: boolean; dy?: number }) {
  const INK = "var(--s4-eye)"
  return (
    <svg viewBox={`712 ${1180 + dy} 46 42`} width="100%" height="100%" fill="none" aria-hidden="true">
      <g transform={`translate(0 ${dy})`}>
        <path
          d="M714.80 1199.50 C722.19 1188.14 729.27 1184.50 734.71 1184.50
             C740.15 1184.50 747.23 1188.14 754.70 1199.50
             C747.23 1210.86 740.15 1214.51 734.71 1214.51
             C729.27 1214.51 722.19 1210.86 714.80 1199.50 Z"
          stroke={INK} strokeWidth={3.6} strokeLinejoin="round"
        />
        <circle cx={734.75} cy={1199.50} r={6.6} stroke={INK} strokeWidth={3.6} />
        {off && (
          <path d="M717.5 1182 L752.5 1218.5" stroke={INK} strokeWidth={3.6} strokeLinecap="round" />
        )}
      </g>
    </svg>
  )
}

/** The capture frame on the Create-account plate: four corner brackets around a
 *  filled dot. This is 003's FocusMark with a new origin and nothing else —
 *  canonical draws it 52.89 x 54.67 here against 53 x 55 on 003, with the same
 *  15-unit arms, the same 4.0 stroke and the same r-9 dot, so the solved mark
 *  transferred without re-deriving it.
 *    outer 257.86..310.75 x 1562.65..1617.32, dot centre (284.5, 1590)
 */
export function FocusMark004() {
  const x0 = 257.9, y0 = 1562.6, x1 = 310.8, y1 = 1617.3, a = 15, sw = 4.0, o = sw / 2
  return (
    <svg viewBox="252 1557 64 66" width="100%" height="100%" fill="none" aria-hidden="true">
      <path
        d={`M${x0 + a} ${y0 + o} H${x0 + o} V${y0 + a}
            M${x1 - a} ${y0 + o} H${x1 - o} V${y0 + a}
            M${x0 + a} ${y1 - o} H${x0 + o} V${y1 - a}
            M${x1 - a} ${y1 - o} H${x1 - o} V${y1 - a}`}
        stroke="#FFFFFF" strokeWidth={sw} strokeLinecap="butt" strokeLinejoin="miter"
      />
      <circle cx={284.5} cy={1590} r={9} fill="#FFFFFF" />
    </svg>
  )
}

/** The share mark on the Sign in button — three rings and two connectors.
 *  Canonical uses THREE colours, and they are not decoration: the hub and the
 *  connectors are ink, the upper node is the ShotIQ orange and the lower node
 *  is the reviewRed token.
 *    hub    centre (340.5, 1754.5) r 4.9      ink
 *    upper  centre (359.0, 1734.5) r 4.4      #FD3701
 *    lower  centre (367.0, 1766.5) r 4.65     #D92D20
 *    stroke 2.2 on all five elements
 *  The lower node's red was read from the ring's far side, away from the
 *  connector: mean (217.7, 56.8, 39.8) over the pixels with R-G > 110, against
 *  the token's (217, 45, 32). The upper node's R never leaves 253-254 while its
 *  G dips to 46 — that is the orange, not a darker red.
 */
export function ShareMark() {
  const INK = "var(--shotiq-color-ink)"
  const SW = 2.2
  return (
    <svg viewBox="330 1726 48 50" width="100%" height="100%" fill="none" aria-hidden="true">
      <path d="M345.0 1749.7 L354.5 1739.3" stroke={INK} strokeWidth={SW} strokeLinecap="round" />
      <path d="M346.5 1757.2 L361.0 1763.8" stroke={INK} strokeWidth={SW} strokeLinecap="round" />
      <circle cx={340.5} cy={1754.5} r={4.9} stroke={INK} strokeWidth={SW} />
      <circle cx={359.0} cy={1734.5} r={4.4} stroke="var(--s4-orange)" strokeWidth={SW} />
      <circle cx={367.0} cy={1766.5} r={4.65} stroke="var(--s4-red)" strokeWidth={SW} />
    </svg>
  )
}

/**
 * The full-screen overlay: every rule, border, the plate, the monogram is drawn
 * elsewhere (it is positioned), and the terms checkbox.
 *
 * The checkbox ring and tick are drawn HERE and gated on the live `agreed`
 * value, exactly the way 003 gates its validation ring on `emailOk`: canonical
 * shows the CHECKED state, and that state has to be reached by the player
 * actually ticking the box, not faked. Unchecked it draws the same ring in the
 * field-rule tone so the control is still a real, visible control.
 *   ring outer 68.19..107.89 x 1472.15..1511.60, stroke 2.24, r 8
 *   tick x 79..98, y 1485..1499
 */
export function Marks004({ agreed }: { agreed: boolean }) {
  const FIELD = "var(--s4-field-rule)"
  const HAIR = "var(--s4-hair)"
  return (
    <svg
      data-s4="overlay"
      aria-hidden="true"
      className="md:hidden"
      width={393}
      height={1844 / (853 / 393)}
      viewBox="0 0 853 1844"
      fill="none"
    >
      {/* the five field borders — centre lines straight off the PNG */}
      {[
        [607.56, 92.85],
        [792.71, 91.83],
        [976.52, 91.35],
        [1151.19, 92.90],
        [1356.35, 90.74],
      ].map(([y, h]) => (
        <rect key={y} x={68.85} y={y} width={712.75} height={h} rx={8.5}
              stroke={FIELD} strokeWidth={1.74} fill="none" />
      ))}

      {/* the Create account plate */}
      <rect x={68.09} y={1544.11} width={714.34} height={92.12} rx={8.6}
            fill="var(--s4-orange)" />

      {/* the two OR hairlines. Ends measured at 50% of each rule's own peak, on
          the rule's own centre row and with the plateau estimated OUTSIDE the
          loud "OR" glyphs (rule 30): 68.12..387.85 and 460.78..782.42, so the
          centre gap is 72.93 and the rules are 319.73 / 321.64 long. */}
      <rect x={68.12} y={1673.81 - 0.85} width={319.73} height={1.70} fill={HAIR} />
      <rect x={460.78} y={1673.81 - 0.85} width={321.64} height={1.70} fill={HAIR} />

      {/* the Sign in button border */}
      <rect x={68.86} y={1705.88} width={712.74} height={90.75} rx={8.5}
            stroke={HAIR} strokeWidth={1.70} fill="none" />

      {/* the terms checkbox */}
      <rect x={69.31} y={1473.27} width={37.47} height={37.21} rx={7.4}
            stroke={agreed ? "var(--s4-green)" : FIELD} strokeWidth={2.24} fill="none" />
      {agreed && (
        <path d="M79.6 1492.6 L85.6 1499.2 L97.6 1485.6"
              stroke="var(--s4-green)" strokeWidth={3.5} fill="none"
              strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  )
}
