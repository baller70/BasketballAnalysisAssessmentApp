"use client"

/** /results/demo/analysis — canonical 083-web-analysis-overview. */

import React from "react"
import Link from "next/link"
import { ArrowLeft, ChevronLeft, ChevronRight, Play, Pause, Maximize2 } from "lucide-react"
import { SectionLabel, Card, Stat, TrendLine } from "@/components/shotiq/ShotIQShell"
import { PoseFigure, WorkoutGlyph } from "@/components/shotiq/Glyphs"
import {
  useHistory, CoachingTarget, scoreSeries, sessionDelta, formatDelta,
  FormScoreCell, formatMakePct,
} from "@/components/shotiq/ResultsBits"
import { useShotClip, useFullscreen, ClipFrame, phaseAt, clock } from "@/components/shotiq/ShotClip"

const PHASES: [string, string][] = [
  ["SETUP", "0:00 – 0:02"], ["LOAD", "0:02 – 0:04"], ["RISE", "0:04 – 0:06"],
  ["RELEASE", "0:06 – 0:07"], ["FOLLOW-THROUGH", "0:07 – 0:10"],
]
// Canonical marks each release mechanic with a side-on figure whose measured
// segment is picked out, not with an abstract measurement diagram — one figure
// per mechanic, none repeated.
// Row diagrams are the canonical 083 crops, not redrawn line art.
const MECHANICS: [string, string, string, string][] = [
  ["Elbow Angle", "172°", "160° – 180°", "083-mech-1"], ["Wrist Angle", "21°", "15° – 30°", "083-mech-2"],
  ["Release Height", "8'6\"", "7'8\" – 8'8\"", "083-mech-3"], ["Body Alignment", "2°", "-5° – 5°", "083-mech-4"],
]

export default function AnalysisOverviewPage() {
  const { hasData, score, items, shots, makes } = useHistory()
  const trend = scoreSeries(items, 6)
  const delta = sessionDelta(items)
  // "N OF M" counts real analyses, not a literal.
  const total = items.length
  // Canonical opens on analysis 3 of 24 with film frame 4 scrubbed in; the two
  // are independent (analysis counter vs. frame scrubber).
  const [shot, setShot] = React.useState(3)
  // One real clock behind the play button, the progress bar, the filmstrip and
  // the readout — `frame` used to be state that only fed aria-pressed.
  const clip = useShotClip({ frames: 8 })
  const stageRef = React.useRef<HTMLDivElement>(null)
  const full = useFullscreen(stageRef)
  return (
    <div data-testid="screen-desktop-web-analysis-overview">
      <div className="flex items-start justify-between">
        {/* Canonical leads the title with a back affordance and dates the
            analysis in the subtitle. */}
        <div className="flex items-start gap-[14px]">
          <Link href="/results/demo/history" aria-label="Back to analyses"
                className="mt-[10px] shrink-0 text-[var(--shotiq-color-ink)]">
            <ArrowLeft className="h-[22px] w-[22px]" strokeWidth={1.7} />
          </Link>
          <div>
            <h1 className="shotiq-display text-[48px] leading-[50px]">ANALYSIS OVERVIEW</h1>
            <p className="mt-[4px] text-[13px] text-[var(--shotiq-color-graphite)]">
              {hasData
                ? `${items[0]?.when || "Latest analysis"} · ${items[0]?.style || "Catch & Shoot"} · Right Hand`
                : "Run an analysis to populate this view."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-[12px]">
          <button type="button" disabled={shot <= 1}
                  onClick={() => setShot((s) => Math.max(1, s - 1))}
                  className="flex h-[42px] items-center gap-[6px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[16px] text-[13px] disabled:opacity-40">
            <ChevronLeft className="h-[14px] w-[14px]" /> PREV
          </button>
          <div className="text-center">
            <div className="text-[14px] font-bold">{total ? shot : 0} OF {total}</div>
            <Link href="/results/demo/history" className="text-[11px] text-[var(--shotiq-color-graphite)]">View all analyses</Link>
          </div>
          <button type="button" disabled={shot >= total}
                  onClick={() => setShot((s) => Math.min(total, s + 1))}
                  className="flex h-[42px] items-center gap-[6px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[16px] text-[13px] disabled:opacity-40">
            NEXT <ChevronRight className="h-[14px] w-[14px]" />
          </button>
        </div>
      </div>

      <div className="mt-[12px] flex gap-[20px]">
        {/* media + scrubber + phases */}
        <div className="w-[520px] shrink-0">
          {/* Canonical release frame with the pose overlay and the 172° call-out;
              the scrub line rides the padding box so it can never clip out. */}
          <div ref={stageRef} className="relative overflow-hidden rounded-[4px] bg-[#1B1D20]" style={{ height: 322 }}>
            <ClipFrame still="/images/canonical/083-hero.png"
                       stillAlt="Analyzed release frame with pose skeleton and a 172 degree elbow call-out"
                       stillFrame={4} strip="/images/canonical/083-filmstrip.png"
                       frames={8} frame={clip.frame}
                       className="absolute inset-0 h-full w-full object-cover" />
            {/* Scrub track: drag-free seeking by click, head driven by position. */}
            <button type="button" data-testid="clip-track" aria-label="Seek"
                    onClick={(e) => {
                      const r = e.currentTarget.getBoundingClientRect()
                      clip.seek(((e.clientX - r.left) / r.width) * clip.duration)
                    }}
                    className="absolute inset-x-[10px] bottom-[4px] h-[12px]">
              <span className="absolute inset-x-0 top-[5px] h-[3px] rounded-full bg-white/40">
                <span className="absolute inset-y-0 left-0 rounded-full bg-white" style={{ width: `${clip.pct * 100}%` }} />
              </span>
              <span data-testid="clip-head"
                    className="absolute top-[1px] h-[11px] w-[11px] -translate-x-1/2 rounded-full bg-white"
                    style={{ left: `${clip.pct * 100}%` }} />
            </button>
          </div>
          <div className="mt-[8px] flex items-center gap-[10px]">
            <button type="button" aria-label={clip.playing ? "Pause" : "Play"} aria-pressed={clip.playing}
                    onClick={clip.toggle} data-testid="clip-play"
                    className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[4px] border border-[var(--shotiq-color-rule)]">
              {clip.playing
                ? <Pause className="h-[14px] w-[14px]" fill="currentColor" />
                : <Play className="h-[14px] w-[14px]" fill="currentColor" />}
            </button>
            <div className="relative min-w-0 flex-1 overflow-hidden rounded-[4px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/canonical/083-filmstrip.png" alt="" className="block h-auto w-full"
                   width={425} height={41} />
              <div className="absolute inset-0 flex">
                {Array.from({ length: 8 }).map((_, i) => (
                  <button key={i} type="button" aria-label={`Jump to segment ${i + 1}`}
                          data-testid={`clip-seek-${i}`}
                          aria-pressed={i === clip.frame} onClick={() => clip.seekFrame(i)}
                          className={`flex-1 ${i === clip.frame ? "ring-2 ring-inset ring-[var(--shotiq-color-shotiqOrange)]" : ""}`} />
                ))}
              </div>
            </div>
            <span className="shotiq-numeric shrink-0 text-[13px]" data-testid="clip-readout">
              {clock(clip.time)} / {clock(clip.duration)}
            </span>
            {/* Was a bare icon — not a button, so it could not be clicked or
                focused. It is the fullscreen control for the surface above. */}
            <button type="button" aria-label="Fullscreen" aria-pressed={full.isFull}
                    onClick={full.toggle} data-testid="clip-fullscreen" className="shrink-0">
              <Maximize2 className="h-[15px] w-[15px] text-[var(--shotiq-color-graphite)]" />
            </button>
          </div>
          {/* Canonical runs a connector track with a stage dot between each pair
              of phase figures; the dots either side of the current phase are
              picked out in orange. */}
          <div className="mt-[14px] flex items-start">
            {PHASES.map(([p, t], i) => {
              const current = phaseAt(clip.time)
              const active = p === current
              const reached = active || PHASES[i - 1]?.[0] === current
              return (
                <React.Fragment key={p}>
                  {i > 0 && (
                    <div className="mt-[14px] flex min-w-0 flex-1 items-center px-[4px]">
                      <span className="h-px flex-1 bg-[var(--shotiq-color-rule)]" />
                      <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${
                        active || reached ? "bg-[var(--shotiq-color-shotiqOrange)]" : "bg-[var(--shotiq-color-muted)]"}`} />
                      <span className="h-px flex-1 bg-[var(--shotiq-color-rule)]" />
                    </div>
                  )}
                  <div className="shrink-0 text-center">
                    <PoseFigure phase={p} active={active} height={41} className="mx-auto" />
                    <div className={`mt-[3px] text-[10px] tracking-[0.05em] ${active ? "font-bold text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-graphite)]"}`}>{p}</div>
                    <div className="text-[9px] text-[var(--shotiq-color-graphite)]">{t}</div>
                  </div>
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* Canonical wraps the form score, mechanics and coaching rail in ONE
            bordered card. The app drew them as bare columns, which left the
            block floating in ~130px of dead space with no container edge. */}
        <Card className="flex min-w-0 flex-1 divide-x divide-[var(--shotiq-color-rule)]">
        {/* form score + mechanics */}
        <div className="w-[268px] shrink-0 px-[18px] py-[14px]">
          {/* The one shared form-score module (see FormScoreCell). */}
          <FormScoreCell score={score} size={56} layout="below" suffix="/100" />

          <SectionLabel className="mt-[14px] border-t border-[var(--shotiq-color-rule)] pt-[12px]">MECHANICS AT RELEASE</SectionLabel>
          <div className="mt-[6px] divide-y divide-[var(--shotiq-color-rule)]">
            {MECHANICS.map(([m, v, range, glyph]) => (
              <div key={m} className="flex items-center gap-[8px] py-[9px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/images/canonical/${glyph}.png`} alt="" aria-hidden="true"
                     className="block h-[26px] w-[24px] max-w-none shrink-0 object-contain" />
                <span className="flex-1 whitespace-nowrap text-[13px]">{m}</span>
                <span className="shotiq-numeric text-[18px]">{hasData ? v : "—"}</span>
                <span className="w-[58px] shrink-0 text-right">
                  <span className="block text-[10px] font-bold text-[var(--shotiq-color-confirmGreen)]">IDEAL</span>
                  <span className="block text-[9px] text-[var(--shotiq-color-graphite)]">{range}</span>
                </span>
              </div>
            ))}
          </div>
          <Link href="/results/demo/biomechanics" className="mt-[8px] inline-block text-[13px] text-[var(--shotiq-color-analysisBlue)]">View all mechanics ›</Link>
        </div>

        {/* right rail */}
        <div className="min-w-0 flex-1 px-[18px] py-[14px]">
          <CoachingTarget />
          <SectionLabel className="mt-[20px] border-t border-[var(--shotiq-color-rule)] pt-[14px]">KEY INSIGHT</SectionLabel>
          <p className="mt-[6px] text-[13px] leading-[19px] text-[var(--shotiq-color-graphite)]">
            {hasData
              ? "Your elbow is slightly flaring late in release. Keeping it stacked will help improve consistency and shot accuracy."
              : "Insights appear after your first analysis."}
          </p>
          {/* Canonical prints this current-vs-ideal pair at ~90px; they had been
              shrunk to a size where the flared elbow is no longer readable. */}
          <div className="mt-[12px] flex items-center justify-center gap-[30px]">
            <div className="text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/canonical/083-insight-current.png" alt="" aria-hidden="true"
                   className="mx-auto block h-[95px] w-auto max-w-none" />
              <div className="shotiq-numeric text-[18px]">172°</div>
              <div className="text-[9px] tracking-[0.06em] text-[var(--shotiq-color-graphite)]">CURRENT</div>
            </div>
            <span className="text-[18px] text-[var(--shotiq-color-graphite)]">→</span>
            <div className="text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/canonical/083-insight-ideal.png" alt="" aria-hidden="true"
                   className="mx-auto block h-[95px] w-auto max-w-none" />
              <div className="shotiq-numeric text-[18px]">180°</div>
              <div className="text-[9px] tracking-[0.06em] text-[var(--shotiq-color-graphite)]">IDEAL</div>
            </div>
          </div>
          <SectionLabel className="mt-[16px] border-t border-[var(--shotiq-color-rule)] pt-[14px]">ELITE MATCH</SectionLabel>
          <div className="mt-[8px] flex items-center gap-[14px]">
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold">Trae Young</div>
              <div className="text-[12px] font-semibold text-[var(--shotiq-color-confirmGreen)]">92% Similarity</div>
              <Link href="/results/demo/compare" className="text-[12px] text-[var(--shotiq-color-analysisBlue)]">View comparison ›</Link>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/canonical/083-elite.png" alt="Trae Young shooting form with pose overlay"
                 className="block h-auto w-[130px] shrink-0 rounded-[4px]" width={151} height={106} />
          </div>
        </div>
        </Card>
      </div>

      {/* Bottom strip — one bordered container split by internal hairlines, with
          each panel's label set above its content the way canonical does. The
          labels used to sit beside the content in a 54-74px column, which broke
          all three of them onto two lines and squeezed the stats leftward. */}
      <Card className="mt-[12px] grid grid-cols-1 divide-y divide-[var(--shotiq-color-rule)] px-[8px] py-[4px] xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.95fr)_minmax(0,0.85fr)] xl:divide-x xl:divide-y-0 xl:py-[10px]">
        <div className="px-[16px] py-[10px] xl:py-[4px]">
          <SectionLabel>ANALYSIS SUMMARY</SectionLabel>
          {/* Canonical rules every cell off with a hairline. */}
          <div className="mt-[8px] flex items-start divide-x divide-[var(--shotiq-color-rule)]">
            <div className="min-w-0 flex-1 pr-[14px]"><Stat value={hasData ? shots ?? "—" : "0"} label="SHOTS" /></div>
            <div className="min-w-0 flex-1 px-[14px]"><Stat value={hasData ? makes ?? "—" : "0"} label="MAKES" /></div>
            <div className="min-w-0 flex-1 px-[14px]"><Stat value={hasData ? formatMakePct(shots, makes) : "—"} label="MAKE %" /></div>
            <div className="min-w-0 flex-1 px-[14px]">
              <Stat value={score != null ? String(score) : "—"} label="FORM SCORE" />
              {score != null && (
                <div className="mt-[3px] flex items-center gap-[6px] text-[12px] text-[var(--shotiq-color-graphite)]">
                  <span className="h-[8px] w-[8px] rounded-full bg-[var(--shotiq-color-analysisBlue)]" /> Good
                </div>
              )}
            </div>
            <div className="min-w-0 flex-[1.3] pl-[14px] text-right">
              <div className="shotiq-microcaps text-[var(--shotiq-color-graphite)]">TREND</div>
              <div className="flex items-center justify-end gap-[8px]">
                <TrendLine points={trend} width={78} height={28} />
                <span className={`text-[12px] ${delta != null && delta < 0 ? "text-[var(--shotiq-color-reviewRed)]" : "text-[var(--shotiq-color-confirmGreen)]"}`}>
                  {formatDelta(delta)}
                </span>
              </div>
              <div className="text-[10px] text-[var(--shotiq-color-graphite)]">vs last session</div>
            </div>
          </div>
        </div>

        <div className="px-[16px] py-[10px] xl:py-[4px]">
          <SectionLabel>TOP FLAW</SectionLabel>
          <div className="mt-[8px] flex items-center gap-[12px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/canonical/083-flaw-glyph.png" alt="" aria-hidden="true"
                 className="block h-[56px] w-[35px] max-w-none shrink-0 object-contain" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-[8px] gap-y-[2px]">
                <span className="whitespace-nowrap text-[14px] font-semibold">Elbow flare at release</span>
                <span className="whitespace-nowrap rounded-[3px] border border-[var(--shotiq-color-reviewRed)] px-[6px] py-[1px] text-[9px] font-bold text-[var(--shotiq-color-reviewRed)]">HIGH IMPACT</span>
              </div>
              <p className="text-[12px] leading-[16px] text-[var(--shotiq-color-graphite)]">Elbow moves outward slightly during release, reducing alignment.</p>
            </div>
            <Link href="/results/demo/flaws" aria-label="Open flaws" className="shrink-0">
              <span className="text-[var(--shotiq-color-graphite)]">›</span>
            </Link>
          </div>
        </div>

        <div className="px-[16px] py-[10px] xl:py-[4px]">
          <SectionLabel>NEXT TRAINING</SectionLabel>
          <div className="mt-[8px] flex items-center gap-[12px]">
            <span className="grid h-[48px] w-[48px] shrink-0 place-items-center rounded-full bg-[var(--shotiq-color-analysisBlue)] text-white">
              <WorkoutGlyph kind="release" size={24} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold">Quick Release Builder</div>
              <div className="text-[11px] text-[var(--shotiq-color-graphite)]">20 min · Form Focus</div>
              <div className="text-[11px] text-[var(--shotiq-color-graphite)]">Improve release speed and consistency.</div>
            </div>
            <Link href="/training/drills/quick-release-builder" aria-label="Start training" className="shrink-0">
              <span className="text-[var(--shotiq-color-graphite)]">›</span>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
