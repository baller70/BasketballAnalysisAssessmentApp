import type { Pose, ShootingFormFeedback } from '@/services/poseDetection'
import type { ShotEventInput } from '@/lib/api/shotEvents'

/**
 * The detector runs from a long-lived animation-frame callback. Keep the
 * mutable values it needs behind refs so a callback created before recording
 * starts still observes the current recording session.
 */
export interface LiveValueRef<T> {
  current: T
}

export interface LiveShotDetectionRefs {
  isRecording: LiveValueRef<boolean>
  recordingDuration: LiveValueRef<number>
  feedback: LiveValueRef<ShootingFormFeedback | null>
  detectedShotEvents: LiveValueRef<ShotEventInput[]>
}

export interface LiveShotDetectionResult {
  confidence?: number
  shotScore: number | null
  event: ShotEventInput | null
}

/**
 * Record one detector event using values at invocation time, rather than
 * values captured when the camera component rendered.
 */
export function recordLiveShotDetection(
  pose: Pose,
  refs: LiveShotDetectionRefs,
): LiveShotDetectionResult {
  const scores = pose.keypoints
    .map(point => point.score)
    .filter((score): score is number => typeof score === 'number' && Number.isFinite(score))
  const confidence = scores.length
    ? Math.max(0, Math.min(1, scores.reduce((sum, score) => sum + score, 0) / scores.length))
    : undefined
  const shotScore = refs.feedback.current?.overallScore ?? null

  if (!refs.isRecording.current) {
    return { confidence, shotScore, event: null }
  }

  const event: ShotEventInput = {
    sequence: refs.detectedShotEvents.current.length,
    timestampMs: Math.max(0, Math.round(refs.recordingDuration.current * 1000)),
    detected: true,
    detectedResult: 'unknown',
    detectedPhase: 'RELEASE',
    confidence,
    metadata: { source: 'live_camera', shotScore },
  }
  refs.detectedShotEvents.current.push(event)

  return { confidence, shotScore, event }
}
