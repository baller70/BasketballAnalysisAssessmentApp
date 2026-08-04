"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useProfileStore } from '@/stores/profileStore'
import { ShotIQMark, ShotArcDiagram, CourtWatermark } from '@/components/shotiq/phone/BrandMarks'

/**
 * `/` — canonical iOS screen 001-splash, and the router that follows it.
 *
 * This route used to paint "Loading…" on a black field for 100ms and then
 * redirect, so the app had no launch surface at all: the only splash a user
 * ever saw was the Capacitor plugin's static image, which is not a web route
 * and cannot be captured. It now draws the canonical splash while the auth and
 * profile stores rehydrate, holds it for the canonical minimum dwell, and then
 * routes:
 *
 *   signed out                  -> /welcome   (canonical 002)
 *   signed in, profile pending  -> /onboarding
 *   signed in, profile complete -> /results/demo
 *
 * Geometry is measured off canonical/001-splash.png at 1:1 and divided by the
 * capture scale factor 853/393 = 2.170483:
 *
 *   mark          x  60.8  y 246.5   71.4 x 68.2
 *   SHOTIQ        x 148.4  cap 33.2  advance 179.2 (y 249.3-285.2)
 *   AI ANALYSIS   x 148.4  cap 15.2  advance 179.2 (y 295.3-311.0)
 *   diagram       x 128.1  y 357.5  136.4 x 132.7
 *   "SEE THE DETAILS."   centred on 196.4, cap 28.6, y 534.0-562.1
 *   "BUILD THE HABIT."   centred on 196.3, cap 26.7, y 575.9-602.2
 *
 * Ink sampled from the same file: SHOT #000000, IQ #FD3701, AI ANALYSIS
 * #636262, BUILD #E44710 (the orange), THE HABIT. #666666.
 *
 * SPLASH_HOLD_MS is the product dwell. `sessionStorage['shotiq-splash-hold']`
 * pins the screen open instead — the deterministic entry the capture harness
 * uses, since a 1.6s dwell cannot be raced reliably.
 */
const SPLASH_HOLD_MS = 1600

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const { profileComplete } = useProfileStore()
  const [held, setHeld] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem('shotiq-splash-hold') === '1') { setHeld(true); return }
    } catch { /* private mode */ }
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        router.replace('/welcome')
      } else if (!profileComplete && !user?.profileComplete) {
        router.replace('/onboarding')
      } else {
        router.replace('/results/demo')
      }
    }, SPLASH_HOLD_MS)
    return () => clearTimeout(timer)
  }, [isAuthenticated, profileComplete, user?.profileComplete, router])
  void held

  return (
    <div
      data-testid="screen-ios-splash"
      className="shotiq-canonical relative mx-auto min-h-[852px] w-full max-w-[393px] overflow-hidden bg-[var(--shotiq-color-paper)]"
    >
      <CourtWatermark />

      <div className="absolute left-[60.8px] top-[246.5px]">
        <ShotIQMark size={71} />
      </div>

      {/* Cap-matched, then tracked out to canonical's 179.2pt advance: the
          available Boxed Heavy cut is narrower per cap than the grotesque
          canonical draws (the gap globals.css documents on .shotiq-wordmark). */}
      <div
        className="shotiq-wordmark absolute left-[148.4px] top-[240px] text-[39.2px] leading-[45px] tracking-[0.02em]"
      >
        SHOT<span className="text-[var(--shotiq-color-shotiqOrange)]">IQ</span>
      </div>
      <div
        className="absolute left-[148.4px] top-[291px] text-[21.6px] font-medium leading-[23px] tracking-[0.272em] text-[var(--shotiq-color-graphite)]"
      >
        AI ANALYSIS
      </div>

      <div className="absolute left-[120.5px] top-[350px]">
        <ShotArcDiagram width={147} />
      </div>

      <div className="shotiq-display absolute inset-x-0 top-[530px] text-center text-[39.3px] leading-[41px] tracking-[0.032em]">
        SEE THE DETAILS.
      </div>
      <div className="shotiq-display absolute inset-x-0 top-[571.5px] text-center text-[39.3px] leading-[41px] tracking-[0.032em]">
        <span className="text-[var(--shotiq-color-shotiqOrange)]">BUILD</span>{" "}
        <span className="text-[var(--shotiq-color-graphite)]">THE HABIT.</span>
      </div>
    </div>
  )
}
