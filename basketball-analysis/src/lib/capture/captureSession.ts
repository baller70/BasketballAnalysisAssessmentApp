import type { CreateCaptureSessionInput } from '@/lib/api/captureSessions'

/**
 * Browser/native capture details that can be converted into the API contract.
 * The builder is deliberately pure: callers collect device/runtime values at
 * the edge, while tests and native bridges can use the exact same mapping.
 */
export interface CaptureSessionMetadataInput {
  mode: CreateCaptureSessionInput['mode']
  source: CreateCaptureSessionInput['source']
  platform: CreateCaptureSessionInput['platform']
  deviceModel?: string | null
  cameraFacing?: CreateCaptureSessionInput['cameraFacing']
  orientation?: CreateCaptureSessionInput['orientation']
  view?: CreateCaptureSessionInput['view']
  shootingHand?: CreateCaptureSessionInput['shootingHand']
  poseProvider?: string | null
  poseModel?: string | null
  readinessStatus?: CreateCaptureSessionInput['readinessStatus']
  readinessChecks?: unknown
  frameWidth?: number | null
  frameHeight?: number | null
  startedAt?: Date | string
  observation?: CreateCaptureSessionInput['observation']
}

function optionalString(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function optionalPositiveInt(value: number | null | undefined): number | undefined {
  return Number.isInteger(value) && value! > 0 ? value! : undefined
}

/** Build a validation-safe capture-session payload without reading browser globals. */
export function buildCaptureSessionMetadata(
  input: CaptureSessionMetadataInput,
): CreateCaptureSessionInput {
  const metadata: CreateCaptureSessionInput = {
    mode: input.mode,
    source: input.source,
    platform: input.platform,
    readinessStatus: input.readinessStatus ?? 'checking',
  }

  const deviceModel = optionalString(input.deviceModel)
  const poseProvider = optionalString(input.poseProvider)
  const poseModel = optionalString(input.poseModel)
  const frameWidth = optionalPositiveInt(input.frameWidth)
  const frameHeight = optionalPositiveInt(input.frameHeight)

  if (deviceModel) metadata.deviceModel = deviceModel
  if (input.cameraFacing) metadata.cameraFacing = input.cameraFacing
  if (input.orientation) metadata.orientation = input.orientation
  if (input.view) metadata.view = input.view
  if (input.shootingHand) metadata.shootingHand = input.shootingHand
  if (poseProvider) metadata.poseProvider = poseProvider
  if (poseModel) metadata.poseModel = poseModel
  if (input.readinessChecks !== undefined) metadata.readinessChecks = input.readinessChecks
  if (frameWidth) metadata.frameWidth = frameWidth
  if (frameHeight) metadata.frameHeight = frameHeight
  if (input.startedAt !== undefined) metadata.startedAt = input.startedAt
  if (input.observation) metadata.observation = input.observation

  return metadata
}

/** Convert a live camera facing mode into the persisted capture vocabulary. */
export function normalizeCameraFacing(
  facingMode: 'user' | 'environment' | string | undefined,
): NonNullable<CreateCaptureSessionInput['cameraFacing']> {
  if (facingMode === 'user') return 'front'
  if (facingMode === 'environment') return 'rear'
  return 'unknown'
}

/** Convert a camera/display orientation into the persisted capture vocabulary. */
export function normalizeCaptureOrientation(
  orientation: string | undefined,
): NonNullable<CreateCaptureSessionInput['orientation']> {
  if (orientation === 'portrait') return 'portrait'
  if (orientation === 'landscape') return 'landscape'
  return 'portrait'
}

/** Map a platform detector result to the API's stable platform values. */
export function normalizeCapturePlatform(
  platform: string | undefined,
): CreateCaptureSessionInput['platform'] {
  if (platform === 'ios') return 'ios'
  if (platform === 'android') return 'android'
  if (platform === 'desktop') return 'desktop'
  return 'web'
}
