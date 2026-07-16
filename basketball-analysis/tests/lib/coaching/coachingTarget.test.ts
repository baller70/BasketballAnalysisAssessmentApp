import { describe, expect, it } from "vitest"
import {
  evaluateRetest,
  selectCoachingTarget,
  type CoachingTargetInput,
} from "@/lib/coaching/coachingTarget"

describe("coaching target selection", () => {
  it("selects the highest-confidence flaw and attaches one existing drill", () => {
    const input: CoachingTargetInput = {
      flaws: [
        { id: "poor_balance", confidence: 0.64 },
        { id: "elbow_flare", confidence: 0.91, baseline: 18 },
      ],
      metrics: { elbowAngle: 18 },
    }

    const target = selectCoachingTarget(input)

    expect(target.flaw).toBe("Elbow Flare")
    expect(target.confidence).toBe(0.91)
    expect(target.baseline).toBe(18)
    expect(target.targetValue).toBeLessThan(target.baseline)
    expect(target.drillId).toBeTruthy()
    expect(target.drillName).toBeTruthy()
    expect(target.cue).toContain("elbow")
  })

  it("normalizes string flaws and supplies a deterministic fallback target", () => {
    const target = selectCoachingTarget({ flaws: ["inconsistent_release"] })

    expect(target.flaw).toBe("Inconsistent Release")
    expect(target.metric).toBe("releaseAngle")
    expect(target.baseline).toBe(42)
    expect(target.targetValue).toBe(48)
    expect(target.direction).toBe("increase")
  })

  it("uses the latest measured angle instead of a synthetic baseline", () => {
    const target = selectCoachingTarget({
      flaws: ["elbow_flare"],
      metrics: { right_elbow_angle: 84 },
    })

    expect(target.metric).toBe("elbowAngle")
    expect(target.baseline).toBe(84)
  })
})

describe("coaching target retests", () => {
  const target = selectCoachingTarget({
    flaws: [{ id: "insufficient_knee_bend", baseline: 112, confidence: 0.8 }],
  })

  it("reports improvement once the target is reached", () => {
    const result = evaluateRetest(target, 132)
    expect(result.status).toBe("improved")
    expect(result.delta).toBe(20)
  })

  it("reports regression when the metric moves past baseline", () => {
    const result = evaluateRetest(target, 100)
    expect(result.status).toBe("regression")
    expect(result.delta).toBe(-12)
  })

  it("reports no change inside the baseline/target band", () => {
    const result = evaluateRetest(target, 118)
    expect(result.status).toBe("no_change")
  })
})
