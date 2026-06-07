"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, Trophy, Star, ChevronRight, Sparkles } from 'lucide-react'
import { usePoints } from '@/lib/points/pointsContext'

export function TierProximityPopup() {
  const { state, getCurrentTierConfig, getNextTierConfig, getPointsToNext } = usePoints()
  const [isVisible, setIsVisible] = useState(false)
  const [popupType, setPopupType] = useState<'halfway' | 'almost' | null>(null)
  
  const currentTier = useMemo(() => getCurrentTierConfig(), [getCurrentTierConfig])
  const nextTier = useMemo(() => getNextTierConfig(), [getNextTierConfig])
  const pointsInfo = useMemo(() => getPointsToNext(), [getPointsToNext])
  
  const points = state.totalPoints
  
  // Calculate points needed for next tier (with null checks)
  const pointsToNextTier = pointsInfo?.pointsNeeded ?? 0
  const pointsInCurrentRange = nextTier && currentTier ? nextTier.pointsRequired - currentTier.pointsRequired : 0
  const halfwayPoint = currentTier ? currentTier.pointsRequired + Math.floor(pointsInCurrentRange / 2) : 0
  
  // Calculate progress percentage
  const progressPercent = useMemo(() => {
    if (!currentTier || !nextTier) return 0
    const range = nextTier.pointsRequired - currentTier.pointsRequired
    if (range <= 0) return 100
    const progress = points - currentTier.pointsRequired
    return Math.min(100, Math.max(0, (progress / range) * 100))
  }, [points, currentTier, nextTier])
  
  useEffect(() => {
    if (!nextTier || !currentTier) return
    
    const shownPopups = JSON.parse(localStorage.getItem('tier_proximity_shown') || '{}')
    const tierKey = nextTier.id
    
    // Check for "almost there" (20 points away)
    if (pointsToNextTier <= 20 && pointsToNextTier > 0) {
      const almostKey = `${tierKey}-almost`
      if (!shownPopups[almostKey]) {
        setPopupType('almost')
        setIsVisible(true)
        shownPopups[almostKey] = Date.now()
        localStorage.setItem('tier_proximity_shown', JSON.stringify(shownPopups))
        return
      }
    }
    
    // Check for "halfway" 
    if (points >= halfwayPoint && pointsToNextTier > 20) {
      const halfwayKey = `${tierKey}-halfway`
      if (!shownPopups[halfwayKey]) {
        setPopupType('halfway')
        setIsVisible(true)
        shownPopups[halfwayKey] = Date.now()
        localStorage.setItem('tier_proximity_shown', JSON.stringify(shownPopups))
        return
      }
    }
  }, [points, nextTier, currentTier, pointsToNextTier, halfwayPoint])
  
  const handleDismiss = () => setIsVisible(false)
  
  if (!isVisible || !nextTier || !popupType) return null
  
  const content = {
    halfway: {
      title: "HALFWAY THERE!",
      subtitle: `You're making great progress toward ${nextTier.displayName}`,
      pointsText: `${pointsToNextTier} points to go`,
      buttonText: "Keep It Up!",
    },
    almost: {
      title: "ALMOST THERE!",
      subtitle: `Just ${pointsToNextTier} more points to unlock ${nextTier.displayName}!`,
      pointsText: `Only ${pointsToNextTier} points away`,
      buttonText: "Let's Go!",
    },
  }
  
  const { title, subtitle, pointsText, buttonText } = content[popupType]
  
  // Tier rewards (matching tier IDs from pointsConfig)
  const tierRewards: Record<string, string[]> = {
    free: ['Basic Dashboard', '3 analyses per day'],
    starter: ['5 analyses per day', 'Basic workout suggestions', '+3 Days Access'],
    standard: ['10 analyses per day', 'AI-suggested workouts', 'Compare to 3 elite shooters'],
    professional: ['20 analyses per day', 'AI auto-generates workouts', 'Compare to ALL elite shooters'],
    elite: ['Unlimited analyses', 'Full training programs', 'Exclusive elite badges', 'VIP share cards'],
  }
  
  const rewards = tierRewards[nextTier.id] || []
  
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleDismiss}
      >
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{ 
                background: nextTier.color,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -80, 0],
                opacity: [0, 0.8, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
        
        {/* Popup card */}
        <motion.div
          className="relative max-w-md w-full mx-4 rounded-2xl overflow-hidden border border-slate-300"
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: `0 25px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04), 0 0 40px ${nextTier.color}15`,
          }}
          initial={{ scale: 0.8, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.8, y: 50, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glowing border */}
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ border: `2px solid ${nextTier.color}40` }}
            animate={{
              boxShadow: [
                `0 0 10px ${nextTier.color}15`,
                `0 0 20px ${nextTier.color}25`,
                `0 0 10px ${nextTier.color}15`,
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center transition-colors shadow-sm"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>
          
          {/* Header */}
          <div className="relative pt-8 pb-4 px-6 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-8 h-8 mx-auto" style={{ color: nextTier.color }} />
            </motion.div>
            
            <motion.h2
              className="text-3xl font-black tracking-wider mt-3"
              style={{ color: nextTier.color }}
              animate={{
                textShadow: [
                  `0 0 10px ${nextTier.color}60`,
                  `0 0 25px ${nextTier.color}80`,
                  `0 0 10px ${nextTier.color}60`,
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {title}
            </motion.h2>
            <p className="text-slate-600 mt-2 text-sm font-medium">{subtitle}</p>
          </div>
          
          {/* Progress ring */}
          <div className="flex justify-center py-4">
            <div className="relative w-28 h-28">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="48" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                <motion.circle
                  cx="56" cy="56" r="48"
                  fill="none"
                  stroke={nextTier.color}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 48}
                  initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 48 * (1 - progressPercent / 100) }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  style={{ filter: `drop-shadow(0 0 8px ${nextTier.color})` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-900">{Math.round(progressPercent)}%</span>
                <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">{pointsText}</span>
              </div>
            </div>
          </div>
          
          {/* Next tier preview */}
          <div className="px-6 pb-4">
            <div 
              className="rounded-xl p-4"
              style={{ 
                background: `linear-gradient(135deg, ${nextTier.color}12 0%, transparent 100%)`,
                border: `1.5px solid ${nextTier.color}30`,
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ 
                    background: `linear-gradient(135deg, ${nextTier.color}, ${nextTier.color}80)`,
                    boxShadow: `0 0 15px ${nextTier.color}50`,
                  }}
                >
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Unlocking</p>
                  <p className="text-slate-900 font-bold text-base">{nextTier.displayName}</p>
                </div>
              </div>
              
              {/* Rewards */}
              <div className="space-y-1.5">
                {rewards.slice(0, 3).map((reward, index) => (
                  <motion.div
                    key={reward}
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <Star className="w-3.5 h-3.5" style={{ color: nextTier.color }} />
                    <span className="text-slate-700 text-sm font-medium">{reward}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          
          {/* CTA */}
          <div className="px-6 pb-6">
            <motion.button
              className="w-full py-3.5 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 text-white"
              style={{
                background: `linear-gradient(135deg, ${nextTier.color}, ${nextTier.color}90)`,
                boxShadow: `0 0 25px ${nextTier.color}30`,
              }}
              whileHover={{ scale: 1.02, boxShadow: `0 0 35px ${nextTier.color}50` }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDismiss}
            >
              <Zap className="w-5 h-5" />
              {buttonText}
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
          
          {/* Bottom progress bar */}
          <div className="h-1.5 bg-slate-200 rounded-b-2xl">
            <motion.div
              className="h-full"
              style={{ background: nextTier.color }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
