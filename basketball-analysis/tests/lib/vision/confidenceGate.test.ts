import { describe, expect, it } from 'vitest'

import {
  gateMeasurement,
  gateMechanicsMeasurements,
} from '@/lib/vision/confidenceGate'

const points = [
  { name: 'right_shoulder', score: 0.94 },
  { name: 'right_elbow', score: 0.91 },
  { name: 'right_wrist', score: 0.88 },
  { name: 'right_hip', score: 0.86 },
  { name: 'right_knee', score: 0.89 },
  { name: 'right_ankle', score: 0.9 },
]

describe('confidence gate', () => {
  it('trusts a measurement only when required landmarks clear the threshold', () => {
    const result = gateMeasurement({
      name: 'elbow',
      value: 91,
      keypoints: points,
      requiredLandmarks: ['shoulder', 'elbow', 'wrist'],
    })

    expect(result.status).toBe('trusted')
    expect(result.value).toBe(91)
    expect(result.confidence).toBeCloseTo(0.88)
    expect(result.reason).toBeNull()
  })

  it('omits a low-confidence value with a reason instead of a default', () => {
    const result = gateMeasurement({
      name: 'release',
      value: 17,
      confidence: 0.32,
      minConfidence: 0.5,
    })

    expect(result.trusted).toBe(false)
    expect(result.value).toBeNull()
    expect(result.reasonCode).toBe('low-confidence')
    expect(result.reason).toContain('below 50%')
  })

  it('returns both trusted and omitted canonical angle records', () => {
    const result = gateMechanicsMeasurements({
      angles: { elbow: 92, release: 8, knee: null },
      keypoints: points,
      minConfidence: 0.5,
    })

    expect(result.trusted).toEqual({ elbow: 92, release: 8 })
    expect(result.omitted.knee.reasonCode).toBe('missing-value')
    expect(result.omittedMeasurements).toHaveLength(1)
    expect(result.overallConfidence).toBeCloseTo(0.88)
  })
})

