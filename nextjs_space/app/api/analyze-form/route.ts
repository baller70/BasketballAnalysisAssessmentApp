/**
 * API Route: Form Analysis Proxy
 * 
 * This server-side API route provides shooting form analysis with automatic fallback:
 * 1. Primary: Attempts to use Python hybrid pose detection server
 * 2. Fallback: Uses AI vision API for form analysis when Python backend is unavailable
 */

import { NextRequest, NextResponse } from 'next/server';

const HYBRID_SERVER_URL = process.env.HYBRID_SERVER_URL || 'http://localhost:5001';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Helper function to attempt Python backend form analysis
async function tryPythonBackend(body: any) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for analysis
    
    const response = await fetch(`${HYBRID_SERVER_URL}/api/analyze-form`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Python backend form analysis successful');
      return { success: true, data };
    }
    
    return { success: false, error: `Backend returned ${response.status}` };
  } catch (error: any) {
    console.log('⚠️ Python backend unavailable:', error.message);
    return { success: false, error: error.message };
  }
}

// Helper function to use AI vision API as fallback
async function useAIVisionFallback(imageData: string, ballPosition: any) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('AI vision API key not configured');
  }

  console.log('🤖 Using AI vision API fallback for form analysis...');

  const base64Image = imageData.includes(',') ? imageData.split(',')[1] : imageData;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 6000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: `Analyze this basketball shooting form comprehensively. ${ballPosition ? `The basketball is located at: (${ballPosition.x}, ${ballPosition.y})` : ''}

Return a detailed JSON object with:
{
  "success": true,
  "biomechanics": {
    "elbow_angle": angle_in_degrees,
    "knee_bend": angle_in_degrees,
    "release_angle": angle_in_degrees,
    "shoulder_tilt": angle_in_degrees,
    "hip_alignment": angle_in_degrees,
    "follow_through_angle": angle_in_degrees
  },
  "form_score": overall_score_0_to_100,
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "recommendations": ["recommendation1", "recommendation2", ...],
  "detailed_analysis": "comprehensive written analysis of the shooting form",
  "shooter_level": "ELITE" | "PRO" | "ADVANCED" | "INTERMEDIATE" | "DEVELOPING" | "NEEDS_WORK"
}

Provide accurate biomechanical measurements and actionable feedback based on professional basketball shooting form standards.`
            }
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI vision API error: ${errorText}`);
  }

  const result = await response.json();
  const content = result.content[0].text;
  
  // Extract JSON from the response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse AI vision response');
  }

  const analysisData = JSON.parse(jsonMatch[0]);
  console.log('✅ AI vision fallback form analysis successful');
  
  return analysisData;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    console.log('🏀 Starting shooting form analysis...');

    // Try Python backend first
    const pythonResult = await tryPythonBackend(body);
    
    if (pythonResult.success) {
      return NextResponse.json(pythonResult.data);
    }

    // Fallback to AI vision API
    console.log('📍 Python backend unavailable, using AI vision fallback...');
    const aiVisionResult = await useAIVisionFallback(body.image, body.ballPosition);
    
    return NextResponse.json(aiVisionResult);
    
  } catch (error: any) {
    console.error('❌ Form analysis error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Form analysis failed', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
