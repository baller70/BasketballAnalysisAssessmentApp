/**
 * API Route: Pose Detection (Render Python Service Only)
 * 
 * This route connects to the Render Python service for pose detection:
 * - YOLO for basketball detection
 * - MediaPipe for pose estimation
 */

import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60; // Allow up to 60 seconds for pose detection

const HYBRID_SERVER_URL = process.env.HYBRID_SERVER_URL || 'https://basketball-hybrid-pose-detection.onrender.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    console.log('🔄 Connecting to Render Python service...');

    // Extract base64 data (remove data URL prefix if present)
    const base64Image = body.image.includes(',') ? body.image.split(',')[1] : body.image;

    // Call Render Python service (with 30s timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

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
      const errorText = await pythonResponse.text();
      console.error(`❌ Render service returned status ${pythonResponse.status}:`, errorText);
      throw new Error(`Render service error: ${pythonResponse.status} - ${errorText}`);
    }
    
  } catch (error: any) {
    console.error('❌ Pose detection error:', error);
    
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Pose detection timeout', 
          details: 'The Render service took too long to respond (30s timeout). Please try again.'
        },
        { status: 504 }
      );
    }
    
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
  const renderStatus = { available: false, url: HYBRID_SERVER_URL };

  // Check Render service health
  try {
    const response = await fetch(`${HYBRID_SERVER_URL}/health`, { 
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    if (response.ok) {
      renderStatus.available = true;
    }
  } catch (error) {
    console.warn('Render service health check failed');
  }

  return NextResponse.json({
    status: renderStatus.available ? 'ok' : 'unavailable',
    service: {
      name: 'Render Python Service',
      ...renderStatus
    },
    message: renderStatus.available 
      ? 'Pose detection service operational' 
      : 'Pose detection service unavailable'
  });
}
