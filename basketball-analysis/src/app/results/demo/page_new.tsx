/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
// @ts-nocheck
"use client"

import React, { useState, useMemo, useRef, useCallback, useEffect } from "react"
import { AnalysisDashboard } from "@/components/analysis/AnalysisDashboard"
import { EnhancedShotStrip } from "@/components/analysis/EnhancedShotStrip"
import { AutoScreenshots } from "@/components/analysis/AutoScreenshots"
import { User, Upload, Check, X, Image as ImageIcon, Video, BookOpen, Users, Search, BarChart3, Award, ArrowRight, Zap, Trophy, Target, ClipboardList, Flame, Dumbbell, CircleDot, Share2, Download, Copy, Twitter, Facebook, Linkedin, ChevronLeft, ChevronRight, Calendar, ChevronDown, AlertTriangle, Lightbulb } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ALL_ELITE_SHOOTERS, LEAGUE_LABELS, LEAGUE_COLORS, POSITION_LABELS, EliteShooter } from "@/data/eliteShooters"
// Shooter database available for future body-type matching enhancements
// import { findMatchingShooters, parseHeightToInches, determineBodyBuild } from "@/data/shooterDatabase"
import { toPng } from "html-to-image"
import { useAnalysisStore } from "@/stores/analysisStore"
import { 
  detectFlawsFromAngles, 
  generateCoachingFeedback, 
  getShooterLevel,
  getCombinedFlawEffect,
  SHOOTING_FLAWS,
  type ShootingFlaw 
} from "@/data/shootingFlawsDatabase"
import {
  getAllSessions,
  saveSession,
  deleteSession,
  createSessionFromAnalysis,
  // Phase 9: Analytics functions
  generateScoreTrend,
  generateCategoryComparison,
  generateIssueHeatmap,
  detectMilestones,
  generateSummaryStats,
  generateAnalytics,
  getSessionsFromLastDays,
  getUnachievedMilestones,
  type AnalysisSession,
  type SessionScreenshot,
  type AnalyticsData,
  type Milestone,
  type DateRangePreset
} from "@/services/sessionStorage"
import { Phase6ComparisonPanel } from "@/components/comparison/Phase6ComparisonPanel"
import { 
  ALL_DRILLS, 
  getRecommendedDrills, 
  mapAgeToLevel, 
  mapSkillLevelToLevel,
  mapFlawToFocusArea,
  type Drill,
  type SkillLevel as DrillSkillLevel
} from "@/data/drillDatabase"
import {
  generateWeeklyPerformanceSummary,
  generateCoachingTip,
  generateMotivationalMessage,
  generateDetailedAnalysisReport
} from "@/services/coachingInsights"
import { useProfileStore } from "@/stores/profileStore"
import {
  BadgesShowcase,
  LevelProgressCard,
  StreakTracker,
  WeeklyChallenges,
  Leaderboard,
  GamificationSummaryCard,
  ShareProgressButton
} from "@/components/gamification/GamificationComponents"
import {
  getUserProgress,
  updateStreak,
  checkBadgeUnlock,
  addPoints
} from "@/services/gamificationService"

type ResultsMode = "video" | "image" | "elite" | "guide"

// ============================================
// HYBRID SKELETON DISPLAY - Exactly like test_hybrid.html
// Shows 17 keypoints with skeleton connections
// ============================================
interface HybridSkeletonDisplayProps {
  imageUrl: string
  keypoints?: Record<string, { x: number; y: number; confidence: number; source?: string }>
  basketball?: { x: number; y: number; radius: number } | null
  imageSize?: { width: number; height: number }
  angles?: Record<string, number>
  confidence?: number
  showStats?: boolean // Controls whether to show Confidence, Keypoints, Joint Angles, and Legend
}

function HybridSkeletonDisplay({ imageUrl, keypoints, basketball, imageSize, angles, confidence, showStats = true }: HybridSkeletonDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!imageUrl) {
      console.log('❌ No imageUrl')
      return
    }
    if (!keypoints || Object.keys(keypoints).length === 0) {
      console.log('❌ No keypoints')
      return
    }

    const img = new window.Image()
    img.crossOrigin = "anonymous"
    
    img.onerror = (e) => {
      console.error('❌ Image failed to load:', e)
    }
    
    img.onload = () => {
      console.log('✅ Image loaded - drawing skeleton now')
      const canvas = canvasRef.current
      if (!canvas) {
        console.log('❌ Canvas ref is null')
        return
      }
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        console.log('❌ Could not get 2d context')
        return
      }

      // Scale to fit max 500px width
      const maxW = 500
      const scale = Math.min(1, maxW / img.width)
      const canvasW = img.width * scale
      const canvasH = img.height * scale
      
      // Set canvas size (this clears the canvas)
      canvas.width = canvasW
      canvas.height = canvasH

      // Draw image IMMEDIATELY after setting size
      ctx.drawImage(img, 0, 0, canvasW, canvasH)
      console.log('🖼️ Image drawn to canvas:', canvasW, 'x', canvasH)

      const kp = keypoints
      // Use imageSize from props if available, otherwise use actual image dimensions
      const imgW = imageSize?.width || img.naturalWidth
      const imgH = imageSize?.height || img.naturalHeight

      console.log('🖼️ Drawing skeleton:', { imgW, imgH, canvasW: canvas.width, canvasH: canvas.height })

      // Scale factor for drawing
      const sx = canvas.width / imgW
      const sy = canvas.height / imgH

      // Draw basketball if detected
      if (basketball) {
        ctx.beginPath()
        ctx.arc(basketball.x * sx, basketball.y * sy, basketball.radius * sx, 0, Math.PI * 2)
        ctx.strokeStyle = "#f97316"
        ctx.lineWidth = 3
        ctx.stroke()
        ctx.fillStyle = "#f97316"
        ctx.beginPath()
        ctx.arc(basketball.x * sx, basketball.y * sy, 4, 0, Math.PI * 2)
        ctx.fill()
      }

      // Skeleton connections - exactly like test_hybrid.html
      const skeleton = [
        ["nose", "left_shoulder"], ["nose", "right_shoulder"],
        ["left_shoulder", "right_shoulder"],
        ["left_shoulder", "left_elbow"], ["left_elbow", "left_wrist"],
        ["right_shoulder", "right_elbow"], ["right_elbow", "right_wrist"],
        ["left_shoulder", "left_hip"], ["right_shoulder", "right_hip"],
        ["left_hip", "right_hip"],
        ["left_hip", "left_knee"], ["left_knee", "left_ankle"],
        ["right_hip", "right_knee"], ["right_knee", "right_ankle"],
      ]

      // Draw skeleton lines
      ctx.strokeStyle = "#facc15"
      ctx.lineWidth = 2
      skeleton.forEach(([start, end]) => {
        if (kp[start] && kp[end]) {
          ctx.beginPath()
          ctx.moveTo(kp[start].x * sx, kp[start].y * sy)
          ctx.lineTo(kp[end].x * sx, kp[end].y * sy)
          ctx.stroke()
        }
      })

      // Colors by source
      const colors: Record<string, string> = {
        yolo: "#4ade80",
        mediapipe: "#60a5fa",
        fused: "#facc15",
        ball_refined: "#f87171"
      }

      // Draw keypoints
      Object.entries(kp).forEach(([name, pt]) => {
        const x = pt.x * sx
        const y = pt.y * sy
        const color = colors[pt.source || "fused"] || "#ffffff"
        const radius = name.includes("wrist") ? 8 : 5

        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
        ctx.strokeStyle = "white"
        ctx.lineWidth = 2
        ctx.stroke()
      })
    }

    img.src = imageUrl
  }, [imageUrl, keypoints, basketball, imageSize])

  // Format angle name for display
  const formatAngleName = (name: string) => {
    return name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="space-y-4">
      {/* Canvas with skeleton */}
      <div ref={containerRef} className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={500}
          height={400}
          className="rounded-lg border-2 border-[#3a3a3a]"
        />
      </div>

      {/* Stats - Only show if showStats is true */}
      {showStats && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1a1a1a] rounded-lg p-4 text-center">
              <p className="text-[#888] text-sm uppercase">Confidence</p>
              <p className="text-2xl font-bold text-[#FFD700]">{confidence ? (confidence * 100).toFixed(0) : 0}%</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-4 text-center">
              <p className="text-[#888] text-sm uppercase">Keypoints</p>
              <p className="text-2xl font-bold text-[#4ade80]">{keypoints ? Object.keys(keypoints).length : 0}</p>
            </div>
          </div>

          {/* Angles */}
          {angles && Object.keys(angles).length > 0 && (
            <div className="bg-[#1a1a1a] rounded-lg p-4">
              <h4 className="text-[#FFD700] font-semibold text-sm uppercase tracking-wider mb-3">Joint Angles</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(angles).map(([name, value]) => (
                  <div key={name} className="flex justify-between items-center bg-[#2a2a2a] rounded px-3 py-2">
                    <span className="text-[#E5E5E5] text-sm">{formatAngleName(name)}</span>
                    <span className="text-[#FFD700] font-bold">{(value as number).toFixed(1)}°</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[#4ade80]" />
              <span className="text-[#888]">YOLO</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[#60a5fa]" />
              <span className="text-[#888]">MediaPipe</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[#facc15]" />
              <span className="text-[#888]">Fused</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[#f97316]" />
              <span className="text-[#888]">Basketball</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

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

// Skeleton overlay demo data removed (no overlay display)

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

// Import types from analysisStore (where they are now defined)
import type { FormAnalysisResult, VisionAnalysisResult } from "@/stores/analysisStore"

// Convert Vision AI result to AnalysisData format
function convertVisionToAnalysisData(vision: VisionAnalysisResult | null): AnalysisData | null {
  if (!vision?.success) return null

  // Get angles from hybrid backend - they come directly in vision.angles
  const hybridAngles = vision.angles || {}
  const a = vision.analysis || {}
  const measurements = a.measurements || {}

  // Extract hybrid angles (from hybrid_pose_detection.py)
  const leftElbowAngle = hybridAngles.left_elbow_angle || 0
  const rightElbowAngle = hybridAngles.right_elbow_angle || 0
  const leftKneeAngle = hybridAngles.left_knee_angle || 0
  const rightKneeAngle = hybridAngles.right_knee_angle || 0
  const shoulderTilt = hybridAngles.shoulder_tilt || 180
  const hipTilt = hybridAngles.hip_tilt || 180

  // Use shooting arm angles (typically right for right-handed shooters)
  const elbowAngle = rightElbowAngle || leftElbowAngle || measurements.elbowAngle || 92
  const kneeAngle = rightKneeAngle || leftKneeAngle || measurements.kneeAngle || 145

  // Calculate scores based on optimal ranges from shootingFlawsDatabase
  // Elbow: optimal 85-95°, acceptable 75-105°
  const calculateElbowScore = (angle: number): number => {
    if (angle >= 85 && angle <= 95) return 95 + Math.random() * 5 // Elite: 95-100
    if (angle >= 80 && angle <= 100) return 85 + Math.random() * 10 // Pro: 85-95
    if (angle >= 75 && angle <= 105) return 75 + Math.random() * 10 // Advanced: 75-85
    if (angle >= 70 && angle <= 110) return 65 + Math.random() * 10 // Proficient: 65-75
    return Math.max(30, 60 - Math.abs(90 - angle)) // Below proficient
  }

  // Knee: optimal 45-55° bend (meaning 125-135° angle), acceptable 35-65° bend
  const calculateKneeScore = (angle: number): number => {
    // Convert to bend angle (180 - measured angle)
    const bendAngle = 180 - angle
    if (bendAngle >= 45 && bendAngle <= 55) return 95 + Math.random() * 5
    if (bendAngle >= 40 && bendAngle <= 60) return 85 + Math.random() * 10
    if (bendAngle >= 35 && bendAngle <= 65) return 75 + Math.random() * 10
    if (bendAngle >= 30 && bendAngle <= 70) return 65 + Math.random() * 10
    if (bendAngle < 20) return 40 // Too straight - insufficient knee bend
    return Math.max(30, 60 - Math.abs(50 - bendAngle))
  }

  // Balance: based on shoulder and hip tilt (should be close to 180° = level)
  const calculateBalanceScore = (shoulderTilt: number, hipTilt: number): number => {
    const shoulderDeviation = Math.abs(180 - shoulderTilt)
    const hipDeviation = Math.abs(180 - hipTilt)
    const totalDeviation = shoulderDeviation + hipDeviation
    if (totalDeviation <= 5) return 95 + Math.random() * 5 // Near perfect
    if (totalDeviation <= 10) return 85 + Math.random() * 10
    if (totalDeviation <= 15) return 75 + Math.random() * 10
    if (totalDeviation <= 20) return 65 + Math.random() * 10
    return Math.max(40, 80 - totalDeviation * 2)
  }

  const elbowScore = Math.round(calculateElbowScore(elbowAngle))
  const kneeScore = Math.round(calculateKneeScore(kneeAngle))
  const balanceScore = Math.round(calculateBalanceScore(shoulderTilt, hipTilt))
  
  // Form score is weighted average
  const formScore = Math.round((elbowScore * 0.4 + kneeScore * 0.3 + balanceScore * 0.3))
  
  // Overall score
  const overallScore = a.overallScore || vision.overall_score || Math.round(
    (elbowScore * 0.25 + kneeScore * 0.2 + balanceScore * 0.2 + formScore * 0.35)
  )

  // Determine category based on score
  let formCategory: "EXCELLENT" | "GOOD" | "NEEDS_IMPROVEMENT" | "CRITICAL" = "GOOD"
  if (overallScore >= 88) formCategory = "EXCELLENT"
  else if (overallScore >= 70) formCategory = "GOOD"
  else if (overallScore >= 50) formCategory = "NEEDS_IMPROVEMENT"
  else formCategory = "CRITICAL"

  return {
    overallScore,
    formCategory,
    measurements: {
      shoulderAngle: Math.round(shoulderTilt),
      elbowAngle: Math.round(elbowAngle),
      hipAngle: Math.round(hipTilt),
      kneeAngle: Math.round(kneeAngle),
      ankleAngle: 85, // TODO: Add ankle detection to hybrid backend
      releaseHeight: measurements.releaseHeight || 108,
      releaseAngle: measurements.releaseAngle || 52,
      entryAngle: 45,
    },
    shootingStats: {
      form: formScore,
      release: Math.round(measurements.releaseAngle ? (100 - Math.abs(52 - measurements.releaseAngle)) : 82),
      balance: balanceScore,
      arc: 75, // TODO: Calculate from trajectory
      elbow: elbowScore,
      follow: measurements.followThrough || 78,
      consist: 76, // TODO: Calculate from multiple shots
      power: kneeScore, // Power correlates with knee bend
    },
    matchedShooter: {
      name: a.similarProPlayer || "Stephen Curry",
      similarityScore: Math.min(95, Math.round(overallScore * 0.9 + Math.random() * 10)),
      team: "Golden State Warriors",
      position: "PG",
    },
  }
}

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
  const { formAnalysisResult, visionAnalysisResult, playerProfile, poseConfidence, teaserFrames, fullFrames, allUploadedUrls, uploadedImageBase64, roboflowBallDetection, videoAnalysisData, mediaType } = useAnalysisStore()
  
  // Auto-select Video tab when mediaType is VIDEO
  useEffect(() => {
    if (mediaType === "VIDEO" && videoAnalysisData) {
      setResultsMode("video")
    }
  }, [mediaType, videoAnalysisData])
  
  // Use base64 image (persists across navigation) or fall back to blob URL
  const mainImageUrl = uploadedImageBase64 || (allUploadedUrls.length > 0 ? allUploadedUrls[0] : null)
  
  // Prefer Vision AI results, fall back to form analysis
  const analysisData = useMemo(() => {
    const visionData = convertVisionToAnalysisData(visionAnalysisResult)
    if (visionData) return visionData
    return convertFormAnalysisToAnalysisData(formAnalysisResult)
  }, [visionAnalysisResult, formAnalysisResult])

  // Get player name from profile or use default
  const playerName = "KEVIN HOUSTON" // From profile or default

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
          {resultsMode === "video" && <VideoModeContent videoData={videoAnalysisData} activeTab={activeTab} setActiveTab={setActiveTab} analysisData={analysisData} playerName={playerName} poseConfidence={poseConfidence} teaserFrames={teaserFrames} fullFrames={fullFrames} allUploadedUrls={allUploadedUrls} mainImageUrl={mainImageUrl} visionAnalysis={visionAnalysisResult} roboflowBallDetection={roboflowBallDetection} />}
          {resultsMode === "image" && <ImageModeContent activeTab={activeTab} setActiveTab={setActiveTab} analysisData={analysisData} playerName={playerName} poseConfidence={poseConfidence} teaserFrames={teaserFrames} fullFrames={fullFrames} allUploadedUrls={allUploadedUrls} mainImageUrl={mainImageUrl} visionAnalysis={visionAnalysisResult} roboflowBallDetection={roboflowBallDetection} />}
          {resultsMode === "elite" && <EliteModeContent analysisData={analysisData} />}
          {resultsMode === "guide" && <GuideModeContent />}
        </div>
      </div>
    </main>
  )
}

// VideoModeContent interface - same as ImageModeContent plus videoData
interface VideoModeContentProps extends ImageModeContentProps {
  videoData: ReturnType<typeof useAnalysisStore>['videoAnalysisData']
}

// VideoModeContent: Video player at top, then EXACT same content as ImageModeContent
function VideoModeContent({ videoData, activeTab, setActiveTab, analysisData, playerName, poseConfidence, teaserFrames, fullFrames, allUploadedUrls, mainImageUrl, visionAnalysis, roboflowBallDetection }: VideoModeContentProps) {
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Auto-play functionality for video player
  useEffect(() => {
    if (isPlaying && videoData?.annotatedFramesBase64?.length) {
      playIntervalRef.current = setInterval(() => {
        setCurrentFrame(prev => {
          const nextFrame = prev + 1
          if (nextFrame >= (videoData?.annotatedFramesBase64?.length || 0)) {
            setIsPlaying(false)
            return 0
          }
          return nextFrame
        })
      }, 1000 / (videoData?.fps || 10))
    } else if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current)
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current)
    }
  }, [isPlaying, videoData?.annotatedFramesBase64?.length, videoData?.fps])
  
  // If no video data, just render ImageModeContent
  if (!videoData || !videoData.annotatedFramesBase64 || videoData.annotatedFramesBase64.length === 0) {
    return (
      <ImageModeContent 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        analysisData={analysisData}
        playerName={playerName}
        poseConfidence={poseConfidence}
        teaserFrames={teaserFrames}
        fullFrames={fullFrames}
        allUploadedUrls={allUploadedUrls}
        mainImageUrl={mainImageUrl}
        visionAnalysis={visionAnalysis}
        roboflowBallDetection={roboflowBallDetection}
      />
    )
  }
  
  const totalFrames = videoData.annotatedFramesBase64.length
  const currentFrameData = videoData.frameData?.[currentFrame]
  const currentPhase = currentFrameData?.phase || 'Unknown'
  const currentTimestamp = currentFrameData?.timestamp || (currentFrame / (videoData.fps || 10))
  
  // Use the release frame as the "main image" for ImageModeContent
  const releaseFrameIndex = videoData.phases?.find(p => p.phase === 'Release')?.frame || Math.floor(totalFrames / 2)
  const mainVideoFrameBase64 = videoData.annotatedFramesBase64[releaseFrameIndex] || videoData.annotatedFramesBase64[0]
  const videoMainImageUrl = `data:image/jpeg;base64,${mainVideoFrameBase64}`
  
  return (
    <>
      {/* ============================================ */}
      {/* VIDEO PLAYER SECTION - Only in Video Mode */}
      {/* ============================================ */}
      <div className="p-6 border-b border-[#3a3a3a]">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-[#FFD700] mb-2">🎬 Video Frame-by-Frame Playback</h2>
          <p className="text-[#888] text-sm">Scrub through your shooting motion to analyze each phase</p>
        </div>
        
        {/* Video Player */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#1a1a1a] rounded-xl overflow-hidden shadow-2xl">
            {/* Frame Display */}
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <img 
                src={`data:image/jpeg;base64,${videoData.annotatedFramesBase64[currentFrame]}`}
                alt={`Frame ${currentFrame + 1}`}
                className="max-w-full max-h-full object-contain"
              />
              {/* Phase Overlay */}
              <div className="absolute top-4 left-4 bg-black/70 px-4 py-2 rounded-lg">
                <span className="text-[#FFD700] font-bold text-lg">{currentPhase}</span>
              </div>
              {/* Timestamp Overlay */}
              <div className="absolute top-4 right-4 bg-black/70 px-4 py-2 rounded-lg">
                <span className="text-white font-mono">{currentTimestamp.toFixed(2)}s</span>
              </div>
            </div>
            
            {/* Controls */}
            <div className="p-4 bg-[#2a2a2a]">
              {/* Progress Bar */}
              <div className="mb-4">
                <input
                  type="range"
                  min={0}
                  max={totalFrames - 1}
                  value={currentFrame}
                  onChange={(e) => {
                    setIsPlaying(false)
                    setCurrentFrame(parseInt(e.target.value))
                  }}
                  className="w-full h-2 bg-[#4a4a4a] rounded-lg appearance-none cursor-pointer accent-[#FFD700]"
                />
              </div>
              
              {/* Playback Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => setCurrentFrame(0)} className="p-2 rounded-lg bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white transition-colors" title="Go to start">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                  </button>
                  <button onClick={() => setCurrentFrame(prev => Math.max(0, prev - 1))} disabled={currentFrame === 0} className="p-2 rounded-lg bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white transition-colors disabled:opacity-50" title="Previous frame">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                  </button>
                  <button onClick={() => setIsPlaying(!isPlaying)} className="p-3 rounded-full bg-[#FFD700] hover:bg-[#E5C100] text-black transition-colors">
                    {isPlaying ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    ) : (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    )}
                  </button>
                  <button onClick={() => setCurrentFrame(prev => Math.min(totalFrames - 1, prev + 1))} disabled={currentFrame === totalFrames - 1} className="p-2 rounded-lg bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white transition-colors disabled:opacity-50" title="Next frame">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                  </button>
                  <button onClick={() => setCurrentFrame(totalFrames - 1)} className="p-2 rounded-lg bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white transition-colors" title="Go to end">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                  </button>
                </div>
                <div className="text-white font-mono text-sm">
                  Frame <span className="text-[#FFD700]">{currentFrame + 1}</span> / {totalFrames}
                </div>
              </div>
            </div>
          </div>
          
          {/* Shooting Phases Timeline */}
          {videoData.phases && videoData.phases.length > 0 && (
            <div className="mt-4 bg-[#2a2a2a] rounded-xl p-4">
              <h3 className="text-[#FFD700] font-semibold mb-3 text-sm uppercase tracking-wider">Jump to Phase</h3>
              <div className="flex gap-2 flex-wrap">
                {videoData.phases.map((phase, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setIsPlaying(false)
                      setCurrentFrame(phase.frame)
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentFrame === phase.frame 
                        ? 'bg-[#FFD700] text-black' 
                        : 'bg-[#3a3a3a] text-white hover:bg-[#4a4a4a]'
                    }`}
                  >
                    {phase.phase} ({phase.timestamp.toFixed(2)}s)
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* FULL ANALYSIS CONTENT - Same as Image Mode */}
      {/* Render ImageModeContent with video frame as mainImageUrl */}
      {/* ============================================ */}
      <ImageModeContent 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        analysisData={analysisData}
        playerName={playerName}
        poseConfidence={poseConfidence}
        teaserFrames={teaserFrames}
        fullFrames={fullFrames}
        allUploadedUrls={allUploadedUrls}
        mainImageUrl={videoMainImageUrl}
        visionAnalysis={visionAnalysis}
        roboflowBallDetection={roboflowBallDetection}
      />
    </>
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
  activeTab: string
  setActiveTab: (t: string) => void
  analysisData: AnalysisData
  playerName: string
  poseConfidence: number
  teaserFrames: { id: string; url: string; label: string; wristAngle?: number; confidence?: number }[]
  fullFrames: { id: string; url: string; label: string; wristAngle?: number; confidence?: number }[]
  allUploadedUrls: string[]
  mainImageUrl: string | null
  visionAnalysis?: VisionAnalysisResult | null
  roboflowBallDetection?: { x: number; y: number; width: number; height: number; confidence: number } | null
}

function ImageModeContent({ activeTab, setActiveTab, analysisData, playerName, poseConfidence, teaserFrames, fullFrames, allUploadedUrls, mainImageUrl, visionAnalysis, roboflowBallDetection }: ImageModeContentProps) {
  // Track hydration to handle SSR/client mismatch
  // const [isHydrated, setIsHydrated] = useState(false)
  
  // useEffect(() => {
  //   setIsHydrated(true)
  // }, [])
  
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
  }, [analysisData.overallScore])

  // Copy link to clipboard
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      // Could add a toast notification here
      console.log("Link copied to clipboard!")
    } catch (err) {
      console.error("Failed to copy link:", err)
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
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#FFD700]/50 relative">
                    <Image
                      src="https://cdn.nba.com/headshots/nba/latest/1040x760/201142.png"
                      alt="Elite Match"
                      fill
                      sizes="40px"
                      className="object-cover object-top scale-150 translate-y-1"
                      priority
                    />
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
        {/* LEFT COLUMN: Shot Breakdown + Media */}
        <div className="space-y-6">
          {/* Hero Summary - No progress ring here (already on right sidebar) */}
          <div className="bg-gradient-to-br from-[#1a1a1a] via-[#252525] to-[#1a1a1a] rounded-lg p-6 border border-[#FFD700]/30">
            <div>
              <h2 className="text-xl font-black text-white mb-2 uppercase tracking-wide">
                {analysisData.overallScore >= 80 ? "EXCELLENT FORM" : analysisData.overallScore >= 65 ? "SOLID FORM WITH MINOR ADJUSTMENTS NEEDED" : "FORM NEEDS IMPROVEMENT"}
              </h2>
              <p className="text-[#888] text-sm mb-3">
                {analysisData.overallScore >= 80
                  ? "Your shooting mechanics are well-aligned with elite standards."
                  : analysisData.overallScore >= 65
                  ? "Good foundation with a few areas to refine for consistency."
                  : "Focus on the fundamentals below to improve your shot."}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-2 py-1 rounded bg-[#FFD700]/20 text-[#FFD700]">Top Fix: Elbow alignment</span>
                <span className="text-xs px-2 py-1 rounded bg-[#FFD700]/20 text-[#FFD700]">Top Fix: Follow-through</span>
                <span className="text-xs px-2 py-1 rounded bg-[#FFD700]/20 text-[#FFD700]">Top Fix: Balance</span>
              </div>
            </div>
          </div>

          {/* Vision AI Analysis - Main Image + Auto Screenshots */}
          {(
            <div className="bg-[#2a2a2a] rounded-lg border border-[#4a4a4a] p-6 space-y-6">
              
              {/* Show message if no image uploaded yet */}
              {!mainImageUrl && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📷</div>
                  <h3 className="text-[#FFD700] font-bold text-xl mb-2">No Image Uploaded</h3>
                  <p className="text-[#888] mb-4">Upload an image on the home page to see your shooting form analysis.</p>
                  <Link href="/" className="inline-block bg-[#FFD700] hover:bg-[#E5C100] text-[#1a1a1a] font-bold px-6 py-3 rounded-lg transition-colors">
                    Upload Image
                  </Link>
                </div>
              )}
              
              {/* Show content when image is available */}
              {mainImageUrl && (
                <>
                  {/* HYBRID SKELETON OVERLAY - Direct from hybrid backend */}
                  {/* showStats=false hides Confidence, Keypoints, Joint Angles, Legend on results page */}
                  <HybridSkeletonDisplay
                    imageUrl={mainImageUrl}
                    keypoints={visionAnalysis?.keypoints}
                    basketball={visionAnalysis?.basketball}
                    imageSize={visionAnalysis?.image_size}
                    angles={visionAnalysis?.angles}
                    confidence={visionAnalysis?.confidence}
                    showStats={false}
                  />

                  {/* 3 AUTO SCREENSHOTS - Ball, Shoulders, Legs */}
                  <div className="mt-6">
                    <h3 className="text-[#FFD700] font-bold text-sm uppercase tracking-wider mb-4 text-center">
                      Key Point Analysis — Click to Expand
                    </h3>
                    <AutoScreenshots
                      imageUrl={mainImageUrl}
                      keypoints={visionAnalysis?.keypoints}
                      basketball={visionAnalysis?.basketball}
                      imageSize={visionAnalysis?.image_size}
                      angles={visionAnalysis?.angles}
                    />
                  </div>
                </>
              )}
              
              {/* Coaching Tip - Generated from Flaws Database */}
              {(() => {
                // Detect flaws from hybrid angles
                const detectedFlaws = visionAnalysis?.angles 
                  ? detectFlawsFromAngles(visionAnalysis.angles)
                  : []
                
                // Generate coaching feedback
                const coaching = generateCoachingFeedback(detectedFlaws.map(f => f.id))
                
                // If we have detected flaws, show dynamic coaching
                if (detectedFlaws.length > 0) {
                  const primaryFlaw = detectedFlaws[0]
                  return (
                    <div className="mt-6 space-y-4">
                      {/* Primary Issue */}
                      <div className="bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-lg p-4">
                        <h4 className="text-[#FFD700] font-semibold text-sm uppercase tracking-wider mb-2">
                          💡 Top Coaching Tip
                        </h4>
                        <p className="text-[#E5E5E5] font-medium mb-2">
                          Primary Issue: {primaryFlaw.name}
                        </p>
                        <p className="text-[#888] text-sm mb-3">
                          {primaryFlaw.description}
                        </p>
                        
                        {/* Cause Chain */}
                        <div className="bg-[#1a1a1a] rounded-lg p-3 mb-3">
                          <p className="text-[#FFD700] text-xs uppercase tracking-wider mb-2">
                            Why This Matters (Cause → Effect)
                          </p>
                          <ul className="text-[#E5E5E5] text-sm space-y-1">
                            {primaryFlaw.causeChain.slice(0, 3).map((effect, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                  effect.severity === 'major' ? 'bg-red-500/20 text-red-400' :
                                  effect.severity === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-blue-500/20 text-blue-400'
                                }`}>
                                  {effect.severity}
                                </span>
                                <span>{effect.effect}: {effect.explanation}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        {/* Quick Fix */}
                        <p className="text-green-400 text-sm">
                          <strong>Fix:</strong> {primaryFlaw.fixes[0]}
                        </p>
                      </div>
                      
                      {/* Additional Flaws */}
                      {detectedFlaws.length > 1 && (
                        <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                          <h4 className="text-orange-400 font-semibold text-sm uppercase tracking-wider mb-2">
                            ⚠ Additional Issues Detected
                          </h4>
                          <ul className="text-[#E5E5E5] text-sm space-y-2">
                            {detectedFlaws.slice(1).map((flaw, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-orange-400">•</span>
                                <div>
                                  <span className="font-medium">{flaw.name}:</span>{' '}
                                  <span className="text-[#888]">{flaw.description}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )
                }
                
                // Fallback to original coaching tip if no flaws detected
                if (visionAnalysis?.analysis?.coachingTip) {
                  return (
                    <div className="mt-6 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-lg p-4">
                      <h4 className="text-[#FFD700] font-semibold text-sm uppercase tracking-wider mb-2">
                        💡 Top Coaching Tip
                      </h4>
                      <p className="text-[#E5E5E5]">{visionAnalysis.analysis.coachingTip}</p>
                    </div>
                  )
                }
                
                // If no flaws and no coaching tip, show positive message
                return (
                  <div className="mt-6 bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                    <h4 className="text-green-400 font-semibold text-sm uppercase tracking-wider mb-2">
                      ✓ Great Form!
                    </h4>
                    <p className="text-[#E5E5E5]">
                      No significant mechanical flaws detected. Your shooting form shows good fundamentals.
                      Continue practicing to build consistency and muscle memory.
                    </p>
                  </div>
                )
              })()}

              {/* Strengths & Critical Issues */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {visionAnalysis?.analysis?.strengths && visionAnalysis.analysis.strengths.length > 0 && (
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                    <h4 className="text-green-400 font-semibold text-sm uppercase tracking-wider mb-2">
                      ✓ Strengths
                    </h4>
                    <ul className="text-[#E5E5E5] text-sm space-y-1">
                      {visionAnalysis.analysis.strengths.map((s: string, i: number) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {visionAnalysis?.analysis?.criticalIssues && visionAnalysis.analysis.criticalIssues.length > 0 && (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                    <h4 className="text-red-400 font-semibold text-sm uppercase tracking-wider mb-2">
                      ⚠ Critical Issues
                    </h4>
                    <ul className="text-[#E5E5E5] text-sm space-y-1">
                      {visionAnalysis.analysis.criticalIssues.map((c: string, i: number) => (
                        <li key={i}>• {c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Recommended Drills */}
              {visionAnalysis?.analysis?.drills && visionAnalysis.analysis.drills.length > 0 && (
                <div className="mt-4 bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg p-4">
                  <h4 className="text-[#FFD700] font-semibold text-sm uppercase tracking-wider mb-3">
                    🏀 Recommended Drills
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {visionAnalysis.analysis.drills.map((drill, i) => (
                      <div key={i} className="bg-[#2a2a2a] rounded-lg p-3">
                        <p className="text-[#E5E5E5] font-semibold text-sm">{typeof drill === 'string' ? drill : drill.name}</p>
                        {typeof drill !== 'string' && drill.purpose && (
                          <p className="text-[#888] text-xs mt-1">{drill.purpose}</p>
                        )}
                        {typeof drill !== 'string' && drill.reps && (
                          <p className="text-[#FFD700] text-xs mt-1">Reps: {drill.reps}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pro Comparison */}
              {visionAnalysis?.analysis?.similarProPlayer && (
                <div className="mt-4 bg-[#1a1a1a] border border-[#FFD700]/30 rounded-lg p-4 text-center">
                  <p className="text-[#888] text-xs uppercase tracking-wider">Your form resembles</p>
                  <p className="text-[#FFD700] font-bold text-xl mt-1">{visionAnalysis.analysis.similarProPlayer}</p>
                  {visionAnalysis.analysis.proComparison && (
                    <p className="text-[#E5E5E5] text-sm mt-2">{visionAnalysis.analysis.proComparison}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Enhanced Shot Breakdown Strip */}
          {fullFrames.length > 0 ? (
            <EnhancedShotStrip
              frames={fullFrames.map((frame, idx) => {
                // Map to phase based on label or index
                const phases: Array<"stance" | "load" | "set" | "release" | "follow"> = ["stance", "load", "set", "release", "follow"]
                const phaseLabels = ["Stance", "Load", "Set Point", "Release", "Follow-Through"]
                const phaseIndex = Math.min(idx, phases.length - 1)
                return {
                  id: frame.id,
                  url: frame.url,
                  phase: phases[phaseIndex],
                  label: frame.label || phaseLabels[phaseIndex],
                  frameNumber: idx + 1,
                  metrics: {
                    wristAngle: frame.wristAngle,
                    elbowAngle: 85 + Math.floor(Math.random() * 20),
                    kneeAngle: 140 + Math.floor(Math.random() * 20),
                  },
                  observations: idx === 0 
                    ? ["Good athletic stance", "Feet shoulder-width apart"]
                    : idx === fullFrames.length - 1
                    ? ["Maintain follow-through", "Fingers pointed to basket"]
                    : [],
                  status: frame.confidence && frame.confidence > 80 ? "good" : frame.confidence && frame.confidence > 60 ? "ok" : "needs_work",
                }
              })}
              title="Shot Breakdown Analysis"
            />
          ) : teaserFrames.length > 0 ? (
            <EnhancedShotStrip
              frames={teaserFrames.map((frame, idx) => ({
                id: frame.id,
                url: frame.url,
                phase: (["stance", "load", "set", "release", "follow"] as const)[Math.min(idx, 4)],
                label: frame.label || `Phase ${idx + 1}`,
                frameNumber: idx + 1,
              }))}
              title="Sample Strip"
              watermark="SAMPLE"
            />
          ) : (
            <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#4a4a4a] text-center">
              <p className="text-[#888] text-sm">No shot breakdown frames available.</p>
              <p className="text-[#666] text-xs mt-1">Upload 3-7 images on the home page to see your shot breakdown.</p>
            </div>
          )}

          {/* Media Thumbnails */}
          {allUploadedUrls.length > 0 && (
            <div className="bg-[#2a2a2a] rounded-lg p-4 border border-[#4a4a4a]">
              <h3 className="text-[#FFD700] font-bold text-sm uppercase tracking-wider mb-3">Uploaded Media</h3>
              <div className="grid grid-cols-4 gap-2">
                {allUploadedUrls.map((url, idx) => (
                  <div key={idx} className="rounded-lg overflow-hidden bg-[#1a1a1a] border border-[#3a3a3a] cursor-pointer hover:border-[#FFD700]/50 transition-colors">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-16 object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Score + Metrics + Issues */}
        <div className="space-y-6">
          {/* Madden-Style Player Card */}
          <div className="bg-[#2a2a2a] rounded-lg overflow-hidden lg:col-span-1">
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
          {/* TOP 5 MATCHED ELITE SHOOTERS */}
          <div className="space-y-3">
            {/* #1 - Primary Match (Large Card) */}
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
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#FFD700]/50 shadow-lg shadow-[#FFD700]/20 relative">
                      <Image
                        src="https://cdn.nba.com/headshots/nba/latest/1040x760/201142.png"
                        alt={analysisData.matchedShooter.name}
                        fill
                        sizes="96px"
                        className="object-cover object-top scale-150 translate-y-2"
                        priority
                      />
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

            {/* #2-5 - Additional Matches (Compact Cards) */}
            {[
              { rank: 2, name: "Kyle Korver", team: "Retired (Multiple Teams)", position: "SG", similarity: Math.max(50, analysisData.matchedShooter.similarityScore - 5), photoId: "2594", trait: "Textbook Form" },
              { rank: 3, name: "Ray Allen", team: "Retired (Multiple Teams)", position: "SG", similarity: Math.max(45, analysisData.matchedShooter.similarityScore - 10), photoId: "951", trait: "Perfect Arc" },
              { rank: 4, name: "Klay Thompson", team: "Dallas Mavericks", position: "SG", similarity: Math.max(40, analysisData.matchedShooter.similarityScore - 15), photoId: "202691", trait: "Quick Release" },
              { rank: 5, name: "Devin Booker", team: "Phoenix Suns", position: "SG", similarity: Math.max(35, analysisData.matchedShooter.similarityScore - 20), photoId: "1626164", trait: "Smooth Stroke" },
            ].map((shooter) => (
              <div key={shooter.rank} className="bg-[#2a2a2a] rounded-lg p-3 border border-[#3a3a3a] hover:border-[#FFD700]/30 transition-colors">
                <div className="flex items-center gap-3">
                  {/* Rank Badge */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                    shooter.rank === 2 ? 'bg-[#C0C0C0] text-[#1a1a1a]' :
                    shooter.rank === 3 ? 'bg-[#CD7F32] text-[#1a1a1a]' :
                    'bg-[#4a4a4a] text-[#888]'
                  }`}>
                    {shooter.rank}
                  </div>
                  
                  {/* Player Photo */}
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#FFD700]/30 relative flex-shrink-0">
                    <Image
                      src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${shooter.photoId}.png`}
                      alt={shooter.name}
                      fill
                      sizes="48px"
                      className="object-cover object-top scale-150 translate-y-1"
                    />
                  </div>
                  
                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{shooter.name}</p>
                    <p className="text-[#888] text-xs truncate">{shooter.team}</p>
                  </div>
                  
                  {/* Similarity & Trait */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-[#FFD700] font-black text-lg">{shooter.similarity}%</p>
                    <p className="text-[#888] text-[10px]">{shooter.trait}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* SHARE YOUR RESULTS - Mini Section */}
          <div className="bg-gradient-to-br from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] rounded-lg overflow-hidden border border-[#3a3a3a] shadow-lg">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#FFD700]/10 to-transparent p-4 border-b border-[#3a3a3a]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#FFD700]/10 flex items-center justify-center border border-[#FFD700]/30">
                  <Share2 className="w-5 h-5 text-[#FFD700]" />
                </div>
                <div>
                  <h2 className="text-[#FFD700] font-bold uppercase tracking-wider text-lg">Share Your Results</h2>
                  <p className="text-[#888] text-xs">Show off your shooting analysis</p>
                </div>
              </div>
            </div>

            {/* Share Options */}
            <div className="p-4">
              {/* Social Media Buttons */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <button 
                  onClick={() => handleShare("twitter")}
                  className="bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/30 rounded-lg p-3 flex flex-col items-center gap-2 transition-all hover:scale-105"
                >
                  <Twitter className="w-5 h-5 text-[#1DA1F2]" />
                  <span className="text-[#1DA1F2] text-[10px] font-semibold uppercase">Twitter</span>
                </button>
                <button 
                  onClick={() => handleShare("facebook")}
                  className="bg-[#4267B2]/10 hover:bg-[#4267B2]/20 border border-[#4267B2]/30 rounded-lg p-3 flex flex-col items-center gap-2 transition-all hover:scale-105"
                >
                  <Facebook className="w-5 h-5 text-[#4267B2]" />
                  <span className="text-[#4267B2] text-[10px] font-semibold uppercase">Facebook</span>
                </button>
                <button 
                  onClick={() => handleShare("linkedin")}
                  className="bg-[#0077B5]/10 hover:bg-[#0077B5]/20 border border-[#0077B5]/30 rounded-lg p-3 flex flex-col items-center gap-2 transition-all hover:scale-105"
                >
                  <Linkedin className="w-5 h-5 text-[#0077B5]" />
                  <span className="text-[#0077B5] text-[10px] font-semibold uppercase">LinkedIn</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button 
                  onClick={handleDownloadImage}
                  disabled={isGeneratingImage}
                  className="flex-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-[#4a4a4a] rounded-lg px-3 py-2.5 flex items-center justify-center gap-2 transition-colors"
                >
                  {isGeneratingImage ? (
                    <div className="w-4 h-4 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 text-[#888]" />
                  )}
                  <span className="text-[#E5E5E5] text-xs font-medium">Download</span>
                </button>
                <button 
                  onClick={handleCopyLink}
                  className="flex-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-[#4a4a4a] rounded-lg px-3 py-2.5 flex items-center justify-center gap-2 transition-colors"
                >
                  <Copy className="w-4 h-4 text-[#888]" />
                  <span className="text-[#E5E5E5] text-xs font-medium">Copy Link</span>
                </button>
              </div>

              {/* Main Share Button */}
              <button 
                onClick={handleNativeShare}
                className="w-full mt-3 bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#E5C100] hover:to-[#E59400] text-[#1a1a1a] font-bold px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#FFD700]/20"
              >
                <Share2 className="w-5 h-5" />
                <span className="uppercase tracking-wider text-sm">Share Results</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6 border-t border-[#3a3a3a]">
        <div className="flex gap-2 mb-6 flex-wrap">
          {["analysis", "flaws", "assessment", "comparison", "training", "history"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-md font-semibold uppercase tracking-wider transition-colors ${activeTab === tab ? "bg-[#FFD700] text-[#1a1a1a]" : "bg-[#3a3a3a] text-[#E5E5E5] hover:bg-[#4a4a4a]"}`}>
              {tab === "analysis" ? "BIOMECHANICAL ANALYSIS" : tab === "flaws" ? "IDENTIFIED FLAWS" : tab === "assessment" ? "PLAYER ASSESSMENT" : tab === "comparison" ? "COMPARISON" : tab === "training" ? "TRAINING PLAN" : "HISTORICAL DATA"}
            </button>
          ))}
        </div>
        {activeTab === "analysis" && <BiomechanicalAnalysisWithSessions />}
        {activeTab === "flaws" && <FlawsSection />}
        {activeTab === "assessment" && <AssessmentSection />}
        {activeTab === "comparison" && <ComparisonWithSessions />}
        {activeTab === "training" && <TrainingWithSessions />}
        {activeTab === "history" && <HistoricalDataSection />}
      </div>
    </>
  )
}

// ============================================
// PHASE 8: COACHING TIP CARD COMPONENT
// LLM-style personalized coaching advice
// ============================================

interface CoachingTipCardProps {
  flawTitle: string
  correction: string
  drills: { name: string; reps: string; difficulty: string }[]
}

function CoachingTipCard({ flawTitle, correction, drills }: CoachingTipCardProps) {
  const profileStore = useProfileStore()
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Get user level for appropriate language
  const userLevel: DrillSkillLevel = useMemo(() => {
    if (profileStore?.age) return mapAgeToLevel(profileStore.age)
    if (profileStore?.experienceLevel) return mapSkillLevelToLevel(profileStore.experienceLevel)
    return 'HIGH_SCHOOL'
  }, [profileStore])
  
  // Generate level-appropriate coaching message
  const coachingMessage = useMemo(() => {
    const drillName = drills[0]?.name || 'Form Practice'
    
    switch (userLevel) {
      case 'ELEMENTARY':
        return {
          whatINoticed: `Your ${flawTitle.toLowerCase()} needs a little practice! It's okay - everyone needs to work on something.`,
          whyItMatters: `When you fix this, your shots will go in more often! How cool is that? 🏀`,
          whatToDo: [
            `Practice the "${drillName}" drill for 5 minutes`,
            `Remember: ${correction}`,
            `Ask a friend or parent to watch and cheer you on!`
          ],
          expectedResult: `In 1 week, you'll feel more comfortable and confident! 🌟`,
          icon: '🎯'
        }
        
      case 'MIDDLE_SCHOOL':
        return {
          whatINoticed: `Your ${flawTitle.toLowerCase()} is affecting your shot consistency. This is a common issue that's very fixable.`,
          whyItMatters: `Fixing this will make you a more consistent shooter and help you make more shots in games.`,
          whatToDo: [
            `Practice the "${drillName}" drill (10-15 min/day)`,
            `Focus on: ${correction}`,
            `Use video to check your form`,
            `Track your progress over the week`
          ],
          expectedResult: `In 1-2 weeks, you should see noticeable improvement in your shooting consistency.`,
          icon: '📊'
        }
        
      case 'HIGH_SCHOOL':
        return {
          whatINoticed: `Analysis shows your ${flawTitle.toLowerCase()} is causing inconsistency in your shot mechanics.`,
          whyItMatters: `This variance is reducing your shooting percentage. Correcting this could add 2-4 points to your per-game average.`,
          whatToDo: [
            `Implement "${drillName}" drill (15-20 min/day)`,
            `Technical focus: ${correction}`,
            `Film analysis: Record 20 shots and compare to baseline`,
            `Resubmit analysis in 5 days to track improvement`
          ],
          expectedResult: `With focused practice, expect measurable improvement in 2 weeks.`,
          icon: '📈'
        }
        
      case 'COLLEGE':
        return {
          whatINoticed: `${flawTitle} variance detected. This correlates with efficiency loss in game situations.`,
          whyItMatters: `NCAA data indicates this issue affects shot selection under pressure. Addressing this is critical for competitive play.`,
          whatToDo: [
            `Protocol: "${drillName}" (20-30 min sessions)`,
            `Biomechanical adjustment: ${correction}`,
            `Video analysis with frame-by-frame comparison`,
            `Integration with game-situation drills`,
            `Weekly reassessment required`
          ],
          expectedResult: `Projected improvement: Reaching NCAA standard in 4-6 weeks with consistent practice.`,
          icon: '🎓'
        }
        
      case 'PROFESSIONAL':
        return {
          whatINoticed: `${flawTitle} analysis shows deviation from optimal. This contributes to efficiency variance, particularly under fatigue conditions.`,
          whyItMatters: `NBA data: Elite shooters maintain tighter variance. Your current variance affects overall efficiency.`,
          whatToDo: [
            `Micro-adjustment protocol: "${drillName}"`,
            `Technical specification: ${correction}`,
            `High-speed video analysis (240fps recommended)`,
            `Fatigue-condition testing required`,
            `Integration with defender-proximity adaptation`
          ],
          expectedResult: `Implementation timeline: Full correction in 2-3 weeks with maintained form under fatigue.`,
          icon: '🏆'
        }
        
      default:
        return {
          whatINoticed: `Your ${flawTitle.toLowerCase()} needs attention.`,
          whyItMatters: `Fixing this will improve your shooting.`,
          whatToDo: [`Practice: ${correction}`],
          expectedResult: `You should see improvement with consistent practice.`,
          icon: '💡'
        }
    }
  }, [userLevel, flawTitle, correction, drills])
  
  return (
    <div className="mt-4 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-lg border border-purple-500/30 overflow-hidden">
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-purple-500/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-purple-400" />
          <span className="text-purple-400 text-xs font-bold uppercase tracking-wider">Coaching Tip</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-purple-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-3">
          {/* What I Noticed */}
          <div className="bg-[#1a1a1a]/50 rounded-lg p-3">
            <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">What I Noticed</p>
            <p className="text-[#E5E5E5] text-sm">{coachingMessage.whatINoticed}</p>
          </div>
          
          {/* Why It Matters */}
          <div className="bg-[#1a1a1a]/50 rounded-lg p-3">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Why It Matters</p>
            <p className="text-[#E5E5E5] text-sm">{coachingMessage.whyItMatters}</p>
          </div>
          
          {/* What To Do */}
          <div className="bg-[#1a1a1a]/50 rounded-lg p-3">
            <p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">What To Do</p>
            <ol className="space-y-1">
              {coachingMessage.whatToDo.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#E5E5E5]">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
          
          {/* Expected Result */}
          <div className="bg-gradient-to-r from-[#FFD700]/20 to-transparent rounded-lg p-3 border border-[#FFD700]/30">
            <p className="text-xs font-bold text-[#FFD700] uppercase tracking-wider mb-1">Expected Result</p>
            <p className="text-[#E5E5E5] text-sm">{coachingMessage.expectedResult}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function FlawsSection() {
  // State for tracking expanded session accordions
  const [expandedSessions, setExpandedSessions] = useState<string[]>(['current']);
  // State for tracking expanded flaw cards within each session
  const [expandedCards, setExpandedCards] = useState<string[]>([]);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const sessionsPerPage = 10;
  
  // Get vision analysis from store to detect flaws
  const { visionAnalysisResult, uploadedImageBase64, playerProfile } = useAnalysisStore()
  
  // Load all sessions from localStorage
  const [sessions, setSessions] = useState<AnalysisSession[]>([])
  
  useEffect(() => {
    const loadedSessions = getAllSessions()
    setSessions(loadedSessions)
  }, [])

  // Toggle session accordion
  const toggleSession = (sessionId: string) => {
    setExpandedSessions(prev =>
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  // Toggle individual flaw card
  const toggleCard = (cardId: string) => {
    setExpandedCards(prev =>
      prev.includes(cardId)
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  // Helper to detect flaws from angles
  const getFlawsForAngles = (angles: Record<string, number> | undefined) => {
    if (!angles) {
      return [{
        id: 0,
        title: "No Data Available",
        severity: "UNKNOWN",
        severityScore: 0,
        category: "N/A",
        description: "No analysis data available for this session.",
        correction: "Upload an image to analyze your shooting form.",
        causeChain: [],
        drills: [],
        impact: "N/A"
      }]
    }
    
    const dbFlaws = detectFlawsFromAngles(angles)
    
    return dbFlaws.map((flaw, idx) => ({
      id: idx,
      title: flaw.name,
      severity: flaw.priority >= 8 ? "CRITICAL" : flaw.priority >= 6 ? "MODERATE" : "MINOR",
      severityScore: Math.max(20, 100 - flaw.priority * 8),
      category: flaw.id.includes("ELBOW") ? "Form" : 
                flaw.id.includes("KNEE") ? "Power" : 
                flaw.id.includes("SHOULDER") || flaw.id.includes("HIP") ? "Balance" : "Mechanics",
      description: flaw.description,
      correction: flaw.fixes[0] || "Work with a coach to correct this issue.",
      causeChain: flaw.causeChain,
      drills: flaw.drills.slice(0, 3).map((drill, i) => ({
        name: drill,
        reps: i === 0 ? "3 sets × 20 reps" : i === 1 ? "50 shots" : "5 minutes",
        difficulty: i === 0 ? "Easy" : i === 1 ? "Medium" : "Easy"
      })),
      impact: flaw.priority >= 8 ? "Critical impact on accuracy" : 
              flaw.priority >= 6 ? "High impact on shot accuracy" : "Medium impact on shot power"
    }))
  }

  // Build all sessions with flaws (current + history)
  const allSessionsWithFlaws = useMemo(() => {
    const result: { id: string; date: string; displayDate: string; flaws: any[]; score: number; isLive: boolean }[] = []
    
    // Add current live session if exists
    if (visionAnalysisResult?.success && uploadedImageBase64) {
      result.push({
        id: 'current',
        date: new Date().toISOString(),
        displayDate: 'Today (Live)',
        flaws: getFlawsForAngles(visionAnalysisResult.angles),
        score: visionAnalysisResult.overall_score || 70,
        isLive: true
      })
    }
    
    // Add saved sessions
    sessions.forEach(session => {
      result.push({
        id: session.id,
        date: session.date,
        displayDate: session.displayDate,
        flaws: getFlawsForAngles(session.analysisData?.angles),
        score: session.analysisData?.overallScore || 0,
        isLive: false
      })
    })
    
    return result
  }, [visionAnalysisResult, uploadedImageBase64, sessions])

  // Pagination
  const totalPages = Math.ceil(allSessionsWithFlaws.length / sessionsPerPage)
  const paginatedSessions = allSessionsWithFlaws.slice(
    (currentPage - 1) * sessionsPerPage,
    currentPage * sessionsPerPage
  )

  // Count total flaws across all sessions
  const totalFlawsCurrentSession = allSessionsWithFlaws[0]?.flaws.length || 0

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
                Identified Flaws History
              </h2>
              <p className="text-[#888] text-sm">{allSessionsWithFlaws.length} session{allSessionsWithFlaws.length !== 1 ? 's' : ''} • Click to expand each session</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center px-4 py-2 bg-red-500/10 rounded-lg border border-red-500/30">
              <p className="text-red-400 text-2xl font-black">{totalFlawsCurrentSession}</p>
              <p className="text-red-400/70 text-xs uppercase">Current Issues</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions Accordion List */}
      <div className="space-y-4">
        {paginatedSessions.map((session) => {
          const isSessionExpanded = expandedSessions.includes(session.id);
          
          return (
            <div
              key={session.id}
              className={`rounded-xl overflow-hidden border transition-all duration-300 ${
                session.isLive 
                  ? 'border-green-500/50 bg-gradient-to-br from-green-500/10 to-green-600/5' 
                  : 'border-[#3a3a3a] bg-[#2a2a2a]'
              }`}
            >
              {/* Session Header - Clickable */}
              <button
                onClick={() => toggleSession(session.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-[#1a1a1a]/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    session.isLive ? 'bg-green-500/20 border border-green-500/40' : 'bg-[#3a3a3a] border border-[#4a4a4a]'
                  }`}>
                    <Calendar className={`w-5 h-5 ${session.isLive ? 'text-green-400' : 'text-[#888]'}`} />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-[#E5E5E5]">{session.displayDate}</h3>
                      {session.isLive && (
                        <span className="px-2 py-0.5 bg-green-500 rounded text-[10px] font-bold text-white">LIVE</span>
                      )}
                    </div>
                    <p className="text-[#888] text-sm">{session.flaws.length} flaw{session.flaws.length !== 1 ? 's' : ''} detected • Score: {session.score}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    session.flaws.length === 0 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    session.flaws.length <= 2 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                    'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {session.flaws.length === 0 ? 'EXCELLENT' : session.flaws.length <= 2 ? 'GOOD' : 'NEEDS WORK'}
                  </div>
                  <div className={`w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center border border-[#4a4a4a] text-[#888] transition-transform duration-300 ${isSessionExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </div>
              </button>

              {/* Session Content - Expandable */}
              <div className={`overflow-hidden transition-all duration-300 ${isSessionExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-4 pt-0 space-y-3">
                  {session.flaws.length === 0 ? (
                    <div className="text-center py-8 text-[#888]">
                      <Check className="w-12 h-12 mx-auto mb-2 text-green-400" />
                      <p>No flaws detected in this session!</p>
                    </div>
                  ) : (
                    session.flaws.map((flaw, idx) => {
                      const cardId = `${session.id}-${idx}`;
                      const isCardExpanded = expandedCards.includes(cardId);
                      
                      return (
                        <div
                          key={cardId}
                          className="bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-xl overflow-hidden border border-red-500/50 shadow-lg shadow-red-500/10 transition-all duration-300"
                        >
                          {/* Flaw Card Header */}
                          <button
                            onClick={() => toggleCard(cardId)}
                            className="w-full bg-[#1a1a1a]/80 p-4 border-b border-red-500/30 hover:bg-[#1a1a1a]/90 transition-all cursor-pointer"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center border border-red-500/40 text-red-400">
                                  <X className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                  <h3 className="text-base font-bold text-[#E5E5E5] uppercase tracking-wide">{flaw.title}</h3>
                                  <span className="text-[#888] text-xs uppercase tracking-wider">{flaw.category}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider text-red-400 bg-[#1a1a1a] border border-red-500/50">
                                  {flaw.severity}
                                </div>
                                <div className={`w-6 h-6 rounded-full bg-[#2a2a2a] flex items-center justify-center border border-red-500/30 text-red-400 transition-transform duration-300 ${isCardExpanded ? 'rotate-180' : ''}`}>
                                  <ChevronDown className="w-4 h-4" />
                                </div>
                              </div>
                            </div>
                          </button>

                          {/* Expandable Flaw Card Body */}
                          <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${isCardExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}
                          >
                            <div className="p-4 space-y-3">
                              {/* Description */}
                              <div className="bg-[#1a1a1a]/50 rounded-lg p-3 border border-red-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                  <AlertTriangle className="w-4 h-4 text-red-400" />
                                  <span className="text-red-400 text-xs uppercase tracking-wider font-bold">Analysis</span>
                                </div>
                                <p className="text-[#E5E5E5] text-sm leading-relaxed">{flaw.description}</p>
                              </div>

                              {/* Cause Chain */}
                              {flaw.causeChain && flaw.causeChain.length > 0 && (
                                <div className="bg-[#1a1a1a]/50 rounded-lg p-3 border border-orange-500/20">
                                  <div className="flex items-center gap-2 mb-2">
                                    <ArrowRight className="w-4 h-4 text-orange-400" />
                                    <span className="text-orange-400 text-xs uppercase tracking-wider font-bold">Cause → Effect</span>
                                  </div>
                                  <div className="space-y-2">
                                    {flaw.causeChain.map((effect: { severity: string; effect: string; explanation: string }, i: number) => (
                                      <div key={i} className="flex items-start gap-2 text-sm">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                          effect.severity === 'major' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                          effect.severity === 'moderate' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                          'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                        }`}>
                                          {effect.severity}
                                        </span>
                                        <div className="flex-1">
                                          <p className="text-[#E5E5E5] font-medium">{effect.effect}</p>
                                          <p className="text-[#888] text-xs mt-0.5">{effect.explanation}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Correction */}
                              <div className="bg-gradient-to-r from-[#FFD700]/10 to-transparent rounded-lg p-3 border border-[#FFD700]/30">
                                <div className="flex items-center gap-2 mb-2">
                                  <Check className="w-4 h-4 text-[#FFD700]" />
                                  <span className="text-[#FFD700] text-xs uppercase tracking-wider font-bold">Correction</span>
                                </div>
                                <p className="text-[#E5E5E5] text-sm leading-relaxed">{flaw.correction}</p>
                              </div>

                              {/* Drills */}
                              {flaw.drills && flaw.drills.length > 0 && (
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Dumbbell className="w-4 h-4 text-[#888]" />
                                    <span className="text-[#888] text-xs uppercase tracking-wider font-bold">Drills</span>
                                  </div>
                                  <div className="space-y-1">
                                    {flaw.drills.map((drill: { name: string; reps: string; difficulty: string }, i: number) => (
                                      <div
                                        key={i}
                                        className="flex items-center justify-between bg-[#1a1a1a]/50 rounded-lg p-2 border border-[#2a2a2a]"
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-full bg-[#2a2a2a] flex items-center justify-center text-red-400 font-bold text-xs border border-red-500/30">
                                            {i + 1}
                                          </div>
                                          <div>
                                            <p className="text-[#E5E5E5] text-sm">{drill.name}</p>
                                            <p className="text-[#888] text-xs">{drill.reps}</p>
                                          </div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getDifficultyColor(drill.difficulty)}`}>
                                          {drill.difficulty}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Impact Badge */}
                              <div className="flex items-center justify-center pt-1">
                                <span className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 text-red-400 bg-[#1a1a1a] border border-red-500/50">
                                  <Zap className="w-3 h-3" /> {flaw.impact}
                                </span>
                              </div>
                              
                              {/* PHASE 8: LLM-Style Coaching Tip */}
                              <CoachingTipCard flawTitle={flaw.title} correction={flaw.correction} drills={flaw.drills} />
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-[#E5E5E5] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3a3a3a] transition-colors"
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg font-bold text-sm transition-colors ${
                  currentPage === page
                    ? 'bg-red-500 text-white'
                    : 'bg-[#2a2a2a] text-[#888] hover:bg-[#3a3a3a]'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-[#E5E5E5] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3a3a3a] transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

function TrainingSection() {
  const { visionAnalysisResult } = useAnalysisStore()
  
  // Generate personalized training plan based on detected flaws
  const weeklyPlan = useMemo(() => {
    // Get detected flaws
    const detectedFlaws = visionAnalysisResult?.angles 
      ? detectFlawsFromAngles(visionAnalysisResult.angles)
      : []
    
    // Categorize flaws by type
    const elbowFlaws = detectedFlaws.filter(f => f.id.includes('ELBOW'))
    const kneeFlaws = detectedFlaws.filter(f => f.id.includes('KNEE'))
    const balanceFlaws = detectedFlaws.filter(f => f.id.includes('SHOULDER') || f.id.includes('HIP') || f.id.includes('BALANCE'))
    
    // Build Monday exercises based on primary flaw (Form Focus)
    const mondayExercises = []
    if (elbowFlaws.length > 0) {
      mondayExercises.push({ name: "Wall elbow alignment drill", reps: "3 sets × 20", time: "12 min" })
      mondayExercises.push({ name: "One-hand form shots (elbow focus)", reps: "50 reps", time: "15 min" })
    } else {
      mondayExercises.push({ name: "Wall shooting", reps: "50 reps", time: "15 min" })
      mondayExercises.push({ name: "One-hand form shots", reps: "30 reps", time: "10 min" })
    }
    if (balanceFlaws.length > 0) {
      mondayExercises.push({ name: "Balance board shooting", reps: "30 reps", time: "10 min" })
    } else {
      mondayExercises.push({ name: "Mirror practice", reps: "20 reps", time: "10 min" })
    }
    mondayExercises.push({ name: "Cool down stretching", reps: "—", time: "10 min" })
    
    // Build Wednesday exercises based on power/knee issues
    const wednesdayExercises = []
    if (kneeFlaws.length > 0) {
      wednesdayExercises.push({ name: "Squat-to-shot drill", reps: "3 sets × 15", time: "12 min" })
      wednesdayExercises.push({ name: "Knee bend awareness shots", reps: "40 reps", time: "15 min" })
    } else {
      wednesdayExercises.push({ name: "Jump shots from free throw", reps: "40 reps", time: "15 min" })
      wednesdayExercises.push({ name: "Catch-and-shoot", reps: "30 reps", time: "12 min" })
    }
    wednesdayExercises.push({ name: "Leg drive drills", reps: "3 sets × 10", time: "10 min" })
    wednesdayExercises.push({ name: "Core exercises", reps: "3 sets × 15", time: "13 min" })
    
    // Build Friday exercises (game situations + flaw-specific)
    const fridayExercises = []
    if (detectedFlaws.length > 0) {
      // Add drill from top flaw
      const topFlaw = detectedFlaws[0]
      if (topFlaw.drills && topFlaw.drills[0]) {
        fridayExercises.push({ name: topFlaw.drills[0], reps: "30 reps", time: "12 min" })
      }
    }
    fridayExercises.push({ name: "Off-dribble shots", reps: "30 reps", time: "15 min" })
    fridayExercises.push({ name: "Contested shots", reps: "20 reps", time: "12 min" })
    fridayExercises.push({ name: "Free throws (pressure)", reps: "20 reps", time: "13 min" })
    
    // Determine focus areas based on flaws
    const mondayFocus = elbowFlaws.length > 0 ? "Elbow Correction" : "Form Fundamentals"
    const wednesdayFocus = kneeFlaws.length > 0 ? "Knee & Power" : "Power Generation"
    const fridayFocus = detectedFlaws.length > 0 ? "Flaw Integration" : "Game Situations"
    
    return [
      {
        day: "Monday",
        dayShort: "MON",
        focus: mondayFocus,
        iconType: "target" as const,
        color: { bg: "from-blue-500/20 to-blue-600/10", border: "border-blue-500/40", text: "text-blue-400", accent: "#3b82f6" },
        duration: "45 min",
        intensity: "Low",
        exercises: mondayExercises
      },
      {
        day: "Wednesday",
        dayShort: "WED",
        focus: wednesdayFocus,
        iconType: "dumbbell" as const,
        color: { bg: "from-yellow-500/20 to-yellow-600/10", border: "border-yellow-500/40", text: "text-yellow-400", accent: "#eab308" },
        duration: "50 min",
        intensity: "Medium",
        exercises: wednesdayExercises
      },
      {
        day: "Friday",
        dayShort: "FRI",
        focus: fridayFocus,
        iconType: "trophy" as const,
        color: { bg: "from-green-500/20 to-green-600/10", border: "border-green-500/40", text: "text-green-400", accent: "#22c55e" },
        duration: "55 min",
        intensity: "High",
        exercises: fridayExercises
      },
    ]
  }, [visionAnalysisResult])

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

// Generate assessment skills from hybrid analysis data
function generateAssessmentSkills(angles: Record<string, number> | undefined, analysisData: any) {
  if (!angles) {
    // Return default skills if no analysis data
    return [
      { name: "Release Form", score: 85, status: "Good" },
      { name: "Follow Through", score: 70, status: "Developing" },
      { name: "Balance & Base", score: 90, status: "Excellent" },
      { name: "Arc & Trajectory", score: 65, status: "Developing" },
      { name: "Elbow Alignment", score: 55, status: "Needs Work" },
      { name: "Guide Hand", score: 80, status: "Good" },
      { name: "Shot Consistency", score: 72, status: "Satisfactory" },
      { name: "Power Transfer", score: 78, status: "Good" },
    ]
  }

  // Calculate scores from actual angles
  const leftElbow = angles.left_elbow_angle || 0
  const rightElbow = angles.right_elbow_angle || 0
  const elbowAngle = rightElbow || leftElbow

  const leftKnee = angles.left_knee_angle || 0
  const rightKnee = angles.right_knee_angle || 0
  const kneeAngle = rightKnee || leftKnee

  const shoulderTilt = angles.shoulder_tilt || 180
  const hipTilt = angles.hip_tilt || 180

  // Score calculations based on optimal ranges
  const getStatus = (score: number) => {
    if (score >= 90) return "Excellent"
    if (score >= 80) return "Good"
    if (score >= 70) return "Satisfactory"
    if (score >= 60) return "Developing"
    return "Needs Work"
  }

  // Elbow alignment: optimal 85-95°
  let elbowScore = 50
  if (elbowAngle >= 85 && elbowAngle <= 95) elbowScore = 95
  else if (elbowAngle >= 80 && elbowAngle <= 100) elbowScore = 82
  else if (elbowAngle >= 75 && elbowAngle <= 105) elbowScore = 70
  else if (elbowAngle >= 70 && elbowAngle <= 110) elbowScore = 58
  else if (elbowAngle > 110) elbowScore = Math.max(30, 60 - (elbowAngle - 110))
  else if (elbowAngle < 70) elbowScore = Math.max(30, 60 - (70 - elbowAngle))

  // Balance: based on shoulder and hip tilt (should be close to 180° = level)
  const shoulderDeviation = Math.abs(180 - shoulderTilt)
  const hipDeviation = Math.abs(180 - hipTilt)
  let balanceScore = Math.max(40, 100 - (shoulderDeviation + hipDeviation) * 3)

  // Power transfer: based on knee bend (optimal 125-145° = 35-55° bend)
  const kneeBend = 180 - kneeAngle
  let powerScore = 50
  if (kneeBend >= 35 && kneeBend <= 55) powerScore = 92
  else if (kneeBend >= 30 && kneeBend <= 60) powerScore = 80
  else if (kneeBend >= 25 && kneeBend <= 65) powerScore = 70
  else if (kneeBend < 20) powerScore = Math.max(35, 50 - (20 - kneeBend) * 2)
  else powerScore = Math.max(50, 70 - Math.abs(45 - kneeBend))

  // Release form: combination of elbow and balance
  const releaseScore = Math.round((elbowScore * 0.6 + balanceScore * 0.4))

  // Follow through: estimated from elbow extension potential
  const followScore = Math.round(elbowScore * 0.8 + 15)

  // Arc & trajectory: estimated from release mechanics
  const arcScore = Math.round((releaseScore + powerScore) / 2 * 0.85)

  // Guide hand: estimated (would need hand tracking)
  const guideScore = Math.round(balanceScore * 0.9)

  // Consistency: estimated from overall form quality
  const consistencyScore = Math.round((elbowScore + balanceScore + powerScore) / 3 * 0.9)

  return [
    { name: "Release Form", score: Math.round(releaseScore), status: getStatus(releaseScore) },
    { name: "Follow Through", score: Math.round(followScore), status: getStatus(followScore) },
    { name: "Balance & Base", score: Math.round(balanceScore), status: getStatus(balanceScore) },
    { name: "Arc & Trajectory", score: Math.round(arcScore), status: getStatus(arcScore) },
    { name: "Elbow Alignment", score: Math.round(elbowScore), status: getStatus(elbowScore) },
    { name: "Guide Hand", score: Math.round(guideScore), status: getStatus(guideScore) },
    { name: "Shot Consistency", score: Math.round(consistencyScore), status: getStatus(consistencyScore) },
    { name: "Power Transfer", score: Math.round(powerScore), status: getStatus(powerScore) },
  ]
}

// Default fallback
const DEFAULT_ASSESSMENT_SKILLS = [
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

// Generate SPAR categories from hybrid analysis data
// Only includes high-value shooting form indicators (removed Shot Types & Consistency)
function generateSPARCategories(angles: Record<string, number> | undefined, skills: ReturnType<typeof generateAssessmentSkills>) {
  // Calculate scores from actual angles or use skills
  const releaseScore = skills.find(s => s.name === "Release Form")?.score || 72
  const followScore = skills.find(s => s.name === "Follow Through")?.score || 68
  const arcScore = skills.find(s => s.name === "Arc & Trajectory")?.score || 65
  const balanceScore = skills.find(s => s.name === "Balance & Base")?.score || 85
  const powerScore = skills.find(s => s.name === "Power Transfer")?.score || 71
  const elbowScore = skills.find(s => s.name === "Elbow Alignment")?.score || 55

  // Calculate max potential (current + improvement room based on detected flaws)
  const getMax = (current: number) => Math.min(99, current + Math.floor(Math.random() * 10) + 8)

  return [
    {
      name: "Shooting Form",
      color: { border: "#f97316", bg: "from-orange-500 to-orange-600", text: "text-orange-400" },
      stats: [
        { name: "Release Point", current: releaseScore, max: getMax(releaseScore) },
        { name: "Follow Through", current: followScore, max: getMax(followScore) },
        { name: "Arc Height", current: arcScore, max: getMax(arcScore) },
      ]
    },
    {
      name: "Physical",
      color: { border: "#8b5cf6", bg: "from-violet-500 to-purple-600", text: "text-violet-400" },
      stats: [
        { name: "Balance & Stability", current: balanceScore, max: getMax(balanceScore) },
        { name: "Leg Drive", current: powerScore, max: getMax(powerScore) },
      ]
    },
    {
      name: "Mechanics",
      color: { border: "#06b6d4", bg: "from-cyan-500 to-cyan-600", text: "text-cyan-400" },
      stats: [
        { name: "Elbow Alignment", current: elbowScore, max: getMax(elbowScore) },
        { name: "Body Control", current: balanceScore, max: getMax(balanceScore) },
      ]
    }
  ]
}

// Default SPAR categories (only high-value shooting form indicators)
const DEFAULT_SPAR_CATEGORIES = [
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
    name: "Physical",
    color: { border: "#8b5cf6", bg: "from-violet-500 to-purple-600", text: "text-violet-400" },
    stats: [
      { name: "Balance & Stability", current: 85, max: 95 },
      { name: "Leg Drive", current: 71, max: 86 },
    ]
  },
  {
    name: "Mechanics",
    color: { border: "#06b6d4", bg: "from-cyan-500 to-cyan-600", text: "text-cyan-400" },
    stats: [
      { name: "Elbow Alignment", current: 55, max: 75 },
      { name: "Body Control", current: 85, max: 95 },
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

function AssessmentSection() {
  // Get analysis data from store
  const { visionAnalysisResult, playerProfile, uploadedImageBase64 } = useAnalysisStore()
  
  // Session management state
  const [sessions, setSessions] = useState<AnalysisSession[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  
  // Load sessions from localStorage on mount
  useEffect(() => {
    const loadedSessions = getAllSessions()
    setSessions(loadedSessions)
    // Select the most recent session by default, or current if available
    if (loadedSessions.length > 0) {
      setSelectedSessionId(loadedSessions[0].id)
    }
    setIsLoadingSessions(false)
  }, [])
  
  // Get the currently selected session or create a "current" session from live data
  const currentSession = useMemo((): AnalysisSession | null => {
    // If we have a selected session from history, use it
    if (selectedSessionId) {
      const found = sessions.find(s => s.id === selectedSessionId)
      if (found) return found
    }
    
    // Otherwise, create a "live" session from current analysis
    if (visionAnalysisResult?.success && uploadedImageBase64) {
      const overallScore = visionAnalysisResult.overall_score || 70
      const detectedFlaws = visionAnalysisResult.angles 
        ? detectFlawsFromAngles(visionAnalysisResult.angles).map(f => f.name)
        : []
      
      return {
        id: 'current',
        date: new Date().toISOString(),
        displayDate: 'Now',
        mainImageBase64: uploadedImageBase64,
        skeletonImageBase64: uploadedImageBase64,
        screenshots: [],
        analysisData: {
          overallScore,
          shooterLevel: getShooterLevel(overallScore).name,
          angles: visionAnalysisResult.angles || {},
          detectedFlaws,
          measurements: {}
        },
        playerName: 'Player'
      }
    }
    
    return null
  }, [selectedSessionId, sessions, visionAnalysisResult, uploadedImageBase64, playerProfile])
  
  // Generate skills from actual analysis data (use current session data)
  const assessmentSkills = useMemo(() => {
    const angles = currentSession?.analysisData?.angles || visionAnalysisResult?.angles || null
    return generateAssessmentSkills(angles, null)
  }, [currentSession, visionAnalysisResult])
  
  // Generate SPAR categories from skills
  const sparCategories = useMemo(() => {
    const angles = currentSession?.analysisData?.angles || visionAnalysisResult?.angles || null
    return generateSPARCategories(angles, assessmentSkills)
  }, [currentSession, visionAnalysisResult, assessmentSkills])
  
  // Detect flaws for recommendations
  const detectedFlaws = useMemo(() => {
    const angles = currentSession?.analysisData?.angles || visionAnalysisResult?.angles
    if (!angles) return []
    return detectFlawsFromAngles(angles)
  }, [currentSession, visionAnalysisResult])
  
  // Get shooter level
  const overallScore = Math.round(assessmentSkills.reduce((acc, s) => acc + s.score, 0) / assessmentSkills.length)
  const shooterLevel = getShooterLevel(overallScore)
  
  const consistencyScore = Math.round((assessmentSkills[6].score + assessmentSkills[0].score) / 2)
  const formScore = Math.round((assessmentSkills[1].score + assessmentSkills[4].score + assessmentSkills[3].score) / 3)
  const assessmentDate = currentSession?.date 
    ? new Date(currentSession.date).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0]
  
  // Player name from profile or session
  const playerName = currentSession?.playerName || "Player"
  
  // Handle session selection
  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId)
  }
  
  // Handle delete session
  const handleDeleteSession = (sessionId: string) => {
    if (sessionId === 'current') return // Can't delete current
    deleteSession(sessionId)
    const updated = getAllSessions()
    setSessions(updated)
    if (selectedSessionId === sessionId) {
      setSelectedSessionId(updated.length > 0 ? updated[0].id : null)
    }
  }

  // Build all sessions list (current + saved) for carousel
  const allSessions = useMemo(() => {
    const list: AnalysisSession[] = []
    
    // Add current live session if exists
    if (visionAnalysisResult?.success && uploadedImageBase64) {
      list.push({
        id: 'current',
        date: new Date().toISOString(),
        displayDate: 'Now',
        mainImageBase64: uploadedImageBase64,
        skeletonImageBase64: uploadedImageBase64,
        screenshots: [],
        analysisData: {
          overallScore: visionAnalysisResult.overall_score || 70,
          shooterLevel: getShooterLevel(visionAnalysisResult.overall_score || 70).name,
          angles: visionAnalysisResult.angles || {},
          detectedFlaws: visionAnalysisResult.angles 
            ? detectFlawsFromAngles(visionAnalysisResult.angles).map(f => f.name)
            : [],
          measurements: {},
          keypoints: visionAnalysisResult.keypoints,
          basketball: visionAnalysisResult.basketball,
          imageSize: visionAnalysisResult.image_size
        },
        playerName: 'Player'
      })
    }
    
    // Add saved sessions
    list.push(...sessions)
    
    return list
  }, [visionAnalysisResult, uploadedImageBase64, sessions, playerProfile])

  // Get current index in carousel
  const currentIndex = useMemo(() => {
    if (!selectedSessionId && allSessions.length > 0) return 0
    const idx = allSessions.findIndex(s => s.id === selectedSessionId)
    return idx >= 0 ? idx : 0
  }, [selectedSessionId, allSessions])

  // Navigate carousel
  const goToPrevious = () => {
    if (currentIndex > 0) {
      setSelectedSessionId(allSessions[currentIndex - 1].id)
    }
  }

  const goToNext = () => {
    if (currentIndex < allSessions.length - 1) {
      setSelectedSessionId(allSessions[currentIndex + 1].id)
    }
  }

  // Get prev/next sessions for carousel display
  const prevSession = currentIndex > 0 ? allSessions[currentIndex - 1] : null
  const nextSession = currentIndex < allSessions.length - 1 ? allSessions[currentIndex + 1] : null

  return (
    <div className="space-y-6">
      {/* ==================== SESSION GALLERY CAROUSEL (TOP) ==================== */}
      <div className="bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] rounded-xl p-6 border border-[#3a3a3a]">
        {/* Header with Date Dropdown */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FFD700]/10 flex items-center justify-center border border-[#FFD700]/30">
              <ImageIcon className="w-6 h-6 text-[#FFD700]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#FFD700] uppercase tracking-wider">Session Gallery</h2>
              <p className="text-[#888] text-sm">{allSessions.length} session{allSessions.length !== 1 ? 's' : ''} • Scroll to browse</p>
            </div>
          </div>
          
          {/* Date Dropdown - Quick Jump */}
          <div className="flex items-center gap-3">
            <select
              value={selectedSessionId || allSessions[0]?.id || ''}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="bg-[#2a2a2a] border border-[#4a4a4a] rounded-lg px-3 py-2 text-[#E5E5E5] text-sm focus:outline-none focus:border-[#FFD700] cursor-pointer"
            >
              {allSessions.map((session, idx) => (
                <option key={session.id} value={session.id}>
                  {session.id === 'current' ? '📍 Now (Live)' : `📅 ${session.displayDate}`} - {session.analysisData.overallScore}%
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CAROUSEL - Main Image with Prev/Next peeks */}
        {allSessions.length > 0 && (
          <div className="relative">
            {/* Carousel Container */}
            <div className="flex items-center gap-4">
              {/* LEFT ARROW */}
              <button
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all z-10 ${
                  currentIndex === 0
                    ? 'bg-[#2a2a2a] text-[#4a4a4a] cursor-not-allowed'
                    : 'bg-[#FFD700] text-[#1a1a1a] hover:bg-[#E5C100] shadow-lg'
                }`}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* CAROUSEL TRACK */}
              <div className="flex-1 flex items-center justify-center gap-4 overflow-hidden">
                {/* PREVIOUS SESSION (Half visible - Left) */}
                <div 
                  className={`flex-shrink-0 w-1/4 transition-all duration-300 ${
                    prevSession ? 'opacity-50 cursor-pointer hover:opacity-70' : 'opacity-0 pointer-events-none'
                  }`}
                  onClick={prevSession ? goToPrevious : undefined}
                  style={{ transform: 'translateX(50%)' }}
                >
                  {prevSession && (
                    <div className="rounded-xl overflow-hidden border-2 border-[#4a4a4a] bg-[#1a1a1a]">
                      {prevSession.mainImageBase64 ? (
                        <img 
                          src={prevSession.mainImageBase64} 
                          alt={`Previous: ${prevSession.displayDate}`}
                          className="w-full h-[300px] object-cover"
                        />
                      ) : (
                        <div className="w-full h-[300px] flex items-center justify-center bg-[#2a2a2a]">
                          <ImageIcon className="w-12 h-12 text-[#4a4a4a]" />
                        </div>
                      )}
                      <div className="bg-[#2a2a2a] p-2 text-center">
                        <p className="text-[#888] text-xs">{prevSession.displayDate}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* MAIN/CURRENT SESSION (Full - Center) */}
                <div className="flex-shrink-0 w-1/2 z-10">
                  {currentSession && (
                    <div className="rounded-xl overflow-hidden border-2 border-[#FFD700] shadow-[0_0_30px_rgba(255,215,0,0.3)] bg-[#1a1a1a]">
                      {currentSession.mainImageBase64 ? (
                        <HybridSkeletonDisplay
                          imageUrl={currentSession.mainImageBase64}
                          keypoints={currentSession.analysisData?.keypoints || visionAnalysisResult?.keypoints}
                          basketball={currentSession.analysisData?.basketball || visionAnalysisResult?.basketball}
                          imageSize={currentSession.analysisData?.imageSize || visionAnalysisResult?.image_size}
                          angles={currentSession.analysisData?.angles || visionAnalysisResult?.angles}
                          confidence={currentSession.analysisData?.overallScore || visionAnalysisResult?.overall_score}
                          showStats={false}
                        />
                      ) : (
                        <div className="w-full h-[400px] flex items-center justify-center">
                          <ImageIcon className="w-20 h-20 text-[#4a4a4a]" />
                        </div>
                      )}
                      {/* Session Info Bar */}
                      <div className="bg-gradient-to-r from-[#FFD700]/20 to-[#2a2a2a] p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {currentSession.id === 'current' && (
                            <span className="px-2 py-0.5 bg-green-500 rounded text-[10px] font-bold text-white">LIVE</span>
                          )}
                          <span className="text-[#FFD700] font-bold text-sm">{currentSession.displayDate}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[#E5E5E5] text-sm font-bold">{currentSession.analysisData.overallScore}%</span>
                          <span className="text-[#888] text-xs">{currentSession.analysisData.shooterLevel}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* NEXT SESSION (Half visible - Right) */}
                <div 
                  className={`flex-shrink-0 w-1/4 transition-all duration-300 ${
                    nextSession ? 'opacity-50 cursor-pointer hover:opacity-70' : 'opacity-0 pointer-events-none'
                  }`}
                  onClick={nextSession ? goToNext : undefined}
                  style={{ transform: 'translateX(-50%)' }}
                >
                  {nextSession && (
                    <div className="rounded-xl overflow-hidden border-2 border-[#4a4a4a] bg-[#1a1a1a]">
                      {nextSession.mainImageBase64 ? (
                        <img 
                          src={nextSession.mainImageBase64} 
                          alt={`Next: ${nextSession.displayDate}`}
                          className="w-full h-[300px] object-cover"
                        />
                      ) : (
                        <div className="w-full h-[300px] flex items-center justify-center bg-[#2a2a2a]">
                          <ImageIcon className="w-12 h-12 text-[#4a4a4a]" />
                        </div>
                      )}
                      <div className="bg-[#2a2a2a] p-2 text-center">
                        <p className="text-[#888] text-xs">{nextSession.displayDate}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT ARROW */}
              <button
                onClick={goToNext}
                disabled={currentIndex >= allSessions.length - 1}
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all z-10 ${
                  currentIndex >= allSessions.length - 1
                    ? 'bg-[#2a2a2a] text-[#4a4a4a] cursor-not-allowed'
                    : 'bg-[#FFD700] text-[#1a1a1a] hover:bg-[#E5C100] shadow-lg'
                }`}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Carousel Indicators (dots) */}
            {allSessions.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {allSessions.map((session, idx) => (
                  <button
                    key={session.id}
                    onClick={() => setSelectedSessionId(session.id)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      idx === currentIndex
                        ? 'bg-[#FFD700] w-6'
                        : 'bg-[#4a4a4a] hover:bg-[#666]'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {allSessions.length === 0 && (
          <div className="py-12 text-center">
            <ImageIcon className="w-16 h-16 text-[#4a4a4a] mx-auto mb-4" />
            <p className="text-[#888] text-sm">No sessions yet. Complete an analysis to see your first session.</p>
          </div>
        )}

        {/* THREE SCREENSHOTS - Below carousel, updates with selected session */}
        {currentSession && (
          <div className="mt-6">
            <h4 className="text-[#888] text-xs uppercase tracking-wider font-bold mb-3">Analysis Snapshots</h4>
            <AutoScreenshots
              imageUrl={currentSession.mainImageBase64 || ''}
              keypoints={currentSession.analysisData?.keypoints || visionAnalysisResult?.keypoints}
              basketball={currentSession.analysisData?.basketball || visionAnalysisResult?.basketball}
              imageSize={currentSession.analysisData?.imageSize || visionAnalysisResult?.image_size}
              angles={currentSession.analysisData?.angles || visionAnalysisResult?.angles}
            />
          </div>
        )}
      </div>

      {/* ==================== REST OF ASSESSMENT (3-column layout) ==================== */}
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
              <div className="flex justify-between"><span className="text-[#888]">Player:</span><span className="text-[#E5E5E5]">{playerName}</span></div>
              <div className="flex justify-between"><span className="text-[#888]">Sessions:</span><span className="text-[#E5E5E5]">{sessions.length + (currentSession?.id === 'current' ? 1 : 0)}</span></div>
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
              {sparCategories.map((category, idx) => (
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
          {/* Header with Shooter Level */}
          <div className="bg-[#3a3a3a] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#FFD700] mb-1">{playerName}</h2>
                <p className="text-[#888] uppercase tracking-wider text-sm">Shooting Mechanics Assessment Report</p>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-black ${
                  shooterLevel.level <= 2 ? 'text-green-400' :
                  shooterLevel.level <= 4 ? 'text-[#FFD700]' :
                  shooterLevel.level <= 6 ? 'text-orange-400' : 'text-red-400'
                }`}>
                  {shooterLevel.name}
                </div>
                <p className="text-[#888] text-xs">Level {shooterLevel.level} of 8</p>
              </div>
            </div>
          </div>

        {/* Assessment Results */}
        <div className="bg-[#3a3a3a] rounded-lg p-6">
          <h3 className="text-xl font-bold text-[#E5E5E5] uppercase tracking-wider mb-4">Assessment Results</h3>
          <div className="mb-4">
            <h4 className="text-[#FFD700] font-semibold uppercase text-sm mb-2">Overall Performance Rating</h4>
            <p className="text-[#888] text-sm mb-1">Basketball Shooting Mechanics Program</p>
            <p className="text-[#888] text-sm mb-3">Assessment Date: {assessmentDate}</p>
            <ul className="space-y-2 text-sm text-[#E5E5E5]">
              <li className="flex items-start gap-2"><span className="text-[#FFD700]">•</span>Achieved <span className="text-[#FFD700] font-semibold">{overallScore}%</span> overall shooting form rating</li>
              <li className="flex items-start gap-2"><span className="text-[#FFD700]">•</span>Demonstrated <span className="text-[#FFD700] font-semibold">{assessmentSkills.filter(s => s.score >= 80).length}</span> skills at advanced level</li>
              <li className="flex items-start gap-2"><span className="text-[#FFD700]">•</span>Shooter Classification: <span className="text-[#FFD700] font-semibold">{shooterLevel.name}</span> ({shooterLevel.scoreRange[0]}-{shooterLevel.scoreRange[1]} range)</li>
              <li className="flex items-start gap-2"><span className="text-[#FFD700]">•</span>{detectedFlaws.length === 0 ? 'No significant mechanical flaws detected' : `${detectedFlaws.length} mechanical issue${detectedFlaws.length > 1 ? 's' : ''} identified for improvement`}</li>
            </ul>
          </div>
          
          {/* Strengths & Areas for Improvement */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <h4 className="text-green-400 font-semibold uppercase text-sm mb-3">✓ Strengths</h4>
              <ul className="space-y-2 text-sm text-[#E5E5E5]">
                {assessmentSkills.filter(s => s.score >= 70).slice(0, 3).map((skill, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-green-400">•</span>
                    <span>{skill.name} ({skill.score}%) - {skill.status}</span>
                  </li>
                ))}
                {assessmentSkills.filter(s => s.score >= 70).length === 0 && (
                  <li className="text-[#888]">Focus on building foundational mechanics</li>
                )}
              </ul>
            </div>
            
            {/* Areas for Improvement */}
            <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
              <h4 className="text-orange-400 font-semibold uppercase text-sm mb-3">⚠ Areas for Improvement</h4>
              <ul className="space-y-2 text-sm text-[#E5E5E5]">
                {assessmentSkills.filter(s => s.score < 70).slice(0, 3).map((skill, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-orange-400">•</span>
                    <span>{skill.name} ({skill.score}%) - {skill.status}</span>
                  </li>
                ))}
                {assessmentSkills.filter(s => s.score < 70).length === 0 && (
                  <li className="text-[#888]">All skills at satisfactory level or above</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Development Recommendations - Dynamic based on detected flaws */}
        <div className="bg-[#3a3a3a] rounded-lg p-6">
          <h3 className="text-xl font-bold text-[#E5E5E5] uppercase tracking-wider mb-4">Development Recommendations</h3>

          {detectedFlaws.length > 0 ? (
            <>
              <div className="mb-6">
                <h4 className="text-[#FFD700] font-semibold uppercase text-sm mb-3">Primary Focus Areas</h4>
                <div className="space-y-4">
                  {detectedFlaws.slice(0, 2).map((flaw, idx) => (
                    <div key={idx} className="bg-[#2a2a2a] rounded-lg p-4 border-l-4 border-[#FFD700]">
                      <p className="text-[#E5E5E5] font-semibold mb-2">{flaw.name}</p>
                      <p className="text-[#888] text-sm mb-2">{flaw.description}</p>
                      <p className="text-green-400 text-sm"><span className="text-[#888]">Fix:</span> {flaw.fixes[0]}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-[#FFD700] font-semibold uppercase text-sm mb-3">Cause & Effect Analysis</h4>
                <div className="space-y-3 text-sm text-[#E5E5E5]">
                  {detectedFlaws[0]?.causeChain.slice(0, 2).map((effect, idx) => (
                    <p key={idx}>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs mr-2 ${
                        effect.severity === 'major' ? 'bg-red-500/20 text-red-400' :
                        effect.severity === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>{effect.severity}</span>
                      <span className="text-[#888]">{effect.effect}:</span> {effect.explanation}
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[#FFD700] font-semibold uppercase text-sm mb-3">Recommended Drills</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {detectedFlaws.flatMap(f => f.drills).slice(0, 4).map((drill, idx) => (
                    <div key={idx} className="bg-[#2a2a2a] rounded-lg p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#FFD700]/20 flex items-center justify-center text-[#FFD700] font-bold text-sm">
                        {idx + 1}
                      </div>
                      <span className="text-[#E5E5E5] text-sm">{drill}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <p className="text-green-400 font-semibold mb-2">Excellent Form Detected!</p>
              <p className="text-[#E5E5E5] text-sm">
                Your shooting mechanics show strong fundamentals with no significant flaws detected.
                Continue practicing to maintain consistency and build muscle memory.
              </p>
            </div>
          )}
        </div>

        {/* PHASE 8: Motivational Message */}
        <MotivationalMessageCard 
          overallScore={overallScore}
          sessionsCount={allSessions.length}
          shooterLevel={shooterLevel}
        />

        {/* ==================== PHASE 12: GAMIFICATION ==================== */}
        {/* Level Progress & Streak */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LevelProgressCard />
          <StreakTracker />
        </div>

        {/* Badges Showcase */}
        <BadgesShowcase maxDisplay={12} />

      </div>
    </div>
  </div>
  )
}

// ============================================
// PHASE 8: MOTIVATIONAL MESSAGE CARD
// ============================================

interface MotivationalMessageCardProps {
  overallScore: number
  sessionsCount: number
  shooterLevel: ReturnType<typeof getShooterLevel>
}

function MotivationalMessageCard({ overallScore, sessionsCount, shooterLevel }: MotivationalMessageCardProps) {
  const profileStore = useProfileStore()
  
  // Get user level for appropriate messaging
  const userLevel: DrillSkillLevel = useMemo(() => {
    if (profileStore?.age) return mapAgeToLevel(profileStore.age)
    if (profileStore?.experienceLevel) return mapSkillLevelToLevel(profileStore.experienceLevel)
    return 'HIGH_SCHOOL'
  }, [profileStore])
  
  // Generate motivational message based on context
  const message = useMemo(() => {
    // Check for milestones
    if (sessionsCount === 10) {
      return {
        type: 'milestone' as const,
        title: '🏆 MILESTONE ACHIEVED!',
        message: getMilestoneMessage(userLevel, '10 Sessions Completed'),
        icon: '🏆',
        color: 'gold'
      }
    }
    
    if (sessionsCount === 50) {
      return {
        type: 'milestone' as const,
        title: '🏆 MAJOR MILESTONE!',
        message: getMilestoneMessage(userLevel, '50 Sessions Completed'),
        icon: '🏆',
        color: 'gold'
      }
    }
    
    // Check for score-based messages
    if (overallScore >= 90) {
      return {
        type: 'progress' as const,
        title: '⭐ ELITE PERFORMANCE!',
        message: getEliteMessage(userLevel, overallScore),
        icon: '⭐',
        color: 'gold'
      }
    }
    
    if (overallScore >= 75) {
      return {
        type: 'progress' as const,
        title: '📈 GREAT PROGRESS!',
        message: getProgressMessage(userLevel, overallScore),
        icon: '📈',
        color: 'green'
      }
    }
    
    // Default encouragement
    return {
      type: 'encouragement' as const,
      title: '💪 KEEP GOING!',
      message: getEncouragementMessage(userLevel, overallScore),
      icon: '💪',
      color: 'blue'
    }
  }, [userLevel, overallScore, sessionsCount])
  
  function getMilestoneMessage(level: DrillSkillLevel, milestone: string): string {
    switch (level) {
      case 'ELEMENTARY':
        return `Wow! You did it! ${milestone}! You're becoming such a great shooter! Keep practicing and you'll be amazing! 🎉`
      case 'MIDDLE_SCHOOL':
        return `Congratulations! You've reached ${milestone}! This shows real dedication. You're on your way to becoming a consistent shooter!`
      case 'HIGH_SCHOOL':
        return `${milestone} achieved! This level of consistency puts you ahead of 80% of players at your level. Keep this momentum going.`
      case 'COLLEGE':
        return `${milestone} - This achievement demonstrates NCAA-level commitment. Your dedication is reflected in your metrics.`
      case 'PROFESSIONAL':
        return `${milestone} - Elite-level milestone achieved. This consistency is what separates professionals from amateurs.`
      default:
        return `${milestone} achieved! Great work!`
    }
  }
  
  function getEliteMessage(level: DrillSkillLevel, score: number): string {
    switch (level) {
      case 'ELEMENTARY':
        return `Amazing! Your shooting form is ${score}%! That's super incredible! You're shooting like a star! 🌟`
      case 'MIDDLE_SCHOOL':
        return `Your ${score}% form score is exceptional! You're performing at an advanced level. Keep refining these mechanics!`
      case 'HIGH_SCHOOL':
        return `${score}% form score puts you in elite territory. This level of mechanics is college-ready. Focus on maintaining consistency.`
      case 'COLLEGE':
        return `${score}% efficiency - You're performing at professional standards. Continue micro-adjustments for optimal performance.`
      case 'PROFESSIONAL':
        return `${score}% form efficiency - Elite-level mechanics confirmed. Focus on situational shooting and fatigue management.`
      default:
        return `${score}% - Excellent shooting form!`
    }
  }
  
  function getProgressMessage(level: DrillSkillLevel, score: number): string {
    switch (level) {
      case 'ELEMENTARY':
        return `You're doing great! Your ${score}% score shows you're learning fast! Keep having fun with it! 🏀`
      case 'MIDDLE_SCHOOL':
        return `${score}% is solid progress! You're building good fundamentals. Keep practicing and you'll reach advanced level soon!`
      case 'HIGH_SCHOOL':
        return `${score}% form score shows strong development. You're on track for varsity-level performance. Focus on the recommended drills.`
      case 'COLLEGE':
        return `${score}% efficiency is competitive. Continue working on identified areas to reach elite status.`
      case 'PROFESSIONAL':
        return `${score}% form efficiency. Room for optimization exists. Implement micro-adjustment protocols.`
      default:
        return `${score}% - Good progress!`
    }
  }
  
  function getEncouragementMessage(level: DrillSkillLevel, score: number): string {
    switch (level) {
      case 'ELEMENTARY':
        return `You're learning! Every practice makes you better. Keep shooting and having fun - you'll get there! 💪`
      case 'MIDDLE_SCHOOL':
        return `Your ${score}% score is a starting point. With focused practice on the drills, you'll see improvement quickly!`
      case 'HIGH_SCHOOL':
        return `${score}% shows areas for growth. Focus on the recommended drills and you'll see measurable improvement in 2-3 weeks.`
      case 'COLLEGE':
        return `${score}% indicates development opportunities. Implement the training protocol to optimize your mechanics.`
      case 'PROFESSIONAL':
        return `${score}% efficiency requires attention. Review biomechanical analysis and adjust training focus.`
      default:
        return `Keep practicing! Improvement comes with consistency.`
    }
  }
  
  const bgColorClass = message.color === 'gold' 
    ? 'from-[#FFD700]/20 to-[#FFD700]/5 border-[#FFD700]/40' 
    : message.color === 'green'
    ? 'from-green-500/20 to-green-500/5 border-green-500/40'
    : 'from-blue-500/20 to-blue-500/5 border-blue-500/40'
  
  const textColorClass = message.color === 'gold' 
    ? 'text-[#FFD700]' 
    : message.color === 'green'
    ? 'text-green-400'
    : 'text-blue-400'
  
  return (
    <div className={`bg-gradient-to-r ${bgColorClass} rounded-xl p-6 border`}>
      <div className="flex items-start gap-4">
        <div className="text-4xl">{message.icon}</div>
        <div className="flex-1">
          <h3 className={`text-xl font-black uppercase tracking-wider mb-2 ${textColorClass}`}>
            {message.title}
          </h3>
          <p className="text-[#E5E5E5] text-sm leading-relaxed">
            {message.message}
          </p>
          
          {/* Next Goal Hint */}
          <div className="mt-4 pt-4 border-t border-[#3a3a3a]">
            <p className="text-[#888] text-xs uppercase tracking-wider mb-1">Next Goal</p>
            <p className="text-[#E5E5E5] text-sm">
              {shooterLevel.level > 1 
                ? `Reach ${shooterLevel.name === 'Elite' ? 'Perfect' : SHOOTER_LEVELS[shooterLevel.level - 2]?.name || 'next'} level (${SHOOTER_LEVELS[shooterLevel.level - 2]?.scoreRange[0] || 95}%+)`
                : `Maintain Elite status with consistent practice`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Import SHOOTER_LEVELS for the motivational card
const SHOOTER_LEVELS = [
  { level: 1, name: 'Elite', scoreRange: [90, 100] },
  { level: 2, name: 'Advanced', scoreRange: [80, 89] },
  { level: 3, name: 'Proficient', scoreRange: [70, 79] },
  { level: 4, name: 'Intermediate', scoreRange: [60, 69] },
  { level: 5, name: 'Developing', scoreRange: [50, 59] },
  { level: 6, name: 'Beginner', scoreRange: [40, 49] },
  { level: 7, name: 'Novice', scoreRange: [30, 39] },
  { level: 8, name: 'Learning', scoreRange: [0, 29] }
]

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
            <div className="w-20 h-20 rounded-full overflow-hidden bg-[#3a3a3a] relative" style={{ border: '3px solid #FFD700' }}>
              {photoUrl ? (
                <Image
                  src={photoUrl}
                  alt={shooter.name}
                  fill
                  sizes="80px"
                  className="object-cover object-top"
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

// ============================================
// WRAPPER COMPONENTS WITH SESSION FILTERING
// ============================================

// Biomechanical Analysis with Session Filter Dropdown
function BiomechanicalAnalysisWithSessions() {
  const { visionAnalysisResult, uploadedImageBase64 } = useAnalysisStore()
  const [sessions, setSessions] = useState<AnalysisSession[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>('current')
  
  useEffect(() => {
    const loadedSessions = getAllSessions()
    setSessions(loadedSessions)
  }, [])
  
  // Get measurements for selected session
  const getMeasurementsForSession = useCallback((sessionId: string) => {
    if (sessionId === 'current' && visionAnalysisResult?.success) {
      const angles = visionAnalysisResult.angles || {}
      return {
        shoulderAngle: angles.shoulder_tilt || angles.left_shoulder_angle || 170,
        elbowAngle: angles.right_elbow_angle || angles.left_elbow_angle || 88,
        hipAngle: angles.hip_tilt || 175,
        kneeAngle: angles.right_knee_angle || angles.left_knee_angle || 140,
        ankleAngle: angles.left_ankle_angle || angles.right_ankle_angle || 85,
        releaseHeight: 108,
        releaseAngle: 48,
        entryAngle: 44,
      }
    }
    
    const session = sessions.find(s => s.id === sessionId)
    if (session?.analysisData?.angles) {
      const angles = session.analysisData.angles
      return {
        shoulderAngle: angles.shoulder_tilt || angles.left_shoulder_angle || 170,
        elbowAngle: angles.right_elbow_angle || angles.left_elbow_angle || 88,
        hipAngle: angles.hip_tilt || 175,
        kneeAngle: angles.right_knee_angle || angles.left_knee_angle || 140,
        ankleAngle: angles.left_ankle_angle || angles.right_ankle_angle || 85,
        releaseHeight: 108,
        releaseAngle: 48,
        entryAngle: 44,
      }
    }
    
    // Default measurements
    return {
      shoulderAngle: 170,
      elbowAngle: 88,
      hipAngle: 175,
      kneeAngle: 140,
      ankleAngle: 85,
      releaseHeight: 108,
      releaseAngle: 48,
      entryAngle: 44,
    }
  }, [visionAnalysisResult, sessions])
  
  const currentMeasurements = getMeasurementsForSession(selectedSessionId)
  
  // Build session options
  const sessionOptions = useMemo(() => {
    const options: { id: string; label: string; date: string }[] = []
    
    if (visionAnalysisResult?.success && uploadedImageBase64) {
      options.push({
        id: 'current',
        label: 'Current Session (Live)',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      })
    }
    
    sessions.forEach(session => {
      options.push({
        id: session.id,
        label: session.displayDate,
        date: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      })
    })
    
    return options
  }, [visionAnalysisResult, uploadedImageBase64, sessions])
  
  return (
    <div className="space-y-6">
      {/* Session Filter Dropdown */}
      <div className="bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] rounded-xl p-4 border border-[#3a3a3a]">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-[#FFD700]" />
            <span className="text-[#E5E5E5] font-semibold">Select Session:</span>
          </div>
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-4 py-2 text-[#E5E5E5] focus:border-[#FFD700] focus:outline-none min-w-[250px]"
          >
            {sessionOptions.map(option => (
              <option key={option.id} value={option.id}>
                {option.label} - {option.date}
              </option>
            ))}
          </select>
        </div>
        {sessionOptions.length === 0 && (
          <p className="text-[#888] text-sm mt-2">No sessions available. Upload an image to create your first session.</p>
        )}
      </div>
      
      {/* Analysis Dashboard */}
      <AnalysisDashboard measurements={currentMeasurements} />
    </div>
  )
}

// Comparison with Session Filter Dropdown - Phase 6 Enhanced
function ComparisonWithSessions() {
  const { visionAnalysisResult, uploadedImageBase64, playerProfile } = useAnalysisStore()
  const [sessions, setSessions] = useState<AnalysisSession[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>('current')
  const [viewMode, setViewMode] = useState<'personalized' | 'elite' | 'photo'>('personalized') // Phase 6 & 7 toggle
  
  useEffect(() => {
    const loadedSessions = getAllSessions()
    setSessions(loadedSessions)
  }, [])
  
  // Get analysis data for selected session
  const getAnalysisDataForSession = useCallback((sessionId: string) => {
    if (sessionId === 'current' && visionAnalysisResult?.success) {
      const angles = visionAnalysisResult.angles || {}
      return {
        overallScore: visionAnalysisResult.overall_score || 70,
        measurements: {
          shoulderAngle: angles.shoulder_tilt || angles.left_shoulder_angle || 170,
          elbowAngle: angles.right_elbow_angle || angles.left_elbow_angle || 88,
          hipAngle: angles.hip_tilt || 175,
          kneeAngle: angles.right_knee_angle || angles.left_knee_angle || 140,
          ankleAngle: angles.left_ankle_angle || angles.right_ankle_angle || 85,
          releaseHeight: 108,
          releaseAngle: 48,
          entryAngle: 44,
        },
        category: "GOOD" as const,
        feedback: visionAnalysisResult.feedback || [],
      }
    }
    
    const session = sessions.find(s => s.id === sessionId)
    if (session?.analysisData) {
      const angles = session.analysisData.angles || {}
      return {
        overallScore: session.analysisData.overallScore || 70,
        measurements: {
          shoulderAngle: angles.shoulder_tilt || angles.left_shoulder_angle || 170,
          elbowAngle: angles.right_elbow_angle || angles.left_elbow_angle || 88,
          hipAngle: angles.hip_tilt || 175,
          kneeAngle: angles.right_knee_angle || angles.left_knee_angle || 140,
          ankleAngle: angles.left_ankle_angle || angles.right_ankle_angle || 85,
          releaseHeight: 108,
          releaseAngle: 48,
          entryAngle: 44,
        },
        category: "GOOD" as const,
        feedback: session.analysisData.feedback || [],
      }
    }
    
    // Default
    return {
      overallScore: 70,
      measurements: {
        shoulderAngle: 170,
        elbowAngle: 88,
        hipAngle: 175,
        kneeAngle: 140,
        ankleAngle: 85,
        releaseHeight: 108,
        releaseAngle: 48,
        entryAngle: 44,
      },
      category: "GOOD" as const,
      feedback: [],
    }
  }, [visionAnalysisResult, sessions])
  
  const currentAnalysisData = getAnalysisDataForSession(selectedSessionId)
  
  // Build session options
  const sessionOptions = useMemo(() => {
    const options: { id: string; label: string; date: string; score: number }[] = []
    
    if (visionAnalysisResult?.success && uploadedImageBase64) {
      options.push({
        id: 'current',
        label: 'Current Session (Live)',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        score: visionAnalysisResult.overall_score || 70
      })
    }
    
    sessions.forEach(session => {
      options.push({
        id: session.id,
        label: session.displayDate,
        date: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        score: session.analysisData?.overallScore || 0
      })
    })
    
    return options
  }, [visionAnalysisResult, uploadedImageBase64, sessions])
  
  // Get user metrics for Phase 6 comparison
  const userMetricsForPhase6 = useMemo(() => {
    if (selectedSessionId === 'current' && visionAnalysisResult?.angles) {
      const angles = visionAnalysisResult.angles
      return {
        elbowAngle: angles.right_elbow_angle || angles.left_elbow_angle,
        kneeAngle: angles.right_knee_angle || angles.left_knee_angle,
        releaseAngle: angles.release_angle,
        shoulderTilt: angles.shoulder_tilt,
        hipTilt: angles.hip_tilt,
        followThroughAngle: angles.follow_through_angle
      }
    }
    
    const session = sessions.find(s => s.id === selectedSessionId)
    if (session?.analysisData?.angles) {
      const angles = session.analysisData.angles
      return {
        elbowAngle: angles.right_elbow_angle || angles.left_elbow_angle,
        kneeAngle: angles.right_knee_angle || angles.left_knee_angle,
        releaseAngle: angles.release_angle,
        shoulderTilt: angles.shoulder_tilt,
        hipTilt: angles.hip_tilt,
        followThroughAngle: angles.follow_through_angle
      }
    }
    
    return {
      elbowAngle: currentAnalysisData.measurements.elbowAngle,
      kneeAngle: currentAnalysisData.measurements.kneeAngle,
      shoulderTilt: currentAnalysisData.measurements.shoulderAngle ? 180 - currentAnalysisData.measurements.shoulderAngle : undefined
    }
  }, [selectedSessionId, visionAnalysisResult, sessions, currentAnalysisData])
  
  // Get user profile for Phase 6
  const userProfileForPhase6 = useMemo(() => ({
    name: playerProfile?.name || 'Player',
    age: playerProfile?.age || 25,
    height: playerProfile?.height || "6'0",
    weight: playerProfile?.weight,
    wingspan: playerProfile?.wingspan,
    skillLevel: (playerProfile?.skillLevel as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ELITE") || "INTERMEDIATE",
    athleticAbility: playerProfile?.athleticAbility
  }), [playerProfile])
  
  return (
    <div className="space-y-6">
      {/* Session Filter & View Mode Toggle */}
      <div className="bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] rounded-xl p-4 border border-[#3a3a3a]">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-[#FFD700]" />
            <span className="text-[#E5E5E5] font-semibold">Select Session:</span>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-4 py-2 text-[#E5E5E5] focus:border-[#FFD700] focus:outline-none min-w-[200px]"
            >
              {sessionOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.label} - Score: {option.score}%
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* View Mode Toggle - Phase 6 & 7 Features */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#3a3a3a] flex-wrap">
          <span className="text-[#888] text-sm mr-2">Comparison Mode:</span>
          <button
            onClick={() => setViewMode('personalized')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'personalized' 
                ? 'bg-[#FFD700] text-[#1a1a1a]' 
                : 'bg-[#2a2a2a] text-[#888] hover:text-[#E5E5E5]'
            }`}
          >
            <Users className="w-4 h-4 inline-block mr-2" />
            Body-Type Match
          </button>
          <button
            onClick={() => setViewMode('elite')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'elite' 
                ? 'bg-[#FFD700] text-[#1a1a1a]' 
                : 'bg-[#2a2a2a] text-[#888] hover:text-[#E5E5E5]'
            }`}
          >
            <Trophy className="w-4 h-4 inline-block mr-2" />
            Elite Shooters
          </button>
          <button
            onClick={() => setViewMode('photo')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'photo' 
                ? 'bg-[#FFD700] text-[#1a1a1a]' 
                : 'bg-[#2a2a2a] text-[#888] hover:text-[#E5E5E5]'
            }`}
          >
            <ImageIcon className="w-4 h-4 inline-block mr-2" />
            Photo Compare
          </button>
        </div>
        
        {sessionOptions.length === 0 && (
          <p className="text-[#888] text-sm mt-2">No sessions available. Upload an image to create your first session.</p>
        )}
      </div>
      
      {/* Phase 6: Personalized Body-Type Comparison */}
      {viewMode === 'personalized' && (
        <Phase6ComparisonPanel
          userProfile={userProfileForPhase6}
          userMetrics={userMetricsForPhase6}
          overallScore={currentAnalysisData.overallScore}
        />
      )}
      
      {/* Original Elite Shooter Comparison */}
      {viewMode === 'elite' && (
        <ComparisonSection analysisData={currentAnalysisData} />
      )}
      
      {/* Phase 7: Photo Comparison Slider */}
      {viewMode === 'photo' && (
        <PhotoComparisonSection />
      )}
      
      {/* Phase 12: Leaderboard */}
      <div className="mt-8">
        <Leaderboard />
      </div>
    </div>
  )
}

// Training Plan with Session Filter Dropdown
function TrainingWithSessions() {
  const { visionAnalysisResult, uploadedImageBase64 } = useAnalysisStore()
  const [sessions, setSessions] = useState<AnalysisSession[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>('current')
  
  useEffect(() => {
    const loadedSessions = getAllSessions()
    setSessions(loadedSessions)
  }, [])
  
  // Get flaws for selected session to generate training plan
  const getFlawsForSession = useCallback((sessionId: string) => {
    if (sessionId === 'current' && visionAnalysisResult?.success && visionAnalysisResult.angles) {
      return detectFlawsFromAngles(visionAnalysisResult.angles)
    }
    
    const session = sessions.find(s => s.id === sessionId)
    if (session?.analysisData?.angles) {
      return detectFlawsFromAngles(session.analysisData.angles)
    }
    
    return []
  }, [visionAnalysisResult, sessions])
  
  const currentFlaws = getFlawsForSession(selectedSessionId)
  
  // Build session options
  const sessionOptions = useMemo(() => {
    const options: { id: string; label: string; date: string; flawCount: number }[] = []
    
    if (visionAnalysisResult?.success && uploadedImageBase64) {
      const flaws = visionAnalysisResult.angles ? detectFlawsFromAngles(visionAnalysisResult.angles) : []
      options.push({
        id: 'current',
        label: 'Current Session (Live)',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        flawCount: flaws.length
      })
    }
    
    sessions.forEach(session => {
      const flaws = session.analysisData?.angles ? detectFlawsFromAngles(session.analysisData.angles) : []
      options.push({
        id: session.id,
        label: session.displayDate,
        date: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        flawCount: flaws.length
      })
    })
    
    return options
  }, [visionAnalysisResult, uploadedImageBase64, sessions])
  
  // Generate training plan based on flaws
  const weeklyPlan = useMemo(() => {
    const elbowFlaws = currentFlaws.filter(f => f.id.includes('ELBOW'))
    const kneeFlaws = currentFlaws.filter(f => f.id.includes('KNEE'))
    const balanceFlaws = currentFlaws.filter(f => f.id.includes('SHOULDER') || f.id.includes('HIP') || f.id.includes('BALANCE'))
    
    const mondayExercises: { name: string; reps: string; time: string }[] = []
    if (elbowFlaws.length > 0) {
      mondayExercises.push({ name: "Wall elbow alignment drill", reps: "3 sets × 20", time: "12 min" })
      mondayExercises.push({ name: "One-hand form shots (elbow focus)", reps: "50 reps", time: "15 min" })
    } else {
      mondayExercises.push({ name: "Wall shooting", reps: "50 reps", time: "15 min" })
      mondayExercises.push({ name: "One-hand form shots", reps: "30 reps", time: "10 min" })
    }
    if (balanceFlaws.length > 0) {
      mondayExercises.push({ name: "Balance board shooting", reps: "30 reps", time: "10 min" })
    } else {
      mondayExercises.push({ name: "Mirror practice", reps: "20 reps", time: "10 min" })
    }
    mondayExercises.push({ name: "Cool down stretching", reps: "—", time: "10 min" })
    
    const wednesdayExercises: { name: string; reps: string; time: string }[] = []
    if (kneeFlaws.length > 0) {
      wednesdayExercises.push({ name: "Squat-to-shot drill", reps: "3 sets × 15", time: "12 min" })
      wednesdayExercises.push({ name: "Knee bend awareness shots", reps: "40 reps", time: "15 min" })
    } else {
      wednesdayExercises.push({ name: "Jump shots from free throw", reps: "40 reps", time: "15 min" })
      wednesdayExercises.push({ name: "Catch-and-shoot", reps: "30 reps", time: "12 min" })
    }
    wednesdayExercises.push({ name: "Leg drive drills", reps: "3 sets × 10", time: "10 min" })
    wednesdayExercises.push({ name: "Core exercises", reps: "3 sets × 15", time: "13 min" })
    
    const fridayExercises: { name: string; reps: string; time: string }[] = []
    if (currentFlaws.length > 0 && currentFlaws[0].drills && currentFlaws[0].drills[0]) {
      fridayExercises.push({ name: currentFlaws[0].drills[0], reps: "30 reps", time: "12 min" })
    }
    fridayExercises.push({ name: "Off-dribble shots", reps: "30 reps", time: "15 min" })
    fridayExercises.push({ name: "Contested shots", reps: "20 reps", time: "12 min" })
    fridayExercises.push({ name: "Free throws (pressure)", reps: "20 reps", time: "13 min" })
    
    return [
      {
        day: "Monday",
        dayShort: "MON",
        focus: elbowFlaws.length > 0 ? "Elbow Correction" : "Form Fundamentals",
        iconType: "target" as const,
        color: { bg: "from-blue-500/20 to-blue-600/10", border: "border-blue-500/40", text: "text-blue-400", accent: "#3b82f6" },
        duration: "45 min",
        intensity: "Low",
        exercises: mondayExercises
      },
      {
        day: "Wednesday",
        dayShort: "WED",
        focus: kneeFlaws.length > 0 ? "Knee & Power" : "Power Generation",
        iconType: "dumbbell" as const,
        color: { bg: "from-yellow-500/20 to-yellow-600/10", border: "border-yellow-500/40", text: "text-yellow-400", accent: "#eab308" },
        duration: "50 min",
        intensity: "Medium",
        exercises: wednesdayExercises
      },
      {
        day: "Friday",
        dayShort: "FRI",
        focus: currentFlaws.length > 0 ? "Flaw Integration" : "Game Situations",
        iconType: "trophy" as const,
        color: { bg: "from-green-500/20 to-green-600/10", border: "border-green-500/40", text: "text-green-400", accent: "#22c55e" },
        duration: "55 min",
        intensity: "High",
        exercises: fridayExercises
      },
    ]
  }, [currentFlaws])

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
      {/* Session Filter Dropdown */}
      <div className="bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] rounded-xl p-4 border border-[#3a3a3a]">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-[#FFD700]" />
            <span className="text-[#E5E5E5] font-semibold">Training Plan for Session:</span>
          </div>
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-4 py-2 text-[#E5E5E5] focus:border-[#FFD700] focus:outline-none min-w-[250px]"
          >
            {sessionOptions.map(option => (
              <option key={option.id} value={option.id}>
                {option.label} - {option.flawCount} flaw{option.flawCount !== 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </div>
        {sessionOptions.length === 0 && (
          <p className="text-[#888] text-sm mt-2">No sessions available. Upload an image to create your first session.</p>
        )}
      </div>
      
      {/* Training Plan Content */}
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
                <p className="text-[#888] text-sm">Personalized for {currentFlaws.length} detected flaw{currentFlaws.length !== 1 ? 's' : ''}</p>
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
      
      {/* PHASE 8: Personalized Drill Recommendations */}
      <PersonalizedDrillRecommendations flaws={currentFlaws} />

      {/* PHASE 12: Weekly Challenges */}
      <WeeklyChallenges />
    </div>
  )
}

// ============================================
// PHASE 8: PERSONALIZED DRILL RECOMMENDATIONS
// Level-appropriate drill cards with expandable details
// ============================================

interface PersonalizedDrillRecommendationsProps {
  flaws: ShootingFlaw[]
}

function PersonalizedDrillRecommendations({ flaws }: PersonalizedDrillRecommendationsProps) {
  const profileStore = useProfileStore()
  const [expandedDrills, setExpandedDrills] = useState<string[]>([])
  const [completedDrills, setCompletedDrills] = useState<string[]>([])
  const [addedToPlan, setAddedToPlan] = useState<string[]>([])
  
  // Determine user's skill level
  const userLevel: DrillSkillLevel = useMemo(() => {
    if (profileStore?.age) {
      return mapAgeToLevel(profileStore.age)
    }
    if (profileStore?.experienceLevel) {
      return mapSkillLevelToLevel(profileStore.experienceLevel)
    }
    return 'HIGH_SCHOOL' // Default
  }, [profileStore])
  
  // Get weak areas from flaws
  const weakAreas = useMemo(() => {
    return flaws.map(flaw => mapFlawToFocusArea(flaw.id))
  }, [flaws])
  
  // Get recommended drills
  const recommendedDrills = useMemo(() => {
    return getRecommendedDrills(userLevel, weakAreas, 5)
  }, [userLevel, weakAreas])
  
  const toggleDrillExpanded = (drillId: string) => {
    setExpandedDrills(prev => 
      prev.includes(drillId) 
        ? prev.filter(id => id !== drillId)
        : [...prev, drillId]
    )
  }
  
  const toggleDrillComplete = (drillId: string) => {
    setCompletedDrills(prev =>
      prev.includes(drillId)
        ? prev.filter(id => id !== drillId)
        : [...prev, drillId]
    )
  }
  
  const addToPracticePlan = (drillId: string) => {
    setAddedToPlan(prev => [...prev, drillId])
  }
  
  const getDifficultyStars = (difficulty: number) => {
    return '⭐'.repeat(difficulty) + '☆'.repeat(5 - difficulty)
  }
  
  const getLevelBadgeColor = (level: DrillSkillLevel) => {
    switch (level) {
      case 'ELEMENTARY': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'MIDDLE_SCHOOL': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'HIGH_SCHOOL': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'COLLEGE': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'PROFESSIONAL': return 'bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/30'
      default: return 'bg-[#888]/20 text-[#888] border-[#888]/30'
    }
  }
  
  const getLevelLabel = (level: DrillSkillLevel) => {
    switch (level) {
      case 'ELEMENTARY': return 'Elementary'
      case 'MIDDLE_SCHOOL': return 'Middle School'
      case 'HIGH_SCHOOL': return 'High School'
      case 'COLLEGE': return 'College'
      case 'PROFESSIONAL': return 'Professional'
      default: return level
    }
  }
  
  return (
    <div className="bg-[#2C2C2C] rounded-xl p-6 border border-[#3a3a3a]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center">
            <Target className="w-6 h-6 text-[#1a1a1a]" />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#FFD700] uppercase tracking-wider">Personalized Drills</h3>
            <p className="text-[#888] text-sm">Level: <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getLevelBadgeColor(userLevel)}`}>{getLevelLabel(userLevel)}</span></p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[#888] text-sm">Completed</p>
          <p className="text-2xl font-black text-green-400">{completedDrills.length}/{recommendedDrills.length}</p>
        </div>
      </div>
      
      {/* Drill Cards */}
      <div className="space-y-4">
        {recommendedDrills.map((drill) => {
          const isExpanded = expandedDrills.includes(drill.id)
          const isCompleted = completedDrills.includes(drill.id)
          const isAddedToPlan = addedToPlan.includes(drill.id)
          
          return (
            <div 
              key={drill.id}
              className={`rounded-xl border transition-all duration-300 ${
                isCompleted 
                  ? 'bg-green-900/20 border-green-500/40' 
                  : 'bg-[#1a1a1a] border-[#3a3a3a] hover:border-[#4a4a4a]'
              }`}
            >
              {/* Drill Header */}
              <div 
                className="p-4 cursor-pointer"
                onClick={() => toggleDrillExpanded(drill.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{drill.icon}</span>
                    <div>
                      <h4 className={`font-bold ${isCompleted ? 'text-green-400' : 'text-[#E5E5E5]'}`}>
                        {drill.title}
                        {isCompleted && <Check className="w-4 h-4 inline-block ml-2 text-green-400" />}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-[#888]">{getDifficultyStars(drill.difficulty)}</span>
                        <span className="text-xs text-[#888]">⏱️ {drill.duration} min</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getLevelBadgeColor(drill.level)}`}>
                          {getLevelLabel(drill.level)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-[#888] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </div>
              
              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-[#3a3a3a]">
                  <div className="pt-4 space-y-4">
                    {/* Description */}
                    <div>
                      <p className="text-[#E5E5E5] text-sm">{drill.description}</p>
                    </div>
                    
                    {/* Why It Matters */}
                    <div className="bg-[#2a2a2a] rounded-lg p-3 border border-[#3a3a3a]">
                      <p className="text-xs font-bold text-[#FFD700] uppercase tracking-wider mb-1">Why It Matters</p>
                      <p className="text-[#E5E5E5] text-sm">{drill.whyItMatters}</p>
                    </div>
                    
                    {/* Step-by-Step Instructions */}
                    <div>
                      <p className="text-xs font-bold text-[#888] uppercase tracking-wider mb-2">Step-by-Step Instructions</p>
                      <ol className="space-y-2">
                        {drill.steps.map((step, index) => (
                          <li key={index} className="flex items-start gap-3 text-sm text-[#E5E5E5]">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FFD700]/20 text-[#FFD700] flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                    
                    {/* Expected Outcomes */}
                    <div>
                      <p className="text-xs font-bold text-[#888] uppercase tracking-wider mb-2">Expected Outcomes</p>
                      <div className="flex flex-wrap gap-2">
                        {drill.expectedOutcomes.map((outcome, index) => (
                          <span key={index} className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs border border-green-500/30">
                            ✓ {outcome}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Technical Note (if available) */}
                    {drill.technicalNote && (
                      <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/30">
                        <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Technical Note</p>
                        <p className="text-[#E5E5E5] text-sm">{drill.technicalNote}</p>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleDrillComplete(drill.id); }}
                        className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : 'bg-[#2a2a2a] text-[#E5E5E5] hover:bg-[#3a3a3a] border border-[#3a3a3a]'
                        }`}
                      >
                        {isCompleted ? <Check className="w-4 h-4" /> : <CircleDot className="w-4 h-4" />}
                        {isCompleted ? 'Completed!' : 'Mark Complete'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); addToPracticePlan(drill.id); }}
                        disabled={isAddedToPlan}
                        className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                          isAddedToPlan
                            ? 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30'
                            : 'bg-[#FFD700] text-[#1a1a1a] hover:bg-[#e6c200]'
                        }`}
                      >
                        {isAddedToPlan ? <Check className="w-4 h-4" /> : <ClipboardList className="w-4 h-4" />}
                        {isAddedToPlan ? 'Added to Plan' : 'Add to Practice Plan'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* View All Drills Link */}
      <div className="mt-6 text-center">
        <button className="text-[#FFD700] hover:text-[#e6c200] text-sm font-medium">
          View All {ALL_DRILLS.filter(d => d.level === userLevel).length} Drills for {getLevelLabel(userLevel)} Level →
        </button>
      </div>
    </div>
  )
}

// ============================================
// PHASE 8: WEEKLY PERFORMANCE SUMMARY CARD
// ============================================

interface WeeklyPerformanceSummaryCardProps {
  sessions: Array<{
    id: string
    date: Date
    score: number
    elbowAngle: number
    kneeAngle: number
    releaseAngle: number
    shooterLevel: string
    isLive: boolean
  }>
}

function WeeklyPerformanceSummaryCard({ sessions }: WeeklyPerformanceSummaryCardProps) {
  const profileStore = useProfileStore()
  
  // Get user level
  const userLevel: DrillSkillLevel = useMemo(() => {
    if (profileStore?.age) return mapAgeToLevel(profileStore.age)
    if (profileStore?.experienceLevel) return mapSkillLevelToLevel(profileStore.experienceLevel)
    return 'HIGH_SCHOOL'
  }, [profileStore])
  
  // Calculate weekly stats
  const weeklyStats = useMemo(() => {
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    
    const thisWeekSessions = sessions.filter(s => s.date >= oneWeekAgo)
    const lastWeekSessions = sessions.filter(s => s.date >= twoWeeksAgo && s.date < oneWeekAgo)
    
    const thisWeekAvg = thisWeekSessions.length > 0
      ? Math.round(thisWeekSessions.reduce((sum, s) => sum + s.score, 0) / thisWeekSessions.length)
      : 0
    const lastWeekAvg = lastWeekSessions.length > 0
      ? Math.round(lastWeekSessions.reduce((sum, s) => sum + s.score, 0) / lastWeekSessions.length)
      : thisWeekAvg
    
    const scoreChange = thisWeekAvg - lastWeekAvg
    
    // Identify improvements and areas needing work
    const improvements: string[] = []
    const needsWork: string[] = []
    
    if (thisWeekSessions.length > 0) {
      const avgElbow = thisWeekSessions.reduce((sum, s) => sum + s.elbowAngle, 0) / thisWeekSessions.length
      const avgKnee = thisWeekSessions.reduce((sum, s) => sum + s.kneeAngle, 0) / thisWeekSessions.length
      
      if (avgElbow >= 85 && avgElbow <= 95) improvements.push('Elbow alignment')
      else needsWork.push('Elbow positioning')
      
      if (avgKnee >= 135 && avgKnee <= 150) improvements.push('Knee bend')
      else needsWork.push('Knee bend depth')
      
      if (scoreChange > 0) improvements.push('Overall consistency')
      if (thisWeekSessions.length >= 3) improvements.push('Practice frequency')
    }
    
    // Calculate streak
    let streakDays = 0
    const sortedSessions = [...sessions].sort((a, b) => b.date.getTime() - a.date.getTime())
    if (sortedSessions.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
        const hasSession = sortedSessions.some(s => {
          const sessionDate = new Date(s.date)
          sessionDate.setHours(0, 0, 0, 0)
          return sessionDate.getTime() === checkDate.getTime()
        })
        if (hasSession) streakDays++
        else if (i > 0) break
      }
    }
    
    return {
      totalAnalyses: thisWeekSessions.length,
      averageScore: thisWeekAvg,
      scoreChange,
      improvements,
      needsWork,
      streakDays
    }
  }, [sessions])
  
  // Generate level-appropriate messages
  const messages = useMemo(() => {
    const { averageScore, scoreChange, improvements, needsWork, streakDays } = weeklyStats
    
    let whatsWorking = ''
    let focusArea = ''
    let nextWeekGoal = ''
    
    switch (userLevel) {
      case 'ELEMENTARY':
        whatsWorking = improvements.length > 0
          ? `Great job! You're getting better at ${improvements[0]}! Keep it up! 🌟`
          : `You're practicing hard! That's what matters most! 🎉`
        focusArea = needsWork.length > 0
          ? `Let's work on making your ${needsWork[0]} even better this week!`
          : `Keep practicing your shooting form - you're doing great!`
        nextWeekGoal = `Try to practice ${weeklyStats.totalAnalyses + 1} times next week! You can do it! 💪`
        break
        
      case 'MIDDLE_SCHOOL':
        whatsWorking = improvements.length > 0
          ? `Your ${improvements[0]} has been improving. This shows your hard work is paying off.`
          : `You're building good habits with consistent practice.`
        focusArea = needsWork.length > 0
          ? `Focus on your ${needsWork[0]} this week. Targeted drills will help.`
          : `Maintain your current form while building consistency.`
        nextWeekGoal = `Aim for ${weeklyStats.totalAnalyses + 2} practice sessions and focus on consistency.`
        break
        
      case 'HIGH_SCHOOL':
        whatsWorking = improvements.length > 0
          ? `Your ${improvements[0]} consistency has improved ${Math.abs(scoreChange)}% this week. This is translating to better performance.`
          : `Your form is maintaining consistency across sessions.`
        focusArea = needsWork.length > 0
          ? `Your ${needsWork[0]} is causing accuracy variance. Address this with targeted drills.`
          : `Focus on maintaining form under fatigue conditions.`
        nextWeekGoal = `Target ${Math.round(averageScore * 1.05)}% average score with 15+ practice sessions.`
        break
        
      case 'COLLEGE':
        whatsWorking = improvements.length > 0
          ? `Your ${improvements[0]} metrics are approaching NCAA standards. Continue this trajectory.`
          : `Your biomechanical consistency is within acceptable ranges.`
        focusArea = needsWork.length > 0
          ? `${needsWork[0]} variance is affecting your efficiency. Implement the micro-adjustment protocol.`
          : `Focus on shot selection and game-situation performance.`
        nextWeekGoal = `Achieve ${Math.round(averageScore + 3)}% with NCAA-standard consistency.`
        break
        
      case 'PROFESSIONAL':
        whatsWorking = improvements.length > 0
          ? `${improvements[0]} efficiency has improved. Defender-proximity variance decreased.`
          : `Form consistency maintained across fatigue conditions.`
        focusArea = needsWork.length > 0
          ? `${needsWork[0]} shows degradation in 4th quarter simulations. Implement fatigue-specific mechanics.`
          : `Focus on micro-adjustments for situational shooting.`
        nextWeekGoal = `Reduce form degradation to <5% and maintain ${averageScore}%+ efficiency.`
        break
    }
    
    return { whatsWorking, focusArea, nextWeekGoal }
  }, [weeklyStats, userLevel])
  
  if (sessions.length === 0) {
    return null
  }
  
  return (
    <div className="bg-gradient-to-br from-[#2C2C2C] via-[#252525] to-[#2C2C2C] rounded-xl p-6 border border-[#3a3a3a]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#E5E5E5] uppercase tracking-wider">Your Week in Review</h3>
            <p className="text-[#888] text-sm">
              {new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
        {weeklyStats.streakDays > 0 && (
          <div className="flex items-center gap-2 bg-orange-500/20 px-4 py-2 rounded-full border border-orange-500/30">
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="text-orange-400 font-bold">{weeklyStats.streakDays} Day Streak!</span>
          </div>
        )}
      </div>
      
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#1a1a1a] rounded-lg p-4 text-center">
          <p className="text-3xl font-black text-[#FFD700]">{weeklyStats.totalAnalyses}</p>
          <p className="text-[#888] text-xs uppercase tracking-wider">Total Analyses</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-lg p-4 text-center">
          <p className="text-3xl font-black text-blue-400">{weeklyStats.averageScore}%</p>
          <p className="text-[#888] text-xs uppercase tracking-wider">Average Score</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-lg p-4 text-center">
          <p className={`text-3xl font-black ${weeklyStats.scoreChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {weeklyStats.scoreChange >= 0 ? '↑' : '↓'} {Math.abs(weeklyStats.scoreChange)}%
          </p>
          <p className="text-[#888] text-xs uppercase tracking-wider">From Last Week</p>
        </div>
      </div>
      
      {/* Improvements & Needs Work */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* What's Working */}
        <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
          <h4 className="text-green-400 font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
            <Check className="w-4 h-4" /> Key Improvements
          </h4>
          {weeklyStats.improvements.length > 0 ? (
            <ul className="space-y-2">
              {weeklyStats.improvements.map((item, i) => (
                <li key={i} className="text-[#E5E5E5] text-sm flex items-center gap-2">
                  <span className="text-green-400">✓</span> {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[#888] text-sm">Keep practicing to see improvements!</p>
          )}
        </div>
        
        {/* Needs Work */}
        <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-500/30">
          <h4 className="text-orange-400 font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Focus Areas
          </h4>
          {weeklyStats.needsWork.length > 0 ? (
            <ul className="space-y-2">
              {weeklyStats.needsWork.map((item, i) => (
                <li key={i} className="text-[#E5E5E5] text-sm flex items-center gap-2">
                  <span className="text-orange-400">⚠</span> {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[#888] text-sm">Great work! Keep maintaining your form.</p>
          )}
        </div>
      </div>
      
      {/* Coaching Insights */}
      <div className="space-y-4">
        {/* What's Working Message */}
        <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
          <h4 className="text-[#FFD700] font-bold text-sm uppercase tracking-wider mb-2">What&apos;s Working</h4>
          <p className="text-[#E5E5E5] text-sm">{messages.whatsWorking}</p>
        </div>
        
        {/* Focus Area */}
        <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
          <h4 className="text-purple-400 font-bold text-sm uppercase tracking-wider mb-2">Focus Area</h4>
          <p className="text-[#E5E5E5] text-sm">{messages.focusArea}</p>
        </div>
        
        {/* Next Week Goal */}
        <div className="bg-gradient-to-r from-[#FFD700]/20 to-[#FFD700]/5 rounded-lg p-4 border border-[#FFD700]/30">
          <h4 className="text-[#FFD700] font-bold text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
            <Target className="w-4 h-4" /> Next Week&apos;s Goal
          </h4>
          <p className="text-[#E5E5E5] text-sm">{messages.nextWeekGoal}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================
// PHASE 7: HISTORICAL DATA SECTION
// ============================================

function HistoricalDataSection() {
  const { visionAnalysisResult } = useAnalysisStore()
  const [sessions, setSessions] = useState<AnalysisSession[]>([])
  const [selectedMetric, setSelectedMetric] = useState<'score' | 'elbow' | 'knee' | 'release'>('score')
  // Phase 9: Date range selector
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '90days' | '6months' | '1year' | 'all'>('90days')
  // Phase 9: View mode toggle
  const [viewMode, setViewMode] = useState<'overview' | 'categories' | 'issues' | 'milestones'>('overview')
  
  useEffect(() => {
    const loadedSessions = getAllSessions()
    setSessions(loadedSessions)
  }, [])
  
  // Combine current session with historical sessions
  const allSessionsData = useMemo(() => {
    const data: Array<{
      id: string
      date: Date
      displayDate: string
      score: number
      elbowAngle: number
      kneeAngle: number
      releaseAngle: number
      shooterLevel: string
      isLive: boolean
    }> = []
    
    // Add current session if available
    if (visionAnalysisResult?.success) {
      const angles = visionAnalysisResult.angles || {}
      const score = visionAnalysisResult.overall_score || 70
      data.push({
        id: 'current',
        date: new Date(),
        displayDate: 'Today',
        score,
        elbowAngle: angles.right_elbow_angle || angles.left_elbow_angle || 88,
        kneeAngle: angles.right_knee_angle || angles.left_knee_angle || 145,
        releaseAngle: angles.release_angle || 48,
        shooterLevel: getShooterLevel(score).name,
        isLive: true
      })
    }
    
    // Add historical sessions
    sessions.forEach(session => {
      const angles = session.analysisData?.angles || {}
      const score = session.analysisData?.overallScore || 70
      data.push({
        id: session.id,
        date: new Date(session.date),
        displayDate: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score,
        elbowAngle: angles.right_elbow_angle || angles.left_elbow_angle || 88,
        kneeAngle: angles.right_knee_angle || angles.left_knee_angle || 145,
        releaseAngle: angles.release_angle || 48,
        shooterLevel: getShooterLevel(score).name,
        isLive: false
      })
    })
    
    // Sort by date (oldest first for timeline)
    return data.sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [visionAnalysisResult, sessions])
  
  // Calculate progress stats
  const progressStats = useMemo(() => {
    if (allSessionsData.length < 2) {
      return { scoreChange: 0, sessionsCount: allSessionsData.length, avgScore: allSessionsData[0]?.score || 0, trend: 'stable' as const }
    }
    
    const first = allSessionsData[0]
    const last = allSessionsData[allSessionsData.length - 1]
    const scoreChange = last.score - first.score
    const avgScore = allSessionsData.reduce((sum, s) => sum + s.score, 0) / allSessionsData.length
    const trend = scoreChange > 5 ? 'improving' as const : scoreChange < -5 ? 'declining' as const : 'stable' as const
    
    return { scoreChange, sessionsCount: allSessionsData.length, avgScore: Math.round(avgScore), trend }
  }, [allSessionsData])
  
  // Get metric value based on selection
  const getMetricValue = (session: typeof allSessionsData[0]) => {
    switch (selectedMetric) {
      case 'score': return session.score
      case 'elbow': return session.elbowAngle
      case 'knee': return session.kneeAngle
      case 'release': return session.releaseAngle
      default: return session.score
    }
  }
  
  const getMetricLabel = () => {
    switch (selectedMetric) {
      case 'score': return 'Overall Score'
      case 'elbow': return 'Elbow Angle'
      case 'knee': return 'Knee Angle'
      case 'release': return 'Release Angle'
      default: return 'Overall Score'
    }
  }
  
  const getMetricUnit = () => {
    return selectedMetric === 'score' ? '%' : '°'
  }
  
  // Calculate max value for chart scaling
  const maxValue = useMemo(() => {
    if (selectedMetric === 'score') return 100
    const values = allSessionsData.map(s => getMetricValue(s))
    return Math.max(...values, 100) + 10
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSessionsData, selectedMetric])
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] rounded-xl p-6 border border-[#3a3a3a]">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-purple-400 uppercase tracking-wider">Historical Data</h2>
              <p className="text-[#888] text-sm">Track your shooting progress over time</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#888] text-sm">View:</span>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as typeof selectedMetric)}
              className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-4 py-2 text-[#E5E5E5] focus:border-purple-500 focus:outline-none"
            >
              <option value="score">Overall Score</option>
              <option value="elbow">Elbow Angle</option>
              <option value="knee">Knee Angle</option>
              <option value="release">Release Angle</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Progress Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#2C2C2C] rounded-xl p-4 border border-[#3a3a3a]">
          <p className="text-[#888] text-xs uppercase tracking-wider mb-1">Total Sessions</p>
          <p className="text-3xl font-black text-[#FFD700]">{progressStats.sessionsCount}</p>
        </div>
        <div className="bg-[#2C2C2C] rounded-xl p-4 border border-[#3a3a3a]">
          <p className="text-[#888] text-xs uppercase tracking-wider mb-1">Average Score</p>
          <p className="text-3xl font-black text-blue-400">{progressStats.avgScore}%</p>
        </div>
        <div className="bg-[#2C2C2C] rounded-xl p-4 border border-[#3a3a3a]">
          <p className="text-[#888] text-xs uppercase tracking-wider mb-1">Progress</p>
          <p className={`text-3xl font-black ${progressStats.scoreChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {progressStats.scoreChange >= 0 ? '+' : ''}{progressStats.scoreChange}%
          </p>
        </div>
        <div className="bg-[#2C2C2C] rounded-xl p-4 border border-[#3a3a3a]">
          <p className="text-[#888] text-xs uppercase tracking-wider mb-1">Trend</p>
          <p className={`text-xl font-black uppercase ${
            progressStats.trend === 'improving' ? 'text-green-400' : 
            progressStats.trend === 'declining' ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {progressStats.trend === 'improving' ? '📈 Improving' : 
             progressStats.trend === 'declining' ? '📉 Declining' : '➡️ Stable'}
          </p>
        </div>
      </div>
      
      {/* PHASE 8: Weekly Performance Summary */}
      <WeeklyPerformanceSummaryCard sessions={allSessionsData} />
      
      {/* PHASE 9: View Mode Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'categories', label: 'Category Breakdown', icon: Target },
          { id: 'issues', label: 'Issue Analysis', icon: AlertTriangle },
          { id: 'milestones', label: 'Achievements', icon: Trophy }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id as typeof viewMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === tab.id
                ? 'bg-purple-500 text-white'
                : 'bg-[#2C2C2C] text-[#888] hover:text-[#E5E5E5] border border-[#3a3a3a]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* PHASE 9: Category Comparison View */}
      {viewMode === 'categories' && (
        <Phase9CategoryComparison />
      )}
      
      {/* PHASE 9: Issue Heat Map View */}
      {viewMode === 'issues' && (
        <Phase9IssueHeatmap />
      )}
      
      {/* PHASE 9: Milestones View */}
      {viewMode === 'milestones' && (
        <Phase9MilestoneBadges />
      )}
      
      {/* Timeline Chart - Only show in overview mode */}
      {viewMode === 'overview' && (
        <>
      {/* Timeline Chart */}
      <div className="bg-[#2C2C2C] rounded-xl p-6 border border-[#3a3a3a]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-[#E5E5E5]">{getMetricLabel()} Timeline</h3>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-[#888]">{getMetricLabel()}</span>
            </span>
          </div>
        </div>
        
        {allSessionsData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#888]">No session data available. Upload images to start tracking your progress!</p>
          </div>
        ) : (
          <>
            {/* Chart Area */}
            <div className="relative h-64 mb-4">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-right pr-2">
                <span className="text-xs text-[#888]">{maxValue}{getMetricUnit()}</span>
                <span className="text-xs text-[#888]">{Math.round(maxValue * 0.75)}{getMetricUnit()}</span>
                <span className="text-xs text-[#888]">{Math.round(maxValue * 0.5)}{getMetricUnit()}</span>
                <span className="text-xs text-[#888]">{Math.round(maxValue * 0.25)}{getMetricUnit()}</span>
                <span className="text-xs text-[#888]">0{getMetricUnit()}</span>
              </div>
              
              {/* Chart grid and bars */}
              <div className="absolute left-14 right-0 top-0 bottom-8">
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {[0, 1, 2, 3, 4].map(i => (
                    <div key={i} className="border-t border-[#3a3a3a]"></div>
                  ))}
                </div>
                
                {/* Bars */}
                <div className="relative h-full flex items-end justify-around gap-2 px-2">
                  {allSessionsData.map((session) => {
                    const value = getMetricValue(session)
                    const heightPercent = (value / maxValue) * 100
                    return (
                      <div key={session.id} className="flex-1 flex flex-col items-center max-w-16 group">
                        {/* Value label on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-1 text-xs font-bold text-purple-400">
                          {value}{getMetricUnit()}
                        </div>
                        {/* Bar */}
                        <div 
                          className={`w-full rounded-t-lg transition-all duration-300 group-hover:scale-105 ${
                            session.isLive 
                              ? 'bg-gradient-to-t from-[#FFD700] to-[#FFA500]' 
                              : 'bg-gradient-to-t from-purple-600 to-purple-400'
                          }`}
                          style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            
            {/* X-axis labels (dates) */}
            <div className="flex justify-around pl-14 pr-2">
              {allSessionsData.map((session) => (
                <div key={session.id} className="flex-1 max-w-16 text-center">
                  <p className={`text-xs ${session.isLive ? 'text-[#FFD700] font-bold' : 'text-[#888]'}`}>
                    {session.displayDate}
                  </p>
                  {session.isLive && (
                    <span className="text-[10px] text-green-400">LIVE</span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* Session Timeline */}
      <div className="bg-[#2C2C2C] rounded-xl p-6 border border-[#3a3a3a]">
        <h3 className="text-lg font-bold text-[#E5E5E5] mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-400" />
          Session Timeline
        </h3>
        
        {allSessionsData.length === 0 ? (
          <p className="text-[#888] text-center py-8">No sessions recorded yet.</p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-purple-400 to-purple-600"></div>
            
            {/* Timeline items */}
            <div className="space-y-6">
              {[...allSessionsData].reverse().map((session) => (
                <div key={session.id} className="relative flex items-start gap-4 pl-14">
                  {/* Timeline dot */}
                  <div className={`absolute left-4 w-5 h-5 rounded-full border-4 ${
                    session.isLive 
                      ? 'bg-[#FFD700] border-[#FFD700]/30' 
                      : 'bg-purple-500 border-purple-500/30'
                  }`}>
                    {session.isLive && (
                      <div className="absolute inset-0 rounded-full bg-[#FFD700] animate-ping opacity-50"></div>
                    )}
                  </div>
                  
                  {/* Session card */}
                  <div className={`flex-1 bg-[#1a1a1a] rounded-xl p-4 border ${
                    session.isLive ? 'border-[#FFD700]/50' : 'border-[#3a3a3a]'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${session.isLive ? 'text-[#FFD700]' : 'text-[#E5E5E5]'}`}>
                          {session.displayDate}
                        </span>
                        {session.isLive && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                            LIVE
                          </span>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                        session.score >= 85 ? 'bg-green-500/20 text-green-400' :
                        session.score >= 70 ? 'bg-yellow-500/20 text-yellow-400' :
                        session.score >= 55 ? 'bg-orange-500/20 text-orange-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {session.score}%
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-[#888]">Level: <span className="text-purple-400 font-medium">{session.shooterLevel}</span></span>
                      <span className="text-[#888]">Elbow: <span className="text-[#E5E5E5]">{session.elbowAngle}°</span></span>
                      <span className="text-[#888]">Knee: <span className="text-[#E5E5E5]">{session.kneeAngle}°</span></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </>
      )}
    </div>
  )
}

// ============================================
// PHASE 9: CATEGORY COMPARISON COMPONENT
// ============================================

function Phase9CategoryComparison() {
  const [comparison, setComparison] = useState<AnalyticsData['categoryComparison']>([])
  
  useEffect(() => {
    setComparison(generateCategoryComparison())
  }, [])
  
  if (comparison.length === 0) {
    return (
      <div className="bg-[#2C2C2C] rounded-xl p-8 border border-[#3a3a3a] text-center">
        <Target className="w-12 h-12 text-[#888] mx-auto mb-4" />
        <p className="text-[#888]">Complete at least one analysis to see category breakdown.</p>
      </div>
    )
  }
  
  return (
    <div className="bg-[#2C2C2C] rounded-xl p-6 border border-[#3a3a3a]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
          <Target className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#E5E5E5]">Category Breakdown</h3>
          <p className="text-sm text-[#888]">Compare your performance across different skill areas</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {comparison.map((cat, index) => (
          <div key={index} className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#E5E5E5] font-medium">{cat.category}</span>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold ${
                  cat.color === 'green' ? 'text-green-400' :
                  cat.color === 'red' ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {cat.change >= 0 ? '+' : ''}{cat.change}%
                </span>
                <span className="text-xl font-black text-[#FFD700]">{cat.current}%</span>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="relative h-3 bg-[#3a3a3a] rounded-full overflow-hidden">
              {/* Previous score (lighter) */}
              <div 
                className="absolute top-0 left-0 h-full bg-[#555] rounded-full transition-all duration-500"
                style={{ width: `${cat.previous}%` }}
              />
              {/* Current score (colored) */}
              <div 
                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
                  cat.color === 'green' ? 'bg-gradient-to-r from-green-600 to-green-400' :
                  cat.color === 'red' ? 'bg-gradient-to-r from-red-600 to-red-400' :
                  'bg-gradient-to-r from-yellow-600 to-yellow-400'
                }`}
                style={{ width: `${cat.current}%` }}
              />
            </div>
            
            <div className="flex justify-between mt-1 text-xs text-[#888]">
              <span>Previous: {cat.previous}%</span>
              <span>Current: {cat.current}%</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-[#3a3a3a]">
        <span className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-[#888]">Improved</span>
        </span>
        <span className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-[#888]">Stable</span>
        </span>
        <span className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-[#888]">Declined</span>
        </span>
      </div>
    </div>
  )
}

// ============================================
// PHASE 9: ISSUE HEAT MAP COMPONENT
// ============================================

function Phase9IssueHeatmap() {
  const [heatmap, setHeatmap] = useState<AnalyticsData['issueHeatmap']>([])
  
  useEffect(() => {
    setHeatmap(generateIssueHeatmap())
  }, [])
  
  if (heatmap.length === 0) {
    return (
      <div className="bg-[#2C2C2C] rounded-xl p-8 border border-[#3a3a3a] text-center">
        <AlertTriangle className="w-12 h-12 text-[#888] mx-auto mb-4" />
        <p className="text-[#888]">No issues detected yet. Keep analyzing to track patterns!</p>
      </div>
    )
  }
  
  return (
    <div className="bg-[#2C2C2C] rounded-xl p-6 border border-[#3a3a3a]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#E5E5E5]">Issue Frequency Analysis</h3>
          <p className="text-sm text-[#888]">Your most common form issues across all sessions</p>
        </div>
      </div>
      
      <div className="space-y-3">
        {heatmap.map((issue, index) => (
          <div 
            key={index} 
            className={`rounded-lg p-4 border transition-all ${
              issue.severity === 'high' 
                ? 'bg-red-500/10 border-red-500/30' 
                : issue.severity === 'medium'
                ? 'bg-orange-500/10 border-orange-500/30'
                : 'bg-yellow-500/10 border-yellow-500/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  issue.severity === 'high' ? 'bg-red-500' :
                  issue.severity === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'
                }`}>
                  <span className="text-white font-bold text-sm">{index + 1}</span>
                </div>
                <span className="text-[#E5E5E5] font-medium">{issue.issue}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#888] text-sm">{issue.count} occurrences</span>
                <span className={`text-xl font-black ${
                  issue.severity === 'high' ? 'text-red-400' :
                  issue.severity === 'medium' ? 'text-orange-400' : 'text-yellow-400'
                }`}>
                  {issue.frequency}%
                </span>
              </div>
            </div>
            
            {/* Heat bar */}
            <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  issue.severity === 'high' ? 'bg-gradient-to-r from-red-600 to-red-400' :
                  issue.severity === 'medium' ? 'bg-gradient-to-r from-orange-600 to-orange-400' :
                  'bg-gradient-to-r from-yellow-600 to-yellow-400'
                }`}
                style={{ width: `${issue.frequency}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Severity Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-[#3a3a3a]">
        <span className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-[#888]">High (60%+)</span>
        </span>
        <span className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span className="text-[#888]">Medium (30-60%)</span>
        </span>
        <span className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-[#888]">Low (&lt;30%)</span>
        </span>
      </div>
      
      {/* Tip */}
      <div className="mt-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
        <p className="text-sm text-purple-300">
          <Lightbulb className="w-4 h-4 inline mr-2" />
          <strong>Tip:</strong> Focus on fixing high-frequency issues first for the biggest improvement in your shooting form.
        </p>
      </div>
    </div>
  )
}

// ============================================
// PHASE 9: MILESTONE BADGES COMPONENT
// ============================================

function Phase9MilestoneBadges() {
  const [achievedMilestones, setAchievedMilestones] = useState<Milestone[]>([])
  const [unachievedMilestones, setUnachievedMilestones] = useState<Milestone[]>([])
  
  useEffect(() => {
    setAchievedMilestones(detectMilestones())
    setUnachievedMilestones(getUnachievedMilestones())
  }, [])
  
  return (
    <div className="space-y-6">
      {/* Achieved Milestones */}
      <div className="bg-[#2C2C2C] rounded-xl p-6 border border-[#3a3a3a]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#E5E5E5]">Achievements Unlocked</h3>
            <p className="text-sm text-[#888]">{achievedMilestones.length} milestone{achievedMilestones.length !== 1 ? 's' : ''} achieved</p>
          </div>
        </div>
        
        {achievedMilestones.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="w-16 h-16 text-[#3a3a3a] mx-auto mb-4" />
            <p className="text-[#888]">Complete your first analysis to start earning achievements!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {achievedMilestones.map((milestone, index) => (
              <div 
                key={milestone.id}
                className="relative bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] rounded-xl p-4 border border-[#FFD700]/30 overflow-hidden group hover:scale-105 transition-transform"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/10 to-transparent opacity-50"></div>
                
                <div className="relative text-center">
                  <div className="text-4xl mb-2">{milestone.icon}</div>
                  <h4 className="text-sm font-bold text-[#FFD700] mb-1">{milestone.name}</h4>
                  <p className="text-xs text-[#888] mb-2">{milestone.description}</p>
                  {milestone.achievedDate && (
                    <p className="text-xs text-green-400">
                      ✓ {new Date(milestone.achievedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Unachieved Milestones */}
      {unachievedMilestones.length > 0 && (
        <div className="bg-[#2C2C2C] rounded-xl p-6 border border-[#3a3a3a]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-[#3a3a3a] flex items-center justify-center">
              <Target className="w-5 h-5 text-[#888]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#888]">Locked Achievements</h3>
              <p className="text-sm text-[#666]">{unachievedMilestones.length} more to unlock</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {unachievedMilestones.map((milestone) => (
              <div 
                key={milestone.id}
                className="bg-[#1a1a1a] rounded-xl p-4 border border-[#3a3a3a] opacity-60 grayscale"
              >
                <div className="text-center">
                  <div className="text-4xl mb-2 opacity-30">{milestone.icon}</div>
                  <h4 className="text-sm font-bold text-[#666] mb-1">{milestone.name}</h4>
                  <p className="text-xs text-[#555]">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Progress to Next Milestone */}
      {unachievedMilestones.length > 0 && (
        <div className="bg-gradient-to-r from-purple-500/10 via-[#2C2C2C] to-purple-500/10 rounded-xl p-6 border border-purple-500/30">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Zap className="w-8 h-8 text-purple-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-[#E5E5E5] mb-1">Next Achievement</h4>
              <p className="text-[#888]">{unachievedMilestones[0].description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-2xl">{unachievedMilestones[0].icon}</span>
                <span className="text-purple-400 font-bold">{unachievedMilestones[0].name}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// PHASE 7: PHOTO COMPARISON SLIDER
// ============================================

interface PhotoComparisonSliderProps {
  beforeImage: string
  afterImage: string
  beforeLabel?: string
  afterLabel?: string
}

function PhotoComparisonSlider({ 
  beforeImage, 
  afterImage, 
  beforeLabel = "Before", 
  afterLabel = "After" 
}: PhotoComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  
  const handleMouseDown = () => {
    isDragging.current = true
  }
  
  const handleMouseUp = () => {
    isDragging.current = false
  }
  
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current || !containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = (x / rect.width) * 100
    setSliderPosition(Math.max(0, Math.min(100, percentage)))
  }, [])
  
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.touches[0].clientX - rect.left
    const percentage = (x / rect.width) * 100
    setSliderPosition(Math.max(0, Math.min(100, percentage)))
  }, [])
  
  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[400px] rounded-xl overflow-hidden cursor-ew-resize select-none border border-[#3a3a3a]"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
    >
      {/* After Image (Full width, behind) */}
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={afterImage} 
          alt={afterLabel}
          className="w-full h-full object-contain bg-[#1a1a1a]"
          draggable={false}
        />
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-green-500/80 text-white text-sm font-bold">
          {afterLabel}
        </div>
      </div>
      
      {/* Before Image (Clipped) */}
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={beforeImage} 
          alt={beforeLabel}
          className="w-full h-full object-contain bg-[#1a1a1a]"
          style={{ width: containerRef.current?.offsetWidth || '100%' }}
          draggable={false}
        />
        <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-red-500/80 text-white text-sm font-bold">
          {beforeLabel}
        </div>
      </div>
      
      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-10"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        {/* Handle Circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
          <div className="flex items-center gap-0.5">
            <ChevronLeft className="w-4 h-4 text-[#1a1a1a]" />
            <ChevronRight className="w-4 h-4 text-[#1a1a1a]" />
          </div>
        </div>
      </div>
      
      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/60 text-white text-sm">
        Drag to compare
      </div>
    </div>
  )
}

// ============================================
// PHASE 7: PHOTO COMPARISON SECTION
// ============================================

function PhotoComparisonSection() {
  const { uploadedImageBase64 } = useAnalysisStore()
  const [sessions, setSessions] = useState<AnalysisSession[]>([])
  const [beforeSessionId, setBeforeSessionId] = useState<string>('')
  const [afterSessionId, setAfterSessionId] = useState<string>('current')
  
  useEffect(() => {
    const loadedSessions = getAllSessions()
    setSessions(loadedSessions)
    // Set the oldest session as "before" by default
    if (loadedSessions.length > 0) {
      setBeforeSessionId(loadedSessions[loadedSessions.length - 1].id)
    }
  }, [])
  
  // Get session options
  const sessionOptions = useMemo(() => {
    const options: { id: string; label: string; image: string | null }[] = []
    
    // Current session
    if (uploadedImageBase64) {
      options.push({
        id: 'current',
        label: 'Current Session',
        image: uploadedImageBase64
      })
    }
    
    // Historical sessions
    sessions.forEach(session => {
      options.push({
        id: session.id,
        label: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        image: session.mainImage || session.skeletonImage || null
      })
    })
    
    return options
  }, [uploadedImageBase64, sessions])
  
  // Get images for comparison
  const beforeImage = useMemo(() => {
    if (beforeSessionId === 'current') return uploadedImageBase64 || ''
    const session = sessions.find(s => s.id === beforeSessionId)
    return session?.mainImage || session?.skeletonImage || ''
  }, [beforeSessionId, sessions, uploadedImageBase64])
  
  const afterImage = useMemo(() => {
    if (afterSessionId === 'current') return uploadedImageBase64 || ''
    const session = sessions.find(s => s.id === afterSessionId)
    return session?.mainImage || session?.skeletonImage || ''
  }, [afterSessionId, sessions, uploadedImageBase64])
  
  // Get session labels
  const beforeLabel = useMemo(() => {
    if (beforeSessionId === 'current') return 'Current'
    const session = sessions.find(s => s.id === beforeSessionId)
    return session ? new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Before'
  }, [beforeSessionId, sessions])
  
  const afterLabel = useMemo(() => {
    if (afterSessionId === 'current') return 'Current'
    const session = sessions.find(s => s.id === afterSessionId)
    return session ? new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'After'
  }, [afterSessionId, sessions])
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] rounded-xl p-6 border border-[#3a3a3a]">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <ImageIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-blue-400 uppercase tracking-wider">Photo Comparison</h2>
            <p className="text-[#888] text-sm">Compare your shooting form between sessions</p>
          </div>
        </div>
      </div>
      
      {/* Session Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#2C2C2C] rounded-xl p-4 border border-[#3a3a3a]">
          <label className="block text-sm font-bold text-[#888] uppercase tracking-wider mb-2">
            Before (Older)
          </label>
          <select
            value={beforeSessionId}
            onChange={(e) => setBeforeSessionId(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-4 py-3 text-[#E5E5E5] focus:border-blue-500 focus:outline-none"
          >
            <option value="">Select a session...</option>
            {sessionOptions.map(option => (
              <option key={option.id} value={option.id} disabled={option.id === afterSessionId}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="bg-[#2C2C2C] rounded-xl p-4 border border-[#3a3a3a]">
          <label className="block text-sm font-bold text-[#888] uppercase tracking-wider mb-2">
            After (Newer)
          </label>
          <select
            value={afterSessionId}
            onChange={(e) => setAfterSessionId(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-4 py-3 text-[#E5E5E5] focus:border-blue-500 focus:outline-none"
          >
            <option value="">Select a session...</option>
            {sessionOptions.map(option => (
              <option key={option.id} value={option.id} disabled={option.id === beforeSessionId}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Comparison Slider */}
      {beforeImage && afterImage ? (
        <PhotoComparisonSlider
          beforeImage={beforeImage}
          afterImage={afterImage}
          beforeLabel={beforeLabel}
          afterLabel={afterLabel}
        />
      ) : (
        <div className="bg-[#2C2C2C] rounded-xl p-12 border border-[#3a3a3a] text-center">
          <ImageIcon className="w-16 h-16 text-[#3a3a3a] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[#E5E5E5] mb-2">Select Sessions to Compare</h3>
          <p className="text-[#888]">
            {sessionOptions.length < 2 
              ? "You need at least 2 sessions to compare. Upload more images to track your progress!"
              : "Select a 'Before' and 'After' session above to see your progress."}
          </p>
        </div>
      )}
      
      {/* Comparison Tips */}
      <div className="bg-[#2C2C2C] rounded-xl p-6 border border-[#3a3a3a]">
        <h3 className="text-lg font-bold text-[#FFD700] mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          What to Look For
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
            <h4 className="font-bold text-[#E5E5E5] mb-2">Elbow Position</h4>
            <p className="text-sm text-[#888]">Compare how your elbow alignment has improved. Look for a more tucked position under the ball.</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
            <h4 className="font-bold text-[#E5E5E5] mb-2">Balance & Stance</h4>
            <p className="text-sm text-[#888]">Check if your base is more stable. Feet should be shoulder-width apart with good knee bend.</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
            <h4 className="font-bold text-[#E5E5E5] mb-2">Follow-Through</h4>
            <p className="text-sm text-[#888]">Look at your release and follow-through. The arm should extend fully toward the basket.</p>
          </div>
        </div>
      </div>
    </div>
  )
}