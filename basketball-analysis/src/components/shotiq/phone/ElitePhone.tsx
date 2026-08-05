"use client"

/**
 * Canonical iOS 052-elite-shooters and 053-elite-shooter-detail.
 *
 * 052 shipped the desktop FILTERS panel stacked above the page, so "ELITE
 * SHOOTERS DATABASE" first appeared ~645pt down and the first screenful was
 * nothing but filter controls; 33 of 54 text runs measured under 45px of
 * advance and the shooter list never appeared. 053 shipped the accent role
 * inverted — blue #246CD8 dominant at 37,110px where canonical's is orange —
 * with seven tabs on two rows against canonical's five on one, and no hero,
 * career table, shot breakdown, mechanics snapshot or reference frames.
 *
 * Measured off the 853x1844 canonicals at 2.170483 px/pt (scratchpad r6d/b.py):
 *
 * 052
 *   ELITE SHOOTERS      y  51.1- 79.7    cap 28.6   x 16.6
 *   sub                 y  90.8- 99.5
 *   search + Filter     y 108- 145       search x 16.6-306, Filter 312-376
 *   four pills          y 152- 183
 *   Sort: WSI / info    y 198.6-211.0
 *   five rows           y 222.5-329.0 / 335.4-440.9 / 447.8-552.4 / 558.9-663.4
 *                       (105.5 pitch, photo at x 16.1 running the row height)
 *   compare band        y 669.9-737.2
 *   tab-bar rule        786
 *
 * 053
 *   back + ELITE SHOOTERS  y  40.5- 52
 *   hero photo             right half, y 40.5-211.0, bleeding to x 393
 *   name                   cap 33.2  x 20.7
 *   two sub lines          y 253.9-281.5
 *   ELITE REFERENCE        y 296.2-342.3   mark + two lines
 *   five tabs, ONE row     y 362.6-372.7   underline on the active one
 *   CAREER SHOOTING        y 380.6-407.3   "View bio ›" right
 *     five stat boxes      y 454.7-521.5   plus a WSI TIER box
 *   FORM SCORE             y 544.6-587.9   numeral + 0/25/50/75/100 scale
 *   SHOT BREAKDOWN         y 609.1-658.4   four columns
 *   MECHANICS SNAPSHOT     y 669.9-679.6   five columns
 *   REFERENCE FORM FRAMES  y 684.2-770.3   five stills with phase captions
 *   action row             y 773.1-796.1   orange primary + two outlines
 *   tab-bar rule           800
 */

import React from "react"
import Link from "next/link"
import { PhoneScreen } from "@/components/shotiq/PhoneShell"
import { Chev, Frame, Micro, SectionHead } from "@/components/shotiq/phone/results/Kit"
import { ActionGlyph, PoseFigure } from "@/components/shotiq/Glyphs"

const RULE = "var(--shotiq-color-rule)"
const ORANGE = "var(--shotiq-color-shotiqOrange)"
const GREEN = "var(--shotiq-color-confirmGreen)"
const BLUE = "var(--shotiq-color-analysisBlue)"
const GRAPHITE = "var(--shotiq-color-graphite)"

const PHASES: ["setup" | "load" | "rise" | "release" | "follow", string][] = [
  ["setup", "SETUP"], ["load", "LOAD"], ["rise", "RISE"],
  ["release", "RELEASE"], ["follow", "FOLLOW-THROUGH"],
]

/* -------------------------------------------------------- 052 database -- */

export interface ShooterRow {
  slug: string
  name: string
  hand: string
  pos: string
  style: string
  league: string
  fg: string
  wsi: string
  similarity: string
  thumb: string
}

export function EliteShootersPhone({
  rows,
  query = "",
  onQuery,
  onFilter,
  onOpen,
  onAnalyze,
}: {
  rows: ShooterRow[]
  query?: string
  onQuery?: (v: string) => void
  onFilter?: () => void
  onOpen?: (slug: string) => void
  onAnalyze?: () => void
}) {
  return (
    <PhoneScreen testid="screen-ios-elite-shooters" tab="home" pad={0} headerH={38}>
      <div style={{ paddingLeft: 16.6, paddingRight: 16.6, paddingBottom: 70 }}>
        <div className="pt-[10px] shotiq-display text-[36px] leading-[33px] tracking-[0.02em]">ELITE SHOOTERS</div>
        <div className="mt-[6px] text-[12px] leading-[13px]" style={{ color: GRAPHITE }}>
          Study the world’s best. Compare forms. Elevate your game.
        </div>

        <div className="mt-[8px] flex gap-[7px]">
          <label className="flex h-[34px] min-w-0 flex-1 items-center gap-[9px] rounded-[6px] bg-white px-[10px]"
                 style={{ border: `1px solid ${RULE}` }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" className="shrink-0"
                 stroke={GRAPHITE} strokeWidth="1.7" strokeLinecap="round">
              <circle cx="7.6" cy="7.6" r="5.6" />
              <path d="M11.8 11.8 L16 16" />
            </svg>
            <input value={query} onChange={(e) => onQuery?.(e.target.value)}
                   data-testid="phone-elite-search" placeholder="Search elite shooters…"
                   className="min-w-0 flex-1 bg-transparent text-[13.6px] outline-none placeholder:text-[var(--shotiq-color-graphite)]" />
          </label>
          <button type="button" onClick={onFilter} data-testid="phone-elite-filter"
                  className="flex h-[34px] shrink-0 items-center gap-[8px] rounded-[6px] bg-white px-[12px] text-[13px]"
                  style={{ border: `1px solid ${RULE}` }}>
            <svg width="18" height="16" viewBox="0 0 18 16" fill="none" aria-hidden="true"
                 stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M1 4 H17 M1 12 H17" />
              <circle cx="6" cy="4" r="2.2" fill="#fff" />
              <circle cx="12" cy="12" r="2.2" fill="#fff" />
            </svg>
            Filter
          </button>
        </div>

        <div className="mt-[7px] flex gap-[5px]">
          {["All Levels", "All Positions", "All Shot Types", "More Filters"].map((p) => (
            <button key={p} type="button" onClick={onFilter}
                    className="flex h-[27px] min-w-0 flex-1 items-center justify-center gap-[3px] rounded-[5px] bg-white px-[2px] text-[10px]"
                    style={{ border: `1px solid ${RULE}` }}>
              <span className="truncate">{p}</span>
              <svg width="9" height="6" viewBox="0 0 9 6" aria-hidden="true" className="shrink-0">
                <path d="M0.8 1 L4.5 4.6 L8.2 1" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </button>
          ))}
        </div>

        <div className="mt-[8px] flex items-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"
               stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 14 V2 M1.6 4.4 L4 2 L6.4 4.4 M12 2 V14 M9.6 11.6 L12 14 L14.4 11.6" />
          </svg>
          <span className="ml-[8px] text-[13.4px] leading-[14px]">Sort: WSI</span>
          <svg width="10" height="6" viewBox="0 0 9 6" aria-hidden="true" className="ml-[6px]">
            <path d="M0.8 1 L4.5 4.6 L8.2 1" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <span className="ml-auto flex items-center gap-[6px] text-[12.6px] leading-[13px]" style={{ color: GRAPHITE }}>
            What is WSI?
            <span className="grid h-[15px] w-[15px] place-items-center rounded-full text-[10px]"
                  style={{ border: `1px solid ${RULE}` }}>i</span>
          </span>
        </div>

        <div className="mt-[7px]">
          {rows.map((r) => (
            <button key={r.slug} type="button" onClick={() => onOpen?.(r.slug)}
                    data-testid={`phone-elite-row-${r.slug}`}
                    className="mt-[5px] flex w-full gap-[9px] overflow-hidden rounded-[6px] bg-white text-left first:mt-0"
                    style={{ border: `1px solid ${RULE}` }}>
              <Frame src={r.thumb} w={80} h={92} radius={0} pos="50% 34%" />
              <span className="min-w-0 flex-1 py-[5px] pr-[8px]">
                <span className="flex items-start">
                  <span className="min-w-0 flex-1">
                    <span className="shotiq-display block whitespace-nowrap text-[16.5px] leading-[16px] tracking-[0.03em]">{r.name.toUpperCase()}</span>
                    <span className="mt-[4px] block whitespace-nowrap text-[10.4px] leading-[11px]" style={{ color: GRAPHITE }}>
                      {r.hand} • {r.pos}
                    </span>
                  </span>
                  <span className="flex shrink-0 text-center">
                    <span className="w-[46px]">
                      <Micro size={7.4}>FG%</Micro>
                      <span className="shotiq-numeric mt-[3px] block text-[14px] leading-[14px]">{r.fg}</span>
                    </span>
                    <span className="w-[36px]" style={{ borderLeft: `1px solid ${RULE}` }}>
                      <Micro size={7.4} className="!text-[color:var(--shotiq-color-shotiqOrange)]">WSI</Micro>
                      <span className="shotiq-numeric mt-[3px] block text-[14px] leading-[14px]" style={{ color: ORANGE }}>{r.wsi}</span>
                    </span>
                    <span className="w-[58px]" style={{ borderLeft: `1px solid ${RULE}` }}>
                      <Micro size={7.4}>SIMILARITY</Micro>
                      <span className="shotiq-numeric mt-[3px] block text-[14px] leading-[14px]" style={{ color: BLUE }}>{r.similarity}</span>
                    </span>
                  </span>
                </span>
                <span className="mt-[4px] block text-[10.8px] leading-[12px]">{r.style} <span style={{ color: GRAPHITE }}>• {r.league}</span></span>
                <span className="mt-[5px] flex items-end">
                  {PHASES.map(([kind, label], i) => {
                    const on = kind === "release"
                    return (
                      <span key={label} className="relative flex min-w-0 flex-1 flex-col items-center">
                        {i > 0 && (
                          <span aria-hidden="true" className="absolute left-[-50%] top-[44%] h-px w-full" style={{ background: RULE }} />
                        )}
                        <PoseFigure phase={kind} height={19} active={on} className="relative" />
                        <span className="shotiq-display relative mt-[3px] truncate text-center leading-none"
                              style={{ fontSize: 6.6, color: on ? ORANGE : undefined }}>{label}</span>
                      </span>
                    )
                  })}
                  <span className="ml-[6px] flex shrink-0 items-center gap-[3px] text-[11.6px]" style={{ color: ORANGE }}>
                    View shooter <Chev size={12} color={ORANGE} />
                  </span>
                </span>
              </span>
            </button>
          ))}
        </div>

        <div className="mt-[8px] flex items-center gap-[9px] rounded-[6px] bg-white px-[9px] py-[7px]"
             style={{ border: `1px solid ${RULE}` }}>
          <svg width="42" height="34" viewBox="0 0 42 34" fill="none" aria-hidden="true" className="shrink-0"
               stroke="currentColor" strokeWidth="1.7">
            <path d="M6 22 L18 12 L30 16" />
            <path d="M8 8 V26" stroke={ORANGE} strokeDasharray="3 3" />
            <circle cx="6" cy="22" r="3" fill="#fff" />
            <circle cx="18" cy="12" r="3" fill="#fff" />
            <circle cx="30" cy="16" r="3" fill="#fff" stroke={ORANGE} />
          </svg>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] leading-[15px]">Compare your form to any elite shooter.</span>
            <span className="mt-[3px] block text-[11.4px] leading-[13px]" style={{ color: GRAPHITE }}>
              Upload a shot to see your Form Similarity.
            </span>
          </span>
          <button type="button" onClick={onAnalyze} data-testid="phone-elite-analyze"
                  className="flex h-[34px] shrink-0 items-center gap-[8px] rounded-[5px] px-[12px] text-[13px] font-medium text-white"
                  style={{ background: ORANGE }}>
            <ActionGlyph kind="analyze" height={17} accent="#fff" /> Analyze shot
          </button>
        </div>
      </div>
    </PhoneScreen>
  )
}

/* ---------------------------------------------------------- 053 detail -- */

const TABS = ["OVERVIEW", "MECHANICS", "STRENGTHS", "WEAKNESSES", "REFERENCE"]

export function EliteShooterDetailPhone({
  name,
  hand = "Right-handed",
  pos = "Guard",
  team,
  era,
  blurb = ["Advanced high school shooter.", "Quick, repeatable release."],
  score = 82,
  verdict = "GOOD",
  note = "High-level, repeatable form.",
  tier = "53",
  tierLabel = "ELITE",
  career,
  breakdown,
  mechanics,
  strengths,
  weaknesses,
  hero = "089-video",
  frames = ["089-gal-1", "089-gal-2", "089-gal-3", "089-gal-4", "089-gal-5"],
  tab = "OVERVIEW",
  onTab,
  onCompare,
  onSave,
}: {
  name: string
  hand?: string; pos?: string; team?: string; era?: string
  blurb?: string[]
  score?: number; verdict?: string; note?: string
  tier?: string; tierLabel?: string
  career: [string, string][]
  breakdown: [string, string, string][]
  mechanics: [string, string, "setup" | "load" | "rise" | "release" | "follow"][]
  strengths: string[]
  weaknesses: string[]
  hero?: string
  frames?: string[]
  tab?: string
  onTab?: (t: string) => void
  onCompare?: () => void
  onSave?: () => void
}) {
  return (
    <PhoneScreen testid="screen-ios-elite-shooter-detail" tab="home" pad={0} headerH={38}>
      <div style={{ paddingBottom: 70 }}>
        {/* hero band: identity left, full-bleed still right */}
        <div className="relative">
          <span className="absolute right-0 top-0 block h-[160px] w-[186px] overflow-hidden">
            <Frame src={hero} w="100%" h="100%" radius={0} pos="42% 24%" />
          </span>
          <div className="relative pl-[20.7px] pr-[192px] pt-[7px]">
            <Link href="/elite-shooters" className="flex items-center gap-[8px]" data-testid="phone-shooter-back">
              <svg width="13" height="14" viewBox="0 0 13 14" aria-hidden="true">
                <path d="M9 1 L3 7 L9 13" fill="none" stroke="currentColor" strokeWidth="1.7"
                      strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="shotiq-display text-[15px] leading-[15px] tracking-[0.07em]" style={{ color: GRAPHITE }}>
                ELITE SHOOTERS
              </span>
            </Link>
            <div className="mt-[11px] shotiq-display text-[33px] leading-[32px] tracking-[0.02em]">{name.toUpperCase()}</div>
            <div className="mt-[7px] text-[12.4px] leading-[14px]" style={{ color: GRAPHITE }}>{hand} &nbsp;•&nbsp; {pos}</div>
            {(team || era) && (
              <div className="mt-[4px] truncate text-[12.4px] leading-[14px]" style={{ color: GRAPHITE }}>
                {team}{team && era ? " • " : ""}{era}
              </div>
            )}
            <div className="mt-[8px] flex items-start gap-[10px] pt-[7px]" style={{ borderTop: `1px solid ${RULE}` }}>
              <svg width="40" height="37" viewBox="0 0 46 42" fill="none" aria-hidden="true" className="shrink-0"
                   stroke={ORANGE} strokeWidth="2">
                <path d="M8 8 L34 12 M8 8 L6 30 M6 30 A16 16 0 0 0 34 26" />
                <circle cx="8" cy="8" r="3.4" fill="#fff" stroke="#000" />
                <circle cx="34" cy="12" r="3.4" fill="#fff" />
                <circle cx="6" cy="30" r="3.4" fill="#fff" stroke="#000" />
              </svg>
              <div className="min-w-0">
                <div className="shotiq-display text-[20px] leading-[20px] tracking-[0.03em]">ELITE REFERENCE</div>
                <div className="mt-[5px] text-[11.8px] leading-[13.6px]" style={{ color: GRAPHITE }}>
                  {blurb[0]}<br />{blurb[1]}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* five tabs on ONE row */}
        <div className="mt-[10px] flex" style={{ borderBottom: `1px solid ${RULE}` }}>
          {TABS.map((t) => {
            const on = t === tab
            return (
              <button key={t} type="button" onClick={() => onTab?.(t)}
                      data-testid={`phone-shooter-tab-${t.toLowerCase()}`}
                      className="relative min-w-0 flex-1 pb-[7px] text-center">
                <span className="shotiq-display block truncate text-[13.4px] leading-[14px] tracking-[0.04em]"
                      style={{ color: on ? ORANGE : GRAPHITE }}>{t}</span>
                {on && <span aria-hidden="true" className="absolute inset-x-[12%] bottom-0 h-[2.6px]" style={{ background: ORANGE }} />}
              </button>
            )
          })}
        </div>

        <div style={{ paddingLeft: 22.6, paddingRight: 22.6 }}>
          <div className="mt-[9px] flex items-baseline">
            <SectionHead cap={27}>CAREER SHOOTING SUMMARY</SectionHead>
            <Link href="/results/demo/player" className="ml-auto flex items-center gap-[5px] text-[12.6px]"
                  style={{ color: ORANGE }}>View bio <Chev size={12} color={ORANGE} /></Link>
          </div>
          <div className="mt-[3px] text-[11.6px] leading-[13px]" style={{ color: GRAPHITE }}>24 Shots Analyzed</div>

          <div className="mt-[6px] flex items-start gap-[8px]">
            <div className="flex min-w-0 flex-1 rounded-[6px] bg-white py-[6px]" style={{ border: `1px solid ${RULE}` }}>
              {career.map(([k, v], i) => (
                <div key={k} className="min-w-0 flex-1 text-center"
                     style={i ? { borderLeft: `1px solid ${RULE}` } : undefined}>
                  <Micro size={8}>{k}</Micro>
                  <div className="shotiq-numeric mt-[4px] text-[16px] leading-[16px]">{v}</div>
                </div>
              ))}
            </div>
            <div className="w-[68px] shrink-0 rounded-[6px] bg-white py-[5px] text-center" style={{ border: `1px solid ${RULE}` }}>
              <Micro size={8}>WSI TIER</Micro>
              <div className="shotiq-numeric mt-[3px] text-[24px] leading-[24px]" style={{ color: ORANGE }}>{tier}</div>
              <Micro size={7.2} className="mt-[3px] truncate">{tierLabel}</Micro>
            </div>
          </div>

          <div className="mt-[8px] flex items-start gap-[11px]">
            <div className="w-[88px] shrink-0">
              <div className="shotiq-section-label leading-[12px] tracking-[0.075em]"
                   style={{ "--shotiq-label-size": "12px" } as React.CSSProperties}>FORM SCORE</div>
              <div className="shotiq-numeric mt-[2px] text-[34px] leading-[0.82]" style={{ color: ORANGE }}>{score}</div>
              <div className="shotiq-display mt-[4px] text-[14px] leading-[14px] tracking-[0.04em]" style={{ color: BLUE }}>{verdict}</div>
              <div className="mt-[3px] text-[10.6px] leading-[11.8px]" style={{ color: GRAPHITE }}>{note}</div>
            </div>
            <div className="min-w-0 flex-1 pt-[13px]">
              <span className="relative block h-[11px] overflow-hidden rounded-full" style={{ background: "#E2E3E4" }}>
                <span className="block h-full rounded-full" style={{ width: `${score + 8}%`, background: ORANGE }} />
                {[25, 50, 75].map((t) => (
                  <span key={t} aria-hidden="true" className="absolute top-0 h-full w-px bg-white/60" style={{ left: `${t}%` }} />
                ))}
              </span>
              <div className="mt-[6px] flex text-[11.4px]" style={{ color: GRAPHITE }}>
                {["0", "25", "50", "75", "100"].map((t, i) => (
                  <span key={t} className={`flex-1 ${i === 4 ? "text-right" : ""}`}>{t}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-[7px] flex items-baseline" style={{ borderTop: `1px solid ${RULE}`, paddingTop: 7 }}>
            <SectionHead cap={22}>SHOT BREAKDOWN (CAREER)</SectionHead>
            <span className="ml-auto text-[11.6px]" style={{ color: GRAPHITE }}>100% = 24 SHOTS</span>
          </div>
          <div className="mt-[6px] flex">
            {breakdown.map(([label, value, count], i) => (
              <div key={label} className="min-w-0 flex-1 px-[5px]"
                   style={i ? { borderLeft: `1px solid ${RULE}` } : undefined}>
                <span className="flex h-[26px] items-center">
                  <svg width="30" height="24" viewBox="0 0 30 24" fill="none" aria-hidden="true"
                       stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.4 2.4">
                    <path d="M6 18 L14 8 L24 13" />
                    <circle cx="6" cy="18" r="2.6" stroke={ORANGE} strokeDasharray="0" />
                    <circle cx="14" cy="8" r="2.6" strokeDasharray="0" />
                    <circle cx="24" cy="13" r="2.6" stroke={ORANGE} strokeDasharray="0" />
                  </svg>
                </span>
                <div className="mt-[3px] truncate text-[10.6px] leading-[12px]">{label}</div>
                <div className="shotiq-numeric mt-[2px] text-[17px] leading-[17px]">{value}</div>
                <Micro size={7.4} className="mt-[2px]">{count}</Micro>
              </div>
            ))}
          </div>

          <div className="mt-[7px]"><SectionHead cap={21}>MECHANICS SNAPSHOT</SectionHead></div>
          <div className="mt-[5px] flex">
            {mechanics.map(([label, value, kind], i) => (
              <div key={label} className="flex min-w-0 flex-1 items-start gap-[3px] px-[3px]"
                   style={i ? { borderLeft: `1px solid ${RULE}` } : undefined}>
                <PoseFigure phase={kind} height={21} className="shrink-0" />
                <span className="min-w-0">
                  <span className="block text-[8.6px] leading-[10px]" style={{ color: GRAPHITE }}>{label}</span>
                  <span className="shotiq-numeric mt-[2px] block text-[13px] leading-[13px]" style={{ color: GREEN }}>{value}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="mt-[7px] flex gap-[13px]" style={{ borderTop: `1px solid ${RULE}`, paddingTop: 7 }}>
            <div className="min-w-0 flex-1">
              <SectionHead cap={21}>STRENGTHS</SectionHead>
              {strengths.slice(0, 3).map((s) => (
                <div key={s} className="mt-[3px] flex items-start gap-[5px] text-[10.4px] leading-[11.6px]">
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="mt-[1px] shrink-0">
                    <circle cx="7" cy="7" r="6.1" fill="none" stroke={GREEN} strokeWidth="1.3" />
                    <path d="M4.1 7.2 L6.2 9.3 L10 5.2" fill="none" stroke={GREEN} strokeWidth="1.5"
                          strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="min-w-0">{s}</span>
                </div>
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <SectionHead cap={21}>WEAKNESSES</SectionHead>
              {weaknesses.slice(0, 3).map((s) => (
                <div key={s} className="mt-[7px] flex items-start gap-[7px] text-[12.4px] leading-[14px]">
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="mt-[1px] shrink-0">
                    <circle cx="7" cy="7" r="6.1" fill="none" stroke={ORANGE} strokeWidth="1.3" />
                    <path d="M4.2 7 H9.8" stroke={ORANGE} strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                  <span className="min-w-0">{s}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-[7px]"><SectionHead cap={21}>REFERENCE FORM FRAMES</SectionHead></div>
          <div className="mt-[5px] flex gap-[4px]">
            {frames.map((f, i) => {
              const on = i === 3
              return (
                <div key={f} className="min-w-0 flex-1">
                  <Frame src={f} w="100%" h={58} radius={3} pos="50% 34%" />
                  <div className="shotiq-display mt-[5px] truncate text-center leading-none"
                       style={{ fontSize: 7.4, color: on ? ORANGE : undefined }}>{PHASES[i][1]}</div>
                  {on && <span aria-hidden="true" className="mx-auto mt-[3px] block h-[1.6px] w-[70%]" style={{ background: ORANGE }} />}
                </div>
              )
            })}
          </div>

          <div className="mt-[8px] flex gap-[7px]">
            <button type="button" onClick={onCompare} data-testid="phone-shooter-compare"
                    className="flex h-[34px] min-w-0 flex-[1.5] items-center justify-center gap-[10px] rounded-[5px] text-[14.6px] font-medium text-white"
                    style={{ background: ORANGE }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"
                   stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="7.6" cy="7.6" r="5.6" />
                <path d="M11.8 11.8 L16.4 16.4" />
              </svg>
              Compare with my shot
            </button>
            <button type="button" onClick={onSave} data-testid="phone-shooter-save"
                    className="flex h-[34px] min-w-0 flex-1 items-center justify-center gap-[9px] rounded-[5px] bg-white text-[14.6px]"
                    style={{ border: `1px solid ${RULE}` }}>
              <svg width="14" height="17" viewBox="0 0 14 17" fill="none" aria-hidden="true"
                   stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
                <path d="M2 1.5 H12 V15.5 L7 11.5 L2 15.5 Z" />
              </svg>
              Save reference
            </button>
            <span className="grid h-[34px] w-[46px] shrink-0 place-items-center rounded-[5px] bg-white"
                  style={{ border: `1px solid ${RULE}` }}>
              <svg width="15" height="17" viewBox="0 0 15 17" fill="none" aria-hidden="true"
                   stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7.5 11 V1.6 M4 5.1 L7.5 1.6 L11 5.1 M1.6 10 V15.4 H13.4 V10" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </PhoneScreen>
  )
}
