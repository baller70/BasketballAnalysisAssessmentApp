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
import { SectionLabel, Card, TrendLine, PhaseGlyph } from "@/components/shotiq/ShotIQShell"
import { useHistory } from "@/components/shotiq/ResultsBits"
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
  const { hasData, score } = useHistory()
  const authUser = useAuthStore((s) => s.user)
  const name = (authUser?.displayName || authUser?.firstName || "Jordan Ellis").toUpperCase()
  const [accent, setAccent] = useState(0)
  const [cardStyle, setCardStyle] = useState(0)
  const [bgChoice, setBgChoice] = useState<"photo" | "clean">("photo")
  const [on, setOn] = useState(() => new Set(TOGGLES))
  const [film, setFilm] = useState(3)
  const [shareMsg, setShareMsg] = useState("")
  const [pulse, setPulse] = useState(false)
  const toggle = (t: string) => setOn((s) => { const n = new Set(s); n.has(t) ? n.delete(t) : n.add(t); return n })
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
          <h1 className="shotiq-display text-[48px] leading-[50px]">PLAYER CARD</h1>
          <p className="mt-[4px] text-[14px] text-[var(--shotiq-color-graphite)]">
            Showcase your form. Track your progress. Share your game.
          </p>
        </div>
        <div className="flex gap-[12px]">
          <button type="button" onClick={jumpToCustomize}
                  className="flex h-[46px] items-center gap-[8px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] px-[20px] text-[13px] font-bold tracking-[0.04em] text-white">
            <Pencil className="h-[15px] w-[15px]" /> CUSTOMIZE CARD
          </button>
          <button type="button" onClick={share}
                  className="flex h-[46px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[20px] text-[13px] font-bold tracking-[0.04em]">
            <Share2 className="h-[15px] w-[15px]" /> {shareMsg || "SHARE"}
          </button>
          <button type="button" onClick={download}
                  className="flex h-[46px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[20px] text-[13px] font-bold tracking-[0.04em]">
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
              <div className="absolute left-[24px] top-[18px]">
                <div className="shotiq-display text-[30px] leading-[32px]">{name}</div>
                <div className="mt-[2px] text-[11px] font-bold tracking-[0.08em] text-[var(--shotiq-color-shotiqOrange)]">
                  RIGHT-HANDED SHOOTER
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-[483px] gap-[14px] p-[22px]">
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
                {([["SHOTS", hasData ? "24" : "0", "Shot totals"], ["MAKES", hasData ? "15" : "0", "Shot totals"],
                   ["MAKE %", hasData ? "62.5%" : "—", "Make percentage"], ["DAY STREAK", "6", "Day streak"],
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
          <div className={`border-t px-[10px] pb-[12px] pt-[8px] ${dark ? "border-white/15 bg-[#101113]" : "border-[var(--shotiq-color-rule)]"}`}>
            <div className="flex justify-around px-[16px]">
              {PHASES.map((p, i) => (
                <button key={p} type="button" onClick={() => setFilm(i)} className="text-center">
                  <span style={i === film ? { color: accentColor } : undefined}
                        className={i === film ? "" : dark ? "text-white" : ""}><PhaseGlyph active={i === film} size={26} /></span>
                  <div className={`text-[8px] tracking-[0.06em] ${i === film ? "font-bold" : dark ? "text-white/70" : "text-[var(--shotiq-color-graphite)]"}`}
                       style={i === film ? { color: accentColor } : undefined}>{p}</div>
                  <span className={`mx-auto mt-[4px] block h-[6px] w-[6px] rounded-full ${i === film ? "" : "bg-white/40"}`}
                        style={i === film ? { background: accentColor } : undefined} />
                </button>
              ))}
            </div>
            {bgChoice === "photo" && (
              <>
                <div className="mt-[8px] flex justify-between gap-[6px] px-[6px]">
                  {FILM.map((src, i) => (
                    <button key={src} type="button" onClick={() => setFilm(Math.min(i, 4))}
                            aria-label={`Frame ${i + 1}`}
                            className={`relative h-[91px] w-[80px] shrink-0 overflow-hidden rounded-[4px] ${i === film ? "ring-2" : ""}`}
                            style={i === film ? { boxShadow: `0 0 0 2px ${accentColor}` } : undefined}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
                <div className="mt-[8px] flex justify-between gap-[6px] px-[6px]">
                  {FILM.map((src, i) => (
                    <span key={src} className="flex h-[6px] w-[80px] items-center justify-center">
                      <span className={`h-[6px] w-[6px] rounded-full ${i === film ? "" : "bg-white/35"}`}
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
                <div className="mt-[6px] space-y-[5px]">
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
                ["MAKE %", hasData ? "62.5%" : "—", "+4.2% vs last 7 days", [52, 56, 54, 58, 60, 62], ""],
                ["SHOTS / SESSION", hasData ? "24" : "0", "+3 vs last 7 days", [18, 20, 19, 22, 23, 24], ""],
                ["MAKES / SESSION", hasData ? "15" : "0", "+2 vs last 7 days", [10, 12, 11, 13, 14, 15], ""]].map(([k, v, d, pts, band]) => (
                <div key={String(k)} className="px-[14px] first:pl-0">
                  <div className="text-[10px] font-bold tracking-[0.05em] text-[var(--shotiq-color-graphite)]">{String(k)}</div>
                  <div className="flex items-center gap-[8px]">
                    <span className="shotiq-numeric text-[24px]">{String(v)}</span>
                    {band ? <span className="text-[10px] text-[var(--shotiq-color-analysisBlue)]">● {String(band)}</span> : null}
                  </div>
                  <div className="text-[10px] text-[var(--shotiq-color-confirmGreen)]">{String(d)}</div>
                  <TrendLine points={pts as number[]} width={130} height={34}
                             stroke="var(--shotiq-color-analysisBlue)" dotFill="var(--shotiq-color-analysisBlue)" />
                </div>
              ))}
            </div>
          </Card>

          <div className="flex gap-[16px]">
            <Card className="w-[330px] shrink-0 px-[20px] py-[16px]">
              <div className="flex items-center justify-between">
                <SectionLabel>EARNED BADGES</SectionLabel>
                <Link href="/points" className="text-[11px] font-bold text-[var(--shotiq-color-analysisBlue)]">VIEW ALL</Link>
              </div>
              <Link href="/points" className="mt-[10px] block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/canonical/086-badge-strip.png" alt="Earned badges" className="w-[292px]" />
              </Link>
              <div className="grid w-[292px] grid-cols-4 text-center">
                {[["CONSISTENT", "10 sessions", "60%+"], ["LOCKED IN", "5 sessions", "80%+"],
                  ["MECHANICS", "Form score", "80+"], ["STREAK", "5 days", "active"]].map(([t, a, b]) => (
                  <div key={t}>
                    <div className="text-[10px] font-bold tracking-[0.04em]">{t}</div>
                    <div className="text-[10px] text-[var(--shotiq-color-graphite)]">{a}</div>
                    <div className="text-[10px] text-[var(--shotiq-color-graphite)]">{b}</div>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="min-w-0 flex-1 px-[20px] py-[16px]">
              <div className="flex items-center justify-between">
                <SectionLabel>RECENT ANALYSES</SectionLabel>
                <Link href="/results/demo/history" className="text-[11px] font-bold text-[var(--shotiq-color-analysisBlue)]">VIEW ALL</Link>
              </div>
              <div className="mt-[6px] divide-y divide-[var(--shotiq-color-rule)]">
                {[["Pull-Up Jumper", "May 12, 2025 · 8:24 AM", "82", "/images/canonical/086-recent-1.png"],
                  ["Spot-Up Three", "May 11, 2025 · 6:15 PM", "78", "/images/canonical/086-recent-2.png"],
                  ["Transition Pull-Up", "May 10, 2025 · 4:02 PM", "75", "/images/canonical/086-recent-3.png"]].map(([t, d, s, img]) => (
                  <Link key={String(t)} href="/results/demo/history" className="flex items-center gap-[12px] py-[8px] hover:bg-[var(--shotiq-color-warmCanvas)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={String(img)} alt="" className="h-[44px] w-[80px] shrink-0 rounded-[4px] object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold">{t}</div>
                      <div className="text-[10px] text-[var(--shotiq-color-graphite)]">{d}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-bold tracking-[0.06em] text-[var(--shotiq-color-graphite)]">FORM SCORE</div>
                      <div className="flex items-center justify-end gap-[6px]">
                        <span className="shotiq-numeric text-[20px] leading-[22px]">{hasData ? String(s) : "—"}</span>
                        <span className="h-[7px] w-[7px] rounded-full bg-[var(--shotiq-color-analysisBlue)]" />
                      </div>
                    </div>
                    <ChevronRight className="h-[14px] w-[14px] text-[var(--shotiq-color-graphite)]" />
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
