import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const points = [
  { name: 'right_shoulder', x: 20, y: 200, score: 0.9 },
  { name: 'right_elbow', x: 30, y: 150, score: 0.9 },
  { name: 'right_wrist', x: 40, y: 90, score: 0.9 },
]
const canonicalForm = {
  angles: { elbow: 160, knee: 145, shoulder: 70, hip: 170, release: 5, wrist: 55 },
  scores: { overallScore: 90, perJoint: {}, measuredCount: 6 },
  status: {},
  overallScore: 90,
  tips: [],
  measuredCount: 6,
  mechanics: { measurements: {}, trusted: {}, omitted: {}, trustedMeasurements: [], omittedMeasurements: [], all: [], overallConfidence: 0.9, hasTrustedMeasurements: true },
  canonicalObservation: { timestampMs: 100, keypoints: points, poseConfidence: 0.9, phase: 'gather', mechanics: { measurements: {}, trusted: {}, omitted: {}, trustedMeasurements: [], omittedMeasurements: [], all: [], overallConfidence: 0.9, hasTrustedMeasurements: true } },
}
const provider = {
  init: vi.fn(async () => undefined),
  isReady: vi.fn(() => true),
  detectPose: vi.fn(async () => points),
  analyzeForm: vi.fn(() => canonicalForm),
  reset: vi.fn(),
}

vi.mock('@/services/pose', () => ({
  getPoseProvider: vi.fn(() => provider),
  providerKeypointsToPose: (keypoints: typeof points) => ({ keypoints }),
}))
vi.mock('@/services/poseDetection', () => ({
  poseDetectionService: {
    calculateShootingAngles: vi.fn(),
    analyzeShootingForm: vi.fn(() => ({
      elbowStatus: 'good', elbowMessage: '', kneeStatus: 'good', kneeMessage: '',
      shoulderStatus: 'good', shoulderMessage: '', hipStatus: 'good', hipMessage: '',
      releaseStatus: 'good', releaseMessage: '', wristStatus: 'good', wristMessage: '',
      overallScore: 90, tips: [],
    })),
    detectShootingMotion: vi.fn(() => false),
  },
}))
vi.mock('@/utils/platform', () => ({ getPlatform: () => 'web' }))

import { usePoseDetection } from '@/hooks/usePoseDetection'

afterEach(() => {
  vi.restoreAllMocks()
  provider.init.mockClear()
  provider.detectPose.mockClear()
  provider.analyzeForm.mockClear()
  provider.reset.mockClear()
})

describe('usePoseDetection canonical provider seam', () => {
  it('routes a live frame through analyzeForm and preserves canonical metadata', async () => {
    const rafCallbacks: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      rafCallbacks.push(callback)
      return rafCallbacks.length
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    // A very high target allows the first rAF pass to run immediately; the
    // callback is still captured so the test never starts an unbounded loop.
    const { result } = renderHook(() => usePoseDetection({ targetFps: 1_000_000 }))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const video = document.createElement('video')
    Object.defineProperty(video, 'readyState', { value: 2 })
    Object.defineProperty(video, 'currentTime', { value: 0 })
    act(() => result.current.startDetection(video))
    await waitFor(() => expect(provider.analyzeForm).toHaveBeenCalled())
    expect(provider.analyzeForm.mock.calls[0][1]).toBeGreaterThan(0)
    expect(result.current.analysis).toBe(canonicalForm)
    act(() => result.current.stopDetection())
    expect(provider.reset).toHaveBeenCalled()
    void rafCallbacks
  })
})
