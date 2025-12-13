"use client"

import { ProfileWizard } from "@/components/profile"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const router = useRouter()
  
  const handleComplete = () => {
    // After profile completion, redirect to home or analysis page
    router.push("/")
  }
  
  return <ProfileWizard onComplete={handleComplete} />
}


