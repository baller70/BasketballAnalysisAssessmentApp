import { describe, it, expect } from "vitest"
import {
  mapFlawToFocusArea, getRecommendedDrills,
  type SkillLevel, type DrillFocusArea,
} from "@/data/drillDatabase"
import { SHOOTING_FLAWS } from "@/data/shootingFlawsDatabase"
import { anglesOf } from "@/lib/analysis/analysisAngles"
import { detectFlawsFromAngles } from "@/data/shootingFlawsDatabase"

describe("mapFlawToFocusArea", () => {
  it("routes a knee flaw to knee work, not to the catch-all", () => {
    /* THE DEFECT. The table was keyed `insufficient_knee_bend` while the flaw
       library says `INSUFFICIENT_KNEE_BEND`, so every lookup missed and every
       flaw returned CONSISTENCY — an elbow problem and a knee problem drew the
       same drills. Nothing threw; a plausible list came back every time. */
    expect(mapFlawToFocusArea("INSUFFICIENT_KNEE_BEND")).toBe("KNEE_BEND")
    expect(mapFlawToFocusArea("EXCESSIVE_KNEE_BEND")).toBe("KNEE_BEND")
    expect(mapFlawToFocusArea("ELBOW_FLARE")).toBe("ELBOW_ALIGNMENT")
    expect(mapFlawToFocusArea("NO_WRIST_SNAP")).toBe("FOLLOW_THROUGH")
    expect(mapFlawToFocusArea("FLAT_SHOT")).toBe("ARC_TRAJECTORY")
  })

  it("gives distinct flaws distinct focus areas", () => {
    // The symptom, stated directly: two different problems must not train the
    // same thing.
    const areas = ["INSUFFICIENT_KNEE_BEND", "ELBOW_FLARE", "NO_WRIST_SNAP", "FLAT_SHOT"]
      .map(mapFlawToFocusArea)
    expect(new Set(areas).size).toBe(4)
  })

  it("maps every mechanical flaw in the library, leaving only miss patterns", () => {
    /* Keeps the two vocabularies pinned together: rename a flaw id and this
       fails, instead of that flaw silently collapsing back to CONSISTENCY. */
    const unmapped = SHOOTING_FLAWS
      .map((f) => f.id)
      .filter((id) => mapFlawToFocusArea(id) === "CONSISTENCY")
    // Only the miss-PATTERN flaws belong in the catch-all: they describe
    // repeatability rather than one joint.
    expect(unmapped.sort()).toEqual([
      "CONSISTENT_LEFT_MISS", "CONSISTENT_LONG", "CONSISTENT_RIGHT_MISS",
      "CONSISTENT_SHORT", "RANDOM_MISSES",
    ])
  })
})

describe("anglesOf — one source for both routes", () => {
  const RELEASE = {
    elbowAngle: 168, kneeAngle: 172, wristAngle: 78,
    shoulderAngle: 160, hipAngle: 176, releaseAngle: 4,
  }

  it("carries the dip under its own key, never as knee_angle", () => {
    const a = anglesOf({ ...RELEASE, kneeAngleMin: 138 })
    expect(a.knee_angle_min).toBe(138)
    expect(a.knee_angle).toBe(172) // the release knee, untouched
  })

  it("omits the dip entirely on an analysis saved before the column existed", () => {
    expect(anglesOf(RELEASE)).not.toHaveProperty("knee_angle_min")
    expect(anglesOf({ ...RELEASE, kneeAngleMin: null })).not.toHaveProperty("knee_angle_min")
  })

  it("feeds the flaw engine the same verdict the flaws screen shows", () => {
    // The end of the chain the training route was cut out of: a shallow dip
    // must reach a knee drill.
    const shallow = anglesOf({ ...RELEASE, kneeAngleMin: 166 })
    const flaws = detectFlawsFromAngles(shallow).map((f) => f.id)
    expect(flaws).toContain("INSUFFICIENT_KNEE_BEND")
    expect(mapFlawToFocusArea("INSUFFICIENT_KNEE_BEND")).toBe("KNEE_BEND")

    const good = anglesOf({ ...RELEASE, kneeAngleMin: 138 })
    expect(detectFlawsFromAngles(good)).toEqual([])
  })

  it("emits both key conventions, as formAnglesToRecord does", () => {
    const a = anglesOf(RELEASE)
    expect(a.elbow_angle).toBe(168)
    expect(a.right_elbow_angle).toBe(168)
  })
})

describe("getRecommendedDrills", () => {
  it("leads with drills that address the weak area, even when the level has none", () => {
    /* THE DEFECT. HIGH_SCHOOL — every player's default level without a stated
       experience or age — stocks no knee-bend drill at all, so the old sort
       found nothing to promote and returned the level's first three unrelated
       drills as the recommendation. */
    const rec = getRecommendedDrills("HIGH_SCHOOL" as SkillLevel, ["KNEE_BEND"] as DrillFocusArea[], 3)
    expect(rec.length).toBe(3)
    expect(rec[0].focusArea).toBe("KNEE_BEND")
  })

  it("gives two different flaws two different drill lists", () => {
    // The symptom a player would notice: the same three drills whatever was
    // wrong with their shot.
    const knee = getRecommendedDrills("HIGH_SCHOOL" as SkillLevel, ["KNEE_BEND"] as DrillFocusArea[], 3)
    const follow = getRecommendedDrills("HIGH_SCHOOL" as SkillLevel, ["FOLLOW_THROUGH"] as DrillFocusArea[], 3)
    expect(knee.map((d) => d.id)).not.toEqual(follow.map((d) => d.id))
    expect(follow[0].focusArea).toBe("FOLLOW_THROUGH")
  })

  it("prefers the player's own level for a focus area it does stock", () => {
    // COLLEGE has its own knee-bend drill; it must not be passed over for
    // another level's.
    const rec = getRecommendedDrills("COLLEGE" as SkillLevel, ["KNEE_BEND"] as DrillFocusArea[], 1)
    expect(rec[0]).toMatchObject({ focusArea: "KNEE_BEND", level: "COLLEGE" })
  })

  it("ranks the worst area first when several are weak", () => {
    const rec = getRecommendedDrills(
      "HIGH_SCHOOL" as SkillLevel, ["FOLLOW_THROUGH", "KNEE_BEND"] as DrillFocusArea[], 4)
    expect(rec[0].focusArea).toBe("FOLLOW_THROUGH")
    expect(rec.some((d) => d.focusArea === "KNEE_BEND")).toBe(true)
  })

  it("never repeats a drill, and honours the limit", () => {
    const rec = getRecommendedDrills(
      "HIGH_SCHOOL" as SkillLevel, ["KNEE_BEND", "KNEE_BEND"] as DrillFocusArea[], 5)
    expect(rec).toHaveLength(5)
    expect(new Set(rec.map((d) => d.id)).size).toBe(5)
  })

  it("still fills the screen when nothing is wrong", () => {
    const rec = getRecommendedDrills("HIGH_SCHOOL" as SkillLevel, [] as DrillFocusArea[], 3)
    expect(rec).toHaveLength(3)
    expect(rec.every((d) => d.level === "HIGH_SCHOOL")).toBe(true)
  })
})
