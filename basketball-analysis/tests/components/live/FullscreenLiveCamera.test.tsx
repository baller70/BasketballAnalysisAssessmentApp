import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

const doubles = vi.hoisted(() => ({
  startDetection: vi.fn(),
  stopDetection: vi.fn(),
  startObjectTracking: vi.fn(),
  stopObjectTracking: vi.fn(),
  enableLiveVoiceFeedback: vi.fn(),
  disableLiveVoiceFeedback: vi.fn(),
  speakLiveFeedback: vi.fn(),
  lastPoseOptions: undefined as {
    modelType?: string
    targetFps?: number
    prepareVideoFrame?: (video: HTMLVideoElement) => HTMLVideoElement | HTMLCanvasElement
  } | undefined,
  cameraAvailable: true,
  mobile: false,
  platformOS: 'browser' as 'browser' | 'ios',
  pose: {
    keypoints: Array.from({ length: 17 }, (_, index) => ({
      x: 100 + index,
      y: 200 + index,
      score: 0.9,
    })),
    score: 0.9,
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/hooks/usePoseDetection', () => ({
  usePoseDetection: (options: {
    modelType?: string
    targetFps?: number
    prepareVideoFrame?: (video: HTMLVideoElement) => HTMLVideoElement | HTMLCanvasElement
  }) => {
    doubles.lastPoseOptions = options
    return {
      isLoading: false,
      isDetecting: false,
      pose: doubles.pose,
      angles: null,
      feedback: null,
      fps: 10,
      isShootingDetected: false,
      startDetection: doubles.startDetection,
      stopDetection: doubles.stopDetection,
    }
  },
}))

// Object-model startup is covered by useObjectTracking/CocoBallDetector tests.
// Keep this camera-coordinate suite isolated from a real browser GPU backend.
vi.mock('@/hooks/useObjectTracking', () => ({
  useObjectTracking: () => ({
    ball: null,
    error: null,
    fps: 0,
    isLoading: false,
    isTracking: false,
    startTracking: doubles.startObjectTracking,
    stopTracking: doubles.stopObjectTracking,
  }),
}))

vi.mock('@/components/live/ProfessionalSkeletonOverlay', () => ({
  ProfessionalSkeletonOverlay: ({ width, height, pose }: {
    width: number
    height: number
    pose: { keypoints: Array<{ x: number; y: number }> }
  }) => (
    <div
      data-testid="skeleton-overlay"
      data-width={width}
      data-height={height}
      data-x0={pose.keypoints[0].x}
      data-y0={pose.keypoints[0].y}
    />
  ),
}))

vi.mock('@/stores/analysisStore', () => ({
  useAnalysisStore: () => ({
    setUploadedImageBase64: vi.fn(),
    setVideoAnalysisData: vi.fn(),
  }),
}))

vi.mock('@/utils/platform', () => ({
  isMobile: () => doubles.mobile,
  getPlatformOS: () => doubles.platformOS,
}))
vi.mock('@/lib/usage', () => ({
  useUsage: () => ({ canAnalyze: true, remainingToday: 10, dailyLimit: 10, incrementUsage: vi.fn() }),
}))
vi.mock('@/lib/points/pointsContext', () => ({ usePoints: () => ({ earnPoints: vi.fn() }) }))
vi.mock('@/services/sessionStorage', () => ({ saveSession: vi.fn(), createSessionFromAnalysis: vi.fn() }))
vi.mock('@/lib/watermark', () => ({ addWatermarkToImage: vi.fn() }))
vi.mock('@/services/capacitorCamera', () => ({
  isCameraAvailable: () => doubles.cameraAvailable,
  requestCameraPermissions: vi.fn(),
}))
vi.mock('@/services/liveVoiceFeedback', () => ({
  enableLiveVoiceFeedback: doubles.enableLiveVoiceFeedback,
  disableLiveVoiceFeedback: doubles.disableLiveVoiceFeedback,
  playLiveFeedbackTone: vi.fn(),
  speakLiveFeedback: doubles.speakLiveFeedback,
}))

import { FullscreenLiveCamera } from '@/components/live/FullscreenLiveCamera'

describe('FullscreenLiveCamera pose coordinate space', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    doubles.startDetection.mockReset()
    doubles.stopDetection.mockReset()
    doubles.startObjectTracking.mockReset()
    doubles.stopObjectTracking.mockReset()
    doubles.enableLiveVoiceFeedback.mockReset()
    doubles.disableLiveVoiceFeedback.mockReset()
    doubles.speakLiveFeedback.mockReset()
    doubles.lastPoseOptions = undefined
    doubles.cameraAvailable = true
    doubles.mobile = false
    doubles.platformOS = 'browser'
    doubles.pose = {
      keypoints: Array.from({ length: 17 }, (_, index) => ({
        x: 100 + index,
        y: 200 + index,
        score: 0.9,
      })),
      score: 0.9,
    }
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 })
  })

  it('requests tracked multi-person detection in Live mode', async () => {
    doubles.cameraAvailable = false

    render(<FullscreenLiveCamera />)

    expect(doubles.lastPoseOptions?.modelType).toBe('multipose')
    expect(doubles.lastPoseOptions?.targetFps).toBe(30)
    await waitFor(() => expect(screen.queryByText('No Camera Available')).not.toBeNull())
  })

  it('renders each newly detected pose without a second delayed smoothing layer', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000)
    const videoTrack = {
      getSettings: () => ({ width: 1280, height: 720 }),
      stop: vi.fn(),
      kind: 'video',
      label: 'Desktop webcam',
    }
    const stream = {
      id: 'desktop-stream',
      getVideoTracks: () => [videoTrack],
      getTracks: () => [videoTrack],
    }
    const getUserMedia = vi.fn().mockResolvedValue(stream)
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    })
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()

    const { container, rerender } = render(<FullscreenLiveCamera />)
    const video = container.querySelector('video')
    expect(video).not.toBeNull()

    Object.defineProperty(video!, 'videoWidth', { configurable: true, value: 1280 })
    Object.defineProperty(video!, 'videoHeight', { configurable: true, value: 720 })

    await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(1))
    fireEvent.loadedMetadata(video!)
    await waitFor(() => expect(screen.queryByText('Starting camera...')).toBeNull())
    await waitFor(() => {
      expect(screen.getByTestId('skeleton-overlay').getAttribute('data-x0')).toBe('100')
    })

    doubles.pose = {
      keypoints: Array.from({ length: 17 }, (_, index) => ({
        x: 300 + index,
        y: 400 + index,
        score: 0.9,
      })),
      score: 0.9,
    }
    rerender(<FullscreenLiveCamera />)

    await waitFor(() => {
      expect(screen.getByTestId('skeleton-overlay').getAttribute('data-x0')).toBe('300')
    })
  })

  it('keeps inference aligned through rapid pause taps and page backgrounding', async () => {
    localStorage.removeItem('shotiq_audio_feedback')
    const videoTrack = {
      getSettings: () => ({ width: 1280, height: 720 }),
      stop: vi.fn(),
      kind: 'video',
      label: 'Mobile camera',
    }
    const stream = {
      id: 'lifecycle-stream',
      getVideoTracks: () => [videoTrack],
      getTracks: () => [videoTrack],
    }
    const getUserMedia = vi.fn().mockResolvedValue(stream)
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    })
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()

    const { container } = render(<FullscreenLiveCamera />)
    const video = container.querySelector('video')!
    Object.defineProperty(video, 'videoWidth', { configurable: true, value: 1280 })
    Object.defineProperty(video, 'videoHeight', { configurable: true, value: 720 })
    await waitFor(() => expect(getUserMedia).toHaveBeenCalled())
    fireEvent.loadedMetadata(video)
    await waitFor(() => expect(doubles.startDetection).toHaveBeenCalled())

    fireEvent.click(screen.getByTitle('Metric Settings'))
    const voiceToggle = screen.getByRole('button', { name: 'Toggle voice feedback' })
    fireEvent.click(voiceToggle)
    expect(doubles.enableLiveVoiceFeedback).toHaveBeenCalledOnce()
    expect(voiceToggle.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(voiceToggle)
    expect(doubles.disableLiveVoiceFeedback).toHaveBeenCalledOnce()
    const coachToggle = screen.getByRole('button', { name: 'Toggle shooting coach' })
    fireEvent.click(coachToggle)
    expect(coachToggle.getAttribute('aria-pressed')).toBe('true')
    expect(doubles.speakLiveFeedback).toHaveBeenCalledWith(
      'Shooting coach on. I will give you one clear cue after every shot.',
      true,
    )
    fireEvent.click(voiceToggle)
    expect(coachToggle.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(screen.getByText('Done'))

    const pause = screen.getByRole('button', { name: 'Pause live tracking' })
    fireEvent.click(pause)
    fireEvent.click(screen.getByRole('button', { name: 'Resume live tracking' }))
    expect(doubles.stopDetection).toHaveBeenCalled()
    expect(doubles.stopObjectTracking).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Pause live tracking' })).not.toBeNull()

    const startsBeforeBackground = doubles.startDetection.mock.calls.length
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
    fireEvent(document, new Event('visibilitychange'))
    const stopsAfterBackground = doubles.stopDetection.mock.calls.length
    expect(stopsAfterBackground).toBeGreaterThan(0)

    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    fireEvent(document, new Event('visibilitychange'))
    await waitFor(() => expect(doubles.startDetection.mock.calls.length).toBeGreaterThan(startsBeforeBackground))
  })

  it('sizes the skeleton from the intrinsic video frame when iPhone track settings differ', async () => {
    const videoTrack = {
      getSettings: () => ({ width: 1920, height: 1080 }),
      stop: vi.fn(),
      kind: 'video',
      label: 'iPhone camera',
    }
    const stream = {
      id: 'iphone-stream',
      getVideoTracks: () => [videoTrack],
      getTracks: () => [videoTrack],
    }
    const getUserMedia = vi.fn().mockResolvedValue(stream)

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    })
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()

    const { container } = render(<FullscreenLiveCamera />)
    const video = container.querySelector('video')
    expect(video).not.toBeNull()

    Object.defineProperty(video!, 'videoWidth', { configurable: true, value: 640 })
    Object.defineProperty(video!, 'videoHeight', { configurable: true, value: 480 })

    await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(1))
    fireEvent.loadedMetadata(video!)

    await waitFor(() => expect(screen.queryByText('Starting camera...')).toBeNull())
    await waitFor(() => {
      const overlay = screen.getByTestId('skeleton-overlay')
      expect(overlay.getAttribute('data-width')).toBe('640')
      expect(overlay.getAttribute('data-height')).toBe('480')
    })
  })

  it('uses the same normalized canvas for iPhone portrait display and pose detection', async () => {
    doubles.platformOS = 'ios'
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 844 })
    const setTransform = vi.fn()
    const drawImage = vi.fn()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      setTransform,
      drawImage,
    } as unknown as CanvasRenderingContext2D)
    const videoTrack = {
      getSettings: () => ({ width: 640, height: 480 }),
      stop: vi.fn(),
      kind: 'video',
      label: 'iPhone camera',
    }
    const stream = {
      id: 'iphone-portrait-stream',
      getVideoTracks: () => [videoTrack],
      getTracks: () => [videoTrack],
    }
    const getUserMedia = vi.fn().mockResolvedValue(stream)
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    })
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()

    const { container } = render(<FullscreenLiveCamera />)
    const video = container.querySelector('video')
    expect(video).not.toBeNull()
    Object.defineProperty(video!, 'videoWidth', { configurable: true, value: 640 })
    Object.defineProperty(video!, 'videoHeight', { configurable: true, value: 480 })

    await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(1))
    fireEvent.loadedMetadata(video!)
    await waitFor(() => expect(screen.queryByText('Starting camera...')).toBeNull())

    const prepareVideoFrame = doubles.lastPoseOptions?.prepareVideoFrame
    expect(prepareVideoFrame).toBeTypeOf('function')
    const previewCanvas = container.querySelector('canvas[data-camera-preview="normalized"]')
    expect(previewCanvas).not.toBeNull()

    const preparedFrame = prepareVideoFrame!(video!)
    expect(preparedFrame).toBe(previewCanvas)
    expect((preparedFrame as HTMLCanvasElement).width).toBe(640)
    expect((preparedFrame as HTMLCanvasElement).height).toBe(480)
    expect(setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0)
    expect(drawImage).toHaveBeenCalledWith(video, 0, 0, 640, 480)
  })

  it('keeps the live controls and metrics above the normalized iPhone portrait preview', async () => {
    doubles.platformOS = 'ios'
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 844 })
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      setTransform: vi.fn(),
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D)
    const videoTrack = {
      getSettings: () => ({ width: 640, height: 480 }),
      stop: vi.fn(),
      kind: 'video',
      label: 'iPhone camera',
    }
    const stream = {
      id: 'iphone-portrait-controls-stream',
      getVideoTracks: () => [videoTrack],
      getTracks: () => [videoTrack],
    }
    const getUserMedia = vi.fn().mockResolvedValue(stream)
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    })
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()

    const { container } = render(<FullscreenLiveCamera />)
    const video = container.querySelector('video')
    expect(video).not.toBeNull()
    Object.defineProperty(video!, 'videoWidth', { configurable: true, value: 640 })
    Object.defineProperty(video!, 'videoHeight', { configurable: true, value: 480 })

    await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(1))
    fireEvent.loadedMetadata(video!)
    await waitFor(() => expect(screen.queryByText('Starting camera...')).toBeNull())

    const preview = container.querySelector('canvas[data-camera-preview="normalized"]')
    const controls = screen.getByRole('group', { name: 'Live recording controls' })
    const metrics = screen.getByRole('region', { name: 'Live shot metrics' })

    expect(preview?.className.split(/\s+/)).toContain('z-[1]')
    expect(controls.className.split(/\s+/)).toContain('z-20')
    expect(metrics.className.split(/\s+/)).toContain('z-20')
  })

  it('rotates only after a detected horizontal torso proves the iPhone frame is sideways', async () => {
    doubles.cameraAvailable = false
    doubles.platformOS = 'ios'
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 844 })

    const horizontalKeypoints = Array.from({ length: 17 }, (_, index) => ({
      x: 100 + index,
      y: 240,
      score: 0.9,
    }))
    horizontalKeypoints[0] = { x: 90, y: 240, score: 0.9 }
    horizontalKeypoints[5] = { x: 150, y: 220, score: 0.9 }
    horizontalKeypoints[6] = { x: 150, y: 260, score: 0.9 }
    horizontalKeypoints[11] = { x: 340, y: 225, score: 0.9 }
    horizontalKeypoints[12] = { x: 340, y: 255, score: 0.9 }
    doubles.pose = { keypoints: horizontalKeypoints, score: 0.9 }

    const setTransform = vi.fn()
    const drawImage = vi.fn()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      setTransform,
      drawImage,
    } as unknown as CanvasRenderingContext2D)

    render(<FullscreenLiveCamera />)
    await waitFor(() => expect(screen.queryByText('No Camera Available')).not.toBeNull())

    const video = document.createElement('video')
    Object.defineProperty(video, 'videoWidth', { configurable: true, value: 640 })
    Object.defineProperty(video, 'videoHeight', { configurable: true, value: 480 })

    const preparedFrame = doubles.lastPoseOptions?.prepareVideoFrame?.(video)
    expect(preparedFrame).toBeInstanceOf(HTMLCanvasElement)
    expect((preparedFrame as HTMLCanvasElement).width).toBe(480)
    expect((preparedFrame as HTMLCanvasElement).height).toBe(640)
    expect(setTransform).toHaveBeenCalledWith(0, 1, -1, 0, 480, 0)
    expect(drawImage).toHaveBeenCalledWith(video, 0, 0, 640, 480)
  })
})
