/**
 * 003-sign-in — the phone screen's drawn marks, in canonical device pixels.
 *
 * The overlay's viewBox is `0 0 853 1844` laid out at 393 CSS px wide, so one
 * user unit is exactly one canonical device pixel and every stroke antialiases
 * at its true sub-pixel edge. This is also why the three hairlines live here
 * rather than in positioned boxes: Chromium pixel-snaps a background box to a
 * whole CSS pixel, which on 002 painted a rule authored at 828.5 device px with
 * a 1.88 px height at 829.11 / 2.170 instead.
 *
 * Measured off canonical/003-sign-in.png (stroke centre-lines, 50%-crossing
 * widths):
 *   header rule      y 145.38, h 1.82, x 0..853, (210,212,217)
 *   OR hairlines     y 1291.25, h 1.80, x 52..390 and 461..799, (218,218,222)
 *   envelope         body 80.4..117.1 x 610.4..638.9, flap vertex y 625.5,
 *                    stroke 3.3
 *   check ring       centre (757.2, 624.5) r 16.8, stroke 3.2, green
 *   padlock          body 82.1..109.5 x 873.2..894.2, shackle top 858.3,
 *                    stroke 3.3
 */
import React from "react"

export function Marks003({ emailOk }: { emailOk: boolean }) {
  const HAIR = "var(--s3-hair)"
  const SLATE = "var(--s3-label)"
  return (
    <svg
      data-s3="overlay"
      aria-hidden="true"
      className="md:hidden"
      width={393}
      height={1844 / (853 / 393)}
      viewBox="0 0 853 1844"
      fill="none"
    >
      {/* topbar hairline */}
      <rect x={0} y={145.38} width={853} height={1.82} fill="var(--s3-rule)" />

      {/* The Sign-in plate. Drawn here, not as a CSS background, because
          Chromium snaps a background box to whole CSS pixels and canonical puts
          the plate's left edge at 52.30 device px (24.10 CSS). */}
      <rect x={52.3} y={1104.7} width={748.05} height={104.3} rx={13}
            fill="var(--shotiq-color-shotiqOrange)" />

      {/* The four field/button hairlines. A CSS border is clamped to one whole
          CSS pixel (2.1705 device px); canonical draws 1.85. Stroke centre
          lines, straight off the PNG. */}
      {[
        [53.14, 569.66, 747.34, 108.64],
        [53.13, 821.75, 747.16, 106.23],
        [53.14, 1336.10, 746.43, 99.11],
        [53.12, 1463.26, 746.38, 103.71],
      ].map(([x, y, w, h]) => (
        <rect key={y} x={x} y={y} width={w} height={h} rx={10.6}
              stroke="var(--s3-field-rule)" strokeWidth={1.85} fill="none" />
      ))}

      {/* envelope */}
      <rect x={80.7} y={610.75} width={36.7} height={28.7} rx={4.2}
            stroke={SLATE} strokeWidth={3.44} fill="none" />
      <path d="M81.9 612.95 L99.05 625.85 L116.2 612.95" stroke={SLATE} strokeWidth={3.44}
            strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* validated-email ring + tick — live state, so it is drawn only while
          the address actually passes, exactly as the "Looks good." line is */}
      {emailOk && (
        <g>
          <circle cx={757.8} cy={624.92} r={16.8} stroke="var(--s3-green)" strokeWidth={3.18} fill="none" />
          <path d="M749.2 625.22 L755.4 631.62 L767.2 618.82" stroke="var(--s3-green)" strokeWidth={3.28}
                strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
      )}

      {/* padlock */}
      <rect x={82.63} y={873.85} width={27.41} height={20.72} rx={3.6}
            stroke={SLATE} strokeWidth={3.48} fill="none" />
      <path d="M88.17 873.83 V866.6 a8.1 8.1 0 0 1 16.2 0 V873.83"
            stroke={SLATE} strokeWidth={3.48} fill="none" />

      {/* the two OR hairlines */}
      <rect x={52} y={1291.25 - 0.9} width={338} height={1.8} fill={HAIR} />
      <rect x={461} y={1291.25 - 0.9} width={338} height={1.8} fill={HAIR} />
    </svg>
  )
}

/** The reveal control's eye, in its own canonical-unit viewBox.
 *  outer 734.8..773.7 x 862.7..891.4, pupil r 6.4 at (754.2, 877.05),
 *  stroke 3.5 — all centre-lines. */
export function EyeMark({ off }: { off: boolean }) {
  return (
    <svg viewBox="729 857 52 41" width="100%" height="100%" fill="none" aria-hidden="true">
      <path
        d="M734.8 877.05 C742 866.2 748.9 862.73 754.2 862.73 C759.5 862.73 766.4 866.2 773.68 877.05
           C766.4 887.9 759.5 891.38 754.2 891.38 C748.9 891.38 742 887.9 734.8 877.05 Z"
        stroke="var(--shotiq-color-ink)" strokeWidth={3.5} strokeLinejoin="round"
      />
      <circle cx={754.2} cy={877.05} r={6.4} stroke="var(--shotiq-color-ink)" strokeWidth={3.5} />
      {off && <path d="M736 859 L772 895" stroke="var(--shotiq-color-ink)" strokeWidth={3.5} strokeLinecap="round" />}
    </svg>
  )
}

/** The capture frame on the Sign-in plate: four corner brackets around a filled
 *  dot. Outer 330..382 x 1130..1184, arms 15, stroke 4.0, dot diameter 18
 *  centred on (356, 1157). */
export function FocusMark() {
  const x0 = 330, y0 = 1130, x1 = 383, y1 = 1185, a = 15, sw = 4.0, o = sw / 2
  return (
    <svg viewBox="324 1124 66 66" width="100%" height="100%" fill="none" aria-hidden="true">
      <path
        d={`M${x0 + a} ${y0 + o} H${x0 + o} V${y0 + a}
            M${x1 - a} ${y0 + o} H${x1 - o} V${y0 + a}
            M${x0 + a} ${y1 - o} H${x0 + o} V${y1 - a}
            M${x1 - a} ${y1 - o} H${x1 - o} V${y1 - a}`}
        stroke="#FFFFFF" strokeWidth={sw} strokeLinecap="butt" strokeLinejoin="miter"
      />
      <circle cx={356.5} cy={1157} r={9} fill="#FFFFFF" />
    </svg>
  )
}
