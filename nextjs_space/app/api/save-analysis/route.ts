/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/save-analysis
 * 
 * Save a completed analysis to the database for history tracking.
 */

interface SaveAnalysisRequest {
  userProfileId: string
  
  // Image data
  imageUrl?: string
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
  try {
    const body: SaveAnalysisRequest = await request.json()
    
    if (!body.userProfileId) {
      return NextResponse.json(
        { success: false, error: "userProfileId is required" },
        { status: 400 }
      )
    }

    // Verify user profile exists
    const userProfile = await prisma.userProfile.findUnique({
      where: { id: body.userProfileId },
    })

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "User profile not found" },
        { status: 404 }
      )
    }

    // Create the analysis record
    const analysis = await prisma.userAnalysis.create({
      data: {
        userProfileId: body.userProfileId,
        
        // Image data
        imageUrl: body.imageUrl,
        s3Path: body.s3Path,
        
        // RoboFlow data
        roboflowPoseData: body.roboflowPoseData as any,
        roboflowDetection: body.roboflowDetection as any,
        shootingPhase: body.shootingPhase,
        
        // Angles (convert to Decimal)
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
        annotatedImageUrl: body.annotatedImageUrl,
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
        matchedShooterId: body.matchedShooterId,
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
          userProfileId: body.userProfileId,
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
          userProfileId: body.userProfileId,
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
      message: "Analysis saved successfully",
    })
  } catch (error) {
    console.error("Save analysis error:", error)
    
    // Handle Prisma-specific errors
    if (error instanceof Error && error.message.includes("Foreign key")) {
      return NextResponse.json(
        { success: false, error: "Invalid userProfileId" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to save analysis" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/save-analysis?id=xxx
 * 
 * Get a specific analysis by ID
 */
export async function GET(request: NextRequest) {
  const analysisId = request.nextUrl.searchParams.get("id")

  if (!analysisId) {
    return NextResponse.json(
      { success: false, error: "Analysis ID required" },
      { status: 400 }
    )
  }

  try {
    const analysis = await prisma.userAnalysis.findUnique({
      where: { id: analysisId },
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




