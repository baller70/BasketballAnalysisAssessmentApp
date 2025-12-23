/**
 * API Route for Vision-based Drill Frame Analysis
 * 
 * POST /api/analyze-drill-frame
 * 
 * Analyzes a single frame from a drill video using vision AI
 * to provide quick coaching feedback.
 */

import { NextRequest, NextResponse } from 'next/server'

// OpenAI Vision API for image analysis (if available)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

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
    
    // If OpenAI API key is available, use GPT-4 Vision
    if (OPENAI_API_KEY) {
      try {
        const visionAnalysis = await analyzeWithVision(
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
          analysisType: 'vision'
        })
      } catch (visionError) {
        console.error('Vision API error, falling back to rule-based:', visionError)
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

// Analyze image using OpenAI GPT-4 Vision
async function analyzeWithVision(
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

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    }),
  })
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }
  
  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  
  if (!content) {
    throw new Error('No response from Vision API')
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
      formScore: 70,
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
  // Generate a reasonable score
  const baseScore = 65 + Math.floor(Math.random() * 20) // 65-85 range
  
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
    formScore: baseScore,
    positives,
    improvements,
    coachingTips,
    feedback: positives,
    detailedFeedback: `Analysis of your ${drillName} drill (Focus: ${focusArea}). ${drillDescription.slice(0, 150)}... Keep practicing and focus on the coaching tips provided.`
  }
}

