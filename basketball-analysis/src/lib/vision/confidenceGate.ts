/**
 * Confidence-aware mechanics measurements.
 *
 * A pose model can return a number for an angle even when one of the landmarks
 * used to derive that angle is only weakly visible.  Rendering that number as
 * fact is worse than showing no number, so this module keeps the decision in a
 * small, UI-independent domain function.  Callers get a record for every
 * requested measurement and an explicit reason whenever a value is omitted.
 */

export interface ConfidenceKeypoint {
  name: string
  score?: number | null
}

export type MeasurementStatus = 'trusted' | 'omitted'

export type OmissionReason =
  | 'missing-value'
  | 'invalid-value'
  | 'missing-landmarks'
  | 'low-confidence'

export interface MechanicsMeasurement {
  /** Stable metric name (for example `elbow` or `release`). */
  name: string
  /** A trusted numeric value; omitted values are always null. */
  value: number | null
  /** Confidence supporting the value, when it can be determined. */
  confidence: number | null
  status: MeasurementStatus
  trusted: boolean
  /** Human-readable explanation for an omitted value. */
  reason: string | null
  /** Machine-readable reason useful to persistence and analytics. */
  reasonCode: OmissionReason | null
  requiredLandmarks: string[]
}

export interface TrustedMechanicsMeasurement extends MechanicsMeasurement {
  status: 'trusted'
  trusted: true
  value: number
  reason: null
  reasonCode: null
}

export interface OmittedMechanicsMeasurement extends MechanicsMeasurement {
  status: 'omitted'
  trusted: false
  value: null
  reason: string
  reasonCode: OmissionReason
}

export interface GateMeasurementInput {
  /** Metric name. `metric` is accepted as a backwards-compatible alias. */
  name?: string
  metric?: string
  value: number | null | undefined
  /** Explicit confidence for this metric, if available. */
  confidence?: number | null
  /** Landmarks needed to derive this metric. */
  requiredLandmarks?: readonly string[]
  /** Optional keypoints used to derive confidence from required landmarks. */
  keypoints?: readonly ConfidenceKeypoint[]
  /** Minimum confidence for every required landmark. Defaults to 0.5. */
  minConfidence?: number
}

export interface MechanicsGateInput {
  /** Numeric canonical angles or other mechanics values. */
  measurements?: Record<string, number | null | undefined> | CanonicalMechanicsValues
  /** `angles` is a convenient alias used by PoseProvider callers. */
  angles?: Record<string, number | null | undefined> | CanonicalMechanicsValues
  /** Optional explicit per-measurement confidence. */
  confidence?: Record<string, number | null | undefined>
  keypoints?: readonly ConfidenceKeypoint[]
  minConfidence?: number
  /** Override the default landmark requirements for a metric. */
  requiredLandmarks?: Record<string, readonly string[]>
}

/** Structural form accepted from PoseProvider's CanonicalAngles. */
export interface CanonicalMechanicsValues {
  elbow?: number | null
  knee?: number | null
  shoulder?: number | null
  hip?: number | null
  release?: number | null
  wrist?: number | null
}

export interface MechanicsGateResult {
  measurements: Record<string, MechanicsMeasurement>
  /** Trusted values, retained as a simple map for existing scoring consumers. */
  trusted: Record<string, number>
  /** Omitted values and their reasons, retained as a simple map. */
  omitted: Record<string, OmittedMechanicsMeasurement>
  trustedMeasurements: TrustedMechanicsMeasurement[]
  omittedMeasurements: OmittedMechanicsMeasurement[]
  all: MechanicsMeasurement[]
  overallConfidence: number | null
  hasTrustedMeasurements: boolean
}

/** Landmark dependencies for the canonical MoveNet shooting measurements. */
export const DEFAULT_MECHANICS_LANDMARKS: Record<string, string[]> = {
  elbow: ['shoulder', 'elbow', 'wrist'],
  knee: ['hip', 'knee', 'ankle'],
  shoulder: ['shoulder', 'elbow', 'hip'],
  hip: ['shoulder', 'hip', 'knee'],
  release: ['elbow', 'wrist'],
  wrist: ['elbow', 'wrist'],
}

const readableReason = (reason: OmissionReason, confidence: number | null, min: number): string => {
  switch (reason) {
    case 'missing-value':
      return 'No numeric value was measured'
    case 'invalid-value':
      return 'The measured value is not finite'
    case 'missing-landmarks':
      return 'Required body landmarks were not detected'
    case 'low-confidence':
      return `Tracking confidence${confidence === null ? '' : ` (${Math.round(confidence * 100)}%)`} is below ${Math.round(min * 100)}%`
  }
}

function normalizeConfidence(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return Math.max(0, Math.min(1, value))
}

function keypointConfidence(
  keypoints: readonly ConfidenceKeypoint[] | undefined,
  required: readonly string[]
): { confidence: number | null; missing: boolean } {
  if (!required.length) return { confidence: null, missing: false }
  if (!keypoints) return { confidence: null, missing: false }

  const byName = new Map(keypoints.map((point) => [point.name, normalizeConfidence(point.score)]))
  const scores = required.map((name) => {
    const exact = byName.get(name)
    if (exact !== undefined) return exact
    // Canonical requirements may use an unsided landmark (`elbow`) while
    // MoveNet names it `left_elbow`/`right_elbow`. Use the visible side with
    // the stronger confidence in that case.
    const suffix = `_${name}`
    const sided = [...byName.entries()]
      .filter(([key]) => key.endsWith(suffix))
      .map(([, score]) => score)
      .filter((score): score is number => score !== null)
    return sided.length ? Math.max(...sided) : null
  })
  if (scores.some((score) => score === null)) return { confidence: null, missing: true }
  return { confidence: Math.min(...(scores as number[])), missing: false }
}

/** Gate one value and provide a stable omission reason instead of a default. */
export function gateMeasurement(input: GateMeasurementInput): MechanicsMeasurement {
  const name = (input.name ?? input.metric ?? '').trim() || 'measurement'
  const minimum = input.minConfidence ?? 0.5
  const requiredLandmarks = [...(input.requiredLandmarks ?? [])]
  const derived = keypointConfidence(input.keypoints, requiredLandmarks)
  const explicit = normalizeConfidence(input.confidence)
  const confidence = explicit ?? derived.confidence

  let reasonCode: OmissionReason | null = null
  if (input.value === null || input.value === undefined) reasonCode = 'missing-value'
  else if (typeof input.value !== 'number' || !Number.isFinite(input.value)) reasonCode = 'invalid-value'
  else if (derived.missing) reasonCode = 'missing-landmarks'
  else if (confidence !== null && confidence < minimum) reasonCode = 'low-confidence'

  if (reasonCode) {
    return {
      name,
      value: null,
      confidence,
      status: 'omitted',
      trusted: false,
      reason: readableReason(reasonCode, confidence, minimum),
      reasonCode,
      requiredLandmarks,
    }
  }

  // A value with no confidence is allowed for server-provided measurements
  // that have already passed their own quality gate. On-device values always
  // provide keypoints and therefore receive a derived confidence.
  return {
    name,
    value: input.value as number,
    confidence,
    status: 'trusted',
    trusted: true,
    reason: null,
    reasonCode: null,
    requiredLandmarks,
  }
}

/**
 * Gate all canonical mechanics values. Every input key appears in the output,
 * either in `trusted` or `omitted`; no low-confidence number survives as a
 * trusted measurement.
 */
export function gateMechanicsMeasurements(input: MechanicsGateInput): MechanicsGateResult {
  const values = (input.measurements ?? input.angles ?? {}) as Record<string, number | null | undefined>
  const requirements = { ...DEFAULT_MECHANICS_LANDMARKS, ...(input.requiredLandmarks ?? {}) }
  const all = Object.entries(values).map(([name, value]) => gateMeasurement({
    name,
    value,
    confidence: input.confidence?.[name],
    keypoints: input.keypoints,
    requiredLandmarks: requirements[name] ?? [],
    minConfidence: input.minConfidence,
  }))
  const trustedMeasurements = all.filter((measurement): measurement is TrustedMechanicsMeasurement => measurement.trusted)
  const omittedMeasurements = all.filter((measurement): measurement is OmittedMechanicsMeasurement => !measurement.trusted)
  const trusted: Record<string, number> = {}
  const omitted: Record<string, OmittedMechanicsMeasurement> = {}
  for (const measurement of trustedMeasurements) trusted[measurement.name] = measurement.value
  for (const measurement of omittedMeasurements) omitted[measurement.name] = measurement
  const confidences = trustedMeasurements
    .map((measurement) => measurement.confidence)
    .filter((confidence): confidence is number => confidence !== null)

  return {
    measurements: Object.fromEntries(all.map((measurement) => [measurement.name, measurement])),
    trusted,
    omitted,
    trustedMeasurements,
    omittedMeasurements,
    all,
    overallConfidence: confidences.length ? Math.min(...confidences) : null,
    hasTrustedMeasurements: trustedMeasurements.length > 0,
  }
}

/** Short alias for callers that already have a mechanics record. */
export const gateMechanics = gateMechanicsMeasurements
export const evaluateMechanicsConfidence = gateMechanicsMeasurements
export const confidenceGate = gateMeasurement
