"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/stores/authStore"
import { useProfileStore } from "@/stores/profileStore"
import { usePoints } from "@/lib/points/pointsContext"

/**
 * The name, description, streak and points every phone screen puts in its
 * header — resolved once, from the player's own record.
 *
 * THE PERSONA WAS HARDCODED ON ~28 PHONE COMPONENTS. "Jordan Ellis",
 * "Right-handed • Advanced", a 6-day streak and 2,840 points are written as
 * default prop values across the phone tree, and nothing ever passed a real
 * value in. The web topbar had exactly this defect until ShotIQShell was wired
 * to the ledger; on the phone it is worse, because these four appear on ten
 * canonical screens at once, so signing in changed nothing anywhere.
 *
 * The canonical persona stays as the EMPTY STATE. Every field falls back to it
 * when there is nothing real to show, so a signed-out visitor still sees the
 * screens as designed, and an explicit prop from a call site always wins.
 *
 * The streak needs a server round trip (it is a property of the whole history,
 * not of any store), so the request is deduped at module scope — ten screens
 * mounting this hook must not make ten calls, and they must not disagree.
 */

export interface PlayerChrome {
  name: string
  sub: string
  streak: string
  points: string
}

export const CANONICAL_CHROME: PlayerChrome = {
  name: "Jordan Ellis",
  sub: "Right-handed • Advanced",
  streak: "6",
  points: "2,840",
}

/** One in-flight request per page load, shared by every mounted screen. */
let streakRequest: Promise<number | null> | null = null
function loadStreak(): Promise<number | null> {
  if (!streakRequest) {
    streakRequest = fetch("/api/badges", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (d?.success ? (d.stats?.currentStreak ?? null) : null))
      .catch(() => null)
      .then((v) => {
        // Never memoize a failure: one 401 during sign-in would otherwise pin
        // every phone screen to the canonical streak for the whole session.
        if (v == null) streakRequest = null
        return v
      })
  }
  return streakRequest
}

const titleCase = (v: string) => v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()

export function usePlayerChrome(): PlayerChrome {
  const authUser = useAuthStore((s) => s.user)
  const profile = useProfileStore()
  const totalPoints = usePoints().getTotalPoints()
  const [streak, setStreak] = useState<number | null>(null)

  useEffect(() => {
    let dead = false
    void useProfileStore.getState().fetchProfile()
    loadStreak().then((v) => { if (!dead && v != null) setStreak(v) })
    return () => { dead = true }
  }, [])

  const name =
    authUser?.displayName || authUser?.firstName
    || authUser?.email?.split("@")[0] || CANONICAL_CHROME.name

  /* "Right-handed • Advanced" — each half only when the player told us. With
     neither, the canonical line stands rather than a lone bullet. */
  const hand = profile.dominantHand
    ? `${titleCase(profile.dominantHand)}-handed` : null
  const level = profile.experienceLevel ? titleCase(profile.experienceLevel) : null
  const sub = hand || level
    ? [hand, level].filter(Boolean).join(" • ")
    : CANONICAL_CHROME.sub

  return {
    name,
    sub,
    streak: streak != null ? String(streak) : CANONICAL_CHROME.streak,
    points: totalPoints > 0 ? totalPoints.toLocaleString() : CANONICAL_CHROME.points,
  }
}
