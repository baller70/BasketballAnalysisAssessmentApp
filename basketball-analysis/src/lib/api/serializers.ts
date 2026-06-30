import type { Prisma } from "@prisma/client"

/**
 * Row → client serializers for API routes.
 *
 * These live here (not in a `route.ts`) because Next.js App Router route files
 * may only export request handlers (GET/POST/…) and a few reserved config
 * fields — exporting a helper from a route module fails the build. Shared
 * serializers (used by a collection route and its `[id]` route) belong here.
 */

/** Matches the `Goal` interface in src/lib/goals/goalsContext.tsx. */
export function serializeGoal(g: {
  id: string
  name: string
  description: string | null
  targetValue: number
  currentValue: number
  unit: string
  category: string
  createdAt: Date
  deadline: Date | null
  completedAt: Date | null
  xpReward: number
  landmark: string | null
  coordinates: unknown
}) {
  return {
    id: g.id,
    name: g.name,
    description: g.description ?? "",
    targetValue: g.targetValue,
    currentValue: g.currentValue,
    unit: g.unit,
    category: g.category,
    createdAt: g.createdAt,
    deadline: g.deadline ?? undefined,
    completedAt: g.completedAt ?? undefined,
    xpReward: g.xpReward,
    landmark: g.landmark ?? undefined,
    coordinates: (g.coordinates as [number, number] | null) ?? undefined,
  }
}

/**
 * Workout row → client shape. Prisma `Decimal` (accuracy) becomes a plain
 * number; Dates pass through (NextResponse.json renders ISO); Json fields
 * (drillIds/focusAreas) pass through as-is.
 */
export function serializeWorkout(w: {
  id: string
  name: string | null
  scheduledDate: Date
  drillIds: unknown
  focusAreas: unknown
  duration: number | null
  completed: boolean
  completedAt: Date | null
  totalShots: number | null
  totalMade: number | null
  totalMissed: number | null
  accuracy: Prisma.Decimal | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: w.id,
    name: w.name ?? undefined,
    scheduledDate: w.scheduledDate,
    drillIds: w.drillIds,
    focusAreas: w.focusAreas ?? undefined,
    duration: w.duration ?? undefined,
    completed: w.completed,
    completedAt: w.completedAt ?? undefined,
    totalShots: w.totalShots ?? undefined,
    totalMade: w.totalMade ?? undefined,
    totalMissed: w.totalMissed ?? undefined,
    accuracy: w.accuracy == null ? undefined : Number(w.accuracy),
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  }
}
