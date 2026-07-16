export type CaptureMode = 'form' | 'shot_tracking'
export type CaptureOrientation = 'upright' | 'sideways' | 'unknown'
export type CaptureLighting = 'good' | 'low' | 'unknown'
export type CaptureReadinessStatus = 'checking' | 'needs_attention' | 'ready'
export type CaptureCheckStatus = 'pass' | 'fail' | 'pending'

export type CaptureCheckId =
  | 'camera'
  | 'model'
  | 'pose'
  | 'orientation'
  | 'full_body'
  | 'subject_size'
  | 'pose_confidence'
  | 'stability'
  | 'lighting'
  | 'hoop'
  | 'ball'

export interface CaptureObservation {
  cameraReady: boolean
  modelReady: boolean
  poseDetected: boolean
  orientation: CaptureOrientation
  fullBodyVisible: boolean | null
  subjectFrameRatio: number | null
  poseConfidence: number | null
  stable: boolean | null
  lighting: CaptureLighting
  hoopVisible: boolean | null
  ballVisible: boolean | null
}

export interface CaptureRequirements {
  minPoseConfidence: number
  minSubjectFrameRatio: number
  maxSubjectFrameRatio: number
  requireFullBody: boolean
  requireUpright: boolean
  requireStability: boolean
  requireLighting: boolean
  requireHoop: boolean
  requireBall: boolean
}

export interface CaptureReadinessInput {
  mode: CaptureMode
  observation: CaptureObservation
  requirements?: Partial<CaptureRequirements>
}

export interface CaptureCheck {
  id: CaptureCheckId
  label: string
  status: CaptureCheckStatus
  message: string
}

export interface CaptureReadiness {
  status: CaptureReadinessStatus
  ready: boolean
  checks: CaptureCheck[]
  failedChecks: CaptureCheck[]
  primaryIssue: CaptureCheck | null
}

interface PoseLike {
  keypoints: Array<{ x: number; y: number; score?: number }>
}

export interface DerivePoseCaptureObservationInput {
  cameraReady: boolean
  modelReady: boolean
  orientation: CaptureOrientation
  pose: PoseLike | null
  frameHeight: number
}

const DEFAULT_REQUIREMENTS: CaptureRequirements = {
  minPoseConfidence: 0.45,
  minSubjectFrameRatio: 0.25,
  maxSubjectFrameRatio: 0.9,
  requireFullBody: true,
  requireUpright: true,
  requireStability: false,
  requireLighting: false,
  requireHoop: false,
  requireBall: false,
}

const check = (
  id: CaptureCheckId,
  label: string,
  status: CaptureCheckStatus,
  message: string
): CaptureCheck => ({ id, label, status, message })

export function evaluateCaptureReadiness(input: CaptureReadinessInput): CaptureReadiness {
  const { observation } = input
  const requirements = { ...DEFAULT_REQUIREMENTS, ...input.requirements }
  const checks: CaptureCheck[] = []

  checks.push(observation.cameraReady
    ? check('camera', 'Camera', 'pass', 'Camera is ready')
    : check('camera', 'Camera', 'pending', 'Starting camera…'))

  checks.push(observation.modelReady
    ? check('model', 'ShotIQ Vision', 'pass', 'ShotIQ Vision is ready')
    : check('model', 'ShotIQ Vision', 'pending', 'Loading ShotIQ Vision…'))

  if (!observation.cameraReady || !observation.modelReady) {
    return buildReadiness(checks)
  }

  checks.push(observation.poseDetected
    ? check('pose', 'Shooter', 'pass', 'Shooter detected')
    : check('pose', 'Shooter', 'fail', 'Step into frame so ShotIQ can find you'))

  if (!observation.poseDetected) {
    return buildReadiness(checks)
  }

  if (requirements.requireUpright) {
    const orientationStatus: CaptureCheckStatus = observation.orientation === 'upright'
      ? 'pass'
      : observation.orientation === 'sideways'
        ? 'fail'
        : 'pending'
    checks.push(check(
      'orientation',
      'Orientation',
      orientationStatus,
      orientationStatus === 'pass'
        ? 'Body orientation is upright'
        : orientationStatus === 'fail'
          ? 'Keep the phone upright while ShotIQ aligns the camera'
          : 'Checking body orientation…'
    ))
  }

  if (requirements.requireFullBody) {
    const fullBodyStatus: CaptureCheckStatus = observation.fullBodyVisible === true
      ? 'pass'
      : observation.fullBodyVisible === false
        ? 'fail'
        : 'pending'
    checks.push(check(
      'full_body',
      'Full body',
      fullBodyStatus,
      fullBodyStatus === 'pass'
        ? 'Full body is visible'
        : fullBodyStatus === 'fail'
          ? 'Step back until your head and both feet are visible'
          : 'Checking full-body framing…'
    ))
  }

  const ratio = observation.subjectFrameRatio
  if (ratio === null) {
    checks.push(check('subject_size', 'Distance', 'pending', 'Checking your distance…'))
  } else if (ratio < requirements.minSubjectFrameRatio) {
    checks.push(check('subject_size', 'Distance', 'fail', 'Move closer so your body is easier to track'))
  } else if (ratio > requirements.maxSubjectFrameRatio) {
    checks.push(check('subject_size', 'Distance', 'fail', 'Step back so your full body stays in frame'))
  } else {
    checks.push(check('subject_size', 'Distance', 'pass', 'Camera distance is good'))
  }

  const confidence = observation.poseConfidence
  if (confidence === null) {
    checks.push(check('pose_confidence', 'Tracking', 'pending', 'Checking tracking quality…'))
  } else if (confidence < requirements.minPoseConfidence) {
    checks.push(check('pose_confidence', 'Tracking', 'fail', 'Hold still and face the camera until tracking locks on'))
  } else {
    checks.push(check('pose_confidence', 'Tracking', 'pass', 'Tracking is locked'))
  }

  if (observation.stable === false) {
    checks.push(check('stability', 'Stability', 'fail', 'Keep the phone still or place it on a stable surface'))
  } else if (observation.stable === true) {
    checks.push(check('stability', 'Stability', 'pass', 'Camera is stable'))
  } else if (requirements.requireStability) {
    checks.push(check('stability', 'Stability', 'pending', 'Checking camera stability…'))
  }

  if (observation.lighting === 'low') {
    checks.push(check('lighting', 'Lighting', 'fail', 'Move to better lighting so ShotIQ can see your joints'))
  } else if (observation.lighting === 'good') {
    checks.push(check('lighting', 'Lighting', 'pass', 'Lighting is good'))
  } else if (requirements.requireLighting) {
    checks.push(check('lighting', 'Lighting', 'pending', 'Checking lighting…'))
  }

  if (requirements.requireHoop) {
    checks.push(observation.hoopVisible === true
      ? check('hoop', 'Hoop', 'pass', 'Hoop detected')
      : observation.hoopVisible === false
        ? check('hoop', 'Hoop', 'fail', 'Aim the camera so the hoop is fully visible')
        : check('hoop', 'Hoop', 'pending', 'Looking for the hoop…'))
  }

  if (requirements.requireBall) {
    checks.push(observation.ballVisible === true
      ? check('ball', 'Ball', 'pass', 'Basketball detected')
      : observation.ballVisible === false
        ? check('ball', 'Ball', 'fail', 'Hold the basketball where ShotIQ can see it')
        : check('ball', 'Ball', 'pending', 'Looking for the basketball…'))
  }

  return buildReadiness(checks)
}

function buildReadiness(checks: CaptureCheck[]): CaptureReadiness {
  const failedChecks = checks.filter(item => item.status === 'fail')
  const pendingChecks = checks.filter(item => item.status === 'pending')
  const status: CaptureReadinessStatus = failedChecks.length > 0
    ? 'needs_attention'
    : pendingChecks.length > 0
      ? 'checking'
      : 'ready'

  return {
    status,
    ready: status === 'ready',
    checks,
    failedChecks,
    primaryIssue: failedChecks[0] ?? pendingChecks[0] ?? null,
  }
}

export function derivePoseCaptureObservation(
  input: DerivePoseCaptureObservationInput
): CaptureObservation {
  const { cameraReady, modelReady, orientation, pose, frameHeight } = input

  if (!pose || pose.keypoints.length < 17 || frameHeight <= 0) {
    return {
      cameraReady,
      modelReady,
      poseDetected: false,
      orientation,
      fullBodyVisible: null,
      subjectFrameRatio: null,
      poseConfidence: null,
      stable: null,
      lighting: 'unknown',
      hoopVisible: null,
      ballVisible: null,
    }
  }

  const confidentPoints = pose.keypoints.filter(point => (point.score ?? 0) >= 0.25)
  const ys = confidentPoints.map(point => point.y)
  const subjectFrameRatio = ys.length >= 2
    ? (Math.max(...ys) - Math.min(...ys)) / frameHeight
    : null

  const bodyPoints = pose.keypoints.slice(5, 17)
  const poseConfidence = bodyPoints.length > 0
    ? bodyPoints.reduce((total, point) => total + (point.score ?? 0), 0) / bodyPoints.length
    : null

  const requiredFullBodyIndices = [0, 5, 6, 11, 12, 15, 16]
  const fullBodyVisible = requiredFullBodyIndices.every(index =>
    (pose.keypoints[index]?.score ?? 0) >= 0.25
  )

  return {
    cameraReady,
    modelReady,
    poseDetected: true,
    orientation,
    fullBodyVisible,
    subjectFrameRatio,
    poseConfidence,
    stable: null,
    lighting: 'unknown',
    hoopVisible: null,
    ballVisible: null,
  }
}
