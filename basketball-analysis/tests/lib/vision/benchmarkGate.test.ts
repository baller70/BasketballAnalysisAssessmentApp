import { describe, expect, it } from 'vitest'

import { evaluateBenchmarkGate, type BenchmarkGateInput } from '@/lib/vision/benchmarkGate'

const passing = (): BenchmarkGateInput => ({
  summary: {
    fps: 20,
    poseCompleteness: 0.9,
    shotPrecision: 0.96,
    shotRecall: 0.97,
    makeMissAccuracy: 0.92,
    phaseError: 0.05,
    phaseAccuracy: 0.95,
    counts: { frames: 30, shotEvents: 20, makesMisses: 16, phases: 8 },
  },
  provenance: {
    fixtureId: 'shotiq-public-v1',
    source: 'ShotIQ synthetic coordinate fixture',
    license: 'CC0-1.0',
    kind: 'synthetic',
  },
  lowConfidencePromotions: 0,
})

describe('evaluateBenchmarkGate', () => {
  it('passes only summaries meeting every published release threshold', () => {
    const result = evaluateBenchmarkGate(passing())
    expect(result.passed).toBe(true)
    expect(result.failures).toEqual([])
  })

  it.each([
    ['fps', 14.99],
    ['shotPrecision', 0.949],
    ['shotRecall', 0.949],
    ['makeMissAccuracy', 0.899],
  ] as const)('fails when %s is below threshold', (metric, value) => {
    const input = passing()
    input.summary = { ...input.summary, [metric]: value }
    const result = evaluateBenchmarkGate(input)
    expect(result.passed).toBe(false)
    expect(result.failures.join(' ')).toContain(metric)
  })

  it.each(['fps', 'shotPrecision', 'shotRecall', 'makeMissAccuracy'] as const)(
    'fails instead of treating missing %s evidence as passing',
    (metric) => {
      const input = passing()
      input.summary = { ...input.summary, [metric]: null }
      expect(evaluateBenchmarkGate(input).passed).toBe(false)
    },
  )

  it('requires non-empty frame, shot, make/miss, and phase denominators', () => {
    const input = passing()
    input.summary.counts = { frames: 0, shotEvents: 0, makesMisses: 0, phases: 0 }
    const result = evaluateBenchmarkGate(input)
    expect(result.passed).toBe(false)
    expect(result.failures).toHaveLength(4)
  })

  it('rejects missing fixture provenance and promoted low-confidence measurements', () => {
    const input = passing()
    input.provenance = { fixtureId: '', source: '', license: '', kind: 'private' as 'synthetic' }
    input.lowConfidencePromotions = 1
    const result = evaluateBenchmarkGate(input)
    expect(result.passed).toBe(false)
    expect(result.failures.join(' ')).toMatch(/provenance/i)
    expect(result.failures.join(' ')).toMatch(/low-confidence/i)
  })
})
