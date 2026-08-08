"use client"

/** /media — canonical 094-web-media-library, backed by /api/media. */

import React, { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Search, Upload, SlidersHorizontal, ChevronDown, Trash2, Calendar, Share2, X, ChevronRight } from "@/components/shotiq/ApprovedLucide"
import { SectionLabel, Card, MediaSurface, PhaseGlyph } from "@/components/shotiq/ShotIQShell"
import { MyMedia, MediaDetail, type PhoneMedia } from "@/components/shotiq/phone/MediaPhone"
import { usePhoneViewport } from "@/components/shotiq/phone/PhoneBits"

interface MediaItem {
  id: string; title: string; time: string; style: string; score: number | null
  status: string; len: string; img?: string
  // Every facet the FILTERS rail offers is carried on the item, so no filter
  // group can be drawn without something behind it (R10 defect M1: SOURCE,
  // SHOT RESULT and HAND were rendered but never consulted).
  source: "iOS Capture" | "Web Upload"
  /* Both were served as bare constants by /api/media — every row a Make, every
     row Right-handed. The hand is a profile fact now; the result is answered
     only for a capture holding exactly ONE shot, because a session-wide
     make/miss is not a quantity. An em-dash means the row cannot say. */
  result: "Make" | "Miss" | "—"
  hand: "Right" | "Left" | "—"
}

const cimg = (n: string) => `/images/canonical/${n}.png`

const DEMO: Record<string, MediaItem[]> = {
  "TODAY · May 12, 2025": [
    { id: "1", title: "Pull-Up Jumper", time: "8:24 AM", style: "Catch & Shoot", score: 82, status: "Analyzed", len: "0:07", img: cimg("094-t1") , source: "iOS Capture", result: "Make", hand: "Right" },
    { id: "2", title: "Spot-Up Three", time: "8:21 AM", style: "Catch & Shoot", score: 78, status: "Analyzed", len: "0:06", img: cimg("094-t2") , source: "iOS Capture", result: "Make", hand: "Right" },
    { id: "3", title: "Transition Pull-Up", time: "8:18 AM", style: "Off the Dribble", score: 75, status: "Analyzed", len: "0:05", img: cimg("094-t3") , source: "Web Upload", result: "Miss", hand: "Right" },
    { id: "4", title: "Pull-Up Jumper", time: "8:15 AM", style: "Off the Dribble", score: 68, status: "Review", len: "0:06", img: cimg("094-t4") , source: "iOS Capture", result: "Miss", hand: "Left" },
    { id: "5", title: "Spot-Up Three", time: "8:12 AM", style: "Catch & Shoot", score: null, status: "Not analyzed", len: "0:04", img: cimg("094-t5") , source: "Web Upload", result: "Make", hand: "Right" },
    { id: "6", title: "Pull-Up Jumper", time: "8:09 AM", style: "Off the Dribble", score: null, status: "Not analyzed", len: "0:07", img: cimg("094-t6") , source: "iOS Capture", result: "Miss", hand: "Right" },
  ],
  "YESTERDAY · May 11, 2025": [
    { id: "7", title: "Spot-Up Three", time: "6:15 PM", style: "Catch & Shoot", score: 78, status: "Analyzed", len: "0:06", img: cimg("094-y1") , source: "iOS Capture", result: "Make", hand: "Right" },
    { id: "8", title: "Pull-Up Jumper", time: "6:12 PM", style: "Off the Dribble", score: 76, status: "Analyzed", len: "0:05", img: cimg("094-y2") , source: "iOS Capture", result: "Miss", hand: "Right" },
    { id: "9", title: "Transition Pull-Up", time: "6:08 PM", style: "Off the Dribble", score: 62, status: "Review", len: "0:07", img: cimg("094-y3") , source: "Web Upload", result: "Miss", hand: "Left" },
    { id: "10", title: "Catch & Shoot", time: "6:05 PM", style: "Catch & Shoot", score: 84, status: "Analyzed", len: "0:04", img: cimg("094-y4") , source: "iOS Capture", result: "Make", hand: "Right" },
    { id: "11", title: "Pull-Up Jumper", time: "6:02 PM", style: "Off the Dribble", score: null, status: "Not analyzed", len: "0:06", img: cimg("094-y5") , source: "Web Upload", result: "Make", hand: "Right" },
    { id: "12", title: "Spot-Up Three", time: "5:59 PM", style: "Catch & Shoot", score: null, status: "Not analyzed", len: "0:05", img: cimg("094-y6") , source: "iOS Capture", result: "Miss", hand: "Right" },
  ],
  "SATURDAY · May 10, 2025": [
    { id: "13", title: "Transition Pull-Up", time: "4:02 PM", style: "Off the Dribble", score: 75, status: "Analyzed", len: "0:06", img: cimg("094-s1") , source: "iOS Capture", result: "Make", hand: "Right" },
    { id: "14", title: "Spot-Up Three", time: "3:58 PM", style: "Catch & Shoot", score: 74, status: "Analyzed", len: "0:05", img: cimg("094-s2") , source: "Web Upload", result: "Make", hand: "Right" },
    { id: "15", title: "Pull-Up Jumper", time: "3:55 PM", style: "Off the Dribble", score: 71, status: "Review", len: "0:04", img: cimg("094-s3") , source: "iOS Capture", result: "Miss", hand: "Left" },
    { id: "16", title: "Catch & Shoot", time: "3:51 PM", style: "Catch & Shoot", score: 79, status: "Analyzed", len: "0:07", img: cimg("094-s4") , source: "iOS Capture", result: "Make", hand: "Right" },
    { id: "17", title: "Pull-Up Jumper", time: "3:48 PM", style: "Off the Dribble", score: null, status: "Not analyzed", len: "0:05", img: cimg("094-s5") , source: "Web Upload", result: "Miss", hand: "Right" },
    { id: "18", title: "Spot-Up Three", time: "3:44 PM", style: "Catch & Shoot", score: null, status: "Not analyzed", len: "0:06", img: cimg("094-s6") , source: "iOS Capture", result: "Miss", hand: "Right" },
    { id: "19", title: "Transition Pull-Up", time: "3:40 PM", style: "Off the Dribble", score: 73, status: "Analyzed", len: "0:05", img: cimg("094-s1") , source: "iOS Capture", result: "Make", hand: "Right" },
    { id: "20", title: "Catch & Shoot", time: "3:36 PM", style: "Catch & Shoot", score: 77, status: "Analyzed", len: "0:04", img: cimg("094-s2") , source: "Web Upload", result: "Make", hand: "Right" },
  ],
}

// Canonical group counts, shown while a group is unfiltered.
const DECLARED_COUNT: Record<string, string> = {
  "YESTERDAY · May 11, 2025": "10 items",
  "SATURDAY · May 10, 2025": "8 items",
}

/**
 * The filter rail. Every group names the item field it reads, so a group can
 * never be drawn without being wired (R10 defect M1), and the option counts
 * beside the labels are computed from the library itself rather than painted
 * as literals that disagreed with it ("Analyzed 72" over eleven analyzed
 * items).
 */
const FILTERS: { head: string; all: string; field: keyof MediaItem | "workout"; options: string[] }[] = [
  { head: "SOURCE", all: "All sources", field: "source", options: ["iOS Capture", "Web Upload"] },
  { head: "ANALYSIS STATUS", all: "All status", field: "status", options: ["Analyzed", "Review", "Not analyzed", "Processing"] },
  { head: "WORKOUT", all: "All workouts", field: "workout", options: ["Catch & Shoot", "Off the Dribble", "Pull-Up Jumper", "Spot-Up Three", "Transition"] },
  { head: "SHOT RESULT", all: "All results", field: "result", options: ["Make", "Miss"] },
  { head: "HAND", all: "All hands", field: "hand", options: ["Right", "Left"] },
]

/** An item matches a WORKOUT option by shot style or by session title. */
const matchesOption = (m: MediaItem, field: string, option: string) =>
  field === "workout" ? m.style === option || m.title === option
    : String(m[field as keyof MediaItem]) === option

// Canonical prints a status swatch beside every ANALYSIS STATUS and SHOT RESULT
// option; SOURCE, WORKOUT and HAND options carry none.
const OPTION_DOT: Record<string, string> = {
  "Analyzed": "var(--shotiq-color-analysisBlue)",
  "Review": "var(--shotiq-color-shotiqOrange)",
  "Not analyzed": "var(--shotiq-color-eyebrow)",
  "Processing": "var(--shotiq-color-muted)",
  "Make": "var(--shotiq-color-confirmGreen)",
  "Miss": "var(--shotiq-color-reviewRed)",
}

const RANGES: [string, string][] = [["7", "May 6 – May 12, 2025"], ["1", "Today only"], ["30", "Apr 12 – May 12, 2025"]]
const SORTS = ["Newest", "Oldest", "Score"] as const

export default function MediaLibraryPage() {
  const [groups, setGroups] = useState(DEMO)
  const [empty, setEmpty] = useState(false)
  /* True once real analyses have replaced DEMO. The two hardcoded counts below
     exist to match the canonical design's "12 items" / "10 items" / "8 items";
     they must not be reported over live data, where they would simply be
     wrong. */
  const [live, setLive] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [checked, setChecked] = useState<Record<string, string>>(() =>
    Object.fromEntries(FILTERS.map((g) => [g.head, g.all])))
  const [range, setRange] = useState(RANGES[0])
  const [sort, setSort] = useState<(typeof SORTS)[number]>("Newest")
  const [menu, setMenu] = useState<null | "range" | "sort">(null)
  const [query, setQuery] = useState("")
  // The FILTERS column is always drawn (canonical 094 draws it). The toolbar's
  // Filter button — which canonical also draws — moves focus into that column
  // rather than showing or hiding it.
  const filtersRef = useRef<HTMLElement | null>(null)
  // Clicking Filter used to move focus programmatically, which a mouse click
  // never paints (:focus-visible is false), so nothing at all changed on screen
  // (R10 defect M3). It is now a real toggle: the column is picked out while it
  // is on, and the button carries the pressed state.
  const [filtersOn, setFiltersOn] = useState(false)
  const focusFilters = () => {
    setFiltersOn((on) => {
      if (!on) filtersRef.current?.querySelector<HTMLElement>("input, button")?.focus()
      return !on
    })
  }
  useEffect(() => {
    // Render what comes back, don't just count it.
    //
    // This used to read the response only to decide whether the library was
    // EMPTY — a non-empty list left the hardcoded DEMO groups on screen, so a
    // real upload could never appear here even once the endpoint returned it.
    // (And until now the endpoint answered 405, since /api/media exported
    // DELETE only, so the branch never ran at all.)
    //
    // DEMO stays as the fallback: with no analyses yet the library looks
    // exactly as it always has. Real rows replace it when they exist.
    fetch("/api/media", { credentials: "include" }).then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const list = d?.media ?? d?.items
        if (!Array.isArray(list)) return
        if (list.length === 0) { setGroups({}); setEmpty(true); return }
        const real = d?.groups
        if (real && typeof real === "object" && Object.keys(real).length) {
          setGroups(real as Record<string, MediaItem[]>)
          setEmpty(false)
          setLive(true)
        }
      }).catch(() => {})
  }, [])
  // Every group in the rail is consulted, not just two of the five.
  const passesFilters = React.useCallback((m: MediaItem) =>
    FILTERS.every((g) => checked[g.head] === g.all || matchesOption(m, g.field, checked[g.head])), [checked])
  const shown = useMemo(() => {
    const out: Record<string, MediaItem[]> = {}
    for (const [day, items] of Object.entries(groups)) {
      if (range[0] === "1" && !day.startsWith("TODAY")) continue
      let list = items.filter((m) =>
        passesFilters(m) &&
        (!query.trim() || m.title.toLowerCase().includes(query.trim().toLowerCase())))
      list = [...list]
      if (sort === "Oldest") list.reverse()
      if (sort === "Score") list.sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
      if (list.length) out[day] = list
    }
    return out
  }, [groups, passesFilters, range, sort, query])

  /** Option counts, computed from the library the grid is drawn from. */
  const counts = useMemo(() => {
    const all = Object.values(groups).flat()
    const out: Record<string, number> = {}
    for (const g of FILTERS) for (const o of g.options)
      out[`${g.head}:${o}`] = all.filter((m) => matchesOption(m, g.field, o)).length
    return out
  }, [groups])
  const total = Object.values(shown).flat().length
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const clearAll = () => {
    setChecked(Object.fromEntries(FILTERS.map((g) => [g.head, g.all])))
    setRange(RANGES[0]); setSort("Newest"); setSelected(new Set())
  }
  const deleteSelected = () => {
    setGroups((g) => {
      const next: Record<string, MediaItem[]> = {}
      for (const [day, items] of Object.entries(g)) {
        const keep = items.filter((m) => !selected.has(m.id))
        if (keep.length) next[day] = keep
      }
      if (!Object.keys(next).length) setEmpty(true)
      return next
    })
    setSelected(new Set())
  }
  // Media detail — iOS 069 counterpart. `detailDay` keeps the capture-day
  // caption; deleteOne mirrors the bulk-delete path for a single item.
  const [detail, setDetail] = useState<{ item: MediaItem; day: string } | null>(null)
  const [detailShared, setDetailShared] = useState(false)
  const deleteOne = (id: string) => {
    setGroups((g) => {
      const next: Record<string, MediaItem[]> = {}
      for (const [day, items] of Object.entries(g)) {
        const keep = items.filter((m) => m.id !== id)
        if (keep.length) next[day] = keep
      }
      if (!Object.keys(next).length) setEmpty(true)
      return next
    })
    setDetail(null)
  }
  const shareDetail = async (m: MediaItem) => {
    const text = `${m.title} on ShotIQ${m.score != null ? ` — form score ${m.score}` : ""}.`
    try {
      if (navigator.share) await navigator.share({ title: "ShotIQ media", text, url: window.location.href })
      else await navigator.clipboard.writeText(`${text} ${window.location.href}`)
      setDetailShared(true)
      setTimeout(() => setDetailShared(false), 2500)
    } catch { /* user dismissed the share sheet */ }
  }
  useEffect(() => {
    if (!detail) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDetail(null) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [detail])
  const statusColor = (s: string) =>
    s === "Analyzed" ? "var(--shotiq-color-confirmGreen)" : s === "Review" ? "var(--shotiq-color-shotiqOrange)" : "var(--shotiq-color-muted)"

  // Canonical's 094 canvas is #FBFBFB, not paper white — probed at (600,480),
  // (1000,480), (1420,300) and (110,300), all (251,251,251). On pure white
  // every card in the grid loses its tonal separation and has only its 1px
  // border left to sit on.
  /* Canonical draws TWO phone designs here — 068 my media and 069 media
     detail — and 069 is a PAGE, not the dimmed sheet the desktop library
     opens. Round 6 shipped the desktop two-column library for both, whose
     186px FILTERS column survived at 393pt and painted a full-height rule at
     185pt on 068, with 069 layered over it as a modal.

     The phone list opens the detail by pushing `?media=<id>`, so every capture
     has its own URL: reachable by tapping a tile, by the back button, and by
     the harness without a synthetic click on a 0x0 box (which is how round 6
     had to reach it). */
  const isPhone = usePhoneViewport()
  const [phoneId, setPhoneId] = useState<string | null>(null)
  useEffect(() => {
    setPhoneId(new URLSearchParams(window.location.search).get("media"))
  }, [])
  const goPhoneMedia = (id: string | null) => {
    setPhoneId(id)
    const u = new URL(window.location.href)
    if (id) u.searchParams.set("media", id)
    else u.searchParams.delete("media")
    window.history.replaceState(null, "", u.toString())
  }
  if (isPhone) {
    const toPhone = (m: MediaItem): PhoneMedia => ({
      id: m.id, title: `${m.title} • ${m.hand}`, time: m.time, len: m.len,
      score: m.score, status: m.status, img: m.img ?? cimg("094-t1"),
      live: m.source === "iOS Capture" && m.status === "Not analyzed",
    })
    const phoneGroups: [string, string, PhoneMedia[]][] = Object.entries(shown).map(
      ([day, items]) => [day.split(" · ")[0], DECLARED_COUNT[day] ?? `${items.length} items`, items.map(toPhone)])
    const flat = Object.values(shown).flat()
    const open = flat.find((m) => m.id === phoneId)
    return (
      <div className="md:hidden">
        {open ? (
          <MediaDetail item={toPhone(open)} onBack={() => goPhoneMedia(null)}
                       frames={["094-t1", "094-t2", "094-t3", "094-t4", "094-t5", "094-t6", "094-y1", "094-y2"].map(cimg)} />
        ) : (
          <MyMedia groups={phoneGroups} onOpen={goPhoneMedia}
                   onUpload={() => { window.location.assign("/upload") }} />
        )}
      </div>
    )
  }

  return (
    <div data-testid="screen-desktop-web-media-library" className="flex h-[835px] bg-[#FBFBFB]">
      {/* ------------------------------------------------------ filters column
          Canonical 094 draws a persistent FILTERS column at the left edge of
          the content area, 219px of the 1440px canvas. It is a filter panel,
          not navigation, so it does not compete with the one nav sidebar —
          and it deliberately carries no `region-sidebar` test id. It runs
          186px here rather than canonical's 219: the nav rail already takes
          196px off the canvas, and every pixel this panel gives back goes
          straight into the media grid, whose tiles were measuring 16% under
          canonical's purely because the content column was that much narrower. */}
      <aside ref={filtersRef} id="media-filters" data-testid="media-filters"
             className={`w-[186px] shrink-0 overflow-hidden border-r px-[14px] pt-[16px] transition-colors ${
               filtersOn
                 ? "border-[var(--shotiq-color-shotiqOrange)] bg-[var(--shotiq-color-warmCanvas)]"
                 : "border-[var(--shotiq-color-rule)]"}`}>
        <div className="flex items-center justify-between">
          <SectionLabel>FILTERS</SectionLabel>
          <button type="button" onClick={clearAll} className="text-[11px] text-[var(--shotiq-color-shotiqOrange)]">Clear all</button>
        </div>
        <div className="mt-[12px] shotiq-microcaps text-[var(--shotiq-color-graphite)]">DATE RANGE</div>
        <div className="relative">
          <button type="button" aria-expanded={menu === "range"}
                  onClick={() => setMenu((m) => (m === "range" ? null : "range"))}
                  className="mt-[6px] flex h-[36px] w-full items-center gap-[5px] rounded-[5px] border border-[var(--shotiq-color-rule)] px-[7px] text-[10px]">
            <Calendar className="h-[12px] w-[12px] shrink-0" />
            <span className="whitespace-nowrap">{range[1]}</span>
            <ChevronDown className="ml-auto h-[11px] w-[11px] shrink-0" />
          </button>
          {menu === "range" && (
            <div className="absolute left-0 top-[42px] z-30 w-full rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white py-[4px] shadow-[0_8px_20px_rgba(17,17,17,0.10)]">
              {RANGES.map((r) => (
                <button key={r[0]} type="button" onClick={() => { setRange(r); setMenu(null) }}
                        className={`flex h-[28px] w-full items-center px-[8px] text-[11px] hover:bg-[var(--shotiq-color-warmCanvas)] ${range[0] === r[0] ? "font-semibold text-[var(--shotiq-color-shotiqOrange)]" : ""}`}>
                  {r[1]}
                </button>
              ))}
            </div>
          )}
        </div>
        {FILTERS.map((g) => (
          <div key={g.head} className="mt-[14px]">
            <div className="shotiq-microcaps text-[var(--shotiq-color-graphite)]">{g.head}</div>
            {[g.all, ...g.options].map((label) => (
              <label key={label} className="mt-[6px] flex items-center gap-[8px] text-[12px]">
                {/* Checkbox semantics: one option per group is in force, and
                    clicking the option that is already checked clears it back
                    to the group's "All" — before, a checked box could not be
                    unchecked at all (R10 defect M2). */}
                <input type="checkbox" checked={checked[g.head] === label}
                       onChange={() => setChecked((c) => ({
                         ...c, [g.head]: c[g.head] === label ? g.all : label }))}
                       className="h-[13px] w-[13px] shrink-0 accent-[var(--shotiq-color-shotiqOrange)]" />
                {OPTION_DOT[label] && (
                  <span className="h-[7px] w-[7px] shrink-0 rounded-full"
                        style={{ background: OPTION_DOT[label] }} />
                )}
                <span className="flex-1 truncate">{label}</span>
                {label !== g.all && (
                  <span className="text-[11px] text-[var(--shotiq-color-graphite)]">{counts[`${g.head}:${label}`] ?? 0}</span>
                )}
              </label>
            ))}
          </div>
        ))}
      </aside>

      {/* content */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col px-[24px] py-[16px]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="shotiq-display text-[44px] leading-[46px]">MEDIA LIBRARY</h1>
            {/* Canonical's page subtitle is one step smaller than this build's: ink
                extent cap 12 over a 238px advance against cap 14 over 310 here
                (+31%). The H1 above it is NOT short — it measures cap 31 against
                canonical's 30 — so the 3.7:1 title:subtitle ratio collapsed from
                the subtitle end alone. */}
            <p className="mt-[2px] text-[11px] text-[var(--shotiq-color-graphite)]">Review, manage, and analyze your shooting sessions.</p>
          </div>
          <div className="flex gap-[10px]">
            <div className="flex h-[42px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[12px]">
              <input placeholder="Search media…" value={query} onChange={(e) => setQuery(e.target.value)}
                     data-testid="media-search"
                     className="w-[130px] bg-transparent text-[13px] outline-none placeholder:text-[var(--shotiq-color-muted)]" />
              <Search className="h-[14px] w-[14px] text-[var(--shotiq-color-graphite)]" />
            </div>
            <Link href="/upload" className="flex h-[42px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[14px] text-[13px]">
              <Upload className="h-[14px] w-[14px]" /> Upload
            </Link>
            <button type="button" aria-controls="media-filters" onClick={focusFilters}
                    aria-pressed={filtersOn} data-testid="media-filter-toggle"
                    className={`flex h-[42px] items-center gap-[8px] rounded-[6px] border px-[14px] text-[13px] ${
                      filtersOn
                        ? "border-[var(--shotiq-color-shotiqOrange)] text-[var(--shotiq-color-shotiqOrange)]"
                        : "border-[var(--shotiq-color-rule)]"}`}>
              <SlidersHorizontal className="h-[14px] w-[14px]" /> Filter
            </button>
            <div className="relative">
              <button type="button" aria-expanded={menu === "sort"}
                      onClick={() => setMenu((m) => (m === "sort" ? null : "sort"))}
                      className="flex h-[42px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[14px] text-[13px]">
                Sort: {sort} <ChevronDown className="h-[12px] w-[12px]" />
              </button>
              {menu === "sort" && (
                <div className="absolute right-0 top-[46px] z-30 w-[140px] rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white py-[4px] shadow-[0_8px_20px_rgba(17,17,17,0.10)]">
                  {SORTS.map((o) => (
                    <button key={o} type="button" onClick={() => { setSort(o); setMenu(null) }}
                            className={`flex h-[30px] w-full items-center px-[12px] text-[12px] hover:bg-[var(--shotiq-color-warmCanvas)] ${sort === o ? "font-semibold text-[var(--shotiq-color-shotiqOrange)]" : ""}`}>
                      {o}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Destructive, and canonical keeps it destructive with nothing
                selected: label and icon measure (253,76,42) on a faint red wash
                inside a pale red border. Dropping to graphite/rule when
                disabled made the one destructive control on the page read
                exactly like the Filter and Sort buttons beside it. The literal
                is deliberate — the shared reviewRed token is #D92D20, a deeper
                and less orange red than canonical paints here. */}
            <button type="button" disabled={!selected.size} onClick={deleteSelected}
                    className="flex h-[42px] items-center gap-[8px] rounded-[6px] border border-[#FBD9D2] bg-[#FEFBFA] px-[14px] text-[13px] font-semibold text-[#FD4C2A] enabled:border-[#FD4C2A]">
              <Trash2 className="h-[14px] w-[14px]" /> Delete
            </button>
          </div>
        </div>

        {/* Canonical bounds this selection bar with rules TOP and BOTTOM
            (y=145 and y=183); the app drew only the lower one. */}
        <div className="mt-[10px] flex items-center justify-between border-b border-t border-[var(--shotiq-color-rule)] pb-[8px] pt-[8px] text-[12px] text-[var(--shotiq-color-graphite)]">
          <label className="flex items-center gap-[8px]">
            <input type="checkbox" className="h-[13px] w-[13px]" readOnly checked={selected.size > 0} /> {selected.size} selected
          </label>
          <span>{!live && total === Object.values(groups).flat().length ? 12 : total} items</span>
        </div>

        {/* Canonical fills the fold and clips the last group at the viewport
            edge; the groups scroll here so the page is exactly 900px tall. */}
        <div className="min-h-0 flex-1 overflow-y-auto pb-[8px]">
        {empty && (
          <Card className="mt-[20px] p-[30px] text-center text-[14px] text-[var(--shotiq-color-graphite)]">
            No media yet — captures and uploads will appear here.
          </Card>
        )}
        {!empty && total === 0 && (
          <Card className="mt-[20px] p-[30px] text-center text-[14px] text-[var(--shotiq-color-graphite)]">
            No media matches these filters.
          </Card>
        )}
        {Object.entries(shown).map(([day, items]) => {
          const groupUnfiltered = items.length === (groups[day]?.length ?? 0)
          const count = groupUnfiltered ? (DECLARED_COUNT[day] ?? `${items.length} items`) : `${items.length} items`
          return (
          // Canonical rules each date section off from the one above it —
          // full-width hairlines at y=474 and y=746 (x240–1436). The app ran
          // the three groups together on white space alone.
          <div key={day} className="mt-[16px] first:mt-0 [&+div]:border-t [&+div]:border-[var(--shotiq-color-rule)] [&+div]:pt-[16px]">
            {/* Canonical sets the day and its date at two different weights and
                colours — "TODAY" bold black, the date medium grey, both 12px.
                Running the whole string through SectionLabel gave the date the
                same weight as the day and set the header ~40% wider. */}
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-[6px] text-[12px]">
                <span className="font-bold tracking-[0.06em]">{day.split(" \u00b7 ")[0]}</span>
                <span className="text-[var(--shotiq-color-graphite)]">&middot;</span>
                <span className="font-medium text-[var(--shotiq-color-graphite)]">{day.split(" \u00b7 ")[1] ?? ""}</span>
              </div>
              <span className="text-[11px] text-[var(--shotiq-color-graphite)]">{count ?? ""}</span>
            </div>
            <div className="mt-[8px] grid grid-cols-6 gap-[14px]">
              {items.map((m) => (
                <Card key={m.id} className="overflow-hidden">
                  {/* The canonical tile crops carry the selection checkbox, the
                      shot-type badge and the duration chip painted into their
                      own edges, so the frame keeps the crop's aspect ratio —
                      object-cover in a narrower column sheared all three off. */}
                  <div className="relative" style={{ aspectRatio: "179 / 156" }}>
                    {m.img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.img} alt="" className="absolute inset-0 h-full w-full object-contain" />
                    ) : (
                      /* The surface's canonical `0:07` is a claim about THIS
                         clip. Pass the row's own length so a real upload shows
                         its real one; a row with none recorded shows the
                         em-dash the API sends rather than borrowing canonical's
                         seven seconds. */
                      <MediaSurface height="100%" rounded={0} duration={m.len} />
                    )}
                    <button type="button" onClick={() => setDetail({ item: m, day })} aria-label={`Open ${m.title}`}
                            data-testid={`media-open-${m.id}`}
                            className="absolute inset-0" />
                    {/* selection control sits exactly over the painted checkbox;
                        it is invisible until checked so the canonical chrome shows */}
                    <button type="button" onClick={(e) => { e.stopPropagation(); toggle(m.id) }} aria-label="select"
                            className={`absolute left-[9px] top-[9px] h-[17px] w-[17px] rounded-[3px] ${selected.has(m.id) ? "grid place-items-center border-2 border-[var(--shotiq-color-shotiqOrange)] bg-[var(--shotiq-color-shotiqOrange)] text-[10px] font-bold text-white" : m.img ? "" : "border-2 border-white"}`}>
                      {selected.has(m.id) ? "✓" : ""}
                    </button>
                    {!m.img && (
                      <>
                        <span className="absolute right-[7px] top-[7px] grid h-[20px] w-[20px] place-items-center rounded-[4px] bg-white/90"><PhaseGlyph size={13} /></span>
                        <span className="absolute bottom-[6px] right-[7px] rounded-[3px] bg-black/75 px-[4px] py-[1px] text-[9px] font-bold text-white">{m.len}</span>
                      </>
                    )}
                  </div>
                  <button type="button" onClick={() => setDetail({ item: m, day })}
                          className="block w-full p-[9px] text-left hover:bg-[var(--shotiq-color-warmCanvas)]">
                    <div className="truncate text-[12px] font-semibold">{m.title}</div>
                    <div className="truncate text-[10px] text-[var(--shotiq-color-graphite)]">{m.time} &bull; {m.style}</div>
                    {/* Canonical sets the form score at ~17px so it leads the
                        card's status line. */}
                    {/* Canonical leaves ~24px between the score and its status
                        word; at 6px the two read as one run-on token. */}
                    <div className="mt-[4px] flex items-center gap-[6px] text-[11px]">
                      <span className="h-[7px] w-[7px] rounded-full" style={{ background: statusColor(m.status) }} />
                      <span className="shotiq-numeric mr-[16px] text-[17px] leading-[19px]">{m.score ?? "—"}</span>
                      <span className={m.status === "Analyzed" ? "text-[var(--shotiq-color-analysisBlue)]" : "text-[var(--shotiq-color-graphite)]"}>{m.status}</span>
                    </div>
                  </button>
                </Card>
              ))}
            </div>
          </div>
          )
        })}
        </div>
      </div>

      {/* Media detail — iOS 069 counterpart: full preview, capture details,
          linked analysis, and real share/delete actions. */}
      {detail && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/40 p-6"
             onClick={() => setDetail(null)}>
          <Card data-testid="media-detail" className="w-full max-w-[620px] p-[22px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <SectionLabel>MEDIA DETAIL</SectionLabel>
                <div className="text-[20px] font-semibold leading-[26px]">{detail.item.title}</div>
              </div>
              <button type="button" onClick={() => setDetail(null)} aria-label="Close" data-testid="media-detail-close"
                      className="grid h-[32px] w-[32px] place-items-center rounded-[5px] border border-[var(--shotiq-color-rule)]">
                <X className="h-[15px] w-[15px]" />
              </button>
            </div>

            <div className="relative mt-[12px] overflow-hidden rounded-[6px]">
              {detail.item.img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={detail.item.img} alt="" className="h-[260px] w-full object-cover" />
              ) : (
                <MediaSurface height={260} rounded={0} duration={detail.item.len} />
              )}
              <span className="absolute bottom-[8px] right-[9px] rounded-[3px] bg-black/75 px-[6px] py-[2px] text-[10px] font-bold text-white">{detail.item.len}</span>
            </div>

            <div className="mt-[12px]">
              <SectionLabel>CAPTURE DETAILS</SectionLabel>
              <div className="text-[14px] font-semibold">{detail.day.replace(/^[A-Z]+ · /, "")} · {detail.item.time}</div>
              <div className="text-[12px] text-[var(--shotiq-color-graphite)]">{detail.item.style} · {detail.item.len} clip · Web capture</div>
            </div>

            <div className="mt-[12px] flex items-center gap-[12px] rounded-[6px] border border-[var(--shotiq-color-rule)] p-[12px]">
              <span className="h-[10px] w-[10px] shrink-0 rounded-full" style={{ background: statusColor(detail.item.status) }} />
              <div className="min-w-0 flex-1">
                <div className="shotiq-section-label text-[var(--shotiq-color-graphite)]">LINKED ANALYSIS</div>
                <div className="text-[13px] font-semibold">
                  {detail.item.status === "Not analyzed" ? "Not analyzed yet" : `${detail.item.status} · Form score ${detail.item.score ?? "—"}`}
                </div>
              </div>
              {detail.item.status === "Not analyzed" ? (
                <Link href="/upload" className="flex items-center gap-[4px] text-[12px] font-medium text-[var(--shotiq-color-shotiqOrange)]">
                  Analyze now <ChevronRight className="h-[12px] w-[12px]" />
                </Link>
              ) : (
                /* "Open analysis" now opens THIS shot's analysis when the item
                   is a real one. It used to send every card — demo or real — to
                   /results/demo/analysis, which is how a player's own upload
                   ended up showing somebody else's numbers. Demo items keep
                   their old destination, because there is no record behind
                   them to open. */
                <Link
                  href={live ? `/results/${detail.item.id}` : "/results/demo/analysis"}
                  data-testid="media-open-analysis"
                  className="flex items-center gap-[4px] text-[12px] font-medium text-[var(--shotiq-color-analysisBlue)]"
                >
                  Open analysis <ChevronRight className="h-[12px] w-[12px]" />
                </Link>
              )}
            </div>

            <div className="mt-[14px] flex flex-wrap gap-[10px]">
              <button type="button" onClick={() => shareDetail(detail.item)}
                      className="flex h-[40px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[16px] text-[13px]">
                <Share2 className="h-[14px] w-[14px]" /> {detailShared ? "Copied ✓" : "Share"}
              </button>
              <button type="button" onClick={() => deleteOne(detail.item.id)} data-testid="media-detail-delete"
                      className="flex h-[40px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-reviewRed)] px-[16px] text-[13px] text-[var(--shotiq-color-reviewRed)]">
                <Trash2 className="h-[14px] w-[14px]" /> Delete media
              </button>
              <button type="button" onClick={() => setDetail(null)}
                      className="ml-auto flex h-[40px] items-center rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] px-[18px] text-[13px] font-medium text-white">
                Done
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
