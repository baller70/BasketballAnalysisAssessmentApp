/**
 * API Route: Pose Detection Proxy
 * 
 * This server-side API route acts as a proxy to the Python hybrid pose detection server.
 * It receives image data from the client, forwards it to the Python backend running on
 * localhost:5001, and returns the pose detection results.
 * 
 * This is necessary because:
 * 1. Client-side code cannot access localhost in production
 * 2. Server-side Next.js API routes CAN access localhost services
 * 3. This maintains security while enabling pose detection functionality
 */

import { NextRequest, NextResponse } from 'next/server';

const HYBRID_SERVER_URL = process.env.HYBRID_SERVER_URL || 'http://localhost:5001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    console.log('🔄 Proxying pose detection request to Python backend...');

    // Forward the request to the Python hybrid pose detection server
    const response = await fetch(`${HYBRID_SERVER_URL}/api/detect-pose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Python backend error:', errorText);
      return NextResponse.json(
        { error: 'Pose detection failed', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Pose detection successful');
    
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('❌ Pose detection proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
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
