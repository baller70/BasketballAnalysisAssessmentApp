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
  size = 24, className = "", children, title,
}: GlyphProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" className={className}
      fill="none" stroke="currentColor" strokeWidth={autoStroke(size)}
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
      <circle cx="9.8" cy="4.4" r="2" />
      <path d="M9.8 6.4 L10.4 13.4" />
      <path d="M10.4 13.4 L8.4 17.4 L8 21.4" />
      <path d="M10.4 13.4 L12.6 17.4 L13.2 21.4" />
      <path d="M10 8.4 L12.6 11.4" />
      <circle cx="14.8" cy="12.8" r="2.2" />
    </>
  ),
  // Deep knee bend, ball low and in front — gathering.
  load: (
    <>
      <circle cx="8.6" cy="6.4" r="2" />
      <path d="M8.6 8.4 L10.8 13" />
      <path d="M10.8 13 L7.8 16.2 L8.6 21.4" />
      <path d="M10.8 13 L13.6 16.4 L13.6 21.4" />
      <path d="M9.5 10.4 L12.2 12.4" />
      <circle cx="14.4" cy="13.6" r="2.2" />
    </>
  ),
  // Extending upward, ball at the forehead — the lift.
  rise: (
    <>
      <circle cx="10.6" cy="5.6" r="2" />
      <path d="M10.6 7.6 L10.6 13.6" />
      <path d="M10.6 13.6 L8.2 17.4 L8.6 21.4" />
      <path d="M10.6 13.6 L12.8 17.2 L13.8 20.8" />
      <path d="M10.6 9 L12.8 7.2" />
      <circle cx="15.4" cy="6" r="2.2" />
    </>
  ),
  // Full extension, ball leaving the hand overhead.
  release: (
    <>
      <circle cx="9.6" cy="8" r="2" />
      <path d="M9.6 10 L10.4 15.2" />
      <path d="M10.4 15.2 L8.4 18.6 L8 21.6" />
      <path d="M10.4 15.2 L12.8 18.4 L13.8 21.4" />
      <path d="M9.9 11 L12.4 7.8 L13.2 5.4" />
      <circle cx="14.4" cy="2.8" r="2.2" />
    </>
  ),
  // Arm held out long with the wrist relaxed — the ball is gone.
  follow: (
    <>
      <circle cx="9.6" cy="7" r="2" />
      <path d="M9.6 9 L10.4 14.8" />
      <path d="M10.4 14.8 L8.4 18.6 L8 21.4" />
      <path d="M10.4 14.8 L13 18.4 L14 21.2" />
      <path d="M9.9 10.2 L13.2 6.4 L16.6 4.8" />
      <path d="M16.6 4.8 L17.2 7.2" />
    </>
  ),
}

/** Shot-phase pose. Five genuinely different figures, one per phase. */
export function PoseGlyph({
  phase, active = false, size = 26, className = "", title,
}: { phase: ShotPhase | string; active?: boolean } & GlyphProps) {
  const p = typeof phase === "string" && !(phase in POSES)
    ? toShotPhase(phase) : (phase as ShotPhase)
  return (
    <span style={active ? { color: ORANGE } : undefined} className="inline-flex">
      <Svg size={size} className={className} title={title}>{POSES[p]}</Svg>
    </span>
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

export type CueKind = "peak" | "apex" | "shoulders" | "extension" | "base" | "tree"

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
      {kind === "apex" && (
        <>
          <path d="M5 19.5 L10.5 7 L16 11 L20 8.5" strokeDasharray="0" />
          {node(5, 19.5, true)}{node(10.5, 7, true)}{node(16, 11)}{node(20, 8.5)}
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
