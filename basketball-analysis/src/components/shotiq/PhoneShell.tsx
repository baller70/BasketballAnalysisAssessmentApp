"use client"

/**
 * Canonical ShotIQ *phone* chrome — the 393pt surface the 72 iOS renders were
 * drawn for. Nothing here is shared with the desktop shell: the desktop screens
 * (077-096) keep `ShotIQShell` and its 1440x900 geometry untouched.
 *
 * Every number below is measured off the canonical 853x1844 PNGs and divided by
 * the device scale factor the capture harness derives, 853/393 = 2.170483, so
 * one CSS px here is one canonical px in the render.
 *
 *   header rule            y 82px      -> 37.8pt   => 38pt tall, 1px rule
 *   wordmark ink           y 25-58     -> cap 15.7pt, left edge x35 -> 16.1pt
 *   gear                   x 770-811   -> 19.4pt box, right edge 373.6 -> 19.4pt
 *   tab-bar rule           y 1716      -> 790.6pt  => 59pt tall over a 849.6pt
 *                                                     canvas
 *   tab icon ink           y 1733-1785 -> 798.4-822.4pt (7.8pt under the rule,
 *                                                        24pt tall)
 *   tab label ink          y 1798-1813 -> 828.4pt, cap 6.0pt => 8.5px of the
 *                                         body face (cap ratio 0.727)
 *   tab centres            39.9 / 118.9 / 195.8 / 271.6 / 352.9pt, i.e. five
 *                          equal 78.6pt columns
 *
 * Both bars are position:fixed because canonical 017 draws page content running
 * *under* the tab bar and clipped by it.
 */

import React from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { Settings } from "lucide-react"
import { ActionGlyph, StreakGlyph, PointsGlyph } from "@/components/shotiq/Glyphs"
import { usePlayerChrome } from "@/components/shotiq/phone/usePlayerChrome"

export const PHONE_W = 393

/* ------------------------------------------------------------------ glyphs */

/** Train tab: canonical draws a court plan — a wide box with a centre line and
 *  four position dots (measured 89x33px -> 41x15pt). */
export function TrainGlyph({ height = 15 }: { height?: number }) {
  const w = Math.round((height * 41) / 15)
  return (
    <svg width={w} height={height} viewBox="0 0 41 15" fill="none" aria-hidden="true"
         className="block max-w-none" stroke="currentColor" strokeWidth="1.3">
      <rect x="0.9" y="0.9" width="39.2" height="13.2" rx="1" />
      <path d="M20.5 0.9V14.1" />
      {[8, 15, 26, 33].map((x) => <circle key={x} cx={x} cy="7.5" r="2.1" />)}
    </svg>
  )
}

/** Progress tab: canonical draws a rising arc with a tick scale and two
 *  sparkles above it (measured 50x40px -> 23x18pt). */
export function ProgressGlyph({ height = 18 }: { height?: number }) {
  const w = Math.round((height * 23) / 18)
  return (
    <svg width={w} height={height} viewBox="0 0 23 18" fill="none" aria-hidden="true"
         className="block max-w-none" stroke="currentColor" strokeWidth="1.3"
         strokeLinecap="round">
      <path d="M1.4 16.4A10.6 10.6 0 0 1 21.6 16.4" />
      <path d="M1.4 10.6V16.4M11.5 5.8v3M21.6 10.6V16.4" />
      <path d="M14.6 2.2v3M13.1 3.7h3M19 0.9v2.2M17.9 2h2.2" />
    </svg>
  )
}

/** Profile tab: canonical draws the player's initials inside a hairline box. */
export function InitialsGlyph({ initials = "JE", height = 20 }: { initials?: string; height?: number }) {
  return (
    <span
      className="grid place-items-center rounded-[2px] border border-current"
      style={{ height, width: height * 1.05 }}
    >
      <span className="shotiq-display leading-none" style={{ fontSize: height * 0.62, letterSpacing: "0.02em" }}>
        {initials}
      </span>
    </span>
  )
}

/* ------------------------------------------------------------------- bars */

const TABS = [
  { key: "home", label: "Home", href: "/dashboard" },
  { key: "capture", label: "Capture", href: "/analyze" },
  { key: "train", label: "Train", href: "/results/demo/training" },
  { key: "progress", label: "Progress", href: "/results/demo/history" },
  { key: "profile", label: "Profile", href: "/profile" },
] as const

export type PhoneTab = (typeof TABS)[number]["key"]

export function PhoneTabBar({ active = "home", initials = "JE" }: { active?: PhoneTab; initials?: string }) {
  return (
    <nav
      aria-label="Primary"
      data-testid="phone-tabbar"
      className="fixed inset-x-0 bottom-0 z-20 mx-auto flex h-[61px] border-t border-[var(--shotiq-color-rule)] bg-[var(--shotiq-color-paper)]"
      style={{ maxWidth: PHONE_W }}
    >
      {TABS.map((t) => {
        const on = t.key === active
        const tint = on ? "var(--shotiq-color-shotiqOrange)" : "var(--shotiq-color-ink)"
        return (
          <Link key={t.key} href={t.href} aria-current={on ? "page" : undefined}
                className="flex flex-1 flex-col items-center pt-[8.8px]" style={{ color: tint }}>
            <span className="flex h-[24px] items-center">
              {t.key === "home" && <ActionGlyph kind="analyze" height={24} accent={tint} />}
              {t.key === "capture" && <ActionGlyph kind="nodeGraph" height={17} accent={tint} />}
              {t.key === "train" && <TrainGlyph height={15} />}
              {t.key === "progress" && <ProgressGlyph height={18} />}
              {t.key === "profile" && <InitialsGlyph initials={initials} height={20} />}
            </span>
            <span className="mt-[4.6px] text-[9px] leading-[9px]">{t.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function PhoneHeader({ back, height = 39 }: { back?: React.ReactNode; height?: number }) {
  return (
    <header
      data-testid="phone-header"
      style={{ height }}
      className="flex shrink-0 items-center border-b border-[var(--shotiq-color-rule)] pl-[16px] pr-[19px]"
    >
      {back}
      {/* Canonical sets SHOTIQ at a 15.7pt cap over an 80.7pt advance. The
          available Boxed Heavy cut carries the cap at 17.5px but is narrower
          than canonical's grotesque (the letterform gap globals.css documents),
          so the advance is closed with tracking rather than by inflating the
          cap. */}
      <Link href="/dashboard" className="shotiq-wordmark text-[17.5px] leading-none tracking-[0.15em]">
        SHOT<span className="text-[var(--shotiq-color-shotiqOrange)]">IQ</span>
      </Link>
      <Link href="/settings" aria-label="Settings" className="ml-auto">
        <Settings className="h-[19px] w-[19px]" strokeWidth={1.7} />
      </Link>
    </header>
  )
}

/**
 * Page frame. `pad` is the canonical side margin for the screen, which is not
 * constant across the set (039 measures 16.1pt, 017 measures 22.1pt).
 */
export function PhoneScreen({
  children, tab = "home", pad = 18, header = true, headerH = 39, testid,
  initials = "JE", tabBar = true,
}: {
  children: React.ReactNode
  tab?: PhoneTab
  pad?: number
  header?: boolean
  /** Canonical does not use one header height across the set: 039 rules at
   *  37.8pt, 017 at 39.2pt, 012 at 46.1pt. */
  headerH?: number
  testid?: string
  initials?: string
  tabBar?: boolean
}) {
  /* These screens are mounted into <body>, not into the page they belong to.
     Several of them live under a route whose layout wraps the page in
     ShotIQShell, whose phone body carries `.shotiq-phone-flow` — a reflow layer
     that wraps every flex row, caps every width at 100% and forces
     `img { height: auto }` so the DESKTOP layouts survive 393pt. Those rules are
     right for a reflowed desktop screen and wrong for a screen that was drawn at
     393pt in the first place: they would unpick the measured geometry here. A
     portal puts this subtree outside that scope, and the fixed overlay covers
     the shell's own phone chrome so only one top bar and one tab bar are ever
     visible. */
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => { setMounted(true) }, [])

  const screen = (
    <div
      data-testid={testid}
      className="shotiq-canonical fixed inset-0 z-[60] mx-auto flex w-full flex-col overflow-y-auto overflow-x-hidden bg-[var(--shotiq-color-paper)] text-[var(--shotiq-color-ink)]"
      style={{ maxWidth: PHONE_W }}
    >
      {header && <PhoneHeader height={headerH} />}
      <div className="min-h-0 flex-1" style={{ paddingLeft: pad, paddingRight: pad }}>
        {children}
      </div>
      {tabBar && <PhoneTabBar active={tab} initials={initials} />}
    </div>
  )
  if (!mounted) return null
  return createPortal(screen, document.body)
}

/* -------------------------------------------------------------- identity */

/**
 * The name / handedness / streak / points block that opens every "home family"
 * canonical (017, 018, 021, 026, 036, 037, 039, 040).
 *
 * Measured on 039: JORDAN cap 24.9pt (display face -> 35.3px), the sub-line
 * cap+descender 11.1pt (body face -> 11.4px), the streak numeral cap 14.3pt and
 * its label cap 6.5pt, streak cluster x 236.8-282.0pt and points x 325.3-359.4pt
 * with a hairline between them.
 */
export function PhoneIdentity({
  name, sub, streak, points, className = "",
}: { name?: string; sub?: string; streak?: string; points?: string; className?: string }) {
  // Same resolution as PhoneNameRow — the player's own record, canonical
  // persona as the empty state, an explicit prop always wins.
  const chrome = usePlayerChrome()
  const shown = {
    name: name ?? chrome.name, sub: sub ?? chrome.sub,
    streak: streak ?? chrome.streak, points: points ?? chrome.points,
  }
  return (
    <div className={`flex items-start justify-between ${className}`}>
      <div className="min-w-0">
        <div className="shotiq-display text-[34.4px] leading-[34px] tracking-[0.05em]">{shown.name.toUpperCase()}</div>
        {/* Cap matches at 11.06; the body face is wider per cap than canonical's,
            so the 117.5pt advance is closed with tracking, not by shrinking the
            cap. */}
        <div className="mt-[0.5px] text-[11.4px] leading-[13px] tracking-[-0.04em] text-[var(--shotiq-color-graphite)]">{shown.sub}</div>
      </div>
      {/* Canonical centres BOTH marks in one 21.7pt row (streak ink 50.2-64.5,
          points ink 46.5-67.7, common centre 57.1), then sets the numeral ink at
          73.7 and the label ink at 93.5. */}
      <div className="-mt-[3px] flex shrink-0 items-start">
        <div className="w-[86px] text-center">
          <span className="flex h-[21px] items-center justify-center"><StreakGlyph size={40} /></span>
          <div className="shotiq-numeric mt-[4px] text-[19.5px] leading-[15px]">{shown.streak}</div>
          <div className="shotiq-microcaps mt-[4px] text-[8.6px] leading-[7px] text-[var(--shotiq-color-graphite)]">DAY STREAK</div>
        </div>
        <span aria-hidden="true" className="mx-[6px] mt-[2px] h-[52px] w-px bg-[var(--shotiq-color-rule)]" />
        <div className="w-[62px] text-center">
          <span className="flex h-[21px] items-center justify-center"><PointsGlyph size={22} /></span>
          <div className="shotiq-numeric mt-[4px] text-[19.5px] leading-[15px]">{shown.points}</div>
          <div className="shotiq-microcaps mt-[4px] text-[8.6px] leading-[7px] text-[var(--shotiq-color-graphite)]">POINTS</div>
        </div>
      </div>
    </div>
  )
}

/** Section heading in the condensed display face, as canonical draws the
 *  phone-scale headings ("START HERE", "ANALYSIS HISTORY", "VIDEO DETAILS"). */
export function PhoneHeading({
  children, size = 19, className = "", ...rest
}: { size?: number } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest} className={`shotiq-display ${className}`}
         style={{ fontSize: size, lineHeight: `${size}px`, ...(rest.style ?? {}) }}>
      {children}
    </div>
  )
}

/** Full-bleed primary action, canonical's 45.6pt orange bar. */
export function PhonePrimary({
  children, onClick, href, tone = "orange", className = "", ...rest
}: {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  tone?: "orange" | "blue" | "green"
  className?: string
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "className">) {
  const bg = tone === "blue" ? "var(--shotiq-color-analysisBlue)"
    : tone === "green" ? "var(--shotiq-color-confirmGreen)"
    : "var(--shotiq-color-shotiqOrange)"
  const cls = `flex h-[46px] w-full items-center justify-center gap-[14px] rounded-[6px] text-[15px] font-medium text-white ${className}`
  if (href) return <Link href={href} className={cls} style={{ background: bg }}>{children}</Link>
  return <button type="button" onClick={onClick} {...rest} className={cls} style={{ background: bg }}>{children}</button>
}

/** Hairline-bordered secondary action. */
export function PhoneSecondary({
  children, onClick, href, className = "", ...rest
}: {
  children: React.ReactNode; onClick?: () => void; href?: string; className?: string
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "className">) {
  const cls = `flex h-[44px] w-full items-center justify-center gap-[10px] rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white text-[14px] ${className}`
  if (href) return <Link href={href} className={cls}>{children}</Link>
  return <button type="button" onClick={onClick} {...rest} className={cls}>{children}</button>
}

/**
 * The four-cell session strip canonical closes several phone screens with
 * (24 SHOTS / 15 MAKES / 62.5% MAKE % / trend).
 */
export function PhoneSessionStrip({
  shots = "24", makes = "15", pct = "62.5%", delta = "+8.1%", label = "vs last session",
  className = "",
}: {
  shots?: string; makes?: string; pct?: string; delta?: string; label?: string; className?: string
}) {
  return (
    <div className={`flex items-center divide-x divide-[var(--shotiq-color-rule)] ${className}`}>
      {[[shots, "SHOTS"], [makes, "MAKES"], [pct, "MAKE %"]].map(([v, l]) => (
        <div key={l} className="flex-1 pr-[10px] first:pl-0 [&:not(:first-child)]:pl-[12px]">
          <div className="shotiq-numeric text-[21px] leading-[23px]">{v}</div>
          <div className="shotiq-microcaps mt-[3px] leading-[10px] text-[var(--shotiq-color-graphite)]" style={{ "--shotiq-microcaps-size": "9px" } as React.CSSProperties}>{l}</div>
        </div>
      ))}
      <div className="flex-[1.3] pl-[12px]">
        <div className="flex items-start gap-[3px]">
          <MiniTrend />
          <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true" className="mt-[1px]">
            <path d="M3 13 L13 3 M6 3 H13 V10" fill="none" stroke="var(--shotiq-color-confirmGreen)" strokeWidth="1.6" />
          </svg>
        </div>
        <div className="mt-[2px] text-[9px] leading-[10px]">
          <span className="text-[var(--shotiq-color-confirmGreen)]">{delta}</span>{" "}
          <span className="text-[var(--shotiq-color-graphite)]">{label}</span>
        </div>
      </div>
    </div>
  )
}

/** The five-point make/miss spark canonical draws beside the session strip:
 *  grey nodes for misses, green for makes, no fill under the line. */
export function MiniTrend({ width = 72, height = 22 }: { width?: number; height?: number }) {
  const pts: [number, number, boolean][] = [
    [0, 0.75, false], [0.25, 0.25, true], [0.5, 0.6, false], [0.75, 0.55, false], [1, 0.1, true],
  ]
  const X = (t: number) => 4 + t * (width - 8)
  const Y = (v: number) => 4 + v * (height - 8)
  return (
    <svg width={width} height={height} aria-hidden="true" className="block">
      <polyline fill="none" stroke="var(--shotiq-color-graphite)" strokeWidth="1.2"
                points={pts.map(([t, v]) => `${X(t)},${Y(v)}`).join(" ")} />
      {pts.map(([t, v, made]) => (
        <circle key={t} cx={X(t)} cy={Y(v)} r="3"
                fill={made ? "var(--shotiq-color-confirmGreen)" : "var(--shotiq-color-graphite)"} />
      ))}
    </svg>
  )
}

/** "PRIMARY COACHING TARGET" row with the chevron, as canonical closes the
 *  home-family screens. */
export function PhoneCoachingTarget({
  label = "PRIMARY COACHING TARGET",
  text = "Keep elbow stacked through release",
  className = "",
}: { label?: string; text?: string; className?: string }) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="min-w-0">
        <div className="shotiq-section-label leading-[12px] tracking-[0.08em] text-[var(--shotiq-color-graphite)]" style={{ "--shotiq-label-size": "11px" } as React.CSSProperties}>
          {label}
        </div>
        <div className="mt-[6px] truncate text-[16px] leading-[19px]">{text}</div>
      </div>
      <svg width="10" height="17" viewBox="0 0 10 17" aria-hidden="true" className="shrink-0">
        <path d="M1.5 1.5 L8 8.5 L1.5 15.5" fill="none" stroke="var(--shotiq-color-graphite)" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
