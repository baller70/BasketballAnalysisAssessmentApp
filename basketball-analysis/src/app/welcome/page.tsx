"use client"

/**
 * /welcome — canonical iOS screen 002-welcome.
 *
 * The signed-out landing surface. `/` (001-splash) forwards here once the auth
 * store has rehydrated and found no session; from here "Sign in" goes to
 * /signin (003) and "Create account" to /signup (004). Before this route the
 * app had no marketing/hero surface at all — `/` redirected straight into the
 * form.
 *
 * Every number is measured off canonical/002-welcome.png at 1:1 and divided by
 * 853/393 = 2.170483:
 *
 *   SHOTIQ            x  24.4  y  39.2  cap 19.4  advance 123.5
 *   AI ANALYSIS       x  25.3  y  73.7  cap 10.1  advance  95.9
 *   CAPTURE.          x  24.9  y 138.2  cap 45.6
 *   ANALYZE.          x  24.4  y 198.1  cap 44.7   (orange)
 *   TRAIN.            x  24.4  y 257.5  cap 44.7
 *   TRACK.            x  24.4  y 317.0  cap 45.2   -> 59.5pt line pitch
 *   rule              y 381.5  x 24.4-160.3
 *   body 3 lines      y 397.6 / 416.5 / 434.9, cap+desc 11.5 -> 18.9pt pitch
 *   hero frame        x 193.5  y  44.7  186.1 x 412.3
 *   BUILT FOR YOUR GAME  centred, cap 14.3, y 493.4; flanking rules y 500.3
 *   step marks        y 532.6, 41.0 tall
 *   step labels       y 588.8, cap 11.5
 *   step body         y 609.5 / 622.4 / 635.3, cap 8.8 -> 12.9pt pitch
 *   Sign in           x 21.7  y 678.2  349.2 x 42.8  (filled)
 *   Create account    x 21.7  y 734.9  349.2 x 41.9  (hairline, orange ink)
 */

import React from "react"
import Link from "next/link"
import { ActionGlyph, type ActionKind } from "@/components/shotiq/Glyphs"

/* Canonical draws the four steps in its own node-graph family, each on its own
   aspect ratio, not four square UI icons: a framing bracket over a node run,
   the film gate with its centre line, the live-capture node peak, and the
   rising node line. `ActionGlyph` already owns exactly those four boxes. */
const STEPS: [string, ActionKind, number, string[], boolean][] = [
  ["CAPTURE", "uploadImage", 41, ["Record from", "any angle."], false],
  ["ANALYZE", "uploadVideo", 27, ["AI breaks down", "every rep."], true],
  ["TRAIN", "liveCamera", 32, ["Get guided", "drills that fit", "your goals."], false],
  ["TRACK", "nodeClimb", 33, ["Monitor progress.", "Stay consistent.", "Keep improving."], false],
]

export default function WelcomePage() {
  return (
    <div
      data-testid="screen-ios-welcome"
      className="shotiq-canonical relative mx-auto min-h-[852px] w-full max-w-[393px] overflow-hidden bg-[var(--shotiq-color-paper)] text-[var(--shotiq-color-ink)]"
    >
      {/* ---------------------------------------------------------- hero */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/canonical/086-card-photo.png"
        alt="Shooter at release with the pose graph traced over the shot"
        className="absolute left-[193.5px] top-[44.7px] h-[412.3px] w-[186.1px] rounded-[8px] object-cover"
        width={200}
        height={483}
      />

      <div className="absolute left-[24.4px] top-[33px]">
        <div className="shotiq-wordmark text-[25.9px] leading-[30px] tracking-[0.02em]">
          SHOT<span className="text-[var(--shotiq-color-shotiqOrange)]">IQ</span>
        </div>
        <div className="mt-[8px] text-[13.3px] font-medium leading-[15px] tracking-[0.164em] text-[var(--shotiq-color-graphite)]">
          AI ANALYSIS
        </div>
      </div>

      {/* ------------------------------------------------------ headline */}
      <div className="shotiq-display absolute left-[24.4px] top-[135px] text-[63.4px] leading-[59.6px] tracking-[-0.031em]">
        <div>CAPTURE.</div>
        <div className="text-[var(--shotiq-color-shotiqOrange)]">ANALYZE.</div>
        <div>TRAIN.</div>
        <div>TRACK.</div>
      </div>

      <span aria-hidden="true" className="absolute left-[24.4px] top-[381.5px] h-px w-[135.9px] bg-[var(--shotiq-color-rule)]" />
      <p className="absolute left-[25.8px] top-[394px] w-[144px] text-[11.5px] leading-[18.9px] text-[var(--shotiq-color-graphite)]">
        Instant AI analysis. Clear insights. Smarter reps. Better results.
      </p>

      {/* ------------------------------------------------- BUILT FOR ... */}
      <div className="absolute inset-x-0 top-[491.6px] flex items-center px-[21.7px]">
        <span aria-hidden="true" className="h-px flex-1 bg-[var(--shotiq-color-rule)]" />
        <span className="shotiq-display mx-[19px] whitespace-nowrap text-[19.7px] leading-[21px] tracking-[-0.01em]">
          BUILT FOR YOUR GAME
        </span>
        <span aria-hidden="true" className="h-px flex-1 bg-[var(--shotiq-color-rule)]" />
      </div>

      {/* ---------------------------------------------------- step strip */}
      <div className="absolute inset-x-0 top-[530px] flex items-start px-[21.7px]">
        {STEPS.map(([label, mark, markH, body, accent], i) => (
          <React.Fragment key={label}>
            {i > 0 && (
              <span aria-hidden="true" className="mt-[16px] shrink-0 px-[2px] text-[13px] leading-[13px] text-[var(--shotiq-color-muted)]">
                ›
              </span>
            )}
            <div className="min-w-0 flex-1 text-center">
              <span className="flex h-[43px] items-center justify-center">
                <ActionGlyph kind={mark} height={markH} />
              </span>
              <div
                className="shotiq-display mt-[15px] text-[16.3px] leading-[17px]"
                style={accent ? { color: "var(--shotiq-color-shotiqOrange)" } : undefined}
              >
                {label}
              </div>
              <div className="mt-[3px] text-[9px] leading-[12.9px] text-[var(--shotiq-color-graphite)]">
                {body.map((l) => <div key={l}>{l}</div>)}
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* ------------------------------------------------------- actions */}
      <Link
        href="/signin"
        data-testid="welcome-signin"
        className="absolute left-[21.7px] top-[678.2px] flex h-[42.8px] w-[349.2px] items-center justify-center rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] text-[15px] font-medium text-white"
      >
        Sign in
      </Link>
      <Link
        href="/signup"
        data-testid="welcome-signup"
        className="absolute left-[21.7px] top-[734.9px] flex h-[41.9px] w-[349.2px] items-center justify-center rounded-[6px] border border-[var(--shotiq-color-shotiqOrange)] bg-white text-[15px] font-medium text-[var(--shotiq-color-shotiqOrange)]"
      >
        Create account
      </Link>
    </div>
  )
}
