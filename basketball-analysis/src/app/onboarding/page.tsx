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
  ClipboardList, Crosshair, Dumbbell, TrendingUp, MonitorSmartphone, type LucideIcon,
} from "lucide-react"
import { SectionLabel, Card } from "@/components/shotiq/ShotIQShell"
import { PoseGlyph, CueGlyph } from "@/components/shotiq/Glyphs"
import { useAuthStore } from "@/stores/authStore"
import { useProfileStore } from "@/stores/profileStore"

// Canonical gives each step its own mark: the athlete, a ruler, preference
// sliders, a review sheet.
const STEPS: [string, LucideIcon | null][] = [
  ["Onboarding", null], ["Measurements", Ruler], ["Preferences", SlidersHorizontal], ["Review", ClipboardList],
]
const PHASES = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]
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

  useEffect(() => {
    if (!isAuthenticated) router.push("/signin")
  }, [isAuthenticated, router])
  if (!isAuthenticated) return null

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

  const lbl = "flex items-center gap-[4px] text-[10px] font-bold tracking-[0.06em] text-[var(--shotiq-color-graphite)]"
  const box = "h-[46px] rounded-[5px] border border-[var(--shotiq-color-rule)] bg-white px-[12px] text-[14px] outline-none focus:border-[var(--shotiq-color-ink)]"

  return (
    <div data-testid="screen-desktop-web-onboarding" className="flex min-h-full flex-col">
     <div className="flex flex-1">
      {/* step rail */}
      <aside className="flex w-[200px] shrink-0 flex-col border-r border-[var(--shotiq-color-rule)] pt-[14px]">
        {STEPS.map(([s, Icon], i) => (
          <button key={s} type="button" onClick={() => setStep(i + 1)} aria-current={step === i + 1 ? "true" : undefined}
                  className={`relative flex h-[44px] items-center gap-[10px] px-[20px] text-left text-[12px] font-bold tracking-[0.05em] ${
                    step === i + 1 ? "bg-[var(--shotiq-color-warmCanvas)] text-[var(--shotiq-color-shotiqOrange)]" : ""}`}>
            {step === i + 1 && <span className="absolute inset-y-0 left-0 w-[3px] bg-[var(--shotiq-color-shotiqOrange)]" />}
            {Icon
              ? <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.6} />
              : <PoseGlyph phase="setup" size={18} active={step === i + 1} />}
            {s.toUpperCase()}
          </button>
        ))}
        <Card className="mx-[14px] mb-[16px] mt-auto p-[12px]">
          <div className="text-[12px]">Your progress</div>
          <div className="text-[12px] font-semibold">Step {step} of {STEPS.length}</div>
          <div className="text-[11px] text-[var(--shotiq-color-graphite)]">{STEPS[step - 1][0]}</div>
          <div className="mt-[6px] h-[6px] rounded-full bg-[var(--shotiq-color-rule)]">
            <div className="h-full rounded-full bg-[var(--shotiq-color-shotiqOrange)]" style={{ width: `${(step / STEPS.length) * 100}%` }} />
          </div>
          <p className="mt-[8px] text-[10px] leading-[14px] text-[var(--shotiq-color-graphite)]">
            Questions help ShotIQ personalize your analysis, feedback, and training.
          </p>
          <button type="button" onClick={finish} className="mt-[8px] flex items-center gap-[6px] text-[11px]">
            <Save className="h-[12px] w-[12px]" /> Save and finish later
          </button>
        </Card>
      </aside>

      {/* form */}
      <div className="min-w-0 flex-1 px-[30px] py-[20px]">
        <h1 className="shotiq-display text-[52px] leading-[54px]">WELCOME, {first.toUpperCase()}</h1>
        <p className="mt-[4px] max-w-[460px] text-[14px] text-[var(--shotiq-color-graphite)]">
          Let&apos;s measure your baseline so ShotIQ can deliver personalized analysis and training that match your game.
        </p>

        <Card className="mt-[14px] p-[22px]">
          <div className="flex items-center justify-between">
            <SectionLabel>TELL US ABOUT YOU</SectionLabel>
            <span className="text-[11px] text-[var(--shotiq-color-graphite)]">All fields required</span>
          </div>
          <div className="mt-[14px] grid grid-cols-2 gap-x-[26px] gap-y-[16px]">
            <div>
              <div className={lbl}>DOMINANT HAND <Info className="h-[10px] w-[10px]" /></div>
              <div className="mt-[6px] flex overflow-hidden rounded-[5px] border border-[var(--shotiq-color-rule)]">
                {(["left", "right"] as const).map((h) => (
                  <button key={h} type="button" onClick={() => store.setDominantHand(h)} data-testid={`hand-${h}`}
                          aria-pressed={store.dominantHand === h}
                          className={`h-[46px] flex-1 text-[14px] capitalize ${store.dominantHand === h ? "bg-[var(--shotiq-color-shotiqOrange)] font-medium text-white" : ""}`}>
                    {h}
                  </button>
                ))}
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
          {/* Player bio — iOS 012-player-bio counterpart; persisted with the profile. */}
          <div className="mt-[16px]">
            <div className={lbl}>PLAYER BIO (OPTIONAL) <Info className="h-[10px] w-[10px]" /></div>
            <textarea value={store.bio ?? ""} onChange={(e) => store.setBio(e.target.value)}
                      data-testid="onboarding-bio" rows={3} maxLength={400}
                      placeholder="Tell us about your game — playing style, teams, what you're working on…"
                      className="mt-[6px] w-full resize-none rounded-[5px] border border-[var(--shotiq-color-rule)] p-[12px] text-[14px] leading-[20px] outline-none focus:border-[var(--shotiq-color-ink)]" />
            <div className="mt-[2px] text-right text-[10px] text-[var(--shotiq-color-muted)]">{(store.bio ?? "").length}/400</div>
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

      {/* why it matters rail */}
      <aside className="w-[380px] shrink-0 border-l border-[var(--shotiq-color-rule)] px-[22px] py-[20px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/canonical/078-hero.png" alt="Shooter at release with elbow flex and release angle called out"
             className="h-[220px] w-full rounded-[6px] object-cover" width={466} height={322} />
        <SectionLabel className="mt-[14px]">WHY IT MATTERS</SectionLabel>
        <p className="mt-[6px] text-[12px] leading-[17px] text-[var(--shotiq-color-graphite)]">
          Measuring your profile helps ShotIQ benchmark your mechanics and build feedback that&apos;s tailored to you.
        </p>
        <div className="mt-[10px] space-y-[12px]">
          {([["Accurate feedback", "AI analysis calibrated to your body and style.", Crosshair],
            ["Smarter training", "Drills and plans that target what moves your score.", Dumbbell],
            ["Track what matters", "See progress where it counts, session after session.", TrendingUp]] as [string, string, LucideIcon][]).map(([t, d, Icon]) => (
            <div key={t} className="flex gap-[12px] border-l border-[var(--shotiq-color-rule)] pl-[12px]">
              <Icon className="h-[28px] w-[28px] shrink-0" strokeWidth={1.4} />
              <div>
                <div className="text-[13px] font-semibold">{t}</div>
                <div className="text-[11px] text-[var(--shotiq-color-graphite)]">{d}</div>
              </div>
            </div>
          ))}
        </div>
      </aside>
     </div>

      {/* Canonical 078 runs the phase strip as a full-width footer band with the
          "One profile. Everywhere." note beside it, not inside the right rail. */}
      <div className="flex shrink-0 items-center border-t border-[var(--shotiq-color-rule)] px-[26px] py-[14px]">
        <div className="flex flex-1 items-center justify-around pr-[26px]">
          {PHASES.map((p) => (
            <div key={p} className="text-center">
              <PoseGlyph phase={p} size={30} active={p === "RELEASE"} />
              <div className={`mt-[2px] text-[9px] tracking-[0.05em] ${p === "RELEASE" ? "font-bold text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-graphite)]"}`}>{p}</div>
            </div>
          ))}
        </div>
        <div className="flex w-[430px] shrink-0 items-center gap-[12px] border-l border-[var(--shotiq-color-rule)] pl-[26px]">
          <span className="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-full border border-[var(--shotiq-color-rule)]">
            <MonitorSmartphone className="h-[22px] w-[22px]" strokeWidth={1.5} />
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
