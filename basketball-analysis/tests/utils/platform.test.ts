import { afterEach, describe, expect, it } from 'vitest'
import { getPlatform, getPlatformOS } from '@/utils/platform'

const originalUserAgent = navigator.userAgent

describe('web platform detection', () => {
  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: originalUserAgent,
    })
  })

  it('identifies iPhone Safari as iOS web rather than native mobile', () => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Version/18.5 Mobile/15E148 Safari/604.1',
    })

    expect(getPlatform()).toBe('web')
    expect(getPlatformOS()).toBe('ios')
  })
})
