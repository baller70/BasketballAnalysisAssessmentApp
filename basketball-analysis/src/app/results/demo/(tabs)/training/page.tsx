"use client"

import { useState, useMemo, useEffect } from "react"
import { WorkoutOrPassGame, WorkoutCalendar } from "@/components/training/WorkoutOrPass"
import { useAnalysisStore } from "@/stores/analysisStore"
import { useProfileStore } from "@/stores/profileStore"
import { 
  Dumbbell, Calendar, Zap, BookOpen, Target, 
  ChevronRight, Clock, TrendingUp, Trophy,
  Play, Star, Flame
} from "lucide-react"
import Link from "next/link"

// Types for saved workouts
interface SavedWorkout {
  id: string
  name: string
  drillCount: number
  lastPlayed?: Date
  totalMade: number
  totalMissed: number
}

// Types for recent workout history
interface RecentWorkout {
  id: string
  name: string
  date: Date
  made: number
  missed: number
  accuracy: number
}

export default function TrainingPage() {
  const [viewMode, setViewMode] = useState<'home' | 'discover' | 'mydrills' | 'calendar'>('home')
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([])
  const [recentWorkouts, setRecentWorkouts] = useState<RecentWorkout[]>([])
  const { visionAnalysisResult } = useAnalysisStore()
  const profileStore = useProfileStore()

  // Load saved workouts from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shotiq_saved_workouts')
      if (saved) {
        try {
          setSavedWorkouts(JSON.parse(saved))
        } catch (e) {
          console.error('Failed to load saved workouts:', e)
        }
      }
      
      const recent = localStorage.getItem('shotiq_recent_workouts')
      if (recent) {
        try {
          const parsed = JSON.parse(recent)
          setRecentWorkouts(parsed.map((w: any) => ({
            ...w,
            date: new Date(w.date)
          })))
        } catch (e) {
          console.error('Failed to load recent workouts:', e)
        }
      } else {
        // Demo data for recent workouts
        setRecentWorkouts([
          { id: '1', name: 'Free Throw Practice', date: new Date(Date.now() - 86400000), made: 45, missed: 13, accuracy: 78 },
          { id: '2', name: 'Corner 3s', date: new Date(Date.now() - 172800000), made: 31, missed: 19, accuracy: 62 },
          { id: '3', name: 'Elbow Jumpers', date: new Date(Date.now() - 259200000), made: 25, missed: 10, accuracy: 71 },
        ])
      }
    }
  }, [])

  // Map detected flaws to user flaws for drill recommendations
  const userFlaws = useMemo(() => {
    const flaws: Record<string, boolean> = {}
    
    if (visionAnalysisResult?.angles) {
      const angles = visionAnalysisResult.angles
      
      if (angles.right_elbow_angle && (angles.right_elbow_angle < 80 || angles.right_elbow_angle > 100)) {
        flaws.elbowAlignment = true
      }
      
      if (angles.right_knee_angle && angles.right_knee_angle < 120) {
        flaws.kneeBend = true
      }
      
      if (angles.hip_tilt && angles.hip_tilt < 160) {
        flaws.hipPosition = true
      }
    }
    
    if (Object.keys(flaws).length === 0) {
      flaws.elbowAlignment = true
      flaws.releasePoint = true
      flaws.followThrough = true
    }
    
    return flaws
  }, [visionAnalysisResult])

  const userSkillLevel = useMemo(() => {
    if (profileStore?.experienceLevel === 'advanced') return 'advanced'
    if (profileStore?.experienceLevel === 'beginner') return 'beginner'
    return 'intermediate'
  }, [profileStore])

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Home View - Main training hub
  if (viewMode === 'home') {
    return (
      <div className="space-y-6">
        {/* Quick Action Cards - 2x2 Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Quick Start */}
          <button
            onClick={() => setViewMode('discover')}
            className="relative bg-gradient-to-br from-[#FF6B35] to-[#E55300] rounded-2xl p-4 text-left overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-bold text-lg">Quick Start</h3>
              <p className="text-white/70 text-xs mt-1">Start tracking shots</p>
            </div>
            <ChevronRight className="absolute bottom-4 right-4 w-5 h-5 text-white/50 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* My Drills */}
          <button
            onClick={() => setViewMode('mydrills')}
            className="relative bg-white border border-slate-200 rounded-2xl p-4 text-left overflow-hidden group hover:border-slate-300 shadow-sm transition-colors"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF6B35]/5 rounded-full -translate-y-8 translate-x-8" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6 text-[#FF6B35]" />
              </div>
              <h3 className="text-slate-900 font-bold text-lg">My Drills</h3>
              <p className="text-slate-500 text-xs mt-1">{savedWorkouts.length} saved</p>
            </div>
            <ChevronRight className="absolute bottom-4 right-4 w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Discover Drills */}
          <button
            onClick={() => setViewMode('discover')}
            className="relative bg-white border border-slate-200 rounded-2xl p-4 text-left overflow-hidden group hover:border-slate-300 shadow-sm transition-colors"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#22c55e]/5 rounded-full -translate-y-8 translate-x-8" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
                <Flame className="w-6 h-6 text-[#22c55e]" />
              </div>
              <h3 className="text-slate-900 font-bold text-lg">Discover</h3>
              <p className="text-slate-500 text-xs mt-1">Browse new drills</p>
            </div>
            <ChevronRight className="absolute bottom-4 right-4 w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Calendar */}
          <button
            onClick={() => setViewMode('calendar')}
            className="relative bg-white border border-slate-200 rounded-2xl p-4 text-left overflow-hidden group hover:border-slate-300 shadow-sm transition-colors"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#3b82f6]/5 rounded-full -translate-y-8 translate-x-8" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-[#3b82f6]" />
              </div>
              <h3 className="text-slate-900 font-bold text-lg">Calendar</h3>
              <p className="text-slate-500 text-xs mt-1">Schedule workouts</p>
            </div>
            <ChevronRight className="absolute bottom-4 right-4 w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Recent Workouts Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <h2 className="text-slate-900 font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Recent Workouts
            </h2>
            <button className="text-[#FF6B35] text-sm font-medium">View All</button>
          </div>
          
          {recentWorkouts.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentWorkouts.slice(0, 5).map((workout) => (
                <div key={workout.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                      <Target className="w-5 h-5 text-[#FF6B35]" />
                    </div>
                    <div>
                      <p className="text-slate-900 font-medium text-sm">{workout.name}</p>
                      <p className="text-slate-400 text-xs">{formatTimeAgo(workout.date)}</p>
                    </div>
                  </div>
                  
                  {/* Stats: Missed | Made | Accuracy */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[#ef4444] text-xs font-medium">{workout.missed} missed</p>
                      <p className="text-[#22c55e] text-xs font-medium">{workout.made} made</p>
                    </div>
                    <div className="w-14 text-right">
                      <p className={`text-lg font-black ${
                        workout.accuracy >= 70 ? 'text-[#22c55e]' : 
                        workout.accuracy >= 50 ? 'text-[#eab308]' : 'text-[#ef4444]'
                      }`}>
                        {workout.accuracy}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Dumbbell className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 text-sm">No recent workouts</p>
              <p className="text-slate-400 text-xs mt-1">Start a drill to track your progress</p>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        {recentWorkouts.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-slate-500 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
              <TrendingUp className="w-3 h-3" />
              This Week
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-black text-slate-900">
                  {recentWorkouts.reduce((sum, w) => sum + w.made + w.missed, 0)}
                </p>
                <p className="text-slate-400 text-xs">Total Shots</p>
              </div>
              <div className="text-center border-x border-slate-200">
                <p className="text-2xl font-black text-[#22c55e]">
                  {Math.round(recentWorkouts.reduce((sum, w) => sum + w.accuracy, 0) / recentWorkouts.length)}%
                </p>
                <p className="text-slate-400 text-xs">Avg Accuracy</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-[#FF6B35]">{recentWorkouts.length}</p>
                <p className="text-slate-400 text-xs">Workouts</p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // My Drills View
  if (viewMode === 'mydrills') {
    return (
      <div className="space-y-4">
        {/* Back Button */}
        <button
          onClick={() => setViewMode('home')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          <span className="text-sm font-medium">Back to Training</span>
        </button>

        <h1 className="text-slate-900 text-2xl font-black">My Drills</h1>

        {savedWorkouts.length > 0 ? (
          <div className="space-y-3">
            {savedWorkouts.map((workout) => (
              <div key={workout.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-slate-900 font-bold">{workout.name}</h3>
                    <p className="text-slate-500 text-sm">{workout.drillCount} drills</p>
                  </div>
                  <button className="px-4 py-2 bg-[#FF6B35] text-white rounded-lg font-semibold text-sm">
                    Start
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-slate-900 font-bold mb-2">No Saved Drills</h3>
            <p className="text-slate-500 text-sm mb-4">Discover and save drills to build your personal library</p>
            <button
              onClick={() => setViewMode('discover')}
              className="px-6 py-3 bg-[#FF6B35] text-white rounded-xl font-semibold"
            >
              Discover Drills
            </button>
          </div>
        )}
      </div>
    )
  }

  // Discover / Calendar Views
  return (
    <div className="space-y-4">
      {/* Back Button */}
      <button
        onClick={() => setViewMode('home')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        <span className="text-sm font-medium">Back to Training</span>
      </button>

      {/* View Mode Toggle */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
        <button
          onClick={() => setViewMode('discover')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${
            viewMode === 'discover'
              ? 'bg-[#FF6B35] text-white'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          Discover Drills
        </button>
        <button
          onClick={() => setViewMode('calendar')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${
            viewMode === 'calendar'
              ? 'bg-[#FF6B35] text-white'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Calendar
        </button>
      </div>

      {/* Content */}
      {viewMode === 'discover' ? (
        <WorkoutOrPassGame 
          userProfile={{
            skillLevel: userSkillLevel === 'advanced' ? 'HIGH_SCHOOL' : userSkillLevel === 'beginner' ? 'ELEMENTARY' : 'MIDDLE_SCHOOL',
            flaws: userFlaws
          }}
        />
      ) : (
        <WorkoutCalendar />
      )}
    </div>
  )
}
