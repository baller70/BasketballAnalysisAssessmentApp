"use client"

/**
 * /training/drills — drill library. Destination for the Training Hub's
 * "My drills", "Discover", "View all drills" and "View all recommendations"
 * affordances (no dedicated canonical screen was supplied; layout follows the
 * training-hub card language). Tab preselect via ?tab=recommended|saved|discover.
 */

import React, { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Bookmark, Search } from "lucide-react"
import { ShotIQShell, SectionLabel, Card, MediaSurface } from "@/components/shotiq/ShotIQShell"

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

function DrillLibrary() {
  const params = useSearchParams()
  const initial = (params?.get("tab") ?? "recommended") as (typeof TABS)[number]["id"]
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>(
    TABS.some((t) => t.id === initial) ? initial : "recommended")
  const [query, setQuery] = useState("")
  const [saved, setSaved] = useState<Set<string>>(
    () => new Set(DRILLS.filter((d) => d.saved).map((d) => d.title)))

  const toggleSave = (title: string) =>
    setSaved((s) => { const n = new Set(s); n.has(title) ? n.delete(title) : n.add(title); return n })

  const shown = DRILLS.filter((d) =>
    (tab === "recommended" ? d.recommended : tab === "saved" ? saved.has(d.title) : true) &&
    (!query.trim() || `${d.title} ${d.cat} ${d.level}`.toLowerCase().includes(query.trim().toLowerCase())))

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
          <div className="flex h-[42px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[12px]">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search drills…"
                   data-testid="drill-search"
                   className="w-[160px] bg-transparent text-[13px] outline-none placeholder:text-[var(--shotiq-color-muted)]" />
            <Search className="h-[14px] w-[14px] text-[var(--shotiq-color-graphite)]" />
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
                <MediaSurface height={130} rounded={0} />
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
