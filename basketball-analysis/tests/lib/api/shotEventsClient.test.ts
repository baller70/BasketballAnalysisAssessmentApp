import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ csrfFetch: vi.fn() }))

vi.mock('@/lib/api/csrfFetch', () => ({ csrfFetch: mocks.csrfFetch }))

import { persistShotEvents } from '@/lib/api/shotEvents'

describe('persistShotEvents client', () => {
  it('returns local fallback when the request exceeds its timeout', async () => {
    let signal: AbortSignal | undefined
    mocks.csrfFetch.mockImplementation((_url: string, options: RequestInit) => {
      signal = options.signal
      return new Promise<Response>((_resolve, reject) => {
        options.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
      })
    })

    const result = await persistShotEvents(
      [{ sequence: 0, timestampMs: 500 }],
      'capture-1',
      { timeoutMs: 250 },
    )

    expect(result).toBeNull()
    expect(signal?.aborted).toBe(true)
  })
})
