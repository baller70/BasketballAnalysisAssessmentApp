import { describe, expect, it } from 'vitest'

import {
  createRimCalibrationFromPoint,
  isValidRimCalibration,
  mapDisplayPointToFrame,
  mapFramePointToDisplay,
  normalizedRectToPixels,
  selectBallObservation,
  type BallObservation,
  type ObjectDetection,
} from '@/lib/vision/objectTracking'

const frame = { width: 1000, height: 500 }

function detection(
  label: string,
  confidence: number,
  x: number,
  y: number,
  width = 40,
  height = 40,
): ObjectDetection {
  return { label, confidence, box: { x, y, width, height } }
}

describe('selectBallObservation', () => {
  it('keeps only a confident basketball-class detection and normalizes it', () => {
    const selected = selectBallObservation([
      detection('person', 0.99, 100, 100, 300, 350),
      detection('sports ball', 0.82, 780, 90, 50, 50),
      detection('sports ball', 0.2, 300, 120),
    ], frame, null, 1250)

    expect(selected).toMatchObject({
      centerX: 0.805,
      centerY: 0.23,
      width: 0.05,
      height: 0.1,
      confidence: 0.82,
      timestampMs: 1250,
    })
  })

  it('prefers continuity with the prior tracked ball over a distant higher score', () => {
    const previous: BallObservation = {
      centerX: 0.25,
      centerY: 0.3,
      width: 0.04,
      height: 0.08,
      confidence: 0.8,
      timestampMs: 100,
    }

    const selected = selectBallObservation([
      detection('sports ball', 0.98, 800, 100),
      detection('basketball', 0.76, 240, 135),
    ], frame, previous, 200)

    expect(selected?.centerX).toBeCloseTo(0.26)
    expect(selected?.centerY).toBeCloseTo(0.31)
  })

  it('returns null for weak, malformed, or non-ball detections', () => {
    expect(selectBallObservation([
      detection('sports ball', 0.34, 10, 10),
      detection('person', 0.99, 20, 20),
      detection('basketball', 0.9, Number.NaN, 20),
    ], frame)).toBeNull()
    expect(selectBallObservation([detection('sports ball', 0.9, 10, 10)], { width: 0, height: 500 })).toBeNull()
  })
})

describe('rim calibration geometry', () => {
  it('maps object-cover display taps back to source pixels, including mirrored cameras', () => {
    // 16:9 source cropped into a 9:16 portrait preview.
    expect(mapDisplayPointToFrame(
      { x: 100, y: 200 },
      { width: 200, height: 400 },
      { width: 1280, height: 720 },
      false,
    )).toEqual({ x: 640, y: 360 })

    expect(mapDisplayPointToFrame(
      { x: 25, y: 200 },
      { width: 200, height: 400 },
      { width: 1280, height: 720 },
      true,
    )?.x).toBeGreaterThan(640)

    expect(mapFramePointToDisplay(
      { x: 640, y: 360 },
      { width: 1280, height: 720 },
      { width: 200, height: 400 },
      false,
    )).toEqual({ x: 100, y: 200 })
  })

  it('creates a bounded normalized hoop target from one frame-space point', () => {
    const rim = createRimCalibrationFromPoint({ x: 950, y: 25 }, frame, 999)

    expect(rim).toEqual({
      centerX: 0.93,
      centerY: 0.06,
      width: 0.14,
      height: 0.12,
      calibratedAtMs: 999,
      source: 'manual',
    })
    expect(isValidRimCalibration(rim)).toBe(true)
    expect(normalizedRectToPixels(rim, frame)).toEqual({
      x: 860,
      y: 0,
      width: 140,
      height: 60,
    })
  })

  it('rejects calibration values outside a normalized frame', () => {
    expect(isValidRimCalibration({
      centerX: 1.2,
      centerY: 0.5,
      width: 0.14,
      height: 0.12,
      calibratedAtMs: 1,
      source: 'manual',
    })).toBe(false)
    expect(isValidRimCalibration(null)).toBe(false)
  })
})
