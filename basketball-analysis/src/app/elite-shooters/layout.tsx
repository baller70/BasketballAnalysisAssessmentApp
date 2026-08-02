"use client"

/**
 * Canonical shell wrapper for /elite-shooters.
 *
 * The shooter-detail screens (089) used to carry a per-screen REFERENCES rail;
 * it is removed under the one-menu-sidebar directive, and every destination it
 * held — Dashboard, Analyze, Training, Progress, Media, Explore, My Shooters,
 * Elite Shooters, Saved Comparisons, Settings — lives in the unified menu.
 *
 * The database screen (088) still paints its own FILTERS sidebar inside the
 * page. That is a filter panel, not navigation, so it is not a second menu.
 */

import { usePathname } from "next/navigation"
import { ShotIQShell } from "@/components/shotiq/ShotIQShell"

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ""
  const isDatabase = pathname === "/elite-shooters"
  return (
    <ShotIQShell active={isDatabase ? "Explore" : "Analyze"}>
      {children}
    </ShotIQShell>
  )
}
