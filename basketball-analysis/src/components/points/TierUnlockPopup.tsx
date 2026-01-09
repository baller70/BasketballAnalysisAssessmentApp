"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy, Sparkles, ChevronRight, Gift, Zap } from 'lucide-react'
import { usePoints } from '@/lib/points/pointsContext'
import { TIERS } from '@/lib/points/pointsConfig'
import { TierIcon } from './PointsDisplay'

export function TierUnlockPopup() {
  const { lastUnlockedTier, clearLastUnlockedTier, activateTier } = usePoints()
  
  if (!lastUnlockedTier) return null
  
  const tierConfig = TIERS[lastUnlockedTier]
  if (!tierConfig) return null
  
  const handleActivate = () => {
    activateTier(lastUnlockedTier)
    clearLastUnlockedTier()
  }
  
  const handleDismiss = () => {
    clearLastUnlockedTier()
  }
  
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-3xl p-8 max-w-md w-full border overflow-hidden"
          style={{ borderColor: `${tierConfig.color}50` }}
          initial={{ scale: 0.5, y: 100, rotateX: 45 }}
          animate={{ scale: 1, y: 0, rotateX: 0 }}
          exit={{ scale: 0.5, y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-20"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
          
          {/* Animated background glow */}
          <motion.div 
            className="absolute inset-0 opacity-30"
            style={{
              background: `radial-gradient(circle at center, ${tierConfig.color}, transparent 70%)`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          {/* Confetti particles */}
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: [tierConfig.color, '#FFD700', '#FF6B6B', '#4ECDC4', '#A78BFA'][i % 5],
                left: `${5 + Math.random() * 90}%`,
                top: -20,
              }}
              animate={{
                y: [0, 500],
                x: [0, (Math.random() - 0.5) * 150],
                rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                opacity: [1, 0],
              }}
              transition={{
                duration: 2.5 + Math.random() * 1.5,
                delay: Math.random() * 0.8,
                ease: 'easeOut',
              }}
            />
          ))}
          
          {/* Sparkle effects */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`sparkle-${i}`}
              className="absolute"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                rotate: [0, 180],
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.2,
                repeat: Infinity,
                repeatDelay: 1,
              }}
            >
              <Sparkles className="w-4 h-4" style={{ color: tierConfig.color }} />
            </motion.div>
          ))}
          
          <div className="relative z-10 text-center">
            {/* Trophy with tier icon */}
            <motion.div
              className="relative w-28 h-28 mx-auto mb-6"
              animate={{ 
                y: [0, -10, 0],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {/* Outer glow ring */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ 
                  background: `conic-gradient(from 0deg, ${tierConfig.color}, transparent, ${tierConfig.color})`,
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />
              
              {/* Inner circle */}
              <div 
                className="absolute inset-2 rounded-full flex items-center justify-center"
                style={{ 
                  background: `linear-gradient(135deg, ${tierConfig.color}40, ${tierConfig.color}10)`,
                  boxShadow: `0 0 40px ${tierConfig.color}50`,
                }}
              >
                <TierIcon tier={tierConfig.id} className="w-12 h-12" style={{ color: tierConfig.color }} />
              </div>
            </motion.div>
            
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <h2 className="text-2xl font-black text-white uppercase tracking-wider">
                  Tier Unlocked!
                </h2>
                <Trophy className="w-6 h-6 text-yellow-400" />
              </div>
              
              <motion.p 
                className="text-4xl font-black mb-2 uppercase tracking-wider"
                style={{ color: tierConfig.color }}
                animate={{
                  textShadow: [
                    `0 0 20px ${tierConfig.color}50`,
                    `0 0 40px ${tierConfig.color}80`,
                    `0 0 20px ${tierConfig.color}50`,
                  ],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {tierConfig.displayName}
              </motion.p>
              
              <p className="text-white/60 text-sm mb-6">
                You&apos;ve unlocked {tierConfig.displayName} tier features!
              </p>
            </motion.div>
            
            {/* Rewards */}
            <motion.div
              className="bg-black/40 rounded-xl p-4 mb-6 border border-white/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <Gift className="w-5 h-5" style={{ color: tierConfig.color }} />
                <span className="text-white font-bold uppercase tracking-wider text-sm">Your Rewards</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white/80">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm">+{tierConfig.initialTimeReward} days of {tierConfig.displayName} access</span>
                </div>
                {tierConfig.features.slice(0, 3).map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-white/60">
                    <ChevronRight className="w-4 h-4" style={{ color: tierConfig.color }} />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            
            {/* Action buttons */}
            <motion.div
              className="flex gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <button
                onClick={handleDismiss}
                className="flex-1 py-3.5 px-4 rounded-xl bg-white/10 text-white font-bold uppercase tracking-wider hover:bg-white/20 transition-colors text-sm"
              >
                Save for Later
              </button>
              <motion.button
                onClick={handleActivate}
                className="flex-1 py-3.5 px-4 rounded-xl font-bold uppercase tracking-wider text-white text-sm flex items-center justify-center gap-2"
                style={{ 
                  background: `linear-gradient(135deg, ${tierConfig.color}, ${tierConfig.color}CC)`,
                  boxShadow: `0 0 20px ${tierConfig.color}40`,
                }}
                whileHover={{ scale: 1.02, boxShadow: `0 0 30px ${tierConfig.color}60` }}
                whileTap={{ scale: 0.98 }}
              >
                <Zap className="w-4 h-4" />
                Activate Now
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
