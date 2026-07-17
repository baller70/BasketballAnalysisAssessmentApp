import { describe, expect, it, vi } from 'vitest'

import { encodePoseInputFrame } from '@/services/capacitorVision'

describe('encodePoseInputFrame', () => {
  it('marks browser-rasterized canvas pixels as upright', async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 640
    canvas.height = 480
    vi.spyOn(canvas, 'toDataURL').mockReturnValue('data:image/jpeg;base64,frame')

    await expect(encodePoseInputFrame(canvas)).resolves.toEqual({
      imageData: 'data:image/jpeg;base64,frame',
      width: 640,
      height: 480,
      orientation: 'up',
    })
  })
})
