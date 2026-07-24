
import "dotenv/config"
import { ALL_ELITE_SHOOTERS } from "@/data/eliteShooters"
import {
  SHOOTER_RESEARCH_DIR,
  atomicWriteJson,
  canonicalizeName,
  sanitizeSecret,
} from "@/lib/shooterResearch"
import { proxyFetch, type ProxyRequestMetrics } from "@/lib/shooterMediaResearch"
import path from "node:path"

interface Args {
  maxBytes: number
  sources: Set<string> | null
}

interface StatCandidate {
  canonicalId: string
  displayName: string
  sourceName: string
  sourceUrl: string
  league: "NBA" | "WNBA" | "NCAA_MEN" | "NCAA_WOMEN"
  season: string
  team: string | null
  games: number | null
  fgPct: number | null
  threePct: number | null
  twoPct: number | null
  ftPct: number | null
  threePointAttempts: number | null
  threePointAttemptsPerGame: number | null
  pointsPerGame: number | null
  minutesPerGame: number | null
  alreadyInApp: boolean
  qualification: "elite" | "great" | "near_miss" | "rejected"
  qualificationReasons: string[]
  score: number
  retrievedAt: string
}

interface ExistingGap {
  canonicalId: string
  displayName: string
  league: string
  tier: string
  careerPct: number | null
  careerFreeThrowPct: number | null
  missingPhoto: boolean
  missingShootingFormImages: boolean
  priority: number
}

const SOURCES = [
  { sourceName: "basketball-reference", league: "NBA" as const, season: "2025-26", url: "https://www.basketball-reference.com/leagues/NBA_2026_per_game.html" },
  { sourceName: "basketball-reference-wnba", league: "WNBA" as const, season: "2026", url: "https://www.basketball-reference.com/wnba/years/2026_per_game.html" },
]

function parseArgs(argv: string[]): Args {
  const args: Args = { maxBytes: 4_000_000, sources: null }
  for (const arg of argv) {
    if (arg.startsWith("--max-bytes=")) args.maxBytes = Number(arg.slice("--max-bytes=".length))
    if (arg.startsWith("--sources=")) args.sources = new Set(arg.slice("--sources=".length).split(",").map((s) => s.trim()).filter(Boolean))
  }
  return args
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
}

function stripTags(value: string): string {
  return decodeHtml(value.replace(/<[^>]*>?/g, " ").replace(/\s+/g, " ").trim())
}

function valueFor(row: string, stat: string): string | null {
  const re = new RegExp(`<t[hd][^>]*data-stat=["']${stat}["'][^>]*>([\\s\\S]*?)<\\/t[hd]>`, "i")
  const match = row.match(re)
  return match?.[1] ? stripTags(match[1]) : null
}

function num(value: string | null): number | null {
  if (!value) return null
  const cleaned = value.replace(/[%,$]/g, "").trim()
  if (!cleaned) return null
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

function pct(value: string | null): number | null {
  const parsed = num(value)
  if (parsed === null) return null
  return parsed <= 1 ? Number((parsed * 100).toFixed(1)) : parsed
}

function rowsFor(html: string): string[] {
  return [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((m) => m[0])
}

function classify(candidate: Omit<StatCandidate, "qualification" | "qualificationReasons" | "score">): Pick<StatCandidate, "qualification" | "qualificationReasons" | "score"> {
  const reasons: string[] = []
  const games = candidate.games ?? 0
  const threePct = candidate.threePct ?? 0
  const twoPct = candidate.twoPct ?? candidate.fgPct ?? 0
  const ftPct = candidate.ftPct ?? 0
  const threes = candidate.threePointAttempts ?? 0
  const threesPerGame = candidate.threePointAttemptsPerGame ?? 0
  const minutes = candidate.minutesPerGame ?? 0
  const womens = candidate.league === "WNBA" || candidate.league === "NCAA_WOMEN"
  const minGames = womens ? 8 : 30
  const minThreeAttempts = womens ? 35 : 100
  const minThreePerGame = womens ? 1.2 : 2.0
  const greatThree = womens ? 35.5 : 37
  const eliteThree = womens ? 38 : 39
  const greatFt = 80
  const eliteFt = 85
  const greatTwo = womens ? 44 : 45
  const eliteTwo = womens ? 47 : 48

  if (games < minGames) reasons.push(`games ${games} below ${minGames}`)
  if (threePct < greatThree) reasons.push(`3PT ${threePct} below ${greatThree}`)
  if (ftPct < greatFt) reasons.push(`FT ${ftPct} below ${greatFt}`)
  if (twoPct < greatTwo) reasons.push(`2PT/FG ${twoPct} below ${greatTwo}`)
  if (threes < minThreeAttempts && threesPerGame < minThreePerGame) reasons.push(`3PA volume below ${minThreeAttempts} total / ${minThreePerGame} per game`)
  if (minutes && minutes < 15) reasons.push(`minutes ${minutes} below 15`)

  const score = Number((threePct * 1.5 + ftPct * 0.8 + twoPct * 0.7 + Math.min(threesPerGame, 8) * 4 + Math.min(games, 82) * 0.05).toFixed(2))
  if (reasons.length > 0) {
    const close = reasons.length <= 2 && threePct >= greatThree - 1.5 && ftPct >= greatFt - 2 && twoPct >= greatTwo - 2
    return { qualification: close ? "near_miss" : "rejected", qualificationReasons: reasons, score }
  }
  if (threePct >= eliteThree && ftPct >= eliteFt && twoPct >= eliteTwo) {
    return { qualification: "elite", qualificationReasons: ["passes elite 3PT/FT/2PT criteria with volume"], score }
  }
  return { qualification: "great", qualificationReasons: ["passes great 3PT/FT/2PT criteria with volume"], score }
}

function parseBasketballReference(html: string, source: typeof SOURCES[number], existingIds: Set<string>, retrievedAt: string): StatCandidate[] {
  const parsed: StatCandidate[] = []
  for (const row of rowsFor(html)) {
    if (!row.includes('data-stat="player"') && !row.includes("data-stat='player'")) continue
    const name = valueFor(row, "player")
    if (!name || name === "Player") continue
    const base = {
      canonicalId: canonicalizeName(name),
      displayName: name,
      sourceName: source.sourceName,
      sourceUrl: source.url,
      league: source.league,
      season: source.season,
      team: valueFor(row, "team_name_abbr") ?? valueFor(row, "team_id"),
      games: num(valueFor(row, "g")),
      fgPct: pct(valueFor(row, "fg_pct")),
      threePct: pct(valueFor(row, "fg3_pct")),
      twoPct: pct(valueFor(row, "fg2_pct")),
      ftPct: pct(valueFor(row, "ft_pct")),
      threePointAttempts: null,
      threePointAttemptsPerGame: num(valueFor(row, "fg3a_per_g")),
      pointsPerGame: num(valueFor(row, "pts_per_g")),
      minutesPerGame: num(valueFor(row, "mp_per_g")),
      alreadyInApp: existingIds.has(canonicalizeName(name)),
      retrievedAt,
    }
    const withAttempts = {
      ...base,
      threePointAttempts: base.threePointAttemptsPerGame !== null && base.games !== null ? Math.round(base.threePointAttemptsPerGame * base.games) : null,
    }
    parsed.push({ ...withAttempts, ...classify(withAttempts) })
  }
  return parsed
}

function existingGaps(): ExistingGap[] {
  return ALL_ELITE_SHOOTERS
    .map((shooter) => {
      const missingPhoto = !shooter.photoUrl
      const missingShootingFormImages = (shooter.shootingFormImages ?? []).length === 0
      const isWoman = shooter.league === "WNBA" || shooter.league === "NCAA_WOMEN" || shooter.league === "TOP_COLLEGE"
      const tierBoost = shooter.tier === "legendary" ? 40 : shooter.tier === "elite" ? 30 : shooter.tier === "great" ? 20 : shooter.tier === "good" ? 10 : 0
      return {
        canonicalId: canonicalizeName(shooter.name),
        displayName: shooter.name,
        league: shooter.league,
        tier: shooter.tier,
        careerPct: shooter.careerPct ?? null,
        careerFreeThrowPct: shooter.careerFreeThrowPct ?? null,
        missingPhoto,
        missingShootingFormImages,
        priority: (isWoman ? 50 : 0) + tierBoost + (missingPhoto ? 20 : 0) + (missingShootingFormImages ? 10 : 0),
      }
    })
    .filter((gap) => gap.missingPhoto || gap.missingShootingFormImages)
    .sort((a, b) => b.priority - a.priority)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const existingIds = new Set(ALL_ELITE_SHOOTERS.map((shooter) => canonicalizeName(shooter.name)))
  const metrics = new Map<string, ProxyRequestMetrics>()
  const discovered: StatCandidate[] = []
  for (const source of SOURCES) {
    if (args.sources && !args.sources.has(source.league.toLowerCase()) && !args.sources.has(source.sourceName)) continue
    const response = await proxyFetch(source.url, {
      sourceName: source.sourceName,
      timeoutMs: 25_000,
      maxBytes: args.maxBytes,
      retries: 2,
      metrics,
    })
    const html = response.body.toString("utf8")
    if (/Just a moment|cf-mitigated|challenge-platform/i.test(html)) {
      throw new Error(`${source.sourceName} returned an anti-bot challenge; refusing to bypass it`)
    }
    discovered.push(...parseBasketballReference(html, source, existingIds, new Date().toISOString()))
  }

  const newQualified = discovered
    .filter((candidate) => !candidate.alreadyInApp && ["elite", "great"].includes(candidate.qualification))
    .sort((a, b) => {
      const women = Number(b.league === "WNBA" || b.league === "NCAA_WOMEN") - Number(a.league === "WNBA" || a.league === "NCAA_WOMEN")
      return women || b.score - a.score
    })
  const nearMisses = discovered
    .filter((candidate) => !candidate.alreadyInApp && candidate.qualification === "near_miss")
    .sort((a, b) => b.score - a.score)
  const existingQualifiedMissing = existingGaps()

  const report = {
    generatedAt: new Date().toISOString(),
    criteria: {
      nbaMen: { minGames: 30, minThreePct: 37, minFreeThrowPct: 80, minTwoOrFieldPct: 45, minThreeAttempts: 100, minThreeAttemptsPerGame: 2.0 },
      wnbaWomen: { minGames: 8, minThreePct: 35.5, minFreeThrowPct: 80, minTwoOrFieldPct: 44, minThreeAttempts: 35, minThreeAttemptsPerGame: 1.2 },
    },
    sourceMetrics: [...metrics.values()],
    existingGapSummary: {
      totalExisting: ALL_ELITE_SHOOTERS.length,
      existingMissingPhoto: existingQualifiedMissing.filter((g) => g.missingPhoto).length,
      existingMissingShootingFormImages: existingQualifiedMissing.filter((g) => g.missingShootingFormImages).length,
      womenExisting: ALL_ELITE_SHOOTERS.filter((s) => s.league === "WNBA" || s.league === "NCAA_WOMEN" || s.league === "TOP_COLLEGE").length,
      menExisting: ALL_ELITE_SHOOTERS.filter((s) => !(s.league === "WNBA" || s.league === "NCAA_WOMEN" || s.league === "TOP_COLLEGE")).length,
    },
    newQualified,
    nearMisses,
    existingQualifiedMissing,
    rejectedCount: discovered.filter((candidate) => candidate.qualification === "rejected").length,
  }

  await atomicWriteJson(path.join(SHOOTER_RESEARCH_DIR, "discovered-shooter-candidates.json"), report)
  console.log(JSON.stringify({
    generatedAt: report.generatedAt,
    newQualified: newQualified.length,
    womenNewQualified: newQualified.filter((c) => c.league === "WNBA" || c.league === "NCAA_WOMEN").length,
    menNewQualified: newQualified.filter((c) => c.league === "NBA" || c.league === "NCAA_MEN").length,
    nearMisses: nearMisses.length,
    existingMissingPhoto: report.existingGapSummary.existingMissingPhoto,
    existingMissingShootingFormImages: report.existingGapSummary.existingMissingShootingFormImages,
    metrics: report.sourceMetrics,
    output: "data/shooter-research/discovered-shooter-candidates.json",
  }, null, 2))
}

main().catch((error) => {
  console.error(sanitizeSecret(error))
  process.exit(1)
})
