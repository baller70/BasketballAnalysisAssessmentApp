import { describe, it, expect } from "vitest"
import { detectFlawsFromAngles, evaluateFlawRule, SHOOTING_FLAWS } from "@/data/shootingFlawsDatabase"

const idsOf = (angles: Record<string, number>) => detectFlawsFromAngles(angles).map((f) => f.id)

/** Exactly what the pipeline writes for a correct shot: every angle at RELEASE. */
const TEXTBOOK_RELEASE = {
  elbow_angle: 168, right_elbow_angle: 168,
  knee_angle: 172, right_knee_angle: 172,
  shoulder_angle: 160, right_shoulder_angle: 160,
  hip_angle: 176, right_hip_angle: 176,
  release_angle: 4, wrist_angle: 78,
}

describe("flaw detection on stored analysis angles", () => {
  it("finds no fault with a textbook release frame", () => {
    /* THE DEFECT, AS A TEST. ELBOW_ANGLE_OBTUSE (>110 "at set point") and
       INSUFFICIENT_KNEE_BEND (>160, at the dip) both read release-frame values,
       where a correct shot extends to ~168 and ~172. Every player was told
       their elbow was too straight and their knees underbent, on every shot,
       for doing exactly what a release frame is supposed to show. */
    expect(idsOf(TEXTBOOK_RELEASE)).toEqual([])
  })

  it("does not fault a release frame no matter how extended it is", () => {
    for (const elbow of [150, 168, 180]) {
      for (const knee of [161, 172, 180]) {
        expect(idsOf({ ...TEXTBOOK_RELEASE, elbow_angle: elbow, knee_angle: knee }),
          `elbow ${elbow} / knee ${knee}`).toEqual([])
      }
    }
  })

  it("still fires the set-point elbow rules when a set-point angle is supplied", () => {
    // The rules are sound; they were being fed the wrong moment. Given the
    // moment they describe, they work.
    expect(idsOf({ elbow_angle_set_point: 125 })).toContain("ELBOW_ANGLE_OBTUSE")
    expect(idsOf({ elbow_angle_set_point: 62 })).toContain("ELBOW_ANGLE_ACUTE")
    expect(idsOf({ elbow_angle_set_point: 90 })).toEqual([])
  })

  it("still fires the knee rules when the dip's own angle is supplied", () => {
    expect(idsOf({ knee_angle_min: 168 })).toContain("INSUFFICIENT_KNEE_BEND")
    expect(idsOf({ knee_angle_min: 92 })).toContain("EXCESSIVE_KNEE_BEND")
    expect(idsOf({ knee_angle_min: 142 })).toEqual([])
  })

  it("judges the dip on a real shot without the release knee interfering", () => {
    /* Both keys present, as a saved analysis now carries them. The release
       knee is extended on EVERY shot, so it must not reach the dip rules —
       the whole defect — and the dip must be judged on its own merit. */
    const shot = (dip: number) => ({ ...TEXTBOOK_RELEASE, knee_angle_min: dip })

    // A player who loaded properly is not faulted, however straight their
    // legs are at release.
    expect(idsOf(shot(138))).toEqual([])
    expect(idsOf(shot(155))).toEqual([])

    // A player who barely bent at all is — which the rule could never say
    // before, because it was reading a release knee that is always >160.
    expect(idsOf(shot(166))).toEqual(["INSUFFICIENT_KNEE_BEND"])
    // And a collapse into a deep squat is caught at the other end.
    expect(idsOf(shot(95))).toEqual(["EXCESSIVE_KNEE_BEND"])
  })

  it("says nothing about the dip on a shot analysed before it was recorded", () => {
    // No backfill: older analyses genuinely have no dip, and inventing one
    // would fault or clear a player on a measurement nobody took.
    expect(idsOf(TEXTBOOK_RELEASE)).toEqual([])
  })

  it("keeps reading the wrist, which IS measured at release", () => {
    // Forearm elevation below the good band means the arm never came up.
    expect(idsOf({ ...TEXTBOOK_RELEASE, wrist_angle: 30 })).toContain("NO_WRIST_SNAP")
    expect(idsOf({ ...TEXTBOOK_RELEASE, wrist_angle: 78 })).not.toContain("NO_WRIST_SNAP")
  })

  it("abstains rather than guessing when a rule's signal is not produced", () => {
    // A rule with no signal must return false, never a default verdict.
    const noSignal = SHOOTING_FLAWS.filter((f) =>
      ["ELBOW_FLARE", "GUIDE_HAND_PUSH", "LOW_RELEASE_POINT", "CONSISTENT_LEFT_MISS"].includes(f.id))
    expect(noSignal.length).toBeGreaterThan(0)
    for (const f of noSignal) expect(evaluateFlawRule(f, TEXTBOOK_RELEASE), f.id).toBe(false)
  })

  it("reports nothing at all for an analysis with no angles", () => {
    expect(idsOf({})).toEqual([])
  })
})
