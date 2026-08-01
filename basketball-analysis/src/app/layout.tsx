import type { Metadata } from "next"
import localFont from "next/font/local"
import { Russo_One } from "next/font/google"
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
// Wilson X Connect typography: Boxed carries UI/body text, Tungsten carries
// display caps and numerals. Files live in public/fonts/wilson-x (from the
// coach-ai-suite Wilson X asset pack).
const boxed = localFont({
  src: [
    { path: "../../public/fonts/wilson-x/boxedmedium.otf", weight: "400" },
    { path: "../../public/fonts/wilson-x/boxedsemibold.otf", weight: "600" },
    { path: "../../public/fonts/wilson-x/boxedheavy.otf", weight: "800" },
  ],
  variable: "--font-shotiq-inter",
  display: "swap",
})
const tungstenDisplay = localFont({
  src: [
    { path: "../../public/fonts/wilson-x/tungsten_bold.otf", weight: "400" },
    { path: "../../public/fonts/wilson-x/tungsten_black.otf", weight: "900" },
  ],
  variable: "--font-shotiq-display",
  display: "swap",
})
const tungstenNumeric = localFont({
  src: [
    { path: "../../public/fonts/wilson-x/tungsten_semibold.otf", weight: "400" },
    { path: "../../public/fonts/wilson-x/tungsten_bold.otf", weight: "700" },
  ],
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
      <body className={`${geistSans.variable} ${geistMono.variable} ${russoOne.variable} ${boxed.variable} ${tungstenDisplay.variable} ${tungstenNumeric.variable} antialiased min-h-screen flex flex-col bg-white`}>
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
