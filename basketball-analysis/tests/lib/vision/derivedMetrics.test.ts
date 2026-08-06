import { describe, expect, it } from "vitest"
import {
  deriveMetrics,
  estimateScale,
  formatFeetInches,
  EYE_HEIGHT_FRACTION,
  type Keypoint2D,
} from "@/lib/vision/derivedMetrics"

/**
 * These four measurements were constants on the biomechanics screen for the
 * life of the app. The point of these tests is that the replacements are
 * arithmetic anyone can check: every case builds a shooter whose real-world
 * answer is known BY CONSTRUCTION, then asserts the module recovers it.
 *
 * The scale is 2 px per inch throughout, so a 72in player stands
 * 72 * 2 = 144 px, and eye level sits EYE_HEIGHT_FRACTION of that above the floor.
 */
const PX_PER_IN = 2
const HEIGHT_IN = 72
const FLOOR_Y = 400
const EYE_Y = FLOOR_Y - HEIGHT_IN * EYE_HEIGHT_FRACTION * PX_PER_IN

const kp = (name: string, x: number, y: number, score = 0.9): Keypoint2D => ({ name, x, y, score })

/** A shooter standing still, centred at x = 200. */
function standing(overrides: Keypoint2D[] = []): Keypoint2D[] {
  const base = [
    kp("left_eye", 198, EYE_Y), kp("right_eye", 202, EYE_Y),
    kp("left_shoulder", 190, FLOOR_Y - 58 * PX_PER_IN),
    kp("right_shoulder", 210, FLOOR_Y - 58 * PX_PER_IN),
    kp("left_hip", 194, FLOOR_Y - 38 * PX_PER_IN),
    kp("right_hip", 206, FLOOR_Y - 38 * PX_PER_IN),
    kp("left_ankle", 196, FLOOR_Y), kp("right_ankle", 204, FLOOR_Y),
    kp("left_wrist", 185, FLOOR_Y - 40 * PX_PER_IN),
    kp("right_wrist", 215, FLOOR_Y - 40 * PX_PER_IN),
  ]
  const out = [...base]
  for (const o of overrides) {
    const i = out.findIndex((k) => k.name === o.name)
    if (i >= 0) out[i] = o; else out.push(o)
  }
  return out
}

describe("the stature scale", () => {
  it("recovers the pixels-per-inch it was built from", () => {
    const s = estimateScale(standing(), HEIGHT_IN)
    expect(s).not.toBeNull()
    expect(s!.inchesPerPixel).toBeCloseTo(1 / PX_PER_IN, 5)
  })

  it("refuses to invent a scale with no profile height", () => {
    // The whole point: no height, no lengths. Never an average human.
    expect(estimateScale(standing(), null)).toBeNull()
    expect(estimateScale(standing(), 0)).toBeNull()
  })

  it("refuses when the frame does not show an eye and an ankle", () => {
    const noAnkles = standing().filter((k) => !k.name.includes("ankle"))
    expect(estimateScale(noAnkles, HEIGHT_IN)).toBeNull()
  })

  it("ignores joints under the confidence floor", () => {
    const faint = standing([kp("left_ankle", 196, FLOOR_Y, 0.1), kp("right_ankle", 204, FLOOR_Y, 0.1)])
    expect(estimateScale(faint, HEIGHT_IN)).toBeNull()
  })
})

describe("release height", () => {
  it("measures the wrist above the floor", () => {
    // Wrist placed exactly 100in above the ankles.
    const release = standing([
      kp("left_wrist", 200, FLOOR_Y - 100 * PX_PER_IN),
      kp("right_wrist", 200, FLOOR_Y - 100 * PX_PER_IN),
    ])
    const m = deriveMetrics(release, standing(), null, HEIGHT_IN)
    expect(m.releaseHeightInches).toBeCloseTo(100, 4)
    expect(formatFeetInches(m.releaseHeightInches!)).toBe("8'4\"")
  })

  it("is withheld, with a reason, when there is no scale", () => {
    const m = deriveMetrics(standing(), standing(), null, null)
    expect(m.releaseHeightInches).toBeNull()
    expect(m.unavailable.releaseHeight).toMatch(/height to your profile/i)
  })
})

describe("release distance", () => {
  it("measures the wrist offset from the shoulder centreline", () => {
    // Shoulders centre on x = 200; wrist 12in (24px) to the right.
    const release = standing([
      kp("left_wrist", 224, FLOOR_Y - 90 * PX_PER_IN),
      kp("right_wrist", 224, FLOOR_Y - 90 * PX_PER_IN),
    ])
    const m = deriveMetrics(release, standing(), null, HEIGHT_IN)
    expect(m.releaseDistanceInches).toBeCloseTo(12, 4)
  })

  it("is unsigned — drifting either way is the same distance", () => {
    const right = deriveMetrics(
      standing([kp("left_wrist", 230, 200), kp("right_wrist", 230, 200)]), standing(), null, HEIGHT_IN)
    const left = deriveMetrics(
      standing([kp("left_wrist", 170, 200), kp("right_wrist", 170, 200)]), standing(), null, HEIGHT_IN)
    expect(right.releaseDistanceInches).toBeCloseTo(left.releaseDistanceInches!, 4)
  })
})

describe("centreline deviation", () => {
  it("reads 0 for a wrist straight above the hips", () => {
    const release = standing([
      kp("left_wrist", 200, 100), kp("right_wrist", 200, 100),
    ])
    const m = deriveMetrics(release, standing(), null, HEIGHT_IN)
    expect(m.centerlineDeviationDegrees).toBeCloseTo(0, 6)
  })

  it("reads 45 degrees for equal horizontal and vertical offset", () => {
    const hipY = FLOOR_Y - 38 * PX_PER_IN
    const release = standing([
      kp("left_wrist", 300, hipY - 100), kp("right_wrist", 300, hipY - 100),
    ])
    const m = deriveMetrics(release, standing(), null, HEIGHT_IN)
    expect(m.centerlineDeviationDegrees).toBeCloseTo(45, 4)
  })

  it("needs NO scale — it survives a missing profile height", () => {
    // This is the one of the four that a player with no profile still gets.
    const hipY = FLOOR_Y - 38 * PX_PER_IN
    const release = standing([
      kp("left_wrist", 250, hipY - 50), kp("right_wrist", 250, hipY - 50),
    ])
    const m = deriveMetrics(release, standing(), null, null)
    expect(m.centerlineDeviationDegrees).not.toBeNull()
    expect(m.releaseHeightInches).toBeNull()
  })
})

describe("vertical jump", () => {
  it("measures the rise of the hips from setup to the peak frame", () => {
    // Peak frame with the whole body lifted 9in (18px).
    const lift = 9 * PX_PER_IN
    const peak = standing().map((k) => ({ ...k, y: k.y - lift }))
    const m = deriveMetrics(peak, standing(), peak, HEIGHT_IN)
    expect(m.verticalJumpInches).toBeCloseTo(9, 4)
  })

  it("says a photograph cannot show lift", () => {
    const m = deriveMetrics(standing(), standing(), null, HEIGHT_IN)
    expect(m.verticalJumpInches).toBeNull()
    expect(m.unavailable.verticalJump).toMatch(/needs a video/i)
  })

  it("never reports a negative jump", () => {
    // A peak frame LOWER than setup (a dip mis-picked as the peak) must read
    // 0, not a negative height.
    const dip = standing().map((k) => ({ ...k, y: k.y + 20 }))
    const m = deriveMetrics(dip, standing(), dip, HEIGHT_IN)
    expect(m.verticalJumpInches).toBe(0)
  })
})

describe("every withheld value carries a reason", () => {
  it("names what was missing rather than returning a bare null", () => {
    const m = deriveMetrics([], null, null, null)
    expect(m.releaseHeightInches).toBeNull()
    expect(m.centerlineDeviationDegrees).toBeNull()
    for (const key of ["releaseHeight", "releaseDistance", "verticalJump", "centerlineDeviation"]) {
      expect(m.unavailable[key], `${key} must explain itself`).toBeTruthy()
    }
  })
})
