/**
 * S3 Client Configuration
 * Works with AWS S3 locally and Abacus AI Cloud Storage in production
 */

import { S3Client } from "@aws-sdk/client-s3"

// S3 Configuration
// Accept both the S3_* naming and the legacy AWS_* naming used by the
// Abacus.AI hosted-storage convention (AWS_BUCKET_NAME / AWS_FOLDER_PREFIX),
// so the app works in either environment without manual env juggling.
export const S3_CONFIG = {
  bucket:
    process.env.S3_BUCKET_NAME ||
    process.env.AWS_BUCKET_NAME ||
    "basketball-shooters-db",
  region: process.env.AWS_REGION || "us-east-1",
  // Custom S3-compatible endpoint (e.g. Cloudflare R2 / MinIO). Empty = real AWS S3.
  endpoint: process.env.S3_ENDPOINT || "",
  // Optional key prefix so this app's objects are namespaced inside a shared bucket.
  keyPrefix: process.env.S3_KEY_PREFIX || process.env.AWS_FOLDER_PREFIX || "",
}

// Only pass explicit static credentials when BOTH are supplied. Otherwise omit
// the `credentials` key entirely so the AWS SDK falls back to its default
// provider chain (shared config via AWS_PROFILE, env vars, instance roles, etc.).
// Forcing empty-string credentials — as before — broke that chain and made all
// uploads fail in hosted environments that authenticate via AWS_PROFILE.
const hasExplicitCredentials = Boolean(
  process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
)

// Create S3 Client. When S3_ENDPOINT is set (R2/MinIO/etc.) switch to that
// endpoint with path-style addressing, which those providers require.
export const s3Client = new S3Client({
  region: S3_CONFIG.region,
  ...(S3_CONFIG.endpoint
    ? { endpoint: S3_CONFIG.endpoint, forcePathStyle: true }
    : {}),
  ...(hasExplicitCredentials
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
        },
      }
    : {}),
})

/**
 * Prepend the configured key prefix (S3_KEY_PREFIX) to a logical object key.
 * No-op when unset. Applied at the storage boundary so the rest of the app
 * always works with un-prefixed (logical) paths.
 */
export function withKeyPrefix(path: string): string {
  const pre = S3_CONFIG.keyPrefix.replace(/\/+$/, "")
  return pre ? `${pre}/${path}` : path
}

/** Inverse of withKeyPrefix: strip the prefix off a key returned by S3. */
export function stripKeyPrefix(key: string): string {
  const pre = S3_CONFIG.keyPrefix.replace(/\/+$/, "")
  return pre && key.startsWith(`${pre}/`) ? key.slice(pre.length + 1) : key
}

// Folder structure constants
export const S3_FOLDERS = {
  // Professional shooters
  PROFESSIONAL: {
    NBA: "professional-shooters/nba",
    WNBA: "professional-shooters/wnba",
    INTERNATIONAL: "professional-shooters/international",
  },
  // Amateur shooters
  AMATEUR: {
    HIGH_SCHOOL: "amateur-shooters/high-school",
    COLLEGE: "amateur-shooters/college",
    RECREATIONAL: "amateur-shooters/recreational",
  },
  // User uploads
  USER_UPLOADS: "user-uploads",
}

// Shooting angles (folder names)
export const SHOOTING_ANGLES = {
  FRONT: "front-angle",
  SIDE: "side-angle",
  DEGREE_45: "45-degree",
} as const

// Capture phases (filenames)
export const CAPTURE_PHASES = {
  SETUP: "setup",
  DIP: "dip",
  RELEASE: "release",
  FOLLOW_THROUGH: "follow-through",
} as const

/**
 * Generate S3 path for a shooter's image
 * 
 * Structure: professional-shooters/nba/stephen-curry/front-angle/release.jpg
 * 
 * @param skillLevel - "professional" or "amateur"
 * @param league - "nba", "wnba", "college", etc.
 * @param shooterName - Player name (e.g., "Stephen Curry")
 * @param angle - "front", "side", or "45-degree"
 * @param phase - "setup", "dip", "release", or "follow-through" (optional)
 * @param filename - Custom filename (defaults to phase.jpg)
 */
export function generateShooterImagePath(
  skillLevel: "professional" | "amateur",
  league: string,
  shooterName: string,
  angle: string,
  phase?: string,
  filename?: string
): string {
  // Sanitize shooter name for path (lowercase, replace spaces with hyphens)
  const sanitizedName = shooterName.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "")
  const sanitizedLeague = league.toLowerCase()
  
  // Format angle folder name
  const angleFolder = angle.includes("-") ? angle : `${angle}-angle`
  
  // Generate filename (default: phase.jpg)
  const finalFilename = filename || (phase ? `${phase}.jpg` : "image.jpg")
  
  // Build path: professional-shooters/nba/stephen-curry/front-angle/release.jpg
  const baseFolder = skillLevel === "professional" ? "professional-shooters" : "amateur-shooters"
  
  return `${baseFolder}/${sanitizedLeague}/${sanitizedName}/${angleFolder}/${finalFilename}`
}

/**
 * Generate S3 path for user upload
 */
export function generateUserUploadPath(
  userId: string,
  sessionId: string,
  filename: string
): string {
  return `user-uploads/user-${userId}/session-${sessionId}/${filename}`
}

/**
 * Get the full S3 URL for an object
 */
export function getS3Url(path: string): string {
  // Path-style URL for custom endpoints (R2/MinIO); virtual-hosted for AWS.
  if (S3_CONFIG.endpoint) {
    const base = S3_CONFIG.endpoint.replace(/\/+$/, "")
    return `${base}/${S3_CONFIG.bucket}/${path}`
  }
  return `https://${S3_CONFIG.bucket}.s3.${S3_CONFIG.region}.amazonaws.com/${path}`
}







