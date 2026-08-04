"use client"

/**
 * Canonical shell wrapper for /admin/shooting-forms.
 *
 * This screen is linked from the sidebar (ADMIN → "Shooting Forms") but was the
 * one shell-bearing route with no layout, so it rendered bare: no topbar, no
 * sidebar, no way back into the app except browser Back (R10 defect H1). It
 * now renders inside the same shell as the other 27 routes.
 */

import { ShotIQShell } from "@/components/shotiq/ShotIQShell"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ShotIQShell active="Explore">{children}</ShotIQShell>
}
