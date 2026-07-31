"use client"

/** /results/demo/flaws — canonical 085-web-flaws-history. */

import React, { useState } from "react"
import Link from "next/link"
import { SectionLabel, Card, MediaSurface, TrendLine, PhaseGlyph } from "@/components/shotiq/ShotIQShell"
import { ScoreBand, CoachingTarget, useHistory } from "@/components/shotiq/ResultsBits"

const FLAWS = [
  { n: 1, title: "Elbow not stacked at release", impact: "HIGH IMPACT", desc: "Elbow drifts forward causing inconsistent release point.", affects: "AFFECTS 62% OF SHOTS", delta: "-8.3% IMPACT" },
  { n: 2, title: "Slight wrist roll to the left", impact: "MEDIUM IMPACT", desc: "Ball rotates slightly left on release affecting accuracy.", affects: "AFFECTS 38% OF SHOTS", delta: "-4.1% IMPACT" },
  { n: 3, title: "Release point too low", impact: "MEDIUM IMPACT", desc: "Release height below optimal window reduces arc.", affects: "AFFECTS 26% OF SHOTS", delta: "-3.1% IMPACT" },
]

const LOWER_FLAWS = [
  { n: 4, title: "Narrow base on catch", impact: "LOW IMPACT", desc: "Feet slightly inside shoulder width on the catch.", affects: "AFFECTS 14% OF SHOTS", delta: "-1.2% IMPACT" },
  { n: 5, title: "Guide-hand thumb flick", impact: "LOW IMPACT", desc: "Occasional off-hand thumb movement at release.", affects: "AFFECTS 9% OF SHOTS", delta: "-0.8% IMPACT" },
]

export default function FlawsPage() {
  const { hasData, score } = useHistory()
  const [sel, setSel] = useState(0)
  const [showLower, setShowLower] = useState(false)
  const visible = hasData ? (showLower ? [...FLAWS, ...LOWER_FLAWS] : FLAWS) : []
  return (
    <div data-testid="screen-desktop-web-flaws-history">
      <div className="flex items-start justify-between gap-[20px]">
        <div>
          <h1 className="shotiq-display text-[48px] leading-[50px]">FLAWS &amp; CORRECTIONS</h1>
          <p className="mt-[4px] text-[14px] text-[var(--shotiq-color-graphite)]">
            Identify weaknesses. Focus your fixes. Track your progress.
          </p>
        </div>
        <div className="flex min-w-0 gap-[16px]">
          <ScoreBand score={score} />
          <Card className="w-[280px] px-[18px] py-[12px]"><CoachingTarget /></Card>
        </div>
      </div>

      <div className="mt-[18px] flex gap-[18px]">
        {/* flaw list */}
        <div className="w-[270px] shrink-0">
          <SectionLabel>YOUR TOP FLAWS</SectionLabel>
          {visible.map((f, i) => (
            <button key={f.n} type="button" onClick={() => setSel(i)} aria-pressed={sel === i}
                    className={`mt-[10px] w-full rounded-[8px] border p-[14px] text-left ${sel === i ? "border-[var(--shotiq-color-shotiqOrange)] border-2" : "border-[var(--shotiq-color-rule)]"}`}>
              <div className="flex items-center gap-[8px]">
                <span className="grid h-[20px] w-[20px] place-items-center rounded-[4px] bg-[var(--shotiq-color-shotiqOrange)] text-[11px] font-bold text-white">{f.n}</span>
                <span className="text-[14px] font-semibold">{f.title}</span>
              </div>
              <span className={`mt-[6px] inline-block rounded-[3px] px-[6px] py-[2px] text-[9px] font-bold text-white ${f.impact === "HIGH IMPACT" ? "bg-[var(--shotiq-color-reviewRed)]" : f.impact === "LOW IMPACT" ? "bg-[var(--shotiq-color-graphite)]" : "bg-[var(--shotiq-color-shotiqOrange)]"}`}>{f.impact}</span>
              <p className="mt-[6px] text-[12px] leading-[16px] text-[var(--shotiq-color-graphite)]">{f.desc}</p>
              <div className="mt-[8px] flex justify-between border-t border-[var(--shotiq-color-rule)] pt-[6px] text-[9px] tracking-[0.04em] text-[var(--shotiq-color-graphite)]">
                <span>{f.affects}</span><span>{f.delta}</span>
              </div>
            </button>
          ))}
          {!hasData && (
            <Card className="mt-[10px] p-[16px] text-[13px] text-[var(--shotiq-color-graphite)]">
              Flaws appear after your first analysis. <Link className="text-[var(--shotiq-color-analysisBlue)]" href="/analyze">Analyze a shot</Link>.
            </Card>
          )}
          <button type="button" onClick={() => setShowLower((v) => !v)} aria-expanded={showLower}
                  className="mt-[10px] text-[13px] text-[var(--shotiq-color-graphite)]">
            {showLower ? "Hide lower impact flaws ‹" : "Lower impact flaws (2) ›"}
          </button>
        </div>

        {/* comparison viewer */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <SectionLabel>{visible[sel] ? `SELECTED FLAW: ${visible[sel].title.toUpperCase()}` : "SELECTED FLAW"}</SectionLabel>
            <Link href="/results/demo/biomechanics" className="text-[12px] text-[var(--shotiq-color-analysisBlue)]">View details</Link>
          </div>
          <div className="mt-[8px] flex gap-[4px]">
            <div className="relative flex-1"><MediaSurface height={330} rounded={4} />
              <span className="absolute left-[12px] top-[12px] text-[11px] font-bold text-white">YOUR SHOT</span></div>
            <div className="relative flex-1"><MediaSurface height={330} rounded={4} />
              <span className="absolute left-[12px] top-[12px] text-[11px] font-bold text-white">MODEL REFERENCE
                <span className="ml-[6px] rounded-[3px] bg-[var(--shotiq-color-analysisBlue)] px-[5px] py-[1px] text-[8px]">PRO LEVEL</span></span></div>
          </div>
          <SectionLabel className="mt-[12px]">AFFECTED FRAMES (15)</SectionLabel>
          <div className="mt-[6px] flex items-center gap-[6px]">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className={`h-[64px] flex-1 rounded-[4px] bg-[#1B1D20] ${i === 3 ? "ring-2 ring-[var(--shotiq-color-shotiqOrange)]" : ""}`} />
            ))}
          </div>
          <div className="mt-[2px] text-center text-[9px] font-bold tracking-[0.06em] text-[var(--shotiq-color-shotiqOrange)]">RELEASE</div>
        </div>

        {/* insights rail */}
        <div className="w-[250px] shrink-0">
          <SectionLabel>FLAW INSIGHTS</SectionLabel>
          <Card className="mt-[8px] divide-y divide-[var(--shotiq-color-rule)]">
            {["Your elbow angle at release averages 118°. Goal range: 145° – 165°.",
              "Elbow drift moves release point forward by 2.6\" on average. Goal: keep elbow over hip.",
              "Impact: -8.3% to make % on affected shots."].map((t, i) => (
              <div key={i} className="flex gap-[10px] p-[12px]">
                <PhaseGlyph size={26} />
                <p className="text-[12px] leading-[17px]">{t}</p>
              </div>
            ))}
          </Card>
          <SectionLabel className="mt-[14px]">CORRECTIONS</SectionLabel>
          <Card className="mt-[8px] divide-y divide-[var(--shotiq-color-rule)]">
            {["Stack elbow over shooting hip.", "Create a 90° angle at set point.", "Drive straight up through release."].map((t) => (
              <div key={t} className="flex items-center gap-[10px] p-[10px]">
                <PhaseGlyph size={20} /><span className="text-[12px]">{t}</span>
              </div>
            ))}
          </Card>
          <SectionLabel className="mt-[14px]">RECOMMENDED DRILLS</SectionLabel>
          <Card className="mt-[8px] p-[12px]">
            <div className="flex items-center gap-[10px]">
              <span className="grid h-[36px] w-[36px] place-items-center rounded-full bg-[var(--shotiq-color-analysisBlue)] text-white">◎</span>
              <div className="flex-1">
                <div className="text-[13px] font-semibold">Elbow Alignment Holds</div>
                <div className="text-[11px] text-[var(--shotiq-color-graphite)]">8 min · Form Focus</div>
              </div>
            </div>
            <Link href="/training/drills/elbow-alignment-holds"
                  className="mt-[10px] flex h-[36px] items-center justify-center rounded-[4px] bg-[var(--shotiq-color-shotiqOrange)] text-[12px] font-bold tracking-[0.05em] text-white">
              START DRILL
            </Link>
          </Card>
        </div>
      </div>

      {/* bottom strip */}
      <div className="mt-[18px] flex gap-[16px]">
        <Card className="flex-1 px-[18px] py-[14px]">
          <SectionLabel>FLAW HISTORY</SectionLabel>
          <TrendLine points={[-1, -2, -5, -7, -7.5, -8, -8.2, -8.3].map((v) => -v)} width={420} height={110}
                     stroke="var(--shotiq-color-shotiqOrange)" dotFill="var(--shotiq-color-shotiqOrange)" />
          <div className="text-right text-[13px] font-bold text-[var(--shotiq-color-shotiqOrange)]">-8.3%</div>
        </Card>
        <Card className="w-[230px] shrink-0 px-[18px] py-[14px]">
          <SectionLabel>TREND SUMMARY</SectionLabel>
          <p className="mt-[6px] text-[12px] leading-[17px] text-[var(--shotiq-color-graphite)]">
            Impact on make % has improved 8.7% over the last 14 days.
          </p>
          <div className="mt-[8px] text-[18px] font-bold text-[var(--shotiq-color-confirmGreen)]">↓ 8.7%</div>
          <div className="text-[10px] tracking-[0.05em] text-[var(--shotiq-color-graphite)]">FROM -17.0% TO -8.3%</div>
        </Card>
        <Card className="flex-1 px-[18px] py-[14px]">
          <div className="flex items-center justify-between">
            <SectionLabel>RECENT SESSIONS</SectionLabel>
            <Link href="/results/demo/history" className="text-[11px] text-[var(--shotiq-color-graphite)]">View all history</Link>
          </div>
          <div className="mt-[4px] divide-y divide-[var(--shotiq-color-rule)]">
            {[["Today at 8:24 AM", "24 shots", "-8.3%"], ["May 10, 2025 at 6:15 PM", "22 shots", "-9.6%"], ["May 7, 2025 at 5:02 PM", "25 shots", "-11.2%"]].map(([d, s, v]) => (
              <div key={d} className="flex items-center justify-between py-[8px] text-[12px]">
                <span>{d}</span><span className="text-[var(--shotiq-color-graphite)]">{s}</span>
                <span className="font-bold text-[var(--shotiq-color-reviewRed)]">{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
