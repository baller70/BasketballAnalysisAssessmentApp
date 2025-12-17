"use client"

import React, { useState, useEffect } from "react"
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
  Info
} from "lucide-react"

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
  const [activeSection, setActiveSection] = useState<'notifications' | 'automation' | 'account'>('notifications')
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS)
  const [automationSettings, setAutomationSettings] = useState<AutomationSettings>(DEFAULT_AUTOMATION_SETTINGS)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [hasChanges, setHasChanges] = useState(false)

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
    <main className="min-h-screen bg-[#1a1a1a] py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center">
              <Settings className="w-7 h-7 text-[#1a1a1a]" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-[#FFD700] uppercase tracking-wider">Settings</h1>
              <p className="text-[#888] text-sm">Manage notifications, automation & preferences</p>
            </div>
          </div>
          
          {/* Save Button */}
          <button
            onClick={saveSettings}
            disabled={!hasChanges || saveStatus === 'saving'}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${
              hasChanges 
                ? 'bg-[#FFD700] text-[#1a1a1a] hover:bg-[#e6c200]' 
                : 'bg-[#3a3a3a] text-[#888] cursor-not-allowed'
            }`}
          >
            {saveStatus === 'saving' ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <Check className="w-5 h-5" />
                Saved!
              </>
            ) : saveStatus === 'error' ? (
              <>
                <X className="w-5 h-5" />
                Error
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-[#2C2C2C] rounded-xl p-4 border border-[#3a3a3a] sticky top-24">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveSection('notifications')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeSection === 'notifications'
                      ? 'bg-[#FFD700] text-[#1a1a1a]'
                      : 'text-[#E5E5E5] hover:bg-[#3a3a3a]'
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  <span className="font-medium">Notifications</span>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </button>
                
                <button
                  onClick={() => setActiveSection('automation')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeSection === 'automation'
                      ? 'bg-[#FFD700] text-[#1a1a1a]'
                      : 'text-[#E5E5E5] hover:bg-[#3a3a3a]'
                  }`}
                >
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">Automation</span>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </button>
                
                <button
                  onClick={() => setActiveSection('account')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeSection === 'account'
                      ? 'bg-[#FFD700] text-[#1a1a1a]'
                      : 'text-[#E5E5E5] hover:bg-[#3a3a3a]'
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
            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <>
                {/* Email Notifications */}
                <div className="bg-[#2C2C2C] rounded-xl p-6 border border-[#3a3a3a]">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#E5E5E5]">Email Notifications</h2>
                      <p className="text-sm text-[#888]">Choose which emails you want to receive</p>
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
                <div className="bg-[#2C2C2C] rounded-xl p-6 border border-[#3a3a3a]">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#E5E5E5]">Push Notifications</h2>
                      <p className="text-sm text-[#888]">Real-time alerts on your device</p>
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
                <div className="bg-[#2C2C2C] rounded-xl p-6 border border-[#3a3a3a]">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#E5E5E5]">Notification Frequency</h2>
                      <p className="text-sm text-[#888]">How often you want to receive notifications</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#E5E5E5] mb-2">Coaching Tips Frequency</label>
                      <select
                        value={notificationSettings.coachingTipsFrequency}
                        onChange={(e) => updateNotification('coachingTipsFrequency', e.target.value as NotificationSettings['coachingTipsFrequency'])}
                        className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-4 py-3 text-[#E5E5E5] focus:border-[#FFD700] focus:outline-none"
                      >
                        <option value="daily">Daily</option>
                        <option value="3x_week">3 times per week</option>
                        <option value="2x_week">2 times per week</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#E5E5E5] mb-2">Motivational Messages Frequency</label>
                      <select
                        value={notificationSettings.motivationalFrequency}
                        onChange={(e) => updateNotification('motivationalFrequency', e.target.value as NotificationSettings['motivationalFrequency'])}
                        className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-4 py-3 text-[#E5E5E5] focus:border-[#FFD700] focus:outline-none"
                      >
                        <option value="daily">Daily</option>
                        <option value="2x_week">2 times per week</option>
                        <option value="1x_week">Once per week</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#E5E5E5] mb-2">Training Reminder Time</label>
                      <input
                        type="time"
                        value={notificationSettings.reminderTime}
                        onChange={(e) => updateNotification('reminderTime', e.target.value)}
                        className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-4 py-3 text-[#E5E5E5] focus:border-[#FFD700] focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#E5E5E5] mb-2">Report Format</label>
                      <select
                        value={notificationSettings.reportFormat}
                        onChange={(e) => updateNotification('reportFormat', e.target.value as NotificationSettings['reportFormat'])}
                        className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-4 py-3 text-[#E5E5E5] focus:border-[#FFD700] focus:outline-none"
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
                        className="w-5 h-5 rounded border-[#3a3a3a] bg-[#1a1a1a] text-[#FFD700] focus:ring-[#FFD700]"
                      />
                      <span className="text-[#E5E5E5]">Include progress charts in reports</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.includeComparison}
                        onChange={(e) => updateNotification('includeComparison', e.target.checked)}
                        className="w-5 h-5 rounded border-[#3a3a3a] bg-[#1a1a1a] text-[#FFD700] focus:ring-[#FFD700]"
                      />
                      <span className="text-[#E5E5E5]">Include peer comparison in reports</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Automation Section */}
            {activeSection === 'automation' && (
              <>
                {/* Daily Tasks */}
                <div className="bg-[#2C2C2C] rounded-xl p-6 border border-[#3a3a3a]">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#E5E5E5]">Daily Automated Tasks</h2>
                      <p className="text-sm text-[#888]">Background tasks that run automatically every day</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="w-5 h-5 text-blue-400" />
                          <div>
                            <h3 className="font-medium text-[#E5E5E5]">Analytics Refresh</h3>
                            <p className="text-xs text-[#888]">Updates all performance metrics and statistics</p>
                          </div>
                        </div>
                        <ToggleSwitch
                          enabled={automationSettings.analyticsRefreshEnabled}
                          onChange={(v) => updateAutomation('analyticsRefreshEnabled', v)}
                        />
                      </div>
                      {automationSettings.analyticsRefreshEnabled && (
                        <div className="flex items-center gap-3 mt-3 pl-8">
                          <span className="text-sm text-[#888]">Run at:</span>
                          <input
                            type="time"
                            value={automationSettings.analyticsRefreshTime}
                            onChange={(e) => updateAutomation('analyticsRefreshTime', e.target.value)}
                            className="bg-[#2C2C2C] border border-[#3a3a3a] rounded-lg px-3 py-1 text-[#E5E5E5] text-sm focus:border-[#FFD700] focus:outline-none"
                          />
                          <span className="text-xs text-[#666]">UTC</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Database className="w-5 h-5 text-green-400" />
                          <div>
                            <h3 className="font-medium text-[#E5E5E5]">Data Backup</h3>
                            <p className="text-xs text-[#888]">Protects all your analysis data and results</p>
                          </div>
                        </div>
                        <ToggleSwitch
                          enabled={automationSettings.dataBackupEnabled}
                          onChange={(v) => updateAutomation('dataBackupEnabled', v)}
                        />
                      </div>
                      {automationSettings.dataBackupEnabled && (
                        <div className="flex items-center gap-3 mt-3 pl-8">
                          <span className="text-sm text-[#888]">Run at:</span>
                          <input
                            type="time"
                            value={automationSettings.dataBackupTime}
                            onChange={(e) => updateAutomation('dataBackupTime', e.target.value)}
                            className="bg-[#2C2C2C] border border-[#3a3a3a] rounded-lg px-3 py-1 text-[#E5E5E5] text-sm focus:border-[#FFD700] focus:outline-none"
                          />
                          <span className="text-xs text-[#666]">UTC</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <RefreshCw className="w-5 h-5 text-purple-400" />
                          <div>
                            <h3 className="font-medium text-[#E5E5E5]">Model Updates</h3>
                            <p className="text-xs text-[#888]">Keeps the shooting form detection model accurate</p>
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
                    <p className="text-sm text-blue-300 flex items-start gap-2">
                      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      Daily tasks run during low-traffic hours (2-4 AM UTC) to ensure optimal performance.
                    </p>
                  </div>
                </div>

                {/* Weekly Tasks */}
                <div className="bg-[#2C2C2C] rounded-xl p-6 border border-[#3a3a3a]">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#E5E5E5]">Weekly Automated Tasks</h2>
                      <p className="text-sm text-[#888]">Reports and alerts generated every week</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-blue-400" />
                          <div>
                            <h3 className="font-medium text-[#E5E5E5]">Weekly Performance Reports</h3>
                            <p className="text-xs text-[#888]">Comprehensive summary of your weekly progress</p>
                          </div>
                        </div>
                        <ToggleSwitch
                          enabled={automationSettings.weeklyReportEnabled}
                          onChange={(v) => updateAutomation('weeklyReportEnabled', v)}
                        />
                      </div>
                      {automationSettings.weeklyReportEnabled && (
                        <div className="flex flex-wrap items-center gap-3 mt-3 pl-8">
                          <span className="text-sm text-[#888]">Send on:</span>
                          <select
                            value={automationSettings.weeklyReportDay}
                            onChange={(e) => updateAutomation('weeklyReportDay', e.target.value as AutomationSettings['weeklyReportDay'])}
                            className="bg-[#2C2C2C] border border-[#3a3a3a] rounded-lg px-3 py-1 text-[#E5E5E5] text-sm focus:border-[#FFD700] focus:outline-none"
                          >
                            <option value="monday">Monday</option>
                            <option value="tuesday">Tuesday</option>
                            <option value="wednesday">Wednesday</option>
                            <option value="thursday">Thursday</option>
                            <option value="friday">Friday</option>
                            <option value="saturday">Saturday</option>
                            <option value="sunday">Sunday</option>
                          </select>
                          <span className="text-sm text-[#888]">at</span>
                          <input
                            type="time"
                            value={automationSettings.weeklyReportTime}
                            onChange={(e) => updateAutomation('weeklyReportTime', e.target.value)}
                            className="bg-[#2C2C2C] border border-[#3a3a3a] rounded-lg px-3 py-1 text-[#E5E5E5] text-sm focus:border-[#FFD700] focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5 text-green-400" />
                          <div>
                            <h3 className="font-medium text-[#E5E5E5]">Coach Alerts</h3>
                            <p className="text-xs text-[#888]">Notify coaches about significant player changes</p>
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
                <div className="bg-[#2C2C2C] rounded-xl p-6 border border-[#3a3a3a]">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#E5E5E5]">Monthly Automated Tasks</h2>
                      <p className="text-sm text-[#888]">Deep analysis and milestone tracking</p>
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
                <div className="bg-gradient-to-r from-green-500/10 via-[#2C2C2C] to-green-500/10 rounded-xl p-6 border border-green-500/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#E5E5E5]">Automation Status: Active</h3>
                      <p className="text-[#888] text-sm">All enabled tasks are running on schedule</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">3</p>
                      <p className="text-xs text-[#888]">Daily Tasks</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-400">2</p>
                      <p className="text-xs text-[#888]">Weekly Tasks</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-400">2</p>
                      <p className="text-xs text-[#888]">Monthly Tasks</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Data & Privacy Section */}
            {activeSection === 'account' && (
              <>
                <div className="bg-[#2C2C2C] rounded-xl p-6 border border-[#3a3a3a]">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                      <Database className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#E5E5E5]">Data Management</h2>
                      <p className="text-sm text-[#888]">Manage your analysis data and history</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-[#E5E5E5]">Export All Data</h3>
                          <p className="text-xs text-[#888]">Download all your analysis data as JSON</p>
                        </div>
                        <button className="px-4 py-2 bg-[#3a3a3a] hover:bg-[#4a4a4a] text-[#E5E5E5] rounded-lg text-sm font-medium transition-colors">
                          Export
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-[#E5E5E5]">Clear Analysis History</h3>
                          <p className="text-xs text-[#888]">Remove all past analysis sessions</p>
                        </div>
                        <button className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-500/30">
                          Clear History
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-[#E5E5E5]">Reset All Settings</h3>
                          <p className="text-xs text-[#888]">Restore default notification and automation settings</p>
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

                <div className="bg-[#2C2C2C] rounded-xl p-6 border border-[#3a3a3a]">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#E5E5E5]">Privacy</h2>
                      <p className="text-sm text-[#888]">Control how your data is used</p>
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
                <div className="bg-[#2C2C2C] rounded-xl p-6 border border-[#3a3a3a]">
                  <div className="flex items-center gap-3 mb-4">
                    <Database className="w-5 h-5 text-[#FFD700]" />
                    <h3 className="font-bold text-[#E5E5E5]">Storage Usage</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[#888]">Local Storage</span>
                        <span className="text-[#E5E5E5]">2.4 MB / 5 MB</span>
                      </div>
                      <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-full" style={{ width: '48%' }}></div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-[#666]">
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
    <div className="flex items-center justify-between py-3 border-b border-[#3a3a3a] last:border-0">
      <div className="flex items-center gap-3">
        <div className="text-[#888]">{icon}</div>
        <div>
          <h3 className="font-medium text-[#E5E5E5]">{label}</h3>
          <p className="text-xs text-[#888]">{description}</p>
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
        enabled ? 'bg-[#FFD700]' : 'bg-[#3a3a3a]'
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

