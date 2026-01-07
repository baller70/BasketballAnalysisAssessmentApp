"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/authStore"
import { useProfileStore, ExperienceLevel, BodyType, DominantHand, ShootingStyle } from "@/stores/profileStore"
import { 
  Bell, 
  Mail, 
  Clock, 
  Database, 
  Shield, 
  Calendar,
  Trophy,
  Users,
  Smartphone,
  Check,
  ChevronRight,
  ChevronLeft,
  User,
  Ruler,
  Weight,
  Award,
  Activity,
  Hand,
  Target,
  MapPin,
  Home,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Palette,
  MessageSquare,
  CircleDot,
  Star,
  Scale,
  Crosshair,
  Building2,
  TreePine,
  Rocket,
  Grip,
  Rainbow,
  Trash2,
  Download,
  RotateCcw,
  AlertTriangle,
  Smartphone as DeviceIcon
} from "lucide-react"

// ============================================
// TYPES & INTERFACES
// ============================================

type SettingsView = 'main' | 'profile' | 'coaching' | 'court' | 'equipment' | 'goals' | 'notifications' | 'display' | 'privacy' | 'data'

interface NotificationSettings {
  weeklyReportEmail: boolean
  monthlyReportEmail: boolean
  milestoneEmail: boolean
  coachingTipsPush: boolean
  motivationalMessagesPush: boolean
  reminderPush: boolean
  coachingTipsFrequency: 'daily' | '2x_week' | '3x_week' | 'weekly'
  reminderTime: string
}

interface CoachingSettings {
  feedbackTone: 'encouraging' | 'balanced' | 'performance'
  complexityLevel: 'simple' | 'technical' | 'data_heavy'
  showPeerComparisons: boolean
  showDetailedMetrics: boolean
}

interface CourtSettings {
  courtName: string
  courtType: 'indoor' | 'outdoor' | 'home'
  rimHeight: '8ft' | '9ft' | '10ft'
  location: string
}

interface EquipmentSettings {
  ballSize: 'youth' | 'intermediate' | 'full'
  preferredPosition: 'point_guard' | 'shooting_guard' | 'small_forward' | 'power_forward' | 'center'
}

interface GoalSettings {
  targetScore: number
  focusPriority: 'auto' | 'elbow' | 'release' | 'follow_through' | 'balance' | 'arc'
}

interface DisplaySettings {
  theme: 'dark' | 'light' | 'system'
  units: 'imperial' | 'metric'
  textSize: 'normal' | 'large' | 'extra_large'
  reducedMotion: boolean
  soundEnabled: boolean
}

interface PrivacySettings {
  profileVisibility: 'private' | 'friends' | 'public'
  showOnLeaderboards: boolean
  includeInComparisons: boolean
  shareWithCoach: boolean
}

// ============================================
// DEFAULTS
// ============================================

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  weeklyReportEmail: true,
  monthlyReportEmail: true,
  milestoneEmail: true,
  coachingTipsPush: true,
  motivationalMessagesPush: true,
  reminderPush: false,
  coachingTipsFrequency: '2x_week',
  reminderTime: '18:00'
}

const DEFAULT_COACHING_SETTINGS: CoachingSettings = {
  feedbackTone: 'balanced',
  complexityLevel: 'technical',
  showPeerComparisons: true,
  showDetailedMetrics: true
}

const DEFAULT_COURT_SETTINGS: CourtSettings = {
  courtName: '',
  courtType: 'indoor',
  rimHeight: '10ft',
  location: ''
}

const DEFAULT_EQUIPMENT_SETTINGS: EquipmentSettings = {
  ballSize: 'full',
  preferredPosition: 'shooting_guard'
}

const DEFAULT_GOAL_SETTINGS: GoalSettings = {
  targetScore: 85,
  focusPriority: 'auto'
}

const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  theme: 'dark',
  units: 'imperial',
  textSize: 'normal',
  reducedMotion: false,
  soundEnabled: true
}

const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  profileVisibility: 'public',
  showOnLeaderboards: true,
  includeInComparisons: true,
  shareWithCoach: true
}

const STORAGE_KEYS = {
  NOTIFICATIONS: 'shotiq_notification_settings',
  COACHING: 'shotiq_coaching_settings',
  COURT: 'shotiq_court_settings',
  EQUIPMENT: 'shotiq_equipment_settings',
  GOALS: 'shotiq_goal_settings',
  DISPLAY: 'shotiq_display_settings',
  PRIVACY: 'shotiq_privacy_settings'
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function SettingsPage() {
  const router = useRouter()
  const profile = useProfileStore()
  
  const [currentView, setCurrentView] = useState<SettingsView>('main')
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Settings state
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS)
  const [coachingSettings, setCoachingSettings] = useState<CoachingSettings>(DEFAULT_COACHING_SETTINGS)
  const [courtSettings, setCourtSettings] = useState<CourtSettings>(DEFAULT_COURT_SETTINGS)
  const [equipmentSettings, setEquipmentSettings] = useState<EquipmentSettings>(DEFAULT_EQUIPMENT_SETTINGS)
  const [goalSettings, setGoalSettings] = useState<GoalSettings>(DEFAULT_GOAL_SETTINGS)
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(DEFAULT_DISPLAY_SETTINGS)
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS)
  
  // Profile editing state
  const [editedProfile, setEditedProfile] = useState({
    heightFeet: 0,
    heightInches: 0,
    weight: 0,
    wingspan: 0,
    age: 0,
    experienceLevel: '' as ExperienceLevel | '',
    bodyType: '' as BodyType | '',
    athleticAbility: 5,
    dominantHand: '' as DominantHand | '',
    shootingStyle: '' as ShootingStyle | ''
  })

  // Load settings
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsHydrated(true)
      
      const loadSetting = <T,>(key: string, defaultValue: T): T => {
        try {
          const stored = localStorage.getItem(key)
          return stored ? JSON.parse(stored) : defaultValue
        } catch {
          return defaultValue
        }
      }
      
      setNotificationSettings(loadSetting(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATION_SETTINGS))
      setCoachingSettings(loadSetting(STORAGE_KEYS.COACHING, DEFAULT_COACHING_SETTINGS))
      setCourtSettings(loadSetting(STORAGE_KEYS.COURT, DEFAULT_COURT_SETTINGS))
      setEquipmentSettings(loadSetting(STORAGE_KEYS.EQUIPMENT, DEFAULT_EQUIPMENT_SETTINGS))
      setGoalSettings(loadSetting(STORAGE_KEYS.GOALS, DEFAULT_GOAL_SETTINGS))
      setDisplaySettings(loadSetting(STORAGE_KEYS.DISPLAY, DEFAULT_DISPLAY_SETTINGS))
      setPrivacySettings(loadSetting(STORAGE_KEYS.PRIVACY, DEFAULT_PRIVACY_SETTINGS))
      
      if (profile.heightInches) {
        setEditedProfile({
          heightFeet: Math.floor(profile.heightInches / 12),
          heightInches: profile.heightInches % 12,
          weight: profile.weightLbs || 0,
          wingspan: profile.wingspanInches || 0,
          age: profile.age || 0,
          experienceLevel: profile.experienceLevel || '',
          bodyType: profile.bodyType || '',
          athleticAbility: profile.athleticAbility || 5,
          dominantHand: profile.dominantHand || '',
          shootingStyle: profile.shootingStyle || ''
        })
      }
    }
  }, [profile])

  // Auto-save settings
  const saveSettings = () => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notificationSettings))
    localStorage.setItem(STORAGE_KEYS.COACHING, JSON.stringify(coachingSettings))
    localStorage.setItem(STORAGE_KEYS.COURT, JSON.stringify(courtSettings))
    localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(equipmentSettings))
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goalSettings))
    localStorage.setItem(STORAGE_KEYS.DISPLAY, JSON.stringify(displaySettings))
    localStorage.setItem(STORAGE_KEYS.PRIVACY, JSON.stringify(privacySettings))
  }

  // Save profile
  const saveProfile = () => {
    const totalInches = (editedProfile.heightFeet * 12) + editedProfile.heightInches
    if (totalInches > 0) profile.setHeight(totalInches)
    if (editedProfile.weight > 0) profile.setWeight(editedProfile.weight)
    if (editedProfile.wingspan > 0) profile.setWingspan(editedProfile.wingspan)
    if (editedProfile.age > 0) profile.setAge(editedProfile.age)
    if (editedProfile.experienceLevel) profile.setExperienceLevel(editedProfile.experienceLevel as ExperienceLevel)
    if (editedProfile.bodyType) profile.setBodyType(editedProfile.bodyType as BodyType)
    if (editedProfile.athleticAbility) profile.setAthleticAbility(editedProfile.athleticAbility)
    if (editedProfile.dominantHand) profile.setDominantHand(editedProfile.dominantHand as DominantHand)
    if (editedProfile.shootingStyle) profile.setShootingStyle(editedProfile.shootingStyle as ShootingStyle)
  }

  // Helpers
  const formatHeight = (inches: number | null) => {
    if (!inches) return "Not set"
    return `${Math.floor(inches / 12)}'${inches % 12}"`
  }

  const formatLabel = (value: string | null) => {
    if (!value) return "Not set"
    return value.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const goBack = () => {
    if (currentView === 'main') {
      router.back()
    } else {
      saveSettings()
      saveProfile()
      setCurrentView('main')
    }
  }

  if (!isHydrated) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  const getViewTitle = () => {
    switch (currentView) {
      case 'profile': return 'Profile'
      case 'coaching': return 'Coaching'
      case 'court': return 'My Court'
      case 'equipment': return 'Equipment'
      case 'goals': return 'Goals'
      case 'notifications': return 'Notifications'
      case 'display': return 'Display'
      case 'privacy': return 'Privacy'
      case 'data': return 'Data & Storage'
      default: return 'Settings'
    }
  }

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center h-14 px-4">
          <button 
            onClick={goBack}
            className="flex items-center gap-1 text-[#FF6B35] -ml-2 px-2 py-2 active:opacity-70"
          >
            <ChevronLeft className="w-5 h-5" />
            {currentView !== 'main' && <span className="text-[15px] font-medium">Back</span>}
          </button>
          <h1 className="flex-1 text-center text-[17px] font-bold text-white">
            {getViewTitle()}
          </h1>
          <div className="w-16" />
        </div>
      </header>

      {/* Content */}
      <div className="pb-24">
        {currentView === 'main' && (
          <div className="animate-in fade-in duration-200">
            {/* Account Section */}
            <SectionHeader title="ACCOUNT" />
            <SettingsGroup>
              <SettingsRow
                icon={User}
                label="Profile"
                value={profile.profileComplete ? 'Complete' : 'Incomplete'}
                onClick={() => setCurrentView('profile')}
              />
            </SettingsGroup>

            {/* Training Section */}
            <SectionHeader title="TRAINING" />
            <SettingsGroup>
              <SettingsRow
                icon={MessageSquare}
                label="Coaching"
                value={formatLabel(coachingSettings.feedbackTone)}
                onClick={() => setCurrentView('coaching')}
              />
              <SettingsRow
                icon={Home}
                label="My Court"
                value={courtSettings.courtName || 'Not set'}
                onClick={() => setCurrentView('court')}
                showDivider
              />
              <SettingsRow
                icon={CircleDot}
                label="Equipment"
                value={formatLabel(equipmentSettings.ballSize)}
                onClick={() => setCurrentView('equipment')}
                showDivider
              />
              <SettingsRow
                icon={Target}
                label="Goals"
                value={`Score: ${goalSettings.targetScore}`}
                onClick={() => setCurrentView('goals')}
                showDivider
              />
            </SettingsGroup>

            {/* Preferences Section */}
            <SectionHeader title="PREFERENCES" />
            <SettingsGroup>
              <SettingsRow
                icon={Bell}
                label="Notifications"
                onClick={() => setCurrentView('notifications')}
              />
              <SettingsRow
                icon={Palette}
                label="Display"
                value={formatLabel(displaySettings.theme)}
                onClick={() => setCurrentView('display')}
                showDivider
              />
              <SettingsRow
                icon={Shield}
                label="Privacy"
                value={formatLabel(privacySettings.profileVisibility)}
                onClick={() => setCurrentView('privacy')}
                showDivider
              />
            </SettingsGroup>

            {/* Data Section */}
            <SectionHeader title="DATA" />
            <SettingsGroup>
              <SettingsRow
                icon={Database}
                label="Data & Storage"
                onClick={() => setCurrentView('data')}
              />
            </SettingsGroup>

            {/* App Info */}
            <div className="text-center py-10 text-[#444] text-xs">
              <p className="font-medium">ShotIQ AI v1.0.0</p>
              <p className="mt-1">Basketball Shooting Analysis</p>
            </div>
          </div>
        )}

        {/* PROFILE VIEW */}
        {currentView === 'profile' && (
          <div className="animate-in slide-in-from-right duration-200">
            <SectionHeader title="PHYSICAL" />
            <SettingsGroup>
              <SettingsInputRow
                label="Height"
                type="height"
                valueFeet={editedProfile.heightFeet}
                valueInches={editedProfile.heightInches}
                onChangeFeet={(v) => setEditedProfile(p => ({ ...p, heightFeet: v }))}
                onChangeInches={(v) => setEditedProfile(p => ({ ...p, heightInches: v }))}
              />
              <SettingsInputRow
                label="Weight"
                type="number"
                value={editedProfile.weight}
                onChange={(v) => setEditedProfile(p => ({ ...p, weight: v }))}
                suffix="lbs"
                showDivider
              />
              <SettingsInputRow
                label="Wingspan"
                type="number"
                value={editedProfile.wingspan}
                onChange={(v) => setEditedProfile(p => ({ ...p, wingspan: v }))}
                suffix="in"
                showDivider
              />
              <SettingsInputRow
                label="Age"
                type="number"
                value={editedProfile.age}
                onChange={(v) => setEditedProfile(p => ({ ...p, age: v }))}
                suffix="yrs"
                showDivider
              />
            </SettingsGroup>

            <SectionHeader title="EXPERIENCE" />
            <SettingsGroup>
              <SettingsSelectRow
                label="Skill Level"
                value={editedProfile.experienceLevel}
                options={[
                  { value: 'beginner', label: 'Beginner' },
                  { value: 'intermediate', label: 'Intermediate' },
                  { value: 'advanced', label: 'Advanced' },
                  { value: 'professional', label: 'Professional' }
                ]}
                onChange={(v) => setEditedProfile(p => ({ ...p, experienceLevel: v as ExperienceLevel }))}
              />
              <SettingsSelectRow
                label="Body Type"
                value={editedProfile.bodyType}
                options={[
                  { value: 'ectomorph', label: 'Ectomorph (Lean)' },
                  { value: 'mesomorph', label: 'Mesomorph (Athletic)' },
                  { value: 'endomorph', label: 'Endomorph (Solid)' }
                ]}
                onChange={(v) => setEditedProfile(p => ({ ...p, bodyType: v as BodyType }))}
                showDivider
              />
            </SettingsGroup>

            <SectionHeader title="SHOOTING" />
            <SettingsGroup>
              <SettingsSelectRow
                label="Dominant Hand"
                value={editedProfile.dominantHand}
                options={[
                  { value: 'right', label: 'Right' },
                  { value: 'left', label: 'Left' },
                  { value: 'ambidextrous', label: 'Ambidextrous' }
                ]}
                onChange={(v) => setEditedProfile(p => ({ ...p, dominantHand: v as DominantHand }))}
              />
              <SettingsSelectRow
                label="Shooting Style"
                value={editedProfile.shootingStyle}
                options={[
                  { value: 'one_motion', label: 'One Motion' },
                  { value: 'two_motion', label: 'Two Motion' },
                  { value: 'set_shot', label: 'Set Shot' },
                  { value: 'jump_shot', label: 'Jump Shot' },
                  { value: 'not_sure', label: 'Not Sure' }
                ]}
                onChange={(v) => setEditedProfile(p => ({ ...p, shootingStyle: v as ShootingStyle }))}
                showDivider
              />
            </SettingsGroup>

            <SectionHeader title="ATHLETIC ABILITY" />
            <SettingsGroup>
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white text-[15px]">Rating</span>
                  <span className="text-[#FF6B35] font-semibold">{editedProfile.athleticAbility}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={editedProfile.athleticAbility}
                  onChange={(e) => setEditedProfile(p => ({ ...p, athleticAbility: parseInt(e.target.value) }))}
                  className="w-full h-1.5 bg-[#333] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FF6B35] [&::-webkit-slider-thumb]:shadow-lg"
                />
              </div>
            </SettingsGroup>
          </div>
        )}

        {/* COACHING VIEW */}
        {currentView === 'coaching' && (
          <div className="animate-in slide-in-from-right duration-200">
            <SectionHeader title="FEEDBACK STYLE" />
            <SettingsGroup>
              <SettingsSegmentRow
                label="Tone"
                value={coachingSettings.feedbackTone}
                options={[
                  { value: 'encouraging', label: 'Encouraging', Icon: Star },
                  { value: 'balanced', label: 'Balanced', Icon: Scale },
                  { value: 'performance', label: 'Performance', Icon: Target }
                ]}
                onChange={(v) => setCoachingSettings(s => ({ ...s, feedbackTone: v as CoachingSettings['feedbackTone'] }))}
              />
              <SettingsSegmentRow
                label="Detail Level"
                value={coachingSettings.complexityLevel}
                options={[
                  { value: 'simple', label: 'Simple' },
                  { value: 'technical', label: 'Technical' },
                  { value: 'data_heavy', label: 'Data-Heavy' }
                ]}
                onChange={(v) => setCoachingSettings(s => ({ ...s, complexityLevel: v as CoachingSettings['complexityLevel'] }))}
                showDivider
              />
            </SettingsGroup>

            <SectionHeader title="ANALYSIS OPTIONS" />
            <SettingsGroup>
              <SettingsToggleRow
                label="Peer Comparisons"
                description="Compare to others in your age group"
                enabled={coachingSettings.showPeerComparisons}
                onChange={(v) => setCoachingSettings(s => ({ ...s, showPeerComparisons: v }))}
              />
              <SettingsToggleRow
                label="Detailed Metrics"
                description="Show exact measurements"
                enabled={coachingSettings.showDetailedMetrics}
                onChange={(v) => setCoachingSettings(s => ({ ...s, showDetailedMetrics: v }))}
                showDivider
              />
            </SettingsGroup>
          </div>
        )}

        {/* COURT VIEW */}
        {currentView === 'court' && (
          <div className="animate-in slide-in-from-right duration-200">
            <SectionHeader title="COURT INFO" />
            <SettingsGroup>
              <SettingsTextInputRow
                label="Court Name"
                value={courtSettings.courtName}
                placeholder="e.g., My Driveway"
                onChange={(v) => setCourtSettings(s => ({ ...s, courtName: v }))}
              />
              <SettingsTextInputRow
                label="Location"
                value={courtSettings.location}
                placeholder="City, State"
                onChange={(v) => setCourtSettings(s => ({ ...s, location: v }))}
                showDivider
              />
            </SettingsGroup>

            <SectionHeader title="COURT TYPE" />
            <SettingsGroup>
              <SettingsSegmentRow
                label="Type"
                value={courtSettings.courtType}
                options={[
                  { value: 'indoor', label: 'Indoor', Icon: Building2 },
                  { value: 'outdoor', label: 'Outdoor', Icon: TreePine },
                  { value: 'home', label: 'Home', Icon: Home }
                ]}
                onChange={(v) => setCourtSettings(s => ({ ...s, courtType: v as CourtSettings['courtType'] }))}
              />
            </SettingsGroup>

            <SectionHeader title="RIM HEIGHT" />
            <SettingsGroup>
              <SettingsSegmentRow
                label="Height"
                value={courtSettings.rimHeight}
                options={[
                  { value: '8ft', label: '8 ft' },
                  { value: '9ft', label: '9 ft' },
                  { value: '10ft', label: '10 ft' }
                ]}
                onChange={(v) => setCourtSettings(s => ({ ...s, rimHeight: v as CourtSettings['rimHeight'] }))}
              />
            </SettingsGroup>
          </div>
        )}

        {/* EQUIPMENT VIEW */}
        {currentView === 'equipment' && (
          <div className="animate-in slide-in-from-right duration-200">
            <SectionHeader title="BALL SIZE" />
            <SettingsGroup>
              <SettingsSegmentRow
                label="Size"
                value={equipmentSettings.ballSize}
                options={[
                  { value: 'youth', label: 'Youth (27.5")' },
                  { value: 'intermediate', label: 'Int (28.5")' },
                  { value: 'full', label: 'Full (29.5")' }
                ]}
                onChange={(v) => setEquipmentSettings(s => ({ ...s, ballSize: v as EquipmentSettings['ballSize'] }))}
              />
            </SettingsGroup>

            <SectionHeader title="POSITION" />
            <SettingsGroup>
              {(['point_guard', 'shooting_guard', 'small_forward', 'power_forward', 'center'] as const).map((pos, i) => (
                <SettingsCheckRow
                  key={pos}
                  label={formatLabel(pos)}
                  checked={equipmentSettings.preferredPosition === pos}
                  onChange={() => setEquipmentSettings(s => ({ ...s, preferredPosition: pos }))}
                  showDivider={i < 4}
                />
              ))}
            </SettingsGroup>
          </div>
        )}

        {/* GOALS VIEW */}
        {currentView === 'goals' && (
          <div className="animate-in slide-in-from-right duration-200">
            <SectionHeader title="TARGET SCORE" />
            <SettingsGroup>
              <div className="px-4 py-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white text-[15px]">Target Overall Score</span>
                  <span className="text-3xl font-bold text-[#FF6B35]">{goalSettings.targetScore}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={goalSettings.targetScore}
                  onChange={(e) => setGoalSettings(s => ({ ...s, targetScore: parseInt(e.target.value) }))}
                  className="w-full h-1.5 bg-[#333] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FF6B35] [&::-webkit-slider-thumb]:shadow-lg"
                />
                <div className="flex justify-between text-xs text-[#666] mt-2">
                  <span>50</span>
                  <span>75</span>
                  <span>100</span>
                </div>
              </div>
            </SettingsGroup>

            <SectionHeader title="FOCUS PRIORITY" />
            <SettingsGroup>
              {([
                { value: 'auto', label: 'Auto-Detect', Icon: Crosshair },
                { value: 'elbow', label: 'Elbow', Icon: Grip },
                { value: 'release', label: 'Release', Icon: Rocket },
                { value: 'follow_through', label: 'Follow Through', Icon: Hand },
                { value: 'balance', label: 'Balance', Icon: Scale },
                { value: 'arc', label: 'Arc', Icon: Rainbow }
              ] as const).map((focus, i) => (
                <SettingsCheckRow
                  key={focus.value}
                  label={focus.label}
                  icon={focus.Icon}
                  checked={goalSettings.focusPriority === focus.value}
                  onChange={() => setGoalSettings(s => ({ ...s, focusPriority: focus.value }))}
                  showDivider={i < 5}
                />
              ))}
            </SettingsGroup>
          </div>
        )}

        {/* NOTIFICATIONS VIEW */}
        {currentView === 'notifications' && (
          <div className="animate-in slide-in-from-right duration-200">
            <SectionHeader title="EMAIL REPORTS" />
            <SettingsGroup>
              <SettingsToggleRow
                label="Weekly Report"
                description="Summary every Monday"
                enabled={notificationSettings.weeklyReportEmail}
                onChange={(v) => setNotificationSettings(s => ({ ...s, weeklyReportEmail: v }))}
              />
              <SettingsToggleRow
                label="Monthly Analysis"
                description="Deep dive with trends"
                enabled={notificationSettings.monthlyReportEmail}
                onChange={(v) => setNotificationSettings(s => ({ ...s, monthlyReportEmail: v }))}
                showDivider
              />
              <SettingsToggleRow
                label="Milestones"
                description="When you earn badges"
                enabled={notificationSettings.milestoneEmail}
                onChange={(v) => setNotificationSettings(s => ({ ...s, milestoneEmail: v }))}
                showDivider
              />
            </SettingsGroup>

            <SectionHeader title="PUSH NOTIFICATIONS" />
            <SettingsGroup>
              <SettingsToggleRow
                label="Coaching Tips"
                description="Training advice"
                enabled={notificationSettings.coachingTipsPush}
                onChange={(v) => setNotificationSettings(s => ({ ...s, coachingTipsPush: v }))}
              />
              <SettingsToggleRow
                label="Motivation"
                description="Stay encouraged"
                enabled={notificationSettings.motivationalMessagesPush}
                onChange={(v) => setNotificationSettings(s => ({ ...s, motivationalMessagesPush: v }))}
                showDivider
              />
              <SettingsToggleRow
                label="Reminders"
                description="Don't miss practice"
                enabled={notificationSettings.reminderPush}
                onChange={(v) => setNotificationSettings(s => ({ ...s, reminderPush: v }))}
                showDivider
              />
            </SettingsGroup>

            <SectionHeader title="FREQUENCY" />
            <SettingsGroup>
              <SettingsSelectRow
                label="Coaching Tips"
                value={notificationSettings.coachingTipsFrequency}
                options={[
                  { value: 'daily', label: 'Daily' },
                  { value: '3x_week', label: '3x per week' },
                  { value: '2x_week', label: '2x per week' },
                  { value: 'weekly', label: 'Weekly' }
                ]}
                onChange={(v) => setNotificationSettings(s => ({ ...s, coachingTipsFrequency: v as NotificationSettings['coachingTipsFrequency'] }))}
              />
            </SettingsGroup>
          </div>
        )}

        {/* DISPLAY VIEW */}
        {currentView === 'display' && (
          <div className="animate-in slide-in-from-right duration-200">
            <SectionHeader title="APPEARANCE" />
            <SettingsGroup>
              {(['dark', 'light', 'system'] as const).map((theme, i) => (
                <SettingsCheckRow
                  key={theme}
                  label={formatLabel(theme)}
                  icon={theme === 'dark' ? Moon : theme === 'light' ? Sun : DeviceIcon}
                  checked={displaySettings.theme === theme}
                  onChange={() => setDisplaySettings(s => ({ ...s, theme }))}
                  showDivider={i < 2}
                />
              ))}
            </SettingsGroup>

            <SectionHeader title="UNITS" />
            <SettingsGroup>
              <SettingsSegmentRow
                label="Measurement"
                value={displaySettings.units}
                options={[
                  { value: 'imperial', label: 'Imperial' },
                  { value: 'metric', label: 'Metric' }
                ]}
                onChange={(v) => setDisplaySettings(s => ({ ...s, units: v as DisplaySettings['units'] }))}
              />
            </SettingsGroup>

            <SectionHeader title="ACCESSIBILITY" />
            <SettingsGroup>
              <SettingsToggleRow
                label="Reduced Motion"
                description="Minimize animations"
                enabled={displaySettings.reducedMotion}
                onChange={(v) => setDisplaySettings(s => ({ ...s, reducedMotion: v }))}
              />
              <SettingsToggleRow
                label="Sound Effects"
                description="Audio feedback"
                enabled={displaySettings.soundEnabled}
                onChange={(v) => setDisplaySettings(s => ({ ...s, soundEnabled: v }))}
                showDivider
              />
            </SettingsGroup>

            <SectionHeader title="TEXT SIZE" />
            <SettingsGroup>
              {(['normal', 'large', 'extra_large'] as const).map((size, i) => (
                <SettingsCheckRow
                  key={size}
                  label={size === 'normal' ? 'Normal' : size === 'large' ? 'Large' : 'Extra Large'}
                  checked={displaySettings.textSize === size}
                  onChange={() => setDisplaySettings(s => ({ ...s, textSize: size }))}
                  showDivider={i < 2}
                />
              ))}
            </SettingsGroup>
          </div>
        )}

        {/* PRIVACY VIEW */}
        {currentView === 'privacy' && (
          <div className="animate-in slide-in-from-right duration-200">
            <SectionHeader title="PROFILE VISIBILITY" />
            <SettingsGroup>
              {([
                { value: 'private', label: 'Private', Icon: EyeOff },
                { value: 'friends', label: 'Friends Only', Icon: Users },
                { value: 'public', label: 'Public', Icon: Eye }
              ] as const).map((vis, i) => (
                <SettingsCheckRow
                  key={vis.value}
                  label={vis.label}
                  icon={vis.Icon}
                  checked={privacySettings.profileVisibility === vis.value}
                  onChange={() => setPrivacySettings(s => ({ ...s, profileVisibility: vis.value }))}
                  showDivider={i < 2}
                />
              ))}
            </SettingsGroup>

            <SectionHeader title="DATA SHARING" />
            <SettingsGroup>
              <SettingsToggleRow
                label="Show on Leaderboards"
                description="Appear in public rankings"
                enabled={privacySettings.showOnLeaderboards}
                onChange={(v) => setPrivacySettings(s => ({ ...s, showOnLeaderboards: v }))}
              />
              <SettingsToggleRow
                label="Peer Comparisons"
                description="Anonymous comparisons"
                enabled={privacySettings.includeInComparisons}
                onChange={(v) => setPrivacySettings(s => ({ ...s, includeInComparisons: v }))}
                showDivider
              />
              <SettingsToggleRow
                label="Share with Coach"
                description="Allow coaches to view"
                enabled={privacySettings.shareWithCoach}
                onChange={(v) => setPrivacySettings(s => ({ ...s, shareWithCoach: v }))}
                showDivider
              />
            </SettingsGroup>
          </div>
        )}

        {/* DATA VIEW */}
        {currentView === 'data' && (
          <div className="animate-in slide-in-from-right duration-200">
            <SectionHeader title="EXPORT" />
            <SettingsGroup>
              <SettingsActionRow
                icon={Download}
                label="Export All Data"
                description="Download as JSON"
              />
            </SettingsGroup>

            <SectionHeader title="MANAGE" />
            <SettingsGroup>
              <SettingsActionRow
                icon={Trash2}
                label="Clear Analysis History"
                description="Remove all past sessions"
                destructive
              />
              <SettingsActionRow
                icon={RotateCcw}
                label="Reset Profile"
                description="Start onboarding again"
                onClick={() => router.push('/onboarding')}
                showDivider
              />
            </SettingsGroup>

            <SectionHeader title="DANGER ZONE" />
            <SettingsGroup>
              <SettingsActionRow
                icon={AlertTriangle}
                label="Delete Account"
                description="Permanently remove all data"
                destructive
              />
            </SettingsGroup>
          </div>
        )}
      </div>
    </main>
  )
}

// ============================================
// HELPER COMPONENTS
// ============================================

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-4 pt-6 pb-2">
      <span className="text-[11px] text-[#666] font-medium tracking-wider uppercase">{title}</span>
    </div>
  )
}

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-4 bg-[#111] rounded-xl border border-white/5 overflow-hidden">
      {children}
    </div>
  )
}

interface SettingsRowProps {
  icon: React.ElementType
  label: string
  value?: string
  onClick?: () => void
  showDivider?: boolean
}

function SettingsRow({ icon: Icon, label, value, onClick, showDivider }: SettingsRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center px-4 py-3.5 active:bg-white/5 relative"
    >
      <Icon className="w-5 h-5 text-[#888] mr-3" />
      <span className="flex-1 text-left text-white text-[15px]">{label}</span>
      {value && <span className="text-[#666] text-[15px] mr-2">{value}</span>}
      <ChevronRight className="w-4 h-4 text-[#444]" />
      {showDivider && <div className="absolute left-12 right-0 bottom-0 h-px bg-white/5" />}
    </button>
  )
}

interface SettingsToggleRowProps {
  label: string
  description?: string
  enabled: boolean
  onChange: (enabled: boolean) => void
  showDivider?: boolean
}

function SettingsToggleRow({ label, description, enabled, onChange, showDivider }: SettingsToggleRowProps) {
  return (
    <div className={`relative flex items-center px-4 py-3.5`}>
      <div className="flex-1 pr-4">
        <p className="text-white text-[15px]">{label}</p>
        {description && <p className="text-[#555] text-[12px] mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-[50px] h-[30px] rounded-full transition-colors flex-shrink-0 ${
          enabled ? 'bg-[#FF6B35]' : 'bg-[#333]'
        }`}
      >
        <div
          className={`absolute top-[3px] w-[24px] h-[24px] rounded-full bg-white shadow-md transition-transform ${
            enabled ? 'translate-x-[23px]' : 'translate-x-[3px]'
          }`}
        />
      </button>
      {showDivider && <div className="absolute left-4 right-0 bottom-0 h-px bg-white/5" />}
    </div>
  )
}

interface SettingsCheckRowProps {
  label: string
  icon?: React.ElementType
  checked: boolean
  onChange: () => void
  showDivider?: boolean
}

function SettingsCheckRow({ label, icon: Icon, checked, onChange, showDivider }: SettingsCheckRowProps) {
  return (
    <button
      onClick={onChange}
      className={`relative w-full flex items-center px-4 py-3.5 active:bg-white/5`}
    >
      {Icon && <Icon className="w-5 h-5 text-[#666] mr-3" />}
      <span className="flex-1 text-left text-white text-[15px]">{label}</span>
      {checked && <Check className="w-5 h-5 text-[#FF6B35]" />}
      {showDivider && <div className="absolute left-4 right-0 bottom-0 h-px bg-white/5" />}
    </button>
  )
}

interface SettingsSelectRowProps {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  showDivider?: boolean
}

function SettingsSelectRow({ label, value, options, onChange, showDivider }: SettingsSelectRowProps) {
  return (
    <div className={`relative flex items-center px-4 py-3.5`}>
      <span className="flex-1 text-white text-[15px]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-[#888] text-[15px] text-right appearance-none cursor-pointer pr-1 focus:outline-none"
      >
        <option value="" className="bg-[#111]">Select...</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-[#111]">{opt.label}</option>
        ))}
      </select>
      <ChevronRight className="w-4 h-4 text-[#444] ml-1" />
      {showDivider && <div className="absolute left-4 right-0 bottom-0 h-px bg-white/5" />}
    </div>
  )
}

interface SettingsSegmentRowProps {
  label: string
  value: string
  options: { value: string; label: string; Icon?: React.ElementType }[]
  onChange: (value: string) => void
  showDivider?: boolean
}

function SettingsSegmentRow({ label, value, options, onChange, showDivider }: SettingsSegmentRowProps) {
  return (
    <div className={`relative px-4 py-3`}>
      <p className="text-[#888] text-[13px] mb-2">{label}</p>
      <div className="flex bg-[#1a1a1a] rounded-lg p-1 gap-1">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-md text-[13px] font-medium transition-all ${
              value === opt.value
                ? 'bg-[#FF6B35] text-white'
                : 'text-[#666] hover:text-white'
            }`}
          >
            {opt.Icon && <opt.Icon className="w-3.5 h-3.5" />}
            {opt.label}
          </button>
        ))}
      </div>
      {showDivider && <div className="absolute left-4 right-0 bottom-0 h-px bg-white/5" />}
    </div>
  )
}

interface SettingsInputRowProps {
  label: string
  type: 'number' | 'height'
  value?: number
  valueFeet?: number
  valueInches?: number
  suffix?: string
  onChange?: (value: number) => void
  onChangeFeet?: (value: number) => void
  onChangeInches?: (value: number) => void
  showDivider?: boolean
}

function SettingsInputRow({ label, type, value, valueFeet, valueInches, suffix, onChange, onChangeFeet, onChangeInches, showDivider }: SettingsInputRowProps) {
  if (type === 'height') {
    return (
      <div className={`relative flex items-center px-4 py-3.5`}>
        <span className="flex-1 text-white text-[15px]">{label}</span>
        <div className="flex items-center gap-2">
          <select
            value={valueFeet || 0}
            onChange={(e) => onChangeFeet?.(parseInt(e.target.value))}
            className="bg-[#1a1a1a] text-white text-[15px] rounded-lg px-3 py-2 focus:outline-none border border-white/10"
          >
            {[4, 5, 6, 7].map(ft => (
              <option key={ft} value={ft}>{ft} ft</option>
            ))}
          </select>
          <select
            value={valueInches || 0}
            onChange={(e) => onChangeInches?.(parseInt(e.target.value))}
            className="bg-[#1a1a1a] text-white text-[15px] rounded-lg px-3 py-2 focus:outline-none border border-white/10"
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(inch => (
              <option key={inch} value={inch}>{inch} in</option>
            ))}
          </select>
        </div>
        {showDivider && <div className="absolute left-4 right-0 bottom-0 h-px bg-white/5" />}
      </div>
    )
  }

  return (
    <div className={`relative flex items-center px-4 py-3.5`}>
      <span className="flex-1 text-white text-[15px]">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange?.(parseInt(e.target.value) || 0)}
          className="w-20 bg-[#1a1a1a] text-white text-[15px] text-right rounded-lg px-3 py-2 focus:outline-none border border-white/10"
          placeholder="0"
        />
        {suffix && <span className="text-[#666] text-[15px]">{suffix}</span>}
      </div>
      {showDivider && <div className="absolute left-4 right-0 bottom-0 h-px bg-white/5" />}
    </div>
  )
}

interface SettingsTextInputRowProps {
  label: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
  showDivider?: boolean
}

function SettingsTextInputRow({ label, value, placeholder, onChange, showDivider }: SettingsTextInputRowProps) {
  return (
    <div className={`relative flex items-center px-4 py-3.5`}>
      <span className="w-24 text-white text-[15px]">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-white text-[15px] text-right focus:outline-none placeholder:text-[#555]"
      />
      {showDivider && <div className="absolute left-4 right-0 bottom-0 h-px bg-white/5" />}
    </div>
  )
}

interface SettingsActionRowProps {
  icon: React.ElementType
  label: string
  description?: string
  onClick?: () => void
  destructive?: boolean
  showDivider?: boolean
}

function SettingsActionRow({ icon: Icon, label, description, onClick, destructive, showDivider }: SettingsActionRowProps) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full flex items-center px-4 py-3.5 active:bg-white/5`}
    >
      <Icon className={`w-5 h-5 mr-3 ${destructive ? 'text-red-500' : 'text-[#888]'}`} />
      <div className="flex-1 text-left">
        <p className={`text-[15px] ${destructive ? 'text-red-500' : 'text-white'}`}>{label}</p>
        {description && <p className="text-[#555] text-[12px] mt-0.5">{description}</p>}
      </div>
      <ChevronRight className={`w-4 h-4 ${destructive ? 'text-red-500/50' : 'text-[#444]'}`} />
      {showDivider && <div className="absolute left-4 right-0 bottom-0 h-px bg-white/5" />}
    </button>
  )
}
