"use client"

/**
 * /reset-password — canonical white treatment (was the legacy black screen).
 * Flow preserved verbatim: token from the query string, CSRF-protected POST
 * to /api/auth/reset-password, then redirect to sign-in.
 */

import React, { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, ArrowLeft, Eye, EyeOff, CheckCircle2 } from "@/components/shotiq/ApprovedLucide"

async function getCsrfToken(): Promise<string> {
  try {
    const res = await fetch("/api/auth/csrf", { method: "GET", credentials: "include" })
    if (!res.ok) return ""
    const data = await res.json()
    return typeof data?.csrfToken === "string" ? data.csrfToken : ""
  } catch {
    return ""
  }
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!token) {
      setError("This reset link is invalid. Please request a new one.")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsSubmitting(true)
    try {
      const csrfToken = await getCsrfToken()
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        credentials: "include",
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.")
        setIsSubmitting(false)
      } else {
        setDone(true)
        setTimeout(() => router.push("/signin"), 2000)
      }
    } catch {
      setError("An unexpected error occurred")
      setIsSubmitting(false)
    }
  }

  const field =
    "h-[46px] w-full rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white px-[14px] " +
    "text-[15px] outline-none placeholder:text-[var(--shotiq-color-muted)] focus:border-[var(--shotiq-color-ink)]"

  return (
    <div className="rounded-[8px] border border-[var(--shotiq-color-rule)] bg-white p-[24px]">
      {done ? (
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-[var(--shotiq-color-confirmGreen)]" />
          <p className="text-[14px] text-[var(--shotiq-color-graphite)]">
            Your password has been reset. Redirecting you to sign in…
          </p>
          <Link href="/signin" className="inline-block text-[14px] font-medium text-[var(--shotiq-color-shotiqOrange)]">
            Go to sign in now
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="password" className="text-[12px] font-bold tracking-[0.04em]">NEW PASSWORD</label>
          <div className="relative mt-[8px]">
            <input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password"
                   data-testid="reset-password" value={password}
                   onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters"
                   className={`${field} pr-[44px]`} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-[13px] top-1/2 -translate-y-1/2 text-[var(--shotiq-color-graphite)]">
              {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          </div>

          <label htmlFor="confirm" className="mt-[16px] block text-[12px] font-bold tracking-[0.04em]">CONFIRM PASSWORD</label>
          <input id="confirm" type={showPassword ? "text" : "password"} autoComplete="new-password"
                 data-testid="reset-confirm" value={confirmPassword}
                 onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat your new password"
                 className={`${field} mt-[8px]`} />

          {error && (
            <p role="alert" className="mt-[12px] text-[13px] text-[var(--shotiq-color-reviewRed)]">{error}</p>
          )}

          <button type="submit" disabled={isSubmitting} data-testid="reset-submit"
                  className="mt-[16px] flex h-[46px] w-full items-center justify-center gap-2 rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] text-[15px] font-medium text-white disabled:opacity-70">
            {isSubmitting && <Loader2 className="h-[16px] w-[16px] animate-spin" />}
            {isSubmitting ? "Resetting…" : "Reset password"}
          </button>
        </form>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div
      data-testid="screen-desktop-web-reset-password"
      className="shotiq-canonical flex min-h-screen items-center justify-center bg-[var(--shotiq-color-paper)] px-6 py-12 text-[var(--shotiq-color-ink)]"
    >
      <div className="w-full max-w-[420px]">
        <span className="shotiq-wordmark block text-center text-[25px] leading-none">
          SHOT<span className="text-[var(--shotiq-color-shotiqOrange)]">IQ</span>
        </span>
        {/* Canonical 007 reads "RESET PASSWORD", not "CHOOSE A NEW PASSWORD",
            over two lines, cap 84 of the 853px art = 38.7 CSS px, so
            38.7/0.705 = 54.9px. The shipped 40px drew cap 61, 73% of
            canonical. No desktop canonical exists for this route. */}
        <h1 className="shotiq-display mt-[26px] text-center text-[54.9px] leading-[57px]">RESET PASSWORD</h1>
        <p className="mt-[10px] text-center text-[14px] text-[var(--shotiq-color-graphite)]">
          Pick something strong you haven&apos;t used before.
        </p>
        <div className="mt-[24px]">
          <Suspense>
            <ResetPasswordForm />
          </Suspense>
        </div>
        <Link href="/signin"
              className="mt-[18px] flex items-center justify-center gap-2 text-[13px] text-[var(--shotiq-color-graphite)] hover:text-[var(--shotiq-color-shotiqOrange)]">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </div>
    </div>
  )
}
