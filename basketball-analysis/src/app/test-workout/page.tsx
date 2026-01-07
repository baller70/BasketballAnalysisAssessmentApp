"use client"

import React, { useState } from "react"
import { WorkoutOrPassGame, DrillExecutionPage, WorkoutCalendar } from "@/components/training/WorkoutOrPass"
import { Drill, SkillLevel, DrillFocusArea } from "@/data/drillDatabase"
import { Filter, ChevronDown, Check, Dumbbell, X, Star, Clock, Target, Sliders, Sparkles, Calendar } from "lucide-react"

const SKILL_LEVELS: { value: SkillLevel | 'all'; label: string }[] = [
  { value: 'all', label: 'All Levels' },
  { value: 'ELEMENTARY', label: 'Elementary' },
  { value: 'MIDDLE_SCHOOL', label: 'Middle School' },
  { value: 'HIGH_SCHOOL', label: 'High School' },
  { value: 'COLLEGE', label: 'College' },
  { value: 'PROFESSIONAL', label: 'Professional' },
]

const FOCUS_AREAS: { value: DrillFocusArea | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'ELBOW_ALIGNMENT', label: 'Elbow Alignment' },
  { value: 'KNEE_BEND', label: 'Knee Bend' },
  { value: 'RELEASE_POINT', label: 'Release Point' },
  { value: 'FOLLOW_THROUGH', label: 'Follow Through' },
  { value: 'BALANCE', label: 'Balance' },
  { value: 'ARC_TRAJECTORY', label: 'Arc & Trajectory' },
  { value: 'FOOTWORK', label: 'Footwork' },
  { value: 'CONSISTENCY', label: 'Consistency' },
  { value: 'FATIGUE', label: 'Fatigue Training' },
  { value: 'GAME_SITUATION', label: 'Game Situations' },
  { value: 'MICRO_ADJUSTMENT', label: 'Micro Adjustments' },
]

const DIFFICULTY_LEVELS: { value: number | 'all'; label: string }[] = [
  { value: 'all', label: 'Any Difficulty' },
  { value: 1, label: '★ Beginner' },
  { value: 2, label: '★★ Easy' },
  { value: 3, label: '★★★ Medium' },
  { value: 4, label: '★★★★ Hard' },
  { value: 5, label: '★★★★★ Expert' },
]

const DURATION_RANGES: { value: string; label: string; min: number; max: number }[] = [
  { value: 'all', label: 'Any Duration', min: 0, max: 999 },
  { value: 'quick', label: '5 min or less', min: 0, max: 5 },
  { value: 'short', label: '5-10 min', min: 5, max: 10 },
  { value: 'medium', label: '10-20 min', min: 10, max: 20 },
  { value: 'long', label: '20-30 min', min: 20, max: 30 },
  { value: 'extended', label: '30+ min', min: 30, max: 999 },
]

export interface DrillFilters {
  skillLevel: SkillLevel | 'all'
  focusArea: DrillFocusArea | 'all'
  difficulty: number | 'all'
  duration: string
}

export default function TestWorkoutPage() {
  const [activeTab, setActiveTab] = useState<'discover' | 'calendar'>('discover')
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [filters, setFilters] = useState<DrillFilters>({
    skillLevel: 'all',
    focusArea: 'all',
    difficulty: 'all',
    duration: 'all'
  })
  const [activeDrill, setActiveDrill] = useState<Drill | null>(null)
  const [showDrillExecution, setShowDrillExecution] = useState(false)

  // Mock user flaws - in real app, this would come from analysis
  const [userFlaws] = useState({
    elbowAlignment: true,
    kneeBend: false,
    releasePoint: true,
    followThrough: false,
    balance: false,
    arcTrajectory: false,
    footwork: false
  })

  const handleStartDrill = (drill: Drill) => {
    setActiveDrill(drill)
    console.log("Starting drill:", drill.title)
  }
  
  const handleBeginDrill = () => {
    setShowDrillExecution(true)
  }
  
  const handleCloseDrillExecution = () => {
    setShowDrillExecution(false)
    setActiveDrill(null)
  }
  
  const activeFilterCount = [
    filters.skillLevel !== 'all',
    filters.focusArea !== 'all',
    filters.difficulty !== 'all',
    filters.duration !== 'all'
  ].filter(Boolean).length
  
  const resetFilters = () => {
    setFilters({
      skillLevel: 'all',
      focusArea: 'all',
      difficulty: 'all',
      duration: 'all'
    })
  }

  const getFilterSummary = () => {
    const parts: string[] = []
    if (filters.skillLevel !== 'all') {
      parts.push(SKILL_LEVELS.find(l => l.value === filters.skillLevel)?.label || '')
    }
    if (filters.focusArea !== 'all') {
      parts.push(FOCUS_AREAS.find(f => f.value === filters.focusArea)?.label || '')
    }
    if (filters.difficulty !== 'all') {
      parts.push(`${filters.difficulty}★`)
    }
    if (filters.duration !== 'all') {
      parts.push(DURATION_RANGES.find(d => d.value === filters.duration)?.label || '')
    }
    return parts.length > 0 ? parts.join(' • ') : 'All Drills'
  }

  return (
    <main className="min-h-screen bg-[#050505]">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-lg mx-auto">
          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mb-4 p-1 bg-[#1a1a1a] rounded-xl border border-[#333]">
            <button
              type="button"
              onClick={() => setActiveTab('discover')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all ${
                activeTab === 'discover'
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF4500] text-white'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              DISCOVER
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all ${
                activeTab === 'calendar'
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF4500] text-white'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              CALENDAR
            </button>
          </div>
          
          {/* Discover Tab */}
          {activeTab === 'discover' && (
            <>
              {/* Filter Button */}
              <button
                type="button"
                onClick={() => setShowFilterPanel(true)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 mb-4 bg-[#1a1a1a] border border-[#333] rounded-xl text-white hover:border-[#FF6B35]/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FF6B35]/20 flex items-center justify-center relative">
                    <Sliders className="w-4 h-4 text-[#FF6B35]" />
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF6B35] text-white text-[10px] font-bold flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-xs text-[#888]">Filters</p>
                    <p className="text-sm font-medium truncate">{getFilterSummary()}</p>
                  </div>
                </div>
                <ChevronDown className="w-5 h-5 text-[#888] flex-shrink-0" />
              </button>
              
              {/* The Game */}
              <WorkoutOrPassGame 
                userProfile={{
                  skillLevel: filters.skillLevel === 'all' ? undefined : filters.skillLevel,
                  flaws: userFlaws
                }}
                filters={filters}
                onStartDrill={handleStartDrill}
              />
            </>
          )}
          
          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <WorkoutCalendar
              userFlaws={Object.entries(userFlaws)
                .filter(([_, hasIssue]) => hasIssue)
                .map(([flaw]) => flaw)}
              onStartWorkout={(drills) => {
                if (drills.length > 0) {
                  setActiveDrill(drills[0])
                }
              }}
            />
          )}
        </div>
      </div>
      
      {/* Filter Panel Overlay */}
      {showFilterPanel && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center">
          <div className="bg-[#1a1a1a] w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#333]">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Filter className="w-5 h-5 text-[#FF6B35]" />
                Filter Drills
              </h2>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-sm text-[#FF6B35] hover:text-[#FF8B55] transition-colors"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowFilterPanel(false)}
                  className="w-8 h-8 rounded-lg bg-[#252525] flex items-center justify-center text-[#888] hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Skill Level */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#FF6B35]" />
                  Skill Level
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {SKILL_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setFilters(f => ({ ...f, skillLevel: level.value }))}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        filters.skillLevel === level.value
                          ? 'bg-[#FF6B35] text-white'
                          : 'bg-[#252525] text-[#888] hover:bg-[#333] hover:text-white'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Focus Area / Drill Type */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#FF6B35]" />
                  Drill Type
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {FOCUS_AREAS.map((area) => (
                    <button
                      key={area.value}
                      type="button"
                      onClick={() => setFilters(f => ({ ...f, focusArea: area.value }))}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        filters.focusArea === area.value
                          ? 'bg-[#FF6B35] text-white'
                          : 'bg-[#252525] text-[#888] hover:bg-[#333] hover:text-white'
                      }`}
                    >
                      {area.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Difficulty */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#FF6B35]" />
                  Difficulty
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {DIFFICULTY_LEVELS.map((diff) => (
                    <button
                      key={diff.value}
                      type="button"
                      onClick={() => setFilters(f => ({ ...f, difficulty: diff.value }))}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        filters.difficulty === diff.value
                          ? 'bg-[#FF6B35] text-white'
                          : 'bg-[#252525] text-[#888] hover:bg-[#333] hover:text-white'
                      }`}
                    >
                      {diff.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Duration */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#FF6B35]" />
                  Duration
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {DURATION_RANGES.map((duration) => (
                    <button
                      key={duration.value}
                      type="button"
                      onClick={() => setFilters(f => ({ ...f, duration: duration.value }))}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        filters.duration === duration.value
                          ? 'bg-[#FF6B35] text-white'
                          : 'bg-[#252525] text-[#888] hover:bg-[#333] hover:text-white'
                      }`}
                    >
                      {duration.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Apply Button */}
            <div className="p-4 border-t border-[#333]">
              <button
                type="button"
                onClick={() => setShowFilterPanel(false)}
                className="w-full py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF4500] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-[#FF6B35]/30 transition-all"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Drill Modal - Shows when user clicks "Got It - Let's Go!" */}
      {activeDrill && !showDrillExecution && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF4500] flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-white font-bold text-2xl mb-2">{activeDrill.title}</h2>
            <p className="text-[#888] mb-6">Ready to start this {activeDrill.duration}-minute drill?</p>
            
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleBeginDrill}
                className="w-full py-4 bg-gradient-to-r from-[#FF6B35] to-[#FF4500] text-white font-bold rounded-xl flex items-center justify-center gap-2"
              >
                <Dumbbell className="w-5 h-5" />
                Begin Drill
              </button>
              <button
                type="button"
                onClick={() => setActiveDrill(null)}
                className="w-full py-3 bg-[#2a2a2a] text-[#888] font-medium rounded-xl hover:bg-[#3a3a3a] hover:text-white transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Drill Execution Page - Full screen overlay */}
      {activeDrill && showDrillExecution && (
        <DrillExecutionPage
          drill={activeDrill}
          onClose={handleCloseDrillExecution}
          onStartDrill={() => {
            console.log("Drill started:", activeDrill.title)
            // Here you would start the actual drill execution
          }}
        />
      )}
    </main>
  )
}

