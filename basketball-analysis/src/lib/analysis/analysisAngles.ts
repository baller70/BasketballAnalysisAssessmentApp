/**
 * One stored analysis → the loosely-keyed record the flaw rules read.
 *
 * THIS EXISTED TWICE, character for character, in `/api/analysis/flaws` and
 * `/api/training/recommended` — the two routes that run
 * `detectFlawsFromAngles` over a player's saved shots. When the dip
 * (`kneeAngleMin`) was added so INSUFFICIENT_KNEE_BEND could fire, only the
 * flaws copy learned about it. The Flaws screen could see a shallow dip and the
 * drill recommendations could not, so the same player was told what was wrong
 * on one screen and offered nothing to fix it on the next.
 *
 * That is F21: delete the copy, do not re-tune it. One function, both callers,
 * and a third caller cannot quietly diverge.
 *
 * ON THE KEYS. Each joint is emitted under BOTH `x_angle` and `right_x_angle`,
 * matching `services/pose/formAnglesToRecord`, so a rule keyed either way
 * resolves. The dip gets its OWN key rather than overwriting `knee_angle`:
 * they are different moments of the shot — the release knee is extended on
 * every shot, the dip is the deepest bend of the load — and collapsing them is
 * exactly what made INSUFFICIENT_KNEE_BEND fire on everybody.
 */

/** The columns this needs. Prisma Decimals arrive as strings/objects. */
export interface StoredAnalysisAngles {
  elbowAngle: unknown
  kneeAngle: unknown
  wristAngle: unknown
  shoulderAngle: unknown
  hipAngle: unknown
  releaseAngle: unknown
  /** The dip. Absent on analyses saved before the column existed. */
  kneeAngleMin?: unknown
}

/** The Prisma `select` both callers need; keeps the two queries in step. */
export const ANALYSIS_ANGLE_SELECT = {
  elbowAngle: true, kneeAngle: true, wristAngle: true,
  shoulderAngle: true, hipAngle: true, releaseAngle: true,
  kneeAngleMin: true,
} as const

export function anglesOf(row: StoredAnalysisAngles): Record<string, number> {
  const out: Record<string, number> = {}
  const put = (joint: string, v: unknown) => {
    const n = Number(v)
    if (v == null || !Number.isFinite(n)) return
    out[`${joint}_angle`] = n
    out[`right_${joint}_angle`] = n
  }
  put("elbow", row.elbowAngle)
  put("knee", row.kneeAngle)
  put("wrist", row.wristAngle)
  put("shoulder", row.shoulderAngle)
  put("hip", row.hipAngle)
  put("release", row.releaseAngle)

  const dip = Number(row.kneeAngleMin)
  if (row.kneeAngleMin != null && Number.isFinite(dip)) out.knee_angle_min = dip
  return out
}
