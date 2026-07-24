import {
  MEDIA_CANDIDATES_PATH,
  STAGING_PATH,
  loadRoster,
  readJsonFile,
  validateMediaCandidates,
  validateRoster,
  validateStagingDataset,
  type MediaCandidate,
  type ShooterStagingDataset,
  type ValidationIssue,
} from "@/lib/shooterResearch"

function printIssues(issues: ValidationIssue[]) {
  for (const issue of issues) {
    const prefix = issue.canonicalId ? `${issue.canonicalId} ` : ""
    console.log(`${issue.level.toUpperCase()} ${issue.code}: ${prefix}${issue.message}`)
  }
}

async function main() {
  const roster = await loadRoster()
  const mediaCandidates = await readJsonFile<MediaCandidate[]>(MEDIA_CANDIDATES_PATH, [])
  const staging = await readJsonFile<ShooterStagingDataset>(STAGING_PATH, {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    athletes: [],
  })
  const issues = [...validateRoster(roster), ...validateStagingDataset(staging), ...validateMediaCandidates(mediaCandidates)]
  printIssues(issues)

  const errors = issues.filter((issue) => issue.level === "error")
  console.log(`Validated ${roster.length} roster entries, ${staging.athletes.length} staged athletes, and ${mediaCandidates.length} media candidates`)
  console.log(`Errors: ${errors.length}`)
  console.log(`Warnings: ${issues.length - errors.length}`)
  if (errors.length > 0) process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
