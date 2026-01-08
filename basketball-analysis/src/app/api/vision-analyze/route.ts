/**
 * Coach-Centric Vision Analysis API
 * 
 * POST /api/vision-analyze
 * 
 * This API uses Google Gemini Vision (FREE) to analyze drill execution
 * through the lens of a basketball coach. Every piece of feedback
 * is built around the drill's coaching points (tips).
 * 
 * Updated to use Gemini Vision instead of OpenAI GPT-4 Vision for cost savings.
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  generateCoachingPrompt, 
  processCoachingResponse,
  generateFallbackAnalysis,
  type CoachAnalysis 
} from '@/services/coachingAnalysis'

interface VisionAnalysisRequest {
  image: string                  // Base64 encoded image
  drillId: string
  drillName: string
  drillDescription: string
  coachingPoints: string[]       // The tips array - THE KEY TO COACH-CENTRIC ANALYSIS
  focusArea: string
}

/**
 * Analyze image using Google Gemini Vision (FREE)
 */
async function analyzeWithGeminiVision(
  imageBase64: string,
  prompt: string
): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not configured');

  // Prepare the image data - remove data URL prefix if present
  let imageData = imageBase64;
  let mimeType = 'image/jpeg';
  
  if (imageBase64.startsWith('data:')) {
    const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      mimeType = matches[1];
      imageData = matches[2];
    }
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: imageData,
                },
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 2000,
          temperature: 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini Vision error: ${error}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) throw new Error('No content in Gemini Vision response');

  return content;
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
    
    if (!process.env.GOOGLE_AI_API_KEY) {
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
      const content = await analyzeWithGeminiVision(image, prompt);
      
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
        analysis,
        provider: 'gemini-vision' // Track which provider was used
      })
      
    } catch (apiError) {
      console.error('Gemini Vision API error:', apiError)
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
