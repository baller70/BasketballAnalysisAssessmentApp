"use client"

/**
 * Canonical shell wrapper for /results/[id].
 *
 * Every screen in this app carries the one unified nav sidebar, supplied by a
 * per-route layout exactly like this one (/media, /upload, /profile, /settings,
 * /points, /badges …). The first cut of the results route rendered a bare
 * <main>, so a real analysis opened onto a page with no sidebar — recognisably
 * not the same app as the screen the player just came from.
 *
 * `active="Analyze"` matches what /results/demo highlights, so opening one
 * shot's result lights the same nav item as the results section it belongs to.
 */

import { ShotIQShell } from "@/components/shotiq/ShotIQShell"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ShotIQShell active="Analyze">{children}</ShotIQShell>
}
