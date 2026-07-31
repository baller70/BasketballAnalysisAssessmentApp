"use client"

/** /profile — canonical 096-web-profile-settings, backed by /api/profile. */

import React, { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ChevronDown, ChevronRight, CheckCircle2, Upload, Trash2, LogOut } from "lucide-react"
import { SectionLabel, Card, TrendLine, Stat, PhaseGlyph } from "@/components/shotiq/ShotIQShell"
import { useAuthStore } from "@/stores/authStore"

export default function ProfileAccountPage() {
  const { user, signOut } = useAuthStore()
  const [form, setForm] = useState({ name: "", email: "", hand: "Right", level: "Advanced", height: "6' 4\"", weight: "195 lbs", wingspan: "6' 8\"", pref: "Catch & Shoot" })
  const [saved, setSaved] = useState(false)
  const [avatar, setAvatar] = useState<string | null>(null)
  const [exporting, setExporting] = useState<"idle" | "working" | "done">("idle")
  const [clearing, setClearing] = useState<"idle" | "confirm" | "working" | "done">("idle")
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const onAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => setAvatar(String(reader.result))
    reader.readAsDataURL(f)
  }
  const exportData = async () => {
    setExporting("working")
    try {
      const [profileRes, historyRes] = await Promise.all([
        fetch("/api/profile", { credentials: "include" }),
        fetch("/api/analysis-history?includeAnalysis=true&limit=1000", { credentials: "include" }),
      ])
      const payload = {
        exportedAt: new Date().toISOString(),
        profile: profileRes.ok ? await profileRes.json() : null,
        history: historyRes.ok ? await historyRes.json() : null,
      }
      const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }))
      const a = document.createElement("a")
      a.href = url
      a.download = "shotiq-data-export.json"
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setExporting("done")
    } catch { setExporting("idle") }
    setTimeout(() => setExporting("idle"), 2500)
  }
  const clearHistory = async () => {
    if (clearing === "idle") { setClearing("confirm"); return }
    if (clearing !== "confirm") return
    setClearing("working")
    try {
      const { csrfFetch } = await import("@/lib/api/csrfFetch")
      const res = await fetch("/api/analysis-history?limit=1000", { credentials: "include" })
      const ids: string[] = res.ok ? ((await res.json())?.items ?? []).map((r: { id: string }) => r.id) : []
      for (const id of ids) {
        await csrfFetch(`/api/analysis-history?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      }
      setClearing("done")
    } catch { setClearing("idle") }
    setTimeout(() => setClearing("idle"), 2500)
  }
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

  const save = async () => {
    setSaved(false)
    try {
      const { csrfFetch } = await import("@/lib/api/csrfFetch")
      const res = await csrfFetch("/api/profile", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: form.name,
          dominantHand: form.hand.toLowerCase(),
          experienceLevel: form.level.toLowerCase(),
        }),
      })
      if (!res.ok) throw new Error(`save failed: ${res.status}`)
      setSaved(true)
    } catch (e) {
      console.error(e)
      setSaved(false)
    }
  }

  const field = "h-[40px] w-full rounded-[5px] border border-[var(--shotiq-color-rule)] px-[10px] text-[13px] outline-none focus:border-[var(--shotiq-color-ink)]"
  const lbl = "text-[9px] font-bold tracking-[0.06em] text-[var(--shotiq-color-graphite)]"

  return (
    <div data-testid="screen-desktop-web-profile-settings" className="flex">
      <div className="min-w-0 flex-1 px-[24px] py-[18px]">
        <h1 className="shotiq-display text-[46px] leading-[48px]">PROFILE &amp; ACCOUNT</h1>
        <p className="mt-[2px] text-[13px] text-[var(--shotiq-color-graphite)]">Manage your profile, account, and personal settings.</p>

        <div className="mt-[14px] flex gap-[16px]">
          <Card className="min-w-0 flex-1 p-[18px]">
            <div className="flex items-start justify-between">
              <SectionLabel>PROFILE INFORMATION</SectionLabel>
              <div className="text-right"><div className={lbl}>JOINED</div><div className="text-[12px]">Jan 14, 2024</div></div>
            </div>
            <div className="mt-[10px] flex gap-[18px]">
              <div className="w-[120px] shrink-0 text-center">
                <div className="mx-auto grid h-[110px] w-[110px] place-items-center overflow-hidden rounded-full bg-[var(--shotiq-color-rule)]">
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatar} alt="Profile photo" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[26px] font-bold text-[var(--shotiq-color-graphite)]">
                      {(form.name || "You").slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarPick} />
                <button type="button"
                        onClick={() => { if (avatarInputRef.current) { avatarInputRef.current.dataset.opened = String(Date.now()); avatarInputRef.current.click() } }}
                        className="mt-[8px] h-[32px] w-full rounded-[5px] border border-[var(--shotiq-color-rule)] text-[12px]">Change photo</button>
                <button type="button" onClick={() => setAvatar(null)} disabled={!avatar}
                        className="mt-[4px] text-[11px] text-[var(--shotiq-color-reviewRed)] disabled:opacity-40">Remove photo</button>
              </div>
              <div className="min-w-0 flex-1">
                <div className={lbl}>FULL NAME</div>
                <input className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="profile-name" />
                <div className={`${lbl} mt-[10px]`}>EMAIL ADDRESS</div>
                <input className={field} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <div className="mt-[10px] grid grid-cols-2 gap-[12px]">
                  <div><div className={lbl}>HANDEDNESS</div>
                    <select className={field} value={form.hand} onChange={(e) => setForm({ ...form, hand: e.target.value })}>
                      {["Right", "Left"].map((o) => <option key={o}>{o}</option>)}</select></div>
                  <div><div className={lbl}>PLAY LEVEL</div>
                    <select className={field} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                      {["Beginner", "Intermediate", "Advanced", "Professional"].map((o) => <option key={o}>{o}</option>)}</select></div>
                </div>
                <div className="mt-[10px] grid grid-cols-4 gap-[12px]">
                  {([["HEIGHT", "height"], ["WEIGHT", "weight"], ["WINGSPAN", "wingspan"]] as const).map(([l, k]) => (
                    <div key={k}><div className={lbl}>{l}</div>
                      <input className={field} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></div>
                  ))}
                  <div><div className={lbl}>SHOOTING PREFERENCE</div>
                    <select className={field} value={form.pref} onChange={(e) => setForm({ ...form, pref: e.target.value })}>
                      {["Catch & Shoot", "Off the Dribble", "Pull-Up"].map((o) => <option key={o}>{o}</option>)}</select></div>
                </div>
              </div>
            </div>
            <div className="mt-[14px] flex items-center justify-between border-t border-[var(--shotiq-color-rule)] pt-[12px]">
              <span className="flex items-center gap-[6px] text-[12px] text-[var(--shotiq-color-confirmGreen)]">
                <CheckCircle2 className="h-[14px] w-[14px]" /> {saved ? "Saved" : "Profile looks good"}
              </span>
              <button type="button" onClick={save} data-testid="save-profile"
                      className="h-[40px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] px-[20px] text-[13px] font-medium text-white">
                Save changes
              </button>
            </div>
          </Card>

          <Card className="w-[420px] shrink-0 p-[18px]">
            <SectionLabel>PERFORMANCE SUMMARY</SectionLabel>
            <div className="mt-[10px] flex gap-[18px]">
              <div className="w-[110px] shrink-0 border-r border-[var(--shotiq-color-rule)] pr-[14px]">
                <div className={lbl}>FORM SCORE</div>
                <div className="shotiq-numeric text-[46px] leading-[50px] text-[var(--shotiq-color-shotiqOrange)]">82</div>
                <div className="h-[6px] rounded-full bg-[var(--shotiq-color-rule)]"><div className="h-full w-[82%] rounded-full bg-[var(--shotiq-color-shotiqOrange)]" /></div>
                <div className="mt-[6px] text-[13px] font-bold text-[var(--shotiq-color-analysisBlue)]">GOOD</div>
                <div className="text-[10px] text-[var(--shotiq-color-graphite)]">Keep building consistency.</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className={lbl}>PRIMARY COACHING TARGET</div>
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-semibold">Keep elbow stacked through release</span>
                  <ChevronRight className="h-[14px] w-[14px] text-[var(--shotiq-color-graphite)]" />
                </div>
                <span className="mt-[4px] inline-block rounded-[3px] border border-[var(--shotiq-color-confirmGreen)] px-[6px] py-[1px] text-[9px] font-bold text-[var(--shotiq-color-confirmGreen)]">ACTIVE GOAL</span>
                <div className="mt-[6px] flex items-center gap-[8px]">
                  <div className="h-[5px] flex-1 rounded-full bg-[var(--shotiq-color-rule)]"><div className="h-full w-[72%] rounded-full bg-[var(--shotiq-color-confirmGreen)]" /></div>
                  <span className="text-[11px]">72%</span>
                </div>
                <div className="mt-[10px] flex items-center gap-[14px]">
                  <Stat value="24" label="SHOTS" valueClass="text-[20px] leading-[24px]" />
                  <Stat value="15" label="MAKES" valueClass="text-[20px] leading-[24px]" />
                  <Stat value="62.5%" label="MAKE %" valueClass="text-[20px] leading-[24px]" />
                  <TrendLine points={[3, 2.5, 3.4, 3, 4]} width={70} height={30} />
                </div>
              </div>
            </div>
            <div className="mt-[14px] flex items-center justify-around border-t border-[var(--shotiq-color-rule)] pt-[12px]">
              <div className="flex items-center gap-[8px]"><span className="shotiq-numeric text-[22px]">6</span>
                <span className="text-[9px] tracking-[0.05em] text-[var(--shotiq-color-graphite)]">DAY STREAK</span></div>
              <div className="flex items-center gap-[8px]"><span className="shotiq-numeric text-[22px]">2,840</span>
                <span className="text-[9px] tracking-[0.05em] text-[var(--shotiq-color-graphite)]">POINTS</span></div>
            </div>
          </Card>
        </div>

        {/* settings groups */}
        <div className="mt-[16px] grid grid-cols-3 gap-[16px]">
          {[["NOTIFICATIONS", "Control how and when you receive updates.",
             [["Training reminders", "Enabled"], ["Weekly progress summary", "Enabled"], ["Goal updates", "Enabled"], ["New analysis ready", "Enabled"], ["Product updates", "Disabled"]]],
            ["AUTOMATION", "Manage automated analysis and insights.",
             [["Auto-analyze new shots", "Enabled"], ["Form score updates", "Enabled"], ["Goal progress tracking", "Enabled"], ["Session insights", "Enabled"], ["Technique alerts", "Enabled"]]],
            ["DATA & PRIVACY", "Control your data and privacy preferences.",
             [["Profile visibility", "Private"], ["Share analytics", "Off"], ["Analytics usage", "Product improvement"], ["Delete account", "Delete"]]]].map(([head, sub, rows]) => (
            <Card key={String(head)} className="p-[16px]">
              <div className="flex items-center gap-[10px]">
                <PhaseGlyph size={26} />
                <div>
                  <SectionLabel>{String(head)}</SectionLabel>
                  <div className="text-[11px] text-[var(--shotiq-color-graphite)]">{String(sub)}</div>
                </div>
              </div>
              <div className="mt-[6px] divide-y divide-[var(--shotiq-color-rule)]">
                {(rows as [string, string][]).map(([k, v]) => (
                  <Link key={k} href="/settings" className="flex items-center justify-between py-[8px] text-[13px]">
                    <span>{k}</span>
                    <span className={`flex items-center gap-[6px] text-[12px] ${v === "Enabled" ? "text-[var(--shotiq-color-confirmGreen)]" : v === "Delete" ? "text-[var(--shotiq-color-reviewRed)]" : "text-[var(--shotiq-color-graphite)]"}`}>
                      {v} <ChevronRight className="h-[12px] w-[12px]" />
                    </span>
                  </Link>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <Card className="mt-[16px] flex items-center divide-x divide-[var(--shotiq-color-rule)] px-[8px] py-[14px]">
          <div className="px-[16px]">
            <SectionLabel>DATA ACTIONS</SectionLabel>
            <div className="text-[11px] text-[var(--shotiq-color-graphite)]">Manage your data and analysis history.</div>
          </div>
          <div className="flex flex-1 items-center gap-[12px] px-[16px]">
            <Upload className="h-[20px] w-[20px]" />
            <div className="flex-1">
              <div className="text-[13px] font-semibold">Export all data</div>
              <div className="text-[11px] text-[var(--shotiq-color-graphite)]">Download a copy of all your shots, analyses, sessions, and account data.</div>
            </div>
            <button type="button" onClick={exportData} disabled={exporting === "working"}
                    className="h-[38px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[14px] text-[13px] disabled:opacity-60">
              {exporting === "working" ? "Exporting…" : exporting === "done" ? "Downloaded ✓" : "Export all data"}
            </button>
          </div>
          <div className="flex flex-1 items-center gap-[12px] px-[16px]">
            <Trash2 className="h-[20px] w-[20px] text-[var(--shotiq-color-reviewRed)]" />
            <div className="flex-1">
              <div className="text-[13px] font-semibold">Clear history</div>
              <div className="text-[11px] text-[var(--shotiq-color-graphite)]">Permanently delete all shots, analyses, and session history.</div>
            </div>
            <button type="button" onClick={clearHistory} disabled={clearing === "working"}
                    className="h-[38px] rounded-[6px] border border-[var(--shotiq-color-reviewRed)] px-[14px] text-[13px] text-[var(--shotiq-color-reviewRed)] disabled:opacity-60">
              {clearing === "confirm" ? "Click again to confirm" : clearing === "working" ? "Clearing…" : clearing === "done" ? "History cleared" : "Clear history"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}
