import { PrismaClient } from "@prisma/client"
import { ALL_ELITE_SHOOTERS, type EliteShooter } from "../src/data/eliteShooters"

const prisma = new PrismaClient()

/**
 * Reference Shooter Database Seed
 * -------------------------------
 * Seeds the `Shooter` (+ `ShootingBiomechanics`, `ShootingStrength`,
 * `ShooterImage`) tables from the consolidated elite-shooter catalog
 * (src/data/eliteShooters.ts) — the single source of truth that /api/shooters
 * serves. This replaces the previous 12-row hand-written seed; the catalog now
 * carries the full roster (NBA / WNBA / NCAA / Top College).
 *
 * HONESTY: the catalog `measurements` are tier-derived ESTIMATES (genBio), not
 * frame-measured per shooter. They are seeded as reference values; /api/shooters
 * labels them biomechanicsEstimated=true. The schema has no per-row "estimated"
 * column (it is frozen), so the labeling lives in the API/UI, not the table.
 *
 * Admin-managed image rows (imageCategory "approved_form"/"excluded_form",
 * written by POST /api/shooters) are PRESERVED across re-seeds — only the
 * catalog-sourced "shooting_form" images are replaced.
 */

// Catalog Position enum -> schema position bucket (Guard/Forward/Center).
function mapPosition(position: EliteShooter["position"]): string {
  switch (position) {
    case "CENTER":
      return "Center"
    case "SMALL_FORWARD":
    case "POWER_FORWARD":
    case "FORWARD":
      return "Forward"
    default:
      return "Guard"
  }
}

// League -> coarse skill level the schema understands.
function mapSkillLevel(league: EliteShooter["league"]): string {
  if (league === "NBA" || league === "WNBA") return "Professional"
  return "College"
}

const clamp = (s: string | undefined, max: number): string | undefined =>
  s == null ? undefined : s.length > max ? s.slice(0, max) : s

async function seedShooter(cat: EliteShooter) {
  const m = cat.measurements

  const shooter = await prisma.shooter.upsert({
    where: { name: cat.name },
    update: {
      position: mapPosition(cat.position),
      heightInches: cat.height,
      weightLbs: cat.weight,
      wingspanInches: cat.wingspan,
      bodyType: clamp(cat.bodyType, 100),
      dominantHand: "Right",
      shootingStyle: clamp(cat.shootingStyle, 100),
      era: clamp(cat.era, 50),
      skillLevel: mapSkillLevel(cat.league),
      career3ptPercentage: cat.careerPct ?? null,
      careerFtPercentage: cat.careerFreeThrowPct ?? null,
      profileImageUrl: clamp(cat.photoUrl, 500),
      team: clamp(cat.team, 255),
      signature: cat.bio ?? cat.achievements ?? null,
    },
    create: {
      name: cat.name,
      position: mapPosition(cat.position),
      heightInches: cat.height,
      weightLbs: cat.weight,
      wingspanInches: cat.wingspan,
      bodyType: clamp(cat.bodyType, 100),
      dominantHand: "Right",
      shootingStyle: clamp(cat.shootingStyle, 100),
      era: clamp(cat.era, 50),
      skillLevel: mapSkillLevel(cat.league),
      career3ptPercentage: cat.careerPct ?? null,
      careerFtPercentage: cat.careerFreeThrowPct ?? null,
      profileImageUrl: clamp(cat.photoUrl, 500),
      team: clamp(cat.team, 255),
      signature: cat.bio ?? cat.achievements ?? null,
    },
  })

  // Biomechanics (tier-estimated reference values).
  await prisma.shootingBiomechanics.upsert({
    where: { shooterId: shooter.id },
    update: {
      elbowAngle: m.elbowAngle,
      shoulderAngle: m.shoulderAngle,
      hipAngle: m.hipAngle,
      kneeAngle: m.kneeAngle,
      ankleAngle: m.ankleAngle,
      releaseHeight: m.releaseHeight,
      releaseAngle: m.releaseAngle,
      entryAngle: m.entryAngle,
    },
    create: {
      shooterId: shooter.id,
      elbowAngle: m.elbowAngle,
      shoulderAngle: m.shoulderAngle,
      hipAngle: m.hipAngle,
      kneeAngle: m.kneeAngle,
      ankleAngle: m.ankleAngle,
      releaseHeight: m.releaseHeight,
      releaseAngle: m.releaseAngle,
      entryAngle: m.entryAngle,
    },
  })

  // Strengths from key traits (replace catalog-sourced set each run).
  await prisma.shootingStrength.deleteMany({ where: { shooterId: shooter.id } })
  for (const trait of cat.keyTraits ?? []) {
    await prisma.shootingStrength.create({
      data: { shooterId: shooter.id, strengthCategory: "form", description: trait },
    })
  }

  // Catalog form images — replace only the "shooting_form" rows so admin
  // approve/exclude rows survive re-seeds.
  await prisma.shooterImage.deleteMany({
    where: { shooterId: shooter.id, imageCategory: "shooting_form" },
  })
  const forms = cat.shootingFormImages ?? []
  for (let i = 0; i < forms.length; i++) {
    await prisma.shooterImage.create({
      data: {
        shooterId: shooter.id,
        imageUrl: clamp(forms[i], 500),
        imageCategory: "shooting_form",
        isPrimary: i === 0,
      },
    })
  }
}

async function seed() {
  console.log(`🏀 Seeding ${ALL_ELITE_SHOOTERS.length} reference shooters...`)

  let ok = 0
  for (const cat of ALL_ELITE_SHOOTERS) {
    try {
      await seedShooter(cat)
      ok++
    } catch (error) {
      console.log(
        `  ⚠️ ${cat.name} - ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  const shooterCount = await prisma.shooter.count()
  const biomechCount = await prisma.shootingBiomechanics.count()
  console.log(`\n✨ Seeding complete (${ok}/${ALL_ELITE_SHOOTERS.length} ok)`)
  console.log(`📊 Shooters: ${shooterCount} | Biomechanics: ${biomechCount}`)
}

seed()
  .catch((e) => {
    console.error("Seeding error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
