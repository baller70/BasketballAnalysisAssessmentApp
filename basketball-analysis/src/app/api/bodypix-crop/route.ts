import { NextRequest, NextResponse } from 'next/server'

// BodyPix body part IDs
const BODY_PARTS = {
  leftFace: 0,
  rightFace: 1,
  leftUpperArmFront: 2,
  leftUpperArmBack: 3,
  rightUpperArmFront: 4,
  rightUpperArmBack: 5,
  leftLowerArmFront: 6,
  leftLowerArmBack: 7,
  rightLowerArmFront: 8,
  rightLowerArmBack: 9,
  leftHand: 10,
  rightHand: 11,
  torsoFront: 12,
  torsoBack: 13,
  leftUpperLegFront: 14,
  leftUpperLegBack: 15,
  rightUpperLegFront: 16,
  rightUpperLegBack: 17,
  leftLowerLegFront: 18,
  leftLowerLegBack: 19,
  rightLowerLegFront: 20,
  rightLowerLegBack: 21,
  leftFoot: 22,
  rightFoot: 23,
}

// Group body parts for our crops (kept for reference/future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _CROP_REGIONS = {
  'hands-release': [
    BODY_PARTS.leftHand, BODY_PARTS.rightHand,
    BODY_PARTS.leftLowerArmFront, BODY_PARTS.leftLowerArmBack,
    BODY_PARTS.rightLowerArmFront, BODY_PARTS.rightLowerArmBack,
    BODY_PARTS.leftFace, BODY_PARTS.rightFace
  ],
  'ankles-feet': [
    BODY_PARTS.leftFoot, BODY_PARTS.rightFoot,
    BODY_PARTS.leftLowerLegFront, BODY_PARTS.leftLowerLegBack,
    BODY_PARTS.rightLowerLegFront, BODY_PARTS.rightLowerLegBack
  ],
  'ball-grip': [
    BODY_PARTS.leftHand, BODY_PARTS.rightHand,
    BODY_PARTS.leftFace, BODY_PARTS.rightFace
  ]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageBase64, keypoints, basketball } = body

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: 'Missing imageBase64' },
        { status: 400 }
      )
    }

    console.log('[BodyPix Crop API] Processing with keypoints:', keypoints ? Object.keys(keypoints) : 'none')
    console.log('[BodyPix Crop API] Basketball:', basketball)

    // Since BodyPix is heavy for server-side, we'll use the keypoints we already have
    // and calculate precise bounding boxes for each region
    
    if (!keypoints || Object.keys(keypoints).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No keypoints provided' },
        { status: 400 }
      )
    }

    // Helper to get keypoint or null
    const getKp = (name: string) => {
      const kp = keypoints[name]
      if (kp && kp.x > 0 && kp.y > 0) return kp
      return null
    }

    // Calculate bounding boxes for each region
    const regions: Array<{
      id: string
      name: string
      minX: number
      minY: number
      maxX: number
      maxY: number
    }> = []

    // Get all keypoints we need
    const leftWrist = getKp('left_wrist')
    const rightWrist = getKp('right_wrist')
    const leftElbow = getKp('left_elbow')
    const rightElbow = getKp('right_elbow')
    const leftShoulder = getKp('left_shoulder')
    const rightShoulder = getKp('right_shoulder')
    const nose = getKp('nose')
    const leftEye = getKp('left_eye')
    const rightEye = getKp('right_eye')
    const leftHip = getKp('left_hip')
    const rightHip = getKp('right_hip')
    const leftKnee = getKp('left_knee')
    const rightKnee = getKp('right_knee')
    const leftAnkle = getKp('left_ankle')
    const rightAnkle = getKp('right_ankle')

    // 0. MAIN SCREENSHOT: Full body - from head to feet
    const allBodyPoints = [
      nose, leftEye, rightEye,
      leftShoulder, rightShoulder,
      leftElbow, rightElbow,
      leftWrist, rightWrist,
      leftHip, rightHip,
      leftKnee, rightKnee,
      leftAnkle, rightAnkle
    ].filter(Boolean)
    
    if (allBodyPoints.length > 0) {
      const padding = 50
      regions.push({
        id: 'main-body',
        name: 'Full Body',
        minX: Math.min(...allBodyPoints.map(p => p!.x)) - padding,
        minY: Math.min(...allBodyPoints.map(p => p!.y)) - padding,
        maxX: Math.max(...allBodyPoints.map(p => p!.x)) + padding,
        maxY: Math.max(...allBodyPoints.map(p => p!.y)) + padding * 1.5  // Extra below for feet
      })
    }

    // 1. HANDS & RELEASE: Focus on BALL + BOTH HANDS with ALL FINGERS visible
    // The key is to include the basketball and extend well beyond wrists to capture fingertips
    if (rightWrist || leftWrist) {
      // Use wrists as anchor points, but we need to capture ABOVE them for fingers during release
      const wristPoints = [rightWrist, leftWrist].filter(Boolean)
      
      // Start with wrist positions
      let minX = Math.min(...wristPoints.map(p => p!.x))
      let maxX = Math.max(...wristPoints.map(p => p!.x))
      let minY = Math.min(...wristPoints.map(p => p!.y))
      let maxY = Math.max(...wristPoints.map(p => p!.y))
      
      // If we have a basketball, include it in the bounds
      if (basketball) {
        const ballRadius = basketball.radius || 50
        minX = Math.min(minX, basketball.x - ballRadius)
        maxX = Math.max(maxX, basketball.x + ballRadius)
        minY = Math.min(minY, basketball.y - ballRadius)
        maxY = Math.max(maxY, basketball.y + ballRadius)
      }
      
      // CRITICAL: Fingers extend ABOVE wrists during shooting release
      // Add significant padding ABOVE (negative Y direction) to capture fingertips
      const fingerExtensionAbove = 150  // Fingers extend above wrists
      const fingerExtensionBelow = 80   // Some extension below too
      const sidePadding = 80            // Side padding for full hand width
      
      regions.push({
        id: 'hands-area',
        name: 'Hands & Release',
        minX: minX - sidePadding,
        minY: minY - fingerExtensionAbove,  // ABOVE wrists to catch fingertips
        maxX: maxX + sidePadding,
        maxY: maxY + fingerExtensionBelow
      })
    }

    // 2. ANKLES & FEET: Include KNEES + ankles + floor space
    if (leftAnkle || rightAnkle || leftKnee || rightKnee) {
      const lowerBodyPoints = [leftAnkle, rightAnkle, leftKnee, rightKnee].filter(Boolean)
      if (lowerBodyPoints.length > 0) {
        const padding = 40
        const maxY = Math.max(...lowerBodyPoints.map(p => p!.y))
        regions.push({
          id: 'ankles-area',
          name: 'Legs & Feet',
          minX: Math.min(...lowerBodyPoints.map(p => p!.x)) - padding * 1.5,
          minY: Math.min(...lowerBodyPoints.map(p => p!.y)) - padding,  // Start from knees
          maxX: Math.max(...lowerBodyPoints.map(p => p!.x)) + padding * 1.5,
          maxY: maxY + padding * 2  // Extra space below for floor
        })
      }
    }

    // 3. ABS & HIPS: core area from shoulders to hips
    if (leftHip || rightHip || leftShoulder || rightShoulder) {
      const corePoints = [leftShoulder, rightShoulder, leftHip, rightHip].filter(Boolean)
      if (corePoints.length > 0) {
        const padding = 30
        regions.push({
          id: 'ball-area',
          name: 'Abs & Hips',
          minX: Math.min(...corePoints.map(p => p!.x)) - padding,
          minY: Math.min(...corePoints.map(p => p!.y)) - padding,
          maxX: Math.max(...corePoints.map(p => p!.x)) + padding,
          maxY: Math.max(...corePoints.map(p => p!.y)) + padding
        })
      }
    }

    console.log('[BodyPix Crop API] Calculated regions:', regions.map(r => ({
      id: r.id,
      bounds: { minX: r.minX, minY: r.minY, maxX: r.maxX, maxY: r.maxY },
      size: { w: r.maxX - r.minX, h: r.maxY - r.minY }
    })))

    // Now crop using Jimp
    const { Jimp } = await import('jimp')
    const imageBuffer = Buffer.from(imageBase64, 'base64')
    const image = await Jimp.read(imageBuffer)
    const imgW = image.width
    const imgH = image.height

    console.log('[BodyPix Crop API] Image size:', imgW, 'x', imgH)

    const croppedImages: Array<{ id: string; name: string; dataUrl: string }> = []

    for (const region of regions) {
      // Clamp to image bounds
      const cropX = Math.max(0, Math.round(region.minX))
      const cropY = Math.max(0, Math.round(region.minY))
      let cropW = Math.round(region.maxX - region.minX)
      let cropH = Math.round(region.maxY - region.minY)

      // Ensure within bounds
      if (cropX + cropW > imgW) cropW = imgW - cropX
      if (cropY + cropH > imgH) cropH = imgH - cropY

      // Minimum size
      cropW = Math.max(cropW, 100)
      cropH = Math.max(cropH, 100)

      console.log(`[BodyPix Crop API] Cropping ${region.id}:`, { cropX, cropY, cropW, cropH })

      try {
        const croppedImage = image.clone().crop({
          x: cropX,
          y: cropY,
          w: cropW,
          h: cropH
        })

        const pngBuffer = await croppedImage.getBuffer('image/png')
        const base64 = pngBuffer.toString('base64')
        const dataUrl = `data:image/png;base64,${base64}`

        croppedImages.push({
          id: region.id,
          name: region.name,
          dataUrl
        })
      } catch (cropError) {
        console.error(`[BodyPix Crop API] Error cropping ${region.id}:`, cropError)
      }
    }

    return NextResponse.json({
      success: true,
      images: croppedImages,
      regions: regions.map(r => ({
        id: r.id,
        bounds: { x: r.minX, y: r.minY, w: r.maxX - r.minX, h: r.maxY - r.minY }
      }))
    })

  } catch (error) {
    console.error('[BodyPix Crop API] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

