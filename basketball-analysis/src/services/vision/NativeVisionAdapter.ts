import {
  ShotIQVision,
  encodePoseInputFrame,
  type EncodedVisionFrame,
  type NativeVisionPlugin,
} from '@/services/capacitorVision'
import type {
  FormAnalysis,
  PoseInput,
  PoseProvider,
  ProviderKeypoint,
} from '@/services/pose/types'

type NativeVisionMode = 'uninitialized' | 'native' | 'fallback'

interface NativeVisionAdapterOptions {
  plugin?: NativeVisionPlugin
  fallback: PoseProvider
  encodeFrame?: (input: PoseInput) => Promise<EncodedVisionFrame>
}

/**
 * Native iPhone pose provider. Apple Vision is preferred inside the Capacitor
 * shell; browser MoveNet is an explicit, durable fallback for Safari, simulator
 * builds, unsupported iOS versions, and interrupted native calls.
 */
export class NativeVisionAdapter implements PoseProvider {
  readonly id = 'native-ios-vision'
  readonly label = 'Apple Vision with MoveNet fallback'
  readonly onDevice = true

  private readonly plugin: NativeVisionPlugin
  private readonly fallback: PoseProvider
  private readonly encodeFrame: (input: PoseInput) => Promise<EncodedVisionFrame>
  private mode: NativeVisionMode = 'uninitialized'

  constructor(options: NativeVisionAdapterOptions) {
    this.plugin = options.plugin ?? ShotIQVision
    this.fallback = options.fallback
    this.encodeFrame = options.encodeFrame ?? encodePoseInputFrame
  }

  async init(): Promise<void> {
    if (this.mode !== 'uninitialized') return

    try {
      const availability = await this.plugin.isAvailable()
      if (availability.available) {
        this.mode = 'native'
        return
      }
    } catch {
      // A missing/unregistered Capacitor plugin is expected in Safari and web.
    }

    await this.activateFallback()
  }

  isReady(): boolean {
    if (this.mode === 'native') return true
    if (this.mode === 'fallback') return this.fallback.isReady()
    return false
  }

  async detectPose(input: PoseInput, timestampMs?: number): Promise<ProviderKeypoint[] | null> {
    if (this.mode === 'uninitialized') await this.init()
    if (this.mode === 'fallback') return this.fallback.detectPose(input, timestampMs)

    try {
      const frame = await this.encodeFrame(input)
      const result = await this.plugin.detectPose({ ...frame, timestampMs })
      return result.keypoints.length > 0 ? result.keypoints : null
    } catch {
      await this.activateFallback()
      return this.fallback.detectPose(input, timestampMs)
    }
  }

  analyzeForm(keypoints: ProviderKeypoint[]): FormAnalysis {
    // Native and web landmarks intentionally share ShotIQ's deterministic
    // scoring path, so the same body produces the same coaching result.
    return this.fallback.analyzeForm(keypoints)
  }

  private async activateFallback(): Promise<void> {
    this.mode = 'fallback'
    if (!this.fallback.isReady()) await this.fallback.init()
  }
}

export default NativeVisionAdapter
