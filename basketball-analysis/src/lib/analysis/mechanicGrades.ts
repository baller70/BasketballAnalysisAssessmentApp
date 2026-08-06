/**
 * The four MECHANICS HIGHLIGHTS on the share card, graded from the shot.
 *
 * `ShareResults` carried them as literals — ELBOW STACK GOOD, RELEASE ANGLE
 * GOOD, WRIST SNAP GOOD, FOLLOW-THROUGH GOOD — on the one card in this app a
 * player SENDS TO OTHER PEOPLE. Every player shared the same four grades
 * whatever their shot measured, which is the worst place in the product to
 * carry a constant: the others have an audience of one.
 *
 * Two of the four are graded from angles the analysis already measures, against
 * the same ideal bands the metric strip uses. Two are not, for different
 * reasons, and say so.
 *
 * A NOTE ON THE ELBOW BAND, because the app currently disagrees with itself.
 * `angles.elbow` is graded 85°-95° by the biomechanics KEY MEASUREMENTS table
 * and by `readMetric` on the phone overview, and 160°-180° by the MECHANICS
 * panel on `/results/demo`. Those are two different quantities wearing one
 * field name — flexion at the set point versus extension at release — and only
 * one of them can be what the pipeline writes. This grades against 85°-95°,
 * matching the two surfaces most recently verified against real seeded angles.
 * Resolving which the pipeline actually produces is its own task; it is in the
 * ledger, and it must be settled before either band is trusted further.
 */

export type GradeState = "good" | "review" | "unmeasured"

export interface MechanicGrade {
  label: string
  value: string
  state: GradeState
}

export interface ShotAngles {
  elbow?: number | null
  wrist?: number | null
  release?: number | null
  [key: string]: number | null | undefined
}

/** Inclusive ideal ranges, the same the metric surfaces print. */
const BANDS = {
  elbow: [85, 95] as const,
  release: [45, 55] as const,
  wrist: [15, 30] as const,
}

function band(value: number | null | undefined, [lo, hi]: readonly [number, number], label: string): MechanicGrade {
  if (value == null || !Number.isFinite(value)) {
    return { label, value: "NOT MEASURED", state: "unmeasured" }
  }
  return value >= lo && value <= hi
    ? { label, value: "GOOD", state: "good" }
    : { label, value: "REVIEW", state: "review" }
}

/**
 * Grade the share card's four rows.
 *
 * `angles` null means there is no analysis at all — a signed-out visitor — and
 * the caller keeps canonical's four. That is the empty state, not a grade.
 */
export function gradeMechanics(angles: ShotAngles | null): MechanicGrade[] | null {
  if (!angles) return null
  return [
    band(angles.elbow, BANDS.elbow, "ELBOW STACK"),
    band(angles.release, BANDS.release, "RELEASE ANGLE"),
    band(angles.wrist, BANDS.wrist, "WRIST SNAP"),
    /* FOLLOW-THROUGH has no measurement of its own. It is a PHASE, and what
       would grade it — how the wrist and arm hold AFTER release — is the wrist
       angle, which the row above already carries. Grading both from one number
       would assert two independent readings from a single measurement (F22),
       so this row says what it is instead of borrowing. */
    { label: "FOLLOW-THROUGH", value: "NOT MEASURED", state: "unmeasured" },
  ]
}
