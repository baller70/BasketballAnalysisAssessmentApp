/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
// @ts-nocheck
"use client"

import React, { useState, useMemo, useRef, useCallback, useEffect, Suspense } from "react"
import { AnalysisDashboard } from "@/components/analysis/AnalysisDashboard"
import { AnalysisCardGame } from "@/components/analysis/AnalysisCardGame"
import { EnhancedShotStrip } from "@/components/analysis/EnhancedShotStrip"
import { AutoScreenshots } from "@/components/analysis/AutoScreenshots"
import { AnalysisProgressScreen, type InputType } from "@/components/analysis/AnalysisProgressScreen"
import { VideoPlayerSection } from "@/components/analysis/VideoPlayerSection"
import { ShotReviewTimeline, type ShotReviewEvent } from "@/components/analysis/ShotReviewTimeline"
import { LiveAnalysis, FullscreenLiveCamera } from "@/components/live"
import { GoalTransitMap } from "@/components/goals"
import { User, Upload, Check, X, Image as ImageIcon, Video, BookOpen, Users, Search, BarChart3, Award, ArrowRight, Zap, Trophy, Target, ClipboardList, Flame, Dumbbell, CircleDot, Share2, Download, Copy, Twitter, Facebook, Linkedin, ChevronLeft, ChevronRight, Calendar, ChevronDown, ChevronUp, AlertTriangle, Lightbulb, Plus, Eye, EyeOff, Layers, GitBranch, Circle, Tag, Camera, Play, Info, TrendingUp, Shirt, Medal, Timer, Footprints, ArrowLeftRight, Move, Instagram, MessageCircle, Globe, Clock, PieChart, Grid3X3, Activity, MoreVertical, Radio, Star, Crown, MapPin, SlidersHorizontal, Filter, FolderOpen, Home } from "lucide-react"
import { Basketball as PhBasketball, FireSimple as PhFire, Trophy as PhTrophy, Target as PhTarget, Medal as PhMedal, Crown as PhCrown, Lightning as PhLightning, ChartLineUp as PhChartUp, Crosshair as PhCrosshair, Star as PhStar, TrendUp as PhTrend } from "@phosphor-icons/react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
// shadcn/ui components
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ALL_ELITE_SHOOTERS, LEAGUE_LABELS, LEAGUE_COLORS, POSITION_LABELS, EliteShooter, TIER_LABELS, TIER_COLORS } from "@/data/eliteShooters"
import PlayerBioPopup from "@/components/PlayerBioPopup"
// Audit fix: the Hugging Face hybrid caller that imported HYBRID_API_URL was
// removed. The live upload path routes through analyzeShootingForm /
// analyzeVideoShooting, which use the on-device pose provider (getPoseProvider).
// Shooter database available for future body-type matching enhancements
// import { findMatchingShooters, parseHeightToInches, determineBodyBuild } from "@/data/shooterDatabase"
import { toPng } from "html-to-image"
import { addWatermarkToImage } from "@/lib/watermark"
import { ZoomableImage } from "@/components/ui/effects/image-zoom"
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
  getLatestSessionByMediaType,
  getSessionsByMediaType,
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
import { ClickableStatsGrid, StatPopup } from "@/components/dashboard/StatPopup"
import { Phase6ComparisonPanel } from "@/components/comparison/Phase6ComparisonPanel"
import { ScoreOrPassGame } from "@/components/comparison/ScoreOrPass"
import { WorkoutOrPassGame, WorkoutCalendar } from "@/components/training/WorkoutOrPass"
import { PlayerLockInGame } from "@/components/analysis/LockInOrSave"
// Removed: AnnotationWalkthroughVideo - using original video player instead
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
import { useAuthStore } from "@/stores/authStore"
import {
  BadgesShowcase,
  LevelProgressCard,
  StreakTracker,
  WeeklyChallenges,
  Leaderboard,
  GamificationSummaryCard,
  ShareProgressButton
} from "@/components/gamification/GamificationComponents"
import { UserLevelCard } from "@/components/UserLevelCard"
import { TierMilestonesPopup } from "@/components/points"
import {
  getUserProgress,
  updateStreak,
  checkBadgeUnlock,
  addPoints,
  ALL_BADGES
} from "@/services/gamificationService"
import { usePoints } from "@/lib/points/pointsContext"
import { TIER_ORDER } from "@/lib/points/pointsConfig"
import { persistShotEvents } from "@/lib/api/shotEvents"
import { createCaptureSession, updateCaptureSession } from "@/lib/api/captureSessionsClient"
import {
  buildCaptureSessionMetadata,
  normalizeCaptureOrientation,
  normalizeCapturePlatform,
  updateSessionVideoCaptureIdentity,
} from "@/lib/capture/captureSession"
import { createLocalReviewShotEvents } from "@/lib/live/liveReviewData"
import { getPlatformOS } from "@/utils/platform"
import { useDashboardViewStore, type DashboardView } from "@/stores/dashboardViewStore"
import { 
  StandardBiomechanicalAnalysis, 
  StandardPlayerAssessment, 
  StandardTrainingPlan,
  BasicBiomechanicalAnalysis,
  BasicPlayerAssessment,
  BasicTrainingPlan
} from "@/components/dashboard/SimplifiedTabs"
// Simplified player cards removed - now using same Professional layout for all views

type ResultsMode = "video" | "image" | "live"

// ============================================
// COLLAPSIBLE DROPDOWN COMPONENT
// For organizing sections with expand/collapse
// ============================================
interface CollapsibleDropdownProps {
  title: string
  icon?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}

function CollapsibleDropdown({ title, icon, defaultOpen = false, children }: CollapsibleDropdownProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
      {/* Header - Always visible, clickable */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-200/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-[#FF6B35]">{icon}</span>}
          <h3 className="text-[#FF6B35] font-bold text-sm uppercase tracking-wider">{title}</h3>
        </div>
        <div className={`text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>

      {/* Content - Collapsible with animation */}
      <div 
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 pt-0 border-t border-black">
          {children}
        </div>
      </div>
    </div>
  )
}

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
  overlayToggles?: OverlayToggles // Controls which overlays to show
  onDownload?: (downloadFn: () => void) => void // Callback to expose download function
}

function HybridSkeletonDisplay({ imageUrl, keypoints, basketball, imageSize, angles, confidence, showStats = true, overlayToggles, onDownload }: HybridSkeletonDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const logoImageRef = useRef<HTMLImageElement | null>(null)
  const [logoLoaded, setLogoLoaded] = useState(false)
  
  // Download function to export canvas as PNG
  const downloadCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const dataUrl = canvas.toDataURL('image/png', 1.0)
    const link = document.createElement('a')
    link.download = `shotiq_analysis_${Date.now()}.png`
    link.href = dataUrl
    link.click()
  }, [])
  
  // Expose download function to parent via callback
  useEffect(() => {
    if (onDownload) {
      onDownload(downloadCanvas)
    }
  }, [onDownload, downloadCanvas])
  
  // Zoom state for hover zoom effect
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 })
  
  // Default toggles if not provided
  const toggles = overlayToggles || { skeleton: true, joints: true, annotations: true, basketball: true }

  // Load the SHOTIQ logo image FIRST
  useEffect(() => {
    const logoImg = new window.Image()
    logoImg.onload = () => {
      console.log('✅ SHOTIQ logo loaded successfully')
      logoImageRef.current = logoImg
      setLogoLoaded(true)
    }
    logoImg.onerror = () => {
      console.error('❌ Failed to load SHOTIQ logo')
    }
    logoImg.src = '/images/shotiq-logo.png'
  }, [])

  useEffect(() => {
    if (!imageUrl) {
      console.log('❌ No imageUrl')
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

      // Scale to fit max 500px width for the IMAGE portion
      const maxW = 500
      const scale = Math.min(1, maxW / img.width)
      const imageW = img.width * scale
      const imageH = img.height * scale
      
      // ADD BLACK PADDING on each side for labels (only if annotations are on)
      const LABEL_PADDING = toggles.annotations ? 180 : 0
      const canvasW = imageW + (LABEL_PADDING * 2)
      const canvasH = imageH
      
      // Set canvas size (this clears the canvas)
      canvas.width = canvasW
      canvas.height = canvasH
      
      // Fill entire canvas with black first
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvasW, canvasH)

      // Draw image CENTERED (offset by left padding)
      ctx.drawImage(img, LABEL_PADDING, 0, imageW, imageH)
      console.log('🖼️ Image drawn to canvas with padding:', canvasW, 'x', canvasH, 'padding:', LABEL_PADDING)

      const kp = keypoints || {}
      // Use imageSize from props if available, otherwise use actual image dimensions
      const imgW = imageSize?.width || img.naturalWidth
      const imgH = imageSize?.height || img.naturalHeight

      console.log('🖼️ Drawing skeleton:', { imgW, imgH, imageW, imageH, canvasW: canvas.width, canvasH: canvas.height })

      // Scale factor for drawing (relative to image portion, not full canvas)
      const sx = imageW / imgW
      const sy = imageH / imgH

      // Draw basketball if detected AND toggle is on
      if (basketball && toggles.basketball) {
        ctx.beginPath()
        ctx.arc(basketball.x * sx + LABEL_PADDING, basketball.y * sy, basketball.radius * sx, 0, Math.PI * 2)
        ctx.strokeStyle = "#f97316"
        ctx.lineWidth = 3
        ctx.stroke()
        ctx.fillStyle = "#f97316"
        ctx.beginPath()
        ctx.arc(basketball.x * sx + LABEL_PADDING, basketball.y * sy, 4, 0, Math.PI * 2)
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

      // ============================================
      // STATUS-BASED COLORS (green=good, yellow=warning, red=problem)
      // ============================================
      const STATUS_COLORS = {
        good: "#22c55e",      // Green
        warning: "#eab308",   // Yellow  
        critical: "#ef4444",  // Red
        default: "#00d4ff",   // Cyan (default)
      }
      
      // Body part to color mapping for visual distinction
      const BODY_PART_COLORS: Record<string, string> = {
        left_shoulder: '#00d4ff', right_shoulder: '#00d4ff',
        left_elbow: '#00ffcc', right_elbow: '#00ffcc',
        left_wrist: '#00ff99', right_wrist: '#00ff99',
        nose: '#ff00ff', neck: '#ff00ff', mid_hip: '#cc00ff',
        left_hip: '#ff9900', right_hip: '#ff9900',
        left_knee: '#ffcc00', right_knee: '#ffcc00',
        left_ankle: '#ffff00', right_ankle: '#ffff00',
      }
      
      // Get status for keypoint based on angles
      const getKeypointStatus = (keypointName: string): 'good' | 'warning' | 'critical' | undefined => {
        if (!angles) return undefined
        
        if (keypointName.includes('elbow') || keypointName.includes('wrist')) {
          const elbow = angles.elbow_angle || angles.right_elbow_angle || angles.left_elbow_angle
          if (elbow !== undefined) {
            if (elbow >= 85 && elbow <= 100) return 'good'
            if (elbow >= 70 && elbow <= 110) return 'warning'
            return 'critical'
          }
        }
        if (keypointName.includes('knee') || keypointName.includes('ankle')) {
          const knee = angles.knee_angle || angles.right_knee_angle || angles.left_knee_angle
          if (knee !== undefined) {
            if (knee >= 130 && knee <= 160) return 'good'
            if (knee >= 110 && knee <= 170) return 'warning'
            return 'critical'
          }
        }
        if (keypointName.includes('shoulder')) {
          const shoulder = angles.shoulder_tilt
          if (shoulder !== undefined) {
            if (Math.abs(shoulder) <= 5) return 'good'
            if (Math.abs(shoulder) <= 10) return 'warning'
            return 'critical'
          }
        }
        if (keypointName.includes('hip')) {
          const hip = angles.hip_tilt
          if (hip !== undefined) {
            if (Math.abs(hip) <= 8) return 'good'
            if (Math.abs(hip) <= 15) return 'warning'
            return 'critical'
          }
        }
        return undefined
      }
      
      // Get worst status between two keypoints
      const getWorstStatus = (s1?: string, s2?: string) => {
        const priority: Record<string, number> = { critical: 3, warning: 2, good: 1 }
        const p1 = s1 ? priority[s1] || 0 : 0
        const p2 = s2 ? priority[s2] || 0 : 0
        if (p1 >= p2) return s1
        return s2
      }

      // Draw skeleton lines - PROFESSIONAL VIDEO GAME STYLE
      if (toggles.skeleton && Object.keys(kp).length > 0) {
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        
        skeleton.forEach(([start, end]) => {
          if (kp[start] && kp[end]) {
            const startX = kp[start].x * sx + LABEL_PADDING
            const startY = kp[start].y * sy
            const endX = kp[end].x * sx + LABEL_PADDING
            const endY = kp[end].y * sy
            
            // Get status-based color or body part color
            const startStatus = getKeypointStatus(start)
            const endStatus = getKeypointStatus(end)
            const worstStatus = getWorstStatus(startStatus, endStatus)
            
            let lineColor: string
            if (worstStatus) {
              lineColor = STATUS_COLORS[worstStatus as keyof typeof STATUS_COLORS]
            } else {
              lineColor = BODY_PART_COLORS[start] || '#00d4ff'
            }
            
            // Layer 1: Outer glow (largest, most transparent)
            ctx.strokeStyle = lineColor
            ctx.lineWidth = 14
            ctx.globalAlpha = 0.15
            ctx.beginPath()
            ctx.moveTo(startX, startY)
            ctx.lineTo(endX, endY)
            ctx.stroke()
            
            // Layer 2: Middle glow
            ctx.lineWidth = 10
            ctx.globalAlpha = 0.25
            ctx.beginPath()
            ctx.moveTo(startX, startY)
            ctx.lineTo(endX, endY)
            ctx.stroke()
            
            // Layer 3: Inner glow
            ctx.lineWidth = 6
            ctx.globalAlpha = 0.4
            ctx.beginPath()
            ctx.moveTo(startX, startY)
            ctx.lineTo(endX, endY)
            ctx.stroke()
            
            // Layer 4: Core line (solid)
            ctx.lineWidth = 4
            ctx.globalAlpha = 1.0
            ctx.beginPath()
            ctx.moveTo(startX, startY)
            ctx.lineTo(endX, endY)
            ctx.stroke()
            
            // Layer 5: Bright center highlight
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 1.5
            ctx.globalAlpha = 0.6
            ctx.beginPath()
            ctx.moveTo(startX, startY)
            ctx.lineTo(endX, endY)
            ctx.stroke()
            
            ctx.globalAlpha = 1.0
          }
        })
      }

      // Draw keypoints - PROFESSIONAL VIDEO GAME STYLE
      if (toggles.joints && Object.keys(kp).length > 0) {
        const pointRadius = 10
        
        Object.entries(kp).forEach(([name, pt]) => {
          const x = pt.x * sx + LABEL_PADDING
          const y = pt.y * sy
          
          // Get status-based color or body part color
          const status = getKeypointStatus(name)
          let color: string
          if (status) {
            color = STATUS_COLORS[status as keyof typeof STATUS_COLORS]
          } else {
            color = BODY_PART_COLORS[name] || '#00d4ff'
          }
          
          // Layer 1: Outer glow (largest)
          ctx.beginPath()
          ctx.arc(x, y, pointRadius + 8, 0, Math.PI * 2)
          ctx.fillStyle = color
          ctx.globalAlpha = 0.15
          ctx.fill()
          
          // Layer 2: Middle glow
          ctx.beginPath()
          ctx.arc(x, y, pointRadius + 5, 0, Math.PI * 2)
          ctx.globalAlpha = 0.25
          ctx.fill()
          
          // Layer 3: Inner glow
          ctx.beginPath()
          ctx.arc(x, y, pointRadius + 2, 0, Math.PI * 2)
          ctx.globalAlpha = 0.4
          ctx.fill()
          
          // Layer 4: Main joint circle (solid)
          ctx.beginPath()
          ctx.arc(x, y, pointRadius, 0, Math.PI * 2)
          ctx.fillStyle = color
          ctx.globalAlpha = 1.0
          ctx.fill()
          
          // Layer 5: Dark inner ring for depth
          ctx.beginPath()
          ctx.arc(x, y, pointRadius * 0.7, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)'
          ctx.lineWidth = 2
          ctx.stroke()
          
          // Layer 6: Bright center highlight
          ctx.beginPath()
          ctx.arc(x, y, pointRadius * 0.5, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
          ctx.fill()
          
          // Layer 7: Tiny reflection dot
          ctx.beginPath()
          ctx.arc(x - pointRadius * 0.25, y - pointRadius * 0.25, pointRadius * 0.2, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
          ctx.fill()
        })
      }
      
      // ============================================
      // BIG ANGLE LABELS - Same as video mode
      // Labels positioned FAR AWAY from body, HIPS ON UP
      // ============================================
      if (toggles.annotations && angles && Object.keys(kp).length > 0) {
        ctx.textAlign = 'left'
        
        // Angle ranges for feedback
        const angleRanges: Record<string, { ideal: number; range: [number, number] }> = {
          'elbow_angle': { ideal: 90, range: [85, 100] },
          'right_elbow_angle': { ideal: 90, range: [85, 100] },
          'left_elbow_angle': { ideal: 90, range: [85, 100] },
          'knee_angle': { ideal: 145, range: [135, 160] },
          'right_knee_angle': { ideal: 145, range: [135, 160] },
          'left_knee_angle': { ideal: 145, range: [135, 160] },
          'shoulder_tilt': { ideal: 0, range: [-5, 5] },
          'hip_tilt': { ideal: 0, range: [-8, 8] },
        }
        
        // Generate feedback comment based on angle value
        const getFeedback = (angleKey: string, value: number): { text: string; status: 'good' | 'warning' | 'bad' } => {
          const config = angleRanges[angleKey]
          if (!config) return { text: '', status: 'good' }
          
          const [min, max] = config.range
          if (value >= min && value <= max) {
            return { text: 'EXCELLENT! WITHIN ELITE RANGE', status: 'good' }
          } else if (Math.abs(value - config.ideal) <= 15) {
            const diff = value < min ? Math.round(min - value) : Math.round(value - max)
            return { 
              text: value < min ? `INCREASE BY ${diff}°` : `DECREASE BY ${diff}°`, 
              status: 'warning' 
            }
          } else {
            const diff = value < min ? Math.round(min - value) : Math.round(value - max)
            return { 
              text: value < min ? `TOO LOW - NEED ${diff}° MORE` : `TOO HIGH - REDUCE ${diff}°`, 
              status: 'bad' 
            }
          }
        }
        
        // Labels config - positioned FAR from body, HIPS ON UP, WELL SPACED APART
        // ALTERNATING ORDER: 1st RIGHT, 2nd LEFT, 3rd RIGHT, 4th LEFT
        // Order: ELBOW (right), SHOULDER (left), HIP (right), KNEE (left)
        const annotationConfig: Array<{
          angleKey: string
          label: string
          keypointName: string
          color: string
        }> = [
          // 1st label - ELBOW - will be on RIGHT
          { angleKey: 'elbow_angle', label: 'ELBOW ANGLE', keypointName: 'right_elbow', color: '#4ade80' },
          { angleKey: 'right_elbow_angle', label: 'ELBOW ANGLE', keypointName: 'right_elbow', color: '#4ade80' },
          { angleKey: 'left_elbow_angle', label: 'ELBOW ANGLE', keypointName: 'left_elbow', color: '#4ade80' },
          // 2nd label - SHOULDER - will be on LEFT
          { angleKey: 'shoulder_tilt', label: 'SHOULDER', keypointName: 'right_shoulder', color: '#facc15' },
          // 3rd label - HIP - will be on RIGHT
          { angleKey: 'hip_tilt', label: 'HIP ALIGN', keypointName: 'right_hip', color: '#f97316' },
          // 4th label - KNEE - will be on LEFT
          { angleKey: 'knee_angle', label: 'KNEE BEND', keypointName: 'right_knee', color: '#60a5fa' },
          { angleKey: 'right_knee_angle', label: 'KNEE BEND', keypointName: 'right_knee', color: '#60a5fa' },
          { angleKey: 'left_knee_angle', label: 'KNEE BEND', keypointName: 'left_knee', color: '#60a5fa' },
        ]
        
        const drawnLabels = new Set<string>()
        
        // Label dimensions - scaled for image canvas (smaller than video)
        const labelWidth = 160
        const labelHeight = 70
        
        let labelIndex = 0
        annotationConfig.forEach(({ angleKey, label, keypointName, color }) => {
          const angleValue = angles[angleKey]
          const keypoint = kp[keypointName]
          
          if (angleValue !== undefined && keypoint && !drawnLabels.has(label)) {
            drawnLabels.add(label)
            
            // Get feedback comment
            const feedback = getFeedback(angleKey, angleValue)
            const feedbackColor = feedback.status === 'good' ? '#4ade80' : feedback.status === 'warning' ? '#facc15' : '#ef4444'
            
            // Body part position (scaled, offset by padding)
            const kpX = keypoint.x * sx + LABEL_PADDING
            const kpY = keypoint.y * sy
            
            // RULE: ALTERNATING SIDES - labels close to player, not touching
            const isRightSide = labelIndex % 2 === 0
            
            // Offset from keypoint - just outside the body (~80px accounts for body width)
            const bodyOffset = 80
            const rawX = isRightSide 
              ? kpX + bodyOffset
              : kpX - labelWidth - bodyOffset
            
            // Keep within canvas
            const labelX = Math.max(5, Math.min(canvasW - labelWidth - 5, rawX))
            const labelY = Math.max(10, Math.min(canvasH - labelHeight - 10, kpY - labelHeight / 2))
            labelIndex++
            
            // Draw connecting line
            ctx.strokeStyle = color
            ctx.lineWidth = 2
            ctx.shadowColor = color
            ctx.shadowBlur = 6
            ctx.beginPath()
            ctx.moveTo(labelX + labelWidth / 2, labelY + labelHeight / 2)
            ctx.lineTo(kpX, kpY)
            ctx.stroke()
            ctx.shadowBlur = 0
            
            // Draw circle at keypoint
            ctx.beginPath()
            ctx.arc(kpX, kpY, 8, 0, Math.PI * 2)
            ctx.fillStyle = color
            ctx.fill()
            ctx.strokeStyle = 'white'
            ctx.lineWidth = 2
            ctx.stroke()
            
            // Label background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
            ctx.beginPath()
            ctx.roundRect(labelX, labelY, labelWidth, labelHeight, 8)
            ctx.fill()
            
            // Label border
            ctx.strokeStyle = color
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.roundRect(labelX, labelY, labelWidth, labelHeight, 8)
            ctx.stroke()
            
            // Label text - scaled font sizes
            ctx.fillStyle = 'white'
            ctx.font = 'bold 14px system-ui'
            ctx.textAlign = 'left'
            ctx.fillText(label, labelX + 8, labelY + 18)
            
            // Angle value
            ctx.fillStyle = color
            ctx.font = 'bold 24px monospace'
            ctx.fillText(`${Math.round(angleValue)}°`, labelX + 8, labelY + 45)
            
            // Feedback comment
            ctx.fillStyle = feedbackColor
            ctx.font = 'bold 9px system-ui'
            ctx.fillText(feedback.text, labelX + 8, labelY + 62)
          }
        })
      }
      
      // SHOTIQ LOGO - TOP RIGHT OF THE IMAGE (not canvas)
      // Logo image is 1536x1024, but visible content is at (272,367) to (1241,645) = 969x278 (3.5:1)
      if (logoImageRef.current) {
        // Source rectangle (the visible content in the logo image)
        const srcX = 272, srcY = 367, srcW = 969, srcH = 278
        
        // The image area is from LABEL_PADDING to (LABEL_PADDING + imageW)
        // Size logo based on IMAGE width, not canvas width
        const wmWidth = Math.max(imageW * 0.3, 120) // 30% of image width
        const wmHeight = wmWidth / 3.5
        
        // Position in top-right of the IMAGE area (not canvas)
        const imageRightEdge = LABEL_PADDING + imageW
        const wmX = imageRightEdge - wmWidth - 10
        const wmY = 10
        
        // Semi-transparent dark background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
        ctx.fillRect(wmX - 6, wmY - 6, wmWidth + 12, wmHeight + 12)
        
        // Draw ONLY the visible content of the logo (cropped)
        ctx.drawImage(logoImageRef.current, srcX, srcY, srcW, srcH, wmX, wmY, wmWidth, wmHeight)
      }
    }

    img.src = imageUrl
  }, [imageUrl, keypoints, basketball, imageSize, angles, toggles, logoLoaded])

  // Format angle name for display
  const formatAngleName = (name: string) => {
    return name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
  }

  // Handle mouse move for zoom position
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPosition({ x, y })
  }, [])

  return (
    <div className="space-y-4">
      {/* Canvas with skeleton - Now with zoom on hover */}
      <div 
        ref={containerRef} 
        className="flex justify-center overflow-hidden rounded-lg cursor-zoom-in"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => {
          setIsZoomed(false)
          setZoomPosition({ x: 50, y: 50 })
        }}
      >
        <canvas
          ref={canvasRef}
          width={500}
          height={400}
          className="rounded-lg border-2 border-black transition-transform duration-300 ease-out"
          style={{
            transform: isZoomed ? 'scale(2.5)' : 'scale(1)',
            transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
          }}
        />
      </div>

      {/* Stats - Only show if showStats is true */}
      {showStats && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <p className="text-slate-500 text-sm uppercase">Confidence</p>
              <p className="text-2xl font-bold text-[#FF6B35]">{confidence ? (confidence * 100).toFixed(0) : 0}%</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <p className="text-slate-500 text-sm uppercase">Keypoints</p>
              <p className="text-2xl font-bold text-[#4ade80]">{keypoints ? Object.keys(keypoints).length : 0}</p>
            </div>
          </div>

          {/* Angles */}
          {angles && Object.keys(angles).length > 0 && (
            <div className="bg-white rounded-lg p-4">
              <h4 className="text-[#FF6B35] font-semibold text-sm uppercase tracking-wider mb-3">Joint Angles</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(angles).map(([name, value]) => (
                  <div key={name} className="flex justify-between items-center bg-white rounded px-3 py-2">
                    <span className="text-slate-900 text-sm">{formatAngleName(name)}</span>
                    <span className="text-[#FF6B35] font-bold">{(value as number).toFixed(1)}°</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[#4ade80]" />
              <span className="text-slate-500">YOLO</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[#60a5fa]" />
              <span className="text-slate-500">MediaPipe</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[#facc15]" />
              <span className="text-slate-500">Fused</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[#f97316]" />
              <span className="text-slate-500">Basketball</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================
// MAIN ANALYSIS IMAGE SECTION - With Download Button
// Wraps HybridSkeletonDisplay with controls and download
// ============================================
interface MainAnalysisImageSectionProps {
  mainImageUrl: string
  visionAnalysis?: VisionAnalysisResult | null
  analysisData: AnalysisData
  overlayToggles: OverlayToggles
  setOverlayToggles: React.Dispatch<React.SetStateAction<OverlayToggles>>
}

function MainAnalysisImageSection({ mainImageUrl, visionAnalysis, analysisData, overlayToggles, setOverlayToggles }: MainAnalysisImageSectionProps) {
  const [downloadFn, setDownloadFn] = useState<(() => void) | null>(null)
  
  return (
    <div className="bg-white rounded-lg border-2 border-black p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#FF6B35] font-bold text-sm uppercase tracking-wider flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Main Analysis Image
        </h3>
        {downloadFn && (
          <button
            onClick={downloadFn}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#FF6B35] to-[#FF4500] hover:from-[#E55300] hover:to-[#E5A000] text-[#1a1a1a] font-semibold text-sm rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        )}
      </div>
      <HybridSkeletonDisplay
        imageUrl={mainImageUrl}
        keypoints={visionAnalysis?.keypoints}
        basketball={visionAnalysis?.basketball}
        imageSize={visionAnalysis?.image_size}
        angles={visionAnalysis?.angles}
        confidence={visionAnalysis?.confidence}
        showStats={false}
        overlayToggles={overlayToggles}
        onDownload={(fn) => setDownloadFn(() => fn)}
      />
      {/* Overlay Controls directly under main image */}
      <div className="mt-4">
        <OverlayControls toggles={overlayToggles} setToggles={setOverlayToggles} />
      </div>
      {/* Flaws/Fixes Section - same as video mode */}
      <div className="mt-6">
        <AnnotationDropdownList 
          fixes={generateFixesFromAngles(visionAnalysis?.angles || analysisData?.angles || {})} 
        />
      </div>
    </div>
  )
}

// ============================================
// ANIMATED IMAGE WALKTHROUGH - Turns image into animated video
// Zooms into each annotation, then back to full image
// ============================================
interface AnimatedImageWalkthroughProps {
  imageUrl: string
  keypoints?: Record<string, { x: number; y: number; confidence: number; source?: string }>
  angles?: Record<string, number>
  imageSize?: { width: number; height: number }
}

function AnimatedImageWalkthrough({ imageUrl, keypoints, angles, imageSize }: AnimatedImageWalkthroughProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<string>('ready')
  const [progress, setProgress] = useState(0)
  
  // Download function to export canvas as PNG
  const downloadCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const dataUrl = canvas.toDataURL('image/png', 1.0)
    const link = document.createElement('a')
    link.download = `shotiq_animated_form_${Date.now()}.png`
    link.href = dataUrl
    link.click()
  }, [])
  
  // Animation state
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  
  // Annotations config - ALTERNATING ORDER: 1st RIGHT, 2nd LEFT, 3rd RIGHT, 4th LEFT
  const annotations = useMemo(() => {
    if (!keypoints || !angles) return []
    
    const config = [
      // 1st label - ELBOW - will be on RIGHT
      { angleKey: 'elbow_angle', label: 'ELBOW ANGLE', keypointName: 'right_elbow', color: '#4ade80' },
      { angleKey: 'right_elbow_angle', label: 'ELBOW ANGLE', keypointName: 'right_elbow', color: '#4ade80' },
      // 2nd label - SHOULDER - will be on LEFT
      { angleKey: 'shoulder_tilt', label: 'SHOULDER', keypointName: 'right_shoulder', color: '#facc15' },
      // 3rd label - HIP - will be on RIGHT
      { angleKey: 'hip_tilt', label: 'HIP ALIGN', keypointName: 'right_hip', color: '#f97316' },
      // 4th label - KNEE - will be on LEFT
      { angleKey: 'knee_angle', label: 'KNEE BEND', keypointName: 'right_knee', color: '#60a5fa' },
      { angleKey: 'right_knee_angle', label: 'KNEE BEND', keypointName: 'right_knee', color: '#60a5fa' },
    ]
    
    const seen = new Set<string>()
    return config.filter(({ angleKey, label, keypointName }) => {
      if (seen.has(label)) return false
      if (angles[angleKey] === undefined) return false
      if (!keypoints[keypointName]) return false
      seen.add(label)
      return true
    })
  }, [keypoints, angles])
  
  // Draw the canvas with current zoom/pan
  const drawFrame = useCallback((img: HTMLImageElement, zoom: number, px: number, py: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const canvasW = canvas.width
    const canvasH = canvas.height
    
    // Clear canvas
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvasW, canvasH)
    
    // Calculate scaled dimensions
    const imgW = imageSize?.width || img.naturalWidth
    const imgH = imageSize?.height || img.naturalHeight
    const baseScale = Math.min(canvasW / imgW, canvasH / imgH)
    const scale = baseScale * zoom
    
    const drawW = imgW * scale
    const drawH = imgH * scale
    
    // Center point with pan offset
    const centerX = canvasW / 2 + px * zoom
    const centerY = canvasH / 2 + py * zoom
    
    const drawX = centerX - drawW / 2
    const drawY = centerY - drawH / 2
    
    // Draw image
    ctx.drawImage(img, drawX, drawY, drawW, drawH)
    
    // Draw skeleton and annotations on top
    if (keypoints) {
      const kp = keypoints
      const sx = scale
      const sy = scale
      const offsetX = drawX
      const offsetY = drawY
      
      // Skeleton connections
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
      
      // Status colors and body part colors
      const STATUS_COLORS_ANIM = { good: "#22c55e", warning: "#eab308", critical: "#ef4444", default: "#00d4ff" }
      const BODY_PART_COLORS_ANIM: Record<string, string> = {
        left_shoulder: '#00d4ff', right_shoulder: '#00d4ff',
        left_elbow: '#00ffcc', right_elbow: '#00ffcc',
        left_wrist: '#00ff99', right_wrist: '#00ff99',
        nose: '#ff00ff', left_hip: '#ff9900', right_hip: '#ff9900',
        left_knee: '#ffcc00', right_knee: '#ffcc00',
        left_ankle: '#ffff00', right_ankle: '#ffff00',
      }
      
      const getAnimKeypointStatus = (keypointName: string) => {
        if (!angles) return undefined
        if (keypointName.includes('elbow') || keypointName.includes('wrist')) {
          const elbow = angles.elbow_angle || angles.right_elbow_angle
          if (elbow !== undefined) {
            if (elbow >= 85 && elbow <= 100) return 'good'
            if (elbow >= 70 && elbow <= 110) return 'warning'
            return 'critical'
          }
        }
        if (keypointName.includes('knee') || keypointName.includes('ankle')) {
          const knee = angles.knee_angle || angles.right_knee_angle
          if (knee !== undefined) {
            if (knee >= 130 && knee <= 160) return 'good'
            if (knee >= 110 && knee <= 170) return 'warning'
            return 'critical'
          }
        }
        return undefined
      }
      
      const getAnimWorstStatus = (s1?: string, s2?: string) => {
        const priority: Record<string, number> = { critical: 3, warning: 2, good: 1 }
        const p1 = s1 ? priority[s1] || 0 : 0
        const p2 = s2 ? priority[s2] || 0 : 0
        return p1 >= p2 ? s1 : s2
      }
      
      // Draw skeleton - PROFESSIONAL VIDEO GAME STYLE
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      skeleton.forEach(([start, end]) => {
        if (kp[start] && kp[end]) {
          const startX = kp[start].x * sx + offsetX
          const startY = kp[start].y * sy + offsetY
          const endX = kp[end].x * sx + offsetX
          const endY = kp[end].y * sy + offsetY
          
          const startStatus = getAnimKeypointStatus(start)
          const endStatus = getAnimKeypointStatus(end)
          const worstStatus = getAnimWorstStatus(startStatus, endStatus)
          const lineColor = worstStatus ? STATUS_COLORS_ANIM[worstStatus as keyof typeof STATUS_COLORS_ANIM] : (BODY_PART_COLORS_ANIM[start] || '#00d4ff')
          
          // Glow layers
          ctx.strokeStyle = lineColor
          ctx.lineWidth = 12; ctx.globalAlpha = 0.15
          ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke()
          ctx.lineWidth = 8; ctx.globalAlpha = 0.25
          ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke()
          ctx.lineWidth = 4; ctx.globalAlpha = 1.0
          ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke()
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.6
          ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke()
          ctx.globalAlpha = 1.0
        }
      })
      
      // Draw keypoints - PROFESSIONAL VIDEO GAME STYLE
      const pointRadius = 10
      Object.entries(kp).forEach(([name, pt]) => {
        const x = pt.x * sx + offsetX
        const y = pt.y * sy + offsetY
        const status = getAnimKeypointStatus(name)
        const color = status ? STATUS_COLORS_ANIM[status as keyof typeof STATUS_COLORS_ANIM] : (BODY_PART_COLORS_ANIM[name] || '#00d4ff')
        
        // Glow layers
        ctx.fillStyle = color
        ctx.globalAlpha = 0.15; ctx.beginPath(); ctx.arc(x, y, pointRadius + 8, 0, Math.PI * 2); ctx.fill()
        ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(x, y, pointRadius + 5, 0, Math.PI * 2); ctx.fill()
        ctx.globalAlpha = 1.0; ctx.beginPath(); ctx.arc(x, y, pointRadius, 0, Math.PI * 2); ctx.fill()
        
        // Inner details
        ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(x, y, pointRadius * 0.7, 0, Math.PI * 2); ctx.stroke()
        ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.beginPath(); ctx.arc(x, y, pointRadius * 0.5, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.beginPath(); ctx.arc(x - pointRadius * 0.25, y - pointRadius * 0.25, pointRadius * 0.2, 0, Math.PI * 2); ctx.fill()
      })
      
      // Draw labels
      if (angles) {
        const angleRanges: Record<string, { ideal: number; range: [number, number] }> = {
          'elbow_angle': { ideal: 90, range: [85, 100] },
          'right_elbow_angle': { ideal: 90, range: [85, 100] },
          'knee_angle': { ideal: 145, range: [135, 160] },
          'right_knee_angle': { ideal: 145, range: [135, 160] },
          'shoulder_tilt': { ideal: 0, range: [-5, 5] },
          'hip_tilt': { ideal: 0, range: [-8, 8] },
        }
        
        const getFeedback = (angleKey: string, value: number) => {
          const config = angleRanges[angleKey]
          if (!config) return { text: '', status: 'good' }
          const [min, max] = config.range
          if (value >= min && value <= max) return { text: 'EXCELLENT!', status: 'good' }
          if (Math.abs(value - config.ideal) <= 15) return { text: 'ADJUST', status: 'warning' }
          return { text: 'FIX THIS', status: 'bad' }
        }
        
        const drawnLabels = new Set<string>()
        let labelIndex = 0
        annotations.forEach(({ angleKey, label, keypointName, color }) => {
          if (drawnLabels.has(label)) return
          drawnLabels.add(label)
          
          const angleValue = angles[angleKey]
          const keypoint = kp[keypointName]
          if (angleValue === undefined || !keypoint) return
          
          const feedback = getFeedback(angleKey, angleValue)
          const feedbackColor = feedback.status === 'good' ? '#4ade80' : feedback.status === 'warning' ? '#facc15' : '#ef4444'
          
          const kpX = keypoint.x * sx + offsetX
          const kpY = keypoint.y * sy + offsetY
          
          // RULE: ALTERNATING SIDES - labels close to player, not touching
          const isRightSide = labelIndex % 2 === 0
          const labelW = 160
          const labelH = 70
          
          // Offset from keypoint - just outside the body
          const bodyOffset = 80
          const rawX = isRightSide 
            ? kpX + bodyOffset
            : kpX - labelW - bodyOffset
          
          // Keep within canvas
          const labelX = Math.max(5, Math.min(canvasW - labelW - 5, rawX))
          const labelY = Math.max(10, Math.min(canvasH - labelH - 10, kpY - labelH / 2))
          
          labelIndex++
          
          // Connecting line
          ctx.strokeStyle = color
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(labelX + labelW / 2, labelY + labelH / 2)
          ctx.lineTo(kpX, kpY)
          ctx.stroke()
          
          // Circle at keypoint
          ctx.beginPath()
          ctx.arc(kpX, kpY, 10, 0, Math.PI * 2)
          ctx.fillStyle = color
          ctx.fill()
          ctx.strokeStyle = 'white'
          ctx.lineWidth = 2
          ctx.stroke()
          
          // Label background
          ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
          ctx.beginPath()
          ctx.roundRect(labelX, labelY, labelW, labelH, 8)
          ctx.fill()
          
          // Label border
          ctx.strokeStyle = color
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.roundRect(labelX, labelY, labelW, labelH, 8)
          ctx.stroke()
          
          // Label text
          ctx.fillStyle = 'white'
          ctx.font = 'bold 14px system-ui'
          ctx.textAlign = 'left'
          ctx.fillText(label, labelX + 8, labelY + 18)
          
          // Angle value
          ctx.fillStyle = color
          ctx.font = 'bold 24px monospace'
          ctx.fillText(`${Math.round(angleValue)}°`, labelX + 8, labelY + 45)
          
          // Feedback
          ctx.fillStyle = feedbackColor
          ctx.font = 'bold 10px system-ui'
          ctx.fillText(feedback.text, labelX + 8, labelY + 62)
        })
      }
    }
  }, [keypoints, angles, imageSize, annotations])
  
  // Animation sequence
  const startAnimation = useCallback(() => {
    if (!imageUrl || annotations.length === 0) return
    
    setIsPlaying(true)
    setCurrentPhase('starting')
    
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      
      // Set canvas size
      canvas.width = 600
      canvas.height = 500
      
      const imgW = imageSize?.width || img.naturalWidth
      const imgH = imageSize?.height || img.naturalHeight
      
      // Animation timeline
      const timeline: Array<{
        phase: string
        duration: number
        targetZoom: number
        targetX: number
        targetY: number
      }> = []
      
      // Start with full image
      timeline.push({ phase: 'Full View', duration: 1500, targetZoom: 1, targetX: 0, targetY: 0 })
      
      // For each annotation: zoom in, hold, zoom out
      annotations.forEach(({ label, keypointName }) => {
        const kp = keypoints?.[keypointName]
        if (!kp) return
        
        // Calculate pan to center on keypoint
        const centerX = (imgW / 2 - kp.x) * 0.5
        const centerY = (imgH / 2 - kp.y) * 0.5
        
        // Zoom into annotation
        timeline.push({ phase: `Zoom: ${label}`, duration: 1000, targetZoom: 2.5, targetX: centerX, targetY: centerY })
        // Hold
        timeline.push({ phase: label, duration: 2000, targetZoom: 2.5, targetX: centerX, targetY: centerY })
        // Zoom out
        timeline.push({ phase: 'Full View', duration: 1000, targetZoom: 1, targetX: 0, targetY: 0 })
        // Hold full view briefly
        timeline.push({ phase: 'Full View', duration: 500, targetZoom: 1, targetX: 0, targetY: 0 })
      })
      
      // Run animation
      let currentStep = 0
      let stepStartTime = Date.now()
      let startZoom = 1
      let startX = 0
      let startY = 0
      
      const animate = () => {
        if (currentStep >= timeline.length) {
          setIsPlaying(false)
          setCurrentPhase('complete')
          setProgress(100)
          drawFrame(img, 1, 0, 0)
          return
        }
        
        const step = timeline[currentStep]
        const elapsed = Date.now() - stepStartTime
        const t = Math.min(1, elapsed / step.duration)
        
        // Ease in-out
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
        
        // Interpolate
        const currentZoom = startZoom + (step.targetZoom - startZoom) * eased
        const currentX = startX + (step.targetX - startX) * eased
        const currentY = startY + (step.targetY - startY) * eased
        
        setZoomLevel(currentZoom)
        setPanX(currentX)
        setPanY(currentY)
        setCurrentPhase(step.phase)
        
        // Update progress
        const totalDuration = timeline.reduce((sum, s) => sum + s.duration, 0)
        const completedDuration = timeline.slice(0, currentStep).reduce((sum, s) => sum + s.duration, 0) + elapsed
        setProgress(Math.round((completedDuration / totalDuration) * 100))
        
        drawFrame(img, currentZoom, currentX, currentY)
        
        if (t >= 1) {
          // Move to next step
          currentStep++
          stepStartTime = Date.now()
          startZoom = step.targetZoom
          startX = step.targetX
          startY = step.targetY
        }
        
        animationRef.current = requestAnimationFrame(animate)
      }
      
      // Initial draw
      drawFrame(img, 1, 0, 0)
      animationRef.current = requestAnimationFrame(animate)
    }
    
    img.src = imageUrl
  }, [imageUrl, annotations, keypoints, imageSize, drawFrame])
  
  // Stop animation
  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    setIsPlaying(false)
  }, [])
  
  // Initial draw
  useEffect(() => {
    if (!imageUrl) return
    
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = 600
      canvas.height = 500
      drawFrame(img, 1, 0, 0)
    }
    img.src = imageUrl
  }, [imageUrl, drawFrame])
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])
  
  if (!keypoints || !angles || annotations.length === 0) {
    return null
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[#FF6B35] font-bold text-sm uppercase tracking-wider mb-1">
            Animated Form Walkthrough
          </h3>
          <p className="text-slate-500 text-xs">Watch as we highlight each key point of your form</p>
        </div>
        <button
          onClick={downloadCanvas}
          className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#FF6B35] to-[#FF4500] hover:from-[#E55300] hover:to-[#E5A000] text-[#1a1a1a] font-semibold text-sm rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
      </div>
      
      {/* Canvas container */}
      <div ref={containerRef} className="relative flex justify-center">
        <canvas
          ref={canvasRef}
          width={600}
          height={500}
          className="rounded-lg border-2 border-black"
        />
        
        {/* Play button overlay */}
        {!isPlaying && currentPhase !== 'complete' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
            <button
              onClick={startAnimation}
              className="p-4 rounded-full bg-[#FF6B35] hover:bg-[#E55300] text-slate-900 transition-all transform hover:scale-110 shadow-2xl"
            >
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
          </div>
        )}
        
        {/* Phase indicator */}
        {isPlaying && (
          <div className="absolute top-4 left-4 bg-black/80 px-3 py-2 rounded-lg">
            <span className="text-[#FF6B35] text-sm font-bold">{currentPhase}</span>
          </div>
        )}
        
        {/* Replay button */}
        {currentPhase === 'complete' && (
          <div className="absolute bottom-4 right-4">
            <button
              onClick={startAnimation}
              className="px-4 py-2 rounded-lg bg-[#FF6B35] hover:bg-[#E55300] text-slate-900 font-bold text-sm transition-colors"
            >
              Replay
            </button>
          </div>
        )}
      </div>
      
      {/* Progress bar */}
      {isPlaying && (
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-[#FF6B35] h-2 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
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
  const uniqueId = React.useId()
  const colors = getScoreRingColors(score)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashArray = `${(score / 100) * circumference} ${circumference}`
  const center = size / 2
  const gradientId = `score-ring-gradient-${score}-${uniqueId.replace(/:/g, '')}`
  const glowId = `score-ring-glow-${score}-${uniqueId.replace(/:/g, '')}`

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
          <span className="text-slate-500 uppercase tracking-wider" style={{ fontSize: size * 0.1 }}>
            {label}
          </span>
        </div>
      )}
    </div>
  )
}

// Skeleton overlay demo data removed (no overlay display)

// Empty-state analysis — used when the user has NOT uploaded anything yet.
// Audit fix: this previously seeded fabricated demo numbers (78 OVR, a
// "Kevin Durant" match, full stat bars) that read as a real result. It now
// renders an honest zeroed empty state until a real analysis exists.
const DEFAULT_DEMO_ANALYSIS = {
  overallScore: 0,
  formCategory: "NEEDS_IMPROVEMENT" as const,
  measurements: { shoulderAngle: 0, elbowAngle: 0, hipAngle: 0, kneeAngle: 0, ankleAngle: 0, releaseHeight: 0, releaseAngle: 0, entryAngle: 0 },
  matchedShooter: { name: "—", team: "", similarityScore: 0, position: "" },
  shootingStats: { release: 0, form: 0, balance: 0, arc: 0, elbow: 0, follow: 0, consist: 0, power: 0 }
}

// Type for analysis data used throughout the results page
interface AnalysisData {
  overallScore: number
  formCategory: "EXCELLENT" | "GOOD" | "NEEDS_IMPROVEMENT" | "CRITICAL"
  measurements: { shoulderAngle: number; elbowAngle: number; hipAngle: number; kneeAngle: number; ankleAngle: number; releaseHeight: number; releaseAngle: number; entryAngle: number }
  matchedShooter: { name: string; team: string; similarityScore: number; position: string }
  shootingStats: { release: number; form: number; balance: number; arc: number; elbow: number; follow: number; consist: number; power: number }
  angles?: Record<string, number> // Raw angles from pose detection for Form Analysis Breakdown
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
    if (angle >= 85 && angle <= 95) return 95 // Elite: 95-100
    if (angle >= 80 && angle <= 100) return 85 // Pro: 85-95
    if (angle >= 75 && angle <= 105) return 75 // Advanced: 75-85
    if (angle >= 70 && angle <= 110) return 65 // Proficient: 65-75
    return Math.max(30, 60 - Math.abs(90 - angle)) // Below proficient
  }

  // Knee: optimal 45-55° bend (meaning 125-135° angle), acceptable 35-65° bend
  const calculateKneeScore = (angle: number): number => {
    // Convert to bend angle (180 - measured angle)
    const bendAngle = 180 - angle
    if (bendAngle >= 45 && bendAngle <= 55) return 95
    if (bendAngle >= 40 && bendAngle <= 60) return 85
    if (bendAngle >= 35 && bendAngle <= 65) return 75
    if (bendAngle >= 30 && bendAngle <= 70) return 65
    if (bendAngle < 20) return 40 // Too straight - insufficient knee bend
    return Math.max(30, 60 - Math.abs(50 - bendAngle))
  }

  // Balance: based on shoulder and hip tilt (should be close to 180° = level)
  const calculateBalanceScore = (shoulderTilt: number, hipTilt: number): number => {
    const shoulderDeviation = Math.abs(180 - shoulderTilt)
    const hipDeviation = Math.abs(180 - hipTilt)
    const totalDeviation = shoulderDeviation + hipDeviation
    if (totalDeviation <= 5) return 95 // Near perfect
    if (totalDeviation <= 10) return 85
    if (totalDeviation <= 15) return 75
    if (totalDeviation <= 20) return 65
    return Math.max(40, 80 - totalDeviation * 2)
  }

  const elbowScore = Math.round(calculateElbowScore(elbowAngle))
  const kneeScore = Math.round(calculateKneeScore(kneeAngle))
  const balanceScore = Math.round(calculateBalanceScore(shoulderTilt, hipTilt))

  // Ankle angle: use the real value from the hybrid pose backend when present
  // (left/right_ankle_angle). The backend does not always detect ankles, in
  // which case the value is unavailable rather than fabricated.
  const measuredAnkleAngle =
    hybridAngles.left_ankle_angle || hybridAngles.right_ankle_angle || null

  // Arc score: derived from the real release angle. A ball release/arc near
  // ~48° is ideal; score falls off with distance from that target. Only
  // computed when a real release angle is available.
  const measuredReleaseAngle = measurements.releaseAngle || hybridAngles.release_angle || null
  const arcScore =
    measuredReleaseAngle !== null
      ? Math.round(Math.max(40, 100 - Math.abs(48 - measuredReleaseAngle) * 2.5))
      : null

  // Consistency: a within-shot stability proxy derived from how well the two
  // sides of the body agree (left vs right elbow/knee symmetry). A true
  // shot-to-shot consistency score requires multiple shots, which a single
  // image does not provide; this single-frame symmetry is the closest honest
  // signal available. Null when both sides aren't detected.
  const haveBothElbows = !!(leftElbowAngle && rightElbowAngle)
  const haveBothKnees = !!(leftKneeAngle && rightKneeAngle)
  let consistScore: number | null = null
  if (haveBothElbows || haveBothKnees) {
    const symmetryPenalties: number[] = []
    if (haveBothElbows) symmetryPenalties.push(Math.abs(leftElbowAngle - rightElbowAngle))
    if (haveBothKnees) symmetryPenalties.push(Math.abs(leftKneeAngle - rightKneeAngle))
    const avgAsymmetry =
      symmetryPenalties.reduce((s, v) => s + v, 0) / symmetryPenalties.length
    consistScore = Math.round(Math.max(40, 100 - avgAsymmetry * 1.5))
  }

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
      // Real ankle angle from pose backend when detected; falls back to the
      // measured knee chain only as a last resort (ankle not always detected).
      ankleAngle: Math.round(measuredAnkleAngle ?? kneeAngle),
      releaseHeight: measurements.releaseHeight || 108,
      releaseAngle: measurements.releaseAngle || 52,
      entryAngle: 45,
    },
    shootingStats: {
      form: formScore,
      release: Math.round(measurements.releaseAngle ? (100 - Math.abs(52 - measurements.releaseAngle)) : 82),
      balance: balanceScore,
      // Arc derived from the real release angle; when no release angle was
      // measured, fall back to the (real) release score so the radar stays
      // coherent rather than inventing a constant.
      arc: arcScore ?? Math.round(measurements.releaseAngle ? (100 - Math.abs(52 - measurements.releaseAngle)) : 82),
      elbow: elbowScore,
      follow: measurements.followThrough || 78,
      // Single-frame left/right symmetry as a consistency proxy (true
      // shot-to-shot consistency needs multiple shots). When symmetry can't be
      // measured, fall back to the (real) balance score.
      consist: consistScore ?? balanceScore,
      power: kneeScore, // Power correlates with knee bend
    },
    matchedShooter: {
      name: a.similarProPlayer || "Stephen Curry",
      similarityScore: Math.min(95, Math.round(overallScore * 0.9)),
      team: "Golden State Warriors",
      position: "PG",
    },
    // Pass through raw angles for Form Analysis Breakdown
    angles: hybridAngles,
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
    if (value >= optMin && value <= optMax) return 85
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
      similarityScore: Math.min(95, Math.max(60, Math.round(formAnalysis.overallScore))),
      position: "SMALL_FORWARD"
    },
    shootingStats: {
      release: releaseScore,
      form: formScore,
      balance: balanceScore,
      arc: 70,
      elbow: elbowScore,
      follow: 70,
      consist: 65,
      power: Math.round(calculateScore(kneeAngle, 130, 160, 30))
    },
    // Convert formAnalysis angles to the format expected by generateFixesFromAngles
    angles: formAnalysis.angles?.reduce((acc, a) => {
      // Map angle names to expected keys
      if (a.name === 'Elbow Angle') {
        acc['right_elbow_angle'] = a.angle
      } else if (a.name === 'Knee Bend') {
        acc['right_knee_angle'] = a.angle
      } else if (a.name === 'Shoulder Angle') {
        acc['shoulder_tilt'] = a.angle
      }
      return acc
    }, {} as Record<string, number>) || {}
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
  { id: "elite", title: "ELITE SHOOTER", description: "Exceptional across all metrics", icon: <Trophy className="w-5 h-5" />, color: "#FF6B35", gradient: "from-[#FF6B35] to-[#FF4500]" },
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

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Something went wrong</h3>
          <p className="text-gray-400 mb-4">Please try refreshing the page.</p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
            className="px-4 py-2 bg-[#FF6B35] text-[#1a1a1a] rounded-lg font-semibold"
          >
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

function DemoResultsPageContent() {
  const { isAuthenticated, user } = useAuthStore()
  const profileStore = useProfileStore()

  // Load profile from database on mount if authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      profileStore.fetchProfile(user.id)
    }
  }, [isAuthenticated, user?.id])

  const displayHeight = useMemo(() => {
    if (!profileStore.heightInches) return "6'2\"";
    const feet = Math.floor(profileStore.heightInches / 12);
    const inches = profileStore.heightInches % 12;
    return `${feet}'${inches}"`;
  }, [profileStore.heightInches]);

  const displayWeight = useMemo(() => {
    return profileStore.weightLbs ? `${profileStore.weightLbs} LB` : "185 LB";
  }, [profileStore.weightLbs]);

  const displayAge = useMemo(() => {
    return profileStore.age ? String(profileStore.age) : "34";
  }, [profileStore.age]);

  const displayExperience = useMemo(() => {
    const level = profileStore.experienceLevel;
    if (!level) return "PRO";
    if (level === "beginner") return "BEG";
    if (level === "intermediate") return "INT";
    if (level === "advanced") return "ADV";
    if (level === "professional") return "PRO";
    return level.substring(0, 3).toUpperCase();
  }, [profileStore.experienceLevel]);

  const displayLeague = useMemo(() => {
    const tier = profileStore.coachingTier;
    if (!tier) return "REC";
    if (tier === "elementary") return "ELEM";
    if (tier === "middle_school") return "MID";
    if (tier === "high_school") return "HS";
    if (tier === "college") return "COL";
    if (tier === "professional") return "PRO";
    return tier.replace('_', ' ').toUpperCase();
  }, [profileStore.coachingTier]);

  const [resultsMode, setResultsMode] = useState<ResultsMode>("image")
  const [isLoading, setIsLoading] = useState(false)
  const [showFabMenu, setShowFabMenu] = useState(false)
  const videoUploadInputRef = useRef<HTMLInputElement>(null)

  // Use the dedicated video flow so every upload gets an orientation-correct
  // preview and optional hoop calibration before analysis starts.
  const openVideoPicker = useCallback(() => {
    setShowFabMenu(false)
    window.location.assign('/upload?mode=video')
  }, [])

  // Processing screen state for 7-stage popup
  const [showProcessingScreen, setShowProcessingScreen] = useState(false)
  const [processingComplete, setProcessingComplete] = useState(false)
  const [processingError, setProcessingError] = useState<string | null>(null)
  const [processingInputType, setProcessingInputType] = useState<InputType>("3_images")

  // Get uploaded image and form analysis from store - hooks must be called unconditionally
  const storeData = useAnalysisStore()
  
  const { formAnalysisResult, visionAnalysisResult, playerProfile, poseConfidence, teaserFrames, fullFrames, allUploadedUrls, uploadedImageBase64, roboflowBallDetection, videoAnalysisData, mediaType, setUploadedImageBase64, setVideoAnalysisData, setVisionAnalysisResult, setMediaType } = storeData || {}
  
  // 🎒 BACKPACK SYSTEM: Load latest sessions by media type from session storage
  const [latestImageSession, setLatestImageSession] = useState<AnalysisSession | null>(null)
  const [latestVideoSession, setLatestVideoSession] = useState<AnalysisSession | null>(null)
  
  // Load latest sessions from unified session storage on mount
  useEffect(() => {
    try {
    // 🎒 BLUE BACKPACK: Load latest IMAGE session
    const imageSession = getLatestSessionByMediaType('image')
    if (imageSession) {
      setLatestImageSession(imageSession)
      console.log("🎒 Loaded latest IMAGE session:", imageSession.displayDate)
    }
    
    // 🎒 RED BACKPACK: Load latest VIDEO session
    const videoSession = getLatestSessionByMediaType('video')
    if (videoSession) {
      setLatestVideoSession(videoSession)
      console.log("🎒 Loaded latest VIDEO session:", videoSession.displayDate)
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
    }
  }, [])
  
  // Reload sessions when resultsMode changes (switching tabs)
  useEffect(() => {
    try {
    if (resultsMode === 'image') {
      const imageSession = getLatestSessionByMediaType('image')
      if (imageSession) {
        setLatestImageSession(imageSession)
        console.log("🎒 Switched to IMAGE tab - loaded session:", imageSession.displayDate)
      }
    } else if (resultsMode === 'video') {
      const videoSession = getLatestSessionByMediaType('video')
      if (videoSession) {
        setLatestVideoSession(videoSession)
        console.log("🎒 Switched to VIDEO tab - loaded session:", videoSession.displayDate)
      }
      }
    } catch (error) {
      console.error('Error switching tabs:', error)
    }
  }, [resultsMode])
  
  // Auto-select Video tab when mediaType is VIDEO
  useEffect(() => {
    if (mediaType === "VIDEO" && videoAnalysisData) {
      setResultsMode("video")
    }
  }, [mediaType, videoAnalysisData])
  
  // 🎒 IMAGE TAB: ONLY show data if an image was uploaded in this session
  // Do NOT fall back to stored sessions - keep IMAGE and VIDEO completely separate
  const imageMainUrl = useMemo(() => {
    // Only show image data if mediaType is IMAGE (user uploaded an image)
    if (mediaType === "IMAGE") {
      if (uploadedImageBase64) return uploadedImageBase64
      if (allUploadedUrls.length > 0) return allUploadedUrls[0]
    }
    // Return null if no image uploaded - show empty upload state
    return null
  }, [uploadedImageBase64, allUploadedUrls, mediaType])
  
  const imageVisionAnalysis = useMemo(() => {
    // Only show vision analysis if mediaType is IMAGE (user uploaded an image)
    if (mediaType === "IMAGE" && visionAnalysisResult) {
      return visionAnalysisResult
    }
    // Return null if no image uploaded - show empty upload state
    return null
  }, [visionAnalysisResult, mediaType])
  
  // 🎒 VIDEO TAB: ONLY show data if a video was uploaded in this session
  // Do NOT fall back to stored sessions - keep IMAGE and VIDEO completely separate
  const videoMainUrl = useMemo(() => {
    // Only show video data if mediaType is VIDEO (user uploaded a video)
    if (mediaType === "VIDEO") {
      if (videoAnalysisData?.annotatedFramesBase64?.[0]) return videoAnalysisData.annotatedFramesBase64[0]
      if (uploadedImageBase64) return uploadedImageBase64
    }
    // Return null if no video uploaded - show empty upload state
    return null
  }, [videoAnalysisData, uploadedImageBase64, mediaType])
  
  const videoVisionAnalysis = useMemo(() => {
    // Only show vision analysis if mediaType is VIDEO (user uploaded a video)
    if (mediaType === "VIDEO" && visionAnalysisResult) {
      return visionAnalysisResult
    }
    // Return null if no video uploaded - show empty upload state
    return null
  }, [visionAnalysisResult, mediaType])
  
  const effectiveVideoData = useMemo(() => {
    // Only show video data if mediaType is VIDEO (user uploaded a video)
    if (mediaType === "VIDEO" && videoAnalysisData) {
      return videoAnalysisData
    }
    // Return null if no video uploaded - show empty upload state
    return null
  }, [videoAnalysisData, mediaType])
  
  // Use base64 image (persists across navigation) or fall back to blob URL
  // This is the original mainImageUrl for backward compatibility
  const mainImageUrl = uploadedImageBase64 || (allUploadedUrls.length > 0 ? allUploadedUrls[0] : null)
  
  // Prefer Vision AI results, fall back to form analysis
  // For IMAGE tab, use imageVisionAnalysis; for VIDEO tab, use videoVisionAnalysis
  const analysisData = useMemo(() => {
    const effectiveVision = resultsMode === "video" ? videoVisionAnalysis : imageVisionAnalysis
    const visionData = convertVisionToAnalysisData(effectiveVision)
    if (visionData) return visionData
    return convertFormAnalysisToAnalysisData(formAnalysisResult)
  }, [resultsMode, imageVisionAnalysis, videoVisionAnalysis, formAnalysisResult])

  // Get player name from profile or use default
  const playerName = useMemo(() => {
    if (user?.displayName) return user.displayName.toUpperCase()
    if (user?.firstName || user?.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim().toUpperCase()
    }
    return "PLAYER" // Neutral fallback — no fabricated identity
  }, [user])

  return (
    <main className="min-h-[calc(100vh-200px)] py-8 px-4 bg-slate-50">
        <div className="container mx-auto max-w-5xl">
          {/* Collapsible Stats Card - Shows on all devices */}
          <CollapsibleStatsCard />
          
          {/* Main Content - Full Width */}
          <div className="mt-4">
            <div className="bg-white rounded-lg overflow-hidden shadow-lg">
              {/* Tab Navigation - Hidden on mobile (FAB handles it) */}
              <div className="py-5">
                <div className="flex items-center justify-center">
                  {/* Modern Segmented Control */}
                  <div className="inline-flex rounded-full bg-black p-1 gap-0.5 shadow-lg shadow-black/20">
                    {(["video", "image", "live"] as ResultsMode[]).map((mode) => (
                      <button 
                        key={mode} 
                        onClick={() => {
                          try {
                            setResultsMode(mode)
                          } catch (error) {
                            console.error('Error switching tab:', error)
                          }
                        }} 
                        className={`relative px-7 py-2.5 rounded-full flex items-center justify-center gap-2 transition-all duration-300 uppercase font-bold text-xs tracking-widest ${resultsMode === mode ? "bg-[#FF6B35] text-white shadow-lg shadow-[#FF6B35]/30" : "text-slate-400 hover:text-white"}`}
                      >
                        {mode === "video" && <Video className="w-4 h-4" />}
                        {mode === "image" && <ImageIcon className="w-4 h-4" />}
                        {mode === "live" && <Radio className="w-4 h-4" />}
                        <span>{mode}</span>
                        {mode === "live" && (
                          <span className={`absolute -top-1.5 -right-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full ${resultsMode === "live" ? "bg-white text-[#FF6B35]" : "bg-[#FF6B35] text-white"}`}>
                            NEW
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Hidden file inputs for uploads */}
              <input
                type="file"
                id="shotiq-image-upload-input"
                accept="image/*,.heic,.heif"
                ref={(el) => { if (el) (window as any).__imageUploadInput = el }}
                className="sr-only"
                onChange={async (e) => {
                  setShowFabMenu(false)
                  const file = e.target.files?.[0]
                  console.log('📸 Image file selected:', file?.name, file?.size)
                  if (file) {
                    try {
                      console.log('📸 Starting image analysis...')
                      setResultsMode("image")
                      
                      // Show 7-stage processing screen
                      setProcessingInputType("3_images")
                      setProcessingComplete(false)
                      setProcessingError(null)
                      setShowProcessingScreen(true)
                      
                      // Import the hybrid analysis service
                      const { analyzeShootingForm } = await import('@/services/visionAnalysis')
                      const { createSessionFromAnalysis, saveSession } = await import('@/services/sessionStorage')
                      const { detectFlawsFromAngles, getShooterLevel } = await import('@/data/shootingFlawsDatabase')
                      
                      // Convert file to base64 for storage
                      const reader = new FileReader()
                      const base64Promise = new Promise<string>((resolve) => {
                        reader.onload = (event) => resolve(event.target?.result as string)
                        reader.readAsDataURL(file)
                      })
                      const imageBase64 = await base64Promise
                      
                      // Call the hybrid backend
                      console.log('📸 Calling hybrid analyzeShootingForm...')
                      const analysisResult = await analyzeShootingForm(file)
                      console.log('📸 Analysis result:', analysisResult)
                      
                      if (!analysisResult.success) {
                        console.error('Image analysis failed:', analysisResult.error)
                        setProcessingError(analysisResult.error || 'Image analysis failed')
                        return
                      }
                      
                      // Store the image
                      setUploadedImageBase64(imageBase64)
                      
                      // Set media type to IMAGE
                      setMediaType?.("IMAGE")
                      
                      // Store the vision analysis result
                      storeData?.setVisionAnalysisResult?.(analysisResult as any)
                      
                      // Save session
                      const overallScore = analysisResult.overall_score || analysisResult.analysis?.overallScore || 70
                      const angles = analysisResult.angles || analysisResult.analysis?.measurements || {}
                      const detectedFlaws = detectFlawsFromAngles(angles).map((f: any) => f.name)
                      const shooterLevel = getShooterLevel(overallScore)
                      
                      const session = createSessionFromAnalysis(
                        imageBase64,
                        imageBase64, // skeleton image (same for now)
                        [], // screenshots
                        {
                          overallScore,
                          shooterLevel: shooterLevel.name,
                          angles,
                          detectedFlaws,
                          measurements: angles
                        },
                        storeData?.playerProfile?.name || 'Player',
                        undefined,
                        undefined,
                        1 // imagesAnalyzed
                      )
                      
                      saveSession(session)
                      console.log('✅ Image session saved:', session.id)
                      
                      // Signal processing complete - the popup will close after animations finish
                      setProcessingComplete(true)
                      
                    } catch (err) {
                      console.error('Image upload error:', err)
                      setProcessingError(err instanceof Error ? err.message : 'Failed to process image')
                    }
                  }
                  e.target.value = '' // Reset for next upload
                }}
              />
              <input
                type="file"
                id="shotiq-video-upload-input"
                accept="video/*,.mov,.mp4"
                ref={videoUploadInputRef}
                className="sr-only"
                onChange={async (e) => {
                  setShowFabMenu(false)
                  const file = e.target.files?.[0]
                  console.log('📹 Video file selected:', file?.name, file?.size)
                  if (file) {
                    const captureSessionPromise = createCaptureSession(buildCaptureSessionMetadata({
                      mode: 'form',
                      source: 'uploaded_video',
                      platform: normalizeCapturePlatform(getPlatformOS()),
                      deviceModel: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 255) : undefined,
                      readinessStatus: 'recording',
                    })).then((session) => session.id).catch(() => null)
                    const resolveCaptureSessionId = async (): Promise<string | null> => {
                      try {
                        return await Promise.race([
                          captureSessionPromise,
                          new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
                        ])
                      } catch {
                        return null
                      }
                    }
                    let captureSessionId: string | null = null
                    const markCaptureSession = async (
                      readinessStatus: 'completed' | 'failed',
                      error?: unknown,
                    ) => {
                      const updateStatus = (id: string) => updateCaptureSession(id, {
                        readinessStatus,
                        endedAt: new Date(),
                        readinessChecks: {
                          source: 'results_video_upload',
                          error: error instanceof Error ? error.message : undefined,
                        },
                      }, { timeoutMs: 2_000 }).catch(() => undefined)
                      const id = captureSessionId ?? await resolveCaptureSessionId()
                      if (!id) {
                        void captureSessionPromise.then((lateId) => {
                          if (lateId) return updateStatus(lateId)
                        }).catch(() => undefined)
                        return
                      }
                      await updateStatus(id)
                    }
                    try {
                      console.log('📹 Starting video analysis...')
                      // Import video analysis service
                      const { analyzeVideoShooting, convertVideoToSessionFormat } = await import('@/services/videoAnalysis')
                      const { createSessionFromAnalysis, saveSession } = await import('@/services/sessionStorage')
                      const { detectFlawsFromAngles, getShooterLevel } = await import('@/data/shootingFlawsDatabase')
                      
                      // Show 7-stage processing screen
                      setResultsMode("video")
                      setProcessingInputType("1_video")
                      setProcessingComplete(false)
                      setProcessingError(null)
                      setShowProcessingScreen(true)
                      
                      // Call Python backend to analyze video
                      console.log('📹 Calling analyzeVideoShooting...')
                      const analysisResult = await analyzeVideoShooting(file)
                      console.log('📹 Analysis result:', analysisResult)
                      
                      if (!analysisResult.success) {
                        console.error('Video analysis failed:', analysisResult.error)
                        await markCaptureSession('failed', new Error(analysisResult.error || 'Video analysis failed'))
                        setProcessingError(analysisResult.error || 'Video analysis failed')
                        return
                      }
                      
                      // Convert to session format
                      const sessionData = convertVideoToSessionFormat(analysisResult)
                      if (sessionData.overallScore === null) {
                        await markCaptureSession('failed', new Error('No trusted shooting mechanics were detected'))
                        setProcessingError('No trusted shooting mechanics were detected in this video. Try a clearer full-body capture.')
                        return
                      }

                      captureSessionId = await resolveCaptureSessionId()

                      // Persist the actual detector phases before rendering
                      // Results. Signed-in users receive server IDs and the
                      // review timeline hydrates corrections for those rows;
                      // signed-out/offline viewers retain an explicitly local,
                      // review-only timeline instead of pretending it saved.
                      const detectorEvents = (analysisResult.phases || []).map((phase: any, index: number) => {
                        const frame = analysisResult.frame_data?.[phase.frame]
                        return {
                          sequence: index,
                          timestampMs: Math.max(0, Math.round(Number(phase.timestamp || 0) * 1000)),
                          startFrame: Number.isFinite(Number(phase.frame)) ? Number(phase.frame) : undefined,
                          endFrame: Number.isFinite(Number(phase.frame)) ? Number(phase.frame) : undefined,
                          detected: true,
                          detectedResult: "unknown" as const,
                          detectedPhase: String(phase.phase || "unknown"),
                          confidence: typeof frame?.confidence === "number" ? frame.confidence : undefined,
                          phaseMarkers: { phase: String(phase.phase || "unknown") },
                          metadata: { source: "results_video_upload", frameIndex: phase.frame },
                        }
                      })
                      const persistedShotEvents = captureSessionId
                        ? await persistShotEvents(detectorEvents, captureSessionId)
                        : null
                      const shotEvents = persistedShotEvents ?? createLocalReviewShotEvents(detectorEvents, 'results_video_upload')
                      
                      // Store main image in analysis store
                      storeData?.setUploadedImageBase64?.(sessionData.mainImageBase64)
                      
                      // Set media type to VIDEO
                      setMediaType?.("VIDEO")
                      
                      // Set video analysis data with ALL the data from Python backend
                      console.log('📹 Setting video analysis data with', analysisResult.annotated_frames_base64?.length, 'frames')
                      storeData?.setVideoAnalysisData?.({
                        videoUrl: URL.createObjectURL(file),
                        captureSessionId,
                        frames: analysisResult.frame_data || [],
                        annotatedFramesBase64: analysisResult.annotated_frames_base64,
                        fps: analysisResult.fps || 10,
                        frameData: analysisResult.frame_data,
                        keyScreenshots: analysisResult.key_screenshots,
                        allKeypoints: analysisResult.all_keypoints,
                        phases: analysisResult.phases,
                        metrics: analysisResult.metrics,
                        shotEvents,
                        canonicalObservation: analysisResult.canonicalObservation,
                      })
                      console.log('📹 Video analysis data set in store')
                      
                      // Create vision analysis result for compatibility
                      const visionResult = {
                        success: true,
                        overall_score: sessionData.overallScore,
                        keypoints: sessionData.keypoints || undefined,
                        angles: sessionData.angles,
                        feedback: sessionData.feedback.map((msg: string) => ({ type: 'info', area: 'general', message: msg })),
                        analysis: {
                          overallScore: sessionData.overallScore,
                          category: sessionData.overallScore >= 85 ? 'EXCELLENT' : sessionData.overallScore >= 65 ? 'GOOD' : 'NEEDS_IMPROVEMENT',
                          bodyPositions: {},
                          strengths: sessionData.strengths,
                          improvements: sessionData.improvements,
                          measurements: sessionData.angles
                        }
                      }
                      
                      storeData?.setVisionAnalysisResult?.(visionResult as any)
                      
                      // Save session
                      const detectedFlaws = detectFlawsFromAngles(sessionData.angles).map((f: any) => f.name)
                      const shooterLevel = getShooterLevel(sessionData.overallScore)
                      const videoData = {
                        ...sessionData.videoData,
                        captureSessionId,
                        shotEvents,
                      }
                      
                      const session = createSessionFromAnalysis(
                        sessionData.mainImageBase64,
                        sessionData.skeletonImageBase64,
                        sessionData.screenshots.map((ss: any, idx: number) => ({
                          id: `video-${idx}`,
                          label: ss.label,
                          imageBase64: ss.imageBase64,
                          analysis: ss.analysis
                        })),
                        {
                          overallScore: sessionData.overallScore,
                          shooterLevel: shooterLevel.name,
                          angles: sessionData.angles,
                          detectedFlaws,
                          measurements: sessionData.angles
                        },
                        storeData?.playerProfile?.name || 'Player',
                        undefined,
                        undefined,
                        analysisResult.key_screenshots?.length || 3,
                        'video',
                        videoData,
                      )
                      
                      saveSession(session)
                      console.log("✅ Video session saved:", session.id)

                      if (captureSessionId) {
                        void updateCaptureSession(captureSessionId, {
                          readinessStatus: 'completed',
                          endedAt: new Date(),
                          ...(analysisResult.video_info?.width && analysisResult.video_info?.height
                            ? {
                                orientation: normalizeCaptureOrientation(
                                  analysisResult.video_info.width >= analysisResult.video_info.height
                                    ? 'landscape'
                                    : 'portrait',
                                ),
                              }
                            : {}),
                          frameWidth: analysisResult.video_info?.width,
                          frameHeight: analysisResult.video_info?.height,
                          observation: {
                            timestampMs: Math.max(0, Math.round((analysisResult.video_info?.duration ?? 0) * 1000)),
                            orientation: 'unknown',
                            poseConfidence: analysisResult.frame_data?.reduce((sum: number, frame: any) =>
                              sum + (frame?.canonicalObservation?.poseConfidence ?? 0), 0
                            ) / Math.max(1, analysisResult.frame_data?.length ?? 0),
                            fullBodyVisible: (analysisResult.frame_data?.at(-1)?.keypoint_count ?? 0) >= 12,
                            stable: true,
                            lighting: 'unknown',
                          },
                          readinessChecks: {
                            source: 'results_video_upload',
                            analyzedFrames: analysisResult.frame_count ?? analysisResult.video_info?.extracted_frames ?? 0,
                            trustedScore: sessionData.overallScore,
                          },
                        }, { timeoutMs: 2_000 }).catch(() => undefined)
                      } else {
                        void captureSessionPromise.then(async (lateSessionId) => {
                          if (!lateSessionId) return
                          let lateShotEvents = null
                          try {
                            lateShotEvents = await persistShotEvents(detectorEvents, lateSessionId)
                          } finally {
                            const reconciledShotEvents = lateShotEvents ?? shotEvents
                            const updatedSession = updateSessionVideoCaptureIdentity(
                              session,
                              lateSessionId,
                              reconciledShotEvents,
                            )
                            saveSession(updatedSession)
                            await updateCaptureSession(lateSessionId, {
                              readinessStatus: 'completed',
                              endedAt: new Date(),
                              ...(analysisResult.video_info?.width && analysisResult.video_info?.height
                                ? {
                                    orientation: normalizeCaptureOrientation(
                                      analysisResult.video_info.width >= analysisResult.video_info.height
                                        ? 'landscape'
                                        : 'portrait',
                                    ),
                                    frameWidth: analysisResult.video_info.width,
                                    frameHeight: analysisResult.video_info.height,
                                  }
                                : {}),
                              observation: {
                                timestampMs: Math.max(0, Math.round((analysisResult.video_info?.duration ?? 0) * 1000)),
                                orientation: 'unknown',
                                poseConfidence: (analysisResult.frame_data?.reduce((sum: number, frame: any) =>
                                  sum + (frame?.canonicalObservation?.poseConfidence ?? 0), 0
                                ) ?? 0) / Math.max(1, analysisResult.frame_data?.length ?? 0),
                                fullBodyVisible: (analysisResult.frame_data?.at(-1)?.keypoint_count ?? 0) >= 12,
                                stable: true,
                                lighting: 'unknown',
                              },
                              readinessChecks: {
                                source: 'results_video_upload',
                                analyzedFrames: analysisResult.frame_count ?? analysisResult.video_info?.extracted_frames ?? 0,
                                trustedScore: sessionData.overallScore,
                              },
                            }, { timeoutMs: 2_000 }).catch(() => undefined)
                          }
                        }).catch(() => undefined)
                      }
                      
                      // Signal processing complete - the popup will close after animations finish
                      setProcessingComplete(true)
                      
                    } catch (err) {
                      console.error('Video upload error:', err)
                      await markCaptureSession('failed', err)
                      setProcessingError(err instanceof Error ? err.message : 'Failed to process video')
                    }
                  }
                  e.target.value = '' // Reset for next upload
                }}
              />

              {/* FAB (Floating Action Button) - Modern Professional Design */}
              <div className="fixed bottom-24 right-4 z-50">
                {/* FAB Menu - Glass morphism style */}
                {showFabMenu && (
                  <>
                    {/* Backdrop with blur */}
                    <div 
                      className="fixed inset-0 bg-black/40 backdrop-blur-sm -z-10"
                      onClick={() => setShowFabMenu(false)}
                    />
                    
                    {/* Menu Container - Modern card style */}
                    <div className="absolute bottom-16 right-0 mb-3 flex flex-col gap-2 items-end">
                      {/* Analyze Shot - opens the image analysis view */}
                      <button
                        onClick={() => {
                          setResultsMode('image')
                          setShowFabMenu(false)
                        }}
                        className="group flex items-center gap-3 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl pl-5 pr-3 py-2.5 shadow-xl transition-all duration-200 hover:bg-slate-50/95 hover:scale-[1.02] animate-in slide-in-from-bottom-2 fade-in duration-200"
                        style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
                      >
                        <span className="text-slate-700 text-sm font-bold whitespace-nowrap tracking-wide group-hover:text-slate-900">Analyze Shot</span>
                        <div className="w-9 h-9 bg-[#FF6B35]/10 rounded-xl flex items-center justify-center border border-[#FF6B35]/20 group-hover:bg-[#FF6B35]/20 transition-colors">
                          <Target className="w-4.5 h-4.5 text-[#FF6B35]" />
                        </div>
                      </button>
                      
                      {/* Upload Image */}
                      <label
                        htmlFor="shotiq-image-upload-input"
                        className="group flex cursor-pointer items-center gap-3 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl pl-5 pr-3 py-2.5 shadow-xl transition-all duration-200 hover:bg-slate-50/95 hover:scale-[1.02] animate-in slide-in-from-bottom-2 fade-in duration-200 delay-75"
                        style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
                      >
                        <span className="text-slate-700 text-sm font-bold whitespace-nowrap tracking-wide group-hover:text-slate-900">Upload Image</span>
                        <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 group-hover:bg-slate-200 transition-colors">
                          <ImageIcon className="w-4.5 h-4.5 text-slate-700" />
                        </div>
                      </label>
                      
                      {/* Upload Video */}
                      <button
                        type="button"
                        onClick={openVideoPicker}
                        className="group flex cursor-pointer items-center gap-3 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl pl-5 pr-3 py-2.5 shadow-xl transition-all duration-200 hover:bg-slate-50/95 hover:scale-[1.02] animate-in slide-in-from-bottom-2 fade-in duration-200 delay-100"
                        style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
                      >
                        <span className="text-slate-700 text-sm font-bold whitespace-nowrap tracking-wide group-hover:text-slate-900">Upload Video</span>
                        <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 group-hover:bg-slate-200 transition-colors">
                          <Video className="w-4.5 h-4.5 text-slate-700" />
                        </div>
                      </button>
                      
                      {/* Live Camera */}
                      <button
                        onClick={() => {
                          setResultsMode("live")
                          setShowFabMenu(false)
                        }}
                        className="group flex items-center gap-3 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl pl-5 pr-3 py-2.5 shadow-xl transition-all duration-200 hover:bg-slate-50/95 hover:scale-[1.02] animate-in slide-in-from-bottom-2 fade-in duration-200 delay-150"
                        style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
                      >
                        <span className="text-slate-700 text-sm font-bold whitespace-nowrap tracking-wide group-hover:text-slate-900">Live Camera</span>
                        <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 group-hover:bg-slate-200 transition-colors">
                          <Radio className="w-4.5 h-4.5 text-slate-700" />
                        </div>
                      </button>
                    </div>
                  </>
                )}
                
                {/* Main FAB Button - Modern Professional Design */}
                <button
                  onClick={() => {
                    setShowFabMenu(!showFabMenu)
                  }}
                  className={`
                    group relative flex items-center justify-center w-14 h-14 rounded-2xl
                    transition-all duration-300 ease-out border
                    ${showFabMenu 
                      ? 'bg-slate-100 border-slate-300 rotate-45 scale-95' 
                      : 'bg-[#111827] border-[#111827] hover:scale-110 active:scale-95'
                    }
                  `}
                  aria-label="Quick actions"
                  style={{
                    boxShadow: showFabMenu 
                      ? '0 4px 20px rgba(0,0,0,0.05)' 
                      : '0 12px 30px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.1)'
                  }}
                >
                  {/* Glow ring effect */}
                  <div className={`
                    absolute inset-0 rounded-2xl transition-opacity duration-300
                    ${showFabMenu ? 'opacity-0' : 'opacity-100'}
                  `} style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)',
                    borderRadius: 'inherit'
                  }} />
                  
                  {/* Pulse animation ring */}
                  {!showFabMenu && (
                    <div className="absolute inset-0 rounded-2xl animate-ping opacity-[0.15] bg-[#111827]" style={{ animationDuration: '2s' }} />
                  )}
                  
                  {/* Icon */}
                  <Plus className={`
                    w-6 h-6 relative z-10 transition-all duration-300
                    ${showFabMenu ? 'text-slate-500' : 'text-white drop-shadow-sm group-hover:text-[#FF6B35]'}
                  `} strokeWidth={2.5} />
                </button>
              </div>
              {/* 🎒 VIDEO TAB: Uses red backpack (effectiveVideoData, videoMainUrl, videoVisionAnalysis) */}
              {resultsMode === "video" && (
                    <ErrorBoundary>
                      <VideoModeContent
                        videoData={effectiveVideoData || null}
                        analysisData={analysisData || null}
                        playerName={playerName || 'Player'} 
                        poseConfidence={poseConfidence || null} 
                        teaserFrames={teaserFrames || []} 
                        fullFrames={fullFrames || []} 
                        allUploadedUrls={allUploadedUrls || []} 
                        mainImageUrl={videoMainUrl || null} 
                        visionAnalysis={videoVisionAnalysis || null} 
                        roboflowBallDetection={roboflowBallDetection || null} 
                      />
                    </ErrorBoundary>
                  )}
              {/* 🎒 IMAGE TAB: Uses blue backpack (imageMainUrl, imageVisionAnalysis) */}
                  {resultsMode === "image" && (
                    <ErrorBoundary>
                      <ImageModeContent
                        analysisData={analysisData || null}
                        playerName={playerName || 'Player'} 
                        poseConfidence={poseConfidence || null} 
                        teaserFrames={teaserFrames || []} 
                        fullFrames={fullFrames || []} 
                        allUploadedUrls={allUploadedUrls || []} 
                        mainImageUrl={imageMainUrl || null} 
                        visionAnalysis={imageVisionAnalysis || null} 
                        roboflowBallDetection={roboflowBallDetection || null} 
                      />
                    </ErrorBoundary>
                  )}
              {/* 📹 LIVE TAB: Real-time camera analysis */}
                  {resultsMode === "live" && (
                    <ErrorBoundary>
                      <FullscreenLiveCamera onClose={() => setResultsMode("image")} />
                    </ErrorBoundary>
                  )}
            </div>
          </div>
        </div>
        
        {/* 7-Stage Processing Screen Popup */}
        <AnalysisProgressScreen
          isVisible={showProcessingScreen}
          inputType={processingInputType}
          actualProcessingComplete={processingComplete}
          errorMessage={processingError}
          onComplete={() => {
            setShowProcessingScreen(false)
            setProcessingComplete(false)
            setProcessingError(null)
          }}
          onCancel={() => {
            setShowProcessingScreen(false)
            setProcessingComplete(false)
            setProcessingError(null)
          }}
          onRetry={() => {
            setProcessingError(null)
            setShowProcessingScreen(false)
            // User will need to click upload again
          }}
        />
      </main>
  )
}

// ============================================================
// COLLAPSIBLE STATS CARD COMPONENT
// Shows level, XP, streak, and rank in a compact collapsible format
// ============================================================

function CollapsibleStatsCard() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showStreakPopup, setShowStreakPopup] = useState(false)
  const [showLeaderboardPopup, setShowLeaderboardPopup] = useState(false)
  const [showMilestonesPopup, setShowMilestonesPopup] = useState(false)
  
  // ── Real data: points/tier come from the server-reconciled points ledger,
  // streak + badges from /api/badges, leaderboard rank from /api/leaderboard.
  // No fabricated numbers — empty/zero states render until data arrives.
  const { state: pointsState, getCurrentTierConfig, getNextTierConfig } = usePoints()
  const [serverStreak, setServerStreak] = useState<number | null>(null)
  const [latestBadge, setLatestBadge] = useState<{ name: string; earnedDate: string } | null>(null)
  const [leaderboardRank, setLeaderboardRank] = useState<number | null>(null)
  const [totalUsers, setTotalUsers] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    const badgeNameById = new Map(ALL_BADGES.map((b) => [b.id, b.name]))
    const titleCase = (id: string) =>
      id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

    async function load() {
      try {
        const res = await fetch("/api/badges", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          if (!cancelled && data?.success) {
            if (typeof data.stats?.currentStreak === "number") {
              setServerStreak(data.stats.currentStreak)
            }
            // Most recently earned, unlocked badge.
            const earned = Object.entries(data.badges || {})
              .map(([id, b]) => ({ id, ...(b as { unlocked: boolean; earnedDate: string | null }) }))
              .filter((b) => b.unlocked && b.earnedDate)
              .sort((a, b) => new Date(b.earnedDate!).getTime() - new Date(a.earnedDate!).getTime())
            if (earned.length > 0) {
              const top = earned[0]
              setLatestBadge({
                name: (badgeNameById.get(top.id) || titleCase(top.id)).toUpperCase(),
                earnedDate: new Date(top.earnedDate!)
                  .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  .toUpperCase(),
              })
            }
          }
        }
      } catch (err) {
        console.error("Failed to load badges for stats card:", err)
      }

      // Leaderboard rank needs the caller's profile id (server-derived).
      try {
        const profRes = await fetch("/api/profile", { credentials: "include" })
        const profData = profRes.ok ? await profRes.json() : null
        const profileId = profData?.profile?.id
        const lbRes = await fetch(
          `/api/leaderboard${profileId ? `?userProfileId=${encodeURIComponent(profileId)}` : ""}`,
          { credentials: "include" }
        )
        if (lbRes.ok) {
          const lb = await lbRes.json()
          if (!cancelled && lb?.success) {
            setTotalUsers(typeof lb.totalParticipants === "number" ? lb.totalParticipants : null)
            setLeaderboardRank(typeof lb.userRank === "number" && lb.userRank > 0 ? lb.userRank : null)
          }
        }
      } catch (err) {
        console.error("Failed to load leaderboard for stats card:", err)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const tierConfig = getCurrentTierConfig()
  const nextTierConfig = getNextTierConfig()
  const userStats = {
    level: TIER_ORDER.indexOf(pointsState.currentTier) + 1,
    levelName: tierConfig.displayName,
    xp: pointsState.totalPoints,
    maxXp: nextTierConfig ? nextTierConfig.pointsRequired : tierConfig.pointsRequired,
    dailyStreak: serverStreak ?? 0,
    leaderboardRank,
    totalUsers,
    latestBadge,
  }

  // Progress is measured WITHIN the current tier band toward the next tier.
  const progressPercent = nextTierConfig
    ? Math.max(
        0,
        Math.min(
          100,
          ((pointsState.totalPoints - tierConfig.pointsRequired) /
            Math.max(1, nextTierConfig.pointsRequired - tierConfig.pointsRequired)) *
            100
        )
      )
    : 100

  return (
    <div className="bg-black rounded-2xl border-2 border-black overflow-hidden shadow-lg">
      {/* Sports Card — Collapsed View */}
      <div className="w-full flex items-stretch cursor-pointer" style={{ minHeight: '80px' }}>
        
        {/* Left Orange Panel — OVR Circle */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowMilestonesPopup(true); }}
          className="flex-shrink-0 w-[85px] md:w-[100px] bg-[#FF6B35] flex items-center justify-center hover:bg-[#FF5722] transition-colors"
        >
          <div className="relative w-14 h-14 md:w-16 md:h-16">
            <svg viewBox="0 0 64 64" className="w-full h-full">
              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="3" />
              <circle 
                cx="32" cy="32" r="28" fill="none" 
                stroke="white" strokeWidth="3.5" strokeLinecap="round"
                strokeDasharray={`${progressPercent * 1.76} 176`}
                transform="rotate(-90 32 32)"
                className="transition-all duration-700"
              />
              <circle cx="32" cy="32" r="23" fill="rgba(0,0,0,0.35)" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-white font-black text-xl md:text-2xl leading-none">{userStats.level}</span>
              <span className="text-white/60 text-[7px] font-bold uppercase tracking-widest">OVR</span>
            </div>
          </div>
        </button>

        {/* Center — Name + Hash Progress Bar */}
        <div className="flex-1 bg-gradient-to-r from-[#1a1a1a] to-[#222] px-4 md:px-5 py-2.5 flex flex-col justify-center min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-white/60 text-[10px] md:text-xs font-semibold uppercase tracking-wider">Lv.{userStats.level}</span>
            <span className="text-white font-black text-sm md:text-lg uppercase tracking-tight truncate">{userStats.levelName}</span>
          </div>
          {/* Hash mark progress bar — full width */}
          <div className="flex items-center gap-[2px] mt-2 w-full">
            {Array.from({ length: 30 }).map((_, i) => {
              const barPercent = (i + 1) * (100 / 30);
              const isFilled = progressPercent >= barPercent;
              return (
                <div
                  key={i}
                  className={`flex-1 h-[10px] md:h-[12px] ${isFilled ? 'bg-[#FF6B35]' : 'bg-white/10'}`}
                  style={{ borderRadius: '1px' }}
                />
              );
            })}
          </div>
          <div className="text-white/50 text-[9px] md:text-[10px] font-medium mt-1 tracking-wide">
            {userStats.xp.toLocaleString()} / {userStats.maxXp.toLocaleString()} XP
          </div>
        </div>

        {/* Right — Streak + Expand */}
        <div className="flex-shrink-0 bg-white flex items-center gap-1 px-4 md:px-6 border-l border-slate-200">
          <div className="flex flex-col items-center">
            <Flame className="w-4 h-4 text-[#FF6B35] fill-white mb-0.5" />
            <span className="text-[#FF6B35] font-black text-3xl md:text-4xl leading-none tracking-tighter">{userStats.dailyStreak}</span>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-white/10 rounded-full transition-all ml-1"
          >
            <svg viewBox="0 0 20 20" className={`w-4 h-4 text-white/30 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
              <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Tier Milestones Popup */}
      <TierMilestonesPopup 
        isOpen={showMilestonesPopup} 
        onClose={() => setShowMilestonesPopup(false)} 
      />
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 md:px-4 pb-3 md:pb-4 border-t border-black bg-[#252525]">
          <div className="pt-3 md:pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* XP Progress (Mobile) */}
            <div className="sm:hidden">
              <div className="text-slate-500 text-xs uppercase mb-1 font-bold tracking-wider">Progress</div>
              <div className="bg-white rounded-xl p-3">
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="font-black text-[#FF6B35]">{userStats.xp} XP</span>
                  <span className="text-slate-400 font-semibold">{userStats.maxXp} XP</span>
                </div>
                {/* Stepped XP blocks — Mobile */}
                <div className="flex gap-[2px] h-5">
                  {Array.from({ length: 20 }).map((_, i) => {
                    const blockPercent = (i + 1) * 5;
                    const isFilled = progressPercent >= blockPercent;
                    const isActive = progressPercent >= blockPercent - 5 && progressPercent < blockPercent;
                    return (
                      <div
                        key={i}
                        className={`flex-1 rounded-sm transition-all duration-300 ${
                          isFilled 
                            ? 'bg-gradient-to-t from-[#FF4500] to-[#FF6B35] shadow-[0_0_4px_rgba(255,107,53,0.4)]' 
                            : isActive 
                              ? 'bg-gradient-to-t from-[#FF4500]/60 to-[#FF6B35]/60 animate-pulse shadow-[0_0_6px_rgba(255,107,53,0.5)]' 
                              : 'bg-slate-200/60'
                        }`}
                        style={{
                          borderRadius: i === 0 ? '4px 2px 2px 4px' : i === 19 ? '2px 4px 4px 2px' : '2px',
                        }}
                      />
                    );
                  })}
                </div>
                {/* Level milestone markers */}
                <div className="flex justify-between mt-1.5">
                  {[`Lv.${userStats.level}`, '25%', '50%', '75%', `Lv.${userStats.level + 1}`].map((label, i) => (
                    <span key={i} className={`text-[8px] font-bold uppercase tracking-wider ${
                      i === 0 ? 'text-[#FF6B35]' : i === 4 ? 'text-slate-400' : 'text-slate-300'
                    }`}>{label}</span>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Latest Badge */}
            <Link href="/badges" className="bg-white rounded-lg p-3 hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <PhStar size={14} weight="duotone" color="#FF6B35" />
                <span className="text-slate-500 text-xs uppercase">Latest Badge</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF4500] flex items-center justify-center">
                  <PhTrend size={18} weight="duotone" className="text-white" />
                </div>
                <div>
                  <div className="text-slate-900 text-sm font-medium">{userStats.latestBadge?.name ?? "NO BADGES YET"}</div>
                  <div className="text-slate-500 text-xs">{userStats.latestBadge?.earnedDate ?? "Earn your first badge"}</div>
                </div>
              </div>
            </Link>
            
            {/* Daily Streak */}
            <button 
              onClick={(e) => { e.stopPropagation(); setShowStreakPopup(true); }}
              className="bg-white rounded-lg p-3 hover:bg-slate-100 transition-colors text-left"
            >
              <div className="flex items-center gap-2 mb-1">
                <PhFire size={14} weight="duotone" color="#f97316" />
                <span className="text-slate-500 text-xs uppercase">Daily Streak</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                  <PhFire size={18} weight="duotone" className="text-white" />
                </div>
                <div>
                  <div className="text-slate-900 text-sm font-bold">{userStats.dailyStreak} DAYS</div>
                  <div className="text-slate-500 text-xs">Keep it going!</div>
                </div>
              </div>
            </button>
            
            {/* Leaderboard */}
            <button 
              onClick={(e) => { e.stopPropagation(); setShowLeaderboardPopup(true); }}
              className="bg-white rounded-lg p-3 hover:bg-slate-100 transition-colors text-left"
            >
              <div className="flex items-center gap-2 mb-1">
                <PhCrown size={14} weight="duotone" color="#FF6B35" />
                <span className="text-slate-500 text-xs uppercase">Leaderboard</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF4500] flex items-center justify-center">
                  <PhCrown size={18} weight="duotone" className="text-white" />
                </div>
                <div>
                  <div className="text-slate-900 text-sm font-bold">{userStats.leaderboardRank ? `#${userStats.leaderboardRank}` : "Unranked"}</div>
                  <div className="text-slate-500 text-xs">{userStats.totalUsers ? `of ${userStats.totalUsers.toLocaleString()} users` : "No ranking yet"}</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// OVERLAY TOGGLE CONTROLS
// ============================================================
interface OverlayToggles {
  skeleton: boolean
  joints: boolean
  annotations: boolean
  basketball: boolean
}

interface OverlayControlsProps {
  toggles: OverlayToggles
  setToggles: React.Dispatch<React.SetStateAction<OverlayToggles>>
}

function OverlayControls({ toggles, setToggles }: OverlayControlsProps) {
  const toggleItems = [
    { key: 'skeleton' as const, label: 'Skeleton Lines', icon: GitBranch },
    { key: 'joints' as const, label: 'Joint Points', icon: Circle },
    { key: 'annotations' as const, label: 'Annotations', icon: Tag },
    { key: 'basketball' as const, label: 'Basketball', icon: CircleDot },
  ]

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-white rounded-lg border-2 border-black">
      <span className="text-slate-500 text-xs uppercase tracking-wider mr-2 flex items-center">
        <Layers className="w-3 h-3 mr-1" /> Overlays:
      </span>
      {toggleItems.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setToggles(prev => ({ ...prev, [key]: !prev[key] }))}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            toggles[key]
              ? 'bg-[#FF6B35]/20 text-[#FF6B35] border border-[#FF6B35]/50'
              : 'bg-white text-slate-500 border-2 border-black hover:border-black'
          }`}
        >
          {toggles[key] ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          <Icon className="w-3 h-3" />
          {label}
        </button>
      ))}
    </div>
  )
}

// ============================================================
// VIDEO FRAME CANVAS - Draws overlays based on toggle state
// With BIGGER labels, offset wireframe, and video game effects
// ============================================================
interface VideoFrameCanvasProps {
  rawFrame?: string // Base64 raw frame (no overlays)
  annotatedFrame?: string // Base64 annotated frame (with all overlays)
  keypoints?: Record<string, { x: number; y: number; confidence: number; source?: string }>
  ball?: { x: number; y: number; radius: number } | null
  toggles: OverlayToggles
  phase?: string
  timestamp?: number
  angles?: Record<string, number> // Angle measurements to display as annotations
  // Video game effects
  playerGlow?: boolean
  glowColor?: string
  glowIntensity?: number
  motionTrails?: boolean
  previousKeypoints?: Array<Record<string, { x: number; y: number; confidence: number }>>
  // Zoom and spotlight for video sequence
  zoomTarget?: { x: number; y: number; scale: number } | null
  spotlightTarget?: { x: number; y: number } | null
}

function VideoFrameCanvas({ 
  rawFrame, 
  annotatedFrame, 
  keypoints, 
  ball, 
  toggles, 
  phase, 
  timestamp, 
  angles,
  playerGlow = true,
  glowColor = '#FF6B35',
  glowIntensity = 5,
  motionTrails = false,
  previousKeypoints = [],
  zoomTarget = null,
  spotlightTarget = null
}: VideoFrameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 640, height: 480 })
  
  // SKELETON stays ON the body (no offset)
  const WIREFRAME_OFFSET_X = 0
  const WIREFRAME_OFFSET_Y = 0
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Determine which frame to use as base
    const frameToUse = rawFrame || annotatedFrame
    if (!frameToUse) return
    
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      // Set canvas size
      canvas.width = img.width
      canvas.height = img.height
      setDimensions({ width: img.width, height: img.height })
      
      // Draw base image
      ctx.drawImage(img, 0, 0)
      
      // ============================================
      // PLAYER GLOW EFFECT (Video Game Style)
      // ============================================
      if (playerGlow && keypoints) {
        // Create glow around the player silhouette
        ctx.save()
        ctx.shadowColor = glowColor
        ctx.shadowBlur = glowIntensity * 8
        ctx.strokeStyle = glowColor
        ctx.lineWidth = 4
        ctx.globalAlpha = 0.7
        
        // Draw glow outline around player
        const bodyParts = ['left_shoulder', 'right_shoulder', 'right_hip', 'left_hip']
        const validParts = bodyParts.filter(p => keypoints[p])
        if (validParts.length >= 3) {
          ctx.beginPath()
          const first = keypoints[validParts[0]]
          ctx.moveTo(first.x + WIREFRAME_OFFSET_X, first.y + WIREFRAME_OFFSET_Y)
          validParts.forEach(part => {
            const pt = keypoints[part]
            ctx.lineTo(pt.x + WIREFRAME_OFFSET_X, pt.y + WIREFRAME_OFFSET_Y)
          })
          ctx.closePath()
          ctx.stroke()
        }
        ctx.restore()
      }
      
      // ============================================
      // MOTION TRAILS (Video Game Style)
      // ============================================
      if (motionTrails && previousKeypoints.length > 0) {
        const trailParts = ['right_wrist', 'left_wrist', 'right_elbow', 'left_elbow']
        
        previousKeypoints.forEach((prevKp, idx) => {
          const alpha = (idx + 1) / previousKeypoints.length * 0.5
          ctx.globalAlpha = alpha
          
          trailParts.forEach(part => {
            if (prevKp[part]) {
              const pt = prevKp[part]
              ctx.beginPath()
              ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2)
              ctx.fillStyle = '#60a5fa'
              ctx.fill()
            }
          })
        })
        ctx.globalAlpha = 1
      }
      
      // If all toggles are on and we have annotated frame, just show it
      if (toggles.skeleton && toggles.joints && toggles.annotations && toggles.basketball && annotatedFrame && !rawFrame) {
        // Still draw our custom overlays on top
      }
      
      // If using raw frame OR we want custom overlays, draw them
      if (keypoints) {
        const w = img.width
        const h = img.height
        
        // Skeleton connections
        const skeleton = [
          ['nose', 'left_shoulder'], ['nose', 'right_shoulder'],
          ['left_shoulder', 'right_shoulder'],
          ['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist'],
          ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'],
          ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'],
          ['left_hip', 'right_hip'],
          ['left_hip', 'left_knee'], ['left_knee', 'left_ankle'],
          ['right_hip', 'right_knee'], ['right_knee', 'right_ankle'],
        ]
        
        // Draw skeleton lines - OFFSET FROM BODY
        if (toggles.skeleton) {
          // Outer glow
          ctx.strokeStyle = 'rgba(250, 204, 21, 0.3)'
          ctx.lineWidth = 12
          skeleton.forEach(([start, end]) => {
            if (keypoints[start] && keypoints[end]) {
              ctx.beginPath()
              ctx.moveTo(keypoints[start].x + WIREFRAME_OFFSET_X, keypoints[start].y + WIREFRAME_OFFSET_Y)
              ctx.lineTo(keypoints[end].x + WIREFRAME_OFFSET_X, keypoints[end].y + WIREFRAME_OFFSET_Y)
              ctx.stroke()
            }
          })
          
          // Main line
          ctx.strokeStyle = '#facc15' // Yellow
          ctx.lineWidth = 5
          skeleton.forEach(([start, end]) => {
            if (keypoints[start] && keypoints[end]) {
              ctx.beginPath()
              ctx.moveTo(keypoints[start].x + WIREFRAME_OFFSET_X, keypoints[start].y + WIREFRAME_OFFSET_Y)
              ctx.lineTo(keypoints[end].x + WIREFRAME_OFFSET_X, keypoints[end].y + WIREFRAME_OFFSET_Y)
              ctx.stroke()
            }
          })
        }
        
        // Draw joint points - OFFSET FROM BODY with BIGGER circles
        if (toggles.joints) {
          Object.entries(keypoints).forEach(([name, pt]) => {
            const x = pt.x + WIREFRAME_OFFSET_X
            const y = pt.y + WIREFRAME_OFFSET_Y
            // BIGGER joint circles
            const radius = name.includes('wrist') ? 16 : name.includes('elbow') || name.includes('knee') ? 14 : 10
            
            // Determine color based on body part
            let color = '#facc15' // Default yellow
            if (name.includes('wrist') || name.includes('elbow')) {
              color = '#4ade80' // Green for arms
            } else if (name.includes('knee') || name.includes('ankle') || name.includes('hip')) {
              color = '#60a5fa' // Blue for legs
            }
            
            // Outer glow
            ctx.beginPath()
            ctx.arc(x, y, radius + 6, 0, Math.PI * 2)
            ctx.fillStyle = color.replace(')', ', 0.3)').replace('rgb', 'rgba').replace('#', '')
            ctx.shadowColor = color
            ctx.shadowBlur = 15
            ctx.fill()
            ctx.shadowBlur = 0
            
            // Main circle
            ctx.beginPath()
            ctx.arc(x, y, radius, 0, Math.PI * 2)
            ctx.fillStyle = color
            ctx.fill()
            ctx.strokeStyle = 'white'
            ctx.lineWidth = 3
            ctx.stroke()
          })
        }
        
        // Draw basketball - BIGGER with glow
        if (toggles.basketball && ball) {
          // Outer glow
          ctx.beginPath()
          ctx.arc(ball.x, ball.y, ball.radius + 10, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(249, 115, 22, 0.4)'
          ctx.lineWidth = 8
          ctx.stroke()
          
          // Main circle
          ctx.beginPath()
          ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
          ctx.strokeStyle = '#f97316' // Orange
          ctx.lineWidth = 5
          ctx.stroke()
          
          // Center dot
          ctx.beginPath()
          ctx.arc(ball.x, ball.y, 8, 0, Math.PI * 2)
          ctx.fillStyle = '#f97316'
          ctx.fill()
        }
      }
      
      // ============================================
      // HUGE TIMER (upper right corner)
      // ============================================
      if (timestamp !== undefined) {
        const timerWidth = 280
        const timerHeight = 120
        const timerX = img.width - timerWidth - 30
        const timerY = 25
        
        // Background with gradient
        const gradient = ctx.createLinearGradient(timerX, timerY, timerX, timerY + timerHeight)
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.95)')
        gradient.addColorStop(1, 'rgba(20, 20, 20, 0.95)')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.roundRect(timerX, timerY, timerWidth, timerHeight, 20)
        ctx.fill()
        
        // Glowing border
        ctx.shadowColor = '#FF6B35'
        ctx.shadowBlur = 15
        ctx.strokeStyle = '#FF6B35'
        ctx.lineWidth = 5
        ctx.beginPath()
        ctx.roundRect(timerX, timerY, timerWidth, timerHeight, 20)
        ctx.stroke()
        ctx.shadowBlur = 0
        
        // Time text - MASSIVE 80px font
        ctx.fillStyle = '#FF6B35'
        ctx.font = 'bold 80px monospace'
        ctx.textAlign = 'center'
        ctx.shadowColor = '#FF6B35'
        ctx.shadowBlur = 10
        ctx.fillText(`${timestamp.toFixed(2)}s`, timerX + timerWidth / 2, timerY + 90)
        ctx.shadowBlur = 0
      }
      
      // ============================================
      // ANGLE LABELS - Away from body, MOVES WITH body part
      // ============================================
      if (toggles.annotations && keypoints && angles) {
        ctx.textAlign = 'left'
        
        // Angle ranges for feedback
        const angleRanges: Record<string, { ideal: number; range: [number, number] }> = {
          'elbow_angle': { ideal: 90, range: [85, 100] },
          'right_elbow_angle': { ideal: 90, range: [85, 100] },
          'knee_angle': { ideal: 145, range: [135, 160] },
          'right_knee_angle': { ideal: 145, range: [135, 160] },
          'shoulder_tilt': { ideal: 0, range: [-5, 5] },
          'hip_tilt': { ideal: 0, range: [-8, 8] },
        }
        
        // Generate feedback comment based on angle value
        const getFeedback = (angleKey: string, value: number): { text: string; status: 'good' | 'warning' | 'bad' } => {
          const config = angleRanges[angleKey]
          if (!config) return { text: '', status: 'good' }
          
          const [min, max] = config.range
          if (value >= min && value <= max) {
            return { text: 'EXCELLENT! WITHIN ELITE RANGE', status: 'good' }
          } else if (Math.abs(value - config.ideal) <= 15) {
            const diff = value < min ? Math.round(min - value) : Math.round(value - max)
            return { 
              text: value < min ? `INCREASE BY ${diff}°` : `DECREASE BY ${diff}°`, 
              status: 'warning' 
            }
          } else {
            const diff = value < min ? Math.round(min - value) : Math.round(value - max)
            return { 
              text: value < min ? `TOO LOW - NEED ${diff}° MORE` : `TOO HIGH - REDUCE ${diff}°`, 
              status: 'bad' 
            }
          }
        }
        
        // Labels - ALTERNATING ORDER: 1st RIGHT, 2nd LEFT, 3rd RIGHT, 4th LEFT
        const annotationConfig: Array<{
          angleKey: string
          label: string
          keypointName: string
          color: string
          verticalSlot: number  // 0=top, 1=upper-mid, 2=lower-mid, 3=bottom (for spacing)
        }> = [
          // 1st label - ELBOW - will be on RIGHT
          { angleKey: 'elbow_angle', label: 'ELBOW ANGLE', keypointName: 'right_elbow', color: '#4ade80', verticalSlot: 0 },
          { angleKey: 'right_elbow_angle', label: 'ELBOW ANGLE', keypointName: 'right_elbow', color: '#4ade80', verticalSlot: 0 },
          // 2nd label - SHOULDER - will be on LEFT
          { angleKey: 'shoulder_tilt', label: 'SHOULDER', keypointName: 'right_shoulder', color: '#facc15', verticalSlot: 1 },
          // 3rd label - HIP - will be on RIGHT
          { angleKey: 'hip_tilt', label: 'HIP ALIGN', keypointName: 'right_hip', color: '#f97316', verticalSlot: 2 },
          // 4th label - KNEE - will be on LEFT
          { angleKey: 'knee_angle', label: 'KNEE BEND', keypointName: 'right_knee', color: '#60a5fa', verticalSlot: 3 },
          { angleKey: 'right_knee_angle', label: 'KNEE BEND', keypointName: 'right_knee', color: '#60a5fa', verticalSlot: 3 },
        ]
        
        const drawnLabels = new Set<string>()
        let labelIndex = 0
        
        // Label dimensions - wider to fit feedback comment text
        const labelWidth = 340
        const labelHeight = 130
        
        annotationConfig.forEach(({ angleKey, label, keypointName, color, verticalSlot }) => {
          const angleValue = angles[angleKey]
          const keypoint = keypoints[keypointName]
          
          if (angleValue !== undefined && keypoint && !drawnLabels.has(label)) {
            drawnLabels.add(label)
            
            // Get feedback comment
            const feedback = getFeedback(angleKey, angleValue)
            const feedbackColor = feedback.status === 'good' ? '#4ade80' : feedback.status === 'warning' ? '#facc15' : '#ef4444'
            
            // Body part position
            const kpX = keypoint.x
            const kpY = keypoint.y
            
            // RULE: ALTERNATING SIDES - labels close to player, not touching
            const isRightSide = labelIndex % 2 === 0
            
            // Offset from keypoint - just outside the body
            const bodyOffset = 150
            const rawX = isRightSide 
              ? kpX + bodyOffset
              : kpX - labelWidth - bodyOffset
            
            // Keep within image
            const labelX = Math.max(20, Math.min(img.width - labelWidth - 20, rawX))
            const labelY = Math.max(20, Math.min(img.height - labelHeight - 20, kpY - labelHeight / 2))
            labelIndex++
            
            // Draw connecting line
            ctx.strokeStyle = color
            ctx.lineWidth = 3
            ctx.shadowColor = color
            ctx.shadowBlur = 10
            ctx.beginPath()
            ctx.moveTo(labelX + labelWidth / 2, labelY + labelHeight / 2)
            ctx.lineTo(kpX, kpY)
            ctx.stroke()
            ctx.shadowBlur = 0
            
            // Draw circle at keypoint
            ctx.beginPath()
            ctx.arc(kpX, kpY, 12, 0, Math.PI * 2)
            ctx.fillStyle = color
            ctx.fill()
            ctx.strokeStyle = 'white'
            ctx.lineWidth = 3
            ctx.stroke()
            
            // Label background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
            ctx.beginPath()
            ctx.roundRect(labelX, labelY, labelWidth, labelHeight, 14)
            ctx.fill()
            
            // Label border
            ctx.strokeStyle = color
            ctx.lineWidth = 4
            ctx.beginPath()
            ctx.roundRect(labelX, labelY, labelWidth, labelHeight, 14)
            ctx.stroke()
            
            // Label text - BIG (28px)
            ctx.fillStyle = 'white'
            ctx.font = 'bold 28px system-ui'
            ctx.textAlign = 'left'
            ctx.fillText(label, labelX + 16, labelY + 36)
            
            // Angle value - BIG (48px)
            ctx.fillStyle = color
            ctx.font = 'bold 48px monospace'
            ctx.fillText(`${Math.round(angleValue)}°`, labelX + 16, labelY + 82)
            
            // Feedback comment
            ctx.fillStyle = feedbackColor
            ctx.font = 'bold 16px system-ui'
            ctx.fillText(feedback.text, labelX + 16, labelY + 115)
          }
        })
      }
      
      // ============================================
      // SPOTLIGHT EFFECT (when zooming on body part)
      // ============================================
      if (spotlightTarget) {
        // Draw dark overlay with circular cutout for spotlight
        ctx.save()
        
        // Create a radial gradient for spotlight effect
        const spotlightRadius = 120
        const gradient = ctx.createRadialGradient(
          spotlightTarget.x, spotlightTarget.y, 0,
          spotlightTarget.x, spotlightTarget.y, spotlightRadius * 2
        )
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
        gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)')
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)')
        
        // Draw dark overlay
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, img.width, img.height)
        
        // Draw glowing ring around spotlight
        ctx.beginPath()
        ctx.arc(spotlightTarget.x, spotlightTarget.y, spotlightRadius, 0, Math.PI * 2)
        ctx.strokeStyle = '#FF6B35'
        ctx.lineWidth = 6
        ctx.shadowColor = '#FF6B35'
        ctx.shadowBlur = 30
        ctx.stroke()
        ctx.shadowBlur = 0
        
        // Draw inner ring
        ctx.beginPath()
        ctx.arc(spotlightTarget.x, spotlightTarget.y, spotlightRadius - 15, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)'
        ctx.lineWidth = 3
        ctx.stroke()
        
        ctx.restore()
      }
      
      // ============================================
      // PHASE INDICATOR (bottom left, video game style)
      // ============================================
      if (phase) {
        const phaseWidth = 220
        const phaseHeight = 60
        const phaseX = 25
        const phaseY = img.height - phaseHeight - 25
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
        ctx.beginPath()
        ctx.roundRect(phaseX, phaseY, phaseWidth, phaseHeight, 12)
        ctx.fill()
        
        // Border
        ctx.strokeStyle = '#a855f7'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.roundRect(phaseX, phaseY, phaseWidth, phaseHeight, 12)
        ctx.stroke()
        
        // Phase text
        ctx.fillStyle = '#a855f7'
        ctx.font = 'bold 14px system-ui'
        ctx.textAlign = 'left'
        ctx.fillText('PHASE', phaseX + 15, phaseY + 22)
        
        ctx.fillStyle = 'white'
        ctx.font = 'bold 28px system-ui'
        ctx.fillText(phase.toUpperCase(), phaseX + 15, phaseY + 50)
      }
    }
    
    img.src = `data:image/jpeg;base64,${frameToUse}`
  }, [rawFrame, annotatedFrame, keypoints, ball, toggles, phase, timestamp, angles, playerGlow, glowColor, glowIntensity, motionTrails, previousKeypoints, WIREFRAME_OFFSET_X, WIREFRAME_OFFSET_Y, zoomTarget, spotlightTarget])
  
  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      className="max-w-full max-h-full object-contain"
    />
  )
}

// ============================================================
// ANNOTATION DROPDOWN LIST
// ============================================================
interface AnnotationFix {
  id: string
  name: string
  status: 'good' | 'warning' | 'bad'
  yourValue: number
  eliteValue: number
  feedback: string
  eliteExample: string
  explanation: string
}

interface AnnotationDropdownListProps {
  fixes: AnnotationFix[]
}

function AnnotationDropdownList({ fixes }: AnnotationDropdownListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const statusColors = {
    good: { bg: 'bg-green-500/10', border: 'border-green-500/50', text: 'text-green-400', dot: 'bg-green-500' },
    warning: { bg: 'bg-orange-500/10', border: 'border-orange-500/50', text: 'text-orange-400', dot: 'bg-orange-500' },
    bad: { bg: 'bg-red-500/10', border: 'border-red-500/50', text: 'text-red-400', dot: 'bg-red-500' },
  }

  const statusLabels = {
    good: 'GOOD',
    warning: 'ADJUST',
    bad: 'FIX THIS',
  }

  // Hide entirely if no fixes detected (instead of showing empty message)
  if (!fixes || fixes.length === 0) {
    return null
  }

  return (
    <div className="space-y-2 mt-4">
      <h4 className="text-slate-500 text-xs uppercase tracking-wider flex items-center gap-2 mb-3">
        <ClipboardList className="w-3 h-3" />
        Form Analysis Breakdown
      </h4>
      {fixes.map((fix, index) => {
        const colors = statusColors[fix.status]
        const isExpanded = expandedId === fix.id

        return (
          <div
            key={fix.id}
            className={`rounded-lg border ${colors.border} ${colors.bg} overflow-hidden transition-all`}
          >
            {/* Header - Always visible */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : fix.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Status indicator */}
                <div className={`w-3 h-3 rounded-full ${colors.dot}`} />
                
                {/* Fix number */}
                <span className="text-slate-500 text-sm font-mono">#{index + 1}</span>
                
                {/* Name */}
                <span className="text-slate-900 font-medium">{fix.name}</span>
                
                {/* Status badge */}
                <span className={`text-xs px-2 py-0.5 rounded ${colors.text} ${colors.bg} border ${colors.border}`}>
                  {statusLabels[fix.status]}
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Quick values */}
                <div className="text-right hidden sm:block">
                  <span className="text-slate-900 font-mono">{fix.yourValue}°</span>
                  <span className="text-slate-500 mx-2">vs</span>
                  <span className="text-[#FF6B35] font-mono">{fix.eliteValue}°</span>
                </div>
                
                {/* Expand icon */}
                <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-black/50">
                <div className="pt-4 space-y-4">
                  {/* Values comparison */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-slate-500 text-xs uppercase mb-1">Your Angle</p>
                      <p className="text-2xl font-bold text-slate-900">{fix.yourValue}°</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-slate-500 text-xs uppercase mb-1">Elite Target</p>
                      <p className="text-2xl font-bold text-[#FF6B35]">{fix.eliteValue}°</p>
                    </div>
                  </div>

                  {/* Feedback */}
                  <div className={`p-3 rounded-lg ${colors.bg} border ${colors.border}`}>
                    <p className={`font-medium ${colors.text}`}>{fix.feedback}</p>
                  </div>

                  {/* Explanation */}
                  <div>
                    <p className="text-slate-500 text-xs uppercase mb-2">How to Fix</p>
                    <p className="text-slate-900 text-sm leading-relaxed">{fix.explanation}</p>
                  </div>

                  {/* Elite example */}
                  <div className="flex items-start gap-2 text-sm">
                    <Trophy className="w-4 h-4 text-[#FF6B35] mt-0.5 flex-shrink-0" />
                    <p className="text-slate-500">{fix.eliteExample}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Helper function to generate fixes from angles
function generateFixesFromAngles(angles: Record<string, number>): AnnotationFix[] {
  const fixes: AnnotationFix[] = []
  
  const angleConfig: Record<string, { name: string; ideal: number; range: [number, number]; eliteExample: string; explanation: string }> = {
    'right_elbow_angle': {
      name: 'Elbow Angle',
      ideal: 90,
      range: [85, 100],
      eliteExample: 'Steph Curry maintains 88° elbow angle at set position',
      explanation: 'Your elbow should form roughly a 90° angle at the set position. This creates optimal power transfer and consistency. Practice holding the ball at your set point and checking your elbow position in a mirror.'
    },
    'left_elbow_angle': {
      name: 'Elbow Angle',
      ideal: 90,
      range: [85, 100],
      eliteExample: 'Steph Curry maintains 88° elbow angle at set position',
      explanation: 'Your elbow should form roughly a 90° angle at the set position. This creates optimal power transfer and consistency. Practice holding the ball at your set point and checking your elbow position in a mirror.'
    },
    'right_knee_angle': {
      name: 'Knee Bend',
      ideal: 145,
      range: [135, 160],
      eliteExample: 'Klay Thompson uses 142° knee bend for explosive lift',
      explanation: 'Proper knee bend provides the power base for your shot. Too little bend means you\'re using arm strength; too much wastes energy. Focus on a comfortable athletic stance with knees tracking over toes.'
    },
    'left_knee_angle': {
      name: 'Knee Bend',
      ideal: 145,
      range: [135, 160],
      eliteExample: 'Klay Thompson uses 142° knee bend for explosive lift',
      explanation: 'Proper knee bend provides the power base for your shot. Too little bend means you\'re using arm strength; too much wastes energy. Focus on a comfortable athletic stance with knees tracking over toes.'
    },
    'shoulder_tilt': {
      name: 'Shoulder Alignment',
      ideal: 0,
      range: [-5, 5],
      eliteExample: 'Ray Allen maintained near-perfect 0° shoulder tilt',
      explanation: 'Your shoulders should be level and square to the basket. Tilting causes the ball to drift left or right. Practice in front of a mirror, focusing on keeping shoulders parallel to the floor.'
    },
    'hip_tilt': {
      name: 'Hip Alignment',
      ideal: 0,
      range: [-8, 8],
      eliteExample: 'Kevin Durant keeps stable hip base throughout shot',
      explanation: 'Your hips provide the foundation for balance. Uneven hips cause inconsistent shots and can lead to injury. Focus on distributing weight evenly and keeping hips square to the target.'
    }
  }

  for (const [key, value] of Object.entries(angles)) {
    const config = angleConfig[key]
    if (!config) continue

    const [min, max] = config.range
    let status: 'good' | 'warning' | 'bad'
    let feedback: string

    if (value >= min && value <= max) {
      status = 'good'
      feedback = 'Excellent! Your angle is within the elite range.'
    } else if (Math.abs(value - config.ideal) <= 15) {
      status = 'warning'
      feedback = value < min 
        ? `Slightly low - increase by ${Math.round(min - value)}° to reach optimal range`
        : `Slightly high - decrease by ${Math.round(value - max)}° to reach optimal range`
    } else {
      status = 'bad'
      feedback = value < min
        ? `Too low - you need ${Math.round(min - value)}° more to reach the minimum elite range`
        : `Too high - reduce by ${Math.round(value - max)}° to reach the maximum elite range`
    }

    fixes.push({
      id: key,
      name: config.name,
      status,
      yourValue: Math.round(value),
      eliteValue: config.ideal,
      feedback,
      eliteExample: config.eliteExample,
      explanation: config.explanation
    })
  }

  // Sort: bad first, then warning, then good
  const statusOrder = { bad: 0, warning: 1, good: 2 }
  fixes.sort((a, b) => statusOrder[a.status] - statusOrder[b.status])

  return fixes
}

// VideoModeContent interface - same as ImageModeContent plus videoData
interface VideoModeContentProps extends ImageModeContentProps {
  videoData: ReturnType<typeof useAnalysisStore>['videoAnalysisData']
}

// VideoModeContent: Video player at top, then EXACT same content as ImageModeContent
function VideoModeContent({ videoData, analysisData, playerName, poseConfidence, teaserFrames, fullFrames, allUploadedUrls, mainImageUrl, visionAnalysis, roboflowBallDetection }: VideoModeContentProps) {
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false) // For cover screen
  const [isFullscreen, setIsFullscreen] = useState(false)
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const sequenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  
  // Note: Dashboard view state is managed by ImageModeContent which is rendered below
  // The view preference is stored in localStorage and shared across both modes
  
  // Video sequence state
  type SequencePhase = 'initial' | 'firstPlaythrough' | 'labelZoom' | 'bodyPartZoom' | 'slowMo' | 'complete'
  const [sequencePhase, setSequencePhase] = useState<SequencePhase>('initial')
  const [currentAnnotationIndex, setCurrentAnnotationIndex] = useState(0)
  const [zoomTarget, setZoomTarget] = useState<{ x: number; y: number; scale: number } | null>(null)
  const [spotlightTarget, setSpotlightTarget] = useState<{ x: number; y: number } | null>(null)
  
  // Annotation labels for the sequence
  const annotationLabels = [
    { label: 'ELBOW ANGLE', keypointName: 'right_elbow' },
    { label: 'KNEE BEND', keypointName: 'right_knee' },
    { label: 'SHOULDER', keypointName: 'right_shoulder' },
    { label: 'HIP ALIGN', keypointName: 'right_hip' },
  ]
  
  // Overlay toggle state - Default ON to show keypoints and labels
  const [overlayToggles, setOverlayToggles] = useState<OverlayToggles>({
    skeleton: true,
    joints: true,
    annotations: true,
    basketball: true
  })
  
  // Clear all timeouts on unmount
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current)
      if (sequenceTimeoutRef.current) clearTimeout(sequenceTimeoutRef.current)
    }
  }, [])
  
  // Fullscreen toggle function
  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return
    
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true)
      }).catch(err => {
        console.error('Error entering fullscreen:', err)
      })
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
      }).catch(err => {
        console.error('Error exiting fullscreen:', err)
      })
    }
  }
  
  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])
  
  // Video sequence controller
  useEffect(() => {
    if (!videoData?.annotatedFramesBase64?.length) return
    
    const totalFrames = videoData.annotatedFramesBase64.length
    const fps = videoData.fps || 10
    
    // Handle sequence phases
    if (sequencePhase === 'firstPlaythrough' && isPlaying) {
      // Normal playback - when it ends, move to label zoom
      // This is handled in the frame advancement logic below
    }
    
    if (sequencePhase === 'labelZoom') {
      // Zoom in on current label for 4 seconds
      const annotation = annotationLabels[currentAnnotationIndex]
      if (annotation) {
        // Get keypoint position for this annotation
        const releaseFrame = videoData.phases?.find(p => p.phase === 'Release' || p.phase === 'RELEASE')?.frame ?? Math.floor(totalFrames / 2)
        const keypoints = videoData.allKeypoints?.[releaseFrame] || (videoData.frameData?.[releaseFrame] as any)?.keypoints
        
        if (keypoints && keypoints[annotation.keypointName]) {
          // Calculate label position (same offsets as in VideoFrameCanvas)
          const offsets: Record<string, { x: number; y: number }> = {
            'right_elbow': { x: -500, y: -180 },
            'right_knee': { x: 350, y: -200 },
            'right_shoulder': { x: 350, y: -150 },
            'right_hip': { x: 350, y: -50 },
          }
          const offset = offsets[annotation.keypointName] || { x: 0, y: 0 }
          const kp = keypoints[annotation.keypointName]
          
          // Set zoom target to label position
          setZoomTarget({
            x: kp.x + offset.x + 170, // Center of label
            y: kp.y + offset.y + 65,
            scale: 2.5
          })
          setSpotlightTarget(null)
          setCurrentFrame(releaseFrame)
        }
        
        // After 4 seconds, pan to body part
        sequenceTimeoutRef.current = setTimeout(() => {
          setSequencePhase('bodyPartZoom')
        }, 4000)
      }
    }
    
    if (sequencePhase === 'bodyPartZoom') {
      // Zoom in on body part with spotlight for 2 seconds
      const annotation = annotationLabels[currentAnnotationIndex]
      if (annotation) {
        const releaseFrame = videoData.phases?.find(p => p.phase === 'Release' || p.phase === 'RELEASE')?.frame ?? Math.floor(totalFrames / 2)
        const keypoints = videoData.allKeypoints?.[releaseFrame] || (videoData.frameData?.[releaseFrame] as any)?.keypoints
        
        if (keypoints && keypoints[annotation.keypointName]) {
          const kp = keypoints[annotation.keypointName]
          
          // Set zoom target to body part
          setZoomTarget({
            x: kp.x,
            y: kp.y,
            scale: 3
          })
          // Set spotlight on body part
          setSpotlightTarget({
            x: kp.x,
            y: kp.y
          })
        }
        
        // After 2 seconds, move to next annotation or slow-mo
        sequenceTimeoutRef.current = setTimeout(() => {
          if (currentAnnotationIndex < annotationLabels.length - 1) {
            setCurrentAnnotationIndex(prev => prev + 1)
            setSequencePhase('labelZoom')
          } else {
            // All annotations done, start slow-mo
            setSequencePhase('slowMo')
            setZoomTarget(null)
            setSpotlightTarget(null)
            setCurrentFrame(0)
          }
        }, 2000)
      }
    }
    
    if (sequencePhase === 'slowMo') {
      // Play slow-mo from start to finish
      setIsPlaying(true)
    }
    
  }, [sequencePhase, currentAnnotationIndex, videoData, annotationLabels])
  
  // Auto-play functionality for video player
  useEffect(() => {
    if (isPlaying && videoData?.annotatedFramesBase64?.length) {
      // Determine playback speed based on sequence phase
      const fps = videoData?.fps || 10
      const playbackSpeed = sequencePhase === 'slowMo' ? fps * 4 : fps // 4x slower for slow-mo
      
      playIntervalRef.current = setInterval(() => {
        setCurrentFrame(prev => {
          const nextFrame = prev + 1
          if (nextFrame >= (videoData?.annotatedFramesBase64?.length || 0)) {
            setIsPlaying(false)
            
            // Handle end of playthrough based on sequence phase
            if (sequencePhase === 'firstPlaythrough') {
              // First playthrough complete - start label zoom sequence
              setCurrentFrame(0)
              setCurrentAnnotationIndex(0)
              setSequencePhase('labelZoom')
            } else if (sequencePhase === 'slowMo') {
              // Slow-mo complete - sequence is done
              setSequencePhase('complete')
            }
            
            return 0
          }
          return nextFrame
        })
      }, 1000 / playbackSpeed)
    } else if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current)
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current)
    }
  }, [isPlaying, videoData?.annotatedFramesBase64?.length, videoData?.fps, sequencePhase])
  
  // Calculate video data values (needed for useMemo before early return)
  const totalFrames = videoData?.annotatedFramesBase64?.length || 0
  const currentFrameData = videoData?.frameData?.[currentFrame]
  const currentPhase = currentFrameData?.phase || 'Unknown'
  const currentTimestamp = currentFrameData?.timestamp || (currentFrame / (videoData?.fps || 10))
  
  // Use the release frame as the "main image" for ImageModeContent
  // Check for both 'Release' and 'RELEASE' since backend might use either
  const releaseFrameIndex = videoData?.phases?.find(p => p.phase === 'Release' || p.phase === 'RELEASE')?.frame ?? Math.floor(totalFrames / 2)
  const mainVideoFrameBase64 = videoData?.annotatedFramesBase64?.[releaseFrameIndex] || videoData?.annotatedFramesBase64?.[0] || ''
  const videoMainImageUrl = mainVideoFrameBase64 ? `data:image/jpeg;base64,${mainVideoFrameBase64}` : ''
  
  // Get keypoints from release frame for screenshots
  const releaseKeypoints = videoData?.allKeypoints?.[releaseFrameIndex] || 
    (videoData?.frameData?.[releaseFrameIndex] as any)?.keypoints || {}
  const releaseMetrics = videoData?.frameData?.[releaseFrameIndex]?.metrics || {}
  const releaseBall = videoData?.frameData?.[releaseFrameIndex]?.ball
  
  // Construct a visionAnalysis object for video mode with keypoints from release frame
  // This ensures AutoScreenshots can properly crop based on body part positions
  // Must be called before early return to maintain consistent hook order
  const videoVisionAnalysisForScreenshots = useMemo(() => {
    // If we have keypoints from video data, use those
    if (releaseKeypoints && Object.keys(releaseKeypoints).length > 0) {
      return {
        keypoints: releaseKeypoints,
        basketball: releaseBall || null,
        angles: releaseMetrics,
        image_size: { width: 640, height: 480 } // Default video frame size
      }
    }
    // Fall back to passed visionAnalysis if available
    return visionAnalysis
  }, [releaseKeypoints, releaseBall, releaseMetrics, visionAnalysis])

  // Normalize detector phase output into the review timeline's small, stable
  // event shape. Persisted shot events (when supplied by the API) are used as
  // is; older video analyses continue to get a useful local review timeline.
  const reviewEvents = useMemo<ShotReviewEvent[]>(() => {
    const persisted = (videoData as any)?.shotEvents
    if (Array.isArray(persisted) && persisted.length > 0) {
      return persisted.map((event: any) => {
        const metadata = event?.metadata && typeof event.metadata === "object" ? event.metadata : undefined
        const confidence = typeof event?.confidence === "number"
          ? event.confidence
          : typeof event?.confidence === "string" && Number.isFinite(Number(event.confidence))
            ? Number(event.confidence)
            : undefined
        return {
          ...event,
          confidence,
          trusted: typeof event?.trusted === "boolean"
            ? event.trusted
            : typeof metadata?.trusted === "boolean"
              ? metadata.trusted
              : undefined,
          timestampMs: typeof event?.timestampMs === "number" ? event.timestampMs : undefined,
        }
      })
    }

    const phases = Array.isArray((videoData as any)?.phases) ? (videoData as any).phases : []
    const frames = Array.isArray((videoData as any)?.frameData) ? (videoData as any).frameData : []
    const source = phases.length > 0
      ? phases
      : frames.reduce((events: any[], frame: any, frameIndex: number) => {
          const phase = frame?.phase
          if (!phase || events[events.length - 1]?.phase === phase) return events
          events.push({ phase, frame: frameIndex })
          return events
        }, [])

    return source.map((phase: any, index: number) => {
      const frameIndex = Number.isFinite(Number(phase?.frame)) ? Number(phase.frame) : index
      const frame = frames[frameIndex] ?? {}
      return {
        id: `review-${frameIndex}-${index}`,
        timestampMs: Math.round(Number(frame?.timestamp ?? frameIndex / ((videoData as any)?.fps || 10)) * 1000),
        frameIndex,
        label: phase?.phase ? String(phase.phase) : `Shot ${index + 1}`,
        phase: phase?.phase ? String(phase.phase) : undefined,
        confidence: typeof frame?.confidence === "number" ? frame.confidence : undefined,
        detectedResult: frame?.result ?? frame?.makeMiss ?? undefined,
      }
    })
  }, [videoData])

  // Server detector rows can hydrate append-only corrections. Local live
  // fallback rows are explicitly review-only and must never be sent to that
  // API, even though they still render the same correction controls.
  const hasPersistedShotEvents = useMemo(() => {
    const events = (videoData as any)?.shotEvents
    return Array.isArray(events) && events.some((event: any) => event?.reviewOnly !== true)
  }, [videoData])
  
  // Check if we have video data
  const hasVideoData = videoData && videoData.annotatedFramesBase64 && videoData.annotatedFramesBase64.length > 0
  
  // If no video data, render ImageModeContent with hideMainImage=false so it shows the upload box
  // but still displays the full dashboard (player card, elite shooters, etc.)
  if (!hasVideoData) {
    return (
      <ImageModeContent
        analysisData={analysisData}
        playerName={playerName}
        poseConfidence={poseConfidence}
        teaserFrames={teaserFrames}
        fullFrames={fullFrames}
        allUploadedUrls={allUploadedUrls}
        mainImageUrl={null}  // No image = shows upload box
        visionAnalysis={null}
        roboflowBallDetection={roboflowBallDetection}
        isVideoMode={true}  // Tell ImageModeContent to show video upload button
      />
    )
  }
  
  return (
    <>
      {/* ============================================ */}
      {/* VIDEO PLAYER SECTION - GSAP Player Only */}
      {/* ============================================ */}
      <VideoPlayerSection videoData={videoData} overlayToggles={overlayToggles} />

      {/* ============================================ */}
      {/* HUMAN REVIEW - append-only detector corrections */}
      {/* ============================================ */}
      <div className="border-b border-black p-6">
        <div className="mx-auto max-w-3xl">
          <ShotReviewTimeline
            events={reviewEvents}
            persist={hasPersistedShotEvents}
            onSelect={(event) => {
              if (typeof event.frameIndex === "number") setCurrentFrame(Math.max(0, Math.min(totalFrames - 1, event.frameIndex)))
            }}
          />
        </div>
      </div>
      
      {/* ============================================ */}
      {/* OVERLAY TOGGLE CONTROLS - Directly under video player */}
      {/* Shows for BOTH GSAP and Legacy players */}
      {/* ============================================ */}
      <div className="px-6 py-4 border-b border-black">
        <div className="max-w-3xl mx-auto">
          <OverlayControls toggles={overlayToggles} setToggles={setOverlayToggles} />
        </div>
      </div>
      
      {/* ============================================ */}
      {/* ANNOTATION DROPDOWN LIST - Shows for BOTH GSAP and Legacy players */}
      {/* Cards with dropdowns that mirror the video labels */}
      {/* ============================================ */}
      <div className="p-6 border-b border-black">
        <div className="max-w-3xl mx-auto">
          {(() => {
            // Get angles from multiple sources with fallback chain:
            // 1. Current frame metrics from frameData
            // 2. Video summary metrics (elbow_angle_range, knee_angle_range)
            // 3. analysisData.angles
            
            const currentFrameData = videoData.frameData?.[currentFrame]
            const frameMetrics = currentFrameData?.metrics || {}
            
            // Convert metrics to angles format expected by generateFixesFromAngles
            // The backend stores angles like 'elbow_angle', 'knee_angle' in metrics
            const frameAngles: Record<string, number> = {}
            
            // Map from frame-level metrics
            if (frameMetrics.elbow_angle !== undefined) {
              frameAngles.right_elbow_angle = frameMetrics.elbow_angle
            }
            if (frameMetrics.knee_angle !== undefined) {
              frameAngles.right_knee_angle = frameMetrics.knee_angle
            }
            if (frameMetrics.shoulder_tilt !== undefined) {
              frameAngles.shoulder_tilt = frameMetrics.shoulder_tilt
            }
            if (frameMetrics.hip_tilt !== undefined) {
              frameAngles.hip_tilt = frameMetrics.hip_tilt
            }
            // Direct mappings if already in correct format
            if (frameMetrics.left_elbow_angle !== undefined) {
              frameAngles.left_elbow_angle = frameMetrics.left_elbow_angle
            }
            if (frameMetrics.right_elbow_angle !== undefined) {
              frameAngles.right_elbow_angle = frameMetrics.right_elbow_angle
            }
            if (frameMetrics.left_knee_angle !== undefined) {
              frameAngles.left_knee_angle = frameMetrics.left_knee_angle
            }
            if (frameMetrics.right_knee_angle !== undefined) {
              frameAngles.right_knee_angle = frameMetrics.right_knee_angle
            }
            
            // If no frame-specific angles, try video summary metrics
            if (Object.keys(frameAngles).length === 0 && videoData.metrics) {
              const summaryMetrics = videoData.metrics
              if (summaryMetrics.elbow_angle_range?.at_release) {
                frameAngles.right_elbow_angle = summaryMetrics.elbow_angle_range.at_release
              }
              if (summaryMetrics.knee_angle_range?.min) {
                frameAngles.right_knee_angle = summaryMetrics.knee_angle_range.min
              }
            }
            
            // Final fallback to analysisData.angles
            const finalAngles = Object.keys(frameAngles).length > 0 
              ? frameAngles 
              : (analysisData?.angles || {})
            
            const fixes = generateFixesFromAngles(finalAngles)
            return <AnnotationDropdownList fixes={fixes} />
          })()}
        </div>
      </div>
      
      {/* ============================================ */}
      {/* KEY POINT ANALYSIS SCREENSHOTS - Directly under cards */}
      {/* ============================================ */}
      <div className="p-6 border-b border-black">
        <div className="max-w-3xl mx-auto">
          <CollapsibleDropdown
            title="Key Point Analysis Screenshots"
            icon={<Camera className="w-4 h-4" />}
            defaultOpen={false}
          >
            <AutoScreenshots
              imageUrl={videoMainImageUrl}
              keypoints={videoVisionAnalysisForScreenshots?.keypoints}
              basketball={videoVisionAnalysisForScreenshots?.basketball}
              imageSize={videoVisionAnalysisForScreenshots?.image_size}
              angles={videoVisionAnalysisForScreenshots?.angles}
            />
          </CollapsibleDropdown>
        </div>
      </div>

      {/* ============================================ */}
      {/* FULL ANALYSIS CONTENT - Same as Image Mode */}
      {/* Render ImageModeContent with video frame as mainImageUrl */}
      {/* hideAnimatedWalkthrough=true for video (video has its own player) */}
      {/* hideMainImage=true to hide the main analysis image (we have GSAP player) */}
      {/* AutoScreenshots use videoVisionAnalysisForScreenshots with keypoints from release frame */}
      {/* ============================================ */}
      <ImageModeContent
        analysisData={analysisData}
        playerName={playerName}
        poseConfidence={poseConfidence}
        teaserFrames={teaserFrames}
        fullFrames={fullFrames}
        allUploadedUrls={allUploadedUrls}
        mainImageUrl={videoMainImageUrl}
        cleanImageUrl={videoMainImageUrl}
        visionAnalysis={videoVisionAnalysisForScreenshots}
        roboflowBallDetection={roboflowBallDetection}
        hideAnimatedWalkthrough={true}
        hideAutoScreenshots={true}
        hideMainImage={true}
      />
    </>
  )
}


interface ImageModeContentProps {
  analysisData: AnalysisData
  playerName: string
  poseConfidence: number
  teaserFrames: { id: string; url: string; label: string; wristAngle?: number; confidence?: number }[]
  fullFrames: { id: string; url: string; label: string; wristAngle?: number; confidence?: number }[]
  allUploadedUrls: string[]
  mainImageUrl: string | null
  cleanImageUrl?: string | null  // Clean image without skeleton/labels for screenshots
  visionAnalysis?: VisionAnalysisResult | null
  roboflowBallDetection?: { x: number; y: number; width: number; height: number; confidence: number } | null
  hideAnimatedWalkthrough?: boolean  // Hide animated walkthrough for video mode
  hideAutoScreenshots?: boolean  // Hide auto screenshots for video mode
  hideMainImage?: boolean  // Hide main analysis image for video mode (we have GSAP player)
  isVideoMode?: boolean  // When true, show video upload button instead of image upload button
}

function ImageModeContent({ analysisData, playerName, poseConfidence, teaserFrames, fullFrames, allUploadedUrls, mainImageUrl, cleanImageUrl, visionAnalysis, roboflowBallDetection, hideAnimatedWalkthrough = false, hideAutoScreenshots = false, hideMainImage = false, isVideoMode = false }: ImageModeContentProps) {
  const hasMeasuredAnalysis = analysisData !== DEFAULT_DEMO_ANALYSIS
  // Track hydration to handle SSR/client mismatch
  // const [isHydrated, setIsHydrated] = useState(false)
  
  // useEffect(() => {
  //   setIsHydrated(true)
  // }, [])
  
  // Get player profile from store for clickable stats with error handling
  let playerProfile
  try {
    const store = useAnalysisStore()
    playerProfile = store?.playerProfile || null
  } catch (error) {
    console.error('Error accessing analysis store:', error)
    playerProfile = null
  }
  
  // Dashboard view state (Professional, Standard, Basic) from global store
  const { view: dashboardView } = useDashboardViewStore()
  
  const profileStore = useProfileStore()

  const displayHeight = useMemo(() => {
    if (!profileStore.heightInches) return "6'2\"";
    const feet = Math.floor(profileStore.heightInches / 12);
    const inches = profileStore.heightInches % 12;
    return `${feet}'${inches}"`;
  }, [profileStore.heightInches]);

  const displayWeight = useMemo(() => {
    return profileStore.weightLbs ? `${profileStore.weightLbs} LB` : "185 LB";
  }, [profileStore.weightLbs]);

  const displayAge = useMemo(() => {
    return profileStore.age ? String(profileStore.age) : "34";
  }, [profileStore.age]);

  const displayExperience = useMemo(() => {
    const level = profileStore.experienceLevel;
    if (!level) return "PRO";
    if (level === "beginner") return "BEG";
    if (level === "intermediate") return "INT";
    if (level === "advanced") return "ADV";
    if (level === "professional") return "PRO";
    return level.substring(0, 3).toUpperCase();
  }, [profileStore.experienceLevel]);

  const displayLeague = useMemo(() => {
    const tier = profileStore.coachingTier;
    if (!tier) return "REC";
    if (tier === "elementary") return "ELEM";
    if (tier === "middle_school") return "MID";
    if (tier === "high_school") return "HS";
    if (tier === "college") return "COL";
    if (tier === "professional") return "PRO";
    return tier.replace('_', ' ').toUpperCase();
  }, [profileStore.coachingTier]);
  
  // Overlay toggle state for image
  const [overlayToggles, setOverlayToggles] = useState<OverlayToggles>({
    skeleton: true,
    joints: true,
    annotations: true,
    basketball: true
  })
  
  // Get the shooter archetype based on stats with safety check
  const safeAnalysisData = analysisData || {
    overallScore: 0,
    shootingStats: { release: 0, form: 0, balance: 0, arc: 0, elbow: 0, follow: 0, consist: 0, power: 0 },
    matchedShooter: { name: 'Unknown', team: '', similarityScore: 0, position: '' }
  }
  const archetype = getShooterArchetype(safeAnalysisData.shootingStats)
  const [showShareModal, setShowShareModal] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const shareCardRef = useRef<HTMLDivElement>(null)
  
  // Banner customization state
  const [showBannerMenu, setShowBannerMenu] = useState(false)
  const [bannerColor, setBannerColor] = useState('#FF6B35') // Gold default
  const [jerseyNumber, setJerseyNumber] = useState('23')
  const [bannerFirstName, setBannerFirstName] = useState(playerName.split(' ')[0] || 'PLAYER')
  const [bannerLastName, setBannerLastName] = useState(playerName.split(' ')[1] || '')
  const [bannerBgImage, setBannerBgImage] = useState<string | null>(null)
  const bannerBgInputRef = useRef<HTMLInputElement>(null)

  // Generate and download shareable image with SHOTIQ watermark
  const handleDownloadImage = useCallback(async () => {
    if (!shareCardRef.current) return
    setIsGeneratingImage(true)
    try {
      const dataUrl = await toPng(shareCardRef.current, { quality: 0.95, pixelRatio: 2 })
      // Add SHOTIQ watermark to the image
      const watermarkedUrl = await addWatermarkToImage(dataUrl)
      const link = document.createElement("a")
      link.download = `shotiq-analysis-${Date.now()}.png`
      link.href = watermarkedUrl
      link.click()
    } catch (err) {
      console.error("Failed to generate image:", err)
    } finally {
      setIsGeneratingImage(false)
    }
  }, [])

  // Copy image to clipboard with SHOTIQ watermark
  const handleCopyImage = useCallback(async () => {
    if (!shareCardRef.current) return
    setIsGeneratingImage(true)
    try {
      const dataUrl = await toPng(shareCardRef.current, { quality: 0.95, pixelRatio: 2 })
      // Add SHOTIQ watermark to the image
      const watermarkedUrl = await addWatermarkToImage(dataUrl)
      const response = await fetch(watermarkedUrl)
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
    try {
      const shareText = `Check out my basketball shooting analysis! I scored ${safeAnalysisData.overallScore} OVR and matched ${safeAnalysisData.matchedShooter.similarityScore}% with ${safeAnalysisData.matchedShooter.name}! #BasketballAnalysis`
    const shareUrl = window.location.href

    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    }

    if (urls[platform]) {
      window.open(urls[platform], "_blank", "width=600,height=400")
    }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }, [safeAnalysisData])

  // Native share API
  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Basketball Analysis",
          text: `Check out my basketball shooting analysis! I scored ${safeAnalysisData.overallScore} OVR!`,
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
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border-2 border-black" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-4 border-b border-black flex items-center justify-between">
              <h3 className="text-[#FF6B35] font-bold text-lg uppercase tracking-wider">Share Your Results</h3>
              <button onClick={() => setShowShareModal(false)} className="text-slate-500 hover:text-slate-900 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Shareable Card Preview */}
            <div className="p-4">
              <div ref={shareCardRef} className="bg-gradient-to-br from-white via-[#2a2a2a] to-white p-6 rounded-xl border border-[#FF6B35]/30">
                {/* Logo/Brand */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#FF6B35]/20 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-[#FF6B35]" />
                  </div>
                  <span className="text-[#FF6B35] font-bold text-sm uppercase tracking-wider">Basketball Analysis</span>
                </div>

                {/* Player Info */}
                <div className="flex items-center gap-4 mb-4">
                  {/* Overall Score Ring */}
                  <ScoreRing score={analysisData.overallScore} size={80} strokeWidth={6} />
                  <div className="flex-1">
                    <h4 className="text-xl font-black text-slate-900 uppercase">{playerName}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${archetype.color}20`, color: archetype.color }}>{archetype.title}</span>
                    </div>
                  </div>
                </div>

                {/* Key Stats */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="bg-white rounded-lg p-2 text-center border-2 border-black">
                    <p className="text-lg font-black text-slate-900">{analysisData.shootingStats.form}</p>
                    <p className="text-slate-500 text-[10px] uppercase">Form</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center border-2 border-black">
                    <p className="text-lg font-black text-slate-900">{analysisData.shootingStats.balance}</p>
                    <p className="text-slate-500 text-[10px] uppercase">Balance</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center border-2 border-black">
                    <p className="text-lg font-black text-slate-900">{analysisData.shootingStats.elbow}</p>
                    <p className="text-slate-500 text-[10px] uppercase">Elbow</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center border-2 border-black">
                    <p className="text-lg font-black text-slate-900">{analysisData.shootingStats.consist}</p>
                    <p className="text-slate-500 text-[10px] uppercase">Consist</p>
                  </div>
                </div>

                {/* Elite Match */}
                <div className="bg-white rounded-lg p-3 border-2 border-black flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#FF6B35]/50 relative">
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
                    <p className="text-slate-500 text-[10px] uppercase">Matched Elite Shooter</p>
                    <p className="text-slate-900 font-bold text-sm">{analysisData.matchedShooter.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#FF6B35] font-black text-lg">{analysisData.matchedShooter.similarityScore}%</p>
                    <p className="text-slate-500 text-[10px]">Similarity</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Share Options */}
            <div className="p-4 border-t border-black">
              <p className="text-slate-500 text-sm mb-3 uppercase tracking-wider">Share to</p>
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
                <button onClick={handleDownloadImage} disabled={isGeneratingImage} className="flex-1 bg-[#FF6B35] hover:bg-[#E55300] disabled:bg-[#FF6B35]/50 text-[#1a1a1a] font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap">
                  <Download className="w-5 h-5" />
                  {isGeneratingImage ? "..." : "Download"}
                </button>
                <button onClick={handleCopyImage} disabled={isGeneratingImage} className="bg-slate-200 hover:bg-slate-200 disabled:bg-slate-200/50 text-slate-900 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* LEFT COLUMN: Reorganized Layout */}
        <div className="space-y-6">
          
          {/* Main Analysis Image removed for video mode - using GSAP player instead */}
          {!hideMainImage && mainImageUrl ? (
            <MainAnalysisImageSection
              mainImageUrl={mainImageUrl}
              visionAnalysis={visionAnalysis}
              analysisData={analysisData}
              overlayToggles={overlayToggles}
              setOverlayToggles={setOverlayToggles}
            />
          ) : !hideMainImage ? (
            <div className="relative rounded-2xl border-2 border-dashed border-black/20 bg-gradient-to-b from-white to-slate-50 overflow-hidden">
              {/* Subtle grid pattern background */}
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              
              <div className="relative text-center py-16 px-8">
                {/* Icon with glow ring */}
                <div className="relative w-24 h-24 mx-auto mb-8">
                  <div className="absolute inset-0 rounded-2xl bg-[#FF6B35]/10 animate-pulse" />
                  <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-[#FF6B35]/15 to-[#FF4500]/10 border-2 border-[#FF6B35]/20 flex items-center justify-center backdrop-blur-sm">
                    {isVideoMode ? <Video className="w-10 h-10 text-[#FF6B35]" /> : <ImageIcon className="w-10 h-10 text-[#FF6B35]" />}
                  </div>
                </div>
                
                {/* Headline */}
                <h3 className="text-slate-900 font-black text-2xl mb-2 tracking-tight">
                  {isVideoMode ? "Upload Your Video" : "Upload Your Shot"}
                </h3>
                <p className="text-slate-400 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
                  {isVideoMode 
                    ? "Get your 3-stage breakdown: Full Speed, Labels, and Slow Motion analysis."
                    : "Get instant AI-powered shooting form analysis with detailed biomechanical measurements."
                  }
                </p>
                
                {/* Upload button - visible on all devices */}
                <label
                  htmlFor={isVideoMode ? "shotiq-video-upload-input" : "shotiq-image-upload-input"}
                  className="inline-flex cursor-pointer items-center gap-3 bg-black hover:bg-[#FF6B35] text-white font-bold px-10 py-4 rounded-full transition-all duration-300 shadow-xl hover:shadow-[#FF6B35]/30 hover:scale-105 group"
                >
                  <Upload className="w-5 h-5 group-hover:animate-bounce" />
                  {isVideoMode ? "Choose Video" : "Choose Image"}
                </label>
                
                {/* Supported formats */}
                <p className="text-slate-300 text-xs mt-5 tracking-wide uppercase">
                  {isVideoMode ? "MP4, MOV • Max 500MB" : "JPG, PNG, HEIC • Max 25MB"}
                </p>
              </div>
            </div>
          ) : null}

          {/* ============================================ */}
          {/* 2. ANIMATED FORM WALKTHROUGH (collapsible dropdown) */}
          {/* ============================================ */}
          {mainImageUrl && !hideAnimatedWalkthrough && (
            <CollapsibleDropdown
              title="Animated Form Walkthrough"
              icon={<Play className="w-4 h-4" />}
              defaultOpen={false}
            >
              <AnimatedImageWalkthrough
                imageUrl={mainImageUrl}
                keypoints={visionAnalysis?.keypoints}
                angles={visionAnalysis?.angles}
                imageSize={visionAnalysis?.image_size}
              />
            </CollapsibleDropdown>
          )}

          {/* ============================================ */}
          {/* 4. KEY POINT ANALYSIS SCREENSHOTS (collapsible dropdown) */}
          {/* ============================================ */}
          {mainImageUrl && !hideAutoScreenshots && (
            <CollapsibleDropdown
              title="Key Point Analysis Screenshots"
              icon={<Camera className="w-4 h-4" />}
              defaultOpen={false}
            >
              <AutoScreenshots
                imageUrl={cleanImageUrl || mainImageUrl}
                keypoints={visionAnalysis?.keypoints}
                basketball={visionAnalysis?.basketball}
                imageSize={visionAnalysis?.image_size}
                angles={visionAnalysis?.angles}
              />
            </CollapsibleDropdown>
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
                    elbowAngle: 90,
                    kneeAngle: 145,
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
          ) : null}

          {/* Media Thumbnails */}
          {allUploadedUrls.length > 0 && (
            <div className="bg-white rounded-lg p-4 border-2 border-black">
              <h3 className="text-[#FF6B35] font-bold text-sm uppercase tracking-wider mb-3">Uploaded Media</h3>
              <div className="grid grid-cols-4 gap-2">
                {allUploadedUrls.map((url, idx) => (
                  <div key={idx} className="rounded-lg overflow-hidden bg-white border-2 border-black cursor-pointer hover:border-[#FF6B35]/50 transition-colors">
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
          <div className="bg-white rounded-lg overflow-hidden lg:col-span-1">
            {/* Nameplate-Style Player Card */}
            <div className="relative overflow-hidden" style={{ minHeight: '120px' }}>
              {/* White background with subtle dot pattern */}
              <div 
                className="absolute inset-0 bg-white"
                style={{
                  backgroundImage: 'radial-gradient(circle, #ddd 1px, transparent 1px)',
                  backgroundSize: '12px 12px',
                }}
              />
              
              {/* Orange border frame */}
              <div className="absolute inset-0 border-4 border-[#FF6B35] rounded-lg" style={{ zIndex: 5 }} />
              
              {/* Half basketball — user's exact image, transparent */}
              <div className="absolute left-[-20px] top-1/2 -translate-y-1/2" style={{ zIndex: 2 }}>
                <Image 
                  src="/icons/basketball-outline.jpg" 
                  alt="Basketball" 
                  width={130} 
                  height={130} 
                  className="opacity-25"
                  style={{ mixBlendMode: 'multiply' }}
                />
              </div>
              
              {/* Jersey Number — overlapping inside basketball, positioned lower */}
              <div className="absolute left-[12px] top-[55%] -translate-y-1/2" style={{ zIndex: 4 }}>
                <span 
                  className="text-5xl md:text-6xl font-black"
                  style={{
                    color: '#1a1a1a',
                    fontStyle: 'italic',
                    WebkitTextStroke: `2px ${bannerColor}`,
                  }}
                >
                  {jerseyNumber}
                </span>
              </div>
              
              {/* Signature background — transparent */}
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden" style={{ zIndex: 1 }}>
                <Image 
                  src="/icons/signature.png" 
                  alt="" 
                  width={350} 
                  height={150} 
                  className="opacity-[0.06] select-none pointer-events-none"
                  style={{ mixBlendMode: 'multiply', transform: 'rotate(-5deg) translateX(20px)' }}
                />
              </div>
              
              {/* Three-dot Menu */}
              <div className="absolute top-2 right-2 z-30">
                <button 
                  className="p-1.5 rounded-full hover:bg-black/5 transition-colors group"
                  onClick={() => setShowBannerMenu(!showBannerMenu)}
                >
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
              </div>
              
              {/* Customization Dropdown Menu */}
              {showBannerMenu && (
                <div className="fixed inset-0 z-[100]" onClick={() => setShowBannerMenu(false)}>
                  <div 
                    className="absolute bg-white rounded-lg shadow-2xl border-2 border-black w-80"
                    style={{ top: '280px', right: '100px' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div className="bg-white px-4 py-3 border-b border-black flex items-center justify-between rounded-t-lg">
                      <span className="text-slate-900 font-bold">Customize Banner</span>
                      <button onClick={() => setShowBannerMenu(false)} className="text-slate-500 hover:text-slate-900">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="p-4 space-y-5">
                      {/* Banner Color */}
                      <div>
                        <label className="text-slate-700 text-sm font-semibold block mb-3">Banner Color</label>
                        <div className="flex gap-3 flex-wrap">
                          {['#FF6B35', '#ef4444', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6'].map((color) => (
                            <button
                              key={color}
                              onClick={() => setBannerColor(color)}
                              className={`w-10 h-10 rounded-full border-3 transition-all shadow-lg ${bannerColor === color ? 'border-white scale-110 ring-2 ring-white/50' : 'border-transparent hover:scale-105'}`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <input
                            type="color"
                            value={bannerColor}
                            onChange={(e) => setBannerColor(e.target.value)}
                            className="w-10 h-10 rounded cursor-pointer border-0"
                          />
                          <span className="text-slate-500 text-sm">Custom Color</span>
                        </div>
                      </div>
                      
                      {/* Jersey Number */}
                      <div>
                        <label className="text-slate-700 text-sm font-semibold block mb-2">Jersey Number</label>
                        <input
                          type="text"
                          value={jerseyNumber}
                          onChange={(e) => setJerseyNumber(e.target.value.slice(0, 2))}
                          maxLength={2}
                          className="w-24 bg-white border-2 border-black rounded-lg px-4 py-2 text-slate-900 text-center text-2xl font-bold focus:outline-none focus:border-[#FF6B35]"
                          placeholder="23"
                        />
                      </div>
                      
                      {/* Player Name */}
                      <div>
                        <label className="text-slate-700 text-sm font-semibold block mb-2">First Name</label>
                        <input
                          type="text"
                          value={bannerFirstName}
                          onChange={(e) => setBannerFirstName(e.target.value.toUpperCase())}
                          className="w-full bg-white border-2 border-black rounded-lg px-4 py-2 text-slate-900 font-bold focus:outline-none focus:border-[#FF6B35]"
                        />
                        <label className="text-slate-700 text-sm font-semibold block mb-2 mt-3">Last Name</label>
                        <input
                          type="text"
                          value={bannerLastName}
                          onChange={(e) => setBannerLastName(e.target.value.toUpperCase())}
                          className="w-full bg-white border-2 border-black rounded-lg px-4 py-2 text-slate-900 font-bold focus:outline-none focus:border-[#FF6B35]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Content — Nameplate Layout */}
              <div className="relative flex items-center py-5 min-h-[130px]" style={{ zIndex: 3 }}>
                {/* Spacer — pushes name to center of card */}
                <div className="flex-shrink-0 w-[120px]" />
                
                {/* Name — left-aligned text, centered in card */}
                <div className="flex-1 min-w-0">
                  <p className="text-base md:text-lg font-bold uppercase tracking-wider text-black/70 leading-none">
                    {bannerFirstName}
                  </p>
                  <h2 
                    className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-none mt-1"
                    style={{ color: bannerColor }}
                  >
                    {bannerLastName}
                  </h2>
                </div>
                
                {/* Right — Premium Rating Circle */}
                <div className="flex-shrink-0 mr-6">
                  <div className="relative w-[85px] h-[85px]">
                    {/* Outer glow */}
                    <div 
                      className="absolute inset-0 rounded-full"
                      style={{
                        boxShadow: '0 0 20px rgba(255,107,53,0.3), 0 0 40px rgba(255,107,53,0.1)',
                      }}
                    />
                    <svg viewBox="0 0 90 90" className="w-full h-full">
                      {/* Solid dark background circle */}
                      <circle cx="45" cy="45" r="40" fill="#1a1a1a" />
                      {/* Track ring */}
                      <circle cx="45" cy="45" r="36" fill="none" stroke="#333" strokeWidth="6" />
                      {/* Progress ring — orange */}
                      <circle 
                        cx="45" cy="45" r="36" fill="none" 
                        stroke="#FF6B35" strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={`${(analysisData.overallScore / 100) * 226} 226`}
                        transform="rotate(-90 45 45)"
                        style={{ filter: 'drop-shadow(0 0 4px rgba(255,107,53,0.6))' }}
                      />
                      {/* Inner accent ring */}
                      <circle cx="45" cy="45" r="30" fill="none" stroke="#333" strokeWidth="0.5" />
                    </svg>
                    {/* Score text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-white font-black text-3xl leading-none">{analysisData.overallScore}</span>
                      <span className="text-[#FF6B35] text-[8px] font-bold uppercase tracking-widest mt-0.5">OVR</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bottom Label Bar */}
              <div 
                className="relative px-6 py-1.5 flex items-center justify-center"
                style={{ 
                  backgroundColor: '#1a1a1a',
                  zIndex: 5,
                }}
              >
                <span className="text-white/80 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em]">
                  Shot Analysis
                </span>
              </div>
            </div>

            {/* Progression History Bar */}
            <div className="bg-white px-4 py-2 border-y border-black">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Progression History</span>
            </div>

            {/* Dashboard Content - Same layout for all views */}
            <>
            {/* Bio Stats Row */}
            <div className="bg-white px-1 py-2 border-b border-black prof-bio-stats">
              <div className="grid grid-cols-5 divide-x divide-black">
                <div className="px-2 text-center">
                  <p className="text-slate-500 text-[10px] uppercase">WT</p>
                  <p className="text-slate-900 font-bold text-sm">{displayWeight}</p>
                </div>
                <div className="px-2 text-center">
                  <p className="text-slate-500 text-[10px] uppercase">AGE</p>
                  <p className="text-slate-900 font-bold text-sm">{displayAge}</p>
                </div>
                <div className="px-2 text-center">
                  <p className="text-slate-500 text-[10px] uppercase">HT</p>
                  <p className="text-slate-900 font-bold text-sm">{displayHeight}</p>
                </div>
                <div className="px-2 text-center">
                  <p className="text-slate-500 text-[10px] uppercase">EXP</p>
                  <p className="text-slate-900 font-bold text-sm">{displayExperience}</p>
                </div>
                <div className="px-2 text-center">
                  <p className="text-slate-500 text-[10px] uppercase">LEAGUE</p>
                  <p className="text-slate-900 font-bold text-sm">{displayLeague}</p>
                </div>
              </div>
            </div>

            {/* Main Content: Attributes - Full Width */}
            <div className="bg-white">
              <div className="p-3">
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
                    <p className="text-slate-500 text-[9px]">{archetype.description}</p>
                  </div>
                </div>
                <ClickableStatsGrid stats={analysisData.shootingStats} playerAge={playerProfile?.age} playerState="CA" />
              </div>
            </div>
            </>
          </div>
          {/* Elite comparisons only exist after a measured analysis. */}
          {hasMeasuredAnalysis ? (
          <div className="space-y-3" data-testid="elite-comparisons">
            {/* #1 - Primary Match */}
            <div className="bg-white rounded-lg overflow-hidden border border-slate-200 shadow-sm">
              {/* Orange top accent bar */}
              <div className="h-1 bg-gradient-to-r from-[#FF6B35] to-[#ff8c5a]" />
              
              {/* Header */}
              <div className="px-5 pt-4 pb-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-[#FF6B35]" />
                </div>
                <div>
                  <h2 className="text-slate-900 font-bold uppercase tracking-wider text-sm">Matched Elite Shooter</h2>
                  <p className="text-slate-400 text-[10px]">Your form matches this NBA star</p>
                </div>
              </div>

              {/* Content */}
              <div className="px-5 pb-5">
                <div className="flex items-center gap-5">
                  {/* Player Photo */}
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-[#FF6B35] relative" style={{ boxShadow: '0 0 0 3px white, 0 0 0 5px #FF6B3530' }}>
                      <Image
                        src="https://cdn.nba.com/headshots/nba/latest/1040x760/201939.png"
                        alt={analysisData.matchedShooter.name}
                        fill
                        sizes="80px"
                        className="object-cover object-top scale-150 translate-y-2"
                        priority
                      />
                    </div>
                    {/* Similarity Badge */}
                    <div className="absolute -bottom-1 -right-1 bg-white text-slate-900 font-black text-[11px] px-2 py-0.5 rounded-full border-2 border-white">
                      {analysisData.matchedShooter.similarityScore}%
                    </div>
                  </div>

                  {/* Player Info */}
                  <div className="flex-1">
                    <p className="text-xl font-black text-slate-900 uppercase tracking-wide">{analysisData.matchedShooter.name}</p>
                    <p className="text-[#FF6B35] font-semibold text-sm">{analysisData.matchedShooter.team}</p>
                    <p className="text-slate-400 text-xs mt-0.5">Small Forward • 4x Scoring Champion</p>

                    {/* Similarity Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-slate-400 uppercase tracking-wider font-semibold">Form Similarity</span>
                        <span className="text-[#FF6B35] font-bold">{analysisData.matchedShooter.similarityScore}%</span>
                      </div>
                      <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden" style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-1000 relative"
                          style={{ width: `${analysisData.matchedShooter.similarityScore}%`, background: 'linear-gradient(90deg, #FF6B35, #ff8c5a)' }}
                        >
                          <div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.35) 0%, transparent 60%)' }} />
                        </div>
                        <div 
                          className="absolute top-1/2 w-2.5 h-2.5 rounded-full border-2 border-white bg-[#FF6B35]"
                          style={{ left: `${analysisData.matchedShooter.similarityScore}%`, transform: 'translate(-50%, -50%)', boxShadow: '0 0 6px rgba(255,107,53,0.5)' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Match Insights */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">Why You Match</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-slate-50 text-slate-600 text-[11px] font-medium px-3 py-1 rounded-full border border-slate-200">Similar Release Height</span>
                    <span className="bg-slate-50 text-slate-600 text-[11px] font-medium px-3 py-1 rounded-full border border-slate-200">High Arc Shot</span>
                    <span className="bg-slate-50 text-slate-600 text-[11px] font-medium px-3 py-1 rounded-full border border-slate-200">Smooth Follow Through</span>
                  </div>
                </div>
              </div>
            </div>

            {/* #2-5 - Additional Matches */}
            {[
              { rank: 2, name: "Kyle Korver", team: "Retired (Multiple Teams)", position: "SG", similarity: Math.max(50, analysisData.matchedShooter.similarityScore - 5), photoId: "2594", trait: "Textbook Form", accentColor: "#C0C0C0" },
              { rank: 3, name: "Ray Allen", team: "Retired (Multiple Teams)", position: "SG", similarity: Math.max(45, analysisData.matchedShooter.similarityScore - 10), photoId: "951", trait: "Perfect Arc", accentColor: "#CD7F32" },
              { rank: 4, name: "Klay Thompson", team: "Dallas Mavericks", position: "SG", similarity: Math.max(40, analysisData.matchedShooter.similarityScore - 15), photoId: "202691", trait: "Quick Release", accentColor: "#FF6B35" },
              { rank: 5, name: "Devin Booker", team: "Phoenix Suns", position: "SG", similarity: Math.max(35, analysisData.matchedShooter.similarityScore - 20), photoId: "1626164", trait: "Smooth Stroke", accentColor: "#FF6B35" },
            ].map((shooter) => (
              <div key={shooter.rank} className="bg-white rounded-lg border border-slate-200 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300">
                <div className="flex items-center gap-3 p-3 pl-0">
                  {/* Left accent + rank */}
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-14 rounded-r-full" style={{ backgroundColor: shooter.accentColor }} />
                    <span 
                      className="text-3xl font-black opacity-30 w-8 text-center"
                      style={{ color: shooter.accentColor, fontFamily: 'var(--font-russo-one), Russo One, sans-serif' }}
                    >
                      {shooter.rank}
                    </span>
                  </div>
                  
                  {/* Player Photo */}
                  <div className="w-11 h-11 rounded-full overflow-hidden relative flex-shrink-0 border-2" style={{ borderColor: `${shooter.accentColor}40` }}>
                    <Image
                      src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${shooter.photoId}.png`}
                      alt={shooter.name}
                      fill
                      sizes="44px"
                      className="object-cover object-top scale-150 translate-y-1"
                    />
                  </div>
                  
                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-900 font-bold text-sm truncate">{shooter.name}</p>
                    <p className="text-slate-400 text-xs truncate">{shooter.team}</p>
                  </div>
                  
                  {/* Similarity & Trait */}
                  <div className="text-right flex-shrink-0 pr-3">
                    <p className="font-black text-xl" style={{ color: shooter.accentColor }}>{shooter.similarity}%</p>
                    <p className="text-slate-400 text-[9px] uppercase tracking-wider font-semibold">{shooter.trait}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          ) : (
            <section
              data-testid="analysis-empty-state"
              className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center"
            >
              <Target className="mx-auto mb-3 h-8 w-8 text-[#FF6B35]" />
              <h2 className="font-bold text-slate-900">No analysis yet</h2>
              <p className="mt-1 text-sm text-slate-500">
                Upload a shot or record a video to calculate real measurements and elite comparisons.
              </p>
            </section>
          )}

        </div>
      </div>
      <div className="p-6 border-t border-black pb-24">
        {/* Bottom Tab Navigation - Fixed bottom bar with icons (all devices) */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-black z-50 safe-area-bottom">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-7 h-16 md:h-[72px]">
              {[
                { id: "home", icon: Home, label: "Home", href: "/results/demo" },
                { id: "analysis", icon: Activity, label: "Analysis", href: "/results/demo/analysis" },
                { id: "flaws", icon: AlertTriangle, label: "Flaws", href: "/results/demo/flaws" },
                { id: "player", icon: User, label: "Player", href: "/results/demo/player" },
                { id: "compare", icon: Users, label: "Compare", href: "/results/demo/compare" },
                { id: "training", icon: ClipboardList, label: "Training", href: "/results/demo/training" },
                { id: "goals", icon: Target, label: "Goals", href: "/results/demo/goals" },
              ].map((tab) => {
                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    className="relative flex flex-col items-center justify-center gap-1 transition-all text-slate-500 hover:text-[#FF6B35]"
                  >
                    <tab.icon className="w-5 h-5 md:w-6 md:h-6 transition-transform" />
                    <span className="text-[10px] md:text-xs font-medium">
                      {tab.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
        
      </div>
    </>
  )
}

// Wrapper component with Suspense boundary for useSearchParams
export default function DemoResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    }>
      <DemoResultsPageContent />
    </Suspense>
  )
}
