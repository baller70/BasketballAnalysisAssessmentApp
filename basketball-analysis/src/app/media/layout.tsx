"use client"

/**
 * Canonical shell wrapper for /media.
 * The canonical 094 screen paints its own FILTERS sidebar inside the page,
 * so the shell's icon rail is suppressed here (topbar only).
 */

import { ShotIQShell } from "@/components/shotiq/ShotIQShell"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ShotIQShell active="Media">{children}</ShotIQShell>
}
