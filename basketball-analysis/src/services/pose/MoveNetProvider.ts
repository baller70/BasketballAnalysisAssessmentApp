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

/** Map a deterministic biomechanical joint score to a display status. */
function statusFromScore(score: number | undefined): JointStatus {
  if (score === undefined) return 'unknown'
  if (score >= 85) return 'good'
  if (score >= 60) return 'warning'
  return 'critical'
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
    }
  }
}
