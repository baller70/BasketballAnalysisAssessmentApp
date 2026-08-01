"use client"

/**
 * Canonical shell + per-screen left sidebar for the /results/demo family.
 *
 * The canonical screens paint different sidebars per workspace:
 *  - 090 training  → TRAINING HUB nav + coaching-target card
 *  - 093 history   → icon-over-label rail (HISTORY active)
 *  - 087 compare   → icon-over-label rail (AI Analysis active)
 *  - 086 player    → text nav with Profile active
 * Everything else keeps the grouped WideSidebar. Every previously reachable
 * tab stays reachable from every variant.
 */

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutGrid, Crosshair, AlertTriangle, User, GitCompare, History as HistoryIcon,
  Target, Dumbbell, UserCog, Settings2, ChevronRight, ChevronLeft, Activity,
  Video, Film, StickyNote, Settings, LineChart, TrendingUp, Compass, Trophy,
  HelpCircle, LogOut, BookMarked, Search, Calendar as CalendarIcon, Download,
} from "lucide-react"
import { ShotIQShell, WideSidebar, type ShotIQTab } from "@/components/shotiq/ShotIQShell"

const SECTION: Record<string, ShotIQTab> = {
  analysis: "Analyze", flaws: "Analyze", player: "Analyze", compare: "Analyze",
  training: "Training", goals: "Progress", history: "Progress",
}

/** 090 — Training Hub sidebar with the coaching-target card. */
function TrainingHubSidebar() {
  const items = [
    { label: "Overview", href: "/results/demo/training", icon: Activity, active: true },
    { label: "My drills", href: "/training/drills?tab=saved", icon: BookMarked, active: false },
    { label: "Discover", href: "/training/drills?tab=discover", icon: Search, active: false },
    { label: "Calendar", href: "/training/calendar", icon: CalendarIcon, active: false },
    { label: "Open workout", href: "/training/drills/quick-start-workout", icon: Download, active: false },
  ]
  return (
    <nav data-testid="region-sidebar" aria-label="Training hub"
         className="w-[219px] shrink-0 border-r border-[var(--shotiq-color-rule)] px-[20px] pt-[20px]">
      <div className="shotiq-display text-[17px] leading-[18px]">TRAINING HUB</div>
      <div className="mt-[12px] -mx-[20px]">
        {items.map((it) => (
          <Link key={it.label} href={it.href}
                aria-current={it.active ? "page" : undefined}
                className={`relative flex items-center gap-[12px] px-[20px] py-[10px] text-[14px] ${
                  it.active ? "font-semibold text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-ink)]"}`}>
            {it.active && <span className="absolute inset-y-[6px] left-0 w-[3px] rounded-r-full bg-[var(--shotiq-color-shotiqOrange)]" />}
            <it.icon className="h-[19px] w-[19px]" strokeWidth={1.5} /> {it.label}
          </Link>
        ))}
      </div>
      <div className="mt-[16px] border-t border-[var(--shotiq-color-rule)] pt-[16px]">
        <div className="text-[11px] font-bold tracking-[0.08em] text-[var(--shotiq-color-graphite)]">COACHING TARGET</div>
        <Link href="/results/demo/goals" className="mt-[8px] flex items-start justify-between gap-[6px]">
          <span className="text-[16px] font-semibold leading-[21px]">Keep elbow stacked through release</span>
          <ChevronRight className="mt-[3px] h-[14px] w-[14px] shrink-0 text-[var(--shotiq-color-graphite)]" />
        </Link>
        <span className="mt-[8px] inline-block rounded-[3px] border border-[var(--shotiq-color-confirmGreen)] px-[7px] py-[2px] text-[9px] font-bold tracking-[0.05em] text-[var(--shotiq-color-confirmGreen)]">ACTIVE GOAL</span>
        <div className="mt-[10px] flex items-end justify-between text-[11px] text-[var(--shotiq-color-graphite)]">
          <span className="leading-[15px]">Improve release consistency and arm alignment</span>
          <span className="pl-[6px]">72%</span>
        </div>
        <div className="mt-[4px] h-[5px] rounded-full bg-[var(--shotiq-color-rule)]">
          <div className="h-full w-[72%] rounded-full bg-[var(--shotiq-color-confirmGreen)]" />
        </div>
      </div>
      <div className="mt-[16px] border-t border-[var(--shotiq-color-rule)] pt-[14px]">
        <div className="text-[11px] text-[var(--shotiq-color-graphite)]">Form score</div>
        <div className="shotiq-numeric text-[40px] leading-[44px] text-[var(--shotiq-color-shotiqOrange)]">82</div>
        <div className="h-[6px] w-[100px] rounded-full bg-[var(--shotiq-color-rule)]">
          <div className="h-full w-[82%] rounded-full bg-[var(--shotiq-color-shotiqOrange)]" />
        </div>
        <div className="mt-[6px] text-[12px] font-semibold text-[var(--shotiq-color-analysisBlue)]">Good</div>
        <div className="text-[10px] text-[var(--shotiq-color-graphite)]">Keep building consistency.</div>
      </div>
    </nav>
  )
}

/** Icon-over-label rail used by 093 (history) and 087 (compare). */
function IconRail({ items, footer }: {
  items: { label: string; href: string; icon: React.ElementType; active?: boolean }[]
  footer: React.ReactNode
}) {
  return (
    <nav data-testid="region-sidebar" aria-label="Workspace"
         className="flex w-[133px] shrink-0 flex-col border-r border-[var(--shotiq-color-rule)] pt-[24px]">
      {items.map((it) => (
        <Link key={it.label} href={it.href} aria-current={it.active ? "page" : undefined}
              className={`relative mb-[10px] flex flex-col items-center gap-[6px] py-[8px] ${
                it.active ? "text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-ink)]"}`}>
          {it.active && <span className="absolute inset-y-[2px] left-0 w-[4px] rounded-r-full bg-[var(--shotiq-color-shotiqOrange)]" />}
          <it.icon className="h-[24px] w-[24px]" strokeWidth={1.5} />
          <span className="text-[10px] font-bold tracking-[0.06em]">{it.label}</span>
        </Link>
      ))}
      <div className="flex-1" />
      {footer}
    </nav>
  )
}

function HistorySidebar() {
  return (
    <IconRail
      items={[
        { label: "DASHBOARD", href: "/dashboard", icon: LayoutGrid },
        { label: "CAPTURE", href: "/video-analysis", icon: Video },
        { label: "HISTORY", href: "/results/demo/history", icon: HistoryIcon, active: true },
        { label: "COMPARE", href: "/results/demo/compare", icon: GitCompare },
        { label: "GOALS", href: "/results/demo/goals", icon: Target },
        { label: "MEDIA", href: "/media", icon: Film },
        { label: "NOTES", href: "/results/demo/analysis", icon: StickyNote },
        { label: "SETTINGS", href: "/settings", icon: Settings },
      ]}
      footer={
        <Link href="/dashboard" className="mb-[18px] flex items-center justify-center gap-[6px] text-[10px] font-bold tracking-[0.06em] text-[var(--shotiq-color-graphite)]">
          <ChevronLeft className="h-[12px] w-[12px]" /> COLLAPSE
        </Link>
      }
    />
  )
}

function CompareSidebar() {
  return (
    <IconRail
      items={[
        { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
        { label: "Shoot History", href: "/results/demo/history", icon: HistoryIcon },
        { label: "AI Analysis", href: "/results/demo/analysis", icon: Activity, active: true },
        { label: "Training", href: "/results/demo/training", icon: Dumbbell },
        { label: "Goals", href: "/results/demo/goals", icon: Target },
        { label: "Media", href: "/media", icon: Film },
        { label: "Achievements", href: "/points", icon: Trophy },
        { label: "Settings", href: "/settings", icon: Settings },
      ]}
      footer={
        <div className="mb-[14px] flex flex-col items-center gap-[12px]">
          <Link href="/guide" className="flex flex-col items-center gap-[4px] text-[10px] font-bold tracking-[0.04em] text-[var(--shotiq-color-ink)]">
            <HelpCircle className="h-[20px] w-[20px]" strokeWidth={1.5} /> Help
          </Link>
          <Link href="/dashboard" className="flex items-center gap-[6px] text-[11px] text-[var(--shotiq-color-graphite)]">
            <ChevronLeft className="h-[12px] w-[12px]" /> Collapse
          </Link>
        </div>
      }
    />
  )
}

/** 086 — text nav with Profile active. */
function PlayerCardSidebar() {
  const main = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    { label: "Analyze", href: "/analyze", icon: LineChart },
    { label: "Training", href: "/results/demo/training", icon: Dumbbell },
    { label: "Progress", href: "/results/demo/history", icon: TrendingUp },
    { label: "Media", href: "/media", icon: Film },
    { label: "Explore", href: "/elite-shooters", icon: Compass },
  ]
  const account = [
    { label: "Goals", href: "/results/demo/goals", icon: Target, active: false },
    { label: "Achievements", href: "/points", icon: Trophy, active: false },
    { label: "Profile", href: "/results/demo/player", icon: UserCog, active: true },
    { label: "Settings", href: "/settings", icon: Settings2, active: false },
  ]
  const row = "flex items-center gap-[12px] px-[22px] py-[9px] text-[13px]"
  return (
    <nav data-testid="region-sidebar" aria-label="Player card"
         className="flex w-[150px] shrink-0 flex-col border-r border-[var(--shotiq-color-rule)] pt-[22px]">
      {main.map((it) => (
        <Link key={it.label} href={it.href} className={`${row} text-[var(--shotiq-color-ink)]`}>
          <it.icon className="h-[17px] w-[17px]" strokeWidth={1.5} /> {it.label}
        </Link>
      ))}
      <div className="mx-[22px] my-[10px] border-t border-[var(--shotiq-color-rule)]" />
      {account.map((it) => (
        <Link key={it.label} href={it.href} aria-current={it.active ? "page" : undefined}
              className={`${row} ${it.active ? "font-semibold text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-ink)]"}`}>
          <it.icon className="h-[17px] w-[17px]" strokeWidth={1.5} /> {it.label}
        </Link>
      ))}
      <div className="flex-1" />
      <Link href="/guide" className={`${row} text-[var(--shotiq-color-ink)]`}>
        <HelpCircle className="h-[17px] w-[17px]" strokeWidth={1.5} /> Help
      </Link>
      <Link href="/signin" className={`${row} mb-[14px] text-[var(--shotiq-color-ink)]`}>
        <LogOut className="h-[17px] w-[17px]" strokeWidth={1.5} /> Log out
      </Link>
    </nav>
  )
}

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const tab = pathname?.split("/").pop() || ""
  const active = pathname === "/results/demo" ? "Home" : (SECTION[tab] ?? "Analyze")
  const is = (t: string) => tab === t

  const sidebar =
    tab === "training" ? <TrainingHubSidebar />
    : tab === "history" ? <HistorySidebar />
    : tab === "compare" ? <CompareSidebar />
    : tab === "player" ? <PlayerCardSidebar />
    : (
      <WideSidebar sections={[
        { heading: "ANALYZE", items: [
          { label: "Overview", href: "/results/demo", icon: LayoutGrid, active: pathname === "/results/demo" },
          { label: "Analysis", href: "/results/demo/analysis", icon: Crosshair, active: is("analysis") },
          { label: "Flaws", href: "/results/demo/flaws", icon: AlertTriangle, active: is("flaws") },
          { label: "Compare", href: "/results/demo/compare", icon: GitCompare, active: is("compare") },
        ]},
        { heading: "SESSIONS", items: [
          { label: "History", href: "/results/demo/history", icon: HistoryIcon, active: is("history") },
          { label: "Player Card", href: "/results/demo/player", icon: User, active: is("player") },
        ]},
        { heading: "TOOLS", items: [
          { label: "Training", href: "/results/demo/training", icon: Dumbbell, active: is("training") },
          { label: "Goals", href: "/results/demo/goals", icon: Target, active: is("goals") },
        ]},
        { heading: "SETTINGS", items: [
          { label: "Profile", href: "/profile", icon: UserCog },
          { label: "Preferences", href: "/settings", icon: Settings2 },
        ]},
      ]} />
    )

  return (
    <ShotIQShell active={active as ShotIQTab} sidebar={sidebar}>
      <div className="px-[26px] py-[18px]">{children}</div>
    </ShotIQShell>
  )
}
