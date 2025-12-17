import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const PROFESSIONAL_SHOOTERS = [
  {
    name: "Stephen Curry",
    position: "Guard",
    heightInches: 74,
    weightLbs: 185,
    wingspanInches: 78,
    bodyType: "ectomorph",
    dominantHand: "Right",
    shootingStyle: "One-motion",
    era: "Modern",
    skillLevel: "Professional",
    careerFgPercentage: 47.3,
    career3ptPercentage: 42.8,
    careerFtPercentage: 91.1,
    biomechanics: {
      elbowAngle: 92,
      kneeAngle: 125,
      shoulderAngle: 3,
      hipAngle: 168,
      releaseHeight: 122,
      shotArc: 48,
      setPoint: "Above forehead",
      releaseTime: 0.3,
    },
    strengths: [
      "Quickest release in NBA history",
      "Deep three-point range (logo distance)",
      "Elite off-dribble shooting",
    ],
  },
  {
    name: "Klay Thompson",
    position: "Guard",
    heightInches: 78,
    weightLbs: 220,
    wingspanInches: 81,
    bodyType: "mesomorph",
    dominantHand: "Right",
    shootingStyle: "Two-motion",
    era: "Modern",
    skillLevel: "Professional",
    careerFgPercentage: 45.4,
    career3ptPercentage: 41.7,
    careerFtPercentage: 85.3,
    biomechanics: {
      elbowAngle: 90,
      kneeAngle: 120,
      shoulderAngle: 2,
      hipAngle: 165,
      releaseHeight: 130,
      shotArc: 46,
      setPoint: "Forehead level",
      releaseTime: 0.38,
    },
    strengths: [
      "Textbook shooting form",
      "Exceptional catch-and-shoot",
      "Masters off-screen movement",
    ],
  },
]

async function seed() {
  console.log("🏀 Seeding professional shooter database...")

  for (const shooter of PROFESSIONAL_SHOOTERS) {
    try {
      const createdShooter = await prisma.shooter.upsert({
        where: { name: shooter.name },
        update: {
          position: shooter.position,
          heightInches: shooter.heightInches,
          weightLbs: shooter.weightLbs,
          wingspanInches: shooter.wingspanInches,
          bodyType: shooter.bodyType,
          dominantHand: shooter.dominantHand,
          shootingStyle: shooter.shootingStyle,
          era: shooter.era,
          skillLevel: shooter.skillLevel,
          careerFgPercentage: shooter.careerFgPercentage,
          career3ptPercentage: shooter.career3ptPercentage,
          careerFtPercentage: shooter.careerFtPercentage,
        },
        create: {
          name: shooter.name,
          position: shooter.position,
          heightInches: shooter.heightInches,
          weightLbs: shooter.weightLbs,
          wingspanInches: shooter.wingspanInches,
          bodyType: shooter.bodyType,
          dominantHand: shooter.dominantHand,
          shootingStyle: shooter.shootingStyle,
          era: shooter.era,
          skillLevel: shooter.skillLevel,
          careerFgPercentage: shooter.careerFgPercentage,
          career3ptPercentage: shooter.career3ptPercentage,
          careerFtPercentage: shooter.careerFtPercentage,
        },
      })

      await prisma.shootingBiomechanics.upsert({
        where: { shooterId: createdShooter.id },
        update: {
          elbowAngle: shooter.biomechanics.elbowAngle,
          kneeAngle: shooter.biomechanics.kneeAngle,
          shoulderAngle: shooter.biomechanics.shoulderAngle,
          hipAngle: shooter.biomechanics.hipAngle,
          releaseHeight: shooter.biomechanics.releaseHeight,
          shotArc: shooter.biomechanics.shotArc,
          setPoint: shooter.biomechanics.setPoint,
          releaseTime: shooter.biomechanics.releaseTime,
        },
        create: {
          shooterId: createdShooter.id,
          elbowAngle: shooter.biomechanics.elbowAngle,
          kneeAngle: shooter.biomechanics.kneeAngle,
          shoulderAngle: shooter.biomechanics.shoulderAngle,
          hipAngle: shooter.biomechanics.hipAngle,
          releaseHeight: shooter.biomechanics.releaseHeight,
          shotArc: shooter.biomechanics.shotArc,
          setPoint: shooter.biomechanics.setPoint,
          releaseTime: shooter.biomechanics.releaseTime,
        },
      })

      for (const strengthDesc of shooter.strengths) {
        const existingStrength = await prisma.shootingStrength.findFirst({
          where: {
            shooterId: createdShooter.id,
            description: strengthDesc,
          },
        })
        
        if (!existingStrength) {
          await prisma.shootingStrength.create({
            data: {
              shooterId: createdShooter.id,
              strengthCategory: "form",
              description: strengthDesc,
            },
          })
        }
      }

      console.log(`  ✅ ${shooter.name}`)
    } catch (error) {
      console.log(`  ⚠️ ${shooter.name} - Error: ${error instanceof Error ? error.message : "Unknown"}`)
    }
  }

  console.log("\n✨ Seeding complete!")
  
  const shooterCount = await prisma.shooter.count()
  const biomechCount = await prisma.shootingBiomechanics.count()
  console.log(`\n📊 Database Summary:`)
  console.log(`   - Shooters: ${shooterCount}`)
  console.log(`   - Biomechanics records: ${biomechCount}`)
}

seed()
  .catch((e) => {
    console.error("Seeding error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
