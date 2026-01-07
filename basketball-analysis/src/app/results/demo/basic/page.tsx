"use client"

import React, { useState } from "react"
import { 
  Star, Flame, Trophy, Target, Zap, Heart, Crown,
  ChevronRight, Lock, Check, Sparkles, TrendingUp,
  X, Camera, Video, Image as ImageIcon,
  Radio, Award, Users, BarChart3, Dumbbell,
  CircleDot, Eye, Hand, Scale, Rainbow, Rocket,
  BookOpen, GraduationCap, Gem, Activity,
  ChevronDown, User, ClipboardList, Home, Upload, Repeat,
  ThumbsUp, ThumbsDown, ChevronLeft, ChevronRightIcon,
  TreePine, Leaf, TreeDeciduous, Mountain, Maximize2,
  Clock
} from "lucide-react"
import Link from "next/link"

// ============================================
// DUOLINGO-INSPIRED BASIC DASHBOARD
// DESKTOP-FIRST - MATCHING PRO DASHBOARD LAYOUT
// Layout = Professional Dashboard
// Components = Duolingo Gamification
// Kid-Friendly Letter Grades (A, B, C, D, F)
// ============================================

// ============================================
// MOCK DATA - DUOLINGO STYLE
// ============================================

const MOCK_USER = {
  name: 'Alex',
  level: 5,
  levelName: "RISING SHOOTER",
  xp: 1250,
  xpToNextLevel: 500,
  currentXp: 250,
  maxXp: 500,
  streak: 7,
  hearts: 4,
  maxHearts: 5,
  gems: 125,
  score: 78,
  totalPractices: 23,
  rank: 127,
  totalUsers: 2453,
  jerseyNumber: 23,
  height: "5'8\"",
  weight: "145 LBS",
  latestBadge: {
    name: "WEEK WARRIOR",
    earnedDate: "JAN 5, 2026"
  }
}

// ============================================
// KID-FRIENDLY LETTER GRADE SYSTEM
// ============================================

// Grade conversion helper
function getGrade(value: number): { letter: string; color: string; bgColor: string; message: string } {
  if (value >= 90) return { letter: 'A', color: '#22C55E', bgColor: '#22C55E15', message: 'Amazing!' }
  if (value >= 80) return { letter: 'B', color: '#3B82F6', bgColor: '#3B82F615', message: 'Great job!' }
  if (value >= 70) return { letter: 'C', color: '#FF6B35', bgColor: '#FF6B3515', message: 'Keep practicing!' }
  if (value >= 60) return { letter: 'D', color: '#F59E0B', bgColor: '#F59E0B15', message: 'Needs work!' }
  return { letter: 'F', color: '#EF4444', bgColor: '#EF444415', message: 'Practice more!' }
}

// Skill info with Lucide icons (all use consistent orange color)
const SKILL_INFO: Record<string, { 
  name: string
  Icon: React.ElementType
  kidExplanation: string
  howToImprove: string
}> = {
  RELEASE: {
    name: 'Release',
    Icon: CircleDot,
    kidExplanation: "This is how you let go of the ball. You want to let it go smoothly, like throwing a paper airplane!",
    howToImprove: "Practice flicking your wrist when you shoot. Pretend you're reaching into a cookie jar on a high shelf!",
  },
  FORM: {
    name: 'Form',
    Icon: Target,
    kidExplanation: "This is how your body looks when you shoot. Your arm should make a nice letter 'L' shape!",
    howToImprove: "Stand in front of a mirror and practice making an 'L' shape with your shooting arm.",
  },
  BALANCE: {
    name: 'Balance',
    Icon: Scale,
    kidExplanation: "This is how steady you stand. Like a superhero ready to save the day - feet apart, standing strong!",
    howToImprove: "Practice standing on one foot for 10 seconds. The more you practice, the steadier you'll be!",
  },
  ARC: {
    name: 'Arc',
    Icon: Rainbow,
    kidExplanation: "This is how high your ball goes. The ball should make a pretty curve like a rainbow in the sky!",
    howToImprove: "Try to shoot the ball so it goes up high like a rainbow before coming down into the basket.",
  },
  ELBOW: {
    name: 'Elbow',
    Icon: Activity,
    kidExplanation: "This is where your elbow points. It should point at the basket, like pointing at your favorite toy!",
    howToImprove: "When you hold the ball, make sure your elbow is under the ball and pointing at the hoop.",
  },
  FOLLOW: {
    name: 'Follow',
    Icon: Hand,
    kidExplanation: "This is what your hand does after you shoot. Wave goodbye to the ball like you're saying 'Go in!'",
    howToImprove: "After you shoot, keep your hand up and wave at the basket. Count to 2 before putting it down!",
  },
  CONSIST: {
    name: 'Consistency',
    Icon: Repeat,
    kidExplanation: "This means doing the same thing every time. Like brushing your teeth the same way every day!",
    howToImprove: "Practice shooting 10 times in a row, trying to do the exact same thing each time.",
  },
  POWER: {
    name: 'Power',
    Icon: Zap,
    kidExplanation: "This is how strong your shot is. You use your legs to give the ball energy, like jumping!",
    howToImprove: "Bend your knees before you shoot and push up. Your legs are like springs!",
  },
}

// Skill metrics with values
const SKILL_METRICS = [
  { key: 'RELEASE', value: 67 },
  { key: 'FORM', value: 73 },
  { key: 'BALANCE', value: 80 },
  { key: 'ARC', value: 79 },
  { key: 'ELBOW', value: 90 },
  { key: 'FOLLOW', value: 80 },
  { key: 'CONSIST', value: 74 },
  { key: 'POWER', value: 78 },
]

// Matched elite shooters (kid-friendly "strive to be like")
const MATCHED_SHOOTERS = [
  { 
    rank: 1, 
    name: "Stephen Curry", 
    team: "Golden State Warriors", 
    matchScore: 82, // Used to calculate grade
    trait: "QUICK RELEASE", 
    avatar: "SC",
    funFact: "He practices 500 shots every day!",
    whyMatch: ["You both have a quick release!", "Your arc is similar!", "Great follow through!"]
  },
  { 
    rank: 2, 
    name: "Kyle Korver", 
    team: "Retired (Multiple Teams)", 
    matchScore: 77, 
    trait: "TEXTBOOK FORM", 
    avatar: "KK",
    funFact: "He made over 2,000 three-pointers!",
    whyMatch: ["Perfect shooting form!", "Great balance!", "Smooth release!"]
  },
  { 
    rank: 3, 
    name: "Ray Allen", 
    team: "Retired (Multiple Teams)", 
    matchScore: 72, 
    trait: "PERFECT ARC", 
    avatar: "RA",
    funFact: "He's one of the best shooters ever!",
    whyMatch: ["Beautiful rainbow arc!", "Consistent form!", "Great footwork!"]
  },
  { 
    rank: 4, 
    name: "Klay Thompson", 
    team: "Golden State Warriors", 
    matchScore: 67, 
    trait: "CATCH & SHOOT", 
    avatar: "KT",
    funFact: "He once scored 37 points in one quarter!",
    whyMatch: ["Quick catch and shoot!", "Steady hands!", "Good balance!"]
  },
  { 
    rank: 5, 
    name: "Devin Booker", 
    team: "Phoenix Suns", 
    matchScore: 62, 
    trait: "SMOOTH STROKE", 
    avatar: "DB",
    funFact: "He scored 70 points in one game!",
    whyMatch: ["Smooth shooting motion!", "Great wrist flick!", "Calm under pressure!"]
  },
]

// Skill tree / lessons (Duolingo-style progression)
const LESSONS = [
  { id: 1, name: 'Ready Position', Icon: CircleDot, completed: true, stars: 3, xp: 50 },
  { id: 2, name: 'Elbow Straight', Icon: Activity, completed: true, stars: 2, xp: 50 },
  { id: 3, name: 'Eyes on Target', Icon: Eye, completed: true, stars: 3, xp: 50 },
  { id: 4, name: 'Follow Through', Icon: Hand, completed: true, stars: 2, xp: 50 },
  { id: 5, name: 'Balance', Icon: Scale, completed: false, stars: 0, xp: 0, current: true },
  { id: 6, name: 'Arc Master', Icon: Rainbow, completed: false, stars: 0, xp: 0, locked: true },
  { id: 7, name: 'Power Shot', Icon: Zap, completed: false, stars: 0, xp: 0, locked: true },
  { id: 8, name: 'Perfect Form', Icon: Sparkles, completed: false, stars: 0, xp: 0, locked: true },
]

// ============================================
// SKILL TREE PROGRESSION SYSTEM
// Tree grows as player advances through levels
// ============================================

// Tree types that represent player progression
// 10 Tree Levels - Each with progressively more skills
const TREE_TYPES = [
  { level: 1, name: 'Seedling', Icon: Leaf, skillCount: 4, color: '#86EFAC', description: 'Just planted! Learn the basics.' },
  { level: 2, name: 'Sprout', Icon: Leaf, skillCount: 6, color: '#6EE7B7', description: 'Growing roots! Building foundation.' },
  { level: 3, name: 'Sapling', Icon: TreePine, skillCount: 8, color: '#4ADE80', description: 'Getting taller! Form is developing.' },
  { level: 4, name: 'Birch', Icon: TreePine, skillCount: 10, color: '#34D399', description: 'Standing strong! Skills are solid.' },
  { level: 5, name: 'Maple', Icon: TreeDeciduous, skillCount: 12, color: '#22C55E', description: 'Beautiful form! Technique is sharp.' },
  { level: 6, name: 'Oak', Icon: TreeDeciduous, skillCount: 14, color: '#16A34A', description: 'Powerful presence! Consistency growing.' },
  { level: 7, name: 'Sequoia', Icon: TreeDeciduous, skillCount: 16, color: '#15803D', description: 'Rising high! Advanced skills unlocked.' },
  { level: 8, name: 'Redwood', Icon: Mountain, skillCount: 18, color: '#166534', description: 'Towering talent! Near mastery.' },
  { level: 9, name: 'Ancient Oak', Icon: Mountain, skillCount: 20, color: '#14532D', description: 'Legendary form! Elite level.' },
  { level: 10, name: 'World Tree', Icon: Crown, skillCount: 24, color: '#FFD700', description: 'MASTERY ACHIEVED! You are a Champion!' },
]

// Skill branches for the tree (organized by category)
const SKILL_BRANCHES = [
  {
    id: 'fundamentals',
    name: 'Fundamentals',
    color: '#FF6B35',
    skills: [
      { id: 1, name: 'Ready Position', Icon: CircleDot, completed: true },
      { id: 2, name: 'Grip', Icon: Hand, completed: true },
    ]
  },
  {
    id: 'form',
    name: 'Form',
    color: '#22C55E',
    skills: [
      { id: 3, name: 'Elbow Straight', Icon: Activity, completed: true },
      { id: 4, name: 'Shoulder Align', Icon: Target, completed: false, current: true },
    ]
  },
  {
    id: 'focus',
    name: 'Focus',
    color: '#3B82F6',
    skills: [
      { id: 5, name: 'Eyes on Target', Icon: Eye, completed: true },
      { id: 6, name: 'Mental Focus', Icon: Target, completed: false, locked: true },
    ]
  },
  {
    id: 'release',
    name: 'Release',
    color: '#A855F7',
    skills: [
      { id: 7, name: 'Follow Through', Icon: Hand, completed: true },
      { id: 8, name: 'Wrist Flick', Icon: Zap, completed: false, locked: true },
    ]
  },
  {
    id: 'balance',
    name: 'Balance',
    color: '#F59E0B',
    skills: [
      { id: 9, name: 'Stance', Icon: Scale, completed: false, locked: true },
      { id: 10, name: 'Core Strength', Icon: Dumbbell, completed: false, locked: true },
    ]
  },
  {
    id: 'power',
    name: 'Power',
    color: '#EF4444',
    skills: [
      { id: 11, name: 'Leg Drive', Icon: Zap, completed: false, locked: true },
      { id: 12, name: 'Arc Master', Icon: Rainbow, completed: false, locked: true },
    ]
  },
]

// Calculate current tree type based on completed skills
function getCurrentTreeType(completedCount: number, totalSkills: number) {
  const progress = completedCount / totalSkills
  if (progress >= 0.9) return TREE_TYPES[5] // Redwood
  if (progress >= 0.7) return TREE_TYPES[4] // Oak
  if (progress >= 0.5) return TREE_TYPES[3] // Maple
  if (progress >= 0.3) return TREE_TYPES[2] // Birch
  if (progress >= 0.15) return TREE_TYPES[1] // Sapling
  return TREE_TYPES[0] // Seedling
}

// Daily quests (Duolingo-style daily challenges)
const DAILY_QUESTS = [
  { id: 1, name: 'Practice 1 time', Icon: Target, progress: 1, total: 1, xp: 10, completed: true },
  { id: 2, name: 'Score 75+', Icon: Star, progress: 1, total: 1, xp: 15, completed: true },
  { id: 3, name: 'Complete 3 lessons', Icon: BookOpen, progress: 2, total: 3, xp: 20, completed: false },
]

// ============================================
// GRADE CARD COMPONENT (Clickable)
// ============================================

function GradeCard({ 
  skillKey, 
  value, 
  onClick 
}: { 
  skillKey: string
  value: number
  onClick: () => void 
}) {
  const grade = getGrade(value)
  const info = SKILL_INFO[skillKey]
  const Icon = info.Icon
  
  return (
    <button
      onClick={onClick}
      className="text-center p-2 rounded-lg border border-[#3a3a3a] bg-[#1a1a1a] transition-all hover:scale-105 hover:border-[#FF6B35]/50 active:scale-95"
    >
      <div className="flex items-center justify-center gap-1 mb-1">
        <Icon className="w-3 h-3 text-[#FF6B35]" />
        <span className="text-[8px] text-[#888] uppercase">{info.name}</span>
      </div>
      <div 
        className="text-2xl font-black"
        style={{ color: grade.color }}
      >
        {grade.letter}
      </div>
      <div className="h-1 bg-[#3a3a3a] rounded-full mt-1.5 overflow-hidden">
        <div 
          className="h-full rounded-full" 
          style={{ width: `${value}%`, backgroundColor: grade.color }} 
        />
      </div>
    </button>
  )
}

// ============================================
// GRADE DETAIL POPUP
// ============================================

function GradePopup({ 
  skillKey, 
  value, 
  onClose 
}: { 
  skillKey: string
  value: number
  onClose: () => void 
}) {
  const grade = getGrade(value)
  const info = SKILL_INFO[skillKey]
  const Icon = info.Icon
  
  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm bg-[#1a1a1a] rounded-2xl overflow-hidden border border-[#3a3a3a] relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with Grade */}
        <div className="p-6 text-center bg-[#2a2a2a] border-b border-[#3a3a3a]">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#FF6B35]/20 flex items-center justify-center">
            <Icon className="w-6 h-6 text-[#FF6B35]" />
          </div>
          <div className="text-white font-bold text-lg mb-2">{info.name}</div>
          <div 
            className="text-6xl font-black"
            style={{ color: grade.color }}
          >
            {grade.letter}
          </div>
          <div 
            className="text-sm font-bold mt-1"
            style={{ color: grade.color }}
          >
            {grade.message}
          </div>
          {/* Progress bar */}
          <div className="mt-3 px-8">
            <div className="h-2 bg-[#3a3a3a] rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all" 
                style={{ width: `${value}%`, backgroundColor: grade.color }} 
              />
            </div>
            <div className="text-[#888] text-xs mt-1">{value}/100</div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-5 space-y-4">
          {/* What it means */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-[#FF6B35]" />
              <span className="text-[#FF6B35] text-xs font-bold uppercase">What does this mean?</span>
            </div>
            <p className="text-[#E5E5E5] text-sm leading-relaxed">
              {info.kidExplanation}
            </p>
          </div>
          
          {/* How to improve */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-[#22C55E]" />
              <span className="text-[#22C55E] text-xs font-bold uppercase">How to get a better grade</span>
            </div>
            <p className="text-[#E5E5E5] text-sm leading-relaxed">
              {info.howToImprove}
            </p>
          </div>
          
          {/* Practice Button */}
          <Link href="/?mode=image">
            <button className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[#FF6B35] to-[#E55A2B] hover:from-[#E55A2B] hover:to-[#FF6B35] transition-all flex items-center justify-center gap-2">
              <Rocket className="w-5 h-5" />
              Practice Now
            </button>
          </Link>
        </div>
        
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#3a3a3a] flex items-center justify-center text-[#888] hover:text-white hover:bg-[#4a4a4a] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ============================================
// REPORT CARD SECTION (Replaces Rising Star)
// ============================================

function ReportCard() {
  const [selectedSkill, setSelectedSkill] = useState<{ key: string; value: number } | null>(null)
  
  const avgScore = Math.round(SKILL_METRICS.reduce((sum, m) => sum + m.value, 0) / SKILL_METRICS.length)
  const overallGrade = getGrade(avgScore)
  
  return (
    <>
      <div className="p-4 grid grid-cols-2 gap-4">
        {/* Report Card */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="w-4 h-4 text-[#FF6B35]" />
            <span className="text-[#FF6B35] font-bold text-sm uppercase">My Report Card</span>
          </div>
          <div className="text-[#888] text-[10px] mb-3">Tap a grade to learn more</div>
          
          {/* Grade Grid - First Row */}
          <div className="grid grid-cols-4 gap-2 mb-2">
            {SKILL_METRICS.slice(0, 4).map(metric => (
              <GradeCard 
                key={metric.key}
                skillKey={metric.key}
                value={metric.value}
                onClick={() => setSelectedSkill(metric)}
              />
            ))}
          </div>
          
          {/* Grade Grid - Second Row */}
          <div className="grid grid-cols-4 gap-2">
            {SKILL_METRICS.slice(4, 8).map(metric => (
              <GradeCard 
                key={metric.key}
                skillKey={metric.key}
                value={metric.value}
                onClick={() => setSelectedSkill(metric)}
              />
            ))}
          </div>
        </div>
        
        {/* Overall Grade */}
        <div className="text-center flex flex-col items-center justify-center">
          <div className="text-[#FF6B35] text-xs uppercase tracking-wider mb-2">Overall Grade</div>
          <div 
            className="w-20 h-20 rounded-2xl flex items-center justify-center border-2"
            style={{ backgroundColor: overallGrade.bgColor, borderColor: overallGrade.color }}
          >
            <span 
              className="text-4xl font-black"
              style={{ color: overallGrade.color }}
            >
              {overallGrade.letter}
            </span>
          </div>
          <div 
            className="font-bold text-sm mt-2"
            style={{ color: overallGrade.color }}
          >
            {overallGrade.message}
          </div>
          <div className="text-[#888] text-[10px] mt-1">
            Keep practicing to get an A!
          </div>
        </div>
      </div>
      
      {/* Grade Detail Popup */}
      {selectedSkill && (
        <GradePopup 
          skillKey={selectedSkill.key}
          value={selectedSkill.value}
          onClose={() => setSelectedSkill(null)}
        />
      )}
    </>
  )
}

// ============================================
// SHOOTER HERO CARD (Kid-Friendly "Strive to Be Like")
// With thumbs up/down voting
// ============================================

function ShooterHeroCard() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedHero, setSelectedHero] = useState<number | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [savedHero, setSavedHero] = useState<number | null>(null)
  const [showSavedMessage, setShowSavedMessage] = useState(false)
  
  // Load saved hero from localStorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('shootingHero')
    if (saved) {
      const heroIndex = parseInt(saved, 10)
      if (!isNaN(heroIndex) && heroIndex >= 0 && heroIndex < MATCHED_SHOOTERS.length) {
        setSavedHero(heroIndex)
        setSelectedHero(heroIndex)
        setCurrentIndex(heroIndex)
        setShowConfirmation(true)
      }
    }
  }, [])
  
  const currentShooter = MATCHED_SHOOTERS[currentIndex]
  const shooterGrade = getGrade(currentShooter.matchScore)
  
  const handleThumbsUp = () => {
    setSelectedHero(currentIndex)
    setShowConfirmation(true)
  }
  
  const handleThumbsDown = () => {
    // Move to next shooter, loop back if at end
    const nextIndex = (currentIndex + 1) % MATCHED_SHOOTERS.length
    setCurrentIndex(nextIndex)
  }
  
  const handleChangeHero = () => {
    setShowConfirmation(false)
    setSelectedHero(null)
    const nextIndex = (currentIndex + 1) % MATCHED_SHOOTERS.length
    setCurrentIndex(nextIndex)
  }
  
  const handleSaveHero = () => {
    if (selectedHero !== null) {
      localStorage.setItem('shootingHero', selectedHero.toString())
      setSavedHero(selectedHero)
      setShowSavedMessage(true)
      // Hide the saved message after 2 seconds
      setTimeout(() => setShowSavedMessage(false), 2000)
    }
  }
  
  // If hero is selected, show confirmation view
  if (showConfirmation && selectedHero !== null) {
    const hero = MATCHED_SHOOTERS[selectedHero]
    const heroGrade = getGrade(hero.matchScore)
    const isAlreadySaved = savedHero === selectedHero
    
    return (
      <div className="bg-[#2a2a2a] rounded-lg border border-[#22C55E]/50 overflow-hidden">
        <div className="p-4 bg-[#22C55E]/10 border-b border-[#22C55E]/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#22C55E]" />
              <span className="text-[#22C55E] font-bold text-sm uppercase">Your Shooting Hero!</span>
            </div>
            {isAlreadySaved && (
              <div className="flex items-center gap-1 bg-[#22C55E]/20 px-2 py-1 rounded-full">
                <Check className="w-3 h-3 text-[#22C55E]" />
                <span className="text-[#22C55E] text-[10px] font-bold uppercase">Saved</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-5 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#FF6B35] to-[#E55A2B] flex items-center justify-center text-white font-bold text-2xl mb-3 ring-4 ring-[#22C55E]/30">
            {hero.avatar}
          </div>
          
          <div className="text-white font-black text-xl mb-1">{hero.name}</div>
          <div className="text-[#FF6B35] text-sm mb-3">{hero.team}</div>
          
          <div className="inline-flex items-center gap-2 bg-[#1a1a1a] px-4 py-2 rounded-full mb-4">
            <span className="text-[#888] text-sm">Your Match Grade:</span>
            <span className="text-2xl font-black" style={{ color: heroGrade.color }}>{heroGrade.letter}</span>
          </div>
          
          <p className="text-[#22C55E] text-sm font-bold mb-2">
            Great choice! Practice hard to shoot like {hero.name.split(' ')[0]}!
          </p>
          
          <p className="text-[#888] text-xs mb-4">{hero.funFact}</p>
          
          {/* Save Button */}
          {!isAlreadySaved ? (
            <button
              onClick={handleSaveHero}
              className="w-full py-3 mb-3 rounded-xl font-bold text-white bg-gradient-to-r from-[#FF6B35] to-[#E55A2B] hover:from-[#E55A2B] hover:to-[#FF6B35] transition-all flex items-center justify-center gap-2"
            >
              <Star className="w-5 h-5" />
              Save as My Hero
            </button>
          ) : showSavedMessage ? (
            <div className="w-full py-3 mb-3 rounded-xl font-bold text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center gap-2">
              <Check className="w-5 h-5" />
              Saved!
            </div>
          ) : (
            <div className="w-full py-3 mb-3 rounded-xl font-bold text-[#888] bg-[#1a1a1a] border border-[#3a3a3a] flex items-center justify-center gap-2">
              <Check className="w-5 h-5 text-[#22C55E]" />
              {hero.name.split(' ')[0]} is your hero!
            </div>
          )}
          
          <button
            onClick={handleChangeHero}
            className="text-[#888] text-xs underline hover:text-white transition-colors"
          >
            Choose a different hero
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-[#2a2a2a] rounded-lg border border-[#FF6B35]/30 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#3a3a3a]">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-[#FF6B35]" />
          <span className="text-[#FF6B35] font-bold text-sm uppercase">Strive To Be Like...</span>
        </div>
        <div className="text-[#888] text-xs mt-1">Pick your shooting hero!</div>
      </div>
      
      {/* Current Shooter */}
      <div className="p-5 bg-[#1a1a1a]">
        {/* Avatar and Name */}
        <div className="text-center mb-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#FF6B35] to-[#E55A2B] flex items-center justify-center text-white font-bold text-2xl mb-3">
            {currentShooter.avatar}
          </div>
          <div className="text-white font-black text-xl">{currentShooter.name}</div>
          <div className="text-[#FF6B35] text-sm">{currentShooter.team}</div>
        </div>
        
        {/* Match Grade */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="text-center">
            <div className="text-[#888] text-[10px] uppercase mb-1">Your Match Grade</div>
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center border-2"
              style={{ backgroundColor: shooterGrade.bgColor, borderColor: shooterGrade.color }}
            >
              <span className="text-3xl font-black" style={{ color: shooterGrade.color }}>
                {shooterGrade.letter}
              </span>
            </div>
            <div className="text-xs mt-1" style={{ color: shooterGrade.color }}>
              {shooterGrade.message}
            </div>
          </div>
        </div>
        
        {/* Fun Fact */}
        <div className="bg-[#2a2a2a] rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3 h-3 text-[#FF6B35]" />
            <span className="text-[#FF6B35] text-[10px] uppercase font-bold">Fun Fact</span>
          </div>
          <p className="text-white text-sm">{currentShooter.funFact}</p>
        </div>
        
        {/* Why You Match */}
        <div className="mb-4">
          <div className="text-[#888] text-[10px] uppercase mb-2">Why You're Similar</div>
          <div className="flex flex-wrap gap-2">
            {currentShooter.whyMatch.map((reason, i) => (
              <span key={i} className="px-2 py-1 bg-[#2a2a2a] border border-[#FF6B35]/30 rounded text-[#FF6B35] text-[10px]">
                {reason}
              </span>
            ))}
          </div>
        </div>
        
        {/* Question */}
        <div className="text-center mb-4">
          <p className="text-white font-bold text-sm">
            Do you want to shoot like {currentShooter.name.split(' ')[0]}?
          </p>
        </div>
        
        {/* Thumbs Up / Thumbs Down */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={handleThumbsDown}
            className="flex flex-col items-center gap-1 p-3 rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] hover:border-[#EF4444]/50 hover:bg-[#EF4444]/10 transition-all group"
          >
            <ThumbsDown className="w-8 h-8 text-[#888] group-hover:text-[#EF4444] transition-colors" />
            <span className="text-[10px] text-[#888] group-hover:text-[#EF4444] font-bold uppercase">No, Next</span>
          </button>
          
          <button
            onClick={handleThumbsUp}
            className="flex flex-col items-center gap-1 p-3 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/50 hover:bg-[#22C55E]/20 transition-all group"
          >
            <ThumbsUp className="w-8 h-8 text-[#22C55E] group-hover:scale-110 transition-transform" />
            <span className="text-[10px] text-[#22C55E] font-bold uppercase">Yes!</span>
          </button>
        </div>
        
        {/* Navigation dots */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {MATCHED_SHOOTERS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex ? 'bg-[#FF6B35] w-4' : 'bg-[#3a3a3a] hover:bg-[#4a4a4a]'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// COLLAPSIBLE STATS CARD (Like Pro Dashboard Top Bar)
// ============================================

function CollapsibleStatsCard() {
  const [isExpanded, setIsExpanded] = useState(false)
  const progressPercent = (MOCK_USER.currentXp / MOCK_USER.maxXp) * 100

  return (
    <div className="bg-[#2C2C2C] rounded-lg border border-[#3a3a3a] overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 md:p-4 flex items-center gap-3 md:gap-4 hover:bg-[#333] transition-colors"
      >
        {/* Level Badge */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-[#FF6B35]/20 rounded-lg flex items-center justify-center border border-[#FF6B35]/40 flex-shrink-0">
            <Award className="w-5 h-5 md:w-6 md:h-6 text-[#FF6B35]" />
          </div>
          <div className="text-left">
            <div className="text-[#FF6B35] text-[10px] md:text-xs uppercase tracking-wider font-semibold">Lv.{MOCK_USER.level}</div>
            <div className="text-[#FF6B35] font-bold text-sm md:text-base whitespace-nowrap">{MOCK_USER.levelName}</div>
          </div>
        </div>
        
        {/* XP Progress Bar */}
        <div className="hidden sm:flex flex-1 items-center gap-2 max-w-[200px]">
          <div className="flex-1">
            <div className="h-2 bg-[#3a3a3a] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF4500] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#888] mt-0.5">
              <span>{MOCK_USER.currentXp} XP</span>
              <span>{MOCK_USER.maxXp} XP</span>
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center gap-2 md:gap-3 ml-auto">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-[#1a1a1a] rounded-lg">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-white font-bold text-sm">{MOCK_USER.streak}</span>
          </div>
          <ChevronDown className={`w-5 h-5 text-[#888] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>
      
      {isExpanded && (
        <div className="px-3 md:px-4 pb-3 md:pb-4 border-t border-[#3a3a3a] bg-[#252525]">
          <div className="pt-3 md:pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/badges" className="bg-[#1a1a1a] rounded-lg p-3 hover:bg-[#222] transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-3 h-3 text-[#FF6B35]" />
                <span className="text-[#888] text-xs uppercase">Latest Badge</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF4500] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-[#1a1a1a]" />
                </div>
                <div>
                  <div className="text-[#E5E5E5] text-sm font-medium">{MOCK_USER.latestBadge.name}</div>
                  <div className="text-[#666] text-xs">{MOCK_USER.latestBadge.earnedDate}</div>
                </div>
              </div>
            </Link>
            
            <div className="bg-[#1a1a1a] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-3 h-3 text-orange-500" />
                <span className="text-[#888] text-xs uppercase">Daily Streak</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-[#E5E5E5] text-sm font-bold">{MOCK_USER.streak} DAYS</div>
                  <div className="text-[#666] text-xs">Keep it going!</div>
                </div>
              </div>
            </div>
            
            <div className="bg-[#1a1a1a] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-3 h-3 text-[#FF6B35]" />
                <span className="text-[#888] text-xs uppercase">Leaderboard</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF4500] flex items-center justify-center">
                  <Crown className="w-4 h-4 text-[#1a1a1a]" />
                </div>
                <div>
                  <div className="text-[#E5E5E5] text-sm font-bold">#{MOCK_USER.rank}</div>
                  <div className="text-[#666] text-xs">of {MOCK_USER.totalUsers.toLocaleString()} players</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// COMPONENTS
// ============================================

function StarRating({ count, max = 3, size = 'md' }: { count: number; max?: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
  return (
    <div className="flex gap-1">
      {[...Array(max)].map((_, i) => (
        <Star key={i} className={`${sizeClasses[size]} ${i < count ? 'text-[#FF6B35] fill-[#FF6B35]' : 'text-[#3a3a3a]'}`} />
      ))}
    </div>
  )
}

function QuestCard({ quest }: { quest: typeof DAILY_QUESTS[0] }) {
  const progress = (quest.progress / quest.total) * 100
  const Icon = quest.Icon
  return (
    <div className={`p-3 rounded-xl border-2 transition-all ${quest.completed ? 'bg-[#22C55E]/10 border-[#22C55E]/50' : 'bg-[#1a1a1a] border-[#3a3a3a]'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${quest.completed ? 'bg-[#22C55E]/20' : 'bg-[#2a2a2a]'}`}>
          {quest.completed ? <Check className="w-4 h-4 text-[#22C55E]" /> : <Icon className="w-4 h-4 text-[#FF6B35]" />}
        </div>
        <div className="flex-1">
          <div className={`font-bold text-xs ${quest.completed ? 'text-[#22C55E]' : 'text-white'}`}>{quest.name}</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${quest.completed ? 'bg-[#22C55E]' : 'bg-[#FF6B35]'}`} style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[9px] text-[#888888] font-bold">{quest.progress}/{quest.total}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[#FF6B35] font-black text-xs">+{quest.xp}</div>
          <div className="text-[8px] text-[#888888]">XP</div>
        </div>
      </div>
    </div>
  )
}

function LessonNode({ lesson, onClick }: { lesson: typeof LESSONS[0]; onClick: () => void }) {
  const isLocked = lesson.locked
  const isCompleted = lesson.completed
  const isCurrent = lesson.current
  const Icon = lesson.Icon
  
  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className="relative group p-1"
    >
      {/* Outer glow ring for completed/current */}
      {(isCompleted || isCurrent) && (
        <div className={`absolute inset-1 rounded-full blur-md opacity-50 ${
          isCompleted ? 'bg-[#22C55E]' : 'bg-[#FF6B35]'
        }`} />
      )}
      
      {/* Main circle container */}
      <div className={`relative w-14 h-14 lg:w-16 lg:h-16 rounded-full transition-all duration-300 ${
        !isLocked && 'group-hover:scale-110'
      }`}>
        
        {/* Outer ring */}
        <div className={`absolute inset-0 rounded-full ${
          isLocked 
            ? 'bg-[#2a2a2a]' 
            : isCompleted 
              ? 'bg-gradient-to-br from-[#22C55E] via-[#16A34A] to-[#15803D] shadow-lg shadow-[#22C55E]/40'
              : isCurrent 
                ? 'bg-gradient-to-br from-[#FF6B35] via-[#E55A2B] to-[#DC2626] shadow-lg shadow-[#FF6B35]/40'
                : 'bg-gradient-to-br from-[#3a3a3a] to-[#2a2a2a]'
        }`} />
        
        {/* Inner circle (creates depth) */}
        <div className={`absolute inset-[3px] rounded-full ${
          isLocked 
            ? 'bg-[#1a1a1a]' 
            : isCompleted 
              ? 'bg-gradient-to-br from-[#22C55E]/90 to-[#16A34A]'
              : isCurrent 
                ? 'bg-gradient-to-br from-[#FF6B35]/90 to-[#E55A2B]'
                : 'bg-[#1a1a1a]'
        }`} />
        
        {/* Icon container with highlight */}
        <div className={`absolute inset-[6px] rounded-full flex items-center justify-center ${
          isLocked 
            ? 'bg-[#2a2a2a]' 
            : isCompleted 
              ? 'bg-gradient-to-br from-[#4ADE80] via-[#22C55E] to-[#16A34A]'
              : isCurrent 
                ? 'bg-gradient-to-br from-[#FF8C5A] via-[#FF6B35] to-[#E55A2B]'
                : 'bg-gradient-to-br from-[#3a3a3a] to-[#2a2a2a] border border-[#4a4a4a]'
        }`}>
          {/* Top highlight shine effect */}
          {!isLocked && (
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-white/20 rounded-full blur-sm" />
          )}
          
          {/* Icon */}
          {isLocked ? (
            <Lock className="w-5 h-5 lg:w-6 lg:h-6 text-[#555] relative z-10" strokeWidth={2.5} />
          ) : (
            <Icon className={`w-6 h-6 lg:w-7 lg:h-7 relative z-10 drop-shadow-lg ${
              isCompleted || isCurrent ? 'text-white' : 'text-[#888]'
            }`} strokeWidth={2} />
          )}
        </div>
        
        {/* Completed checkmark badge */}
        {isCompleted && (
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#E55A2B] flex items-center justify-center shadow-md border-2 border-[#1a1a1a]">
            <Check className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-white" strokeWidth={3} />
          </div>
        )}
        
        {/* Current "GO!" badge */}
        {isCurrent && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2">
            <div className="px-2 py-0.5 bg-gradient-to-r from-[#FF6B35] to-[#E55A2B] rounded-full text-[8px] font-black text-white shadow-lg border border-[#FF8C5A]/50 tracking-wide">
              GO!
            </div>
          </div>
        )}
      </div>
    </button>
  )
}

// ============================================
// SKILL TREE MODAL - Animated SVG Tree
// ============================================

// All 24 skills across 10 tree levels
// Skills are organized by difficulty - earlier skills are easier
const ALL_TREE_SKILLS = [
  // Level 1: Seedling (4 skills) - Basic Fundamentals
  { id: 1, name: 'Ready Stance', Icon: CircleDot, level: 1, category: 'Basics' },
  { id: 2, name: 'Ball Grip', Icon: Hand, level: 1, category: 'Basics' },
  { id: 3, name: 'Eyes Up', Icon: Eye, level: 1, category: 'Basics' },
  { id: 4, name: 'Balance', Icon: Scale, level: 1, category: 'Basics' },
  
  // Level 2: Sprout (2 more = 6 total) - Form Basics
  { id: 5, name: 'Elbow In', Icon: Activity, level: 2, category: 'Form' },
  { id: 6, name: 'Knee Bend', Icon: Zap, level: 2, category: 'Form' },
  
  // Level 3: Sapling (2 more = 8 total) - Alignment
  { id: 7, name: 'Shoulder Align', Icon: Target, level: 3, category: 'Form' },
  { id: 8, name: 'Hip Square', Icon: Target, level: 3, category: 'Form' },
  
  // Level 4: Birch (2 more = 10 total) - Release
  { id: 9, name: 'Wrist Flick', Icon: Hand, level: 4, category: 'Release' },
  { id: 10, name: 'Follow Through', Icon: Zap, level: 4, category: 'Release' },
  
  // Level 5: Maple (2 more = 12 total) - Power
  { id: 11, name: 'Leg Drive', Icon: Dumbbell, level: 5, category: 'Power' },
  { id: 12, name: 'Core Power', Icon: Dumbbell, level: 5, category: 'Power' },
  
  // Level 6: Oak (2 more = 14 total) - Arc & Trajectory
  { id: 13, name: 'Arc Height', Icon: Rainbow, level: 6, category: 'Arc' },
  { id: 14, name: 'Backspin', Icon: Repeat, level: 6, category: 'Arc' },
  
  // Level 7: Sequoia (2 more = 16 total) - Consistency
  { id: 15, name: 'Rhythm', Icon: Activity, level: 7, category: 'Consistency' },
  { id: 16, name: 'Timing', Icon: Clock, level: 7, category: 'Consistency' },
  
  // Level 8: Redwood (2 more = 18 total) - Mental
  { id: 17, name: 'Focus', Icon: Eye, level: 8, category: 'Mental' },
  { id: 18, name: 'Confidence', Icon: Star, level: 8, category: 'Mental' },
  
  // Level 9: Ancient Oak (2 more = 20 total) - Advanced
  { id: 19, name: 'Fadeaway', Icon: Zap, level: 9, category: 'Advanced' },
  { id: 20, name: 'Step Back', Icon: ChevronLeft, level: 9, category: 'Advanced' },
  
  // Level 10: World Tree (4 more = 24 total) - Mastery
  { id: 21, name: 'Clutch Shot', Icon: Trophy, level: 10, category: 'Mastery' },
  { id: 22, name: 'Range Master', Icon: Target, level: 10, category: 'Mastery' },
  { id: 23, name: 'Quick Release', Icon: Zap, level: 10, category: 'Mastery' },
  { id: 24, name: 'Perfect Form', Icon: Crown, level: 10, category: 'Mastery' },
]

// Helper function to get skills for a specific tree level
function getSkillsForTreeLevel(treeLevel: number, completedSkillIds: number[]) {
  const tree = TREE_TYPES.find(t => t.level === treeLevel)
  if (!tree) return []
  
  // Get skills up to this tree's skill count
  return ALL_TREE_SKILLS.slice(0, tree.skillCount).map((skill, index) => {
    const isCompleted = completedSkillIds.includes(skill.id)
    const lastCompletedIndex = completedSkillIds.length > 0 
      ? Math.max(...completedSkillIds.map(id => ALL_TREE_SKILLS.findIndex(s => s.id === id)))
      : -1
    const isCurrent = index === lastCompletedIndex + 1
    const isLocked = index > lastCompletedIndex + 1
    
    return {
      ...skill,
      completed: isCompleted,
      current: isCurrent,
      locked: isLocked,
    }
  })
}

// Helper to determine which tree level based on completed skills
function getTreeLevelFromProgress(completedCount: number): number {
  if (completedCount >= 24) return 10 // World Tree
  if (completedCount >= 20) return 9  // Ancient Oak
  if (completedCount >= 18) return 8  // Redwood
  if (completedCount >= 16) return 7  // Sequoia
  if (completedCount >= 14) return 6  // Oak
  if (completedCount >= 12) return 5  // Maple
  if (completedCount >= 10) return 4  // Birch
  if (completedCount >= 8) return 3   // Sapling
  if (completedCount >= 6) return 2   // Sprout
  return 1 // Seedling
}

// Skill node component for the tree - using SVG native transform
function TreeSkillNode({ 
  skill, 
  x, 
  y, 
  delay = 0,
  onClick
}: { 
  skill: { id: number; name: string; Icon: React.ElementType; completed?: boolean; current?: boolean; locked?: boolean }
  x: number
  y: number
  delay?: number
  onClick?: () => void
}) {
  const SkillIcon = skill.Icon
  const isCompleted = skill.completed
  const isCurrent = skill.current
  const isLocked = skill.locked
  
  return (
    <g 
      transform={`translate(${x}, ${y})`}
      className="cursor-pointer"
      onClick={onClick}
    >
      {/* Glow effect for completed/current */}
      {(isCompleted || isCurrent) && (
        <circle
          cx="0"
          cy="0"
          r="32"
          fill={isCompleted ? '#22C55E' : '#FF6B35'}
          opacity="0.5"
        >
          <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" />
          <animate attributeName="r" values="30;35;30" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
      
      {/* Hanging string from branch */}
      <line
        x1="0"
        y1="-40"
        x2="0"
        y2="-26"
        stroke="#8B6914"
        strokeWidth="3"
        strokeLinecap="round"
      />
      
      {/* Outer circle (border) - LARGER SIZE */}
      <circle
        cx="0"
        cy="0"
        r="24"
        fill={
          isCompleted ? 'url(#greenGradient)' 
          : isCurrent ? 'url(#orangeGradient)' 
          : isLocked ? '#1a2a1a'
          : '#2a3a2a'
        }
        stroke={
          isCompleted ? '#4ADE80' 
          : isCurrent ? '#FF8C5A' 
          : '#3a4a3a'
        }
        strokeWidth="4"
      />
      
      {/* Inner highlight (shine effect) */}
      <ellipse
        cx="0"
        cy="-10"
        rx="14"
        ry="7"
        fill="white"
        opacity={isLocked ? 0.05 : 0.3}
      />
      
      {/* Icon - using foreignObject for Lucide icons - LARGER */}
      <foreignObject x="-14" y="-14" width="28" height="28">
        <div className="w-full h-full flex items-center justify-center">
          {isLocked ? (
            <Lock className="w-5 h-5 text-[#4a5a4a]" />
          ) : (
            <SkillIcon className={`w-6 h-6 ${
              isCompleted ? 'text-white' : isCurrent ? 'text-white' : 'text-[#6B8E6B]'
            }`} />
          )}
        </div>
      </foreignObject>
      
      {/* Completed checkmark badge */}
      {isCompleted && (
        <g transform="translate(16, -16)">
          <circle cx="0" cy="0" r="10" fill="#FF6B35" stroke="#1a1a1a" strokeWidth="2" />
          <foreignObject x="-7" y="-7" width="14" height="14">
            <div className="w-full h-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" strokeWidth={3} />
            </div>
          </foreignObject>
        </g>
      )}
      
      {/* Current GO! badge */}
      {isCurrent && (
        <g transform="translate(0, -42)">
          <rect x="-18" y="-11" width="36" height="20" rx="10" fill="#FF6B35" stroke="#FF8C5A" strokeWidth="2" />
          <text x="0" y="4" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">GO!</text>
        </g>
      )}
      
      {/* Skill name label below */}
      <text
        x="0"
        y="38"
        textAnchor="middle"
        fill={isCompleted ? '#4ADE80' : isCurrent ? '#FF8C5A' : '#6B8E6B'}
        fontSize="10"
        fontWeight="bold"
      >
        {skill.name.length > 10 ? skill.name.slice(0, 8) + '..' : skill.name}
      </text>
    </g>
  )
}

function SkillTreeModal({ isOpen, onClose, currentTreeLevel = 3, completedSkillIds = [1, 2, 3, 4, 5] }: { 
  isOpen: boolean
  onClose: () => void
  currentTreeLevel?: number
  completedSkillIds?: number[]
}) {
  const [animationStarted, setAnimationStarted] = useState(false)
  const [selectedTreeSkill, setSelectedTreeSkill] = useState<ReturnType<typeof getSkillsForTreeLevel>[0] | null>(null)
  const [previewLevel, setPreviewLevel] = useState(currentTreeLevel) // For previewing different trees
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  
  React.useEffect(() => {
    if (isOpen) {
      setAnimationStarted(false)
      setSelectedTreeSkill(null)
      setPreviewLevel(currentTreeLevel)
      setIsPreviewMode(false)
      const timer = setTimeout(() => setAnimationStarted(true), 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen, currentTreeLevel])
  
  if (!isOpen) return null
  
  // Use preview level if in preview mode, otherwise use current level
  const displayLevel = isPreviewMode ? previewLevel : currentTreeLevel
  
  // Get current tree type based on level
  const currentTree = TREE_TYPES.find(t => t.level === displayLevel) || TREE_TYPES[0]
  const nextTree = TREE_TYPES[Math.min(displayLevel, TREE_TYPES.length - 1)]
  
  // For preview mode, show all skills as completed up to a certain point
  const previewCompletedIds = isPreviewMode 
    ? ALL_TREE_SKILLS.slice(0, Math.floor(currentTree.skillCount * 0.6)).map(s => s.id) // Show 60% complete for preview
    : completedSkillIds
  
  // Get skills for this tree level with completion status
  const treeSkills = getSkillsForTreeLevel(displayLevel, previewCompletedIds)
  const completedCount = treeSkills.filter(s => s.completed).length
  const totalSkillsForTree = treeSkills.length
  const progressToNext = (completedCount / totalSkillsForTree) * 100
  
  // Tree dimensions
  const treeWidth = 500
  const treeHeight = 450
  const centerX = treeWidth / 2
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes drawBranch {
          from { stroke-dashoffset: 200; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes skillAppear {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .skill-node {
          animation: skillAppear 0.4s ease-out forwards;
        }
        @keyframes sway {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
        @keyframes leafRustle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes trunkGrow {
          from { transform: scaleY(0); transform-origin: bottom; }
          to { transform: scaleY(1); transform-origin: bottom; }
        }
      `}</style>
      
      <div className="w-full max-w-2xl max-h-[90vh] bg-gradient-to-b from-[#0a1a0a] to-[#050505] rounded-2xl overflow-hidden border border-[#2a3a2a] flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-[#2a3a2a] bg-gradient-to-r from-[#1a2a1a] to-[#0a1a0a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                currentTree.level === 10 
                  ? 'bg-gradient-to-br from-[#FFD700] to-[#FFA500] shadow-[#FFD700]/30'
                  : 'bg-gradient-to-br from-[#22C55E] to-[#16A34A] shadow-[#22C55E]/30'
              }`}>
                <currentTree.Icon className={`w-6 h-6 ${currentTree.level === 10 ? 'text-[#1a1a1a]' : 'text-white'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className={`font-black text-lg uppercase tracking-wide ${
                    currentTree.level === 10 ? 'text-[#FFD700]' : 'text-white'
                  }`}>{currentTree.name} Tree</h2>
                  {isPreviewMode && (
                    <span className="text-[10px] bg-[#FF6B35] text-white px-2 py-0.5 rounded-full font-bold">PREVIEW</span>
                  )}
                </div>
                <p className="text-[#6B8E6B] text-xs">{currentTree.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Preview Mode Toggle */}
              <button 
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isPreviewMode 
                    ? 'bg-[#FF6B35] text-white' 
                    : 'bg-[#2a3a2a] text-[#6B8E6B] hover:text-white hover:bg-[#3a4a3a]'
                }`}
              >
                {isPreviewMode ? 'Exit Preview' : 'Preview Trees'}
              </button>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-[#2a3a2a] flex items-center justify-center text-[#6B8E6B] hover:text-white hover:bg-[#3a4a3a] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Tree Level Selector (only in preview mode) */}
          {isPreviewMode && (
            <div className="mt-4 p-3 bg-[#0a1a0a] rounded-xl border border-[#2a3a2a]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#6B8E6B] text-xs font-bold uppercase">Select Tree to Preview</span>
                <span className="text-[#FF6B35] text-xs font-bold">Level {previewLevel}/10</span>
              </div>
              <div className="flex gap-1 overflow-x-auto pb-1">
                {TREE_TYPES.map((tree) => {
                  const TreeIcon = tree.Icon
                  const isSelected = tree.level === previewLevel
                  const isWorldTree = tree.level === 10
                  return (
                    <button
                      key={tree.level}
                      onClick={() => setPreviewLevel(tree.level)}
                      className={`flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                        isSelected 
                          ? isWorldTree 
                            ? 'bg-[#FFD700]/20 border-2 border-[#FFD700]' 
                            : 'bg-[#22C55E]/20 border-2 border-[#22C55E]'
                          : 'bg-[#1a2a1a] border-2 border-transparent hover:border-[#3a4a3a]'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isSelected 
                          ? isWorldTree 
                            ? 'bg-gradient-to-br from-[#FFD700] to-[#FFA500]' 
                            : 'bg-gradient-to-br from-[#22C55E] to-[#16A34A]'
                          : 'bg-[#2a3a2a]'
                      }`}>
                        <TreeIcon className={`w-4 h-4 ${
                          isSelected 
                            ? isWorldTree ? 'text-[#1a1a1a]' : 'text-white' 
                            : 'text-[#6B8E6B]'
                        }`} />
                      </div>
                      <span className={`text-[9px] font-bold ${
                        isSelected 
                          ? isWorldTree ? 'text-[#FFD700]' : 'text-[#22C55E]' 
                          : 'text-[#6B8E6B]'
                      }`}>{tree.level}</span>
                    </button>
                  )
                })}
              </div>
              <div className="mt-2 text-center">
                <span className="text-[#888] text-[10px]">{currentTree.skillCount} skills in this tree</span>
              </div>
            </div>
          )}
          
          {/* Progress to next tree (hide in preview mode) */}
          {!isPreviewMode && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#6B8E6B]">
                  {displayLevel < 10 
                    ? <>Progress to <span className="text-[#FF6B35] font-bold">{nextTree.name}</span></>
                    : <span className="text-[#FFD700] font-bold">MAX LEVEL REACHED!</span>
                  }
                </span>
                <span className="text-[#22C55E] font-bold">{completedCount}/{totalSkillsForTree} skills</span>
              </div>
              <div className="h-2 bg-[#1a2a1a] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#22C55E] to-[#4ADE80] rounded-full transition-all duration-500"
                  style={{ width: `${progressToNext}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Animated SVG Tree */}
        <div className="flex-1 overflow-y-auto flex items-center justify-center p-4">
          <svg 
            viewBox={`0 0 ${treeWidth} ${treeHeight}`}
            className="w-full max-w-lg"
            style={{ filter: 'drop-shadow(0 0 20px rgba(34, 197, 94, 0.2))' }}
          >
            {/* Gradient Definitions */}
            <defs>
              <linearGradient id="trunkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#5D4037" />
                <stop offset="30%" stopColor="#8B6914" />
                <stop offset="70%" stopColor="#8B6914" />
                <stop offset="100%" stopColor="#5D4037" />
              </linearGradient>
              <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4ADE80" />
                <stop offset="100%" stopColor="#16A34A" />
              </linearGradient>
              <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FF8C5A" />
                <stop offset="100%" stopColor="#E55A2B" />
              </linearGradient>
              <linearGradient id="leafGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4ADE80" />
                <stop offset="50%" stopColor="#22C55E" />
                <stop offset="100%" stopColor="#16A34A" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Ground/grass */}
            <ellipse cx={centerX} cy="430" rx="200" ry="20" fill="#1a3a1a" />
            <ellipse cx={centerX} cy="425" rx="180" ry="15" fill="#2a4a2a" />
            
            {/* Tree Trunk */}
            <g style={{ animation: animationStarted ? 'trunkGrow 0.8s ease-out forwards' : 'none' }}>
              <path
                d={`M${centerX - 20} 420 
                    Q${centerX - 25} 350 ${centerX - 15} 280
                    Q${centerX - 10} 220 ${centerX} 180
                    Q${centerX + 10} 220 ${centerX + 15} 280
                    Q${centerX + 25} 350 ${centerX + 20} 420
                    Z`}
                fill="url(#trunkGradient)"
              />
              {/* Trunk texture lines */}
              <path d={`M${centerX - 5} 400 Q${centerX - 8} 350 ${centerX - 3} 300`} stroke="#5D4037" strokeWidth="2" fill="none" opacity="0.5" />
              <path d={`M${centerX + 8} 380 Q${centerX + 5} 320 ${centerX + 10} 260`} stroke="#5D4037" strokeWidth="2" fill="none" opacity="0.5" />
            </g>
            
            {/* Main Branches */}
            {animationStarted && (
              <g>
                {/* Left branches */}
                <path
                  d={`M${centerX - 10} 280 Q${centerX - 80} 260 ${centerX - 140} 200`}
                  stroke="#8B6914"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  style={{ 
                    strokeDasharray: 200,
                    animation: 'drawBranch 0.6s ease-out 0.3s forwards'
                  }}
                />
                <path
                  d={`M${centerX - 5} 240 Q${centerX - 60} 220 ${centerX - 100} 140`}
                  stroke="#8B6914"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  style={{ 
                    strokeDasharray: 200,
                    animation: 'drawBranch 0.6s ease-out 0.5s forwards'
                  }}
                />
                <path
                  d={`M${centerX} 200 Q${centerX - 40} 160 ${centerX - 70} 80`}
                  stroke="#8B6914"
                  strokeWidth="5"
                  fill="none"
                  strokeLinecap="round"
                  style={{ 
                    strokeDasharray: 200,
                    animation: 'drawBranch 0.6s ease-out 0.7s forwards'
                  }}
                />
                
                {/* Right branches */}
                <path
                  d={`M${centerX + 10} 280 Q${centerX + 80} 260 ${centerX + 140} 200`}
                  stroke="#8B6914"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  style={{ 
                    strokeDasharray: 200,
                    animation: 'drawBranch 0.6s ease-out 0.4s forwards'
                  }}
                />
                <path
                  d={`M${centerX + 5} 240 Q${centerX + 60} 220 ${centerX + 100} 140`}
                  stroke="#8B6914"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  style={{ 
                    strokeDasharray: 200,
                    animation: 'drawBranch 0.6s ease-out 0.6s forwards'
                  }}
                />
                <path
                  d={`M${centerX} 200 Q${centerX + 40} 160 ${centerX + 70} 80`}
                  stroke="#8B6914"
                  strokeWidth="5"
                  fill="none"
                  strokeLinecap="round"
                  style={{ 
                    strokeDasharray: 200,
                    animation: 'drawBranch 0.6s ease-out 0.8s forwards'
                  }}
                />
                
                {/* Top branch */}
                <path
                  d={`M${centerX} 180 Q${centerX} 120 ${centerX} 60`}
                  stroke="#8B6914"
                  strokeWidth="5"
                  fill="none"
                  strokeLinecap="round"
                  style={{ 
                    strokeDasharray: 200,
                    animation: 'drawBranch 0.6s ease-out 0.9s forwards'
                  }}
                />
              </g>
            )}
            
            {/* Leaf clusters (foliage) - semi-transparent to show skill nodes */}
            {animationStarted && (
              <g style={{ animation: 'leafRustle 4s ease-in-out infinite' }}>
                {/* Large leaf clusters - reduced opacity to show skills */}
                <ellipse cx={centerX - 120} cy="180" rx="45" ry="35" fill="url(#leafGradient)" opacity="0.5" />
                <ellipse cx={centerX + 120} cy="180" rx="45" ry="35" fill="url(#leafGradient)" opacity="0.5" />
                <ellipse cx={centerX - 80} cy="120" rx="40" ry="30" fill="url(#leafGradient)" opacity="0.5" />
                <ellipse cx={centerX + 80} cy="120" rx="40" ry="30" fill="url(#leafGradient)" opacity="0.5" />
                <ellipse cx={centerX - 45} cy="70" rx="35" ry="25" fill="url(#leafGradient)" opacity="0.5" />
                <ellipse cx={centerX + 45} cy="70" rx="35" ry="25" fill="url(#leafGradient)" opacity="0.5" />
                <ellipse cx={centerX} cy="45" rx="40" ry="30" fill="url(#leafGradient)" opacity="0.5" />
                
                {/* Smaller accent leaves */}
                <circle cx={centerX - 150} cy="210" r="15" fill="#4ADE80" opacity="0.4" />
                <circle cx={centerX + 150} cy="210" r="15" fill="#4ADE80" opacity="0.4" />
              </g>
            )}
            
            {/* Skill Nodes hanging from tree branches - Dynamic based on tree level */}
            <g>
              {treeSkills.map((skill, index) => {
                // Calculate position based on skill index and total skills
                const totalSkills = treeSkills.length
                const rowSize = 2 // Skills per row
                const row = Math.floor(index / rowSize)
                const col = index % rowSize
                const totalRows = Math.ceil(totalSkills / rowSize)
                
                // Y position: distribute from bottom (220) to top (40)
                const yStart = 220
                const yEnd = 40
                const yStep = (yStart - yEnd) / Math.max(totalRows - 1, 1)
                const y = yStart - (row * yStep)
                
                // X position: alternate left/right, narrower as we go up
                const baseSpread = 140 - (row * 15) // Narrower at top
                const x = col === 0 
                  ? centerX - Math.max(baseSpread, 25)
                  : centerX + Math.max(baseSpread, 25)
                
                return (
                  <TreeSkillNode 
                    key={skill.id}
                    skill={skill} 
                    x={x} 
                    y={y} 
                    delay={0.5 + (index * 0.1)} 
                    onClick={() => setSelectedTreeSkill(skill)} 
                  />
                )
              })}
            </g>
            
            {/* Legend */}
            <g transform={`translate(${treeWidth - 90}, 380)`}>
              <rect x="-5" y="-5" width="90" height="70" rx="8" fill="#0a1a0a" stroke="#2a3a2a" strokeWidth="1" opacity="0.9" />
              <text x="40" y="10" textAnchor="middle" fill="#6B8E6B" fontSize="8" fontWeight="bold">LEGEND</text>
              
              <circle cx="12" cy="25" r="6" fill="url(#greenGradient)" />
              <text x="24" y="28" fill="#4ADE80" fontSize="7">Complete</text>
              
              <circle cx="12" cy="40" r="6" fill="url(#orangeGradient)" />
              <text x="24" y="43" fill="#FF8C5A" fontSize="7">Current</text>
              
              <circle cx="12" cy="55" r="6" fill="#1a2a1a" stroke="#3a4a3a" strokeWidth="1" />
              <text x="24" y="58" fill="#6B8E6B" fontSize="7">Locked</text>
            </g>
          </svg>
          
          {/* Skill count indicator */}
          <div className="text-center mt-2">
            <span className="text-[#4ADE80] font-bold">{completedCount}</span>
            <span className="text-[#6B8E6B]"> / {totalSkillsForTree} skills mastered</span>
          </div>
        </div>
        
        {/* Selected Skill Popup */}
        {selectedTreeSkill && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
            <div className="bg-[#1a2a1a] rounded-xl border border-[#3a4a3a] p-4 max-w-xs mx-4 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedTreeSkill.completed ? 'bg-gradient-to-br from-[#22C55E] to-[#16A34A]'
                    : selectedTreeSkill.current ? 'bg-gradient-to-br from-[#FF6B35] to-[#E55A2B]'
                    : 'bg-[#2a3a2a]'
                  }`}>
                    <selectedTreeSkill.Icon className={`w-5 h-5 ${
                      selectedTreeSkill.completed || selectedTreeSkill.current ? 'text-white' : 'text-[#6B8E6B]'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">{selectedTreeSkill.name}</h3>
                    <span className={`text-xs font-bold ${
                      selectedTreeSkill.completed ? 'text-[#22C55E]' 
                      : selectedTreeSkill.current ? 'text-[#FF6B35]' 
                      : 'text-[#6B8E6B]'
                    }`}>
                      {selectedTreeSkill.completed ? 'COMPLETED' : selectedTreeSkill.current ? 'IN PROGRESS' : 'LOCKED'}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTreeSkill(null)}
                  className="w-8 h-8 rounded-full bg-[#2a3a2a] flex items-center justify-center text-[#6B8E6B] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <p className="text-[#6B8E6B] text-xs mb-3">
                {selectedTreeSkill.completed 
                  ? "Great job! You've mastered this skill. Keep practicing to maintain it!"
                  : selectedTreeSkill.current
                    ? "You're working on this skill. Complete practice sessions to master it!"
                    : "Complete the previous skills to unlock this one."
                }
              </p>
              
              {selectedTreeSkill.current && (
                <button className="w-full py-2 bg-gradient-to-r from-[#FF6B35] to-[#E55A2B] rounded-lg text-white font-bold text-sm">
                  Practice Now
                </button>
              )}
              
              {selectedTreeSkill.completed && (
                <div className="flex items-center justify-center gap-1 text-[#22C55E]">
                  <Check className="w-4 h-4" />
                  <span className="text-xs font-bold">Skill Mastered!</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Footer - Tree Type Progression (All 10 Levels) */}
        <div className="p-3 border-t border-[#2a3a2a] bg-gradient-to-r from-[#1a2a1a] to-[#0a1a0a]">
          <div className="text-center mb-2">
            <span className="text-[#6B8E6B] text-[10px] uppercase tracking-wider">Your Tree Growth Journey - Level {currentTreeLevel}/10</span>
          </div>
          <div className="flex items-center justify-center gap-1 overflow-x-auto pb-2 px-2">
            {TREE_TYPES.map((tree, index) => {
              const isCurrent = tree.level === currentTreeLevel
              const isPast = tree.level < currentTreeLevel
              const TreeIcon = tree.Icon
              const isWorldTree = tree.level === 10
              
              return (
                <div key={tree.name} className="flex items-center">
                  <div className={`flex flex-col items-center gap-0.5 px-1 py-1 rounded-lg transition-all ${
                    isCurrent ? 'bg-[#22C55E]/20 scale-110' : ''
                  } ${isWorldTree && isCurrent ? 'bg-[#FFD700]/20' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                      isPast 
                        ? 'bg-[#22C55E]' 
                        : isCurrent 
                          ? isWorldTree 
                            ? 'bg-gradient-to-br from-[#FFD700] to-[#FFA500] ring-2 ring-[#FFD700] ring-offset-1 ring-offset-[#0a1a0a]'
                            : 'bg-gradient-to-br from-[#22C55E] to-[#16A34A] ring-2 ring-[#22C55E] ring-offset-1 ring-offset-[#0a1a0a]'
                          : 'bg-[#2a3a2a]'
                    }`}>
                      {isPast ? (
                        <Check className="w-3 h-3 text-white" />
                      ) : (
                        <TreeIcon className={`w-3 h-3 ${
                          isCurrent 
                            ? isWorldTree ? 'text-[#1a1a1a]' : 'text-white' 
                            : 'text-[#4a5a4a]'
                        }`} />
                      )}
                    </div>
                    <span className={`text-[7px] font-bold whitespace-nowrap ${
                      isCurrent 
                        ? isWorldTree ? 'text-[#FFD700]' : 'text-[#22C55E]' 
                        : isPast ? 'text-[#22C55E]/70' : 'text-[#4a5a4a]'
                    }`}>
                      {tree.level}
                    </span>
                  </div>
                  
                  {/* Connector line */}
                  {index < TREE_TYPES.length - 1 && (
                    <div className={`w-2 h-0.5 ${isPast ? 'bg-[#22C55E]' : 'bg-[#2a3a2a]'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN DASHBOARD - MATCHING PRO LAYOUT
// ============================================

export default function BasicDashboard() {
  const [selectedLesson, setSelectedLesson] = useState<typeof LESSONS[0] | null>(null)
  const [activeMode, setActiveMode] = useState<'video' | 'image' | 'live'>('image')
  const [showSkillTree, setShowSkillTree] = useState(false)
  
  const completedLessons = LESSONS.filter(l => l.completed).length

  return (
    <div className="min-h-screen bg-[#050505] pb-24">
      <main className="min-h-[calc(100vh-200px)] py-6 lg:py-8 px-4 bg-[#050505]">
        <div className="container mx-auto max-w-5xl">
          
          {/* Collapsible Stats Card (Top Bar - Like Pro) */}
          <CollapsibleStatsCard />
          
          {/* Main Content Card (Like Pro Dashboard) */}
          <div className="mt-4">
            <div className="bg-[#2C2C2C] rounded-lg overflow-hidden shadow-lg">
              
              {/* Tab Navigation - VIDEO | IMAGE | LIVE (Like Pro) */}
              <div className="hidden md:block p-4 border-b border-[#3a3a3a]">
                <div className="flex items-center justify-center">
                  <div className="inline-flex rounded-lg bg-[#1a1a1a] p-1">
                    {(['video', 'image', 'live'] as const).map((mode) => (
                      <button 
                        key={mode} 
                        onClick={() => setActiveMode(mode)}
                        className={`relative px-6 py-2 rounded-md flex items-center justify-center gap-2 transition-colors uppercase font-bold text-sm tracking-wider ${
                          activeMode === mode 
                            ? "bg-[#FF6B35] text-[#111827]" 
                            : "text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#374151]"
                        }`}
                      >
                        {mode === "video" && <Video className="w-4 h-4" />}
                        {mode === "image" && <ImageIcon className="w-4 h-4" />}
                        {mode === "live" && <Radio className="w-4 h-4" />}
                        <span>{mode}</span>
                        {mode === "live" && (
                          <span className={`absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                            activeMode === "live" ? "bg-white text-[#FF6B35]" : "bg-[#FF6B35] text-white"
                          }`}>NEW</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Two Column Layout (Like Pro Dashboard) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                
                {/* ============================================ */}
                {/* LEFT COLUMN - Upload & Lessons */}
                {/* ============================================ */}
                <div className="space-y-6">
                  
                  {/* Fun Kid-Friendly Upload Area */}
                  <div className="relative bg-gradient-to-br from-[#1a2a1a] via-[#0a1a0a] to-[#1a1a2a] rounded-2xl border-2 border-dashed border-[#FF6B35]/50 p-6 lg:p-8 overflow-hidden group hover:border-[#FF6B35] transition-all duration-300">
                    {/* Animated background sparkles */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <div className="absolute top-4 left-8 w-2 h-2 bg-[#FFD700] rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                      <div className="absolute top-12 right-12 w-1.5 h-1.5 bg-[#FF6B35] rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
                      <div className="absolute bottom-8 left-16 w-2 h-2 bg-[#4ADE80] rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                      <div className="absolute bottom-16 right-8 w-1.5 h-1.5 bg-[#FFD700] rounded-full animate-ping" style={{ animationDuration: '2.2s', animationDelay: '0.3s' }} />
                    </div>
                    
                    <div className="relative text-center">
                      {/* Animated Basketball Player Shooting */}
                      <div className="relative w-28 h-28 mx-auto mb-3">
                        {/* SVG Animated Player */}
                        <svg viewBox="0 -5 120 125" className="w-full h-full">
                          {/* Embedded styles for animations */}
                          <style>
                            {`
                              @keyframes playerShoot {
                                0%, 100% { transform: translateY(0) rotate(0deg); }
                                25% { transform: translateY(-8px) rotate(-2deg); }
                                50% { transform: translateY(-15px) rotate(0deg); }
                                75% { transform: translateY(-8px) rotate(2deg); }
                              }
                              @keyframes ballFly {
                                0%, 40% { transform: translate(0, 0) scale(1); opacity: 1; }
                                60% { transform: translate(15px, -25px) scale(0.85); opacity: 1; }
                                80% { transform: translate(35px, -35px) scale(0.7); opacity: 0.8; }
                                100% { transform: translate(50px, -20px) scale(0.5); opacity: 0; }
                              }
                              @keyframes armShoot {
                                0%, 100% { transform: rotate(0deg) translateY(0); }
                                30% { transform: rotate(-5deg) translateY(2px); }
                                50% { transform: rotate(8deg) translateY(-3px); }
                                70% { transform: rotate(5deg) translateY(-1px); }
                              }
                              .upload-player-body { animation: playerShoot 2s ease-in-out infinite; }
                              .upload-shooting-arm { animation: armShoot 2s ease-in-out infinite; transform-origin: 72px 48px; }
                              .upload-flying-ball { animation: ballFly 2s ease-out infinite; }
                            `}
                          </style>
                          
                          {/* Glow effect behind player */}
                          <defs>
                            <radialGradient id="uploadPlayerGlow" cx="50%" cy="50%" r="50%">
                              <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#FF6B35" stopOpacity="0" />
                            </radialGradient>
                            <linearGradient id="uploadJerseyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#FF6B35" />
                              <stop offset="100%" stopColor="#E55A2B" />
                            </linearGradient>
                            <linearGradient id="uploadSkinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#D4A574" />
                              <stop offset="100%" stopColor="#C49A6C" />
                            </linearGradient>
                            <linearGradient id="uploadShortsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#1a1a1a" />
                              <stop offset="100%" stopColor="#0a0a0a" />
                            </linearGradient>
                          </defs>
                          
                          {/* Background glow */}
                          <circle cx="60" cy="65" r="50" fill="url(#uploadPlayerGlow)" />
                          
                          {/* Player body group with animation */}
                          <g className="upload-player-body">
                            {/* Shadow */}
                            <ellipse cx="60" cy="115" rx="20" ry="4" fill="#000" opacity="0.3" />
                            
                            {/* Left leg */}
                            <path d="M52 85 L48 105 L52 108 L56 105 L54 85" fill="url(#uploadShortsGradient)" />
                            {/* Right leg (bent for shooting) */}
                            <path d="M66 85 L72 100 L76 102 L74 98 L68 85" fill="url(#uploadShortsGradient)" />
                            
                            {/* Shoes */}
                            <ellipse cx="50" cy="108" rx="6" ry="3" fill="#FF6B35" />
                            <ellipse cx="75" cy="102" rx="6" ry="3" fill="#FF6B35" />
                            
                            {/* Shorts */}
                            <path d="M48 72 L72 72 L74 88 L66 88 L60 82 L54 88 L46 88 Z" fill="url(#uploadShortsGradient)" />
                            
                            {/* Body/Jersey */}
                            <path d="M48 45 L72 45 L74 72 L46 72 Z" fill="url(#uploadJerseyGradient)" />
                            {/* Jersey number */}
                            <text x="60" y="62" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">23</text>
                            
                            {/* === SHOOTING FORM: Ball above head, elbow at 90°, guide hand on side === */}
                            
                            {/* Right arm (SHOOTING ARM) - elbow bent 90°, forearm vertical, hand under ball */}
                            <g className="upload-shooting-arm">
                              {/* Upper arm - horizontal from shoulder */}
                              <path d="M70 48 Q75 46 78 42" stroke="url(#uploadSkinGradient)" strokeWidth="7" strokeLinecap="round" fill="none" />
                              {/* Forearm - vertical, elbow at 90 degrees */}
                              <path d="M78 42 L78 28 L76 18" stroke="url(#uploadSkinGradient)" strokeWidth="6" strokeLinecap="round" fill="none" />
                              {/* Shooting hand - under the ball, palm up */}
                              <ellipse cx="76" cy="16" rx="5" ry="3" fill="url(#uploadSkinGradient)" />
                            </g>
                            
                            {/* Left arm (GUIDE HAND) - on the side of the ball */}
                            {/* Upper arm from shoulder */}
                            <path d="M50 48 Q45 44 44 38" stroke="url(#uploadSkinGradient)" strokeWidth="6" strokeLinecap="round" fill="none" />
                            {/* Forearm angled to ball */}
                            <path d="M44 38 L50 26 L58 18" stroke="url(#uploadSkinGradient)" strokeWidth="5" strokeLinecap="round" fill="none" />
                            {/* Guide hand - on side of ball */}
                            <ellipse cx="60" cy="16" rx="4" ry="3" fill="url(#uploadSkinGradient)" />
                            
                            {/* Head */}
                            <circle cx="60" cy="36" r="12" fill="url(#uploadSkinGradient)" />
                            {/* Hair */}
                            <path d="M50 32 Q60 22 70 32 Q68 28 60 26 Q52 28 50 32" fill="#1a1a1a" />
                            {/* Face details */}
                            <circle cx="56" cy="35" r="1.5" fill="#1a1a1a" /> {/* Left eye */}
                            <circle cx="64" cy="35" r="1.5" fill="#1a1a1a" /> {/* Right eye */}
                            <path d="M57 40 Q60 42 63 40" stroke="#1a1a1a" strokeWidth="1" fill="none" /> {/* Smile */}
                          </g>
                          
                          {/* Basketball - held above head between both hands, then releases */}
                          <g className="upload-flying-ball">
                            {/* Ball positioned above head, between shooting hand and guide hand */}
                            <circle cx="68" cy="10" r="9" fill="#FF6B35" />
                            {/* Ball lines */}
                            <path d="M59 10 L77 10" stroke="#1a1a1a" strokeWidth="1" opacity="0.3" />
                            <path d="M68 1 L68 19" stroke="#1a1a1a" strokeWidth="1" opacity="0.3" />
                            <path d="M61 4 Q68 10 61 16" stroke="#1a1a1a" strokeWidth="1" opacity="0.3" fill="none" />
                            <path d="M75 4 Q68 10 75 16" stroke="#1a1a1a" strokeWidth="1" opacity="0.3" fill="none" />
                          </g>
                        </svg>
                        
                        {/* Camera badge */}
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-[#22C55E] to-[#16A34A] rounded-full flex items-center justify-center border-2 border-[#0a1a0a] shadow-lg z-10">
                          <Camera className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      
                      {/* Fun headline */}
                      <h3 className="text-2xl font-black mb-2">
                        <span className="text-[#FF6B35]">Show Me</span>{' '}
                        <span className="text-white">Your Shot!</span>
                      </h3>
                      
                      {/* Encouraging message */}
                      <p className="text-[#6B8E6B] text-sm mb-4 max-w-xs mx-auto">
                        Take a pic or video of your basketball shot and I&apos;ll help you become a superstar!
                      </p>
                      
                      {/* XP reward badge */}
                      <div className="inline-flex items-center gap-2 bg-[#FFD700]/20 border border-[#FFD700]/30 rounded-full px-4 py-1.5 mb-5">
                        <Star className="w-4 h-4 text-[#FFD700] fill-[#FFD700]" />
                        <span className="text-[#FFD700] text-sm font-bold">Earn +50 XP!</span>
                        <Sparkles className="w-4 h-4 text-[#FFD700]" />
                      </div>
                      
                      {/* Big fun upload button */}
                      <Link href="/?mode=image">
                        <button className="group/btn relative w-full max-w-xs mx-auto flex items-center justify-center gap-3 bg-gradient-to-r from-[#FF6B35] via-[#FF4500] to-[#FF6B35] hover:from-[#FF8C5A] hover:via-[#FF6B35] hover:to-[#FF8C5A] text-white font-black text-lg px-8 py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-[#FF6B35]/30 hover:shadow-[#FF6B35]/50 hover:scale-105 overflow-hidden">
                          {/* Shimmer effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                          <Upload className="w-6 h-6" />
                          <span>Let&apos;s Go!</span>
                          <Rocket className="w-5 h-5" />
                        </button>
                      </Link>
                      
                      {/* Fun tip */}
                      <p className="text-[#555] text-xs mt-4 flex items-center justify-center gap-1">
                        <Zap className="w-3 h-3 text-[#FFD700]" />
                        Pro tip: Good lighting = better analysis!
                      </p>
                    </div>
                  </div>
                  
                  {/* Skill Tree / Lessons Strip (Like Pro's Shot Breakdown) */}
                  <div className="bg-[#2a2a2a] rounded-lg p-4 pt-3 border border-[#4a4a4a]">
                    {/* Clickable Header to open full tree */}
                    <button 
                      onClick={() => setShowSkillTree(true)}
                      className="w-full flex items-center justify-between mb-4 group"
                    >
                      <h3 className="text-[#FF6B35] font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                        <TreeDeciduous className="w-4 h-4" />
                        Skill Tree
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[#888] text-xs">{completedLessons}/{LESSONS.length} Complete</span>
                        <div className="flex items-center gap-1 text-[#FF6B35] text-[10px] font-bold uppercase group-hover:text-white transition-colors">
                          <span>View Tree</span>
                          <Maximize2 className="w-3 h-3" />
                        </div>
                      </div>
                    </button>
                    <div className="flex gap-3 overflow-x-auto pt-2 pb-2 scrollbar-hide">
                      {LESSONS.map((lesson) => (
                        <div key={lesson.id} className="flex flex-col items-center flex-shrink-0">
                          <LessonNode lesson={lesson} onClick={() => !lesson.locked && setSelectedLesson(lesson)} />
                          <div className={`mt-1.5 text-center ${lesson.locked ? 'text-[#666]' : 'text-white'}`}>
                            <div className="text-[8px] font-bold whitespace-nowrap">{lesson.name}</div>
                            {lesson.completed && <StarRating count={lesson.stars} max={3} size="sm" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Skill Tree Modal */}
                  <SkillTreeModal isOpen={showSkillTree} onClose={() => setShowSkillTree(false)} />
                  
                  {/* Daily Quests */}
                  <div className="bg-[#2a2a2a] rounded-lg p-4 border border-[#4a4a4a]">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[#FF6B35] font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Daily Quests
                      </h3>
                      <span className="text-[#22C55E] text-xs font-bold">+{DAILY_QUESTS.reduce((sum, q) => sum + (q.completed ? q.xp : 0), 0)} XP</span>
                    </div>
                    <div className="space-y-2">
                      {DAILY_QUESTS.map(quest => <QuestCard key={quest.id} quest={quest} />)}
                    </div>
                  </div>
                </div>

                {/* ============================================ */}
                {/* RIGHT COLUMN - Player Card & Comparisons */}
                {/* ============================================ */}
                <div className="space-y-6">
                  
                  {/* Player Card (Like Pro's Madden-Style Card) */}
                  <div className="bg-[#2a2a2a] rounded-lg overflow-hidden">
                    {/* Banner Header with Score & Jersey Number */}
                    <div className="relative h-28 lg:h-32 overflow-hidden">
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #FF6B35 30%, #1a1a1a 70%)' }} />
                      <div className="absolute inset-0 flex items-center justify-between px-5">
                        {/* Score Circle */}
                        <div className="relative">
                          <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full border-4 border-[#22C55E] flex items-center justify-center bg-[#1a1a1a]">
                            <span className="text-3xl lg:text-4xl font-black text-[#22C55E]">{MOCK_USER.score}</span>
                          </div>
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#22C55E] px-2 py-0.5 rounded text-[8px] font-bold text-[#1a1a1a]">OVR</div>
                        </div>
                        
                        {/* Name & Jersey */}
                        <div className="text-right">
                          <div className="text-white/60 text-xs uppercase tracking-wider">{MOCK_USER.name.toUpperCase()}</div>
                          <div className="text-white font-black text-2xl lg:text-3xl tracking-tight">HOUSTON</div>
                          <div className="flex items-center justify-end gap-2 mt-1">
                            <div className="flex gap-0.5">
                              {[...Array(10)].map((_, i) => (
                                <div key={i} className={`w-1 h-3 ${i < 7 ? 'bg-[#FF6B35]' : 'bg-[#3a3a3a]'}`} />
                              ))}
                            </div>
                            <span className="text-[#888] text-xs">{MOCK_USER.height}, {MOCK_USER.weight}</span>
                          </div>
                        </div>
                        
                        {/* Jersey Number */}
                        <div className="text-6xl lg:text-7xl font-black text-[#FF6B35]/30">{MOCK_USER.jerseyNumber}</div>
                      </div>
                    </div>
                    
                    {/* Progression History (Like Pro) */}
                    <div className="p-4 border-b border-[#3a3a3a]">
                      <div className="text-[#888] text-[10px] uppercase tracking-wider mb-2">Progression History</div>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="bg-[#1a1a1a] rounded p-2">
                          <div className="text-white font-bold text-sm">{MOCK_USER.xp}</div>
                          <div className="text-[#666] text-[9px] uppercase">XP</div>
                        </div>
                        <div className="bg-[#1a1a1a] rounded p-2">
                          <div className="text-white font-bold text-sm">{MOCK_USER.level}</div>
                          <div className="text-[#666] text-[9px] uppercase">LEVEL</div>
                        </div>
                        <div className="bg-[#1a1a1a] rounded p-2">
                          <div className="text-white font-bold text-sm">{MOCK_USER.hearts}/{MOCK_USER.maxHearts}</div>
                          <div className="text-[#666] text-[9px] uppercase">HEARTS</div>
                        </div>
                        <div className="bg-[#1a1a1a] rounded p-2">
                          <div className="text-white font-bold text-sm">{MOCK_USER.gems}</div>
                          <div className="text-[#666] text-[9px] uppercase">GEMS</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Kid-Friendly Report Card (Replaces Rising Star Metrics) */}
                    <ReportCard />
                  </div>
                  
                  {/* Strive To Be Like (Kid-Friendly Hero Selection) */}
                  <ShooterHeroCard />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Tab Navigation (Like Pro Dashboard - 6 tabs) */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a]/95 backdrop-blur-sm border-t border-[#3a3a3a] z-50">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-6 h-16 md:h-[72px]">
            {[
              { id: "home", icon: Home, label: "Home", href: "/results/demo/basic", active: true },
              { id: "lessons", icon: BookOpen, label: "Lessons", href: "/results/demo/basic" },
              { id: "player", icon: User, label: "Player", href: "/results/demo/player" },
              { id: "compare", icon: Users, label: "Compare", href: "/results/demo/compare" },
              { id: "training", icon: ClipboardList, label: "Training", href: "/results/demo/training" },
              { id: "badges", icon: Trophy, label: "Badges", href: "/badges" },
            ].map((tab) => (
              <Link
                key={tab.id}
                href={tab.href}
                className={`relative flex flex-col items-center justify-center gap-1 transition-all ${
                  tab.active ? "text-[#FF6B35]" : "text-[#888] hover:text-[#FF6B35]"
                }`}
              >
                <tab.icon className={`w-5 h-5 md:w-6 md:h-6 ${tab.active ? 'scale-110' : ''}`} />
                <span className="text-[10px] md:text-xs font-medium">{tab.label}</span>
                {tab.active && <div className="absolute -bottom-0 w-8 h-0.5 bg-[#FF6B35] rounded-full" />}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Lesson Detail Modal */}
      {selectedLesson && !selectedLesson.locked && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedLesson(null)}>
          <div className="w-full max-w-md bg-[#1a1a1a] rounded-2xl p-6 border border-[#3a3a3a]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  selectedLesson.completed ? 'bg-gradient-to-br from-[#22C55E] to-[#16A34A]' : 'bg-gradient-to-br from-[#FF6B35] to-[#E55A2B]'
                }`}>
                  <selectedLesson.Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-black text-lg">{selectedLesson.name}</h3>
                  <StarRating count={selectedLesson.stars} max={3} size="sm" />
                </div>
              </div>
              <button onClick={() => setSelectedLesson(null)} className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            
            <div className="text-center py-4">
              {selectedLesson.completed ? (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#22C55E]/20 flex items-center justify-center">
                    <Check className="w-8 h-8 text-[#22C55E]" />
                  </div>
                  <p className="text-white font-bold mb-2">Great job!</p>
                  <p className="text-[#888] text-sm">You earned <span className="text-[#FF6B35] font-bold">{selectedLesson.xp} XP</span>!</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FF6B35]/20 flex items-center justify-center">
                    <Rocket className="w-8 h-8 text-[#FF6B35]" />
                  </div>
                  <p className="text-white font-bold mb-2">Ready to learn?</p>
                  <p className="text-[#888] text-sm mb-4">Practice to earn stars and XP!</p>
                  <Link href="/?mode=image">
                    <button className="w-full py-3 bg-gradient-to-b from-[#FF6B35] to-[#E55A2B] text-white font-black rounded-xl shadow-[0_4px_0_#C44A20]">
                      START LESSON
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
