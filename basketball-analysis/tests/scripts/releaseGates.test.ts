import { describe, expect, it } from 'vitest'

import {
  REQUIRED_DEVICE_COMBINATIONS,
  validateDeviceMatrix,
  type DeviceMatrix,
} from '@/lib/vision/deviceMatrix'

const validMatrix = (): DeviceMatrix => ({
  schemaVersion: 1,
  app: 'ShotIQ',
  commitSha: 'a'.repeat(40),
  measuredAt: '2026-07-17T12:00:00.000Z',
  runs: REQUIRED_DEVICE_COMBINATIONS.map((combination, index) => ({
    id: `run-${index}`,
    ...combination,
    commitSha: 'a'.repeat(40),
    metrics: {
      fps: 20,
      poseCompleteness: 0.9,
      shotPrecision: 0.96,
      shotRecall: 0.96,
      makeMissAccuracy: 0.92,
      phaseError: 0.05,
    },
    evidence: { fixtureId: 'consented-run', notes: 'Measured physical run' },
  })),
})

describe('device-matrix release evidence', () => {
  it('requires every iPhone 11/12, web/native, portrait/landscape, front/rear combination', () => {
    const matrix = validMatrix()
    expect(validateDeviceMatrix(matrix).valid).toBe(true)
    matrix.runs.pop()
    const result = validateDeviceMatrix(matrix)
    expect(result.valid).toBe(false)
    expect(result.errors.join(' ')).toMatch(/missing/i)
  })

  it('rejects missing commit identity, metrics, evidence, or mismatched run commits', () => {
    const matrix = validMatrix()
    matrix.commitSha = ''
    matrix.runs[0].commitSha = 'b'.repeat(40)
    matrix.runs[1].metrics.fps = Number.NaN
    matrix.runs[2].evidence.fixtureId = ''
    const result = validateDeviceMatrix(matrix)
    expect(result.valid).toBe(false)
    expect(result.errors.join(' ')).toMatch(/commit/i)
    expect(result.errors.join(' ')).toMatch(/metric/i)
    expect(result.errors.join(' ')).toMatch(/evidence/i)
  })

  it('rejects duplicate combinations even when the total run count is 16', () => {
    const matrix = validMatrix()
    matrix.runs[15] = { ...matrix.runs[0], id: 'duplicate' }
    const result = validateDeviceMatrix(matrix)
    expect(result.valid).toBe(false)
    expect(result.errors.join(' ')).toMatch(/duplicate/i)
  })

  it('enforces the release thresholds on every physical run', () => {
    const matrix = validMatrix()
    matrix.runs[0].metrics.fps = 14
    matrix.runs[1].metrics.shotRecall = 0.9
    matrix.runs[2].metrics.makeMissAccuracy = 0.8
    const result = validateDeviceMatrix(matrix)
    expect(result.valid).toBe(false)
    expect(result.errors.join(' ')).toMatch(/threshold/i)
  })
})
