// Phase 10: Notification & Automation Service
// Handles scheduled tasks, notifications, and automated workflows

// ============================================
// TYPES & INTERFACES
// ============================================

export interface NotificationSettings {
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
  reminderTime: string
  
  // Report preferences
  reportFormat: 'detailed' | 'summary'
  includeCharts: boolean
  includeComparison: boolean
}

export interface AutomationSettings {
  analyticsRefreshEnabled: boolean
  analyticsRefreshTime: string
  dataBackupEnabled: boolean
  dataBackupTime: string
  modelUpdateEnabled: boolean
  weeklyReportEnabled: boolean
  weeklyReportDay: string
  weeklyReportTime: string
  coachAlertsEnabled: boolean
  monthlyAnalysisEnabled: boolean
  milestoneNotificationsEnabled: boolean
}

export interface ScheduledTask {
  id: string
  name: string
  type: 'daily' | 'weekly' | 'monthly' | 'immediate'
  time?: string // HH:MM format
  day?: string // For weekly tasks
  enabled: boolean
  lastRun?: string // ISO date string
  nextRun?: string // ISO date string
  status: 'pending' | 'running' | 'completed' | 'failed'
}

export interface Notification {
  id: string
  type: 'milestone' | 'improvement' | 'coaching_tip' | 'motivational' | 'reminder' | 'report' | 'alert'
  title: string
  message: string
  timestamp: string
  read: boolean
  actionUrl?: string
  icon?: string
}

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEY_NOTIFICATIONS = 'basketball_notification_settings'
const STORAGE_KEY_AUTOMATION = 'basketball_automation_settings'
const STORAGE_KEY_NOTIFICATION_HISTORY = 'basketball_notification_history'
const STORAGE_KEY_SCHEDULED_TASKS = 'basketball_scheduled_tasks'

// ============================================
// DEFAULT SETTINGS
// ============================================

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
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

export const DEFAULT_AUTOMATION_SETTINGS: AutomationSettings = {
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

// ============================================
// SETTINGS MANAGEMENT
// ============================================

export function getNotificationSettings(): NotificationSettings {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_SETTINGS
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS)
    if (stored) {
      return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(stored) }
    }
  } catch (e) {
    console.error('Error loading notification settings:', e)
  }
  
  return DEFAULT_NOTIFICATION_SETTINGS
}

export function saveNotificationSettings(settings: NotificationSettings): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(settings))
    return true
  } catch (e) {
    console.error('Error saving notification settings:', e)
    return false
  }
}

export function getAutomationSettings(): AutomationSettings {
  if (typeof window === 'undefined') return DEFAULT_AUTOMATION_SETTINGS
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY_AUTOMATION)
    if (stored) {
      return { ...DEFAULT_AUTOMATION_SETTINGS, ...JSON.parse(stored) }
    }
  } catch (e) {
    console.error('Error loading automation settings:', e)
  }
  
  return DEFAULT_AUTOMATION_SETTINGS
}

export function saveAutomationSettings(settings: AutomationSettings): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    localStorage.setItem(STORAGE_KEY_AUTOMATION, JSON.stringify(settings))
    return true
  } catch (e) {
    console.error('Error saving automation settings:', e)
    return false
  }
}

// ============================================
// NOTIFICATION HISTORY
// ============================================

export function getNotificationHistory(): Notification[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY_NOTIFICATION_HISTORY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Error loading notification history:', e)
  }
  
  return []
}

export function addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Notification {
  const newNotification: Notification = {
    ...notification,
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    read: false
  }
  
  const history = getNotificationHistory()
  history.unshift(newNotification)
  
  // Keep only last 100 notifications
  const trimmed = history.slice(0, 100)
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_NOTIFICATION_HISTORY, JSON.stringify(trimmed))
  }
  
  return newNotification
}

export function markNotificationRead(notificationId: string): boolean {
  const history = getNotificationHistory()
  const index = history.findIndex(n => n.id === notificationId)
  
  if (index >= 0) {
    history[index].read = true
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_NOTIFICATION_HISTORY, JSON.stringify(history))
    }
    return true
  }
  
  return false
}

export function markAllNotificationsRead(): void {
  const history = getNotificationHistory()
  history.forEach(n => n.read = true)
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_NOTIFICATION_HISTORY, JSON.stringify(history))
  }
}

export function getUnreadCount(): number {
  return getNotificationHistory().filter(n => !n.read).length
}

export function clearNotificationHistory(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_NOTIFICATION_HISTORY)
  }
}

// ============================================
// NOTIFICATION GENERATORS
// ============================================

export function generateMilestoneNotification(
  milestoneName: string,
  milestoneDescription: string,
  icon: string
): Notification {
  return addNotification({
    type: 'milestone',
    title: `🏆 ${milestoneName}!`,
    message: milestoneDescription,
    icon,
    actionUrl: '/results/demo?tab=history&view=milestones'
  })
}

export function generateImprovementNotification(
  metric: string,
  improvement: number,
  previousValue: number,
  currentValue: number
): Notification {
  const direction = improvement > 0 ? 'improved' : 'changed'
  const emoji = improvement > 0 ? '📈' : '📊'
  
  return addNotification({
    type: 'improvement',
    title: `${emoji} ${metric} ${direction}!`,
    message: `Your ${metric.toLowerCase()} ${direction} by ${Math.abs(improvement).toFixed(1)}% (${previousValue} → ${currentValue})`,
    actionUrl: '/results/demo?tab=history'
  })
}

export function generateCoachingTipNotification(
  tipTitle: string,
  tipContent: string,
  drillName?: string
): Notification {
  return addNotification({
    type: 'coaching_tip',
    title: `💡 ${tipTitle}`,
    message: tipContent,
    actionUrl: drillName ? '/results/demo?tab=training' : '/results/demo?tab=flaws'
  })
}

export function generateMotivationalNotification(
  message: string
): Notification {
  const emojis = ['💪', '🔥', '⭐', '🎯', '🏀']
  const emoji = emojis[Math.floor(Math.random() * emojis.length)]
  
  return addNotification({
    type: 'motivational',
    title: `${emoji} Keep Going!`,
    message,
    actionUrl: '/results/demo'
  })
}

export function generateReminderNotification(): Notification {
  return addNotification({
    type: 'reminder',
    title: '🏀 Time to Train!',
    message: "Don't forget to analyze your shooting form today. Consistent practice leads to consistent improvement!",
    actionUrl: '/'
  })
}

export function generateWeeklyReportNotification(
  weekSummary: {
    analysesCount: number
    averageScore: number
    improvement: number
  }
): Notification {
  const trend = weekSummary.improvement > 0 ? '↑' : weekSummary.improvement < 0 ? '↓' : '→'
  
  return addNotification({
    type: 'report',
    title: '📊 Weekly Report Ready',
    message: `You completed ${weekSummary.analysesCount} analyses this week with an average score of ${weekSummary.averageScore}% (${trend}${Math.abs(weekSummary.improvement)}%)`,
    actionUrl: '/results/demo?tab=history'
  })
}

export function generateCoachAlertNotification(
  playerName: string,
  alertType: 'improvement' | 'decline' | 'milestone',
  details: string
): Notification {
  const icons = {
    improvement: '✅',
    decline: '⚠️',
    milestone: '🏆'
  }
  
  return addNotification({
    type: 'alert',
    title: `${icons[alertType]} Coach Alert: ${playerName}`,
    message: details,
    actionUrl: '/results/demo?tab=assessment'
  })
}

// ============================================
// SCHEDULED TASKS
// ============================================

export function getScheduledTasks(): ScheduledTask[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SCHEDULED_TASKS)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Error loading scheduled tasks:', e)
  }
  
  // Return default tasks
  return generateDefaultTasks()
}

function generateDefaultTasks(): ScheduledTask[] {
  const settings = getAutomationSettings()
  const now = new Date()
  
  return [
    {
      id: 'analytics_refresh',
      name: 'Analytics Refresh',
      type: 'daily',
      time: settings.analyticsRefreshTime,
      enabled: settings.analyticsRefreshEnabled,
      status: 'pending',
      nextRun: getNextRunTime('daily', settings.analyticsRefreshTime)
    },
    {
      id: 'data_backup',
      name: 'Data Backup',
      type: 'daily',
      time: settings.dataBackupTime,
      enabled: settings.dataBackupEnabled,
      status: 'pending',
      nextRun: getNextRunTime('daily', settings.dataBackupTime)
    },
    {
      id: 'model_update',
      name: 'Model Update',
      type: 'daily',
      time: '04:00',
      enabled: settings.modelUpdateEnabled,
      status: 'pending',
      nextRun: getNextRunTime('daily', '04:00')
    },
    {
      id: 'weekly_report',
      name: 'Weekly Performance Report',
      type: 'weekly',
      time: settings.weeklyReportTime,
      day: settings.weeklyReportDay,
      enabled: settings.weeklyReportEnabled,
      status: 'pending',
      nextRun: getNextRunTime('weekly', settings.weeklyReportTime, settings.weeklyReportDay)
    },
    {
      id: 'coach_alerts',
      name: 'Coach Alerts',
      type: 'weekly',
      time: settings.weeklyReportTime,
      day: settings.weeklyReportDay,
      enabled: settings.coachAlertsEnabled,
      status: 'pending',
      nextRun: getNextRunTime('weekly', settings.weeklyReportTime, settings.weeklyReportDay)
    },
    {
      id: 'monthly_analysis',
      name: 'Monthly Comprehensive Analysis',
      type: 'monthly',
      enabled: settings.monthlyAnalysisEnabled,
      status: 'pending',
      nextRun: getNextRunTime('monthly', '09:00')
    }
  ]
}

function getNextRunTime(type: 'daily' | 'weekly' | 'monthly', time: string, day?: string): string {
  const now = new Date()
  const [hours, minutes] = time.split(':').map(Number)
  
  const next = new Date(now)
  next.setHours(hours, minutes, 0, 0)
  
  if (type === 'daily') {
    if (next <= now) {
      next.setDate(next.getDate() + 1)
    }
  } else if (type === 'weekly' && day) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const targetDay = days.indexOf(day.toLowerCase())
    const currentDay = now.getDay()
    
    let daysUntilTarget = targetDay - currentDay
    if (daysUntilTarget <= 0 || (daysUntilTarget === 0 && next <= now)) {
      daysUntilTarget += 7
    }
    
    next.setDate(next.getDate() + daysUntilTarget)
  } else if (type === 'monthly') {
    next.setDate(1)
    if (next <= now) {
      next.setMonth(next.getMonth() + 1)
    }
  }
  
  return next.toISOString()
}

export function updateTaskStatus(taskId: string, status: ScheduledTask['status']): void {
  const tasks = getScheduledTasks()
  const index = tasks.findIndex(t => t.id === taskId)
  
  if (index >= 0) {
    tasks[index].status = status
    if (status === 'completed') {
      tasks[index].lastRun = new Date().toISOString()
      // Calculate next run
      const task = tasks[index]
      if (task.time) {
        tasks[index].nextRun = getNextRunTime(task.type, task.time, task.day)
      }
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_SCHEDULED_TASKS, JSON.stringify(tasks))
    }
  }
}

// ============================================
// COACHING TIPS CONTENT
// ============================================

const COACHING_TIPS = [
  {
    title: 'Elbow Alignment',
    content: 'Keep your shooting elbow directly under the ball. Imagine a straight line from your elbow to your wrist to the ball.',
    drill: 'Elbow In Challenge'
  },
  {
    title: 'Follow-Through',
    content: 'Hold your follow-through until the ball hits the rim. Your fingers should be pointing down like reaching into a cookie jar.',
    drill: 'Cookie Jar Drill'
  },
  {
    title: 'Knee Bend',
    content: 'Power comes from your legs. Bend your knees about 45 degrees before each shot to generate consistent power.',
    drill: 'Knee Bend Progression'
  },
  {
    title: 'Release Point',
    content: 'Release the ball at the peak of your jump for maximum consistency. This gives you the most control over your shot.',
    drill: 'Peak Release Drill'
  },
  {
    title: 'Arc Trajectory',
    content: 'Aim for a 45-52 degree arc on your shot. Higher arc means a larger target area when the ball reaches the rim.',
    drill: 'Arc Trajectory Builder'
  },
  {
    title: 'Balance',
    content: 'Land in the same spot you jumped from. If you drift, your shot will be inconsistent.',
    drill: 'Balance Board Shooting'
  },
  {
    title: 'Eye Focus',
    content: 'Pick a spot on the rim and focus on it throughout your shot. Many shooters focus on the back of the rim.',
    drill: 'Target Focus Drill'
  },
  {
    title: 'Rhythm',
    content: 'Develop a consistent shooting rhythm. Your legs, core, and arms should work together in one fluid motion.',
    drill: 'Rhythm Shooting'
  }
]

export function getRandomCoachingTip(): { title: string; content: string; drill: string } {
  return COACHING_TIPS[Math.floor(Math.random() * COACHING_TIPS.length)]
}

// ============================================
// MOTIVATIONAL MESSAGES
// ============================================

const MOTIVATIONAL_MESSAGES = [
  "Every shot you analyze is a step toward perfection. Keep going!",
  "Consistency is key. You're building habits that will last a lifetime.",
  "The best shooters weren't born that way—they practiced. You're on the right path!",
  "Your dedication to improving shows. That's what separates good from great.",
  "Small improvements add up. Trust the process!",
  "Champions are made when no one is watching. Keep putting in the work!",
  "Your form is getting better with each analysis. Don't stop now!",
  "The greats never stopped learning. Neither should you!",
  "Progress isn't always linear, but you're moving in the right direction.",
  "Your commitment to improvement is inspiring. Keep shooting!"
]

export function getRandomMotivationalMessage(): string {
  return MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)]
}

// ============================================
// TRIGGER NOTIFICATIONS (Called from app)
// ============================================

export function triggerCoachingTipNotification(): void {
  const settings = getNotificationSettings()
  if (!settings.coachingTipsPush) return
  
  const tip = getRandomCoachingTip()
  generateCoachingTipNotification(tip.title, tip.content, tip.drill)
}

export function triggerMotivationalNotification(): void {
  const settings = getNotificationSettings()
  if (!settings.motivationalMessagesPush) return
  
  const message = getRandomMotivationalMessage()
  generateMotivationalNotification(message)
}

export function triggerReminderNotification(): void {
  const settings = getNotificationSettings()
  if (!settings.reminderPush) return
  
  generateReminderNotification()
}

// ============================================
// CHECK FOR IMPROVEMENT (Called after analysis)
// ============================================

export function checkForImprovementNotification(
  previousScore: number,
  currentScore: number,
  metric: string = 'Overall Score'
): void {
  const settings = getNotificationSettings()
  if (!settings.improvementAlertPush) return
  
  const improvement = currentScore - previousScore
  const percentChange = previousScore > 0 ? (improvement / previousScore) * 100 : 0
  
  // Only notify if improvement is significant (> 5%)
  if (percentChange >= 5) {
    generateImprovementNotification(metric, percentChange, previousScore, currentScore)
  }
}

