"use client"

import React, { useState, useEffect, useMemo } from "react"
import { 
  Trophy, Star, Target, Flame, Zap, Award, Medal, Crown, Lock, 
  Users, TrendingUp, Share2, ChevronRight, Timer, Check, Eye,
  Sparkles, Shield, Swords, Gem, Heart, Rocket, Mountain,
  Camera, BarChart3, Calendar, Gift, Play, Volume2, VolumeX
} from "lucide-react"

// ============================================
// VIDEO GAME ACHIEVEMENT SYSTEM
// Inspired by: Xbox, PlayStation, Destiny 2, Halo, Apex Legends
// ============================================

// Achievement Rarity Tiers (like PlayStation trophies)
type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

// Achievement Categories (like Destiny 2 triumphs)
type AchievementCategory = 'fundamentals' | 'mastery' | 'dedication' | 'elite' | 'secret'

interface Achievement {
  id: string
  name: string
  description: string
  hint?: string // For locked achievements
  icon: React.ElementType
  rarity: AchievementRarity
  category: AchievementCategory
  points: number // Like Xbox Gamerscore
  unlocked: boolean
  unlockedDate?: string
  progress?: { current: number; total: number }
  secret?: boolean // Hidden until unlocked
  showcaseable?: boolean // Can be displayed on profile
}

interface AchievementCategory {
  id: string
  name: string
  icon: React.ElementType
  color: string
  achievements: Achievement[]
}

// ============================================
// RARITY SYSTEM (PlayStation Trophy Style)
// ============================================

const RARITY_CONFIG: Record<AchievementRarity, {
  name: string
  color: string
  bgColor: string
  borderColor: string
  glowColor: string
  icon: string
  multiplier: number
}> = {
  common: {
    name: 'Common',
    color: '#9CA3AF',
    bgColor: 'rgba(156, 163, 175, 0.1)',
    borderColor: 'rgba(156, 163, 175, 0.3)',
    glowColor: 'rgba(156, 163, 175, 0.2)',
    icon: '○',
    multiplier: 1
  },
  uncommon: {
    name: 'Uncommon',
    color: '#22C55E',
    bgColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
    glowColor: 'rgba(34, 197, 94, 0.2)',
    icon: '◇',
    multiplier: 2
  },
  rare: {
    name: 'Rare',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    glowColor: 'rgba(59, 130, 246, 0.3)',
    icon: '◆',
    multiplier: 3
  },
  epic: {
    name: 'Epic',
    color: '#A855F7',
    bgColor: 'rgba(168, 85, 247, 0.1)',
    borderColor: 'rgba(168, 85, 247, 0.4)',
    glowColor: 'rgba(168, 85, 247, 0.3)',
    icon: '★',
    multiplier: 5
  },
  legendary: {
    name: 'Legendary',
    color: '#F59E0B',
    bgColor: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)',
    borderColor: 'rgba(245, 158, 11, 0.5)',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    icon: '✦',
    multiplier: 10
  }
}

// ============================================
// ACHIEVEMENT DATA
// ============================================

const ACHIEVEMENTS: Achievement[] = [
  // FUNDAMENTALS - Getting Started
  {
    id: 'first-shot',
    name: 'First Shot',
    description: 'Complete your first shooting form analysis',
    icon: Target,
    rarity: 'common',
    category: 'fundamentals',
    points: 10,
    unlocked: true,
    unlockedDate: 'Dec 15, 2024',
    showcaseable: true
  },
  {
    id: 'form-check',
    name: 'Form Check',
    description: 'Analyze 5 different shots',
    icon: Camera,
    rarity: 'common',
    category: 'fundamentals',
    points: 15,
    unlocked: true,
    unlockedDate: 'Dec 17, 2024',
    progress: { current: 5, total: 5 }
  },
  {
    id: 'video-rookie',
    name: 'Video Rookie',
    description: 'Complete your first video analysis',
    icon: Play,
    rarity: 'uncommon',
    category: 'fundamentals',
    points: 25,
    unlocked: true,
    unlockedDate: 'Dec 18, 2024'
  },
  {
    id: 'stat-tracker',
    name: 'Stat Tracker',
    description: 'View your analytics dashboard',
    icon: BarChart3,
    rarity: 'common',
    category: 'fundamentals',
    points: 10,
    unlocked: true,
    unlockedDate: 'Dec 16, 2024'
  },

  // MASTERY - Skill-Based
  {
    id: 'sharp-shooter',
    name: 'Sharp Shooter',
    description: 'Achieve a score of 85 or higher',
    icon: Zap,
    rarity: 'uncommon',
    category: 'mastery',
    points: 30,
    unlocked: true,
    unlockedDate: 'Dec 20, 2024',
    showcaseable: true
  },
  {
    id: 'elite-form',
    name: 'Elite Form',
    description: 'Achieve a score of 90 or higher',
    icon: Star,
    rarity: 'rare',
    category: 'mastery',
    points: 50,
    unlocked: false,
    progress: { current: 87, total: 90 },
    showcaseable: true
  },
  {
    id: 'perfect-release',
    name: 'Perfect Release',
    description: 'Get a 95+ release point score',
    icon: Rocket,
    rarity: 'rare',
    category: 'mastery',
    points: 50,
    unlocked: false,
    hint: 'Focus on your release timing'
  },
  {
    id: 'textbook',
    name: 'Textbook Form',
    description: 'Achieve 90+ in all 5 metrics simultaneously',
    icon: Award,
    rarity: 'epic',
    category: 'mastery',
    points: 100,
    unlocked: false,
    hint: 'Master every aspect of your shot',
    showcaseable: true
  },
  {
    id: 'legendary-form',
    name: 'Legendary Form',
    description: 'Achieve a perfect 100 score',
    icon: Crown,
    rarity: 'legendary',
    category: 'mastery',
    points: 500,
    unlocked: false,
    hint: 'Only the greatest achieve perfection',
    showcaseable: true
  },

  // DEDICATION - Consistency
  {
    id: 'three-day-streak',
    name: 'Getting Started',
    description: 'Maintain a 3-day practice streak',
    icon: Flame,
    rarity: 'common',
    category: 'dedication',
    points: 15,
    unlocked: true,
    unlockedDate: 'Dec 18, 2024'
  },
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day practice streak',
    icon: Flame,
    rarity: 'uncommon',
    category: 'dedication',
    points: 35,
    unlocked: true,
    unlockedDate: 'Dec 22, 2024',
    showcaseable: true
  },
  {
    id: 'dedicated',
    name: 'Dedicated',
    description: 'Complete 25 total analyses',
    icon: Heart,
    rarity: 'uncommon',
    category: 'dedication',
    points: 40,
    unlocked: false,
    progress: { current: 18, total: 25 }
  },
  {
    id: 'month-master',
    name: 'Month Master',
    description: 'Maintain a 30-day practice streak',
    icon: Calendar,
    rarity: 'epic',
    category: 'dedication',
    points: 150,
    unlocked: false,
    progress: { current: 12, total: 30 },
    showcaseable: true
  },
  {
    id: 'centurion',
    name: 'Centurion',
    description: 'Complete 100 total analyses',
    icon: Shield,
    rarity: 'legendary',
    category: 'dedication',
    points: 300,
    unlocked: false,
    progress: { current: 18, total: 100 },
    showcaseable: true
  },

  // ELITE - Pro Comparisons
  {
    id: 'film-student',
    name: 'Film Student',
    description: 'Compare your form with 5 elite shooters',
    icon: Users,
    rarity: 'uncommon',
    category: 'elite',
    points: 25,
    unlocked: true,
    unlockedDate: 'Dec 21, 2024'
  },
  {
    id: 'rising-star',
    name: 'Rising Star',
    description: 'Improve your score by 10+ points',
    icon: TrendingUp,
    rarity: 'rare',
    category: 'elite',
    points: 60,
    unlocked: true,
    unlockedDate: 'Dec 23, 2024',
    showcaseable: true
  },
  {
    id: 'elite-match',
    name: 'Elite Match',
    description: 'Achieve 85%+ similarity to any pro',
    icon: Medal,
    rarity: 'rare',
    category: 'elite',
    points: 75,
    unlocked: false,
    progress: { current: 79, total: 85 },
    hint: 'Study the pros closely'
  },
  {
    id: 'curry-clone',
    name: 'Curry Clone',
    description: 'Achieve 90%+ similarity to Steph Curry',
    icon: Gem,
    rarity: 'legendary',
    category: 'elite',
    points: 500,
    unlocked: false,
    hint: 'Master the art of the quick release',
    showcaseable: true
  },

  // SECRET - Hidden Achievements
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Complete an analysis after midnight',
    icon: Mountain,
    rarity: 'rare',
    category: 'secret',
    points: 50,
    unlocked: false,
    secret: true,
    hint: '???'
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Analyze the same shot 10 times',
    icon: Sparkles,
    rarity: 'epic',
    category: 'secret',
    points: 100,
    unlocked: false,
    secret: true,
    hint: '???'
  },
  {
    id: 'legend',
    name: 'Legend',
    description: 'Unlock all other achievements',
    icon: Trophy,
    rarity: 'legendary',
    category: 'secret',
    points: 1000,
    unlocked: false,
    secret: true,
    hint: 'Complete your journey',
    showcaseable: true
  }
]

// Category definitions
const CATEGORIES = [
  { id: 'all', name: 'All', icon: Trophy, color: '#FF6B35' },
  { id: 'fundamentals', name: 'Fundamentals', icon: Target, color: '#22C55E' },
  { id: 'mastery', name: 'Mastery', icon: Star, color: '#3B82F6' },
  { id: 'dedication', name: 'Dedication', icon: Flame, color: '#F59E0B' },
  { id: 'elite', name: 'Elite', icon: Crown, color: '#A855F7' },
  { id: 'secret', name: 'Secret', icon: Eye, color: '#6B7280' },
]

// ============================================
// COMPONENTS
// ============================================

// Animated progress ring
function ProgressRing({ 
  progress, 
  size = 48, 
  strokeWidth = 3,
  color = '#FF6B35'
}: { 
  progress: number
  size?: number
  strokeWidth?: number
  color?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
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
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-700 ease-out"
      />
    </svg>
  )
}

// Achievement Card Component (Xbox/PlayStation style)
function AchievementCard({ 
  achievement, 
  onClick,
  isShowcased = false
}: { 
  achievement: Achievement
  onClick: () => void
  isShowcased?: boolean
}) {
  const Icon = achievement.icon
  const rarity = RARITY_CONFIG[achievement.rarity]
  const isLocked = !achievement.unlocked && !achievement.progress
  const isInProgress = !achievement.unlocked && achievement.progress
  const isSecret = achievement.secret && !achievement.unlocked
  
  const progressPercent = achievement.progress 
    ? (achievement.progress.current / achievement.progress.total) * 100 
    : 0

  return (
    <button
      onClick={onClick}
      className={`
        relative w-full flex items-center gap-4 p-4 rounded-xl
        border transition-all duration-300 text-left group
        ${achievement.unlocked 
          ? 'bg-gradient-to-r from-white/[0.08] to-white/[0.03] border-white/10 hover:border-white/20' 
          : 'bg-[#0a0a0a] border-white/[0.05] hover:border-white/10'
        }
        ${isShowcased ? 'ring-2 ring-[#FF6B35]/50' : ''}
      `}
      style={{
        boxShadow: achievement.unlocked 
          ? `0 0 20px ${rarity.glowColor}` 
          : 'none'
      }}
    >
      {/* Rarity indicator bar */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: rarity.color }}
      />

      {/* Icon Container */}
      <div className="relative flex-shrink-0">
        {isInProgress ? (
          <div className="relative">
            <ProgressRing progress={progressPercent} size={56} color={rarity.color} />
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{ 
                width: 56, 
                height: 56,
              }}
            >
              <div 
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ backgroundColor: rarity.bgColor }}
              >
                <Icon className="w-5 h-5" style={{ color: rarity.color }} />
              </div>
            </div>
          </div>
        ) : (
          <div 
            className={`
              w-14 h-14 rounded-xl flex items-center justify-center
              transition-all duration-300
              ${achievement.unlocked ? 'scale-100' : 'scale-95 opacity-40'}
            `}
            style={{ 
              background: achievement.unlocked ? rarity.bgColor : 'rgba(255,255,255,0.03)',
              border: `1px solid ${achievement.unlocked ? rarity.borderColor : 'rgba(255,255,255,0.05)'}`,
              boxShadow: achievement.unlocked ? `0 0 15px ${rarity.glowColor}` : 'none'
            }}
          >
            {isLocked || isSecret ? (
              <Lock className="w-5 h-5 text-[#444]" />
            ) : (
              <Icon 
                className="w-6 h-6" 
                style={{ color: achievement.unlocked ? rarity.color : '#444' }} 
              />
            )}
          </div>
        )}

        {/* Unlocked checkmark */}
        {achievement.unlocked && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#22C55E] flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`font-semibold truncate ${achievement.unlocked ? 'text-white' : 'text-[#666]'}`}>
            {isSecret ? '???' : achievement.name}
          </h3>
          {/* Rarity badge */}
          <span 
            className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
            style={{ 
              backgroundColor: rarity.bgColor,
              color: rarity.color,
              border: `1px solid ${rarity.borderColor}`
            }}
          >
            {rarity.icon} {rarity.name}
          </span>
        </div>
        <p className={`text-sm truncate ${achievement.unlocked ? 'text-[#888]' : 'text-[#555]'}`}>
          {isSecret ? achievement.hint : achievement.description}
        </p>
        
        {/* Progress bar for in-progress achievements */}
        {isInProgress && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${progressPercent}%`,
                  backgroundColor: rarity.color
                }}
              />
            </div>
            <span className="text-xs font-medium" style={{ color: rarity.color }}>
              {achievement.progress?.current}/{achievement.progress?.total}
            </span>
          </div>
        )}
      </div>

      {/* Points */}
      <div className="flex-shrink-0 text-right">
        <div className={`text-lg font-bold ${achievement.unlocked ? 'text-white' : 'text-[#444]'}`}>
          {achievement.points}
        </div>
        <div className="text-[10px] text-[#666] uppercase tracking-wider">pts</div>
      </div>

      {/* Showcase star */}
      {isShowcased && (
        <div className="absolute top-2 right-2">
          <Star className="w-4 h-4 text-[#FF6B35] fill-[#FF6B35]" />
        </div>
      )}
    </button>
  )
}

// Stats Card
function StatsCard({ 
  icon: Icon, 
  value, 
  label, 
  color 
}: { 
  icon: React.ElementType
  value: string | number
  label: string
  color: string
}) {
  return (
    <div className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] rounded-xl p-4 border border-white/[0.06]">
      <Icon className="w-5 h-5 mb-2" style={{ color }} />
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-[10px] text-[#666] uppercase tracking-wider">{label}</div>
    </div>
  )
}

// ============================================
// MAIN PAGE
// ============================================

export default function TestAchievementsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)
  const [showcasedIds, setShowcasedIds] = useState<string[]>(['sharp-shooter', 'rising-star', 'week-warrior'])
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Calculate stats
  const stats = useMemo(() => {
    const unlocked = ACHIEVEMENTS.filter(a => a.unlocked)
    const totalPoints = unlocked.reduce((sum, a) => sum + a.points, 0)
    const maxPoints = ACHIEVEMENTS.reduce((sum, a) => sum + a.points, 0)
    const completionRate = Math.round((unlocked.length / ACHIEVEMENTS.length) * 100)
    
    const rarityCount = {
      common: unlocked.filter(a => a.rarity === 'common').length,
      uncommon: unlocked.filter(a => a.rarity === 'uncommon').length,
      rare: unlocked.filter(a => a.rarity === 'rare').length,
      epic: unlocked.filter(a => a.rarity === 'epic').length,
      legendary: unlocked.filter(a => a.rarity === 'legendary').length,
    }

    return {
      unlocked: unlocked.length,
      total: ACHIEVEMENTS.length,
      points: totalPoints,
      maxPoints,
      completionRate,
      rarityCount
    }
  }, [])

  // Filter achievements
  const filteredAchievements = useMemo(() => {
    if (selectedCategory === 'all') return ACHIEVEMENTS
    return ACHIEVEMENTS.filter(a => a.category === selectedCategory)
  }, [selectedCategory])

  // Toggle showcase
  const toggleShowcase = (id: string) => {
    if (showcasedIds.includes(id)) {
      setShowcasedIds(showcasedIds.filter(i => i !== id))
    } else if (showcasedIds.length < 3) {
      setShowcasedIds([...showcasedIds, id])
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] pb-32">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#FF6B35]/5 via-transparent to-transparent" />
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }}
        />
      </div>

      {/* Header */}
      <div className="relative px-6 pt-8 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Achievements</h1>
            <p className="text-[#666] text-sm">Track your journey to greatness</p>
          </div>
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-[#888]" />
            ) : (
              <VolumeX className="w-5 h-5 text-[#555]" />
            )}
          </button>
        </div>

        {/* Gamerscore Card (Xbox style) */}
        <div className="bg-gradient-to-br from-[#FF6B35]/20 via-[#FF6B35]/10 to-transparent rounded-2xl p-5 border border-[#FF6B35]/20 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF4500] flex items-center justify-center shadow-lg shadow-[#FF6B35]/30">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-4xl font-black text-white">{stats.points}</div>
                <div className="text-[#888] text-sm">Achievement Score</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{stats.unlocked}/{stats.total}</div>
              <div className="text-[#888] text-sm">{stats.completionRate}% Complete</div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-2 bg-black/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF4500] rounded-full transition-all duration-700"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Rarity Breakdown */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          {(['common', 'uncommon', 'rare', 'epic', 'legendary'] as AchievementRarity[]).map(rarity => {
            const config = RARITY_CONFIG[rarity]
            const count = stats.rarityCount[rarity]
            const total = ACHIEVEMENTS.filter(a => a.rarity === rarity).length
            
            return (
              <div 
                key={rarity}
                className="rounded-xl p-3 text-center border"
                style={{ 
                  background: config.bgColor,
                  borderColor: config.borderColor
                }}
              >
                <div className="text-lg mb-0.5" style={{ color: config.color }}>
                  {config.icon}
                </div>
                <div className="text-white font-bold text-sm">{count}/{total}</div>
                <div className="text-[9px] uppercase tracking-wider" style={{ color: config.color }}>
                  {config.name}
                </div>
              </div>
            )
          })}
        </div>

        {/* Showcase Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
              <Star className="w-4 h-4 text-[#FF6B35]" />
              Showcase ({showcasedIds.length}/3)
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {showcasedIds.map(id => {
              const achievement = ACHIEVEMENTS.find(a => a.id === id)
              if (!achievement) return null
              const rarity = RARITY_CONFIG[achievement.rarity]
              const Icon = achievement.icon
              
              return (
                <div 
                  key={id}
                  className="flex-shrink-0 w-24 rounded-xl p-3 text-center border"
                  style={{ 
                    background: rarity.bgColor,
                    borderColor: rarity.borderColor,
                    boxShadow: `0 0 20px ${rarity.glowColor}`
                  }}
                >
                  <Icon className="w-8 h-8 mx-auto mb-2" style={{ color: rarity.color }} />
                  <div className="text-white text-xs font-medium truncate">{achievement.name}</div>
                  <div className="text-[10px] mt-1" style={{ color: rarity.color }}>
                    {rarity.icon} {achievement.points} pts
                  </div>
                </div>
              )
            })}
            {showcasedIds.length < 3 && (
              <div className="flex-shrink-0 w-24 h-[104px] rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center">
                <span className="text-[#444] text-xs text-center px-2">Add to showcase</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-6 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon
            const isSelected = selectedCategory === cat.id
            const count = cat.id === 'all' 
              ? ACHIEVEMENTS.length 
              : ACHIEVEMENTS.filter(a => a.category === cat.id).length
            
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`
                  flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl
                  border transition-all duration-300
                  ${isSelected 
                    ? 'bg-white/10 border-white/20' 
                    : 'bg-white/[0.03] border-white/[0.05] hover:border-white/10'
                  }
                `}
              >
                <Icon 
                  className="w-4 h-4" 
                  style={{ color: isSelected ? cat.color : '#666' }} 
                />
                <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-[#888]'}`}>
                  {cat.name}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${isSelected ? 'bg-white/10 text-white' : 'bg-white/5 text-[#666]'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Achievement List */}
      <div className="px-6 space-y-3">
        {filteredAchievements.map(achievement => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            onClick={() => setSelectedAchievement(achievement)}
            isShowcased={showcasedIds.includes(achievement.id)}
          />
        ))}
      </div>

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-end justify-center"
          onClick={() => setSelectedAchievement(null)}
        >
          <div 
            className="w-full max-w-lg rounded-t-3xl overflow-hidden"
            onClick={e => e.stopPropagation()}
            style={{ animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            {(() => {
              const rarity = RARITY_CONFIG[selectedAchievement.rarity]
              const Icon = selectedAchievement.icon
              const isSecret = selectedAchievement.secret && !selectedAchievement.unlocked
              const progressPercent = selectedAchievement.progress 
                ? (selectedAchievement.progress.current / selectedAchievement.progress.total) * 100 
                : 0

              return (
                <div 
                  className="p-8 pb-12 border-t"
                  style={{ 
                    background: `linear-gradient(180deg, ${rarity.bgColor} 0%, #0a0a0a 100%)`,
                    borderColor: rarity.borderColor
                  }}
                >
                  {/* Icon */}
                  <div className="flex justify-center mb-6">
                    <div 
                      className={`
                        w-24 h-24 rounded-2xl flex items-center justify-center
                        ${selectedAchievement.unlocked ? '' : 'opacity-50'}
                      `}
                      style={{ 
                        background: rarity.bgColor,
                        border: `2px solid ${rarity.borderColor}`,
                        boxShadow: selectedAchievement.unlocked ? `0 0 40px ${rarity.glowColor}` : 'none'
                      }}
                    >
                      {isSecret ? (
                        <Lock className="w-10 h-10 text-[#444]" />
                      ) : (
                        <Icon className="w-12 h-12" style={{ color: rarity.color }} />
                      )}
                    </div>
                  </div>

                  {/* Rarity */}
                  <div className="flex justify-center mb-4">
                    <span 
                      className="text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider"
                      style={{ 
                        backgroundColor: rarity.bgColor,
                        color: rarity.color,
                        border: `1px solid ${rarity.borderColor}`
                      }}
                    >
                      {rarity.icon} {rarity.name}
                    </span>
                  </div>

                  {/* Name & Description */}
                  <h3 className="text-2xl font-bold text-white text-center mb-2">
                    {isSecret ? '???' : selectedAchievement.name}
                  </h3>
                  <p className="text-[#888] text-center mb-6">
                    {isSecret ? selectedAchievement.hint : selectedAchievement.description}
                  </p>

                  {/* Points */}
                  <div className="flex justify-center gap-6 mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">{selectedAchievement.points}</div>
                      <div className="text-[#666] text-xs uppercase tracking-wider">Points</div>
                    </div>
                    {selectedAchievement.unlocked && selectedAchievement.unlockedDate && (
                      <div className="text-center">
                        <div className="text-lg font-medium text-[#888]">{selectedAchievement.unlockedDate}</div>
                        <div className="text-[#666] text-xs uppercase tracking-wider">Unlocked</div>
                      </div>
                    )}
                  </div>

                  {/* Progress */}
                  {selectedAchievement.progress && !selectedAchievement.unlocked && (
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-[#888]">Progress</span>
                        <span style={{ color: rarity.color }}>
                          {selectedAchievement.progress.current}/{selectedAchievement.progress.total}
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${progressPercent}%`,
                            backgroundColor: rarity.color
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-3">
                    {selectedAchievement.unlocked && selectedAchievement.showcaseable && (
                      <button 
                        onClick={() => toggleShowcase(selectedAchievement.id)}
                        className={`
                          w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2
                          transition-all duration-300
                          ${showcasedIds.includes(selectedAchievement.id)
                            ? 'bg-[#FF6B35] text-white'
                            : 'bg-white/10 text-white hover:bg-white/20'
                          }
                        `}
                      >
                        <Star className={`w-5 h-5 ${showcasedIds.includes(selectedAchievement.id) ? 'fill-white' : ''}`} />
                        {showcasedIds.includes(selectedAchievement.id) ? 'Remove from Showcase' : 'Add to Showcase'}
                      </button>
                    )}
                    
                    {selectedAchievement.unlocked && (
                      <button className="w-full py-4 bg-white/5 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
                        <Share2 className="w-5 h-5" />
                        Share Achievement
                      </button>
                    )}
                  </div>
                </div>
              )
            })()}
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

