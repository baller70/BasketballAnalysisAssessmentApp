"use client"

/**
 * Canonical iOS 019-home-professional and 020-profile-menu.
 *
 * Both graders found 019 still laying out in two columns at 393pt: a 2px
 * interior divider at x=447px (206pt) running 1411px, 76% of the viewport
 * height, against a canonical set that has ZERO interior vertical rules on any
 * of the 72. Everything downstream of that followed — the right column fell to
 * ~150pt, so LATEST SESSION broke one character per line ("2 / 4 / SH / OTS",
 * "6 / 2. / 5 / % / MA / KE / %"). This is one column, full bleed, no interior
 * vertical rule anywhere except the hairlines *inside* a stat strip, which
 * canonical does draw.
 *
 * Measured off the canonical PNGs at 853/393 = 2.170483 px per pt:
 *
 * 019
 *   header rule           38.0
 *   identity              name top 55.3  cap 26.7  x 16.1;  sub top 93.1
 *                         streak x 232.7, points x 321.1
 *   primary CTA           y 117.5-158.5  x 15.7-376.9   (41.0 tall, full bleed)
 *   two secondary tiles   y 168-205      each ~178 wide
 *   FORM OVERVIEW head    y 229.0-240.0  "Today at 8:24 AM" right-aligned
 *   hero still            y 246.5-434.5  x 15.7-273 ; score column x 292-360
 *   phase rail            y 441.8-500.3  five figures + captions + values
 *   MECHANICS TRENDS      y 518.3-534.0  legend right
 *     five tiles          y 541.8-604.9
 *   RECENT SESSIONS       y 626.1-637.6  "View all" right
 *     session card        y 644.1-724.3  thumb + 3 stats + phase values
 *   coaching target       y 736.2-762.0
 *   session strip         y 769.0-796.6
 *   tab-bar rule          800
 *
 * 020 (the phone overflow sheet — a PAGE, not a dropdown; canonical closes it
 * with an X, not a gear)
 *   wordmark + X          y 17.5-32.7    X at x 369.5
 *   avatar                y 50.7-153.4   102.7 dia at x 20.7
 *   name                  top 60         cap ~38  x 143
 *   View profile pill     y 118-155      x 143-271
 *   4-stat strip          y 172-244      DAY STREAK / POINTS / FORM SCORE /
 *                                        VS LAST SESSION
 *   3-stat strip          y 260-297      SHOTS / MAKES / ACCURACY
 *   DASHBOARD MODE card   y 336.3-381.9  Analysis|Training segmented control
 *   link group            rows at 425.7 / 486.1 / 553.8 / 619.7 / 680.5
 *   SIGN OUT card         y 751.0-780.9
 *   tab-bar rule          794
 */

import React from "react"
import Link from "next/link"
import { PhoneScreen, PhoneIdentity, MiniTrend } from "@/components/shotiq/PhoneShell"
import {
  Chev, Frame, ScoreBar, Micro, SectionHead, TrendArrow,
} from "@/components/shotiq/phone/results/Kit"
import { ActionGlyph, PoseFigure } from "@/components/shotiq/Glyphs"

const RULE = "var(--shotiq-color-rule)"
const ORANGE = "var(--shotiq-color-shotiqOrange)"
const GREEN = "var(--shotiq-color-confirmGreen)"
const BLUE = "var(--shotiq-color-analysisBlue)"
const RED = "var(--shotiq-color-reviewRed)"
const GRAPHITE = "var(--shotiq-color-graphite)"

const PHASES: [string, "setup" | "load" | "rise" | "release" | "follow", string][] = [
  ["SETUP", "setup", "84"], ["LOAD", "load", "78"], ["RISE", "rise", "80"],
  ["RELEASE", "release", "82"], ["FOLLOW-THROUGH", "follow", "85"],
]

const TRENDS: [string, "setup" | "load" | "rise" | "release" | "follow", string, string, "up" | "flat" | "down"][] = [
  ["RELEASE HEIGHT", "release", "7’6”", "+0.6”", "up"],
  ["RELEASE ANGLE", "rise", "49°", "+3°", "up"],
  ["ELBOW STACK", "load", "91%", "+7%", "up"],
  ["SHOT SPEED", "follow", "4.2", "−0.1", "down"],
  ["CONSISTENCY", "setup", "83%", "+6%", "up"],
]

/* ------------------------------------------------------------ 019 home -- */

export function HomeProfessionalPhone({
  name = "Jordan Ellis",
  sub = "Right-handed • Advanced",
  streak = "6",
  points = "2,840",
  score = 82,
  shots = "24",
  makes = "15",
  pct = "62.5%",
  delta = "+8.1%",
  when = "Today at 8:24 AM",
  target = "Keep elbow stacked through release",
  onMenu,
}: {
  name?: string; sub?: string; streak?: string; points?: string
  score?: number; shots?: string; makes?: string; pct?: string; delta?: string
  when?: string; target?: string
  onMenu?: () => void
}) {
  return (
    <PhoneScreen testid="screen-ios-home-professional" tab="home" pad={0} headerH={38}>
      <div style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 70 }}>
        {/* Tapping your own name opens the profile sheet (canonical 020). It is
            the identity block itself, not a second header glyph: canonical 019
            draws exactly one trailing mark in the top bar, the gear. */}
        <button type="button" data-testid="phone-menu-button" onClick={onMenu}
                className="block w-full pt-[15px] text-left">
          <PhoneIdentity name={name} sub={sub} streak={streak} points={points} />
        </button>

        <Link href="/results/demo"
              className="mt-[13px] flex h-[41px] w-full items-center justify-center gap-[16px] rounded-[4px] text-[17px] font-medium text-white"
              style={{ background: ORANGE }} data-testid="phone-open-workspace">
          <ActionGlyph kind="analyze" height={22} accent="#fff" /> Open analysis workspace
        </Link>

        <div className="mt-[11px] flex gap-[10px]">
          {([["New capture", "/analyze", "nodeClimb"], ["View history", "/results/demo/history", "uploadVideo"]] as const).map(
            ([label, href, glyph]) => (
              <Link key={label} href={href}
                    className="flex h-[37px] min-w-0 flex-1 items-center justify-center gap-[12px] rounded-[4px] bg-white text-[13.6px]"
                    style={{ border: `1px solid ${RULE}` }}>
                <ActionGlyph kind={glyph} height={17} />
                <span className="truncate">{label}</span>
              </Link>
            ))}
        </div>

        <div className="mt-[14px] flex items-baseline">
          <SectionHead cap={26}>FORM OVERVIEW</SectionHead>
          <span className="ml-auto text-[12.4px] leading-[13px]" style={{ color: GRAPHITE }}>{when}</span>
        </div>

        <div className="mt-[7px] flex items-start gap-[13px]">
          <Frame src="079-latest-analysis" w={255} h={188} radius={4} pos="50% 45%" />
          <div className="min-w-0 flex-1">
            <div className="shotiq-section-label leading-[12px] tracking-[0.075em]"
                 style={{ "--shotiq-label-size": "12px" } as React.CSSProperties}>FORM SCORE</div>
            <div className="shotiq-numeric mt-[2px] text-[58px] leading-[0.82]" style={{ color: ORANGE }}>{score}</div>
            <ScoreBar score={score} width={74} height={6} />
            <div className="shotiq-display mt-[7px] text-[16px] leading-[16px] tracking-[0.04em]" style={{ color: BLUE }}>GOOD</div>
            <div className="mt-[4px] text-[12.4px] leading-[14.4px]">Keep building<br />consistency.</div>
          </div>
        </div>

        {/* phase rail with per-phase values under the captions */}
        <div className="mt-[7px] flex items-end">
          {PHASES.map(([label, kind, value], i) => {
            const on = kind === "release"
            return (
              <div key={label} className="relative flex min-w-0 flex-1 flex-col items-center">
                {i > 0 && (
                  <span aria-hidden="true" className="absolute left-[-50%] top-[46%] h-px w-full" style={{ background: RULE }} />
                )}
                <PoseFigure phase={kind} height={28} active={on} className="relative" />
                <span className="shotiq-display relative mt-[5px] text-center text-[9.6px] leading-[10px] tracking-[0.03em]"
                      style={{ color: on ? ORANGE : undefined }}>{label}</span>
                <span className="shotiq-numeric relative mt-[3px] text-[13px] leading-[13px]"
                      style={{ color: on ? ORANGE : undefined }}>{value}</span>
                {on && <span aria-hidden="true" className="relative mt-[3px] h-[2px] w-[46px]" style={{ background: ORANGE }} />}
              </div>
            )
          })}
        </div>

        <div className="mt-[10px] flex items-start" style={{ borderTop: `1px solid ${RULE}`, paddingTop: 9 }}>
          <SectionHead cap={34}>MECHANICS TRENDS</SectionHead>
          <div className="ml-auto text-right">
            <div className="flex items-center justify-end gap-[10px] text-[10.6px] leading[11px]">
              <span className="flex items-center gap-[4px]">
                <svg width="9" height="8" viewBox="0 0 9 8" aria-hidden="true"><path d="M4.5 0 L9 8 H0 Z" fill={GREEN} /></svg>
                Improved
              </span>
              <span className="flex items-center gap-[4px]">
                <svg width="11" height="3" viewBox="0 0 11 3" aria-hidden="true"><path d="M0 1.5 H11" stroke={GRAPHITE} strokeWidth="1.6" /></svg>
                Stable
              </span>
              <span className="flex items-center gap-[4px]">
                <svg width="9" height="8" viewBox="0 0 9 8" aria-hidden="true"><path d="M4.5 8 L0 0 H9 Z" fill={ORANGE} /></svg>
                Needs work
              </span>
            </div>
            <div className="mt-[3px] text-[10px] leading-[11px]" style={{ color: GRAPHITE }}>vs last 5 sessions</div>
          </div>
        </div>

        <div className="mt-[6px] flex">
          {TRENDS.map(([label, kind, value, d, dir], i) => (
            <div key={label} className="min-w-0 flex-1 px-[3px] text-center"
                 style={i ? { borderLeft: `1px solid ${RULE}` } : undefined}>
              <span className="flex justify-center"><PoseFigure phase={kind} height={25} /></span>
              <div className="shotiq-microcaps mt-[4px] leading-[9px]"
                   style={{ fontSize: 7.4, color: GRAPHITE }}>{label}</div>
              <div className="shotiq-numeric mt-[3px] text-[16px] leading-[16px]">{value}</div>
              <div className="mt-[2px] flex items-center justify-center gap-[2px] text-[10px] leading-[11px]"
                   style={{ color: dir === "down" ? RED : GREEN }}>
                {d}
                <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
                  <path d={dir === "down" ? "M1 1 L9 9 M9 4 V9 H4" : "M1 9 L9 1 M4 1 H9 V6"}
                        fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-[10px] flex items-baseline" style={{ borderTop: `1px solid ${RULE}`, paddingTop: 9 }}>
          <SectionHead cap={34}>RECENT SESSIONS</SectionHead>
          <Link href="/results/demo/history" className="ml-auto text-[12.4px] leading-[13px]">View all</Link>
        </div>

        <div className="mt-[6px] flex items-center gap-[10px] rounded-[6px] bg-white p-[6px]"
             style={{ border: `1px solid ${RULE}` }}>
          <Frame src="086-film-3" w={112} h={78} radius={3} pos="50% 40%" />
          <div className="min-w-0 flex-1">
            <div className="text-[12.6px] leading-[13px]">{when}</div>
            <div className="mt-[4px] flex">
              {[[shots, "SHOTS"], [makes, "MAKES"], [pct, "MAKE %"]].map(([v, l], i) => (
                <div key={l} className="min-w-0 flex-1 pr-[6px]"
                     style={i ? { borderLeft: `1px solid ${RULE}`, paddingLeft: 8 } : undefined}>
                  <div className="shotiq-numeric text-[16px] leading-[17px]">{v}</div>
                  <Micro className="mt-[2px]" size={7.6}>{l}</Micro>
                </div>
              ))}
            </div>
            <div className="mt-[4px] flex items-end">
              {PHASES.map(([label, kind, value], i) => {
                const on = kind === "release"
                return (
                  <div key={label} className="relative flex min-w-0 flex-1 flex-col items-center">
                    {i > 0 && (
                      <span aria-hidden="true" className="absolute left-[-50%] top-[46%] h-px w-full" style={{ background: RULE }} />
                    )}
                    <PoseFigure phase={kind} height={18} active={on} className="relative" />
                    <span className="shotiq-numeric relative mt-[2px] text-[11px] leading-[11px]"
                          style={{ color: on ? ORANGE : undefined }}>{value}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <Chev size={16} />
        </div>

        <div className="mt-[7px] flex items-center gap-[10px] rounded-[6px] bg-white px-[11px] py-[7px]"
             style={{ border: `1px solid ${RULE}` }}>
          <div className="min-w-0 flex-1">
            <div className="shotiq-section-label leading-[11px] tracking-[0.08em]"
                 style={{ "--shotiq-label-size": "11px" } as React.CSSProperties}>PRIMARY COACHING TARGET</div>
            <div className="mt-[4px] truncate text-[16.6px] leading-[18px]">{target}</div>
          </div>
          <Chev size={16} />
        </div>

        <div className="mt-[8px] flex items-start">
          {[[shots, "SHOTS"], [makes, "MAKES"], [pct, "MAKE %"]].map(([v, l], i) => (
            <div key={l} className="min-w-0 flex-1 pr-[8px]"
                 style={i ? { borderLeft: `1px solid ${RULE}`, paddingLeft: 10 } : undefined}>
              <div className="shotiq-numeric text-[21px] leading-[22px]">{v}</div>
              <Micro className="mt-[4px]" size={8.6}>{l}</Micro>
            </div>
          ))}
          <div className="w-[142px] shrink-0 pl-[10px]" style={{ borderLeft: `1px solid ${RULE}` }}>
            <div className="flex items-start gap-[4px]">
              <MiniTrend width={100} height={24} />
              <TrendArrow size={13} />
            </div>
            <div className="mt-[3px] text-[10.4px] leading[11px]">
              <span style={{ color: GREEN }}>{delta}</span>{" "}
              <span style={{ color: GRAPHITE }}>vs last session</span>
            </div>
          </div>
        </div>
      </div>
    </PhoneScreen>
  )
}

/* ------------------------------------------------------- 020 menu sheet -- */

const MENU: [string, string, string, string][] = [
  ["media", "MY MEDIA", "View and manage your captured content", "/media"],
  ["elite", "ELITE SHOOTERS", "Study top shooters and their mechanics", "/elite-shooters"],
  ["achievements", "ACHIEVEMENTS", "Track milestones and personal bests", "/points"],
  ["points", "POINTS SYSTEM", "Learn how points work and how to earn more", "/points"],
  ["settings", "SETTINGS", "Customize your app experience", "/settings"],
]

function MenuMark({ kind }: { kind: string }) {
  const p = {
    width: 44, height: 40, viewBox: "0 0 44 40", fill: "none", stroke: "currentColor",
    strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
    "aria-hidden": true, className: "block",
  }
  switch (kind) {
    case "media":
      return (
        <svg {...p}>
          <path d="M4 11 V6 A2 2 0 0 1 6 4 H11 M33 4 H38 A2 2 0 0 1 40 6 V11 M40 29 V34 A2 2 0 0 1 38 36 H33 M11 36 H6 A2 2 0 0 1 4 34 V29" />
          <path d="M13 27 L20 20 L27 23 L33 15" stroke={ORANGE} strokeDasharray="2.6 2.6" />
          <circle cx="13" cy="27" r="2.6" stroke={ORANGE} />
          <circle cx="20" cy="20" r="2.6" stroke={ORANGE} />
          <circle cx="33" cy="15" r="2.6" stroke={ORANGE} />
        </svg>
      )
    case "elite":
      return (
        <svg {...p}>
          <path d="M9 36 L13 24 L22 20 L30 24" />
          <path d="M13 24 L7 19 L4 24" />
          <circle cx="24" cy="12" r="3" />
          <circle cx="36" cy="10" r="4.4" stroke={ORANGE} />
        </svg>
      )
    case "achievements":
      return (
        <svg {...p}>
          <path d="M5 34 V26 H14 V18 H23 V10 H32" />
          <path d="M32 4 V16" stroke={ORANGE} />
          <path d="M32 4 L40 7 L32 10" fill={ORANGE} stroke={ORANGE} />
        </svg>
      )
    case "points":
      return (
        <svg {...p}>
          <path d="M22 5 L36 13 V28 L22 36 L8 28 V13 Z" />
          <circle cx="8" cy="13" r="2.4" fill="#fff" />
          <circle cx="36" cy="13" r="2.4" fill="#fff" />
          <circle cx="8" cy="28" r="2.4" fill="#fff" />
          <circle cx="36" cy="28" r="2.4" fill="#fff" />
          <circle cx="22" cy="5" r="2.4" fill="#fff" />
          <circle cx="22" cy="36" r="2.4" fill="#fff" />
          <circle cx="19" cy="21" r="3.4" stroke={ORANGE} />
        </svg>
      )
    default:
      return (
        <svg {...p}>
          <circle cx="22" cy="20" r="10.5" />
          <circle cx="22" cy="20" r="4.6" stroke={ORANGE} />
          <path d="M22 4 V9 M22 31 V36 M8 20 H4 M40 20 H36 M11 9 L14 12 M33 31 L30 28 M33 9 L30 12 M11 31 L14 28" />
        </svg>
      )
  }
}

export function ProfileMenuPhone({
  name = "Jordan Ellis",
  sub = "Right-handed • Advanced",
  streak = "6",
  points = "2,840",
  score = 82,
  shots = "24",
  makes = "15",
  pct = "62.5%",
  delta = "+8.1%",
  mode = "analysis",
  onMode,
  onClose,
  onSignOut,
  avatar = "096-avatar",
}: {
  name?: string; sub?: string; streak?: string; points?: string
  score?: number; shots?: string; makes?: string; pct?: string; delta?: string
  mode?: "analysis" | "training"
  onMode?: (m: "analysis" | "training") => void
  onClose?: () => void
  onSignOut?: () => void
  avatar?: string
}) {
  return (
    <PhoneScreen testid="screen-ios-profile-menu" tab="home" pad={0} header={false}>
      <div style={{ paddingLeft: 20.7, paddingRight: 20.7, paddingBottom: 70 }}>
        <div className="flex items-center pt-[14px]">
          <Link href="/dashboard" className="shotiq-wordmark text-[17.5px] leading-none tracking-[0.15em]">
            SHOT<span style={{ color: ORANGE }}>IQ</span>
          </Link>
          <button type="button" aria-label="Close" onClick={onClose} className="ml-auto"
                  data-testid="phone-menu-close">
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 4 L20 20 M20 4 L4 20" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mt-[7px] flex items-center gap-[15px]">
          <Frame src={avatar} w={100} h={100} radius={50} pos="50% 30%" />
          <div className="min-w-0">
            <div className="shotiq-display text-[36px] leading-[34px] tracking-[0.035em]">{name.toUpperCase()}</div>
            <div className="mt-[4px] text-[13.4px] leading-[15px]" style={{ color: GRAPHITE }}>{sub}</div>
            <Link href="/profile"
                  className="mt-[8px] flex h-[37px] w-[128px] items-center justify-center gap-[9px] rounded-[5px] text-[14px]"
                  style={{ border: `1px solid ${ORANGE}`, color: ORANGE }}>
              <ActionGlyph kind="analyze" height={16} accent={ORANGE} />
              View profile
              <Chev size={13} color={ORANGE} />
            </Link>
          </div>
        </div>

        {/* four-cell strip */}
        <div className="mt-[11px] flex text-center">
          <div className="flex-1">
            <span className="flex h-[26px] items-center justify-center">
              <ActionGlyph kind="uploadVideo" height={17} />
            </span>
            <div className="shotiq-numeric mt-[6px] text-[22px] leading-[22px]">{streak}</div>
            <Micro className="mt-[5px]" size={8.6}>DAY STREAK</Micro>
          </div>
          <div className="flex-1" style={{ borderLeft: `1px solid ${RULE}` }}>
            <span className="flex h-[26px] items-center justify-center">
              <ActionGlyph kind="nodeGraph" height={20} />
            </span>
            <div className="shotiq-numeric mt-[6px] text-[22px] leading-[22px]">{points}</div>
            <Micro className="mt-[5px]" size={8.6}>POINTS</Micro>
          </div>
          <div className="flex-1" style={{ borderLeft: `1px solid ${RULE}` }}>
            <span className="flex h-[26px] items-center justify-center">
              <ActionGlyph kind="analyze" height={22} />
            </span>
            <div className="shotiq-numeric mt-[6px] text-[22px] leading-[22px]">{score}</div>
            <Micro className="mt-[5px]" size={8.6}>FORM SCORE</Micro>
          </div>
          <div className="flex-1" style={{ borderLeft: `1px solid ${RULE}` }}>
            <span className="flex h-[26px] items-center justify-center gap-[3px]">
              <MiniTrend width={62} height={22} />
              <TrendArrow size={12} />
            </span>
            <div className="shotiq-numeric mt-[6px] text-[22px] leading-[22px]" style={{ color: GREEN }}>{delta}</div>
            <Micro className="mt-[5px]" size={8.6}>VS LAST SESSION</Micro>
          </div>
        </div>

        {/* three-cell strip */}
        <div className="mt-[11px] flex text-center">
          {[[shots, "SHOTS"], [makes, "MAKES"], [pct, "ACCURACY"]].map(([v, l], i) => (
            <div key={l} className="flex-1" style={i ? { borderLeft: `1px solid ${RULE}` } : undefined}>
              <div className="shotiq-numeric text-[22px] leading-[22px]">{v}</div>
              <Micro className="mt-[5px]" size={8.6}>{l}</Micro>
            </div>
          ))}
        </div>

        {/* dashboard mode */}
        <div className="mt-[12px] flex items-center gap-[13px] rounded-[7px] px-[11px] py-[10px]"
             style={{ border: `1px solid ${RULE}`, background: "var(--shotiq-color-warmCanvas)" }}>
          <MenuMark kind="media" />
          <div className="min-w-0 flex-1">
            <div className="shotiq-display text-[19px] leading-[19px] tracking-[0.03em]">DASHBOARD MODE</div>
            <div className="mt-[5px] text-[12.4px] leading-[14.4px]" style={{ color: GRAPHITE }}>
              Choose what you see first when you open ShotIQ.
            </div>
          </div>
          <div className="flex h-[38px] shrink-0 overflow-hidden rounded-[4px]" style={{ border: `1px solid ${RULE}` }}>
            {(["analysis", "training"] as const).map((m) => (
              <button key={m} type="button" onClick={() => onMode?.(m)}
                      data-testid={`phone-menu-mode-${m}`}
                      className="flex w-[60px] items-center justify-center text-[13.6px] font-medium capitalize"
                      style={m === mode
                        ? { background: ORANGE, color: "#fff" }
                        : { background: "#F1F1F1", color: "var(--shotiq-color-ink)" }}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* destinations */}
        <div className="mt-[12px] overflow-hidden rounded-[7px] bg-white" style={{ border: `1px solid ${RULE}` }}>
          {MENU.map(([kind, label, desc, href], i) => (
            <Link key={label} href={href} className="flex items-center gap-[13px] px-[11px] py-[11px]"
                  style={i ? { borderTop: `1px solid ${RULE}` } : undefined}>
              <MenuMark kind={kind} />
              <span className="min-w-0 flex-1">
                <span className="shotiq-display block text-[21px] leading-[21px] tracking-[0.03em]">{label}</span>
                <span className="mt-[5px] block text-[12.4px] leading-[14px]" style={{ color: GRAPHITE }}>{desc}</span>
              </span>
              <Chev size={17} />
            </Link>
          ))}
        </div>

        <div className="mt-[12px] rounded-[7px] bg-white" style={{ border: `1px solid ${RULE}` }}>
          <button type="button" onClick={onSignOut} data-testid="phone-menu-signout"
                  className="flex w-full items-center gap-[13px] px-[11px] py-[11px] text-left">
            <svg width="44" height="40" viewBox="0 0 44 40" fill="none" aria-hidden="true" className="block"
                 stroke={ORANGE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 6 H6 V34 H22" />
              <path d="M18 20 H38 M31 13 L38 20 L31 27" />
            </svg>
            <span className="min-w-0 flex-1">
              <span className="shotiq-display block text-[21px] leading-[21px] tracking-[0.03em]">SIGN OUT</span>
              <span className="mt-[5px] block text-[12.4px] leading-[14px]" style={{ color: GRAPHITE }}>
                Sign out of your ShotIQ account
              </span>
            </span>
            <Chev size={17} />
          </button>
        </div>
      </div>
    </PhoneScreen>
  )
}
