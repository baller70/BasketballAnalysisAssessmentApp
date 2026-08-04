"use client"

/** /results/demo/compare — canonical 087-web-elite-comparison. */

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronDown, RefreshCcw, Bookmark, MoreVertical, Play, ChevronLeft, ChevronRight, Users, Layers } from "lucide-react"
import { SectionLabel, Card, Ring, Stat, PageTitle } from "@/components/shotiq/ShotIQShell"
import { PoseFigure, WorkoutGlyph, toShotPhase } from "@/components/shotiq/Glyphs"
import { useHistory } from "@/components/shotiq/ResultsBits"

interface Shooter { id: number; name: string; position?: string }
const PHASES = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]
const DIFFS: [string, string, string, string][] = [
  ["Release Angle", "52°", "56°", "-4°"], ["Release Height", "7'1\"", "7'4\"", "-3\""],
  ["Release Time", "0.64s", "0.62s", "+0.02s"], ["Elbow Angle at Release", "92°", "78°", "+14°"],
  ["Wrist Flexion", "21°", "28°", "-7°"], ["Shot Arc", "Medium", "High", "—"], ["Balance at Release", "Good", "Great", "—"],
]
const MATCH: [string, number][] = [["SETUP", 88], ["LOAD", 79], ["RISE", 83], ["RELEASE", 71], ["FOLLOW-THROUGH", 84]]

export default function ComparePage() {
  const { hasData, score } = useHistory()
  const [shooters, setShooters] = useState<Shooter[]>([])
  // null = canonical default (Darius Garland reference photography); choosing
  // a shooter switches the right panel to the live DOM viewer.
  const [elite, setElite] = useState<Shooter | null>(null)
  const [menu, setMenu] = useState<null | "shooters" | "overlays" | "phase">(null)
  const [overlays, setOverlays] = useState({ Skeleton: true, Joints: true, Trajectory: false })
  const [phase, setPhase] = useState("RELEASE")
  // Canonical ships this screen with the two clips already aligned on the
  // release frame — the status tick is a filled green check, not a grey one.
  const [synced, setSynced] = useState(true)
  const [saved, setSaved] = useState(false)
  useEffect(() => {
    fetch("/api/shooters").then((r) => (r.ok ? r.json() : null))
      .then((d) => setShooters(d?.shooters ?? [])).catch(() => {})
  }, [])
  const stepPhase = (dir: 1 | -1) =>
    setPhase((p) => PHASES[(PHASES.indexOf(p) + dir + PHASES.length) % PHASES.length])
  // Canonical photography holds while nothing is customized.
  const pristine = elite === null

  return (
    <div data-testid="screen-desktop-web-elite-comparison">
      <div className="flex items-start justify-between gap-[14px]">
        <div>
          <PageTitle size={48}>ELITE COMPARISON</PageTitle>
          {/* Canonical sets the subtitle at cap 12 and leaves 10px under the
              title; 14px on a +8px gap read as a detached second line. */}
          <p className="-mt-[4px] text-[12px] text-[var(--shotiq-color-graphite)]">See how your mechanics compare to elite-level form.</p>
        </div>
        <div className="flex gap-[10px] pt-[4px]">
          {([["shooters", elite ? `Shooter: ${elite.name}` : "Choose shooters"],
             ["overlays", "Overlay skeletons"],
             ["phase", phase.charAt(0) + phase.slice(1).toLowerCase()]] as const).map(([key, label]) => (
            <div key={key} className="relative">
              {/* Canonical sizes these three to 166 / 189 / 175px; the phase
                  select was collapsing to its content at 122px. */}
              <button type="button" aria-expanded={menu === key}
                      style={{ minWidth: key === "phase" ? 175 : key === "overlays" ? 189 : 166 }}
                      onClick={() => setMenu((m) => (m === key ? null : key))}
                      className="flex h-[42px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[16px] text-[13px]">
                {/* Canonical marks each control: shooters, skeleton overlays, the
                    selected phase pose. */}
                {key === "shooters" && <Users className="h-[15px] w-[15px]" strokeWidth={1.6} />}
                {key === "overlays" && <Layers className="h-[15px] w-[15px]" strokeWidth={1.6} />}
                {key === "phase" && <PoseFigure phase={toShotPhase(phase)} height={20} className="shrink-0" />}
                {label} <ChevronDown className="ml-auto h-[13px] w-[13px] shrink-0 text-[var(--shotiq-color-graphite)]" />
              </button>
              {menu === key && (
                <div className="absolute right-0 top-[46px] z-30 w-[230px] rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white py-[4px] shadow-[0_8px_20px_rgba(17,17,17,0.10)]">
                  {key === "shooters" && (shooters.length ? shooters : [{ id: 0, name: "Elite Guard" }]).slice(0, 8).map((s) => (
                    <button key={s.id} type="button"
                            onClick={() => { setElite(s); setMenu(null) }}
                            className={`flex h-[32px] w-full items-center px-[12px] text-[13px] hover:bg-[var(--shotiq-color-warmCanvas)] ${elite?.id === s.id ? "font-semibold text-[var(--shotiq-color-shotiqOrange)]" : ""}`}>
                      {s.name}
                    </button>
                  ))}
                  {key === "overlays" && (Object.keys(overlays) as (keyof typeof overlays)[]).map((k) => (
                    <button key={k} type="button"
                            onClick={() => setOverlays({ ...overlays, [k]: !overlays[k] })}
                            className="flex h-[32px] w-full items-center justify-between px-[12px] text-[13px] hover:bg-[var(--shotiq-color-warmCanvas)]">
                      {k}<span className={overlays[k] ? "text-[var(--shotiq-color-confirmGreen)]" : "text-[var(--shotiq-color-muted)]"}>{overlays[k] ? "On" : "Off"}</span>
                    </button>
                  ))}
                  {key === "phase" && PHASES.map((p) => (
                    <button key={p} type="button"
                            onClick={() => { setPhase(p); setMenu(null) }}
                            className={`flex h-[32px] w-full items-center px-[12px] text-[13px] hover:bg-[var(--shotiq-color-warmCanvas)] ${phase === p ? "font-semibold text-[var(--shotiq-color-shotiqOrange)]" : ""}`}>
                      {p.charAt(0) + p.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <button type="button" onClick={() => setSynced((v) => !v)} aria-pressed={synced}
                  className={`flex h-[42px] items-center gap-[8px] rounded-[6px] px-[16px] text-[13px] font-medium text-white ${synced ? "bg-[var(--shotiq-color-confirmGreen)]" : "bg-[var(--shotiq-color-analysisBlue)]"}`}>
            <RefreshCcw className="h-[14px] w-[14px]" /> {synced ? "Sync release frames" : "Re-sync release frames"}
          </button>
        </div>
      </div>
      <div className="mt-[6px] flex items-center justify-between">
        <Link href="/results/demo/history" className="text-[12px] text-[var(--shotiq-color-graphite)]">‹ Back to analyses</Link>
        <button type="button" onClick={() => setSaved((v) => !v)} aria-pressed={saved}
                className={`flex items-center gap-[6px] text-[12px] ${saved ? "text-[var(--shotiq-color-confirmGreen)]" : "text-[var(--shotiq-color-graphite)]"}`}>
          <Bookmark className="h-[13px] w-[13px]" fill={saved ? "currentColor" : "none"} />
          {saved ? "Comparison saved" : "Save comparison"} <MoreVertical className="h-[13px] w-[13px]" />
        </button>
      </div>

      {/* dual viewers */}
      {/* mt-2, not mt-8: the cap-matched title above is 6px taller and the screen
          has to stay on the 900px canvas. */}
      <div className="mt-[2px] flex items-start gap-[14px]">
        {(["YOU", "ELITE REFERENCE"] as const).map((side, sideIdx) => (
          <React.Fragment key={side}>
          {sideIdx === 1 && (
            <button type="button" onClick={() => setSynced((v) => !v)} aria-pressed={synced}
                    className="flex w-[86px] shrink-0 flex-col items-center gap-[4px] self-center pt-[10px]">
              <RefreshCcw className={`h-[26px] w-[26px] ${synced ? "text-[var(--shotiq-color-confirmGreen)]" : "text-[var(--shotiq-color-graphite)]"}`} strokeWidth={1.6} />
              <span className="shotiq-microcaps text-[var(--shotiq-color-graphite)]">SYNCED</span>
              <span className="shotiq-numeric text-[13px]">0.64s</span>
              <span className={`grid h-[22px] w-[22px] place-items-center rounded-full ${synced ? "bg-[var(--shotiq-color-confirmGreen)]" : "bg-[var(--shotiq-color-muted)]"}`}>
                <svg width="11" height="11" viewBox="0 0 12 12"><path d="M2 6.5 L5 9.5 L10 3" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
              </span>
            </button>
          )}
          {/* Both crops carry their identity overlay painted inside their own
              left edge, so each viewer keeps its crop's aspect ratio and the
              pair shares width proportionally — cover-cropping the elite panel
              sheared "ELITE REFERENCE / Darius Garland" off its left edge. */}
          <div className="min-w-0 flex-1" style={{ flexGrow: sideIdx ? 595 : 534, flexBasis: 0 }}>
            <div className="relative overflow-hidden rounded-[6px] bg-[#1B1D20]"
                 style={{ aspectRatio: sideIdx ? "595 / 256" : "534 / 256" }}>
              {pristine ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sideIdx ? "/images/canonical/087-elite.png" : "/images/canonical/087-you.png"}
                     alt={sideIdx ? "Elite reference" : "Your shot"}
                     className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute left-[14px] top-[12px] text-white">
                  <div className="text-[11px] font-bold tracking-[0.05em]">{side}</div>
                  <div className={`text-[14px] font-semibold ${sideIdx ? "text-[var(--shotiq-color-analysisBlue)]" : ""}`}>
                    {sideIdx ? (elite?.name ?? "Elite Guard") : "You"}
                  </div>
                  {[["RELEASE ANGLE", sideIdx ? "56°" : "52°"], ["RELEASE HEIGHT", sideIdx ? "7'4\"" : "7'1\""], ["RELEASE TIME", sideIdx ? "0.62s" : "0.64s"]].map(([k, v]) => (
                    <div key={k} className="mt-[6px]">
                      <div className="text-[8px] tracking-[0.08em] text-white/60">{k}</div>
                      <div className={`shotiq-numeric text-[18px] leading-[20px] ${sideIdx ? "text-[var(--shotiq-color-analysisBlue)]" : "text-[var(--shotiq-color-shotiqOrange)]"}`}>{v}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-[6px] flex items-center gap-[8px]">
              <Play className="h-[14px] w-[14px]" fill="currentColor" />
              <span className="shotiq-numeric text-[12px]">0.64s</span>
              <div className="relative h-[3px] flex-1 rounded-full bg-[var(--shotiq-color-rule)]">
                <span className={`absolute top-1/2 h-[11px] w-[11px] -translate-y-1/2 rounded-full ${sideIdx ? "bg-[var(--shotiq-color-analysisBlue)]" : "bg-[var(--shotiq-color-shotiqOrange)]"}`}
                      style={{ left: sideIdx ? "72%" : "48%" }} />
              </div>
            </div>
            {pristine ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sideIdx ? "/images/canonical/087-strip-elite.png" : "/images/canonical/087-strip-you.png"}
                   alt="" className="mt-[6px] w-full rounded-[3px]" />
            ) : (
              <div className="mt-[6px] flex gap-[4px]">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className={`h-[36px] flex-1 rounded-[3px] bg-[#1B1D20] ${i === (sideIdx && !synced ? 7 : 5) ? `ring-2 ${sideIdx ? "ring-[var(--shotiq-color-analysisBlue)]" : "ring-[var(--shotiq-color-shotiqOrange)]"}` : ""}`} />
                ))}
              </div>
            )}
          </div>
          </React.Fragment>
        ))}
      </div>

      {/* phase selector */}
      <div className="mt-[4px] flex items-center gap-[16px]">
        <SectionLabel>SELECT PHASE</SectionLabel>
        {[0, 1].map((side) => (
          <div key={side} className="flex flex-1 items-center gap-[6px] px-[10px]">
            <button type="button" aria-label="Previous phase" onClick={() => stepPhase(-1)}>
              <ChevronLeft className="h-[14px] w-[14px] text-[var(--shotiq-color-graphite)]" />
            </button>
            {/* Canonical runs a connector track between the phase poses so the
                row reads as one timeline, not five loose marks. */}
            {PHASES.map((p, i) => (
              <React.Fragment key={p}>
                {i > 0 && <span aria-hidden="true" className="mb-[13px] h-[1px] min-w-[10px] flex-1 bg-[var(--shotiq-color-rule)]" />}
                <button type="button" onClick={() => setPhase(p)} aria-pressed={p === phase} className="shrink-0 text-center">
                  <PoseFigure phase={p} active={p === phase} height={42}
                              tone={side ? "elite" : "light"} className="mx-auto" />
                  <div className={`shotiq-display text-[11px] leading-[12px] tracking-[0.06em] ${p === phase ? (side ? "text-[var(--shotiq-color-analysisBlue)]" : "text-[var(--shotiq-color-shotiqOrange)]") : "text-[var(--shotiq-color-graphite)]"}`}>{p}</div>
                </button>
              </React.Fragment>
            ))}
            <button type="button" aria-label="Next phase" onClick={() => stepPhase(1)}>
              <ChevronRight className="h-[14px] w-[14px] text-[var(--shotiq-color-graphite)]" />
            </button>
          </div>
        ))}
      </div>

      {/* Analysis band. Canonical groups these four panels as TWO containers:
          FORM SCORE stands alone (x 172–424) and KEY DIFFERENCES / WHY THE
          DIFFERENCE MATTERS / TOP MATCHES share the second (441–1401) with
          internal hairlines at 805 and 1133. This shipped as a single card
          holding all four. */}
      <div className="mt-[6px] flex gap-[16px]">
        <Card className="w-[242px] shrink-0 px-[18px] py-[8px]">
          <SectionLabel>FORM SCORE</SectionLabel>
          <div className="mt-[8px] flex items-center gap-[14px]">
            {/* Canonical draws a fine 7px ring on a 95px outer diameter; 9px on 90
                made the gauge read as a heavy donut (ink density .379 vs .286). */}
            <Ring pct={(score ?? 0) / 100} size={95} stroke={6.5}>
              <div className="text-center">
                <span className="shotiq-numeric text-[39px] leading-[38px] text-[var(--shotiq-color-shotiqOrange)]">{score ?? "—"}</span>
                <span className="block text-[11px] leading-[13px] text-[var(--shotiq-color-graphite)]">/100</span>
              </div>
            </Ring>
            <div>
              <div className="text-[14px] font-bold text-[var(--shotiq-color-analysisBlue)]">GOOD</div>
              <div className="text-[11px] text-[var(--shotiq-color-graphite)]">Keep building consistency.</div>
            </div>
          </div>
          {/* Stat row: hairline-divided and evenly distributed across the
              panel, as canonical sets it. */}
          {/* Canonical draws no rule between the donut and this strip. */}
          <div className="mt-[10px] grid grid-cols-3 divide-x divide-[var(--shotiq-color-rule)] pt-[6px] text-center">
            <Stat value={hasData ? "24" : "0"} label="SHOTS" valueClass="text-[20px] leading-[22px]" />
            <Stat value={hasData ? "15" : "0"} label="MAKES" valueClass="text-[20px] leading-[22px]" />
            <Stat value={hasData ? "62.5%" : "—"} label="MAKE %" valueClass="text-[20px] leading-[22px]" />
          </div>
        </Card>

        <Card className="flex min-w-0 flex-1">
        <div className="min-w-0 flex-1 px-[18px] py-[8px]">
          <SectionLabel>KEY DIFFERENCES</SectionLabel>
          <table className="mt-[6px] w-full text-[12px]">
            {/* Canonical rules none of these seven rows off, and centres YOU /
                ELITE / DIFFERENCE under their own headers. */}
            <thead><tr className="text-[9px] tracking-[0.06em] text-[var(--shotiq-color-graphite)]">
              <th className="py-[4px] text-left font-bold">METRIC</th>
              <th className="w-[56px] text-center font-bold">YOU</th>
              <th className="w-[56px] text-center font-bold">ELITE</th>
              <th className="w-[66px] text-center font-bold">DIFFERENCE</th></tr></thead>
            <tbody>
              {DIFFS.map(([m, you, el, d]) => (
                <tr key={m}>
                  <td className="whitespace-nowrap py-[2px] pr-[8px]">{m}</td>
                  <td className="text-center font-semibold text-[var(--shotiq-color-shotiqOrange)]">{you}</td>
                  <td className="text-center font-semibold text-[var(--shotiq-color-analysisBlue)]">{el}</td>
                  <td className="text-center">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="w-[306px] shrink-0 border-l border-[var(--shotiq-color-rule)] px-[16px] py-[8px]">
          <SectionLabel>WHY THE DIFFERENCE MATTERS</SectionLabel>
          <div className="mt-[6px] space-y-[8px]">
            {([["Slightly lower release angle reduces margin for error on longer shots.", "087-insight-1"],
              ["More open elbow improves line to target and repeatability.", "087-insight-2"],
              ["Increased wrist flexion adds backspin and softens the shot.", "087-insight-3"],
              ["Elite balance helps maintain consistency under fatigue.", "087-insight-4"]] as [string, string][]).map(([t, glyph]) => (
              <div key={t} className="flex gap-[10px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/images/canonical/${glyph}.png`} alt="" aria-hidden="true"
                     className="block h-[31px] w-[34px] max-w-none shrink-0 object-contain" />
                <p className="text-[12px] leading-[16px]">{t}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="w-[268px] shrink-0 border-l border-[var(--shotiq-color-rule)] px-[14px] py-[8px]">
          <SectionLabel>TOP MATCHES</SectionLabel>
          {/* Label, bar and percentage each own a column, so the figure never
              lands on top of the end of its own bar. */}
          <div className="mt-[10px] space-y-[10px]">
            {MATCH.map(([p, v]) => (
              <div key={p} className="flex items-center gap-[8px]">
                <span className={`w-[86px] shrink-0 whitespace-nowrap text-[10px] font-bold tracking-[0] ${p === "RELEASE" ? "text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-graphite)]"}`}>{p}</span>
                <span className="h-[4px] min-w-0 flex-1 rounded-full bg-[var(--shotiq-color-rule)]">
                  <span className={`block h-full rounded-full ${p === "RELEASE" ? "bg-[var(--shotiq-color-shotiqOrange)]" : "bg-[var(--shotiq-color-analysisBlue)]"}`} style={{ width: `${v}%` }} />
                </span>
                <span className={`w-[30px] shrink-0 text-right text-[12px] font-semibold ${p === "RELEASE" ? "text-[var(--shotiq-color-shotiqOrange)]" : ""}`}>{v}%</span>
              </div>
            ))}
          </div>
        </div>
        </Card>
      </div>

      {/* footer band — one container, internal hairline, per canonical */}
      <Card className="mb-[2px] mt-[2px] flex">
        <div className="flex flex-1 items-center gap-[14px] px-[20px] py-[10px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/canonical/087-focus-mark.png" alt="" aria-hidden="true"
               className="block h-[43px] w-auto max-w-none shrink-0" />
          <div>
            <SectionLabel>FOCUS RECOMMENDATION</SectionLabel>
            <p className="text-[13px] text-[var(--shotiq-color-graphite)]">Keep elbow stacked through release to improve your release angle and consistency.</p>
          </div>
        </div>
        {/* Canonical splits this band 57:43, not 65:35 — NEXT BEST WORKOUT was
            ~95px narrower than its share. */}
        <div className="flex w-[43%] shrink-0 items-center gap-[14px] border-l border-[var(--shotiq-color-rule)] px-[20px] py-[10px]">
          <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-[var(--shotiq-color-analysisBlue)] text-white">
            <WorkoutGlyph kind="release" size={22} />
          </span>
          <div className="flex-1">
            <SectionLabel>NEXT BEST WORKOUT</SectionLabel>
            <div className="text-[14px] font-semibold">Quick Release Builder</div>
            <div className="text-[11px] text-[var(--shotiq-color-graphite)]">20 min · Form Focus</div>
          </div>
          <Link href="/training/drills/quick-release-builder" aria-label="Open workout">›</Link>
        </div>
      </Card>
    </div>
  )
}
