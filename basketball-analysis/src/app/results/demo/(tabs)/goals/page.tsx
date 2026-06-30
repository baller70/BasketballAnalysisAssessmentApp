"use client"

import { useState, useEffect, useMemo } from "react"
import { Target, Plus, TrendingUp, Calendar, Trophy, X, Check } from "lucide-react"
import { GoalTransitMap } from "@/components/goals"
import { useAnalysisStore } from "@/stores/analysisStore"
import { getAllSessions, AnalysisSession } from "@/services/sessionStorage"
import { Card, CardContent } from "@/components/ui/card"
import { useGoals } from "@/lib/goals"

export default function GoalsPage() {
  const store = useAnalysisStore()
  
  const visionAnalysisResult = store?.visionAnalysisResult || null
  const [sessions, setSessions] = useState<AnalysisSession[]>([])
  
  // Get goals from context (dynamic, not hardcoded)
  const { goals, totalGoals, completedCount, addGoal } = useGoals()

  // Goal creation modal state
  const [showGoalModal, setShowGoalModal] = useState(false)
  
  useEffect(() => {
    try {
      const loadedSessions = getAllSessions()
      setSessions(Array.isArray(loadedSessions) ? loadedSessions : [])
    } catch (error) {
      console.error('Error loading sessions:', error)
      setSessions([])
    }
  }, [])
  
  // Combine current session with historical sessions for stats
  const allSessionsData = useMemo(() => {
    const data: { id: string; date: Date; score: number; isLive: boolean }[] = []
    
    if (visionAnalysisResult?.success) {
      const score = visionAnalysisResult.overall_score || 70
      data.push({
        id: 'current',
        date: new Date(),
        score,
        isLive: true
      })
    }
    
    sessions.forEach(session => {
      const score = session.analysisData?.overallScore || 70
      data.push({
        id: session.id,
        date: new Date(session.date),
        score,
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

  // Points are awarded by real activity (e.g. completing a goal), never for
  // merely opening the create-goal modal — so this just opens the modal.
  const handleCreateGoal = () => {
    setShowGoalModal(true)
  }

  return (
    <div className="space-y-8 relative">
      {/* Goals Card - Gold Theme */}
      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="relative p-6 lg:p-8 overflow-hidden">
            {/* Background gradient mesh */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 left-0 w-96 h-96 bg-[#FF6B35]/5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#B8860B]/5 rounded-full blur-3xl"></div>
            </div>
            
            {/* Goals Count Card */}
            <div className="relative grid grid-cols-1 gap-6 lg:gap-8">
              <div className="relative group max-w-md mx-auto w-full">
                <div className="relative bg-white backdrop-blur-xl rounded-3xl p-8 lg:p-10 border border-slate-200 hover:border-[#FF6B35]/40 transition-all duration-500 overflow-hidden shadow-sm">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent"></div>
                  
                  {/* Create Goal Button */}
                  <button
                    type="button"
                    onClick={handleCreateGoal}
                    className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-[#FF6B35] hover:bg-[#FF4500] text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-[#FF6B35]/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create Goal
                  </button>
                  
                  <div className="relative mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-8xl lg:text-9xl font-black text-[#FF6B35] tabular-nums leading-none tracking-tight" style={{
                        textShadow: '0 0 40px rgba(255, 215, 0, 0.3), 0 0 80px rgba(255, 215, 0, 0.1)'
                      }}>
                        {totalGoals}
                      </span>
                      <Target className="w-8 h-8 lg:w-10 lg:h-10 text-[#FF6B35]/60 mb-4" />
                    </div>
                  </div>
                  
                  <div className="relative">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.15em] mb-1">GOALS</p>
                    <div className="h-0.5 w-16 bg-gradient-to-r from-[#FF6B35]/40 to-transparent"></div>
                  </div>
                  
                  {/* Progress indicator */}
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-500 uppercase tracking-wider">Progress</span>
                      <span className="text-xs text-[#FF6B35] font-bold">{completedCount}/{totalGoals} completed</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF4500] rounded-full transition-all duration-500"
                        style={{ width: `${totalGoals > 0 ? (completedCount / totalGoals) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500 text-xs uppercase">Sessions</span>
          </div>
          <p className="text-slate-900 text-2xl font-black">{progressStats.sessionsCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500 text-xs uppercase">Avg Score</span>
          </div>
          <p className="text-slate-900 text-2xl font-black">{progressStats.avgScore}%</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500 text-xs uppercase">Change</span>
          </div>
          <p className={`text-2xl font-black ${progressStats.scoreChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {progressStats.scoreChange >= 0 ? '+' : ''}{progressStats.scoreChange}%
          </p>
        </div>
      </div>
      
      {/* Goal Transit Map - Journey */}
      <GoalTransitMap />

      {/* Goal Creation Modal */}
      {showGoalModal && (
        <GoalCreationModal
          onClose={() => setShowGoalModal(false)}
          onCreate={(goal) => {
            addGoal(goal)
            setShowGoalModal(false)
          }}
        />
      )}
    </div>
  )
}

// ============================================
// GOAL CREATION MODAL
// ============================================

type NewGoalCategory = 'form' | 'consistency' | 'volume' | 'accuracy' | 'streak' | 'custom'

interface GoalCreationModalProps {
  onClose: () => void
  onCreate: (goal: {
    name: string
    description: string
    targetValue: number
    currentValue: number
    unit: string
    category: NewGoalCategory
    xpReward: number
  }) => void
}

const CATEGORY_OPTIONS: { value: NewGoalCategory; label: string; defaultUnit: string }[] = [
  { value: 'form', label: 'Form', defaultUnit: 'score' },
  { value: 'consistency', label: 'Consistency', defaultUnit: 'sessions' },
  { value: 'volume', label: 'Volume', defaultUnit: 'shots' },
  { value: 'accuracy', label: 'Accuracy', defaultUnit: 'makes' },
  { value: 'streak', label: 'Streak', defaultUnit: 'days' },
  { value: 'custom', label: 'Custom', defaultUnit: 'reps' },
]

function GoalCreationModal({ onClose, onCreate }: GoalCreationModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<NewGoalCategory>('volume')
  const [targetValue, setTargetValue] = useState<number>(50)
  const [unit, setUnit] = useState('shots')
  const [xpReward, setXpReward] = useState<number>(100)
  const [error, setError] = useState<string | null>(null)

  const handleCategoryChange = (value: NewGoalCategory) => {
    setCategory(value)
    const opt = CATEGORY_OPTIONS.find((o) => o.value === value)
    if (opt) setUnit(opt.defaultUnit)
  }

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Please enter a goal name.')
      return
    }
    const safeTarget = Number.isFinite(targetValue) && targetValue > 0 ? Math.round(targetValue) : 1
    onCreate({
      name: name.trim().toUpperCase(),
      description: description.trim() || `Reach ${safeTarget} ${unit.trim() || 'units'}`,
      targetValue: safeTarget,
      currentValue: 0,
      unit: unit.trim() || 'units',
      category,
      xpReward: Number.isFinite(xpReward) && xpReward > 0 ? Math.round(xpReward) : 100,
    })
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-[#FF6B35]" />
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Create Goal</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Goal Name *</label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null) }}
              placeholder="e.g. 200 Makes"
              className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What do you want to achieve?"
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40 resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value as NewGoalCategory)}
              className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40"
            >
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Target + Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Target</label>
              <input
                type="number"
                min={1}
                value={targetValue}
                onChange={(e) => setTargetValue(parseInt(e.target.value, 10))}
                className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Unit</label>
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="shots"
                className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40"
              />
            </div>
          </div>

          {/* XP Reward */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">XP Reward</label>
            <input
              type="number"
              min={0}
              value={xpReward}
              onChange={(e) => setXpReward(parseInt(e.target.value, 10))}
              className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
          >
            CANCEL
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF4500] text-white font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            CREATE GOAL
          </button>
        </div>
      </div>
    </div>
  )
}

