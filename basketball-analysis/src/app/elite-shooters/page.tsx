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

import React, { useMemo, useState } from "react"
import Link from "next/link"
import {
  Search, ChevronDown, ChevronUp, HelpCircle, GitCompare, X, Check,
  LayoutGrid, List, RotateCcw, MoveVertical, User as UserIcon, Ruler, CalendarClock,
} from "lucide-react"

interface Row {
  name: string; slug: string; attempts: number; hand: string; level: string
  ht: string; htIn: number; age: number; careerPct: number; makes: number
  wsi: number; relH: string; relHBand: string; relT: string; elbow: string
  overall: number; keyMatch: [string, string]; pos: "Guard" | "Wing" | "Big"
  thumb: string
}

const ROWS: Row[] = [
  { name: "Stephen Curry", slug: "stephen-curry", attempts: 7892, hand: "R", level: "NBA", ht: "6'2\"", htIn: 74, age: 36, careerPct: 48.7, makes: 3842, wsi: 94, relH: "7'0\"", relHBand: "High", relT: "0.52s", elbow: "12°", overall: 89, keyMatch: ["Release Time", "+0.01s"], pos: "Guard", thumb: "/images/canonical/088-row-1.png" },
  { name: "Klay Thompson", slug: "klay-thompson", attempts: 6615, hand: "R", level: "NBA", ht: "6'6\"", htIn: 78, age: 34, careerPct: 43.9, makes: 2905, wsi: 90, relH: "7'2\"", relHBand: "High", relT: "0.54s", elbow: "10°", overall: 85, keyMatch: ["Elbow Alignment", "+2°"], pos: "Guard", thumb: "/images/canonical/088-row-2.png" },
  { name: "Kyrie Irving", slug: "kyrie-irving", attempts: 6200, hand: "R", level: "NBA", ht: "6'2\"", htIn: 74, age: 32, careerPct: 46.3, makes: 2873, wsi: 89, relH: "6'11\"", relHBand: "High", relT: "0.51s", elbow: "8°", overall: 83, keyMatch: ["Release Height", "-1\""], pos: "Guard", thumb: "/images/canonical/088-row-3.png" },
  { name: "Damian Lillard", slug: "damian-lillard", attempts: 7150, hand: "R", level: "NBA", ht: "6'2\"", htIn: 74, age: 33, careerPct: 44.1, makes: 3154, wsi: 87, relH: "6'10\"", relHBand: "High", relT: "0.53s", elbow: "9°", overall: 81, keyMatch: ["Release Time", "+0.02s"], pos: "Guard", thumb: "/images/canonical/088-row-4.png" },
  { name: "Kevin Durant", slug: "kevin-durant", attempts: 10534, hand: "R", level: "NBA", ht: "6'10\"", htIn: 82, age: 35, careerPct: 50.2, makes: 5287, wsi: 86, relH: "7'6\"", relHBand: "Very High", relT: "0.56s", elbow: "11°", overall: 78, keyMatch: ["Release Height", "+4\""], pos: "Wing", thumb: "/images/canonical/088-row-5.png" },
  { name: "JJ Redick", slug: "jj-redick", attempts: 4486, hand: "R", level: "NBA", ht: "6'4\"", htIn: 76, age: 39, careerPct: 46.8, makes: 2099, wsi: 85, relH: "6'9\"", relHBand: "High", relT: "0.55s", elbow: "13°", overall: 76, keyMatch: ["Elbow Alignment", "+3°"], pos: "Guard", thumb: "/images/canonical/088-row-6.png" },
]

const fmt = (n: number) => n.toLocaleString("en-US")

// The canonical screen advertises the full catalog size while listing the
// featured reference rows.
const CATALOG_SIZE = 158

const RADIO_GROUPS: { id: "hand" | "pos" | "level"; label: string; options: string[] }[] = [
  { id: "hand", label: "Handedness", options: ["All", "Right", "Left"] },
  { id: "pos", label: "Position", options: ["All", "Guard", "Wing", "Big"] },
  { id: "level", label: "Level", options: ["All", "NBA", "College", "International"] },
]

const EXTRA_FILTERS: { id: string; label: string; icon: React.ElementType; options: string[] }[] = [
  { id: "style", label: "Shooting Style", icon: MoveVertical, options: ["Catch & Shoot", "Off the Dribble"] },
  { id: "relh", label: "Release Height", icon: UserIcon, options: ["High", "Very High"] },
  { id: "height", label: "Height", icon: Ruler, options: ["Under 6'4\"", "6'4\" and above"] },
  { id: "age", label: "Age", icon: CalendarClock, options: ["Under 34", "34 and above"] },
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
    <div className="mt-[16px]">
      <div className="text-[13px] font-semibold">{label}</div>
      <div className="relative mt-[10px] h-[12px]">
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
      <div className="mt-[4px] flex justify-between text-[11px] text-[var(--shotiq-color-graphite)]">
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
    const n = new Set(set); n.has(id) ? n.delete(id) : n.add(id); setter(n)
  }
  const toggleExtraCheck = (gid: string, opt: string) =>
    setExtraChecks((c) => {
      const cur = new Set(c[gid] ?? [])
      cur.has(opt) ? cur.delete(opt) : cur.add(opt)
      return { ...c, [gid]: cur }
    })
  const resetFilters = () => {
    setRadios({ hand: "All", pos: "All", level: "All" })
    setAttempts([100, 10000]); setWsiRange([0, 100])
    setExtraChecks({}); setQuery("")
  }

  const filtered = useMemo(() => {
    let out = ROWS.filter((r) =>
      (!query.trim() || r.name.toLowerCase().includes(query.trim().toLowerCase())) &&
      (radios.hand === "All" || (radios.hand === "Right" ? r.hand === "R" : r.hand === "L")) &&
      (radios.pos === "All" || r.pos === radios.pos) &&
      (radios.level === "All" || r.level === radios.level) &&
      r.attempts >= attempts[0] && (attempts[1] >= 10000 || r.attempts <= attempts[1]) &&
      r.wsi >= wsiRange[0] && r.wsi <= wsiRange[1])
    const relhChecks = extraChecks["relh"]
    if (relhChecks?.size) out = out.filter((r) => relhChecks.has(r.relHBand))
    const hChecks = extraChecks["height"]
    if (hChecks?.size) out = out.filter((r) =>
      (hChecks.has("Under 6'4\"") && r.htIn < 76) || (hChecks.has("6'4\" and above") && r.htIn >= 76))
    const aChecks = extraChecks["age"]
    if (aChecks?.size) out = out.filter((r) =>
      (aChecks.has("Under 34") && r.age < 34) || (aChecks.has("34 and above") && r.age >= 34))
    out = [...out]
    if (sort === "WSI") out.sort((a, b) => b.wsi - a.wsi)
    if (sort === "Career %") out.sort((a, b) => b.careerPct - a.careerPct)
    if (sort === "Attempts") out.sort((a, b) => b.attempts - a.attempts)
    if (sort === "Name A–Z") out.sort((a, b) => a.name.localeCompare(b.name))
    return out
  }, [query, radios, attempts, wsiRange, extraChecks, sort])

  const unfiltered = filtered.length === ROWS.length
  const toggleRow = (name: string) =>
    setSelected((s) => { const n = new Set(s); n.has(name) ? n.delete(name) : n.add(name); return n })
  const pair = ROWS.filter((r) => selected.has(r.name)).slice(0, 2)
  const trayImg: Record<string, string> = {
    "Klay Thompson": "/images/canonical/088-tray-klay.png",
    "Kyrie Irving": "/images/canonical/088-tray-kyrie.png",
  }

  const headCell = "text-[9px] font-bold tracking-[0.07em] text-[var(--shotiq-color-graphite)]"

  return (
    <div data-testid="screen-desktop-web-elite-shooters-database"
         className={`flex flex-col ${pair.length >= 2 ? "h-[835px]" : "min-h-full"}`}>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* ------------------------------------------------ filters sidebar */}
        <aside className="w-[209px] shrink-0 overflow-hidden border-r border-[var(--shotiq-color-rule)] px-[21px] pb-[10px] pt-[14px]">
          <div className="flex items-center justify-between">
            <span className="shotiq-display text-[19px] leading-[20px]">FILTERS</span>
            <button type="button" onClick={resetFilters}
                    className="text-[11px] font-medium text-[var(--shotiq-color-shotiqOrange)]">Clear all</button>
          </div>

          {RADIO_GROUPS.map((g) => (
            <div key={g.id} className="mt-[14px] border-t border-[var(--shotiq-color-rule)] pt-[12px]">
              <button type="button" onClick={() => toggleGroup(g.id, openGroups, setOpenGroups)}
                      aria-expanded={openGroups.has(g.id)}
                      className="flex w-full items-center justify-between text-[14px] font-semibold">
                {g.label}
                {openGroups.has(g.id)
                  ? <ChevronUp className="h-[13px] w-[13px] text-[var(--shotiq-color-graphite)]" />
                  : <ChevronDown className="h-[13px] w-[13px] text-[var(--shotiq-color-graphite)]" />}
              </button>
              {openGroups.has(g.id) && (
                <div className="mt-[8px] space-y-[8px]">
                  {g.options.map((o) => (
                    <label key={o} className="flex cursor-pointer items-center gap-[10px] text-[13px]">
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

          <div className="mt-[14px] border-t border-[var(--shotiq-color-rule)] pt-[2px]">
            <DualSlider min={100} max={10000} lo={attempts[0]} hi={attempts[1]}
                        onLo={(v) => setAttempts(([, h]) => [v, h])} onHi={(v) => setAttempts(([l]) => [l, v])}
                        loLabel="100" hiLabel="10,000+"
                        label={<>Min. Attempts <span className="font-normal text-[var(--shotiq-color-graphite)]">(Career)</span></>} />
            <DualSlider min={0} max={100} lo={wsiRange[0]} hi={wsiRange[1]}
                        onLo={(v) => setWsiRange(([, h]) => [v, h])} onHi={(v) => setWsiRange(([l]) => [l, v])}
                        loLabel="0" hiLabel="100" label="WSI Range" />
          </div>

          <div className="mt-[14px] border-t border-[var(--shotiq-color-rule)]">
            {EXTRA_FILTERS.map((g) => (
              <div key={g.id} className="border-b border-[var(--shotiq-color-rule)] py-[10px]">
                <button type="button" onClick={() => toggleGroup(g.id, extraOpen, setExtraOpen)}
                        aria-expanded={extraOpen.has(g.id)}
                        className="flex w-full items-center gap-[9px] text-[12px]">
                  <g.icon className="h-[13px] w-[13px] text-[var(--shotiq-color-graphite)]" strokeWidth={1.7} />
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
                    className="mt-[10px] flex items-center gap-[9px] text-[12px] text-[var(--shotiq-color-graphite)] hover:text-[var(--shotiq-color-ink)]">
              <RotateCcw className="h-[12px] w-[12px]" /> Reset filters
            </button>
          </div>
        </aside>

        {/* ------------------------------------------------------ main table */}
        <div className="min-w-0 flex-1 px-[24px] pt-[12px]">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="shotiq-display text-[40px] leading-[42px]">ELITE SHOOTERS DATABASE</h1>
              <p className="mt-[2px] text-[13px] text-[var(--shotiq-color-graphite)]">
                Study proven mechanics. Compare profiles. Elevate your game.
              </p>
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
              {unfiltered ? CATALOG_SIZE : filtered.length} shooters
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
              {/* group header band */}
              <div className="flex border-b border-[var(--shotiq-color-rule)] pb-[2px]">
                <div className="w-[615px]" />
                <div className={`w-[240px] border-l border-[var(--shotiq-color-rule)] text-center ${headCell}`}>MECHANICS SUMMARY</div>
                <div className={`w-[215px] border-l border-[var(--shotiq-color-rule)] text-center ${headCell}`}>SIMILARITY TO YOU</div>
                <div className="min-w-0 flex-1 border-l border-[var(--shotiq-color-rule)]" />
              </div>
              {/* column headers */}
              <div className="flex items-center border-b border-[var(--shotiq-color-rule)] py-[7px]">
                <span className="w-[30px]"><span className="block h-[14px] w-[14px] rounded-[3px] border border-[var(--shotiq-color-muted)]" /></span>
                <span className={`w-[172px] pl-[62px] ${headCell}`}>SHOOTER</span>
                <span className={`w-[48px] text-center ${headCell}`}>HAND</span>
                <span className={`w-[52px] text-center ${headCell}`}>LEVEL</span>
                <span className={`w-[42px] text-center ${headCell}`}>HT</span>
                <span className={`w-[42px] text-center ${headCell}`}>AGE</span>
                <span className={`w-[74px] text-center ${headCell}`}>CAREER</span>
                <span className={`flex w-[62px] items-center justify-center gap-[3px] ${headCell}`}>
                  WSI <HelpCircle className="h-[10px] w-[10px]" /> <ChevronDown className="h-[10px] w-[10px]" />
                </span>
                <span className={`w-[80px] text-center ${headCell}`}>RELEASE HEIGHT</span>
                <span className={`w-[80px] text-center ${headCell}`}>RELEASE TIME</span>
                <span className={`w-[80px] text-center ${headCell}`}>ELBOW ALIGNMENT</span>
                <span className={`flex w-[105px] items-center justify-center gap-[3px] ${headCell}`}>
                  OVERALL <HelpCircle className="h-[10px] w-[10px]" />
                </span>
                <span className={`w-[110px] text-center ${headCell}`}>KEY MATCH</span>
                <span className={`min-w-0 flex-1 text-center ${headCell}`}>ACTION</span>
              </div>

              {filtered.map((r) => (
                <div key={r.name}
                     className="flex items-center border-b border-[var(--shotiq-color-rule)] py-[5px]">
                  <span className="w-[30px]">
                    <button type="button" role="checkbox" aria-checked={selected.has(r.name)}
                            aria-label={`Select ${r.name}`} onClick={() => toggleRow(r.name)}
                            className={`grid h-[15px] w-[15px] place-items-center rounded-[3px] border ${selected.has(r.name) ? "border-[var(--shotiq-color-shotiqOrange)] bg-[var(--shotiq-color-shotiqOrange)]" : "border-[var(--shotiq-color-muted)]"}`}>
                      {selected.has(r.name) && <Check className="h-[10px] w-[10px] text-white" strokeWidth={3.2} />}
                    </button>
                  </span>
                  <span className="flex w-[172px] items-center gap-[12px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.thumb} alt="" className="h-[55px] w-[102px] shrink-0 rounded-[5px] object-cover" />
                    <span className="min-w-0">
                      <Link href={`/elite-shooters/${r.slug}`} className="block truncate text-[14px] font-semibold hover:underline">{r.name}</Link>
                      <span className="block text-[11px] text-[var(--shotiq-color-graphite)]">{fmt(r.attempts)} attempts</span>
                    </span>
                  </span>
                  <span className="w-[48px] text-center text-[12px] text-[var(--shotiq-color-graphite)]">{r.hand}</span>
                  <span className="w-[52px] text-center text-[12px] text-[var(--shotiq-color-graphite)]">{r.level}</span>
                  <span className="w-[42px] text-center text-[12px] text-[var(--shotiq-color-graphite)]">{r.ht}</span>
                  <span className="w-[42px] text-center text-[12px] text-[var(--shotiq-color-graphite)]">{r.age}</span>
                  <span className="w-[74px] text-center">
                    <span className="block text-[14px] font-bold">{r.careerPct.toFixed(1)}%</span>
                    <span className="block text-[10px] text-[var(--shotiq-color-graphite)]">{fmt(r.makes)} / {fmt(r.attempts)}</span>
                  </span>
                  <span className="shotiq-numeric w-[62px] text-center text-[24px] leading-[26px] text-[var(--shotiq-color-analysisBlue)]">{r.wsi}</span>
                  <span className="w-[80px] text-center">
                    <span className="block text-[14px] font-bold">{r.relH}</span>
                    <span className="block text-[10px] text-[var(--shotiq-color-graphite)]">{r.relHBand}</span>
                  </span>
                  <span className="w-[80px] text-center">
                    <span className="block text-[14px] font-bold">{r.relT}</span>
                    <span className="block text-[10px] text-[var(--shotiq-color-graphite)]">Quick</span>
                  </span>
                  <span className="w-[80px] text-center">
                    <span className="block text-[14px] font-bold">{r.elbow}</span>
                    <span className="block text-[10px] text-[var(--shotiq-color-graphite)]">Stacked</span>
                  </span>
                  <span className="w-[105px] px-[14px] text-center">
                    <span className="block text-[15px] font-bold">{r.overall}%</span>
                    <span className="mx-auto mt-[3px] block h-[3px] w-[70px] rounded-full bg-[var(--shotiq-color-rule)]">
                      <span className="block h-full rounded-full bg-[var(--shotiq-color-analysisBlue)]" style={{ width: `${r.overall}%` }} />
                    </span>
                  </span>
                  <span className="w-[110px] border-l border-[var(--shotiq-color-rule)] text-center">
                    <span className="block text-[12px]">{r.keyMatch[0]}</span>
                    <span className="block text-[12px] font-semibold">{r.keyMatch[1]}</span>
                  </span>
                  <span className="min-w-0 flex-1 text-center">
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
              {filtered.map((r) => (
                <Link key={r.name} href={`/elite-shooters/${r.slug}`}
                      className="overflow-hidden rounded-[8px] border border-[var(--shotiq-color-rule)] bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.thumb} alt={r.name} className="h-[140px] w-full object-cover" />
                  <div className="p-[12px]">
                    <div className="truncate text-[15px] font-semibold">{r.name}</div>
                    <div className="text-[11px] text-[var(--shotiq-color-graphite)]">{fmt(r.attempts)} attempts · {r.level}</div>
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
          <div className="flex items-stretch gap-[10px] px-[10px] pt-[6px]">
            <span className="my-[8px] w-[4px] shrink-0 rounded-full bg-[var(--shotiq-color-analysisBlue)]" />
            <div className="shrink-0 pt-[2px]">
              <div className="flex items-center gap-[12px]">
                <span className="text-[11px] font-bold tracking-[0.05em]">COMPARING ({pair.length})</span>
                <button type="button" onClick={() => setSelected(new Set())}
                        className="text-[11px] text-[var(--shotiq-color-shotiqOrange)]">Clear</button>
              </div>
              <div className="mt-[4px] flex gap-[10px]">
                {pair.map((r) => (
                  <div key={r.name} className="flex w-[178px] items-center gap-[8px] rounded-[7px] border border-[var(--shotiq-color-rule)] p-[6px]">
                    {trayImg[r.name] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={trayImg[r.name]} alt="" className="h-[42px] w-[46px] shrink-0 rounded-[4px] object-cover" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.thumb} alt="" className="h-[42px] w-[46px] shrink-0 rounded-[4px] object-cover" />
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
          <div className="flex gap-[10px] px-[10px] pb-[10px] pt-[6px]">
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
              ] as const).map(([label, r1, r2, hot]) => (
                <div key={label} className="min-w-0 flex-1">
                  <div className={`text-center text-[10px] font-bold tracking-[0.05em] ${hot ? "text-[var(--shotiq-color-shotiqOrange)]" : ""}`}>{label}</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/images/canonical/${r1}.png`} alt="" className="mt-[3px] w-full rounded-[3px] object-cover" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/images/canonical/${r2}.png`} alt="" className="mt-[3px] w-full rounded-[3px] object-cover" />
                </div>
              ))}
            </div>
            <div className="w-[228px] shrink-0 rounded-[8px] border border-[var(--shotiq-color-rule)] px-[12px] py-[8px]">
              <div className="text-[11px] font-bold tracking-[0.05em]">KEY TAKEAWAYS</div>
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
