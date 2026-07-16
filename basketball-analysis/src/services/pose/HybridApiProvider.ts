/**
 * HybridApiProvider — OPTIONAL server "Pro" engine. NOT the default.
 *
 * This is a stub kept behind the PoseProvider interface so a future server-side
 * model (e.g. a YOLOv8-pose + MediaPipe backend) can be slotted in without
 * touching callers. It is intentionally NOT wired up as the default: the canonical
 * engine is on-device MoveNet. The previously-used Hugging Face Space
 * (NEXT_PUBLIC_HYBRID_API_URL) is offline and must never be the primary path.
 *
 * To enable, set NEXT_PUBLIC_HYBRID_API_URL to a reachable backend and select
 * this provider explicitly via getPoseProvider('hybrid-api').
 */

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

function statusFromScore(score: number | undefined): JointStatus {
  if (score === undefined) return 'unknown'
  if (score >= 85) return 'good'
  if (score >= 60) return 'warning'
  return 'critical'
}

export class HybridApiProvider implements PoseProvider {
  readonly id = 'hybrid-api'
  readonly label = 'Server Pro (experimental)'
  readonly onDevice = false

  private readonly baseUrl: string

  constructor(baseUrl?: string) {
    // Empty by default — there is no default server. Must be configured.
    this.baseUrl = baseUrl ?? process.env.NEXT_PUBLIC_HYBRID_API_URL ?? ''
  }

  async init(): Promise<void> {
    if (!this.baseUrl) {
      throw new Error(
        'HybridApiProvider is not configured (set NEXT_PUBLIC_HYBRID_API_URL). ' +
          'Use the default on-device MoveNet provider instead.'
      )
    }
  }

  isReady(): boolean {
    return Boolean(this.baseUrl)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- param documents the interface contract for this intentional stub
  async detectPose(_input: PoseInput, _timestampMs?: number): Promise<ProviderKeypoint[] | null> {
    // Stub: a real implementation would POST the frame to `${baseUrl}/api/detect-pose`.
    // Left unimplemented on purpose so this provider can never silently become
    // the active engine.
    throw new Error(
      'HybridApiProvider.detectPose is not implemented. The canonical engine is ' +
        'on-device MoveNet (MoveNetProvider).'
    )
  }

  /**
   * Scoring is identical regardless of where keypoints/angles came from, so a
   * server provider would still route angles through biomechanicalScoring. This
   * helper makes that contract explicit for whoever wires the backend.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- param documents the interface contract for this intentional stub
  analyzeForm(_keypoints: ProviderKeypoint[]): FormAnalysis {
    const angles: CanonicalAngles = {
      elbow: null,
      knee: null,
      shoulder: null,
      hip: null,
      release: null,
      wrist: null,
    }
    const scores = scoreShootingForm(angles)
    const status = {} as Record<JointName, JointStatus>
    ;(Object.keys(angles) as JointName[]).forEach((joint) => {
      status[joint] = statusFromScore(scores.perJoint[joint])
    })
    return {
      angles,
      scores,
      status,
      overallScore: scores.overallScore,
      tips: [],
      measuredCount: scores.measuredCount,
    }
  }
}
