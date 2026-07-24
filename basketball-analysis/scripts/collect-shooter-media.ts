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
  pruneInvalidMediaCandidates,
  sanitizeSecret,
  type AthleteStagingProfile,
  type MediaCandidate,
  type ResearchSourceEvidence,
  type ShooterRosterEntry,
} from "@/lib/shooterResearch"
import {
  createMediaCandidateFromAsset,
  extractOfficialProviderId,
  fetchBasketballReferenceMediaSeeds,
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
  uncoveredOnly: boolean
  skipSourceEvidence: boolean
  maxRequests: number
  maxBytes: number
  maxImagesPerAthlete: number
  concurrency: number
  sources: Set<string> | null
  competitions: Set<string> | null
}

interface Checkpoint {
  updatedAt: string
  statuses: Record<string, AthleteStagingProfile["status"]>
  completedIds: string[]
  failedIds: string[]
}

const OFFICIAL_MEDIA_SEEDS: Record<string, DiscoveredMediaSeed[]> = {
  "louie-dampier": [{
    sourceName: "official",
    sourcePageUrl: "https://www.hoophall.com/hall-of-famers/louie-dampier/",
    assetUrl: "https://www.hoophall.com/application/files/1217/6487/8763/dampier_louie_headshot.webp",
    mediaKind: "headshot",
  }],
  "darel-carrier": [{
    sourceName: "official",
    sourcePageUrl: "https://khsbhf.com/inductee/darel-carrier/",
    assetUrl: "https://khsbhf.com/wp-content/uploads/2018/02/17darelcarrier.png",
    mediaKind: "headshot",
  }],
  "billy-keller": [{
    sourceName: "official",
    sourcePageUrl: "https://hoopshall.com/inductees/billy-keller/",
    assetUrl: "https://hoopshall.com/wp-content/uploads/2019/09/2790-303x450.jpg",
    mediaKind: "action",
  }],
  "nicole-powell": [{
    sourceName: "official",
    sourcePageUrl: "https://gostanford.com/sports/womens-basketball/roster/player/nicole-powell",
    assetUrl: "https://gostanford.com/imgproxy/TdlEaQW1PTZIcqSwBzw6qs3XzdH9wxkdhQl9JcCzcow/rs:fit:1980:0:0:0/g:ce:0:0/q:90/aHR0cHM6Ly9zdG9yYWdlLmdvb2dsZWFwaXMuY29tL3N0YW5mb3JkLXByb2QvMjAyNC8wMS8yMi82Wm9RcFhxbXJlcVpUVEpsQ1B3NUxsYWhrd2o0NnBXWWJsU1FOdnNFLmpwZw.jpg",
    mediaKind: "headshot",
  }],
  "allison-feaster": [{
    sourceName: "official",
    sourcePageUrl: "https://gocrimson.com/news/2023/9/7/womens-basketball-feaster-former-womens-basketball-standout-joins-ncaa-board-of-governors.aspx",
    assetUrl: "https://gocrimson.com/images/2023/9/7/Screenshot_2023-09-07_at_11.26.11_AM.png",
    mediaKind: "action",
  }],
  "laurie-koehn": [{
    sourceName: "official",
    sourcePageUrl: "https://www.kstatesports.com/honors/k-state-athletics-hall-of-fame/laurie-koehn/96",
    assetUrl: "https://images.sidearmdev.com/crop?url=https%3A%2F%2Fdxbhsrqyrr690.cloudfront.net%2Fsidearm.nextgen.sites%2Fkstate.sidearmsports.com%2Fimages%2F2020%2F6%2F16%2Fkoehn_hof.jpg&width=600&height=900&type=webp",
    mediaKind: "headshot",
  }],
  "erin-thorn": [{
    sourceName: "official",
    sourcePageUrl: "https://byucougars.com/news/2003/04/25/thorn-wnba-bound-drafted-by-new-york-liberty/",
    assetUrl: "https://byucougars.com/imgproxy/lklO4tRanYfF4_aixlgBK_pTAnUF9xryHf-H_dzCR00/rs:fit:1200:630:0:0/g:ce:0:0/q:70/aHR0cHM6Ly9zdG9yYWdlLmdvb2dsZWFwaXMuY29tL2J5dWNvdWdhcnMtcHJvZC8yMDI2LzAxLzI3L2U3Mk1OdVhsV1VpVEJIdUVJd3Bmb2tINGNKQVFObmRQTkFXNzFVbHMuanBn.jpg",
    mediaKind: "action",
  }],
  "fletcher-magee": [{
    sourceName: "official",
    sourcePageUrl: "https://woffordterriers.com/sports/mens-basketball/roster/fletcher-magee/5572",
    assetUrl: "https://woffordterriers.com/images/2018/9/28/Magee_Fletcher_2018.jpg",
    mediaKind: "headshot",
  }],
  "travis-bader": [{
    sourceName: "official",
    sourcePageUrl: "https://goldengrizzlies.com/sports/mens-basketball/roster/travis-bader/661",
    assetUrl: "https://goldengrizzlies.com/images/2018/5/8/9386964.jpeg",
    mediaKind: "headshot",
  }],
  "steve-alford": [{
    sourceName: "official",
    sourcePageUrl: "https://iuhoosiers.com/honors/indiana-university-athletics-hall-of-fame/steve-alford/111",
    assetUrl: "https://images.sidearmdev.com/crop?url=https%3A%2F%2Fdxbhsrqyrr690.cloudfront.net%2Fsidearm.nextgen.sites%2Fiuhoosiers.com%2Fimages%2F2015%2F4%2F1%2Falford.gif&width=600&height=900&type=webp",
    mediaKind: "headshot",
  }],
  "jack-taylor": [{
    sourceName: "official",
    sourcePageUrl: "https://pioneers.grinnell.edu/sports/mens-basketball/roster/jack-taylor/2320",
    assetUrl: "https://pioneers.grinnell.edu/images/2014/11/10/24_Taylor_5334.jpg",
    mediaKind: "headshot",
  }],
  "katelynn-flaherty": [{
    sourceName: "official",
    sourcePageUrl: "https://mgoblue.com/sports/womens-basketball/roster/katelynn-flaherty/14044",
    assetUrl: "https://images.sidearmdev.com/resize?url=https%3A%2F%2Fdxbhsrqyrr690.cloudfront.net%2Fsidearm.nextgen.sites%2Fmgoblue.com%2Fimages%2F2017%2F10%2F25%2F20171025_bkw_flaherty.jpg&width=1600&type=jpeg",
    mediaKind: "headshot",
  }],
  "jess-kovatch": [{
    sourceName: "official",
    sourcePageUrl: "https://sfuathletics.com/roster.aspx?rp_id=6526",
    assetUrl: "https://sfuathletics.com/images/2018/9/28/Kovatch_Jessica.jpg",
    mediaKind: "headshot",
  }],
  "heather-butler": [{
    sourceName: "official",
    sourcePageUrl: "https://utmsports.com/sports/womens-basketball/roster/heather-butler/3203",
    assetUrl: "https://images.sidearmdev.com/crop?url=https%3A%2F%2Fdxbhsrqyrr690.cloudfront.net%2Fsidearm.nextgen.sites%2Futm.sidearmsports.com%2Fimages%2F2022%2F7%2F5%2FBUTLER_HEATHER.jpg&width=600&height=900&type=webp",
    mediaKind: "headshot",
  }],
  "jamie-carey": [{
    sourceName: "official",
    sourcePageUrl: "https://texaslonghorns.com/honors/hall-of-honor/jamie-carey/956",
    assetUrl: "https://images.sidearmdev.com/crop?url=https%3A%2F%2Fdxbhsrqyrr690.cloudfront.net%2Fsidearm.nextgen.sites%2Ftexassports_com%2Fimages%2F2023%2F8%2F14%2Fcarey_uJtXN.jpg&width=600&height=900&type=webp",
    mediaKind: "headshot",
  }],
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    ids: [],
    limit: null,
    dryRun: false,
    reportOnly: false,
    resume: false,
    resumeFailed: false,
    uncoveredOnly: false,
    skipSourceEvidence: false,
    maxRequests: 600,
    maxBytes: 8_000_000,
    maxImagesPerAthlete: 3,
    concurrency: 1,
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
    else if (arg === "--uncovered") args.uncoveredOnly = true
    else if (arg === "--skip-source-evidence") args.skipSourceEvidence = true
    else if (arg.startsWith("--max-requests=")) args.maxRequests = Number(arg.slice("--max-requests=".length))
    else if (arg.startsWith("--max-bytes=")) args.maxBytes = Number(arg.slice("--max-bytes=".length))
    else if (arg.startsWith("--max-images-per-athlete=")) args.maxImagesPerAthlete = Number(arg.slice("--max-images-per-athlete=".length))
    else if (arg.startsWith("--concurrency=")) args.concurrency = Math.max(1, Number(arg.slice("--concurrency=".length)))
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
    const provider = seed.mediaKind === "headshot" ? extractOfficialProviderId(seed.assetUrl) : null
    const key = provider ? `headshot:${provider.sourceName}:${provider.providerId}` : seed.assetUrl
    if (!byUrl.has(key)) byUrl.set(key, seed)
  }
  return [...byUrl.values()]
    .sort((a, b) => priority(a) - priority(b))
    .slice(0, limit)
}

function rejectConflictingProviderSeeds(
  profile: AthleteStagingProfile,
  catalogSeeds: DiscoveredMediaSeed[],
  discoveredSeeds: DiscoveredMediaSeed[],
): DiscoveredMediaSeed[] {
  const verifiedIds = new Map<string, string>()
  for (const seed of discoveredSeeds) {
    const provider = extractOfficialProviderId(seed.assetUrl)
    if (provider) verifiedIds.set(provider.sourceName, provider.providerId)
  }
  return catalogSeeds.filter((seed) => {
    const provider = extractOfficialProviderId(seed.assetUrl)
    const verifiedId = provider ? verifiedIds.get(provider.sourceName) : null
    if (!provider || !verifiedId || provider.providerId === verifiedId) return true
    profile.errors.push(`Rejected catalog ${provider.sourceName} provider ID mismatch for ${entryLabel(profile)}`)
    return false
  })
}

function entryLabel(profile: AthleteStagingProfile): string {
  return `${profile.displayName} (${profile.canonicalId})`
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
  if (args.uncoveredOnly) {
    const staging = await loadStaging()
    const coveredIds = new Set(staging.athletes.filter((athlete) => athlete.mediaCandidates.length > 0).map((athlete) => athlete.canonicalId))
    selected = selected.filter((entry) => !coveredIds.has(entry.canonicalId))
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
  const metrics = new Map<string, ProxyRequestMetrics>()
  let requestBudgetRemaining = args.maxRequests
  let persistenceQueue: Promise<void> = Promise.resolve()
  let interrupted = false

  const reserveRequest = () => {
    if (requestBudgetRemaining <= 0) return false
    requestBudgetRemaining -= 1
    return true
  }

  const persistProfiles = () => {
    const profiles = [...profileById.values()]
    const dataset = {
      schemaVersion: 1 as const,
      generatedAt: new Date().toISOString(),
      athletes: profiles,
    }
    const candidates = profiles.flatMap((profile) => profile.mediaCandidates)
    const checkpoint = buildCheckpoint(profiles)
    persistenceQueue = persistenceQueue.then(async () => {
      await atomicWriteJson(STAGING_PATH, dataset)
      await atomicWriteJson(MEDIA_CANDIDATES_PATH, candidates)
      await atomicWriteJson(CHECKPOINT_PATH, checkpoint)
    })
    return persistenceQueue
  }

  process.on("SIGINT", async () => {
    interrupted = true
    await persistProfiles()
    console.log("Interrupted; checkpoint saved.")
    process.exit(130)
  })

  const processEntry = async (entry: ShooterRosterEntry) => {
    const profile = profileById.get(entry.canonicalId) ?? createEmptyProfile(entry)
    profile.researchSources ??= []
    profile.mediaCandidates ??= []
    profile.errors ??= []
    if (args.resume && profile.status === "completed") return
    profile.status = "in_progress"
    profile.updatedAt = new Date().toISOString()
    profileById.set(entry.canonicalId, profile)
    await persistProfiles()

    try {
      const seeds = seedUrlsFor(entry)
      let espnSeeds: DiscoveredMediaSeed[] = []
      let basketballReferenceSeeds: DiscoveredMediaSeed[] = []
      let wikimediaSeeds: DiscoveredMediaSeed[] = []
      const officialSeeds = args.sources?.has("official") ? OFFICIAL_MEDIA_SEEDS[entry.canonicalId] ?? [] : []
      if ((!args.sources || args.sources.has("espn")) && reserveRequest()) {
        try {
          espnSeeds = await fetchEspnMediaSeeds(entry, metrics)
        } catch (error) {
          profile.errors.push(`ESPN discovery: ${sanitizeSecret(error)}`)
        }
      }
      if (args.sources?.has("basketball-reference") && reserveRequest()) {
        try {
          basketballReferenceSeeds = await fetchBasketballReferenceMediaSeeds(entry, metrics)
        } catch (error) {
          profile.errors.push(`Basketball Reference discovery: ${sanitizeSecret(error)}`)
        }
      }
      if (args.sources?.has("wikimedia") && reserveRequest()) {
        try {
          wikimediaSeeds = await fetchWikimediaSearch(entry, metrics)
        } catch (error) {
          profile.errors.push(`Wikimedia discovery: ${sanitizeSecret(error)}`)
        }
      }
      const verifiedCatalogSeeds = rejectConflictingProviderSeeds(profile, seeds, espnSeeds)
      const eligibleSeeds = [...officialSeeds, ...espnSeeds, ...basketballReferenceSeeds, ...verifiedCatalogSeeds, ...wikimediaSeeds]
        .filter((seed) => !args.sources || args.sources.has(seed.sourceName))
      const allSeeds = prioritizeAndDedupeSeeds(entry, eligibleSeeds, args.maxImagesPerAthlete)

      updateProviderIds(profile, allSeeds)

      const sourcePages = sourcePagesForAthlete(entry, allSeeds.map((seed) => seed.assetUrl))
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
      if (!args.skipSourceEvidence) {
        for (const sourcePage of uniqueSourcePages) {
          if (!reserveRequest()) break
          sourceEvidence.push(await fetchResearchSourceEvidence(sourcePage, metrics, 2_000_000))
        }
      }

      const collected: MediaCandidate[] = []
      for (const seed of allSeeds) {
        if (!reserveRequest()) break
        const candidate = await createMediaCandidateFromAsset(
          entry,
          seed.sourceName,
          seed.assetUrl,
          seed.sourcePageUrl,
          metrics,
          args.maxBytes,
          seed.mediaKind,
        )
        collected.push(candidate)
      }

      profile.researchSources = mergeResearchSources(profile.researchSources, sourceEvidence)
      profile.mediaCandidates = mergeCandidates(profile.mediaCandidates, collected)
      profile.status = "completed"
      profile.updatedAt = new Date().toISOString()
    } catch (error) {
      profile.status = "failed"
      profile.errors.push(sanitizeSecret(error))
      profile.updatedAt = new Date().toISOString()
    }

    await persistProfiles()
  }

  let nextIndex = 0
  const worker = async () => {
    while (!interrupted) {
      const index = nextIndex
      nextIndex += 1
      if (index >= selected.length) return
      await processEntry(selected[index])
    }
  }
  const workerCount = Math.min(args.concurrency, Math.max(1, selected.length))
  await Promise.all(Array.from({ length: workerCount }, () => worker()))
  await persistenceQueue

  const pruning = pruneInvalidMediaCandidates([...profileById.values()].flatMap((profile) => profile.mediaCandidates))
  const retainedById = new Set(pruning.candidates.map((candidate) => candidate.id))
  for (const profile of profileById.values()) {
    profile.mediaCandidates = profile.mediaCandidates.filter((candidate) => retainedById.has(candidate.id))
    profile.externalProviderIds = {}
    updateProviderIds(profile, profile.mediaCandidates)
  }
  await persistProfiles()

  const report = {
    generatedAt: new Date().toISOString(),
    selectedAthletes: selected.length,
    completed: [...profileById.values()].filter((profile) => profile.status === "completed").length,
    failed: [...profileById.values()].filter((profile) => profile.status === "failed").length,
    mediaCandidates: [...profileById.values()].reduce((total, profile) => total + profile.mediaCandidates.length, 0),
    athletesWithMediaCandidates: [...profileById.values()].filter((profile) => profile.mediaCandidates.length > 0).length,
    prunedMediaCandidates: pruning.removedIds.length,
    crossPlayerDuplicateHashes: pruning.crossPlayerDuplicateHashes.length,
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
