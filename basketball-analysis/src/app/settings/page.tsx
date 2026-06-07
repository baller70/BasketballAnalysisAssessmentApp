"use client"

import React, { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { 
  Settings, 
  Bell, 
  Mail, 
  Clock, 
  Database, 
  RefreshCw, 
  Shield, 
  Calendar,
  Trophy,
  Lightbulb,
  TrendingUp,
  Users,
  Smartphone,
  Save,
  Check,
  X,
  ChevronRight,
  Info,
  User,
  Camera,
  Upload,
  Trash2
} from "lucide-react"
import { useAuthStore } from "@/stores/authStore"

// ============================================
// PHASE 10: SETTINGS & NOTIFICATION PREFERENCES
// ============================================

interface NotificationSettings {
  // Email notifications
  weeklyReportEmail: boolean
  monthlyReportEmail: boolean
  coachAlertEmail: boolean
  milestoneEmail: boolean
  improvementAlertEmail: boolean
  
  // Push notifications
  milestonePush: boolean
  coachingTipsPush: boolean
  improvementAlertPush: boolean
  motivationalMessagesPush: boolean
  reminderPush: boolean
  
  // Frequency settings
  coachingTipsFrequency: 'daily' | '2x_week' | '3x_week' | 'weekly'
  motivationalFrequency: '1x_week' | '2x_week' | 'daily'
  reminderTime: string // HH:MM format
  
  // Report preferences
  reportFormat: 'detailed' | 'summary'
  includeCharts: boolean
  includeComparison: boolean
}

interface AutomationSettings {
  // Daily tasks
  analyticsRefreshEnabled: boolean
  analyticsRefreshTime: string
  dataBackupEnabled: boolean
  dataBackupTime: string
  modelUpdateEnabled: boolean
  
  // Weekly tasks
  weeklyReportEnabled: boolean
  weeklyReportDay: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  weeklyReportTime: string
  coachAlertsEnabled: boolean
  
  // Monthly tasks
  monthlyAnalysisEnabled: boolean
  milestoneNotificationsEnabled: boolean
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  weeklyReportEmail: true,
  monthlyReportEmail: true,
  coachAlertEmail: true,
  milestoneEmail: true,
  improvementAlertEmail: true,
  milestonePush: true,
  coachingTipsPush: true,
  improvementAlertPush: true,
  motivationalMessagesPush: true,
  reminderPush: false,
  coachingTipsFrequency: '2x_week',
  motivationalFrequency: '2x_week',
  reminderTime: '18:00',
  reportFormat: 'detailed',
  includeCharts: true,
  includeComparison: true
}

const DEFAULT_AUTOMATION_SETTINGS: AutomationSettings = {
  analyticsRefreshEnabled: true,
  analyticsRefreshTime: '02:00',
  dataBackupEnabled: true,
  dataBackupTime: '03:00',
  modelUpdateEnabled: true,
  weeklyReportEnabled: true,
  weeklyReportDay: 'monday',
  weeklyReportTime: '08:00',
  coachAlertsEnabled: true,
  monthlyAnalysisEnabled: true,
  milestoneNotificationsEnabled: true
}

const STORAGE_KEY_NOTIFICATIONS = 'basketball_notification_settings'
const STORAGE_KEY_AUTOMATION = 'basketball_automation_settings'

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<'profile' | 'notifications' | 'automation' | 'account'>('profile')
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS)
  const [automationSettings, setAutomationSettings] = useState<AutomationSettings>(DEFAULT_AUTOMATION_SETTINGS)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [hasChanges, setHasChanges] = useState(false)
  
  // Avatar state
  const { user, updateUser } = useAuthStore()
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Load avatar from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAvatar = localStorage.getItem('user_avatar')
      if (storedAvatar) {
        setAvatarPreview(storedAvatar)
      }
    }
  }, [])
  
  // Handle avatar file selection
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB')
        return
      }
      
      // Read and convert to base64
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        setAvatarPreview(base64)
        setHasChanges(true)
      }
      reader.readAsDataURL(file)
    }
  }
  
  // Remove avatar
  const handleRemoveAvatar = () => {
    setAvatarPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setHasChanges(true)
  }
  
  // Get user initials for fallback avatar
  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    }
    if (user?.displayName) {
      const names = user.displayName.split(' ')
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase()
      }
      return user.displayName.substring(0, 2).toUpperCase()
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  // Load settings from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedNotifications = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS)
      const storedAutomation = localStorage.getItem(STORAGE_KEY_AUTOMATION)
      
      if (storedNotifications) {
        try {
          setNotificationSettings(JSON.parse(storedNotifications))
        } catch (e) {
          console.error('Error loading notification settings:', e)
        }
      }
      
      if (storedAutomation) {
        try {
          setAutomationSettings(JSON.parse(storedAutomation))
        } catch (e) {
          console.error('Error loading automation settings:', e)
        }
      }
    }
  }, [])

  // Save settings to localStorage
  const saveSettings = () => {
    setSaveStatus('saving')
    
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notificationSettings))
      localStorage.setItem(STORAGE_KEY_AUTOMATION, JSON.stringify(automationSettings))
      
      // Save avatar
      if (avatarPreview) {
        localStorage.setItem('user_avatar', avatarPreview)
        updateUser({ avatarUrl: avatarPreview })
      } else {
        localStorage.removeItem('user_avatar')
        updateUser({ avatarUrl: undefined })
      }
      
      setSaveStatus('saved')
      setHasChanges(false)
      
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (e) {
      console.error('Error saving settings:', e)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  // Update notification setting
  const updateNotification = <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  // Update automation setting
  const updateAutomation = <K extends keyof AutomationSettings>(key: K, value: AutomationSettings[K]) => {
    setAutomationSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

    return (
    <main className="min-h-screen bg-white py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#E55A2B] flex items-center justify-center shadow-lg shadow-[#FF6B35]/20">
              <Settings className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-[#FF6B35] uppercase tracking-wider">Settings</h1>
              <p className="text-slate-500 text-sm">Manage notifications, automation & preferences</p>
              </div>
            </div>
            
          {/* Save Button */}
              <button
                onClick={saveSettings}
            disabled={!hasChanges || saveStatus === 'saving'}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap shadow-lg shadow-[#FF6B35]/20 ${
              hasChanges 
                ? 'bg-[#FF6B35] text-white hover:bg-[#E55A2B]' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
            }`}
              >
                {saveStatus === 'saving' ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Saving
              </>
                ) : saveStatus === 'saved' ? (
              <>
                <Check className="w-5 h-5" />
                Saved
              </>
            ) : saveStatus === 'error' ? (
              <>
                <X className="w-5 h-5" />
                Error
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save
              </>
            )}
              </button>
          </div>
          
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow-sm rounded-xl p-4 border border-slate-200 sticky top-24">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveSection('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeSection === 'profile'
                      ? 'bg-[#FF6B35]/10 text-[#FF6B35] font-bold border-l-4 border-[#FF6B35]'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium border-l-4 border-transparent'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">Profile & Avatar</span>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </button>
                
                <button
                  onClick={() => setActiveSection('notifications')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeSection === 'notifications'
                      ? 'bg-[#FF6B35]/10 text-[#FF6B35] font-bold border-l-4 border-[#FF6B35]'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium border-l-4 border-transparent'
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  <span className="font-medium">Notifications</span>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </button>
                
                <button
                  onClick={() => setActiveSection('automation')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeSection === 'automation'
                      ? 'bg-[#FF6B35]/10 text-[#FF6B35] font-bold border-l-4 border-[#FF6B35]'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium border-l-4 border-transparent'
                  }`}
                >
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">Automation</span>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </button>
                
                <button
                  onClick={() => setActiveSection('account')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeSection === 'account'
                      ? 'bg-[#FF6B35]/10 text-[#FF6B35] font-bold border-l-4 border-[#FF6B35]'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium border-l-4 border-transparent'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">Data & Privacy</span>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </button>
              </nav>
        </div>
      </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile & Avatar Section */}
        {activeSection === 'profile' && (
              <>
                {/* Avatar Upload */}
                <div className="bg-white shadow-sm rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center border border-[#FF6B35]/20">
                      <Camera className="w-5 h-5 text-[#FF6B35]" />
                    </div>
                  <div>
                      <h2 className="text-lg font-bold text-slate-900">Profile Picture</h2>
                      <p className="text-sm text-slate-500">Upload a photo to personalize your profile</p>
                  </div>
                </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* Avatar Preview */}
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-[#FF6B35] to-[#E55A2B] flex items-center justify-center shadow-lg shadow-[#FF6B35]/20 ring-4 ring-slate-100">
                        {avatarPreview ? (
                          <Image
                            src={avatarPreview}
                            alt="Profile"
                            width={128}
                            height={128}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-slate-900 font-bold text-4xl">{getUserInitials()}</span>
                        )}
                      </div>
                      
                      {/* Camera overlay button */}
                <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-[#FF6B35] hover:bg-[#e55a2b] flex items-center justify-center shadow-lg transition-colors"
                      >
                        <Camera className="w-5 h-5 text-white" />
                </button>
            </div>

                    {/* Upload Controls */}
                    <div className="flex-1 space-y-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      
                      <div className="space-y-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#FF6B35] hover:bg-[#e55a2b] text-white rounded-lg font-semibold transition-colors whitespace-nowrap shadow-md shadow-[#FF6B35]/20"
                        >
                          <Upload className="w-5 h-5" />
                          Upload
                        </button>
                        
                        {avatarPreview && (
                          <button
                            onClick={handleRemoveAvatar}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-semibold transition-colors border border-red-500/30 whitespace-nowrap"
                          >
                            <Trash2 className="w-5 h-5" />
                            Remove
                          </button>
                        )}
                        </div>
                      
                      <p className="text-xs text-slate-400">
                        Recommended: Square image, at least 200x200 pixels. Max file size: 5MB.
                        <br />
                        Supported formats: JPG, PNG, GIF, WebP
                      </p>
                        </div>
                      </div>
                    </div>
                
                {/* Profile Info */}
                <div className="bg-white shadow-sm rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                      <User className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Profile Information</h2>
                      <p className="text-sm text-slate-500">Your account details</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <label className="block text-xs text-slate-500 mb-1">Display Name</label>
                      <p className="text-slate-900 font-medium">{user?.displayName || user?.firstName || 'Not set'}</p>
                    </div>
                    
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <label className="block text-xs text-slate-500 mb-1">Email</label>
                      <p className="text-slate-900 font-medium">{user?.email || 'Not set'}</p>
                    </div>
                    
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <label className="block text-xs text-slate-500 mb-1">Member Since</label>
                      <p className="text-slate-900 font-medium">
                        {user?.createdAt 
                          ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })
                          : 'Unknown'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                    <p className="text-sm text-blue-600 flex items-start gap-2">
                      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      Your profile picture will appear in the navigation menu and throughout the app.
                    </p>
                  </div>
                    </div>
                  </>
            )}
            
            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <>
                {/* Email Notifications */}
                <div className="bg-white shadow-sm rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                      <Mail className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Email Notifications</h2>
                      <p className="text-sm text-slate-500">Choose which emails you want to receive</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <ToggleSetting
                      label="Weekly Performance Reports"
                      description="Receive a summary of your progress every Monday"
                      icon={<Calendar className="w-5 h-5" />}
                      enabled={notificationSettings.weeklyReportEmail}
                      onChange={(v) => updateNotification('weeklyReportEmail', v)}
                    />
                    
                    <ToggleSetting
                      label="Monthly Comprehensive Analysis"
                      description="Detailed monthly report with trends and predictions"
                      icon={<TrendingUp className="w-5 h-5" />}
                      enabled={notificationSettings.monthlyReportEmail}
                      onChange={(v) => updateNotification('monthlyReportEmail', v)}
                    />
                    
                    <ToggleSetting
                      label="Coach Alerts"
                      description="Notifications when your coach provides feedback"
                      icon={<Users className="w-5 h-5" />}
                      enabled={notificationSettings.coachAlertEmail}
                      onChange={(v) => updateNotification('coachAlertEmail', v)}
                    />
                    
                    <ToggleSetting
                      label="Milestone Achievements"
                      description="Celebrate when you reach new achievements"
                      icon={<Trophy className="w-5 h-5" />}
                      enabled={notificationSettings.milestoneEmail}
                      onChange={(v) => updateNotification('milestoneEmail', v)}
                    />
                    
                    <ToggleSetting
                      label="Improvement Alerts"
                      description="Get notified when you make significant progress"
                      icon={<TrendingUp className="w-5 h-5" />}
                      enabled={notificationSettings.improvementAlertEmail}
                      onChange={(v) => updateNotification('improvementAlertEmail', v)}
                      />
                    </div>
                    </div>

                {/* Push Notifications */}
                <div className="bg-white shadow-sm rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center border border-purple-100">
                      <Smartphone className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Push Notifications</h2>
                      <p className="text-sm text-slate-500">Real-time alerts on your device</p>
              </div>
                  </div>
                  
              <div className="space-y-4">
                    <ToggleSetting
                      label="Milestone Achievements"
                      description="Instant notification when you earn a badge"
                      icon={<Trophy className="w-5 h-5" />}
                      enabled={notificationSettings.milestonePush}
                      onChange={(v) => updateNotification('milestonePush', v)}
                    />
                    
                    <ToggleSetting
                      label="Coaching Tips"
                      description="Personalized training advice based on your form"
                      icon={<Lightbulb className="w-5 h-5" />}
                      enabled={notificationSettings.coachingTipsPush}
                      onChange={(v) => updateNotification('coachingTipsPush', v)}
                    />
                    
                    <ToggleSetting
                      label="Improvement Alerts"
                      description="Celebrate your progress in real-time"
                      icon={<TrendingUp className="w-5 h-5" />}
                      enabled={notificationSettings.improvementAlertPush}
                      onChange={(v) => updateNotification('improvementAlertPush', v)}
                    />
                    
                    <ToggleSetting
                      label="Motivational Messages"
                      description="Encouraging messages to keep you motivated"
                      icon={<Bell className="w-5 h-5" />}
                      enabled={notificationSettings.motivationalMessagesPush}
                      onChange={(v) => updateNotification('motivationalMessagesPush', v)}
                    />
                    
                    <ToggleSetting
                      label="Training Reminders"
                      description="Remind you to analyze your shooting form"
                      icon={<Clock className="w-5 h-5" />}
                      enabled={notificationSettings.reminderPush}
                      onChange={(v) => updateNotification('reminderPush', v)}
                    />
                  </div>
                </div>

                {/* Notification Frequency */}
                <div className="bg-white shadow-sm rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100">
                      <Clock className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Notification Frequency</h2>
                      <p className="text-sm text-slate-500">How often you want to receive notifications</p>
                      </div>
                    </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">Coaching Tips Frequency</label>
                        <select
                        value={notificationSettings.coachingTipsFrequency}
                        onChange={(e) => updateNotification('coachingTipsFrequency', e.target.value as NotificationSettings['coachingTipsFrequency'])}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:border-[#FF6B35] focus:outline-none"
                      >
                        <option value="daily">Daily</option>
                        <option value="3x_week">3 times per week</option>
                        <option value="2x_week">2 times per week</option>
                        <option value="weekly">Weekly</option>
                        </select>
                      </div>
                    
                      <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">Motivational Messages Frequency</label>
                        <select
                        value={notificationSettings.motivationalFrequency}
                        onChange={(e) => updateNotification('motivationalFrequency', e.target.value as NotificationSettings['motivationalFrequency'])}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:border-[#FF6B35] focus:outline-none"
                      >
                        <option value="daily">Daily</option>
                        <option value="2x_week">2 times per week</option>
                        <option value="1x_week">Once per week</option>
                        </select>
                      </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">Training Reminder Time</label>
                      <input
                        type="time"
                        value={notificationSettings.reminderTime}
                        onChange={(e) => updateNotification('reminderTime', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:border-[#FF6B35] focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">Report Format</label>
                      <select
                        value={notificationSettings.reportFormat}
                        onChange={(e) => updateNotification('reportFormat', e.target.value as NotificationSettings['reportFormat'])}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:border-[#FF6B35] focus:outline-none"
                      >
                        <option value="detailed">Detailed Report</option>
                        <option value="summary">Quick Summary</option>
                      </select>
                        </div>
                  </div>
                  
                  <div className="mt-6 space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.includeCharts}
                        onChange={(e) => updateNotification('includeCharts', e.target.checked)}
                        className="w-5 h-5 rounded border-slate-200 bg-slate-50 text-[#FF6B35] focus:ring-[#FF6B35]"
                      />
                      <span className="text-slate-900">Include progress charts in reports</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.includeComparison}
                        onChange={(e) => updateNotification('includeComparison', e.target.checked)}
                        className="w-5 h-5 rounded border-slate-200 bg-slate-50 text-[#FF6B35] focus:ring-[#FF6B35]"
                      />
                      <span className="text-slate-900">Include peer comparison in reports</span>
                    </label>
                        </div>
                    </div>
                  </>
            )}

            {/* Automation Section */}
            {activeSection === 'automation' && (
              <>
                {/* Daily Tasks */}
                <div className="bg-white shadow-sm rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center border border-[#FF6B35]/20">
                      <RefreshCw className="w-5 h-5 text-[#FF6B35]" />
                    </div>
                <div>
                      <h2 className="text-lg font-bold text-slate-900">Daily Automated Tasks</h2>
                      <p className="text-sm text-slate-500">Background tasks that run automatically every day</p>
                  </div>
                </div>
                
                  <div className="space-y-6">
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="w-5 h-5 text-blue-400" />
                <div>
                            <h3 className="font-medium text-slate-900">Analytics Refresh</h3>
                            <p className="text-xs text-slate-500">Updates all performance metrics and statistics</p>
                  </div>
                </div>
                        <ToggleSwitch
                          enabled={automationSettings.analyticsRefreshEnabled}
                          onChange={(v) => updateAutomation('analyticsRefreshEnabled', v)}
                        />
              </div>
                      {automationSettings.analyticsRefreshEnabled && (
                        <div className="flex items-center gap-3 mt-3 pl-8">
                          <span className="text-sm text-slate-500">Run at:</span>
                          <input
                            type="time"
                            value={automationSettings.analyticsRefreshTime}
                            onChange={(e) => updateAutomation('analyticsRefreshTime', e.target.value)}
                            className="bg-white shadow-sm border border-slate-200 rounded-lg px-3 py-1 text-slate-900 text-sm focus:border-[#FF6B35] focus:outline-none"
                          />
                          <span className="text-xs text-slate-400">UTC</span>
          </div>
        )}
                    </div>
                    
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Database className="w-5 h-5 text-green-400" />
                <div>
                            <h3 className="font-medium text-slate-900">Data Backup</h3>
                            <p className="text-xs text-slate-500">Protects all your analysis data and results</p>
                          </div>
                        </div>
                        <ToggleSwitch
                          enabled={automationSettings.dataBackupEnabled}
                          onChange={(v) => updateAutomation('dataBackupEnabled', v)}
                        />
                      </div>
                      {automationSettings.dataBackupEnabled && (
                        <div className="flex items-center gap-3 mt-3 pl-8">
                          <span className="text-sm text-slate-500">Run at:</span>
                  <input
                            type="time"
                            value={automationSettings.dataBackupTime}
                            onChange={(e) => updateAutomation('dataBackupTime', e.target.value)}
                            className="bg-white shadow-sm border border-slate-200 rounded-lg px-3 py-1 text-slate-900 text-sm focus:border-[#FF6B35] focus:outline-none"
                          />
                          <span className="text-xs text-slate-400">UTC</span>
                        </div>
                      )}
                </div>
                
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <RefreshCw className="w-5 h-5 text-purple-400" />
                <div>
                            <h3 className="font-medium text-slate-900">Model Updates</h3>
                            <p className="text-xs text-slate-500">Keeps the shooting form detection model accurate</p>
                          </div>
                        </div>
                        <ToggleSwitch
                          enabled={automationSettings.modelUpdateEnabled}
                          onChange={(v) => updateAutomation('modelUpdateEnabled', v)}
                        />
                      </div>
                  </div>
                </div>

                  <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                    <p className="text-sm text-blue-600 flex items-start gap-2">
                      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      Daily tasks run during low-traffic hours (2-4 AM UTC) to ensure optimal performance.
                    </p>
                  </div>
                </div>

                {/* Weekly Tasks */}
                <div className="bg-white shadow-sm rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                      <Calendar className="w-5 h-5 text-blue-500" />
                    </div>
                <div>
                      <h2 className="text-lg font-bold text-slate-900">Weekly Automated Tasks</h2>
                      <p className="text-sm text-slate-500">Reports and alerts generated every week</p>
                  </div>
                </div>
                  
                  <div className="space-y-6">
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-blue-400" />
                          <div>
                            <h3 className="font-medium text-slate-900">Weekly Performance Reports</h3>
                            <p className="text-xs text-slate-500">Comprehensive summary of your weekly progress</p>
              </div>
          </div>
                        <ToggleSwitch
                          enabled={automationSettings.weeklyReportEnabled}
                          onChange={(v) => updateAutomation('weeklyReportEnabled', v)}
                        />
              </div>
                      {automationSettings.weeklyReportEnabled && (
                        <div className="flex flex-wrap items-center gap-3 mt-3 pl-8">
                          <span className="text-sm text-slate-500">Send on:</span>
                          <select
                            value={automationSettings.weeklyReportDay}
                            onChange={(e) => updateAutomation('weeklyReportDay', e.target.value as AutomationSettings['weeklyReportDay'])}
                            className="bg-white shadow-sm border border-slate-200 rounded-lg px-3 py-1 text-slate-900 text-sm focus:border-[#FF6B35] focus:outline-none"
                          >
                            <option value="monday">Monday</option>
                            <option value="tuesday">Tuesday</option>
                            <option value="wednesday">Wednesday</option>
                            <option value="thursday">Thursday</option>
                            <option value="friday">Friday</option>
                            <option value="saturday">Saturday</option>
                            <option value="sunday">Sunday</option>
                          </select>
                          <span className="text-sm text-slate-500">at</span>
                          <input
                            type="time"
                            value={automationSettings.weeklyReportTime}
                            onChange={(e) => updateAutomation('weeklyReportTime', e.target.value)}
                            className="bg-white shadow-sm border border-slate-200 rounded-lg px-3 py-1 text-slate-900 text-sm focus:border-[#FF6B35] focus:outline-none"
                          />
          </div>
        )}
                    </div>
                    
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5 text-green-400" />
                          <div>
                            <h3 className="font-medium text-slate-900">Coach Alerts</h3>
                            <p className="text-xs text-slate-500">Notify coaches about significant player changes</p>
                  </div>
                        </div>
                        <ToggleSwitch
                          enabled={automationSettings.coachAlertsEnabled}
                          onChange={(v) => updateAutomation('coachAlertsEnabled', v)}
                        />
                  </div>
                </div>
              </div>
                </div>

                {/* Monthly Tasks */}
                <div className="bg-white shadow-sm rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-slate-900" />
              </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Monthly Automated Tasks</h2>
                      <p className="text-sm text-slate-500">Deep analysis and milestone tracking</p>
          </div>
                  </div>
                  
                  <div className="space-y-4">
                    <ToggleSetting
                      label="Monthly Comprehensive Analysis"
                      description="Deep dive into long-term trends and predictions"
                      icon={<TrendingUp className="w-5 h-5" />}
                      enabled={automationSettings.monthlyAnalysisEnabled}
                      onChange={(v) => updateAutomation('monthlyAnalysisEnabled', v)}
                    />
                    
                    <ToggleSetting
                      label="Milestone Celebrations"
                      description="Automatic recognition when you achieve milestones"
                      icon={<Trophy className="w-5 h-5" />}
                      enabled={automationSettings.milestoneNotificationsEnabled}
                      onChange={(v) => updateAutomation('milestoneNotificationsEnabled', v)}
                />
              </div>
                </div>

                {/* Automation Status */}
                <div className="bg-gradient-to-r from-green-500/10 via-white to-green-500/10 rounded-xl p-6 border border-green-500/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-6 h-6 text-green-400" />
                </div>
                <div>
                      <h3 className="text-lg font-bold text-slate-900">Automation Status: Active</h3>
                      <p className="text-slate-500 text-sm">All enabled tasks are running on schedule</p>
                </div>
              </div>
                  
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">3</p>
                      <p className="text-xs text-slate-500">Daily Tasks</p>
          </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-400">2</p>
                      <p className="text-xs text-slate-500">Weekly Tasks</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-400">2</p>
                      <p className="text-xs text-slate-500">Monthly Tasks</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Data & Privacy Section */}
            {activeSection === 'account' && (
              <>
                <div className="bg-white shadow-sm rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                      <Database className="w-5 h-5 text-slate-900" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Data Management</h2>
                      <p className="text-sm text-slate-500">Manage your analysis data and history</p>
                    </div>
                  </div>
                  
              <div className="space-y-4">
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="flex items-center justify-between">
                <div>
                          <h3 className="font-medium text-slate-900">Export All Data</h3>
                          <p className="text-xs text-slate-500">Download all your analysis data as JSON</p>
                        </div>
                        <button className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg text-sm font-medium transition-colors">
                          Export
                        </button>
                  </div>
                </div>
                
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="flex items-center justify-between">
                <div>
                          <h3 className="font-medium text-slate-900">Clear Analysis History</h3>
                          <p className="text-xs text-slate-500">Remove all past analysis sessions</p>
                        </div>
                        <button className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-500/30 whitespace-nowrap">
                          Clear
                    </button>
                  </div>
                </div>
                    
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="flex items-center justify-between">
                <div>
                          <h3 className="font-medium text-slate-900">Reset All Settings</h3>
                          <p className="text-xs text-slate-500">Restore default notification and automation settings</p>
                        </div>
                      <button
                        onClick={() => {
                            setNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS)
                            setAutomationSettings(DEFAULT_AUTOMATION_SETTINGS)
                          setHasChanges(true)
                        }}
                          className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg text-sm font-medium transition-colors border border-orange-500/30"
                        >
                          Reset
                      </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white shadow-sm rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-slate-900" />
                </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Privacy</h2>
                      <p className="text-sm text-slate-500">Control how your data is used</p>
              </div>
          </div>
                  
                  <div className="space-y-4">
                    <ToggleSetting
                      label="Allow Anonymous Analytics"
                      description="Help improve the app by sharing anonymous usage data"
                      icon={<TrendingUp className="w-5 h-5" />}
                      enabled={true}
                      onChange={() => {}}
                    />
                    
                    <ToggleSetting
                      label="Include in Peer Comparisons"
                      description="Allow your scores to be used in anonymous comparisons"
                      icon={<Users className="w-5 h-5" />}
                      enabled={true}
                      onChange={() => {}}
                    />
                    
                    <ToggleSetting
                      label="Share Progress with Coach"
                      description="Allow assigned coaches to view your analysis data"
                      icon={<Users className="w-5 h-5" />}
                      enabled={true}
                      onChange={() => {}}
                />
              </div>
          </div>

                {/* Storage Info */}
                <div className="bg-white shadow-sm rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Database className="w-5 h-5 text-[#FF6B35]" />
                    <h3 className="font-bold text-slate-900">Storage Usage</h3>
                    </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-500">Local Storage</span>
                        <span className="text-slate-900">2.4 MB / 5 MB</span>
                    </div>
                      <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF4500] rounded-full" style={{ width: '48%' }}></div>
                    </div>
                  </div>
                    
                    <p className="text-xs text-slate-400">
                      Analysis sessions and settings are stored locally on your device.
                    </p>
                    </div>
                    </div>
              </>
            )}
                  </div>
              </div>
      </div>
    </main>
  )
}

// ============================================
// HELPER COMPONENTS
// ============================================

interface ToggleSettingProps {
  label: string
  description: string
  icon: React.ReactNode
  enabled: boolean
  onChange: (enabled: boolean) => void
}

function ToggleSetting({ label, description, icon, enabled, onChange }: ToggleSettingProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-200 last:border-0">
        <div className="flex items-center gap-3">
        <div className="text-slate-500">{icon}</div>
          <div>
          <h3 className="font-medium text-slate-900">{label}</h3>
          <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
      <ToggleSwitch enabled={enabled} onChange={onChange} />
    </div>
  )
}

interface ToggleSwitchProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
}

function ToggleSwitch({ enabled, onChange }: ToggleSwitchProps) {
  return (
      <button
        onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        enabled ? 'bg-[#FF6B35]' : 'bg-slate-200'
        }`}
      >
        <div
        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
  )
}

