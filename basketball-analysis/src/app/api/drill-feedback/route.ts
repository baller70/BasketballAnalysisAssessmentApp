/**
 * Drill Feedback API
 * 
 * POST /api/drill-feedback - Save drill feedback from workout
 * GET /api/drill-feedback - Get all saved drill feedback
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - Save drill feedback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      drillId,
      drillName,
      focusArea,
      mediaType,
      mediaUrl,
      thumbnailUrl,
      workoutId,
      workoutName,
      workoutDate,
      analysisType,
      coachAnalysis
    } = body
    
    if (!drillId || !drillName) {
      return NextResponse.json(
        { error: 'drillId and drillName are required' },
        { status: 400 }
      )
    }
    
    // Extract key fields from coachAnalysis for easier querying
    const overallGrade = coachAnalysis?.overallGrade || null
    const gradeDescription = coachAnalysis?.gradeDescription || null
    const isCorrectDrill = coachAnalysis?.isCorrectDrill ?? true
    const wrongDrillMessage = coachAnalysis?.wrongDrillMessage || null
    const whatISee = coachAnalysis?.whatISee || null
    const coachSays = coachAnalysis?.coachSays || null
    const priorityFocus = coachAnalysis?.priorityFocus || {}
    
    const submission = await prisma.drillVideoSubmission.create({
      data: {
        drillId,
        drillName,
        focusArea,
        mediaType,
        mediaUrl,
        thumbnailUrl,
        workoutId,
        workoutName,
        workoutDate: workoutDate ? new Date(workoutDate) : null,
        analyzed: true,
        analyzedAt: new Date(),
        analysisType,
        overallGrade,
        gradeDescription,
        isCorrectDrill,
        wrongDrillMessage,
        whatISee,
        coachSays,
        priorityIssue: priorityFocus.issue || null,
        priorityWhy: priorityFocus.why || null,
        priorityHowToFix: priorityFocus.howToFix || null,
        priorityCue: priorityFocus.cue || null,
        coachAnalysis: coachAnalysis || null,
        drillSpecific: true
      }
    })
    
    return NextResponse.json({
      success: true,
      submission
    })
    
  } catch (error) {
    console.error('Error saving drill feedback:', error)
    return NextResponse.json(
      { error: 'Failed to save drill feedback', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET - Fetch all drill feedback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mediaType = searchParams.get('mediaType') // 'video', 'image', or null for all
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    const where: { analyzed: boolean; mediaType?: string } = {
      analyzed: true
    }
    
    if (mediaType) {
      where.mediaType = mediaType
    }
    
    const [submissions, total] = await Promise.all([
      prisma.drillVideoSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          drillId: true,
          drillName: true,
          focusArea: true,
          mediaType: true,
          mediaUrl: true,
          thumbnailUrl: true,
          workoutId: true,
          workoutName: true,
          workoutDate: true,
          analyzed: true,
          analyzedAt: true,
          analysisType: true,
          overallGrade: true,
          gradeDescription: true,
          isCorrectDrill: true,
          coachSays: true,
          coachAnalysis: true,
          createdAt: true
        }
      }),
      prisma.drillVideoSubmission.count({ where })
    ])
    
    return NextResponse.json({
      success: true,
      submissions,
      total,
      limit,
      offset
    })
    
  } catch (error) {
    console.error('Error fetching drill feedback:', error)
    return NextResponse.json(
      { error: 'Failed to fetch drill feedback', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

