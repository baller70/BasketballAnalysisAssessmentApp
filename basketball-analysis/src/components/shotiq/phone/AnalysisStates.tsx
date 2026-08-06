"use client"

/**
 * The three canonical iOS analysis-run states, all of them states of one job
 * rather than pages of their own:
 *
 *   036-analysis-processing      the job is running
 *   037-analysis-taking-longer   the same job, still running after 15s
 *   040-analysis-error           the job came back failed
 *
 * Geometry is measured off the canonical PNGs at 1:1 and divided by
 * 853/393 = 2.170483. The band tables are in each component.
 */

import React from "react"
import Link from "next/link"
import {
  PhoneScreen, PhoneIdentity, PhoneHeading, PhoneSessionStrip, PhoneCoachingTarget,
} from "@/components/shotiq/PhoneShell"
import { ActionGlyph, PhaseTrack } from "@/components/shotiq/Glyphs"

const BLUE = "var(--shotiq-color-analysisBlue)"
const ORANGE = "var(--shotiq-color-shotiqOrange)"

/* ------------------------------------------------------------- glyphs ---- */

function StageGlyph({ kind }: { kind: "upload" | "pose" | "score" | "baseline" | "plan" }) {
  const c = { fill: "none", stroke: "currentColor", strokeWidth: 1.3, strokeLinecap: "round" as const }
  if (kind === "upload") return <ActionGlyph kind="analyze" height={20} accent="currentColor" />
  if (kind === "pose") return (
    <svg width="24" height="18" viewBox="0 0 24 18" aria-hidden="true" className="block">
      <path d="M2.5 12 L8 15 L14 5 L21.5 9" {...c} />
      {[[2.5, 12], [8, 15], [14, 5], [21.5, 9]].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="2.2" fill="#FDFDFD" stroke="currentColor" strokeWidth="1.3" />
      ))}
    </svg>
  )
  if (kind === "score") return (
    <svg width="22" height="18" viewBox="0 0 22 18" aria-hidden="true" className="block">
      <path d="M3 15.5 L15 2.5 M3 15.5 H19.5" {...c} />
      <path d="M8 15.5 A7 7 0 0 0 6.6 10" {...c} strokeDasharray="1.6 2" />
      <circle cx="3" cy="15.5" r="2" fill="#FDFDFD" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="19.5" cy="15.5" r="2" fill="#FDFDFD" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="15" cy="2.5" r="2" fill="#FDFDFD" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
  if (kind === "baseline") return (
    <svg width="24" height="16" viewBox="0 0 24 16" aria-hidden="true" className="block">
      <path d="M2.5 13.5 A11 11 0 0 1 21.5 6" {...c} strokeDasharray="2 2.6" />
      <circle cx="2.5" cy="13.5" r="2" fill="#FDFDFD" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="12" cy="5.5" r="2" fill="#FDFDFD" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="21.5" cy="6" r="2.4" fill="#FDFDFD" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
  return (
    <svg width="18" height="21" viewBox="0 0 18 21" aria-hidden="true" className="block">
      <path d="M1.4 1.4h10.2l5 5v14.2H1.4z" {...c} />
      <path d="M11.6 1.4v5h5" {...c} />
      <path d="M4.6 10.4h8.8M4.6 13.6h8.8M4.6 16.8h5.6" {...c} />
    </svg>
  )
}

function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" className="block">
      <path d="M10 1.6a8.4 8.4 0 1 0 8.4 8.4" fill="none" stroke={BLUE} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

function Tick({ size = 19 }: { size?: number }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-full" style={{ width: size, height: size, background: BLUE }}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 12 12" aria-hidden="true">
        <path d="M2.4 6.4 L4.9 9 L9.6 3.2" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

function ClockGlyph({ size = 42, dashed = false, tone = BLUE }: { size?: number; dashed?: boolean; tone?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 42 42" aria-hidden="true" className="block shrink-0">
      <circle cx="21" cy="21" r="18.5" fill="none" stroke={tone} strokeWidth="2.2"
              strokeDasharray={dashed ? "3 4.5" : undefined} />
      <path d="M21 9.5V21h9.5" fill="none" stroke={tone} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

/* ----------------------------------------------- 036 analysis processing -- */
/*
 *   header rule            y  41.5
 *   identity               y  54.8-108.3   x 17.0-358.0
 *   ANALYSIS PROCESSING    y 133.6-157.1   cap 24.0 -> 34.0px display
 *   body 2 lines           y 168.2 / 182.9, cap+desc 11.1, 14.7 pitch
 *   job card               y 203.2-457.0   x 16.6-374.6
 *     PROCESSING VIDEO     y 215.2-225.3   x 29.5   (analysis blue)
 *     spec line            y 231.7-241.4
 *     progress row         y 252.9-262.6   x 29.0-363.5
 *     stage rows           y 282.0 / 322.5 / 358.4 / 396.2 / 430.3 (36.6 pitch)
 *   LIVE FRAME PREVIEW     y 470.4-482.8   cap 12.9
 *   frame + score          y 485.6-636.7   x 17.5-375.5
 *   phase strip            y 649.2-690.2, active underline y 696.2
 *   keep-app-open card     y 708.6-773.1
 */
const STAGES: [string, "upload" | "pose" | "score" | "baseline" | "plan", "done" | "run" | "queue"][] = [
  ["Upload complete", "upload", "done"],
  ["Detecting pose & landmarks", "pose", "run"],
  ["Scoring mechanics", "score", "queue"],
  ["Comparing to your baseline", "baseline", "queue"],
  ["Building coaching plan", "plan", "queue"],
]

export function AnalysisProcessing({ pct = 64 }: { pct?: number }) {
  return (
    <PhoneScreen testid="screen-ios-analysis-processing" tab="home" pad={16.6}>
      <PhoneIdentity className="pt-[19px]" />

      <PhoneHeading size={30.3} className="mt-[22px]">ANALYSIS PROCESSING</PhoneHeading>
      <p className="mt-[9px] text-[10.9px] leading-[14.7px] tracking-[-0.03em] text-[var(--shotiq-color-graphite)]">
        Shot Rail AI is reviewing your mechanics<br />and building your results.
      </p>

      <div className="mt-[10px] rounded-[8px] border border-[var(--shotiq-color-rule)] px-[12.4px] pb-[8px] pt-[12px]">
        <PhoneHeading size={15} style={{ color: BLUE }}>PROCESSING VIDEO</PhoneHeading>
        <div className="mt-[6px] text-[11px] leading-[12px] text-[var(--shotiq-color-graphite)]">1080p • 24s • 30fps</div>
        <div className="mt-[11px] flex items-center gap-[12px]">
          <span className="h-[7px] flex-1 rounded-full bg-[var(--shotiq-color-rule)]">
            <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: BLUE }} />
          </span>
          <span className="shotiq-numeric shrink-0 text-[15px] leading-[16px]" style={{ color: BLUE }}>{pct}%</span>
        </div>
        <div className="mt-[8px] divide-y divide-[var(--shotiq-color-rule)]">
          {STAGES.map(([label, kind, state]) => (
            <div key={label} className="flex items-center gap-[16px] py-[6px]">
              <span className="flex w-[26px] shrink-0 justify-center"
                    style={{ color: state === "queue" ? "var(--shotiq-color-ink)" : BLUE }}>
                <StageGlyph kind={kind} />
              </span>
              <span className="min-w-0 flex-1 text-[13px] leading-[15px]">{label}</span>
              {state === "done" && <Tick />}
              {state === "run" && <Spinner />}
              {state === "queue" && (
                <span className="text-[11px] leading-[12px] text-[var(--shotiq-color-graphite)]">Queued</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <PhoneHeading size={18} className="mt-[8px]">LIVE FRAME PREVIEW</PhoneHeading>
      <div className="mt-[4px] flex gap-[12px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/canonical/083-hero.png" alt="Frame from the clip being analyzed"
             className="h-[145px] w-[255px] shrink-0 rounded-[4px] object-cover" />
        <div className="min-w-0 flex-1 pt-[24px]">
          <div className="shotiq-section-label leading-[12px] tracking-[0.08em] text-[var(--shotiq-color-graphite)]" style={{ "--shotiq-label-size": "11px" } as React.CSSProperties}>
            FORM SCORE
          </div>
          {/* A SCREEN THAT IS BY DEFINITION PRE-RESULT CANNOT REPORT ONE.
              This printed "82 / GOOD" under LIVE FRAME PREVIEW while the
              analysis was still running — a specific score for a run that has
              produced none. Unlike the strips elsewhere in the phone tree there
              is no state in which the number would be right: this screen only
              ever renders mid-analysis. The band, its label and its geometry
              stay where canonical puts them; only the claim goes.
              When the pipeline can stream partial scores, THIS is the panel
              that should carry them — the shape is ready for it. */}
          <div className="shotiq-numeric mt-[2px] text-[52px] leading-[52px] text-[var(--shotiq-color-muted)]">—</div>
          <div className="mt-[4px] h-[5px] rounded-full bg-[var(--shotiq-color-rule)]" />
          <div className="shotiq-display mt-[8px] text-[16px] leading-[17px] text-[var(--shotiq-color-graphite)]">SCORING</div>
          <div className="mt-[4px] text-[10.5px] leading-[12px] text-[var(--shotiq-color-graphite)]">
            Your score lands<br />when this finishes.
          </div>
        </div>
      </div>

      <PhaseTrack className="mt-[6px]" figure={41} label={11.5} underline />

      <div className="mt-[7px] flex items-start gap-[14px] rounded-[8px] border border-[var(--shotiq-color-rule)] px-[12px] py-[12px]">
        <ClockGlyph size={42} dashed />
        <div className="min-w-0">
          <div className="text-[15.5px] font-medium leading-[17px]" style={{ color: BLUE }}>Keep app open</div>
          <p className="mt-[5px] text-[10.5px] leading-[13px] text-[var(--shotiq-color-graphite)]">
            We&apos;ll notify you when your results are ready.<br />
            You can switch tasks — analysis will continue in the background.
          </p>
        </div>
      </div>
      <div className="h-[20px]" />
    </PhoneScreen>
  )
}

/* --------------------------------------------- 037 analysis taking longer -- */
/*
 *   header rule            y  38.2
 *   identity               y  49.8-103.7
 *   status card            y 116.6-428.9   x 20.3-372.3
 *   Notify me when ready   y 436.8-469.0   (filled analysis blue)
 *   Keep waiting           y 475.0-505.0
 *   Cancel analysis        y 510.5-540.9
 *   ANALYSIS QUEUE         y 553.8-566.2   "1 ahead of you" right-aligned
 *   queue card             y 572.7-627.0
 *   phase strip            y 634.4-669.9, underline y 672.7
 *   rule                   y 682.3
 *   coaching target        y 691.6-721.5
 *   rule                   y 727.0
 *   session strip          y 730.3-761.1
 */
export function AnalysisTakingLonger({ onKeepWaiting, onCancel }: {
  onKeepWaiting?: () => void; onCancel?: () => void
}) {
  return (
    <PhoneScreen testid="screen-ios-analysis-taking-longer" tab="home" pad={20.3}>
      <PhoneIdentity className="pt-[11px]" />

      <div className="mt-[13px] rounded-[8px] border border-[var(--shotiq-color-rule)] px-[16px] pb-[10px] pt-[12px]">
        <div className="flex justify-center">
          <svg width="66" height="66" viewBox="0 0 72 72" aria-hidden="true" className="block">
            <circle cx="36" cy="36" r="33" fill="none" stroke="var(--shotiq-color-rule)" strokeWidth="3" strokeDasharray="4 5" />
            <path d="M36 3a33 33 0 0 1 0 66" fill="none" stroke={BLUE} strokeWidth="3.4" strokeLinecap="round" />
            <g>
              <path d="M22 45 L29 40 L34 35 L40 29" fill="none" stroke="#111" strokeWidth="1.8" />
              {[[22, 45], [29, 40], [34, 35]].map(([x, y]) => (
                <circle key={x} cx={x} cy={y} r="2.6" fill="#FDFDFD" stroke="#111" strokeWidth="1.6" />
              ))}
              <circle cx="41" cy="28" r="3" fill="#FDFDFD" stroke={BLUE} strokeWidth="1.8" />
            </g>
          </svg>
        </div>
        <PhoneHeading size={27} className="mt-[9px] text-center">ANALYSIS TAKING LONGER</PhoneHeading>
        <p className="mt-[7px] text-center text-[11.5px] leading-[14px] text-[var(--shotiq-color-graphite)]">
          High-quality biomechanical analysis can take several<br />
          minutes. Your shot is being processed in the background.
        </p>

        <div className="mt-[9px] flex items-start">
          {([["Upload complete", "100%", "upload", false],
             ["Analyzing motion", "Estimating key angles", "pose", true],
             ["Building insights", "Pending", "plan", false]] as
             [string, string, "upload" | "pose" | "plan", boolean][]).map(([t, s, kind, on], i) => (
            <React.Fragment key={t}>
              {i > 0 && <span aria-hidden="true" className="mt-[16px] h-px min-w-[10px] flex-1 bg-[var(--shotiq-color-rule)]" />}
              <span className="shrink-0 basis-[100px] text-center">
                <span className="flex h-[28px] items-center justify-center" style={{ color: on ? BLUE : "var(--shotiq-color-ink)" }}>
                  {kind === "upload" ? (
                    <svg width="34" height="20" viewBox="0 0 34 20" aria-hidden="true" className="block">
                      <rect x="1" y="1" width="32" height="18" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M1 5h32M1 15h32" stroke="currentColor" strokeWidth="1.2" />
                      <circle cx="17" cy="10" r="2.6" fill={BLUE} />
                    </svg>
                  ) : kind === "pose" ? (
                    <svg width="42" height="22" viewBox="0 0 42 22" aria-hidden="true" className="block">
                      <path d="M3 16 L10 5 L17 13 L24 4 L31 12 L39 7" fill="none" stroke="#111" strokeWidth="1.5" />
                      {[[3, 16], [10, 5], [24, 4], [31, 12], [39, 7]].map(([x, y]) => (
                        <circle key={x} cx={x} cy={y} r="2.3" fill="#FDFDFD" stroke="#111" strokeWidth="1.5" />
                      ))}
                      <circle cx="17" cy="13" r="3.6" fill="#FDFDFD" stroke={BLUE} strokeWidth="1.8" />
                    </svg>
                  ) : <StageGlyph kind="plan" />}
                </span>
                <span className="mt-[5px] block text-[10.5px] leading-[12px]">{t}</span>
                <span className="mt-[3px] block text-[10.5px] leading-[12px]"
                      style={{ color: on ? BLUE : "var(--shotiq-color-graphite)" }}>{s}</span>
              </span>
            </React.Fragment>
          ))}
        </div>

        <div className="mt-[9px] flex items-start gap-[14px] border-t border-[var(--shotiq-color-rule)] pt-[9px]">
          <ClockGlyph size={40} tone="#111111" />
          <div className="min-w-0">
            <div className="text-[13.5px] font-semibold leading-[15px]">We&apos;ll notify you when it&apos;s ready</div>
            <p className="mt-[4px] text-[11px] leading-[13px] text-[var(--shotiq-color-graphite)]">
              You&apos;ll get a notification and can view<br />results anytime.
            </p>
          </div>
        </div>
      </div>

      <button type="button" data-testid="notify-when-ready"
              className="mt-[6px] flex h-[32.2px] w-full items-center justify-center gap-[12px] rounded-[6px] text-[15px] font-medium text-white"
              style={{ background: BLUE }}>
        <svg width="16" height="18" viewBox="0 0 16 18" aria-hidden="true">
          <path d="M8 1.4a5 5 0 0 1 5 5v4l1.6 2.6H1.4L3 10.4v-4a5 5 0 0 1 5-5Z" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M6.2 15.4a1.9 1.9 0 0 0 3.6 0" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Notify me when ready
      </button>
      <button type="button" onClick={onKeepWaiting} data-testid="keep-waiting"
              className="mt-[4px] flex h-[30.4px] w-full items-center justify-center gap-[10px] rounded-[6px] border border-[var(--shotiq-color-rule)] text-[14px]">
        <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden="true">
          <path d="M13.2 7.5A5.7 5.7 0 0 1 3.4 11.5M1.8 7.5A5.7 5.7 0 0 1 11.6 3.5" fill="none" stroke="#111" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M11.6 0.8v3h-3M3.4 14.2v-3h3" fill="none" stroke="#111" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Keep waiting
      </button>
      <button type="button" onClick={onCancel} data-testid="cancel-analysis"
              className="mt-[4px] flex h-[30.4px] w-full items-center justify-center gap-[10px] rounded-[6px] border border-[var(--shotiq-color-rule)] text-[14px]">
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M1.6 1.6l10.8 10.8M12.4 1.6L1.6 12.4" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Cancel analysis
      </button>

      <div className="mt-[9px] flex items-baseline justify-between">
        <PhoneHeading size={18}>ANALYSIS QUEUE</PhoneHeading>
        <span className="text-[11px] leading-[12px] text-[var(--shotiq-color-graphite)]">1 ahead of you</span>
      </div>
      <div className="mt-[6px] flex items-center gap-[12px] rounded-[8px] border border-[var(--shotiq-color-rule)] px-[8px] py-[8px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/canonical/086-film-2.png" alt="" aria-hidden="true"
             className="h-[38px] w-[76px] shrink-0 rounded-[3px] object-cover" />
        <div className="min-w-0 flex-1">
          <div className="text-[11.5px] leading-[14px]">Today • 8:22 AM</div>
          <div className="mt-[3px] text-[11.5px] leading-[14px] text-[var(--shotiq-color-graphite)]">Set 1 • 24 shots</div>
        </div>
        <div className="flex shrink-0 items-center gap-[7px]">
          <ClockGlyph size={19} tone="#111111" />
          <div className="text-[11px] leading-[13px] text-[var(--shotiq-color-graphite)]">Estimated<br />2–4 min</div>
        </div>
      </div>

      <PhaseTrack className="mt-[7px]" figure={36} label={11} underline />

      <div className="mt-[8px] border-t border-[var(--shotiq-color-rule)] pt-[9px]">
        <PhoneCoachingTarget />
      </div>
      <div className="mt-[6px] border-t border-[var(--shotiq-color-rule)] pt-[5px]">
        <PhoneSessionStrip />
      </div>
      <div className="h-[20px]" />
    </PhoneScreen>
  )
}

/* ------------------------------------------------- 040 analysis error ----- */
/*
 *   header rule            y  38.2
 *   identity               y  49.8-106.4
 *   error banner           y 119.8-201.8   x 18.4-374.6, hairline in ShotIQ orange
 *   Try analysis again     y 212.4-256.2   (filled analysis blue, 43.8 tall)
 *   two secondary tiles    y 265.4-310.1
 *   frame + score column   y 321.1-571.3
 *   phase strip            y 580.1-622.9, underline y 626.6
 *   rule                   y 635.8
 *   coaching target        y 650.1-686.0
 *   rule                   y 693.4
 *   session strip          y 704.9-750.5
 *   saved-media notice     y 759.7-786.5   full-bleed, x 0-392.5
 */
export function AnalysisError({ onRetry, reason = "Not enough of your body was visible in this clip." }: {
  onRetry?: () => void; reason?: string
}) {
  return (
    <PhoneScreen testid="screen-ios-analysis-error" tab="home" pad={18.4}>
      <PhoneIdentity className="pt-[11px]" />

      <div className="mt-[9px] flex items-start gap-[6px] rounded-[8px] border px-[10px] py-[7px]"
           style={{ borderColor: ORANGE }}>
        <span className="flex w-[100px] shrink-0 justify-center pt-[6px]">
          <svg width="72" height="56" viewBox="0 0 72 56" aria-hidden="true" className="block">
            <path d="M4 20V4h16M52 4h16v16" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" />
            <path d="M4 36v16h16" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" />
            <circle cx="26" cy="26" r="6" fill="none" stroke="#111" strokeWidth="2" />
            <path d="M50 30 L62 52 H38 Z" fill="none" stroke={ORANGE} strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M50 38v6" stroke={ORANGE} strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="50" cy="48" r="1.4" fill={ORANGE} />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <PhoneHeading size={22} style={{ color: ORANGE }}>ANALYSIS ERROR</PhoneHeading>
          <div className="mt-[6px] whitespace-nowrap text-[13.8px] font-medium leading-[16px]">We couldn&apos;t complete the analysis.</div>
          <div className="mt-[4px] text-[12px] leading-[14px] text-[var(--shotiq-color-graphite)]">{reason}</div>
        </div>
      </div>

      <button type="button" onClick={onRetry} data-testid="analysis-retry"
              className="mt-[10px] flex h-[43.8px] w-full items-center justify-center gap-[18px] rounded-[6px] text-[16px] font-medium text-white"
              style={{ background: BLUE }}>
        <ActionGlyph kind="analyze" height={22} accent="#fff" />
        Try analysis again
      </button>

      <div className="mt-[9px] flex gap-[8px]">
        <Link href="/results/demo/biomechanics"
              className="flex h-[44.7px] min-w-0 flex-1 items-center justify-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] text-[12.5px]">
          <ActionGlyph kind="uploadImage" height={20} />
          <span className="whitespace-nowrap">Choose another frame</span>
        </Link>
        <Link href="/guide"
              className="flex h-[44.7px] min-w-0 flex-1 items-center justify-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] text-[12.5px]">
          <svg width="19" height="17" viewBox="0 0 19 17" aria-hidden="true" className="shrink-0">
            <path d="M2.4 11V8.5a7.1 7.1 0 0 1 14.2 0V11" fill="none" stroke="#111" strokeWidth="1.4" strokeLinecap="round" />
            <rect x="0.9" y="10" width="4" height="6.1" rx="1.6" fill="none" stroke="#111" strokeWidth="1.4" />
            <rect x="14.1" y="10" width="4" height="6.1" rx="1.6" fill="none" stroke="#111" strokeWidth="1.4" />
          </svg>
          Contact support
        </Link>
      </div>

      <div className="mt-[10px] flex gap-[12px]">
        <div className="relative h-[250px] w-[249px] shrink-0 overflow-hidden rounded-[4px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/canonical/083-hero.png" alt="The clip the analysis failed on"
               className="h-full w-full object-cover" />
          <span aria-hidden="true" className="absolute inset-[26px] rounded-[10px] border-[1.6px] border-dashed border-white/85" />
          <span className="shotiq-numeric absolute bottom-[8px] left-[10px] text-[13px] text-white">00:01.42</span>
          <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true" className="absolute bottom-[10px] right-[10px]">
            <path d="M2 1.6 L12.4 8 L2 14.4Z" fill="#fff" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          {/* AN ANALYSIS THAT FAILED HAS NO FORM SCORE.
              This panel printed "82 / GOOD / Keep building consistency" on the
              screen whose own headline says the clip could not be analysed —
              asserting a result for a run that produced none and never will.
              The region and its labels stay exactly where canonical puts them;
              only the claim goes. The bar is drawn empty rather than removed,
              because the score is absent, not zero. */}
          <div className="shotiq-section-label leading-[12px] tracking-[0.08em] text-[var(--shotiq-color-graphite)]" style={{ "--shotiq-label-size": "11px" } as React.CSSProperties}>
            FORM SCORE
          </div>
          <div className="shotiq-numeric mt-[2px] text-[52px] leading-[52px] text-[var(--shotiq-color-muted)]">—</div>
          <div className="mt-[3px] h-[5px] rounded-full bg-[var(--shotiq-color-rule)]" />
          <div className="shotiq-display mt-[9px] text-[16px] leading-[17px] text-[var(--shotiq-color-graphite)]">NOT SCORED</div>
          <div className="mt-[5px] text-[10.5px] leading-[13px] text-[var(--shotiq-color-graphite)]">
            Re-record and<br />try again.
          </div>
          <PhoneHeading size={16} className="mt-[15px]">SHOT QUALITY</PhoneHeading>
          <div className="shotiq-microcaps mt-[6px] leading-[10px] text-[var(--shotiq-color-graphite)]" style={{ "--shotiq-microcaps-size": "9px" } as React.CSSProperties}>FRAME 18/48</div>
          <div className="relative mt-[5px] h-[26px] w-[92px] rounded-[2px] border border-[#111111]">
            <span className="absolute inset-y-0 left-[23px] w-px bg-[#111111]" />
            <span className="absolute inset-y-0 left-[46px] w-px bg-[#111111]" />
            <span className="absolute inset-y-0 left-[69px] w-px bg-[#111111]" />
            <span className="absolute inset-y-[-2px] left-[44px] w-[1.4px]" style={{ background: ORANGE }} />
          </div>
          <div className="mt-[6px] text-[10.5px] leading-[13px] text-[var(--shotiq-color-graphite)]">
            Release phase<br />detected.
          </div>
        </div>
      </div>

      <PhaseTrack className="mt-[9px]" figure={41} label={11.5} underline />

      <div className="mt-[9px] border-t border-[var(--shotiq-color-rule)] pt-[12px]">
        <PhoneCoachingTarget />
      </div>
      <div className="mt-[7px] border-t border-[var(--shotiq-color-rule)] pt-[9px]">
        <div className="shotiq-section-label leading-[12px] tracking-[0.08em] text-[var(--shotiq-color-graphite)]" style={{ "--shotiq-label-size": "11px" } as React.CSSProperties}>
          LATEST SESSION
        </div>
        <PhoneSessionStrip className="mt-[5px]" />
      </div>

      <div className="-mx-[18.4px] mt-[9px] flex items-center gap-[10px] border-t border-[var(--shotiq-color-rule)] px-[18.4px] py-[9px]">
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="shrink-0">
          <circle cx="9" cy="9" r="8" fill="none" stroke="var(--shotiq-color-graphite)" strokeWidth="1.3" />
          <path d="M9 7.6v5" stroke="var(--shotiq-color-graphite)" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="9" cy="5" r="0.9" fill="var(--shotiq-color-graphite)" />
        </svg>
        <span className="text-[11.5px] leading-[13px] text-[var(--shotiq-color-graphite)]">
          Your media is saved. This clip will be available in your history.
        </span>
      </div>
      <div className="h-[16px]" />
    </PhoneScreen>
  )
}
