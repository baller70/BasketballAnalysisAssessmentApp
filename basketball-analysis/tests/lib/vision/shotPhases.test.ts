import { describe, expect, it } from 'vitest'

import {
  createShotPhaseTracker,
  observationFromKeypoints,
  trackShotPhases,
} from '@/lib/vision/shotPhases'

const frame = (timestampMs: number, wristY: number, extra: Record<string, unknown> = {}) => ({
  timestampMs,
  wristY,
  wristConfidence: 0.9,
  poseConfidence: 0.9,
  ...extra,
})

describe('shot phase tracker', () => {
  it('moves monotonically through the body and ball phases', () => {
    const trace = trackShotPhases([
      frame(0, 500),
      frame(33, 490),
      frame(66, 490, { isSet: true }),
      frame(99, 470, { released: true }),
      frame(132, 460, { ballInFlight: true }),
      frame(165, 450, { ballInFlight: true }),
      frame(198, 455, { ballInFlight: true, rimEvent: true }),
      frame(231, 455, { shotComplete: true, ballInFlight: false }),
    ])

    expect(trace.events.map((event) => event.phase)).toEqual([
      'gather',
      'rise',
      'set',
      'release',
      'follow-through',
      'flight',
      'rim-event',
      'complete',
    ])
    expect(trace.finalPhase).toBe('complete')
  })

  it('requires a new tracker/reset before a completed shot can be reused', () => {
    const tracker = createShotPhaseTracker()
    tracker.update(frame(0, 500))
    tracker.update(frame(33, 480))
    tracker.update(frame(66, 480, { isSet: true }))
    tracker.update(frame(99, 460, { released: true }))
    tracker.update(frame(132, 450, { ballInFlight: true }))
    tracker.update(frame(165, 445, { ballInFlight: true, rimEvent: true }))
    const complete = tracker.update(frame(198, 445, { shotComplete: true, ballInFlight: false }))
    expect(complete.phase).toBe('complete')

    tracker.reset()
    expect(tracker.update(frame(165, 510)).phase).toBe('gather')
  })

  it('derives the higher active wrist and pose confidence from adapter keypoints', () => {
    const observation = observationFromKeypoints([
      { name: 'left_wrist', x: 5, y: 300, score: 0.7 },
      { name: 'right_wrist', x: 8, y: 220, score: 0.95 },
    ], 100)

    expect(observation.wristY).toBe(220)
    expect(observation.wristConfidence).toBe(0.95)
    expect(observation.poseConfidence).toBeCloseTo(0.825)
  })
})
