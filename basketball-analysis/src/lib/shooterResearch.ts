import { createHash } from "node:crypto"
import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"
import { ALL_ELITE_SHOOTERS, type EliteShooter } from "@/data/eliteShooters"

export type ShooterCategory = "men" | "women"
export type ResearchStatus = "pending" | "in_progress" | "completed" | "failed" | "skipped"
export type ReviewState = "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "REVIEW_REQUIRED"

export interface ShooterRosterEntry {
  canonicalId: string
  displayName: string
  aliases: string[]
  category: ShooterCategory
  competitionCategory: EliteShooter["league"]
  shooterTier: EliteShooter["tier"]
  dominantHand: null
  height: number | null
  weight: number | null
  wingspan: number | null
  armLength: null
  bodyBuild: EliteShooter["bodyType"] | null
  sourceCatalogId: number
}

export interface SourceCitation {
  url: string
  publisher: string
  retrievedAt: string
}

export interface PhysicalObservation {
  field: "height" | "weight" | "wingspan" | "armLength" | "dominantHand" | "bodyBuild"
  value: string | number | null
  source: SourceCitation
  confidence: number
  reviewState: ReviewState
}

export interface CareerSegment {
  competition: "NCAA" | "NBA" | "WNBA" | "EUROPE_PRO"
  team: string
  seasons: string
  games: number | null
  fgPct: number | null
  threePct: number | null
  ftPct: number | null
  threePointAttempts: number | null
  achievements: string[]
  source: SourceCitation
}

export interface ResearchSourceEvidence {
  sourceName: string
  sourcePageUrl: string
  retrievedAt: string
  statusCode: number
  byteLength: number
  contentHash: string
  pageTitle: string | null
  pageDescription: string | null
  evidenceType: "identity_profile" | "statistics_profile" | "media_source" | "search_results"
  rejectionReasons: string[]
}

export interface MediaCandidate {
  id: string
  canonicalId: string
  sourceName: string
  sourcePageUrl: string
  assetUrl: string
  retrievedAt: string
  width: number | null
  height: number | null
  byteLength: number | null
  contentHash: string | null
  photographer: string | null
  licenseName: string | null
  licenseUrl: string | null
  attributionRequired: string | null
  mediaKind: "headshot" | "action" | "unknown"
  shotPhase: "setup" | "dip" | "set_point" | "release" | "follow_through" | "unknown"
  cameraView: "front" | "side" | "three_quarter" | "unknown"
  identityReview: ReviewState
  formQualityReview: ReviewState
  rightsReview: ReviewState
  rejectionReasons: string[]
}

export interface AthleteStagingProfile {
  canonicalId: string
  displayName: string
  aliases: string[]
  category: ShooterCategory
  status: ResearchStatus
  externalProviderIds: Record<string, string>
  physicalObservations: PhysicalObservation[]
  careerSegments: CareerSegment[]
  researchSources: ResearchSourceEvidence[]
  mediaCandidates: MediaCandidate[]
  errors: string[]
  updatedAt: string
}

export interface ShooterStagingDataset {
  schemaVersion: 1
  generatedAt: string
  athletes: AthleteStagingProfile[]
}

export interface ValidationIssue {
  level: "error" | "warning"
  code: string
  message: string
  canonicalId?: string
}

export interface MediaPruneResult {
  candidates: MediaCandidate[]
  removedIds: string[]
  crossPlayerDuplicateHashes: string[]
}

export const SHOOTER_RESEARCH_DIR = path.join(process.cwd(), "data", "shooter-research")
export const ROSTER_PATH = path.join(SHOOTER_RESEARCH_DIR, "candidate-roster.json")
export const STAGING_PATH = path.join(SHOOTER_RESEARCH_DIR, "staging.json")
export const MEDIA_CANDIDATES_PATH = path.join(SHOOTER_RESEARCH_DIR, "media-candidates.json")
export const CHECKPOINT_PATH = path.join(SHOOTER_RESEARCH_DIR, "collection-checkpoint.json")
export const REPORT_PATH = path.join(SHOOTER_RESEARCH_DIR, "collection-report.json")

const APPROVED_SOURCE_HOSTS = new Set([
  "cdn.nba.com",
  "www.nba.com",
  "stats.nba.com",
  "ak-static.cms.nba.com",
  "www.wnba.com",
  "wnba.com",
  "a.espncdn.com",
  "www.espn.com",
  "site.web.api.espn.com",
  "upload.wikimedia.org",
  "commons.wikimedia.org",
  "www.ncaa.com",
  "ncaa.com",
  "www.fiba.basketball",
  "fiba.basketball",
  "www.euroleaguebasketball.net",
  "euroleaguebasketball.net",
  "www.eurobasket.com",
  "eurobasket.com",
  "www.basketball-reference.com",
  "api.ipify.org",
])

export function canonicalizeName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function hashText(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

export function sanitizeSecret(value: unknown): string {
  const text = value instanceof Error ? value.stack || value.message : String(value ?? "")
  const proxy = process.env.IPROYAL_PROXY_URL
  if (!proxy) return text

  try {
    const parsed = new URL(proxy)
    const redactedUrl = `${parsed.protocol}//<redacted>@${parsed.host}`
    return text
      .replaceAll(proxy, redactedUrl)
      .replaceAll(parsed.username, "<redacted-user>")
      .replaceAll(parsed.password, "<redacted-pass>")
  } catch {
    return text.replaceAll(proxy, "<redacted-proxy-url>")
  }
}

export function assertProxyConfigured(): string {
  const proxyUrl = process.env.IPROYAL_PROXY_URL
  if (!proxyUrl) {
    throw new Error("IPROYAL_PROXY_URL is required. Refusing to use direct network access.")
  }
  try {
    const parsed = new URL(proxyUrl)
    if (!/^https?:$/.test(parsed.protocol) || !parsed.username || !parsed.password || !parsed.hostname || !parsed.port) {
      throw new Error("Invalid proxy URL")
    }
  } catch {
    throw new Error("IPROYAL_PROXY_URL must use http://USERNAME:PASSWORD@HOST:PORT format.")
  }
  return proxyUrl
}

export function isPrivateOrLiteralHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (host === "localhost" || host.endsWith(".local")) return true
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true
  if (host === "::1" || /^\[[0-9a-f:]+\]$/i.test(host)) return true
  return false
}

export function validatePublicHttpsUrl(rawUrl: string): string[] {
  const issues: string[] = []
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return ["invalid_url"]
  }
  if (parsed.protocol !== "https:") issues.push("url_must_be_https")
  if (isPrivateOrLiteralHost(parsed.hostname)) issues.push("private_or_literal_host")
  if (!APPROVED_SOURCE_HOSTS.has(parsed.hostname.toLowerCase())) issues.push("unapproved_source_host")
  return issues
}

function createRosterEntryFactory() {
  const seen = new Set<string>()
  return (shooter: EliteShooter): ShooterRosterEntry | null => {
    const canonicalId = canonicalizeName(shooter.name)
    if (seen.has(canonicalId)) return null
    seen.add(canonicalId)
    const category: ShooterCategory =
      shooter.league === "WNBA" || shooter.league === "NCAA_WOMEN" || shooter.league === "TOP_COLLEGE" ? "women" : "men"
    return {
      canonicalId,
      displayName: shooter.name,
      aliases: [],
      category,
      competitionCategory: shooter.league,
      shooterTier: shooter.tier,
      dominantHand: null,
      height: shooter.height ?? null,
      weight: shooter.weight ?? null,
      wingspan: shooter.wingspan ?? null,
      armLength: null,
      bodyBuild: shooter.bodyType ?? null,
      sourceCatalogId: shooter.id,
    }
  }
}

export function buildCompleteRoster(): ShooterRosterEntry[] {
  const toEntry = createRosterEntryFactory()
  return ALL_ELITE_SHOOTERS
    .map(toEntry)
    .filter((entry): entry is ShooterRosterEntry => Boolean(entry))
}

export function buildBalancedRoster(): ShooterRosterEntry[] {
  const toEntry = createRosterEntryFactory()

  const priorityWomen = ["Diana Taurasi", "Caitlin Clark", "Sabrina Ionescu"]
  const priorityMen = ["Allan Houston", "Stephen Curry", "Ray Allen", "Klay Thompson", "Reggie Miller"]

  const sortPriority = (priorityNames: string[]) => (a: EliteShooter, b: EliteShooter) => {
    const ai = priorityNames.indexOf(a.name)
    const bi = priorityNames.indexOf(b.name)
    if (ai >= 0 || bi >= 0) return (ai >= 0 ? ai : 999) - (bi >= 0 ? bi : 999)
    return a.id - b.id
  }

  const women = ALL_ELITE_SHOOTERS
    .filter((shooter) => shooter.league === "WNBA" || shooter.league === "NCAA_WOMEN" || shooter.league === "TOP_COLLEGE")
    .sort(sortPriority(priorityWomen))
    .map(toEntry)
    .filter((entry): entry is ShooterRosterEntry => Boolean(entry))
    .slice(0, 53)

  const men = ALL_ELITE_SHOOTERS
    .filter((shooter) => shooter.league === "NCAA_MEN")
    .concat(ALL_ELITE_SHOOTERS.filter((shooter) => shooter.league === "NBA"))
    .sort(sortPriority(priorityMen))
    .map(toEntry)
    .filter((entry): entry is ShooterRosterEntry => Boolean(entry))
    .slice(0, 53)

  return [...men, ...women]
}

export async function ensureResearchDir(): Promise<void> {
  await mkdir(SHOOTER_RESEARCH_DIR, { recursive: true })
}

export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as T
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return fallback
    throw error
  }
}

export async function atomicWriteJson(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
  const tempPath = `${filePath}.${process.pid}.tmp`
  await writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`)
  await rename(tempPath, filePath)
}

export async function loadRoster(): Promise<ShooterRosterEntry[]> {
  return readJsonFile<ShooterRosterEntry[]>(ROSTER_PATH, [])
}

export async function loadStaging(): Promise<ShooterStagingDataset> {
  return readJsonFile<ShooterStagingDataset>(STAGING_PATH, {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    athletes: [],
  })
}

export function createEmptyProfile(entry: ShooterRosterEntry): AthleteStagingProfile {
  return {
    canonicalId: entry.canonicalId,
    displayName: entry.displayName,
    aliases: entry.aliases,
    category: entry.category,
    status: "pending",
    externalProviderIds: {},
    physicalObservations: [],
    careerSegments: [],
    researchSources: [],
    mediaCandidates: [],
    errors: [],
    updatedAt: new Date().toISOString(),
  }
}

export function validateRoster(roster: ShooterRosterEntry[], expectedShape: "balanced" | "complete" = "balanced"): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const names = new Map<string, string>()
  const ids = new Set<string>()
  let men = 0
  let women = 0

  for (const entry of roster) {
    if (ids.has(entry.canonicalId)) {
      issues.push({ level: "error", code: "duplicate_canonical_id", message: `Duplicate canonical ID ${entry.canonicalId}`, canonicalId: entry.canonicalId })
    }
    ids.add(entry.canonicalId)
    const normalizedName = canonicalizeName(entry.displayName)
    const existing = names.get(normalizedName)
    if (existing) {
      issues.push({ level: "error", code: "duplicate_display_name", message: `${entry.displayName} duplicates ${existing}`, canonicalId: entry.canonicalId })
    }
    names.set(normalizedName, entry.canonicalId)
    if (entry.category === "men") men += 1
    if (entry.category === "women") women += 1
  }

  if (expectedShape === "balanced" && roster.length !== 106) {
    issues.push({ level: "error", code: "invalid_roster_size", message: `Expected 106 roster entries, found ${roster.length}` })
  }
  if (expectedShape === "balanced" && (men !== 53 || women !== 53)) {
    issues.push({ level: "error", code: "invalid_roster_balance", message: `Expected 53 men and 53 women, found ${men} men and ${women} women` })
  }
  if (expectedShape === "complete" && roster.length !== ALL_ELITE_SHOOTERS.length) {
    issues.push({
      level: "error",
      code: "incomplete_catalog_roster",
      message: `Expected ${ALL_ELITE_SHOOTERS.length} unique roster entries, found ${roster.length}`,
    })
  }
  return issues
}

export function validateMediaCandidates(candidates: MediaCandidate[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const hashes = new Map<string, string>()

  for (const candidate of candidates) {
    for (const reason of validatePublicHttpsUrl(candidate.sourcePageUrl)) {
      issues.push({ level: "error", code: `source_${reason}`, message: `${candidate.sourcePageUrl}: ${reason}`, canonicalId: candidate.canonicalId })
    }
    for (const reason of validatePublicHttpsUrl(candidate.assetUrl)) {
      issues.push({ level: "error", code: `asset_${reason}`, message: `${candidate.assetUrl}: ${reason}`, canonicalId: candidate.canonicalId })
    }
    const minimumWidth = candidate.mediaKind === "headshot" ? 300 : 1200
    const minimumHeight = candidate.mediaKind === "headshot" ? 250 : 800
    if (candidate.width !== null && candidate.height !== null && (candidate.width < minimumWidth || candidate.height < minimumHeight)) {
      issues.push({
        level: "warning",
        code: "image_below_minimum_dimensions",
        message: `${candidate.assetUrl} is ${candidate.width}x${candidate.height}; expected at least ${minimumWidth}x${minimumHeight}`,
        canonicalId: candidate.canonicalId,
      })
    }
    if (candidate.contentHash) {
      const existing = hashes.get(candidate.contentHash)
      if (existing) {
        issues.push({ level: "error", code: "duplicate_image_hash", message: `${candidate.id} duplicates ${existing}`, canonicalId: candidate.canonicalId })
      }
      hashes.set(candidate.contentHash, candidate.id)
    }
    if (candidate.identityReview !== "PENDING_REVIEW" || candidate.formQualityReview !== "PENDING_REVIEW" || candidate.rightsReview !== "PENDING_REVIEW") {
      issues.push({ level: "warning", code: "candidate_not_pending_review", message: `${candidate.id} has non-pending review state`, canonicalId: candidate.canonicalId })
    }
  }

  return issues
}

export function pruneInvalidMediaCandidates(candidates: MediaCandidate[]): MediaPruneResult {
  const removedIds = new Set<string>()
  const byHash = new Map<string, MediaCandidate[]>()

  for (const candidate of candidates) {
    if (!candidate.contentHash || !candidate.width || !candidate.height) {
      removedIds.add(candidate.id)
      continue
    }
    const matching = byHash.get(candidate.contentHash) ?? []
    matching.push(candidate)
    byHash.set(candidate.contentHash, matching)
  }

  const crossPlayerDuplicateHashes: string[] = []
  for (const [contentHash, matching] of byHash) {
    const athleteIds = new Set(matching.map((candidate) => candidate.canonicalId))
    if (athleteIds.size > 1) {
      crossPlayerDuplicateHashes.push(contentHash)
      for (const candidate of matching) removedIds.add(candidate.id)
      continue
    }
    if (matching.length > 1) {
      const keep = [...matching].sort((a, b) => {
        const rejectionDifference = a.rejectionReasons.length - b.rejectionReasons.length
        if (rejectionDifference !== 0) return rejectionDifference
        return (b.width ?? 0) * (b.height ?? 0) - (a.width ?? 0) * (a.height ?? 0)
      })[0]
      for (const candidate of matching) {
        if (candidate.id !== keep.id) removedIds.add(candidate.id)
      }
    }
  }

  return {
    candidates: candidates.filter((candidate) => !removedIds.has(candidate.id)),
    removedIds: [...removedIds],
    crossPlayerDuplicateHashes,
  }
}

export function validateStagingDataset(dataset: ShooterStagingDataset): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const providerIds = new Map<string, string>()
  const canonicalIds = new Set<string>()

  for (const athlete of dataset.athletes) {
    if (canonicalIds.has(athlete.canonicalId)) {
      issues.push({ level: "error", code: "duplicate_staging_athlete", message: `Duplicate staged athlete ${athlete.canonicalId}`, canonicalId: athlete.canonicalId })
    }
    canonicalIds.add(athlete.canonicalId)

    for (const [provider, providerId] of Object.entries(athlete.externalProviderIds ?? {})) {
      const key = `${provider}:${providerId}`
      const existing = providerIds.get(key)
      if (existing && existing !== athlete.canonicalId) {
        issues.push({
          level: "error",
          code: "duplicate_provider_id",
          message: `${key} is assigned to ${existing} and ${athlete.canonicalId}`,
          canonicalId: athlete.canonicalId,
        })
      }
      providerIds.set(key, athlete.canonicalId)
    }

    for (const source of athlete.researchSources ?? []) {
      for (const reason of validatePublicHttpsUrl(source.sourcePageUrl)) {
        issues.push({ level: "error", code: `research_source_${reason}`, message: `${source.sourcePageUrl}: ${reason}`, canonicalId: athlete.canonicalId })
      }
    }
  }

  return issues
}
