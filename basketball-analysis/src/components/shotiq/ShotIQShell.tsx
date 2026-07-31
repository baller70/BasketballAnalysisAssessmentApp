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
import { usePathname } from "next/navigation"
import {
  Search, Bell, ChevronDown, Home, LineChart, Activity, TrendingUp,
  Film, Compass, Settings, type LucideIcon,
} from "lucide-react"

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

  return (
    <div
      className="shotiq-canonical mx-auto flex w-full max-w-[1440px] flex-col bg-[var(--shotiq-color-paper)] text-[var(--shotiq-color-ink)]"
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

        <nav aria-label="Sections" className="flex h-full items-center gap-[44px]">
          {TABS.map((t) => {
            const is = t.label === active
            return (
              <Link
                key={t.label}
                href={t.href}
                aria-current={is ? "page" : undefined}
                className={`relative flex h-full items-center text-[15px] ${is ? "font-semibold" : "text-[var(--shotiq-color-graphite)]"}`}
              >
                {t.label}
                {is && (
                  <span className="absolute inset-x-0 bottom-0 h-[3px] bg-[var(--shotiq-color-shotiqOrange)]" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex h-full items-center">
          <button type="button" aria-label="Search" className="px-[18px]">
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

          <button type="button" aria-label="Notifications"
                  className="flex h-[38px] items-center border-l border-[var(--shotiq-color-rule)] px-[18px]">
            <Bell className="h-[19px] w-[19px]" strokeWidth={1.7} />
          </button>

          <button type="button" className="flex items-center gap-[10px] border-l border-[var(--shotiq-color-rule)] pl-[16px]">
            <span className="grid h-[36px] w-[36px] place-items-center rounded-full bg-[var(--shotiq-color-rule)] text-[12px] font-bold text-[var(--shotiq-color-graphite)]">
              {user.initials}
            </span>
            <span className="text-[13px] font-bold tracking-[0.03em]">{user.name.toUpperCase()}</span>
            <ChevronDown className="h-[15px] w-[15px] text-[var(--shotiq-color-graphite)]" />
          </button>
        </div>
      </header>

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
      <div className="absolute inset-x-0 bottom-0 flex h-[42px] items-center gap-[10px] px-[12px]">
        <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden="true">
          <path d="M3 2 L13 7.5 L3 13 Z" fill="white" />
        </svg>
        <span className="shotiq-numeric text-[11px] text-white">{elapsed} / {duration}</span>
        <span className="relative h-[3px] flex-1 rounded-full bg-white/35">
          <span className="absolute inset-y-0 left-0 rounded-full bg-white" style={{ width: `${progress * 100}%` }} />
        </span>
      </div>
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
                  className={`relative flex h-[44px] items-center gap-[12px] px-[24px] text-[14px] ${
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
