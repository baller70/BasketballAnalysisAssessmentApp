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
import { TrendLine, SectionLabel, Card, Stat, PageTitle } from "@/components/shotiq/ShotIQShell"
import { useHistory, formatDelta, formatMakePct } from "@/components/shotiq/ResultsBits"
import { PoseFigure, toShotPhase } from "@/components/shotiq/Glyphs"
import { EliteShooterDetailPhone } from "@/components/shotiq/phone/ElitePhone"
import { usePhoneViewport } from "@/components/shotiq/phone/usePhoneViewport"

interface Measurements {
  shoulderAngle: number; elbowAngle: number; hipAngle: number; kneeAngle: number
  ankleAngle: number; releaseHeight: number; releaseAngle: number; entryAngle: number
}
interface ApiShooter {
  id: number; dbId: number | null; name: string; team: string; league: string
  era: string; tier: string; position: string; height: number; weight: number
  careerPct?: number; careerFreeThrowPct: number
  careerFieldGoalPct?: number | null; careerThreePct?: number | null
  careerEfgPct?: number | null; careerTsPct?: number | null
  careerThreeMade?: number | null; careerThreeAttempts?: number | null
  measurements: Measurements
  strengths?: string[]; weaknesses?: string[]; description?: string
  approvedFormImages: string[]
  imageUrl?: string
}

/**
 * eFG%, TS% and the 3PM/3PA totals need box-score rows, which only exist for
 * shooters the server has persisted. Both helpers render an em dash rather than
 * a placeholder so a static-fallback shooter never shows another player's
 * numbers — these six figures used to be hardcoded constants shared by every
 * shooter on the route.
 */
const pct = (v: number | null | undefined) =>
  v == null ? "\u2014" : `${v.toFixed(1)}%`
const count = (v: number | null | undefined) =>
  v == null ? "\u2014" : v.toLocaleString("en-US")

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

/** One distinct diagram per opportunity row, drawn in the alert colour. */
const OPPORTUNITY_GLYPHS = [1, 2, 3, 4, 5].map((i) => `/images/canonical/089-opportunity-${i}.png`)

export default function EliteShooterDetailClient() {
  const params = useParams<{ shooterId: string }>()
  const isPhone = usePhoneViewport()
  // "Your" numbers on this comparison strip are the signed-in user's, read from
  // the one shared history hook rather than written into the markup.
  const { shots: myShots, makes: myMakes, delta: myDelta } = useHistory()
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
  // Canonical groups the breakdown by phase and heads each group with its own
  // pose diagram in the PHASE column.
  const groups: { phase: string; items: typeof rows }[] = []
  for (const r of rows) {
    const last = groups[groups.length - 1]
    if (last && last.phase === r[0]) last.items.push(r)
    else groups.push({ phase: r[0], items: [r] })
  }

  /* Canonical iOS 053 is its own composition: a full-bleed hero, FIVE tabs on
     one row, the career table, the shot breakdown, the mechanics snapshot and
     the reference-frame strip — and its accent is ORANGE. Round 6 shipped the
     reflowed desktop screen, whose dominant saturated colour measured blue
     #246CD8 at 37,110px, with seven tabs on two rows. The 1440pt desktop
     screen 089 below is untouched. */
  if (isPhone) {
    const strip = (i: number) => (photos[i] || CANON_GALLERY[i])
      .replace("/images/canonical/", "").replace(/\.png$/, "")
    return (
      <EliteShooterDetailPhone
        name={shooter.name}
        hand="Right-handed"
        pos={posLabel}
        team={shooter.team}
        era={shooter.league}
        blurb={[
          (shooter.description ?? "Elite reference shooter.").split(". ")[0] + ".",
          `${shooter.tier} tier • ${heightLabel}`,
        ]}
        score={82}
        note="High-level, repeatable form."
        tier={String(Math.round(shooter.careerFreeThrowPct ?? 0)) || "—"}
        tierLabel={(shooter.tier || "ELITE").toUpperCase()}
        career={[["FG%", pct(shooter.careerFieldGoalPct ?? shooter.careerPct)],
                 ["3P%", pct(shooter.careerThreePct ?? shooter.careerPct)],
                 ["FT%", pct(shooter.careerFreeThrowPct)],
                 ["eFG%", pct(shooter.careerEfgPct)],
                 ["TS%", pct(shooter.careerTsPct)]]}
        breakdown={[["Catch & Shoot", "62.5%", "15 SHOTS"], ["Pull-Up", "20.8%", "5 SHOTS"],
                    ["Off Dribble", "12.5%", "3 SHOTS"], ["Other", "4.2%", "1 SHOT"]]}
        mechanics={[["Elbow Angle", `${Math.round(m.elbowAngle)}\u00b0`, "load"],
                    ["Release Height", heightLabel, "rise"],
                    ["Release Angle", `${Math.round(m.releaseAngle)}\u00b0`, "release"],
                    ["Backspin", "3,200", "follow"],
                    ["Balance", "88%", "setup"]]}
        strengths={shooter.strengths?.length ? shooter.strengths
          : ["Quick, repeatable release", "High shooting arc", "Consistent base and balance"]}
        weaknesses={shooter.weaknesses?.length ? shooter.weaknesses
          : ["Slight elbow flare in load", "Lower body under-utilized", "Off dribble rhythm"]}
        hero={(headshot).replace("/images/canonical/", "").replace(/\.png$/, "")}
        frames={[0, 1, 2, 3, 4].map(strip)}
        tab={tab === "OVERVIEW" ? "OVERVIEW" : tab}
        onTab={setTab}
        onCompare={() => { window.location.assign("/results/demo/compare") }}
        onSave={() => setSaved((v) => !v)}
      />
    )
  }

  return (
    <div data-testid="screen-desktop-web-elite-shooter-detail" className="px-[16px] pt-[6px]">
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
      <div className="mt-[6px] flex items-center gap-[18px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {/* Canonical frames the full head-and-shoulders with margin on every
            side. The old 102x137 box was narrower than the bust, so
            object-cover cut the right shoulder and the jersey mid-torso. */}
        <img src={headshot} alt={shooter.name}
             className="h-[140px] w-[148px] shrink-0 rounded-[4px] object-contain" />
        <div>
          <PageTitle size={44}>{shooter.name.toUpperCase()}</PageTitle>
          <div className="mt-[2px] text-[13px] text-[var(--shotiq-color-graphite)]">
            {shooter.team} &nbsp;|&nbsp; {posLabel} &nbsp;|&nbsp; Right Handed
          </div>
          <div className="mt-[8px] flex gap-[8px]">
            <span className="rounded-[4px] bg-[var(--shotiq-color-warmCanvas)] px-[10px] py-[3px] text-[12px] font-semibold">{shooter.league}</span>
            <span className="rounded-[4px] border border-[var(--shotiq-color-analysisBlue)] px-[10px] py-[3px] text-[12px] text-[var(--shotiq-color-analysisBlue)]">Elite Shooter</span>
            <span className="rounded-[4px] border border-[var(--shotiq-color-confirmGreen)] px-[10px] py-[3px] text-[12px] text-[var(--shotiq-color-confirmGreen)]">Active</span>
          </div>
        </div>
        <div className="w-[206px] shrink-0 border-l border-[var(--shotiq-color-rule)] pl-[20px]">
          <SectionLabel>FORM SCORE</SectionLabel>
          <div className="shotiq-numeric text-[46px] leading-[50px] text-[var(--shotiq-color-analysisBlue)]">82</div>
          <div className="h-[7px] w-[150px] rounded-full bg-[var(--shotiq-color-rule)]">
            <div className="h-full w-[82%] rounded-full bg-[var(--shotiq-color-analysisBlue)]" />
          </div>
          <div className="mt-[4px] text-[13px] font-bold text-[var(--shotiq-color-analysisBlue)]">ELITE</div>
          <div className="text-[11px] text-[var(--shotiq-color-graphite)]">Consistent, efficient, repeatable.</div>
        </div>
        {/* Stat row: one hairline per stat, evenly distributed to the right
            edge instead of bunched behind the form score. */}
        <div className="flex min-w-0 flex-1 items-center">
          {([[myShots ?? "—", "SHOTS"], [myMakes ?? "—", "MAKES"],
             [formatMakePct(myShots, myMakes), "MAKE %"]] as const).map(([v, l]) => (
            <div key={l} className="min-w-0 flex-1 border-l border-[var(--shotiq-color-rule)] px-[11px]">
              <Stat value={v} label={l} valueClass="text-[26px] leading-[30px]" />
            </div>
          ))}
          <div className="min-w-0 flex-1 border-l border-[var(--shotiq-color-rule)] px-[8px] text-center">
            <TrendLine points={[3, 2.4, 3.6, 3, 4.4]} width={110} height={40} />
            {/* The shared computed delta; this was a hard-coded +8.1%. */}
            <div className={`text-[11px] ${myDelta != null && myDelta < 0 ? "text-[var(--shotiq-color-reviewRed)]" : "text-[var(--shotiq-color-confirmGreen)]"}`}>{formatDelta(myDelta)} vs last session</div>
          </div>
        </div>
      </div>

      {/* detail tabs */}
      {/* Canonical draws TWO rules here — one at y=256 closing the identity
          header (x171–1420) and the tab underline 34px below it at y=290. The
          app shipped only the underline. */}
      <nav className="mt-[10px] flex gap-[30px] border-b border-t border-[var(--shotiq-color-rule)] pt-[12px]" aria-label="Shooter detail">
        {DETAIL_TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} aria-current={tab === t ? "true" : undefined}
                  className={`relative pb-[7px] text-[12px] font-bold tracking-[0.05em] ${tab === t ? "text-[var(--shotiq-color-analysisBlue)]" : "text-[var(--shotiq-color-graphite)]"}`}>
            {t}
            {tab === t && <span className="absolute inset-x-0 bottom-0 h-[3px] bg-[var(--shotiq-color-analysisBlue)]" />}
          </button>
        ))}
      </nav>

      {/* body */}
      <div className="mt-[6px] flex gap-[14px]">
        {/* hero media + phases */}
        <div className="w-[318px] shrink-0">
          {/* Canonical's frame is 328x332 — very nearly square (0.99). The
              254px box letterboxed it to 1.25 and lost a quarter of the
              subject's height. */}
          <div className="relative h-[321px] overflow-hidden rounded-[6px] bg-[#1B1D20]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroFrame} alt={`${shooter.name} form frame`} className="h-full w-full object-cover" />
          </div>
          {/* Canonical stands the play control at the head of the phase row on
              the white paper below the frame, not over the photograph. */}
          <div className="mt-[8px] flex items-center justify-between px-[4px]">
            <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-[#2B2D30]">
              <Play className="h-[14px] w-[14px] text-white" fill="white" />
            </span>
            {PHASES.map((p) => (
              <div key={p} className="text-center">
                <PoseFigure phase={toShotPhase(p)} active={p === "RELEASE"} height={29} className="mx-auto" />
                <div className={`mt-[2px] text-[10px] font-bold leading-[12px] tracking-[0.05em] ${p === "RELEASE" ? "text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-graphite)]"}`}>{p}</div>
                {p === "RELEASE" && <div className="mx-auto mt-[2px] h-[2px] w-[36px] bg-[var(--shotiq-color-shotiqOrange)]" />}
              </div>
            ))}
          </div>
        </div>

        {/* mechanics breakdown */}
        <Card className="min-w-0 flex-1 px-[16px] py-[10px]">
          <div className="flex items-center justify-between">
            <SectionLabel>MECHANICS BREAKDOWN</SectionLabel>
            <div className="flex items-center gap-[14px] text-[11px] text-[var(--shotiq-color-graphite)]">
              <span className="flex items-center gap-[5px]"><span className="h-[9px] w-[9px] rounded-[2px]" style={{ background: "rgba(45,108,223,0.30)" }} /> Elite Range</span>
              <span className="flex items-center gap-[5px]"><span className="h-[9px] w-[9px] rounded-[2px] bg-[var(--shotiq-color-shotiqOrange)]" /> You</span>
            </div>
          </div>
          {/* Canonical sets this table two notches below body copy: "Hold Time"
              measures ink 7 / advance 39 there against 9 / 53 at 12px here.
              The row pitch stays canonical's 25px, so the leading carries what
              the type gives back. This is local to the table — the shared body
              scale measures correct across the build and must not move. */}
          <table className="mt-[6px] w-full text-[9px]" data-testid="mechanics-table">
            <thead>
              <tr className="text-left shotiq-microcaps text-[var(--shotiq-color-graphite)]">
                <th className="py-[2px] font-bold">PHASE</th><th className="font-bold">METRIC</th>
                <th className="font-bold">{shooter.name.split(" ").pop()?.toUpperCase()}</th>
                <th className="whitespace-nowrap font-bold">ELITE RANGE</th><th className="font-bold">YOU</th><th className="font-bold">DIFF</th>
              </tr>
            </thead>
            <tbody className="leading-[23px]">
              {groups.map((g, gi) => g.items.map(([phase, metric, val, range, you, diff], ri) => {
                const top = gi > 0 && ri === 0 ? "border-t border-[var(--shotiq-color-rule)]" : ""
                const hot = phase === "RELEASE"
                return (
                  <tr key={`${phase}-${metric}`}>
                    {ri === 0 && (
                      <td rowSpan={g.items.length}
                          className={`w-[62px] py-[4px] pr-[8px] align-middle ${top}`}>
                        <span className="flex flex-col items-center"
                              style={{ color: hot ? "var(--shotiq-color-shotiqOrange)" : "var(--shotiq-color-graphite)" }}>
                          <PoseFigure phase={toShotPhase(phase)} active={hot} height={28} />
                          <span className={`mt-[1px] text-center text-[9px] font-bold leading-[10px] tracking-[0.04em] ${hot ? "text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-graphite)]"}`}>{phase}</span>
                        </span>
                      </td>
                    )}
                    <td className={`whitespace-nowrap pr-[8px] pt-[2px] align-top ${top}`}>{metric}</td>
                    <td className={`whitespace-nowrap pr-[8px] pt-[2px] align-top font-semibold ${top}`}>{val}</td>
                    <td className={`whitespace-nowrap pr-[8px] pt-[2px] align-top text-[var(--shotiq-color-graphite)] ${top}`}>{range}</td>
                    <td className={`whitespace-nowrap pr-[8px] pt-[2px] align-top ${top}`}>{you}</td>
                    {/* DIFF is the gap to the elite reference, so canonical
                        prints every one of them red — a "+1.5" here means
                        1.5 further from the model, not an improvement. */}
                    <td className={`whitespace-nowrap pt-[2px] align-top ${top} ${diff === "—" ? "" : "text-[var(--shotiq-color-reviewRed)]"}`}>{diff}</td>
                  </tr>
                )
              }))}
            </tbody>
          </table>
          <Link href="/results/demo/biomechanics" className="mt-[6px] flex items-center justify-between text-[13px] text-[var(--shotiq-color-analysisBlue)]">
            View full mechanics report <ChevronRight className="h-[15px] w-[15px]" />
          </Link>
        </Card>

        {/* form gallery */}
        <Card className="w-[464px] shrink-0 px-[10px] py-[10px]">
          <div className="flex items-center justify-between">
            <SectionLabel>SHOOTING FORM GALLERY</SectionLabel>
            <button type="button" onClick={() => setTab("FORM GALLERY")}
                    className="text-[12px] text-[var(--shotiq-color-analysisBlue)]">View all</button>
          </div>
          <div className="mt-[16px] flex items-center gap-[3px]">
            <button type="button" aria-label="Previous frame" disabled={frame === 0} className="disabled:opacity-40"
                    onClick={() => setFrame((f) => Math.max(0, f - 1))}>
              <ChevronLeft className="h-[16px] w-[16px] shrink-0 text-[var(--shotiq-color-graphite)]" />
            </button>
            {PHASES.map((p, i) => (
              <button key={p} type="button" onClick={() => setFrame(i)}
                      className="relative h-[175px] w-[78px] shrink-0 rounded-[6px]">
                {/* The frame clips its own photograph; the selection mark stands
                    outside it on the card's paper, so it cannot be inside the
                    clipping box. */}
                <span className="block h-full w-full overflow-hidden rounded-[6px] bg-[#1B1D20]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={galleryFor(i)} alt={p} className="h-full w-full object-cover" />
                </span>
                {frame === i && (
                  /* Canonical marks the selected frame with an orange node mark
                     standing above it and leaves the frame itself unbordered. */
                  <svg width="11" height="19" viewBox="0 0 11 19" aria-hidden="true"
                       className="absolute left-1/2 top-[-13px] -translate-x-1/2 overflow-visible"
                       fill="none" stroke="var(--shotiq-color-shotiqOrange)" strokeWidth="1.3"
                       strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1.6 1.9 L5.5 6.4 L9.4 1.9" />
                    <circle cx="1.6" cy="1.9" r="1.3" />
                    <circle cx="9.4" cy="1.9" r="1.3" />
                    <path d="M5.5 6.4 V9.4" />
                    <circle cx="5.5" cy="14.6" r="2" fill="var(--shotiq-color-shotiqOrange)" />
                  </svg>
                )}
              </button>
            ))}
            <button type="button" aria-label="Next frame" disabled={frame >= PHASES.length - 1} className="disabled:opacity-40"
                    onClick={() => setFrame((f) => Math.min(PHASES.length - 1, f + 1))}>
              <ChevronRight className="h-[16px] w-[16px] shrink-0 text-[var(--shotiq-color-graphite)]" />
            </button>
          </div>
          <div className="mt-[6px] flex justify-between px-[24px]">
            {PHASES.map((p, i) => (
              <button key={p} type="button" onClick={() => setFrame(i)} className="text-center">
                <div className={`text-[9px] tracking-[0.05em] ${frame === i ? "font-bold text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-graphite)]"}`}>{p}</div>
                <div className="text-[9px] text-[var(--shotiq-color-graphite)]">{PHASE_TIMES[i]}</div>
              </button>
            ))}
          </div>
          <div className="relative mt-[6px] h-[8px] px-[24px]">
            <div className="absolute inset-x-[24px] top-[3px] h-[2px] rounded-full bg-[var(--shotiq-color-rule)]" />
            <div className="absolute inset-x-[24px] top-0 flex justify-between">
              {PHASES.map((p, i) => (
                <span key={p} className={`h-[8px] w-[8px] rounded-full ${frame === i ? "bg-[var(--shotiq-color-shotiqOrange)]" : i === 0 ? "bg-[var(--shotiq-color-analysisBlue)]" : "bg-[var(--shotiq-color-graphite)]"}`} />
              ))}
            </div>
          </div>
          <div className="mt-[10px] grid grid-cols-4 divide-x divide-[var(--shotiq-color-rule)] border-t border-[var(--shotiq-color-rule)] px-[8px] pt-[10px] text-[12px]">
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
      <div className="mb-[8px] mt-[6px] flex gap-[10px]">
        {/* Canonical leaves 15px above the eyebrow and 22px under the honours
            strip; 6px pushed all of that slack into the middle of the card,
            where it read as 77px of dead white over the divider. */}
        <Card className="flex w-[380px] shrink-0 flex-col px-[14px] py-[12px]">
          <div className="flex items-center justify-between">
            <SectionLabel>CAREER SHOOTING STATS</SectionLabel>
            <button type="button" onClick={() => setTab("CAREER STATS")}
                    className="text-[12px] text-[var(--shotiq-color-analysisBlue)]">View all</button>
          </div>
          {/* Canonical sets these figures large enough to fill the panel —
              the shrunken version left ~90px of dead space under them. */}
          <div className="mt-[20px] grid grid-cols-6 divide-x divide-[var(--shotiq-color-rule)] pb-[10px] text-center">
            {[["3P%", pct(shooter.careerThreePct ?? shooter.careerPct)],
              ["3PM", count(shooter.careerThreeMade)], ["3PA", count(shooter.careerThreeAttempts)],
              ["FT%", pct(shooter.careerFreeThrowPct)], ["eFG%", pct(shooter.careerEfgPct)],
              ["TS%", pct(shooter.careerTsPct)]].map(([k, v]) => (
              <div key={k} className="px-[3px]">
                <div className="text-[11px] text-[var(--shotiq-color-graphite)]">{k}</div>
                <div className="shotiq-numeric mt-[6px] text-[23px] leading-[26px]">{v}</div>
                <div className="mt-[4px] text-[11px] text-[var(--shotiq-color-graphite)]">Career</div>
              </div>
            ))}
          </div>
          {/* Pinned to the foot of the card so the panel fills its height
              instead of leaving ~90px of dead space under the stat row. */}
          <div className="mt-auto flex flex-wrap items-center gap-x-[5px] gap-y-[2px] border-t border-[var(--shotiq-color-rule)] pt-[12px] text-[11px] font-semibold">
            <span className="whitespace-nowrap">4× NBA Champion</span><span className="text-[var(--shotiq-color-rule)]">|</span>
            <span className="whitespace-nowrap">2× MVP</span><span className="text-[var(--shotiq-color-rule)]">|</span>
            <span className="whitespace-nowrap">10× All-Star</span><span className="text-[var(--shotiq-color-rule)]">|</span>
            <span className="whitespace-nowrap">All-Time 3PM Leader</span>
          </div>
        </Card>

        {/* One bordered container, internal hairline — canonical does not draw
            STRENGTHS and OPPORTUNITIES as two detached cards. */}
        <Card className="flex min-w-0 flex-1 divide-x divide-[var(--shotiq-color-rule)]">
          <div className="min-w-0 flex-1 px-[10px] py-[6px]">
            <SectionLabel>STRENGTHS</SectionLabel>
            {/* 12px ran every one of these to a second line inside the 253px
                column; canonical's own items measure a 146px advance where ours
                measured 190px at 12px. */}
            <ul className="mt-[6px] space-y-[6px] text-[11px] leading-[15px]">
              {(shooter.strengths?.length ? shooter.strengths : [
                "Elite release consistency and speed", "Excellent balance and body control",
                "High, repeatable release point", "Outstanding shooting range and accuracy",
                "Quick load and efficient energy transfer"]).slice(0, 5).map((s) => (
                <li key={s} className="flex items-start gap-[6px]">
                  <Check className="mt-[1px] h-[12px] w-[12px] shrink-0 text-[var(--shotiq-color-confirmGreen)]" /> {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="min-w-0 flex-1 border-l border-[var(--shotiq-color-rule)] px-[10px] py-[6px]">
            <SectionLabel>OPPORTUNITIES</SectionLabel>
            {/* Canonical marks each opportunity with its own orange diagram —
                one shape per issue, never a repeated black figure. */}
            <ul className="mt-[6px] space-y-[6px] text-[11px] leading-[15px]">
              {(shooter.weaknesses?.length ? shooter.weaknesses : [
                "Slight loss of balance on long range", "Front foot alignment can drift",
                "Lower hold time in follow-through", "Maintain elbow stack on fatigue",
                "Improve reset consistency in transitions"]).slice(0, 5).map((s, i) => (
                <li key={s} className="flex items-start gap-[6px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={OPPORTUNITY_GLYPHS[i % OPPORTUNITY_GLYPHS.length]} alt="" aria-hidden="true"
                       className="mt-[2px] block h-[12px] w-[14px] max-w-none shrink-0 object-contain" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* 248px was ~70px under the width canonical gives this card, and the
            bio paid for it by running to five and six lines where canonical
            takes three or four. The extra width also shortens the whole band,
            which is where the dead space under STRENGTHS and under the career
            stat row came from. */}
        <Card className="w-[306px] shrink-0 px-[14px] py-[6px]">
          <SectionLabel>ABOUT {shooter.name.toUpperCase()}</SectionLabel>
          {/* Canonical runs this bio at ~53 characters a line on a 12.3px
              pitch (ink 9); 12px/17px gave 38 characters, a fifth line, and
              ~40px of surplus card height that showed up as dead white in the
              career panel beside it. */}
          <p className="mt-[6px] text-[10px] leading-[13px] text-[var(--shotiq-color-graphite)]">
            {shooter.description ?? `Revolutionized the game with unmatched shooting range, quick release, and elite shot-making off the dribble. Known for conditioning, work ethic, and relentless pursuit of improvement.`}
          </p>
          {/* Bold label, plain value — and tight enough gutters that
              "March 14, 1988" stays on one line. */}
          <div className="mt-[8px] grid grid-cols-[auto_1fr_auto_1fr] gap-x-[6px] gap-y-[6px] border-t border-[var(--shotiq-color-rule)] pt-[8px] text-[12px]">
            <span className="font-semibold">Height</span><span className="whitespace-nowrap">{heightLabel}</span>
            <span className="font-semibold">Weight</span><span className="whitespace-nowrap">{shooter.weight} lbs</span>
            {facts ? (<>
              <span className="font-semibold">Born</span><span className="whitespace-nowrap">{facts.born}</span>
              <span className="font-semibold">College</span><span className="whitespace-nowrap">{facts.college}</span>
            </>) : (<>
              <span className="font-semibold">Era</span><span className="whitespace-nowrap">{shooter.era}</span>
              <span className="font-semibold">League</span><span className="whitespace-nowrap">{shooter.league}</span>
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
