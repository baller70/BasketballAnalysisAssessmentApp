import {
  atomicWriteJson,
  buildBalancedRoster,
  ensureResearchDir,
  ROSTER_PATH,
  MEDIA_CANDIDATES_PATH,
  STAGING_PATH,
  validateRoster,
  type ShooterStagingDataset,
} from "@/lib/shooterResearch"

async function main() {
  await ensureResearchDir()
  const roster = buildBalancedRoster()
  const issues = validateRoster(roster)
  await atomicWriteJson(ROSTER_PATH, roster)

  const staging: ShooterStagingDataset = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    athletes: [],
  }
  await atomicWriteJson(STAGING_PATH, staging)
  await atomicWriteJson(MEDIA_CANDIDATES_PATH, [])

  const errors = issues.filter((issue) => issue.level === "error")
  console.log(`Planned shooter roster: ${roster.length} athletes`)
  console.log(`Men: ${roster.filter((entry) => entry.category === "men").length}`)
  console.log(`Women: ${roster.filter((entry) => entry.category === "women").length}`)
  if (issues.length > 0) {
    for (const issue of issues) {
      console.log(`${issue.level.toUpperCase()} ${issue.code}: ${issue.message}`)
    }
  }
  if (errors.length > 0) process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
