"use client"

/**
 * Canonical shell wrapper for /video-analysis — 082-web-live-capture.
 *
 * This route used to pass its own 87px CAPTURE icon rail to the shell. Per the
 * product owner's one-menu-sidebar directive the shell renders `UnifiedSidebar`
 * and ignores per-screen rails, so the rail is removed rather than left as
 * unreachable code. Every destination it linked to — Dashboard, Capture,
 * History, Goals, Coaching, Settings, Help — is in the unified menu.
 */

import { ShotIQShell } from "@/components/shotiq/ShotIQShell"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ShotIQShell active="Analyze">{children}</ShotIQShell>
}
