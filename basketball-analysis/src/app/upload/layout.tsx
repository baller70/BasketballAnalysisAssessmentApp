"use client"

/**
 * Canonical shell wrapper for /upload.
 * Gives this route the canonical ShotIQ topbar and rail (sidecar contract)
 * while the page's existing domain logic renders inside region-main untouched.
 */

import { ShotIQShell } from "@/components/shotiq/ShotIQShell"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ShotIQShell active="Analyze">{children}</ShotIQShell>
}
