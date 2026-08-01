"use client"

/**
 * Canonical shell wrapper for /elite-shooters.
 *
 * The database screen (088) paints its own FILTERS sidebar inside the page, so
 * the shell rail is suppressed there. Shooter detail pages (089) carry the
 * canonical references sidebar: main destinations on top, a REFERENCES group
 * with Elite Shooters active, and Settings pinned to the bottom.
 */

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutGrid, LineChart, Activity, TrendingUp, Film, Compass,
  Users, Star, GitCompare, Settings,
} from "lucide-react"
import { ShotIQShell } from "@/components/shotiq/ShotIQShell"

function ReferencesSidebar() {
  const top = [
    { label: "DASHBOARD", href: "/dashboard", icon: LayoutGrid },
    { label: "ANALYZE", href: "/analyze", icon: LineChart },
    { label: "TRAINING", href: "/results/demo/training", icon: Activity },
    { label: "PROGRESS", href: "/results/demo/history", icon: TrendingUp },
    { label: "MEDIA", href: "/media", icon: Film },
    { label: "EXPLORE", href: "/elite-shooters", icon: Compass },
  ]
  const refs = [
    { label: "My Shooters", href: "/media", icon: Users, active: false },
    { label: "Elite Shooters", href: "/elite-shooters", icon: Star, active: true },
    { label: "Saved Comparisons", href: "/results/demo/compare", icon: GitCompare, active: false },
  ]
  return (
    <nav data-testid="region-sidebar" aria-label="References"
         className="flex w-[148px] shrink-0 flex-col border-r border-[var(--shotiq-color-rule)] pt-[18px]">
      {top.map((r) => (
        <Link key={r.label} href={r.href}
              className="flex items-center gap-[10px] px-[18px] py-[10px] text-[10px] font-bold tracking-[0.07em] text-[var(--shotiq-color-ink)]">
          <r.icon className="h-[16px] w-[16px]" strokeWidth={1.6} /> {r.label}
        </Link>
      ))}
      <div className="mx-[18px] my-[10px] border-b border-[var(--shotiq-color-rule)]" />
      <div className="px-[18px] pb-[6px] text-[9px] font-bold tracking-[0.08em] text-[var(--shotiq-color-graphite)]">
        REFERENCES
      </div>
      {refs.map((r) => (
        <Link key={r.label} href={r.href} aria-current={r.active ? "page" : undefined}
              className={`relative flex items-center gap-[9px] px-[18px] py-[9px] text-[11px] ${
                r.active
                  ? "bg-[var(--shotiq-color-warmCanvas)] font-semibold text-[var(--shotiq-color-shotiqOrange)]"
                  : "text-[var(--shotiq-color-ink)]"}`}>
          {r.active && <span className="absolute inset-y-[4px] left-0 w-[3px] rounded-r-full bg-[var(--shotiq-color-shotiqOrange)]" />}
          <r.icon className="h-[14px] w-[14px]" strokeWidth={1.6} /> {r.label}
        </Link>
      ))}
      <div className="flex-1" />
      <Link href="/settings"
            className="flex items-center gap-[10px] px-[18px] py-[18px] text-[10px] font-bold tracking-[0.07em] text-[var(--shotiq-color-ink)]">
        <Settings className="h-[16px] w-[16px]" strokeWidth={1.6} /> SETTINGS
      </Link>
    </nav>
  )
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ""
  const isDatabase = pathname === "/elite-shooters"
  return (
    <ShotIQShell active={isDatabase ? "Explore" : "Analyze"}
                 sidebar={isDatabase ? <></> : <ReferencesSidebar />}>
      {children}
    </ShotIQShell>
  )
}
