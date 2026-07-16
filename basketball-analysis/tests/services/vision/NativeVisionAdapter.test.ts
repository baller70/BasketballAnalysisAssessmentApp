import { describe, expect, it } from 'vitest'

import { NativeVisionAdapter } from '@/services/vision/NativeVisionAdapter'
import type {
  NativeVisionDetectOptions,
  NativeVisionDetectResult,
  NativeVisionPlugin,
} from '@/services/capacitorVision'
import type {
  FormAnalysis,
  PoseInput,
  PoseProvider,
  ProviderKeypoint,
} from '@/services/pose'

class FakeFallbackProvider implements PoseProvider {
  readonly id = 'fallback-movenet'
  readonly label = 'Fallback MoveNet'
  readonly onDevice = true
  initCalls = 0
  detectCalls = 0
  ready = false
  analyzeCalls: Array<{ timestampMs?: number }> = []
  resetCalls = 0
  result: ProviderKeypoint[] | null = [
    { name: 'nose', x: 10, y: 20, score: 0.8 },
  ]

  async init() {
    this.initCalls += 1
    this.ready = true
  }

  isReady() {
    return this.ready
  }

  async detectPose() {
    this.detectCalls += 1
    return this.result
  }

  analyzeForm(_keypoints: ProviderKeypoint[], timestampMs?: number): FormAnalysis {
    this.analyzeCalls.push({ timestampMs })
    return {
      angles: {
        elbow: null,
        knee: null,
        shoulder: null,
        hip: null,
        release: null,
        wrist: null,
      },
      scores: { overallScore: null, perJoint: {}, measuredCount: 0 },
      status: {
        elbow: 'unknown',
        knee: 'unknown',
        shoulder: 'unknown',
        hip: 'unknown',
        release: 'unknown',
        wrist: 'unknown',
      },
      overallScore: null,
      tips: [],
      measuredCount: 0,
    }
  }

  reset() {
    this.resetCalls += 1
  }
}

class FakeNativePlugin implements NativeVisionPlugin {
  available = true
  throwOnDetect = false
  detectCalls: NativeVisionDetectOptions[] = []
  result: NativeVisionDetectResult = {
    keypoints: [{ name: 'nose', x: 320, y: 80, score: 0.96 }],
    score: 0.96,
    engine: 'apple-vision',
  }

  async isAvailable() {
    return { available: this.available, engine: 'apple-vision' as const }
  }

  async detectPose(options: NativeVisionDetectOptions) {
    this.detectCalls.push(options)
    if (this.throwOnDetect) throw new Error('Native Vision interrupted')
    return this.result
  }
}

const frame = {
  imageData: 'data:image/jpeg;base64,shotiq-frame',
  width: 640,
  height: 480,
}

const encodeFrame = async (_input: PoseInput) => frame

describe('NativeVisionAdapter', () => {
  it('uses Apple Vision when the native plugin is available', async () => {
    const plugin = new FakeNativePlugin()
    const fallback = new FakeFallbackProvider()
    const adapter = new NativeVisionAdapter({ plugin, fallback, encodeFrame })

    await adapter.init()
    const result = await adapter.detectPose(document.createElement('canvas'), 1250)

    expect(adapter.isReady()).toBe(true)
    expect(result).toEqual(plugin.result.keypoints)
    expect(plugin.detectCalls).toEqual([{ ...frame, timestampMs: 1250 }])
    expect(fallback.initCalls).toBe(0)
    expect(fallback.detectCalls).toBe(0)
  })

  it('initializes and uses MoveNet when the native plugin is unavailable', async () => {
    const plugin = new FakeNativePlugin()
    plugin.available = false
    const fallback = new FakeFallbackProvider()
    const adapter = new NativeVisionAdapter({ plugin, fallback, encodeFrame })

    await adapter.init()
    const result = await adapter.detectPose(document.createElement('canvas'))

    expect(result).toEqual(fallback.result)
    expect(fallback.initCalls).toBe(1)
    expect(fallback.detectCalls).toBe(1)
    expect(plugin.detectCalls).toHaveLength(0)
  })

  it('falls back explicitly when Apple Vision fails during a live frame', async () => {
    const plugin = new FakeNativePlugin()
    plugin.throwOnDetect = true
    const fallback = new FakeFallbackProvider()
    const adapter = new NativeVisionAdapter({ plugin, fallback, encodeFrame })

    await adapter.init()
    const firstResult = await adapter.detectPose(document.createElement('canvas'))
    const secondResult = await adapter.detectPose(document.createElement('canvas'))

    expect(firstResult).toEqual(fallback.result)
    expect(secondResult).toEqual(fallback.result)
    expect(plugin.detectCalls).toHaveLength(1)
    expect(fallback.initCalls).toBe(1)
    expect(fallback.detectCalls).toBe(2)
  })

  it('keeps the native frame timestamp for canonical fallback analysis and reset', async () => {
    const plugin = new FakeNativePlugin()
    const fallback = new FakeFallbackProvider()
    const adapter = new NativeVisionAdapter({ plugin, fallback, encodeFrame })

    await adapter.init()
    const keypoints = await adapter.detectPose(document.createElement('canvas'), 4321)
    adapter.analyzeForm(keypoints ?? [])

    expect(fallback.analyzeCalls.at(-1)?.timestampMs).toBe(4321)
    adapter.reset()
    expect(fallback.resetCalls).toBe(1)
  })
})
