"use client"

/**
 * /upload/photo-access — canonical iOS screen 015-photo-library-permission.
 *
 * Reached from /upload: the phone flow's "Choose from library" opens this
 * primer before anything touches the platform picker, which is the point of a
 * pre-permission screen — the OS prompt can only be asked once, so the app
 * explains itself first. "Choose access" marks the primer seen and returns to
 * /upload with `?picker=1`, which opens the real file picker; "Not now" returns
 * without it.
 *
 * The primer is skipped on later visits (localStorage `shotiq-photo-primer-seen`),
 * exactly as the camera primer on /video-analysis behaves, so it never gets in
 * the way of a returning user — and the route stays directly reachable for
 * anyone who wants to re-read it.
 */

import React from "react"
import { useRouter } from "next/navigation"
import { PhotoAccessPrimer } from "@/components/shotiq/phone/PhotoAccessPrimer"

export default function PhotoAccessPage() {
  const router = useRouter()
  const done = (picker: boolean) => {
    try { localStorage.setItem("shotiq-photo-primer-seen", "1") } catch { /* private mode */ }
    router.push(picker ? "/upload?picker=1" : "/upload")
  }
  return (
    <PhotoAccessPrimer onChoose={() => done(true)} onNotNow={() => done(false)} />
  )
}
