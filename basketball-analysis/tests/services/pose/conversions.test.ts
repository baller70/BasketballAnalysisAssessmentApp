import { describe, expect, it } from 'vitest'

import { providerKeypointsToPose } from '@/services/pose/conversions'

describe('providerKeypointsToPose', () => {
  it('places named provider keypoints into MoveNet canonical index order', () => {
    const pose = providerKeypointsToPose([
      { name: 'right_wrist', x: 90, y: 40, score: 0.92 },
      { name: 'nose', x: 50, y: 10, score: 0.99 },
      { name: 'left_shoulder', x: 35, y: 30, score: 0.88 },
    ])

    expect(pose.keypoints).toHaveLength(17)
    expect(pose.keypoints[0]).toMatchObject({ name: 'nose', x: 50, y: 10, score: 0.99 })
    expect(pose.keypoints[5]).toMatchObject({ name: 'left_shoulder', x: 35, y: 30, score: 0.88 })
    expect(pose.keypoints[10]).toMatchObject({ name: 'right_wrist', x: 90, y: 40, score: 0.92 })
  })

  it('marks missing joints as unavailable instead of fabricating confident coordinates', () => {
    const pose = providerKeypointsToPose([
      { name: 'nose', x: 50, y: 10, score: 0.99 },
    ])

    expect(pose.keypoints[8]).toEqual({
      name: 'right_elbow',
      x: 0,
      y: 0,
      score: 0,
    })
  })

  it('preserves the selected shooter metadata supplied by an adapter', () => {
    const pose = providerKeypointsToPose(
      [{ name: 'nose', x: 50, y: 10, score: 0.9 }],
      { id: 7, score: 0.86 }
    )

    expect(pose.id).toBe(7)
    expect(pose.score).toBe(0.86)
  })
})
