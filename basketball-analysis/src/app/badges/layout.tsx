"use client"

/** Canonical shell wrapper for /badges (renders the 095 achievements view). */

import { ShotIQShell } from "@/components/shotiq/ShotIQShell"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ShotIQShell active="Progress">{children}</ShotIQShell>
}
