"use client"

import { useState, useMemo } from "react"
import { WorkoutOrPassGame, WorkoutCalendar } from "@/components/training/WorkoutOrPass"
import { useAnalysisStore } from "@/stores/analysisStore"
import { useProfileStore } from "@/stores/profileStore"
import { Dumbbell, Calendar } from "lucide-react"

export default function TrainingPage() {
  const [viewMode, setViewMode] = useState<'discover' | 'calendar'>('discover')
  const { visionAnalysisResult } = useAnalysisStore()
  const profileStore = useProfileStore()

  // Map detected flaws to user flaws for drill recommendations
  const userFlaws = useMemo(() => {
    const flaws: Record<string, boolean> = {}
    
    if (visionAnalysisResult?.angles) {
      const angles = visionAnalysisResult.angles
      
      // Check elbow angle
      if (angles.right_elbow_angle && (angles.right_elbow_angle < 80 || angles.right_elbow_angle > 100)) {
        flaws.elbowAlignment = true
      }
      
      // Check knee angle
      if (angles.right_knee_angle && angles.right_knee_angle < 120) {
        flaws.kneeBend = true
      }
      
      // Check hip angle
      if (angles.hip_tilt && angles.hip_tilt < 160) {
        flaws.hipPosition = true
      }
    }
    
    // Add some default flaws for demo
    if (Object.keys(flaws).length === 0) {
      flaws.elbowAlignment = true
      flaws.releasePoint = true
      flaws.followThrough = true
    }
    
    return flaws
  }, [visionAnalysisResult])

  // Get user skill level
  const userSkillLevel = useMemo(() => {
    if (profileStore?.experienceLevel === 'advanced') return 'advanced'
    if (profileStore?.experienceLevel === 'beginner') return 'beginner'
    return 'intermediate'
  }, [profileStore])

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex gap-2 p-1 bg-[#1a1a1a] rounded-xl border border-[#333]">
        <button
          onClick={() => setViewMode('discover')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${
            viewMode === 'discover'
              ? 'bg-[#FF6B35] text-white'
              : 'text-[#888] hover:text-white hover:bg-[#2a2a2a]'
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
              : 'text-[#888] hover:text-white hover:bg-[#2a2a2a]'
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

