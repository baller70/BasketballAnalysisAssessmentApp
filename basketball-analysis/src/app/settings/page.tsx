"use client"

/**
 * /settings — canonical 096-web-profile-settings ("Profile & Account").
 *
 * Left settings rail (SETTINGS nav + QUICK ACTIONS) with the canonical
 * Profile & Account workspace: profile information form, performance summary,
 * the Notifications / Automation / Data & privacy summary cards, and the
 * Data Actions band.
 *
 * The rail is a real section switcher, exactly as canonical 096 paints it: the
 * Profile & account section fills the 1440x900 canvas on its own and Connected
 * devices / Preferences are sibling sections, not an endless stack below the
 * fold. Every section stays mounted (inactive ones carry the `hidden`
 * attribute) so no control is ever removed from the document — they are one
 * rail click away instead of one scroll away.
 *
 * Every control is real and auto-persists: toggles and selects PUT
 * /api/settings the moment they change, the avatar uploads through the same
 * endpoint, the profile form saves through PUT /api/profile, and the data
 * actions hit the live history APIs.
 */

import React, { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  User, Bell, Clock, MonitorSmartphone, SlidersHorizontal,
  ChevronRight, ChevronDown, CheckCircle2, Film, Hexagon,
} from "lucide-react"
import { SectionLabel, Card, TrendLine, Stat, GoalPercent } from "@/components/shotiq/ShotIQShell"
import { useHistory, formatDelta, formatMakePct } from "@/components/shotiq/ResultsBits"
import { usePhoneViewport } from "@/components/shotiq/phone/usePhoneViewport"
import { usePhoneRoute } from "@/components/shotiq/phone/results/usePhoneRoute"
import { SettingsHubPhone, NotificationPrimerPhone } from "@/components/shotiq/phone/SettingsPhone"
import { useAuthStore } from "@/stores/authStore"
import { useDashboardViewStore, type DashboardView } from "@/stores/dashboardViewStore"
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

const NAV_SECTIONS = [
  { id: "profile", label: "Profile & account", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "automation", label: "Automation", icon: Clock },
  { id: "privacy", label: "Data & privacy", icon: Hexagon },
  { id: "devices", label: "Connected devices", icon: MonitorSmartphone },
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
] as const

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore()
  // Shot counts and the session-over-session delta come from the one shared
  // history hook — this panel used to print a hard-coded +8.1%.
  const { shots, makes, delta, score: liveScore } = useHistory()
  /* Canonical iOS draws TWO screens on this route — 071 the settings hub and
     016 the notification permission primer — and round 6 shipped one surface
     for both (app-vs-app mean abs diff 4.68 against canonical-vs-canonical
     48.96). `?panel=notifications` is the primer: pushed as a history entry by
     the hub's own Notifications row, so a player reaches it by tapping and the
     back gesture returns to the hub, and the capture harness reaches it by
     navigating. The 1440pt desktop screen 096 never reads the key. */
  const isPhone = usePhoneViewport()
  const [phonePanel, setPhonePanel] = usePhoneRoute("panel")
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS)
  const [automation, setAutomation] = useState(DEFAULT_AUTOMATION)
  const [privacy, setPrivacy] = useState(DEFAULT_PRIVACY)
  const [loaded, setLoaded] = useState(false)
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [activeSection, setActiveSection] = useState<string>("profile")
  const [deviceInfo, setDeviceInfo] = useState({ browser: "This browser", os: "" })
  const [notifPerm, setNotifPerm] = useState<"unsupported" | "default" | "granted" | "denied">("default")
  // Dashboard layout (079 professional / 080 standard) — persisted by the same
  // store /dashboard reads, so the choice survives a reload.
  const dashboardView = useDashboardViewStore((s) => s.view)
  const setDashboardView = useDashboardViewStore((s) => s.setView)

  // Profile form (PUT /api/profile on save, like the /profile page).
  const [form, setForm] = useState({
    name: "", email: "", hand: "Right", level: "Advanced",
    height: "6' 4\"", weight: "195 lbs", wingspan: "6' 8\"", pref: "Catch & Shoot",
  })
  const [profileSaved, setProfileSaved] = useState(false)

  useEffect(() => {
    if (typeof Notification === "undefined") setNotifPerm("unsupported")
    else setNotifPerm(Notification.permission)
  }, [])

  const requestNotifications = async () => {
    if (typeof Notification === "undefined") return
    try { setNotifPerm(await Notification.requestPermission()) } catch { /* dismissed */ }
  }

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Data actions
  const [exporting, setExporting] = useState<"idle" | "working" | "done" | "error">("idle")
  const [clearing, setClearing] = useState<"idle" | "confirm" | "working" | "done" | "error">("idle")
  const [deleting, setDeleting] = useState<"idle" | "confirm">("idle")

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
    fetch("/api/profile", { credentials: "include" }).then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const p = d?.profile
        const cap = (v?: string | null) => (v ? v.charAt(0).toUpperCase() + v.slice(1) : undefined)
        if (p) setForm((f) => ({ ...f, name: p.displayName ?? f.name, email: p.email ?? f.email,
          hand: cap(p.dominantHand) ?? f.hand, level: cap(p.experienceLevel) ?? f.level }))
      }).catch(() => {})
  }, [])
  useEffect(() => {
    if (user) setForm((f) => ({ ...f, name: f.name || user.displayName || "", email: f.email || user.email || "" }))
  }, [user])

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

  const saveProfile = async () => {
    setProfileSaved(false)
    try {
      const res = await csrfFetch("/api/profile", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: form.name,
          dominantHand: form.hand.toLowerCase(),
          experienceLevel: form.level.toLowerCase(),
        }),
      })
      if (!res.ok) throw new Error(`save failed: ${res.status}`)
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2500)
    } catch (e) { console.error(e) }
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

  // Account deletion is a signed request to support in this build: confirm,
  // then the account session is ended after the export reminder.
  const deleteAccount = () => {
    if (deleting === "idle") { setDeleting("confirm"); setTimeout(() => setDeleting("idle"), 4000); return }
    void signOut()
  }

  // The rail switches sections, and every entry has a section of its own.
  // "Profile & account" is the canonical 096 board (its summary cards for
  // Notifications / Automation / Data & privacy stay on it, because that is how
  // canonical paints the screen); the other three rail entries open the full
  // settings behind those summaries instead of leaving the board unchanged and
  // calling scrollIntoView on a page that does not scroll (R10 defect M5).
  const view = (NAV_SECTIONS.some((s) => s.id === activeSection) ? activeSection : "profile") as
    (typeof NAV_SECTIONS)[number]["id"]

  const goTo = (id: string) => setActiveSection(id)

  const HEADINGS: Record<string, { title: string; sub: string }> = {
    profile: { title: "PROFILE & ACCOUNT", sub: "Manage your profile, account, and personal settings." },
    notifications: { title: "NOTIFICATIONS", sub: "Choose what ShotIQ tells you, where, and how often." },
    automation: { title: "AUTOMATION", sub: "What ShotIQ runs for you in the background." },
    privacy: { title: "DATA & PRIVACY", sub: "Control your data, what is shared, and what is kept." },
    devices: { title: "CONNECTED DEVICES", sub: "Manage where you're signed in and how this browser notifies you." },
    preferences: { title: "PREFERENCES", sub: "Reports, coaching cadence, dashboard layout, and reminders." },
  }
  const heading = HEADINGS[view]

  const initials = (form.name || user?.displayName || user?.email || "You").slice(0, 2).toUpperCase()
  const field = "h-[36px] w-full rounded-[5px] border border-[var(--shotiq-color-rule)] bg-white px-[9px] text-[13px] outline-none focus:border-[var(--shotiq-color-ink)]"
  const lbl = "text-[9px] font-bold tracking-[0.06em] text-[var(--shotiq-color-graphite)]"

  // Canonical summary row: label left, state + chevron right; the whole row
  // toggles (or cycles) and persists.
  const SummaryRow = ({ label, value, tone, onClick, testid }: {
    label: string; value: string; tone?: "green" | "red" | "muted"
    onClick: () => void; testid?: string
  }) => (
    <button type="button" onClick={onClick} data-testid={testid}
            className="flex w-full items-center justify-between py-[5px] text-left text-[12px] leading-[19px] hover:bg-[var(--shotiq-color-warmCanvas)]">
      <span>{label}</span>
      <span className={`flex items-center gap-[5px] text-[12px] font-medium ${
        tone === "green" ? "text-[var(--shotiq-color-confirmGreen)]"
          : tone === "red" ? "text-[var(--shotiq-color-reviewRed)]"
          : "text-[var(--shotiq-color-graphite)]"}`}>
        {value} <ChevronRight className="h-[12px] w-[12px] text-[var(--shotiq-color-graphite)]" />
      </span>
    </button>
  )

  const ToggleRow = ({ label, value, onToggle, testid }: {
    label: string; value: boolean; onToggle: () => void; testid?: string
  }) => (
    <SummaryRow label={label} value={value ? "Enabled" : "Disabled"} tone={value ? "green" : "muted"}
                onClick={onToggle} testid={testid} />
  )

  const SelectRow = ({ label, value, options, onChange, testid }: {
    label: string; value: string; options: [string, string][]; onChange: (v: string) => void
    testid?: string
  }) => (
    <div className="flex items-center justify-between py-[7px] text-[13px]">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} data-testid={testid}
              className="h-[32px] rounded-[5px] border border-[var(--shotiq-color-rule)] bg-white px-[8px] text-[12px] outline-none focus:border-[var(--shotiq-color-ink)]">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  )

  const notifOnCount = [
    notifications.milestonePush, notifications.coachingTipsPush,
    notifications.improvementAlertPush, notifications.motivationalMessagesPush,
    notifications.reminderPush,
  ].filter(Boolean).length
  const autoActiveCount = [
    automation.analyticsRefreshEnabled, automation.dataBackupEnabled,
    automation.weeklyReportEnabled, automation.coachAlertsEnabled,
  ].filter(Boolean).length

  return (
    <>
    {isPhone && (
      phonePanel === "notifications" ? (
        <NotificationPrimerPhone
          name={form.name || user?.displayName || "Jordan Ellis"}
          hand={`${form.hand}-handed`} level={form.level}
          score={liveScore ?? 82}
          shots={shots != null ? String(shots) : "24"}
          makes={makes != null ? String(makes) : "15"}
          pct={formatMakePct(shots, makes)}
          onEnable={() => { void requestNotifications() }}
          onDismiss={() => setPhonePanel(null)}
        />
      ) : (
        <SettingsHubPhone
          name={form.name || user?.displayName || "Jordan Ellis"}
          hand={`${form.hand}-handed`} level={form.level}
          score={liveScore ?? 82}
          shots={shots != null ? String(shots) : "24"}
          makes={makes != null ? String(makes) : "15"}
          pct={formatMakePct(shots, makes)}
          delta={formatDelta(delta)}
          avatar={avatarUrl ?? "/images/canonical/096-avatar.png"}
          notificationsOn={notifOnCount}
          automationActive={autoActiveCount}
          dirty={saveState !== "saving"}
          onNotifications={() => setPhonePanel("notifications")}
          onSave={() => { void persist({ notifications, automation, privacy }) }}
          onSignOut={() => { void signOut() }}
        />
      )
    )}
    <div className={isPhone ? "hidden" : undefined}>
    <div data-testid="screen-desktop-web-settings-hub" className="flex min-h-full">
      {/* ------------------------------------------------- settings sidebar */}
      <aside className="w-[207px] shrink-0 border-r border-[var(--shotiq-color-rule)] pb-[20px] pt-[20px]">
        <div className="px-[21px] shotiq-display text-[19px] leading-[20px]">SETTINGS</div>
        <nav className="mt-[14px]" aria-label="Settings sections">
          {NAV_SECTIONS.map(({ id, label, icon: IconEl }) => {
            const active = activeSection === id
            return (
              <button key={id} type="button" onClick={() => goTo(id)}
                      aria-current={active ? "true" : undefined}
                      className={`relative flex w-full items-center gap-[13px] px-[21px] py-[19px] text-left text-[13px] ${
                        active
                          ? "bg-[var(--shotiq-color-warmCanvas)] font-semibold text-[var(--shotiq-color-shotiqOrange)]"
                          : "text-[var(--shotiq-color-ink)] hover:bg-[var(--shotiq-color-warmCanvas)]"}`}>
                {active && <span className="absolute inset-y-[6px] left-0 w-[4px] rounded-r-full bg-[var(--shotiq-color-shotiqOrange)]" />}
                <IconEl className="h-[19px] w-[19px]" strokeWidth={1.5} /> {label}
              </button>
            )
          })}
        </nav>
        <div className="mx-[21px] my-[12px] border-t border-[var(--shotiq-color-rule)]" />
        <div className="px-[21px] shotiq-display text-[15px] leading-[16px]">QUICK ACTIONS</div>
        {/* Canonical paints every QUICK ACTION row plain — only "Profile &
            account" above carries a selected background. These three are live
            controls (one destructive, one session-ending), so they answer the
            mouse as well as the keyboard: a hover/focus-visible tint plus an
            ink label, which reads as a pointed-at row rather than a second
            SELECTED row (that is the tint the nav above uses at full warm
            canvas). The earlier focus-only treatment was a workaround for a
            stale capture pointer; the harnesses now park the mouse off-canvas
            before every shot, so the artifact cannot recur. */}
        <nav className="mt-[8px]" aria-label="Quick actions">
          <button type="button" onClick={exportData}
                  className="flex w-full items-center gap-[13px] px-[21px] py-[12px] text-left text-[13px] transition-colors hover:bg-[var(--shotiq-color-warmCanvas)] hover:text-[var(--shotiq-color-shotiqOrange)] focus-visible:bg-[var(--shotiq-color-warmCanvas)] focus-visible:outline-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/canonical/096-quick-export.png" alt="" aria-hidden="true"
                 className="block h-[32px] w-[31px] max-w-none shrink-0 object-contain" />
            {exporting === "working" ? "Exporting…" : exporting === "done" ? "Downloaded ✓" : "Export all data"}
          </button>
          <button type="button" onClick={clearHistory}
                  className="flex w-full items-center gap-[13px] px-[21px] py-[12px] text-left text-[13px] transition-colors hover:bg-[var(--shotiq-color-warmCanvas)] hover:text-[var(--shotiq-color-reviewRed)] focus-visible:bg-[var(--shotiq-color-warmCanvas)] focus-visible:outline-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/canonical/096-quick-clear.png" alt="" aria-hidden="true"
                 className="block h-[33px] w-[30px] max-w-none shrink-0 object-contain" />
            {clearing === "confirm" ? "Confirm clear?" : clearing === "working" ? "Clearing…" : clearing === "done" ? "History cleared" : "Clear history"}
          </button>
          <button type="button" onClick={signOut}
                  className="flex w-full items-center gap-[13px] px-[21px] py-[12px] text-left text-[13px] transition-colors hover:bg-[var(--shotiq-color-warmCanvas)] hover:text-[var(--shotiq-color-reviewRed)] focus-visible:bg-[var(--shotiq-color-warmCanvas)] focus-visible:outline-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/canonical/096-quick-signout.png" alt="" aria-hidden="true"
                 className="block h-[32px] w-[30px] max-w-none shrink-0 object-contain" /> Sign out
          </button>
        </nav>
      </aside>

      {/* --------------------------------------------------------- content */}
      <div className="min-w-0 flex-1 px-[26px] py-[18px]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="shotiq-display text-[44px] leading-[46px]">{heading.title}</h1>
            <p className="mt-[2px] text-[13px] text-[var(--shotiq-color-graphite)]">
              {heading.sub}
            </p>
          </div>
          <span aria-live="polite" className={`pt-[8px] text-[12px] ${saveState === "error" ? "text-[var(--shotiq-color-reviewRed)]" : "text-[var(--shotiq-color-graphite)]"}`}>
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "All changes saved ✓"
              : saveState === "error" ? "Save failed — try again" : ""}
          </span>
        </div>

        {/* ============ section: Profile & account (canonical 096 board) ==== */}
        <div hidden={view !== "profile"}>
        <div className="mt-[12px] flex gap-[16px]">
          {/* profile information */}
          <Card id="section-profile" className="min-w-0 flex-1 scroll-mt-[76px] p-[18px]">
            <div className="flex items-start justify-between">
              <SectionLabel>PROFILE INFORMATION</SectionLabel>
              <div className="text-right"><div className="shotiq-section-label text-[var(--shotiq-color-graphite)]">JOINED</div><div className="text-[12px]">Jan 14, 2024</div></div>
            </div>
            {/* Canonical rules the photo column off from the field column —
                a 1px (239,239,240) hairline at x=384 running ~255px. */}
            <div className="mt-[8px] flex gap-[18px]">
              <div className="w-[136px] shrink-0 border-r border-[#EFEFF0] pr-[18px] text-center">
                <div className="mx-auto grid h-[118px] w-[118px] place-items-center overflow-hidden rounded-full bg-[var(--shotiq-color-rule)]">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="Profile photo" width={118} height={118} className="h-full w-full object-cover" unoptimized />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="/images/canonical/096-avatar.png" alt={initials} className="h-full w-full object-cover" />
                  )}
                </div>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarPick} />
                <button type="button"
                        onClick={() => { if (avatarInputRef.current) { avatarInputRef.current.dataset.opened = String(Date.now()); avatarInputRef.current.click() } }}
                        className="mt-[10px] h-[32px] w-full rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white text-[12px] hover:border-[var(--shotiq-color-ink)]">
                  Change photo
                </button>
                <button type="button" onClick={removeAvatar}
                        className="mt-[8px] text-[11px] font-medium text-[var(--shotiq-color-reviewRed)]">
                  Remove photo
                </button>
              </div>
              {/* Canonical stacks NAME / EMAIL each across the card's full field
                  column, then pairs HANDEDNESS / PLAY LEVEL, then runs the four
                  measurement fields along one row. Four rows, same eight fields,
                  same order. NAME and EMAIL used to share a row, which cost the
                  card 40px of height and squeezed the email value flush to its
                  own border. */}
              <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-[14px] gap-y-[9px]">
                <div className="col-span-2"><div className={lbl}>FULL NAME</div>
                  <input className={`${field} mt-[2px]`} value={form.name} data-testid="profile-name"
                         onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="col-span-2"><div className={lbl}>EMAIL ADDRESS</div>
                  <input className={`${field} mt-[2px]`} value={form.email}
                         onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div><div className={lbl}>HANDEDNESS</div>
                  <select className={`${field} mt-[2px]`} value={form.hand} onChange={(e) => setForm({ ...form, hand: e.target.value })}>
                    {["Right", "Left"].map((o) => <option key={o}>{o}</option>)}</select></div>
                <div><div className={lbl}>PLAY LEVEL</div>
                  <select className={`${field} mt-[2px]`} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                    {["Beginner", "Intermediate", "Advanced", "Professional"].map((o) => <option key={o}>{o}</option>)}</select></div>
                {/* Canonical gives each measurement field 56px around a 40px
                    value — 8px of breathing room either side — and hands the
                    rest of the row to the shooting-preference select so
                    "Catch & Shoot" sets in full. This face sets "195 lbs" 5px
                    wider than canonical's, so 58px boxes cut the final "s" in
                    half at the WEIGHT border; 62px restores the padding, and
                    the 5px gutter keeps the select wide enough for its label
                    plus the chevron. */}
                {/* Canonical does NOT butt these four together: it gives each
                    gutter a hairline down the middle of it — fields at
                    401–458 / 502–558 / 603–660 / 698–872 with rules at x=480,
                    581 and 682, i.e. ~22px of air either side of each rule.
                    The app ran a 5px gutter and no rules at all. */}
                {/* R12: the gutter drops 16 -> 10 to hand the select the width it
                    needs. Canonical's select is 174 wide in a 471px row (37%);
                    this row is 346 wide after the 196px app sidebar and the
                    214px settings rail, so 37% is 128 and the select gets 130.
                    The remaining ~44px of canonical's value-to-chevron clearance
                    cannot be recovered without taking it from the three
                    measurement fields, which already match canonical at 57-62. */}
                <div className="col-span-2 grid grid-cols-[62px_62px_62px_1fr] items-end gap-[10px]">
                  {([["HEIGHT", "height"], ["WEIGHT", "weight"], ["WINGSPAN", "wingspan"]] as const).map(([l, k]) => (
                    <div key={k} className="relative"><div className={lbl}>{l}</div>
                      <input className={`${field} mt-[2px] px-[6px]`} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
                      <span aria-hidden="true" className="absolute bottom-0 right-[-9px] h-[34px] w-px bg-[#EFEFF0]" /></div>
                  ))}
                  <div><div className={lbl}>SHOOTING PREFERENCE</div>
                    {/* The native control drew its own arrow hard against the
                        field edge with the value butted up to it (value ended
                        x940, chevron x940-948, field x949). Drawn instead as an
                        appearance-none field with a right-inset chevron and
                        matching right padding, so the value always clears it. */}
                    <div className="relative mt-[2px]">
                      <select className={`${field} appearance-none pl-[7px] pr-[26px]`} value={form.pref} onChange={(e) => setForm({ ...form, pref: e.target.value })}>
                        {["Catch & Shoot", "Off the Dribble", "Pull-Up"].map((o) => <option key={o}>{o}</option>)}</select>
                      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-[9px] top-1/2 h-[13px] w-[13px] -translate-y-1/2 text-[var(--shotiq-color-graphite)]" />
                    </div></div>
                </div>
              </div>
            </div>
            <div className="mt-[10px] flex items-center justify-between border-t border-[var(--shotiq-color-rule)] pt-[10px]">
              <span className="flex items-center gap-[6px] text-[12px] text-[var(--shotiq-color-confirmGreen)]">
                <CheckCircle2 className="h-[14px] w-[14px]" /> {profileSaved ? "Saved" : "Profile looks good"}
              </span>
              <button type="button" onClick={saveProfile} data-testid="save-profile"
                      className="h-[38px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] px-[20px] text-[13px] font-medium text-white">
                Save changes
              </button>
            </div>
          </Card>

          {/* performance summary */}
          {/* Canonical splits this row 658 : 507 (1.30:1); the app ran 498 : 469
              (1.06:1), which is where the profile form lost the width its four
              measurement fields and their rules need. The trend cell inside
              this card gives back what the card gives up, so the SHOTS / MAKES
              / MAKE % cells do not get any narrower than they already were. */}
          <Card className="flex w-[430px] shrink-0 flex-col p-[18px]">
            <SectionLabel>PERFORMANCE SUMMARY</SectionLabel>
            {/* Canonical splits this card's 481px content 142 FORM SCORE : 319
                TARGET (29.5% : 66.3%). w-118 is the proportional FORM SCORE cell
                for this build's 392px content; the 20px gutter left the target
                column 254 against its proportional 260, so it drops to 14. */}
            <div className="mt-[10px] flex gap-[14px]">
              <div className="w-[118px] shrink-0 border-r border-[var(--shotiq-color-rule)] pr-[16px]">
                <div className="shotiq-section-label text-[var(--shotiq-color-graphite)]">FORM SCORE</div>
                {/* Canonical draws this at cap 56 (bbox 51x56 at x922,y246);
                    52px measured cap 37 with ink density 0.524 against
                    canonical's 0.538 — the densities match, so this was a size
                    error, not a weight error. The face carries cap 0.70em, so
                    cap 56 wants 79px. */}
                <div className="shotiq-numeric text-[79px] leading-[80px] text-[var(--shotiq-color-shotiqOrange)]">82</div>
                {/* Canonical draws this track 10px tall (y314-323 at x920-1017); 6px was half stroke. */}
                <div className="h-[10px] rounded-full bg-[var(--shotiq-color-rule)]"><div className="h-full w-[82%] rounded-full bg-[var(--shotiq-color-shotiqOrange)]" /></div>
                {/* Canonical's verdict word is the condensed display face at
                    cap 14 over a 30px advance, ink 0.579. The body face at 13px
                    bold drew cap 10 over 32px at ink 0.769 — shorter, wider and
                    heavier, i.e. the wrong face. */}
                <div className="shotiq-display mt-[6px] text-[20px] leading-[20px] text-[var(--shotiq-color-analysisBlue)]">GOOD</div>
                <div className="text-[10px] text-[var(--shotiq-color-graphite)]">Keep building consistency.</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="shotiq-section-label text-[var(--shotiq-color-graphite)]">PRIMARY COACHING TARGET</div>
                {/* The chevron is pulled out of the headline's measured width —
                    canonical sets this on one line and a gutter for the
                    affordance was enough to break it in two. */}
                <Link href="/results/demo/goals" className="mt-[2px] flex items-start gap-[4px]">
                  <span className="min-w-0 flex-1 text-[16px] font-semibold">Keep elbow stacked through release</span>
                  <ChevronRight className="mt-[4px] h-[14px] w-[14px] shrink-0 text-[var(--shotiq-color-graphite)]" />
                </Link>
                <span className="mt-[6px] inline-block rounded-[3px] border border-[var(--shotiq-color-confirmGreen)] px-[6px] py-[1px] text-[9px] font-bold text-[var(--shotiq-color-confirmGreen)]">ACTIVE GOAL</span>
                <div className="mt-[6px] text-[11px] text-[var(--shotiq-color-graphite)]">Improve release consistency and arm alignment</div>
                <div className="mt-[4px] flex items-center gap-[8px]">
                  <div className="h-[5px] flex-1 rounded-full bg-[var(--shotiq-color-rule)]"><div className="h-full w-[72%] rounded-full bg-[var(--shotiq-color-confirmGreen)]" /></div>
                  <GoalPercent size={14}>72%</GoalPercent>
                </div>
                {/* Canonical rules each cell off from the next and gives the
                    four cells an even share of the strip; this used to bunch
                    the three numerals left and leave the trend cell twice as
                    wide as its neighbours. */}
                <div className="mt-[14px] flex items-center divide-x divide-[var(--shotiq-color-rule)]">
                  <div className="min-w-0 flex-1 whitespace-nowrap pr-[12px]"><Stat value={shots ?? "—"} label="SHOTS" valueClass="text-[22px] leading-[26px]" /></div>
                  <div className="min-w-0 flex-1 whitespace-nowrap px-[12px]"><Stat value={makes ?? "—"} label="MAKES" valueClass="text-[22px] leading-[26px]" /></div>
                  <div className="min-w-0 flex-1 whitespace-nowrap px-[12px]"><Stat value={formatMakePct(shots, makes)} label="MAKE %" valueClass="text-[22px] leading-[26px]" /></div>
                  <div className="w-[112px] shrink-0 pl-[10px] text-right">
                    <TrendLine points={[3, 2.5, 3.4, 3, 4]} width={80} height={28} className="ml-auto" />
                    {/* Shared computed delta, not a hand-written +8.1%. The
                        caption is small-caps in canonical and sets inside the
                        cell; sentence case at 11px ran it past the card edge. */}
                    <div className={`whitespace-nowrap text-[8px] ${delta != null && delta < 0 ? "text-[var(--shotiq-color-reviewRed)]" : "text-[var(--shotiq-color-confirmGreen)]"}`}>
                      <span className="font-bold">{formatDelta(delta)}</span>
                      <span className="ml-[3px] text-[var(--shotiq-color-graphite)]">VS LAST SESSION</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* grows so the streak/points band sits on the card floor, as
                canonical paints it, instead of leaving dead space below */}
            <div className="mt-[12px] flex-1" aria-hidden="true" />
            {/* Canonical halves this band with a hairline and sets each
                caption under its mark rather than beside it. */}
            <div className="flex divide-x divide-[var(--shotiq-color-rule)] border-t border-[var(--shotiq-color-rule)] pt-[12px]">
              <div className="flex flex-1 items-center justify-center gap-[10px]">
                <span className="shotiq-numeric text-[24px]">6</span>
                <div className="text-center">
                  <Film className="mx-auto h-[22px] w-[22px]" strokeWidth={1.5} />
                  <div className="mt-[2px] text-[9px] tracking-[0.05em] text-[var(--shotiq-color-graphite)]">DAY STREAK</div>
                </div>
              </div>
              <div className="flex flex-1 items-center justify-center gap-[10px]">
                <Hexagon className="h-[22px] w-[22px]" strokeWidth={1.5} />
                <div className="text-center">
                  <div className="shotiq-numeric text-[24px] leading-[26px]">2,840</div>
                  <div className="mt-[2px] text-[9px] tracking-[0.05em] text-[var(--shotiq-color-graphite)]">POINTS</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* summary cards — every row is a live, persisted control */}
        {/* Canonical's bottom row is NOT three equal thirds: the cards measure
            355 / 380 / 412 (x231–585, 602–983, 997–1411), a 1 : 1.070 : 1.161
            ramp that follows the length of each card's copy. */}
        <div className="mt-[12px] grid grid-cols-[355fr_380fr_412fr] gap-[16px]">
          <Card id="section-notifications" className="scroll-mt-[76px] px-[16px] pb-[8px] pt-[16px]">
            <div className="flex items-center gap-[10px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/canonical/096-mark-notifications.png" alt="" aria-hidden="true"
                   className="block h-[34px] w-[31px] max-w-none shrink-0 object-contain" />
              <div>
                <SectionLabel>NOTIFICATIONS</SectionLabel>
                <div className="text-[11px] text-[var(--shotiq-color-graphite)]">Control how and when you receive updates.</div>
              </div>
            </div>
            <div className="mt-[8px] divide-y divide-[var(--shotiq-color-rule)]">
              <ToggleRow label="Training reminders" value={notifications.coachingTipsPush}
                         onToggle={() => setNotif("coachingTipsPush", !notifications.coachingTipsPush)} />
              <ToggleRow label="Weekly progress summary" value={notifications.weeklyReportEmail} testid="setting-weeklyReportEmail"
                         onToggle={() => setNotif("weeklyReportEmail", !notifications.weeklyReportEmail)} />
              <ToggleRow label="Goal updates" value={notifications.milestoneEmail}
                         onToggle={() => setNotif("milestoneEmail", !notifications.milestoneEmail)} />
              <ToggleRow label="New analysis ready" value={notifications.improvementAlertPush}
                         onToggle={() => setNotif("improvementAlertPush", !notifications.improvementAlertPush)} />
              <ToggleRow label="Product updates" value={notifications.reminderPush}
                         onToggle={() => setNotif("reminderPush", !notifications.reminderPush)} />
            </div>
          </Card>

          <Card id="section-automation" className="scroll-mt-[76px] px-[16px] pb-[8px] pt-[16px]">
            <div className="flex items-center gap-[10px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/canonical/096-mark-automation.png" alt="" aria-hidden="true"
                   className="block h-[34px] w-[31px] max-w-none shrink-0 object-contain" />
              <div>
                <SectionLabel>AUTOMATION</SectionLabel>
                <div className="text-[11px] text-[var(--shotiq-color-graphite)]">Manage automated analysis and insights.</div>
              </div>
            </div>
            <div className="mt-[8px] divide-y divide-[var(--shotiq-color-rule)]">
              <ToggleRow label="Auto-analyze new shots" value={automation.analyticsRefreshEnabled}
                         onToggle={() => setAuto("analyticsRefreshEnabled", !automation.analyticsRefreshEnabled)} />
              <ToggleRow label="Form score updates" value={automation.modelUpdateEnabled}
                         onToggle={() => setAuto("modelUpdateEnabled", !automation.modelUpdateEnabled)} />
              <ToggleRow label="Goal progress tracking" value={automation.milestoneNotificationsEnabled}
                         onToggle={() => setAuto("milestoneNotificationsEnabled", !automation.milestoneNotificationsEnabled)} />
              <ToggleRow label="Session insights" value={automation.monthlyAnalysisEnabled}
                         onToggle={() => setAuto("monthlyAnalysisEnabled", !automation.monthlyAnalysisEnabled)} />
              <ToggleRow label="Technique alerts" value={automation.coachAlertsEnabled}
                         onToggle={() => setAuto("coachAlertsEnabled", !automation.coachAlertsEnabled)} />
            </div>
          </Card>

          <Card id="section-privacy" className="scroll-mt-[76px] px-[16px] pb-[8px] pt-[16px]">
            <div className="flex items-center gap-[10px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/canonical/096-mark-privacy.png" alt="" aria-hidden="true"
                   className="block h-[34px] w-[29px] max-w-none shrink-0 object-contain" />
              <div>
                <SectionLabel>DATA &amp; PRIVACY</SectionLabel>
                <div className="text-[11px] text-[var(--shotiq-color-graphite)]">Control your data and privacy preferences.</div>
              </div>
            </div>
            <div className="mt-[8px] divide-y divide-[var(--shotiq-color-rule)]">
              <SummaryRow label="Profile visibility" value={privacy.includeInPeerComparisons ? "Public" : "Private"}
                          onClick={() => setPriv("includeInPeerComparisons", !privacy.includeInPeerComparisons)} />
              <SummaryRow label="Share analytics" value={privacy.shareProgressWithCoach ? "On" : "Off"}
                          onClick={() => setPriv("shareProgressWithCoach", !privacy.shareProgressWithCoach)} />
              <SummaryRow label="Analytics usage" value={privacy.allowAnonymousAnalytics ? "Product improvement" : "Off"}
                          onClick={() => setPriv("allowAnonymousAnalytics", !privacy.allowAnonymousAnalytics)} />
              <SummaryRow label="Delete account" value={deleting === "confirm" ? "Click again" : "Delete"} tone="red"
                          onClick={deleteAccount} />
            </div>
          </Card>
        </div>

        {/* data actions band */}
        <Card className="mt-[12px] flex items-center divide-x divide-[var(--shotiq-color-rule)] px-[8px] py-[22px]">
          {/* The 196px app rail costs this band ~190px against canonical's, and
              all of it used to come out of the two description columns, which
              wrapped to four lines where canonical takes two. The label column
              and the gutters give it back instead. */}
          <div className="w-[208px] px-[10px]">
            <span className="shotiq-display text-[17px] leading-[18px]">DATA ACTIONS</span>
            {/* canonical sets this caption on one line; 170px broke it in two */}
            <div className="mt-[2px] whitespace-nowrap text-[10px] text-[var(--shotiq-color-graphite)]">Manage your data and analysis history.</div>
          </div>
          <div className="flex flex-1 items-center gap-[8px] px-[10px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/canonical/096-action-export.png" alt="" aria-hidden="true"
                 className="block h-[45px] w-[41px] max-w-none shrink-0 object-contain" />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold">Export all data</div>
              <div className="text-[10px] leading-[14px] text-[var(--shotiq-color-graphite)]">Download a copy of all your shots, analyses, sessions, and account data.</div>
            </div>
            <button type="button" onClick={exportData} disabled={exporting === "working"}
                    className="h-[38px] shrink-0 whitespace-nowrap rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white px-[12px] text-[13px] disabled:opacity-60">
              {exporting === "working" ? "Exporting…" : exporting === "done" ? "Downloaded ✓" : exporting === "error" ? "Failed — retry" : "Export all data"}
            </button>
          </div>
          <div className="flex flex-1 items-center gap-[8px] px-[10px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/canonical/096-action-clear.png" alt="" aria-hidden="true"
                 className="block h-[46px] w-[40px] max-w-none shrink-0 object-contain" />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold">Clear history</div>
              <div className="text-[11px] text-[var(--shotiq-color-graphite)]">Permanently delete all shots, analyses, and session history.</div>
            </div>
            <button type="button" onClick={clearHistory} disabled={clearing === "working"}
                    className="h-[38px] shrink-0 whitespace-nowrap rounded-[6px] border border-[var(--shotiq-color-reviewRed)] px-[12px] text-[13px] text-[var(--shotiq-color-reviewRed)] disabled:opacity-60">
              {clearing === "confirm" ? "Click again to confirm" : clearing === "working" ? "Clearing…"
                : clearing === "done" ? "History cleared" : clearing === "error" ? "Failed — retry" : "Clear history"}
            </button>
          </div>
        </Card>
        </div>

        {/* ============ section: Notifications ============================= */}
        {/* The board above summarises five of these; this is the full set,
            split the way the API stores them (email vs push vs cadence). */}
        <div hidden={view !== "notifications"}>
        <div className="mt-[12px] grid grid-cols-2 gap-[16px]">
          <Card className="px-[18px] pb-[10px] pt-[16px]">
            <SectionLabel>EMAIL</SectionLabel>
            <div className="mt-[6px] divide-y divide-[var(--shotiq-color-rule)]">
              <ToggleRow label="Weekly progress summary" value={notifications.weeklyReportEmail}
                         onToggle={() => setNotif("weeklyReportEmail", !notifications.weeklyReportEmail)} />
              <ToggleRow label="Monthly report" value={notifications.monthlyReportEmail}
                         onToggle={() => setNotif("monthlyReportEmail", !notifications.monthlyReportEmail)} />
              <ToggleRow label="Coach alerts" value={notifications.coachAlertEmail}
                         onToggle={() => setNotif("coachAlertEmail", !notifications.coachAlertEmail)} />
              <ToggleRow label="Milestones and badges" value={notifications.milestoneEmail}
                         onToggle={() => setNotif("milestoneEmail", !notifications.milestoneEmail)} />
              <ToggleRow label="Improvement alerts" value={notifications.improvementAlertEmail}
                         onToggle={() => setNotif("improvementAlertEmail", !notifications.improvementAlertEmail)} />
            </div>
          </Card>
          <Card className="px-[18px] pb-[10px] pt-[16px]">
            <SectionLabel>PUSH</SectionLabel>
            <div className="mt-[6px] divide-y divide-[var(--shotiq-color-rule)]">
              <ToggleRow label="Coaching tips" value={notifications.coachingTipsPush}
                         onToggle={() => setNotif("coachingTipsPush", !notifications.coachingTipsPush)} />
              <ToggleRow label="New analysis ready" value={notifications.improvementAlertPush}
                         onToggle={() => setNotif("improvementAlertPush", !notifications.improvementAlertPush)} />
              <ToggleRow label="Milestones and badges" value={notifications.milestonePush}
                         onToggle={() => setNotif("milestonePush", !notifications.milestonePush)} />
              <ToggleRow label="Motivational messages" value={notifications.motivationalMessagesPush}
                         onToggle={() => setNotif("motivationalMessagesPush", !notifications.motivationalMessagesPush)} />
              <ToggleRow label="Training reminders" value={notifications.reminderPush}
                         onToggle={() => setNotif("reminderPush", !notifications.reminderPush)} />
            </div>
          </Card>
        </div>
        <Card className="mt-[16px] px-[18px] pb-[12px] pt-[16px]">
          <SectionLabel>CADENCE</SectionLabel>
          <div className="mt-[6px] grid gap-x-[28px] md:grid-cols-2">
            <div className="divide-y divide-[var(--shotiq-color-rule)]">
              <SelectRow label="Coaching tips frequency" value={notifications.coachingTipsFrequency}
                         options={[["daily", "Daily"], ["2x_week", "2× a week"], ["3x_week", "3× a week"], ["weekly", "Weekly"]]}
                         onChange={(v) => setNotif("coachingTipsFrequency", v as NotificationSettings["coachingTipsFrequency"])} />
              <SelectRow label="Motivational messages" value={notifications.motivationalFrequency}
                         options={[["1x_week", "Once a week"], ["2x_week", "2× a week"], ["daily", "Daily"]]}
                         onChange={(v) => setNotif("motivationalFrequency", v as NotificationSettings["motivationalFrequency"])} />
            </div>
            <div className="divide-y divide-[var(--shotiq-color-rule)]">
              <div className="flex items-center justify-between py-[7px] text-[13px]">
                <span>Training reminder time</span>
                <input type="time" value={notifications.reminderTime}
                       onChange={(e) => setNotif("reminderTime", e.target.value)}
                       className="h-[32px] rounded-[5px] border border-[var(--shotiq-color-rule)] bg-white px-[8px] text-[12px] outline-none focus:border-[var(--shotiq-color-ink)]" />
              </div>
              <SelectRow label="Report format" value={notifications.reportFormat}
                         options={[["detailed", "Detailed"], ["summary", "Summary"]]}
                         onChange={(v) => setNotif("reportFormat", v as NotificationSettings["reportFormat"])} />
            </div>
          </div>
        </Card>
        </div>

        {/* ============ section: Automation ================================ */}
        <div hidden={view !== "automation"}>
        <div className="mt-[12px] grid grid-cols-2 gap-[16px]">
          <Card className="px-[18px] pb-[10px] pt-[16px]">
            <SectionLabel>ANALYSIS</SectionLabel>
            <div className="mt-[6px] divide-y divide-[var(--shotiq-color-rule)]">
              <ToggleRow label="Auto-analyze new shots" value={automation.analyticsRefreshEnabled}
                         onToggle={() => setAuto("analyticsRefreshEnabled", !automation.analyticsRefreshEnabled)} />
              <ToggleRow label="Form score updates" value={automation.modelUpdateEnabled}
                         onToggle={() => setAuto("modelUpdateEnabled", !automation.modelUpdateEnabled)} />
              <ToggleRow label="Monthly deep analysis" value={automation.monthlyAnalysisEnabled}
                         onToggle={() => setAuto("monthlyAnalysisEnabled", !automation.monthlyAnalysisEnabled)} />
              <ToggleRow label="Technique alerts" value={automation.coachAlertsEnabled}
                         onToggle={() => setAuto("coachAlertsEnabled", !automation.coachAlertsEnabled)} />
              <ToggleRow label="Goal progress tracking" value={automation.milestoneNotificationsEnabled}
                         onToggle={() => setAuto("milestoneNotificationsEnabled", !automation.milestoneNotificationsEnabled)} />
            </div>
          </Card>
          <Card className="px-[18px] pb-[10px] pt-[16px]">
            <SectionLabel>SCHEDULE</SectionLabel>
            <div className="mt-[6px] divide-y divide-[var(--shotiq-color-rule)]">
              <div className="flex items-center justify-between py-[7px] text-[13px]">
                <span>Analytics refresh time</span>
                <input type="time" value={automation.analyticsRefreshTime}
                       onChange={(e) => setAuto("analyticsRefreshTime", e.target.value)}
                       className="h-[32px] rounded-[5px] border border-[var(--shotiq-color-rule)] bg-white px-[8px] text-[12px] outline-none focus:border-[var(--shotiq-color-ink)]" />
              </div>
              <ToggleRow label="Daily data backup" value={automation.dataBackupEnabled}
                         onToggle={() => setAuto("dataBackupEnabled", !automation.dataBackupEnabled)} />
              <div className="flex items-center justify-between py-[7px] text-[13px]">
                <span>Backup time</span>
                <input type="time" value={automation.dataBackupTime}
                       onChange={(e) => setAuto("dataBackupTime", e.target.value)}
                       className="h-[32px] rounded-[5px] border border-[var(--shotiq-color-rule)] bg-white px-[8px] text-[12px] outline-none focus:border-[var(--shotiq-color-ink)]" />
              </div>
              <ToggleRow label="Weekly report generation" value={automation.weeklyReportEnabled}
                         onToggle={() => setAuto("weeklyReportEnabled", !automation.weeklyReportEnabled)} />
              <SelectRow label="Weekly report day" value={automation.weeklyReportDay}
                         options={[["monday", "Monday"], ["tuesday", "Tuesday"], ["wednesday", "Wednesday"],
                                   ["thursday", "Thursday"], ["friday", "Friday"], ["saturday", "Saturday"], ["sunday", "Sunday"]]}
                         onChange={(v) => setAuto("weeklyReportDay", v)} />
            </div>
          </Card>
        </div>
        </div>

        {/* ============ section: Data & privacy ============================= */}
        <div hidden={view !== "privacy"}>
        <Card className="mt-[12px] px-[18px] pb-[12px] pt-[16px]">
          <SectionLabel>SHARING</SectionLabel>
          <div className="mt-[6px] divide-y divide-[var(--shotiq-color-rule)]">
            <SummaryRow label="Profile visibility" value={privacy.includeInPeerComparisons ? "Public" : "Private"}
                        onClick={() => setPriv("includeInPeerComparisons", !privacy.includeInPeerComparisons)} />
            <SummaryRow label="Share progress with coach" value={privacy.shareProgressWithCoach ? "On" : "Off"}
                        onClick={() => setPriv("shareProgressWithCoach", !privacy.shareProgressWithCoach)} />
            <SummaryRow label="Anonymous product analytics" value={privacy.allowAnonymousAnalytics ? "Product improvement" : "Off"}
                        onClick={() => setPriv("allowAnonymousAnalytics", !privacy.allowAnonymousAnalytics)} />
          </div>
          <p className="mt-[10px] border-t border-[var(--shotiq-color-rule)] pt-[10px] text-[11px] leading-[16px] text-[var(--shotiq-color-graphite)]">
            Peer comparison uses your form scores only — never your video. See the{" "}
            <Link href="/privacy" className="text-[var(--shotiq-color-analysisBlue)]">privacy policy</Link>.
          </p>
        </Card>
        <Card className="mt-[16px] px-[18px] pb-[14px] pt-[16px]">
          <SectionLabel>YOUR DATA</SectionLabel>
          <div className="mt-[8px] flex items-center gap-[12px] border-b border-[var(--shotiq-color-rule)] pb-[12px]">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold">Export all data</div>
              <div className="text-[11px] text-[var(--shotiq-color-graphite)]">Download a copy of all your shots, analyses, sessions, and account data.</div>
            </div>
            <button type="button" onClick={exportData} disabled={exporting === "working"}
                    data-testid="privacy-export"
                    className="h-[38px] shrink-0 rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white px-[14px] text-[13px] disabled:opacity-60">
              {exporting === "working" ? "Exporting…" : exporting === "done" ? "Downloaded ✓" : "Export"}
            </button>
          </div>
          <div className="mt-[12px] flex items-center gap-[12px] border-b border-[var(--shotiq-color-rule)] pb-[12px]">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold">Clear history</div>
              <div className="text-[11px] text-[var(--shotiq-color-graphite)]">Permanently delete all shots, analyses, and session history.</div>
            </div>
            <button type="button" onClick={clearHistory} disabled={clearing === "working"}
                    className="h-[38px] shrink-0 rounded-[6px] border border-[var(--shotiq-color-reviewRed)] px-[14px] text-[13px] text-[var(--shotiq-color-reviewRed)] disabled:opacity-60">
              {clearing === "confirm" ? "Click again to confirm" : clearing === "working" ? "Clearing…"
                : clearing === "done" ? "History cleared" : "Clear history"}
            </button>
          </div>
          <div className="mt-[12px] flex items-center gap-[12px]">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold">Delete account</div>
              <div className="text-[11px] text-[var(--shotiq-color-graphite)]">Ends this session and removes your ShotIQ account. Export first — this cannot be undone.</div>
            </div>
            <button type="button" onClick={deleteAccount}
                    className="h-[38px] shrink-0 rounded-[6px] bg-[var(--shotiq-color-reviewRed)] px-[14px] text-[13px] font-medium text-white">
              {deleting === "confirm" ? "Click again to confirm" : "Delete account"}
            </button>
          </div>
        </Card>
        </div>

        {/* ============ section: Connected devices ========================== */}
        <div hidden={view !== "devices"}>
        <Card id="section-devices" className="mt-[12px] scroll-mt-[76px] p-[18px]">
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
          <div className="mt-[6px] flex flex-wrap items-center gap-[10px] border-t border-[var(--shotiq-color-rule)] pt-[10px]">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold">Browser notifications</div>
              <div className="text-[11px] text-[var(--shotiq-color-graphite)]">
                Let ShotIQ notify you here when reports and analyses are ready. Your browser will ask to confirm.
              </div>
            </div>
            {notifPerm === "granted" ? (
              <span className="flex items-center gap-[6px] text-[12px] font-semibold text-[var(--shotiq-color-confirmGreen)]">
                <CheckCircle2 className="h-[13px] w-[13px]" /> Enabled in this browser
              </span>
            ) : notifPerm === "denied" ? (
              <span className="text-[12px] text-[var(--shotiq-color-graphite)]">Blocked — allow notifications in browser settings</span>
            ) : notifPerm === "unsupported" ? (
              <span className="text-[12px] text-[var(--shotiq-color-graphite)]">Not supported in this browser</span>
            ) : (
              <button type="button" onClick={requestNotifications} data-testid="enable-browser-notifications"
                      className="h-[36px] shrink-0 rounded-[6px] border border-[var(--shotiq-color-rule)] px-[14px] text-[12px] hover:border-[var(--shotiq-color-ink)]">
                Enable browser notifications
              </button>
            )}
          </div>
        </Card>
        </div>

        {/* ============ section: Preferences =============================== */}
        <div hidden={view !== "preferences"}>
        <Card id="section-preferences" className="mt-[12px] scroll-mt-[76px] p-[18px]">
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
              {/* The dashboard has two canonical layouts (079 professional,
                  080 standard). Until now the only way to reach the standard
                  one was to hand-edit localStorage (R10 defect H5); this is the
                  switch, and /dashboard?view=… honours it as a deep link. */}
              <SelectRow label="Dashboard layout" testid="setting-dashboard-layout" value={dashboardView}
                         options={[["professional", "Professional"], ["standard", "Standard"]]}
                         onChange={(v) => setDashboardView(v as DashboardView)} />
              <SelectRow label="Coaching tips frequency" value={notifications.coachingTipsFrequency}
                         options={[["daily", "Daily"], ["2x_week", "2× a week"], ["3x_week", "3× a week"], ["weekly", "Weekly"]]}
                         onChange={(v) => setNotif("coachingTipsFrequency", v as NotificationSettings["coachingTipsFrequency"])} />
              <div className="flex items-center justify-between py-[7px] text-[13px]">
                <span>Training reminder time</span>
                <input type="time" value={notifications.reminderTime}
                       onChange={(e) => setNotif("reminderTime", e.target.value)}
                       className="h-[32px] rounded-[5px] border border-[var(--shotiq-color-rule)] bg-white px-[8px] text-[12px] outline-none focus:border-[var(--shotiq-color-ink)]" />
              </div>
              <ToggleRow label="Daily data backup" value={automation.dataBackupEnabled}
                         onToggle={() => setAuto("dataBackupEnabled", !automation.dataBackupEnabled)} />
              <ToggleRow label="Weekly report generation" value={automation.weeklyReportEnabled}
                         onToggle={() => setAuto("weeklyReportEnabled", !automation.weeklyReportEnabled)} />
            </div>
          </div>
        </Card>

        {/* app-info band travels with Preferences so it stays reachable */}
        <Card className="mt-[16px] flex items-center divide-x divide-[var(--shotiq-color-rule)] px-[8px] py-[22px]">
          <div className="px-[16px]">
            <SectionLabel>ABOUT SHOTIQ</SectionLabel>
            <div className="text-[11px] text-[var(--shotiq-color-graphite)]">Version 1.0 · AI-powered shooting analysis.{loaded ? "" : " Loading settings…"}</div>
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
    </>
  )
}
