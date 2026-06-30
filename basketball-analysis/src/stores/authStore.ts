"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { useProfileStore } from "./profileStore"

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Get API base URL - always use relative URLs for same-origin requests
function getApiBaseUrl(): string {
  // Use relative URLs for all environments (web app serves its own API)
  return ''
}

// Fetch a CSRF token (double-submit pattern). Returns '' on failure so callers
// can still attempt the request; the server will reject if the token is invalid.
async function getCsrfToken(): Promise<string> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/auth/csrf`, {
      method: 'GET',
      credentials: 'include',
    })
    if (!res.ok) return ''
    const data = await res.json()
    return typeof data?.csrfToken === 'string' ? data.csrfToken : ''
  } catch {
    return ''
  }
}

// ==========================================
// TYPES
// ==========================================

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  displayName?: string
  avatarUrl?: string
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
          
          // Get API base URL (production API for desktop app)
          const apiBase = getApiBaseUrl()
          
          // Call API to create user
          const csrfToken = await getCsrfToken()
          const response = await fetch(`${apiBase}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
            credentials: 'include', // store the httpOnly auth-token cookie issued by the API
            body: JSON.stringify({ email, password, firstName, lastName }),
          })
          
          const data = await response.json()

          if (!response.ok) {
            set({ isLoading: false })
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
          
          // Get API base URL (local for development, production for built app)
          const apiBase = getApiBaseUrl()
          
          // Call API to authenticate
          const csrfToken = await getCsrfToken()
          const response = await fetch(`${apiBase}/api/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
            credentials: 'include', // store the httpOnly auth-token cookie issued by the API
            body: JSON.stringify({ email, password }),
          })
          
          const data = await response.json()

          if (!response.ok) {
            set({ isLoading: false })
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
        // Reset profile store
        try {
          useProfileStore.getState().resetProfile()
        } catch (e) {
          console.error("Failed to reset profile store on sign out:", e)
        }

        // Clear the httpOnly auth-token cookie server-side (cannot be cleared from JS).
        // Fire-and-forget so signOut stays synchronous for existing callers.
        try {
          getCsrfToken()
            .then((csrfToken) =>
              fetch(`${getApiBaseUrl()}/api/auth/signout`, {
                method: 'POST',
                headers: { 'x-csrf-token': csrfToken },
                credentials: 'include',
              })
            )
            .catch(() => {})
        } catch (e) {
          // ignore network/runtime errors on sign out
        }

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

