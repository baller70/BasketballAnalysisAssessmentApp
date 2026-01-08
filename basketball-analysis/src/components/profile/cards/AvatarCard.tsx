"use client"

import React, { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { ProfileCard } from "../ProfileCard"
import { Camera, Upload, Trash2, User } from "lucide-react"

interface AvatarCardProps {
  currentStep: number
  totalSteps: number
  onNext: () => void
  onBack: () => void
}

export function AvatarCard({
  currentStep,
  totalSteps,
  onNext,
  onBack,
}: AvatarCardProps) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Load existing avatar on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAvatar = localStorage.getItem('user_avatar')
      if (storedAvatar) {
        setAvatarPreview(storedAvatar)
      }
    }
  }, [])
  
  // Handle avatar file selection
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB')
        return
      }
      
      // Read and convert to base64
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        setAvatarPreview(base64)
        // Save to localStorage immediately
        localStorage.setItem('user_avatar', base64)
      }
      reader.readAsDataURL(file)
    }
  }
  
  // Remove avatar
  const handleRemoveAvatar = () => {
    setAvatarPreview(null)
    localStorage.removeItem('user_avatar')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  return (
    <ProfileCard
      title="Add a profile picture"
      subtitle="Optional - personalize your profile with a photo"
      educationalText="Your profile picture will appear in the app navigation and on your player profile. You can always change it later in Settings."
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={onNext}
      onBack={onBack}
      canProceed={true} // Avatar is optional
      helpText="Choose a clear photo of yourself. Square images work best. You can use a basketball action shot or a regular portrait."
      showHelp={showHelp}
      onToggleHelp={() => setShowHelp(!showHelp)}
      icon={<Camera className="w-8 h-8 text-[#FF6B35]" />}
    >
      <div className="flex flex-col items-center space-y-6">
        {/* Avatar Preview */}
        <div className="relative">
          <div className="w-36 h-36 rounded-full overflow-hidden bg-gradient-to-br from-[#FF6B35] to-[#FF4500] flex items-center justify-center shadow-xl shadow-[#FF6B35]/30 ring-4 ring-[#3a3a3a]">
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt="Profile"
                width={144}
                height={144}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-16 h-16 text-white/80" />
            )}
          </div>
          
          {/* Camera overlay button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-12 h-12 rounded-full bg-[#FF6B35] hover:bg-[#e55a2b] flex items-center justify-center shadow-lg transition-all hover:scale-110"
          >
            <Camera className="w-6 h-6 text-white" />
          </button>
        </div>
        
        {/* Upload Controls */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />
        
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#FF6B35] hover:bg-[#e55a2b] text-white rounded-xl font-semibold transition-all hover:scale-105 whitespace-nowrap"
          >
            <Upload className="w-5 h-5" />
            {avatarPreview ? 'Change' : 'Upload'}
          </button>
          
          {avatarPreview && (
            <button
              onClick={handleRemoveAvatar}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-semibold transition-all border border-red-500/30 whitespace-nowrap"
            >
              <Trash2 className="w-5 h-5" />
              Remove
            </button>
          )}
        </div>
        
        {/* Skip hint */}
        <p className="text-xs text-[#666] text-center">
          This step is optional. You can skip it and add a photo later in Settings.
        </p>
        
        {/* File info */}
        <div className="text-xs text-[#888] text-center space-y-1">
          <p>Supported formats: JPG, PNG, GIF, WebP</p>
          <p>Maximum file size: 5MB</p>
        </div>
      </div>
    </ProfileCard>
  )
}
