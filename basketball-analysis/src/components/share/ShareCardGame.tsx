"use client"

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react"
import Image from "next/image"
import html2canvas from "html2canvas"
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

// Noise texture overlay
function NoiseOverlay() {
  return (
    <div 
      className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
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
        className="object-cover"
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
            className="w-full h-full object-cover"
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
      
      {/* Glow effect */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#D4AF37]/20 rounded-full blur-3xl" />
      
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
            className="w-full h-full object-cover"
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
      
      {/* Fire glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-t from-[#FF6B35]/30 via-[#FF4500]/20 to-transparent rounded-full blur-3xl" />
      
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
        <div className="w-10 h-10 rounded-lg overflow-hidden">
          <img 
            src="/images/ShotIQ Logo Gredient.png" 
            alt="ShotIQ" 
            className="w-full h-full object-cover"
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
            className="w-full h-full object-cover"
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
      
      {/* Glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#22C55E]/20 rounded-full blur-3xl" />
      
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
            className="w-full h-full object-cover"
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
      
      {/* Glow effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#8B5CF6]/20 rounded-full blur-3xl" />
      
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
            className="w-full h-full object-cover"
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
      
      {/* Glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#F59E0B]/20 rounded-full blur-3xl" />
      
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
            className="w-full h-full object-cover"
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
            className="w-full h-full object-cover"
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
            className="w-full h-full object-cover"
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
            className="w-full h-full object-cover"
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
          {/* Glowing Orbs Background */}
          <div className="absolute inset-0 opacity-40">
            <div className="absolute -top-8 -left-8 w-28 h-28 rounded-full blur-2xl" style={{ backgroundColor: `${card.color}20` }} />
            <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full blur-2xl" style={{ backgroundColor: `${card.color}20` }} />
          </div>
          
          {/* Large Icon with Glow Effect */}
          <div className="absolute inset-0 flex items-center justify-end pr-5">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 blur-xl scale-125 opacity-15" style={{ backgroundColor: card.color }} />
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
  icon: string
  color: string
  shareUrl: (text: string, url: string) => string
}

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    name: 'Instagram',
    icon: '📸',
    color: '#E4405F',
    shareUrl: () => 'instagram://camera' // Instagram requires app - will copy text
  },
  {
    name: 'TikTok',
    icon: '🎵',
    color: '#000000',
    shareUrl: () => 'https://www.tiktok.com/upload' // TikTok doesn't have direct share URL
  },
  {
    name: 'Facebook',
    icon: '📘',
    color: '#1877F2',
    shareUrl: (text, url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`
  },
  {
    name: 'Twitter/X',
    icon: '𝕏',
    color: '#000000',
    shareUrl: (text, url) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
  },
  {
    name: 'LinkedIn',
    icon: '💼',
    color: '#0A66C2',
    shareUrl: (text, url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`
  },
  {
    name: 'Threads',
    icon: '🧵',
    color: '#000000',
    shareUrl: (text) => `https://www.threads.net/intent/post?text=${encodeURIComponent(text)}`
  },
  {
    name: 'YouTube',
    icon: '▶️',
    color: '#FF0000',
    shareUrl: () => 'https://studio.youtube.com/channel/UC/videos/upload' // YouTube requires upload
  },
  {
    name: 'WhatsApp',
    icon: '💬',
    color: '#25D366',
    shareUrl: (text, url) => `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
  },
  {
    name: 'Snapchat',
    icon: '👻',
    color: '#FFFC00',
    shareUrl: () => 'snapchat://camera' // Snapchat requires app
  },
  {
    name: 'Messages',
    icon: '💬',
    color: '#34C759',
    shareUrl: (text, url) => `sms:?body=${encodeURIComponent(text + ' ' + url)}`
  },
  {
    name: 'Email',
    icon: '✉️',
    color: '#888888',
    shareUrl: (text, url) => `mailto:?subject=${encodeURIComponent('Check out my ShotIQ Results!')}&body=${encodeURIComponent(text + '\n\n' + url)}`
  },
  {
    name: 'Copy Link',
    icon: '🔗',
    color: '#FF6B35',
    shareUrl: () => '' // Special case - copies to clipboard
  }
]

// Share Modal Component
function ShareModal({ 
  isOpen, 
  onClose, 
  shareText, 
  shareUrl,
  onCopySuccess 
}: { 
  isOpen: boolean
  onClose: () => void
  shareText: string
  shareUrl: string
  onCopySuccess: () => void
}) {
  if (!isOpen) return null
  
  const handleShare = async (platform: SocialPlatform) => {
    if (platform.name === 'Copy Link') {
      // Copy to clipboard
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareText + '\n\n' + shareUrl)
        onCopySuccess()
        onClose()
      }
      return
    }
    
    if (platform.name === 'Instagram' || platform.name === 'TikTok' || platform.name === 'Snapchat' || platform.name === 'YouTube') {
      // These platforms don't support direct URL sharing - copy text first
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareText)
      }
      // Try to open the app/site
      window.open(platform.shareUrl(shareText, shareUrl), '_blank')
      onClose()
      return
    }
    
    // Open share URL in new window
    const url = platform.shareUrl(shareText, shareUrl)
    window.open(url, '_blank', 'width=600,height=400')
    onClose()
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#1a1a1a] rounded-t-3xl sm:rounded-3xl w-full max-w-md mx-4 mb-0 sm:mb-4 border border-[#333] shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#333]">
          <h3 className="text-white font-bold text-lg">Share to</h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center text-white hover:bg-[#444] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Social Grid */}
        <div className="p-4 grid grid-cols-4 gap-3">
          {SOCIAL_PLATFORMS.map((platform) => (
            <button
              key={platform.name}
              onClick={() => handleShare(platform)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${platform.color}20` }}
              >
                {platform.icon}
              </div>
              <span className="text-white text-[10px] font-medium text-center leading-tight">
                {platform.name}
              </span>
            </button>
          ))}
        </div>
        
        {/* Preview */}
        <div className="p-4 border-t border-[#333]">
          <p className="text-[#666] text-xs mb-2">Preview:</p>
          <div className="bg-[#0d0d0d] rounded-xl p-3 max-h-24 overflow-y-auto">
            <p className="text-[#888] text-xs whitespace-pre-wrap">{shareText.substring(0, 150)}...</p>
          </div>
        </div>
        
        {/* Safe area for mobile */}
        <div className="h-6 sm:hidden" />
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
      // Capture the visible preview card
      const canvas = await html2canvas(previewCardRef.current, {
        backgroundColor: '#0d0d0d',
        scale: 3, // Higher quality for better results
        useCORS: true,
        allowTaint: true,
        logging: false,
        imageTimeout: 0,
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
      
      // Download
      const link = document.createElement('a')
      link.download = `ShotIQ-${userName}-${size.platform}-${size.width}x${size.height}.png`
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
  
  // Generate share text for social media
  const getShareText = useCallback(() => {
    const selectedCardNames = sharedCards.map(type => {
      const card = shareableCards.find(c => c.type === type)
      return card?.title || type
    }).join(', ')
    
    return `🏀 My ShotIQ Results!

📊 Score: ${userData.score}/100
🔥 Streak: ${userData.streak} days
⭐ Level: ${userData.level}
🏆 Top ${100 - userData.percentile}% of shooters

✅ ${sharedCards.length} achievement${sharedCards.length !== 1 ? 's' : ''}: ${selectedCardNames}

Analyze YOUR shot at`
  }, [sharedCards, shareableCards, userData])
  
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
    
    // Return the full card structure matching ShareCard component
    return (
      <div className="bg-[#0d0d0d] rounded-3xl border-2 border-[#FF6B35]/50 overflow-hidden shadow-2xl">
        {/* Premium Banner */}
        <div className="relative h-24 overflow-hidden" style={{ background: `linear-gradient(135deg, ${card.color}20, #1a1a1a, #1a1a1a)` }}>
          {/* Glowing Orbs Background */}
          <div className="absolute inset-0 opacity-40">
            <div className="absolute -top-8 -left-8 w-28 h-28 rounded-full blur-2xl" style={{ backgroundColor: `${card.color}20` }} />
            <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full blur-2xl" style={{ backgroundColor: `${card.color}20` }} />
          </div>
          
          {/* Large Icon with Glow Effect */}
          <div className="absolute inset-0 flex items-center justify-end pr-5">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 blur-xl scale-125 opacity-15" style={{ backgroundColor: card.color }} />
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
          {renderContent()}
        </div>
        
        {/* Download Footer - Different from swipe footer */}
        <div className="p-3 border-t border-[#2a2a2a] bg-[#0a0a0a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src="/images/ShotIQ Logo Gredient.png" 
                alt="ShotIQ" 
                className="w-5 h-5 object-contain"
              />
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
        shareText={getShareText()}
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
                  onClick={() => {
                    // Open download modal with first selected card
                    if (sharedCards.length > 0) {
                      setSelectedCardForDownload(sharedCards[0])
                      setTimeout(() => setShowDownloadModal(true), 100)
                    }
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap bg-[#1a1a1a] border border-[#333] text-white hover:border-[#FF6B35]/50"
                >
                  <Download className="w-4 h-4" />
                  Download
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
