"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

// ==========================================
// TYPES
// ==========================================

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  displayName?: string
  createdAt: string
  profileComplete: boolean
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Actions
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ success: boolean; error?: string; warning?: string }>
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; warning?: string }>
  signOut: () => void
  updateUser: (updates: Partial<User>) => void
  setProfileComplete: (complete: boolean) => void
}

// ==========================================
// INITIAL STATE
// ==========================================

const initialState: Omit<AuthState, 
  | "signUp" | "signIn" | "signOut" | "updateUser" | "setProfileComplete"
> = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
}

// ==========================================
// STORE
// ==========================================

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      signUp: async (email: string, password: string, firstName?: string, lastName?: string) => {
        try {
          set({ isLoading: true })
          
          // Call API to create user
          const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, firstName, lastName }),
          })
          
          const data = await response.json()
          
          // If database connection fails, use local storage fallback for development
          if (!response.ok && (data.error?.includes('Database connection') || data.error?.includes('503'))) {
            console.warn('Database unavailable, using local storage fallback for development')
            
            // Create user in local storage
            const userId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            const user: User = {
              id: userId,
              email,
              firstName: firstName || undefined,
              lastName: lastName || undefined,
              displayName: firstName && lastName 
                ? `${firstName} ${lastName}` 
                : firstName || lastName || email.split('@')[0],
              createdAt: new Date().toISOString(),
              profileComplete: false,
            }
            
            // Store in localStorage for persistence
            localStorage.setItem('dev_users', JSON.stringify({
              ...JSON.parse(localStorage.getItem('dev_users') || '{}'),
              [email]: { ...user, password: btoa(password) } // Simple encoding, not secure but for dev only
            }))
            
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            })
            
            return { success: true, warning: 'Using local storage (database unavailable)' }
          }
          
          if (!response.ok) {
            return { success: false, error: data.error || 'Sign up failed' }
          }
          
          // Set user in store
          const user: User = {
            id: data.user.id,
            email: data.user.email,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            displayName: data.user.displayName || `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0],
            createdAt: data.user.createdAt,
            profileComplete: false,
          }
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          })
          
          return { success: true }
        } catch (error) {
          console.error('Sign up error:', error)
          set({ isLoading: false })
          return { success: false, error: 'An unexpected error occurred' }
        }
      },
      
      signIn: async (email: string, password: string) => {
        try {
          set({ isLoading: true })
          
          // Call API to authenticate
          const response = await fetch('/api/auth/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })
          
          const data = await response.json()
          
          // If database connection fails, check local storage fallback
          if (!response.ok && (data.error?.includes('Database connection') || data.error?.includes('503'))) {
            console.warn('Database unavailable, checking local storage fallback')
            
            const devUsers = JSON.parse(localStorage.getItem('dev_users') || '{}')
            const devUser = devUsers[email]
            
            if (devUser && atob(devUser.password) === password) {
              const user: User = {
                id: devUser.id,
                email: devUser.email,
                firstName: devUser.firstName,
                lastName: devUser.lastName,
                displayName: devUser.displayName,
                createdAt: devUser.createdAt,
                profileComplete: devUser.profileComplete || false,
              }
              
              set({
                user,
                isAuthenticated: true,
                isLoading: false,
              })
              
              return { success: true, warning: 'Using local storage (database unavailable)' }
            }
            
            return { success: false, error: 'Invalid email or password' }
          }
          
          if (!response.ok) {
            return { success: false, error: data.error || 'Sign in failed' }
          }
          
          // Set user in store
          const user: User = {
            id: data.user.id,
            email: data.user.email,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            displayName: data.user.displayName,
            createdAt: data.user.createdAt,
            profileComplete: data.user.profileComplete || false,
          }
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          })
          
          return { success: true }
        } catch (error) {
          console.error('Sign in error:', error)
          set({ isLoading: false })
          return { success: false, error: 'An unexpected error occurred' }
        }
      },
      
      signOut: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },
      
      updateUser: (updates: Partial<User>) => {
        const { user } = get()
        if (user) {
          set({
            user: { ...user, ...updates },
          })
        }
      },
      
      setProfileComplete: (complete: boolean) => {
        const { user } = get()
        if (user) {
          set({
            user: { ...user, profileComplete: complete },
          })
        }
      },
    }),
    {
      name: "basketball-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

