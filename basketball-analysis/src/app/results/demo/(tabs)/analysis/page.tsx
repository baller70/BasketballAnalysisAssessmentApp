"use client"

/** /results/demo/analysis — canonical 083-web-analysis-overview. */

import React from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Play, Maximize2 } from "lucide-react"
import { SectionLabel, Card, MediaSurface, Stat, TrendLine } from "@/components/shotiq/ShotIQShell"
import { PoseGlyph, MechanicGlyph, FlawFigure, WorkoutGlyph, type MechanicKind } from "@/components/shotiq/Glyphs"
import { useHistory, CoachingTarget } from "@/components/shotiq/ResultsBits"

const PHASES: [string, string][] = [
  ["SETUP", "0:00 – 0:02"], ["LOAD", "0:02 – 0:04"], ["RISE", "0:04 – 0:06"],
  ["RELEASE", "0:06 – 0:07"], ["FOLLOW-THROUGH", "0:07 – 0:10"],
]
// A distinct diagram per mechanic: joint angle, wrist flexion, height ruler,
// body midline — canonical draws no two of these alike.
const MECHANICS: [string, string, string, MechanicKind][] = [
  ["Elbow Angle", "172°", "160° – 180°", "angle"], ["Wrist Angle", "21°", "15° – 30°", "wrist"],
  ["Release Height", "8'6\"", "7'8\" – 8'8\"", "height"], ["Body Alignment", "2°", "-5° – 5°", "centerline"],
]

export default function AnalysisOverviewPage() {
  const { hasData, score } = useHistory()
  const total = hasData ? 24 : 0
  const [shot, setShot] = React.useState(1)
  return (
    <div data-testid="screen-desktop-web-analysis-overview">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="shotiq-display text-[48px] leading-[50px]">ANALYSIS OVERVIEW</h1>
          <p className="mt-[4px] text-[13px] text-[var(--shotiq-color-graphite)]">
            {hasData ? "Latest analysis · Catch & Shoot · Right Hand" : "Run an analysis to populate this view."}
          </p>
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

      <div className="mt-[16px] flex gap-[20px]">
        {/* media + scrubber + phases */}
        <div className="w-[520px] shrink-0">
          <MediaSurface width={520} height={335} />
          <div className="mt-[8px] flex items-center gap-[10px]">
            <span className="grid h-[34px] w-[34px] place-items-center rounded-[4px] border border-[var(--shotiq-color-rule)]">
              <Play className="h-[14px] w-[14px]" fill="currentColor" />
            </span>
            <div className="flex h-[42px] flex-1 gap-[3px] overflow-hidden rounded-[4px]">
              {Array.from({ length: 8 }).map((_, i) => (
                <button key={i} type="button" aria-label={`Jump to segment ${i + 1}`} aria-pressed={i === (shot - 1) % 8}
                        onClick={() => setShot(i + 1)}
                        className={`flex-1 bg-[#1B1D20] ${i === (shot - 1) % 8 ? "ring-2 ring-inset ring-[var(--shotiq-color-shotiqOrange)]" : ""}`} />
              ))}
            </div>
            <span className="shotiq-numeric text-[13px]">0:07 / 0:24</span>
            <Maximize2 className="h-[15px] w-[15px] text-[var(--shotiq-color-graphite)]" />
          </div>
          <div className="mt-[14px] flex items-start justify-between">
            {PHASES.map(([p, t]) => (
              <div key={p} className="text-center">
                <PoseGlyph phase={p} active={p === "RELEASE"} />
                <div className={`mt-[3px] text-[10px] tracking-[0.05em] ${p === "RELEASE" ? "font-bold text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-graphite)]"}`}>{p}</div>
                <div className="text-[9px] text-[var(--shotiq-color-graphite)]">{t}</div>
              </div>
            ))}
          </div>
        </div>

        {/* form score + mechanics */}
        <div className="w-[250px] shrink-0 border-l border-[var(--shotiq-color-rule)] pl-[20px]">
          <SectionLabel>FORM SCORE</SectionLabel>
          <div className="flex items-end gap-[6px]">
            <span className="shotiq-numeric text-[58px] leading-[62px] text-[var(--shotiq-color-shotiqOrange)]">{score ?? "—"}</span>
            <span className="pb-[10px] text-[15px] text-[var(--shotiq-color-muted)]">/100</span>
          </div>
          <div className="h-[7px] rounded-full bg-[var(--shotiq-color-rule)]">
            <div className="h-full rounded-full bg-[var(--shotiq-color-shotiqOrange)]" style={{ width: `${score ?? 0}%` }} />
          </div>
          <div className="mt-[8px] text-[14px] font-bold text-[var(--shotiq-color-analysisBlue)]">{score != null ? "GOOD" : "—"}</div>
          <p className="text-[12px] text-[var(--shotiq-color-graphite)]">{score != null ? "Keep building consistency." : "No analysis yet."}</p>

          <SectionLabel className="mt-[20px] border-t border-[var(--shotiq-color-rule)] pt-[14px]">MECHANICS AT RELEASE</SectionLabel>
          <div className="mt-[6px] divide-y divide-[var(--shotiq-color-rule)]">
            {MECHANICS.map(([m, v, range, glyph]) => (
              <div key={m} className="flex items-center gap-[10px] py-[9px]">
                <MechanicGlyph kind={glyph} size={20} className="shrink-0" />
                <span className="flex-1 text-[13px]">{m}</span>
                <span className="shotiq-numeric text-[18px]">{hasData ? v : "—"}</span>
                <span className="w-[64px] text-right">
                  <span className="block text-[10px] font-bold text-[var(--shotiq-color-confirmGreen)]">IDEAL</span>
                  <span className="block text-[9px] text-[var(--shotiq-color-graphite)]">{range}</span>
                </span>
              </div>
            ))}
          </div>
          <Link href="/results/demo/biomechanics" className="mt-[8px] inline-block text-[13px] text-[var(--shotiq-color-analysisBlue)]">View all mechanics ›</Link>
        </div>

        {/* right rail */}
        <div className="min-w-0 flex-1 border-l border-[var(--shotiq-color-rule)] pl-[20px]">
          <CoachingTarget />
          <SectionLabel className="mt-[20px] border-t border-[var(--shotiq-color-rule)] pt-[14px]">KEY INSIGHT</SectionLabel>
          <p className="mt-[6px] text-[13px] leading-[19px] text-[var(--shotiq-color-graphite)]">
            {hasData
              ? "Your elbow is slightly flaring late in release. Keeping it stacked will help improve consistency and shot accuracy."
              : "Insights appear after your first analysis."}
          </p>
          <div className="mt-[12px] flex items-center justify-center gap-[26px]">
            <div className="text-center">
              <FlawFigure kind="elbow" size={54} accent="var(--shotiq-color-reviewRed)" />
              <div className="shotiq-numeric text-[15px]">172°</div>
              <div className="text-[9px] tracking-[0.06em] text-[var(--shotiq-color-graphite)]">CURRENT</div>
            </div>
            <span className="text-[18px] text-[var(--shotiq-color-graphite)]">→</span>
            <div className="text-center">
              <FlawFigure kind="elbow" size={54} accent="var(--shotiq-color-confirmGreen)" />
              <div className="shotiq-numeric text-[15px]">180°</div>
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
            <MediaSurface width={130} height={78} />
          </div>
        </div>
      </div>

      {/* bottom strip — a 3-column grid with minmax(0,…) tracks so the flaw
          text can never be crushed into a sliver; stacks with row dividers
          below xl. */}
      <Card className="mt-[20px] grid grid-cols-1 divide-y divide-[var(--shotiq-color-rule)] px-[8px] py-[4px] xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.75fr)] xl:divide-x xl:divide-y-0 xl:py-[10px]">
        <div className="flex items-center gap-[18px] px-[16px] py-[10px] xl:py-0">
          <SectionLabel className="w-[74px] shrink-0 leading-[13px]">ANALYSIS SUMMARY</SectionLabel>
          <Stat value={hasData ? "24" : "0"} label="SHOTS" />
          <Stat value={hasData ? "15" : "0"} label="MAKES" />
          <Stat value={hasData ? "62.5%" : "—"} label="MAKE %" />
          <Stat value={score != null ? String(score) : "—"} label="FORM SCORE" />
          <div>
            <div className="text-[10px] tracking-[0.06em] text-[var(--shotiq-color-graphite)]">TREND</div>
            <TrendLine points={[3, 2.6, 3.3, 3, 4]} width={84} height={28} />
          </div>
        </div>
        <div className="flex items-center gap-[12px] px-[16px] py-[10px] xl:py-0">
          <SectionLabel className="w-[54px] shrink-0 leading-[13px]">TOP FLAW</SectionLabel>
          <FlawFigure kind="elbow" size={30} className="shrink-0" />
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
        <div className="flex items-center gap-[12px] px-[16px] py-[10px] xl:py-0">
          <SectionLabel className="w-[54px] shrink-0 leading-[13px]">NEXT TRAINING</SectionLabel>
          <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-[var(--shotiq-color-analysisBlue)] text-white">
            <WorkoutGlyph kind="release" size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold">Quick Release Builder</div>
            <div className="text-[11px] text-[var(--shotiq-color-graphite)]">20 min · Form Focus</div>
          </div>
          <Link href="/training/drills/quick-release-builder" aria-label="Start training" className="shrink-0">
            <span className="text-[var(--shotiq-color-graphite)]">›</span>
          </Link>
        </div>
      </Card>
    </div>
  )
}
