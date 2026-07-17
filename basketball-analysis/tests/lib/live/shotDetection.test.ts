import { describe, expect, it } from 'vitest'
import type { Pose, ShootingFormFeedback } from '@/services/poseDetection'
import type { ShotEventInput } from '@/lib/api/shotEvents'
import { applyLiveShotResult, recordLiveShotDetection } from '@/lib/live/shotDetection'

const pose: Pose = {
  keypoints: [
    { x: 0, y: 0, score: 0.8 },
    { x: 0, y: 0, score: 0.6 },
  ],
}

const feedback = { overallScore: 87 } as ShootingFormFeedback

describe('recordLiveShotDetection', () => {
  it('reads recording refs at callback time so a detector started before recording still persists events', () => {
    const refs = {
      isRecording: { current: false },
      recordingDuration: { current: 0 },
      feedback: { current: null as ShootingFormFeedback | null },
      detectedShotEvents: { current: [] as ShotEventInput[] },
    }

    // Detection is initialized while idle, then recording begins. The same
    // callback must see the updated refs without being recreated.
    refs.isRecording.current = true
    refs.recordingDuration.current = 12.4
    refs.feedback.current = feedback

    const result = recordLiveShotDetection(pose, refs)

    expect(result.event).toEqual(expect.objectContaining({
      sequence: 0,
      timestampMs: 12_400,
      confidence: 0.7,
      metadata: { source: 'live_camera', shotScore: 87 },
    }))
    expect(refs.detectedShotEvents.current).toHaveLength(1)
  })

  it('does not persist detector output while the current recording ref is false', () => {
    const refs = {
      isRecording: { current: false },
      recordingDuration: { current: 5 },
      feedback: { current: feedback },
      detectedShotEvents: { current: [] as ShotEventInput[] },
    }

    const result = recordLiveShotDetection(pose, refs)

    expect(result.event).toBeNull()
    expect(refs.detectedShotEvents.current).toHaveLength(0)
  })

  it('applies a trusted trajectory result to the newest unresolved detector event', () => {
    const events: ShotEventInput[] = [
      { sequence: 0, timestampMs: 1_000, detectedResult: 'make' },
      { sequence: 1, timestampMs: 2_000, detectedResult: 'unknown', metadata: { source: 'live_camera' } },
    ]

    const updated = applyLiveShotResult(events, {
      result: 'miss',
      confidence: 0.82,
      final: true,
      timestampMs: 2_400,
      reason: 'Ball exited outside the hoop cylinder',
      provenance: {
        source: 'calibrated_ball_trajectory',
        rimCalibrated: true,
        sampleCount: 4,
        trustedSampleCount: 4,
      },
    })

    expect(updated).toBe(true)
    expect(events[0].detectedResult).toBe('make')
    expect(events[1]).toMatchObject({ detectedResult: 'miss', confidence: 0.82 })
    expect(events[1].metadata).toMatchObject({
      source: 'live_camera',
      resultProvenance: 'calibrated_ball_trajectory',
      resultReason: 'Ball exited outside the hoop cylinder',
      trajectorySampleCount: 4,
    })
  })

  it('does not promote an unknown or unfinished trajectory result', () => {
    const events: ShotEventInput[] = [{ detectedResult: 'unknown' }]
    const updated = applyLiveShotResult(events, {
      result: 'unknown',
      confidence: null,
      final: false,
      timestampMs: 100,
      reason: 'Waiting',
      provenance: {
        source: 'calibrated_ball_trajectory',
        rimCalibrated: true,
        sampleCount: 2,
        trustedSampleCount: 2,
      },
    })

    expect(updated).toBe(false)
    expect(events[0].detectedResult).toBe('unknown')
  })
})
