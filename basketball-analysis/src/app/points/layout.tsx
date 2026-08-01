"use client"

/**
 * Canonical shell wrapper for /points — 095-web-achievements-points.
 * Text sidebar per the canonical: Overview … Settings with Achievements
 * active, Help pinned to the bottom.
 */

import Link from "next/link"
import {
  LayoutGrid, LineChart, Dumbbell, Target, Award, Hexagon, History,
  GitCompare, Settings, HelpCircle, type LucideIcon,
} from "lucide-react"
import { ShotIQShell } from "@/components/shotiq/ShotIQShell"

function PointsSidebar() {
  const rows: { label: string; href: string; icon: LucideIcon; active?: boolean }[] = [
    { label: "Overview", href: "/dashboard", icon: LayoutGrid },
    { label: "Analysis", href: "/results/demo", icon: LineChart },
    { label: "Training", href: "/results/demo/training", icon: Dumbbell },
    { label: "Goals", href: "/results/demo/goals", icon: Target },
    { label: "Achievements", href: "/points", icon: Award, active: true },
    { label: "Points", href: "/points", icon: Hexagon },
    { label: "History", href: "/results/demo/history", icon: History },
    { label: "Compare", href: "/results/demo/compare", icon: GitCompare },
    { label: "Settings", href: "/settings", icon: Settings },
  ]
  return (
    <nav data-testid="region-sidebar" aria-label="Achievements"
         className="flex w-[150px] shrink-0 flex-col border-r border-[var(--shotiq-color-rule)] pt-[26px]">
      {rows.map((r) => (
        <Link key={r.label} href={r.href} aria-current={r.active ? "page" : undefined}
              className={`relative flex h-[44px] items-center gap-[11px] px-[18px] text-[13px] ${
                r.active
                  ? "bg-[var(--shotiq-color-warmCanvas)] font-semibold text-[var(--shotiq-color-shotiqOrange)]"
                  : "text-[var(--shotiq-color-ink)]"}`}>
        {r.active && <span className="absolute inset-y-0 left-0 w-[4px] bg-[var(--shotiq-color-shotiqOrange)]" />}
        <r.icon className="h-[16px] w-[16px]" strokeWidth={1.6} />
        {r.label}
        </Link>
      ))}
      <div className="flex-1" />
      <Link href="/guide" className="mb-[20px] flex items-center gap-[10px] px-[18px] text-[13px]">
        <HelpCircle className="h-[16px] w-[16px]" strokeWidth={1.6} /> Help
      </Link>
    </nav>
  )
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ShotIQShell active="Progress" sidebar={<PointsSidebar />}>{children}</ShotIQShell>
}
