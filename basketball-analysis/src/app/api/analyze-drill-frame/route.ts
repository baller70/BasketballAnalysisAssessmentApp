/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * API Route for Vision-based Drill Frame Analysis
 *
 * POST /api/analyze-drill-frame
 *
 * Analyzes a single frame from a drill video using Google Gemini Vision to
 * provide quick coaching feedback.
 *
 * Auth: requires a signed-in caller (resolveProfileId) and a valid CSRF token —
 * this endpoint relays an authenticated user's frame to a paid/quota'd external
 * model, so it must not be callable cross-site or anonymously.
 *
 * Honest scoring: GOOGLE_AI_API_KEY may be unset, or Gemini may return a
 * non-numeric / unparseable response. In every such case the route returns
 * `{ scored: false, formScore: null }` and a drill checklist — it NEVER fabricates
 * a number. A numeric `formScore` (with `scored: true`) is returned ONLY when
 * Gemini produced a real 0-100 score.
 *
 * Response shape (stable contract for the live Workouts UI — see below):
 *   {
 *     success: true,
 *     scored: boolean,            // true ⇔ formScore is a real model number
 *     formScore: number | null,   // 0-100 when scored, else null
 *     positives: string[],
 *     improvements: string[],
 *     coachingTips: string[],
 *     detailedFeedback: string,
 *     analysisType: 'gemini-vision' | 'rule-based'
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'
import { resolveProfileId, isError } from '@/lib/auth/currentUser'
import { validateCsrf } from '@/lib/csrf'

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

interface DrillFrameAnalysis {
  scored: boolean
  formScore: number | null
  positives: string[]
  improvements: string[]
  coachingTips: string[]
  detailedFeedback: string
}

const asStringArray = (v: unknown, fallback: string[]): string[] =>
  Array.isArray(v) && v.length > 0
    ? v.filter((x): x is string => typeof x === 'string')
    : fallback

export async function POST(request: NextRequest) {
  const csrfError = validateCsrf(request)
  if (csrfError) return csrfError

  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error

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

    const tips = Array.isArray(drillTips) ? drillTips : []
    const criteria = Array.isArray(correctFormCriteria) ? correctFormCriteria : []
    const mistakes = Array.isArray(commonMistakes) ? commonMistakes : []

    // If Google AI API key is available, use Gemini Vision
    if (GOOGLE_AI_API_KEY) {
      try {
        const visionAnalysis = await analyzeWithGeminiVision(
          image,
          drillName,
          drillDescription || '',
          focusArea || 'general',
          criteria,
          mistakes
        )

        return NextResponse.json({
          success: true,
          ...visionAnalysis,
          analysisType: 'gemini-vision',
        })
      } catch (visionError) {
        console.error('Gemini Vision API error, falling back to rule-based:', visionError)
      }
    }

    // Fallback: honest, non-scored rule-based checklist (never a fake number)
    const ruleBasedAnalysis = generateRuleBasedAnalysis(
      drillName,
      drillDescription || '',
      tips,
      focusArea || 'general',
      criteria,
      mistakes
    )

    return NextResponse.json({
      success: true,
      ...ruleBasedAnalysis,
      analysisType: 'rule-based',
    })

  } catch (error) {
    console.error('Error analyzing drill frame:', error)
    return NextResponse.json(
      { error: 'Failed to analyze drill frame', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Analyze image using Google Gemini Vision, returning the normalized shape.
async function analyzeWithGeminiVision(
  imageBase64: string,
  drillName: string,
  drillDescription: string,
  focusArea: string,
  correctFormCriteria: string[],
  commonMistakes: string[]
): Promise<DrillFrameAnalysis> {
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
  let imageData = imageBase64
  let mimeType = 'image/jpeg'

  if (imageBase64.startsWith('data:')) {
    const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/)
    if (matches) {
      mimeType = matches[1]
      imageData = matches[2]
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
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gemini Vision API error: ${error}`)
  }

  const data = await response.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!content) {
    throw new Error('No response from Gemini Vision API')
  }

  // Parse JSON from the response (it might be wrapped in markdown code blocks)
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    // Model spoke prose, not JSON — surface its words but DO NOT invent a score.
    return {
      scored: false,
      formScore: null,
      positives: ['Good effort on the drill', 'Showing proper dedication'],
      improvements: ['Continue focusing on form', 'Practice consistency'],
      coachingTips: ['Watch tutorial videos for reference', 'Practice in front of a mirror'],
      detailedFeedback: String(content).slice(0, 500),
    }
  }

  let parsed: any
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    return {
      scored: false,
      formScore: null,
      positives: ['Good effort on the drill', 'Showing proper dedication'],
      improvements: ['Continue focusing on form', 'Practice consistency'],
      coachingTips: ['Watch tutorial videos for reference', 'Practice in front of a mirror'],
      detailedFeedback: String(content).slice(0, 500),
    }
  }

  // Only treat the score as real when the model returned a finite number; clamp
  // it to 0-100. Anything else stays honestly unscored.
  const rawScore = parsed.formScore
  const hasScore = typeof rawScore === 'number' && Number.isFinite(rawScore)
  const formScore = hasScore
    ? Math.max(0, Math.min(100, Math.round(rawScore)))
    : null

  return {
    scored: hasScore,
    formScore,
    positives: asStringArray(parsed.positives, ['Good effort on the drill']),
    improvements: asStringArray(parsed.improvements, ['Continue focusing on form']),
    coachingTips: asStringArray(parsed.coachingTips, ['Practice in front of a mirror']),
    detailedFeedback:
      typeof parsed.detailedFeedback === 'string'
        ? parsed.detailedFeedback
        : String(content).slice(0, 500),
  }
}

// Generate a rule-based checklist when vision AI is unavailable. This is an
// honest, non-scored drill guide — never a fabricated grade.
function generateRuleBasedAnalysis(
  drillName: string,
  drillDescription: string,
  drillTips: string[],
  focusArea: string,
  correctFormCriteria: string[],
  commonMistakes: string[]
): DrillFrameAnalysis {
  const positives = correctFormCriteria.length > 0
    ? correctFormCriteria.slice(0, 2).map(c => `Working on: ${c}`)
    : [
        `Good effort on the ${drillName} drill`,
        'Showing commitment to improving your form',
      ]

  const improvements = commonMistakes.length > 0
    ? commonMistakes.slice(0, 2).map(m => `Watch out for: ${m}`)
    : [
        'Focus on maintaining proper form throughout',
        'Try to be more consistent with each repetition',
      ]

  const coachingTips = drillTips.length > 0
    ? drillTips.slice(0, 3)
    : [
        'Practice this drill slowly at first',
        'Focus on quality over quantity',
        'Record yourself to check your form',
      ]

  return {
    scored: false,
    formScore: null,
    positives,
    improvements,
    coachingTips,
    detailedFeedback: `AI scoring was unavailable, so this is a drill checklist rather than a graded analysis of your ${drillName} drill (Focus: ${focusArea}). ${drillDescription.slice(0, 150)}${drillDescription.length > 150 ? '...' : ''} Keep practicing and focus on the coaching tips provided.`,
  }
}
