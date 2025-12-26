"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DashboardView = "professional" | "standard" | "basic"

interface DashboardViewState {
  view: DashboardView
  setView: (view: DashboardView) => void
}

export const useDashboardViewStore = create<DashboardViewState>()(
  persist(
    (set) => ({
      view: "professional",
      setView: (view) => set({ view }),
    }),
    {
      name: 'dashboard-view-storage',
    }
  )
)

