import { readFile } from 'fs/promises'
import { resolve } from 'path'

import { summarizeBenchmark, type BenchmarkFrame } from '../src/lib/vision/benchmark'
import { evaluateBenchmarkGate, type BenchmarkFixtureProvenance } from '../src/lib/vision/benchmarkGate'
import type { BallObservation, RimCalibration } from '../src/lib/vision/objectTracking'
import { ShotTrajectoryTracker, type ShotResult } from '../src/lib/vision/shotResult'
import { trackShotPhases, type ShotFrameObservation, type ShotPhase } from '../src/lib/vision/shotPhases'

interface TrajectoryCase {
  id: string
  expectedShot: boolean
  expectedResult: ShotResult
  observations: BallObservation[]
}

interface PhaseCase {
  id: string
  expectedFinalPhase: ShotPhase
  observations: ShotFrameObservation[]
}

interface ReleaseFixture {
  schemaVersion: number
  provenance: BenchmarkFixtureProvenance
  frames: BenchmarkFrame[]
  rim: RimCalibration
  trajectoryCases: TrajectoryCase[]
  phaseCases: PhaseCase[]
}

export function runFixture(fixture: ReleaseFixture) {
  const predictions = fixture.trajectoryCases.map((testCase) => {
    const tracker = new ShotTrajectoryTracker()
    let result: ShotResult = 'unknown'
    for (const ball of testCase.observations) {
      const observation = tracker.update({ timestampMs: ball.timestampMs, ball, rim: fixture.rim })
      if (observation.final) result = observation.result
    }
    return { testCase, result }
  })
  const phases = fixture.phaseCases.map((testCase) => ({
    expected: testCase.expectedFinalPhase,
    predicted: trackShotPhases(testCase.observations).finalPhase,
  }))
  const summary = summarizeBenchmark({
    frames: fixture.frames,
    shotEvents: predictions.map(({ testCase, result }) => ({
      expected: testCase.expectedShot,
      predicted: result !== 'unknown',
    })),
    makeMiss: predictions
      .filter(({ testCase }) => testCase.expectedShot)
      .map(({ testCase, result }) => ({
        expected: testCase.expectedResult === 'make',
        predicted: result === 'make',
      })),
    phases,
  })
  const lowConfidencePromotions = predictions.filter(({ testCase, result }) =>
    result !== 'unknown' && testCase.observations.some((ball) => ball.confidence < 0.35)).length
  return {
    summary,
    gate: evaluateBenchmarkGate({ summary, provenance: fixture.provenance, lowConfidencePromotions }),
    predictions: predictions.map(({ testCase, result }) => ({ id: testCase.id, expected: testCase.expectedResult, predicted: result })),
  }
}

async function main() {
  const fixturePath = resolve(process.cwd(), process.argv[2] || 'benchmarks/public/shotiq-release-fixture.json')
  const fixture = JSON.parse(await readFile(fixturePath, 'utf8')) as ReleaseFixture
  const result = runFixture(fixture)
  process.stdout.write(`${JSON.stringify({ fixture: fixture.provenance, ...result }, null, 2)}\n`)
  if (!result.gate.passed) process.exitCode = 1
}

void main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
