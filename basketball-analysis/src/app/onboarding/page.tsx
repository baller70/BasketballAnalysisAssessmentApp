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
  ClipboardList, PenLine, type LucideIcon,
} from "lucide-react"
import { SectionLabel, Card, PageTitle } from "@/components/shotiq/ShotIQShell"
import { PoseFigure } from "@/components/shotiq/Glyphs"
import { useAuthStore } from "@/stores/authStore"
import { useProfileStore } from "@/stores/profileStore"
import { PlayerBio } from "@/components/shotiq/phone/PlayerBio"
import {
  OnboardingIntro, PhysicalProfile, ExperienceBodyType, ShootingProfile,
  OnboardingReview, PHONE_STEPS, type PhoneStep,
} from "@/components/shotiq/phone/OnboardingPhone"

// Canonical gives each step its own mark: the athlete, a ruler, preference
// sliders, a review sheet.
/* Canonical onboarding runs a PLAYER BIO step (iOS 012) between the
   preference questions and the review sheet. It was missing from this build
   entirely — no bio field, label or control existed — so the step is added
   here rather than as a duplicate page, and the phone layout for it is
   `PlayerBio`. */
const STEPS: [string, LucideIcon | null][] = [
  ["Onboarding", null], ["Measurements", Ruler], ["Preferences", SlidersHorizontal],
  ["Bio", PenLine], ["Review", ClipboardList],
]
const PHASES = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]
// Canonical gives each benefit its own figure — three poses that appear nowhere
// else, cropped out of 078 rather than approximated.
const BENEFITS: [string, string, string][] = [
  ["Accurate feedback", "AI analysis calibrated to your body and style.", "078-benefit-1"],
  ["Smarter training", "Drills and plans that target what moves your score.", "078-benefit-2"],
  ["Track what matters", "See progress where it counts, session after session.", "078-benefit-3"],
]
// Canonical 078 opens the flow; steps 2-4 follow the iOS onboarding screens
// this wizard shares a profile with (009 physical profile, 010 experience and
// body type, 011 shooting profile, 013 review).
const TITLES = ["WELCOME, {FIRST}", "YOUR MEASUREMENTS", "SHOOTING PREFERENCES", "YOUR PLAYER BIO", "REVIEW YOUR PROFILE"]
const SUBTITLES = [
  "Let's measure your baseline so ShotIQ can deliver personalized analysis and training that match your game.",
  "Accurate measurements let the analysis scale angles, release height and arc to your body.",
  "How you shoot decides which mechanics ShotIQ grades you against and which drills it prescribes.",
  "A short bio for your player card. Write it yourself or let ShotIQ draft one from your profile.",
  "We'll use your profile and shooting data to personalize your coaching experience.",
]
const CARD_HEADINGS = ["TELL US ABOUT YOU", "PHYSICAL PROFILE", "YOUR SHOOTING PROFILE", "ABOUT YOUR GAME", "PROFILE SUMMARY"]
const CARD_NOTES = ["All fields required", "Without shoes", "Pick what matches your shot",
                    "Optional — 160 characters", "You can change any of this later"]

// iOS 010 — the three builds the profile store models.
const BODY_TYPES: [string, string, "ectomorph" | "mesomorph" | "endomorph"][] = [
  ["SLIM / LEAN", "Light frame, longer limbs", "ectomorph"],
  ["ATHLETIC", "Balanced build, muscular", "mesomorph"],
  ["STOCKY / STRONG", "Solid build, powerful frame", "endomorph"],
]
// iOS 011 — athletic ability is stored on the 1-10 scale the profile uses.
const ABILITIES: [string, string, number][] = [
  ["DEVELOPING", "Building strength and control", 4],
  ["ADVANCED", "Competes regularly", 7],
  ["ELITE", "High-level competition", 9],
]
// iOS 011 shooting style, in the profile store's vocabulary.
const STYLES: [string, string, "one_motion" | "two_motion" | "set_shot"][] = [
  ["COMPACT", "Quick, efficient release", "one_motion"],
  ["BALANCED", "Versatile all-around approach", "two_motion"],
  ["HIGH ARC", "Higher release, maximum arc", "set_shot"],
]
const PRACTICE = ["1–2 times per week", "3–5 times per week", "6+ times per week"]

type Summary = Record<string, string>
/** Two columns of review rows: [label, value, step that edits it]. */
const REVIEW_COLUMNS = (s: Summary): [string, string, number][][] => [
  [["Shooting hand", s.hand, 1], ["Experience level", s.level, 1], ["Primary position", s.position, 1],
   ["Years playing", s.years, 1], ["Height", s.height, 1], ["Weight", s.weight, 1]],
  [["Age", s.age, 2], ["Wingspan", s.wingspan, 2], ["Body type", s.body, 2],
   ["Athletic ability", s.ability, 3], ["Shooting style", s.style, 3], ["Practice frequency", s.practice, 3],
   ["Training goal", s.goal, 3], ["Player bio", s.bio, 4]],
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
  const [bio, setBio] = useState("")
  const [enhanced, setEnhanced] = useState("")
  const [saving, setSaving] = useState(false)
  // Practice cadence has no profile-store field yet, so it lives here beside
  // the other two screen-local answers (position, years).
  const [practice, setPractice] = useState("3–5 times per week")

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
  const ws = store.wingspanInches ?? 79
  const wsFt = Math.floor(ws / 12), wsIn = ws % 12
  const titleCase = (v: string) => v.charAt(0).toUpperCase() + v.slice(1)

  // What step 4 reads back — every answer the four steps collect, each with the
  // step that owns it so "Edit" goes straight there (iOS 013).
  const summary = {
    hand: titleCase(store.dominantHand ?? "right"),
    level: titleCase(store.experienceLevel ?? "advanced"),
    position: titleCase(position),
    years,
    height: `${ft}' ${inch}"`,
    weight: `${store.weightLbs ?? 185} lbs`,
    age: `${store.age ?? 24}`,
    wingspan: `${wsFt}' ${wsIn}"`,
    body: BODY_TYPES.find(([, , v]) => v === (store.bodyType ?? "mesomorph"))?.[0] ?? "—",
    ability: ABILITIES.find(([, , v]) => v === (store.athleticAbility ?? 7))?.[0] ?? "—",
    style: STYLES.find(([, , v]) => v === (store.shootingStyle ?? "two_motion"))?.[0] ?? "—",
    practice,
    goal,
    bio: bio.trim() ? `${bio.trim().slice(0, 22)}${bio.trim().length > 22 ? "…" : ""}` : "Not added",
  }

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

  /* Canonical's field labels are cap 13 over a 101px advance for DOMINANT HAND
     and 97px for PLAYING LEVEL. The role's 12px default drew cap 10 over 89 and
     80 — 23% short. Raising the size alone would carry the advance to ~116, so
     the tracking comes down with it; both are pinned through custom properties
     because the role rule is declared after Tailwind's utility layer and would
     otherwise discard a bare `text-[16px]`/`tracking-[…]` here. */
  const lbl = "flex items-center gap-[4px] shotiq-microcaps text-[var(--shotiq-color-graphite)]"
  const lblVars = { "--shotiq-microcaps-size": "16px",
                    "--shotiq-microcaps-tracking": "0.075em",
                    "--shotiq-microcaps-word-spacing": "0.12em" } as React.CSSProperties
  const box = "h-[46px] rounded-[5px] border border-[var(--shotiq-color-rule)] bg-white px-[12px] text-[14px] outline-none focus:border-[var(--shotiq-color-ink)]"

  /* Canonical iOS 012 draws the BIO step as its own full phone screen; the
     1440pt wizard keeps the step in its card column, so the phone layout is
     the only thing swapped in below the md breakpoint. */
  const BIO_STEP = STEPS.findIndex(([n]) => n === "Bio") + 1
  // Phone viewport, tracked live (the phone bio screen is a portal, so CSS
  // breakpoints on its wrapper do not reach it).
  const [isPhone, setIsPhone] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const sync = () => setIsPhone(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])
  const enhanceBio = () =>
    setEnhanced(
      `${first} is a ${(store.experienceLevel ?? "advanced")} ${position} who trains to `
      + `${goal.toLowerCase()}. ${practice} in the gym, tracking every rep with ShotIQ.`,
    )

  /* Canonical splits this ONE desktop wizard into SIX phone designs — 008
     intro, 009 physical profile, 010 experience and body type, 011 shooting
     profile, 012 bio and 013 review. They answer the same profile store the
     desktop wizard writes, but they are not the desktop wizard's steps: the
     phone sequence numbers its five answering steps 1..5 exactly as canonical
     labels 012 ("4 OF 5") and 013 ("STEP 5 OF 5") do.

     Reachable two ways, so a person and the harness take the same path: the
     intro's "Build my player profile" walks Continue -> Continue -> …, and
     every surface owns a `?step=` the flow writes back into the URL, so it is
     also a deep link. `window.location` rather than `useSearchParams` because
     this page prerenders and `useSearchParams` would force it dynamic. */
  const [phoneStep, setPhoneStep] = useState<PhoneStep>("intro")
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("step")
    if (q && (PHONE_STEPS as readonly string[]).includes(q)) setPhoneStep(q as PhoneStep)
  }, [])
  const goPhone = (s: PhoneStep) => {
    setPhoneStep(s)
    const u = new URL(window.location.href)
    u.searchParams.set("step", s)
    window.history.replaceState(null, "", u.toString())
  }
  const phoneSummary: [string, string][] = [
    ["Shooting Hand", summary.hand], ["Experience Level", summary.level],
    ["Primary Position", summary.position], ["Height", summary.height],
    ["Wingspan", summary.wingspan], ["Body Type", summary.body],
    ["Practice Frequency", practice], ["Training Goal", goal],
  ]

  return (
    <>
    {/* PhoneScreen portals into document.body, so a `md:hidden` wrapper cannot
        hide it — at 1440 the phone screens painted themselves over the desktop
        wizard and swallowed every click on it. The phone layout is gated on the
        viewport itself instead. */}
    {isPhone && (
      <div className="md:hidden">
        {phoneStep === "intro" && (
          <OnboardingIntro name={first} onStart={() => goPhone("physical")}
                           onSkip={() => goPhone("review")} onSignOut={finish} />
        )}
        {phoneStep === "physical" && (
          <PhysicalProfile
            age={String(store.age ?? 24)}
            height={`${ft}' ${inch}"`}
            weight={String(store.weightLbs ?? 190)}
            wingspan={`${wsFt}' ${wsIn}"`}
            onAge={(v) => store.setAge(parseInt(v, 10) || 0)}
            onHeight={(v) => { const m = v.match(/(\d+)\D+(\d+)/); if (m) store.setHeight(+m[1] * 12 + +m[2]) }}
            onWeight={(v) => store.setWeight(parseInt(v, 10) || 0)}
            onWingspan={(v) => { const m = v.match(/(\d+)\D+(\d+)/); if (m) store.setWingspan(+m[1] * 12 + +m[2]) }}
            onNext={() => goPhone("experience")} onBack={() => goPhone("intro")} />
        )}
        {phoneStep === "experience" && (
          <ExperienceBodyType
            level={(store.experienceLevel ?? "advanced").toUpperCase()}
            body={BODY_TYPES.find(([, , v]) => v === (store.bodyType ?? "mesomorph"))?.[0] ?? "ATHLETIC"}
            onLevel={(v) => store.setExperienceLevel(v.toLowerCase() as never)}
            onBody={(v) => { const b = BODY_TYPES.find(([t]) => t === v); if (b) store.setBodyType(b[2]) }}
            onNext={() => goPhone("shooting")} onBack={() => goPhone("physical")} />
        )}
        {phoneStep === "shooting" && (
          <ShootingProfile
            hand={(store.dominantHand ?? "right") === "right" ? "RIGHT-HANDED" : "LEFT-HANDED"}
            ability={ABILITIES.find(([, , v]) => v === (store.athleticAbility ?? 7))?.[0] ?? "ADVANCED"}
            style={STYLES.find(([, , v]) => v === (store.shootingStyle ?? "two_motion"))?.[0] ?? "BALANCED"}
            onHand={(v) => store.setDominantHand(v.startsWith("RIGHT") ? "right" : "left")}
            onAbility={(v) => { const a = ABILITIES.find(([t]) => t === v); if (a) store.setAthleticAbility(a[2]) }}
            onStyle={(v) => { const s = STYLES.find(([t]) => t === v); if (s) store.setShootingStyle(s[2]) }}
            onNext={() => goPhone("bio")} onBack={() => goPhone("experience")} />
        )}
        {phoneStep === "bio" && (
          <PlayerBio
            step={BIO_STEP}
            steps={STEPS.length}
            bio={bio}
            onBio={setBio}
            enhanced={enhanced}
            onEnhance={enhanceBio}
            onContinue={() => goPhone("review")}
            onBack={() => goPhone("shooting")}
          />
        )}
        {phoneStep === "review" && (
          <OnboardingReview summary={phoneSummary} onEdit={goPhone} onFinish={finish} />
        )}
      </div>
    )}
    <div data-testid="screen-desktop-web-onboarding"
         className={`flex min-h-full flex-col ${isPhone ? "hidden" : ""}`}>
     <div className="flex flex-1">
      {/* Wizard step column. Canonical runs the four steps as a vertical list
          inside the content area — an in-body horizontal tab strip plus a
          "Step 2 of 4" meter is a control canonical never draws, and it exiled
          the progress card into the right rail. */}
      <div className="flex w-[186px] shrink-0 flex-col border-r border-[var(--shotiq-color-rule)] pb-[22px] pt-[26px]">
        {STEPS.map(([s, Icon], i) => (
          <button key={s} type="button" onClick={() => setStep(i + 1)} aria-current={step === i + 1 ? "true" : undefined}
                  data-testid={`onboarding-tab-${s.toLowerCase()}`}
                  /* Canonical sets the step names in the condensed display
                     face: cap 13 over an 80px advance for MEASUREMENTS. The
                     body face at 13px bold drew cap 10 over 103px — smaller
                     letters spread 29% wider, and blacker than canonical's
                     slate. */
                  className={`shotiq-display relative flex h-[44px] shrink-0 items-center gap-[14px] pl-[26px] text-[18px] leading-[20px] tracking-[0.01em] ${
                    step === i + 1
                      ? "bg-[var(--shotiq-color-warmCanvas)] text-[var(--shotiq-color-shotiqOrange)]"
                      : "text-[#2B2F37]"} ${i ? "mt-[13px]" : ""}`}>
            {step === i + 1 && <span className="absolute inset-y-0 left-0 w-[3px] bg-[var(--shotiq-color-shotiqOrange)]" />}
            {Icon
              ? <Icon className="h-[20px] w-[20px] shrink-0" strokeWidth={1.5} />
              : <PoseFigure phase="setup" height={22} active={step === i + 1} className="shrink-0" />}
            {s.toUpperCase()}
          </button>
        ))}
        {/* Canonical's "Your progress" card — the flow position, the step it
            names, its bar, why the questions are asked, and the escape hatch.
            It closes the step column; in the right rail it took 210px out of
            WHY IT MATTERS. */}
        <Card data-testid="onboarding-progress" className="mx-[8px] mt-auto px-[11px] py-[11px]">
          <div className="text-[13px]">Your progress</div>
          <div className="mt-[3px] text-[12px] text-[var(--shotiq-color-graphite)]">
            Step {progressStep} of {STEPS.length}
          </div>
          <div className="mt-[2px] text-[13px] font-semibold">{progressName}</div>
          <div className="mt-[8px] h-[6px] rounded-full bg-[var(--shotiq-color-rule)]">
            <div className="h-full rounded-full bg-[var(--shotiq-color-shotiqOrange)]"
                 style={{ width: `${(progressStep / STEPS.length) * 100}%` }} />
          </div>
          <p className="mt-[8px] text-[12px] leading-[17px] text-[var(--shotiq-color-graphite)]">
            Questions help ShotIQ personalize your analysis, feedback, and training.
          </p>
          <button type="button" onClick={finish}
                  className="mt-[10px] flex items-center gap-[8px] border-t border-[var(--shotiq-color-rule)] pt-[10px] text-[13px]">
            <Save className="h-[14px] w-[14px]" /> Save and finish later
          </button>
        </Card>
      </div>

      {/* form — canonical bounds this region with hairlines rather than a
          rounded card, which is what buys the field grid its width. */}
      <div className="flex min-w-0 flex-1 flex-col py-[18px] pr-[13px]">
        <div className="px-[26px]">
          {/* 52px drew a 37px cap on JORDAN against canonical's 49px. */}
          <PageTitle size={70}>{TITLES[step - 1]?.replace("{FIRST}", first.toUpperCase())}</PageTitle>
          <p className="mt-[4px] max-w-[560px] text-[14px] text-[var(--shotiq-color-graphite)]">
            {SUBTITLES[step - 1]}
          </p>
        </div>

        {/* Canonical bounds the whole form in one card — borders at x=223 and
            x=933 running y=231 to y=790, with a single internal hairline over
            the Back / Save / Continue row. A lone top rule left the panel with
            no left, right or bottom edge at all. */}
        <Card className="mt-[26px] flex flex-1 flex-col px-[26px] pb-[16px] pt-[24px]">
          <div className="flex items-center justify-between">
            {/* A heading, not an eyebrow: canonical draws this in the display
                face at a 19px cap in pure black, twice the cap of the field
                labels under it. */}
            <div className="shotiq-display text-[27px] leading-[29px] text-[#000000]">{CARD_HEADINGS[step - 1]}</div>
            <span className="text-[11px] text-[var(--shotiq-color-graphite)]">{CARD_NOTES[step - 1]}</span>
          </div>
          {/* ------------------------------------------- step 1: about you */}
          {step === 1 && (<>
          {/* Canonical's field rows sit on a 93px pitch; 84px packed them. */}
          <div className="mt-[26px] grid grid-cols-2 gap-x-[30px] gap-y-[26px]">
            <div>
              <div className={lbl} style={lblVars}>DOMINANT HAND <Info className="h-[10px] w-[10px]" /></div>
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
              <div className={lbl} style={lblVars}>PLAYING LEVEL <Info className="h-[10px] w-[10px]" /></div>
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
              <div className={lbl} style={lblVars}>POSITION <Info className="h-[10px] w-[10px]" /></div>
              <div className="relative mt-[6px]">
                <select value={position} onChange={(e) => setPosition(e.target.value)}
                        className={`${box} w-full appearance-none capitalize`}>
                  {["guard", "wing", "forward", "center"].map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-[12px] top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-[var(--shotiq-color-graphite)]" />
              </div>
            </div>
            <div>
              <div className={lbl} style={lblVars}>YEARS PLAYING <Info className="h-[10px] w-[10px]" /></div>
              <div className="relative mt-[6px]">
                <select value={years} onChange={(e) => setYears(e.target.value)} className={`${box} w-full appearance-none`}>
                  {["0–2 years", "3–5 years", "6–9 years", "10+ years"].map((o) => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-[12px] top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-[var(--shotiq-color-graphite)]" />
              </div>
            </div>
            <div>
              <div className={lbl} style={lblVars}>HEIGHT <Info className="h-[10px] w-[10px]" /></div>
              {/* Canonical draws HEIGHT as ONE control with an internal
                  divider between feet and inches, not two detached boxes with
                  a gap between them. */}
              <div className={`${box} mt-[6px] flex items-stretch px-0`}>
                <div className="flex flex-1 items-center justify-between px-[12px]">
                  <input type="number" value={ft} data-testid="height-ft"
                         onChange={(e) => store.setHeight((+e.target.value || 0) * 12 + inch)}
                         className="w-[46px] outline-none" />
                  <span className="text-[12px] text-[var(--shotiq-color-graphite)]">ft</span>
                </div>
                <div className="flex flex-1 items-center justify-between border-l border-[var(--shotiq-color-rule)] px-[12px]">
                  <input type="number" value={inch}
                         onChange={(e) => store.setHeight(ft * 12 + (+e.target.value || 0))}
                         className="w-[46px] outline-none" />
                  <span className="text-[12px] text-[var(--shotiq-color-graphite)]">in</span>
                </div>
              </div>
            </div>
            <div>
              <div className={lbl} style={lblVars}>WEIGHT <Info className="h-[10px] w-[10px]" /></div>
              <div className={`${box} mt-[6px] flex items-center justify-between`}>
                <input type="number" value={store.weightLbs ?? 185}
                       onChange={(e) => store.setWeight(+e.target.value || 0)} className="w-[80px] outline-none" />
                <span className="text-[12px] text-[var(--shotiq-color-graphite)]">lbs</span>
              </div>
            </div>
          </div>
          {/* This is the form's focal control: canonical gives it an 81px box,
              a 36px node-graph mark and 17px value text, not the same 46px
              select as PLAYING LEVEL. */}
          <div className="mt-[30px]">
            <div className={lbl} style={lblVars}>PRIMARY GOAL (CHOOSE ONE) <Info className="h-[10px] w-[10px]" /></div>
            <div className="relative mt-[8px]">
              <div className="flex h-[81px] w-full items-center gap-[18px] rounded-[5px] border border-[var(--shotiq-color-rule)] bg-white px-[16px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/canonical/078-goal-mark.png" alt="" aria-hidden="true"
                     className="block h-[36px] w-auto max-w-none shrink-0" />
                <select value={goal} onChange={(e) => setGoal(e.target.value)}
                        className="h-full flex-1 appearance-none bg-transparent text-[17px] outline-none">
                  {GOALS.map((g) => <option key={g}>{g}</option>)}
                </select>
                <ChevronDown className="pointer-events-none h-[16px] w-[16px] text-[var(--shotiq-color-graphite)]" />
              </div>
            </div>
          </div>

          </>)}

          {/* --------------------------------------- step 2: measurements */}
          {step === 2 && (
          <div data-testid="onboarding-step-measurements" className="mt-[26px]">
            <div className="grid grid-cols-2 gap-x-[30px] gap-y-[26px]">
              <div>
                <div className={lbl} style={lblVars}>AGE <Info className="h-[10px] w-[10px]" /></div>
                <div className={`${box} mt-[6px] flex items-center justify-between`}>
                  <input type="number" value={store.age ?? 24} data-testid="age-years"
                         onChange={(e) => store.setAge(+e.target.value || 0)} className="w-[80px] outline-none" />
                  <span className="text-[12px] text-[var(--shotiq-color-graphite)]">years</span>
                </div>
                <p className="mt-[6px] text-[12px] text-[var(--shotiq-color-graphite)]">Your current age.</p>
              </div>
              <div>
                <div className={lbl} style={lblVars}>WINGSPAN <Info className="h-[10px] w-[10px]" /></div>
                {/* Same one-control-two-cells treatment canonical gives HEIGHT. */}
                <div className={`${box} mt-[6px] flex items-stretch px-0`}>
                  <div className="flex flex-1 items-center justify-between px-[12px]">
                    <input type="number" value={wsFt} data-testid="wingspan-ft"
                           onChange={(e) => store.setWingspan((+e.target.value || 0) * 12 + wsIn)}
                           className="w-[46px] outline-none" />
                    <span className="text-[12px] text-[var(--shotiq-color-graphite)]">ft</span>
                  </div>
                  <div className="flex flex-1 items-center justify-between border-l border-[var(--shotiq-color-rule)] px-[12px]">
                    <input type="number" value={wsIn}
                           onChange={(e) => store.setWingspan(wsFt * 12 + (+e.target.value || 0))}
                           className="w-[46px] outline-none" />
                    <span className="text-[12px] text-[var(--shotiq-color-graphite)]">in</span>
                  </div>
                </div>
                <p className="mt-[6px] text-[12px] text-[var(--shotiq-color-graphite)]">Fingertip to fingertip.</p>
              </div>
            </div>
            <div className="mt-[26px]">
              <div className={lbl} style={lblVars}>BODY TYPE <Info className="h-[10px] w-[10px]" /></div>
              <div className="mt-[8px] grid grid-cols-3 gap-[14px]">
                {BODY_TYPES.map(([t, d, val]) => {
                  const on = (store.bodyType ?? "mesomorph") === val
                  return (
                    <button key={val} type="button" onClick={() => store.setBodyType(val)}
                            data-testid={`body-${val}`} aria-pressed={on}
                            className={`h-[92px] rounded-[5px] border px-[12px] text-left ${
                              on ? "border-[var(--shotiq-color-shotiqOrange)] bg-[#FFF7F4]" : "border-[var(--shotiq-color-rule)] bg-white"}`}>
                      <div className={`shotiq-display text-[19px] leading-[21px] ${on ? "text-[var(--shotiq-color-shotiqOrange)]" : ""}`}>{t}</div>
                      <div className="mt-[4px] text-[12px] leading-[16px] text-[var(--shotiq-color-graphite)]">{d}</div>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="mt-[22px] flex items-center gap-[10px] rounded-[5px] bg-[var(--shotiq-color-warmCanvas)] px-[14px] py-[12px]">
              <Ruler className="h-[16px] w-[16px] shrink-0 text-[var(--shotiq-color-graphite)]" strokeWidth={1.6} />
              <p className="text-[12px] leading-[17px] text-[var(--shotiq-color-graphite)]">
                Wingspan and body type scale the ideal ranges in your analysis — a 6&apos;10&quot; wingspan and a 6&apos;2&quot;
                one do not share a release height. You can update these anytime in profile settings.
              </p>
            </div>
          </div>
          )}

          {/* ----------------------------------------- step 3: preferences */}
          {step === 3 && (
          <div data-testid="onboarding-step-preferences" className="mt-[26px]">
            <div className={lbl} style={lblVars}>ATHLETIC ABILITY <Info className="h-[10px] w-[10px]" /></div>
            <div className="mt-[8px] grid grid-cols-3 gap-[14px]">
              {ABILITIES.map(([t, d, val]) => {
                const on = (store.athleticAbility ?? 7) === val
                return (
                  <button key={t} type="button" onClick={() => store.setAthleticAbility(val)}
                          data-testid={`ability-${t.toLowerCase()}`} aria-pressed={on}
                          className={`h-[78px] rounded-[5px] border px-[12px] text-left ${
                            on ? "border-[var(--shotiq-color-shotiqOrange)] bg-[#FFF7F4]" : "border-[var(--shotiq-color-rule)] bg-white"}`}>
                    <div className={`shotiq-display text-[19px] leading-[21px] ${on ? "text-[var(--shotiq-color-shotiqOrange)]" : ""}`}>{t}</div>
                    <div className="mt-[4px] text-[12px] leading-[16px] text-[var(--shotiq-color-graphite)]">{d}</div>
                  </button>
                )
              })}
            </div>
            <div className="mt-[24px]">
              <div className={lbl} style={lblVars}>SHOOTING STYLE <Info className="h-[10px] w-[10px]" /></div>
              <div className="mt-[8px] grid grid-cols-3 gap-[14px]">
                {STYLES.map(([t, d, val]) => {
                  const on = (store.shootingStyle ?? "two_motion") === val
                  return (
                    <button key={val} type="button" onClick={() => store.setShootingStyle(val)}
                            data-testid={`style-${val}`} aria-pressed={on}
                            className={`h-[78px] rounded-[5px] border px-[12px] text-left ${
                              on ? "border-[var(--shotiq-color-shotiqOrange)] bg-[#FFF7F4]" : "border-[var(--shotiq-color-rule)] bg-white"}`}>
                      <div className={`shotiq-display text-[19px] leading-[21px] ${on ? "text-[var(--shotiq-color-shotiqOrange)]" : ""}`}>{t}</div>
                      <div className="mt-[4px] text-[12px] leading-[16px] text-[var(--shotiq-color-graphite)]">{d}</div>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="mt-[24px] grid grid-cols-2 gap-x-[30px]">
              <div>
                <div className={lbl} style={lblVars}>PRACTICE FREQUENCY <Info className="h-[10px] w-[10px]" /></div>
                <div className="relative mt-[6px]">
                  <select value={practice} onChange={(e) => setPractice(e.target.value)}
                          data-testid="practice-frequency" className={`${box} w-full appearance-none`}>
                    {PRACTICE.map((o) => <option key={o}>{o}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-[12px] top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-[var(--shotiq-color-graphite)]" />
                </div>
              </div>
              <div>
                <div className={lbl} style={lblVars}>PRIMARY GOAL <Info className="h-[10px] w-[10px]" /></div>
                <div className="relative mt-[6px]">
                  <select value={goal} onChange={(e) => setGoal(e.target.value)}
                          className={`${box} w-full appearance-none`}>
                    {GOALS.map((g) => <option key={g}>{g}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-[12px] top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-[var(--shotiq-color-graphite)]" />
                </div>
              </div>
            </div>
          </div>
          )}

          {/* ------------------------------------------------ step 4: bio */}
          {step === 4 && (
          <div data-testid="onboarding-step-bio" className="mt-[22px]">
            <div className={lbl} style={lblVars}>YOUR BIO <Info className="h-[10px] w-[10px]" /></div>
            <textarea
              data-testid="onboarding-bio-desktop"
              value={bio}
              maxLength={160}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about your basketball journey, goals, and what motivates you."
              className="mt-[6px] h-[132px] w-full resize-none rounded-[5px] border border-[var(--shotiq-color-rule)] bg-white px-[14px] py-[12px] text-[14px] leading-[21px] outline-none focus:border-[var(--shotiq-color-ink)]"
            />
            <div className="mt-[4px] text-right text-[12px] text-[var(--shotiq-color-graphite)]">{bio.length} / 160</div>
            <div className="mt-[14px] flex items-center gap-[14px] rounded-[5px] border border-[var(--shotiq-color-rule)] px-[16px] py-[14px]">
              <div className="min-w-0 flex-1">
                <div className="shotiq-display text-[19px] leading-[21px]">ENHANCE WITH AI</div>
                <p className="mt-[5px] text-[12px] leading-[17px] text-[var(--shotiq-color-graphite)]">
                  Let ShotIQ AI craft a stronger bio based on your profile and training data.
                </p>
              </div>
              <button type="button" onClick={enhanceBio}
                      className="h-[38px] shrink-0 rounded-[5px] border border-[var(--shotiq-color-shotiqOrange)] px-[16px] text-[13px] font-medium text-[var(--shotiq-color-shotiqOrange)]">
                Enhance bio
              </button>
            </div>
            <div className="mt-[12px] rounded-[5px] border border-[var(--shotiq-color-rule)] px-[16px] py-[12px]">
              <SectionLabel>AI-ENHANCED PREVIEW</SectionLabel>
              <p className="mt-[8px] text-[13px] leading-[19px] text-[var(--shotiq-color-graphite)]">
                {enhanced || "Your enhanced bio will appear here. Review and customize before saving."}
              </p>
            </div>
          </div>
          )}

          {/* --------------------------------------------- step 5: review */}
          {step === 5 && (
          <div data-testid="onboarding-step-review" className="mt-[22px]">
            <div className="grid grid-cols-2 gap-x-[36px]">
              {REVIEW_COLUMNS(summary).map((col, ci) => (
                <div key={ci} className="divide-y divide-[var(--shotiq-color-rule)]">
                  {col.map(([label, value, toStep]) => (
                    <div key={label} className="flex items-center justify-between py-[9px] text-[13px]">
                      <span className="text-[var(--shotiq-color-graphite)]">{label}</span>
                      <span className="flex items-center gap-[10px]">
                        <span className="font-medium">{value}</span>
                        <button type="button" onClick={() => setStep(toStep)}
                                aria-label={`Edit ${label}`}
                                className="text-[12px] text-[var(--shotiq-color-analysisBlue)]">Edit</button>
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="mt-[18px] flex items-center gap-[12px] rounded-[5px] border border-[var(--shotiq-color-rule)] px-[14px] py-[12px]">
              <ClipboardList className="h-[18px] w-[18px] shrink-0 text-[var(--shotiq-color-shotiqOrange)]" strokeWidth={1.6} />
              <p className="text-[12px] leading-[17px] text-[var(--shotiq-color-graphite)]">
                Finishing saves this profile to your account and opens your dashboard. Everything here stays editable
                in <span className="font-semibold text-[var(--shotiq-color-ink)]">Profile &amp; settings</span>.
              </p>
            </div>
          </div>
          )}

        {/* Canonical's footer hairline runs the full width of the card. */}
        <div className="-mx-[26px] mt-auto flex items-center justify-between border-t border-[var(--shotiq-color-rule)] px-[26px] pt-[16px]">
          {/* Canonical draws Back enabled on this step. On the first card there
              is nothing behind it in the wizard, so it leaves onboarding. */}
          <button type="button" onClick={() => (step === 1 ? router.push("/dashboard") : setStep(step - 1))}
                  className="flex h-[44px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[16px] text-[14px]">
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
        </Card>

      </div>

      {/* why it matters rail — canonical draws the hero and the copy inside one
          bordered container, not loose on the paper. */}
      {/* Canonical's hero measures 463x309 in a 1189px body; this build's body is
          1044px once the 196px app sidebar and the 186px step rail are taken, so
          the proportional target is 463 * 1044/1189 = 407. The rail padding was
          eating 32px of that, which is why the photo measured 392x261 — the
          remaining 56px cannot be recovered without taking it from the form
          column, so it is not taken. */}
      <aside className="w-[430px] shrink-0 border-l border-[var(--shotiq-color-rule)] px-[8px] py-[16px]">
        <Card className="overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/canonical/078-hero.png" alt="Shooter at release with elbow flex and release angle called out"
               className="h-[275px] w-full object-cover" width={466} height={322} />
          <div className="border-t border-[var(--shotiq-color-rule)] px-[18px] py-[16px]">
            {/* A DISPLAY HEADING, not an eyebrow. Canonical draws it at cap 20
                over a 118px advance, ink density 0.565 — twice the cap of the
                13px paragraph beneath it. Routed through `.shotiq-section-label`
                it rendered cap 11 / 81px, i.e. SMALLER than the body copy it
                labels, which inverted the whole right panel's hierarchy. It is
                set per site rather than by raising the shared label role: a
                histogram of every all-caps run across the twenty screens shows
                this build already carries MORE cap-12+ runs than canonical
                (199 vs 146), so the role default is not uniformly short.
                Display face cap is 0.704em, so cap 20 wants 28px, and canonical
                does not track it — 0.08em at this size would run the advance to
                ~147 against canonical's 118. */}
            <div className="shotiq-display text-[28px] leading-[30px] tracking-normal text-[var(--shotiq-color-ink)]">WHY IT MATTERS</div>
            <p className="mt-[8px] text-[13px] leading-[19px] text-[var(--shotiq-color-graphite)]">
              Measuring your profile helps ShotIQ benchmark your mechanics and build feedback that&apos;s tailored to you.
            </p>
            {/* Canonical's benefit rows run on a 70px pitch with the figure
                OUTSIDE the hairline; the rail relocation squeezed them to 46px
                and put the mark inside the rule. */}
            <div className="mt-[16px] space-y-[28px]">
              {BENEFITS.map(([t, d, mark]) => (
                <div key={t} className="flex items-center gap-[14px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/images/canonical/${mark}.png`} alt="" aria-hidden="true"
                       className="block h-[42px] w-auto max-w-none shrink-0" />
                  <div className="border-l border-[var(--shotiq-color-rule)] pl-[14px]">
                    <div className="text-[14px] font-semibold leading-[19px]">{t}</div>
                    <div className="mt-[2px] text-[12px] leading-[16px] text-[var(--shotiq-color-graphite)]">{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
              <PoseFigure phase={p} height={47} active={p === "RELEASE"} />
            </div>
          ))}
          {/* Canonical's node dot measures 9px across (x130-137 / y853-861 on the
              SETUP node) with a (93,94,102) core, and the connector is a 2px
              dashed rule whose cores read 213-217 — this drew a 6px dot on a
              1px #EBECED rule that was only detectable below luminance 252. */}
          {PHASES.map((p, i) => (
            <div key={`t-${p}`} className="relative flex h-[12px] items-center justify-center">
              {i > 0 && <span className="absolute right-1/2 top-1/2 w-full border-t-[2px] border-dotted border-[#C9CBCE]" />}
              {i < PHASES.length - 1 && <span className="absolute left-1/2 top-1/2 w-full border-t-[2px] border-dotted border-[#C9CBCE]" />}
              <span className={`relative h-[9px] w-[9px] rounded-full ${p === "RELEASE" ? "bg-[var(--shotiq-color-shotiqOrange)]" : "bg-[var(--shotiq-color-graphite)]"}`} />
            </div>
          ))}
          {PHASES.map((p) => (
            <div key={`l-${p}`} className={`text-center text-[9px] tracking-[0.05em] ${p === "RELEASE" ? "font-bold text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-graphite)]"}`}>{p}</div>
          ))}
        </div>
        <div className="flex w-[430px] shrink-0 items-center gap-[12px] border-l border-[var(--shotiq-color-rule)] pl-[26px]">
          {/* Canonical draws the ring as part of the mark, so the crop carries it. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/canonical/078-sync-mark.png" alt="" aria-hidden="true"
               className="block h-[52px] w-[52px] max-w-none shrink-0" />
          <p className="text-[11px] leading-[15px] text-[var(--shotiq-color-graphite)]">
            <span className="font-semibold text-[var(--shotiq-color-ink)]">One profile. Everywhere.</span><br />
            Your profile, captures, analyses, training, goals, media, points, and settings sync across web and iOS.
          </p>
        </div>
      </div>
    </div>
    </>
  )
}
