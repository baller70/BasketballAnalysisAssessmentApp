import { describe, expect, it } from "vitest"

import { coachingMetricUnit } from "@/lib/coaching/coachingTarget"

describe("coaching metric units", () => {
  it("uses percentage units for score and overall metrics", () => {
    expect(coachingMetricUnit("overallScore")).toBe("%")
    expect(coachingMetricUnit("footworkScore")).toBe("%")
    expect(coachingMetricUnit("followThrough")).toBe("%")
  })

  it("uses degree units for angle metrics", () => {
    expect(coachingMetricUnit("releaseAngle")).toBe("°")
  })
})
