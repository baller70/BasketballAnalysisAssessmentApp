import "dotenv/config"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { ALL_ELITE_SHOOTERS } from "@/data/eliteShooters"
import {
  SHOOTER_RESEARCH_DIR,
  atomicWriteJson,
  canonicalizeName,
  sanitizeSecret,
  type ShooterRosterEntry,
} from "@/lib/shooterResearch"
import {
  fetchEspnMediaSeeds,
  type ProxyRequestMetrics,
} from "@/lib/shooterMediaResearch"

type CandidateLeague = "NBA" | "WNBA" | "NCAA_MEN" | "NCAA_WOMEN" | "EUROLEAGUE_MEN" | "EUROLEAGUE_WOMEN"

interface CandidateEvidence {
  league: CandidateLeague
  season: string
  team: string | null
  sourceUrl: string
  games: number | null
  fgPct: number | null
  threePct: number | null
  ftPct: number | null
  threePointAttempts: number | null
  qualified: boolean
}

interface Candidate {
  canonicalId: string
  displayName: string
  sourceName: string
  sourceUrl: string
  league: CandidateLeague
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
  score: number
  evidenceSeasons: CandidateEvidence[]
}

interface DiscoveryReport {
  generatedAt: string
  newQualified: Candidate[]
}

interface ImportSeed {
  canonicalId: string
  name: string
  team: string
  league: "NBA" | "WNBA" | "NCAA_MEN" | "NCAA_WOMEN"
  competitionHistory: Array<"NBA" | "WNBA" | "NCAA_MEN" | "NCAA_WOMEN">
  qualification: "elite" | "great"
  qualificationSeason: string
  games: number
  fgPct: number
  threePct: number
  twoOrFieldPct: number
  twoOrFieldBasis: "2PT" | "FG"
  ftPct: number
  threePointAttempts: number
  threePointAttemptsPerGame: number
  pointsPerGame: number | null
  minutesPerGame: number | null
  position: string | null
  height: string | null
  externalProviderId: string | null
  photoUrl: string | null
  photoSourceUrl: string | null
  sourceUrl: string
  score: number
  evidenceSeasons: CandidateEvidence[]
}

const WOMEN_LEAGUES = new Set<CandidateLeague>(["WNBA", "NCAA_WOMEN", "EUROLEAGUE_WOMEN"])
const MEN_LEAGUES = new Set<CandidateLeague>(["NBA", "NCAA_MEN", "EUROLEAGUE_MEN"])
const OFFICIAL_WNBA_PLAYER_IDS: Record<string, string> = {
  "lexie-brown": "1628882",
  "megan-gustafson": "1629484",
  "iziane-castro-marques": "100796",
  "shenise-johnson": "203018",
  "trisha-fallon": "100399",
}

function isImportedShooter(shooter: (typeof ALL_ELITE_SHOOTERS)[number]): boolean {
  return shooter.statScope === "qualifying-season"
}

function isWomanLeague(league: string): boolean {
  return league === "WNBA" || league === "NCAA_WOMEN" || league === "TOP_COLLEGE"
}

async function loadReport(fileName: string): Promise<DiscoveryReport> {
  const filePath = path.join(SHOOTER_RESEARCH_DIR, fileName)
  return JSON.parse(await readFile(filePath, "utf8")) as DiscoveryReport
}

function validateCandidate(candidate: Candidate): string[] {
  const errors: string[] = []
  if (candidate.alreadyInApp) errors.push("already_in_app")
  if (candidate.qualification !== "elite" && candidate.qualification !== "great") errors.push("not_qualified")
  if (!candidate.games || candidate.fgPct === null || candidate.threePct === null || candidate.ftPct === null) {
    errors.push("missing_required_stats")
  }
  if (!candidate.threePointAttempts || candidate.threePointAttemptsPerGame === null) errors.push("missing_three_point_volume")
  if (candidate.league === "EUROLEAGUE_WOMEN") {
    const qualifyingFibaSeasons = new Set(
      candidate.evidenceSeasons
        .filter((evidence) => evidence.league === "EUROLEAGUE_WOMEN" && evidence.qualified)
        .map((evidence) => evidence.season),
    )
    if (qualifyingFibaSeasons.size < 3) errors.push("fiba_requires_three_qualified_seasons")
  }
  return errors
}

function supportedCompetitionHistory(candidate: Candidate): ImportSeed["competitionHistory"] {
  const history = new Set<ImportSeed["competitionHistory"][number]>()
  for (const evidence of candidate.evidenceSeasons) {
    if (evidence.league === "NBA" || evidence.league === "WNBA" || evidence.league === "NCAA_MEN" || evidence.league === "NCAA_WOMEN") {
      history.add(evidence.league)
    }
  }
  if (candidate.league === "NBA" || candidate.league === "WNBA" || candidate.league === "NCAA_MEN" || candidate.league === "NCAA_WOMEN") {
    history.add(candidate.league)
  }
  return [...history]
}

function primaryLeague(candidate: Candidate): ImportSeed["league"] {
  const history = supportedCompetitionHistory(candidate)
  if (history.includes("WNBA")) return "WNBA"
  if (history.includes("NBA")) return "NBA"
  if (history.includes("NCAA_WOMEN")) return "NCAA_WOMEN"
  return "NCAA_MEN"
}

function bestTeam(candidate: Candidate): string {
  return [candidate.team, ...candidate.evidenceSeasons.map((evidence) => evidence.team)]
    .filter((team): team is string => Boolean(team?.trim()))
    .sort((a, b) => b.length - a.length)[0] ?? "Team unavailable"
}

function rosterEntry(candidate: Candidate): ShooterRosterEntry {
  const league = primaryLeague(candidate)
  return {
    canonicalId: candidate.canonicalId,
    displayName: candidate.displayName,
    aliases: [],
    category: WOMEN_LEAGUES.has(candidate.league) ? "women" : "men",
    competitionCategory: league,
    shooterTier: candidate.qualification as "elite" | "great",
    dominantHand: null,
    height: null,
    weight: null,
    wingspan: null,
    armLength: null,
    bodyBuild: null,
    sourceCatalogId: -1,
  }
}

async function findHeadshot(
  candidate: Candidate,
  metrics: Map<string, ProxyRequestMetrics>,
): Promise<{ photoUrl: string | null; photoSourceUrl: string | null; warning: string | null }> {
  if (candidate.photoUrl?.startsWith("https://")) {
    return { photoUrl: candidate.photoUrl, photoSourceUrl: candidate.sourceUrl, warning: null }
  }
  const wnbaPlayerId = OFFICIAL_WNBA_PLAYER_IDS[candidate.canonicalId]
  if (wnbaPlayerId) {
    return {
      photoUrl: `https://cdn.wnba.com/headshots/wnba/latest/1040x760/${wnbaPlayerId}.png`,
      photoSourceUrl: `https://www.wnba.com/player/${wnbaPlayerId}`,
      warning: null,
    }
  }
  try {
    const headshot = (await fetchEspnMediaSeeds(rosterEntry(candidate), metrics, 0))
      .find((seed) => seed.mediaKind === "headshot")
    return {
      photoUrl: headshot?.assetUrl ?? null,
      photoSourceUrl: headshot?.sourcePageUrl ?? null,
      warning: headshot ? null : `${candidate.canonicalId}: no ESPN headshot found`,
    }
  } catch (error) {
    return {
      photoUrl: null,
      photoSourceUrl: null,
      warning: `${candidate.canonicalId}: ${sanitizeSecret(error)}`,
    }
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let cursor = 0
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await mapper(items[index])
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker))
  return results
}

async function main() {
  const [womenReport, menReport] = await Promise.all([
    loadReport("discovered-women-candidates.json"),
    loadReport("discovered-men-candidates.json"),
  ])
  const baseline = ALL_ELITE_SHOOTERS.filter((shooter) => !isImportedShooter(shooter))
  const existingIds = new Set(baseline.map((shooter) => canonicalizeName(shooter.name)))
  const womenExisting = baseline.filter((shooter) => isWomanLeague(shooter.league)).length
  const menExisting = baseline.length - womenExisting

  const women = womenReport.newQualified.filter((candidate) => WOMEN_LEAGUES.has(candidate.league))
  const men = menReport.newQualified.filter((candidate) => MEN_LEAGUES.has(candidate.league))
  const invalid = [...women, ...men]
    .map((candidate) => ({ candidate, errors: validateCandidate(candidate) }))
    .filter(({ candidate, errors }) => errors.length > 0 || existingIds.has(candidate.canonicalId))
  if (invalid.length > 0) {
    throw new Error(`Import candidates failed validation: ${JSON.stringify(invalid.slice(0, 10))}`)
  }

  const maximumMenAtParity = Math.max(0, womenExisting + women.length - menExisting)
  const selected = [...women, ...men.slice(0, maximumMenAtParity)]
  const uniqueIds = new Set(selected.map((candidate) => candidate.canonicalId))
  if (uniqueIds.size !== selected.length) throw new Error("Cross-report duplicate canonical IDs found")

  const metrics = new Map<string, ProxyRequestMetrics>()
  const warnings: string[] = []
  const seeds = await mapWithConcurrency(selected, 4, async (candidate): Promise<ImportSeed> => {
    const media = await findHeadshot(candidate, metrics)
    if (media.warning) warnings.push(media.warning)
    return {
      canonicalId: candidate.canonicalId,
      name: candidate.displayName,
      team: bestTeam(candidate),
      league: primaryLeague(candidate),
      competitionHistory: supportedCompetitionHistory(candidate),
      qualification: candidate.qualification as "elite" | "great",
      qualificationSeason: candidate.season,
      games: candidate.games as number,
      fgPct: candidate.fgPct as number,
      threePct: candidate.threePct as number,
      twoOrFieldPct: candidate.twoPct ?? candidate.fgPct as number,
      twoOrFieldBasis: candidate.twoPct === null ? "FG" : "2PT",
      ftPct: candidate.ftPct as number,
      threePointAttempts: candidate.threePointAttempts as number,
      threePointAttemptsPerGame: candidate.threePointAttemptsPerGame as number,
      pointsPerGame: candidate.pointsPerGame,
      minutesPerGame: candidate.minutesPerGame,
      position: candidate.position,
      height: candidate.height,
      externalProviderId: candidate.externalProviderId,
      photoUrl: media.photoUrl,
      photoSourceUrl: media.photoSourceUrl,
      sourceUrl: candidate.sourceUrl,
      score: candidate.score,
      evidenceSeasons: candidate.evidenceSeasons,
    }
  })

  const outputPath = path.join(process.cwd(), "src/data/discoveredShooterSeeds.json")
  const auditPath = path.join(SHOOTER_RESEARCH_DIR, "selected-shooter-import.json")
  const audit = {
    generatedAt: new Date().toISOString(),
    sourceReports: {
      women: womenReport.generatedAt,
      men: menReport.generatedAt,
    },
    policy: {
      womenFirst: true,
      target: "equal women and men after import",
      fibaMinimumQualifiedSeasons: 3,
      deduplication: "canonical athlete name across NCAA and professional evidence",
    },
    before: { women: womenExisting, men: menExisting, total: baseline.length },
    selected: {
      women: women.length,
      men: selected.length - women.length,
      total: selected.length,
      withHeadshot: seeds.filter((seed) => seed.photoUrl).length,
      withoutHeadshot: seeds.filter((seed) => !seed.photoUrl).length,
    },
    after: {
      women: womenExisting + women.length,
      men: menExisting + selected.length - women.length,
      total: baseline.length + selected.length,
    },
    warnings,
    sourceMetrics: [...metrics.values()],
    seeds,
  }
  await Promise.all([
    atomicWriteJson(outputPath, seeds),
    atomicWriteJson(auditPath, audit),
  ])
  console.log(JSON.stringify({
    output: path.relative(process.cwd(), outputPath),
    audit: path.relative(process.cwd(), auditPath),
    before: audit.before,
    selected: audit.selected,
    after: audit.after,
    mediaWarnings: warnings.length,
    sourceMetrics: audit.sourceMetrics,
  }, null, 2))
}

main().catch((error) => {
  console.error(sanitizeSecret(error))
  process.exit(1)
})
