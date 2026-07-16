import { describe, expect, it } from 'vitest'

import { summarizeBenchmark } from '@/lib/vision/benchmark'

describe('summarizeBenchmark', () => {
  it('produces reproducible frame rate and pose completeness metrics', () => {
    const summary = summarizeBenchmark({
      frames: [
        { timestampMs: 0, confidentKeypoints: 15, totalKeypoints: 17 },
        { timestampMs: 100, confidentKeypoints: 17, totalKeypoints: 17 },
        { timestampMs: 200, confidentKeypoints: 14, totalKeypoints: 17 },
      ],
    })

    expect(summary.fps).toBeCloseTo(10)
    expect(summary.poseCompleteness).toBeCloseTo((15 / 17 + 1 + 14 / 17) / 3)
    expect(summary.counts.frames).toBe(3)
  })

  it('aggregates shot precision and recall without treating missing positives as perfect', () => {
    const summary = summarizeBenchmark({
      shotEvents: [
        { expected: true, predicted: true },
        { expected: true, predicted: false },
        { expected: false, predicted: true },
        { expected: false, predicted: false },
      ],
    })

    expect(summary.shotPrecision).toBeCloseTo(0.5)
    expect(summary.shotRecall).toBeCloseTo(0.5)
  })

  it('reports make/miss accuracy and phase error', () => {
    const summary = summarizeBenchmark({
      makeMiss: [
        { expected: true, predicted: true },
        { expected: false, predicted: true },
        { expected: false, predicted: false },
      ],
      phases: [
        { expected: 'gather', predicted: 'gather' },
        { expected: 'release', predicted: 'set' },
      ],
    })

    expect(summary.makeMissAccuracy).toBeCloseTo(2 / 3)
    expect(summary.phaseError).toBeCloseTo(0.5)
    expect(summary.phaseAccuracy).toBeCloseTo(0.5)
  })

  it('returns null for metrics that have no trustworthy denominator', () => {
    const summary = summarizeBenchmark({
      frames: [{ timestampMs: 0 }],
      shotEvents: [{ expected: false, predicted: false }],
    })

    expect(summary.fps).toBeNull()
    expect(summary.poseCompleteness).toBeNull()
    expect(summary.shotPrecision).toBeNull()
    expect(summary.shotRecall).toBeNull()
    expect(summary.makeMissAccuracy).toBeNull()
    expect(summary.phaseError).toBeNull()
    expect(summary.phaseAccuracy).toBeNull()
  })

  it('uses processing duration or inference duration when timestamps are unavailable', () => {
    const byProcessingTime = summarizeBenchmark({
      frames: [{ timestampMs: 0 }, { timestampMs: 0 }, { timestampMs: 0 }, { timestampMs: 0 }],
      processingDurationMs: 200,
    })
    const byInferenceTime = summarizeBenchmark({
      frames: [{ timestampMs: 0, inferenceMs: 50 }],
    })

    expect(byProcessingTime.fps).toBeCloseTo(20)
    expect(byInferenceTime.fps).toBeCloseTo(20)
  })
})

