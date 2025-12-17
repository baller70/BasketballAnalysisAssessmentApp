/**
 * S3 Client Configuration
 * Works with Abacus AI Cloud Storage
 */

import { S3Client } from "@aws-sdk/client-s3"

// S3 Configuration
export const S3_CONFIG = {
  bucket: process.env.AWS_BUCKET_NAME || "basketball-shooters-db",
  region: process.env.AWS_REGION || "us-west-2",
}

// Create S3 Client - Abacus AI handles credentials automatically
export const s3Client = new S3Client({
  region: S3_CONFIG.region,
})

// Folder structure constants
export const S3_FOLDERS = {
  PROFESSIONAL: {
    NBA: "professional-shooters/nba",
    WNBA: "professional-shooters/wnba",
    INTERNATIONAL: "professional-shooters/international",
  },
  AMATEUR: {
    HIGH_SCHOOL: "amateur-shooters/high-school",
    COLLEGE: "amateur-shooters/college",
    RECREATIONAL: "amateur-shooters/recreational",
  },
  USER_UPLOADS: "user-uploads",
}

export const SHOOTING_ANGLES = {
  FRONT: "front-angle",
  SIDE: "side-angle",
  DEGREE_45: "45-degree",
} as const

export const CAPTURE_PHASES = {
  SETUP: "setup",
  DIP: "dip",
  RELEASE: "release",
  FOLLOW_THROUGH: "follow-through",
} as const

export function generateShooterImagePath(
  skillLevel: "professional" | "amateur",
  league: string,
  shooterName: string,
  angle: string,
  filename: string,
  _phase?: string
): string {
  const sanitizedName = shooterName.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "")
  const sanitizedLeague = league.toLowerCase()
  const angleFolder = angle.includes("-") ? angle : `${angle}-angle`
  const baseFolder = skillLevel === "professional" ? "professional-shooters" : "amateur-shooters"
  
  return `${baseFolder}/${sanitizedLeague}/${sanitizedName}/${angleFolder}/${filename}`
}

export function generateUserUploadPath(
  userId: string,
  sessionId: string,
  filename: string
): string {
  return `user-uploads/user-${userId}/session-${sessionId}/${filename}`
}

export function getS3Url(path: string): string {
  return `https://${S3_CONFIG.bucket}.s3.${S3_CONFIG.region}.amazonaws.com/${path}`
}
