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
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/stores/authStore"
import {
  Eye, EyeOff, Loader2, Home, Camera, History, LineChart, Activity,
  Target, Film, Coins, Settings, HelpCircle, ChevronDown, ChevronRight,
  Play, Maximize2,
} from "lucide-react"

const NAV = [
  { label: "Home", icon: Home },
  { label: "Capture", icon: Camera },
  { label: "History", icon: History },
  { label: "Analysis", icon: LineChart },
  { label: "Training", icon: Activity },
  { label: "Goals", icon: Target },
  { label: "Media", icon: Film },
  { label: "Points", icon: Coins },
  { label: "Settings", icon: Settings },
]

const STEPS = [
  { title: "CAPTURE", body: ["Record from any angle", "with your phone."] },
  { title: "ANALYZE", body: ["AI detects mechanics and", "scores your shot."] },
  { title: "TRAIN", body: ["Get personalized drills", "to improve faster."] },
  { title: "TRACK", body: ["Monitor progress and", "stay on target."] },
]

const PHASES = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]

/** Sparkline drawn as data-driven SVG, never a raster. */
function Sparkline({ points, width = 92, height = 34 }: { points: number[]; width?: number; height?: number }) {
  const max = Math.max(...points), min = Math.min(...points)
  const span = max - min || 1
  const coords = points.map((p, i) => [
    (i / (points.length - 1)) * width,
    height - ((p - min) / span) * height,
  ] as const)
  const d = coords.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={d} fill="none" stroke="var(--shotiq-color-ink)" strokeWidth={1.5}
            strokeLinecap="round" strokeLinejoin="round" />
      {coords.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3}
                fill={i === 2 ? "none" : "var(--shotiq-color-ink)"}
                stroke={i === 2 ? "var(--shotiq-color-shotiqOrange)" : "none"}
                strokeWidth={i === 2 ? 2 : 0} />
      ))}
    </svg>
  )
}

export default function SignInPage() {
  const router = useRouter()
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
        router.push(targetUrl)
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
        <span className="shotiq-wordmark text-[26px] leading-none tracking-[0.02em]">
          SHOT<span className="text-[var(--shotiq-color-shotiqOrange)]">IQ</span>
        </span>

        <div className="flex items-center">
          <button type="button" className="flex items-center gap-[10px] pr-[22px]">
            <span className="grid h-[34px] w-[34px] place-items-center overflow-hidden rounded-full bg-[var(--shotiq-color-rule)] text-[12px] font-bold text-[var(--shotiq-color-graphite)]">
              JE
            </span>
            <span className="text-[15px]">Jordan Ellis</span>
            <ChevronDown className="h-[16px] w-[16px] text-[var(--shotiq-color-graphite)]" />
          </button>
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
        {/* ------------------------------------------------------- sidebar */}
        <nav
          className="flex w-[112px] shrink-0 flex-col border-r border-[var(--shotiq-color-rule)] pt-[26px]"
          data-testid="region-sidebar"
          aria-label="Primary"
        >
          {NAV.map(({ label: l, icon: Icon }) => (
            <button key={l} type="button"
                    className="flex h-[48px] items-center gap-[12px] pl-[18px] text-[13px] text-[var(--shotiq-color-ink)]">
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
              <span>{l}</span>
            </button>
          ))}
          <div className="flex-1" />
          <button type="button"
                  className="mb-[26px] flex h-[48px] items-center gap-[12px] pl-[18px] text-[13px] text-[var(--shotiq-color-ink)]">
            <HelpCircle className="h-[18px] w-[18px]" strokeWidth={1.6} />
            <span>Help</span>
          </button>
        </nav>

        {/* --------------------------------------------------- form column */}
        <section className="w-[394px] shrink-0 border-r border-[var(--shotiq-color-rule)] px-[46px] pt-[62px]">
          <h1 className="shotiq-display text-[46px] leading-[50px]">WELCOME BACK</h1>
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

          {["Continue with Apple", "Continue with Google"].map((t, i) => (
            <button key={t} type="button"
                    className={`${i ? "mt-[14px]" : "mt-[20px]"} flex h-[46px] w-full items-center justify-center gap-[11px] rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white text-[15px]`}>
              {t}
            </button>
          ))}

          <p className="mt-[26px] text-center text-[13px] text-[var(--shotiq-color-graphite)]">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[var(--shotiq-color-analysisBlue)]">Create account</Link>
          </p>
        </section>

        {/* ------------------------------------------------ marketing rail */}
        <section className="flex-1 px-[48px] pt-[58px]" data-testid="region-main">
          <h2 className="shotiq-display text-[40px] leading-[44px]">
            AI ANALYSIS. BETTER MECHANICS. BETTER RESULTS.
          </h2>
          <p className="mt-[10px] text-[15px] text-[var(--shotiq-color-graphite)]">
            Capture your shot. Get AI analysis. Follow a plan. Track progress.
          </p>

          <ol className="mt-[34px] flex items-start justify-between pr-[30px]">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.title}>
                <li className="w-[172px] text-center">
                  <div className="mx-auto mb-[16px] h-[40px] w-[40px]">
                    <Sparkline points={[3, 1, 4, 2, 5]} width={40} height={30} />
                  </div>
                  <div className="text-[14px] font-bold tracking-[0.05em]">{s.title}</div>
                  <p className="mt-[7px] text-[12px] leading-[17px] text-[var(--shotiq-color-graphite)]">
                    {s.body.map((b) => <span key={b} className="block">{b}</span>)}
                  </p>
                </li>
                {i < STEPS.length - 1 && (
                  <li aria-hidden="true" className="pt-[16px] text-[18px] text-[var(--shotiq-color-graphite)]">→</li>
                )}
              </React.Fragment>
            ))}
          </ol>

          <div className="mt-[30px] flex gap-[12px]">
            {/* Media surface — a dark surface is permitted here because the
                canonical screen contains a video surface at this position. The
                reference frame is a photographic asset that was not supplied
                with the design package, so only the player chrome is rendered. */}
            <div className="relative h-[360px] w-[495px] shrink-0 overflow-hidden rounded-[4px] bg-[#1B1D20]"
                 data-testid="signin-media-surface">
              <div className="absolute inset-x-0 bottom-0 flex h-[46px] items-center gap-[12px] px-[14px]">
                <Play className="h-[17px] w-[17px] text-white" fill="white" />
                <span className="shotiq-numeric text-[12px] text-white">0:00 / 0:07</span>
                <span className="relative h-[3px] flex-1 rounded-full bg-white/35">
                  <span className="absolute inset-y-0 left-0 w-[28%] rounded-full bg-white" />
                </span>
                <Maximize2 className="h-[15px] w-[15px] text-white" />
              </div>
            </div>

            <div className="flex-1 rounded-[8px] border border-[var(--shotiq-color-rule)] px-[22px] py-[20px]">
              <div className="text-[12px] font-bold tracking-[0.05em]">FORM SCORE</div>
              <div className="flex items-start justify-between">
                <div className="shotiq-numeric text-[58px] leading-[62px] text-[var(--shotiq-color-shotiqOrange)]">82</div>
                <div className="pt-[12px] text-right">
                  <div className="text-[15px] font-bold text-[var(--shotiq-color-analysisBlue)]">GOOD</div>
                  <p className="mt-[3px] text-[12px] leading-[17px] text-[var(--shotiq-color-graphite)]">
                    Keep building<br />consistency.
                  </p>
                </div>
              </div>
              <div className="mt-[10px] h-[6px] w-full rounded-full bg-[var(--shotiq-color-rule)]">
                <div className="h-full rounded-full bg-[var(--shotiq-color-shotiqOrange)]" style={{ width: "82%" }} />
              </div>

              <div className="mt-[22px] border-t border-[var(--shotiq-color-rule)] pt-[16px] text-[12px] font-bold tracking-[0.05em]">
                KEY METRICS
              </div>
              <dl className="mt-[10px] flex">
                {[["24", "SHOTS"], ["15", "MAKES"], ["62.5%", "MAKE %"]].map(([v, k]) => (
                  <div key={k} className="flex-1">
                    <dd className="shotiq-numeric text-[24px] leading-[28px]">{v}</dd>
                    <dt className="mt-[2px] text-[10px] tracking-[0.07em] text-[var(--shotiq-color-graphite)]">{k}</dt>
                  </div>
                ))}
              </dl>

              <div className="mt-[20px] border-t border-[var(--shotiq-color-rule)] pt-[16px] text-[12px] font-bold tracking-[0.05em]">
                PRIMARY FOCUS
              </div>
              <div className="mt-[8px] flex items-center justify-between gap-[10px]">
                <p className="text-[15px] leading-[21px]">Keep elbow stacked<br />through release</p>
                <Sparkline points={[2, 4, 1, 5, 3, 6]} />
                <ChevronRight className="h-[18px] w-[18px] shrink-0 text-[var(--shotiq-color-graphite)]" />
              </div>
            </div>
          </div>

          <div className="mt-[12px] flex items-center rounded-[8px] border border-[var(--shotiq-color-rule)] px-[22px] py-[16px]">
            <div className="w-[110px] text-[12px] font-bold tracking-[0.05em]">SHOT PHASES</div>
            <ol className="flex flex-1 items-end justify-between pr-[26px]">
              {PHASES.map((p) => {
                const active = p === "RELEASE"
                return (
                  <li key={p} className="text-center">
                    <div className="mx-auto mb-[8px] h-[34px] w-[26px]">
                      <Sparkline points={[1, 3, 2, 4]} width={26} height={30} />
                    </div>
                    <div className={`text-[10px] tracking-[0.06em] ${active ? "font-bold text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-graphite)]"}`}>
                      {p}
                    </div>
                    {active && <div className="mx-auto mt-[6px] h-[3px] w-[80px] bg-[var(--shotiq-color-shotiqOrange)]" />}
                  </li>
                )
              })}
            </ol>
            <p className="w-[190px] text-[12px] leading-[17px] text-[var(--shotiq-color-graphite)]">
              Release is where shots are won.<br />Small adjustments. Big impact.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
