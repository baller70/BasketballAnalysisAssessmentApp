import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveProfileId, isError } from "@/lib/auth/currentUser"
import { ALL_ELITE_SHOOTERS } from "@/data/eliteShooters"
import {
  findTopMatches,
  normalizeApiShooters,
  determineAgeGroup,
  type UserPhysicalProfile,
  type UserShootingMetrics,
} from "@/services/comparisonAlgorithm"

/**
 * GET /api/shooters/match — how close YOUR shot is to each of the 328 shooters.
 *
 * THE ELITE SHOOTERS PAGE HAS BEEN SHOWING SIX MADE-UP NUMBERS.
 *
 * `elite-shooters/page.tsx` carries a FEATURED list of six with `overall: 89`,
 * `overall: 85`, `keyMatch: ["Release Time", "+0.01s"]` written into the source,
 * and the other 322 rows carry `overall: null` — nothing at all. So the column
 * headed as a match against your form was a constant for six players and blank
 * for the rest, on an account that had never analysed a shot and on one that had
 * analysed a hundred. That is the screen advertising a feature it does not run.
 *
 * Everything needed to run it for real was already in the repo, unconnected:
 *   - `services/comparisonAlgorithm.ts` — physical / skill / mechanics scoring,
 *     the shared implementation every surface is supposed to rank by
 *   - `data/eliteShooters.ts` — the 328-shooter catalog, also seeded into
 *     Postgres by prisma/seed.ts
 *   - `user_analyses` — the caller's own measured elbow, knee, wrist, release,
 *     shoulder and hip angles, written by every upload and every iOS capture
 *
 * `POST /api/compare-shooters` already wraps the same algorithm and has NO
 * callers anywhere in the web app. This route is the missing read-side: it
 * resolves the caller, reads their most recent analysis that actually carries
 * angles, and scores the whole catalog against it.
 *
 * HONEST WHEN IT CANNOT ANSWER. A player with no analysis gets
 * `matched: false` with a reason, and the page keeps its canonical demo
 * numbers — the empty state stays exactly what it was. Nothing invents a score
 * from a profile alone: without measured mechanics the mechanics term is
 * unanswerable, and a physical-only match dressed up as a form match would be
 * the same lie in a new place.
 */

/** Prisma Decimal arrives as an object/string; take a real number or nothing. */
const num = (v: unknown): number | undefined => {
  if (v == null) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

export async function GET(request: NextRequest) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error
  const userProfileId = resolved.profileId

  try {
    const profile = await prisma.userProfile.findUnique({
      where: { id: userProfileId },
      select: {
        heightInches: true, weightLbs: true, wingspanInches: true,
        bodyType: true, age: true, experienceLevel: true, dominantHand: true,
      },
    })

    // The most recent analysis that carries at least one measured angle. An
    // analysis row can exist with every angle null (a failed or image-only
    // run), and ranking 328 shooters against nothing would produce a confident
    // number with no measurement under it.
    const analysis = await prisma.userAnalysis.findFirst({
      where: {
        userProfileId,
        OR: [
          { elbowAngle: { not: null } }, { kneeAngle: { not: null } },
          { releaseAngle: { not: null } }, { wristAngle: { not: null } },
          { shoulderAngle: { not: null } }, { hipAngle: { not: null } },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, createdAt: true, elbowAngle: true, kneeAngle: true,
        releaseAngle: true, wristAngle: true, shoulderAngle: true, hipAngle: true,
      },
    })

    if (!analysis) {
      return NextResponse.json({
        success: true,
        matched: false,
        reason: "Analyze a shot to see how your form compares.",
        scores: {},
      })
    }

    const metrics: UserShootingMetrics = {
      elbowAngle: num(analysis.elbowAngle),
      kneeAngle: num(analysis.kneeAngle),
      releaseAngle: num(analysis.releaseAngle),
      shoulderTilt: num(analysis.shoulderAngle),
      hipTilt: num(analysis.hipAngle),
      followThroughAngle: num(analysis.wristAngle),
    }

    // Physical inputs fall back to the algorithm's own middle-of-the-road
    // defaults when the player has not filled in a profile. That is a real
    // limitation and it is reported: `usedProfileDefaults` tells the page to
    // say so rather than let a guessed height read as a measured one.
    const heightInches = num(profile?.heightInches)
    const age = num(profile?.age)
    const physical: UserPhysicalProfile = {
      heightInches: heightInches ?? 72,
      weightLbs: num(profile?.weightLbs),
      wingspanInches: num(profile?.wingspanInches),
      age: age ?? 25,
      skillLevel:
        profile?.experienceLevel?.toUpperCase() === "ELITE" ? "ELITE"
        : profile?.experienceLevel?.toUpperCase() === "ADVANCED" ? "ADVANCED"
        : profile?.experienceLevel?.toUpperCase() === "BEGINNER" ? "BEGINNER"
        : "INTERMEDIATE",
      dominantHand: profile?.dominantHand?.toUpperCase() === "LEFT" ? "LEFT" : "RIGHT",
    }

    // The whole catalog, not a top-5: the page draws a row per shooter and each
    // row needs its own score.
    const dataset = normalizeApiShooters(ALL_ELITE_SHOOTERS)
    const ranked = findTopMatches(physical, metrics, dataset.length, dataset)

    const scores: Record<string, { overall: number; rank: number; reason: string | null }> = {}
    for (const m of ranked) {
      scores[m.shooter.name] = {
        overall: Math.round(m.similarityScore.overall),
        rank: m.rank,
        reason: m.matchReasons[0] ?? null,
      }
    }

    /* The closest match, with its portrait. The analysis overview draws an
       ELITE MATCH card with a PHOTOGRAPH beside the name; without the URL here
       the screen would name one shooter and show a picture of another, which
       is worse than the constant it replaced. */
    const best = ranked[0]
    const bestCatalog = best
      ? ALL_ELITE_SHOOTERS.find((s) => s.name === best.shooter.name)
      : undefined

    return NextResponse.json({
      success: true,
      matched: true,
      top: best ? {
        name: best.shooter.name,
        team: bestCatalog?.team ?? null,
        overall: Math.round(best.similarityScore.overall),
        photoUrl: bestCatalog?.photoUrl ?? null,
        reason: best.matchReasons[0] ?? null,
        /* The reference readings the phone's ELITE MATCH card draws beside the
           player's own. These come from the catalog, which is explicit that
           they are TIER-DERIVED ESTIMATES, not frame measurements of that
           shooter — `biomechanicsEstimated` is true for every record and the
           catalog requires callers to say so. `estimated` rides along so the
           card can, exactly as the desktop compare table does. */
        reference: bestCatalog ? {
          releaseAngle: bestCatalog.measurements.releaseAngle,
          elbowAngle: bestCatalog.measurements.elbowAngle,
          entryAngle: bestCatalog.measurements.entryAngle,
        } : null,
        estimated: bestCatalog?.biomechanicsEstimated !== false,
      } : null,
      basedOn: {
        analysisId: analysis.id,
        recordedAt: analysis.createdAt.toISOString(),
        anglesUsed: Object.entries(metrics)
          .filter(([, v]) => v != null)
          .map(([k]) => k),
      },
      usedProfileDefaults: { height: heightInches == null, age: age == null },
      ageGroup: determineAgeGroup(physical.age),
      count: ranked.length,
      scores,
    })
  } catch (error) {
    console.error("Shooter match error:", error)
    return NextResponse.json(
      { success: false, error: "Could not compute shooter matches" },
      { status: 500 }
    )
  }
}
