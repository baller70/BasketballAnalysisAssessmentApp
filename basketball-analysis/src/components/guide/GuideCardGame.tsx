"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  Camera, 
  Video, 
  Radio, 
  BookOpen,
  Target,
  Sparkles,
  Upload,
  Zap,
  Trophy,
  Rocket,
  TrendingUp,
  Users,
  Flame,
  Star
} from 'lucide-react'
import { usePoints } from '@/lib/points/pointsContext'
import { InlinePointsBurst } from '@/components/points/PointsBurst'

// ============================================
// TYPES
// ============================================

type GuideCategory = 'welcome' | 'upload_dos' | 'upload_donts' | 'image_guide' | 'video_guide' | 'live_guide' | 'form_correct' | 'form_incorrect' | 'completion'

interface GuideCard {
  id: string
  type: GuideCategory
  title: string
  subtitle: string
  color: string
  icon: React.ReactNode
}

interface GuideCardData {
  title: string
  description: string
  points?: string[]
  tip?: string
  imagePlaceholder?: boolean
  imageDescription?: string
}

// ============================================
// GUIDE CARD DATA
// ============================================

const GUIDE_CARDS: GuideCard[] = [
  // Welcome Section
  {
    id: 'welcome_1',
    type: 'welcome',
    title: 'WELCOME TO SHOTIQ',
    subtitle: 'AI-Powered Shooting Analysis',
    color: '#FF6B35',
    icon: <Sparkles className="w-8 h-8" />
  },
  {
    id: 'welcome_2',
    type: 'welcome',
    title: 'HOW IT WORKS',
    subtitle: 'Three Easy Steps',
    color: '#8B5CF6',
    icon: <Target className="w-8 h-8" />
  },
  
  // Upload Do's
  {
    id: 'dos_1',
    type: 'upload_dos',
    title: 'SIDE VIEW',
    subtitle: '90° Camera Angle',
    color: '#22C55E',
    icon: <Check className="w-8 h-8" />
  },
  {
    id: 'dos_2',
    type: 'upload_dos',
    title: 'FULL BODY',
    subtitle: 'Feet to Head Visible',
    color: '#22C55E',
    icon: <Check className="w-8 h-8" />
  },
  {
    id: 'dos_3',
    type: 'upload_dos',
    title: 'GOOD LIGHTING',
    subtitle: 'Well-Lit Environment',
    color: '#22C55E',
    icon: <Check className="w-8 h-8" />
  },
  {
    id: 'dos_4',
    type: 'upload_dos',
    title: 'STABLE CAMERA',
    subtitle: 'Use Tripod or Surface',
    color: '#22C55E',
    icon: <Check className="w-8 h-8" />
  },
  
  // Upload Don'ts
  {
    id: 'donts_1',
    type: 'upload_donts',
    title: 'FRONT VIEW',
    subtitle: 'Avoid Front-Facing',
    color: '#EF4444',
    icon: <X className="w-8 h-8" />
  },
  {
    id: 'donts_2',
    type: 'upload_donts',
    title: 'PARTIAL BODY',
    subtitle: 'Don\'t Cut Off Body Parts',
    color: '#EF4444',
    icon: <X className="w-8 h-8" />
  },
  {
    id: 'donts_3',
    type: 'upload_donts',
    title: 'POOR LIGHTING',
    subtitle: 'Avoid Dark Environments',
    color: '#EF4444',
    icon: <X className="w-8 h-8" />
  },
  {
    id: 'donts_4',
    type: 'upload_donts',
    title: 'SHAKY FOOTAGE',
    subtitle: 'Keep Camera Steady',
    color: '#EF4444',
    icon: <X className="w-8 h-8" />
  },
  
  // Image Upload Guide
  {
    id: 'image_1',
    type: 'image_guide',
    title: 'IMAGE UPLOAD',
    subtitle: 'Single Shot Analysis',
    color: '#3B82F6',
    icon: <Camera className="w-8 h-8" />
  },
  {
    id: 'image_2',
    type: 'image_guide',
    title: 'IMAGE SEQUENCE',
    subtitle: 'Multi-Phase Analysis',
    color: '#3B82F6',
    icon: <Camera className="w-8 h-8" />
  },
  
  // Video Upload Guide
  {
    id: 'video_1',
    type: 'video_guide',
    title: 'VIDEO UPLOAD',
    subtitle: 'Complete Motion Analysis',
    color: '#8B5CF6',
    icon: <Video className="w-8 h-8" />
  },
  {
    id: 'video_2',
    type: 'video_guide',
    title: 'VIDEO TIPS',
    subtitle: 'Best Practices',
    color: '#8B5CF6',
    icon: <Video className="w-8 h-8" />
  },
  
  // Live Analysis Guide
  {
    id: 'live_1',
    type: 'live_guide',
    title: 'LIVE ANALYSIS',
    subtitle: 'Real-Time Feedback',
    color: '#F59E0B',
    icon: <Radio className="w-8 h-8" />
  },
  {
    id: 'live_2',
    type: 'live_guide',
    title: 'LIVE SETUP',
    subtitle: 'Camera Positioning',
    color: '#F59E0B',
    icon: <Radio className="w-8 h-8" />
  },
  
  // Shooting Form - Correct
  {
    id: 'form_correct_1',
    type: 'form_correct',
    title: 'PROPER GRIP',
    subtitle: 'Fingertip Control',
    color: '#22C55E',
    icon: <Check className="w-8 h-8" />
  },
  {
    id: 'form_correct_2',
    type: 'form_correct',
    title: 'ELBOW ALIGNED',
    subtitle: 'Under the Ball',
    color: '#22C55E',
    icon: <Check className="w-8 h-8" />
  },
  {
    id: 'form_correct_3',
    type: 'form_correct',
    title: 'FULL FOLLOW-THROUGH',
    subtitle: 'Complete Extension',
    color: '#22C55E',
    icon: <Check className="w-8 h-8" />
  },
  {
    id: 'form_correct_4',
    type: 'form_correct',
    title: 'GUIDE HAND',
    subtitle: 'Side Support Only',
    color: '#22C55E',
    icon: <Check className="w-8 h-8" />
  },
  
  // Shooting Form - Incorrect
  {
    id: 'form_incorrect_1',
    type: 'form_incorrect',
    title: 'PALMING BALL',
    subtitle: 'Reduces Control',
    color: '#EF4444',
    icon: <X className="w-8 h-8" />
  },
  {
    id: 'form_incorrect_2',
    type: 'form_incorrect',
    title: 'ELBOW FLARED',
    subtitle: 'Creates Side Spin',
    color: '#EF4444',
    icon: <X className="w-8 h-8" />
  },
  {
    id: 'form_incorrect_3',
    type: 'form_incorrect',
    title: 'SHORT FOLLOW-THROUGH',
    subtitle: 'Reduces Power',
    color: '#EF4444',
    icon: <X className="w-8 h-8" />
  },
  {
    id: 'form_incorrect_4',
    type: 'form_incorrect',
    title: 'GUIDE HAND PUSH',
    subtitle: 'Disrupts Accuracy',
    color: '#EF4444',
    icon: <X className="w-8 h-8" />
  },
  
  // Completion Card
  {
    id: 'completion_1',
    type: 'completion',
    title: "YOU'RE READY!",
    subtitle: 'Time to Level Up Your Game',
    color: '#FFD700',
    icon: <Trophy className="w-8 h-8" />
  },
]

// Card content data
const CARD_CONTENT: Record<string, GuideCardData> = {
  // Welcome cards
  'welcome_1': {
    title: 'Welcome to ShotIQ AI',
    description: 'Your personal AI shooting coach. Analyze your basketball shooting form and get instant feedback to improve your game.',
    points: [
      'AI-powered form analysis',
      'Compare with elite shooters',
      'Track your progress over time',
      'Get personalized tips'
    ],
    tip: 'Swipe through this guide to learn how to get the best results!'
  },
  'welcome_2': {
    title: 'Three Easy Steps',
    description: 'Getting your shot analyzed is simple:',
    points: [
      '1. Upload a photo, video, or go live',
      '2. Our AI analyzes your shooting form',
      '3. Get detailed feedback and tips'
    ],
    tip: 'Better uploads = Better analysis results!'
  },
  
  // Upload Do's
  'dos_1': {
    title: 'Side View (90° Angle)',
    description: 'Position the camera perpendicular to the shooter for the best analysis.',
    points: [
      'Camera at waist height',
      'Directly to the side of shooter',
      'Full court depth visible',
      'No obstructions between camera and shooter'
    ],
    tip: 'This angle allows AI to see elbow angle, knee bend, and full shooting motion.',
    imagePlaceholder: true,
    imageDescription: 'Camera positioned at 90° to shooter'
  },
  'dos_2': {
    title: 'Full Body Visible',
    description: 'Make sure your entire body is in frame from feet to head.',
    points: [
      'Feet clearly visible at bottom',
      'Head and release point at top',
      'Arms fully visible during extension',
      'Leave some margin around body'
    ],
    tip: 'AI needs to track all body points for complete analysis.',
    imagePlaceholder: true,
    imageDescription: 'Full body from feet to release point'
  },
  'dos_3': {
    title: 'Good Lighting',
    description: 'Well-lit environments help the AI detect your body accurately.',
    points: [
      'Outdoor daylight is ideal',
      'Well-lit gym works great',
      'Avoid harsh shadows on body',
      'Even lighting across frame'
    ],
    tip: 'Good lighting helps computer vision detect body keypoints accurately.',
    imagePlaceholder: true,
    imageDescription: 'Well-lit shooting environment'
  },
  'dos_4': {
    title: 'Stable Camera',
    description: 'Keep the camera steady for clear, blur-free footage.',
    points: [
      'Use a tripod if possible',
      'Rest on stable surface',
      'Have someone hold it steady',
      'Avoid handheld recording'
    ],
    tip: 'Motion blur confuses the AI and reduces analysis accuracy.',
    imagePlaceholder: true,
    imageDescription: 'Camera on tripod or stable surface'
  },
  
  // Upload Don'ts
  'donts_1': {
    title: 'Avoid Front-Facing Angle',
    description: 'Camera directly in front hides important body mechanics.',
    points: [
      'Can\'t see elbow position',
      'Side-to-side alignment hidden',
      'Knee bend not visible',
      'Release angle unclear'
    ],
    tip: 'Always position camera to the side, not in front!',
    imagePlaceholder: true,
    imageDescription: 'Wrong: Camera facing shooter directly'
  },
  'donts_2': {
    title: 'Don\'t Cut Off Body Parts',
    description: 'Partial body visibility means incomplete analysis.',
    points: [
      'Missing feet = no balance analysis',
      'Missing head = no follow-through',
      'Missing arms = no release analysis',
      'Missing legs = no power analysis'
    ],
    tip: 'Step back or zoom out to capture your full body.',
    imagePlaceholder: true,
    imageDescription: 'Wrong: Feet or head cut off from frame'
  },
  'donts_3': {
    title: 'Avoid Poor Lighting',
    description: 'Dark environments make body detection difficult.',
    points: [
      'Shadows hide body outline',
      'Low light causes blur',
      'Backlight silhouettes body',
      'Uneven lighting confuses AI'
    ],
    tip: 'Record in daylight or well-lit indoor spaces.',
    imagePlaceholder: true,
    imageDescription: 'Wrong: Dark or poorly lit environment'
  },
  'donts_4': {
    title: 'Keep Camera Steady',
    description: 'Shaky footage ruins the analysis quality.',
    points: [
      'Motion blur on body',
      'Inconsistent tracking',
      'Keypoints jump around',
      'Inaccurate measurements'
    ],
    tip: 'Use a tripod or rest camera on something stable.',
    imagePlaceholder: true,
    imageDescription: 'Wrong: Shaky handheld footage'
  },
  
  // Image Guide
  'image_1': {
    title: 'Single Image Upload',
    description: 'Upload a single photo of your shooting form for quick analysis.',
    points: [
      'Best for release point analysis',
      'Capture at peak of shot',
      'High resolution preferred',
      'JPEG, PNG, or HEIC format'
    ],
    tip: 'Capture the moment just as the ball leaves your fingertips.',
    imagePlaceholder: true,
    imageDescription: 'Single shot at release point'
  },
  'image_2': {
    title: 'Image Sequence (3-7 Photos)',
    description: 'Upload multiple photos showing different phases of your shot.',
    points: [
      'Phase 1: Setup position',
      'Phase 2: Loading (the dip)',
      'Phase 3: Release point',
      'Phase 4: Follow-through'
    ],
    tip: 'More phases = more comprehensive analysis!',
    imagePlaceholder: true,
    imageDescription: 'Multiple phases of shooting motion'
  },
  
  // Video Guide
  'video_1': {
    title: 'Video Upload',
    description: 'Upload a video to analyze your complete shooting motion.',
    points: [
      'Maximum 90 seconds',
      '1-2 complete shot attempts',
      'MP4, MOV, or WebM format',
      'Maximum 50MB file size'
    ],
    tip: 'Video captures the full motion for detailed analysis.',
    imagePlaceholder: true,
    imageDescription: 'Recording a shooting video'
  },
  'video_2': {
    title: 'Video Best Practices',
    description: 'Follow these tips for the best video analysis:',
    points: [
      'Record at 30fps or higher',
      'Include setup to follow-through',
      'Pause briefly between shots',
      'Keep camera stable throughout'
    ],
    tip: 'Quality over quantity - one good shot beats five blurry ones.',
    imagePlaceholder: true,
    imageDescription: 'Proper video recording setup'
  },
  
  // Live Guide
  'live_1': {
    title: 'Live Analysis Mode',
    description: 'Get real-time feedback as you shoot using your device camera.',
    points: [
      'Instant form feedback',
      'See keypoints in real-time',
      'Adjust form on the fly',
      'Perfect for practice sessions'
    ],
    tip: 'Set up your device where you can see the screen while shooting.',
    imagePlaceholder: true,
    imageDescription: 'Live analysis on device'
  },
  'live_2': {
    title: 'Live Mode Setup',
    description: 'Position your device for optimal live analysis:',
    points: [
      'Mount device at side angle',
      'Prop at waist height',
      'Ensure stable positioning',
      'Check you\'re fully in frame'
    ],
    tip: 'Use a phone tripod or lean against something stable.',
    imagePlaceholder: true,
    imageDescription: 'Device setup for live mode'
  },
  
  // Correct Form
  'form_correct_1': {
    title: 'Proper Shooting Hand Grip',
    description: 'Fingertips control for optimal backspin and accuracy.',
    points: [
      'Ball rests on fingertips, not palm',
      'Fingers spread comfortably',
      'Thumb relaxed at approximately 45°',
      'Wrist cocked back in set position'
    ],
    tip: 'Think of holding the ball like a waiter holds a tray.',
    imagePlaceholder: true,
    imageDescription: 'Correct hand grip on basketball'
  },
  'form_correct_2': {
    title: 'Elbow Aligned Under Ball',
    description: 'Proper elbow position creates straight ball flight.',
    points: [
      'Elbow directly under ball',
      'Forearm perpendicular to floor',
      'Elbow points toward basket',
      'Creates straight force vector'
    ],
    tip: 'Your elbow should form an "L" shape at set position.',
    imagePlaceholder: true,
    imageDescription: 'Elbow aligned under the ball'
  },
  'form_correct_3': {
    title: 'Complete Follow-Through',
    description: 'Full extension with wrist snap for consistency.',
    points: [
      'Arm fully extended at release',
      'Wrist snaps down completely',
      'Fingers point toward basket',
      'Hold position until ball lands'
    ],
    tip: 'Reach into the cookie jar on the top shelf!',
    imagePlaceholder: true,
    imageDescription: 'Full follow-through with extension'
  },
  'form_correct_4': {
    title: 'Guide Hand Position',
    description: 'Side support without shot interference.',
    points: [
      'Guide hand on side of ball',
      'Thumb pointing upward',
      'Light fingertip contact only',
      'Releases cleanly before shot'
    ],
    tip: 'Guide hand guides, it doesn\'t push!',
    imagePlaceholder: true,
    imageDescription: 'Proper guide hand placement'
  },
  
  // Incorrect Form
  'form_incorrect_1': {
    title: 'Palming the Ball',
    description: 'Palm contact reduces control and spin.',
    points: [
      'Ball sits in palm of hand',
      'Fingers bunched together',
      'Limited wrist flexibility',
      'Reduced backspin on shot'
    ],
    tip: 'If you can see daylight between palm and ball, you\'re doing it right!',
    imagePlaceholder: true,
    imageDescription: 'Wrong: Ball resting in palm'
  },
  'form_incorrect_2': {
    title: 'Elbow Flared Out',
    description: 'Misaligned elbow creates unwanted side spin.',
    points: [
      'Elbow points outward from body',
      'Creates angled force vector',
      'Ball curves during flight',
      'Requires compensation'
    ],
    tip: 'Keep that elbow tucked in and pointing at the rim!',
    imagePlaceholder: true,
    imageDescription: 'Wrong: Elbow flared out to side'
  },
  'form_incorrect_3': {
    title: 'Incomplete Follow-Through',
    description: 'Shortened motion reduces power and accuracy.',
    points: [
      'Arm doesn\'t fully extend',
      'Wrist snap is abbreviated',
      'Quick withdrawal of arm',
      'Inconsistent trajectory'
    ],
    tip: 'Finish your shot! Hold that follow-through.',
    imagePlaceholder: true,
    imageDescription: 'Wrong: Arm not fully extended'
  },
  'form_incorrect_4': {
    title: 'Guide Hand Push',
    description: 'Active guide hand disrupts accuracy.',
    points: [
      'Guide hand pushes ball',
      'Thumb flicks toward basket',
      'Creates unwanted side spin',
      'Inconsistent ball flight'
    ],
    tip: 'Your guide hand should come off clean - no pushing!',
    imagePlaceholder: true,
    imageDescription: 'Wrong: Guide hand pushing ball'
  },
  
  // Completion card
  'completion_1': {
    title: "Congratulations! You're Ready!",
    description: "You now know everything you need to get the most out of ShotIQ AI. Every great shooter started somewhere - and today, you're taking the first step toward perfecting your form.",
    points: [
      'Upload your first shot and get instant AI feedback',
      'Track your progress and watch yourself improve',
      'Compare your form to elite NBA shooters',
      'Build your streak and stay consistent',
      'Become the shooter you\'ve always wanted to be'
    ],
    tip: "The best time to start was yesterday. The second best time is NOW. Let's go!"
  },
}

// ============================================
// SHOTIQ LOGO ICON
// ============================================

function ShotIQLogoIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <div className={`${className} rounded overflow-hidden`}>
      <Image 
        src="/images/ShotIQ Logo Gredient.png" 
        alt="ShotIQ" 
        width={16} 
        height={16}
        className="w-full h-full object-contain"
      />
    </div>
  )
}

// ============================================
// GUIDE CARD COMPONENT
// ============================================

interface GuideCardProps {
  card: GuideCard
  data: GuideCardData
  isActive: boolean
  dragX: number
}

function GuideCardComponent({ card, data, isActive, dragX }: GuideCardProps) {
  const isCorrect = card.type === 'upload_dos' || card.type === 'form_correct'
  const isIncorrect = card.type === 'upload_donts' || card.type === 'form_incorrect'
  const isCompletion = card.type === 'completion'
  
  // Arrow position - centered vertically on the card
  const arrowTop = 50
  
  return (
    <div 
      className={`relative w-full transition-all duration-300 ${isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-50'}`}
    >
      {/* Card Container */}
      <div className="relative bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] rounded-3xl overflow-hidden border-2 shadow-2xl"
        style={{ borderColor: `${card.color}50` }}
      >
        {/* Left Swipe Indicator - Previous */}
        <div 
          className="z-10 flex items-center gap-0 pointer-events-none transition-all duration-150"
          style={{ 
            opacity: dragX < 0 ? Math.min(0.9, 0.2 + Math.abs(dragX) / 150) : 0.2,
            transform: `translateY(-50%) translateX(${dragX < 0 ? Math.max(-8, dragX / 15) : 0}px)`,
            position: 'absolute',
            left: 0,
            top: `${arrowTop}%`,
            height: 'fit-content'
          }}
        >
          <svg width="70" height="70" viewBox="0 0 70 70">
            <path d="M32 5 L5 35 L32 65" stroke={dragX < -20 ? "#3b82f6" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="1" className="transition-all duration-150" />
            <path d="M50 5 L23 35 L50 65" stroke={dragX < -20 ? "#3b82f6" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="1" className="transition-all duration-150" />
            <path d="M18 5 L-9 35 L18 65" stroke={dragX < -20 ? "#3b82f6" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" className="transition-all duration-150" />
            <path d="M36 5 L9 35 L36 65" stroke={dragX < -20 ? "#3b82f6" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" className="transition-all duration-150" />
            <path d="M46 5 L19 35 L46 65" stroke={dragX < -20 ? "#3b82f6" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" className="transition-all duration-150" />
            <path d="M64 5 L37 35 L64 65" stroke={dragX < -20 ? "#3b82f6" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" className="transition-all duration-150" />
          </svg>
          <svg width="100" height="40" viewBox="0 0 100 40" className="-ml-2">
            <text 
              x="50" 
              y="30" 
              textAnchor="middle" 
              fontSize="24" 
              fontWeight="400" 
              fontFamily="Russo One, Arial Black, sans-serif"
              fill="none" 
              stroke={dragX < -20 ? "#3b82f6" : "white"}
              strokeWidth="1.5"
              letterSpacing="3"
              className="transition-all duration-150"
            >
              SWIPE
            </text>
          </svg>
        </div>
        
        {/* Right Swipe Indicator - Next */}
        <div 
          className="z-10 flex items-center gap-0 pointer-events-none transition-all duration-150"
          style={{ 
            opacity: dragX > 0 ? Math.min(0.9, 0.2 + dragX / 150) : 0.2,
            transform: `translateY(-50%) translateX(${dragX > 0 ? Math.min(8, dragX / 15) : 0}px)`,
            position: 'absolute',
            right: 0,
            top: `${arrowTop}%`,
            height: 'fit-content'
          }}
        >
          <svg width="100" height="40" viewBox="0 0 100 40" className="-mr-2">
            <text 
              x="50" 
              y="30" 
              textAnchor="middle" 
              fontSize="24" 
              fontWeight="400" 
              fontFamily="Russo One, Arial Black, sans-serif"
              fill="none" 
              stroke={dragX > 20 ? "#22c55e" : "white"}
              strokeWidth="1.5"
              letterSpacing="3"
              className="transition-all duration-150"
            >
              SWIPE
            </text>
          </svg>
          <svg width="70" height="70" viewBox="0 0 70 70">
            <path d="M38 5 L65 35 L38 65" stroke={dragX > 20 ? "#22c55e" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="1" className="transition-all duration-150" />
            <path d="M20 5 L47 35 L20 65" stroke={dragX > 20 ? "#22c55e" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="1" className="transition-all duration-150" />
            <path d="M52 5 L79 35 L52 65" stroke={dragX > 20 ? "#22c55e" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" className="transition-all duration-150" />
            <path d="M34 5 L61 35 L34 65" stroke={dragX > 20 ? "#22c55e" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" className="transition-all duration-150" />
            <path d="M24 5 L51 35 L24 65" stroke={dragX > 20 ? "#22c55e" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" className="transition-all duration-150" />
            <path d="M6 5 L33 35 L6 65" stroke={dragX > 20 ? "#22c55e" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" className="transition-all duration-150" />
          </svg>
        </div>
        
        {/* Banner */}
        <div className="relative h-24 overflow-hidden" style={{ background: `linear-gradient(135deg, ${card.color}20, #1a1a1a, #1a1a1a)` }}>
          {/* Glowing Orbs Background */}
          <div className="absolute inset-0 opacity-40 pointer-events-none">
            <div 
              className="absolute -top-8 -left-8 w-28 h-28 rounded-full"
              style={{ background: `radial-gradient(circle, ${card.color}30 0%, ${card.color}15 40%, transparent 70%)` }}
            />
            <div 
              className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full"
              style={{ background: `radial-gradient(circle, ${card.color}30 0%, ${card.color}15 40%, transparent 70%)` }}
            />
          </div>
          
          {/* Large Icon */}
          <div className="absolute inset-0 flex items-center justify-end pr-5">
            <div 
              className="relative w-16 h-16 flex items-center justify-center text-white"
              style={{
                borderRadius: '50%',
                boxShadow: `0 0 30px ${card.color}40, 0 0 60px ${card.color}20`
              }}
            >
              {card.icon}
            </div>
          </div>
          
          {/* Title and Subtitle */}
          <div className="absolute inset-0 flex flex-col justify-center pl-5">
            <h3 className="text-white font-black text-lg uppercase tracking-wider">{card.title}</h3>
            <p className="text-xs font-semibold uppercase tracking-wider mt-0.5" style={{ color: card.color }}>{card.subtitle}</p>
          </div>
        </div>
        
        {/* Card Content */}
        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isCorrect && <Check className="w-5 h-5 text-green-400" />}
              {isIncorrect && <X className="w-5 h-5 text-red-400" />}
              {isCompletion && <Trophy className="w-5 h-5 text-yellow-400" />}
              <span className={`font-bold text-sm ${isCompletion ? 'text-yellow-400' : 'text-white'}`}>{data.title}</span>
            </div>
            <div className="flex items-center gap-1">
              <ShotIQLogoIcon className="w-4 h-4" />
              <span className="text-[#888] text-[10px] font-semibold">SHOTIQ AI</span>
            </div>
          </div>
          
          {/* Description */}
          <p className="text-[#aaa] text-sm leading-relaxed">{data.description}</p>
          
          {/* Image Placeholder */}
          {data.imagePlaceholder && (
            <div 
              className="relative w-full h-40 rounded-xl overflow-hidden border-2 border-dashed flex items-center justify-center"
              style={{ borderColor: `${card.color}30`, backgroundColor: `${card.color}10` }}
            >
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center" style={{ backgroundColor: `${card.color}20` }}>
                  {isCorrect ? (
                    <Check className="w-6 h-6" style={{ color: card.color }} />
                  ) : isIncorrect ? (
                    <X className="w-6 h-6" style={{ color: card.color }} />
                  ) : (
                    <Camera className="w-6 h-6" style={{ color: card.color }} />
                  )}
                </div>
                <p className="text-[#666] text-xs">{data.imageDescription}</p>
                <p className="text-[#444] text-[10px] mt-1">(Image placeholder)</p>
              </div>
            </div>
          )}
          
          {/* Points List */}
          {data.points && data.points.length > 0 && (
            <ul className="space-y-2">
              {data.points.map((point, i) => {
                // Icons for completion card points
                const completionIcons = [
                  <Target key="target" className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: card.color }} />,
                  <TrendingUp key="trending" className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: card.color }} />,
                  <Users key="users" className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: card.color }} />,
                  <Flame key="flame" className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: card.color }} />,
                  <Star key="star" className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: card.color }} />
                ]
                
                return (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    {isCompletion ? (
                      <>
                        {completionIcons[i] || <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: card.color }} />}
                        <span className="text-[#ccc]">{point}</span>
                      </>
                    ) : isCorrect ? (
                      <>
                        <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-[#ccc]">{point}</span>
                      </>
                    ) : isIncorrect ? (
                      <>
                        <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <span className="text-[#ccc]">{point}</span>
                      </>
                    ) : (
                      <>
                        <div className="w-4 h-4 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0" style={{ backgroundColor: card.color }}>
                          <span className="text-white text-[10px] font-bold">{i + 1}</span>
                        </div>
                        <span className="text-[#ccc]">{point}</span>
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          
          {/* Tip Box */}
          {data.tip && (
            <div 
              className={`p-3 rounded-xl border ${isCompletion ? 'text-center' : ''}`}
              style={{ 
                backgroundColor: `${card.color}10`, 
                borderColor: `${card.color}30` 
              }}
            >
              {isCompletion ? (
                <p className="text-sm font-bold" style={{ color: card.color }}>
                  {data.tip}
                </p>
              ) : (
                <div className="flex items-start gap-2">
                  <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: card.color }} />
                  <p className="text-xs" style={{ color: card.color }}>
                    <span className="font-bold">TIP:</span> {data.tip}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Completion CTA Button */}
          {isCompletion && (
            <div className="pt-2">
              <button 
                className="w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ 
                  background: `linear-gradient(135deg, ${card.color}, #FF6B35)`,
                  color: '#000',
                  boxShadow: `0 4px 20px ${card.color}40`
                }}
                onClick={() => {
                  // This will be handled by the parent - navigate to upload
                  window.location.href = '/upload'
                }}
              >
                <Rocket className="w-5 h-5" />
                START YOUR FIRST ANALYSIS
              </button>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-3 border-t border-[#2a2a2a] bg-[#0a0a0a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded overflow-hidden">
                <Image 
                  src="/images/ShotIQ Logo Gredient.png" 
                  alt="ShotIQ" 
                  width={24}
                  height={24}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[#FF6B35] text-[10px] font-bold">SHOTIQ AI GUIDE</span>
            </div>
            <span className="text-[#666] text-[10px]">shotiqai.com</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// CATEGORY FILTER
// ============================================

interface CategoryFilterProps {
  activeCategory: GuideCategory | 'all'
  onCategoryChange: (category: GuideCategory | 'all') => void
}

const CATEGORIES: { id: GuideCategory | 'all'; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'all', label: 'All', icon: <BookOpen className="w-4 h-4" />, color: '#FF6B35' },
  { id: 'welcome', label: 'Intro', icon: <Sparkles className="w-4 h-4" />, color: '#FF6B35' },
  { id: 'upload_dos', label: "Do's", icon: <Check className="w-4 h-4" />, color: '#22C55E' },
  { id: 'upload_donts', label: "Don'ts", icon: <X className="w-4 h-4" />, color: '#EF4444' },
  { id: 'image_guide', label: 'Image', icon: <Camera className="w-4 h-4" />, color: '#3B82F6' },
  { id: 'video_guide', label: 'Video', icon: <Video className="w-4 h-4" />, color: '#8B5CF6' },
  { id: 'live_guide', label: 'Live', icon: <Radio className="w-4 h-4" />, color: '#F59E0B' },
  { id: 'form_correct', label: 'Good Form', icon: <Check className="w-4 h-4" />, color: '#22C55E' },
  { id: 'form_incorrect', label: 'Bad Form', icon: <X className="w-4 h-4" />, color: '#EF4444' },
]

function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onCategoryChange(cat.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            activeCategory === cat.id 
              ? 'text-white' 
              : 'bg-[#1a1a1a] text-[#888] hover:text-white hover:bg-[#2a2a2a]'
          }`}
          style={activeCategory === cat.id ? { backgroundColor: cat.color } : {}}
        >
          {cat.icon}
          {cat.label}
        </button>
      ))}
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function GuideCardGame() {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [activeCategory, setActiveCategory] = useState<GuideCategory | 'all'>('all')
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)
  
  // Points system
  const { earnPoints, state: pointsState } = usePoints()
  const [showPointsBurst, setShowPointsBurst] = useState(false)
  const [earnedPoints, setEarnedPoints] = useState(0)
  const swipedCardsRef = useRef<Set<string>>(new Set())
  
  // Filter cards based on category
  const filteredCards = activeCategory === 'all' 
    ? GUIDE_CARDS 
    : GUIDE_CARDS.filter(card => card.type === activeCategory)
  
  const currentCard = filteredCards[currentIndex]
  const currentData = currentCard ? CARD_CONTENT[currentCard.id] : null
  
  // Reset index when category changes
  useEffect(() => {
    setCurrentIndex(0)
  }, [activeCategory])
  
  // Navigation with points earning
  const goToNext = useCallback(() => {
    if (currentIndex < filteredCards.length - 1) {
      const nextCard = filteredCards[currentIndex + 1]
      
      // Award points for swiping to a new card (only once per card)
      if (nextCard && !swipedCardsRef.current.has(nextCard.id)) {
        const result = earnPoints('guide_card_swipe')
        if (result.earned) {
          swipedCardsRef.current.add(nextCard.id)
          setEarnedPoints(result.points)
          setShowPointsBurst(true)
        }
      }
      
      setCurrentIndex(prev => prev + 1)
      
      // Check if this is the last card (completion) and award bonus
      if (currentIndex + 1 === filteredCards.length - 1) {
        const completionResult = earnPoints('guide_complete')
        if (completionResult.earned) {
          // Show a bigger celebration for completion
          setTimeout(() => {
            setEarnedPoints(completionResult.points)
            setShowPointsBurst(true)
          }, 500)
        }
      }
    }
  }, [currentIndex, filteredCards, earnPoints])
  
  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }, [currentIndex])
  
  // Handle points burst completion
  const handlePointsBurstComplete = useCallback(() => {
    setShowPointsBurst(false)
  }, [])
  
  // Drag handlers
  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart(e.clientX)
  }
  
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setDragOffset(e.clientX - dragStart)
  }
  
  const onMouseUp = () => {
    if (!isDragging) return
    setIsDragging(false)
    
    if (Math.abs(dragOffset) > 100) {
      // Swipe left (negative offset) = Previous
      // Swipe right (positive offset) = Next
      if (dragOffset < 0) {
        goToPrev()
      } else {
        goToNext()
      }
    }
    setDragOffset(0)
  }
  
  const onMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false)
      setDragOffset(0)
    }
  }
  
  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setDragStart(e.touches[0].clientX)
  }
  
  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    setDragOffset(e.touches[0].clientX - dragStart)
  }
  
  const onTouchEnd = () => {
    onMouseUp()
  }
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrev()
      if (e.key === 'ArrowRight') goToNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToNext, goToPrev])
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-black text-xl uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#FF6B35]" />
            Guide
          </h2>
          <p className="text-[#FF6B35] text-sm font-semibold uppercase tracking-wider mt-1">Learn How to Use ShotIQ</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Points Display - Mini version */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 rounded-full border border-yellow-500/30">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="font-bold text-white text-sm">{pointsState.totalPoints}</span>
          </div>
          
          <button
            onClick={() => router.push('/upload')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF6B35] to-[#FF8F5F] rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-all"
          >
            <Upload className="w-4 h-4" />
            Start Upload
          </button>
        </div>
      </div>
      
      {/* Category Filter */}
      <CategoryFilter activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
      
      {/* Progress Dots */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        {filteredCards.map((card, i) => (
          <button
            key={card.id}
            onClick={() => setCurrentIndex(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentIndex
                ? 'w-6'
                : ''
            }`}
            style={{ 
              backgroundColor: i === currentIndex ? card.color : '#333'
            }}
          />
        ))}
      </div>
      
      {/* Card Area */}
      {currentCard && currentData && (
        <div
          ref={cardRef}
          className="relative cursor-grab active:cursor-grabbing"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.02}deg)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out'
          }}
        >
          <GuideCardComponent 
            card={currentCard} 
            data={currentData}
            isActive={true}
            dragX={dragOffset}
          />
          
          {/* Points Burst Animation */}
          <InlinePointsBurst 
            points={earnedPoints} 
            show={showPointsBurst} 
            onComplete={handlePointsBurstComplete}
          />
        </div>
      )}
      
      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-xl text-white font-semibold text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#FF6B35]/50 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Prev
        </button>
        
        <span className="text-[#666] text-sm font-medium">
          {currentIndex + 1} of {filteredCards.length}
        </span>
        
        <button
          onClick={goToNext}
          disabled={currentIndex === filteredCards.length - 1}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-xl text-white font-semibold text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#FF6B35]/50 transition-all"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => router.push('/upload?mode=image')}
          className="flex flex-col items-center gap-2 p-4 bg-[#1a1a1a] border border-[#333] rounded-xl hover:border-[#3B82F6]/50 transition-all group"
        >
          <Camera className="w-6 h-6 text-[#3B82F6] group-hover:scale-110 transition-transform" />
          <span className="text-white text-xs font-semibold">Upload Image</span>
        </button>
        <button
          onClick={() => router.push('/upload?mode=video')}
          className="flex flex-col items-center gap-2 p-4 bg-[#1a1a1a] border border-[#333] rounded-xl hover:border-[#8B5CF6]/50 transition-all group"
        >
          <Video className="w-6 h-6 text-[#8B5CF6] group-hover:scale-110 transition-transform" />
          <span className="text-white text-xs font-semibold">Upload Video</span>
        </button>
        <button
          onClick={() => router.push('/live')}
          className="flex flex-col items-center gap-2 p-4 bg-[#1a1a1a] border border-[#333] rounded-xl hover:border-[#F59E0B]/50 transition-all group"
        >
          <Radio className="w-6 h-6 text-[#F59E0B] group-hover:scale-110 transition-transform" />
          <span className="text-white text-xs font-semibold">Go Live</span>
        </button>
      </div>
    </div>
  )
}

export default GuideCardGame
