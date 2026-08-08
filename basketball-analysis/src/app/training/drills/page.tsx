"use client"

/**
 * /training/drills — drill library. Destination for the Training Hub's
 * "My drills", "Discover", "View all drills" and "View all recommendations"
 * affordances (no dedicated canonical screen was supplied; layout follows the
 * training-hub card language). Tab preselect via ?tab=recommended|saved|discover.
 */

import React, { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Bookmark, Plus, Search, X } from "@/components/shotiq/ApprovedLucide"
import { ShotIQShell, SectionLabel, Card, MediaSurface } from "@/components/shotiq/ShotIQShell"
import { DiscoverDrills, MyDrills, type LibraryDrill } from "@/components/shotiq/phone/DrillsPhone"
import { usePhoneViewport } from "@/components/shotiq/phone/PhoneBits"

interface Drill {
  len: string; title: string; level: string; cat: string; desc: string
  saved?: boolean; recommended?: boolean
}

const DRILLS: Drill[] = [
  { len: "05:28", title: "Footwork Into Release", level: "Advanced", cat: "Footwork", desc: "Build rhythm from the catch into a balanced, stacked release.", recommended: true, saved: true },
  { len: "06:12", title: "Elbow Stack Holds", level: "Intermediate", cat: "Shooting", desc: "Train elbow alignment and forearm verticality through the lift.", recommended: true, saved: true },
  { len: "06:58", title: "High Elbow Release", level: "Advanced", cat: "Shooting", desc: "Reinforce a high elbow path for a clean, consistent release.", recommended: true },
  { len: "06:38", title: "Catch & Set Series", level: "Intermediate", cat: "Shooting", desc: "Sharpen the catch-to-set transition under game tempo.", saved: true },
  { len: "04:42", title: "One Dribble Pull-Up", level: "Beginner", cat: "Scoring", desc: "One hard dribble into a square, balanced pull-up.", saved: true },
  { len: "05:19", title: "Transition Pull-Up", level: "Advanced", cat: "Scoring", desc: "Attack in transition and rise into a controlled jumper.", saved: true },
  { len: "06:01", title: "Sideline Elevation", level: "Intermediate", cat: "Shooting", desc: "Elevate along the sideline while holding shooting line.", saved: true },
  { len: "05:44", title: "Pound Crossover Foundation", level: "Beginner", cat: "Handling", desc: "Pound dribble into a tight crossover with eyes up.", recommended: false },
  { len: "07:15", title: "Free Throw Ladder", level: "Beginner", cat: "Shooting", desc: "Pressure free throws in an ascending ladder format.", recommended: false },
  { len: "06:20", title: "Wall Elbow Alignment", level: "Beginner", cat: "Form", desc: "Wall-guided reps that groove a stacked elbow path.", recommended: false },
  { len: "05:52", title: "Quick Release Builder", level: "Intermediate", cat: "Shooting", desc: "Shrink your release time without losing mechanics.", recommended: true },
  { len: "06:45", title: "Handle To Release Flow", level: "Advanced", cat: "Flow", desc: "Chain live-dribble moves into clean rise-and-release reps.", recommended: false },
]

const TABS = [
  { id: "recommended", label: "Recommended" },
  { id: "saved", label: "My drills" },
  { id: "discover", label: "Discover" },
] as const

const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-")

/* Canonical draws a FOUR-FRAME photo strip on every discover row and a portrait
   still on every my-drills card. Round 6 painted a black video tile in both
   places, which is why the two tabs measured near-identical (app-vs-app mean
   absolute difference 3.62). These are the canonical crops the desktop training
   hub already ships. */
const cimg = (n: string) => `/images/canonical/${n}.png`
const PHONE_STRIPS: string[][] = [
  ["090-lib-1", "090-lib-2", "090-lib-3", "090-lib-4"],
  ["090-rec-1", "090-rec-2", "090-rec-3", "090-lib-1"],
  ["090-lib-3", "090-lib-4", "090-rec-1", "090-rec-2"],
  ["090-lib-2", "090-lib-1", "090-rec-3", "090-lib-4"],
]
const PHONE_PORTRAITS = ["094-t1", "094-t2", "094-y1", "094-y2"]
const PHONE_PHASES = ["RELEASE", "LOAD", "RISE", "FOLLOW-THROUGH"]
const PHONE_STATS: [string, string, string, string][] = [
  ["24", "15", "62.5% BEST", "May 10, 2025"],
  ["18", "11", "61.1% BEST", "May 8, 2025"],
  ["30", "21", "70.0% BEST", "May 5, 2025"],
  ["16", "12", "75.0% BEST", "Apr 28, 2025"],
]

const CATEGORIES = ["Shooting", "Footwork", "Handling", "Scoring", "Form", "Flow"]
const LEVELS = ["Beginner", "Intermediate", "Advanced"]

function DrillLibrary() {
  const params = useSearchParams()
  const initial = (params?.get("tab") ?? "recommended") as (typeof TABS)[number]["id"]
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>(
    TABS.some((t) => t.id === initial) ? initial : "recommended")
  const [query, setQuery] = useState("")
  const [saved, setSaved] = useState<Set<string>>(
    () => new Set(DRILLS.filter((d) => d.saved).map((d) => d.title)))
  const [custom, setCustom] = useState<Drill[]>([])
  const [creating, setCreating] = useState(false)
  const [notice, setNotice] = useState("")
  const [form, setForm] = useState({ title: "", cat: CATEGORIES[0], level: LEVELS[0], mins: "10", desc: "" })

  // Custom drills persist through the saved-workouts API (drill metadata
  // rides in the drillIds Json column).
  useEffect(() => {
    fetch("/api/saved-workouts", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const rows = (d?.savedWorkouts ?? []).filter((w: { drillIds?: unknown[] }) =>
          Array.isArray(w.drillIds) && (w.drillIds[0] as { customDrill?: boolean })?.customDrill)
        if (rows.length) {
          const drills: Drill[] = rows.map((w: { name: string; drillIds: unknown[] }) => {
            const m = w.drillIds[0] as { len?: string; level?: string; cat?: string; desc?: string }
            return { title: w.name, len: m.len ?? "10:00", level: m.level ?? "Beginner", cat: m.cat ?? "Shooting", desc: m.desc ?? "", saved: true }
          })
          setCustom(drills)
          setSaved((s) => new Set([...s, ...drills.map((d) => d.title)]))
        }
      }).catch(() => {})
  }, [])

  const createDrill = async () => {
    if (!form.title.trim()) return
    const mins = Math.max(1, parseInt(form.mins) || 10)
    const len = `${String(mins).padStart(2, "0")}:00`
    const drill: Drill = { title: form.title.trim(), len, level: form.level, cat: form.cat, desc: form.desc.trim() || "Custom drill.", saved: true }
    try {
      const res = await fetch("/api/saved-workouts", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: drill.title, drillCount: 1,
          drillIds: [{ customDrill: true, slug: slug(drill.title), len, level: drill.level, cat: drill.cat, desc: drill.desc }],
        }),
      })
      setNotice(res.ok ? "Drill created" : "Drill saved locally — sign in to sync")
    } catch { setNotice("Drill saved locally — sign in to sync") }
    setCustom((c) => [drill, ...c])
    setSaved((s) => new Set([...s, drill.title]))
    setCreating(false)
    setForm({ title: "", cat: CATEGORIES[0], level: LEVELS[0], mins: "10", desc: "" })
    setTimeout(() => setNotice(""), 2500)
  }

  // Modals must always be escapable — Escape or clicking the backdrop.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setCreating(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const toggleSave = (title: string) =>
    setSaved((s) => { const n = new Set(s); if (n.has(title)) n.delete(title); else n.add(title); return n })

  const ALL = [...custom, ...DRILLS]
  const shown = ALL.filter((d) =>
    (tab === "recommended" ? d.recommended : tab === "saved" ? saved.has(d.title) : true) &&
    (!query.trim() || `${d.title} ${d.cat} ${d.level}`.toLowerCase().includes(query.trim().toLowerCase())))

  /* Canonical draws TWO unrelated phone designs on this route — 056 discover
     drills (a list with a recommendation card and a four-frame photo strip per
     row) and 058 my drills (a three-tab surface with portrait cards, a mini
     phase rail and a four-cell stat row). The existing `?tab=` already selects
     between them, so both stay reachable exactly as they were. */
  const isPhone = usePhoneViewport()
  if (isPhone) {
    const toLib = (d: Drill, i: number): LibraryDrill => ({
      id: slug(d.title), title: d.title, desc: d.desc, level: d.level,
      phase: PHONE_PHASES[i % PHONE_PHASES.length],
      mins: `${parseInt(d.len, 10) || 8} min`,
      strip: PHONE_STRIPS[i % PHONE_STRIPS.length].map(cimg),
      portrait: cimg(PHONE_PORTRAITS[i % PHONE_PORTRAITS.length]),
      shots: PHONE_STATS[i % 4][0], makes: PHONE_STATS[i % 4][1],
      acc: PHONE_STATS[i % 4][2], last: PHONE_STATS[i % 4][3],
    })
    const list = shown.map(toLib)
    return (
      <div className="md:hidden">
        {tab === "saved"
          ? <MyDrills drills={list} onAnalyze={() => { window.location.assign("/analyze") }} />
          : <DiscoverDrills drills={list}
                            saved={new Set(list.filter((d) => saved.has(d.title)).map((d) => d.id))}
                            onToggleSave={(id) => {
                              const hit = list.find((d) => d.id === id)
                              if (hit) toggleSave(hit.title)
                            }} />}
      </div>
    )
  }

  return (
    <ShotIQShell active="Training">
      <div data-testid="screen-desktop-web-drill-library" className="px-[26px] py-[18px]">
        <Link href="/results/demo/training"
              className="flex items-center gap-2 text-[13px] text-[var(--shotiq-color-graphite)] hover:text-[var(--shotiq-color-shotiqOrange)]">
          <ArrowLeft className="h-4 w-4" /> Back to Training Hub
        </Link>

        <div className="mt-[8px] flex items-end justify-between">
          <div>
            <h1 className="shotiq-display text-[48px] leading-[50px]">DRILL LIBRARY</h1>
            <p className="mt-[4px] text-[14px] text-[var(--shotiq-color-graphite)]">
              Every drill in one place — recommended for your goal, saved by you, or ready to discover.
            </p>
          </div>
          <div className="flex items-center gap-[10px]">
            {notice && <span className="text-[12px] font-medium text-[var(--shotiq-color-confirmGreen)]">{notice}</span>}
            <div className="flex h-[42px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[12px]">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search drills…"
                     data-testid="drill-search"
                     className="w-[160px] bg-transparent text-[13px] outline-none placeholder:text-[var(--shotiq-color-muted)]" />
              <Search className="h-[14px] w-[14px] text-[var(--shotiq-color-graphite)]" />
            </div>
            <button type="button" data-testid="create-drill" onClick={() => setCreating(true)}
                    className="flex h-[42px] items-center gap-[8px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] px-[16px] text-[13px] font-medium text-white">
              <Plus className="h-[15px] w-[15px]" /> Create drill
            </button>
          </div>
        </div>

        <div className="mt-[14px] flex gap-[8px]">
          {TABS.map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)} aria-pressed={tab === t.id}
                    className={`h-[36px] rounded-[999px] px-[18px] text-[13px] ${
                      tab === t.id ? "bg-[var(--shotiq-color-ink)] font-medium text-white" : "border border-[var(--shotiq-color-rule)]"}`}>
              {t.label}
            </button>
          ))}
          <span className="ml-auto self-center text-[12px] text-[var(--shotiq-color-graphite)]">{shown.length} drills</span>
        </div>

        <div className="mt-[14px] grid grid-cols-4 gap-[14px]">
          {shown.map((d) => (
            <Card key={d.title} className="flex flex-col overflow-hidden">
              <div className="relative">
                {/* The surface's transport defaults to `0:07`, so every tile
                    contradicted the badge sitting 8px above it — and for a
                    drill the player created themselves it contradicted THEIR
                    number: a drill badged 12:00 whose transport read 0:07. The
                    length is right here in scope; the tile has no excuse for
                    two answers. */}
                <MediaSurface height={130} rounded={0} duration={d.len} />
                <span className="absolute left-[8px] top-[8px] rounded-[3px] bg-black/75 px-[6px] py-[2px] text-[10px] font-bold text-white">{d.len}</span>
                <button type="button" aria-label={saved.has(d.title) ? "Remove from my drills" : "Save drill"}
                        aria-pressed={saved.has(d.title)} onClick={() => toggleSave(d.title)}
                        className="absolute right-[6px] top-[6px] grid h-[24px] w-[24px] place-items-center rounded-[4px] bg-black/40">
                  <Bookmark className="h-[14px] w-[14px] text-white" fill={saved.has(d.title) ? "currentColor" : "none"} />
                </button>
              </div>
              <div className="flex flex-1 flex-col p-[12px]">
                <div className="text-[15px] font-semibold leading-[19px]">{d.title}</div>
                <div className="mt-[2px] text-[11px] text-[var(--shotiq-color-graphite)]">{d.len} · {d.level} · {d.cat}</div>
                <p className="mt-[6px] flex-1 text-[12px] leading-[16px] text-[var(--shotiq-color-graphite)]">{d.desc}</p>
                <Link href={`/training/drills/${slug(d.title)}`}
                      className="mt-[10px] flex h-[36px] items-center justify-center rounded-[5px] border-2 border-[var(--shotiq-color-shotiqOrange)] text-[13px] font-medium text-[var(--shotiq-color-shotiqOrange)]">
                  Start drill
                </Link>
              </div>
            </Card>
          ))}
          {!shown.length && (
            <Card className="col-span-4 p-[28px] text-center text-[13px] text-[var(--shotiq-color-graphite)]">
              No drills match — clear the search or switch tabs.
            </Card>
          )}
        </div>

        {creating && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(17,17,17,0.35)]" role="dialog" aria-modal="true"
               onClick={() => setCreating(false)}>
            <Card className="w-[440px] p-[20px]" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <SectionLabel>CREATE A DRILL</SectionLabel>
                <button type="button" aria-label="Close" onClick={() => setCreating(false)}>
                  <X className="h-[15px] w-[15px] text-[var(--shotiq-color-graphite)]" />
                </button>
              </div>
              <label className="mt-[14px] block text-[12px] font-bold tracking-[0.04em]">DRILL NAME</label>
              <input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                     data-testid="drill-name" placeholder="e.g. Corner Catch & Rise"
                     className="mt-[6px] h-[42px] w-full rounded-[6px] border border-[var(--shotiq-color-rule)] px-[12px] text-[14px] outline-none focus:border-[var(--shotiq-color-ink)]" />
              <div className="mt-[12px] grid grid-cols-3 gap-[10px]">
                <div>
                  <label className="block text-[12px] font-bold tracking-[0.04em]">CATEGORY</label>
                  <select value={form.cat} onChange={(e) => setForm({ ...form, cat: e.target.value })}
                          className="mt-[6px] h-[42px] w-full rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white px-[8px] text-[13px] outline-none">
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-bold tracking-[0.04em]">LEVEL</label>
                  <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}
                          className="mt-[6px] h-[42px] w-full rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white px-[8px] text-[13px] outline-none">
                    {LEVELS.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-bold tracking-[0.04em]">MINUTES</label>
                  <input type="number" min={1} max={90} value={form.mins}
                         onChange={(e) => setForm({ ...form, mins: e.target.value })}
                         className="mt-[6px] h-[42px] w-full rounded-[6px] border border-[var(--shotiq-color-rule)] px-[10px] text-[13px] outline-none focus:border-[var(--shotiq-color-ink)]" />
                </div>
              </div>
              <label className="mt-[12px] block text-[12px] font-bold tracking-[0.04em]">WHAT IT TRAINS (OPTIONAL)</label>
              <textarea rows={3} value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })}
                        placeholder="Short description of the drill"
                        className="mt-[6px] w-full rounded-[6px] border border-[var(--shotiq-color-rule)] px-[12px] py-[8px] text-[14px] outline-none focus:border-[var(--shotiq-color-ink)]" />
              <div className="mt-[14px] flex justify-end gap-[10px]">
                <button type="button" onClick={() => setCreating(false)}
                        className="h-[42px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[18px] text-[13px]">Cancel</button>
                <button type="button" disabled={!form.title.trim()} onClick={createDrill} data-testid="drill-create-submit"
                        className="h-[42px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] px-[18px] text-[13px] font-medium text-white disabled:opacity-40">
                  Create drill
                </button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </ShotIQShell>
  )
}

export default function DrillLibraryPage() {
  return (
    <Suspense>
      <DrillLibrary />
    </Suspense>
  )
}
