"use client"

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { csrfFetch } from '@/lib/api/csrfFetch'

// ============================================
// TYPES & INTERFACES
// ============================================

export interface Goal {
  id: string
  name: string
  description: string
  targetValue: number
  currentValue: number
  unit: string
  category: 'form' | 'consistency' | 'volume' | 'accuracy' | 'streak' | 'custom'
  createdAt: Date
  deadline?: Date
  completedAt?: Date
  xpReward: number
  landmark?: string // For map display
  coordinates?: [number, number] // [lng, lat] for map display
}

export interface GoalsState {
  goals: Goal[]
  lastUpdated: Date | null
}

// ============================================
// ACTIONS
// ============================================

type GoalsAction =
  | { type: 'SET_GOALS'; payload: Goal[] }
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'REPLACE_GOAL'; payload: { tempId: string; goal: Goal } }
  | { type: 'UPDATE_GOAL'; payload: { id: string; updates: Partial<Goal> } }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'COMPLETE_GOAL'; payload: string }
  | { type: 'INCREMENT_GOAL_PROGRESS'; payload: { id: string; amount: number } }

// ============================================
// API HELPERS
// ============================================

/** Optimistic goals (POST in flight) get a temp id until the server replies. */
const isTempId = (id: string) => id.startsWith('temp_')

/** Map a serialized API goal (ISO date strings) back to the client `Goal`. */
function deserializeGoal(raw: Record<string, unknown>): Goal {
  return {
    id: String(raw.id),
    name: String(raw.name ?? ''),
    description: String(raw.description ?? ''),
    targetValue: Number(raw.targetValue ?? 0),
    currentValue: Number(raw.currentValue ?? 0),
    unit: String(raw.unit ?? ''),
    category: (raw.category as Goal['category']) || 'custom',
    createdAt: raw.createdAt ? new Date(raw.createdAt as string) : new Date(),
    deadline: raw.deadline ? new Date(raw.deadline as string) : undefined,
    completedAt: raw.completedAt ? new Date(raw.completedAt as string) : undefined,
    xpReward: Number(raw.xpReward ?? 0),
    landmark: raw.landmark ? String(raw.landmark) : undefined,
    coordinates: Array.isArray(raw.coordinates)
      ? (raw.coordinates as [number, number])
      : undefined,
  }
}

// ============================================
// INITIAL STATE
// ============================================
//
// Postgres is the source of truth — goals load from `/api/goals` on mount.
// New users start with a real empty state (no hardcoded seed goals).

const getInitialState = (): GoalsState => ({
  goals: [],
  lastUpdated: null,
})

// ============================================
// REDUCER
// ============================================

function goalsReducer(state: GoalsState, action: GoalsAction): GoalsState {
  switch (action.type) {
    case 'SET_GOALS':
      return {
        ...state,
        goals: action.payload,
        lastUpdated: new Date(),
      }

    case 'ADD_GOAL':
      return {
        ...state,
        goals: [...state.goals, action.payload],
        lastUpdated: new Date(),
      }

    case 'REPLACE_GOAL':
      return {
        ...state,
        goals: state.goals.map((goal) =>
          goal.id === action.payload.tempId ? action.payload.goal : goal
        ),
        lastUpdated: new Date(),
      }

    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map((goal) =>
          goal.id === action.payload.id
            ? { ...goal, ...action.payload.updates }
            : goal
        ),
        lastUpdated: new Date(),
      }

    case 'DELETE_GOAL':
      return {
        ...state,
        goals: state.goals.filter((goal) => goal.id !== action.payload),
        lastUpdated: new Date(),
      }

    case 'COMPLETE_GOAL':
      return {
        ...state,
        goals: state.goals.map((goal) =>
          goal.id === action.payload
            ? { ...goal, completedAt: new Date(), currentValue: goal.targetValue }
            : goal
        ),
        lastUpdated: new Date(),
      }

    case 'INCREMENT_GOAL_PROGRESS':
      return {
        ...state,
        goals: state.goals.map((goal) => {
          if (goal.id !== action.payload.id) return goal
          const newValue = Math.min(
            goal.currentValue + action.payload.amount,
            goal.targetValue
          )
          return {
            ...goal,
            currentValue: newValue,
            completedAt: newValue >= goal.targetValue ? new Date() : goal.completedAt,
          }
        }),
        lastUpdated: new Date(),
      }

    default:
      return state
  }
}

// ============================================
// CONTEXT
// ============================================

interface GoalsContextValue {
  goals: Goal[]
  completedGoals: Goal[]
  activeGoals: Goal[]
  totalGoals: number
  completedCount: number
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => Goal
  updateGoal: (id: string, updates: Partial<Goal>) => void
  deleteGoal: (id: string) => void
  completeGoal: (id: string) => void
  incrementProgress: (id: string, amount: number) => void
  getGoalById: (id: string) => Goal | undefined
  getCurrentGoal: () => Goal | undefined
}

const GoalsContext = createContext<GoalsContextValue | null>(null)

// ============================================
// PROVIDER
// ============================================

export function GoalsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(goalsReducer, undefined, getInitialState)

  // Load the signed-in user's goals from Postgres (source of truth) on mount.
  // Unauthenticated visitors simply get an empty list (the API 401s, ignored).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/goals', { credentials: 'include' })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && Array.isArray(data?.goals)) {
          dispatch({ type: 'SET_GOALS', payload: data.goals.map(deserializeGoal) })
        }
      } catch {
        // Offline / network error — keep the empty state.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Refetch from the server to reconcile after a failed optimistic write.
  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/goals', { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data?.goals)) {
        dispatch({ type: 'SET_GOALS', payload: data.goals.map(deserializeGoal) })
      }
    } catch {
      /* ignore */
    }
  }, [])

  // Computed values
  const completedGoals = state.goals.filter((g) => g.completedAt)
  const activeGoals = state.goals.filter((g) => !g.completedAt)
  const totalGoals = state.goals.length
  const completedCount = completedGoals.length

  // Actions — every mutation is persisted to Postgres via the CSRF-guarded API.
  // We update optimistically for snappy UX, then reconcile with the server.
  const addGoal = useCallback((goalData: Omit<Goal, 'id' | 'createdAt'>): Goal => {
    const tempId = `temp_${Date.now()}`
    const optimistic: Goal = { ...goalData, id: tempId, createdAt: new Date() }
    dispatch({ type: 'ADD_GOAL', payload: optimistic })
    ;(async () => {
      try {
        const res = await csrfFetch('/api/goals', {
          method: 'POST',
          body: JSON.stringify({
            name: goalData.name,
            description: goalData.description,
            category: goalData.category,
            targetValue: goalData.targetValue,
            currentValue: goalData.currentValue,
            unit: goalData.unit,
            xpReward: goalData.xpReward,
            deadline: goalData.deadline ?? null,
            landmark: goalData.landmark ?? null,
            coordinates: goalData.coordinates ?? null,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data?.goal) {
            dispatch({
              type: 'REPLACE_GOAL',
              payload: { tempId, goal: deserializeGoal(data.goal) },
            })
            return
          }
        }
        // Persist failed — roll the optimistic goal back out.
        dispatch({ type: 'DELETE_GOAL', payload: tempId })
      } catch {
        dispatch({ type: 'DELETE_GOAL', payload: tempId })
      }
    })()
    return optimistic
  }, [])

  const updateGoal = useCallback(
    (id: string, updates: Partial<Goal>) => {
      dispatch({ type: 'UPDATE_GOAL', payload: { id, updates } })
      if (isTempId(id)) return // POST still in flight; nothing to PATCH yet.
      ;(async () => {
        try {
          const res = await csrfFetch(`/api/goals/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              ...updates,
              deadline: updates.deadline ?? undefined,
              completedAt: updates.completedAt ?? undefined,
            }),
          })
          if (!res.ok) await refresh()
        } catch {
          await refresh()
        }
      })()
    },
    [refresh]
  )

  const deleteGoal = useCallback(
    (id: string) => {
      dispatch({ type: 'DELETE_GOAL', payload: id })
      if (isTempId(id)) return
      ;(async () => {
        try {
          const res = await csrfFetch(`/api/goals/${id}`, { method: 'DELETE' })
          if (!res.ok) await refresh()
        } catch {
          await refresh()
        }
      })()
    },
    [refresh]
  )

  const completeGoal = useCallback(
    (id: string) => {
      const target = state.goals.find((g) => g.id === id)?.targetValue ?? 0
      dispatch({ type: 'COMPLETE_GOAL', payload: id })
      if (isTempId(id)) return
      ;(async () => {
        try {
          const res = await csrfFetch(`/api/goals/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              completedAt: new Date().toISOString(),
              currentValue: target,
            }),
          })
          if (!res.ok) await refresh()
        } catch {
          await refresh()
        }
      })()
    },
    [state.goals, refresh]
  )

  const incrementProgress = useCallback(
    (id: string, amount: number) => {
      const goal = state.goals.find((g) => g.id === id)
      dispatch({ type: 'INCREMENT_GOAL_PROGRESS', payload: { id, amount } })
      if (!goal || isTempId(id)) return
      const newValue = Math.min(goal.currentValue + amount, goal.targetValue)
      const reached = newValue >= goal.targetValue
      ;(async () => {
        try {
          const res = await csrfFetch(`/api/goals/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              currentValue: newValue,
              ...(reached && !goal.completedAt
                ? { completedAt: new Date().toISOString() }
                : {}),
            }),
          })
          if (!res.ok) await refresh()
        } catch {
          await refresh()
        }
      })()
    },
    [state.goals, refresh]
  )

  const getGoalById = useCallback(
    (id: string) => state.goals.find((g) => g.id === id),
    [state.goals]
  )

  // Get the current goal (first incomplete goal)
  const getCurrentGoal = useCallback(() => {
    return state.goals.find((g) => !g.completedAt)
  }, [state.goals])

  const value: GoalsContextValue = {
    goals: state.goals,
    completedGoals,
    activeGoals,
    totalGoals,
    completedCount,
    addGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    incrementProgress,
    getGoalById,
    getCurrentGoal,
  }

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>
}

// ============================================
// HOOK
// ============================================

export function useGoals(): GoalsContextValue {
  const context = useContext(GoalsContext)
  if (!context) {
    throw new Error('useGoals must be used within a GoalsProvider')
  }
  return context
}
