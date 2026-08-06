import { describe, expect, it } from "vitest"
import { evaluateGoal, currentDayStreak, type GoalSession } from "@/lib/goals/progress"

/**
 * Goals never moved: `currentValue` was only ever written by a client PATCH, so
 * a player could shoot 68% for a month against a 65% goal and watch the bar sit
 * at zero. These cases each build a record whose answer is known by
 * construction, then assert the evaluator recovers it — and, just as important,
 * that it declines to answer when there is nothing to answer from.
 */

const DAY = 24 * 60 * 60 * 1000
const daysAgo = (n: number) => new Date(Date.now() - n * DAY)

const session = (o: Partial<GoalSession> = {}): GoalSession => ({
  at: daysAgo(0), score: 80, shots: 0, makes: 0, ...o,
})

describe("accuracy goals", () => {
  it("pools every attempt rather than averaging sessions", () => {
    // 2/2 in one session and 20/40 in another is 22/42 = 52.4%, NOT the 75%
    // that averaging (100% and 50%) would give.
    const g = evaluateGoal({ category: "accuracy", targetValue: 65 }, [
      session({ shots: 2, makes: 2 }),
      session({ shots: 40, makes: 20 }),
    ], 0)
    expect(g.currentValue).toBeCloseTo(52.4, 1)
    expect(g.source).toBe("measured")
  })

  it("declines when nothing has been scored", () => {
    const g = evaluateGoal({ category: "accuracy", targetValue: 65 }, [session()], 0)
    expect(g.currentValue).toBeNull()
    expect(g.source).toBe("unmeasured")
    expect(g.reason).toMatch(/scored shots/i)
  })
})

describe("form goals", () => {
  it("takes the best score reached, not the latest", () => {
    const g = evaluateGoal({ category: "form", targetValue: 90 }, [
      session({ score: 71 }), session({ score: 88 }), session({ score: 74 }),
    ], 0)
    expect(g.currentValue).toBe(88)
    expect(g.fraction).toBeCloseTo(88 / 90, 5)
  })

  it("ignores analyses that carry no score", () => {
    const g = evaluateGoal({ category: "form", targetValue: 90 }, [
      session({ score: null }), session({ score: 62 }),
    ], 0)
    expect(g.currentValue).toBe(62)
  })
})

describe("volume goals", () => {
  it("counts shots by default", () => {
    const g = evaluateGoal({ category: "volume", targetValue: 500, unit: "shots" }, [
      session({ shots: 30, makes: 12 }), session({ shots: 25, makes: 10 }),
    ], 0)
    expect(g.currentValue).toBe(55)
  })

  it("counts sessions when that is the unit", () => {
    const g = evaluateGoal({ category: "volume", targetValue: 20, unit: "sessions" }, [
      session({ shots: 30 }), session({ shots: 25 }), session({ shots: 0 }),
    ], 0)
    expect(g.currentValue).toBe(3)
  })

  it("says a session with no capture has no shots to count", () => {
    const g = evaluateGoal({ category: "volume", targetValue: 500, unit: "shots" },
      [session({ shots: 0 })], 0)
    expect(g.currentValue).toBeNull()
    expect(g.reason).toMatch(/no shot counts/i)
  })
})

describe("streaks", () => {
  it("counts consecutive days ending today", () => {
    const s = [daysAgo(0), daysAgo(1), daysAgo(2)].map((at) => session({ at }))
    expect(currentDayStreak(s)).toBe(3)
  })

  it("survives until the end of the following day", () => {
    // Trained yesterday, not yet today: the streak is alive, not broken.
    const s = [daysAgo(1), daysAgo(2)].map((at) => session({ at }))
    expect(currentDayStreak(s)).toBe(2)
  })

  it("is zero once a day has been missed", () => {
    const s = [daysAgo(3), daysAgo(4)].map((at) => session({ at }))
    expect(currentDayStreak(s)).toBe(0)
  })

  it("counts a day once however many times you trained", () => {
    const s = [daysAgo(0), daysAgo(0), daysAgo(1)].map((at) => session({ at }))
    expect(currentDayStreak(s)).toBe(2)
  })
})

describe("consistency goals", () => {
  it("counts DAYS trained, not sessions", () => {
    const g = evaluateGoal({ category: "consistency", targetValue: 10 }, [
      session({ at: daysAgo(0) }), session({ at: daysAgo(0) }), session({ at: daysAgo(5) }),
    ], 0)
    expect(g.currentValue).toBe(2)
  })
})

describe("custom goals", () => {
  it("keeps the player's own logged value and says it is tracked by hand", () => {
    const g = evaluateGoal({ category: "custom", targetValue: 100 }, [session()], 40)
    expect(g.currentValue).toBe(40)
    expect(g.source).toBe("stored")
    expect(g.reason).toMatch(/by hand/i)
    expect(g.fraction).toBeCloseTo(0.4, 5)
  })
})

describe("never overstates", () => {
  it("clamps a fraction that has run past its target", () => {
    const g = evaluateGoal({ category: "form", targetValue: 70 }, [session({ score: 95 })], 0)
    expect(g.currentValue).toBe(95)
    expect(g.fraction).toBe(1)
  })

  it("reports unmeasured rather than zero when there is no evidence", () => {
    // The distinction the whole module exists for: "you have made no progress"
    // and "nobody has checked" must not look the same.
    const g = evaluateGoal({ category: "form", targetValue: 90 }, [], 0)
    expect(g.currentValue).toBeNull()
    expect(g.fraction).toBeNull()
    expect(g.source).toBe("unmeasured")
  })
})
