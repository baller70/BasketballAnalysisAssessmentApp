"use client"

/**
 * Shared parts of the phone live-capture flow (canonical iOS 014, 028-035).
 *
 * Every number here is measured off the canonical 853x1844 renders and divided
 * by the capture harness's device scale factor, 853/393 = 2.170483, so one CSS
 * px below is one canonical px in the render. Bands were found by row-segmenting
 * each canonical into ink runs and column-segmenting each band (see
 * scratchpad lc/measure.py, lc/zoom.py, lc/rules.py) — never by a fixed crop box.
 */

import React from "react"
import { PoseFigure, StreakGlyph, PointsGlyph } from "@/components/shotiq/Glyphs"

export const ORANGE = "var(--shotiq-color-shotiqOrange)"
export const GREEN = "var(--shotiq-color-confirmGreen)"
export const BLUE = "var(--shotiq-color-analysisBlue)"
export const GRAPHITE = "var(--shotiq-color-graphite)"
export const RULE = "var(--shotiq-color-rule)"
export const INK = "var(--shotiq-color-ink)"
export const MUTED = "var(--shotiq-color-muted)"

/** Only render the phone surface below the tablet breakpoint.
 *
 *  `PhoneScreen` portals its subtree into <body>, which escapes any
 *  `md:hidden` wrapper the route puts around it — so the guard has to be in
 *  JS or the fixed overlay would cover the desktop screen this route also
 *  serves (canonical 082, graded separately and not to be regressed). */
export function usePhoneViewport() {
  const [phone, setPhone] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 767.98px)")
    const sync = () => setPhone(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])
  return phone
}

/* --------------------------------------------------------------- identity */

/**
 * The name / handedness / streak / points row that opens 028-034.
 *
 * Measured caps (CSS px): 028 22.1, 030 24.0, 031 24.0, 032 28.6, 033 24.9,
 * 034 25.3 — the display ramp is NOT constant across the family, so the size is
 * a prop rather than baked in. The condensed face carries a 0.705 cap ratio, so
 * `cap` is converted to a font size on the way in.
 */
export function CaptureIdentity({
  cap = 24, name = "Jordan Ellis", sub = "Right-handed • Advanced",
  streak = "6", points = "2,840", className = "",
}: {
  cap?: number; name?: string; sub?: string; streak?: string; points?: string
  className?: string
}) {
  return (
    <div className={`flex items-start justify-between ${className}`}>
      <div className="min-w-0">
        <div className="shotiq-display" style={{ fontSize: cap / 0.705, lineHeight: `${cap * 1.12}px`, letterSpacing: "0.04em" }}>
          {name.toUpperCase()}
        </div>
        <div className="mt-[7px] text-[11px] leading-[12px] tracking-[-0.02em]" style={{ color: GRAPHITE }}>
          {sub}
        </div>
      </div>
      {/* Canonical centres both marks on one row (028: glyph ink y49.3-68.6,
          numeral y74.2-89.4, label y92.1-98.6) with a hairline between. */}
      <div className="flex shrink-0 items-start">
        <div className="w-[62px] text-center">
          <span className="flex h-[20px] items-center justify-center"><StreakGlyph size={36} /></span>
          <div className="shotiq-numeric mt-[5px] text-[19px] leading-[14px]">{streak}</div>
          <div className="shotiq-microcaps mt-[5px] text-[8.6px] leading-[7px]" style={{ color: GRAPHITE }}>DAY STREAK</div>
        </div>
        <span aria-hidden="true" className="mx-[9px] mt-[1px] h-[52px] w-px" style={{ background: RULE }} />
        <div className="w-[54px] text-center">
          <span className="flex h-[20px] items-center justify-center"><PointsGlyph size={20} /></span>
          <div className="shotiq-numeric mt-[5px] text-[19px] leading-[14px]">{points}</div>
          <div className="shotiq-microcaps mt-[5px] text-[8.6px] leading-[7px]" style={{ color: GRAPHITE }}>POINTS</div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ phase strip */

export const PHASES = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"] as const
const KEYS = ["setup", "load", "rise", "release", "follow"] as const

/**
 * The five-pose track. Canonical draws it four ways across this family:
 * grey on paper with the active pose orange (028/029/030/033/034), white on the
 * live frame (032), and with blue corner brackets around the active pose (031).
 */
export function PhaseStrip({
  active = "RELEASE", figure = 28, label = 9, tone = "light", accent = ORANGE,
  brackets = false, underline = true, className = "",
}: {
  active?: string; figure?: number; label?: number
  tone?: "light" | "dark"; accent?: string
  brackets?: boolean; underline?: boolean; className?: string
}) {
  const idx = PHASES.indexOf(active as (typeof PHASES)[number])
  const dim = tone === "dark" ? "#FFFFFF" : GRAPHITE
  return (
    <div className={`flex items-start ${className}`}>
      {PHASES.map((p, i) => (
        <React.Fragment key={p}>
          {i > 0 && (
            <span aria-hidden="true" className="mt-[14px] h-px min-w-[10px] flex-1"
                  style={{ background: tone === "dark" ? "rgba(255,255,255,.55)" : RULE }} />
          )}
          <span className="relative shrink-0 px-[3px] text-center">
            {brackets && i === idx && (
              <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-[3px]"
                    style={{ height: figure + 6 }}>
                <svg width="100%" height="100%" viewBox="0 0 40 40" preserveAspectRatio="none" fill="none"
                     stroke={accent} strokeWidth="2.4">
                  <path d="M1 11V1h10M29 1h10v10M39 29v10H29M11 39H1V29" />
                </svg>
              </span>
            )}
            <PoseFigure phase={KEYS[i]} active={i === idx && accent === ORANGE}
                        tone={tone === "dark" ? "dark" : "light"} height={figure} className="mx-auto" />
            <span className="shotiq-display mt-[4px] block whitespace-nowrap leading-[1.05]"
                  style={{ fontSize: label, letterSpacing: "0.05em", color: i === idx ? accent : dim }}>
              {p}
            </span>
            {underline && i === idx && (
              <span aria-hidden="true" className="mx-auto mt-[3px] block h-[2px] w-full" style={{ background: accent }} />
            )}
          </span>
        </React.Fragment>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------ camera frame */

/**
 * The capture surface. It shows the live stream when one is running and the
 * canonical framing still otherwise — the still is the same gym frame the
 * design was drawn on, cut out of the canonical render (see
 * public/images/canonical/ios-0*-frame.jpg). Chrome that carries live values is
 * drawn as DOM children on top.
 */
export function CameraFrame({
  src, width, height, stream, radius = 8, className = "", children, onStart, label,
}: {
  src: string; width: number; height: number
  stream?: MediaStream | null
  radius?: number; className?: string; children?: React.ReactNode
  onStart?: () => void; label?: string
}) {
  const ref = React.useRef<HTMLVideoElement>(null)
  React.useEffect(() => {
    if (ref.current) ref.current.srcObject = stream ?? null
  }, [stream])
  return (
    <div className={`relative overflow-hidden ${className}`}
         style={{ width, height, borderRadius: radius, background: "#101113" }}>
      {stream
        ? <video ref={ref} autoPlay playsInline muted className="h-full w-full object-cover" />
        : (
          <button type="button" onClick={onStart} aria-label={label ?? "Start the camera"}
                  className="block h-full w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" width={width} height={height}
                 className="block h-full w-full object-cover" />
          </button>
        )}
      {children}
    </div>
  )
}

/* ------------------------------------------------------------ small parts */

export function CheckDot({ size = 15, tone = GREEN }: { size?: number; tone?: string }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-full"
          style={{ width: size, height: size, background: tone }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 12 12" aria-hidden="true">
        <path d="M2.4 6.3 L4.8 8.9 L9.6 3.3" fill="none" stroke="#fff" strokeWidth="2.1"
              strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

export function Chevron({ h = 14, tone = GRAPHITE }: { h?: number; tone?: string }) {
  return (
    <svg width={h * 0.6} height={h} viewBox="0 0 9 15" aria-hidden="true" className="shrink-0">
      <path d="M1.4 1.3 L7.2 7.5 L1.4 13.7" fill="none" stroke={tone} strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Canonical's bracketed framing mark, drawn round whatever it wraps. */
export function Bracketed({
  size = 46, stroke = INK, children,
}: { size?: number; stroke?: string; children?: React.ReactNode }) {
  return (
    <span className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true"
           className="absolute inset-0" stroke={stroke} strokeWidth="1.5" strokeLinecap="round">
        <path d="M1 12V1h11M28 1h11v11M39 28v11H28M12 39H1V28" />
      </svg>
      {children}
    </span>
  )
}

/** Section heading in the condensed display face at a measured cap height. */
export function Head({
  cap, children, className = "", tone = INK, ...rest
}: { cap: number; tone?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest} className={`shotiq-display ${className}`}
         style={{ fontSize: cap / 0.705, lineHeight: `${cap * 1.06}px`, letterSpacing: "0.02em", color: tone, ...(rest.style ?? {}) }}>
      {children}
    </div>
  )
}

/* --------------------------------------------------------------- glyphs */

const S = (p: React.SVGProps<SVGSVGElement> & { box: number }) => {
  const { box, ...rest } = p
  return <svg viewBox={`0 0 ${box} ${box}`} fill="none" stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="block shrink-0" {...rest} />
}

export function StopwatchGlyph({ size = 22 }: { size?: number }) {
  return (
    <S box={24} width={size} height={size}>
      <circle cx="12" cy="13.5" r="8" />
      <path d="M12 9.5v4l2.6 1.8M9.4 2.6h5.2M12 2.6v2.9M18.6 6.4l1.6-1.6" />
    </S>
  )
}

export function PulseGlyph({ size = 22 }: { size?: number }) {
  return (
    <S box={24} width={size} height={size * 0.7}>
      <path d="M1.5 14 H5l2-8 3 14 3-11 2.5 5h6" />
    </S>
  )
}

export function HandGlyph({ size = 22 }: { size?: number }) {
  return (
    <S box={24} width={size} height={size}>
      <path d="M8 11V5.4a1.5 1.5 0 0 1 3 0V11M11 11V4a1.5 1.5 0 0 1 3 0v7M14 11V5.6a1.5 1.5 0 0 1 3 0V13M8 11V8.4a1.5 1.5 0 0 0-3 0v6.2c0 3.7 2.6 6.6 6.4 6.6H13c2.6 0 4-2 4-4.4V13" />
    </S>
  )
}

export function FlagGlyph({ size = 22 }: { size?: number }) {
  return (
    <S box={24} width={size} height={size}>
      <path d="M6 21V3M6 4.4h11.5l-2.4 4.2 2.4 4.2H6" />
    </S>
  )
}

export function MuteGlyph({ size = 22 }: { size?: number }) {
  return (
    <S box={24} width={size} height={size}>
      <path d="M4 9.5h3.6L12 5.4v13.2L7.6 14.5H4z" />
      <path d="M16.4 9.6l4.4 4.8M20.8 9.6l-4.4 4.8" />
    </S>
  )
}

export function TrashGlyph({ size = 20 }: { size?: number }) {
  return (
    <S box={24} width={size} height={size}>
      <path d="M4 6.4h16M9.6 6.4V4.2h4.8v2.2M6.4 6.4l1 13.4h9.2l1-13.4M10.2 10v6M13.8 10v6" />
    </S>
  )
}

export function SwitchCamGlyph({ size = 22 }: { size?: number }) {
  return (
    <S box={24} width={size} height={size}>
      <path d="M3.2 8.6h13.2v9.8H3.2z" />
      <path d="M16.4 11.4l4.4-3v9l-4.4-3" />
      <path d="M7.4 5.8l2-2.4h4.6l2 2.4" />
    </S>
  )
}

export function CrosshairGlyph({ size = 22 }: { size?: number }) {
  return (
    <S box={24} width={size} height={size}>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1.6v4M12 18.4v4M1.6 12h4M18.4 12h4" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </S>
  )
}

export function DashedFrameGlyph({ size = 22 }: { size?: number }) {
  return (
    <S box={24} width={size} height={size} strokeDasharray="3 2.6">
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
    </S>
  )
}

export function SlidersGlyph({ size = 22 }: { size?: number }) {
  return (
    <S box={24} width={size} height={size * 0.65}>
      <path d="M2 6h6M13 6h9M2 14h11M18 14h4" />
      <circle cx="10.5" cy="6" r="2.4" />
      <circle cx="15.5" cy="14" r="2.4" />
    </S>
  )
}

export function CloseGlyph({ size = 20 }: { size?: number }) {
  return (
    <S box={24} width={size} height={size} strokeWidth="1.8">
      <path d="M5 5l14 14M19 5L5 19" />
    </S>
  )
}

export function BackArrow({ w = 22 }: { w?: number }) {
  return (
    <svg width={w} height={w * 0.62} viewBox="0 0 22 14" fill="none" aria-hidden="true" className="block shrink-0">
      <path d="M21 7H1.6M7.4 1.4 1 7l6.4 5.6" stroke="currentColor" strokeWidth="1.7"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function UploadGlyph({ size = 20 }: { size?: number }) {
  return (
    <S box={24} width={size} height={size}>
      <path d="M12 15.4V3.2M7.6 7.6 12 3.2l4.4 4.4M3.6 15v4.4a1.4 1.4 0 0 0 1.4 1.4h14a1.4 1.4 0 0 0 1.4-1.4V15" />
    </S>
  )
}

export function ShieldGlyph({ size = 30 }: { size?: number }) {
  return (
    <S box={24} width={size} height={size}>
      <path d="M12 2.4 4.6 5.6v6.2c0 5 3.1 8.6 7.4 10 4.3-1.4 7.4-5 7.4-10V5.6z" />
    </S>
  )
}

export function GearGlyph({ size = 26 }: { size?: number }) {
  return (
    <S box={24} width={size} height={size}>
      <path d="M12 2.6 14 4l2.4-.6 1 2.3 2.3 1L19 9.1 20.4 11l-1.7 1.8.5 2.4-2.3.9-.9 2.3-2.4-.5L12 21.4l-1.6-1.5-2.4.5-.9-2.3-2.3-.9.5-2.4L3.6 13 5 11.1 3.6 9.2l2.3-1 1-2.3L9.3 6.5z" />
      <circle cx="12" cy="12" r="3.4" stroke={ORANGE} />
    </S>
  )
}

export function CameraGlyph({ size = 26 }: { size?: number }) {
  return (
    <S box={24} width={size} height={size}>
      <path d="M3 8.6h3.4l1.6-2.4h8l1.6 2.4H21v10.2H3z" />
      <circle cx="12" cy="13.4" r="3.2" stroke={ORANGE} />
    </S>
  )
}

/** The 5-point make/miss spark canonical draws beside a session strip. */
export function Spark({ width = 52, height = 22 }: { width?: number; height?: number }) {
  const pts: [number, number, boolean][] = [
    [0, 0.8, false], [0.28, 0.3, true], [0.52, 0.62, false], [0.76, 0.2, true], [1, 0.05, true],
  ]
  const X = (t: number) => 3 + t * (width - 6)
  const Y = (v: number) => 3 + v * (height - 6)
  return (
    <svg width={width} height={height} aria-hidden="true" className="block shrink-0">
      <polyline fill="none" stroke={GRAPHITE} strokeWidth="1.2"
                points={pts.map(([t, v]) => `${X(t)},${Y(v)}`).join(" ")} />
      {pts.map(([t, v, made]) => (
        <circle key={t} cx={X(t)} cy={Y(v)} r="2.8" fill={made ? GREEN : GRAPHITE} />
      ))}
    </svg>
  )
}

/** Canonical's confidence dial on 035 — a 3/4 arc with the value inside. */
export function ConfidenceArc({ value, size = 52 }: { value: number; size?: number }) {
  const r = size / 2 - 3
  const c = size / 2
  const sweep = Math.PI * 1.45
  const start = Math.PI * 0.78
  const pt = (t: number) => [c + r * Math.cos(start + sweep * t), c + r * Math.sin(start + sweep * t)]
  const arc = (t0: number, t1: number) => {
    const [x0, y0] = pt(t0)
    const [x1, y1] = pt(t1)
    return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${sweep * (t1 - t0) > Math.PI ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`
  }
  const f = Math.max(0.02, Math.min(1, value / 100))
  return (
    <svg width={size} height={size * 0.86} viewBox={`0 0 ${size} ${size * 0.86}`} fill="none" aria-hidden="true" className="block">
      <path d={arc(0, 1)} stroke={RULE} strokeWidth="4.4" strokeLinecap="round" />
      <path d={arc(0, f)} stroke={ORANGE} strokeWidth="4.4" strokeLinecap="round" />
    </svg>
  )
}
