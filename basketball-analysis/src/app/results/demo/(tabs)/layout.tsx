"use client"

/**
 * Canonical shell for the /results/demo family.
 *
 * The canonical screens each painted their own left rail (090 training hub,
 * 093 history, 087 compare, 086 player card). Those are gone: the product
 * owner's directive is one menu sidebar for the whole app, so the shell renders
 * `UnifiedSidebar` and this layout only picks the active tab. Every destination
 * the per-screen rails carried is in the unified menu or in the page body.
 */


import { usePathname } from "next/navigation"
import { ShotIQShell, type ShotIQTab } from "@/components/shotiq/ShotIQShell"

const SECTION: Record<string, ShotIQTab> = {
  analysis: "Analyze", flaws: "Analyze", player: "Analyze", compare: "Analyze",
  training: "Training", goals: "Progress", history: "Progress",
}

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const tab = pathname?.split("/").pop() || ""
  const active = pathname === "/results/demo" ? "Home" : (SECTION[tab] ?? "Analyze")

  return (
    <ShotIQShell active={active as ShotIQTab}>
      <div className="px-[26px] py-[18px]">{children}</div>
    </ShotIQShell>
  )
}
