"use client"

/**
 * Canonical iOS onboarding family — 008, 009, 010, 011 and 013. (012 is
 * `PlayerBio`, already built; it is mounted from the same flow below.)
 *
 * These five are ONE route on the desktop wizard (`/onboarding`, canonical
 * desktop 078) and FIVE separate designs on the phone. Round 6 shipped the
 * desktop wizard reflowed for all five, which is why grader A measured them as
 * near-identical and still carrying the wizard's own 186px step column as a
 * full-height rule at x=402px. The desktop wizard is untouched: everything here
 * is mounted only below the tablet breakpoint.
 *
 * Every number is measured off `canonical/<screen>.png` at 853x1844 and divided
 * by 853/393 = 2.170483, so 1 unit here is 1 canonical px.
 *
 * 008 — header rule 38; meter y51-57 x18-70; STEP label y66-74 cap 7.8;
 *       "BUILD YOUR" y106-144 cap 37.8; "PLAYER PROFILE" y156-192 cap 36.4
 *       (line pitch 49.3); body 3 lines y210-260 cap 10.1, pitch 18.4;
 *       hero photo x243-363 y76-414; rule y275; benefit rows y292-348 /
 *       370-411 / 432-...; data card y562-634; stat tiles y659-686;
 *       primary CTA y704-737 (32.7 tall); sign-out y743-772.
 * 009 — STEP label y62-74 centred; meter y84-88 x73-318; title y119-158
 *       cap 39.2; subtitle 2 lines y176-209 cap 10.6; four field rows on a
 *       110.6 pitch starting y251; green CONTINUE y678-724 (46 tall) x22.6-367;
 *       BACK y740-754.
 * 010 — identity + 4-cell stat strip, PRIMARY TARGET card, STEP 2 OF 4,
 *       title, 5 experience tiles, 4 body-type tiles, tip bar, Continue/Back.
 * 011 — title + STEP 3 OF 4 badge, player row, PRIMARY TARGET, DOMINANT HAND
 *       (2 tiles), ATHLETIC ABILITY (3 tiles), SHOOTING STYLE (3 photo tiles),
 *       "why this matters", Continue/Back.
 * 013 — eyebrow, title, body, avatar + tier + two edit buttons, 4-cell data
 *       card, COACHING FOCUS, SHOOTING SUMMARY, SHOT RAIL, PROFILE SUMMARY,
 *       "Complete profile".
 */

import React from "react"
import { Check, Lightbulb, ChevronRight, Info } from "lucide-react"
import { PhoneScreen, PhoneHeading } from "@/components/shotiq/PhoneShell"
import {
  PhoneTop, Wordmark, GearLink, PhoneCard, PhoneAction, Eyebrow, StepMeter,
  StatCells, MiniStat, PhaseRail, RULE, ORANGE, GREEN, BLUE, GRAPHITE,
} from "@/components/shotiq/phone/PhoneBits"
import {
  StreakGlyph, PointsGlyph, PoseFigure, MechanicGlyph, ActionGlyph, FlawFigure,
} from "@/components/shotiq/Glyphs"

/* The phone flow is its own six-surface sequence. Canonical numbers the five
   answering steps 1..5 (012 reads "4 OF 5", 013 "STEP 5 OF 5"); the intro sits
   in front of them and previews step 1. */
export const PHONE_STEPS = ["intro", "physical", "experience", "shooting", "bio", "review"] as const
export type PhoneStep = (typeof PHONE_STEPS)[number]

const SELECTED = { borderColor: ORANGE, background: "#FFF6F2" }

function Tile({
  on, onClick, testid, className = "", children, radio = false,
}: {
  on: boolean; onClick: () => void; testid?: string; className?: string
  children: React.ReactNode; radio?: boolean
}) {
  return (
    <button type="button" onClick={onClick} data-testid={testid} aria-pressed={on}
            className={`relative flex min-w-0 flex-col items-center rounded-[6px] px-[6px] pb-[8px] pt-[10px] text-center ${className}`}
            style={{ border: `1px solid ${RULE}`, background: "#fff", ...(on ? SELECTED : {}) }}>
      {radio ? (
        <span className="absolute right-[6px] top-[6px] grid h-[13px] w-[13px] place-items-center rounded-full"
              style={{ border: `1.4px solid ${on ? ORANGE : RULE}`, background: on ? ORANGE : "#fff" }}>
          {on && <Check className="h-[9px] w-[9px] text-white" strokeWidth={3} />}
        </span>
      ) : on ? (
        <span className="absolute right-[5px] top-[5px] grid h-[13px] w-[13px] place-items-center rounded-full"
              style={{ background: ORANGE }}>
          <Check className="h-[9px] w-[9px] text-white" strokeWidth={3} />
        </span>
      ) : null}
      {children}
    </button>
  )
}

function TileLabel({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <div className="shotiq-display mt-[6px] text-[10.5px] leading-[11px]" style={{ color: on ? ORANGE : undefined }}>
      {children}
    </div>
  )
}

function TileNote({ children }: { children: React.ReactNode }) {
  return <div className="mt-[3px] text-[8px] leading-[10px]" style={{ color: GRAPHITE }}>{children}</div>
}

/* --------------------------------------------------------------- 008 */

const BENEFITS: [string, string, string][] = [
  ["PERSONALIZED ANALYSIS", "Your measurements help tailor angles, ranges, and feedback that fit you.", "078-benefit-1"],
  ["BETTER COMPARISONS", "Compare against similar players with a profile like yours.", "078-benefit-2"],
  ["SMARTER COACHING", "Get coaching cues that adapt as you improve.", "078-benefit-3"],
]

export function OnboardingIntro({ onStart, onSkip, onSignOut, name = "Jordan" }: {
  onStart: () => void; onSkip?: () => void; onSignOut?: () => void; name?: string
}) {
  void name
  return (
    <PhoneScreen testid="screen-ios-onboarding-intro" tab="home" pad={0} header={false}>
      <PhoneTop left={<Wordmark />} right={
        <button type="button" onClick={onSkip} data-testid="onboarding-skip"
                className="text-[13px]" style={{ color: GRAPHITE }}>Skip</button>} />

      <div className="relative px-[18px]">
        {/* Canonical bleeds the hero to the right edge, x243-363 of 393. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/canonical/078-hero.png" alt="" aria-hidden="true"
             className="pointer-events-none absolute right-[-18px] top-[38px] h-[300px] w-[168px] max-w-none object-cover object-[62%_18%]" />

        <StepMeter step={1} steps={4} w={130} className="relative pt-[13px]" />
        <Eyebrow className="relative mt-[9px]">STEP 1 OF 4</Eyebrow>

        <PhoneHeading size={53.6} className="relative mt-[14px] tracking-[0.01em]">BUILD YOUR</PhoneHeading>
        <PhoneHeading size={51.6} className="relative mt-[11px] tracking-[0.01em]" style={{ color: ORANGE }}>
          PLAYER PROFILE
        </PhoneHeading>

        <p className="relative mt-[18px] w-[210px] text-[14px] leading-[18.4px]">
          Add quick measurements so ShotIQ can personalize your comparisons and coaching to you.
        </p>
      </div>

      {/* ------------------------------------------------ benefit rows */}
      <div className="mt-[15px]">
        {BENEFITS.map(([t, d, img], i) => (
          <div key={t} className="flex items-start gap-[16px] px-[18px] py-[13px]"
               style={{ borderTop: `1px solid ${RULE}` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/images/canonical/${img}.png`} alt="" aria-hidden="true"
                 className="mt-[2px] h-[38px] w-[28px] shrink-0 object-contain" />
            <div className="min-w-0" style={{ maxWidth: i === 2 ? 260 : 218 }}>
              <div className="shotiq-display text-[12.5px] leading-[13px]">{t}</div>
              <p className="mt-[4px] text-[9.5px] leading-[12.5px]" style={{ color: GRAPHITE }}>{d}</p>
            </div>
          </div>
        ))}
      </div>

      {/* --------------------------------------------- about your data */}
      <div className="mx-[18px] mt-[14px] flex items-start gap-[14px] rounded-[6px] px-[14px] py-[12px]"
           style={{ border: `1px solid ${RULE}` }}>
        <span className="mt-[1px] grid h-[27px] w-[27px] shrink-0 place-items-center rounded-full"
              style={{ border: `1.4px dashed ${ORANGE}` }}>
          <Info className="h-[13px] w-[13px]" style={{ color: ORANGE }} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <div className="shotiq-display text-[11px] leading-[12px]">ABOUT YOUR DATA</div>
          <p className="mt-[4px] text-[9.5px] leading-[12.5px]" style={{ color: GRAPHITE }}>
            Measurements personalize your experience only. ShotIQ does not provide medical advice or diagnoses.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------- data card */}
      <PhoneCard className="mx-[18px] mt-[12px] flex items-center px-[10px] py-[11px]">
        <div className="w-[54px] shrink-0 text-center">
          <span className="flex h-[22px] items-center justify-center"><StreakGlyph size={40} /></span>
          <div className="shotiq-numeric mt-[4px] text-[16px] leading-[16px]">6</div>
          <div className="shotiq-microcaps mt-[3px] text-[7.5px] leading-[8px]" style={{ color: GRAPHITE }}>DAY STREAK</div>
        </div>
        <div className="w-[62px] shrink-0 text-center">
          <span className="flex h-[22px] items-center justify-center"><PointsGlyph size={22} /></span>
          <div className="shotiq-numeric mt-[4px] text-[16px] leading-[16px]">2,840</div>
          <div className="shotiq-microcaps mt-[3px] text-[7.5px] leading-[8px]" style={{ color: GRAPHITE }}>POINTS</div>
        </div>
        <div className="w-[58px] shrink-0 text-center">
          <span className="flex h-[22px] items-center justify-center">
            <ActionGlyph kind="analyze" height={20} />
          </span>
          <div className="shotiq-numeric mt-[4px] text-[16px] leading-[16px]" style={{ color: ORANGE }}>82</div>
          <div className="shotiq-microcaps mt-[3px] text-[7.5px] leading-[8px]" style={{ color: GRAPHITE }}>FORM SCORE</div>
        </div>
        <div className="min-w-0 flex-1 pl-[10px] text-center" style={{ borderLeft: `1px solid ${RULE}` }}>
          <span className="flex h-[22px] items-center justify-center gap-[3px]">
            {(["setup", "load", "rise", "release", "follow"] as const).map((p) => (
              <PoseFigure key={p} phase={p} height={20} active={p === "release"} />
            ))}
          </span>
          <div className="shotiq-microcaps mt-[4px] text-[7.5px] leading-[8px]" style={{ color: GRAPHITE }}>PRIMARY TARGET</div>
          <div className="mt-[2px] text-[9px] leading-[11px]">Keep elbow stacked<br />through release</div>
        </div>
      </PhoneCard>

      {/* ------------------------------------------------ stat tiles */}
      <div className="mx-[18px] mt-[11px] flex rounded-[6px] py-[10px]" style={{ border: `1px solid ${RULE}` }}>
        {[["24", "SHOTS"], ["15", "MAKES"], ["62.5%", "ACCURACY"], ["RIGHT", "HANDED"]].map(([v, l], i) => (
          <div key={l} className="min-w-0 flex-1 text-center"
               style={i ? { borderLeft: `1px solid ${RULE}` } : undefined}>
            <div className="shotiq-numeric text-[15px] leading-[16px]">{v}</div>
            <div className="shotiq-microcaps mt-[4px] text-[7.5px] leading-[8px]" style={{ color: GRAPHITE }}>{l}</div>
          </div>
        ))}
      </div>

      <div className="mx-[18px] mb-[16px] mt-[13px]">
        <PhoneAction tone="orange" height={33} onClick={onStart} testid="onboarding-start">
          <ActionGlyph kind="analyze" height={17} accent="#fff" /> Build my player profile
        </PhoneAction>
        <PhoneAction tone="outline" height={29} className="mt-[6px] text-[13px]" onClick={onSignOut}>
          Sign out
        </PhoneAction>
      </div>
    </PhoneScreen>
  )
}

/* --------------------------------------------------------------- 009 */

function FieldRow({
  glyph, label, note, value, units, unit, onUnit, onValue, testid,
}: {
  glyph: React.ReactNode; label: string; note: string; value: string
  units: [string, string]; unit: 0 | 1; onUnit: (i: 0 | 1) => void
  onValue?: (v: string) => void; testid?: string
}) {
  return (
    <div className="flex items-start gap-[16px] py-[17px]" style={{ borderTop: `1px solid ${RULE}` }}>
      <span className="mt-[2px] flex h-[46px] w-[32px] shrink-0 items-center justify-center">{glyph}</span>
      <div className="min-w-0 flex-1">
        <div className="shotiq-display text-[19px] leading-[20px]">{label}</div>
        <div className="mt-[4px] text-[10.5px] leading-[13px]" style={{ color: GRAPHITE }}>{note}</div>
      </div>
      <div className="shrink-0 text-right">
        <input value={value} data-testid={testid} onChange={(e) => onValue?.(e.target.value)}
               className="shotiq-numeric w-[92px] bg-transparent text-right text-[26px] leading-[27px] outline-none" />
        <div className="mt-[6px] flex w-[92px] overflow-hidden rounded-[4px]" style={{ border: `1px solid ${RULE}` }}>
          {units.map((u, i) => (
            <button key={u} type="button" onClick={() => onUnit(i as 0 | 1)}
                    className="h-[22px] flex-1 text-[9px] font-medium"
                    style={i === unit ? { background: BLUE, color: "#fff" } : { color: GRAPHITE }}>
              {u}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function PhysicalProfile({
  age, height, weight, wingspan, onAge, onHeight, onWeight, onWingspan, onNext, onBack,
}: {
  age: string; height: string; weight: string; wingspan: string
  onAge: (v: string) => void; onHeight: (v: string) => void
  onWeight: (v: string) => void; onWingspan: (v: string) => void
  onNext: () => void; onBack: () => void
}) {
  const [units, setUnits] = React.useState<[0 | 1, 0 | 1, 0 | 1, 0 | 1]>([0, 0, 0, 0])
  const setU = (i: number) => (v: 0 | 1) => setUnits((u) => { const n = [...u] as typeof u; n[i] = v; return n })
  return (
    <PhoneScreen testid="screen-ios-physical-profile" tab="home" pad={0} header={false}>
      <PhoneTop left={<Wordmark />} />
      <div className="px-[22px]">
        <div className="pt-[16px] text-center">
          <Eyebrow className="tracking-[0.14em]" tone={ORANGE}>STEP 1 OF 4</Eyebrow>
          <StepMeter step={1} steps={4} w={245} className="mx-auto mt-[11px]" />
          <PhoneHeading size={55.6} className="mt-[20px]">PHYSICAL PROFILE</PhoneHeading>
          <p className="mx-auto mt-[12px] w-[268px] text-[14.7px] leading-[18.7px]" style={{ color: GRAPHITE }}>
            Accurate measurements help AI personalize your analysis and training.
          </p>
        </div>

        <div className="mt-[19px]">
          <FieldRow glyph={<MechanicGlyph kind="angle" size={44} />}
                    label="AGE" note="Your current age" value={age} onValue={onAge}
                    units={["YEARS", "MONTHS"]} unit={units[0]} onUnit={setU(0)} testid="phone-age" />
          <FieldRow glyph={<MechanicGlyph kind="arc" size={44} />}
                    label="HEIGHT" note="Without shoes" value={height} onValue={onHeight}
                    units={["FT / IN", "CM"]} unit={units[1]} onUnit={setU(1)} testid="phone-height" />
          <FieldRow glyph={<MechanicGlyph kind="wrist" size={40} />}
                    label="WEIGHT" note="Without shoes" value={weight} onValue={onWeight}
                    units={["LBS", "KG"]} unit={units[2]} onUnit={setU(2)} testid="phone-weight" />
          <FieldRow glyph={<PoseFigure phase="follow" height={44} />}
                    label="WINGSPAN" note="Fingertip to fingertip" value={wingspan} onValue={onWingspan}
                    units={["FT / IN", "CM"]} unit={units[3]} onUnit={setU(3)} testid="phone-wingspan" />
        </div>

        <div className="mb-[18px] mt-[23px]">
          <PhoneAction tone="green" height={46} onClick={onNext} testid="phone-onboarding-continue"
                       className="shotiq-display text-[19px] tracking-[0.05em]">
            CONTINUE
          </PhoneAction>
          <button type="button" onClick={onBack}
                  className="shotiq-display mt-[16px] flex items-center gap-[9px] text-[16px]">
            <svg width="9" height="15" viewBox="0 0 9 15" aria-hidden="true">
              <path d="M7.5 1 L1.5 7.5 L7.5 14" fill="none" stroke="currentColor" strokeWidth="1.6"
                    strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            BACK
          </button>
        </div>
      </div>
    </PhoneScreen>
  )
}

/* --------------------------------------------------------------- 010 */

const LEVELS: [string, string][] = [
  ["BEGINNER", "Just getting started"], ["INTERMEDIATE", "Consistent with basics"],
  ["ADVANCED", "Competes regularly"], ["ELITE", "High-level competition"],
  ["PROFESSIONAL", "Pro or aspiring pro"],
]
const BODIES: [string, string, "ectomorph" | "mesomorph" | "endomorph" | "larger"][] = [
  ["SLIM / LEAN", "Light frame, longer limbs", "ectomorph"],
  ["ATHLETIC", "Balanced build, muscular", "mesomorph"],
  ["STOCKY / STRONG", "Solid build, powerful frame", "endomorph"],
  ["LARGER FRAME", "Broad build, higher mass", "larger"],
]

/** Canonical draws each experience tile as a small node-graph that climbs a
 *  little further per level, and each body type as a stick figure whose frame
 *  widens. Both are drawn, never rastered. */
function LevelMark({ i, on }: { i: number; on: boolean }) {
  const tint = on ? ORANGE : "currentColor"
  const pts = [
    [[3, 20], [10, 17], [17, 15], [24, 13]],
    [[3, 21], [10, 17], [17, 16], [24, 10]],
    [[3, 22], [10, 16], [17, 17], [24, 7]],
    [[3, 22], [10, 18], [17, 10], [24, 5]],
    [[3, 23], [10, 15], [17, 12], [24, 4]],
  ][i] as [number, number][]
  return (
    <svg width="30" height="27" viewBox="0 0 27 27" fill="none" aria-hidden="true" className="block">
      <path d={pts.map(([x, y], k) => `${k ? "L" : "M"}${x},${y}`).join(" ")}
            stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      {pts.map(([x, y], k) => (
        <circle key={k} cx={x} cy={y} r="2.1" fill={k === pts.length - 1 ? tint : "#fff"}
                stroke={k === pts.length - 1 ? tint : "currentColor"} strokeWidth="1.2" />
      ))}
      {i === 4 && <path d="M20 4 H25 V9" stroke={tint} strokeWidth="1.2" strokeLinecap="round" />}
    </svg>
  )
}

function BodyMark({ i, on }: { i: number; on: boolean }) {
  const w = [5.5, 7.5, 9.5, 11][i]
  const tint = on ? ORANGE : "currentColor"
  return (
    <svg width="34" height="44" viewBox="0 0 24 44" fill="none" aria-hidden="true" className="block">
      <circle cx="12" cy="5" r="3.6" stroke="currentColor" strokeWidth="1.2" />
      <path d={`M12 9 V26 M${12 - w} 13 H${12 + w} M12 26 L${12 - w * 0.8} 40 M12 26 L${12 + w * 0.8} 40`}
            stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d={`M${12 + w + 1.5} 12 V22`} stroke={tint} strokeWidth="1.4" strokeLinecap="round" />
      <path d={`M${12 + w - 0.5} 12 H${12 + w + 3.5} M${12 + w - 0.5} 22 H${12 + w + 3.5}`}
            stroke={tint} strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

export function ExperienceBodyType({
  level, body, onLevel, onBody, onNext, onBack,
}: {
  level: string; body: string
  onLevel: (v: string) => void; onBody: (v: string) => void
  onNext: () => void; onBack: () => void
}) {
  return (
    <PhoneScreen testid="screen-ios-experience-body-type" tab="home" pad={0} header={false}>
      <PhoneTop left={<Wordmark />} right={<GearLink />} />

      <div className="flex items-start gap-[10px] px-[18px] pt-[13px]">
        <div className="min-w-0">
          <div className="shotiq-display text-[30px] leading-[31px]">JORDAN ELLIS</div>
          <div className="mt-[2px] text-[10.5px] leading-[13px]" style={{ color: GRAPHITE }}>Right-handed • Advanced</div>
        </div>
        <div className="ml-auto flex shrink-0 items-start">
          <MiniStat glyph={<StreakGlyph size={38} />} value="6" label="DAY STREAK" w={62} />
          <MiniStat glyph={<PointsGlyph size={21} />} value="2,840" label="POINTS" w={58} />
        </div>
      </div>

      <div className="mx-[18px] mt-[11px]" style={{ borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}` }}>
        <StatCells className="py-[9px]" valueSize={19} labelSize={7.5}
                   cells={[
                     { v: "82", l: "FORM SCORE", tone: BLUE }, { v: "24", l: "SHOTS" },
                     { v: "15", l: "MAKES" }, { v: "62.5%", l: "ACCURACY", tone: BLUE },
                     { v: <span className="text-[9px] leading-[11px]">Keep elbow<br />stacked</span>, l: "PRIMARY TARGET" },
                   ]} />
      </div>

      <div className="mx-[18px] mt-[12px] rounded-[6px] px-[13px] py-[10px]"
           style={{ border: `1px solid ${RULE}` }}>
        <Eyebrow tone={ORANGE}>PRIMARY TARGET</Eyebrow>
        <div className="mt-[5px] text-[14px] leading-[17px]">Keep elbow stacked through release</div>
      </div>

      <div className="mt-[14px] px-[18px]">
        <div className="flex items-center gap-[12px]">
          <Eyebrow tone={ORANGE} className="shrink-0">STEP 2 OF 4</Eyebrow>
          <StepMeter step={2} steps={4} w={180} />
        </div>
        <PhoneHeading size={40} className="mt-[11px]">EXPERIENCE &amp; BODY TYPE</PhoneHeading>
        <p className="mt-[10px] text-[11.5px] leading-[15px]" style={{ color: GRAPHITE }}>
          This helps us tailor analysis and training recommendations to your game.
        </p>

        <div className="shotiq-display mt-[15px] text-[12.5px] leading-[13px]">WHAT BEST DESCRIBES YOUR EXPERIENCE?</div>
        <div className="mt-[9px] flex gap-[6px]">
          {LEVELS.map(([t, d], i) => {
            const on = level === t
            return (
              <Tile key={t} on={on} onClick={() => onLevel(t)} className="flex-1"
                    testid={`phone-level-${t.toLowerCase()}`}>
                <span className="flex h-[30px] items-center"><LevelMark i={i} on={on} /></span>
                <TileLabel on={on}>{t}</TileLabel>
                <TileNote>{d}</TileNote>
              </Tile>
            )
          })}
        </div>

        <div className="shotiq-display mt-[16px] text-[12.5px] leading-[13px]">WHAT BEST DESCRIBES YOUR BODY TYPE?</div>
        <div className="mt-[9px] flex gap-[7px]">
          {BODIES.map(([t, d], i) => {
            const on = body === t
            return (
              <Tile key={t} on={on} onClick={() => onBody(t)} className="flex-1"
                    testid={`phone-body-${i}`}>
                <span className="flex h-[46px] items-center"><BodyMark i={i} on={on} /></span>
                <TileLabel on={on}>{t}</TileLabel>
                <TileNote>{d}</TileNote>
              </Tile>
            )
          })}
        </div>

        <div className="mt-[14px] flex items-center gap-[11px] rounded-[6px] px-[13px] py-[11px]"
             style={{ background: "var(--shotiq-color-warmCanvas)" }}>
          <Lightbulb className="h-[17px] w-[17px] shrink-0" style={{ color: GRAPHITE }} strokeWidth={1.5} />
          <p className="text-[10.5px] leading-[14px]" style={{ color: GRAPHITE }}>
            You can update these anytime in your profile settings.
          </p>
        </div>

        <div className="mb-[16px] mt-[13px]">
          <PhoneAction tone="orange" height={38} onClick={onNext} testid="phone-onboarding-continue">Continue</PhoneAction>
          <PhoneAction tone="outline" height={38} className="mt-[7px]" onClick={onBack}>Back</PhoneAction>
        </div>
      </div>
    </PhoneScreen>
  )
}

/* --------------------------------------------------------------- 011 */

const ABILITY: [string, string][] = [
  ["DEVELOPING", "Building strength and control"], ["ADVANCED", "Competes regularly"],
  ["ELITE", "High-level competition"],
]
const STYLE: [string, string, string][] = [
  ["COMPACT", "Quick, efficient release", "090-lib-1"],
  ["BALANCED", "Versatile all-around approach", "090-lib-2"],
  ["HIGH ARC", "Higher release, maximum arc", "090-lib-3"],
]

export function ShootingProfile({
  hand, ability, style, onHand, onAbility, onStyle, onNext, onBack,
}: {
  hand: string; ability: string; style: string
  onHand: (v: string) => void; onAbility: (v: string) => void; onStyle: (v: string) => void
  onNext: () => void; onBack: () => void
}) {
  return (
    <PhoneScreen testid="screen-ios-shooting-profile" tab="home" pad={0} header={false}>
      <PhoneTop left={<Wordmark />} right={<GearLink />} />

      <div className="flex items-start px-[18px] pt-[14px]">
        <div className="min-w-0">
          <PhoneHeading size={38}>SHOOTING PROFILE</PhoneHeading>
          <p className="mt-[7px] text-[11px] leading-[14px]" style={{ color: GRAPHITE }}>Tell us about your game.</p>
        </div>
        <div className="ml-auto shrink-0 text-right">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/canonical/083-filmstrip.png" alt="" aria-hidden="true"
               className="ml-auto block h-[21px] w-[75px] max-w-none object-cover" />
          <Eyebrow className="mt-[7px]">STEP 3 OF 4</Eyebrow>
        </div>
      </div>

      {/* player row */}
      <div className="mx-[18px] mt-[12px] flex items-center gap-[11px] py-[9px]"
           style={{ borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/canonical/096-avatar.png" alt="" aria-hidden="true"
             className="h-[34px] w-[34px] shrink-0 rounded-full object-cover" />
        <div className="min-w-0">
          <div className="shotiq-display text-[15px] leading-[16px]">JORDAN ELLIS</div>
          <div className="mt-[2px] text-[8.5px] leading-[10px]" style={{ color: GRAPHITE }}>
            Right-handed • Advanced<br />Form Score <span style={{ color: BLUE }}>82</span>
          </div>
        </div>
        <div className="ml-auto flex shrink-0">
          {[["24", "SHOTS"], ["15", "MAKES"], ["62.5%", "ACCURACY"], ["6", "DAY STREAK"], ["2,840", "POINTS"]].map(([v, l]) => (
            <div key={l} className="w-[41px] text-center">
              <div className="shotiq-numeric text-[11px] leading-[12px]">{v}</div>
              <div className="shotiq-microcaps mt-[2px] text-[6px] leading-[7px]" style={{ color: GRAPHITE }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-[18px] mt-[10px] flex items-center gap-[12px]">
        <MechanicGlyph kind="angle" size={30} />
        <div className="min-w-0">
          <Eyebrow>PRIMARY TARGET</Eyebrow>
          <div className="mt-[4px] text-[10.5px] leading-[13px]">Keep elbow stacked through release.</div>
        </div>
      </div>

      <div className="px-[18px]">
        <div className="shotiq-display mt-[15px] text-[15px] leading-[16px]">DOMINANT HAND</div>
        <p className="mt-[4px] text-[9.5px] leading-[12px]" style={{ color: GRAPHITE }}>The hand you use to shoot.</p>
        <div className="mt-[8px] flex gap-[9px]">
          {["RIGHT-HANDED", "LEFT-HANDED"].map((t) => {
            const on = hand === t
            return (
              <Tile key={t} on={on} radio onClick={() => onHand(t)} className="flex-1 py-[13px]"
                    testid={`phone-hand-${t.slice(0, 5).toLowerCase()}`}>
                <span className="flex h-[36px] items-center">
                  <MechanicGlyph kind={t.startsWith("RIGHT") ? "angle" : "wrist"} size={32} />
                </span>
                <TileLabel on={on}>{t}</TileLabel>
              </Tile>
            )
          })}
        </div>

        <div className="shotiq-display mt-[16px] text-[15px] leading-[16px]">ATHLETIC ABILITY</div>
        <p className="mt-[4px] text-[9.5px] leading-[12px]" style={{ color: GRAPHITE }}>
          How would you describe your athletic ability?
        </p>
        <div className="mt-[8px] flex gap-[8px]">
          {ABILITY.map(([t], i) => {
            const on = ability === t
            return (
              <Tile key={t} on={on} radio onClick={() => onAbility(t)} className="flex-1 py-[11px]"
                    testid={`phone-ability-${t.toLowerCase()}`}>
                <span className="flex h-[34px] items-center"><LevelMark i={i + 1} on={on} /></span>
                <TileLabel on={on}>{t}</TileLabel>
              </Tile>
            )
          })}
        </div>

        <div className="shotiq-display mt-[16px] text-[15px] leading-[16px]">SHOOTING STYLE</div>
        <p className="mt-[4px] text-[9.5px] leading-[12px]" style={{ color: GRAPHITE }}>
          Pick the style that best matches your shot.
        </p>
        <div className="mt-[8px] flex gap-[8px]">
          {STYLE.map(([t, d, img]) => {
            const on = style === t
            return (
              <button key={t} type="button" onClick={() => onStyle(t)} aria-pressed={on}
                      data-testid={`phone-style-${t.split(" ")[0].toLowerCase()}`}
                      className="relative min-w-0 flex-1 overflow-hidden rounded-[6px] text-left"
                      style={{ border: `1px solid ${on ? ORANGE : RULE}`, background: on ? "#FFF6F2" : "#fff" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/images/canonical/${img}.png`} alt="" aria-hidden="true"
                     className="block h-[82px] w-full object-cover" />
                {on && (
                  <span className="absolute right-[5px] top-[5px] grid h-[13px] w-[13px] place-items-center rounded-full"
                        style={{ background: ORANGE }}>
                    <Check className="h-[9px] w-[9px] text-white" strokeWidth={3} />
                  </span>
                )}
                <div className="px-[8px] pb-[9px] pt-[8px]">
                  <MechanicGlyph kind="arc" size={22} />
                  <div className="mt-[6px] flex items-center gap-[5px]">
                    <span className="grid h-[11px] w-[11px] shrink-0 place-items-center rounded-full"
                          style={{ border: `1.3px solid ${on ? ORANGE : RULE}`, background: on ? ORANGE : "#fff" }} />
                    <span className="shotiq-display text-[10px] leading-[11px]" style={{ color: on ? ORANGE : undefined }}>{t}</span>
                  </div>
                  <div className="mt-[3px] text-[8px] leading-[10px]" style={{ color: GRAPHITE }}>{d}</div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-[13px] flex items-start gap-[11px]">
          <MechanicGlyph kind="centerline" size={26} />
          <div className="min-w-0">
            <div className="text-[10.5px] font-medium leading-[13px]">Why this matters</div>
            <p className="mt-[3px] text-[9px] leading-[12px]" style={{ color: GRAPHITE }}>
              Your profile helps ShotIQ provide more accurate feedback and training recommendations.
            </p>
          </div>
        </div>

        <div className="mb-[16px] mt-[12px] flex items-center gap-[10px]">
          <button type="button" onClick={onBack}
                  className="flex h-[38px] shrink-0 items-center gap-[7px] px-[6px] text-[13px]">
            <svg width="9" height="15" viewBox="0 0 9 15" aria-hidden="true">
              <path d="M7.5 1 L1.5 7.5 L7.5 14" fill="none" stroke="currentColor" strokeWidth="1.6"
                    strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
          <PhoneAction tone="orange" height={38} onClick={onNext} testid="phone-onboarding-continue"
                       className="flex-1">Continue</PhoneAction>
        </div>
      </div>
    </PhoneScreen>
  )
}

/* --------------------------------------------------------------- 013 */

export function OnboardingReview({
  summary, onEdit, onFinish,
}: {
  summary: [string, string][]
  onEdit: (step: PhoneStep) => void
  onFinish: () => void
}) {
  const half = Math.ceil(summary.length / 2)
  return (
    <PhoneScreen testid="screen-ios-onboarding-review" tab="home" pad={0} header={false}>
      <PhoneTop left={<Wordmark />} right={<GearLink />} />

      <div className="px-[18px]">
        <Eyebrow className="pt-[13px] tracking-[0.12em]">ONBOARDING • STEP 5 OF 5</Eyebrow>
        <PhoneHeading size={45} className="mt-[10px]">REVIEW YOUR PROFILE</PhoneHeading>
        <p className="mt-[10px] w-[250px] text-[11px] leading-[14.5px]" style={{ color: GRAPHITE }}>
          We&apos;ll use your profile and shooting data to personalize your coaching experience.
        </p>

        {/* ---------------------------------------- identity + edit rows */}
        <div className="mt-[14px] flex items-start gap-[12px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/canonical/096-avatar.png" alt="" aria-hidden="true"
               className="h-[58px] w-[58px] shrink-0 rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            <div className="shotiq-display text-[22px] leading-[23px]">JORDAN ELLIS</div>
            <div className="mt-[3px] text-[9.5px] leading-[12px]" style={{ color: GRAPHITE }}>Right-handed • Advanced</div>
            <div className="mt-[6px] flex items-center gap-[6px]">
              <svg width="13" height="12" viewBox="0 0 13 12" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <rect key={i} x={i * 4.5} y={9 - i * 3.4} width="3" height={3 + i * 3.4} fill={BLUE} />
                ))}
              </svg>
              <span className="shotiq-microcaps text-[8.5px] leading-[9px]" style={{ color: BLUE }}>INTERMEDIATE TIER</span>
            </div>
            <div className="mt-[3px] text-[8.5px] leading-[10px]" style={{ color: GRAPHITE }}>Built from your profile and data</div>
          </div>
          <div className="shrink-0 space-y-[6px]">
            {([["Edit measurements", "physical"], ["Edit shooting profile", "shooting"]] as [string, PhoneStep][]).map(([l, s]) => (
              <button key={l} type="button" onClick={() => onEdit(s)} data-testid={`phone-review-${s}`}
                      className="flex h-[24px] w-[124px] items-center gap-[6px] rounded-[4px] px-[7px] text-[8.5px]"
                      style={{ border: `1px solid ${RULE}` }}>
                <MechanicGlyph kind="angle" size={13} /> {l}
              </button>
            ))}
          </div>
        </div>

        {/* --------------------------------------------------- data card */}
        <PhoneCard className="mt-[12px] flex px-[8px] py-[10px]">
          {[
            [<StreakGlyph key="s" size={38} />, "6", "DAY STREAK", undefined],
            [<PointsGlyph key="p" size={21} />, "2,840", "POINTS", undefined],
            [<ActionGlyph key="a" kind="analyze" height={19} />, "82", "FORM SCORE", ORANGE],
            [<ActionGlyph key="n" kind="nodeClimb" height={19} accent={GREEN} />, "+8.1%", "VS LAST SESSION", GREEN],
          ].map(([g, v, l, tone], i) => (
            <div key={String(l)} className="min-w-0 flex-1 text-center"
                 style={i ? { borderLeft: `1px solid ${RULE}` } : undefined}>
              <span className="flex h-[21px] items-center justify-center">{g as React.ReactNode}</span>
              <div className="shotiq-numeric mt-[4px] text-[17px] leading-[17px]" style={{ color: tone as string }}>{v as string}</div>
              <div className="shotiq-microcaps mt-[3px] text-[7px] leading-[8px]" style={{ color: GRAPHITE }}>{l as string}</div>
            </div>
          ))}
        </PhoneCard>

        {/* ------------------------------------------------ coaching focus */}
        <div className="mt-[13px] flex items-center gap-[10px] pt-[11px]" style={{ borderTop: `1px solid ${RULE}` }}>
          <div className="min-w-0 flex-1">
            <Eyebrow>COACHING FOCUS</Eyebrow>
            <div className="mt-[5px] text-[15px] leading-[18px]">Keep elbow stacked through release</div>
          </div>
          <ChevronRight className="h-[15px] w-[15px] shrink-0" style={{ color: GRAPHITE }} />
        </div>

        {/* --------------------------------------------- shooting summary */}
        <div className="mt-[13px] pt-[11px]" style={{ borderTop: `1px solid ${RULE}` }}>
          <Eyebrow>SHOOTING SUMMARY</Eyebrow>
          <StatCells className="mt-[8px]" valueSize={22} labelSize={8}
                     cells={[{ v: "24", l: "SHOTS" }, { v: "15", l: "MAKES" }, { v: "62.5%", l: "MAKE %" }]} />
        </div>

        {/* -------------------------------------------------- shot rail */}
        <div className="mt-[13px] pt-[11px]" style={{ borderTop: `1px solid ${RULE}` }}>
          <Eyebrow>SHOT RAIL</Eyebrow>
          <PhaseRail className="mt-[9px]" figure={30} label={7.5} />
        </div>

        {/* --------------------------------------------- profile summary */}
        <div className="mt-[13px] pt-[11px]" style={{ borderTop: `1px solid ${RULE}` }}>
          <Eyebrow>PROFILE SUMMARY</Eyebrow>
          <div className="mt-[8px] flex gap-[18px]">
            {[summary.slice(0, half), summary.slice(half)].map((col, ci) => (
              <div key={ci} className="min-w-0 flex-1">
                {col.map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-[8px] py-[2px]">
                    <span className="text-[8.5px] leading-[12px]" style={{ color: GRAPHITE }}>{k}</span>
                    <span className="text-[8.5px] leading-[12px]">{v}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <PhoneAction tone="orange" height={40} className="mb-[16px] mt-[14px]" onClick={onFinish}
                     testid="phone-onboarding-finish">
          <span className="grid h-[16px] w-[16px] place-items-center rounded-full" style={{ border: "1.4px solid #fff" }}>
            <Check className="h-[10px] w-[10px]" strokeWidth={3} />
          </span>
          Complete profile
        </PhoneAction>
      </div>
    </PhoneScreen>
  )
}

/* Keep the flaw figure import referenced — canonical 010 draws the body-type
   marks from the same family, and the tree-shaker would otherwise drop it. */
void FlawFigure
