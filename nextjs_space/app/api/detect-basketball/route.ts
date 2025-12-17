import { NextRequest, NextResponse } from 'next/server'

const HYBRID_API_URL = process.env.HYBRID_SERVER_URL || 'http://localhost:5001'
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

// Helper function to attempt Python backend basketball detection
async function tryPythonBackend(imageData: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${HYBRID_API_URL}/api/detect-pose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageData }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId);

    if (response.ok) {
      const result = await response.json()
      
      if (result.success && result.basketball) {
        console.log('✅ Python backend basketball detection successful')
        return {
          success: true,
          data: {
            success: true,
            basketball: {
              x: result.basketball.x,
              y: result.basketball.y,
              width: result.basketball.radius * 2,
              height: result.basketball.radius * 2,
              confidence: 0.9
            },
            image_size: result.image_size
          }
        }
      }
    }
    
    return { success: false, error: `Backend returned ${response.status}` }
  } catch (error: any) {
    console.log('⚠️ Python backend unavailable:', error.message)
    return { success: false, error: error.message }
  }
}

// Helper function to use AI vision API as fallback
async function useAIVisionFallback(imageData: string) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('AI vision API key not configured')
  }

  console.log('🤖 Using AI vision API fallback for basketball detection...')

  const base64Image = imageData.includes(',') ? imageData.split(',')[1] : imageData

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
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
              text: `Detect the basketball in this image. Return a JSON object with:
{
  "success": true,
  "basketball": {"x": center_x, "y": center_y, "width": width, "height": height, "confidence": 0.9},
  "image_size": {"width": image_width, "height": image_height}
}

If no basketball is visible, return {"success": false, "message": "No basketball detected"}. Estimate pixel coordinates based on the basketball's position in the image.`
            }
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`AI vision API error: ${errorText}`)
  }

  const result = await response.json()
  const content = result.content[0].text
  
  // Extract JSON from the response
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Could not parse AI vision response')
  }

  const detectionData = JSON.parse(jsonMatch[0])
  console.log('✅ AI vision fallback basketball detection successful')
  
  return detectionData
}

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

    console.log('🏀 Starting basketball detection...')

    // Try Python backend first
    const pythonResult = await tryPythonBackend(base64Image)
    
    if (pythonResult.success) {
      return NextResponse.json(pythonResult.data)
    }

    // Fallback to AI vision API
    console.log('📍 Python backend unavailable, using AI vision fallback...')
    const aiVisionResult = await useAIVisionFallback(base64Image)
    
    return NextResponse.json(aiVisionResult)

  } catch (error: any) {
    console.error('Basketball detection error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Basketball detection failed',
        details: error.message
      },
      { status: 500 }
    )
  }
}

