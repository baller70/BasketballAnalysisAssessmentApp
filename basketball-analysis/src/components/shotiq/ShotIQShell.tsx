"use client"

/**
 * Canonical ShotIQ desktop application shell.
 *
 * Topbar and left rail exactly as painted on the canonical screens
 * (079-web-home-dashboard and siblings): SHOTIQ wordmark, centre tab nav,
 * search, day-streak, points, bell and avatar on the topbar; icon-over-label
 * rail on the left with Settings pinned to the bottom.
 *
 * Geometry derives from the HoopTrackLayoutSidecar contract (1440x900 canvas,
 * 87px rail, 65px topbar). Colour/typography come from the shared token CSS.
 */

import React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Search, Bell, ChevronDown, Home, LineChart, Activity, TrendingUp,
  Film, Compass, Settings, type LucideIcon,
} from "lucide-react"
import { useAuthStore } from "@/stores/authStore"

export type IconType = LucideIcon

export type ShotIQTab =
  | "Home" | "Analyze" | "Training" | "Progress" | "Media" | "Explore" | "Settings"

const TABS: { label: ShotIQTab; href: string }[] = [
  { label: "Home", href: "/dashboard" },
  { label: "Analyze", href: "/analyze" },
  { label: "Training", href: "/results/demo/training" },
  { label: "Progress", href: "/results/demo/history" },
  { label: "Media", href: "/media" },
  { label: "Explore", href: "/elite-shooters" },
]

const RAIL: { label: string; href: string; icon: IconType }[] = [
  { label: "HOME", href: "/dashboard", icon: Home },
  { label: "ANALYZE", href: "/analyze", icon: LineChart },
  { label: "TRAINING", href: "/results/demo/training", icon: Activity },
  { label: "PROGRESS", href: "/results/demo/history", icon: TrendingUp },
  { label: "MEDIA", href: "/media", icon: Film },
  { label: "EXPLORE", href: "/elite-shooters", icon: Compass },
]

/** Every reachable screen, searchable from the topbar. */
const SEARCH_DESTINATIONS: { label: string; href: string; group: string }[] = [
  { label: "Dashboard", href: "/dashboard", group: "MAIN" },
  { label: "Analyze", href: "/analyze", group: "MAIN" },
  { label: "Live Capture", href: "/video-analysis", group: "MAIN" },
  { label: "Upload Video", href: "/video-analysis/upload", group: "MAIN" },
  { label: "Results Overview", href: "/results/demo", group: "RESULTS" },
  { label: "Analysis", href: "/results/demo/analysis", group: "RESULTS" },
  { label: "Biomechanics", href: "/results/demo/biomechanics", group: "RESULTS" },
  { label: "Flaws", href: "/results/demo/flaws", group: "RESULTS" },
  { label: "Compare", href: "/results/demo/compare", group: "RESULTS" },
  { label: "History", href: "/results/demo/history", group: "RESULTS" },
  { label: "Player Card", href: "/results/demo/player", group: "RESULTS" },
  { label: "Training", href: "/results/demo/training", group: "TRAIN" },
  { label: "Drill Library", href: "/training/drills", group: "TRAIN" },
  { label: "Training Calendar", href: "/training/calendar", group: "TRAIN" },
  { label: "Goals", href: "/results/demo/goals", group: "TRAIN" },
  { label: "Media", href: "/media", group: "LIBRARY" },
  { label: "Elite Shooters", href: "/elite-shooters", group: "LIBRARY" },
  { label: "Achievements", href: "/points", group: "LIBRARY" },
  { label: "Profile", href: "/profile", group: "ACCOUNT" },
  { label: "Settings", href: "/settings", group: "ACCOUNT" },
  { label: "Help & Guide", href: "/guide", group: "ACCOUNT" },
]

const TOPBAR_NOTICES = [
  { title: "Analysis complete", body: "Your latest session finished processing.", href: "/results/demo" },
  { title: "Streak at risk", body: "Train today to keep your 6-day streak.", href: "/results/demo/training" },
  { title: "New badge earned", body: "Form Improver unlocked in Achievements.", href: "/points" },
]

export function ShotIQShell({
  active,
  children,
  user = { name: "Jordan Ellis", initials: "JE" },
  points = "2,840",
  streak = "6",
  railOverride,
  sidebar,
}: {
  active: ShotIQTab
  children: React.ReactNode
  user?: { name: string; initials: string }
  points?: string
  streak?: string
  /** Some canonical screens label the rail differently (e.g. DASHBOARD/ANALYSES on 080). */
  railOverride?: { label: string; href: string; icon: IconType; active?: boolean }[]
  /** Replace the icon rail entirely (e.g. the wide text sidebar on 081/084). */
  sidebar?: React.ReactNode
}) {
  const pathname = usePathname()
  void pathname
  const router = useRouter()
  const [panel, setPanel] = React.useState<null | "search" | "bell" | "account">(null)
  const [query, setQuery] = React.useState("")
  const [notices, setNotices] = React.useState(TOPBAR_NOTICES)
  const toggle = (p: "search" | "bell" | "account") => {
    setPanel((cur) => (cur === p ? null : p))
    setQuery("")
  }
  const matches = SEARCH_DESTINATIONS.filter((d) =>
    d.label.toLowerCase().includes(query.trim().toLowerCase()))
  const go = (href: string) => { setPanel(null); setQuery(""); router.push(href) }

  return (
    <div
      className="shotiq-canonical relative mx-auto flex w-full max-w-[1440px] flex-col bg-[var(--shotiq-color-paper)] text-[var(--shotiq-color-ink)]"
      style={{ minHeight: 900 }}
    >
      {/* ---------------------------------------------------------- topbar */}
      <header
        data-testid="region-topbar"
        className="flex h-[65px] shrink-0 items-center border-b border-[var(--shotiq-color-rule)] pl-[20px] pr-[18px]"
      >
        <Link href="/dashboard" className="shotiq-wordmark mr-[64px] text-[26px] leading-none">
          SHOT<span className="text-[var(--shotiq-color-shotiqOrange)]">IQ</span>
        </Link>

        {/* Canonical centre tab nav (079/080/081): active tab carries a 3px
            orange underline at the bottom edge of the 65px topbar. */}
        <nav aria-label="Primary tabs" className="flex h-full items-center gap-[44px]">
          {TABS.map((t) => {
            const is = t.label === active
            return (
              <Link key={t.label} href={t.href}
                    aria-current={is ? "page" : undefined}
                    className="relative flex h-full items-center text-[14px] text-[var(--shotiq-color-ink)]">
                {t.label}
                {is && <span className="absolute inset-x-0 bottom-0 h-[3px] bg-[var(--shotiq-color-shotiqOrange)]" />}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex h-full items-center">
          <button type="button" aria-label="Search" aria-expanded={panel === "search"}
                  onClick={() => toggle("search")} className="px-[18px]">
            <Search className="h-[19px] w-[19px]" strokeWidth={1.7} />
          </button>

          <div className="flex h-[38px] items-center gap-[10px] border-l border-[var(--shotiq-color-rule)] px-[20px]">
            <Film className="h-[22px] w-[22px]" strokeWidth={1.5} />
            <div className="text-left">
              <div className="shotiq-numeric text-[17px] leading-[18px]">{streak}</div>
              <div className="text-[9px] tracking-[0.08em] text-[var(--shotiq-color-graphite)]">DAY STREAK</div>
            </div>
          </div>

          <div className="flex h-[38px] items-center gap-[10px] border-l border-[var(--shotiq-color-rule)] px-[20px]">
            <TrendingUp className="h-[20px] w-[20px]" strokeWidth={1.6} />
            <div className="text-left">
              <div className="shotiq-numeric text-[17px] leading-[18px]">{points}</div>
              <div className="text-[9px] tracking-[0.08em] text-[var(--shotiq-color-graphite)]">POINTS</div>
            </div>
          </div>

          <button type="button" aria-label="Notifications" aria-expanded={panel === "bell"}
                  onClick={() => toggle("bell")}
                  className="relative flex h-[38px] items-center border-l border-[var(--shotiq-color-rule)] px-[18px]">
            <Bell className="h-[19px] w-[19px]" strokeWidth={1.7} />
            {notices.length > 0 && (
              <span className="absolute right-[13px] top-[4px] h-[7px] w-[7px] rounded-full bg-[var(--shotiq-color-shotiqOrange)]" />
            )}
          </button>

          <button type="button" aria-expanded={panel === "account"} aria-label="Account menu"
                  onClick={() => toggle("account")}
                  className="flex items-center gap-[10px] border-l border-[var(--shotiq-color-rule)] pl-[16px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/canonical/avatar-topbar.png" alt=""
                 className="h-[36px] w-[36px] rounded-full object-cover" />
            <span className="text-[13px] font-bold tracking-[0.03em]">{user.name.toUpperCase()}</span>
            <ChevronDown className="h-[15px] w-[15px] text-[var(--shotiq-color-graphite)]" />
          </button>
        </div>
      </header>

      {panel && (
        <>
          <button type="button" aria-label="Close menu" onClick={() => setPanel(null)}
                  className="fixed inset-0 z-40 cursor-default bg-transparent" />
          <div className="absolute right-[12px] top-[62px] z-50 w-[300px] rounded-[8px] border border-[var(--shotiq-color-rule)] bg-white shadow-[0_10px_28px_rgba(17,17,17,0.12)]"
               data-testid={`topbar-panel-${panel}`}>
            {panel === "search" && (
              <div className="p-[10px]">
                <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
                       onKeyDown={(e) => { if (e.key === "Enter" && matches[0]) go(matches[0].href); if (e.key === "Escape") setPanel(null) }}
                       placeholder="Search ShotIQ…" aria-label="Search ShotIQ"
                       className="h-[38px] w-full rounded-[6px] border border-[var(--shotiq-color-rule)] px-[12px] text-[13px] outline-none focus:border-[var(--shotiq-color-ink)]" />
                <div className="mt-[8px] max-h-[300px] overflow-y-auto">
                  {matches.length === 0 && (
                    <div className="px-[10px] py-[12px] text-[12px] text-[var(--shotiq-color-graphite)]">No screens match “{query}”.</div>
                  )}
                  {matches.slice(0, 9).map((d) => (
                    <button key={d.href + d.label} type="button" onClick={() => go(d.href)}
                            className="flex h-[34px] w-full items-center justify-between rounded-[6px] px-[10px] text-[13px] hover:bg-[var(--shotiq-color-warmCanvas)]">
                      <span>{d.label}</span>
                      <span className="text-[10px] tracking-[0.06em] text-[var(--shotiq-color-graphite)]">{d.group}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {panel === "bell" && (
              <div className="p-[10px]">
                <div className="flex items-center justify-between px-[6px] pb-[6px]">
                  <span className="text-[12px] font-bold tracking-[0.06em]">NOTIFICATIONS</span>
                  <button type="button" onClick={() => setNotices([])} disabled={!notices.length}
                          className="text-[12px] text-[var(--shotiq-color-analysisBlue)] disabled:text-[var(--shotiq-color-muted)]">
                    Mark all read
                  </button>
                </div>
                {notices.length === 0 && (
                  <div className="px-[6px] py-[14px] text-[12px] text-[var(--shotiq-color-graphite)]">You&apos;re all caught up.</div>
                )}
                {notices.map((n) => (
                  <button key={n.title} type="button" onClick={() => go(n.href)}
                          className="block w-full rounded-[6px] px-[6px] py-[8px] text-left hover:bg-[var(--shotiq-color-warmCanvas)]">
                    <div className="text-[13px] font-medium">{n.title}</div>
                    <div className="mt-[2px] text-[12px] text-[var(--shotiq-color-graphite)]">{n.body}</div>
                  </button>
                ))}
              </div>
            )}
            {panel === "account" && (
              <div className="p-[8px]">
                <div className="border-b border-[var(--shotiq-color-rule)] px-[10px] pb-[8px]">
                  <div className="text-[13px] font-bold">{user.name}</div>
                  <div className="text-[12px] text-[var(--shotiq-color-graphite)]">Signed in</div>
                </div>
                {[["Profile", "/profile"], ["Settings", "/settings"], ["Help & guide", "/guide"]].map(([l, href]) => (
                  <button key={href} type="button" onClick={() => go(href)}
                          className="flex h-[34px] w-full items-center rounded-[6px] px-[10px] text-[13px] hover:bg-[var(--shotiq-color-warmCanvas)]">
                    {l}
                  </button>
                ))}
                <button type="button"
                        onClick={async () => {
                          useAuthStore.getState().signOut()
                          // signOut clears the httpOnly cookie asynchronously —
                          // wait for it so /signin doesn't bounce us back in.
                          try {
                            const { getCsrfToken } = await import("@/lib/api/csrfFetch")
                            await fetch("/api/auth/signout", {
                              method: "POST", credentials: "include",
                              headers: { "x-csrf-token": await getCsrfToken() },
                            })
                          } catch { /* cookie may already be gone */ }
                          window.location.assign("/signin")
                        }}
                        className="mt-[2px] flex h-[34px] w-full items-center rounded-[6px] px-[10px] text-[13px] text-[var(--shotiq-color-reviewRed)] hover:bg-[var(--shotiq-color-warmCanvas)]">
                  Sign out
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <div className="flex min-h-0 flex-1">
        {sidebar ?? (
        <nav
          data-testid="region-sidebar"
          aria-label="Primary"
          className="flex w-[87px] shrink-0 flex-col items-center border-r border-[var(--shotiq-color-rule)] pt-[28px]"
        >
          {(railOverride ?? RAIL).map((r) => {
            const is = "active" in r && r.active !== undefined ? r.active : r.label === active.toUpperCase()
            return (
              <Link key={r.label} href={r.href}
                    aria-current={is ? "page" : undefined}
                    className={`mb-[30px] flex w-full flex-col items-center gap-[8px] ${is ? "text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-ink)]"}`}>
                <r.icon className="h-[22px] w-[22px]" strokeWidth={1.5} />
                <span className="text-[9px] font-bold tracking-[0.08em]">{r.label}</span>
              </Link>
            )
          })}
          <div className="flex-1" />
          <Link href="/settings"
                className={`mb-[28px] flex w-full flex-col items-center gap-[8px] ${active === "Settings" ? "text-[var(--shotiq-color-shotiqOrange)]" : ""}`}>
            <Settings className="h-[22px] w-[22px]" strokeWidth={1.5} />
            <span className="text-[9px] font-bold tracking-[0.08em]">SETTINGS</span>
          </Link>
        </nav>
        )}

        {/* ---------------------------------------------------- screen body */}
        <div data-testid="region-main" className="min-w-0 flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}

/** Data-driven sparkline/trend SVG shared by canonical screens. Never a raster. */
export function TrendLine({
  points, width = 100, height = 36, stroke = "var(--shotiq-color-confirmGreen)",
  dotFill = "var(--shotiq-color-confirmGreen)",
}: { points: number[]; width?: number; height?: number; stroke?: string; dotFill?: string }) {
  const max = Math.max(...points), min = Math.min(...points)
  const span = max - min || 1
  const pad = 4
  const cs = points.map((p, i) => [
    pad + (i / (points.length - 1)) * (width - 2 * pad),
    height - pad - ((p - min) / span) * (height - 2 * pad),
  ] as const)
  const d = cs.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={d} fill="none" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      {cs.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={2.6} fill={dotFill} />)}
    </svg>
  )
}

/** Small pose glyph used for shot phases; parametric SVG, recolourable by token. */
export function PhaseGlyph({ active = false, size = 30 }: { active?: boolean; size?: number }) {
  const c = active ? "var(--shotiq-color-shotiqOrange)" : "var(--shotiq-color-ink)"
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" aria-hidden="true">
      <g stroke={c} strokeWidth={1.6} strokeLinecap="round" fill="none">
        <circle cx="17" cy="5" r="2.6" />
        <path d="M17 8 L15 15 L11 21 M15 15 L18 21 M17 9.5 L22 7 M22 7 L24 3" />
        <circle cx="25" cy="2.5" r="1.8" fill={active ? c : "none"} stroke={c} />
      </g>
    </svg>
  )
}

/** Section label — 12px bold tracked caps used across canonical screens. */
export function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`text-[12px] font-bold tracking-[0.06em] ${className}`}>{children}</div>
  )
}

/** Canonical card container. */
export function Card({ children, className = "", ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest}
         className={`rounded-[8px] border border-[var(--shotiq-color-rule)] bg-white ${className}`}>
      {children}
    </div>
  )
}

/** Dark media surface with player chrome. Dark is permitted only where the
 *  canonical screen contains a media/video surface; the photographic frame
 *  itself was not supplied with the package, so only chrome is painted. */
export function MediaSurface({
  width, height, duration = "0:07", elapsed = "0:00", progress = 0.28,
  rounded = 4, className = "",
}: {
  width?: number | string; height: number | string; duration?: string
  elapsed?: string; progress?: number; rounded?: number; className?: string
}) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-[#1B1D20] ${className}`}
      style={{ width, height, borderRadius: rounded }}
      data-testid="media-surface"
    >
      {(typeof height !== "number" || height >= 64) && (
        <div className="absolute inset-x-0 bottom-0 flex h-[42px] items-center gap-[10px] px-[12px]">
          <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden="true">
            <path d="M3 2 L13 7.5 L3 13 Z" fill="white" />
          </svg>
          <span className="shotiq-numeric text-[11px] text-white">{elapsed} / {duration}</span>
          <span className="relative h-[3px] flex-1 rounded-full bg-white/35">
            <span className="absolute inset-y-0 left-0 rounded-full bg-white" style={{ width: `${progress * 100}%` }} />
          </span>
        </div>
      )}
    </div>
  )
}

/** Inline stat block: numeric value over tracked caps label. */
export function Stat({ value, label, valueClass = "text-[24px] leading-[28px]", accent }: {
  value: React.ReactNode; label: string; valueClass?: string; accent?: string
}) {
  return (
    <div>
      <div className={`shotiq-numeric ${valueClass}`} style={accent ? { color: accent } : undefined}>{value}</div>
      <div className="mt-[2px] text-[10px] tracking-[0.07em] text-[var(--shotiq-color-graphite)]">{label}</div>
    </div>
  )
}

/** Wide text sidebar used by workspace screens (081 analyze, 084 biomechanics).
 *  190px, grouped by tracked-caps section labels, active row in orange with a
 *  left indicator bar. */
export function WideSidebar({ sections }: {
  sections: { heading: string; items: { label: string; href: string; icon: IconType; active?: boolean }[] }[]
}) {
  return (
    <nav data-testid="region-sidebar" aria-label="Workspace"
         className="w-[190px] shrink-0 border-r border-[var(--shotiq-color-rule)] pt-[24px]">
      {sections.map((sec) => (
        <div key={sec.heading} className="mb-[18px]">
          <div className="px-[24px] pb-[8px] text-[11px] font-bold tracking-[0.08em] text-[var(--shotiq-color-graphite)]">
            {sec.heading}
          </div>
          {sec.items.map((it) => (
            <Link key={it.label} href={it.href}
                  aria-current={it.active ? "page" : undefined}
                  className={`relative flex h-[44px] items-center gap-[10px] whitespace-nowrap px-[22px] text-[14px] ${
                    it.active
                      ? "bg-[var(--shotiq-color-warmCanvas)] font-semibold text-[var(--shotiq-color-shotiqOrange)]"
                      : "text-[var(--shotiq-color-ink)]"}`}>
              {it.active && <span className="absolute inset-y-0 right-0 w-[3px] bg-[var(--shotiq-color-shotiqOrange)]" />}
              <it.icon className="h-[17px] w-[17px]" strokeWidth={1.6} />
              {it.label}
            </Link>
          ))}
          <div className="mx-[24px] mt-[14px] border-b border-[var(--shotiq-color-rule)]" />
        </div>
      ))}
    </nav>
  )
}

/** Circular progress ring (SVG, data-driven). */
export function Ring({ pct, size = 96, stroke = 8, color = "var(--shotiq-color-shotiqOrange)", children }: {
  pct: number; size?: number; stroke?: number; color?: string; children?: React.ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <span className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--shotiq-color-rule)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={`${c * Math.min(1, Math.max(0, pct))} ${c}`} strokeLinecap="round" />
      </svg>
      <span className="absolute">{children}</span>
    </span>
  )
}

/**
 * THE single navigation sidebar (Kevin's directive: one uniform sidebar across
 * the whole app, no top menu, no per-screen variants). Active state derives
 * from the pathname; every destination in the product is reachable from here.
 */
export function UnifiedSidebar() {
  const pathname = usePathname() ?? ""
  const groups: { heading: string; items: { label: string; href: string }[] }[] = [
    { heading: "MAIN", items: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Analyze", href: "/analyze" },
      { label: "Live Capture", href: "/video-analysis" },
    ]},
    { heading: "RESULTS", items: [
      { label: "Overview", href: "/results/demo" },
      { label: "Analysis", href: "/results/demo/analysis" },
      { label: "Biomechanics", href: "/results/demo/biomechanics" },
      { label: "Flaws", href: "/results/demo/flaws" },
      { label: "Compare", href: "/results/demo/compare" },
      { label: "History", href: "/results/demo/history" },
      { label: "Player Card", href: "/results/demo/player" },
    ]},
    { heading: "TRAIN", items: [
      { label: "Training", href: "/results/demo/training" },
      { label: "Goals", href: "/results/demo/goals" },
    ]},
    { heading: "LIBRARY", items: [
      { label: "Media", href: "/media" },
      { label: "Elite Shooters", href: "/elite-shooters" },
      { label: "Achievements", href: "/points" },
    ]},
  ]
  const isActive = (href: string) =>
    href === "/results/demo" || href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/")
  return (
    <nav data-testid="region-sidebar" aria-label="Primary"
         className="flex w-[184px] shrink-0 flex-col border-r border-[var(--shotiq-color-rule)] pt-[16px]">
      <div className="flex-1 overflow-y-auto">
        {groups.map((g) => (
          <div key={g.heading} className="mb-[10px]">
            <div className="px-[22px] pb-[4px] text-[10px] font-bold tracking-[0.08em] text-[var(--shotiq-color-graphite)]">
              {g.heading}
            </div>
            {g.items.map((it) => {
              const on = isActive(it.href)
              return (
                <Link key={it.href + it.label} href={it.href}
                      aria-current={on ? "page" : undefined}
                      className={`relative flex h-[36px] items-center px-[22px] text-[13px] ${
                        on ? "bg-[var(--shotiq-color-warmCanvas)] font-semibold text-[var(--shotiq-color-shotiqOrange)]"
                           : "text-[var(--shotiq-color-ink)]"}`}>
                  {on && <span className="absolute inset-y-0 left-0 w-[3px] bg-[var(--shotiq-color-shotiqOrange)]" />}
                  {it.label}
                </Link>
              )
            })}
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--shotiq-color-rule)] py-[8px]">
        {[["Profile", "/profile"], ["Settings", "/settings"], ["Help", "/guide"]].map(([l, href]) => {
          const on = isActive(href)
          return (
            <Link key={href} href={href}
                  className={`relative flex h-[34px] items-center px-[22px] text-[13px] ${
                    on ? "font-semibold text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-ink)]"}`}>
              {on && <span className="absolute inset-y-0 left-0 w-[3px] bg-[var(--shotiq-color-shotiqOrange)]" />}
              {l}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
