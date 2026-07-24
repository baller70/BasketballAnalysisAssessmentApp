import { execFile } from "node:child_process"
import { promisify } from "node:util"
import sharp from "sharp"
import {
  assertProxyConfigured,
  canonicalizeName,
  hashText,
  sanitizeSecret,
  validatePublicHttpsUrl,
  type MediaCandidate,
  type ResearchSourceEvidence,
  type ShooterRosterEntry,
} from "./shooterResearch"

const execFileAsync = promisify(execFile)

export interface ProxyRequestMetrics {
  sourceName: string
  requests: number
  successes: number
  errors: number
  bytes: number
}

export interface ProxyFetchResult {
  url: string
  statusCode: number
  body: Buffer
  headers: Record<string, string>
}

export interface ProxyFetchOptions {
  sourceName: string
  timeoutMs: number
  maxBytes: number
  retries: number
  metrics: Map<string, ProxyRequestMetrics>
}

export interface DiscoveredMediaSeed {
  sourceName: string
  sourcePageUrl: string
  assetUrl: string
  mediaKind: "headshot" | "action" | "unknown"
}

function metricFor(metrics: Map<string, ProxyRequestMetrics>, sourceName: string): ProxyRequestMetrics {
  const existing = metrics.get(sourceName)
  if (existing) return existing
  const created = { sourceName, requests: 0, successes: 0, errors: 0, bytes: 0 }
  metrics.set(sourceName, created)
  return created
}

function parseCurlResponse(buffer: Buffer): ProxyFetchResult {
  const marker = Buffer.from("\n__SHOTIQ_STATUS__:")
  const markerIndex = buffer.lastIndexOf(marker)
  if (markerIndex < 0) {
    throw new Error("Missing proxy response status marker")
  }
  const body = buffer.subarray(0, markerIndex)
  const statusCode = Number(buffer.subarray(markerIndex + marker.length).toString("utf8").trim())
  return { url: "", statusCode, body, headers: {} }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function proxyFetch(url: string, options: ProxyFetchOptions): Promise<ProxyFetchResult> {
  const proxyUrl = assertProxyConfigured()
  const urlIssues = validatePublicHttpsUrl(url)
  if (urlIssues.length > 0) {
    throw new Error(`Refusing unsafe URL ${url}: ${urlIssues.join(",")}`)
  }

  const metric = metricFor(options.metrics, options.sourceName)
  let lastError: unknown

  for (let attempt = 0; attempt <= options.retries; attempt += 1) {
    metric.requests += 1
    try {
      const { stdout } = await execFileAsync(
        "curl",
        [
          "--silent",
          "--show-error",
          "--location",
          "--max-time",
          String(Math.ceil(options.timeoutMs / 1000)),
          "--max-filesize",
          String(options.maxBytes),
          "--proxy",
          proxyUrl,
          "--write-out",
          "\n__SHOTIQ_STATUS__:%{http_code}",
          url,
        ],
        { encoding: "buffer", maxBuffer: options.maxBytes + 4096 },
      )

      const parsed = parseCurlResponse(stdout)
      parsed.url = url
      metric.bytes += parsed.body.byteLength
      if (parsed.statusCode >= 200 && parsed.statusCode < 400) {
        metric.successes += 1
        return parsed
      }
      throw new Error(`HTTP ${parsed.statusCode} for ${url}`)
    } catch (error) {
      lastError = error
      metric.errors += 1
      if (attempt < options.retries) {
        await sleep(500 * 2 ** attempt)
      }
    }
  }

  throw new Error(sanitizeSecret(lastError))
}

export async function verifyIproyalProxy(): Promise<{ exitIp: string; metrics: ProxyRequestMetrics[] }> {
  const metrics = new Map<string, ProxyRequestMetrics>()
  const result = await proxyFetch("https://api.ipify.org?format=json", {
    sourceName: "ipify",
    timeoutMs: 20_000,
    maxBytes: 128_000,
    retries: 1,
    metrics,
  })
  const payload = JSON.parse(result.body.toString("utf8")) as { ip?: string }
  if (!payload.ip) {
    throw new Error("Proxy verification response did not include an IP address")
  }
  return { exitIp: payload.ip, metrics: [...metrics.values()] }
}

export async function createMediaCandidateFromAsset(
  entry: ShooterRosterEntry,
  sourceName: string,
  assetUrl: string,
  sourcePageUrl: string,
  metrics: Map<string, ProxyRequestMetrics>,
  maxBytes: number,
  mediaKind: MediaCandidate["mediaKind"] = "unknown",
): Promise<MediaCandidate> {
  const now = new Date().toISOString()
  const id = `${entry.canonicalId}-${sourceName}-${hashText(assetUrl).slice(0, 12)}`
  const rejectionReasons = [...validatePublicHttpsUrl(sourcePageUrl), ...validatePublicHttpsUrl(assetUrl)]
  let width: number | null = null
  let height: number | null = null
  let byteLength: number | null = null
  let contentHash: string | null = null

  if (rejectionReasons.length === 0) {
    try {
      const response = await proxyFetch(assetUrl, {
        sourceName,
        timeoutMs: 20_000,
        maxBytes,
        retries: 2,
        metrics,
      })
      byteLength = response.body.byteLength
      contentHash = hashText(response.body.toString("base64"))
      const metadata = await sharp(response.body).metadata()
      width = metadata.width ?? null
      height = metadata.height ?? null
      if (!width || !height) rejectionReasons.push("image_dimensions_unavailable")
      const minimumWidth = mediaKind === "headshot" ? 300 : 1200
      const minimumHeight = mediaKind === "headshot" ? 250 : 800
      if (width !== null && width < minimumWidth) rejectionReasons.push(`image_width_below_${minimumWidth}`)
      if (height !== null && height < minimumHeight) rejectionReasons.push(`image_height_below_${minimumHeight}`)
    } catch (error) {
      rejectionReasons.push(sanitizeSecret(error))
    }
  }

  return {
    id,
    canonicalId: entry.canonicalId,
    sourceName,
    sourcePageUrl,
    assetUrl,
    retrievedAt: now,
    width,
    height,
    byteLength,
    contentHash,
    photographer: null,
    licenseName: null,
    licenseUrl: null,
    attributionRequired: null,
    mediaKind,
    shotPhase: "unknown",
    cameraView: "unknown",
    identityReview: "PENDING_REVIEW",
    formQualityReview: "PENDING_REVIEW",
    rightsReview: "PENDING_REVIEW",
    rejectionReasons,
  }
}

export interface SourcePageCandidate {
  sourceName: string
  sourcePageUrl: string
  evidenceType: ResearchSourceEvidence["evidenceType"]
}

function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
}

function extractTagContent(html: string, pattern: RegExp): string | null {
  const match = html.match(pattern)
  if (!match?.[1]) return null
  return decodeHtmlEntities(stripHtml(match[1])).slice(0, 500)
}

export function extractOfficialProviderId(assetUrl: string): { sourceName: string; providerId: string } | null {
  try {
    const url = new URL(assetUrl)
    const path = url.pathname
    const nba = path.match(/\/headshots\/nba\/latest\/1040x760\/(\d+)\.png$/)
    if (url.hostname === "cdn.nba.com" && nba?.[1]) return { sourceName: "nba", providerId: nba[1] }
    const wnba = path.match(/\/headshots\/wnba\/latest\/1040x760\/(\d+)\.png$/)
    if (url.hostname === "ak-static.cms.nba.com" && wnba?.[1]) return { sourceName: "wnba", providerId: wnba[1] }
    const espnPath = url.searchParams.get("img") ?? path
    const espn = espnPath.match(/\/headshots\/(?:nba|wnba|mens-college-basketball|womens-college-basketball)\/players\/full\/(\d+)\.png$/)
    if (url.hostname === "a.espncdn.com" && espn?.[1]) return { sourceName: "espn", providerId: espn[1] }
  } catch {
    return null
  }
  return null
}

export function sourcePageForOfficialAsset(assetUrl: string, displayName: string): string {
  const provider = extractOfficialProviderId(assetUrl)
  const slug = displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
  if (provider?.sourceName === "nba") return `https://www.nba.com/player/${provider.providerId}/${slug}`
  if (provider?.sourceName === "wnba") return `https://www.wnba.com/player/${provider.providerId}/${slug}`
  if (provider?.sourceName === "espn") {
    const url = new URL(assetUrl)
    const espnPath = url.searchParams.get("img") ?? url.pathname
    const leagueSlug = espnPath.match(/\/headshots\/(nba|wnba|mens-college-basketball|womens-college-basketball)\//)?.[1]
    if (leagueSlug) return `https://www.espn.com/${leagueSlug}/player/_/id/${provider.providerId}/${slug}`
  }
  return assetUrl
}

export function sourcePagesForAthlete(entry: ShooterRosterEntry, assetUrls: string[]): SourcePageCandidate[] {
  const encodedName = encodeURIComponent(entry.displayName)
  const pages = new Map<string, SourcePageCandidate>()
  const add = (candidate: SourcePageCandidate) => pages.set(candidate.sourcePageUrl, candidate)

  for (const assetUrl of assetUrls) {
    const provider = extractOfficialProviderId(assetUrl)
    if (provider?.sourceName === "nba") {
      add({ sourceName: "nba", sourcePageUrl: sourcePageForOfficialAsset(assetUrl, entry.displayName), evidenceType: "identity_profile" })
      add({ sourceName: "nba", sourcePageUrl: `https://www.nba.com/search?query=${encodedName}`, evidenceType: "search_results" })
    } else if (provider?.sourceName === "wnba") {
      add({ sourceName: "wnba", sourcePageUrl: sourcePageForOfficialAsset(assetUrl, entry.displayName), evidenceType: "identity_profile" })
      add({ sourceName: "wnba", sourcePageUrl: `https://www.wnba.com/search?query=${encodedName}`, evidenceType: "search_results" })
    } else if (provider?.sourceName === "espn") {
      add({ sourceName: "espn", sourcePageUrl: sourcePageForOfficialAsset(assetUrl, entry.displayName), evidenceType: "identity_profile" })
      add({ sourceName: "espn", sourcePageUrl: `https://site.web.api.espn.com/apis/search/v2?query=${encodedName}`, evidenceType: "search_results" })
    }
  }

  add({ sourceName: "ncaa", sourcePageUrl: `https://www.ncaa.com/search?search=${encodedName}`, evidenceType: "search_results" })
  add({ sourceName: "fiba", sourcePageUrl: `https://www.fiba.basketball/search?query=${encodedName}`, evidenceType: "search_results" })
  add({ sourceName: "euroleague", sourcePageUrl: `https://www.euroleaguebasketball.net/euroleague/search/?query=${encodedName}`, evidenceType: "search_results" })
  add({ sourceName: "eurobasket", sourcePageUrl: `https://www.eurobasket.com/search.aspx?Search=${encodedName}`, evidenceType: "search_results" })

  return [...pages.values()]
}

interface EspnSearchImage {
  width?: number
  height?: number
  url?: string
  name?: string
  alt?: string
  caption?: string
  peers?: EspnSearchImage[]
}

interface EspnSearchContent {
  type?: string
  displayName?: string
  description?: string
  subtitle?: string
  sport?: string
  defaultLeagueSlug?: string
  link?: { web?: string }
  image?: { default?: string } | string
  images?: EspnSearchImage[]
}

interface EspnSearchResultGroup {
  type?: string
  contents?: EspnSearchContent[]
}

const ESPN_LEAGUE_BY_COMPETITION: Record<ShooterRosterEntry["competitionCategory"], string> = {
  NBA: "nba",
  WNBA: "wnba",
  NCAA_MEN: "mens-college-basketball",
  NCAA_WOMEN: "womens-college-basketball",
  TOP_COLLEGE: "womens-college-basketball",
}

function containsAthleteName(value: string, entry: ShooterRosterEntry): boolean {
  const normalized = canonicalizeName(value)
  return [entry.canonicalId, ...entry.aliases.map(canonicalizeName)].some((name) => normalized.includes(name))
}

function bestEspnImage(image: EspnSearchImage): EspnSearchImage | null {
  const candidates = [image, ...(image.peers ?? [])]
    .filter((candidate) => candidate.url?.startsWith("https://a.espncdn.com/"))
    .filter((candidate) => containsUsefulDimensions(candidate))
  return candidates.sort((a, b) => imageScore(b) - imageScore(a))[0] ?? null
}

function containsUsefulDimensions(image: EspnSearchImage): boolean {
  return Number.isFinite(image.width) && Number.isFinite(image.height) && (image.width ?? 0) >= 600 && (image.height ?? 0) >= 400
}

function imageScore(image: EspnSearchImage): number {
  const width = image.width ?? 0
  const height = image.height ?? 0
  const minimumSizeBonus = width >= 1200 && height >= 800 ? 1_000_000_000 : 0
  return minimumSizeBonus + width * height
}

export async function fetchEspnMediaSeeds(
  entry: ShooterRosterEntry,
  metrics: Map<string, ProxyRequestMetrics>,
  maxActions = 2,
): Promise<DiscoveredMediaSeed[]> {
  const searchUrl = `https://site.web.api.espn.com/apis/search/v2?query=${encodeURIComponent(entry.displayName)}`
  const response = await proxyFetch(searchUrl, {
    sourceName: "espn",
    timeoutMs: 20_000,
    maxBytes: 2_000_000,
    retries: 2,
    metrics,
  })
  const payload = JSON.parse(response.body.toString("utf8")) as { results?: EspnSearchResultGroup[] }
  const expectedLeague = ESPN_LEAGUE_BY_COMPETITION[entry.competitionCategory]
  const playerResults = (payload.results ?? [])
    .filter((group) => group.type === "player")
    .flatMap((group) => group.contents ?? [])
    .filter((result) => result.sport === "basketball")
    .filter((result) => canonicalizeName(result.displayName ?? "") === entry.canonicalId)
    .sort((a, b) => Number(b.defaultLeagueSlug === expectedLeague) - Number(a.defaultLeagueSlug === expectedLeague))

  const exactLeaguePlayer = playerResults.find((result) => result.defaultLeagueSlug === expectedLeague)
  const matchedPlayer = exactLeaguePlayer ?? playerResults[0]
  const seeds: DiscoveredMediaSeed[] = []
  const profileUrl = matchedPlayer?.link?.web
  const profileId = profileUrl?.match(/\/id\/(\d+)\//)?.[1]
  const profileLeague = matchedPlayer?.defaultLeagueSlug
  const derivedHeadshot = profileId && profileLeague
    ? `https://a.espncdn.com/i/headshots/${profileLeague}/players/full/${profileId}.png`
    : null
  const playerImage = typeof matchedPlayer?.image === "object" ? matchedPlayer.image.default : null
  const headshotUrl = playerImage ?? derivedHeadshot
  if (
    headshotUrl?.startsWith("https://a.espncdn.com/")
    && profileUrl?.startsWith("https://www.espn.com/")
  ) {
    seeds.push({
      sourceName: "espn",
      sourcePageUrl: profileUrl,
      assetUrl: headshotUrl,
      mediaKind: "headshot",
    })
  }

  const actionSeeds = (payload.results ?? [])
    .filter((group) => group.type === "article")
    .flatMap((group) => group.contents ?? [])
    .flatMap((article) => {
      const sourcePageUrl = article.link?.web
      if (!sourcePageUrl?.startsWith("https://www.espn.com/")) return []
      return (article.images ?? []).flatMap((image) => {
        const identityText = [image.name, image.alt, image.caption, ...(image.peers ?? []).flatMap((peer) => [peer.name, peer.alt, peer.caption])]
          .filter(Boolean)
          .join(" ")
        if (!containsAthleteName(identityText, entry)) return []
        const selected = bestEspnImage(image)
        if (!selected?.url) return []
        return [{
          sourceName: "espn",
          sourcePageUrl,
          assetUrl: selected.url,
          mediaKind: "action" as const,
        }]
      })
    })

  const clipSeeds = (payload.results ?? [])
    .filter((group) => group.type === "clips")
    .flatMap((group) => group.contents ?? [])
    .flatMap((clip) => {
      const sourcePageUrl = clip.link?.web
      const assetUrl = typeof clip.image === "string" ? clip.image : clip.image?.default
      const identityText = [clip.displayName, clip.subtitle].filter(Boolean).join(" ")
      if (!sourcePageUrl?.startsWith("https://www.espn.com/")) return []
      if (!assetUrl?.startsWith("https://a.espncdn.com/")) return []
      if (!containsAthleteName(identityText, entry)) return []
      return [{
        sourceName: "espn",
        sourcePageUrl,
        assetUrl,
        mediaKind: "action" as const,
      }]
    })

  const seen = new Set(seeds.map((seed) => seed.assetUrl))
  for (const seed of [...actionSeeds, ...clipSeeds]) {
    if (seen.has(seed.assetUrl)) continue
    seen.add(seed.assetUrl)
    seeds.push(seed)
    if (seeds.filter((candidate) => candidate.mediaKind === "action").length >= maxActions) break
  }
  return seeds
}

export function extractBasketballReferencePlayerLink(
  html: string,
  entry: ShooterRosterEntry,
): { sourcePageUrl: string; playerSlug: string } | null {
  const links = html.matchAll(/<a[^>]+href=["'](\/(?:wnba\/)?players\/[a-z]\/([^"']+)\.html)["'][^>]*>([\s\S]*?)<\/a>/gi)
  for (const match of links) {
    const displayName = decodeHtmlEntities(stripHtml(match[3])).replace(/\s*\([^)]*\)\s*$/, "")
    if (canonicalizeName(displayName) !== entry.canonicalId) continue
    return {
      sourcePageUrl: `https://www.basketball-reference.com${match[1]}`,
      playerSlug: match[2],
    }
  }
  return null
}

export async function fetchBasketballReferenceMediaSeeds(
  entry: ShooterRosterEntry,
  metrics: Map<string, ProxyRequestMetrics>,
): Promise<DiscoveredMediaSeed[]> {
  const searchUrl = `https://www.basketball-reference.com/search/search.fcgi?search=${encodeURIComponent(entry.displayName)}`
  const response = await proxyFetch(searchUrl, {
    sourceName: "basketball-reference",
    timeoutMs: 25_000,
    maxBytes: 2_000_000,
    retries: 2,
    metrics,
  })
  const match = extractBasketballReferencePlayerLink(response.body.toString("utf8"), entry)
  if (!match) return []
  return [{
    sourceName: "basketball-reference",
    sourcePageUrl: match.sourcePageUrl,
    assetUrl: `https://www.basketball-reference.com/req/202106291/images/headshots/${match.playerSlug}.jpg`,
    mediaKind: "headshot",
  }]
}

export async function fetchResearchSourceEvidence(
  candidate: SourcePageCandidate,
  metrics: Map<string, ProxyRequestMetrics>,
  maxBytes: number,
): Promise<ResearchSourceEvidence> {
  const now = new Date().toISOString()
  const rejectionReasons = validatePublicHttpsUrl(candidate.sourcePageUrl)
  if (rejectionReasons.length > 0) {
    return {
      ...candidate,
      retrievedAt: now,
      statusCode: 0,
      byteLength: 0,
      contentHash: "",
      pageTitle: null,
      pageDescription: null,
      rejectionReasons,
    }
  }

  try {
    const response = await proxyFetch(candidate.sourcePageUrl, {
      sourceName: candidate.sourceName,
      timeoutMs: 20_000,
      maxBytes,
      retries: 2,
      metrics,
    })
    const html = response.body.toString("utf8")
    return {
      ...candidate,
      retrievedAt: now,
      statusCode: response.statusCode,
      byteLength: response.body.byteLength,
      contentHash: hashText(response.body.toString("base64")),
      pageTitle: extractTagContent(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
      pageDescription: extractTagContent(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i)
        ?? extractTagContent(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i),
      rejectionReasons: [],
    }
  } catch (error) {
    return {
      ...candidate,
      retrievedAt: now,
      statusCode: 0,
      byteLength: 0,
      contentHash: "",
      pageTitle: null,
      pageDescription: null,
      rejectionReasons: [sanitizeSecret(error)],
    }
  }
}
