"use client"

import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePoints } from '@/lib/points/pointsContext'

interface BurstParticle {
  id: number
  x: number
  y: number
  angle: number
  distance: number
  delay: number
  size: number
}

interface PointsBurstProps {
  // Where to show the burst (relative to viewport)
  originX?: number
  originY?: number
  // Whether to show the flying animation to header
  flyToHeader?: boolean
  // Custom header target position
  headerTargetX?: number
  headerTargetY?: number
}

/**
 * Animated points burst component
 * Shows "+X" with particles bursting out, then flying to the header counter
 */
export function PointsBurst({ 
  originX, 
  originY, 
  flyToHeader = true,
  headerTargetX = 60,
  headerTargetY = 20,
}: PointsBurstProps) {
  const { lastEarnedPoints, clearLastEarned } = usePoints()
  const [showBurst, setShowBurst] = useState(false)
  const [burstData, setBurstData] = useState<{ points: number; x: number; y: number } | null>(null)
  const [particles, setParticles] = useState<BurstParticle[]>([])
  
  // Generate particles for the burst effect
  const generateParticles = useCallback((count: number = 8): BurstParticle[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 0,
      y: 0,
      angle: (360 / count) * i + Math.random() * 20 - 10,
      distance: 30 + Math.random() * 40,
      delay: Math.random() * 0.1,
      size: 4 + Math.random() * 4,
    }))
  }, [])
  
  // Watch for new point earnings
  useEffect(() => {
    if (lastEarnedPoints) {
      const x = originX ?? window.innerWidth / 2
      const y = originY ?? window.innerHeight / 2
      
      setBurstData({ points: lastEarnedPoints.points, x, y })
      setParticles(generateParticles(lastEarnedPoints.points > 10 ? 12 : 8))
      setShowBurst(true)
      
      // Clear after animation completes
      const timer = setTimeout(() => {
        setShowBurst(false)
        clearLastEarned()
      }, flyToHeader ? 1500 : 1000)
      
      return () => clearTimeout(timer)
    }
  }, [lastEarnedPoints, originX, originY, flyToHeader, clearLastEarned, generateParticles])
  
  if (!showBurst || !burstData) return null
  
  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 pointer-events-none z-[9999]"
        style={{ perspective: '1000px' }}
      >
        {/* Particles */}
        {particles.map((particle) => {
          const radians = (particle.angle * Math.PI) / 180
          const endX = Math.cos(radians) * particle.distance
          const endY = Math.sin(radians) * particle.distance
          
          return (
            <motion.div
              key={particle.id}
              className="absolute rounded-full"
              style={{
                left: burstData.x,
                top: burstData.y,
                width: particle.size,
                height: particle.size,
                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                boxShadow: '0 0 10px rgba(255, 215, 0, 0.8)',
              }}
              initial={{ 
                x: 0, 
                y: 0, 
                opacity: 1, 
                scale: 0 
              }}
              animate={{ 
                x: endX, 
                y: endY, 
                opacity: 0, 
                scale: 1 
              }}
              transition={{ 
                duration: 0.5, 
                delay: particle.delay,
                ease: 'easeOut' 
              }}
            />
          )
        })}
        
        {/* Main points number */}
        <motion.div
          className="absolute font-black text-2xl"
          style={{
            left: burstData.x,
            top: burstData.y,
            textShadow: '0 0 20px rgba(255, 215, 0, 0.8), 0 2px 4px rgba(0,0,0,0.5)',
          }}
          initial={{ 
            x: '-50%', 
            y: '-50%', 
            scale: 0, 
            opacity: 0 
          }}
          animate={flyToHeader ? {
            // Keyframe animation: burst in then fly to header
            x: ['-50%', '-50%', headerTargetX - burstData.x],
            y: ['-50%', '-50%', headerTargetY - burstData.y],
            scale: [0, 1.5, 0.5],
            opacity: [0, 1, 0],
          } : {
            // Just burst and fade upward
            x: ['-50%', '-50%', '-50%'],
            y: ['-50%', '-80%', '-120%'],
            scale: [0, 1.5, 1],
            opacity: [0, 1, 0],
          }}
          transition={{ 
            duration: flyToHeader ? 1.2 : 0.8,
            times: [0, 0.4, 1],
            ease: 'easeOut',
          }}
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400">
            +{burstData.points}
          </span>
        </motion.div>
        
        {/* Glow ring */}
        <motion.div
          className="absolute rounded-full"
          style={{
            left: burstData.x,
            top: burstData.y,
            width: 60,
            height: 60,
            border: '2px solid rgba(255, 215, 0, 0.6)',
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.4), inset 0 0 20px rgba(255, 215, 0, 0.2)',
          }}
          initial={{ 
            x: '-50%', 
            y: '-50%', 
            scale: 0, 
            opacity: 1 
          }}
          animate={{ 
            x: '-50%', 
            y: '-50%', 
            scale: 2, 
            opacity: 0 
          }}
          transition={{ 
            duration: 0.6, 
            ease: 'easeOut' 
          }}
        />
      </div>
    </AnimatePresence>
  )
}

/**
 * Simpler inline burst for use directly on cards
 * Shows gold "+X IQ" animation with sparkles
 */
export function InlinePointsBurst({ 
  points, 
  show, 
  label = "IQ",
  onComplete 
}: { 
  points: number
  show: boolean
  label?: string
  onComplete?: () => void 
}) {
  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, 800)
      return () => clearTimeout(timer)
    }
  }, [show, onComplete])
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Background flash */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 0.4 }}
          />
          
          {/* Points text */}
          <motion.div
            className="font-black text-4xl"
            style={{
              textShadow: '0 0 30px rgba(255, 215, 0, 1), 0 0 60px rgba(255, 165, 0, 0.5)',
            }}
            initial={{ scale: 0, y: 0 }}
            animate={{ 
              scale: [0, 1.5, 1.2],
              y: [0, -20, -40],
            }}
            exit={{ 
              scale: 0.5, 
              y: -80, 
              opacity: 0 
            }}
            transition={{ 
              duration: 0.6,
              times: [0, 0.3, 1],
              ease: 'easeOut',
            }}
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-500">
              +{points} {label}
            </span>
          </motion.div>
          
          {/* Sparkles */}
          {[...Array(6)].map((_, i) => {
            const angle = (360 / 6) * i
            const radians = (angle * Math.PI) / 180
            const distance = 60
            
            return (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-yellow-400"
                style={{
                  boxShadow: '0 0 10px rgba(255, 215, 0, 0.8)',
                }}
                initial={{ 
                  x: 0, 
                  y: 0, 
                  scale: 0, 
                  opacity: 1 
                }}
                animate={{ 
                  x: Math.cos(radians) * distance, 
                  y: Math.sin(radians) * distance, 
                  scale: [0, 1, 0], 
                  opacity: [1, 1, 0] 
                }}
                transition={{ 
                  duration: 0.5, 
                  delay: i * 0.02,
                  ease: 'easeOut' 
                }}
              />
            )
          })}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default PointsBurst
