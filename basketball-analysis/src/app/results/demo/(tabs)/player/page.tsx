"use client"

/** /results/demo/player — canonical 086-web-player-card. */

import React, { useState } from "react"
import Link from "next/link"
import { Pencil, Share2, Download } from "lucide-react"
import { SectionLabel, Card, MediaSurface, TrendLine, PhaseGlyph, Stat } from "@/components/shotiq/ShotIQShell"
import { useHistory } from "@/components/shotiq/ResultsBits"
import { useAuthStore } from "@/stores/authStore"

const TOGGLES = ["Form score", "Shot totals", "Make percentage", "Day streak", "Points", "Coaching target"]
const CARD_BG = ["#141518", "#1B1D20", "#20242B", "#2A1F18", "#FFFFFF"]
const ACCENTS = [
  "var(--shotiq-color-shotiqOrange)", "var(--shotiq-color-analysisBlue)",
  "var(--shotiq-color-confirmGreen)", "var(--shotiq-color-graphite)",
]

export default function PlayerCardPage() {
  const { hasData, score } = useHistory()
  const authUser = useAuthStore((s) => s.user)
  const name = (authUser?.displayName || authUser?.firstName || "Your Name").toUpperCase()
  const [accent, setAccent] = useState(0)
  const [cardStyle, setCardStyle] = useState(0)
  const [bgChoice, setBgChoice] = useState<"photo" | "clean">("photo")
  const [on, setOn] = useState(() => new Set(TOGGLES))
  const [shareMsg, setShareMsg] = useState("")
  const [pulse, setPulse] = useState(false)
  const toggle = (t: string) => setOn((s) => { const n = new Set(s); n.has(t) ? n.delete(t) : n.add(t); return n })
  const dark = cardStyle !== 4
  const accentColor = ACCENTS[accent]
  const sub = dark ? "text-white/60" : "text-[var(--shotiq-color-graphite)]"
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

      <div className="mt-[16px] flex gap-[20px]">
        {/* the card itself — dark is canonical here (media/photo surface card);
            style/accent pickers below restyle it live */}
        <div className={`w-[480px] shrink-0 overflow-hidden rounded-[8px] ${dark ? "text-white" : "border border-[var(--shotiq-color-rule)] text-[var(--shotiq-color-ink)]"}`}
             style={{ background: CARD_BG[cardStyle] }}>
          <div className="flex gap-[14px] p-[22px]">
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
          <div className={`border-t px-[22px] py-[12px] ${dark ? "border-white/15" : "border-[var(--shotiq-color-rule)]"}`}>
            <div className="flex justify-between">
              {["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"].map((p) => (
                <div key={p} className="text-center">
                  <span style={p === "RELEASE" ? { color: accentColor } : undefined}
                        className={p === "RELEASE" ? "" : dark ? "text-white" : ""}><PhaseGlyph active={p === "RELEASE"} size={26} /></span>
                  <div className={`text-[8px] tracking-[0.06em] ${p === "RELEASE" ? "font-bold" : dark ? "text-white/70" : "text-[var(--shotiq-color-graphite)]"}`}
                       style={p === "RELEASE" ? { color: accentColor } : undefined}>{p}</div>
                </div>
              ))}
            </div>
            {bgChoice === "photo" && (
              <div className="mt-[10px] flex gap-[6px]">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-[72px] flex-1 rounded-[3px] bg-[#26282c]"
                       style={i === 3 ? { boxShadow: `0 0 0 2px ${accentColor}` } : undefined} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* customize + progression */}
        <div className="min-w-0 flex-1 space-y-[16px]">
          <Card id="customize-card"
                className={`px-[20px] py-[16px] transition ${pulse ? "ring-2 ring-[var(--shotiq-color-shotiqOrange)]" : ""}`}>
            <SectionLabel>CUSTOMIZE YOUR CARD</SectionLabel>
            <div className="mt-[12px] flex gap-[40px]">
              <div>
                <div className="text-[10px] font-bold tracking-[0.06em] text-[var(--shotiq-color-graphite)]">CARD STYLE</div>
                <div className="mt-[8px] grid grid-cols-3 gap-[8px]">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <button key={i} type="button" aria-label={`Card style ${i + 1}`} aria-pressed={cardStyle === i}
                            onClick={() => setCardStyle(i)}
                            className={`h-[54px] w-[38px] rounded-[6px] ${i === 4 ? "border border-[var(--shotiq-color-rule)]" : ""} ${cardStyle === i ? "ring-2 ring-[var(--shotiq-color-shotiqOrange)]" : ""}`}
                            style={{ background: CARD_BG[i] }} />
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-[0.06em] text-[var(--shotiq-color-graphite)]">ACCENT COLOR</div>
                <div className="mt-[8px] flex gap-[8px]">
                  {["var(--shotiq-color-shotiqOrange)", "var(--shotiq-color-analysisBlue)", "var(--shotiq-color-confirmGreen)", "var(--shotiq-color-graphite)"].map((c, i) => (
                    <button key={c} type="button" onClick={() => setAccent(i)} aria-label={`accent ${i}`} aria-pressed={accent === i}
                            className={`h-[28px] w-[28px] rounded-[6px] ${accent === i ? "ring-2 ring-offset-2 ring-[var(--shotiq-color-shotiqOrange)]" : ""}`}
                            style={{ background: c }} />
                  ))}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold tracking-[0.06em] text-[var(--shotiq-color-graphite)]">SHOW ON CARD</div>
                <div className="mt-[6px] space-y-[5px]">
                  {TOGGLES.map((t) => (
                    <button key={t} type="button" onClick={() => toggle(t)} className="flex w-[170px] items-center gap-[10px]">
                      <span className="flex-1 whitespace-nowrap text-left text-[12px]">{t}</span>
                      <span className={`h-[16px] w-[30px] rounded-full p-[2px] transition ${on.has(t) ? "bg-[var(--shotiq-color-confirmGreen)]" : "bg-[var(--shotiq-color-rule)]"}`}>
                        <span className={`block h-[12px] w-[12px] rounded-full bg-white transition ${on.has(t) ? "translate-x-[14px]" : ""}`} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-[0.06em] text-[var(--shotiq-color-graphite)]">BACKGROUND</div>
                <div className="mt-[8px] space-y-[8px]">
                  <button type="button" onClick={() => setBgChoice("photo")} aria-pressed={bgChoice === "photo"}
                          className={`block rounded-[6px] p-[4px] text-left ${bgChoice === "photo" ? "border-2 border-[var(--shotiq-color-shotiqOrange)]" : "border border-[var(--shotiq-color-rule)]"}`}>
                    <MediaSurface width={120} height={54} rounded={4} /><div className="mt-[3px] text-[11px]">Court photo</div>
                  </button>
                  <button type="button" onClick={() => setBgChoice("clean")} aria-pressed={bgChoice === "clean"}
                          className={`block rounded-[6px] p-[4px] text-left ${bgChoice === "clean" ? "border-2 border-[var(--shotiq-color-shotiqOrange)]" : "border border-[var(--shotiq-color-rule)]"}`}>
                    <div className="h-[54px] w-[120px] rounded-[4px] bg-white" /><div className="mt-[3px] text-[11px]">Clean</div>
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
              {[["FORM SCORE", score != null ? String(score) : "—", "+6 vs last 7 days", [72, 75, 74, 78, 80, 82]],
                ["MAKE %", hasData ? "62.5%" : "—", "+4.2% vs last 7 days", [52, 56, 54, 58, 60, 62]],
                ["SHOTS / SESSION", hasData ? "24" : "0", "+3 vs last 7 days", [18, 20, 19, 22, 23, 24]],
                ["MAKES / SESSION", hasData ? "15" : "0", "+2 vs last 7 days", [10, 12, 11, 13, 14, 15]]].map(([k, v, d, pts]) => (
                <div key={String(k)} className="px-[14px] first:pl-0">
                  <div className="text-[10px] font-bold tracking-[0.05em] text-[var(--shotiq-color-graphite)]">{String(k)}</div>
                  <div className="shotiq-numeric text-[24px]">{String(v)}</div>
                  <div className="text-[10px] text-[var(--shotiq-color-confirmGreen)]">{String(d)}</div>
                  <TrendLine points={pts as number[]} width={130} height={34}
                             stroke="var(--shotiq-color-analysisBlue)" dotFill="var(--shotiq-color-analysisBlue)" />
                </div>
              ))}
            </div>
          </Card>

          <div className="flex gap-[16px]">
            <Card className="flex-1 px-[20px] py-[16px]">
              <div className="flex items-center justify-between">
                <SectionLabel>EARNED BADGES</SectionLabel>
                <Link href="/points" className="text-[11px] font-bold text-[var(--shotiq-color-analysisBlue)]">VIEW ALL</Link>
              </div>
              <div className="mt-[10px] flex gap-[18px]">
                {[["CONSISTENT", "10 sessions 60%+", "var(--shotiq-color-confirmGreen)"],
                  ["LOCKED IN", "5 sessions 80%+", "var(--shotiq-color-analysisBlue)"],
                  ["MECHANICS", "Form score 80+", "var(--shotiq-color-shotiqOrange)"],
                  ["STREAK", "5 days active", "var(--shotiq-color-muted)"]].map(([t, d, c]) => (
                  <div key={String(t)} className="text-center">
                    <svg width="52" height="58" viewBox="0 0 52 58" aria-hidden="true">
                      <polygon points="26,2 49,15 49,43 26,56 3,43 3,15" fill="none" stroke={String(c)} strokeWidth="2.5" />
                    </svg>
                    <div className="text-[10px] font-bold tracking-[0.04em]">{t}</div>
                    <div className="text-[9px] text-[var(--shotiq-color-graphite)]">{d}</div>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="flex-1 px-[20px] py-[16px]">
              <div className="flex items-center justify-between">
                <SectionLabel>RECENT ANALYSES</SectionLabel>
                <Link href="/results/demo/history" className="text-[11px] font-bold text-[var(--shotiq-color-analysisBlue)]">VIEW ALL</Link>
              </div>
              <div className="mt-[6px] divide-y divide-[var(--shotiq-color-rule)]">
                {[["Pull-Up Jumper", "May 12, 2025 · 8:24 AM", "82"], ["Spot-Up Three", "May 11, 2025 · 6:15 PM", "78"], ["Transition Pull-Up", "May 10, 2025 · 4:02 PM", "75"]].map(([t, d, s]) => (
                  <div key={String(t)} className="flex items-center gap-[12px] py-[8px]">
                    <MediaSurface width={64} height={38} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold">{t}</div>
                      <div className="text-[10px] text-[var(--shotiq-color-graphite)]">{d}</div>
                    </div>
                    <Stat value={hasData ? String(s) : "—"} label="FORM SCORE" valueClass="text-[20px] leading-[22px]" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
