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
 * Canonical, all in device px. Cap heights are the sub-pixel distance between
 * the 50%-coverage crossings on the one glyph in each string that is nothing
 * but a stem — the I — so the number is independent of ink colour; "top" is
 * that glyph's own top edge, which is what a band bbox reads.
 *
 *   element                 x     top       size      cap     ink
 *   mark plate            132.18 534.71  153.70x146.94   —    (plate, 50% edges)
 *   SHOTIQ                323    541.84  adv 389       73.90  14121
 *   AI ANALYSIS           322    641.58  adv 390       32.27   3416
 *   shot-arc diagram      278    776     295x289         —     5676 (2431 orange)
 *   "SEE THE DETAILS."    225   1160.53  adv 403       58.27   9618
 *   "BUILD THE HABIT."    228   1249.86  adv 397       56.28   9530
 *
 * Two things about placing those numbers, both measured rather than assumed.
 * Chromium snaps an <img>'s paint box AND a text baseline to whole device
 * pixels, so `top` alone cannot express a fraction: every value of `top` in a
 * 1px window put the plate's edge on the same device row. The residue is
 * carried on a `transform`, which is not snapped for the image (see MARK in
 * BrandMarks) and is snapped for text — so the text elements land on the
 * nearest device row and the residual is reported, not hidden.
 *
 * The wordmark is NOT .shotiq-wordmark here. The sidecar's `brand` role is
 * Inter 900, and canonical draws a normal-width grotesque: at cap 73.9 it
 * advances 389, i.e. 5.26 per unit cap, with a near-circular O. Boxed Heavy —
 * the widest cut in the Wilson X pack, which .shotiq-wordmark binds — advances
 * 3.48 per unit cap, so the logo set 111px (28%) short of canonical and no
 * amount of tracking closes a per-glyph gap that wide. Geist, already loaded on
 * <body>, is the Inter-class grotesque in the build, and it is a VARIABLE face,
 * so the weight can be solved rather than picked. Rendered at canonical's cap
 * of 74 device px, against canonical's 14121 ink / 389 advance:
 *
 *     weight   ink    advance
 *       650   13486     382
 *       670   13723     384
 *       690   14250     385
 *       710   14443     387
 *       740   14911     389
 *
 * 690 carries canonical's ink to +0.9%; 0.005em of tracking then carries the
 * advance, landing 14176 / 389 against 14121 / 389. The earlier solve read
 * canonical's cap as 79 — that is the Q's descender, not the cap — and picked
 * 740, which measured +5.4% ink and a 4.2% fat stem at the corrected size.
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
 * Neither display line's tracking is tuned to close its ADVANCE, and that is a
 * measured decision rather than an omission. Chromium hints glyphs unless it is
 * launched with --font-render-hinting=none, which the project harness passes
 * and a bare `chromium.launch()` does not, and the two rasterisations of THIS
 * PAGE disagree by 2-4 device px on both lines:
 *
 *   line 1   canonical adv 403 gap 7.36 | unhinted 403 / 6.82 | hinted 407 / 7.09
 *   line 2   canonical adv 397 gap 7.45 | unhinted 397 / 6.82 | hinted 395 / 6.55
 *
 * Line 2 was tried at 0.0435em: on the page it left the hinted render bit-for
 * -bit unchanged (395 / 6.55 / x0 229) and moved the unhinted advance off its
 * exact 397 to 399. The rounding step is ~2 device px and the two rasterisers
 * round opposite ways, so there is no value that improves one without damaging
 * the other. 0.0429em keeps the unhinted advance exact and is kept.
 *
 * Line 1's tracking is NOT tuned to close its advance. Under the hinted
 * rasteriser it measures 408 against canonical's 403; the whole of that lands
 * in T, H, D and S, which Tungsten draws 3 device px wider than canonical's
 * face at matched cap (canonical T 22 H 22; Tungsten 25 25) while drawing E and
 * L 1-2 narrower. That is letterform. The tracking is already absorbing it:
 * canonical's inter-glyph gap is 7.36 and this line renders 7.27 hinted /
 * 6.73 unhinted, i.e. already slightly tight. Pulling 5 more device px out of
 * 15 gaps takes the hinted gap to 6.91 (-6.1% against canonical, where it is
 * -1.2% today) and the unhinted advance to 398. That buys a scoped-out
 * letterform difference by creating a scoped-in spacing one. Measured both
 * ways, and left.
 *
 * Sizes AND stroke are per line because canonical sets the two lines
 * differently. The sub-pixel cap height of the I is 58.27 on "SEE THE DETAILS."
 * and 56.28 on "BUILD THE HABIT." — 3.4% apart, which a binary threshold reads
 * as 58 and 57 and can easily be dismissed as noise. Canonical's second line is
 * also drawn a little lighter than its first: 9530 ink over a 397 advance
 * against 9618 over 403, and its I stem measures 7.52 against the first line's
 * 7.77. So line 2 takes 0.535px of stroke where line 1 takes 0.55.
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

/** Tungsten Medium + a 0.55px stroke — solved against canonical's stem, above.
 *  Line 2 overrides the width to 0.535px; canonical draws it fractionally
 *  lighter than line 1. */
const DISPLAY_WEIGHT = {
  fontWeight: 400,
  WebkitTextStrokeWidth: '0.55px',
} as const

/** AI ANALYSIS is the third run that has to be weight-solved, and it is solved
 *  the same way the display lines are. Boxed registers 400/600/800, and the
 *  `font-medium` this element carried resolved DOWN to 400 — measured, the two
 *  render identically — which drew the run 6.0% short in stem and 10-11% short
 *  in ink area at EVERY coverage level from 0.25 to 0.90. Boxed Semibold
 *  overshoots (stem +7.5%, area ratio 1.02-1.10), and there is no cut between,
 *  so the stroke carries it exactly as on the display lines. Solved jointly
 *  with the size and the tracking, because the stroke inflates cap height and
 *  the size then has to come back down, and the advance follows the size:
 *
 *    size/stroke/track       adv  cap      stem    area ratio .25 -> .90
 *    canonical               390  32.305   5.624   1.000 x6
 *    21.15 / 0    / .3034    390  32.109   5.289   0.922 .888 .906 .899 .926 .955
 *    21.15 / 600  / .3034    390  32.11    6.045   1.022 1.001 1.024 1.035 1.081 1.100
 *    20.95 / .250 / .3107    390  32.37    5.587   1.021 .986 .998 1.001 1.023 1.000
 *
 *  The last row is what ships: it straddles 1.0 across the whole ladder, where
 *  the shipped run sat under it at every level. */
const MICROCAPS_WEIGHT = {
  fontWeight: 500,
  WebkitTextStrokeWidth: '0.25px',
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
        style={{ ...MICROCAPS_WEIGHT, fontSize: '20.95px', letterSpacing: '0.3107em', wordSpacing: '-2.76px', transform: 'translateY(0.553px)' }}
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
