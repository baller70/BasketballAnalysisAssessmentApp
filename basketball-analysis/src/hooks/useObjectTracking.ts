import { useCallback, useEffect, useRef, useState } from 'react'

import { cocoBallDetector, type CocoDetectorInput } from '@/services/vision/CocoBallDetector'
import type { BallObservation } from '@/lib/vision/objectTracking'

export interface ObjectTrackingDetector {
  init(): Promise<void>
  isReady(): boolean
  detect(input: CocoDetectorInput, timestampMs?: number): Promise<BallObservation | null>
  reset(): void
}

export interface UseObjectTrackingOptions {
  detector?: ObjectTrackingDetector
  targetFps?: number
  prepareVideoFrame?: (video: HTMLVideoElement) => CocoDetectorInput
}

export interface UseObjectTrackingReturn {
  ball: BallObservation | null
  error: Error | null
  fps: number
  isLoading: boolean
  isTracking: boolean
  startTracking(video: HTMLVideoElement): void
  stopTracking(): void
}

/** Run COCO object inference separately from the higher-frequency pose loop. */
export function useObjectTracking(
  options: UseObjectTrackingOptions = {},
): UseObjectTrackingReturn {
  const detector = options.detector ?? cocoBallDetector
  const targetFps = Math.max(1, Math.min(12, options.targetFps ?? 6))
  const prepareVideoFrame = options.prepareVideoFrame
  const [ball, setBall] = useState<BallObservation | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [fps, setFps] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isTracking, setIsTracking] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const trackingRef = useRef(false)
  const inFlightRef = useRef(false)
  const frameRef = useRef<number | null>(null)
  const lastInferenceRef = useRef(0)
  const frameCountRef = useRef(0)
  const fpsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setError(null)
    detector.init()
      .then(() => {
        if (active) setIsLoading(false)
      })
      .catch((reason) => {
        if (!active) return
        setError(reason instanceof Error ? reason : new Error('Object tracking could not start'))
        setIsLoading(false)
      })
    return () => { active = false }
  }, [detector])

  const runTracking = useCallback(async () => {
    const video = videoRef.current
    if (!trackingRef.current || !video) return

    const scheduleNext = () => {
      if (trackingRef.current) frameRef.current = requestAnimationFrame(runTracking)
    }
    if (video.readyState < 2) {
      scheduleNext()
      return
    }

    const now = performance.now()
    const minimumInterval = 1000 / targetFps
    if (now - lastInferenceRef.current < minimumInterval || inFlightRef.current) {
      scheduleNext()
      return
    }

    lastInferenceRef.current = now
    inFlightRef.current = true
    try {
      const input = prepareVideoFrame ? prepareVideoFrame(video) : video
      const observation = await detector.detect(input, now)
      if (trackingRef.current) {
        setBall(observation)
        frameCountRef.current += 1
      }
    } catch (reason) {
      if (trackingRef.current) {
        setError(reason instanceof Error ? reason : new Error('Basketball tracking failed'))
      }
    } finally {
      inFlightRef.current = false
      scheduleNext()
    }
  }, [detector, prepareVideoFrame, targetFps])

  const startTracking = useCallback((video: HTMLVideoElement) => {
    if (trackingRef.current || isLoading || error || !detector.isReady()) return
    detector.reset()
    videoRef.current = video
    trackingRef.current = true
    setIsTracking(true)
    setBall(null)
    lastInferenceRef.current = performance.now() - (1000 / targetFps)
    frameCountRef.current = 0
    fpsTimerRef.current = setInterval(() => {
      setFps(frameCountRef.current)
      frameCountRef.current = 0
    }, 1000)
    void runTracking()
  }, [detector, error, isLoading, runTracking, targetFps])

  const stopTracking = useCallback(() => {
    trackingRef.current = false
    inFlightRef.current = false
    setIsTracking(false)
    setFps(0)
    setBall(null)
    videoRef.current = null
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    if (fpsTimerRef.current !== null) clearInterval(fpsTimerRef.current)
    fpsTimerRef.current = null
    detector.reset()
  }, [detector])

  useEffect(() => stopTracking, [stopTracking])

  return {
    ball,
    error,
    fps,
    isLoading,
    isTracking,
    startTracking,
    stopTracking,
  }
}
