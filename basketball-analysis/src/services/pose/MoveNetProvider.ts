/**
 * MoveNetProvider — the canonical, on-device pose engine.
 *
 * Wraps the existing TF.js MoveNet detector (services/poseDetection.ts) behind
 * the PoseProvider interface and routes all scoring through
 * lib/scoring/biomechanicalScoring.ts. This is the DEFAULT provider used by
 * image, video, and live analysis so every mode produces identical numbers from
 * identical input.
 */

import {
  poseDetectionService,
  KEYPOINT_INDICES,
  type Pose,
  type ModelType,
} from '@/services/poseDetection'
import {
  scoreShootingForm,
  type JointName,
} from '@/lib/scoring/biomechanicalScoring'
import type {
  PoseProvider,
  PoseInput,
  ProviderKeypoint,
  CanonicalAngles,
  FormAnalysis,
  JointStatus,
} from './types'

const KEYPOINT_NAMES: string[] = Object.keys(
  KEYPOINT_INDICES
) as (keyof typeof KEYPOINT_INDICES)[]

/**
 * Minimum keypoint confidence for a derived signal to be trusted. Mirrors the
 * default in poseDetection.getKeypoint so the pose-level signals here agree with
 * the joint-angle math. Below this we omit the signal entirely — never fake it.
 */
const MIN_SIGNAL_SCORE = 0.3

/**
 * Extra, keypoint-derived pose signals that aren't joint angles: frontal
 * shoulder/hip tilt (deviation from level) and a true ball-launch arc. These are
 * carried on FormAnalysis so the canonical record (formAnglesToRecord) can emit
 * them for the flaw engine without every caller having to re-pass keypoints.
 * Each is null when its underlying keypoints aren't confident enough to measure.
 */
export interface PoseSignals {
  /** Shoulder-line deviation from horizontal, degrees, 0 = perfectly level. */
  shoulderTilt: number | null
  /** Hip-line deviation from horizontal, degrees, 0 = perfectly level. */
  hipTilt: number | null
  /**
   * Ball-launch arc: elevation of the shooting forearm above horizontal at
   * release, degrees (0 = flat/horizontal, ~50° = a healthy arc). A genuine
   * launch angle, distinct from the canonical `release` (deviation from vertical).
   */
  launchArc: number | null
}

declare module './types' {
  interface FormAnalysis {
    /** Keypoint-derived non-joint signals; see PoseSignals. */
    poseSignals?: PoseSignals
  }
}

/** Map a deterministic biomechanical joint score to a display status. */
function statusFromScore(score: number | undefined): JointStatus {
  if (score === undefined) return 'unknown'
  if (score >= 85) return 'good'
  if (score >= 60) return 'warning'
  return 'critical'
}

/** A keypoint looked up by name, or null when missing / below confidence. */
function confidentKeypoint(
  keypoints: ProviderKeypoint[],
  name: string
): ProviderKeypoint | null {
  const kp = keypoints.find((k) => k.name === name)
  return kp && kp.score >= MIN_SIGNAL_SCORE ? kp : null
}

/**
 * Deviation-from-level of the line through a left/right keypoint pair, in
 * degrees folded to 0–90 (0 = level). Sign/ordering independent, so it reads the
 * same whether the shooter faces left or right. Null if either point is missing.
 */
function levelTilt(
  a: ProviderKeypoint | null,
  b: ProviderKeypoint | null
): number | null {
  if (!a || !b) return null
  const angleFromHorizontal = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
  let deviation = Math.abs(angleFromHorizontal)
  if (deviation > 90) deviation = 180 - deviation
  return Math.round(deviation)
}

/**
 * True ball-launch arc from the shooting-side forearm: the angle of the
 * elbow→wrist vector above horizontal at release. Shooting side is auto-detected
 * as the higher wrist (same convention as calculateShootingAngles). Null unless
 * both that elbow and wrist are confidently detected.
 */
function launchArcAngle(keypoints: ProviderKeypoint[]): number | null {
  const rightWrist = confidentKeypoint(keypoints, 'right_wrist')
  const leftWrist = confidentKeypoint(keypoints, 'left_wrist')

  let side: 'right' | 'left' = 'right'
  if (rightWrist && leftWrist) {
    side = rightWrist.y < leftWrist.y ? 'right' : 'left'
  } else if (leftWrist && !rightWrist) {
    side = 'left'
  }

  const elbow = confidentKeypoint(keypoints, `${side}_elbow`)
  const wrist = confidentKeypoint(keypoints, `${side}_wrist`)
  if (!elbow || !wrist) return null

  const rise = elbow.y - wrist.y // +ve when the wrist is above the elbow (y grows downward)
  const run = Math.abs(wrist.x - elbow.x)
  return Math.round((Math.atan2(rise, run) * 180) / Math.PI)
}

/** Compute the keypoint-derived pose signals (tilts + launch arc). */
function computePoseSignals(keypoints: ProviderKeypoint[]): PoseSignals {
  return {
    shoulderTilt: levelTilt(
      confidentKeypoint(keypoints, 'left_shoulder'),
      confidentKeypoint(keypoints, 'right_shoulder')
    ),
    hipTilt: levelTilt(
      confidentKeypoint(keypoints, 'left_hip'),
      confidentKeypoint(keypoints, 'right_hip')
    ),
    launchArc: launchArcAngle(keypoints),
  }
}

export class MoveNetProvider implements PoseProvider {
  readonly id = 'movenet'
  readonly label = 'On-device MoveNet'
  readonly onDevice = true

  private modelType: ModelType

  constructor(modelType: ModelType = 'lightning') {
    this.modelType = modelType
  }

  async init(): Promise<void> {
    await poseDetectionService.initialize(this.modelType)
  }

  isReady(): boolean {
    return poseDetectionService.isReady()
  }

  async detectPose(input: PoseInput): Promise<ProviderKeypoint[] | null> {
    if (!poseDetectionService.isReady()) {
      await this.init()
    }
    const pose = await poseDetectionService.detectPose(input)
    if (!pose) return null

    return pose.keypoints.map((kp, i) => ({
      name: kp.name ?? KEYPOINT_NAMES[i] ?? `kp_${i}`,
      x: kp.x,
      y: kp.y,
      score: kp.score ?? 0,
    }))
  }

  analyzeForm(keypoints: ProviderKeypoint[]): FormAnalysis {
    // Reconstruct a Pose in MoveNet index order so the existing angle math
    // (which indexes by KEYPOINT_INDICES) keeps working.
    const ordered: Pose['keypoints'] = KEYPOINT_NAMES.map((name) => {
      const found = keypoints.find((k) => k.name === name)
      return found
        ? { x: found.x, y: found.y, score: found.score, name }
        : { x: 0, y: 0, score: 0, name }
    })
    const pose: Pose = { keypoints: ordered }

    const measured = poseDetectionService.calculateShootingAngles(pose)
    const angles: CanonicalAngles = {
      elbow: measured.elbowAngle,
      knee: measured.kneeAngle,
      shoulder: measured.shoulderAngle,
      hip: measured.hipAngle,
      release: measured.releaseAngle,
      wrist: measured.wristAngle,
    }

    // Deterministic scoring — the single source of truth for the numbers shown.
    const scores = scoreShootingForm(angles)

    // Status mirrors the score band so the UI's colour and number agree.
    const status = {} as Record<JointName, JointStatus>
    ;(Object.keys(angles) as JointName[]).forEach((joint) => {
      status[joint] = statusFromScore(scores.perJoint[joint])
    })

    // Reuse the existing coaching-tip generation for the human-readable advice
    // (the numeric overallScore there is intentionally ignored in favour of the
    // biomechanical score above).
    const tips = poseDetectionService.analyzeShootingForm(measured).tips

    return {
      angles,
      scores,
      status,
      overallScore: scores.overallScore,
      tips,
      measuredCount: scores.measuredCount,
      // Non-joint signals (shoulder/hip tilt, ball-launch arc) for the flaw
      // engine. Computed from the raw keypoints + confidences, omitted when not
      // measurable — never defaulted.
      poseSignals: computePoseSignals(keypoints),
    }
  }
}
