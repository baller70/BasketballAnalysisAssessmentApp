/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveProfileId, isError } from "@/lib/auth/currentUser"
import { uploadMedia } from "@/lib/storage"

/**
 * POST /api/save-analysis
 *
 * Canonical persistence path for a completed shot analysis. Writes a
 * UserAnalysis row (plus an AnalysisHistory snapshot for progress tracking) to
 * Postgres. Previously the web app only wrote to localStorage (20-session cap),
 * so analyses never reached the DB — this route closes that split-brain.
 *
 * Auth: the owning profile is derived from the session token via
 * resolveProfileId, never from the request body, so a user can only ever write
 * to their own history.
 */

interface SaveAnalysisRequest {
  // Image data — pass either a ready URL/path, OR base64 `imageData` to have the
  // server upload it to object storage and persist the resulting URL.
  imageUrl?: string
  imageData?: string        // base64 / data-URL of the raw shot frame
  annotatedImageData?: string // base64 / data-URL of the annotated frame
  s3Path?: string

  // RoboFlow data
  roboflowPoseData?: Record<string, unknown>
  roboflowDetection?: Record<string, unknown>
  shootingPhase?: string

  // Calculated angles
  elbowAngle?: number
  kneeAngle?: number
  wristAngle?: number
  shoulderAngle?: number
  hipAngle?: number
  releaseAngle?: number

  // Vision AI analysis
  visionAnalysis?: Record<string, unknown>
  bodyPositions?: Record<string, unknown>

  // Visual enhancements
  annotatedImageUrl?: string
  annotatedS3Path?: string
  visualOverlays?: Record<string, unknown>

  // Scores
  overallScore?: number
  formScore?: number
  balanceScore?: number
  releaseScore?: number
  consistencyScore?: number

  // Feedback
  strengths?: string[]
  improvements?: string[]
  drills?: Array<{ name: string; purpose: string; reps: string }>
  coachingNotes?: string

  // Professional comparison
  matchedShooterId?: number
  matchConfidence?: number
  similarShooters?: Array<{ id: number; name: string; similarity: number }>
}

export async function POST(request: NextRequest) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error
  const userProfileId = resolved.profileId

  try {
    const body: SaveAnalysisRequest = await request.json()

    // Optionally upload raw base64 media to object storage so it is no longer
    // trapped in localStorage. Falls back to any provided imageUrl on failure.
    let imageUrl = body.imageUrl
    if (body.imageData) {
      try {
        imageUrl = await uploadMedia(
          body.imageData,
          `user-uploads/${userProfileId}/${Date.now()}-shot.jpg`,
          "image/jpeg"
        )
      } catch (e) {
        console.error("save-analysis: image upload failed, keeping imageUrl", e)
      }
    }

    let annotatedImageUrl = body.annotatedImageUrl
    if (body.annotatedImageData) {
      try {
        annotatedImageUrl = await uploadMedia(
          body.annotatedImageData,
          `user-uploads/${userProfileId}/${Date.now()}-annotated.jpg`,
          "image/jpeg"
        )
      } catch (e) {
        console.error("save-analysis: annotated upload failed", e)
      }
    }

    // Only attach a matchedShooterId that actually exists — the column is now a
    // real FK (onDelete SetNull), so a stale id would otherwise reject the insert.
    let matchedShooterId: number | undefined = undefined
    if (typeof body.matchedShooterId === "number") {
      const shooter = await prisma.shooter.findUnique({
        where: { id: body.matchedShooterId },
        select: { id: true },
      })
      matchedShooterId = shooter?.id
    }

    // Create the analysis record
    const analysis = await prisma.userAnalysis.create({
      data: {
        userProfileId,

        // Image data
        imageUrl,
        s3Path: body.s3Path,

        // RoboFlow data
        roboflowPoseData: body.roboflowPoseData as any,
        roboflowDetection: body.roboflowDetection as any,
        shootingPhase: body.shootingPhase,

        // Angles
        elbowAngle: body.elbowAngle,
        kneeAngle: body.kneeAngle,
        wristAngle: body.wristAngle,
        shoulderAngle: body.shoulderAngle,
        hipAngle: body.hipAngle,
        releaseAngle: body.releaseAngle,

        // Vision analysis
        visionAnalysis: body.visionAnalysis as any,
        bodyPositions: body.bodyPositions as any,

        // Visual enhancements
        annotatedImageUrl,
        annotatedS3Path: body.annotatedS3Path,
        visualOverlays: body.visualOverlays as any,

        // Scores
        overallScore: body.overallScore,
        formScore: body.formScore,
        balanceScore: body.balanceScore,
        releaseScore: body.releaseScore,
        consistencyScore: body.consistencyScore,

        // Feedback
        strengths: body.strengths as any,
        improvements: body.improvements as any,
        drills: body.drills as any,
        coachingNotes: body.coachingNotes,

        // Professional comparison
        matchedShooterId,
        matchConfidence: body.matchConfidence,
        similarShooters: body.similarShooters as any,

        // Set processing status
        processingStatus: "completed",
      },
    })

    // Create history entry for progress tracking
    if (body.overallScore !== undefined) {
      // Get previous analysis to calculate score change
      const previousAnalysis = await prisma.userAnalysis.findFirst({
        where: {
          userProfileId,
          id: { not: analysis.id },
          overallScore: { not: null },
        },
        orderBy: { createdAt: "desc" },
      })

      const scoreChange = previousAnalysis?.overallScore
        ? body.overallScore - Number(previousAnalysis.overallScore)
        : null

      await prisma.analysisHistory.create({
        data: {
          userProfileId,
          analysisId: analysis.id,
          overallScore: body.overallScore,
          formScore: body.formScore,
          balanceScore: body.balanceScore,
          releaseScore: body.releaseScore,
          consistencyScore: body.consistencyScore,
          scoreChange,
          elbowAngle: body.elbowAngle,
          kneeAngle: body.kneeAngle,
          releaseAngle: body.releaseAngle,
        },
      })
    }

    return NextResponse.json({
      success: true,
      analysisId: analysis.id,
      imageUrl,
      annotatedImageUrl,
      message: "Analysis saved successfully",
    })
  } catch (error) {
    console.error("Save analysis error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to save analysis" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/save-analysis?id=xxx
 *
 * Get one of the caller's own analyses by ID.
 */
export async function GET(request: NextRequest) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error
  const userProfileId = resolved.profileId

  const analysisId = request.nextUrl.searchParams.get("id")

  if (!analysisId) {
    return NextResponse.json(
      { success: false, error: "Analysis ID required" },
      { status: 400 }
    )
  }

  try {
    const analysis = await prisma.userAnalysis.findFirst({
      where: { id: analysisId, userProfileId },
      include: {
        userProfile: {
          select: {
            heightInches: true,
            bodyType: true,
            experienceLevel: true,
            coachingTier: true,
          },
        },
      },
    })

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: "Analysis not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      analysis,
    })
  } catch (error) {
    console.error("Get analysis error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to retrieve analysis" },
      { status: 500 }
    )
  }
}
