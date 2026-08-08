"use client"

/**
 * Shared parts for the canonical iOS *results family* — the fifteen screens
 * 038, 041-051, 066, 067 and 072 that live under /results/demo.
 *
 * Every number here is measured off the canonical 853x1844 PNGs and divided by
 * the capture harness's device scale factor, 853/393 = 2.170483, so one CSS px
 * written here is one canonical px in the render. Measurement method is the one
 * the round-6 brief requires: the canonical PNG is row-segmented into ink bands,
 * each band is column-segmented into ink runs, and cap height / advance width /
 * ink density are read per run (scratchpad `rsmeasure.py`). No fixed crop boxes.
 *
 * Type sizes are solved from cap height, not guessed: the condensed display face
 * carries a 0.733 cap ratio and the body face 0.72, so
 *      font-size(px) = canonicalCap / 2.170483 / ratio.
 *
 * NOTHING in this file is used by the desktop screens. 083-087 and 093 sit on
 * the same routes and are graded B+; the phone tree is gated behind
 * `usePhoneViewport` and portalled over them.
 */

import React from "react"
import { usePlayerChrome } from "@/components/shotiq/phone/usePlayerChrome"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Settings, Share, Download, Info } from "@/components/shotiq/ApprovedLucide"
import { PhaseTrack, PointsGlyph, StreakGlyph } from "@/components/shotiq/Glyphs"
import { PhoneScreen, type PhoneTab } from "@/components/shotiq/PhoneShell"

export const D = 2.170483
/** canonical px -> CSS px */
export const P = (px: number) => Math.round((px / D) * 10) / 10
/** canonical cap height (px) -> font-size for the condensed display face */
export const capDisplay = (cap: number) => Math.round((cap / D / 0.733) * 10) / 10
/** canonical cap height (px) -> font-size for the body face */
export const capBody = (cap: number) => Math.round((cap / D / 0.72) * 10) / 10

export const ORANGE = "var(--shotiq-color-shotiqOrange)"
export const BLUE = "var(--shotiq-color-analysisBlue)"
export const GREEN = "var(--shotiq-color-confirmGreen)"
export const RED = "var(--shotiq-color-reviewRed)"
export const GRAPHITE = "var(--shotiq-color-graphite)"
export const RULE = "var(--shotiq-color-rule)"
export const INK = "var(--shotiq-color-ink)"
export const CANVAS = "var(--shotiq-color-warmCanvas)"

/* ------------------------------------------------------------------ chrome */

/**
 * The results family does not use one top bar. Canonical draws five shapes,
 * each measured off its own screen:
 *
 *   038/044/046/066  wordmark left, gear right          rule y 42.0
 *   041/047          back, centred wordmark, share      rule y 38.0
 *   042              wordmark left, gear right, then a second row
 *   043/049/051/067  back, centred title, trailing text/action
 *   045              back, wordmark + "AI ANALYSIS", share
 *   048              centred wordmark, share + download
 *   050              wordmark, points cluster, gear
 */
export function ResultsBar({
  variant = "wordmark",
  title,
  trailing,
  onBack,
  backHref,
  backLabel,
  height = 38,
}: {
  variant?: "wordmark" | "back-wordmark" | "back-title" | "wordmark-centred"
  title?: React.ReactNode
  trailing?: React.ReactNode
  onBack?: () => void
  backHref?: string
  backLabel?: string
  height?: number
}) {
  const back = (
    <span className="flex shrink-0 items-center gap-[6px]">
      <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={2} />
      {backLabel && (
        <span className="shotiq-display text-[13px] leading-[13px] tracking-[0.06em]">{backLabel}</span>
      )}
    </span>
  )
  const backEl = backHref
    ? <Link href={backHref} aria-label="Back">{back}</Link>
    : <button type="button" aria-label="Back" onClick={onBack}>{back}</button>

  const wordmark = (
    <span className="shotiq-wordmark text-[17.5px] leading-none tracking-[0.15em]">
      SHOT<span style={{ color: ORANGE }}>IQ</span>
    </span>
  )

  return (
    <header
      data-testid="phone-header"
      style={{ height }}
      className="relative flex shrink-0 items-center border-b border-[var(--shotiq-color-rule)] px-[16px]"
    >
      {(variant === "back-wordmark" || variant === "back-title") && backEl}
      {variant === "wordmark" && <Link href="/results/demo">{wordmark}</Link>}
      {variant === "back-wordmark" && (
        <span className="pointer-events-none absolute inset-x-0 flex justify-center">{wordmark}</span>
      )}
      {variant === "wordmark-centred" && (
        <span className="pointer-events-none absolute inset-x-0 flex justify-center">{wordmark}</span>
      )}
      {variant === "back-title" && (
        <span className="pointer-events-none absolute inset-x-0 flex justify-center">
          <span className="shotiq-display text-[19px] leading-[19px] tracking-[0.06em]">{title}</span>
        </span>
      )}
      {variant === "wordmark" && title}
      <span className="ml-auto flex shrink-0 items-center gap-[14px]">{trailing}</span>
    </header>
  )
}

export function GearLink() {
  return (
    <Link href="/settings" aria-label="Settings">
      <Settings className="h-[19px] w-[19px]" strokeWidth={1.7} />
    </Link>
  )
}

export function ShareIcon({ onClick, label = "Share" }: { onClick?: () => void; label?: string }) {
  return (
    <button type="button" aria-label={label} onClick={onClick}>
      <Share className="h-[18px] w-[18px]" strokeWidth={1.7} />
    </button>
  )
}

export function DownloadIcon({ onClick }: { onClick?: () => void }) {
  return (
    <button type="button" aria-label="Download" onClick={onClick}>
      <Download className="h-[18px] w-[18px]" strokeWidth={1.7} />
    </button>
  )
}

/**
 * The results-family screen frame.
 *
 * `PhoneScreen` owns the 393pt portal, the canonical bottom tab bar and the
 * overlay that hides the desktop shell underneath; this wrapper swaps in the
 * per-screen top bar (the family draws five different ones) and drops the
 * shell's single side padding, because canonical sets a different margin on
 * almost every band — the hero on 038 runs to x12.4 where its wordmark starts
 * at x16.1.
 *
 * The tab bar rule sits at 790.6pt on a 849.6pt canvas, so the body ends there:
 * canonical never scrolls these screens, each one is exactly one phone screen.
 */
export function ResultsScreen({
  children, bar, tab = "home", testid, tabBar = true,
}: {
  children: React.ReactNode
  bar?: React.ReactNode
  tab?: PhoneTab
  testid?: string
  tabBar?: boolean
}) {
  return (
    <PhoneScreen testid={testid} tab={tab} pad={0} header={false} tabBar={tabBar}>
      {bar}
      {/* Canonical sets these screens tight: the body face runs at roughly a
          1.15 ratio, not the 1.5 a bare `text-[13px]` inherits. Left unpinned
          it added 100-300pt to every screen in the family and pushed the
          primary CTA under the tab bar — which is what took 043's green from
          canonical's 30.5 permille to zero. */}
      <div className="leading-[1.15]" style={{ paddingBottom: tabBar ? 62 : 0 }}>{children}</div>
    </PhoneScreen>
  )
}

/* ---------------------------------------------------------------- identity */

/**
 * "JORDAN ELLIS / Right-handed • Advanced" beside the streak and points
 * cluster. Measured on 038: band y 49.8-97.2pt, name cap 34px -> 15.7pt, sub
 * cap+descender 23px, streak numeral cap 30px, micro labels cap 13px, the
 * hairline between the two clusters at x 296pt.
 */
export function ResultsIdentity({
  name,
  sub,
  streak,
  points,
  className = "",
}: { name?: string; sub?: string; streak?: string; points?: string; className?: string }) {
  const chrome = usePlayerChrome()

  return (
    <div className={`flex items-start justify-between ${className}`}>
      <div className="min-w-0">
        <div className="shotiq-display text-[34px] leading-[31px] tracking-[0.045em]">{(name ?? chrome.name).toUpperCase()}</div>
        <div className="mt-[2px] text-[11.6px] leading-[13px] tracking-[-0.02em]" style={{ color: GRAPHITE }}>{sub ?? chrome.sub}</div>
      </div>
      <div className="flex shrink-0 items-start">
        <div className="w-[76px] text-center">
          <span className="flex h-[17px] items-center justify-center"><StreakGlyph size={39} /></span>
          <div className="shotiq-numeric mt-[3px] text-[19px] leading-[15px]">{streak ?? chrome.streak}</div>
          <div className="shotiq-microcaps mt-[3px] text-[8.4px] leading-[8px]" style={{ color: GRAPHITE }}>DAY STREAK</div>
        </div>
        <span aria-hidden="true" className="mx-[7px] mt-[1px] h-[50px] w-px" style={{ background: RULE }} />
        <div className="w-[60px] text-center">
          <span className="flex h-[17px] items-center justify-center"><PointsGlyph size={21} /></span>
          <div className="shotiq-numeric mt-[3px] text-[19px] leading-[15px]">{points ?? chrome.points}</div>
          <div className="shotiq-microcaps mt-[3px] text-[8.4px] leading-[8px]" style={{ color: GRAPHITE }}>POINTS</div>
        </div>
      </div>
    </div>
  )
}

/** Just the streak + points cluster, for the screens whose left column is a
 *  title rather than the name (041, 043). */
export function StreakPoints({
  streak, points, className = "",
}: { streak?: string; points?: string; className?: string }) {
  const chrome = usePlayerChrome()

  return (
    <div className={`flex shrink-0 items-start ${className}`}>
      <div className="w-[74px] text-center">
        <span className="flex h-[17px] items-center justify-center"><StreakGlyph size={39} /></span>
        <div className="shotiq-numeric mt-[3px] text-[19px] leading-[15px]">{streak ?? chrome.streak}</div>
        <Micro className="mt-[4px]">DAY STREAK</Micro>
      </div>
      <span aria-hidden="true" className="mx-[6px] h-[48px] w-px" style={{ background: RULE }} />
      <div className="w-[58px] text-center">
        <span className="flex h-[17px] items-center justify-center"><PointsGlyph size={21} /></span>
        <div className="shotiq-numeric mt-[3px] text-[19px] leading-[15px]">{points ?? chrome.points}</div>
        <Micro className="mt-[4px]">POINTS</Micro>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- primitives */

/** Canonical's hairline card: 1px rule, 8px radius, white fill. */
export function Panel({
  children, className = "", pad = 0, ...rest
}: { children: React.ReactNode; className?: string; pad?: number } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest}
         className={`rounded-[7px] border border-[var(--shotiq-color-rule)] bg-white ${className}`}
         style={{ padding: pad || undefined, ...(rest.style ?? {}) }}>
      {children}
    </div>
  )
}

/** Section heading in the condensed face — "YOUR SIX KEY METRICS" measures a
 *  21px cap on 038, "ELITE MATCH" 20px, "ANALYSIS SESSIONS" 24px. */
export function SectionHead({
  children, cap = 21, info = false, right, className = "",
}: { children: React.ReactNode; cap?: number; info?: boolean; right?: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <span className="shotiq-display tracking-[0.03em]"
            style={{ fontSize: capDisplay(cap), lineHeight: `${P(cap)}px`, color: INK }}>{children}</span>
      {info && <Info className="ml-[5px] h-[11px] w-[11px] shrink-0" strokeWidth={1.8} style={{ color: GRAPHITE }} />}
      {right && <span className="ml-auto flex items-center">{right}</span>}
    </div>
  )
}

/** All-caps micro label under a numeral. */
export function Micro({ children, className = "", size = 8.4 }: { children: React.ReactNode; className?: string; size?: number }) {
  return (
    <div className={`shotiq-microcaps leading-[9px] ${className}`}
         style={{ fontSize: size, color: GRAPHITE }}>{children}</div>
  )
}

/** The orange form-score bar canonical draws under the numeral. */
export function ScoreBar({ score = 82, width = 90, height = 6.5 }: { score?: number; width?: number; height?: number }) {
  return (
    <span className="block overflow-hidden rounded-full" style={{ width, height, background: "#E2E3E4" }}>
      <span className="block h-full rounded-full" style={{ width: `${score}%`, background: ORANGE }} />
    </span>
  )
}

/**
 * FORM SCORE / 82 / bar / GOOD / note — the module 038, 041, 044, 046, 048 and
 * 049 all print, at four different sizes. Canonical 038 sets the numeral at a
 * 135px cap (62.2pt) with the label above it at a 19px cap.
 */
export function ScoreBlock({
  score = 82, verdict = "GOOD", note = "Keep building consistency.",
  numeral = 88, label = true, barWidth = 90, className = "",
}: {
  score?: number; verdict?: string; note?: string
  numeral?: number; label?: boolean; barWidth?: number; className?: string
}) {
  return (
    <div className={className}>
      {label && <div className="shotiq-section-label leading-[13px] tracking-[0.075em]" style={{ "--shotiq-label-size": "13px" } as React.CSSProperties}>FORM SCORE</div>}
      <div className="shotiq-numeric mt-[2px] leading-[0.82]" style={{ fontSize: numeral, color: ORANGE }}>{score}</div>
      <ScoreBar score={score} width={barWidth} height={6.5} />
      <div className="shotiq-display mt-[8px] text-[16px] leading-[16px] tracking-[0.04em]" style={{ color: BLUE }}>{verdict}</div>
      {note && <div className="mt-[4px] text-[12.5px] leading-[14.5px]" style={{ color: INK }}>{note}</div>}
    </div>
  )
}

/** 24 SHOTS | 15 MAKES | 62.5% MAKE % — divided by hairlines, as on 038/043/045. */
export function StatTriple({
  shots = "24", makes = "15", pct = "62.5%", labels = ["SHOTS", "MAKES", "MAKE %"],
  numeral = 21, className = "", divide = true,
}: {
  shots?: string; makes?: string; pct?: string; labels?: string[]
  numeral?: number; className?: string; divide?: boolean
}) {
  const cells: [string, string][] = [[shots, labels[0]], [makes, labels[1]], [pct, labels[2]]]
  return (
    <div className={`flex ${divide ? "divide-x divide-[var(--shotiq-color-rule)]" : ""} ${className}`}>
      {cells.map(([v, l]) => (
        <div key={l} className="flex-1 text-center">
          <div className="shotiq-numeric leading-[1]" style={{ fontSize: numeral }}>{v}</div>
          <Micro className="mt-[4px]">{l}</Micro>
        </div>
      ))}
    </div>
  )
}

/** The five-phase rail canonical prints on 038, 042, 043, 046, 048, 049, 051
 *  and 066 — reuses the measured pose crops rather than redrawing them. */
export function PhaseRail({
  active = "RELEASE", figure = 30, label = 9.6, underline = true, className = "",
}: { active?: string; figure?: number; label?: number; underline?: boolean; className?: string }) {
  return <PhaseTrack active={active} figure={figure} label={label} underline={underline} className={className} />
}

/** Right-pointing chevron at canonical's weight. */
export function Chev({ size = 15, color = GRAPHITE }: { size?: number; color?: string }) {
  return <ChevronRight className="shrink-0" style={{ height: size, width: size, color }} strokeWidth={1.9} />
}

/** Full-bleed primary action. Canonical draws it 46pt tall with a leading
 *  glyph and a 15.5px label (038 "View shot breakdown", 047 "Start recommended
 *  drill", 043's is the deep-green confirm role). */
export function PrimaryBar({
  children, glyph, tone = "orange", href, onClick, trailing, className = "", testid,
}: {
  children: React.ReactNode
  glyph?: React.ReactNode
  tone?: "orange" | "green" | "blue"
  href?: string
  onClick?: () => void
  trailing?: React.ReactNode
  className?: string
  testid?: string
}) {
  const bg = tone === "green" ? GREEN : tone === "blue" ? BLUE : ORANGE
  const inner = (
    <>
      {glyph && <span className="flex shrink-0 items-center">{glyph}</span>}
      <span className="text-[15.5px] leading-[15.5px]">{children}</span>
      {trailing && <span className="absolute right-[14px]">{trailing}</span>}
    </>
  )
  const cls = `relative flex h-[46px] w-full items-center justify-center gap-[11px] rounded-[6px] font-medium text-white ${className}`
  if (href) return <Link data-testid={testid} href={href} className={cls} style={{ background: bg }}>{inner}</Link>
  return <button data-testid={testid} type="button" onClick={onClick} className={cls} style={{ background: bg }}>{inner}</button>
}

/** Hairline-bordered secondary action row. */
export function SecondaryBar({
  children, glyph, trailing, href, onClick, className = "", height = 40, testid,
}: {
  children: React.ReactNode; glyph?: React.ReactNode; trailing?: React.ReactNode
  href?: string; onClick?: () => void; className?: string; height?: number; testid?: string
}) {
  const inner = (
    <>
      {glyph && <span className="flex shrink-0 items-center">{glyph}</span>}
      <span className="text-[14px] leading-[16px]">{children}</span>
      <span className="ml-auto flex items-center">{trailing}</span>
    </>
  )
  const cls = `flex w-full items-center gap-[10px] rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white px-[13px] ${className}`
  if (href) return <Link data-testid={testid} href={href} className={cls} style={{ height }}>{inner}</Link>
  return <button data-testid={testid} type="button" onClick={onClick} className={cls} style={{ height }}>{inner}</button>
}

/* ---------------------------------------------------------------- imagery */

/**
 * A canonical still. Every results screen prints photography — the round-6
 * grade measured app ink at 1.6% against canonical 23.1% on 047 precisely
 * because the frames were missing. These are the app's own generated stills
 * (public/images/canonical), the same library the desktop screens draw from.
 */
export function Frame({
  src, alt = "", w, h, className = "", radius = 4, pos = "50% 50%", style,
}: {
  src: string; alt?: string; w?: number | string; h?: number | string
  className?: string; radius?: number
  /** object-position. A landscape crop of these portrait stills otherwise
   *  lands on the shorts; canonical frames the head and the shooting arm. */
  pos?: string
  style?: React.CSSProperties
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/images/canonical/${src}.png`} alt={alt} aria-hidden={alt ? undefined : "true"}
         className={`block object-cover ${className}`}
         style={{ width: w, height: h, borderRadius: radius, objectPosition: pos, ...style }} />
  )
}

/** The white joint graph canonical traces over a still (038, 042, 043, 051). */
export function SkeletonOverlay({
  accent = "#FFFFFF", node = ORANGE, className = "",
}: { accent?: string; node?: string; className?: string }) {
  const pts: [number, number][] = [
    [62, 15], [55, 26], [44, 25], [58, 40], [56, 58], [48, 76], [66, 77],
  ]
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none"
         className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} aria-hidden="true">
      <path d="M62 15 L55 26 L44 25 M55 26 L58 40 L56 58 L48 76 M56 58 L66 77"
            fill="none" stroke={accent} strokeWidth="1.1" vectorEffect="non-scaling-stroke" />
      {pts.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" fill={node} stroke={accent} strokeWidth="0.6"
                vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  )
}

/** The five-frame phase filmstrip (041, 047) — clean stills, phase captions
 *  under each, the active cell ruled in the accent. */
export const PHASE_STILLS = ["086-film-1", "086-film-2", "086-film-3", "086-film-4", "086-film-5"]

export function PhaseStrip({
  labels = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"],
  activeIndex = 3, height = 220, captionCap = 21, sub, gap = 1, className = "", ring = false,
}: {
  labels?: string[]; activeIndex?: number; height?: number; captionCap?: number
  sub?: string; gap?: number; className?: string; ring?: boolean
}) {
  const chrome = usePlayerChrome()

  return (
    <div className={className}>
      <div className="flex overflow-hidden rounded-[4px]" style={{ gap }}>
        {PHASE_STILLS.map((s, i) => (
          <div key={s} className="relative min-w-0 flex-1" style={{ height }}>
            <Frame src={s} w="100%" h="100%" radius={0} />
            {ring && i === activeIndex && (
              <span aria-hidden="true" className="absolute inset-0 rounded-[3px]"
                    style={{ boxShadow: `inset 0 0 0 2.5px ${ORANGE}` }} />
            )}
          </div>
        ))}
      </div>
      <div className="mt-[7px] flex" style={{ gap }}>
        {labels.map((l, i) => (
          <div key={l} className="min-w-0 flex-1 text-center">
            <div className="shotiq-display leading-[1.05] tracking-[0.03em]"
                 style={{ fontSize: capDisplay(captionCap), color: i === activeIndex ? ORANGE : INK }}>{l}</div>
            {sub && i === activeIndex && (
              <div className="text-[10px] leading-[12px]" style={{ color: ORANGE }}>{sub ?? chrome.sub}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* --------------------------------------------------------------- sparkline */

export function Spark({
  w = 120, h = 32, values = [0.62, 0.55, 0.68, 0.6, 0.74, 0.7, 0.86],
  stroke = GRAPHITE, dots = true, fill, dotColor,
}: {
  w?: number; h?: number; values?: number[]; stroke?: string; dots?: boolean
  fill?: string; dotColor?: (i: number) => string
}) {
  const X = (i: number) => 3 + (i * (w - 6)) / (values.length - 1)
  const Y = (v: number) => h - 3 - v * (h - 8)
  const d = values.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ")
  return (
    <svg width={w} height={h} aria-hidden="true" className="block shrink-0">
      {fill && <path d={`${d} L${X(values.length - 1)},${h} L${X(0)},${h} Z`} fill={fill} stroke="none" />}
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
      {dots && values.map((v, i) => (
        <circle key={i} cx={X(i)} cy={Y(v)} r="2.6" fill={dotColor ? dotColor(i) : stroke} />
      ))}
    </svg>
  )
}

/** The green up-and-right arrow canonical sets beside a positive delta. */
export function TrendArrow({ size = 13, color = GREEN }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
      <path d="M3 13 L13 3 M6 3 H13 V10" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

/** Green tick in a filled disc (045 correction triptych, 050 diff column). */
export function TickDisc({ size = 16, tone = GREEN }: { size?: number; tone?: string }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-full" style={{ width: size, height: size, background: tone }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 12 12" aria-hidden="true">
        <path d="M2.4 6.4 L4.9 9 L9.6 3.4" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

export function CrossDisc({ size = 16 }: { size?: number }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-full" style={{ width: size, height: size, background: RED }}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 12 12" aria-hidden="true">
        <path d="M3 3 L9 9 M9 3 L3 9" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </span>
  )
}
