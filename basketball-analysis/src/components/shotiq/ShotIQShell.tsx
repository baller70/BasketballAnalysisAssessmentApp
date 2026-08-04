"use client"

/**
 * Canonical ShotIQ desktop application shell.
 *
 * Topbar carries identity and status only, as painted on the canonical screens
 * (079-web-home-dashboard and siblings): SHOTIQ wordmark, search, day-streak,
 * points, bell and avatar. It deliberately has no tab row — navigation lives in
 * exactly one place, the sidebar (see UnifiedSidebar below).
 *
 * Geometry derives from the HoopTrackLayoutSidecar contract (1440x900 canvas,
 * 65px topbar, 196px sidebar). Colour/typography come from the shared token CSS.
 */

import React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Search, Bell, ChevronDown, Home, LineChart, Activity, TrendingUp,
  Film, Compass, Settings, Video, Upload, Gauge, PersonStanding,
  AlertTriangle, GitCompare, CreditCard, Dumbbell, ListChecks,
  CalendarDays, Target, Trophy, User, HelpCircle, FileVideo, Award,
  SlidersHorizontal, Rocket, type LucideIcon,
} from "lucide-react"
import { useAuthStore } from "@/stores/authStore"
import { PoseGlyph, StreakGlyph, PointsGlyph } from "@/components/shotiq/Glyphs"

export type IconType = LucideIcon

export type ShotIQTab =
  | "Home" | "Analyze" | "Training" | "Progress" | "Media" | "Explore" | "Settings"

/** Every reachable screen, searchable from the topbar. */
const SEARCH_DESTINATIONS: { label: string; href: string; group: string }[] = [
  { label: "Dashboard", href: "/dashboard", group: "MAIN" },
  { label: "Analyze", href: "/analyze", group: "MAIN" },
  { label: "Live Capture", href: "/video-analysis", group: "MAIN" },
  { label: "Upload", href: "/upload", group: "MAIN" },
  { label: "Video Upload", href: "/video-analysis/upload", group: "MAIN" },
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
  { label: "Badges", href: "/badges", group: "LIBRARY" },
  { label: "Shooting Forms", href: "/admin/shooting-forms", group: "ADMIN" },
  { label: "Profile", href: "/profile", group: "ACCOUNT" },
  { label: "Onboarding", href: "/onboarding", group: "ACCOUNT" },
  { label: "Settings", href: "/settings", group: "ACCOUNT" },
  { label: "Help & Guide", href: "/guide", group: "ACCOUNT" },
  { label: "Privacy Policy", href: "/privacy", group: "LEGAL" },
  { label: "Terms of Use", href: "/terms", group: "LEGAL" },
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
}: {
  active: ShotIQTab
  children: React.ReactNode
  user?: { name: string; initials: string }
  points?: string
  streak?: string
}) {
  // `active` is kept for call-site readability only. Navigation is uniform:
  // the active row is derived from the pathname inside UnifiedSidebar, never
  // from a per-screen prop. There is deliberately no `sidebar` or
  // `railOverride` escape hatch — a screen cannot ship its own menu.
  void active
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
        <Link href="/dashboard" className="shotiq-wordmark mr-[64px] text-[21px] leading-none">
          SHOT<span className="text-[var(--shotiq-color-shotiqOrange)]">IQ</span>
        </Link>

        {/* No centre tab nav: navigation lives in the one sidebar (UnifiedSidebar).
            The topbar carries identity and status chrome only. */}

        <div className="ml-auto flex h-full items-center">
          <button type="button" aria-label="Search" aria-expanded={panel === "search"}
                  onClick={() => toggle("search")} className="px-[18px]">
            <Search className="h-[19px] w-[19px]" strokeWidth={1.7} />
          </button>

          <div className="flex h-[38px] items-center gap-[10px] border-l border-[var(--shotiq-color-rule)] px-[20px]">
            <StreakGlyph size={44} />
            <div className="text-left">
              {/* Canonical sets these at cap 18; 17px of the condensed face draws
                  12-13. Ink density already matched at 0.388 against 0.389, so
                  the weight was right and only the size was wrong. */}
              <div className="shotiq-numeric text-[23px] leading-[24px]">{streak}</div>
              <div className="shotiq-microcaps text-[var(--shotiq-color-graphite)]">DAY STREAK</div>
            </div>
          </div>

          <div className="flex h-[38px] items-center gap-[10px] border-l border-[var(--shotiq-color-rule)] px-[20px]">
            <PointsGlyph size={25} />
            <div className="text-left">
              <div className="shotiq-numeric text-[23px] leading-[24px]">{points}</div>
              <div className="shotiq-microcaps text-[var(--shotiq-color-graphite)]">POINTS</div>
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
                      <span className="shotiq-microcaps text-[var(--shotiq-color-graphite)]">{d.group}</span>
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
        <UnifiedSidebar />

        {/* ---------------------------------------------------- screen body */}
        <div data-testid="region-main" className="min-w-0 flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}

/**
 * Data-driven scatter-plus-connector trend mark. Never a raster, and never a
 * decorative curve: the drawn shape is the supplied series, so a row whose
 * delta is negative draws a falling line (canonical 079 RECENT ANALYSES).
 *
 * Canonical's mark is a thin graphite connector with a filled node dot on every
 * sample; nodes that improved on the previous sample are picked out in the
 * confirm-green accent, and a series whose net direction is flat or down draws
 * every node in the base colour. 092 adds a dotted grid behind the plot and a
 * dashed projection tail past the last real sample — both opt-in here.
 */
const TREND_BASE = "var(--shotiq-color-graphite)"

export function TrendLine({
  points, width = 100, height = 36, stroke = TREND_BASE, dotFill = TREND_BASE,
  dotAccent, dots = true, grid = false, projection, className,
}: {
  points: number[]
  width?: number
  height?: number
  stroke?: string
  dotFill?: string
  /** Colour for improving nodes. Defaults to confirm-green on an un-themed mark. */
  dotAccent?: string
  dots?: boolean
  /** Dotted horizontal guides behind the plot (canonical 092). */
  grid?: boolean
  /** Projected sample(s) drawn as a dashed tail past the last real node (092). */
  projection?: number | number[]
  className?: string
}) {
  // A one-point (or empty) series has no shape; hold it on the mid-line rather
  // than dividing by zero and painting NaN.
  const series = points.length >= 2 ? points : [points[0] ?? 0, points[0] ?? 0]
  const tail = projection == null ? [] : Array.isArray(projection) ? projection : [projection]
  const all = [...series, ...tail]
  const max = Math.max(...all), min = Math.min(...all)
  const span = max - min || 1
  const pad = Math.max(3, Math.min(6, height / 7))
  const step = (width - 2 * pad) / Math.max(1, all.length - 1)
  const xy = (v: number, i: number): [number, number] => [
    pad + i * step,
    height - pad - ((v - min) / span) * (height - 2 * pad),
  ]
  const cs = series.map(xy)
  const ts = tail.map((v, i) => xy(v, series.length + i))
  const path = (list: [number, number][]) =>
    list.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")

  const r = Math.max(1.9, Math.min(4.6, height / 9))
  // Accent only an un-themed mark: a caller that picked its own dot colour
  // (white on an orange button, ink on a light chip) wants one flat colour.
  const accent = dotAccent ?? (dotFill === TREND_BASE ? "var(--shotiq-color-confirmGreen)" : dotFill)
  const netUp = series[series.length - 1] > series[0]

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden="true">
      {grid && [0.28, 0.64, 1].map((f) => (
        <line key={f} x1={0} x2={width} y1={pad + f * (height - 2 * pad)} y2={pad + f * (height - 2 * pad)}
              stroke="var(--shotiq-color-rule)" strokeWidth={1} strokeDasharray="2 4" />
      ))}
      <path d={path(cs)} fill="none" stroke={stroke} strokeWidth={1.3}
            strokeLinecap="round" strokeLinejoin="round" />
      {ts.length > 0 && (
        <path d={path([cs[cs.length - 1], ...ts])} fill="none" stroke={stroke} strokeWidth={1.3}
              strokeDasharray="3 3" strokeOpacity={0.5} strokeLinecap="round" strokeLinejoin="round" />
      )}
      {dots && cs.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={r}
                fill={netUp && i > 0 && series[i] > series[i - 1] ? accent : dotFill} />
      ))}
      {dots && ts.map(([x, y], i) => (
        <circle key={`p${i}`} cx={x} cy={y} r={r} fill="var(--shotiq-color-paper)"
                stroke={stroke} strokeWidth={1.2} strokeOpacity={0.6} />
      ))}
    </svg>
  )
}

/**
 * Small pose mark used where a screen needs "a shot pose" without naming a
 * phase. It delegates to the one pose family in Glyphs.tsx so the release
 * figure here can never drift from the release figure on the phase timelines —
 * including the filled-silhouette weight canonical draws them at.
 */
export function PhaseGlyph({ active = false, size = 30 }: { active?: boolean; size?: number }) {
  return <PoseGlyph phase="release" active={active} size={size} />
}

/** Section label — 12px bold tracked caps used across canonical screens. */
/**
 * The card eyebrow — one label style shared by ~130 call sites.
 *
 * Measured off the desktop sidecars rather than eyeballed: across the 20
 * canonical screens there are 17 clean all-caps `caption` elements, and they
 * are unanimous on weight (500) and near-unanimous on colour (graphite, 16 of
 * 17), with a median font size of 14px. This shipped as 12px bold in ink,
 * which read as a heading rather than an eyebrow on every screen at once.
 *
 * `letterSpacing` is deliberately not taken from the sidecars: the field reads
 * 0 on all 638 text elements, so it is not measured and carries no signal. The
 * existing 0.06em tracking stands.
 *
 * The colour is measured from the renders, not from the sidecar's token name.
 * The sidecar calls these "graphite", but sampling each label at its own bounds
 * shows a spread from near-black to graphite with a median of rgb(75,77,79) —
 * and the token name is demonstrably unreliable here, since two of the sampled
 * labels it calls graphite are actually orange and green in the render. Taking
 * the name at face value made every eyebrow the lightest end of the spread.
 */
export function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`shotiq-section-label ${className}`}>{children}</div>
  )
}

/**
 * THE page-title role. Every canonical screen opens with one of these and each
 * one used to spell the role out for itself (`shotiq-display text-[46px]
 * leading-[48px]`), so the face, the weight and the size/leading relationship
 * were re-decided twenty times over — and twenty of them had drifted small.
 *
 * `size` stays per screen because canonical's own titles are not one size: at
 * 1:1 their cap heights run from 28px (088 ELITE SHOOTERS DATABASE) to 46px
 * (080 DASHBOARD). What this component owns is everything else — the display
 * face and the leading, which is always `size + 2`, the ratio the screens had
 * already converged on.
 *
 * Sizes are set from measurement, never by eye: cap height in the shipped PNG
 * against cap height in `canonical-desktop/<screen>.png` at 1:1. Our display
 * face draws a cap at 0.705em, so `size = canonical cap / 0.705`.
 */
export function PageTitle({
  size, children, className = "", ...rest
}: { size: number } & React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1 {...rest} className={`shotiq-display ${className}`}
        style={{ fontSize: size, lineHeight: `${size + 2}px`, ...(rest.style ?? {}) }}>
      {children}
    </h1>
  )
}

/**
 * The percent that closes a coaching-target progress bar ("72%").
 *
 * Nine screens drew this by hand and five of them set it in `shotiq-numeric` —
 * a condensed semibold face — at 11-15px. At those sizes the mark measures
 * 8-9px tall and ~1.5x as wide as it is tall, where canonical's measures 9-13px
 * tall and ~2x as wide: same nominal font-size, half the presence. It reads as
 * a smudge rather than a number.
 *
 * So this is the body face at a cap-matched size (canonical cap / 0.727), and
 * the numeric face is deliberately absent. Colour is left to the caller: the
 * canonical instances are not one colour (080 samples rgb(65,70,82), 083
 * rgb(20,16,22)), so there is nothing to standardise on.
 */
export function GoalPercent({
  children, size = 15, className = "",
}: { children: React.ReactNode; size?: number; className?: string }) {
  return (
    <span className={`shrink-0 ${className}`} style={{ fontSize: size }}>{children}</span>
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
export function Stat({ value, label, valueClass = "text-[29px] leading-[32px]", accent }: {
  value: React.ReactNode; label: string; valueClass?: string; accent?: string
}) {
  return (
    <div>
      <div className={`shotiq-numeric ${valueClass}`} style={accent ? { color: accent } : undefined}>{value}</div>
      {/* See `.shotiq-microcaps` in globals.css — this was 10px of the body face
          at 0.07em, which measured cap 7 against canonical's 9 and advance 31
          against 27, i.e. too small and too wide at the same time. */}
      <div className="shotiq-microcaps mt-[2px] text-[var(--shotiq-color-graphite)]">{label}</div>
    </div>
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
 * THE single navigation sidebar. One uniform menu across the whole app — no top
 * tab row, no per-screen rail variants, no railOverride. Active state derives
 * from the pathname, so a screen can never disagree with the menu about where
 * the user is, and every destination in the product is reachable from here.
 *
 * Visual language is the canonical workspace rail (081/084): tracked-caps group
 * headings, 16px line icons, active row in ShotIQ orange on warm canvas with a
 * 3px left indicator. Row and heading heights are sized so the full menu fits
 * the 900px canvas below the 65px topbar without scrolling.
 */
const SIDEBAR_GROUPS: {
  heading: string
  items: { label: string; href: string; icon: IconType }[]
}[] = [
  { heading: "MAIN", items: [
    { label: "Dashboard", href: "/dashboard", icon: Home },
    { label: "Analyze", href: "/analyze", icon: LineChart },
    { label: "Live Capture", href: "/video-analysis", icon: Video },
    { label: "Upload", href: "/upload", icon: Upload },
    { label: "Video Upload", href: "/video-analysis/upload", icon: FileVideo },
  ]},
  { heading: "RESULTS", items: [
    { label: "Overview", href: "/results/demo", icon: Gauge },
    { label: "Analysis", href: "/results/demo/analysis", icon: Activity },
    { label: "Biomechanics", href: "/results/demo/biomechanics", icon: PersonStanding },
    { label: "Flaws", href: "/results/demo/flaws", icon: AlertTriangle },
    { label: "Compare", href: "/results/demo/compare", icon: GitCompare },
    { label: "History", href: "/results/demo/history", icon: TrendingUp },
    { label: "Player Card", href: "/results/demo/player", icon: CreditCard },
  ]},
  { heading: "TRAIN", items: [
    { label: "Training", href: "/results/demo/training", icon: Dumbbell },
    { label: "Drill Library", href: "/training/drills", icon: ListChecks },
    { label: "Calendar", href: "/training/calendar", icon: CalendarDays },
    { label: "Goals", href: "/results/demo/goals", icon: Target },
  ]},
  { heading: "LIBRARY", items: [
    { label: "Media", href: "/media", icon: Film },
    { label: "Elite Shooters", href: "/elite-shooters", icon: Compass },
    { label: "Achievements", href: "/points", icon: Trophy },
    { label: "Badges", href: "/badges", icon: Award },
  ]},
  { heading: "ADMIN", items: [
    { label: "Shooting Forms", href: "/admin/shooting-forms", icon: SlidersHorizontal },
  ]},
]

const SIDEBAR_FOOTER: { label: string; href: string; icon: IconType }[] = [
  { label: "Profile", href: "/profile", icon: User },
  { label: "Onboarding", href: "/onboarding", icon: Rocket },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Help", href: "/guide", icon: HelpCircle },
]

/** Legal pages are real routes but not tabs; they sit in a compact footer line
 *  so every destination is reachable without eating a full nav row. */
const SIDEBAR_LEGAL: { label: string; href: string }[] = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
]

export function UnifiedSidebar() {
  const pathname = usePathname() ?? ""
  // "/results/demo" and "/dashboard" are prefixes of deeper routes, so they only
  // light up on an exact match; everything else also matches its subtree.
  const isActive = (href: string) =>
    href === "/results/demo" || href === "/dashboard" || href === "/video-analysis"
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/")

  const row = (
    { label, href, icon: Icon }: { label: string; href: string; icon: IconType },
    height: string,
  ) => {
    const on = isActive(href)
    return (
      <Link key={href + label} href={href}
            aria-current={on ? "page" : undefined}
            className={`relative flex ${height} items-center gap-[10px] px-[20px] text-[13px] transition-colors ${
              on
                ? "bg-[var(--shotiq-color-warmCanvas)] font-semibold text-[var(--shotiq-color-shotiqOrange)]"
                : "text-[var(--shotiq-color-ink)] hover:bg-[var(--shotiq-color-warmCanvas)]"}`}>
        {on && <span className="absolute inset-y-0 left-0 w-[3px] bg-[var(--shotiq-color-shotiqOrange)]" />}
        <Icon className="h-[16px] w-[16px] shrink-0" strokeWidth={1.6} />
        <span className="truncate">{label}</span>
      </Link>
    )
  }

  return (
    <nav data-testid="region-sidebar" aria-label="Primary"
         className="flex w-[196px] shrink-0 flex-col border-r border-[var(--shotiq-color-rule)] pt-[8px]">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {SIDEBAR_GROUPS.map((g) => (
          <div key={g.heading} className="mb-[4px]">
            <div className="px-[20px] pb-[2px] shotiq-microcaps text-[var(--shotiq-color-graphite)]">
              {g.heading}
            </div>
            {g.items.map((it) => row(it, "h-[27px]"))}
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--shotiq-color-rule)] pt-[4px]">
        {SIDEBAR_FOOTER.map((it) => row(it, "h-[27px]"))}
        <div className="flex items-center gap-[10px] px-[20px] pb-[8px] pt-[6px] text-[11px] text-[var(--shotiq-color-graphite)]">
          {SIDEBAR_LEGAL.map((l) => (
            <Link key={l.href} href={l.href}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className={isActive(l.href)
                    ? "font-semibold text-[var(--shotiq-color-shotiqOrange)]"
                    : "hover:text-[var(--shotiq-color-ink)]"}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
