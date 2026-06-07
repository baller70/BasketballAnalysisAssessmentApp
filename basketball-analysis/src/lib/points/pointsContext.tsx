"use client"

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { 
  POINT_ACTIONS, 
  TIERS, 
  TIER_ORDER,
  getTierByPoints, 
  getPointsToNextTier,
  calculateBonusTime,
  type TierLevel,
  type PointAction
} from './pointsConfig'

// ============================================
// TYPES
// ============================================

interface PointEarnEvent {
  id: string
  actionId: string
  points: number
  timestamp: number
  description: string
}

interface AccessBank {
  [tier: string]: {
    totalDaysEarned: number
    daysUsed: number
    daysRemaining: number
    isActive: boolean
    activatedAt: number | null
    expiresAt: number | null
  }
}

interface PointsState {
  totalPoints: number
  lifetimePoints: number
  currentTier: TierLevel
  highestTierUnlocked: TierLevel
  streak: number
  lastActiveDate: string | null
  pointsEarnedToday: number
  accessBank: AccessBank
  history: PointEarnEvent[]
  createdAt: number
  lastUpdated: number
  // Track which cards have been viewed per session (sessionId -> array of cardKeys)
  // This allows awarding points for each card swiped, not just once per session
  viewedAnalysisCards: Record<string, string[]>
}

interface PointsContextValue {
  // State
  state: PointsState
  
  // Points
  earnPoints: (actionId: string, metadata?: Record<string, unknown>) => { earned: boolean; points: number; reason?: string }
  getPointsToNext: () => { tier: TierLevel; pointsNeeded: number } | null
  
  // Tiers
  getCurrentTierConfig: () => typeof TIERS[TierLevel]
  getNextTierConfig: () => typeof TIERS[TierLevel] | null
  canUnlockTier: (tier: TierLevel) => boolean
  
  // Access Bank
  activateTier: (tier: TierLevel) => boolean
  deactivateTier: (tier: TierLevel) => void
  getActiveTier: () => TierLevel
  
  // Card tracking for analysis cards (per session, per card)
  hasViewedAnalysisCard: (sessionId: string, cardKey: string) => boolean
  markAnalysisCardViewed: (sessionId: string, cardKey: string) => void
  
  // Animation triggers
  lastEarnedPoints: { points: number; actionId: string; timestamp: number } | null
  clearLastEarned: () => void
  
  // Tier unlock notification
  lastUnlockedTier: TierLevel | null
  clearLastUnlockedTier: () => void
}

// ============================================
// INITIAL STATE
// ============================================

const getInitialAccessBank = (): AccessBank => {
  const bank: AccessBank = {}
  TIER_ORDER.forEach(tier => {
    if (tier !== 'free') {
      bank[tier] = {
        totalDaysEarned: 0,
        daysUsed: 0,
        daysRemaining: 0,
        isActive: false,
        activatedAt: null,
        expiresAt: null,
      }
    }
  })
  return bank
}

const getInitialState = (): PointsState => ({
  totalPoints: 98,
  lifetimePoints: 0,
  currentTier: 'free',
  highestTierUnlocked: 'free',
  streak: 0,
  lastActiveDate: null,
  pointsEarnedToday: 0,
  accessBank: getInitialAccessBank(),
  history: [],
  createdAt: Date.now(),
  lastUpdated: Date.now(),
  viewedAnalysisCards: {},
})

// ============================================
// STORAGE
// ============================================

const STORAGE_KEY = 'shotiq_points_v1'

const loadState = (): PointsState => {
  if (typeof window === 'undefined') return getInitialState()
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // Merge with initial state to handle new fields
      const merged = { ...getInitialState(), ...parsed }
      return merged
    }
  } catch (e) {
    console.error('Failed to load points state:', e)
  }
  return getInitialState()
}

const saveState = (state: PointsState) => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('Failed to save points state:', e)
  }
}

// ============================================
// CONTEXT
// ============================================

const PointsContext = createContext<PointsContextValue | null>(null)

export function PointsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PointsState>(getInitialState)
  const [isLoaded, setIsLoaded] = useState(false)
  const [lastEarnedPoints, setLastEarnedPoints] = useState<{ points: number; actionId: string; timestamp: number } | null>(null)
  const [lastUnlockedTier, setLastUnlockedTier] = useState<TierLevel | null>(null)
  
  // Load state on mount
  useEffect(() => {
    const loaded = loadState()
    setState(loaded)
    setIsLoaded(true)
  }, [])
  
  // Save state on change
  useEffect(() => {
    if (isLoaded) {
      saveState(state)
    }
  }, [state, isLoaded])
  
  // Check and update streak on mount and date change
  useEffect(() => {
    if (!isLoaded) return
    
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    if (state.lastActiveDate !== today) {
      setState(prev => {
        // Check if streak continues
        let newStreak = prev.streak
        if (prev.lastActiveDate === yesterday) {
          // Streak continues
          newStreak = prev.streak + 1
        } else if (prev.lastActiveDate !== today) {
          // Streak broken
          newStreak = 1
        }
        
        return {
          ...prev,
          streak: newStreak,
          lastActiveDate: today,
          pointsEarnedToday: 0, // Reset daily points
          lastUpdated: Date.now(),
        }
      })
    }
  }, [isLoaded, state.lastActiveDate])
  
  // Track action cooldowns
  const actionCooldowns = React.useRef<Record<string, number>>({})
  const actionDailyCounts = React.useRef<Record<string, { date: string; count: number }>>({})
  
  // Earn points
  const earnPoints = useCallback((actionId: string, metadata?: Record<string, unknown>): { earned: boolean; points: number; reason?: string } => {
    const action = POINT_ACTIONS[actionId]
    if (!action) {
      return { earned: false, points: 0, reason: 'Invalid action' }
    }
    
    const now = Date.now()
    const today = new Date().toISOString().split('T')[0]
    
    // Check cooldown
    if (action.cooldown) {
      const lastEarned = actionCooldowns.current[actionId] || 0
      if (now - lastEarned < action.cooldown) {
        return { earned: false, points: 0, reason: 'Action on cooldown' }
      }
    }
    
    // Check daily limit
    if (action.maxPerDay) {
      const dailyRecord = actionDailyCounts.current[actionId]
      if (dailyRecord && dailyRecord.date === today && dailyRecord.count >= action.maxPerDay) {
        return { earned: false, points: 0, reason: 'Daily limit reached' }
      }
    }
    
    // Calculate points (could add multipliers here)
    const points = action.points
    
    // Update cooldowns and daily counts
    actionCooldowns.current[actionId] = now
    
    if (action.maxPerDay) {
      const dailyRecord = actionDailyCounts.current[actionId]
      if (dailyRecord && dailyRecord.date === today) {
        dailyRecord.count++
      } else {
        actionDailyCounts.current[actionId] = { date: today, count: 1 }
      }
    }
    
    // Update state
    setState(prev => {
      const newTotalPoints = prev.totalPoints + points
      const newLifetimePoints = prev.lifetimePoints + points
      const newTier = getTierByPoints(newTotalPoints)
      
      // Check for new tier unlocks
      let newHighestTier = prev.highestTierUnlocked
      let newAccessBank = { ...prev.accessBank }
      
      // If we've unlocked a new tier, add time to access bank
      const currentTierIndex = TIER_ORDER.indexOf(prev.highestTierUnlocked)
      const newTierIndex = TIER_ORDER.indexOf(newTier)
      
      if (newTierIndex > currentTierIndex) {
        newHighestTier = newTier
        
        // Add initial time reward for newly unlocked tier
        if (newTier !== 'free' && newAccessBank[newTier]) {
          const tierConfig = TIERS[newTier]
          newAccessBank[newTier] = {
            ...newAccessBank[newTier],
            totalDaysEarned: tierConfig.initialTimeReward,
            daysRemaining: tierConfig.initialTimeReward,
          }
        }
        
        // Trigger tier unlock notification
        setTimeout(() => setLastUnlockedTier(newTier), 100)
      }
      
      // Calculate any bonus time for tiers already unlocked
      TIER_ORDER.forEach(tier => {
        if (tier !== 'free' && newAccessBank[tier]) {
          const bonusDays = calculateBonusTime(tier, newTotalPoints)
          if (bonusDays > newAccessBank[tier].totalDaysEarned) {
            const additionalDays = bonusDays - newAccessBank[tier].totalDaysEarned
            newAccessBank[tier] = {
              ...newAccessBank[tier],
              totalDaysEarned: bonusDays,
              daysRemaining: newAccessBank[tier].daysRemaining + additionalDays,
            }
          }
        }
      })
      
      const event: PointEarnEvent = {
        id: `${actionId}_${now}`,
        actionId,
        points,
        timestamp: now,
        description: action.description,
      }
      
      return {
        ...prev,
        totalPoints: newTotalPoints,
        lifetimePoints: newLifetimePoints,
        currentTier: newTier,
        highestTierUnlocked: newHighestTier,
        pointsEarnedToday: prev.pointsEarnedToday + points,
        accessBank: newAccessBank,
        history: [event, ...prev.history.slice(0, 99)], // Keep last 100
        lastUpdated: now,
      }
    })
    
    // Trigger animation
    setLastEarnedPoints({ points, actionId, timestamp: now })
    
    return { earned: true, points }
  }, [])
  
  const clearLastEarned = useCallback(() => {
    setLastEarnedPoints(null)
  }, [])
  
  const clearLastUnlockedTier = useCallback(() => {
    setLastUnlockedTier(null)
  }, [])
  
  const getPointsToNext = useCallback(() => {
    return getPointsToNextTier(state.totalPoints)
  }, [state.totalPoints])
  
  const getCurrentTierConfig = useCallback(() => {
    return TIERS[state.currentTier]
  }, [state.currentTier])
  
  const getNextTierConfig = useCallback(() => {
    const next = getPointsToNextTier(state.totalPoints)
    return next ? TIERS[next.tier] : null
  }, [state.totalPoints])
  
  const canUnlockTier = useCallback((tier: TierLevel) => {
    return state.totalPoints >= TIERS[tier].pointsRequired
  }, [state.totalPoints])
  
  const activateTier = useCallback((tier: TierLevel): boolean => {
    if (tier === 'free') return false
    
    const bankEntry = state.accessBank[tier]
    if (!bankEntry || bankEntry.daysRemaining <= 0) return false
    if (bankEntry.isActive) return false
    
    const now = Date.now()
    const expiresAt = now + (bankEntry.daysRemaining * 24 * 60 * 60 * 1000)
    
    setState(prev => ({
      ...prev,
      accessBank: {
        ...prev.accessBank,
        [tier]: {
          ...prev.accessBank[tier],
          isActive: true,
          activatedAt: now,
          expiresAt,
        },
      },
      lastUpdated: now,
    }))
    
    return true
  }, [state.accessBank])
  
  const deactivateTier = useCallback((tier: TierLevel) => {
    if (tier === 'free') return
    
    setState(prev => {
      const bankEntry = prev.accessBank[tier]
      if (!bankEntry || !bankEntry.isActive) return prev
      
      // Calculate remaining time
      const now = Date.now()
      const timeUsed = now - (bankEntry.activatedAt || now)
      const daysUsed = timeUsed / (24 * 60 * 60 * 1000)
      const newDaysRemaining = Math.max(0, bankEntry.daysRemaining - daysUsed)
      
      return {
        ...prev,
        accessBank: {
          ...prev.accessBank,
          [tier]: {
            ...bankEntry,
            isActive: false,
            daysUsed: bankEntry.daysUsed + daysUsed,
            daysRemaining: newDaysRemaining,
            activatedAt: null,
            expiresAt: null,
          },
        },
        lastUpdated: now,
      }
    })
  }, [])
  
  const getActiveTier = useCallback((): TierLevel => {
    // Check from highest to lowest for active tier
    for (let i = TIER_ORDER.length - 1; i >= 0; i--) {
      const tier = TIER_ORDER[i]
      if (tier === 'free') continue
      
      const bankEntry = state.accessBank[tier]
      if (bankEntry?.isActive) {
        // Check if still valid
        if (bankEntry.expiresAt && Date.now() < bankEntry.expiresAt) {
          return tier
        }
      }
    }
    return 'free'
  }, [state.accessBank])
  
  // Check if a specific card in a session has been viewed for points
  const hasViewedAnalysisCard = useCallback((sessionId: string, cardKey: string): boolean => {
    const sessionCards = state.viewedAnalysisCards[sessionId]
    if (!sessionCards) return false
    return sessionCards.includes(cardKey)
  }, [state.viewedAnalysisCards])
  
  // Mark a specific card in a session as viewed (for points tracking)
  const markAnalysisCardViewed = useCallback((sessionId: string, cardKey: string) => {
    setState(prev => {
      const sessionCards = prev.viewedAnalysisCards[sessionId] || []
      if (sessionCards.includes(cardKey)) {
        return prev // Already viewed this card
      }
      return {
        ...prev,
        viewedAnalysisCards: {
          ...prev.viewedAnalysisCards,
          [sessionId]: [...sessionCards, cardKey],
        },
        lastUpdated: Date.now(),
      }
    })
  }, [])
  
  const value: PointsContextValue = {
    state,
    earnPoints,
    getPointsToNext,
    getCurrentTierConfig,
    getNextTierConfig,
    canUnlockTier,
    activateTier,
    deactivateTier,
    getActiveTier,
    hasViewedAnalysisCard,
    markAnalysisCardViewed,
    lastEarnedPoints,
    clearLastEarned,
    lastUnlockedTier,
    clearLastUnlockedTier,
  }
  
  return (
    <PointsContext.Provider value={value}>
      {children}
    </PointsContext.Provider>
  )
}

export function usePoints() {
  const context = useContext(PointsContext)
  if (!context) {
    throw new Error('usePoints must be used within a PointsProvider')
  }
  return context
}

export default PointsContext
