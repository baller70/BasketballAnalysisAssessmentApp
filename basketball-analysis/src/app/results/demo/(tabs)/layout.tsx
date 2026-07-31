"use client"

/**
 * Canonical shell + grouped left sidebar for the /results/demo family, per the
 * canonical screens (083 Analysis Overview … 093 Analysis History). Every
 * previously reachable tab stays reachable.
 */

import { usePathname } from "next/navigation"
import {
  LayoutGrid, Crosshair, AlertTriangle, User, GitCompare, History as HistoryIcon,
  Filter, Target, Dumbbell, UserCog, Settings2,
} from "lucide-react"
import { ShotIQShell, WideSidebar, type ShotIQTab } from "@/components/shotiq/ShotIQShell"

const SECTION: Record<string, ShotIQTab> = {
  analysis: "Analyze", flaws: "Analyze", player: "Analyze", compare: "Analyze",
  training: "Training", goals: "Progress", history: "Progress",
}

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const tab = pathname?.split("/").pop() || ""
  const active = pathname === "/results/demo" ? "Home" : (SECTION[tab] ?? "Analyze")
  const is = (t: string) => tab === t

  return (
    <ShotIQShell active={active as ShotIQTab}
      sidebar={<WideSidebar sections={[
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
      ]} />}>
      <div className="px-[26px] py-[18px]">{children}</div>
    </ShotIQShell>
  )
}
