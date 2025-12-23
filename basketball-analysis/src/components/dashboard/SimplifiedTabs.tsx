"use client"

import React from 'react'
import { 
  Target, 
  CheckCircle2, 
  TrendingUp,
  Clock,
  Trophy,
  Star,
  Calendar,
  Lightbulb,
  Award,
  Zap,
  ChevronRight,
  Activity
} from 'lucide-react'
import type { DashboardView } from '@/components/DashboardViewSelector'

// ============================================
// TYPES
// ============================================

interface SimplifiedTabsProps {
  dashboardView: DashboardView
  analysisData: {
    overallScore: number
    shootingStats: {
      form: number
      balance: number
      release: number
      followThrough: number
      elbow: number
      arc: number
    }
    flaws?: { name: string; severity: 'high' | 'medium' | 'low'; tip: string }[]
  }
  playerName: string
}

// Helper functions
const getGrade = (score: number) => {
  if (score >= 90) return 'A+'
  if (score >= 85) return 'A'
  if (score >= 80) return 'A-'
  if (score >= 75) return 'B+'
  if (score >= 70) return 'B'
  if (score >= 65) return 'B-'
  if (score >= 60) return 'C+'
  return 'C'
}

const getBarColor = (score: number) => {
  if (score >= 80) return 'bg-green-500'
  if (score >= 70) return 'bg-[#FFD700]'
  if (score >= 60) return 'bg-yellow-500'
  return 'bg-orange-500'
}

const getTextColor = (score: number) => {
  if (score >= 80) return 'text-green-400'
  if (score >= 70) return 'text-[#FFD700]'
  if (score >= 60) return 'text-yellow-400'
  return 'text-orange-400'
}

const getKidStars = (score: number) => {
  if (score >= 85) return 5
  if (score >= 75) return 4
  if (score >= 65) return 3
  if (score >= 55) return 2
  return 1
}

// Reusable Star Rating Component
function StarRating({ count, max = 5, size = 'sm' }: { count: number, max?: number, size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' }
  return (
    <div className="flex gap-0.5">
      {[...Array(max)].map((_, i) => (
        <Star 
          key={i} 
          className={`${sizeClasses[size]} ${i < count ? 'text-[#FFD700] fill-[#FFD700]' : 'text-[#3a3a3a]'}`}
        />
      ))}
    </div>
  )
}

// Horizontal Bar Chart Component
function HorizontalBar({ label, value, maxValue = 100, showGrade = false }: { label: string, value: number, maxValue?: number, showGrade?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[#888] text-xs uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${getTextColor(value)}`}>{value}</span>
          {showGrade && (
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${getTextColor(value)} bg-current/10`}>
              {getGrade(value)}
            </span>
          )}
        </div>
      </div>
      <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${getBarColor(value)} transition-all duration-500`} 
          style={{ width: `${(value / maxValue) * 100}%` }} 
        />
      </div>
    </div>
  )
}

// ============================================
// STANDARD VIEW - BIOMECHANICAL ANALYSIS
// Clean bar charts with grades
// ============================================

export function StandardBiomechanicalAnalysis({ analysisData }: { analysisData: SimplifiedTabsProps['analysisData'] }) {
  const stats = analysisData.shootingStats
  
  // Group stats into categories
  const upperBody = [
    { label: 'Form', value: stats.form || 75 },
    { label: 'Elbow', value: stats.elbow || 75 },
  ]
  
  const lowerBody = [
    { label: 'Balance', value: stats.balance || 75 },
    { label: 'Power', value: stats.release || 75 },
  ]
  
  const release = [
    { label: 'Follow Through', value: stats.followThrough || 75 },
    { label: 'Arc', value: stats.arc || 75 },
  ]
  
  // Calculate category averages
  const upperAvg = Math.round(upperBody.reduce((a, b) => a + b.value, 0) / upperBody.length)
  const lowerAvg = Math.round(lowerBody.reduce((a, b) => a + b.value, 0) / lowerBody.length)
  const releaseAvg = Math.round(release.reduce((a, b) => a + b.value, 0) / release.length)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#2a2a2a] rounded-lg p-4 border border-[#3a3a3a]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#888] text-xs uppercase">Upper Body</span>
            <span className={`text-lg font-black ${getTextColor(upperAvg)}`}>{getGrade(upperAvg)}</span>
          </div>
          <div className="text-3xl font-black text-white mb-2">{upperAvg}</div>
          <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${getBarColor(upperAvg)}`} style={{ width: `${upperAvg}%` }} />
          </div>
        </div>
        
        <div className="bg-[#2a2a2a] rounded-lg p-4 border border-[#3a3a3a]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#888] text-xs uppercase">Lower Body</span>
            <span className={`text-lg font-black ${getTextColor(lowerAvg)}`}>{getGrade(lowerAvg)}</span>
          </div>
          <div className="text-3xl font-black text-white mb-2">{lowerAvg}</div>
          <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${getBarColor(lowerAvg)}`} style={{ width: `${lowerAvg}%` }} />
          </div>
        </div>
        
        <div className="bg-[#2a2a2a] rounded-lg p-4 border border-[#3a3a3a]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#888] text-xs uppercase">Release</span>
            <span className={`text-lg font-black ${getTextColor(releaseAvg)}`}>{getGrade(releaseAvg)}</span>
          </div>
          <div className="text-3xl font-black text-white mb-2">{releaseAvg}</div>
          <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${getBarColor(releaseAvg)}`} style={{ width: `${releaseAvg}%` }} />
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-3 gap-4">
        {/* Upper Body Details */}
        <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
          <h4 className="text-[#FFD700] text-xs font-bold uppercase tracking-wider mb-4">Upper Body</h4>
          <div className="space-y-4">
            {upperBody.map((stat) => (
              <HorizontalBar key={stat.label} label={stat.label} value={stat.value} showGrade />
            ))}
          </div>
        </div>
        
        {/* Lower Body Details */}
        <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
          <h4 className="text-[#FFD700] text-xs font-bold uppercase tracking-wider mb-4">Lower Body</h4>
          <div className="space-y-4">
            {lowerBody.map((stat) => (
              <HorizontalBar key={stat.label} label={stat.label} value={stat.value} showGrade />
            ))}
          </div>
        </div>
        
        {/* Release Details */}
        <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
          <h4 className="text-[#FFD700] text-xs font-bold uppercase tracking-wider mb-4">Release</h4>
          <div className="space-y-4">
            {release.map((stat) => (
              <HorizontalBar key={stat.label} label={stat.label} value={stat.value} showGrade />
            ))}
          </div>
        </div>
      </div>

      {/* Quick Tip */}
      <div className="bg-gradient-to-r from-[#FFD700]/10 to-[#FFD700]/5 rounded-lg p-4 border border-[#FFD700]/20">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-[#FFD700] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[#FFD700] font-bold text-sm mb-1">Quick Tip</p>
            <p className="text-[#E5E5E5] text-sm">
              {upperAvg < lowerAvg && upperAvg < releaseAvg
                ? "Focus on your upper body mechanics - keep your elbow tucked and aligned with the basket."
                : lowerAvg < releaseAvg
                ? "Work on your base - a strong, balanced stance gives you more power and consistency."
                : "Practice your follow-through - a smooth release with good arc improves accuracy."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// STANDARD VIEW - PLAYER ASSESSMENT
// ============================================

export function StandardPlayerAssessment({ analysisData, playerName }: { analysisData: SimplifiedTabsProps['analysisData'], playerName: string }) {
  const score = analysisData.overallScore
  const stats = analysisData.shootingStats
  
  // Determine level
  const level = score >= 85 ? { name: 'Elite', color: '#FFD700', icon: Trophy }
    : score >= 75 ? { name: 'Advanced', color: '#22c55e', icon: Award }
    : score >= 65 ? { name: 'Skilled', color: '#3b82f6', icon: Star }
    : score >= 55 ? { name: 'Developing', color: '#eab308', icon: TrendingUp }
    : { name: 'Beginner', color: '#f97316', icon: Target }
  
  const LevelIcon = level.icon
  
  // Find strengths and weaknesses
  const allStats = [
    { name: 'Form', value: stats.form || 75 },
    { name: 'Balance', value: stats.balance || 75 },
    { name: 'Release', value: stats.release || 75 },
    { name: 'Follow Through', value: stats.followThrough || 75 },
    { name: 'Elbow', value: stats.elbow || 75 },
    { name: 'Arc', value: stats.arc || 75 },
  ].sort((a, b) => b.value - a.value)
  
  const strengths = allStats.slice(0, 2)
  const weaknesses = allStats.slice(-2).reverse()

  return (
    <div className="space-y-6">
      {/* Level Card */}
      <div className="bg-[#2a2a2a] rounded-lg p-5 border border-[#3a3a3a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${level.color}20` }}
            >
              <LevelIcon className="w-8 h-8" style={{ color: level.color }} />
            </div>
            <div>
              <p className="text-[#888] text-xs uppercase tracking-wider">Current Level</p>
              <h3 className="text-2xl font-black uppercase" style={{ color: level.color }}>{level.name}</h3>
              <p className="text-[#888] text-sm">{playerName}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black" style={{ color: level.color }}>{score}</div>
            <p className="text-[#888] text-xs uppercase">Overall</p>
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="bg-[#1a1a1a] rounded-lg p-4 border border-green-500/30">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <h4 className="text-green-400 font-bold text-sm uppercase">Strengths</h4>
          </div>
          <div className="space-y-3">
            {strengths.map((stat) => (
              <div key={stat.name} className="flex items-center justify-between bg-[#2a2a2a] rounded-lg p-3">
                <span className="text-white font-medium">{stat.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-green-400 font-bold">{stat.value}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400`}>
                    {getGrade(stat.value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Areas to Improve */}
        <div className="bg-[#1a1a1a] rounded-lg p-4 border border-yellow-500/30">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-yellow-400" />
            <h4 className="text-yellow-400 font-bold text-sm uppercase">Focus Areas</h4>
          </div>
          <div className="space-y-3">
            {weaknesses.map((stat) => (
              <div key={stat.name} className="flex items-center justify-between bg-[#2a2a2a] rounded-lg p-3">
                <span className="text-white font-medium">{stat.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 font-bold">{stat.value}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400`}>
                    {getGrade(stat.value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress to Next Level */}
      <div className="bg-[#2a2a2a] rounded-lg p-4 border border-[#3a3a3a]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#FFD700]" />
            <span className="text-[#FFD700] font-bold text-sm uppercase">Next Level Progress</span>
          </div>
          <span className="text-[#888] text-sm">
            {score >= 85 ? 'Max Level!' : `${(score >= 75 ? 85 : score >= 65 ? 75 : score >= 55 ? 65 : 55) - score} pts to go`}
          </span>
        </div>
        <div className="h-3 bg-[#1a1a1a] rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFA500]" 
            style={{ width: `${Math.min(100, ((score % 10) / 10) * 100 + 50)}%` }} 
          />
        </div>
      </div>
    </div>
  )
}

// ============================================
// STANDARD VIEW - TRAINING PLAN
// ============================================

export function StandardTrainingPlan({ analysisData }: { analysisData: SimplifiedTabsProps['analysisData'] }) {
  const stats = analysisData.shootingStats
  
  // Identify weak areas
  const allStats = [
    { name: 'Form', value: stats.form || 75, drills: ['Wall shots', 'Mirror practice'] },
    { name: 'Balance', value: stats.balance || 75, drills: ['One-leg shots', 'Stance holds'] },
    { name: 'Release', value: stats.release || 75, drills: ['Wrist flicks', 'Close range'] },
    { name: 'Follow Through', value: stats.followThrough || 75, drills: ['High arc shots', 'Cookie jar'] },
    { name: 'Elbow', value: stats.elbow || 75, drills: ['Elbow tuck', 'One-hand form'] },
  ].filter(s => s.value < 80).sort((a, b) => a.value - b.value).slice(0, 3)

  const days = [
    { day: 'Day 1', focus: 'Form', color: '#3b82f6', exercises: ['20 form shots', '10 one-hand shots', '5 min mirror work'] },
    { day: 'Day 2', focus: 'Power', color: '#eab308', exercises: ['15 jump shots', '10 balance shots', '10 catch-and-shoot'] },
    { day: 'Day 3', focus: 'Game', color: '#22c55e', exercises: ['20 spot shots', '10 free throws', '5 pressure shots'] },
  ]

  return (
    <div className="space-y-6">
      {/* Weekly Schedule */}
      <div className="grid grid-cols-3 gap-4">
        {days.map((d, i) => (
          <div key={i} className="bg-[#2a2a2a] rounded-lg overflow-hidden border border-[#3a3a3a]">
            <div className="px-4 py-3 border-b border-[#3a3a3a]" style={{ backgroundColor: `${d.color}15` }}>
              <div className="flex items-center justify-between">
                <span className="text-white font-bold">{d.day}</span>
                <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: `${d.color}30`, color: d.color }}>
                  {d.focus}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {d.exercises.map((ex, j) => (
                <div key={j} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-[#3a3a3a]" />
                  <span className="text-[#E5E5E5]">{ex}</span>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 bg-[#1a1a1a] border-t border-[#3a3a3a]">
              <div className="flex items-center gap-1 text-[#888] text-xs">
                <Clock className="w-3 h-3" />
                <span>~20 min</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Focus Drills */}
      {allStats.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-[#FFD700]" />
            <h4 className="text-[#FFD700] font-bold text-sm uppercase">Extra Focus Drills</h4>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {allStats.map((stat) => (
              <div key={stat.name} className="bg-[#2a2a2a] rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium text-sm">{stat.name}</span>
                  <span className={`text-xs ${getTextColor(stat.value)}`}>{stat.value}</span>
                </div>
                <ul className="space-y-1">
                  {stat.drills.map((drill, i) => (
                    <li key={i} className="text-[#888] text-xs flex items-center gap-1">
                      <ChevronRight className="w-3 h-3 text-[#FFD700]" />
                      {drill}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Motivation */}
      <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg p-4 border border-green-500/20">
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-green-400" />
          <div>
            <p className="text-white font-semibold">Consistency is key!</p>
            <p className="text-[#888] text-sm">Practice 3 days a week and you&apos;ll see improvement in 2-3 weeks.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// BASIC VIEW - BIOMECHANICAL ANALYSIS
// Stars and simple visuals
// ============================================

export function BasicBiomechanicalAnalysis({ analysisData, playerName }: { analysisData: SimplifiedTabsProps['analysisData'], playerName: string }) {
  const score = analysisData.overallScore
  const stats = analysisData.shootingStats
  
  // 3 simple categories
  const categories = [
    { name: 'Arms', value: Math.round(((stats.form || 75) + (stats.elbow || 75)) / 2), color: '#3b82f6' },
    { name: 'Legs', value: Math.round(((stats.balance || 75) + (stats.release || 75)) / 2), color: '#22c55e' },
    { name: 'Shot', value: Math.round(((stats.followThrough || 75) + (stats.arc || 75)) / 2), color: '#FFD700' },
  ]

  return (
    <div className="space-y-6">
      {/* Big Score Display */}
      <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a] text-center">
        <p className="text-[#888] text-sm mb-2">Your Score</p>
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5 border-4 border-[#FFD700]/50 mb-3">
          <span className="text-4xl font-black text-[#FFD700]">{score}</span>
        </div>
        <div className="flex justify-center mb-2">
          <StarRating count={getKidStars(score)} size="lg" />
        </div>
        <p className="text-[#FFD700] font-bold">
          {score >= 85 ? 'SUPER!' : score >= 75 ? 'GREAT!' : score >= 65 ? 'GOOD!' : 'NICE TRY!'}
        </p>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.name} className="bg-[#2a2a2a] rounded-lg p-4 border border-[#3a3a3a] text-center">
            <p className="text-white font-bold text-lg mb-2">{cat.name}</p>
            <div className="text-3xl font-black mb-2" style={{ color: cat.color }}>{cat.value}</div>
            <StarRating count={getKidStars(cat.value)} />
            <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden mt-3">
              <div 
                className="h-full rounded-full" 
                style={{ width: `${cat.value}%`, backgroundColor: cat.color }} 
              />
            </div>
          </div>
        ))}
      </div>

      {/* Simple Feedback */}
      <div className="bg-gradient-to-r from-[#FFD700]/10 to-[#FFD700]/5 rounded-lg p-4 border border-[#FFD700]/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#FFD700]/20 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-[#FFD700]" />
          </div>
          <div>
            <p className="text-[#FFD700] font-bold">Great job, {playerName.split(' ')[0]}!</p>
            <p className="text-[#E5E5E5] text-sm">
              {categories.sort((a, b) => b.value - a.value)[0].name} is your best skill!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// BASIC VIEW - PLAYER ASSESSMENT
// ============================================

export function BasicPlayerAssessment({ analysisData, playerName }: { analysisData: SimplifiedTabsProps['analysisData'], playerName: string }) {
  const score = analysisData.overallScore
  const stars = getKidStars(score)
  
  const level = score >= 85 ? 'SUPERSTAR' 
    : score >= 75 ? 'ALL-STAR'
    : score >= 65 ? 'RISING STAR'
    : score >= 55 ? 'ROOKIE'
    : 'BEGINNER'

  return (
    <div className="space-y-6">
      {/* Level Card */}
      <div className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-lg p-6 border border-[#FFD700]/30 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-[#FFD700]/20 flex items-center justify-center mb-4">
          <Trophy className="w-10 h-10 text-[#FFD700]" />
        </div>
        <h2 className="text-3xl font-black text-white mb-2">{playerName.split(' ')[0]}</h2>
        <p className="text-[#FFD700] text-2xl font-black mb-4">{level}</p>
        <div className="flex justify-center mb-2">
          <StarRating count={stars} size="lg" />
        </div>
        <p className="text-[#888]">{stars} out of 5 stars!</p>
      </div>

      {/* What You're Good At */}
      <div className="bg-[#2a2a2a] rounded-lg p-4 border border-green-500/30">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <h3 className="text-green-400 font-bold">What You&apos;re Good At!</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {analysisData.shootingStats.form >= 70 && (
            <span className="px-3 py-2 bg-green-500/20 rounded-lg text-green-400 text-sm font-medium">Strong Arms</span>
          )}
          {analysisData.shootingStats.balance >= 70 && (
            <span className="px-3 py-2 bg-green-500/20 rounded-lg text-green-400 text-sm font-medium">Good Balance</span>
          )}
          {analysisData.shootingStats.followThrough >= 70 && (
            <span className="px-3 py-2 bg-green-500/20 rounded-lg text-green-400 text-sm font-medium">Nice Follow Through</span>
          )}
          {analysisData.shootingStats.arc >= 70 && (
            <span className="px-3 py-2 bg-green-500/20 rounded-lg text-green-400 text-sm font-medium">Great Arc</span>
          )}
        </div>
      </div>

      {/* Fun Fact */}
      <div className="bg-[#2a2a2a] rounded-lg p-4 border border-[#3a3a3a]">
        <div className="flex items-center gap-3">
          <Lightbulb className="w-8 h-8 text-[#FFD700]" />
          <div>
            <p className="text-white font-bold">Fun Fact!</p>
            <p className="text-[#888] text-sm">
              {score >= 80 
                ? "You&apos;re shooting like an NBA player! Keep it up!" 
                : score >= 65 
                  ? "You're getting better every day! Amazing progress!" 
                  : "Every great player started just like you! Keep practicing!"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// BASIC VIEW - TRAINING PLAN
// ============================================

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function BasicTrainingPlan({ analysisData: _analysisData, playerName }: { analysisData: SimplifiedTabsProps['analysisData'], playerName: string }) {
  const drills = [
    { num: 1, name: 'Close Shots', desc: 'Stand close to the basket', count: '10 shots', color: '#3b82f6' },
    { num: 2, name: 'Free Throws', desc: 'From the free throw line', count: '10 shots', color: '#eab308' },
    { num: 3, name: 'Around the World', desc: 'Shoot from 5 different spots', count: '5 spots', color: '#22c55e' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#2a2a2a] rounded-lg p-5 border border-[#3a3a3a] text-center">
        <Calendar className="w-10 h-10 text-[#FFD700] mx-auto mb-2" />
        <h2 className="text-xl font-black text-[#FFD700]">Practice Time!</h2>
        <p className="text-[#888]">Fun drills to get better</p>
      </div>

      {/* Drills */}
      <div className="space-y-3">
        {drills.map((drill) => (
          <div key={drill.num} className="bg-[#2a2a2a] rounded-lg overflow-hidden border border-[#3a3a3a]">
            <div className="flex items-center gap-4 p-4">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-xl font-black"
                style={{ backgroundColor: `${drill.color}20`, color: drill.color }}
              >
                {drill.num}
              </div>
              <div className="flex-1">
                <p className="text-white font-bold">{drill.name}</p>
                <p className="text-[#888] text-sm">{drill.desc}</p>
              </div>
              <div className="text-right">
                <p className="font-bold" style={{ color: drill.color }}>{drill.count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-[#FFD700]" />
          <h4 className="text-[#FFD700] font-bold">Remember!</h4>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#2a2a2a] p-3 rounded-lg text-center">
            <Target className="w-6 h-6 text-[#FFD700] mx-auto mb-1" />
            <p className="text-[#E5E5E5] text-xs">Look at basket</p>
          </div>
          <div className="bg-[#2a2a2a] p-3 rounded-lg text-center">
            <Activity className="w-6 h-6 text-[#FFD700] mx-auto mb-1" />
            <p className="text-[#E5E5E5] text-xs">Bend knees</p>
          </div>
          <div className="bg-[#2a2a2a] p-3 rounded-lg text-center">
            <Zap className="w-6 h-6 text-[#FFD700] mx-auto mb-1" />
            <p className="text-[#E5E5E5] text-xs">Follow through</p>
          </div>
        </div>
      </div>

      {/* Encouragement */}
      <div className="bg-gradient-to-r from-[#FFD700]/10 to-[#FFD700]/5 rounded-lg p-5 border border-[#FFD700]/20 text-center">
        <Star className="w-10 h-10 text-[#FFD700] mx-auto mb-2" />
        <p className="text-[#FFD700] font-bold text-lg">You&apos;ve got this, {playerName.split(' ')[0]}!</p>
        <p className="text-[#888] text-sm">Practice makes perfect!</p>
      </div>
    </div>
  )
}
