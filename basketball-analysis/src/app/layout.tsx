import type { Metadata } from "next"
import localFont from "next/font/local"
import { Russo_One, Inter, Bebas_Neue, Oswald } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { UploadQueueManager } from "@/components/upload/UploadQueueManager"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
})
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
})
const russoOne = Russo_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-russo-one",
})

// ShotIQ canonical typefaces, from the sidecar designTokens.typography.
// `Inter` and `Bebas Neue` match the token families exactly.
//
// The `numeric` role specifies "DIN Condensed", a commercial Monotype face that
// is not redistributable and is not on Google Fonts. `Oswald` is used as a
// documented metric-similar substitute so numeric displays render in a
// condensed grotesque rather than silently falling back to the body face.
// Swapping in a licensed DIN Condensed only requires changing this binding.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-shotiq-inter",
  display: "swap",
})
const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-shotiq-display",
  display: "swap",
})
const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-shotiq-numeric",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Basketball Shooting Mechanics Analysis",
  description: "Advanced biomechanical analysis of basketball shooting form with AI-powered feedback and elite shooter comparison",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* Cache busting meta tags to prevent stale content */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        {/* Static version tag - only change this when deploying new versions */}
        <meta name="version" content="v-2024-12-19-stable" />
        {/* DISABLED: Cache clearing script was causing infinite reload loops */}
        {/* <Script src="/clear-cache.js" strategy="beforeInteractive" /> */}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${russoOne.variable} ${inter.variable} ${bebasNeue.variable} ${oswald.variable} antialiased min-h-screen flex flex-col bg-white`}>
        <Providers>
          {/* Every screen is canonical now — the app shell (unified sidebar +
              topbar) is painted per-page; no global legacy chrome. */}
          <main className="flex-1 bg-white">{children}</main>
          <UploadQueueManager />
        </Providers>
      </body>
    </html>
  )
}
