"use client"

/**
 * Canonical iOS 070-profile.
 *
 * Round 6 rendered the profile EDIT FORM here — the account form the desktop
 * route opens with — so canonical's avatar hero, the five-cell stat strip, the
 * orange "Edit player profile" CTA and every section below it (PHYSICAL
 * PROFILE, SHOOTING PROFILE, PLAYER CARD, ABOUT, PROFILE COMPLETION, ACCOUNT
 * INFO, RECENT ACTIVITY) were absent, and the form's own select values were
 * truncated by their chevrons ("Advance⌄", "Catch & ⌄"). The overview is the
 * screen; the form is one tap away.
 *
 * Measured off canonical/070-profile.png at 853/393 = 2.170483 px/pt
 * (scratchpad r6d/b.py):
 *
 *   header rule            38.0
 *   avatar                 y  41.5-143.3   101.8 dia at x 17.0, pencil badge
 *                          at its lower-right
 *   name                   top ~62  cap 49.3  x 133
 *   sub                    y  95-110
 *   five-cell strip        y 152.5-196.7   DAY STREAK / POINTS / SHOTS /
 *                                          MAKES / MAKE %
 *   primary CTA            y 208.7-243.7   x 17.5-374.6  (35.0 tall, orange)
 *   PHYSICAL PROFILE       y 264.5-328.0   three cells
 *   SHOOTING PROFILE       y 358.9-422.5   three cells
 *   PLAYER CARD            y 452.0-552.9   dark card + copy + "View player card"
 *   ABOUT JORDAN           y 583.3-623.4   "Enhance bio" right, two lines
 *   PROFILE COMPLETION     y 650.5-691.6   meter + 82% + four ticks
 *   ACCOUNT INFO |         y 715.0-789.2   two columns
 *   RECENT ACTIVITY
 *   tab-bar rule           796
 */

import React from "react"
import { usePlayerChrome } from "@/components/shotiq/phone/usePlayerChrome"
import Link from "next/link"
import { PhoneScreen } from "@/components/shotiq/PhoneShell"
import { Chev, Micro, SectionHead } from "@/components/shotiq/phone/results/Kit"
import { ActionGlyph } from "@/components/shotiq/Glyphs"

const RULE = "var(--shotiq-color-rule)"
const ORANGE = "var(--shotiq-color-shotiqOrange)"
const GREEN = "var(--shotiq-color-confirmGreen)"
const BLUE = "var(--shotiq-color-analysisBlue)"
const GRAPHITE = "var(--shotiq-color-graphite)"

function BodyMark({ kind }: { kind: string }) {
  const p = {
    width: 34, height: 38, viewBox: "0 0 34 38", fill: "none", stroke: "currentColor",
    strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
    "aria-hidden": true, className: "block shrink-0",
  }
  switch (kind) {
    case "height":
      return (
        <svg {...p}>
          <path d="M17 5 V33" stroke={ORANGE} />
          <path d="M11 5 H23 M11 33 H23" />
          <path d="M13 9 L17 5 L21 9 M13 29 L17 33 L21 29" stroke={ORANGE} />
        </svg>
      )
    case "weight":
      return (
        <svg {...p}>
          <circle cx="17" cy="8" r="4" />
          <path d="M10 33 C10 20 12 14 17 14 C22 14 24 20 24 33 Z" />
          <path d="M6 33 H28" />
        </svg>
      )
    case "wingspan":
      return (
        <svg {...p}>
          <circle cx="17" cy="7" r="3.4" />
          <path d="M17 11 V22 M4 14 H30 M17 22 L11 33 M17 22 L23 33" />
          <circle cx="4" cy="14" r="2.2" fill={ORANGE} stroke={ORANGE} />
          <circle cx="30" cy="14" r="2.2" fill={ORANGE} stroke={ORANGE} />
        </svg>
      )
    case "releaseHeight":
      return (
        <svg {...p}>
          <path d="M9 33 L12 22 L18 18 L23 21" />
          <path d="M12 22 L7 18 L4 22" />
          <circle cx="25" cy="10" r="4.6" stroke={ORANGE} />
          <path d="M20 14 L23 12" stroke={ORANGE} />
        </svg>
      )
    case "releaseAngle":
      return (
        <svg {...p}>
          <path d="M5 28 H29 M5 28 A20 20 0 0 1 25 10" />
          <path d="M17 28 L27 16 L24 26 Z" fill={ORANGE} stroke={ORANGE} />
        </svg>
      )
    default:
      return (
        <svg {...p}>
          <path d="M17 6 V22" strokeDasharray="2.4 2.4" />
          <path d="M8 30 H26" />
          <circle cx="17" cy="24" r="3.4" stroke={ORANGE} />
          <circle cx="8" cy="30" r="2" fill={ORANGE} stroke={ORANGE} />
          <circle cx="26" cy="30" r="2" fill={ORANGE} stroke={ORANGE} />
        </svg>
      )
  }
}

export function ProfileOverviewPhone({
  name,
  sub,
  streak,
  points,
  shots = "24",
  makes = "15",
  pct = "62.5%",
  height = "6’3”",
  weight = "185",
  wingspan = "6’5”",
  releaseHeight = "8’11”",
  releaseAngle = "58",
  shotShape = "0",
  bio = ["Dedicated to the details. Constantly working to build a", "repeatable, efficient shot with elite consistency."],
  completion = 82,
  memberSince = "May 12, 2024",
  lastLogin = "Today at 8:24 AM",
  activity = [
    ["Quick Release Builder", "Today at 8:24 AM"],
    ["Catch & Shoot Review", "May 11, 2024"],
    ["Mid-Range Mechanics", "May 10, 2024"],
  ] as [string, string][],
  avatar = "/images/canonical/096-avatar.png",
  onEdit,
}: {
  name?: string; sub?: string; streak?: string; points?: string
  shots?: string; makes?: string; pct?: string
  height?: string; weight?: string; wingspan?: string
  releaseHeight?: string; releaseAngle?: string; shotShape?: string
  bio?: string[]
  completion?: number
  memberSince?: string; lastLogin?: string
  activity?: [string, string][]
  avatar?: string
  onEdit?: () => void
}) {
  const chrome = usePlayerChrome()

  return (
    <PhoneScreen testid="screen-ios-profile" tab="profile" pad={0} headerH={38}>
      <div style={{ paddingLeft: 17.5, paddingRight: 17.5, paddingBottom: 70 }}>
        <div className="flex items-center gap-[15px] pt-[10px]">
          <span className="relative block shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatar} alt="" aria-hidden="true"
                 className="block h-[94px] w-[94px] rounded-full object-cover"
                 style={{ objectPosition: "50% 30%" }} />
            <button type="button" onClick={onEdit} aria-label="Change photo"
                    data-testid="phone-profile-avatar-edit"
                    className="absolute bottom-[1px] right-[-2px] grid h-[34px] w-[34px] place-items-center rounded-full bg-white"
                    style={{ border: `1px solid ${RULE}` }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true"
                   stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
                <path d="M10.4 1.6 L13.4 4.6 L5 13 H2 V10 Z" />
              </svg>
            </button>
          </span>
          <div className="min-w-0">
            <div className="shotiq-display text-[41px] leading-[38px] tracking-[0.02em]">{(name ?? chrome.name).toUpperCase()}</div>
            <div className="mt-[6px] text-[13.4px] leading-[15px]" style={{ color: GRAPHITE }}>{sub ?? chrome.sub}</div>
          </div>
        </div>

        <div className="mt-[9px] flex text-center">
          <div className="flex-1">
            <span className="flex h-[22px] items-center justify-center"><ActionGlyph kind="uploadVideo" height={17} /></span>
            <div className="shotiq-numeric mt-[4px] text-[20px] leading-[20px]">{streak ?? chrome.streak}</div>
            <Micro className="mt-[4px]" size={8.2}>DAY STREAK</Micro>
          </div>
          <div className="flex-1" style={{ borderRight: `1px solid ${RULE}` }}>
            <span className="flex h-[22px] items-center justify-center"><ActionGlyph kind="nodeGraph" height={20} /></span>
            <div className="shotiq-numeric mt-[4px] text-[20px] leading-[20px]">{points ?? chrome.points}</div>
            <Micro className="mt-[4px]" size={8.2}>POINTS</Micro>
          </div>
          {[[shots, "SHOTS"], [makes, "MAKES"], [pct, "MAKE %"]].map(([v, l], i) => (
            <div key={l} className="flex-1 pt-[24px]" style={i ? { borderLeft: `1px solid ${RULE}` } : undefined}>
              <div className="shotiq-numeric text-[20px] leading-[20px]">{v}</div>
              <Micro className="mt-[4px]" size={8.2}>{l}</Micro>
            </div>
          ))}
        </div>

        <button type="button" onClick={onEdit} data-testid="phone-profile-edit"
                className="mt-[10px] flex h-[35px] w-full items-center justify-center gap-[15px] rounded-[4px] text-[16px] font-medium text-white"
                style={{ background: ORANGE }}>
          <ActionGlyph kind="analyze" height={20} accent="#fff" /> Edit player profile
        </button>

        <div className="mt-[9px] rounded-[7px] bg-white px-[11px] pb-[10px] pt-[9px]" style={{ border: `1px solid ${RULE}` }}>
          <SectionHead cap={24}>PHYSICAL PROFILE</SectionHead>
          <div className="mt-[7px] flex">
            {([["height", height, "HEIGHT", ""], ["weight", weight, "WEIGHT", "lbs"], ["wingspan", wingspan, "WINGSPAN", ""]] as const).map(
              ([kind, v, l, unit], i) => (
                <div key={l} className="flex min-w-0 flex-1 items-center gap-[7px] px-[4px]"
                     style={i ? { borderLeft: `1px solid ${RULE}` } : undefined}>
                  <BodyMark kind={kind} />
                  <span className="min-w-0">
                    <span className="shotiq-numeric block text-[21px] leading-[21px]">
                      {v}{unit && <span className="ml-[3px] text-[12px]" style={{ color: GRAPHITE }}>{unit}</span>}
                    </span>
                    <Micro className="mt-[4px]" size={8.4}>{l}</Micro>
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="mt-[9px] rounded-[7px] bg-white px-[11px] pb-[10px] pt-[9px]" style={{ border: `1px solid ${RULE}` }}>
          <SectionHead cap={24}>SHOOTING PROFILE</SectionHead>
          <div className="mt-[7px] flex">
            {([["releaseHeight", "Release height", releaseHeight], ["releaseAngle", "Release angle", `${releaseAngle}°`],
               ["shotShape", "Shot shape", `${shotShape}°`]] as const).map(([kind, l, v], i) => (
              <div key={l} className="flex min-w-0 flex-1 items-start gap-[5px] px-[3px]"
                   style={i ? { borderLeft: `1px solid ${RULE}` } : undefined}>
                <BodyMark kind={kind} />
                <span className="min-w-0">
                  <span className="block text-[10.4px] leading-[11.6px]" style={{ color: GRAPHITE }}>{l}</span>
                  <span className="shotiq-numeric mt-[3px] block text-[19px] leading-[19px]">{v}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-[9px] rounded-[7px] bg-white px-[11px] pb-[10px] pt-[9px]" style={{ border: `1px solid ${RULE}` }}>
          <SectionHead cap={23}>PLAYER CARD</SectionHead>
          <div className="mt-[7px] flex items-center gap-[13px]">
            <span className="relative block h-[74px] w-[118px] shrink-0 overflow-hidden rounded-[6px] bg-[#151515]">
              <span className="shotiq-wordmark absolute left-[9px] top-[8px] text-[9px] tracking-[0.14em] text-white">
                SHOT<span style={{ color: ORANGE }}>IQ</span>
              </span>
              <span className="shotiq-display absolute inset-x-0 top-[27px] text-center text-[32px] leading-[32px] text-white">JE</span>
              <span className="shotiq-display absolute inset-x-0 bottom-[8px] text-center text-[11px] leading-[11px] tracking-[0.05em] text-white">
                {(name ?? chrome.name).toUpperCase()}
              </span>
              {[["left-[8px] top-[26px]", "M0 10 V0 H10"], ["right-[8px] top-[26px]", "M10 10 V0 H0"],
                ["left-[8px] bottom-[24px]", "M0 0 V10 H10"], ["right-[8px] bottom-[24px]", "M10 0 V10 H0"]].map(([pos, d]) => (
                <svg key={pos} width="11" height="11" viewBox="0 0 10 10" aria-hidden="true"
                     className={`absolute ${pos}`}>
                  <path d={d} fill="none" stroke={ORANGE} strokeWidth="2" />
                </svg>
              ))}
            </span>
            <div className="min-w-0">
              <div className="text-[13.6px] leading-[16px]">Share your profile<br />and latest highlights.</div>
              <Link href="/results/demo/player" className="mt-[6px] flex items-center gap-[6px] text-[13px]"
                    style={{ color: ORANGE }} data-testid="phone-profile-card">
                View player card <Chev size={13} color={ORANGE} />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-[9px] rounded-[7px] bg-white px-[11px] pb-[10px] pt-[9px]" style={{ border: `1px solid ${RULE}` }}>
          <div className="flex items-baseline">
            <SectionHead cap={22}>ABOUT {(name ?? chrome.name).split(" ")[0].toUpperCase()}</SectionHead>
            <span className="ml-auto flex items-center gap-[5px] text-[12.4px]" style={{ color: BLUE }}>
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M6 1 L7.4 4.6 L11 6 L7.4 7.4 L6 11 L4.6 7.4 L1 6 L4.6 4.6 Z" fill={BLUE} />
                <path d="M12 9 L12.8 11.2 L15 12 L12.8 12.8 L12 15 L11.2 12.8 L9 12 L11.2 11.2 Z" fill={BLUE} />
              </svg>
              Enhance bio
            </span>
          </div>
          <div className="mt-[6px] text-[12.4px] leading-[14.6px]">{bio[0]}<br />{bio[1]}</div>
        </div>

        <div className="mt-[9px] rounded-[7px] bg-white px-[11px] pb-[10px] pt-[9px]" style={{ border: `1px solid ${RULE}` }}>
          <div className="flex items-baseline">
            <SectionHead cap={22}>PROFILE COMPLETION</SectionHead>
            <span className="shotiq-numeric ml-auto text-[22px] leading-[22px]" style={{ color: ORANGE }}>{completion}%</span>
          </div>
          <span className="mt-[7px] block h-[8px] overflow-hidden rounded-full" style={{ background: "#E2E3E4" }}>
            <span className="block h-full rounded-full" style={{ width: `${completion}%`, background: ORANGE }} />
          </span>
          <div className="mt-[7px] flex">
            {([["Profile info", true], ["Physical profile", true], ["Shooting profile", true], ["Bio", false]] as const).map(
              ([l, done]) => (
                <span key={l} className="flex min-w-0 flex-1 items-center gap-[4px] text-[10.6px] leading-[12px]">
                  <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden="true" className="shrink-0">
                    <circle cx="7.5" cy="7.5" r="6.4" fill="none" stroke={done ? GREEN : ORANGE} strokeWidth="1.3"
                            strokeDasharray={done ? undefined : "2.4 2.2"} />
                    {done && <path d="M4.4 7.7 L6.6 9.9 L10.6 5.6" fill="none" stroke={GREEN} strokeWidth="1.5"
                                   strokeLinecap="round" strokeLinejoin="round" />}
                  </svg>
                  <span className="truncate">{l}</span>
                </span>
              ))}
          </div>
        </div>

        <div className="mt-[9px] flex gap-[8px]">
          <div className="min-w-0 flex-1 rounded-[7px] bg-white px-[10px] pb-[9px] pt-[8px]" style={{ border: `1px solid ${RULE}` }}>
            <SectionHead cap={22}>ACCOUNT INFO</SectionHead>
            <div className="mt-[6px] flex items-start gap-[8px]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0"
                   stroke="currentColor" strokeWidth="1.5">
                <rect x="2.5" y="4.5" width="19" height="17" rx="2" />
                <path d="M2.5 9.5 H21.5 M7.5 2.5 V6.5 M16.5 2.5 V6.5" strokeLinecap="round" />
              </svg>
              <span className="min-w-0">
                <span className="block text-[10.8px] leading-[12px]" style={{ color: GRAPHITE }}>Member since</span>
                <span className="mt-[2px] block text-[12.4px] leading-[14px]">{memberSince}</span>
              </span>
            </div>
            <div className="mt-[7px] flex items-start gap-[8px] pt-[7px]" style={{ borderTop: `1px dashed ${RULE}` }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0"
                   stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="9.4" />
                <path d="M8 12 H16 M13 9 L16 12 L13 15" />
              </svg>
              <span className="min-w-0">
                <span className="block text-[10.8px] leading-[12px]" style={{ color: GRAPHITE }}>Last login</span>
                <span className="mt-[2px] block text-[12.4px] leading-[14px]">{lastLogin}</span>
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1 rounded-[7px] bg-white px-[10px] pb-[9px] pt-[8px]" style={{ border: `1px solid ${RULE}` }}>
            <SectionHead cap={22}>RECENT ACTIVITY</SectionHead>
            {activity.map(([title, when]) => (
              <Link key={title} href="/results/demo/history" className="mt-[6px] flex items-center gap-[7px]">
                <svg width="26" height="20" viewBox="0 0 26 20" fill="none" aria-hidden="true" className="shrink-0"
                     stroke="currentColor" strokeWidth="1.5">
                  <rect x="1" y="1" width="24" height="18" rx="2" />
                  <path d="M10.5 6 L16 10 L10.5 14 Z" fill="currentColor" stroke="none" />
                </svg>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11.6px] leading-[13px]">{title}</span>
                  <span className="mt-[2px] block truncate text-[9.8px] leading-[11px]" style={{ color: GRAPHITE }}>{when}</span>
                </span>
                <Chev size={13} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PhoneScreen>
  )
}
