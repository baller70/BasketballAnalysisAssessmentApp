"use client"

import React, { useState, useMemo, useEffect } from "react"
import { useAnalysisStore } from "@/stores/analysisStore"
import { getAllSessions, AnalysisSession } from "@/services/sessionStorage"
import {
  buildHistoricalChartData,
  fetchServerHistory,
  mergeLocalAndServerSessions,
  serverHistoryToSessions,
} from "@/components/analytics/serverHistory"
import { csrfFetch } from "@/lib/api/csrfFetch"
import { coachingMetricUnit } from "@/lib/coaching/coachingTarget"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar,
  TrendingUp,
  Clock,
  Activity,
  ChevronDown,
  Check,
  MoreVertical,
} from "lucide-react"

interface HistoricalCoachingTarget {
  id: string
  flaw: string
  cue: string
  drillName: string
  metric: string
  baseline: number
  targetValue: number
  direction: 'increase' | 'decrease'
  status: 'active' | 'improved' | 'no_change' | 'regression' | 'superseded'
  retestValue?: number | null
}

// Helper function to get shooter level
function getShooterLevel(score: number) {
  if (score >= 90) return { name: 'Elite', color: 'text-yellow-400' }
  if (score >= 80) return { name: 'Advanced', color: 'text-green-400' }
  if (score >= 70) return { name: 'Intermediate', color: 'text-blue-400' }
  if (score >= 60) return { name: 'Developing', color: 'text-orange-400' }
  return { name: 'Beginner', color: 'text-red-400' }
}

function measuredValue(values: Record<string, number>, keys: string[]): number | null {
  for (const key of keys) {
    const value = values[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
  }
  return null
}

// Analytics Chart Section Component
interface AnalyticsChartSectionProps {
  sessions: Array<{
    id: string
    date: Date
    score: number | null
    elbowAngle: number | null
    kneeAngle: number | null
    releaseAngle: number | null
    consistency: number | null
    formScore: number | null
    balanceScore: number | null
    releaseScore: number | null
    shooterLevel: string
    isLive: boolean
  }>
  progressStats: {
    sessionsCount?: number
    totalSessions?: number
    avgScore: number
    scoreChange: number
    bestScore?: number
    trend?: 'stable' | 'improving' | 'declining'
  }
  playerName: string
}

function AnalyticsChartSection({ sessions, playerName }: AnalyticsChartSectionProps) {
  const [timePeriod, setTimePeriod] = useState<'3months' | '30days' | '7days'>('3months')
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['score', 'elbowAngle'])
  const [hoveredBar, setHoveredBar] = useState<{ index: number; metric: string; value: number | null; date: string } | null>(null)
  const [metricsDropdownOpen, setMetricsDropdownOpen] = useState(false)
  
  const allMetrics = [
    { id: 'score', label: 'OVERALL SCORE', color: 'from-purple-600 to-purple-400', textColor: 'text-purple-400' },
    { id: 'elbowAngle', label: 'ELBOW ANGLE', color: 'from-blue-600 to-blue-400', textColor: 'text-blue-400' },
    { id: 'kneeAngle', label: 'KNEE ANGLE', color: 'from-green-600 to-green-400', textColor: 'text-green-400' },
    { id: 'releaseAngle', label: 'RELEASE ANGLE', color: 'from-orange-600 to-orange-400', textColor: 'text-orange-400' },
    { id: 'consistency', label: 'CONSISTENCY', color: 'from-pink-600 to-pink-400', textColor: 'text-pink-400' },
    { id: 'formScore', label: 'FORM SCORE', color: 'from-cyan-600 to-cyan-400', textColor: 'text-cyan-400' },
    { id: 'balanceScore', label: 'BALANCE', color: 'from-orange-600 to-orange-400', textColor: 'text-orange-400' },
    { id: 'releaseScore', label: 'RELEASE SCORE', color: 'from-red-600 to-red-400', textColor: 'text-red-400' }
  ]
  
  const filteredSessions = useMemo(() => {
    const safeSessions = sessions || []
    if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
      return []
    }
    
    const now = new Date()
    let cutoffDate: Date
    
    switch (timePeriod) {
      case '7days':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30days':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '3months':
      default:
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
    }
    
    return safeSessions.filter(s => s && s.date && new Date(s.date) >= cutoffDate).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }, [sessions, timePeriod])
  
  const chartData = useMemo(() => {
    return buildHistoricalChartData(filteredSessions).slice(-10)
  }, [filteredSessions])
  
  const toggleMetric = (metricId: string) => {
    setSelectedMetrics(prev => {
      if (prev.includes(metricId)) {
        if (prev.length === 1) return prev
        return prev.filter(m => m !== metricId)
      }
      return [...prev, metricId]
    })
  }
  
  const periodLabels: Record<string, string> = {
    '3months': 'LAST 3 MONTHS',
    '30days': 'LAST 30 DAYS',
    '7days': 'LAST 7 DAYS'
  }
  
  const periodDescriptions: Record<string, string> = {
    '3months': 'Total for the last 3 months',
    '30days': 'Total for the last 30 days',
    '7days': 'Total for the last 7 days'
  }

  return (
    <Card className="bg-[#2C2C2C] border-[#3a3a3a]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-xl text-[#E5E5E5] uppercase tracking-wider font-black">
              {playerName.toUpperCase()}&apos;S ANALYTICS CHART
            </CardTitle>
            <CardDescription className="text-[#888]">
              {periodDescriptions[timePeriod]}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {(['3months', '30days', '7days'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimePeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-bold uppercase transition-all ${
                  timePeriod === period
                    ? 'bg-[#1a1a1a] text-[#E5E5E5] border-2 border-[#FF6B35] shadow-lg shadow-[#FF6B35]/20'
                    : 'bg-transparent text-[#888] border border-[#3a3a3a] hover:text-[#E5E5E5] hover:border-[#FF6B35]/50'
                }`}
              >
                {periodLabels[period]}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#252525] border-[#3a3a3a] hover:border-[#FF6B35]/30 transition-all overflow-hidden relative">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#E5E5E5] mb-1">TOTAL SESSIONS</h3>
                  <p className="text-xs text-[#888]">{periodLabels[timePeriod]}</p>
                </div>
                <button className="text-[#888] hover:text-[#E5E5E5] transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              
              <div className="relative h-20 mb-4">
                <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
                  {[0, 15, 30, 45, 60].map((y) => (
                    <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="#3a3a3a" strokeWidth="0.5" />
                  ))}
                  {filteredSessions.length > 0 ? (
                    <polyline
                      points={Array.from({ length: Math.min(8, filteredSessions.length) }, (_, i) => {
                        const totalPoints = Math.min(8, filteredSessions.length);
                        const x = totalPoints > 1 ? (i / (totalPoints - 1)) * 200 : 100;
                        const progress = (i + 1) / totalPoints;
                        const y = 60 - (progress * 50);
                        return `${x},${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#FF6B35"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : (
                    <line x1="0" y1="50" x2="200" y2="50" stroke="#3a3a3a" strokeWidth="1" strokeDasharray="4,4" />
                  )}
                  {filteredSessions.length > 0 && (
                    <>
                      <circle cx="200" cy="10" r="4" fill="#FF6B35" />
                      <g transform="translate(150, 5)">
                        <rect x="0" y="0" width="50" height="12" rx="6" fill="#FF6B35" opacity="0.2" />
                        <text x="25" y="9" textAnchor="middle" fontSize="8" fill="#FF6B35" fontWeight="bold">+{filteredSessions.length}</text>
                      </g>
                    </>
                  )}
                </svg>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="h-2 bg-[#3a3a3a] rounded-full flex-1 mr-2">
                    <div 
                      className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF4500] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (filteredSessions.length / 10) * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-[#888]">{Math.min(100, Math.round((filteredSessions.length / 10) * 100))}%</span>
                </div>
              </div>
              
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-black text-[#FF6B35] leading-none">{filteredSessions.length}</span>
                </div>
                <p className="text-xs text-[#888]">Compare to last period</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Chart Header with Metrics Selector */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-[#E5E5E5] uppercase">ANALYTICS CHART</h3>
            <p className="text-[#888] text-sm">Last {chartData.length} data points</p>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setMetricsDropdownOpen(!metricsDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg text-[#E5E5E5] hover:border-[#FF6B35]/50 transition-all"
            >
              <span className="text-sm font-medium">Metrics ({selectedMetrics.length}/{allMetrics.length})</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${metricsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {metricsDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                <div className="p-2">
                  <p className="text-xs text-[#888] uppercase px-2 py-1 mb-2">SELECT METRICS TO DISPLAY</p>
                  {allMetrics.map(metric => (
                    <button
                      key={metric.id}
                      onClick={() => toggleMetric(metric.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                        selectedMetrics.includes(metric.id)
                          ? 'bg-[#2C2C2C] text-[#E5E5E5]'
                          : 'text-[#888] hover:bg-[#2C2C2C]/50'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        selectedMetrics.includes(metric.id) ? 'border-[#FF6B35] bg-[#FF6B35]' : 'border-[#3a3a3a]'
                      }`}>
                        {selectedMetrics.includes(metric.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${metric.color}`} />
                      <span className="text-sm">{metric.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4">
          {selectedMetrics.map(metricId => {
            const metric = allMetrics.find(m => m.id === metricId)
            if (!metric) return null
            return (
              <div key={metricId} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded bg-gradient-to-r ${metric.color}`} />
                <span className={`text-xs font-medium ${metric.textColor}`}>{metric.label}</span>
              </div>
            )
          })}
        </div>
        
        {/* Chart Area */}
        <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#252525] border-[#3a3a3a]">
          <CardContent className="p-6">
            {chartData.length === 0 ? (
              <div className="h-72 flex items-center justify-center">
                <p className="text-[#888] text-center">
                  No data available for this time period.<br />
                  <span className="text-sm">Complete some shooting analyses to see your progress!</span>
                </p>
              </div>
            ) : (
              <div className="relative h-72">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-4 h-4 bg-gradient-to-br from-teal-400 to-cyan-400 rounded"></div>
                  <h3 className="text-sm font-bold text-[#E5E5E5] uppercase">
                    {selectedMetrics.length > 0 
                      ? allMetrics.find(m => m.id === selectedMetrics[0])?.label || 'PERFORMANCE'
                      : 'PERFORMANCE'
                    }
                  </h3>
                </div>
                
                <div className="absolute left-0 top-8 bottom-12 w-10 flex flex-col justify-between text-right pr-2">
                  {[100, 75, 50, 25, 0].map(v => (
                    <span key={v} className="text-xs text-[#888] font-medium">{v}</span>
                  ))}
                </div>
                
                <div className="absolute left-12 right-4 top-8 bottom-12">
                  {[0, 1, 2, 3, 4].map(i => (
                    <div 
                      key={i} 
                      className="absolute w-full border-t border-[#3a3a3a]/30" 
                      style={{ top: `${i * 25}%` }}
                    />
                  ))}
                </div>
                
                <div className="absolute left-12 right-4 top-8 bottom-12 flex items-end justify-between gap-2 md:gap-4">
                  {chartData.slice(-8).map((point, i) => {
                    const primaryMetricId = selectedMetrics[0] || 'score'
                    const metric = allMetrics.find(m => m.id === primaryMetricId)
                    const rawValue = point[primaryMetricId as keyof typeof point]
                    const value = typeof rawValue === 'number' && Number.isFinite(rawValue) ? rawValue : null
                    const segmentsFilled = value == null ? 0 : Math.round((Math.max(0, Math.min(100, value)) / 100) * 10)
                    
                    return (
                      <div 
                        key={i} 
                        className="flex-1 flex flex-col items-center group cursor-pointer h-full relative"
                        onMouseEnter={() => setHoveredBar({ index: i, metric: primaryMetricId, value, date: point.dateLabel })}
                        onMouseLeave={() => setHoveredBar(null)}
                      >
                        <div className="w-full h-full flex flex-col-reverse gap-0.5">
                          {Array.from({ length: 10 }, (_, segmentIndex) => {
                            const isFilled = segmentIndex < segmentsFilled
                            
                            return (
                              <div
                                key={segmentIndex}
                                className={`w-full transition-all duration-300 ${
                                  isFilled 
                                    ? 'bg-gradient-to-b from-teal-600 via-cyan-500 to-emerald-400' 
                                    : 'bg-[#2a2a2a]'
                                }`}
                                style={{
                                  height: '10%',
                                  opacity: isFilled ? 1 : 0.3,
                                  transform: hoveredBar?.index === i ? 'scaleX(1.1)' : 'scaleX(1)',
                                  transition: 'all 0.2s ease'
                                }}
                              />
                            )
                          })}
                        </div>
                        
                        {hoveredBar?.index === i && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
                            <div className="bg-[#050505] border border-teal-400/50 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
                              <p className="text-teal-400 font-bold text-sm">{value == null ? '—' : `${value}%`}</p>
                              <p className="text-[#888] text-xs">{metric?.label}</p>
                              <p className="text-[#666] text-xs">{point.dateLabel}</p>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-teal-400/50" />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                
                <div className="absolute left-12 right-4 bottom-0 h-12 flex justify-between items-center">
                  {chartData.slice(-8).map((point, i) => {
                    const monthLabel = new Date(point.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
                    return (
                      <span key={i} className="text-xs font-medium text-[#888] uppercase text-center flex-1">
                        {monthLabel}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}

// Main Historical Data Section Component
export default function HistoricalDataSection() {
  const store = useAnalysisStore()

  const visionAnalysisResult = store?.visionAnalysisResult || null
  
  const [sessions, setSessions] = useState<AnalysisSession[]>([])
  const [viewMode, setViewMode] = useState<'sessions' | 'analytics' | 'heatmap'>('sessions')
  const [coachingTarget, setCoachingTarget] = useState<HistoricalCoachingTarget | null>(null)
  const [retestValue, setRetestValue] = useState('')
  const [retestPending, setRetestPending] = useState(false)
  const [retestMessage, setRetestMessage] = useState<string | null>(null)
  
  const safeViewMode = viewMode || 'sessions'
  
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      // 1) Local (offline) cache.
      let localSessions: AnalysisSession[] = []
      try {
        const loaded = getAllSessions()
        localSessions = Array.isArray(loaded) ? loaded : []
      } catch (error) {
        console.error('Error loading sessions:', error)
      }

      // 2) Server-side history (source of truth) — so progress survives across
      //    devices, not just on the device that produced the analysis.
      let serverSessions: AnalysisSession[] = []
      try {
        const { history } = await fetchServerHistory(100)
        serverSessions = serverHistoryToSessions(history)
      } catch {
        /* offline / unauthenticated — fall back to local only */
      }

      const merged = mergeLocalAndServerSessions(localSessions, serverSessions)

      if (cancelled) return
      setSessions(merged)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void fetch('/api/coaching-targets', { credentials: 'include' })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (!cancelled && payload?.target) {
          const target = payload.target as HistoricalCoachingTarget
          setCoachingTarget(target)
          if (target.retestValue != null) setRetestValue(String(target.retestValue))
        }
      })
      .catch(() => { /* signed-out history still renders local analytics */ })
    return () => { cancelled = true }
  }, [])

  const submitRetest = async () => {
    if (!coachingTarget) return
    const value = Number(retestValue)
    if (!Number.isFinite(value)) {
      setRetestMessage('Enter the latest measured value before retesting.')
      return
    }
    setRetestPending(true)
    setRetestMessage(null)
    try {
      const response = await csrfFetch('/api/coaching-targets', {
        method: 'POST',
        body: JSON.stringify({ targetId: coachingTarget.id, retestValue: value }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.target) {
        setRetestMessage(payload?.error || 'Unable to save the retest.')
        return
      }
      setCoachingTarget(payload.target as HistoricalCoachingTarget)
      setRetestMessage(payload.result?.message || 'Retest saved.')
    } catch {
      setRetestMessage('Unable to save the retest while offline.')
    } finally {
      setRetestPending(false)
    }
  }
  
  // Combine current session with historical sessions
  const allSessionsData = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- aggregates heterogeneous session/metric rows
    const data: any[] = []

    if (visionAnalysisResult?.success) {
      const angles = visionAnalysisResult.angles || {}
      const score = visionAnalysisResult.overall_score
      if (typeof score === 'number' && Number.isFinite(score)) {
        data.push({
          id: 'current',
          date: new Date(),
          displayDate: 'Today',
          score,
          elbowAngle: measuredValue(angles, ['right_elbow_angle', 'left_elbow_angle', 'elbow_angle']),
          kneeAngle: measuredValue(angles, ['right_knee_angle', 'left_knee_angle', 'knee_angle']),
          releaseAngle: measuredValue(angles, ['release_angle']),
          consistency: null,
          formScore: null,
          balanceScore: null,
          releaseScore: null,
          shooterLevel: getShooterLevel(score).name,
          isLive: true
        })
      }
    }
    
    sessions.forEach(session => {
      const angles = session.analysisData?.angles || {}
      const measurements = session.analysisData?.measurements || {}
      const score = session.analysisData?.overallScore
      if (typeof score !== 'number' || !Number.isFinite(score)) return
      data.push({
        id: session.id,
        date: new Date(session.date),
        displayDate: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score,
        elbowAngle: measuredValue(angles, ['right_elbow_angle', 'left_elbow_angle', 'elbow_angle', 'elbowAngle']),
        kneeAngle: measuredValue(angles, ['right_knee_angle', 'left_knee_angle', 'knee_angle', 'kneeAngle']),
        releaseAngle: measuredValue(angles, ['release_angle', 'releaseAngle']),
        consistency: measuredValue(measurements, ['consistencyScore', 'consistency_score']),
        formScore: measuredValue(measurements, ['formScore', 'form_score']),
        balanceScore: measuredValue(measurements, ['balanceScore', 'balance_score']),
        releaseScore: measuredValue(measurements, ['releaseScore', 'release_score']),
        shooterLevel: getShooterLevel(score).name,
        isLive: false
      })
    })
    
    return data.sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [visionAnalysisResult, sessions])
  
  // Calculate progress stats
  const progressStats = useMemo(() => {
    if (!allSessionsData || allSessionsData.length === 0) {
      return { scoreChange: 0, sessionsCount: 0, avgScore: 0, trend: 'stable' as const }
    }
    if (allSessionsData.length < 2) {
      return { scoreChange: 0, sessionsCount: allSessionsData.length, avgScore: allSessionsData[0]?.score || 0, trend: 'stable' as const }
    }
    
    const first = allSessionsData[0]
    const last = allSessionsData[allSessionsData.length - 1]
    if (!first || !last) {
      return { scoreChange: 0, sessionsCount: allSessionsData.length, avgScore: 0, trend: 'stable' as const }
    }
    const scoreChange = last.score - first.score
    const avgScore = allSessionsData.reduce((sum, s) => sum + (s?.score || 0), 0) / allSessionsData.length
    const trend = scoreChange > 5 ? 'improving' as const : scoreChange < -5 ? 'declining' as const : 'stable' as const
    
    return { scoreChange, sessionsCount: allSessionsData.length, avgScore: Math.round(avgScore), trend }
  }, [allSessionsData])
  
  return (
    <div className="space-y-6">
      {coachingTarget && (
        <Card className="border-[#FF6B35]/30 bg-gradient-to-r from-[#FF6B35]/10 to-amber-50 shadow-sm">
          <CardContent className="p-4 md:p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[#E55300]">ACTIVE COACHING TARGET</p>
                <h2 className="mt-1 text-xl font-black text-slate-900">{coachingTarget.flaw}</h2>
                <p className="mt-1 max-w-2xl text-sm text-slate-600">{coachingTarget.cue}</p>
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  {coachingTarget.drillName} · baseline {coachingTarget.baseline}{coachingMetricUnit(coachingTarget.metric)} → target {coachingTarget.targetValue}{coachingMetricUnit(coachingTarget.metric)}
                </p>
              </div>
              <div className="min-w-[16rem] rounded-xl bg-white/80 p-3 ring-1 ring-[#FF6B35]/20">
                <label htmlFor="coaching-retest" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Retest {coachingTarget.metric}
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    id="coaching-retest"
                    type="number"
                    value={retestValue}
                    onChange={(event) => setRetestValue(event.target.value)}
                    placeholder={`e.g. ${coachingTarget.targetValue}`}
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={submitRetest}
                    disabled={retestPending}
                    className="rounded-lg bg-[#FF6B35] px-3 py-2 text-xs font-bold text-white hover:bg-[#E55300] disabled:opacity-60"
                  >
                    {retestPending ? 'SAVING…' : 'RETEST'}
                  </button>
                </div>
                {(retestMessage || coachingTarget.status !== 'active') && (
                  <p className={`mt-2 text-xs font-bold ${coachingTarget.status === 'improved' ? 'text-green-700' : coachingTarget.status === 'regression' ? 'text-red-700' : 'text-slate-600'}`}>
                    {retestMessage || (coachingTarget.status === 'improved' ? 'Improvement recorded.' : coachingTarget.status === 'regression' ? 'Regression recorded.' : 'No change recorded.')}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* ================================================================ */}
      {/* OVERVIEW SECTION - Key Performance Indicators */}
      {/* ================================================================ */}
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider">Overview</h2>
            <p className="text-slate-500 text-sm">Your key performance metrics at a glance</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
            <Calendar className="w-4 h-4 text-[#FF6B35]" />
            <span className="text-slate-500 text-sm font-medium">Last 90 Days</span>
          </div>
        </div>
        
        {/* Stats Cards */}
        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {/* Premium Unified Stats Layout */}
            <div className="relative p-6 lg:p-8 overflow-hidden">
            {/* Background gradient mesh */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 left-0 w-96 h-96 bg-[#FF6B35]/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
            </div>
            
            {/* Unified Stats Container */}
            <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              {/* Sessions - Hero Number */}
              <div className="lg:col-span-4 relative group">
                <div className="relative bg-white rounded-3xl p-8 lg:p-10 border border-slate-200 hover:border-[#FF6B35]/40 transition-all duration-500 overflow-hidden shadow-sm">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B35]/[0.02] to-transparent"></div>
                  
                  <div className="relative mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-8xl lg:text-9xl font-black text-[#FF6B35] tabular-nums leading-none tracking-tight" style={{
                        textShadow: '0 0 40px rgba(255, 215, 0, 0.3), 0 0 80px rgba(255, 215, 0, 0.1)'
                      }}>
                        {progressStats?.sessionsCount ?? 0}
                      </span>
                      <Clock className="w-8 h-8 lg:w-10 lg:h-10 text-[#FF6B35]/60 mb-4" />
                    </div>
                  </div>
                  
                  <div className="relative">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.15em] mb-1">SESSIONS</p>
                    <div className="h-0.5 w-16 bg-gradient-to-r from-[#FF6B35]/40 to-transparent"></div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-slate-200/50">
                    <div className="flex items-end gap-1 h-12">
                      {allSessionsData.slice(-8).map((session, i) => (
                        <div 
                          key={session.id || i}
                          className="flex-1 bg-gradient-to-t from-[#FF6B35]/20 to-[#FF6B35]/5 rounded-t transition-all duration-300 hover:from-[#FF6B35]/40 hover:to-[#FF6B35]/20"
                          style={{ height: `${Math.max(4, Math.min(100, session.score))}%` }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Avg Score - Circular Progress */}
              <div className="lg:col-span-3 relative group">
                <div className="relative bg-white rounded-3xl p-8 lg:p-10 border border-slate-200 hover:border-blue-500/40 transition-all duration-500 overflow-hidden h-full flex flex-col justify-between shadow-sm">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] to-transparent"></div>
                  
                  <div className="relative w-32 h-32 mx-auto mb-6">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                      <circle 
                        cx="60" cy="60" r="50" 
                        fill="none" 
                        stroke="url(#scoreGradient)" 
                        strokeWidth="8" 
                        strokeLinecap="round"
                        strokeDasharray={`${((progressStats?.avgScore || 0) / 100) * 314} 314`}
                        className="transition-all duration-1000"
                      />
                      <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#60a5fa" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-4xl font-black text-blue-600 tabular-nums leading-none block">{progressStats?.avgScore || 0}</span>
                        <span className="text-lg font-bold text-blue-600/70">%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.15em] mb-1">AVG SCORE</p>
                    <div className="h-0.5 w-16 bg-gradient-to-r from-blue-500/40 to-transparent"></div>
                  </div>
                </div>
              </div>
              
              {/* Progress */}
              <div className="lg:col-span-3 relative group">
                <div className="relative bg-white rounded-3xl p-8 lg:p-10 border border-slate-200 hover:border-green-500/40 transition-all duration-500 overflow-hidden h-full flex flex-col justify-between shadow-sm">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/[0.02] to-transparent"></div>
                  
                  <div className="mb-6">
                    <span className={`text-7xl lg:text-8xl font-black tabular-nums leading-none tracking-tight ${
                      (progressStats?.scoreChange || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`} style={{
                      textShadow: (progressStats?.scoreChange || 0) >= 0 
                        ? '0 0 40px rgba(34, 197, 94, 0.3), 0 0 80px rgba(34, 197, 94, 0.1)'
                        : '0 0 40px rgba(239, 68, 68, 0.3), 0 0 80px rgba(239, 68, 68, 0.1)'
                    }}>
                      {(progressStats?.scoreChange || 0) >= 0 ? '+' : ''}{progressStats?.scoreChange || 0}%
                    </span>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className={`w-5 h-5 ${
                        (progressStats?.scoreChange || 0) >= 0 ? 'text-green-400' : 'text-red-400 rotate-180'
                      }`} />
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.15em]">PROGRESS</p>
                    </div>
                    <div className={`h-0.5 w-16 bg-gradient-to-r ${
                      (progressStats?.scoreChange || 0) >= 0 ? 'from-green-500/40' : 'from-red-500/40'
                    } to-transparent`}></div>
                  </div>
                </div>
              </div>
              
              {/* Trend */}
              <div className="lg:col-span-2 relative group">
                <div className={`relative bg-white rounded-3xl p-8 lg:p-10 border transition-all duration-500 overflow-hidden h-full flex flex-col justify-center items-center shadow-sm ${
                  progressStats?.trend === 'improving' 
                    ? 'border-green-500/30 hover:border-green-500/50' 
                    : progressStats?.trend === 'declining'
                    ? 'border-red-500/30 hover:border-red-500/50'
                    : 'border-orange-500/30 hover:border-orange-500/50'
                }`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent"></div>
                  
                  <div className={`relative mb-6 px-6 py-4 rounded-2xl backdrop-blur-md border-2 ${
                    progressStats?.trend === 'improving' 
                      ? 'bg-green-500/10 border-green-500/40 shadow-lg shadow-green-500/20' 
                      : progressStats?.trend === 'declining'
                      ? 'bg-red-500/10 border-red-500/40 shadow-lg shadow-red-500/20'
                      : 'bg-orange-500/10 border-orange-500/40 shadow-lg shadow-orange-500/20'
                  }`}>
                    <div className="flex flex-col items-center gap-2">
                      <Activity className={`w-8 h-8 ${
                        progressStats?.trend === 'improving' ? 'text-green-400' : 
                        progressStats?.trend === 'declining' ? 'text-red-400' : 'text-orange-400'
                      }`} />
                      <span className={`text-2xl font-black uppercase tracking-tight ${
                        progressStats?.trend === 'improving' ? 'text-green-400' : 
                        progressStats?.trend === 'declining' ? 'text-red-400' : 'text-orange-400'
                      }`}>
                        {progressStats?.trend || 'stable'}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.15em]">TREND</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
      
      {/* ================================================================ */}
      {/* DETAILED ANALYTICS SECTION - Deep Dive into Your Data */}
      {/* ================================================================ */}
      <div className="space-y-4">
        {/* Section Header */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider">Detailed Analytics</h2>
          <p className="text-slate-500 text-sm">Explore your training history, performance trends, and activity patterns</p>
        </div>
        
        {/* Tab Navigation */}
        <Tabs value={safeViewMode} onValueChange={(value) => {
        try {
          if (value === 'sessions' || value === 'analytics' || value === 'heatmap') {
            setViewMode(value)
          }
        } catch (error) {
          console.error('Error changing view mode:', error)
        }
      }} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100 border border-slate-200 p-1 h-auto">
          <TabsTrigger value="sessions" className="data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white flex flex-col py-3 gap-0.5">
            <span className="font-bold text-sm">Timeline</span>
            <span className="text-[10px] opacity-70 hidden sm:block">Session History</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white flex flex-col py-3 gap-0.5">
            <span className="font-bold text-sm">Charts</span>
            <span className="text-[10px] opacity-70 hidden sm:block">Performance Trends</span>
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white flex flex-col py-3 gap-0.5">
            <span className="font-bold text-sm">Activity</span>
            <span className="text-[10px] opacity-70 hidden sm:block">Training Consistency</span>
          </TabsTrigger>
        </TabsList>
        
        {/* TAB 1: SESSION TIMELINE */}
        <TabsContent value="sessions" className="mt-0">
          <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-200 bg-slate-50 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF6B35] via-[#FF4500] to-[#FF8C00] flex items-center justify-center shadow-lg shadow-[#FF6B35]/20">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white animate-pulse"></div>
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900 tracking-tight">SESSION TIMELINE</CardTitle>
                    <CardDescription className="text-slate-500 text-sm">Your training journey at a glance</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{(allSessionsData?.length || 0)} Sessions</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {(!allSessionsData || allSessionsData.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Clock className="w-10 h-10 text-slate-300" />
                  </div>
                  <p className="text-slate-500 text-base font-medium mb-2">No Sessions Yet</p>
                  <p className="text-slate-400 text-sm">Complete your first analysis to start tracking progress</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative max-w-6xl mx-auto py-8 px-4 md:px-6">
                    <div className="absolute left-10 md:left-10 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#FF6B35] via-slate-200 to-transparent"></div>
                    
                    <div className="space-y-12">
                      {((allSessionsData && Array.isArray(allSessionsData)) ? [...allSessionsData] : []).filter(s => s).reverse().slice(0, 8).map((session, index) => {
                        const isFirst = index === 0
                        const sessionNumber = String(index + 1).padStart(2, '0')
                        const score = session.score || 0
                        const scoreColor = score >= 85 ? 'green' : score >= 70 ? 'yellow' : score >= 55 ? 'orange' : 'red'
                        
                        const colorThemes = [
                          { main: '#FF6B35', border: '#FF6B35', bg: '#FF6B35/10' },
                          { main: '#FF4500', border: '#FF4500', bg: '#FF4500/10' },
                          { main: '#FFC700', border: '#FFC700', bg: '#FFC700/10' },
                          { main: '#D4AF37', border: '#D4AF37', bg: '#D4AF37/10' },
                          { main: '#FF6B35', border: '#FF6B35', bg: '#FF6B35/10' },
                          { main: '#FF8C00', border: '#FF8C00', bg: '#FF8C00/10' },
                          { main: '#FF6B35', border: '#FF6B35', bg: '#FF6B35/10' },
                          { main: '#F4C430', border: '#F4C430', bg: '#F4C430/10' }
                        ]
                        const theme = colorThemes[index % colorThemes.length]
                        
                        const dateObj = session.date instanceof Date ? session.date : (session.date ? new Date(session.date) : new Date())
                        const year = dateObj.getFullYear().toString()
                        
                        const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
                        const month = monthNames[dateObj.getMonth()]
                        const day = dateObj.getDate()
                        
                        return (
                          <div key={session.id || `session-${index}`} className="relative flex items-start gap-6 group">
                            <div className="relative z-10 flex-shrink-0">
                              {index > 0 && (
                                <div className={`absolute -top-12 left-1/2 transform -translate-x-1/2 w-0.5 h-12`} style={{ backgroundColor: theme.main }}></div>
                              )}
                              
                              <div 
                                className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center font-bold transition-all duration-300 group-hover:scale-110 ${
                                  isFirst ? 'shadow-lg shadow-[#FF6B35]/40' : ''
                                }`}
                                style={{
                                  backgroundColor: isFirst ? '#FF6B35' : '#ffffff',
                                  border: `3px solid ${theme.main}`,
                                  color: isFirst ? '#ffffff' : theme.main
                                }}
                              >
                                <div className="text-center leading-tight uppercase px-1 flex flex-col items-center justify-center">
                                  <div className="text-sm md:text-base font-black">{month}</div>
                                  <div className="text-lg md:text-xl font-black">{day}</div>
                                </div>
                                {isFirst && (
                                  <div className="absolute inset-0 rounded-full bg-[#FF6B35] animate-ping opacity-20"></div>
                                )}
                              </div>
                              
                              {index < Math.min((allSessionsData?.length || 0), 8) - 1 && (
                                <div className={`absolute -bottom-12 left-1/2 transform -translate-x-1/2 w-0.5 h-12`} style={{ backgroundColor: theme.main }}></div>
                              )}
                            </div>
                            
                            <div className="absolute left-[80px] md:left-[96px] top-8 z-0 flex items-center">
                              <div 
                                className="text-2xl md:text-3xl font-black"
                                style={{ color: theme.main }}
                              >
                                {year}
                              </div>
                            </div>
                            
                            <div className="flex-1 ml-8 md:ml-24">
                              <div 
                                className={`relative bg-white rounded-xl p-4 md:p-6 shadow-sm transition-all duration-300 group-hover:shadow-md ${
                                  isFirst ? 'ring-2 ring-[#FF6B35]' : ''
                                }`}
                                style={{
                                  border: `2px solid ${theme.border}`
                                }}
                              >
                                <div className="absolute top-3 right-3 md:top-4 md:right-4">
                                  <div 
                                    className={`text-3xl md:text-4xl font-black tabular-nums ${
                                      scoreColor === 'green' ? 'text-green-400' :
                                      scoreColor === 'yellow' ? 'text-orange-400' :
                                      scoreColor === 'orange' ? 'text-orange-400' :
                                      'text-red-400'
                                    }`}
                                  >
                                    {score}%
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3 md:gap-4 pr-20 md:pr-24 flex-wrap">
                                  <h3 
                                    className="text-base md:text-lg font-bold uppercase"
                                    style={{ color: theme.main }}
                                  >
                                    SESSIONS {sessionNumber}:
                                  </h3>
                                  
                                  {[
                                    { label: 'ELBOW', value: session.elbowAngle, color: 'blue' },
                                    { label: 'KNEE', value: session.kneeAngle, color: 'green' },
                                    { label: 'RELEASE', value: session.releaseAngle, color: 'orange' }
                                  ].map((metric) => (
                                    <div key={metric.label} className="flex items-baseline gap-2">
                                      <span className={`text-xs font-semibold uppercase tracking-wider ${
                                        metric.color === 'blue' ? 'text-blue-400/70' :
                                        metric.color === 'green' ? 'text-green-400/70' : 'text-orange-400/70'
                                      }`}>
                                        {metric.label}
                                      </span>
                                      <span className={`text-lg md:text-xl font-bold tabular-nums ${
                                        metric.color === 'blue' ? 'text-blue-400' :
                                        metric.color === 'green' ? 'text-green-400' : 'text-orange-400'
                                      }`}>
                                        {metric.value == null ? '—' : `${metric.value}°`}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* TAB 2: ANALYTICS */}
        <TabsContent value="analytics" className="mt-0">
          <AnalyticsChartSection 
            sessions={allSessionsData || []} 
            progressStats={progressStats || { scoreChange: 0, sessionsCount: 0, avgScore: 0, trend: 'stable' }}
            playerName={'Player'}
          />
        </TabsContent>
        
        {/* TAB 3: PROFESSIONAL ACTIVITY HEATMAP */}
        <TabsContent value="heatmap" className="mt-0 space-y-6">
          {/* Streak Statistics Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">Streak Statistics</h3>
                <p className="text-slate-500 text-xs">Track your training consistency and streaks</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Active Days Card */}
                <Card className="bg-white border-slate-200 hover:border-green-500/30 transition-all overflow-hidden relative shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-1">ACTIVE DAYS</h3>
                        <p className="text-xs text-slate-500">Last 18 weeks</p>
                      </div>
                      <button className="text-[#888] hover:text-[#E5E5E5] transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="relative h-20 mb-4">
                      <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
                        {[0, 15, 30, 45, 60].map((y) => (
                          <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="#e2e8f0" strokeWidth="0.5" />
                        ))}
                        <polyline
                          points={Array.from({ length: 8 }, (_, i) => {
                            const x = (i / 7) * 200;
                            const activeDays = new Set(allSessionsData.map(s => new Date(s.date).toISOString().split('T')[0])).size;
                            const trendValue = Math.min(60, (activeDays / 10) * 50 + (i * 2));
                            const y = 60 - trendValue;
                            return `${x},${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke="#22c55e"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle cx="200" cy="10" r="4" fill="#22c55e" />
                        <g transform="translate(150, 5)">
                          <rect x="0" y="0" width="50" height="12" rx="6" fill="#22c55e" opacity="0.2" />
                          <text x="25" y="9" textAnchor="middle" fontSize="8" fill="#22c55e" fontWeight="bold">
                            +{new Set(allSessionsData.map(s => new Date(s.date).toISOString().split('T')[0])).size}
                          </text>
                        </g>
                      </svg>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <div className="h-2 bg-slate-100 rounded-full flex-1 mr-2">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (new Set(allSessionsData.map(s => new Date(s.date).toISOString().split('T')[0])).size / 10) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-slate-500">
                          {Math.min(100, Math.round((new Set(allSessionsData.map(s => new Date(s.date).toISOString().split('T')[0])).size / 10) * 100))}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-3xl font-black text-green-400 leading-none">
                          {new Set(allSessionsData.map(s => new Date(s.date).toISOString().split('T')[0])).size}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">Compare to last week</p>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Current Streak Card */}
                <Card className="bg-white border-slate-200 hover:border-orange-500/30 transition-all overflow-hidden relative shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-1">CURRENT STREAK</h3>
                        <p className="text-xs text-slate-500">Last 18 weeks</p>
                      </div>
                      <button className="text-[#888] hover:text-[#E5E5E5] transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-baseline justify-between mt-16">
                      <div>
                        <span className="text-3xl font-black text-orange-400 leading-none">
                          {(() => {
                            let streak = 0
                            const today = new Date()
                            for (let i = 0; i < 30; i++) {
                              const checkDate = new Date(today)
                              checkDate.setDate(today.getDate() - i)
                              const dayStr = checkDate.toISOString().split('T')[0]
                              const hasSession = allSessionsData.some(s => 
                                new Date(s.date).toISOString().split('T')[0] === dayStr
                              )
                              if (hasSession) streak++
                              else if (i > 0) break
                            }
                            return streak
                          })()}
                        </span>
                      </div>
                      <p className="text-xs text-[#888]">Days</p>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Best Streak Card */}
                <Card className="bg-white border-slate-200 hover:border-purple-500/30 transition-all overflow-hidden relative shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-1">BEST STREAK</h3>
                        <p className="text-xs text-slate-500">Last 18 weeks</p>
                      </div>
                      <button className="text-[#888] hover:text-[#E5E5E5] transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-baseline justify-between mt-16">
                      <div>
                        <span className="text-3xl font-black text-purple-400 leading-none">
                          {(() => {
                            let maxStreak = 0
                            let currentStreak = 0
                            const sortedDates = [...new Set(allSessionsData.map(s => 
                              new Date(s.date).toISOString().split('T')[0]
                            ))].sort()
                            
                            for (let i = 0; i < sortedDates.length; i++) {
                              if (i === 0) {
                                currentStreak = 1
                              } else {
                                const prevDate = new Date(sortedDates[i - 1])
                                const currDate = new Date(sortedDates[i])
                                const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
                                if (diffDays === 1) currentStreak++
                                else currentStreak = 1
                              }
                              maxStreak = Math.max(maxStreak, currentStreak)
                            }
                            return maxStreak
                          })()}
                        </span>
                      </div>
                      <p className="text-xs text-[#888]">Days</p>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Avg/Week Card */}
                <Card className="bg-white border-slate-200 hover:border-[#FF6B35]/30 transition-all overflow-hidden relative shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-1">AVG/WEEK</h3>
                        <p className="text-xs text-slate-500">Last 18 weeks</p>
                      </div>
                      <button className="text-[#888] hover:text-[#E5E5E5] transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-baseline justify-between mt-16">
                      <div>
                        <span className="text-3xl font-black text-[#FF6B35] leading-none">
                          {allSessionsData.length > 0 ? (Math.round(allSessionsData.length / 18 * 10) / 10).toFixed(1) : '0.0'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">Sessions</p>
                    </div>
                  </CardContent>
                </Card>
            </div>
          </div>
          
          {/* Activity Heatmap Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">Activity Calendar</h3>
                <p className="text-slate-500 text-xs">Visual representation of your training frequency</p>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Intensity</span>
                <div className="flex items-center gap-0.5">
                  <div className="w-3 h-3 rounded-[3px] bg-slate-100 border border-slate-200" title="No activity"></div>
                  <div className="w-3 h-3 rounded-[3px] bg-green-900/50" title="1 session"></div>
                  <div className="w-3 h-3 rounded-[3px] bg-green-700/70" title="2 sessions"></div>
                  <div className="w-3 h-3 rounded-[3px] bg-green-500" title="3+ sessions"></div>
                </div>
              </div>
            </div>
            
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-5">
                <div className="flex mb-3 pl-8">
                  {(() => {
                    const months: string[] = []
                    const today = new Date()
                    for (let i = 4; i >= 0; i--) {
                      const d = new Date(today)
                      d.setMonth(d.getMonth() - i)
                      months.push(d.toLocaleDateString('en-US', { month: 'short' }))
                    }
                    return months.map((month, i) => (
                      <div key={i} className="flex-1 text-[10px] text-slate-400 font-medium">{month}</div>
                    ))
                  })()}
                </div>
                
                <div className="flex gap-1.5">
                  <div className="flex flex-col gap-1.5 pr-2">
                    {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((day, i) => (
                      <div key={i} className="h-[14px] text-[9px] text-slate-400 font-medium flex items-center justify-end">{day}</div>
                    ))}
                  </div>
                  
                  <div className="flex-1 flex gap-1">
                    {Array.from({ length: 18 }, (_, weekIndex) => (
                      <div key={weekIndex} className="flex flex-col gap-1">
                        {Array.from({ length: 7 }, (_, dayIndex) => {
                          const today = new Date()
                          const dayOffset = (17 - weekIndex) * 7 + (6 - dayIndex)
                          const dayDate = new Date(today)
                          dayDate.setDate(today.getDate() - dayOffset)
                          const dayStr = dayDate.toISOString().split('T')[0]
                          const sessionsOnDay = allSessionsData.filter(s => 
                            new Date(s.date).toISOString().split('T')[0] === dayStr
                          )
                          const activityLevel = sessionsOnDay.length
                          
                          let bgClass = 'bg-slate-100 border-slate-200'
                          let shadowClass = ''
                          if (activityLevel === 1) {
                            bgClass = 'bg-green-900/40 border-green-800/30'
                          } else if (activityLevel === 2) {
                            bgClass = 'bg-green-700/60 border-green-600/30'
                          } else if (activityLevel >= 3) {
                            bgClass = 'bg-green-500 border-green-400/30'
                            shadowClass = 'shadow-[0_0_8px_rgba(34,197,94,0.3)]'
                          }
                          
                          return (
                            <div
                              key={dayIndex}
                              className={`w-[14px] h-[14px] rounded-[3px] border transition-all hover:scale-125 hover:z-10 cursor-pointer ${bgClass} ${shadowClass}`}
                              title={`${dayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}: ${activityLevel} session${activityLevel !== 1 ? 's' : ''}`}
                            />
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
