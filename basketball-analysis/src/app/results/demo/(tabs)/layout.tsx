"use client"

/**
 * Canonical shell for the /results/demo tab family.
 *
 * Replaces the legacy slate mobile-style layout (floating header + bottom tab
 * bar) with the canonical ShotIQ desktop shell from the sidecar contract, so
 * screens 083 (analysis), 084 (biomechanics), 085 (flaws), 086 (player card),
 * 087 (compare), 090 (training), 092 (goals) and 093 (analytics history) all
 * carry the canonical topbar and rail. Tab-to-section mapping:
 *   analysis / flaws / player / compare -> Analyze
 *   training                            -> Training
 *   goals / history                     -> Progress
 * The in-page tab strip is preserved as canonical secondary navigation so every
 * previously reachable tab remains reachable.
 */

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShotIQShell, type ShotIQTab } from "@/components/shotiq/ShotIQShell"

const TABS: { id: string; label: string }[] = [
  { id: "home", label: "Overview" },
  { id: "analysis", label: "Analysis" },
  { id: "flaws", label: "Flaws" },
  { id: "player", label: "Player" },
  { id: "compare", label: "Compare" },
  { id: "training", label: "Training" },
  { id: "goals", label: "Goals" },
  { id: "history", label: "Analytics" },
]

const SECTION: Record<string, ShotIQTab> = {
  analysis: "Analyze", flaws: "Analyze", player: "Analyze", compare: "Analyze",
  training: "Training", goals: "Progress", history: "Progress",
}

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const currentTab = pathname?.split("/").pop() || ""
  const active = SECTION[currentTab] ?? "Analyze"

  return (
    <ShotIQShell active={active}>
      <div className="px-[28px] pt-[14px]">
        <nav aria-label="Result tabs"
             className="flex gap-[28px] border-b border-[var(--shotiq-color-rule)]">
          {TABS.map((t) => {
            const href = t.id === "home" ? "/results/demo" : `/results/demo/${t.id}`
            const is = t.id === "home"
              ? pathname === "/results/demo"
              : currentTab === t.id
            return (
              <Link key={t.id} href={href}
                    aria-current={is ? "page" : undefined}
                    className={`relative pb-[10px] text-[14px] ${is ? "font-semibold text-[var(--shotiq-color-ink)]" : "text-[var(--shotiq-color-graphite)]"}`}>
                {t.label}
                {is && <span className="absolute inset-x-0 bottom-0 h-[3px] bg-[var(--shotiq-color-shotiqOrange)]" />}
              </Link>
            )
          })}
        </nav>
        <div className="py-[18px]">{children}</div>
      </div>
    </ShotIQShell>
  )
}
