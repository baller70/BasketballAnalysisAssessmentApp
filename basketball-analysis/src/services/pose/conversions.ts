import type { Pose } from '@/services/poseDetection'

import type { ProviderKeypoint } from './types'

/** MoveNet's canonical 17-joint ordering. */
export const CANONICAL_KEYPOINT_NAMES = [
  'nose',
  'left_eye',
  'right_eye',
  'left_ear',
  'right_ear',
  'left_shoulder',
  'right_shoulder',
  'left_elbow',
  'right_elbow',
  'left_wrist',
  'right_wrist',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
] as const

interface PoseMetadata {
  id?: number
  score?: number
}

/**
 * Convert provider output back into the stable MoveNet shape used by ShotIQ's
 * existing overlays and live metrics. Missing joints stay explicitly at zero
 * confidence so downstream code never mistakes an invented point for a body.
 */
export function providerKeypointsToPose(
  keypoints: ProviderKeypoint[],
  metadata: PoseMetadata = {}
): Pose {
  const byName = new Map(keypoints.map(keypoint => [keypoint.name, keypoint]))

  return {
    ...metadata,
    keypoints: CANONICAL_KEYPOINT_NAMES.map(name => {
      const point = byName.get(name)
      return point
        ? { name, x: point.x, y: point.y, score: point.score }
        : { name, x: 0, y: 0, score: 0 }
    }),
  }
}
