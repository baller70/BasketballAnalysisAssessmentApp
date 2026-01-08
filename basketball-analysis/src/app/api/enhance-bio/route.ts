/**
 * Bio Enhancement API Route
 * 
 * Uses the hybrid LLM router to enhance user bios.
 * Falls back through multiple FREE providers before using paid OpenAI.
 */

import { NextRequest, NextResponse } from "next/server"
import { generateText } from "@/lib/llm"

const ENHANCEMENT_PROMPT = `You are a basketball shooting coach helping players create their profile. 
The player has written a brief bio about their shooting goals and challenges.

Your task:
1. Expand their bio to 200-300 words
2. Add relevant shooting context and coaching considerations
3. Keep their voice and intent
4. Add specific, actionable details that would help an AI coach understand their situation
5. Include questions they might want answered

Do NOT:
- Change the core meaning of what they wrote
- Add false information
- Be overly formal or stiff
- Use too much technical jargon

Respond with ONLY the enhanced bio text, no explanations or preamble.`

export async function POST(request: NextRequest) {
  try {
    const { bio } = await request.json()
    
    if (!bio || bio.length < 20) {
      return NextResponse.json(
        { success: false, error: "Bio must be at least 20 characters" },
        { status: 400 }
      )
    }
    
    // Use the hybrid LLM router instead of direct OpenAI call
    const enhancedBio = await generateText(
      ENHANCEMENT_PROMPT,
      `Player's bio:\n"${bio}"\n\nPlease expand this into a 200-300 word bio:`,
      { maxTokens: 500, temperature: 0.7 }
    )
    
    if (!enhancedBio) {
      throw new Error("No response from AI")
    }
    
    return NextResponse.json({
      success: true,
      enhancedBio: enhancedBio.trim(),
      originalBio: bio,
    })
    
  } catch (error) {
    console.error("Bio enhancement error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to enhance bio" },
      { status: 500 }
    )
  }
}
