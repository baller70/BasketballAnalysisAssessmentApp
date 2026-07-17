import * as tf from '@tensorflow/tfjs'

export interface TensorflowBackendRuntime {
  ready(): Promise<void>
  getBackend(): string | undefined
  setBackend(backendName: string): Promise<boolean>
}

/**
 * COCO-SSD 2.2.3 performs synchronous non-max suppression on WebGPU, which
 * stalls the browser UI thread on every object-tracking frame. MoveNet and
 * COCO-SSD both support WebGL, and COCO-SSD explicitly moves suppression to
 * CPU when its active backend is WebGL.
 */
export async function selectCompatibleVisionBackend(
  runtime: TensorflowBackendRuntime = tf,
): Promise<string | undefined> {
  await runtime.ready()

  if (runtime.getBackend() === 'webgpu') {
    const switched = await runtime.setBackend('webgl')
    if (switched) await runtime.ready()
  }

  return runtime.getBackend()
}

let preparation: Promise<string | undefined> | null = null

/** Select the shared TensorFlow backend once before either vision model loads. */
export function prepareVisionTensorflowBackend(): Promise<string | undefined> {
  if (!preparation) {
    preparation = selectCompatibleVisionBackend().catch((error) => {
      preparation = null
      throw error
    })
  }
  return preparation
}
