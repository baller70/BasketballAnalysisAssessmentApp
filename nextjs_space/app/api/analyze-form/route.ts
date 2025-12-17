/**
 * API Route: Form Analysis Proxy
 * 
 * This server-side API route acts as a proxy to the Python hybrid pose detection server
 * for full shooting form analysis. It receives image data from the client, forwards it to
 * the Python backend running on localhost:5001, and returns the analysis results.
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

    console.log('🔄 Proxying form analysis request to Python backend...');

    // Forward the request to the Python hybrid pose detection server
    const response = await fetch(`${HYBRID_SERVER_URL}/api/analyze-form`, {
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
        { error: 'Form analysis failed', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Form analysis successful');
    
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('❌ Form analysis proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
