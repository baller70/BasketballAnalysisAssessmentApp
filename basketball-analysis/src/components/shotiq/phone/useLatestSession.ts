"use client"

import { useHistory, formatMakePct, scoreVerdict } from "@/components/shotiq/ResultsBits"

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
  /** The newest session's form score, as the strips print it. */
  score: string
  /** Canonical's one-word band under the score. */
  verdict: string
  /** True when these are the player's own numbers rather than the canonical set. */
  live: boolean
}

export const CANONICAL_SESSION: LatestSession = {
  shots: "24", makes: "15", pct: "62.5%", score: "82", verdict: "GOOD", live: false,
}

export function useLatestSession(): LatestSession {
  const { shots, makes, score } = useHistory()
  /* The score and the shot counts come from DIFFERENT places — an analysis
     always has a score, but only one with a capture behind it has shot counts —
     so they are resolved independently. A session can honestly report a real
     form score beside canonical shot counts; what it must never do is report
     real shots beside canonical makes, because the make% would then match
     neither. That pair is all-or-nothing. */
  const haveCounts = shots != null && makes != null
  return {
    shots: haveCounts ? String(shots) : CANONICAL_SESSION.shots,
    makes: haveCounts ? String(makes) : CANONICAL_SESSION.makes,
    pct: haveCounts ? formatMakePct(shots, makes) : CANONICAL_SESSION.pct,
    score: score != null ? String(score) : CANONICAL_SESSION.score,
    verdict: score != null ? scoreVerdict(score) : CANONICAL_SESSION.verdict,
    live: haveCounts || score != null,
  }
}
