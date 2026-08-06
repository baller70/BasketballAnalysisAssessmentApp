"use client"

/**
 * The shot-clip transport — one real timeline shared by every screen that
 * scrubs an analysed shot (083 overview, the analysis tab, 084 biomechanics).
 *
 * Round 7 rebuilt the transport bar out of real elements so a width trim would
 * stop clipping canonical's baked-in play and fullscreen glyphs. The geometry
 * that work established is preserved exactly; what was missing was the
 * behaviour behind it — the Play and Fullscreen buttons carried no handler at
 * all, the scrub head was a hard-coded `left: 52%`, and the frame a filmstrip
 * cell selected was read by nothing (R10 defects H3 and H4).
 *
 * This module owns the clock:
 *   - `useShotClip` runs a real rAF timeline, so elapsed time, the scrub head,
 *     the selected filmstrip cell and the active shot phase are all one value.
 *   - `useFullscreen` puts the media surface into the browser's Fullscreen API
 *     and tracks the resulting state.
 *   - `ClipFrame` paints the frame the playhead is on: the full-resolution
 *     canonical still for the release frame, and the film's own cell for the
 *     others (the only per-frame imagery the package ships — it is a low-res
 *     proxy, so it is drawn the way a proxy is drawn, over a blurred fill).
 *
 * The demo analysis is a 12-second clip whose shot occupies 0:00–0:10 (the
 * phase strip every screen draws), scrubbed to the release frame at 0:07 —
 * which is where canonical parks the head and what canonical's readout says.
 */

import React from "react"

/** The canonical demo clip. */
export const CLIP = { duration: 12, start: 7 }

/** The phase windows the phase strips print, in clip seconds. */
export const PHASE_WINDOWS: [string, number, number][] = [
  ["SETUP", 0, 2], ["LOAD", 2, 4], ["RISE", 4, 6], ["RELEASE", 6, 7], ["FOLLOW-THROUGH", 7, 10],
]

/** `0:07` — the readout every transport prints. */
export const clock = (t: number) =>
  `${Math.floor(t / 60)}:${String(Math.floor(Math.max(0, t) % 60)).padStart(2, "0")}`

/** The phase the playhead is inside (the last window that has not ended). */
export const phaseAt = (t: number) =>
  (PHASE_WINDOWS.find(([, , end]) => t <= end) ?? PHASE_WINDOWS[PHASE_WINDOWS.length - 1])[0]

export interface ShotClip {
  /** Elapsed clip time, seconds. */
  time: number
  playing: boolean
  /** 0–1 position, what the scrub head and the progress fill are drawn from. */
  pct: number
  /** Index of the filmstrip cell the playhead is on. */
  frame: number
  frames: number
  duration: number
  toggle: () => void
  play: () => void
  pause: () => void
  /** Seek to a time in seconds. */
  seek: (t: number) => void
  /** Seek to the middle of a filmstrip cell. */
  seekFrame: (i: number) => void
  /** Step one cell either way (the chevrons beside a filmstrip). */
  step: (delta: number) => void
  /** `0:07 / 0:12` */
  readout: string
}

export function useShotClip({
  frames, duration = CLIP.duration, start = CLIP.start,
}: { frames: number; duration?: number; start?: number }): ShotClip {
  const [time, setTime] = React.useState(start)
  const [playing, setPlaying] = React.useState(false)
  const raf = React.useRef(0)
  const last = React.useRef(0)

  /* `start` is read once, at mount — which was fine while it was a constant.
     A real clip's release time arrives from storage in a POST-MOUNT effect, so
     by the time the caller knows where to park the head this state has already
     been initialised to the canonical 7 and would never move. Re-seek when the
     caller's start actually changes, and only while the player has not taken
     over: seeking under someone who is watching their own clip would yank the
     head out from under them. */
  const startedAt = React.useRef(start)
  React.useEffect(() => {
    if (start === startedAt.current) return
    startedAt.current = start
    if (!playing) setTime(start)
    // `playing` is deliberately not a dependency: this fires when the caller
    // moves `start`, not when playback toggles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start])

  React.useEffect(() => {
    if (!playing) return
    last.current = performance.now()
    const tick = (now: number) => {
      const dt = (now - last.current) / 1000
      last.current = now
      setTime((t) => {
        const next = t + dt
        if (next >= duration) { setPlaying(false); return duration }
        return next
      })
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [playing, duration])

  const clamp = React.useCallback((t: number) => Math.max(0, Math.min(duration, t)), [duration])
  const frame = Math.min(frames - 1, Math.max(0, Math.floor((time / duration) * frames)))

  return {
    time, playing, duration, frames, frame,
    pct: duration ? time / duration : 0,
    // Restarting from the end is what a transport does at the end of a clip.
    toggle: () => setPlaying((p) => {
      if (!p && time >= duration - 0.01) setTime(0)
      return !p
    }),
    play: () => setPlaying(true),
    pause: () => setPlaying(false),
    seek: (t: number) => setTime(clamp(t)),
    seekFrame: (i: number) => setTime(clamp(((i + 0.5) / frames) * duration)),
    step: (d: number) => setTime(clamp((((frame + d + frames) % frames) + 0.5) / frames * duration)),
    readout: `${clock(time)} / ${clock(duration)}`,
  }
}

/** Fullscreen for a media surface, with the browser's own state as the truth. */
export function useFullscreen<T extends HTMLElement>(ref: React.RefObject<T | null>) {
  const [isFull, setIsFull] = React.useState(false)
  React.useEffect(() => {
    const onChange = () => setIsFull(document.fullscreenElement === ref.current)
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [ref])
  const toggle = React.useCallback(async () => {
    const el = ref.current
    if (!el) return
    try {
      if (document.fullscreenElement === el) await document.exitFullscreen()
      else await el.requestFullscreen()
    } catch {
      // Fullscreen can be refused (permissions policy, headless). Reflect what
      // actually happened rather than pretending.
      setIsFull(document.fullscreenElement === el)
    }
  }, [ref])
  return { isFull, toggle }
}

/**
 * The frame under the playhead.
 *
 * `still` is the full-resolution canonical frame and `stillFrame` says which
 * cell of the film it is; every other cell is drawn from the filmstrip sprite
 * itself — the only per-frame imagery in the package — over a blurred fill of
 * the same cell, the way an editor draws a low-resolution proxy.
 */
export function ClipFrame({
  still, stillAlt, stillFrame, strip, frames, frame, className = "", stripInset = 0,
}: {
  still: string
  stillAlt: string
  stillFrame: number
  strip: string
  frames: number
  frame: number
  className?: string
  /** Fraction of the strip asset that is padding at each end (084 has 2%). */
  stripInset?: number
}) {
  if (frame === stillFrame) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={still} alt={stillAlt} className={className} />
    )
  }
  const span = 1 - stripInset * 2
  const cellW = span / frames
  const posX = frames > 1 ? ((stripInset + cellW * frame) / (1 - cellW)) * 100 : 0
  const sprite: React.CSSProperties = {
    backgroundImage: `url(${strip})`,
    backgroundSize: `${(1 / cellW) * 100}% 100%`,
    backgroundPosition: `${posX}% 50%`,
    backgroundRepeat: "no-repeat",
  }
  return (
    <div className={`relative overflow-hidden bg-[#1B1D20] ${className}`} data-testid="clip-proxy-frame">
      <div aria-hidden="true" className="absolute inset-0 scale-110 blur-[14px] opacity-70" style={sprite} />
      <div className="absolute inset-0 bg-contain bg-center bg-no-repeat" style={sprite}
           role="img" aria-label={`Frame ${frame + 1} of ${frames}`} />
    </div>
  )
}
