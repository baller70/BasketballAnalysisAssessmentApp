"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/authStore"
import { useProfileStore } from "@/stores/profileStore"
import { ProfileWizard } from "@/components/profile/ProfileWizard"

export default function OnboardingPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { completeProfile } = useProfileStore()

  useEffect(() => {
    // Redirect to sign in if not authenticated
    if (!isAuthenticated) {
      router.push("/signin")
    }
  }, [isAuthenticated, router])

  const handleComplete = async () => {
    // Mark profile as complete in the client cache first so saveProfile sends
    // profileComplete: true to the server (the source of truth).
    completeProfile()
    useAuthStore.getState().setProfileComplete(true)

    // Persist to Postgres via the CSRF-protected POST /api/profile. The owning
    // user is derived from the session cookie server-side — no userId is sent.
    const saved = await useProfileStore.getState().saveProfile()
    if (!saved) {
      console.error("Failed to save profile to server")
    }

    // Redirect to home page
    router.push("/")
  }

  if (!isAuthenticated) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0a0a0a] to-[#050505]">
      <ProfileWizard onComplete={handleComplete} />
    </div>
  )
}

