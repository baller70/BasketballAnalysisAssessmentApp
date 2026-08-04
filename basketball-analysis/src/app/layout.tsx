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
// Canonical's display weight is Tungsten MEDIUM, not Bold. Measured by
// rendering each weight at the canonical string's exact cap height and
// comparing ink density and advance width against the canonical PNG:
//
//   080 "DASHBOARD"     cap 46  canonical ink 0.483  width 198  stem 5.5
//                               medium    ink 0.483  width 202  stem 5
//                               semibold  ink 0.605  width 211  stem 7
//                               bold      ink 0.728  width 223  stem 9
//   077 "WELCOME BACK"  cap 44  canonical ink 0.456  width 241  stem 5
//                               medium    ink 0.451  width 252  stem 5
//                               bold      ink 0.663  width 275  stem 9
//
// Binding 400 to tungsten_bold was why headings measured the right cap height
// and still set 5-21% too wide on six screens — a bolder cut of a condensed
// face is wider at the same cap. Heavier weights stay reachable at 600/700/900.
const tungstenDisplay = localFont({
  src: [
    { path: "../../public/fonts/wilson-x/tungsten_medium.otf", weight: "400" },
    { path: "../../public/fonts/wilson-x/tungsten_semibold.otf", weight: "600" },
    { path: "../../public/fonts/wilson-x/tungsten_bold.otf", weight: "700" },
    { path: "../../public/fonts/wilson-x/tungsten_black.otf", weight: "900" },
  ],
  variable: "--font-shotiq-display",
  display: "swap",
})
// `.shotiq-numeric` asks for weight 600. This binding declared only 400 and
// 700, so CSS weight matching resolved 600 up to 700 and every numeral in the
// app rendered Tungsten Bold — one cut heavier than the semibold the binding
// was named for. Each weight is now bound to its own file so the requested
// weight is the weight that draws.
const tungstenNumeric = localFont({
  src: [
    { path: "../../public/fonts/wilson-x/tungsten_medium.otf", weight: "400" },
    { path: "../../public/fonts/wilson-x/tungsten_semibold.otf", weight: "600" },
    { path: "../../public/fonts/wilson-x/tungsten_bold.otf", weight: "700" },
    { path: "../../public/fonts/wilson-x/tungsten_black.otf", weight: "900" },
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
