"use client"

/** /points — canonical 095-web-achievements-points, using the points context. */

import React, { useState } from "react"
import { ChevronDown, Check, Lock } from "lucide-react"
import { SectionLabel, Card, TrendLine, Stat, WideSidebar, Ring } from "@/components/shotiq/ShotIQShell"
import { usePoints } from "@/lib/points/pointsContext"
import {
  LayoutGrid, Crosshair, Dumbbell, Target, Trophy, Coins, History, GitCompare, Settings2,
} from "lucide-react"

const BADGES: [string, string, boolean, string][] = [
  ["STACKED RELEASE", "Keep elbow stacked through release.", true, ""],
  ["CLEAN ARC", "Maintain a smooth ball path.", true, ""],
  ["BALANCED BASE", "Stable lower body throughout.", true, ""],
  ["HIGH ELBOW SET", "Set elbow above shoulder line.", true, ""],
  ["QUICK RELEASE", "Release the ball in 0.6s or less.", false, "7,500 XP"],
  ["DEEP RANGE", "Make 10 shots from 22+ feet.", false, "10,000 XP"],
  ["STREAK BUILDER", "Maintain a 10-day active streak.", false, "15,000 XP"],
  ["PERFECT FORM", "Reach form score 90+.", false, "20,000 XP"],
  ["VOLUME SHOOTER", "Record 500 shots analyzed.", false, "25,000 XP"],
  ["CLUTCH PERFORMER", "Make 5 game-winning shots.", false, "30,000 XP"],
]

function Hex({ earned, size = 84 }: { earned: boolean; size?: number }) {
  const c = earned ? "var(--shotiq-color-ink)" : "var(--shotiq-color-muted)"
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 52 58" aria-hidden="true">
      <polygon points="26,2 49,15 49,43 26,56 3,43 3,15" fill="none" stroke={c} strokeWidth="2" />
      <g stroke={earned ? "var(--shotiq-color-shotiqOrange)" : c} strokeWidth="1.6" fill="none">
        <circle cx="24" cy="18" r="3" /><path d="M24 21 L22 30 L18 38 M22 30 L27 36 M24 22 L31 19" />
        <circle cx="33" cy="16" r="2.4" />
      </g>
    </svg>
  )
}

export default function AchievementsPointsPage() {
  const points = usePoints()
  const totalPoints = points.getTotalPoints()
  const [tab, setTab] = useState("BADGES")
  const earned = BADGES.filter(([, , e]) => e).length
  const [sel, setSel] = useState(0)

  return (
    <div data-testid="screen-desktop-web-achievements-points" className="flex">
      <WideSidebar sections={[
        { heading: "PROGRESS", items: [
          { label: "Overview", href: "/dashboard", icon: LayoutGrid },
          { label: "Analysis", href: "/results/demo/analysis", icon: Crosshair },
          { label: "Training", href: "/results/demo/training", icon: Dumbbell },
          { label: "Goals", href: "/results/demo/goals", icon: Target },
          { label: "Achievements", href: "/points", icon: Trophy, active: true },
          { label: "Points", href: "/points", icon: Coins },
          { label: "History", href: "/results/demo/history", icon: History },
          { label: "Compare", href: "/results/demo/compare", icon: GitCompare },
          { label: "Settings", href: "/settings", icon: Settings2 },
        ]},
      ]} />
      <div className="min-w-0 flex-1 px-[24px] py-[18px]">
        <div className="flex items-start justify-between gap-[16px]">
          <div>
            <h1 className="shotiq-display text-[46px] leading-[48px]">ACHIEVEMENTS &amp; POINTS</h1>
            <p className="mt-[4px] text-[13px] text-[var(--shotiq-color-graphite)]">Track your progress. Earn badges. Build your edge.</p>
          </div>
          <div className="flex gap-[12px]">
            <Card className="w-[190px] px-[14px] py-[10px]">
              <div className="text-[9px] font-bold tracking-[0.06em] text-[var(--shotiq-color-graphite)]">TOTAL XP</div>
              <div className="shotiq-numeric text-[26px] leading-[30px]">{totalPoints.toLocaleString()} <span className="text-[12px]">XP</span></div>
              <div className="mt-[4px] h-[5px] rounded-full bg-[var(--shotiq-color-rule)]">
                <div className="h-full w-[80%] rounded-full bg-[var(--shotiq-color-shotiqOrange)]" /></div>
              <div className="mt-[3px] text-[9px] text-[var(--shotiq-color-graphite)]">Next tier at 3,500 XP</div>
            </Card>
            <Card className="w-[180px] px-[14px] py-[10px]">
              <div className="text-[9px] font-bold tracking-[0.06em] text-[var(--shotiq-color-graphite)]">CURRENT TIER</div>
              <div className="text-[19px] font-bold text-[var(--shotiq-color-analysisBlue)]">LEVEL 7</div>
              <div className="text-[10px] text-[var(--shotiq-color-graphite)]">Technician</div>
              <div className="mt-[4px] h-[5px] rounded-full bg-[var(--shotiq-color-rule)]">
                <div className="h-full w-[65%] rounded-full bg-[var(--shotiq-color-analysisBlue)]" /></div>
            </Card>
            <Card className="w-[180px] px-[14px] py-[10px]">
              <div className="text-[9px] font-bold tracking-[0.06em] text-[var(--shotiq-color-graphite)]">BADGES EARNED</div>
              <div className="shotiq-numeric text-[24px] leading-[28px]">{earned} / {BADGES.length} <span className="text-[12px]">{Math.round(100 * earned / BADGES.length)}%</span></div>
              <div className="mt-[4px] h-[5px] rounded-full bg-[var(--shotiq-color-rule)]">
                <div className="h-full rounded-full bg-[var(--shotiq-color-confirmGreen)]" style={{ width: `${100 * earned / BADGES.length}%` }} /></div>
            </Card>
            <Card className="w-[160px] px-[14px] py-[10px]">
              <div className="text-[9px] font-bold tracking-[0.06em] text-[var(--shotiq-color-graphite)]">LONGEST STREAK</div>
              <div className="flex items-center justify-between">
                <div><span className="shotiq-numeric text-[24px]">6</span><span className="ml-[4px] text-[10px] text-[var(--shotiq-color-graphite)]">Days</span></div>
                <TrendLine points={[2, 3, 2.4, 4, 3.2]} width={54} height={30} stroke="var(--shotiq-color-ink)" dotFill="var(--shotiq-color-ink)" />
              </div>
            </Card>
          </div>
        </div>

        {/* tabs */}
        <nav className="mt-[12px] flex gap-[28px] border-b border-[var(--shotiq-color-rule)]">
          {["BADGES", "CHALLENGES", "POINTS HISTORY"].map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
                    className={`relative pb-[10px] text-[13px] font-bold tracking-[0.05em] ${tab === t ? "text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-graphite)]"}`}>
              {t}
              {tab === t && <span className="absolute inset-x-0 bottom-0 h-[3px] bg-[var(--shotiq-color-shotiqOrange)]" />}
            </button>
          ))}
        </nav>

        <div className="mt-[12px] flex gap-[18px]">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-[10px]">
              {["All tiers", "All categories"].map((t) => (
                <button key={t} type="button" className="flex h-[36px] items-center gap-[6px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[12px] text-[12px]">
                  {t} <ChevronDown className="h-[11px] w-[11px]" />
                </button>
              ))}
              <span className="flex items-center gap-[6px] text-[12px]">
                <span className="h-[16px] w-[30px] rounded-full bg-[var(--shotiq-color-confirmGreen)] p-[2px]"><span className="block h-[12px] w-[12px] translate-x-[14px] rounded-full bg-white" /></span>
                Show unlocked only
              </span>
              <button type="button" className="ml-auto flex h-[36px] items-center gap-[6px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[12px] text-[12px]">
                Newest first <ChevronDown className="h-[11px] w-[11px]" />
              </button>
            </div>
            <SectionLabel className="mt-[12px]">{`ALL BADGES (${earned} / ${BADGES.length})`}</SectionLabel>
            <div className="mt-[8px] grid grid-cols-5 gap-[12px]">
              {BADGES.map(([t, d, e, xp], i) => (
                <button key={t} type="button" onClick={() => setSel(i)}
                        className={`relative rounded-[8px] border p-[12px] text-center ${sel === i ? "border-2 border-[var(--shotiq-color-shotiqOrange)]" : "border-[var(--shotiq-color-rule)]"}`}>
                  {e && <span className="absolute right-[8px] top-[8px] grid h-[16px] w-[16px] place-items-center rounded-full bg-[var(--shotiq-color-confirmGreen)]"><Check className="h-[10px] w-[10px] text-white" /></span>}
                  <div className={e ? "" : "opacity-45"}><Hex earned={e} /></div>
                  <div className="mt-[4px] text-[11px] font-bold tracking-[0.03em]">{t}</div>
                  <div className="mt-[2px] text-[10px] leading-[13px] text-[var(--shotiq-color-graphite)]">{d}</div>
                  <div className={`mt-[6px] text-[10px] font-bold ${e ? "text-[var(--shotiq-color-confirmGreen)]" : "text-[var(--shotiq-color-graphite)]"}`}>
                    {e ? "EARNED" : <span className="flex items-center justify-center gap-[4px]"><Lock className="h-[9px] w-[9px]" /> {xp}</span>}
                  </div>
                </button>
              ))}
            </div>
            <button type="button" className="mx-auto mt-[14px] flex h-[40px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[18px] text-[13px]">
              Load more badges <ChevronDown className="h-[12px] w-[12px]" />
            </button>
          </div>

          {/* badge details rail */}
          <aside className="w-[330px] shrink-0">
            <SectionLabel>BADGE DETAILS</SectionLabel>
            <div className="mt-[8px] flex items-center gap-[14px]">
              <Hex earned={BADGES[sel][2]} size={70} />
              <div>
                <div className="text-[17px] font-bold tracking-[0.02em]">{BADGES[sel][0]}</div>
                <div className="text-[12px] text-[var(--shotiq-color-analysisBlue)]">Technique</div>
                {BADGES[sel][2] && <span className="mt-[4px] inline-block rounded-[4px] border border-[var(--shotiq-color-confirmGreen)] px-[8px] py-[2px] text-[10px] font-bold text-[var(--shotiq-color-confirmGreen)]">EARNED</span>}
              </div>
            </div>
            <p className="mt-[8px] text-[12px] leading-[17px] text-[var(--shotiq-color-graphite)]">{BADGES[sel][1]}</p>
            <SectionLabel className="mt-[12px] border-t border-[var(--shotiq-color-rule)] pt-[10px]">HOW TO EARN</SectionLabel>
            <p className="mt-[4px] text-[12px] text-[var(--shotiq-color-graphite)]">Record 5 sessions with elbow verticality ≥ 85%.</p>
            <div className="mt-[10px] flex items-center justify-between">
              <SectionLabel>YOUR PROGRESS</SectionLabel>
              <span className="text-[11px] font-bold text-[var(--shotiq-color-confirmGreen)]">{BADGES[sel][2] ? "Completed Apr 28, 2025" : "In progress"}</span>
            </div>
            <div className="mt-[6px] flex items-center gap-[10px]">
              <div className="h-[6px] flex-1 rounded-full bg-[var(--shotiq-color-rule)]">
                <div className="h-full rounded-full bg-[var(--shotiq-color-confirmGreen)]" style={{ width: BADGES[sel][2] ? "100%" : "40%" }} />
              </div>
              <span className="text-[12px]">{BADGES[sel][2] ? "5 / 5" : "2 / 5"}</span>
            </div>
            <Card className="mt-[12px] p-[12px]">
              <div className="text-[10px] font-bold tracking-[0.05em] text-[var(--shotiq-color-graphite)]">LATEST MATCH</div>
              <div className="text-[12px]">May 12, 2025 at 8:24 AM</div>
              <div className="mt-[8px] flex divide-x divide-[var(--shotiq-color-rule)]">
                <div className="pr-[14px]"><Stat value="24" label="SHOTS" valueClass="text-[20px] leading-[24px]" /></div>
                <div className="px-[14px]"><Stat value="15" label="MAKES" valueClass="text-[20px] leading-[24px]" /></div>
                <div className="px-[14px]"><Stat value="62.5%" label="MAKE %" valueClass="text-[20px] leading-[24px]" /></div>
                <div className="pl-[14px]"><div className="shotiq-numeric text-[20px] leading-[24px] text-[var(--shotiq-color-analysisBlue)]">82</div>
                  <div className="text-[9px] tracking-[0.05em] text-[var(--shotiq-color-graphite)]">FORM SCORE</div></div>
              </div>
            </Card>
            <SectionLabel className="mt-[12px]">REWARDS</SectionLabel>
            <Card className="mt-[6px] flex items-center gap-[14px] p-[12px]">
              <div className="flex items-center gap-[8px]">
                <Hex earned size={34} />
                <div><div className="text-[13px] font-bold">+250 XP</div><div className="text-[10px] text-[var(--shotiq-color-graphite)]">Points earned</div></div>
              </div>
              <div className="flex items-center gap-[8px] border-l border-[var(--shotiq-color-rule)] pl-[14px]">
                <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-[var(--shotiq-color-analysisBlue)] text-white">◎</span>
                <div><div className="text-[13px] font-semibold">Stacked Release Frame</div><div className="text-[10px] text-[var(--shotiq-color-graphite)]">Profile customization</div></div>
              </div>
            </Card>
            <button type="button" className="mt-[12px] h-[46px] w-full rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] text-[14px] font-medium text-white">
              View achievement
            </button>
          </aside>
        </div>
      </div>
    </div>
  )
}
