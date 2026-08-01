"use client"

/**
 * Canonical shell wrapper for /settings.
 * The canonical 096 screen paints its own SETTINGS sidebar inside the page,
 * so the shell's icon rail is suppressed here (topbar only).
 */

import { ShotIQShell } from "@/components/shotiq/ShotIQShell"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ShotIQShell active="Settings" sidebar={<></>}>{children}</ShotIQShell>
}
