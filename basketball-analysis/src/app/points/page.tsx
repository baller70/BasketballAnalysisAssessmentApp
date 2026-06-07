"use client"

import React, { useState } from 'react'
import { usePoints } from '@/lib/points/pointsContext'
import { POINT_ACTIONS, TIERS, TIER_ORDER, type TierLevel } from '@/lib/points/pointsConfig'
import { PointsDisplay, NextUnlockProgress } from '@/components/points/PointsDisplay'
import { 
  Zap, 
  Trophy, 
  Star, 
  Clock, 
  TrendingUp, 
  Gift,
  ChevronRight,
  Check,
  Lock,
  Unlock,
  Calendar,
  Target,
  Share2,
  Dumbbell,
  Award,
  Users,
  Info,
  Sparkles
} from 'lucide-react'

// Category icons and colors
const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  engagement: { icon: <Sparkles className="w-5 h-5" />, color: '#FF6B35', label: 'Engagement' },
  analysis: { icon: <Target className="w-5 h-5" />, color: '#3B82F6', label: 'Analysis' },
  workout: { icon: <Dumbbell className="w-5 h-5" />, color: '#22C55E', label: 'Workout' },
  social: { icon: <Share2 className="w-5 h-5" />, color: '#8B5CF6', label: 'Social' },
  achievement: { icon: <Award className="w-5 h-5" />, color: '#F59E0B', label: 'Achievements' },
  streak: { icon: <TrendingUp className="w-5 h-5" />, color: '#EF4444', label: 'Streaks' },
}

export default function PointsPage() {
  const { 
    state, 
    getPointsToNext, 
    getActiveTier,
    activateTier,
    getCurrentTierConfig,
    getNextTierConfig,
  } = usePoints()
  
  const [activeTab, setActiveTab] = useState<'overview' | 'earn' | 'tiers' | 'bank'>('overview')
  
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
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#E55A2B] shadow-lg shadow-[#FF6B35]/20 flex items-center justify-center">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-black text-slate-900">POINTS SYSTEM</h1>
              <p className="text-slate-500 text-sm">Earn rewards, unlock tiers, level up your game</p>
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-gradient-to-br from-[#FF6B35]/10 to-transparent p-4 rounded-xl border border-[#FF6B35]/20">
            <Zap className="w-5 h-5 text-[#FF6B35] mb-2" />
            <p className="text-2xl font-bold text-slate-900">{state.totalPoints.toLocaleString()}</p>
            <p className="text-slate-500 text-xs">Total Points</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <Trophy className="w-5 h-5 text-slate-400 mb-2" />
            <p className="text-2xl font-bold" style={{ color: currentTier.color }}>{currentTier.icon}</p>
            <p className="text-slate-500 text-xs">{currentTier.displayName}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <TrendingUp className="w-5 h-5 text-[#FF6B35] mb-2" />
            <p className="text-2xl font-bold text-slate-900">{state.streak}</p>
            <p className="text-slate-500 text-xs">Day Streak</p>
          </div>
          <div className="bg-[#FF6B35]/5 p-4 rounded-xl border border-[#FF6B35]/10">
            <Gift className="w-5 h-5 text-[#FF6B35] mb-2" />
            <p className="text-2xl font-bold text-slate-900">+{state.pointsEarnedToday}</p>
            <p className="text-slate-500 text-xs">Today</p>
          </div>
        </div>
        
        {/* Progress to Next Tier */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
          <NextUnlockProgress />
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: 'Overview', icon: <Info className="w-4 h-4" /> },
            { id: 'earn', label: 'How to Earn', icon: <Zap className="w-4 h-4" /> },
            { id: 'tiers', label: 'Tiers', icon: <Trophy className="w-4 h-4" /> },
            { id: 'bank', label: 'Access Bank', icon: <Clock className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-[#FF6B35] text-white'
                  : 'bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* How It Works */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-slate-900 font-bold text-lg mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#FF6B35]" />
                How It Works
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#FF6B35]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#FF6B35] font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-slate-900 font-medium">Earn Points</p>
                    <p className="text-slate-500 text-sm">Complete actions like uploading shots, finishing workouts, and sharing your progress to earn points.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#FF6B35]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#FF6B35] font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-slate-900 font-medium">Unlock Tiers</p>
                    <p className="text-slate-500 text-sm">Reach point thresholds to unlock higher tiers with better features and more AI coaching.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#FF6B35]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#FF6B35] font-bold">3</span>
                  </div>
                  <div>
                    <p className="text-slate-900 font-medium">Bank Access Time</p>
                    <p className="text-slate-500 text-sm">When you unlock a tier, you earn access time that goes into your bank. Activate it whenever you want!</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#FF6B35]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#FF6B35] font-bold">4</span>
                  </div>
                  <div>
                    <p className="text-slate-900 font-medium">Keep Earning</p>
                    <p className="text-slate-500 text-sm">Continue using the app to earn more access time. Points refresh annually - inactive points convert to XP badges after 1 year.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Tips */}
            <div className="bg-gradient-to-br from-[#FF6B35]/10 to-transparent rounded-2xl p-6 border border-[#FF6B35]/30">
              <h3 className="text-[#FF6B35] font-bold mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Quick Tips to Earn Fast
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700"><strong className="text-slate-900">Share your progress</strong> - Social sharing gives the most points (25-35 per share)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700"><strong className="text-slate-900">Complete the guide</strong> - Swipe through all cards for 50 bonus points</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700"><strong className="text-slate-900">Maintain your streak</strong> - Daily login gives 5 points + streak bonuses</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700"><strong className="text-slate-900">Invite friends</strong> - Get 100 points when a friend joins!</span>
                </li>
              </ul>
            </div>
            
            {/* Recent Activity */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-slate-900 font-bold text-lg mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#FF6B35]" />
                Recent Activity
              </h2>
              {state.history.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {state.history.slice(0, 10).map((event) => (
                    <div 
                      key={event.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"
                    >
                      <div>
                        <p className="text-slate-900 text-sm">{event.description}</p>
                        <p className="text-slate-400 text-xs">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-[#FF6B35] font-bold">+{event.points}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-8">No activity yet. Start earning points!</p>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'earn' && (
          <div className="space-y-6">
            {Object.entries(actionsByCategory).map(([category, actions]) => {
              const config = CATEGORY_CONFIG[category] || { icon: <Zap className="w-5 h-5" />, color: '#888', label: category }
              
              return (
                <div key={category} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h2 className="text-slate-900 font-bold text-lg mb-4 flex items-center gap-2">
                    <span style={{ color: config.color }}>{config.icon}</span>
                    {config.label}
                  </h2>
                  <div className="grid gap-3">
                    {actions.map(action => (
                      <div
                        key={action.id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-[#FF6B35]/30 transition-all"
                      >
                        <div className="flex-1">
                          <p className="text-slate-900 font-medium">{action.name}</p>
                          <p className="text-slate-500 text-sm">{action.description}</p>
                          <div className="flex gap-3 mt-1">
                            {action.cooldown && (
                              <span className="text-slate-400 text-xs flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {action.cooldown >= 86400000 
                                  ? `${Math.round(action.cooldown / 86400000)}d cooldown`
                                  : `${Math.round(action.cooldown / 3600000)}h cooldown`
                                }
                              </span>
                            )}
                            {action.maxPerDay && (
                              <span className="text-slate-400 text-xs flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Max {action.maxPerDay}/day
                              </span>
                            )}
                          </div>
                        </div>
                        <div 
                          className="px-3 py-1 rounded-full font-bold text-sm"
                          style={{ backgroundColor: `${config.color}20`, color: config.color }}
                        >
                          +{action.points}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        
        {activeTab === 'tiers' && (
          <div className="space-y-4">
            {TIER_ORDER.map((tierId, index) => {
              const tier = TIERS[tierId]
              const isUnlocked = state.totalPoints >= tier.pointsRequired
              const isCurrent = tierId === state.currentTier
              const isNext = nextTier?.id === tierId
              
              return (
                <div 
                  key={tierId}
                  className={`relative bg-white rounded-2xl p-6 border-2 shadow-sm transition-all ${
                    isCurrent 
                      ? 'border-2' 
                      : isUnlocked 
                        ? 'border-green-500/30' 
                        : 'border-slate-200 opacity-70'
                  }`}
                  style={isCurrent ? { borderColor: tier.color } : {}}
                >
                  {/* Current badge */}
                  {isCurrent && (
                    <div 
                      className="absolute -top-3 left-6 px-3 py-1 rounded-full text-xs font-bold"
                      style={{ backgroundColor: tier.color, color: '#000' }}
                    >
                      CURRENT
                    </div>
                  )}
                  
                  {/* Next badge */}
                  {isNext && !isCurrent && (
                    <div className="absolute -top-3 left-6 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-900 border border-slate-200">
                      NEXT UNLOCK
                    </div>
                  )}
                  
                  <div className="flex items-start gap-4">
                    {/* Tier Icon */}
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                      style={{ backgroundColor: `${tier.color}20` }}
                    >
                      {tier.icon}
                    </div>
                    
                    {/* Tier Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold" style={{ color: tier.color }}>
                          {tier.displayName}
                        </h3>
                        {isUnlocked ? (
                          <Unlock className="w-4 h-4 text-green-400" />
                        ) : (
                          <Lock className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      
                      <p className="text-slate-500 text-sm mb-3">
                        {tier.pointsRequired.toLocaleString()} points required
                        {isNext && pointsToNext && (
                          <span className="text-[#FF6B35] ml-2">
                            ({pointsToNext.pointsNeeded} to go)
                          </span>
                        )}
                      </p>
                      
                      {/* Features */}
                      <div className="space-y-1">
                        {tier.features.map((feature, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <Check 
                              className="w-4 h-4 mt-0.5 flex-shrink-0" 
                              style={{ color: isUnlocked ? '#22C55E' : '#666' }}
                            />
                            <span className={isUnlocked ? 'text-slate-700' : 'text-slate-400'}>
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Time Reward */}
                      {tier.initialTimeReward > 0 && (
                        <div 
                          className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
                          style={{ backgroundColor: `${tier.color}15`, color: tier.color }}
                        >
                          <Gift className="w-4 h-4" />
                          <span className="font-medium">
                            {tier.initialTimeReward} days access when unlocked
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress bar for next tier */}
                  {isNext && pointsToNext && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-500">Progress</span>
                        <span className="text-slate-900 font-medium">
                          {state.totalPoints} / {tier.pointsRequired}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${(state.totalPoints / tier.pointsRequired) * 100}%`,
                            backgroundColor: tier.color 
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        
        {activeTab === 'bank' && (
          <div className="space-y-6">
            {/* Explanation */}
            <div className="bg-gradient-to-br from-slate-100 to-transparent rounded-2xl p-6 border border-slate-200">
              <h3 className="text-slate-900 font-bold mb-2 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#FF6B35]" />
                What is the Access Bank?
              </h3>
              <p className="text-slate-700 text-sm">
                When you unlock a tier, you earn access time that goes into your bank. 
                You can activate it whenever you want - save it for when you need it most! 
                Keep earning points to add more time to your bank.
              </p>
            </div>
            
            {/* Access Bank Cards */}
            <div className="grid gap-4">
              {TIER_ORDER.filter(t => t !== 'free').map(tierId => {
                const tier = TIERS[tierId]
                const bankEntry = state.accessBank[tierId]
                const isUnlocked = state.totalPoints >= tier.pointsRequired || (bankEntry?.totalDaysEarned || 0) > 0
                
                return (
                  <div 
                    key={tierId}
                    className={`bg-white rounded-2xl p-6 border-2 shadow-sm transition-all ${
                      bankEntry?.isActive 
                        ? 'border-green-500' 
                        : isUnlocked 
                          ? 'border-slate-200' 
                          : 'border-slate-100 opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                          style={{ backgroundColor: `${tier.color}20` }}
                        >
                          {tier.icon}
                        </div>
                        <div>
                          <h3 className="font-bold" style={{ color: tier.color }}>
                            {tier.displayName}
                          </h3>
                          <p className="text-slate-500 text-sm">
                            {tier.pointsRequired.toLocaleString()} points to unlock
                          </p>
                        </div>
                      </div>
                      
                      {bankEntry?.isActive && (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm font-bold rounded-full">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    
                    {/* Time Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-2xl font-bold text-slate-900">
                          {bankEntry?.totalDaysEarned.toFixed(0) || 0}
                        </p>
                        <p className="text-slate-500 text-xs">Days Earned</p>
                      </div>
                      <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-2xl font-bold text-slate-900">
                          {bankEntry?.daysUsed.toFixed(1) || 0}
                        </p>
                        <p className="text-slate-500 text-xs">Days Used</p>
                      </div>
                      <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-2xl font-bold" style={{ color: tier.color }}>
                          {bankEntry?.daysRemaining.toFixed(1) || 0}
                        </p>
                        <p className="text-slate-500 text-xs">Days Left</p>
                      </div>
                    </div>
                    
                    {/* Activate Button */}
                    {bankEntry && bankEntry.daysRemaining > 0 && !bankEntry.isActive && (
                      <button
                        onClick={() => activateTier(tierId)}
                        className="w-full py-3 rounded-xl font-bold text-black transition-all hover:opacity-90"
                        style={{ backgroundColor: tier.color }}
                      >
                        Activate {tier.displayName} Access
                      </button>
                    )}
                    
                    {bankEntry?.isActive && bankEntry.expiresAt && (
                      <div className="text-center p-3 bg-green-500/10 rounded-xl border border-green-500/30">
                        <p className="text-green-400 text-sm">
                          Active until {new Date(bankEntry.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    
                    {!isUnlocked && (
                      <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <Lock className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                        <p className="text-slate-400 text-sm">
                          Reach {tier.pointsRequired.toLocaleString()} points to unlock
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
            {/* Annual Refresh Note */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
              <Calendar className="w-6 h-6 text-slate-500 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">
                Points refresh annually. Inactive points convert to XP badges after 1 year.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
