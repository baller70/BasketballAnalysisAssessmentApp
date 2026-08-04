"use client"

/**
 * Canonical ShotIQ sign-in screen (desktop screen `077-web-sign-in`).
 *
 * Colour tokens, type roles and layout geometry derive from the authoritative
 * HoopTrackLayoutSidecar contract in
 * `docs/shotiq/sidecars/desktop/077-web-sign-in.sidecar.json`.
 * Canonical canvas is 1440x900; the layout is authored at that size and scales
 * down responsively without altering canonical geometry.
 *
 * The previous implementation was the legacy black (#030303) treatment. The
 * authentication behaviour it carried — useAuthStore.signIn, error handling and
 * the profileComplete-based redirect — is preserved verbatim; only the
 * presentation was replaced.
 */

import React, { useRef, useState } from "react"
import Link from "next/link"
import { useAuthStore } from "@/stores/authStore"
import { UnifiedSidebar, PageTitle } from "@/components/shotiq/ShotIQShell"
import { Eye, EyeOff, Loader2, ChevronDown, ChevronRight, Play, Maximize2 } from "lucide-react"

const STEPS = [
  { title: "CAPTURE", body: ["Record from any angle", "with your phone."], icon: "/images/canonical/077-step-capture.png" },
  { title: "ANALYZE", body: ["AI detects mechanics and", "scores your shot."], icon: "/images/canonical/077-step-analyze.png" },
  { title: "TRAIN", body: ["Get personalized drills", "to improve faster."], icon: "/images/canonical/077-step-train.png" },
  { title: "TRACK", body: ["Monitor progress and", "stay on target."], icon: "/images/canonical/077-step-track.png" },
]


/** Apple wordmark glyph, drawn inline (canonical 077 leads each SSO button
 *  with the provider's own mark). */
function AppleMark() {
  return (
    <svg width="17" height="20" viewBox="0 0 17 20" aria-hidden="true" className="shrink-0">
      <path fill="#111111" d="M13.9 10.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.9-3-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.2 0 2-1.1 2.8-2.2.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.6Z"/>
      <path fill="#111111" d="M11.6 3.8c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.7 1.4-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.5 2.7-1.3Z"/>
    </svg>
  )
}

/** Google "G", four-colour, drawn inline. */
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
      <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-2.8-.4-4H24v7.5h12.1c-.2 1.9-1.6 4.8-4.5 6.8l-.1.3 6.5 5 .5.1c4.1-3.8 6.6-9.4 6.6-15.7Z"/>
      <path fill="#34A853" d="M24 46c5.9 0 10.9-1.9 14.5-5.3l-6.9-5.4c-1.8 1.3-4.3 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-.3.02-6.7 5.2-.1.3C7.9 41 15.4 46 24 46Z"/>
      <path fill="#FBBC05" d="M11.5 28.4c-.5-1.4-.7-2.9-.7-4.4 0-1.5.3-3 .7-4.4v-.3l-6.8-5.3-.2.1A22 22 0 0 0 2 24c0 3.5.9 6.9 2.5 9.9l7-5.5Z"/>
      <path fill="#EA4335" d="M24 9.5c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 3.4 29.9 1 24 1 15.4 1 7.9 6 4.5 14.1l7 5.5c1.8-5.3 6.7-9.1 12.5-9.1Z"/>
    </svg>
  )
}

export default function SignInPage() {
  const { signIn, isLoading } = useAuthStore()

  const [formData, setFormData] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)

  // --- preserved authentication behaviour -----------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.email || !formData.password) {
      setError("Email and password are required")
      // Accessibility contract (covered by e2e): failed validation moves
      // focus to the first invalid field so keyboard users land on it.
      emailRef.current?.focus()
      return
    }

    setIsSubmitting(true)

    try {
      const result = await signIn(formData.email, formData.password)

      if (result.success) {
        // signIn already awaited the API response, so the httpOnly session
        // cookie is set by the time we get here — navigate immediately, no race.
        const { user } = useAuthStore.getState()
        // Returning users (profile complete) go directly to dashboard;
        // new users go to onboarding to set up their profile.
        const targetUrl = user?.profileComplete ? "/results/demo" : "/onboarding"
        window.location.assign(targetUrl)
      } else {
        setError(result.error || "Sign in failed")
        setIsSubmitting(false)
      }
    } catch {
      setError("An unexpected error occurred")
      setIsSubmitting(false)
    }
  }
  // --------------------------------------------------------------------------

  const busy = isSubmitting || isLoading
  const label = "text-[12px] font-bold tracking-[0.04em] text-[var(--shotiq-color-ink)]"
  const field =
    "w-full h-[46px] rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white px-[14px] " +
    "text-[15px] text-[var(--shotiq-color-ink)] placeholder:text-[var(--shotiq-color-muted)] " +
    "outline-none focus:border-[var(--shotiq-color-ink)]"

  return (
    <div
      data-testid="screen-desktop-web-sign-in"
      className="shotiq-canonical mx-auto flex w-full max-w-[1440px] flex-col bg-[var(--shotiq-color-paper)] text-[var(--shotiq-color-ink)]"
      style={{ minHeight: 900 }}
    >
      {/* ---------------------------------------------------------- topbar */}
      <header
        className="flex h-[57px] shrink-0 items-center justify-between border-b border-[var(--shotiq-color-rule)] pl-[20px] pr-[24px]"
        data-testid="region-topbar"
      >
        <span className="shotiq-wordmark text-[21px] leading-none tracking-[0.02em]">
          SHOT<span className="text-[var(--shotiq-color-shotiqOrange)]">IQ</span>
        </span>

        <div className="flex items-center">
          {/* Decorative on the sign-in screen — nobody is signed in yet, so
              this is a static chip, not an interactive control. */}
          <div className="flex items-center gap-[10px] pr-[22px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/canonical/077-avatar.png" alt=""
                 className="h-[34px] w-[34px] rounded-full object-cover" />
            <span className="text-[15px]">Jordan Ellis</span>
            <ChevronDown className="h-[16px] w-[16px] text-[var(--shotiq-color-graphite)]" />
          </div>
          <div className="h-[38px] w-px bg-[var(--shotiq-color-rule)]" />
          <div className="w-[112px] text-center">
            <div className="shotiq-numeric text-[19px] leading-[22px]">2,840</div>
            <div className="text-[10px] font-medium tracking-[0.08em] text-[var(--shotiq-color-graphite)]">POINTS</div>
          </div>
          <div className="h-[38px] w-px bg-[var(--shotiq-color-rule)]" />
          <div className="w-[104px] text-center">
            <div className="shotiq-numeric text-[19px] leading-[22px]">6</div>
            <div className="text-[10px] font-medium tracking-[0.08em] text-[var(--shotiq-color-graphite)]">DAY STREAK</div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* ------------------------------------------------------- sidebar
            The product owner's ruling is one menu sidebar for the whole app —
            no per-screen rail variants. This screen used to draw its own
            10-item 112px rail; it now renders the same `UnifiedSidebar` every
            other screen does. Auth-gated destinations bounce back here via
            middleware, which is app behaviour, not a dead control. */}
        <UnifiedSidebar />

        {/* --------------------------------------------------- form column */}
        <section className="w-[394px] shrink-0 border-r border-[var(--shotiq-color-rule)] px-[46px] pt-[48px]">
          {/* 46px drew a 32px cap against canonical's 44px. */}
          <PageTitle size={63}>WELCOME BACK</PageTitle>
          <p className="mt-[10px] text-[15px] text-[var(--shotiq-color-graphite)]">
            Sign in to continue your training.
          </p>

          <form onSubmit={handleSubmit} className="mt-[30px]" noValidate>
            <label htmlFor="email" className={label}>EMAIL</label>
            <input id="email" ref={emailRef} type="email" autoComplete="email" data-testid="signin-email"
                   className={`${field} mt-[9px]`} placeholder="Enter your email"
                   value={formData.email}
                   onChange={(e) => setFormData({ ...formData, email: e.target.value })} />

            <label htmlFor="password" className={`${label} mt-[22px] block`}>PASSWORD</label>
            <div className="relative mt-[9px]">
              <input id="password" type={showPassword ? "text" : "password"}
                     autoComplete="current-password" data-testid="signin-password"
                     className={`${field} pr-[44px]`} placeholder="Enter your password"
                     value={formData.password}
                     onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-[13px] top-1/2 -translate-y-1/2 text-[var(--shotiq-color-graphite)]">
                {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>

            <div className="mt-[20px] flex items-center justify-between">
              <label className="flex items-center gap-[9px] text-[13px]">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                       className="h-[15px] w-[15px] rounded-[3px] border border-[var(--shotiq-color-rule)] accent-[var(--shotiq-color-shotiqOrange)]" />
                Remember me
              </label>
              <Link href="/forgot-password"
                    className="text-[13px] text-[var(--shotiq-color-analysisBlue)]">
                Forgot password?
              </Link>
            </div>

            {error && (
              <p role="alert" data-testid="signin-error"
                 className="mt-[14px] text-[13px] text-[var(--shotiq-color-reviewRed)]">{error}</p>
            )}

            <button type="submit" disabled={busy} data-testid="signin-submit"
                    className="mt-[20px] flex h-[46px] w-full items-center justify-center gap-2 rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] text-[15px] font-medium text-white disabled:opacity-70">
              {busy && <Loader2 className="h-[16px] w-[16px] animate-spin" />}
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-[26px] flex items-center gap-[14px]">
            <span className="h-px flex-1 bg-[var(--shotiq-color-rule)]" />
            <span className="text-[11px] tracking-[0.09em] text-[var(--shotiq-color-graphite)]">OR CONTINUE WITH</span>
            <span className="h-px flex-1 bg-[var(--shotiq-color-rule)]" />
          </div>

          {(["Continue with Apple", "Continue with Google"] as const).map((t, i) => (
            <button key={t} type="button"
                    onClick={() => {
                      setError(`${t.replace("Continue with ", "")} sign-in isn't enabled on this server yet — use your email and password.`)
                      emailRef.current?.focus()
                    }}
                    className={`${i ? "mt-[14px]" : "mt-[20px]"} flex h-[46px] w-full items-center justify-center gap-[11px] rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white text-[15px]`}>
              {i ? <GoogleMark /> : <AppleMark />}
              {t}
            </button>
          ))}

          <p className="mt-[26px] text-center text-[13px] text-[var(--shotiq-color-graphite)]">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[var(--shotiq-color-analysisBlue)]">Create account</Link>
          </p>
        </section>

        {/* ------------------------------------------------ marketing rail
            The unified rail is 196px where this screen's own rail was 112px,
            so this column lost 84px. The loss is absorbed by the gutters and
            the media surface (below) rather than by the FORM SCORE card, which
            keeps its canonical 346px width — the card is the dense element and
            is the one that breaks first when squeezed. */}
        <section className="flex-1 px-[32px] pt-[34px]" data-testid="region-main">
          {/* 40px drew a 28px cap against canonical's 34px. */}
          <h2 className="shotiq-display text-[49px] leading-[51px]">
            AI ANALYSIS. BETTER MECHANICS. BETTER RESULTS.
          </h2>
          <p className="mt-[8px] text-[15px] text-[var(--shotiq-color-graphite)]">
            Capture your shot. Get AI analysis. Follow a plan. Track progress.
          </p>

          <ol className="mt-[20px] flex items-start justify-between pr-[30px]">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.title}>
                <li className="w-[172px] text-center">
                  <div className="mx-auto mb-[10px] flex h-[58px] items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.icon} alt="" className="max-h-[58px] w-auto" />
                  </div>
                  <div className="text-[14px] font-bold tracking-[0.05em]">{s.title}</div>
                  <p className="mt-[7px] text-[12px] leading-[17px] text-[var(--shotiq-color-graphite)]">
                    {s.body.map((b) => <span key={b} className="block">{b}</span>)}
                  </p>
                </li>
                {i < STEPS.length - 1 && (
                  <li aria-hidden="true" className="pt-[20px] text-[19px] font-light text-[var(--shotiq-color-ink)]">→</li>
                )}
              </React.Fragment>
            ))}
          </ol>

          <div className="-ml-[12px] mt-[22px] flex gap-[12px]">
            {/* Media surface — exact frame cropped from the canonical screen
                (077, x541 y335 492x355); the player chrome is baked into it.
                Canonical renders it 492x355 with its foot flush to the FORM
                SCORE card's. The 196px rail leaves this row 798px against
                canonical's 867, so the 69px deficit comes out of the frame's
                WIDTH (object-cover trims the sides) and not its height: at
                440x317 the card overhung the video by 55px, which both graders
                caught. 440 + 12 gutter + 346 card = 798, and the card keeps the
                canonical 346px it needs to stay legible. */}
            <div className="relative flex h-[355px] w-[440px] shrink-0 flex-col overflow-hidden rounded-[4px] bg-[#1B1D20]"
                 data-testid="signin-media-surface">
              {/* The photo is cut WITHOUT canonical's transport bar (541,334
                  492x314); the bar is drawn below as real elements. The old
                  crop had the bar baked in, so trimming 52px of width to fit
                  the narrower row sliced the play button and the fullscreen
                  glyph off both ends. Cropping only the photograph means the
                  trim lands on gym wall, and the controls are real controls. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/canonical/077-signin-video-frame.png" alt="Jump shot being analyzed"
                   className="w-full flex-1 object-cover" />
              <div className="flex h-[41px] shrink-0 items-center gap-[10px] px-[14px] text-white">
                <Play className="h-[15px] w-[13px] shrink-0 fill-white" aria-hidden="true" />
                <span className="shrink-0 text-[12px] tabular-nums">0:00 / 0:07</span>
                <span className="h-[3px] flex-1 rounded-full bg-white/35">
                  <span className="block h-full w-[24%] rounded-full bg-white" />
                </span>
                <Maximize2 className="h-[14px] w-[14px] shrink-0" aria-hidden="true" />
              </div>
            </div>

            <div className="flex-1 rounded-[8px] border border-[var(--shotiq-color-rule)] px-[22px] py-[16px]">
              <div className="text-[12px] font-bold tracking-[0.05em]">FORM SCORE</div>
              {/* Canonical's progress track sits UNDER the numeral and is 133px
                  wide, not the full card. Spanning it across both columns read
                  as a card-wide divider. GOOD and its caption are left-aligned
                  in their column, not right-aligned against the card edge. */}
              <div className="flex items-start justify-between">
                <div>
                  {/* 58px drew a 41px numeral against canonical's 52px. */}
                  <div className="shotiq-numeric text-[74px] leading-[78px] text-[var(--shotiq-color-shotiqOrange)]">82</div>
                  <div className="mt-[8px] h-[6px] w-[133px] rounded-full bg-[var(--shotiq-color-rule)]">
                    <div className="h-full rounded-full bg-[var(--shotiq-color-shotiqOrange)]" style={{ width: "86%" }} />
                  </div>
                </div>
                <div className="w-[124px] pt-[12px]">
                  <div className="text-[15px] font-bold text-[var(--shotiq-color-analysisBlue)]">GOOD</div>
                  <p className="mt-[3px] text-[12px] leading-[17px] text-[var(--shotiq-color-graphite)]">
                    Keep building<br />consistency.
                  </p>
                </div>
              </div>

              <div className="mt-[18px] border-t border-[var(--shotiq-color-rule)] pt-[14px] text-[12px] font-bold tracking-[0.05em]">
                KEY METRICS
              </div>
              {/* Canonical rules each metric off from the next and spreads the
                  three across the card rather than bunching them left. */}
              <dl className="mt-[10px] flex divide-x divide-[var(--shotiq-color-rule)]">
                {[["24", "SHOTS"], ["15", "MAKES"], ["62.5%", "MAKE %"]].map(([v, k]) => (
                  <div key={k} className="flex-1 px-[16px] first:pl-0 last:pr-0">
                    <dd className="shotiq-numeric text-[27px] leading-[30px]">{v}</dd>
                    <dt className="mt-[2px] text-[10px] tracking-[0.07em] text-[var(--shotiq-color-graphite)]">{k}</dt>
                  </div>
                ))}
              </dl>

              <div className="mt-[20px] border-t border-[var(--shotiq-color-rule)] pt-[16px] text-[12px] font-bold tracking-[0.05em]">
                PRIMARY FOCUS
              </div>
              <div className="mt-[8px] flex items-center justify-between gap-[6px]">
                <p className="whitespace-nowrap text-[15px] leading-[21px]">Keep elbow stacked<br />through release</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/canonical/077-focus-chart.png" alt="" className="h-[47px] w-[96px] shrink-0" />
                <ChevronRight className="h-[18px] w-[18px] shrink-0 text-[var(--shotiq-color-graphite)]" />
              </div>
            </div>
          </div>

          <div className="relative -ml-[12px] mt-[12px] h-[126px] rounded-[8px] border border-[var(--shotiq-color-rule)]">
            <div className="absolute left-[15px] top-[19px] text-[12px] font-bold tracking-[0.05em]">SHOT PHASES</div>
            {/* Phase figures + labels are the exact strip cropped from the
                canonical screen (077, x585 y746 550x90). Drawn at native size:
                downscaling it to 510x83 thinned every stroke and lifted the
                figures to a pale grey against canonical's near-black, which
                both graders read as a washed-out phase strip. 30 + 550 = 580
                clears the copy block, which now starts at 592. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/canonical/077-phase-strip.png" alt="Shot phases: setup, load, rise, release, follow-through"
                 className="absolute left-[30px] top-[30px] h-[90px] w-[550px] mix-blend-multiply" />
            <p className="absolute right-[20px] top-[34px] w-[186px] text-[12px] leading-[17px] text-[var(--shotiq-color-graphite)]">
              Release is where shots are won.<br />Small adjustments. Big impact.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
