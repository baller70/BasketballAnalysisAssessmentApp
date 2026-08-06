/**
 * What a goal is actually at, measured from the player's own record.
 *
 * A GOAL THAT NEVER MOVES IS NOT A GOAL.
 *
 * `Goal.currentValue` is written by exactly one thing in the whole codebase —
 * a PATCH from the client carrying a number the client made up. Nothing reads
 * the player's sessions, shots or scores. So a player who creates "65% Make
 * Percentage" and then shoots 68% for a month watches the bar sit at 0, and the
 * goals screen — the screen whose entire subject is progress — reports none.
 *
 * The Goal row already carries what is needed to evaluate itself: `category`
 * (form | consistency | volume | accuracy | streak | custom) and `unit`. This
 * turns those into a reading over real data.
 *
 * WHAT IT REFUSES TO DO. `custom` is a goal the player described in their own
 * words; nothing in the schema says what would satisfy it, so it is returned
 * unmeasured with the stored value intact rather than assigned a number that
 * looks like measurement. A category with no evidence behind it yet — no scored
 * shots for an accuracy goal, no analyses for a form goal — is likewise
 * unmeasured, NOT zero. Zero means "you have made no progress"; unmeasured
 * means "nobody has checked", and only one of those is the player's fault.
 */

export type GoalCategory =
  | "form" | "consistency" | "volume" | "accuracy" | "streak" | "custom" | string

/** One analysis, reduced to the fields any goal could care about. */
export interface GoalSession {
  /** When it happened. Streak and consistency need real dates. */
  at: Date
  /** 0-100 overall form score, when the analysis carries one. */
  score: number | null
  /** Adjudicated attempts behind this session (make or miss, not unknown). */
  shots: number
  /** Attempts scored as a make. */
  makes: number
}

export interface GoalProgress {
  /** The measured value, on the goal's own scale. Null when unmeasurable. */
  currentValue: number | null
  /** How it was arrived at, so a screen can say so. */
  source: "measured" | "stored" | "unmeasured"
  /** Why there is no measurement, when there is none. */
  reason: string | null
  /** 0-1, for a bar. Null whenever `currentValue` is null. */
  fraction: number | null
}

const DAY_MS = 24 * 60 * 60 * 1000
const dayKey = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())

/** Consecutive days ending today or yesterday — a streak you can still keep. */
export function currentDayStreak(sessions: GoalSession[]): number {
  if (!sessions.length) return 0
  const days = [...new Set(sessions.map((s) => dayKey(s.at)))].sort((a, b) => b - a)
  const today = dayKey(new Date())
  // A streak survives until the end of the following day; requiring an entry
  // TODAY would break every streak overnight rather than when it lapsed.
  if (days[0] !== today && days[0] !== today - DAY_MS) return 0
  let run = 1
  for (let i = 1; i < days.length; i++) {
    if (days[i - 1] - days[i] === DAY_MS) run += 1
    else break
  }
  return run
}

/**
 * Evaluate one goal.
 *
 * `sessions` must be the player's own, newest first or oldest first — order is
 * not relied on. `stored` is the persisted `currentValue`, used only for the
 * categories this cannot measure.
 */
export function evaluateGoal(
  goal: { category: GoalCategory; targetValue: number; unit?: string | null },
  sessions: GoalSession[],
  stored: number,
): GoalProgress {
  const target = goal.targetValue
  const done = (currentValue: number): GoalProgress => ({
    currentValue,
    source: "measured",
    reason: null,
    fraction: target > 0 ? Math.max(0, Math.min(1, currentValue / target)) : null,
  })
  const cannot = (reason: string): GoalProgress => ({
    currentValue: null, source: "unmeasured", reason, fraction: null,
  })

  const scored = sessions.filter((s) => s.shots > 0)
  const withScore = sessions.filter((s) => s.score != null)

  switch ((goal.category || "").toLowerCase()) {
    case "accuracy": {
      // Make percentage across every adjudicated attempt — not the mean of
      // per-session percentages, which would let a 2-shot session outweigh a
      // 40-shot one.
      const shots = scored.reduce((n, s) => n + s.shots, 0)
      if (!shots) return cannot("No scored shots yet — make % needs makes and misses recorded.")
      const makes = scored.reduce((n, s) => n + s.makes, 0)
      return done(Math.round((makes / shots) * 1000) / 10)
    }
    case "form": {
      // The best form score reached. A goal to REACH a score is met by
      // reaching it once; averaging would hide the day it happened.
      if (!withScore.length) return cannot("No analysed shots yet — form score needs an analysis.")
      return done(Math.max(...withScore.map((s) => s.score as number)))
    }
    case "volume": {
      // Shots when any are recorded, sessions otherwise: a "50 shots" goal and
      // a "20 sessions" goal are both volume, and the unit says which.
      const wantsSessions = /session|workout|analys/i.test(goal.unit ?? "")
      if (wantsSessions) return done(sessions.length)
      const shots = sessions.reduce((n, s) => n + s.shots, 0)
      if (!shots) return sessions.length
        ? cannot("Your sessions have no shot counts yet — they need a capture behind them.")
        : cannot("No sessions logged yet.")
      return done(shots)
    }
    case "streak":
      return done(currentDayStreak(sessions))
    case "consistency": {
      // Days trained, which is what consistency means on a calendar. Sessions
      // twice in one day are one day of consistency.
      if (!sessions.length) return cannot("No sessions logged yet.")
      return done(new Set(sessions.map((s) => dayKey(s.at))).size)
    }
    default:
      /* "custom" and anything unrecognised. The player wrote what they wanted
         in prose; nothing in the schema says what satisfies it. Their own
         logged value stands, labelled as theirs. */
      return {
        currentValue: stored,
        source: "stored",
        reason: "This goal is tracked by hand — update it when you make progress.",
        fraction: target > 0 ? Math.max(0, Math.min(1, stored / target)) : null,
      }
  }
}
