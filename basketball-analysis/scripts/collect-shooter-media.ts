import "dotenv/config"
import { ALL_ELITE_SHOOTERS } from "@/data/eliteShooters"
import {
  CHECKPOINT_PATH,
  MEDIA_CANDIDATES_PATH,
  REPORT_PATH,
  STAGING_PATH,
  atomicWriteJson,
  createEmptyProfile,
  loadRoster,
  loadStaging,
  sanitizeSecret,
  type AthleteStagingProfile,
  type MediaCandidate,
  type ResearchSourceEvidence,
  type ShooterRosterEntry,
} from "@/lib/shooterResearch"
import {
  createMediaCandidateFromAsset,
  extractOfficialProviderId,
  fetchEspnMediaSeeds,
  fetchResearchSourceEvidence,
  proxyFetch,
  sourcePageForOfficialAsset,
  sourcePagesForAthlete,
  verifyIproyalProxy,
  type ProxyRequestMetrics,
  type DiscoveredMediaSeed,
} from "@/lib/shooterMediaResearch"

interface Args {
  ids: string[]
  limit: number | null
  dryRun: boolean
  reportOnly: boolean
  resume: boolean
  resumeFailed: boolean
  maxRequests: number
  maxBytes: number
  maxImagesPerAthlete: number
  sources: Set<string> | null
  competitions: Set<string> | null
}

interface Checkpoint {
  updatedAt: string
  statuses: Record<string, AthleteStagingProfile["status"]>
  completedIds: string[]
  failedIds: string[]
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    ids: [],
    limit: null,
    dryRun: false,
    reportOnly: false,
    resume: false,
    resumeFailed: false,
    maxRequests: 600,
    maxBytes: 8_000_000,
    maxImagesPerAthlete: 3,
    sources: null,
    competitions: null,
  }
  for (const arg of argv) {
    if (arg.startsWith("--ids=")) args.ids = arg.slice("--ids=".length).split(",").map((id) => id.trim()).filter(Boolean)
    else if (arg.startsWith("--limit=")) args.limit = Number(arg.slice("--limit=".length))
    else if (arg === "--dry-run") args.dryRun = true
    else if (arg === "--report-only") args.reportOnly = true
    else if (arg === "--resume") args.resume = true
    else if (arg === "--resume-failed") args.resumeFailed = true
    else if (arg.startsWith("--max-requests=")) args.maxRequests = Number(arg.slice("--max-requests=".length))
    else if (arg.startsWith("--max-bytes=")) args.maxBytes = Number(arg.slice("--max-bytes=".length))
    else if (arg.startsWith("--max-images-per-athlete=")) args.maxImagesPerAthlete = Number(arg.slice("--max-images-per-athlete=".length))
    else if (arg.startsWith("--sources=")) args.sources = new Set(arg.slice("--sources=".length).split(",").map((source) => source.trim()).filter(Boolean))
    else if (arg.startsWith("--competitions=")) args.competitions = new Set(arg.slice("--competitions=".length).split(",").map((competition) => competition.trim()).filter(Boolean))
  }
  return args
}

function catalogFor(entry: ShooterRosterEntry) {
  return ALL_ELITE_SHOOTERS.find((shooter) => shooter.id === entry.sourceCatalogId)
}

function seedUrlsFor(entry: ShooterRosterEntry): DiscoveredMediaSeed[] {
  const shooter = catalogFor(entry)
  if (!shooter) return []
  const urls: DiscoveredMediaSeed[] = []
  if (shooter.photoUrl) {
    urls.push({
      sourceName: sourceNameForUrl(shooter.photoUrl),
      sourcePageUrl: sourcePageForOfficialAsset(shooter.photoUrl, entry.displayName),
      assetUrl: shooter.photoUrl,
      mediaKind: "headshot",
    })
  }
  for (const assetUrl of shooter.shootingFormImages ?? []) {
    urls.push({
      sourceName: sourceNameForUrl(assetUrl),
      sourcePageUrl: sourcePageForOfficialAsset(assetUrl, entry.displayName),
      assetUrl,
      mediaKind: "action",
    })
  }
  return urls
}

function sourceNameForUrl(url: string): string {
  try {
    const host = new URL(url).hostname
    if (host.includes("nba.com")) return "nba"
    if (host.includes("espncdn.com")) return "espn"
    if (host.includes("wikimedia.org")) return "wikimedia"
    return host.replace(/^www\./, "")
  } catch {
    return "unknown"
  }
}

async function fetchWikimediaSearch(entry: ShooterRosterEntry, metrics: Map<string, ProxyRequestMetrics>): Promise<DiscoveredMediaSeed[]> {
  const query = encodeURIComponent(`${entry.displayName} basketball shooting`)
  const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${query}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url|mime|size|extmetadata&format=json&origin=*`
  const response = await proxyFetch(apiUrl, {
    sourceName: "wikimedia",
    timeoutMs: 20_000,
    maxBytes: 2_000_000,
    retries: 2,
    metrics,
  })
  const payload = JSON.parse(response.body.toString("utf8")) as {
    query?: {
      pages?: Record<string, { title: string; imageinfo?: Array<{ url?: string; descriptionurl?: string; mime?: string }> }>
    }
  }
  return Object.values(payload.query?.pages ?? {})
    .flatMap((page) => page.imageinfo?.filter((info) => info.mime?.startsWith("image/")).map((info) => ({
      sourceName: "wikimedia",
      sourcePageUrl: info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replaceAll(" ", "_"))}`,
      assetUrl: info.url || "",
      mediaKind: "unknown" as const,
    })) ?? [])
    .filter((item) => item.assetUrl.startsWith("https://"))
}

function mergeCandidates(existing: MediaCandidate[], incoming: MediaCandidate[]): MediaCandidate[] {
  const byId = new Map(existing.map((candidate) => [candidate.id, candidate]))
  for (const candidate of incoming) byId.set(candidate.id, candidate)
  return [...byId.values()]
}

function mergeResearchSources(existing: ResearchSourceEvidence[], incoming: ResearchSourceEvidence[]): ResearchSourceEvidence[] {
  const byUrl = new Map(existing.map((source) => [source.sourcePageUrl, source]))
  for (const source of incoming) byUrl.set(source.sourcePageUrl, source)
  return [...byUrl.values()]
}

function updateProviderIds(profile: AthleteStagingProfile, seeds: Array<{ assetUrl: string }>) {
  for (const seed of seeds) {
    const provider = extractOfficialProviderId(seed.assetUrl)
    if (provider) profile.externalProviderIds[provider.sourceName] = provider.providerId
  }
}

function prioritizeAndDedupeSeeds(entry: ShooterRosterEntry, seeds: DiscoveredMediaSeed[], limit: number): DiscoveredMediaSeed[] {
  const shooter = catalogFor(entry)
  const needsHeadshot = !shooter?.photoUrl
  const needsAction = !(shooter?.shootingFormImages?.length)
  const priority = (seed: DiscoveredMediaSeed) => {
    if (needsHeadshot && seed.mediaKind === "headshot") return 0
    if (needsAction && seed.mediaKind === "action") return 0
    if (seed.mediaKind === "action") return 1
    if (seed.mediaKind === "headshot") return 2
    return 3
  }
  const byUrl = new Map<string, DiscoveredMediaSeed>()
  for (const seed of seeds) {
    if (!byUrl.has(seed.assetUrl)) byUrl.set(seed.assetUrl, seed)
  }
  return [...byUrl.values()]
    .sort((a, b) => priority(a) - priority(b))
    .slice(0, limit)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const roster = await loadRoster()
  if (roster.length === 0) {
    throw new Error("No candidate roster found. Run npm run plan:shooters first.")
  }

  let selected = args.ids.length > 0 ? roster.filter((entry) => args.ids.includes(entry.canonicalId)) : roster
  if (args.competitions) selected = selected.filter((entry) => args.competitions?.has(entry.competitionCategory))
  if (args.limit !== null) selected = selected.slice(0, args.limit)
  if (args.resumeFailed) {
    const staging = await loadStaging()
    const failedIds = new Set(staging.athletes.filter((athlete) => athlete.status === "failed").map((athlete) => athlete.canonicalId))
    selected = selected.filter((entry) => failedIds.has(entry.canonicalId))
  }

  if (args.reportOnly) {
    const staging = await loadStaging()
    console.log(JSON.stringify({
      athletes: staging.athletes.length,
      completed: staging.athletes.filter((athlete) => athlete.status === "completed").length,
      failed: staging.athletes.filter((athlete) => athlete.status === "failed").length,
    }, null, 2))
    return
  }

  if (args.dryRun) {
    console.log(`Dry run selected ${selected.length} athletes`)
    for (const entry of selected) console.log(`${entry.canonicalId}: ${entry.displayName}`)
    return
  }

  const proxy = await verifyIproyalProxy()
  console.log(`IPRoyal proxy verified; exit IP ${proxy.exitIp}`)

  const staging = await loadStaging()
  const profileById = new Map(staging.athletes.map((athlete) => [athlete.canonicalId, athlete]))
  const mediaCandidates: MediaCandidate[] = []
  const metrics = new Map<string, ProxyRequestMetrics>()
  let requestBudgetRemaining = args.maxRequests

  process.on("SIGINT", async () => {
    await atomicWriteJson(CHECKPOINT_PATH, buildCheckpoint([...profileById.values()]))
    console.log("Interrupted; checkpoint saved.")
    process.exit(130)
  })

  for (const entry of selected) {
    const profile = profileById.get(entry.canonicalId) ?? createEmptyProfile(entry)
    profile.researchSources ??= []
    profile.mediaCandidates ??= []
    profile.errors ??= []
    if (args.resume && profile.status === "completed") continue
    profile.status = "in_progress"
    profile.updatedAt = new Date().toISOString()
    profileById.set(entry.canonicalId, profile)
    await atomicWriteJson(CHECKPOINT_PATH, buildCheckpoint([...profileById.values()]))

    try {
      const seeds = seedUrlsFor(entry)
      let espnSeeds: DiscoveredMediaSeed[] = []
      let wikimediaSeeds: DiscoveredMediaSeed[] = []
      if (requestBudgetRemaining > 0 && (!args.sources || args.sources.has("espn"))) {
        try {
          espnSeeds = await fetchEspnMediaSeeds(entry, metrics)
        } catch (error) {
          profile.errors.push(`ESPN discovery: ${sanitizeSecret(error)}`)
        }
        requestBudgetRemaining -= 1
      }
      if (requestBudgetRemaining > 0 && args.sources?.has("wikimedia")) {
        try {
          wikimediaSeeds = await fetchWikimediaSearch(entry, metrics)
        } catch (error) {
          profile.errors.push(`Wikimedia discovery: ${sanitizeSecret(error)}`)
        }
        requestBudgetRemaining -= 1
      }
      const eligibleSeeds = [...seeds, ...espnSeeds, ...wikimediaSeeds]
        .filter((seed) => !args.sources || args.sources.has(seed.sourceName))
      const allSeeds = prioritizeAndDedupeSeeds(entry, eligibleSeeds, args.maxImagesPerAthlete)

      updateProviderIds(profile, allSeeds)

      const sourcePages = sourcePagesForAthlete(entry, seeds.map((seed) => seed.assetUrl))
        .filter((source) => !args.sources || args.sources.has(source.sourceName))
      const discoveredSourcePages = allSeeds.map((seed) => ({
        sourceName: seed.sourceName,
        sourcePageUrl: seed.sourcePageUrl,
        evidenceType: seed.mediaKind === "headshot" ? "identity_profile" as const : "media_source" as const,
      }))
      const uniqueSourcePages = [...new Map(
        [...sourcePages, ...discoveredSourcePages].map((source) => [source.sourcePageUrl, source]),
      ).values()].slice(0, 10)
      const sourceEvidence: ResearchSourceEvidence[] = []
      for (const sourcePage of uniqueSourcePages) {
        if (requestBudgetRemaining <= 0) break
        sourceEvidence.push(await fetchResearchSourceEvidence(sourcePage, metrics, 2_000_000))
        requestBudgetRemaining -= 1
      }

      const collected: MediaCandidate[] = []
      for (const seed of allSeeds) {
        if (requestBudgetRemaining <= 0) break
        const candidate = await createMediaCandidateFromAsset(entry, seed.sourceName, seed.assetUrl, seed.sourcePageUrl, metrics, args.maxBytes)
        requestBudgetRemaining -= 1
        collected.push(candidate)
      }

      profile.researchSources = mergeResearchSources(profile.researchSources, sourceEvidence)
      profile.mediaCandidates = mergeCandidates(profile.mediaCandidates, collected)
      profile.status = "completed"
      profile.updatedAt = new Date().toISOString()
      mediaCandidates.push(...profile.mediaCandidates)
    } catch (error) {
      profile.status = "failed"
      profile.errors.push(sanitizeSecret(error))
      profile.updatedAt = new Date().toISOString()
    }

    await atomicWriteJson(STAGING_PATH, {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      athletes: [...profileById.values()],
    })
    await atomicWriteJson(MEDIA_CANDIDATES_PATH, mergeCandidates(mediaCandidates, [...profileById.values()].flatMap((profile) => profile.mediaCandidates)))
  }

  const report = {
    generatedAt: new Date().toISOString(),
    selectedAthletes: selected.length,
    completed: [...profileById.values()].filter((profile) => profile.status === "completed").length,
    failed: [...profileById.values()].filter((profile) => profile.status === "failed").length,
    mediaCandidates: [...profileById.values()].reduce((total, profile) => total + profile.mediaCandidates.length, 0),
    athletesWithMediaCandidates: [...profileById.values()].filter((profile) => profile.mediaCandidates.length > 0).length,
    metrics: [...metrics.values()],
  }
  await atomicWriteJson(REPORT_PATH, report)
  await atomicWriteJson(CHECKPOINT_PATH, buildCheckpoint([...profileById.values()]))
  console.log(JSON.stringify(report, null, 2))
}

function buildCheckpoint(profiles: AthleteStagingProfile[]): Checkpoint {
  return {
    updatedAt: new Date().toISOString(),
    statuses: Object.fromEntries(profiles.map((profile) => [profile.canonicalId, profile.status])),
    completedIds: profiles.filter((profile) => profile.status === "completed").map((profile) => profile.canonicalId),
    failedIds: profiles.filter((profile) => profile.status === "failed").map((profile) => profile.canonicalId),
  }
}

main().catch((error) => {
  console.error(sanitizeSecret(error))
  process.exit(1)
})
