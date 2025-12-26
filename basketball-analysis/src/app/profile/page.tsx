"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/authStore"
import { useProfileStore } from "@/stores/profileStore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  User, 
  Ruler, 
  Weight, 
  Calendar, 
  Award, 
  Activity, 
  Hand, 
  Target,
  Edit,
  ArrowLeft,
  CheckCircle2
} from "lucide-react"
import { BasketballIcon } from "@/components/icons"

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const profile = useProfileStore()

  // Redirect to sign in if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push("/signin")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  const formatHeight = (inches: number | null) => {
    if (!inches) return "Not set"
    const feet = Math.floor(inches / 12)
    const remainingInches = inches % 12
    return `${feet}'${remainingInches}"`
  }

  const formatExperienceLevel = (level: string | null) => {
    if (!level) return "Not set"
    return level.charAt(0).toUpperCase() + level.slice(1)
  }

  const formatBodyType = (type: string | null) => {
    if (!type) return "Not set"
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  const formatDominantHand = (hand: string | null) => {
    if (!hand) return "Not set"
    return hand.charAt(0).toUpperCase() + hand.slice(1)
  }

  const formatShootingStyle = (style: string | null) => {
    if (!style) return "Not set"
    return style.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const formatCoachingTier = (tier: string | null) => {
    if (!tier) return "Not set"
    return tier.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0a0a0a] to-[#050505] py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="mb-4 text-[#888] hover:text-[#FF6B35]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-[#E5E5E5] mb-2 flex items-center gap-3">
                <BasketballIcon className="w-10 h-10 text-[#FF6B35]" />
                Player Profile
              </h1>
              <p className="text-[#888]">
                {user?.displayName || user?.email || "Your Profile Information"}
              </p>
            </div>
            
            {profile.profileComplete ? (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">Profile Complete</span>
              </div>
            ) : (
              <Button
                onClick={() => router.push("/onboarding")}
                className="bg-gradient-to-r from-[#FF6B35] to-[#FF4500] text-[#1a1a1a] hover:from-[#FF4500] hover:to-[#FF8C00]"
              >
                <Edit className="w-4 h-4 mr-2" />
                Complete Profile
              </Button>
            )}
          </div>
        </div>

        {/* Profile Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Physical Measurements */}
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader className="border-b border-[#2a2a2a]">
              <CardTitle className="text-[#E5E5E5] flex items-center gap-2">
                <Ruler className="w-5 h-5 text-[#FF6B35]" />
                Physical Measurements
              </CardTitle>
              <CardDescription className="text-[#888]">
                Your body measurements for analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[#888] flex items-center gap-2">
                  <Ruler className="w-4 h-4" />
                  Height
                </span>
                <span className="text-[#E5E5E5] font-semibold">
                  {formatHeight(profile.heightInches)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-[#888] flex items-center gap-2">
                  <Weight className="w-4 h-4" />
                  Weight
                </span>
                <span className="text-[#E5E5E5] font-semibold">
                  {profile.weightLbs ? `${profile.weightLbs} lbs` : "Not set"}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-[#888] flex items-center gap-2">
                  <Ruler className="w-4 h-4" />
                  Wingspan
                </span>
                <span className="text-[#E5E5E5] font-semibold">
                  {formatHeight(profile.wingspanInches)}
                </span>
              </div>
              
              {profile.bmi && (
                <div className="flex items-center justify-between pt-2 border-t border-[#2a2a2a]">
                  <span className="text-[#888]">BMI</span>
                  <span className="text-[#E5E5E5] font-semibold">{profile.bmi}</span>
                </div>
              )}
              
              {profile.wingspanToHeightRatio && (
                <div className="flex items-center justify-between pt-2 border-t border-[#2a2a2a]">
                  <span className="text-[#888]">Wingspan/Height Ratio</span>
                  <span className="text-[#E5E5E5] font-semibold">{profile.wingspanToHeightRatio}%</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Demographics & Experience */}
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader className="border-b border-[#2a2a2a]">
              <CardTitle className="text-[#E5E5E5] flex items-center gap-2">
                <User className="w-5 h-5 text-[#FF6B35]" />
                Demographics & Experience
              </CardTitle>
              <CardDescription className="text-[#888]">
                Your background and skill level
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[#888] flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Age
                </span>
                <span className="text-[#E5E5E5] font-semibold">
                  {profile.age ? `${profile.age} years old` : "Not set"}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-[#888] flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Experience Level
                </span>
                <span className="text-[#E5E5E5] font-semibold">
                  {formatExperienceLevel(profile.experienceLevel)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-[#888] flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Body Type
                </span>
                <span className="text-[#E5E5E5] font-semibold">
                  {formatBodyType(profile.bodyType)}
                </span>
              </div>
              
              {profile.coachingTier && (
                <div className="flex items-center justify-between pt-2 border-t border-[#2a2a2a]">
                  <span className="text-[#888]">Coaching Tier</span>
                  <span className="text-[#E5E5E5] font-semibold">
                    {formatCoachingTier(profile.coachingTier)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Athletic Profile */}
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader className="border-b border-[#2a2a2a]">
              <CardTitle className="text-[#E5E5E5] flex items-center gap-2">
                <Target className="w-5 h-5 text-[#FF6B35]" />
                Athletic Profile
              </CardTitle>
              <CardDescription className="text-[#888]">
                Your shooting preferences and abilities
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {profile.athleticAbility !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-[#888] flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Athletic Ability
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#E5E5E5] font-semibold">{profile.athleticAbility}/10</span>
                    <div className="w-24 h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF4500]"
                        style={{ width: `${(profile.athleticAbility / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-[#888] flex items-center gap-2">
                  <Hand className="w-4 h-4" />
                  Dominant Hand
                </span>
                <span className="text-[#E5E5E5] font-semibold">
                  {formatDominantHand(profile.dominantHand)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-[#888] flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Shooting Style
                </span>
                <span className="text-[#E5E5E5] font-semibold">
                  {formatShootingStyle(profile.shootingStyle)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Profile Status */}
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader className="border-b border-[#2a2a2a]">
              <CardTitle className="text-[#E5E5E5] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#FF6B35]" />
                Profile Status
              </CardTitle>
              <CardDescription className="text-[#888]">
                Your profile completion status
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[#888]">Completion Status</span>
                <span className={`font-semibold ${profile.profileComplete ? 'text-green-400' : 'text-orange-400'}`}>
                  {profile.profileComplete ? "Complete" : "Incomplete"}
                </span>
              </div>
              
              {profile.createdAt && (
                <div className="flex items-center justify-between pt-2 border-t border-[#2a2a2a]">
                  <span className="text-[#888]">Created</span>
                  <span className="text-[#E5E5E5] text-sm">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              {profile.updatedAt && (
                <div className="flex items-center justify-between pt-2 border-t border-[#2a2a2a]">
                  <span className="text-[#888]">Last Updated</span>
                  <span className="text-[#E5E5E5] text-sm">
                    {new Date(profile.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              {!profile.profileComplete && (
                <Button
                  onClick={() => router.push("/onboarding")}
                  className="w-full mt-4 bg-gradient-to-r from-[#FF6B35] to-[#FF4500] text-[#1a1a1a] hover:from-[#FF4500] hover:to-[#FF8C00]"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Complete Your Profile
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bio Section */}
        {(profile.bio || profile.enhancedBio) && (
          <Card className="bg-[#1a1a1a] border-[#2a2a2a] mb-6">
            <CardHeader className="border-b border-[#2a2a2a]">
              <CardTitle className="text-[#E5E5E5] flex items-center gap-2">
                <User className="w-5 h-5 text-[#FF6B35]" />
                Bio
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {profile.bio && (
                <div className="mb-4">
                  <p className="text-[#888] text-sm mb-2">Your Bio</p>
                  <p className="text-[#E5E5E5]">{profile.bio}</p>
                </div>
              )}
              {profile.enhancedBio && (
                <div>
                  <p className="text-[#888] text-sm mb-2">Enhanced Bio</p>
                  <p className="text-[#E5E5E5]">{profile.enhancedBio}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}        {/* Info Banner */}
        <Card className="bg-gradient-to-r from-[#FF6B35]/10 via-transparent to-[#FF6B35]/10 border-[#FF6B35]/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <BasketballIcon className="w-8 h-8 text-[#FF6B35] flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-[#E5E5E5] font-semibold mb-2">How Your Profile Helps</h3>
                <p className="text-[#888] text-sm">
                  Your profile information is automatically used when you upload images or videos for analysis. 
                  This helps us provide personalized feedback based on your height, experience level, and shooting style. 
                  Your measurements are compared against elite shooters with similar physical attributes to give you 
                  the most relevant coaching insights.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}