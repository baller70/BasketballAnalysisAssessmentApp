"use client"

/**
 * The two pieces of brand artwork canonical 001/002 draw and nothing else in
 * the build owns yet: the ShotIQ app-icon mark and the "shot arc over a pose
 * graph" hero diagram.
 *
 * Both are drawn, not cropped. Geometry is measured off canonical 001-splash
 * at 1:1 (853x1844) and expressed in a unit viewBox so a caller sizes them by
 * the box canonical gives them — the mark occupies 71.4 x 68.2pt at (60.8,
 * 246.5), the diagram 136.4 x 132.7pt at (128.1, 357.5).
 */

import React from "react"

const ORANGE = "var(--shotiq-color-shotiqOrange)"

/** App-icon mark: near-black rounded square (sampled #101213), a half
 *  basketball on the left and a brain on the right, both in ShotIQ orange. */
export function ShotIQMark({ size = 71 }: { size?: number }) {
  const h = Math.round((size * 68) / 71)
  return (
    <svg width={size} height={h} viewBox="0 0 71 68" aria-label="ShotIQ" role="img"
         className="block max-w-none">
      <rect x="0" y="0" width="71" height="68" rx="19" fill="#101213" />
      <g stroke={ORANGE} strokeWidth="3.1" fill="none" strokeLinecap="round">
        {/* left half-ball: the spine, the outer half-circle, the equator and
            the two curved side seams */}
        <path d="M35.5 12.5 V55.5" />
        <path d="M35.5 12.5 A21.5 21.5 0 0 0 35.5 55.5" />
        <path d="M14 34 H35.5" />
        <path d="M24.3 14.6 A21 21 0 0 1 24.3 53.4" />
      </g>
      {/* right half: the brain, a lobed orange body with dark folds cut out */}
      <g fill={ORANGE}>
        <path d="M37.6 12.5 h4.4 a7.4 7.4 0 0 1 6.6 3.1 a6.6 6.6 0 0 1 6.7 2.6
                 a6.4 6.4 0 0 1 4.5 4.6 a6.2 6.2 0 0 1 3.3 5.2 a6 6 0 0 1 -0.7 2.8
                 a6 6 0 0 1 2.4 4.6 a6 6 0 0 1 -2.3 4.6 a6 6 0 0 1 0.6 2.6
                 a6.2 6.2 0 0 1 -3.6 5.5 a6.4 6.4 0 0 1 -4.6 4.7
                 a6.6 6.6 0 0 1 -6.6 2.7 a7.4 7.4 0 0 1 -6.6 2.1 h-4.1 z" />
      </g>
      <g stroke="#101213" strokeWidth="2.6" fill="none" strokeLinecap="round">
        <path d="M45.4 17.6 a4 4 0 0 0 -0.4 6.2" />
        <path d="M53.3 20.4 a4.3 4.3 0 0 0 -3.6 4.6" />
        <path d="M52.6 30.6 a5 5 0 0 0 -1.4 6.6" />
        <path d="M45.6 44.4 a5.4 5.4 0 0 1 1.5 -7.4" />
        <path d="M46.2 50.6 a4 4 0 0 1 -0.6 -5.4" />
      </g>
    </svg>
  )
}

/**
 * The hero diagram: a shot arc that fades from a dotted tail into a ticked
 * solid head with an open ring at the apex end, over a five-node pose graph
 * with two orange joints. Measured 136.4 x 132.7pt on canonical 001.
 */
export function ShotArcDiagram({ width = 136 }: { width?: number }) {
  const h = Math.round((width * 133) / 136)
  return (
    <svg width={width} height={h} viewBox="0 0 136 133" fill="none" aria-hidden="true"
         className="block max-w-none">
      {/* arc — dotted tail, solid head */}
      <path d="M3 130 C10 92 26 58 50 38" stroke={ORANGE} strokeWidth="3"
            strokeLinecap="round" strokeDasharray="0.5 6" />
      <path d="M50 38 C68 24 90 17 111 17" stroke={ORANGE} strokeWidth="3" strokeLinecap="round" />
      {/* graduation ticks along the head of the arc */}
      <g stroke={ORANGE} strokeWidth="3" strokeLinecap="round">
        <path d="M39.5 40.5 l-3.5 -8.5" />
        <path d="M57 27.5 l-2.5 -9" />
        <path d="M78 20.5 l-1.5 -9.5" />
        <path d="M99 17.5 l-0.5 -9.5" />
      </g>
      <circle cx="118" cy="17" r="7.5" stroke={ORANGE} strokeWidth="3.4" fill="#FDFDFD" />

      {/* pose graph */}
      <g stroke="#0B0B0B" strokeWidth="2.6" strokeLinecap="round">
        <path d="M46 84 L34 111" />
        <path d="M46 84 L60 96" />
        <path d="M60 96 L48 129" />
        <path d="M60 96 L78 88" />
        <path d="M60 96 L74 62" />
        <path d="M74 62 L94 51" />
      </g>
      {[[46, 84], [34, 111], [48, 129], [78, 88], [94, 51]].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5" fill="#FDFDFD" stroke="#0B0B0B" strokeWidth="2.6" />
      ))}
      {[[60, 96], [74, 62]].map(([cx, cy]) => (
        <circle key={`o-${cx}`} cx={cx} cy={cy} r="5.6" fill="#FDFDFD" stroke={ORANGE} strokeWidth="3" />
      ))}
    </svg>
  )
}

/**
 * The faint court furniture canonical prints into the top-right and
 * bottom-left corners of the splash. Sampled at rgb(228,227,225) against
 * rgb(253,253,253) paper, so it is barely a step off the page.
 */
export function CourtWatermark() {
  const s = { stroke: "#E4E3E1", strokeWidth: 2.4, fill: "none" } as const
  return (
    <svg viewBox="0 0 393 852" aria-hidden="true"
         className="pointer-events-none absolute inset-0 h-full w-full">
      <g {...s}>
        <path d="M253 0 A118 118 0 0 0 393 118" />
        <path d="M321 0 V44 H393" />
        <path d="M140 852 A118 118 0 0 1 0 734" />
        <path d="M72 852 V808 H0" />
        <path d="M0 758 H99" />
        <path d="M393 94 H294" />
      </g>
    </svg>
  )
}
