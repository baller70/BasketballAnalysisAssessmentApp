"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

// ==========================================
// TYPES
// ==========================================

export type ExperienceLevel = "beginner" | "intermediate" | "advanced" | "professional"
export type BodyType = "ectomorph" | "mesomorph" | "endomorph"
export type CoachingTier = "elementary" | "middle_school" | "high_school" | "college" | "professional"
export type DominantHand = "right" | "left" | "ambidextrous"
export type ShootingStyle = "one_motion" | "two_motion" | "set_shot" | "jump_shot" | "not_sure"

export interface UserProfile {
  // Physical Measurements
  heightInches: number | null
  weightLbs: number | null
  wingspanInches: number | null
  
  // Demographics
  age: number | null
  
  // Experience & Body
  experienceLevel: ExperienceLevel | null
  bodyType: BodyType | null
  
  // Athletic Profile (NEW)
  athleticAbility: number | null  // 1-10 scale
  dominantHand: DominantHand | null
  shootingStyle: ShootingStyle | null
  
  // Bio (NEW)
  bio: string | null
  enhancedBio: string | null
  
  // Derived Values
  coachingTier: CoachingTier | null
  wingspanToHeightRatio: number | null
  bmi: number | null
  
  // Metadata
  profileComplete: boolean
  createdAt: string | null
  updatedAt: string | null
}

export interface ProfileState extends UserProfile {
  // Wizard State
  currentStep: number
  totalSteps: number
  
  // Actions
  setHeight: (inches: number) => void
  setWeight: (lbs: number) => void
  setWingspan: (inches: number) => void
  setAge: (age: number) => void
  setExperienceLevel: (level: ExperienceLevel) => void
  setBodyType: (type: BodyType) => void
  setAthleticAbility: (score: number) => void
  setDominantHand: (hand: DominantHand) => void
  setShootingStyle: (style: ShootingStyle) => void
  setBio: (bio: string) => void
  setEnhancedBio: (bio: string) => void
  
  // Navigation
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
  
  // Profile Management
  completeProfile: () => void
  resetProfile: () => void
  isStepComplete: (step: number) => boolean
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function calculateCoachingTier(age: number): CoachingTier {
  if (age >= 6 && age <= 11) return "elementary"
  if (age >= 12 && age <= 14) return "middle_school"
  if (age >= 15 && age <= 18) return "high_school"
  if (age >= 19 && age <= 22) return "college"
  return "professional"
}

function calculateBMI(heightInches: number, weightLbs: number): number {
  const heightMeters = heightInches * 0.0254
  const weightKg = weightLbs * 0.453592
  return parseFloat((weightKg / (heightMeters * heightMeters)).toFixed(1))
}

function calculateWingspanRatio(wingspanInches: number, heightInches: number): number {
  return parseFloat(((wingspanInches / heightInches) * 100).toFixed(1))
}

// ==========================================
// INITIAL STATE
// ==========================================

const initialState: Omit<ProfileState, 
  | "setHeight" | "setWeight" | "setWingspan" | "setAge" 
  | "setExperienceLevel" | "setBodyType" 
  | "setAthleticAbility" | "setDominantHand" | "setShootingStyle"
  | "setBio" | "setEnhancedBio"
  | "nextStep" | "prevStep" | "goToStep"
  | "completeProfile" | "resetProfile" | "isStepComplete"
> = {
  // Physical Measurements
  heightInches: null,
  weightLbs: null,
  wingspanInches: null,
  
  // Demographics
  age: null,
  
  // Experience & Body
  experienceLevel: null,
  bodyType: null,
  
  // Athletic Profile
  athleticAbility: null,
  dominantHand: null,
  shootingStyle: null,
  
  // Bio
  bio: null,
  enhancedBio: null,
  
  // Derived Values
  coachingTier: null,
  wingspanToHeightRatio: null,
  bmi: null,
  
  // Metadata
  profileComplete: false,
  createdAt: null,
  updatedAt: null,
  
  // Wizard State
  currentStep: 1,
  totalSteps: 9, // Updated from 6 to 9 cards
}

// ==========================================
// STORE
// ==========================================

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // ==========================================
      // SETTERS
      // ==========================================
      
      setHeight: (inches: number) => {
        const state = get()
        set({
          heightInches: inches,
          updatedAt: new Date().toISOString(),
          // Recalculate derived values if weight exists
          bmi: state.weightLbs ? calculateBMI(inches, state.weightLbs) : null,
          // Recalculate wingspan ratio if wingspan exists
          wingspanToHeightRatio: state.wingspanInches 
            ? calculateWingspanRatio(state.wingspanInches, inches)
            : null,
        })
      },
      
      setWeight: (lbs: number) => {
        const state = get()
        set({
          weightLbs: lbs,
          updatedAt: new Date().toISOString(),
          // Calculate BMI if height exists
          bmi: state.heightInches ? calculateBMI(state.heightInches, lbs) : null,
        })
      },
      
      setWingspan: (inches: number) => {
        const state = get()
        set({
          wingspanInches: inches,
          updatedAt: new Date().toISOString(),
          // Calculate ratio if height exists
          wingspanToHeightRatio: state.heightInches 
            ? calculateWingspanRatio(inches, state.heightInches)
            : null,
        })
      },
      
      setAge: (age: number) => {
        set({
          age,
          coachingTier: calculateCoachingTier(age),
          updatedAt: new Date().toISOString(),
        })
      },
      
      setExperienceLevel: (level: ExperienceLevel) => {
        set({
          experienceLevel: level,
          updatedAt: new Date().toISOString(),
        })
      },
      
      setBodyType: (type: BodyType) => {
        set({
          bodyType: type,
          updatedAt: new Date().toISOString(),
        })
      },
      
      setAthleticAbility: (score: number) => {
        set({
          athleticAbility: score,
          updatedAt: new Date().toISOString(),
        })
      },
      
      setDominantHand: (hand: DominantHand) => {
        set({
          dominantHand: hand,
          updatedAt: new Date().toISOString(),
        })
      },
      
      setShootingStyle: (style: ShootingStyle) => {
        set({
          shootingStyle: style,
          updatedAt: new Date().toISOString(),
        })
      },
      
      setBio: (bio: string) => {
        set({
          bio,
          updatedAt: new Date().toISOString(),
        })
      },
      
      setEnhancedBio: (bio: string) => {
        set({
          enhancedBio: bio,
          updatedAt: new Date().toISOString(),
        })
      },
      
      // ==========================================
      // NAVIGATION
      // ==========================================
      
      nextStep: () => {
        const { currentStep, totalSteps } = get()
        if (currentStep < totalSteps) {
          set({ currentStep: currentStep + 1 })
        }
      },
      
      prevStep: () => {
        const { currentStep } = get()
        if (currentStep > 1) {
          set({ currentStep: currentStep - 1 })
        }
      },
      
      goToStep: (step: number) => {
        const { totalSteps } = get()
        if (step >= 1 && step <= totalSteps) {
          set({ currentStep: step })
        }
      },
      
      // ==========================================
      // PROFILE MANAGEMENT
      // ==========================================
      
      completeProfile: () => {
        const state = get()
        const now = new Date().toISOString()
        
        set({
          profileComplete: true,
          createdAt: state.createdAt || now,
          updatedAt: now,
        })
      },
      
      resetProfile: () => {
        set({
          ...initialState,
          createdAt: null,
          updatedAt: null,
        })
      },
      
      isStepComplete: (step: number): boolean => {
        const state = get()
        
        switch (step) {
          case 1: return state.heightInches !== null
          case 2: return state.weightLbs !== null
          case 3: return state.wingspanInches !== null
          case 4: return state.age !== null
          case 5: return state.experienceLevel !== null
          case 6: return state.bodyType !== null
          case 7: return state.athleticAbility !== null
          case 8: return state.dominantHand !== null
          case 9: return state.shootingStyle !== null
          // Bio card (10) is optional, always complete
          case 10: return true
          default: return false
        }
      },
    }),
    {
      name: "basketball-user-profile",
      partialize: (state) => ({
        // Persist these fields
        heightInches: state.heightInches,
        weightLbs: state.weightLbs,
        wingspanInches: state.wingspanInches,
        age: state.age,
        experienceLevel: state.experienceLevel,
        bodyType: state.bodyType,
        athleticAbility: state.athleticAbility,
        dominantHand: state.dominantHand,
        shootingStyle: state.shootingStyle,
        bio: state.bio,
        enhancedBio: state.enhancedBio,
        coachingTier: state.coachingTier,
        wingspanToHeightRatio: state.wingspanToHeightRatio,
        bmi: state.bmi,
        profileComplete: state.profileComplete,
        createdAt: state.createdAt,
        updatedAt: state.updatedAt,
        currentStep: state.currentStep,
      }),
    }
  )
)

// ==========================================
// SELECTORS
// ==========================================

export const selectProfileSummary = (state: ProfileState) => ({
  height: state.heightInches,
  weight: state.weightLbs,
  wingspan: state.wingspanInches,
  age: state.age,
  experience: state.experienceLevel,
  bodyType: state.bodyType,
  tier: state.coachingTier,
  complete: state.profileComplete,
})

export const selectPhysicalMeasurements = (state: ProfileState) => ({
  heightInches: state.heightInches,
  weightLbs: state.weightLbs,
  wingspanInches: state.wingspanInches,
  bmi: state.bmi,
  wingspanToHeightRatio: state.wingspanToHeightRatio,
})

export const selectWizardProgress = (state: ProfileState) => ({
  currentStep: state.currentStep,
  totalSteps: state.totalSteps,
  percentComplete: Math.round((state.currentStep / state.totalSteps) * 100),
})


