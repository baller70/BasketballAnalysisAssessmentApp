import { describe, expect, it, vi } from 'vitest'

const detector = vi.hoisted(() => ({
  initialize: vi.fn(async () => undefined),
  isReady: vi.fn(() => true),
  detectPose: vi.fn(async () => ({
    keypoints: [
      { name: 'right_shoulder', x: 20, y: 200, score: 0.9 },
      { name: 'right_elbow', x: 30, y: 150, score: 0.9 },
      { name: 'right_wrist', x: 40, y: 90, score: 0.9 },
      { name: 'right_hip', x: 20, y: 300, score: 0.9 },
      { name: 'right_knee', x: 20, y: 400, score: 0.9 },
      { name: 'right_ankle', x: 20, y: 500, score: 0.9 },
      // The opposite elbow is very confident, but must not satisfy the right
      // side's elbow chain when the right elbow is absent from a frame.
      { name: 'left_elbow', x: 300, y: 150, score: 0.99 },
      { name: 'left_wrist', x: 300, y: 220, score: 0.99 },
    ],
  })),
  calculateShootingAngles: vi.fn(() => ({
    elbowAngle: 160,
    kneeAngle: 145,
    shoulderAngle: 70,
    hipAngle: 170,
    releaseAngle: 5,
    wristAngle: 55,
  })),
  analyzeShootingForm: vi.fn(() => ({ tips: [] })),
}))

vi.mock('@/services/poseDetection', () => ({
  poseDetectionService: detector,
  KEYPOINT_INDICES: {
    nose: 0,
    left_eye: 1,
    right_eye: 2,
    left_ear: 3,
    right_ear: 4,
    left_shoulder: 5,
    right_shoulder: 6,
    left_elbow: 7,
    right_elbow: 8,
    left_wrist: 9,
    right_wrist: 10,
    left_hip: 11,
    right_hip: 12,
    left_knee: 13,
    right_knee: 14,
    left_ankle: 15,
    right_ankle: 16,
  },
}))

import { MoveNetProvider } from '@/services/pose/MoveNetProvider'

const keypoints = [
  { name: 'right_shoulder', x: 20, y: 200, score: 0.9 },
  { name: 'right_elbow', x: 30, y: 150, score: 0.9 },
  { name: 'right_wrist', x: 40, y: 90, score: 0.9 },
  { name: 'right_hip', x: 20, y: 300, score: 0.9 },
  { name: 'right_knee', x: 20, y: 400, score: 0.9 },
  { name: 'right_ankle', x: 20, y: 500, score: 0.9 },
  { name: 'left_elbow', x: 300, y: 150, score: 0.99 },
  { name: 'left_wrist', x: 300, y: 220, score: 0.99 },
]

describe('MoveNetProvider canonical live seam', () => {
  it('preserves a frame timestamp in the phase/mechanics sidecar and resets it', async () => {
    const provider = new MoveNetProvider()
    await provider.init()
    const detected = await provider.detectPose(document.createElement('canvas'), 3210)
    expect(detected).not.toBeNull()

    const form = provider.analyzeForm(detected!)
    expect(form.canonicalObservation?.timestampMs).toBe(3210)
    expect(form.mechanics?.trusted.elbow).toBe(160)

    provider.reset()
    const afterReset = provider.analyzeForm(keypoints)
    expect(afterReset.canonicalObservation?.timestampMs).toBeNull()
    expect(afterReset.canonicalObservation?.phase).toBe('gather')
  })

  it('does not use an opposite-side landmark to satisfy a gated metric', () => {
    const provider = new MoveNetProvider()
    const frameWithoutRightElbow = keypoints.filter(point => point.name !== 'right_elbow')
    const form = provider.analyzeForm(frameWithoutRightElbow)

    expect(form.mechanics?.omitted.elbow.reasonCode).toBe('missing-landmarks')
    expect(form.mechanics?.trusted.elbow).toBeUndefined()
  })

  it('omits low-confidence mechanics from canonical angles and scoring', () => {
    const provider = new MoveNetProvider()
    const lowConfidence = keypoints.map(point => ({ ...point, score: 0.1 }))
    const form = provider.analyzeForm(lowConfidence)

    expect(form.untrustedAngles?.elbow).toBe(160)
    expect(form.mechanics?.omitted.elbow.reasonCode).toBe('low-confidence')
    expect(form.angles.elbow).toBeNull()
    expect(form.scores.perJoint.elbow).toBeUndefined()
    expect(form.scores.overallScore).toBeNull()
  })
})
