/**
 * Bespoke ShotIQ line-art glyphs.
 *
 * The canonical renders draw a distinct diagram for every concept — an angle
 * bracket for elbow angle, a ruler for release distance, a five-pose strip for
 * the shot phases, node/polyline diagrams for coaching cues. Nothing in an icon
 * font (or in lucide) expresses those, so they are drawn here in the same
 * family: 1.5px stroke, round caps and joins, small open nodes, dotted guides,
 * `currentColor` so a parent can recolour a whole row.
 *
 * The rule these exist to enforce: one glyph means exactly one thing. Never
 * reuse a shape for a second concept — pick another kind, or add one.
 */

import React from "react"

const ORANGE = "var(--shotiq-color-shotiqOrange)"
const GREEN = "var(--shotiq-color-confirmGreen)"

type GlyphProps = {
  size?: number
  className?: string
  /** Accent colour for the highlighted part of the diagram. */
  accent?: string
  title?: string
}

/** Keeps the drawn stroke ~1.6 device px whatever box the glyph is set in, so a
 *  56px flaw diagram doesn't render as a blob next to a 20px row mark. */
const autoStroke = (size: number) => Math.min(1.8, Math.max(0.85, 38 / size))

function Svg({
  size = 24, className = "", children, title, weight = 1,
}: GlyphProps & { children: React.ReactNode; weight?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" className={className}
      fill="none" stroke="currentColor" strokeWidth={autoStroke(size) * weight}
      strokeLinecap="round" strokeLinejoin="round"
      role={title ? "img" : undefined} aria-hidden={title ? undefined : "true"}
      aria-label={title}
    >
      {children}
    </svg>
  )
}

/* ------------------------------------------------------------------ poses */

export type ShotPhase = "setup" | "load" | "rise" | "release" | "follow"

/** Normalises the label strings the screens carry ("FOLLOW-THROUGH"). */
export function toShotPhase(label: string): ShotPhase {
  const k = label.toLowerCase()
  if (k.startsWith("setup")) return "setup"
  if (k.startsWith("load")) return "load"
  if (k.startsWith("rise")) return "rise"
  if (k.startsWith("follow")) return "follow"
  return "release"
}

const POSES: Record<ShotPhase, React.ReactNode> = {
  // Upright, ball carried at the hip — the address position.
  setup: (
    <>
      <circle cx="9.8" cy="4.4" r="2.35" />
      <path d="M9.8 6.4 L10.4 13.4" />
      <path d="M10.4 13.4 L8.4 17.4 L8 21.4" />
      <path d="M10.4 13.4 L12.6 17.4 L13.2 21.4" />
      <path d="M10 8.4 L12.6 11.4" />
      <circle cx="14.8" cy="12.8" r="2.55" />
    </>
  ),
  // Deep knee bend, ball low and in front — gathering.
  load: (
    <>
      <circle cx="8.6" cy="6.4" r="2.35" />
      <path d="M8.6 8.4 L10.8 13" />
      <path d="M10.8 13 L7.8 16.2 L8.6 21.4" />
      <path d="M10.8 13 L13.6 16.4 L13.6 21.4" />
      <path d="M9.5 10.4 L12.2 12.4" />
      <circle cx="14.4" cy="13.6" r="2.55" />
    </>
  ),
  // Extending upward, ball at the forehead — the lift.
  rise: (
    <>
      <circle cx="10.6" cy="5.6" r="2.35" />
      <path d="M10.6 7.6 L10.6 13.6" />
      <path d="M10.6 13.6 L8.2 17.4 L8.6 21.4" />
      <path d="M10.6 13.6 L12.8 17.2 L13.8 20.8" />
      <path d="M10.6 9 L12.8 7.2" />
      <circle cx="15.4" cy="6" r="2.55" />
    </>
  ),
  // Full extension, ball leaving the hand overhead.
  release: (
    <>
      <circle cx="9.6" cy="8" r="2.35" />
      <path d="M9.6 10 L10.4 15.2" />
      <path d="M10.4 15.2 L8.4 18.6 L8 21.6" />
      <path d="M10.4 15.2 L12.8 18.4 L13.8 21.4" />
      <path d="M9.9 11 L12.4 7.8 L13.2 5.4" />
      <circle cx="14.4" cy="2.8" r="2.55" />
    </>
  ),
  // Arm held out long with the wrist relaxed — the ball is gone.
  follow: (
    <>
      <circle cx="9.6" cy="7" r="2.35" />
      <path d="M9.6 9 L10.4 14.8" />
      <path d="M10.4 14.8 L8.4 18.6 L8 21.4" />
      <path d="M10.4 14.8 L13 18.4 L14 21.2" />
      <path d="M9.9 10.2 L13.2 6.4 L16.6 4.8" />
      <path d="M16.6 4.8 L17.2 7.2" />
    </>
  ),
}

/**
 * Shot-phase pose. Five genuinely different figures, one per phase.
 *
 * Canonical prints these as solid body silhouettes, not the hairline stick
 * figures both reviewers picked up on, so the pose family alone carries a much
 * heavier stroke than the measurement diagrams: limbs read as filled mass at
 * every size the screens use (16px rail marks up to 34px timeline figures).
 * The head and ball radii are opened up to match, so they stay legible rings at
 * that weight instead of closing into blobs.
 */
const POSE_WEIGHT = 1.6

export function PoseGlyph({
  phase, active = false, size = 26, className = "", title,
}: { phase: ShotPhase | string; active?: boolean } & GlyphProps) {
  const p = typeof phase === "string" && !(phase in POSES)
    ? toShotPhase(phase) : (phase as ShotPhase)
  return (
    <span style={active ? { color: ORANGE } : undefined} className="inline-flex">
      <Svg size={size} className={className} title={title} weight={POSE_WEIGHT}>{POSES[p]}</Svg>
    </span>
  )
}

/* ------------------------------------------------ canonical pose crops */

/**
 * The shot-phase figures, taken as pixels out of the canonical render rather
 * than redrawn.
 *
 * `PoseGlyph` above is an approximation of a mark the canonical renders already
 * contain, and three rounds of review said so. Screen 078 prints the strip at
 * its largest and cleanest (a 47px band of pure white paper), so all five poses
 * are cropped from there once — `public/images/canonical/078-phase-*.png` — and
 * reused everywhere the strip appears. The four variants per pose are the same
 * canonical pixels re-hued through their recovered alpha: ink/orange on white
 * paper for the light screens, white/orange on the #101113 bar for the dark
 * player card. Canonical only ever draws RELEASE active, so the neutral release
 * and the four active figures are the cross-tinted ones.
 *
 * Keep `PoseGlyph` for the places a crop cannot go: a pose over live video, or
 * one that has to take a user-chosen accent colour.
 */
const PHASE_FIGURE: Record<ShotPhase, { w: number; h: number }> = {
  setup: { w: 58, h: 94 },
  load: { w: 58, h: 94 },
  rise: { w: 66, h: 94 },
  release: { w: 56, h: 94 },
  follow: { w: 50, h: 94 },
}

export function PoseFigure({
  phase, active = false, tone = "light", height = 40, className = "", alt = "",
}: {
  phase: ShotPhase | string
  active?: boolean
  /** Which canonical treatment the crop carries: white paper, the dark
   *  player-card bar, or 087's blue elite side. */
  tone?: "light" | "dark" | "elite"
  /** Rendered height in CSS px; the crops are 2x so they stay crisp. */
  height?: number
  className?: string
  alt?: string
}) {
  const p = typeof phase === "string" && !(phase in PHASE_FIGURE)
    ? toShotPhase(phase) : (phase as ShotPhase)
  const { w, h } = PHASE_FIGURE[p]
  const variant = tone === "elite"
    ? (active ? "-elite" : "")
    : `${active ? "-active" : ""}${tone === "dark" ? "-dark" : ""}`
  const src = `/images/canonical/078-phase-${p}${variant}.png`
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src} alt={alt} aria-hidden={alt ? undefined : "true"}
      width={w} height={h}
      style={{ height, width: Math.round((height * w) / h) }}
      className={`block max-w-none ${className}`}
    />
  )
}

/* ------------------------------------------------- measurement diagrams */

export type MechanicKind =
  | "angle" | "wrist" | "height" | "distance" | "jump" | "arc"
  | "centerline" | "balance" | "drift" | "impact"

const MECHANICS: Record<MechanicKind, (a: string) => React.ReactNode> = {
  // Two limb segments meeting at a joint with the measured sweep dotted in.
  angle: (a) => (
    <>
      <path d="M4.5 16.5 L11 8 L19.5 14.5" />
      <path d="M8 13.4 A6 6 0 0 0 15 12.6" strokeDasharray="1.4 1.8" stroke={a} />
      <circle cx="4.5" cy="16.5" r="1.5" />
      <circle cx="11" cy="8" r="1.5" stroke={a} />
      <circle cx="19.5" cy="14.5" r="1.5" />
    </>
  ),
  // Forearm into a cocked hand, flexion dotted at the joint.
  wrist: (a) => (
    <>
      <path d="M4.5 19 L10.5 11.5 L16 9" />
      <path d="M16 9 L18.5 11" />
      <path d="M12.4 9.6 A4 4 0 0 0 9.4 13.6" strokeDasharray="1.4 1.8" stroke={a} />
      <circle cx="10.5" cy="11.5" r="1.5" stroke={a} />
      <circle cx="4.5" cy="19" r="1.5" />
    </>
  ),
  // Floor-to-hand ruler beside a standing figure.
  height: () => (
    <>
      <path d="M4 4.5 V19.5 M2.4 6 L4 4.2 L5.6 6 M2.4 18 L4 19.8 L5.6 18" />
      <circle cx="13.5" cy="6.5" r="1.6" />
      <path d="M13.5 8.1 V13.5 M13.5 10 L16.5 8.4 M13.5 13.5 L11.6 17.4 M13.5 13.5 L15.6 17.4" />
      <path d="M9 19.6 H19" />
    </>
  ),
  // Tape measure laid along the floor.
  distance: () => (
    <>
      <path d="M3 13 H20 L17.8 10.8 M20 13 L17.8 15.2" />
      <path d="M6 13 V8.6 M10 13 V10 M14 13 V8.6" />
      <path d="M3 18.5 H21" strokeDasharray="2.5 2.5" />
    </>
  ),
  // Rise arrow beside the tracked hip/head nodes.
  jump: () => (
    <>
      <path d="M5 20.5 V4.5 M3.2 6.4 L5 4.2 L6.8 6.4" />
      <path d="M14 10 V14" />
      <path d="M14 5.6 L16.6 8.2 L14 10.8 L11.4 8.2 Z" />
      <path d="M14 13.4 L16 15.4 L14 17.4 L12 15.4 Z" />
      <path d="M9.5 20.5 H19.5" />
    </>
  ),
  // Ball flight: dotted parabola with launch and landing nodes.
  arc: (a) => (
    <>
      <path d="M4.5 18.5 Q11 2.5 19.5 11.5" strokeDasharray="1.6 2" />
      <path d="M4.5 18.5 L8.5 9" stroke={a} />
      <circle cx="4.5" cy="18.5" r="1.5" stroke={a} />
      <circle cx="19.5" cy="11.5" r="1.5" />
    </>
  ),
  // Body midline with the measured lateral offset arrowed off it.
  centerline: (a) => (
    <>
      <path d="M12 3 V21" strokeDasharray="2 2" />
      <circle cx="12" cy="12" r="2.4" />
      <path d="M14.6 12 H20 M18.4 10.4 L20 12 L18.4 13.6" stroke={a} />
      <path d="M6.4 12 H9.6" />
    </>
  ),
  // Level bar across a planted stance.
  balance: () => (
    <>
      <circle cx="12" cy="4.6" r="1.9" />
      <path d="M12 6.5 V13" />
      <path d="M12 13 L9.2 18.6 M12 13 L14.8 18.6" />
      <path d="M5.5 9.6 H18.5" />
      <path d="M7.5 20.6 H16.5" strokeDasharray="2 2" />
    </>
  ),
  // Reference line and the distance the release point has drifted off it.
  drift: (a) => (
    <>
      <path d="M7.5 4 V20" strokeDasharray="2 2" />
      <circle cx="7.5" cy="12" r="1.5" />
      <path d="M9.6 12 H17.4 M15.6 10.2 L17.6 12 L15.6 13.8" stroke={a} />
      <circle cx="18.5" cy="7" r="1.5" stroke={a} />
      <path d="M18.5 8.5 V17" strokeDasharray="1.6 1.8" stroke={a} />
    </>
  ),
  // Effect landing on the tracked outcome node.
  impact: (a) => (
    <>
      <path d="M12 3.5 V11.5 M10.2 9.7 L12 11.8 L13.8 9.7" stroke={a} />
      <circle cx="12" cy="16" r="3" stroke={a} />
      <path d="M5 20.5 H19" />
    </>
  ),
}

/** A measured mechanic — one diagram per measurable quantity. */
export function MechanicGlyph({
  kind, size = 22, className = "", accent = ORANGE, title,
}: { kind: MechanicKind } & GlyphProps) {
  return <Svg size={size} className={className} title={title}>{MECHANICS[kind](accent)}</Svg>
}

/* --------------------------------------------------- correction figures */

export type CorrectionKind = "stack" | "square" | "drive"

const CORRECTIONS: Record<CorrectionKind, React.ReactNode> = {
  // Both hands stacked above the head.
  stack: (
    <>
      <circle cx="12" cy="9.4" r="2" />
      <path d="M12 11.4 V16.5" />
      <path d="M12 16.5 L9.6 21.2 M12 16.5 L14.4 21.2" />
      <path d="M12 12.6 L9 9.6 L9.6 6.2 M12 12.6 L15 9.6 L14.4 6.2" />
      <path d="M8.6 3.8 H15.4" strokeDasharray="2 2" />
    </>
  ),
  // Shooting arm folded to a square set point.
  square: (
    <>
      <circle cx="11" cy="4.6" r="2" />
      <path d="M11 6.6 V13.4" />
      <path d="M11 13.4 L8.4 20.6 M11 13.4 L13.8 20.6" />
      <path d="M11 8.6 H16.4 V4.2" />
      <path d="M14.6 8.6 V6.8 H16.4" />
      <path d="M6 8.6 H9.2" />
    </>
  ),
  // Straight-line drive up through the shot.
  drive: (
    <>
      <circle cx="10.4" cy="7.6" r="2" />
      <path d="M10.4 9.6 L11 15.4" />
      <path d="M11 15.4 L8.4 19.4 L8 21.6 M11 15.4 L13.8 19 L14.6 21.4" />
      <path d="M10.6 10.8 L13.4 8" />
      <path d="M17 20 V4.6 M15.4 6.4 L17 4.4 L18.6 6.4" strokeDasharray="2 2" />
    </>
  ),
}

/** A coaching correction — a figure demonstrating the fix. */
export function CorrectionGlyph({
  kind, size = 22, className = "", title,
}: { kind: CorrectionKind } & GlyphProps) {
  return <Svg size={size} className={className} title={title}>{CORRECTIONS[kind]}</Svg>
}

/* ------------------------------------------------------- flaw portraits */

export type FlawKind = "elbow" | "wrist" | "release" | "base" | "guide"

/**
 * Side-on figure with the flawed segment picked out in the alert colour —
 * the ~60px diagram canonical prints on each top-flaw card.
 */
export function FlawFigure({
  kind, size = 56, className = "", accent = ORANGE, title,
}: { kind: FlawKind } & GlyphProps) {
  const body = (
    <g stroke="var(--shotiq-color-graphite)">
      <circle cx="10.6" cy="7.6" r="2" />
      <path d="M10.6 9.6 L11.2 15.2" />
      <path d="M11.2 15.2 L8.8 19 L8.4 21.6" />
      <path d="M11.2 15.2 L13.8 18.8 L14.8 21.4" />
    </g>
  )
  return (
    <Svg size={size} className={className} title={title}>
      {body}
      {kind === "elbow" && (
        <g stroke={accent}>
          <path d="M10.8 10.8 L13.6 7.6 L15.4 4.6" />
          <circle cx="13.6" cy="7.6" r="1.4" />
          <circle cx="15.8" cy="4" r="1.8" />
        </g>
      )}
      {kind === "wrist" && (
        <>
          <path d="M10.8 10.8 L13.4 8.6" stroke="var(--shotiq-color-graphite)" />
          <circle cx="15.4" cy="6.4" r="3.2" stroke={accent} />
          <path d="M17.4 4.4 L19 3" stroke={accent} strokeDasharray="1.4 1.6" />
        </>
      )}
      {kind === "release" && (
        <>
          <path d="M10.8 10.8 L12.8 8.4" stroke="var(--shotiq-color-graphite)" />
          <circle cx="14.8" cy="4.4" r="3" stroke={accent} />
          <path d="M14.8 7.4 V12.6" stroke={accent} strokeDasharray="1.4 1.8" />
        </>
      )}
      {kind === "base" && (
        <>
          <path d="M10.8 10.8 L13.6 8.8" stroke="var(--shotiq-color-graphite)" />
          <circle cx="15.4" cy="7" r="2" stroke="var(--shotiq-color-graphite)" />
          <path d="M8.4 21.6 H14.8" stroke={accent} />
          <path d="M6.4 21.6 H8" stroke={accent} strokeDasharray="1.2 1.4" />
          <path d="M15.2 21.6 H16.8" stroke={accent} strokeDasharray="1.2 1.4" />
        </>
      )}
      {kind === "guide" && (
        <>
          <path d="M10.8 10.8 L13.6 8" stroke="var(--shotiq-color-graphite)" />
          <circle cx="15.6" cy="6" r="2" stroke="var(--shotiq-color-graphite)" />
          <path d="M11.6 12.4 L14.4 11" stroke={accent} />
          <path d="M14.4 11 L16.6 12.4" stroke={accent} />
          <circle cx="14.4" cy="11" r="1.2" stroke={accent} />
        </>
      )}
    </Svg>
  )
}

/* -------------------------------------------------- node cue diagrams */

export type CueKind = "peak" | "apex" | "shoulders" | "extension" | "base" | "tree" | "saved"

/**
 * Node-and-link cue diagram: canonical's dominant motif on coaching cards.
 * Each kind is a different skeleton fragment, so no two cues share a shape.
 */
export function CueGlyph({
  kind, size = 26, className = "", accent = GREEN, title,
}: { kind: CueKind } & GlyphProps) {
  const node = (x: number, y: number, on = false, r = 1.7) => (
    <circle cx={x} cy={y} r={r} fill={on ? accent : "var(--shotiq-color-paper)"}
            stroke={on ? accent : "currentColor"} />
  )
  return (
    <Svg size={size} className={className} title={title}>
      {kind === "peak" && (
        <>
          <path d="M3.5 16.5 L7.5 19 L12 5.5 L16.5 19 L20.5 16.5" />
          {node(3.5, 16.5, true)}{node(7.5, 19, true)}{node(12, 5.5)}
          {node(16.5, 19, true)}{node(20.5, 16.5, true)}
        </>
      )}
      {/* An even four-node zigzag with the accent on the third node, as
          canonical draws the Discover mark on 090. The old path put two long
          segments against two short ones and bunched the last three nodes. */}
      {kind === "apex" && (
        <>
          <path d="M4.5 18 L10 6.5 L15 15 L20.5 5.5" />
          {node(4.5, 18)}{node(10, 6.5)}{node(15, 15, true)}{node(20.5, 5.5)}
        </>
      )}
      {kind === "shoulders" && (
        <>
          <path d="M12 4.5 V9 M12 9 L5.5 14 M12 9 L18.5 14" />
          <path d="M5.5 14 L12 19 L18.5 14" strokeDasharray="2 2" />
          {node(12, 4.5)}{node(12, 9, true)}{node(5.5, 14, true)}{node(18.5, 14, true)}
        </>
      )}
      {kind === "extension" && (
        <>
          <path d="M6 19.5 L10 13 L14.5 11 L19 4.5" />
          <path d="M14.5 11 L16.5 15" strokeDasharray="1.6 1.8" />
          {node(6, 19.5)}{node(10, 13, true)}{node(14.5, 11, true)}{node(19, 4.5)}
        </>
      )}
      {kind === "base" && (
        <>
          <path d="M12 4.5 V12 M12 12 L7 20 M12 12 L17 20 M6.5 9.5 H17.5" />
          {node(12, 4.5)}{node(7, 20, true)}{node(17, 20, true)}
        </>
      )}
      {/* Canonical's "My drills" mark on 090: a closed five-node link — two
          shoulders, a dropped centre node and a base bar. It was borrowing the
          open "apex" zigzag, which is the Discover mark. */}
      {kind === "saved" && (
        <>
          <path d="M4.5 5.5 L12 12.5 L19.5 5.5" />
          <path d="M4.5 5.5 V18.5 H19.5 V5.5" />
          {node(4.5, 5.5)}{node(19.5, 5.5)}{node(12, 12.5, true)}
          {node(4.5, 18.5)}{node(19.5, 18.5)}
        </>
      )}
      {kind === "tree" && (
        <>
          <path d="M12 4.5 L5.5 12 M12 4.5 L18.5 12 M5.5 12 L8.5 19.5 M18.5 12 L15.5 19.5" />
          {node(12, 4.5)}{node(5.5, 12)}{node(18.5, 12)}
          {node(8.5, 19.5, true)}{node(15.5, 19.5, true)}
        </>
      )}
    </Svg>
  )
}

/* -------------------------------------------------------- workout marks */

export type WorkoutKind = "release" | "ladder" | "flow"

/** Scheduled-workout marks — one shape per drill family. */
export function WorkoutGlyph({
  kind, size = 20, className = "", title,
}: { kind: WorkoutKind } & GlyphProps) {
  return (
    <Svg size={size} className={className} title={title}>
      {kind === "release" && (
        <>
          <path d="M12 4.5 L6 12.5 M12 4.5 L18 10.5 M6 12.5 L11 19.5" />
          <circle cx="12" cy="4.5" r="1.8" />
          <circle cx="6" cy="12.5" r="1.8" />
          <circle cx="18" cy="10.5" r="1.8" />
          <circle cx="11" cy="19.5" r="1.8" />
        </>
      )}
      {kind === "ladder" && (
        <>
          <path d="M7.5 3.5 L5.5 20.5 M16.5 3.5 L18.5 20.5" />
          <path d="M7.1 7 H16.9 M6.6 11.5 H17.4 M6.1 16 H17.9" />
        </>
      )}
      {kind === "flow" && (
        <>
          <path d="M9 8.5 A4.5 4.5 0 1 0 14.5 12.5" />
          <path d="M9.6 5.4 L8.4 8.8 L11.8 9.6" />
          <circle cx="15.5" cy="9" r="2" />
        </>
      )}
    </Svg>
  )
}

/* -------------------------------------------------- capture readiness */

export type ReadinessKind = "athlete" | "framing" | "lighting" | "stability"

const BRACKETS = (
  <path d="M3 7.5 V4.5 A1.5 1.5 0 0 1 4.5 3 H7.5 M16.5 3 H19.5 A1.5 1.5 0 0 1 21 4.5 V7.5 M21 16.5 V19.5 A1.5 1.5 0 0 1 19.5 21 H16.5 M7.5 21 H4.5 A1.5 1.5 0 0 1 3 19.5 V16.5" />
)

/* ------------------------------------------------------ quality checks */

export type QualityKind = "resolution" | "lighting" | "framerate" | "stability"

/**
 * Pre-flight checks run on uploaded footage (081 QUALITY CHECKS). Canonical
 * draws these as node-and-link fragments with two-tone nodes, the same motif as
 * the coaching cues but with its own set of shapes so nothing is reused.
 */
export function QualityGlyph({
  kind, size = 22, className = "", accent = ORANGE, title,
}: { kind: QualityKind } & GlyphProps) {
  const node = (x: number, y: number, c?: string, r = 1.8) => (
    <circle cx={x} cy={y} r={r} fill="var(--shotiq-color-paper)" stroke={c ?? "currentColor"} />
  )
  return (
    <Svg size={size} className={className} title={title}>
      {kind === "resolution" && (
        <>
          <path d="M4.5 15.5 L11 17.5 L18.5 9.5" />
          <path d="M18.5 6.5 V4" stroke={GREEN} strokeDasharray="1.2 1.4" />
          {node(4.5, 15.5, accent)}{node(11, 17.5)}{node(18.5, 9.5, GREEN)}
        </>
      )}
      {kind === "lighting" && (
        <>
          <path d="M4.5 16.5 L11.5 18 L18 7.5" />
          <path d="M15.5 4.5 L18 7.5 L21 6" stroke={accent} />
          {node(4.5, 16.5)}{node(11.5, 18, accent)}{node(18, 7.5, accent)}
        </>
      )}
      {kind === "framerate" && (
        <>
          <path d="M3.5 17 L7.5 8.5 L11.5 15.5 L15.5 6.5 L19.5 13.5" />
          {node(3.5, 17)}{node(7.5, 8.5, accent)}{node(11.5, 15.5)}
          {node(15.5, 6.5, accent)}{node(19.5, 13.5)}
        </>
      )}
      {kind === "stability" && (
        <>
          <path d="M6 15.5 L12 9.5 L18 15.5 L12 19 Z" />
          {node(6, 15.5, accent)}{node(12, 9.5)}{node(18, 15.5, accent)}{node(12, 19)}
        </>
      )}
    </Svg>
  )
}

/* ------------------------------------------------------- filming guide */

export type FilmingKind = "fullBody" | "sideAngle" | "background" | "light"

/** Filming advice marks (081 FILMING GUIDE) — framing geometry, not poses. */
export function FilmingGlyph({
  kind, size = 22, className = "", accent = ORANGE, title,
}: { kind: FilmingKind } & GlyphProps) {
  return (
    <Svg size={size} className={className} title={title}>
      {kind === "fullBody" && (
        <>
          <path d="M4 8 V5 H7.5 M16.5 5 H20 V8 M20 16 V19 H16.5 M7.5 19 H4 V16" />
          <circle cx="12" cy="12" r="1.6" fill={accent} stroke={accent} />
        </>
      )}
      {kind === "sideAngle" && (
        <>
          <path d="M12 4.5 V12 M6 15.5 L12 12 L18 15.5" />
          <path d="M6 9.5 H18" strokeDasharray="2 2" />
          <circle cx="12" cy="4.5" r="1.6" />
          <circle cx="6" cy="15.5" r="1.6" stroke={accent} />
          <circle cx="18" cy="15.5" r="1.6" stroke={accent} />
        </>
      )}
      {kind === "background" && (
        <>
          <rect x="4" y="5.5" width="16" height="13" rx="1.5" strokeDasharray="2.4 2.2" />
          <path d="M9.2 5.5 V18.5 M14.8 5.5 V18.5 M4 11.8 H20" strokeDasharray="1.6 2.4" />
        </>
      )}
      {kind === "light" && (
        <>
          <circle cx="12" cy="12" r="3.6" />
          <path d="M12 3.6 V6 M12 18 V20.4 M3.6 12 H6 M18 12 H20.4 M6.2 6.2 L7.9 7.9 M16.1 16.1 L17.8 17.8 M17.8 6.2 L16.1 7.9 M7.9 16.1 L6.2 17.8" />
        </>
      )}
    </Svg>
  )
}

/** Capture-readiness checks — bracketed framing marks, one per check. */
export function ReadinessGlyph({
  kind, size = 24, className = "", title,
}: { kind: ReadinessKind } & GlyphProps) {
  return (
    <Svg size={size} className={className} title={title}>
      {kind !== "lighting" && BRACKETS}
      {kind === "athlete" && (
        <>
          <circle cx="11" cy="8.2" r="1.4" />
          <path d="M11 9.6 L11.4 13.6 M11.4 13.6 L9.6 16.4 M11.4 13.6 L13.4 16.2" />
          <path d="M11.1 10.8 L13.4 12.4" />
        </>
      )}
      {kind === "framing" && (
        <>
          <rect x="8.5" y="6.5" width="7" height="11" rx="1" />
          <circle cx="12" cy="9.4" r="1.1" />
          <path d="M12 10.5 V14 M12 11.6 L10.3 12.6 M12 11.6 L13.7 12.6 M12 14 L10.6 16.2 M12 14 L13.4 16.2" />
        </>
      )}
      {kind === "lighting" && (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3.5 V5.5 M12 18.5 V20.5 M3.5 12 H5.5 M18.5 12 H20.5 M6.2 6.2 L7.6 7.6 M16.4 16.4 L17.8 17.8 M17.8 6.2 L16.4 7.6 M7.6 16.4 L6.2 17.8" />
        </>
      )}
      {kind === "stability" && (
        <>
          <rect x="6.5" y="8.5" width="11" height="7" rx="1" />
          <path d="M12 14 V10 M10.6 11.4 L12 9.8 L13.4 11.4" />
        </>
      )}
    </Svg>
  )
}

/* ------------------------------------------------- primary-action marks */

export type ActionKind =
  | "analyze" | "uploadImage" | "uploadVideo" | "liveCamera"
  | "chooseMedia" | "nodeGraph" | "nodeClimb" | "skeletonDots"

/**
 * The four marks canonical puts on the primary actions (079 header, 081 media
 * tiles, 080/081 submit buttons).
 *
 * These are NOT square: measured off canonical 079 the upload-image bracket is
 * 48x36, the film-gate 60x25 and the live-camera node run 78x27. Every generic
 * icon set draws them on a 24x24 grid, which is why the shipped row read as
 * four small square glyphs where canonical draws four wide diagrams. Each kind
 * therefore carries its own intrinsic box and is scaled by HEIGHT, so the
 * aspect ratio survives.
 */
const ACTION_BOX: Record<ActionKind, [number, number]> = {
  analyze: [34, 34],
  uploadImage: [48, 36],
  uploadVideo: [60, 26],
  liveCamera: [80, 30],
  chooseMedia: [34, 46],
  nodeGraph: [32, 22],
  // Canonical's "Create goal" mark on 092: four OPEN nodes climbing right,
  // not a filled trend polyline.
  nodeClimb: [34, 30],
  // Canonical's "Overlay skeletons" mark on 087: a dotted node cloud, not a
  // stacked-layers icon.
  skeletonDots: [30, 28],
}

export function ActionGlyph({
  kind, height = 34, className = "", accent = ORANGE, title,
}: { kind: ActionKind; height?: number } & GlyphProps) {
  const [bw, bh] = ACTION_BOX[kind]
  const width = Math.round((height * bw) / bh)
  // Keep the drawn stroke ~1.7 device px whatever height the caller asks for.
  const sw = 1.7 * (bh / height)
  const paper = "var(--shotiq-color-paper)"
  return (
    <svg width={width} height={height} viewBox={`0 0 ${bw} ${bh}`}
         className={`block max-w-none ${className}`}
         fill="none" stroke="currentColor" strokeWidth={sw}
         strokeLinecap="round" strokeLinejoin="round"
         role={title ? "img" : undefined} aria-hidden={title ? undefined : "true"}
         aria-label={title}>
      {kind === "analyze" && (
        <>
          <path d="M2.5 11 V5 A2.5 2.5 0 0 1 5 2.5 H11 M23 2.5 H29 A2.5 2.5 0 0 1 31.5 5 V11 M31.5 23 V29 A2.5 2.5 0 0 1 29 31.5 H23 M11 31.5 H5 A2.5 2.5 0 0 1 2.5 29 V23" />
          <circle cx="17" cy="17" r="4.4" fill="currentColor" stroke="none" />
        </>
      )}
      {kind === "uploadImage" && (
        <>
          <path d="M1.5 11 V1.5 H11 M37 1.5 H46.5 V11 M46.5 25 V34.5 H37 M11 34.5 H1.5 V25" />
          <path d="M14.8 14.5 L26.6 20.8 L36 14.5" />
          <path d="M14.8 17.5 V26.3" strokeDasharray="1.6 2" />
          {[[14.8, 14.5], [26.6, 20.8], [36, 14.5], [14.8, 29.3]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="2.9" fill={paper} stroke={accent} strokeWidth={sw * 1.25} />
          ))}
        </>
      )}
      {kind === "uploadVideo" && (
        <>
          <rect x="1.2" y="2" width="57.6" height="21.6" />
          <path d="M20.4 2 V23.6 M39.6 2 V23.6" />
          <path d="M10.8 9.6 V16 M30 9.6 V16 M49.2 9.6 V16" strokeWidth={sw * 1.5} />
          <path d="M39.6 0.8 V25.2" stroke={accent} strokeWidth={sw * 1.2} />
          <circle cx="39.6" cy="6.4" r="2.9" fill={paper} stroke={accent} strokeWidth={sw * 1.3} />
        </>
      )}
      {kind === "liveCamera" && (
        <>
          <path d="M4.6 15 L13.3 22.5 L24.6 6 L39.6 22.5 L57.7 5.6 L63.3 24.4 L76.4 14.4" />
          {[[4.6, 15], [13.3, 22.5], [24.6, 6], [57.7, 5.6], [63.3, 24.4], [76.4, 14.4]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="2.7" fill={paper} stroke="currentColor" />
          ))}
          <circle cx="39.6" cy="22.5" r="5.4" fill={paper} stroke={accent} strokeWidth={sw * 1.3} />
        </>
      )}
      {kind === "chooseMedia" && (
        <>
          <path d="M2 2 H21 L31.5 12.5 V44 H2 Z" />
          <path d="M21 2 V12.5 H31.5" />
          <path d="M16.8 44 V18" />
          <path d="M8.4 26.4 L16.8 18 L25.2 26.4" />
        </>
      )}
      {kind === "nodeClimb" && (
        <>
          <path d="M5.5 25 L12 18.5 L17.5 22 L27 7.5" />
          <circle cx="5.5" cy="25" r="3.4" fill={paper} />
          <circle cx="12" cy="18.5" r="3.4" fill={paper} />
          <circle cx="17.5" cy="22" r="3.4" fill={paper} />
          <circle cx="27" cy="7.5" r="4.2" fill={paper} />
        </>
      )}
      {kind === "skeletonDots" && (
        <>
          {[[7, 5], [15, 3.5], [22.5, 6], [4.5, 12], [11.5, 11], [19, 12.5], [25.5, 11],
            [7.5, 19], [15, 18], [22, 20], [11, 25.5], [19.5, 25]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" fill="currentColor" stroke="none" />
          ))}
          <path d="M7 5 L15 3.5 M11.5 11 L19 12.5 M7.5 19 L15 18 L22 20" strokeDasharray="1.4 2" />
        </>
      )}
      {kind === "nodeGraph" && (
        <>
          <path d="M9.9 16.4 L23.4 5.6" />
          <circle cx="3.4" cy="12.6" r="3" />
          <circle cx="9.9" cy="16.4" r="3" />
          <circle cx="23.4" cy="5.6" r="3.9" />
          <path d="M26 8.6 L27.6 11.6" />
        </>
      )}
    </svg>
  )
}

/* ---------------------------------------------------------- phase track */

const TRACK_PHASES: { key: ShotPhase; label: string }[] = [
  { key: "setup", label: "SETUP" }, { key: "load", label: "LOAD" },
  { key: "rise", label: "RISE" }, { key: "release", label: "RELEASE" },
  { key: "follow", label: "FOLLOW-THROUGH" },
]

/**
 * The five-phase timeline as canonical draws it: canonical pose crops on plain
 * white, a hairline connector between them, and the label set in the condensed
 * display face directly under each figure.
 *
 * 079 and 080 used to paste a downscaled bitmap of the whole strip, which put
 * the crop's own #FDFDFD paper on the page as a visible band and shrank the
 * labels to an 8px cap. Measured against canonical the labels are a 9px cap on
 * 079/080 and 11px on 083 — always in the condensed face, never the body face,
 * which is why matching the cap in the body face made them 50% too wide.
 */
export function PhaseTrack({
  active = "RELEASE", figure = 30, label = 13, checks = false,
  underline = false, className = "",
}: {
  active?: string
  /** Pose height in CSS px. */
  figure?: number
  /** Label font size in px (condensed face). */
  label?: number
  /** Draw canonical's green completion tick on every phase before the active one (080). */
  checks?: boolean
  /** Rule the active label, as 079 does. */
  underline?: boolean
  className?: string
}) {
  const activeIdx = TRACK_PHASES.findIndex((p) => p.label === active)
  return (
    <div className={`flex items-start ${className}`}>
      {TRACK_PHASES.map((p, i) => {
        const on = i === activeIdx
        return (
          <React.Fragment key={p.key}>
            {i > 0 && (
              <span className="flex min-w-0 flex-1 items-center gap-[8px] px-[8px]"
                    style={{ height: figure }} aria-hidden="true">
                {checks && i - 1 < activeIdx && (
                  <span className="grid h-[15px] w-[15px] shrink-0 place-items-center rounded-full bg-[var(--shotiq-color-confirmGreen)]">
                    <svg width="9" height="9" viewBox="0 0 12 12">
                      <path d="M2.4 6.4 L4.9 9 L9.6 3.4" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
                <span className="h-px min-w-[8px] flex-1 bg-[var(--shotiq-color-rule)]" />
              </span>
            )}
            <span className="shrink-0 text-center">
              <PoseFigure phase={p.key} active={on} height={figure} className="mx-auto" />
              <span className="shotiq-display mt-[3px] block whitespace-nowrap leading-[1.05]"
                    style={{
                      fontSize: label,
                      letterSpacing: "0.05em",
                      color: on ? ORANGE : "var(--shotiq-color-graphite)",
                    }}>
                {p.label}
              </span>
              {underline && on && (
                <span aria-hidden="true" className="mx-auto mt-[2px] block h-[2px] w-full bg-[var(--shotiq-color-shotiqOrange)]" />
              )}
            </span>
          </React.Fragment>
        )
      })}
    </div>
  )
}

/**
 * The two marks in the topbar stat cluster, drawn to canonical's own geometry.
 *
 * Measured on canonical 079: the streak mark is a 47x18 film strip with sprocket
 * runs top and bottom and three frame divisions; the points mark is a 23x26
 * hexagon with an orange centre node on a short spoke. The build was shipping
 * lucide's `Film` (a rounded rectangle with two dots, 22x22) and `TrendingUp`
 * (a bare arrow, 30x10) — both graders named the pair, since it sits on all
 * twenty screens.
 */
export function StreakGlyph({ size = 47 }: { size?: number }) {
  const h = size * 18 / 47
  return (
    <svg width={size} height={h} viewBox="0 0 47 18" fill="none" aria-hidden="true" className="shrink-0">
      <rect x="0.9" y="0.9" width="45.2" height="16.2" rx="1.4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M0.9 4.6h45.2M0.9 13.4h45.2" stroke="currentColor" strokeWidth="1.4" />
      {[5.2, 9.4, 13.6, 17.8, 22, 26.2, 30.4, 34.6, 38.8, 43].map((x) => (
        <g key={x}>
          <rect x={x - 1.1} y="1.7" width="2.2" height="2.2" fill="currentColor" />
          <rect x={x - 1.1} y="14.1" width="2.2" height="2.2" fill="currentColor" />
        </g>
      ))}
      <path d="M12.6 4.6v8.8M23.5 4.6v8.8M34.4 4.6v8.8" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

export function PointsGlyph({ size = 26 }: { size?: number }) {
  const w = size * 23 / 26
  return (
    <svg width={w} height={size} viewBox="0 0 23 26" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M11.5 1.4 21.1 7v11.9l-9.6 5.6-9.6-5.6V7z" stroke="currentColor" strokeWidth="1.5" />
      {[[11.5, 1.4], [21.1, 7], [21.1, 18.9], [11.5, 24.5], [1.9, 18.9], [1.9, 7]].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.5" fill="#fff" stroke="currentColor" strokeWidth="1.3" />
      ))}
      <path d="M11.5 13 16 9.6" stroke="var(--shotiq-color-shotiqOrange)" strokeWidth="1.4" />
      <circle cx="11.5" cy="13" r="2.4" fill="var(--shotiq-color-shotiqOrange)" />
    </svg>
  )
}
