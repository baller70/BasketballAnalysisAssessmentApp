/**
 * S3 Client Configuration
 * Works with AWS S3 locally and Abacus AI Cloud Storage in production
 */

import { S3Client } from "@aws-sdk/client-s3"

// S3 Configuration
export const S3_CONFIG = {
  bucket: process.env.S3_BUCKET_NAME || "basketball-shooters-db",
  region: process.env.AWS_REGION || "us-east-1",
}

// Create S3 Client
export const s3Client = new S3Client({
  region: S3_CONFIG.region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
})

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
  return `https://${S3_CONFIG.bucket}.s3.${S3_CONFIG.region}.amazonaws.com/${path}`
}







