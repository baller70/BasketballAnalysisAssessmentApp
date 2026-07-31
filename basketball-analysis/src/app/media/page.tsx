"use client"

/** /media — canonical 094-web-media-library, backed by /api/media. */

import React, { useEffect, useState } from "react"
import { Search, Upload, SlidersHorizontal, ChevronDown, Trash2, Calendar } from "lucide-react"
import { SectionLabel, Card, MediaSurface, PhaseGlyph } from "@/components/shotiq/ShotIQShell"

interface MediaItem { id: string; title: string; time: string; style: string; score: number | null; status: string; len: string }

const DEMO: Record<string, MediaItem[]> = {
  "TODAY · May 12, 2025": [
    { id: "1", title: "Pull-Up Jumper", time: "8:24 AM", style: "Catch & Shoot", score: 82, status: "Analyzed", len: "0:07" },
    { id: "2", title: "Spot-Up Three", time: "8:21 AM", style: "Catch & Shoot", score: 78, status: "Analyzed", len: "0:06" },
    { id: "3", title: "Transition Pull-Up", time: "8:18 AM", style: "Off the Dribble", score: 75, status: "Analyzed", len: "0:05" },
    { id: "4", title: "Pull-Up Jumper", time: "8:15 AM", style: "Off the Dribble", score: 68, status: "Review", len: "0:06" },
    { id: "5", title: "Spot-Up Three", time: "8:12 AM", style: "Catch & Shoot", score: null, status: "Not analyzed", len: "0:04" },
    { id: "6", title: "Pull-Up Jumper", time: "8:09 AM", style: "Off the Dribble", score: null, status: "Not analyzed", len: "0:07" },
  ],
  "YESTERDAY · May 11, 2025": [
    { id: "7", title: "Spot-Up Three", time: "6:15 PM", style: "Catch & Shoot", score: 78, status: "Analyzed", len: "0:06" },
    { id: "8", title: "Pull-Up Jumper", time: "6:12 PM", style: "Off the Dribble", score: 76, status: "Analyzed", len: "0:05" },
    { id: "9", title: "Transition Pull-Up", time: "6:08 PM", style: "Off the Dribble", score: 62, status: "Review", len: "0:07" },
    { id: "10", title: "Catch & Shoot", time: "6:05 PM", style: "Catch & Shoot", score: 84, status: "Analyzed", len: "0:04" },
    { id: "11", title: "Pull-Up Jumper", time: "6:02 PM", style: "Off the Dribble", score: null, status: "Not analyzed", len: "0:06" },
    { id: "12", title: "Spot-Up Three", time: "5:59 PM", style: "Catch & Shoot", score: null, status: "Not analyzed", len: "0:05" },
  ],
}

const FILTERS: [string, [string, number][]][] = [
  ["SOURCE", [["All sources", -1], ["iOS Capture", 86], ["Web Upload", 24]]],
  ["ANALYSIS STATUS", [["All status", -1], ["Analyzed", 72], ["Review", 18], ["Not analyzed", 20], ["Processing", 0]]],
  ["WORKOUT", [["All workouts", -1], ["Catch & Shoot", 32], ["Off the Dribble", 18], ["Pull-Up Jumper", 16], ["Spot-Up Three", 12], ["Transition", 10]]],
  ["SHOT RESULT", [["All results", -1], ["Make", 38], ["Miss", 38]]],
  ["HAND", [["All hands", -1], ["Right", 76], ["Left", 10]]],
]

export default function MediaLibraryPage() {
  const [groups, setGroups] = useState(DEMO)
  const [empty, setEmpty] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  useEffect(() => {
    fetch("/api/media", { credentials: "include" }).then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const list = d?.media ?? d?.items
        if (Array.isArray(list) && list.length === 0) { setGroups({}); setEmpty(true) }
      }).catch(() => {})
  }, [])
  const total = Object.values(groups).flat().length
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const statusColor = (s: string) =>
    s === "Analyzed" ? "var(--shotiq-color-confirmGreen)" : s === "Review" ? "var(--shotiq-color-shotiqOrange)" : "var(--shotiq-color-muted)"

  return (
    <div data-testid="screen-desktop-web-media-library" className="flex">
      {/* filters rail */}
      <aside className="w-[200px] shrink-0 border-r border-[var(--shotiq-color-rule)] px-[18px] py-[18px]">
        <div className="flex items-center justify-between">
          <SectionLabel>FILTERS</SectionLabel>
          <button type="button" className="text-[11px] text-[var(--shotiq-color-shotiqOrange)]">Clear all</button>
        </div>
        <div className="mt-[12px] text-[10px] font-bold tracking-[0.06em] text-[var(--shotiq-color-graphite)]">DATE RANGE</div>
        <button type="button" className="mt-[6px] flex h-[36px] w-full items-center gap-[6px] rounded-[5px] border border-[var(--shotiq-color-rule)] px-[8px] text-[11px]">
          <Calendar className="h-[12px] w-[12px]" /> May 6 – May 12, 2025 <ChevronDown className="ml-auto h-[11px] w-[11px]" />
        </button>
        {FILTERS.map(([head, opts]) => (
          <div key={head} className="mt-[14px]">
            <div className="text-[10px] font-bold tracking-[0.06em] text-[var(--shotiq-color-graphite)]">{head}</div>
            {opts.map(([label, n], i) => (
              <label key={String(label)} className="mt-[6px] flex items-center gap-[8px] text-[12px]">
                <input type="checkbox" defaultChecked={i === 0} className="h-[13px] w-[13px] accent-[var(--shotiq-color-shotiqOrange)]" />
                <span className="flex-1">{label}</span>
                {n >= 0 && <span className="text-[11px] text-[var(--shotiq-color-graphite)]">{n}</span>}
              </label>
            ))}
          </div>
        ))}
      </aside>

      {/* content */}
      <div className="min-w-0 flex-1 px-[24px] py-[18px]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="shotiq-display text-[44px] leading-[46px]">MEDIA LIBRARY</h1>
            <p className="mt-[2px] text-[13px] text-[var(--shotiq-color-graphite)]">Review, manage, and analyze your shooting sessions.</p>
          </div>
          <div className="flex gap-[10px]">
            <div className="flex h-[42px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[12px]">
              <input placeholder="Search media…" className="w-[130px] bg-transparent text-[13px] outline-none placeholder:text-[var(--shotiq-color-muted)]" />
              <Search className="h-[14px] w-[14px] text-[var(--shotiq-color-graphite)]" />
            </div>
            <button type="button" className="flex h-[42px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[14px] text-[13px]">
              <Upload className="h-[14px] w-[14px]" /> Upload
            </button>
            <button type="button" className="flex h-[42px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[14px] text-[13px]">
              <SlidersHorizontal className="h-[14px] w-[14px]" /> Filter
            </button>
            <button type="button" className="flex h-[42px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[14px] text-[13px]">
              Sort: Newest <ChevronDown className="h-[12px] w-[12px]" />
            </button>
            <button type="button" disabled={!selected.size}
                    className="flex h-[42px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-reviewRed)] px-[14px] text-[13px] text-[var(--shotiq-color-reviewRed)] disabled:opacity-50">
              <Trash2 className="h-[14px] w-[14px]" /> Delete
            </button>
          </div>
        </div>
        <div className="mt-[10px] flex items-center justify-between border-b border-[var(--shotiq-color-rule)] pb-[8px] text-[12px] text-[var(--shotiq-color-graphite)]">
          <label className="flex items-center gap-[8px]">
            <input type="checkbox" className="h-[13px] w-[13px]" readOnly checked={selected.size > 0} /> {selected.size} selected
          </label>
          <span>{total} items</span>
        </div>

        {empty && (
          <Card className="mt-[20px] p-[30px] text-center text-[14px] text-[var(--shotiq-color-graphite)]">
            No media yet — captures and uploads will appear here.
          </Card>
        )}
        {Object.entries(groups).map(([day, items]) => (
          <div key={day} className="mt-[16px]">
            <div className="flex items-center justify-between">
              <SectionLabel>{day}</SectionLabel>
              <span className="text-[11px] text-[var(--shotiq-color-graphite)]">{items.length * 2} items</span>
            </div>
            <div className="mt-[8px] grid grid-cols-6 gap-[12px]">
              {items.map((m) => (
                <Card key={m.id} className="overflow-hidden">
                  <div className="relative">
                    <MediaSurface height={120} rounded={0} />
                    <button type="button" onClick={() => toggle(m.id)} aria-label="select"
                            className={`absolute left-[7px] top-[7px] h-[15px] w-[15px] rounded-[3px] border-2 ${selected.has(m.id) ? "border-[var(--shotiq-color-shotiqOrange)] bg-[var(--shotiq-color-shotiqOrange)]" : "border-white"}`} />
                    <span className="absolute right-[7px] top-[7px] grid h-[20px] w-[20px] place-items-center rounded-[4px] bg-white/90"><PhaseGlyph size={13} /></span>
                    <span className="absolute bottom-[6px] right-[7px] rounded-[3px] bg-black/75 px-[4px] py-[1px] text-[9px] font-bold text-white">{m.len}</span>
                  </div>
                  <div className="p-[9px]">
                    <div className="truncate text-[12px] font-semibold">{m.title}</div>
                    <div className="truncate text-[10px] text-[var(--shotiq-color-graphite)]">{m.time} · {m.style}</div>
                    <div className="mt-[4px] flex items-center gap-[5px] text-[10px]">
                      <span className="h-[7px] w-[7px] rounded-full" style={{ background: statusColor(m.status) }} />
                      <span className="shotiq-numeric text-[13px]">{m.score ?? "—"}</span>
                      <span className={m.status === "Analyzed" ? "text-[var(--shotiq-color-analysisBlue)]" : "text-[var(--shotiq-color-graphite)]"}>{m.status}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
