"use client"

/**
 * Shared phone-native parts for the onboarding / upload / training families.
 *
 * These are the pieces that repeat across canonical 008-013, 022-024, 054-065
 * and 068-069 and that `PhoneShell` does not already own. Nothing here touches
 * the phone chrome itself (`PhoneShell.tsx`): the header row below is used only
 * by the screens whose canonical header is NOT the default wordmark + gear
 * (008 carries "Skip", 023 a back arrow and a stacked lockup, 069 a title and
 * an overflow button), and every screen that does draw the default header keeps
 * `PhoneScreen`'s own.
 *
 * Measured off the 853x1844 canonical PNGs at 2.170483 px per pt:
 *
 *   header rule            y 82px   -> 37.8pt
 *   wordmark cap           y 23-53  -> cap 13.8pt
 *   section rule           1px, var(--shotiq-color-rule)
 *   identity name cap      y 258-343 on 009 -> cap 39.2pt (display face, 0.705
 *                          cap ratio -> 55.6px)
 */

import React from "react"
import { usePlayerChrome } from "@/components/shotiq/phone/usePlayerChrome"
import Link from "next/link"
import { Settings } from "@/components/shotiq/ApprovedLucide"
import { StreakGlyph, PointsGlyph, PoseFigure } from "@/components/shotiq/Glyphs"

/**
 * Is this the phone surface?
 *
 * `PhoneScreen` portals into `document.body`, so a `md:hidden` wrapper cannot
 * hide it — at 1440 a phone screen would paint over the desktop page and
 * swallow every click on it. Every route that swaps in a phone design gates on
 * the viewport itself, tracked live so a resize does the right thing.
 */
export function usePhoneViewport() {
  const [isPhone, setIsPhone] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const sync = () => setIsPhone(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])
  return isPhone
}

/**
 * A phone-only sub-surface selector that is BOTH a real user path and a
 * deterministic one: the flow writes its position into `?step=` with
 * `history.replaceState`, so every canonical screen has a URL, and reading it
 * back seeds the flow. `window.location` rather than `useSearchParams`, which
 * would force these prerendered routes dynamic.
 */
export function usePhoneStep<T extends string>(steps: readonly T[], initial: T): [T, (s: T) => void] {
  const [step, setStep] = React.useState<T>(initial)
  React.useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("step")
    if (q && (steps as readonly string[]).includes(q)) setStep(q as T)
    // `steps` is a module-level literal at every call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const go = React.useCallback((s: T) => {
    setStep(s)
    const u = new URL(window.location.href)
    u.searchParams.set("step", s)
    window.history.replaceState(null, "", u.toString())
  }, [])
  return [step, go]
}

export const RULE = "var(--shotiq-color-rule)"
export const ORANGE = "var(--shotiq-color-shotiqOrange)"
export const GREEN = "var(--shotiq-color-confirmGreen)"
export const BLUE = "var(--shotiq-color-analysisBlue)"
export const GRAPHITE = "var(--shotiq-color-graphite)"

/** Header row for the screens whose canonical header is not the default one.
 *  `height` is the measured rule position for that screen. */
export function PhoneTop({
  left, center, right, height = 38, className = "",
}: {
  left?: React.ReactNode
  center?: React.ReactNode
  right?: React.ReactNode
  height?: number
  className?: string
}) {
  return (
    <header data-testid="phone-header" style={{ height }}
            className={`relative flex shrink-0 items-center border-b px-[16px] ${className}`}
            /* eslint-disable-next-line react/forbid-dom-props */
            >
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px" style={{ background: RULE }} />
      <div className="flex min-w-0 items-center gap-[10px]">{left}</div>
      {center && (
        <div className="pointer-events-none absolute inset-x-0 flex justify-center">{center}</div>
      )}
      <div className="ml-auto flex items-center gap-[14px]">{right}</div>
    </header>
  )
}

/** The wordmark exactly as `PhoneShell`'s header sets it, for the screens that
 *  need it inside a custom header row. */
export function Wordmark({ size = 17.5 }: { size?: number }) {
  return (
    <Link href="/dashboard" className="shotiq-wordmark leading-none tracking-[0.15em]"
          style={{ fontSize: size }}>
      SHOT<span style={{ color: ORANGE }}>IQ</span>
    </Link>
  )
}

export function GearLink() {
  return (
    <Link href="/settings" aria-label="Settings">
      <Settings className="h-[19px] w-[19px]" strokeWidth={1.7} />
    </Link>
  )
}

export function BackChevron({ onClick, href, label = "Back" }: { onClick?: () => void; href?: string; label?: string }) {
  const mark = (
    <svg width="17" height="15" viewBox="0 0 17 15" aria-hidden="true">
      <path d="M7.5 1.5 L1.5 7.5 L7.5 13.5 M1.5 7.5 H16" fill="none" stroke="currentColor"
            strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  if (href) return <Link href={href} aria-label={label}>{mark}</Link>
  return <button type="button" onClick={onClick} aria-label={label}>{mark}</button>
}

/* ------------------------------------------------------------- identity */

/**
 * The name + stat cluster canonical opens 010, 011, 024, 054, 055, 056, 059,
 * 061, 063 and 068 with. Measured on 024: name cap 30px (13.8pt) at y 128-160,
 * the four-cell stat strip on a 96px column pitch with 1px dividers, and the
 * streak / points pair right-aligned in the same row as the name.
 */
export function PhoneNameRow({
  name, sub, streak, points, extra, className = "",
}: {
  name?: string; sub?: string; streak?: string; points?: string
  extra?: React.ReactNode; className?: string
}) {
  /* Resolved from the player's own record, with the canonical persona as the
     empty state — see usePlayerChrome. A call site that passes a value still
     wins. This one cluster is the header of ten canonical screens, which is
     why it is the right place to fix all ten. */
  const live = usePlayerChrome()
  const shown = {
    name: name ?? live.name,
    sub: sub ?? live.sub,
    streak: streak ?? live.streak,
    points: points ?? live.points,
  }
  return (
    <div className={`flex items-start justify-between gap-[10px] ${className}`}>
      <div className="min-w-0">
        <div className="shotiq-display text-[30px] leading-[31px] tracking-[0.02em]">{shown.name.toUpperCase()}</div>
        <div className="mt-[2px] text-[10.5px] leading-[13px]" style={{ color: GRAPHITE }}>{shown.sub}</div>
      </div>
      <div className="flex shrink-0 items-start">
        {extra}
        <MiniStat glyph={<StreakGlyph size={38} />} value={shown.streak} label="DAY STREAK" />
        <MiniStat glyph={<PointsGlyph size={21} />} value={shown.points} label="POINTS" />
      </div>
    </div>
  )
}

export function MiniStat({ glyph, value, label, w = 64 }: {
  glyph: React.ReactNode; value: string; label: string; w?: number
}) {
  return (
    <div className="text-center" style={{ width: w }}>
      <span className="flex h-[19px] items-center justify-center">{glyph}</span>
      <div className="shotiq-numeric mt-[3px] text-[16px] leading-[16px]">{value}</div>
      <div className="shotiq-microcaps mt-[2px]" style={{ fontSize: 7.5, lineHeight: "8px", color: GRAPHITE }}>{label}</div>
    </div>
  )
}

/** A hairline-divided row of value/label cells — canonical's stat strips. */
export function StatCells({
  cells, className = "", valueSize = 20, labelSize = 8,
}: {
  cells: { v: React.ReactNode; l: string; tone?: string }[]
  className?: string; valueSize?: number; labelSize?: number
}) {
  return (
    <div className={`flex ${className}`}>
      {cells.map((c, i) => (
        <div key={c.l} className="min-w-0 flex-1 px-[8px] first:pl-0"
             style={i ? { borderLeft: `1px solid ${RULE}` } : undefined}>
          <div className="shotiq-numeric leading-none" style={{ fontSize: valueSize, color: c.tone }}>{c.v}</div>
          <div className="shotiq-microcaps mt-[5px] leading-none" style={{ fontSize: labelSize, color: GRAPHITE }}>{c.l}</div>
        </div>
      ))}
    </div>
  )
}

/**
 * A canonical photo crop, zoomed past its own chrome.
 *
 * The library crops cut for the DESKTOP screens carry the overlay the desktop
 * card drew on them — a duration badge, a bookmark, a status pip in the
 * corners. Canonical's phone screens show the photograph alone, so the crop is
 * scaled about its centre until those corners fall outside the box. `zoom` is
 * per call site because the badge inset differs between the 090 (drill) and 094
 * (media) families.
 */
export function Shot({
  src, className = "", zoom = 1.34, position = "50% 45%", style, alt = "",
}: {
  src: string; className?: string; zoom?: number; position?: string
  style?: React.CSSProperties; alt?: string
}) {
  return (
    <span className={`block overflow-hidden ${className}`} style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} aria-hidden={alt ? undefined : "true"}
           className="block h-full w-full max-w-none object-cover"
           style={{ transform: `scale(${zoom})`, objectPosition: position }} />
    </span>
  )
}

/** Section eyebrow — canonical sets these at a 9px cap in graphite. */
export function Eyebrow({ children, className = "", tone = GRAPHITE }: {
  children: React.ReactNode; className?: string; tone?: string
}) {
  return (
    <div className={`shotiq-section-label tracking-[0.09em] ${className}`}
 style={{ fontSize: 10, lineHeight: "11px", color: tone }}>{children}</div>
  )
}

/** Hairline-bounded card, the one container canonical uses on these screens. */
export function PhoneCard({ children, className = "", ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest} className={`rounded-[6px] bg-white ${className}`}
         style={{ border: `1px solid ${RULE}`, ...(rest.style ?? {}) }}>
      {children}
    </div>
  )
}

/** The five-phase rail canonical closes most training screens with. */
export function PhaseRail({ active = "RELEASE", figure = 26, label = 8, className = "" }: {
  active?: string; figure?: number; label?: number; className?: string
}) {
  const phases: [string, "setup" | "load" | "rise" | "release" | "follow"][] = [
    ["SETUP", "setup"], ["LOAD", "load"], ["RISE", "rise"],
    ["RELEASE", "release"], ["FOLLOW-THROUGH", "follow"],
  ]
  return (
    <div className={`flex items-end ${className}`}>
      {phases.map(([l, k], i) => {
        const on = l === active.toUpperCase()
        return (
          <div key={l} className="relative flex min-w-0 flex-1 flex-col items-center">
            {i > 0 && (
              <span aria-hidden="true" className="absolute left-[-50%] top-[60%] h-px w-full"
                    style={{ background: RULE }} />
            )}
            <PoseFigure phase={k} height={figure} active={on} className="relative" />
            <span className="shotiq-display relative mt-[5px] text-center leading-none"
                  style={{ fontSize: label, color: on ? ORANGE : undefined }}>{l}</span>
          </div>
        )
      })}
    </div>
  )
}

/** Progress meter — n equal segments, the first `done` of them orange. */
export function StepMeter({ step, steps, w = 245, className = "" }: {
  step: number; steps: number; w?: number; className?: string
}) {
  return (
    <span className={`flex gap-[7px] ${className}`} style={{ width: w }}>
      {Array.from({ length: steps }).map((_, i) => (
        <span key={i} className="h-[4px] flex-1 rounded-full"
              style={{ background: i < step ? ORANGE : RULE }} />
      ))}
    </span>
  )
}

/** Full-bleed action bar. Canonical draws these at 46pt with a 6px radius. */
export function PhoneAction({
  children, tone = "orange", onClick, href, height = 46, className = "", testid,
}: {
  children: React.ReactNode
  tone?: "orange" | "green" | "blue" | "outline" | "ghost"
  onClick?: () => void; href?: string; height?: number; className?: string; testid?: string
}) {
  const filled = tone !== "outline" && tone !== "ghost"
  const bg = tone === "green" ? GREEN : tone === "blue" ? BLUE : tone === "orange" ? ORANGE : "#FFFFFF"
  const style: React.CSSProperties = filled
    ? { background: bg, color: "#FFFFFF" }
    : { background: "#FFFFFF", border: tone === "outline" ? `1px solid ${RULE}` : "none" }
  const cls = `flex w-full items-center justify-center gap-[10px] rounded-[6px] text-[14.5px] font-medium ${className}`
  if (href) return <Link href={href} data-testid={testid} className={cls} style={{ height, ...style }}>{children}</Link>
  return (
    <button type="button" data-testid={testid} onClick={onClick} className={cls} style={{ height, ...style }}>
      {children}
    </button>
  )
}
