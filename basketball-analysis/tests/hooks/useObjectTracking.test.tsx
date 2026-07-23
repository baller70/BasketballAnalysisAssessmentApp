import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useObjectTracking } from '@/hooks/useObjectTracking'
import type { BallObservation } from '@/lib/vision/objectTracking'

const ball: BallObservation = {
  centerX: 0.5,
  centerY: 0.25,
  width: 0.05,
  height: 0.08,
  confidence: 0.9,
  timestampMs: 100,
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('useObjectTracking', () => {
  it('initializes once, avoids overlapping inference, and resets on stop', async () => {
    let resolveDetection: ((value: BallObservation) => void) | undefined
    const detector = {
      init: vi.fn(async () => undefined),
      isReady: vi.fn(() => true),
      detect: vi.fn(() => new Promise<BallObservation>((resolve) => { resolveDetection = resolve })),
      reset: vi.fn(),
    }
    const frameCallbacks: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      frameCallbacks.push(callback)
      return frameCallbacks.length
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    const { result } = renderHook(() => useObjectTracking({ detector, targetFps: 6 }))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const video = document.createElement('video')
    Object.defineProperty(video, 'readyState', { value: 2 })
    act(() => result.current.startTracking(video))
    await waitFor(() => expect(detector.detect).toHaveBeenCalledTimes(1))

    // No next frame exists until the in-flight prediction completes.
    expect(frameCallbacks).toHaveLength(0)
    act(() => result.current.startTracking(video))
    expect(detector.detect).toHaveBeenCalledTimes(1)

    await act(async () => resolveDetection?.(ball))
    expect(result.current.ball).toEqual(ball)
    expect(frameCallbacks).toHaveLength(1)

    act(() => result.current.stopTracking())
    expect(detector.reset).toHaveBeenCalled()
    expect(result.current.isTracking).toBe(false)
  })

  it('surfaces initialization failures and does not start tracking', async () => {
    const detector = {
      init: vi.fn(async () => { throw new Error('object model unavailable') }),
      isReady: vi.fn(() => false),
      detect: vi.fn(),
      reset: vi.fn(),
    }
    vi.stubGlobal('requestAnimationFrame', vi.fn())
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    const { result } = renderHook(() => useObjectTracking({ detector }))
    await waitFor(() => expect(result.current.error?.message).toBe('object model unavailable'))

    act(() => result.current.startTracking(document.createElement('video')))
    expect(detector.detect).not.toHaveBeenCalled()
    expect(result.current.isTracking).toBe(false)
  })

  it('runs object detection against the same prepared pixels as pose detection', async () => {
    const prepared = document.createElement('canvas')
    prepared.width = 720
    prepared.height = 1280
    const detector = {
      init: vi.fn(async () => undefined),
      isReady: vi.fn(() => true),
      detect: vi.fn(async () => null),
      reset: vi.fn(),
    }
    const prepareVideoFrame = vi.fn(() => prepared)
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    const { result } = renderHook(() => useObjectTracking({
      detector,
      targetFps: 6,
      prepareVideoFrame,
    }))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const video = document.createElement('video')
    Object.defineProperty(video, 'readyState', { value: 2 })
    act(() => result.current.startTracking(video))
    await waitFor(() => expect(detector.detect).toHaveBeenCalled())

    expect(prepareVideoFrame).toHaveBeenCalledWith(video)
    expect(detector.detect.mock.calls[0][0]).toBe(prepared)
    act(() => result.current.stopTracking())
  })

  it('discards a ball observation from a stopped tracking session', async () => {
    let resolveDetection: ((value: BallObservation) => void) | undefined
    const detector = {
      init: vi.fn(async () => undefined),
      isReady: vi.fn(() => true),
      detect: vi.fn(() => new Promise<BallObservation>((resolve) => { resolveDetection = resolve })),
      reset: vi.fn(),
    }
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    const { result } = renderHook(() => useObjectTracking({ detector }))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    const video = document.createElement('video')
    Object.defineProperty(video, 'readyState', { value: 2 })

    act(() => result.current.startTracking(video))
    await waitFor(() => expect(detector.detect).toHaveBeenCalledTimes(1))
    act(() => result.current.stopTracking())
    await act(async () => resolveDetection?.(ball))

    expect(result.current.ball).toBeNull()
    expect(result.current.isTracking).toBe(false)
  })
})
