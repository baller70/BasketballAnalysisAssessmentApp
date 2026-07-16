"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Circle, Flag, UserRound, X } from "lucide-react"
import { csrfFetch } from "@/lib/api/csrfFetch"

export type ShotCorrectionKind = "false_shot" | "make_miss" | "shooter" | "phase"

export interface ShotReviewCorrection {
  id?: string
  kind: ShotCorrectionKind
  value: unknown
  timestampMs?: number
  frameIndex?: number
  createdAt?: string | Date
}

export interface ShotReviewEvent {
  id: string
  timestampMs?: number
  /** Accept seconds as well for results produced by the video analyzer. */
  timestamp?: number
  frameIndex?: number
  label?: string
  phase?: string
  confidence?: number
  /** Server marks detector rows below its confidence threshold as untrusted. */
  trusted?: boolean
  detected?: boolean
  detectedResult?: "make" | "miss" | "unknown" | string | null
  detectedShooter?: string | null
  thumbnailUrl?: string | null
  corrections?: ShotReviewCorrection[]
}

export interface ShotReviewTimelineProps {
  events?: ShotReviewEvent[]
  /** Alias used by API callers that pass their persisted event collection. */
  shotEvents?: ShotReviewEvent[]
  onSelect?: (event: ShotReviewEvent) => void
  onCorrection?: (correction: ShotReviewCorrection, event: ShotReviewEvent) => void
  /** Set false for demo/offline review. Persisted review uses the correction API. */
  persist?: boolean
  className?: string
}

const PHASES = ["gather", "rise", "set", "release", "follow-through"]
export const TRUSTED_CONFIDENCE_THRESHOLD = 0.6

function eventTime(event: ShotReviewEvent): number {
  if (typeof event.timestampMs === "number") return event.timestampMs
  if (typeof event.timestamp === "number") return Math.round(event.timestamp * 1000)
  return 0
}

function formatTime(milliseconds: number) {
  const seconds = Math.max(0, milliseconds) / 1000
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.floor(seconds % 60)
  return `${minutes}:${String(remainder).padStart(2, "0")}`
}

/**
 * Human-in-the-loop review for detector output. Detector events remain read
 * only; every choice appends an immutable correction through the API.
 */
export function ShotReviewTimeline({
  events,
  shotEvents,
  onSelect,
  onCorrection,
  persist = true,
  className = "",
}: ShotReviewTimelineProps) {
  const reviewEvents = useMemo(() => events ?? shotEvents ?? [], [events, shotEvents])
  const [selectedId, setSelectedId] = useState<string | null>(reviewEvents[0]?.id ?? null)
  const [localCorrections, setLocalCorrections] = useState<Record<string, ShotReviewCorrection[]>>({})
  const [persistedCorrections, setPersistedCorrections] = useState<Record<string, ShotReviewCorrection[]>>({})
  const [shooterLabels, setShooterLabels] = useState<Record<string, string>>({})
  const [phaseLabels, setPhaseLabels] = useState<Record<string, string>>({})
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Persisted detector rows are immutable, but their corrections are loaded
  // on every Results mount so a review made on another device is visible here.
  useEffect(() => {
    if (!persist || reviewEvents.length === 0) {
      setPersistedCorrections({})
      return
    }
    let cancelled = false
    const hydrate = async () => {
      const entries = await Promise.all(reviewEvents.map(async (event) => {
        try {
          const response = await csrfFetch(`/api/shot-events/${encodeURIComponent(event.id)}/corrections`, {
            method: "GET",
          })
          if (!response.ok) return [event.id, []] as const
          const body = await response.json().catch(() => null)
          const corrections = Array.isArray(body?.corrections) ? body.corrections as ShotReviewCorrection[] : []
          return [event.id, corrections] as const
        } catch {
          return [event.id, []] as const
        }
      }))
      if (!cancelled) {
        setPersistedCorrections(Object.fromEntries(entries))
      }
    }
    void hydrate()
    return () => {
      cancelled = true
    }
  }, [persist, reviewEvents])

  const correctionsFor = useMemo(() => {
    const result: Record<string, ShotReviewCorrection[]> = {}
    for (const event of reviewEvents) {
      result[event.id] = [
        ...(event.corrections ?? []),
        ...(persistedCorrections[event.id] ?? []),
        ...(localCorrections[event.id] ?? []),
      ].filter((correction, index, all) => !correction.id || all.findIndex((candidate) => candidate.id === correction.id) === index)
    }
    return result
  }, [localCorrections, persistedCorrections, reviewEvents])

  const chooseEvent = (event: ShotReviewEvent) => {
    setSelectedId(event.id)
    onSelect?.(event)
  }

  const submitCorrection = async (
    event: ShotReviewEvent,
    kind: ShotCorrectionKind,
    value: unknown,
  ) => {
    const correction: ShotReviewCorrection = {
      id: `local-${event.id}-${Date.now()}`,
      kind,
      value,
      timestampMs: eventTime(event),
      frameIndex: event.frameIndex,
    }
    setLocalCorrections((current) => ({
      ...current,
      [event.id]: [...(current[event.id] ?? []), correction],
    }))
    onCorrection?.(correction, event)
    setError(null)

    if (!persist) return
    const requestKey = `${event.id}:${kind}`
    setPending(requestKey)
    try {
      const response = await csrfFetch(`/api/shot-events/${encodeURIComponent(event.id)}/corrections`, {
        method: "POST",
        body: JSON.stringify({
          kind,
          // `type` keeps the payload compatible with earlier review clients.
          type: kind,
          value,
          timestampMs: eventTime(event),
          frameIndex: event.frameIndex,
        }),
      })
      if (!response.ok) throw new Error("Unable to save review correction")
    } catch {
      setError("Correction saved on this device but could not sync yet.")
    } finally {
      setPending(null)
    }
  }

  return (
    <section
      aria-label="Shot review timeline"
      className={`rounded-lg border-2 border-black bg-white p-4 ${className}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-[#FF6B35]">Review shots</h2>
          <p className="mt-1 text-xs text-slate-500">Correct false detections, results, shooter, and phase markers.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-500">
          {reviewEvents.length} {reviewEvents.length === 1 ? "shot" : "shots"}
        </span>
      </div>

      {reviewEvents.length === 0 ? (
        <p className="rounded border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-500">
          No detected shots to review yet.
        </p>
      ) : (
        <ol className="space-y-3" data-testid="shot-review-events">
          {reviewEvents.map((event, index) => {
            const selected = selectedId === event.id
            const shooter = shooterLabels[event.id] ?? ""
            const phase = phaseLabels[event.id] ?? event.phase ?? ""
            const result = event.detectedResult
            const trusted = event.trusted ?? (
              typeof event.confidence === "number"
              && event.confidence >= TRUSTED_CONFIDENCE_THRESHOLD
              && event.detected !== false
            )
            return (
              <li key={event.id} className="relative">
                <div className="flex gap-3">
                  <button
                    type="button"
                    aria-label={`Select shot ${index + 1} at ${formatTime(eventTime(event))}`}
                    onClick={() => chooseEvent(event)}
                    className="relative z-10 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[#FF6B35] bg-white text-[#FF6B35]"
                  >
                    {selected ? <Circle className="h-3 w-3 fill-current" /> : <span className="text-[10px] font-black">{index + 1}</span>}
                  </button>
                  {index < reviewEvents.length - 1 && <span aria-hidden className="absolute left-3.5 top-8 h-[calc(100%+0.5rem)] w-px bg-slate-200" />}
                  <div className={`min-w-0 flex-1 rounded-lg border p-3 transition-colors ${selected ? "border-[#FF6B35] bg-orange-50/40" : "border-slate-200 bg-white"}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button type="button" onClick={() => chooseEvent(event)} className="text-left text-sm font-bold text-slate-900">
                        {event.label ?? `Shot ${index + 1}`}
                      </button>
                      <span className="font-mono text-xs text-slate-500">{formatTime(eventTime(event))}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-[10px] uppercase tracking-wide text-slate-500">
                      {event.phase && <span>{event.phase}</span>}
                      {trusted && typeof event.confidence === "number" && <span>{Math.round(event.confidence * 100)}% confidence</span>}
                      {trusted && result && <span>{result}</span>}
                      {!trusted && <span className="font-bold text-amber-700">review only · untrusted detection</span>}
                      {event.detected === false && <span>not detected</span>}
                    </div>

                    {selected && (
                      <div className="mt-3 space-y-3 border-t border-slate-200 pt-3">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" disabled={pending === `${event.id}:false_shot`} onClick={() => submitCorrection(event, "false_shot", true)} className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 hover:border-[#FF6B35]" aria-label={`Mark shot ${index + 1} as false shot`}>
                            <X className="h-3.5 w-3.5 text-red-500" /> False shot
                          </button>
                          <button type="button" disabled={pending === `${event.id}:make_miss`} onClick={() => submitCorrection(event, "make_miss", "make")} className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 hover:border-[#FF6B35]" aria-label={`Mark shot ${index + 1} as make`}>
                            <Check className="h-3.5 w-3.5 text-green-600" /> Make
                          </button>
                          <button type="button" disabled={pending === `${event.id}:make_miss`} onClick={() => submitCorrection(event, "make_miss", "miss")} className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 hover:border-[#FF6B35]" aria-label={`Mark shot ${index + 1} as miss`}>
                            <X className="h-3.5 w-3.5 text-red-500" /> Miss
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <UserRound className="h-4 w-4 text-slate-400" aria-hidden />
                          <input value={shooter} onChange={(e) => setShooterLabels((current) => ({ ...current, [event.id]: e.target.value }))} placeholder="Shooter name" aria-label={`Shooter for shot ${index + 1}`} className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-[#FF6B35]" />
                          <button type="button" disabled={!shooter.trim()} onClick={() => submitCorrection(event, "shooter", shooter.trim())} className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40" aria-label={`Save shooter for shot ${index + 1}`}>Save shooter</button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Flag className="h-4 w-4 text-slate-400" aria-hidden />
                          <select value={phase} onChange={(e) => setPhaseLabels((current) => ({ ...current, [event.id]: e.target.value }))} aria-label={`Phase for shot ${index + 1}`} className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-[#FF6B35]">
                            <option value="">Choose phase</option>
                            {PHASES.map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                          <button type="button" disabled={!phase} onClick={() => submitCorrection(event, "phase", phase)} className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40" aria-label={`Save phase for shot ${index + 1}`}>Mark phase</button>
                        </div>

                        {correctionsFor[event.id]?.length > 0 && <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{correctionsFor[event.id].length} correction{correctionsFor[event.id].length === 1 ? "" : "s"} recorded</p>}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      )}
      {error && <p role="status" className="mt-3 text-xs text-amber-700">{error}</p>}
    </section>
  )
}

export default ShotReviewTimeline
