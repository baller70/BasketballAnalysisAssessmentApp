import { NextRequest, NextResponse } from 'next/server'
import { Jimp } from 'jimp'

interface CropRegion {
  id: string
  name: string
  centerX: number
  centerY: number
  width: number
  height: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageBase64, regions, imageWidth, imageHeight } = body as {
      imageBase64: string
      regions: CropRegion[]
      imageWidth: number
      imageHeight: number
    }

    if (!imageBase64 || !regions || regions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing imageBase64 or regions' },
        { status: 400 }
      )
    }

    console.log('[Jimp Crop API] Processing image:', imageWidth, 'x', imageHeight)
    console.log('[Jimp Crop API] Cropping', regions.length, 'regions')

    // Decode base64 image
    const imageBuffer = Buffer.from(imageBase64, 'base64')
    
    // Load image with Jimp
    const image = await Jimp.read(imageBuffer)
    const imgW = image.width
    const imgH = image.height
    
    console.log('[Jimp Crop API] Actual image size:', imgW, 'x', imgH)

    // Calculate scale factors if the provided dimensions differ from actual
    const scaleX = imgW / imageWidth
    const scaleY = imgH / imageHeight

    const croppedImages: { id: string; name: string; dataUrl: string }[] = []

    for (const region of regions) {
      // Scale coordinates to actual image size
      const scaledCenterX = region.centerX * scaleX
      const scaledCenterY = region.centerY * scaleY
      const scaledWidth = region.width * scaleX
      const scaledHeight = region.height * scaleY

      // Calculate crop bounds centered on the keypoint
      let cropX = Math.round(scaledCenterX - scaledWidth / 2)
      let cropY = Math.round(scaledCenterY - scaledHeight / 2)
      let cropW = Math.round(scaledWidth)
      let cropH = Math.round(scaledHeight)

      // Ensure crop stays within image bounds
      if (cropX < 0) cropX = 0
      if (cropY < 0) cropY = 0
      if (cropX + cropW > imgW) {
        cropW = imgW - cropX
      }
      if (cropY + cropH > imgH) {
        cropH = imgH - cropY
      }

      // Ensure minimum size
      cropW = Math.max(cropW, 100)
      cropH = Math.max(cropH, 100)

      console.log(`[Jimp Crop API] Cropping ${region.id}:`, { cropX, cropY, cropW, cropH })

      // Clone the image and crop
      const croppedImage = image.clone().crop({
        x: cropX,
        y: cropY,
        w: cropW,
        h: cropH
      })

      // Convert to PNG buffer (lossless, best quality)
      const pngBuffer = await croppedImage.getBuffer('image/png')
      const base64 = pngBuffer.toString('base64')
      const dataUrl = `data:image/png;base64,${base64}`

      croppedImages.push({
        id: region.id,
        name: region.name,
        dataUrl
      })
    }

    console.log('[Jimp Crop API] Successfully cropped', croppedImages.length, 'images')

    return NextResponse.json({
      success: true,
      images: croppedImages
    })

  } catch (error) {
    console.error('[Jimp Crop API] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

