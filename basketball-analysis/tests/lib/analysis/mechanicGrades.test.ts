import { describe, it, expect } from "vitest"
import { gradeMechanics } from "@/lib/analysis/mechanicGrades"

const at = (rows: NonNullable<ReturnType<typeof gradeMechanics>>, label: string) =>
  rows.find((r) => r.label === label)!

describe("gradeMechanics", () => {
  it("returns null with no analysis, so the caller keeps canonical's four", () => {
    // A signed-out visitor has nothing to grade; canonical is the empty state,
    // not a set of passes.
    expect(gradeMechanics(null)).toBeNull()
  })

  it("grades a shot inside every band as GOOD", () => {
    const rows = gradeMechanics({ elbow: 90, release: 50, wrist: 22 })!
    expect(at(rows, "ELBOW STACK").state).toBe("good")
    expect(at(rows, "RELEASE ANGLE").state).toBe("good")
    expect(at(rows, "WRIST SNAP").state).toBe("good")
  })

  it("flags each angle that falls outside its own band", () => {
    const rows = gradeMechanics({ elbow: 66, release: 33, wrist: 44 })!
    for (const label of ["ELBOW STACK", "RELEASE ANGLE", "WRIST SNAP"]) {
      expect(at(rows, label), label).toMatchObject({ value: "REVIEW", state: "review" })
    }
  })

  it("treats the band edges as inside", () => {
    const rows = gradeMechanics({ elbow: 85, release: 55, wrist: 15 })!
    for (const label of ["ELBOW STACK", "RELEASE ANGLE", "WRIST SNAP"]) {
      expect(at(rows, label).state, label).toBe("good")
    }
  })

  it("says NOT MEASURED for an angle the analysis did not carry, never GOOD", () => {
    const rows = gradeMechanics({ elbow: null, release: undefined, wrist: 22 })!
    expect(at(rows, "ELBOW STACK")).toMatchObject({ value: "NOT MEASURED", state: "unmeasured" })
    expect(at(rows, "RELEASE ANGLE")).toMatchObject({ value: "NOT MEASURED", state: "unmeasured" })
    expect(at(rows, "WRIST SNAP").state).toBe("good")
  })

  it("never grades FOLLOW-THROUGH, because nothing measures it separately", () => {
    // Grading it from the wrist would assert two independent readings from one
    // measurement — the same defect as SHOT ARC beside RELEASE ANGLE (F22).
    for (const angles of [{ elbow: 90, release: 50, wrist: 22 }, { wrist: null }]) {
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
