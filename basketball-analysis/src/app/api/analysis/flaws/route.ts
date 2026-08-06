import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveProfileId, isError } from "@/lib/auth/currentUser"
import { detectFlawsFromAngles, type ShootingFlaw } from "@/data/shootingFlawsDatabase"

/**
 * GET /api/analysis/flaws — the flaws actually detected in YOUR shots, with the
 * share of your shots each one appears in.
 *
 * /results/demo/flaws prints five flaws written into the page — "Elbow not
 * stacked at release · AFFECTS 62% OF SHOTS · -8.3% IMPACT" — gated only on
 * `hasData`, so every account with any analysis at all sees the same five
 * titles and the same five percentages. The percentages are the worst of it:
 * they name a rate over a population of shots that was never counted.
 *
 * The engine to replace them already existed. `detectFlawsFromAngles` runs
 * every rule in SHOOTING_FLAWS against a set of measured angles and returns
 * matching flaws with their priority, fixes and drills; VideoUpload calls it
 * once and puts the names in a local session, and no screen has ever read the
 * result.
 *
 * This runs it over the caller's analyses — up to 100, newest first — so
 * "affects N% of shots" is a real count over a real denominator: the number of
 * that player's analyses that carry enough angles to evaluate at all. An
 * analysis with no angles is excluded from the denominator rather than counted
 * as clean, because a shot nobody could measure is not evidence of good form.
 */

/** The loosely-keyed record the flaw rules read, from one stored analysis. */
function anglesOf(row: {
  elbowAngle: unknown; kneeAngle: unknown; wristAngle: unknown
  shoulderAngle: unknown; hipAngle: unknown; releaseAngle: unknown
  kneeAngleMin: unknown
}): Record<string, number> {
  const out: Record<string, number> = {}
  const put = (joint: string, v: unknown) => {
    const n = Number(v)
    if (v == null || !Number.isFinite(n)) return
    // Both conventions, exactly as services/pose/formAnglesToRecord emits them,
    // so a rule keyed either way resolves.
    out[`${joint}_angle`] = n
    out[`right_${joint}_angle`] = n
  }
  put("elbow", row.elbowAngle)
  put("knee", row.kneeAngle)
  put("wrist", row.wristAngle)
  put("shoulder", row.shoulderAngle)
  put("hip", row.hipAngle)
  put("release", row.releaseAngle)
  /* THE DIP, under its own key and not as `knee_angle`. The knee above is the
     release frame's, where the legs have extended; the knee rules ask about
     the deepest bend of the load. Handing the release knee to a rule that
     means the dip is what made INSUFFICIENT_KNEE_BEND fire on every shot ever
     taken. One key per quantity, so neither can be mistaken for the other. */
  const dip = Number(row.kneeAngleMin)
  if (row.kneeAngleMin != null && Number.isFinite(dip)) out.knee_angle_min = dip
  return out
}

/** Canonical's three impact bands, from the flaw library's own 1-10 priority. */
const band = (priority: number): "HIGH IMPACT" | "MEDIUM IMPACT" | "LOW IMPACT" =>
  priority >= 8 ? "HIGH IMPACT" : priority >= 5 ? "MEDIUM IMPACT" : "LOW IMPACT"

export async function GET(request: NextRequest) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error

  try {
    const rows = await prisma.userAnalysis.findMany({
      where: { userProfileId: resolved.profileId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true, createdAt: true, captureSessionId: true,
        elbowAngle: true, kneeAngle: true, wristAngle: true,
        shoulderAngle: true, hipAngle: true, releaseAngle: true,
        kneeAngleMin: true,
      },
    })

    /* Makes and attempts per capture session, from the detector's own ShotEvent
       rows — the same source /api/analysis-history tallies. This is what turns
       "-8.3% IMPACT" from a printed constant into a comparison: make% on the
       shots that carry a flaw against make% on the shots that do not. */
    const sessionIds = rows.map((r) => r.captureSessionId).filter((v): v is string => Boolean(v))
    const tally = new Map<string, { shots: number; makes: number }>()
    if (sessionIds.length) {
      const events = await prisma.shotEvent.findMany({
        where: { captureSessionId: { in: sessionIds } },
        select: { captureSessionId: true, detectedResult: true },
      })
      for (const e of events) {
        if (!e.captureSessionId) continue
        const t = tally.get(e.captureSessionId) ?? { shots: 0, makes: 0 }
        // `unknown` is not an attempt anybody adjudicated; counting it would
        // depress every make% by however often the detector was unsure.
        if (e.detectedResult === "make" || e.detectedResult === "miss") {
          t.shots += 1
          if (e.detectedResult === "make") t.makes += 1
        }
        tally.set(e.captureSessionId, t)
      }
    }

    // Only shots the engine can actually evaluate form the denominator.
    const evaluable = rows
      .map((r) => ({
        id: r.id, createdAt: r.createdAt, captureSessionId: r.captureSessionId,
        angles: anglesOf(r), flawIds: new Set<string>(),
      }))
      .filter((r) => Object.keys(r.angles).length > 0)

    if (evaluable.length === 0) {
      return NextResponse.json({
        success: true,
        analysed: 0,
        reason: rows.length
          ? "Your shots have no measured angles yet, so no flaw can be evaluated."
          : "Analyze a shot to see the flaws detected in your form.",
        flaws: [],
      })
    }

    // flawId -> how many of the player's shots exhibit it.
    const counts = new Map<string, { flaw: ShootingFlaw; hits: number; lastSeen: Date }>()
    for (const shot of evaluable) {
      for (const flaw of detectFlawsFromAngles(shot.angles)) {
        shot.flawIds.add(flaw.id)
        const cur = counts.get(flaw.id)
        if (cur) {
          cur.hits += 1
          if (shot.createdAt > cur.lastSeen) cur.lastSeen = shot.createdAt
        } else {
          counts.set(flaw.id, { flaw, hits: 1, lastSeen: shot.createdAt })
        }
      }
    }

    const flaws = [...counts.values()]
      // Worst first: how often it happens, then how much it matters.
      .sort((a, b) => b.hits - a.hits || b.flaw.priority - a.flaw.priority)
      .map(({ flaw, hits, lastSeen }) => {
        /* The causal claim, computed rather than typed. Only shots with
           adjudicated make/miss enter either group; a flaw seen on shots
           nobody scored yields no impact at all rather than a tidy number. */
        const withF = { shots: 0, makes: 0 }
        const without = { shots: 0, makes: 0 }
        for (const shot of evaluable) {
          const t = shot.captureSessionId ? tally.get(shot.captureSessionId) : undefined
          if (!t || t.shots === 0) continue
          const bucket = shot.flawIds.has(flaw.id) ? withF : without
          bucket.shots += t.shots
          bucket.makes += t.makes
        }
        const pct = (b: { shots: number; makes: number }) =>
          b.shots ? (b.makes / b.shots) * 100 : null
        const withPct = pct(withF)
        const withoutPct = pct(without)
        /* Both sides need real volume before a difference means anything. Below
           this the screen is told to say so instead of drawing a conclusion
           from four shots. */
        const MIN_SHOTS = 5
        const comparable = withF.shots >= MIN_SHOTS && without.shots >= MIN_SHOTS
        return {
        id: flaw.id,
        title: flaw.name,
        description: flaw.description,
        impact: band(flaw.priority),
        priority: flaw.priority,
        /** A real count over a real denominator, not a printed percentage. */
        shotsAffected: hits,
        shotsAnalysed: evaluable.length,
        affectsPct: Math.round((hits / evaluable.length) * 100),
        lastSeen: lastSeen.toISOString(),
        fixes: flaw.fixes.slice(0, 3),
        drills: flaw.drills.slice(0, 3),
        impactOnMakePct: comparable && withPct != null && withoutPct != null
          ? Math.round((withPct - withoutPct) * 10) / 10
          : null,
        impactSample: { withFlaw: withF, withoutFlaw: without, minShots: MIN_SHOTS },
        impactReason: comparable
          ? null
          : "Not enough scored shots on both sides to measure this flaw's cost yet.",
        }
      })

    return NextResponse.json({
      success: true,
      analysed: evaluable.length,
      /* Said plainly: a clean read across few shots is not the same as a clean
         shooter, and the screen should be able to tell the player which it is. */
      skippedNoAngles: rows.length - evaluable.length,
      flaws,
    })
  } catch (error) {
    console.error("Flaw detection error:", error)
    return NextResponse.json(
      { success: false, error: "Could not evaluate flaws" },
      { status: 500 }
    )
  }
}
