import type { Metadata } from "next"
import localFont from "next/font/local"
import { Russo_One } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Providers } from "./providers"

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
    <html lang="en" className="dark">
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
      <body className={`${geistSans.variable} ${geistMono.variable} ${russoOne.variable} antialiased min-h-screen flex flex-col`}>
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
