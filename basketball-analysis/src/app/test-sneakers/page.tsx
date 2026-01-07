"use client"

import React, { useState } from "react"
import { Lock, Trophy, Star, Sparkles, Crown, ChevronRight, X } from "lucide-react"

// ============================================
// SNEAKER BADGE SYSTEM - TEST PAGE
// 25 Iconic Basketball Sneakers
// ============================================

// Tier Types
type SneakerTier = 'rookie' | 'starter' | 'sixth_player' | 'starting_five' | 'all_star' | 'elite' | 'mvp' | 'champion' | 'hall_of_fame' | 'goat'

// Tier Configuration with unique colors
const TIER_CONFIG: Record<SneakerTier, {
  name: string
  color: string
  gradient: string
  glow: string
  borderColor: string
  textColor: string
  bgPattern: string
}> = {
  rookie: {
    name: 'ROOKIE',
    color: '#CD7F32',
    gradient: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 50%, #CD7F32 100%)',
    glow: '0 0 30px rgba(205, 127, 50, 0.6)',
    borderColor: '#CD7F32',
    textColor: '#CD7F32',
    bgPattern: 'radial-gradient(circle at 50% 0%, rgba(205, 127, 50, 0.3) 0%, transparent 60%)',
  },
  starter: {
    name: 'STARTER',
    color: '#C0C0C0',
    gradient: 'linear-gradient(135deg, #E8E8E8 0%, #A8A8A8 50%, #C0C0C0 100%)',
    glow: '0 0 30px rgba(192, 192, 192, 0.6)',
    borderColor: '#C0C0C0',
    textColor: '#C0C0C0',
    bgPattern: 'radial-gradient(circle at 50% 0%, rgba(192, 192, 192, 0.3) 0%, transparent 60%)',
  },
  sixth_player: {
    name: '6TH PLAYER',
    color: '#FFD700',
    gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
    glow: '0 0 35px rgba(255, 215, 0, 0.7)',
    borderColor: '#FFD700',
    textColor: '#FFD700',
    bgPattern: 'radial-gradient(circle at 50% 0%, rgba(255, 215, 0, 0.3) 0%, transparent 60%)',
  },
  starting_five: {
    name: 'STARTING 5',
    color: '#E5E4E2',
    gradient: 'linear-gradient(135deg, #E5E4E2 0%, #BCC6CC 50%, #E5E4E2 100%)',
    glow: '0 0 35px rgba(229, 228, 226, 0.7)',
    borderColor: '#E5E4E2',
    textColor: '#E5E4E2',
    bgPattern: 'radial-gradient(circle at 50% 0%, rgba(229, 228, 226, 0.4) 0%, transparent 60%)',
  },
  all_star: {
    name: 'ALL-STAR',
    color: '#00CED1',
    gradient: 'linear-gradient(135deg, #B9F2FF 0%, #00CED1 50%, #008B8B 100%)',
    glow: '0 0 40px rgba(0, 206, 209, 0.7)',
    borderColor: '#00CED1',
    textColor: '#00CED1',
    bgPattern: 'radial-gradient(circle at 50% 0%, rgba(0, 206, 209, 0.4) 0%, transparent 60%)',
  },
  elite: {
    name: 'ELITE',
    color: '#9B59B6',
    gradient: 'linear-gradient(135deg, #BB77D4 0%, #9B59B6 50%, #6C3483 100%)',
    glow: '0 0 40px rgba(155, 89, 182, 0.7)',
    borderColor: '#9B59B6',
    textColor: '#9B59B6',
    bgPattern: 'radial-gradient(circle at 50% 0%, rgba(155, 89, 182, 0.4) 0%, transparent 60%)',
  },
  mvp: {
    name: 'MVP',
    color: '#E74C3C',
    gradient: 'linear-gradient(135deg, #FF6B6B 0%, #E74C3C 50%, #C0392B 100%)',
    glow: '0 0 45px rgba(231, 76, 60, 0.8)',
    borderColor: '#E74C3C',
    textColor: '#E74C3C',
    bgPattern: 'radial-gradient(circle at 50% 0%, rgba(231, 76, 60, 0.4) 0%, transparent 60%)',
  },
  champion: {
    name: 'CHAMPION',
    color: '#FF6B35',
    gradient: 'linear-gradient(135deg, #FF8C5A 0%, #FF6B35 50%, #E55A2B 100%)',
    glow: '0 0 45px rgba(255, 107, 53, 0.8)',
    borderColor: '#FF6B35',
    textColor: '#FF6B35',
    bgPattern: 'radial-gradient(circle at 50% 0%, rgba(255, 107, 53, 0.5) 0%, transparent 60%)',
  },
  hall_of_fame: {
    name: 'HALL OF FAME',
    color: '#FF1493',
    gradient: 'linear-gradient(135deg, #FF69B4 0%, #FF1493 50%, #C71585 100%)',
    glow: '0 0 50px rgba(255, 20, 147, 0.8)',
    borderColor: '#FF1493',
    textColor: '#FF1493',
    bgPattern: 'radial-gradient(circle at 50% 0%, rgba(255, 20, 147, 0.5) 0%, transparent 60%)',
  },
  goat: {
    name: 'G.O.A.T.',
    color: '#00FFFF',
    gradient: 'linear-gradient(135deg, #00FFFF 0%, #FFD700 25%, #FF6B35 50%, #FF1493 75%, #00FFFF 100%)',
    glow: '0 0 60px rgba(0, 255, 255, 0.9), 0 0 100px rgba(255, 215, 0, 0.5)',
    borderColor: '#00FFFF',
    textColor: '#00FFFF',
    bgPattern: 'conic-gradient(from 0deg at 50% 0%, rgba(0, 255, 255, 0.4), rgba(255, 215, 0, 0.4), rgba(255, 107, 53, 0.4), rgba(255, 20, 147, 0.4), rgba(0, 255, 255, 0.4))',
  },
}

// Sneaker Data - 25 Iconic Basketball Sneakers
interface Sneaker {
  id: string
  name: string
  brand: string
  year: number
  player?: string
  tier: SneakerTier
  badgeName: string
  xpReward: number
  unlocked: boolean
  description: string
  colorway: string
}

const SNEAKERS: Sneaker[] = [
  // ROOKIE TIER (1-3)
  {
    id: 'converse-chuck-taylor',
    name: 'Chuck Taylor All-Star',
    brand: 'Converse',
    year: 1917,
    tier: 'rookie',
    badgeName: 'First Steps',
    xpReward: 50,
    unlocked: true,
    description: 'The original basketball shoe that started it all',
    colorway: 'Classic White',
  },
  {
    id: 'nike-af1-low-white',
    name: 'Air Force 1 Low',
    brand: 'Nike',
    year: 1982,
    tier: 'rookie',
    badgeName: 'Court Classic',
    xpReward: 75,
    unlocked: true,
    description: 'The shoe that changed basketball footwear forever',
    colorway: 'Triple White',
  },
  {
    id: 'adidas-superstar',
    name: 'Superstar',
    brand: 'Adidas',
    year: 1969,
    tier: 'rookie',
    badgeName: 'Shell Toe Legend',
    xpReward: 100,
    unlocked: true,
    description: 'The iconic shell-toe that defined an era',
    colorway: 'White/Black',
  },
  
  // STARTER TIER (4-6)
  {
    id: 'nike-af1-high',
    name: 'Air Force 1 High',
    brand: 'Nike',
    year: 1982,
    tier: 'starter',
    badgeName: 'Rising Up',
    xpReward: 125,
    unlocked: true,
    description: 'High-top version of the legendary AF1',
    colorway: 'White/White',
  },
  {
    id: 'reebok-question',
    name: 'Question Mid',
    brand: 'Reebok',
    year: 1996,
    player: 'Allen Iverson',
    tier: 'starter',
    badgeName: 'The Answer',
    xpReward: 150,
    unlocked: true,
    description: "AI's first signature shoe - Practice? We talkin' bout practice?",
    colorway: 'Red Toe',
  },
  {
    id: 'nike-zoom-freak-1',
    name: 'Zoom Freak 1',
    brand: 'Nike',
    year: 2019,
    player: 'Giannis Antetokounmpo',
    tier: 'starter',
    badgeName: 'Greek Freak',
    xpReward: 175,
    unlocked: false,
    description: 'Built for the most versatile player in the game',
    colorway: 'Coming to America',
  },
  
  // 6TH PLAYER TIER (7-9)
  {
    id: 'nike-kyrie-4',
    name: 'Kyrie 4',
    brand: 'Nike',
    year: 2017,
    player: 'Kyrie Irving',
    tier: 'sixth_player',
    badgeName: 'Handle Master',
    xpReward: 200,
    unlocked: false,
    description: 'Designed for the best ball handler in the league',
    colorway: 'Uncle Drew',
  },
  {
    id: 'ua-curry-4',
    name: 'Curry 4',
    brand: 'Under Armour',
    year: 2017,
    player: 'Stephen Curry',
    tier: 'sixth_player',
    badgeName: 'Chef Curry',
    xpReward: 225,
    unlocked: false,
    description: 'Cooking up threes from anywhere on the court',
    colorway: 'More Dimes',
  },
  {
    id: 'nike-kd-4',
    name: 'KD IV',
    brand: 'Nike',
    year: 2011,
    player: 'Kevin Durant',
    tier: 'sixth_player',
    badgeName: 'Slim Reaper',
    xpReward: 250,
    unlocked: false,
    description: 'Lightweight and deadly, just like KD',
    colorway: 'Weatherman',
  },
  
  // STARTING 5 TIER (10-12)
  {
    id: 'air-jordan-1-high',
    name: 'Air Jordan 1 High OG',
    brand: 'Jordan',
    year: 1985,
    player: 'Michael Jordan',
    tier: 'starting_five',
    badgeName: 'The Beginning',
    xpReward: 300,
    unlocked: false,
    description: 'The shoe that started the greatest sneaker legacy',
    colorway: 'Bred',
  },
  {
    id: 'nike-kobe-4',
    name: 'Kobe 4 Protro',
    brand: 'Nike',
    year: 2009,
    player: 'Kobe Bryant',
    tier: 'starting_five',
    badgeName: 'Mamba Mentality',
    xpReward: 325,
    unlocked: false,
    description: 'Low-top revolution that changed the game',
    colorway: 'Carpe Diem',
  },
  {
    id: 'nike-lebron-7',
    name: 'LeBron 7',
    brand: 'Nike',
    year: 2009,
    player: 'LeBron James',
    tier: 'starting_five',
    badgeName: 'King James',
    xpReward: 350,
    unlocked: false,
    description: 'Built for the most powerful player in the league',
    colorway: 'Christmas',
  },
  
  // ALL-STAR TIER (13-15)
  {
    id: 'air-jordan-3',
    name: 'Air Jordan 3',
    brand: 'Jordan',
    year: 1988,
    player: 'Michael Jordan',
    tier: 'all_star',
    badgeName: 'Tinker Magic',
    xpReward: 400,
    unlocked: false,
    description: "Tinker Hatfield's masterpiece with visible Air",
    colorway: 'White Cement',
  },
  {
    id: 'nike-kobe-5',
    name: 'Kobe 5',
    brand: 'Nike',
    year: 2010,
    player: 'Kobe Bryant',
    tier: 'all_star',
    badgeName: 'Black Mamba',
    xpReward: 425,
    unlocked: false,
    description: "Kobe's favorite shoe he ever played in",
    colorway: 'Bruce Lee',
  },
  {
    id: 'nike-lebron-9',
    name: 'LeBron 9',
    brand: 'Nike',
    year: 2011,
    player: 'LeBron James',
    tier: 'all_star',
    badgeName: 'South Beach',
    xpReward: 450,
    unlocked: false,
    description: 'The shoe that defined the Miami era',
    colorway: 'South Beach',
  },
  
  // ELITE TIER (16-17)
  {
    id: 'air-jordan-4',
    name: 'Air Jordan 4',
    brand: 'Jordan',
    year: 1989,
    player: 'Michael Jordan',
    tier: 'elite',
    badgeName: 'Bred Perfection',
    xpReward: 500,
    unlocked: false,
    description: 'The shoe MJ wore when he hit THE shot',
    colorway: 'Bred',
  },
  {
    id: 'nike-kobe-6-grinch',
    name: 'Kobe 6 Grinch',
    brand: 'Nike',
    year: 2010,
    player: 'Kobe Bryant',
    tier: 'elite',
    badgeName: 'Christmas Legend',
    xpReward: 550,
    unlocked: false,
    description: 'The most iconic Christmas Day sneaker ever',
    colorway: 'Grinch',
  },
  
  // MVP TIER (18-19)
  {
    id: 'air-jordan-6',
    name: 'Air Jordan 6',
    brand: 'Jordan',
    year: 1991,
    player: 'Michael Jordan',
    tier: 'mvp',
    badgeName: 'First Ring',
    xpReward: 600,
    unlocked: false,
    description: "MJ's first championship shoe",
    colorway: 'Infrared',
  },
  {
    id: 'nike-lebron-15',
    name: 'LeBron 15',
    brand: 'Nike',
    year: 2017,
    player: 'LeBron James',
    tier: 'mvp',
    badgeName: 'Battle Knit',
    xpReward: 650,
    unlocked: false,
    description: 'Revolutionary BattleKnit technology',
    colorway: 'Ashes',
  },
  
  // CHAMPION TIER (20-21)
  {
    id: 'air-jordan-11-concord',
    name: 'Air Jordan 11',
    brand: 'Jordan',
    year: 1995,
    player: 'Michael Jordan',
    tier: 'champion',
    badgeName: 'The Grail',
    xpReward: 750,
    unlocked: false,
    description: 'The most coveted Jordan of all time',
    colorway: 'Concord',
  },
  {
    id: 'nike-kobe-8',
    name: 'Kobe 8 System',
    brand: 'Nike',
    year: 2013,
    player: 'Kobe Bryant',
    tier: 'champion',
    badgeName: 'Elite Performance',
    xpReward: 800,
    unlocked: false,
    description: 'The lightest basketball shoe ever made at the time',
    colorway: 'What The Kobe',
  },
  
  // HALL OF FAME TIER (22-23)
  {
    id: 'air-jordan-11-space-jam',
    name: 'Air Jordan 11 Space Jam',
    brand: 'Jordan',
    year: 1995,
    player: 'Michael Jordan',
    tier: 'hall_of_fame',
    badgeName: 'Movie Magic',
    xpReward: 900,
    unlocked: false,
    description: 'The shoe that saved the Looney Tunes',
    colorway: 'Space Jam',
  },
  {
    id: 'nike-air-mag',
    name: 'Air Mag',
    brand: 'Nike',
    year: 2011,
    tier: 'hall_of_fame',
    badgeName: 'Back to the Future',
    xpReward: 1000,
    unlocked: false,
    description: 'Self-lacing shoes from the future',
    colorway: 'Marty McFly',
  },
  
  // G.O.A.T. TIER (24-25)
  {
    id: 'air-jordan-1-chicago',
    name: 'Air Jordan 1 Chicago',
    brand: 'Jordan',
    year: 1985,
    player: 'Michael Jordan',
    tier: 'goat',
    badgeName: 'The $2.2 Million',
    xpReward: 1500,
    unlocked: false,
    description: 'Game-worn pair sold for $2.2 million - the most expensive sneaker ever',
    colorway: 'Chicago',
  },
  {
    id: 'nike-air-yeezy-1',
    name: 'Air Yeezy 1 Grammy',
    brand: 'Nike',
    year: 2008,
    player: 'Kanye West',
    tier: 'goat',
    badgeName: 'Ultimate Legend',
    xpReward: 2000,
    unlocked: false,
    description: 'The prototype worn at the 2008 Grammys - sold for $1.8 million',
    colorway: 'Grammy',
  },
]

// Sneaker Image Component - Uses real images from /public/sneakers/ folder
// If image doesn't exist, falls back to placeholder SVG
const SneakerImage = ({ sneaker, className }: { sneaker: Sneaker; className?: string }) => {
  const [imageError, setImageError] = useState(false)
  const config = TIER_CONFIG[sneaker.tier]
  
  // Try to load the real sneaker image
  const imagePath = `/sneakers/${sneaker.id}.png`
  
  if (imageError) {
    // Fallback placeholder SVG
    return (
      <svg className={className} viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="M10 55 L15 50 L30 48 L50 46 L70 45 L90 46 L105 48 L110 52 L112 58 L110 65 L100 68 L20 68 L12 65 L10 60 Z" 
          fill={config.color}
          opacity="0.9"
        />
        <path 
          d="M20 50 L20 35 L28 25 L45 20 L60 18 L75 20 L85 25 L90 35 L90 45" 
          stroke={config.color}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <path 
          d="M20 50 L20 35 L28 25 L45 20 L60 18 L75 20 L85 25 L90 35 L90 45 L85 46 L70 45 L50 46 L30 48 L20 50 Z" 
          fill={config.color}
          opacity="0.7"
        />
        <path d="M35 30 L55 30" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
        <path d="M38 35 L52 35" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
        <path d="M40 40 L50 40" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
        <path d="M55 48 L95 52" stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.6"/>
        <ellipse cx="100" cy="55" rx="6" ry="8" fill="white" opacity="0.3"/>
      </svg>
    )
  }
  
  return (
    <img 
      src={imagePath}
      alt={sneaker.name}
      className={`${className} object-contain`}
      onError={() => setImageError(true)}
    />
  )
}

// Sneaker Badge Card Component
const SneakerBadgeCard = ({ sneaker, onClick }: { sneaker: Sneaker; onClick: () => void }) => {
  const tierConfig = TIER_CONFIG[sneaker.tier]
  
  return (
    <button
      onClick={onClick}
      className={`
        w-full bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] 
        rounded-2xl p-4 border-2 
        transition-all duration-300 
        hover:scale-105 hover:shadow-2xl
        relative overflow-hidden
        ${sneaker.unlocked ? 'cursor-pointer' : 'cursor-not-allowed'}
      `}
      style={{ 
        borderColor: sneaker.unlocked ? tierConfig.borderColor : '#3a3a3a',
        boxShadow: sneaker.unlocked ? tierConfig.glow : 'none',
      }}
    >
      {/* Background Glow Effect */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{ background: sneaker.unlocked ? tierConfig.bgPattern : 'none' }}
      />
      
      {/* Brand Label */}
      <div className="absolute top-2 right-2 z-10">
        <span 
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{ 
            background: sneaker.unlocked ? `${tierConfig.color}30` : '#3a3a3a',
            color: sneaker.unlocked ? tierConfig.color : '#666',
          }}
        >
          {sneaker.brand}
        </span>
      </div>
      
      {/* BIG SNEAKER IMAGE AREA */}
      <div className="relative w-full aspect-square mb-3 flex items-center justify-center">
        <div 
          className="w-full h-full flex items-center justify-center p-2"
          style={{ 
            filter: sneaker.unlocked ? 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' : 'grayscale(100%) opacity(0.3)',
          }}
        >
          <SneakerImage sneaker={sneaker} className="w-full h-full" />
        </div>
        
        {/* Lock Overlay */}
        {!sneaker.unlocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[#1a1a1a]/80 flex items-center justify-center">
              <Lock className="w-8 h-8 text-[#666]" />
            </div>
          </div>
        )}
      </div>
      
      {/* Sneaker Name */}
      <h3 
        className="font-bold text-base text-center uppercase tracking-wide leading-tight mb-1"
        style={{ color: sneaker.unlocked ? 'white' : '#666' }}
      >
        {sneaker.name}
      </h3>
      
      {/* Colorway */}
      <p className="text-[11px] text-center text-[#888] mb-2">
        {sneaker.colorway}
      </p>
      
      {/* Badge Name */}
      <p 
        className="text-sm text-center font-bold mb-2"
        style={{ color: sneaker.unlocked ? tierConfig.textColor : '#555' }}
      >
        {sneaker.badgeName}
      </p>
      
      {/* Tier Badge */}
      <div 
        className="py-1.5 px-3 rounded-full text-center text-[11px] font-bold uppercase tracking-wider mx-auto w-fit"
        style={{ 
          background: sneaker.unlocked ? tierConfig.gradient : '#3a3a3a',
          color: sneaker.unlocked ? '#1a1a1a' : '#666',
          boxShadow: sneaker.unlocked ? `0 4px 15px ${tierConfig.color}40` : 'none',
        }}
      >
        {tierConfig.name}
      </div>
      
      {/* XP Reward */}
      <p className="text-[#888] text-xs text-center mt-2 font-medium">
        +{sneaker.xpReward} XP
      </p>
      
      {/* Player Name (if applicable) */}
      {sneaker.player && (
        <p className="text-[10px] text-center text-[#666] mt-1 italic">
          {sneaker.player}
        </p>
      )}
    </button>
  )
}

// Detail Modal Component
const SneakerDetailModal = ({ sneaker, onClose }: { sneaker: Sneaker; onClose: () => void }) => {
  const tierConfig = TIER_CONFIG[sneaker.tier]
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-[#1a1a1a] rounded-3xl overflow-hidden border-2"
        style={{ borderColor: tierConfig.borderColor }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Glow */}
        <div 
          className="relative p-6 pb-4"
          style={{ background: tierConfig.bgPattern }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          
          {/* Big Sneaker */}
          <div className="w-48 h-48 mx-auto mb-4">
            <SneakerImage sneaker={sneaker} className="w-full h-full" />
          </div>
          
          {/* Tier Badge */}
          <div 
            className="py-2 px-4 rounded-full text-center text-sm font-bold uppercase tracking-wider mx-auto w-fit"
            style={{ 
              background: tierConfig.gradient,
              color: '#1a1a1a',
              boxShadow: tierConfig.glow,
            }}
          >
            {tierConfig.name}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#888] text-sm">{sneaker.brand}</span>
            <span className="text-[#888] text-sm">{sneaker.year}</span>
          </div>
          
          <h2 className="text-white text-2xl font-bold uppercase mb-1">{sneaker.name}</h2>
          <p className="text-[#888] text-sm mb-3">{sneaker.colorway}</p>
          
          {sneaker.player && (
            <p style={{ color: tierConfig.textColor }} className="text-sm font-medium mb-3">
              {sneaker.player} Signature
            </p>
          )}
          
          <h3 
            className="text-xl font-bold mb-2"
            style={{ color: tierConfig.textColor }}
          >
            {sneaker.badgeName}
          </h3>
          
          <p className="text-[#888] text-sm mb-4">{sneaker.description}</p>
          
          <div className="flex items-center justify-between pt-4 border-t border-[#3a3a3a]">
            <span className="text-[#888]">XP Reward</span>
            <span style={{ color: tierConfig.textColor }} className="text-lg font-bold">
              +{sneaker.xpReward} XP
            </span>
          </div>
          
          {!sneaker.unlocked && (
            <div className="mt-4 p-3 bg-[#2a2a2a] rounded-xl flex items-center gap-3">
              <Lock className="w-5 h-5 text-[#666]" />
              <span className="text-[#888] text-sm">Complete more challenges to unlock this badge</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Main Page Component
export default function TestSneakersPage() {
  const [selectedSneaker, setSelectedSneaker] = useState<Sneaker | null>(null)
  const [selectedTier, setSelectedTier] = useState<SneakerTier | 'all'>('all')
  
  const filteredSneakers = selectedTier === 'all' 
    ? SNEAKERS 
    : SNEAKERS.filter(s => s.tier === selectedTier)
  
  const unlockedCount = SNEAKERS.filter(s => s.unlocked).length
  const totalXP = SNEAKERS.filter(s => s.unlocked).reduce((sum, s) => sum + s.xpReward, 0)
  
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white text-2xl font-bold uppercase tracking-wide flex items-center gap-2">
                <Trophy className="w-6 h-6 text-[#FFD700]" />
                Sneaker Collection
              </h1>
              <p className="text-[#888] text-sm">{unlockedCount}/{SNEAKERS.length} Unlocked</p>
            </div>
            <div className="text-right">
              <p className="text-[#888] text-sm">Total XP</p>
              <p className="text-[#FFD700] text-xl font-bold">{totalXP.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tier Filter */}
      <div className="sticky top-[88px] z-30 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedTier('all')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold uppercase transition-all ${
                selectedTier === 'all'
                  ? 'bg-[#FF6B35] text-white'
                  : 'bg-[#2a2a2a] text-[#888] hover:bg-[#3a3a3a]'
              }`}
            >
              All ({SNEAKERS.length})
            </button>
            {(Object.keys(TIER_CONFIG) as SneakerTier[]).map((tier) => {
              const config = TIER_CONFIG[tier]
              const count = SNEAKERS.filter(s => s.tier === tier).length
              return (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold uppercase transition-all ${
                    selectedTier === tier
                      ? 'text-[#1a1a1a]'
                      : 'bg-[#2a2a2a] text-[#888] hover:bg-[#3a3a3a]'
                  }`}
                  style={{
                    background: selectedTier === tier ? config.gradient : undefined,
                    boxShadow: selectedTier === tier ? config.glow : undefined,
                  }}
                >
                  {config.name} ({count})
                </button>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Sneaker Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredSneakers.map((sneaker) => (
            <SneakerBadgeCard
              key={sneaker.id}
              sneaker={sneaker}
              onClick={() => setSelectedSneaker(sneaker)}
            />
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="max-w-7xl mx-auto px-4 py-6 border-t border-[#2a2a2a]">
        <h3 className="text-white font-bold text-lg mb-4 uppercase">Tier Legend</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {(Object.keys(TIER_CONFIG) as SneakerTier[]).map((tier) => {
            const config = TIER_CONFIG[tier]
            return (
              <div 
                key={tier}
                className="flex items-center gap-2 p-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]"
              >
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ background: config.gradient, boxShadow: config.glow }}
                />
                <span className="text-white text-xs font-bold uppercase">{config.name}</span>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Detail Modal */}
      {selectedSneaker && (
        <SneakerDetailModal
          sneaker={selectedSneaker}
          onClose={() => setSelectedSneaker(null)}
        />
      )}
    </div>
  )
}

