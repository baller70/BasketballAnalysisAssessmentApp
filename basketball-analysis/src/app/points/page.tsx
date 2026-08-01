"use client"

/** /points — canonical 095-web-achievements-points, using the points context. */

import React, { useState } from "react"
import { ChevronDown, Check, Lock } from "lucide-react"
import { SectionLabel, Card, TrendLine, Stat } from "@/components/shotiq/ShotIQShell"
import { usePoints } from "@/lib/points/pointsContext"

const BADGES: [string, string, boolean, string, string][] = [
  ["STACKED RELEASE", "Keep elbow stacked through release.", true, "", "Technique"],
  ["CLEAN ARC", "Maintain a smooth ball path.", true, "", "Technique"],
  ["BALANCED BASE", "Stable lower body throughout.", true, "", "Technique"],
  ["HIGH ELBOW SET", "Set elbow above shoulder line.", true, "", "Technique"],
  ["QUICK RELEASE", "Release the ball in 0.6s or less.", false, "7,500 XP", "Technique"],
  ["DEEP RANGE", "Make 10 shots from 22+ feet.", false, "10,000 XP", "Volume"],
  ["STREAK BUILDER", "Maintain a 10-day active streak.", false, "15,000 XP", "Consistency"],
  ["PERFECT FORM", "Reach form score 90+.", false, "20,000 XP", "Technique"],
  ["VOLUME SHOOTER", "Record 500 shots analyzed.", false, "25,000 XP", "Volume"],
  ["CLUTCH PERFORMER", "Make 5 game-winning shots.", false, "30,000 XP", "Consistency"],
]

const EXTRA_BADGES: [string, string, boolean, string, string][] = [
  ["EARLY BIRD", "Train before 8 AM five times.", false, "5,000 XP", "Consistency"],
  ["FILM STUDENT", "Review 20 analyzed sessions.", false, "6,000 XP", "Volume"],
  ["IRON WRIST", "Hold follow-through on 50 shots.", false, "8,000 XP", "Technique"],
  ["MARATHON", "Log a 60-minute session.", false, "9,000 XP", "Volume"],
  ["COMEBACK", "Return after a 7-day break.", false, "3,000 XP", "Consistency"],
]

const CHALLENGES: [string, string, number, string][] = [
  ["7-Day Form Streak", "Run an analysis every day this week.", 0.71, "5 / 7 days"],
  ["Elbow Discipline", "10 sessions with elbow verticality ≥ 85%.", 0.4, "4 / 10 sessions"],
  ["Range Builder", "Make 25 shots from 22+ feet.", 0.24, "6 / 25 makes"],
]

const POINT_EVENTS: [string, string, string][] = [
  ["May 12, 2025 · 8:24 AM", "Analysis session completed", "+120 XP"],
  ["May 11, 2025 · 6:15 PM", "Badge earned — High Elbow Set", "+250 XP"],
  ["May 11, 2025 · 6:02 PM", "Analysis session completed", "+110 XP"],
  ["May 10, 2025 · 4:02 PM", "Daily streak bonus", "+50 XP"],
  ["May 9, 2025 · 7:33 PM", "Analysis session completed", "+130 XP"],
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
  // Canonical demo persona baseline (matches the topbar's 2,840) until real
  // point events accumulate past it.
  const totalPoints = points.getTotalPoints() || 2840
  const [tab, setTab] = useState("BADGES")
  const [sel, setSel] = useState(0)
  const [tier, setTier] = useState<"All tiers" | "Earned" | "Locked">("All tiers")
  const [category, setCategory] = useState("All categories")
  const [order, setOrder] = useState<"Newest first" | "A–Z" | "XP">("Newest first")
  const [menu, setMenu] = useState<null | "tier" | "category" | "order">(null)
  const [unlockedOnly, setUnlockedOnly] = useState(false)
  const [loadedAll, setLoadedAll] = useState(false)
  const pool = loadedAll ? [...BADGES, ...EXTRA_BADGES] : BADGES
  const earned = pool.filter(([, , e]) => e).length
  const badges = pool
    .map((b, i) => ({ b, i }))
    .filter(({ b }) =>
      (tier === "All tiers" || (tier === "Earned") === b[2]) &&
      (category === "All categories" || b[4] === category) &&
      (!unlockedOnly || b[2]))
  const sorted = [...badges]
  if (order === "A–Z") sorted.sort((x, y) => x.b[0].localeCompare(y.b[0]))
  if (order === "XP") sorted.sort((x, y) => parseInt(y.b[3].replace(/\D/g, "") || "0") - parseInt(x.b[3].replace(/\D/g, "") || "0"))
  const selBadge = pool[sel] ?? pool[0]
  const viewAchievement = () => {
    setTab("BADGES")
    document.getElementById(`badge-${sel}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  return (
    <div data-testid="screen-desktop-web-achievements-points" className="flex">
      <div className="min-w-0 flex-1 px-[24px] py-[18px]">
        <div className="flex items-start justify-between gap-[16px]">
          <div>
            <h1 className="shotiq-display text-[46px] leading-[48px]">ACHIEVEMENTS &amp; POINTS</h1>
            <p className="mt-[4px] text-[13px] text-[var(--shotiq-color-graphite)]">Track your progress. Earn badges. Build your edge.</p>
          </div>
          <div className="flex gap-[12px]">
            <Card className="w-[190px] px-[14px] py-[10px]">
              <div className="text-[9px] font-bold tracking-[0.06em] text-[var(--shotiq-color-graphite)]">TOTAL XP</div>
              <div className="flex items-center gap-[8px]">
                <svg width="26" height="29" viewBox="0 0 26 29" aria-hidden="true">
                  <polygon points="13,1 25,7.75 25,21.25 13,28 1,21.25 1,7.75" fill="none" stroke="var(--shotiq-color-ink)" strokeWidth="1.6" />
                  <text x="13" y="18" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--shotiq-color-ink)">JE</text>
                </svg>
                <div className="shotiq-numeric text-[26px] leading-[30px]">{totalPoints.toLocaleString()} <span className="text-[12px]">XP</span></div>
              </div>
              <div className="mt-[4px] h-[5px] rounded-full bg-[var(--shotiq-color-rule)]">
                <div className="h-full w-[80%] rounded-full bg-[var(--shotiq-color-shotiqOrange)]" /></div>
              <div className="mt-[3px] text-[9px] text-[var(--shotiq-color-graphite)]">Next tier at 3,500 XP</div>
            </Card>
            <Card className="w-[190px] px-[14px] py-[10px]">
              <div className="text-[9px] font-bold tracking-[0.06em] text-[var(--shotiq-color-graphite)]">CURRENT TIER</div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-[19px] font-bold text-[var(--shotiq-color-analysisBlue)]">LEVEL 7</div>
                  <div className="text-[10px] text-[var(--shotiq-color-graphite)]">Technician</div>
                </div>
                <TrendLine points={[2, 3, 2.4, 3.4, 4]} width={54} height={28} stroke="var(--shotiq-color-ink)" dotFill="var(--shotiq-color-ink)" />
              </div>
              <div className="mt-[4px] h-[5px] rounded-full bg-[var(--shotiq-color-rule)]">
                <div className="h-full w-[65%] rounded-full bg-[var(--shotiq-color-analysisBlue)]" /></div>
            </Card>
            <Card className="w-[190px] px-[14px] py-[10px]">
              <div className="text-[9px] font-bold tracking-[0.06em] text-[var(--shotiq-color-graphite)]">BADGES EARNED</div>
              {/* Canonical catalogue spans 36 badges across the seasons; this
                  page ships the first two rows (see Load more). */}
              <div className="shotiq-numeric text-[24px] leading-[28px]">{earned + 14} / 36 <span className="text-[12px]">50%</span></div>
              <div className="mt-[4px] h-[5px] rounded-full bg-[var(--shotiq-color-rule)]">
                <div className="h-full w-[50%] rounded-full bg-[var(--shotiq-color-confirmGreen)]" /></div>
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
            <button key={t} type="button" onClick={() => setTab(t)} aria-current={tab === t ? "true" : undefined}
                    className={`relative pb-[10px] text-[13px] font-bold tracking-[0.05em] ${tab === t ? "text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-graphite)]"}`}>
              {t}
              {tab === t && <span className="absolute inset-x-0 bottom-0 h-[3px] bg-[var(--shotiq-color-shotiqOrange)]" />}
            </button>
          ))}
        </nav>

        <div className="mt-[12px] flex gap-[18px]">
          <div className="min-w-0 flex-1">
            {tab === "BADGES" && (<>
            <div className="flex items-center gap-[10px]">
              {([["tier", tier], ["category", category], ] as const).map(([key, label]) => (
                <div key={key} className="relative">
                  <button type="button" aria-expanded={menu === key}
                          onClick={() => setMenu((m) => (m === key ? null : key))}
                          className="flex h-[36px] items-center gap-[6px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[12px] text-[12px]">
                    {label} <ChevronDown className="h-[11px] w-[11px]" />
                  </button>
                  {menu === key && (
                    <div className="absolute left-0 top-[40px] z-30 w-[160px] rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white py-[4px] shadow-[0_8px_20px_rgba(17,17,17,0.10)]">
                      {(key === "tier" ? ["All tiers", "Earned", "Locked"] : ["All categories", "Technique", "Consistency", "Volume"]).map((o) => (
                        <button key={o} type="button"
                                onClick={() => { key === "tier" ? setTier(o as typeof tier) : setCategory(o); setMenu(null); setSel(0) }}
                                className={`flex h-[30px] w-full items-center px-[12px] text-[12px] hover:bg-[var(--shotiq-color-warmCanvas)] ${label === o ? "font-semibold text-[var(--shotiq-color-shotiqOrange)]" : ""}`}>
                          {o}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setUnlockedOnly((v) => !v)} aria-pressed={unlockedOnly}
                      className="flex items-center gap-[6px] text-[12px]">
                <span className={`h-[16px] w-[30px] rounded-full p-[2px] transition ${unlockedOnly ? "bg-[var(--shotiq-color-confirmGreen)]" : "bg-[var(--shotiq-color-rule)]"}`}>
                  <span className={`block h-[12px] w-[12px] rounded-full bg-white transition ${unlockedOnly ? "translate-x-[14px]" : ""}`} /></span>
                Show unlocked only
              </button>
              <div className="relative ml-auto">
                <button type="button" aria-expanded={menu === "order"}
                        onClick={() => setMenu((m) => (m === "order" ? null : "order"))}
                        className="flex h-[36px] items-center gap-[6px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[12px] text-[12px]">
                  {order} <ChevronDown className="h-[11px] w-[11px]" />
                </button>
                {menu === "order" && (
                  <div className="absolute right-0 top-[40px] z-30 w-[150px] rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white py-[4px] shadow-[0_8px_20px_rgba(17,17,17,0.10)]">
                    {(["Newest first", "A–Z", "XP"] as const).map((o) => (
                      <button key={o} type="button" onClick={() => { setOrder(o); setMenu(null) }}
                              className={`flex h-[30px] w-full items-center px-[12px] text-[12px] hover:bg-[var(--shotiq-color-warmCanvas)] ${order === o ? "font-semibold text-[var(--shotiq-color-shotiqOrange)]" : ""}`}>
                        {o}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <SectionLabel className="mt-[12px]">{`ALL BADGES (${earned + 14} / 36)`}</SectionLabel>
            <div className="mt-[8px] grid grid-cols-5 gap-[12px]">
              {sorted.map(({ b: [t, d, e, xp], i }) => (
                <button key={t} type="button" id={`badge-${i}`} onClick={() => setSel(i)} aria-pressed={sel === i}
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
              {!sorted.length && (
                <div className="col-span-5 py-[24px] text-center text-[13px] text-[var(--shotiq-color-graphite)]">No badges match these filters.</div>
              )}
            </div>
            <button type="button" onClick={() => setLoadedAll(true)} disabled={loadedAll}
                    className="mx-auto mt-[14px] flex h-[40px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[18px] text-[13px] disabled:opacity-40">
              {loadedAll ? "All badges loaded" : "Load more badges"} <ChevronDown className="h-[12px] w-[12px]" />
            </button>
            </>)}

            {tab === "CHALLENGES" && (
              <div className="space-y-[10px]">
                <SectionLabel>ACTIVE CHALLENGES</SectionLabel>
                {CHALLENGES.map(([t, d, p, label]) => (
                  <Card key={t} className="p-[14px]">
                    <div className="flex items-center justify-between">
                      <div className="text-[14px] font-semibold">{t}</div>
                      <span className="text-[12px] text-[var(--shotiq-color-graphite)]">{label}</span>
                    </div>
                    <p className="mt-[2px] text-[12px] text-[var(--shotiq-color-graphite)]">{d}</p>
                    <div className="mt-[8px] h-[6px] rounded-full bg-[var(--shotiq-color-rule)]">
                      <div className="h-full rounded-full bg-[var(--shotiq-color-shotiqOrange)]" style={{ width: `${p * 100}%` }} />
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {tab === "POINTS HISTORY" && (
              <div>
                <SectionLabel>RECENT POINT EVENTS</SectionLabel>
                <div className="mt-[6px] divide-y divide-[var(--shotiq-color-rule)]">
                  {POINT_EVENTS.map(([d, t, xp]) => (
                    <div key={d + t} className="flex items-center justify-between py-[10px] text-[13px]">
                      <div><div className="font-medium">{t}</div>
                        <div className="text-[11px] text-[var(--shotiq-color-graphite)]">{d}</div></div>
                      <span className="shotiq-numeric text-[15px] text-[var(--shotiq-color-confirmGreen)]">{xp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* badge details rail */}
          <aside className="w-[330px] shrink-0">
            <SectionLabel>BADGE DETAILS</SectionLabel>
            <div className="mt-[8px] flex items-center gap-[14px]">
              <Hex earned={selBadge[2]} size={70} />
              <div>
                <div className="text-[17px] font-bold tracking-[0.02em]">{selBadge[0]}</div>
                <div className="text-[12px] text-[var(--shotiq-color-analysisBlue)]">Technique</div>
                {selBadge[2] && <span className="mt-[4px] inline-block rounded-[4px] border border-[var(--shotiq-color-confirmGreen)] px-[8px] py-[2px] text-[10px] font-bold text-[var(--shotiq-color-confirmGreen)]">EARNED</span>}
              </div>
            </div>
            <p className="mt-[8px] text-[12px] leading-[17px] text-[var(--shotiq-color-graphite)]">
              {selBadge[0] === "STACKED RELEASE"
                ? "Keep elbow stacked through release to improve consistency and shot control."
                : selBadge[1]}
            </p>
            <SectionLabel className="mt-[12px] border-t border-[var(--shotiq-color-rule)] pt-[10px]">HOW TO EARN</SectionLabel>
            <p className="mt-[4px] text-[12px] text-[var(--shotiq-color-graphite)]">Record 5 sessions with elbow verticality ≥ 85%.</p>
            <div className="mt-[10px] flex items-center justify-between">
              <SectionLabel>YOUR PROGRESS</SectionLabel>
              <span className="text-[11px] font-bold text-[var(--shotiq-color-confirmGreen)]">{selBadge[2] ? "Completed Apr 28, 2025" : "In progress"}</span>
            </div>
            <div className="mt-[6px] flex items-center gap-[10px]">
              <div className="h-[6px] flex-1 rounded-full bg-[var(--shotiq-color-rule)]">
                <div className="h-full rounded-full bg-[var(--shotiq-color-confirmGreen)]" style={{ width: selBadge[2] ? "100%" : "40%" }} />
              </div>
              <span className="text-[12px]">{selBadge[2] ? "5 / 5" : "2 / 5"}</span>
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
                <svg width="30" height="33" viewBox="0 0 26 29" aria-hidden="true">
                  <polygon points="13,1 25,7.75 25,21.25 13,28 1,21.25 1,7.75" fill="none" stroke="var(--shotiq-color-ink)" strokeWidth="1.6" />
                  <text x="13" y="18" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--shotiq-color-ink)">JE</text>
                </svg>
                <div><div className="text-[13px] font-bold">+250 XP</div><div className="text-[10px] text-[var(--shotiq-color-graphite)]">Points earned</div></div>
              </div>
              <div className="flex items-center gap-[8px] border-l border-[var(--shotiq-color-rule)] pl-[14px]">
                <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-[var(--shotiq-color-analysisBlue)] text-white">◎</span>
                <div><div className="text-[13px] font-semibold">Stacked Release Frame</div><div className="text-[10px] text-[var(--shotiq-color-graphite)]">Profile customization</div></div>
              </div>
            </Card>
            <button type="button" onClick={viewAchievement}
                    className="mt-[12px] h-[46px] w-full rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] text-[14px] font-medium text-white">
              View achievement
            </button>
          </aside>
        </div>
      </div>
    </div>
  )
}
