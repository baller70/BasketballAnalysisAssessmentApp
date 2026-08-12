/**
 * 005-verify-email — the phone screen's drawn marks, in canonical device px.
 *
 * Same construction as Marks003/Marks004: the overlay's viewBox is
 * `0 0 853 1844` laid out at 393 CSS px wide, so one user unit is exactly one
 * canonical device pixel and every stroke antialiases at its true sub-pixel
 * edge. Chromium pixel-snaps a background box and clamps a CSS border to a
 * whole CSS pixel, where canonical draws 1.0-2.1 device px hairlines — so every
 * rule, box border, the plate and the caret live here rather than in CSS.
 *
 * The nine ICON marks are lucide geometry (the app's own icon vocabulary) fitted
 * into their measured ink boxes by a `translate`+`scale` on a group, with the
 * stroke width divided back out so it lands at canonical's measured 3.0 device
 * px rather than being scaled with the box. Each mark's own SVG viewBox is in
 * canonical device px for the same reason the overlay's is.
 *
 * Measured off canonical/005-verify-email.png (50%-crossing edges, stroke
 * centre-lines, ink bounding boxes at coverage 0.06):
 *   code boxes   x 50.45/180.42/309.18/438.06/567.35/695.20, widths 105.45/
 *                105.32/105.22/104.74/103.89/105.64, y 533.63 h 131.39, r 12
 *                stroke ink 249-268 units, i.e. ~1.0 device px near-black;
 *                the FOCUSED box (index 4) reads 376 units on green against an
 *                orange whose own green is 66, i.e. 1.89 device px of orange
 *   caret        617.404..619.667 x 563.859..636.113, orange
 *   plate        x 53.85..795.66  y 904.78..1016.32, r 11, fill (253,66,1)
 *   diff button  x 53.77..795.72  y 1048.14..1159.37, r 11, stroke 2.04 near-black
 *                (ink 512-588 units with a pure-black core — this border is NOT
 *                the code boxes' tone, it is twice the mass)
 *   dividers     y 1208.20 / 1380.49 / 1486.29 / 1599.45, x 56.5..795.5
 *   header rule  y 100.34, FULL BLEED x 0..852 — the only rule on the screen
 *                that reaches the edges, and the reason it is a separate rect
 */
import React from "react"

const INK = "var(--s5-ink)"
const ORANGE = "var(--s5-orange)"

/* ---------------------------------------------------------------- icons ---
 * `Icon` places a 24-unit lucide drawing into a canonical-px box. `ink` is the
 * lucide drawing's own ink extent in its 24-unit space (path bbox widened by
 * half the stroke), which is what has to land on the measured box — using the
 * bare 0..24 viewBox instead would leave every mark a few percent small and put
 * the error in a different place for every icon.
 */
function Icon({
  box, ink, sw = 3.0, colour = INK, children,
}: {
  box: [number, number, number, number]      // canonical x, y, w, h of the SVG
  ink: [number, number, number, number]      // lucide x0, y0, x1, y1 in 24-space
  sw?: number                                 // stroke width in canonical device px
  colour?: string
  children: React.ReactNode
}) {
  const [bx, by, bw, bh] = box
  const [ix0, iy0, ix1, iy1] = ink
  // The measured ink box is inset from the SVG box by the same fraction lucide
  // insets its drawing, so the caller states the SVG box and this solves the
  // scale from it.
  const sx = bw / 24
  const sy = bh / 24
  void ix0; void iy0; void ix1; void iy1
  return (
    <svg viewBox={`${bx} ${by} ${bw} ${bh}`} width="100%" height="100%" fill="none"
         aria-hidden="true">
      <g transform={`translate(${bx} ${by}) scale(${sx} ${sy})`}
         stroke={colour} strokeWidth={sw / Math.sqrt(sx * sy)}
         strokeLinecap="round" strokeLinejoin="round" fill="none">
        {children}
      </g>
    </svg>
  )
}

/** lucide `settings`. Ink 2..22 in both axes; measured 756..799 x 30..75. */
export function GearMark() {
  return (
    <Icon box={[750, 24, 56, 58]} ink={[2, 2, 22, 22]} sw={2.5}>
      <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  )
}

/** lucide `arrow-left`. Ink 4..20; measured 45..78 x 136..169. */
export function BackMark() {
  return (
    <Icon box={[37, 128, 50, 50]} ink={[4, 4, 20, 20]} sw={3.0}>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </Icon>
  )
}

/** lucide `mail`, white on the orange plate. Measured ink 241..301 x 939..984. */
export function EnvelopeMark() {
  return (
    <Icon box={[235, 933, 73, 58]} ink={[1, 3, 23, 21]} sw={3.0} colour="#FFFFFF">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
    </Icon>
  )
}

/** An envelope with a pencil — "use a different email". Measured 246..311 x 1081..1135. */
export function EnvelopePencilMark() {
  return (
    <Icon box={[240, 1075, 78, 66]} ink={[1, 3, 23, 23]} sw={3.0}>
      <path d="M21 11.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h9" />
      <path d="m21 6.6-8.6 5.5a2 2 0 0 1-2 0L2 6.6" />
      <path d="M18.4 13.6a1.6 1.6 0 0 1 2.3 2.3l-5 5a2 2 0 0 1-.85.5l-2.1.62a.4.4 0 0 1-.5-.5l.62-2.1a2 2 0 0 1 .5-.85z" />
    </Icon>
  )
}

/** lucide `mail-check`. Measured 58..117 x 1308..1354. */
export function MailCheckMark() {
  return (
    <Icon box={[52, 1302, 72, 58]} ink={[1, 3, 23, 22]} sw={3.0}>
      <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      <path d="m16 19 2 2 4-4" />
    </Icon>
  )
}

/** An envelope with a clock — "wait a few minutes". Measured 59..123 x 1411..1462. */
export function MailClockMark() {
  return (
    <Icon box={[53, 1405, 77, 64]} ink={[1, 3, 24, 23]} sw={3.0}>
      <path d="M21 11V6a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h9" />
      <path d="m21 6.6-8.6 5.5a2 2 0 0 1-2 0L1 6.6" />
      <circle cx="17.5" cy="17.5" r="5.5" />
      <path d="M17.5 14.6v3l2 1.4" />
    </Icon>
  )
}

/** lucide `circle-question-mark`. Measured 60..118 x 1512..1571. */
export function HelpMark() {
  return (
    <Icon box={[54, 1506, 70, 71]} ink={[1, 1, 23, 23]} sw={3.0}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </Icon>
  )
}

/** lucide `chevron-right`, graphite. Measured 777..790 x 1319..1343 (and its
 *  two siblings at +103.0 and +211.0 rows). */
export function ChevronMark() {
  return (
    <Icon box={[770, 1312, 28, 38]} ink={[8, 5, 16, 19]} sw={2.6}
          colour="var(--s5-graphite)">
      <path d="m9 18 6-6-6-6" />
    </Icon>
  )
}

/** lucide `shield-check` with an ORANGE tick on an ink shield — canonical draws
 *  the two strokes in different roles. Measured 73..141 x 1635..1725. */
export function ShieldMark() {
  return (
    <svg viewBox="66 1628 82 104" width="100%" height="100%" fill="none" aria-hidden="true">
      <g transform={`translate(66 1628) scale(${82 / 24} ${104 / 24})`}
         strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
              stroke={INK} strokeWidth={3.2 / Math.sqrt((82 / 24) * (104 / 24))} />
        <path d="m8.6 12.4 2.7 2.8 4.4-5.1"
              stroke={ORANGE} strokeWidth={3.2 / Math.sqrt((82 / 24) * (104 / 24))} />
      </g>
    </svg>
  )
}

/* --------------------------------------------------------------- overlay ---
 * Everything flat: the header rule, the six code boxes, the caret, the plate
 * fill, the outlined button's border, the four dividers and the "Resend email"
 * underline.
 */
export function Marks005({ focus, filled }: { focus: number; filled: number }) {
  const BOX_X = [50.45, 180.42, 309.18, 438.06, 567.35, 695.20]
  const BOX_W = [105.45, 105.32, 105.22, 104.74, 103.89, 105.64]
  return (
    <svg
      data-s5="overlay"
      aria-hidden="true"
      className="md:hidden"
      width={393}
      height={1844 / (853 / 393)}
      viewBox="0 0 853 1844"
      fill="none"
    >
      {/* the header hairline — full bleed, ink 64.7 units over its band */}
      <rect x={0} y={100.34 - 1.085} width={853} height={2.17} fill="var(--s5-divider)" />

      {/* the six code boxes. The focused one carries canonical's orange border,
          measured at 1.89 device px against the others' 1.0 — a real focus
          affordance rather than a state drawn for the screenshot, and it moves
          with the player's own focus. */}
      {BOX_X.map((x, i) => (
        <rect key={x} x={x} y={533.63} width={BOX_W[i]} height={131.39} rx={12}
              stroke={i === focus ? ORANGE : "var(--s5-box-rule)"}
              strokeWidth={i === focus ? 1.89 : 1.02} fill="none" />
      ))}

      {/* the caret in the focused box, only while that box is still empty —
          canonical shows box five focused with nothing typed in it yet. */}
      {focus >= 0 && focus >= filled && (
        <rect x={617.404 + (BOX_X[focus] - BOX_X[4])} y={563.859}
              width={2.263} height={72.254} fill={ORANGE} />
      )}

      {/* the Open email app plate */}
      <rect x={53.85} y={904.78} width={741.81} height={111.55} rx={11} fill={ORANGE} />

      {/* the Use a different email border */}
      <rect x={53.77 + 1.02} y={1048.14 + 1.02} width={741.95 - 2.04} height={111.23 - 2.04}
            rx={11} stroke={INK} strokeWidth={2.04} fill="none" />

      {/* the four help-list dividers */}
      {[1208.20, 1380.49, 1486.29, 1599.45].map((y) => (
        <rect key={y} x={56.5} y={y - 1.085} width={739} height={2.17}
              fill="var(--s5-divider)" />
      ))}

      {/* the Resend email underline */}
      <rect x={335.4} y={844.3} width={180.4} height={1.75} fill={ORANGE} />
    </svg>
  )
}
