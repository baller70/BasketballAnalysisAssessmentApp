"use client"

/**
 * The unified menu links to /privacy, so the page has to keep the menu — landing
 * here without one made the legal pages a navigation dead end (the only way out
 * was the browser back button or the single "back to create account" link).
 */

import { ShotIQShell } from "@/components/shotiq/ShotIQShell"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ShotIQShell active="Settings">{children}</ShotIQShell>
}
