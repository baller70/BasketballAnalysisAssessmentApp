/**
 * API Route: Pose Detection (Hybrid System with AI Fallback)
 * 
 * This route implements a robust hybrid pose detection system:
 * 1. Primary: Render Python service (YOLO + MediaPipe)
 * 2. Fallback: Anthropic Claude Vision API
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 60; // Allow up to 60 seconds for pose detection

const HYBRID_SERVER_URL = process.env.HYBRID_SERVER_URL || 'https://basketball-hybrid-pose-detection.onrender.com';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    console.log('🔄 Attempting Render Python service...');

    // Extract base64 data (remove data URL prefix if present)
    const base64Image = body.image.includes(',') ? body.image.split(',')[1] : body.image;

    // Try Render Python service first (with 10s timeout)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const pythonResponse = await fetch(`${HYBRID_SERVER_URL}/api/detect-pose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (pythonResponse.ok) {
        const result = await pythonResponse.json();
        console.log('✅ Render Python service succeeded');
        return NextResponse.json({
          ...result,
          method: 'python-hybrid',
          source: 'render'
        });
      } else {
        console.warn(`⚠️ Render service returned status ${pythonResponse.status}`);
      }
    } catch (pythonError: any) {
      if (pythonError.name === 'AbortError') {
        console.warn('⚠️ Render service timeout (10s)');
      } else {
        console.warn('⚠️ Render service error:', pythonError.message);
      }
    }

    // Fallback to Anthropic Claude API
    console.log('🤖 Falling back to Anthropic Claude Vision API...');
    
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured and Python service unavailable');
    }

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{
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
            text: 'Analyze this basketball shooting form image and provide detailed pose detection data in JSON format.\n\nRequired output format:\n{\n  "success": true,\n  "keypoints": {\n    "nose": {"x": 0, "y": 0, "confidence": 0.9},\n    "left_eye": {"x": 0, "y": 0, "confidence": 0.9},\n    "right_eye": {"x": 0, "y": 0, "confidence": 0.9},\n    "left_ear": {"x": 0, "y": 0, "confidence": 0.9},\n    "right_ear": {"x": 0, "y": 0, "confidence": 0.9},\n    "left_shoulder": {"x": 0, "y": 0, "confidence": 0.9},\n    "right_shoulder": {"x": 0, "y": 0, "confidence": 0.9},\n    "left_elbow": {"x": 0, "y": 0, "confidence": 0.9},\n    "right_elbow": {"x": 0, "y": 0, "confidence": 0.9},\n    "left_wrist": {"x": 0, "y": 0, "confidence": 0.9},\n    "right_wrist": {"x": 0, "y": 0, "confidence": 0.9},\n    "left_hip": {"x": 0, "y": 0, "confidence": 0.9},\n    "right_hip": {"x": 0, "y": 0, "confidence": 0.9},\n    "left_knee": {"x": 0, "y": 0, "confidence": 0.9},\n    "right_knee": {"x": 0, "y": 0, "confidence": 0.9},\n    "left_ankle": {"x": 0, "y": 0, "confidence": 0.9},\n    "right_ankle": {"x": 0, "y": 0, "confidence": 0.9}\n  },\n  "basketball": {\n    "x": 0,\n    "y": 0,\n    "radius": 0\n  },\n  "image_size": {\n    "width": 0,\n    "height": 0\n  },\n  "confidence": 0.9\n}\n\nProvide pixel coordinates (x, y) for each body keypoint visible in the image. If the basketball is visible, include its center coordinates and approximate radius in pixels. Estimate the image dimensions. Return ONLY the JSON, no additional text.'
          }
        ],
      }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    // Extract JSON from response (handle code blocks)
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const result = JSON.parse(jsonText);
    
    console.log('✅ Anthropic Claude Vision API succeeded');
    
    return NextResponse.json({
      ...result,
      method: 'ai-vision-fallback',
      source: 'anthropic'
    });
    
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
  const hybridStatus = { available: false, url: HYBRID_SERVER_URL };
  const aiStatus = { available: !!ANTHROPIC_API_KEY };

  // Check Render service health
  try {
    const response = await fetch(`${HYBRID_SERVER_URL}/health`, { 
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    if (response.ok) {
      hybridStatus.available = true;
    }
  } catch (error) {
    console.warn('Render service health check failed');
  }

  return NextResponse.json({
    status: 'ok',
    hybrid_system: {
      primary: {
        name: 'Render Python Service',
        ...hybridStatus
      },
      fallback: {
        name: 'Anthropic Claude Vision API',
        ...aiStatus
      }
    },
    message: hybridStatus.available 
      ? 'Hybrid system fully operational' 
      : aiStatus.available 
        ? 'Running on AI fallback mode'
        : 'System degraded - no backends available'
  });
}
