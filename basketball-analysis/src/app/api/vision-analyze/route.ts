/**
 * Coach-Centric Vision Analysis API
 * 
 * POST /api/vision-analyze
 * 
 * This API uses OpenAI GPT-4 Vision to analyze drill execution
 * through the lens of a basketball coach. Every piece of feedback
 * is built around the drill's coaching points (tips).
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { 
  generateCoachingPrompt, 
  processCoachingResponse,
  generateFallbackAnalysis,
  type CoachAnalysis 
} from '@/services/coachingAnalysis'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface VisionAnalysisRequest {
  image: string                  // Base64 encoded image
  drillId: string
  drillName: string
  drillDescription: string
  coachingPoints: string[]       // The tips array - THE KEY TO COACH-CENTRIC ANALYSIS
  focusArea: string
}

export async function POST(request: NextRequest) {
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
    
    if (!process.env.OPENAI_API_KEY) {
      // Return fallback analysis if no API key
      const fallback = generateFallbackAnalysis(drillId, drillName, coachingPoints, focusArea)
      return NextResponse.json({
        success: true,
        analysis: fallback,
        fallback: true
      })
    }
    
    // Generate the coach-centric prompt
    const prompt = generateCoachingPrompt(
      drillName,
      drillDescription,
      coachingPoints,
      focusArea
    )
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      })
      
      const content = response.choices?.[0]?.message?.content
      
      if (!content) {
        throw new Error('No response from Vision AI')
      }
      
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
          fallback: true
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
        analysis
      })
      
    } catch (apiError) {
      console.error('OpenAI API error:', apiError)
      // Return fallback analysis on API error
      const fallback = generateFallbackAnalysis(drillId, drillName, coachingPoints, focusArea)
      return NextResponse.json({
        success: true,
        analysis: fallback,
        fallback: true,
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
