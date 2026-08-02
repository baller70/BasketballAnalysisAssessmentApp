"use client"

/**
 * Canonical shell wrapper for /points — 095-web-achievements-points.
 *
 * The 150px per-screen text sidebar this route used to pass is removed: the
 * shell renders the one unified menu for the whole app. Every destination it
 * carried — Overview, Analysis, Training, Goals, Achievements, Points, History,
 * Compare, Settings, Help — is in that menu.
 */

import { ShotIQShell } from "@/components/shotiq/ShotIQShell"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ShotIQShell active="Progress">{children}</ShotIQShell>
}
