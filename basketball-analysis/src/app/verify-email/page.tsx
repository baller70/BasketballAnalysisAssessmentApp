"use client"

/**
 * /verify-email — canonical web counterpart of iOS 005-verify-email.
 *
 * Web verification is link-based (the emailed link hits
 * /api/auth/verify-email?token=… which redirects back here with ?status=…),
 * so instead of the iOS code boxes this page shows the signed-in user's
 * verification state, the result of a clicked link, resend with a cooldown,
 * and the same "didn't get the email?" help list.
 */

import React, { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Loader2, ArrowLeft, MailCheck, MailWarning, ShieldCheck, CheckCircle2, ChevronRight } from "lucide-react"
import { csrfFetch } from "@/lib/api/csrfFetch"

function VerifyEmailBody() {
  const params = useSearchParams()
  // "success" | "invalid" | "error" arrives from the emailed-link redirect.
  const linkStatus = params.get("status")

  const [email, setEmail] = useState<string | null>(null)
  const [verified, setVerified] = useState<boolean | null>(null)
  const [signedOut, setSignedOut] = useState(false)
  const [resend, setResend] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    fetch("/api/auth/resend-verification", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => { setEmail(d.email ?? null); setVerified(!!d.verified) })
      .catch(() => setSignedOut(true))
  }, [linkStatus])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const resendEmail = async () => {
    setResend("sending")
    try {
      const res = await csrfFetch("/api/auth/resend-verification", { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success) throw new Error(data?.error || "send failed")
      if (data.alreadyVerified) { setVerified(true); setResend("idle"); return }
      setResend("sent")
      setCooldown(60)
    } catch {
      setResend("error")
    }
    setTimeout(() => setResend((s) => (s === "sending" ? s : "idle")), 4000)
  }

  const isVerified = verified === true || linkStatus === "success"
  const linkFailed = linkStatus === "invalid" || linkStatus === "error"

  return (
    <div className="w-full max-w-[440px]">
      <span className="shotiq-wordmark block text-center text-[25px] leading-none">
        SHOT<span className="text-[var(--shotiq-color-shotiqOrange)]">IQ</span>
      </span>
      <h1 className="shotiq-display mt-[26px] text-center text-[40px] leading-[44px]">VERIFY YOUR EMAIL</h1>

      <div className="mt-[24px] rounded-[8px] border border-[var(--shotiq-color-rule)] bg-white p-[24px]">
        {isVerified ? (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-[var(--shotiq-color-confirmGreen)]" />
            <p className="text-[15px] font-semibold">Your email is verified.</p>
            <p className="text-[13px] text-[var(--shotiq-color-graphite)]">
              {email ? <>You&apos;re all set, <span className="font-medium">{email}</span>.</> : "You're all set."}
            </p>
            <Link href="/dashboard" data-testid="verify-continue"
                  className="mx-auto flex h-[44px] w-full max-w-[280px] items-center justify-center rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] text-[14px] font-medium text-white">
              Continue to dashboard
            </Link>
          </div>
        ) : (
          <>
            {linkFailed && (
              <p role="alert" className="mb-[14px] flex items-start gap-[8px] rounded-[6px] border border-[var(--shotiq-color-reviewRed)] p-[10px] text-[13px] text-[var(--shotiq-color-reviewRed)]">
                <MailWarning className="mt-[1px] h-[16px] w-[16px] shrink-0" />
                That verification link is invalid or has expired. Send yourself a fresh one below.
              </p>
            )}
            <p className="text-center text-[14px] leading-[20px] text-[var(--shotiq-color-graphite)]">
              {signedOut ? (
                <>Sign in, then open this page to send yourself a verification link.</>
              ) : email ? (
                <>We sent a verification link to <span className="font-semibold text-[var(--shotiq-color-ink)]">{email}</span>. Open it to confirm your account.</>
              ) : (
                <>We sent a verification link to your email. Open it to confirm your account.</>
              )}
            </p>

            {signedOut ? (
              <Link href="/signin" data-testid="verify-signin"
                    className="mt-[16px] flex h-[44px] w-full items-center justify-center rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] text-[14px] font-medium text-white">
                Go to sign in
              </Link>
            ) : (
              <button type="button" onClick={resendEmail} data-testid="verify-resend"
                      disabled={resend === "sending" || cooldown > 0}
                      className="mt-[16px] flex h-[44px] w-full items-center justify-center gap-2 rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] text-[14px] font-medium text-white disabled:opacity-60">
                {resend === "sending" && <Loader2 className="h-[15px] w-[15px] animate-spin" />}
                {cooldown > 0 ? `Resend available in 0:${String(cooldown).padStart(2, "0")}`
                  : resend === "sending" ? "Sending…" : resend === "sent" ? "Email sent ✓" : "Resend email"}
              </button>
            )}
            {resend === "error" && (
              <p role="alert" className="mt-[8px] text-center text-[13px] text-[var(--shotiq-color-reviewRed)]">
                Could not send the email. Try again shortly.
              </p>
            )}

            <div className="mt-[20px] border-t border-[var(--shotiq-color-rule)] pt-[14px]">
              <div className="text-[11px] font-bold tracking-[0.05em] text-[var(--shotiq-color-graphite)]">DIDN&apos;T GET THE EMAIL?</div>
              <div className="mt-[4px] divide-y divide-[var(--shotiq-color-rule)]">
                {[
                  [<MailCheck key="i" className="h-[16px] w-[16px]" />, "Check your spam or promotions folder"],
                  [<MailWarning key="i" className="h-[16px] w-[16px]" />, "Wait a few minutes and tap “Resend email”"],
                ].map(([icon, text], i) => (
                  <div key={i} className="flex items-center gap-[10px] py-[9px] text-[13px]">
                    <span className="text-[var(--shotiq-color-graphite)]">{icon}</span>
                    <span className="flex-1">{text}</span>
                    <ChevronRight className="h-[13px] w-[13px] text-[var(--shotiq-color-muted)]" />
                  </div>
                ))}
                <Link href="/guide" className="flex items-center gap-[10px] py-[9px] text-[13px]">
                  <span className="text-[var(--shotiq-color-graphite)]"><ShieldCheck className="h-[16px] w-[16px]" /></span>
                  <span className="flex-1">Need help? See the guide</span>
                  <ChevronRight className="h-[13px] w-[13px] text-[var(--shotiq-color-muted)]" />
                </Link>
              </div>
            </div>

            <div className="mt-[14px] flex items-center gap-[10px] rounded-[6px] bg-[var(--shotiq-color-warmCanvas)] p-[10px]">
              <ShieldCheck className="h-[18px] w-[18px] shrink-0 text-[var(--shotiq-color-confirmGreen)]" />
              <div>
                <div className="text-[13px] font-semibold">Your account is safe</div>
                <div className="text-[11px] text-[var(--shotiq-color-graphite)]">We&apos;ll never share your email or data.</div>
              </div>
            </div>
          </>
        )}
      </div>

      <Link href="/dashboard"
            className="mt-[18px] flex items-center justify-center gap-2 text-[13px] text-[var(--shotiq-color-graphite)] hover:text-[var(--shotiq-color-shotiqOrange)]">
        <ArrowLeft className="h-4 w-4" /> Back to the app
      </Link>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <div
      data-testid="screen-desktop-web-verify-email"
      className="shotiq-canonical flex min-h-screen items-center justify-center bg-[var(--shotiq-color-paper)] px-6 py-12 text-[var(--shotiq-color-ink)]"
    >
      <Suspense>
        <VerifyEmailBody />
      </Suspense>
    </div>
  )
}
