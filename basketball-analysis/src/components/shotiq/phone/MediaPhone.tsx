"use client"

/**
 * Canonical iOS media family — 068 my media and 069 media detail.
 *
 * Round 6 drew 068 as the desktop two-column library, whose 186px FILTERS rail
 * survived at 393pt and painted a full-height rule at x=402px (185pt), and 069
 * as a dimmed MODAL over it where canonical draws a full page.
 *
 * Measured off the 853x1844 canonical PNGs at 2.170483 px per pt.
 *
 * 068 — identity y 28-48; "Primary target" pair y 58-70; a 5-cell score card
 *       74pt with the pose mark; MY MEDIA cap 26 beside a 34pt orange Upload;
 *       a 5-chip segmented filter 28pt; Filter / Sort / Select row 30pt; day
 *       groups with a 3-up grid of 116x118 tiles, each carrying its duration,
 *       an analysed badge, a title, a time and a scored value.
 * 069 — back / MEDIA DETAIL / overflow header 40pt; a 300x282 player with the
 *       centre play control and a SLOW 1.0x badge; an 8-frame strip with the
 *       current frame ringed orange; CAPTURE DETAILS; LINKED ANALYSIS card;
 *       SHOT EVENTS 5-cell strip; PRIMARY COACHING TARGET row; a 4-button
 *       ACTIONS row; and the destructive confirm block.
 */

import React from "react"
import { useLatestSession } from "@/components/shotiq/phone/useLatestSession"
import { usePlayerChrome } from "@/components/shotiq/phone/usePlayerChrome"
import Link from "next/link"
import {
  ChevronDown, ChevronRight, Play, Upload, SlidersHorizontal, ArrowUpDown,
  MoreHorizontal, Share2, Download, Trash2, Check, X,
} from "lucide-react"
import { PhoneScreen, PhoneHeading } from "@/components/shotiq/PhoneShell"
import {
  PhoneTop, Wordmark, GearLink, BackChevron, PhoneAction, Eyebrow, PhoneCard,
  MiniStat, StatCells, Shot, RULE, ORANGE, GREEN, BLUE, GRAPHITE,
} from "@/components/shotiq/phone/PhoneBits"
import { StreakGlyph, PointsGlyph, PoseFigure, MechanicGlyph } from "@/components/shotiq/Glyphs"

const RED = "var(--shotiq-color-reviewRed)"

export type PhoneMedia = {
  id: string; title: string; time: string; len: string
  score: number | null; status: string; img: string; live?: boolean
}

const VERDICT = (s: number | null) =>
  s == null ? "" : s >= 90 ? "EXCELLENT" : s >= 80 ? "GOOD" : s >= 72 ? "GOOD" : "REVIEW"
const TONE = (s: number | null) =>
  s == null ? GRAPHITE : s >= 90 ? GREEN : s >= 80 ? BLUE : s >= 72 ? BLUE : ORANGE

/* --------------------------------------------------------------- 068 */

const TABS = ["All", "Images", "Videos", "Live", "Workouts"]

export function MyMedia({ groups, onOpen, onUpload }: {
  groups: [string, string, PhoneMedia[]][]
  onOpen: (id: string) => void
  onUpload: () => void
}) {
  const session = useLatestSession()

  const chrome = usePlayerChrome()

  const [tab, setTab] = React.useState(0)
  return (
    <PhoneScreen testid="screen-ios-my-media" tab="home" pad={0} header={false}>
      <PhoneTop left={<Wordmark />} right={<GearLink />} />

      <div className="flex items-start px-[18px] pt-[13px]">
        <div className="min-w-0">
          <div className="shotiq-display text-[33.6px] leading-[35px]">{chrome.name.toUpperCase()}</div>
          <div className="mt-[2px] text-[10.5px] leading-[13px]" style={{ color: GRAPHITE }}>{chrome.sub}</div>
        </div>
        <div className="ml-auto flex shrink-0 items-start">
          <MiniStat glyph={<StreakGlyph size={38} />} value={chrome.streak} label="DAY STREAK" w={62} />
          <MiniStat glyph={<PointsGlyph size={21} />} value={chrome.points} label="POINTS" w={58} />
        </div>
      </div>

      <div className="px-[18px]">
        <div className="mt-[9px]">
          <div className="text-[9.5px] leading-[11px]" style={{ color: GRAPHITE }}>Primary target</div>
          <div className="mt-[2px] text-[11.5px] font-medium leading-[14px]">Keep elbow stacked through release</div>
        </div>

        <PhoneCard className="mt-[9px] flex items-center px-[9px] py-[9px]">
          <div className="min-w-0 flex-1">
            <StatCells valueSize={19} labelSize={7}
                       cells={[
                         { v: session.score, l: "FORM SCORE", tone: BLUE }, { v: session.shots, l: "SHOTS" },
                         { v: session.makes, l: "MAKES" }, { v: session.pct, l: "ACCURACY", tone: BLUE },
                       ]} />
          </div>
          <span className="ml-[9px] shrink-0 pl-[9px]" style={{ borderLeft: `1px solid ${RULE}` }}>
            <PoseFigure phase="release" height={42} active />
          </span>
        </PhoneCard>

        <div className="mt-[12px] flex items-end gap-[10px]">
          <div className="min-w-0 flex-1">
            <PhoneHeading size={37} className="whitespace-nowrap">MY MEDIA</PhoneHeading>
            <p className="mt-[5px] w-[188px] text-[9.5px] leading-[12px]" style={{ color: GRAPHITE }}>
              Review your shots and training sessions.
            </p>
          </div>
          <PhoneAction tone="orange" height={34} className="w-[96px] shrink-0 text-[12px]"
                       onClick={onUpload} testid="phone-media-upload">
            <Upload className="h-[13px] w-[13px]" strokeWidth={1.8} /> Upload
          </PhoneAction>
        </div>

        <div className="mt-[10px] flex gap-[5px] rounded-[6px] p-[3px]" style={{ border: `1px solid ${RULE}` }}>
          {TABS.map((t, i) => (
            <button key={t} type="button" onClick={() => setTab(i)} data-testid={`phone-media-tab-${i}`}
                    className="min-w-0 flex-1 truncate rounded-[4px] text-[9.5px]"
                    style={{ height: 24, background: i === tab ? "#FFF1EB" : "transparent", color: i === tab ? ORANGE : GRAPHITE }}>
              {t}
            </button>
          ))}
        </div>

        <div className="mt-[8px] flex gap-[7px]">
          {([["Filter", SlidersHorizontal], ["Sort: Newest", ArrowUpDown], ["Select", Check]] as const).map(([l, I]) => (
            <button key={l} type="button"
                    className="flex min-w-0 flex-1 items-center justify-center gap-[6px] rounded-[5px] text-[9.5px]"
                    style={{ height: 30, border: `1px solid ${RULE}` }}>
              <I className="h-[11px] w-[11px]" strokeWidth={1.7} />
              <span className="truncate">{l}</span>
              {l.startsWith("Sort") && <ChevronDown className="h-[9px] w-[9px] shrink-0" />}
            </button>
          ))}
        </div>

        {/* ------------------------------------------------- day groups */}
        {groups.map(([head, count, items]) => (
          <div key={head} className="mt-[12px]">
            <div className="flex items-center">
              <Eyebrow>{head}</Eyebrow>
              <span className="ml-auto text-[8.5px]" style={{ color: GRAPHITE }}>{count}</span>
            </div>
            <div className="mt-[7px] grid grid-cols-3 gap-[8px]">
              {items.map((m) => (
                <button key={m.id} type="button" onClick={() => onOpen(m.id)}
                        data-testid={`phone-media-open-${m.id}`} className="min-w-0 text-left">
                  <span className="relative block overflow-hidden rounded-[4px]">
                    <Shot src={m.img} zoom={1.34} className="h-[110px] w-full" />
                    <span className="absolute bottom-[5px] left-[5px] rounded-[2px] bg-black/65 px-[4px] py-[1px] text-[7.5px] text-white">
                      {m.live ? "LIVE" : m.len}
                    </span>
                    <span className="absolute bottom-[5px] right-[5px] grid h-[15px] w-[15px] place-items-center rounded-full"
                          style={{ background: m.status === "Review" ? RED : GREEN }}>
                      {m.status === "Review"
                        ? <X className="h-[9px] w-[9px] text-white" strokeWidth={3} />
                        : <Check className="h-[9px] w-[9px] text-white" strokeWidth={3} />}
                    </span>
                  </span>
                  <span className="mt-[5px] block truncate text-[8.5px] leading-[10px]">{m.title}</span>
                  <span className="mt-[3px] flex items-end">
                    <span className="min-w-0 truncate text-[7.5px] leading-[9px]" style={{ color: GRAPHITE }}>{m.time}</span>
                    {m.score != null && (
                      <span className="ml-auto shrink-0 text-right">
                        <span className="shotiq-numeric block text-[13px] leading-[13px]" style={{ color: TONE(m.score) }}>{m.score}</span>
                        <span className="shotiq-microcaps block" style={{ fontSize: 6, lineHeight: "7px", color: TONE(m.score) }}>{VERDICT(m.score)}</span>
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="h-[16px]" />
      </div>
    </PhoneScreen>
  )
}

/* --------------------------------------------------------------- 069 */

export function MediaDetail({ item, frames, onBack }: {
  item: PhoneMedia; frames: string[]; onBack: () => void
}) {
  const session = useLatestSession()

  const chrome = usePlayerChrome()

  const [frame, setFrame] = React.useState(4)
  const [confirm, setConfirm] = React.useState(true)
  return (
    <PhoneScreen testid="screen-ios-media-detail" tab="home" pad={0} header={false}>
      <PhoneTop height={40} left={<BackChevron onClick={onBack} />}
                center={<span className="shotiq-display text-[17px] leading-[18px] tracking-[0.04em]">MEDIA DETAIL</span>}
                right={<button type="button" aria-label="More actions"><MoreHorizontal className="h-[16px] w-[16px]" /></button>} />

      {/* --------------------------------------------------- player */}
      <div className="relative mx-[8px] mt-[8px] overflow-hidden rounded-[4px]">
        <Shot src={item.img} alt={item.title} zoom={1.3} className="h-[252px] w-full" />
        <span className="absolute left-[9px] top-[8px] text-[10px] font-medium text-white">6:12</span>
        <span className="absolute right-[9px] top-[8px] rounded-[3px] bg-black/60 px-[6px] py-[2px] text-[8.5px] text-white">SLOW 1.0x</span>
        <button type="button" aria-label="Play"
                className="absolute inset-0 m-auto grid h-[58px] w-[58px] place-items-center rounded-full bg-white/85">
          <Play className="ml-[3px] h-[24px] w-[24px]" fill="currentColor" />
        </button>
      </div>

      {/* --------------------------------------------- frame strip */}
      <div className="mx-[8px] mt-[6px] flex gap-[2px]">
        {frames.map((f, i) => (
          <button key={i} type="button" onClick={() => setFrame(i)} aria-label={`Frame ${i + 1}`}
                  className="min-w-0 flex-1 overflow-hidden rounded-[2px]"
                  style={{ outline: i === frame ? `1.8px solid ${ORANGE}` : "none", outlineOffset: -1 }}>
            <Shot src={f} zoom={1.5} className="h-[46px] w-full" />
          </button>
        ))}
      </div>

      <div className="px-[18px]">
        <Eyebrow className="mt-[10px]">CAPTURE DETAILS</Eyebrow>
        <div className="shotiq-display mt-[5px] text-[20px] leading-[21px]">MAY 21, 2025 • 8:24 AM</div>
        <div className="mt-[4px] text-[9.5px] leading-[12px]" style={{ color: GRAPHITE }}>
          Indoor Court • iPhone 15 Pro • 1080p • 60fps
        </div>

        <Eyebrow className="mt-[10px]">LINKED ANALYSIS</Eyebrow>
        <PhoneCard className="mt-[7px] flex items-center gap-[10px] p-[8px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/canonical/092-thumb-2.png" alt="" aria-hidden="true"
               className="h-[52px] w-[72px] shrink-0 rounded-[3px] object-cover" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-[7px]">
              <span className="text-[12px] font-medium leading-[14px]">Shot Analysis</span>
              <span className="text-[9px]" style={{ color: GRAPHITE }}>• May 21, 2025</span>
            </div>
            <div className="mt-[4px] text-[8.5px]" style={{ color: GRAPHITE }}>Form Score</div>
            <div className="mt-[2px] flex items-center gap-[7px]">
              <span className="shotiq-numeric text-[19px] leading-[18px]" style={{ color: ORANGE }}>{session.score}</span>
              <span className="h-[4px] min-w-0 flex-1 rounded-full" style={{ background: RULE }}>
                <span className="block h-full rounded-full" style={{ width: "82%", background: ORANGE }} />
              </span>
            </div>
          </div>
          <Link href="/results/demo/analysis"
                className="flex h-[24px] shrink-0 items-center gap-[5px] rounded-[4px] px-[8px] text-[9.5px]"
                style={{ border: `1px solid ${BLUE}`, color: BLUE }}>
            Open analysis <ChevronRight className="h-[10px] w-[10px]" />
          </Link>
          <ChevronRight className="h-[13px] w-[13px] shrink-0" style={{ color: GRAPHITE }} />
        </PhoneCard>

        <Eyebrow className="mt-[10px]">SHOT EVENTS</Eyebrow>
        <div className="mt-[7px] flex">
          {([[session.shots, "SHOTS", "angle"], [session.makes, "MAKES", "wrist"], [session.pct, "MAKE %", "arc"],
             [chrome.streak, "DAY STREAK", "impact"], [chrome.points, "POINTS", "centerline"]] as const).map(([v, l, m], i) => (
            <div key={l} className="min-w-0 flex-1 pl-[7px] text-center first:pl-0"
                 style={i ? { borderLeft: `1px solid ${RULE}` } : undefined}>
              <span className="flex h-[24px] items-center justify-center"><MechanicGlyph kind={m} size={22} /></span>
              <div className="shotiq-numeric mt-[4px] text-[15px] leading-[16px]">{v}</div>
              <div className="shotiq-microcaps mt-[2px] whitespace-nowrap" style={{ fontSize: 6.5, lineHeight: "7px", color: GRAPHITE }}>{l}</div>
            </div>
          ))}
        </div>

        <div className="mt-[10px] flex items-center gap-[10px] pt-[9px]" style={{ borderTop: `1px solid ${RULE}` }}>
          <div className="min-w-0 flex-1">
            <Eyebrow>PRIMARY COACHING TARGET</Eyebrow>
            <div className="mt-[5px] text-[14px] leading-[17px]">Keep elbow stacked through release</div>
          </div>
          <ChevronRight className="h-[15px] w-[15px] shrink-0" style={{ color: GRAPHITE }} />
        </div>

        <Eyebrow className="mt-[10px]">ACTIONS</Eyebrow>
        <div className="mt-[7px] flex gap-[7px]">
          {([["Play", Play], ["Share", Share2], ["Download", Download], ["Delete", Trash2]] as const).map(([l, I]) => (
            <button key={l} type="button" data-testid={`phone-media-${l.toLowerCase()}`}
                    className="flex min-w-0 flex-1 items-center justify-center gap-[6px] rounded-[5px] text-[9.5px]"
                    style={{ height: 32, border: `1px solid ${RULE}`, color: l === "Delete" ? RED : undefined }}>
              <I className="h-[12px] w-[12px]" strokeWidth={1.7} />
              <span className="truncate">{l}</span>
            </button>
          ))}
        </div>

        {confirm && (
          <div className="mb-[12px] mt-[8px] flex items-center gap-[10px] rounded-[6px] px-[10px] py-[8px]"
               style={{ border: `1px solid ${RED}`, background: "#FFF5F4" }}>
            <Trash2 className="h-[17px] w-[17px] shrink-0" style={{ color: RED }} strokeWidth={1.7} />
            <span className="min-w-0 flex-1">
              <span className="block text-[10.5px] font-medium leading-[13px]" style={{ color: RED }}>Delete this media?</span>
              <span className="block text-[8.5px] leading-[10px]" style={{ color: GRAPHITE }}>This action cannot be undone.</span>
            </span>
            <button type="button" onClick={() => setConfirm(false)}
                    className="flex h-[26px] shrink-0 items-center rounded-[4px] px-[10px] text-[9.5px] text-white"
                    style={{ background: RED }}>Delete media</button>
          </div>
        )}
      </div>
    </PhoneScreen>
  )
}
