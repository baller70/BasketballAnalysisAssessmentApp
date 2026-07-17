import { describe, expect, it, vi } from 'vitest'

import { CocoBallDetector, type CocoObjectModel } from '@/services/vision/CocoBallDetector'

const canvas = Object.assign(document.createElement('canvas'), { width: 640, height: 360 })

describe('CocoBallDetector', () => {
  it('loads one model once across repeated initialization and detection', async () => {
    const model: CocoObjectModel = { detect: vi.fn(async () => []) }
    const loadModel = vi.fn(async () => model)
    const detector = new CocoBallDetector({ loadModel })

    await detector.init()
    await detector.init()
    await detector.detect(canvas, 100)

    expect(loadModel).toHaveBeenCalledTimes(1)
    expect(model.detect).toHaveBeenCalledTimes(1)
    expect(detector.isReady()).toBe(true)
  })

  it('maps only a trusted sports ball into the canonical normalized observation', async () => {
    const model: CocoObjectModel = {
      detect: vi.fn(async () => [
        { class: 'person', score: 0.99, bbox: [0, 0, 300, 350] },
        { class: 'sports ball', score: 0.91, bbox: [500, 70, 40, 40] },
        { class: 'sports ball', score: 0.2, bbox: [100, 50, 30, 30] },
      ]),
    }
    const detector = new CocoBallDetector({ loadModel: async () => model })

    const ball = await detector.detect(canvas, 500)

    expect(ball).toMatchObject({
      centerX: 0.8125,
      centerY: 0.25,
      width: 0.0625,
      confidence: 0.91,
      timestampMs: 500,
    })
  })

  it('keeps track continuity and clears it when reset', async () => {
    const detect = vi.fn()
      .mockResolvedValueOnce([{ class: 'sports ball', score: 0.8, bbox: [100, 100, 40, 40] }])
      .mockResolvedValueOnce([
        { class: 'sports ball', score: 0.99, bbox: [500, 100, 40, 40] },
        { class: 'sports ball', score: 0.7, bbox: [115, 105, 40, 40] },
      ])
      .mockResolvedValueOnce([
        { class: 'sports ball', score: 0.99, bbox: [500, 100, 40, 40] },
        { class: 'sports ball', score: 0.7, bbox: [115, 105, 40, 40] },
      ])
    const detector = new CocoBallDetector({ loadModel: async () => ({ detect }) })

    await detector.detect(canvas, 100)
    expect((await detector.detect(canvas, 200))?.centerX).toBeCloseTo(0.2109375)
    detector.reset()
    expect((await detector.detect(canvas, 300))?.centerX).toBeCloseTo(0.8125)
  })

  it('returns null for missing dimensions and exposes model failures', async () => {
    const detector = new CocoBallDetector({
      loadModel: async () => ({ detect: async () => [] }),
    })
    const emptyCanvas = document.createElement('canvas')
    expect(await detector.detect(emptyCanvas)).toBeNull()

    const failure = new CocoBallDetector({
      loadModel: async () => { throw new Error('model unavailable') },
    })
    await expect(failure.init()).rejects.toThrow('model unavailable')
    expect(failure.isReady()).toBe(false)
  })
})
