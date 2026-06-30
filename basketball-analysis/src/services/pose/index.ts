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
import type { PoseProvider, FormAnalysis, ProviderKeypoint } from './types'

export * from './types'
export { MoveNetProvider } from './MoveNetProvider'
export { HybridApiProvider } from './HybridApiProvider'

export type PoseProviderId = 'movenet' | 'hybrid-api'

let defaultProvider: PoseProvider | null = null

/**
 * Returns a pose provider. With no argument (or 'movenet') you get the shared,
 * memoized on-device MoveNet provider — the canonical engine. Pass 'hybrid-api'
 * only if a server backend has been explicitly configured (experimental).
 */
export function getPoseProvider(id: PoseProviderId = 'movenet'): PoseProvider {
  if (id === 'hybrid-api') {
    return new HybridApiProvider()
  }
  if (!defaultProvider) {
    defaultProvider = new MoveNetProvider('lightning')
  }
  return defaultProvider
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
 * Only measured joints are emitted — nothing is fabricated.
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
  if (a.release !== null) out['release_angle'] = a.release
  if (a.wrist !== null) out['wrist_angle'] = a.wrist
  return out
}
