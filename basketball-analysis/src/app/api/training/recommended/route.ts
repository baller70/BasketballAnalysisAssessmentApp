import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveProfileId, isError } from "@/lib/auth/currentUser"
import { detectFlawsFromAngles } from "@/data/shootingFlawsDatabase"
import {
  getRecommendedDrills,
  mapAgeToLevel,
  mapFlawToFocusArea,
  mapSkillLevelToLevel,
  type Drill,
  type DrillFocusArea,
  type SkillLevel,
} from "@/data/drillDatabase"

/**
 * GET /api/training/recommended — the drills this player actually needs.
 *
 * The training hub's RECOMMENDED FOR YOUR GOAL panel names three drills —
 * "Footwork Into Release", "Elbow Stack Holds", "High Elbow Release" — written
 * into the page. It is headed FOR YOUR GOAL and has never read a goal, an
 * analysis, or a flaw. Every account sees the same three, and a player who has
 * never shot a ball is recommended the same work as one with a hundred sessions
 * and a measured elbow flare.
 *
 * The selection engine has been in the repo the whole time and has no caller:
 *
 *   - `getRecommendedDrills(level, weakAreas, limit)` ranks the 51-drill
 *     catalogue, putting the player's weak focus areas first
 *   - `mapFlawToFocusArea(flawId)` turns a detected flaw into the focus area
 *     that trains it out
 *   - `mapAgeToLevel` / `mapSkillLevelToLevel` pick the level band
 *
 * This joins them to the player's own data: their stored angles run through the
 * same flaw rules /api/analysis/flaws uses, the resulting flaws become weak
 * areas, and the catalogue is ranked against them.
 *
 * WHAT IT WILL NOT DO. With no analysis there are no weak areas, and a "for
 * your goal" list built from nothing is the defect being removed rather than a
 * fix for it. In that case it returns `personalised: false` with a reason and
 * the page keeps its canonical three. A level derived from a default rather
 * than a stated one is reported through `levelSource` for the same reason.
 */

/** The loosely-keyed record the flaw rules read, from one stored analysis. */
function anglesOf(row: {
  elbowAngle: unknown; kneeAngle: unknown; wristAngle: unknown
  shoulderAngle: unknown; hipAngle: unknown; releaseAngle: unknown
}): Record<string, number> {
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
  return out
}

/** Minutes as the screen writes them: "5:30", not "5 min". */
const clock = (minutes: number) =>
  `${Math.floor(minutes)}:${String(Math.round((minutes % 1) * 60)).padStart(2, "0")}`

/** The catalogue's SCREAMING_SNAKE focus areas, in the screen's wording. */
const focusLabel = (f: DrillFocusArea): string =>
  f.split("_").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ")

const levelLabel = (l: SkillLevel): string =>
  l === "ELEMENTARY" ? "Beginner"
  : l === "MIDDLE_SCHOOL" ? "Intermediate"
  : l === "HIGH_SCHOOL" ? "Advanced"
  : l === "COLLEGE" ? "Advanced" : "Elite"

function shape(d: Drill, why: string | null) {
  return {
    id: d.id,
    title: d.title,
    len: clock(d.duration),
    time: clock(d.duration),
    level: levelLabel(d.level),
    focus: focusLabel(d.focusArea),
    desc: d.description,
    /** The flaw this drill was picked for, or null when it is level-matched
     *  filler rather than an answer to something measured. */
    why,
  }
}

export async function GET(request: NextRequest) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error

  const { searchParams } = new URL(request.url)
  const limit = Math.min(12, Math.max(1, Number(searchParams.get("limit")) || 3))

  try {
    const [profile, rows] = await Promise.all([
      prisma.userProfile.findUnique({
        where: { id: resolved.profileId },
        select: { age: true, experienceLevel: true, primaryGoal: true },
      }),
      prisma.userAnalysis.findMany({
        where: { userProfileId: resolved.profileId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          elbowAngle: true, kneeAngle: true, wristAngle: true,
          shoulderAngle: true, hipAngle: true, releaseAngle: true,
        },
      }),
    ])

    /* The level band. A stated experience level wins over an age-derived one,
       and the caller is told which it got — recommending PROFESSIONAL drills
       off a defaulted level would be a guess wearing a measurement's clothes. */
    const stated = profile?.experienceLevel
    const level: SkillLevel = stated
      ? mapSkillLevelToLevel(stated)
      : profile?.age != null
        ? mapAgeToLevel(profile.age)
        : "HIGH_SCHOOL"
    const levelSource = stated ? "experience" : profile?.age != null ? "age" : "default"

    /* Weak areas, from the player's own shots. A flaw seen on more of their
       shots outranks one seen on fewer, so the drill list leads with the thing
       that goes wrong most often. */
    const hits = new Map<DrillFocusArea, number>()
    const flawNames = new Map<DrillFocusArea, string>()
    let evaluated = 0
    for (const row of rows) {
      const angles = anglesOf(row)
      if (Object.keys(angles).length === 0) continue
      evaluated += 1
      for (const flaw of detectFlawsFromAngles(angles)) {
        const area = mapFlawToFocusArea(flaw.id)
        hits.set(area, (hits.get(area) ?? 0) + 1)
        if (!flawNames.has(area)) flawNames.set(area, flaw.name)
      }
    }
    const weakAreas = [...hits.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([area]) => area)

    if (weakAreas.length === 0) {
      return NextResponse.json({
        success: true,
        personalised: false,
        reason: evaluated
          ? "No flaws detected in your shots yet, so there is nothing specific to train out."
          : "Analyze a shot and these become the drills for what it finds.",
        analysed: evaluated,
        level, levelSource,
        primaryGoal: profile?.primaryGoal ?? null,
        drills: [],
      })
    }

    const picked = getRecommendedDrills(level, weakAreas, limit)
    return NextResponse.json({
      success: true,
      personalised: true,
      analysed: evaluated,
      level, levelSource,
      primaryGoal: profile?.primaryGoal ?? null,
      /** What the ranking was built from, so the screen can say why. */
      weakAreas: weakAreas.map((a) => ({
        focus: focusLabel(a), flaw: flawNames.get(a) ?? null, shots: hits.get(a) ?? 0,
      })),
      drills: picked.map((d) =>
        shape(d, weakAreas.includes(d.focusArea) ? flawNames.get(d.focusArea) ?? null : null)),
    })
  } catch (error) {
    console.error("Recommended drills error:", error)
    return NextResponse.json(
      { success: false, error: "Could not build your drill recommendations" },
      { status: 500 }
    )
  }
}
