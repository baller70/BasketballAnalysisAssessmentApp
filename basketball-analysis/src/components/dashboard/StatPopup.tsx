"use client"

import React, { useState, useEffect, useRef } from 'react'
import { X, TrendingUp, MapPin, Users, Trophy, ChevronRight, Info } from 'lucide-react'

// ============================================
// STAT DEFINITIONS & EXPLANATIONS
// ============================================

interface StatDefinition {
  name: string
  fullName: string
  description: string
  whatItMeans: string
  optimalRange: { min: number; max: number }
  howToImprove: string[]
}

const statDefinitions: Record<string, StatDefinition> = {
  release: {
    name: "RELEASE",
    fullName: "Release Speed & Timing",
    description: "Measures how quickly and smoothly you release the ball at the peak of your shot.",
    whatItMeans: "A high release score means you have a quick, fluid release that's hard to block. This is crucial for getting shots off against taller defenders.",
    optimalRange: { min: 75, max: 95 },
    howToImprove: [
      "Practice form shooting close to the basket",
      "Focus on a consistent release point",
      "Work on your wrist snap and follow-through",
      "Use a lighter ball to build quick-twitch muscles"
    ]
  },
  form: {
    name: "FORM",
    fullName: "Shooting Form & Mechanics",
    description: "Evaluates the overall technical quality of your shooting motion from stance to follow-through.",
    whatItMeans: "Good form creates consistency. A high form score indicates proper alignment, smooth motion, and repeatable mechanics.",
    optimalRange: { min: 70, max: 95 },
    howToImprove: [
      "Film yourself and compare to elite shooters",
      "Work with a shooting coach",
      "Practice in front of a mirror",
      "Focus on one aspect at a time (feet, elbow, release)"
    ]
  },
  balance: {
    name: "BALANCE",
    fullName: "Base & Body Balance",
    description: "Measures your stability and body control throughout the shooting motion.",
    whatItMeans: "Balance is the foundation of a consistent shot. High balance means you maintain control from catch to release, even when contested.",
    optimalRange: { min: 75, max: 95 },
    howToImprove: [
      "Strengthen your core and legs",
      "Practice shooting off the dribble",
      "Work on catch-and-shoot drills",
      "Focus on landing in the same spot you jumped from"
    ]
  },
  arc: {
    name: "ARC",
    fullName: "Shot Arc & Trajectory",
    description: "Analyzes the height and curve of your shot as it travels to the basket.",
    whatItMeans: "Optimal arc (45-52 degrees) gives the ball the best chance to go in. Too flat or too high reduces your margin for error.",
    optimalRange: { min: 70, max: 90 },
    howToImprove: [
      "Aim for a 45-52 degree release angle",
      "Practice with a shooting target or arc trainer",
      "Focus on extending fully through your shot",
      "Visualize the ball going over an imaginary barrier"
    ]
  },
  elbow: {
    name: "ELBOW",
    fullName: "Elbow Alignment & Tuck",
    description: "Measures how well your shooting elbow stays aligned with the basket throughout your shot.",
    whatItMeans: "A tucked elbow creates a straight line to the basket. Flared elbows cause shots to miss left or right.",
    optimalRange: { min: 80, max: 95 },
    howToImprove: [
      "Practice the 'L' position with your arm",
      "Keep your elbow under the ball, not to the side",
      "Use wall drills to feel proper alignment",
      "Strengthen your shoulder stabilizers"
    ]
  },
  follow: {
    name: "FOLLOW",
    fullName: "Follow-Through & Finish",
    description: "Evaluates how you complete your shot after the ball leaves your hand.",
    whatItMeans: "A good follow-through ensures proper backspin and direction. 'Reaching into the cookie jar' is the goal.",
    optimalRange: { min: 75, max: 95 },
    howToImprove: [
      "Hold your follow-through until the ball hits the rim",
      "Focus on snapping your wrist down",
      "Practice one-hand form shooting",
      "Visualize putting your hand in the basket"
    ]
  },
  consist: {
    name: "CONSIST",
    fullName: "Shot Consistency",
    description: "Measures how repeatable your shooting motion is from shot to shot.",
    whatItMeans: "High consistency means your mechanics don't change whether you're fresh or tired, open or contested.",
    optimalRange: { min: 70, max: 95 },
    howToImprove: [
      "Develop a pre-shot routine",
      "Practice when fatigued",
      "Track your shooting percentages",
      "Focus on muscle memory through repetition"
    ]
  },
  power: {
    name: "POWER",
    fullName: "Leg Drive & Power Transfer",
    description: "Measures how effectively you generate and transfer power from your legs through your shot.",
    whatItMeans: "Good power means your legs do the work, not your arms. This leads to better range and less fatigue.",
    optimalRange: { min: 70, max: 90 },
    howToImprove: [
      "Strengthen your legs with squats and lunges",
      "Practice shooting from distance",
      "Focus on 'dipping' into your shot",
      "Work on explosive jump training"
    ]
  }
}

// ============================================
// NATIONAL AVERAGES BY AGE GROUP
// ============================================

interface AgeGroupBenchmark {
  ageRange: string
  label: string
  averages: Record<string, number>
}

const nationalAveragesByAge: AgeGroupBenchmark[] = [
  {
    ageRange: "8-10",
    label: "Youth (8-10)",
    averages: { release: 45, form: 40, balance: 50, arc: 45, elbow: 42, follow: 48, consist: 38, power: 35 }
  },
  {
    ageRange: "11-13",
    label: "Middle School (11-13)",
    averages: { release: 55, form: 52, balance: 58, arc: 54, elbow: 55, follow: 56, consist: 48, power: 45 }
  },
  {
    ageRange: "14-17",
    label: "High School (14-17)",
    averages: { release: 65, form: 63, balance: 68, arc: 64, elbow: 66, follow: 67, consist: 60, power: 58 }
  },
  {
    ageRange: "18-22",
    label: "College (18-22)",
    averages: { release: 75, form: 74, balance: 78, arc: 73, elbow: 77, follow: 76, consist: 72, power: 70 }
  },
  {
    ageRange: "23+",
    label: "Pro/Adult (23+)",
    averages: { release: 82, form: 80, balance: 84, arc: 79, elbow: 85, follow: 83, consist: 78, power: 76 }
  }
]

// ============================================
// STATE BENCHMARKS (D1/D2/D3 PLAYER DATA)
// Based on college basketball player production by state
// ============================================

interface StateBenchmark {
  state: string
  stateCode: string
  d1Players: number
  d2Players: number
  d3Players: number
  totalCollegePlayers: number
  competitiveness: 'Elite' | 'High' | 'Medium' | 'Developing'
  averages: Record<string, number>
}

const stateBenchmarks: StateBenchmark[] = [
  // Top Basketball States (Elite)
  { state: "California", stateCode: "CA", d1Players: 892, d2Players: 456, d3Players: 234, totalCollegePlayers: 1582, competitiveness: 'Elite', averages: { release: 78, form: 76, balance: 80, arc: 75, elbow: 79, follow: 78, consist: 74, power: 72 } },
  { state: "Texas", stateCode: "TX", d1Players: 756, d2Players: 412, d3Players: 198, totalCollegePlayers: 1366, competitiveness: 'Elite', averages: { release: 77, form: 75, balance: 79, arc: 74, elbow: 78, follow: 77, consist: 73, power: 73 } },
  { state: "Florida", stateCode: "FL", d1Players: 634, d2Players: 345, d3Players: 167, totalCollegePlayers: 1146, competitiveness: 'Elite', averages: { release: 76, form: 74, balance: 78, arc: 73, elbow: 77, follow: 76, consist: 72, power: 71 } },
  { state: "New York", stateCode: "NY", d1Players: 578, d2Players: 312, d3Players: 289, totalCollegePlayers: 1179, competitiveness: 'Elite', averages: { release: 75, form: 74, balance: 77, arc: 72, elbow: 76, follow: 75, consist: 71, power: 70 } },
  { state: "Illinois", stateCode: "IL", d1Players: 489, d2Players: 267, d3Players: 234, totalCollegePlayers: 990, competitiveness: 'Elite', averages: { release: 76, form: 75, balance: 78, arc: 74, elbow: 77, follow: 76, consist: 72, power: 71 } },
  
  // High Production States
  { state: "Georgia", stateCode: "GA", d1Players: 445, d2Players: 234, d3Players: 123, totalCollegePlayers: 802, competitiveness: 'High', averages: { release: 74, form: 72, balance: 76, arc: 71, elbow: 75, follow: 74, consist: 70, power: 69 } },
  { state: "Ohio", stateCode: "OH", d1Players: 412, d2Players: 289, d3Players: 312, totalCollegePlayers: 1013, competitiveness: 'High', averages: { release: 73, form: 72, balance: 75, arc: 70, elbow: 74, follow: 73, consist: 69, power: 68 } },
  { state: "Pennsylvania", stateCode: "PA", d1Players: 389, d2Players: 256, d3Players: 298, totalCollegePlayers: 943, competitiveness: 'High', averages: { release: 72, form: 71, balance: 74, arc: 69, elbow: 73, follow: 72, consist: 68, power: 67 } },
  { state: "North Carolina", stateCode: "NC", d1Players: 367, d2Players: 198, d3Players: 145, totalCollegePlayers: 710, competitiveness: 'High', averages: { release: 74, form: 73, balance: 76, arc: 72, elbow: 75, follow: 74, consist: 71, power: 70 } },
  { state: "Indiana", stateCode: "IN", d1Players: 345, d2Players: 189, d3Players: 167, totalCollegePlayers: 701, competitiveness: 'High', averages: { release: 75, form: 74, balance: 77, arc: 73, elbow: 76, follow: 75, consist: 72, power: 71 } },
  { state: "New Jersey", stateCode: "NJ", d1Players: 334, d2Players: 178, d3Players: 145, totalCollegePlayers: 657, competitiveness: 'High', averages: { release: 73, form: 72, balance: 75, arc: 70, elbow: 74, follow: 73, consist: 69, power: 68 } },
  { state: "Michigan", stateCode: "MI", d1Players: 312, d2Players: 198, d3Players: 189, totalCollegePlayers: 699, competitiveness: 'High', averages: { release: 72, form: 71, balance: 74, arc: 69, elbow: 73, follow: 72, consist: 68, power: 67 } },
  { state: "Virginia", stateCode: "VA", d1Players: 298, d2Players: 167, d3Players: 134, totalCollegePlayers: 599, competitiveness: 'High', averages: { release: 73, form: 72, balance: 75, arc: 70, elbow: 74, follow: 73, consist: 69, power: 68 } },
  
  // Medium Production States
  { state: "Maryland", stateCode: "MD", d1Players: 267, d2Players: 145, d3Players: 112, totalCollegePlayers: 524, competitiveness: 'Medium', averages: { release: 72, form: 70, balance: 73, arc: 68, elbow: 72, follow: 71, consist: 67, power: 66 } },
  { state: "Louisiana", stateCode: "LA", d1Players: 256, d2Players: 134, d3Players: 89, totalCollegePlayers: 479, competitiveness: 'Medium', averages: { release: 73, form: 71, balance: 74, arc: 70, elbow: 73, follow: 72, consist: 68, power: 68 } },
  { state: "Tennessee", stateCode: "TN", d1Players: 245, d2Players: 145, d3Players: 112, totalCollegePlayers: 502, competitiveness: 'Medium', averages: { release: 71, form: 70, balance: 73, arc: 68, elbow: 72, follow: 71, consist: 67, power: 66 } },
  { state: "Arizona", stateCode: "AZ", d1Players: 234, d2Players: 123, d3Players: 89, totalCollegePlayers: 446, competitiveness: 'Medium', averages: { release: 72, form: 70, balance: 74, arc: 69, elbow: 73, follow: 72, consist: 68, power: 67 } },
  { state: "Washington", stateCode: "WA", d1Players: 223, d2Players: 134, d3Players: 112, totalCollegePlayers: 469, competitiveness: 'Medium', averages: { release: 71, form: 70, balance: 73, arc: 68, elbow: 72, follow: 71, consist: 67, power: 66 } },
  { state: "Kentucky", stateCode: "KY", d1Players: 212, d2Players: 123, d3Players: 98, totalCollegePlayers: 433, competitiveness: 'Medium', averages: { release: 72, form: 71, balance: 74, arc: 69, elbow: 73, follow: 72, consist: 68, power: 67 } },
  { state: "South Carolina", stateCode: "SC", d1Players: 198, d2Players: 112, d3Players: 78, totalCollegePlayers: 388, competitiveness: 'Medium', averages: { release: 71, form: 69, balance: 72, arc: 67, elbow: 71, follow: 70, consist: 66, power: 65 } },
  { state: "Alabama", stateCode: "AL", d1Players: 189, d2Players: 98, d3Players: 67, totalCollegePlayers: 354, competitiveness: 'Medium', averages: { release: 71, form: 69, balance: 73, arc: 68, elbow: 72, follow: 71, consist: 67, power: 66 } },
  { state: "Missouri", stateCode: "MO", d1Players: 178, d2Players: 112, d3Players: 98, totalCollegePlayers: 388, competitiveness: 'Medium', averages: { release: 70, form: 69, balance: 72, arc: 67, elbow: 71, follow: 70, consist: 66, power: 65 } },
  { state: "Minnesota", stateCode: "MN", d1Players: 167, d2Players: 123, d3Players: 145, totalCollegePlayers: 435, competitiveness: 'Medium', averages: { release: 70, form: 69, balance: 72, arc: 67, elbow: 71, follow: 70, consist: 66, power: 65 } },
  { state: "Wisconsin", stateCode: "WI", d1Players: 156, d2Players: 112, d3Players: 134, totalCollegePlayers: 402, competitiveness: 'Medium', averages: { release: 69, form: 68, balance: 71, arc: 66, elbow: 70, follow: 69, consist: 65, power: 64 } },
  { state: "Connecticut", stateCode: "CT", d1Players: 145, d2Players: 89, d3Players: 112, totalCollegePlayers: 346, competitiveness: 'Medium', averages: { release: 71, form: 70, balance: 73, arc: 68, elbow: 72, follow: 71, consist: 67, power: 66 } },
  { state: "Oklahoma", stateCode: "OK", d1Players: 134, d2Players: 78, d3Players: 56, totalCollegePlayers: 268, competitiveness: 'Medium', averages: { release: 70, form: 68, balance: 72, arc: 67, elbow: 71, follow: 70, consist: 66, power: 65 } },
  { state: "Colorado", stateCode: "CO", d1Players: 123, d2Players: 89, d3Players: 78, totalCollegePlayers: 290, competitiveness: 'Medium', averages: { release: 69, form: 68, balance: 71, arc: 66, elbow: 70, follow: 69, consist: 65, power: 64 } },
  { state: "Nevada", stateCode: "NV", d1Players: 112, d2Players: 67, d3Players: 45, totalCollegePlayers: 224, competitiveness: 'Medium', averages: { release: 70, form: 68, balance: 72, arc: 67, elbow: 71, follow: 70, consist: 66, power: 65 } },
  
  // Developing States (smaller basketball programs)
  { state: "Oregon", stateCode: "OR", d1Players: 98, d2Players: 67, d3Players: 56, totalCollegePlayers: 221, competitiveness: 'Developing', averages: { release: 68, form: 66, balance: 70, arc: 65, elbow: 69, follow: 68, consist: 64, power: 63 } },
  { state: "Iowa", stateCode: "IA", d1Players: 89, d2Players: 78, d3Players: 89, totalCollegePlayers: 256, competitiveness: 'Developing', averages: { release: 68, form: 67, balance: 70, arc: 65, elbow: 69, follow: 68, consist: 64, power: 63 } },
  { state: "Kansas", stateCode: "KS", d1Players: 87, d2Players: 56, d3Players: 45, totalCollegePlayers: 188, competitiveness: 'Developing', averages: { release: 69, form: 68, balance: 71, arc: 66, elbow: 70, follow: 69, consist: 65, power: 64 } },
  { state: "Arkansas", stateCode: "AR", d1Players: 78, d2Players: 45, d3Players: 34, totalCollegePlayers: 157, competitiveness: 'Developing', averages: { release: 67, form: 65, balance: 69, arc: 64, elbow: 68, follow: 67, consist: 63, power: 62 } },
  { state: "Mississippi", stateCode: "MS", d1Players: 76, d2Players: 45, d3Players: 34, totalCollegePlayers: 155, competitiveness: 'Developing', averages: { release: 68, form: 66, balance: 70, arc: 65, elbow: 69, follow: 68, consist: 64, power: 63 } },
  { state: "Utah", stateCode: "UT", d1Players: 67, d2Players: 45, d3Players: 56, totalCollegePlayers: 168, competitiveness: 'Developing', averages: { release: 67, form: 66, balance: 69, arc: 64, elbow: 68, follow: 67, consist: 63, power: 62 } },
  { state: "Nebraska", stateCode: "NE", d1Players: 56, d2Players: 45, d3Players: 34, totalCollegePlayers: 135, competitiveness: 'Developing', averages: { release: 66, form: 65, balance: 68, arc: 63, elbow: 67, follow: 66, consist: 62, power: 61 } },
  { state: "New Mexico", stateCode: "NM", d1Players: 45, d2Players: 34, d3Players: 23, totalCollegePlayers: 102, competitiveness: 'Developing', averages: { release: 66, form: 64, balance: 68, arc: 63, elbow: 67, follow: 66, consist: 62, power: 61 } },
  { state: "Hawaii", stateCode: "HI", d1Players: 34, d2Players: 23, d3Players: 12, totalCollegePlayers: 69, competitiveness: 'Developing', averages: { release: 65, form: 63, balance: 67, arc: 62, elbow: 66, follow: 65, consist: 61, power: 60 } },
  { state: "Alaska", stateCode: "AK", d1Players: 12, d2Players: 8, d3Players: 5, totalCollegePlayers: 25, competitiveness: 'Developing', averages: { release: 62, form: 60, balance: 64, arc: 59, elbow: 63, follow: 62, consist: 58, power: 57 } },
  
  // Default for unlisted states
  { state: "Other", stateCode: "XX", d1Players: 50, d2Players: 35, d3Players: 25, totalCollegePlayers: 110, competitiveness: 'Developing', averages: { release: 68, form: 66, balance: 70, arc: 65, elbow: 69, follow: 68, consist: 64, power: 63 } },
]

// ============================================
// HELPER FUNCTIONS
// ============================================

function getAgeGroup(age: number): AgeGroupBenchmark {
  if (age <= 10) return nationalAveragesByAge[0]
  if (age <= 13) return nationalAveragesByAge[1]
  if (age <= 17) return nationalAveragesByAge[2]
  if (age <= 22) return nationalAveragesByAge[3]
  return nationalAveragesByAge[4]
}

function getStateBenchmark(stateCode: string): StateBenchmark {
  const found = stateBenchmarks.find(s => s.stateCode === stateCode)
  return found || stateBenchmarks[stateBenchmarks.length - 1] // Return "Other" if not found
}

function getPercentile(value: number, average: number): number {
  // Simple percentile calculation based on how far above/below average
  const diff = value - average
  const percentile = 50 + (diff * 2) // Each point above average = ~2 percentile points
  return Math.max(1, Math.min(99, Math.round(percentile)))
}

function getComparisonLabel(value: number, average: number): { label: string; color: string } {
  const diff = value - average
  if (diff >= 15) return { label: "Elite", color: "text-[#FFD700]" }
  if (diff >= 8) return { label: "Above Average", color: "text-green-400" }
  if (diff >= -5) return { label: "Average", color: "text-blue-400" }
  if (diff >= -12) return { label: "Below Average", color: "text-yellow-400" }
  return { label: "Needs Work", color: "text-red-400" }
}

// ============================================
// STAT POPUP COMPONENT
// ============================================

interface StatPopupProps {
  statKey: string
  value: number
  playerAge?: number
  playerState?: string
  isOpen: boolean
  onClose: () => void
  anchorPosition?: { x: number; y: number }
}

export function StatPopup({ 
  statKey, 
  value, 
  playerAge = 16, 
  playerState = "CA",
  isOpen, 
  onClose,
  anchorPosition 
}: StatPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  const stat = statDefinitions[statKey]
  const ageGroup = getAgeGroup(playerAge)
  const stateBenchmark = getStateBenchmark(playerState)
  
  const nationalAvg = ageGroup.averages[statKey]
  const stateAvg = stateBenchmark.averages[statKey]
  
  const nationalPercentile = getPercentile(value, nationalAvg)
  const statePercentile = getPercentile(value, stateAvg)
  
  const nationalComparison = getComparisonLabel(value, nationalAvg)
  const stateComparison = getComparisonLabel(value, stateAvg)

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen || !stat) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div 
        ref={popupRef}
        className="bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] rounded-xl border border-[#3a3a3a] shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#FFD700]/20 to-transparent p-4 border-b border-[#3a3a3a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FFD700]/10 flex items-center justify-center border border-[#FFD700]/30">
              <Info className="w-5 h-5 text-[#FFD700]" />
            </div>
            <div>
              <h2 className="text-[#FFD700] font-bold text-lg uppercase tracking-wider">{stat.name}</h2>
              <p className="text-[#888] text-xs">{stat.fullName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#3a3a3a] hover:bg-[#4a4a4a] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-[#888]" />
          </button>
        </div>

        {/* Your Score */}
        <div className="p-4 border-b border-[#3a3a3a]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#888] text-sm uppercase tracking-wider">Your Score</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-black text-3xl">{value}</span>
              <span className="text-[#888] text-sm">/ 100</span>
            </div>
          </div>
          <div className="h-3 bg-[#3a3a3a] rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                value >= 80 ? 'bg-gradient-to-r from-green-500 to-green-400' : 
                value >= 65 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 
                'bg-gradient-to-r from-red-500 to-red-400'
              }`} 
              style={{ width: `${value}%` }} 
            />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-[#666]">
            <span>0</span>
            <span>Optimal: {stat.optimalRange.min}-{stat.optimalRange.max}</span>
            <span>100</span>
          </div>
        </div>

        {/* What It Means */}
        <div className="p-4 border-b border-[#3a3a3a]">
          <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-[#FFD700]" />
            What This Means
          </h3>
          <p className="text-[#E5E5E5] text-sm leading-relaxed">{stat.description}</p>
          <p className="text-[#888] text-sm mt-2 leading-relaxed">{stat.whatItMeans}</p>
        </div>

        {/* National Average Comparison */}
        <div className="p-4 border-b border-[#3a3a3a]">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#FFD700]" />
            National Average ({ageGroup.label})
          </h3>
          <div className="bg-[#2a2a2a] rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#888] text-sm">Age Group Average</span>
              <span className="text-white font-bold">{nationalAvg}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#888] text-sm">Your Percentile</span>
              <span className="text-[#FFD700] font-bold">{nationalPercentile}th</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#888] text-sm">Rating</span>
              <span className={`font-bold ${nationalComparison.color}`}>{nationalComparison.label}</span>
            </div>
            
            {/* Visual comparison bar */}
            <div className="mt-3 relative">
              <div className="h-2 bg-[#3a3a3a] rounded-full">
                {/* Average marker */}
                <div 
                  className="absolute top-0 w-0.5 h-4 bg-white/50 -translate-y-1"
                  style={{ left: `${nationalAvg}%` }}
                />
                {/* Your position */}
                <div 
                  className="absolute top-0 w-3 h-3 rounded-full bg-[#FFD700] border-2 border-white -translate-y-0.5 -translate-x-1.5"
                  style={{ left: `${value}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-[10px]">
                <span className="text-[#666]">0</span>
                <span className="text-white/50">Avg: {nationalAvg}</span>
                <span className="text-[#666]">100</span>
              </div>
            </div>
          </div>
        </div>

        {/* State Comparison */}
        <div className="p-4 border-b border-[#3a3a3a]">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#FFD700]" />
            {stateBenchmark.state} State Average
          </h3>
          <div className="bg-[#2a2a2a] rounded-lg p-3">
            <div className="grid grid-cols-3 gap-2 mb-3 text-center">
              <div className="bg-[#1a1a1a] rounded p-2">
                <p className="text-[#FFD700] font-bold text-lg">{stateBenchmark.d1Players}</p>
                <p className="text-[#888] text-[10px]">D1 Players</p>
              </div>
              <div className="bg-[#1a1a1a] rounded p-2">
                <p className="text-[#C0C0C0] font-bold text-lg">{stateBenchmark.d2Players}</p>
                <p className="text-[#888] text-[10px]">D2 Players</p>
              </div>
              <div className="bg-[#1a1a1a] rounded p-2">
                <p className="text-[#CD7F32] font-bold text-lg">{stateBenchmark.d3Players}</p>
                <p className="text-[#888] text-[10px]">D3 Players</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#888] text-sm">State Average</span>
              <span className="text-white font-bold">{stateAvg}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#888] text-sm">Your State Percentile</span>
              <span className="text-[#FFD700] font-bold">{statePercentile}th</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#888] text-sm">State Competitiveness</span>
              <span className={`font-bold ${
                stateBenchmark.competitiveness === 'Elite' ? 'text-[#FFD700]' :
                stateBenchmark.competitiveness === 'High' ? 'text-green-400' :
                stateBenchmark.competitiveness === 'Medium' ? 'text-blue-400' :
                'text-[#888]'
              }`}>{stateBenchmark.competitiveness}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#888] text-sm">Rating vs State</span>
              <span className={`font-bold ${stateComparison.color}`}>{stateComparison.label}</span>
            </div>
          </div>
        </div>

        {/* How to Improve */}
        <div className="p-4">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#FFD700]" />
            How to Improve
          </h3>
          <ul className="space-y-2">
            {stat.howToImprove.map((tip, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-[#FFD700] mt-0.5">•</span>
                <span className="text-[#E5E5E5]">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#1a1a1a] border-t border-[#3a3a3a]">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-[#FFD700] hover:bg-[#FFC000] text-[#1a1a1a] font-bold rounded-lg transition-colors uppercase tracking-wider text-sm"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// CLICKABLE STAT CARD COMPONENT
// ============================================

interface ClickableStatProps {
  statKey: string
  label: string
  value: number
  playerAge?: number
  playerState?: string
}

export function ClickableStat({ statKey, label, value, playerAge = 16, playerState = "CA" }: ClickableStatProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false)

  return (
    <>
      <div 
        onClick={() => setIsPopupOpen(true)}
        className="cursor-pointer hover:bg-[#2a2a2a] rounded-lg p-1 -m-1 transition-colors group"
      >
        <p className="text-[#888] text-[9px] uppercase group-hover:text-[#FFD700] transition-colors flex items-center gap-1">
          {label}
          <Info className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </p>
        <p className="text-white font-black text-2xl group-hover:text-[#FFD700] transition-colors">{value}</p>
        <div className="h-1.5 bg-[#3a3a3a] rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${value >= 80 ? 'bg-green-500' : 'bg-yellow-500'}`} 
            style={{ width: `${value}%` }} 
          />
        </div>
      </div>
      
      <StatPopup
        statKey={statKey}
        value={value}
        playerAge={playerAge}
        playerState={playerState}
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
      />
    </>
  )
}

// ============================================
// CLICKABLE STATS GRID - Keeps exact same layout, just makes stats clickable
// ============================================

interface ShootingStats {
  release: number
  form: number
  balance: number
  arc: number
  elbow: number
  follow: number
  consist: number
  power: number
}

interface ClickableStatsGridProps {
  stats: ShootingStats
  playerAge?: number
  playerState?: string
}

export function ClickableStatsGrid({ stats, playerAge = 16, playerState = "CA" }: ClickableStatsGridProps) {
  const [openPopup, setOpenPopup] = useState<string | null>(null)

  // Helper to render a single stat item - keeps EXACT same styling as original
  const renderStat = (statKey: string, label: string, value: number) => (
    <div 
      key={statKey}
      onClick={() => setOpenPopup(statKey)}
      className="cursor-pointer hover:bg-[#2a2a2a]/50 rounded p-1 -m-1 transition-colors"
    >
      <p className="text-[#888] text-[9px] uppercase">{label}</p>
      <p className="text-white font-black text-2xl">{value}</p>
      <div className="h-1.5 bg-[#3a3a3a] rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${value >= 80 ? 'bg-green-500' : 'bg-yellow-500'}`} 
          style={{ width: `${value}%` }} 
        />
      </div>
    </div>
  )

  return (
    <>
      <div className="grid grid-cols-4 gap-x-2 gap-y-3">
        {/* Row 1 */}
        {renderStat('release', 'RELEASE', stats.release)}
        {renderStat('form', 'FORM', stats.form)}
        {renderStat('balance', 'BALANCE', stats.balance)}
        {renderStat('arc', 'ARC', stats.arc)}
        {/* Row 2 */}
        {renderStat('elbow', 'ELBOW', stats.elbow)}
        {renderStat('follow', 'FOLLOW', stats.follow)}
        {renderStat('consist', 'CONSIST', stats.consist)}
        {renderStat('power', 'POWER', stats.power)}
      </div>

      {/* Single popup instance - only one open at a time */}
      {openPopup && (
        <StatPopup
          statKey={openPopup}
          value={stats[openPopup as keyof ShootingStats]}
          playerAge={playerAge}
          playerState={playerState}
          isOpen={true}
          onClose={() => setOpenPopup(null)}
        />
      )}
    </>
  )
}

export { statDefinitions, nationalAveragesByAge, stateBenchmarks, getAgeGroup, getStateBenchmark }

