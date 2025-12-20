/**
 * @file index.ts (Types)
 * @description Central TypeScript type definitions for the basketball analysis app
 * 
 * PURPOSE:
 * - Defines all shared interfaces and types
 * - Provides type safety across the application
 * - Documents data structures used throughout the codebase
 * 
 * CATEGORIES:
 * 
 * PLAYER & PROFILE:
 * - PlayerProfile - User profile information
 * - Position - Basketball position enum
 * - SkillLevel - Player skill level enum
 * - BodyType - Body type classification
 * 
 * ANALYSIS:
 * - AnalysisResult - Complete analysis result
 * - BiomechanicalMeasurement - Angle and position measurements
 * - Flaw - Detected shooting flaw
 * - FlawCategory, FlawSeverity - Flaw classification
 * - FormCategory - Overall form quality category
 * 
 * MEDIA:
 * - MediaType - "IMAGE" or "VIDEO"
 * - UploadFormData - Upload form data structure
 * 
 * POSE DETECTION:
 * - PoseKeypoint - Single pose keypoint
 * - PoseData - Complete pose detection result
 * - MediaPipeKeypoint - MediaPipe-specific keypoint
 * - SkeletonCallout - Annotation label for skeleton overlay
 * 
 * REPORTS:
 * - ReportTier - "BASIC" | "ULTRA" | "PREMIUM"
 * - Report - Generated report structure
 * 
 * ELITE SHOOTERS:
 * - EliteShooter - NBA shooter profile
 * 
 * USAGE:
 * import type { PlayerProfile, AnalysisResult, Flaw } from "@/types"
 */

export interface PlayerProfile {
  name: string
  email: string
  position?: Position
  skillLevel?: SkillLevel
  age?: number
  height?: string
  weight?: string
  wingspan?: string
  bodyType?: BodyType
}

export type Position =
  | "POINT_GUARD"
  | "SHOOTING_GUARD"
  | "SMALL_FORWARD"
  | "POWER_FORWARD"
  | "CENTER"
  | "GUARD"
  | "FORWARD"

export type SkillLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PROFESSIONAL"

export type BodyType =
  | "ECTOMORPH"
  | "MESOMORPH"
  | "ENDOMORPH"
  | "GUARD_BUILD"
  | "FORWARD_BUILD"
  | "CENTER_BUILD"

export type MediaType = "IMAGE" | "VIDEO"

export type ReportTier = "BASIC" | "ULTRA" | "PREMIUM"

export type AnalysisStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"

export type FormCategory = "OPTIMAL" | "GOOD" | "NEEDS_IMPROVEMENT" | "CRITICAL"

export type FlawSeverity = "MINOR" | "MODERATE" | "MAJOR" | "CRITICAL"

export type FlawCategory =
  | "SHOULDER_POSITION"
  | "ELBOW_ALIGNMENT"
  | "HIP_ANGLE"
  | "KNEE_BEND"
  | "ANKLE_POSITION"
  | "RELEASE_POINT"
  | "RELEASE_ANGLE"
  | "FOLLOW_THROUGH"
  | "BALANCE"
  | "TIMING"
  | "FOOTWORK"
  | "GUIDE_HAND"
  | "SET_POINT"
  | "OTHER"

export interface BiomechanicalMeasurement {
  shoulderAngle?: number
  elbowAngle?: number
  hipAngle?: number
  kneeAngle?: number
  ankleAngle?: number
  elbowHeight?: number
  releaseHeight?: number
  hipHeight?: number
  releaseAngle?: number
  entryAngle?: number
  verticalDisplacement?: number
  maxTrajectory?: number
  poseConfidence?: number
}

export interface Flaw {
  id: string
  category: FlawCategory
  severity: FlawSeverity
  title: string
  description: string
  affectedArea?: string
  currentValue?: number
  optimalRange?: string
  correction: string
  drills: string[]
  priority: number
}

export interface EliteShooter {
  id: string
  name: string
  team?: string
  position: Position
  height: string
  weight: string
  wingspan?: string
  bodyType: BodyType
  shootingStyle?: string
  releaseHeight?: number
  releaseAngle?: number
  elbowAngle?: number
  kneeAngle?: number
  shoulderAngle?: number
  hipAngle?: number
  ankleAngle?: number
  careerFGPercent?: number
  career3PPercent?: number
  ftPercent?: number
  imageUrls: string[]
  videoUrls: string[]
  description?: string
  keyStrengths: string[]
}

export interface AnalysisResult {
  id: string
  playerProfile: PlayerProfile
  mediaType: MediaType
  mediaUrl: string
  status: AnalysisStatus
  reportTier: ReportTier
  measurements?: BiomechanicalMeasurement
  overallScore?: number
  formCategory?: FormCategory
  matchedShooter?: EliteShooter
  similarityScore?: number
  flaws: Flaw[]
  createdAt: Date
  completedAt?: Date
}

export interface Report {
  id: string
  tier: ReportTier
  executiveSummary?: string
  detailedAnalysis?: Record<string, unknown>
  flawsAnalysis?: Record<string, unknown>
  corrections?: Record<string, unknown>
  trainingPlan?: Record<string, unknown>
  shooterComparison?: Record<string, unknown>
  pdfUrl?: string
}

export interface UploadFormData {
  mediaFile: File
  mediaType: MediaType
  playerProfile: PlayerProfile
  reportTier: ReportTier
}

// Pose detection keypoints
export interface PoseKeypoint {
  name: string
  x: number
  y: number
  confidence: number
  z?: number  // Depth for MediaPipe
}

export interface PoseData {
  keypoints: PoseKeypoint[]
  confidence: number
}

// MediaPipe-specific keypoint with full data
export interface MediaPipeKeypoint {
  name: string
  x: number       // 0-1 normalized
  y: number       // 0-1 normalized
  z: number       // Depth relative to hip midpoint
  visibility: number  // 0-1 visibility score
}

// Body part labels for callouts
export type BodyPartLabel =
  | 'WRISTS'
  | 'ELBOWS'
  | 'SHOULDERS'
  | 'CORE/ABS'
  | 'HIPS'
  | 'KNEES'
  | 'ANKLES'
  | 'Shoulder'
  | 'Elbow'
  | 'Wrist'
  | 'Hand'
  | 'Hip'
  | 'Knee'
  | 'Ankle'

// Callout annotation for skeleton overlay
export interface SkeletonCallout {
  label: BodyPartLabel
  keypointName: string
  position: 'left' | 'right'  // Which side of the skeleton to place the label
  offsetX: number
  offsetY: number
}

