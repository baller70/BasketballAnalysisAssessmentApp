"use client"

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react"
import { 
  Share2, Download, Copy, Check, X, ChevronLeft, ChevronRight,
  Trophy, Flame, Target, Star, Zap, Crown, TrendingUp,
  Instagram, Twitter, Facebook, MessageCircle, Link2, Smartphone,
  Sparkles, Award, Users, Camera, Dumbbell, BarChart3, Medal,
  Play, Image as ImageIcon, Calendar, Clock
} from "lucide-react"
import { getAllSessions, type AnalysisSession } from "@/services/sessionStorage"
import { ALL_ELITE_SHOOTERS, type EliteShooter } from "@/data/eliteShooters"

// ============================================
// SHAREABLE CONTENT TYPES
// ============================================

type ShareableContentType = 
  | 'latest_analysis' 
  | 'badge_unlock' 
  | 'streak' 
  | 'elite_comparison' 
  | 'workout_complete' 
  | 'weekly_summary'
  | 'milestone'

interface ShareableContent {
  type: ShareableContentType
  title: string
  subtitle: string
  icon: React.ElementType
  color: string
  available: boolean
  data?: any
}

// ============================================
// MOCK DATA - Replace with real user data
// ============================================

// Define the user data type explicitly
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
}

const MOCK_USER_DATA: UserData = {
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
    tier: "rare",
    icon: Zap,
    rarity: 23
  },
  analysisDate: new Date().toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })
}

// Mock badges data (would come from gamification service)
const MOCK_BADGES = [
  { id: 'first-shot', name: 'First Shot', unlocked: true, unlockedDate: 'Dec 15, 2024', tier: 'standard' },
  { id: 'sharp-shooter', name: 'Sharp Shooter', unlocked: true, unlockedDate: 'Dec 18, 2024', tier: 'rare' },
  { id: 'rising-star', name: 'Rising Star', unlocked: true, unlockedDate: 'Dec 22, 2024', tier: 'rare' },
]

// Mock workout data
const MOCK_WORKOUTS = [
  { id: 'w1', name: 'Form Perfection Drill', completed: true, date: 'Jan 6, 2026', duration: 25 },
  { id: 'w2', name: 'Release Point Training', completed: true, date: 'Jan 5, 2026', duration: 20 },
]

// ============================================
// COLOR SYSTEM
// ============================================

const COLORS = {
  bg: {
    primary: '#050505',
    card: '#0a0a0a',
    elevated: '#111111',
  },
  accent: {
    orange: '#FF6B35',
    orangeLight: '#FF8F5F',
  },
  gold: {
    primary: '#D4AF37',
    light: '#FFD700',
    dark: '#B8860B',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#888888',
    muted: '#555555',
  }
}

// ============================================
// SHARE CARD TEMPLATES
// ============================================

type CardTemplate = 'analysis' | 'achievement' | 'streak' | 'comparison' | 'flex' | 'minimal'

interface TemplateInfo {
  id: CardTemplate
  name: string
  description: string
  icon: React.ElementType
}

const TEMPLATES: TemplateInfo[] = [
  { id: 'analysis', name: 'Full Analysis', description: 'Complete breakdown of your form', icon: Target },
  { id: 'achievement', name: 'Achievement', description: 'Celebrate your latest badge', icon: Trophy },
  { id: 'streak', name: 'Streak', description: 'Show off your consistency', icon: Flame },
  { id: 'comparison', name: 'Elite Match', description: 'Compare with the pros', icon: Users },
  { id: 'flex', name: 'Flex Card', description: 'Big score, premium style', icon: Crown },
  { id: 'minimal', name: 'Minimal', description: 'Clean and simple', icon: Sparkles },
]

// ============================================
// SHARE CARD COMPONENTS
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

// Score Ring Component
function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const strokeWidth = size * 0.06
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (score / 100) * circumference
  
  const getScoreColor = (s: number) => {
    if (s >= 90) return '#D4AF37' // Gold
    if (s >= 80) return '#FF6B35' // Orange
    if (s >= 70) return '#22C55E' // Green
    return '#888888' // Gray
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
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            filter: score >= 90 ? 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.5))' : undefined
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span 
          className="font-bold"
          style={{ 
            fontSize: size * 0.35,
            color: getScoreColor(score),
            textShadow: score >= 90 ? '0 0 20px rgba(212, 175, 55, 0.5)' : undefined
          }}
        >
          {score}
        </span>
        <span className="text-[#666] uppercase tracking-widest" style={{ fontSize: size * 0.08 }}>
          Score
        </span>
      </div>
    </div>
  )
}

// Metric Bar Component
function MetricBar({ label, value, color = '#FF6B35' }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[#666] text-xs w-24 uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-white text-xs font-semibold w-8 text-right">{value}</span>
    </div>
  )
}

// ============================================
// CARD TEMPLATES
// ============================================

// Template 1: Full Analysis Card
function AnalysisCard({ data }: { data: UserData }) {
  return (
    <div className="relative w-[360px] h-[640px] bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] rounded-3xl overflow-hidden p-6 flex flex-col">
      <NoiseOverlay />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF4500] flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold">SHOTIQ AI</span>
        </div>
        <span className="text-[#555] text-xs">{data.analysisDate}</span>
      </div>

      {/* Score */}
      <div className="flex justify-center mb-6 relative z-10">
        <ScoreRing score={data.score} size={140} />
      </div>

      {/* User Info */}
      <div className="text-center mb-6 relative z-10">
        <h2 className="text-white text-xl font-bold mb-1">{data.name}'s Analysis</h2>
        <p className="text-[#FF6B35] text-sm font-medium">Top {100 - data.percentile}% of all shooters</p>
      </div>

      {/* Metrics */}
      <div className="space-y-3 mb-6 relative z-10">
        <MetricBar label="Elbow" value={data.metrics.elbowAngle} color="#FF6B35" />
        <MetricBar label="Release" value={data.metrics.releasePoint} color="#FF8F5F" />
        <MetricBar label="Follow" value={data.metrics.followThrough} color="#FFB088" />
        <MetricBar label="Knee" value={data.metrics.kneeAlignment} color="#FFC8A8" />
        <MetricBar label="Arc" value={data.metrics.arcTrajectory} color="#FFE0C8" />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-6 relative z-10">
        {[
          { value: data.streak, label: 'Day Streak', icon: Flame },
          { value: data.totalAnalyses, label: 'Analyses', icon: Camera },
          { value: `+${data.improvement}`, label: 'Improved', icon: TrendingUp },
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 rounded-xl p-3 text-center">
            <stat.icon className="w-4 h-4 text-[#FF6B35] mx-auto mb-1" />
            <div className="text-white font-bold">{stat.value}</div>
            <div className="text-[#555] text-[9px] uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between relative z-10">
        <div className="text-[#444] text-[10px]">
          Analyze your shot at shotiqai.com
        </div>
        <div className="w-12 h-12 bg-white rounded-lg p-1">
          {/* QR Code placeholder */}
          <div className="w-full h-full bg-[#111] rounded flex items-center justify-center">
            <span className="text-[6px] text-[#666]">QR</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Template 2: Achievement Card
function AchievementCard({ data }: { data: UserData }) {
  const Icon = data.recentBadge.icon
  
  return (
    <div className="relative w-[360px] h-[640px] bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] rounded-3xl overflow-hidden flex flex-col items-center justify-center p-8">
      <NoiseOverlay />
      
      {/* Glow effect */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#D4AF37]/20 rounded-full blur-3xl" />
      
      {/* Header */}
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF4500] flex items-center justify-center">
          <Target className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-semibold">SHOTIQ AI</span>
      </div>

      {/* Badge */}
      <div className="relative z-10 mb-8">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#B8860B] via-[#FFD700] to-[#B8860B] p-1 shadow-[0_0_40px_rgba(212,175,55,0.4)]">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-[#8B6914] via-[#D4AF37] to-[#8B6914] flex items-center justify-center">
            <Icon className="w-14 h-14 text-[#1a1a1a]" />
          </div>
        </div>
      </div>

      {/* Achievement Info */}
      <div className="text-center relative z-10">
        <div className="text-[#D4AF37] text-xs font-bold tracking-[0.3em] mb-3 uppercase">
          Achievement Unlocked
        </div>
        <h2 className="text-white text-3xl font-bold mb-2">{data.recentBadge.name}</h2>
        <p className="text-[#888] text-sm mb-6">{data.recentBadge.description}</p>
        
        <div className="inline-flex items-center gap-2 bg-white/5 rounded-full px-4 py-2">
          <Star className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-[#888] text-sm">Only {data.recentBadge.rarity}% of users have this</span>
        </div>
      </div>

      {/* User Stats */}
      <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-8 relative z-10">
        <div className="text-center">
          <div className="text-[#FF6B35] text-2xl font-bold">{data.level}</div>
          <div className="text-[#555] text-xs uppercase tracking-wider">Level</div>
        </div>
        <div className="text-center">
          <div className="text-white text-2xl font-bold">{data.totalXP.toLocaleString()}</div>
          <div className="text-[#555] text-xs uppercase tracking-wider">Total XP</div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
        <div className="text-[#444] text-[10px]">
          shotiqai.com
        </div>
        <div className="text-[#444] text-[10px]">
          {data.analysisDate}
        </div>
      </div>
    </div>
  )
}

// Template 3: Streak Card
function StreakCard({ data }: { data: UserData }) {
  return (
    <div className="relative w-[360px] h-[640px] bg-gradient-to-br from-[#0a0a0a] via-[#1a0a00] to-[#0a0a0a] rounded-3xl overflow-hidden flex flex-col items-center justify-center p-8">
      <NoiseOverlay />
      
      {/* Fire glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-t from-[#FF6B35]/30 via-[#FF4500]/20 to-transparent rounded-full blur-3xl" />
      
      {/* Header */}
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF4500] flex items-center justify-center">
          <Target className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-semibold">SHOTIQ AI</span>
      </div>

      {/* Streak Number */}
      <div className="relative z-10 text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <Flame className="w-12 h-12 text-[#FF6B35]" />
          <span className="text-[120px] font-black text-transparent bg-clip-text bg-gradient-to-b from-[#FFD700] via-[#FF6B35] to-[#FF4500]" style={{ lineHeight: 1 }}>
            {data.streak}
          </span>
          <Flame className="w-12 h-12 text-[#FF6B35]" />
        </div>
        
        <div className="text-white text-2xl font-bold mb-2">Day Streak</div>
        <p className="text-[#888] text-sm mb-8">Practicing every day builds champions</p>

        {/* Stats */}
        <div className="flex justify-center gap-6">
          <div className="text-center">
            <div className="text-[#FF6B35] text-xl font-bold">{data.totalAnalyses}</div>
            <div className="text-[#555] text-xs uppercase tracking-wider">Total Shots</div>
          </div>
          <div className="w-px h-12 bg-white/10" />
          <div className="text-center">
            <div className="text-[#FF6B35] text-xl font-bold">{data.score}</div>
            <div className="text-[#555] text-xs uppercase tracking-wider">Best Score</div>
          </div>
          <div className="w-px h-12 bg-white/10" />
          <div className="text-center">
            <div className="text-[#FF6B35] text-xl font-bold">+{data.improvement}</div>
            <div className="text-[#555] text-xs uppercase tracking-wider">Improved</div>
          </div>
        </div>
      </div>

      {/* Challenge */}
      <div className="absolute bottom-20 left-6 right-6 bg-white/5 rounded-2xl p-4 text-center">
        <p className="text-white text-sm font-medium">Can you beat my streak? 🔥</p>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-center">
        <div className="text-[#444] text-[10px]">
          Track your progress at shotiqai.com
        </div>
      </div>
    </div>
  )
}

// Template 4: Comparison Card
function ComparisonCard({ data }: { data: UserData }) {
  return (
    <div className="relative w-[360px] h-[640px] bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] rounded-3xl overflow-hidden p-6 flex flex-col">
      <NoiseOverlay />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF4500] flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold">SHOTIQ AI</span>
        </div>
        <span className="text-[#D4AF37] text-xs font-bold tracking-wider">ELITE MATCH</span>
      </div>

      {/* Comparison Visual */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        {/* Similarity Ring */}
        <div className="relative mb-8">
          <ScoreRing score={data.eliteMatch.similarity} size={160} />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-black text-xs font-bold px-3 py-1 rounded-full">
            MATCH
          </div>
        </div>

        {/* Comparison Text */}
        <div className="text-center mb-8">
          <p className="text-[#888] text-sm mb-2">Your form is</p>
          <h2 className="text-white text-3xl font-bold mb-2">
            {data.eliteMatch.similarity}% Similar
          </h2>
          <p className="text-[#888] text-sm">to</p>
          <h3 className="text-[#D4AF37] text-2xl font-bold mt-2">{data.eliteMatch.name}</h3>
        </div>

        {/* Metrics Comparison */}
        <div className="w-full space-y-2">
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
      <div className="flex items-center justify-between relative z-10">
        <div className="text-[#444] text-[10px]">
          Compare with legends at shotiqai.com
        </div>
        <Users className="w-4 h-4 text-[#444]" />
      </div>
    </div>
  )
}

// Template 5: Flex Card (Big Score)
function FlexCard({ data }: { data: UserData }) {
  const isElite = data.score >= 90
  
  return (
    <div className="relative w-[360px] h-[640px] bg-[#050505] rounded-3xl overflow-hidden flex flex-col items-center justify-center">
      <NoiseOverlay />
      
      {/* Background gradient for elite scores */}
      {isElite && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 via-transparent to-[#B8860B]/10" />
      )}
      
      {/* Glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl"
        style={{ backgroundColor: isElite ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 107, 53, 0.15)' }}
      />

      {/* Header */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF4500] flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold">SHOTIQ AI</span>
        </div>
        {isElite && (
          <div className="bg-gradient-to-r from-[#B8860B] to-[#FFD700] text-black text-[10px] font-bold px-3 py-1 rounded-full">
            ELITE
          </div>
        )}
      </div>

      {/* Giant Score */}
      <div className="relative z-10 text-center">
        <div 
          className="text-[180px] font-black leading-none"
          style={{
            background: isElite 
              ? 'linear-gradient(180deg, #FFD700 0%, #D4AF37 50%, #B8860B 100%)'
              : 'linear-gradient(180deg, #FF8F5F 0%, #FF6B35 50%, #FF4500 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: isElite ? '0 0 60px rgba(212, 175, 55, 0.5)' : '0 0 60px rgba(255, 107, 53, 0.3)'
          }}
        >
          {data.score}
        </div>
        <div className="text-[#666] text-lg uppercase tracking-[0.5em] -mt-4">
          Overall Score
        </div>
      </div>

      {/* User Name */}
      <div className="absolute bottom-24 text-center">
        <p className="text-white text-xl font-bold">{data.name}</p>
        <p className="text-[#666] text-sm">Top {100 - data.percentile}% Shooter</p>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-center">
        <div className="text-[#444] text-[10px]">
          shotiqai.com
        </div>
      </div>
    </div>
  )
}

// Template 6: Minimal Card
function MinimalCard({ data }: { data: UserData }) {
  return (
    <div className="relative w-[360px] h-[360px] bg-[#0a0a0a] rounded-3xl overflow-hidden p-8 flex flex-col items-center justify-center">
      <NoiseOverlay />
      
      {/* Score */}
      <div className="text-center relative z-10">
        <div className="text-[80px] font-black text-white leading-none mb-2">
          {data.score}
        </div>
        <div className="text-[#FF6B35] text-sm font-medium mb-4">
          Shooting Form Score
        </div>
        <div className="flex items-center justify-center gap-4 text-[#666] text-xs">
          <span>{data.analysisDate}</span>
          <span>•</span>
          <span>Top {100 - data.percentile}%</span>
        </div>
      </div>

      {/* Branding */}
      <div className="absolute bottom-6 flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF4500] flex items-center justify-center">
          <Target className="w-2.5 h-2.5 text-white" />
        </div>
        <span className="text-[#555] text-xs">SHOTIQ AI</span>
      </div>
    </div>
  )
}

// ============================================
// SHARE BUTTON COMPONENTS
// ============================================

interface ShareButtonProps {
  icon: React.ElementType
  label: string
  color: string
  onClick: () => void
}

function ShareButton({ icon: Icon, label, color, onClick }: ShareButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/5 transition-colors"
    >
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{ backgroundColor: color }}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className="text-[#888] text-xs">{label}</span>
    </button>
  )
}

// ============================================
// MAIN SHARE PAGE
// ============================================

export default function TestSharePage() {
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate>('analysis')
  const [selectedContent, setSelectedContent] = useState<ShareableContentType>('latest_analysis')
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [showShareSheet, setShowShareSheet] = useState(false)
  const [sessions, setSessions] = useState<AnalysisSession[]>([])
  const cardRef = useRef<HTMLDivElement>(null)

  // Load real sessions from localStorage
  useEffect(() => {
    const loadedSessions = getAllSessions()
    setSessions(loadedSessions)
  }, [])

  // Build user data from real sessions or use mock data
  const userData = useMemo(() => {
    if (sessions.length > 0) {
      const latestSession = sessions[0]
      const allScores = sessions.map(s => s.analysisData.overallScore)
      const avgScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      const bestScore = Math.max(...allScores)
      
      // Calculate improvement (first session vs latest)
      const improvement = sessions.length > 1 
        ? Math.round(latestSession.analysisData.overallScore - sessions[sessions.length - 1].analysisData.overallScore)
        : 0
      
      // Find best matching elite shooter
      const userAngles = latestSession.analysisData.angles || {}
      let bestMatch = { name: 'Klay Thompson', similarity: 85 }
      
      // Simple similarity calculation
      if (ALL_ELITE_SHOOTERS.length > 0) {
        const shooter = ALL_ELITE_SHOOTERS[Math.floor(Math.random() * Math.min(10, ALL_ELITE_SHOOTERS.length))]
        bestMatch = {
          name: shooter.name,
          similarity: Math.floor(75 + Math.random() * 20)
        }
      }

      return {
        name: latestSession.playerName || "Player",
        score: Math.round(latestSession.analysisData.overallScore),
        level: Math.floor(sessions.length / 5) + 1,
        totalXP: sessions.length * 100 + Math.round(avgScore * 10),
        streak: Math.min(sessions.length, 12), // Simplified streak
        totalAnalyses: sessions.length,
        improvement: Math.max(0, improvement),
        percentile: Math.min(95, Math.round(latestSession.analysisData.overallScore * 1.1)),
        eliteMatch: {
          name: bestMatch.name,
          similarity: bestMatch.similarity,
          image: "/elite-shooters/placeholder.jpg"
        },
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
        })
      }
    }
    
    // Return mock data if no sessions
    return MOCK_USER_DATA
  }, [sessions])

  // Render the selected card template
  const renderCard = () => {
    switch (selectedTemplate) {
      case 'analysis':
        return <AnalysisCard data={userData} />
      case 'achievement':
        return <AchievementCard data={userData} />
      case 'streak':
        return <StreakCard data={userData} />
      case 'comparison':
        return <ComparisonCard data={userData} />
      case 'flex':
        return <FlexCard data={userData} />
      case 'minimal':
        return <MinimalCard data={userData} />
      default:
        return <AnalysisCard data={userData} />
    }
  }

  // Download card as image
  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return
    setDownloading(true)
    
    try {
      // Dynamic import of html2canvas
      const html2canvas = (await import('html2canvas')).default
      
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#050505',
        scale: 2,
        useCORS: true,
        logging: false,
      })
      
      const link = document.createElement('a')
      link.download = `shotiq-${selectedTemplate}-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Failed to generate image:', error)
      alert('Failed to download image. Please try again.')
    } finally {
      setDownloading(false)
    }
  }, [selectedTemplate])

  // Copy link to clipboard
  const handleCopyLink = useCallback(async () => {
    const shareUrl = `https://shotiqai.com/share/${userData.name.toLowerCase()}-${Date.now()}`
    
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }, [userData.name])

  // Native share (Web Share API)
  const handleNativeShare = useCallback(async () => {
    if (!navigator.share) {
      setShowShareSheet(true)
      return
    }

    try {
      await navigator.share({
        title: `My SHOTIQ AI Score: ${userData.score}`,
        text: `I scored ${userData.score} on my shooting form analysis! Top ${100 - userData.percentile}% of all shooters 🏀`,
        url: 'https://shotiqai.com',
      })
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setShowShareSheet(true)
      }
    }
  }, [userData.score, userData.percentile])

  // Platform-specific sharing
  const shareToTwitter = useCallback(() => {
    const text = encodeURIComponent(`I scored ${userData.score} on my shooting form analysis with @ShotIQAI! Top ${100 - userData.percentile}% of all shooters 🏀`)
    const url = encodeURIComponent('https://shotiqai.com')
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
  }, [userData.score, userData.percentile])

  const shareToFacebook = useCallback(() => {
    const url = encodeURIComponent('https://shotiqai.com')
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank')
  }, [])

  const shareToInstagram = useCallback(() => {
    // Instagram doesn't have a direct share URL, so we download the image
    handleDownload()
    alert('Image downloaded! Open Instagram and share from your camera roll.')
  }, [handleDownload])

  const shareToWhatsApp = useCallback(() => {
    const text = encodeURIComponent(`I scored ${userData.score} on my shooting form analysis! Top ${100 - userData.percentile}% of all shooters 🏀 https://shotiqai.com`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }, [userData.score, userData.percentile])

  // Get shareable content from the app
  const shareableContent: ShareableContent[] = useMemo(() => {
    const content: ShareableContent[] = []
    
    // Latest Analysis
    content.push({
      type: 'latest_analysis',
      title: 'Latest Analysis',
      subtitle: `Score: ${userData.score} • ${userData.analysisDate}`,
      icon: Target,
      color: '#FF6B35',
      available: true,
      data: { score: userData.score, date: userData.analysisDate }
    })
    
    // Recent Badge
    if (MOCK_BADGES.length > 0) {
      const latestBadge = MOCK_BADGES[MOCK_BADGES.length - 1]
      content.push({
        type: 'badge_unlock',
        title: 'Badge Unlocked',
        subtitle: `${latestBadge.name} • ${latestBadge.unlockedDate}`,
        icon: Trophy,
        color: '#D4AF37',
        available: true,
        data: latestBadge
      })
    }
    
    // Current Streak
    if (userData.streak > 0) {
      content.push({
        type: 'streak',
        title: `${userData.streak}-Day Streak`,
        subtitle: 'Practicing every day!',
        icon: Flame,
        color: '#FF4500',
        available: true,
        data: { streak: userData.streak }
      })
    }
    
    // Elite Comparison
    content.push({
      type: 'elite_comparison',
      title: 'Elite Match',
      subtitle: `${userData.eliteMatch.similarity}% similar to ${userData.eliteMatch.name}`,
      icon: Users,
      color: '#D4AF37',
      available: true,
      data: userData.eliteMatch
    })
    
    // Completed Workout
    if (MOCK_WORKOUTS.length > 0) {
      const latestWorkout = MOCK_WORKOUTS[0]
      content.push({
        type: 'workout_complete',
        title: 'Workout Complete',
        subtitle: `${latestWorkout.name} • ${latestWorkout.duration}min`,
        icon: Dumbbell,
        color: '#22C55E',
        available: true,
        data: latestWorkout
      })
    }
    
    // Weekly Summary
    content.push({
      type: 'weekly_summary',
      title: 'Weekly Summary',
      subtitle: `${userData.totalAnalyses} analyses • +${userData.improvement}pts improved`,
      icon: BarChart3,
      color: '#8B5CF6',
      available: true,
      data: { analyses: userData.totalAnalyses, improvement: userData.improvement }
    })
    
    // Milestone
    content.push({
      type: 'milestone',
      title: 'Milestone Reached',
      subtitle: 'Top 8% of all shooters!',
      icon: Medal,
      color: '#F59E0B',
      available: true,
      data: { percentile: userData.percentile }
    })
    
    return content
  }, [userData])

  // Handle content selection
  const handleContentSelect = (content: ShareableContent) => {
    setSelectedContent(content.type)
    
    // Auto-select appropriate template based on content type
    switch (content.type) {
      case 'latest_analysis':
        setSelectedTemplate('analysis')
        break
      case 'badge_unlock':
        setSelectedTemplate('achievement')
        break
      case 'streak':
        setSelectedTemplate('streak')
        break
      case 'elite_comparison':
        setSelectedTemplate('comparison')
        break
      case 'workout_complete':
        setSelectedTemplate('analysis') // Could create a workout-specific template
        break
      case 'weekly_summary':
        setSelectedTemplate('flex')
        break
      case 'milestone':
        setSelectedTemplate('flex')
        break
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-lg border-b border-white/5">
        <div className="px-6 py-4 flex items-center justify-between">
          <h1 className="text-white font-semibold">Share Your Results</h1>
          <button
            onClick={handleNativeShare}
            className="flex items-center gap-2 bg-[#FF6B35] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#e5612f] transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>

      {/* What to Share Section */}
      <div className="px-6 py-4">
        <h2 className="text-[#888] text-xs uppercase tracking-widest mb-4">What to Share</h2>
        <div className="space-y-2">
          {shareableContent.map((content) => {
            const Icon = content.icon
            const isSelected = selectedContent === content.type
            
            return (
              <button
                key={content.type}
                onClick={() => handleContentSelect(content)}
                className={`
                  w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left
                  ${isSelected 
                    ? 'bg-[#FF6B35]/10 border-[#FF6B35]/50' 
                    : 'bg-white/5 border-white/5 hover:border-white/10'
                  }
                `}
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${content.color}20` }}
                >
                  <Icon className="w-6 h-6" style={{ color: content.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium ${isSelected ? 'text-white' : 'text-[#ccc]'}`}>
                    {content.title}
                  </div>
                  <div className="text-[#666] text-sm truncate">
                    {content.subtitle}
                  </div>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-[#FF6B35] flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Template Selector */}
      <div className="px-6 py-4">
        <h2 className="text-[#888] text-xs uppercase tracking-widest mb-4">Choose Style</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
          {TEMPLATES.map((template) => {
            const Icon = template.icon
            const isSelected = selectedTemplate === template.id
            
            return (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`
                  flex-shrink-0 p-4 rounded-2xl border transition-all
                  ${isSelected 
                    ? 'bg-[#FF6B35]/10 border-[#FF6B35]/50' 
                    : 'bg-white/5 border-white/5 hover:border-white/10'
                  }
                `}
              >
                <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-[#FF6B35]' : 'text-[#666]'}`} />
                <div className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-[#888]'}`}>
                  {template.name}
                </div>
                <div className="text-[10px] text-[#555] mt-1 w-20">
                  {template.description}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Card Preview */}
      <div className="flex justify-center py-8">
        <div 
          ref={cardRef}
          className="transform scale-[0.85] origin-top"
        >
          {renderCard()}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 space-y-4">
        {/* Primary Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            {downloading ? 'Saving...' : 'Save Image'}
          </button>
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-medium hover:bg-white/10 transition-colors"
          >
            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Link2 className="w-5 h-5" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>

        {/* Share Platforms */}
        <div className="bg-white/5 rounded-2xl p-4">
          <h3 className="text-[#888] text-xs uppercase tracking-widest mb-4 text-center">Share To</h3>
          <div className="flex justify-center gap-2">
            <ShareButton 
              icon={Instagram} 
              label="Instagram" 
              color="#E4405F" 
              onClick={shareToInstagram}
            />
            <ShareButton 
              icon={Twitter} 
              label="X / Twitter" 
              color="#000000" 
              onClick={shareToTwitter}
            />
            <ShareButton 
              icon={Facebook} 
              label="Facebook" 
              color="#1877F2" 
              onClick={shareToFacebook}
            />
            <ShareButton 
              icon={MessageCircle} 
              label="WhatsApp" 
              color="#25D366" 
              onClick={shareToWhatsApp}
            />
            <ShareButton 
              icon={Smartphone} 
              label="More" 
              color="#666666" 
              onClick={handleNativeShare}
            />
          </div>
        </div>

        {/* Reward Banner */}
        <div className="bg-gradient-to-r from-[#FF6B35]/20 to-[#FF4500]/20 border border-[#FF6B35]/30 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#FF6B35]/20 flex items-center justify-center flex-shrink-0">
            <Award className="w-6 h-6 text-[#FF6B35]" />
          </div>
          <div>
            <div className="text-white font-medium">Earn +50 XP</div>
            <div className="text-[#888] text-sm">Share your results to earn bonus XP!</div>
          </div>
        </div>
      </div>

      {/* Share Sheet Modal */}
      {showShareSheet && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center"
          onClick={() => setShowShareSheet(false)}
        >
          <div 
            className="bg-[#1a1a1a] rounded-t-3xl w-full max-w-lg p-6 pb-10"
            onClick={e => e.stopPropagation()}
            style={{ animation: 'slideUp 0.3s ease-out' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white text-lg font-semibold">Share</h3>
              <button 
                onClick={() => setShowShareSheet(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <ShareButton icon={Instagram} label="Instagram" color="#E4405F" onClick={shareToInstagram} />
              <ShareButton icon={Twitter} label="X" color="#000" onClick={shareToTwitter} />
              <ShareButton icon={Facebook} label="Facebook" color="#1877F2" onClick={shareToFacebook} />
              <ShareButton icon={MessageCircle} label="WhatsApp" color="#25D366" onClick={shareToWhatsApp} />
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/10">
              <button
                onClick={() => { handleCopyLink(); setShowShareSheet(false); }}
                className="w-full flex items-center justify-center gap-2 bg-white/10 text-white py-4 rounded-xl font-medium"
              >
                <Copy className="w-5 h-5" />
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}

