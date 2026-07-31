"use client"

import React from "react"
import { GuideCardGame } from "@/components/guide/GuideCardGame"
import { ShotIQShell } from "@/components/shotiq/ShotIQShell"

/** /guide — interactive how-to deck, presented inside the unified shell so the
 *  single app-wide sidebar stays the only navigation surface. */
export default function GuidePage() {
  return (
    <ShotIQShell active="Home">
      <div className="container mx-auto max-w-lg px-4 py-6">
        <GuideCardGame />
      </div>
    </ShotIQShell>
  )
}
