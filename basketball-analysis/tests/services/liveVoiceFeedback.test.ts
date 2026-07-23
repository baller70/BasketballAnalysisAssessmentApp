import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  disableLiveVoiceFeedback,
  enableLiveVoiceFeedback,
  playLiveFeedbackTone,
  speakLiveFeedback,
} from '@/services/liveVoiceFeedback'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('liveVoiceFeedback', () => {
  it('speaks an interrupting coaching message', () => {
    const cancel = vi.fn()
    const speak = vi.fn()
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: { cancel, speak },
    })
    class Utterance {
      rate = 0
      pitch = 0
      volume = 0
      constructor(public text: string) {}
    }
    vi.stubGlobal('SpeechSynthesisUtterance', Utterance)

    expect(speakLiveFeedback('Shot detected. Score 82.', true)).toBe(true)
    expect(cancel).toHaveBeenCalledOnce()
    expect(speak).toHaveBeenCalledWith(expect.objectContaining({
      text: 'Shot detected. Score 82.',
      rate: 1,
      pitch: 1,
      volume: 1,
    }))
  })

  it('unlocks suspended audio and plays a tone', async () => {
    const resume = vi.fn(async () => undefined)
    const oscillator = {
      connect: vi.fn(),
      frequency: { value: 0 },
      type: '',
      start: vi.fn(),
      stop: vi.fn(),
    }
    const gain = {
      connect: vi.fn(),
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    }
    class AudioContextMock {
      state = 'suspended'
      currentTime = 10
      destination = {}
      resume = resume
      createOscillator = () => oscillator
      createGain = () => gain
    }
    vi.stubGlobal('AudioContext', AudioContextMock)
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: AudioContextMock })

    expect(await playLiveFeedbackTone(880, 0.3)).toBe(true)
    expect(resume).toHaveBeenCalledOnce()
    expect(oscillator.frequency.value).toBe(880)
    expect(oscillator.start).toHaveBeenCalledWith(10)
    expect(oscillator.stop).toHaveBeenCalledWith(10.3)
  })

  it('announces enable and cancels queued speech when disabled', () => {
    const cancel = vi.fn()
    const speak = vi.fn()
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: { cancel, speak },
    })
    class Utterance {
      rate = 0
      pitch = 0
      volume = 0
      constructor(public text: string) {}
    }
    vi.stubGlobal('SpeechSynthesisUtterance', Utterance)

    enableLiveVoiceFeedback()
    expect(speak).toHaveBeenCalledWith(expect.objectContaining({ text: 'Voice feedback on' }))
    disableLiveVoiceFeedback()
    expect(cancel).toHaveBeenCalledTimes(2)
  })
})
