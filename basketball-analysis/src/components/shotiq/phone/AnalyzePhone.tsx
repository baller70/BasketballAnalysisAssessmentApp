"use client"

/**
 * Canonical iOS 021-analyze-hub and 025-upload-queue.
 *
 * Round 6 rendered a reflowed desktop workspace for both: a 2x2 tile grid in
 * the reverse of canonical's order, a "Drag and drop your files here" zone —
 * a desktop affordance on a phone — and, for 025, the *empty* upload state
 * with the queue rows, the per-file progress bar and the primary CTA all
 * absent (orange fell 36.1 permille to 1.6, green 1.6 to 0.0).
 *
 * They are two compositions on one route: /analyze is the hub, and
 * /analyze?view=queue is the queue, pushed as a history entry by the hub's own
 * "Upload image" tile. Measured off the 853x1844 canonicals at 2.170483 px/pt
 * (scratchpad r6d/b.py):
 *
 * 021
 *   identity            y  53.0- 106.0   name x 17.0
 *   ANALYZE YOUR SHOT   y 141.0- 168.2   cap 27.2  x 17.5  advance 224.4
 *   sub                 y 179.2- 190.3
 *   three tiles         y 200- 330       ONE row, x 17 / 140 / 262
 *     marks             y 219.3- 259.8
 *     titles            y 282.0- 295.3   Live camera / Upload video / Upload image
 *     bodies            y 302.7- 325.7   two lines each
 *   capture-guide row   y 345- 400       "View capture guide" + chevron
 *   RECENT CAPTURES     y 411.9- 424.8   "View all >" right
 *     four stills       y 434.0- 563.5   x 16.6-377.8, 129.5 tall
 *     caption pairs     y 570.8- 589.7
 *   tip card            y 600- 660       blue node mark + two lines
 *   YOUR SHOOTING       y 667.6- 676.8
 *     stat strip        y 681.9- 718.7   24 / 15 / 62.5% / spark
 *   PRIMARY COACHING    y 745.5- 780.9
 *   tab-bar rule        791
 *
 * 025
 *   identity            y  52.1- 115.2   name + target line + 4-cell strip
 *   UPLOAD QUEUE        y 198.6- 234.5   cap 35.9  x 20.3
 *   sub                 y 237.3- 247.9
 *   Add media tile      x 293-372, y 187-247
 *   QUEUE (2)           y 271.4- 284.7   "1 uploading • 1 completed" right
 *   row 1 (image)       y 304.5- 451.5   thumb 143 wide, green tick, Analyze now
 *   row 2 (video)       y 482.8- 619.2   thumb, blue arrow, 58% + progress bar
 *   two info rows       y 651.9- 712.7
 *   primary CTA         y 729.3- 764.3   orange, full bleed
 *   Remove completed    y 770.3- 783.2
 *   tab-bar rule        791
 */

import React from "react"
import Link from "next/link"
import { PhoneScreen, MiniTrend } from "@/components/shotiq/PhoneShell"
import {
  Chev, Frame, Micro, SectionHead, TrendArrow, TickDisc,
} from "@/components/shotiq/phone/results/Kit"
import { ActionGlyph } from "@/components/shotiq/Glyphs"

const RULE = "var(--shotiq-color-rule)"
const ORANGE = "var(--shotiq-color-shotiqOrange)"
const GREEN = "var(--shotiq-color-confirmGreen)"
const BLUE = "var(--shotiq-color-analysisBlue)"
const GRAPHITE = "var(--shotiq-color-graphite)"

const TILES: [string, "liveCamera" | "uploadVideo" | "uploadImage", string[], string][] = [
  ["Live camera", "liveCamera", ["Record a new shot", "in real time."], "live"],
  ["Upload video", "uploadVideo", ["Analyze footage", "from your device."], "video"],
  ["Upload image", "uploadImage", ["Analyze a single", "frame or photo."], "image"],
]

const RECENT: [string, string, string, string][] = [
  ["086-film-1", "0:06", "Today • 8:24 AM", "Free Throw"],
  ["086-film-2", "0:04", "Today • 8:17 AM", "Catch & Shoot"],
  ["086-film-4", "0:05", "Yesterday • 6:42 PM", "Pull-Up Jumper"],
  ["086-film-5", "0:05", "Yesterday • 6:35 PM", "Off the Dribble"],
]

/* --------------------------------------------------------- 021 hub ------ */

export function AnalyzeHubPhone({
  name = "Jordan Ellis",
  sub = "Right-handed • Advanced",
  streak = "6",
  points = "2,840",
  shots = "24",
  makes = "15",
  pct = "62.5%",
  delta = "+8.1%",
  target = "Keep elbow stacked through release",
  onTile,
}: {
  name?: string; sub?: string; streak?: string; points?: string
  shots?: string; makes?: string; pct?: string; delta?: string; target?: string
  onTile?: (kind: string) => void
}) {
  return (
    <PhoneScreen testid="screen-ios-analyze-hub" tab="capture" pad={0} headerH={38}>
      <div style={{ paddingLeft: 17, paddingRight: 17, paddingBottom: 70 }}>
        <div className="flex items-start justify-between pt-[14px]">
          <div className="min-w-0">
            <div className="shotiq-display text-[34px] leading[32px] tracking-[0.035em]">{name.toUpperCase()}</div>
            <div className="mt-[3px] text-[12.4px] leading-[14px]" style={{ color: GRAPHITE }}>{sub}</div>
          </div>
          <div className="flex shrink-0 items-start">
            <div className="w-[80px] text-center">
              <span className="flex h-[20px] items-center justify-center"><ActionGlyph kind="uploadVideo" height={17} /></span>
              <div className="shotiq-numeric mt-[5px] text-[19.5px] leading-[16px]">{streak}</div>
              <Micro className="mt-[4px]" size={8.6}>DAY STREAK</Micro>
            </div>
            <span aria-hidden="true" className="mx-[6px] mt-[2px] h-[52px] w-px" style={{ background: RULE }} />
            <div className="w-[64px] text-center">
              <span className="flex h-[20px] items-center justify-center"><ActionGlyph kind="nodeGraph" height={19} /></span>
              <div className="shotiq-numeric mt-[5px] text-[19.5px] leading-[16px]">{points}</div>
              <Micro className="mt-[4px]" size={8.6}>POINTS</Micro>
            </div>
          </div>
        </div>

        <div className="mt-[16px]">
          <div className="shotiq-display text-[37px] leading-[36px] tracking-[0.025em]">ANALYZE YOUR SHOT</div>
          <div className="mt-[7px] text-[13.2px] leading-[15px]" style={{ color: GRAPHITE }}>
            Choose how you want to capture your shot.
          </div>
        </div>

        {/* ONE row of three, in canonical's order. The round-6 build drew four
            tiles in a 2x2 grid with the order reversed and the descriptions
            dropped. */}
        <div className="mt-[14px] flex gap-[10px]">
          {TILES.map(([label, glyph, lines, kind]) => (
            <button key={label} type="button" onClick={() => onTile?.(kind)}
                    data-testid={`phone-analyze-${kind}`}
                    className="flex min-w-0 flex-1 flex-col items-center rounded-[7px] bg-white px-[6px] pb-[13px] pt-[16px]"
                    style={{ border: `1px solid ${RULE}` }}>
              <span className="flex h-[40px] items-center"><ActionGlyph kind={glyph} height={glyph === "uploadVideo" ? 26 : 38} /></span>
              <span className="mt-[13px] text-[14px] leading-[15px]">{label}</span>
              <span className="mt-[6px] block text-center text-[11.6px] leading-[13.6px]" style={{ color: GRAPHITE }}>
                {lines[0]}<br />{lines[1]}
              </span>
            </button>
          ))}
        </div>

        <Link href="/upload/photo-access"
              className="mt-[12px] flex h-[43px] w-full items-center gap-[12px] rounded-[6px] bg-white px-[14px]"
              style={{ border: `1px solid ${RULE}` }} data-testid="phone-analyze-guide">
          <svg width="24" height="26" viewBox="0 0 24 26" fill="none" aria-hidden="true" className="shrink-0"
               stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
            <path d="M3 2 H15 L21 8 V24 H3 Z" />
            <path d="M15 2 V8 H21" />
            <path d="M7 12 H16 M7 16 H16 M7 20 H13" strokeLinecap="round" />
          </svg>
          <span className="text-[15px] leading-[16px]">View capture guide</span>
          <span className="ml-auto flex"><Chev size={16} /></span>
        </Link>

        <div className="mt-[13px] flex items-baseline">
          <SectionHead cap={28}>RECENT CAPTURES</SectionHead>
          <Link href="/media" className="ml-auto flex items-center gap-[5px] text-[12.6px] leading-[13px]">
            View all <Chev size={13} />
          </Link>
        </div>

        <div className="mt-[6px] flex gap-[6px]">
          {RECENT.map(([src, len, when, style]) => (
            <div key={src} className="min-w-0 flex-1">
              <span className="relative block">
                <Frame src={src} w="100%" h={129} radius={4} pos="50% 42%" />
                <span className="shotiq-numeric absolute bottom-[5px] right-[5px] rounded-[3px] bg-black/72 px-[5px] text-[11px] leading-[16px] text-white">
                  {len}
                </span>
              </span>
              <div className="mt-[6px] truncate text-[10.4px] leading-[11px]">{when}</div>
              <div className="mt-[4px] truncate text-[10.4px] leading-[11px]" style={{ color: GRAPHITE }}>{style}</div>
            </div>
          ))}
        </div>

        <div className="mt-[12px] flex items-center gap-[13px] rounded-[7px] bg-white px-[13px] py-[11px]"
             style={{ border: `1px solid ${RULE}` }}>
          <svg width="34" height="30" viewBox="0 0 34 30" fill="none" aria-hidden="true" className="shrink-0"
               stroke={BLUE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 22 L11 9 L24 12 L29 24 Z" />
            <circle cx="5" cy="22" r="2.8" fill="#fff" />
            <circle cx="11" cy="9" r="2.8" fill="#fff" />
            <circle cx="24" cy="12" r="2.8" fill="#fff" />
            <circle cx="29" cy="24" r="2.8" fill="#fff" />
          </svg>
          <span className="min-w-0 flex-1 text-[13.4px] leading-[16px]">
            Film from the side at chest height, showing your full body
            from feet to fingertips with good lighting and a clear background.
          </span>
        </div>

        <div className="mt-[13px]">
          <div className="shotiq-section-label leading-[12px] tracking-[0.075em]"
               style={{ "--shotiq-label-size": "12px" } as React.CSSProperties}>YOUR SHOOTING SNAPSHOT</div>
          <div className="mt-[7px] flex items-start">
            {[[shots, "SHOTS"], [makes, "MAKES"], [pct, "MAKE %"]].map(([v, l], i) => (
              <div key={l} className="min-w-0 flex-1 pr-[8px]"
                   style={i ? { borderLeft: `1px solid ${RULE}`, paddingLeft: 10 } : undefined}>
                <div className="shotiq-numeric text-[22px] leading-[23px]">{v}</div>
                <Micro className="mt-[4px]" size={8.6}>{l}</Micro>
              </div>
            ))}
            <div className="w-[146px] shrink-0 pl-[10px]" style={{ borderLeft: `1px solid ${RULE}` }}>
              <div className="flex items-start gap-[4px]">
                <MiniTrend width={100} height={24} />
                <TrendArrow size={13} />
              </div>
              <div className="mt-[3px] text-[10.4px] leading-[11px]">
                <span style={{ color: GREEN }}>{delta}</span>{" "}
                <span style={{ color: GRAPHITE }}>vs last session</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-[13px] flex items-center gap-[10px]"
             style={{ borderTop: `1px solid ${RULE}`, paddingTop: 12 }}>
          <div className="min-w-0 flex-1">
            <div className="shotiq-section-label leading-[11px] tracking-[0.08em]"
                 style={{ "--shotiq-label-size": "11px" } as React.CSSProperties}>PRIMARY COACHING TARGET</div>
            <div className="mt-[6px] truncate text-[17px] leading-[19px]">{target}</div>
          </div>
          <Chev size={16} />
        </div>
      </div>
    </PhoneScreen>
  )
}

/* ------------------------------------------------------- 025 queue ------ */

export interface QueueItem {
  id: string
  kind: "image" | "video"
  thumb: string
  when: string
  title: string
  status: "Completed" | "Uploading"
  len?: string
  progress?: number
  sent?: string
  total?: string
}

const DEFAULT_QUEUE: QueueItem[] = [
  { id: "1", kind: "image", thumb: "086-film-2", when: "May 21, 2025 at 8:24 AM",
    title: "Release • Set 1", status: "Completed" },
  { id: "2", kind: "video", thumb: "086-film-4", when: "May 21, 2025 at 8:26 AM",
    title: "Game Shootaround", status: "Uploading", len: "0:04", progress: 58,
    sent: "18.7 MB", total: "32.1 MB" },
]

export function UploadQueuePhone({
  name = "Jordan Ellis",
  sub = "Right-handed • Advanced",
  target = "Keep elbow stacked through release",
  score = 82,
  shots = "24",
  makes = "15",
  pct = "62.5%",
  streak = "6",
  points = "2,840",
  items = DEFAULT_QUEUE,
  onAdd,
  onAnalyze,
  onRemoveCompleted,
  onBack,
}: {
  name?: string; sub?: string; target?: string
  score?: number; shots?: string; makes?: string; pct?: string
  streak?: string; points?: string
  items?: QueueItem[]
  onAdd?: () => void
  onAnalyze?: () => void
  onRemoveCompleted?: () => void
  onBack?: () => void
}) {
  const uploading = items.filter((i) => i.status === "Uploading").length
  const completed = items.filter((i) => i.status === "Completed").length
  return (
    <PhoneScreen testid="screen-ios-upload-queue" tab="capture" pad={0} headerH={38}>
      <div style={{ paddingLeft: 19.8, paddingRight: 19.8, paddingBottom: 70 }}>
        <div className="flex items-start justify-between pt-[13px]">
          <div className="min-w-0">
            <div className="shotiq-display text-[35px] leading-[33px] tracking-[0.035em]">{name.toUpperCase()}</div>
            <div className="mt-[3px] text-[12.4px] leading-[14.4px]" style={{ color: GRAPHITE }}>{sub}</div>
            <div className="mt-[3px] text-[12.4px] leading-[14.4px]">{target}</div>
          </div>
          <div className="flex shrink-0 items-start">
            <div className="w-[80px] text-center">
              <span className="flex h-[20px] items-center justify-center"><ActionGlyph kind="uploadVideo" height={17} /></span>
              <div className="shotiq-numeric mt-[5px] text-[19.5px] leading-[16px]">{streak}</div>
              <Micro className="mt-[4px]" size={8.6}>DAY STREAK</Micro>
            </div>
            <span aria-hidden="true" className="mx-[6px] mt-[2px] h-[52px] w-px" style={{ background: RULE }} />
            <div className="w-[64px] text-center">
              <span className="flex h-[20px] items-center justify-center"><ActionGlyph kind="nodeGraph" height={19} /></span>
              <div className="shotiq-numeric mt-[5px] text-[19.5px] leading-[16px]">{points}</div>
              <Micro className="mt-[4px]" size={8.6}>POINTS</Micro>
            </div>
          </div>
        </div>

        <div className="mt-[12px] flex text-center">
          {[[String(score), "FORM SCORE"], [shots, "SHOTS"], [makes, "MAKES"], [pct, "SHOOTING %"]].map(([v, l], i) => (
            <div key={l} className="flex-1" style={i ? { borderLeft: `1px solid ${RULE}` } : undefined}>
              <div className="shotiq-numeric text-[22px] leading-[23px]">{v}</div>
              <Micro className="mt-[5px]" size={8.6}>{l}</Micro>
            </div>
          ))}
        </div>

        <div className="mt-[17px] flex items-start">
          <div className="min-w-0 flex-1">
            <div className="shotiq-display text-[47px] leading-[42px] tracking-[0.02em]">UPLOAD QUEUE</div>
            <div className="mt-[6px] text-[13px] leading-[15px]" style={{ color: GRAPHITE }}>
              Review, upload, and analyze your shots.
            </div>
          </div>
          <button type="button" onClick={onAdd} data-testid="phone-queue-add"
                  className="ml-[12px] flex h-[60px] w-[79px] shrink-0 flex-col items-center justify-center gap-[7px] rounded-[6px] bg-white"
                  style={{ border: `1px solid ${RULE}` }}>
            <ActionGlyph kind="chooseMedia" height={22} />
            <span className="text-[12.4px] leading-[13px]">Add media</span>
          </button>
        </div>

        <div className="mt-[13px] flex items-baseline">
          <SectionHead cap={29}>QUEUE ({items.length})</SectionHead>
          <span className="ml-auto text-[12px] leading-[13px]" style={{ color: GRAPHITE }}>
            {uploading} uploading • {completed} completed
          </span>
        </div>

        {items.map((it) => (
          <div key={it.id} className="mt-[8px] flex gap-[11px] rounded-[7px] bg-white p-[9px]"
               style={{ border: `1px solid ${RULE}` }}>
            <span className="relative block shrink-0">
              <Frame src={it.thumb} w={140} h={148} radius={4} pos="50% 42%" />
              {it.kind === "image" ? (
                <span className="absolute left-[6px] top-[6px] grid h-[24px] w-[24px] place-items-center rounded-[4px] bg-white/92">
                  <svg width="14" height="13" viewBox="0 0 14 13" fill="none" aria-hidden="true"
                       stroke="currentColor" strokeWidth="1.4">
                    <rect x="1" y="1" width="12" height="11" rx="1.4" />
                    <path d="M1 9 L5 5.4 L8 8 L10 6.6 L13 9.4" strokeLinejoin="round" />
                  </svg>
                </span>
              ) : (
                <span className="absolute left-[7px] top-[7px] grid h-[27px] w-[27px] place-items-center rounded-full bg-white/92">
                  <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true"><path d="M1 1 L9 6 L1 11 Z" fill="currentColor" /></svg>
                </span>
              )}
              {it.len && (
                <span className="shotiq-numeric absolute bottom-[5px] right-[5px] rounded-[3px] bg-black/72 px-[5px] text-[11px] leading-[16px] text-white">
                  {it.len}
                </span>
              )}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-[8px]">
                {it.kind === "image"
                  ? <TickDisc size={20} />
                  : (
                    <span className="grid h-[20px] w-[20px] shrink-0 place-items-center rounded-full" style={{ background: BLUE }}>
                      <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true">
                        <path d="M6 10 V3 M3 5.6 L6 2.6 L9 5.6" fill="none" stroke="#fff" strokeWidth="1.9"
                              strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
                <span className="text-[15px] font-medium leading-[16px]">{it.kind === "image" ? "Image" : "Video"}</span>
                <span style={{ color: GRAPHITE }}>•</span>
                <span className="text-[13.4px] leading-[15px]"
                      style={{ color: it.status === "Completed" ? GREEN : BLUE }}>{it.status}</span>
                <span className="ml-auto tracking-[0.16em]" style={{ color: GRAPHITE }}>•••</span>
              </div>
              <div className="mt-[7px] text-[12.6px] leading-[14px]" style={{ color: GRAPHITE }}>{it.when}</div>
              <div className="mt-[7px] text-[13.4px] leading-[15px]">{it.title}</div>

              {it.status === "Completed" ? (
                <>
                  <div className="mt-[7px] text-[13px] leading-[14px]" style={{ color: GREEN }}>Ready to analyze</div>
                  <button type="button" onClick={onAnalyze} data-testid="phone-queue-analyze-now"
                          className="mt-[9px] flex h-[38px] w-full items-center justify-center gap-[10px] rounded-[5px] text-[14.6px]"
                          style={{ border: `1px solid ${ORANGE}`, color: ORANGE }}>
                    <ActionGlyph kind="analyze" height={17} accent={ORANGE} /> Analyze now
                  </button>
                </>
              ) : (
                <>
                  <div className="mt-[7px] flex items-baseline">
                    <span className="shotiq-numeric text-[26px] leading-[26px]">{it.progress}%</span>
                    <span className="ml-auto text-[11.6px] leading-[13px]" style={{ color: GRAPHITE }}>
                      {it.sent} / {it.total}
                    </span>
                  </div>
                  <span className="mt-[6px] block h-[7px] overflow-hidden rounded-full" style={{ background: "#E2E3E4" }}>
                    <span className="block h-full rounded-full" style={{ width: `${it.progress}%`, background: BLUE }} />
                  </span>
                  <div className="mt-[8px] flex items-center">
                    <span className="text-[12.6px] leading-[14px]">Uploading over Wi-Fi</span>
                    <span className="ml-auto grid h-[30px] w-[34px] place-items-center rounded-[4px]"
                          style={{ border: `1px solid ${RULE}` }}>
                      <svg width="11" height="13" viewBox="0 0 11 13" aria-hidden="true">
                        <path d="M1.4 0.8 H3.6 V12.2 H1.4 Z M7.4 0.8 H9.6 V12.2 H7.4 Z" fill="currentColor" />
                      </svg>
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}

        <div className="mt-[12px] rounded-[7px] bg-white px-[13px]" style={{ border: `1px solid ${RULE}` }}>
          {([["wifi", "Uploads will continue in the background", "You can close ShotIQ and we’ll finish uploading."],
             ["cloud", "Connection protection", "We’ll automatically resume if your connection drops."]] as const).map(
            ([kind, title, body], i) => (
              <div key={title} className="flex items-start gap-[13px] py-[12px]"
                   style={i ? { borderTop: `1px solid ${RULE}` } : undefined}>
                <span className="mt-[2px] shrink-0" style={{ color: kind === "wifi" ? BLUE : GRAPHITE }}>
                  {kind === "wifi" ? (
                    <svg width="30" height="24" viewBox="0 0 30 24" fill="none" aria-hidden="true"
                         stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
                      <path d="M2.5 8.5 A18 18 0 0 1 27.5 8.5" />
                      <path d="M7.5 13.5 A11 11 0 0 1 22.5 13.5" />
                      <circle cx="15" cy="20" r="2.4" fill="currentColor" stroke="none" />
                    </svg>
                  ) : (
                    <svg width="30" height="24" viewBox="0 0 30 24" fill="none" aria-hidden="true"
                         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8.5 19 A5.5 5.5 0 0 1 8.9 8 A7.5 7.5 0 0 1 22.5 7.6 A5.7 5.7 0 0 1 23.5 19 Z" />
                      <path d="M3 3 L27 21" />
                    </svg>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-[14.6px] font-medium leading-[16px]">{title}</span>
                  <span className="mt-[4px] block text-[12.4px] leading-[14px]" style={{ color: GRAPHITE }}>{body}</span>
                </span>
              </div>
            ))}
        </div>

        <button type="button" onClick={onAnalyze} data-testid="phone-queue-analyze-selected"
                className="mt-[12px] flex h-[35px] w-full items-center justify-center rounded-[5px] text-[17px] font-medium text-white"
                style={{ background: ORANGE }}>
          Analyze selected ({completed})
        </button>
        <button type="button" onClick={onRemoveCompleted} data-testid="phone-queue-remove"
                className="mt-[7px] flex h-[24px] w-full items-center justify-center gap-[10px] text-[14px]">
          <svg width="14" height="16" viewBox="0 0 14 16" fill="none" aria-hidden="true"
               stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M1.5 3.5 H12.5 M5 3.5 V1.5 H9 V3.5 M2.8 3.5 L3.6 14.5 H10.4 L11.2 3.5" />
          </svg>
          Remove completed
        </button>
        {onBack && (
          <button type="button" onClick={onBack} data-testid="phone-queue-back"
                  className="mt-[10px] w-full text-[13px]" style={{ color: GRAPHITE }}>
            Back to analyze
          </button>
        )}
      </div>
    </PhoneScreen>
  )
}
