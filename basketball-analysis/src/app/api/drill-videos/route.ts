/**
 * API Routes for Drill Video Submissions
 * 
 * POST /api/drill-videos - Save a new drill video submission
 * GET /api/drill-videos - Get all drill video submissions (with optional filters)
 * 
 * These videos are saved to the database and can later be selected
 * by the user to send to the Hybrid System for analysis.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - Save a new drill video submission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      drillId,
      drillName,
      focusArea,
      videoUrl,
      videoBase64,
      videoDuration,
      trimStart,
      trimEnd,
      userProfileId,
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
    
    // Create the drill video submission
    const drillVideo = await prisma.drillVideoSubmission.create({
      data: {
        drillId,
        drillName,
        focusArea: focusArea || 'general',
        videoUrl,
        videoBase64,
        videoDuration: videoDuration ? parseFloat(videoDuration) : null,
        trimStart: trimStart ? parseFloat(trimStart) : null,
        trimEnd: trimEnd ? parseFloat(trimEnd) : null,
        userProfileId: userProfileId || null,
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

// GET - Fetch drill video submissions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Optional filters
    const analyzed = searchParams.get('analyzed')
    const focusArea = searchParams.get('focusArea')
    const userProfileId = searchParams.get('userProfileId')
    const limit = searchParams.get('limit')
    
    // Build where clause
    const where: Record<string, unknown> = {}
    
    if (analyzed !== null) {
      where.analyzed = analyzed === 'true'
    }
    
    if (focusArea) {
      where.focusArea = focusArea
    }
    
    if (userProfileId) {
      where.userProfileId = userProfileId
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
        videoUrl: true,
        videoBase64: true,
        videoDuration: true,
        trimStart: true,
        trimEnd: true,
        analyzed: true,
        analyzedAt: true,
        formScore: true,
        feedback: true,
        improvements: true,
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


