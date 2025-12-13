import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { CoachingTier } from "@/stores/profileStore"
import { 
  getCoachingPersona, 
  getTierDetails,
  getTierPromptAdditions,
} from "@/lib/coaching"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const ANALYSIS_PROMPT = `
========================================
FIRST JOB: FIND THE ORANGE BALL
========================================

Look at the image. Find the BASKETBALL.

HOW TO FIND THE BALL:
1. Look for TWO HANDS - one hand is on the SIDE of the ball, one hand is UNDERNEATH the ball
2. The ball is between/above the hands
3. The ball is ORANGE with BLACK LINES/STRIPES
4. The ball may look like a HALF CIRCLE because hands are covering part of it
5. The ARMS are RAISED UP - ball is near HEAD level

WHERE IS THE BALL?
- The ball is FIRST FROM THE TOP of the image
- It's the highest object - near HEAD level where ARMS are UP
- Find the TWO HANDS - one on SIDE, one UNDERNEATH
- The ORANGE thing between those hands - that's the ball
- Even if you only see HALF the ball (hands covering the rest), that's still the ball

The ball is ORANGE with BLACK LINES. It might only show as a HALF CIRCLE because hands cover part of it. That's OK - find the ORANGE part you CAN see.

IMPORTANT: Find the CENTER of the orange ball, not the edge.
- The center is LOWER (higher y value) than you might think
- Add +5 to +10 to your y estimate to get the true center
- The ball center is usually y = 25-40, not y = 15-25
Look at the MIDDLE of the orange area, not the top edge.

The CENTER of the ball - give me x,y coordinates:
- x = 0 is left edge, x = 100 is right edge
- y = 0 is top edge, y = 100 is bottom edge

Since the ball is UP near the head with arms raised:
- y is probably between 15-35 (upper part of image)
- x depends on which side the shooter is on

DO NOT put the ball coordinates on the elbow, shoulder, or any body part.
The ball is the ORANGE ROUND thing with BLACK LINES.

========================================
COORDINATE SYSTEM:
========================================
- x = 0 is LEFT edge, x = 100 is RIGHT edge
- y = 0 is TOP edge, y = 100 is BOTTOM edge

===== STEP 2: FIND THE HANDS (what's touching the ROUND ball?) =====
Look at what is TOUCHING the ROUND ball you just found.
- Hands are holding the ball - they touch the ROUND shape
- Shooting hand = under/behind the ball
- Guide hand = side of the ball

===== STEP 3: FIND THE WRISTS (below the hands) =====
From the hands, look SLIGHTLY DOWN.
- Wrist connects hand to arm
- Just below where fingers grip the ball

===== STEP 4: FIND THE ELBOW (below the wrist) =====
From the wrist, follow the arm DOWN.
- Elbow is the BENT joint
- Below and out from the ball

===== STEP 5: FIND THE SHOULDER (above the elbow) =====
From the elbow, follow the arm UP.
- Shoulder is where arm meets body
- Above the elbow

===== STEP 6: FIND THE CHEST (between shoulders) =====
From the shoulder, move INWARD.
- Chest is center of upper body
- Between the two shoulders

===== STEP 7: FIND THE CORE/ABS (below chest) =====
From the chest, move DOWN.
- Core/abs is the stomach area
- Below the chest

===== STEP 8: FIND THE HIPS (below abs) =====
From the abs, move DOWN.
- Hips are at the waistline
- Where torso meets legs

===== STEP 9: FIND THE KNEES (below hips) =====
From the hips, follow the legs DOWN.
- Knees are the BENT joints in legs
- Middle of each leg

===== STEP 10: FIND THE ANKLES (below knees) =====
From the knees, follow the legs DOWN.
- Ankles are above the feet
- Where leg meets foot

===== STEP 11: FIND THE FEET (at the bottom) =====
From the ankles, look DOWN.
- Feet are at the ground
- Bottom of the player

Return ONLY valid JSON:
{
  "overallScore": <0-100>,
  "category": "<EXCELLENT|GOOD|NEEDS_IMPROVEMENT|CRITICAL>",
  "measurements": {
    "elbowAngle": <degrees>,
    "kneeAngle": <degrees>,
    "shoulderAngle": <degrees>,
    "releaseAngle": <degrees>,
    "hipAngle": <degrees>,
    "balance": <0-100>,
    "followThrough": <0-100>
  },
  "bodyPositions": {
    "ball": { "x": <0-100>, "y": <0-100>, "label": "Ball", "angle": null, "status": "good", "note": "<position note>" },
    "shootingHand": { "x": <0-100>, "y": <0-100>, "label": "Shooting Hand", "angle": null, "status": "<good|warning|critical>", "note": "<form note>" },
    "guideHand": { "x": <0-100>, "y": <0-100>, "label": "Guide Hand", "angle": null, "status": "<good|warning|critical>", "note": "<form note>" },
    "shootingWrist": { "x": <0-100>, "y": <0-100>, "label": "Wrist", "angle": null, "status": "<good|warning|critical>", "note": "<form note>" },
    "shootingElbow": { "x": <0-100>, "y": <0-100>, "label": "Elbow", "angle": <degrees>, "status": "<good|warning|critical>", "note": "<form note>" },
    "shootingShoulder": { "x": <0-100>, "y": <0-100>, "label": "Shoulder", "angle": <degrees or null>, "status": "<good|warning|critical>", "note": "<form note>" },
    "chest": { "x": <0-100>, "y": <0-100>, "label": "Chest", "angle": null, "status": "<good|warning|critical>", "note": "<form note>" },
    "abs": { "x": <0-100>, "y": <0-100>, "label": "Core", "angle": null, "status": "<good|warning|critical>", "note": "<form note>" },
    "hips": { "x": <0-100>, "y": <0-100>, "label": "Hips", "angle": <degrees or null>, "status": "<good|warning|critical>", "note": "<form note>" },
    "knees": { "x": <0-100>, "y": <0-100>, "label": "Knees", "angle": <degrees>, "status": "<good|warning|critical>", "note": "<form note>" },
    "ankles": { "x": <0-100>, "y": <0-100>, "label": "Ankles", "angle": null, "status": "<good|warning|critical>", "note": "<form note>" },
    "feet": { "x": <0-100>, "y": <0-100>, "label": "Feet", "angle": null, "status": "<good|warning|critical>", "note": "<form note>" }
  },
  "centerLine": { "x": <where spine is horizontally 0-100> },
  "phaseDetection": { "currentPhase": "<LOAD|SET|RELEASE|FOLLOW_THROUGH>", "phaseQuality": "<note>" },
  "strengths": ["<strength>"],
  "criticalIssues": ["<issue if any>"],
  "improvements": ["<tip>"],
  "drills": [{"name": "<drill>", "purpose": "<why>", "reps": "<count>"}],
  "coachingTip": "<key tip>",
  "similarProPlayer": "<NBA player>",
  "proComparison": "<comparison>"
}

CRITICAL RULES:
1. FIND THE ROUND BALL FIRST - scan for the circular/round shape
2. Each position comes FROM the previous one in the chain
3. CHAIN ORDER: Ball → Hands → Wrists → Elbow → Shoulder → Chest → Abs → Hips → Knees → Ankles → Feet
4. Positions must make anatomical sense - connected body parts should be near each other
5. If ball is at x=60, y=25, then hands should be RIGHT THERE at similar coordinates
6. Status: "good" = correct, "warning" = needs work, "critical" = major flaw`

export async function POST(request: NextRequest) {
  try {
    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "OpenAI API key not configured. Add OPENAI_API_KEY to your .env file." },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const imageFile = formData.get("image") as File | null
    const ballPositionJson = formData.get("ballPosition") as string | null // Roboflow ball position
    const userProfileJson = formData.get("userProfile") as string | null // User profile for tier-specific analysis

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: "No image provided" },
        { status: 400 }
      )
    }

    // Parse ball position if provided (from Roboflow)
    let ballPosition: { x: number; y: number; confidence: number } | null = null
    if (ballPositionJson) {
      try {
        ballPosition = JSON.parse(ballPositionJson)
      } catch (e) {
        console.warn("Failed to parse ball position:", e)
      }
    }

    // Parse user profile if provided
    let userProfile: {
      coachingTier?: CoachingTier
      age?: number
      heightInches?: number
      experienceLevel?: string
      bodyType?: string
      athleticAbility?: number
      dominantHand?: string
      shootingStyle?: string
    } | null = null
    if (userProfileJson) {
      try {
        userProfile = JSON.parse(userProfileJson)
      } catch (e) {
        console.warn("Failed to parse user profile:", e)
      }
    }

    // Convert image to base64
    const bytes = await imageFile.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")
    const mimeType = imageFile.type || "image/jpeg"

    // Build prompt - use ball position as anchor if available
    let prompt = ANALYSIS_PROMPT
    if (ballPosition) {
      prompt = `========================================
ANCHOR POINT: BASKETBALL POSITION (DETECTED BY ROBOFLOW)
========================================

The basketball has ALREADY been detected at:
- x = ${ballPosition.x.toFixed(1)}% (0 = left edge, 100 = right edge)
- y = ${ballPosition.y.toFixed(1)}% (0 = top edge, 100 = bottom edge)
- Confidence: ${(ballPosition.confidence * 100).toFixed(0)}%

USE THIS AS YOUR ANCHOR POINT. The ball is RIGHT HERE.

NOW FIND THE HANDS:
- The hands are TOUCHING/HOLDING the ball at x=${ballPosition.x.toFixed(1)}%, y=${ballPosition.y.toFixed(1)}%
- Shooting hand = UNDER/BEHIND the ball (slightly below, y + 2-5%)
- Guide hand = SIDE of the ball (slightly to the side, x ± 3-8%)
- Look RIGHT AT the ball position - hands are RIGHT THERE

CHAIN FROM THE BALL:
1. BALL: x=${ballPosition.x.toFixed(1)}%, y=${ballPosition.y.toFixed(1)}% (ALREADY FOUND ✅)
2. HANDS: Touching the ball - look RIGHT AT the ball position
3. WRISTS: Just below the hands (y + 5-10%)
4. ELBOWS: Below wrists, follow the arm down (y + 15-25%)
5. SHOULDERS: Above elbows, where arm meets body (y - 10-20% from elbow)
6. CHEST: Between shoulders, center of upper body
7. ABS: Below chest (y + 10-15%)
8. HIPS: Below abs, waistline (y + 10-15%)
9. KNEES: Below hips, middle of legs (y + 20-30%)
10. ANKLES: Below knees (y + 10-15%)
11. FEET: At the bottom, ground level (y + 5-10%)

${ANALYSIS_PROMPT}`
    }

    // Add tier-specific instructions if user profile is provided
    if (userProfile?.coachingTier) {
      const tierAdditions = getTierPromptAdditions(userProfile.coachingTier)
      const persona = getCoachingPersona(userProfile.coachingTier)
      const tierDetails = getTierDetails(userProfile.coachingTier)
      
      prompt += `

${tierAdditions}

=== USER PROFILE CONTEXT ===
Age: ${userProfile.age || "Not specified"}
Height: ${userProfile.heightInches ? `${Math.floor(userProfile.heightInches / 12)}'${userProfile.heightInches % 12}"` : "Not specified"}
Experience: ${userProfile.experienceLevel || "Not specified"}
Body Type: ${userProfile.bodyType || "Not specified"}
Athletic Ability: ${userProfile.athleticAbility || "Not specified"}/10
Dominant Hand: ${userProfile.dominantHand || "Not specified"}
Shooting Style: ${userProfile.shootingStyle?.replace("_", "-") || "Not specified"}

=== FEEDBACK REQUIREMENTS ===
- Use ${persona.tone.complexity} language complexity
- Encouragement level: ${persona.tone.encouragementLevel}
${persona.tone.useMetrics ? "- INCLUDE specific measurements and angles" : "- Focus on general form observations, not precise measurements"}
${persona.tone.usePeerComparisons ? "- INCLUDE peer comparisons when relevant" : "- Do NOT include peer comparisons"}

=== SCORING THRESHOLDS FOR THIS TIER ===
- Excellent: ${persona.scoreInterpretation.excellent.min}+
- Good: ${persona.scoreInterpretation.good.min}+
- Developing: ${persona.scoreInterpretation.developing.min}+
- Needs Work: Below ${persona.scoreInterpretation.developing.min}

=== OPTIMAL METRICS FOR THIS TIER ===
- Elbow Angle: ${tierDetails.metrics.elbowAngle.optimal}° (range: ${tierDetails.metrics.elbowAngle.min}-${tierDetails.metrics.elbowAngle.max}°)
- Knee Angle: ${tierDetails.metrics.kneeAngle.optimal}° (range: ${tierDetails.metrics.kneeAngle.min}-${tierDetails.metrics.kneeAngle.max}°)
- Shot Arc: ${tierDetails.metrics.shotArc.optimal}° (range: ${tierDetails.metrics.shotArc.min}-${tierDetails.metrics.shotArc.max}°)
- Balance Score: ${tierDetails.metrics.balanceScore.optimal} (range: ${tierDetails.metrics.balanceScore.min}-${tierDetails.metrics.balanceScore.max})

Score relative to these tier-specific ranges, not professional standards.`
    }

    // Call GPT-4 Vision
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json(
        { success: false, error: "No response from Vision AI" },
        { status: 500 }
      )
    }

    // Parse JSON from response (handle markdown code blocks)
    let analysis
    try {
      // Remove markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim()
      analysis = JSON.parse(jsonStr)
    } catch {
      // If JSON parsing fails, return raw content
      return NextResponse.json({
        success: true,
        analysis: {
          overallScore: 75,
          category: "GOOD",
          rawAnalysis: content,
          measurements: {},
          bodyAnalysis: {},
          strengths: [],
          improvements: [],
          drills: [],
          coachingTip: content.slice(0, 200),
        },
      })
    }

    return NextResponse.json({
      success: true,
      analysis,
    })
  } catch (error) {
    console.error("Vision analysis error:", error)
    const message = error instanceof Error ? error.message : "Analysis failed"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}



