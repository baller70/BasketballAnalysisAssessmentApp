import {
  getDrillsByFocusArea,
  type Drill,
  type DrillFocusArea,
} from "@/data/drillDatabase"

/** A normalized coaching target shared by the API and Training/History UI. */
export type CoachingTargetStatus = "active" | "improved" | "no_change" | "regression" | "superseded"
export type CoachingTargetDirection = "increase" | "decrease"

export interface CoachingTarget {
  id?: string
  flaw: string
  cue: string
  drillId: string
  drillName: string
  metric: string
  baseline: number
  targetValue: number
  direction: CoachingTargetDirection
  confidence: number
  status: CoachingTargetStatus
  retestValue?: number | null
  retestedAt?: string | null
}

export interface CoachingFlawSignal {
  id?: string
  name?: string
  confidence?: number
  /** Current metric value, when the caller has one. */
  baseline?: number
  metric?: string
  targetValue?: number
  direction?: CoachingTargetDirection
  cue?: string
  drillId?: string
}

export interface CoachingTargetInput {
  flaws?: Array<string | CoachingFlawSignal>
  /** Angle/score values from the most recent analysis. */
  metrics?: Record<string, number | null | undefined>
  candidates?: CoachingFlawSignal[]
  /** A profile skill level is deliberately not required; a target always has a drill. */
}

/** Raised when a recommendation cannot be executed by the Training drill pool. */
export class CoachingTargetUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CoachingTargetUnavailableError"
  }
}

interface TargetRule {
  flaw: string
  aliases: string[]
  metric: string
  focusArea: DrillFocusArea
  direction: CoachingTargetDirection
  targetValue: number
  fallbackBaseline: number
  cue: string
}

/**
 * The rules are intentionally small and deterministic. The analysis pipeline can
 * add richer signals later without changing the target/retest contract.
 */
const TARGET_RULES: TargetRule[] = [
  {
    flaw: "Elbow Flare",
    aliases: ["elbow_flare", "elbowflare", "elbow_alignment", "elbowalignment", "elbow_drift"],
    metric: "elbowAngle",
    focusArea: "ELBOW_ALIGNMENT",
    direction: "decrease",
    targetValue: 10,
    fallbackBaseline: 18,
    cue: "Keep your elbow under the ball and finish toward the rim.",
  },
  {
    flaw: "Insufficient Knee Bend",
    aliases: ["insufficient_knee_bend", "knee_bend", "kneebend", "shallow_knees"],
    metric: "kneeAngle",
    focusArea: "KNEE_BEND",
    direction: "increase",
    targetValue: 130,
    fallbackBaseline: 112,
    cue: "Load your legs first: sit into a comfortable knee bend before rising.",
  },
  {
    flaw: "Inconsistent Release",
    aliases: ["inconsistent_release", "release_point", "releasepoint", "low_release"],
    metric: "releaseAngle",
    focusArea: "RELEASE_POINT",
    direction: "increase",
    targetValue: 48,
    fallbackBaseline: 42,
    cue: "Reach the same high release point on every repetition.",
  },
  {
    flaw: "Poor Follow Through",
    aliases: ["poor_follow_through", "follow_through", "followthrough"],
    metric: "followThrough",
    focusArea: "FOLLOW_THROUGH",
    direction: "increase",
    targetValue: 85,
    fallbackBaseline: 65,
    cue: "Hold your wrist over the rim until the ball reaches the basket.",
  },
  {
    flaw: "Poor Balance",
    aliases: ["poor_balance", "balance", "balance_issue"],
    metric: "balanceScore",
    focusArea: "BALANCE",
    direction: "increase",
    targetValue: 85,
    fallbackBaseline: 65,
    cue: "Land quietly in the same stance, with your chest and hips square.",
  },
  {
    flaw: "Flat Arc",
    aliases: ["flat_arc", "arc_trajectory", "arc", "low_arc"],
    metric: "releaseAngle",
    focusArea: "ARC_TRAJECTORY",
    direction: "increase",
    targetValue: 48,
    fallbackBaseline: 40,
    cue: "Send the ball up first; picture a soft 45–52° rainbow arc.",
  },
  {
    flaw: "Inconsistent Footwork",
    aliases: ["inconsistent_footwork", "footwork", "poor_stance"],
    metric: "footworkScore",
    focusArea: "FOOTWORK",
    direction: "increase",
    targetValue: 85,
    fallbackBaseline: 65,
    cue: "Set your feet the same way before every shot.",
  },
  {
    flaw: "Shot Consistency",
    aliases: ["consistency", "inconsistent_shot", "shot_consistency"],
    metric: "consistencyScore",
    focusArea: "CONSISTENCY",
    direction: "increase",
    targetValue: 85,
    fallbackBaseline: 65,
    cue: "Repeat one smooth rhythm from dip through follow-through.",
  },
]

const normalizeKey = (value: string) => value.trim().toLowerCase().replace(/\s+/g, "_")

function ruleFor(signal: CoachingFlawSignal | string): TargetRule {
  const key = normalizeKey(typeof signal === "string" ? signal : signal.id || signal.name || "")
  return TARGET_RULES.find((rule) => rule.aliases.includes(key)) || {
    flaw: typeof signal === "string" ? signal.replace(/[_-]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()) : signal.name || signal.id || "Shooting Form",
    aliases: [key],
    metric: "overallScore",
    focusArea: "CONSISTENCY",
    direction: "increase",
    targetValue: 85,
    fallbackBaseline: 65,
    cue: "Repeat a smooth, balanced motion and hold your finish.",
  }
}

function metricValue(rule: TargetRule, signal: CoachingFlawSignal | string, metrics?: CoachingTargetInput["metrics"]): number {
  if (typeof signal !== "string" && Number.isFinite(signal.baseline)) return Number(signal.baseline)
  const metricAliases: Record<string, string[]> = {
    elbowAngle: ["elbowAngle", "right_elbow_angle", "left_elbow_angle", "elbow_angle"],
    kneeAngle: ["kneeAngle", "right_knee_angle", "left_knee_angle", "knee_angle"],
    releaseAngle: ["releaseAngle", "release_angle", "arc", "shotArc"],
    balanceScore: ["balanceScore", "balance_score", "balance"],
    followThrough: ["followThrough", "follow_through", "followThroughScore"],
    footworkScore: ["footworkScore", "footwork_score", "footwork"],
    consistencyScore: ["consistencyScore", "consistency_score", "consistency"],
    overallScore: ["overallScore", "overall_score", "score"],
  }
  for (const key of metricAliases[rule.metric] || [rule.metric]) {
    const value = metrics?.[key]
    if (typeof value === "number" && Number.isFinite(value)) return value
  }
  return rule.fallbackBaseline
}

function chooseDrill(rule: TargetRule, preferredId?: string): Drill {
  const drills = getDrillsByFocusArea(rule.focusArea)
  const drill = (preferredId && drills.find((candidate) => candidate.id === preferredId)) || drills[0]
  if (!drill) {
    // A synthetic ID would render a target that Training cannot start. Fail
    // explicitly so the caller can show a useful recovery message instead.
    throw new CoachingTargetUnavailableError(
      `No executable drill is available for ${rule.focusArea.toLowerCase().replace(/_/g, " ")}.`
    )
  }
  return drill
}

/** Display units for measurements stored by the analysis pipeline. */
export function coachingMetricUnit(metric: string): "°" | "%" {
  const normalized = metric.replace(/[^a-zA-Z]/g, "").toLowerCase()
  return normalized.includes("score") || normalized === "followthrough" ? "%" : "°"
}

/**
 * Select exactly one target. Candidates are ranked by confidence, then by the
 * rule's coaching priority (the caller can safely pass an unordered flaw list).
 */
export function selectCoachingTarget(input: CoachingTargetInput = {}): CoachingTarget {
  const signals = [...(input.candidates || []), ...(input.flaws || [])]
  const source = signals.length ? signals : ["consistency"]
  const ranked = source.map((signal, index) => {
    const rule = ruleFor(signal)
    const confidence = typeof signal === "string"
      ? Math.max(0.5, 0.8 - index * 0.01)
      : Math.min(1, Math.max(0, Number.isFinite(signal.confidence) ? Number(signal.confidence) : 0.75))
    return { signal, rule, confidence, index }
  }).sort((a, b) => b.confidence - a.confidence || a.index - b.index)[0]

  const baseline = metricValue(ranked.rule, ranked.signal, input.metrics)
  const direction = typeof ranked.signal !== "string" && ranked.signal.direction ? ranked.signal.direction : ranked.rule.direction
  const explicitTarget = typeof ranked.signal !== "string" && Number.isFinite(ranked.signal.targetValue)
    ? Number(ranked.signal.targetValue)
    : ranked.rule.targetValue
  const targetValue = direction === "increase"
    ? Math.max(explicitTarget, baseline >= explicitTarget ? baseline : explicitTarget)
    : Math.min(explicitTarget, baseline <= explicitTarget ? baseline : explicitTarget)
  const drill = chooseDrill(ranked.rule, typeof ranked.signal !== "string" ? ranked.signal.drillId : undefined)

  return {
    flaw: ranked.rule.flaw,
    cue: typeof ranked.signal !== "string" && ranked.signal.cue ? ranked.signal.cue : ranked.rule.cue,
    drillId: drill.id,
    drillName: drill.title,
    metric: ranked.rule.metric,
    baseline,
    targetValue,
    direction,
    confidence: Number(ranked.confidence.toFixed(2)),
    status: "active",
    retestValue: null,
    retestedAt: null,
  }
}

export interface RetestResult {
  status: Exclude<CoachingTargetStatus, "active">
  /** Alias used by clients that call this an outcome. */
  outcome: "improvement" | "no-change" | "regression"
  value: number
  delta: number
  message: string
}

/** Compare a fresh measurement with the normalized baseline and target. */
export function evaluateRetest(target: Pick<CoachingTarget, "baseline" | "targetValue" | "direction">, retestValue: number): RetestResult {
  if (!Number.isFinite(retestValue)) throw new Error("Retest value must be a finite number")
  const value = Number(retestValue)
  const delta = Number((value - target.baseline).toFixed(2))
  const tolerance = Math.max(0.5, Math.abs(target.targetValue - target.baseline) * 0.1)
  const reached = target.direction === "increase"
    ? value >= target.targetValue
    : value <= target.targetValue
  const regressed = target.direction === "increase"
    ? value < target.baseline - tolerance
    : value > target.baseline + tolerance

  if (reached) {
    return { status: "improved", outcome: "improvement", value, delta, message: "Improvement — you reached the coaching target." }
  }
  if (regressed) {
    return { status: "regression", outcome: "regression", value, delta, message: "Regression — the metric moved away from your baseline." }
  }
  return { status: "no_change", outcome: "no-change", value, delta, message: "No change — keep the prescribed drill in your next session." }
}

/** Convert a stored Prisma row to the public contract without leaking internals. */
export function serializeCoachingTarget(target: {
  id: string
  flaw: string
  cue: string
  drillId: string
  drillName: string
  metric: string
  baseline: unknown
  targetValue: unknown
  direction: string
  confidence: unknown
  status: string
  retestValue?: unknown
  retestedAt?: Date | string | null
  createdAt?: Date
  updatedAt?: Date
}) {
  return {
    id: target.id,
    flaw: target.flaw,
    cue: target.cue,
    drillId: target.drillId,
    drillName: target.drillName,
    metric: target.metric,
    baseline: Number(target.baseline),
    targetValue: Number(target.targetValue),
    direction: target.direction,
    confidence: Number(target.confidence),
    status: target.status,
    retestValue: target.retestValue == null ? null : Number(target.retestValue),
    retestedAt: target.retestedAt || null,
    createdAt: target.createdAt,
    updatedAt: target.updatedAt,
  }
}
