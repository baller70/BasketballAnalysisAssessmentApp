"use client"

/**
 * /signup — canonical create-account screen.
 *
 * The route draws TWO screens. Above 768px it is the desktop create-account
 * adaptation (no canonical was supplied for it; the canonical desktop set is
 * 077-096), and below 768px it is canonical iOS 004-create-account, whose
 * geometry and type live in `phone-004.ts` and whose drawn marks live in
 * `Marks004.tsx`. The two disagree on layout, on which controls exist and on
 * copy, so the phone rendering is an absolutely-positioned layer inside
 * `@media (max-width: 767.98px)` — the same treatment `/signin` uses for 003.
 * Above that breakpoint not one declaration in `PHONE_CSS` matches.
 *
 * The page keeps ONE set of form controls. A second, phone-only form would put
 * two `[data-testid=signup-email]` and two `[data-testid=signup-submit]` in the
 * DOM and the e2e specs resolve by test id, so they would fail Playwright's
 * strict mode. The controls are shared; only their geometry is re-authored.
 *
 * The preserved domain behaviour is unchanged: `useAuthStore.signUp` with the
 * same validation rules, then `window.location.assign("/onboarding")`.
 */

import React, { useState, useRef } from "react"
import Link from "next/link"
import { useAuthStore } from "@/stores/authStore"
import { UnifiedSidebar } from "@/components/shotiq/ShotIQShell"
import { Eye, EyeOff, Loader2, ChevronDown } from "lucide-react"
import { PHONE_CSS } from "./phone-004"
import { Marks004, Monogram, EyeMark004, FocusMark004, ShareMark } from "./Marks004"

/** Canonical 004 sets the helper under PASSWORD as "Use at least 8
 *  characters.", and the client gate is moved with it so the screen does not
 *  state a rule it will not enforce. The API's own floor is unchanged. */
const MIN_PASSWORD = 8

export default function SignUpPage() {
  const { signUp, isLoading } = useAuthStore()

  const [formData, setFormData] = useState({
    email: "", password: "", confirmPassword: "", firstName: "", lastName: "",
  })
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)

  // --- preserved account-creation behaviour --------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.email || !formData.password) {
      setError("Email and password are required")
      emailRef.current?.focus()
      return
    }
    if (formData.password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters`)
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (!agreed) {
      setError("Please agree to the Terms of Use and Privacy Policy")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await signUp(
        formData.email,
        formData.password,
        formData.firstName || undefined,
        formData.lastName || undefined
      )
      if (result.success) {
        // signUp already awaited the API response, so the httpOnly session
        // cookie is set by the time we get here — navigate immediately, no race.
        window.location.assign("/onboarding")
      } else {
        setError(result.error || "Sign up failed")
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
      data-testid="screen-desktop-web-create-account"
      className="s4 shotiq-canonical mx-auto flex w-full max-w-[1440px] flex-col bg-[var(--shotiq-color-paper)] text-[var(--shotiq-color-ink)]"
      style={{ minHeight: 900 }}
    >
      <style dangerouslySetInnerHTML={{ __html: PHONE_CSS }} />
      <Marks004 agreed={agreed} />

      {/* Canonical 004 draws NO topbar rule — row-segmenting it at threshold
          0.02 finds no ink between y72 and y161 — so the desktop header's
          border is switched off on the phone rather than restyled. */}
      <header data-s4-contents
              className="flex h-[39px] shrink-0 items-center justify-between border-b border-[var(--shotiq-color-rule)] pl-[18px] pr-[18px] md:h-[57px] md:pl-[20px] md:pr-[24px]"
              data-testid="region-topbar">
        <span data-s4="wordmark"
              className="shotiq-wordmark text-[18px] leading-none tracking-[0.02em] md:text-[21px]">
          SHOT<span data-s4-iq className="text-[var(--shotiq-color-shotiqOrange)]">IQ</span>
        </span>
        <div className="hidden items-center gap-[10px] md:flex">
          <span className="grid h-[34px] w-[34px] place-items-center rounded-full bg-[var(--shotiq-color-rule)] text-[12px] font-bold text-[var(--shotiq-color-graphite)]">JE</span>
          <span className="text-[15px]">Jordan Ellis</span>
          <ChevronDown className="h-[16px] w-[16px] text-[var(--shotiq-color-graphite)]" />
        </div>
      </header>

      <div data-s4-contents className="flex flex-1">
        {/* One menu sidebar app-wide — this screen used to draw its own 10-item
            112px rail. See the same note on /signin. */}
        <UnifiedSidebar />

        <section data-s4-contents className="w-[430px] shrink-0 border-r-0 border-[var(--shotiq-color-rule)] px-[18px] pb-[40px] pt-[28px] md:border-r md:px-[46px] md:pt-[48px]"
                 data-testid="region-main">
          <h1 data-s4="display" className="shotiq-display text-[46px] leading-[50px]">CREATE ACCOUNT</h1>
          {/* The phone lede is TWO runs, not one with a line-height: a line box
              quantises to two device rows, so a single element cannot land
              canonical's L1->L2 baseline delta. Placed independently each line
              gets its own one-device-px lattice. Phone-only — the desktop copy
              below is untouched. */}
          <p data-s4-contents className="mt-[10px] text-[15px] leading-[21px] text-[var(--shotiq-color-graphite)]">
            <span className="md:hidden">
              <span data-s4="lede1">Create your ShotIQ account to save analyses,</span>
              <span data-s4="lede2">training, goals, and progress.</span>
            </span>
            <span className="hidden md:inline">
              Create your ShotIQ account to save analyses, training, goals, and progress.
            </span>
          </p>
          <p data-s4-contents className="mt-[14px] flex items-center gap-[10px] text-[14px]">
            {/* Canonical draws the monogram as geometry, not as type in a
                dashed box: one 60.6-unit crossbar, a J stem hooking left and
                three E arms. The desktop chip is kept and hidden on the phone. */}
            <span data-s4-off className="grid h-[30px] w-[30px] place-items-center rounded-[6px] border border-dashed border-[var(--shotiq-color-ink)] text-[11px] font-bold">JE</span>
            <span data-s4="monogram" className="md:hidden"><Monogram /></span>
            <span data-s4="oneacct">One account across web and iOS.</span>
          </p>

          <form data-s4-contents onSubmit={handleSubmit} className="mt-[24px]" noValidate>
            <div data-s4-contents className="grid grid-cols-2 gap-[14px]">
              <div data-s4-contents>
                <label htmlFor="firstName" data-s4="labFirst" className={label}>FIRST NAME</label>
                <input id="firstName" data-testid="signup-first-name"
                       data-s4="valFirst"
                       className={`${field} mt-[8px]`} placeholder="Jordan"
                       value={formData.firstName}
                       onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
              </div>
              <div data-s4-contents>
                <label htmlFor="lastName" data-s4="labLast" className={label}>LAST NAME</label>
                <input id="lastName" data-testid="signup-last-name"
                       data-s4="valLast"
                       className={`${field} mt-[8px]`} placeholder="Ellis"
                       value={formData.lastName}
                       onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
              </div>
            </div>

            <label htmlFor="email" data-s4="labEmail" className={`${label} mt-[18px] block`}>EMAIL</label>
            <input id="email" ref={emailRef} type="email" autoComplete="email" data-testid="signup-email"
                   data-s4="valEmail"
                   className={`${field} mt-[8px]`} placeholder="jordan.ellis@example.com"
                   value={formData.email}
                   onChange={(e) => setFormData({ ...formData, email: e.target.value })} />

            <label htmlFor="password" data-s4="labPass" className={`${label} mt-[18px] block`}>PASSWORD</label>
            <div data-s4-contents className="relative mt-[8px]">
              <input id="password" type={showPassword ? "text" : "password"}
                     autoComplete="new-password" data-testid="signup-password"
                     data-s4="valPass"
                     className={`${field} pr-[44px]`} placeholder="Create a password"
                     value={formData.password}
                     onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      data-s4="eyePass"
                      className="absolute right-[13px] top-1/2 -translate-y-1/2 text-[var(--shotiq-color-graphite)]">
                <span className="hidden md:inline">
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </span>
                <span className="block h-full w-full md:hidden"><EyeMark004 off={!showPassword} /></span>
              </button>
            </div>
            <p data-s4="helpPass" className="mt-[6px] text-[12px] text-[var(--shotiq-color-graphite)]">Use at least {MIN_PASSWORD} characters.</p>

            <label htmlFor="confirmPassword" data-s4="labConfirm" className={`${label} mt-[16px] block`}>CONFIRM PASSWORD</label>
            <div data-s4-contents className="relative mt-[8px]">
              <input id="confirmPassword" type={showConfirm ? "text" : "password"}
                     autoComplete="new-password" data-testid="signup-confirm-password"
                     data-s4="valConfirm"
                     className={`${field} pr-[44px]`} placeholder="Repeat your password"
                     value={formData.confirmPassword}
                     onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                      data-s4="eyeConfirm"
                      className="absolute right-[13px] top-1/2 -translate-y-1/2 text-[var(--shotiq-color-graphite)]">
                <span className="hidden md:inline">
                  {showConfirm ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </span>
                <span className="block h-full w-full md:hidden"><EyeMark004 off={!showConfirm} /></span>
              </button>
            </div>

            <label data-s4-contents className="mt-[18px] flex items-start gap-[10px] text-[13px] leading-[18px]">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                     data-testid="signup-agree"
                     data-s4="checkbox"
                     className="mt-[2px] h-[15px] w-[15px] rounded-[3px] border border-[var(--shotiq-color-rule)] accent-[var(--shotiq-color-confirmGreen)]" />
              <span data-s4="terms">
                I agree to the{" "}
                <Link href="/terms" className="text-[var(--shotiq-color-shotiqOrange)]">Terms of Use</Link> and{" "}
                <Link href="/privacy" className="text-[var(--shotiq-color-shotiqOrange)]">Privacy Policy</Link>.
              </span>
            </label>

            {error && (
              <p role="alert" data-testid="signup-error" data-s4="error"
                 className="mt-[12px] text-[13px] text-[var(--shotiq-color-reviewRed)]">{error}</p>
            )}

            <button type="submit" disabled={busy} data-testid="signup-submit" data-s4="plate"
                    className="mt-[18px] flex h-[46px] w-full items-center justify-center gap-2 rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] text-[15px] font-medium text-white disabled:opacity-70">
              {busy && <Loader2 className="h-[16px] w-[16px] animate-spin" />}
              {/* canonical 004 leads the primary action with the capture frame,
                  the same mark 003 sets on its Sign in plate */}
              <span data-s4="focus" className="md:hidden"><FocusMark004 /></span>
              <span data-s4="createLab">{busy ? "Creating account…" : "Create account"}</span>
            </button>
          </form>

          <div data-s4-contents className="mt-[22px] flex items-center gap-[14px]">
            <span data-s4-off className="h-px flex-1 bg-[var(--shotiq-color-rule)]" />
            <span data-s4="orLab" className="text-[11px] tracking-[0.09em] text-[var(--shotiq-color-graphite)]">OR</span>
            <span data-s4-off className="h-px flex-1 bg-[var(--shotiq-color-rule)]" />
          </div>

          <Link href="/signin" data-s4="signinBox"
                className="mt-[16px] flex h-[46px] w-full items-center justify-center rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white text-[15px]">
            <span data-s4="shareMark" className="md:hidden"><ShareMark /></span>
            <span data-s4="signinLab">Sign in</span>
          </Link>
        </section>

        {/* marketing rail mirrors the sign-in screen */}
        <section className="hidden flex-1 px-[48px] pt-[58px] md:block">
          <h2 className="shotiq-display text-[40px] leading-[44px]">
            SAVE EVERY REP.<br />SEE EVERY GAIN.
          </h2>
          <p className="mt-[12px] max-w-[420px] text-[15px] leading-[22px] text-[var(--shotiq-color-graphite)]">
            Your analyses, drills, goals and badges stay in sync across every device
            the moment you create an account.
          </p>
          <div className="mt-[28px] grid max-w-[520px] grid-cols-2 gap-[14px]">
            {[["ANALYZE", "AI scores every shot phase."],
              ["TRAIN", "Personalized drills that target your flaws."],
              ["TRACK", "Progress, streaks and goals over time."],
              ["COMPARE", "Reference elite shooter mechanics."]].map(([t, d]) => (
              <div key={t} className="rounded-[8px] border border-[var(--shotiq-color-rule)] p-[16px]">
                <div className="text-[13px] font-bold tracking-[0.05em]">{t}</div>
                <p className="mt-[4px] text-[12px] text-[var(--shotiq-color-graphite)]">{d}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
