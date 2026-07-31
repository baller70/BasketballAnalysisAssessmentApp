"use client"

/**
 * Canonical shell wrapper for /onboarding (desktop screen 078-web-onboarding).
 * The sidecar declares topbar/sidebar/main as critical regions on this screen,
 * so it renders inside the canonical shell like every other canonical route.
 */

import { ShotIQShell } from "@/components/shotiq/ShotIQShell"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ShotIQShell active="Home">{children}</ShotIQShell>
}
