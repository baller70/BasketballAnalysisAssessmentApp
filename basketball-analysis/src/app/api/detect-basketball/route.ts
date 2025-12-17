import { NextRequest, NextResponse } from 'next/server'

const HYBRID_API_URL = process.env.NEXT_PUBLIC_HYBRID_API_URL || 'http://localhost:5001'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image } = body

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'No image provided' },
        { status: 400 }
      )
    }

    // Extract base64 data (remove data URL prefix if present)
    const base64Image = image.includes(',') ? image.split(',')[1] : image

    // Call the hybrid backend for pose detection (which includes basketball detection)
    const response = await fetch(`${HYBRID_API_URL}/api/detect-pose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Hybrid API error:', errorText)
      return NextResponse.json(
        { success: false, error: 'Basketball detection failed', message: errorText },
        { status: response.status }
      )
    }

    const result = await response.json()

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Detection failed',
        message: 'Could not detect pose/basketball'
      })
    }

    // Extract basketball info from the hybrid result
    if (result.basketball) {
      return NextResponse.json({
        success: true,
        basketball: {
          x: result.basketball.x,
          y: result.basketball.y,
          width: result.basketball.radius * 2,
          height: result.basketball.radius * 2,
          confidence: 0.9 // Hybrid detection is reliable
        },
        image_size: result.image_size
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'No basketball detected in image'
      })
    }

  } catch (error) {
    console.error('Basketball detection error:', error)
    
    // Check if it's a connection error to the hybrid server
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot connect to hybrid server',
          message: 'Run: python3 python-scraper/hybrid_pose_detection.py'
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

