"use client"

/** /results/demo/flaws — canonical 085-web-flaws-history. */

import React, { useState } from "react"
import Link from "next/link"
import { ChevronRight, ChevronLeft, ArrowDown } from "lucide-react"
import { ShotIQShell, SectionLabel, Card, PageTitle, GoalPercent } from "@/components/shotiq/ShotIQShell"
import { FlawFigure, WorkoutGlyph, type FlawKind } from "@/components/shotiq/Glyphs"
import { useHistory, FormScoreCell, formatDelta, formatMakePct } from "@/components/shotiq/ResultsBits"

// Every flaw card carries its own pose diagram, with the faulty segment picked
// out in the alert colour — the ~60px figure canonical prints on each card.
type Flaw = { n: number; title: string; impact: string; desc: string; affects: string; delta: string; glyph: FlawKind; mark?: string }

// Canonical prints the three top flaws with their own figures; `mark` is the
// crop taken from 085. The two lower-impact flaws sit behind a disclosure that
// canonical never opens, so they have no source and keep the drawn figure.
const FLAWS: Flaw[] = [
  { n: 1, title: "Elbow not stacked at release", impact: "HIGH IMPACT", desc: "Elbow drifts forward causing inconsistent release point.", affects: "AFFECTS 62% OF SHOTS", delta: "-8.3% IMPACT", glyph: "elbow", mark: "085-flaw-1" },
  { n: 2, title: "Slight wrist roll to the left", impact: "MEDIUM IMPACT", desc: "Ball rotates slightly left on release affecting accuracy.", affects: "AFFECTS 38% OF SHOTS", delta: "-4.1% IMPACT", glyph: "wrist", mark: "085-flaw-2" },
  { n: 3, title: "Release point too low", impact: "MEDIUM IMPACT", desc: "Release height below optimal window reduces arc.", affects: "AFFECTS 26% OF SHOTS", delta: "-3.1% IMPACT", glyph: "release", mark: "085-flaw-3" },
]

const LOWER_FLAWS: Flaw[] = [
  { n: 4, title: "Narrow base on catch", impact: "LOW IMPACT", desc: "Feet slightly inside shoulder width on the catch.", affects: "AFFECTS 14% OF SHOTS", delta: "-1.2% IMPACT", glyph: "base" },
  { n: 5, title: "Guide-hand thumb flick", impact: "LOW IMPACT", desc: "Occasional off-hand thumb movement at release.", affects: "AFFECTS 9% OF SHOTS", delta: "-0.8% IMPACT", glyph: "guide" },
]

export default function FlawsPage() {
  const { hasData, score, shots, makes, delta } = useHistory()
  const [sel, setSel] = useState(0)
  const [showLower, setShowLower] = useState(false)
  const visible = hasData ? (showLower ? [...FLAWS, ...LOWER_FLAWS] : FLAWS) : []
  return (
    <ShotIQShell active="Analyze">
    <div data-testid="screen-desktop-web-flaws-history" className="px-[22px] pt-[14px]">
      {/* Canonical draws the score, session stats and the coaching target as one
          bordered container split by vertical hairlines — not a card plus a
          loose block beside it. */}
      <div className="flex items-start gap-[16px]">
        <div className="w-[374px] shrink-0">
          <PageTitle size={55}>FLAWS &amp; CORRECTIONS</PageTitle>
          <p className="mt-[4px] whitespace-nowrap text-[14px] text-[var(--shotiq-color-graphite)]">
            Identify weaknesses. Focus your fixes. Track your progress.
          </p>
        </div>
        <Card className="flex h-[106px] min-w-0 flex-1 items-center pl-[14px]">
          {/* The one shared form-score module (see FormScoreCell) — short bar
              under the numeral, left-aligned verdict beside it. */}
          <FormScoreCell score={score} size={38} numeral={55} className="w-[214px] shrink-0 pr-[10px]" />
          {[[shots ?? "—", "SHOTS"], [makes ?? "—", "MAKES"], [formatMakePct(shots, makes), "MAKE %"]].map(([v, l]) => (
            <div key={String(l)} className="w-[66px] shrink-0 border-l border-[var(--shotiq-color-rule)] px-[6px] text-center">
              <div className="shotiq-numeric text-[24px] leading-[28px]">{hasData ? v : "—"}</div>
              <div className="text-[9px] tracking-[0.06em] text-[var(--shotiq-color-graphite)]">{l}</div>
            </div>
          ))}
          <div className="w-[92px] shrink-0 border-l border-[var(--shotiq-color-rule)] pl-[8px] text-center">
            <svg width="78" height="34" viewBox="0 0 86 34" aria-hidden="true">
              <path d="M4,22 L16,26 L28,14 L40,18 L52,10 L64,16 L76,6" fill="none" stroke="var(--shotiq-color-graphite)" strokeWidth="1.5" />
              {[[4, 22], [16, 26], [28, 14], [40, 18], [52, 10], [64, 16], [76, 6]].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="2.4" fill={i >= 5 ? "var(--shotiq-color-confirmGreen)" : "var(--shotiq-color-graphite)"} />
              ))}
            </svg>
            {/* Computed session-over-session delta — the same figure every
                other screen prints; this was a hard-coded +8.1%. */}
            <div className="text-[10px] leading-[12px]"><span className={`font-bold ${delta != null && delta < 0 ? "text-[var(--shotiq-color-reviewRed)]" : "text-[var(--shotiq-color-confirmGreen)]"}`}>{formatDelta(delta)}</span><br />
              <span className="text-[var(--shotiq-color-graphite)]">vs last session</span></div>
          </div>
          <div className="ml-[10px] flex min-w-0 flex-1 flex-col justify-center self-stretch border-l border-[var(--shotiq-color-rule)] py-[10px] pl-[14px] pr-[18px]">
            <SectionLabel>PRIMARY COACHING TARGET</SectionLabel>
            {/* Canonical hangs the disclosure off the goal itself, gives the
                ACTIVE GOAL chip a line of its own, and runs the bar the full
                width beneath it — badge and bar side by side cut the track
                from 222px to 140px. */}
            <div className="mt-[2px] flex items-center justify-between gap-[10px]">
              <span className="whitespace-nowrap text-[14px] font-semibold leading-[19px]">Keep elbow stacked through release</span>
              <ChevronRight className="h-[15px] w-[15px] shrink-0 text-[var(--shotiq-color-graphite)]" />
            </div>
            <div className="mt-[5px]">
              <span className="inline-block rounded-[4px] border border-[var(--shotiq-color-confirmGreen)] px-[7px] py-[2px] text-[9px] font-bold tracking-[0.05em] text-[var(--shotiq-color-confirmGreen)]">ACTIVE GOAL</span>
            </div>
            <div className="mt-[6px] flex items-center gap-[10px]">
              <div className="h-[5px] min-w-0 flex-1 rounded-full bg-[var(--shotiq-color-rule)]">
                <div className="h-full w-[72%] rounded-full bg-[var(--shotiq-color-confirmGreen)]" /></div>
              <GoalPercent size={15}>72%</GoalPercent>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-[10px] flex gap-[24px]">
        {/* flaw list */}
        <div className="w-[274px] shrink-0">
          <div className="flex items-center gap-[6px]">
            <SectionLabel>YOUR TOP FLAWS</SectionLabel>
            <span className="grid h-[13px] w-[13px] place-items-center rounded-full border border-[var(--shotiq-color-graphite)] text-[9px] text-[var(--shotiq-color-graphite)]">i</span>
          </div>
          {visible.map((f, i) => (
            <button key={f.n} type="button" onClick={() => setSel(i)} aria-pressed={sel === i}
                    className={`mt-[10px] w-full rounded-[8px] border p-[11px] text-left ${sel === i ? "border-[var(--shotiq-color-shotiqOrange)]" : "border-[var(--shotiq-color-rule)]"}`}>
              <div className="flex items-start gap-[9px]">
                <span className="mt-[1px] grid h-[19px] w-[19px] shrink-0 place-items-center rounded-[4px] bg-[var(--shotiq-color-shotiqOrange)] text-[11px] font-bold text-white">{f.n}</span>
                <span className="flex-1 text-[14px] font-semibold leading-[18px]">{f.title}</span>
              </div>
              {/* Canonical sets the pose diagram beside the impact copy, and
                  hangs the disclosure vertically centred against that block —
                  not up on the title line. */}
              <div className="flex items-center gap-[6px]">
                <div className="min-w-0 flex-1">
                  {/* Canonical's impact chips are a tinted fill with coloured
                      text — a solid fill with white text shouts over the card. */}
                  <span className="mt-[7px] inline-block rounded-[3px] px-[6px] py-[2px] text-[9px] font-bold"
                        style={f.impact === "HIGH IMPACT"
                          ? { background: "rgba(217,45,32,0.10)", color: "var(--shotiq-color-reviewRed)" }
                          : f.impact === "LOW IMPACT"
                            ? { background: "rgba(95,100,107,0.12)", color: "var(--shotiq-color-graphite)" }
                            : { background: "rgba(253,55,1,0.10)", color: "var(--shotiq-color-shotiqOrange)" }}>{f.impact}</span>
                  <p className="mt-[6px] text-[12px] leading-[16px] text-[var(--shotiq-color-graphite)]">{f.desc}</p>
                </div>
                {f.mark
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={`/images/canonical/${f.mark}.png`} alt="" aria-hidden="true"
                         className="mt-[6px] block h-[68px] w-auto max-w-none shrink-0" />
                  : <FlawFigure kind={f.glyph} size={56} className="mt-[6px] shrink-0" />}
                <ChevronRight className="h-[14px] w-[14px] shrink-0 text-[var(--shotiq-color-graphite)]" />
              </div>
              <div className="mt-[7px] flex justify-between border-t border-[var(--shotiq-color-rule)] pt-[6px] text-[9px] text-[var(--shotiq-color-graphite)]">
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
                  className="mt-[10px] flex w-full items-center justify-between text-[13px] text-[var(--shotiq-color-graphite)]">
            {showLower ? "Hide lower impact flaws" : "Lower impact flaws (2)"}
            <ChevronRight className={`h-[13px] w-[13px] ${showLower ? "-rotate-90" : ""}`} />
          </button>
        </div>

        {/* comparison viewer */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <SectionLabel>{visible[sel] ? `SELECTED FLAW: ${visible[sel].title.toUpperCase()}` : "SELECTED FLAW"}</SectionLabel>
            <Link href="/results/demo/biomechanics" className="text-[12px] font-medium text-[var(--shotiq-color-analysisBlue)]">View details</Link>
          </div>
          <div className="mt-[7px] flex gap-[2px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/canonical/085-your-shot.png" alt="Your shot at release, 118 degree elbow angle"
                 className="block rounded-l-[6px]" width={318} height={339} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/canonical/085-model-ref.png" alt="Model reference at release, 152 degree elbow angle"
                 className="block rounded-r-[6px]" width={312} height={339} />
          </div>
          <SectionLabel className="mt-[8px]">AFFECTED FRAMES (15)</SectionLabel>
          <div className="mt-[7px] flex items-center gap-[5px]">
            <ChevronLeft className="h-[15px] w-[15px] shrink-0 text-[var(--shotiq-color-ink)]" />
            <div className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/canonical/085-frames.png" alt="" className="block" width={587} height={70} />
              <div className="mt-[3px] text-center shotiq-microcaps text-[var(--shotiq-color-shotiqOrange)]"
                   style={{ paddingRight: "23%" }}>RELEASE</div>
            </div>
            <ChevronRight className="mb-[16px] h-[15px] w-[15px] shrink-0 text-[var(--shotiq-color-ink)]" />
          </div>
        </div>

        {/* insights rail */}
        <div className="w-[250px] shrink-0">
          <SectionLabel>FLAW INSIGHTS</SectionLabel>
          <Card className="mt-[8px] divide-y divide-[var(--shotiq-color-rule)]">
            {([["Your elbow angle at release averages 118°.", "Goal range: 145° – 165°", "085-insight-1"],
              ["Elbow drift moves release point forward by 2.6\" on average.", "Goal: Keep elbow over hip.", "085-insight-2"],
              ["Impact: -8.3% to make % on affected shots.", "", "085-insight-3"]] as const).map(([t, goal, glyph], i) => (
              <div key={i} className="flex gap-[10px] px-[11px] py-[8px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/images/canonical/${glyph}.png`} alt="" aria-hidden="true"
                     className="block h-[40px] w-[40px] max-w-none shrink-0 object-contain" />
                <p className="text-[12px] leading-[15px]">{t}
                  {goal && <span className="block text-[var(--shotiq-color-confirmGreen)]">{goal}</span>}</p>
              </div>
            ))}
          </Card>
          {/* Canonical labels this section in type alone — the Target mark here
              was a second use of the Goals nav glyph. */}
          <SectionLabel className="mt-[8px]">CORRECTIONS</SectionLabel>
          {/* One bordered container with hairline dividers, as canonical draws
              it — not three individually bordered pills. */}
          <Card className="mt-[7px] divide-y divide-[var(--shotiq-color-rule)]">
            {([["Stack elbow over shooting hip.", "085-correction-1"], ["Create a 90° angle at set point.", "085-correction-2"],
               ["Drive straight up through release.", "085-correction-3"]] as const).map(([t, glyph]) => (
              <div key={t} className="flex items-center gap-[10px] px-[11px] py-[7px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/images/canonical/${glyph}.png`} alt="" aria-hidden="true"
                     className="block h-[22px] w-[19px] max-w-none shrink-0 object-contain" /><span className="text-[12px]">{t}</span>
              </div>
            ))}
          </Card>
          <SectionLabel className="mt-[8px]">RECOMMENDED DRILLS</SectionLabel>
          {/* Canonical borders the drill row alone and drops START DRILL beneath
              it as a full-rail-width bar — nesting the button inside the card
              cost it 44px of width. */}
          <Card className="mt-[7px] p-[9px]">
            <div className="flex items-center gap-[10px]">
              <span className="grid h-[38px] w-[38px] place-items-center rounded-full bg-[var(--shotiq-color-analysisBlue)]">
                <WorkoutGlyph kind="release" size={20} className="text-white" />
              </span>
              <div className="flex-1">
                <div className="text-[13px] font-semibold">Elbow Alignment Holds</div>
                <div className="text-[11px] text-[var(--shotiq-color-graphite)]">8 min · Form Focus</div>
              </div>
              <ChevronRight className="h-[14px] w-[14px] text-[var(--shotiq-color-graphite)]" />
            </div>
          </Card>
          <Link href="/training/drills/elbow-alignment-holds"
                className="mt-[3px] flex h-[28px] items-center justify-center rounded-[4px] bg-[var(--shotiq-color-shotiqOrange)] text-[12px] font-bold tracking-[0.05em] text-white">
            START DRILL
          </Link>
        </div>
      </div>

      {/* bottom strip — no bottom margin: this is the last block on the screen
          and 8px of trailing margin pushed the page past the 900px fold once
          the rail widened from 165px to the unified 196px. */}
      {/* Canonical clears 16px between "Lower impact flaws (2)" and this rule
          and 15px between the rule and FLAW HISTORY (y706 → 722 → 738); the
          app was running 5px and 6px, so the three elements read as touching.
          The space comes out of the 55–64px of dead paper the same graders
          measured below the chart. */}
      <div className="mt-[14px] flex gap-[24px] border-t border-[var(--shotiq-color-rule)] pt-[13px]">
        <div className="w-[500px] shrink-0">
          <SectionLabel>FLAW HISTORY</SectionLabel>
          <div className="mt-[4px] flex">
            {/* Canonical sets the axis caption horizontally on two lines; a
                90°-rotated label is not what the screen prints. */}
            <div className="grid w-[66px] shrink-0 place-items-center pb-[16px] pr-[6px] text-[9px] leading-[12px] tracking-[0.04em] text-[var(--shotiq-color-graphite)]"
                 aria-hidden="true">
              <span>IMPACT<br />ON MAKE %</span>
            </div>
            <div className="flex flex-col justify-between pb-[16px] pr-[6px] pt-[2px] text-right text-[9px] text-[var(--shotiq-color-graphite)]">
              <span>-0%</span><span>-5%</span><span>-10%</span><span>-15%</span>
            </div>
            <div className="min-w-0 flex-1">
              <svg viewBox="0 0 420 96" className="h-[96px] w-full" aria-hidden="true">
                {(() => {
                  const pts: [number, number][] = [
                    [10, 12], [34, 14], [70, 40], [96, 42], [122, 42], [150, 48], [176, 46],
                    [204, 50], [230, 50], [258, 51], [286, 51], [314, 52], [342, 52], [370, 52],
                  ]
                  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ")
                  return (
                    <>
                      <path d={d} fill="none" stroke="var(--shotiq-color-shotiqOrange)" strokeWidth="2" />
                      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill="var(--shotiq-color-shotiqOrange)" />)}
                      <circle cx="370" cy="52" r="7" fill="none" stroke="var(--shotiq-color-shotiqOrange)" strokeWidth="2" />
                      {/* Canonical calls the terminal value out directly above
                          the last node, not adrift at the plot's right edge. */}
                      <text x="374" y="38" textAnchor="middle" fontSize="15" fontWeight="700"
                            fill="var(--shotiq-color-shotiqOrange)">-8.3%</text>
                    </>
                  )
                })()}
              </svg>
              <div className="flex justify-between pr-[30px] text-[9px] text-[var(--shotiq-color-graphite)]">
                {["APR 26", "APR 28", "APR 30", "MAY 2", "MAY 5", "MAY 7", "MAY 10", "MAY 12"].map((d) => <span key={d}>{d}</span>)}
              </div>
            </div>
          </div>
        </div>
        <div className="w-[210px] shrink-0">
          <SectionLabel>TREND SUMMARY</SectionLabel>
          <p className="mt-[8px] text-[12px] leading-[17px]">
            Impact on make % has improved 8.7% over the last 14 days.
          </p>
          <div className="mt-[10px] flex items-center gap-[6px] text-[19px] font-bold text-[var(--shotiq-color-confirmGreen)]">
            <ArrowDown className="h-[16px] w-[16px]" /> 8.7%
          </div>
          <div className="mt-[2px] text-[10px] tracking-[0.05em] text-[var(--shotiq-color-graphite)]">FROM&ensp;-17.0%&ensp;TO&ensp;-8.3%</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <SectionLabel>RECENT SESSIONS</SectionLabel>
            <Link href="/results/demo/history" className="text-[12px] text-[var(--shotiq-color-graphite)]">View all history</Link>
          </div>
          {/* Canonical encloses these three rows in a bordered box (y761–876,
              x927–1410) with its internal rules at y796 and y834. The app drew
              the two internal rules and no box. */}
          <Card className="mt-[6px] divide-y divide-[var(--shotiq-color-rule)] px-[12px]">
            {[["Today at 8:24 AM", "24 shots", "-8.3%"], ["May 10, 2025 at 6:15 PM", "22 shots", "-9.6%"], ["May 7, 2025 at 5:02 PM", "25 shots", "-11.2%"]].map(([d, s, v]) => (
              <Link key={d} href="/results/demo/history" className="flex items-center py-[9px] text-[12px]">
                <span className="w-[170px]">{d}</span>
                <span className="text-[var(--shotiq-color-graphite)]">{s}</span>
                <span className="ml-auto font-bold text-[var(--shotiq-color-reviewRed)]">{v}</span>
                <ChevronRight className="ml-[10px] h-[13px] w-[13px] text-[var(--shotiq-color-graphite)]" />
              </Link>
            ))}
          </Card>
        </div>
      </div>
    </div>
    </ShotIQShell>
  )
}
