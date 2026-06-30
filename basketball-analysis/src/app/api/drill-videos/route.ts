/**
 * API Routes for Drill Video Submissions
 *
 * POST /api/drill-videos - Save a new drill video submission
 * GET  /api/drill-videos - Get the caller's drill video submissions (with filters)
 *
 * These videos are persisted to Postgres (source of truth) and can later be
 * selected by the user to send to the Hybrid System for analysis.
 *
 * Auth: the owning profile is ALWAYS derived from the session token via
 * resolveProfileId — never from the request body — so a user can only read or
 * write their own submissions. Writes are CSRF-protected (double-submit cookie).
 *
 * Media: when the client sends raw `videoBase64` (the legacy format that was
 * previously dropped on the floor), the server now uploads the bytes to object
 * storage via uploadMedia and persists the resulting URL. Previously only a
 * pre-existing `videoUrl` survived and base64 uploads were silently lost.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveProfileId, isError } from '@/lib/auth/currentUser'
import { validateCsrf } from '@/lib/csrf'
import { uploadMedia } from '@/lib/storage'

// POST - Save a new drill video submission
export async function POST(request: NextRequest) {
  const csrfError = validateCsrf(request)
  if (csrfError) return csrfError

  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error
  const userProfileId = resolved.profileId

  try {
    const body = await request.json()

    const {
      drillId,
      drillName,
      focusArea,
      videoUrl,
      videoBase64,
      videoDuration,
    } = body

    // Validate required fields
    if (!drillId || !drillName) {
      return NextResponse.json(
        { error: 'drillId and drillName are required' },
        { status: 400 }
      )
    }

    // At least one video source is required
    if (!videoUrl && !videoBase64) {
      return NextResponse.json(
        { error: 'Either videoUrl or videoBase64 is required' },
        { status: 400 }
      )
    }

    // Persist the uploaded video bytes to object storage. Previously the base64
    // payload was accepted by the API but never stored — only a pre-supplied
    // videoUrl was saved — so client-recorded drills vanished. Upload first,
    // fall back to any provided videoUrl if upload fails.
    let mediaUrl: string | null = videoUrl || null
    if (videoBase64) {
      try {
        mediaUrl = await uploadMedia(
          videoBase64,
          `user-uploads/${userProfileId}/drills/${Date.now()}-${drillId}.mp4`,
          'video/mp4'
        )
      } catch (e) {
        console.error('drill-videos: video upload failed, keeping videoUrl', e)
        if (!mediaUrl) {
          return NextResponse.json(
            { error: 'Failed to store drill video' },
            { status: 502 }
          )
        }
      }
    }

    // Create the drill video submission
    const drillVideo = await prisma.drillVideoSubmission.create({
      data: {
        drillId,
        drillName,
        focusArea: focusArea || 'general',
        mediaUrl,
        mediaType: 'video',
        videoDuration: videoDuration ? parseFloat(videoDuration) : null,
        userProfileId,
        analyzed: false,
      },
    })

    return NextResponse.json({
      success: true,
      drillVideo: {
        id: drillVideo.id,
        drillId: drillVideo.drillId,
        drillName: drillVideo.drillName,
        focusArea: drillVideo.focusArea,
        mediaUrl: drillVideo.mediaUrl,
        videoDuration: drillVideo.videoDuration,
        analyzed: drillVideo.analyzed,
        createdAt: drillVideo.createdAt,
      },
    })

  } catch (error) {
    console.error('Error saving drill video:', error)
    return NextResponse.json(
      { error: 'Failed to save drill video', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET - Fetch the caller's drill video submissions
export async function GET(request: NextRequest) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error
  const userProfileId = resolved.profileId

  try {
    const { searchParams } = new URL(request.url)

    // Optional filters (always scoped to the caller — never trust a userId param)
    const analyzed = searchParams.get('analyzed')
    const focusArea = searchParams.get('focusArea')
    const limit = searchParams.get('limit')

    const where: Record<string, unknown> = { userProfileId }

    if (analyzed !== null) {
      where.analyzed = analyzed === 'true'
    }

    if (focusArea) {
      where.focusArea = focusArea
    }

    // Fetch drill videos
    const drillVideos = await prisma.drillVideoSubmission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit) : 50,
      select: {
        id: true,
        drillId: true,
        drillName: true,
        focusArea: true,
        mediaType: true,
        mediaUrl: true,
        thumbnailUrl: true,
        videoDuration: true,
        workoutId: true,
        workoutName: true,
        workoutDate: true,
        analyzed: true,
        analyzedAt: true,
        analysisType: true,
        overallGrade: true,
        gradeDescription: true,
        isCorrectDrill: true,
        wrongDrillMessage: true,
        coachSays: true,
        coachAnalysis: true,
        formScore: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      drillVideos,
      count: drillVideos.length,
    })

  } catch (error) {
    console.error('Error fetching drill videos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch drill videos', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
