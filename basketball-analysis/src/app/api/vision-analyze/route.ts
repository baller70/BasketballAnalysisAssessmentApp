/**
 * Coach-Centric Vision Analysis API
 *
 * POST /api/vision-analyze
 *
 * This API analyzes drill execution through the lens of a basketball coach,
 * with every piece of feedback built around the drill's coaching points (tips).
 *
 * Vision runs through a provider chain — Anthropic Claude vision first, then
 * OpenAI vision — and falls back to an honest rule-based analysis when no
 * provider is configured or all providers fail.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  generateCoachingPrompt,
  processCoachingResponse,
  generateFallbackAnalysis,
  type CoachAnalysis
} from '@/services/coachingAnalysis'
import { checkRateLimit } from '@/lib/rateLimit'
import { visionAnalyze } from '@/lib/ai/visionAnalyze'

interface VisionAnalysisRequest {
  image: string                  // Base64 encoded image
  drillId: string
  drillName: string
  drillDescription: string
  coachingPoints: string[]       // The tips array - THE KEY TO COACH-CENTRIC ANALYSIS
  focusArea: string
}

export async function POST(request: NextRequest) {
  // Rate limit: 30 vision analyses per minute per IP.
  const { response: limited } = checkRateLimit(request, {
    bucket: 'vision-analyze',
    limit: 30,
    windowMs: 60_000,
  })
  if (limited) return limited

  try {
    const body: VisionAnalysisRequest = await request.json()
    
    const { 
      image, 
      drillId,
      drillName, 
      drillDescription, 
      coachingPoints,
      focusArea 
    } = body
    
    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      )
    }
    
    if (!coachingPoints || coachingPoints.length === 0) {
      return NextResponse.json(
        { error: 'Coaching points are required for analysis' },
        { status: 400 }
      )
    }
    
    // Generate the coach-centric prompt
    const prompt = generateCoachingPrompt(
      drillName,
      drillDescription,
      coachingPoints,
      focusArea
    )

    try {
      // Run the vision provider chain (Anthropic → OpenAI). Returns null when
      // no provider is configured or all providers fail.
      const result = await visionAnalyze(image, undefined, prompt)

      if (!result) {
        // No vision provider available — honest rule-based fallback.
        const fallback = generateFallbackAnalysis(drillId, drillName, coachingPoints, focusArea)
        return NextResponse.json({
          success: true,
          analysis: fallback,
          fallback: true,
          provider: 'rule-based'
        })
      }

      const content = result.text

      // Parse JSON from response
      let rawAnalysis
      try {
        // Extract JSON from the response (might be wrapped in markdown)
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          rawAnalysis = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON in response')
        }
      } catch {
        // If parsing fails, return fallback
        const fallback = generateFallbackAnalysis(drillId, drillName, coachingPoints, focusArea)
        fallback.coachSays = content.slice(0, 500) // Use raw response as coach message
        return NextResponse.json({
          success: true,
          analysis: fallback,
          fallback: true,
          provider: 'rule-based'
        })
      }

      // Process the response into our CoachAnalysis format
      const analysis: CoachAnalysis = processCoachingResponse(
        rawAnalysis,
        drillId,
        drillName,
        coachingPoints,
        focusArea
      )

      return NextResponse.json({
        success: true,
        analysis,
        provider: result.provider // 'claude-vision' | 'openai-vision'
      })

    } catch (apiError) {
      console.error('Vision provider chain error:', apiError)
      // Return fallback analysis on error
      const fallback = generateFallbackAnalysis(drillId, drillName, coachingPoints, focusArea)
      return NextResponse.json({
        success: true,
        analysis: fallback,
        fallback: true,
        provider: 'rule-based',
        error: apiError instanceof Error ? apiError.message : 'API error'
      })
    }

  } catch (error) {
    console.error('Vision analysis error:', error)
    return NextResponse.json(
      { 
        error: 'Vision analysis failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
