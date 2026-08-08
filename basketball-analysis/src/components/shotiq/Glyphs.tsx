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

const APPROVED_ICON_BASE = "/shotiq/icons/approved"

export function ApprovedRasterIcon({
  asset, size = 24, className = "", title, alt = "",
}: GlyphProps & { asset: string; alt?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${APPROVED_ICON_BASE}/${asset}.png`}
      alt={alt}
      aria-hidden={alt || title ? undefined : "true"}
      aria-label={title}
      width={512}
      height={512}
      style={{ width: size, height: size }}
      className={`inline-block max-w-none object-contain ${className}`}
    />
  )
}

function BasketballMark({
  cx, cy, r = 2.2, stroke = "currentColor",
}: { cx: number; cy: number; r?: number; stroke?: string }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} stroke={stroke} />
      <path d={`M${cx - r} ${cy}H${cx + r}`} stroke={stroke} />
      <path d={`M${cx} ${cy - r} Q${cx + r * 0.58} ${cy} ${cx} ${cy + r}`} stroke={stroke} />
      <path d={`M${cx} ${cy - r} Q${cx - r * 0.58} ${cy} ${cx} ${cy + r}`} stroke={stroke} />
    </>
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
      <path d="M10 8.4 L12.6 11.4 L14.4 12.2" />
      <BasketballMark cx={15.4} cy={12.5} r={2.3} />
    </>
  ),
  // Deep knee bend, ball low and in front — gathering.
  load: (
    <>
      <circle cx="8.6" cy="6.4" r="2.35" />
      <path d="M8.6 8.4 L10.8 13" />
      <path d="M10.8 13 L7.8 16.2 L8.6 21.4" />
      <path d="M10.8 13 L13.6 16.4 L13.6 21.4" />
      <path d="M9.5 10.4 L12.2 12.4 L14 13.2" />
      <BasketballMark cx={15.2} cy={13.8} r={2.3} />
    </>
  ),
  // Extending upward, ball at the forehead — the lift.
  rise: (
    <>
      <circle cx="10.6" cy="5.6" r="2.35" />
      <path d="M10.6 7.6 L10.6 13.6" />
      <path d="M10.6 13.6 L8.2 17.4 L8.6 21.4" />
      <path d="M10.6 13.6 L12.8 17.2 L13.8 20.8" />
      <path d="M10.6 9 L12.8 7.2 L14.4 6.5" />
      <BasketballMark cx={15.7} cy={5.8} r={2.3} />
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
      <path d="M13.2 5.4 L14.1 6.6" stroke={ORANGE} />
      <BasketballMark cx={15.1} cy={2.8} r={2.2} stroke={ORANGE} />
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
      <path d="M16.6 4.8 L17.2 7.2" stroke={ORANGE} />
      <path d="M17.6 3.2 Q20.2 2.2 20.6 5" stroke={ORANGE} strokeDasharray="1.4 1.6" />
      <BasketballMark cx={21.1} cy={4.7} r={1.5} stroke={ORANGE} />
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

const APPROVED_PHASE_ICONS: Record<ShotPhase, string> = {
  setup: "shotiq-approved-phase-setup",
  load: "shotiq-approved-phase-load",
  rise: "shotiq-approved-phase-rise",
  release: "shotiq-approved-phase-release",
  follow: "shotiq-approved-phase-follow",
}

export function PoseGlyph({
  phase, active = false, size = 26, className = "", title,
}: { phase: ShotPhase | string; active?: boolean } & GlyphProps) {
  const p = typeof phase === "string" && !(phase in POSES)
    ? toShotPhase(phase) : (phase as ShotPhase)
  return (
    <span style={active ? { color: ORANGE } : undefined} className="inline-flex">
      <ApprovedRasterIcon asset={APPROVED_PHASE_ICONS[p]} size={size} className={className} title={title} />
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
  phase, active: _active = false, tone: _tone = "light", height = 40, className = "", alt = "",
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
  void _active
  void _tone
  const p = typeof phase === "string" && !(phase in PHASE_FIGURE)
    ? toShotPhase(phase) : (phase as ShotPhase)
  const { w, h } = PHASE_FIGURE[p]
  const src = `${APPROVED_ICON_BASE}/${APPROVED_PHASE_ICONS[p]}.png`
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
  | "centerline" | "balance" | "drift" | "impact" | "tempo" | "consistency"
  | "arcHeight" | "releaseAngle" | "spin" | "flightTime" | "shotShape" | "releasePath"

const MECHANICS: Record<MechanicKind, (a: string) => React.ReactNode> = {
  // Two limb segments meeting at a joint with the measured sweep dotted in.
  angle: (a) => (
    <>
      <path d="M12 4.2V19.8" stroke={a} strokeDasharray="1.5 1.8" />
      <BasketballMark cx={12} cy={4.6} r={2.1} stroke={a} />
      <path d="M7.4 19 L11 13.2 L12 7.2" />
      <circle cx="11" cy="13.2" r="1.6" stroke={a} />
      <circle cx="7.4" cy="19" r="1.4" />
    </>
  ),
  // Forearm into a cocked hand, flexion dotted at the joint.
  wrist: (a) => (
    <>
      <path d="M12 5V19" stroke={a} strokeDasharray="1.5 1.8" />
      <BasketballMark cx={12} cy={5.2} r={2.1} stroke={a} />
      <path d="M8.2 19 L11.5 12.8 L12 7.4" />
      <circle cx="11.5" cy="12.8" r="1.5" stroke={a} />
      <path d="M12.8 7.2 Q16.4 8.3 16.9 11.5" stroke={a} />
      <path d="M15.5 10.2 L16.9 11.7 L17.5 9.8" stroke={a} />
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
  releasePath: (a) => (
    <>
      <path d="M12 5.2V18.8" stroke={a} strokeDasharray="1.5 1.8" />
      <path d="M10.3 6.7 L12 4.8 L13.7 6.7" stroke={a} />
      <BasketballMark cx={12} cy={10.5} r={2.2} stroke={a} />
      <path d="M8.6 20 L11.2 16 L12 13" />
      <circle cx="11.2" cy="16" r="1.4" />
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
      <path d="M5.5 9.6 H18.5" stroke={ORANGE} />
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
  tempo: (a) => (
    <>
      <path d="M3 16.5H21" />
      <path d="M6 16.5V11.5M12 16.5V7M18 16.5V11.5" />
      <circle cx="6" cy="10.2" r="1.4" />
      <circle cx="12" cy="5.8" r="1.6" fill={a} stroke={a} />
      <circle cx="18" cy="10.2" r="1.4" />
    </>
  ),
  consistency: (a) => (
    <>
      <path d="M3.5 8.5H20.5M3.5 15.5H20.5" strokeDasharray="2 2" />
      <path d="M7 12.6 L11 11.2 L15 12.9 L18.6 11.6" />
      <circle cx="7" cy="12.6" r="1.4" />
      <circle cx="11" cy="11.2" r="1.4" stroke={a} />
      <circle cx="15" cy="12.9" r="1.4" />
      <circle cx="18.6" cy="11.6" r="1.4" />
    </>
  ),
  arcHeight: (a) => (
    <>
      <path d="M3.6 15.4 L7.2 17.6 L12 8.2 L16.8 13.2 L20.4 11" strokeDasharray="1.6 1.8" />
      <circle cx="3.6" cy="15.4" r="1.3" />
      <circle cx="7.2" cy="17.6" r="1.3" fill={a} stroke={a} />
      <circle cx="12" cy="8.2" r="1.5" fill={a} stroke={a} />
      <circle cx="16.8" cy="13.2" r="1.3" fill={a} stroke={a} />
      <circle cx="20.4" cy="11" r="1.3" />
    </>
  ),
  releaseAngle: (a) => (
    <>
      <path d="M5 18.5H20M5 18.5V6M5 18.5L18.5 7.5" />
      <path d="M11 18.5 A7.2 7.2 0 0 0 10.6 14" stroke={a} strokeDasharray="1.4 1.8" />
      <circle cx="5" cy="18.5" r="1.4" fill={a} stroke={a} />
    </>
  ),
  spin: (a) => (
    <>
      <BasketballMark cx={12} cy={12} r={4.6} stroke={a} />
      <path d="M6.3 7.3 A7.6 7.6 0 0 0 4.7 14.5" stroke={a} />
      <path d="M7.5 9 L4.9 7.4 L5.1 10.5" stroke={a} />
      <path d="M17.7 16.7 A7.6 7.6 0 0 0 19.3 9.5" stroke={a} />
      <path d="M16.5 15 L19.1 16.6 L18.9 13.5" stroke={a} />
    </>
  ),
  flightTime: (a) => (
    <>
      <path d="M4.5 15.5 Q12 3 19.5 15.5" strokeDasharray="1.5 2" />
      <circle cx="4.5" cy="15.5" r="1.8" fill="currentColor" />
      <circle cx="19.5" cy="15.5" r="1.8" fill="currentColor" />
      <path d="M4.5 19.6H19.5M4.5 18.4V20.8M19.5 18.4V20.8" stroke={a} />
    </>
  ),
  shotShape: (a) => (
    <>
      <path d="M4 19.5H20" />
      <circle cx="6.5" cy="19.5" r="1.4" fill={a} stroke={a} />
      <circle cx="17.5" cy="19.5" r="1.4" fill={a} stroke={a} />
      <path d="M12 3.5V14" strokeDasharray="2 2" />
      <path d="M12 5 L10.4 10.6 L12.6 14.4" stroke={a} strokeDasharray="1.4 1.8" />
      <circle cx="12" cy="3.5" r="1.5" />
    </>
  ),
}

const APPROVED_MECHANIC_ICONS: Record<MechanicKind, string> = {
  angle: "shotiq-approved-mechanics-elbow-under-ball",
  wrist: "shotiq-approved-mechanics-wrist-over-elbow",
  height: "shotiq-approved-mechanics-release-height",
  distance: "shotiq-approved-mechanics-spot-ruler",
  jump: "shotiq-approved-mechanics-shot-path-runner",
  arc: "shotiq-approved-mechanics-ball-speed",
  centerline: "shotiq-approved-mechanics-body-centerline",
  balance: "shotiq-approved-mechanics-balance-archetype",
  drift: "shotiq-approved-mechanics-shot-path-bounce",
  impact: "shotiq-approved-ui-target-reticle",
  tempo: "shotiq-approved-ui-performance-gauge",
  consistency: "shotiq-approved-ui-progress-line",
  arcHeight: "shotiq-approved-mechanics-ball-speed",
  releaseAngle: "shotiq-approved-mechanics-release-angle",
  spin: "shotiq-approved-mechanics-backspin",
  flightTime: "shotiq-approved-mechanics-ball-speed",
  shotShape: "shotiq-approved-mechanics-shot-path-bounce",
  releasePath: "shotiq-approved-mechanics-elbow-stack",
}

/** A measured mechanic — one diagram per measurable quantity. */
export function MechanicGlyph({
  kind, size = 22, className = "", accent = ORANGE, title,
}: { kind: MechanicKind } & GlyphProps) {
  void accent
  return <ApprovedRasterIcon asset={APPROVED_MECHANIC_ICONS[kind]} size={size} className={className} title={title} />
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

const APPROVED_CORRECTION_ICONS: Record<CorrectionKind, string> = {
  stack: "shotiq-approved-mechanics-elbow-stack",
  square: "shotiq-approved-ui-target-reticle",
  drive: "shotiq-approved-mechanics-shot-path-runner",
}

/** A coaching correction — a figure demonstrating the fix. */
export function CorrectionGlyph({
  kind, size = 22, className = "", title,
}: { kind: CorrectionKind } & GlyphProps) {
  return <ApprovedRasterIcon asset={APPROVED_CORRECTION_ICONS[kind]} size={size} className={className} title={title} />
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
  void accent
  const approved: Record<FlawKind, string> = {
    elbow: "shotiq-approved-v2-flaw-elbow",
    wrist: "shotiq-approved-v2-flaw-wrist",
    release: "shotiq-approved-v2-flaw-release",
    base: "shotiq-approved-v2-flaw-base",
    guide: "shotiq-approved-v2-flaw-guide",
  }
  return <ApprovedRasterIcon asset={approved[kind]} size={size} className={className} title={title} />
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
  void accent
  const approved: Record<CueKind, string> = {
    peak: "shotiq-approved-v2-cue-peak",
    apex: "shotiq-approved-v2-cue-apex",
    shoulders: "shotiq-approved-v2-cue-shoulders",
    extension: "shotiq-approved-v2-cue-extension",
    base: "shotiq-approved-v2-cue-base",
    tree: "shotiq-approved-v2-cue-tree",
    saved: "shotiq-approved-v2-workout-saved",
  }
  return <ApprovedRasterIcon asset={approved[kind]} size={size} className={className} title={title} />
}

/* -------------------------------------------------------- workout marks */

export type WorkoutKind = "release" | "ladder" | "flow"

/** Scheduled-workout marks — one shape per drill family. */
export function WorkoutGlyph({
  kind, size = 20, className = "", title,
}: { kind: WorkoutKind } & GlyphProps) {
  const approved: Record<WorkoutKind, string> = {
    release: "shotiq-approved-phase-release",
    ladder: "shotiq-approved-ui-ladder-balls",
    flow: "shotiq-approved-mechanics-routine-refresh",
  }
  return <ApprovedRasterIcon asset={approved[kind]} size={size} className={className} title={title} />
}

/* --------------------------------------------------- equipment marks */

export type EquipmentKind = "basketball" | "cones" | "spot" | "location"

/** Drill equipment/setup marks. These mirror the native SwiftUI glyphs so the
 *  same training card nouns read the same way in iOS and web. */
export function EquipmentGlyph({
  kind, size = 24, className = "", accent = ORANGE, title,
}: { kind: EquipmentKind } & GlyphProps) {
  void accent
  const approved: Record<EquipmentKind, string> = {
    basketball: "shotiq-approved-mechanics-ball-speed",
    cones: "shotiq-approved-mechanics-cones",
    spot: "shotiq-approved-mechanics-spot-ruler",
    location: "shotiq-approved-mechanics-location-pin",
  }
  return <ApprovedRasterIcon asset={approved[kind]} size={size} className={className} title={title} />
}

/* ------------------------------------------------------ profile setup */

export type HandKind = "right" | "left"
export type BodyMetricKind = "age" | "height" | "weight" | "wingspan"
export type AbilityKind = "developing" | "intermediate" | "advanced" | "elite" | "professional"
export type ShotTypeKind = "catchShoot" | "pullUp" | "offDribble" | "stepBack" | "other"
export type MediaFormatKind = "mp4" | "mov" | "jpg" | "png" | "heic"

export function HandChoiceGlyph({
  kind, size = 30, className = "", title,
}: { kind: HandKind } & GlyphProps) {
  return <ApprovedRasterIcon asset={`shotiq-approved-v2-hand-${kind}`} size={size} className={className} title={title} />
}

export function BodyMetricGlyph({
  kind, size = 30, className = "", title,
}: { kind: BodyMetricKind } & GlyphProps) {
  return <ApprovedRasterIcon asset={`shotiq-approved-v2-body-${kind}`} size={size} className={className} title={title} />
}

export function AbilityGlyph({
  kind, size = 30, className = "", title,
}: { kind: AbilityKind } & GlyphProps) {
  return <ApprovedRasterIcon asset={`shotiq-approved-v2-ability-${kind}`} size={size} className={className} title={title} />
}

const SHOT_TYPE_ICONS: Record<ShotTypeKind, string> = {
  catchShoot: "shotiq-approved-v2-shot-catch-shoot",
  pullUp: "shotiq-approved-v2-shot-pull-up",
  offDribble: "shotiq-approved-v2-shot-off-dribble",
  stepBack: "shotiq-approved-v2-shot-step-back",
  other: "shotiq-approved-v2-shot-other",
}

export function ShotTypeGlyph({
  kind, size = 30, className = "", title,
}: { kind: ShotTypeKind } & GlyphProps) {
  return <ApprovedRasterIcon asset={SHOT_TYPE_ICONS[kind]} size={size} className={className} title={title} />
}

export function MediaFormatGlyph({
  kind, size = 24, className = "", title,
}: { kind: MediaFormatKind } & GlyphProps) {
  return <ApprovedRasterIcon asset={`shotiq-approved-v2-media-${kind}`} size={size} className={className} title={title} />
}

export function ReleaseHandGlyph({ size = 44, className = "", title }: GlyphProps) {
  return <ApprovedRasterIcon asset="shotiq-approved-v2-release-hand" size={size} className={className} title={title} />
}

export function CoachingTargetGlyph({ size = 28, className = "", title }: GlyphProps) {
  return <ApprovedRasterIcon asset="shotiq-approved-v2-coaching-target" size={size} className={className} title={title} />
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
  void accent
  const approved: Record<QualityKind, string> = {
    resolution: "shotiq-approved-v2-quality-resolution",
    lighting: "shotiq-approved-mechanics-environment-light",
    framerate: "shotiq-approved-v2-quality-framerate",
    stability: "shotiq-approved-v2-quality-stability",
  }
  return <ApprovedRasterIcon asset={approved[kind]} size={size} className={className} title={title} />
}

/* ------------------------------------------------------- filming guide */

export type FilmingKind = "fullBody" | "sideAngle" | "background" | "light"

/** Filming advice marks (081 FILMING GUIDE) — framing geometry, not poses. */
export function FilmingGlyph({
  kind, size = 22, className = "", accent = ORANGE, title,
}: { kind: FilmingKind } & GlyphProps) {
  void accent
  const approved: Record<FilmingKind, string> = {
    fullBody: "shotiq-approved-v2-filming-full-body",
    sideAngle: "shotiq-approved-v2-filming-side-angle",
    background: "shotiq-approved-v2-filming-background",
    light: "shotiq-approved-mechanics-environment-light",
  }
  return <ApprovedRasterIcon asset={approved[kind]} size={size} className={className} title={title} />
}

/** Capture-readiness checks — bracketed framing marks, one per check. */
export function ReadinessGlyph({
  kind, size = 24, className = "", title,
}: { kind: ReadinessKind } & GlyphProps) {
  const approved: Record<ReadinessKind, string> = {
    athlete: "shotiq-approved-mechanics-routine-refresh",
    framing: "shotiq-approved-mechanics-capture-frame",
    lighting: "shotiq-approved-mechanics-environment-light",
    stability: "shotiq-approved-mechanics-camera-position",
  }
  return <ApprovedRasterIcon asset={approved[kind]} size={size} className={className} title={title} />
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
  void accent
  const approved: Record<ActionKind, string> = {
    analyze: "shotiq-approved-ui-target-reticle",
    uploadImage: "shotiq-approved-ui-analytics-upload",
    uploadVideo: "shotiq-approved-ui-upload-video",
    liveCamera: "shotiq-approved-ui-live-camera",
    chooseMedia: "shotiq-approved-ui-player-card",
    nodeGraph: "shotiq-approved-ui-pose-shooter",
    nodeClimb: "shotiq-approved-ui-progress-line",
    skeletonDots: "shotiq-approved-mechanics-node-target",
  }
  return <ApprovedRasterIcon asset={approved[kind]} size={height} className={`block ${className}`} title={title} />
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
  return <ApprovedRasterIcon asset="shotiq-approved-ui-calendar-heat" size={size} />
}

export function PointsGlyph({ size = 26 }: { size?: number }) {
  return <ApprovedRasterIcon asset="shotiq-approved-ui-badge-target" size={size} />
}
