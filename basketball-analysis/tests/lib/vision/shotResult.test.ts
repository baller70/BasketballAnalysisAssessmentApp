import { describe, expect, it } from 'vitest'

import { ShotTrajectoryTracker } from '@/lib/vision/shotResult'
import type { BallObservation, RimCalibration } from '@/lib/vision/objectTracking'

const rim: RimCalibration = {
  centerX: 0.5,
  centerY: 0.4,
  width: 0.14,
  height: 0.12,
  calibratedAtMs: 1,
  source: 'manual',
}

const ball = (
  centerX: number,
  centerY: number,
  timestampMs: number,
  confidence = 0.9,
): BallObservation => ({
  centerX,
  centerY,
  width: 0.04,
  height: 0.04,
  confidence,
  timestampMs,
})

const feed = (
  tracker: ShotTrajectoryTracker,
  points: Array<[number, number, number]>,
  calibration: RimCalibration | null = rim,
) => points.map(([x, y, timestampMs]) => tracker.update({
  timestampMs,
  ball: ball(x, y, timestampMs),
  rim: calibration,
}))

describe('ShotTrajectoryTracker', () => {
  it('classifies a downward center crossing followed by a below-rim observation as a make', () => {
    const tracker = new ShotTrajectoryTracker()
    const observations = feed(tracker, [
      [0.48, 0.25, 0],
      [0.49, 0.33, 50],
      [0.50, 0.40, 100],
      [0.51, 0.48, 150],
    ])

    expect(observations.at(-1)).toMatchObject({
      result: 'make',
      final: true,
      provenance: { source: 'calibrated_ball_trajectory', rimCalibrated: true },
    })
    expect(observations.at(-1)?.confidence).toBeGreaterThanOrEqual(0.75)
  })

  it.each([
    ['left', 0.36],
    ['right', 0.64],
  ])('classifies a trusted %s-side exit as a miss', (_side, exitX) => {
    const tracker = new ShotTrajectoryTracker()
    const observations = feed(tracker, [
      [0.49, 0.25, 0],
      [0.48, 0.33, 50],
      [exitX, 0.40, 100],
      [exitX, 0.49, 150],
    ])

    expect(observations.at(-1)).toMatchObject({ result: 'miss', final: true })
  })

  it('classifies a downward-to-upward rim bounce as a miss', () => {
    const tracker = new ShotTrajectoryTracker()
    const observations = feed(tracker, [
      [0.49, 0.24, 0],
      [0.50, 0.34, 50],
      [0.56, 0.39, 100],
      [0.59, 0.34, 150],
    ])

    expect(observations.at(-1)).toMatchObject({ result: 'miss', final: true })
  })

  it('keeps a short occlusion unknown and can finish the same trusted trajectory afterward', () => {
    const tracker = new ShotTrajectoryTracker()
    feed(tracker, [[0.49, 0.27, 0], [0.50, 0.36, 50]])
    const occluded = tracker.update({ timestampMs: 100, ball: null, rim })
    const finished = tracker.update({ timestampMs: 150, ball: ball(0.50, 0.48, 150), rim })

    expect(occluded).toMatchObject({ result: 'unknown', final: false })
    expect(finished).toMatchObject({ result: 'make', final: true })
  })

  it('never classifies an upward pass through the hoop as a shot', () => {
    const tracker = new ShotTrajectoryTracker()
    const observations = feed(tracker, [
      [0.50, 0.50, 0],
      [0.50, 0.40, 50],
      [0.50, 0.30, 100],
    ])

    expect(observations.at(-1)).toMatchObject({ result: 'unknown', final: false })
  })

  it('rejects low-confidence ball observations', () => {
    const tracker = new ShotTrajectoryTracker()
    const first = tracker.update({ timestampMs: 0, ball: ball(0.5, 0.3, 0, 0.2), rim })
    const second = tracker.update({ timestampMs: 50, ball: ball(0.5, 0.5, 50, 0.2), rim })

    expect(first.provenance.trustedSampleCount).toBe(0)
    expect(second).toMatchObject({ result: 'unknown', final: false })
  })

  it('requires valid hoop calibration', () => {
    const tracker = new ShotTrajectoryTracker()
    const observations = feed(tracker, [
      [0.50, 0.25, 0],
      [0.50, 0.40, 50],
      [0.50, 0.50, 100],
    ], null)

    expect(observations.at(-1)).toMatchObject({
      result: 'unknown',
      final: false,
      provenance: { rimCalibrated: false },
    })
  })

  it('ignores non-monotonic timestamps and resets stale trajectory history', () => {
    const tracker = new ShotTrajectoryTracker({ maxTrustedGapMs: 500 })
    feed(tracker, [[0.50, 0.25, 100], [0.50, 0.34, 150]])

    const outOfOrder = tracker.update({ timestampMs: 125, ball: ball(0.5, 0.48, 125), rim })
    const stale = tracker.update({ timestampMs: 1_000, ball: ball(0.5, 0.48, 1_000), rim })

    expect(outOfOrder).toMatchObject({ result: 'unknown', final: false })
    expect(outOfOrder.reason).toMatch(/monotonic/i)
    expect(stale).toMatchObject({ result: 'unknown', final: false })
    expect(stale.provenance.trustedSampleCount).toBe(1)
  })

  it('clears a completed result for the next attempt', () => {
    const tracker = new ShotTrajectoryTracker()
    feed(tracker, [[0.5, 0.25, 0], [0.5, 0.4, 50], [0.5, 0.5, 100]])
    tracker.reset()

    expect(tracker.update({ timestampMs: 200, ball: ball(0.5, 0.5, 200), rim })).toMatchObject({
      result: 'unknown',
      final: false,
      provenance: { trustedSampleCount: 1 },
    })
  })
})
