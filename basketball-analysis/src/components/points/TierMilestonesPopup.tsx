"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Lock, ChevronRight, Zap, Target, Gem, Crown, Circle } from 'lucide-react'
import { usePoints } from '@/lib/points/pointsContext'
import { TIERS, TIER_ORDER, type TierLevel } from '@/lib/points/pointsConfig'

interface TierMilestonesPopupProps {
  isOpen: boolean
  onClose: () => void
}

// Tier icons mapping
const tierIcons: Record<TierLevel, React.ReactNode> = {
  free: <Circle className="w-6 h-6" />,
  starter: <Zap className="w-6 h-6" />,
  standard: <Target className="w-6 h-6" />,
  professional: <Gem className="w-6 h-6" />,
  elite: <Crown className="w-6 h-6" />,
}

export function TierMilestonesPopup({ isOpen, onClose }: TierMilestonesPopupProps) {
  const { state, getCurrentTierConfig } = usePoints()
  const currentTier = getCurrentTierConfig()
  const currentTierIndex = TIER_ORDER.indexOf(state.currentTier)

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-lg bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] rounded-2xl border border-white/10 overflow-hidden max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-b from-[#1a1a1a] to-[#1a1a1a]/95 backdrop-blur-sm p-6 pb-4 border-b border-white/10">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
            
            <h2 className="text-2xl font-black text-white tracking-tight">
              TIER MILESTONES
            </h2>
            <p className="text-white/50 text-sm mt-1">
              Earn IQ Points to unlock higher tiers and exclusive features
            </p>
            
            {/* Current points display */}
            <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-[#FF6B35]/10 border border-[#FF6B35]/30">
              <div className="w-10 h-10 rounded-full bg-[#FF6B35]/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#FF6B35]" />
              </div>
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wider">Your IQ Points</p>
                <p className="text-2xl font-black text-white">{state.totalPoints.toLocaleString()}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-white/50 text-xs uppercase tracking-wider">Current Tier</p>
                <p className="font-bold" style={{ color: currentTier.color }}>{currentTier.displayName}</p>
              </div>
            </div>
          </div>

          {/* Tier list */}
          <div className="p-4 space-y-3">
            {TIER_ORDER.map((tierId, index) => {
              const tier = TIERS[tierId]
              const isUnlocked = index <= currentTierIndex
              const isCurrent = tierId === state.currentTier
              const isNext = index === currentTierIndex + 1
              const pointsNeeded = tier.pointsRequired - state.totalPoints
              const progress = isUnlocked ? 100 : Math.max(0, Math.min(100, ((state.totalPoints) / tier.pointsRequired) * 100))

              return (
                <motion.div
                  key={tierId}
                  className={`relative rounded-xl overflow-hidden transition-all ${
                    isCurrent 
                      ? 'ring-2 ring-offset-2 ring-offset-[#0d0d0d]' 
                      : isNext
                      ? 'ring-1 ring-white/20'
                      : ''
                  }`}
                  style={{
                    background: isUnlocked 
                      ? `linear-gradient(135deg, ${tier.color}15 0%, ${tier.color}05 100%)`
                      : 'rgba(255,255,255,0.02)',
                    ...(isCurrent ? { ringColor: tier.color } : {}),
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Tier icon */}
                      <div 
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                          isUnlocked ? '' : 'opacity-40'
                        }`}
                        style={{
                          background: isUnlocked 
                            ? `linear-gradient(135deg, ${tier.color}, ${tier.color}80)`
                            : 'rgba(255,255,255,0.1)',
                          boxShadow: isUnlocked ? `0 0 20px ${tier.color}40` : 'none',
                        }}
                      >
                        <div style={{ color: isUnlocked ? '#fff' : '#666' }}>
                          {tierIcons[tierId]}
                        </div>
                      </div>

                      {/* Tier info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 
                            className={`font-bold text-lg ${isUnlocked ? '' : 'text-white/40'}`}
                            style={{ color: isUnlocked ? tier.color : undefined }}
                          >
                            {tier.displayName}
                          </h3>
                          {isCurrent && (
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-white/10 text-white/70">
                              Current
                            </span>
                          )}
                          {isNext && (
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full text-[#FF6B35] bg-[#FF6B35]/10">
                              Next
                            </span>
                          )}
                        </div>

                        {/* Points requirement */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-sm ${isUnlocked ? 'text-white/60' : 'text-white/30'}`}>
                            {tier.pointsRequired.toLocaleString()} points required
                          </span>
                          {isUnlocked ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Lock className="w-3 h-3 text-white/30" />
                          )}
                        </div>

                        {/* Progress bar for locked tiers */}
                        {!isUnlocked && (
                          <div className="mb-2">
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ background: tier.color }}
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.8, delay: index * 0.1 }}
                              />
                            </div>
                            <p className="text-xs text-white/40 mt-1">
                              {pointsNeeded > 0 ? `${pointsNeeded.toLocaleString()} more points needed` : 'Almost there!'}
                            </p>
                          </div>
                        )}

                        {/* Features list */}
                        <div className="space-y-1">
                          {tier.features.slice(0, 3).map((feature, fIndex) => (
                            <div 
                              key={fIndex}
                              className={`flex items-center gap-2 text-xs ${isUnlocked ? 'text-white/60' : 'text-white/30'}`}
                            >
                              <ChevronRight className="w-3 h-3 shrink-0" style={{ color: isUnlocked ? tier.color : undefined }} />
                              <span>{feature}</span>
                            </div>
                          ))}
                          {tier.features.length > 3 && (
                            <p className={`text-xs ${isUnlocked ? 'text-white/40' : 'text-white/20'}`}>
                              +{tier.features.length - 3} more features
                            </p>
                          )}
                        </div>

                        {/* Time reward info */}
                        {tier.initialTimeReward > 0 && (
                          <div className={`mt-2 text-xs ${isUnlocked ? 'text-[#FF6B35]' : 'text-white/30'}`}>
                            🎁 Unlock: +{tier.initialTimeReward} days access
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Connection line to next tier */}
                  {index < TIER_ORDER.length - 1 && (
                    <div className="absolute -bottom-3 left-10 w-0.5 h-6 bg-white/10" />
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 p-4 bg-gradient-to-t from-[#0d0d0d] to-transparent">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-[#FF6B35] text-white font-bold uppercase tracking-wider hover:bg-[#E55A2B] transition-colors"
            >
              Keep Earning Points
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
