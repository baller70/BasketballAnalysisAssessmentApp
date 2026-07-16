import { describe, expect, it } from 'vitest'
import { formAnglesToRecord } from '@/services/pose'
import { gateMechanicsMeasurements } from '@/lib/vision/confidenceGate'

describe('canonical angle records', () => {
  it('does not record a raw angle when its mechanics measurement is omitted', () => {
    const mechanics = gateMechanicsMeasurements({
      angles: { elbow: 160, knee: 145 },
      confidence: { elbow: 0.2, knee: 0.95 },
      minConfidence: 0.5,
    })
    const record = formAnglesToRecord({
      angles: { elbow: 160, knee: 145, shoulder: null, hip: null, release: null, wrist: null },
      untrustedAngles: { elbow: 160, knee: 145, shoulder: null, hip: null, release: null, wrist: null },
      mechanics,
      scores: { overallScore: 0, formScore: 0, balanceScore: 0, releaseScore: 0, perJoint: {}, measuredCount: 0 },
      status: {},
      overallScore: 0,
      tips: [],
      measuredCount: 0,
    })

    expect(record.elbow_angle).toBeUndefined()
    expect(record.right_elbow_angle).toBeUndefined()
    expect(record.knee_angle).toBe(145)
  })
})
