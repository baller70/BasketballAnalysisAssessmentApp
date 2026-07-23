/** Browser/iOS-webview voice and tone feedback for Live mode. */

let sharedAudioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AudioContextClass = window.AudioContext
    ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextClass) return null
  sharedAudioContext ??= new AudioContextClass()
  return sharedAudioContext
}

export async function playLiveFeedbackTone(frequency: number, duration = 0.2): Promise<boolean> {
  const context = getAudioContext()
  if (!context) return false
  try {
    if (context.state === 'suspended') await context.resume()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.frequency.value = frequency
    oscillator.type = 'sine'
    gain.gain.setValueAtTime(0.2, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + duration)
    oscillator.start(context.currentTime)
    oscillator.stop(context.currentTime + duration)
    return true
  } catch {
    return false
  }
}

export function speakLiveFeedback(message: string, interrupt = false): boolean {
  if (
    typeof window === 'undefined'
    || !('speechSynthesis' in window)
    || typeof SpeechSynthesisUtterance === 'undefined'
  ) return false

  try {
    if (interrupt) window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(message)
    utterance.rate = 1
    utterance.pitch = 1
    utterance.volume = 1
    window.speechSynthesis.speak(utterance)
    return true
  } catch {
    return false
  }
}

/** Must be called from the toggle's user gesture to unlock iOS audio. */
export function enableLiveVoiceFeedback(): void {
  void playLiveFeedbackTone(660, 0.12)
  speakLiveFeedback('Voice feedback on', true)
}

export function disableLiveVoiceFeedback(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}
