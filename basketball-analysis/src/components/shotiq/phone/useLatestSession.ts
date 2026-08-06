"use client"

import { useHistory, formatMakePct } from "@/components/shotiq/ResultsBits"

/**
 * The player's newest completed session, for the stat strips the phone screens
 * put beside their headers.
 *
 * The counterpart to `usePlayerChrome`, one level down. Where that resolves who
 * the player IS, this resolves what they last DID — the "24 SHOTS / 15 MAKES /
 * 62.5%" triple written as literals across the phone tree. Same contract: the
 * canonical values are the EMPTY STATE, so a signed-out visitor sees the screens
 * as designed, and it reads the one shared history hook so a phone screen can
 * never disagree with the desktop screen showing the same session.
 *
 * WHERE THIS IS NOT THE RIGHT SOURCE. A screen describing a capture IN PROGRESS
 * — the live recorder, the post-capture review — must show THAT capture's
 * counts, not the last completed session's. Putting history there would label
 * one session's numbers as another's, which is worse than the constant. Those
 * screens are deliberately left alone; see the ledger.
 */

export interface LatestSession {
  shots: string
  makes: string
  pct: string
  /** True when these are the player's own numbers rather than the canonical set. */
  live: boolean
}

export const CANONICAL_SESSION: LatestSession = {
  shots: "24", makes: "15", pct: "62.5%", live: false,
}

export function useLatestSession(): LatestSession {
  const { shots, makes } = useHistory()
  // Both counts are needed for the triple to be internally consistent — a
  // screen showing real shots beside canonical makes would state a make% that
  // matches neither.
  if (shots == null || makes == null) return CANONICAL_SESSION
  return {
    shots: String(shots),
    makes: String(makes),
    pct: formatMakePct(shots, makes),
    live: true,
  }
}
