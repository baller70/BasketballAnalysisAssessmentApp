"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import Image from "next/image"
import { 
  ArrowLeft,
  ArrowRight,
  Check,
  Target,
  Flame,
  Trophy,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  Clock,
  Activity,
  Zap,
  Star,
  Lightbulb,
  RotateCcw,
  Bell,
  Sparkles
} from "lucide-react"
import { usePoints } from "@/lib/points/pointsContext"
import { InlinePointsBurst } from "@/components/points/PointsBurst"
import { getAllSessions } from "@/services/sessionStorage"
import {
  fetchServerHistory,
  computeCardAnalytics,
  type ScoredRecord,
} from "@/components/analytics/serverHistory"

// ============================================
// TYPES & DATA
// ============================================

interface AnalyticsData {
  totalSessions: number
  averageScore: number
  progressPercent: number
  trendDirection: 'up' | 'down' | 'stable'
  trendPercent: number
  currentStreak: number
  bestStreak: number
  thisWeekSessions: number
  lastWeekSessions: number
  totalPracticeMinutes: number
  activeDays: number[]  // Array of day numbers (1-31) that had activity this month
}

type AnalyticsMetricKey = 
  | 'sessions'
  | 'averageScore'
  | 'progress'
  | 'trend'
  | 'timeline'
  | 'analyticsChartBars'
  | 'analyticsChartMetrics'
  | 'streakStats'
  | 'activityCalendar'

// Metric explanations and display info
const ANALYTICS_METRICS: Record<AnalyticsMetricKey, {
  title: string
  subtitle: string
  explanation: string
  whyItMatters: string
  tip: string
}> = {
  sessions: {
    title: "TOTAL SESSIONS",
    subtitle: "LIFETIME PRACTICE",
    explanation: "This shows how many analysis sessions you've completed since you started using ShotIQ.",
    whyItMatters: "Every session is a step toward mastery. The more you analyze, the more you understand your shot.",
    tip: "Aim for at least 3 sessions per week to see consistent improvement in your form!"
  },
  averageScore: {
    title: "AVERAGE SCORE",
    subtitle: "OVERALL PERFORMANCE",
    explanation: "Your average shooting form score across all sessions. This represents your typical performance level.",
    whyItMatters: "This number tells you where you stand overall. Watch it climb as you put in the work!",
    tip: "Focus on fixing your biggest flaw first - it'll have the biggest impact on this score."
  },
  progress: {
    title: "PROGRESS",
    subtitle: "YOUR IMPROVEMENT",
    explanation: "How much your form score has improved since your first session. This is your growth story!",
    whyItMatters: "Progress proves that practice works. Even small gains add up to big improvements over time.",
    tip: "Compare your latest session to your first - you'll be surprised how far you've come!"
  },
  trend: {
    title: "CURRENT TREND",
    subtitle: "RECENT MOMENTUM",
    explanation: "Your performance direction over the last 7 days. Are you heating up or cooling down?",
    whyItMatters: "Trends show if your recent practice is paying off. A positive trend means you're on fire!",
    tip: "If your trend is down, don't worry - review your recent sessions and focus on one thing at a time."
  },
  timeline: {
    title: "SESSION TIMELINE",
    subtitle: "YOUR JOURNEY",
    explanation: "A visual history of your sessions over time. See when you practiced and how you performed.",
    whyItMatters: "Patterns in your timeline reveal your best practice habits and when you perform your best.",
    tip: "Notice any patterns? Many players shoot better in the morning or after a good warm-up."
  },
  analyticsChartBars: {
    title: "PERFORMANCE CHART",
    subtitle: "SCORE HISTORY",
    explanation: "Your performance visualized as a segmented chart. Each bar represents a session, with segments showing your score level.",
    whyItMatters: "This chart reveals your consistency and progress at a glance. Watch those bars grow taller over time!",
    tip: "Aim for all segments to be filled - that means you're hitting elite performance levels!"
  },
  analyticsChartMetrics: {
    title: "MECHANICS BREAKDOWN",
    subtitle: "FORM ANALYSIS",
    explanation: "A detailed breakdown of your shooting mechanics across all key measurements: Elbow, Shoulder, Hip, Knee, and Release.",
    whyItMatters: "This shows your strengths and weaknesses at a glance. Know what to celebrate and what to work on!",
    tip: "Focus on bringing your lowest metric up rather than perfecting your highest one."
  },
  streakStats: {
    title: "STREAK STATISTICS",
    subtitle: "CONSISTENCY TRACKER",
    explanation: "Your current and best practice streaks. How many days in a row have you been putting in work?",
    whyItMatters: "Consistency beats intensity. A strong streak shows dedication and builds lasting habits.",
    tip: "Try to practice at the same time each day - it makes maintaining streaks much easier!"
  },
  activityCalendar: {
    title: "ACTIVITY CALENDAR",
    subtitle: "MONTHLY OVERVIEW",
    explanation: "See which days you practiced this month. Green days mean you showed up and put in work!",
    whyItMatters: "Visual proof of your commitment. Fill up that calendar and watch your skills grow!",
    tip: "Aim for at least 12 active days per month - that's 3 sessions per week!"
  }
}

const METRIC_KEYS: AnalyticsMetricKey[] = [
  'sessions',
  'averageScore', 
  'progress',
  'trend',
  'timeline',
  'analyticsChartBars',
  'analyticsChartMetrics',
  'streakStats',
  'activityCalendar'
]

// ============================================
// HELPER FUNCTIONS
// ============================================

function getScoreColor(score: number): string {
  if (score >= 90) return '#22c55e' // Green
  if (score >= 75) return '#84cc16' // Lime
  if (score >= 60) return '#FF6B35' // Orange
  if (score >= 45) return '#f59e0b' // Amber
  return '#ef4444' // Red
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Elite'
  if (score >= 75) return 'Great'
  if (score >= 60) return 'Good'
  if (score >= 45) return 'Developing'
  return 'Beginner'
}

function getTrendColor(direction: 'up' | 'down' | 'stable'): string {
  if (direction === 'up') return '#22c55e'
  if (direction === 'down') return '#ef4444'
  return '#888888'
}

// ============================================
// INDIVIDUAL CARD COMPONENT
// ============================================

interface AnalyticsCardProps {
  metricKey: AnalyticsMetricKey
  data: AnalyticsData
  dragX: number
}

function AnalyticsCard({ metricKey, data, dragX }: AnalyticsCardProps) {
  const metric = ANALYTICS_METRICS[metricKey]
  const cardRef = useRef<HTMLDivElement>(null)
  const [arrowTop, setArrowTop] = useState(50) // percentage from top
  
  // Calculate swipe indicators
  const showKeepItUp = dragX > 50
  const showWorkOnIt = dragX < -50
  
  // Track scroll to position arrows within card bounds
  useEffect(() => {
    const handleScroll = () => {
      if (!cardRef.current) return
      
      const cardRect = cardRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      
      // Card boundaries
      const cardTop = cardRect.top
      const cardBottom = cardRect.bottom
      const cardHeight = cardRect.height
      
      // Viewport center
      const viewportCenter = viewportHeight / 2
      
      // Calculate where the arrow should be positioned
      // If card is fully visible, center the arrow
      // If card extends beyond viewport, position arrow at viewport center but clamped to card bounds
      
      if (cardTop >= 0 && cardBottom <= viewportHeight) {
        // Card is fully visible - center arrows in card
        setArrowTop(50)
      } else {
        // Card extends beyond viewport - position at viewport center relative to card
        const relativeCenter = viewportCenter - cardTop
        const percentage = (relativeCenter / cardHeight) * 100
        // Clamp between 15% and 85% to keep arrows within card with padding
        const clamped = Math.max(15, Math.min(85, percentage))
        setArrowTop(clamped)
      }
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial calculation
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  // Render different content based on metric type
  const renderMetricContent = () => {
    switch (metricKey) {
      case 'sessions':
        return (
          <div className="text-center py-6">
            <p className="text-7xl font-black text-slate-900 mb-2">{data.totalSessions}</p>
            <p className="text-slate-500 text-sm uppercase tracking-wider">Total Sessions</p>
            <div className="flex justify-center gap-8 mt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-[#FF6B35]">{data.thisWeekSessions}</p>
                <p className="text-slate-400 text-xs">This Week</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-500">{data.lastWeekSessions}</p>
                <p className="text-slate-400 text-xs">Last Week</p>
              </div>
            </div>
          </div>
        )
        
      case 'averageScore':
        const scoreColor = getScoreColor(data.averageScore)
        const scoreLabel = getScoreLabel(data.averageScore)
        // Calculate arc for circular gauge
        const circumference = 2 * Math.PI * 85 // radius = 85
        const strokeDashoffset = circumference - (data.averageScore / 100) * circumference * 0.75 // 270 degrees = 0.75 of circle
        const rotation = -225 // Start from bottom-left
        
        return (
          <div className="py-4">
            {/* Circular Gauge */}
            <div className="relative w-52 h-52 mx-auto">
              {/* Outer glow effect */}
              <div 
                className="absolute inset-0 rounded-full blur-xl opacity-30"
                style={{ backgroundColor: scoreColor }}
              />
              
              {/* SVG Gauge */}
              <svg className="w-full h-full transform" viewBox="0 0 200 200">
                {/* Background track */}
                <circle
                  cx="100"
                  cy="100"
                  r="85"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference * 0.75}
                  strokeDashoffset={0}
                  transform={`rotate(${rotation} 100 100)`}
                />
                
                {/* Gradient definition */}
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={scoreColor} stopOpacity="0.6" />
                    <stop offset="50%" stopColor={scoreColor} />
                    <stop offset="100%" stopColor={scoreColor} stopOpacity="0.8" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Progress arc with glow */}
                <circle
                  cx="100"
                  cy="100"
                  r="85"
                  fill="none"
                  stroke="url(#scoreGradient)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference * 0.75}
                  strokeDashoffset={strokeDashoffset}
                  transform={`rotate(${rotation} 100 100)`}
                  filter="url(#glow)"
                  className="transition-all duration-1000 ease-out"
                />
                
                {/* Tick marks */}
                {[0, 25, 50, 75, 100].map((tick, i) => {
                  const angle = (tick / 100) * 270 - 225
                  const radian = (angle * Math.PI) / 180
                  const x1 = 100 + 70 * Math.cos(radian)
                  const y1 = 100 + 70 * Math.sin(radian)
                  const x2 = 100 + 78 * Math.cos(radian)
                  const y2 = 100 + 78 * Math.sin(radian)
                  return (
                    <line
                      key={tick}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#94a3b8"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  )
                })}
              </svg>
              
              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-center">
                  <div className="flex items-baseline justify-center">
                    <span 
                      className="text-6xl font-black tracking-tight"
                      style={{ 
                        color: scoreColor,
                        textShadow: `0 0 30px ${scoreColor}40`
                      }}
                    >
                      {data.averageScore}
                    </span>
                    <span className="text-2xl font-bold text-slate-400 ml-1">%</span>
                  </div>
                  <div 
                    className="mt-2 px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-wider"
                    style={{ 
                      backgroundColor: `${scoreColor}20`, 
                      color: scoreColor,
                      border: `1px solid ${scoreColor}40`
                    }}
                  >
                    {scoreLabel}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Score breakdown */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-1">Best</p>
                <p className="text-green-500 text-xl font-black">92%</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-1">Average</p>
                <p className="text-xl font-black" style={{ color: scoreColor }}>{data.averageScore}%</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-1">Lowest</p>
                <p className="text-red-400 text-xl font-black">58%</p>
              </div>
            </div>
            
            {/* Comparison to elite */}
            <div className="mt-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-sm font-medium">vs. Elite Players</span>
                <span className="text-[#FF6B35] text-sm font-bold">Top 25%</span>
              </div>
              <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#FF6B35] to-[#ffaa77] rounded-full"
                  style={{ width: `${data.averageScore}%` }}
                />
                {/* Elite marker */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white/60"
                  style={{ left: '85%' }}
                />
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                <span>Beginner</span>
                <span>Elite (85%+)</span>
              </div>
            </div>
          </div>
        )
        
      case 'progress':
        const isPositive = data.progressPercent >= 0
        return (
          <div className="text-center py-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              {isPositive ? (
                <TrendingUp className="w-10 h-10 text-green-500" />
              ) : (
                <TrendingDown className="w-10 h-10 text-red-500" />
              )}
              <p className={`text-6xl font-black ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? '+' : ''}{data.progressPercent}%
              </p>
            </div>
            <p className="text-slate-500 text-sm">Since your first session</p>
            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Total Practice Time</p>
              <p className="text-slate-900 text-2xl font-bold">{Math.floor(data.totalPracticeMinutes / 60)}h {data.totalPracticeMinutes % 60}m</p>
            </div>
          </div>
        )
        
      case 'trend':
        const trendColor = getTrendColor(data.trendDirection)
        return (
          <div className="text-center py-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              {data.trendDirection === 'up' && <TrendingUp className="w-12 h-12" style={{ color: trendColor }} />}
              {data.trendDirection === 'down' && <TrendingDown className="w-12 h-12" style={{ color: trendColor }} />}
              {data.trendDirection === 'stable' && <Activity className="w-12 h-12" style={{ color: trendColor }} />}
              <p className="text-5xl font-black" style={{ color: trendColor }}>
                {data.trendDirection === 'up' ? '+' : data.trendDirection === 'down' ? '-' : ''}{data.trendPercent}%
              </p>
            </div>
            <p 
              className="text-lg font-bold uppercase"
              style={{ color: trendColor }}
            >
              {data.trendDirection === 'up' ? 'Trending Up!' : data.trendDirection === 'down' ? 'Needs Attention' : 'Holding Steady'}
            </p>
            <p className="text-slate-500 text-sm mt-2">Last 7 days performance</p>
          </div>
        )
        
      case 'timeline':
        // Simple timeline visualization
        const timelineData = [65, 68, 72, 70, 75, 78, 82, data.averageScore]
        return (
          <div className="py-6">
            <div className="flex items-end justify-between h-32 gap-2">
              {timelineData.map((score, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full rounded-t-lg transition-all duration-300"
                    style={{ 
                      height: `${score}%`, 
                      backgroundColor: idx === timelineData.length - 1 ? '#FF6B35' : '#e2e8f0'
                    }}
                  />
                  <span className="text-[10px] text-slate-400">{idx === timelineData.length - 1 ? 'Now' : `W${idx + 1}`}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-slate-500 text-sm mt-4">Score progression over 8 weeks</p>
          </div>
        )
        
      case 'analyticsChartBars':
        // Premium segmented bar chart like the original analytics page
        const chartData = [
          { score: 65, label: 'W1' },
          { score: 68, label: 'W2' },
          { score: 72, label: 'W3' },
          { score: 70, label: 'W4' },
          { score: 75, label: 'W5' },
          { score: 78, label: 'W6' },
          { score: 82, label: 'W7' },
          { score: data.averageScore, label: 'Now' },
        ]
        return (
          <div className="py-4">
            {/* Chart Header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-4 h-4 bg-gradient-to-br from-teal-400 to-cyan-400 rounded"></div>
              <h4 className="text-sm font-bold text-slate-700 uppercase">Performance Over Time</h4>
            </div>
            
            {/* Chart Container */}
            <div className="relative h-48">
              {/* Y-Axis Labels */}
              <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-right pr-2">
                {[100, 75, 50, 25, 0].map(v => (
                  <span key={v} className="text-[10px] text-slate-400 font-medium">{v}</span>
                ))}
              </div>
              
              {/* Grid Lines */}
              <div className="absolute left-10 right-0 top-0 bottom-8">
                {[0, 1, 2, 3, 4].map(i => (
                  <div 
                    key={i} 
                    className="absolute w-full border-t border-slate-200/50" 
                    style={{ top: `${i * 25}%` }}
                  />
                ))}
              </div>
              
              {/* Segmented Bars */}
              <div className="absolute left-10 right-0 top-0 bottom-8 flex items-end justify-between gap-2">
                {chartData.map((point, i) => {
                  const segmentsFilled = Math.round((point.score / 100) * 10)
                  const isCurrentWeek = i === chartData.length - 1
                  
                  return (
                    <div 
                      key={i} 
                      className="flex-1 flex flex-col items-center h-full relative group"
                    >
                      <div className="w-full h-full flex flex-col-reverse gap-0.5">
                        {Array.from({ length: 10 }, (_, segmentIndex) => {
                          const isFilled = segmentIndex < segmentsFilled
                          
                          return (
                            <div
                              key={segmentIndex}
                              className={`w-full transition-all duration-300 rounded-sm ${
                                isFilled 
                                  ? isCurrentWeek
                                    ? 'bg-gradient-to-b from-[#FF6B35] via-[#ff8555] to-[#ffaa77]'
                                    : 'bg-gradient-to-b from-teal-600 via-cyan-500 to-emerald-400' 
                                  : 'bg-slate-200'
                              }`}
                              style={{
                                height: '10%',
                                opacity: isFilled ? 1 : 0.3,
                              }}
                            />
                          )
                        })}
                      </div>
                      
                      {/* Hover Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-xl whitespace-nowrap">
                          <p className={`font-bold text-xs ${isCurrentWeek ? 'text-[#FF6B35]' : 'text-teal-400'}`}>{point.score}%</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* X-Axis Labels */}
              <div className="absolute left-10 right-0 bottom-0 h-8 flex justify-between items-center">
                {chartData.map((point, i) => (
                  <span 
                    key={i} 
                    className={`text-[10px] font-medium uppercase text-center flex-1 ${
                      i === chartData.length - 1 ? 'text-[#FF6B35] font-bold' : 'text-slate-400'
                    }`}
                  >
                    {point.label}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gradient-to-br from-teal-600 to-emerald-400" />
                <span className="text-slate-500">Past Weeks</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gradient-to-br from-[#FF6B35] to-[#ffaa77]" />
                <span className="text-slate-500">Current</span>
              </div>
            </div>
          </div>
        )
        
      case 'analyticsChartMetrics':
        const metrics = [
          { label: 'Elbow Angle', value: 85, icon: '💪' },
          { label: 'Shoulder Alignment', value: 78, icon: '🎯' },
          { label: 'Hip Position', value: 92, icon: '⚡' },
          { label: 'Knee Bend', value: 70, icon: '🦵' },
          { label: 'Release Point', value: 88, icon: '🏀' },
        ]
        const avgMetricScore = Math.round(metrics.reduce((acc, m) => acc + m.value, 0) / metrics.length)
        return (
          <div className="py-4">
            {/* Overall Score Header */}
            <div className="flex items-center justify-between mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <span className="text-slate-500 text-sm font-medium">Overall Form Score</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black" style={{ color: getScoreColor(avgMetricScore) }}>{avgMetricScore}%</span>
                <span 
                  className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ backgroundColor: `${getScoreColor(avgMetricScore)}20`, color: getScoreColor(avgMetricScore) }}
                >
                  {getScoreLabel(avgMetricScore)}
                </span>
              </div>
            </div>
            
            {/* Individual Metrics */}
            <div className="space-y-3">
              {metrics.map((m, idx) => {
                const segmentsFilled = Math.round((m.value / 100) * 10)
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-700 font-medium">{m.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-black" style={{ color: getScoreColor(m.value) }}>{m.value}%</span>
                      </div>
                    </div>
                    {/* Segmented Progress Bar */}
                    <div className="flex gap-0.5 h-3">
                      {Array.from({ length: 10 }, (_, segmentIndex) => {
                        const isFilled = segmentIndex < segmentsFilled
                        return (
                          <div
                            key={segmentIndex}
                            className={`flex-1 rounded-sm transition-all duration-300 ${
                              isFilled 
                                ? 'bg-gradient-to-b from-teal-600 via-cyan-500 to-emerald-400' 
                                : 'bg-slate-200'
                            }`}
                            style={{ opacity: isFilled ? 1 : 0.3 }}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-slate-400 text-xs">Lowest: <span className="text-red-400 font-bold">Knee Bend (70%)</span></span>
              <span className="text-slate-400 text-xs">Highest: <span className="text-green-400 font-bold">Hip Position (92%)</span></span>
            </div>
          </div>
        )
        
      case 'streakStats':
        return (
          <div className="py-6">
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#ff8f5a] flex items-center justify-center mb-2">
                  <Flame className="w-10 h-10 text-white" />
                </div>
                <p className="text-3xl font-black text-slate-900">{data.currentStreak}</p>
                <p className="text-slate-500 text-xs uppercase">Current Streak</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center mb-2">
                  <Trophy className="w-10 h-10 text-white" />
                </div>
                <p className="text-3xl font-black text-slate-900">{data.bestStreak}</p>
                <p className="text-slate-500 text-xs uppercase">Best Streak</p>
              </div>
            </div>
            {data.currentStreak >= data.bestStreak && data.currentStreak > 0 && (
              <p className="text-center text-[#FFD700] text-sm font-bold mt-4">🔥 You&apos;re on your best streak!</p>
            )}
          </div>
        )
        
      case 'activityCalendar':
        const daysInMonth = 31
        const activeDaysSet = new Set(data.activeDays)
        return (
          <div className="py-4">
            <div className="grid grid-cols-7 gap-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                <div key={idx} className="text-center text-slate-400 text-[10px] font-bold py-1">{day}</div>
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
                <div
                  key={day}
                  className={`
                    aspect-square rounded-md flex items-center justify-center text-xs font-medium
                    ${activeDaysSet.has(day) 
                      ? 'bg-green-500/20 text-green-500 border border-green-500/30' 
                      : 'bg-slate-100 text-slate-400'
                    }
                  `}
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30" />
                <span className="text-slate-500">Active</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-slate-100" />
                <span className="text-slate-500">Rest</span>
              </div>
            </div>
          </div>
        )
        
      default:
        return null
    }
  }
  
  return (
    <div className="relative">
      {/* Swipe Indicators - appear when swiping */}
      {showKeepItUp && (
        <div className="absolute -top-2 -right-2 z-20 bg-green-500 text-white px-4 py-2 rounded-full font-bold text-sm transform rotate-12 shadow-lg">
          Keep It Up! ✓
        </div>
      )}
      {showWorkOnIt && (
        <div className="absolute -top-2 -left-2 z-20 bg-blue-500 text-white px-4 py-2 rounded-full font-bold text-sm transform -rotate-12 shadow-lg">
          Work On It →
        </div>
      )}
      
      {/* Card with scroll-following swipe indicators */}
      <div ref={cardRef} className="bg-white rounded-3xl border-2 border-[#FF6B35]/50 overflow-hidden shadow-sm relative">
        {/* Left Swipe Indicator - follows scroll within card bounds */}
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
            {/* Arrow 1 - EXTRA FAT HOLLOW */}
            <path d="M32 5 L5 35 L32 65" stroke={dragX < -20 ? "#3b82f6" : "#94a3b8"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="1" className="transition-all duration-150" />
            <path d="M50 5 L23 35 L50 65" stroke={dragX < -20 ? "#3b82f6" : "#94a3b8"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="1" className="transition-all duration-150" />
            {/* Arrow 2 - EXTRA FAT HOLLOW */}
            <path d="M18 5 L-9 35 L18 65" stroke={dragX < -20 ? "#3b82f6" : "#94a3b8"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" className="transition-all duration-150" />
            <path d="M36 5 L9 35 L36 65" stroke={dragX < -20 ? "#3b82f6" : "#94a3b8"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" className="transition-all duration-150" />
            {/* Arrow 3 - EXTRA FAT HOLLOW */}
            <path d="M46 5 L19 35 L46 65" stroke={dragX < -20 ? "#3b82f6" : "#94a3b8"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" className="transition-all duration-150" />
            <path d="M64 5 L37 35 L64 65" stroke={dragX < -20 ? "#3b82f6" : "#94a3b8"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" className="transition-all duration-150" />
          </svg>
          {/* SWIPE text - turns BLUE when swiping left */}
          <svg width="100" height="40" viewBox="0 0 100 40" className="-ml-2">
            <defs>
              <style>
                @import url(&apos;https://fonts.googleapis.com/css2?family=Russo+One&amp;display=swap&apos;);
              </style>
            </defs>
            <text 
              x="50" 
              y="30" 
              textAnchor="middle" 
              fontSize="24" 
              fontWeight="400" 
              fontFamily="Russo One, Arial Black, sans-serif"
              fill="none" 
              stroke={dragX < -20 ? "#3b82f6" : "#94a3b8"}
              strokeWidth="1.5"
              letterSpacing="3"
              className="transition-all duration-150"
            >
              SWIPE
            </text>
          </svg>
        </div>
        
        {/* Right Swipe Indicator - follows scroll within card bounds */}
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
          {/* SWIPE text - turns GREEN when swiping right */}
          <svg width="100" height="40" viewBox="0 0 100 40" className="-mr-2">
            <defs>
              <style>
                @import url(&apos;https://fonts.googleapis.com/css2?family=Russo+One&amp;display=swap&apos;);
              </style>
            </defs>
            <text 
              x="50" 
              y="30" 
              textAnchor="middle" 
              fontSize="24" 
              fontWeight="400" 
              fontFamily="Russo One, Arial Black, sans-serif"
              fill="none" 
              stroke={dragX > 20 ? "#22c55e" : "#94a3b8"}
              strokeWidth="1.5"
              letterSpacing="3"
              className="transition-all duration-150"
            >
              SWIPE
            </text>
          </svg>
          <svg width="70" height="70" viewBox="0 0 70 70">
            {/* Arrow 1 - EXTRA FAT HOLLOW */}
            <path d="M38 5 L65 35 L38 65" stroke={dragX > 20 ? "#22c55e" : "#94a3b8"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="1" className="transition-all duration-150" />
            <path d="M20 5 L47 35 L20 65" stroke={dragX > 20 ? "#22c55e" : "#94a3b8"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="1" className="transition-all duration-150" />
            {/* Arrow 2 - EXTRA FAT HOLLOW */}
            <path d="M52 5 L79 35 L52 65" stroke={dragX > 20 ? "#22c55e" : "#94a3b8"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" className="transition-all duration-150" />
            <path d="M34 5 L61 35 L34 65" stroke={dragX > 20 ? "#22c55e" : "#94a3b8"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" className="transition-all duration-150" />
            {/* Arrow 3 - EXTRA FAT HOLLOW */}
            <path d="M24 5 L51 35 L24 65" stroke={dragX > 20 ? "#22c55e" : "#94a3b8"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" className="transition-all duration-150" />
            <path d="M6 5 L33 35 L6 65" stroke={dragX > 20 ? "#22c55e" : "#94a3b8"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" className="transition-all duration-150" />
          </svg>
        </div>
        {/* Premium Banner - Inspired by Analysis Tab */}
        <div className="relative h-28 overflow-hidden bg-gradient-to-br from-[#FF6B35]/10 via-white to-white">
          {/* Glowing Orbs Background */}
          <div className="absolute inset-0 opacity-40">
            <div className="absolute -top-8 -left-8 w-32 h-32 bg-[#FF6B35]/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-[#FF6B35]/20 rounded-full blur-2xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#FF6B35]/10 rounded-full blur-3xl" />
          </div>
          
          {/* Large Icon with Glow Effect */}
          <div className="absolute inset-0 flex items-center justify-end pr-6">
            <div className="relative w-24 h-24">
              {/* Glow behind icon */}
              <div className="absolute inset-0 bg-[#FF6B35] blur-xl scale-125 opacity-15" />
              <div className="absolute inset-0 bg-[#FF6B35] blur-md scale-110 opacity-10" />
              {/* Icon - inverted to white, more faded */}
              <Image
                src="/images/Analytics Ball v1.png"
                alt="Analytics"
                width={96}
                height={96}
                className="relative z-10 w-full h-full object-contain drop-shadow-2xl opacity-30"
                style={{ filter: 'brightness(0.8) drop-shadow(0 0 15px rgba(255, 107, 53, 0.15))' }}
              />
            </div>
          </div>
          
          {/* Title & Subtitle */}
          <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10">
            <h3 className="text-slate-900 font-black text-xl uppercase tracking-wider drop-shadow-lg">{metric.title}</h3>
            <p className="text-[#FF6B35] text-sm font-semibold uppercase tracking-wider mt-1">{metric.subtitle}</p>
          </div>
          
          {/* Bottom Gradient Line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF6B35]/60 to-transparent" />
        </div>
        
        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Metric Content */}
          {renderMetricContent()}
          
          {/* Explanation */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-[#FF6B35]" />
              <p className="text-[#FF6B35] text-xs font-semibold uppercase tracking-wider">What This Means</p>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">{metric.explanation}</p>
          </div>
          
          {/* Why It Matters */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-green-500" />
              <p className="text-green-500 text-xs font-semibold uppercase tracking-wider">Why It Matters</p>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">{metric.whyItMatters}</p>
          </div>
          
          {/* Pro Tip */}
          <div className="bg-[#FF6B35]/10 rounded-xl p-4 border border-[#FF6B35]/30">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-[#FF6B35]" />
              <p className="text-[#FF6B35] text-xs font-semibold uppercase tracking-wider">Pro Tip</p>
            </div>
            <p className="text-[#FF6B35]/80 text-sm leading-relaxed">{metric.tip}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

interface AnalyticsCardGameProps {
  data?: AnalyticsData
}

// Default demo data
const DEFAULT_DATA: AnalyticsData = {
  totalSessions: 47,
  averageScore: 76,
  progressPercent: 18,
  trendDirection: 'up',
  trendPercent: 5,
  currentStreak: 4,
  bestStreak: 7,
  thisWeekSessions: 5,
  lastWeekSessions: 3,
  totalPracticeMinutes: 423,
  activeDays: [1, 2, 5, 6, 8, 9, 12, 13, 15, 16, 19, 20, 22, 23, 26, 27, 29, 30]
}

export function AnalyticsCardGame({ data: dataProp }: AnalyticsCardGameProps) {
  // Points system
  const { earnPoints } = usePoints()
  const [showPointsBurst, setShowPointsBurst] = useState(false)

  // Real analytics: when no explicit `data` prop is supplied we derive the
  // aggregate from the user's actual sessions — the on-device localStorage cache
  // MERGED with the server-side analysis history (GET /api/analysis-history) so
  // progress survives across devices. `null` means "still loading"; an empty
  // result renders an honest empty state instead of a fabricated demo number
  // (audit: dashboard/analytics were fed mock data).
  const [loadedData, setLoadedData] = useState<AnalyticsData | null>(
    dataProp ?? null
  )
  const [isLoading, setIsLoading] = useState(!dataProp)

  useEffect(() => {
    if (dataProp) {
      setLoadedData(dataProp)
      setIsLoading(false)
      return
    }
    let cancelled = false
    const load = async () => {
      setIsLoading(true)
      const records: ScoredRecord[] = []
      // Local (offline) cache first.
      try {
        const local = getAllSessions()
        if (Array.isArray(local)) {
          local.forEach((s) => {
            const score = s.analysisData?.overallScore
            if (typeof score === "number" && Number.isFinite(score)) {
              records.push({ timestamp: s.timestamp ?? new Date(s.date).getTime(), score })
            }
          })
        }
      } catch {
        /* ignore local cache errors */
      }
      // Server history (source of truth, cross-device).
      const seenDays = new Set(
        records.map((r) => {
          const d = new Date(r.timestamp)
          d.setHours(0, 0, 0, 0)
          return `${d.getTime()}:${Math.round(r.score)}`
        })
      )
      const { history } = await fetchServerHistory(100)
      history.forEach((h) => {
        const score = h.scores.overall
        if (typeof score === "number" && Number.isFinite(score)) {
          const ts = new Date(h.recordedAt).getTime()
          const d = new Date(ts)
          d.setHours(0, 0, 0, 0)
          const key = `${d.getTime()}:${Math.round(score)}`
          // De-dupe entries already present in the local cache.
          if (!seenDays.has(key)) {
            records.push({ timestamp: ts, score })
            seenDays.add(key)
          }
        }
      })

      if (cancelled) return
      setLoadedData(computeCardAnalytics(records))
      setIsLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [dataProp])

  const data: AnalyticsData = loadedData ?? DEFAULT_DATA

  const [currentIndex, setCurrentIndex] = useState(0)
  const [gameStats, setGameStats] = useState({
    keepItUp: 0,
    workOnIt: 0,
    xp: 0
  })
  const [hasNewAnalytics, setHasNewAnalytics] = useState(true) // Show notification for new analytics
  const [lastReviewedCount, setLastReviewedCount] = useState(0)
  
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startX = useRef(0)
  const cardRef = useRef<HTMLDivElement>(null)

  const currentMetricKey = METRIC_KEYS[currentIndex]
  
  // Check if there are new analytics to review
  useEffect(() => {
    // In a real app, this would compare with stored data
    // For demo, show notification if user hasn't reviewed all cards yet
    if (currentIndex === 0 && gameStats.keepItUp === 0 && gameStats.workOnIt === 0) {
      setHasNewAnalytics(true)
    }
  }, [currentIndex, gameStats])
  
  // Reset/Start Over function
  const handleStartOver = useCallback(() => {
    setCurrentIndex(0)
    setGameStats({ keepItUp: 0, workOnIt: 0, xp: 0 })
    setHasNewAnalytics(false)
  }, [])

  const handleAction = useCallback((action: 'keepItUp' | 'workOnIt') => {
    if (action === 'keepItUp') {
      setGameStats(prev => ({
        ...prev,
        keepItUp: prev.keepItUp + 1,
        xp: prev.xp + 15
      }))
    } else {
      setGameStats(prev => ({
        ...prev,
        workOnIt: prev.workOnIt + 1,
        xp: prev.xp + 20 // Slightly more XP for acknowledging areas to improve
      }))
    }

    // Award +3 points for analytics card swipe
    earnPoints('analytics_card_swipe')
    setShowPointsBurst(true)
    setTimeout(() => setShowPointsBurst(false), 1500)

    if (currentIndex < METRIC_KEYS.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
    
    setDragX(0)
  }, [currentIndex, earnPoints])

  const handleStart = (clientX: number) => {
    setIsDragging(true)
    startX.current = clientX
  }

  const handleMove = (clientX: number) => {
    if (!isDragging) return
    const diff = clientX - startX.current
    setDragX(diff)
  }

  const handleEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    
    if (dragX > 100) {
      handleAction('keepItUp')
    } else if (dragX < -100) {
      handleAction('workOnIt')
    } else {
      setDragX(0)
    }
  }

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const goToNext = () => {
    if (currentIndex < METRIC_KEYS.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const isComplete = currentIndex >= METRIC_KEYS.length

  // Loading / empty states — only when we're deriving real data (no `data` prop).
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-[#FF6B35] animate-spin mb-4" />
        <p className="text-slate-500 text-sm uppercase tracking-wider">Loading your analytics…</p>
      </div>
    )
  }

  if (!loadedData || loadedData.totalSessions === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#FF6B35]/10 border border-[#FF6B35]/30 flex items-center justify-center mb-4">
          <BarChart3 className="w-8 h-8 text-[#FF6B35]" />
        </div>
        <h3 className="text-slate-900 font-bold text-lg uppercase tracking-wider mb-1">No analytics yet</h3>
        <p className="text-slate-500 text-sm max-w-xs">
          Complete a shot analysis to start tracking your progress. Your stats will appear here and sync across devices.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* New Analytics Notification */}
      {hasNewAnalytics && currentIndex === 0 && gameStats.keepItUp === 0 && gameStats.workOnIt === 0 && (
        <div className="bg-gradient-to-r from-[#FF6B35]/20 via-[#FF6B35]/10 to-[#FF6B35]/20 border border-[#FF6B35]/40 rounded-xl p-4 flex items-center gap-3 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-[#FF6B35]/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#FF6B35]" />
          </div>
          <div className="flex-1">
            <p className="text-slate-900 font-bold text-sm">New Analytics Available!</p>
            <p className="text-slate-500 text-xs">Swipe through {METRIC_KEYS.length} cards to review your performance</p>
          </div>
          <button 
            onClick={() => setHasNewAnalytics(false)}
            className="text-slate-400 hover:text-slate-600 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-wide">YOUR ANALYTICS</h2>
            <p className="text-[#FF6B35] text-sm font-semibold uppercase tracking-wider mt-1">PERFORMANCE INSIGHTS</p>
          </div>
          
          {/* Start Over Button - Always visible */}
          {(currentIndex > 0 || gameStats.keepItUp > 0 || gameStats.workOnIt > 0) && (
            <button
              onClick={handleStartOver}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 hover:border-[#FF6B35]/50 transition-all whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-sm font-semibold">Reset</span>
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-3 mt-4">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200">
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-slate-900 font-bold">{gameStats.keepItUp}</span>
            <span className="text-slate-400 text-sm">Strong</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200">
            <Target className="w-4 h-4 text-blue-500" />
            <span className="text-slate-900 font-bold">{gameStats.workOnIt}</span>
            <span className="text-slate-400 text-sm">Focus</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200">
            <Trophy className="w-4 h-4 text-[#FFD700]" />
            <span className="text-slate-900 font-bold">{gameStats.xp}</span>
            <span className="text-slate-400 text-sm">XP</span>
          </div>
        </div>
        
        <p className="text-slate-400 text-xs uppercase tracking-wider mt-4">SWIPE THROUGH YOUR STATS</p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">Card {currentIndex + 1} of {METRIC_KEYS.length}</span>
        <div className="flex gap-1">
          {METRIC_KEYS.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full ${idx < currentIndex ? 'bg-[#FF6B35]' : idx === currentIndex ? 'bg-green-500' : 'bg-slate-200'}`}
            />
          ))}
        </div>
      </div>

      {/* Card Area */}
      {!isComplete ? (
        <div
          ref={cardRef}
          className="relative cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => handleStart(e.clientX)}
          onMouseMove={(e) => handleMove(e.clientX)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={(e) => handleStart(e.touches[0].clientX)}
          onTouchMove={(e) => handleMove(e.touches[0].clientX)}
          onTouchEnd={handleEnd}
          style={{
            transform: `translateX(${dragX}px) rotate(${dragX * 0.02}deg)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out'
          }}
        >
          {/* GOLD Video Game Style Points Animation */}
          <InlinePointsBurst points={3} show={showPointsBurst} label="IQ" />
          <AnalyticsCard 
            metricKey={currentMetricKey}
            data={data}
            dragX={dragX}
          />
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 relative overflow-hidden shadow-sm">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-32 h-32 bg-[#FFD700] rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-[#FF6B35] rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-full flex items-center justify-center shadow-lg shadow-[#FFD700]/30">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-slate-900 text-2xl font-black mb-2 uppercase tracking-wide">Review Complete!</h3>
            <p className="text-slate-500 mb-6">You&apos;ve reviewed all {METRIC_KEYS.length} analytics cards</p>
            
            <div className="flex justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-green-500 text-3xl font-black">{gameStats.keepItUp}</p>
                <p className="text-slate-400 text-xs uppercase tracking-wider">Keep It Up</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-center">
                  <Target className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-blue-500 text-3xl font-black">{gameStats.workOnIt}</p>
                <p className="text-slate-400 text-xs uppercase tracking-wider">Work On It</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-xl flex items-center justify-center">
                  <Zap className="w-8 h-8 text-[#FFD700]" />
                </div>
                <p className="text-[#FFD700] text-3xl font-black">+{gameStats.xp}</p>
                <p className="text-slate-400 text-xs uppercase tracking-wider">XP Earned</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleStartOver}
                className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#ff8555] text-white px-8 py-4 rounded-xl font-bold uppercase tracking-wider transition-all shadow-lg shadow-[#FF6B35]/30 whitespace-nowrap"
              >
                <RotateCcw className="w-5 h-5" />
                Restart
              </button>
              <p className="text-slate-400 text-xs">Review again to change your ratings</p>
            </div>
          </div>
        </div>
      )}

      {/* Swipe Hint */}
      {!isComplete && (
        <div className="flex items-center justify-center gap-4 text-slate-400 text-sm">
          <span className="flex items-center gap-1">
            <ArrowLeft className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400">Focus</span>
          </span>
          <span>Swipe or Tap</span>
          <span className="flex items-center gap-1">
            <span className="text-green-500">Strong!</span>
            <ArrowRight className="w-4 h-4 text-green-500" />
          </span>
        </div>
      )}

      {/* Action Buttons */}
      {!isComplete && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => handleAction('workOnIt')}
            className="flex-1 bg-transparent border-2 border-blue-500/30 text-blue-400 py-4 rounded-xl font-bold uppercase tracking-wider hover:bg-blue-500/10 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Target className="w-5 h-5" />
            Focus
          </button>
          <button
            onClick={() => handleAction('keepItUp')}
            className="flex-1 bg-transparent border-2 border-green-500/30 text-green-500 py-4 rounded-xl font-bold uppercase tracking-wider hover:bg-green-500/10 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Check className="w-5 h-5" />
            Strong!
          </button>
        </div>
      )}

      {/* Navigation */}
      {!isComplete && (
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>
          <button
            onClick={goToNext}
            disabled={currentIndex >= METRIC_KEYS.length - 1}
            className="text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

export default AnalyticsCardGame

