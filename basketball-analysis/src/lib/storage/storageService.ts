/**
 * Storage Service
 * Handles image uploads, downloads, and management for S3/Abacus AI Cloud Storage
 */

import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import {
  s3Client,
  S3_CONFIG,
  generateShooterImagePath,
  generateUserUploadPath,
  getS3Url,
  withKeyPrefix,
  stripKeyPrefix,
} from "./s3Client"

/**
 * Normalize an incoming media payload into a Buffer + content type.
 * Accepts a raw Buffer, a data-URL string ("data:image/png;base64,...."), or a
 * bare base64 string. This is the single boundary where base64 (the legacy
 * client format that previously lived only in localStorage) becomes bytes.
 */
function normalizeMedia(
  input: Buffer | string,
  fallbackContentType: string
): { body: Buffer; contentType: string } {
  if (Buffer.isBuffer(input)) {
    return { body: input, contentType: fallbackContentType }
  }
  const match = /^data:([^;]+);base64,([\s\S]*)$/.exec(input)
  if (match) {
    return { body: Buffer.from(match[2], "base64"), contentType: match[1] }
  }
  // Bare base64 (no data-URL header).
  return { body: Buffer.from(input, "base64"), contentType: fallbackContentType }
}

/**
 * uploadMedia — the canonical server-side media upload used by Wave-1 features
 * (analysis images, settings avatars, drill videos). Stores `input` at `key`
 * in the configured object store (S3 / R2) and returns its public URL.
 *
 * @param input  A Buffer, a data-URL string, or a bare base64 string.
 * @param key    Logical (un-prefixed) object key, e.g.
 *               "user-uploads/<profileId>/<file>.jpg". The configured
 *               S3_KEY_PREFIX is applied automatically.
 * @param contentType  Optional MIME type. Inferred from a data-URL when
 *               present; otherwise defaults to "application/octet-stream".
 * @returns      The public URL of the stored object.
 * @throws       On upload failure (callers should handle/fallback).
 */
export async function uploadMedia(
  input: Buffer | string,
  key: string,
  contentType?: string
): Promise<string> {
  if (!key) throw new Error("uploadMedia: key is required")

  const { body, contentType: resolved } = normalizeMedia(
    input,
    contentType || "application/octet-stream"
  )

  const command = new PutObjectCommand({
    Bucket: S3_CONFIG.bucket,
    Key: withKeyPrefix(key),
    Body: body,
    ContentType: contentType || resolved,
  })

  await s3Client.send(command)

  return getS3Url(withKeyPrefix(key))
}

export interface UploadResult {
  success: boolean
  path?: string
  url?: string
  error?: string
}

export interface ImageMetadata {
  shooterId?: number
  imageCategory?: string
  capturePhase?: string
  shootingAngle?: string
  resolution?: string
}

/**
 * Upload an image to S3
 */
export async function uploadImage(
  file: Buffer | Blob,
  path: string,
  contentType: string = "image/jpeg",
  metadata?: ImageMetadata
): Promise<UploadResult> {
  try {
    // Convert Blob to Buffer if needed
    let body: Buffer
    if (file instanceof Blob) {
      const arrayBuffer = await file.arrayBuffer()
      body = Buffer.from(arrayBuffer)
    } else {
      body = file
    }

    const command = new PutObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: withKeyPrefix(path),
      Body: body,
      ContentType: contentType,
      Metadata: metadata
        ? {
            shooterId: metadata.shooterId?.toString() || "",
            imageCategory: metadata.imageCategory || "",
            capturePhase: metadata.capturePhase || "",
            shootingAngle: metadata.shootingAngle || "",
            resolution: metadata.resolution || "",
          }
        : undefined,
    })

    await s3Client.send(command)

    return {
      success: true,
      path,
      url: getS3Url(withKeyPrefix(path)),
    }
  } catch (error) {
    console.error("S3 upload error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    }
  }
}

/**
 * Upload a shooter's image with proper path structure
 */
export async function uploadShooterImage(
  file: Buffer | Blob,
  skillLevel: "professional" | "amateur",
  league: string,
  shooterName: string,
  angle: string,
  filename: string,
  metadata?: ImageMetadata
): Promise<UploadResult> {
  const path = generateShooterImagePath(skillLevel, league, shooterName, angle, filename)
  return uploadImage(file, path, "image/jpeg", metadata)
}

/**
 * Upload a user's session image
 */
export async function uploadUserImage(
  file: Buffer | Blob,
  userId: string,
  sessionId: string,
  filename: string,
  metadata?: ImageMetadata
): Promise<UploadResult> {
  const path = generateUserUploadPath(userId, sessionId, filename)
  return uploadImage(file, path, "image/jpeg", metadata)
}

/**
 * Get a signed URL for temporary access to an image
 * Expires after specified seconds (default 1 hour)
 */
export async function getSignedImageUrl(
  path: string,
  expiresInSeconds: number = 3600
): Promise<string | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: withKeyPrefix(path),
    })

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: expiresInSeconds,
    })

    return signedUrl
  } catch (error) {
    console.error("Error generating signed URL:", error)
    return null
  }
}

/**
 * Delete an image from S3
 */
export async function deleteImage(path: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: withKeyPrefix(path),
    })

    await s3Client.send(command)
    return true
  } catch (error) {
    console.error("S3 delete error:", error)
    return false
  }
}

/**
 * List all images for a shooter
 */
export async function listShooterImages(
  skillLevel: "professional" | "amateur",
  league: string,
  shooterName: string
): Promise<string[]> {
  try {
    const sanitizedName = shooterName.toLowerCase().replace(/\s+/g, "-")
    const prefix =
      skillLevel === "professional"
        ? `professional-shooters/${league.toLowerCase()}/${sanitizedName}/`
        : `amateur-shooters/${league.toLowerCase()}/${sanitizedName}/`

    const command = new ListObjectsV2Command({
      Bucket: S3_CONFIG.bucket,
      Prefix: withKeyPrefix(prefix),
    })

    const response = await s3Client.send(command)
    return response.Contents?.map((item) => stripKeyPrefix(item.Key || "")) || []
  } catch (error) {
    console.error("S3 list error:", error)
    return []
  }
}

/**
 * List all images for a user session
 */
export async function listUserSessionImages(
  userId: string,
  sessionId: string
): Promise<string[]> {
  try {
    const prefix = `user-uploads/user-${userId}/session-${sessionId}/`

    const command = new ListObjectsV2Command({
      Bucket: S3_CONFIG.bucket,
      Prefix: withKeyPrefix(prefix),
    })

    const response = await s3Client.send(command)
    return response.Contents?.map((item) => stripKeyPrefix(item.Key || "")) || []
  } catch (error) {
    console.error("S3 list error:", error)
    return []
  }
}

/**
 * Check if an image exists in S3
 */
export async function imageExists(path: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: withKeyPrefix(path),
    })

    await s3Client.send(command)
    return true
  } catch {
    return false
  }
}

/**
 * Get image metadata
 */
export async function getImageMetadata(
  path: string
): Promise<ImageMetadata | null> {
  try {
    const command = new HeadObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: withKeyPrefix(path),
    })

    const response = await s3Client.send(command)

    if (response.Metadata) {
      return {
        shooterId: response.Metadata.shooterId
          ? parseInt(response.Metadata.shooterId)
          : undefined,
        imageCategory: response.Metadata.imageCategory,
        capturePhase: response.Metadata.capturePhase,
        shootingAngle: response.Metadata.shootingAngle,
        resolution: response.Metadata.resolution,
      }
    }

    return null
  } catch (error) {
    console.error("Error getting metadata:", error)
    return null
  }
}

/**
 * Convert base64 image to Buffer for upload
 */
export function base64ToBuffer(base64: string): Buffer {
  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, "")
  return Buffer.from(base64Data, "base64")
}

/**
 * Generate a unique filename with timestamp
 */
export function generateUniqueFilename(
  originalName: string,
  prefix?: string
): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split(".").pop() || "jpg"
  const baseName = prefix || originalName.split(".")[0].substring(0, 20)
  return `${baseName}-${timestamp}-${random}.${extension}`
}







