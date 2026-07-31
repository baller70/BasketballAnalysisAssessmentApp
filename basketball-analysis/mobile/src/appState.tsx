// App-level state machine: splash -> welcome/auth -> onboarding -> main.
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { api, APIUser } from './api'

type Phase = 'splash' | 'welcome' | 'main'
interface AppState {
  phase: Phase
  user: APIUser | null
  onboardingComplete: boolean
  boot: () => void
  signedIn: (u: APIUser) => void
  signOut: () => void
  finishOnboarding: () => void
}

const Ctx = createContext<AppState | null>(null)

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>('splash')
  const [user, setUser] = useState<APIUser | null>(null)
  const [onboardingComplete, setOnboardingComplete] = useState(false)

  const boot = useCallback(() => {
    api.hasSession().then((has) => setPhase(has ? 'main' : 'welcome')).catch(() => setPhase('welcome'))
  }, [])
  const signedIn = useCallback((u: APIUser) => {
    setUser(u); setOnboardingComplete(u.profileComplete ?? false); setPhase('main')
  }, [])
  const signOut = useCallback(() => { api.signOut(); setUser(null); setPhase('welcome') }, [])
  const finishOnboarding = useCallback(() => setOnboardingComplete(true), [])

  const value = useMemo(() => ({ phase, user, onboardingComplete, boot, signedIn, signOut, finishOnboarding }),
    [phase, user, onboardingComplete, boot, signedIn, signOut, finishOnboarding])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp(): AppState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp outside provider')
  return v
}
