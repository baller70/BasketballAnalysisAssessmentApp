"use client"

import { PlayerLockInGame } from "@/components/analysis/LockInOrSave/PlayerLockInGame"

export default function TestPlayerPage() {
  return (
    <div className="min-h-screen bg-[#050505] py-8 px-4">
      <div className="max-w-lg mx-auto">
        <PlayerLockInGame />
      </div>
    </div>
  )
}




