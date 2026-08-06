import { describe, it, expect } from "vitest"
import { resolveShot, tallyShots, formatWorkoutClock } from "@/lib/shots/resolveShot"

describe("resolveShot", () => {
  it("takes the detector's verdict when nobody has reviewed it", () => {
    expect(resolveShot({ detected: true, detectedResult: "make" }))
      .toEqual({ dropped: false, result: "make" })
  })

  it("treats an unrecognised detector result as unknown, not as a miss", () => {
    expect(resolveShot({ detected: true, detectedResult: "unknown" }).result).toBeNull()
    expect(resolveShot({ detected: true, detectedResult: null }).result).toBeNull()
  })

  it("drops an event the detector itself did not detect", () => {
    expect(resolveShot({ detected: false, detectedResult: "make" }).dropped).toBe(true)
  })

  it("lets a make_miss correction overrule the detector", () => {
    expect(resolveShot({
      detected: true, detectedResult: "make",
      corrections: [{ kind: "make_miss", value: "miss" }],
    })).toEqual({ dropped: false, result: "miss" })
  })

  it("drops the attempt on a false_shot correction", () => {
    expect(resolveShot({
      detected: true, detectedResult: "make",
      corrections: [{ kind: "false_shot", value: true }],
    }).dropped).toBe(true)
  })

  it("un-drops when a false_shot correction explicitly says false", () => {
    expect(resolveShot({
      detected: false, detectedResult: "miss",
      corrections: [{ kind: "false_shot", value: false }],
    }).dropped).toBe(false)
  })

  it("applies corrections in order so the last reviewer wins", () => {
    expect(resolveShot({
      detected: true, detectedResult: "miss",
      corrections: [
        { kind: "make_miss", value: "make" },
        { kind: "make_miss", value: "miss" },
      ],
    }).result).toBe("miss")
  })

  it("ignores a make_miss correction carrying a value it cannot mean", () => {
    expect(resolveShot({
      detected: true, detectedResult: "make",
      corrections: [{ kind: "make_miss", value: "maybe" }],
    }).result).toBe("make")
  })

  it("ignores correction kinds that say nothing about the result", () => {
    expect(resolveShot({
      detected: true, detectedResult: "make",
      corrections: [{ kind: "shooter", value: "someone else" }, { kind: "phase", value: "rise" }],
    })).toEqual({ dropped: false, result: "make" })
  })
})

describe("tallyShots", () => {
  it("counts attempts and makes with review applied", () => {
    expect(tallyShots([
      { detected: true, detectedResult: "make" },
      { detected: true, detectedResult: "miss" },
      { detected: true, detectedResult: "make", corrections: [{ kind: "make_miss", value: "miss" }] },
      { detected: true, detectedResult: "make", corrections: [{ kind: "false_shot", value: true }] },
    ])).toEqual({ shots: 3, makes: 1 })
  })

  it("does not count an unknown result as a make", () => {
    expect(tallyShots([{ detected: true, detectedResult: "unknown" }])).toEqual({ shots: 1, makes: 0 })
  })

  it("reports zero for an empty set rather than throwing", () => {
    expect(tallyShots([])).toEqual({ shots: 0, makes: 0 })
  })
})

describe("formatWorkoutClock", () => {
  it("formats an offset as m:ss", () => {
    expect(formatWorkoutClock(1_572_000)).toBe("26:12")
    expect(formatWorkoutClock(0)).toBe("0:00")
    expect(formatWorkoutClock(9_000)).toBe("0:09")
  })

  it("keeps counting in minutes past an hour rather than wrapping", () => {
    expect(formatWorkoutClock(3_723_000)).toBe("62:03")
  })

  it("returns null when no offset was recorded", () => {
    expect(formatWorkoutClock(null)).toBeNull()
    expect(formatWorkoutClock(undefined)).toBeNull()
    expect(formatWorkoutClock(-1)).toBeNull()
    expect(formatWorkoutClock(Number.NaN)).toBeNull()
  })
})
