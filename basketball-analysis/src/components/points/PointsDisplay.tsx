"use client"

import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
import { usePoints } from '@/lib/points/pointsContext'
import { Zap, Trophy, Flame, Circle, Target, Gem, Crown, Brain } from 'lucide-react'
import type { TierLevel } from '@/lib/points/pointsConfig'
import { TierMilestonesPopup } from './TierMilestonesPopup'

// Tier Icon component - replaces emoji icons with Lucide icons
function TierIcon({ tier, className = '', style }: { tier: TierLevel; className?: string; style?: React.CSSProperties }) {
  const icons: Record<TierLevel, React.ReactNode> = {
    free: <Circle className={className} style={style} />,
    starter: <Zap className={className} style={style} />,
    standard: <Target className={className} style={style} />,
    professional: <Gem className={className} style={style} />,
    elite: <Crown className={className} style={style} />,
  }
  return <>{icons[tier]}</>
}

interface PointsDisplayProps {
  variant?: 'header' | 'compact' | 'full'
  showProgress?: boolean
  showTier?: boolean
  className?: string
}

/**
 * Animated points counter display
 * Used in header to show current points with real-time updates
 */
export function PointsDisplay({ 
  variant = 'header',
  showProgress = true,
  showTier = true,
  className = '',
}: PointsDisplayProps) {
  const { state, lastEarnedPoints, getPointsToNext, getCurrentTierConfig, getNextTierConfig } = usePoints()
  const [isAnimating, setIsAnimating] = useState(false)
  const [displayPoints, setDisplayPoints] = useState(state.totalPoints)
  const [showMilestonesPopup, setShowMilestonesPopup] = useState(false)
  const prevPointsRef = useRef(state.totalPoints)
  
  // Animated counter using spring
  const springPoints = useSpring(state.totalPoints, { 
    stiffness: 100, 
    damping: 30,
    mass: 1,
  })
  
  // Round the spring value for display
  const animatedPoints = useTransform(springPoints, Math.round)
  
  // Watch for point changes and trigger animations
  useEffect(() => {
    if (state.totalPoints !== prevPointsRef.current) {
      setIsAnimating(true)
      prevPointsRef.current = state.totalPoints
      
      // Update spring target
      springPoints.set(state.totalPoints)
      
      // Stop animation after a delay
      const timer = setTimeout(() => setIsAnimating(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [state.totalPoints, springPoints])
  
  // Subscribe to animated value changes
  useEffect(() => {
    const unsubscribe = animatedPoints.on('change', (value) => {
      setDisplayPoints(value)
    })
    return unsubscribe
  }, [animatedPoints])
  
  const currentTier = getCurrentTierConfig()
  const nextTier = getNextTierConfig()
  const pointsToNext = getPointsToNext()
  
  // Calculate progress percentage
  const progressPercent = nextTier && pointsToNext
    ? ((state.totalPoints - currentTier.pointsRequired) / 
       (nextTier.pointsRequired - currentTier.pointsRequired)) * 100
    : 100
  
  if (variant === 'compact') {
    return (
      <motion.div 
        className={`flex items-center gap-1.5 ${className}`}
        animate={isAnimating ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Zap className="w-4 h-4 text-yellow-400" />
        <span className="font-bold text-slate-900">{displayPoints}</span>
      </motion.div>
    )
  }
  
  if (variant === 'header') {
    return (
      <>
        <motion.div 
          className={`relative flex items-center gap-3 px-4 py-2 rounded-full bg-black/90 backdrop-blur-sm border border-white/10 shadow-sm cursor-pointer hover:bg-black transition-colors ${className}`}
          animate={isAnimating ? { 
            scale: [1, 1.05, 1],
            boxShadow: [
              '0 0 0 rgba(255, 107, 53, 0)',
              '0 0 20px rgba(255, 107, 53, 0.5)',
              '0 0 0 rgba(255, 107, 53, 0)',
            ],
          } : {}}
          transition={{ duration: 0.5 }}
          onClick={() => setShowMilestonesPopup(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setShowMilestonesPopup(true)}
        >
          {/* Brain icon with glow */}
          <motion.div
            className="relative"
            animate={isAnimating ? { rotate: [0, -10, 10, 0] } : {}}
            transition={{ duration: 0.3 }}
          >
            <Brain className="w-5 h-5 text-[#FF6B35]" strokeWidth={1.5} />
            {isAnimating && (
              <motion.div
                className="absolute inset-0 rounded-full bg-[#FF6B35]/30"
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.5 }}
              />
            )}
          </motion.div>
          
          {/* Points number with IQ POINTS label */}
          <div className="flex items-center gap-1.5">
            <motion.span 
              className="font-bold text-white text-lg leading-none"
              animate={isAnimating ? { 
                color: ['#ffffff', '#FF6B35', '#ffffff'],
              } : {}}
              transition={{ duration: 0.5 }}
            >
              {displayPoints.toLocaleString()}
            </motion.span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">IQ POINTS</span>
          </div>
          
          {/* Progress to next tier */}
          {showProgress && nextTier && (
            <div className="flex items-center gap-2 ml-1 pl-3 border-l border-white/20">
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ 
                      background: `linear-gradient(90deg, ${currentTier.color}, ${nextTier.color})`,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progressPercent, 100)}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
                <span 
                  className="text-[9px] font-bold uppercase tracking-wider"
                  style={{ color: nextTier.color }}
                >
                  {nextTier.displayName}
                </span>
              </div>
            </div>
          )}
          
          {/* Earned points popup */}
          <AnimatePresence>
            {lastEarnedPoints && isAnimating && (
              <motion.div
                className="absolute -top-8 left-1/2 -translate-x-1/2 font-bold text-sm whitespace-nowrap"
                initial={{ y: 10, opacity: 0, scale: 0.5 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -10, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
                  +{lastEarnedPoints.points}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* Tier Milestones Popup */}
        <TierMilestonesPopup 
          isOpen={showMilestonesPopup} 
          onClose={() => setShowMilestonesPopup(false)} 
        />
      </>
    )
  }
  
  // Full variant - for profile or points page
  return (
    <div className={`bg-white rounded-2xl p-6 border border-slate-200 shadow-sm ${className}`}>
      {/* Current tier badge */}
      {showTier && (
        <div className="flex items-center gap-2 mb-4">
          <TierIcon tier={currentTier.id} className="w-6 h-6" style={{ color: currentTier.color }} />
          <span 
            className="font-bold text-lg"
            style={{ color: currentTier.color }}
          >
            {currentTier.displayName}
          </span>
          {state.streak > 0 && (
            <div className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-sm">
              <Flame className="w-4 h-4" />
              <span>{state.streak} day streak</span>
            </div>
          )}
        </div>
      )}
      
      {/* Points display */}
      <div className="flex items-baseline gap-3 mb-4">
        <motion.span 
          className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400"
          animate={isAnimating ? { scale: [1, 1.05, 1] } : {}}
        >
          {displayPoints.toLocaleString()}
        </motion.span>
        <span className="text-slate-500 text-lg">IQ points</span>
      </div>
      
      {/* Progress to next tier */}
      {nextTier && pointsToNext && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Next: {nextTier.displayName}</span>
            <span className="text-slate-700 font-medium">
              {pointsToNext.pointsNeeded.toLocaleString()} points to go
            </span>
          </div>
          
          <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ 
                background: `linear-gradient(90deg, ${currentTier.color}, ${nextTier.color})`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progressPercent, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
            
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
          </div>
          
          {/* Target tier name under progress bar */}
          <div className="text-center">
            <span 
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: nextTier.color }}
            >
              {nextTier.displayName}
            </span>
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${currentTier.color}20` }}
            >
              <TierIcon tier={currentTier.id} className="w-4 h-4" style={{ color: currentTier.color }} />
            </div>
            <div className="flex-1 h-0.5 bg-slate-200" />
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center border-2"
              style={{ borderColor: nextTier.color, opacity: 0.5 }}
            >
              <TierIcon tier={nextTier.id} className="w-4 h-4" style={{ color: nextTier.color }} />
            </div>
          </div>
        </div>
      )}
      
      {/* Today's earnings */}
      <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between text-sm">
        <span className="text-slate-500">Earned today</span>
        <span className="text-yellow-400 font-medium">+{state.pointsEarnedToday} pts</span>
      </div>
    </div>
  )
}

/**
 * Tier unlock notification
 */
export function TierUnlockNotification({
  onDismiss,
  onActivate,
}: {
  tier: string
  onDismiss: () => void
  onActivate: () => void
}) {
  const { getCurrentTierConfig } = usePoints()
  const tierConfig = getCurrentTierConfig()
  
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative bg-white rounded-3xl p-8 max-w-md w-full border border-slate-200 shadow-xl overflow-hidden"
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
      >
        {/* Background glow */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(circle at center, ${tierConfig.color}, transparent 70%)`,
          }}
        />
        
        {/* Confetti particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#A78BFA'][i % 4],
              left: `${10 + Math.random() * 80}%`,
              top: -10,
            }}
            animate={{
              y: [0, 400],
              x: [0, (Math.random() - 0.5) * 100],
              rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
              opacity: [1, 0],
            }}
            transition={{
              duration: 2 + Math.random(),
              delay: Math.random() * 0.5,
              ease: 'easeOut',
            }}
          />
        ))}
        
        <div className="relative z-10 text-center">
          {/* Trophy icon */}
          <motion.div
            className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${tierConfig.color}30` }}
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, -5, 5, 0],
            }}
            transition={{ 
              duration: 1,
              repeat: Infinity,
              repeatDelay: 2,
            }}
          >
            <TierIcon tier={tierConfig.id} className="w-10 h-10" style={{ color: tierConfig.color }} />
          </motion.div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Tier Unlocked!
          </h2>
          
          <p 
            className="text-3xl font-black mb-4"
            style={{ color: tierConfig.color }}
          >
            {tierConfig.displayName}
          </p>
          
          <p className="text-slate-600 mb-6">
            You&apos;ve earned access to {tierConfig.name} features!
            Activate now or save it for later.
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onDismiss}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
            >
              Save for Later
            </button>
            <button
              onClick={onActivate}
              className="flex-1 py-3 px-4 rounded-xl font-medium text-white transition-colors"
              style={{ backgroundColor: tierConfig.color }}
            >
              Activate Now
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/**
 * Progress indicator showing points to next unlock
 */
export function NextUnlockProgress({ className = '' }: { className?: string }) {
  const { state, getPointsToNext, getNextTierConfig } = usePoints()
  const pointsToNext = getPointsToNext()
  const nextTier = getNextTierConfig()
  
  if (!pointsToNext || !nextTier) {
    return (
      <div className={`text-center text-slate-500 ${className}`}>
        <Trophy className="w-6 h-6 mx-auto mb-1 text-yellow-400" />
        <span className="text-sm">Max tier reached!</span>
      </div>
    )
  }
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-500">Next unlock</span>
          <span 
            className="text-xs font-medium flex items-center gap-1"
            style={{ color: nextTier.color }}
          >
            <TierIcon tier={nextTier.id} className="w-3 h-3" style={{ color: nextTier.color }} />
            {nextTier.displayName}
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: nextTier.color }}
            initial={{ width: 0 }}
            animate={{ 
              width: `${((state.totalPoints - (nextTier.pointsRequired - pointsToNext.pointsNeeded - state.totalPoints)) / nextTier.pointsRequired) * 100}%` 
            }}
          />
        </div>
        {/* Target tier name under progress bar */}
        <div className="text-center mt-1">
          <span 
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: nextTier.color }}
          >
            {nextTier.displayName}
          </span>
        </div>
      </div>
      <div className="text-right">
        <span className="text-lg font-bold text-slate-900">{pointsToNext.pointsNeeded}</span>
        <span className="text-xs text-slate-500 block">pts away</span>
      </div>
    </div>
  )
}

// Export TierIcon for use in other components
export { TierIcon }

export default PointsDisplay
