/**
 * Canonical, UI-independent object observations used by live and uploaded
 * video. Pixel-space detector output is normalized once so orientation and
 * object-cover transforms can be applied consistently by consumers.
 */

export interface FrameSize {
  width: number
  height: number
}

export interface PixelRect {
  x: number
  y: number
  width: number
  height: number
}

export interface NormalizedRect {
  centerX: number
  centerY: number
  width: number
  height: number
}

export interface ObjectDetection {
  label: string
  confidence: number
  box: PixelRect
}

export interface BallObservation extends NormalizedRect {
  confidence: number
  timestampMs: number
}

export interface RimCalibration extends NormalizedRect {
  calibratedAtMs: number
  source: 'manual'
}

const BALL_LABELS = new Set(['sports ball', 'basketball', 'ball'])
const MIN_BALL_CONFIDENCE = 0.35
const TRACK_MEMORY_MS = 750

const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.max(minimum, Math.min(maximum, value))

const rounded = (value: number): number => Math.round(value * 1_000_000) / 1_000_000

function validFrame(frame: FrameSize): boolean {
  return finite(frame.width) && finite(frame.height) && frame.width > 0 && frame.height > 0
}

function normalizeDetection(
  detection: ObjectDetection,
  frame: FrameSize,
  timestampMs: number,
): BallObservation | null {
  const { box } = detection
  if (
    !validFrame(frame) ||
    !finite(timestampMs) ||
    !finite(detection.confidence) ||
    !finite(box.x) ||
    !finite(box.y) ||
    !finite(box.width) ||
    !finite(box.height) ||
    box.width <= 0 ||
    box.height <= 0
  ) return null

  const left = clamp(box.x, 0, frame.width)
  const top = clamp(box.y, 0, frame.height)
  const right = clamp(box.x + box.width, 0, frame.width)
  const bottom = clamp(box.y + box.height, 0, frame.height)
  if (right <= left || bottom <= top) return null

  return {
    centerX: ((left + right) / 2) / frame.width,
    centerY: ((top + bottom) / 2) / frame.height,
    width: (right - left) / frame.width,
    height: (bottom - top) / frame.height,
    confidence: clamp(detection.confidence, 0, 1),
    timestampMs,
  }
}

function distance(left: NormalizedRect, right: NormalizedRect): number {
  return Math.hypot(left.centerX - right.centerX, left.centerY - right.centerY)
}

/** Select one basketball without silently jumping to a distant detection. */
export function selectBallObservation(
  detections: readonly ObjectDetection[],
  frame: FrameSize,
  previous: BallObservation | null = null,
  timestampMs = typeof performance !== 'undefined' ? performance.now() : Date.now(),
  minimumConfidence = MIN_BALL_CONFIDENCE,
): BallObservation | null {
  if (!validFrame(frame)) return null

  const candidates = detections
    .filter((item) => BALL_LABELS.has(item.label.trim().toLowerCase()))
    .filter((item) => finite(item.confidence) && item.confidence >= minimumConfidence)
    .map((item) => normalizeDetection(item, frame, timestampMs))
    .filter((item): item is BallObservation => item !== null)

  if (!candidates.length) return null
  const canContinue = previous && timestampMs >= previous.timestampMs
    && timestampMs - previous.timestampMs <= TRACK_MEMORY_MS
  if (canContinue) {
    return candidates.reduce((nearest, candidate) =>
      distance(candidate, previous) < distance(nearest, previous) ? candidate : nearest)
  }
  return candidates.reduce((best, candidate) =>
    candidate.confidence > best.confidence ? candidate : best)
}

/**
 * One-tap hoop calibration. The target is clamped fully inside the frame so a
 * tap at the edge still yields valid trajectory geometry.
 */
export function createRimCalibrationFromPoint(
  point: { x: number; y: number },
  frame: FrameSize,
  calibratedAtMs = Date.now(),
): RimCalibration {
  if (!validFrame(frame) || !finite(point.x) || !finite(point.y)) {
    throw new Error('A valid frame and calibration point are required')
  }
  const width = 0.14
  const height = 0.12
  return {
    centerX: rounded(clamp(point.x / frame.width, width / 2, 1 - width / 2)),
    centerY: rounded(clamp(point.y / frame.height, height / 2, 1 - height / 2)),
    width,
    height,
    calibratedAtMs,
    source: 'manual',
  }
}

export function isValidRimCalibration(value: RimCalibration | null | undefined): value is RimCalibration {
  if (!value) return false
  const numbers = [value.centerX, value.centerY, value.width, value.height, value.calibratedAtMs]
  if (!numbers.every(finite) || value.source !== 'manual') return false
  if (value.width <= 0 || value.height <= 0 || value.width > 1 || value.height > 1) return false
  return value.centerX - value.width / 2 >= 0
    && value.centerX + value.width / 2 <= 1
    && value.centerY - value.height / 2 >= 0
    && value.centerY + value.height / 2 <= 1
}

export function normalizedRectToPixels(rect: NormalizedRect, frame: FrameSize): PixelRect {
  if (!validFrame(frame)) throw new Error('A valid frame is required')
  return {
    x: Math.round((rect.centerX - rect.width / 2) * frame.width),
    y: Math.round((rect.centerY - rect.height / 2) * frame.height),
    width: Math.round(rect.width * frame.width),
    height: Math.round(rect.height * frame.height),
  }
}
