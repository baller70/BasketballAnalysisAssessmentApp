"use client"

import React, { useState, useMemo, useRef, useCallback } from "react"
import { SkeletonOverlay, SkeletonData, MeasurementLabel } from "@/components/analysis/SkeletonOverlay"
import { AnalysisDashboard } from "@/components/analysis/AnalysisDashboard"
import { User, Upload, Check, X, Image as ImageIcon, Video, BookOpen, Users, Search, BarChart3, Award, ArrowRight, Zap, Trophy, Target, ClipboardList, Flame, Dumbbell, CircleDot, Share2, Download, Copy, Twitter, Facebook, Linkedin, ChevronLeft, ChevronRight, Calendar, ChevronDown, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { ALL_ELITE_SHOOTERS, LEAGUE_LABELS, LEAGUE_COLORS, POSITION_LABELS, EliteShooter } from "@/data/eliteShooters"
import { toPng } from "html-to-image"
import { useAnalysisStore } from "@/stores/analysisStore"

type ResultsMode = "video" | "image" | "elite" | "guide"

// Dynamic color-coding system for score rings
// Red zone (0-64): Predominantly red, decreasing green
// Green zone (65-100): Various shades of green with increasing intensity
function getScoreRingColors(score: number): { primary: string; secondary: string; glow: string; textColor: string } {
  if (score < 65) {
    // Red zone (0-64)
    // Interpolate from deep red to orange-red as score increases
    const ratio = score / 64
    const r = 239 // Keep red high
    const g = Math.round(68 + (ratio * 80)) // 68-148, more green as approaching 65
    const b = Math.round(68 - (ratio * 30)) // Slightly reduce blue
    const primary = `rgb(${r}, ${g}, ${b})`
    const secondary = `rgb(${Math.max(180, r - 30)}, ${Math.max(30, g - 30)}, ${b})`
    return {
      primary,
      secondary,
      glow: `rgba(239, 68, 68, ${0.3 + (ratio * 0.2)})`,
      textColor: `rgb(${r}, ${Math.min(150, g + 30)}, ${b})`
    }
  } else {
    // Green zone (65-100)
    // Interpolate from light green to maximum intensity green
    const ratio = (score - 65) / 35 // 0-1 within green zone

    if (score >= 88) {
      // High scores (88-100): Darker, more vibrant green
      const intensity = (score - 88) / 12 // 0-1 within high zone
      const r = Math.round(34 - (intensity * 20)) // 34-14
      const g = Math.round(197 + (intensity * 58)) // 197-255 (max saturation at 100)
      const b = Math.round(94 - (intensity * 50)) // 94-44
      const primary = `rgb(${r}, ${g}, ${b})`
      const secondary = `rgb(${Math.max(0, r - 15)}, ${Math.max(150, g - 30)}, ${Math.max(0, b - 20)})`
      return {
        primary,
        secondary,
        glow: `rgba(34, 197, 94, ${0.4 + (intensity * 0.3)})`,
        textColor: `rgb(${r + 20}, ${Math.min(255, g + 20)}, ${b + 20})`
      }
    } else {
      // Medium scores (65-87): Light to medium green
      const r = Math.round(74 - (ratio * 40)) // 74-34
      const g = Math.round(150 + (ratio * 47)) // 150-197
      const b = Math.round(120 - (ratio * 26)) // 120-94
      const primary = `rgb(${r}, ${g}, ${b})`
      const secondary = `rgb(${Math.max(20, r - 20)}, ${g - 20}, ${Math.max(60, b - 20)})`
      return {
        primary,
        secondary,
        glow: `rgba(74, 222, 128, ${0.25 + (ratio * 0.15)})`,
        textColor: `rgb(${r + 30}, ${Math.min(255, g + 40)}, ${b + 30})`
      }
    }
  }
}

// Circular Progress Ring Component for Overall Score
function ScoreRing({ score, size = 100, strokeWidth = 8, showLabel = true, label = "OVR" }: {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  label?: string;
}) {
  const colors = getScoreRingColors(score)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashArray = `${(score / 100) * circumference} ${circumference}`
  const center = size / 2
  const gradientId = `score-ring-gradient-${score}-${Math.random().toString(36).substr(2, 9)}`
  const glowId = `score-ring-glow-${score}-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-full blur-md opacity-50"
        style={{ backgroundColor: colors.glow }}
      />

      <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} />
            <stop offset="100%" stopColor={colors.secondary} />
          </linearGradient>
          <filter id={glowId}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#2a2a2a"
          strokeWidth={strokeWidth}
          opacity="0.6"
        />

        {/* Progress ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={dashArray}
          filter={`url(#${glowId})`}
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      {/* Center text */}
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-black drop-shadow-lg"
            style={{
              fontSize: size * 0.32,
              color: colors.textColor,
              textShadow: `0 0 ${size * 0.15}px ${colors.glow}`
            }}
          >
            {score}
          </span>
          <span className="text-[#888] uppercase tracking-wider" style={{ fontSize: size * 0.1 }}>
            {label}
          </span>
        </div>
      )}
    </div>
  )
}

const DEMO_SKELETON: SkeletonData = {
  leftWrist: { name: "leftWrist", x: 45, y: 15, confidence: 0.95 },
  rightWrist: { name: "rightWrist", x: 55, y: 12, confidence: 0.94 },
  leftElbow: { name: "leftElbow", x: 38, y: 28, confidence: 0.96 },
  rightElbow: { name: "rightElbow", x: 62, y: 25, confidence: 0.95 },
  leftShoulder: { name: "leftShoulder", x: 42, y: 36, confidence: 0.97 },
  rightShoulder: { name: "rightShoulder", x: 58, y: 35, confidence: 0.97 },
  leftHip: { name: "leftHip", x: 44, y: 56, confidence: 0.96 },
  rightHip: { name: "rightHip", x: 56, y: 56, confidence: 0.96 },
  leftKnee: { name: "leftKnee", x: 42, y: 72, confidence: 0.94 },
  rightKnee: { name: "rightKnee", x: 55, y: 70, confidence: 0.93 },
  leftAnkle: { name: "leftAnkle", x: 40, y: 90, confidence: 0.92 },
  rightAnkle: { name: "rightAnkle", x: 54, y: 88, confidence: 0.91 },
}

const DEMO_MEASUREMENTS: MeasurementLabel[] = []

// Default fallback analysis (used when no real analysis available)
const DEFAULT_DEMO_ANALYSIS = {
  overallScore: 78,
  formCategory: "GOOD" as const,
  measurements: { shoulderAngle: 165, elbowAngle: 92, hipAngle: 168, kneeAngle: 145, ankleAngle: 85, releaseHeight: 108, releaseAngle: 52, entryAngle: 45 },
  matchedShooter: { name: "Kevin Durant", team: "Phoenix Suns", similarityScore: 82, position: "SMALL_FORWARD" },
  shootingStats: { release: 67, form: 73, balance: 80, arc: 79, elbow: 90, follow: 80, consist: 74, power: 78 }
}

// Type for analysis data used throughout the results page
interface AnalysisData {
  overallScore: number
  formCategory: "EXCELLENT" | "GOOD" | "NEEDS_IMPROVEMENT" | "CRITICAL"
  measurements: { shoulderAngle: number; elbowAngle: number; hipAngle: number; kneeAngle: number; ankleAngle: number; releaseHeight: number; releaseAngle: number; entryAngle: number }
  matchedShooter: { name: string; team: string; similarityScore: number; position: string }
  shootingStats: { release: number; form: number; balance: number; arc: number; elbow: number; follow: number; consist: number; power: number }
}

// Convert FormAnalysisResult to AnalysisData format
import type { FormAnalysisResult } from "@/lib/formAnalysis"

function convertFormAnalysisToAnalysisData(formAnalysis: FormAnalysisResult | null): AnalysisData {
  if (!formAnalysis) return DEFAULT_DEMO_ANALYSIS

  // Extract angles/metrics into measurements object
  const getMetricValue = (name: string) => {
    const metric = formAnalysis.metrics.find(m => m.name === name)
    return metric?.value ?? 0
  }
  const getAngleValue = (name: string) => {
    const angle = formAnalysis.angles.find(a => a.name === name)
    return angle?.angle ?? 0
  }

  // Map metrics to shootingStats (scale angles/percentages to 0-100 scores)
  const elbowAngle = getAngleValue('Elbow Angle') || getMetricValue('Elbow Angle')
  const kneeAngle = getAngleValue('Knee Bend') || getMetricValue('Knee Bend')
  const shoulderAngle = getAngleValue('Shoulder Angle') || getMetricValue('Shoulder Angle')
  const bodyAlignment = getMetricValue('Body Alignment')
  const releaseHeight = getMetricValue('Release Height')

  // Calculate scores based on how close metrics are to optimal ranges
  const calculateScore = (value: number, optMin: number, optMax: number, maxDeviation: number = 30): number => {
    if (value >= optMin && value <= optMax) return Math.min(100, 85 + Math.random() * 15)
    const mid = (optMin + optMax) / 2
    const deviation = Math.abs(value - mid)
    return Math.max(0, Math.min(100, 100 - (deviation / maxDeviation) * 50))
  }

  const elbowScore = Math.round(calculateScore(elbowAngle, 85, 100, 20))
  const formScore = Math.round((elbowScore + calculateScore(shoulderAngle, 45, 90, 45)) / 2)
  const balanceScore = Math.round(bodyAlignment || 75)
  const releaseScore = Math.round(calculateScore(releaseHeight, 15, 40, 25))

  // Map category
  const categoryMap: Record<string, "EXCELLENT" | "GOOD" | "NEEDS_IMPROVEMENT" | "CRITICAL"> = {
    'EXCELLENT': 'EXCELLENT',
    'GOOD': 'GOOD',
    'NEEDS_IMPROVEMENT': 'NEEDS_IMPROVEMENT',
    'CRITICAL': 'CRITICAL'
  }

  return {
    overallScore: formAnalysis.overallScore,
    formCategory: categoryMap[formAnalysis.category] || 'GOOD',
    measurements: {
      shoulderAngle: shoulderAngle || 165,
      elbowAngle: elbowAngle || 92,
      hipAngle: 168, // Not directly measured, use estimate
      kneeAngle: kneeAngle || 145,
      ankleAngle: 85, // Not directly measured, use estimate
      releaseHeight: releaseHeight ? Math.round(100 + releaseHeight * 0.5) : 108, // Scale to cm-like value
      releaseAngle: 52, // Not directly measured
      entryAngle: 45, // Not directly measured
    },
    matchedShooter: {
      name: "Kevin Durant",
      team: "Phoenix Suns",
      similarityScore: Math.min(95, Math.max(60, formAnalysis.overallScore + Math.round(Math.random() * 10 - 5))),
      position: "SMALL_FORWARD"
    },
    shootingStats: {
      release: releaseScore,
      form: formScore,
      balance: balanceScore,
      arc: Math.round(70 + Math.random() * 15),
      elbow: elbowScore,
      follow: Math.round(70 + Math.random() * 15),
      consist: Math.round(65 + Math.random() * 20),
      power: Math.round(calculateScore(kneeAngle, 130, 160, 30))
    }
  }
}

// Shooter Archetype System - 10 unique archetypes based on player metrics
interface ShooterArchetype {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  gradient: string
}

const SHOOTER_ARCHETYPES: ShooterArchetype[] = [
  { id: "elite", title: "ELITE SHOOTER", description: "Exceptional across all metrics", icon: <Trophy className="w-5 h-5" />, color: "#FFD700", gradient: "from-[#FFD700] to-[#FFA500]" },
  { id: "balanced", title: "BALANCED SHOOTER", description: "Well-rounded fundamentals", icon: <Target className="w-5 h-5" />, color: "#22c55e", gradient: "from-[#22c55e] to-[#16a34a]" },
  { id: "developing", title: "DEVELOPING SHOOTER", description: "Building strong foundations", icon: <Zap className="w-5 h-5" />, color: "#3b82f6", gradient: "from-[#3b82f6] to-[#2563eb]" },
  { id: "power", title: "POWER SHOOTER", description: "Explosive and athletic", icon: <Flame className="w-5 h-5" />, color: "#ef4444", gradient: "from-[#ef4444] to-[#dc2626]" },
  { id: "form", title: "FORM SPECIALIST", description: "Textbook shooting mechanics", icon: <Award className="w-5 h-5" />, color: "#a855f7", gradient: "from-[#a855f7] to-[#9333ea]" },
  { id: "consistent", title: "CONSISTENT SHOOTER", description: "Reliable and repeatable", icon: <BarChart3 className="w-5 h-5" />, color: "#06b6d4", gradient: "from-[#06b6d4] to-[#0891b2]" },
  { id: "rising", title: "RISING STAR", description: "Great potential, rapid growth", icon: <ArrowRight className="w-5 h-5" />, color: "#f97316", gradient: "from-[#f97316] to-[#ea580c]" },
  { id: "fundamentals", title: "FUNDAMENTALS FOCUSED", description: "Strong basics, building blocks", icon: <ClipboardList className="w-5 h-5" />, color: "#10b981", gradient: "from-[#10b981] to-[#059669]" },
  { id: "athletic", title: "ATHLETIC SHOOTER", description: "Physical gifts shine through", icon: <Dumbbell className="w-5 h-5" />, color: "#ec4899", gradient: "from-[#ec4899] to-[#db2777]" },
  { id: "technical", title: "TECHNICAL SHOOTER", description: "Precision and accuracy", icon: <Search className="w-5 h-5" />, color: "#8b5cf6", gradient: "from-[#8b5cf6] to-[#7c3aed]" },
]

// Function to determine shooter archetype based on stats
function getShooterArchetype(stats: AnalysisData['shootingStats']): ShooterArchetype {
  const avg = (stats.release + stats.form + stats.balance + stats.arc + stats.elbow + stats.follow + stats.consist + stats.power) / 8

  // Elite: All metrics 85+
  if (Object.values(stats).every((v: number) => v >= 85)) return SHOOTER_ARCHETYPES[0]

  // Power: High power and balance, lower form
  if (stats.power >= 80 && stats.balance >= 75 && stats.form < 75) return SHOOTER_ARCHETYPES[3]

  // Form Specialist: High form and elbow, may lack power
  if (stats.form >= 80 && stats.elbow >= 85 && stats.power < 75) return SHOOTER_ARCHETYPES[4]

  // Consistent: High consistency, average elsewhere
  if (stats.consist >= 80 && avg >= 70) return SHOOTER_ARCHETYPES[5]

  // Athletic: High power and balance
  if (stats.power >= 80 && stats.balance >= 80) return SHOOTER_ARCHETYPES[8]

  // Technical: High elbow, form, and arc
  if (stats.elbow >= 85 && stats.form >= 75 && stats.arc >= 75) return SHOOTER_ARCHETYPES[9]

  // Rising Star: Above average with room to grow (65-80 range)
  if (avg >= 70 && avg < 80 && Object.values(stats).some((v: number) => v >= 80)) return SHOOTER_ARCHETYPES[6]

  // Fundamentals Focused: Learning the basics (60-75 range)
  if (avg >= 60 && avg < 75) return SHOOTER_ARCHETYPES[7]

  // Developing: Below 60 average
  if (avg < 60) return SHOOTER_ARCHETYPES[2]

  // Default: Balanced Shooter
  return SHOOTER_ARCHETYPES[1]
}

export default function DemoResultsPage() {
  const [activeTab, setActiveTab] = useState("analysis")
  const [resultsMode, setResultsMode] = useState<ResultsMode>("image")

  // Get uploaded image and form analysis from store
  const { mediaPreviewUrl, formAnalysisResult, playerProfile, poseConfidence } = useAnalysisStore()
  const imageUrl = mediaPreviewUrl || "/images/player-shooting.jpg"
  const demoImageUrl = imageUrl

  // Convert form analysis to the format expected by UI components
  const analysisData = useMemo(() => convertFormAnalysisToAnalysisData(formAnalysisResult), [formAnalysisResult])

  // Get player name from profile or use default
  const playerName = playerProfile.name || "KEVIN HOUSTON"

  return (
    <main className="min-h-[calc(100vh-200px)] py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="bg-[#2C2C2C] rounded-lg overflow-hidden shadow-lg">
          {/* Tab Navigation Only */}
          <div className="p-4 border-b border-[#3a3a3a]">
            <div className="flex justify-center">
              <div className="inline-flex rounded-md bg-[#1a1a1a] p-1 text-sm">
                {(["video", "image", "elite", "guide"] as ResultsMode[]).map((mode) => (
                  <button key={mode} onClick={() => setResultsMode(mode)} className={`px-6 py-2 rounded-md flex items-center gap-2 transition-colors uppercase font-semibold tracking-wider ${resultsMode === mode ? "bg-[#FFD700] text-[#111827]" : "text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#374151]"}`}>
                    {mode === "video" && <Video className="w-4 h-4" />}
                    {mode === "image" && <ImageIcon className="w-4 h-4" />}
                    {mode === "elite" && <Users className="w-4 h-4" />}
                    {mode === "guide" && <BookOpen className="w-4 h-4" />}
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {resultsMode === "video" && <VideoModeContent />}
          {resultsMode === "image" && <ImageModeContent demoImageUrl={demoImageUrl} activeTab={activeTab} setActiveTab={setActiveTab} analysisData={analysisData} playerName={playerName} poseConfidence={poseConfidence} />}
          {resultsMode === "elite" && <EliteModeContent analysisData={analysisData} />}
          {resultsMode === "guide" && <GuideModeContent />}
        </div>
      </div>
    </main>
  )
}

function VideoModeContent() {
  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[#FFD700] mb-4">Video Biomechanical Analysis</h2>
        <p className="text-[#E5E5E5] max-w-2xl mx-auto">Upload your shooting video for real-time pose detection, joint tracking, and detailed biomechanical measurements across all shooting phases</p>
      </div>
      <div className="flex justify-center gap-4 mb-8 flex-wrap">
        <span className="bg-red-500/20 text-red-400 border border-red-500/50 px-4 py-2 rounded-full text-sm">Red Lines: Joint connections</span>
        <span className="bg-green-500/20 text-green-400 border border-green-500/50 px-4 py-2 rounded-full text-sm">Green Lines: Body segments</span>
        <span className="bg-blue-500/20 text-blue-400 border border-blue-500/50 px-4 py-2 rounded-full text-sm">Blue Arc: Ball trajectory</span>
      </div>
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-xl p-8 text-center">
          <div className="flex justify-center mb-4"><div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center"><Upload className="w-8 h-8 text-gray-600" /></div></div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Shooting Video</h3>
          <p className="text-gray-600 mb-2">Upload a video of your shooting form for comprehensive biomechanical analysis</p>
          <p className="text-gray-400 text-sm mb-6">Best results: Clear view of full body, good lighting, orange basketball visible</p>
          <button className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors">Select Video File</button>
        </div>
      </div>
    </div>
  )
}

function EliteModeContent({ analysisData }: { analysisData: AnalysisData }) {
  return (
    <div className="p-8 text-center">
      <h2 className="text-3xl font-bold text-[#FFD700] mb-4">Elite Shooters Database</h2>
      <p className="text-[#E5E5E5] mb-8 max-w-2xl mx-auto">Compare your shooting form with NBA elite shooters and learn from the best in the game.</p>
      <p className="text-[#888] mb-4">Your current score: <span className="text-[#FFD700] font-bold">{analysisData.overallScore}</span>/100</p>
      <Link href="/elite-shooters" className="inline-block bg-[#FFD700] hover:bg-[#E5C100] text-[#111827] font-semibold px-8 py-3 rounded-lg transition-colors">View Elite Shooters Database</Link>
    </div>
  )
}

const GUIDE_DATA = [
  {
    correct: { title: "Proper Shooting Hand Grip", subtitle: "Fingertips control for optimal backspin", points: ["Ball rests on fingertips, not palm", "Fingers spread comfortably", "Thumb relaxed at approximately 45°", "Consistent finger pad contact", "Wrist cocked back in set position"] },
    incorrect: { title: "Palming the Ball", subtitle: "Palm contact reduces control and spin", points: ["Ball sits in palm of hand", "Fingers bunched together tightly", "Limited wrist flexibility", "Inconsistent release points", "Reduced backspin on shot"] }
  },
  {
    correct: { title: "Correct Guide Hand Placement", subtitle: "Side support without shot interference", points: ["Guide hand on side of ball", "Thumb pointing upward", "Light fingertip contact only", "Releases cleanly before shot", "Provides balance during set"] },
    incorrect: { title: "Guide Hand Interference", subtitle: "Active guide hand disrupts accuracy", points: ["Guide hand pushes ball during release", "Thumb flicks toward basket", "Creates unwanted side spin", "Inconsistent ball flight path", "Reduces shooting accuracy"] }
  },
  {
    correct: { title: "Optimal Elbow Position", subtitle: "Aligned elbow for straight ball flight", points: ["Elbow directly under ball", "Forearm perpendicular to floor", "Elbow points toward basket", "Minimal lateral deviation", "Creates straight force vector"] },
    incorrect: { title: "Elbow Flared Out", subtitle: "Misaligned elbow creates side spin", points: ["Elbow points outward from body", "Creates angled force vector", "Ball curves during flight", "Requires compensation adjustments", "Reduces consistent accuracy"] }
  },
  {
    correct: { title: "Complete Follow Through", subtitle: "Full extension with wrist snap", points: ["Arm fully extended at release", "Wrist snaps down completely", "Fingers point toward basket", "Hold position until ball lands", "Creates optimal backspin"] },
    incorrect: { title: "Incomplete Follow Through", subtitle: "Shortened motion reduces power", points: ["Arm doesn't fully extend", "Wrist snap is abbreviated", "Fingers don't point at target", "Quick withdrawal of shooting arm", "Inconsistent ball trajectory"] }
  }
]

function GuideModeContent() {
  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[#FFD700] mb-2">Shooting Form Reference</h2>
        <p className="text-[#E5E5E5]">Learn the difference between proper and improper shooting mechanics</p>
      </div>
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="text-center"><span className="inline-flex items-center gap-2 text-green-400 font-semibold text-lg"><Check className="w-5 h-5" /> Correct Form</span></div>
        <div className="text-center"><span className="inline-flex items-center gap-2 text-red-400 font-semibold text-lg"><X className="w-5 h-5" /> Incorrect Form</span></div>
      </div>
      {GUIDE_DATA.map((row, idx) => (
        <div key={idx} className="grid grid-cols-2 gap-6 mb-6">
          <GuideCard type="correct" title={row.correct.title} subtitle={row.correct.subtitle} points={row.correct.points} />
          <GuideCard type="incorrect" title={row.incorrect.title} subtitle={row.incorrect.subtitle} points={row.incorrect.points} />
        </div>
      ))}
    </div>
  )
}

function GuideCard({ type, title, subtitle, points }: { type: "correct" | "incorrect"; title: string; subtitle: string; points: string[] }) {
  const isCorrect = type === "correct"
  return (
    <div className={`rounded-lg p-5 ${isCorrect ? "bg-green-900/20 border border-green-500/30" : "bg-red-900/20 border border-red-500/30"}`}>
      <h3 className={`font-semibold text-lg mb-1 ${isCorrect ? "text-green-400" : "text-red-400"}`}>{title}</h3>
      <p className="text-[#888] text-sm mb-3">{subtitle}</p>
      <ul className="space-y-2">
        {points.map((point, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[#E5E5E5]">
            {isCorrect ? <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" /> : <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />}
            {point}
          </li>
        ))}
      </ul>
    </div>
  )
}


interface ImageModeContentProps {
  demoImageUrl: string
  activeTab: string
  setActiveTab: (t: string) => void
  analysisData: AnalysisData
  playerName: string
  poseConfidence: number
}

function ImageModeContent({ demoImageUrl, activeTab, setActiveTab, analysisData, playerName, poseConfidence }: ImageModeContentProps) {
  // Get the shooter archetype based on stats
  const archetype = getShooterArchetype(analysisData.shootingStats)
  const [showShareModal, setShowShareModal] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const shareCardRef = useRef<HTMLDivElement>(null)

  // Generate and download shareable image
  const handleDownloadImage = useCallback(async () => {
    if (!shareCardRef.current) return
    setIsGeneratingImage(true)
    try {
      const dataUrl = await toPng(shareCardRef.current, { quality: 0.95, pixelRatio: 2 })
      const link = document.createElement("a")
      link.download = `basketball-analysis-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error("Failed to generate image:", err)
    } finally {
      setIsGeneratingImage(false)
    }
  }, [])

  // Copy image to clipboard
  const handleCopyImage = useCallback(async () => {
    if (!shareCardRef.current) return
    setIsGeneratingImage(true)
    try {
      const dataUrl = await toPng(shareCardRef.current, { quality: 0.95, pixelRatio: 2 })
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
      alert("Image copied to clipboard!")
    } catch (err) {
      console.error("Failed to copy image:", err)
      alert("Failed to copy image. Try downloading instead.")
    } finally {
      setIsGeneratingImage(false)
    }
  }, [])

  // Share to social media (opens in new tab)
  const handleShare = useCallback(async (platform: string) => {
    const shareText = `Check out my basketball shooting analysis! I scored ${analysisData.overallScore} OVR and matched ${analysisData.matchedShooter.similarityScore}% with ${analysisData.matchedShooter.name}! #BasketballAnalysis`
    const shareUrl = window.location.href

    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    }

    if (urls[platform]) {
      window.open(urls[platform], "_blank", "width=600,height=400")
    }
  }, [analysisData])

  // Native share API
  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Basketball Analysis",
          text: `Check out my basketball shooting analysis! I scored ${analysisData.overallScore} OVR!`,
          url: window.location.href,
        })
      } catch (err) {
        console.log("Share cancelled or failed:", err)
      }
    } else {
      setShowShareModal(true)
    }
  }, [])

  return (
    <>
      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-[#1a1a1a] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[#3a3a3a]" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-4 border-b border-[#3a3a3a] flex items-center justify-between">
              <h3 className="text-[#FFD700] font-bold text-lg uppercase tracking-wider">Share Your Results</h3>
              <button onClick={() => setShowShareModal(false)} className="text-[#888] hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Shareable Card Preview */}
            <div className="p-4">
              <div ref={shareCardRef} className="bg-gradient-to-br from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] p-6 rounded-xl border border-[#FFD700]/30">
                {/* Logo/Brand */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#FFD700]/20 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-[#FFD700]" />
                  </div>
                  <span className="text-[#FFD700] font-bold text-sm uppercase tracking-wider">Basketball Analysis</span>
                </div>

                {/* Player Info */}
                <div className="flex items-center gap-4 mb-4">
                  {/* Overall Score Ring */}
                  <ScoreRing score={analysisData.overallScore} size={80} strokeWidth={6} />
                  <div className="flex-1">
                    <h4 className="text-xl font-black text-white uppercase">{playerName}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${archetype.color}20`, color: archetype.color }}>{archetype.title}</span>
                    </div>
                  </div>
                </div>

                {/* Key Stats */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="bg-[#0a0a0a] rounded-lg p-2 text-center">
                    <p className="text-lg font-black text-white">{analysisData.shootingStats.form}</p>
                    <p className="text-[#888] text-[10px] uppercase">Form</p>
                  </div>
                  <div className="bg-[#0a0a0a] rounded-lg p-2 text-center">
                    <p className="text-lg font-black text-white">{analysisData.shootingStats.balance}</p>
                    <p className="text-[#888] text-[10px] uppercase">Balance</p>
                  </div>
                  <div className="bg-[#0a0a0a] rounded-lg p-2 text-center">
                    <p className="text-lg font-black text-white">{analysisData.shootingStats.elbow}</p>
                    <p className="text-[#888] text-[10px] uppercase">Elbow</p>
                  </div>
                  <div className="bg-[#0a0a0a] rounded-lg p-2 text-center">
                    <p className="text-lg font-black text-white">{analysisData.shootingStats.consist}</p>
                    <p className="text-[#888] text-[10px] uppercase">Consist</p>
                  </div>
                </div>

                {/* Elite Match */}
                <div className="bg-[#0a0a0a] rounded-lg p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#FFD700]/50 bg-[#3a3a3a] flex items-center justify-center">
                    <img src="https://cdn.nba.com/headshots/nba/latest/1040x760/201142.png" alt="Elite Match" className="w-full h-full object-cover object-top scale-150 translate-y-1" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    <span className="text-xs font-bold text-[#FFD700]">KD</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[#888] text-[10px] uppercase">Matched Elite Shooter</p>
                    <p className="text-white font-bold text-sm">{analysisData.matchedShooter.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#FFD700] font-black text-lg">{analysisData.matchedShooter.similarityScore}%</p>
                    <p className="text-[#888] text-[10px]">Similarity</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Share Options */}
            <div className="p-4 border-t border-[#3a3a3a]">
              <p className="text-[#888] text-sm mb-3 uppercase tracking-wider">Share to</p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <button onClick={() => handleShare("twitter")} className="bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/30 rounded-lg p-3 flex flex-col items-center gap-2 transition-colors">
                  <Twitter className="w-6 h-6 text-[#1DA1F2]" />
                  <span className="text-[#1DA1F2] text-xs font-semibold">Twitter</span>
                </button>
                <button onClick={() => handleShare("facebook")} className="bg-[#4267B2]/10 hover:bg-[#4267B2]/20 border border-[#4267B2]/30 rounded-lg p-3 flex flex-col items-center gap-2 transition-colors">
                  <Facebook className="w-6 h-6 text-[#4267B2]" />
                  <span className="text-[#4267B2] text-xs font-semibold">Facebook</span>
                </button>
                <button onClick={() => handleShare("linkedin")} className="bg-[#0077B5]/10 hover:bg-[#0077B5]/20 border border-[#0077B5]/30 rounded-lg p-3 flex flex-col items-center gap-2 transition-colors">
                  <Linkedin className="w-6 h-6 text-[#0077B5]" />
                  <span className="text-[#0077B5] text-xs font-semibold">LinkedIn</span>
                </button>
              </div>

              <div className="flex gap-3">
                <button onClick={handleDownloadImage} disabled={isGeneratingImage} className="flex-1 bg-[#FFD700] hover:bg-[#E5C100] disabled:bg-[#FFD700]/50 text-[#1a1a1a] font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                  <Download className="w-5 h-5" />
                  {isGeneratingImage ? "Generating..." : "Download Image"}
                </button>
                <button onClick={handleCopyImage} disabled={isGeneratingImage} className="bg-[#3a3a3a] hover:bg-[#4a4a4a] disabled:bg-[#3a3a3a]/50 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        <div className="bg-[#3a3a3a] rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[#FFD700] font-semibold">Pose Analysis</h2>
            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">Detected</span>
          </div>
          <SkeletonOverlay imageUrl={demoImageUrl} skeleton={DEMO_SKELETON} measurements={DEMO_MEASUREMENTS} showLabels={true} showSkeleton={true} />
          <p className="text-[#888] text-sm mt-4 text-center">Skeleton overlay showing key biomechanical joints and measurements</p>
        </div>
        <div className="space-y-6">
          {/* Share Button */}
          <div className="flex justify-end">
            <button
              onClick={handleNativeShare}
              className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#E5C100] hover:to-[#E59400] text-[#1a1a1a] font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-[#FFD700]/20"
            >
              <Share2 className="w-5 h-5" />
              <span className="uppercase tracking-wider text-sm">Share Results</span>
            </button>
          </div>

          {/* Madden-Style Player Card */}
          <div className="bg-[#2a2a2a] rounded-lg overflow-hidden">
            {/* Header Section - Dark with player info */}
            <div className="relative bg-gradient-to-b from-[#1a1a1a] to-[#252525] p-4">
              {/* Background Logo/Graphic - Basketball Hoop SVG */}
              <div className="absolute inset-0 flex items-center justify-center opacity-15">
                <svg className="w-32 h-32" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="25" stroke="#FFD700" strokeWidth="3" />
                  <rect x="35" y="75" width="30" height="4" fill="#FFD700" />
                  <path d="M35 50 L35 75 M65 50 L65 75" stroke="#FFD700" strokeWidth="2" />
                  <circle cx="50" cy="50" r="15" stroke="#FFD700" strokeWidth="2" strokeDasharray="5 3" />
                </svg>
              </div>
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-[#888] text-xs tracking-wider">#23 SG</p>
                  <h2 className="text-2xl font-black text-white uppercase tracking-wide leading-tight">
                    KEVIN<br />HOUSTON
                  </h2>
                </div>
                <div className="flex flex-col items-end">
                  {/* Overall Score Ring */}
                  <ScoreRing score={analysisData.overallScore} size={90} strokeWidth={7} />
                  <p className="text-[#888] text-[10px] leading-tight mt-2 text-right">{playerName} has {Math.round(poseConfidence * 100)} confidence<br/>which is not currently impacting his overall</p>
                </div>
              </div>
            </div>

            {/* Progression History Bar */}
            <div className="bg-[#1a1a1a] px-4 py-2 border-y border-[#3a3a3a]">
              <span className="text-[#888] text-xs font-bold uppercase tracking-wider">Progression History</span>
            </div>

            {/* Bio Stats Row */}
            <div className="bg-[#2a2a2a] px-1 py-2 border-b border-[#3a3a3a]">
              <div className="grid grid-cols-5 divide-x divide-[#3a3a3a]">
                <div className="px-2 text-center">
                  <p className="text-[#888] text-[10px] uppercase">WT</p>
                  <p className="text-white font-bold text-sm">185 LB</p>
                </div>
                <div className="px-2 text-center">
                  <p className="text-[#888] text-[10px] uppercase">AGE</p>
                  <p className="text-white font-bold text-sm">34</p>
                </div>
                <div className="px-2 text-center">
                  <p className="text-[#888] text-[10px] uppercase">HT</p>
                  <p className="text-white font-bold text-sm">6&apos;2&quot;</p>
                </div>
                <div className="px-2 text-center">
                  <p className="text-[#888] text-[10px] uppercase">EXP</p>
                  <p className="text-white font-bold text-sm">PRO</p>
                </div>
                <div className="px-2 text-center">
                  <p className="text-[#888] text-[10px] uppercase">LEAGUE</p>
                  <p className="text-white font-bold text-sm">REC</p>
                </div>
              </div>
            </div>

            {/* Main Content: Attributes + Development */}
            <div className="grid grid-cols-3 bg-[#1a1a1a]">
              {/* Left: Attributes */}
              <div className="col-span-2 p-3 border-r border-[#3a3a3a]">
                {/* Dynamic Archetype Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${archetype.color}20`, color: archetype.color }}
                  >
                    {archetype.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-wider" style={{ color: archetype.color }}>{archetype.title}</h3>
                    <p className="text-[#888] text-[9px]">{archetype.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-x-2 gap-y-3">
                  {/* Row 1 */}
                  <div>
                    <p className="text-[#888] text-[9px] uppercase">RELEASE</p>
                    <p className="text-white font-black text-2xl">{analysisData.shootingStats.release}</p>
                    <div className="h-1.5 bg-[#3a3a3a] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${analysisData.shootingStats.release >= 80 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${analysisData.shootingStats.release}%` }} />
                    </div>
                  </div>
                  <div>
                    <p className="text-[#888] text-[9px] uppercase">FORM</p>
                    <p className="text-white font-black text-2xl">{analysisData.shootingStats.form}</p>
                    <div className="h-1.5 bg-[#3a3a3a] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${analysisData.shootingStats.form >= 80 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${analysisData.shootingStats.form}%` }} />
                    </div>
                  </div>
                  <div>
                    <p className="text-[#888] text-[9px] uppercase">BALANCE</p>
                    <p className="text-white font-black text-2xl">{analysisData.shootingStats.balance}</p>
                    <div className="h-1.5 bg-[#3a3a3a] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${analysisData.shootingStats.balance >= 80 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${analysisData.shootingStats.balance}%` }} />
                    </div>
                  </div>
                  <div>
                    <p className="text-[#888] text-[9px] uppercase">ARC</p>
                    <p className="text-white font-black text-2xl">{analysisData.shootingStats.arc}</p>
                    <div className="h-1.5 bg-[#3a3a3a] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${analysisData.shootingStats.arc >= 80 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${analysisData.shootingStats.arc}%` }} />
                    </div>
                  </div>
                  {/* Row 2 */}
                  <div>
                    <p className="text-[#888] text-[9px] uppercase">ELBOW</p>
                    <p className="text-white font-black text-2xl">{analysisData.shootingStats.elbow}</p>
                    <div className="h-1.5 bg-[#3a3a3a] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${analysisData.shootingStats.elbow >= 80 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${analysisData.shootingStats.elbow}%` }} />
                    </div>
                  </div>
                  <div>
                    <p className="text-[#888] text-[9px] uppercase">FOLLOW</p>
                    <p className="text-white font-black text-2xl">{analysisData.shootingStats.follow}</p>
                    <div className="h-1.5 bg-[#3a3a3a] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${analysisData.shootingStats.follow >= 80 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${analysisData.shootingStats.follow}%` }} />
                    </div>
                  </div>
                  <div>
                    <p className="text-[#888] text-[9px] uppercase">CONSIST</p>
                    <p className="text-white font-black text-2xl">{analysisData.shootingStats.consist}</p>
                    <div className="h-1.5 bg-[#3a3a3a] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${analysisData.shootingStats.consist >= 80 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${analysisData.shootingStats.consist}%` }} />
                    </div>
                  </div>
                  <div>
                    <p className="text-[#888] text-[9px] uppercase">POWER</p>
                    <p className="text-white font-black text-2xl">{analysisData.shootingStats.power}</p>
                    <div className="h-1.5 bg-[#3a3a3a] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${analysisData.shootingStats.power >= 80 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${analysisData.shootingStats.power}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Development */}
              <div className="p-3 bg-[#252525]">
                <h3 className="text-[#FFD700] font-bold text-sm uppercase tracking-wider mb-3 text-center">DEVELOPMENT</h3>
                <div className="flex flex-col items-center">
                  {/* Player Silhouette */}
                  <div className="relative w-20 h-24 mb-2">
                    <svg viewBox="0 0 80 96" className="w-full h-full">
                      {/* Silhouette body */}
                      <ellipse cx="40" cy="20" rx="16" ry="18" fill="#FFD700" />
                      <path d="M20 40 Q20 55 25 70 L25 95 L35 95 L35 70 L45 70 L45 95 L55 95 L55 70 Q60 55 60 40 Q60 30 40 30 Q20 30 20 40" fill="#FFD700" />
                      {/* Arms */}
                      <path d="M20 42 Q10 50 8 65" stroke="#FFD700" strokeWidth="8" fill="none" strokeLinecap="round" />
                      <path d="M60 42 Q70 50 72 65" stroke="#FFD700" strokeWidth="8" fill="none" strokeLinecap="round" />
                      {/* Star on chest */}
                      <polygon points="40,45 42,50 48,50 43,54 45,60 40,56 35,60 37,54 32,50 38,50" fill="#1a1a1a" />
                      {/* Helmet lines */}
                      <path d="M28 12 Q40 8 52 12" stroke="#1a1a1a" strokeWidth="1.5" fill="none" />
                      <circle cx="40" cy="6" r="3" fill="#1a1a1a" />
                    </svg>
                  </div>
                  <p className="text-white font-black text-lg uppercase">{analysisData.formCategory === 'GOOD' ? 'NORMAL' : analysisData.formCategory}</p>
                  <p className="text-[#888] text-[9px] text-center uppercase leading-tight mt-1">THIS PLAYER EARNS XP<br/>AT AN AVERAGE RATE</p>
                </div>
              </div>
            </div>
          </div>
          {/* Redesigned Elite Shooter Match Card */}
          <div className="bg-gradient-to-br from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] rounded-lg overflow-hidden border border-[#FFD700]/20 shadow-lg shadow-[#FFD700]/5">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#FFD700]/10 to-transparent p-4 border-b border-[#FFD700]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#FFD700]/10 flex items-center justify-center border border-[#FFD700]/30">
                  <Trophy className="w-5 h-5 text-[#FFD700]" />
                </div>
                <div>
                  <h2 className="text-[#FFD700] font-bold uppercase tracking-wider text-lg">Matched Elite Shooter</h2>
                  <p className="text-[#888] text-xs">Your form matches this NBA star</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <div className="flex items-center gap-5">
                {/* Player Photo */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#FFD700]/50 shadow-lg shadow-[#FFD700]/20 bg-[#3a3a3a] flex items-center justify-center">
                    <img
                      src="https://cdn.nba.com/headshots/nba/latest/1040x760/201142.png"
                      alt={analysisData.matchedShooter.name}
                      className="w-full h-full object-cover object-top scale-150 translate-y-2"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <span className="text-2xl font-bold text-[#FFD700]">KD</span>
                  </div>
                  {/* Similarity Badge */}
                  <div className="absolute -bottom-2 -right-2 bg-[#FFD700] text-[#1a1a1a] font-black text-sm px-2 py-1 rounded-full shadow-lg">
                    {analysisData.matchedShooter.similarityScore}%
                  </div>
                </div>

                {/* Player Info */}
                <div className="flex-1">
                  <p className="text-2xl font-black text-white uppercase tracking-wide">{analysisData.matchedShooter.name}</p>
                  <p className="text-[#FFD700] font-semibold">{analysisData.matchedShooter.team}</p>
                  <p className="text-[#888] text-sm mt-1">Small Forward • 4x Scoring Champion</p>

                  {/* Similarity Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[#888] uppercase tracking-wider">Form Similarity</span>
                      <span className="text-[#FFD700] font-bold">{analysisData.matchedShooter.similarityScore}%</span>
                    </div>
                    <div className="h-2 bg-[#3a3a3a] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-full transition-all duration-1000"
                        style={{ width: `${analysisData.matchedShooter.similarityScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Match Insights */}
              <div className="mt-4 pt-4 border-t border-[#3a3a3a]">
                <p className="text-xs text-[#888] uppercase tracking-wider mb-2">Why You Match</p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-[#FFD700]/10 text-[#FFD700] text-xs px-3 py-1 rounded-full border border-[#FFD700]/30">Similar Release Height</span>
                  <span className="bg-[#FFD700]/10 text-[#FFD700] text-xs px-3 py-1 rounded-full border border-[#FFD700]/30">High Arc Shot</span>
                  <span className="bg-[#FFD700]/10 text-[#FFD700] text-xs px-3 py-1 rounded-full border border-[#FFD700]/30">Smooth Follow Through</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6 border-t border-[#3a3a3a]">
        <div className="flex gap-2 mb-6 flex-wrap">
          {["analysis", "flaws", "assessment", "comparison", "training"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-md font-semibold uppercase tracking-wider transition-colors ${activeTab === tab ? "bg-[#FFD700] text-[#1a1a1a]" : "bg-[#3a3a3a] text-[#E5E5E5] hover:bg-[#4a4a4a]"}`}>
              {tab === "analysis" ? "BIOMECHANICAL ANALYSIS" : tab === "flaws" ? "IDENTIFIED FLAWS" : tab === "assessment" ? "PLAYER ASSESSMENT" : tab === "comparison" ? "COMPARISON" : "TRAINING PLAN"}
            </button>
          ))}
        </div>
        {activeTab === "analysis" && <AnalysisDashboard measurements={analysisData.measurements} />}
        {activeTab === "flaws" && <FlawsSection />}
        {activeTab === "assessment" && <AssessmentSection />}
        {activeTab === "comparison" && <ComparisonSection analysisData={analysisData} />}
        {activeTab === "training" && <TrainingSection />}
      </div>
    </>
  )
}

function FlawsSection() {
  // State for tracking expanded cards (allow multiple to be open)
  const [expandedCards, setExpandedCards] = useState<number[]>([]);

  const toggleCard = (idx: number) => {
    setExpandedCards(prev =>
      prev.includes(idx)
        ? prev.filter(i => i !== idx)
        : [...prev, idx]
    );
  };

  const flaws = [
    {
      id: 0,
      title: "Elbow Alignment",
      severity: "MODERATE",
      severityScore: 65,
      category: "Form",
      description: "Elbow is slightly flared outward at 92°. Optimal range is 85-90° for maximum accuracy.",
      correction: "Focus on keeping your elbow tucked directly under the ball during the set position.",
      drills: [
        { name: "Wall elbow drill", reps: "3 sets × 20 reps", difficulty: "Easy" },
        { name: "One-hand form shooting", reps: "50 shots", difficulty: "Medium" },
        { name: "Mirror practice", reps: "5 minutes", difficulty: "Easy" }
      ],
      impact: "High impact on shot accuracy"
    },
    {
      id: 1,
      title: "Knee Bend Depth",
      severity: "MINOR",
      severityScore: 78,
      category: "Power",
      description: "Knee angle at 145° shows adequate bend but could benefit from slightly more depth for power.",
      correction: "Deepen knee bend to 135-140° range to generate more leg power in your shot.",
      drills: [
        { name: "Wall sits", reps: "3 sets × 30 sec", difficulty: "Medium" },
        { name: "Jump squats", reps: "3 sets × 15 reps", difficulty: "Hard" },
        { name: "Catch-and-shoot rhythm drills", reps: "30 shots", difficulty: "Medium" }
      ],
      impact: "Medium impact on shot power"
    },
  ]

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty === "Hard") return "bg-red-500/20 text-red-400 border-red-500/30"
    if (difficulty === "Medium") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    return "bg-green-500/20 text-green-400 border-green-500/30"
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] rounded-xl p-6 border border-[#3a3a3a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/30">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-red-400 uppercase tracking-wider" style={{ textShadow: '0 0 20px rgba(239, 68, 68, 0.3)' }}>
                Identified Flaws
              </h2>
              <p className="text-[#888] text-sm">Areas requiring improvement in your shooting form</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center px-4 py-2 bg-red-500/10 rounded-lg border border-red-500/30">
              <p className="text-red-400 text-2xl font-black">{flaws.length}</p>
              <p className="text-red-400/70 text-xs uppercase">Issues Found</p>
            </div>
          </div>
        </div>
      </div>

      {/* Flaws Cards - Collapsible Accordion */}
      <div className="space-y-4">
        {flaws.map((flaw, idx) => {
          const isExpanded = expandedCards.includes(idx);
          return (
            <div
              key={idx}
              className="bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-xl overflow-hidden border border-red-500/50 shadow-lg shadow-red-500/10 transition-all duration-300"
              style={{ boxShadow: `0 0 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(239, 68, 68, 0.1)` }}
            >
              {/* Clickable Card Header */}
              <button
                onClick={() => toggleCard(idx)}
                className="w-full bg-[#1a1a1a]/80 p-5 border-b border-red-500/30 hover:bg-[#1a1a1a]/90 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center border border-red-500/40 text-red-400">
                      <X className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-black text-[#E5E5E5] uppercase tracking-wide">{flaw.title}</h3>
                      <span className="text-[#888] text-xs uppercase tracking-wider">{flaw.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-red-400 bg-[#1a1a1a] border border-red-500/50">
                      {flaw.severity}
                    </div>
                    <div className={`w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center border border-red-500/30 text-red-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Severity Progress Bar - Always visible */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[#888] text-xs">Severity Level</span>
                    <span className="text-xs font-bold text-red-400">{flaw.severityScore}%</span>
                  </div>
                  <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-600"
                      style={{ width: `${flaw.severityScore}%` }}
                    />
                  </div>
                </div>
              </button>

              {/* Expandable Card Body */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <div className="p-5 space-y-4">
                  {/* Description */}
                  <div className="bg-[#1a1a1a]/50 rounded-lg p-4 border border-red-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 text-xs uppercase tracking-wider font-bold">Analysis</span>
                    </div>
                    <p className="text-[#E5E5E5] text-sm leading-relaxed">{flaw.description}</p>
                  </div>

                  {/* Correction */}
                  <div className="bg-gradient-to-r from-[#FFD700]/10 to-transparent rounded-lg p-4 border border-[#FFD700]/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="w-4 h-4 text-[#FFD700]" />
                      <span className="text-[#FFD700] text-xs uppercase tracking-wider font-bold">Correction</span>
                    </div>
                    <p className="text-[#E5E5E5] text-sm leading-relaxed">{flaw.correction}</p>
                  </div>

                  {/* Drills */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Dumbbell className="w-4 h-4 text-[#888]" />
                      <span className="text-[#888] text-xs uppercase tracking-wider font-bold">Recommended Drills</span>
                    </div>
                    <div className="space-y-2">
                      {flaw.drills.map((drill, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between bg-[#1a1a1a]/50 rounded-lg p-3 border border-[#2a2a2a] hover:border-red-500/30 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center text-red-400 font-bold text-sm border border-red-500/30">
                              {i + 1}
                            </div>
                            <div>
                              <p className="text-[#E5E5E5] text-sm font-medium">{drill.name}</p>
                              <p className="text-[#888] text-xs">{drill.reps}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-bold border ${getDifficultyColor(drill.difficulty)}`}>
                            {drill.difficulty}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Impact Badge */}
                  <div className="flex items-center justify-center pt-2">
                    <span className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 text-red-400 bg-[#1a1a1a] border border-red-500/50">
                      <Zap className="w-3 h-3" /> {flaw.impact}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TrainingSection() {
  const weeklyPlan = [
    {
      day: "Monday",
      dayShort: "MON",
      focus: "Form Fundamentals",
      iconType: "target" as const,
      color: { bg: "from-blue-500/20 to-blue-600/10", border: "border-blue-500/40", text: "text-blue-400", accent: "#3b82f6" },
      duration: "45 min",
      intensity: "Low",
      exercises: [
        { name: "Wall shooting", reps: "50 reps", time: "15 min" },
        { name: "One-hand form shots", reps: "30 reps", time: "10 min" },
        { name: "Mirror practice", reps: "20 reps", time: "10 min" },
        { name: "Cool down stretching", reps: "—", time: "10 min" }
      ]
    },
    {
      day: "Wednesday",
      dayShort: "WED",
      focus: "Power Generation",
      iconType: "dumbbell" as const,
      color: { bg: "from-yellow-500/20 to-yellow-600/10", border: "border-yellow-500/40", text: "text-yellow-400", accent: "#eab308" },
      duration: "50 min",
      intensity: "Medium",
      exercises: [
        { name: "Jump shots from free throw", reps: "40 reps", time: "15 min" },
        { name: "Catch-and-shoot", reps: "30 reps", time: "12 min" },
        { name: "Leg drive drills", reps: "3 sets × 10", time: "10 min" },
        { name: "Core exercises", reps: "3 sets × 15", time: "13 min" }
      ]
    },
    {
      day: "Friday",
      dayShort: "FRI",
      focus: "Game Situations",
      iconType: "trophy" as const,
      color: { bg: "from-green-500/20 to-green-600/10", border: "border-green-500/40", text: "text-green-400", accent: "#22c55e" },
      duration: "55 min",
      intensity: "High",
      exercises: [
        { name: "Off-dribble shots", reps: "30 reps", time: "15 min" },
        { name: "Contested shots", reps: "20 reps", time: "12 min" },
        { name: "Game speed shooting", reps: "25 reps", time: "15 min" },
        { name: "Free throws (pressure)", reps: "20 reps", time: "13 min" }
      ]
    },
  ]

  const getPlanIcon = (iconType: string) => {
    switch (iconType) {
      case "target": return <Target className="w-5 h-5" />
      case "dumbbell": return <Dumbbell className="w-5 h-5" />
      case "trophy": return <Trophy className="w-5 h-5" />
      default: return <CircleDot className="w-5 h-5" />
    }
  }

  const getIntensityColor = (intensity: string) => {
    if (intensity === "High") return "bg-red-500/20 text-red-400 border-red-500/30"
    if (intensity === "Medium") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    return "bg-green-500/20 text-green-400 border-green-500/30"
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] rounded-xl p-6 border border-[#3a3a3a]">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#FFD700]/10 flex items-center justify-center border border-[#FFD700]/30">
              <span className="text-3xl">📅</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#FFD700] uppercase tracking-wider" style={{ textShadow: '0 0 20px rgba(255, 215, 0, 0.3)' }}>
                Weekly Training Plan
              </h2>
              <p className="text-[#888] text-sm">Personalized shooting development program</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center px-4 py-2 bg-[#2a2a2a] rounded-lg border border-[#3a3a3a]">
              <p className="text-[#FFD700] text-xl font-black">3</p>
              <p className="text-[#888] text-xs uppercase">Training Days</p>
            </div>
            <div className="text-center px-4 py-2 bg-[#2a2a2a] rounded-lg border border-[#3a3a3a]">
              <p className="text-[#FFD700] text-xl font-black">2.5h</p>
              <p className="text-[#888] text-xs uppercase">Total Time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Week Calendar Strip */}
      <div className="bg-[#2a2a2a] rounded-xl p-4 border border-[#3a3a3a]">
        <div className="grid grid-cols-7 gap-2">
          {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => {
            const isTrainingDay = ["MON", "WED", "FRI"].includes(day)
            const trainingData = weeklyPlan.find(p => p.dayShort === day)
            return (
              <div
                key={day}
                className={`text-center p-3 rounded-lg transition-all ${
                  isTrainingDay
                    ? `bg-gradient-to-br ${trainingData?.color.bg} border ${trainingData?.color.border}`
                    : 'bg-[#1a1a1a] border border-[#2a2a2a]'
                }`}
              >
                <p className={`text-xs font-bold uppercase tracking-wider ${isTrainingDay ? trainingData?.color.text : 'text-[#666]'}`}>
                  {day}
                </p>
                <div className="mt-2">
                  {isTrainingDay && trainingData ? (
                    <span className={trainingData.color.text}>{getPlanIcon(trainingData.iconType)}</span>
                  ) : (
                    <span className="text-[#666]"><CircleDot className="w-5 h-5" /></span>
                  )}
                </div>
                <p className={`text-[10px] mt-1 ${isTrainingDay ? trainingData?.color.text : 'text-[#555]'}`}>
                  {isTrainingDay ? trainingData?.focus.split(' ')[0] : 'Rest'}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Training Day Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {weeklyPlan.map((plan, idx) => (
          <div
            key={idx}
            className={`bg-gradient-to-br ${plan.color.bg} rounded-xl overflow-hidden border ${plan.color.border} hover:scale-[1.02] transition-all duration-300`}
            style={{ boxShadow: `0 0 30px rgba(0, 0, 0, 0.5)` }}
          >
            {/* Card Header */}
            <div className="bg-[#1a1a1a]/80 p-5 border-b border-[#3a3a3a]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border ${plan.color.text}`}
                    style={{ backgroundColor: `${plan.color.accent}20`, borderColor: `${plan.color.accent}50` }}
                  >
                    {getPlanIcon(plan.iconType)}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#E5E5E5] uppercase">{plan.day}</h3>
                    <p className={`text-xs font-bold uppercase tracking-wider ${plan.color.text}`}>{plan.focus}</p>
                  </div>
                </div>
              </div>

              {/* Duration & Intensity */}
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded text-xs font-bold bg-[#2a2a2a] text-[#888] border border-[#3a3a3a] flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  {plan.duration}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-bold border flex items-center gap-1 ${getIntensityColor(plan.intensity)}`}>
                  <Flame className="w-3 h-3" />
                  {plan.intensity}
                </span>
              </div>
            </div>

            {/* Exercises List */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList className="w-4 h-4 text-[#888]" />
                <span className="text-[#888] text-xs uppercase tracking-wider font-bold">Exercises</span>
              </div>
              <div className="space-y-3">
                {plan.exercises.map((exercise, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-[#1a1a1a]/50 rounded-lg p-3 border border-[#2a2a2a] hover:border-[#3a3a3a] transition-all group"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-[#2a2a2a] flex items-center justify-center border border-[#3a3a3a] group-hover:border-[#4a4a4a] transition-all ${plan.color.text}`}>
                      <CircleDot className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#E5E5E5] text-sm font-medium truncate">{exercise.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-[#888]">
                        <span>{exercise.reps}</span>
                        <span>•</span>
                        <span>{exercise.time}</span>
                      </div>
                    </div>
                    <div className="w-5 h-5 rounded border border-[#3a3a3a] bg-[#2a2a2a] flex items-center justify-center opacity-50 group-hover:opacity-100 transition-all">
                      <Check className="w-3 h-3 text-[#888] opacity-0 group-hover:opacity-100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card Footer */}
            <div className="px-5 pb-5">
              <button className={`w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all bg-gradient-to-r ${plan.color.bg} border ${plan.color.border} ${plan.color.text} hover:brightness-110`}>
                Start Workout
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly Progress Summary */}
      <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#3a3a3a]">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-[#FFD700]" />
          <h3 className="text-[#FFD700] text-sm font-bold uppercase tracking-wider">Weekly Goals</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a] text-center">
            <p className="text-2xl font-black text-[#FFD700]">295</p>
            <p className="text-[#888] text-xs uppercase tracking-wider">Total Shots</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a] text-center">
            <p className="text-2xl font-black text-blue-400">150</p>
            <p className="text-[#888] text-xs uppercase tracking-wider">Form Shots</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a] text-center">
            <p className="text-2xl font-black text-yellow-400">100</p>
            <p className="text-[#888] text-xs uppercase tracking-wider">Game Shots</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a] text-center">
            <p className="text-2xl font-black text-green-400">45</p>
            <p className="text-[#888] text-xs uppercase tracking-wider">Drills</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const ASSESSMENT_SKILLS = [
  { name: "Release Form", score: 85, status: "Good" },
  { name: "Follow Through", score: 70, status: "Developing" },
  { name: "Balance & Base", score: 90, status: "Excellent" },
  { name: "Arc & Trajectory", score: 65, status: "Developing" },
  { name: "Elbow Alignment", score: 55, status: "Needs Work" },
  { name: "Guide Hand", score: 80, status: "Good" },
  { name: "Shot Consistency", score: 72, status: "Satisfactory" },
  { name: "Power Transfer", score: 78, status: "Good" },
]

// Apple Watch-style Activity Rings Component with Dynamic Color-Coding
function ActivityRings({ overallScore, consistencyScore, formScore }: { overallScore: number; consistencyScore: number; formScore: number }) {
  // Get dynamic colors for each score
  const overallColors = getScoreRingColors(overallScore)
  const consistencyColors = getScoreRingColors(consistencyScore)
  const formColors = getScoreRingColors(formScore)

  const rings = [
    { score: overallScore, radius: 44, strokeWidth: 8, colors: overallColors, label: "Overall" },
    { score: consistencyScore, radius: 33, strokeWidth: 7, colors: consistencyColors, label: "Consistency" },
    { score: formScore, radius: 23, strokeWidth: 6, colors: formColors, label: "Form" },
  ]

  return (
    <div className="relative w-40 h-40 mx-auto">
      {/* Glow effect background */}
      <div
        className="absolute inset-0 rounded-full blur-xl"
        style={{ background: `radial-gradient(circle, ${overallColors.glow} 0%, ${consistencyColors.glow} 50%, transparent 70%)` }}
      />

      <svg className="w-full h-full transform -rotate-90 drop-shadow-lg" viewBox="0 0 100 100">
        <defs>
          {rings.map((ring, i) => (
            <linearGradient key={`grad-${i}`} id={`activity-ring-gradient-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={ring.colors.primary} />
              <stop offset="100%" stopColor={ring.colors.secondary} />
            </linearGradient>
          ))}
          <filter id="activity-glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {rings.map((ring, i) => {
          const circumference = 2 * Math.PI * ring.radius
          const dashArray = `${(ring.score / 100) * circumference} ${circumference}`
          return (
            <g key={i}>
              {/* Background track */}
              <circle cx="50" cy="50" r={ring.radius} fill="none" stroke="#2a2a2a" strokeWidth={ring.strokeWidth} opacity="0.6" />
              {/* Progress ring */}
              <circle
                cx="50" cy="50" r={ring.radius} fill="none"
                stroke={`url(#activity-ring-gradient-${i})`}
                strokeWidth={ring.strokeWidth}
                strokeLinecap="round"
                strokeDasharray={dashArray}
                filter="url(#activity-glow)"
                className="transition-all duration-1000 ease-out"
              />
            </g>
          )
        })}
      </svg>

      {/* Center text with dynamic color */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-3xl font-bold drop-shadow-lg"
          style={{ color: overallColors.textColor, textShadow: `0 0 10px ${overallColors.glow}` }}
        >
          {overallScore}%
        </span>
        <span className="text-[#888] text-xs">Overall</span>
      </div>

      {/* Ring labels with dynamic colors */}
      <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-3 text-[10px]">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ background: `linear-gradient(135deg, ${overallColors.primary}, ${overallColors.secondary})` }} />
          Overall
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ background: `linear-gradient(135deg, ${consistencyColors.primary}, ${consistencyColors.secondary})` }} />
          Consistency
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ background: `linear-gradient(135deg, ${formColors.primary}, ${formColors.secondary})` }} />
          Form
        </span>
      </div>
    </div>
  )
}

// SPAR Data - Shooting Performance Analysis Rating
const SPAR_CATEGORIES = [
  {
    name: "Shooting Form",
    color: { border: "#f97316", bg: "from-orange-500 to-orange-600", text: "text-orange-400" },
    stats: [
      { name: "Release Point", current: 72, max: 88 },
      { name: "Follow Through", current: 68, max: 85 },
      { name: "Arc Height", current: 65, max: 82 },
    ]
  },
  {
    name: "Shot Types",
    color: { border: "#22c55e", bg: "from-green-500 to-green-600", text: "text-green-400" },
    stats: [
      { name: "Three-Point Shot", current: 58, max: 75 },
      { name: "Mid-Range Shot", current: 74, max: 88 },
      { name: "Free Throw", current: 82, max: 92 },
    ]
  },
  {
    name: "Physical",
    color: { border: "#8b5cf6", bg: "from-violet-500 to-purple-600", text: "text-violet-400" },
    stats: [
      { name: "Balance & Stability", current: 85, max: 95 },
      { name: "Leg Drive", current: 71, max: 86 },
      { name: "Core Strength", current: 67, max: 82 },
    ]
  },
  {
    name: "Consistency",
    color: { border: "#ef4444", bg: "from-red-500 to-red-600", text: "text-red-400" },
    stats: [
      { name: "Shot Repeatability", current: 63, max: 85 },
      { name: "Pressure Performance", current: 58, max: 80 },
      { name: "Game Situational", current: 61, max: 78 },
    ]
  },
  {
    name: "Mental",
    color: { border: "#06b6d4", bg: "from-cyan-500 to-cyan-600", text: "text-cyan-400" },
    stats: [
      { name: "Focus", current: 76, max: 90 },
      { name: "Confidence", current: 69, max: 88 },
    ]
  }
]

// SPAR Stat Bar Component - Video game style with diagonal stripes
function SPARStatBar({ name, current, max }: { name: string; current: number; max: number }) {
  const fillPercent = (current / 99) * 100 // Scale to 99 max for display
  const maxPercent = (max / 99) * 100
  // 2-tier color system: red (<65) and green (≥65)
  const isGood = current >= 65
  const barColor = isGood
    ? { border: "#22c55e", bg: "from-green-500 to-green-600", text: "text-green-400" }
    : { border: "#ef4444", bg: "from-red-500 to-red-600", text: "text-red-400" }

  return (
    <div className="relative">
      {/* Stat name label */}
      <div className="flex items-center gap-2 mb-1">
        <div className="flex gap-0.5">
          <span className="w-1 h-1 rounded-full bg-[#666]" />
          <span className="w-1 h-1 rounded-full bg-[#666]" />
          <span className="w-1 h-1 rounded-full bg-[#666]" />
        </div>
        <span className={`text-xs font-semibold uppercase tracking-wide ${barColor.text}`}>{name}</span>
        <div className="flex gap-0.5">
          <span className="w-1 h-1 rounded-full bg-[#666]" />
          <span className="w-1 h-1 rounded-full bg-[#666]" />
          <span className="w-1 h-1 rounded-full bg-[#666]" />
        </div>
      </div>

      {/* Bar container */}
      <div className="flex items-center gap-2">
        {/* Current value - upright text */}
        <span className="text-lg font-bold text-white w-8 text-right">{current}</span>

        {/* Progress bar with stripes */}
        <div
          className="flex-1 h-5 relative overflow-hidden"
          style={{ borderLeft: `3px solid ${barColor.border}`, borderRight: `3px solid ${barColor.border}` }}
        >
          {/* Background (unfilled) with gray stripes */}
          <div className="absolute inset-0 bg-[#1a1a1a]">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  -60deg,
                  transparent,
                  transparent 2px,
                  #333 2px,
                  #333 4px
                )`
              }}
            />
          </div>

          {/* Filled portion with colored stripes */}
          <div
            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${barColor.bg}`}
            style={{ width: `${fillPercent}%` }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  -60deg,
                  transparent,
                  transparent 3px,
                  rgba(0,0,0,0.3) 3px,
                  rgba(0,0,0,0.3) 6px
                )`
              }}
            />
            {/* Shine effect */}
            <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent" />
          </div>

          {/* Max indicator line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/50"
            style={{ left: `${maxPercent}%` }}
          />
        </div>

        {/* Max value - upright text */}
        <div className="flex flex-col items-center w-8">
          <span className="text-sm font-bold text-[#888]">{max}</span>
          <span className="text-[8px] text-[#666] uppercase">Max</span>
        </div>
      </div>
    </div>
  )
}

// SPAR Category Component
function SPARCategory({ category }: { category: typeof SPAR_CATEGORIES[0] }) {
  return (
    <div className="space-y-3">
      {category.stats.map((stat, idx) => (
        <SPARStatBar key={idx} name={stat.name} current={stat.current} max={stat.max} />
      ))}
    </div>
  )
}

// Mock data for progress images (simulating 65 uploads over time)
const MOCK_PROGRESS_IMAGES = Array.from({ length: 65 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (65 - i) * 2); // Every 2 days going back
  const score = Math.min(99, Math.max(60, 72 + Math.floor(i * 0.4) + Math.floor(Math.random() * 8 - 4))); // Gradual improvement with variance
  return {
    id: i + 1,
    url: "/images/player-shooting.jpg", // Reusing demo image
    filename: `shooting-form-${date.toISOString().split('T')[0]}.jpg`,
    date: date.toISOString().split('T')[0],
    score,
    keypoints: 17,
    status: 'complete' as const,
  };
});

function AssessmentSection() {
  const overallScore = Math.round(ASSESSMENT_SKILLS.reduce((acc, s) => acc + s.score, 0) / ASSESSMENT_SKILLS.length)
  const consistencyScore = Math.round((ASSESSMENT_SKILLS[6].score + ASSESSMENT_SKILLS[0].score) / 2) // Shot Consistency + Release Form
  const formScore = Math.round((ASSESSMENT_SKILLS[1].score + ASSESSMENT_SKILLS[4].score + ASSESSMENT_SKILLS[3].score) / 3) // Follow Through + Elbow + Arc
  const assessmentDate = new Date().toISOString().split("T")[0]

  // Gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState(MOCK_PROGRESS_IMAGES.length - 1); // Start with most recent
  const [currentPage, setCurrentPage] = useState(Math.floor((MOCK_PROGRESS_IMAGES.length - 1) / 8)); // 8 thumbnails per page
  const THUMBNAILS_PER_PAGE = 8;
  const totalPages = Math.ceil(MOCK_PROGRESS_IMAGES.length / THUMBNAILS_PER_PAGE);

  const selectedImage = MOCK_PROGRESS_IMAGES[selectedImageIndex];
  const startIndex = currentPage * THUMBNAILS_PER_PAGE;
  const visibleThumbnails = MOCK_PROGRESS_IMAGES.slice(startIndex, startIndex + THUMBNAILS_PER_PAGE);

  const goToPrevImage = () => {
    if (selectedImageIndex > 0) {
      const newIndex = selectedImageIndex - 1;
      setSelectedImageIndex(newIndex);
      // Update page if needed
      const newPage = Math.floor(newIndex / THUMBNAILS_PER_PAGE);
      if (newPage !== currentPage) setCurrentPage(newPage);
    }
  };

  const goToNextImage = () => {
    if (selectedImageIndex < MOCK_PROGRESS_IMAGES.length - 1) {
      const newIndex = selectedImageIndex + 1;
      setSelectedImageIndex(newIndex);
      // Update page if needed
      const newPage = Math.floor(newIndex / THUMBNAILS_PER_PAGE);
      if (newPage !== currentPage) setCurrentPage(newPage);
    }
  };

  const selectImage = (index: number) => {
    setSelectedImageIndex(index);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Sidebar - Activity Rings + Details + SPAR Indicators */}
      <div className="space-y-6">
        {/* Overall Score - Apple Watch Activity Rings */}
        <div className="bg-[#3a3a3a] rounded-lg p-6">
          <h3 className="text-[#888] text-sm uppercase tracking-wider mb-6">Key Skills</h3>
          <ActivityRings overallScore={overallScore} consistencyScore={consistencyScore} formScore={formScore} />
        </div>

        {/* Details */}
        <div className="bg-[#3a3a3a] rounded-lg p-6">
          <h3 className="text-[#888] text-sm uppercase tracking-wider mb-4">Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[#888]">Age:</span><span className="text-[#E5E5E5]">34</span></div>
            <div className="flex justify-between"><span className="text-[#888]">Position:</span><span className="text-[#E5E5E5]">Guard</span></div>
            <div className="flex justify-between"><span className="text-[#888]">Assessment Date:</span><span className="text-[#E5E5E5]">{assessmentDate}</span></div>
            <div className="flex justify-between"><span className="text-[#888]">Program:</span><span className="text-[#E5E5E5]">Shooting Mechanics Analysis</span></div>
          </div>
        </div>

        {/* SPAR Indicators - Moved to Sidebar */}
        <div className="bg-[#3a3a3a] rounded-lg p-6">
          <div className="flex flex-col gap-2 mb-6">
            <h3 className="text-lg font-bold text-[#FFD700] uppercase tracking-wider">SPAR Indicators</h3>
            <span className="text-[10px] text-[#888] bg-[#2a2a2a] px-2 py-1 rounded w-fit">Shooting Performance Analysis Rating</span>
          </div>

          <div className="space-y-6">
            {SPAR_CATEGORIES.map((category, idx) => (
              <div key={idx}>
                {/* Category header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: category.color.border }} />
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${category.color.text}`}>{category.name}</h4>
                  <div className="flex-1 h-px bg-gradient-to-r from-[#4a4a4a] to-transparent ml-2" />
                </div>
                <SPARCategory category={category} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Content - Assessment Results + Development Recommendations */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <div className="bg-[#3a3a3a] rounded-lg p-6">
          <h2 className="text-2xl font-bold text-[#FFD700] mb-1">Kevin Houston</h2>
          <p className="text-[#888] uppercase tracking-wider text-sm">Shooting Mechanics Assessment Report</p>
        </div>

        {/* Assessment Results */}
        <div className="bg-[#3a3a3a] rounded-lg p-6">
          <h3 className="text-xl font-bold text-[#E5E5E5] uppercase tracking-wider mb-4">Assessment Results</h3>
          <div className="mb-4">
            <h4 className="text-[#FFD700] font-semibold uppercase text-sm mb-2">Overall Performance Rating</h4>
            <p className="text-[#888] text-sm mb-1">Basketball Shooting Mechanics Program</p>
            <p className="text-[#888] text-sm mb-3">Assessment Date: {assessmentDate}</p>
            <ul className="space-y-2 text-sm text-[#E5E5E5]">
              <li className="flex items-start gap-2"><span className="text-[#FFD700]">•</span>Achieved {overallScore}% overall shooting form rating</li>
              <li className="flex items-start gap-2"><span className="text-[#FFD700]">•</span>Demonstrated {ASSESSMENT_SKILLS.filter(s => s.score >= 80).length} skills at advanced level</li>
              <li className="flex items-start gap-2"><span className="text-[#FFD700]">•</span>Shows strong foundation in Balance & Base mechanics</li>
              <li className="flex items-start gap-2"><span className="text-[#FFD700]">•</span>Ready for targeted development in identified growth areas</li>
            </ul>
          </div>
        </div>

        {/* Development Recommendations */}
        <div className="bg-[#3a3a3a] rounded-lg p-6">
          <h3 className="text-xl font-bold text-[#E5E5E5] uppercase tracking-wider mb-4">Development Recommendations</h3>

          <div className="mb-6">
            <h4 className="text-[#FFD700] font-semibold uppercase text-sm mb-3">Form Focus Areas</h4>
            <div className="space-y-3 text-sm text-[#E5E5E5]">
              <p><span className="text-[#888]">**Primary Focus:**</span> Dedicate 15-20 minutes daily to elbow alignment drills. Set up in front of a mirror to practice keeping the elbow directly under the ball, which will improve shot straightness and consistency.</p>
              <p><span className="text-[#888]">**Arc Improvement:**</span> Work on increasing release angle to achieve optimal 45-52° arc. Higher arc creates a larger target area at the rim and improves shooting percentage from all distances.</p>
              <p><span className="text-[#888]">**Follow Through:**</span> Focus on completing the follow-through motion with full wrist snap. Hold the &quot;gooseneck&quot; position until the ball reaches the rim to build muscle memory.</p>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-[#FFD700] font-semibold uppercase text-sm mb-3">Technical Analysis</h4>
            <div className="space-y-3 text-sm text-[#E5E5E5]">
              <p><span className="text-[#888]">**Strength Observation:**</span> Excellent balance and base positioning during shot preparation. Feet are properly aligned and weight distribution allows for consistent power generation through the legs.</p>
              <p><span className="text-[#888]">**Development Area:**</span> Elbow alignment needs refinement. Currently showing 92° angle which creates slight lateral drift. Target 85-90° for straighter ball flight.</p>
              <p><span className="text-[#888]">**Specific Recommendation:**</span> Focus on developing a consistent shooting pocket and release point. Practice one-hand form shooting from close range before extending distance.</p>
            </div>
          </div>

          <div>
            <h4 className="text-[#FFD700] font-semibold uppercase text-sm mb-3">Next Steps</h4>
            <div className="space-y-3 text-sm text-[#E5E5E5]">
              <p className="font-medium">**Progress Summary for Kevin Houston**</p>
              <p><span className="text-[#888]">**Core Strength:**</span> Strong foundational balance and shooting base positions you well for rapid improvement. Your 90% balance score indicates excellent lower body mechanics.</p>
              <p><span className="text-[#888]">**Key Focus:**</span> Prioritize elbow alignment correction over the next 2-3 weeks. This single adjustment can improve overall shooting percentage by 8-12% based on biomechanical analysis.</p>
            </div>
          </div>
        </div>

        {/* Progress Gallery Section */}
        <div className="bg-[#3a3a3a] rounded-lg p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#FFD700]/20 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-[#FFD700]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#FFD700] uppercase tracking-wider">Progress Gallery</h3>
                <p className="text-[#888] text-xs">{MOCK_PROGRESS_IMAGES.length} uploads • Track your shooting form improvement</p>
              </div>
            </div>
            <a
              href={selectedImage.url}
              download={selectedImage.filename}
              className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#E5C100] hover:to-[#E59400] text-[#1a1a1a] font-bold text-xs rounded-lg transition-all shadow-lg shadow-[#FFD700]/20"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
          </div>

          {/* Main Image Display with Navigation */}
          <div className="relative rounded-xl overflow-hidden border-2 border-[#4a4a4a] bg-[#1a1a1a] mb-3">
            {/* Previous Button */}
            <button
              onClick={goToPrevImage}
              disabled={selectedImageIndex === 0}
              className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${selectedImageIndex === 0 ? 'bg-[#2a2a2a]/50 text-[#555] cursor-not-allowed' : 'bg-[#2a2a2a]/80 text-white hover:bg-[#FFD700] hover:text-[#1a1a1a]'}`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Image */}
            <img
              src={selectedImage.url}
              alt={`Shooting form from ${selectedImage.date}`}
              className="w-full h-[180px] object-contain"
            />

            {/* Next Button */}
            <button
              onClick={goToNextImage}
              disabled={selectedImageIndex === MOCK_PROGRESS_IMAGES.length - 1}
              className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${selectedImageIndex === MOCK_PROGRESS_IMAGES.length - 1 ? 'bg-[#2a2a2a]/50 text-[#555] cursor-not-allowed' : 'bg-[#2a2a2a]/80 text-white hover:bg-[#FFD700] hover:text-[#1a1a1a]'}`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Image Counter & Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[#FFD700] font-bold text-sm">{selectedImageIndex + 1} / {MOCK_PROGRESS_IMAGES.length}</span>
                  <div className="h-3 w-px bg-[#4a4a4a]" />
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#888]" />
                    <span className="text-[#888] text-xs">{selectedImage.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${selectedImage.score >= 80 ? 'text-green-400' : selectedImage.score >= 70 ? 'text-yellow-400' : 'text-orange-400'}`}>
                    {selectedImage.score}%
                  </span>
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Thumbnail Strip with Pagination */}
          <div className="space-y-2">
            {/* Thumbnails */}
            <div className="grid grid-cols-8 gap-1.5">
              {visibleThumbnails.map((img, idx) => {
                const actualIndex = startIndex + idx;
                const isSelected = actualIndex === selectedImageIndex;
                return (
                  <button
                    key={img.id}
                    onClick={() => selectImage(actualIndex)}
                    className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${isSelected ? 'border-[#FFD700] shadow-[0_0_8px_rgba(255,215,0,0.4)]' : 'border-[#4a4a4a] hover:border-[#666]'}`}
                  >
                    <img src={img.url} alt={`Thumbnail ${img.id}`} className="w-full h-full object-cover" />
                    {/* Score indicator */}
                    <div className={`absolute bottom-0 left-0 right-0 h-1 ${img.score >= 80 ? 'bg-green-500' : img.score >= 70 ? 'bg-yellow-500' : 'bg-orange-500'}`} />
                    {isSelected && <div className="absolute inset-0 bg-[#FFD700]/10" />}
                  </button>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => goToPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${currentPage === 0 ? 'text-[#555] cursor-not-allowed' : 'text-[#888] hover:text-white hover:bg-[#4a4a4a]'}`}
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => goToPage(i)}
                    className={`w-6 h-6 rounded text-xs font-medium transition-colors ${i === currentPage ? 'bg-[#FFD700] text-[#1a1a1a]' : 'bg-[#2a2a2a] text-[#888] hover:bg-[#4a4a4a] hover:text-white'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => goToPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage === totalPages - 1}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${currentPage === totalPages - 1 ? 'text-[#555] cursor-not-allowed' : 'text-[#888] hover:text-white hover:bg-[#4a4a4a]'}`}
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Selected Image Metadata */}
          <div className="mt-3 grid grid-cols-4 gap-2">
            <div className="bg-[#2a2a2a] rounded-lg p-2 text-center border border-[#4a4a4a]">
              <p className="text-[#888] text-[9px] uppercase tracking-wider mb-0.5">Date</p>
              <p className="text-white font-bold text-xs">{selectedImage.date}</p>
            </div>
            <div className="bg-[#2a2a2a] rounded-lg p-2 text-center border border-[#4a4a4a]">
              <p className="text-[#888] text-[9px] uppercase tracking-wider mb-0.5">Score</p>
              <p className={`font-bold text-xs ${selectedImage.score >= 80 ? 'text-green-400' : selectedImage.score >= 70 ? 'text-yellow-400' : 'text-orange-400'}`}>{selectedImage.score}%</p>
            </div>
            <div className="bg-[#2a2a2a] rounded-lg p-2 text-center border border-[#4a4a4a]">
              <p className="text-[#888] text-[9px] uppercase tracking-wider mb-0.5">Keypoints</p>
              <p className="text-[#FFD700] font-bold text-xs">{selectedImage.keypoints}</p>
            </div>
            <div className="bg-[#2a2a2a] rounded-lg p-2 text-center border border-[#4a4a4a]">
              <p className="text-[#888] text-[9px] uppercase tracking-wider mb-0.5">Status</p>
              <p className="text-green-400 font-bold text-xs flex items-center justify-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Complete
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



// Similarity calculation function
function calculateSimilarity(userMeasurements: AnalysisData['measurements'], shooterMeasurements: EliteShooter['measurements']): number {
  const weights = { shoulderAngle: 1.5, elbowAngle: 2, hipAngle: 1, kneeAngle: 1, ankleAngle: 0.8, releaseHeight: 1.2, releaseAngle: 1.8, entryAngle: 1.5 };
  const ranges = { shoulderAngle: 40, elbowAngle: 20, hipAngle: 30, kneeAngle: 40, ankleAngle: 30, releaseHeight: 40, releaseAngle: 20, entryAngle: 20 };
  let totalWeight = 0, weightedScore = 0;
  for (const key of Object.keys(weights) as (keyof typeof weights)[]) {
    const diff = Math.abs(userMeasurements[key] - shooterMeasurements[key]);
    const maxDiff = ranges[key];
    const score = Math.max(0, 100 - (diff / maxDiff) * 100);
    weightedScore += score * weights[key];
    totalWeight += weights[key];
  }
  return Math.round(weightedScore / totalWeight);
}

// Get matching traits based on user measurements vs shooter
function getMatchingTraits(userMeasurements: AnalysisData['measurements'], shooter: EliteShooter): string[] {
  const traits: string[] = [];
  const m = shooter.measurements;
  const u = userMeasurements;

  if (Math.abs(m.releaseHeight - u.releaseHeight) < 5) traits.push("Similar Release Height");
  if (Math.abs(m.elbowAngle - u.elbowAngle) < 5) traits.push("Matching Elbow Angle");
  if (Math.abs(m.releaseAngle - u.releaseAngle) < 4) traits.push("High Arc Shot");
  if (Math.abs(m.kneeAngle - u.kneeAngle) < 8) traits.push("Similar Knee Bend");
  if (Math.abs(m.shoulderAngle - u.shoulderAngle) < 6) traits.push("Shoulder Alignment");
  if (Math.abs(m.entryAngle - u.entryAngle) < 4) traits.push("Optimal Entry Angle");
  if (Math.abs(m.hipAngle - u.hipAngle) < 6) traits.push("Core Stability");

  // Add shooter key traits if we don't have enough
  if (traits.length < 3 && shooter.keyTraits?.length > 0) {
    const additionalTraits = shooter.keyTraits.slice(0, 3 - traits.length);
    traits.push(...additionalTraits);
  }

  return traits.slice(0, 3);
}

function ComparisonSection({ analysisData }: { analysisData: AnalysisData }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeague, setSelectedLeague] = useState<EliteShooter['league'] | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'similarity' | 'score' | 'name'>('similarity');
  const [selectedShooters, setSelectedShooters] = useState<number[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const userMeasurements = analysisData.measurements;

  // Filter, deduplicate, and sort shooters
  const filteredShooters = useMemo(() => {
    // First, calculate similarity for all shooters
    let shooters = ALL_ELITE_SHOOTERS.map(s => ({ ...s, similarity: calculateSimilarity(userMeasurements, s.measurements) }));

    // Deduplicate by player name - keep the entry with the highest overallScore
    // Priority: NBA/WNBA entries over college entries when scores are equal
    const leaguePriority: Record<string, number> = { 'NBA': 5, 'WNBA': 4, 'NCAA_MEN': 3, 'NCAA_WOMEN': 2, 'TOP_COLLEGE': 1 };
    const uniqueByName = new Map<string, typeof shooters[0]>();

    for (const shooter of shooters) {
      const existing = uniqueByName.get(shooter.name);
      if (!existing) {
        uniqueByName.set(shooter.name, shooter);
      } else {
        // Keep the one with higher score, or if equal, prefer NBA/WNBA
        const existingPriority = leaguePriority[existing.league] || 0;
        const newPriority = leaguePriority[shooter.league] || 0;

        if (shooter.overallScore > existing.overallScore ||
            (shooter.overallScore === existing.overallScore && newPriority > existingPriority)) {
          uniqueByName.set(shooter.name, shooter);
        }
      }
    }

    // Convert back to array
    shooters = Array.from(uniqueByName.values());

    // Apply filters
    if (selectedLeague !== 'ALL') shooters = shooters.filter(s => s.league === selectedLeague);
    if (searchQuery) shooters = shooters.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Sort
    shooters.sort((a, b) => sortBy === 'similarity' ? b.similarity - a.similarity : sortBy === 'score' ? b.overallScore - a.overallScore : a.name.localeCompare(b.name));
    return shooters;
  }, [searchQuery, selectedLeague, sortBy, userMeasurements]);

  const topMatch = filteredShooters[0];
  const toggleSelection = (id: number) => {
    setSelectedShooters(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 5 ? [...prev, id] : prev);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2a2a2a] to-[#1a1a1a] rounded-xl p-6 border border-[#3a3a3a]" style={{ boxShadow: '0 0 30px rgba(255, 215, 0, 0.1)' }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center">
            <BarChart3 className="w-7 h-7 text-[#1a1a1a]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#FFD700] uppercase tracking-wider" style={{ textShadow: '0 0 20px rgba(255, 215, 0, 0.3)' }}>Elite Shooter Comparison</h2>
            <p className="text-[#888] text-sm">Compare your shooting form with 250 elite players across 5 categories</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-[#1a1a1a] rounded-lg p-3 text-center border border-[#3a3a3a]">
            <p className="text-2xl font-bold text-blue-400">50</p><p className="text-xs text-[#888] uppercase">NBA</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-3 text-center border border-[#3a3a3a]">
            <p className="text-2xl font-bold text-orange-400">50</p><p className="text-xs text-[#888] uppercase">WNBA</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-3 text-center border border-[#3a3a3a]">
            <p className="text-2xl font-bold text-green-400">100</p><p className="text-xs text-[#888] uppercase">NCAA</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-3 text-center border border-[#3a3a3a]">
            <p className="text-2xl font-bold text-amber-400">50</p><p className="text-xs text-[#888] uppercase">Top College</p>
          </div>
        </div>
      </div>

      {/* User Stats Card */}
      <div className="bg-gradient-to-br from-[#FFD700]/10 to-transparent rounded-xl p-6 border-2 border-[#FFD700]/50" style={{ boxShadow: '0 0 30px rgba(255, 215, 0, 0.15)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#FFD700] flex items-center justify-center"><User className="w-6 h-6 text-[#1a1a1a]" /></div>
            <div><h3 className="text-xl font-bold text-[#FFD700]">Kevin Houston</h3><p className="text-sm text-[#888]">Your Current Form</p></div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-[#FFD700]">{analysisData.overallScore}<span className="text-lg text-[#888]">/100</span></p>
            <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-xs">{analysisData.formCategory}</span>
          </div>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {Object.entries(userMeasurements).map(([key, value]) => (
            <div key={key} className="bg-[#1a1a1a] rounded-lg p-2 text-center">
              <p className="text-xs text-[#888] uppercase">{key.replace(/([A-Z])/g, ' $1').trim().substring(0, 6)}</p>
              <p className="text-lg font-bold text-[#E5E5E5]">{value}{key.includes('Height') ? 'in' : '°'}</p>
            </div>
          ))}
        </div>
        {topMatch && (
          <div className="mt-4 pt-4 border-t border-[#3a3a3a] flex items-center gap-3">
            <Award className="w-5 h-5 text-[#FFD700]" />
            <p className="text-sm text-[#E5E5E5]">Your form is most similar to <span className="text-[#FFD700] font-bold">{topMatch.name}</span> ({topMatch.similarity}% match)</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888]" />
          <input type="text" placeholder="Search players..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#FFD700]" />
        </div>
        <div className="flex gap-2">
          <select value={selectedLeague} onChange={(e) => setSelectedLeague(e.target.value as typeof selectedLeague)}
            className="px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#FFD700]">
            <option value="ALL">All Categories</option>
            <option value="NBA">NBA</option>
            <option value="WNBA">WNBA</option>
            <option value="NCAA_MEN">NCAA Men</option>
            <option value="NCAA_WOMEN">NCAA Women</option>
            <option value="TOP_COLLEGE">Top College</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#FFD700]">
            <option value="similarity">Most Similar</option>
            <option value="score">Highest Score</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
        {selectedShooters.length > 0 && (
          <button onClick={() => setShowCompareModal(true)} className="px-4 py-2 bg-[#FFD700] text-[#1a1a1a] rounded-lg font-bold text-sm hover:bg-[#FFC000] transition-colors flex items-center gap-2">
            Compare ({selectedShooters.length}) <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-sm text-[#888]">Showing {filteredShooters.length} players</p>

      {/* Shooters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredShooters.slice(0, 30).map((shooter) => (
          <ShooterCard key={shooter.id} shooter={shooter} isSelected={selectedShooters.includes(shooter.id)} onToggle={() => toggleSelection(shooter.id)} userMeasurements={userMeasurements} />
        ))}
      </div>
      {filteredShooters.length > 30 && <p className="text-center text-[#888] text-sm">Showing top 30 results. Use filters to narrow down.</p>}

      {/* Compare Modal */}
      {showCompareModal && <CompareModal shooters={filteredShooters.filter(s => selectedShooters.includes(s.id))} userMeasurements={userMeasurements} analysisData={analysisData} onClose={() => setShowCompareModal(false)} />}
    </div>
  );
}

function ShooterCard({ shooter, isSelected, onToggle, userMeasurements }: { shooter: EliteShooter & { similarity: number }; isSelected: boolean; onToggle: () => void; userMeasurements: AnalysisData['measurements'] }) {
  const matchingTraits = getMatchingTraits(userMeasurements, shooter);
  const photoUrl = shooter.photoUrl || null;

  return (
    <div className={`bg-[#2C2C2C] rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_25px_rgba(255,215,0,0.2)] border-2 ${isSelected ? 'border-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.3)]' : 'border-[#3a3a3a] hover:border-[#4a4a4a]'}`}>
      {/* Gold Header - "MATCHED ELITE SHOOTER" */}
      <div className="bg-gradient-to-r from-[#FFD700]/20 to-[#FFD700]/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FFD700]/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-[#FFD700]" />
          </div>
          <div>
            <h3 className="text-[#FFD700] font-bold uppercase tracking-wider text-sm">MATCHED ELITE SHOOTER</h3>
            <p className="text-[#888] text-xs">Your form matches this {LEAGUE_LABELS[shooter.league]} star</p>
          </div>
        </div>
        {/* Selection checkbox */}
        <button onClick={onToggle} className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 ${isSelected ? 'bg-[#FFD700] border-[#FFD700]' : 'border-[#4a4a4a] hover:border-[#FFD700]'}`}>
          {isSelected && <Check className="w-4 h-4 text-[#1a1a1a]" />}
        </button>
      </div>

      {/* Main Card Content */}
      <div className="p-5">
        {/* Player Info Row */}
        <div className="flex items-start gap-4 mb-4">
          {/* Player Photo with Similarity Badge */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-[#3a3a3a]" style={{ border: '3px solid #FFD700' }}>
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={shooter.name}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-[#FFD700]">
                    {shooter.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
              )}
            </div>
            {/* Similarity Badge */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#FFD700] text-black font-bold text-sm px-3 py-0.5 rounded-full whitespace-nowrap">
              {shooter.similarity}%
            </div>
          </div>

          {/* Player Details */}
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-bold text-lg uppercase tracking-wide truncate">{shooter.name}</h4>
            <p className="text-[#FFD700] text-sm font-medium">{shooter.team}</p>
            <p className="text-[#888] text-xs mt-0.5">
              {POSITION_LABELS[shooter.position]} • {shooter.achievements ? shooter.achievements.split(',')[0] : shooter.era}
            </p>
          </div>
        </div>

        {/* Form Similarity Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[#888] text-xs uppercase tracking-wider">Form Similarity</span>
            <span className="text-[#FFD700] text-sm font-bold">{shooter.similarity}%</span>
          </div>
          <div className="h-2.5 bg-[#3a3a3a] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-full transition-all"
              style={{ width: `${shooter.similarity}%` }}
            />
          </div>
        </div>

        {/* Why You Match Section */}
        <div>
          <p className="text-[#888] text-xs uppercase tracking-wider mb-2">Why You Match</p>
          <div className="flex flex-wrap gap-2">
            {matchingTraits.map((trait, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-full text-xs font-medium border border-[#FFD700]/50 text-[#FFD700] bg-[#FFD700]/10"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompareModal({ shooters, userMeasurements, analysisData, onClose }: { shooters: (EliteShooter & { similarity: number })[]; userMeasurements: AnalysisData['measurements']; analysisData: AnalysisData; onClose: () => void }) {
  const metrics = ['shoulderAngle', 'elbowAngle', 'hipAngle', 'kneeAngle', 'ankleAngle', 'releaseHeight', 'releaseAngle', 'entryAngle'] as const;
  const metricLabels: Record<string, string> = { shoulderAngle: 'Shoulder', elbowAngle: 'Elbow', hipAngle: 'Hip', kneeAngle: 'Knee', ankleAngle: 'Ankle', releaseHeight: 'Release H', releaseAngle: 'Release A', entryAngle: 'Entry A' };
  const metricRanges: Record<string, [number, number]> = { shoulderAngle: [140, 180], elbowAngle: [70, 100], hipAngle: [150, 180], kneeAngle: [110, 160], ankleAngle: [70, 100], releaseHeight: [85, 120], releaseAngle: [40, 60], entryAngle: [35, 55] };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#1a1a1a] rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-auto border border-[#3a3a3a]" onClick={e => e.stopPropagation()} style={{ boxShadow: '0 0 50px rgba(255, 215, 0, 0.2)' }}>
        <div className="sticky top-0 bg-[#1a1a1a] p-6 border-b border-[#3a3a3a] flex items-center justify-between">
          <h3 className="text-xl font-black text-[#FFD700] uppercase tracking-wider">Detailed Comparison</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[#2a2a2a] flex items-center justify-center hover:bg-[#3a3a3a]"><X className="w-5 h-5 text-[#888]" /></button>
        </div>
        <div className="p-6">
          {/* Player Headers */}
          <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `200px repeat(${shooters.length + 1}, 1fr)` }}>
            <div />
            <div className="bg-gradient-to-br from-[#FFD700]/20 to-transparent rounded-xl p-4 border border-[#FFD700]/50 text-center">
              <div className="w-10 h-10 rounded-full bg-[#FFD700] mx-auto mb-2 flex items-center justify-center"><User className="w-5 h-5 text-[#1a1a1a]" /></div>
              <p className="font-bold text-[#FFD700]">You</p>
              <p className="text-xs text-[#888]">{analysisData.overallScore}/100</p>
            </div>
            {shooters.map(s => (
              <div key={s.id} className="bg-[#2a2a2a] rounded-xl p-4 text-center border border-[#3a3a3a]">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${LEAGUE_COLORS[s.league]} mx-auto mb-2 flex items-center justify-center text-white font-bold`}>{s.name.charAt(0)}</div>
                <p className="font-bold text-[#E5E5E5] text-sm truncate">{s.name}</p>
                <p className="text-xs text-[#888]">{s.overallScore}/100 • {s.similarity}%</p>
              </div>
            ))}
          </div>
          {/* Metrics Comparison */}
          {metrics.map(metric => {
            const [min, max] = metricRanges[metric];
            const userVal = userMeasurements[metric];
            const getPos = (v: number) => Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
            return (
              <div key={metric} className="mb-4">
                <div className="grid gap-4 items-center" style={{ gridTemplateColumns: `200px repeat(${shooters.length + 1}, 1fr)` }}>
                  <div className="text-sm font-medium text-[#E5E5E5]">{metricLabels[metric]} <span className="text-[#888]">({metric.includes('Height') ? 'in' : '°'})</span></div>
                  <div className="relative h-8 bg-[#2a2a2a] rounded-lg">
                    <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#FFD700] border-2 border-white z-10" style={{ left: `calc(${getPos(userVal)}% - 6px)` }} />
                    <span className="absolute -bottom-5 text-xs text-[#FFD700] font-bold" style={{ left: `calc(${getPos(userVal)}% - 10px)` }}>{userVal}</span>
                  </div>
                  {shooters.map(s => {
                    const sVal = s.measurements[metric];
                    const diff = sVal - userVal;
                    const color = Math.abs(diff) <= 3 ? 'bg-green-500' : Math.abs(diff) <= 8 ? 'bg-yellow-500' : 'bg-red-500';
                    return (
                      <div key={s.id} className="relative h-8 bg-[#2a2a2a] rounded-lg">
                        <div className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${color} border-2 border-white z-10`} style={{ left: `calc(${getPos(sVal)}% - 6px)` }} />
                        <span className="absolute -bottom-5 text-xs text-[#888]" style={{ left: `calc(${getPos(sVal)}% - 10px)` }}>{sVal}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {/* Insights */}
          <div className="mt-8 pt-6 border-t border-[#3a3a3a]">
            <h4 className="text-lg font-bold text-[#FFD700] mb-4">💡 Key Insights</h4>
            <div className="grid md:grid-cols-2 gap-4">
              {shooters.map(s => (
                <div key={s.id} className="bg-[#2a2a2a] rounded-xl p-4 border border-[#3a3a3a]">
                  <p className="font-bold text-[#E5E5E5] mb-2">{s.name}</p>
                  <p className="text-sm text-[#888]">
                    {s.similarity >= 80 ? `Your shooting form closely matches ${s.name}'s mechanics. Study their release point and follow-through for refinement tips.` :
                     s.similarity >= 60 ? `You share similar fundamentals with ${s.name}. Focus on ${s.measurements.releaseAngle > userMeasurements.releaseAngle ? 'increasing your release angle' : 'your lower body alignment'} to get closer.` :
                     `${s.name}'s form is quite different from yours. Their ${s.measurements.shoulderAngle > userMeasurements.shoulderAngle ? 'higher shoulder angle' : 'elbow positioning'} creates a unique release. Study their technique for new ideas.`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}