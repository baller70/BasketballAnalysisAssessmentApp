"use client"

/** /results/demo/flaws — canonical 085-web-flaws-history. */

import React, { useState } from "react"
import Link from "next/link"
import {
  LayoutGrid, Crosshair, Diamond, GitCompare, History as HistoryIcon, Filter,
  Target, Dumbbell, UserCog, Settings2, ChevronRight, ChevronLeft, ArrowDown,
  type LucideIcon,
} from "lucide-react"
import { ShotIQShell, SectionLabel, Card, PhaseGlyph } from "@/components/shotiq/ShotIQShell"
import { useHistory } from "@/components/shotiq/ResultsBits"

const FLAWS = [
  { n: 1, title: "Elbow not stacked at release", impact: "HIGH IMPACT", desc: "Elbow drifts forward causing inconsistent release point.", affects: "AFFECTS 62% OF SHOTS", delta: "-8.3% IMPACT" },
  { n: 2, title: "Slight wrist roll to the left", impact: "MEDIUM IMPACT", desc: "Ball rotates slightly left on release affecting accuracy.", affects: "AFFECTS 38% OF SHOTS", delta: "-4.1% IMPACT" },
  { n: 3, title: "Release point too low", impact: "MEDIUM IMPACT", desc: "Release height below optimal window reduces arc.", affects: "AFFECTS 26% OF SHOTS", delta: "-3.1% IMPACT" },
]

const LOWER_FLAWS = [
  { n: 4, title: "Narrow base on catch", impact: "LOW IMPACT", desc: "Feet slightly inside shoulder width on the catch.", affects: "AFFECTS 14% OF SHOTS", delta: "-1.2% IMPACT" },
  { n: 5, title: "Guide-hand thumb flick", impact: "LOW IMPACT", desc: "Occasional off-hand thumb movement at release.", affects: "AFFECTS 9% OF SHOTS", delta: "-0.8% IMPACT" },
]

/** 085's own grouped sidebar (left-bar active state, per the canonical). */
function FlawsSidebar() {
  const groups: { heading: string; items: { label: string; href: string; icon: LucideIcon; active?: boolean }[] }[] = [
    { heading: "ANALYZE", items: [
      { label: "Overview", href: "/results/demo", icon: LayoutGrid },
      { label: "Shots", href: "/results/demo/analysis", icon: Crosshair },
      { label: "Flaws", href: "/results/demo/flaws", icon: Diamond, active: true },
      { label: "Compare", href: "/results/demo/compare", icon: GitCompare },
    ]},
    { heading: "SESSIONS", items: [
      { label: "History", href: "/results/demo/history", icon: HistoryIcon },
      { label: "Filter", href: "/results/demo/history", icon: Filter },
    ]},
    { heading: "TOOLS", items: [
      { label: "Goals", href: "/results/demo/goals", icon: Target },
      { label: "Drills", href: "/training/drills", icon: Dumbbell },
    ]},
    { heading: "SETTINGS", items: [
      { label: "Profile", href: "/profile", icon: UserCog },
      { label: "Preferences", href: "/settings", icon: Settings2 },
    ]},
  ]
  return (
    <nav data-testid="region-sidebar" aria-label="Flaws workspace"
         className="w-[165px] shrink-0 border-r border-[var(--shotiq-color-rule)] pt-[22px]">
      {groups.map((g, gi) => (
        <div key={g.heading}>
          {gi > 0 && <div className="mx-[24px] my-[14px] border-t border-[var(--shotiq-color-rule)]" />}
          <div className="px-[24px] pb-[6px] text-[10px] font-bold tracking-[0.09em] text-[var(--shotiq-color-graphite)]">{g.heading}</div>
          {g.items.map((it) => (
            <Link key={it.label} href={it.href} aria-current={it.active ? "page" : undefined}
                  className={`relative flex h-[38px] items-center gap-[11px] px-[24px] text-[13px] ${
                    it.active ? "font-semibold text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-ink)]"}`}>
              {it.active && <span className="absolute inset-y-[3px] left-0 w-[4px] bg-[var(--shotiq-color-shotiqOrange)]" />}
              <it.icon className="h-[15px] w-[15px]" strokeWidth={1.6} />
              {it.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  )
}

export default function FlawsPage() {
  const { hasData, score } = useHistory()
  const [sel, setSel] = useState(0)
  const [showLower, setShowLower] = useState(false)
  const visible = hasData ? (showLower ? [...FLAWS, ...LOWER_FLAWS] : FLAWS) : []
  return (
    <ShotIQShell active="Analyze" sidebar={<FlawsSidebar />}>
    <div data-testid="screen-desktop-web-flaws-history" className="px-[22px] pt-[14px]">
      <div className="flex items-start justify-between gap-[12px]">
        <div className="w-[400px] shrink-0">
          <h1 className="shotiq-display text-[46px] leading-[48px]">FLAWS &amp; CORRECTIONS</h1>
          <p className="mt-[4px] whitespace-nowrap text-[14px] text-[var(--shotiq-color-graphite)]">
            Identify weaknesses. Focus your fixes. Track your progress.
          </p>
        </div>
        <Card className="flex h-[96px] items-center px-[16px]">
          <div className="w-[118px]">
            <div className="text-[10px] font-bold tracking-[0.07em] text-[var(--shotiq-color-graphite)]">FORM SCORE</div>
            <div className="shotiq-numeric text-[38px] leading-[40px] text-[var(--shotiq-color-shotiqOrange)]">{score ?? "—"}<span className="text-[22px]">.</span></div>
            <div className="h-[5px] w-[100px] rounded-full bg-[var(--shotiq-color-rule)]">
              <div className="h-full rounded-full bg-[var(--shotiq-color-shotiqOrange)]" style={{ width: `${score ?? 0}%` }} />
            </div>
          </div>
          <div className="w-[104px]">
            <div className="shotiq-display text-[15px] text-[var(--shotiq-color-analysisBlue)]">GOOD</div>
            <p className="text-[11px] leading-[14px] text-[var(--shotiq-color-graphite)]">Keep building consistency.</p>
          </div>
          {[["24", "SHOTS"], ["15", "MAKES"], ["62.5%", "MAKE %"]].map(([v, l]) => (
            <div key={l} className="border-l border-[var(--shotiq-color-rule)] px-[12px] text-center">
              <div className="shotiq-numeric text-[24px] leading-[28px]">{hasData ? v : "—"}</div>
              <div className="text-[9px] tracking-[0.06em] text-[var(--shotiq-color-graphite)]">{l}</div>
            </div>
          ))}
          <div className="border-l border-[var(--shotiq-color-rule)] pl-[12px] text-center">
            <svg width="86" height="34" viewBox="0 0 86 34" aria-hidden="true">
              <path d="M4,22 L16,26 L28,14 L40,18 L52,10 L64,16 L76,6" fill="none" stroke="var(--shotiq-color-graphite)" strokeWidth="1.5" />
              {[[4, 22], [16, 26], [28, 14], [40, 18], [52, 10], [64, 16], [76, 6]].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="2.4" fill={i >= 5 ? "var(--shotiq-color-confirmGreen)" : "var(--shotiq-color-graphite)"} />
              ))}
            </svg>
            <div className="text-[10px] leading-[12px]"><span className="font-bold text-[var(--shotiq-color-confirmGreen)]">+8.1%</span><br />
              <span className="text-[var(--shotiq-color-graphite)]">vs last session</span></div>
          </div>
        </Card>
        <div className="w-[252px] shrink-0 pt-[4px]">
          <div className="flex items-center justify-between">
            <SectionLabel>PRIMARY COACHING TARGET</SectionLabel>
            <ChevronRight className="h-[14px] w-[14px] text-[var(--shotiq-color-graphite)]" />
          </div>
          <div className="mt-[4px] text-[15px] font-semibold leading-[20px]">Keep elbow stacked through release</div>
          <span className="mt-[6px] inline-block rounded-[4px] border border-[var(--shotiq-color-confirmGreen)] px-[7px] py-[2px] text-[9px] font-bold tracking-[0.05em] text-[var(--shotiq-color-confirmGreen)]">ACTIVE GOAL</span>
          <div className="mt-[8px] flex items-center gap-[8px]">
            <div className="h-[5px] min-w-0 flex-1 rounded-full bg-[var(--shotiq-color-rule)]">
              <div className="h-full w-[72%] rounded-full bg-[var(--shotiq-color-confirmGreen)]" /></div>
            <span className="shotiq-numeric shrink-0 text-[11px]">72%</span>
          </div>
        </div>
      </div>

      <div className="mt-[14px] flex gap-[24px]">
        {/* flaw list */}
        <div className="w-[274px] shrink-0">
          <div className="flex items-center gap-[6px]">
            <SectionLabel>YOUR TOP FLAWS</SectionLabel>
            <span className="grid h-[13px] w-[13px] place-items-center rounded-full border border-[var(--shotiq-color-graphite)] text-[9px] text-[var(--shotiq-color-graphite)]">i</span>
          </div>
          {visible.map((f, i) => (
            <button key={f.n} type="button" onClick={() => setSel(i)} aria-pressed={sel === i}
                    className={`mt-[10px] w-full rounded-[8px] border p-[13px] text-left ${sel === i ? "border-[var(--shotiq-color-shotiqOrange)]" : "border-[var(--shotiq-color-rule)]"}`}>
              <div className="flex items-start gap-[9px]">
                <span className="mt-[2px] grid h-[19px] w-[19px] shrink-0 place-items-center rounded-[4px] bg-[var(--shotiq-color-shotiqOrange)] text-[11px] font-bold text-white">{f.n}</span>
                <span className="flex-1 text-[14px] font-semibold leading-[18px]">{f.title}</span>
                <ChevronRight className="mt-[2px] h-[13px] w-[13px] shrink-0 text-[var(--shotiq-color-graphite)]" />
              </div>
              <span className={`mt-[7px] inline-block rounded-[3px] px-[6px] py-[2px] text-[9px] font-bold text-white ${f.impact === "HIGH IMPACT" ? "bg-[var(--shotiq-color-reviewRed)]" : f.impact === "LOW IMPACT" ? "bg-[var(--shotiq-color-graphite)]" : "bg-[var(--shotiq-color-shotiqOrange)]"}`}>{f.impact}</span>
              <p className="mt-[6px] pr-[26px] text-[12px] leading-[16px] text-[var(--shotiq-color-graphite)]">{f.desc}</p>
              <div className="mt-[9px] flex justify-between border-t border-[var(--shotiq-color-rule)] pt-[7px] text-[9px] tracking-[0.04em] text-[var(--shotiq-color-graphite)]">
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
          <SectionLabel className="mt-[12px]">AFFECTED FRAMES (15)</SectionLabel>
          <div className="mt-[7px] flex items-center gap-[5px]">
            <ChevronLeft className="h-[15px] w-[15px] shrink-0 text-[var(--shotiq-color-ink)]" />
            <div className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/canonical/085-frames.png" alt="" className="block" width={587} height={70} />
              <div className="mt-[3px] text-center text-[10px] font-bold tracking-[0.08em] text-[var(--shotiq-color-shotiqOrange)]"
                   style={{ paddingRight: "23%" }}>RELEASE</div>
            </div>
            <ChevronRight className="mb-[16px] h-[15px] w-[15px] shrink-0 text-[var(--shotiq-color-ink)]" />
          </div>
        </div>

        {/* insights rail */}
        <div className="w-[250px] shrink-0">
          <SectionLabel>FLAW INSIGHTS</SectionLabel>
          <Card className="mt-[8px] divide-y divide-[var(--shotiq-color-rule)]">
            {[["Your elbow angle at release averages 118°.", "Goal range: 145° – 165°"],
              ["Elbow drift moves release point forward by 2.6\" on average.", "Goal: Keep elbow over hip."],
              ["Impact: -8.3% to make % on affected shots.", ""]].map(([t, goal], i) => (
              <div key={i} className="flex gap-[10px] p-[11px]">
                <PhaseGlyph size={26} />
                <p className="text-[12px] leading-[16px]">{t}
                  {goal && <span className="block text-[var(--shotiq-color-confirmGreen)]">{goal}</span>}</p>
              </div>
            ))}
          </Card>
          <div className="mt-[12px] flex items-center gap-[6px]">
            <Target className="h-[13px] w-[13px]" /><SectionLabel>CORRECTIONS</SectionLabel>
          </div>
          <div className="mt-[7px] space-y-[6px]">
            {["Stack elbow over shooting hip.", "Create a 90° angle at set point.", "Drive straight up through release."].map((t) => (
              <div key={t} className="flex items-center gap-[10px] rounded-[6px] bg-[var(--shotiq-color-warmCanvas)] px-[10px] py-[9px]">
                <PhaseGlyph size={20} /><span className="text-[12px]">{t}</span>
              </div>
            ))}
          </div>
          <SectionLabel className="mt-[12px]">RECOMMENDED DRILLS</SectionLabel>
          <Card className="mt-[7px] p-[12px]">
            <div className="flex items-center gap-[10px]">
              <span className="grid h-[38px] w-[38px] place-items-center rounded-full bg-[var(--shotiq-color-analysisBlue)]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" aria-hidden="true">
                  <circle cx="7" cy="15" r="2.4" /><circle cx="15" cy="7" r="2.4" /><circle cx="17" cy="16" r="1.7" />
                  <path d="M8.8 13.4 L13.2 8.8 M16.2 8.8 L16.7 14.3" />
                </svg>
              </span>
              <div className="flex-1">
                <div className="text-[13px] font-semibold">Elbow Alignment Holds</div>
                <div className="text-[11px] text-[var(--shotiq-color-graphite)]">8 min · Form Focus</div>
              </div>
              <ChevronRight className="h-[14px] w-[14px] text-[var(--shotiq-color-graphite)]" />
            </div>
            <Link href="/training/drills/elbow-alignment-holds"
                  className="mt-[10px] flex h-[36px] items-center justify-center rounded-[4px] bg-[var(--shotiq-color-shotiqOrange)] text-[12px] font-bold tracking-[0.05em] text-white">
              START DRILL
            </Link>
          </Card>
        </div>
      </div>

      {/* bottom strip */}
      <div className="mt-[14px] mb-[16px] flex gap-[24px] border-t border-[var(--shotiq-color-rule)] pt-[12px]">
        <div className="w-[500px] shrink-0">
          <SectionLabel>FLAW HISTORY</SectionLabel>
          <div className="mt-[4px] flex">
            <div className="grid place-items-center pb-[16px] pr-[2px] text-[8px] tracking-[0.05em] text-[var(--shotiq-color-graphite)] [writing-mode:vertical-rl]"
                 aria-hidden="true">
              <span className="rotate-180">IMPACT ON MAKE %</span>
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
                    </>
                  )
                })()}
              </svg>
              <div className="flex justify-between pr-[30px] text-[9px] text-[var(--shotiq-color-graphite)]">
                {["APR 26", "APR 28", "APR 30", "MAY 2", "MAY 5", "MAY 7", "MAY 10", "MAY 12"].map((d) => <span key={d}>{d}</span>)}
              </div>
            </div>
            <div className="pl-[6px] pt-[36px] text-[14px] font-bold text-[var(--shotiq-color-shotiqOrange)]">-8.3%</div>
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
            <Link href="/results/demo/history" className="text-[12px] text-[var(--shotiq-color-analysisBlue)]">View all history</Link>
          </div>
          <div className="mt-[2px] divide-y divide-[var(--shotiq-color-rule)]">
            {[["Today at 8:24 AM", "24 shots", "-8.3%"], ["May 10, 2025 at 6:15 PM", "22 shots", "-9.6%"], ["May 7, 2025 at 5:02 PM", "25 shots", "-11.2%"]].map(([d, s, v]) => (
              <Link key={d} href="/results/demo/history" className="flex items-center py-[10px] text-[12px]">
                <span className="w-[170px]">{d}</span>
                <span className="text-[var(--shotiq-color-graphite)]">{s}</span>
                <span className="ml-auto font-bold text-[var(--shotiq-color-reviewRed)]">{v}</span>
                <ChevronRight className="ml-[10px] h-[13px] w-[13px] text-[var(--shotiq-color-graphite)]" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
    </ShotIQShell>
  )
}
