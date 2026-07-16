/**
 * Pose provider registry + shared client-side helpers.
 *
 * The canonical engine is on-device MoveNet. Callers should use
 * `getPoseProvider()` (returns the default MoveNet provider) and the helpers
 * below rather than talking to any pose engine directly, so image / video /
 * live analysis all flow through one seam with one scoring path.
 */

import { MoveNetProvider } from './MoveNetProvider'
import { HybridApiProvider } from './HybridApiProvider'
import { NativeVisionAdapter } from '@/services/vision/NativeVisionAdapter'
import type { PoseProvider, FormAnalysis, ProviderKeypoint } from './types'
import type { ModelType } from '@/services/poseDetection'

export * from './types'
export { MoveNetProvider } from './MoveNetProvider'
export { HybridApiProvider } from './HybridApiProvider'
export { providerKeypointsToPose } from './conversions'

export type PoseProviderId = 'movenet' | 'native-ios' | 'hybrid-api'

const moveNetProviders = new Map<ModelType, PoseProvider>()
const nativeVisionProviders = new Map<ModelType, PoseProvider>()

/**
 * Returns a pose provider. With no argument (or 'movenet') you get the shared,
 * memoized on-device MoveNet provider — the canonical engine. Pass 'hybrid-api'
 * only if a server backend has been explicitly configured (experimental).
 */
export function getPoseProvider(
  id: PoseProviderId = 'movenet',
  modelType: ModelType = 'lightning'
): PoseProvider {
  if (id === 'hybrid-api') {
    return new HybridApiProvider()
  }
  if (id === 'native-ios') {
    let provider = nativeVisionProviders.get(modelType)
    if (!provider) {
      provider = new NativeVisionAdapter({
        fallback: getPoseProvider('movenet', modelType),
      })
      nativeVisionProviders.set(modelType, provider)
    }
    return provider
  }
  let provider = moveNetProviders.get(modelType)
  if (!provider) {
    provider = new MoveNetProvider(modelType)
    moveNetProviders.set(modelType, provider)
  }
  return provider
}

/** Load an image source (data URL, object URL, or http URL) into an element. */
export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image for pose detection'))
    img.src = src
  })
}

/** Turn a File into a loaded <img> element (revokes its object URL on load). */
export async function fileToImageElement(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file)
  try {
    return await loadImageElement(url)
  } finally {
    // The element retains the decoded bitmap after load, so it's safe to revoke.
    URL.revokeObjectURL(url)
  }
}

export interface ImageAnalysis {
  keypoints: ProviderKeypoint[] | null
  form: FormAnalysis | null
  imageSize: { width: number; height: number }
}

/**
 * Detect + score a single still frame (image or canvas) through the canonical
 * provider. Returns `keypoints: null` / `form: null` when no person is detected
 * — callers must treat that as a real "no pose" state, not a default score.
 */
export async function analyzeImageElement(
  input: HTMLImageElement | HTMLCanvasElement,
  providerId: PoseProviderId = 'movenet'
): Promise<ImageAnalysis> {
  const provider = getPoseProvider(providerId)
  // Providers are memoized so model initialization is cheap, but their phase
  // tracker is intentionally session-scoped. A still image must never inherit
  // the previous live/video shot state.
  provider.reset?.()
  await provider.init()

  const width =
    input instanceof HTMLImageElement ? input.naturalWidth : input.width
  const height =
    input instanceof HTMLImageElement ? input.naturalHeight : input.height
  const imageSize = { width, height }

  const keypoints = await provider.detectPose(input)
  if (!keypoints) {
    return { keypoints: null, form: null, imageSize }
  }
  const form = provider.analyzeForm(keypoints)
  return { keypoints, form, imageSize }
}

/**
 * Convert canonical keypoints into the loosely-keyed `Record<name,{x,y,confidence}>`
 * shape the legacy UI components (AutoScreenshots, SkeletonOverlay) expect.
 */
export function keypointsToRecord(
  keypoints: ProviderKeypoint[]
): Record<string, { x: number; y: number; confidence: number; source: string }> {
  const out: Record<
    string,
    { x: number; y: number; confidence: number; source: string }
  > = {}
  for (const kp of keypoints) {
    out[kp.name] = { x: kp.x, y: kp.y, confidence: kp.score, source: 'movenet' }
  }
  return out
}

/**
 * Convert canonical angles into the loosely-keyed `Record<string,number>` the
 * flaw engine (detectFlawsFromAngles) and screenshot overlays read. Emits both
 * generic (`elbow_angle`) and right-side-prefixed (`right_elbow_angle`) keys so
 * downstream consumers resolve a value regardless of which convention they use.
 *
 * Also emits the keypoint-derived pose signals carried on the form (shoulder /
 * hip tilt and a true ball-launch arc) under the snake_case keys the flaw engine
 * expects, so balance/alignment and arc flaws can fire. Only measured joints and
 * confidently-detected signals are emitted — nothing is fabricated.
 */
export function formAnglesToRecord(form: FormAnalysis): Record<string, number> {
  const a = form.angles
  const out: Record<string, number> = {}
  const put = (joint: string, value: number | null) => {
    if (value === null || Number.isNaN(value)) return
    out[`${joint}_angle`] = value
    out[`right_${joint}_angle`] = value
  }
  put('elbow', a.elbow)
  put('knee', a.knee)
  put('shoulder', a.shoulder)
  put('hip', a.hip)
  // `release` is the canonical vertical-deviation follow-through angle (ideal 0).
  // It is intentionally NOT the ball-launch arc emitted below — different metric.
  if (a.release !== null) out['release_angle'] = a.release
  if (a.wrist !== null) out['wrist_angle'] = a.wrist

  const signals = form.poseSignals
  if (signals) {
    const emit = (value: number | null | undefined, ...keys: string[]) => {
      if (typeof value !== 'number' || Number.isNaN(value)) return
      for (const key of keys) out[key] = value
    }
    // Shoulder/hip tilt: deviation from level (0 = square), what SHOULDER_TILT
    // and HIP_ROTATION read. hip_tilt is a frontal-alignment proxy for rotation.
    emit(signals.shoulderTilt, 'shoulder_tilt')
    emit(signals.hipTilt, 'hip_tilt')
    // Ball-launch arc (forearm elevation above horizontal). Distinct from
    // `release_angle` above; emitted under several aliases so the flaw engine's
    // arc rules (FLAT_SHOT / HIGH_ARC) resolve regardless of the key they probe.
    emit(signals.launchArc, 'launch_angle', 'ball_arc', 'release_arc', 'arc')
  }

  return out
}
