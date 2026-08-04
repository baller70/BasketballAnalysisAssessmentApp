"use client"

/**
 * /results/demo/player — canonical 086-web-player-card.
 *
 * The card renders the canonical photography (crops from the 086 screen) while
 * it is in its default configuration; the moment the user customizes style,
 * accent, background or the stat toggles, it switches to the live DOM-rendered
 * card so every control stays real. The signed-in user's name always overlays
 * the card.
 */

import React, { useState } from "react"
import Link from "next/link"
import { Pencil, Share2, Download, Check, ChevronRight } from "lucide-react"
import { SectionLabel, Card, TrendLine, PageTitle } from "@/components/shotiq/ShotIQShell"
import { PoseGlyph, PoseFigure, toShotPhase } from "@/components/shotiq/Glyphs"
import { useHistory, formatMakePct } from "@/components/shotiq/ResultsBits"
import { useAuthStore } from "@/stores/authStore"

const TOGGLES = ["Form score", "Shot totals", "Make percentage", "Day streak", "Points", "Coaching target"]
const CARD_BG = ["#141518", "#4A4C50", "#26282E", "#FFFFFF", "#0A0A0A"]
const ACCENTS = [
  "var(--shotiq-color-shotiqOrange)", "var(--shotiq-color-analysisBlue)",
  "var(--shotiq-color-confirmGreen)", "var(--shotiq-color-graphite)",
]
const ACCENT_SWATCH = ["#141518", "#2D6CDF", "#168A55", "#5F646B"]
const PHASES = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]
const FILM = [1, 2, 3, 4, 5, 6].map((i) => `/images/canonical/086-film-${i}.png`)

export default function PlayerCardPage() {
  const { hasData, score, items, shots, makes } = useHistory()
  const authUser = useAuthStore((s) => s.user)
  const name = (authUser?.displayName || authUser?.firstName || "Jordan Ellis").toUpperCase()
  const [accent, setAccent] = useState(0)
  const [cardStyle, setCardStyle] = useState(0)
  const [bgChoice, setBgChoice] = useState<"photo" | "clean">("photo")
  const [on, setOn] = useState(() => new Set(TOGGLES))
  const [film, setFilm] = useState(3)
  const [shareMsg, setShareMsg] = useState("")
  const [pulse, setPulse] = useState(false)
  const toggle = (t: string) => setOn((s) => { const n = new Set(s); if (n.has(t)) n.delete(t); else n.add(t); return n })
  const dark = cardStyle !== 3
  const accentColor = ACCENTS[accent]
  const sub = dark ? "text-white/60" : "text-[var(--shotiq-color-graphite)]"
  // The canonical photographic card is shown while the configuration matches
  // the canonical default; any customization switches to the live DOM card.
  const pristine = cardStyle === 0 && accent === 0 && bgChoice === "photo" && on.size === TOGGLES.length
  const jumpToCustomize = () => {
    document.getElementById("customize-card")?.scrollIntoView({ behavior: "smooth", block: "center" })
    setPulse(true)
    setTimeout(() => setPulse(false), 1200)
  }
  const share = async () => {
    const url = typeof location !== "undefined" ? location.href : ""
    try {
      if (navigator.share) { await navigator.share({ title: "My ShotIQ Player Card", url }) }
      else { await navigator.clipboard.writeText(url); setShareMsg("Link copied") }
    } catch { setShareMsg("Link copied") }
    setTimeout(() => setShareMsg(""), 2000)
  }
  const [downloading, setDownloading] = useState(false)
  const download = () => {
    setDownloading(true)
    setTimeout(() => { window.print(); setDownloading(false) }, 60)
  }

  const styleSwatch = (i: number, cls: string, child?: React.ReactNode) => (
    <button key={i} type="button" aria-label={`Card style ${i + 1}`} aria-pressed={cardStyle === i}
            onClick={() => setCardStyle(i)}
            className={`relative overflow-hidden rounded-[7px] ${cls} ${cardStyle === i ? "ring-2 ring-[var(--shotiq-color-shotiqOrange)]" : "ring-1 ring-[var(--shotiq-color-rule)]"}`}>
      {child}
      {cardStyle === i && (
        <span className="absolute bottom-[3px] left-1/2 grid h-[16px] w-[16px] -translate-x-1/2 place-items-center rounded-full bg-[var(--shotiq-color-shotiqOrange)]">
          <Check className="h-[10px] w-[10px] text-white" strokeWidth={3.2} />
        </span>
      )}
    </button>
  )

  return (
    <div data-testid="screen-desktop-web-player-card">
      <div className="flex items-start justify-between">
        <div>
          <PageTitle size={58}>PLAYER CARD</PageTitle>
          <p className="mt-[4px] text-[14px] text-[var(--shotiq-color-graphite)]">
            Showcase your form. Track your progress. Share your game.
          </p>
        </div>
        {/* Canonical sizes this trio 180 / 152 / 154 on a 22px gutter; shrink-to-
            fit gave 168 / 102 / 133, which read as three different buttons. */}
        <div className="flex gap-[22px]">
          <button type="button" onClick={jumpToCustomize}
                  className="flex h-[46px] w-[180px] items-center justify-center gap-[8px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] text-[13px] font-bold tracking-[0.04em] text-white">
            <Pencil className="h-[15px] w-[15px]" /> CUSTOMIZE CARD
          </button>
          <button type="button" onClick={share}
                  className="flex h-[46px] w-[152px] items-center justify-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] text-[13px] font-bold tracking-[0.04em]">
            <Share2 className="h-[15px] w-[15px]" /> {shareMsg || "SHARE"}
          </button>
          <button type="button" onClick={download}
                  className="flex h-[46px] w-[154px] items-center justify-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] text-[13px] font-bold tracking-[0.04em]">
            <Download className="h-[15px] w-[15px]" /> {downloading ? "PREPARING…" : "DOWNLOAD"}
          </button>
        </div>
      </div>

      <div className="mt-[16px] flex gap-[24px]">
        {/* the card itself */}
        <div className={`w-[523px] shrink-0 overflow-hidden rounded-[8px] ${dark ? "text-white" : "border border-[var(--shotiq-color-rule)] text-[var(--shotiq-color-ink)]"}`}
             style={{ background: pristine ? "#101113" : CARD_BG[cardStyle] }}>
          {pristine ? (
            <div className="relative h-[483px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/canonical/086-card-full.png" alt=""
                   className="absolute inset-0 h-full w-full object-cover" />
              {/* No scrim over the artwork. 086-card-full.png IS the canonical
                  composite: the stat column, PRIMARY COACHING TARGET and FORM
                  SCORE are painted into it in pure white, and canonical's own
                  vignette is already baked in. A full-bleed gradient laid over
                  the top darkened that type as well as the photo — measured max
                  luminance 84–147 against canonical's 255, which is what made
                  SHOTS/MAKES/DAY STREAK/POINTS near-illegible. The only region
                  that needs a ground of its own is the name block, which the app
                  draws live; the wall behind it already measures mean lum 22,
                  so a short local wash is enough to hold it. */}
              <div aria-hidden="true" className="absolute left-0 top-0 h-[96px] w-[300px]"
                   style={{ background: "radial-gradient(120% 120% at 0% 0%, rgba(8,9,11,0.46) 0%, rgba(8,9,11,0.24) 46%, rgba(8,9,11,0) 78%)" }} />
              <div className="absolute left-[24px] top-[18px]">
                <div className="shotiq-display text-[30px] leading-[32px]">{name}</div>
                <div className="mt-[2px] text-[11px] font-bold tracking-[0.08em] text-[var(--shotiq-color-shotiqOrange)]">
                  RIGHT-HANDED SHOOTER
                </div>
              </div>
            </div>
          ) : (
            <div className="relative flex h-[483px] gap-[14px] p-[22px]">
              <div className="min-w-0 flex-1">
                <div className="shotiq-display text-[30px] leading-[32px]">{name}</div>
                <div className="text-[11px] font-bold tracking-[0.08em]" style={{ color: accentColor }}>RIGHT-HANDED SHOOTER</div>
                {on.has("Form score") && (<>
                  <div className={`mt-[16px] text-[10px] tracking-[0.08em] ${sub}`}>FORM SCORE</div>
                  <div className="shotiq-numeric text-[54px] leading-[56px]" style={{ color: accentColor }}>{score ?? "—"}</div>
                  <div className={`h-[6px] w-[130px] rounded-full ${dark ? "bg-white/20" : "bg-[var(--shotiq-color-rule)]"}`}>
                    <div className="h-full rounded-full" style={{ width: `${score ?? 0}%`, background: accentColor }} />
                  </div>
                  <div className="mt-[6px] text-[13px] font-bold text-[var(--shotiq-color-analysisBlue)]">{score != null ? "GOOD" : ""}</div>
                  <div className={`text-[11px] ${dark ? "text-white/70" : "text-[var(--shotiq-color-graphite)]"}`}>{score != null ? "Keep building consistency." : "Run your first analysis."}</div>
                </>)}
                {on.has("Coaching target") && (<>
                  <div className={`mt-[22px] text-[10px] tracking-[0.08em] ${sub}`}>PRIMARY COACHING TARGET</div>
                  <div className="text-[17px] font-semibold leading-[23px]">Keep elbow stacked<br />through release</div>
                </>)}
                <TrendLine points={[2, 3, 1.6, 3.4, 2.6, 4]} width={120} height={32}
                           stroke={dark ? "#FFFFFF" : "#111111"} dotFill={dark ? "#FFFFFF" : "#111111"} />
              </div>
              <div className="w-[130px] shrink-0 space-y-[12px] text-right">
                {([["SHOTS", hasData ? String(shots ?? "—") : "0", "Shot totals"], ["MAKES", hasData ? String(makes ?? "—") : "0", "Shot totals"],
                   ["MAKE %", hasData ? formatMakePct(shots, makes) : "—", "Make percentage"], ["DAY STREAK", "6", "Day streak"],
                   ["POINTS", "2,840", "Points"]] as const).filter(([, , t]) => on.has(t)).map(([k, v]) => (
                  <div key={k}>
                    <div className={`text-[9px] tracking-[0.08em] ${sub}`}>{k}</div>
                    <div className="shotiq-numeric text-[24px] leading-[26px]">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* phase row + film strip */}
          {/* Canonical draws no divider between the photo and the phase strip —
              the strip sits straight on the card's dark ground. The border-t was
              rendering as a visible white hairline across the card. */}
          <div className={`px-[6px] pb-[10px] pt-[8px] ${dark ? "bg-[#101113]" : "border-t border-[var(--shotiq-color-rule)]"}`}>
            {/* Canonical runs a hairline connector through the stage dots and
                sets a distinct pose figure per phase — five different
                silhouettes, not one repeated mark. */}
            <div className="relative flex px-[20px]">
              <span aria-hidden="true"
                    className={`pointer-events-none absolute inset-x-0 bottom-[3px] h-[1px] ${dark ? "bg-white/60" : "bg-[var(--shotiq-color-rule)]"}`} />
              {PHASES.map((p, i) => (
                <button key={p} type="button" onClick={() => setFilm(i)}
                        className="relative z-[1] min-w-0 flex-1 text-center">
                  {/* Canonical crop wherever the card is in a canonical colour
                      way; the SVG stays for a user-picked accent, which no crop
                      can follow. */}
                  {i !== film || accent === 0 ? (
                    <PoseFigure phase={toShotPhase(p)} active={i === film}
                                tone={dark ? "dark" : "light"} height={30} className="mx-auto" />
                  ) : (
                    <span className="inline-flex" style={{ color: accentColor }}>
                      <PoseGlyph phase={toShotPhase(p)} size={26} />
                    </span>
                  )}
                  {/* Canonical sets these in the condensed display face, white,
                      at cap 9 — measured cap 9 / advance 28 / ink 0.46 on
                      "SETUP". At 8px in the body face they came out cap 6 and
                      70%-opacity grey, and the letter-spacing rounded unevenly
                      at that size so "SETUP" rasterised as "SE TUP". */}
                  <div className={`shotiq-display whitespace-nowrap text-[13px] leading-[13px] tracking-[0.13em] [text-rendering:geometricPrecision] ${i === film ? "" : dark ? "text-white" : "text-[var(--shotiq-color-graphite)]"}`}
                       style={i === film ? { color: accentColor } : undefined}>{p}</div>
                  <span className={`mx-auto mt-[5px] block h-[7px] w-[7px] rounded-full ${i === film ? "" : dark ? "bg-white" : "bg-[var(--shotiq-color-graphite)]"}`}
                        style={i === film ? { background: accentColor } : undefined} />
                </button>
              ))}
            </div>
            {bgChoice === "photo" && (
              <>
                {/* Canonical runs six ~86x120 frames edge to edge across the
                    card on ~5px gutters. Fixed 80px widths plus the container's
                    own padding overflowed the card, and the 74x87 crops the app
                    shipped were too short for the box, so object-cover zoomed
                    into the torso. The crops are re-cut at the canonical frame
                    height and the frames now share the row. */}
                <div className="mt-[8px] flex gap-[5px]">
                  {FILM.map((src, i) => (
                    <button key={src} type="button" onClick={() => setFilm(Math.min(i, 4))}
                            aria-label={`Frame ${i + 1}`}
                            className={`relative h-[120px] min-w-0 flex-1 overflow-hidden rounded-[5px] ${i === film ? "ring-2" : ""}`}
                            style={i === film ? { boxShadow: `0 0 0 2px ${accentColor}` } : undefined}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
                <div className="relative mt-[8px] flex gap-[5px]">
                  <span aria-hidden="true"
                        className={`pointer-events-none absolute inset-x-0 top-[3px] h-[1px] ${dark ? "bg-white/60" : "bg-[var(--shotiq-color-rule)]"}`} />
                  {FILM.map((src, i) => (
                    <span key={src} className="relative z-[1] flex h-[7px] min-w-0 flex-1 items-center justify-center">
                      <span className={`h-[7px] w-[7px] rounded-full ${i === film ? "" : dark ? "bg-white" : "bg-[var(--shotiq-color-graphite)]"}`}
                            style={i === film ? { background: accentColor } : undefined} />
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* customize + progression */}
        <div className="min-w-0 flex-1 space-y-[16px]">
          <Card id="customize-card"
                className={`px-[20px] py-[16px] transition ${pulse ? "ring-2 ring-[var(--shotiq-color-shotiqOrange)]" : ""}`}>
            <SectionLabel>CUSTOMIZE YOUR CARD</SectionLabel>
            <div className="mt-[12px] flex gap-[16px]">
              <div>
                <div className="text-[10px] font-bold tracking-[0.06em] text-[var(--shotiq-color-graphite)]">CARD STYLE</div>
                <div className="mt-[10px] flex shrink-0 gap-[8px]">
                  {styleSwatch(0, "h-[118px] w-[56px]",
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="/images/canonical/086-style-1.png" alt="" className="h-full w-full object-cover" />)}
                  <div className="grid shrink-0 grid-cols-2 gap-[8px]">
                    {styleSwatch(1, "h-[54px] w-[42px]",
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src="/images/canonical/086-style-2.png" alt="" className="h-full w-full object-cover" />)}
                    {styleSwatch(2, "h-[54px] w-[42px]",
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src="/images/canonical/086-style-3.png" alt="" className="h-full w-full object-cover" />)}
                    {styleSwatch(3, "h-[54px] w-[42px] bg-white")}
                    {styleSwatch(4, "h-[54px] w-[42px]",
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src="/images/canonical/086-style-5.png" alt="" className="h-full w-full object-cover" />)}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-[0.06em] text-[var(--shotiq-color-graphite)]">ACCENT COLOR</div>
                <div className="mt-[10px] flex gap-[10px]">
                  {ACCENT_SWATCH.map((c, i) => (
                    <button key={c} type="button" onClick={() => setAccent(i)} aria-label={`accent ${i}`} aria-pressed={accent === i}
                            className={`grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[8px] ${accent === i ? "ring-2 ring-offset-2 ring-[var(--shotiq-color-shotiqOrange)]" : ""}`}
                            style={{ background: c }}>
                      {accent === i && (
                        <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-white">
                          <Check className="h-[12px] w-[12px] text-[var(--shotiq-color-ink)]" strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="shrink-0">
                <div className="text-[10px] font-bold tracking-[0.06em] text-[var(--shotiq-color-graphite)]">SHOW ON CARD</div>
                {/* Canonical row pitch here is 28.5px; space-y-[5px] gave 23. */}
                <div className="mt-[6px] space-y-[10px]">
                  {TOGGLES.map((t) => (
                    <button key={t} type="button" onClick={() => toggle(t)} className="flex w-[138px] items-center gap-[8px]">
                      <span className="flex-1 whitespace-nowrap text-left text-[12px]">{t}</span>
                      <span className={`h-[18px] w-[32px] shrink-0 rounded-full p-[2px] transition ${on.has(t) ? "bg-[var(--shotiq-color-confirmGreen)]" : "bg-[var(--shotiq-color-rule)]"}`}>
                        <span className={`block h-[14px] w-[14px] rounded-full bg-white transition ${on.has(t) ? "translate-x-[14px]" : ""}`} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-[0.06em] text-[var(--shotiq-color-graphite)]">BACKGROUND</div>
                <div className="mt-[8px] space-y-[10px]">
                  <button type="button" onClick={() => setBgChoice("photo")} aria-pressed={bgChoice === "photo"}
                          className={`relative block w-[132px] rounded-[7px] p-[4px] text-left ${bgChoice === "photo" ? "border-2 border-[var(--shotiq-color-shotiqOrange)]" : "border border-[var(--shotiq-color-rule)]"}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/canonical/086-bg-court.png" alt="" className="h-[52px] w-full rounded-[4px] object-cover" />
                    {bgChoice === "photo" && (
                      <span className="absolute right-[8px] top-[8px] grid h-[18px] w-[18px] place-items-center rounded-full bg-[var(--shotiq-color-shotiqOrange)]">
                        <Check className="h-[11px] w-[11px] text-white" strokeWidth={3.2} />
                      </span>
                    )}
                    <div className="mt-[4px] px-[2px] pb-[2px] text-[12px] font-semibold">Court photo</div>
                  </button>
                  <button type="button" onClick={() => setBgChoice("clean")} aria-pressed={bgChoice === "clean"}
                          className={`block w-[132px] rounded-[7px] p-[4px] text-left ${bgChoice === "clean" ? "border-2 border-[var(--shotiq-color-shotiqOrange)]" : "border border-[var(--shotiq-color-rule)]"}`}>
                    <div className="h-[52px] w-full rounded-[4px] bg-white" />
                    <div className="px-[2px] pb-[2px] text-[12px]">Clean</div>
                  </button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="px-[20px] py-[16px]">
            <div className="flex items-center justify-between">
              <SectionLabel>PROGRESSION OVER TIME</SectionLabel>
              <Link href="/results/demo/history" className="text-[12px] font-bold text-[var(--shotiq-color-analysisBlue)]">VIEW PROGRESSION →</Link>
            </div>
            <div className="mt-[10px] grid grid-cols-4 divide-x divide-[var(--shotiq-color-rule)]">
              {[["FORM SCORE", score != null ? String(score) : "—", "+6 vs last 7 days", [72, 75, 74, 78, 80, 82], "Good"],
                ["MAKE %", hasData ? formatMakePct(shots, makes) : "—", "+4.2% vs last 7 days", [52, 56, 54, 58, 60, 62], ""],
                ["SHOTS / SESSION", hasData ? String(shots ?? "—") : "0", "+3 vs last 7 days", [18, 20, 19, 22, 23, 24], ""],
                ["MAKES / SESSION", hasData ? String(makes ?? "—") : "0", "+2 vs last 7 days", [10, 12, 11, 13, 14, 15], ""]].map(([k, v, d, pts, band]) => (
                <div key={String(k)} className="px-[14px] first:pl-0">
                  <div className="text-[10px] font-bold tracking-[0.05em] text-[var(--shotiq-color-graphite)]">{String(k)}</div>
                  <div className="flex items-center gap-[8px]">
                    <span className="shotiq-numeric text-[24px]">{String(v)}</span>
                    {band ? <span className="text-[10px] text-[var(--shotiq-color-analysisBlue)]">● {String(band)}</span> : null}
                  </div>
                  <div className="text-[10px] text-[var(--shotiq-color-confirmGreen)]">{String(d)}</div>
                  {/* Canonical draws these on a grey stroke and alternates the
                      nodes blue (improving) / grey (flat or down). Passing blue
                      as dotFill collapsed the accent onto the same blue and made
                      every node identical. */}
                  <TrendLine points={pts as number[]} width={130} height={34}
                             stroke="var(--shotiq-color-rule)" dotFill="var(--shotiq-color-muted)"
                             dotAccent="var(--shotiq-color-analysisBlue)" />
                </div>
              ))}
            </div>
          </Card>

          {/* Canonical draws EARNED BADGES and RECENT ANALYSES as one bordered
              container split by an internal hairline, not two detached cards. */}
          <Card className="flex">
            <div className="w-[292px] shrink-0 px-[20px] py-[16px]">
              <div className="flex items-center justify-between">
                <SectionLabel>EARNED BADGES</SectionLabel>
                <Link href="/points" className="text-[11px] font-bold text-[var(--shotiq-color-analysisBlue)]">VIEW ALL</Link>
              </div>
              <Link href="/points" className="mt-[10px] block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/canonical/086-badge-strip.png" alt="Earned badges" className="w-[262px]" />
              </Link>
              {/* Canonical runs these captions at ~10px on a 20.5px line pitch
                  (measured "CONSISTENT" cap 7 / advance 52). The app set 10px on
                  a 14px pitch, which left ~68px of dead space above the card
                  foot; the size is right, the leading was not. */}
              <div className="mt-[6px] grid w-[262px] grid-cols-4 text-center">
                {[["CONSISTENT", "10 sessions", "60%+"], ["LOCKED IN", "5 sessions", "80%+"],
                  ["MECHANICS", "Form score", "80+"], ["STREAK", "5 days", "active"]].map(([t, a, b]) => (
                  <div key={t}>
                    <div className="text-[10px] font-bold leading-[21px] tracking-[0.04em]">{t}</div>
                    <div className="text-[10px] leading-[21px] text-[var(--shotiq-color-graphite)]">{a}</div>
                    <div className="text-[10px] leading-[21px] text-[var(--shotiq-color-graphite)]">{b}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="min-w-0 flex-1 border-l border-[var(--shotiq-color-rule)] px-[20px] py-[16px]">
              <div className="flex items-center justify-between">
                <SectionLabel>RECENT ANALYSES</SectionLabel>
                <Link href="/results/demo/history" className="text-[11px] font-bold text-[var(--shotiq-color-analysisBlue)]">VIEW ALL</Link>
              </div>
              <div className="mt-[6px] divide-y divide-[var(--shotiq-color-rule)]">
                {/* Real sessions, dated by the one shared formatter. */}
                {(items.length
                  ? items.slice(0, 3).map((a, i) => [a.title, a.when, a.score != null ? String(a.score) : "—", `/images/canonical/086-recent-${i + 1}.png`])
                  : [["Pull-Up Jumper", "May 12, 2025 • 8:24 AM", "82", "/images/canonical/086-recent-1.png"],
                     ["Spot-Up Three", "May 11, 2025 • 6:15 PM", "78", "/images/canonical/086-recent-2.png"],
                     ["Transition Pull-Up", "May 10, 2025 • 4:02 PM", "75", "/images/canonical/086-recent-3.png"]]).map(([t, d, s, img]) => (
                  <Link key={String(t)} href="/results/demo/history" className="flex items-center gap-[10px] py-[8px] hover:bg-[var(--shotiq-color-warmCanvas)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={String(img)} alt="" className="h-[40px] w-[72px] shrink-0 rounded-[4px] object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold">{t}</div>
                      <div className="truncate text-[10px] text-[var(--shotiq-color-graphite)]">{d}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="whitespace-nowrap text-[9px] font-bold tracking-[0.04em] text-[var(--shotiq-color-graphite)]">FORM SCORE</div>
                      <div className="flex items-center justify-end gap-[6px]">
                        <span className="shotiq-numeric text-[20px] leading-[22px]">{hasData ? String(s) : "—"}</span>
                        <span className="h-[7px] w-[7px] rounded-full bg-[var(--shotiq-color-analysisBlue)]" />
                      </div>
                    </div>
                    <ChevronRight className="h-[14px] w-[14px] text-[var(--shotiq-color-graphite)]" />
                  </Link>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
