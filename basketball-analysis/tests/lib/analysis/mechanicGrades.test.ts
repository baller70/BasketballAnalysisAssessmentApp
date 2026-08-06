import { describe, it, expect } from "vitest"
import { gradeMechanics } from "@/lib/analysis/mechanicGrades"
import {
  ELBOW_AT_RELEASE, WRIST_AT_RELEASE, RELEASE_FROM_VERTICAL,
} from "@/lib/analysis/angleBands"

const at = (rows: NonNullable<ReturnType<typeof gradeMechanics>>, label: string) =>
  rows.find((r) => r.label === label)!

/** A textbook release frame: arm extended, forearm high, release near vertical. */
const GOOD = { elbow: 168, release: 4, wrist: 78 }

describe("gradeMechanics", () => {
  it("returns null with no analysis, so the caller keeps canonical's four", () => {
    // A signed-out visitor has nothing to grade; canonical is the empty state,
    // not a set of passes.
    expect(gradeMechanics(null)).toBeNull()
  })

  it("grades a textbook release frame as GOOD on all three measured rows", () => {
    const rows = gradeMechanics(GOOD)!
    for (const label of ["ELBOW STACK", "RELEASE ANGLE", "WRIST SNAP"]) {
      expect(at(rows, label).state, label).toBe("good")
    }
  })

  it("flags each angle that falls outside its own band", () => {
    // Short arm, forearm barely off horizontal, release thrown well off vertical.
    const rows = gradeMechanics({ elbow: 120, release: 40, wrist: 25 })!
    for (const label of ["ELBOW STACK", "RELEASE ANGLE", "WRIST SNAP"]) {
      expect(at(rows, label), label).toMatchObject({ value: "REVIEW", state: "review" })
    }
  })

  it("treats the band edges as inside", () => {
    for (const [elbow, release, wrist] of [
      [ELBOW_AT_RELEASE.min, RELEASE_FROM_VERTICAL.min, WRIST_AT_RELEASE.min],
      [ELBOW_AT_RELEASE.max, RELEASE_FROM_VERTICAL.max, WRIST_AT_RELEASE.max],
    ]) {
      const rows = gradeMechanics({ elbow, release, wrist })!
      for (const label of ["ELBOW STACK", "RELEASE ANGLE", "WRIST SNAP"]) {
        expect(at(rows, label).state, `${label} @ ${elbow}/${release}/${wrist}`).toBe("good")
      }
    }
  })

  it("grades the release frame it is actually given, not a set point", () => {
    /* The correctness bug this suite was rewritten under. Every angle on an
       analysis is sampled at the RELEASE frame, but the bands here described
       other moments entirely: the elbow at 85-95 (the set-point "L"), the wrist
       at 15-30 (a snap flexion nothing measures) and the release at 45-55
       (canonical's ball launch arc). All three failed the same way — a correct
       shot was marked REVIEW. */
    const rows = gradeMechanics(GOOD)!
    expect(at(rows, "ELBOW STACK").state).toBe("good")   // 168° — was REVIEW under 85-95
    expect(at(rows, "WRIST SNAP").state).toBe("good")    //  78° — was REVIEW under 15-30
    expect(at(rows, "RELEASE ANGLE").state).toBe("good") //   4° — was REVIEW under 45-55

    // And the old bands' "good" values are now correctly rejected.
    expect(at(gradeMechanics({ elbow: 90 })!, "ELBOW STACK").state).toBe("review")
    expect(at(gradeMechanics({ wrist: 21 })!, "WRIST SNAP").state).toBe("review")
    expect(at(gradeMechanics({ release: 52 })!, "RELEASE ANGLE").state).toBe("review")
  })

  it("treats the release deviation as signed, with either direction equal", () => {
    // `angles.release` is 0 at straight-up; leaning back is no better or worse
    // than leaning forward by the same amount.
    for (const release of [-12, 12]) {
      expect(at(gradeMechanics({ release })!, "RELEASE ANGLE").state, `${release}°`).toBe("good")
    }
    for (const release of [-30, 30]) {
      expect(at(gradeMechanics({ release })!, "RELEASE ANGLE").state, `${release}°`).toBe("review")
    }
  })

  it("says NOT MEASURED for an angle the analysis did not carry, never GOOD", () => {
    const rows = gradeMechanics({ elbow: null, release: undefined, wrist: 78 })!
    expect(at(rows, "ELBOW STACK")).toMatchObject({ value: "NOT MEASURED", state: "unmeasured" })
    expect(at(rows, "RELEASE ANGLE")).toMatchObject({ value: "NOT MEASURED", state: "unmeasured" })
    expect(at(rows, "WRIST SNAP").state).toBe("good")
  })

  it("never grades FOLLOW-THROUGH, because nothing measures it separately", () => {
    // Grading it from the wrist would assert two independent readings from one
    // measurement — the same defect as SHOT ARC beside RELEASE ANGLE (F22).
    for (const angles of [GOOD, { wrist: null }]) {
      expect(at(gradeMechanics(angles)!, "FOLLOW-THROUGH"))
        .toMatchObject({ value: "NOT MEASURED", state: "unmeasured" })
    }
  })

  it("returns no GOOD at all for a shot that measured nothing", () => {
    // The defect, stated as a test: the card used to read GOOD four times
    // regardless of the shot.
    const rows = gradeMechanics({})!
    expect(rows.filter((r) => r.state === "good")).toHaveLength(0)
  })

  it("keeps the four rows in canonical's order", () => {
    expect(gradeMechanics({})!.map((r) => r.label))
      .toEqual(["ELBOW STACK", "RELEASE ANGLE", "WRIST SNAP", "FOLLOW-THROUGH"])
  })
})
