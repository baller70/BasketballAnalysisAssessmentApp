"use client"

/**
 * /settings — canonical settings hub in the 096-web-profile-settings design
 * language (left settings rail + white cards with uppercase section labels,
 * Enabled/Disabled rows, 5–8px radii).
 *
 * Every row is real: toggles and selects persist to Postgres through
 * PUT /api/settings the moment they change (no dead switches), the avatar
 * uploads through the same endpoint, and the data actions hit the live
 * history APIs. Profile fields (name, handedness, measurements) are edited
 * on /profile — the rail's "Profile & account" entry links there.
 */

import React, { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  User, Bell, Clock, Shield, MonitorSmartphone, SlidersHorizontal,
  Upload, Trash2, LogOut, ChevronRight, Info, CheckCircle2,
} from "lucide-react"
import { SectionLabel, Card } from "@/components/shotiq/ShotIQShell"
import { useAuthStore } from "@/stores/authStore"
import { csrfFetch } from "@/lib/api/csrfFetch"

// ── Server-backed settings shapes (mirrors /api/settings defaults) ────────────

interface NotificationSettings {
  weeklyReportEmail: boolean
  monthlyReportEmail: boolean
  coachAlertEmail: boolean
  milestoneEmail: boolean
  improvementAlertEmail: boolean
  milestonePush: boolean
  coachingTipsPush: boolean
  improvementAlertPush: boolean
  motivationalMessagesPush: boolean
  reminderPush: boolean
  coachingTipsFrequency: "daily" | "2x_week" | "3x_week" | "weekly"
  motivationalFrequency: "1x_week" | "2x_week" | "daily"
  reminderTime: string
  reportFormat: "detailed" | "summary"
  includeCharts: boolean
  includeComparison: boolean
}

interface AutomationSettings {
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

interface PrivacySettings {
  allowAnonymousAnalytics: boolean
  includeInPeerComparisons: boolean
  shareProgressWithCoach: boolean
}

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  weeklyReportEmail: true, monthlyReportEmail: true, coachAlertEmail: true,
  milestoneEmail: true, improvementAlertEmail: true, milestonePush: true,
  coachingTipsPush: true, improvementAlertPush: true,
  motivationalMessagesPush: true, reminderPush: false,
  coachingTipsFrequency: "2x_week", motivationalFrequency: "2x_week",
  reminderTime: "18:00", reportFormat: "detailed",
  includeCharts: true, includeComparison: true,
}

const DEFAULT_AUTOMATION: AutomationSettings = {
  analyticsRefreshEnabled: true, analyticsRefreshTime: "02:00",
  dataBackupEnabled: true, dataBackupTime: "03:00", modelUpdateEnabled: true,
  weeklyReportEnabled: true, weeklyReportDay: "monday", weeklyReportTime: "08:00",
  coachAlertsEnabled: true, monthlyAnalysisEnabled: true,
  milestoneNotificationsEnabled: true,
}

const DEFAULT_PRIVACY: PrivacySettings = {
  allowAnonymousAnalytics: true, includeInPeerComparisons: true,
  shareProgressWithCoach: true,
}

// ── Rail + section registry ───────────────────────────────────────────────────

const SECTIONS = [
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "automation", label: "Automation", icon: Clock },
  { id: "privacy", label: "Data & privacy", icon: Shield },
  { id: "devices", label: "Connected devices", icon: MonitorSmartphone },
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
] as const

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore()
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS)
  const [automation, setAutomation] = useState(DEFAULT_AUTOMATION)
  const [privacy, setPrivacy] = useState(DEFAULT_PRIVACY)
  const [loaded, setLoaded] = useState(false)
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [activeSection, setActiveSection] = useState<string>("notifications")
  const [deviceInfo, setDeviceInfo] = useState({ browser: "This browser", os: "" })

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Data actions
  const [exporting, setExporting] = useState<"idle" | "working" | "done" | "error">("idle")
  const [clearing, setClearing] = useState<"idle" | "confirm" | "working" | "done" | "error">("idle")

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/settings", { credentials: "include" })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled || !data?.success || !data.settings) return
        const s = data.settings
        if (s.notifications) setNotifications((p) => ({ ...p, ...s.notifications }))
        if (s.automation) setAutomation((p) => ({ ...p, ...s.automation }))
        if (s.privacy) setPrivacy((p) => ({ ...p, ...s.privacy }))
        if (s.avatarUrl) {
          setAvatarUrl(s.avatarUrl)
          updateUser({ avatarUrl: s.avatarUrl })
        }
      } catch (e) {
        console.error("Error loading settings:", e)
      } finally {
        if (!cancelled) setLoaded(true)
      }
    })()
    return () => { cancelled = true }
  }, [updateUser])

  useEffect(() => {
    const ua = navigator.userAgent
    const browser = /edg/i.test(ua) ? "Microsoft Edge" : /chrome|crios/i.test(ua) ? "Chrome"
      : /firefox/i.test(ua) ? "Firefox" : /safari/i.test(ua) ? "Safari" : "This browser"
    const os = /windows/i.test(ua) ? "Windows" : /mac os/i.test(ua) ? "macOS"
      : /android/i.test(ua) ? "Android" : /iphone|ipad|ios/i.test(ua) ? "iOS"
      : /linux/i.test(ua) ? "Linux" : ""
    setDeviceInfo({ browser, os })
  }, [])

  // Persist the CURRENT full settings state (plus any avatar change) to the
  // server. Called on every mutation so no switch is ever a dead control.
  const persist = useCallback(async (
    next: { notifications: NotificationSettings; automation: AutomationSettings; privacy: PrivacySettings },
    avatar?: { data?: string; remove?: boolean },
  ) => {
    setSaveState("saving")
    try {
      const payload: Record<string, unknown> = { ...next }
      if (avatar?.data) payload.avatarData = avatar.data
      if (avatar?.remove) payload.removeAvatar = true
      const res = await csrfFetch("/api/settings", { method: "PUT", body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error || "Save failed")
      if (avatar) {
        const url = data.settings?.avatarUrl ?? null
        setAvatarUrl(url)
        updateUser({ avatarUrl: url ?? undefined })
        if (typeof window !== "undefined") {
          if (url) localStorage.setItem("user_avatar", url)
          else localStorage.removeItem("user_avatar")
        }
      }
      setSaveState("saved")
      setTimeout(() => setSaveState("idle"), 2000)
    } catch (e) {
      console.error("Error saving settings:", e)
      setSaveState("error")
      setTimeout(() => setSaveState("idle"), 3000)
    }
  }, [updateUser])

  const setNotif = <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
    const next = { ...notifications, [key]: value }
    setNotifications(next)
    void persist({ notifications: next, automation, privacy })
  }
  const setAuto = <K extends keyof AutomationSettings>(key: K, value: AutomationSettings[K]) => {
    const next = { ...automation, [key]: value }
    setAutomation(next)
    void persist({ notifications, automation: next, privacy })
  }
  const setPriv = <K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) => {
    const next = { ...privacy, [key]: value }
    setPrivacy(next)
    void persist({ notifications, automation, privacy: next })
  }

  const onAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) { alert("Please select an image file"); return }
    if (file.size > 5 * 1024 * 1024) { alert("Image must be less than 5MB"); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const data = ev.target?.result as string
      setAvatarUrl(data)
      void persist({ notifications, automation, privacy }, { data })
    }
    reader.readAsDataURL(file)
  }

  const removeAvatar = () => {
    setAvatarUrl(null)
    if (avatarInputRef.current) avatarInputRef.current.value = ""
    void persist({ notifications, automation, privacy }, { remove: true })
  }

  const exportData = async () => {
    setExporting("working")
    try {
      const [settingsRes, historyRes] = await Promise.all([
        fetch("/api/settings", { credentials: "include" }),
        fetch("/api/analysis-history?includeAnalysis=true&limit=1000", { credentials: "include" }),
      ])
      const settingsData = settingsRes.ok ? await settingsRes.json() : null
      const historyData = historyRes.ok ? await historyRes.json() : null
      const payload = {
        exportedAt: new Date().toISOString(),
        profile: {
          email: user?.email ?? null,
          displayName: user?.displayName ?? null,
          memberSince: user?.createdAt ?? null,
        },
        settings: settingsData?.settings ?? null,
        analysisHistory: historyData?.history ?? [],
        stats: historyData?.stats ?? null,
      }
      const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }))
      const a = document.createElement("a")
      a.href = url
      a.download = `shotiq-export-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setExporting("done")
    } catch (e) {
      console.error("Error exporting data:", e)
      setExporting("error")
    }
    setTimeout(() => setExporting("idle"), 2500)
  }

  const clearHistory = async () => {
    if (clearing === "idle") { setClearing("confirm"); return }
    if (clearing !== "confirm") return
    setClearing("working")
    try {
      const res = await fetch("/api/analysis-history?limit=1000", { credentials: "include" })
      const data = res.ok ? await res.json() : null
      const ids: string[] = Array.isArray(data?.history)
        ? data.history.map((h: { id: string }) => h.id).filter(Boolean) : []
      for (const id of ids) {
        await csrfFetch(`/api/analysis-history?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      }
      setClearing("done")
    } catch (e) {
      console.error("Error clearing history:", e)
      setClearing("error")
    }
    setTimeout(() => setClearing("idle"), 2500)
  }

  const signOut = async () => {
    useAuthStore.getState().signOut()
    try {
      const { getCsrfToken } = await import("@/lib/api/csrfFetch")
      await fetch("/api/auth/signout", {
        method: "POST", credentials: "include",
        headers: { "x-csrf-token": await getCsrfToken() },
      })
    } catch { /* cookie may already be gone */ }
    window.location.assign("/signin")
  }

  const goTo = (id: string) => {
    setActiveSection(id)
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const initials = (user?.displayName || user?.email || "You").slice(0, 2).toUpperCase()
  const lbl = "text-[9px] font-bold tracking-[0.06em] text-[var(--shotiq-color-graphite)]"

  // A canonical Enabled/Disabled row (096 language): label left, state +
  // chevron right, whole row toggles and persists.
  const ToggleRow = ({ label, value, onToggle, testid }: {
    label: string; value: boolean; onToggle: () => void; testid?: string
  }) => (
    <button type="button" onClick={onToggle} data-testid={testid} aria-pressed={value ? undefined : "false"}
            className="flex w-full items-center justify-between py-[9px] text-left text-[13px] hover:bg-[var(--shotiq-color-warmCanvas)]">
      <span>{label}</span>
      <span className={`flex items-center gap-[6px] text-[12px] font-semibold ${value ? "text-[var(--shotiq-color-confirmGreen)]" : "text-[var(--shotiq-color-graphite)]"}`}>
        {value ? "Enabled" : "Disabled"} <ChevronRight className="h-[12px] w-[12px]" />
      </span>
    </button>
  )

  const SelectRow = ({ label, value, options, onChange }: {
    label: string; value: string; options: [string, string][]; onChange: (v: string) => void
  }) => (
    <div className="flex items-center justify-between py-[7px] text-[13px]">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
              className="h-[32px] rounded-[5px] border border-[var(--shotiq-color-rule)] bg-white px-[8px] text-[12px] outline-none focus:border-[var(--shotiq-color-ink)]">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  )

  const railItem = "flex w-full items-center gap-[10px] rounded-[5px] px-[10px] py-[8px] text-left text-[13px] transition-colors"

  return (
    <div data-testid="screen-desktop-web-settings-hub" className="flex">
      <div className="min-w-0 flex-1 px-[24px] py-[18px]">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="shotiq-display text-[46px] leading-[48px]">SETTINGS</h1>
            <p className="mt-[2px] text-[13px] text-[var(--shotiq-color-graphite)]">Manage your account, preferences, and app experience.</p>
          </div>
          <span aria-live="polite" className={`pb-[6px] text-[12px] ${saveState === "error" ? "text-[var(--shotiq-color-reviewRed)]" : "text-[var(--shotiq-color-graphite)]"}`}>
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "All changes saved ✓"
              : saveState === "error" ? "Save failed — try again" : loaded ? "Changes save automatically" : ""}
          </span>
        </div>

        <div className="mt-[14px] flex items-start gap-[16px]">
          {/* Settings rail — 096 language */}
          <div className="w-[210px] shrink-0 rounded-[8px] border border-[var(--shotiq-color-rule)] bg-white p-[10px] lg:sticky lg:top-[76px]">
            <SectionLabel className="px-[10px]">SETTINGS</SectionLabel>
            <nav className="mt-[6px] space-y-[2px]">
              <Link href="/profile" className={`${railItem} text-[var(--shotiq-color-graphite)] hover:bg-[var(--shotiq-color-warmCanvas)] hover:text-[var(--shotiq-color-ink)]`}>
                <User className="h-[16px] w-[16px]" /> Profile &amp; account
              </Link>
              {SECTIONS.map(({ id, label, icon: IconEl }) => (
                <button key={id} type="button" onClick={() => goTo(id)}
                        aria-current={activeSection === id ? "true" : undefined}
                        className={`${railItem} ${activeSection === id
                          ? "border-l-[3px] border-[var(--shotiq-color-shotiqOrange)] bg-[var(--shotiq-color-warmCanvas)] font-semibold text-[var(--shotiq-color-shotiqOrange)]"
                          : "border-l-[3px] border-transparent text-[var(--shotiq-color-graphite)] hover:bg-[var(--shotiq-color-warmCanvas)] hover:text-[var(--shotiq-color-ink)]"}`}>
                  <IconEl className="h-[16px] w-[16px]" /> {label}
                </button>
              ))}
            </nav>
            <div className="my-[10px] border-t border-[var(--shotiq-color-rule)]" />
            <SectionLabel className="px-[10px]">QUICK ACTIONS</SectionLabel>
            <nav className="mt-[6px] space-y-[2px]">
              <button type="button" onClick={exportData} className={`${railItem} text-[var(--shotiq-color-graphite)] hover:bg-[var(--shotiq-color-warmCanvas)] hover:text-[var(--shotiq-color-ink)]`}>
                <Upload className="h-[16px] w-[16px]" /> Export all data
              </button>
              <button type="button" onClick={clearHistory} className={`${railItem} text-[var(--shotiq-color-graphite)] hover:bg-[var(--shotiq-color-warmCanvas)] hover:text-[var(--shotiq-color-ink)]`}>
                <Trash2 className="h-[16px] w-[16px]" /> Clear history
              </button>
              <Link href="/guide" className={`${railItem} text-[var(--shotiq-color-graphite)] hover:bg-[var(--shotiq-color-warmCanvas)] hover:text-[var(--shotiq-color-ink)]`}>
                <Info className="h-[16px] w-[16px]" /> Help &amp; guide
              </Link>
              <button type="button" onClick={signOut} className={`${railItem} text-[var(--shotiq-color-reviewRed)] hover:bg-[var(--shotiq-color-warmCanvas)]`}>
                <LogOut className="h-[16px] w-[16px]" /> Sign out
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1 space-y-[16px]">
            {/* Account summary + avatar */}
            <Card className="flex items-center gap-[18px] p-[18px]">
              <div className="grid h-[74px] w-[74px] shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--shotiq-color-rule)]">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Profile photo" width={74} height={74} className="h-full w-full object-cover" unoptimized />
                ) : (
                  <span className="text-[22px] font-bold text-[var(--shotiq-color-graphite)]">{initials}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <SectionLabel>ACCOUNT</SectionLabel>
                <div className="truncate text-[16px] font-semibold">{user?.displayName || "Your name"}</div>
                <div className="truncate text-[12px] text-[var(--shotiq-color-graphite)]">{user?.email || ""}</div>
                <div className="mt-[2px] text-[11px] text-[var(--shotiq-color-graphite)]">
                  Square image, at least 200×200px. Max 5MB — JPG, PNG, GIF, WebP.
                </div>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarPick} />
              <div className="flex shrink-0 flex-col items-end gap-[6px]">
                <div className="flex gap-[8px]">
                  <button type="button"
                          onClick={() => { if (avatarInputRef.current) { avatarInputRef.current.dataset.opened = String(Date.now()); avatarInputRef.current.click() } }}
                          className="h-[36px] rounded-[5px] border border-[var(--shotiq-color-rule)] px-[14px] text-[12px] hover:border-[var(--shotiq-color-ink)]">
                    Change photo
                  </button>
                  <button type="button" onClick={removeAvatar} disabled={!avatarUrl}
                          className="h-[36px] rounded-[5px] px-[10px] text-[12px] text-[var(--shotiq-color-reviewRed)] disabled:opacity-40">
                    Remove
                  </button>
                </div>
                <Link href="/profile" className="flex items-center gap-[4px] text-[12px] font-medium text-[var(--shotiq-color-shotiqOrange)]">
                  Edit profile details <ChevronRight className="h-[12px] w-[12px]" />
                </Link>
              </div>
            </Card>

            {/* Notifications */}
            <Card id="section-notifications" className="scroll-mt-[76px] p-[18px]">
              <div className="flex items-center gap-[10px]">
                <Bell className="h-[18px] w-[18px] text-[var(--shotiq-color-shotiqOrange)]" />
                <div>
                  <SectionLabel>NOTIFICATIONS</SectionLabel>
                  <div className="text-[11px] text-[var(--shotiq-color-graphite)]">Control how and when you receive updates.</div>
                </div>
              </div>
              <div className="mt-[10px] grid gap-x-[28px] md:grid-cols-2">
                <div>
                  <div className={`${lbl} border-b border-[var(--shotiq-color-rule)] pb-[6px]`}>EMAIL</div>
                  <div className="divide-y divide-[var(--shotiq-color-rule)]">
                    <ToggleRow label="Weekly progress summary" testid="setting-weeklyReportEmail"
                               value={notifications.weeklyReportEmail} onToggle={() => setNotif("weeklyReportEmail", !notifications.weeklyReportEmail)} />
                    <ToggleRow label="Monthly report" value={notifications.monthlyReportEmail}
                               onToggle={() => setNotif("monthlyReportEmail", !notifications.monthlyReportEmail)} />
                    <ToggleRow label="Coach alerts" value={notifications.coachAlertEmail}
                               onToggle={() => setNotif("coachAlertEmail", !notifications.coachAlertEmail)} />
                    <ToggleRow label="Goal & milestone updates" value={notifications.milestoneEmail}
                               onToggle={() => setNotif("milestoneEmail", !notifications.milestoneEmail)} />
                    <ToggleRow label="Improvement alerts" value={notifications.improvementAlertEmail}
                               onToggle={() => setNotif("improvementAlertEmail", !notifications.improvementAlertEmail)} />
                  </div>
                </div>
                <div>
                  <div className={`${lbl} border-b border-[var(--shotiq-color-rule)] pb-[6px]`}>PUSH</div>
                  <div className="divide-y divide-[var(--shotiq-color-rule)]">
                    <ToggleRow label="Milestones reached" value={notifications.milestonePush}
                               onToggle={() => setNotif("milestonePush", !notifications.milestonePush)} />
                    <ToggleRow label="Coaching tips" value={notifications.coachingTipsPush}
                               onToggle={() => setNotif("coachingTipsPush", !notifications.coachingTipsPush)} />
                    <ToggleRow label="New analysis ready" value={notifications.improvementAlertPush}
                               onToggle={() => setNotif("improvementAlertPush", !notifications.improvementAlertPush)} />
                    <ToggleRow label="Motivational messages" value={notifications.motivationalMessagesPush}
                               onToggle={() => setNotif("motivationalMessagesPush", !notifications.motivationalMessagesPush)} />
                    <ToggleRow label="Training reminders" value={notifications.reminderPush}
                               onToggle={() => setNotif("reminderPush", !notifications.reminderPush)} />
                  </div>
                </div>
              </div>
            </Card>

            {/* Automation */}
            <Card id="section-automation" className="scroll-mt-[76px] p-[18px]">
              <div className="flex items-center gap-[10px]">
                <Clock className="h-[18px] w-[18px] text-[var(--shotiq-color-shotiqOrange)]" />
                <div>
                  <SectionLabel>AUTOMATION</SectionLabel>
                  <div className="text-[11px] text-[var(--shotiq-color-graphite)]">Manage automated analysis and insights.</div>
                </div>
              </div>
              <div className="mt-[10px] grid gap-x-[28px] md:grid-cols-2">
                <div className="divide-y divide-[var(--shotiq-color-rule)]">
                  <ToggleRow label="Auto-refresh analytics" value={automation.analyticsRefreshEnabled}
                             onToggle={() => setAuto("analyticsRefreshEnabled", !automation.analyticsRefreshEnabled)} />
                  <ToggleRow label="Daily data backup" value={automation.dataBackupEnabled}
                             onToggle={() => setAuto("dataBackupEnabled", !automation.dataBackupEnabled)} />
                  <ToggleRow label="Form model updates" value={automation.modelUpdateEnabled}
                             onToggle={() => setAuto("modelUpdateEnabled", !automation.modelUpdateEnabled)} />
                  <ToggleRow label="Weekly report generation" value={automation.weeklyReportEnabled}
                             onToggle={() => setAuto("weeklyReportEnabled", !automation.weeklyReportEnabled)} />
                </div>
                <div className="divide-y divide-[var(--shotiq-color-rule)]">
                  <ToggleRow label="Technique alerts" value={automation.coachAlertsEnabled}
                             onToggle={() => setAuto("coachAlertsEnabled", !automation.coachAlertsEnabled)} />
                  <ToggleRow label="Monthly deep analysis" value={automation.monthlyAnalysisEnabled}
                             onToggle={() => setAuto("monthlyAnalysisEnabled", !automation.monthlyAnalysisEnabled)} />
                  <ToggleRow label="Goal progress tracking" value={automation.milestoneNotificationsEnabled}
                             onToggle={() => setAuto("milestoneNotificationsEnabled", !automation.milestoneNotificationsEnabled)} />
                </div>
              </div>
            </Card>

            {/* Data & privacy */}
            <Card id="section-privacy" className="scroll-mt-[76px] p-[18px]">
              <div className="flex items-center gap-[10px]">
                <Shield className="h-[18px] w-[18px] text-[var(--shotiq-color-shotiqOrange)]" />
                <div>
                  <SectionLabel>DATA &amp; PRIVACY</SectionLabel>
                  <div className="text-[11px] text-[var(--shotiq-color-graphite)]">Control your data and privacy preferences.</div>
                </div>
              </div>
              <div className="mt-[10px] divide-y divide-[var(--shotiq-color-rule)]">
                <ToggleRow label="Anonymous analytics (product improvement)" value={privacy.allowAnonymousAnalytics}
                           onToggle={() => setPriv("allowAnonymousAnalytics", !privacy.allowAnonymousAnalytics)} />
                <ToggleRow label="Include me in peer comparisons" value={privacy.includeInPeerComparisons}
                           onToggle={() => setPriv("includeInPeerComparisons", !privacy.includeInPeerComparisons)} />
                <ToggleRow label="Share progress with my coach" value={privacy.shareProgressWithCoach}
                           onToggle={() => setPriv("shareProgressWithCoach", !privacy.shareProgressWithCoach)} />
              </div>
              <div className="mt-[12px] flex flex-wrap items-center gap-[12px] border-t border-[var(--shotiq-color-rule)] pt-[12px]">
                <div className="flex min-w-[260px] flex-1 items-center gap-[12px]">
                  <Upload className="h-[18px] w-[18px]" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold">Export all data</div>
                    <div className="text-[11px] text-[var(--shotiq-color-graphite)]">Download a copy of your shots, analyses, sessions, and account data.</div>
                  </div>
                  <button type="button" onClick={exportData} disabled={exporting === "working"}
                          className="h-[36px] shrink-0 rounded-[6px] border border-[var(--shotiq-color-rule)] px-[14px] text-[12px] disabled:opacity-60">
                    {exporting === "working" ? "Exporting…" : exporting === "done" ? "Downloaded ✓" : exporting === "error" ? "Failed — retry" : "Export all data"}
                  </button>
                </div>
                <div className="flex min-w-[260px] flex-1 items-center gap-[12px]">
                  <Trash2 className="h-[18px] w-[18px] text-[var(--shotiq-color-reviewRed)]" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold">Clear history</div>
                    <div className="text-[11px] text-[var(--shotiq-color-graphite)]">Permanently delete all shots, analyses, and session history.</div>
                  </div>
                  <button type="button" onClick={clearHistory} disabled={clearing === "working"}
                          className="h-[36px] shrink-0 rounded-[6px] border border-[var(--shotiq-color-reviewRed)] px-[14px] text-[12px] text-[var(--shotiq-color-reviewRed)] disabled:opacity-60">
                    {clearing === "confirm" ? "Click again to confirm" : clearing === "working" ? "Clearing…"
                      : clearing === "done" ? "History cleared" : clearing === "error" ? "Failed — retry" : "Clear history"}
                  </button>
                </div>
              </div>
            </Card>

            {/* Connected devices */}
            <Card id="section-devices" className="scroll-mt-[76px] p-[18px]">
              <div className="flex items-center gap-[10px]">
                <MonitorSmartphone className="h-[18px] w-[18px] text-[var(--shotiq-color-shotiqOrange)]" />
                <div>
                  <SectionLabel>CONNECTED DEVICES</SectionLabel>
                  <div className="text-[11px] text-[var(--shotiq-color-graphite)]">Where you&apos;re signed in right now.</div>
                </div>
              </div>
              <div className="mt-[10px] flex items-center justify-between py-[9px] text-[13px]">
                <span className="flex items-center gap-[10px]">
                  <MonitorSmartphone className="h-[16px] w-[16px] text-[var(--shotiq-color-graphite)]" />
                  {deviceInfo.browser}{deviceInfo.os ? ` on ${deviceInfo.os}` : ""}
                </span>
                <span className="flex items-center gap-[6px] text-[12px] font-semibold text-[var(--shotiq-color-confirmGreen)]">
                  <CheckCircle2 className="h-[13px] w-[13px]" /> Active now — this device
                </span>
              </div>
              <div className="mt-[6px] border-t border-[var(--shotiq-color-rule)] pt-[10px] text-[11px] text-[var(--shotiq-color-graphite)]">
                Signing out ends the session on this device. Sessions on other devices expire automatically after 30 days.
              </div>
            </Card>

            {/* Preferences */}
            <Card id="section-preferences" className="scroll-mt-[76px] p-[18px]">
              <div className="flex items-center gap-[10px]">
                <SlidersHorizontal className="h-[18px] w-[18px] text-[var(--shotiq-color-shotiqOrange)]" />
                <div>
                  <SectionLabel>PREFERENCES</SectionLabel>
                  <div className="text-[11px] text-[var(--shotiq-color-graphite)]">Reports, coaching cadence, and reminders.</div>
                </div>
              </div>
              <div className="mt-[10px] grid gap-x-[28px] md:grid-cols-2">
                <div className="divide-y divide-[var(--shotiq-color-rule)]">
                  <SelectRow label="Report format" value={notifications.reportFormat}
                             options={[["detailed", "Detailed"], ["summary", "Summary"]]}
                             onChange={(v) => setNotif("reportFormat", v as NotificationSettings["reportFormat"])} />
                  <ToggleRow label="Include charts in reports" value={notifications.includeCharts}
                             onToggle={() => setNotif("includeCharts", !notifications.includeCharts)} />
                  <ToggleRow label="Include elite comparisons" value={notifications.includeComparison}
                             onToggle={() => setNotif("includeComparison", !notifications.includeComparison)} />
                </div>
                <div className="divide-y divide-[var(--shotiq-color-rule)]">
                  <SelectRow label="Coaching tips frequency" value={notifications.coachingTipsFrequency}
                             options={[["daily", "Daily"], ["2x_week", "2× a week"], ["3x_week", "3× a week"], ["weekly", "Weekly"]]}
                             onChange={(v) => setNotif("coachingTipsFrequency", v as NotificationSettings["coachingTipsFrequency"])} />
                  <div className="flex items-center justify-between py-[7px] text-[13px]">
                    <span>Training reminder time</span>
                    <input type="time" value={notifications.reminderTime}
                           onChange={(e) => setNotif("reminderTime", e.target.value)}
                           className="h-[32px] rounded-[5px] border border-[var(--shotiq-color-rule)] bg-white px-[8px] text-[12px] outline-none focus:border-[var(--shotiq-color-ink)]" />
                  </div>
                </div>
              </div>
            </Card>

            {/* About */}
            <Card className="flex items-center divide-x divide-[var(--shotiq-color-rule)] px-[8px] py-[14px]">
              <div className="px-[16px]">
                <SectionLabel>ABOUT SHOTIQ</SectionLabel>
                <div className="text-[11px] text-[var(--shotiq-color-graphite)]">Version 1.0 · AI-powered shooting analysis.</div>
              </div>
              <div className="flex flex-1 items-center justify-end gap-[18px] px-[16px] text-[13px]">
                <Link href="/guide" className="text-[var(--shotiq-color-analysisBlue)]">Help &amp; guide</Link>
                <Link href="/terms" className="text-[var(--shotiq-color-graphite)] hover:text-[var(--shotiq-color-ink)]">Terms</Link>
                <Link href="/privacy" className="text-[var(--shotiq-color-graphite)] hover:text-[var(--shotiq-color-ink)]">Privacy</Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
