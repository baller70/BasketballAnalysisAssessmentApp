export type ShotIQMediaType = "image" | "video" | null
export type ShotIQResultSource = "ios" | "web" | "unknown"

export type ShotIQMetricSource =
  | "measured"
  | "history"
  | "manual"
  | "estimated"
  | "missing"

export interface ShotIQMetric<T extends number | string = number> {
  value: T | null
  unit: string | null
  source: ShotIQMetricSource
}

export interface ShotIQAnalysisMedia {
  type: ShotIQMediaType
  imageUrl: string | null
  annotatedImageUrl: string | null
  displayImageUrl: string | null
  videoUrl: string | null
}

export interface ShotIQAnalysisPose {
  provider: string | null
  keypoints: unknown | null
  detection: unknown | null
  overlays: unknown | null
}

export interface ShotIQAnalysisResult {
  id: string
  clientSessionId: string | null
  captureSessionId: string | null
  recordedAt: string
  source: ShotIQResultSource
  media: ShotIQAnalysisMedia
  scores: {
    overall: ShotIQMetric
    form: ShotIQMetric
    balance: ShotIQMetric
    release: ShotIQMetric
    consistency: ShotIQMetric
  }
  angles: {
    elbow: ShotIQMetric
    knee: ShotIQMetric
    wrist: ShotIQMetric
    shoulder: ShotIQMetric
    hip: ShotIQMetric
    release: ShotIQMetric
    kneeMin: ShotIQMetric
  }
  measurements: {
    releaseHeightInches: ShotIQMetric
    releaseDistanceInches: ShotIQMetric
    verticalJumpInches: ShotIQMetric
    centerlineDeviationDeg: ShotIQMetric
  }
  phase: ShotIQMetric<string>
  pose: ShotIQAnalysisPose
  feedback: {
    coachingNotes: string | null
    strengths: unknown[]
    improvements: unknown[]
    drills: unknown[]
  }
  eliteMatch: {
    matchedShooterId: number | null
    confidence: ShotIQMetric
    similarShooters: unknown[]
  }
  provenance: {
    measured: string[]
    missing: string[]
    estimated: string[]
    demo: string[]
  }
}

export interface ShotIQAnalysisRow {
  id: string
  clientSessionId?: string | null
  captureSessionId?: string | null
  createdAt?: Date | string | null
  recordedAt?: Date | string | null
  mediaType?: string | null
  imageUrl?: string | null
  annotatedImageUrl?: string | null
  videoUrl?: string | null
  roboflowPoseData?: unknown | null
  roboflowDetection?: unknown | null
  visualOverlays?: unknown | null
  shootingPhase?: string | null
  elbowAngle?: unknown | null
  kneeAngle?: unknown | null
  wristAngle?: unknown | null
  shoulderAngle?: unknown | null
  hipAngle?: unknown | null
  releaseAngle?: unknown | null
  kneeAngleMin?: unknown | null
  releaseHeightInches?: unknown | null
  releaseDistanceInches?: unknown | null
  verticalJumpInches?: unknown | null
  centerlineDeviationDeg?: unknown | null
  overallScore?: unknown | null
  formScore?: unknown | null
  balanceScore?: unknown | null
  releaseScore?: unknown | null
  consistencyScore?: unknown | null
  strengths?: unknown | null
  improvements?: unknown | null
  drills?: unknown | null
  coachingNotes?: string | null
  matchedShooterId?: number | null
  matchConfidence?: unknown | null
  similarShooters?: unknown | null
}

const numeric = (value: unknown): number | null => {
  if (value == null) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

const array = (value: unknown): unknown[] => Array.isArray(value) ? value : []

const metric = (
  value: unknown,
  unit: string | null,
  source: ShotIQMetricSource = "measured",
): ShotIQMetric => {
  const n = numeric(value)
  return { value: n, unit, source: n == null ? "missing" : source }
}

const textMetric = (
  value: string | null | undefined,
  source: ShotIQMetricSource = "measured",
): ShotIQMetric<string> => {
  const cleaned = typeof value === "string" && value.trim() ? value.trim() : null
  return { value: cleaned, unit: null, source: cleaned == null ? "missing" : source }
}

const dateString = (value: Date | string | null | undefined): string => {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString()
  }
  return new Date(0).toISOString()
}

const sourceFromClientSession = (clientSessionId: string | null): ShotIQResultSource => {
  if (clientSessionId?.startsWith("ios-")) return "ios"
  if (clientSessionId) return "web"
  return "unknown"
}

export function measuredMetricKeys(result: ShotIQAnalysisResult): string[] {
  const entries: Array<[string, ShotIQMetric | ShotIQMetric<string>]> = [
    ["scores.overall", result.scores.overall],
    ["scores.form", result.scores.form],
    ["scores.balance", result.scores.balance],
    ["scores.release", result.scores.release],
    ["scores.consistency", result.scores.consistency],
    ["angles.elbow", result.angles.elbow],
    ["angles.knee", result.angles.knee],
    ["angles.wrist", result.angles.wrist],
    ["angles.shoulder", result.angles.shoulder],
    ["angles.hip", result.angles.hip],
    ["angles.release", result.angles.release],
    ["angles.kneeMin", result.angles.kneeMin],
    ["measurements.releaseHeightInches", result.measurements.releaseHeightInches],
    ["measurements.releaseDistanceInches", result.measurements.releaseDistanceInches],
    ["measurements.verticalJumpInches", result.measurements.verticalJumpInches],
    ["measurements.centerlineDeviationDeg", result.measurements.centerlineDeviationDeg],
    ["phase", result.phase],
    ["eliteMatch.confidence", result.eliteMatch.confidence],
  ]

  return entries
    .filter(([, item]) => item.value != null && item.source !== "missing")
    .map(([key]) => key)
}

export function missingMetricKeys(result: ShotIQAnalysisResult): string[] {
  const all = [
    "scores.overall",
    "scores.form",
    "scores.balance",
    "scores.release",
    "scores.consistency",
    "angles.elbow",
    "angles.knee",
    "angles.wrist",
    "angles.shoulder",
    "angles.hip",
    "angles.release",
    "angles.kneeMin",
    "measurements.releaseHeightInches",
    "measurements.releaseDistanceInches",
    "measurements.verticalJumpInches",
    "measurements.centerlineDeviationDeg",
    "phase",
    "eliteMatch.confidence",
  ]
  const measured = new Set(measuredMetricKeys(result))
  return all.filter((key) => !measured.has(key))
}

export function toShotIQAnalysisResult(row: ShotIQAnalysisRow): ShotIQAnalysisResult {
  const clientSessionId = row.clientSessionId ?? null
  const mediaType = row.mediaType === "image" || row.mediaType === "video" ? row.mediaType : null
  const result: ShotIQAnalysisResult = {
    id: row.id,
    clientSessionId,
    captureSessionId: row.captureSessionId ?? null,
    recordedAt: dateString(row.recordedAt ?? row.createdAt),
    source: sourceFromClientSession(clientSessionId),
    media: {
      type: mediaType,
      imageUrl: row.imageUrl ?? null,
      annotatedImageUrl: row.annotatedImageUrl ?? null,
      displayImageUrl: row.annotatedImageUrl ?? row.imageUrl ?? null,
      videoUrl: row.videoUrl ?? null,
    },
    scores: {
      overall: metric(row.overallScore, "score"),
      form: metric(row.formScore, "score"),
      balance: metric(row.balanceScore, "score"),
      release: metric(row.releaseScore, "score"),
      consistency: metric(row.consistencyScore, "score"),
    },
    angles: {
      elbow: metric(row.elbowAngle, "deg"),
      knee: metric(row.kneeAngle, "deg"),
      wrist: metric(row.wristAngle, "deg"),
      shoulder: metric(row.shoulderAngle, "deg"),
      hip: metric(row.hipAngle, "deg"),
      release: metric(row.releaseAngle, "deg"),
      kneeMin: metric(row.kneeAngleMin, "deg"),
    },
    measurements: {
      releaseHeightInches: metric(row.releaseHeightInches, "in"),
      releaseDistanceInches: metric(row.releaseDistanceInches, "in"),
      verticalJumpInches: metric(row.verticalJumpInches, "in"),
      centerlineDeviationDeg: metric(row.centerlineDeviationDeg, "deg"),
    },
    phase: textMetric(row.shootingPhase),
    pose: {
      provider: row.roboflowPoseData == null ? null : "stored-pose",
      keypoints: row.roboflowPoseData ?? null,
      detection: row.roboflowDetection ?? null,
      overlays: row.visualOverlays ?? null,
    },
    feedback: {
      coachingNotes: row.coachingNotes ?? null,
      strengths: array(row.strengths),
      improvements: array(row.improvements),
      drills: array(row.drills),
    },
    eliteMatch: {
      matchedShooterId: row.matchedShooterId ?? null,
      confidence: metric(row.matchConfidence, "ratio"),
      similarShooters: array(row.similarShooters),
    },
    provenance: {
      measured: [],
      missing: [],
      estimated: [],
      demo: [],
    },
  }

  result.provenance.measured = measuredMetricKeys(result)
  result.provenance.missing = missingMetricKeys(result)
  return result
}
