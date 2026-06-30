/**
 * Biomechanical Scoring — single source of truth for turning measured shooting
 * angles into 0-100 form scores.
 *
 * Why this exists: scores used to be invented with `Math.random()` in several
 * places (demo results page, coaching insights, analytics). That made the app
 * show grades it never actually computed. This module replaces that with a
 * deterministic, explainable model derived from the same ideal-angle ranges the
 * live pose analyzer uses (see services/poseDetection.ts -> analyzeShootingForm).
 *
 * The scoring is piecewise-linear: a joint exactly at its ideal angle scores
 * 100, tapering smoothly toward the edges of the "good" and "acceptable" bands,
 * then falling off below that. Same input always yields the same score.
 */

export type JointName =
  | 'elbow'
  | 'knee'
  | 'shoulder'
  | 'hip'
  | 'release'
  | 'wrist'

interface JointRange {
  /** Angle that scores a perfect 100. */
  ideal: number
  /** Inside [goodMin, goodMax] the score is 85-100. */
  goodMin: number
  goodMax: number
  /** Inside [okMin, okMax] (but outside good) the score is 60-85. */
  okMin: number
  okMax: number
  /** For `release` the angle is signed; we score its absolute deviation. */
  absolute?: boolean
}

/**
 * Ideal ranges per joint. These mirror the thresholds in
 * services/poseDetection.ts::analyzeShootingForm so the two stay consistent.
 */
export const IDEAL_RANGES: Record<JointName, JointRange> = {
  // Elbow: ~90° at set point (the classic shooting "L").
  elbow: { ideal: 90, goodMin: 80, goodMax: 100, okMin: 70, okMax: 110 },
  // Knee: athletic bend for power.
  knee: { ideal: 142, goodMin: 130, goodMax: 155, okMin: 120, okMax: 165 },
  // Shoulder: squared to the rim; wide acceptable window across shot phases.
  shoulder: { ideal: 70, goodMin: 40, goodMax: 100, okMin: 30, okMax: 120 },
  // Hip: upright, aligned posture.
  hip: { ideal: 170, goodMin: 155, goodMax: 180, okMin: 140, okMax: 180 },
  // Release: deviation from vertical follow-through (signed; 0 is ideal).
  release: { ideal: 0, goodMin: -15, goodMax: 15, okMin: -25, okMax: 25, absolute: true },
  // Wrist/forearm: lift that produces good arc.
  wrist: { ideal: 75, goodMin: 50, goodMax: 100, okMin: 35, okMax: 120 },
}

/** Linear interpolation helper. */
function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * Math.max(0, Math.min(1, t))
}

/**
 * Score a single joint angle 0-100, deterministically.
 *
 * - At `ideal` -> 100.
 * - Across the "good" band -> 100 down to 85 at the band edge.
 * - Across the "acceptable" band -> 85 down to 60 at the edge.
 * - Beyond that -> 60 down to a 25 floor as it gets progressively worse.
 */
export function scoreJoint(joint: JointName, angle: number): number {
  const r = IDEAL_RANGES[joint]
  const value = r.absolute ? Math.abs(angle) : angle
  const ideal = r.absolute ? 0 : r.ideal

  // Distance from ideal, normalized against the half-width of each band on the
  // side the value falls on.
  if (value >= r.goodMin && value <= r.goodMax) {
    const half = value >= ideal ? r.goodMax - ideal : ideal - r.goodMin
    const dist = Math.abs(value - ideal)
    return Math.round(lerp(100, 85, half === 0 ? 0 : dist / half))
  }

  if (value >= r.okMin && value <= r.okMax) {
    if (value < r.goodMin) {
      const span = r.goodMin - r.okMin
      return Math.round(lerp(85, 60, span === 0 ? 1 : (r.goodMin - value) / span))
    }
    const span = r.okMax - r.goodMax
    return Math.round(lerp(85, 60, span === 0 ? 1 : (value - r.goodMax) / span))
  }

  // Outside acceptable: keep falling toward a floor so very bad form still
  // ranks below merely-poor form, but never returns 0 (which reads as "no data").
  const edge = value < r.okMin ? r.okMin : r.okMax
  const overshoot = Math.abs(value - edge)
  // Lose ~1 point per 2° past the acceptable edge, floored at 25.
  return Math.round(Math.max(25, 60 - overshoot / 2))
}

/** A measured set of shooting angles. All optional — score what's present. */
export interface ShootingAnglesInput {
  elbow?: number | null
  knee?: number | null
  shoulder?: number | null
  hip?: number | null
  release?: number | null
  wrist?: number | null
}

export interface BiomechanicalScores {
  /** Average of all measured joint scores. Null when nothing was measured. */
  overallScore: number | null
  /** Alias of overallScore for the analysis UI's "form" headline. */
  formScore: number | null
  /** Lower body + posture: hip, knee, shoulder. */
  balanceScore: number | null
  /** Upper body release chain: elbow, wrist, release angle. */
  releaseScore: number | null
  /** Per-joint scores for the ones that were measured. */
  perJoint: Partial<Record<JointName, number>>
  /** How many joints contributed (0 -> nothing to score). */
  measuredCount: number
}

function avg(values: number[]): number | null {
  if (values.length === 0) return null
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
}

/**
 * Score a full set of measured angles. Joints that are null/undefined are
 * skipped entirely rather than defaulted — we never fabricate a measurement.
 */
export function scoreShootingForm(angles: ShootingAnglesInput): BiomechanicalScores {
  const perJoint: Partial<Record<JointName, number>> = {}
  const measured: Array<[JointName, number]> = []

  ;(Object.keys(IDEAL_RANGES) as JointName[]).forEach((joint) => {
    const raw = angles[joint]
    if (raw === null || raw === undefined || Number.isNaN(raw)) return
    const s = scoreJoint(joint, raw)
    perJoint[joint] = s
    measured.push([joint, s])
  })

  const pick = (joints: JointName[]) =>
    avg(measured.filter(([j]) => joints.includes(j)).map(([, s]) => s))

  const overall = avg(measured.map(([, s]) => s))

  return {
    overallScore: overall,
    formScore: overall,
    balanceScore: pick(['hip', 'knee', 'shoulder']),
    releaseScore: pick(['elbow', 'wrist', 'release']),
    perJoint,
    measuredCount: measured.length,
  }
}

/**
 * Consistency is a property of a SEQUENCE of shots, not a single frame, so it is
 * derived from the spread of recent form scores. Lower variance -> higher
 * consistency. Returns null when there aren't enough sessions to judge (callers
 * should show "Not enough data" rather than a fabricated number).
 */
export function consistencyFromHistory(scores: number[]): number | null {
  const valid = scores.filter((s) => typeof s === 'number' && !Number.isNaN(s))
  if (valid.length < 2) return null
  const mean = valid.reduce((a, b) => a + b, 0) / valid.length
  const variance =
    valid.reduce((a, b) => a + (b - mean) ** 2, 0) / valid.length
  const stdDev = Math.sqrt(variance)
  // Map standard deviation to 0-100: 0 spread -> 100, ~25-pt spread -> ~0.
  return Math.round(Math.max(0, Math.min(100, 100 - stdDev * 4)))
}

/**
 * Normalize the loosely-keyed angle records used around the app (e.g.
 * `right_elbow_angle`, `left_knee_angle`, `release_angle`, `hip_tilt`) into the
 * canonical ShootingAnglesInput. Prefers right-side then left-side joints.
 */
export function normalizeAngles(
  angles: Record<string, number | null | undefined>
): ShootingAnglesInput {
  const firstNum = (...keys: string[]): number | undefined => {
    for (const k of keys) {
      const v = angles[k]
      if (typeof v === 'number' && !Number.isNaN(v)) return v
    }
    return undefined
  }
  return {
    elbow: firstNum('elbow', 'elbowAngle', 'right_elbow_angle', 'left_elbow_angle'),
    knee: firstNum('knee', 'kneeAngle', 'right_knee_angle', 'left_knee_angle'),
    shoulder: firstNum('shoulder', 'shoulderAngle', 'right_shoulder_angle', 'left_shoulder_angle'),
    hip: firstNum('hip', 'hipAngle', 'hip_tilt', 'right_hip_angle', 'left_hip_angle'),
    release: firstNum('release', 'releaseAngle', 'release_angle'),
    wrist: firstNum('wrist', 'wristAngle', 'right_wrist_angle', 'left_wrist_angle'),
  }
}
