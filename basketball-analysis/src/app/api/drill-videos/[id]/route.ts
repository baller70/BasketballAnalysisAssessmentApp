/**
 * API Routes for Individual Drill Video Operations
 *
 * GET    /api/drill-videos/[id] - Get a specific drill video (caller-owned)
 * PATCH  /api/drill-videos/[id] - Update drill video (e.g., after analysis)
 * DELETE /api/drill-videos/[id] - Delete a drill video
 *
 * All operations are scoped to the authenticated caller's profile: a user can
 * never read, mutate, or delete another user's submission. Mutations (PATCH /
 * DELETE) are CSRF-protected.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveProfileId, isError } from '@/lib/auth/currentUser'
import { validateCsrf } from '@/lib/csrf'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Fetch a specific drill video (must belong to the caller)
export async function GET(request: NextRequest, { params }: RouteParams) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error
  const userProfileId = resolved.profileId

  try {
    const { id } = await params

    const drillVideo = await prisma.drillVideoSubmission.findFirst({
      where: { id, userProfileId },
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
  const csrfError = validateCsrf(request)
  if (csrfError) return csrfError

  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error
  const userProfileId = resolved.profileId

  try {
    const { id } = await params
    const body = await request.json()

    // Verify ownership before mutating — prevents IDOR on another user's row.
    const existing = await prisma.drillVideoSubmission.findFirst({
      where: { id, userProfileId },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'Drill video not found' },
        { status: 404 }
      )
    }

    const {
      analyzed,
      formScore,
      feedback,
      improvements,
      positives,
      coachingTips,
      detailedFeedback,
      drillSpecific,
      mediaUrl,
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

    // The persisted column is `mediaUrl` (the schema has no `videoUrl` field —
    // writing `videoUrl` previously threw at runtime).
    if (mediaUrl !== undefined) {
      updateData.mediaUrl = mediaUrl
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

// DELETE - Delete a drill video (must belong to the caller)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const csrfError = validateCsrf(request)
  if (csrfError) return csrfError

  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error
  const userProfileId = resolved.profileId

  try {
    const { id } = await params

    // Scope the delete to the caller — deleteMany returns a count, so a
    // non-owned / missing id yields 404 instead of leaking another user's row.
    const result = await prisma.drillVideoSubmission.deleteMany({
      where: { id, userProfileId },
    })

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Drill video not found' },
        { status: 404 }
      )
    }

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
