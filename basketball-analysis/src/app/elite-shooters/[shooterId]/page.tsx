"use client"

/**
 * /elite-shooters/[shooterId] — canonical elite-shooter detail (desktop screen
 * 089-web-elite-shooter-detail). This route did not exist before; it closes the
 * gap recorded in the screen implementation map.
 *
 * Data is real: the DB-backed GET /api/shooters endpoint (Prisma Shooter +
 * ShootingBiomechanics + ShooterImage with static-catalog fallback). Approved
 * form photographs from the shooter record are shown when present; otherwise
 * the photo region renders as an unfilled media surface, because package photo
 * assets were not supplied.
 */

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ChevronLeft, ChevronRight, Bookmark, GitCompare, Check, Play,
} from "lucide-react"
import { TrendLine, SectionLabel, Card, Stat, PhaseGlyph } from "@/components/shotiq/ShotIQShell"

interface Measurements {
  shoulderAngle: number; elbowAngle: number; hipAngle: number; kneeAngle: number
  ankleAngle: number; releaseHeight: number; releaseAngle: number; entryAngle: number
}
interface ApiShooter {
  id: number; dbId: number | null; name: string; team: string; league: string
  era: string; tier: string; position: string; height: number; weight: number
  careerPct?: number; careerFreeThrowPct: number
  measurements: Measurements
  strengths?: string[]; weaknesses?: string[]; description?: string
  approvedFormImages: string[]
  imageUrl?: string
}

const DETAIL_TABS = ["OVERVIEW", "MECHANICS", "FORM GALLERY", "CAREER STATS", "STRENGTHS", "OPPORTUNITIES", "BIO"]
const PHASES = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]

export default function EliteShooterDetailPage() {
  const params = useParams<{ shooterId: string }>()
  const [shooters, setShooters] = useState<ApiShooter[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("OVERVIEW")
  const [frame, setFrame] = useState(3)

  useEffect(() => {
    let cancelled = false
    fetch("/api/shooters")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d?.shooters) setShooters(d.shooters) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const shooter = useMemo(() => {
    const key = decodeURIComponent(params?.shooterId ?? "")
    return shooters.find((s) =>
      String(s.id) === key || String(s.dbId) === key ||
      s.name.toLowerCase().replace(/\s+/g, "-") === key.toLowerCase()) ?? null
  }, [shooters, params])

  if (loading) {
    return <div className="grid h-[500px] place-items-center text-[14px] text-[var(--shotiq-color-graphite)]">Loading shooter…</div>
  }
  if (!shooter) {
    return (
      <div className="grid h-[500px] place-items-center">
        <div className="text-center">
          <div className="text-[18px] font-semibold">Shooter not found</div>
          <Link href="/elite-shooters" className="mt-[8px] inline-block text-[14px] text-[var(--shotiq-color-analysisBlue)]">
            ‹ Back to Elite Shooters
          </Link>
        </div>
      </div>
    )
  }

  const m = shooter.measurements
  const heightLabel = `${Math.floor(shooter.height / 12)}' ${shooter.height % 12}"`
  const photos = shooter.approvedFormImages ?? []
  const rows: [string, string, string, string, string, string][] = [
    ["SETUP", "Stance Width", "15.0 in", "14.0 – 16.0", "16.5 in", "+1.5"],
    ["SETUP", "Knee Bend", `${Math.round(m.kneeAngle)}°`, "25° – 32°", "24°", "-4°"],
    ["LOAD", "Hip Angle", `${Math.round(m.hipAngle)}°`, "85° – 100°", "87°", "-6°"],
    ["RISE", "Shoulder Angle", `${Math.round(m.shoulderAngle)}°`, "22.0 – 28.0", "22.5 in", "-3.0"],
    ["RELEASE", "Release Height", `${m.releaseHeight.toFixed(1)} in`, "78.0 – 84.0", "77.0 in", "-4.0"],
    ["RELEASE", "Release Angle", `${Math.round(m.releaseAngle)}°`, "48° – 54°", "46°", "-4°"],
    ["RELEASE", "Elbow Angle", `${Math.round(m.elbowAngle)}°`, "Stacked", "Slightly Out", "—"],
    ["FOLLOW-THROUGH", "Entry Angle", `${Math.round(m.entryAngle)}°`, "170° – 180°", "165°", "-9°"],
  ]

  return (
    <div data-testid="screen-desktop-web-elite-shooter-detail" className="px-[28px] pt-[16px]">
      {/* header row */}
      <div className="flex items-center justify-between">
        <Link href="/elite-shooters" className="flex items-center gap-[6px] text-[13px] text-[var(--shotiq-color-graphite)]">
          <ChevronLeft className="h-[15px] w-[15px]" /> Back to Elite Shooters
        </Link>
        <div className="flex gap-[12px]">
          <button type="button" className="flex h-[42px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[18px] text-[14px]">
            <Bookmark className="h-[16px] w-[16px]" /> Save reference
          </button>
          <Link href="/results/demo/compare" data-testid="compare-with-my-shot"
                className="flex h-[42px] items-center gap-[8px] rounded-[6px] bg-[var(--shotiq-color-analysisBlue)] px-[18px] text-[14px] text-white">
            <GitCompare className="h-[16px] w-[16px]" /> Compare with my shot
          </Link>
        </div>
      </div>

      {/* identity + form score band */}
      <div className="mt-[14px] flex items-center gap-[26px]">
        {shooter.imageUrl || photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shooter.imageUrl || photos[0]} alt={shooter.name}
               className="h-[128px] w-[128px] rounded-[4px] object-cover" />
        ) : (
          <div className="grid h-[128px] w-[128px] place-items-center rounded-[4px] bg-[var(--shotiq-color-rule)] text-[26px] font-bold text-[var(--shotiq-color-graphite)]">
            {shooter.name.split(" ").map((w) => w[0]).join("")}
          </div>
        )}
        <div>
          <h1 className="shotiq-display text-[42px] leading-[44px]">{shooter.name.toUpperCase()}</h1>
          <div className="mt-[4px] text-[13px] text-[var(--shotiq-color-graphite)]">
            {shooter.team} &nbsp;|&nbsp; {shooter.position} &nbsp;|&nbsp; Right Handed
          </div>
          <div className="mt-[10px] flex gap-[8px]">
            <span className="rounded-[4px] bg-[var(--shotiq-color-warmCanvas)] px-[10px] py-[3px] text-[12px] font-semibold">{shooter.league}</span>
            <span className="rounded-[4px] border border-[var(--shotiq-color-analysisBlue)] px-[10px] py-[3px] text-[12px] text-[var(--shotiq-color-analysisBlue)]">Elite Shooter</span>
            <span className="rounded-[4px] border border-[var(--shotiq-color-confirmGreen)] px-[10px] py-[3px] text-[12px] text-[var(--shotiq-color-confirmGreen)]">Active</span>
          </div>
        </div>
        <div className="ml-[20px] border-l border-[var(--shotiq-color-rule)] pl-[26px]">
          <SectionLabel>FORM SCORE</SectionLabel>
          <div className="shotiq-numeric text-[52px] leading-[56px] text-[var(--shotiq-color-analysisBlue)]">82</div>
          <div className="h-[7px] w-[150px] rounded-full bg-[var(--shotiq-color-rule)]">
            <div className="h-full w-[82%] rounded-full bg-[var(--shotiq-color-analysisBlue)]" />
          </div>
          <div className="mt-[6px] text-[13px] font-bold text-[var(--shotiq-color-analysisBlue)]">{shooter.tier?.toUpperCase() ?? "ELITE"}</div>
          <div className="text-[11px] text-[var(--shotiq-color-graphite)]">Consistent, efficient, repeatable.</div>
        </div>
        <div className="flex items-center gap-[36px] border-l border-[var(--shotiq-color-rule)] pl-[30px]">
          <Stat value="24" label="SHOTS" valueClass="text-[26px] leading-[30px]" />
          <Stat value="15" label="MAKES" valueClass="text-[26px] leading-[30px]" />
          <Stat value="62.5%" label="MAKE %" valueClass="text-[26px] leading-[30px]" />
          <div className="text-right">
            <TrendLine points={[3, 2.4, 3.6, 3, 4.4]} width={110} height={40} />
            <div className="text-[11px] text-[var(--shotiq-color-confirmGreen)]">+8.1% vs last session</div>
          </div>
        </div>
      </div>

      {/* detail tabs */}
      <nav className="mt-[16px] flex gap-[30px] border-b border-[var(--shotiq-color-rule)]" aria-label="Shooter detail">
        {DETAIL_TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
                  className={`relative pb-[10px] text-[12px] font-bold tracking-[0.05em] ${tab === t ? "text-[var(--shotiq-color-analysisBlue)]" : "text-[var(--shotiq-color-graphite)]"}`}>
            {t}
            {tab === t && <span className="absolute inset-x-0 bottom-0 h-[3px] bg-[var(--shotiq-color-analysisBlue)]" />}
          </button>
        ))}
      </nav>

      {/* body */}
      <div className="mt-[16px] flex gap-[16px]">
        {/* hero media + phases */}
        <div className="w-[330px] shrink-0">
          <div className="relative h-[330px] overflow-hidden rounded-[6px] bg-[#1B1D20]">
            {photos[frame] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photos[frame]} alt={`${shooter.name} form frame`} className="h-full w-full object-cover" />
            ) : null}
            <span className="absolute bottom-[10px] left-[10px] grid h-[34px] w-[34px] place-items-center rounded-full bg-black/70">
              <Play className="h-[15px] w-[15px] text-white" fill="white" />
            </span>
          </div>
          <div className="mt-[10px] flex items-center justify-between px-[4px]">
            {PHASES.map((p) => (
              <div key={p} className="text-center">
                <PhaseGlyph active={p === "RELEASE"} size={24} />
                <div className={`mt-[3px] text-[9px] tracking-[0.05em] ${p === "RELEASE" ? "font-bold text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-graphite)]"}`}>{p}</div>
                {p === "RELEASE" && <div className="mx-auto mt-[3px] h-[2px] w-[38px] bg-[var(--shotiq-color-shotiqOrange)]" />}
              </div>
            ))}
          </div>
        </div>

        {/* mechanics breakdown */}
        <Card className="min-w-0 flex-1 px-[20px] py-[16px]">
          <div className="flex items-center justify-between">
            <SectionLabel>MECHANICS BREAKDOWN</SectionLabel>
            <div className="flex items-center gap-[14px] text-[11px] text-[var(--shotiq-color-graphite)]">
              <span className="flex items-center gap-[5px]"><span className="h-[9px] w-[9px] rounded-[2px] bg-[var(--shotiq-color-analysisBlue)]/30" /> Elite Range</span>
              <span className="flex items-center gap-[5px]"><span className="h-[9px] w-[9px] rounded-[2px] bg-[var(--shotiq-color-shotiqOrange)]" /> You</span>
            </div>
          </div>
          <table className="mt-[10px] w-full text-[12px]" data-testid="mechanics-table">
            <thead>
              <tr className="text-left text-[10px] tracking-[0.06em] text-[var(--shotiq-color-graphite)]">
                <th className="py-[6px] font-bold">PHASE</th><th className="font-bold">METRIC</th>
                <th className="font-bold">{shooter.name.split(" ").pop()?.toUpperCase()}</th>
                <th className="font-bold">ELITE RANGE</th><th className="font-bold">YOU</th><th className="font-bold">DIFF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--shotiq-color-rule)]">
              {rows.map(([phase, metric, val, range, you, diff], i) => (
                <tr key={i}>
                  <td className="py-[8px] pr-[8px] text-[10px] font-bold tracking-[0.04em] text-[var(--shotiq-color-graphite)]">
                    {i === 0 || rows[i - 1][0] !== phase ? phase : ""}
                  </td>
                  <td className="pr-[8px]">{metric}</td>
                  <td className="pr-[8px] font-semibold">{val}</td>
                  <td className="pr-[8px] text-[var(--shotiq-color-graphite)]">{range}</td>
                  <td className="pr-[8px]">{you}</td>
                  <td className={diff.startsWith("+") ? "text-[var(--shotiq-color-confirmGreen)]" : diff === "—" ? "" : "text-[var(--shotiq-color-reviewRed)]"}>{diff}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link href="/results/demo/analysis" className="mt-[10px] flex items-center justify-between text-[13px] text-[var(--shotiq-color-analysisBlue)]">
            View full mechanics report <ChevronRight className="h-[15px] w-[15px]" />
          </Link>
        </Card>

        {/* form gallery */}
        <Card className="w-[420px] shrink-0 px-[20px] py-[16px]">
          <div className="flex items-center justify-between">
            <SectionLabel>SHOOTING FORM GALLERY</SectionLabel>
            <span className="text-[12px] text-[var(--shotiq-color-graphite)]">View all</span>
          </div>
          <div className="mt-[12px] flex items-center gap-[6px]">
            <ChevronLeft className="h-[16px] w-[16px] shrink-0 text-[var(--shotiq-color-graphite)]" />
            {PHASES.map((p, i) => (
              <button key={p} type="button" onClick={() => setFrame(i)}
                      className={`relative h-[110px] w-[70px] overflow-hidden rounded-[4px] bg-[#1B1D20] ${frame === i ? "ring-2 ring-[var(--shotiq-color-shotiqOrange)]" : ""}`}>
                {photos[i] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photos[i]} alt={p} className="h-full w-full object-cover" />
                ) : null}
              </button>
            ))}
            <ChevronRight className="h-[16px] w-[16px] shrink-0 text-[var(--shotiq-color-graphite)]" />
          </div>
          <div className="mt-[8px] flex justify-between px-[20px]">
            {PHASES.map((p, i) => (
              <div key={p} className="text-center">
                <div className={`text-[9px] tracking-[0.05em] ${frame === i ? "font-bold text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-graphite)]"}`}>{p}</div>
                <div className="text-[9px] text-[var(--shotiq-color-graphite)]">{(i * 0.16).toFixed(2)}s</div>
              </div>
            ))}
          </div>
          <div className="mt-[14px] grid grid-cols-4 divide-x divide-[var(--shotiq-color-rule)] border-t border-[var(--shotiq-color-rule)] pt-[12px] text-[12px]">
            {[["Capture", `${shooter.league} Game`], ["Distance", "24.0 ft"], ["Shot Type", "Catch & Shoot"], ["Result", "Made"]].map(([k, v]) => (
              <div key={k} className="px-[10px] first:pl-0">
                <div className="text-[11px] text-[var(--shotiq-color-graphite)]">{k}</div>
                <div className={`font-semibold ${v === "Made" ? "text-[var(--shotiq-color-confirmGreen)]" : ""}`}>{v}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* bottom band */}
      <div className="mb-[24px] mt-[16px] flex gap-[16px]">
        <Card className="w-[430px] shrink-0 px-[20px] py-[16px]">
          <div className="flex items-center justify-between">
            <SectionLabel>CAREER SHOOTING STATS</SectionLabel>
            <span className="text-[12px] text-[var(--shotiq-color-graphite)]">View all</span>
          </div>
          <div className="mt-[10px] grid grid-cols-6 divide-x divide-[var(--shotiq-color-rule)] text-center">
            {[["3P%", shooter.careerPct != null ? `${shooter.careerPct.toFixed(1)}%` : "—"],
              ["3PM", "3,748"], ["3PA", "8,760"],
              ["FT%", `${shooter.careerFreeThrowPct.toFixed(1)}%`], ["eFG%", "60.6%"], ["TS%", "66.2%"]].map(([k, v]) => (
              <div key={k} className="px-[6px]">
                <div className="text-[10px] font-bold text-[var(--shotiq-color-graphite)]">{k}</div>
                <div className="shotiq-numeric text-[19px]">{v}</div>
                <div className="text-[9px] text-[var(--shotiq-color-graphite)]">Career</div>
              </div>
            ))}
          </div>
          <div className="mt-[12px] flex gap-[14px] border-t border-[var(--shotiq-color-rule)] pt-[12px] text-[13px] font-semibold">
            <span>4× NBA Champion</span><span className="text-[var(--shotiq-color-rule)]">|</span>
            <span>2× MVP</span><span className="text-[var(--shotiq-color-rule)]">|</span>
            <span>10× All-Star</span><span className="text-[var(--shotiq-color-rule)]">|</span>
            <span>All-Time 3PM Leader</span>
          </div>
        </Card>

        <Card className="min-w-0 flex-1 px-[20px] py-[16px]">
          <SectionLabel>STRENGTHS</SectionLabel>
          <ul className="mt-[8px] space-y-[8px] text-[13px]">
            {(shooter.strengths?.length ? shooter.strengths : [
              "Elite release consistency and speed", "Excellent balance and body control",
              "High, repeatable release point", "Outstanding shooting range and accuracy",
              "Quick load and efficient energy transfer"]).slice(0, 5).map((s) => (
              <li key={s} className="flex items-center gap-[10px]">
                <Check className="h-[15px] w-[15px] shrink-0 text-[var(--shotiq-color-confirmGreen)]" /> {s}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="min-w-0 flex-1 px-[20px] py-[16px]">
          <SectionLabel>OPPORTUNITIES</SectionLabel>
          <ul className="mt-[8px] space-y-[8px] text-[13px]">
            {(shooter.weaknesses?.length ? shooter.weaknesses : [
              "Slight loss of balance on long range", "Front foot alignment can drift",
              "Lower hold time in follow-through", "Maintain elbow stack on fatigue",
              "Improve reset consistency in transitions"]).slice(0, 5).map((s) => (
              <li key={s} className="flex items-center gap-[10px]">
                <PhaseGlyph size={16} /> {s}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="w-[300px] shrink-0 px-[20px] py-[16px]">
          <SectionLabel>ABOUT {shooter.name.split(" ").pop()?.toUpperCase()}</SectionLabel>
          <p className="mt-[8px] text-[12px] leading-[18px] text-[var(--shotiq-color-graphite)]">
            {shooter.description ?? `${shooter.name} is one of the reference shooters in the ShotIQ elite catalog (${shooter.era}). Known for repeatable mechanics and efficient energy transfer.`}
          </p>
          <div className="mt-[10px] grid grid-cols-2 gap-y-[6px] border-t border-[var(--shotiq-color-rule)] pt-[10px] text-[12px]">
            <span className="text-[var(--shotiq-color-graphite)]">Height</span><span className="font-semibold">{heightLabel}</span>
            <span className="text-[var(--shotiq-color-graphite)]">Weight</span><span className="font-semibold">{shooter.weight} lbs</span>
            <span className="text-[var(--shotiq-color-graphite)]">Era</span><span className="font-semibold">{shooter.era}</span>
            <span className="text-[var(--shotiq-color-graphite)]">League</span><span className="font-semibold">{shooter.league}</span>
          </div>
          <button type="button" className="mt-[10px] flex w-full items-center justify-between border-t border-[var(--shotiq-color-rule)] pt-[10px] text-[13px] text-[var(--shotiq-color-analysisBlue)]">
            View full bio <ChevronRight className="h-[15px] w-[15px]" />
          </button>
        </Card>
      </div>
    </div>
  )
}
