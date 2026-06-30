"use client"

import React, { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { 
  Trophy, Star, Target, Flame, Zap, Medal, Crown, Lock, 
  Users, TrendingUp, Timer, Check, ChevronRight, ChevronDown,
  Sparkles, Award, Shield, Gem, Swords, Circle, X,
  Eye, Hand, Scale, Activity, Crosshair, Rocket, 
  Mountain, TreePine, Sun, Moon, Sunrise, CloudLightning,
  Dribbble, CircleDot, Focus, Gauge, Repeat, Calendar,
  Share2, Download, Volume2, VolumeX, ArrowLeft
} from "lucide-react"
import { usePoints } from "@/lib/points/pointsContext"
import { InlinePointsBurst } from "@/components/points/PointsBurst"
import {
  fetchGamificationState,
  syncGamificationState,
  type ServerBadgeState,
} from "@/services/gamificationService"

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
// LEVEL 9 SNEAKER BADGES - Air Jordan 1 Collection
// ============================================

// Word associations for each sneaker background
const SNEAKER_WORD_ASSOCIATIONS: Record<string, string[]> = {
  'Aqua Splash': ['AQUA', 'SPLASH', 'WATER', 'WAVE', 'OCEAN', 'DRIP', 'FLOW', 'SURF', 'TIDE', 'DEEP', 'WET', 'SEA', 'BLUE', 'COOL', 'FRESH', 'DIVE', 'POOL', 'RAIN', 'H2O', 'LIQUID'],
  'Black Panther': ['WAKANDA', 'PANTHER', 'FOREVER', 'KING', 'POWER', 'TCHALLA', 'BLACK', 'WARRIOR', 'VIBRANIUM', 'CLAWS', 'AFRICA', 'ROYAL', 'HERO', 'CROWN', 'FIERCE', 'LEGEND', 'JUNGLE', 'STRENGTH'],
  'Bluey': ['BLUEY', 'BINGO', 'PLAY', 'FUN', 'FAMILY', 'HEELER', 'GAMES', 'MAGIC', 'AUSSIE', 'PUPPY', 'DANCE', 'JOY', 'LOVE', 'HAPPY', 'DREAM', 'FRIENDS', 'ADVENTURE', 'BLUE'],
  'Cool-Aid Orange': ['COOL', 'AID', 'ORANGE', 'FRESH', 'JUICE', 'CITRUS', 'SWEET', 'SUMMER', 'THIRST', 'FLAVOR', 'BURST', 'TANGY', 'ZESTY', 'FRUITY', 'COLD', 'ICE', 'DRINK', 'REFRESHING'],
  'Crimson': ['CRIMSON', 'RED', 'FIRE', 'PASSION', 'BLOOD', 'FLAME', 'SCARLET', 'RUBY', 'BOLD', 'INTENSE', 'POWER', 'FIERCE', 'DARK', 'HOT', 'BURN', 'ELEGANT', 'ROSE', 'DEEP'],
  'Incredible Hulk': ['HULK', 'SMASH', 'INCREDIBLE', 'GREEN', 'GAMMA', 'BANNER', 'STRONG', 'ANGRY', 'POWER', 'RAGE', 'BEAST', 'MONSTER', 'STRENGTH', 'FURY', 'GIANT', 'CRUSH', 'ROAR', 'MUSCLE'],
  'Kryptonite': ['KRYPTONITE', 'SUPERMAN', 'SUPER', 'HERO', 'KRYPTON', 'POWER', 'CLARK', 'KENT', 'CRYSTAL', 'GREEN', 'WEAKNESS', 'ALIEN', 'FORTRESS', 'CAPE', 'FLY', 'STEEL', 'HOPE', 'JUSTICE'],
  'Loch Ness Monster': ['NESSIE', 'LOCH', 'NESS', 'MONSTER', 'SCOTLAND', 'LEGEND', 'MYSTERY', 'LAKE', 'DEEP', 'CREATURE', 'MYTH', 'WATER', 'ANCIENT', 'HIDDEN', 'BEAST', 'SECRET', 'DARK', 'SHADOW'],
  'Orange Crush': ['ORANGE', 'CRUSH', 'SODA', 'FIZZ', 'BUBBLES', 'SWEET', 'CITRUS', 'POP', 'REFRESHING', 'CARBONATED', 'BURST', 'FLAVOR', 'ZEST', 'SPARKLING', 'COLD', 'DRINK', 'JUICE', 'TANG'],
  'Pink Panther': ['PINK', 'PANTHER', 'COOL', 'SMOOTH', 'DETECTIVE', 'MYSTERY', 'SUAVE', 'SLEEK', 'CLASSIC', 'JAZZY', 'STYLE', 'DIAMOND', 'CLOUSEAU', 'SPY', 'SLICK', 'CAT', 'GROOVY', 'CHIC'],
  'Purple Rain': ['PURPLE', 'RAIN', 'PRINCE', 'MUSIC', 'LEGEND', 'GUITAR', 'FUNK', 'SOUL', 'ICON', 'MINNEAPOLIS', 'DOVE', 'SYMBOL', 'GENIUS', 'LOVE', 'SEXY', 'DREAM', 'NIGHT', 'STAR'],
  'Hulkmania': ['HULKMANIA', 'HOGAN', 'WRESTLING', 'BROTHER', 'CHAMPION', 'HULK', 'MANIA', 'RING', 'BELT', 'LEGEND', 'POWER', 'YELLOW', 'RED', 'SLAM', 'VICTORY', 'FLEX', 'STRONG', 'ICON'],
};

// Different font families for variety
const SNEAKER_FONTS = [
  'Permanent Marker',
  'Bangers',
  'Satisfy',
  'Pacifico',
  'Bebas Neue',
  'Oswald',
  'Anton',
  'Righteous',
  'Russo One',
  'Black Ops One',
];

// Generate interlocking typography background
function generateSneakerTypography(words: string[]): React.ReactNode {
  const elements: React.ReactNode[] = [];
  
  const placements = [
    { word: words[0], x: 5, y: 28, size: 24, rotate: 0 },
    { word: words[1], x: 85, y: 22, size: 18, rotate: -90 },
    { word: words[2], x: 110, y: 30, size: 20, rotate: 0 },
    { word: words[3], x: 200, y: 24, size: 16, rotate: -90 },
    { word: words[4], x: 230, y: 28, size: 22, rotate: 0 },
    { word: words[5], x: 340, y: 20, size: 14, rotate: -90 },
    { word: words[6], x: 365, y: 32, size: 18, rotate: 0 },
    { word: words[7], x: 5, y: 55, size: 20, rotate: 0 },
    { word: words[8], x: 100, y: 52, size: 16, rotate: 0 },
    { word: words[9], x: 175, y: 48, size: 22, rotate: -90 },
    { word: words[10], x: 200, y: 58, size: 18, rotate: 0 },
    { word: words[11], x: 295, y: 50, size: 14, rotate: -90 },
    { word: words[12], x: 320, y: 55, size: 20, rotate: 0 },
    { word: words[13], x: 5, y: 82, size: 28, rotate: 0 },
    { word: words[14], x: 120, y: 78, size: 16, rotate: -90 },
    { word: words[15], x: 145, y: 85, size: 22, rotate: 0 },
    { word: words[16], x: 260, y: 80, size: 18, rotate: 0 },
    { word: words[17], x: 355, y: 75, size: 20, rotate: -90 },
    { word: words[0], x: 5, y: 112, size: 18, rotate: 0 },
    { word: words[1], x: 80, y: 108, size: 24, rotate: 0 },
    { word: words[2], x: 185, y: 105, size: 16, rotate: -90 },
    { word: words[3], x: 210, y: 115, size: 20, rotate: 0 },
    { word: words[4], x: 310, y: 110, size: 22, rotate: 0 },
    { word: words[5], x: 5, y: 142, size: 22, rotate: 0 },
    { word: words[6], x: 95, y: 138, size: 18, rotate: -90 },
    { word: words[7], x: 120, y: 145, size: 26, rotate: 0 },
    { word: words[8], x: 240, y: 140, size: 16, rotate: 0 },
    { word: words[9], x: 320, y: 135, size: 20, rotate: -90 },
    { word: words[10], x: 345, y: 145, size: 18, rotate: 0 },
    { word: words[11], x: 5, y: 175, size: 30, rotate: 0 },
    { word: words[12], x: 130, y: 170, size: 18, rotate: 0 },
    { word: words[13], x: 215, y: 168, size: 22, rotate: -90 },
    { word: words[14], x: 245, y: 178, size: 24, rotate: 0 },
    { word: words[15], x: 370, y: 172, size: 16, rotate: -90 },
    { word: words[16], x: 5, y: 208, size: 20, rotate: 0 },
    { word: words[17], x: 90, y: 202, size: 16, rotate: -90 },
    { word: words[0], x: 115, y: 210, size: 24, rotate: 0 },
    { word: words[1], x: 225, y: 205, size: 20, rotate: 0 },
    { word: words[2], x: 320, y: 200, size: 18, rotate: -90 },
    { word: words[3], x: 345, y: 212, size: 22, rotate: 0 },
    { word: words[4], x: 5, y: 240, size: 26, rotate: 0 },
    { word: words[5], x: 110, y: 235, size: 18, rotate: 0 },
    { word: words[6], x: 190, y: 232, size: 22, rotate: -90 },
    { word: words[7], x: 220, y: 242, size: 20, rotate: 0 },
    { word: words[8], x: 315, y: 238, size: 24, rotate: 0 },
  ];

  placements.forEach((p, idx) => {
    const font = SNEAKER_FONTS[idx % SNEAKER_FONTS.length];
    const opacity = 0.15 + (idx % 3) * 0.05;
    
    elements.push(
      <text
        key={idx}
        x={p.x}
        y={p.y}
        transform={p.rotate !== 0 ? `rotate(${p.rotate}, ${p.x}, ${p.y})` : undefined}
        fill="white"
        fontSize={p.size}
        fontFamily={font}
        fontWeight="bold"
        opacity={opacity}
      >
        {p.word}
      </text>
    );
  });

  return (
    <svg 
      className="absolute inset-0 w-full h-full overflow-hidden" 
      viewBox="0 0 400 260" 
      preserveAspectRatio="xMidYMid slice"
      style={{ minHeight: '100%', minWidth: '100%' }}
    >
      <defs>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Bangers&family=Satisfy&family=Pacifico&family=Bebas+Neue&family=Oswald:wght@700&family=Anton&family=Righteous&family=Russo+One&family=Black+Ops+One&display=swap');
          `}
        </style>
      </defs>
      {elements}
    </svg>
  );
}

// Theme configuration for sneaker cards
const SNEAKER_THEMES: Record<string, {
  primaryColor: string;
  buttonGradient: string;
  borderColor: string;
  glowColor: string;
  titleGradient: string;
}> = {
  'Aqua Splash': {
    primaryColor: '#22d3ee',
    buttonGradient: 'from-cyan-500 via-cyan-400 to-teal-400',
    borderColor: 'border-cyan-500/60',
    glowColor: 'shadow-cyan-500/40',
    titleGradient: 'from-cyan-400 via-cyan-300 to-teal-400',
  },
  'Black Panther': {
    primaryColor: '#9333ea',
    buttonGradient: 'from-slate-100 via-gray-800 to-purple-900',
    borderColor: 'border-purple-600/80',
    glowColor: 'shadow-purple-600/50',
    titleGradient: 'from-gray-200 via-purple-300 to-gray-100',
  },
  'Bluey': {
    primaryColor: '#38bdf8',
    buttonGradient: 'from-sky-500 via-sky-400 to-blue-400',
    borderColor: 'border-sky-500/60',
    glowColor: 'shadow-sky-500/40',
    titleGradient: 'from-sky-400 via-sky-300 to-blue-400',
  },
  'Cool-Aid Orange': {
    primaryColor: '#fb923c',
    buttonGradient: 'from-orange-500 via-orange-400 to-amber-400',
    borderColor: 'border-orange-500/60',
    glowColor: 'shadow-orange-500/40',
    titleGradient: 'from-orange-400 via-orange-300 to-amber-400',
  },
  'Crimson': {
    primaryColor: '#ef4444',
    buttonGradient: 'from-red-600 via-red-500 to-rose-500',
    borderColor: 'border-red-500/60',
    glowColor: 'shadow-red-500/40',
    titleGradient: 'from-red-400 via-red-300 to-rose-400',
  },
  'Incredible Hulk': {
    primaryColor: '#22c55e',
    buttonGradient: 'from-green-600 via-green-500 to-emerald-500',
    borderColor: 'border-green-500/60',
    glowColor: 'shadow-green-500/40',
    titleGradient: 'from-green-400 via-emerald-400 to-green-300',
  },
  'Kryptonite': {
    primaryColor: '#a3e635',
    buttonGradient: 'from-lime-500 via-lime-400 to-green-400',
    borderColor: 'border-lime-500/60',
    glowColor: 'shadow-lime-500/40',
    titleGradient: 'from-lime-400 via-lime-300 to-green-400',
  },
  'Loch Ness Monster': {
    primaryColor: '#14b8a6',
    buttonGradient: 'from-teal-600 via-teal-500 to-cyan-500',
    borderColor: 'border-teal-500/60',
    glowColor: 'shadow-teal-500/40',
    titleGradient: 'from-teal-400 via-teal-300 to-cyan-400',
  },
  'Orange Crush': {
    primaryColor: '#f97316',
    buttonGradient: 'from-orange-600 via-orange-500 to-red-500',
    borderColor: 'border-orange-500/60',
    glowColor: 'shadow-orange-500/40',
    titleGradient: 'from-orange-400 via-orange-300 to-red-400',
  },
  'Pink Panther': {
    primaryColor: '#ec4899',
    buttonGradient: 'from-pink-600 via-pink-500 to-rose-500',
    borderColor: 'border-pink-500/60',
    glowColor: 'shadow-pink-500/40',
    titleGradient: 'from-pink-400 via-pink-300 to-rose-400',
  },
  'Purple Rain': {
    primaryColor: '#a855f7',
    buttonGradient: 'from-purple-600 via-purple-500 to-violet-500',
    borderColor: 'border-purple-500/60',
    glowColor: 'shadow-purple-500/40',
    titleGradient: 'from-purple-400 via-violet-400 to-purple-300',
  },
  'Hulkmania': {
    primaryColor: '#facc15',
    buttonGradient: 'from-yellow-500 via-yellow-400 to-lime-400',
    borderColor: 'border-yellow-500/60',
    glowColor: 'shadow-yellow-500/40',
    titleGradient: 'from-yellow-400 via-yellow-300 to-lime-400',
  },
};

// Level 9 sneaker data
const LEVEL_9_SNEAKERS = [
  { id: 1, name: 'Aqua Splash', fileName: 'Air Jordan 1 Aqua Splash.png', colorway: 'Aqua / White / Black', rarity: 'Legendary', xp: 5000 },
  { id: 2, name: 'Black Panther', fileName: 'Air Jordan 1 Black Panther.png', colorway: 'Black / Purple / Silver', rarity: 'Mythic', xp: 7500 },
  { id: 3, name: 'Bluey', fileName: 'Air Jordan 1 Bluey .png', colorway: 'Sky Blue / White', rarity: 'Legendary', xp: 5000 },
  { id: 4, name: 'Cool-Aid Orange', fileName: 'Air Jordan 1 Cool-Aid Orange.png', colorway: 'Orange / White', rarity: 'Epic', xp: 3500 },
  { id: 5, name: 'Crimson', fileName: 'Air Jordan 1 Crimson.png', colorway: 'Crimson Red / Black', rarity: 'Legendary', xp: 5000 },
  { id: 6, name: 'Incredible Hulk', fileName: 'Air Jordan 1 Incredible Hulk .png', colorway: 'Green / Purple', rarity: 'Mythic', xp: 7500 },
  { id: 7, name: 'Kryptonite', fileName: 'Air Jordan 1 Kyptionitepng.png', colorway: 'Neon Green / Black', rarity: 'Legendary', xp: 5000 },
  { id: 8, name: 'Loch Ness Monster', fileName: 'Air Jordan 1 Loch Ness Monster.png', colorway: 'Deep Sea Blue / Green', rarity: 'Mythic', xp: 7500 },
  { id: 9, name: 'Orange Crush', fileName: 'Air Jordan 1 Orange Crush.png', colorway: 'Orange / Black', rarity: 'Epic', xp: 3500 },
  { id: 10, name: 'Pink Panther', fileName: 'Air Jordan 1 Pink Pather.png', colorway: 'Hot Pink / White', rarity: 'Legendary', xp: 5000 },
  { id: 11, name: 'Purple Rain', fileName: 'air Jordan 1 purple rain v1.png', colorway: 'Purple / Gold', rarity: 'Mythic', xp: 7500 },
  { id: 12, name: 'Hulkmania', fileName: 'Air Jordan 1 rHulkmania.png', colorway: 'Yellow / Green', rarity: 'Legendary', xp: 5000 },
];

// Level 9 Sneaker Badge Card Component
function Level9SneakerCard({ sneaker, index, isUnlocked = false }: { sneaker: typeof LEVEL_9_SNEAKERS[0]; index: number; isUnlocked?: boolean }) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const theme = SNEAKER_THEMES[sneaker.name];
  const words = SNEAKER_WORD_ASSOCIATIONS[sneaker.name] || [];

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Bangers&family=Satisfy&family=Pacifico&family=Bebas+Neue&family=Oswald:wght@700&family=Anton&family=Righteous&family=Russo+One&family=Black+Ops+One&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    link.onload = () => setFontsLoaded(true);
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  if (!theme) return null;

  // Show full color when unlocked OR when hovered
  const showFullColor = isUnlocked || isHovered;

  return (
    <div
      className={`
        relative group cursor-pointer
        transform transition-all duration-500 ease-out
        ${isHovered ? 'scale-105 -translate-y-2' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Glow Effect on Hover */}
      <div 
        className={`
          absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-100
          blur-xl transition-opacity duration-500
        `}
        style={{ background: theme.primaryColor }}
      />

      {/* Main Card */}
      <div 
        className={`
          relative overflow-hidden rounded-2xl
          border-2 ${showFullColor ? theme.borderColor : 'border-slate-200'}
          bg-white
          shadow-2xl ${isHovered ? `shadow-xl ${theme.glowColor}` : ''}
          transition-all duration-500
        `}
        style={{
          filter: showFullColor ? 'none' : 'grayscale(100%)',
        }}
      >
        {/* Typography Background */}
        <div className="absolute inset-0">
          {fontsLoaded && generateSneakerTypography(words)}
        </div>

        {/* Top Color Bar */}
        <div 
          className="absolute top-0 left-0 right-0 h-1 z-10 transition-all duration-500"
          style={{ 
            background: showFullColor 
              ? `linear-gradient(90deg, ${theme.primaryColor}, ${theme.primaryColor}88)` 
              : 'linear-gradient(90deg, #555, #333)'
          }}
        />

        {/* Lock Overlay - shows when locked and not hovered */}
        {!isUnlocked && !isHovered && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 transition-opacity duration-500">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-gray-800/90 border-2 border-gray-600 flex items-center justify-center">
                <Lock className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Locked</p>
            </div>
          </div>
        )}

        {/* Level Badge */}
        <div className="absolute top-3 left-3 z-20">
          <div 
            className="flex items-center gap-2 px-3 py-2 rounded-full text-slate-900 text-xs font-bold shadow-lg transition-all duration-500"
            style={{ background: showFullColor ? theme.primaryColor : '#555' }}
          >
            <Crown className="w-4 h-4" />
            <span>HALL OF FAME</span>
          </div>
        </div>

        {/* Rarity Badge */}
        <div className="absolute top-14 left-3 z-20">
          <div 
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/60 backdrop-blur-sm border text-sm font-semibold transition-all duration-500"
            style={{ 
              borderColor: showFullColor ? `${theme.primaryColor}60` : '#55555560', 
              color: showFullColor ? theme.primaryColor : '#64748b' 
            }}
          >
            <Sparkles className="w-4 h-4" />
            {sneaker.rarity.toUpperCase()}
          </div>
        </div>

        {/* Badge Number */}
        <div className="absolute top-3 right-3 z-20">
          <div 
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/60 backdrop-blur-sm border text-sm font-bold transition-all duration-500"
            style={{ 
              borderColor: showFullColor ? `${theme.primaryColor}60` : '#55555560', 
              color: 'white' 
            }}
          >
            <span style={{ color: showFullColor ? theme.primaryColor : '#64748b' }}>#</span>{sneaker.id}
          </div>
        </div>

        {/* Sneaker Image Container */}
        <div className="relative pt-14 pb-4 px-4 z-10">
          <div className={`
            relative w-full aspect-square flex items-center justify-center
            transition-transform duration-500
            ${isHovered ? 'scale-110 rotate-3' : ''}
          `}>
            {!imageError ? (
              <Image
                src={`/sneakers/Level 9/${encodeURIComponent(sneaker.fileName)}`}
                alt={`Air Jordan 1 ${sneaker.name}`}
                width={180}
                height={180}
                className="relative z-10 object-contain drop-shadow-2xl transition-all duration-500"
                style={{
                  filter: showFullColor ? 'none' : 'grayscale(100%) brightness(0.7)',
                }}
                onError={() => setImageError(true)}
                priority={index < 4}
              />
            ) : (
              <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                <span className="text-4xl">👟</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="relative px-4 pb-4 space-y-2 z-10">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm -mx-4" />
          
          <div className="relative z-10 space-y-2 pt-2">
            {/* Sneaker Name */}
            <div className="text-center">
              <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">
                Air Jordan 1
              </p>
              <h3 className={`
                text-lg font-black uppercase tracking-wide transition-all duration-500
                ${showFullColor 
                  ? `bg-gradient-to-r ${theme.titleGradient} bg-clip-text text-transparent`
                  : 'text-gray-500'
                }
              `}>
                {sneaker.name}
              </h3>
            </div>

            {/* Colorway */}
            <p className="text-center text-gray-400 text-xs">
              {sneaker.colorway}
            </p>

            {/* XP Reward */}
            <div 
              className="text-center py-3 rounded-xl relative overflow-hidden transition-all duration-500"
              style={{ 
                background: showFullColor 
                  ? `linear-gradient(135deg, ${theme.primaryColor}20, ${theme.primaryColor}40)` 
                  : 'linear-gradient(135deg, #33333320, #33333340)'
              }}
            >
              <div 
                className="absolute inset-0 opacity-20 transition-all duration-500"
                style={{ 
                  background: showFullColor 
                    ? `radial-gradient(circle at 50% 50%, ${theme.primaryColor}, transparent 70%)`
                    : 'radial-gradient(circle at 50% 50%, #555, transparent 70%)'
                }}
              />
              <p className="text-gray-400 text-[10px] uppercase tracking-widest mb-1 relative z-10">XP REWARD</p>
              <p 
                className={`text-3xl font-black relative z-10 transition-all duration-500 ${showFullColor ? 'animate-pulse' : ''}`}
                style={{ 
                  color: showFullColor ? theme.primaryColor : '#94a3b8',
                  textShadow: showFullColor 
                    ? `0 0 20px ${theme.primaryColor}80, 0 0 40px ${theme.primaryColor}40`
                    : 'none'
                }}
              >
                +{sneaker.xp.toLocaleString()}
              </p>
              <p className="text-gray-500 text-[10px] uppercase mt-1 relative z-10">Points</p>
            </div>

            {/* Unlock Button */}
            <button 
              className={`
                w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider
                text-slate-900 shadow-lg whitespace-nowrap
                transform transition-all duration-500
                ${showFullColor 
                  ? `bg-gradient-to-r ${theme.buttonGradient} hover:shadow-xl hover:scale-[1.02]`
                  : 'bg-gray-700 cursor-not-allowed'
                }
                active:scale-[0.98]
              `}
              disabled={!isUnlocked}
            >
              <span className="flex items-center justify-center gap-2">
                {isUnlocked ? (
                  <>
                    <Star className="w-4 h-4" />
                    Claim
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Locked
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
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
        background: isLocked ? '#f8fafc' : '#ffffff',
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
            isLocked ? 'bg-slate-50' : ''
          }`}
          style={!isLocked ? {
            background: tierConfig.gradient,
            boxShadow: `inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.3), ${tierConfig.glow}`,
          } : undefined}
        >
          {isLocked ? (
            <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400" />
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
            isLocked ? 'text-slate-400' : ''
          }`}
          style={!isLocked ? { color: tierConfig.textColor } : undefined}
        >
        {badge.name}
        </p>
        
        {/* Tier Label */}
        <p className={`text-[7px] sm:text-[8px] font-medium mt-0.5 uppercase tracking-wider ${
          isLocked ? 'text-slate-400' : 'text-slate-500'
        }`}>
          {tierConfig.name}
        </p>
        
        {/* Progress Bar */}
        {hasProgress && (
          <div className="absolute bottom-2 left-2 right-2">
            <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${progressPercent}%`,
                  background: tierConfig.gradient 
                }}
            />
          </div>
            <p className="text-[8px] text-slate-400 text-center mt-0.5">
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
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full sm:max-w-sm bg-slate-50 rounded-t-3xl sm:rounded-2xl overflow-hidden"
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
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-900 z-10"
        >
          <X className="w-4 h-4" />
        </button>
        
        {/* Content */}
        <div className="relative p-6 pt-8">
          {/* Badge Icon - Large */}
          <div className="flex justify-center mb-4">
            <div 
              className={`relative w-24 h-24 rounded-full flex items-center justify-center ${
                isLocked ? 'bg-slate-50' : ''
              }`}
              style={!isLocked ? {
                background: tierConfig.gradient,
                boxShadow: `inset 0 4px 8px rgba(255,255,255,0.3), inset 0 -4px 8px rgba(0,0,0,0.3), ${tierConfig.glow}`,
              } : undefined}
            >
              {isLocked ? (
                <Lock className="w-10 h-10 text-slate-400" />
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
              className={`text-xl font-black mb-1 uppercase tracking-wide ${isLocked ? 'text-slate-400' : ''}`}
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
          <div className="bg-slate-50 rounded-xl p-4 mb-3">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium mb-1">Description</p>
            <p className="text-slate-700 text-sm leading-relaxed">{badge.longDescription}</p>
        </div>
          
          {/* How to Earn Section */}
          <div className="bg-slate-50 rounded-xl p-4 mb-3">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium mb-1">How to Earn</p>
            <p className="text-slate-900 text-sm leading-relaxed">{badge.howToEarn}</p>
        </div>
          
          {/* Progress or Unlock Status */}
          {hasProgress ? (
            <div className="bg-slate-50 rounded-xl p-4 mb-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium mb-2">Your Progress</p>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">
                  {Math.round(progressPercent)}% Complete
                </span>
                <span style={{ color: tierConfig.textColor }} className="font-bold">
                  {badge.progress!.current}/{badge.progress!.total}
                </span>
      </div>
              <div className="h-3 bg-slate-50 rounded-full overflow-hidden">
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
                    <Check className="w-4 h-4 text-slate-900" />
                  </div>
                  <span className="text-[#22C55E] font-bold uppercase text-sm">Unlocked</span>
                </div>
                <span className="text-[#22C55E]/80 text-sm">{badge.unlockedDate}</span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl p-4 mb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-400" />
                <span className="text-slate-400 text-sm">Not yet unlocked</span>
              </div>
            </div>
          )}
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium mb-1">Rarity</p>
              <p 
                className="text-lg font-bold"
                style={{ color: tierConfig.textColor }}
              >
                {badge.rarity < 1 ? `<1%` : `${badge.rarity}%`}
              </p>
              <p className="text-slate-400 text-[10px]">of players have this</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium mb-1">XP Reward</p>
              <p 
                className="text-lg font-bold"
                style={{ color: tierConfig.textColor }}
              >
                +{badge.xpReward.toLocaleString()}
              </p>
              <p className="text-slate-400 text-[10px]">experience points</p>
            </div>
        </div>
      </div>

        {/* Drag Handle (Mobile) */}
        <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-slate-200 rounded-full" />
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
      <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
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
                <span className="text-slate-900 font-bold text-sm">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="bg-[#FF6B35] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
                    </div>
              <span className="text-slate-500 text-xs">
                {badgeCount} badges
                {activeFilterCount > 0 && ` • ${getActiveFilterLabels().join(', ')}`}
                    </span>
                  </div>
              </div>
          <ChevronDown 
            className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
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
              className="text-slate-500 text-xs underline hover:text-slate-900"
            >
              Clear all
            </button>
            </div>
        )}
        
        {/* Expanded Filter Options */}
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-slate-200">
            {/* Tier Filter */}
            <div className="pt-4 pb-3">
              <p className="text-slate-500 text-xs font-medium mb-3 uppercase tracking-wider">Tier</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectedTier('all')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    selectedTier === 'all'
                      ? 'bg-[#FF6B35] text-white shadow-md shadow-[#FF6B35]/20'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
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
                          ? 'bg-[#FF6B35] text-white shadow-md shadow-[#FF6B35]/20'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
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
                          ? 'bg-[#FF6B35] text-white shadow-md shadow-[#FF6B35]/20'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
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
            <div className="pt-3 pb-3 border-t border-slate-200">
              <p className="text-slate-500 text-xs font-medium mb-3 uppercase tracking-wider">Category</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-[#FF6B35] text-white shadow-md shadow-[#FF6B35]/20'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
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
                          ? 'bg-[#FF6B35] text-white shadow-md shadow-[#FF6B35]/20'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
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
            <div className="pt-3 border-t border-slate-200">
              <button
                onClick={() => setShowUnlockedOnly(!showUnlockedOnly)}
                className={`w-full px-4 py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-between ${
                  showUnlockedOnly
                    ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30'
                    : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
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

// Tier Preview Modal - Shows what badges are available at each tier
function TierPreviewModal({
  tier,
  badges,
  onClose,
  onSelectBadge
}: {
  tier: BadgeTier | null;
  badges: Badge[];
  onClose: () => void;
  onSelectBadge: (badge: Badge) => void;
}) {
  if (!tier) return null;

  const config = TIER_CONFIG[tier];
  const tierBadges = badges.filter(b => b.tier === tier);
  const unlockedCount = tierBadges.filter(b => b.unlocked).length;
  
  // Check if this is Hall of Fame (Level 9) to show sneaker badges
  const isHallOfFame = tier === 'hall_of_fame';
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-3xl bg-slate-50 border-2"
        style={{ borderColor: config.borderColor }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="relative p-6 border-b border-slate-200"
          style={{ background: config.bgPattern }}
        >
          <div 
            className="absolute inset-0 opacity-30"
            style={{ background: config.gradient }}
          />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-slate-900 hover:bg-black/40 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="relative z-10 flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ 
                background: config.gradient,
                boxShadow: config.glow
              }}
            >
              <config.icon className="w-8 h-8 text-[#1a1a1a]" />
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span 
                  className="text-2xl font-black uppercase"
                  style={{ color: config.textColor }}
                >
                  {config.name}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-black/30 text-xs font-bold text-slate-900">
                  Level {config.level}
                </span>
              </div>
              <p className="text-gray-400 text-sm">{config.subtitle}</p>
              <p className="text-gray-500 text-xs mt-1">
                {unlockedCount}/{tierBadges.length} badges unlocked • {config.xpMultiplier}x XP multiplier
              </p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Sneaker Name */}
          <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Signature Sneaker</p>
            <p className="text-slate-900 font-bold">{config.sneakerName}</p>
          </div>
          
          {/* Hall of Fame - Show Full Sneaker Badge Cards */}
          {isHallOfFame && (
            <div className="mb-6">
              <h4 className="text-slate-900 font-bold text-sm mb-4 flex items-center gap-2 uppercase tracking-wide">
                <Crown className="w-4 h-4" style={{ color: config.textColor }} />
                Air Jordan 1 Collection
                <span className="ml-auto text-[10px] text-gray-500 font-normal normal-case">{LEVEL_9_SNEAKERS.length} exclusive</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {LEVEL_9_SNEAKERS.map((sneaker, index) => (
                  <Level9SneakerCard key={sneaker.id} sneaker={sneaker} index={index} isUnlocked={false} />
                ))}
              </div>
            </div>
          )}
          
          {/* Regular Badges - Full Size Cards */}
          <h4 className="text-slate-900 font-bold text-sm mb-4 flex items-center gap-2 uppercase tracking-wide">
            <Award className="w-4 h-4" style={{ color: config.textColor }} />
            {isHallOfFame ? 'Achievement Badges' : 'Available Badges'}
            <span className="ml-auto text-[10px] text-gray-500 font-normal normal-case">{tierBadges.length} badges</span>
          </h4>
          
          {tierBadges.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {tierBadges.map((badge) => (
                <BadgeCard 
                  key={badge.id} 
                  badge={badge} 
                  onClick={() => {
                    onSelectBadge(badge);
                    onClose();
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 text-sm">No badges at this tier yet</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <p className="text-center text-gray-500 text-xs">
            Tap any badge to see details • Keep grinding to unlock more!
          </p>
        </div>
      </div>
    </div>
  );
}

function TierProgressSection({ badges, onTierClick }: { badges: Badge[]; onTierClick: (tier: BadgeTier) => void }) {
  const tierCounts = Object.keys(TIER_CONFIG).reduce((acc, tier) => {
    const tierBadges = badges.filter(b => b.tier === tier as BadgeTier)
    const unlocked = tierBadges.filter(b => b.unlocked).length
    acc[tier as BadgeTier] = { unlocked, total: tierBadges.length }
    return acc
  }, {} as Record<BadgeTier, { unlocked: number; total: number }>)
  
  return (
    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
      <h3 className="text-slate-900 font-bold text-sm mb-4 flex items-center gap-2 uppercase tracking-wide">
        <Award className="w-4 h-4 text-[#FF6B35]" />
        Tier Progress
        <span className="ml-auto text-[10px] text-gray-500 font-normal normal-case">Tap to preview</span>
      </h3>
      <div className="space-y-3">
        {(Object.keys(TIER_CONFIG) as BadgeTier[]).map((tier) => {
          const config = TIER_CONFIG[tier]
          const { unlocked, total } = tierCounts[tier]
          const percent = total > 0 ? (unlocked / total) * 100 : 0
          
          // Add sneaker count for Hall of Fame
          const isHallOfFame = tier === 'hall_of_fame';
          const sneakerCount = isHallOfFame ? LEVEL_9_SNEAKERS.length : 0;
          
          return (
            <button 
              key={tier} 
              onClick={() => onTierClick(tier)}
              className="w-full flex items-center gap-3 p-2 -m-2 rounded-xl hover:bg-slate-200 transition-colors group"
            >
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
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
                    className="text-xs font-bold uppercase group-hover:underline"
                    style={{ color: unlocked > 0 ? config.textColor : '#555' }}
                  >
                    {config.name}
                    {isHallOfFame && (
                      <span className="ml-1 text-[10px] text-pink-400 font-normal">+{sneakerCount} sneakers</span>
                    )}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    {unlocked}/{total}
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </div>
                <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
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
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

// Catalog with every badge reset to a locked/empty state — used as the initial
// render so NOTHING shows as unlocked (or with fake progress/dates) until the
// user's real activity loads from /api/badges.
const INITIAL_BADGES: Badge[] = BADGES.map(b => ({
  ...b,
  unlocked: false,
  unlockedDate: undefined,
  progress: undefined,
}))

// Overlay the catalog with real per-badge state from the server.
function applyLiveBadgeState(
  catalog: Badge[],
  liveMap: Record<string, ServerBadgeState>
): Badge[] {
  return catalog.map(b => {
    const live = liveMap[b.id]
    if (!live) {
      return { ...b, unlocked: false, unlockedDate: undefined, progress: undefined }
    }
    return {
      ...b,
      unlocked: live.unlocked,
      unlockedDate:
        live.unlocked && live.earnedDate
          ? new Date(live.earnedDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : undefined,
      // Only show a progress bar for still-locked badges that have real progress.
      progress: !live.unlocked && live.progress ? live.progress : undefined,
    }
  })
}

export default function BadgesPage() {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)
  const [selectedTier, setSelectedTier] = useState<BadgeTier | 'all'>('all')
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all')
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false)
  const [previewTier, setPreviewTier] = useState<BadgeTier | null>(null)
  const [showPointsBurst, setShowPointsBurst] = useState(false)
  const viewedBadges = useRef<Set<string>>(new Set())
  
  const { earnPoints } = usePoints()

  // Live badge state driven by REAL activity (analysis history + points +
  // streaks), fetched from /api/badges. Starts fully locked (no fake data).
  const [liveBadges, setLiveBadges] = useState<Badge[]>(INITIAL_BADGES)

  useEffect(() => {
    let active = true
    ;(async () => {
      // 1) Read current computed state (read-only).
      const state = await fetchGamificationState()
      if (active && state.badges) {
        setLiveBadges(applyLiveBadgeState(BADGES, state.badges))
      }
      // 2) Persist any newly-earned badges to the EarnedBadge model (auth+CSRF)
      //    and reflect the authoritative result (earnedAt dates, etc.).
      const synced = await syncGamificationState()
      if (active && synced.badges) {
        setLiveBadges(applyLiveBadgeState(BADGES, synced.badges))
      }
    })()
    return () => { active = false }
  }, [])

  const handleSelectBadge = (badge: Badge) => {
    setSelectedBadge(badge)
    
    // Award points for viewing a badge for the first time
    if (!viewedBadges.current.has(badge.id)) {
      viewedBadges.current.add(badge.id)
      const result = earnPoints('badge_view')
      if (result.earned) {
        setShowPointsBurst(true)
        setTimeout(() => setShowPointsBurst(false), 1500)
      }
    }
  }
  
  // Filter badges (from live, real-activity-driven state)
  const filteredBadges = liveBadges.filter(badge => {
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

  // Calculate total XP from REAL unlocked badges
  const unlockedBadges = liveBadges.filter(b => b.unlocked)
  const totalXP = unlockedBadges.reduce((sum, b) => sum + b.xpReward, 0)
  const unlockedCount = unlockedBadges.length
  
  return (
    <div className="min-h-screen bg-white relative">
      {/* GOLD Video Game Style Points Animation */}
      <InlinePointsBurst points={1} show={showPointsBurst} label="IQ" />
      
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
      
      {/* ===== MAIN CONTENT ===== */}
      <div className="px-4 py-4 max-w-6xl mx-auto">
        {/* ===== PAGE HEADER - Part of content, not sticky ===== */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link 
                href="/results/demo"
                className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-900 hover:bg-slate-200 hover:border-[#FF6B35]/50 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF6B35]/10 border border-[#FF6B35]/30 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-[#FF6B35]" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Achievements</h1>
                  <p className="text-slate-500 text-xs">{unlockedCount}/{BADGES.length} Unlocked</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-200">
              <p className="text-[10px] text-slate-500 uppercase">Total XP</p>
              <p className="text-[#FF6B35] font-black text-sm">{totalXP.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        {/* ===== SECTION 1: RECENT UNLOCKS (Top Highlight) ===== */}
        {unlockedBadges.length > 0 && (
          <div className="mb-6">
            <h2 className="text-slate-900 font-bold text-sm mb-3 flex items-center gap-2 uppercase tracking-wide">
              <Sparkles className="w-4 h-4 text-[#FF6B35]" />
              Recent Unlocks
            </h2>
            {/* Mobile: 2x2 Grid, Desktop: 4 columns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {unlockedBadges.slice(0, 4).map((badge) => {
                const tierConfig = TIER_CONFIG[badge.tier]
                return (
                  <button
                    key={badge.id}
                    onClick={() => handleSelectBadge(badge)}
                    className="bg-slate-50 rounded-xl p-3 border border-slate-200 hover:border-[#4a4a4a] transition-all text-center"
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
                    <p className="text-slate-900 font-bold text-xs truncate uppercase">{badge.name}</p>
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
          <TierProgressSection badges={liveBadges} onTierClick={(tier) => {
            setPreviewTier(tier);
            setSelectedTier(tier); // Also filter the badges below to this tier
          }} />
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
        
        {/* ===== SECTION 4: HALL OF FAME (LEVEL 9) SNEAKER BADGES ===== */}
        {/* Only show when 'all' or 'hall_of_fame' is selected */}
        {(selectedTier === 'all' || selectedTier === 'hall_of_fame') && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-slate-900 font-bold text-sm flex items-center gap-2 uppercase tracking-wide">
                <Crown className="w-5 h-5 text-[#FF1493]" />
                Hall of Fame - Air Jordan 1 Collection
              </h2>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#FF1493]/20 to-[#FF6B35]/20 border border-[#FF1493]/30">
                <span className="text-[#FF1493] text-xs font-bold">Level 9 • {LEVEL_9_SNEAKERS.length} Exclusive</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {LEVEL_9_SNEAKERS.map((sneaker, index) => (
                <Level9SneakerCard key={sneaker.id} sneaker={sneaker} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* ===== SECTION 5: BADGE GRID ===== */}
        <div className="mb-6">
          <h2 className="text-slate-900 font-bold text-sm mb-3 flex items-center gap-2 uppercase tracking-wide">
            <Award className="w-4 h-4 text-[#FF6B35]" />
            All Badges
          </h2>
          
          {sortedBadges.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {sortedBadges.map((badge) => (
                <BadgeCard 
                  key={badge.id} 
                  badge={badge} 
                  onClick={() => handleSelectBadge(badge)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200">
              <Lock className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-500 text-sm">No badges match your filters</p>
              <button
                onClick={() => {
                  setSelectedTier('all')
                  setSelectedCategory('all')
                  setShowUnlockedOnly(false)
                }}
                className="mt-4 px-4 py-2 bg-[#FF6B35] text-slate-900 rounded-lg text-sm font-bold"
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
      
      {/* Tier Preview Modal */}
      <TierPreviewModal
        tier={previewTier}
        badges={liveBadges}
        onClose={() => setPreviewTier(null)}
        onSelectBadge={(badge) => setSelectedBadge(badge)}
      />
    </div>
  )
}
