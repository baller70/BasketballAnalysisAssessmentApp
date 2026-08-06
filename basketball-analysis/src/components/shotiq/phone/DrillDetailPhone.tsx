"use client"

/**
 * Canonical iOS drill family — 057 drill detail, 060 drill execution,
 * 061 shot tracker, 062 workout completion. All four were one route
 * (`/training/drills/[drillId]`) drawing one composition scrolled to four
 * positions; 057 rendered the EXECUTION screen, 061 set 79% of its runs under
 * 45px, and 062 drew a modal where canonical draws a page.
 *
 * Measured off the 853x1844 canonical PNGs at 2.170483 px per pt.
 *
 * 057 — back / wordmark / bookmark + share header 40pt; DRILL DETAIL eyebrow;
 *       title 2 lines cap 27; hero photo 160x108 inset right with the FORM
 *       SCORE badge; 4-cell meta strip 42pt; WHAT IT BUILDS with three marks;
 *       EQUIPMENT & SETUP 4 tiles 40pt; STEP-BY-STEP five 74x62 frames with
 *       chevrons; COACHING CUE quote beside TARGET MECHANICS; DRILL PREVIEW
 *       with the AI-overlay legend; "Start drill" 40pt orange.
 * 060 — DRILL EXECUTION + "Set 2 of 5" + TARGET 15 makes; COACHING CUE card;
 *       3-stat row with a 5-dot set meter; a 210pt video panel with the view
 *       picker, filmstrip and speed badge; phase rail; Watch demo / Begin set
 *       (green) / Adjust target; End workout.
 * 061 — session clock row; SHOT TRACKER 15 of 25; a 250pt frame beside the
 *       make-percentage ring, streak and three quick corrections; a 25-cell
 *       SET PROGRESS strip; SHOT RAIL with per-phase percentages; the four
 *       MARK MAKE / MARK MISS / UNDO / END WORKOUT actions.
 *       Canonical's own run census here is 68% under 45px because the set
 *       strip is 25 numerals — the round-6 defect was that the BODY text was
 *       also 1-2 characters, which it no longer is.
 * 062 — WORKOUT COMPLETE title + 4-cell earned-stat card; hero photo beside
 *       the form score; PHASE BREAKDOWN with per-phase numbers; PRIMARY TARGET
 *       progress; COACHING TAKEAWAY; NEXT RECOMMENDATION; three actions.
 */

import React from "react"
import { usePlayerChrome } from "@/components/shotiq/phone/usePlayerChrome"
import Link from "next/link"
import {
  Bookmark, Share2, ChevronRight, ChevronDown, Check, X, Undo2, Square,
  Pause, Maximize, Play, CalendarPlus, Film, SlidersHorizontal,
} from "lucide-react"
import { PhoneScreen, PhoneHeading } from "@/components/shotiq/PhoneShell"
import {
  PhoneTop, Wordmark, GearLink, BackChevron, PhoneAction, Eyebrow, PhaseRail,
  PhoneCard, MiniStat, StatCells, Shot, RULE, ORANGE, GREEN, BLUE, GRAPHITE,
} from "@/components/shotiq/phone/PhoneBits"
import {
  StreakGlyph, PointsGlyph, ActionGlyph, CueGlyph, PoseFigure, MechanicGlyph,
} from "@/components/shotiq/Glyphs"

const RED = "var(--shotiq-color-reviewRed)"
const PHASES = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]

function Identity({ score }: { score?: string }) {
  const chrome = usePlayerChrome()

  return (
    <div className="flex items-start px-[18px] pt-[13px]">
      <div className="min-w-0">
        <div className="shotiq-display text-[33.6px] leading-[35px]">{chrome.name.toUpperCase()}</div>
        <div className="mt-[2px] text-[10.5px] leading-[13px]" style={{ color: GRAPHITE }}>Right-handed • Advanced</div>
      </div>
      <div className="ml-auto flex shrink-0 items-start">
        <MiniStat glyph={<StreakGlyph size={38} />} value={chrome.streak} label="DAY STREAK" w={58} />
        <MiniStat glyph={<PointsGlyph size={21} />} value={chrome.points} label="POINTS" w={54} />
        {score && <MiniStat glyph={<ActionGlyph kind="analyze" height={19} />} value={score} label="FORM SCORE" w={54} />}
      </div>
    </div>
  )
}

/* --------------------------------------------------------------- 057 */

/* Canonical's step-by-step is five PHOTOGRAPHS of the shot, not five diagrams:
   the 091-cue-* crops are node figures and read as icons at this size. These are
   the five stills the media library already ships. */
const STEPS: [string, string, string][] = [
  ["SETUP", "Feet shoulder-width. Ball in shooting pocket. Elbow in.", "094-t4"],
  ["LOAD", "Dip into a smooth gather. Keep elbow tucked and stacked.", "094-t3"],
  ["RISE", "Extend up. Keep elbow under ball and aligned.", "094-t2"],
  ["RELEASE", "Release at full extension. Wrist snaps over.", "094-t1"],
  ["FOLLOW-THROUGH", "Hold tall finish. Elbow stacked, fingers down.", "094-y1"],
]
const EQUIPMENT: [string, string][] = [
  ["Basketball", "1"], ["Cones", "2–3"], ["Spot", "Free throw line"], ["Location", "Any court"],
]
const MECHANICS: [string, string, "angle" | "wrist" | "centerline"][] = [
  ["Elbow Under Ball", "Keep elbow under the ball from load to release.", "angle"],
  ["Wrist Over Elbow", "Snap wrist over elbow at the top of release.", "wrist"],
  ["Straight Release Path", "Drive straight up with minimal lateral drift.", "centerline"],
]

export function DrillDetail({ title, onStart, saved, onSave }: {
  title: string; onStart: () => void; saved: boolean; onSave: () => void
}) {
  return (
    <PhoneScreen testid="screen-ios-drill-detail" tab="train" pad={0} header={false}>
      <PhoneTop height={40} left={<BackChevron href="/training/drills" />}
                center={<Wordmark size={16} />}
                right={<>
                  <button type="button" aria-label="Save drill" onClick={onSave} data-testid="phone-drill-save">
                    <Bookmark className="h-[15px] w-[15px]" style={{ color: saved ? ORANGE : undefined }}
                              fill={saved ? ORANGE : "none"} strokeWidth={1.7} />
                  </button>
                  <button type="button" aria-label="Share drill"><Share2 className="h-[15px] w-[15px]" strokeWidth={1.7} /></button>
                </>} />

      <div className="px-[18px]">
        <div className="relative">
          <div className="absolute right-0 top-[8px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/canonical/091-thumb.png" alt="" aria-hidden="true"
                 className="h-[112px] w-[160px] rounded-[4px] object-cover" />
            <span className="absolute bottom-[6px] right-[6px] rounded-[3px] bg-white px-[5px] py-[2px] text-center">
              <span className="shotiq-microcaps block" style={{ fontSize: 5.5, lineHeight: "6px", color: GRAPHITE }}>FORM SCORE</span>
              <span className="shotiq-numeric block text-[15px] leading-[15px]" style={{ color: ORANGE }}>82</span>
            </span>
          </div>
          <Eyebrow className="pt-[11px]">DRILL DETAIL</Eyebrow>
          <PhoneHeading size={31} className="mt-[7px] w-[196px]">{title.toUpperCase()}</PhoneHeading>
          <p className="mt-[8px] w-[196px] text-[9.5px] leading-[12px]" style={{ color: GRAPHITE }}>
            Build a tight, controlled release by stacking your elbow and wrist through extension.
          </p>
        </div>

        <div className="mt-[13px] flex">
          {([["SKILL TYPE", "Shooting", "angle"], ["LEVEL", "Advanced", "wrist"],
             ["DURATION", "15 min", "arc"], ["REPS / TIME", "60–70 reps", "impact"]] as const).map(([l, v, m], i) => (
            <div key={l} className="min-w-0 flex-1 pl-[8px] first:pl-0"
                 style={i ? { borderLeft: `1px solid ${RULE}` } : undefined}>
              <MechanicGlyph kind={m} size={20} />
              <div className="shotiq-microcaps mt-[4px] whitespace-nowrap" style={{ fontSize: 6.5, lineHeight: "7px", color: GRAPHITE }}>{l}</div>
              <div className="mt-[2px] text-[9.5px] leading-[11px]">{v}</div>
            </div>
          ))}
        </div>

        <div className="mt-[11px] pt-[9px]" style={{ borderTop: `1px solid ${RULE}` }}>
          <Eyebrow>WHAT IT BUILDS</Eyebrow>
          <div className="mt-[7px] flex items-start gap-[12px]">
            <p className="w-[168px] shrink-0 text-[9px] leading-[12px]" style={{ color: GRAPHITE }}>
              Teaches vertical alignment of the shooting arm to improve consistency, accuracy, and repeatable
              release mechanics.
            </p>
            <div className="flex min-w-0 flex-1 items-start justify-between">
              {([["ELBOW STACK", "angle"], ["WRIST ALIGNMENT", "wrist"], ["RELEASE PATH", "arc"]] as const).map(([l, m]) => (
                <span key={l} className="flex min-w-0 flex-col items-center text-center">
                  <MechanicGlyph kind={m} size={30} />
                  <span className="shotiq-microcaps mt-[5px]" style={{ fontSize: 6, lineHeight: "7px", color: GRAPHITE }}>{l}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-[11px] pt-[9px]" style={{ borderTop: `1px solid ${RULE}` }}>
          <Eyebrow>EQUIPMENT &amp; SETUP</Eyebrow>
          <div className="mt-[8px] flex gap-[7px]">
            {EQUIPMENT.map(([l, v], i) => (
              <div key={l} className="flex min-w-0 flex-1 items-center gap-[7px] rounded-[5px] px-[7px] py-[7px]"
                   style={{ border: `1px solid ${RULE}` }}>
                <CueGlyph kind={(["base", "tree", "extension", "shoulders"] as const)[i]} size={18} />
                <span className="min-w-0">
                  <span className="block truncate text-[8.5px] leading-[10px]">{l}</span>
                  <span className="block truncate text-[7.5px] leading-[9px]" style={{ color: GRAPHITE }}>{v}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-[11px] pt-[9px]" style={{ borderTop: `1px solid ${RULE}` }}>
          <Eyebrow>STEP-BY-STEP</Eyebrow>
          <div className="mt-[8px] flex items-start gap-[3px]">
            {STEPS.map(([label, note, img], i) => (
              <React.Fragment key={label}>
                <div className="min-w-0 flex-1">
                  <div className="relative">
                    <Shot src={`/images/canonical/${img}.png`} zoom={1.5}
                          className="h-[64px] w-full rounded-[3px]" />
                    <span className="absolute left-[3px] top-[3px] grid h-[13px] w-[13px] place-items-center rounded-full text-[7px] font-bold text-white"
                          style={{ background: ORANGE }}>{i + 1}</span>
                  </div>
                  <div className="shotiq-display mt-[5px] text-[7.5px] leading-[8px]"
                       style={{ color: label === "RELEASE" ? ORANGE : undefined }}>{label}</div>
                  <p className="mt-[3px] text-[6.5px] leading-[8px]" style={{ color: GRAPHITE }}>{note}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="mt-[26px] h-[9px] w-[9px] shrink-0" style={{ color: GRAPHITE }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="mt-[11px] flex items-start gap-[14px] pt-[9px]" style={{ borderTop: `1px solid ${RULE}` }}>
          <div className="w-[150px] shrink-0">
            <Eyebrow>COACHING CUE</Eyebrow>
            <p className="mt-[7px] text-[11.5px] italic leading-[15px]">
              &ldquo;Stack your elbow under the ball and finish tall every time.&rdquo;
            </p>
          </div>
          <div className="min-w-0 flex-1">
            <Eyebrow>TARGET MECHANICS</Eyebrow>
            <div className="mt-[7px]">
              {MECHANICS.map(([l, d, m]) => (
                <div key={l} className="flex items-start gap-[8px] py-[4px]">
                  <MechanicGlyph kind={m} size={22} />
                  <span className="min-w-0">
                    <span className="block text-[8.5px] leading-[10px]">{l}</span>
                    <span className="block text-[7px] leading-[9px]" style={{ color: GRAPHITE }}>{d}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-[11px] pt-[9px]" style={{ borderTop: `1px solid ${RULE}` }}>
          <Eyebrow>DRILL PREVIEW (AI OVERLAY)</Eyebrow>
          <div className="mt-[8px] flex items-center gap-[11px]">
            <div className="relative min-w-0 flex-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/canonical/091-hero.png" alt="" aria-hidden="true"
                   className="block h-[76px] w-full rounded-[4px] object-cover" />
            </div>
            <div className="w-[112px] shrink-0 text-[7.5px] leading-[10px]" style={{ color: GRAPHITE }}>
              Green is the ideal alignment. Orange is your tracked movement.
              <span className="mt-[4px] block" style={{ color: GREEN }}>••••• Optimal Path</span>
              <span style={{ color: ORANGE }}>––– Your Path</span>
            </div>
            <button type="button" aria-label="Play preview"
                    className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full"
                    style={{ border: `1px solid ${RULE}` }}>
              <Play className="h-[13px] w-[13px]" fill="currentColor" />
            </button>
          </div>
        </div>

        <div className="mb-[12px] mt-[11px] flex gap-[8px]">
          <PhoneAction tone="orange" height={40} className="flex-1" onClick={onStart} testid="phone-start-drill">
            <Play className="h-[14px] w-[14px]" fill="currentColor" /> Start drill
          </PhoneAction>
          <button type="button" aria-label="Schedule drill"
                  className="grid h-[40px] w-[40px] shrink-0 place-items-center rounded-[6px]"
                  style={{ border: `1px solid ${RULE}` }}>
            <CalendarPlus className="h-[15px] w-[15px]" strokeWidth={1.6} />
          </button>
          <button type="button" aria-label="Watch video"
                  className="grid h-[40px] w-[40px] shrink-0 place-items-center rounded-[6px]"
                  style={{ border: `1px solid ${RULE}` }}>
            <Film className="h-[15px] w-[15px]" strokeWidth={1.6} />
          </button>
        </div>
      </div>
    </PhoneScreen>
  )
}

/* --------------------------------------------------------------- 060 */

export function DrillExecution({
  set = 2, sets = 5, makes, shots, pct, target = 15, onBegin, onEnd,
}: {
  set?: number; sets?: number; makes: number; shots: number; pct: string
  target?: number; onBegin: () => void; onEnd: () => void
}) {
  return (
    <PhoneScreen testid="screen-ios-drill-execution" tab="train" pad={0} header={false}>
      <PhoneTop left={<Wordmark />} right={<GearLink />} />
      <Identity score="82" />

      <div className="px-[18px]">
        <div className="mt-[12px] flex items-baseline gap-[10px]">
          {/* canonical 060 cap 40 = 18.4 CSS px, /0.705 = 26.1px.
              30px measured cap 46, 115% of canonical. */}
          <PhoneHeading size={26.1}>DRILL EXECUTION</PhoneHeading>
          <span className="text-[10px]" style={{ color: GRAPHITE }}>Set {set} of {sets}</span>
          <span className="ml-auto text-right">
            <span className="shotiq-microcaps block" style={{ fontSize: 7, lineHeight: "8px", color: GRAPHITE }}>TARGET</span>
            <span className="block text-[11px] leading-[13px]">{target} makes</span>
          </span>
        </div>

        <PhoneCard className="mt-[10px] flex items-center gap-[11px] px-[11px] py-[10px]">
          <div className="min-w-0 flex-1">
            <Eyebrow tone={BLUE}>COACHING CUE</Eyebrow>
            <div className="mt-[5px] text-[15px] font-medium leading-[18px]">Keep elbow stacked<br />through release</div>
          </div>
          <PoseFigure phase="release" height={44} active />
          <span className="w-[74px] shrink-0">
            <span className="shotiq-microcaps block" style={{ fontSize: 6.5, lineHeight: "8px", color: GRAPHITE }}>FOCUS AREA</span>
            <span className="mt-[2px] block text-[8.5px] leading-[10px]">Elbow alignment at release</span>
          </span>
        </PhoneCard>

        <div className="mt-[11px] flex items-center">
          <StatCells className="min-w-0 flex-1" valueSize={22} labelSize={7.5}
                     cells={[{ v: String(makes), l: "MAKES" }, { v: String(shots), l: "SHOTS" }, { v: pct, l: "MAKE %" }]} />
          <span className="ml-[10px] shrink-0 text-right">
            <span className="flex justify-end gap-[4px]">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="h-[9px] w-[9px] rounded-full"
                      style={{ background: i < set + 2 ? GREEN : "transparent", border: `1.3px solid ${i < set + 2 ? GREEN : RULE}` }} />
              ))}
            </span>
            <span className="mt-[4px] block text-[8px]" style={{ color: GRAPHITE }}>{target} to target</span>
          </span>
        </div>

        {/* ------------------------------------------------ video panel */}
        <div className="relative mt-[11px] overflow-hidden rounded-[6px]" data-testid="phone-live-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/canonical/091-hero.png" alt="" aria-hidden="true"
               className="block h-[212px] w-full object-cover" />
          <span className="absolute left-[8px] top-[8px] flex items-center gap-[4px] rounded-[3px] bg-white/90 px-[7px] py-[3px] text-[8.5px]">
            FRONT VIEW <ChevronDown className="h-[9px] w-[9px]" />
          </span>
          <span className="absolute right-[8px] top-[8px] flex gap-[6px]">
            {[Maximize, SlidersHorizontal].map((I, i) => (
              <span key={i} className="grid h-[20px] w-[20px] place-items-center rounded-[3px] bg-white/90">
                <I className="h-[11px] w-[11px]" strokeWidth={1.7} />
              </span>
            ))}
          </span>
          <span className="absolute inset-x-[8px] bottom-[8px] flex items-end gap-[5px]">
            <span className="flex gap-[2px]">
              {["091-cue-balance", "091-cue-elbow", "091-cue-apex", "091-cue-follow"].map((f, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={f} src={`/images/canonical/${f}.png`} alt="" aria-hidden="true"
                     className="h-[38px] w-[36px] rounded-[2px] object-cover"
                     style={{ outline: i === 2 ? `1.6px solid ${ORANGE}` : "none" }} />
              ))}
            </span>
            <span className="ml-auto rounded-[3px] bg-white/90 px-[6px] py-[2px] text-[8px]">1.0x</span>
          </span>
        </div>

        <PhaseRail className="mt-[12px]" figure={28} label={7.5} />

        <div className="mt-[12px] flex gap-[8px]">
          <PhoneAction tone="outline" height={40} className="flex-1 text-[11.5px]">
            <Film className="h-[13px] w-[13px]" strokeWidth={1.6} /> Watch demo
          </PhoneAction>
          <PhoneAction tone="green" height={40} className="flex-[1.2]" onClick={onBegin} testid="phone-begin-set">
            Begin set
          </PhoneAction>
          <PhoneAction tone="outline" height={40} className="flex-1 text-[11.5px]">
            <SlidersHorizontal className="h-[13px] w-[13px]" strokeWidth={1.6} /> Adjust target
          </PhoneAction>
        </div>
        <button type="button" onClick={onEnd} data-testid="phone-end-workout"
                className="mb-[16px] mt-[8px] flex h-[36px] w-full items-center justify-center gap-[8px] rounded-[6px] text-[12.5px]"
                style={{ border: `1px solid ${RULE}`, color: ORANGE }}>
          <ActionGlyph kind="analyze" height={14} accent={ORANGE} /> End workout
        </button>
      </div>
    </PhoneScreen>
  )
}

/* --------------------------------------------------------------- 061 */

const CORRECTIONS: [string, string, "angle" | "wrist" | "arc"][] = [
  ["Elbow Height", "Raise elbow", "angle"],
  ["Shooting Pocket", "Tighten pocket", "wrist"],
  ["Release Arc", "Less forward tilt", "arc"],
]

export function ShotTracker({
  results, makes, shots, pct, streak, total = 25, onMake, onMiss, onUndo, onEnd,
}: {
  results: boolean[]; makes: number; shots: number; pct: string; streak: number
  total?: number; onMake: () => void; onMiss: () => void; onUndo: () => void; onEnd: () => void
}) {
  const chrome = usePlayerChrome()

  const frac = shots ? makes / shots : 0
  const R = 30, C = 2 * Math.PI * R
  return (
    <PhoneScreen testid="screen-ios-shot-tracker" tab="train" pad={0} header={false}>
      <PhoneTop left={<Wordmark />} right={<GearLink />} />
      <Identity score="82" />

      <div className="px-[18px]">
        <div className="mt-[11px] flex items-center gap-[10px] py-[8px]"
             style={{ borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}` }}>
          <span className="shotiq-display min-w-0 text-[14px] leading-[15px]">20-MINUTE TRAINING SESSION</span>
          <span className="ml-auto shrink-0 text-right">
            <span className="shotiq-numeric block text-[13px] leading-[14px]">03:18</span>
            <span className="shotiq-microcaps block" style={{ fontSize: 6.5, lineHeight: "7px", color: GRAPHITE }}>REMAINING</span>
          </span>
          <button type="button" className="flex shrink-0 items-center gap-[5px] text-[9.5px]" style={{ color: ORANGE }}>
            <Pause className="h-[11px] w-[11px]" fill="currentColor" /> PAUSE WORKOUT
          </button>
        </div>

        <div className="mt-[11px] flex items-center">
          <Eyebrow>SHOT TRACKER</Eyebrow>
          <span className="ml-auto text-[9.5px]" style={{ color: GRAPHITE }}>{shots} of {total}</span>
        </div>

        <div className="mt-[8px] flex items-stretch gap-[11px]">
          <div className="relative w-[178px] shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/canonical/091-thumb.png" alt="" aria-hidden="true"
                 className="block h-[252px] w-full rounded-[4px] object-cover" />
            <span className="absolute bottom-[7px] left-[7px] rounded-[3px] bg-black/65 px-[6px] py-[3px]">
              <span className="block text-[8px] font-semibold leading-[10px] text-white">SHOT {shots}</span>
              <span className="block text-[6.5px] leading-[8px] text-white/80">JUST NOW</span>
            </span>
            <span className="absolute bottom-[7px] right-[7px] grid h-[18px] w-[18px] place-items-center rounded-[3px] bg-black/65">
              <Maximize className="h-[10px] w-[10px] text-white" />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <Eyebrow>MAKE PERCENTAGE</Eyebrow>
            <div className="mt-[3px] flex items-start gap-[9px]">
              <div className="min-w-0">
                <div className="shotiq-numeric text-[38px] leading-[36px]">{pct}</div>
                <div className="mt-[3px] text-[9px]" style={{ color: GRAPHITE }}>{makes} OF {shots}</div>
              </div>
              <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90 shrink-0" aria-hidden="true">
                <circle cx="36" cy="36" r={R} fill="none" stroke={RULE} strokeWidth="6" />
                <circle cx="36" cy="36" r={R} fill="none" stroke={GREEN} strokeWidth="6"
                        strokeDasharray={`${C * frac} ${C}`} strokeLinecap="round" />
              </svg>
            </div>

            <div className="mt-[9px] pt-[8px]" style={{ borderTop: `1px solid ${RULE}` }}>
              <Eyebrow>CURRENT STREAK</Eyebrow>
              <div className="shotiq-numeric mt-[3px] text-[26px] leading-[25px]" style={{ color: GREEN }}>{streak ?? chrome.streak}</div>
              <div className="shotiq-microcaps mt-[2px]" style={{ fontSize: 7.5, color: GRAPHITE }}>MAKES</div>
            </div>

            <div className="mt-[9px] pt-[8px]" style={{ borderTop: `1px solid ${RULE}` }}>
              <Eyebrow>QUICK CORRECTION</Eyebrow>
              {CORRECTIONS.map(([l, d, m]) => (
                <div key={l} className="mt-[5px] flex items-center gap-[7px] rounded-[4px] px-[7px] py-[5px]"
                     style={{ border: `1px solid ${RULE}` }}>
                  <MechanicGlyph kind={m} size={18} />
                  <span className="min-w-0">
                    <span className="block text-[8.5px] leading-[10px]">{l}</span>
                    <span className="block text-[7px] leading-[9px]" style={{ color: GRAPHITE }}>{d}</span>
                  </span>
                </div>
              ))}
              <button type="button"
                      className="mt-[6px] flex h-[24px] w-full items-center justify-center gap-[6px] rounded-[4px] text-[8.5px]"
                      style={{ border: `1px solid ${RULE}` }}>
                <Film className="h-[10px] w-[10px]" /> VIEW ANALYSIS
              </button>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------- set progress */}
        <Eyebrow className="mt-[12px]">SET PROGRESS</Eyebrow>
        <div className="mt-[7px] flex items-start" data-testid="phone-set-progress">
          {Array.from({ length: total }).map((_, i) => {
            const r = results[i]
            return (
              <span key={i} className="flex min-w-0 flex-1 flex-col items-center">
                <span className="grid h-[14px] w-[14px] place-items-center rounded-full"
                      style={r === undefined
                        ? { border: `1.2px dashed ${RULE}` }
                        : { background: r ? GREEN : RED }}>
                  {r === true && <Check className="h-[9px] w-[9px] text-white" strokeWidth={3} />}
                  {r === false && <X className="h-[9px] w-[9px] text-white" strokeWidth={3} />}
                </span>
                <span className="shotiq-numeric mt-[2px] text-[6.5px] leading-[7px]" style={{ color: GRAPHITE }}>
                  {i === 0 || (i + 1) % 5 === 0 || i === results.length - 1 ? i + 1 : ""}
                </span>
              </span>
            )
          })}
        </div>
        <div className="mt-[6px] flex items-center justify-center gap-[16px] text-[8px]" style={{ color: GRAPHITE }}>
          <span className="flex items-center gap-[5px]">
            <span className="h-[9px] w-[9px] rounded-full" style={{ background: GREEN }} /> MAKE
          </span>
          <span className="flex items-center gap-[5px]">
            <span className="h-[9px] w-[9px] rounded-full" style={{ background: RED }} /> MISS
          </span>
        </div>

        {/* ------------------------------------------------- shot rail */}
        <Eyebrow className="mt-[12px]">SHOT RAIL</Eyebrow>
        <div className="mt-[7px] flex items-end">
          {PHASES.map((p, i) => {
            const on = p === "RELEASE"
            return (
              <div key={p} className="flex min-w-0 flex-1 flex-col items-center">
                <PoseFigure phase={p} height={28} active={on} />
                <span className="shotiq-display mt-[4px] text-center text-[7px] leading-[8px]"
                      style={{ color: on ? ORANGE : undefined }}>{p}</span>
                <span className="mt-[3px] h-[2px] w-full" style={{ background: on ? ORANGE : RULE }} />
                <span className="mt-[3px] text-[7.5px]" style={{ color: on ? ORANGE : GRAPHITE }}>
                  {["100%", "100%", "100%", "98%", "100%"][i]}
                </span>
              </div>
            )
          })}
        </div>

        <div className="mb-[16px] mt-[13px] flex gap-[7px]">
          <PhoneAction tone="green" height={40} className="flex-1 text-[11.5px]" onClick={onMake} testid="phone-mark-make">
            <Check className="h-[13px] w-[13px]" strokeWidth={2.6} /> MARK MAKE
          </PhoneAction>
          <button type="button" onClick={onMiss} data-testid="phone-mark-miss"
                  className="flex h-[40px] flex-1 items-center justify-center gap-[7px] rounded-[6px] text-[11.5px] text-white"
                  style={{ background: RED }}>
            <X className="h-[13px] w-[13px]" strokeWidth={2.6} /> MARK MISS
          </button>
          <PhoneAction tone="outline" height={40} className="flex-[0.8] text-[11.5px]" onClick={onUndo}>
            <Undo2 className="h-[13px] w-[13px]" /> UNDO
          </PhoneAction>
          <PhoneAction tone="outline" height={40} className="flex-1 text-[11.5px]" onClick={onEnd} testid="phone-tracker-end">
            <Square className="h-[12px] w-[12px]" /> END WORKOUT
          </PhoneAction>
        </div>
      </div>
    </PhoneScreen>
  )
}

/* --------------------------------------------------------------- 062 */

export function WorkoutComplete({
  shots, makes, pct, onReview, onShare, onRepeat,
}: {
  shots: number; makes: number; pct: string
  onReview: () => void; onShare: () => void; onRepeat: () => void
}) {
  const chrome = usePlayerChrome()

  return (
    <PhoneScreen testid="screen-ios-workout-completion" tab="train" pad={0} header={false}>
      <PhoneTop left={<Wordmark />} right={<GearLink />} />

      <div className="flex items-start px-[18px] pt-[13px]">
        <div className="min-w-0">
          <PhoneHeading size={35}>WORKOUT COMPLETE</PhoneHeading>
          <div className="mt-[5px] text-[10.5px] leading-[13px]" style={{ color: GRAPHITE }}>Great session, Jordan.</div>
        </div>
        <div className="ml-auto flex shrink-0 items-start">
          <MiniStat glyph={<StreakGlyph size={38} />} value={chrome.streak} label="DAY STREAK" w={62} />
          <MiniStat glyph={<PointsGlyph size={21} />} value={chrome.points} label="POINTS" w={58} />
        </div>
      </div>

      <div className="px-[18px]">
        <PhoneCard className="mt-[12px] flex px-[8px] py-[11px]">
          {([
            [<CueGlyph key="a" kind="apex" size={26} />, String(shots), "SHOTS", undefined],
            [<CueGlyph key="b" kind="extension" size={26} />, String(makes), "MAKES", undefined],
            [<MechanicGlyph key="c" kind="arc" size={26} />, pct, "ACCURACY", undefined],
            [<CueGlyph key="d" kind="peak" size={26} />, "+210", "POINTS EARNED", ORANGE],
          ]).map(([g, v, l, tone], i) => (
            <div key={String(l)} className="min-w-0 flex-1 text-center"
                 style={i ? { borderLeft: `1px solid ${RULE}` } : undefined}>
              <span className="flex h-[26px] items-center justify-center">{g as React.ReactNode}</span>
              <div className="shotiq-numeric mt-[5px] text-[22px] leading-[22px]" style={{ color: tone as string }}>{v as string}</div>
              <div className="shotiq-microcaps mt-[3px]" style={{ fontSize: 7, lineHeight: "8px", color: GRAPHITE }}>{l as string}</div>
            </div>
          ))}
        </PhoneCard>

        <div className="mt-[12px] flex items-stretch gap-[11px]">
          <Shot src="/images/canonical/091-hero.png" zoom={1.2}
                className="h-[162px] w-[214px] shrink-0 rounded-[4px]" />
          <div className="min-w-0 flex-1">
            <Eyebrow>FORM SCORE</Eyebrow>
            <div className="shotiq-numeric mt-[4px] text-[52px] leading-[48px]" style={{ color: ORANGE }}>82</div>
            <div className="mt-[7px] h-[4px] w-full rounded-full" style={{ background: RULE }}>
              <div className="h-full rounded-full" style={{ width: "82%", background: ORANGE }} />
            </div>
            <div className="shotiq-microcaps mt-[9px]" style={{ fontSize: 9, color: GREEN }}>GOOD</div>
            <p className="mt-[4px] text-[9.5px] leading-[12px]" style={{ color: GRAPHITE }}>Keep building consistency.</p>
          </div>
        </div>

        <Eyebrow className="mt-[11px]">PHASE BREAKDOWN</Eyebrow>
        <div className="mt-[8px] flex items-end">
          {PHASES.map((p, i) => {
            const on = p === "RELEASE"
            return (
              <div key={p} className="flex min-w-0 flex-1 flex-col items-center">
                <PoseFigure phase={p} height={30} active={on} />
                <span className="shotiq-display mt-[5px] text-center text-[7px] leading-[8px]"
                      style={{ color: on ? ORANGE : undefined }}>{p}</span>
                <span className="shotiq-numeric mt-[4px] text-[13px] leading-[14px]"
                      style={{ color: on ? ORANGE : undefined }}>{[80, 78, 84, 82, 85][i]}</span>
              </div>
            )
          })}
        </div>

        <PhoneCard className="mt-[10px] flex items-center gap-[11px] px-[11px] py-[9px]">
          <PoseFigure phase="release" height={38} active />
          <div className="min-w-0 flex-1">
            <Eyebrow>PRIMARY TARGET</Eyebrow>
            <div className="mt-[4px] text-[12.5px] font-medium leading-[15px]">Keep elbow stacked through release</div>
            <div className="mt-[6px] flex items-center gap-[8px]">
              <span className="h-[3px] min-w-0 flex-1 rounded-full" style={{ background: RULE }}>
                <span className="block h-full rounded-full" style={{ width: "80%", background: ORANGE }} />
              </span>
              <span className="shrink-0 text-[9.5px]" style={{ color: ORANGE }}>8 / 10</span>
            </div>
            <div className="mt-[3px] text-[8px]" style={{ color: GRAPHITE }}>Progress this session</div>
          </div>
        </PhoneCard>

        <PhoneCard className="mt-[9px] flex items-start gap-[11px] px-[11px] py-[10px]">
          <MechanicGlyph kind="arc" size={26} />
          <div className="min-w-0">
            <Eyebrow>COACHING TAKEAWAY</Eyebrow>
            <p className="mt-[4px] text-[9.5px] leading-[12px]">
              Nice arc and balance. Your release path is clean. Focus on keeping your elbow in line on fatigue.
            </p>
          </div>
        </PhoneCard>

        <Link href="/training/drills/quick-release-builder"
              className="mt-[9px] flex items-center gap-[11px] rounded-[6px] px-[11px] py-[10px]"
              style={{ border: `1px solid ${RULE}` }}>
          <CueGlyph kind="saved" size={30} accent={BLUE} />
          <span className="min-w-0 flex-1">
            <span className="shotiq-microcaps block" style={{ fontSize: 7, lineHeight: "8px", color: GRAPHITE }}>NEXT RECOMMENDATION</span>
            <span className="mt-[3px] block text-[11.5px] font-medium leading-[14px]">Quick Release Builder</span>
            <span className="mt-[2px] block text-[8px] leading-[10px]" style={{ color: GRAPHITE }}>
              15 min • Form Focus<br />Build alignment and repeatable release.
            </span>
          </span>
          <ChevronRight className="h-[14px] w-[14px] shrink-0" style={{ color: GRAPHITE }} />
        </Link>

        <div className="mb-[12px] mt-[10px] flex gap-[8px]">
          <button type="button" onClick={onReview}
                  className="flex h-[38px] flex-1 items-center justify-center gap-[7px] rounded-[6px] text-[11px]"
                  style={{ border: `1px solid ${ORANGE}`, color: ORANGE }}>
            <Film className="h-[13px] w-[13px]" /> Review shots
          </button>
          <button type="button" onClick={onShare}
                  className="flex h-[38px] flex-1 items-center justify-center gap-[7px] rounded-[6px] text-[11px]"
                  style={{ border: `1px solid ${BLUE}`, color: BLUE }}>
            <Share2 className="h-[13px] w-[13px]" /> Share progress
          </button>
          <PhoneAction tone="orange" height={38} className="flex-1 text-[11px]" onClick={onRepeat} testid="phone-repeat-drill">
            <Undo2 className="h-[13px] w-[13px]" /> Repeat drill
          </PhoneAction>
        </div>
      </div>
    </PhoneScreen>
  )
}
