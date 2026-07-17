import { describe, expect, it } from 'vitest'
import {
  buildVideoFrameRecord,
  convertVideoToSessionFormat,
  toVideoSessionData,
} from '@/services/videoAnalysis'
import { gateMechanicsMeasurements } from '@/lib/vision/confidenceGate'

const makeResult = {
  result: 'make' as const,
  confidence: 0.91,
  final: true,
  timestampMs: 200,
  reason: 'Ball crossed downward through the calibrated hoop cylinder',
  provenance: {
    source: 'calibrated_ball_trajectory' as const,
    rimCalibrated: true,
    sampleCount: 4,
    trustedSampleCount: 4,
  },
}

describe('uploaded-video frame records', () => {
  it('propagates canonical phase/sidecars and keeps raw angles explicit', () => {
    const mechanics = gateMechanicsMeasurements({
      angles: { elbow: 160, knee: 145 },
      confidence: { elbow: 0.2, knee: 0.95 },
      minConfidence: 0.5,
    })
    const form = {
      angles: { elbow: null, knee: 145, shoulder: null, hip: null, release: null, wrist: null },
      untrustedAngles: { elbow: 160, knee: 145, shoulder: null, hip: null, release: null, wrist: null },
      mechanics,
      canonicalObservation: {
        timestampMs: 200,
        keypoints: [],
        poseConfidence: 0.9,
        phase: 'release' as const,
        mechanics,
      },
    }
    const record = buildVideoFrameRecord({
      index: 3,
      timestamp: 0.2,
      keypoints: [],
      form,
      imageBase64: 'frame',
    }, 'RELEASE')

    expect(record.phase).toBe('release')
    expect(record.legacy_phase).toBe('RELEASE')
    expect(record.canonicalObservation?.phase).toBe('release')
    expect(record.mechanics).toBe(mechanics)
    expect(record.metrics.elbow_angle).toBeUndefined()
    expect(record.metrics.knee_angle).toBe(145)
    expect(record.untrustedAngles?.elbow).toBe(160)
  })

  it('preserves a null release score instead of manufacturing zero', () => {
    const result = convertVideoToSessionFormat({
      success: true,
      metrics: {
        elbow_angle_range: { min: null, max: null, at_release: null },
        knee_angle_range: { min: null, max: null },
        release_frame: 0,
        release_timestamp: 0,
        release_score: null,
        release_angles: {},
      },
    })

    expect(result.overallScore).toBeNull()
    expect(result.videoData.metrics.release_score).toBeNull()
  })

  it('retains canonical phase and mechanics sidecars in persisted video data', () => {
    const mechanics = gateMechanicsMeasurements({ angles: { elbow: 160 }, confidence: { elbow: 0.9 } })
    const canonicalObservation = {
      timestampMs: 1200,
      keypoints: [],
      poseConfidence: 0.9,
      phase: 'follow-through' as const,
      mechanics,
    }
    const result = toVideoSessionData({
      success: true,
      phases: [{ phase: 'follow-through', frame: 2, timestamp: 1.2, canonicalObservation }],
      frame_data: [{
        frame: 2,
        timestamp: 1.2,
        phase: 'follow-through',
        legacy_phase: 'FOLLOW_THROUGH',
        metrics: {},
        keypoint_count: 0,
        ball_detected: false,
        mechanics,
        canonicalObservation,
      }],
    })

    expect(result.phases[0].canonicalObservation?.phase).toBe('follow-through')
    expect(result.frameData[0].mechanics).toBe(mechanics)
    expect(result.frameData[0].canonicalObservation?.timestampMs).toBe(1200)
  })

  it('persists trusted basketball observations and their shared trajectory result', () => {
    const ball = {
      centerX: 0.5,
      centerY: 0.48,
      width: 0.04,
      height: 0.04,
      confidence: 0.9,
      timestampMs: 200,
    }
    const record = buildVideoFrameRecord({
      index: 3,
      timestamp: 0.2,
      keypoints: null,
      form: null,
      imageBase64: 'frame',
      ball,
      shotResult: makeResult,
    }, 'FOLLOW_THROUGH')

    expect(record.ball_detected).toBe(true)
    expect(record.ball).toEqual(ball)
    expect(record.shot_result).toEqual(makeResult)

    const session = toVideoSessionData({
      success: true,
      shot_result: makeResult,
      frame_data: [record],
    })
    expect(session.shotResult).toEqual(makeResult)
    expect(session.frameData[0].shot_result?.result).toBe('make')
  })
})
