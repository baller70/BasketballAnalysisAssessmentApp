
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
  ncaaSeasons: number[]
  wnbaSeasons: number[]
  fibaWomenSeasons: string[]
}

interface StatSource {
  sourceName: string
  league: StatCandidate["league"]
  season: string
  url: string
}

interface CandidateEvidence {
  league: StatCandidate["league"]
  season: string
  team: string | null
  sourceUrl: string
  fgPct: number | null
  threePct: number | null
  ftPct: number | null
}

interface StatCandidate {
  canonicalId: string
  displayName: string
  sourceName: string
  sourceUrl: string
  league: "NBA" | "WNBA" | "NCAA_MEN" | "NCAA_WOMEN" | "EUROLEAGUE_MEN" | "EUROLEAGUE_WOMEN"
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
  height: string | null
  position: string | null
  classYear: string | null
  externalProviderId: string | null
  photoUrl: string | null
  alreadyInApp: boolean
  qualification: "elite" | "great" | "near_miss" | "rejected"
  qualificationReasons: string[]
  score: number
  retrievedAt: string
  evidenceSeasons: CandidateEvidence[]
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

const BASE_SOURCES: StatSource[] = [
  { sourceName: "basketball-reference", league: "NBA" as const, season: "2025-26", url: "https://www.basketball-reference.com/leagues/NBA_2026_per_game.html" },
]

function parseArgs(argv: string[]): Args {
  const args: Args = {
    maxBytes: 4_000_000,
    sources: null,
    ncaaSeasons: [2026, 2025, 2024, 2023],
    wnbaSeasons: Array.from({ length: 30 }, (_, index) => 2026 - index),
    fibaWomenSeasons: ["25-26", "24-25", "23-24", "22-23"],
  }
  for (const arg of argv) {
    if (arg.startsWith("--max-bytes=")) args.maxBytes = Number(arg.slice("--max-bytes=".length))
    if (arg.startsWith("--sources=")) args.sources = new Set(arg.slice("--sources=".length).split(",").map((s) => s.trim()).filter(Boolean))
    if (arg.startsWith("--ncaa-seasons=")) args.ncaaSeasons = parseSeasonList(arg.slice("--ncaa-seasons=".length))
    if (arg.startsWith("--wnba-seasons=")) args.wnbaSeasons = parseSeasonList(arg.slice("--wnba-seasons=".length))
    if (arg.startsWith("--fiba-women-seasons=")) {
      args.fibaWomenSeasons = arg.slice("--fiba-women-seasons=".length).split(",").map((season) => season.trim()).filter(Boolean)
    }
  }
  return args
}

function parseSeasonList(value: string): number[] {
  const seasons = new Set<number>()
  for (const part of value.split(",").map((item) => item.trim()).filter(Boolean)) {
    const range = part.match(/^(\d{4})-(\d{4})$/)
    if (range) {
      const start = Number(range[1])
      const end = Number(range[2])
      for (let season = Math.min(start, end); season <= Math.max(start, end); season++) seasons.add(season)
      continue
    }
    const season = Number(part)
    if (Number.isInteger(season)) seasons.add(season)
  }
  return [...seasons].sort((a, b) => b - a)
}

function wnbaSources(seasons: number[]): StatSource[] {
  return seasons
    .filter((season) => season >= 1997)
    .map((season) => ({
      sourceName: "basketball-reference-wnba",
      league: "WNBA",
      season: String(season),
      url: `https://www.basketball-reference.com/wnba/years/${season}_per_game.html`,
    }))
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

function cleanPlayerName(value: string): string {
  return value.replace(/\s*\*+\s*$/, "").trim()
}

function isWomenLeague(league: StatCandidate["league"]): boolean {
  return league === "WNBA" || league === "NCAA_WOMEN" || league === "EUROLEAGUE_WOMEN"
}

function isMenLeague(league: StatCandidate["league"]): boolean {
  return league === "NBA" || league === "NCAA_MEN" || league === "EUROLEAGUE_MEN"
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

function classify(candidate: Omit<StatCandidate, "qualification" | "qualificationReasons" | "score" | "evidenceSeasons">): Pick<StatCandidate, "qualification" | "qualificationReasons" | "score"> {
  const reasons: string[] = []
  const games = candidate.games ?? 0
  const threePct = candidate.threePct ?? 0
  const twoPct = candidate.twoPct ?? candidate.fgPct ?? 0
  const ftPct = candidate.ftPct ?? 0
  const threes = candidate.threePointAttempts ?? 0
  const threesPerGame = candidate.threePointAttemptsPerGame ?? 0
  const minutes = candidate.minutesPerGame ?? 0
  const womens = isWomenLeague(candidate.league)
  const college = candidate.league === "NCAA_MEN" || candidate.league === "NCAA_WOMEN"
  const minGames = college ? 20 : womens ? 8 : 30
  const minThreeAttempts = college ? (womens ? 50 : 60) : womens ? 35 : 100
  const minThreePerGame = college ? 1.5 : womens ? 1.2 : 2.0
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

function parseBasketballReference(html: string, source: StatSource, existingIds: Set<string>, retrievedAt: string): StatCandidate[] {
  const parsed: StatCandidate[] = []
  for (const row of rowsFor(html)) {
    if (!row.includes('data-stat="player"') && !row.includes("data-stat='player'")) continue
    const rawName = valueFor(row, "player")
    const name = rawName ? cleanPlayerName(rawName) : null
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
      height: null,
      position: null,
      classYear: null,
      externalProviderId: null,
      photoUrl: null,
      alreadyInApp: existingIds.has(canonicalizeName(name)),
      retrievedAt,
    }
    const withAttempts = {
      ...base,
      threePointAttempts: base.threePointAttemptsPerGame !== null && base.games !== null ? Math.round(base.threePointAttemptsPerGame * base.games) : null,
    }
    parsed.push({
      ...withAttempts,
      ...classify(withAttempts),
      evidenceSeasons: [{
        league: source.league,
        season: source.season,
        team: base.team,
        sourceUrl: source.url,
        fgPct: base.fgPct,
        threePct: base.threePct,
        ftPct: base.ftPct,
      }],
    })
  }
  return parsed
}

interface NcaaRankingRow {
  canonicalId: string
  displayName: string
  team: string
  classYear: string | null
  height: string | null
  position: string | null
  games: number
  made: number
  attempts: number
  percentage: number
}

function parseNcaaRankingRows(html: string): NcaaRankingRow[] {
  const parsed: NcaaRankingRow[] = []
  for (const row of rowsFor(html)) {
    const cells = [...row.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((match) => stripTags(match[1]))
    if (cells.length < 10 || cells[0] === "Rank" || !/^\d+$/.test(cells[0])) continue
    const games = num(cells[6])
    const made = num(cells[7])
    const attempts = num(cells[8])
    const percentage = pct(cells[9])
    if (!cells[1] || games === null || made === null || attempts === null || percentage === null) continue
    parsed.push({
      canonicalId: canonicalizeName(cells[1]),
      displayName: cells[1],
      team: cells[2],
      classYear: cells[3] || null,
      height: cells[4] || null,
      position: cells[5] || null,
      games,
      made,
      attempts,
      percentage,
    })
  }
  return parsed
}

function ncaaPageCount(html: string): number {
  let maximum = 1
  for (const match of html.matchAll(/\/p(\d+)(?:["'?/]|$)/gi)) {
    maximum = Math.max(maximum, Number(match[1]))
  }
  return maximum
}

async function fetchNcaaRanking(
  league: "NCAA_MEN" | "NCAA_WOMEN",
  season: number,
  statId: number,
  args: Args,
  metrics: Map<string, ProxyRequestMetrics>,
): Promise<NcaaRankingRow[]> {
  const sport = league === "NCAA_WOMEN" ? "basketball-women" : "basketball-men"
  const sourceName = league === "NCAA_WOMEN" ? "ncaa-women" : "ncaa-men"
  const baseUrl = `https://www.ncaa.com/stats/${sport}/d1/${season}/individual/${statId}`
  const first = await proxyFetch(baseUrl, {
    sourceName,
    timeoutMs: 25_000,
    maxBytes: args.maxBytes,
    retries: 3,
    metrics,
  })
  const firstHtml = first.body.toString("utf8")
  if (/Access Denied|Just a moment|cf-mitigated|challenge-platform/i.test(firstHtml)) {
    throw new Error(`${sourceName} ${season} stat ${statId} returned an access challenge`)
  }
  const parsed = parseNcaaRankingRows(firstHtml)
  const pageCount = ncaaPageCount(firstHtml)
  for (let page = 2; page <= pageCount; page++) {
    const response = await proxyFetch(`${baseUrl}/p${page}`, {
      sourceName,
      timeoutMs: 25_000,
      maxBytes: args.maxBytes,
      retries: 3,
      metrics,
    })
    parsed.push(...parseNcaaRankingRows(response.body.toString("utf8")))
  }
  return parsed
}

async function fetchNcaaSeasonCandidates(
  league: "NCAA_MEN" | "NCAA_WOMEN",
  season: number,
  existingIds: Set<string>,
  args: Args,
  metrics: Map<string, ProxyRequestMetrics>,
): Promise<StatCandidate[]> {
  const [threeRows, freeThrowRows, fieldGoalRows] = await Promise.all([
    fetchNcaaRanking(league, season, 109, args, metrics),
    fetchNcaaRanking(league, season, 108, args, metrics),
    fetchNcaaRanking(league, season, 107, args, metrics),
  ])
  const freeThrows = new Map(freeThrowRows.map((row) => [row.canonicalId, row]))
  const fieldGoals = new Map(fieldGoalRows.map((row) => [row.canonicalId, row]))
  const sourceUrl = `https://www.ncaa.com/stats/${league === "NCAA_WOMEN" ? "basketball-women" : "basketball-men"}/d1/${season}/individual/109`
  const retrievedAt = new Date().toISOString()
  const candidates: StatCandidate[] = []

  for (const three of threeRows) {
    const freeThrow = freeThrows.get(three.canonicalId)
    const fieldGoal = fieldGoals.get(three.canonicalId)
    if (!freeThrow || !fieldGoal) continue
    const base = {
      canonicalId: three.canonicalId,
      displayName: three.displayName,
      sourceName: league === "NCAA_WOMEN" ? "ncaa-women" : "ncaa-men",
      sourceUrl,
      league,
      season: String(season),
      team: three.team,
      games: Math.max(three.games, freeThrow.games, fieldGoal.games),
      fgPct: fieldGoal.percentage,
      threePct: three.percentage,
      twoPct: null,
      ftPct: freeThrow.percentage,
      threePointAttempts: three.attempts,
      threePointAttemptsPerGame: Number((three.attempts / three.games).toFixed(2)),
      pointsPerGame: null,
      minutesPerGame: null,
      height: three.height,
      position: three.position,
      classYear: three.classYear,
      externalProviderId: null,
      photoUrl: null,
      alreadyInApp: existingIds.has(three.canonicalId),
      retrievedAt,
    }
    candidates.push({
      ...base,
      ...classify(base),
      evidenceSeasons: [{
        league,
        season: String(season),
        team: three.team,
        sourceUrl,
        fgPct: fieldGoal.percentage,
        threePct: three.percentage,
        ftPct: freeThrow.percentage,
      }],
    })
  }
  return candidates
}

interface EspnCategoryDefinition {
  name: string
  names: string[]
}

interface EspnAthleteStat {
  athlete: {
    id: string
    displayName: string
    displayHeight?: string
    position?: { abbreviation?: string }
    teamShortName?: string
    teamName?: string
    headshot?: { href?: string }
    links?: Array<{ rel?: string[]; href?: string }>
  }
  categories: Array<{
    name: string
    values: number[]
  }>
}

interface EspnAthleteStatsResponse {
  pagination?: { pages?: number }
  categories?: EspnCategoryDefinition[]
  athletes?: EspnAthleteStat[]
}

function espnStatValues(response: EspnAthleteStatsResponse, athlete: EspnAthleteStat): Map<string, number> {
  const values = new Map<string, number>()
  for (const category of athlete.categories) {
    const definition = response.categories?.find((item) => item.name === category.name)
    definition?.names.forEach((name, index) => {
      const value = category.values[index]
      if (Number.isFinite(value)) values.set(name, value)
    })
  }
  return values
}

function parseEspnNcaaCandidates(
  response: EspnAthleteStatsResponse,
  league: "NCAA_MEN" | "NCAA_WOMEN",
  season: number,
  existingIds: Set<string>,
): StatCandidate[] {
  const parsed: StatCandidate[] = []
  for (const entry of response.athletes ?? []) {
    const name = cleanPlayerName(entry.athlete.displayName)
    const canonicalId = canonicalizeName(name)
    const stats = espnStatValues(response, entry)
    const games = stats.get("gamesPlayed") ?? null
    const fieldGoalPct = stats.get("fieldGoalPct") ?? null
    const threePct = stats.get("threePointFieldGoalPct") ?? null
    const freeThrowPct = stats.get("freeThrowPct") ?? null
    const fieldGoalsMade = stats.get("fieldGoalsMade") ?? null
    const fieldGoalAttempts = stats.get("fieldGoalsAttempted") ?? null
    const threesMade = stats.get("threePointFieldGoalsMade") ?? null
    const threeAttempts = stats.get("threePointFieldGoalsAttempted") ?? null
    if (games === null || fieldGoalPct === null || threePct === null || freeThrowPct === null || threeAttempts === null) continue
    const twoAttempts = fieldGoalAttempts !== null ? fieldGoalAttempts - threeAttempts : null
    const twoMade = fieldGoalsMade !== null && threesMade !== null ? fieldGoalsMade - threesMade : null
    const twoPct = twoAttempts && twoMade !== null ? Number(((twoMade / twoAttempts) * 100).toFixed(1)) : null
    const sourceUrl = entry.athlete.links?.find((link) => link.rel?.includes("stats") && link.rel?.includes("desktop"))?.href ??
      `https://www.espn.com/${league === "NCAA_WOMEN" ? "womens-college-basketball" : "mens-college-basketball"}/player/stats/_/id/${entry.athlete.id}`
    const team = entry.athlete.teamShortName ?? entry.athlete.teamName ?? null
    const base = {
      canonicalId,
      displayName: name,
      sourceName: league === "NCAA_WOMEN" ? "espn-ncaa-women" : "espn-ncaa-men",
      sourceUrl,
      league,
      season: String(season),
      team,
      games,
      fgPct: Number(fieldGoalPct.toFixed(1)),
      threePct: Number(threePct.toFixed(1)),
      twoPct,
      ftPct: Number(freeThrowPct.toFixed(1)),
      threePointAttempts: Math.round(threeAttempts),
      threePointAttemptsPerGame: Number((threeAttempts / games).toFixed(2)),
      pointsPerGame: stats.get("avgPoints") ?? null,
      minutesPerGame: stats.get("avgMinutes") ?? null,
      height: entry.athlete.displayHeight ?? null,
      position: entry.athlete.position?.abbreviation ?? null,
      classYear: null,
      externalProviderId: entry.athlete.id,
      photoUrl: entry.athlete.headshot?.href ?? null,
      alreadyInApp: existingIds.has(canonicalId),
      retrievedAt: new Date().toISOString(),
    }
    parsed.push({
      ...base,
      ...classify(base),
      evidenceSeasons: [{
        league,
        season: String(season),
        team,
        sourceUrl,
        fgPct: base.fgPct,
        threePct: base.threePct,
        ftPct: base.ftPct,
      }],
    })
  }
  return parsed
}

async function fetchEspnNcaaSeasonCandidates(
  league: "NCAA_MEN" | "NCAA_WOMEN",
  season: number,
  existingIds: Set<string>,
  args: Args,
  metrics: Map<string, ProxyRequestMetrics>,
): Promise<StatCandidate[]> {
  const sport = league === "NCAA_WOMEN" ? "womens-college-basketball" : "mens-college-basketball"
  const sourceName = league === "NCAA_WOMEN" ? "espn-ncaa-women" : "espn-ncaa-men"
  const baseUrl = `https://site.web.api.espn.com/apis/common/v3/sports/basketball/${sport}/statistics/byathlete?isqualified=true&limit=250&season=${season}&seasontype=2&sort=offensive.threePointFieldGoalPct%3Adesc`
  const merged: EspnAthleteStatsResponse = { athletes: [] }
  let page = 1
  let pages = 1
  do {
    const response = await proxyFetch(`${baseUrl}&page=${page}`, {
      sourceName,
      timeoutMs: 35_000,
      maxBytes: Math.max(args.maxBytes, 6_000_000),
      retries: 3,
      metrics,
    })
    const parsed = JSON.parse(response.body.toString("utf8")) as EspnAthleteStatsResponse
    if (!merged.categories) merged.categories = parsed.categories
    merged.athletes?.push(...(parsed.athletes ?? []))
    pages = parsed.pagination?.pages ?? 1
    page++
  } while (page <= pages)
  return parseEspnNcaaCandidates(merged, league, season, existingIds)
}

function madeAttemptPair(value: string): [number, number] | null {
  const match = value.replace(/\s+/g, "").match(/^([\d.]+)-([\d.]+)$/)
  if (!match) return null
  const made = Number(match[1])
  const attempts = Number(match[2])
  return Number.isFinite(made) && Number.isFinite(attempts) ? [made, attempts] : null
}

function absoluteFibaUrl(href: string | undefined, fallback: string): string {
  if (!href) return fallback
  try {
    return new URL(decodeHtml(href), fallback).toString()
  } catch {
    return fallback
  }
}

function parseFibaWomenCandidates(
  html: string,
  season: string,
  sourceUrl: string,
  existingIds: Set<string>,
): StatCandidate[] {
  const parsed: StatCandidate[] = []
  const retrievedAt = new Date().toISOString()

  for (const row of rowsFor(html)) {
    const cells = [...row.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)]
    if (cells.length < 12) continue
    const values = cells.map((match) => stripTags(match[1]))
    if (!/^\d+\.?$/.test(values[0])) continue

    const playerTeam = values[1].match(/^(.*?)\s+\(([^)]+)\)\s*$/)
    const displayName = cleanPlayerName(playerTeam?.[1] ?? values[1])
    const team = playerTeam?.[2]?.trim() || null
    const games = num(values[2])
    const minutesPerGame = num(values[3])
    const pointsPerGame = num(values[4])
    const fieldGoals = madeAttemptPair(values[6])
    const fgPct = pct(values[7])
    const threes = madeAttemptPair(values[8])
    const threePct = pct(values[9])
    const ftPct = pct(values[11])
    if (!displayName || games === null || !fieldGoals || fgPct === null || !threes || threePct === null || ftPct === null) continue

    const twoAttemptsPerGame = fieldGoals[1] - threes[1]
    const twoMadePerGame = fieldGoals[0] - threes[0]
    const twoPct = twoAttemptsPerGame > 0
      ? Number(((twoMadePerGame / twoAttemptsPerGame) * 100).toFixed(1))
      : null
    const playerLink = cells[1][1].match(/href=["']([^"']+)["']/i)?.[1]
    const canonicalId = canonicalizeName(displayName)
    const base = {
      canonicalId,
      displayName,
      sourceName: "fiba-euroleague-women",
      sourceUrl: absoluteFibaUrl(playerLink, sourceUrl),
      league: "EUROLEAGUE_WOMEN" as const,
      season,
      team,
      games,
      fgPct,
      threePct,
      twoPct,
      ftPct,
      threePointAttempts: Math.round(threes[1] * games),
      threePointAttemptsPerGame: threes[1],
      pointsPerGame,
      minutesPerGame,
      height: null,
      position: null,
      classYear: null,
      externalProviderId: null,
      photoUrl: null,
      alreadyInApp: existingIds.has(canonicalId),
      retrievedAt,
    }
    parsed.push({
      ...base,
      ...classify(base),
      evidenceSeasons: [{
        league: base.league,
        season,
        team,
        sourceUrl: base.sourceUrl,
        fgPct,
        threePct,
        ftPct,
      }],
    })
  }

  return parsed
}

async function fetchFibaWomenSeasonCandidates(
  season: string,
  existingIds: Set<string>,
  args: Args,
  metrics: Map<string, ProxyRequestMetrics>,
): Promise<StatCandidate[]> {
  const sourceUrl = `https://www.fiba.basketball/en/events/euroleague-women-${season}/stats`
  const response = await proxyFetch(sourceUrl, {
    sourceName: "fiba-euroleague-women",
    timeoutMs: 35_000,
    maxBytes: Math.max(args.maxBytes, 6_000_000),
    retries: 3,
    metrics,
  })
  const html = response.body.toString("utf8")
  if (/Access Denied|Just a moment|cf-mitigated|challenge-platform/i.test(html)) {
    throw new Error(`fiba-euroleague-women ${season} returned an access challenge`)
  }
  return parseFibaWomenCandidates(html, season, sourceUrl, existingIds)
}

function deduplicateCandidates(candidates: StatCandidate[]): StatCandidate[] {
  const qualificationRank = { rejected: 0, near_miss: 1, great: 2, elite: 3 }
  const byId = new Map<string, StatCandidate>()
  for (const candidate of candidates) {
    const current = byId.get(candidate.canonicalId)
    if (!current) {
      byId.set(candidate.canonicalId, candidate)
      continue
    }
    const evidenceSeasons = [...current.evidenceSeasons, ...candidate.evidenceSeasons]
      .filter((evidence, index, all) => all.findIndex((item) =>
        item.league === evidence.league &&
        item.season === evidence.season &&
        item.team === evidence.team
      ) === index)
    const candidateIsBetter =
      qualificationRank[candidate.qualification] > qualificationRank[current.qualification] ||
      (qualificationRank[candidate.qualification] === qualificationRank[current.qualification] && candidate.score > current.score)
    byId.set(candidate.canonicalId, {
      ...(candidateIsBetter ? candidate : current),
      evidenceSeasons,
    })
  }
  return [...byId.values()]
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
  const discoveryErrors: string[] = []
  for (const source of [...BASE_SOURCES, ...wnbaSources(args.wnbaSeasons)]) {
    if (args.sources && !args.sources.has(source.league.toLowerCase()) && !args.sources.has(source.sourceName)) continue
    try {
      const response = await proxyFetch(source.url, {
        sourceName: source.sourceName,
        timeoutMs: 25_000,
        maxBytes: args.maxBytes,
        retries: 3,
        metrics,
      })
      const html = response.body.toString("utf8")
      if (/Just a moment|cf-mitigated|challenge-platform/i.test(html)) {
        throw new Error(`${source.sourceName} ${source.season} returned an access challenge`)
      }
      discovered.push(...parseBasketballReference(html, source, existingIds, new Date().toISOString()))
    } catch (error) {
      discoveryErrors.push(sanitizeSecret(`${source.sourceName} ${source.season}: ${error instanceof Error ? error.message : String(error)}`))
    }
  }

  for (const league of ["NCAA_WOMEN", "NCAA_MEN"] as const) {
    const sourceAliases = new Set([league.toLowerCase(), league.toLowerCase().replace("_", "-"), league === "NCAA_WOMEN" ? "women" : "men"])
    if (args.sources && ![...sourceAliases].some((source) => args.sources?.has(source))) continue
    for (const season of args.ncaaSeasons) {
      if (season >= 2021) {
        try {
          discovered.push(...await fetchNcaaSeasonCandidates(league, season, existingIds, args, metrics))
        } catch (error) {
          discoveryErrors.push(sanitizeSecret(`${league} ${season}: ${error instanceof Error ? error.message : String(error)}`))
        }
      }
      try {
        discovered.push(...await fetchEspnNcaaSeasonCandidates(league, season, existingIds, args, metrics))
      } catch (error) {
        discoveryErrors.push(sanitizeSecret(`ESPN ${league} ${season}: ${error instanceof Error ? error.message : String(error)}`))
      }
    }
  }

  const fibaWomenAliases = new Set(["fiba-women", "fiba-euroleague-women", "euroleague-women", "euroleague_women"])
  if (!args.sources || [...fibaWomenAliases].some((source) => args.sources?.has(source))) {
    for (const season of args.fibaWomenSeasons) {
      try {
        discovered.push(...await fetchFibaWomenSeasonCandidates(season, existingIds, args, metrics))
      } catch (error) {
        discoveryErrors.push(sanitizeSecret(`FIBA EUROLEAGUE_WOMEN ${season}: ${error instanceof Error ? error.message : String(error)}`))
      }
    }
  }

  const deduplicated = deduplicateCandidates(discovered)
  const newQualified = deduplicated
    .filter((candidate) => !candidate.alreadyInApp && ["elite", "great"].includes(candidate.qualification))
    .sort((a, b) => {
      const women = Number(isWomenLeague(b.league)) - Number(isWomenLeague(a.league))
      return women || b.score - a.score
    })
  const nearMisses = deduplicated
    .filter((candidate) => !candidate.alreadyInApp && candidate.qualification === "near_miss")
    .sort((a, b) => b.score - a.score)
  const existingQualifiedMissing = existingGaps()

  const report = {
    generatedAt: new Date().toISOString(),
    criteria: {
      nbaMen: { minGames: 30, minThreePct: 37, minFreeThrowPct: 80, minTwoOrFieldPct: 45, minThreeAttempts: 100, minThreeAttemptsPerGame: 2.0 },
      wnbaWomen: { minGames: 8, minThreePct: 35.5, minFreeThrowPct: 80, minTwoOrFieldPct: 44, minThreeAttempts: 35, minThreeAttemptsPerGame: 1.2 },
      euroLeagueWomen: { minGames: 8, minThreePct: 35.5, minFreeThrowPct: 80, minTwoPct: 44, minThreeAttempts: 35, minThreeAttemptsPerGame: 1.2 },
      ncaaMen: { minGames: 20, minThreePct: 37, minFreeThrowPct: 80, minFieldPct: 45, minThreeAttempts: 60, minThreeAttemptsPerGame: 1.5 },
      ncaaWomen: { minGames: 20, minThreePct: 35.5, minFreeThrowPct: 80, minFieldPct: 44, minThreeAttempts: 50, minThreeAttemptsPerGame: 1.5 },
    },
    requestedSeasons: {
      wnba: args.wnbaSeasons,
      ncaa: args.ncaaSeasons,
      fibaWomen: args.fibaWomenSeasons,
    },
    sourceMetrics: [...metrics.values()],
    discoveryErrors,
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
    rejectedCount: deduplicated.filter((candidate) => candidate.qualification === "rejected").length,
  }

  await atomicWriteJson(path.join(SHOOTER_RESEARCH_DIR, "discovered-shooter-candidates.json"), report)
  console.log(JSON.stringify({
    generatedAt: report.generatedAt,
    newQualified: newQualified.length,
    womenNewQualified: newQualified.filter((c) => isWomenLeague(c.league)).length,
    menNewQualified: newQualified.filter((c) => isMenLeague(c.league)).length,
    nearMisses: nearMisses.length,
    discoveryErrors: discoveryErrors.length,
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
