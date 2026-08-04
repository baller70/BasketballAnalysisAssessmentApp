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
 * The two display lines carry an explicit weight for the same reason, in the
 * other direction. `.shotiq-display` binds 400 to Tungsten Medium, which is the
 * measured right cut for the desktop headings — but on this screen canonical's
 * "SEE THE DETAILS." carries 9607 ink px where Medium draws 8337 (-13%) and
 * Semibold 10691 (+11%), and canonical's T stem measures 7.4 device px against
 * Medium's 6.0 and Semibold's 8.6. The pack has no cut in between and Tungsten
 * is not variable, so Semibold is simply the nearer of the two, on ink, on stem
 * and by eye. It also carries the per-word advance better: "THE" measures 81
 * against Semibold's 80 and Medium's 77. The weight is set inline because
 * `.shotiq-display` is declared after Tailwind's utility layer and would
 * silently discard a `font-semibold` class, exactly as it does a `text-[Npx]`.
 *
 * SPLASH_HOLD_MS is the product dwell. `sessionStorage['shotiq-splash-hold']`
 * pins the screen open instead — the deterministic entry the capture harness
 * uses, since a 1.6s dwell cannot be raced reliably.
 */
const SPLASH_HOLD_MS = 1600

/** Tungsten Semibold — solved against canonical's ink, see the note above. */
const DISPLAY_WEIGHT = { fontWeight: 600 } as const

/** Inter-class grotesque, weight solved against canonical — see above. */
const WORDMARK = {
  fontFamily: 'var(--font-geist-sans)',
  fontWeight: 740,
  fontSize: 46.66,
  lineHeight: '46.66px',
  letterSpacing: '0.01817em',
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
    >
      <CourtWatermark />

      <div className="absolute" style={{ left: MARK.x, top: MARK.y }}>
        <ShotIQMark />
      </div>

      <div
        data-splash="wordmark"
        className="absolute left-[146.86px] top-[244.1px]"
        style={WORDMARK}
      >
        <span style={{ color: 'var(--shotiq-color-ink)' }}>SHOT</span>
        <span style={{ color: 'var(--shotiq-color-shotiqOrange)' }}>IQ</span>
      </div>
      <div
        data-splash="aianalysis"
        className="absolute left-[147.94px] top-[291.9px] text-[21.6px] font-medium leading-[23px] text-[var(--shotiq-color-graphite)]"
        style={{ letterSpacing: '0.2862em', wordSpacing: '-2.76px' }}
      >
        AI ANALYSIS
      </div>

      <div className="absolute" style={{ left: DIAGRAM.x, top: DIAGRAM.y }}>
        <ShotArcDiagram />
      </div>

      <div
        data-splash="line1"
        className="shotiq-display absolute inset-x-0 top-[530px] text-center text-[37.98px] leading-[41px] tracking-[0.026em] text-[var(--shotiq-color-ink)]"
        style={{ ...DISPLAY_WEIGHT, wordSpacing: '1.61px' }}
      >
        SEE THE DETAILS.
      </div>
      <div
        data-splash="line2"
        className="shotiq-display absolute inset-x-0 top-[571.5px] text-center text-[37.98px] leading-[41px] tracking-[0.0145em]"
        style={{ ...DISPLAY_WEIGHT, wordSpacing: '2.53px' }}
      >
        <span className="text-[var(--shotiq-color-shotiqOrange)]">BUILD</span>{" "}
        <span className="text-[var(--shotiq-color-graphite)]">THE HABIT.</span>
      </div>
    </div>
  )
}
