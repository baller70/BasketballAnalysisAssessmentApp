"use client"

/**
 * Canonical iOS drill-library family — 056 discover drills and 058 my drills.
 *
 * Round 6 rendered these as ONE composition (`app-vs-app` mean absolute
 * difference 3.62 against 47.57 vs canonical, i.e. the same render with one
 * chip toggled) — a two-column card grid with black video placeholders where
 * canonical draws two unrelated designs, both list-shaped, both carrying real
 * photography.
 *
 * Measured off the 853x1844 canonical PNGs at 2.170483 px per pt.
 *
 * 056 — identity y 30-47; title cap 25; search 34pt + Filters 34pt;
 *       recommendation card 72pt with the node mark at 52 and three flaw chips
 *       under a hairline; four filter chips 26pt; sort row 18pt; list rows on a
 *       112pt pitch, each with a FOUR-FRAME photo strip 148x88 (canonical never
 *       draws a black tile here), a bookmark, three meta chips, a two-line
 *       description and a 26pt orange "View drill".
 * 058 — identity; "Analyze shot" 40pt orange; a THREE-TAB strip (TRAIN / MY
 *       DRILLS / ASSIGNED) with the active tab underlined orange; a count +
 *       sort + filter row; four cards on a 152pt pitch, each with a PORTRAIT
 *       photo 82x142, a mini phase rail, a four-cell stat row and a "Start
 *       drill" outline button; a discover-more card; the phase rail.
 */

import React from "react"
import { usePlayerChrome } from "@/components/shotiq/phone/usePlayerChrome"
import Link from "next/link"
import { Search, SlidersHorizontal, Bookmark, ChevronDown, MoreHorizontal, ChevronRight, ArrowUpDown } from "lucide-react"
import { PhoneScreen, PhoneHeading } from "@/components/shotiq/PhoneShell"
import {
  PhoneTop, Wordmark, GearLink, PhoneAction, Eyebrow, PhaseRail, PhoneCard,
  MiniStat, Shot, RULE, ORANGE, GRAPHITE,
} from "@/components/shotiq/phone/PhoneBits"
import {
  StreakGlyph, PointsGlyph, ActionGlyph, FlawFigure, PoseFigure, CueGlyph,
} from "@/components/shotiq/Glyphs"

export type LibraryDrill = {
  id: string; title: string; desc: string; level: string; phase: string
  mins: string; strip: string[]; portrait: string
  shots: string; makes: string; acc: string; last: string
}

function Identity() {
  const chrome = usePlayerChrome()

  return (
    <div className="flex items-start px-[18px] pt-[13px]">
      <div className="min-w-0">
        <div className="shotiq-display text-[33.6px] leading-[35px]">{chrome.name.toUpperCase()}</div>
        <div className="mt-[2px] text-[10.5px] leading-[13px]" style={{ color: GRAPHITE }}>Right-handed • Advanced</div>
      </div>
      <div className="ml-auto flex shrink-0 items-start">
        <MiniStat glyph={<StreakGlyph size={38} />} value={chrome.streak} label="DAY STREAK" w={62} />
        <MiniStat glyph={<PointsGlyph size={21} />} value={chrome.points} label="POINTS" w={58} />
      </div>
    </div>
  )
}

/* --------------------------------------------------------------- 056 */

const FLAWS: [string, "elbow" | "wrist" | "base"][] = [
  ["Elbow flare", "elbow"], ["Early wrist bend", "wrist"], ["Left lean", "base"],
]
const CHIPS = ["All Flaws", "All Phases", "All Difficulties", "Any Duration"]

export function DiscoverDrills({ drills, saved, onToggleSave }: {
  drills: LibraryDrill[]
  saved: Set<string>
  onToggleSave: (id: string) => void
}) {
  return (
    <PhoneScreen testid="screen-ios-discover-drills" tab="train" pad={0} header={false}>
      <PhoneTop left={<Wordmark />} right={<GearLink />} />
      <Identity />

      <div className="px-[18px]">
        <PhoneHeading size={35} className="mt-[13px]">DISCOVER DRILLS</PhoneHeading>
        <p className="mt-[6px] text-[10px] leading-[13px]" style={{ color: GRAPHITE }}>
          Drills to address your mechanics and reach your targets.
        </p>

        <div className="mt-[10px] flex gap-[8px]">
          <label className="flex min-w-0 flex-1 items-center gap-[8px] rounded-[6px] px-[10px]"
                 style={{ border: `1px solid ${RULE}`, height: 34 }}>
            <Search className="h-[13px] w-[13px] shrink-0" style={{ color: GRAPHITE }} strokeWidth={1.7} />
            <input placeholder="Search drills" data-testid="phone-drill-search"
                   className="min-w-0 flex-1 bg-transparent text-[11px] outline-none" />
          </label>
          <button type="button"
                  className="flex shrink-0 items-center gap-[7px] rounded-[6px] px-[12px] text-[11px]"
                  style={{ border: `1px solid ${RULE}`, height: 34 }}>
            <SlidersHorizontal className="h-[13px] w-[13px]" strokeWidth={1.7} /> Filters
          </button>
        </div>

        {/* ------------------------------------------ recommendation card */}
        <Eyebrow className="mt-[13px]">RECOMMENDED FOR YOUR TARGET</Eyebrow>
        <PhoneCard className="mt-[8px] px-[11px] py-[10px]">
          <div className="flex items-center gap-[12px]">
            <CueGlyph kind="apex" size={46} />
            <div className="min-w-0 flex-1">
              <Eyebrow tone={ORANGE}>PRIMARY COACHING TARGET</Eyebrow>
              <div className="mt-[4px] text-[12.5px] font-medium leading-[15px]">Keep elbow stacked through release</div>
            </div>
            <ChevronRight className="h-[14px] w-[14px] shrink-0" style={{ color: GRAPHITE }} />
          </div>
          <div className="mt-[9px] pt-[8px]" style={{ borderTop: `1px solid ${RULE}` }}>
            <Eyebrow>RELATED FLAWS DETECTED</Eyebrow>
            <div className="mt-[7px] flex items-center gap-[14px]">
              {FLAWS.map(([l, k]) => (
                <span key={l} className="flex min-w-0 items-center gap-[6px]">
                  <FlawFigure kind={k} size={26} />
                  <span className="whitespace-nowrap text-[9.5px] leading-[11px]">{l}</span>
                </span>
              ))}
            </div>
          </div>
        </PhoneCard>

        {/* -------------------------------------------------- browse */}
        <Eyebrow className="mt-[14px]">BROWSE DRILLS</Eyebrow>
        <div className="mt-[8px] flex gap-[6px]">
          {CHIPS.map((c, i) => (
            <button key={c} type="button"
                    className="flex min-w-0 flex-1 items-center justify-center gap-[4px] rounded-[4px] px-[5px] text-[8.5px]"
                    style={{
                      height: 26,
                      border: `1px solid ${i === 0 ? ORANGE : RULE}`,
                      color: i === 0 ? ORANGE : undefined,
                    }}>
              <span className="truncate">{c}</span>
              <ChevronDown className="h-[9px] w-[9px] shrink-0" />
            </button>
          ))}
        </div>
        <div className="mt-[8px] flex items-center">
          <span className="flex items-center gap-[5px] text-[9.5px]" style={{ color: GRAPHITE }}>
            <ArrowUpDown className="h-[11px] w-[11px]" /> Sort: Recommended
            <ChevronDown className="h-[9px] w-[9px]" />
          </span>
          <span className="ml-auto text-[9.5px]" style={{ color: GRAPHITE }}>{drills.length * 16} drills</span>
        </div>

        {/* ------------------------------------------------- list rows */}
        <div className="mt-[6px]">
          {drills.slice(0, 4).map((d) => (
            <div key={d.id} className="flex items-start gap-[10px] py-[10px]"
                 style={{ borderTop: `1px solid ${RULE}` }}>
              {/* Canonical draws a FOUR-FRAME photo strip here — the round-6
                  build painted one black video tile per row. */}
              <span className="flex shrink-0 gap-[1px] overflow-hidden rounded-[4px]">
                {d.strip.map((s, i) => (
                  <Shot key={i} src={s} zoom={1.5} className="h-[88px] w-[37px]" />
                ))}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-[8px]">
                  <span className="shotiq-display min-w-0 flex-1 text-[15px] leading-[16px]">{d.title.toUpperCase()}</span>
                  <button type="button" aria-label={`Save ${d.title}`} onClick={() => onToggleSave(d.id)}
                          data-testid={`phone-save-${d.id}`}>
                    <Bookmark className="h-[14px] w-[14px]"
                              style={{ color: saved.has(d.id) ? ORANGE : GRAPHITE }}
                              fill={saved.has(d.id) ? ORANGE : "none"} strokeWidth={1.7} />
                  </button>
                </div>
                <div className="mt-[5px] flex items-center gap-[9px]">
                  <PoseFigure phase={d.phase} height={22} active />
                  <span className="text-[8.5px]" style={{ color: ORANGE }}>{d.phase}</span>
                  <span className="text-[8.5px]" style={{ color: GRAPHITE }}>{d.level}</span>
                  <span className="text-[8.5px]" style={{ color: GRAPHITE }}>{d.mins}</span>
                </div>
                <p className="mt-[5px] text-[9px] leading-[12px]" style={{ color: GRAPHITE }}>{d.desc}</p>
                <Link href={`/training/drills/${d.id}`}
                      className="mt-[6px] flex h-[26px] w-[86px] items-center justify-center rounded-[4px] text-[9.5px] text-white"
                      style={{ background: ORANGE }}>View drill</Link>
              </div>
            </div>
          ))}
        </div>
        <div className="h-[16px]" />
      </div>
    </PhoneScreen>
  )
}

/* --------------------------------------------------------------- 058 */

const TABS: [string, string][] = [
  ["TRAIN", "Drills & workouts"], ["MY DRILLS", "Saved for you"], ["ASSIGNED", "From coach"],
]

export function MyDrills({ drills, onAnalyze }: { drills: LibraryDrill[]; onAnalyze: () => void }) {
  const [tab, setTab] = React.useState(1)
  return (
    <PhoneScreen testid="screen-ios-my-drills" tab="train" pad={0} header={false}>
      <PhoneTop left={<Wordmark />} right={<GearLink />} />
      <Identity />

      <div className="px-[18px]">
        <PhoneAction tone="orange" height={40} className="mt-[12px]" onClick={onAnalyze} testid="phone-analyze-shot">
          <ActionGlyph kind="analyze" height={17} accent="#fff" /> Analyze shot
        </PhoneAction>

        {/* ------------------------------------------------- tab strip */}
        <div className="mt-[12px] flex" style={{ borderBottom: `1px solid ${RULE}` }}>
          {TABS.map(([l, note], i) => {
            const on = i === tab
            return (
              <button key={l} type="button" onClick={() => setTab(i)} data-testid={`phone-drill-tab-${i}`}
                      className="flex min-w-0 flex-1 flex-col items-center gap-[4px] pb-[8px]"
                      style={{ borderBottom: `2px solid ${on ? ORANGE : "transparent"}`, marginBottom: -1 }}>
                <span className="flex items-center gap-[6px]">
                  <CueGlyph kind={i === 0 ? "tree" : i === 1 ? "saved" : "shoulders"} size={20} />
                  <span className="shotiq-display text-[11px] leading-[12px]" style={{ color: on ? ORANGE : undefined }}>{l}</span>
                </span>
                <span className="text-[7.5px] leading-[8px]" style={{ color: GRAPHITE }}>{note}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-[10px] flex items-center">
          <span className="shotiq-microcaps" style={{ fontSize: 9, color: GRAPHITE }}>{drills.length} DRILLS</span>
          <span className="ml-auto flex items-center gap-[12px] text-[9.5px]" style={{ color: GRAPHITE }}>
            <span className="flex items-center gap-[4px]">Sort: Newest <ChevronDown className="h-[9px] w-[9px]" /></span>
            <span className="flex items-center gap-[4px]">Filter <SlidersHorizontal className="h-[10px] w-[10px]" /></span>
          </span>
        </div>

        {/* ----------------------------------------------- drill cards */}
        <div className="mt-[7px]">
          {drills.slice(0, 4).map((d) => (
            <div key={d.id} className="flex items-stretch gap-[10px] py-[9px]"
                 style={{ borderTop: `1px solid ${RULE}` }}>
              <Shot src={d.portrait} zoom={1.45} className="h-[142px] w-[84px] shrink-0 rounded-[4px]" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-[8px]">
                  <span className="shotiq-display min-w-0 flex-1 text-[14px] leading-[15px]">{d.title.toUpperCase()}</span>
                  <Link href={`/training/drills/${d.id}`}
                        className="flex h-[22px] shrink-0 items-center rounded-[4px] px-[8px] text-[9px]"
                        style={{ border: `1px solid ${ORANGE}`, color: ORANGE }}>Start drill</Link>
                  <button type="button" aria-label="More"><MoreHorizontal className="h-[14px] w-[14px]" style={{ color: GRAPHITE }} /></button>
                </div>
                <p className="mt-[4px] text-[9px] leading-[12px]" style={{ color: GRAPHITE }}>{d.desc}</p>
                <PhaseRail className="mt-[7px]" figure={18} label={6} active={d.phase} />
                <div className="mt-[8px] flex">
                  {([[d.shots, "SHOTS"], [d.makes, "MAKES"], [d.acc, "BEST ACCURACY"], [d.last, "LAST COMPLETED"]] as const).map(
                    ([v, l], i) => (
                      <div key={l} className="min-w-0 flex-1 pl-[7px] first:pl-0"
                           style={i ? { borderLeft: `1px solid ${RULE}` } : undefined}>
                        <div className="shotiq-numeric text-[12px] leading-[13px]">{v}</div>
                        <div className="shotiq-microcaps mt-[2px]"
 style={{ fontSize: 6, lineHeight: "7px", color: GRAPHITE }}>{l}</div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <PhoneCard className="mt-[10px] flex items-center gap-[11px] px-[11px] py-[10px]">
          <CueGlyph kind="apex" size={34} />
          <div className="min-w-0 flex-1">
            <div className="shotiq-display text-[12px] leading-[13px]">READY TO DISCOVER MORE DRILLS?</div>
            <p className="mt-[3px] text-[9px] leading-[11px]" style={{ color: GRAPHITE }}>
              Find new drills tailored to your shooting mechanics and training goals.
            </p>
          </div>
          <Link href="/training/drills?tab=discover"
                className="flex h-[26px] shrink-0 items-center rounded-[4px] px-[9px] text-[9.5px] text-white"
                style={{ background: ORANGE }}>Discover drills</Link>
        </PhoneCard>

        <PhaseRail className="mb-[16px] mt-[13px]" figure={24} label={7} />
      </div>
    </PhoneScreen>
  )
}
