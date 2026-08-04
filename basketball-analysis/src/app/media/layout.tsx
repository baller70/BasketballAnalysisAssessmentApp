"use client"

/**
 * Canonical shell wrapper for /media.
 *
 * The canonical 094 screen paints its own FILTERS column inside the page. That
 * is a filter panel, not navigation, so it sits beside — not instead of — the
 * one unified nav sidebar the shell supplies.
 */

import { ShotIQShell } from "@/components/shotiq/ShotIQShell"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ShotIQShell active="Media">{children}</ShotIQShell>
}
