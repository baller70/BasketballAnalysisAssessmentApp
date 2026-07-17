'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Crosshair, RotateCcw, X } from 'lucide-react'

import {
  createRimCalibrationFromPoint,
  isValidRimCalibration,
  mapDisplayPointToFrame,
  mapFramePointToDisplay,
  type BallObservation,
  type FrameSize,
  type RimCalibration,
} from '@/lib/vision/objectTracking'

type FacingMode = 'user' | 'environment'
type Orientation = 'portrait' | 'landscape'

export function rimCalibrationStorageKey(facingMode: FacingMode, orientation: Orientation): string {
  return `shotiq_rim_calibration:${facingMode}:${orientation}`
}

export function loadRimCalibration(key: string): RimCalibration | null {
  if (typeof window === 'undefined') return null
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || 'null')
    return isValidRimCalibration(value) ? value : null
  } catch {
    return null
  }
}

export function saveRimCalibration(key: string, value: RimCalibration | null): void {
  if (typeof window === 'undefined') return
  if (value && isValidRimCalibration(value)) {
    window.localStorage.setItem(key, JSON.stringify(value))
  } else {
    window.localStorage.removeItem(key)
  }
}

export interface HoopCalibrationOverlayProps {
  frameSize: FrameSize
  facingMode: FacingMode
  orientation: Orientation
  value: RimCalibration | null
  ball?: BallObservation | null
  onChange(value: RimCalibration | null): void
  disabled?: boolean
  /** `null` keeps one-off uploaded-video calibration out of live-camera storage. */
  persistenceKey?: string | null
}

export function HoopCalibrationOverlay({
  frameSize,
  facingMode,
  orientation,
  value,
  ball = null,
  onChange,
  disabled = false,
  persistenceKey,
}: HoopCalibrationOverlayProps) {
  const [calibrating, setCalibrating] = useState(false)
  const [displaySize, setDisplaySize] = useState<FrameSize | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const storageKey = persistenceKey === undefined
    ? rimCalibrationStorageKey(facingMode, orientation)
    : persistenceKey

  useEffect(() => {
    setCalibrating(false)
  }, [storageKey])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const measure = () => {
      const rect = root.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) setDisplaySize({ width: rect.width, height: rect.height })
    }
    measure()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  const ringPoint = useMemo(() => {
    if (!value || !displaySize) return null
    return mapFramePointToDisplay(
      { x: value.centerX * frameSize.width, y: value.centerY * frameSize.height },
      frameSize,
      displaySize,
      facingMode === 'user',
    )
  }, [displaySize, facingMode, frameSize, value])

  const ballPoint = useMemo(() => {
    if (!ball || !displaySize) return null
    return mapFramePointToDisplay(
      { x: ball.centerX * frameSize.width, y: ball.centerY * frameSize.height },
      frameSize,
      displaySize,
      facingMode === 'user',
    )
  }, [ball, displaySize, facingMode, frameSize])

  const update = (next: RimCalibration | null) => {
    if (storageKey) saveRimCalibration(storageKey, next)
    onChange(next)
  }

  const handleCalibration = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const sourcePoint = mapDisplayPointToFrame(
      { x: event.clientX - rect.left, y: event.clientY - rect.top },
      { width: rect.width, height: rect.height },
      frameSize,
      facingMode === 'user',
    )
    if (!sourcePoint) return
    update(createRimCalibrationFromPoint(sourcePoint, frameSize))
    setCalibrating(false)
  }

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0 z-30">
      {ball && (
        <div
          data-ball-tracking="trusted"
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={ballPoint
            ? { left: ballPoint.x, top: ballPoint.y }
            : {
                left: `${(facingMode === 'user' ? 1 - ball.centerX : ball.centerX) * 100}%`,
                top: `${ball.centerY * 100}%`,
              }}
        >
          <div className="h-10 w-10 rounded-full border-4 border-[#FF6B35] bg-[#FF6B35]/20 shadow-[0_0_18px_rgba(255,107,53,0.95)]" />
          <span className="absolute left-1/2 top-11 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/80 px-2 py-1 text-[10px] font-black text-white">
            BALL {Math.round(ball.confidence * 100)}%
          </span>
        </div>
      )}

      {ringPoint && (
        <div
          aria-hidden="true"
          className="absolute h-8 w-20 -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-4 border-[#FF6B35] shadow-[0_0_20px_rgba(255,107,53,0.9)]"
          style={{ left: ringPoint.x, top: ringPoint.y }}
        />
      )}

      {calibrating && (
        <button
          type="button"
          aria-label="Tap the center of the hoop"
          className="pointer-events-auto absolute inset-0 cursor-crosshair bg-black/15"
          onClick={handleCalibration}
        >
          <span className="absolute left-1/2 top-24 -translate-x-1/2 rounded-full bg-black/80 px-4 py-2 text-sm font-bold text-white">
            Tap the center of the hoop
          </span>
        </button>
      )}

      <div className="pointer-events-auto absolute right-4 top-20 flex items-center gap-2">
        {value ? (
          <>
            <button
              type="button"
              aria-label="Recalibrate hoop"
              disabled={disabled}
              onClick={() => setCalibrating(true)}
              className="flex items-center gap-2 rounded-full border border-[#FF6B35]/60 bg-black/75 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
            >
              <Crosshair className="h-4 w-4 text-[#FF6B35]" />
              <span>Hoop locked</span>
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Clear hoop calibration"
              disabled={disabled}
              onClick={() => update(null)}
              className="rounded-full border border-white/20 bg-black/75 p-2 text-white disabled:opacity-40"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            aria-label="Calibrate hoop"
            disabled={disabled}
            onClick={() => setCalibrating(true)}
            className="flex items-center gap-2 rounded-full bg-[#FF6B35] px-3 py-2 text-xs font-black text-white shadow-lg disabled:opacity-40"
          >
            <Crosshair className="h-4 w-4" />
            Calibrate hoop
          </button>
        )}
      </div>
    </div>
  )
}
