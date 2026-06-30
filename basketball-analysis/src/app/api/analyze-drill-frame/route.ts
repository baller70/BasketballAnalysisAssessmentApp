/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * API Route for Vision-based Drill Frame Analysis
 * 
 * POST /api/analyze-drill-frame
 * 
 * Analyzes a single frame from a drill video using Google Gemini Vision (FREE)
 * to provide quick coaching feedback.
 * 
 * Updated to use Gemini Vision instead of OpenAI GPT-4 Vision for cost savings.
 */

import { NextRequest, NextResponse } from 'next/server'

// Google AI API key for Gemini Vision
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY

interface DrillAnalysisRequest {
  image: string // Base64 encoded image
  drillId: string
  drillName: string
  drillDescription: string
  drillTips: string[]
  focusArea: string
  correctFormCriteria: string[]
  commonMistakes: string[]
}

export async function POST(request: NextRequest) {
  try {
    const body: DrillAnalysisRequest = await request.json()
    
    const {
      image,
      drillName,
      drillDescription,
      drillTips,
      focusArea,
      correctFormCriteria,
      commonMistakes,
    } = body
    
    // Validate required fields
    if (!image || !drillName) {
      return NextResponse.json(
        { error: 'Image and drillName are required' },
        { status: 400 }
      )
    }
    
    // If Google AI API key is available, use Gemini Vision
    if (GOOGLE_AI_API_KEY) {
      try {
        const visionAnalysis = await analyzeWithGeminiVision(
          image,
          drillName,
          drillDescription,
          focusArea,
          correctFormCriteria,
          commonMistakes
        )
        
        return NextResponse.json({
          success: true,
          ...visionAnalysis,
          analysisType: 'gemini-vision'
        })
      } catch (visionError) {
        console.error('Gemini Vision API error, falling back to rule-based:', visionError)
      }
    }
    
    // Fallback: Rule-based analysis
    const ruleBasedAnalysis = generateRuleBasedAnalysis(
      drillName,
      drillDescription,
      drillTips,
      focusArea,
      correctFormCriteria,
      commonMistakes
    )
    
    return NextResponse.json({
      success: true,
      ...ruleBasedAnalysis,
      analysisType: 'rule-based'
    })
    
  } catch (error) {
    console.error('Error analyzing drill frame:', error)
    return NextResponse.json(
      { error: 'Failed to analyze drill frame', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Analyze image using Google Gemini Vision (FREE)
async function analyzeWithGeminiVision(
  imageBase64: string,
  drillName: string,
  drillDescription: string,
  focusArea: string,
  correctFormCriteria: string[],
  commonMistakes: string[]
) {
  const prompt = `You are an expert basketball shooting coach analyzing a frame from a "${drillName}" drill video.

DRILL DESCRIPTION: ${drillDescription}

FOCUS AREA: ${focusArea}

WHAT CORRECT FORM LOOKS LIKE:
${correctFormCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

COMMON MISTAKES TO LOOK FOR:
${commonMistakes.map((m, i) => `${i + 1}. ${m}`).join('\n')}

Analyze the image and provide:
1. A form score from 0-100
2. 2-3 things the player is doing well (positives)
3. 2-3 areas for improvement
4. 2-3 specific coaching tips

Respond in JSON format:
{
  "formScore": number,
  "positives": ["string", "string"],
  "improvements": ["string", "string"],
  "coachingTips": ["string", "string"],
  "detailedFeedback": "A brief paragraph summarizing the analysis"
}`

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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_AI_API_KEY}`,
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
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      }),
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini Vision API error: ${error}`)
  }
  
  const data = await response.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text
  
  if (!content) {
    throw new Error('No response from Gemini Vision API')
  }
  
  // Parse JSON from response
  try {
    // Extract JSON from the response (it might be wrapped in markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    throw new Error('No JSON found in response')
  } catch {
    // If JSON parsing fails, create structured response from text
    return {
      formScore: null,
      scored: false,
      positives: ['Good effort on the drill', 'Showing proper dedication'],
      improvements: ['Continue focusing on form', 'Practice consistency'],
      coachingTips: ['Watch tutorial videos for reference', 'Practice in front of a mirror'],
      detailedFeedback: content.slice(0, 500)
    }
  }
}

// Generate rule-based analysis when vision API is unavailable
function generateRuleBasedAnalysis(
  drillName: string,
  drillDescription: string,
  drillTips: string[],
  focusArea: string,
  correctFormCriteria: string[],
  commonMistakes: string[]
) {
  // Select positives from correct form criteria
  const positives = correctFormCriteria.length > 0
    ? correctFormCriteria.slice(0, 2).map(c => `Working on: ${c}`)
    : [
        `Good effort on the ${drillName} drill`,
        'Showing commitment to improving your form'
      ]
  
  // Select improvements from common mistakes
  const improvements = commonMistakes.length > 0
    ? commonMistakes.slice(0, 2).map(m => `Watch out for: ${m}`)
    : [
        'Focus on maintaining proper form throughout',
        'Try to be more consistent with each repetition'
      ]
  
  // Use drill tips as coaching tips
  const coachingTips = drillTips.length > 0
    ? drillTips.slice(0, 3)
    : [
        'Practice this drill slowly at first',
        'Focus on quality over quantity',
        'Record yourself to check your form'
      ]
  
  return {
    formScore: null,
    scored: false,
    positives,
    improvements,
    coachingTips,
    feedback: positives,
    detailedFeedback: `AI scoring was unavailable, so this is a drill checklist rather than a graded analysis of your ${drillName} drill (Focus: ${focusArea}). ${drillDescription.slice(0, 150)}... Keep practicing and focus on the coaching tips provided.`
  }
}
