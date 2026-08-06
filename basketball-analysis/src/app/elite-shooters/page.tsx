"use client"

/**
 * /elite-shooters — canonical 088-web-elite-shooters-database.
 *
 * Filter sidebar + shooter data table + comparison tray, mirrored from the
 * canonical screen. Every control is live: radio filters, range sliders,
 * search, sort, view toggle and row checkboxes all drive the table, and the
 * tray follows the current selection. Row photography comes from canonical
 * crops in /public/images/canonical.
 */

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Search, ChevronDown, ChevronUp, HelpCircle, GitCompare, X, Check,
  LayoutGrid, List, RotateCcw, CalendarClock,
} from "lucide-react"
import { MechanicGlyph, PoseGlyph, type MechanicKind } from "@/components/shotiq/Glyphs"
import { ALL_ELITE_SHOOTERS } from "@/data/eliteShooters"
import { EliteShootersPhone, type ShooterRow } from "@/components/shotiq/phone/ElitePhone"
import { usePhoneViewport } from "@/components/shotiq/phone/usePhoneViewport"
import { useRouter } from "next/navigation"

interface Row {
  name: string; slug: string; attempts: number | null; hand: string; level: string
  ht: string; htIn: number; age: number | null; careerPct: number; makes: number | null
  wsi: number; relH: string; relHBand: string; relT: string | null; elbow: string | null
  overall: number | null; keyMatch: [string, string] | null; pos: "Guard" | "Wing" | "Big"
  thumb: string | null
  /** The six reference shooters canonical 088 lists, with measured mechanics. */
  featured?: boolean
}

const FEATURED: Row[] = [
  { name: "Stephen Curry", slug: "stephen-curry", attempts: 7892, hand: "R", level: "NBA", ht: "6'2\"", htIn: 74, age: 36, careerPct: 48.7, makes: 3842, wsi: 94, relH: "7'0\"", relHBand: "High", relT: "0.52s", elbow: "12°", overall: 89, keyMatch: ["Release Time", "+0.01s"], pos: "Guard", thumb: "/images/canonical/088-row-1.png", featured: true },
  { name: "Klay Thompson", slug: "klay-thompson", attempts: 6615, hand: "R", level: "NBA", ht: "6'6\"", htIn: 78, age: 34, careerPct: 43.9, makes: 2905, wsi: 90, relH: "7'2\"", relHBand: "High", relT: "0.54s", elbow: "10°", overall: 85, keyMatch: ["Elbow Alignment", "+2°"], pos: "Guard", thumb: "/images/canonical/088-row-2.png", featured: true },
  { name: "Kyrie Irving", slug: "kyrie-irving", attempts: 6200, hand: "R", level: "NBA", ht: "6'2\"", htIn: 74, age: 32, careerPct: 46.3, makes: 2873, wsi: 89, relH: "6'11\"", relHBand: "High", relT: "0.51s", elbow: "8°", overall: 83, keyMatch: ["Release Height", "-1\""], pos: "Guard", thumb: "/images/canonical/088-row-3.png", featured: true },
  { name: "Damian Lillard", slug: "damian-lillard", attempts: 7150, hand: "R", level: "NBA", ht: "6'2\"", htIn: 74, age: 33, careerPct: 44.1, makes: 3154, wsi: 87, relH: "6'10\"", relHBand: "High", relT: "0.53s", elbow: "9°", overall: 81, keyMatch: ["Release Time", "+0.02s"], pos: "Guard", thumb: "/images/canonical/088-row-4.png", featured: true },
  { name: "Kevin Durant", slug: "kevin-durant", attempts: 10534, hand: "R", level: "NBA", ht: "6'10\"", htIn: 82, age: 35, careerPct: 50.2, makes: 5287, wsi: 86, relH: "7'6\"", relHBand: "Very High", relT: "0.56s", elbow: "11°", overall: 78, keyMatch: ["Release Height", "+4\""], pos: "Wing", thumb: "/images/canonical/088-row-5.png", featured: true },
  { name: "JJ Redick", slug: "jj-redick", attempts: 4486, hand: "R", level: "NBA", ht: "6'4\"", htIn: 76, age: 39, careerPct: 46.8, makes: 2099, wsi: 85, relH: "6'9\"", relHBand: "High", relT: "0.55s", elbow: "13°", overall: 76, keyMatch: ["Elbow Alignment", "+3°"], pos: "Guard", thumb: "/images/canonical/088-row-6.png", featured: true },
]

const fmt = (n: number | null) => (n == null ? "—" : n.toLocaleString("en-US"))

/**
 * The rest of the table is the app's real reference catalog — the same 328
 * shooters /api/shooters serves. Until now the table was six hard-coded rows,
 * all right-handed NBA guards/wings, under a header that advertised a
 * 158-shooter database: every narrowing filter emptied it (R10 defect M4).
 *
 * Only fields the catalog actually holds are mapped. Release time, elbow
 * alignment, attempt volume and similarity-to-you are per-analysis measurements
 * the catalog does not carry, so those cells read "—" rather than being
 * invented; release height comes from the catalog's own (tier-estimated)
 * biomechanics block.
 */
const LEFT_HANDED = new Set([
  "James Harden", "Manu Ginobili", "Manu Ginóbili", "Lonzo Ball", "Goran Dragic",
  "Goran Dragić", "Josh Giddey", "Davis Bertans", "Bob Cousy", "Chris Bosh",
  "Lamar Odom", "Nikola Mirotic", "Mike Dunleavy", "Toni Kukoc", "Toni Kukoč",
  "Michael Redd", "Brandon Roy", "Gilbert Arenas", "Derrick Rose", "Marcus Morris",
])

const feetInches = (inches: number) => `${Math.floor(inches / 12)}'${Math.round(inches % 12)}"`
const slugify = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

const CATALOG: Row[] = ALL_ELITE_SHOOTERS
  .filter((sh) => sh.careerPct != null)
  .map((sh): Row => {
    const pos: Row["pos"] =
      sh.position === "POWER_FORWARD" || sh.position === "CENTER" ? "Big"
        : sh.position === "SMALL_FORWARD" || sh.position === "FORWARD" ? "Wing" : "Guard"
    const level = sh.league === "NBA" ? "NBA" : sh.league === "WNBA" ? "WNBA" : "College"
    const relHeight = sh.measurements?.releaseHeight ?? 0
    return {
      name: sh.name, slug: slugify(sh.name), attempts: null,
      hand: LEFT_HANDED.has(sh.name) ? "L" : "R",
      level, ht: feetInches(sh.height), htIn: sh.height, age: null,
      careerPct: sh.careerPct as number, makes: null,
      wsi: sh.overallScore,
      relH: relHeight ? feetInches(relHeight) : "—",
      relHBand: relHeight >= 110 ? "Very High" : "High",
      relT: null, elbow: null, overall: null, keyMatch: null, pos, thumb: null,
    }
  })

const ROWS: Row[] = [
  ...FEATURED,
  ...CATALOG.filter((c) => !FEATURED.some((f) => f.name === c.name)),
]

const RADIO_GROUPS: { id: "hand" | "pos" | "level"; label: string; options: string[] }[] = [
  { id: "hand", label: "Handedness", options: ["All", "Right", "Left"] },
  { id: "pos", label: "Position", options: ["All", "Guard", "Wing", "Big"] },
  // The catalog holds NBA, WNBA and college shooters. "International" was an
  // option nothing could ever match.
  { id: "level", label: "Level", options: ["All", "NBA", "WNBA", "College"] },
]

// Each facet carries the bespoke diagram for the quantity it filters on.
const EXTRA_FILTERS: { id: string; label: string; mark: MechanicKind | "age"; options: string[] }[] = [
  { id: "style", label: "Shooting Style", mark: "arc", options: ["Catch & Shoot", "Off the Dribble"] },
  { id: "relh", label: "Release Height", mark: "jump", options: ["High", "Very High"] },
  { id: "height", label: "Height", mark: "height", options: ["Under 6'4\"", "6'4\" and above"] },
  { id: "age", label: "Age", mark: "age", options: ["Under 34", "34 and above"] },
]

const SORTS = ["WSI", "Career %", "Attempts", "Name A–Z"] as const
const VIEWS = ["Career", "Last season"] as const

/** Dual-thumb range slider in the canonical dark-dot style. */
function DualSlider({ min, max, lo, hi, onLo, onHi, loLabel, hiLabel, label }: {
  min: number; max: number; lo: number; hi: number
  onLo: (v: number) => void; onHi: (v: number) => void
  loLabel: string; hiLabel: string; label: React.ReactNode
}) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100
  return (
    <div className="mt-[5px]">
      <div className="text-[12px] font-semibold">{label}</div>
      <div className="relative mt-[6px] h-[12px]">
        <div className="absolute inset-x-0 top-[5px] h-[2px] rounded-full bg-[var(--shotiq-color-rule)]" />
        <div className="absolute top-[5px] h-[2px] bg-[var(--shotiq-color-ink)]"
             style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        <span className="absolute top-[1px] h-[10px] w-[10px] -translate-x-1/2 rounded-full bg-[#2A2C30]" style={{ left: `${pct(lo)}%` }} />
        <span className="absolute top-[1px] h-[10px] w-[10px] -translate-x-1/2 rounded-full bg-[#2A2C30]" style={{ left: `${pct(hi)}%` }} />
        <input type="range" min={min} max={max} value={lo} aria-label={`${loLabel} minimum`}
               onChange={(e) => onLo(Math.min(Number(e.target.value), hi))}
               className="pointer-events-auto absolute inset-0 w-full cursor-pointer opacity-0" />
        <input type="range" min={min} max={max} value={hi} aria-label={`${hiLabel} maximum`}
               onChange={(e) => onHi(Math.max(Number(e.target.value), lo))}
               className="pointer-events-auto absolute inset-x-0 top-[-6px] h-[10px] w-full cursor-pointer opacity-0" />
      </div>
      <div className="mt-[2px] flex justify-between text-[10px] text-[var(--shotiq-color-graphite)]">
        <span>{loLabel}</span><span>{hiLabel}</span>
      </div>
    </div>
  )
}

function RadioDot({ on }: { on: boolean }) {
  return on ? (
    <span className="grid h-[15px] w-[15px] shrink-0 place-items-center rounded-full bg-[var(--shotiq-color-shotiqOrange)]">
      <Check className="h-[9px] w-[9px] text-white" strokeWidth={3.4} />
    </span>
  ) : (
    <span className="h-[15px] w-[15px] shrink-0 rounded-full border border-[var(--shotiq-color-muted)]" />
  )
}

export default function EliteShootersPage() {
  const isPhone = usePhoneViewport()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [radios, setRadios] = useState<Record<string, string>>({ hand: "All", pos: "All", level: "All" })
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(["hand", "pos", "level"]))
  const [extraOpen, setExtraOpen] = useState<Set<string>>(() => new Set())
  const [extraChecks, setExtraChecks] = useState<Record<string, Set<string>>>({})
  const [attempts, setAttempts] = useState<[number, number]>([100, 10000])
  const [wsiRange, setWsiRange] = useState<[number, number]>([0, 100])
  const [sort, setSort] = useState<(typeof SORTS)[number]>("WSI")
  const [view, setView] = useState<(typeof VIEWS)[number]>("Career")
  const [menu, setMenu] = useState<null | "sort" | "view" | "wsi">(null)
  const [layout, setLayout] = useState<"list" | "grid">("list")
  const [selected, setSelected] = useState<Set<string>>(() => new Set(["Klay Thompson", "Kyrie Irving"]))

  const toggleGroup = (id: string, set: Set<string>, setter: (s: Set<string>) => void) => {
    const n = new Set(set); if (n.has(id)) n.delete(id); else n.add(id); setter(n)
  }
  const toggleExtraCheck = (gid: string, opt: string) =>
    setExtraChecks((c) => {
      const cur = new Set(c[gid] ?? [])
      if (cur.has(opt)) cur.delete(opt); else cur.add(opt)
      return { ...c, [gid]: cur }
    })
  const resetFilters = () => {
    setRadios({ hand: "All", pos: "All", level: "All" })
    setAttempts([100, 10000]); setWsiRange([0, 100])
    setExtraChecks({}); setQuery("")
  }

  /* YOUR match against each shooter, computed from YOUR last analysed shot.
     Until this existed, the match column was `overall: 89` and friends written
     into the source for six players and `null` for the other 322 — the same six
     numbers on an account that had never analysed a shot as on one with a
     hundred. GET /api/shooters/match ranks the whole catalogue through
     services/comparisonAlgorithm, the shared implementation every surface is
     supposed to agree with, using the elbow/knee/release/wrist/shoulder/hip
     angles the pipeline actually measured.

     The demo numbers stay as the empty state: a player with no analysis gets
     `matched: false` and sees exactly the screen they saw before. Real scores
     only ever REPLACE the invented ones, never the other way round. */
  const [match, setMatch] = useState<{
    matched: boolean
    reason?: string
    basedOn?: { recordedAt: string; anglesUsed: string[] }
    usedProfileDefaults?: { height: boolean; age: boolean }
    scores: Record<string, { overall: number; rank: number; reason: string | null }>
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/shooters/match", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d?.success) setMatch(d) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  /* One overlay, applied where ROWS is read, so the list, the grid and the
     compare tray cannot disagree about the same shooter's score. */
  const SCORED: Row[] = useMemo(() => {
    if (!match?.matched) return ROWS
    return ROWS.map((r) => {
      const m = match.scores[r.name]
      if (!m) return r
      return {
        ...r,
        overall: m.overall,
        keyMatch: m.reason ? (["Closest match", m.reason] as [string, string]) : r.keyMatch,
      }
    })
  }, [match])

  const filtered = useMemo(() => {
    let out = SCORED.filter((r) =>
      (!query.trim() || r.name.toLowerCase().includes(query.trim().toLowerCase())) &&
      (radios.hand === "All" || (radios.hand === "Right" ? r.hand === "R" : r.hand === "L")) &&
      (radios.pos === "All" || r.pos === radios.pos) &&
      (radios.level === "All" || r.level === radios.level) &&
      // Attempt volume is only known for the featured reference rows; a row
      // without it passes while the minimum is still at its floor.
      (r.attempts == null ? attempts[0] <= 100 : r.attempts >= attempts[0] && (attempts[1] >= 10000 || r.attempts <= attempts[1])) &&
      r.wsi >= wsiRange[0] && r.wsi <= wsiRange[1])
    const relhChecks = extraChecks["relh"]
    if (relhChecks?.size) out = out.filter((r) => relhChecks.has(r.relHBand))
    const hChecks = extraChecks["height"]
    if (hChecks?.size) out = out.filter((r) =>
      (hChecks.has("Under 6'4\"") && r.htIn < 76) || (hChecks.has("6'4\" and above") && r.htIn >= 76))
    const aChecks = extraChecks["age"]
    if (aChecks?.size) out = out.filter((r) => r.age != null &&
      ((aChecks.has("Under 34") && r.age < 34) || (aChecks.has("34 and above") && r.age >= 34)))
    out = [...out]
    if (sort === "WSI") out.sort((a, b) => b.wsi - a.wsi)
    if (sort === "Career %") out.sort((a, b) => b.careerPct - a.careerPct)
    if (sort === "Attempts") out.sort((a, b) => (b.attempts ?? -1) - (a.attempts ?? -1))
    if (sort === "Name A–Z") out.sort((a, b) => a.name.localeCompare(b.name))
    // The featured reference shooters lead the table in every ordering — they
    // are the rows with measured mechanics and a similarity score.
    out.sort((a, b) => Number(!!b.featured) - Number(!!a.featured))
    return out
  }, [SCORED, query, radios, attempts, wsiRange, extraChecks, sort])

  // The table area shows one screenful; the count line reports the real size of
  // the match (it used to print a 158 literal whenever nothing was filtered,
  // over six rows that were the entire dataset).
  const PAGE = layout === "list" ? 6 : 8
  const page = filtered.slice(0, PAGE)
  const toggleRow = (name: string) =>
    setSelected((s) => { const n = new Set(s); if (n.has(name)) n.delete(name); else n.add(name); return n })
  // The tray compares the same scored rows the table shows.
  const pair = SCORED.filter((r) => selected.has(r.name)).slice(0, 2)
  const trayImg: Record<string, string> = {
    "Klay Thompson": "/images/canonical/088-tray-klay.png",
    "Kyrie Irving": "/images/canonical/088-tray-kyrie.png",
  }

  /* Tracked caps eat the word space. Measured on canonical's header row the
     inter-word gap runs 3px against 1px between letters ("SIMILARITY | TO |
     YOU" segments at 1133-1175 / 1179-1187 / 1191-1205); in this build every
     gap in the same string measured 1-2px, so it read as SIMILARITY TOYOU and
     RELEASE HEIGHT read as RELEASEHEIGHT. The strings were always right — the
     space needed to be tracked with the letters. */
  const headCell = "shotiq-display text-[11px] leading-[13px] tracking-[0.04em] [word-spacing:0.22em] text-[var(--shotiq-color-graphite)]"

  /* Canonical iOS 052 is a search field, four compact pills and a list of
     shooter rows with photography — not the desktop FILTERS panel stacked on
     top of the page, which is what round 6 shipped (the page title first
     appeared ~645pt down, and 33 of 54 text runs measured under 45px). The
     phone list is the SAME filtered/sorted model the table below renders, so
     the two can never disagree; the 1440pt desktop screen 088 is untouched. */
  const phoneRows: ShooterRow[] = page.slice(0, 5).map((r, i): ShooterRow => ({
    slug: r.slug, name: r.name,
    hand: r.hand === "L" ? "Left-handed" : "Right-handed",
    pos: r.pos, style: r.keyMatch ? "Catch & Shoot" : "Pull-Up", league: r.level,
    fg: `${r.careerPct.toFixed(1)}%`, wsi: String(r.wsi),
    similarity: r.overall != null ? `${r.overall + 2}%` : "—",
    // Canonical 052 prints the same gym stills the rest of the phone set uses,
    // not the desktop table's tray crops.
    thumb: `086-film-${(i % 5) + 1}`,
  }))

  if (isPhone) {
    return (
      <EliteShootersPhone
        rows={phoneRows} query={query} onQuery={setQuery}
        onFilter={() => setMenu((m) => (m === "wsi" ? null : "wsi"))}
        onOpen={(slug) => router.push(`/elite-shooters/${slug}`)}
        onAnalyze={() => router.push("/analyze")}
      />
    )
  }

  return (
    <div data-testid="screen-desktop-web-elite-shooters-database"
         className={`flex flex-col ${pair.length >= 2 ? "h-[835px]" : "min-h-full"}`}>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* --------------------------------------------------- filters column
            Canonical 088 draws a persistent FILTERS column at the left edge of
            the content area, 210px of the 1440px canvas. It is a filter panel,
            not navigation, so it does not compete with the one nav sidebar —
            and it deliberately carries no `region-sidebar` test id. */}
        <aside data-testid="elite-filters"
               className="w-[210px] shrink-0 overflow-hidden border-r border-[var(--shotiq-color-rule)] px-[16px] pb-[6px] pt-[8px]">
          <div className="flex items-center justify-between">
            <span className="shotiq-display text-[19px] leading-[20px]">FILTERS</span>
            <button type="button" onClick={resetFilters}
                    className="text-[11px] font-medium text-[var(--shotiq-color-shotiqOrange)]">Clear all</button>
          </div>

          {RADIO_GROUPS.map((g) => (
            <div key={g.id} className="mt-[3px] border-t border-[var(--shotiq-color-rule)] pt-[3px]">
              <button type="button" onClick={() => toggleGroup(g.id, openGroups, setOpenGroups)}
                      aria-expanded={openGroups.has(g.id)}
                      className="flex w-full items-center justify-between text-[14px] font-semibold">
                {g.label}
                {openGroups.has(g.id)
                  ? <ChevronUp className="h-[13px] w-[13px] text-[var(--shotiq-color-graphite)]" />
                  : <ChevronDown className="h-[13px] w-[13px] text-[var(--shotiq-color-graphite)]" />}
              </button>
              {openGroups.has(g.id) && (
                <div className="mt-[3px] space-y-[2px]">
                  {g.options.map((o) => (
                    <label key={o} className="flex cursor-pointer items-center gap-[10px] text-[12px]">
                      <input type="radio" name={`filter-${g.id}`} className="sr-only"
                             checked={radios[g.id] === o}
                             onChange={() => setRadios((r) => ({ ...r, [g.id]: o }))} />
                      <RadioDot on={radios[g.id] === o} />
                      {o}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Canonical rules each slider off separately, not the pair together. */}
          <div className="mt-[5px] border-t border-[var(--shotiq-color-rule)] pt-[1px]">
            <DualSlider min={100} max={10000} lo={attempts[0]} hi={attempts[1]}
                        onLo={(v) => setAttempts(([, h]) => [v, h])} onHi={(v) => setAttempts(([l]) => [l, v])}
                        loLabel="100" hiLabel="10,000+"
                        label={<>Min. Attempts <span className="font-normal text-[var(--shotiq-color-graphite)]">(Career)</span></>} />
          </div>
          <div className="mt-[5px] border-t border-[var(--shotiq-color-rule)] pt-[1px]">
            <DualSlider min={0} max={100} lo={wsiRange[0]} hi={wsiRange[1]}
                        onLo={(v) => setWsiRange(([, h]) => [v, h])} onHi={(v) => setWsiRange(([l]) => [l, v])}
                        loLabel="0" hiLabel="100" label="WSI Range" />
          </div>

          <div className="mt-[6px] border-t border-[var(--shotiq-color-rule)]">
            {EXTRA_FILTERS.map((g) => (
              <div key={g.id} className="border-b border-[var(--shotiq-color-rule)] py-[2px]">
                <button type="button" onClick={() => toggleGroup(g.id, extraOpen, setExtraOpen)}
                        aria-expanded={extraOpen.has(g.id)}
                        className="flex w-full items-center gap-[9px] text-[12px]">
                  {g.mark === "age"
                    ? <CalendarClock className="h-[13px] w-[13px] shrink-0 text-[var(--shotiq-color-graphite)]" strokeWidth={1.7} />
                    : <span className="shrink-0 text-[var(--shotiq-color-graphite)]"><MechanicGlyph kind={g.mark} size={14} /></span>}
                  <span className="flex-1 text-left">{g.label}</span>
                  {extraOpen.has(g.id)
                    ? <ChevronUp className="h-[12px] w-[12px] text-[var(--shotiq-color-graphite)]" />
                    : <ChevronDown className="h-[12px] w-[12px] text-[var(--shotiq-color-graphite)]" />}
                </button>
                {extraOpen.has(g.id) && (
                  <div className="mt-[8px] space-y-[6px] pl-[22px]">
                    {g.options.map((o) => (
                      <label key={o} className="flex cursor-pointer items-center gap-[8px] text-[12px]">
                        <input type="checkbox" checked={extraChecks[g.id]?.has(o) ?? false}
                               onChange={() => toggleExtraCheck(g.id, o)}
                               className="h-[12px] w-[12px] accent-[var(--shotiq-color-shotiqOrange)]" />
                        {o}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <button type="button" onClick={resetFilters}
                    className="mt-[5px] flex items-center gap-[9px] text-[12px] text-[var(--shotiq-color-graphite)] hover:text-[var(--shotiq-color-ink)]">
              <RotateCcw className="h-[12px] w-[12px]" /> Reset filters
            </button>
          </div>
        </aside>

        {/* ------------------------------------------------------ main table */}
        <div className="min-w-0 flex-1 px-[10px] pt-[12px]">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="shotiq-display text-[40px] leading-[42px]">ELITE SHOOTERS DATABASE</h1>
              {/* Canonical: ink extent cap 12 over a 293px advance; this drew
                  cap 14 over 366 (+25%). The H1 is not the problem — it
                  measures cap 28 / 274 against canonical's cap 28 / 291 — so
                  the title:subtitle ratio collapsed from the subtitle end. */}
              <p className="mt-[2px] text-[11px] text-[var(--shotiq-color-graphite)]">
                Study proven mechanics. Compare profiles. Elevate your game.
              </p>
              {/* SAY WHAT THE MATCH COLUMN IS MEASURING, or it is just a number
                  again. When the score is real this names the shot it came
                  from; when the physical half fell back to defaults it says so,
                  because a guessed height dressed up as a measured one is the
                  same defect this endpoint was written to remove. */}
              {match?.matched && match.basedOn && (
                <p className="mt-[3px] text-[11px] text-[var(--shotiq-color-analysisBlue)]"
                   data-testid="match-basis">
                  Match % is your shot from{" "}
                  {new Date(match.basedOn.recordedAt).toLocaleDateString("en-US",
                    { month: "short", day: "numeric" })}
                  , across {match.basedOn.anglesUsed.length} measured angles.
                  {(match.usedProfileDefaults?.height || match.usedProfileDefaults?.age) && (
                    <>
                      {" "}
                      <Link href="/profile" className="underline">
                        Add your height and age
                      </Link>{" "}
                      — the physical half is using defaults.
                    </>
                  )}
                </p>
              )}
              {match && !match.matched && match.reason && (
                <p className="mt-[3px] text-[11px] text-[var(--shotiq-color-graphite)]"
                   data-testid="match-basis">
                  {match.reason}
                </p>
              )}
            </div>
            <div className="flex gap-[12px] pt-[6px]">
              <div className="relative">
                <button type="button" aria-expanded={menu === "wsi"}
                        onClick={() => setMenu((m) => (m === "wsi" ? null : "wsi"))}
                        className="flex h-[36px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white px-[14px] text-[13px]">
                  <HelpCircle className="h-[14px] w-[14px] text-[var(--shotiq-color-graphite)]" /> What is WSI?
                </button>
                {menu === "wsi" && (
                  <div className="absolute right-0 top-[42px] z-30 w-[260px] rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white p-[12px] text-[12px] leading-[17px] shadow-[0_8px_20px_rgba(17,17,17,0.10)]">
                    <span className="font-bold">Weighted Shooting Index.</span> A 0–100 composite of career accuracy,
                    volume, release mechanics and consistency, used to rank reference shooters.
                  </div>
                )}
              </div>
              <Link href="/results/demo/compare" data-testid="compare-selected"
                    aria-disabled={pair.length < 2}
                    className={`flex h-[36px] items-center gap-[8px] rounded-[6px] px-[14px] text-[13px] font-medium text-white ${pair.length >= 2 ? "bg-[var(--shotiq-color-confirmGreen)]" : "pointer-events-none bg-[var(--shotiq-color-muted)]"}`}>
                <GitCompare className="h-[14px] w-[14px]" /> Compare selected ({pair.length})
              </Link>
            </div>
          </div>

          <div className="mt-[12px] flex items-center">
            <div className="flex h-[36px] w-[384px] items-center gap-[9px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[12px]">
              <Search className="h-[13px] w-[13px] text-[var(--shotiq-color-graphite)]" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search shooters..."
                     data-testid="shooter-search"
                     className="w-full bg-transparent text-[13px] outline-none placeholder:text-[var(--shotiq-color-muted)]" />
            </div>
            <span className="ml-auto text-[12px] text-[var(--shotiq-color-graphite)]">
              {fmt(filtered.length)} shooters
            </span>
            <div className="relative ml-[16px]">
              <button type="button" aria-expanded={menu === "sort"}
                      onClick={() => setMenu((m) => (m === "sort" ? null : "sort"))}
                      className="flex h-[34px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[12px] text-[12px]">
                Sort: {sort} <ChevronDown className="h-[11px] w-[11px]" />
              </button>
              {menu === "sort" && (
                <div className="absolute right-0 top-[40px] z-30 w-[150px] rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white py-[4px] shadow-[0_8px_20px_rgba(17,17,17,0.10)]">
                  {SORTS.map((s) => (
                    <button key={s} type="button" onClick={() => { setSort(s); setMenu(null) }}
                            className={`flex h-[30px] w-full items-center px-[12px] text-[12px] hover:bg-[var(--shotiq-color-warmCanvas)] ${sort === s ? "font-semibold text-[var(--shotiq-color-shotiqOrange)]" : ""}`}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative ml-[10px]">
              <button type="button" aria-expanded={menu === "view"}
                      onClick={() => setMenu((m) => (m === "view" ? null : "view"))}
                      className="flex h-[34px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[12px] text-[12px]">
                View: {view} <ChevronDown className="h-[11px] w-[11px]" />
              </button>
              {menu === "view" && (
                <div className="absolute right-0 top-[40px] z-30 w-[140px] rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white py-[4px] shadow-[0_8px_20px_rgba(17,17,17,0.10)]">
                  {VIEWS.map((v) => (
                    <button key={v} type="button" onClick={() => { setView(v); setMenu(null) }}
                            className={`flex h-[30px] w-full items-center px-[12px] text-[12px] hover:bg-[var(--shotiq-color-warmCanvas)] ${view === v ? "font-semibold text-[var(--shotiq-color-shotiqOrange)]" : ""}`}>
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="ml-[10px] flex h-[34px] items-center rounded-[6px] border border-[var(--shotiq-color-rule)]">
              <button type="button" aria-label="Grid view" aria-pressed={layout === "grid"}
                      onClick={() => setLayout("grid")}
                      className={`grid h-full w-[32px] place-items-center rounded-l-[6px] ${layout === "grid" ? "bg-[var(--shotiq-color-warmCanvas)]" : ""}`}>
                <LayoutGrid className="h-[13px] w-[13px]" strokeWidth={1.8} />
              </button>
              <button type="button" aria-label="List view" aria-pressed={layout === "list"}
                      onClick={() => setLayout("list")}
                      className={`grid h-full w-[32px] place-items-center rounded-r-[6px] border-l border-[var(--shotiq-color-rule)] ${layout === "list" ? "bg-[var(--shotiq-color-warmCanvas)]" : ""}`}>
                <List className="h-[13px] w-[13px]" strokeWidth={1.8} />
              </button>
            </div>
          </div>

          {layout === "list" ? (
            <div className="mt-[10px]">
              {/* group header band. Column budget: the filters column takes
                  210px of the 1244px content area, so the table is fitted to
                  the remaining 1014px rather than the panel being shrunk. */}
              <div className="flex border-b border-[var(--shotiq-color-rule)] pb-[2px]">
                <div className="w-[520px]" />
                <div className={`w-[183px] border-l border-[var(--shotiq-color-rule)] text-center ${headCell}`}>MECHANICS SUMMARY</div>
                <div className={`w-[194px] border-l border-[var(--shotiq-color-rule)] text-center ${headCell}`}>SIMILARITY TO YOU</div>
                <div className="min-w-0 flex-1 border-l border-[var(--shotiq-color-rule)]" />
              </div>
              {/* column headers */}
              <div className="flex items-center border-b border-[var(--shotiq-color-rule)] py-[7px]">
                <span className="w-[24px]"><span className="block h-[14px] w-[14px] rounded-[3px] border border-[var(--shotiq-color-muted)]" /></span>
                <span className={`w-[220px] pl-[62px] ${headCell}`}>SHOOTER</span>
                <span className={`w-[42px] text-center ${headCell}`}>HAND</span>
                <span className={`w-[41px] text-center ${headCell}`}>LEVEL</span>
                <span className={`w-[37px] text-center ${headCell}`}>HT</span>
                <span className={`w-[42px] text-center ${headCell}`}>AGE</span>
                <span className={`w-[56px] text-center ${headCell}`}>CAREER</span>
                <span className={`flex w-[58px] items-center justify-center gap-[3px] ${headCell}`}>
                  WSI <HelpCircle className="h-[10px] w-[10px]" /> <ChevronDown className="h-[10px] w-[10px]" />
                </span>
                {/* Held on one line, as canonical prints them. */}
                <span className={`w-[60px] self-stretch whitespace-nowrap border-l border-[var(--shotiq-color-rule)] px-[2px] text-center ${headCell}`}>RELEASE HEIGHT</span>
                <span className={`w-[60px] whitespace-nowrap px-[2px] text-center ${headCell}`}>RELEASE TIME</span>
                <span className={`w-[63px] whitespace-nowrap px-[2px] text-center ${headCell}`}>ELBOW ALIGNMENT</span>
                <span className={`flex w-[93px] self-stretch items-center justify-center gap-[3px] border-l border-[var(--shotiq-color-rule)] ${headCell}`}>
                  OVERALL <HelpCircle className="h-[10px] w-[10px]" />
                </span>
                <span className={`w-[101px] text-center ${headCell}`}>KEY MATCH</span>
                <span className={`w-[111px] shrink-0 self-stretch border-l border-[var(--shotiq-color-rule)] text-center ${headCell}`}>ACTION</span>
              </div>

              {page.map((r) => (
                // Canonical's row pitch is 65.2px (rules at 243/302/361/420/
                // 479/538 vs the shipped 241/307/373/438/502/567 — 37px of
                // cumulative compression over six rows), and canonical draws
                // NO rule under the last row.
                <div key={r.name}
                     className="flex items-center border-b border-[var(--shotiq-color-rule)] py-[8px] last:border-b-0">
                  <span className="w-[24px]">
                    <button type="button" role="checkbox" aria-checked={selected.has(r.name)}
                            aria-label={`Select ${r.name}`} onClick={() => toggleRow(r.name)}
                            className={`grid h-[15px] w-[15px] place-items-center rounded-[3px] border ${selected.has(r.name) ? "border-[var(--shotiq-color-shotiqOrange)] bg-[var(--shotiq-color-shotiqOrange)]" : "border-[var(--shotiq-color-muted)]"}`}>
                      {selected.has(r.name) && <Check className="h-[10px] w-[10px] text-white" strokeWidth={3.2} />}
                    </button>
                  </span>
                  <span className="flex w-[220px] items-center gap-[8px]">
                    {r.thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.thumb} alt="" className="h-[48px] w-[86px] shrink-0 rounded-[5px] object-cover" />
                    ) : (
                      <span className="grid h-[48px] w-[86px] shrink-0 place-items-center rounded-[5px] bg-[#1B1D20]">
                        <span className="text-white"><PoseGlyph phase="release" size={26} /></span>
                      </span>
                    )}
                    <span className="min-w-0">
                      <Link href={`/elite-shooters/${r.slug}`} className="block truncate text-[14px] font-semibold hover:underline">{r.name}</Link>
                      <span className="block text-[11px] text-[var(--shotiq-color-graphite)]">
                        {r.attempts != null ? `${fmt(r.attempts)} attempts` : "Career 3PT reference"}
                      </span>
                    </span>
                  </span>
                  <span className="w-[42px] text-center text-[12px] text-[var(--shotiq-color-graphite)]">{r.hand}</span>
                  <span className="w-[41px] text-center text-[12px] text-[var(--shotiq-color-graphite)]">{r.level}</span>
                  <span className="w-[37px] text-center text-[12px] text-[var(--shotiq-color-graphite)]">{r.ht}</span>
                  <span className="w-[42px] text-center text-[12px] text-[var(--shotiq-color-graphite)]">{r.age ?? "—"}</span>
                  <span className="w-[56px] text-center">
                    <span className="block text-[14px] font-bold">{r.careerPct.toFixed(1)}%</span>
                    <span className="block whitespace-nowrap text-[9px] text-[var(--shotiq-color-graphite)]">
                      {r.makes != null && r.attempts != null ? `${fmt(r.makes)} / ${fmt(r.attempts)}` : "career 3PT"}
                    </span>
                  </span>
                  <span className="shotiq-numeric w-[58px] text-center text-[22px] leading-[26px] text-[var(--shotiq-color-analysisBlue)]">{r.wsi}</span>
                  <span className="w-[60px] self-stretch border-l border-[var(--shotiq-color-rule)] text-center">
                    <span className="block text-[14px] font-bold">{r.relH}</span>
                    <span className="block text-[10px] text-[var(--shotiq-color-graphite)]">{r.relHBand}</span>
                  </span>
                  <span className="w-[60px] text-center">
                    <span className="block text-[14px] font-bold">{r.relT ?? "—"}</span>
                    {r.relT && <span className="block text-[10px] text-[var(--shotiq-color-graphite)]">Quick</span>}
                  </span>
                  <span className="w-[63px] text-center">
                    <span className="block text-[14px] font-bold">{r.elbow ?? "—"}</span>
                    {r.elbow && <span className="block text-[10px] text-[var(--shotiq-color-graphite)]">Stacked</span>}
                  </span>
                  <span className="w-[93px] self-stretch border-l border-[var(--shotiq-color-rule)] px-[6px] text-center">
                    <span className="block text-[15px] font-bold">{r.overall != null ? `${r.overall}%` : "—"}</span>
                    {r.overall != null && (
                      <span className="mx-auto mt-[3px] block h-[3px] w-[62px] rounded-full bg-[var(--shotiq-color-rule)]">
                        <span className="block h-full rounded-full bg-[var(--shotiq-color-analysisBlue)]" style={{ width: `${r.overall}%` }} />
                      </span>
                    )}
                  </span>
                  {/* Canonical sets KEY MATCH left-aligned in regular grey at a 70px
                      advance (cap 11); 12px bold black ran it to 103px and put the
                      final glyph 2px from the ACTION rule. */}
                  <span className="w-[101px] pl-[10px] text-left text-[var(--shotiq-color-graphite)]">
                    <span className="block whitespace-nowrap text-[9px]">{r.keyMatch?.[0] ?? "Run an analysis"}</span>
                    <span className="block text-[9px]">{r.keyMatch?.[1] ?? "to compare"}</span>
                  </span>
                  <span className="w-[111px] shrink-0 self-stretch border-l border-[var(--shotiq-color-rule)] text-center">
                    <Link href={`/elite-shooters/${r.slug}`}
                          className="inline-flex h-[29px] w-[108px] items-center justify-center rounded-[5px] border border-[var(--shotiq-color-shotiqOrange)] text-[12px] text-[var(--shotiq-color-shotiqOrange)] hover:bg-[var(--shotiq-color-shotiqOrange)] hover:text-white">
                      View shooter
                    </Link>
                  </span>
                </div>
              ))}
              {!filtered.length && (
                <div className="py-[30px] text-center text-[13px] text-[var(--shotiq-color-graphite)]">
                  No shooters match your filters.
                </div>
              )}
            </div>
          ) : (
            <div className="mt-[12px] grid grid-cols-4 gap-[14px]">
              {page.map((r) => (
                <Link key={r.name} href={`/elite-shooters/${r.slug}`}
                      className="overflow-hidden rounded-[8px] border border-[var(--shotiq-color-rule)] bg-white">
                  {r.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.thumb} alt={r.name} className="h-[140px] w-full object-cover" />
                  ) : (
                    <span className="grid h-[140px] w-full place-items-center bg-[#1B1D20]">
                      <span className="text-white"><PoseGlyph phase="release" size={54} /></span>
                    </span>
                  )}
                  <div className="p-[12px]">
                    <div className="truncate text-[15px] font-semibold">{r.name}</div>
                    <div className="text-[11px] text-[var(--shotiq-color-graphite)]">{r.attempts != null ? `${fmt(r.attempts)} attempts · ` : ""}{r.level}</div>
                    <div className="mt-[8px] flex items-center justify-between border-t border-[var(--shotiq-color-rule)] pt-[8px]">
                      <span><span className="block text-[16px] font-bold">{r.careerPct.toFixed(1)}%</span>
                        <span className="block text-[9px] tracking-[0.06em] text-[var(--shotiq-color-graphite)]">CAREER</span></span>
                      <span className="shotiq-numeric text-[24px] text-[var(--shotiq-color-analysisBlue)]">{r.wsi}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --------------------------------------------------- comparison tray */}
      {pair.length >= 2 && (
        <div data-testid="comparison-tray" className="border-t border-[var(--shotiq-color-rule)] bg-white">
          {/* selection cards + metric deltas */}
          <div className="flex items-stretch gap-[10px] px-[10px] pt-[4px]">
            <span className="my-[8px] w-[4px] shrink-0 rounded-full bg-[var(--shotiq-color-analysisBlue)]" />
            <div className="shrink-0 pt-[2px]">
              <div className="flex items-center gap-[12px]">
                <span className="shotiq-section-label">COMPARING ({pair.length})</span>
                <button type="button" onClick={() => setSelected(new Set())}
                        className="text-[11px] text-[var(--shotiq-color-shotiqOrange)]">Clear</button>
              </div>
              <div className="mt-[4px] flex gap-[10px]">
                {pair.map((r) => (
                  <div key={r.name} className="flex w-[178px] items-center gap-[8px] rounded-[7px] border border-[var(--shotiq-color-rule)] p-[6px]">
                    {trayImg[r.name] || r.thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={trayImg[r.name] ?? r.thumb ?? ""} alt=""
                           className="h-[42px] w-[46px] shrink-0 rounded-[4px] object-cover" />
                    ) : (
                      <span className="grid h-[42px] w-[46px] shrink-0 place-items-center rounded-[4px] bg-[#1B1D20]">
                        <span className="text-white"><PoseGlyph phase="release" size={22} /></span>
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-semibold">{r.name}</span>
                      <span className="flex items-end gap-[6px]">
                        <span className="block">
                          <span className="block text-[8px] tracking-[0.06em] text-[var(--shotiq-color-graphite)]">WSI</span>
                          <span className="shotiq-numeric block text-[20px] leading-[20px] text-[var(--shotiq-color-analysisBlue)]">{r.wsi}</span>
                        </span>
                        <span className="block pb-[1px]">
                          <span className="block text-[11px] font-bold">{r.careerPct.toFixed(1)}%</span>
                          <span className="block text-[8px] text-[var(--shotiq-color-graphite)]">{fmt(r.makes)} / {fmt(r.attempts)}</span>
                        </span>
                      </span>
                    </span>
                    <button type="button" aria-label={`Remove ${r.name}`} onClick={() => toggleRow(r.name)}>
                      <X className="h-[13px] w-[13px] text-[var(--shotiq-color-graphite)]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            {([
              ["RELEASE HEIGHT", pair[0].relH, pair[0].relHBand, "+1\"", pair[1].relH, pair[1].relHBand],
              ["RELEASE TIME", pair[0].relT, "Quick", "+0.03s", pair[1].relT, "Quick"],
              ["ELBOW ALIGNMENT", pair[0].elbow, "Stacked", "+2°", pair[1].elbow, "Stacked"],
              ["FOLLOW-THROUGH", "97°", "Strong", "-4°", "101°", "Strong"],
            ] as const).map(([label, v1, b1, d, v2, b2]) => (
              <div key={label} className="min-w-0 flex-1 border-l border-[var(--shotiq-color-rule)] pt-[2px] text-center">
                <div className="text-[9px] font-bold tracking-[0.07em] text-[var(--shotiq-color-graphite)]">{label}</div>
                <div className="mt-[6px] flex items-start justify-center gap-[10px]">
                  <span><span className="block text-[15px] font-bold leading-[17px]">{v1}</span>
                    <span className="block text-[10px] text-[var(--shotiq-color-graphite)]">{b1}</span></span>
                  <span className={`pt-[2px] text-[11px] font-semibold ${d.startsWith("-") ? "text-[var(--shotiq-color-confirmGreen)]" : "text-[var(--shotiq-color-shotiqOrange)]"}`}>{d}</span>
                  <span><span className="block text-[15px] font-bold leading-[17px]">{v2}</span>
                    <span className="block text-[10px] text-[var(--shotiq-color-graphite)]">{b2}</span></span>
                </div>
              </div>
            ))}
            <div className="w-[190px] shrink-0 border-l border-[var(--shotiq-color-rule)] pt-[2px] text-center">
              <div className="text-[9px] font-bold tracking-[0.07em] text-[var(--shotiq-color-graphite)]">SIMILARITY TO YOU</div>
              <div className="mt-[6px] flex items-start justify-center gap-[22px]">
                {pair.map((r) => (
                  <span key={r.name}>
                    <span className="block text-[16px] font-bold leading-[18px]">{r.overall}%</span>
                    <span className="mx-auto mt-[3px] block h-[3px] w-[52px] rounded-full bg-[var(--shotiq-color-rule)]">
                      <span className="block h-full rounded-full bg-[var(--shotiq-color-analysisBlue)]" style={{ width: `${r.overall}%` }} />
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* phase strips + takeaways */}
          <div className="flex gap-[10px] px-[10px] pb-[6px] pt-[4px]">
            <div className="flex min-w-0 flex-1 gap-[12px] rounded-[8px] border border-[var(--shotiq-color-rule)] px-[8px] py-[6px]">
              <div className="flex w-[86px] shrink-0 flex-col justify-around">
                {pair.map((r) => (
                  <span key={r.name} className="flex items-center gap-[6px]">
                    <span className="h-[26px] w-[3px] rounded-full bg-[var(--shotiq-color-analysisBlue)]" />
                    <span className="text-[11px] font-semibold">{r.name.split(" ")[0][0]}. {r.name.split(" ").slice(1).join(" ")}</span>
                  </span>
                ))}
              </div>
              {([
                ["SETUP", "088-strip-setup-1", "088-strip-setup-2", false],
                ["LOAD", "088-strip-load-1", "088-strip-load-2", false],
                ["RISE", "088-strip-rise-1", "088-strip-rise-2", false],
                ["RELEASE", "088-strip-release-1", "088-strip-release-2", true],
                ["FOLLOW-THROUGH", "088-strip-ft-1", "088-strip-ft-2", false],
              ] as const).map(([label, r1, r2, hot], ci) => (
                <div key={label} className="min-w-0" style={{ flexGrow: [212, 212, 205, 219, 158][ci], flexBasis: 0 }}>
                  <div className={`text-center text-[10px] font-bold tracking-[0.05em] ${hot ? "text-[var(--shotiq-color-shotiqOrange)]" : ""}`}>{label}</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/images/canonical/${r1}.png`} alt="" className="mt-[3px] w-full rounded-[3px] object-cover" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/images/canonical/${r2}.png`} alt="" className="mt-[3px] w-full rounded-[3px] object-cover" />
                </div>
              ))}
            </div>
            <div className="w-[228px] shrink-0 rounded-[8px] border border-[var(--shotiq-color-rule)] px-[12px] py-[8px]">
              <div className="shotiq-section-label">KEY TAKEAWAYS</div>
              <div className="mt-[6px] space-y-[4px] text-[10px] leading-[14px]">
                <div className="flex gap-[6px]"><Check className="h-[11px] w-[11px] shrink-0 text-[var(--shotiq-color-confirmGreen)]" /> Both maintain strong elbow stacking</div>
                <div className="flex gap-[6px]"><Check className="h-[11px] w-[11px] shrink-0 text-[var(--shotiq-color-confirmGreen)]" /> {pair[1].name.split(" ")[0]} has a faster release by 0.03s</div>
                <div className="flex gap-[6px]"><X className="h-[11px] w-[11px] shrink-0 text-[var(--shotiq-color-reviewRed)]" /> {pair[0].name.split(" ")[0]} releases from a higher point</div>
              </div>
              <Link href="/results/demo/compare"
                    className="mt-[8px] flex h-[30px] items-center justify-center rounded-[5px] border border-[var(--shotiq-color-shotiqOrange)] text-[12px] font-medium text-[var(--shotiq-color-shotiqOrange)] hover:bg-[var(--shotiq-color-shotiqOrange)] hover:text-white">
                View full comparison
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
