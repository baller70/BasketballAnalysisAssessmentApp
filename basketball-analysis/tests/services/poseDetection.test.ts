import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const doubles = vi.hoisted(() => ({
  createDetector: vi.fn(),
  estimatePoses: vi.fn(),
  detectorDispose: vi.fn(),
  tfReady: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@tensorflow-models/pose-detection', () => ({
  createDetector: doubles.createDetector,
  SupportedModels: { MoveNet: 'MoveNet' },
  TrackerType: { Keypoint: 'keypoint' },
  movenet: {
    modelType: {
      SINGLEPOSE_LIGHTNING: 'single-lightning',
      SINGLEPOSE_THUNDER: 'single-thunder',
      MULTIPOSE_LIGHTNING: 'multi-lightning',
    },
  },
}))

vi.mock('@tensorflow/tfjs', () => ({
  ready: doubles.tfReady,
  getBackend: () => 'cpu',
}))

import { poseDetectionService } from '@/services/poseDetection'

function makePose(id: number, x: number, y: number, width: number, height: number) {
  return {
    id,
    score: 0.9,
    box: {
      xMin: x,
      yMin: y,
      xMax: x + width,
      yMax: y + height,
      width,
      height,
    },
    keypoints: Array.from({ length: 17 }, (_, index) => ({
      name: `point_${index}`,
      x: x + width * (index % 2 === 0 ? 0.3 : 0.7),
      y: y + height * (0.05 + (index / 17) * 0.9),
      score: 0.9,
    })),
  }
}

describe('poseDetectionService live shooter tracking', () => {
  beforeEach(() => {
    poseDetectionService.dispose()
    doubles.createDetector.mockReset()
    doubles.estimatePoses.mockReset()
    doubles.detectorDispose.mockReset()
    doubles.createDetector.mockResolvedValue({
      estimatePoses: doubles.estimatePoses,
      dispose: doubles.detectorDispose,
    })
  })

  afterEach(() => {
    poseDetectionService.dispose()
  })

  it('enables tracked multi-person detection for live mode', async () => {
    await poseDetectionService.initialize('multipose' as never)

    expect(doubles.createDetector).toHaveBeenCalledWith(
      'MoveNet',
      expect.objectContaining({
        modelType: 'multi-lightning',
        enableSmoothing: true,
        enableTracking: true,
        trackerType: 'keypoint',
      })
    )
  })

  it('replaces an existing single-person model when Live mode needs tracking', async () => {
    await poseDetectionService.initialize('lightning')
    await poseDetectionService.initialize('multipose' as never)

    expect(doubles.createDetector).toHaveBeenCalledTimes(2)
    expect(doubles.detectorDispose).toHaveBeenCalledTimes(1)
  })

  it('chooses the dominant full-body shooter instead of a smaller spectator', async () => {
    const spectator = makePose(2, 500, 80, 45, 90)
    const shooter = makePose(7, 120, 40, 260, 520)
    doubles.estimatePoses.mockResolvedValue([spectator, shooter])

    await poseDetectionService.initialize('multipose' as never)
    const detected = await poseDetectionService.detectPose({} as HTMLCanvasElement)

    expect(detected?.keypoints[0].x).toBe(shooter.keypoints[0].x)
  })

  it('keeps the locked shooter when detector result order changes', async () => {
    const shooter = makePose(7, 120, 40, 260, 520)
    const otherPerson = makePose(9, 430, 100, 180, 360)
    doubles.estimatePoses
      .mockResolvedValueOnce([shooter, otherPerson])
      .mockResolvedValueOnce([otherPerson, shooter])

    await poseDetectionService.initialize('multipose' as never)
    await poseDetectionService.detectPose({} as HTMLCanvasElement)
    const detected = await poseDetectionService.detectPose({} as HTMLCanvasElement)

    expect(detected?.keypoints[0].x).toBe(shooter.keypoints[0].x)
  })
})
