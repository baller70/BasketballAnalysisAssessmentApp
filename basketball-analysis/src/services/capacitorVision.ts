import { registerPlugin } from '@capacitor/core'

import type { PoseInput, ProviderKeypoint } from '@/services/pose/types'

export interface NativeVisionAvailability {
  available: boolean
  engine: 'apple-vision'
}

export interface NativeVisionDetectOptions {
  imageData: string
  width: number
  height: number
  timestampMs?: number
}

export interface NativeVisionDetectResult {
  keypoints: ProviderKeypoint[]
  score: number | null
  engine: 'apple-vision'
}

export interface NativeVisionPlugin {
  isAvailable(): Promise<NativeVisionAvailability>
  detectPose(options: NativeVisionDetectOptions): Promise<NativeVisionDetectResult>
}

export interface EncodedVisionFrame {
  imageData: string
  width: number
  height: number
}

export const ShotIQVision = registerPlugin<NativeVisionPlugin>('ShotIQVision')

/**
 * Encode the exact pixels used by ShotIQ's live overlay for Apple Vision.
 * Canvas is the normal live path; image/video support keeps the provider
 * contract useful for native uploaded-media analysis as well.
 */
export async function encodePoseInputFrame(input: PoseInput): Promise<EncodedVisionFrame> {
  if (input instanceof HTMLCanvasElement) {
    if (input.width <= 0 || input.height <= 0) {
      throw new Error('ShotIQ Vision received an empty canvas frame')
    }
    return {
      imageData: input.toDataURL('image/jpeg', 0.82),
      width: input.width,
      height: input.height,
    }
  }

  const width = input instanceof HTMLVideoElement ? input.videoWidth : input.naturalWidth
  const height = input instanceof HTMLVideoElement ? input.videoHeight : input.naturalHeight
  if (width <= 0 || height <= 0) {
    throw new Error('ShotIQ Vision received media before its pixels were ready')
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('ShotIQ Vision could not prepare the native frame')
  context.drawImage(input, 0, 0, width, height)

  return {
    imageData: canvas.toDataURL('image/jpeg', 0.82),
    width,
    height,
  }
}
