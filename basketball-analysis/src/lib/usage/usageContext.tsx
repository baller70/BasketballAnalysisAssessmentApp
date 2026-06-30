/**
 * Usage Tracking Context
 * 
 * Tracks daily analysis usage against tier limits.
 * Whether live, image upload, or video upload - each counts as 1 analysis.
 */

"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { usePoints } from '@/lib/points/pointsContext'
import { TierLevel } from '@/lib/points/pointsConfig'

// ============================================
// TYPES
// ============================================

interface UsageState {
  dailyAnalysisCount: number
  lastResetDate: string // ISO date string (YYYY-MM-DD)
  totalAnalysisCount: number
}

interface UsageContextValue extends UsageState {
  // Limits based on tier
  dailyLimit: number
  canAnalyze: boolean
  remainingToday: number
  
  // Actions
  incrementUsage: () => boolean // Returns true if allowed, false if at limit
  resetDailyUsage: () => void
}

// ============================================
// TIER LIMITS
// ============================================

const TIER_DAILY_LIMITS: Record<TierLevel, number> = {
  free: 3,
  starter: 5,
  standard: 10,
  professional: 20,
  elite: Infinity, // Unlimited
}

// TESTING MODE - Set to true to bypass all limits
const TESTING_MODE = true

// ============================================
// STORAGE
// ============================================

const STORAGE_KEY = 'shotiq_usage_v1'

function getInitialState(): UsageState {
  return {
    dailyAnalysisCount: 0,
    lastResetDate: new Date().toISOString().split('T')[0],
    totalAnalysisCount: 0,
  }
}

function loadState(): UsageState {
  if (typeof window === 'undefined') return getInitialState()
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      const today = new Date().toISOString().split('T')[0]
      
      // Reset daily count if it's a new day
      if (parsed.lastResetDate !== today) {
        return {
          ...parsed,
          dailyAnalysisCount: 0,
          lastResetDate: today,
        }
      }
      
      return parsed
    }
  } catch (e) {
    console.error('[UsageContext] Failed to load state:', e)
  }
  
  return getInitialState()
}

function saveState(state: UsageState): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('[UsageContext] Failed to save state:', e)
  }
}

// ============================================
// CONTEXT
// ============================================

const UsageContext = createContext<UsageContextValue | undefined>(undefined)

export function UsageProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UsageState>(getInitialState)
  const { getCurrentTierConfig } = usePoints()
  
  // Load state on mount
  useEffect(() => {
    setState(loadState())
  }, [])
  
  // Save state when it changes
  useEffect(() => {
    saveState(state)
  }, [state])
  
  // Check and reset daily count if new day
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    if (state.lastResetDate !== today) {
      setState(prev => ({
        ...prev,
        dailyAnalysisCount: 0,
        lastResetDate: today,
      }))
    }
  }, [state.lastResetDate])
  
  // Get current tier's daily limit
  const currentTier = getCurrentTierConfig()
  const dailyLimit = TESTING_MODE ? Infinity : TIER_DAILY_LIMITS[currentTier?.id || 'free']
  const canAnalyze = TESTING_MODE ? true : state.dailyAnalysisCount < dailyLimit
  const remainingToday = TESTING_MODE ? Infinity : Math.max(0, dailyLimit - state.dailyAnalysisCount)
  
  // Increment usage
  const incrementUsage = useCallback((): boolean => {
    // In testing mode, always allow
    if (TESTING_MODE) {
      setState(prev => ({
        ...prev,
        dailyAnalysisCount: prev.dailyAnalysisCount + 1,
        totalAnalysisCount: prev.totalAnalysisCount + 1,
      }))
      return true
    }
    
    if (!canAnalyze) {
      return false
    }
    
    setState(prev => ({
      ...prev,
      dailyAnalysisCount: prev.dailyAnalysisCount + 1,
      totalAnalysisCount: prev.totalAnalysisCount + 1,
    }))
    
    return true
  }, [canAnalyze])
  
  // Reset daily usage (for testing or admin)
  const resetDailyUsage = useCallback(() => {
    setState(prev => ({
      ...prev,
      dailyAnalysisCount: 0,
      lastResetDate: new Date().toISOString().split('T')[0],
    }))
  }, [])
  
  const value: UsageContextValue = {
    ...state,
    dailyLimit,
    canAnalyze,
    remainingToday,
    incrementUsage,
    resetDailyUsage,
  }
  
  return (
    <UsageContext.Provider value={value}>
      {children}
    </UsageContext.Provider>
  )
}

export function useUsage() {
  const context = useContext(UsageContext)
  if (!context) {
    throw new Error('useUsage must be used within a UsageProvider')
  }
  return context
}
