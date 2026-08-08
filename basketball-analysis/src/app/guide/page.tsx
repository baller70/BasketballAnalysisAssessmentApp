"use client"

/**
 * /guide — canonical help & guide page. The legacy swipe-card deck is
 * replaced with structured white-court sections (uppercase section labels,
 * rule dividers, 6–8px radii) in the same design language as the rest of
 * the app. All of the original instructional content is preserved.
 */

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronRight } from "@/components/shotiq/ApprovedLucide"
import { ShotIQShell, SectionLabel, Card } from "@/components/shotiq/ShotIQShell"
import { ActionGlyph, ConceptGlyph } from "@/components/shotiq/Glyphs"

type GuideItem = { title: string; description: string; points: string[]; tip: string }

const UPLOAD_DOS: GuideItem[] = [
  { title: "Side view (90° angle)", description: "Position the camera perpendicular to the shooter for the best analysis.",
    points: ["Camera at waist height", "Directly to the side of the shooter", "Full court depth visible", "No obstructions between camera and shooter"],
    tip: "This angle lets the AI see elbow angle, knee bend, and the full shooting motion." },
  { title: "Full body visible", description: "Make sure your entire body is in frame from feet to head.",
    points: ["Feet clearly visible at bottom", "Head and release point at top", "Arms fully visible during extension", "Leave some margin around the body"],
    tip: "The AI needs to track every body point for a complete analysis." },
  { title: "Good lighting", description: "Well-lit environments help the AI detect your body accurately.",
    points: ["Outdoor daylight is ideal", "A well-lit gym works great", "Avoid harsh shadows on the body", "Even lighting across the frame"],
    tip: "Good lighting helps computer vision detect body keypoints accurately." },
  { title: "Stable camera", description: "Keep the camera steady for clear, blur-free footage.",
    points: ["Use a tripod if possible", "Rest on a stable surface", "Have someone hold it steady", "Avoid handheld recording"],
    tip: "Motion blur confuses the AI and reduces analysis accuracy." },
]

const UPLOAD_DONTS: GuideItem[] = [
  { title: "Front-facing angle", description: "A camera directly in front hides important body mechanics.",
    points: ["Can't see elbow position", "Side-to-side alignment hidden", "Knee bend not visible", "Release angle unclear"],
    tip: "Always position the camera to the side, not in front." },
  { title: "Cut-off body parts", description: "Partial body visibility means incomplete analysis.",
    points: ["Missing feet — no balance analysis", "Missing head — no follow-through", "Missing arms — no release analysis", "Missing legs — no power analysis"],
    tip: "Step back or zoom out to capture your full body." },
  { title: "Poor lighting", description: "Dark environments make body detection difficult.",
    points: ["Shadows hide the body outline", "Low light causes blur", "Backlight silhouettes the body", "Uneven lighting confuses the AI"],
    tip: "Record in daylight or well-lit indoor spaces." },
  { title: "Shaky footage", description: "Shaky recording ruins the analysis quality.",
    points: ["Motion blur on the body", "Inconsistent tracking", "Keypoints jump around", "Inaccurate measurements"],
    tip: "Use a tripod or rest the camera on something stable." },
]

const CAPTURE_MODES: { label: string; icon: React.ReactNode; sub: string; items: GuideItem[] }[] = [
  { label: "IMAGE UPLOADS", sub: "Quick single-frame or phase-by-phase analysis.",
    icon: <ActionGlyph kind="uploadImage" height={18} />, items: [
    { title: "Single image upload", description: "Upload one photo of your shooting form for quick analysis.",
      points: ["Best for release-point analysis", "Capture at the peak of the shot", "High resolution preferred", "JPEG, PNG, or HEIC format"],
      tip: "Capture the moment just as the ball leaves your fingertips." },
    { title: "Image sequence (3–7 photos)", description: "Upload multiple photos showing different phases of your shot.",
      points: ["Phase 1 — setup position", "Phase 2 — loading (the dip)", "Phase 3 — release point", "Phase 4 — follow-through"],
      tip: "More phases mean a more comprehensive analysis." },
  ]},
  { label: "VIDEO UPLOADS", sub: "Complete motion analysis from real footage.",
    icon: <ActionGlyph kind="uploadVideo" height={18} />, items: [
    { title: "Video upload", description: "Upload a video to analyze your complete shooting motion.",
      points: ["Maximum 90 seconds", "1–2 complete shot attempts", "MP4, MOV, or WebM format", "Maximum 500MB file size"],
      tip: "Video captures the full motion for detailed analysis." },
    { title: "Video best practices", description: "Follow these tips for the best video analysis.",
      points: ["Record at 30fps or higher", "Include setup through follow-through", "Pause briefly between shots", "Keep the camera stable throughout"],
      tip: "Quality over quantity — one good shot beats five blurry ones." },
  ]},
  { label: "LIVE ANALYSIS", sub: "Real-time feedback while you practice.",
    icon: <ActionGlyph kind="liveCamera" height={18} />, items: [
    { title: "Live analysis mode", description: "Get real-time feedback as you shoot using your device camera.",
      points: ["Instant form feedback", "See keypoints in real time", "Adjust form on the fly", "Perfect for practice sessions"],
      tip: "Set up your device where you can see the screen while shooting." },
    { title: "Live mode setup", description: "Position your device for optimal live analysis.",
      points: ["Mount the device at a side angle", "Prop at waist height", "Ensure stable positioning", "Check you're fully in frame"],
      tip: "Use a phone tripod or lean the device against something stable." },
  ]},
]

const FORM_CORRECT: GuideItem[] = [
  { title: "Proper shooting-hand grip", description: "Fingertip control for optimal backspin and accuracy.",
    points: ["Ball rests on fingertips, not the palm", "Fingers spread comfortably", "Thumb relaxed at about 45°", "Wrist cocked back in set position"],
    tip: "Think of holding the ball like a waiter holds a tray." },
  { title: "Elbow aligned under the ball", description: "Proper elbow position creates straight ball flight.",
    points: ["Elbow directly under the ball", "Forearm perpendicular to the floor", "Elbow points toward the basket", "Creates a straight force vector"],
    tip: "Your elbow should form an \"L\" shape at set position." },
  { title: "Complete follow-through", description: "Full extension with wrist snap for consistency.",
    points: ["Arm fully extended at release", "Wrist snaps down completely", "Fingers point toward the basket", "Hold the position until the ball lands"],
    tip: "Reach into the cookie jar on the top shelf." },
  { title: "Guide-hand position", description: "Side support without interfering with the shot.",
    points: ["Guide hand on the side of the ball", "Thumb pointing upward", "Light fingertip contact only", "Releases cleanly before the shot"],
    tip: "The guide hand guides — it doesn't push." },
]

const FORM_MISTAKES: GuideItem[] = [
  { title: "Palming the ball", description: "Palm contact reduces control and spin.",
    points: ["Ball sits in the palm", "Fingers bunched together", "Limited wrist flexibility", "Reduced backspin on the shot"],
    tip: "If you can see daylight between palm and ball, you're doing it right." },
  { title: "Elbow flared out", description: "A misaligned elbow creates unwanted side spin.",
    points: ["Elbow points outward from the body", "Creates an angled force vector", "Ball curves during flight", "Requires compensation"],
    tip: "Keep that elbow tucked in and pointing at the rim." },
  { title: "Incomplete follow-through", description: "A shortened motion reduces power and accuracy.",
    points: ["Arm doesn't fully extend", "Wrist snap is abbreviated", "Quick withdrawal of the arm", "Inconsistent trajectory"],
    tip: "Finish your shot — hold that follow-through." },
  { title: "Guide-hand push", description: "An active guide hand disrupts accuracy.",
    points: ["Guide hand pushes the ball", "Thumb flicks toward the basket", "Creates unwanted side spin", "Inconsistent ball flight"],
    tip: "Your guide hand should come off clean — no pushing." },
]

const NAV = [
  ["start", "Getting started"], ["dos-donts", "Do's & don'ts"], ["capture", "Capture modes"],
  ["form", "Shooting form"], ["ready", "Start analyzing"],
] as const

function GuideBlock({ item, tone }: { item: GuideItem; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-[6px] border border-[var(--shotiq-color-rule)] p-[12px]">
      <div className="flex items-center gap-[8px]">
        {tone === "good" && <ConceptGlyph concept="Success complete" size={14} className="shrink-0" />}
        {tone === "bad" && <ConceptGlyph concept="Warning error" size={14} className="shrink-0" />}
        <span className="text-[14px] font-semibold">{item.title}</span>
      </div>
      <p className="mt-[4px] text-[12px] leading-[17px] text-[var(--shotiq-color-graphite)]">{item.description}</p>
      <ul className="mt-[6px] space-y-[3px]">
        {item.points.map((p) => (
          <li key={p} className="flex items-start gap-[6px] text-[12px] leading-[16px]">
            <span className="mt-[6px] h-[4px] w-[4px] shrink-0 rounded-full bg-[var(--shotiq-color-graphite)]" />
            {p}
          </li>
        ))}
      </ul>
      <p className="mt-[8px] border-t border-[var(--shotiq-color-rule)] pt-[6px] text-[11px] italic text-[var(--shotiq-color-graphite)]">
        Tip: {item.tip}
      </p>
    </div>
  )
}

function SectionHead({ icon, label, sub }: { icon: React.ReactNode; label: string; sub: string }) {
  return (
    <div className="flex items-center gap-[10px]">
      {icon}
      <div>
        <SectionLabel>{label}</SectionLabel>
        <div className="text-[11px] text-[var(--shotiq-color-graphite)]">{sub}</div>
      </div>
    </div>
  )
}

export default function GuidePage() {
  const router = useRouter()

  return (
    <ShotIQShell active="Home">
      <div data-testid="screen-desktop-web-guide" className="px-[24px] py-[18px]">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="shotiq-display text-[46px] leading-[48px]">GUIDE</h1>
            <p className="mt-[2px] text-[13px] text-[var(--shotiq-color-graphite)]">Learn how to get the best results from ShotIQ.</p>
          </div>
          <Link href="/upload"
                className="mb-[4px] flex h-[40px] items-center gap-[8px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] px-[16px] text-[13px] font-medium text-white">
            <ActionGlyph kind="uploadImage" height={15} /> Start upload
          </Link>
        </div>

        {/* Section jump nav */}
        <div className="mt-[12px] flex flex-wrap gap-[8px]">
          {NAV.map(([id, label]) => (
            <button key={id} type="button"
                    onClick={() => document.getElementById(`guide-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    className="h-[32px] rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white px-[12px] text-[12px] hover:border-[var(--shotiq-color-ink)]">
              {label}
            </button>
          ))}
        </div>

        {/* Getting started */}
        <Card id="guide-start" className="mt-[16px] scroll-mt-[76px] p-[18px]">
          <SectionHead icon={<ConceptGlyph concept="AI analysis" size={18} />}
                       label="GETTING STARTED" sub="Your personal AI shooting coach." />
          <div className="mt-[10px] grid gap-[16px] md:grid-cols-2">
            <div>
              <p className="text-[13px] leading-[19px] text-[var(--shotiq-color-graphite)]">
                Analyze your basketball shooting form and get instant feedback to improve your game.
              </p>
              <ul className="mt-[8px] space-y-[5px]">
                {["AI-powered form analysis", "Compare with elite shooters", "Track your progress over time", "Get personalized tips"].map((p) => (
                  <li key={p} className="flex items-center gap-[8px] text-[13px]">
                    <ConceptGlyph concept="Success complete" size={13} /> {p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[9px] font-bold tracking-[0.06em] text-[var(--shotiq-color-graphite)]">THREE EASY STEPS</div>
              <ol className="mt-[6px] space-y-[8px]">
                {["Upload a photo, video, or go live", "Our AI analyzes your shooting form", "Get detailed feedback and tips"].map((s, i) => (
                  <li key={s} className="flex items-center gap-[10px] text-[13px]">
                    <span className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full bg-[var(--shotiq-color-shotiqOrange)] text-[11px] font-bold text-white">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
              <p className="mt-[8px] text-[11px] italic text-[var(--shotiq-color-graphite)]">Better uploads = better analysis results.</p>
            </div>
          </div>
        </Card>

        {/* Do's & don'ts */}
        <div id="guide-dos-donts" className="mt-[16px] grid scroll-mt-[76px] gap-[16px] lg:grid-cols-2">
          <Card className="p-[18px]">
            <SectionHead icon={<ConceptGlyph concept="Success complete" size={18} />}
                         label="UPLOAD DO'S" sub="Set up your capture like this." />
            <div className="mt-[10px] grid gap-[10px] sm:grid-cols-2">
              {UPLOAD_DOS.map((item) => <GuideBlock key={item.title} item={item} tone="good" />)}
            </div>
          </Card>
          <Card className="p-[18px]">
            <SectionHead icon={<ConceptGlyph concept="Warning error" size={18} />}
                         label="UPLOAD DON'TS" sub="Avoid these common capture mistakes." />
            <div className="mt-[10px] grid gap-[10px] sm:grid-cols-2">
              {UPLOAD_DONTS.map((item) => <GuideBlock key={item.title} item={item} tone="bad" />)}
            </div>
          </Card>
        </div>

        {/* Capture modes */}
        <div id="guide-capture" className="mt-[16px] grid scroll-mt-[76px] gap-[16px] lg:grid-cols-3">
          {CAPTURE_MODES.map(({ label, icon, sub, items }) => (
            <Card key={label} className="p-[18px]">
              <SectionHead icon={icon} label={label} sub={sub} />
              <div className="mt-[10px] space-y-[10px]">
                {items.map((item) => <GuideBlock key={item.title} item={item} />)}
              </div>
            </Card>
          ))}
        </div>

        {/* Shooting form */}
        <div id="guide-form" className="mt-[16px] grid scroll-mt-[76px] gap-[16px] lg:grid-cols-2">
          <Card className="p-[18px]">
            <SectionHead icon={<ConceptGlyph concept="Elbow aligned shooting form" size={18} />}
                         label="CORRECT FORM" sub="What great shooting mechanics look like." />
            <div className="mt-[10px] grid gap-[10px] sm:grid-cols-2">
              {FORM_CORRECT.map((item) => <GuideBlock key={item.title} item={item} tone="good" />)}
            </div>
          </Card>
          <Card className="p-[18px]">
            <SectionHead icon={<ConceptGlyph concept="Flaws detected" size={18} />}
                         label="COMMON MISTAKES" sub="Flaws the analysis looks out for." />
            <div className="mt-[10px] grid gap-[10px] sm:grid-cols-2">
              {FORM_MISTAKES.map((item) => <GuideBlock key={item.title} item={item} tone="bad" />)}
            </div>
          </Card>
        </div>

        {/* Ready to start */}
        <Card id="guide-ready" className="mt-[16px] scroll-mt-[76px] p-[18px]">
          <SectionHead icon={<ConceptGlyph concept="Help guide" size={18} />}
                       label="YOU'RE READY" sub="Everything you need to get the most out of ShotIQ." />
          <div className="mt-[10px] grid items-center gap-[16px] lg:grid-cols-[minmax(0,1fr)_auto]">
            <ul className="space-y-[5px]">
              {["Upload your first shot and get instant AI feedback", "Track your progress and watch yourself improve",
                "Compare your form to elite NBA shooters", "Build your streak and stay consistent"].map((p) => (
                <li key={p} className="flex items-center gap-[8px] text-[13px]">
                  <ChevronRight className="h-[13px] w-[13px] text-[var(--shotiq-color-shotiqOrange)]" /> {p}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-[10px]">
              <button type="button" onClick={() => router.push("/upload?mode=image")}
                      className="flex h-[44px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white px-[16px] text-[13px] font-medium hover:border-[var(--shotiq-color-ink)]">
                <ActionGlyph kind="uploadImage" height={15} /> Upload image
              </button>
              <button type="button" onClick={() => router.push("/upload?mode=video")}
                      className="flex h-[44px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white px-[16px] text-[13px] font-medium hover:border-[var(--shotiq-color-ink)]">
                <ActionGlyph kind="uploadVideo" height={15} /> Upload video
              </button>
              <button type="button" onClick={() => router.push("/video-analysis")}
                      className="flex h-[44px] items-center gap-[8px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] px-[16px] text-[13px] font-medium text-white">
                <ActionGlyph kind="liveCamera" height={15} /> Go live
              </button>
            </div>
          </div>
        </Card>
      </div>
    </ShotIQShell>
  )
}
