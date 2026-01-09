"use client"

import React, { useState } from 'react'
import { usePoints } from '@/lib/points/pointsContext'
import { POINT_ACTIONS, TIERS, TIER_ORDER } from '@/lib/points/pointsConfig'
import { PointsDisplay, NextUnlockProgress } from '@/components/points/PointsDisplay'
import { PointsBurst, InlinePointsBurst } from '@/components/points/PointsBurst'
import { Zap, Trophy, Star, Gift, Clock, TrendingUp, Sparkles } from 'lucide-react'

export default function TestPointsPage() {
  const { 
    state, 
    earnPoints, 
    getPointsToNext, 
    getActiveTier,
    activateTier,
    getCurrentTierConfig,
    getNextTierConfig,
  } = usePoints()
  
  const [showInlineBurst, setShowInlineBurst] = useState(false)
  const [lastAction, setLastAction] = useState<{ action: string; result: string } | null>(null)
  
  const handleEarnPoints = (actionId: string) => {
    const result = earnPoints(actionId)
    setLastAction({
      action: POINT_ACTIONS[actionId]?.name || actionId,
      result: result.earned 
        ? `+${result.points} points!` 
        : `Blocked: ${result.reason}`
    })
  }
  
  const currentTier = getCurrentTierConfig()
  const nextTier = getNextTierConfig()
  const pointsToNext = getPointsToNext()
  const activeTier = getActiveTier()
  
  // Group actions by category
  const actionsByCategory = Object.values(POINT_ACTIONS).reduce((acc, action) => {
    if (!acc[action.category]) acc[action.category] = []
    acc[action.category].push(action)
    return acc
  }, {} as Record<string, typeof POINT_ACTIONS[string][]>)
  
  return (
    <div className="min-h-screen bg-[#050505] p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-black text-white mb-2 flex items-center justify-center gap-3">
            <Zap className="w-8 h-8 text-yellow-400" />
            Points System Test
            <Zap className="w-8 h-8 text-yellow-400" />
          </h1>
          <p className="text-[#888]">Test all points earning actions and see animations</p>
        </div>
        
        {/* Points Display Variants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-white font-bold text-lg">Header Display</h2>
            <div className="bg-[#1a1a1a] p-4 rounded-xl">
              <PointsDisplay variant="header" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-white font-bold text-lg">Compact Display</h2>
            <div className="bg-[#1a1a1a] p-4 rounded-xl flex justify-center">
              <PointsDisplay variant="compact" />
            </div>
          </div>
        </div>
        
        {/* Full Display */}
        <div className="space-y-4">
          <h2 className="text-white font-bold text-lg">Full Display</h2>
          <PointsDisplay variant="full" />
        </div>
        
        {/* Next Unlock Progress */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333]">
          <h2 className="text-white font-bold text-lg mb-4">Progress to Next Unlock</h2>
          <NextUnlockProgress />
        </div>
        
        {/* Tier Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#333]">
            <p className="text-[#888] text-sm mb-1">Current Tier</p>
            <p className="text-xl font-bold" style={{ color: currentTier.color }}>
              {currentTier.icon} {currentTier.displayName}
            </p>
          </div>
          <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#333]">
            <p className="text-[#888] text-sm mb-1">Active Tier</p>
            <p className="text-xl font-bold" style={{ color: TIERS[activeTier].color }}>
              {TIERS[activeTier].icon} {TIERS[activeTier].displayName}
            </p>
          </div>
          <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#333]">
            <p className="text-[#888] text-sm mb-1">Next Tier</p>
            {nextTier ? (
              <p className="text-xl font-bold" style={{ color: nextTier.color }}>
                {nextTier.icon} {nextTier.displayName}
              </p>
            ) : (
              <p className="text-xl font-bold text-yellow-400">👑 MAX TIER</p>
            )}
          </div>
        </div>
        
        {/* Access Bank */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333]">
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Access Bank
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TIER_ORDER.filter(t => t !== 'free').map(tier => {
              const tierConfig = TIERS[tier]
              const bankEntry = state.accessBank[tier]
              
              return (
                <div 
                  key={tier}
                  className="p-4 rounded-xl border"
                  style={{ 
                    borderColor: `${tierConfig.color}30`,
                    backgroundColor: `${tierConfig.color}10`
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{tierConfig.icon}</span>
                    <span className="font-bold text-sm" style={{ color: tierConfig.color }}>
                      {tierConfig.displayName}
                    </span>
                  </div>
                  <p className="text-white text-2xl font-bold">
                    {bankEntry?.daysRemaining.toFixed(1) || 0}
                  </p>
                  <p className="text-[#888] text-xs">days banked</p>
                  {bankEntry?.isActive && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                      ACTIVE
                    </span>
                  )}
                  {bankEntry && bankEntry.daysRemaining > 0 && !bankEntry.isActive && (
                    <button
                      onClick={() => activateTier(tier)}
                      className="mt-2 w-full py-1 text-xs font-bold rounded-lg"
                      style={{ backgroundColor: tierConfig.color, color: '#000' }}
                    >
                      Activate
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-4 rounded-xl border border-yellow-500/30">
            <Zap className="w-6 h-6 text-yellow-400 mb-2" />
            <p className="text-2xl font-bold text-white">{state.totalPoints}</p>
            <p className="text-[#888] text-sm">Total Points</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-4 rounded-xl border border-purple-500/30">
            <Star className="w-6 h-6 text-purple-400 mb-2" />
            <p className="text-2xl font-bold text-white">{state.lifetimePoints}</p>
            <p className="text-[#888] text-sm">Lifetime Points</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 p-4 rounded-xl border border-orange-500/30">
            <TrendingUp className="w-6 h-6 text-orange-400 mb-2" />
            <p className="text-2xl font-bold text-white">{state.streak}</p>
            <p className="text-[#888] text-sm">Day Streak</p>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-4 rounded-xl border border-green-500/30">
            <Gift className="w-6 h-6 text-green-400 mb-2" />
            <p className="text-2xl font-bold text-white">{state.pointsEarnedToday}</p>
            <p className="text-[#888] text-sm">Today&apos;s Points</p>
          </div>
        </div>
        
        {/* Last Action Result */}
        {lastAction && (
          <div className={`p-4 rounded-xl border ${
            lastAction.result.startsWith('+') 
              ? 'bg-green-500/10 border-green-500/30' 
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <p className="text-white font-medium">{lastAction.action}</p>
            <p className={lastAction.result.startsWith('+') ? 'text-green-400' : 'text-red-400'}>
              {lastAction.result}
            </p>
          </div>
        )}
        
        {/* Inline Burst Test */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333] relative">
          <h2 className="text-white font-bold text-lg mb-4">Inline Burst Animation</h2>
          <button
            onClick={() => setShowInlineBurst(true)}
            className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl text-black font-bold hover:opacity-90 transition-all"
          >
            Trigger +10 Burst
          </button>
          <InlinePointsBurst 
            points={10} 
            show={showInlineBurst} 
            onComplete={() => setShowInlineBurst(false)}
          />
        </div>
        
        {/* Action Buttons by Category */}
        {Object.entries(actionsByCategory).map(([category, actions]) => (
          <div key={category} className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333]">
            <h2 className="text-white font-bold text-lg mb-4 capitalize flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FF6B35]" />
              {category.replace('_', ' ')} Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {actions.map(action => (
                <button
                  key={action.id}
                  onClick={() => handleEarnPoints(action.id)}
                  className="p-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-[#444] hover:border-[#FF6B35]/50 rounded-xl transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-medium text-sm group-hover:text-[#FF6B35] transition-colors">
                      {action.name}
                    </span>
                    <span className="text-yellow-400 font-bold text-sm">
                      +{action.points}
                    </span>
                  </div>
                  <p className="text-[#666] text-xs">{action.description}</p>
                  {action.cooldown && (
                    <p className="text-[#555] text-[10px] mt-1">
                      ⏱️ {Math.round(action.cooldown / 1000 / 60)}min cooldown
                    </p>
                  )}
                  {action.maxPerDay && (
                    <p className="text-[#555] text-[10px]">
                      📊 Max {action.maxPerDay}/day
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
        
        {/* Tier Thresholds */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333]">
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Tier Thresholds
          </h2>
          <div className="space-y-3">
            {TIER_ORDER.map((tier, index) => {
              const tierConfig = TIERS[tier]
              const isUnlocked = state.totalPoints >= tierConfig.pointsRequired
              const isCurrent = tier === state.currentTier
              
              return (
                <div 
                  key={tier}
                  className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                    isCurrent 
                      ? 'border-2' 
                      : isUnlocked 
                        ? 'border-green-500/30 bg-green-500/5' 
                        : 'border-[#333] opacity-60'
                  }`}
                  style={isCurrent ? { borderColor: tierConfig.color, backgroundColor: `${tierConfig.color}10` } : {}}
                >
                  <span className="text-2xl">{tierConfig.icon}</span>
                  <div className="flex-1">
                    <p className="font-bold" style={{ color: tierConfig.color }}>
                      {tierConfig.displayName}
                    </p>
                    <p className="text-[#888] text-sm">
                      {tierConfig.pointsRequired.toLocaleString()} points required
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">
                      {tierConfig.initialTimeReward} days
                    </p>
                    <p className="text-[#666] text-xs">initial reward</p>
                  </div>
                  {isUnlocked && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                      ✓ Unlocked
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Recent History */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333]">
          <h2 className="text-white font-bold text-lg mb-4">Recent Activity</h2>
          {state.history.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {state.history.slice(0, 10).map((event) => (
                <div 
                  key={event.id}
                  className="flex items-center justify-between p-2 bg-[#2a2a2a] rounded-lg"
                >
                  <div>
                    <p className="text-white text-sm">{event.description}</p>
                    <p className="text-[#666] text-xs">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <span className="text-yellow-400 font-bold">+{event.points}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#666] text-center py-4">No activity yet. Start earning points!</p>
          )}
        </div>
      </div>
      
      {/* Global Points Burst */}
      <PointsBurst />
    </div>
  )
}
