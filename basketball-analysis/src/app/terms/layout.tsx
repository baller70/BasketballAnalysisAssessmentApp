"use client"

/** See the note on /privacy's layout — the menu links here, so the menu stays. */

import { ShotIQShell } from "@/components/shotiq/ShotIQShell"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ShotIQShell active="Settings">{children}</ShotIQShell>
}
