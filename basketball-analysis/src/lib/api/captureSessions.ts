import { z } from "zod"

const optionalText = z.string().trim().min(1).max(255).optional()

export const captureObservationSchema = z.object({
  timestampMs: z.number().int().min(0),
  orientation: z.enum(["upright", "sideways", "unknown"]).optional(),
  poseConfidence: z.number().min(0).max(1).optional(),
  fullBodyVisible: z.boolean().optional(),
  subjectFrameRatio: z.number().min(0).max(2).optional(),
  stable: z.boolean().optional(),
  lighting: z.enum(["good", "low", "unknown"]).optional(),
  hoopVisible: z.boolean().optional(),
  ballVisible: z.boolean().optional(),
  keypoints: z.unknown().optional(),
})

export const createCaptureSessionSchema = z.object({
  mode: z.enum(["form", "shot_tracking"]),
  source: z.enum(["live", "uploaded_video", "image"]),
  platform: z.enum(["ios", "android", "web", "desktop"]),
  deviceModel: optionalText,
  cameraFacing: z.enum(["front", "rear", "unknown"]).optional(),
  orientation: z.enum(["portrait", "landscape"]).optional(),
  view: z.enum(["front", "side", "diagonal", "unknown"]).optional(),
  shootingHand: z.enum(["right", "left", "unknown"]).optional(),
  poseProvider: optionalText,
  poseModel: optionalText,
  readinessStatus: z.enum([
    "checking",
    "needs_attention",
    "ready",
    "recording",
    "completed",
    "failed",
  ]).default("checking"),
  readinessChecks: z.unknown().optional(),
  frameWidth: z.number().int().positive().max(16384).optional(),
  frameHeight: z.number().int().positive().max(16384).optional(),
  startedAt: z.coerce.date().optional(),
  observation: captureObservationSchema.optional(),
})

export const updateCaptureSessionSchema = z.object({
  readinessStatus: z.enum([
    "checking",
    "needs_attention",
    "ready",
    "recording",
    "completed",
    "failed",
  ]).optional(),
  readinessChecks: z.unknown().optional(),
  orientation: z.enum(["portrait", "landscape"]).optional(),
  view: z.enum(["front", "side", "diagonal", "unknown"]).optional(),
  poseProvider: optionalText,
  poseModel: optionalText,
  frameWidth: z.number().int().positive().max(16384).optional(),
  frameHeight: z.number().int().positive().max(16384).optional(),
  endedAt: z.coerce.date().nullable().optional(),
  observation: captureObservationSchema.optional(),
})

export type CreateCaptureSessionInput = z.input<typeof createCaptureSessionSchema>
export type UpdateCaptureSessionInput = z.input<typeof updateCaptureSessionSchema>
