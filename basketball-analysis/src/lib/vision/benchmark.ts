/**
 * Deterministic benchmark aggregation for ShotIQ Vision.
 *
 * This module intentionally accepts plain JSON-shaped records so benchmark
 * fixtures can be public and reproducible without shipping private footage.
 * Missing denominators are reported as null instead of being turned into a
 * fabricated perfect score.
 */

export interface BenchmarkFrame {
  timestampMs: number
  /** Number of landmarks that passed the confidence gate. */
  confidentKeypoints?: number
  /** Number of landmarks expected by the selected pose model. */
  totalKeypoints?: number
  /** Optional inference duration for this frame. */
  inferenceMs?: number
  /** Explicit frame-level completeness when a provider already calculated it. */
  poseCompleteness?: number | null
}

export interface BenchmarkBinarySample {
  expected: boolean
  predicted: boolean
}

export interface BenchmarkPhaseSample {
  expected: string
  predicted: string
}

export interface BenchmarkInput {
  frames?: BenchmarkFrame[]
  /** Optional total processing duration when frame timestamps are unavailable. */
  processingDurationMs?: number
  shotEvents?: BenchmarkBinarySample[]
  makeMiss?: BenchmarkBinarySample[]
  phases?: BenchmarkPhaseSample[]
}

export interface BenchmarkMetricCounts {
  frames: number
  shotEvents: number
  makesMisses: number
  phases: number
}

export interface BenchmarkSummary {
  /** Effective observed frames per second, or null when timing is unavailable. */
  fps: number | null
  /** Mean fraction of required keypoints confidently detected. */
  poseCompleteness: number | null
  /** Precision for predicted shot events. */
  shotPrecision: number | null
  /** Recall for expected shot events. */
  shotRecall: number | null
  /** Accuracy of make/miss classification. */
  makeMissAccuracy: number | null
  /** Fraction of phase labels that differ from the ground truth. */
  phaseError: number | null
  /** Complements phaseError for consumers that prefer an accuracy score. */
  phaseAccuracy: number | null
  counts: BenchmarkMetricCounts
}

const ratio = (numerator: number, denominator: number): number | null =>
  denominator > 0 ? numerator / denominator : null

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value))

function frameCompleteness(frame: BenchmarkFrame): number | null {
  if (typeof frame.poseCompleteness === 'number' && Number.isFinite(frame.poseCompleteness)) {
    return clamp01(frame.poseCompleteness)
  }

  if (
    typeof frame.confidentKeypoints !== 'number' ||
    typeof frame.totalKeypoints !== 'number' ||
    frame.totalKeypoints <= 0
  ) {
    return null
  }

  return clamp01(frame.confidentKeypoints / frame.totalKeypoints)
}

function calculateFps(frames: BenchmarkFrame[], processingDurationMs?: number): number | null {
  if (frames.length === 0) return null

  if (frames.length > 1) {
    const first = frames[0]?.timestampMs
    const last = frames[frames.length - 1]?.timestampMs
    const durationMs = last - first
    if (Number.isFinite(durationMs) && durationMs > 0) {
      return (frames.length - 1) / (durationMs / 1000)
    }
  }

  if (typeof processingDurationMs === 'number' && processingDurationMs > 0) {
    return frames.length / (processingDurationMs / 1000)
  }

  const measuredInferenceMs = frames
    .map(frame => frame.inferenceMs)
    .filter((value): value is number => typeof value === 'number' && value > 0)
  if (measuredInferenceMs.length > 0) {
    const averageInferenceMs = measuredInferenceMs.reduce((sum, value) => sum + value, 0) / measuredInferenceMs.length
    return 1000 / averageInferenceMs
  }

  return null
}

function calculatePrecision(samples: BenchmarkBinarySample[]): number | null {
  if (samples.length === 0) return null
  const predictedPositive = samples.filter(sample => sample.predicted)
  return ratio(
    predictedPositive.filter(sample => sample.expected).length,
    predictedPositive.length
  )
}

function calculateRecall(samples: BenchmarkBinarySample[]): number | null {
  if (samples.length === 0) return null
  const expectedPositive = samples.filter(sample => sample.expected)
  return ratio(
    expectedPositive.filter(sample => sample.predicted).length,
    expectedPositive.length
  )
}

function calculateAccuracy(samples: BenchmarkBinarySample[]): number | null {
  if (samples.length === 0) return null
  return samples.filter(sample => sample.expected === sample.predicted).length / samples.length
}

function calculatePhaseError(samples: BenchmarkPhaseSample[]): number | null {
  if (samples.length === 0) return null
  return samples.filter(sample => sample.expected !== sample.predicted).length / samples.length
}

export function summarizeBenchmark(input: BenchmarkInput): BenchmarkSummary {
  const frames = input.frames ?? []
  const shotEvents = input.shotEvents ?? []
  const makeMiss = input.makeMiss ?? []
  const phases = input.phases ?? []
  const completeness = frames
    .map(frameCompleteness)
    .filter((value): value is number => value !== null)

  const phaseError = calculatePhaseError(phases)

  return {
    fps: calculateFps(frames, input.processingDurationMs),
    poseCompleteness: completeness.length > 0
      ? completeness.reduce((sum, value) => sum + value, 0) / completeness.length
      : null,
    shotPrecision: calculatePrecision(shotEvents),
    shotRecall: calculateRecall(shotEvents),
    makeMissAccuracy: calculateAccuracy(makeMiss),
    phaseError,
    phaseAccuracy: phaseError === null ? null : 1 - phaseError,
    counts: {
      frames: frames.length,
      shotEvents: shotEvents.length,
      makesMisses: makeMiss.length,
      phases: phases.length,
    },
  }
}

/** Alias for callers that describe this operation as aggregation. */
export const aggregateBenchmark = summarizeBenchmark

