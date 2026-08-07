import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveProfileId, isError } from "@/lib/auth/currentUser"
import { toShotIQAnalysisResult } from "@/lib/analysis/resultContract"

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

export async function GET(request: NextRequest) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error

  try {
    const row = await prisma.userAnalysis.findFirst({
      where: { userProfileId: resolved.profileId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, createdAt: true, mediaType: true, overallScore: true,
        formScore: true, balanceScore: true, releaseScore: true,
        consistencyScore: true, shootingPhase: true, coachingNotes: true,
        clientSessionId: true, captureSessionId: true,
        imageUrl: true, annotatedImageUrl: true, videoUrl: true,
        elbowAngle: true, kneeAngle: true, wristAngle: true,
        shoulderAngle: true, hipAngle: true, releaseAngle: true,
        kneeAngleMin: true,
        releaseHeightInches: true, releaseDistanceInches: true,
        verticalJumpInches: true, centerlineDeviationDeg: true,
        roboflowPoseData: true, roboflowDetection: true, visualOverlays: true,
        strengths: true, improvements: true, drills: true,
        matchedShooterId: true, matchConfidence: true, similarShooters: true,
      },
    })

    if (!row) {
      return NextResponse.json({ success: true, analysis: null, analysisResult: null })
    }

    const result = toShotIQAnalysisResult(row)
    const legacy = {
        id: result.id,
        recordedAt: result.recordedAt,
        mediaType: result.media.type,
        overallScore: result.scores.overall.value,
        shootingPhase: result.phase.value,
        coachingNotes: result.feedback.coachingNotes,
        source: result.source === "ios" ? "iOS Capture" : result.source === "web" ? "Web Upload" : "Unknown",
        imageUrl: result.media.displayImageUrl,
        angles: {
          elbow: result.angles.elbow.value,
          knee: result.angles.knee.value,
          wrist: result.angles.wrist.value,
          shoulder: result.angles.shoulder.value,
          hip: result.angles.hip.value,
          release: result.angles.release.value,
        },
        measured: result.provenance.measured
          .filter((key) => key.startsWith("angles."))
          .map((key) => key.replace("angles.", "")),
        measurements: {
          releaseHeightInches: result.measurements.releaseHeightInches.value,
          releaseDistanceInches: result.measurements.releaseDistanceInches.value,
          verticalJumpInches: result.measurements.verticalJumpInches.value,
          centerlineDeviationDeg: result.measurements.centerlineDeviationDeg.value,
        },
        measurementsPresent: result.provenance.measured
          .filter((key) => key.startsWith("measurements."))
          .map((key) => key.replace("measurements.", "")),
        strengths: result.feedback.strengths,
        improvements: result.feedback.improvements,
      }
    return NextResponse.json({
      success: true,
      analysis: legacy,
      analysisResult: result,
    })
  } catch (error) {
    console.error("Latest analysis error:", error)
    return NextResponse.json(
      { success: false, error: "Could not read the latest analysis" },
      { status: 500 }
    )
  }
}
