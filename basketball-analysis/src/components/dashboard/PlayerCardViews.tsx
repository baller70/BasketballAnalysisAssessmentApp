"use client"

import React from "react"
import { 
  Trophy, 
  Star, 
  TrendingUp, 
  Award, 
  CheckCircle2,
  Target,
  Zap,
  Medal
} from "lucide-react"
import Image from "next/image"
import type { DashboardView } from "../DashboardViewSelector"

// Types for analysis data
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

interface MatchedShooter {
  name: string
  team: string
  similarityScore: number
}

interface AnalysisData {
  overallScore: number
  formCategory: string
  shootingStats: ShootingStats
  matchedShooter: MatchedShooter
}

interface Archetype {
  title: string
  description: string
  color: string
  icon: React.ReactNode
}

interface PlayerCardProps {
  analysisData: AnalysisData
  archetype: Archetype
  playerName: string
  poseConfidence: number
  dashboardView: DashboardView
}

// Helper to get score bar color class
const getBarColor = (score: number) => {
  if (score >= 80) return 'bg-green-500'
  if (score >= 70) return 'bg-[#FFD700]'
  if (score >= 60) return 'bg-yellow-500'
  return 'bg-orange-500'
}

// Helper to get score text color
const getScoreTextColor = (score: number) => {
  if (score >= 80) return 'text-green-400'
  if (score >= 70) return 'text-[#FFD700]'
  if (score >= 60) return 'text-yellow-400'
  return 'text-orange-400'
}

// Helper to get grade letter
const getGrade = (score: number) => {
  if (score >= 90) return 'A+'
  if (score >= 85) return 'A'
  if (score >= 80) return 'A-'
  if (score >= 75) return 'B+'
  if (score >= 70) return 'B'
  if (score >= 65) return 'B-'
  if (score >= 60) return 'C+'
  return 'C'
}

// Helper to get kid-friendly rating
const getKidRating = (score: number) => {
  if (score >= 85) return { stars: 5, label: 'SUPER' }
  if (score >= 75) return { stars: 4, label: 'GREAT' }
  if (score >= 65) return { stars: 3, label: 'GOOD' }
  if (score >= 55) return { stars: 2, label: 'OK' }
  return { stars: 1, label: 'TRY' }
}

// ============================================
// STANDARD VIEW PLAYER CARD
// For Middle School / High School Players
// Same structure as Professional, but 4 key stats with grades
// ============================================
export function StandardPlayerCard({ analysisData, archetype, playerName, poseConfidence }: Omit<PlayerCardProps, 'dashboardView'>) {
  // 4 key stats for Standard view
  const keyStats = [
    { label: 'FORM', value: analysisData.shootingStats.form },
    { label: 'BALANCE', value: analysisData.shootingStats.balance },
    { label: 'RELEASE', value: analysisData.shootingStats.release },
    { label: 'FOLLOW', value: analysisData.shootingStats.follow },
  ]
  
  // Calculate level
  const level = analysisData.overallScore >= 85 ? 'ELITE' 
    : analysisData.overallScore >= 75 ? 'ADVANCED'
    : analysisData.overallScore >= 65 ? 'SKILLED'
    : analysisData.overallScore >= 55 ? 'DEVELOPING'
    : 'BEGINNER'

  return (
    <>
      {/* Bio Stats Row - Simplified for Standard */}
      <div className="bg-[#2a2a2a] px-1 py-2 border-b border-[#3a3a3a]">
        <div className="grid grid-cols-4 divide-x divide-[#3a3a3a]">
          <div className="px-2 text-center">
            <p className="text-[#888] text-[10px] uppercase">Level</p>
            <p className="text-white font-bold text-sm">{level}</p>
          </div>
          <div className="px-2 text-center">
            <p className="text-[#888] text-[10px] uppercase">Grade</p>
            <p className={`font-bold text-sm ${getScoreTextColor(analysisData.overallScore)}`}>
              {getGrade(analysisData.overallScore)}
            </p>
          </div>
          <div className="px-2 text-center">
            <p className="text-[#888] text-[10px] uppercase">Rank</p>
            <p className="text-white font-bold text-sm">#{Math.floor(100 - analysisData.overallScore + 10)}</p>
          </div>
          <div className="px-2 text-center">
            <p className="text-[#888] text-[10px] uppercase">Match</p>
            <p className="text-[#FFD700] font-bold text-sm">{analysisData.matchedShooter.similarityScore}%</p>
          </div>
        </div>
      </div>

      {/* Main Content: 4-Stat Grid + Progress Ring */}
      <div className="grid grid-cols-3 bg-[#1a1a1a]">
        {/* Left: Key Stats with Grades */}
        <div className="col-span-2 p-3 border-r border-[#3a3a3a]">
          {/* Archetype Badge */}
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${archetype.color}20`, color: archetype.color }}
            >
              {archetype.icon}
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider" style={{ color: archetype.color }}>
                {archetype.title}
              </h3>
              <p className="text-[#888] text-[9px]">{archetype.description}</p>
            </div>
          </div>
          
          {/* 4-Stat Grid with Letter Grades */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {keyStats.map((stat) => (
              <div key={stat.label}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[#888] text-[9px] uppercase">{stat.label}</p>
                  <span className={`text-xs font-bold ${getScoreTextColor(stat.value)}`}>
                    {getGrade(stat.value)}
                  </span>
                </div>
                <p className="text-white font-black text-2xl">{stat.value}</p>
                <div className="h-1.5 bg-[#3a3a3a] rounded-full overflow-hidden mt-1">
                  <div 
                    className={`h-full rounded-full ${getBarColor(stat.value)}`} 
                    style={{ width: `${stat.value}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Overall Progress Ring */}
        <div className="p-4 bg-gradient-to-b from-[#252525] to-[#1a1a1a] flex flex-col items-center justify-center">
          <h3 className="text-[#FFD700] font-bold text-xs uppercase tracking-[0.15em] mb-3 text-center">OVERALL</h3>
          
          {/* Large Progress Ring */}
          <div className="relative w-20 h-20 mb-2">
            <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 80 80">
              <circle
                cx="40" cy="40" r="34"
                fill="none"
                stroke="#3a3a3a"
                strokeWidth="6"
              />
              <circle
                cx="40" cy="40" r="34"
                fill="none"
                stroke={analysisData.overallScore >= 80 ? '#22c55e' : analysisData.overallScore >= 70 ? '#FFD700' : '#eab308'}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${(analysisData.overallScore / 100) * 213.6} 213.6`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-black ${getScoreTextColor(analysisData.overallScore)}`}>
                {analysisData.overallScore}
              </span>
            </div>
          </div>
          
          <p className={`text-xs font-bold uppercase tracking-wider ${getScoreTextColor(analysisData.overallScore)}`}>
            {getGrade(analysisData.overallScore)}
          </p>
        </div>
      </div>

      {/* Matched Shooter Bar */}
      <div className="bg-[#2a2a2a] px-4 py-3 border-t border-[#3a3a3a]">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#FFD700]/50">
            <Image
              src="https://cdn.nba.com/headshots/nba/latest/1040x760/201142.png"
              alt={analysisData.matchedShooter.name}
              fill
              sizes="48px"
              className="object-cover object-top scale-150 translate-y-1"
            />
          </div>
          <div className="flex-1">
            <p className="text-[#888] text-[10px] uppercase tracking-wider">Matched Shooter</p>
            <p className="text-white font-bold text-sm">{analysisData.matchedShooter.name}</p>
          </div>
          <div className="text-right">
            <p className="text-[#FFD700] font-black text-xl">{analysisData.matchedShooter.similarityScore}%</p>
            <p className="text-[#888] text-[10px] uppercase">Match</p>
          </div>
        </div>
      </div>
    </>
  )
}

// ============================================
// BASIC VIEW PLAYER CARD
// For Young Kids (7-10 years old)
// Same structure, but stars and simple labels
// ============================================
export function BasicPlayerCard({ analysisData, archetype, playerName }: Omit<PlayerCardProps, 'dashboardView' | 'poseConfidence'>) {
  // 3 simple stats for Basic view with kid-friendly names
  const simpleStats = [
    { label: 'ARMS', value: Math.round((analysisData.shootingStats.form + analysisData.shootingStats.elbow) / 2) },
    { label: 'LEGS', value: Math.round((analysisData.shootingStats.balance + analysisData.shootingStats.power) / 2) },
    { label: 'SHOT', value: Math.round((analysisData.shootingStats.release + analysisData.shootingStats.follow) / 2) },
  ]
  
  const overallRating = getKidRating(analysisData.overallScore)

  // Star component
  const StarRating = ({ count, max = 5 }: { count: number, max?: number }) => (
    <div className="flex gap-0.5">
      {[...Array(max)].map((_, i) => (
        <Star 
          key={i} 
          className={`w-4 h-4 ${i < count ? 'text-[#FFD700] fill-[#FFD700]' : 'text-[#3a3a3a]'}`}
        />
      ))}
    </div>
  )

  return (
    <>
      {/* Fun Stats Row */}
      <div className="bg-[#2a2a2a] px-1 py-3 border-b border-[#3a3a3a]">
        <div className="grid grid-cols-3 divide-x divide-[#3a3a3a]">
          <div className="px-3 text-center">
            <p className="text-[#888] text-[10px] uppercase mb-1">Your Stars</p>
            <StarRating count={overallRating.stars} />
          </div>
          <div className="px-3 text-center">
            <p className="text-[#888] text-[10px] uppercase mb-1">Rating</p>
            <p className="text-[#FFD700] font-black text-lg">{overallRating.label}</p>
          </div>
          <div className="px-3 text-center">
            <p className="text-[#888] text-[10px] uppercase mb-1">Like Pro</p>
            <p className="text-white font-bold text-sm">{analysisData.matchedShooter.name.split(' ')[1]}</p>
          </div>
        </div>
      </div>

      {/* Main Content: 3 Stats + Big Score */}
      <div className="grid grid-cols-3 bg-[#1a1a1a]">
        {/* Left: Simple 3-Stat Display */}
        <div className="col-span-2 p-3 border-r border-[#3a3a3a]">
          {/* Archetype Badge - Kid Friendly */}
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${archetype.color}20`, color: archetype.color }}
            >
              {archetype.icon}
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider" style={{ color: archetype.color }}>
                {archetype.title}
              </h3>
            </div>
          </div>
          
          {/* 3 Simple Stats with Star Ratings */}
          <div className="space-y-3">
            {simpleStats.map((stat) => {
              const rating = getKidRating(stat.value)
              return (
                <div key={stat.label} className="bg-[#2a2a2a] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-bold text-sm">{stat.label}</span>
                    <StarRating count={rating.stars} />
                  </div>
                  <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${getBarColor(stat.value)}`} 
                      style={{ width: `${stat.value}%` }} 
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Big Fun Score */}
        <div className="p-4 bg-gradient-to-b from-[#252525] to-[#1a1a1a] flex flex-col items-center justify-center">
          <h3 className="text-[#FFD700] font-bold text-xs uppercase tracking-[0.1em] mb-2 text-center">SCORE</h3>
          
          {/* Big Score Circle */}
          <div className="relative w-20 h-20 mb-2">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5 border-4 border-[#FFD700]/50" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-[#FFD700]">{analysisData.overallScore}</span>
            </div>
          </div>
          
          {/* Stars below score */}
          <StarRating count={overallRating.stars} />
          <p className="text-[#FFD700] text-xs font-bold mt-1">{overallRating.label}</p>
        </div>
      </div>

      {/* NBA Player Match - Fun Style */}
      <div className="bg-[#2a2a2a] px-4 py-3 border-t border-[#3a3a3a]">
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 rounded-full overflow-hidden border-3 border-[#FFD700] shadow-lg shadow-[#FFD700]/20">
            <Image
              src="https://cdn.nba.com/headshots/nba/latest/1040x760/201142.png"
              alt={analysisData.matchedShooter.name}
              fill
              sizes="56px"
              className="object-cover object-top scale-150 translate-y-1"
            />
          </div>
          <div className="flex-1">
            <p className="text-[#888] text-[10px] uppercase tracking-wider">You shoot like</p>
            <p className="text-[#FFD700] font-black text-lg">{analysisData.matchedShooter.name}</p>
          </div>
          <Trophy className="w-8 h-8 text-[#FFD700]" />
        </div>
      </div>
    </>
  )
}

// Export a wrapper component that renders the appropriate view
export function DashboardPlayerCard(props: PlayerCardProps) {
  const { dashboardView, ...cardProps } = props

  switch (dashboardView) {
    case "standard":
      return <StandardPlayerCard {...cardProps} />
    case "basic":
      return <BasicPlayerCard {...cardProps} />
    case "professional":
    default:
      // Professional view uses the existing player card in the main page
      return null
  }
}
