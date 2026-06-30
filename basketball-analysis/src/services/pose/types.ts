/**
 * Pose Provider contract — the single seam every analysis mode (image, video,
 * live) flows through.
 *
 * WHY THIS EXISTS:
 * The app historically had TWO divergent engines: a server "hybrid" Hugging Face
 * Space (visionAnalysis.ts / PoseAnalysis.tsx) and an on-device TF.js MoveNet
 * detector (services/poseDetection.ts). They used different thresholds and
 * scoring, so results never matched across modes — and the Space is offline.
 *
 * The canonical engine is now on-device MoveNet (see ./MoveNetProvider.ts). All
 * scoring is delegated to lib/scoring/biomechanicalScoring.ts so a number the UI
 * shows is always one we actually computed from measured angles — never a
 * hardcoded default. A server "Pro" provider can be slotted in later behind this
 * same interface (see ./HybridApiProvider.ts) without touching callers.
 */

import type {
  BiomechanicalScores,
  JointName,
} from '@/lib/scoring/biomechanicalScoring'

/** Anything MoveNet (or a future provider) can run inference on. */
export type PoseInput = HTMLVideoElement | HTMLImageElement | HTMLCanvasElement

/**
 * A single detected body landmark. Coordinates are in the INPUT's pixel space
 * (e.g. naturalWidth/naturalHeight for an image element), `score` is 0–1
 * confidence.
 */
export interface ProviderKeypoint {
  name: string
  x: number
  y: number
  score: number
}

export type JointStatus = 'good' | 'warning' | 'critical' | 'unknown'

/**
 * Canonical shooting angles in degrees. `null` means the joint could not be
 * measured from the detected pose — it is NEVER defaulted to a fabricated value.
 */
export interface CanonicalAngles {
  elbow: number | null
  knee: number | null
  shoulder: number | null
  hip: number | null
  release: number | null
  wrist: number | null
}

/**
 * The canonical analysis shape every results UI and the flaw engine consume.
 * `scores` comes straight from biomechanicalScoring (deterministic). When
 * nothing could be measured `overallScore` is null and callers must surface an
 * empty/error state rather than a number.
 */
export interface FormAnalysis {
  angles: CanonicalAngles
  scores: BiomechanicalScores
  status: Record<JointName, JointStatus>
  /** Alias of scores.overallScore; null when no joints were measured. */
  overallScore: number | null
  /** Coaching tips derived from the measured angles. */
  tips: string[]
  /** How many joints contributed to the score (0 -> nothing detected). */
  measuredCount: number
}

/**
 * Pluggable pose engine. `detectPose` returns raw keypoints, `analyzeForm`
 * turns them into the canonical scored result. Splitting the two lets a caller
 * detect once and re-score, or score keypoints sourced elsewhere.
 */
export interface PoseProvider {
  /** Stable identifier, e.g. 'movenet' | 'hybrid-api'. */
  readonly id: string
  /** Human-readable label for diagnostics/UI. */
  readonly label: string
  /** Runs on-device by default (no network); a Pro provider may hit a server. */
  readonly onDevice: boolean
  /** Idempotent; safe to await repeatedly. */
  init(): Promise<void>
  isReady(): boolean
  detectPose(input: PoseInput): Promise<ProviderKeypoint[] | null>
  analyzeForm(keypoints: ProviderKeypoint[]): FormAnalysis
}

export type { JointName, BiomechanicalScores }
