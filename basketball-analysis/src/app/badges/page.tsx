"use client"

import React from "react"
import { Trophy, Star, Target, Flame, Zap, Award, Medal, Crown, Lock } from "lucide-react"

// Badge definitions
const BADGES = [
  {
    id: "first-analysis",
    name: "First Shot",
    description: "Complete your first shooting form analysis",
    icon: Target,
    color: "from-green-500 to-emerald-600",
    unlocked: true,
    unlockedDate: "Dec 15, 2024",
  },
  {
    id: "perfect-form",
    name: "Perfect Form",
    description: "Achieve a 95+ overall score on any analysis",
    icon: Star,
    color: "from-yellow-500 to-amber-600",
    unlocked: false,
  },
  {
    id: "consistency-king",
    name: "Consistency King",
    description: "Complete 10 analyses with scores above 80",
    icon: Crown,
    color: "from-purple-500 to-violet-600",
    unlocked: false,
    progress: { current: 3, total: 10 },
  },
  {
    id: "hot-streak",
    name: "Hot Streak",
    description: "Complete 5 analyses in a single day",
    icon: Flame,
    color: "from-orange-500 to-red-600",
    unlocked: true,
    unlockedDate: "Dec 18, 2024",
  },
  {
    id: "elite-comparison",
    name: "Elite Comparison",
    description: "Compare your form with 20 different elite shooters",
    icon: Users,
    color: "from-blue-500 to-cyan-600",
    unlocked: false,
    progress: { current: 8, total: 20 },
  },
  {
    id: "video-master",
    name: "Video Master",
    description: "Analyze 5 shooting videos",
    icon: Zap,
    color: "from-pink-500 to-rose-600",
    unlocked: false,
    progress: { current: 2, total: 5 },
  },
  {
    id: "improvement",
    name: "Rising Star",
    description: "Improve your score by 10+ points between analyses",
    icon: Award,
    color: "from-teal-500 to-green-600",
    unlocked: true,
    unlockedDate: "Dec 20, 2024",
  },
  {
    id: "legendary",
    name: "Legendary Status",
    description: "Match or exceed a legendary shooter's form metrics",
    icon: Medal,
    color: "from-amber-500 to-yellow-600",
    unlocked: false,
  },
]

// Achievement categories
const ACHIEVEMENTS = [
  {
    category: "Analysis Milestones",
    items: [
      { name: "10 Analyses", completed: true, reward: "+100 XP" },
      { name: "25 Analyses", completed: false, reward: "+250 XP" },
      { name: "50 Analyses", completed: false, reward: "+500 XP" },
      { name: "100 Analyses", completed: false, reward: "+1000 XP" },
    ],
  },
  {
    category: "Score Goals",
    items: [
      { name: "Score 70+", completed: true, reward: "Bronze Badge" },
      { name: "Score 80+", completed: true, reward: "Silver Badge" },
      { name: "Score 90+", completed: false, reward: "Gold Badge" },
      { name: "Score 95+", completed: false, reward: "Diamond Badge" },
    ],
  },
  {
    category: "Form Mastery",
    items: [
      { name: "Perfect Elbow Angle", completed: true, reward: "+50 XP" },
      { name: "Optimal Release Point", completed: false, reward: "+50 XP" },
      { name: "Balanced Follow Through", completed: true, reward: "+50 XP" },
      { name: "Elite Arc Trajectory", completed: false, reward: "+100 XP" },
    ],
  },
]

// Import Users icon that was missing
import { Users } from "lucide-react"

function BadgeCard({ badge }: { badge: typeof BADGES[0] }) {
  const Icon = badge.icon
  
  return (
    <div className={`relative rounded-xl p-6 border ${badge.unlocked ? 'bg-[#2C2C2C] border-[#3a3a3a]' : 'bg-[#1a1a1a] border-[#2a2a2a]'} transition-all hover:scale-105`}>
      {/* Lock overlay for locked badges */}
      {!badge.unlocked && (
        <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center z-10">
          <Lock className="w-8 h-8 text-[#666]" />
        </div>
      )}
      
      {/* Badge Icon */}
      <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${badge.color} flex items-center justify-center mb-4 mx-auto ${!badge.unlocked && 'opacity-30'}`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      
      {/* Badge Info */}
      <h3 className={`text-lg font-bold text-center mb-2 ${badge.unlocked ? 'text-[#FFD700]' : 'text-[#666]'}`}>
        {badge.name}
      </h3>
      <p className={`text-sm text-center mb-3 ${badge.unlocked ? 'text-[#E5E5E5]' : 'text-[#555]'}`}>
        {badge.description}
      </p>
      
      {/* Progress bar for badges with progress */}
      {badge.progress && !badge.unlocked && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-[#888] mb-1">
            <span>Progress</span>
            <span>{badge.progress.current}/{badge.progress.total}</span>
          </div>
          <div className="h-2 bg-[#3a3a3a] rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${badge.color} rounded-full`}
              style={{ width: `${(badge.progress.current / badge.progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Unlocked date */}
      {badge.unlocked && badge.unlockedDate && (
        <p className="text-xs text-[#888] text-center mt-2">
          Unlocked: {badge.unlockedDate}
        </p>
      )}
    </div>
  )
}

export default function BadgesPage() {
  const unlockedCount = BADGES.filter(b => b.unlocked).length
  const totalBadges = BADGES.length
  
  return (
    <div className="container mx-auto px-6 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FFD700]/20 rounded-full mb-4">
          <Trophy className="w-8 h-8 text-[#FFD700]" />
        </div>
        <h1 className="text-4xl font-bold text-[#FFD700] mb-3">Badges & Achievements</h1>
        <p className="text-[#E5E5E5] text-lg max-w-2xl mx-auto">
          Track your progress and unlock rewards as you improve your shooting form.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-[#2C2C2C] rounded-lg p-6 border border-[#3a3a3a] text-center">
          <div className="text-3xl font-bold text-[#FFD700] mb-1">{unlockedCount}/{totalBadges}</div>
          <div className="text-[#888] text-sm uppercase tracking-wider">Badges Unlocked</div>
        </div>
        <div className="bg-[#2C2C2C] rounded-lg p-6 border border-[#3a3a3a] text-center">
          <div className="text-3xl font-bold text-green-400 mb-1">1,250</div>
          <div className="text-[#888] text-sm uppercase tracking-wider">Total XP</div>
        </div>
        <div className="bg-[#2C2C2C] rounded-lg p-6 border border-[#3a3a3a] text-center">
          <div className="text-3xl font-bold text-blue-400 mb-1">Level 5</div>
          <div className="text-[#888] text-sm uppercase tracking-wider">Current Level</div>
        </div>
        <div className="bg-[#2C2C2C] rounded-lg p-6 border border-[#3a3a3a] text-center">
          <div className="text-3xl font-bold text-purple-400 mb-1">78%</div>
          <div className="text-[#888] text-sm uppercase tracking-wider">Completion Rate</div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-[#FFD700] mb-6 flex items-center gap-3">
          <Medal className="w-6 h-6" />
          Your Badges
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {BADGES.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
      </div>

      {/* Achievements Section */}
      <div>
        <h2 className="text-2xl font-bold text-[#FFD700] mb-6 flex items-center gap-3">
          <Award className="w-6 h-6" />
          Achievements
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ACHIEVEMENTS.map((category) => (
            <div key={category.category} className="bg-[#2C2C2C] rounded-lg border border-[#3a3a3a] overflow-hidden">
              <div className="p-4 border-b border-[#3a3a3a] bg-[#252525]">
                <h3 className="font-semibold text-[#E5E5E5]">{category.category}</h3>
              </div>
              <div className="p-4 space-y-3">
                {category.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${item.completed ? 'bg-green-500' : 'bg-[#3a3a3a]'}`}>
                        {item.completed && <Star className="w-3 h-3 text-white" />}
                      </div>
                      <span className={item.completed ? 'text-[#E5E5E5]' : 'text-[#666]'}>{item.name}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${item.completed ? 'bg-green-500/20 text-green-400' : 'bg-[#3a3a3a] text-[#888]'}`}>
                      {item.reward}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress to Next Level */}
      <div className="mt-12 bg-gradient-to-r from-[#FFD700]/20 to-[#FFA500]/20 rounded-lg p-8 border border-[#FFD700]/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-[#FFD700]">Progress to Level 6</h3>
            <p className="text-[#E5E5E5]">750 XP remaining</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#FFD700]">1,250 / 2,000 XP</div>
          </div>
        </div>
        <div className="h-4 bg-[#3a3a3a] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-full transition-all duration-500"
            style={{ width: '62.5%' }}
          />
        </div>
      </div>
    </div>
  )
}




