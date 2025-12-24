import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Types for request body
interface ProfileData {
  userId?: string
  heightInches: number | null
  weightLbs: number | null
  wingspanInches: number | null
  age: number | null
  experienceLevel: string | null
  bodyType: string | null
  athleticAbility: number | null
  dominantHand: string | null
  shootingStyle: string | null
  bio: string | null
  enhancedBio: string | null
  coachingTier: string | null
  wingspanToHeightRatio: number | null
  bmi: number | null
  profileComplete: boolean
}

// POST - Create or update profile
export async function POST(request: NextRequest) {
  try {
    const data: ProfileData = await request.json()
    
    // If userId is provided, check if profile exists
    if (data.userId) {
      const existingProfile = await prisma.userProfile.findUnique({
        where: { userId: data.userId },
      })
      
      if (existingProfile) {
        // Update existing profile
        const profile = await prisma.userProfile.update({
          where: { userId: data.userId },
          data: {
            heightInches: data.heightInches,
            weightLbs: data.weightLbs,
            wingspanInches: data.wingspanInches,
            age: data.age,
            experienceLevel: data.experienceLevel,
            bodyType: data.bodyType,
            athleticAbility: data.athleticAbility,
            dominantHand: data.dominantHand,
            shootingStyle: data.shootingStyle,
            bio: data.bio,
            enhancedBio: data.enhancedBio,
            coachingTier: data.coachingTier,
            wingspanToHeightRatio: data.wingspanToHeightRatio,
            bmi: data.bmi,
            profileComplete: data.profileComplete ?? false,
          },
        })
        
        return NextResponse.json({
          success: true,
          profile,
        })
      }
    }
    
    // Create new user profile
    const profile = await prisma.userProfile.create({
      data: {
        userId: data.userId || null,
        heightInches: data.heightInches,
        weightLbs: data.weightLbs,
        wingspanInches: data.wingspanInches,
        age: data.age,
        experienceLevel: data.experienceLevel,
        bodyType: data.bodyType,
        athleticAbility: data.athleticAbility,
        dominantHand: data.dominantHand,
        shootingStyle: data.shootingStyle,
        bio: data.bio,
        enhancedBio: data.enhancedBio,
        coachingTier: data.coachingTier,
        wingspanToHeightRatio: data.wingspanToHeightRatio,
        bmi: data.bmi,
        profileComplete: data.profileComplete ?? false,
      },
    })
    
    return NextResponse.json({
      success: true,
      profile,
    })
  } catch (error) {
    console.error("Error creating/updating profile:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create/update profile" },
      { status: 500 }
    )
  }
}

// PUT - Update existing profile
export async function PUT(request: NextRequest) {
  try {
    const { id, ...data }: ProfileData & { id: string } = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Profile ID is required" },
        { status: 400 }
      )
    }
    
    // Update profile
    const profile = await prisma.userProfile.update({
      where: { id },
      data: {
        heightInches: data.heightInches,
        weightLbs: data.weightLbs,
        wingspanInches: data.wingspanInches,
        age: data.age,
        experienceLevel: data.experienceLevel,
        bodyType: data.bodyType,
        coachingTier: data.coachingTier,
        wingspanToHeightRatio: data.wingspanToHeightRatio,
        bmi: data.bmi,
        profileComplete: data.profileComplete ?? false,
      },
    })
    
    return NextResponse.json({
      success: true,
      profile,
    })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    )
  }
}

// GET - Retrieve profile by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Profile ID is required" },
        { status: 400 }
      )
    }
    
    const profile = await prisma.userProfile.findUnique({
      where: { id },
      include: {
        analyses: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    })
    
    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      profile,
    })
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}







