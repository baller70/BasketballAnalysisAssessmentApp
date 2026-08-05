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
import { UnifiedSidebar, PageTitle, ResponsiveTitle } from "@/components/shotiq/ShotIQShell"
import { Eye, EyeOff, Loader2, ChevronDown, ChevronRight, Play, Maximize } from "lucide-react"
import { PHONE_CSS } from "./phone-003"
import { Marks003, EyeMark, FocusMark } from "./Marks003"

const STEPS = [
  { title: "CAPTURE", body: ["Record from any angle", "with your phone."], icon: "/images/canonical/077-step-capture.png" },
  { title: "ANALYZE", body: ["AI detects mechanics and", "scores your shot."], icon: "/images/canonical/077-step-analyze.png" },
  { title: "TRAIN", body: ["Get personalized drills", "to improve faster."], icon: "/images/canonical/077-step-train.png" },
  { title: "TRACK", body: ["Monitor progress and", "stay on target."], icon: "/images/canonical/077-step-track.png" },
]


/** Apple wordmark glyph, drawn inline (canonical 077 leads each SSO button
 *  with the provider's own mark).
 *
 *  Both marks are SHARED DOM — they render at 1440pt as well as at 393pt — so
 *  the ink corrections iOS 003 needs are NOT made here. `fill` and
 *  `stroke-width` are left at the values desktop 077 was graded on and the
 *  phone values are set from inside `PHONE_CSS`, which is inside
 *  `@media (max-width: 767.98px)`. Making them here instead moved 163 px of
 *  desktop 077 away from canonical (mean |d| in the Apple mark's box 32.567 ->
 *  33.671), which is exactly the standing ruling against solving a screen's
 *  disagreement on a shared token. The Google paths carry `stroke` permanently
 *  at `stroke-width="0"`: a zero-width stroke paints nothing, so desktop is
 *  untouched, and the phone raises only the width. */
function AppleMark() {
  return (
    <svg width="17" height="20" viewBox="0 0 17 20" aria-hidden="true" className="shrink-0">
      <path fill="#111111" d="M13.9 10.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.9-3-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.2 0 2-1.1 2.8-2.2.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.6Z"/>
      <path fill="#111111" d="M11.6 3.8c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.7 1.4-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.5 2.7-1.3Z"/>
    </svg>
  )
}

/** Google "G", four-colour, drawn inline.
 *
 *  These are NOT the official Google brand palette. Canonical does not use it,
 *  on either surface. Measured with a distance-shell plateau estimator — mask
 *  each arc by hue, take the Euclidean distance transform, average only the
 *  shell at d in [3,4) so the read is interior material rather than the
 *  antialiased rim or the unsharp ring — canonical iOS 003 draws:
 *
 *    arc      canonical        official (was)     shipped
 *    red      240.4  55.7 45.1  234  67  53       #F0372D
 *    yellow   252.2 199.7 15.8  251 188   5       #FDC80F
 *    green     32.8 164.4 81.9   52 168  83       #21A552
 *    blue      60.4 135.4 250.4  66 133 244       #3C86FA
 *
 *  Take the plateau, never the most-saturated pixel: canonical is
 *  unsharp-masked, so its extreme pixel is overshoot, not ink (ledger rule 8).
 *  The estimator has no bias of its own — run against our own flat fills it
 *  returns them exactly.
 *
 *  This is not canonical's capture chain. That chain leaves flat fills alone:
 *  on the same image the orange plate reads (251.7, 56.2, 2.1) against our
 *  (253, 55, 1), black (2.2, 1.8, 1.6) against (0,0,0) and white paper
 *  (253.9) against (255) — every one within 2.2 units, where the arcs differ
 *  by 6 to 20 and in different directions per channel (green's R is -19 while
 *  red's R is +6), which no single chain effect produces.
 *
 *  It is corrected HERE, in shared markup, rather than in PHONE_CSS — the
 *  opposite of the fill/stroke corrections below it — because canonical
 *  DESKTOP 077 disagrees with the official palette in the SAME direction:
 *  measured there, green R 32.7 against official 52, yellow G 193.8 against
 *  188, blue B 251.2 against 244. Both canonical surfaces want the same
 *  change, so making it shared moves 077 toward canonical, not away. The phone
 *  values are the ones used because that measurement is far better
 *  conditioned: a 47px mark with 19-52 px in the d[3,4) shell, against a 24px
 *  mark with 4-23 px at d[2,3) on desktop. */
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
      <path fill="#3C86FA" stroke="#3C86FA" strokeWidth="0" d="M45.1 24.5c0-1.6-.1-2.8-.4-4H24v7.5h12.1c-.2 1.9-1.6 4.8-4.5 6.8l-.1.3 6.5 5 .5.1c4.1-3.8 6.6-9.4 6.6-15.7Z"/>
      <path fill="#21A552" stroke="#21A552" strokeWidth="0" d="M24 46c5.9 0 10.9-1.9 14.5-5.3l-6.9-5.4c-1.8 1.3-4.3 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-.3.02-6.7 5.2-.1.3C7.9 41 15.4 46 24 46Z"/>
      <path fill="#FDC80F" stroke="#FDC80F" strokeWidth="0" d="M11.5 28.4c-.5-1.4-.7-2.9-.7-4.4 0-1.5.3-3 .7-4.4v-.3l-6.8-5.3-.2.1A22 22 0 0 0 2 24c0 3.5.9 6.9 2.5 9.9l7-5.5Z"/>
      <path fill="#F0372D" stroke="#F0372D" strokeWidth="0" d="M24 9.5c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 3.4 29.9 1 24 1 15.4 1 7.9 6 4.5 14.1l7 5.5c1.8-5.3 6.7-9.1 12.5-9.1Z"/>
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
  /* Canonical 003 captures the FILLED, validated state: a ring-and-tick beside
     the address, "Looks good." under it and "Password looks good." under the
     mask. Those are live validation, not decoration — they appear when the
     field's own value passes, and they are the phone screen's only feedback
     before submit. Below the tablet breakpoint only; 077 has no such row. */
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email.trim())
  const passwordValid = formData.password.length >= 8
  /* Canonical's field labels are the condensed micro-caps tier: EMAIL cap 11
     over 30px, PASSWORD cap 12 over 54px. The body face at 12px bold drew cap 9
     over 36 and 66 — two short and 20% WIDER, the undersized-and-over-tracked
     signature that means the face is wrong, not just the size. */
  const label = "shotiq-microcaps text-[var(--shotiq-color-ink)]"
  const labelVars = { "--shotiq-microcaps-size": "15px",
                      "--shotiq-microcaps-tracking": "0.10em" } as React.CSSProperties
  /* The border moved from the input to a wrapper so the phone layer can draw
     it as an SVG hairline (Chromium clamps a CSS border to a whole CSS pixel;
     canonical draws 1.85 device px). The wrapper's box is identical to the
     input's old box, so 077 is unchanged. */
  const fieldBox =
    "relative w-full h-[46px] rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white " +
    "focus-within:border-[var(--shotiq-color-ink)]"
  const field =
    "block h-full w-full rounded-[6px] border-0 bg-transparent px-[14px] " +
    "text-[15px] text-[var(--shotiq-color-ink)] placeholder:text-[var(--shotiq-color-muted)] " +
    "outline-none"

  return (
    <div
      data-testid="screen-desktop-web-sign-in"
      className="s3 shotiq-canonical mx-auto flex w-full max-w-[1440px] flex-col bg-[var(--shotiq-color-paper)] text-[var(--shotiq-color-ink)] md:min-h-[900px]"
    >
      <style dangerouslySetInnerHTML={{ __html: PHONE_CSS }} />
      <Marks003 emailOk={emailValid} />

      {/* ---------------------------------------------------------- topbar */}
      <header
        data-s3-contents
        className="flex h-[39px] shrink-0 items-center justify-between border-b border-[var(--shotiq-color-rule)] pl-[18px] pr-[18px] md:h-[57px] md:pl-[20px] md:pr-[24px]"
        data-testid="region-topbar"
      >
        <span data-s3="wordmark"
              className="shotiq-wordmark text-[18px] leading-none tracking-[0.02em] md:text-[21px]">
          SHOT<span data-s3-iq className="text-[var(--shotiq-color-shotiqOrange)]">IQ</span>
        </span>
        {/* Canonical 003 sets the product eyebrow under the wordmark; 077 does
            not draw it at all, so it is phone-only. */}
        <span data-s3="eyebrow" className="md:hidden">AI ANALYSIS</span>

        <div className="hidden items-center md:flex">
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
            <div className="shotiq-microcaps text-[var(--shotiq-color-graphite)]">POINTS</div>
          </div>
          <div className="h-[38px] w-px bg-[var(--shotiq-color-rule)]" />
          <div className="w-[104px] text-center">
            <div className="shotiq-numeric text-[19px] leading-[22px]">6</div>
            <div className="shotiq-microcaps text-[var(--shotiq-color-graphite)]">DAY STREAK</div>
          </div>
        </div>
      </header>

      <div data-s3-contents className="flex flex-1">
        {/* ------------------------------------------------------- sidebar
            The product owner's ruling is one menu sidebar for the whole app —
            no per-screen rail variants. This screen used to draw its own
            10-item 112px rail; it now renders the same `UnifiedSidebar` every
            other screen does. Auth-gated destinations bounce back here via
            middleware, which is app behaviour, not a dead control. */}
        <UnifiedSidebar />

        {/* --------------------------------------------------- form column */}
        <section data-s3-contents className="w-[394px] shrink-0 border-r-0 border-[var(--shotiq-color-rule)] px-[18px] pt-[28px] md:border-r md:px-[46px] md:pt-[48px]">
          {/* 46px drew a 32px cap against canonical's 44px.
              Phone and desktop disagree on both the words and the size, and
              both readings are off the canonical renders: iOS 003 says
              "SIGN IN" at cap 118.86 device px, desktop 077 says
              "WELCOME BACK" at cap 44. The phone size, scale and stroke are
              solved in phone-003.ts; `phoneSize` is therefore NOT passed here,
              because `.shotiq-pt-phone` would emit a competing font-size. */}
          <PageTitle size={63} data-s3="display">
            <ResponsiveTitle phone="SIGN IN" web="WELCOME BACK" />
          </PageTitle>
          {/* The phone lede is TWO runs, not one with a line-height. Canonical's
              L1->L2 baseline delta is 38.12; a single element can only reach 37.00
              or 39.00 because the line box quantises to two device rows, so the
              best a line-height can do is -1.12. Placed independently each line
              lands on its own one-device-px lattice and the delta closes to
              -0.12. Phone-only: this whole branch is `md:hidden`, so 077 keeps
              its own single-line copy untouched. */}
          <p data-s3-contents className="mt-[10px] text-[15px] text-[var(--shotiq-color-graphite)]">
            <span className="md:hidden">
              <span data-s3="body">Continue your training, saved</span>
              <span data-s3="bodyB">analyses, and progress.</span>
            </span>
            <span className="hidden md:inline">Sign in to continue your training.</span>
          </p>

          <form data-s3-contents onSubmit={handleSubmit} className="mt-[30px]" noValidate>
            <label htmlFor="email" data-s3="labelEmail" className={label} style={labelVars}>EMAIL</label>
            <div data-s3-contents className={`${fieldBox} mt-[9px]`}>
              <input id="email" ref={emailRef} type="email" autoComplete="email" data-testid="signin-email"
                     data-s3="valueEmail"
                     className={field} placeholder="Enter your email"
                     value={formData.email}
                     onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            {/* live validation — phone only; see the note by `emailValid` */}
            {emailValid && (
              <p data-s3="helpEmail" data-testid="signin-email-ok" className="md:hidden">Looks good.</p>
            )}

            <label htmlFor="password" data-s3="labelPass" className={`${label} mt-[22px] block`} style={labelVars}>PASSWORD</label>
            <div data-s3-contents className={`${fieldBox} mt-[9px]`}>
              <input id="password" type={showPassword ? "text" : "password"}
                     autoComplete="current-password" data-testid="signin-password"
                     data-s3="valuePass"
                     className={`${field} pr-[44px]`} placeholder="Enter your password"
                     value={formData.password}
                     onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      data-s3="eye"
                      className="absolute right-[13px] top-1/2 -translate-y-1/2 text-[var(--shotiq-color-graphite)]">
                <span className="hidden md:inline">
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </span>
                <span className="block h-full w-full md:hidden"><EyeMark off={showPassword} /></span>
              </button>
            </div>
            {passwordValid && (
              <p data-s3="helpPass" data-testid="signin-password-ok" className="md:hidden">Password looks good.</p>
            )}

            <div data-s3-contents className="mt-[20px] flex items-center justify-between">
              <label data-s3-contents className="flex items-center gap-[9px] text-[13px]">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                       data-s3="checkbox"
                       className="h-[15px] w-[15px] rounded-[3px] border border-[var(--shotiq-color-rule)] accent-[var(--shotiq-color-shotiqOrange)]" />
                <span data-s3="remember">Remember me</span>
              </label>
              <Link href="/forgot-password" data-s3="forgot"
                    className="text-[13px] text-[var(--shotiq-color-analysisBlue)]">
                Forgot password?
              </Link>
            </div>

            {error && (
              <p role="alert" data-testid="signin-error" data-s3="error"
                 className="mt-[14px] text-[13px] text-[var(--shotiq-color-reviewRed)]">{error}</p>
            )}

            <button type="submit" disabled={busy} data-testid="signin-submit" data-s3="plate"
                    className="mt-[20px] flex h-[46px] w-full items-center justify-center gap-2 rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] text-[15px] font-medium text-white disabled:opacity-70">
              {busy && <Loader2 className="h-[16px] w-[16px] animate-spin" />}
              {/* canonical 003 leads the primary action with the capture frame */}
              <span data-s3="focus" className="md:hidden"><FocusMark /></span>
              <span data-s3="signinLab">{busy ? "Signing in…" : "Sign in"}</span>
            </button>
          </form>

          <div data-s3-contents className="mt-[26px] flex items-center gap-[14px]">
            <span data-s3-off className="h-px flex-1 bg-[var(--shotiq-color-rule)]" />
            <span data-s3="or" className="text-[11px] tracking-[0.09em] text-[var(--shotiq-color-graphite)]">
              <span className="md:hidden">OR</span>
              <span className="hidden md:inline">OR CONTINUE WITH</span>
            </span>
            <span data-s3-off className="h-px flex-1 bg-[var(--shotiq-color-rule)]" />
          </div>

          {(["Continue with Apple", "Continue with Google"] as const).map((t, i) => (
            <button key={t} type="button"
                    data-s3={i ? "google" : "apple"}
                    onClick={() => {
                      setError(`${t.replace("Continue with ", "")} sign-in isn't enabled on this server yet — use your email and password.`)
                      emailRef.current?.focus()
                    }}
                    className={`${i ? "mt-[14px]" : "mt-[20px]"} flex h-[46px] w-full items-center justify-center gap-[11px] rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white text-[15px]`}>
              <span data-s3={i ? "googMark" : "appleMark"} className="contents">
                {i ? <GoogleMark /> : <AppleMark />}
              </span>
              <span data-s3={i ? "googLab" : "appleLab"}>{t}</span>
            </button>
          ))}

          <p data-s3-contents className="mt-[26px] text-center text-[13px] text-[var(--shotiq-color-graphite)]">
            {/* Canonical iOS 003 sets a typographic apostrophe (U+2019) here —
                its glyph slants and joins the n, where U+0027 draws an upright
                tick. Desktop 077 is one of the 20 graded screens and is not
                being re-cut in this pass, so the two spellings are split by the
                same breakpoint the rest of this screen's phone/desktop copy
                already uses rather than changing the shared string. */}
            <span data-s3="acct1">
              <span className="md:hidden">Don&rsquo;t have an account?</span>
              <span className="hidden md:inline">Don&apos;t have an account?</span>
            </span>{" "}
            <Link href="/signup" data-s3="acct2" className="text-[var(--shotiq-color-analysisBlue)]">Create account</Link>
          </p>
        </section>

        {/* ------------------------------------------------ marketing rail
            The unified rail is 196px where this screen's own rail was 112px,
            so this column lost 84px. The loss is absorbed by the gutters and
            the media surface (below) rather than by the FORM SCORE card, which
            keeps its canonical 346px width — the card is the dense element and
            is the one that breaks first when squeezed. */}
        <section className="hidden flex-1 px-[32px] pt-[34px] md:block" data-testid="region-main">
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
                  <div className="shotiq-section-label">{s.title}</div>
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
                canonical 346px it needs to stay legible.
                R12: canonical splits its 864px row 495 video : 358 card (57.3% /
                41.4%). At 440 the video held only 55.1%, so it takes its
                proportional 457 here and the card keeps 329. The canonical 1.38
                aspect would need 490px of the 798 available, which would cut the
                card to 296 — 34px under its own proportional share — so the
                aspect closes to 1.29 rather than 1.38 and the rest is rail cost. */}
            <div className="relative flex h-[355px] w-[457px] shrink-0 flex-col overflow-hidden rounded-[4px] bg-[#1B1D20]"
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
                {/* The unfilled part of the track was `bg-white/35` on a
                    `<span>` and did not paint at all: both graders measured the
                    light run at 87px (the fill alone) against canonical's
                    ~309px (x654→963), i.e. ~220px of dead bar. Drawn as a real
                    block with an explicit rgba so the whole track is visible. */}
                <div className="h-[3px] min-w-0 flex-1 rounded-full bg-[rgba(255,255,255,0.45)]">
                  <div className="h-full w-[24%] rounded-full bg-white" />
                </div>
                {/* Canonical draws four corner brackets here, not a diagonal
                    double-arrow. */}
                <Maximize className="h-[14px] w-[14px] shrink-0" aria-hidden="true" />
              </div>
            </div>

            <div className="flex-1 rounded-[8px] border border-[var(--shotiq-color-rule)] px-[22px] py-[16px]">
              <div className="shotiq-section-label">FORM SCORE</div>
              {/* Canonical's progress track sits UNDER the numeral and is 133px
                  wide, not the full card. Spanning it across both columns read
                  as a card-wide divider. GOOD and its caption are left-aligned
                  in their column, not right-aligned against the card edge. */}
              <div className="flex items-start justify-between">
                <div>
                  {/* 58px drew a 41px numeral against canonical's 52px. */}
                  <div className="shotiq-numeric text-[74px] leading-[78px] text-[var(--shotiq-color-shotiqOrange)]">82</div>
                  {/* Canonical's track is 8px (y442-450 core, x1066-1200); 6px drew half stroke. */}
                  <div className="mt-[8px] h-[8px] w-[139px] rounded-full bg-[var(--shotiq-color-rule)]">
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

              <div className="shotiq-section-label mt-[18px] border-t border-[var(--shotiq-color-rule)] pt-[14px]">
                KEY METRICS
              </div>
              {/* Canonical rules each metric off from the next and spreads the
                  three across the card rather than bunching them left. */}
              <dl className="mt-[10px] flex divide-x divide-[var(--shotiq-color-rule)]">
                {[["24", "SHOTS"], ["15", "MAKES"], ["62.5%", "MAKE %"]].map(([v, k]) => (
                  <div key={k} className="flex-1 px-[16px] first:pl-0 last:pr-0">
                    <dd className="shotiq-numeric text-[27px] leading-[30px]">{v}</dd>
                    <dt className="shotiq-microcaps mt-[2px] text-[var(--shotiq-color-graphite)]">{k}</dt>
                  </div>
                ))}
              </dl>

              <div className="shotiq-section-label mt-[20px] border-t border-[var(--shotiq-color-rule)] pt-[16px]">
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
            <div className="shotiq-section-label absolute left-[15px] top-[19px]">SHOT PHASES</div>
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
