"use client"

/**
 * /forgot-password — canonical white treatment (was the legacy black screen).
 * The request flow is preserved verbatim: CSRF-protected POST to
 * /api/auth/forgot-password, neutral success copy, dev-only reset link echo.
 */

import React, { useState } from "react"
import Link from "next/link"
import { Loader2, ArrowLeft } from "lucide-react"

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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [devResetUrl, setDevResetUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")
    setDevResetUrl("")

    if (!email) {
      setError("Email is required")
      return
    }

    setIsSubmitting(true)
    try {
      const csrfToken = await getCsrfToken()
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        credentials: "include",
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.")
      } else {
        setMessage(
          data.message ||
            "If an account exists for that email, a password reset link has been sent."
        )
        // Dev-only convenience: server echoes the reset link when not in prod.
        if (typeof data.devResetUrl === "string") setDevResetUrl(data.devResetUrl)
      }
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      data-testid="screen-desktop-web-forgot-password"
      className="shotiq-canonical flex min-h-screen items-center justify-center bg-[var(--shotiq-color-paper)] px-6 py-12 text-[var(--shotiq-color-ink)]"
    >
      <div className="w-full max-w-[420px]">
        <span className="shotiq-wordmark block text-center text-[30px] leading-none">
          SHOT<span className="text-[var(--shotiq-color-shotiqOrange)]">IQ</span>
        </span>

        <h1 className="shotiq-display mt-[26px] text-center text-[40px] leading-[44px]">RESET YOUR PASSWORD</h1>
        <p className="mt-[10px] text-center text-[14px] leading-[20px] text-[var(--shotiq-color-graphite)]">
          Enter your email and we&apos;ll send you a link to get back into your account.
        </p>

        <form onSubmit={handleSubmit} noValidate
              className="mt-[24px] rounded-[8px] border border-[var(--shotiq-color-rule)] bg-white p-[24px]">
          <label htmlFor="email" className="text-[12px] font-bold tracking-[0.04em]">EMAIL</label>
          <input id="email" type="email" autoComplete="email" data-testid="forgot-email"
                 value={email} onChange={(e) => setEmail(e.target.value)}
                 placeholder="Enter your email"
                 className="mt-[8px] h-[46px] w-full rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white px-[14px] text-[15px] outline-none placeholder:text-[var(--shotiq-color-muted)] focus:border-[var(--shotiq-color-ink)]" />

          {error && (
            <p role="alert" className="mt-[12px] text-[13px] text-[var(--shotiq-color-reviewRed)]">{error}</p>
          )}
          {message && (
            <p className="mt-[12px] text-[13px] text-[var(--shotiq-color-confirmGreen)]">{message}</p>
          )}
          {devResetUrl && (
            <p className="mt-[8px] break-all text-[12px] text-[var(--shotiq-color-graphite)]">
              Dev reset link:{" "}
              <a className="text-[var(--shotiq-color-analysisBlue)]" href={devResetUrl}>{devResetUrl}</a>
            </p>
          )}

          <button type="submit" disabled={isSubmitting} data-testid="forgot-submit"
                  className="mt-[16px] flex h-[46px] w-full items-center justify-center gap-2 rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] text-[15px] font-medium text-white disabled:opacity-70">
            {isSubmitting && <Loader2 className="h-[16px] w-[16px] animate-spin" />}
            {isSubmitting ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <Link href="/signin"
              className="mt-[18px] flex items-center justify-center gap-2 text-[13px] text-[var(--shotiq-color-graphite)] hover:text-[var(--shotiq-color-shotiqOrange)]">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </div>
    </div>
  )
}
