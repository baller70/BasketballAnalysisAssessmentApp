import {
  selectBallObservation,
  type BallObservation,
  type ObjectDetection,
} from '@/lib/vision/objectTracking'
import { prepareVisionTensorflowBackend } from '@/services/vision/tensorflowBackend'

export type CocoDetectorInput = HTMLImageElement | HTMLCanvasElement | HTMLVideoElement

export interface CocoPrediction {
  class: string
  score: number
  bbox: [number, number, number, number]
}

export interface CocoObjectModel {
  detect(input: CocoDetectorInput, maxNumBoxes?: number, minScore?: number): Promise<CocoPrediction[]>
  dispose?(): void
}

export interface CocoBallDetectorOptions {
  loadModel?: () => Promise<CocoObjectModel>
}

async function loadDefaultModel(): Promise<CocoObjectModel> {
  await prepareVisionTensorflowBackend()
  const cocoSsd = await import('@tensorflow-models/coco-ssd')
  return cocoSsd.load({ base: 'lite_mobilenet_v2' })
}

function inputSize(input: CocoDetectorInput): { width: number; height: number } {
  if (typeof HTMLVideoElement !== 'undefined' && input instanceof HTMLVideoElement) {
    return { width: input.videoWidth, height: input.videoHeight }
  }
  if (typeof HTMLImageElement !== 'undefined' && input instanceof HTMLImageElement) {
    return { width: input.naturalWidth || input.width, height: input.naturalHeight || input.height }
  }
  return { width: input.width, height: input.height }
}

/** Lightweight on-device basketball detector backed by COCO-SSD sports-ball. */
export class CocoBallDetector {
  private readonly loadModel: () => Promise<CocoObjectModel>
  private model: CocoObjectModel | null = null
  private modelPromise: Promise<CocoObjectModel> | null = null
  private previousBall: BallObservation | null = null

  constructor(options: CocoBallDetectorOptions = {}) {
    this.loadModel = options.loadModel ?? loadDefaultModel
  }

  async init(): Promise<void> {
    if (this.model) return
    if (!this.modelPromise) {
      this.modelPromise = this.loadModel()
    }
    try {
      this.model = await this.modelPromise
    } catch (error) {
      this.modelPromise = null
      this.model = null
      throw error
    }
  }

  isReady(): boolean {
    return this.model !== null
  }

  async detect(
    input: CocoDetectorInput,
    timestampMs = typeof performance !== 'undefined' ? performance.now() : Date.now(),
  ): Promise<BallObservation | null> {
    const frame = inputSize(input)
    if (frame.width <= 0 || frame.height <= 0) return null
    await this.init()
    const predictions = await this.model!.detect(input, 20, 0.2)
    const detections: ObjectDetection[] = predictions.map((prediction) => ({
      label: prediction.class,
      confidence: prediction.score,
      box: {
        x: prediction.bbox[0],
        y: prediction.bbox[1],
        width: prediction.bbox[2],
        height: prediction.bbox[3],
      },
    }))
    const selected = selectBallObservation(detections, frame, this.previousBall, timestampMs)
    this.previousBall = selected
    return selected
  }

  reset(): void {
    this.previousBall = null
  }

  dispose(): void {
    this.model?.dispose?.()
    this.model = null
    this.modelPromise = null
    this.previousBall = null
  }
}

export const cocoBallDetector = new CocoBallDetector()
