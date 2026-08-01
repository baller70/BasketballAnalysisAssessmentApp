"use client"

/**
 * Canonical shell wrapper for /video-analysis — 082-web-live-capture.
 * Icon rail per the canonical: CAPTURE active, HELP pinned to the bottom.
 */

import Link from "next/link"
import {
  PieChart, Disc, History, Target, Presentation, Settings, HelpCircle,
  type LucideIcon,
} from "lucide-react"
import { ShotIQShell } from "@/components/shotiq/ShotIQShell"

function CaptureRail() {
  const rows: { label: string; href: string; icon: LucideIcon; active?: boolean }[] = [
    { label: "DASHBOARD", href: "/dashboard", icon: PieChart },
    { label: "CAPTURE", href: "/video-analysis", icon: Disc, active: true },
    { label: "HISTORY", href: "/results/demo/history", icon: History },
    { label: "GOALS", href: "/results/demo/goals", icon: Target },
    { label: "COACHING", href: "/results/demo/training", icon: Presentation },
    { label: "SETTINGS", href: "/settings", icon: Settings },
  ]
  return (
    <nav data-testid="region-sidebar" aria-label="Live capture"
         className="flex w-[87px] shrink-0 flex-col items-center border-r border-[var(--shotiq-color-rule)] pt-[28px]">
      {rows.map((r) => (
        <Link key={r.label} href={r.href} aria-current={r.active ? "page" : undefined}
              className={`mb-[30px] flex w-full flex-col items-center gap-[8px] ${
                r.active ? "text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-ink)]"}`}>
          <r.icon className="h-[22px] w-[22px]" strokeWidth={1.5} />
          <span className="text-[9px] font-bold tracking-[0.08em]">{r.label}</span>
        </Link>
      ))}
      <div className="flex-1" />
      <Link href="/guide" className="mb-[24px] flex w-full flex-col items-center gap-[7px]">
        <HelpCircle className="h-[20px] w-[20px]" strokeWidth={1.5} />
        <span className="text-[9px] font-bold tracking-[0.08em]">HELP</span>
      </Link>
    </nav>
  )
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ShotIQShell active="Analyze" sidebar={<CaptureRail />}>{children}</ShotIQShell>
}
