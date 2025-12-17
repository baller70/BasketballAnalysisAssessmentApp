import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

/**
 * Professional Shooter Database Seed
 * 
 * Seeds the database with professional shooter biomechanics data
 * for form comparison features.
 */

// Professional shooter data
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
      releaseHeight: 122, // 10'2" in inches
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
  {
    name: "Ray Allen",
    position: "Guard",
    heightInches: 77,
    weightLbs: 205,
    wingspanInches: 81,
    bodyType: "mesomorph",
    dominantHand: "Right",
    shootingStyle: "Two-motion",
    era: "Modern",
    skillLevel: "Professional",
    careerFgPercentage: 45.2,
    career3ptPercentage: 40.0,
    careerFtPercentage: 89.4,
    biomechanics: {
      elbowAngle: 91,
      kneeAngle: 118,
      shoulderAngle: 2,
      hipAngle: 170,
      releaseHeight: 126,
      shotArc: 47,
      setPoint: "High forehead",
      releaseTime: 0.42,
    },
    strengths: [
      "All-time greatest corner three shooter",
      "Elite footwork into shot",
      "Perfect mechanics",
    ],
  },
  {
    name: "Kevin Durant",
    position: "Forward",
    heightInches: 83,
    weightLbs: 240,
    wingspanInches: 89,
    bodyType: "ectomorph",
    dominantHand: "Right",
    shootingStyle: "One-motion",
    era: "Modern",
    skillLevel: "Professional",
    careerFgPercentage: 50.0,
    career3ptPercentage: 38.6,
    careerFtPercentage: 88.4,
    biomechanics: {
      elbowAngle: 88,
      kneeAngle: 130,
      shoulderAngle: 5,
      hipAngle: 172,
      releaseHeight: 138,
      shotArc: 50,
      setPoint: "Above head due to height",
      releaseTime: 0.45,
    },
    strengths: [
      "Unblockable release point",
      "Elite mid-range scorer",
      "Versatile from all levels",
    ],
  },
  {
    name: "Damian Lillard",
    position: "Guard",
    heightInches: 74,
    weightLbs: 195,
    wingspanInches: 78,
    bodyType: "mesomorph",
    dominantHand: "Right",
    shootingStyle: "One-motion",
    era: "Modern",
    skillLevel: "Professional",
    careerFgPercentage: 44.0,
    career3ptPercentage: 37.2,
    careerFtPercentage: 89.5,
    biomechanics: {
      elbowAngle: 93,
      kneeAngle: 122,
      shoulderAngle: 4,
      hipAngle: 166,
      releaseHeight: 120,
      shotArc: 49,
      setPoint: "Above forehead",
      releaseTime: 0.35,
    },
    strengths: [
      "Logo-range three-pointer",
      "Clutch playoff performer",
      "Elite pull-up shooter",
    ],
  },
  {
    name: "Diana Taurasi",
    position: "Guard",
    heightInches: 72,
    weightLbs: 163,
    wingspanInches: 74,
    bodyType: "mesomorph",
    dominantHand: "Right",
    shootingStyle: "One-motion",
    era: "Modern",
    skillLevel: "Professional",
    careerFgPercentage: 43.0,
    career3ptPercentage: 36.2,
    careerFtPercentage: 87.5,
    biomechanics: {
      elbowAngle: 91,
      kneeAngle: 120,
      shoulderAngle: 3,
      hipAngle: 165,
      releaseHeight: 114,
      shotArc: 46,
      setPoint: "Forehead level",
      releaseTime: 0.38,
    },
    strengths: [
      "WNBA all-time leading scorer",
      "Elite shot creation",
      "Clutch performer",
    ],
  },
  {
    name: "Sabrina Ionescu",
    position: "Guard",
    heightInches: 71,
    weightLbs: 165,
    wingspanInches: 73,
    bodyType: "mesomorph",
    dominantHand: "Right",
    shootingStyle: "One-motion",
    era: "Modern",
    skillLevel: "Professional",
    careerFgPercentage: 43.5,
    career3ptPercentage: 38.0,
    careerFtPercentage: 89.0,
    biomechanics: {
      elbowAngle: 92,
      kneeAngle: 118,
      shoulderAngle: 2,
      hipAngle: 164,
      releaseHeight: 112,
      shotArc: 48,
      setPoint: "High forehead",
      releaseTime: 0.36,
    },
    strengths: [
      "Complete offensive player",
      "Deep shooting range",
      "High basketball IQ",
    ],
  },
  {
    name: "Dirk Nowitzki",
    position: "Forward",
    heightInches: 84,
    weightLbs: 245,
    wingspanInches: 90,
    bodyType: "ectomorph",
    dominantHand: "Right",
    shootingStyle: "One-motion",
    era: "Modern",
    skillLevel: "Professional",
    careerFgPercentage: 47.1,
    career3ptPercentage: 38.0,
    careerFtPercentage: 87.9,
    biomechanics: {
      elbowAngle: 85,
      kneeAngle: 135,
      shoulderAngle: 8,
      hipAngle: 160,
      releaseHeight: 144,
      shotArc: 52,
      setPoint: "One-leg fadeaway",
      releaseTime: 0.5,
    },
    strengths: [
      "Invented the one-leg fadeaway",
      "Unguardable due to height",
      "Revolutionary big man shooting",
    ],
  },
  {
    name: "Reggie Miller",
    position: "Guard",
    heightInches: 79,
    weightLbs: 195,
    wingspanInches: 82,
    bodyType: "ectomorph",
    dominantHand: "Right",
    shootingStyle: "Two-motion",
    era: "Classic",
    skillLevel: "Professional",
    careerFgPercentage: 47.1,
    career3ptPercentage: 39.5,
    careerFtPercentage: 88.8,
    biomechanics: {
      elbowAngle: 90,
      kneeAngle: 122,
      shoulderAngle: 3,
      hipAngle: 168,
      releaseHeight: 130,
      shotArc: 47,
      setPoint: "Forehead level",
      releaseTime: 0.4,
    },
    strengths: [
      "Master of off-screen movement",
      "Clutch playoff performer",
      "Elite mental toughness",
    ],
  },
  {
    name: "Devin Booker",
    position: "Guard",
    heightInches: 77,
    weightLbs: 206,
    wingspanInches: 80,
    bodyType: "mesomorph",
    dominantHand: "Right",
    shootingStyle: "Two-motion",
    era: "Modern",
    skillLevel: "Professional",
    careerFgPercentage: 46.0,
    career3ptPercentage: 36.0,
    careerFtPercentage: 86.8,
    biomechanics: {
      elbowAngle: 90,
      kneeAngle: 124,
      shoulderAngle: 2,
      hipAngle: 167,
      releaseHeight: 126,
      shotArc: 46,
      setPoint: "Forehead level",
      releaseTime: 0.4,
    },
    strengths: [
      "Elite mid-range scorer",
      "Smooth shooting stroke",
      "Great footwork",
    ],
  },
]

async function seed() {
  console.log("🏀 Seeding professional shooter database...")

  for (const shooter of PROFESSIONAL_SHOOTERS) {
    try {
      // Create or update shooter
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

      // Create or update biomechanics
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

      // Add strengths
      for (const strengthDesc of shooter.strengths) {
        await prisma.shootingStrength.upsert({
          where: {
            shooterId_description: {
              shooterId: createdShooter.id,
              description: strengthDesc,
            },
          },
          update: {},
          create: {
            shooterId: createdShooter.id,
            category: "form",
            description: strengthDesc,
          },
        })
      }

      console.log(`  ✅ ${shooter.name}`)
    } catch (error) {
      console.log(`  ⚠️ ${shooter.name} - Error: ${error instanceof Error ? error.message : "Unknown"}`)
    }
  }

  console.log("\n✨ Seeding complete!")
  
  // Print summary
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





