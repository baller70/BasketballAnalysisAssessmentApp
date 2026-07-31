"use client"

/** /results/demo/compare — canonical 087-web-elite-comparison. */

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronDown, RefreshCcw, Bookmark, MoreVertical, Play, ChevronLeft, ChevronRight } from "lucide-react"
import { SectionLabel, Card, MediaSurface, Ring, PhaseGlyph, Stat } from "@/components/shotiq/ShotIQShell"
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
  const [elite, setElite] = useState<Shooter | null>(null)
  const [menu, setMenu] = useState<null | "shooters" | "overlays" | "phase">(null)
  const [overlays, setOverlays] = useState({ Skeleton: true, Joints: true, Trajectory: false })
  const [phase, setPhase] = useState("RELEASE")
  const [synced, setSynced] = useState(false)
  const [saved, setSaved] = useState(false)
  useEffect(() => {
    fetch("/api/shooters").then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const list: Shooter[] = d?.shooters ?? []
        setShooters(list)
        setElite(list[0] ?? null)
      }).catch(() => {})
  }, [])
  const stepPhase = (dir: 1 | -1) =>
    setPhase((p) => PHASES[(PHASES.indexOf(p) + dir + PHASES.length) % PHASES.length])

  return (
    <div data-testid="screen-desktop-web-elite-comparison">
      <div className="flex items-start justify-between gap-[14px]">
        <div>
          <h1 className="shotiq-display text-[46px] leading-[48px]">ELITE COMPARISON</h1>
          <p className="mt-[4px] text-[14px] text-[var(--shotiq-color-graphite)]">See how your mechanics compare to elite-level form.</p>
        </div>
        <div className="flex gap-[10px] pt-[4px]">
          {([["shooters", elite ? `Shooter: ${elite.name}` : "Choose shooters"],
             ["overlays", "Overlay skeletons"],
             ["phase", phase.charAt(0) + phase.slice(1).toLowerCase()]] as const).map(([key, label]) => (
            <div key={key} className="relative">
              <button type="button" aria-expanded={menu === key}
                      onClick={() => setMenu((m) => (m === key ? null : key))}
                      className="flex h-[42px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[16px] text-[13px]">
                {label} <ChevronDown className="h-[13px] w-[13px] text-[var(--shotiq-color-graphite)]" />
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
                  className={`flex h-[42px] items-center gap-[8px] rounded-[6px] px-[16px] text-[13px] font-medium text-white ${synced ? "bg-[var(--shotiq-color-analysisBlue)]" : "bg-[var(--shotiq-color-confirmGreen)]"}`}>
            <RefreshCcw className="h-[14px] w-[14px]" /> {synced ? "Release frames synced" : "Sync release frames"}
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
      <div className="mt-[8px] flex items-center gap-[14px]">
        {(["YOU", "ELITE REFERENCE"] as const).map((side, sideIdx) => (
          <div key={side} className="min-w-0 flex-1">
            <div className="relative">
              <MediaSurface height={280} />
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
            </div>
            <div className="mt-[6px] flex items-center gap-[8px]">
              <Play className="h-[14px] w-[14px]" fill="currentColor" />
              <span className="shotiq-numeric text-[12px]">0.64s</span>
              <div className="relative h-[3px] flex-1 rounded-full bg-[var(--shotiq-color-rule)]">
                <span className={`absolute top-1/2 h-[11px] w-[11px] -translate-y-1/2 rounded-full ${sideIdx ? "bg-[var(--shotiq-color-analysisBlue)]" : "bg-[var(--shotiq-color-shotiqOrange)]"}`}
                      style={{ left: sideIdx ? "72%" : "48%" }} />
              </div>
            </div>
            <div className="mt-[6px] flex gap-[4px]">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className={`h-[36px] flex-1 rounded-[3px] bg-[#1B1D20] ${i === (sideIdx && !synced ? 7 : 5) ? `ring-2 ${sideIdx ? "ring-[var(--shotiq-color-analysisBlue)]" : "ring-[var(--shotiq-color-shotiqOrange)]"}` : ""}`} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* phase selector */}
      <div className="mt-[12px] flex items-center gap-[16px]">
        <SectionLabel>SELECT PHASE</SectionLabel>
        {[0, 1].map((side) => (
          <div key={side} className="flex flex-1 items-center justify-between px-[10px]">
            <button type="button" aria-label="Previous phase" onClick={() => stepPhase(-1)}>
              <ChevronLeft className="h-[14px] w-[14px] text-[var(--shotiq-color-graphite)]" />
            </button>
            {PHASES.map((p) => (
              <button key={p} type="button" onClick={() => setPhase(p)} aria-pressed={p === phase} className="text-center">
                <PhaseGlyph active={p === phase} size={24} />
                <div className={`text-[9px] tracking-[0.04em] ${p === phase ? (side ? "font-bold text-[var(--shotiq-color-analysisBlue)]" : "font-bold text-[var(--shotiq-color-shotiqOrange)]") : "text-[var(--shotiq-color-graphite)]"}`}>{p}</div>
              </button>
            ))}
            <button type="button" aria-label="Next phase" onClick={() => stepPhase(1)}>
              <ChevronRight className="h-[14px] w-[14px] text-[var(--shotiq-color-graphite)]" />
            </button>
          </div>
        ))}
      </div>

      {/* analysis band */}
      <div className="mt-[14px] flex gap-[16px]">
        <Card className="w-[250px] shrink-0 px-[18px] py-[14px]">
          <SectionLabel>FORM SCORE</SectionLabel>
          <div className="mt-[8px] flex items-center gap-[14px]">
            <Ring pct={(score ?? 0) / 100} size={86}>
              <div className="text-center"><span className="shotiq-numeric text-[26px]">{score ?? "—"}</span><span className="block text-[9px] text-[var(--shotiq-color-graphite)]">/100</span></div>
            </Ring>
            <div>
              <div className="text-[14px] font-bold text-[var(--shotiq-color-analysisBlue)]">GOOD</div>
              <div className="text-[11px] text-[var(--shotiq-color-graphite)]">Keep building consistency.</div>
            </div>
          </div>
          <div className="mt-[12px] flex gap-[18px] border-t border-[var(--shotiq-color-rule)] pt-[10px]">
            <Stat value={hasData ? "24" : "0"} label="SHOTS" valueClass="text-[20px] leading-[22px]" />
            <Stat value={hasData ? "15" : "0"} label="MAKES" valueClass="text-[20px] leading-[22px]" />
            <Stat value={hasData ? "62.5%" : "—"} label="MAKE %" valueClass="text-[20px] leading-[22px]" />
          </div>
        </Card>

        <Card className="min-w-0 flex-1 px-[18px] py-[14px]">
          <SectionLabel>KEY DIFFERENCES</SectionLabel>
          <table className="mt-[6px] w-full text-[12px]">
            <thead><tr className="text-left text-[9px] tracking-[0.06em] text-[var(--shotiq-color-graphite)]">
              <th className="py-[4px] font-bold">METRIC</th><th className="font-bold">YOU</th><th className="font-bold">ELITE</th><th className="font-bold">DIFFERENCE</th></tr></thead>
            <tbody className="divide-y divide-[var(--shotiq-color-rule)]">
              {DIFFS.map(([m, you, el, d]) => (
                <tr key={m}>
                  <td className="py-[5px] pr-[8px]">{m}</td>
                  <td className="pr-[8px] font-semibold text-[var(--shotiq-color-shotiqOrange)]">{you}</td>
                  <td className="pr-[8px] font-semibold text-[var(--shotiq-color-analysisBlue)]">{el}</td>
                  <td>{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="w-[300px] shrink-0 px-[18px] py-[14px]">
          <SectionLabel>WHY THE DIFFERENCE MATTERS</SectionLabel>
          <div className="mt-[6px] space-y-[8px]">
            {["Slightly lower release angle reduces margin for error on longer shots.",
              "More open elbow improves line to target and repeatability.",
              "Increased wrist flexion adds backspin and softens the shot.",
              "Elite balance helps maintain consistency under fatigue."].map((t) => (
              <div key={t} className="flex gap-[10px]">
                <PhaseGlyph size={22} />
                <p className="text-[12px] leading-[16px]">{t}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="w-[210px] shrink-0 px-[18px] py-[14px]">
          <SectionLabel>TOP MATCHES</SectionLabel>
          <div className="mt-[8px] space-y-[9px]">
            {MATCH.map(([p, v]) => (
              <div key={p}>
                <div className="flex justify-between text-[10px]">
                  <span className={`font-bold tracking-[0.04em] ${p === "RELEASE" ? "text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-graphite)]"}`}>{p}</span>
                  <span className="shotiq-numeric">{v}%</span>
                </div>
                <div className="mt-[2px] h-[4px] rounded-full bg-[var(--shotiq-color-rule)]">
                  <div className={`h-full rounded-full ${p === "RELEASE" ? "bg-[var(--shotiq-color-shotiqOrange)]" : "bg-[var(--shotiq-color-analysisBlue)]"}`} style={{ width: `${v}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* footer band */}
      <div className="mt-[14px] flex gap-[16px]">
        <Card className="flex flex-1 items-center gap-[14px] px-[20px] py-[14px]">
          <span className="text-[22px]">💡</span>
          <div>
            <SectionLabel>FOCUS RECOMMENDATION</SectionLabel>
            <p className="text-[13px] text-[var(--shotiq-color-graphite)]">Keep elbow stacked through release to improve your release angle and consistency.</p>
          </div>
        </Card>
        <Card className="flex w-[420px] shrink-0 items-center gap-[14px] px-[20px] py-[14px]">
          <span className="grid h-[42px] w-[42px] place-items-center rounded-full bg-[var(--shotiq-color-analysisBlue)] text-white">◎</span>
          <div className="flex-1">
            <SectionLabel>NEXT BEST WORKOUT</SectionLabel>
            <div className="text-[14px] font-semibold">Quick Release Builder</div>
            <div className="text-[11px] text-[var(--shotiq-color-graphite)]">20 min · Form Focus</div>
          </div>
          <Link href="/training/drills/quick-release-builder" aria-label="Open workout">›</Link>
        </Card>
      </div>
    </div>
  )
}
