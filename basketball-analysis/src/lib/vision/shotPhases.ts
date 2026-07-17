/**
 * Shot phase domain model shared by live, uploaded-video, and native capture.
 *
 * The tracker deliberately has no camera/UI dependencies.  Adapters provide a
 * canonical frame observation and receive a monotonic phase event back.  A
 * caller may provide explicit detector signals (`released`, `rimEvent`, ...)
 * when a ball/rim detector is available; the small kinematic fallback keeps
 * body-only MoveNet capture useful as well.
 */

export const SHOT_PHASES = [
  'gather',
  'rise',
  'set',
  'release',
  'follow-through',
  'flight',
  'rim-event',
  'complete',
] as const

export type ShotPhase = (typeof SHOT_PHASES)[number]

export interface ShotLandmark {
  x: number
  y: number
  confidence?: number | null
}

export interface ShotBallObservation extends ShotLandmark {
  /** True when a detector can see the ball in flight. */
  inFlight?: boolean
}

export interface ShotRimObservation extends ShotLandmark {
  width?: number
  height?: number
}

/**
 * Signals accepted from either a pose provider or a ball/rim detector. All
 * fields besides timestamp are optional so body-only mode can still advance.
 */
export interface ShotFrameObservation {
  timestampMs: number
  /** Active shooting wrist in input pixel coordinates. */
  wristY?: number | null
  wristConfidence?: number | null
  /** Optional named keypoints; used by `observationFromKeypoints`. */
  keypoints?: readonly ShotKeypoint[] | null
  poseConfidence?: number | null
  elbowAngle?: number | null
  kneeAngle?: number | null
  ball?: ShotBallObservation | null
  rim?: ShotRimObservation | null
  ballConfidence?: number | null
  rimConfidence?: number | null
  /** Detector hints. They are intentionally optional and never fabricated. */
  isSet?: boolean
  released?: boolean
  ballInFlight?: boolean
  rimEvent?: boolean
  shotComplete?: boolean
}

export interface ShotKeypoint {
  name: string
  x: number
  y: number
  score?: number | null
}

export interface ShotPhaseTrackerOptions {
  /** Minimum confidence for using a pose or ball signal. Default 0.35. */
  minConfidence?: number
  /** Minimum upward movement in pixels to classify a rise. Default 2. */
  risePixels?: number
  /** Number of near-stationary frames required before body-only set. */
  setStableFrames?: number
  /** Body-only follow-through frames before a shot is complete. */
  followThroughFrames?: number
  /** Distance from the rim center considered a rim event, in pixels. */
  rimDistancePixels?: number
}

export interface ShotPhaseEvent {
  phase: ShotPhase
  /** Alias retained for consumers that call this a state. */
  state: ShotPhase
  previousPhase: ShotPhase
  changed: boolean
  timestampMs: number
  confidence: number | null
  reason: string
}

export interface ShotPhaseTrace {
  events: ShotPhaseEvent[]
  phases: ShotPhase[]
  finalPhase: ShotPhase
}

const DEFAULT_OPTIONS: Required<ShotPhaseTrackerOptions> = {
  minConfidence: 0.35,
  risePixels: 2,
  setStableFrames: 2,
  followThroughFrames: 3,
  rimDistancePixels: 42,
}

const finite = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value)

function confidenceOf(value: number | null | undefined): number | null {
  return finite(value) ? Math.max(0, Math.min(1, value)) : null
}

function pointConfidence(point: ShotLandmark | null | undefined): number | null {
  return confidenceOf(point?.confidence)
}

function activeWrist(
  keypoints: readonly ShotKeypoint[] | null | undefined,
  minimumConfidence = DEFAULT_OPTIONS.minConfidence,
): ShotKeypoint | null {
  if (!keypoints?.length) return null
  const wrists = keypoints
    .filter((point) => /(?:^|_)(left|right)_wrist$/.test(point.name))
    .filter((point) => {
      const confidence = confidenceOf(point.score)
      // Unknown confidence is allowed for already-gated server observations;
      // a known weak wrist must not win side selection for phase movement.
      return confidence === null || confidence >= minimumConfidence
    })
  if (!wrists.length) return null
  // In a shooting motion the active wrist is normally the higher wrist.
  return wrists.reduce((higher, point) => point.y < higher.y ? point : higher)
}

function averagePoseConfidence(keypoints: readonly ShotKeypoint[] | null | undefined): number | null {
  if (!keypoints?.length) return null
  const scores = keypoints
    .map((point) => confidenceOf(point.score))
    .filter((score): score is number => score !== null)
  return scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null
}

/** Convert the adapter's named keypoints to the canonical phase observation. */
export function observationFromKeypoints(
  keypoints: readonly ShotKeypoint[] | null,
  timestampMs: number,
  extras: Omit<ShotFrameObservation, 'keypoints' | 'timestampMs' | 'wristY' | 'wristConfidence' | 'poseConfidence'> = {}
): ShotFrameObservation {
  const wrist = activeWrist(keypoints)
  return {
    ...extras,
    timestampMs,
    keypoints,
    wristY: wrist?.y ?? null,
    wristConfidence: confidenceOf(wrist?.score),
    poseConfidence: averagePoseConfidence(keypoints),
  }
}

function normalizedObservation(
  observation: ShotFrameObservation
): ShotFrameObservation {
  if (finite(observation.wristY) || !observation.keypoints) return observation
  return observationFromKeypoints(observation.keypoints, observation.timestampMs, observation)
}

function validPose(observation: ShotFrameObservation, minimum: number): boolean {
  const pose = confidenceOf(observation.poseConfidence)
  const wrist = confidenceOf(observation.wristConfidence)
  // If no confidence is supplied (for example a server observation already
  // gated upstream), the numeric wrist is still usable.
  if (pose === null && wrist === null) return finite(observation.wristY)
  return (pose === null || pose >= minimum) && (wrist === null || wrist >= minimum)
}

function validBall(observation: ShotFrameObservation, minimum: number): boolean {
  const confidence = confidenceOf(observation.ballConfidence ?? pointConfidence(observation.ball))
  return Boolean(observation.ball && (confidence === null || confidence >= minimum))
}

function isNearRim(observation: ShotFrameObservation, options: Required<ShotPhaseTrackerOptions>): boolean {
  if (!observation.ball || !observation.rim || !validBall(observation, options.minConfidence)) return false
  const dx = observation.ball.x - observation.rim.x
  const dy = observation.ball.y - observation.rim.y
  const normalizedCoordinates = [observation.ball.x, observation.ball.y, observation.rim.x, observation.rim.y]
    .every((value) => value >= 0 && value <= 1.5)
  const radius = normalizedCoordinates
    ? Math.max(0.08, (observation.rim.width ?? 0) / 2, (observation.rim.height ?? 0) / 2)
    : Math.max(
        options.rimDistancePixels,
        (observation.rim.width ?? 0) / 2,
        (observation.rim.height ?? 0) / 2,
      )
  return Math.hypot(dx, dy) <= radius
}

function nextPhase(
  phase: ShotPhase,
  current: ShotFrameObservation,
  previous: ShotFrameObservation | null,
  stableFrames: number,
  options: Required<ShotPhaseTrackerOptions>,
  phaseFrames = 0,
): { phase: ShotPhase; reason: string } {
  const observation = normalizedObservation(current)
  const hasPose = validPose(observation, options.minConfidence)
  const upward = hasPose && previous && finite(previous.wristY) && finite(observation.wristY)
    ? previous.wristY! - observation.wristY!
    : 0
  const stationary = hasPose && previous && finite(previous.wristY) && finite(observation.wristY)
    ? Math.abs(observation.wristY! - previous.wristY!) <= options.risePixels
    : false
  const ballInFlight = observation.ballInFlight ?? observation.ball?.inFlight ?? false
  const releaseHint = observation.released === true
  const rimHint = observation.rimEvent === true || isNearRim(observation, options)

  switch (phase) {
    case 'gather':
      if (upward >= options.risePixels || releaseHint) return { phase: 'rise', reason: 'Upward motion detected' }
      return { phase, reason: 'Waiting for upward motion' }
    case 'rise':
      if (observation.isSet || (stationary && stableFrames >= options.setStableFrames)) {
        return { phase: 'set', reason: 'Body reached a stable set position' }
      }
      if (releaseHint) return { phase: 'set', reason: 'Release signal received; recording set before release' }
      return { phase, reason: 'Loading into the shot' }
    case 'set':
      if (releaseHint || ballInFlight) return { phase: 'release', reason: 'Ball release signal received' }
      // A clearly extending shooting arm is a useful body-only fallback.
      if (finite(observation.elbowAngle) && observation.elbowAngle >= 145) {
        return { phase: 'release', reason: 'Shooting arm extension detected' }
      }
      return { phase, reason: 'Holding the set position' }
    case 'release':
      if (ballInFlight || validBall(observation, options.minConfidence)) {
        return { phase: 'follow-through', reason: 'Ball separated from the shooting hand' }
      }
      // MoveNet does not currently include a ball detector. Once the arm has
      // extended (or one valid body frame has elapsed after release), advance
      // to the body follow-through phase instead of getting stuck in release.
      const extendedArm = finite(observation.elbowAngle) && observation.elbowAngle >= 145
      const previouslyExtended = Boolean(
        previous && finite(previous.elbowAngle) && previous.elbowAngle >= 145
      )
      if (hasPose && (extendedArm || previouslyExtended || phaseFrames >= 2)) {
        return { phase: 'follow-through', reason: 'Body follow-through frame captured' }
      }
      return { phase, reason: 'Release captured' }
    case 'follow-through':
      if (rimHint) return { phase: 'flight', reason: 'Ball flight toward the rim detected' }
      if (ballInFlight) return { phase: 'flight', reason: 'Ball is in flight' }
      if (observation.shotComplete) return { phase: 'complete', reason: 'Shot sequence completed' }
      if (hasPose && phaseFrames >= options.followThroughFrames) {
        return { phase: 'complete', reason: 'Body follow-through completed' }
      }
      // A single follow-through frame is still meaningful when no ball model is
      // available. Keep it until the adapter reports a flight signal.
      return { phase, reason: 'Holding follow-through' }
    case 'flight':
      if (rimHint) return { phase: 'rim-event', reason: 'Ball reached the rim window' }
      if (observation.shotComplete) return { phase: 'complete', reason: 'Shot sequence completed' }
      return { phase, reason: 'Tracking ball flight' }
    case 'rim-event':
      if (observation.shotComplete || !ballInFlight) return { phase: 'complete', reason: 'Rim event resolved' }
      return { phase, reason: 'Recording rim interaction' }
    case 'complete':
      return { phase, reason: 'Shot is complete; reset before the next attempt' }
  }
}

/**
 * Pure one-step transition. `previousObservation` is optional for explicit
 * detector signals and required for movement-based gather/rise/set detection.
 */
export function transitionShotPhase(
  previousPhase: ShotPhase,
  observation: ShotFrameObservation,
  previousObservation: ShotFrameObservation | null = null,
  options: ShotPhaseTrackerOptions = {}
): ShotPhaseEvent {
  const merged = { ...DEFAULT_OPTIONS, ...options }
  const transition = nextPhase(previousPhase, observation, previousObservation, 0, merged)
  const confidence = confidenceOf(observation.poseConfidence ?? observation.wristConfidence)
  return {
    phase: transition.phase,
    state: transition.phase,
    previousPhase,
    changed: transition.phase !== previousPhase,
    timestampMs: observation.timestampMs,
    confidence,
    reason: transition.reason,
  }
}

/** Stateful tracker used by the live adapter; call `reset` for a new shot. */
export class ShotPhaseTracker {
  private readonly options: Required<ShotPhaseTrackerOptions>
  private currentPhase: ShotPhase = 'gather'
  private previousObservation: ShotFrameObservation | null = null
  private stableFrames = 0
  private phaseFrames = 0

  constructor(options: ShotPhaseTrackerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  get phase(): ShotPhase {
    return this.currentPhase
  }

  update(observation: ShotFrameObservation): ShotPhaseEvent {
    const normalized = normalizedObservation(observation)
    const stationary = this.previousObservation && finite(this.previousObservation.wristY) && finite(normalized.wristY)
      ? Math.abs(this.previousObservation.wristY! - normalized.wristY!) <= this.options.risePixels
      : false
    this.stableFrames = stationary ? this.stableFrames + 1 : 0
    const transition = nextPhase(
      this.currentPhase,
      normalized,
      this.previousObservation,
      this.stableFrames,
      this.options,
      this.phaseFrames + 1,
    )
    const previousPhase = this.currentPhase
    this.currentPhase = transition.phase
    this.phaseFrames = transition.phase === previousPhase ? this.phaseFrames + 1 : 1
    this.previousObservation = normalized
    return {
      phase: transition.phase,
      state: transition.phase,
      previousPhase,
      changed: previousPhase !== transition.phase,
      timestampMs: normalized.timestampMs,
      confidence: confidenceOf(normalized.poseConfidence ?? normalized.wristConfidence),
      reason: transition.reason,
    }
  }

  reset(): void {
    this.currentPhase = 'gather'
    this.previousObservation = null
    this.stableFrames = 0
    this.phaseFrames = 0
  }
}

export function createShotPhaseTracker(options: ShotPhaseTrackerOptions = {}): ShotPhaseTracker {
  return new ShotPhaseTracker(options)
}

/** Track an entire sequence and retain every phase transition for review. */
export function trackShotPhases(
  observations: readonly ShotFrameObservation[],
  options: ShotPhaseTrackerOptions = {}
): ShotPhaseTrace {
  const tracker = new ShotPhaseTracker(options)
  const events = observations.map((observation) => tracker.update(observation))
  return {
    events,
    phases: events.map((event) => event.phase),
    finalPhase: tracker.phase,
  }
}

/** Explicit alias for integrations that call the operation `detect`. */
export const detectShotPhases = trackShotPhases

// Naming aliases keep the domain seam pleasant for callers that describe a
// frame update as "advancing" a state machine rather than "transitioning" it.
export const advanceShotPhase = transitionShotPhase
export const ShotPhaseStateMachine = ShotPhaseTracker
export const createPhaseTracker = createShotPhaseTracker
