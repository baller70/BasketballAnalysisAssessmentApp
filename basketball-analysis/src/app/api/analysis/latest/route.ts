import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveProfileId, isError } from "@/lib/auth/currentUser"

/**
 * GET /api/analysis/latest — the caller's most recent analysis, with its angles.
 *
 * The results tabs each paint a table of mechanics — biomechanics' KEY
 * MEASUREMENTS, flaws, compare — and every one of them is a constant. The
 * biomechanics table is the plainest case: it renders
 * `hasData ? "92°" : "—"`, so an account with a single real analysis is shown
 * "Elbow Angle 92°" no matter what its elbow actually measured, and the screen
 * headed KEY MEASUREMENTS has never measured anything.
 *
 * There was no endpoint to fix that with. `/api/save-analysis` reads one
 * analysis BY ID, `/api/media` lists rows without their angles, and
 * `/api/analysis-history` projects scores and shot counts. This returns the one
 * row those screens actually want.
 *
 * `measured` is the point of the shape: it names which angles the pipeline
 * genuinely produced for this shot. A screen can then print what was measured
 * and say "not measured" for the rest, instead of filling the gap with a
 * plausible number — which is the defect being removed, not a new place to
 * repeat it. Release height, release distance, vertical jump and centreline
 * deviation are NOT produced by this pipeline at all; a caller that wants them
 * gets nothing back and must say so.
 */

const num = (v: unknown): number | null => {
  if (v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export async function GET(request: NextRequest) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error

  try {
    const row = await prisma.userAnalysis.findFirst({
      where: { userProfileId: resolved.profileId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, createdAt: true, mediaType: true, overallScore: true,
        shootingPhase: true, coachingNotes: true, clientSessionId: true,
        imageUrl: true, annotatedImageUrl: true,
        elbowAngle: true, kneeAngle: true, wristAngle: true,
        shoulderAngle: true, hipAngle: true, releaseAngle: true,
        releaseHeightInches: true, releaseDistanceInches: true,
        verticalJumpInches: true, centerlineDeviationDeg: true,
        strengths: true, improvements: true,
      },
    })

    if (!row) {
      return NextResponse.json({ success: true, analysis: null })
    }

    const angles = {
      elbow: num(row.elbowAngle),
      knee: num(row.kneeAngle),
      wrist: num(row.wristAngle),
      shoulder: num(row.shoulderAngle),
      hip: num(row.hipAngle),
      release: num(row.releaseAngle),
    }

    /* The four derived KEY MEASUREMENTS. Kept apart from `angles` because they
       are a different kind of quantity — three lengths in inches and one angle
       in degrees, each of which can be absent for its own reason — and because
       a screen needs to know which it may print. */
    const measurements = {
      releaseHeightInches: num(row.releaseHeightInches),
      releaseDistanceInches: num(row.releaseDistanceInches),
      verticalJumpInches: num(row.verticalJumpInches),
      centerlineDeviationDeg: num(row.centerlineDeviationDeg),
    }

    return NextResponse.json({
      success: true,
      analysis: {
        id: row.id,
        recordedAt: row.createdAt.toISOString(),
        mediaType: row.mediaType,
        overallScore: num(row.overallScore),
        shootingPhase: row.shootingPhase,
        coachingNotes: row.coachingNotes,
        source: row.clientSessionId?.startsWith("ios-") ? "iOS Capture" : "Web Upload",
        imageUrl: row.annotatedImageUrl || row.imageUrl || null,
        angles,
        /** Exactly the angles this shot really carries — the caller's licence
         *  to print a number, and its instruction to print nothing otherwise. */
        measured: Object.entries(angles).filter(([, v]) => v != null).map(([k]) => k),
        measurements,
        measurementsPresent: Object.entries(measurements)
          .filter(([, v]) => v != null).map(([k]) => k),
        strengths: Array.isArray(row.strengths) ? row.strengths : [],
        improvements: Array.isArray(row.improvements) ? row.improvements : [],
      },
    })
  } catch (error) {
    console.error("Latest analysis error:", error)
    return NextResponse.json(
      { success: false, error: "Could not read the latest analysis" },
      { status: 500 }
    )
  }
}
