"use client"

/** /elite-shooters — canonical 088-web-elite-shooters-database, DB-backed. */

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Search, ChevronDown, GitCompare } from "lucide-react"
import { Card, MediaSurface, Stat } from "@/components/shotiq/ShotIQShell"

interface Shooter {
  id: number; name: string; team: string; league: string; era?: string; tier?: string
  position: string; careerPct?: number; careerFreeThrowPct: number
  approvedFormImages?: string[]; imageUrl?: string
}

const LEAGUES = ["All", "NBA", "WNBA", "FIBA", "NCAA"]

export default function EliteShootersPage() {
  const [shooters, setShooters] = useState<Shooter[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [league, setLeague] = useState("All")
  const [sort, setSort] = useState<"Match" | "Name A–Z" | "FT %">("Match")
  const [sortOpen, setSortOpen] = useState(false)
  useEffect(() => {
    fetch("/api/shooters").then((r) => (r.ok ? r.json() : null))
      .then((d) => setShooters(d?.shooters ?? []))
      .catch(() => {}).finally(() => setLoading(false))
  }, [])
  const filtered = useMemo(() => {
    const out = shooters.filter((s) =>
      (league === "All" || s.league === league) &&
      (!query || s.name.toLowerCase().includes(query.toLowerCase())))
    if (sort === "Name A–Z") out.sort((a, b) => a.name.localeCompare(b.name))
    if (sort === "FT %") out.sort((a, b) => (b.careerFreeThrowPct ?? 0) - (a.careerFreeThrowPct ?? 0))
    return out
  }, [shooters, query, league, sort])
  const slug = (n: string) => n.toLowerCase().replace(/\s+/g, "-")

  return (
    <div data-testid="screen-desktop-web-elite-shooters-database" className="flex">
      <div className="min-w-0 flex-1 px-[24px] py-[18px]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="shotiq-display text-[46px] leading-[48px]">ELITE SHOOTERS</h1>
            <p className="mt-[2px] text-[13px] text-[var(--shotiq-color-graphite)]">
              Reference mechanics from the best shooters in the world.
            </p>
          </div>
          <div className="flex gap-[10px]">
            <div className="flex h-[42px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[12px]">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search shooters…"
                     className="w-[150px] bg-transparent text-[13px] outline-none placeholder:text-[var(--shotiq-color-muted)]" />
              <Search className="h-[14px] w-[14px] text-[var(--shotiq-color-graphite)]" />
            </div>
            <div className="relative">
              <button type="button" aria-expanded={sortOpen} onClick={() => setSortOpen((v) => !v)}
                      className="flex h-[42px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[14px] text-[13px]">
                Sort: {sort} <ChevronDown className="h-[12px] w-[12px]" />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-[46px] z-30 w-[160px] rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white py-[4px] shadow-[0_8px_20px_rgba(17,17,17,0.10)]">
                  {(["Match", "Name A–Z", "FT %"] as const).map((s) => (
                    <button key={s} type="button" onClick={() => { setSort(s); setSortOpen(false) }}
                            className={`flex h-[32px] w-full items-center px-[12px] text-[13px] hover:bg-[var(--shotiq-color-warmCanvas)] ${sort === s ? "font-semibold text-[var(--shotiq-color-shotiqOrange)]" : ""}`}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Link href="/results/demo/compare"
                  className="flex h-[42px] items-center gap-[8px] rounded-[6px] bg-[var(--shotiq-color-analysisBlue)] px-[16px] text-[13px] font-medium text-white">
              <GitCompare className="h-[14px] w-[14px]" /> Compare with my shot
            </Link>
          </div>
        </div>

        <div className="mt-[12px] flex gap-[8px]">
          {LEAGUES.map((l) => (
            <button key={l} type="button" onClick={() => setLeague(l)} aria-pressed={league === l}
                    className={`h-[34px] rounded-full px-[16px] text-[13px] ${league === l ? "bg-[var(--shotiq-color-ink)] text-white" : "border border-[var(--shotiq-color-rule)]"}`}>
              {l}
            </button>
          ))}
          <span className="ml-auto self-center text-[12px] text-[var(--shotiq-color-graphite)]">
            {loading ? "Loading roster…" : `${filtered.length} shooters`}
          </span>
        </div>

        <div className="mt-[12px] grid grid-cols-4 gap-[14px]">
          {filtered.map((s) => (
            <Link key={s.id} href={`/elite-shooters/${slug(s.name)}`}>
              <Card className="overflow-hidden">
                <div className="relative">
                  {s.imageUrl || s.approvedFormImages?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.imageUrl || s.approvedFormImages![0]} alt={s.name} className="h-[150px] w-full object-cover" />
                  ) : (
                    <MediaSurface height={150} rounded={0} />
                  )}
                  <span className="absolute left-[8px] top-[8px] rounded-[3px] bg-black/75 px-[6px] py-[2px] text-[9px] font-bold text-white">{s.league}</span>
                </div>
                <div className="p-[12px]">
                  <div className="truncate text-[15px] font-semibold">{s.name}</div>
                  <div className="truncate text-[11px] text-[var(--shotiq-color-graphite)]">{s.team} · {s.position}</div>
                  <div className="mt-[8px] flex items-center gap-[14px] border-t border-[var(--shotiq-color-rule)] pt-[8px]">
                    {s.careerPct != null && <Stat value={`${s.careerPct.toFixed(1)}%`} label="3P%" valueClass="text-[18px] leading-[20px]" />}
                    <Stat value={`${s.careerFreeThrowPct.toFixed(1)}%`} label="FT%" valueClass="text-[18px] leading-[20px]" />
                    <span className="ml-auto rounded-[4px] border border-[var(--shotiq-color-analysisBlue)] px-[6px] py-[2px] text-[9px] font-bold text-[var(--shotiq-color-analysisBlue)]">
                      {s.tier?.toUpperCase() ?? "ELITE"}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
          {!loading && !filtered.length && (
            <Card className="col-span-4 p-[26px] text-center text-[13px] text-[var(--shotiq-color-graphite)]">
              No shooters match your filters.
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
