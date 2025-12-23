/**
 * API Routes for Individual Drill Video Operations
 * 
 * GET /api/drill-videos/[id] - Get a specific drill video
 * PATCH /api/drill-videos/[id] - Update drill video (e.g., after analysis)
 * DELETE /api/drill-videos/[id] - Delete a drill video
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Fetch a specific drill video
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    const drillVideo = await prisma.drillVideoSubmission.findUnique({
      where: { id },
    })
    
    if (!drillVideo) {
      return NextResponse.json(
        { error: 'Drill video not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      drillVideo,
    })
    
  } catch (error) {
    console.error('Error fetching drill video:', error)
    return NextResponse.json(
      { error: 'Failed to fetch drill video', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PATCH - Update a drill video (typically after analysis)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const {
      analyzed,
      formScore,
      feedback,
      improvements,
      positives,
      coachingTips,
      detailedFeedback,
      drillSpecific,
      trimStart,
      trimEnd,
      videoUrl,
    } = body
    
    // Build update data
    const updateData: Record<string, unknown> = {}
    
    if (analyzed !== undefined) {
      updateData.analyzed = analyzed
      if (analyzed) {
        updateData.analyzedAt = new Date()
      }
    }
    
    if (formScore !== undefined) {
      updateData.formScore = formScore
    }
    
    if (feedback !== undefined) {
      updateData.feedback = feedback
    }
    
    if (improvements !== undefined) {
      updateData.improvements = improvements
    }
    
    if (positives !== undefined) {
      updateData.positives = positives
    }
    
    if (coachingTips !== undefined) {
      updateData.coachingTips = coachingTips
    }
    
    if (detailedFeedback !== undefined) {
      updateData.detailedFeedback = detailedFeedback
    }
    
    if (drillSpecific !== undefined) {
      updateData.drillSpecific = drillSpecific
    }
    
    if (trimStart !== undefined) {
      updateData.trimStart = parseFloat(trimStart)
    }
    
    if (trimEnd !== undefined) {
      updateData.trimEnd = parseFloat(trimEnd)
    }
    
    if (videoUrl !== undefined) {
      updateData.videoUrl = videoUrl
    }
    
    const drillVideo = await prisma.drillVideoSubmission.update({
      where: { id },
      data: updateData,
    })
    
    return NextResponse.json({
      success: true,
      drillVideo: {
        id: drillVideo.id,
        drillId: drillVideo.drillId,
        drillName: drillVideo.drillName,
        analyzed: drillVideo.analyzed,
        analyzedAt: drillVideo.analyzedAt,
        formScore: drillVideo.formScore,
        feedback: drillVideo.feedback,
        improvements: drillVideo.improvements,
      },
    })
    
  } catch (error) {
    console.error('Error updating drill video:', error)
    return NextResponse.json(
      { error: 'Failed to update drill video', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a drill video
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    await prisma.drillVideoSubmission.delete({
      where: { id },
    })
    
    return NextResponse.json({
      success: true,
      message: 'Drill video deleted successfully',
    })
    
  } catch (error) {
    console.error('Error deleting drill video:', error)
    return NextResponse.json(
      { error: 'Failed to delete drill video', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

