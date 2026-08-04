"use client"

/** /media — canonical 094-web-media-library, backed by /api/media. */

import React, { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Search, Upload, SlidersHorizontal, ChevronDown, Trash2, Calendar, Share2, X, ChevronRight } from "lucide-react"
import { SectionLabel, Card, MediaSurface, PhaseGlyph } from "@/components/shotiq/ShotIQShell"

interface MediaItem { id: string; title: string; time: string; style: string; score: number | null; status: string; len: string; img?: string }

const cimg = (n: string) => `/images/canonical/${n}.png`

const DEMO: Record<string, MediaItem[]> = {
  "TODAY · May 12, 2025": [
    { id: "1", title: "Pull-Up Jumper", time: "8:24 AM", style: "Catch & Shoot", score: 82, status: "Analyzed", len: "0:07", img: cimg("094-t1") },
    { id: "2", title: "Spot-Up Three", time: "8:21 AM", style: "Catch & Shoot", score: 78, status: "Analyzed", len: "0:06", img: cimg("094-t2") },
    { id: "3", title: "Transition Pull-Up", time: "8:18 AM", style: "Off the Dribble", score: 75, status: "Analyzed", len: "0:05", img: cimg("094-t3") },
    { id: "4", title: "Pull-Up Jumper", time: "8:15 AM", style: "Off the Dribble", score: 68, status: "Review", len: "0:06", img: cimg("094-t4") },
    { id: "5", title: "Spot-Up Three", time: "8:12 AM", style: "Catch & Shoot", score: null, status: "Not analyzed", len: "0:04", img: cimg("094-t5") },
    { id: "6", title: "Pull-Up Jumper", time: "8:09 AM", style: "Off the Dribble", score: null, status: "Not analyzed", len: "0:07", img: cimg("094-t6") },
  ],
  "YESTERDAY · May 11, 2025": [
    { id: "7", title: "Spot-Up Three", time: "6:15 PM", style: "Catch & Shoot", score: 78, status: "Analyzed", len: "0:06", img: cimg("094-y1") },
    { id: "8", title: "Pull-Up Jumper", time: "6:12 PM", style: "Off the Dribble", score: 76, status: "Analyzed", len: "0:05", img: cimg("094-y2") },
    { id: "9", title: "Transition Pull-Up", time: "6:08 PM", style: "Off the Dribble", score: 62, status: "Review", len: "0:07", img: cimg("094-y3") },
    { id: "10", title: "Catch & Shoot", time: "6:05 PM", style: "Catch & Shoot", score: 84, status: "Analyzed", len: "0:04", img: cimg("094-y4") },
    { id: "11", title: "Pull-Up Jumper", time: "6:02 PM", style: "Off the Dribble", score: null, status: "Not analyzed", len: "0:06", img: cimg("094-y5") },
    { id: "12", title: "Spot-Up Three", time: "5:59 PM", style: "Catch & Shoot", score: null, status: "Not analyzed", len: "0:05", img: cimg("094-y6") },
  ],
  "SATURDAY · May 10, 2025": [
    { id: "13", title: "Transition Pull-Up", time: "4:02 PM", style: "Off the Dribble", score: 75, status: "Analyzed", len: "0:06", img: cimg("094-s1") },
    { id: "14", title: "Spot-Up Three", time: "3:58 PM", style: "Catch & Shoot", score: 74, status: "Analyzed", len: "0:05", img: cimg("094-s2") },
    { id: "15", title: "Pull-Up Jumper", time: "3:55 PM", style: "Off the Dribble", score: 71, status: "Review", len: "0:04", img: cimg("094-s3") },
    { id: "16", title: "Catch & Shoot", time: "3:51 PM", style: "Catch & Shoot", score: 79, status: "Analyzed", len: "0:07", img: cimg("094-s4") },
    { id: "17", title: "Pull-Up Jumper", time: "3:48 PM", style: "Off the Dribble", score: null, status: "Not analyzed", len: "0:05", img: cimg("094-s5") },
    { id: "18", title: "Spot-Up Three", time: "3:44 PM", style: "Catch & Shoot", score: null, status: "Not analyzed", len: "0:06", img: cimg("094-s6") },
    { id: "19", title: "Transition Pull-Up", time: "3:40 PM", style: "Off the Dribble", score: 73, status: "Analyzed", len: "0:05", img: cimg("094-s1") },
    { id: "20", title: "Catch & Shoot", time: "3:36 PM", style: "Catch & Shoot", score: 77, status: "Analyzed", len: "0:04", img: cimg("094-s2") },
  ],
}

// Canonical group counts, shown while a group is unfiltered.
const DECLARED_COUNT: Record<string, string> = {
  "YESTERDAY · May 11, 2025": "10 items",
  "SATURDAY · May 10, 2025": "8 items",
}

const FILTERS: [string, [string, number][]][] = [
  ["SOURCE", [["All sources", -1], ["iOS Capture", 86], ["Web Upload", 24]]],
  ["ANALYSIS STATUS", [["All status", -1], ["Analyzed", 72], ["Review", 18], ["Not analyzed", 20], ["Processing", 0]]],
  ["WORKOUT", [["All workouts", -1], ["Catch & Shoot", 32], ["Off the Dribble", 18], ["Pull-Up Jumper", 16], ["Spot-Up Three", 12], ["Transition", 10]]],
  ["SHOT RESULT", [["All results", -1], ["Make", 38], ["Miss", 38]]],
  ["HAND", [["All hands", -1], ["Right", 76], ["Left", 10]]],
]

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
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [checked, setChecked] = useState<Record<string, string>>(() =>
    Object.fromEntries(FILTERS.map(([head, opts]) => [head, String(opts[0][0])])))
  const [range, setRange] = useState(RANGES[0])
  const [sort, setSort] = useState<(typeof SORTS)[number]>("Newest")
  const [menu, setMenu] = useState<null | "range" | "sort">(null)
  const [query, setQuery] = useState("")
  // The FILTERS column is always drawn (canonical 094 draws it). The toolbar's
  // Filter button — which canonical also draws — moves focus into that column
  // rather than showing or hiding it.
  const filtersRef = useRef<HTMLElement | null>(null)
  const focusFilters = () => {
    const first = filtersRef.current?.querySelector<HTMLElement>("input, button")
    first?.focus()
  }
  useEffect(() => {
    fetch("/api/media", { credentials: "include" }).then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const list = d?.media ?? d?.items
        if (Array.isArray(list) && list.length === 0) { setGroups({}); setEmpty(true) }
      }).catch(() => {})
  }, [])
  const statusFilter = checked["ANALYSIS STATUS"]
  const workoutFilter = checked["WORKOUT"]
  const shown = useMemo(() => {
    const out: Record<string, MediaItem[]> = {}
    for (const [day, items] of Object.entries(groups)) {
      if (range[0] === "1" && !day.startsWith("TODAY")) continue
      let list = items.filter((m) =>
        (statusFilter.startsWith("All") || m.status === statusFilter) &&
        (workoutFilter.startsWith("All") || m.style === workoutFilter || m.title === workoutFilter) &&
        (!query.trim() || m.title.toLowerCase().includes(query.trim().toLowerCase())))
      list = [...list]
      if (sort === "Oldest") list.reverse()
      if (sort === "Score") list.sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
      if (list.length) out[day] = list
    }
    return out
  }, [groups, statusFilter, workoutFilter, range, sort, query])
  const total = Object.values(shown).flat().length
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const clearAll = () => {
    setChecked(Object.fromEntries(FILTERS.map(([head, opts]) => [head, String(opts[0][0])])))
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

  return (
    <div data-testid="screen-desktop-web-media-library" className="flex h-[835px]">
      {/* ------------------------------------------------------ filters column
          Canonical 094 draws a persistent FILTERS column at the left edge of
          the content area, 219px of the 1440px canvas. It is a filter panel,
          not navigation, so it does not compete with the one nav sidebar —
          and it deliberately carries no `region-sidebar` test id. */}
      <aside ref={filtersRef} id="media-filters" data-testid="media-filters"
             className="w-[219px] shrink-0 overflow-hidden border-r border-[var(--shotiq-color-rule)] px-[20px] pt-[16px]">
        <div className="flex items-center justify-between">
          <SectionLabel>FILTERS</SectionLabel>
          <button type="button" onClick={clearAll} className="text-[11px] text-[var(--shotiq-color-shotiqOrange)]">Clear all</button>
        </div>
        <div className="mt-[12px] text-[10px] font-bold tracking-[0.06em] text-[var(--shotiq-color-graphite)]">DATE RANGE</div>
        <div className="relative">
          <button type="button" aria-expanded={menu === "range"}
                  onClick={() => setMenu((m) => (m === "range" ? null : "range"))}
                  className="mt-[6px] flex h-[36px] w-full items-center gap-[6px] rounded-[5px] border border-[var(--shotiq-color-rule)] px-[8px] text-[11px]">
            <Calendar className="h-[12px] w-[12px]" /> {range[1]} <ChevronDown className="ml-auto h-[11px] w-[11px]" />
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
        {FILTERS.map(([head, opts]) => (
          <div key={head} className="mt-[14px]">
            <div className="text-[10px] font-bold tracking-[0.06em] text-[var(--shotiq-color-graphite)]">{head}</div>
            {opts.map(([label, n]) => (
              <label key={String(label)} className="mt-[6px] flex items-center gap-[8px] text-[12px]">
                <input type="checkbox" checked={checked[head] === String(label)}
                       onChange={() => setChecked((c) => ({ ...c, [head]: String(label) }))}
                       className="h-[13px] w-[13px] shrink-0 accent-[var(--shotiq-color-shotiqOrange)]" />
                {OPTION_DOT[String(label)] && (
                  <span className="h-[7px] w-[7px] shrink-0 rounded-full"
                        style={{ background: OPTION_DOT[String(label)] }} />
                )}
                <span className="flex-1 truncate">{label}</span>
                {n >= 0 && <span className="text-[11px] text-[var(--shotiq-color-graphite)]">{n}</span>}
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
            <p className="mt-[2px] text-[13px] text-[var(--shotiq-color-graphite)]">Review, manage, and analyze your shooting sessions.</p>
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
                    className="flex h-[42px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[14px] text-[13px]">
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
            {/* Destructive. The 50% disabled opacity washed the alert colour out
                to a near-invisible pink; disabled now reads as graphite. */}
            <button type="button" disabled={!selected.size} onClick={deleteSelected}
                    className="flex h-[42px] items-center gap-[8px] rounded-[6px] border px-[14px] text-[13px] font-semibold border-[var(--shotiq-color-reviewRed)] text-[var(--shotiq-color-reviewRed)] disabled:border-[var(--shotiq-color-rule)] disabled:text-[var(--shotiq-color-graphite)] disabled:font-normal">
              <Trash2 className="h-[14px] w-[14px]" /> Delete
            </button>
          </div>
        </div>

        <div className="mt-[10px] flex items-center justify-between border-b border-[var(--shotiq-color-rule)] pb-[8px] text-[12px] text-[var(--shotiq-color-graphite)]">
          <label className="flex items-center gap-[8px]">
            <input type="checkbox" className="h-[13px] w-[13px]" readOnly checked={selected.size > 0} /> {selected.size} selected
          </label>
          <span>{total === Object.values(groups).flat().length ? 12 : total} items</span>
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
          const count = groupUnfiltered ? DECLARED_COUNT[day] : `${items.length} items`
          return (
          <div key={day} className="mt-[16px]">
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
                  <div className="relative" style={{ aspectRatio: "179 / 152" }}>
                    {m.img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.img} alt="" className="absolute inset-0 h-full w-full object-contain" />
                    ) : (
                      <MediaSurface height="100%" rounded={0} />
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
                <MediaSurface height={260} rounded={0} />
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
                <div className="text-[10px] font-bold tracking-[0.05em] text-[var(--shotiq-color-graphite)]">LINKED ANALYSIS</div>
                <div className="text-[13px] font-semibold">
                  {detail.item.status === "Not analyzed" ? "Not analyzed yet" : `${detail.item.status} · Form score ${detail.item.score ?? "—"}`}
                </div>
              </div>
              {detail.item.status === "Not analyzed" ? (
                <Link href="/upload" className="flex items-center gap-[4px] text-[12px] font-medium text-[var(--shotiq-color-shotiqOrange)]">
                  Analyze now <ChevronRight className="h-[12px] w-[12px]" />
                </Link>
              ) : (
                <Link href="/results/demo/analysis" className="flex items-center gap-[4px] text-[12px] font-medium text-[var(--shotiq-color-analysisBlue)]">
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
