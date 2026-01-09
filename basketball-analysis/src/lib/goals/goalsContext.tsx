"use client"

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'

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
  | { type: 'UPDATE_GOAL'; payload: { id: string; updates: Partial<Goal> } }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'COMPLETE_GOAL'; payload: string }
  | { type: 'INCREMENT_GOAL_PROGRESS'; payload: { id: string; amount: number } }

// ============================================
// STORAGE KEY
// ============================================

const GOALS_STORAGE_KEY = 'shotiq_goals'

// ============================================
// DEFAULT GOALS (Initial goals for new users)
// ============================================

const getDefaultGoals = (): Goal[] => [
  {
    id: 'goal_1',
    name: 'FORM CHECK',
    description: 'Complete your first form analysis',
    targetValue: 1,
    currentValue: 0,
    unit: 'analysis',
    category: 'form',
    createdAt: new Date(),
    xpReward: 50,
    landmark: 'Exchange Place',
    coordinates: [-74.0328, 40.7162],
  },
  {
    id: 'goal_2',
    name: '50 SHOTS',
    description: 'Analyze 50 practice shots',
    targetValue: 50,
    currentValue: 0,
    unit: 'shots',
    category: 'volume',
    createdAt: new Date(),
    xpReward: 100,
    landmark: 'Hoboken Waterfront',
    coordinates: [-74.0280, 40.7370],
  },
  {
    id: 'goal_3',
    name: '90° ELBOW',
    description: 'Achieve perfect elbow angle score',
    targetValue: 90,
    currentValue: 0,
    unit: 'score',
    category: 'form',
    createdAt: new Date(),
    xpReward: 150,
    landmark: 'Recreation Center',
    coordinates: [-74.0630, 40.7580],
  },
  {
    id: 'goal_4',
    name: '100 MAKES',
    description: 'Complete 100 successful shots',
    targetValue: 100,
    currentValue: 0,
    unit: 'makes',
    category: 'accuracy',
    createdAt: new Date(),
    xpReward: 200,
    landmark: 'North Bergen High School',
    coordinates: [-74.0200, 40.7850],
  },
  {
    id: 'goal_5',
    name: 'STREAK MASTER',
    description: 'Maintain a 7-day practice streak',
    targetValue: 7,
    currentValue: 0,
    unit: 'days',
    category: 'streak',
    createdAt: new Date(),
    xpReward: 300,
    landmark: 'Overpeck County Park',
    coordinates: [-74.0450, 40.8150],
  },
  {
    id: 'goal_6',
    name: 'FORM PERFECT',
    description: 'Achieve 95%+ overall form score',
    targetValue: 95,
    currentValue: 0,
    unit: 'score',
    category: 'form',
    createdAt: new Date(),
    xpReward: 400,
    landmark: 'Meadowlands Sports Complex',
    coordinates: [-74.0740, 40.8120],
  },
  {
    id: 'goal_7',
    name: 'ELITE BADGE',
    description: 'Earn the Elite Shooter badge',
    targetValue: 1,
    currentValue: 0,
    unit: 'badge',
    category: 'custom',
    createdAt: new Date(),
    xpReward: 500,
    landmark: 'MetLife Stadium',
    coordinates: [-74.0744, 40.8135],
  },
]

// ============================================
// INITIAL STATE
// ============================================

const getInitialState = (): GoalsState => {
  if (typeof window === 'undefined') {
    return {
      goals: [],
      lastUpdated: null,
    }
  }

  try {
    const stored = localStorage.getItem(GOALS_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        goals: parsed.goals.map((g: Goal) => ({
          ...g,
          createdAt: new Date(g.createdAt),
          deadline: g.deadline ? new Date(g.deadline) : undefined,
          completedAt: g.completedAt ? new Date(g.completedAt) : undefined,
        })),
        lastUpdated: parsed.lastUpdated ? new Date(parsed.lastUpdated) : null,
      }
    }
  } catch (error) {
    console.error('Error loading goals from localStorage:', error)
  }

  // Return default goals for new users
  return {
    goals: getDefaultGoals(),
    lastUpdated: new Date(),
  }
}

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

  // Persist to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && state.goals.length > 0) {
      localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(state))
    }
  }, [state])

  // Computed values
  const completedGoals = state.goals.filter((g) => g.completedAt)
  const activeGoals = state.goals.filter((g) => !g.completedAt)
  const totalGoals = state.goals.length
  const completedCount = completedGoals.length

  // Actions
  const addGoal = useCallback((goalData: Omit<Goal, 'id' | 'createdAt'>): Goal => {
    const newGoal: Goal = {
      ...goalData,
      id: `goal_${Date.now()}`,
      createdAt: new Date(),
    }
    dispatch({ type: 'ADD_GOAL', payload: newGoal })
    return newGoal
  }, [])

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    dispatch({ type: 'UPDATE_GOAL', payload: { id, updates } })
  }, [])

  const deleteGoal = useCallback((id: string) => {
    dispatch({ type: 'DELETE_GOAL', payload: id })
  }, [])

  const completeGoal = useCallback((id: string) => {
    dispatch({ type: 'COMPLETE_GOAL', payload: id })
  }, [])

  const incrementProgress = useCallback((id: string, amount: number) => {
    dispatch({ type: 'INCREMENT_GOAL_PROGRESS', payload: { id, amount } })
  }, [])

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
