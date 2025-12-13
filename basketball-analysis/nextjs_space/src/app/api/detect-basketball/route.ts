import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

// Roboflow basketball detection API
// Uses hosted inference API for object detection

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json()

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'No image provided' },
        { status: 400 }
      )
    }

    const apiKey = process.env.ROBOFLOW_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'ROBOFLOW_API_KEY not configured' },
        { status: 500 }
      )
    }

    // Extract base64 data from data URL if needed
    let base64Image = image
    if (image.startsWith('data:')) {
      base64Image = image.split(',')[1]
    }

    // Call Roboflow's hosted inference API
    // Using a basketball detection model from Roboflow Universe
    // Model: basketball-w2xcw (detects basketballs)
    const response = await axios({
      method: 'POST',
      url: 'https://detect.roboflow.com/basketball-w2xcw/1',
      params: {
        api_key: apiKey,
      },
      data: base64Image,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    const predictions = response.data.predictions || []

    // Find basketball in predictions
    // Look for class names that indicate basketball
    const basketballPrediction = predictions.find(
      (p: { class: string }) =>
        p.class.toLowerCase().includes('ball') ||
        p.class.toLowerCase().includes('basketball') ||
        p.class.toLowerCase() === 'sports ball'
    )

    if (basketballPrediction) {
      // Roboflow returns x, y as center coordinates and width, height
      // Convert to percentage of image dimensions
      const imageWidth = response.data.image?.width || 1
      const imageHeight = response.data.image?.height || 1

      const ballPosition = {
        x: (basketballPrediction.x / imageWidth) * 100,
        y: (basketballPrediction.y / imageHeight) * 100,
        width: (basketballPrediction.width / imageWidth) * 100,
        height: (basketballPrediction.height / imageHeight) * 100,
        confidence: basketballPrediction.confidence,
      }

      return NextResponse.json({
        success: true,
        basketball: ballPosition,
        allPredictions: predictions,
        imageSize: { width: imageWidth, height: imageHeight },
      })
    }

    // No basketball found - return all predictions for debugging
    return NextResponse.json({
      success: true,
      basketball: null,
      allPredictions: predictions,
      message: 'No basketball detected in image',
    })
  } catch (error) {
    console.error('Roboflow detection error:', error)

    // Check if it's an API error
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const message = error.response?.data?.message || error.message

      if (status === 401) {
        return NextResponse.json(
          { success: false, error: 'Invalid Roboflow API key' },
          { status: 401 }
        )
      }

      if (status === 404) {
        return NextResponse.json(
          { success: false, error: 'Model not found. Trying alternative...' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { success: false, error: `Roboflow API error: ${message}` },
        { status: status || 500 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to detect basketball' },
      { status: 500 }
    )
  }
}



