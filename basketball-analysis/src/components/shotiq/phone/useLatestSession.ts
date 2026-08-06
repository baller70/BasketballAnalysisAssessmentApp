"use client"

import { useHistory, formatMakePct, scoreVerdict, formatRelativeSession } from "@/components/shotiq/ResultsBits"

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
  /** WHEN the session happened, in the phone's wording: `Today at 8:24 AM`. */
  when: string
  /** The raw ISO stamp, for the few screens whose canonical writes the date
   *  its own way (uppercased, with a year, or with a bullet separator). */
  at: string | null
  /** True when these are the player's own numbers rather than the canonical set. */
  live: boolean
}

export const CANONICAL_SESSION: LatestSession = {
  shots: "24", makes: "15", pct: "62.5%", score: "82", verdict: "GOOD",
  when: "Today at 8:24 AM", at: null, live: false,
}

export function useLatestSession(): LatestSession {
  const { shots, makes, score, items } = useHistory()
  /* The timestamp resolves independently of BOTH the score and the counts: any
     analysis at all has a recorded time, including one that was never scored
     and one with no capture behind it. A screen may honestly print a real time
     over canonical numbers — what it must not do is print canonical's 8:24 AM
     over the player's own session. */
  const at = items[0]?.at ?? null
  const when = formatRelativeSession(at)
  /* The score and the shot counts come from DIFFERENT places — an analysis
     always has a score, but only one with a capture behind it has shot counts —
     so they are resolved independently. A session can honestly report a real
     form score beside canonical shot counts; what it must never do is report
     real shots beside canonical makes, because the make% would then match
     neither. That pair is all-or-nothing. */
  const haveCounts = shots != null && makes != null
  /* THREE STATES, NOT TWO — and reading it as two put two phone screens in
     direct contradiction. Adding `at` made it possible to tell "this player has
     no session at all" from "this player has a session that counted no shots",
     and those want different marks:

       no session          -> canonical's 24 / 15 / 62.5%, the EMPTY STATE
       session, no capture -> em-dashes; the session is real and counted nothing
       session with counts -> the player's own numbers

     Collapsing the middle case into the empty state printed canonical's 24 and
     15 beside the player's REAL date and score. The progress tab, which lists
     actual sessions, had already started em-dashing that case — so signed in,
     /results/demo/history read "— SHOTS" and /results/demo/goals read "24
     shots" for the same session. The canonical triple is the empty state for a
     visitor, never a stand-in for a real session's missing capture. */
  const counts = haveCounts
    ? { shots: String(shots), makes: String(makes), pct: formatMakePct(shots, makes) }
    : at != null
      ? { shots: "—", makes: "—", pct: "—" }
      : { shots: CANONICAL_SESSION.shots, makes: CANONICAL_SESSION.makes, pct: CANONICAL_SESSION.pct }
  return {
    shots: counts.shots,
    makes: counts.makes,
    pct: counts.pct,
    score: score != null ? String(score) : CANONICAL_SESSION.score,
    verdict: score != null ? scoreVerdict(score) : CANONICAL_SESSION.verdict,
    when: when || CANONICAL_SESSION.when,
    at,
    live: haveCounts || score != null || at != null,
  }
}
