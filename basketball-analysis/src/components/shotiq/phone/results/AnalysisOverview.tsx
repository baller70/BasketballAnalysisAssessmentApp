"use client"

/**
 * Canonical iOS 038-analysis-result-overview — the phone home of a finished
 * analysis, and the hub the rest of the family is reached from.
 *
 * Round-6 grade A read: "canonical's 7-tab bar, form score, phase rail,
 * 6-metric grid and elite-match card replaced by a video player with a timecode
 * list. Orange 34.5‰ -> 3.7‰." None of those five regions existed.
 *
 * Bands measured off canonical/038-analysis-result-overview.png, row-segmented
 * then column-segmented (scratchpad rsmeasure.py), quoted in pt after dividing
 * by 853/393 = 2.170483:
 *
 *   wordmark / gear      y   9.2- 25.8   rule y 42.0
 *   identity             y  49.8- 97.2   x 15-355
 *   7-tab row            y 117.0-125.8   x 17-370, cap 19px; active rule y 135.0
 *   hero still           y 146.1-365.8   x 12.4-219.7
 *   score column         x 236-370: FORM SCORE 157, "82" 170-230, bar 228-234,
 *                        GOOD 249-258, note 265-286, 3 stats 304-364
 *   phase rail           figures y 380.6-410.5, labels 416.0-422.5, rule 427.6
 *   coaching target      label y 448.3-455.7, line y 465.3-481.9
 *   YOUR SIX KEY METRICS y 501.7-511.4
 *   metric grid          glyphs y 524.8-561.2, labels 569.5, values 583.7,
 *                        verdicts 604.5
 *   ELITE MATCH          y 628.9-638.1  (+ "How it works" right)
 *   elite card           y 646.9-719.7
 *   primary CTA          y 730.3-756.5  x 13.6-377  (26.3pt tall, not 46)
 *   share row            y 769.4-781.9
 */

import React from "react"
import { useRouter } from "next/navigation"
import { MechanicGlyph, ActionGlyph, type MechanicKind } from "@/components/shotiq/Glyphs"
import {
  ResultsScreen, ResultsBar, GearLink, ResultsIdentity, Panel, SectionHead, Micro,
  ScoreBar, PhaseRail, Chev, PrimaryBar, Frame, SkeletonOverlay, capDisplay,
  ORANGE, BLUE, GREEN, GRAPHITE, RULE, INK,
} from "./Kit"
import { scoreBand } from "@/components/shotiq/ResultsBits"
import { ELBOW_AT_RELEASE, RELEASE_FROM_VERTICAL } from "@/lib/analysis/angleBands"

const TABS: [string, string][] = [
  ["ANALYSIS RESULT", "/results/demo"],
  ["ANALYSIS", "/results/demo/analysis"],
  ["FLAWS", "/results/demo/flaws"],
  ["PLAYER", "/results/demo/player"],
  ["COMPARE", "/results/demo/compare"],
  ["TRAINING", "/results/demo/training"],
  ["GOALS", "/results/demo/goals"],
]

/** Canonical's in-body tab row: the seven results surfaces, active one orange
 *  and ruled. This IS the navigation between the family members — every screen
 *  039-051 is one tap from here. */
export function ResultsTabs({ active = "ANALYSIS RESULT" }: { active?: string }) {
  const router = useRouter()
  return (
    <div className="relative">
      <div className="flex items-end justify-between px-[15px]">
        {TABS.map(([label, href]) => {
          const on = label === active
          return (
            <button key={label} type="button" onClick={() => router.push(href)}
                    data-testid={`results-tab-${label.split(" ")[0].toLowerCase()}`}
                    className="shrink-0 pb-[9px]">
              <span className="shotiq-display block whitespace-nowrap leading-[9px] tracking-[0.055em]"
                    style={{ fontSize: capDisplay(17), color: on ? ORANGE : INK }}>
                {label}
              </span>
              <span aria-hidden="true" className="mt-[8px] block h-[2px] rounded-full"
                    style={{ background: on ? ORANGE : "transparent" }} />
            </button>
          )
        })}
      </div>
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px" style={{ background: RULE }} />
    </div>
  )
}

const METRICS: [MechanicKind, string, string, string, string][] = [
  ["height", "RELEASE HEIGHT", "7'8\"", "", "EXCELLENT"],
  ["angle", "RELEASE ANGLE", "52", "°", "GOOD"],
  ["centerline", "ELBOW ALIGNMENT", "93", "%", "GOOD"],
  ["arc", "SHOT ARC", "46", "°", "GOOD"],
  ["drift", "SPIN RATE", "8.6", "", "GOOD"],
  ["balance", "CENTEREDNESS", "92", "%", "EXCELLENT"],
]

/**
 * YOUR SIX KEY METRICS, from the shot they describe.
 *
 * The six above are canonical's constants — 7'8", 52°, 93% — each with its own
 * verdict, on a panel headed YOUR six key metrics. This is the PHONE
 * counterpart of the desktop KEY MEASUREMENTS table wired early on, and it was
 * never connected: the strip read identically for an account with a hundred
 * analyses and one with none.
 *
 * FOUR OF THE SIX ARE ANSWERABLE, and two are not:
 *
 *  - SPIN RATE has no pipeline behind it. Nothing tracks the ball, so nothing
 *    can measure its rotation.
 *  - SHOT ARC is the SAME QUANTITY as RELEASE ANGLE in this pipeline — the
 *    desktop table calls `releaseAngle` "Shooting Arc" for exactly that reason.
 *    Printing one measurement under two labels would assert two independent
 *    readings, which is worse than admitting to one.
 *
 * Two rows change unit, and that is deliberate. ELBOW ALIGNMENT and
 * CENTEREDNESS are drawn as percentages, but what the pipeline computes is an
 * elbow ANGLE and a centreline DEVIATION, both in degrees. Printing a degree
 * value under a % sign would be a wrong label on a right number.
 */
type MetricRead = { value: string; unit: string; verdict: string; real: boolean }

/** Each answerable metric: how to read it, and the band it is judged against. */
const METRIC_SOURCE: Record<string, {
  read: (a: OverviewAnalysis) => number | null
  format: (v: number) => string
  unit: string
  /** Inclusive ideal range, the same bands the desktop table prints. */
  ideal: [number, number]
}> = {
  "RELEASE HEIGHT": {
    read: (a) => a.measurements?.releaseHeightInches ?? null,
    format: (v) => `${Math.floor(Math.round(v) / 12)}'${Math.round(v) % 12}"`,
    unit: "", ideal: [102, 110],
  },
  /* Both bands come from `angleBands`, which is where the evidence lives for
     why they are not what this file used to carry. `angles.release` is
     deviation from vertical (ideal 0), not canonical's 45-55 launch arc, and
     `angles.elbow` is the extended elbow at release, not the 85-95 set-point
     "L". Judged against the old bands, a correct shot failed both rows. */
  "RELEASE ANGLE": {
    read: (a) => a.angles?.release ?? null,
    format: (v) => String(Math.round(v)), unit: "°",
    ideal: [RELEASE_FROM_VERTICAL.min, RELEASE_FROM_VERTICAL.max],
  },
  "ELBOW ALIGNMENT": {
    read: (a) => a.angles?.elbow ?? null,
    format: (v) => String(Math.round(v)), unit: "°",
    ideal: [ELBOW_AT_RELEASE.min, ELBOW_AT_RELEASE.max],
  },
  "CENTEREDNESS": {
    read: (a) => a.measurements?.centerlineDeviationDeg ?? null,
    format: (v) => v.toFixed(1), unit: "°", ideal: [0, 3],
  },
}

export interface OverviewAnalysis {
  angles?: Record<string, number | null>
  measurements?: Record<string, number | null>
}

/**
 * What to print for one canonical row.
 *
 * With no analysis the canonical constant stands — the empty state is the
 * screen as designed. With one, a metric the pipeline cannot answer says so
 * rather than carrying a number nobody derived (F5), and the verdict is
 * computed against the ideal band instead of staying the constant it was: a
 * rating tuned for canonical's value is wrong the moment the value moves (F7).
 */
export function readMetric(
  label: string, demoValue: string, demoUnit: string, demoVerdict: string,
  analysis: OverviewAnalysis | null,
): MetricRead {
  if (!analysis) return { value: demoValue, unit: demoUnit, verdict: demoVerdict, real: false }
  const source = METRIC_SOURCE[label]
  const raw = source ? source.read(analysis) : null
  if (!source || raw == null) return { value: "Not measured", unit: "", verdict: "—", real: false }
  const [lo, hi] = source.ideal
  return {
    value: source.format(raw),
    unit: source.unit,
    verdict: raw >= lo && raw <= hi ? "GOOD" : "REVIEW",
    real: true,
  }
}

export interface EliteMatch {
  name: string
  overall: number
  photoUrl: string | null
  team?: string | null
  /** The shooter's own readings — a TIER ESTIMATE, never their measured video. */
  reference?: { releaseAngle: number; elbowAngle: number; entryAngle: number } | null
  estimated?: boolean
}

export function AnalysisOverview({
  score = 82, shots = "24", makes = "15", pct = "62.5%",
  name, streak, points, match = null,
}: {
  score?: number; shots?: string; makes?: string; pct?: string
  name?: string; streak?: string; points?: string
  match?: EliteMatch | null
}) {
  /* The verdict sat directly under a wired score as the literal "GOOD" in
     canonical's blue, so a 93 read GOOD and a 41 read GOOD. Label and colour
     both come from the one shared band now — a renderer tuned for a constant
     is wrong for a real value the moment the value moves (F7). */
  const band = scoreBand(typeof score === "number" ? score : null)
  /* The metric strip's own source. `useHistory` carries the session, not the
     per-shot angles, so this reads the same endpoint the desktop workspace
     does — the caller's newest analysis and exactly which angles it holds. */
  const [analysis, setAnalysis] = React.useState<OverviewAnalysis | null>(null)
  React.useEffect(() => {
    let dead = false
    fetch("/api/analysis/latest", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!dead && d?.success && d.analysis) setAnalysis(d.analysis) })
      .catch(() => {})
    return () => { dead = true }
  }, [])

  /* The elite shooter's own three readings. Canonical's are 51° / 95% / 46°;
     with a real match they are that shooter's catalog values, and Shot Arc is
     the ENTRY angle — a distinct catalog field, not the release angle again
     (F22 applies to the player's strip above, where the two ARE one quantity). */
  const eliteRows: [MechanicKind, string, string][] = match?.reference
    ? [
        ["angle", "Release Angle", `${Math.round(match.reference.releaseAngle)}°`],
        ["centerline", "Elbow Alignment", `${Math.round(match.reference.elbowAngle)}°`],
        ["arc", "Shot Arc", `${Math.round(match.reference.entryAngle)}°`],
      ]
    : [["angle", "Release Angle", "51°"], ["centerline", "Elbow Alignment", "95%"], ["arc", "Shot Arc", "46°"]]
  return (
    <ResultsScreen
      testid="screen-ios-analysis-result-overview"
      tab="home"
      bar={<ResultsBar variant="wordmark" height={42} trailing={<GearLink />} />}
    >
      <ResultsIdentity className="mt-[6px] px-[16px]" name={name} streak={streak} points={points} />

      <ResultsTabs active="ANALYSIS RESULT" />

      {/* hero still + score column ------------------------------------- */}
      <div className="mt-[7px] flex gap-[16px] px-[12px]">
        <div className="relative h-[220px] w-[207px] shrink-0 overflow-hidden rounded-[4px]">
          <Frame src="086-film-4" w="100%" h="100%" radius={0} pos="50% 22%" alt="Your release frame with the pose graph traced over it" />
          <SkeletonOverlay />
        </div>
        <div className="min-w-0 flex-1">
          <div className="shotiq-section-label leading-[13px] tracking-[0.075em]" style={{ "--shotiq-label-size": "13px" } as React.CSSProperties}>FORM SCORE</div>
          <div className="shotiq-numeric mt-[3px] leading-[0.8]" style={{ fontSize: 74, color: ORANGE }}>{score}</div>
          <ScoreBar score={score} width={89} height={6.5} />
          <div className="shotiq-display mt-[8px] text-[17px] leading-[17px] tracking-[0.04em]" style={{ color: band.color }}>{band.label}</div>
          <div className="mt-[5px] text-[12.5px] leading-[14.5px]">Keep building<br />consistency.</div>
          <div className="mt-[10px] flex items-end">
            {([[shots, "SHOTS", "analyze"], [makes, "MAKES", "uploadVideo"], [pct, "MAKE %", "gauge"]] as const).map(([v, l, g]) => (
              <div key={l} className="flex-1">
                <span className="flex h-[24px] items-end" style={{ color: INK }}>
                  {g === "gauge"
                    ? <MakeGauge />
                    : <ActionGlyph kind={g === "analyze" ? "analyze" : "nodeGraph"} height={g === "analyze" ? 24 : 19} />}
                </span>
                <div className="shotiq-numeric mt-[8px] text-[21px] leading-[19px]">{v}</div>
                <Micro className="mt-[5px]">{l}</Micro>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* phase rail ----------------------------------------------------- */}
      <PhaseRail className="mt-[10px] px-[16px]" active="RELEASE" figure={30} label={9.6} />

      {/* primary coaching target ---------------------------------------- */}
      <Panel className="mx-[13px] mt-[7px] flex items-center px-[14px] py-[7px]">
        <div className="min-w-0">
          <div className="shotiq-section-label text-[11.5px] leading-[12px] tracking-[0.08em]">PRIMARY COACHING TARGET</div>
          <div className="mt-[6px] truncate text-[17px] font-semibold leading-[19px]">Keep elbow stacked through release</div>
        </div>
        <span className="ml-auto pl-[10px]"><Chev size={16} /></span>
      </Panel>

      {/* six key metrics ------------------------------------------------- */}
      <SectionHead cap={21} info className="mt-[6px] px-[14px]">YOUR SIX KEY METRICS</SectionHead>
      <Panel className="mx-[13px] mt-[6px] flex divide-x divide-[var(--shotiq-color-rule)] pb-[9px] pt-[7px]">
        {METRICS.map(([kind, label, value, unit, verdict]) => {
          const m = readMetric(label, value, unit, verdict, analysis)
          return (
          <div key={label} className="min-w-0 flex-1 px-[3px] text-center">
            <span className="flex h-[36px] items-center justify-center" style={{ color: INK }}>
              <MechanicGlyph kind={kind} size={33} />
            </span>
            <div className="shotiq-microcaps mt-[8px] leading-[6px]" style={{ fontSize: 7, color: GRAPHITE }}>{label}</div>
            {/* "Not measured" is prose, not a numeral, and drops to the body
                face at a size that fits the 1/6 column rather than overflowing
                it in the numeric face. */}
            <div className={m.value === "Not measured" ? "mt-[8px] leading-[14px]" : "shotiq-numeric mt-[8px] leading-[14px]"}
                 style={{ fontSize: m.value === "Not measured" ? 8 : 19,
                          color: m.value === "Not measured" ? GRAPHITE : undefined }}>
              {m.value}{m.unit && <span style={{ fontSize: 12 }}>{m.unit}</span>}
            </div>
            <div className="shotiq-microcaps mt-[6px] leading-[6px]"
                 style={{ fontSize: 7,
                          color: m.verdict === "EXCELLENT" || m.verdict === "GOOD"
                            ? (m.verdict === "EXCELLENT" ? GREEN : BLUE)
                            : m.verdict === "REVIEW" ? ORANGE : GRAPHITE }}>{m.verdict}</div>
          </div>
          )
        })}
      </Panel>

      {/* elite match ----------------------------------------------------- */}
      <SectionHead
        cap={20} info className="mt-[7px] px-[14px]"
        right={
          <span className="flex items-center gap-[3px] text-[11.5px]" style={{ color: BLUE }}>
            How it works<Chev size={12} color={BLUE} />
          </span>
        }
      >
        ELITE MATCH
      </SectionHead>
      {/* KLAY THOMPSON, his club, his three readings and 88% OVERALL MATCH were
          all written into this markup, so every player was told they shoot like
          the same man to the same percentage. `/api/shooters/match` ranks the
          whole 328-shooter catalog against the caller's measured angles and the
          DESKTOP card on this route has read it for some time; the phone card
          was never connected.

          Elbow Alignment is in DEGREES here now. It read "95%" while the metric
          strip directly above it reads the player's own elbow in degrees — the
          two halves of a comparison have to be in the same unit or the
          comparison is not one. */}
      <Panel className="mx-[13px] mt-[4px] flex items-center gap-[11px] p-[5px]">
        {/* F9/F10, exactly as the desktop card solves them: the initials sit
            UNDER the portrait rather than replacing it on error, because a
            blocked remote headshot hangs rather than failing; and the portrait
            follows the NAME, so canonical's crop holds only while the card is
            canonical. */}
        <span className="relative grid h-[72px] w-[90px] shrink-0 place-items-center overflow-hidden rounded-[3px] text-[20px] font-bold tracking-[0.04em]"
              style={{ background: "var(--shotiq-color-warmCanvas)", color: GRAPHITE }}>
          {match ? match.name.split(" ").map((w) => w[0]).slice(0, 2).join("") : null}
          {(!match || match.photoUrl) && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={match?.photoUrl || "/images/canonical/083-elite.png"}
                 /* EMPTY on purpose. F9 layers the initials UNDER the portrait
                    so a hanging remote headshot never leaves a blank cell — but a
                    BROKEN one renders its alt text, which paints over the initials
                    and spills out of a 90x72 cell. The shooter's name is in text
                    directly beside this image, so the portrait carries no
                    information of its own to announce. */
                 alt=""
                 className="absolute inset-0 h-full w-full object-cover" width={90} height={72} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="shotiq-display truncate text-[22px] leading-[21px] tracking-[0.035em]">
            {(match?.name ?? "Klay Thompson").toUpperCase()}
          </div>
          <div className="mt-[2px] truncate text-[11px] leading-[12px]" style={{ color: GRAPHITE }}>
            {match ? (match.team ?? "—") : "Golden State Warriors"}
          </div>
          <div className="mt-[4px] space-y-[2px]">
            {eliteRows.map(([k, l, v]) => (
              <div key={l} className="flex items-center gap-[6px]">
                <span style={{ color: INK }}><MechanicGlyph kind={k} size={13} /></span>
                <span className="text-[11.5px] leading-[12px]">{l}</span>
                <span className="ml-auto text-[11.5px] leading-[12px]" style={{ color: BLUE }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="shrink-0 text-center">
          <MatchArc pct={match?.overall ?? 88} />
          <div className="shotiq-microcaps mt-[3px] leading-[9px]" style={{ fontSize: 8, color: INK }}>OVERALL MATCH</div>
        </div>
      </Panel>
      {/* The catalog is explicit that these readings are tier-derived, not
          measured from that shooter's video, and requires callers to say so.
          The desktop compare table carries the same note. */}
      {match && match.estimated !== false && (
        <p className="mx-[13px] mt-[3px] text-[9px] leading-[11px]" style={{ color: GRAPHITE }}>
          Reference readings are a tier-derived estimate for {match.name}, not a measurement of their video.
        </p>
      )}

      {/* actions --------------------------------------------------------- */}
      <div className="mt-[4px] px-[13px]">
        <PrimaryBar
          testid="overview-view-breakdown"
          href="/results/demo/analysis"
          className="!h-[26px] !text-[15px]"
          glyph={<ActionGlyph kind="uploadVideo" height={15} />}
        >
          View shot breakdown
        </PrimaryBar>
        <Panel className="mt-[7px] flex h-[28px] items-center px-[13px]">
          <ActionGlyph kind="chooseMedia" height={16} />
          <span className="ml-[10px] text-[14.5px] leading-[16px]">Share analysis</span>
          <span className="ml-auto"><Chev size={14} /></span>
        </Panel>
      </div>
    </ResultsScreen>
  )
}

/** The circled "%" mark canonical sets over MAKE %: a ring with an orange
 *  three-quarter sweep and a % inside it. */
function MakeGauge() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" className="block">
      <circle cx="12" cy="12" r="10.4" fill="none" stroke="#D8DADC" strokeWidth="1.5" />
      <path d="M12 1.6 A10.4 10.4 0 0 1 19.4 19.4" fill="none" stroke={ORANGE} strokeWidth="1.7" strokeLinecap="round" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor">%</text>
    </svg>
  )
}

/** The blue match arc on the elite card: a 180° gauge filled to `pct` with the
 *  figure set inside it. */
function MatchArc({ pct = 88 }: { pct?: number }) {
  const r = 27
  const len = Math.PI * r
  return (
    <span className="relative block h-[40px] w-[68px]">
      <svg width="68" height="40" viewBox="0 0 68 40" aria-hidden="true">
        <path d={`M7 36 A${r} ${r} 0 0 1 61 36`} fill="none" stroke="#D8DADC" strokeWidth="6" strokeLinecap="round" />
        <path d={`M7 36 A${r} ${r} 0 0 1 61 36`} fill="none" stroke={BLUE} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${(len * pct) / 100} ${len}`} />
      </svg>
      <span className="shotiq-numeric absolute inset-x-0 bottom-[1px] text-[21px] leading-[21px]">
        {pct}<span className="text-[13px]">%</span>
      </span>
    </span>
  )
}
