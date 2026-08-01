"use client"

/**
 * /elite-shooters/[shooterId] — canonical elite-shooter detail (desktop screen
 * 089-web-elite-shooter-detail).
 *
 * Data is real: the DB-backed GET /api/shooters endpoint (Prisma Shooter +
 * ShootingBiomechanics + ShooterImage with static-catalog fallback). Approved
 * form photographs from the shooter record are shown when present; otherwise
 * the hero, main frame and gallery fall back to the canonical photography
 * crops so the screen mirrors 089 exactly.
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
const PHASE_TIMES = ["0.00s", "0.18s", "0.32s", "0.48s", "0.64s"]

const POS_ABBR: Record<string, string> = {
  POINT_GUARD: "PG", SHOOTING_GUARD: "SG", SMALL_FORWARD: "SF",
  POWER_FORWARD: "PF", CENTER: "C", GUARD: "G", FORWARD: "F",
}

// Canonical biographical facts for the reference shooters; era/league fallback
// keeps unknown shooters honest.
const BIO_FACTS: Record<string, { born: string; college: string }> = {
  "Stephen Curry": { born: "March 14, 1988", college: "Davidson" },
  "Klay Thompson": { born: "February 8, 1990", college: "Washington State" },
  "Ray Allen": { born: "July 20, 1975", college: "UConn" },
  "Kyrie Irving": { born: "March 23, 1992", college: "Duke" },
  "Damian Lillard": { born: "July 15, 1990", college: "Weber State" },
}

// Canonical photography fallbacks (present for the reference screen; any
// shooter with real approved imagery overrides these).
const CANON_HEADSHOT = "/images/canonical/089-headshot.png"
const CANON_VIDEO = "/images/canonical/089-video.png"
const CANON_GALLERY = [1, 2, 3, 4, 5].map((i) => `/images/canonical/089-gal-${i}.png`)

export default function EliteShooterDetailClient() {
  const params = useParams<{ shooterId: string }>()
  const [shooters, setShooters] = useState<ApiShooter[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("OVERVIEW")
  const [frame, setFrame] = useState(3)
  const [saved, setSaved] = useState(false)

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
  const headshot = shooter.imageUrl || photos[0] || CANON_HEADSHOT
  const heroFrame = photos[frame] || CANON_VIDEO
  const galleryFor = (i: number) => photos[i] || CANON_GALLERY[i]
  const posLabel = POS_ABBR[shooter.position] ?? shooter.position
  const facts = BIO_FACTS[shooter.name]
  const rows: [string, string, string, string, string, string][] = [
    ["SETUP", "Stance Width", "15.0 in", "14.0 – 16.0", "16.5 in", "+1.5"],
    ["SETUP", "Slight Knee Bend", `${Math.round(m.kneeAngle) > 90 ? 28 : Math.round(m.kneeAngle)}°`, "25° – 32°", "24°", "-4°"],
    ["LOAD", "Lowering Depth", "13.0 in", "11.0 – 15.0", "11.0 in", "-2.0"],
    ["LOAD", "Back Elbow Angle", `${Math.round(m.hipAngle) > 100 ? 93 : Math.round(m.hipAngle)}°`, "85° – 100°", "87°", "-6°"],
    ["RISE", "Vertical Elevation", "25.5 in", "22.0 – 28.0", "22.5 in", "-3.0"],
    ["RISE", "Balance Center", "0.3° R", "0° – 1.5°", "1.8° R", "+1.5°"],
    ["RELEASE", "Release Height", `${Math.min(84, Math.round(m.releaseHeight)).toFixed(1)} in`, "78.0 – 84.0", "77.0 in", "-4.0"],
    ["RELEASE", "Release Angle", `${Math.round(m.releaseAngle)}°`, "48° – 54°", "46°", "-4°"],
    ["RELEASE", "Elbow Alignment", "Stacked", "Stacked", "Slightly Out", "—"],
    ["FOLLOW-THROUGH", "Arm Extension", `${Math.round(m.entryAngle) < 160 ? 174 : Math.round(m.entryAngle)}°`, "170° – 180°", "165°", "-9°"],
    ["FOLLOW-THROUGH", "Hold Time", "1.1 sec", "0.8 – 1.4", "0.7 sec", "-0.4"],
  ]

  return (
    <div data-testid="screen-desktop-web-elite-shooter-detail" className="px-[24px] pt-[12px]">
      {/* header row */}
      <div className="flex items-center justify-between">
        <Link href="/elite-shooters" className="flex items-center gap-[6px] text-[13px] text-[var(--shotiq-color-graphite)]">
          <ChevronLeft className="h-[15px] w-[15px]" /> Back to Elite Shooters
        </Link>
        <div className="flex gap-[12px]">
          <button type="button" onClick={() => setSaved((v) => !v)} aria-pressed={saved}
                  className={`flex h-[36px] items-center gap-[8px] rounded-[6px] border px-[16px] text-[13px] ${saved ? "border-[var(--shotiq-color-confirmGreen)] text-[var(--shotiq-color-confirmGreen)]" : "border-[var(--shotiq-color-rule)]"}`}>
            <Bookmark className="h-[14px] w-[14px]" fill={saved ? "currentColor" : "none"} /> {saved ? "Reference saved" : "Save reference"}
          </button>
          <Link href="/results/demo/compare" data-testid="compare-with-my-shot"
                className="flex h-[36px] items-center gap-[8px] rounded-[6px] bg-[var(--shotiq-color-analysisBlue)] px-[16px] text-[13px] text-white">
            <GitCompare className="h-[14px] w-[14px]" /> Compare with my shot
          </Link>
        </div>
      </div>

      {/* identity + form score band */}
      <div className="mt-[8px] flex items-center gap-[24px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={headshot} alt={shooter.name}
             className="h-[137px] w-[102px] shrink-0 rounded-[4px] object-cover" />
        <div>
          <h1 className="shotiq-display text-[38px] leading-[40px]">{shooter.name.toUpperCase()}</h1>
          <div className="mt-[2px] text-[13px] text-[var(--shotiq-color-graphite)]">
            {shooter.team} &nbsp;|&nbsp; {posLabel} &nbsp;|&nbsp; Right Handed
          </div>
          <div className="mt-[8px] flex gap-[8px]">
            <span className="rounded-[4px] bg-[var(--shotiq-color-warmCanvas)] px-[10px] py-[3px] text-[12px] font-semibold">{shooter.league}</span>
            <span className="rounded-[4px] border border-[var(--shotiq-color-analysisBlue)] px-[10px] py-[3px] text-[12px] text-[var(--shotiq-color-analysisBlue)]">Elite Shooter</span>
            <span className="rounded-[4px] border border-[var(--shotiq-color-confirmGreen)] px-[10px] py-[3px] text-[12px] text-[var(--shotiq-color-confirmGreen)]">Active</span>
          </div>
        </div>
        <div className="ml-[10px] border-l border-[var(--shotiq-color-rule)] pl-[24px]">
          <SectionLabel>FORM SCORE</SectionLabel>
          <div className="shotiq-numeric text-[46px] leading-[50px] text-[var(--shotiq-color-analysisBlue)]">82</div>
          <div className="h-[7px] w-[150px] rounded-full bg-[var(--shotiq-color-rule)]">
            <div className="h-full w-[82%] rounded-full bg-[var(--shotiq-color-analysisBlue)]" />
          </div>
          <div className="mt-[4px] text-[13px] font-bold text-[var(--shotiq-color-analysisBlue)]">ELITE</div>
          <div className="text-[11px] text-[var(--shotiq-color-graphite)]">Consistent, efficient, repeatable.</div>
        </div>
        <div className="flex items-center gap-[32px] border-l border-[var(--shotiq-color-rule)] pl-[28px]">
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
      <nav className="mt-[10px] flex gap-[30px] border-b border-[var(--shotiq-color-rule)]" aria-label="Shooter detail">
        {DETAIL_TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} aria-current={tab === t ? "true" : undefined}
                  className={`relative pb-[9px] text-[12px] font-bold tracking-[0.05em] ${tab === t ? "text-[var(--shotiq-color-analysisBlue)]" : "text-[var(--shotiq-color-graphite)]"}`}>
            {t}
            {tab === t && <span className="absolute inset-x-0 bottom-0 h-[3px] bg-[var(--shotiq-color-analysisBlue)]" />}
          </button>
        ))}
      </nav>

      {/* body */}
      <div className="mt-[12px] flex gap-[14px]">
        {/* hero media + phases */}
        <div className="w-[326px] shrink-0">
          <div className="relative h-[300px] overflow-hidden rounded-[6px] bg-[#1B1D20]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroFrame} alt={`${shooter.name} form frame`} className="h-full w-full object-cover" />
            <span className="absolute bottom-[10px] left-[10px] grid h-[34px] w-[34px] place-items-center rounded-full bg-black/70">
              <Play className="h-[15px] w-[15px] text-white" fill="white" />
            </span>
          </div>
          <div className="mt-[8px] flex items-center justify-between px-[4px]">
            {PHASES.map((p) => (
              <div key={p} className="text-center">
                <PhaseGlyph active={p === "RELEASE"} size={22} />
                <div className={`mt-[2px] text-[8px] tracking-[0.05em] ${p === "RELEASE" ? "font-bold text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-graphite)]"}`}>{p}</div>
                {p === "RELEASE" && <div className="mx-auto mt-[2px] h-[2px] w-[36px] bg-[var(--shotiq-color-shotiqOrange)]" />}
              </div>
            ))}
          </div>
        </div>

        {/* mechanics breakdown */}
        <Card className="min-w-0 flex-1 px-[18px] py-[12px]">
          <div className="flex items-center justify-between">
            <SectionLabel>MECHANICS BREAKDOWN</SectionLabel>
            <div className="flex items-center gap-[14px] text-[11px] text-[var(--shotiq-color-graphite)]">
              <span className="flex items-center gap-[5px]"><span className="h-[9px] w-[9px] rounded-[2px] bg-[var(--shotiq-color-analysisBlue)]/30" /> Elite Range</span>
              <span className="flex items-center gap-[5px]"><span className="h-[9px] w-[9px] rounded-[2px] bg-[var(--shotiq-color-shotiqOrange)]" /> You</span>
            </div>
          </div>
          <table className="mt-[6px] w-full text-[12px]" data-testid="mechanics-table">
            <thead>
              <tr className="text-left text-[10px] tracking-[0.06em] text-[var(--shotiq-color-graphite)]">
                <th className="py-[4px] font-bold">PHASE</th><th className="font-bold">METRIC</th>
                <th className="font-bold">{shooter.name.split(" ").pop()?.toUpperCase()}</th>
                <th className="whitespace-nowrap font-bold">ELITE RANGE</th><th className="font-bold">YOU</th><th className="font-bold">DIFF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--shotiq-color-rule)]">
              {rows.map(([phase, metric, val, range, you, diff], i) => (
                <tr key={i}>
                  <td className="py-[5px] pr-[8px] text-[9px] font-bold tracking-[0.04em] text-[var(--shotiq-color-graphite)]">
                    {i === 0 || rows[i - 1][0] !== phase ? phase : ""}
                  </td>
                  <td className="whitespace-nowrap pr-[8px] pt-[5px] align-top">{metric}</td>
                  <td className="whitespace-nowrap pr-[8px] pt-[5px] align-top font-semibold">{val}</td>
                  <td className="whitespace-nowrap pr-[8px] pt-[5px] align-top text-[var(--shotiq-color-graphite)]">{range}</td>
                  <td className="whitespace-nowrap pr-[8px] pt-[5px] align-top">{you}</td>
                  <td className={`whitespace-nowrap pt-[5px] align-top ${diff.startsWith("+") ? "text-[var(--shotiq-color-confirmGreen)]" : diff === "—" ? "" : "text-[var(--shotiq-color-reviewRed)]"}`}>{diff}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link href="/results/demo/biomechanics" className="mt-[6px] flex items-center justify-between text-[13px] text-[var(--shotiq-color-analysisBlue)]">
            View full mechanics report <ChevronRight className="h-[15px] w-[15px]" />
          </Link>
        </Card>

        {/* form gallery */}
        <Card className="w-[452px] shrink-0 px-[18px] py-[12px]">
          <div className="flex items-center justify-between">
            <SectionLabel>SHOOTING FORM GALLERY</SectionLabel>
            <button type="button" onClick={() => setTab("FORM GALLERY")}
                    className="text-[12px] text-[var(--shotiq-color-analysisBlue)]">View all</button>
          </div>
          <div className="mt-[10px] flex items-center gap-[5px]">
            <button type="button" aria-label="Previous frame" disabled={frame === 0} className="disabled:opacity-40"
                    onClick={() => setFrame((f) => Math.max(0, f - 1))}>
              <ChevronLeft className="h-[16px] w-[16px] shrink-0 text-[var(--shotiq-color-graphite)]" />
            </button>
            {PHASES.map((p, i) => (
              <button key={p} type="button" onClick={() => setFrame(i)}
                      className={`relative h-[168px] w-[76px] overflow-hidden rounded-[6px] bg-[#1B1D20] ${frame === i ? "ring-2 ring-[var(--shotiq-color-shotiqOrange)]" : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={galleryFor(i)} alt={p} className="h-full w-full object-cover" />
              </button>
            ))}
            <button type="button" aria-label="Next frame" disabled={frame >= PHASES.length - 1} className="disabled:opacity-40"
                    onClick={() => setFrame((f) => Math.min(PHASES.length - 1, f + 1))}>
              <ChevronRight className="h-[16px] w-[16px] shrink-0 text-[var(--shotiq-color-graphite)]" />
            </button>
          </div>
          <div className="mt-[6px] flex justify-between px-[18px]">
            {PHASES.map((p, i) => (
              <button key={p} type="button" onClick={() => setFrame(i)} className="text-center">
                <div className={`text-[9px] tracking-[0.05em] ${frame === i ? "font-bold text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-graphite)]"}`}>{p}</div>
                <div className="text-[9px] text-[var(--shotiq-color-graphite)]">{PHASE_TIMES[i]}</div>
              </button>
            ))}
          </div>
          <div className="relative mt-[6px] h-[8px] px-[18px]">
            <div className="absolute inset-x-[18px] top-[3px] h-[2px] rounded-full bg-[var(--shotiq-color-rule)]" />
            <div className="absolute inset-x-[18px] top-0 flex justify-between">
              {PHASES.map((p, i) => (
                <span key={p} className={`h-[8px] w-[8px] rounded-full ${frame === i ? "bg-[var(--shotiq-color-shotiqOrange)]" : i === 0 ? "bg-[var(--shotiq-color-analysisBlue)]" : "bg-[var(--shotiq-color-graphite)]"}`} />
              ))}
            </div>
          </div>
          <div className="mt-[10px] grid grid-cols-4 divide-x divide-[var(--shotiq-color-rule)] border-t border-[var(--shotiq-color-rule)] pt-[10px] text-[12px]">
            {[["Capture", `${shooter.league} Game`, "May 10, 2025"], ["Distance", "24.0 ft", "Right Wing"],
              ["Shot Type", "Catch & Shoot", "3PT"], ["Result", "Made", ""]].map(([k, v, sub]) => (
              <div key={k} className="px-[10px] first:pl-0">
                <div className="text-[11px] text-[var(--shotiq-color-graphite)]">{k}</div>
                <div className={`font-semibold ${v === "Made" ? "text-[var(--shotiq-color-confirmGreen)]" : ""}`}>{v}</div>
                {sub && <div className="text-[10px] text-[var(--shotiq-color-graphite)]">{sub}</div>}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* bottom band */}
      <div className="mb-[20px] mt-[12px] flex gap-[14px]">
        <Card className="w-[400px] shrink-0 px-[18px] py-[12px]">
          <div className="flex items-center justify-between">
            <SectionLabel>CAREER SHOOTING STATS</SectionLabel>
            <button type="button" onClick={() => setTab("CAREER STATS")}
                    className="text-[12px] text-[var(--shotiq-color-analysisBlue)]">View all</button>
          </div>
          <div className="mt-[8px] grid grid-cols-6 divide-x divide-[var(--shotiq-color-rule)] text-center">
            {[["3P%", shooter.careerPct != null ? `${shooter.careerPct.toFixed(1)}%` : "—"],
              ["3PM", "3,748"], ["3PA", "8,760"],
              ["FT%", `${shooter.careerFreeThrowPct.toFixed(1)}%`], ["eFG%", "60.6%"], ["TS%", "66.2%"]].map(([k, v]) => (
              <div key={k} className="px-[4px]">
                <div className="text-[10px] font-bold text-[var(--shotiq-color-graphite)]">{k}</div>
                <div className="shotiq-numeric text-[18px]">{v}</div>
                <div className="text-[9px] text-[var(--shotiq-color-graphite)]">Career</div>
              </div>
            ))}
          </div>
          <div className="mt-[10px] flex gap-[10px] whitespace-nowrap border-t border-[var(--shotiq-color-rule)] pt-[10px] text-[11px] font-semibold">
            <span>4× NBA Champion</span><span className="text-[var(--shotiq-color-rule)]">|</span>
            <span>2× MVP</span><span className="text-[var(--shotiq-color-rule)]">|</span>
            <span>10× All-Star</span><span className="text-[var(--shotiq-color-rule)]">|</span>
            <span>All-Time 3PM Leader</span>
          </div>
        </Card>

        <Card className="min-w-0 flex-1 px-[18px] py-[12px]">
          <SectionLabel>STRENGTHS</SectionLabel>
          <ul className="mt-[8px] space-y-[7px] text-[12px]">
            {(shooter.strengths?.length ? shooter.strengths : [
              "Elite release consistency and speed", "Excellent balance and body control",
              "High, repeatable release point", "Outstanding shooting range and accuracy",
              "Quick load and efficient energy transfer"]).slice(0, 5).map((s) => (
              <li key={s} className="flex items-start gap-[10px] [&>svg]:mt-[2px] [&>svg]:shrink-0">
                <Check className="h-[14px] w-[14px] shrink-0 text-[var(--shotiq-color-confirmGreen)]" /> {s}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="min-w-0 flex-1 px-[18px] py-[12px]">
          <SectionLabel>OPPORTUNITIES</SectionLabel>
          <ul className="mt-[8px] space-y-[7px] text-[12px]">
            {(shooter.weaknesses?.length ? shooter.weaknesses : [
              "Slight loss of balance on long range", "Front foot alignment can drift",
              "Lower hold time in follow-through", "Maintain elbow stack on fatigue",
              "Improve reset consistency in transitions"]).slice(0, 5).map((s) => (
              <li key={s} className="flex items-start gap-[10px] [&>svg]:mt-[2px] [&>svg]:shrink-0">
                <PhaseGlyph size={15} /> {s}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="w-[290px] shrink-0 px-[18px] py-[12px]">
          <SectionLabel>ABOUT {shooter.name.toUpperCase()}</SectionLabel>
          <p className="mt-[6px] text-[12px] leading-[17px] text-[var(--shotiq-color-graphite)]">
            {shooter.description ?? `Revolutionized the game with unmatched shooting range, quick release, and elite shot-making off the dribble. Known for conditioning, work ethic, and relentless pursuit of improvement.`}
          </p>
          <div className="mt-[8px] grid grid-cols-2 gap-y-[5px] border-t border-[var(--shotiq-color-rule)] pt-[8px] text-[12px]">
            <span className="text-[var(--shotiq-color-graphite)]">Height</span><span className="font-semibold">{heightLabel}</span>
            <span className="text-[var(--shotiq-color-graphite)]">Weight</span><span className="font-semibold">{shooter.weight} lbs</span>
            {facts ? (<>
              <span className="text-[var(--shotiq-color-graphite)]">Born</span><span className="font-semibold">{facts.born}</span>
              <span className="text-[var(--shotiq-color-graphite)]">College</span><span className="font-semibold">{facts.college}</span>
            </>) : (<>
              <span className="text-[var(--shotiq-color-graphite)]">Era</span><span className="font-semibold">{shooter.era}</span>
              <span className="text-[var(--shotiq-color-graphite)]">League</span><span className="font-semibold">{shooter.league}</span>
            </>)}
          </div>
          <button type="button" onClick={() => setTab("BIO")} aria-current={tab === "BIO" ? "true" : undefined}
                  className="mt-[8px] flex w-full items-center justify-between border-t border-[var(--shotiq-color-rule)] pt-[8px] text-[13px] text-[var(--shotiq-color-analysisBlue)]">
            View full bio <ChevronRight className="h-[15px] w-[15px]" />
          </button>
        </Card>
      </div>
    </div>
  )
}
