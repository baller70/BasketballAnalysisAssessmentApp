import type { BenchmarkSummary } from '@/lib/vision/benchmark'

export interface BenchmarkFixtureProvenance {
  fixtureId: string
  source: string
  license: string
  kind: 'public' | 'synthetic' | 'consented'
}

export interface BenchmarkGateInput {
  summary: BenchmarkSummary
  provenance: BenchmarkFixtureProvenance
  lowConfidencePromotions: number
}

export interface BenchmarkGateResult {
  passed: boolean
  failures: string[]
  thresholds: {
    fps: number
    shotPrecision: number
    shotRecall: number
    makeMissAccuracy: number
  }
}

const THRESHOLDS = {
  fps: 15,
  shotPrecision: 0.95,
  shotRecall: 0.95,
  makeMissAccuracy: 0.9,
} as const

/** Release gate: missing evidence fails just as decisively as weak evidence. */
export function evaluateBenchmarkGate(input: BenchmarkGateInput): BenchmarkGateResult {
  const failures: string[] = []
  for (const [metric, threshold] of Object.entries(THRESHOLDS) as Array<[keyof typeof THRESHOLDS, number]>) {
    const value = input.summary[metric]
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      failures.push(`${metric} evidence is missing`)
    } else if (value < threshold) {
      failures.push(`${metric} ${value.toFixed(4)} is below ${threshold.toFixed(2)}`)
    }
  }

  const countMetrics: Array<[keyof BenchmarkSummary['counts'], string]> = [
    ['frames', 'frame'],
    ['shotEvents', 'shot-event'],
    ['makesMisses', 'make/miss'],
    ['phases', 'phase'],
  ]
  for (const [key, label] of countMetrics) {
    if (!Number.isInteger(input.summary.counts[key]) || input.summary.counts[key] <= 0) {
      failures.push(`${label} denominator is missing`)
    }
  }

  const provenance = input.provenance
  if (
    !provenance.fixtureId?.trim()
    || !provenance.source?.trim()
    || !provenance.license?.trim()
    || !['public', 'synthetic', 'consented'].includes(provenance.kind)
  ) {
    failures.push('Fixture provenance is incomplete or private')
  }
  if (!Number.isInteger(input.lowConfidencePromotions) || input.lowConfidencePromotions !== 0) {
    failures.push(`Detected ${input.lowConfidencePromotions} low-confidence promotion(s)`)
  }

  return { passed: failures.length === 0, failures, thresholds: THRESHOLDS }
}
