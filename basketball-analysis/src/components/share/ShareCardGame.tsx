"use client"

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react"
import Image from "next/image"
import html2canvas from "html2canvas"
import JSZip from "jszip"
import { 
  ArrowLeft,
  ArrowRight,
  Share2,
  Download,
  Copy,
  Check,
  X,
  Target,
  Trophy,
  Flame,
  Users,
  TrendingUp,
  Dumbbell,
  BarChart3,
  Medal,
  Camera,
  Video,
  Clock,
  Zap,
  Star,
  Crown,
  Award,
  RotateCcw,
  Sparkles,
  Play,
  Image as ImageIcon,
  Smartphone,
  Monitor,
  Square
} from "lucide-react"
import { getAllSessions, type AnalysisSession } from "@/services/sessionStorage"
import { ALL_ELITE_SHOOTERS } from "@/data/eliteShooters"
import { usePoints } from "@/lib/points/pointsContext"
import { InlinePointsBurst } from "@/components/points/PointsBurst"

// ============================================
// TYPES
// ============================================

type ShareCardType = 
  | 'latest_analysis'
  | 'badge_unlock'
  | 'streak'
  | 'elite_comparison'
  | 'workout_complete'
  | 'weekly_summary'
  | 'milestone'
  | 'image_upload'
  | 'video_upload'
  | 'progress'

interface ShareCardData {
  type: ShareCardType
  title: string
  subtitle: string
  icon: React.ElementType
  color: string
  available: boolean
  data: Record<string, unknown>
}

type BadgeTier = "standard" | "elite" | "rare"

interface UserData {
  name: string
  score: number
  level: number
  totalXP: number
  streak: number
  totalAnalyses: number
  improvement: number
  percentile: number
  eliteMatch: {
    name: string
    similarity: number
    image: string
  }
  metrics: {
    elbowAngle: number
    releasePoint: number
    followThrough: number
    kneeAlignment: number
    arcTrajectory: number
  }
  recentBadge: {
    name: string
    description: string
    tier: BadgeTier
    icon: React.ElementType
    rarity: number
  }
  analysisDate: string
  imageBase64?: string
  skeletonBase64?: string
  videoFrames?: string[]
  videoDuration?: number
  videoPhases?: string[]
}

// ============================================
// HELPER COMPONENTS
// ============================================

// Noise texture overlay - using CSS gradient pattern for html-to-image compatibility
function NoiseOverlay() {
  return (
    <div 
      className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
      style={{
        // Use a simple repeating gradient pattern instead of SVG filter for better compatibility
        backgroundImage: `repeating-linear-gradient(
          45deg,
          rgba(255,255,255,0.1) 0px,
          rgba(255,255,255,0.1) 1px,
          transparent 1px,
          transparent 3px
        ), repeating-linear-gradient(
          -45deg,
          rgba(0,0,0,0.1) 0px,
          rgba(0,0,0,0.1) 1px,
          transparent 1px,
          transparent 3px
        )`,
        backgroundSize: '4px 4px'
      }}
    />
  )
}

// ShotIQ Logo Watermark - Vertical, left side, S at TOP near banner, full logo visible going down
function ShotIQWatermark() {
  return (
    <div 
      className="absolute pointer-events-none"
      style={{
        left: '8px',
        top: '8px',
        zIndex: 5
      }}
    >
      {/* Vertical Logo - rotated so S is at top, full logo going down the left side */}
      <img 
        src="/images/shotiq-text logo.png" 
        alt="" 
        style={{
          opacity: 0.2,
          transform: 'rotate(90deg) translateX(0) translateY(-100%)',
          transformOrigin: 'top left',
          width: '280px',
          height: 'auto'
        }}
      />
    </div>
  )
}

// ShotIQ Logo Icon Component - replaces the Target icon next to "SHOTIQ AI"
function ShotIQLogoIcon({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-full ${className || 'w-7 h-7'}`}>
      <Image 
        src="/images/ShotIQ Logo Gredient.png" 
        alt="ShotIQ" 
        fill
        className="object-contain"
      />
    </div>
  )
}

// Score Ring Component
function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const strokeWidth = size * 0.06
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (score / 100) * circumference
  
  const getScoreColor = (s: number) => {
    if (s >= 90) return '#D4AF37'
    if (s >= 80) return '#FF6B35'
    if (s >= 70) return '#22C55E'
    return '#888888'
  }
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getScoreColor(score)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ filter: score >= 90 ? 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.5))' : undefined }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-black" style={{ fontSize: size * 0.35, color: getScoreColor(score) }}>{score}</span>
        <span className="text-[#888] uppercase tracking-wider" style={{ fontSize: size * 0.08 }}>Score</span>
      </div>
    </div>
  )
}

// Metric Bar Component
function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[#888] text-xs w-14 uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-white text-sm font-bold w-8 text-right">{value}</span>
    </div>
  )
}

// ============================================
// ORIGINAL CARD TEMPLATES (From test-share)
// ============================================

// Card 1: Latest Analysis Card (Full Analysis)
function AnalysisCardContent({ data }: { data: UserData }) {
  return (
    <div className="relative w-full bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] rounded-2xl overflow-hidden p-5 flex flex-col">
      <NoiseOverlay />
      <ShotIQWatermark />
      
      {/* Glow effect - using radial gradient instead of blur for html2canvas compatibility */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255, 107, 53, 0.2) 0%, rgba(255, 107, 53, 0.1) 30%, rgba(255, 107, 53, 0.03) 50%, transparent 70%)'
        }}
      />
      
      {/* Header */}
      <div className="flex items-center justify-end mb-4 relative z-10">
        {/* Icon/text above, date below */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            <ShotIQLogoIcon className="w-4 h-4" />
            <span className="text-white font-semibold text-[10px]">SHOTIQ AI</span>
          </div>
          <span className="text-[#555] text-xs">{data.analysisDate}</span>
        </div>
      </div>

      {/* Score */}
      <div className="flex justify-center mb-4 relative z-10">
        <ScoreRing score={data.score} size={120} />
      </div>

      {/* User Info */}
      <div className="text-center mb-4 relative z-10">
        <h2 className="text-white text-lg font-bold mb-1 uppercase">{data.name}&apos;s Analysis</h2>
        <p className="text-[#FF6B35] text-xs font-medium">Top {100 - data.percentile}% of all shooters</p>
      </div>

      {/* Metrics */}
      <div className="space-y-2 mb-4 relative z-10">
        <MetricBar label="Elbow" value={data.metrics.elbowAngle} color="#FF6B35" />
        <MetricBar label="Release" value={data.metrics.releasePoint} color="#FF8F5F" />
        <MetricBar label="Follow" value={data.metrics.followThrough} color="#FFB088" />
        <MetricBar label="Knee" value={data.metrics.kneeAlignment} color="#FFC8A8" />
        <MetricBar label="Arc" value={data.metrics.arcTrajectory} color="#FFE0C8" />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 mb-4 relative z-10">
        {[
          { value: data.streak, label: 'Day Streak', icon: Flame },
          { value: data.totalAnalyses, label: 'Analyses', icon: Camera },
          { value: `+${data.improvement}`, label: 'Improved', icon: TrendingUp },
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 rounded-xl p-2 text-center">
            <stat.icon className="w-3.5 h-3.5 text-[#FF6B35] mx-auto mb-1" />
            <div className="text-white font-bold text-sm">{stat.value}</div>
            <div className="text-[#555] text-[8px] uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between relative z-10">
        <div className="text-[#444] text-[9px]">Analyze your shot at shotiqai.com</div>
        <div className="w-10 h-10 rounded-lg overflow-hidden">
          <img 
            src="/images/ShotIQ Logo Gredient.png" 
            alt="ShotIQ" 
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </div>
  )
}

// Card 2: Badge/Achievement Card
function AchievementCardContent({ data }: { data: UserData }) {
  const Icon = data.recentBadge.icon
  
  return (
    <div className="relative w-full bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] rounded-2xl overflow-hidden flex flex-col items-center justify-center p-6 min-h-[400px]">
      <NoiseOverlay />
      <ShotIQWatermark />
      
      {/* Glow effect - using radial gradient instead of blur for html2canvas compatibility */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 30%, rgba(212, 175, 55, 0.03) 50%, transparent 70%)'
        }}
      />
      
      {/* Header */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
        <div className="flex items-center gap-1">
          <ShotIQLogoIcon className="w-4 h-4" />
          <span className="text-white font-semibold text-[10px]">SHOTIQ AI</span>
        </div>
        <span className="text-[#555] text-xs">{data.analysisDate}</span>
      </div>

      {/* Badge */}
      <div className="relative z-10 mb-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#B8860B] via-[#FFD700] to-[#B8860B] p-1 shadow-[0_0_30px_rgba(212,175,55,0.4)]">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-[#8B6914] via-[#D4AF37] to-[#8B6914] flex items-center justify-center">
            <Icon className="w-10 h-10 text-[#1a1a1a]" />
          </div>
        </div>
      </div>

      {/* Achievement Info */}
      <div className="text-center relative z-10">
        <div className="text-[#D4AF37] text-[10px] font-bold tracking-[0.3em] mb-2 uppercase">
          Achievement Unlocked
        </div>
        <h2 className="text-white text-2xl font-bold mb-1 uppercase">{data.recentBadge.name}</h2>
        <p className="text-[#888] text-xs mb-4">{data.recentBadge.description}</p>
        
        <div className="inline-flex items-center gap-2 bg-white/5 rounded-full px-3 py-1.5">
          <Star className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span className="text-[#888] text-xs">Only {data.recentBadge.rarity}% of users have this</span>
        </div>
      </div>

      {/* User Stats */}
      <div className="flex justify-center gap-6 mt-6 relative z-10">
        <div className="text-center">
          <div className="text-[#FF6B35] text-xl font-bold">{data.level}</div>
          <div className="text-[#555] text-[10px] uppercase tracking-wider">Level</div>
        </div>
        <div className="text-center">
          <div className="text-white text-xl font-bold">{data.totalXP.toLocaleString()}</div>
          <div className="text-[#555] text-[10px] uppercase tracking-wider">Total XP</div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <div className="text-[#444] text-[9px]">shotiqai.com</div>
        <div className="w-10 h-10 rounded-lg overflow-hidden">
          <img 
            src="/images/ShotIQ Logo Gredient.png" 
            alt="ShotIQ" 
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </div>
  )
}

// Fire Icon SVG for html2canvas compatibility
function FireIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 23C16.1421 23 19.5 19.6421 19.5 15.5C19.5 13.5 18.5 11.5 17 10C16.5 9.5 16 9 15.5 8C14.5 6.5 14 5 14 3C14 3 12.5 5 11 7C9.5 9 8 10.5 7 12.5C6 14.5 5.5 16 6 18C6.5 20 8 22 10 22.5" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 23C13.6569 23 15 21.2091 15 19C15 17.5 14.5 16 13.5 15C13 14.5 12.5 14 12 13C11.5 14 11 14.5 10.5 15C9.5 16 9 17.5 9 19C9 21.2091 10.3431 23 12 23Z" fill="#FF6B35"/>
    </svg>
  )
}

// Card 3: Streak Card
function StreakCardContent({ data }: { data: UserData }) {
  return (
    <div className="relative w-full bg-gradient-to-br from-[#0a0a0a] via-[#1a0a00] to-[#0a0a0a] rounded-2xl overflow-hidden flex flex-col items-center justify-center p-6 min-h-[400px]">
      <NoiseOverlay />
      <ShotIQWatermark />
      
      {/* Fire glow effect - using radial gradient instead of blur for html2canvas compatibility */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255, 107, 53, 0.25) 0%, rgba(255, 69, 0, 0.15) 30%, rgba(255, 69, 0, 0.05) 50%, transparent 70%)'
        }}
      />
      
      {/* Header */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
        <div className="flex items-center gap-1">
          <ShotIQLogoIcon className="w-4 h-4" />
          <span className="text-white font-semibold text-[10px]">SHOTIQ AI</span>
        </div>
        <span className="text-[#555] text-xs">{data.analysisDate}</span>
      </div>

      {/* Streak Number */}
      <div className="relative z-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <FireIcon className="w-10 h-10" />
          {/* Plain solid color text for html2canvas compatibility */}
          <span className="text-[90px] font-black text-[#FF6B35]" style={{ lineHeight: 1 }}>
            {data.streak}
          </span>
          <FireIcon className="w-10 h-10" />
        </div>
        
        <div className="text-white text-xl font-bold mb-1">DAY STREAK</div>
        <p className="text-[#888] text-xs mb-6">Practicing every day builds champions</p>

        {/* Stats */}
        <div className="flex justify-center gap-4">
          <div className="text-center">
            <div className="text-[#FF6B35] text-lg font-bold">{data.totalAnalyses}</div>
            <div className="text-[#555] text-[10px] uppercase tracking-wider">Total Shots</div>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="text-center">
            <div className="text-[#FF6B35] text-lg font-bold">{data.score}</div>
            <div className="text-[#555] text-[10px] uppercase tracking-wider">Best Score</div>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="text-center">
            <div className="text-[#FF6B35] text-lg font-bold">+{data.improvement}</div>
            <div className="text-[#555] text-[10px] uppercase tracking-wider">Improved</div>
          </div>
        </div>
      </div>

      {/* Challenge */}
      <div className="mt-6 bg-white/5 rounded-xl px-4 py-3 text-center">
        <p className="text-white text-sm font-medium">Can you beat my streak?</p>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <div className="text-[#444] text-[9px]">Track your progress at shotiqai.com</div>
        <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center p-1">
          <img 
            src="/images/ShotIQ Logo Gredient.png" 
            alt="ShotIQ" 
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </div>
  )
}

// Card 4: Elite Comparison Card
function ComparisonCardContent({ data }: { data: UserData }) {
  return (
    <div className="relative w-full bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] rounded-2xl overflow-hidden p-5 flex flex-col min-h-[400px]">
      <NoiseOverlay />
      <ShotIQWatermark />
      
      {/* Glow effect - using radial gradient instead of blur for html2canvas compatibility */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 30%, rgba(212, 175, 55, 0.03) 50%, transparent 70%)'
        }}
      />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <span className="text-[#D4AF37] text-[10px] font-bold tracking-wider">ELITE MATCH</span>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            <ShotIQLogoIcon className="w-4 h-4" />
            <span className="text-white font-semibold text-[10px]">SHOTIQ AI</span>
          </div>
          <span className="text-[#555] text-xs">{data.analysisDate}</span>
        </div>
      </div>

      {/* Comparison Visual */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        {/* Similarity Ring */}
        <div className="relative mb-6">
          <ScoreRing score={data.eliteMatch.similarity} size={130} />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
            MATCH
          </div>
        </div>

        {/* Comparison Text */}
        <div className="text-center mb-6">
          <p className="text-[#888] text-xs mb-1">Your form is</p>
          <h2 className="text-white text-2xl font-bold mb-1 uppercase">
            {data.eliteMatch.similarity}% Similar
          </h2>
          <p className="text-[#888] text-xs">to</p>
          <h3 className="text-[#D4AF37] text-xl font-bold mt-1 uppercase">{data.eliteMatch.name}</h3>
        </div>

        {/* Metrics Comparison */}
        <div className="w-full space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#666]">Your Score</span>
            <span className="text-white font-bold">{data.score}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#666]">Elite Benchmark</span>
            <span className="text-[#D4AF37] font-bold">95</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#666]">Gap to Close</span>
            <span className="text-[#FF6B35] font-bold">{95 - data.score} pts</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between relative z-10 mt-4">
        <div className="text-[#444] text-[9px]">Compare with legends at shotiqai.com</div>
        <div className="w-10 h-10 rounded-lg overflow-hidden">
          <img 
            src="/images/ShotIQ Logo Gredient.png" 
            alt="ShotIQ" 
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </div>
  )
}

// Card 5: Workout Complete Card
function WorkoutCardContent({ data }: { data: UserData }) {
  return (
    <div className="relative w-full bg-gradient-to-br from-[#0a0a0a] via-[#0a1a0a] to-[#0a0a0a] rounded-2xl overflow-hidden flex flex-col items-center justify-center p-6 min-h-[400px]">
      <NoiseOverlay />
      <ShotIQWatermark />
      
      {/* Glow effect - using radial gradient instead of blur for html2canvas compatibility */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.1) 30%, rgba(34, 197, 94, 0.03) 50%, transparent 70%)'
        }}
      />
      
      {/* Header */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
        <div className="flex items-center gap-1">
          <ShotIQLogoIcon className="w-4 h-4" />
          <span className="text-white font-semibold text-[10px]">SHOTIQ AI</span>
        </div>
        <span className="text-[#555] text-xs">{data.analysisDate}</span>
      </div>

      {/* Completion Badge */}
      <div className="relative z-10 mb-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#22C55E]/20 to-[#16A34A]/20 border-2 border-[#22C55E]/50 flex items-center justify-center">
          <Check className="w-12 h-12 text-[#22C55E]" />
        </div>
      </div>

      {/* Workout Info */}
      <div className="text-center relative z-10 mb-6">
        <div className="text-[#22C55E] text-[10px] font-bold tracking-[0.3em] mb-2 uppercase">
          Workout Complete
        </div>
        <h2 className="text-white text-xl font-bold mb-1">FORM PERFECTION DRILL</h2>
        <p className="text-[#888] text-xs">Great work on your training!</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 relative z-10">
        <div className="text-center">
          <Clock className="w-5 h-5 text-[#22C55E] mx-auto mb-1" />
          <div className="text-white text-lg font-bold">25</div>
          <div className="text-[#555] text-[10px] uppercase">Minutes</div>
        </div>
        <div className="text-center">
          <Target className="w-5 h-5 text-[#22C55E] mx-auto mb-1" />
          <div className="text-white text-lg font-bold">{data.score}</div>
          <div className="text-[#555] text-[10px] uppercase">Score</div>
        </div>
        <div className="text-center">
          <Dumbbell className="w-5 h-5 text-[#22C55E] mx-auto mb-1" />
          <div className="text-white text-lg font-bold">1</div>
          <div className="text-[#555] text-[10px] uppercase">Drill</div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <div className="text-[#444] text-[9px]">shotiqai.com</div>
        <div className="w-10 h-10 rounded-lg overflow-hidden">
          <img 
            src="/images/ShotIQ Logo Gredient.png" 
            alt="ShotIQ" 
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </div>
  )
}

// Card 6: Weekly Summary Card
function WeeklySummaryCardContent({ data }: { data: UserData }) {
  return (
    <div className="relative w-full bg-gradient-to-br from-[#0a0a0a] via-[#0a0a1a] to-[#0a0a0a] rounded-2xl overflow-hidden p-5 flex flex-col min-h-[400px]">
      <NoiseOverlay />
      <ShotIQWatermark />
      
      {/* Glow effect - using radial gradient instead of blur for html2canvas compatibility */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 30%, rgba(139, 92, 246, 0.03) 50%, transparent 70%)'
        }}
      />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <span className="text-[#8B5CF6] text-[10px] font-bold tracking-wider">WEEKLY</span>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            <ShotIQLogoIcon className="w-4 h-4" />
            <span className="text-white font-semibold text-[10px]">SHOTIQ AI</span>
          </div>
          <span className="text-[#555] text-xs">{data.analysisDate}</span>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-6 relative z-10">
        <BarChart3 className="w-10 h-10 text-[#8B5CF6] mx-auto mb-2" />
        <h2 className="text-white text-xl font-bold">WEEKLY SUMMARY</h2>
        <p className="text-[#888] text-xs">Your performance this week</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-white">{data.totalAnalyses}</div>
          <p className="text-[#888] text-[10px] uppercase tracking-wider">Sessions</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-white">{data.score}</div>
          <p className="text-[#888] text-[10px] uppercase tracking-wider">Avg Score</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-[#22C55E]">+{data.improvement}</div>
          <p className="text-[#888] text-[10px] uppercase tracking-wider">Improved</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-white">{data.totalAnalyses * 5}</div>
          <p className="text-[#888] text-[10px] uppercase tracking-wider">Minutes</p>
        </div>
      </div>

      {/* Improvement Banner */}
      <div className="bg-gradient-to-r from-[#22C55E]/10 to-[#16A34A]/10 rounded-xl p-3 border border-[#22C55E]/30 text-center relative z-10">
        <div className="flex items-center justify-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#22C55E]" />
          <span className="text-[#22C55E] font-bold text-sm">Great Progress!</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between relative z-10 pt-4">
        <div className="text-[#444] text-[9px]">shotiqai.com</div>
        <div className="w-10 h-10 rounded-lg overflow-hidden">
          <img 
            src="/images/ShotIQ Logo Gredient.png" 
            alt="ShotIQ" 
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </div>
  )
}

// Card 7: Milestone Card
function MilestoneCardContent({ data }: { data: UserData }) {
  return (
    <div className="relative w-full bg-gradient-to-br from-[#0a0a0a] via-[#1a1a0a] to-[#0a0a0a] rounded-2xl overflow-hidden flex flex-col items-center justify-center p-6 min-h-[400px]">
      <NoiseOverlay />
      <ShotIQWatermark />
      
      {/* Glow effect - using radial gradient instead of blur for html2canvas compatibility */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.1) 30%, rgba(245, 158, 11, 0.03) 50%, transparent 70%)'
        }}
      />
      
      {/* Header */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
        <div className="flex items-center gap-1">
          <ShotIQLogoIcon className="w-4 h-4" />
          <span className="text-white font-semibold text-[10px]">SHOTIQ AI</span>
        </div>
        <span className="text-[#555] text-xs">{data.analysisDate}</span>
      </div>

      {/* Trophy */}
      <div className="relative z-10 mb-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#F59E0B]/20 to-[#D97706]/20 border-2 border-[#F59E0B]/50 flex items-center justify-center">
          <Medal className="w-12 h-12 text-[#F59E0B]" />
        </div>
      </div>

      {/* Milestone Text */}
      <div className="text-center relative z-10">
        <div className="text-[#F59E0B] text-[10px] font-bold tracking-[0.3em] mb-2 uppercase">
          Milestone Reached
        </div>
        <h2 className="text-white text-2xl font-bold mb-1 uppercase">Top {100 - data.percentile}%</h2>
        <p className="text-[#F59E0B] text-lg font-bold uppercase">of all shooters!</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 relative z-10">
        <div className="text-center">
          <div className="text-lg font-black text-white">Top {100 - data.percentile}%</div>
          <p className="text-[#888] text-[10px] uppercase">Ranking</p>
        </div>
        <div className="text-center">
          <div className="text-lg font-black text-[#FF6B35]">{data.totalXP}</div>
          <p className="text-[#888] text-[10px] uppercase">Total XP</p>
        </div>
        <div className="text-center">
          <div className="text-lg font-black text-[#D4AF37]">Lv.{data.level}</div>
          <p className="text-[#888] text-[10px] uppercase">Level</p>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <div className="text-[#444] text-[9px]">shotiqai.com</div>
        <div className="w-10 h-10 rounded-lg overflow-hidden">
          <img 
            src="/images/ShotIQ Logo Gredient.png" 
            alt="ShotIQ" 
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </div>
  )
}

// Card 8: Image Upload Card (NEW)
function ImageUploadCardContent({ data }: { data: UserData }) {
  return (
    <div className="relative w-full bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] rounded-2xl overflow-hidden p-5 flex flex-col min-h-[400px]">
      <NoiseOverlay />
      <ShotIQWatermark />
      
      {/* Glow effect - using radial gradient instead of blur for html2canvas compatibility */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.1) 30%, rgba(34, 197, 94, 0.03) 50%, transparent 70%)'
        }}
      />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <span className="text-[#22C55E] text-[10px] font-bold tracking-wider">SHOT ANALYSIS</span>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            <ShotIQLogoIcon className="w-4 h-4" />
            <span className="text-white font-semibold text-[10px]">SHOTIQ AI</span>
          </div>
          <span className="text-[#555] text-xs">{data.analysisDate}</span>
        </div>
      </div>

      {/* Image Preview */}
      <div className="grid grid-cols-2 gap-2 mb-4 relative z-10">
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1a1a1a] border border-[#2a2a2a]">
          {data.imageBase64 ? (
            <Image src={data.imageBase64} alt="Original" fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <ImageIcon className="w-8 h-8 text-[#444] mb-2" />
              <p className="text-[#666] text-xs">Original</p>
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[9px] text-white">Original</div>
        </div>
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1a1a1a] border border-[#2a2a2a]">
          {data.skeletonBase64 ? (
            <Image src={data.skeletonBase64} alt="Analysis" fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Target className="w-8 h-8 text-[#444] mb-2" />
              <p className="text-[#666] text-xs">Skeleton</p>
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[9px] text-white">Analysis</div>
        </div>
      </div>

      {/* Angle Measurements */}
      <div className="bg-[#1a1a1a] rounded-xl p-3 border border-[#2a2a2a] relative z-10">
        <h4 className="text-[#FF6B35] text-[10px] font-bold uppercase tracking-wider mb-2">Angle Measurements</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex justify-between items-center">
            <span className="text-[#888] text-xs">Elbow</span>
            <span className="text-white text-sm font-bold">{Math.round(data.metrics.elbowAngle)}°</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#888] text-xs">Knee</span>
            <span className="text-white text-sm font-bold">{Math.round(data.metrics.kneeAlignment)}°</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#888] text-xs">Release</span>
            <span className="text-white text-sm font-bold">{Math.round(data.metrics.releasePoint)}°</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#888] text-xs">Arc</span>
            <span className="text-white text-sm font-bold">{Math.round(data.metrics.arcTrajectory)}°</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between relative z-10 pt-4">
        <p className="text-[#FF6B35] text-xs font-medium">Share your shooting form analysis!</p>
        <div className="w-10 h-10 rounded-lg overflow-hidden">
          <img 
            src="/images/ShotIQ Logo Gredient.png" 
            alt="ShotIQ" 
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </div>
  )
}

// Card 9: Video Upload Card (NEW)
function VideoUploadCardContent({ data }: { data: UserData }) {
  const phases = data.videoPhases || ['Setup', 'Load', 'Release', 'Follow']
  
  return (
    <div className="relative w-full bg-gradient-to-br from-[#0a0a0a] via-[#0a0a1a] to-[#0a0a0a] rounded-2xl overflow-hidden p-5 flex flex-col min-h-[400px]">
      <NoiseOverlay />
      <ShotIQWatermark />
      
      {/* Glow effect - using radial gradient instead of blur for html2canvas compatibility */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 30%, rgba(139, 92, 246, 0.03) 50%, transparent 70%)'
        }}
      />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <span className="text-[#8B5CF6] text-[10px] font-bold tracking-wider">VIDEO</span>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            <ShotIQLogoIcon className="w-4 h-4" />
            <span className="text-white font-semibold text-[10px]">SHOTIQ AI</span>
          </div>
          <span className="text-[#555] text-xs">{data.analysisDate}</span>
        </div>
      </div>

      {/* Video Frames Preview */}
      <div className="grid grid-cols-4 gap-1.5 mb-4 relative z-10">
        {data.videoFrames && data.videoFrames.length > 0 ? (
          data.videoFrames.slice(0, 4).map((frame, i) => (
            <div key={i} className="relative aspect-[3/4] rounded-lg overflow-hidden bg-[#1a1a1a] border border-[#2a2a2a]">
              <Image src={frame} alt={`Frame ${i + 1}`} fill className="object-cover" />
              <div className="absolute bottom-1 left-1 bg-black/60 px-1 py-0.5 rounded text-[7px] text-white">{phases[i]}</div>
            </div>
          ))
        ) : (
          phases.map((phase, i) => (
            <div key={i} className="relative aspect-[3/4] rounded-lg overflow-hidden bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
              <div className="text-center">
                <Play className="w-5 h-5 text-[#444] mx-auto mb-1" />
                <p className="text-[#666] text-[7px]">{phase}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Video Info */}
      <div className="bg-[#1a1a1a] rounded-xl p-3 border border-[#2a2a2a] relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-[#8B5CF6]" />
            <span className="text-white font-bold text-sm">VIDEO ANALYSIS</span>
          </div>
          <span className="text-[#888] text-xs">{data.videoDuration ? `${data.videoDuration.toFixed(1)}s` : '--'}</span>
        </div>
        
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-[#888] text-xs">Phases Detected</span>
            <span className="text-white text-xs font-bold">{phases.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#888] text-xs">Frame Rate</span>
            <span className="text-white text-xs font-bold">30 FPS</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between relative z-10 pt-4">
        <p className="text-[#8B5CF6] text-xs font-medium">Share your video breakdown!</p>
        <div className="w-10 h-10 rounded-lg overflow-hidden">
          <img 
            src="/images/ShotIQ Logo Gredient.png" 
            alt="ShotIQ" 
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </div>
  )
}

// Card 10: Progress Card (NEW)
function ProgressCardContent({ data }: { data: UserData }) {
  const startScore = Math.max(50, data.score - data.improvement - 10)
  
  return (
    <div className="relative w-full bg-gradient-to-br from-[#0a0a0a] via-[#0a1a0a] to-[#0a0a0a] rounded-2xl overflow-hidden p-5 flex flex-col min-h-[400px]">
      <NoiseOverlay />
      <ShotIQWatermark />
      
      {/* Glow effect - using radial gradient instead of blur for html2canvas compatibility */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.1) 30%, rgba(34, 197, 94, 0.03) 50%, transparent 70%)'
        }}
      />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <span className="text-[#22C55E] text-[10px] font-bold tracking-wider">PROGRESS</span>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            <ShotIQLogoIcon className="w-4 h-4" />
            <span className="text-white font-semibold text-[10px]">SHOTIQ AI</span>
          </div>
          <span className="text-[#555] text-xs">{data.analysisDate}</span>
        </div>
      </div>

      {/* Progress Header */}
      <div className="text-center mb-6 relative z-10">
        <TrendingUp className="w-10 h-10 text-[#22C55E] mx-auto mb-2" />
        <h2 className="text-white text-xl font-bold">YOUR PROGRESS</h2>
        <p className="text-[#22C55E] text-lg font-bold uppercase">+{data.improvement} Points Improved!</p>
      </div>

      {/* Before/After */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="text-center flex-1">
          <div className="text-3xl font-black text-[#888]">{startScore}</div>
          <p className="text-[#666] text-[10px] uppercase tracking-wider">First Session</p>
        </div>
        
        <div className="px-3">
          <ArrowRight className="w-6 h-6 text-[#22C55E]" />
        </div>
        
        <div className="text-center flex-1">
          <div className="text-3xl font-black text-[#22C55E]">{data.score}</div>
          <p className="text-[#666] text-[10px] uppercase tracking-wider">Latest</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-[#1a1a1a] rounded-xl p-3 border border-[#2a2a2a] relative z-10">
        <div className="flex justify-between text-xs text-[#888] mb-2">
          <span>Improvement</span>
          <span>+{data.improvement} pts</span>
        </div>
        <div className="h-3 bg-[#2a2a2a] rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-[#22C55E] to-[#16A34A]"
            style={{ width: `${Math.min(100, (data.improvement / 40) * 100)}%` }}
          />
        </div>
      </div>

      {/* Sessions */}
      <div className="bg-gradient-to-r from-[#FF6B35]/10 to-[#FF4500]/10 rounded-xl p-3 border border-[#FF6B35]/30 text-center mt-4 relative z-10">
        <span className="text-[#FF6B35] font-bold">{data.totalAnalyses} sessions</span>
        <span className="text-[#888]"> of dedicated practice</span>
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between relative z-10 pt-4">
        <p className="text-[#22C55E] text-xs font-medium">Share your progress!</p>
        <div className="w-10 h-10 rounded-lg overflow-hidden">
          <img 
            src="/images/ShotIQ Logo Gredient.png" 
            alt="ShotIQ" 
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </div>
  )
}

// ============================================
// SHARE CARD WRAPPER WITH SWIPE
// ============================================

interface ShareCardProps {
  card: ShareCardData
  userData: UserData
  dragX: number
}

function ShareCard({ card, userData, dragX }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [arrowTop, setArrowTop] = useState(50)
  
  // Track scroll position for sticky arrows
  useEffect(() => {
    const cardElement = cardRef.current
    if (!cardElement) return
    
    const handleScroll = () => {
      const rect = cardElement.getBoundingClientRect()
      const cardHeight = rect.height
      const visibleTop = Math.max(0, -rect.top)
      const visibleBottom = Math.min(cardHeight, window.innerHeight - rect.top)
      const visibleCenter = (visibleTop + visibleBottom) / 2
      const percentage = (visibleCenter / cardHeight) * 100
      setArrowTop(Math.max(20, Math.min(80, percentage)))
    }
    
    cardElement.addEventListener('scroll', handleScroll)
    window.addEventListener('scroll', handleScroll)
    handleScroll()
    
    return () => {
      cardElement.removeEventListener('scroll', handleScroll)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])
  
  const showShare = dragX > 60
  const showSkip = dragX < -60
  
  // Render card content based on type
  const renderCardContent = () => {
    switch (card.type) {
      case 'latest_analysis':
        return <AnalysisCardContent data={userData} />
      case 'badge_unlock':
        return <AchievementCardContent data={userData} />
      case 'streak':
        return <StreakCardContent data={userData} />
      case 'elite_comparison':
        return <ComparisonCardContent data={userData} />
      case 'workout_complete':
        return <WorkoutCardContent data={userData} />
      case 'weekly_summary':
        return <WeeklySummaryCardContent data={userData} />
      case 'milestone':
        return <MilestoneCardContent data={userData} />
      case 'image_upload':
        return <ImageUploadCardContent data={userData} />
      case 'video_upload':
        return <VideoUploadCardContent data={userData} />
      case 'progress':
        return <ProgressCardContent data={userData} />
      default:
        return null
    }
  }
  
  return (
    <div className="relative">
      {/* Swipe Indicators */}
      {showShare && (
        <div className="absolute -top-2 -right-2 z-20 bg-green-500 text-white px-4 py-2 rounded-full font-bold text-sm transform rotate-12 shadow-lg">
          Share! ✓
        </div>
      )}
      {showSkip && (
        <div className="absolute -top-2 -left-2 z-20 bg-blue-500 text-white px-4 py-2 rounded-full font-bold text-sm transform -rotate-12 shadow-lg">
          Skip →
        </div>
      )}
      
      {/* Card with scroll-following swipe indicators */}
      <div ref={cardRef} className="bg-[#0d0d0d] rounded-3xl border-2 border-[#FF6B35]/50 overflow-hidden shadow-2xl relative">
        {/* Left Swipe Indicator */}
        <div 
          className="z-10 flex items-center gap-0 pointer-events-none transition-all duration-150"
          style={{ 
            opacity: dragX < 0 ? Math.min(0.9, 0.2 + Math.abs(dragX) / 150) : 0.2,
            transform: `translateY(-50%) translateX(${dragX < 0 ? Math.max(-8, dragX / 15) : 0}px)`,
            position: 'absolute',
            left: 0,
            top: `${arrowTop}%`,
            height: 'fit-content'
          }}
        >
          <svg width="70" height="70" viewBox="0 0 70 70">
            <path d="M32 5 L5 35 L32 65" stroke={dragX < -20 ? "#3b82f6" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="1" className="transition-all duration-150" />
            <path d="M50 5 L23 35 L50 65" stroke={dragX < -20 ? "#3b82f6" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="1" className="transition-all duration-150" />
            <path d="M18 5 L-9 35 L18 65" stroke={dragX < -20 ? "#3b82f6" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" className="transition-all duration-150" />
            <path d="M36 5 L9 35 L36 65" stroke={dragX < -20 ? "#3b82f6" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" className="transition-all duration-150" />
            <path d="M46 5 L19 35 L46 65" stroke={dragX < -20 ? "#3b82f6" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" className="transition-all duration-150" />
            <path d="M64 5 L37 35 L64 65" stroke={dragX < -20 ? "#3b82f6" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" className="transition-all duration-150" />
          </svg>
          <svg width="100" height="40" viewBox="0 0 100 40" className="-ml-2">
            <text 
              x="50" 
              y="30" 
              textAnchor="middle" 
              fontSize="24" 
              fontWeight="400" 
              fontFamily="Russo One, Arial Black, sans-serif"
              fill="none" 
              stroke={dragX < -20 ? "#3b82f6" : "white"}
              strokeWidth="1.5"
              letterSpacing="3"
              className="transition-all duration-150"
            >
              SWIPE
            </text>
          </svg>
        </div>
        
        {/* Right Swipe Indicator */}
        <div 
          className="z-10 flex items-center gap-0 pointer-events-none transition-all duration-150"
          style={{ 
            opacity: dragX > 0 ? Math.min(0.9, 0.2 + dragX / 150) : 0.2,
            transform: `translateY(-50%) translateX(${dragX > 0 ? Math.min(8, dragX / 15) : 0}px)`,
            position: 'absolute',
            right: 0,
            top: `${arrowTop}%`,
            height: 'fit-content'
          }}
        >
          <svg width="100" height="40" viewBox="0 0 100 40" className="-mr-2">
            <text 
              x="50" 
              y="30" 
              textAnchor="middle" 
              fontSize="24" 
              fontWeight="400" 
              fontFamily="Russo One, Arial Black, sans-serif"
              fill="none" 
              stroke={dragX > 20 ? "#22c55e" : "white"}
              strokeWidth="1.5"
              letterSpacing="3"
              className="transition-all duration-150"
            >
              SWIPE
            </text>
          </svg>
          <svg width="70" height="70" viewBox="0 0 70 70">
            <path d="M38 5 L65 35 L38 65" stroke={dragX > 20 ? "#22c55e" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="1" className="transition-all duration-150" />
            <path d="M20 5 L47 35 L20 65" stroke={dragX > 20 ? "#22c55e" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="1" className="transition-all duration-150" />
            <path d="M52 5 L79 35 L52 65" stroke={dragX > 20 ? "#22c55e" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" className="transition-all duration-150" />
            <path d="M34 5 L61 35 L34 65" stroke={dragX > 20 ? "#22c55e" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" className="transition-all duration-150" />
            <path d="M24 5 L51 35 L24 65" stroke={dragX > 20 ? "#22c55e" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" className="transition-all duration-150" />
            <path d="M6 5 L33 35 L6 65" stroke={dragX > 20 ? "#22c55e" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" className="transition-all duration-150" />
          </svg>
        </div>
        
        {/* Premium Banner */}
        <div className="relative h-24 overflow-hidden" style={{ background: `linear-gradient(135deg, ${card.color}20, #1a1a1a, #1a1a1a)` }}>
          {/* Glowing Orbs Background - using radial gradients instead of blur for html2canvas compatibility */}
          <div className="absolute inset-0 opacity-40 pointer-events-none">
            <div 
              className="absolute -top-8 -left-8 w-28 h-28 rounded-full"
              style={{ background: `radial-gradient(circle, ${card.color}30 0%, ${card.color}15 40%, transparent 70%)` }}
            />
            <div 
              className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full"
              style={{ background: `radial-gradient(circle, ${card.color}30 0%, ${card.color}15 40%, transparent 70%)` }}
            />
          </div>
          
          {/* Large Icon with Glow Effect - using box-shadow instead of blur for html2canvas compatibility */}
          <div className="absolute inset-0 flex items-center justify-end pr-5">
            <div 
              className="relative w-20 h-20 flex items-center justify-center"
              style={{
                borderRadius: '50%',
                boxShadow: `0 0 30px ${card.color}40, 0 0 60px ${card.color}20, 0 0 90px ${card.color}10`
              }}
            >
              <card.icon className="w-20 h-20 opacity-30" style={{ color: card.color }} />
            </div>
          </div>
          
          {/* Title and Subtitle */}
          <div className="absolute inset-0 flex flex-col justify-center pl-5">
            <h3 className="text-white font-black text-lg uppercase tracking-wider">{card.title}</h3>
            <p className="text-xs font-semibold uppercase tracking-wider mt-0.5" style={{ color: card.color }}>{card.subtitle}</p>
          </div>
        </div>
        
        {/* Card Content */}
        <div className="p-4">
          {renderCardContent()}
        </div>
        
        {/* Share Info Footer */}
        <div className="p-3 border-t border-[#2a2a2a] bg-[#0a0a0a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="w-3.5 h-3.5 text-[#888]" />
              <span className="text-[#888] text-[10px]">Swipe right to share</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-3.5 h-3.5 text-[#FF6B35]" />
              <span className="text-[#FF6B35] text-[10px] font-bold">+50 XP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// SOCIAL MEDIA SHARE OPTIONS
// ============================================

interface SocialPlatform {
  name: string
  icon: React.FC
  color: string
  shareUrl: (text: string, url: string) => string
}

// SVG Logo Components for each platform
const InstagramLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
)

const TikTokLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
)

const FacebookLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

const XLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

const LinkedInLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)

const ThreadsLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.33-3.022.88-.732 2.132-1.167 3.627-1.26.98-.06 1.946.007 2.882.199-.09-.785-.397-1.392-.916-1.805-.595-.475-1.487-.737-2.505-.737h-.035c-.94.008-1.713.252-2.297.724-.532.43-.876 1.024-1.021 1.763l-2.018-.428c.222-1.14.772-2.09 1.637-2.828.996-.852 2.3-1.313 3.773-1.335h.047c1.565 0 2.888.434 3.835 1.254.868.752 1.399 1.79 1.578 3.085.496.129.96.289 1.388.479 1.122.498 2.01 1.218 2.64 2.136.723 1.054 1.058 2.327 1.001 3.791-.073 1.877-.754 3.478-2.022 4.76-1.626 1.642-3.911 2.548-6.795 2.695l-.07.001zm-.511-7.27c.61-.033 1.095-.18 1.44-.44.387-.29.632-.717.728-1.27-.6-.1-1.22-.144-1.847-.13-.933.02-1.676.202-2.147.526-.373.256-.566.588-.544.935.017.278.162.527.421.72.329.246.822.384 1.39.384.186 0 .378-.01.559-.025z"/>
  </svg>
)

const YouTubeLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
)

const WhatsAppLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

const SnapchatLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-.809-.329-1.224-.72-1.227-1.153-.015-.36.284-.69.733-.848.165-.06.374-.09.57-.09.12 0 .284.015.434.06.389.12.72.27 1.019.3.3.015.435-.06.494-.104-.008-.18-.015-.359-.03-.539l-.002-.059c-.104-1.628-.23-3.654.299-4.848C7.859 1.07 11.217.793 12.206.793"/>
  </svg>
)

const MessagesLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
    <path d="M7 9h10v2H7zm0-3h10v2H7z"/>
  </svg>
)

const EmailLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
  </svg>
)

const CopyLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
  </svg>
)

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    name: 'Instagram',
    icon: InstagramLogo,
    color: '#E4405F',
    shareUrl: () => `https://www.instagram.com/` // Opens Instagram - user downloads image first
  },
  {
    name: 'TikTok',
    icon: TikTokLogo,
    color: '#000000',
    shareUrl: () => `https://www.tiktok.com/` // Opens TikTok - user downloads image first
  },
  {
    name: 'Facebook',
    icon: FacebookLogo,
    color: '#1877F2',
    shareUrl: (text, url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`
  },
  {
    name: 'X',
    icon: XLogo,
    color: '#000000',
    shareUrl: (text, url) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
  },
  {
    name: 'LinkedIn',
    icon: LinkedInLogo,
    color: '#0A66C2',
    shareUrl: (text, url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
  },
  {
    name: 'Threads',
    icon: ThreadsLogo,
    color: '#000000',
    shareUrl: (text, url) => `https://www.threads.net/intent/post?text=${encodeURIComponent(text + ' ' + url)}`
  },
  {
    name: 'YouTube',
    icon: YouTubeLogo,
    color: '#FF0000',
    shareUrl: () => `https://studio.youtube.com/` // Opens YouTube Studio
  },
  {
    name: 'WhatsApp',
    icon: WhatsAppLogo,
    color: '#25D366',
    shareUrl: (text, url) => `https://api.whatsapp.com/send?text=${encodeURIComponent(text + '\n\n' + url)}`
  },
  {
    name: 'Snapchat',
    icon: SnapchatLogo,
    color: '#FFFC00',
    shareUrl: () => `https://www.snapchat.com/` // Opens Snapchat
  },
  {
    name: 'Messages',
    icon: MessagesLogo,
    color: '#34C759',
    shareUrl: (text, url) => `sms:?&body=${encodeURIComponent(text + '\n\n' + url)}`
  },
  {
    name: 'Email',
    icon: EmailLogo,
    color: '#EA4335',
    shareUrl: (text, url) => `mailto:?subject=${encodeURIComponent('Check out my ShotIQ Results!')}&body=${encodeURIComponent(text + '\n\n' + url)}`
  },
  {
    name: 'Copy',
    icon: CopyLogo,
    color: '#FF6B35',
    shareUrl: () => '' // Special case - copies to clipboard
  }
]

// Share Modal Component
function ShareModal({ 
  isOpen, 
  onClose, 
  getShareText, 
  shareUrl,
  onCopySuccess 
}: { 
  isOpen: boolean
  onClose: () => void
  getShareText: (platform?: string) => string
  shareUrl: string
  onCopySuccess: () => void
}) {
  const [copied, setCopied] = useState(false)
  
  if (!isOpen) return null
  
  // Get default text for preview
  const defaultShareText = getShareText()
  
  const handleShare = async (platform: SocialPlatform) => {
    // Get platform-specific text
    const platformKey = platform.name.toLowerCase()
    const shareText = getShareText(platformKey)
    
    if (platform.name === 'Copy') {
      // Copy to clipboard
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        onCopySuccess()
      }
      return
    }
    
    if (platform.name === 'Instagram' || platform.name === 'TikTok' || platform.name === 'Snapchat' || platform.name === 'YouTube') {
      // These platforms don't support direct URL sharing - copy text first, then open platform
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareText)
      }
      // Open the platform
      window.open(platform.shareUrl(shareText, shareUrl), '_blank')
      onClose()
      return
    }
    
    // Open share URL in new window for platforms that support direct sharing
    const url = platform.shareUrl(shareText, shareUrl)
    window.open(url, '_blank', 'width=600,height=500,noopener,noreferrer')
    onClose()
  }
  
  // Group platforms by category
  const socialPlatforms = SOCIAL_PLATFORMS.filter(p => 
    ['Instagram', 'TikTok', 'Facebook', 'X', 'Threads', 'Snapchat'].includes(p.name)
  )
  const professionalPlatforms = SOCIAL_PLATFORMS.filter(p => 
    ['LinkedIn', 'YouTube'].includes(p.name)
  )
  const messagingPlatforms = SOCIAL_PLATFORMS.filter(p => 
    ['WhatsApp', 'Messages', 'Email', 'Copy'].includes(p.name)
  )
  
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] rounded-t-3xl sm:rounded-3xl w-full max-w-lg mx-4 mb-0 sm:mb-4 border border-[#2a2a2a] shadow-2xl overflow-hidden">
        {/* Decorative top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF6B35] to-transparent" />
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF4500] flex items-center justify-center">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Share Your Results</h3>
              <p className="text-[#666] text-xs">Choose a platform to share</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#2a2a2a] flex items-center justify-center text-[#888] hover:text-white hover:bg-[#333] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Social Platforms Section */}
        <div className="p-5">
          <p className="text-[#666] text-[10px] uppercase tracking-wider font-semibold mb-3">Social Media</p>
          <div className="grid grid-cols-6 gap-2">
            {socialPlatforms.map((platform) => {
              const IconComponent = platform.icon
              return (
                <button
                  key={platform.name}
                  onClick={() => handleShare(platform)}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/5 transition-all group"
                >
                  <div 
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-all group-hover:scale-105 group-hover:shadow-lg"
                    style={{ 
                      backgroundColor: platform.color, 
                      color: platform.name === 'Snapchat' ? '#000' : '#fff',
                      boxShadow: `0 4px 12px ${platform.color}30`
                    }}
                  >
                    <IconComponent />
                  </div>
                  <span className="text-[#888] text-[9px] font-medium text-center leading-tight group-hover:text-white transition-colors">
                    {platform.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
        
        {/* Professional Platforms Section */}
        <div className="px-5 pb-4">
          <p className="text-[#666] text-[10px] uppercase tracking-wider font-semibold mb-3">Professional</p>
          <div className="grid grid-cols-6 gap-2">
            {professionalPlatforms.map((platform) => {
              const IconComponent = platform.icon
              return (
                <button
                  key={platform.name}
                  onClick={() => handleShare(platform)}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/5 transition-all group"
                >
                  <div 
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-all group-hover:scale-105 group-hover:shadow-lg"
                    style={{ 
                      backgroundColor: platform.color, 
                      color: '#fff',
                      boxShadow: `0 4px 12px ${platform.color}30`
                    }}
                  >
                    <IconComponent />
                  </div>
                  <span className="text-[#888] text-[9px] font-medium text-center leading-tight group-hover:text-white transition-colors">
                    {platform.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
        
        {/* Messaging Section */}
        <div className="px-5 pb-5 border-t border-[#2a2a2a] pt-4">
          <p className="text-[#666] text-[10px] uppercase tracking-wider font-semibold mb-3">Direct Share</p>
          <div className="grid grid-cols-4 gap-2">
            {messagingPlatforms.map((platform) => {
              const IconComponent = platform.icon
              const isCopy = platform.name === 'Copy'
              return (
                <button
                  key={platform.name}
                  onClick={() => handleShare(platform)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all group ${
                    isCopy && copied ? 'bg-[#22C55E]/20' : 'hover:bg-white/5'
                  }`}
                >
                  <div 
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-all group-hover:scale-105"
                    style={{ 
                      backgroundColor: isCopy && copied ? '#22C55E' : platform.color, 
                      color: '#fff',
                      boxShadow: `0 4px 12px ${isCopy && copied ? '#22C55E' : platform.color}30`
                    }}
                  >
                    {isCopy && copied ? <Check className="w-5 h-5" /> : <IconComponent />}
                  </div>
                  <span className={`text-[9px] font-medium text-center leading-tight transition-colors ${
                    isCopy && copied ? 'text-[#22C55E]' : 'text-[#888] group-hover:text-white'
                  }`}>
                    {isCopy && copied ? 'Copied!' : platform.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
        
        {/* Message Preview */}
        <div className="px-5 pb-5">
          <div className="bg-[#0a0a0a] rounded-xl border border-[#2a2a2a] overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2a2a]">
              <span className="text-[#666] text-[10px] uppercase tracking-wider font-semibold">Message Preview</span>
              <button 
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(defaultShareText)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }
                }}
                className="text-[#FF6B35] text-[10px] font-semibold hover:text-[#FF8F5F] transition-colors flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy Text'}
              </button>
            </div>
            <div className="p-3 max-h-28 overflow-y-auto">
              <p className="text-[#888] text-xs leading-relaxed whitespace-pre-wrap">{defaultShareText}</p>
            </div>
          </div>
        </div>
        
        {/* Safe area for mobile */}
        <div className="h-4 sm:hidden" />
      </div>
    </div>
  )
}

// ============================================
// DOWNLOAD SIZE OPTIONS
// ============================================

interface DownloadSize {
  name: string
  platform: string
  width: number
  height: number
  aspectRatio: string
  icon: React.ElementType
  description: string
}

const DOWNLOAD_SIZES: DownloadSize[] = [
  // Stories / Vertical (9:16)
  {
    name: 'Instagram Story',
    platform: 'Instagram',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    icon: Smartphone,
    description: 'Stories, Reels'
  },
  {
    name: 'TikTok',
    platform: 'TikTok',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    icon: Smartphone,
    description: 'Full screen video'
  },
  {
    name: 'YouTube Shorts',
    platform: 'YouTube',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    icon: Smartphone,
    description: 'Shorts format'
  },
  // Square (1:1)
  {
    name: 'Instagram Post',
    platform: 'Instagram',
    width: 1080,
    height: 1080,
    aspectRatio: '1:1',
    icon: Square,
    description: 'Feed post'
  },
  {
    name: 'Facebook Post',
    platform: 'Facebook',
    width: 1200,
    height: 1200,
    aspectRatio: '1:1',
    icon: Square,
    description: 'Square post'
  },
  // Landscape (16:9)
  {
    name: 'YouTube Thumbnail',
    platform: 'YouTube',
    width: 1280,
    height: 720,
    aspectRatio: '16:9',
    icon: Monitor,
    description: 'Video thumbnail'
  },
  {
    name: 'Twitter/X Post',
    platform: 'Twitter',
    width: 1200,
    height: 675,
    aspectRatio: '16:9',
    icon: Monitor,
    description: 'Timeline image'
  },
  {
    name: 'LinkedIn Post',
    platform: 'LinkedIn',
    width: 1200,
    height: 627,
    aspectRatio: '1.91:1',
    icon: Monitor,
    description: 'Feed post'
  },
  // Portrait (4:5)
  {
    name: 'Instagram Portrait',
    platform: 'Instagram',
    width: 1080,
    height: 1350,
    aspectRatio: '4:5',
    icon: Smartphone,
    description: 'Portrait feed'
  },
  {
    name: 'Threads Post',
    platform: 'Threads',
    width: 1080,
    height: 1350,
    aspectRatio: '4:5',
    icon: Smartphone,
    description: 'Feed post'
  },
  // Pinterest
  {
    name: 'Pinterest Pin',
    platform: 'Pinterest',
    width: 1000,
    height: 1500,
    aspectRatio: '2:3',
    icon: Smartphone,
    description: 'Standard pin'
  },
  // Snapchat
  {
    name: 'Snapchat',
    platform: 'Snapchat',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    icon: Smartphone,
    description: 'Snap/Story'
  }
]

// Download Modal Component
function DownloadModal({ 
  isOpen, 
  onClose,
  userName,
  previewContent
}: { 
  isOpen: boolean
  onClose: () => void
  userName: string
  previewContent: React.ReactNode
}) {
  const [downloading, setDownloading] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'vertical' | 'square' | 'landscape'>('all')
  const [showPreview, setShowPreview] = useState(true)
  
  // Ref for the preview card inside the modal - this is what we'll capture
  const previewCardRef = useRef<HTMLDivElement>(null)
  
  if (!isOpen) return null
  
  const filteredSizes = DOWNLOAD_SIZES.filter(size => {
    if (selectedCategory === 'all') return true
    if (selectedCategory === 'vertical') return size.height > size.width
    if (selectedCategory === 'square') return size.height === size.width
    if (selectedCategory === 'landscape') return size.width > size.height
    return true
  })
  
  const handleDownload = async (size: DownloadSize) => {
    // Capture the preview card that's visible in the modal
    if (!previewCardRef.current) return
    
    setDownloading(size.name)
    
    try {
      // Use html2canvas with proper settings for image capture
      const canvas = await html2canvas(previewCardRef.current, {
        backgroundColor: '#0d0d0d',
        scale: 3, // Higher quality
        useCORS: true,
        allowTaint: true,
        logging: false,
        imageTimeout: 15000, // Wait longer for images
        onclone: (clonedDoc) => {
          // Ensure all styles are applied in the clone
          const clonedElement = clonedDoc.querySelector('[data-download-card]')
          if (clonedElement) {
            (clonedElement as HTMLElement).style.transform = 'none'
          }
        }
      })
      
      // Create a new canvas with the target dimensions
      const targetCanvas = document.createElement('canvas')
      targetCanvas.width = size.width
      targetCanvas.height = size.height
      const ctx = targetCanvas.getContext('2d')
      
      if (ctx) {
        // Fill background
        ctx.fillStyle = '#0d0d0d'
        ctx.fillRect(0, 0, size.width, size.height)
        
        // Calculate scaling to fit the card in the center
        const sourceWidth = canvas.width
        const sourceHeight = canvas.height
        const targetWidth = size.width
        const targetHeight = size.height
        
        // Calculate scale to fit while maintaining aspect ratio
        const scale = Math.min(
          (targetWidth * 0.9) / sourceWidth,
          (targetHeight * 0.85) / sourceHeight
        )
        
        const scaledWidth = sourceWidth * scale
        const scaledHeight = sourceHeight * scale
        
        // Center the card
        const x = (targetWidth - scaledWidth) / 2
        const y = (targetHeight - scaledHeight) / 2
        
        // Draw the card
        ctx.drawImage(canvas, x, y, scaledWidth, scaledHeight)
        
        // Add ShotIQ branding at the bottom
        ctx.fillStyle = '#FF6B35'
        ctx.font = 'bold 24px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('SHOTIQ AI', targetWidth / 2, targetHeight - 40)
        ctx.fillStyle = '#666666'
        ctx.font = '16px Arial'
        ctx.fillText('shotiqai.com', targetWidth / 2, targetHeight - 18)
      }
      
      // Download with unique timestamp
      const timestamp = Date.now()
      const link = document.createElement('a')
      link.download = `ShotIQ-${userName}-${size.platform}-${size.width}x${size.height}-${timestamp}.png`
      link.href = targetCanvas.toDataURL('image/png', 1.0)
      link.click()
      
      setTimeout(() => setDownloading(null), 500)
    } catch (error) {
      console.error('Download failed:', error)
      setDownloading(null)
    }
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#1a1a1a] rounded-t-3xl sm:rounded-3xl w-full max-w-2xl mx-4 mb-0 sm:mb-4 border border-[#333] shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#333]">
          <div>
            <h3 className="text-white font-bold text-lg">Download Card</h3>
            <p className="text-[#888] text-xs">Preview your card and choose a size</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center text-white hover:bg-[#444] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Toggle Preview/Sizes */}
        <div className="flex gap-2 p-4 border-b border-[#333]">
          <button
            onClick={() => setShowPreview(true)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              showPreview
                ? 'bg-[#FF6B35] text-white'
                : 'bg-[#2a2a2a] text-[#888] hover:text-white'
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setShowPreview(false)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              !showPreview
                ? 'bg-[#FF6B35] text-white'
                : 'bg-[#2a2a2a] text-[#888] hover:text-white'
            }`}
          >
            Download Sizes
          </button>
        </div>
        
        {/* Hidden card for capture - always rendered but off-screen when showing sizes */}
        <div 
          ref={previewCardRef}
          data-download-card="true"
          className={showPreview ? "hidden" : "fixed -left-[9999px] -top-[9999px] w-[320px]"}
          style={{ backgroundColor: '#0d0d0d' }}
        >
          {previewContent}
        </div>
        
        {showPreview ? (
          /* Preview Section */
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col items-center">
              {/* Preview Label */}
              <div className="text-[#888] text-xs uppercase tracking-wider mb-3">Card Preview</div>
              
              {/* Card Preview - visible preview */}
              <div 
                className="w-full max-w-[320px]"
                style={{ backgroundColor: '#0d0d0d' }}
              >
                {previewContent}
              </div>
              
              {/* Preview Info */}
              <div className="mt-4 text-center">
                <p className="text-[#22c55e] text-sm font-semibold">✓ This is what will be downloaded</p>
                <p className="text-[#888] text-xs mt-1">Click &quot;Download Sizes&quot; to choose your format</p>
              </div>
              
              {/* Quick Download Button */}
              <button
                onClick={() => setShowPreview(false)}
                className="mt-4 px-6 py-3 bg-[#FF6B35] text-white font-bold rounded-xl hover:bg-[#FF8555] transition-colors"
              >
                Choose Size & Download
              </button>
            </div>
          </div>
        ) : (
          /* Size Options Section */
          <>
            {/* Category Filter */}
            <div className="flex gap-2 p-4 border-b border-[#333]">
              {(['all', 'vertical', 'square', 'landscape'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-[#FF6B35] text-white'
                      : 'bg-[#2a2a2a] text-[#888] hover:text-white'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat === 'vertical' ? '9:16' : cat === 'square' ? '1:1' : '16:9'}
                </button>
              ))}
            </div>
            
            {/* Size Options */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-3">
                {filteredSizes.map((size) => {
                  const Icon = size.icon
                  const isDownloading = downloading === size.name
                  
                  return (
                    <button
                      key={size.name}
                      onClick={() => handleDownload(size)}
                      disabled={isDownloading}
                      className={`flex flex-col items-start p-3 rounded-xl border transition-all text-left ${
                        isDownloading
                          ? 'bg-green-500/20 border-green-500/50'
                          : 'bg-[#0d0d0d] border-[#333] hover:border-[#FF6B35]/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2 w-full">
                        <Icon className={`w-4 h-4 ${isDownloading ? 'text-green-500' : 'text-[#FF6B35]'}`} />
                        <span className="text-white text-sm font-semibold truncate flex-1">{size.name}</span>
                        {isDownloading && <Check className="w-4 h-4 text-green-500" />}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[#666]">
                        <span className="bg-[#2a2a2a] px-1.5 py-0.5 rounded">{size.aspectRatio}</span>
                        <span>{size.width}×{size.height}</span>
                      </div>
                      <p className="text-[#888] text-[10px] mt-1">{size.description}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}
        
        {/* Safe area for mobile */}
        <div className="h-6 sm:hidden" />
      </div>
    </div>
  )
}

// ============================================
// MAIN SHARE CARD GAME COMPONENT
// ============================================

export function ShareCardGame() {
  // Points system
  const { earnPoints } = usePoints()
  const [showPointsBurst, setShowPointsBurst] = useState(false)
  
  // State
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [sharedCards, setSharedCards] = useState<ShareCardType[]>([])
  const [skippedCards, setSkippedCards] = useState<ShareCardType[]>([])
  const [sessions, setSessions] = useState<AnalysisSession[]>([])
  const [copySuccess, setCopySuccess] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [selectedCardForDownload, setSelectedCardForDownload] = useState<ShareCardType | null>(null)
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  
  // Load sessions on mount
  useEffect(() => {
    const loadedSessions = getAllSessions()
    setSessions(loadedSessions)
  }, [])
  
  // Build user data from real sessions or use mock data
  const userData: UserData = useMemo(() => {
    if (sessions.length > 0) {
      const latestSession = sessions[0]
      const allScores = sessions.map(s => s.analysisData.overallScore)
      const avgScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      
      const improvement = sessions.length > 1 
        ? Math.round(latestSession.analysisData.overallScore - sessions[sessions.length - 1].analysisData.overallScore)
        : 0
      
      const userAngles = latestSession.analysisData.angles || {}
      let bestMatch = { name: 'Klay Thompson', similarity: 85, image: '/elite-shooters/placeholder.jpg' }
      
      if (ALL_ELITE_SHOOTERS.length > 0) {
        const shooter = ALL_ELITE_SHOOTERS[Math.floor(Math.random() * Math.min(10, ALL_ELITE_SHOOTERS.length))]
        bestMatch = {
          name: shooter.name,
          similarity: Math.floor(75 + Math.random() * 20),
          image: '/elite-shooters/placeholder.jpg'
        }
      }

      // Find video session
      const videoSession = sessions.find(s => s.mediaType === 'video')

      return {
        name: latestSession.playerName || "Player",
        score: Math.round(latestSession.analysisData.overallScore),
        level: Math.floor(sessions.length / 5) + 1,
        totalXP: sessions.length * 100 + Math.round(avgScore * 10),
        streak: Math.min(sessions.length, 12),
        totalAnalyses: sessions.length,
        improvement: Math.max(0, improvement),
        percentile: Math.min(95, Math.round(latestSession.analysisData.overallScore * 1.1)),
        eliteMatch: bestMatch,
        metrics: {
          elbowAngle: userAngles.right_elbow_angle || userAngles.left_elbow_angle || 90,
          releasePoint: userAngles.release_angle || 52,
          followThrough: userAngles.follow_through_angle || 85,
          kneeAlignment: userAngles.right_knee_angle || userAngles.left_knee_angle || 145,
          arcTrajectory: userAngles.arc_angle || 45
        },
        recentBadge: {
          name: sessions.length >= 10 ? "Dedicated" : sessions.length >= 5 ? "Rising Star" : "First Shot",
          description: sessions.length >= 10 ? "Completed 10+ analyses" : sessions.length >= 5 ? "Completed 5+ analyses" : "First analysis complete",
          tier: (sessions.length >= 10 ? "elite" : sessions.length >= 5 ? "rare" : "standard") as BadgeTier,
          icon: sessions.length >= 10 ? Crown : sessions.length >= 5 ? TrendingUp : Target,
          rarity: sessions.length >= 10 ? 12 : sessions.length >= 5 ? 25 : 95
        },
        analysisDate: latestSession.displayDate || new Date().toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        }),
        imageBase64: latestSession.mainImageBase64,
        skeletonBase64: latestSession.skeletonImageBase64,
        videoFrames: videoSession?.videoData?.annotatedFramesBase64?.slice(0, 4),
        videoDuration: videoSession?.videoData?.duration,
        videoPhases: videoSession?.videoData?.phases?.map(p => p.phase)
      }
    }
    
    // Return mock data if no sessions
    return {
      name: "Kevin",
      score: 87,
      level: 5,
      totalXP: 2450,
      streak: 12,
      totalAnalyses: 47,
      improvement: 15,
      percentile: 92,
      eliteMatch: {
        name: "Klay Thompson",
        similarity: 89,
        image: "/elite-shooters/klay-thompson.jpg"
      },
      metrics: {
        elbowAngle: 94,
        releasePoint: 88,
        followThrough: 91,
        kneeAlignment: 85,
        arcTrajectory: 82
      },
      recentBadge: {
        name: "Sharp Shooter",
        description: "Achieved 90+ score",
        tier: "rare" as BadgeTier,
        icon: Zap,
        rarity: 23
      },
      analysisDate: new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    }
  }, [sessions])
  
  // Generate all 10 shareable cards
  const shareableCards: ShareCardData[] = useMemo(() => {
    return [
      // Original 7 cards
      {
        type: 'latest_analysis' as ShareCardType,
        title: 'LATEST ANALYSIS',
        subtitle: `Score: ${userData.score} • ${userData.analysisDate}`,
        icon: Target,
        color: '#FF6B35',
        available: true,
        data: {}
      },
      {
        type: 'badge_unlock' as ShareCardType,
        title: 'BADGE UNLOCKED',
        subtitle: `${userData.recentBadge.name}`,
        icon: Trophy,
        color: '#D4AF37',
        available: true,
        data: {}
      },
      {
        type: 'streak' as ShareCardType,
        title: `${userData.streak}-DAY STREAK`,
        subtitle: 'Practicing every day!',
        icon: Flame,
        color: '#FF4500',
        available: userData.streak > 0,
        data: {}
      },
      {
        type: 'elite_comparison' as ShareCardType,
        title: 'ELITE MATCH',
        subtitle: `${userData.eliteMatch.similarity}% similar to ${userData.eliteMatch.name}`,
        icon: Users,
        color: '#D4AF37',
        available: true,
        data: {}
      },
      {
        type: 'workout_complete' as ShareCardType,
        title: 'WORKOUT COMPLETE',
        subtitle: 'Form Perfection Drill • 25min',
        icon: Dumbbell,
        color: '#22C55E',
        available: true,
        data: {}
      },
      {
        type: 'weekly_summary' as ShareCardType,
        title: 'WEEKLY SUMMARY',
        subtitle: `${userData.totalAnalyses} analyses • +${userData.improvement}pts improved`,
        icon: BarChart3,
        color: '#8B5CF6',
        available: true,
        data: {}
      },
      {
        type: 'milestone' as ShareCardType,
        title: 'MILESTONE REACHED',
        subtitle: `Top ${100 - userData.percentile}% of all shooters!`,
        icon: Medal,
        color: '#F59E0B',
        available: true,
        data: {}
      },
      // 3 NEW cards
      {
        type: 'image_upload' as ShareCardType,
        title: 'SHOT ANALYSIS',
        subtitle: 'Your Form Breakdown',
        icon: Camera,
        color: '#22C55E',
        available: true,
        data: {}
      },
      {
        type: 'video_upload' as ShareCardType,
        title: 'VIDEO ANALYSIS',
        subtitle: 'Frame-by-Frame Breakdown',
        icon: Video,
        color: '#8B5CF6',
        available: true,
        data: {}
      },
      {
        type: 'progress' as ShareCardType,
        title: 'YOUR PROGRESS',
        subtitle: `+${userData.improvement} points improved`,
        icon: TrendingUp,
        color: '#22C55E',
        available: true,
        data: {}
      }
    ]
  }, [userData])
  
  const currentCard = shareableCards[currentIndex]
  const isComplete = currentIndex >= shareableCards.length
  
  // Drag handlers
  const handleDragStart = useCallback((clientX: number) => {
    setIsDragging(true)
    setStartX(clientX)
  }, [])
  
  const handleDragMove = useCallback((clientX: number) => {
    if (!isDragging) return
    const diff = clientX - startX
    setDragX(diff)
  }, [isDragging, startX])
  
  const handleDragEnd = useCallback(() => {
    if (!isDragging || !currentCard) return
    setIsDragging(false)
    
    if (dragX > 100) {
      setSharedCards(prev => [...prev, currentCard.type])
      setCurrentIndex(prev => prev + 1)
    } else if (dragX < -100) {
      setSkippedCards(prev => [...prev, currentCard.type])
      setCurrentIndex(prev => prev + 1)
    }
    
    setDragX(0)
  }, [isDragging, dragX, currentCard])
  
  // Mouse handlers
  const onMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX)
  const onMouseMove = (e: React.MouseEvent) => handleDragMove(e.clientX)
  const onMouseUp = () => handleDragEnd()
  const onMouseLeave = () => { if (isDragging) handleDragEnd() }
  
  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => handleDragStart(e.touches[0].clientX)
  const onTouchMove = (e: React.TouchEvent) => handleDragMove(e.touches[0].clientX)
  const onTouchEnd = () => handleDragEnd()
  
  // Action handlers
  const handleShare = useCallback(() => {
    if (!currentCard) return
    setSharedCards(prev => [...prev, currentCard.type])
    setCurrentIndex(prev => prev + 1)
  }, [currentCard])
  
  const handleSkip = useCallback(() => {
    if (!currentCard) return
    setSkippedCards(prev => [...prev, currentCard.type])
    setCurrentIndex(prev => prev + 1)
  }, [currentCard])
  
  const handleStartOver = useCallback(() => {
    setCurrentIndex(0)
    setSharedCards([])
    setSkippedCards([])
  }, [])
  
  // State to track current card being rendered for ZIP download
  const [zipRenderCardType, setZipRenderCardType] = useState<ShareCardType | null>(null)
  const zipRenderRef = useRef<HTMLDivElement>(null)
  
  // Download all selected cards as a ZIP file
  const handleDownloadAll = useCallback(async () => {
    if (sharedCards.length === 0) return
    
    setIsDownloadingAll(true)
    setDownloadProgress(0)
    
    // Create a new ZIP file
    const zip = new JSZip()
    const imagesFolder = zip.folder("ShotIQ-Cards")
    
    // Default size for bulk download (Instagram Story - most common)
    const defaultSize = { width: 1080, height: 1920, platform: 'Instagram' }
    
    for (let i = 0; i < sharedCards.length; i++) {
      const cardType = sharedCards[i]
      const card = shareableCards.find(c => c.type === cardType)
      if (!card) continue
      
      setDownloadProgress(i + 1)
      
      // Set the card type to render
      setZipRenderCardType(cardType)
      
      // Wait for React to render the card
      await new Promise(resolve => setTimeout(resolve, 300))
      
      try {
        // Capture the rendered card
        if (!zipRenderRef.current) {
          console.error(`Render ref not available for card ${cardType}`)
          continue
        }
        
        const canvas = await html2canvas(zipRenderRef.current, {
          backgroundColor: '#0d0d0d',
          scale: 3,
          useCORS: true,
          allowTaint: true,
          logging: false,
          imageTimeout: 15000
        })
        
        // Create target canvas with proper dimensions
        const targetCanvas = document.createElement('canvas')
        targetCanvas.width = defaultSize.width
        targetCanvas.height = defaultSize.height
        const ctx = targetCanvas.getContext('2d')
        
        if (ctx) {
          ctx.fillStyle = '#0d0d0d'
          ctx.fillRect(0, 0, defaultSize.width, defaultSize.height)
          
          const scale = Math.min(
            (defaultSize.width * 0.9) / canvas.width,
            (defaultSize.height * 0.85) / canvas.height
          )
          
          const scaledWidth = canvas.width * scale
          const scaledHeight = canvas.height * scale
          const x = (defaultSize.width - scaledWidth) / 2
          const y = (defaultSize.height - scaledHeight) / 2
          
          ctx.drawImage(canvas, x, y, scaledWidth, scaledHeight)
          
          ctx.fillStyle = '#FF6B35'
          ctx.font = 'bold 24px Arial'
          ctx.textAlign = 'center'
          ctx.fillText('SHOTIQ AI', defaultSize.width / 2, defaultSize.height - 40)
          ctx.fillStyle = '#666666'
          ctx.font = '16px Arial'
          ctx.fillText('shotiqai.com', defaultSize.width / 2, defaultSize.height - 18)
        }
        
        // Convert canvas to blob and add to ZIP
        const dataUrl = targetCanvas.toDataURL('image/png', 1.0)
        const base64Data = dataUrl.split(',')[1]
        const fileName = `${String(i + 1).padStart(2, '0')}-${card.title.replace(/\s+/g, '-')}.png`
        imagesFolder?.file(fileName, base64Data, { base64: true })
        
      } catch (error) {
        console.error(`Failed to process card ${cardType}:`, error)
      }
    }
    
    // Clear the render card type
    setZipRenderCardType(null)
    
    // Generate and download the ZIP file
    try {
      const timestamp = new Date().toISOString().slice(0, 10) // YYYY-MM-DD format
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(zipBlob)
      link.download = `ShotIQ-${userData.name}-Cards-${timestamp}.zip`
      link.click()
      
      // Clean up the object URL
      setTimeout(() => URL.revokeObjectURL(link.href), 1000)
    } catch (error) {
      console.error('Failed to generate ZIP file:', error)
    }
    
    setIsDownloadingAll(false)
    setDownloadProgress(0)
  }, [sharedCards, shareableCards, userData])
  
  // Generate share text for social media
  const getShareText = useCallback((platform?: string) => {
    // Create an engaging, shareable message that promotes both the user and the app
    // Character limits: Twitter/X (280), Instagram (2200), TikTok (2200), LinkedIn (3000)
    
    const score = userData.score
    const streak = userData.streak
    const percentile = 100 - userData.percentile
    const appUrl = 'shotiqai.com'
    
    // Performance emoji based on score
    let performanceEmoji = ''
    if (score >= 90) performanceEmoji = '🔥'
    else if (score >= 80) performanceEmoji = '💪'
    else if (score >= 70) performanceEmoji = '📈'
    else performanceEmoji = '🏀'
    
    // Different message variations based on score performance
    let performanceMessage = ''
    if (score >= 90) {
      performanceMessage = `${performanceEmoji} ELITE STATUS! Just scored ${score}/100 on my shooting form analysis!`
    } else if (score >= 80) {
      performanceMessage = `${performanceEmoji} ${score}/100 on my shot analysis! The grind is paying off.`
    } else if (score >= 70) {
      performanceMessage = `${performanceEmoji} Scored ${score}/100 today. Every rep counts!`
    } else {
      performanceMessage = `${performanceEmoji} ${score}/100 - Started my shooting journey. Watch me level up!`
    }
    
    // Streak message if applicable
    const streakMessage = streak > 1 ? `🔥 ${streak} day streak!` : ''
    
    // Ranking message
    const rankMessage = `📊 Top ${percentile}% of shooters analyzed`
    
    // Call to action - promotes the app with URL
    const cta = `🎯 Analyze YOUR shot FREE at ${appUrl}`
    
    // Hashtags - branded + relevant basketball hashtags
    // Short version for Twitter, full version for other platforms
    const shortHashtags = '#ShotIQAI #HoopsLife'
    const fullHashtags = '#ShotIQAI #BasketballTraining #ShootingForm #HoopsLife #WorkOnYourGame #Basketball #BallIsLife'
    
    // Use shorter format for Twitter/X (280 char limit)
    if (platform === 'twitter' || platform === 'x') {
      const twitterMsg = `${performanceMessage}

${streakMessage ? streakMessage + ' | ' : ''}${rankMessage}

${cta}

${shortHashtags}`
      return twitterMsg.length > 280 ? twitterMsg.substring(0, 277) + '...' : twitterMsg
    }
    
    // Full format for other platforms
    return `${performanceMessage}

${streakMessage ? streakMessage + '\n' : ''}${rankMessage}

${cta}

${fullHashtags}`
  }, [userData])
  
  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      const prevCard = shareableCards[currentIndex - 1]
      if (prevCard) {
        setSharedCards(prev => prev.filter(t => t !== prevCard.type))
        setSkippedCards(prev => prev.filter(t => t !== prevCard.type))
      }
    }
  }
  
  const goToNext = () => {
    if (currentIndex < shareableCards.length - 1) {
      setCurrentIndex(prev => prev + 1)
      // Award +2 points for share card swipe
      earnPoints('share_card_swipe')
      setShowPointsBurst(true)
      setTimeout(() => setShowPointsBurst(false), 1500)
    }
  }
  
  // Render a specific card for download - includes full card structure with banner and border
  const renderDownloadCard = (cardType: ShareCardType) => {
    const card = shareableCards.find(c => c.type === cardType)
    if (!card) return null
    
    // Render the inner content based on type
    const renderContent = () => {
      switch (cardType) {
        case 'latest_analysis':
          return <AnalysisCardContent data={userData} />
        case 'badge_unlock':
          return <AchievementCardContent data={userData} />
        case 'streak':
          return <StreakCardContent data={userData} />
        case 'elite_comparison':
          return <ComparisonCardContent data={userData} />
        case 'workout_complete':
          return <WorkoutCardContent data={userData} />
        case 'weekly_summary':
          return <WeeklySummaryCardContent data={userData} />
        case 'milestone':
          return <MilestoneCardContent data={userData} />
        case 'image_upload':
          return <ImageUploadCardContent data={userData} />
        case 'video_upload':
          return <VideoUploadCardContent data={userData} />
        case 'progress':
          return <ProgressCardContent data={userData} />
        default:
          return null
      }
    }
    
    // Get the appropriate SVG icon based on card type
    const getCardIcon = () => {
      // Inline SVG icons that render properly in html2canvas
      switch (card.type) {
        case 'streak':
          // Flame icon
          return (
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={card.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
            </svg>
          )
        case 'latest_analysis':
          // Target icon
          return (
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={card.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
              <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
            </svg>
          )
        case 'badge_unlock':
          // Trophy icon
          return (
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={card.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
            </svg>
          )
        case 'elite_comparison':
          // Users icon
          return (
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={card.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          )
        default:
          // Star icon as default
          return (
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={card.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          )
      }
    }
    
    // Return the full card structure matching ShareCard component
    return (
      <div className="bg-[#0d0d0d] rounded-3xl border-2 border-[#FF6B35]/50 overflow-hidden shadow-2xl">
        {/* Premium Banner - matches the app card exactly */}
        <div className="relative h-24 overflow-hidden" style={{ background: `linear-gradient(135deg, ${card.color}20, #1a1a1a, #1a1a1a)` }}>
          {/* Glowing Orbs Background - using radial gradients instead of blur for html2canvas compatibility */}
          <div className="absolute inset-0 opacity-40 pointer-events-none">
            <div 
              className="absolute -top-8 -left-8 w-28 h-28 rounded-full"
              style={{ background: `radial-gradient(circle, ${card.color}30 0%, ${card.color}15 40%, transparent 70%)` }}
            />
            <div 
              className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full"
              style={{ background: `radial-gradient(circle, ${card.color}30 0%, ${card.color}15 40%, transparent 70%)` }}
            />
          </div>
          
          {/* Large Icon with Glow Effect - using box-shadow instead of blur for html2canvas compatibility */}
          <div className="absolute inset-0 flex items-center justify-end pr-5">
            <div 
              className="relative w-20 h-20 flex items-center justify-center"
              style={{
                borderRadius: '50%',
                boxShadow: `0 0 30px ${card.color}40, 0 0 60px ${card.color}20, 0 0 90px ${card.color}10`
              }}
            >
              {getCardIcon()}
            </div>
          </div>
          
          {/* Title and Subtitle */}
          <div className="absolute inset-0 flex flex-col justify-center pl-5">
            <h3 className="text-white font-black text-lg uppercase tracking-wider">{card.title}</h3>
            <p className="text-xs font-semibold uppercase tracking-wider mt-0.5" style={{ color: card.color }}>{card.subtitle}</p>
          </div>
        </div>
        
        {/* Card Content */}
        <div className="p-4">
          {renderContent()}
        </div>
        
        {/* Download Footer - Different from swipe footer */}
        <div className="p-3 border-t border-[#2a2a2a] bg-[#0a0a0a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 flex items-center justify-center">
                <img 
                  src="/images/ShotIQ Logo Gredient.png" 
                  alt="ShotIQ" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <span className="text-[#FF6B35] text-[10px] font-bold">SHOTIQ AI</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#888] text-[10px]">shotiqai.com</span>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <>
      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        getShareText={getShareText}
        shareUrl={typeof window !== 'undefined' ? window.location.origin : 'https://shotiqai.com'}
        onCopySuccess={() => {
          setCopySuccess(true)
          setTimeout(() => setCopySuccess(false), 2000)
        }}
      />
      
      {/* Download Modal */}
      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => {
          setShowDownloadModal(false)
          setSelectedCardForDownload(null)
        }}
        userName={userData.name}
        previewContent={selectedCardForDownload ? renderDownloadCard(selectedCardForDownload) : null}
      />
      
      {/* Hidden container for ZIP download rendering */}
      {zipRenderCardType && (
        <div 
          style={{ 
            position: 'fixed', 
            left: '-9999px', 
            top: '-9999px', 
            width: '320px',
            backgroundColor: '#0d0d0d'
          }}
        >
          <div ref={zipRenderRef}>
            {renderDownloadCard(zipRenderCardType)}
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-black text-xl uppercase tracking-wider">Share</h2>
            <p className="text-[#FF6B35] text-sm font-semibold uppercase tracking-wider mt-1">Choose What to Share</p>
          </div>
          
          {(currentIndex > 0 || sharedCards.length > 0) && (
            <button
              onClick={handleStartOver}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-xl text-[#888] hover:text-white hover:border-[#FF6B35]/50 transition-all whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-sm font-semibold">Reset</span>
            </button>
          )}
        </div>
      
      {/* Progress Dots */}
      <div className="flex items-center justify-center gap-2">
        {shareableCards.map((card, i) => (
          <div
            key={card.type}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentIndex
                ? 'bg-[#FF6B35] w-6'
                : i < currentIndex
                  ? sharedCards.includes(card.type)
                    ? 'bg-green-500'
                    : 'bg-blue-500'
                  : 'bg-[#333]'
            }`}
          />
        ))}
      </div>
      
      {/* Card Area */}
      {!isComplete ? (
        <div
          className="relative cursor-grab active:cursor-grabbing"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            transform: `translateX(${dragX}px) rotate(${dragX * 0.02}deg)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out'
          }}
        >
          {/* GOLD Video Game Style Points Animation */}
          <InlinePointsBurst points={2} show={showPointsBurst} label="IQ" />
          <ShareCard
            card={currentCard}
            userData={userData}
            dragX={dragX}
          />
        </div>
      ) : (
        // Completion Screen
        <div className="bg-[#0d0d0d] rounded-3xl border-2 border-[#FF6B35]/50 p-6 text-center">
          <Sparkles className="w-12 h-12 text-[#FF6B35] mx-auto mb-3" />
          <h3 className="text-white text-xl font-black mb-1 uppercase tracking-wide">All Done!</h3>
          <p className="text-[#888] text-sm mb-4">You&apos;ve selected {sharedCards.length} card{sharedCards.length !== 1 ? 's' : ''} to share</p>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-[#1a1a1a] rounded-xl p-3 border border-green-500/30">
              <div className="text-2xl font-black text-green-500">{sharedCards.length}</div>
              <p className="text-[#888] text-[10px] uppercase">Selected</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-3 border border-blue-500/30">
              <div className="text-2xl font-black text-blue-500">{skippedCards.length}</div>
              <p className="text-[#888] text-[10px] uppercase">Skipped</p>
            </div>
          </div>
          
          {/* Selected Cards Preview - Click to Download */}
          {sharedCards.length > 0 && (
            <div className="mb-4">
              <p className="text-[#666] text-xs uppercase tracking-wider mb-2">Tap a card to download as image</p>
              <div className="flex flex-wrap justify-center gap-2">
                {sharedCards.map((cardType) => {
                  const card = shareableCards.find(c => c.type === cardType)
                  if (!card) return null
                  const Icon = card.icon
                  return (
                    <button 
                      key={cardType}
                      onClick={() => {
                        setSelectedCardForDownload(cardType)
                        // Small delay to ensure the hidden card renders
                        setTimeout(() => setShowDownloadModal(true), 100)
                      }}
                      className="flex items-center gap-1.5 bg-[#1a1a1a] border border-[#333] rounded-lg px-2 py-1.5 hover:border-[#FF6B35]/50 transition-all group"
                    >
                      <Icon className="w-3 h-3" style={{ color: card.color }} />
                      <span className="text-white text-[10px] font-medium">{card.title}</span>
                      <Download className="w-3 h-3 text-[#666] group-hover:text-[#FF6B35] transition-colors" />
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          
          {/* Share Actions */}
          {sharedCards.length > 0 ? (
            <div className="space-y-3">
              <p className="text-[#888] text-xs">How would you like to share?</p>
              
              {/* Primary Share Button - Opens Social Media Modal */}
              <button
                onClick={() => setShowShareModal(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold uppercase tracking-wider transition-all shadow-lg whitespace-nowrap bg-green-500 hover:bg-green-600 shadow-green-500/30 text-white"
              >
                <Share2 className="w-5 h-5" />
                Share {sharedCards.length} Card{sharedCards.length !== 1 ? 's' : ''}
              </button>
              
              {/* Secondary Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const selectedCardNames = sharedCards.map(type => {
                      const card = shareableCards.find(c => c.type === type)
                      return card?.title || type
                    }).join('\n• ')
                    
                    const text = `🏀 My ShotIQ Stats:\n\n📊 Score: ${userData.score}/100\n🔥 Streak: ${userData.streak} days\n⭐ Level: ${userData.level}\n🏆 Top ${100 - userData.percentile}% of shooters\n\n✅ Achievements:\n• ${selectedCardNames}\n\n👉 Analyze your shot at shotiqai.com`
                    
                    if (typeof navigator !== 'undefined' && navigator.clipboard) {
                      navigator.clipboard.writeText(text).then(() => {
                        setCopySuccess(true)
                        setTimeout(() => setCopySuccess(false), 2000)
                      }).catch(() => {
                        // Fallback for older browsers
                        const textArea = document.createElement('textarea')
                        textArea.value = text
                        document.body.appendChild(textArea)
                        textArea.select()
                        document.execCommand('copy')
                        document.body.removeChild(textArea)
                        setCopySuccess(true)
                        setTimeout(() => setCopySuccess(false), 2000)
                      })
                    }
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
                    copySuccess 
                      ? 'bg-green-500/20 border border-green-500/50 text-green-500'
                      : 'bg-[#1a1a1a] border border-[#333] text-white hover:border-[#FF6B35]/50'
                  }`}
                >
                  {copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copySuccess ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleDownloadAll}
                  disabled={isDownloadingAll}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
                    isDownloadingAll 
                      ? 'bg-[#FF6B35]/20 border border-[#FF6B35]/50 text-[#FF6B35]'
                      : 'bg-[#1a1a1a] border border-[#333] text-white hover:border-[#FF6B35]/50'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  {isDownloadingAll ? `${downloadProgress}/${sharedCards.length}` : 'Download ZIP'}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[#666] text-sm mb-4">No cards selected to share. Swipe right on cards you want to share!</p>
          )}
          
          {/* Restart Button */}
          <button
            onClick={handleStartOver}
            className="mt-4 flex items-center gap-2 text-[#888] hover:text-white py-2 font-medium transition-all mx-auto whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            Start Over
          </button>
        </div>
      )}
      
      {/* Swipe Hint */}
      {!isComplete && (
        <div className="flex items-center justify-center gap-4 text-[#666] text-sm">
          <span className="flex items-center gap-1">
            <ArrowLeft className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400">Skip</span>
          </span>
          <span>Swipe or Tap</span>
          <span className="flex items-center gap-1">
            <span className="text-green-500">Share</span>
            <ArrowRight className="w-4 h-4 text-green-500" />
          </span>
        </div>
      )}
      
      {/* Action Buttons */}
      {!isComplete && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleSkip}
            className="flex-1 bg-transparent border-2 border-blue-500/30 text-blue-400 py-4 rounded-xl font-bold uppercase tracking-wider hover:bg-blue-500/10 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <X className="w-5 h-5" />
            Skip
          </button>
          <button
            onClick={handleShare}
            className="flex-1 bg-transparent border-2 border-green-500/30 text-green-500 py-4 rounded-xl font-bold uppercase tracking-wider hover:bg-green-500/10 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Share2 className="w-5 h-5" />
            Share
          </button>
        </div>
      )}
      
      {/* Navigation */}
      {!isComplete && (
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="text-[#888] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            Prev
          </button>
          <span className="text-[#666] text-sm">
            {currentIndex + 1} of {shareableCards.length}
          </span>
          <button
            onClick={goToNext}
            disabled={currentIndex >= shareableCards.length - 1}
            className="text-[#888] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 whitespace-nowrap"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
      </div>
    </>
  )
}

export default ShareCardGame

