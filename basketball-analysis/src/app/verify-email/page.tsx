"use client"

/**
 * /verify-email — canonical iOS 005-verify-email.
 *
 * The route draws TWO screens. Above 768px it is the desktop verify-email
 * adaptation (no canonical was supplied for it; the canonical desktop set is
 * 077-096 and this route is not in it), and below 768px it is canonical iOS
 * 005-verify-email, whose geometry and type live in `phone-005.ts` and whose
 * drawn marks live in `Marks005.tsx`. The phone rendering is an
 * absolutely-positioned layer inside `@media (max-width: 767.98px)` — the same
 * treatment /signin uses for 003 and /signup for 004. Above that breakpoint not
 * one declaration in `PHONE_CSS` matches.
 *
 * ONE SET OF CONTROLS. A second, phone-only form would put two
 * `[data-testid=verify-code-0]` in the DOM and the e2e specs resolve by test
 * id, so they would fail Playwright's strict mode. The controls are shared;
 * only their geometry is re-authored.
 *
 * ---------------------------------------------------------------------------
 * THE SCREEN DESCRIBES A FEATURE THAT NOW EXISTS
 *
 * Canonical 005 draws a six-box numeric code entry. Until this build the
 * product had no such code: `VerificationToken` held an opaque link token,
 * `/api/auth/verify-email` read `?token=`, and a grep for `verificationCode`
 * across the API and the schema returned nothing. Six boxes drawn on top of
 * that would have been six controls no endpoint could answer — precisely the
 * thing the governing rule forbids ("a placeholder portrays a feature I want to
 * be real, so that when the user goes to use it, it actually works").
 *
 * So the feature was built first. `issueEmailCode` puts a six-digit,
 * single-use, 10-minute code in the same table, `sendVerificationEmail` mails
 * it beside the link, and `POST /api/auth/verify-email-code` consumes it and
 * stamps `User.emailVerified`. Both credentials work; neither replaced the
 * other.
 *
 * WHOSE ADDRESS IS SHOWN, and why there are three sources. In order:
 *   1. the signed-in user's own address, from `GET /api/auth/resend-verification`;
 *   2. `sessionStorage['shotiq-pending-email']`, written by /signup the moment
 *      an account is created, so the code screen knows the address even before
 *      the session has settled on a phone;
 *   3. `?email=`, which is how the link in the verification email itself opens
 *      this screen.
 * It is display-only in every case, and the code is checked against the account
 * the server resolves, never against the string in the URL.
 */

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, ArrowLeft, MailCheck, ShieldCheck, CheckCircle2, ChevronRight, Settings } from "@/components/shotiq/ApprovedLucide"
import { csrfFetch } from "@/lib/api/csrfFetch"
import { PHONE_CSS } from "./phone-005"
import {
  Marks005, GearMark, BackMark, EnvelopeMark, EnvelopePencilMark,
  MailCheckMark, MailClockMark, HelpMark, ChevronMark, ShieldMark,
} from "./Marks005"

const CODE_LENGTH = 6
/** Fallback only. The live value is served by the API so the countdown and the
 *  resend rate limit cannot disagree. */
const DEFAULT_COOLDOWN = 60

/**
 * Where "Open email app" goes. A button labelled "Open email app" that does
 * nothing is exactly the placeholder this screen exists to avoid, and on the
 * web there is no generic "open the mail app" verb — so it resolves the
 * player's own provider from the address they gave us and falls back to the
 * `mailto:` handler their OS has registered, which is the closest thing the
 * platform offers.
 */
function inboxUrl(email: string | null): string {
  const domain = (email || "").split("@")[1]?.toLowerCase() || ""
  const known: Record<string, string> = {
    "gmail.com": "https://mail.google.com/mail/u/0/#search/shotiq",
    "googlemail.com": "https://mail.google.com/mail/u/0/#search/shotiq",
    "outlook.com": "https://outlook.live.com/mail/0/inbox",
    "hotmail.com": "https://outlook.live.com/mail/0/inbox",
    "live.com": "https://outlook.live.com/mail/0/inbox",
    "msn.com": "https://outlook.live.com/mail/0/inbox",
    "yahoo.com": "https://mail.yahoo.com/",
    "ymail.com": "https://mail.yahoo.com/",
    "icloud.com": "https://www.icloud.com/mail",
    "me.com": "https://www.icloud.com/mail",
    "mac.com": "https://www.icloud.com/mail",
    "proton.me": "https://mail.proton.me/u/0/inbox",
    "protonmail.com": "https://mail.proton.me/u/0/inbox",
    "aol.com": "https://mail.aol.com/",
    "gmx.com": "https://www.gmx.com/",
    "zoho.com": "https://mail.zoho.com/",
  }
  return known[domain] || "mailto:"
}

function VerifyEmailBody() {
  const params = useSearchParams()
  const router = useRouter()
  // "success" | "invalid" | "error" arrives from the emailed-link redirect.
  const linkStatus = params.get("status")

  const [email, setEmail] = useState<string | null>(null)
  const [verified, setVerified] = useState(false)
  const [code, setCode] = useState<string[]>(() => Array(CODE_LENGTH).fill(""))
  const [focus, setFocus] = useState(-1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [resend, setResend] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [cooldown, setCooldown] = useState(0)
  /** True while the harness pin is in force: the countdown shows a fixed value
   *  and does not tick. See PHONE_CSS's COUNTDOWN note. */
  const [pinned, setPinned] = useState(false)
  /**
   * Where "Continue" goes once the address is verified. A brand-new account
   * still owes onboarding; anyone else belongs on the dashboard.
   *
   * SAME-ORIGIN ONLY, resolved by the URL parser — see the read site below for
   * why a regex was the wrong instrument for this question.
   */
  const [nextHref, setNextHref] = useState("/dashboard")
  /** True when /signup handed us here, i.e. the visitor definitely has an
   *  account and "back" must go forward into the app rather than to /signup. */
  const [nextFromSignup, setNextFromSignup] = useState(false)
  /** Set when a rejected code clears the boxes; consumed by the effect below. */
  const [refocus, setRefocus] = useState(false)
  /** The server said, for THIS session, that the address is not verified. */
  const [serverUnverified, setServerUnverified] = useState(false)
  const inputs = useRef<Array<HTMLInputElement | null>>([])

  // FOCUS AFTER THE COMMIT, NOT AFTER A FRAME.
  //
  // Two wrong versions preceded this one. The first called `.focus()` before
  // `setBusy(false)`, so the inputs were still `disabled` in the committed DOM
  // and focusing a disabled input is a silent no-op. The second moved it into
  // `requestAnimationFrame`, which is closer but still a guess about timing:
  // rAF can fire before React commits the render that removes `disabled`, and
  // measured over 6 identical trials it left `document.activeElement` on BODY
  // in 3 of them — a fix that worked often enough to look verified.
  //
  // An effect that depends on `busy` cannot run early: React commits the DOM,
  // then runs the effect. By that point `disabled` is gone and the focus lands.
  useEffect(() => {
    if (!refocus || busy) return
    inputs.current[0]?.focus()
    setRefocus(false)
  }, [refocus, busy])

  // --- who is this, and how long until they can resend --------------------
  useEffect(() => {
    let pin: string | null = null
    let pending: string | null = null
    let sentAt: number | null = null
    try {
      pin = sessionStorage.getItem("shotiq-verify-cooldown")
      pending = sessionStorage.getItem("shotiq-pending-email")
      // SAME-ORIGIN, DECIDED BY THE URL PARSER RATHER THAN BY A REGEX. The
      // guard here was /^\/(?!\/)/, which blocks "//evil" and "https://evil"
      // and PASSES "/\evil.example" — a path the parser normalises to
      // http://evil.example/ for special schemes, so the regex said same-origin
      // about a value that resolves off-site. Reachability is narrow (one
      // writer, same-origin sessionStorage), but the comment claimed the value
      // "gets validated at the point of use" and the validation was wrong.
      const nx = sessionStorage.getItem("shotiq-verify-next")
      if (nx) {
        try {
          const u = new URL(nx, window.location.origin)
          if (u.origin === window.location.origin) {
            setNextHref(u.pathname + u.search)
            setNextFromSignup(true)
          }
        } catch { /* unparseable — keep the default */ }
      }
      const raw = sessionStorage.getItem("shotiq-verify-sent-at")
      sentAt = raw ? Number(raw) : null
    } catch { /* opaque origin */ }

    const queryEmail = params.get("email")
    if (pending) setEmail(pending)
    else if (queryEmail) setEmail(queryEmail)

    if (pin && /^\d+$/.test(pin)) {
      // THE HARNESS PIN. Canonical 005 is captured mid-countdown at 0:42, and a
      // live timer is a nondeterministic pixel — every capture would land on a
      // different second and the band containing it could never be stable. The
      // pin fixes the value AND stops the tick, the same deterministic entry
      // 001 uses via `shotiq-splash-hold`. A real player never has this key.
      setPinned(true)
      setCooldown(Number(pin))
    } else if (sentAt && Number.isFinite(sentAt)) {
      const left = DEFAULT_COOLDOWN - Math.floor((Date.now() - sentAt) / 1000)
      if (left > 0) setCooldown(left)
    }

    fetch("/api/auth/resend-verification", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => {
        if (d.email) setEmail(d.email)
        if (d.verified) setVerified(true)
        // The server's answer for a caller it can identify. Used to CONTRADICT
        // a ?status=success that is not true for this session.
        else setServerUnverified(true)
      })
      .catch(() => { /* signed out — the address comes from the two sources above */ })
  }, [params])

  useEffect(() => {
    if (pinned || cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown, pinned])

  // THE QUERY STRING IS NOT EVIDENCE. This was `verified || linkStatus ===
  // "success"`, so anyone opening /verify-email?status=success — including a
  // signed-out visitor, or a player whose address is not verified at all — was
  // told "Your email is verified. You're all set.", and the server's own
  // `verified: false` from GET /api/auth/resend-verification could not win
  // against the OR.
  //
  // `?status=success` is still honoured, because the emailed-link route
  // redirects here with it and that IS a real success the page must reflect —
  // including for a player who opened the link in a mail-app browser with no
  // session, where nothing else can tell us. But it is now only a CLAIM, and
  // the server is allowed to contradict it: if the API can identify the caller
  // and says the address is NOT verified, the claim loses. That closes the case
  // that actually misleads someone — a signed-in, unverified player landing on
  // a crafted URL and being told they are done — while leaving the real link
  // path working for a caller nobody can identify.
  const isVerified = verified || (linkStatus === "success" && !serverUnverified)
  const filled = useMemo(() => code.findIndex((c) => c === ""), [code])
  const filledCount = filled === -1 ? CODE_LENGTH : filled

  // --- submitting the code ------------------------------------------------
  const submit = useCallback(async (digits: string) => {
    if (digits.length !== CODE_LENGTH) return
    setBusy(true)
    setError("")
    try {
      const res = await csrfFetch("/api/auth/verify-email-code", {
        method: "POST",
        body: JSON.stringify({ code: digits, email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success) {
        setError(data?.error || "That code is incorrect or has expired.")
        setCode(Array(CODE_LENGTH).fill(""))
        // RE-ENABLE FIRST, THEN FOCUS, AND FOCUS AFTER THE RE-RENDER.
        //
        // This used to call `.focus()` here and `setBusy(false)` afterwards. At
        // that moment the committed DOM still had `disabled={busy}` on every
        // box, and focusing a disabled input is a silent no-op — so after a
        // wrong code the boxes cleared and `document.activeElement` was BODY,
        // measured. A keyboard or screen-reader user was thrown out of the form
        // and had to Tab back in from the top of the page after every typo,
        // which is precisely the user this retry behaviour exists for.
        //
        // React batches the state updates, so ordering the two calls is not
        // enough on its own: the focus has to happen after the render that
        // removes `disabled`, hence the frame callback.
        setBusy(false)
        setRefocus(true)
        return
      }
      setVerified(true)
    } catch {
      setError("Could not verify right now. Try again shortly.")
    }
    setBusy(false)
  }, [email])

  const setDigit = (i: number, raw: string) => {
    const digits = raw.replace(/\D/g, "")
    if (!digits) {
      // A cleared box is a real edit, not a no-op: it must clear.
      setCode((c) => { const n = [...c]; n[i] = ""; return n })
      return
    }
    setCode((c) => {
      const n = [...c]
      // Pasting the whole code into any box fills the row from there.
      for (let k = 0; k < digits.length && i + k < CODE_LENGTH; k += 1) n[i + k] = digits[k]
      const next = Math.min(i + digits.length, CODE_LENGTH - 1)
      inputs.current[next]?.focus()
      const joined = n.join("")
      if (joined.length === CODE_LENGTH && !n.includes("")) void submit(joined)
      return n
    })
  }

  /**
   * PASTE IS HANDLED BEFORE `maxLength` CAN TRUNCATE IT.
   *
   * `setDigit` already strips non-digits, but it never saw them. Each box
   * carries `maxLength={6}`, and the browser applies that to the INSERTED TEXT
   * before `onChange` fires — so the seven characters of "827 670" arrived as
   * "827 67" and the player silently got five digits:
   *
   *     insertText("482913")   -> fills, auto-submits          works
   *     insertText("482 913")  -> ["4","8","2","9","1",""]     one digit short
   *
   * The grouped form is the one the product itself mails (`readable()` in
   * verificationEmail.ts prints "827 670" so it is legible in a mail client), so
   * the single format a player is most likely to copy was the one format that
   * could not be pasted. Reading the clipboard here bypasses `maxLength`
   * entirely, and hyphens, non-breaking spaces and a trailing newline all fall
   * out of the same strip.
   */
  const onPaste = (i: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text")
    if (!pasted) return
    const digits = pasted.replace(/\D/g, "")
    if (!digits) return
    e.preventDefault()
    // A full-length paste always fills from the first box, wherever it landed —
    // a player who taps the third box and pastes the whole code means the code.
    setDigit(digits.length >= CODE_LENGTH ? 0 : i, digits)
  }

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      e.preventDefault()
      setCode((c) => { const n = [...c]; n[i - 1] = ""; return n })
      inputs.current[i - 1]?.focus()
    } else if (e.key === "ArrowLeft" && i > 0) {
      e.preventDefault(); inputs.current[i - 1]?.focus()
    } else if (e.key === "ArrowRight" && i < CODE_LENGTH - 1) {
      e.preventDefault(); inputs.current[i + 1]?.focus()
    }
  }

  // --- resend -------------------------------------------------------------
  const resendEmail = async () => {
    if (cooldown > 0 || resend === "sending") return
    setResend("sending")
    try {
      const res = await csrfFetch("/api/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify(email ? { email } : {}),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success) throw new Error(data?.error || "send failed")
      if (data.alreadyVerified) { setVerified(true); setResend("idle"); return }
      setResend("sent")
      setCooldown(Number(data.cooldownSeconds) || DEFAULT_COOLDOWN)
      try { sessionStorage.setItem("shotiq-verify-sent-at", String(Date.now())) } catch { /* opaque */ }
    } catch {
      setResend("error")
    }
  }

  const clock = `${Math.floor(cooldown / 60)}:${String(cooldown % 60).padStart(2, "0")}`
  const shown = email || "your email"

  if (isVerified) {
    return (
      <div className="mx-auto w-full max-w-[440px] px-6 py-12 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-[var(--shotiq-color-confirmGreen)]" />
        <p className="mt-4 text-[15px] font-semibold">Your email is verified.</p>
        <p className="mt-1 text-[13px] text-[var(--shotiq-color-graphite)]">
          {email ? <>You&apos;re all set, <span className="font-medium">{email}</span>.</> : "You're all set."}
        </p>
        <Link href={nextHref} data-testid="verify-continue"
              className="mx-auto mt-6 flex h-[44px] w-full max-w-[280px] items-center justify-center rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] text-[14px] font-medium text-white">
          {nextHref === "/onboarding" ? "Continue" : "Continue to dashboard"}
        </Link>
      </div>
    )
  }

  return (
    <>
      <Marks005 focus={focus} filled={filledCount} />

      {/* ------------------------------------------------------------ header */}
      <header data-s5-contents
              className="flex h-[46px] shrink-0 items-center justify-between px-[18px] md:h-[57px] md:px-[24px]"
              data-testid="region-topbar">
        <span data-s5="wordmark"
              className="shotiq-wordmark text-[18px] leading-none tracking-[0.02em] md:text-[21px]">
          SHOT<span data-s5-iq className="text-[var(--shotiq-color-shotiqOrange)]">IQ</span>
        </span>
        <Link href="/settings" aria-label="Settings" data-s5="gear" data-testid="verify-settings">
          <span data-s5-off className="hidden md:inline"><Settings className="h-[20px] w-[20px]" /></span>
          <span data-s5-mark className="md:hidden"><GearMark /></span>
        </Link>
      </header>

      <div data-s5-contents className="mx-auto w-full max-w-[440px] px-[18px] md:px-0">
        {/* THE BACK ARROW IS THE ONLY EXIT CANONICAL DRAWS, so it has to be a
            real one. Two measured defects met here.

            `router.back()` walked the browser's history, and on the arrival
            path the emailed link creates there IS no history — a fresh tab has
            `history.length 2` and going back lands on about:blank, i.e. the
            control navigated out of the app entirely.

            And once /signup started routing here, "back" to /signup became a
            dead end: the account already exists, so that screen can only refuse
            the address it was just given. Every new account was walled behind
            an email on a deployment where mail is undeliverable, with no way
            into the product — the round that gave this screen an entry point
            took away the product's.

            So it goes FORWARD for someone who has an account (the signup
            handoff wrote where), and back to /signup only for a visitor who
            arrived without one. No control is added and none is moved:
            canonical 005 draws no skip, and this is the arrow it already
            draws. `emailVerified` gates nothing today (recorded as NEEDS
            KEVIN), so this strands nobody while that stays true — and if
            Kevin later makes verification a gate, this is the one place that
            has to change with it. */}
        <button type="button" aria-label="Go back" data-testid="verify-back"
                onClick={() => {
                  if (nextFromSignup) router.replace(nextHref)
                  else router.push("/signup")
                }}
                data-s5="back"
                className="mt-[10px] flex h-[26px] w-[26px] items-center md:mt-[16px]">
          <span data-s5-off className="hidden md:inline"><ArrowLeft className="h-[20px] w-[20px]" /></span>
          <span data-s5-mark className="md:hidden"><BackMark /></span>
        </button>

        <h1 data-s5="display" className="shotiq-display mt-[18px] text-center text-[40px] leading-[44px]">
          VERIFY YOUR EMAIL
        </h1>

        {/* Two runs, not one wrapped paragraph: canonical sets the sentence in
            graphite and the address in ink semibold, and they are independently
            positioned (rule 57 — one window per independently placed thing). */}
        <p data-s5-contents className="mt-[10px] text-center text-[15px] leading-[21px]">
          <span data-s5="lede1" className="text-[var(--shotiq-color-graphite)]">Enter the code we sent to</span>{" "}
          <span data-s5="lede2" className="font-semibold" data-testid="verify-address">{shown}.</span>
        </p>

        {/* ------------------------------------------------------ code entry */}
        {/* The visible digits are drawn by six positioned runs and the inputs
            are transparent hit targets over them. An input cannot carry the
            run's scaleX AND its own centring without dragging the caret and the
            selection geometry along with it, and canonical's digits are
            condensed to 0.66 of their natural width. */}
        <div data-s5-contents role="group" aria-labelledby="verify-code-label"
             className="mt-[20px] flex justify-center gap-[8px]">
          <span id="verify-code-label" className="sr-only">
            Six-digit verification code sent to {shown}
          </span>
          {Array.from({ length: CODE_LENGTH }).map((_, i) => (
            <React.Fragment key={i}>
              <span data-s5={`digit${i}`} aria-hidden="true" className="md:hidden">{code[i]}</span>
              <input
                ref={(el) => { inputs.current[i] = el }}
                data-s5={`code${i}`}
                data-testid={`verify-code-${i}`}
                aria-label={`Digit ${i + 1} of ${CODE_LENGTH}`}
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                maxLength={CODE_LENGTH}
                value={code[i]}
                disabled={busy}
                onFocus={() => setFocus(i)}
                onBlur={() => setFocus((f) => (f === i ? -1 : f))}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                onPaste={(e) => onPaste(i, e)}
                className="h-[54px] w-[44px] rounded-[8px] border border-[var(--shotiq-color-rule)] bg-white text-center text-[22px] font-medium text-[var(--shotiq-color-ink)] outline-none focus:border-[var(--shotiq-color-shotiqOrange)]"
              />
            </React.Fragment>
          ))}
        </div>

        {error && (
          <p role="alert" data-s5="error" data-testid="verify-error"
             className="mt-[10px] text-center text-[13px] text-[var(--shotiq-color-reviewRed)]">{error}</p>
        )}

        {/* --------------------------------------------------------- resend */}
        {/* The countdown is the disabled-state explanation for the control
            directly below it: while it runs, "Resend email" is genuinely
            disabled, and the server's own 3-per-minute limit backs the same
            rule. Canonical draws the link orange throughout, which is the
            design's choice and not a claim that the control is live. */}
        <p data-s5-contents className="mt-[16px] text-center text-[15px]">
          <span data-s5="resendLab" className="text-[var(--shotiq-color-graphite)]">
            {cooldown > 0 ? "Resend code in " : "You can resend the code now"}
          </span>
          {cooldown > 0 && (
            <span data-s5="resendVal" data-testid="verify-cooldown"
                  className="font-bold text-[var(--shotiq-color-shotiqOrange)]">{clock}</span>
          )}
        </p>

        <div data-s5-contents className="mt-[10px] flex justify-center">
          <button type="button" onClick={resendEmail} data-testid="verify-resend"
                  data-s5="resendLinkBox" disabled={cooldown > 0 || resend === "sending"}
                  className="flex items-center gap-2 text-[15px] font-medium text-[var(--shotiq-color-shotiqOrange)] underline underline-offset-4 disabled:opacity-70 md:disabled:opacity-50">
            {resend === "sending" && <Loader2 className="h-[15px] w-[15px] animate-spin" />}
            <span data-s5="resendLink">
              {resend === "sent" ? "Email sent" : resend === "error" ? "Try again" : "Resend email"}
            </span>
          </button>
        </div>

        {/* -------------------------------------------------------- actions */}
        <a href={inboxUrl(email)} data-s5="plate" data-testid="verify-open-mail"
           className="mt-[18px] flex h-[46px] w-full items-center justify-center gap-[10px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] text-[15px] font-semibold text-white">
          <span data-s5="plateMark" data-s5-mark className="md:hidden"><EnvelopeMark /></span>
          <MailCheck data-s5-off className="hidden h-[18px] w-[18px] md:inline" />
          <span data-s5="plateLab">Open email app</span>
        </a>

        <Link href="/signup" data-s5="diffBtn" data-testid="verify-different-email"
              className="mt-[12px] flex h-[46px] w-full items-center justify-center gap-[10px] rounded-[6px] border border-[var(--shotiq-color-ink)] bg-white text-[15px]">
          <span data-s5="diffMark" data-s5-mark className="md:hidden"><EnvelopePencilMark /></span>
          <span data-s5="diffLab">Use a different email</span>
        </Link>

        {/* ----------------------------------------------------- help list */}
        <div data-s5-contents className="mt-[20px] border-t border-[var(--shotiq-color-rule)] pt-[14px]">
          <div data-s5="didnt"
               className="text-[11px] font-bold tracking-[0.05em] text-[var(--shotiq-color-graphite)]">
            DIDN&apos;T GET THE EMAIL?
          </div>
          <div data-s5-contents className="mt-[4px] divide-y divide-[var(--shotiq-color-rule)]">
            {/* Each row is a real destination, because a chevron promises one.
                Spam and delivery-delay guidance lives in the guide's own
                anchors; support is the address on the marketing site. */}
            <Link href="/guide#email-spam" data-s5="helpRow1" data-testid="verify-help-1"
                  className="flex items-center gap-[10px] py-[9px] text-[13px]">
              <span data-s5="helpMark1" data-s5-mark className="md:hidden"><MailCheckMark /></span>
              <MailCheck data-s5-off className="hidden h-[16px] w-[16px] text-[var(--shotiq-color-graphite)] md:inline" />
              <span data-s5="help1" className="flex-1">Check your spam or promotions folder</span>
              <span data-s5="chev1" data-s5-mark className="md:hidden"><ChevronMark n={1} /></span>
              <ChevronRight data-s5-off className="hidden h-[13px] w-[13px] text-[var(--shotiq-color-muted)] md:inline" />
            </Link>
            <Link href="/guide#email-delay" data-s5="helpRow2" data-testid="verify-help-2"
                  className="flex items-center gap-[10px] py-[9px] text-[13px]">
              <span data-s5="helpMark2" data-s5-mark className="md:hidden"><MailClockMark /></span>
              <MailCheck data-s5-off className="hidden h-[16px] w-[16px] text-[var(--shotiq-color-graphite)] md:inline" />
              <span data-s5="help2" className="flex-1">Wait a few minutes and tap &ldquo;Resend email&rdquo;</span>
              <span data-s5="chev2" data-s5-mark className="md:hidden"><ChevronMark n={2} /></span>
              <ChevronRight data-s5-off className="hidden h-[13px] w-[13px] text-[var(--shotiq-color-muted)] md:inline" />
            </Link>
            <a href="mailto:support@shotiqai.com?subject=Email%20verification" data-s5="helpRow3"
               data-testid="verify-help-3"
               className="flex items-center gap-[10px] py-[9px] text-[13px]">
              <span data-s5="helpMark3" data-s5-mark className="md:hidden"><HelpMark /></span>
              <ShieldCheck data-s5-off className="hidden h-[16px] w-[16px] text-[var(--shotiq-color-graphite)] md:inline" />
              <span data-s5="help3" className="flex-1">Need help? Contact support</span>
              <span data-s5="chev3" data-s5-mark className="md:hidden"><ChevronMark n={3} /></span>
              <ChevronRight data-s5-off className="hidden h-[13px] w-[13px] text-[var(--shotiq-color-muted)] md:inline" />
            </a>
          </div>
        </div>

        <div data-s5-contents className="mt-[14px] flex items-center gap-[10px] border-t border-[var(--shotiq-color-rule)] pt-[14px]">
          <span data-s5="shield" data-s5-mark className="md:hidden"><ShieldMark /></span>
          <ShieldCheck data-s5-off className="hidden h-[18px] w-[18px] shrink-0 text-[var(--shotiq-color-confirmGreen)] md:inline" />
          <div data-s5-contents>
            <div data-s5="safe1" className="text-[13px] font-semibold">Your account is safe</div>
            <div data-s5="safe2" className="text-[11px] text-[var(--shotiq-color-graphite)]">
              We&apos;ll never share your email or data.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function VerifyEmailPage() {
  return (
    <div
      data-testid="screen-desktop-web-verify-email"
      className="s5 shotiq-canonical mx-auto flex w-full max-w-[1440px] flex-col bg-[var(--shotiq-color-paper)] text-[var(--shotiq-color-ink)] md:min-h-[900px] md:py-12"
    >
      <style dangerouslySetInnerHTML={{ __html: PHONE_CSS }} />
      <Suspense>
        <VerifyEmailBody />
      </Suspense>
    </div>
  )
}
