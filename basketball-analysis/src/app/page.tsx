"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useProfileStore } from '@/stores/profileStore'
import { ShotIQMark, ShotArcDiagram, CourtWatermark, MARK, DIAGRAM } from '@/components/shotiq/phone/BrandMarks'

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
 * EVERY number below is measured off canonical/001-splash.png at 1:1 and
 * divided by the capture scale 853/393 = 2.170483. Ink runs are row-segmented
 * and each run is thresholded at the midpoint between paper and its OWN ink
 * colour, because canonical sets this screen in three colours and a constant
 * threshold measures the grey runs a cap short of the black ones at identical
 * type size.
 *
 *   element                canonical device px            CSS pt
 *   mark plate             x132.2 y534.7 153.6x147.1      x60.91 y246.36 70.77x67.77
 *   SHOTIQ ink             x323   y541   389x79           x148.82 y249.25
 *   AI ANALYSIS ink        x322   y642   390x33           x148.36 y295.79
 *   diagram ink            x278   y776   295x289          x128.08 y357.53 135.91x133.15
 *   "SEE THE DETAILS."     x225   y1160  403x60           centred on 196.5
 *   "BUILD THE HABIT."     x228   y1250  397x58           centred on 196.5
 *
 * Ink colours, sampled from eroded stroke interiors so no antialiased edge is
 * in the sample: SHOT and "SEE THE DETAILS." (2,2,1); IQ and BUILD (251,60,0);
 * AI ANALYSIS and "THE HABIT." (96,95,95). Those map onto --shotiq-color-ink,
 * --shotiq-color-shotiqOrange and --shotiq-color-graphite; the greys read
 * neutral in the canonical PNG because its chroma subsampling flattens the
 * token's small blue lean, and the token is what the sidecar declares.
 *
 * The wordmark is NOT .shotiq-wordmark here. The sidecar's `brand` role is
 * Inter 900, and canonical draws it that way: at cap 79 it advances 389, i.e.
 * 4.94 per unit cap, with a near-circular O at 0.94 per unit cap. Boxed Heavy —
 * the widest cut in the Wilson X pack, which .shotiq-wordmark binds — advances
 * 3.48 per unit cap with an O at 0.57, so the logo set 111px (28%) short of
 * canonical and no amount of tracking closes a per-glyph gap that wide. Geist,
 * already loaded on <body>, is the Inter-class grotesque in the build, and it
 * is a VARIABLE face, so the weight can be solved rather than picked. Rendered
 * at canonical's cap of 79 device px:
 *
 *     weight  advance  ink px  density        canonical: 389 / 14108 / 0.460
 *       700     377    13533   0.454
 *       740     380    14294   0.476
 *       800     384    15020   0.495
 *       900     391    16593   0.537
 *
 * 740 carries canonical's ink; 1.84 device px (0.01817em) of tracking then
 * carries the advance, landing 389 / 14163 / 0.461 against 389 / 14108 / 0.460.
 * Scoped to this element so the desktop header, which shares .shotiq-wordmark,
 * is untouched.
 *
 * The two display lines sit between the two cuts the pack owns, and the gap is
 * measured, not guessed. Sampling the stem of the I in DETAILS by coverage
 * integral — the one glyph that is nothing but a stem, so it reads weight with
 * no letterform in the way — canonical draws 7.73 device px. Tungsten Medium
 * (the 400 `.shotiq-display` binds) draws 6.55 and Tungsten Semibold 8.81:
 * -15% and +14%. Total ink says the same thing, 8173 against canonical's 9618
 * and 10668. Tungsten is not variable and the pack has nothing between Medium
 * and Semibold, so the cut alone cannot land it.
 *
 * Medium plus a 0.55px text stroke can. The stroke is centred on the contour,
 * so it adds ~1.19 device px to every stem and takes Medium's 6.55 to 7.74
 * against canonical's 7.73 — and unlike Semibold it keeps Medium's glyph
 * proportions, which the phone display ramp in globals.css measured as the
 * right ones (Medium 96.9% of canonical's width per unit cap, Semibold 104.8%).
 * The previous build used Semibold, which measured +14% stem, +11% ink and a
 * visibly heavier line against canonical in a 2x crop.
 *
 * Sizes are per line because canonical sets the two lines differently: the
 * sub-pixel cap height of the I, from its own 50%-coverage crossings, is 58.27
 * on "SEE THE DETAILS." and 56.14 on "BUILD THE HABIT." — 3.7% apart, which a
 * binary threshold reads as 58 and 57 and can easily be dismissed as noise.
 *
 * Colour. Canonical's three ink roles, each read off eroded stroke interiors
 * with the antialiased edge thrown away (n = 1601-2804 px per sample):
 *
 *   role      canonical core     token             this screen
 *   ink       (2.5, 2.1, 1.9)    #111111 (17)      #000000
 *   graphite  (111.4, 110.9, 110.8) / (112.3, 112.1, 111.8)
 *                                #5F646B (95,100,107)   #6F6F6F
 *   orange    (250.8, 73.1, 4.6) / (250.5, 77.4, 7.5)
 *                                #FD3701 (253,55,1)     #FC4904
 *
 * Canonical's paper reads 254 and its plate interior 22 against the 20 the
 * asset was composited at, so the render carries a ~2-level lift at the black
 * end; undoing it puts canonical's ink on #000000 and its grey on #6F6F6F.
 * The graphite gap is not a lift — canonical's grey is NEUTRAL (R=G=B within
 * one level on both samples) where the token leans blue by 12 levels, which is
 * visible side by side at 1:1 in "THE HABIT."
 *
 * These are set as screen-scoped values of the SAME `--shotiq-color-*`
 * properties, not as new tokens and not as literals at the call sites: every
 * colour reference on this screen is still `var(--shotiq-color-…)`. They are
 * scoped rather than corrected globally because ink, graphite and orange carry
 * the 20 desktop screens that currently grade B+, and this screen is not the
 * evidence base for changing what they are everywhere.
 *
 * SPLASH_HOLD_MS is the product dwell. `sessionStorage['shotiq-splash-hold']`
 * pins the screen open instead — the deterministic entry the capture harness
 * uses, since a 1.6s dwell cannot be raced reliably.
 */
const SPLASH_HOLD_MS = 1600

/** Canonical's ink roles for this screen — see the colour table above. */
const SPLASH_INK = {
  '--shotiq-color-ink': '#000000',
  '--shotiq-color-graphite': '#6F6F6F',
  '--shotiq-color-shotiqOrange': '#FC4904',
} as React.CSSProperties

/** Tungsten Medium + a 0.55px stroke — solved against canonical's stem, above. */
const DISPLAY_WEIGHT = {
  fontWeight: 400,
  WebkitTextStrokeWidth: '0.55px',
} as const

/** Inter-class grotesque, weight solved against canonical — see above. */
const WORDMARK = {
  fontFamily: 'var(--font-geist-sans)',
  fontWeight: 690,
  fontSize: 47.96,
  lineHeight: '47.96px',
  letterSpacing: '0.005em',
} as const

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
      style={SPLASH_INK}
    >
      <CourtWatermark />

      <div className="absolute" style={{ left: MARK.x, top: MARK.y, transform: MARK.transform, transformOrigin: '0 0' }}>
        <ShotIQMark />
      </div>

      <div
        data-splash="wordmark"
        className="absolute left-[146.4px] top-[244.02px]"
        style={{ ...WORDMARK, transform: 'translateY(-0.147px)' }}
      >
        <span style={{ color: 'var(--shotiq-color-ink)' }}>SHOT</span>
        <span style={{ color: 'var(--shotiq-color-shotiqOrange)' }}>IQ</span>
      </div>
      <div
        data-splash="aianalysis"
        className="absolute left-[147.94px] top-[291.16px] font-medium leading-[23px] text-[var(--shotiq-color-graphite)]"
        style={{ fontSize: '21.15px', letterSpacing: '0.3034em', wordSpacing: '-2.76px', transform: 'translateY(0.553px)' }}
      >
        AI ANALYSIS
      </div>

      <div className="absolute" style={{ left: DIAGRAM.x, top: DIAGRAM.y }}>
        <ShotArcDiagram />
      </div>

      <div
        data-splash="line1"
        className="shotiq-display absolute inset-x-0 top-[530.65px] text-center leading-[41px] tracking-[0.0406em] text-[var(--shotiq-color-ink)]"
        style={{ ...DISPLAY_WEIGHT, fontSize: '37.76px', wordSpacing: '1.21px', paddingLeft: '1.38px', transform: 'translateY(-0.442px)' }}
      >
        SEE THE DETAILS.
      </div>
      <div
        data-splash="line2"
        className="shotiq-display absolute inset-x-0 top-[570.53px] text-center leading-[41px] tracking-[0.0429em]"
        style={{ ...DISPLAY_WEIGHT, WebkitTextStrokeWidth: '0.535px', fontSize: '36.36px', wordSpacing: '2.10px', paddingLeft: '1.38px', transform: 'translateY(-0.341px)' }}
      >
        <span className="text-[var(--shotiq-color-shotiqOrange)]">BUILD</span>{" "}
        <span className="text-[var(--shotiq-color-graphite)]">THE HABIT.</span>
      </div>
    </div>
  )
}
