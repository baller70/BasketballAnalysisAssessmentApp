import {
  isValidRimCalibration,
  type BallObservation,
  type RimCalibration,
} from '@/lib/vision/objectTracking'

export type ShotResult = 'make' | 'miss' | 'unknown'

export interface ShotResultProvenance {
  source: 'calibrated_ball_trajectory'
  rimCalibrated: boolean
  sampleCount: number
  trustedSampleCount: number
}

export interface ShotResultObservation {
  result: ShotResult
  confidence: number | null
  final: boolean
  timestampMs: number
  reason: string
  provenance: ShotResultProvenance
}

export interface ShotTrajectoryInput {
  timestampMs: number
  ball: BallObservation | null
  rim: RimCalibration | null
}

export interface ShotTrajectoryTrackerOptions {
  minBallConfidence?: number
  maxTrustedGapMs?: number
  maxHistory?: number
}

interface TrustedSample {
  timestampMs: number
  ball: BallObservation
}

const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value))

/**
 * Conservative 2D trajectory classifier shared by live and uploaded video.
 * It intentionally leaves incomplete or weak evidence as `unknown`.
 */
export class ShotTrajectoryTracker {
  private readonly minBallConfidence: number
  private readonly maxTrustedGapMs: number
  private readonly maxHistory: number
  private history: TrustedSample[] = []
  private totalSamples = 0
  private lastTimestampMs: number | null = null
  private hadAboveApproach = false
  private hadDownwardApproach = false
  private crossedInsideCylinder = false
  private resolved: ShotResultObservation | null = null

  constructor(options: ShotTrajectoryTrackerOptions = {}) {
    this.minBallConfidence = options.minBallConfidence ?? 0.35
    this.maxTrustedGapMs = options.maxTrustedGapMs ?? 750
    this.maxHistory = Math.max(4, Math.floor(options.maxHistory ?? 48))
  }

  update(input: ShotTrajectoryInput): ShotResultObservation {
    this.totalSamples += 1
    const timestampMs = finite(input.timestampMs) ? input.timestampMs : 0

    if (this.resolved) return this.resolved
    if (this.lastTimestampMs !== null && timestampMs <= this.lastTimestampMs) {
      return this.observation('unknown', null, false, timestampMs, 'Timestamps must be monotonic')
    }
    this.lastTimestampMs = timestampMs

    if (!isValidRimCalibration(input.rim)) {
      return this.observation('unknown', null, false, timestampMs, 'Calibrate the hoop before classifying a shot', false)
    }
    const rim = input.rim
    const ball = input.ball
    if (!ball || !this.isTrustedBall(ball)) {
      return this.observation('unknown', null, false, timestampMs, 'Waiting for a trusted basketball observation')
    }

    const previous = this.history.at(-1) ?? null
    if (previous && timestampMs - previous.timestampMs > this.maxTrustedGapMs) {
      this.clearTrajectory()
    }

    const activePrevious = this.history.at(-1) ?? null
    const rimTop = rim.centerY - rim.height / 2
    const rimBottom = rim.centerY + rim.height / 2
    const innerHalfWidth = Math.max(0.01, rim.width / 2 - ball.width * 0.15)
    const outerHalfWidth = rim.width / 2 + ball.width / 2

    if (ball.centerY < rimTop && Math.abs(ball.centerX - rim.centerX) <= rim.width * 1.5) {
      this.hadAboveApproach = true
    }

    if (activePrevious) {
      const deltaY = ball.centerY - activePrevious.ball.centerY
      if (deltaY >= Math.max(0.004, rim.height * 0.04)) this.hadDownwardApproach = true

      if (
        this.hadAboveApproach
        && deltaY > 0
        && activePrevious.ball.centerY <= rim.centerY
        && ball.centerY >= rim.centerY
      ) {
        const distanceY = ball.centerY - activePrevious.ball.centerY
        const progress = distanceY > 0 ? (rim.centerY - activePrevious.ball.centerY) / distanceY : 0
        const crossingX = activePrevious.ball.centerX
          + (ball.centerX - activePrevious.ball.centerX) * Math.max(0, Math.min(1, progress))
        if (Math.abs(crossingX - rim.centerX) <= innerHalfWidth) {
          this.crossedInsideCylinder = true
        }
      }

      const bouncedUp = deltaY <= -Math.max(0.02, rim.height * 0.18)
      const previousNearRim = Math.abs(activePrevious.ball.centerX - rim.centerX) <= rim.width
        && activePrevious.ball.centerY >= rimTop - rim.height
        && activePrevious.ball.centerY <= rimBottom + rim.height / 2
      if (
        this.hadAboveApproach
        && this.hadDownwardApproach
        && !this.crossedInsideCylinder
        && previousNearRim
        && bouncedUp
      ) {
        this.push(timestampMs, ball)
        return this.resolve('miss', timestampMs, 'Ball changed direction at the rim without crossing the hoop cylinder')
      }
    }

    this.push(timestampMs, ball)

    if (
      this.crossedInsideCylinder
      && ball.centerY > rimBottom
      && Math.abs(ball.centerX - rim.centerX) <= outerHalfWidth
    ) {
      return this.resolve('make', timestampMs, 'Ball crossed downward through the calibrated hoop cylinder')
    }

    if (
      this.hadAboveApproach
      && this.hadDownwardApproach
      && !this.crossedInsideCylinder
      && ball.centerY > rimBottom
      && Math.abs(ball.centerX - rim.centerX) > outerHalfWidth
    ) {
      return this.resolve('miss', timestampMs, 'Ball exited below and outside the calibrated hoop cylinder')
    }

    return this.observation('unknown', null, false, timestampMs, 'Collecting calibrated ball trajectory')
  }

  reset(): void {
    this.history = []
    this.totalSamples = 0
    this.lastTimestampMs = null
    this.hadAboveApproach = false
    this.hadDownwardApproach = false
    this.crossedInsideCylinder = false
    this.resolved = null
  }

  private isTrustedBall(ball: BallObservation): boolean {
    return [ball.centerX, ball.centerY, ball.width, ball.height, ball.confidence, ball.timestampMs].every(finite)
      && ball.centerX >= 0 && ball.centerX <= 1
      && ball.centerY >= 0 && ball.centerY <= 1
      && ball.width > 0 && ball.height > 0
      && ball.confidence >= this.minBallConfidence
  }

  private clearTrajectory(): void {
    this.history = []
    this.hadAboveApproach = false
    this.hadDownwardApproach = false
    this.crossedInsideCylinder = false
  }

  private push(timestampMs: number, ball: BallObservation): void {
    this.history.push({ timestampMs, ball })
    if (this.history.length > this.maxHistory) this.history.splice(0, this.history.length - this.maxHistory)
  }

  private resolve(result: Exclude<ShotResult, 'unknown'>, timestampMs: number, reason: string): ShotResultObservation {
    const weakestConfidence = this.history.reduce(
      (minimum, sample) => Math.min(minimum, sample.ball.confidence),
      1,
    )
    const evidenceFactor = Math.min(1, this.history.length / 4)
    const confidence = clamp01(0.65 + weakestConfidence * 0.2 + evidenceFactor * 0.15)
    this.resolved = this.observation(result, confidence, true, timestampMs, reason)
    return this.resolved
  }

  private observation(
    result: ShotResult,
    confidence: number | null,
    final: boolean,
    timestampMs: number,
    reason: string,
    rimCalibrated = true,
  ): ShotResultObservation {
    return {
      result,
      confidence,
      final,
      timestampMs,
      reason,
      provenance: {
        source: 'calibrated_ball_trajectory',
        rimCalibrated,
        sampleCount: this.totalSamples,
        trustedSampleCount: this.history.length,
      },
    }
  }
}

export function createShotTrajectoryTracker(options: ShotTrajectoryTrackerOptions = {}): ShotTrajectoryTracker {
  return new ShotTrajectoryTracker(options)
}
