/**
 * Image Upload API Route
 * Handles uploading images to S3/Cloud Storage
 */

import { NextRequest, NextResponse } from "next/server"
import {
  uploadShooterImage,
  uploadUserImage,
  base64ToBuffer,
  generateUniqueFilename,
} from "@/lib/storage"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Get upload type
    const uploadType = formData.get("uploadType") as string // "shooter" or "user"
    const imageFile = formData.get("image") as File | null
    const base64Image = formData.get("base64Image") as string | null

    if (!imageFile && !base64Image) {
      return NextResponse.json(
        { success: false, error: "No image provided" },
        { status: 400 }
      )
    }

    // Convert to Buffer
    let imageBuffer: Buffer
    let filename: string

    if (imageFile) {
      const arrayBuffer = await imageFile.arrayBuffer()
      imageBuffer = Buffer.from(arrayBuffer)
      filename = generateUniqueFilename(imageFile.name)
    } else if (base64Image) {
      imageBuffer = base64ToBuffer(base64Image)
      filename = generateUniqueFilename("upload.jpg")
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid image data" },
        { status: 400 }
      )
    }

    // Handle shooter image upload
    if (uploadType === "shooter") {
      const skillLevel = formData.get("skillLevel") as "professional" | "amateur"
      const league = formData.get("league") as string
      const shooterName = formData.get("shooterName") as string
      const angle = formData.get("angle") as string
      const shooterId = formData.get("shooterId") as string
      const imageCategory = formData.get("imageCategory") as string
      const capturePhase = formData.get("capturePhase") as string

      if (!skillLevel || !league || !shooterName || !angle) {
        return NextResponse.json(
          { success: false, error: "Missing required fields for shooter upload" },
          { status: 400 }
        )
      }

      const result = await uploadShooterImage(
        imageBuffer,
        skillLevel,
        league,
        shooterName,
        angle,
        filename,
        {
          shooterId: shooterId ? parseInt(shooterId) : undefined,
          imageCategory,
          capturePhase,
          shootingAngle: angle,
        }
      )

      return NextResponse.json(result)
    }

    // Handle user session upload
    if (uploadType === "user") {
      const userId = formData.get("userId") as string
      const sessionId = formData.get("sessionId") as string

      if (!userId || !sessionId) {
        return NextResponse.json(
          { success: false, error: "Missing userId or sessionId" },
          { status: 400 }
        )
      }

      const result = await uploadUserImage(
        imageBuffer,
        userId,
        sessionId,
        filename
      )

      return NextResponse.json(result)
    }

    // Default: just upload with a generated path
    const { uploadImage } = await import("@/lib/storage")
    const result = await uploadImage(
      imageBuffer,
      `uploads/${filename}`,
      "image/jpeg"
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    )
  }
}







