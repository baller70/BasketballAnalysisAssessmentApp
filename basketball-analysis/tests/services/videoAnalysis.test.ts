import { describe, expect, it } from 'vitest'
import { buildVideoFrameRecord } from '@/services/videoAnalysis'
import { gateMechanicsMeasurements } from '@/lib/vision/confidenceGate'

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
})
