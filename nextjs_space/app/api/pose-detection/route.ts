/**
 * API Route: Pose Detection Proxy
 * 
 * This server-side API route provides pose detection functionality with automatic fallback:
 * 1. Primary: Attempts to use Python hybrid pose detection server (YOLOv8x + MediaPipe)
 * 2. Fallback: Uses AI vision API for pose estimation when Python backend is unavailable
 * 
 * This ensures the app works in both development (with Python backend) and production (without it).
 */

import { NextRequest, NextResponse } from 'next/server';

const HYBRID_SERVER_URL = process.env.HYBRID_SERVER_URL || 'http://localhost:5001';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Helper function to attempt Python backend pose detection
async function tryPythonBackend(imageData: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${HYBRID_SERVER_URL}/api/detect-pose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageData }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Python backend pose detection successful');
      return { success: true, data };
    }
    
    return { success: false, error: `Backend returned ${response.status}` };
  } catch (error: any) {
    console.log('⚠️ Python backend unavailable:', error.message);
    return { success: false, error: error.message };
  }
}

// Helper function to use AI vision API as fallback
async function useAIVisionFallback(imageData: string) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('AI vision API key not configured');
  }

  console.log('🤖 Using AI vision API fallback for pose detection...');

  // Prepare the image for Claude API
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
      max_tokens: 4000,
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
              text: `Analyze this basketball shooting form image and provide pose keypoints. Return a JSON object with:
{
  "success": true,
  "keypoints": [17 keypoint objects with x, y, confidence for: nose, left_eye, right_eye, left_ear, right_ear, left_shoulder, right_shoulder, left_elbow, right_elbow, left_wrist, right_wrist, left_hip, right_hip, left_knee, right_knee, left_ankle, right_ankle],
  "confidence": overall_confidence_score,
  "basketball": {"detected": true/false, "x": x_coord, "y": y_coord, "radius": radius},
  "image_size": {"width": width, "height": height}
}

Estimate pixel coordinates based on the person's visible body parts. If a body part is not visible, set confidence to 0.`
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

  const poseData = JSON.parse(jsonMatch[0]);
  console.log('✅ AI vision fallback successful');
  
  return poseData;
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

    console.log('🔄 Starting pose detection...');

    // Try Python backend first
    const pythonResult = await tryPythonBackend(body.image);
    
    if (pythonResult.success) {
      return NextResponse.json(pythonResult.data);
    }

    // Fallback to AI vision API
    console.log('📍 Python backend unavailable, using AI vision fallback...');
    const aiVisionResult = await useAIVisionFallback(body.image);
    
    return NextResponse.json(aiVisionResult);
    
  } catch (error: any) {
    console.error('❌ Pose detection error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Pose detection failed', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    const response = await fetch(`${HYBRID_SERVER_URL}/health`, {
      method: 'GET',
    });
    
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        status: 'ok',
        backend: data,
        url: HYBRID_SERVER_URL
      });
    }
    
    return NextResponse.json(
      { status: 'error', message: 'Backend not responding' },
      { status: 503 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 503 }
    );
  }
}
