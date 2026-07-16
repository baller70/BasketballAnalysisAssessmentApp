"use client"

import { csrfFetch } from "@/lib/api/csrfFetch"

export interface ShotEventInput {
  sequence?: number
  timestampMs?: number
  startFrame?: number
  endFrame?: number
  thumbnailUrl?: string
  detected?: boolean
  detectedResult?: "make" | "miss" | "unknown"
  detectedShooter?: string
  detectedPhase?: string
  confidence?: number
  phaseMarkers?: unknown
  metadata?: unknown
}

export interface PersistedShotEvent extends ShotEventInput {
  id: string
  userProfileId?: string
  captureSessionId?: string | null
  createdAt?: string
  updatedAt?: string
  corrections?: unknown[]
}

export interface PersistShotEventsOptions {
  signal?: AbortSignal
  /** Keep review UI responsive when the API or CSRF endpoint is unavailable. */
  timeoutMs?: number
}

/**
 * Persist detector output produced by Results or live capture. A null return
 * means the viewer is signed out or the network is unavailable; callers keep
 * the detector output local and clearly render it as review-only.
 */
export async function persistShotEvents(
  events: ShotEventInput[],
  captureSessionId?: string,
  options: PersistShotEventsOptions = {},
): Promise<PersistedShotEvent[] | null> {
  if (!events.length) return []
  const controller = new AbortController()
  const timeoutMs = Number.isFinite(options.timeoutMs)
    ? Math.max(250, Math.floor(options.timeoutMs as number))
    : 5_000
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  const forwardAbort = () => controller.abort(options.signal?.reason)
  options.signal?.addEventListener('abort', forwardAbort, { once: true })

  try {
    const response = await csrfFetch("/api/shot-events", {
      method: "POST",
      signal: controller.signal,
      body: JSON.stringify({ events, ...(captureSessionId ? { captureSessionId } : {}) }),
    })
    if (!response.ok) return null
    const data = await response.json().catch(() => null)
    return Array.isArray(data?.shotEvents) ? data.shotEvents as PersistedShotEvent[] : null
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
    options.signal?.removeEventListener('abort', forwardAbort)
  }
}
