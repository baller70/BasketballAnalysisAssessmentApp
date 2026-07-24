import { execFile } from "node:child_process"
import { promisify } from "node:util"
import sharp from "sharp"
import {
  assertProxyConfigured,
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
      if (width !== null && width < 1200) rejectionReasons.push("image_width_below_1200")
      if (height !== null && height < 800) rejectionReasons.push("image_height_below_800")
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
    const espn = path.match(/\/headshots\/(?:mens|womens)-college-basketball\/players\/full\/(\d+)\.png$/)
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
  if (provider?.sourceName === "espn") return `https://www.espn.com/mens-college-basketball/player/_/id/${provider.providerId}/${slug}`
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
