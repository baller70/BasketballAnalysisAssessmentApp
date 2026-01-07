"use client"

import React, { useState, useEffect } from "react"
import { 
  Trophy, Star, Target, Flame, Zap, Medal, Crown, Lock, 
  Users, TrendingUp, Timer, Check, ChevronRight, ChevronDown,
  Sparkles, Award, Shield, Gem, Swords, Circle, X,
  Eye, Hand, Scale, Activity, Crosshair, Rocket, 
  Mountain, TreePine, Sun, Moon, Sunrise, CloudLightning,
  Dribbble, CircleDot, Focus, Gauge, Repeat, Calendar,
  Share2, Download, Volume2, VolumeX
} from "lucide-react"

// ============================================
// CUSTOM SNEAKER ICONS - Basketball Themed
// Progression from basic to premium sneakers
// ============================================

// Basic Low-Top Sneaker (Rookie) - Like a basic trainer
const SneakerRookie = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 16.5L3 14.5L5 14L7 13L9 12.5L12 12L15 12.5L18 13.5L20 14.5L21 15L22 16.5L22 18L20 19L4 19L2 18L2 16.5Z" fill="currentColor" opacity="0.9"/>
    <path d="M5 14L5 12L7 11L9 10.5L11 10.5L11 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="7" cy="17" r="1" fill="currentColor" opacity="0.5"/>
    <circle cx="11" cy="17" r="1" fill="currentColor" opacity="0.5"/>
    <circle cx="15" cy="17" r="1" fill="currentColor" opacity="0.5"/>
  </svg>
)

// Classic Sneaker (Starter) - Like Converse/Vans
const SneakerStarter = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 16L3 14L6 13L9 12L12 11.5L15 12L18 13L20 14L21.5 15.5L22 17L22 18.5L20 19.5L4 19.5L2 18.5L2 16Z" fill="currentColor" opacity="0.9"/>
    <path d="M4 14L4 11L6 9.5L9 8.5L11 8.5L12 9L12 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M6 13L9 14L12 14.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
    <circle cx="18" cy="16.5" r="1.5" fill="currentColor" opacity="0.3"/>
  </svg>
)

// Mid-Top Basketball Shoe (6th Player) - Like Air Force 1
const SneakerSixthPlayer = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 15.5L3 13L6 12L9 11L12 10.5L15 11L18 12L20 13L21.5 14.5L22 16.5L22 18L20 19L4 19L2 18L2 15.5Z" fill="currentColor" opacity="0.9"/>
    <path d="M4 13L4 9L6 7.5L9 6.5L11 6.5L12 7.5L12 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M6 9L10 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
    <path d="M14 13L18 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
    <circle cx="18" cy="16" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6"/>
  </svg>
)

// High-Top Performance (Starting 5) - Like Jordan 1
const SneakerStartingFive = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 15L3 12.5L6 11.5L9 10.5L12 10L15 10.5L18 11.5L20 12.5L21.5 14L22 16L22 17.5L20 18.5L4 18.5L2 17.5L2 15Z" fill="currentColor" opacity="0.9"/>
    <path d="M4 12.5L4 7L6 5L9 4L11 4L12.5 5L13 7L13 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M6 7L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
    <path d="M6 9L10 9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
    <path d="M15 12L19 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
  </svg>
)

// Signature Shoe (All-Star) - Like LeBron/Curry
const SneakerAllStar = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 14.5L3 12L6 11L9 10L12 9.5L15 10L18 11L20 12L21.5 13.5L22 15.5L22 17L20 18L4 18L2 17L2 14.5Z" fill="currentColor" opacity="0.9"/>
    <path d="M4 12L4 6L6 4L9 3L11 3L13 4L14 6L14 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M6 6L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
    <path d="M6 8L11 8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
    <path d="M14 11L19 12.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
    <circle cx="9" cy="15" r="1.5" fill="currentColor" opacity="0.4"/>
  </svg>
)

// Elite Performance (Elite) - Like Kobe
const SneakerElite = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 14L3 11.5L6 10.5L9 9.5L12 9L15 9.5L18 10.5L20 11.5L21.5 13L22 15L22 16.5L20 17.5L4 17.5L2 16.5L2 14Z" fill="currentColor" opacity="0.9"/>
    <path d="M4 11.5L4 5.5L6 3.5L9 2.5L11 2.5L13 3.5L14.5 5.5L15 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M5 5L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
    <path d="M5 7L12 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
    <path d="M14 10.5L20 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
    <path d="M7 12L10 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
  </svg>
)

// MVP Signature (MVP) - Like Jordan 11
const SneakerMVP = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 13.5L3 11L6 10L9 9L12 8.5L15 9L18 10L20 11L21.5 12.5L22 14.5L22 16L20 17L4 17L2 16L2 13.5Z" fill="currentColor" opacity="0.9"/>
    <path d="M4 11L4 5L6 3L9 2L12 2L14 3L15 5L15 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M4 8L15 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
    <path d="M5 5L14 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
    <path d="M14 10L20 11.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
    <ellipse cx="18" cy="14" rx="2" ry="1.5" fill="currentColor" opacity="0.3"/>
  </svg>
)

// Championship Edition (Champion) - Like Finals PE
const SneakerChampion = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 13L3 10.5L6 9.5L9 8.5L12 8L15 8.5L18 9.5L20 10.5L21.5 12L22 14L22 15.5L20 16.5L4 16.5L2 15.5L2 13Z" fill="currentColor" opacity="0.9"/>
    <path d="M4 10.5L4 4.5L6 2.5L9 1.5L12 1.5L14 2.5L15.5 4.5L16 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M4 7L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
    <path d="M5 4L14 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
    <path d="M14 9.5L20 11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
    <path d="M9 4L9 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    <circle cx="18" cy="13" r="1.5" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5"/>
  </svg>
)

// Hall of Fame Edition (Hall of Fame) - Like Retro Classics
const SneakerHallOfFame = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 12.5L3 10L6 9L9 8L12 7.5L15 8L18 9L20 10L21.5 11.5L22 13.5L22 15L20 16L4 16L2 15L2 12.5Z" fill="currentColor" opacity="0.9"/>
    <path d="M4 10L4 4L6 2L9 1L12 1L15 2L16 4L16 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M4 6L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
    <path d="M5 3L15 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
    <path d="M6 9L10 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    <path d="M14 9L20 10.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
    <path d="M10 3L10 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
    <circle cx="7" cy="13" r="1.5" fill="currentColor" opacity="0.3"/>
    <circle cx="12" cy="13" r="1.5" fill="currentColor" opacity="0.3"/>
  </svg>
)

// G.O.A.T. Edition (G.O.A.T.) - Ultimate Legendary Sneaker
const SneakerGOAT = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 12L3 9.5L6 8.5L9 7.5L12 7L15 7.5L18 8.5L20 9.5L21.5 11L22 13L22 14.5L20 15.5L4 15.5L2 14.5L2 12Z" fill="currentColor" opacity="0.95"/>
    <path d="M4 9.5L4 3.5L6 1.5L9 0.5L12 0.5L15 1.5L17 3.5L17 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M4 5.5L17 5.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.7"/>
    <path d="M5 2.5L16 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
    <path d="M6 8.5L11 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
    <path d="M14 8.5L20 10" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity="0.8"/>
    <path d="M10 2.5L10 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
    <circle cx="7" cy="12.5" r="1.5" fill="currentColor" opacity="0.4"/>
    <circle cx="12" cy="12.5" r="1.5" fill="currentColor" opacity="0.4"/>
    <circle cx="17" cy="12.5" r="1.5" fill="currentColor" opacity="0.4"/>
    {/* Crown detail for G.O.A.T. */}
    <path d="M8 3L10 1L12 3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
  </svg>
)

// ============================================
// PREMIUM VIDEO GAME BADGE SYSTEM
// 10 LEVELS - MOBILE FIRST - BASKETBALL THEMED
// ============================================

// ============================================
// TIER SYSTEM - VIDEO GAME STYLE
// ============================================

type BadgeTier = 'rookie' | 'starter' | 'sixth_player' | 'starting_five' | 'all_star' | 'elite' | 'mvp' | 'champion' | 'hall_of_fame' | 'goat'

// Duolingo-Inspired Color Scheme
// Primary: #FF6B35 (Orange)
// Background: #1a1a1a, #2a2a2a, #3a3a3a
// Text: #E5E5E5, #888
// Success: #22C55E
// Accent variations of orange for tiers

// Sneaker names for each tier (inspired by real basketball sneakers)
const SNEAKER_NAMES: Record<BadgeTier, string> = {
  rookie: 'Basic Trainer',
  starter: 'Classic Canvas',
  sixth_player: 'Air Force Low',
  starting_five: 'Jordan 1 High',
  all_star: 'LeBron Signature',
  elite: 'Kobe Mamba',
  mvp: 'Jordan 11',
  champion: 'Finals PE',
  hall_of_fame: 'Retro Legend',
  goat: 'Air Mag'
}

const TIER_CONFIG: Record<BadgeTier, {
  name: string
  subtitle: string
  sneakerName: string
  level: number
  color: string
  gradient: string
  glow: string
  borderColor: string
  textColor: string
  bgPattern: string
  icon: React.ElementType
  xpMultiplier: number
}> = {
  rookie: {
    name: 'Rookie',
    subtitle: 'Just Getting Started',
    sneakerName: SNEAKER_NAMES.rookie,
    level: 1,
    color: '#CD7F32',
    gradient: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 50%, #CD7F32 100%)',
    glow: '0 0 20px rgba(205, 127, 50, 0.5)',
    borderColor: '#8B4513',
    textColor: '#CD7F32',
    bgPattern: 'radial-gradient(circle at 30% 30%, rgba(205, 127, 50, 0.3) 0%, transparent 50%)',
    icon: SneakerRookie,
    xpMultiplier: 1
  },
  starter: {
    name: 'Starter',
    subtitle: 'Earned Your Spot',
    sneakerName: SNEAKER_NAMES.starter,
    level: 2,
    color: '#C0C0C0',
    gradient: 'linear-gradient(135deg, #E8E8E8 0%, #A8A8A8 50%, #C0C0C0 100%)',
    glow: '0 0 20px rgba(192, 192, 192, 0.5)',
    borderColor: '#808080',
    textColor: '#C0C0C0',
    bgPattern: 'radial-gradient(circle at 30% 30%, rgba(192, 192, 192, 0.3) 0%, transparent 50%)',
    icon: SneakerStarter,
    xpMultiplier: 1.5
  },
  sixth_player: {
    name: '6th Player',
    subtitle: 'Key Contributor',
    sneakerName: SNEAKER_NAMES.sixth_player,
    level: 3,
    color: '#FFD700',
    gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
    glow: '0 0 25px rgba(255, 215, 0, 0.6)',
    borderColor: '#DAA520',
    textColor: '#FFD700',
    bgPattern: 'radial-gradient(circle at 30% 30%, rgba(255, 215, 0, 0.3) 0%, transparent 50%)',
    icon: SneakerSixthPlayer,
    xpMultiplier: 2
  },
  starting_five: {
    name: 'Starting 5',
    subtitle: 'Core Player',
    sneakerName: SNEAKER_NAMES.starting_five,
    level: 4,
    color: '#E5E4E2',
    gradient: 'linear-gradient(135deg, #E5E4E2 0%, #BCC6CC 50%, #E5E4E2 100%)',
    glow: '0 0 25px rgba(229, 228, 226, 0.6)',
    borderColor: '#8E9AAF',
    textColor: '#E5E4E2',
    bgPattern: 'radial-gradient(circle at 30% 30%, rgba(229, 228, 226, 0.4) 0%, transparent 50%)',
    icon: SneakerStartingFive,
    xpMultiplier: 2.5
  },
  all_star: {
    name: 'All-Star',
    subtitle: 'Elite Recognition',
    sneakerName: SNEAKER_NAMES.all_star,
    level: 5,
    color: '#B9F2FF',
    gradient: 'linear-gradient(135deg, #B9F2FF 0%, #87CEEB 30%, #00CED1 70%, #B9F2FF 100%)',
    glow: '0 0 30px rgba(185, 242, 255, 0.7)',
    borderColor: '#00CED1',
    textColor: '#B9F2FF',
    bgPattern: 'radial-gradient(circle at 30% 30%, rgba(185, 242, 255, 0.4) 0%, transparent 50%)',
    icon: SneakerAllStar,
    xpMultiplier: 3
  },
  elite: {
    name: 'Elite',
    subtitle: 'Best of the Best',
    sneakerName: SNEAKER_NAMES.elite,
    level: 6,
    color: '#9B59B6',
    gradient: 'linear-gradient(135deg, #9B59B6 0%, #8E44AD 50%, #9B59B6 100%)',
    glow: '0 0 30px rgba(155, 89, 182, 0.7)',
    borderColor: '#8E44AD',
    textColor: '#9B59B6',
    bgPattern: 'radial-gradient(circle at 30% 30%, rgba(155, 89, 182, 0.4) 0%, transparent 50%)',
    icon: SneakerElite,
    xpMultiplier: 4
  },
  mvp: {
    name: 'MVP',
    subtitle: 'Most Valuable Player',
    sneakerName: SNEAKER_NAMES.mvp,
    level: 7,
    color: '#E74C3C',
    gradient: 'linear-gradient(135deg, #E74C3C 0%, #C0392B 50%, #E74C3C 100%)',
    glow: '0 0 35px rgba(231, 76, 60, 0.7)',
    borderColor: '#C0392B',
    textColor: '#E74C3C',
    bgPattern: 'radial-gradient(circle at 30% 30%, rgba(231, 76, 60, 0.4) 0%, transparent 50%)',
    icon: SneakerMVP,
    xpMultiplier: 5
  },
  champion: {
    name: 'Champion',
    subtitle: 'Title Winner',
    sneakerName: SNEAKER_NAMES.champion,
    level: 8,
    color: '#FF6B35',
    gradient: 'linear-gradient(135deg, #FF6B35 0%, #FF4500 50%, #FF6B35 100%)',
    glow: '0 0 40px rgba(255, 107, 53, 0.8)',
    borderColor: '#FF4500',
    textColor: '#FF6B35',
    bgPattern: 'radial-gradient(circle at 30% 30%, rgba(255, 107, 53, 0.5) 0%, transparent 50%)',
    icon: SneakerChampion,
    xpMultiplier: 7
  },
  hall_of_fame: {
    name: 'Hall of Fame',
    subtitle: 'Legendary Status',
    sneakerName: SNEAKER_NAMES.hall_of_fame,
    level: 9,
    color: '#FF1493',
    gradient: 'linear-gradient(135deg, #FF1493 0%, #FF69B4 30%, #FF1493 70%, #C71585 100%)',
    glow: '0 0 45px rgba(255, 20, 147, 0.8)',
    borderColor: '#C71585',
    textColor: '#FF1493',
    bgPattern: 'radial-gradient(circle at 30% 30%, rgba(255, 20, 147, 0.5) 0%, transparent 50%)',
    icon: SneakerHallOfFame,
    xpMultiplier: 10
  },
  goat: {
    name: 'G.O.A.T.',
    subtitle: 'Greatest Of All Time',
    sneakerName: SNEAKER_NAMES.goat,
    level: 10,
    color: '#00FFFF',
    gradient: 'linear-gradient(135deg, #00FFFF 0%, #FFD700 25%, #FF6B35 50%, #FF1493 75%, #00FFFF 100%)',
    glow: '0 0 50px rgba(0, 255, 255, 0.9), 0 0 100px rgba(255, 107, 53, 0.5)',
    borderColor: '#00FFFF',
    textColor: '#00FFFF',
    bgPattern: 'conic-gradient(from 0deg, rgba(0, 255, 255, 0.3), rgba(255, 215, 0, 0.3), rgba(255, 107, 53, 0.3), rgba(255, 20, 147, 0.3), rgba(0, 255, 255, 0.3))',
    icon: SneakerGOAT,
    xpMultiplier: 15
  }
}

// ============================================
// BADGE CATEGORIES
// ============================================

type BadgeCategory = 'shooting' | 'consistency' | 'improvement' | 'milestones' | 'social' | 'mastery'

// Categories use subtle orange variations to match Duolingo style
const CATEGORY_CONFIG: Record<BadgeCategory, { name: string; icon: React.ElementType; color: string }> = {
  shooting: { name: 'Shooting', icon: Target, color: '#FF6B35' },
  consistency: { name: 'Consistency', icon: Flame, color: '#FF6B35' },
  improvement: { name: 'Improvement', icon: TrendingUp, color: '#FF6B35' },
  milestones: { name: 'Milestones', icon: Trophy, color: '#FF6B35' },
  social: { name: 'Social', icon: Users, color: '#FF6B35' },
  mastery: { name: 'Mastery', icon: Crown, color: '#FF6B35' }
}

// ============================================
// BADGE DATA - BASKETBALL THEMED
// ============================================

interface Badge {
  id: string
  name: string
  description: string
  longDescription: string
  howToEarn: string
  icon: React.ElementType
  tier: BadgeTier
  category: BadgeCategory
  unlocked: boolean
  unlockedDate?: string
  progress?: { current: number; total: number }
  rarity: number // % of players who have this
  xpReward: number
  secret?: boolean
}

const BADGES: Badge[] = [
  // ROOKIE TIER - Entry Level
  {
    id: "first-shot",
    name: "First Shot",
    description: "Complete your first analysis",
    longDescription: "Every journey begins with a single shot. You've taken your first step towards becoming a better shooter.",
    howToEarn: "Upload and analyze your first shooting video or image using the app",
    icon: Target,
    tier: 'rookie',
    category: 'milestones',
    unlocked: true,
    unlockedDate: "Jan 2, 2026",
    rarity: 95,
    xpReward: 50,
  },
  {
    id: "warm-up",
    name: "Warm Up",
    description: "Complete 5 analyses",
    longDescription: "You're getting warmed up! 5 analyses down, many more to go on your path to greatness.",
    howToEarn: "Complete a total of 5 shot analyses (any combination of video, image, or live)",
    icon: Activity,
    tier: 'rookie',
    category: 'milestones',
    unlocked: true,
    unlockedDate: "Jan 3, 2026",
    rarity: 78,
    xpReward: 75,
  },
  {
    id: "early-bird",
    name: "Early Bird",
    description: "Practice before 7 AM",
    longDescription: "The early bird gets the perfect shot! You've shown dedication by practicing at dawn.",
    howToEarn: "Complete any shot analysis between 5:00 AM and 7:00 AM local time",
    icon: Sunrise,
    tier: 'rookie',
    category: 'consistency',
    unlocked: true,
    unlockedDate: "Jan 4, 2026",
    rarity: 45,
    xpReward: 100,
  },

  // STARTER TIER
  {
    id: "getting-hot",
    name: "Getting Hot",
    description: "Score 75+ on 3 analyses",
    longDescription: "You're heating up! Consistently scoring above 75 shows real improvement.",
    howToEarn: "Achieve an overall score of 75 or higher on 3 separate shot analyses",
    icon: Flame,
    tier: 'starter',
    category: 'shooting',
    unlocked: true,
    unlockedDate: "Jan 5, 2026",
    rarity: 52,
    xpReward: 150,
  },
  {
    id: "week-warrior",
    name: "Week Warrior",
    description: "7-day practice streak",
    longDescription: "A full week of dedication! You've proven you have what it takes to commit.",
    howToEarn: "Complete at least one shot analysis every day for 7 consecutive days",
    icon: Calendar,
    tier: 'starter',
    category: 'consistency',
    unlocked: false,
    progress: { current: 5, total: 7 },
    rarity: 35,
    xpReward: 200,
  },
  {
    id: "form-focus",
    name: "Form Focus",
    description: "Achieve 85+ Form score",
    longDescription: "Your shooting form is looking crisp! Keep refining that technique.",
    howToEarn: "Get a Form score of 85 or higher on any single shot analysis",
    icon: Hand,
    tier: 'starter',
    category: 'shooting',
    unlocked: true,
    unlockedDate: "Jan 4, 2026",
    rarity: 40,
    xpReward: 175,
  },

  // 6TH PLAYER TIER
  {
    id: "sharp-shooter",
    name: "Sharp Shooter",
    description: "Achieve a 90+ overall score",
    longDescription: "Elite accuracy achieved! You're shooting like a pro now.",
    howToEarn: "Achieve an overall score of 90 or higher on any single shot analysis",
    icon: Crosshair,
    tier: 'sixth_player',
    category: 'shooting',
    unlocked: false,
    progress: { current: 87, total: 90 },
    rarity: 23,
    xpReward: 300,
  },
  {
    id: "comeback-kid",
    name: "Comeback Kid",
    description: "Improve score by 20+ points",
    longDescription: "From struggling to thriving! Your improvement journey is inspiring.",
    howToEarn: "Show a 20+ point improvement between your first analysis and any later analysis",
    icon: TrendingUp,
    tier: 'sixth_player',
    category: 'improvement',
    unlocked: true,
    unlockedDate: "Jan 6, 2026",
    rarity: 28,
    xpReward: 350,
  },
  {
    id: "film-study",
    name: "Film Study",
    description: "Compare with 10 elite shooters",
    longDescription: "Learning from the best! You've studied the techniques of 10 pro legends.",
    howToEarn: "Use the Compare feature to study 10 different elite shooters from the database",
    icon: Eye,
    tier: 'sixth_player',
    category: 'mastery',
    unlocked: false,
    progress: { current: 7, total: 10 },
    rarity: 20,
    xpReward: 400,
  },

  // STARTING 5 TIER
  {
    id: "iron-will",
    name: "Iron Will",
    description: "30-day practice streak",
    longDescription: "A month of unwavering dedication. Your commitment is legendary.",
    howToEarn: "Complete at least one shot analysis every day for 30 consecutive days",
    icon: Shield,
    tier: 'starting_five',
    category: 'consistency',
    unlocked: false,
    progress: { current: 12, total: 30 },
    rarity: 12,
    xpReward: 500,
  },
  {
    id: "perfect-arc",
    name: "Perfect Arc",
    description: "Achieve 95+ Arc score",
    longDescription: "Your ball flight is beautiful! That rainbow arc is textbook perfect.",
    howToEarn: "Get an Arc score of 95 or higher on any single shot analysis",
    icon: Activity,
    tier: 'starting_five',
    category: 'shooting',
    unlocked: false,
    rarity: 15,
    xpReward: 450,
  },
  {
    id: "century-club",
    name: "Century Club",
    description: "Complete 100 analyses",
    longDescription: "100 shots analyzed! You're a dedicated student of the game.",
    howToEarn: "Complete a total of 100 shot analyses (any combination of video, image, or live)",
    icon: Award,
    tier: 'starting_five',
    category: 'milestones',
    unlocked: false,
    progress: { current: 67, total: 100 },
    rarity: 10,
    xpReward: 600,
  },

  // ALL-STAR TIER
  {
    id: "elite-form",
    name: "Elite Form",
    description: "All shooting metrics 90+",
    longDescription: "Every aspect of your shot is elite. You've mastered the fundamentals.",
    howToEarn: "Achieve 90+ on all shooting metrics (Form, Arc, Release, Balance, Follow-through) in a single analysis",
    icon: Star,
    tier: 'all_star',
    category: 'mastery',
    unlocked: false,
    rarity: 8,
    xpReward: 750,
  },
  {
    id: "social-star",
    name: "Social Star",
    description: "Share 25 achievements",
    longDescription: "Inspiring others with your journey! Your shares motivate the community.",
    howToEarn: "Share 25 of your achievements, analyses, or progress updates to social media",
    icon: Share2,
    tier: 'all_star',
    category: 'social',
    unlocked: false,
    progress: { current: 12, total: 25 },
    rarity: 7,
    xpReward: 700,
  },
  {
    id: "night-owl",
    name: "Night Owl",
    description: "Practice 50 times after 10 PM",
    longDescription: "When others sleep, you grind. Your late-night dedication is unmatched.",
    howToEarn: "Complete 50 shot analyses between 10:00 PM and 5:00 AM local time",
    icon: Moon,
    tier: 'all_star',
    category: 'consistency',
    unlocked: false,
    progress: { current: 23, total: 50 },
    rarity: 6,
    xpReward: 800,
  },

  // ELITE TIER
  {
    id: "pro-match",
    name: "Pro Match",
    description: "95%+ match with a pro shooter",
    longDescription: "Your form mirrors a professional shooter. Elite status achieved!",
    howToEarn: "Achieve a 95% or higher similarity match with any elite shooter in the Compare feature",
    icon: Users,
    tier: 'elite',
    category: 'mastery',
    unlocked: false,
    rarity: 4,
    xpReward: 1000,
  },
  {
    id: "marathon",
    name: "Marathon",
    description: "90-day practice streak",
    longDescription: "Three months of pure dedication. You're in the elite 4% now.",
    howToEarn: "Complete at least one shot analysis every day for 90 consecutive days",
    icon: Mountain,
    tier: 'elite',
    category: 'consistency',
    unlocked: false,
    progress: { current: 12, total: 90 },
    rarity: 4,
    xpReward: 1200,
  },

  // MVP TIER
  {
    id: "sniper",
    name: "Sniper",
    description: "10 consecutive 95+ scores",
    longDescription: "Deadly accuracy, shot after shot. You don't miss.",
    howToEarn: "Score 95 or higher on 10 consecutive shot analyses without dropping below",
    icon: Crosshair,
    tier: 'mvp',
    category: 'shooting',
    unlocked: false,
    progress: { current: 3, total: 10 },
    rarity: 2.5,
    xpReward: 1500,
  },
  {
    id: "mentor",
    name: "Mentor",
    description: "Help 50 players improve",
    longDescription: "Your guidance has helped 50 players level up. True leadership.",
    howToEarn: "Have 50 different players view and apply your shared tips or training plans",
    icon: Users,
    tier: 'mvp',
    category: 'social',
    unlocked: false,
    progress: { current: 8, total: 50 },
    rarity: 2,
    xpReward: 1800,
  },

  // CHAMPION TIER
  {
    id: "perfect-game",
    name: "Perfect Game",
    description: "Achieve a 100 overall score",
    longDescription: "The impossible achieved. A perfect score. You are a champion.",
    howToEarn: "Achieve a perfect 100 overall score on any single shot analysis",
    icon: Trophy,
    tier: 'champion',
    category: 'shooting',
    unlocked: false,
    rarity: 0.5,
    xpReward: 2500,
  },
  {
    id: "year-one",
    name: "Year One",
    description: "365-day practice streak",
    longDescription: "A full year without missing a day. Your dedication defines greatness.",
    howToEarn: "Complete at least one shot analysis every day for 365 consecutive days",
    icon: Sun,
    tier: 'champion',
    category: 'consistency',
    unlocked: false,
    progress: { current: 12, total: 365 },
    rarity: 0.3,
    xpReward: 3000,
  },

  // HALL OF FAME TIER
  {
    id: "transcendent",
    name: "Transcendent",
    description: "Master all shooting techniques",
    longDescription: "You've transcended normal limits. Every technique perfected.",
    howToEarn: "Achieve 95+ scores in all 8 shooting technique categories at least once each",
    icon: Sparkles,
    tier: 'hall_of_fame',
    category: 'mastery',
    unlocked: false,
    rarity: 0.1,
    xpReward: 5000,
  },
  {
    id: "influencer",
    name: "Influencer",
    description: "1000+ players follow your journey",
    longDescription: "A thousand players look up to you. You're changing the game.",
    howToEarn: "Gain 1000 followers on your SHOTIQ profile through sharing and community engagement",
    icon: Users,
    tier: 'hall_of_fame',
    category: 'social',
    unlocked: false,
    rarity: 0.08,
    xpReward: 6000,
  },

  // G.O.A.T. TIER
  {
    id: "ultimate",
    name: "The Ultimate",
    description: "Unlock all achievements",
    longDescription: "The Greatest Of All Time. Every badge earned. Every challenge conquered. You are the G.O.A.T.",
    howToEarn: "Unlock every other badge in the game - complete all achievements across all tiers and categories",
    icon: Crown,
    tier: 'goat',
    category: 'mastery',
    unlocked: false,
    rarity: 0.01,
    xpReward: 10000,
    secret: true
  },
]

// ============================================
// PLAYER STATS
// ============================================

const PLAYER_STATS = {
  totalXP: 2875,
  level: 12,
  currentLevelXP: 875,
  nextLevelXP: 1500,
  unlockedBadges: 8,
  totalBadges: BADGES.length,
  rarest: "Comeback Kid",
  currentStreak: 5,
  longestStreak: 12,
}

// ============================================
// BADGE CARD COMPONENT - PREMIUM DESIGN
// ============================================

function BadgeCard({ badge, onClick }: { badge: Badge; onClick: () => void }) {
  const tierConfig = TIER_CONFIG[badge.tier]
  const isLocked = !badge.unlocked
  const hasProgress = badge.progress && !badge.unlocked
  const progressPercent = hasProgress ? (badge.progress!.current / badge.progress!.total) * 100 : 0
  
  return (
    <button
      onClick={onClick}
      className={`relative w-full aspect-square rounded-2xl overflow-hidden transition-all duration-300 ${
        isLocked 
          ? 'opacity-60 grayscale hover:opacity-80 hover:grayscale-[50%]' 
          : 'hover:scale-105 active:scale-95'
      }`}
      style={{
        background: isLocked ? '#1a1a1a' : '#0a0a0a',
        border: `2px solid ${isLocked ? '#333' : tierConfig.borderColor}`,
        boxShadow: isLocked ? 'none' : tierConfig.glow,
      }}
    >
      {/* Background Pattern */}
      {!isLocked && (
        <div 
          className="absolute inset-0 opacity-30"
          style={{ background: tierConfig.bgPattern }}
        />
      )}
      
      {/* Shine Effect for Unlocked */}
      {!isLocked && (
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute -inset-full animate-shine"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
              transform: 'rotate(25deg)',
            }}
          />
        </div>
      )}
      
      {/* Badge Icon Container */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
        {/* Icon with Metallic Effect */}
        <div 
          className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-1.5 ${
            isLocked ? 'bg-[#2a2a2a]' : ''
          }`}
          style={!isLocked ? {
            background: tierConfig.gradient,
            boxShadow: `inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.3), ${tierConfig.glow}`,
          } : undefined}
        >
          {isLocked ? (
            <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-[#555]" />
          ) : (
            <badge.icon className="w-7 h-7 sm:w-8 sm:h-8 text-[#1a1a1a]" />
          )}
          
          {/* Inner Shine */}
          {!isLocked && (
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-2.5 bg-white/40 rounded-full blur-sm" />
          )}
      </div>
      
        {/* Badge Name */}
        <p 
          className={`text-[9px] sm:text-[11px] font-bold text-center leading-tight uppercase tracking-wide ${
            isLocked ? 'text-[#555]' : ''
          }`}
          style={!isLocked ? { color: tierConfig.textColor } : undefined}
        >
        {badge.name}
        </p>
        
        {/* Tier Label */}
        <p className={`text-[7px] sm:text-[8px] font-medium mt-0.5 uppercase tracking-wider ${
          isLocked ? 'text-[#444]' : 'text-[#888]'
        }`}>
          {tierConfig.name}
        </p>
        
        {/* Progress Bar */}
        {hasProgress && (
          <div className="absolute bottom-2 left-2 right-2">
            <div className="h-1 bg-[#333] rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${progressPercent}%`,
                  background: tierConfig.gradient 
                }}
            />
          </div>
            <p className="text-[8px] text-[#666] text-center mt-0.5">
              {badge.progress!.current}/{badge.progress!.total}
            </p>
        </div>
      )}
      </div>
      
      {/* Rarity Indicator */}
      {!isLocked && (
        <div className="absolute top-1.5 right-1.5">
          <div 
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[8px] sm:text-[9px] font-bold"
            style={{
              background: 'rgba(0,0,0,0.7)',
              border: `1px solid ${tierConfig.borderColor}`,
              color: tierConfig.textColor,
            }}
          >
            {badge.rarity < 1 ? '<1' : Math.round(badge.rarity)}%
          </div>
        </div>
      )}
      
      {/* Secret Badge Indicator */}
      {badge.secret && isLocked && (
        <div className="absolute top-1.5 left-1.5">
          <div className="w-5 h-5 rounded-full bg-[#FF1493]/20 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-[#FF1493]" />
    </div>
        </div>
      )}
    </button>
  )
}

// ============================================
// BADGE DETAIL MODAL
// ============================================

function BadgeDetailModal({ badge, onClose }: { badge: Badge | null; onClose: () => void }) {
  if (!badge) return null
  
  const tierConfig = TIER_CONFIG[badge.tier]
  const categoryConfig = CATEGORY_CONFIG[badge.category]
  const isLocked = !badge.unlocked
  const hasProgress = badge.progress && !badge.unlocked
  const progressPercent = hasProgress ? (badge.progress!.current / badge.progress!.total) * 100 : 0
  
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full sm:max-w-sm bg-[#2a2a2a] rounded-t-3xl sm:rounded-2xl overflow-hidden"
        style={{
          border: `2px solid ${isLocked ? '#333' : tierConfig.borderColor}`,
          boxShadow: isLocked ? 'none' : tierConfig.glow,
        }}
      >
        {/* Background Pattern */}
        {!isLocked && (
          <div 
            className="absolute inset-0 opacity-20"
            style={{ background: tierConfig.bgPattern }}
          />
        )}
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center text-[#888] hover:text-white z-10"
        >
          <X className="w-4 h-4" />
        </button>
        
        {/* Content */}
        <div className="relative p-6 pt-8">
          {/* Badge Icon - Large */}
          <div className="flex justify-center mb-4">
            <div 
              className={`relative w-24 h-24 rounded-full flex items-center justify-center ${
                isLocked ? 'bg-[#2a2a2a]' : ''
              }`}
              style={!isLocked ? {
                background: tierConfig.gradient,
                boxShadow: `inset 0 4px 8px rgba(255,255,255,0.3), inset 0 -4px 8px rgba(0,0,0,0.3), ${tierConfig.glow}`,
              } : undefined}
            >
              {isLocked ? (
                <Lock className="w-10 h-10 text-[#555]" />
              ) : (
                <badge.icon className="w-10 h-10 text-[#1a1a1a]" />
              )}
              
              {/* Inner Shine */}
              {!isLocked && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-3 bg-white/40 rounded-full blur-sm" />
              )}
        </div>
      </div>

          {/* Badge Info */}
          <div className="text-center mb-4">
            <h2 
              className={`text-xl font-black mb-1 uppercase tracking-wide ${isLocked ? 'text-[#555]' : ''}`}
              style={!isLocked ? { color: tierConfig.textColor } : undefined}
            >
              {badge.name}
            </h2>
            <div className="flex items-center justify-center gap-2 mb-3">
              <span 
                className="text-xs font-bold uppercase px-2 py-0.5 rounded"
                style={{ 
                  background: `${tierConfig.color}20`,
                  color: tierConfig.textColor 
                }}
              >
                {tierConfig.name}
              </span>
              <span 
                className="text-xs font-medium px-2 py-0.5 rounded"
                style={{ 
                  background: `${categoryConfig.color}20`,
                  color: categoryConfig.color 
                }}
              >
                {categoryConfig.name}
              </span>
        </div>
        </div>
          
          {/* Description Section */}
          <div className="bg-[#2a2a2a] rounded-xl p-4 mb-3">
            <p className="text-[10px] text-[#666] uppercase tracking-wider font-medium mb-1">Description</p>
            <p className="text-[#ccc] text-sm leading-relaxed">{badge.longDescription}</p>
        </div>
          
          {/* How to Earn Section */}
          <div className="bg-[#2a2a2a] rounded-xl p-4 mb-3">
            <p className="text-[10px] text-[#666] uppercase tracking-wider font-medium mb-1">How to Earn</p>
            <p className="text-white text-sm leading-relaxed">{badge.howToEarn}</p>
        </div>
          
          {/* Progress or Unlock Status */}
          {hasProgress ? (
            <div className="bg-[#2a2a2a] rounded-xl p-4 mb-3">
              <p className="text-[10px] text-[#666] uppercase tracking-wider font-medium mb-2">Your Progress</p>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#888]">
                  {Math.round(progressPercent)}% Complete
                </span>
                <span style={{ color: tierConfig.textColor }} className="font-bold">
                  {badge.progress!.current}/{badge.progress!.total}
                </span>
      </div>
              <div className="h-3 bg-[#2a2a2a] rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${progressPercent}%`,
                    background: tierConfig.gradient 
                  }}
                />
              </div>
            </div>
          ) : badge.unlocked ? (
            <div className="bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-xl p-4 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#22C55E] flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[#22C55E] font-bold uppercase text-sm">Unlocked</span>
                </div>
                <span className="text-[#22C55E]/80 text-sm">{badge.unlockedDate}</span>
              </div>
            </div>
          ) : (
            <div className="bg-[#2a2a2a] rounded-xl p-4 mb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#666]" />
                <span className="text-[#666] text-sm">Not yet unlocked</span>
              </div>
            </div>
          )}
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#2a2a2a] rounded-xl p-3 text-center">
              <p className="text-[10px] text-[#666] uppercase tracking-wider font-medium mb-1">Rarity</p>
              <p 
                className="text-lg font-bold"
                style={{ color: tierConfig.textColor }}
              >
                {badge.rarity < 1 ? `<1%` : `${badge.rarity}%`}
              </p>
              <p className="text-[#555] text-[10px]">of players have this</p>
            </div>
            <div className="bg-[#2a2a2a] rounded-xl p-3 text-center">
              <p className="text-[10px] text-[#666] uppercase tracking-wider font-medium mb-1">XP Reward</p>
              <p 
                className="text-lg font-bold"
                style={{ color: tierConfig.textColor }}
              >
                +{badge.xpReward.toLocaleString()}
              </p>
              <p className="text-[#555] text-[10px]">experience points</p>
            </div>
        </div>
      </div>

        {/* Drag Handle (Mobile) */}
        <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#333] rounded-full" />
              </div>
    </div>
  )
}

// ============================================
// MOBILE-OPTIMIZED FILTER SECTION
// ============================================

function FilterSection({
  selectedTier,
  setSelectedTier,
  selectedCategory,
  setSelectedCategory,
  showUnlockedOnly,
  setShowUnlockedOnly,
  badgeCount
}: {
  selectedTier: BadgeTier | 'all'
  setSelectedTier: (tier: BadgeTier | 'all') => void
  selectedCategory: BadgeCategory | 'all'
  setSelectedCategory: (cat: BadgeCategory | 'all') => void
  showUnlockedOnly: boolean
  setShowUnlockedOnly: (val: boolean) => void
  badgeCount: number
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Count active filters
  const activeFilterCount = 
    (selectedTier !== 'all' ? 1 : 0) + 
    (selectedCategory !== 'all' ? 1 : 0) + 
    (showUnlockedOnly ? 1 : 0)
  
  // Get display names for active filters
  const getActiveFilterLabels = () => {
    const labels: string[] = []
    if (selectedTier !== 'all') {
      labels.push(TIER_CONFIG[selectedTier].name)
    }
    if (selectedCategory !== 'all') {
      labels.push(CATEGORY_CONFIG[selectedCategory].name)
    }
    if (showUnlockedOnly) {
      labels.push('Unlocked')
    }
    return labels
  }
  
  const clearAllFilters = () => {
    setSelectedTier('all')
    setSelectedCategory('all')
    setShowUnlockedOnly(false)
  }

  return (
    <div className="mb-6">
      {/* Filter Summary Bar - Always Visible */}
      <div className="bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] overflow-hidden">
        {/* Clickable Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between"
        >
                    <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FF6B35]/20 flex items-center justify-center">
              <Target className="w-4 h-4 text-[#FF6B35]" />
                      </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="bg-[#FF6B35] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
                    </div>
              <span className="text-[#888] text-xs">
                {badgeCount} badges
                {activeFilterCount > 0 && ` • ${getActiveFilterLabels().join(', ')}`}
                    </span>
                  </div>
              </div>
          <ChevronDown 
            className={`w-5 h-5 text-[#888] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
          />
        </button>
        
        {/* Active Filter Chips - Show when collapsed and filters are active */}
        {!isExpanded && activeFilterCount > 0 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {selectedTier !== 'all' && (
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedTier('all'); }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FF6B35]/20 border border-[#FF6B35]/30 rounded-full text-[#FF6B35] text-xs font-medium"
              >
                {TIER_CONFIG[selectedTier].name}
                <X className="w-3 h-3" />
              </button>
            )}
            {selectedCategory !== 'all' && (
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedCategory('all'); }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FF6B35]/20 border border-[#FF6B35]/30 rounded-full text-[#FF6B35] text-xs font-medium"
              >
                {CATEGORY_CONFIG[selectedCategory].name}
                <X className="w-3 h-3" />
              </button>
            )}
            {showUnlockedOnly && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowUnlockedOnly(false); }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#22C55E]/20 border border-[#22C55E]/30 rounded-full text-[#22C55E] text-xs font-medium"
              >
                Unlocked
                <X className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); clearAllFilters(); }}
              className="text-[#888] text-xs underline hover:text-white"
            >
              Clear all
            </button>
            </div>
        )}
        
        {/* Expanded Filter Options */}
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-[#3a3a3a]">
            {/* Tier Filter */}
            <div className="pt-4 pb-3">
              <p className="text-[#888] text-xs font-medium mb-3 uppercase tracking-wider">Tier</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectedTier('all')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    selectedTier === 'all'
                      ? 'bg-[#FF6B35] text-white'
                      : 'bg-[#3a3a3a] text-[#888] hover:bg-[#4a4a4a]'
                  }`}
                >
                  All
                </button>
                {(Object.keys(TIER_CONFIG) as BadgeTier[]).slice(0, 5).map((tier) => {
                  const config = TIER_CONFIG[tier]
                  return (
                    <button
                      key={tier}
                      onClick={() => setSelectedTier(tier)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                        selectedTier === tier
                          ? 'bg-[#FF6B35] text-white'
                          : 'bg-[#3a3a3a] text-[#888] hover:bg-[#4a4a4a]'
                      }`}
                    >
                      <config.icon className="w-3 h-3" />
                      {config.name}
                    </button>
                  )
                })}
              </div>
              {/* Advanced Tiers Row */}
              <div className="grid grid-cols-3 gap-2 mt-2">
                {(Object.keys(TIER_CONFIG) as BadgeTier[]).slice(5).map((tier) => {
                  const config = TIER_CONFIG[tier]
                  return (
                    <button
                      key={tier}
                      onClick={() => setSelectedTier(tier)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                        selectedTier === tier
                          ? 'bg-[#FF6B35] text-white'
                          : 'bg-[#3a3a3a] text-[#888] hover:bg-[#4a4a4a]'
                      }`}
                    >
                      <config.icon className="w-3 h-3" />
                      {config.name.length > 8 ? config.name.slice(0, 8) + '...' : config.name}
                    </button>
                  )
                })}
        </div>
      </div>

            {/* Category Filter */}
            <div className="pt-3 pb-3 border-t border-[#3a3a3a]">
              <p className="text-[#888] text-xs font-medium mb-3 uppercase tracking-wider">Category</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-[#FF6B35] text-white'
                      : 'bg-[#3a3a3a] text-[#888] hover:bg-[#4a4a4a]'
                  }`}
                >
                  All
                </button>
                {(Object.keys(CATEGORY_CONFIG) as BadgeCategory[]).map((cat) => {
                  const config = CATEGORY_CONFIG[cat]
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                        selectedCategory === cat
                          ? 'bg-[#FF6B35] text-white'
                          : 'bg-[#3a3a3a] text-[#888] hover:bg-[#4a4a4a]'
                      }`}
                    >
                      <config.icon className="w-3 h-3" />
                      {config.name}
                    </button>
                  )
                })}
          </div>
          </div>
            
            {/* Unlocked Toggle */}
            <div className="pt-3 border-t border-[#3a3a3a]">
              <button
                onClick={() => setShowUnlockedOnly(!showUnlockedOnly)}
                className={`w-full px-4 py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-between ${
                  showUnlockedOnly
                    ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30'
                    : 'bg-[#3a3a3a] text-[#888] hover:bg-[#4a4a4a]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Show Unlocked Only
                </span>
                <div className={`w-10 h-6 rounded-full transition-all ${showUnlockedOnly ? 'bg-[#22C55E]' : 'bg-[#555]'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-all mt-0.5 ${showUnlockedOnly ? 'translate-x-4.5 ml-0.5' : 'translate-x-0.5'}`} />
        </div>
              </button>
            </div>
            
            {/* Clear Filters Button */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="w-full mt-3 py-2.5 text-[#FF6B35] text-sm font-bold border border-[#FF6B35]/30 rounded-lg hover:bg-[#FF6B35]/10 transition-all"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// TIER PROGRESS SECTION
// ============================================

function TierProgressSection() {
  const tierCounts = Object.keys(TIER_CONFIG).reduce((acc, tier) => {
    const tierBadges = BADGES.filter(b => b.tier === tier as BadgeTier)
    const unlocked = tierBadges.filter(b => b.unlocked).length
    acc[tier as BadgeTier] = { unlocked, total: tierBadges.length }
    return acc
  }, {} as Record<BadgeTier, { unlocked: number; total: number }>)
  
  return (
    <div className="bg-[#2a2a2a] rounded-2xl p-4 border border-[#3a3a3a]">
      <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2 uppercase tracking-wide">
        <Award className="w-4 h-4 text-[#FF6B35]" />
        Tier Progress
      </h3>
      <div className="space-y-3">
        {(Object.keys(TIER_CONFIG) as BadgeTier[]).map((tier) => {
          const config = TIER_CONFIG[tier]
          const { unlocked, total } = tierCounts[tier]
          const percent = total > 0 ? (unlocked / total) * 100 : 0
          
          return (
            <div key={tier} className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ 
                  background: config.gradient,
                  boxShadow: unlocked > 0 ? config.glow : 'none',
                  opacity: unlocked > 0 ? 1 : 0.4
                }}
              >
                <config.icon className="w-4 h-4 text-[#1a1a1a]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span 
                    className="text-xs font-bold uppercase"
                    style={{ color: unlocked > 0 ? config.textColor : '#555' }}
                  >
                    {config.name}
                  </span>
                  <span className="text-[10px] text-[#666]">
                    {unlocked}/{total}
                  </span>
                </div>
                <div className="h-1.5 bg-[#222] rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${percent}%`,
                      background: config.gradient,
                      boxShadow: unlocked > 0 ? `0 0 8px ${config.color}` : 'none'
                    }}
          />
        </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function BadgesPage() {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)
  const [selectedTier, setSelectedTier] = useState<BadgeTier | 'all'>('all')
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all')
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false)
  
  // Filter badges
  const filteredBadges = BADGES.filter(badge => {
    if (selectedTier !== 'all' && badge.tier !== selectedTier) return false
    if (selectedCategory !== 'all' && badge.category !== selectedCategory) return false
    if (showUnlockedOnly && !badge.unlocked) return false
    return true
  })
  
  // Sort badges: unlocked first, then by tier level
  const sortedBadges = [...filteredBadges].sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
    return TIER_CONFIG[a.tier].level - TIER_CONFIG[b.tier].level
  })
  
  // Calculate total XP from unlocked badges
  const totalXP = BADGES.filter(b => b.unlocked).reduce((sum, b) => sum + b.xpReward, 0)
  const unlockedCount = BADGES.filter(b => b.unlocked).length
  
  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Custom Styles */}
      <style jsx global>{`
        @keyframes shine {
          0% { transform: translateX(-100%) rotate(25deg); }
          100% { transform: translateX(200%) rotate(25deg); }
        }
        .animate-shine {
          animation: shine 3s ease-in-out infinite;
        }
      `}</style>
      
      {/* ===== HEADER - Sticky ===== */}
      <div className="sticky top-0 z-40 bg-[#1a1a1a]/95 backdrop-blur-lg border-b border-[#3a3a3a]">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">ACHIEVEMENTS</h1>
              <p className="text-[#888] text-xs">{unlockedCount}/{BADGES.length} Unlocked</p>
            </div>
            <div className="bg-[#2a2a2a] rounded-xl px-3 py-2 border border-[#3a3a3a]">
              <p className="text-[10px] text-[#888] uppercase">Total XP</p>
              <p className="text-[#FF6B35] font-black text-sm">{totalXP.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* ===== MAIN CONTENT ===== */}
      <div className="px-4 py-4 max-w-6xl mx-auto">
        
        {/* ===== SECTION 1: RECENT UNLOCKS (Top Highlight) ===== */}
        {BADGES.filter(b => b.unlocked).length > 0 && (
          <div className="mb-6">
            <h2 className="text-white font-bold text-sm mb-3 flex items-center gap-2 uppercase tracking-wide">
              <Sparkles className="w-4 h-4 text-[#FF6B35]" />
              Recent Unlocks
            </h2>
            {/* Mobile: 2x2 Grid, Desktop: 4 columns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {BADGES.filter(b => b.unlocked).slice(0, 4).map((badge) => {
                const tierConfig = TIER_CONFIG[badge.tier]
                return (
                  <button
                    key={badge.id}
                    onClick={() => setSelectedBadge(badge)}
                    className="bg-[#2a2a2a] rounded-xl p-3 border border-[#3a3a3a] hover:border-[#4a4a4a] transition-all text-center"
                  >
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"
                      style={{
                        background: tierConfig.gradient,
                        boxShadow: tierConfig.glow,
                      }}
                    >
                      <badge.icon className="w-6 h-6 text-[#1a1a1a]" />
                    </div>
                    <p className="text-white font-bold text-xs truncate uppercase">{badge.name}</p>
                    <p style={{ color: tierConfig.textColor }} className="text-[10px] font-bold mt-1">
                      +{badge.xpReward} XP
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )}
        
        {/* ===== SECTION 2: TIER PROGRESS ===== */}
        <div className="mb-6">
          <TierProgressSection />
        </div>
        
        {/* ===== SECTION 3: FILTERS - Mobile Optimized ===== */}
        <FilterSection 
          selectedTier={selectedTier}
          setSelectedTier={setSelectedTier}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          showUnlockedOnly={showUnlockedOnly}
          setShowUnlockedOnly={setShowUnlockedOnly}
          badgeCount={sortedBadges.length}
        />
        
        {/* ===== SECTION 4: BADGE GRID ===== */}
        <div className="mb-6">
          <h2 className="text-white font-bold text-sm mb-3 flex items-center gap-2 uppercase tracking-wide">
            <Award className="w-4 h-4 text-[#FF6B35]" />
            All Badges
          </h2>
          
          {sortedBadges.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {sortedBadges.map((badge) => (
                <BadgeCard 
                  key={badge.id} 
                  badge={badge} 
                  onClick={() => setSelectedBadge(badge)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-[#2a2a2a] rounded-2xl border border-[#3a3a3a]">
              <Lock className="w-12 h-12 text-[#333] mx-auto mb-4" />
              <p className="text-[#888] text-sm">No badges match your filters</p>
              <button
                onClick={() => {
                  setSelectedTier('all')
                  setSelectedCategory('all')
                  setShowUnlockedOnly(false)
                }}
                className="mt-4 px-4 py-2 bg-[#FF6B35] text-white rounded-lg text-sm font-bold"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
        
        {/* Bottom Padding for Safe Area */}
        <div className="h-24" />
      </div>
      
      {/* Badge Detail Modal */}
      <BadgeDetailModal 
        badge={selectedBadge} 
        onClose={() => setSelectedBadge(null)} 
      />
    </div>
  )
}
