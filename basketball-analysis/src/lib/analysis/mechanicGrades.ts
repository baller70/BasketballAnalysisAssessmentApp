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
 * THE BANDS ARE NOT THIS FILE'S TO CHOOSE. All three graded rows read angles
 * sampled at the release frame, and what a release-frame angle counts as good
 * is settled once in `@/lib/analysis/angleBands` — which is also where the
 * evidence lives for why the numbers that used to be here (elbow 85-95, wrist
 * 15-30, release 45-55) were each describing a different quantity from the one
 * they were judging, and each marked a correct shot wrong.
 */

import {
  ELBOW_AT_RELEASE, WRIST_AT_RELEASE, RELEASE_FROM_VERTICAL, inBand, type AngleBand,
} from "@/lib/analysis/angleBands"

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

function band(value: number | null | undefined, range: AngleBand, label: string): MechanicGrade {
  const ok = inBand(value, range)
  if (ok == null) return { label, value: "NOT MEASURED", state: "unmeasured" }
  return ok
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
    band(angles.elbow, ELBOW_AT_RELEASE, "ELBOW STACK"),
    band(angles.release, RELEASE_FROM_VERTICAL, "RELEASE ANGLE"),
    band(angles.wrist, WRIST_AT_RELEASE, "WRIST SNAP"),
    /* FOLLOW-THROUGH has no measurement of its own. It is a PHASE, and what
       would grade it — how the wrist and arm hold AFTER release — is the wrist
       angle, which the row above already carries. Grading both from one number
       would assert two independent readings from a single measurement (F22),
       so this row says what it is instead of borrowing. */
    { label: "FOLLOW-THROUGH", value: "NOT MEASURED", state: "unmeasured" },
  ]
}
