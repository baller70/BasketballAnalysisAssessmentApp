"use client"

/**
 * workoutsClient — client helpers for the workout / saved-workout / training-
 * preference APIs. These are the source of truth (Postgres); localStorage is
 * only an offline cache. All mutating calls go through csrfFetch (double-submit
 * CSRF + credentials), reads use credentials:'include' so the auth cookie rides
 * along. Every function fails soft (returns null / []) so callers can degrade to
 * an empty/offline state instead of throwing.
 */

import { csrfFetch } from "@/lib/api/csrfFetch"
import { ALL_DRILLS, Drill, DrillFocusArea } from "@/data/drillDatabase"

// ---- Server shapes (as serialized by the API routes) -----------------------

export interface ServerWorkout {
  id: string
  name?: string
  scheduledDate: string
  drillIds: unknown
  focusAreas?: unknown
  duration?: number
  completed: boolean
  completedAt?: string
  totalShots?: number
  totalMade?: number
  totalMissed?: number
  accuracy?: number
  createdAt: string
  updatedAt: string
}

export interface ServerSavedWorkout {
  id: string
  name: string
  drillCount: number
  drillIds: unknown
  totalMade: number
  totalMissed: number
  lastPlayed?: string
  createdAt: string
  updatedAt: string
}

export interface ServerPreferences {
  id: string
  frequency: number
  preferredDuration: number
  drillCount: number
  workoutMode: string
  soundEnabled: boolean
  ageLevel: string
  autoPopulateFromFlaws: boolean
  notificationsEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface WorkoutPayload {
  name?: string | null
  scheduledDate: string | Date
  drillIds: string[]
  focusAreas?: string[]
  duration?: number
  completed?: boolean
  completedAt?: string | Date | null
  totalShots?: number
  totalMade?: number
  totalMissed?: number
  accuracy?: number
}

// ---- Drill <-> id mapping ---------------------------------------------------

/** Resolve persisted drillIds back into full Drill objects using a pool. */
export function resolveDrillIds(
  drillIds: unknown,
  pool: Drill[] = ALL_DRILLS
): Drill[] {
  if (!Array.isArray(drillIds)) return []
  const byId = new Map(pool.map((d) => [d.id, d]))
  return drillIds
    .map((id) => (typeof id === "string" ? byId.get(id) : undefined))
    .filter((d): d is Drill => Boolean(d))
}

function asFocusAreas(value: unknown): DrillFocusArea[] {
  return Array.isArray(value)
    ? (value.filter((v) => typeof v === "string") as DrillFocusArea[])
    : []
}

// ---- Workouts ---------------------------------------------------------------

export async function fetchWorkouts(): Promise<ServerWorkout[]> {
  try {
    const res = await fetch("/api/workouts", { credentials: "include" })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data?.workouts) ? data.workouts : []
  } catch {
    return []
  }
}

export async function createWorkout(
  payload: WorkoutPayload
): Promise<ServerWorkout | null> {
  try {
    const res = await csrfFetch("/api/workouts", {
      method: "POST",
      body: JSON.stringify(payload),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.workout ?? null
  } catch {
    return null
  }
}

export async function updateWorkout(
  id: string,
  patch: Partial<WorkoutPayload>
): Promise<ServerWorkout | null> {
  try {
    const res = await csrfFetch(`/api/workouts/${id}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.workout ?? null
  } catch {
    return null
  }
}

export async function deleteWorkout(id: string): Promise<boolean> {
  try {
    const res = await csrfFetch(`/api/workouts/${id}`, { method: "DELETE" })
    return res.ok
  } catch {
    return false
  }
}

// ---- Saved workouts ---------------------------------------------------------

export async function fetchSavedWorkouts(): Promise<ServerSavedWorkout[]> {
  try {
    const res = await fetch("/api/saved-workouts", { credentials: "include" })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data?.savedWorkouts) ? data.savedWorkouts : []
  } catch {
    return []
  }
}

export async function createSavedWorkout(payload: {
  name: string
  drillCount: number
  drillIds: string[]
  totalMade?: number
  totalMissed?: number
  lastPlayed?: string | Date | null
}): Promise<ServerSavedWorkout | null> {
  try {
    const res = await csrfFetch("/api/saved-workouts", {
      method: "POST",
      body: JSON.stringify(payload),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.savedWorkout ?? null
  } catch {
    return null
  }
}

export async function deleteSavedWorkout(id: string): Promise<boolean> {
  try {
    const res = await csrfFetch(`/api/saved-workouts/${id}`, {
      method: "DELETE",
    })
    return res.ok
  } catch {
    return false
  }
}

// ---- Training preferences ---------------------------------------------------

export async function fetchPreferences(): Promise<ServerPreferences | null> {
  try {
    const res = await fetch("/api/training-preferences", {
      credentials: "include",
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.preferences ?? null
  } catch {
    return null
  }
}

export async function savePreferences(payload: {
  frequency: number
  preferredDuration: number
  drillCount: number
  workoutMode: string
  soundEnabled: boolean
  ageLevel: string
  autoPopulateFromFlaws: boolean
  notificationsEnabled: boolean
}): Promise<ServerPreferences | null> {
  try {
    const res = await csrfFetch("/api/training-preferences", {
      method: "PUT",
      body: JSON.stringify(payload),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.preferences ?? null
  } catch {
    return null
  }
}

export { asFocusAreas }
