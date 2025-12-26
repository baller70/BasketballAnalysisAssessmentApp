"use client"

/**
 * Phase 6: Comparison & Coaching Levels Panel
 * 
 * This component implements the personalized comparison algorithm that:
 * 1. Matches users to similar shooters based on body type
 * 2. Extracts optimal mechanics from top matches
 * 3. Generates age-appropriate coaching feedback
 */

import React, { useMemo, useState } from "react"
import { 
  Target, AlertTriangle, CheckCircle, 
  Lightbulb, ChevronDown, ChevronUp,
  Users, Star, ArrowRight, Info, Trophy
} from "lucide-react"
import {
  runFullComparison,
  UserPhysicalProfile,
  UserShootingMetrics,
  ComparisonResult,
  AgeGroup,
  MechanicComparison,
  MatchedShooter,
  FeedbackItem,
  DrillRecommendation
} from "@/services/comparisonAlgorithm"

// ============================================
// TYPES
// ============================================

interface Phase6ComparisonPanelProps {
  userProfile: {
    name?: string
    age?: number
    height?: string  // e.g., "6'2" or "74"
    weight?: number
    wingspan?: string
    skillLevel?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ELITE"
    athleticAbility?: number
  }
  userMetrics: {
    elbowAngle?: number
    kneeAngle?: number
    releaseAngle?: number
    shoulderTilt?: number
    hipTilt?: number
    followThroughAngle?: number
  }
  overallScore?: number // eslint-disable-line @typescript-eslint/no-unused-vars
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function parseHeight(height: string | undefined): number {
  if (!height) return 72 // Default to 6'0"
  
  // Handle "6'2" format
  const ftInMatch = height.match(/(\d+)['\-](\d+)/)
  if (ftInMatch) {
    return parseInt(ftInMatch[1]) * 12 + parseInt(ftInMatch[2])
  }
  
  // Handle raw inches
  const inches = parseInt(height)
  if (!isNaN(inches) && inches > 50 && inches < 100) {
    return inches
  }
  
  return 72
}

function formatHeight(inches: number): string {
  const ft = Math.floor(inches / 12)
  const inch = inches % 12
  return `${ft}'${inch}"`
}

const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  ELEMENTARY: "Elementary (Ages 6-11)",
  MIDDLE_SCHOOL: "Middle School (Ages 12-14)",
  HIGH_SCHOOL: "High School (Ages 15-18)",
  COLLEGE: "College (Ages 19-22)",
  PROFESSIONAL: "Professional (Ages 23+)"
}

const AGE_GROUP_COLORS: Record<AgeGroup, { bg: string; text: string; border: string }> = {
  ELEMENTARY: { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/40" },
  MIDDLE_SCHOOL: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/40" },
  HIGH_SCHOOL: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/40" },
  COLLEGE: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/40" },
  PROFESSIONAL: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/40" }
}

const FEEDBACK_ICONS: Record<FeedbackItem["icon"], React.ReactNode> = {
  CHECK: <CheckCircle className="w-5 h-5 text-green-400" />,
  TARGET: <Target className="w-5 h-5 text-orange-400" />,
  LIGHTBULB: <Lightbulb className="w-5 h-5 text-blue-400" />,
  WARNING: <AlertTriangle className="w-5 h-5 text-red-400" />,
  STAR: <Star className="w-5 h-5 text-[#FF6B35]" />
}

// ============================================
// MAIN COMPONENT
// ============================================

export function Phase6ComparisonPanel({
  userProfile,
  userMetrics,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  overallScore = 70
}: Phase6ComparisonPanelProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["matches", "feedback"])
  
  // Convert user profile to the format expected by the algorithm
  const physicalProfile: UserPhysicalProfile = useMemo(() => ({
    heightInches: parseHeight(userProfile.height),
    weightLbs: userProfile.weight,
    wingspanInches: userProfile.wingspan ? parseHeight(userProfile.wingspan) : undefined,
    age: userProfile.age || 25,
    skillLevel: userProfile.skillLevel || "INTERMEDIATE",
    athleticAbility: userProfile.athleticAbility
  }), [userProfile])
  
  const shootingMetrics: UserShootingMetrics = useMemo(() => ({
    elbowAngle: userMetrics.elbowAngle,
    kneeAngle: userMetrics.kneeAngle,
    releaseAngle: userMetrics.releaseAngle,
    shoulderTilt: userMetrics.shoulderTilt,
    hipTilt: userMetrics.hipTilt,
    followThroughAngle: userMetrics.followThroughAngle
  }), [userMetrics])
  
  // Run the full comparison algorithm
  const comparisonResult: ComparisonResult = useMemo(() => {
    return runFullComparison(physicalProfile, shootingMetrics)
  }, [physicalProfile, shootingMetrics])
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }
  
  const { topMatches, optimalMechanics, coachingFeedback, personalizedRecommendations } = comparisonResult
  const ageGroupColors = AGE_GROUP_COLORS[coachingFeedback.tier]
  
  return (
    <div className="space-y-6">
      {/* Header - Personalized Analysis Banner */}
      <div className="bg-gradient-to-r from-[#2a2a2a] via-[#1a1a1a] to-[#2a2a2a] rounded-xl p-6 border border-[#3a3a3a]">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF4500] flex items-center justify-center">
            <Users className="w-7 h-7 text-[#1a1a1a]" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-[#FF6B35] uppercase tracking-wider">
              Personalized Shooter Comparison
            </h2>
            <p className="text-[#888] text-sm">
              Matched to shooters with YOUR body type • {AGE_GROUP_LABELS[coachingFeedback.tier]}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-lg ${ageGroupColors.bg} ${ageGroupColors.border} border`}>
            <span className={`font-bold ${ageGroupColors.text}`}>
              {coachingFeedback.tier.replace("_", " ")}
            </span>
          </div>
        </div>
        
        {/* User Profile Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          <div className="bg-[#1a1a1a] rounded-lg p-3 text-center border border-[#3a3a3a]">
            <p className="text-xs text-[#888] uppercase">Height</p>
            <p className="text-lg font-bold text-[#E5E5E5]">{formatHeight(physicalProfile.heightInches)}</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-3 text-center border border-[#3a3a3a]">
            <p className="text-xs text-[#888] uppercase">Weight</p>
            <p className="text-lg font-bold text-[#E5E5E5]">{physicalProfile.weightLbs || "N/A"} lbs</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-3 text-center border border-[#3a3a3a]">
            <p className="text-xs text-[#888] uppercase">Wingspan</p>
            <p className="text-lg font-bold text-[#E5E5E5]">
              {physicalProfile.wingspanInches ? formatHeight(physicalProfile.wingspanInches) : "N/A"}
            </p>
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-3 text-center border border-[#3a3a3a]">
            <p className="text-xs text-[#888] uppercase">Age</p>
            <p className="text-lg font-bold text-[#E5E5E5]">{physicalProfile.age}</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-3 text-center border border-[#3a3a3a]">
            <p className="text-xs text-[#888] uppercase">Skill Level</p>
            <p className="text-lg font-bold text-[#FF6B35]">{physicalProfile.skillLevel}</p>
          </div>
        </div>
      </div>
      
      {/* Overall Assessment */}
      <div className={`rounded-xl p-6 border ${ageGroupColors.bg} ${ageGroupColors.border}`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-full ${ageGroupColors.bg} flex items-center justify-center border ${ageGroupColors.border}`}>
            <Info className={`w-6 h-6 ${ageGroupColors.text}`} />
          </div>
          <div className="flex-1">
            <h3 className={`font-bold text-lg ${ageGroupColors.text} mb-2`}>YOUR ASSESSMENT</h3>
            <p className="text-[#E5E5E5] leading-relaxed">{coachingFeedback.overallAssessment}</p>
          </div>
        </div>
      </div>
      
      {/* Optimal Mechanics for Your Body Type */}
      <div className="bg-[#2C2C2C] rounded-xl border border-[#3a3a3a] overflow-hidden">
        <button
          onClick={() => toggleSection("optimal")}
          className="w-full p-5 flex items-center justify-between hover:bg-[#3a3a3a]/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-bold text-green-400">OPTIMAL MECHANICS FOR YOUR BODY TYPE</h3>
          </div>
          {expandedSections.includes("optimal") ? (
            <ChevronUp className="w-5 h-5 text-[#888]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#888]" />
          )}
        </button>
        
        {expandedSections.includes("optimal") && (
          <div className="p-5 pt-0">
            <p className="text-[#888] text-sm mb-4">
              Based on the top 3 shooters with similar body type, these are your optimal shooting angles:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <OptimalMetricCard 
                label="Elbow Angle" 
                value={optimalMechanics.elbowAngle.value}
                stdDev={optimalMechanics.elbowAngle.stdDev}
                unit="°"
              />
              <OptimalMetricCard 
                label="Knee Angle" 
                value={optimalMechanics.kneeAngle.value}
                stdDev={optimalMechanics.kneeAngle.stdDev}
                unit="°"
              />
              <OptimalMetricCard 
                label="Release Angle" 
                value={optimalMechanics.releaseAngle.value}
                stdDev={optimalMechanics.releaseAngle.stdDev}
                unit="°"
              />
              <OptimalMetricCard 
                label="Shoulder Tilt" 
                value={optimalMechanics.shoulderTilt.value}
                stdDev={optimalMechanics.shoulderTilt.stdDev}
                unit="°"
              />
              <OptimalMetricCard 
                label="Hip Tilt" 
                value={optimalMechanics.hipTilt.value}
                stdDev={optimalMechanics.hipTilt.stdDev}
                unit="°"
              />
              <OptimalMetricCard 
                label="Follow-Through" 
                value={optimalMechanics.followThroughAngle.value}
                stdDev={optimalMechanics.followThroughAngle.stdDev}
                unit="°"
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Top 5 Matched Shooters */}
      <div className="bg-[#2C2C2C] rounded-xl border border-[#3a3a3a] overflow-hidden">
        <button
          onClick={() => toggleSection("matches")}
          className="w-full p-5 flex items-center justify-between hover:bg-[#3a3a3a]/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-[#FF6B35]" />
            <h3 className="text-xl font-bold text-[#FF6B35]">TOP 5 SIMILAR SHOOTERS</h3>
            <span className="text-[#888] text-sm">(Based on your body type)</span>
          </div>
          {expandedSections.includes("matches") ? (
            <ChevronUp className="w-5 h-5 text-[#888]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#888]" />
          )}
        </button>
        
        {expandedSections.includes("matches") && (
          <div className="p-5 pt-0 space-y-4">
            {topMatches.map((match, index) => (
              <MatchedShooterCard key={match.shooter.id} match={match} rank={index + 1} />
            ))}
          </div>
        )}
      </div>
      
      
      {/* Personalized Recommendations Summary */}
      {personalizedRecommendations.length > 0 && (
        <div className="bg-gradient-to-br from-[#FF6B35]/10 to-transparent rounded-xl p-6 border border-[#FF6B35]/30">
          <h3 className="text-xl font-bold text-[#FF6B35] mb-4 flex items-center gap-2">
            <Lightbulb className="w-6 h-6" />
            Based on players with your body type:
          </h3>
          <ul className="space-y-2">
            {personalizedRecommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-3 text-[#E5E5E5]">
                <ArrowRight className="w-5 h-5 text-[#FF6B35] flex-shrink-0 mt-0.5" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ============================================
// SUB-COMPONENTS
// ============================================

function MatchedShooterCard({ match, rank }: { match: MatchedShooter; rank: number }) {
  const { shooter, similarityScore, matchReasons } = match
  const heightFt = Math.floor(shooter.heightInches / 12)
  const heightIn = shooter.heightInches % 12
  const wingspanFt = Math.floor(shooter.wingspanInches / 12)
  const wingspanIn = shooter.wingspanInches % 12
  
  // Rank colors for faded numbers - matching the elite shooters section
  const getRankColor = (r: number) => {
    switch (r) {
      case 1: return 'text-[#FF6B35]' // Gold
      case 2: return 'text-[#C0C0C0]' // Silver
      case 3: return 'text-[#CD7F32]' // Bronze
      case 4: return 'text-[#2E6DB4]' // Blue
      case 5: return 'text-[#6B7280]' // Gray
      default: return 'text-[#6B7280]'
    }
  }
  
  return (
    <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#3a3a3a] hover:border-[#FF6B35]/50 transition-colors relative overflow-hidden">
      {/* Player Image Background - Right Side, Faded */}
      {shooter.imageUrl && (
        <div 
          className="absolute right-0 top-0 bottom-0 w-40 md:w-52 pointer-events-none"
          style={{
            backgroundImage: `url(${shooter.imageUrl})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right center',
            opacity: 0.15,
            maskImage: 'linear-gradient(to right, transparent 0%, black 30%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 30%)',
          }}
        />
      )}
      
      <div className="flex items-start gap-4 relative z-10">
        {/* Rank Number - Large Russo One Font, Faded */}
        <div className="w-12 h-14 flex items-center justify-center flex-shrink-0">
          <span className={`font-russo-one text-4xl font-bold opacity-50 ${getRankColor(rank)}`}>
            {rank}
          </span>
        </div>
        
        {/* Shooter Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-lg font-bold text-[#E5E5E5] truncate uppercase">{shooter.name}</h4>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#FF6B35]/20 text-[#FF6B35]">
              {similarityScore.overall}% Match
            </span>
          </div>
          <p className="text-[#888] text-sm">{shooter.team} • {shooter.position}</p>
          
          {/* Physical Stats */}
          <div className="flex flex-wrap gap-3 mt-2 text-xs">
            <span className="text-[#888]">
              <span className="text-[#E5E5E5] font-medium">{heightFt}&apos;{heightIn}&quot;</span> Height
            </span>
            <span className="text-[#888]">
              <span className="text-[#E5E5E5] font-medium">{wingspanFt}&apos;{wingspanIn}&quot;</span> Wingspan
            </span>
            <span className="text-[#888]">
              <span className="text-[#E5E5E5] font-medium">{shooter.weightLbs}</span> lbs
            </span>
          </div>
          
          {/* Match Reasons */}
          <div className="flex flex-wrap gap-2 mt-3">
            {matchReasons.slice(0, 3).map((reason, idx) => (
              <span 
                key={idx}
                className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30"
              >
                {reason}
              </span>
            ))}
          </div>
          
          {/* Traits */}
          {shooter.traits.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {shooter.traits.slice(0, 2).map((trait, idx) => (
                <span 
                  key={idx}
                  className="px-2 py-1 rounded text-xs bg-[#2a2a2a] text-[#888]"
                >
                  {trait}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Similarity Breakdown */}
        <div className="hidden md:flex flex-col gap-1 text-right flex-shrink-0">
          <div className="text-xs text-[#888]">Physical: <span className="text-[#E5E5E5] font-medium">{similarityScore.physical}%</span></div>
          <div className="text-xs text-[#888]">Skill: <span className="text-[#E5E5E5] font-medium">{similarityScore.skill}%</span></div>
          <div className="text-xs text-[#888]">Mechanics: <span className="text-[#E5E5E5] font-medium">{similarityScore.mechanics}%</span></div>
        </div>
      </div>
    </div>
  )
}

function OptimalMetricCard({ 
  label, 
  value, 
  stdDev, 
  unit 
}: { 
  label: string
  value: number
  stdDev: number
  unit: string
}) {
  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a] text-center">
      <p className="text-xs text-[#888] uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-green-400">{value}{unit}</p>
      <p className="text-xs text-[#888]">±{stdDev}{unit} variance</p>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function MechanicComparisonRow({ comparison }: { comparison: MechanicComparison }) {
  const statusColors = {
    GOOD: { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/40" },
    NEEDS_WORK: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/40" },
    CRITICAL: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/40" }
  }
  
  const colors = statusColors[comparison.status]
  const diffText = comparison.difference > 0 ? `+${comparison.difference}°` : `${comparison.difference}°`
  
  return (
    <div className={`rounded-lg p-4 border ${colors.bg} ${colors.border}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-[#E5E5E5]">{comparison.metric}</span>
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${colors.bg} ${colors.text} border ${colors.border}`}>
          {comparison.status.replace("_", " ")}
        </span>
      </div>
      <div className="flex items-center gap-4 mb-2">
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[#888]">You: {comparison.userValue}°</span>
            <span className="text-[#888]">Optimal: {comparison.optimalValue}°</span>
          </div>
          <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden relative">
            {/* Optimal marker */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-green-400 z-10"
              style={{ left: `${Math.min(100, Math.max(0, (comparison.optimalValue / 180) * 100))}%` }}
            />
            {/* User value bar */}
            <div 
              className={`h-full ${colors.text.replace("text-", "bg-")} rounded-full`}
              style={{ width: `${Math.min(100, Math.max(0, (comparison.userValue / 180) * 100))}%` }}
            />
          </div>
        </div>
        <span className={`font-bold ${colors.text} min-w-[60px] text-right`}>{diffText}</span>
      </div>
      <p className="text-sm text-[#E5E5E5]">{comparison.recommendation}</p>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function FeedbackCard({ item, type }: { item: FeedbackItem; type: "strength" | "improvement" }) {
  const bgColor = type === "strength" ? "bg-green-500/10" : "bg-orange-500/10"
  const borderColor = type === "strength" ? "border-green-500/30" : "border-orange-500/30"
  
  return (
    <div className={`rounded-lg p-4 border ${bgColor} ${borderColor}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {FEEDBACK_ICONS[item.icon]}
        </div>
        <div>
          <h5 className="font-bold text-[#E5E5E5] mb-1">{item.title}</h5>
          <p className="text-sm text-[#888]">{item.description}</p>
        </div>
      </div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function DrillCard({ drill, index }: { drill: DrillRecommendation; index: number }) {
  const difficultyColors = {
    EASY: "bg-green-500/20 text-green-400 border-green-500/30",
    MEDIUM: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    HARD: "bg-red-500/20 text-red-400 border-red-500/30"
  }
  
  return (
    <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#3a3a3a]">
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
          <span className="text-orange-400 font-bold">{index}</span>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${difficultyColors[drill.difficulty]}`}>
          {drill.difficulty}
        </span>
      </div>
      <h4 className="font-bold text-[#E5E5E5] mb-1">{drill.name}</h4>
      <p className="text-sm text-[#888] mb-3">{drill.description}</p>
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#888]">Duration: <span className="text-[#E5E5E5]">{drill.duration}</span></span>
        <span className="px-2 py-0.5 rounded bg-[#2a2a2a] text-[#888]">{drill.focusArea}</span>
      </div>
    </div>
  )
}

