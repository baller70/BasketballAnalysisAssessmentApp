import { describe, expect, it, vi } from 'vitest'

import {
  selectCompatibleVisionBackend,
  type TensorflowBackendRuntime,
} from '@/services/vision/tensorflowBackend'

function runtimeOn(backend: string): TensorflowBackendRuntime & {
  ready: ReturnType<typeof vi.fn>
  setBackend: ReturnType<typeof vi.fn>
} {
  let activeBackend = backend
  return {
    ready: vi.fn(async () => undefined),
    getBackend: () => activeBackend,
    setBackend: vi.fn(async (nextBackend: string) => {
      activeBackend = nextBackend
      return true
    }),
  }
}

describe('selectCompatibleVisionBackend', () => {
  it('moves the shared vision runtime off WebGPU before models are loaded', async () => {
    const runtime = runtimeOn('webgpu')

    await expect(selectCompatibleVisionBackend(runtime)).resolves.toBe('webgl')

    expect(runtime.setBackend).toHaveBeenCalledWith('webgl')
    expect(runtime.ready).toHaveBeenCalledTimes(2)
  })

  it('leaves an already compatible backend in place', async () => {
    const runtime = runtimeOn('webgl')

    await expect(selectCompatibleVisionBackend(runtime)).resolves.toBe('webgl')

    expect(runtime.setBackend).not.toHaveBeenCalled()
    expect(runtime.ready).toHaveBeenCalledTimes(1)
  })
})
