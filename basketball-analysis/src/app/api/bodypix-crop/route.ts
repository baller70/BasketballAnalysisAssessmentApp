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

    // 1. HAND POSITION: Close-up of hand placement on the ball
    if (rightWrist || leftWrist) {
      const wristPoints = [rightWrist, leftWrist].filter(Boolean)
      
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
      
      const fingerExtensionAbove = 120
      const fingerExtensionBelow = 60
      const sidePadding = 70
      
      regions.push({
        id: 'hands-area',
        name: 'Hand Position',
        minX: minX - sidePadding,
        minY: minY - fingerExtensionAbove,
        maxX: maxX + sidePadding,
        maxY: maxY + fingerExtensionBelow
      })
    }

    // 2. RELEASE POINT: The release mechanics including elbow and wrist
    if ((rightWrist || leftWrist) && (rightElbow || leftElbow)) {
      // Determine shooting hand (typically right, but check which wrist is higher)
      const shootingWrist = rightWrist && leftWrist 
        ? (rightWrist.y < leftWrist.y ? rightWrist : leftWrist)
        : (rightWrist || leftWrist)
      const shootingElbow = rightWrist && leftWrist
        ? (rightWrist.y < leftWrist.y ? rightElbow : leftElbow)
        : (rightElbow || leftElbow)
      
      if (shootingWrist && shootingElbow) {
        const padding = 100
        regions.push({
          id: 'release-area',
          name: 'Release Point',
          minX: Math.min(shootingWrist.x, shootingElbow.x) - padding,
          minY: Math.min(shootingWrist.y, shootingElbow.y) - padding * 1.5,
          maxX: Math.max(shootingWrist.x, shootingElbow.x) + padding,
          maxY: Math.max(shootingWrist.y, shootingElbow.y) + padding * 0.5
        })
      }
    }

    // 3. UPPER BODY: Shoulders and shooting arm alignment
    if (leftShoulder || rightShoulder) {
      const upperBodyPoints = [leftShoulder, rightShoulder, leftElbow, rightElbow].filter(Boolean)
      if (upperBodyPoints.length > 0) {
        const padding = 50
        regions.push({
          id: 'upper-body',
          name: 'Upper Body',
          minX: Math.min(...upperBodyPoints.map(p => p!.x)) - padding,
          minY: Math.min(...upperBodyPoints.map(p => p!.y)) - padding,
          maxX: Math.max(...upperBodyPoints.map(p => p!.x)) + padding,
          maxY: Math.max(...upperBodyPoints.map(p => p!.y)) + padding * 1.5
        })
      }
    }

    console.log('[BodyPix Crop API] Calculated regions:', regions.map(r => ({
      id: r.id,
      bounds: { minX: r.minX, minY: r.minY, maxX: r.maxX, maxY: r.maxY },
      size: { w: r.maxX - r.minX, h: r.maxY - r.minY }
    })))

    // Now crop using Sharp (supports WebP, PNG, JPEG, etc.)
    const sharp = (await import('sharp')).default
    const imageBuffer = Buffer.from(imageBase64, 'base64')
    
    let imgW: number
    let imgH: number
    
    try {
      const metadata = await sharp(imageBuffer).metadata()
      imgW = metadata.width || 0
      imgH = metadata.height || 0
      console.log('[BodyPix Crop API] Image size:', imgW, 'x', imgH, 'format:', metadata.format)
    } catch (sharpError) {
      console.error('[BodyPix Crop API] Sharp error:', sharpError)
      return NextResponse.json(
        { success: false, error: `Failed to load image: ${sharpError instanceof Error ? sharpError.message : 'Unknown error'}` },
        { status: 500 }
      )
    }
    
    if (imgW <= 0 || imgH <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid image dimensions' },
        { status: 400 }
      )
    }

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
      
      // Ensure we don't go negative
      if (cropW <= 0) cropW = Math.min(100, imgW - cropX)
      if (cropH <= 0) cropH = Math.min(100, imgH - cropY)
      
      // If still invalid, skip this region
      if (cropW <= 0 || cropH <= 0 || cropX >= imgW || cropY >= imgH) {
        console.log(`[BodyPix Crop API] Skipping ${region.id} - invalid bounds after clamping`)
        continue
      }

      // Minimum size (but don't exceed image bounds)
      cropW = Math.min(Math.max(cropW, 50), imgW - cropX)
      cropH = Math.min(Math.max(cropH, 50), imgH - cropY)

      console.log(`[BodyPix Crop API] Cropping ${region.id}:`, { cropX, cropY, cropW, cropH, imgW, imgH })

      try {
        const croppedBuffer = await sharp(imageBuffer)
          .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
          .png()
          .toBuffer()

        const base64 = croppedBuffer.toString('base64')
        const dataUrl = `data:image/png;base64,${base64}`

        croppedImages.push({
          id: region.id,
          name: region.name,
          dataUrl
        })
        console.log(`[BodyPix Crop API] Successfully cropped ${region.id}`)
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

