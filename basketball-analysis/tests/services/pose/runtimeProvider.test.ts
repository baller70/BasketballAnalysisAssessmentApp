import { describe, expect, it } from 'vitest'

import { selectRuntimePoseProviderId } from '@/services/pose/runtime'

describe('selectRuntimePoseProviderId', () => {
  it('selects Apple Vision only for the native iPhone shell', () => {
    expect(selectRuntimePoseProviderId('ios')).toBe('native-ios')
  })

  it('keeps Safari and desktop browsers on MoveNet', () => {
    expect(selectRuntimePoseProviderId('web')).toBe('movenet')
    expect(selectRuntimePoseProviderId('desktop')).toBe('movenet')
    expect(selectRuntimePoseProviderId('android')).toBe('movenet')
  })
})
