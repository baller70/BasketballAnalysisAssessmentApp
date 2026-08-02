"use client"

/**
 * /onboarding — canonical 078-web-onboarding.
 *
 * Preserved domain flow: writes through useProfileStore's typed setters and
 * persists with completeProfile() + saveProfile() (CSRF-protected POST
 * /api/profile; owner derived server-side from the session cookie), exactly
 * as the previous ProfileWizard implementation did.
 */

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft, ChevronDown, ArrowRight, Save, Info, Ruler, SlidersHorizontal,
  ClipboardList, type LucideIcon,
} from "lucide-react"
import { SectionLabel, Card } from "@/components/shotiq/ShotIQShell"
import { PoseGlyph, CueGlyph, type ShotPhase } from "@/components/shotiq/Glyphs"
import { useAuthStore } from "@/stores/authStore"
import { useProfileStore } from "@/stores/profileStore"

// Canonical gives each step its own mark: the athlete, a ruler, preference
// sliders, a review sheet.
const STEPS: [string, LucideIcon | null][] = [
  ["Onboarding", null], ["Measurements", Ruler], ["Preferences", SlidersHorizontal], ["Review", ClipboardList],
]
const PHASES = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]
// Canonical gives each benefit its own pose figure rather than a generic icon.
const BENEFITS: [string, string, ShotPhase][] = [
  ["Accurate feedback", "AI analysis calibrated to your body and style.", "setup"],
  ["Smarter training", "Drills and plans that target what moves your score.", "rise"],
  ["Track what matters", "See progress where it counts, session after session.", "follow"],
]
const GOALS = [
  "Keep elbow stacked through release", "Raise make percentage", "Quicker release",
  "Better balance and footwork",
]

export default function OnboardingPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const store = useProfileStore()
  const [step, setStep] = useState(1)
  const [years, setYears] = useState("10+ years")
  const [position, setPosition] = useState("guard")
  const [goal, setGoal] = useState(GOALS[0])
  const [saving, setSaving] = useState(false)

  // On a hard load the persisted auth store can still be rehydrating when this
  // effect first runs, so a signed-in user read as signed-out and got bounced
  // to /signin — which the middleware then forwarded to the dashboard, leaving
  // /onboarding unreachable. Re-read the store once before redirecting.
  const [signedOut, setSignedOut] = useState(false)
  useEffect(() => {
    if (isAuthenticated) { setSignedOut(false); return }
    const t = setTimeout(() => {
      if (useAuthStore.getState().isAuthenticated) return
      setSignedOut(true)
      router.push("/signin")
    }, 250)
    return () => clearTimeout(t)
  }, [isAuthenticated, router])
  if (signedOut) return null

  const first = (user?.firstName || user?.displayName || "Shooter").split(" ")[0]
  const h = store.heightInches ?? 74
  const ft = Math.floor(h / 12), inch = h % 12

  const finish = async () => {
    setSaving(true)
    // Preserved completion flow (client cache -> server source of truth).
    store.completeProfile()
    useAuthStore.getState().setProfileComplete(true)
    const saved = await useProfileStore.getState().saveProfile()
    if (!saved) console.error("Failed to save profile to server")
    window.location.assign("/dashboard")
  }
  const next = () => (step < STEPS.length ? setStep(step + 1) : finish())

  // Canonical reports the step being worked, not the tab being viewed: the
  // welcome form is already behind you, so the flow reads "Step 2 of 4 —
  // Measurements" while this card is on screen.
  const progressStep = Math.min(step + 1, STEPS.length)
  const progressName = STEPS[Math.min(step, STEPS.length - 1)][0]

  const lbl = "flex items-center gap-[4px] text-[10px] font-bold tracking-[0.06em] text-[var(--shotiq-color-graphite)]"
  const box = "h-[46px] rounded-[5px] border border-[var(--shotiq-color-rule)] bg-white px-[12px] text-[14px] outline-none focus:border-[var(--shotiq-color-ink)]"

  return (
    <div data-testid="screen-desktop-web-onboarding" className="flex min-h-full flex-col">
     <div className="flex flex-1">
      {/* form — the wizard steps ride a horizontal bar above the card rather
          than a second vertical rail stacked on the app rail, which cost the
          form and the WHY IT MATTERS hero ~200px of width between them. */}
      <div className="min-w-0 flex-1 px-[30px] py-[18px]">
        <h1 className="shotiq-display text-[52px] leading-[54px]">WELCOME, {first.toUpperCase()}</h1>
        <p className="mt-[4px] max-w-[560px] text-[14px] text-[var(--shotiq-color-graphite)]">
          Let&apos;s measure your baseline so ShotIQ can deliver personalized analysis and training that match your game.
        </p>

        <div className="mt-[12px] flex items-end gap-[26px] border-b border-[var(--shotiq-color-rule)]">
          {STEPS.map(([s, Icon], i) => (
            <button key={s} type="button" onClick={() => setStep(i + 1)} aria-current={step === i + 1 ? "true" : undefined}
                    className={`relative flex items-center gap-[8px] pb-[9px] text-[12px] font-bold tracking-[0.05em] ${
                      step === i + 1 ? "text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-graphite)]"}`}>
              {Icon
                ? <Icon className="h-[16px] w-[16px] shrink-0" strokeWidth={1.6} />
                : <PoseGlyph phase="setup" size={16} active={step === i + 1} />}
              {s.toUpperCase()}
              {step === i + 1 && <span className="absolute inset-x-0 bottom-0 h-[3px] bg-[var(--shotiq-color-shotiqOrange)]" />}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-[10px] pb-[8px]">
            <span className="text-[11px] text-[var(--shotiq-color-graphite)]">Step {progressStep} of {STEPS.length}</span>
            <span className="block h-[6px] w-[120px] rounded-full bg-[var(--shotiq-color-rule)]">
              <span className="block h-full rounded-full bg-[var(--shotiq-color-shotiqOrange)]"
                    style={{ width: `${(progressStep / STEPS.length) * 100}%` }} />
            </span>
          </div>
        </div>

        <Card className="mt-[14px] p-[22px]">
          <div className="flex items-center justify-between">
            <SectionLabel>TELL US ABOUT YOU</SectionLabel>
            <span className="text-[11px] text-[var(--shotiq-color-graphite)]">All fields required</span>
          </div>
          <div className="mt-[14px] grid grid-cols-2 gap-x-[26px] gap-y-[16px]">
            <div>
              <div className={lbl}>DOMINANT HAND <Info className="h-[10px] w-[10px]" /></div>
              <div className="mt-[6px] flex overflow-hidden rounded-[5px] border border-[var(--shotiq-color-rule)]">
                {(["left", "right"] as const).map((hnd) => {
                  // Canonical ships this control already answered (Right filled);
                  // an unset store used to leave both halves blank.
                  const on = (store.dominantHand ?? "right") === hnd
                  return (
                    <button key={hnd} type="button" onClick={() => store.setDominantHand(hnd)} data-testid={`hand-${hnd}`}
                            aria-pressed={on}
                            className={`h-[46px] flex-1 text-[14px] capitalize ${on ? "bg-[var(--shotiq-color-shotiqOrange)] font-medium text-white" : ""}`}>
                      {hnd}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <div className={lbl}>PLAYING LEVEL <Info className="h-[10px] w-[10px]" /></div>
              <div className="relative mt-[6px]">
                <select value={store.experienceLevel ?? "advanced"}
                        onChange={(e) => store.setExperienceLevel(e.target.value as never)}
                        className={`${box} w-full appearance-none capitalize`}>
                  {["beginner", "intermediate", "advanced", "professional"].map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-[12px] top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-[var(--shotiq-color-graphite)]" />
              </div>
            </div>
            <div>
              <div className={lbl}>POSITION <Info className="h-[10px] w-[10px]" /></div>
              <div className="relative mt-[6px]">
                <select value={position} onChange={(e) => setPosition(e.target.value)}
                        className={`${box} w-full appearance-none capitalize`}>
                  {["guard", "wing", "forward", "center"].map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-[12px] top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-[var(--shotiq-color-graphite)]" />
              </div>
            </div>
            <div>
              <div className={lbl}>YEARS PLAYING <Info className="h-[10px] w-[10px]" /></div>
              <div className="relative mt-[6px]">
                <select value={years} onChange={(e) => setYears(e.target.value)} className={`${box} w-full appearance-none`}>
                  {["0–2 years", "3–5 years", "6–9 years", "10+ years"].map((o) => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-[12px] top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-[var(--shotiq-color-graphite)]" />
              </div>
            </div>
            <div>
              <div className={lbl}>HEIGHT <Info className="h-[10px] w-[10px]" /></div>
              <div className="mt-[6px] flex gap-[8px]">
                <div className={`${box} flex flex-1 items-center justify-between`}>
                  <input type="number" value={ft} data-testid="height-ft"
                         onChange={(e) => store.setHeight((+e.target.value || 0) * 12 + inch)}
                         className="w-[46px] outline-none" />
                  <span className="text-[12px] text-[var(--shotiq-color-graphite)]">ft</span>
                </div>
                <div className={`${box} flex flex-1 items-center justify-between`}>
                  <input type="number" value={inch}
                         onChange={(e) => store.setHeight(ft * 12 + (+e.target.value || 0))}
                         className="w-[46px] outline-none" />
                  <span className="text-[12px] text-[var(--shotiq-color-graphite)]">in</span>
                </div>
              </div>
            </div>
            <div>
              <div className={lbl}>WEIGHT <Info className="h-[10px] w-[10px]" /></div>
              <div className={`${box} mt-[6px] flex items-center justify-between`}>
                <input type="number" value={store.weightLbs ?? 185}
                       onChange={(e) => store.setWeight(+e.target.value || 0)} className="w-[80px] outline-none" />
                <span className="text-[12px] text-[var(--shotiq-color-graphite)]">lbs</span>
              </div>
            </div>
          </div>
          <div className="mt-[16px]">
            <div className={lbl}>PRIMARY GOAL (CHOOSE ONE) <Info className="h-[10px] w-[10px]" /></div>
            <div className="relative mt-[6px]">
              <div className={`${box} flex w-full items-center gap-[12px]`}>
                <CueGlyph kind="peak" size={24} accent="var(--shotiq-color-shotiqOrange)" />
                <select value={goal} onChange={(e) => setGoal(e.target.value)}
                        className="h-full flex-1 appearance-none bg-transparent outline-none">
                  {GOALS.map((g) => <option key={g}>{g}</option>)}
                </select>
                <ChevronDown className="pointer-events-none h-[14px] w-[14px] text-[var(--shotiq-color-graphite)]" />
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-[14px] flex items-center justify-between">
          <button type="button" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}
                  className="flex h-[44px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[16px] text-[14px] disabled:opacity-40">
            <ChevronLeft className="h-[14px] w-[14px]" /> Back
          </button>
          <div className="flex items-center gap-[16px]">
            <button type="button" onClick={finish} className="flex items-center gap-[6px] text-[13px]">
              <Save className="h-[13px] w-[13px]" /> Save and finish later
            </button>
            <button type="button" onClick={next} disabled={saving} data-testid="onboarding-continue"
                    className="flex h-[46px] items-center gap-[10px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] px-[24px] text-[14px] font-medium text-white disabled:opacity-60">
              {step === STEPS.length ? (saving ? "Saving…" : "Finish") : "Continue"} <ArrowRight className="h-[15px] w-[15px]" />
            </button>
          </div>
        </div>

      </div>

      {/* why it matters rail — canonical draws the hero and the copy inside one
          bordered container, not loose on the paper. */}
      <aside className="w-[430px] shrink-0 border-l border-[var(--shotiq-color-rule)] px-[22px] py-[20px]">
        <Card className="overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/canonical/078-hero.png" alt="Shooter at release with elbow flex and release angle called out"
               className="h-[300px] w-full object-cover" width={466} height={322} />
          <div className="border-t border-[var(--shotiq-color-rule)] px-[18px] py-[14px]">
            <SectionLabel>WHY IT MATTERS</SectionLabel>
            <p className="mt-[6px] text-[12px] leading-[17px] text-[var(--shotiq-color-graphite)]">
              Measuring your profile helps ShotIQ benchmark your mechanics and build feedback that&apos;s tailored to you.
            </p>
            <div className="mt-[10px] space-y-[12px]">
              {BENEFITS.map(([t, d, pose]) => (
                <div key={t} className="flex items-start gap-[12px] border-l border-[var(--shotiq-color-rule)] pl-[12px]">
                  <PoseGlyph phase={pose} size={30} className="shrink-0" />
                  <div>
                    <div className="text-[13px] font-semibold">{t}</div>
                    <div className="text-[11px] text-[var(--shotiq-color-graphite)]">{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
          {/* Canonical's "Your progress" card — the flow position, the step it
              names, its bar, why the questions are asked, and the escape hatch. */}
          <Card data-testid="onboarding-progress" className="mt-[14px] p-[16px]">
            <div className="text-[13px]">Your progress</div>
            <div className="mt-[4px] text-[12px] text-[var(--shotiq-color-graphite)]">
              Step {progressStep} of {STEPS.length}
            </div>
            <div className="mt-[2px] text-[13px] font-semibold">{progressName}</div>
            <div className="mt-[8px] h-[6px] rounded-full bg-[var(--shotiq-color-rule)]">
              <div className="h-full rounded-full bg-[var(--shotiq-color-shotiqOrange)]"
                   style={{ width: `${(progressStep / STEPS.length) * 100}%` }} />
            </div>
            <p className="mt-[10px] text-[12px] leading-[17px] text-[var(--shotiq-color-graphite)]">
              Questions help ShotIQ personalize your analysis, feedback, and training.
            </p>
            <button type="button" onClick={finish}
                    className="mt-[12px] flex items-center gap-[8px] border-t border-[var(--shotiq-color-rule)] pt-[12px] text-[13px]">
              <Save className="h-[14px] w-[14px]" /> Save and finish later
            </button>
          </Card>
      </aside>
     </div>

      {/* Canonical 078 runs the phase strip as a full-width footer band with the
          "One profile. Everywhere." note beside it, not inside the right rail. */}
      <div className="flex shrink-0 items-center border-t border-[var(--shotiq-color-rule)] px-[26px] py-[14px]">
        {/* Canonical threads a dotted connector track with a stage dot per phase
            between the figures and their labels. */}
        <div className="grid flex-1 pr-[26px]" style={{ gridTemplateColumns: `repeat(${PHASES.length}, minmax(0, 1fr))` }}>
          {PHASES.map((p) => (
            <div key={p} className="flex flex-col items-center">
              <PoseGlyph phase={p} size={30} active={p === "RELEASE"} />
            </div>
          ))}
          {PHASES.map((p, i) => (
            <div key={`t-${p}`} className="relative flex h-[12px] items-center justify-center">
              {i > 0 && <span className="absolute right-1/2 top-1/2 w-full border-t border-dotted border-[var(--shotiq-color-rule)]" />}
              {i < PHASES.length - 1 && <span className="absolute left-1/2 top-1/2 w-full border-t border-dotted border-[var(--shotiq-color-rule)]" />}
              <span className={`relative h-[6px] w-[6px] rounded-full ${p === "RELEASE" ? "bg-[var(--shotiq-color-shotiqOrange)]" : "bg-[var(--shotiq-color-graphite)]"}`} />
            </div>
          ))}
          {PHASES.map((p) => (
            <div key={`l-${p}`} className={`text-center text-[9px] tracking-[0.05em] ${p === "RELEASE" ? "font-bold text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-graphite)]"}`}>{p}</div>
          ))}
        </div>
        <div className="flex w-[430px] shrink-0 items-center gap-[12px] border-l border-[var(--shotiq-color-rule)] pl-[26px]">
          <span className="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-full border border-[var(--shotiq-color-rule)]">
            <CueGlyph kind="tree" size={24} accent="var(--shotiq-color-shotiqOrange)" />
          </span>
          <p className="text-[11px] leading-[15px] text-[var(--shotiq-color-graphite)]">
            <span className="font-semibold text-[var(--shotiq-color-ink)]">One profile. Everywhere.</span><br />
            Your profile, captures, analyses, training, goals, media, points, and settings sync across web and iOS.
          </p>
        </div>
      </div>
    </div>
  )
}
