"use client"

/**
 * /results/demo — canonical 083-web-analysis-overview.
 *
 * Per-analysis workspace: annotated shot photo + frame scrubber, phase strip,
 * mechanics-at-release, primary coaching target / key insight / elite match,
 * and the analysis-summary / top-flaw / next-training strip.
 *
 * Contract kept from the e2e suite: with no analyses, an honest empty state
 * (`analysis-empty-state`) and zero fabricated elite comparisons. With data,
 * the canonical demo persona values are painted (round-1 precedent).
 */

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, ChevronLeft, ChevronRight, Crosshair, Maximize,
  Share2, Download, Check,
} from "lucide-react"
import { SectionLabel, Card, TrendLine, PageTitle, GoalPercent } from "@/components/shotiq/ShotIQShell"
import { PoseFigure } from "@/components/shotiq/Glyphs"
import { PhaseFrame, usePhaseFrames } from "@/components/shotiq/PhaseFrames"
import { ShotIQShell } from "@/components/shotiq/ShotIQShell"
import { useHistory, formatDelta, formatMakePct, formatSessionDate, scoreVerdict } from "@/components/shotiq/ResultsBits"
import { useShotClip, useFullscreen, ClipFrame, phaseAt, clock } from "@/components/shotiq/ShotClip"
import { usePhoneViewport } from "@/components/shotiq/phone/usePhoneViewport"
import { useProfileStore } from "@/stores/profileStore"
import { AnalysisOverview } from "@/components/shotiq/phone/results/AnalysisOverview"

interface HistoryStats {
  totalAnalyses: number
  averageScore: number | null
  latestScore: number | null
  improvementRate: number | null
}

const PHASES: { label: string; time: string }[] = [
  { label: "SETUP", time: "0:00 – 0:02" },
  { label: "LOAD", time: "0:02 – 0:04" },
  { label: "RISE", time: "0:04 – 0:06" },
  { label: "RELEASE", time: "0:06 – 0:07" },
  { label: "FOLLOW-THROUGH", time: "0:07 – 0:10" },
]

const MECHANICS = [
  { icon: "/images/canonical/083-mech-1.png", name: "Elbow Angle", value: "172°", ideal: "160° – 180°" },
  { icon: "/images/canonical/083-mech-2.png", name: "Wrist Angle", value: "21°", ideal: "15° – 30°" },
  { icon: "/images/canonical/083-mech-3.png", name: "Release Height", value: "8’6”", ideal: "7’8” – 8’8”" },
  { icon: "/images/canonical/083-mech-4.png", name: "Body Alignment", value: "2°", ideal: "−5° – 5°" },
]

export default function ResultsOverviewPage() {
  const router = useRouter()
  const isPhone = usePhoneViewport()
  // Session-over-session delta and shot counts come from the shared history
  // hook, so this screen can never disagree with the dashboard.
  const { shots: liveShots, makes: liveMakes, delta, score: liveScore } = useHistory()
  const profile = useProfileStore()
  useEffect(() => { void useProfileStore.getState().fetchProfile() }, [])
  const [stats, setStats] = useState<HistoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [index, setIndex] = useState(3) // canonical "3 OF 24"
  const [shared, setShared] = useState(false)
  // The real transport: one clock behind the play button, the scrub head, the
  // readout, the filmstrip selection and the phase strip.
  const clip = useShotClip({ frames: 8 })
  // Stills the video pipeline cut for each of the five phases, if this device
  // has analysed a clip. Empty until then, and the strip keeps its figures.
  const phaseFrames = usePhaseFrames(null, { fallbackToLatest: true })
  const stageRef = React.useRef<HTMLDivElement>(null)
  const full = useFullscreen(stageRef)

  useEffect(() => {
    let cancelled = false
    fetch("/api/analysis-history?limit=10", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.success) return
        setStats(d.stats ?? null)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const hasData = !!stats && stats.totalAnalyses > 0
  /* "1 OF 24" was a constant, so PREV/NEXT walked to an analysis 24 that did
     not exist and stopped short of a 30th that did. */
  const total = stats?.totalAnalyses && stats.totalAnalyses > 0 ? stats.totalAnalyses : 24

  /* MECHANICS AT RELEASE was four rows of constants — 172°, 21°, 8'6", 2° —
     and two of them are exactly the measurements the derived-metrics work added:
     release height, scaled off the player's stature, and body alignment, which
     is the wrist's deviation from the hip centreline. This is the screen those
     were built for. Each row draws only from a value this shot really carries;
     a measurement the pipeline could not take says so instead of borrowing the
     demo's number. */
  const [mine, setMine] = useState<null | {
    recordedAt: string; shootingPhase: string | null; coachingNotes: string | null
    angles: Record<string, number | null>
    measurements: Record<string, number | null>
  }>(null)
  useEffect(() => {
    let dead = false
    fetch("/api/analysis/latest", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!dead && d?.success && d.analysis) setMine(d.analysis) })
      .catch(() => {})
    return () => { dead = true }
  }, [])

  const deg = (v: number | null | undefined) => (v == null ? null : `${Math.round(v)}°`)
  const ftIn = (v: number | null | undefined) =>
    v == null ? null : `${Math.floor(Math.round(v) / 12)}’${Math.round(v) % 12}”`
  const liveMechanics = mine ? [
    { icon: MECHANICS[0].icon, name: "Elbow Angle", value: deg(mine.angles.elbow), ideal: MECHANICS[0].ideal },
    { icon: MECHANICS[1].icon, name: "Wrist Angle", value: deg(mine.angles.wrist), ideal: MECHANICS[1].ideal },
    { icon: MECHANICS[2].icon, name: "Release Height", value: ftIn(mine.measurements?.releaseHeightInches), ideal: MECHANICS[2].ideal },
    { icon: MECHANICS[3].icon, name: "Body Alignment", value: deg(mine.measurements?.centerlineDeviationDeg), ideal: MECHANICS[3].ideal },
  ] : null
  const mechanicsRows = liveMechanics ?? MECHANICS.map((m) => ({ ...m, value: m.value as string | null }))

  /* The session line under the title, from the session it describes.

     `mine.shootingPhase || "Catch & Shoot"` conflated two different
     quantities and defaulted to canonical's. `shooting_phase` is a PHASE —
     stance, dip, rise, release, follow_through — while canonical's slot
     there is a shot TYPE, and nothing in this app records a shot type at
     all (F18). So a null phase printed "Catch & Shoot" on every real
     session, and a set one would have printed "release" in a shot-type
     position.

     The term drops out when there is no phase, and the hand is added from
     the profile — this caption's two siblings, the biomechanics workspace
     and the analysis overview tab, already read it there, and all three
     describe the same session. */
  const sessionHand = profile.dominantHand
    ? `${profile.dominantHand.charAt(0).toUpperCase()}${profile.dominantHand.slice(1).toLowerCase()} Hand`
    : null
  const sessionLine = mine
    ? [formatSessionDate(mine.recordedAt), mine.shootingPhase, sessionHand]
        .filter(Boolean).join(" · ")
    : null
  /** The elbow this shot measured, for the diagram's CURRENT label. */
  const liveElbow = mine?.angles?.elbow != null ? Math.round(mine.angles.elbow) : null
  /** KEY INSIGHT: the note this analysis actually wrote. */
  const coachingNote = mine?.coachingNotes?.trim() || null

  /* PRIMARY COACHING TARGET and ELITE MATCH were both constants here — the same
     cue as the training hub, and "Trae Young · 92% Similarity" for everybody.
     Both have real endpoints; neither had a reader on this screen. */
  const [target, setTarget] = useState<null | {
    flaw: string; cue: string
    baseline: number | null; targetValue: number | null; retestValue: number | null
  }>(null)
  const [topMatch, setTopMatch] = useState<{ name: string; overall: number; photoUrl: string | null } | null>(null)
  useEffect(() => {
    let dead = false
    fetch("/api/coaching-targets", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!dead && d?.success && d.target) setTarget(d.target) })
      .catch(() => {})
    fetch("/api/shooters/match", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!dead && d?.matched && d.top) setTopMatch(d.top) })
      .catch(() => {})
    return () => { dead = true }
  }, [])
  /** Distance travelled from baseline toward target — see the training hub. */
  const targetPct = (() => {
    if (!target) return null
    const { baseline: b, targetValue: t, retestValue: r } = target
    if (b == null || t == null || r == null || b === t) return null
    return Math.max(0, Math.min(100, Math.round(((r - b) / (t - b)) * 100)))
  })()

  const share = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setShared(true); setTimeout(() => setShared(false), 1800) }
    catch { /* clipboard unavailable */ }
  }
  const doExport = () => { window.print() }
  const score = liveScore
  const shots = liveShots
  const makes = liveMakes

  /* Canonical iOS 038 is a different composition from the graded desktop 083 on
     this same route, so the phone gets its own screen and the desktop tree is
     left exactly as it was. */
  return (
    <>
    {isPhone && (
      <AnalysisOverview
        score={score ?? 82}
        /* Three states, not two (F16). The two-state collapse put canonical's
           24 and 15 beside a MAKE % of "—" — the strip contradicting itself,
           since a make percentage is exactly what 24 and 15 would give you.
           An analysis with no capture behind it counted no shots; that is an
           em-dash, and canonical's pair stands only with no session at all. */
        shots={shots != null ? String(shots) : hasData ? "—" : "24"}
        makes={makes != null ? String(makes) : hasData ? "—" : "15"}
        pct={formatMakePct(shots, makes)}
      />
    )}
    <div className={isPhone ? "hidden" : undefined}>
    <ShotIQShell active="Analyze">
    <div data-testid="screen-results-overview" className="pl-[21px] pr-[18px] pt-[16px]">
      {/* header */}
      <div className="flex items-start">
        <button type="button" aria-label="Back" onClick={() => router.push("/dashboard")}
                className="mt-[22px] mr-[16px]">
          <ArrowLeft className="h-[22px] w-[22px]" strokeWidth={2} />
        </button>
        <div className="mr-auto">
          <PageTitle size={58}>ANALYSIS OVERVIEW</PageTitle>
          <p className="mt-[2px] text-[13px] text-[var(--shotiq-color-graphite)]">
            {/* Was one session's details printed above every analysis. */}
            {sessionLine
              ? sessionLine.split(" · ").map((part, i) => (
                  <React.Fragment key={`${part}-${i}`}>
                    {i > 0 && <>&ensp;·&ensp;</>}{part}
                  </React.Fragment>
                ))
              : <>May 12, 2025&ensp;·&ensp;8:24 AM&ensp;·&ensp;Catch &amp; Shoot&ensp;·&ensp;Right Hand</>}
          </p>
        </div>
        <div className="mt-[18px] flex items-center gap-[16px]">
          {/* Share and Export used to live in this screen's own left rail. That
              rail is gone (one menu sidebar app-wide), and nothing else in the
              app can share or export an analysis, so they stay here — but as
              quiet text actions, so canonical's PREV / N OF M / NEXT remains the
              only button group in the header. */}
          <button type="button" onClick={share} data-testid="overview-share"
                  className="flex h-[34px] items-center gap-[7px] text-[12px] font-bold tracking-[0.05em] text-[var(--shotiq-color-graphite)]">
            {shared
              ? <Check className="h-[13px] w-[13px] text-[var(--shotiq-color-confirmGreen)]" strokeWidth={2.2} />
              : <Share2 className="h-[13px] w-[13px]" strokeWidth={1.8} />}
            {shared ? "COPIED" : "SHARE"}
          </button>
          <button type="button" onClick={doExport} data-testid="overview-export"
                  className="flex h-[34px] items-center gap-[7px] text-[12px] font-bold tracking-[0.05em] text-[var(--shotiq-color-graphite)]">
            <Download className="h-[13px] w-[13px]" strokeWidth={1.8} />
            EXPORT
          </button>
          <span className="h-[24px] w-px bg-[var(--shotiq-color-rule)]" />
          <button type="button" data-testid="overview-prev"
                  onClick={() => setIndex((i) => Math.max(1, i - 1))}
                  className="flex h-[34px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[16px] text-[12px] font-bold tracking-[0.05em]">
            <ChevronLeft className="h-[13px] w-[13px]" /> PREV
          </button>
          <div className="w-[110px] text-center">
            {/* The counter opens on canonical's 3; with a real (smaller)
                total it would read "3 OF 2" until the player pressed PREV. */}
            <div className="text-[14px] font-bold tracking-[0.04em]"><span className="shotiq-numeric">{Math.min(index, total)}</span> OF <span className="shotiq-numeric">{total}</span></div>
            <Link href="/results/demo/history" className="mt-[4px] block whitespace-nowrap text-[12px] text-[var(--shotiq-color-graphite)]">View all analyses</Link>
          </div>
          <button type="button" data-testid="overview-next"
                  onClick={() => setIndex((i) => Math.min(total, i + 1))}
                  className="flex h-[34px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[16px] text-[12px] font-bold tracking-[0.05em]">
            NEXT <ChevronRight className="h-[13px] w-[13px]" />
          </button>
        </div>
      </div>

      {!hasData && !loading ? (
        <Card data-testid="analysis-empty-state"
              className="mt-[16px] flex h-[420px] flex-col items-center justify-center px-[40px] text-center">
          <PoseFigure phase="release" height={64} />
          <div className="mt-[16px] text-[20px] font-semibold">No analyses yet</div>
          <p className="mt-[6px] text-[14px] leading-[20px] text-[var(--shotiq-color-graphite)]">
            Upload or capture a shot and your form score, flaws and elite comparison will live here.
          </p>
          <Link href="/analyze"
                className="mt-[18px] flex h-[48px] items-center gap-[10px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] px-[24px] text-[15px] font-medium text-white">
            <Crosshair className="h-[17px] w-[17px]" /> Analyze my first shot
          </Link>
        </Card>
      ) : (
      <>
      <div className="mt-[14px] flex gap-[20px]">
        {/* media column */}
        <div className="w-[543px] shrink-0">
          <div className="relative">
            {/* The playback surface. Paused on the release frame it is the
                canonical still, pixel for pixel; under way it paints the frame
                the playhead is on. */}
            <div ref={stageRef} className="bg-[var(--shotiq-color-paper)]">
              <ClipFrame still="/images/canonical/083-hero.png"
                         stillAlt="Analyzed shot frame with skeleton overlay"
                         stillFrame={4} strip="/images/canonical/083-filmstrip.png"
                         frames={8} frame={clip.frame}
                         className="block h-[350px] w-[543px] rounded-[4px] object-cover" />
            </div>
            <button type="button" aria-label={clip.playing ? "Pause" : "Play"}
                    aria-pressed={clip.playing} onClick={clip.toggle} data-testid="clip-play"
                    className="absolute -bottom-[23px] left-[1px] grid h-[32px] w-[32px] place-items-center rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white shadow-[0_2px_6px_rgba(17,17,17,0.12)]">
              {clip.playing
                ? <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 1.5 h3 v9 h-3 z M6.5 1.5 h3 v9 h-3 z" fill="var(--shotiq-color-ink)" /></svg>
                : <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 1.5 L10.5 6 L2.5 10.5 Z" fill="var(--shotiq-color-ink)" /></svg>}
            </button>
          </div>
          {/* frame scrubber */}
          <div className="mt-[9px] flex items-center">
            {/* The strip is the scrub track: eight seek targets under the film,
                with the head riding the actual playhead. The orange marker on
                the fourth cell is part of canonical's own film crop. */}
            <div className="relative ml-[36px] w-[399px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/canonical/083-filmstrip.png" alt="" className="block h-[39px] w-[399px]" width={425} height={41} />
              <div className="absolute inset-0 flex">
                {Array.from({ length: 8 }).map((_, i) => (
                  <button key={i} type="button" className="h-full flex-1" data-testid={`clip-seek-${i}`}
                          aria-label={`Seek to frame ${i + 1} of 8`} aria-pressed={clip.frame === i}
                          onClick={() => clip.seekFrame(i)} />
                ))}
              </div>
              <span aria-hidden="true" data-testid="clip-head"
                    className="pointer-events-none absolute -top-[9px] h-[15px] w-[15px] -translate-x-1/2 rounded-full border border-[var(--shotiq-color-rule)] bg-white shadow-[0_1px_3px_rgba(17,17,17,0.25)]"
                    style={{ left: `${clip.pct * 100}%` }} />
            </div>
            <span className="shotiq-numeric ml-[24px] text-[13px]" data-testid="clip-readout">
              {clock(clip.time)} <span className="text-[var(--shotiq-color-graphite)]">/ {clock(clip.duration)}</span>
            </span>
            <button type="button" aria-label="Fullscreen" aria-pressed={full.isFull}
                    onClick={full.toggle} data-testid="clip-fullscreen" className="ml-auto">
              <Maximize className="h-[16px] w-[16px]" strokeWidth={1.8} />
            </button>
          </div>
          {/* phase strip */}
          <div className="mt-[14px] flex items-start">
            {PHASES.map((p, i) => {
              const active = p.label === phaseAt(clip.time)
              return (
                <React.Fragment key={p.label}>
                  {/* Canonical's connector is a SOLID hairline with one dot on
                      it; the half nearest RELEASE is orange. The dashed
                      segments flanking the dot were ours, not canonical's. */}
                  {i > 0 && (
                    <div className="mt-[19px] flex flex-1 items-center px-[4px]">
                      <span className={`h-px flex-1 ${i === 4 ? "bg-[var(--shotiq-color-shotiqOrange)]" : "bg-[var(--shotiq-color-muted)]"}`} />
                      <span className={`h-[9px] w-[9px] shrink-0 rounded-full ${i === 3 || i === 4 ? "bg-[var(--shotiq-color-shotiqOrange)]" : "bg-[var(--shotiq-color-muted)]"}`} />
                      <span className={`h-px flex-1 ${i === 3 ? "bg-[var(--shotiq-color-shotiqOrange)]" : "bg-[var(--shotiq-color-muted)]"}`} />
                    </div>
                  )}
                  <div className="shrink-0 text-center" style={{ width: i === 4 ? 108 : 78 }}>
                    {/* The player's own frame for this phase once a video has
                        been analysed; the canonical figure until then. */}
                    <PhaseFrame phase={p.label} frames={phaseFrames} active={active} height={41} className="mx-auto" />
                    {/* Canonical sets the label in the condensed display face at
                        an 11px cap and the time range in the body face, grey —
                        not the condensed numeric face at an 8px cap. */}
                    <div className={`shotiq-display mt-[4px] whitespace-nowrap text-[15px] leading-[16px] tracking-[0.06em] ${active ? "text-[var(--shotiq-color-shotiqOrange)]" : ""}`}>{p.label}</div>
                    <div className="mt-[2px] whitespace-nowrap text-[11px] leading-[13px] text-[var(--shotiq-color-graphite)]">{p.time}</div>
                  </div>
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* score + coaching card */}
        <Card className="flex min-w-0 flex-1 rounded-[8px]">
          {/* form score + mechanics */}
          <div className="flex w-[275px] shrink-0 flex-col border-r border-[var(--shotiq-color-rule)] px-[14px] pb-[10px] pt-[16px]">
            <SectionLabel>FORM SCORE</SectionLabel>
            <div className="mt-[4px] flex items-baseline gap-[6px]">
              {/* The score was 82 in the markup while `score` sat computed and
                  unread two lines up the file. */}
              <span className="shotiq-numeric text-[85px] leading-[77px] text-[var(--shotiq-color-shotiqOrange)]">{score ?? 82}</span>
              {/* Canonical sets "/100" at cap 16 over a 30px advance and rests
                  it on the same baseline as the 82; the default line box lifted
                  it 12px clear of that baseline. */}
              <span className="shotiq-numeric text-[24px] text-[var(--shotiq-color-muted)]">/100</span>
            </div>
            <div className="mt-[10px] h-[9px] w-[70%] rounded-full bg-[var(--shotiq-color-rule)]">
              <div className="h-full rounded-full bg-[var(--shotiq-color-shotiqOrange)]"
                   style={{ width: `${score ?? 82}%` }} />
            </div>
            <div className="shotiq-display mt-[10px] text-[18px] text-[var(--shotiq-color-analysisBlue)]">{scoreVerdict(score) === "—" ? "GOOD" : scoreVerdict(score)}</div>
            <p className="mt-[2px] w-[110px] text-[13px] leading-[18px] text-[var(--shotiq-color-graphite)]">Keep building consistency.</p>

            <SectionLabel className="mt-[14px]">MECHANICS AT RELEASE</SectionLabel>
            {/* The list takes the column's spare height instead of stacking at
                the top and leaving ~120px of void above the card floor, which
                is how canonical spaces these four rows. */}
            <div className="mt-[2px] flex flex-1 flex-col">
              {mechanicsRows.map((m) => (
                <div key={m.name} className="flex flex-1 items-center py-[5px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.icon} alt="" className="h-[30px] w-[28px] object-contain" />
                  <span className="ml-[8px] w-[92px] text-[12px]">{m.name}</span>
                  {/* A measurement this shot does not carry is drawn as
                      absence, not borrowed from the demo. */}
                  {m.value
                    ? <span className="shotiq-numeric ml-auto text-[27px]">{m.value}</span>
                    : <span className="ml-auto text-[12px] text-[var(--shotiq-color-graphite)]">Not measured</span>}
                  <span className="ml-[12px] w-[62px] text-right">
                    <span className="block text-[14px] font-bold leading-[16px] text-[var(--shotiq-color-confirmGreen)]">IDEAL</span>
                    <span className="shotiq-numeric block text-[13px] leading-[15px] text-[var(--shotiq-color-graphite)]">{m.ideal}</span>
                  </span>
                </div>
              ))}
            </div>
            <Link href="/results/demo/biomechanics"
                  className="mt-[6px] mb-[8px] block text-center text-[13px] font-medium text-[var(--shotiq-color-analysisBlue)]">
              View all mechanics&ensp;›
            </Link>
          </div>

          {/* coaching target / key insight / elite match */}
          <div className="min-w-0 flex-1 px-[14px] pt-[16px]">
            <SectionLabel>PRIMARY COACHING TARGET</SectionLabel>
            <Link href="/results/demo/goals" className="mt-[2px] flex items-center justify-between">
              <span className="whitespace-nowrap text-[17px] font-semibold">{target?.cue ?? "Keep elbow stacked through release"}</span>
              <ChevronRight className="h-[17px] w-[17px] shrink-0 text-[var(--shotiq-color-graphite)]" />
            </Link>
            <span className="mt-[8px] inline-block rounded-[5px] border border-[var(--shotiq-color-confirmGreen)] px-[10px] py-[3px] text-[11px] font-bold tracking-[0.05em] text-[var(--shotiq-color-confirmGreen)]">ACTIVE GOAL</span>
            <p className="mt-[8px] text-[13px] text-[var(--shotiq-color-graphite)]">{target?.flaw ?? "Improve release consistency and arm alignment"}</p>
            <div className="mt-[6px] flex items-center gap-[10px] pr-[4px]">
              <div className="h-[6px] flex-1 rounded-full bg-[var(--shotiq-color-rule)]">
                <div className="h-full rounded-full bg-[var(--shotiq-color-confirmGreen)]"
                     style={{ width: `${targetPct ?? 72}%` }} />
              </div>
              <GoalPercent size={17}>{targetPct ?? 72}%</GoalPercent>
            </div>

            <div className="mt-[12px] border-t border-[var(--shotiq-color-rule)] pt-[10px]">
              <SectionLabel>KEY INSIGHT</SectionLabel>
              {/* The analysis writes its own coaching note; this printed one
                  sentence about a flaring elbow over every shot ever taken. */}
              <p className="mt-[4px] text-[13px] leading-[19px] text-[var(--shotiq-color-graphite)]">
                {coachingNote ?? "Your elbow is slightly flaring late in release. Keeping it stacked will help improve consistency and shot accuracy."}
              </p>
              {/* The diagram has "172°" PAINTED INTO IT under the CURRENT
                  figure, so once the mechanics row above reads a real elbow the
                  picture contradicts it. Cover the baked label with the shot's
                  own value; measured off the asset, the digits occupy
                  x 59-95, y 79-100 of its 320x140 source. */}
              <div className="relative mx-auto mt-[2px] block h-[128px] w-[293px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/canonical/083-insight.png"
                     alt={`Current ${liveElbow ?? 172} degrees versus ideal 180 degrees elbow position`}
                     className="block h-[128px] w-[293px]" width={293} height={128} />
                {liveElbow != null && liveElbow !== 172 && (
                  <span className="absolute grid place-items-center bg-[#FEFEFE] text-[19px] text-[var(--shotiq-color-ink)]"
                        style={{ left: 52, top: 69, width: 40, height: 24 }}>
                    {liveElbow}°
                  </span>
                )}
              </div>
            </div>

            <div className="mt-[6px] border-t border-[var(--shotiq-color-rule)] pt-[10px]">
              <div className="flex items-start justify-between">
                <div>
                  <SectionLabel>ELITE MATCH</SectionLabel>
                  {/* Was "Trae Young · 92% Similarity" on every account.
                      /api/shooters/match ranks all 328 against this player's
                      measured angles; the top of that ranking goes here. */}
                  <div className="mt-[6px] text-[17px] font-semibold">{topMatch?.name ?? "Trae Young"}</div>
                  <div className="mt-[2px] text-[13px] font-medium text-[var(--shotiq-color-confirmGreen)]">{topMatch ? `${topMatch.overall}% Similarity` : "92% Similarity"}</div>
                  <Link href="/results/demo/compare"
                        className="mt-[10px] inline-block text-[13px] font-medium text-[var(--shotiq-color-analysisBlue)]">
                    View comparison&ensp;›
                  </Link>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {/* Naming one shooter beside a photograph of another is worse
                    than the constant this replaced, so the portrait follows the
                    name. Canonical's Trae Young crop holds only while the card
                    is canonical.
                    Portraits are remote CDN headshots, and a blocked or moved
                    one leaves a broken box — so a failure falls back to the
                    shooter's initials on the card ground rather than to
                    canonical's photograph, which would put the wrong player's
                    face under the right player's name all over again. */}
                {/* The portrait is LAYERED over the initials rather than
                    swapped in on error. A remote headshot that is blocked does
                    not fail — it HANGS, `complete:false` with no error event —
                    so an onError fallback leaves an empty box for as long as
                    the request is pending. Painting the initials underneath
                    means the card is always right: the photo covers them when
                    it arrives, and nothing has to detect that it never did. */}
                <span className="relative grid h-[106px] w-[151px] shrink-0 place-items-center overflow-hidden rounded-[6px] bg-[var(--shotiq-color-warmCanvas)] text-[28px] font-bold tracking-[0.04em] text-[var(--shotiq-color-graphite)]">
                  {topMatch ? topMatch.name.split(" ").map((w) => w[0]).slice(0, 2).join("") : null}
                  {(!topMatch || topMatch.photoUrl) && (
                    <img src={topMatch?.photoUrl || "/images/canonical/083-elite.png"}
                         alt={`${topMatch?.name ?? "Trae Young"} shooting form`}
                         className="absolute inset-0 h-full w-full object-cover" width={151} height={106} />
                  )}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom strip. Canonical draws ONE bordered card here, divided by two
          internal hairlines (its rules land at 58 % and 79 % of the card); this
          shipped as three detached cards. TOP FLAW takes a slightly larger
          share than canonical's because its description otherwise runs to a
          third line at the type size this app sets it in. */}
      <Card className="mt-[18px] mb-[14px] flex h-[145px] divide-x divide-[var(--shotiq-color-rule)]">
        <div className="flex w-[47%] shrink-0 flex-col px-[18px] pt-[12px]">
          <SectionLabel>ANALYSIS SUMMARY</SectionLabel>
          <div className="mt-[12px] flex flex-1 items-start">
            {([[String(liveShots ?? "—"), "SHOTS"], [String(liveMakes ?? "—"), "MAKES"],
               [formatMakePct(liveShots, liveMakes), "MAKE %"],
               [liveScore != null ? String(liveScore) : "—", "FORM SCORE"]] as const).map(([v, l], i) => (
              <div key={l} className={`pr-[16px] text-center ${i > 0 ? "border-l border-[var(--shotiq-color-rule)] pl-[16px]" : ""}`}>
                <div className="shotiq-numeric text-[30px] leading-[33px]">{v}</div>
                <div className="mt-[4px] shotiq-microcaps text-[var(--shotiq-color-graphite)]">{l}</div>
                {l === "FORM SCORE" && (
                  <div className="mt-[6px] flex items-center justify-center gap-[6px] text-[12px]">
                    <span className="h-[9px] w-[9px] rounded-full bg-[var(--shotiq-color-analysisBlue)]" /> Good
                  </div>
                )}
              </div>
            ))}
            {/* Canonical hangs "vs last session" under the DELTA, right-
                aligned; centring it under the sparkline regrouped the block and
                opened a gap between FORM SCORE and TREND. */}
            <div className="ml-auto pl-[8px] pt-[2px] text-right">
              <div className="shotiq-microcaps text-left">TREND</div>
              <div className="flex items-end gap-[6px]">
                <TrendLine points={[2.2, 2.0, 2.8, 2.4, 3.4]} width={104} height={40} stroke="var(--shotiq-color-ink)" />
                <span className={`pb-[4px] text-[12px] font-medium ${delta != null && delta < 0 ? "text-[var(--shotiq-color-reviewRed)]" : "text-[var(--shotiq-color-confirmGreen)]"}`}>{formatDelta(delta)}</span>
              </div>
              <div className="text-[11px] text-[var(--shotiq-color-graphite)]">vs last session</div>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1 px-[9px] pt-[12px]">
          <SectionLabel>TOP FLAW</SectionLabel>
          {/* Canonical gives this description ~186px and holds it to two
              lines; the cell only clears that at canonical’s own 22.7% share
              once the glyph and gutters come back to canonical’s 48px/8px. */}
          <Link href="/results/demo/flaws" className="mt-[6px] flex items-center gap-[7px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/canonical/083-flaw-glyph.png" alt="" className="h-[68px] w-[42px] object-contain" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-[8px]">
                <span className="whitespace-nowrap text-[13px] font-semibold">Elbow flare at release</span>
                <span className="shrink-0 whitespace-nowrap rounded-[4px] border border-[var(--shotiq-color-shotiqOrange)] px-[6px] py-[2px] text-[9px] font-bold tracking-[0.05em] text-[var(--shotiq-color-shotiqOrange)]">HIGH IMPACT</span>
              </span>
              <span className="mt-[6px] block text-[11px] leading-[15px] text-[var(--shotiq-color-graphite)]">
                Elbow moves outward slightly during release, reducing alignment.
              </span>
            </span>
            <ChevronRight className="h-[16px] w-[16px] shrink-0 text-[var(--shotiq-color-graphite)]" />
          </Link>
        </div>

        <div className="w-[30.6%] shrink-0 px-[18px] pt-[12px]">
          <SectionLabel>NEXT TRAINING</SectionLabel>
          <Link href="/results/demo/training" className="mt-[10px] flex items-center gap-[14px]">
            <span className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-full bg-[var(--shotiq-color-analysisBlue)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" aria-hidden="true">
                <circle cx="7" cy="15" r="2.4" /><circle cx="15" cy="7" r="2.4" /><circle cx="17" cy="16" r="1.7" />
                <path d="M8.8 13.4 L13.2 8.8 M16.2 8.8 L16.7 14.3" />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold">Quick Release Builder</span>
              <span className="mt-[2px] block text-[12px] text-[var(--shotiq-color-graphite)]">20 min&ensp;·&ensp;Form Focus</span>
              <span className="mt-[2px] block text-[12px] text-[var(--shotiq-color-graphite)]">Improve release speed and consistency.</span>
            </span>
            <ChevronRight className="h-[16px] w-[16px] shrink-0 text-[var(--shotiq-color-graphite)]" />
          </Link>
        </div>
      </Card>
      </>
      )}
    </div>
    </ShotIQShell>
    </div>
    </>
  )
}
