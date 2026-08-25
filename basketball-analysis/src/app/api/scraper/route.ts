/**
 * Scraper Trigger API
 * Triggers the Python scraper on Render/Railway from Next.js
 */

import { NextRequest, NextResponse } from "next/server"

const SCRAPER_URL = process.env.PYTHON_SCRAPER_URL || "http://localhost:5000"
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || ""

/**
 * PER REQUEST, DECLARED. This handler takes no arguments and reads nothing
 * request-scoped, which is exactly the shape Next 14 classifies as static and
 * PRERENDERS — and that is not hypothetical here: /api/auth/csrf had the same
 * shape and its token was frozen into the dist, shared by every caller, the
 * moment the build started succeeding. This route reports live scraper state,
 * so baking one build's answer into the artefact would serve stale data with no
 * error anywhere.
 *
 * It is dynamic today only because Next happens to classify it so. Declaring it
 * removes the dependence on that classification, and docs/shotiq/csrf-gate.mjs
 * now fails if a zero-argument handler appears without this line.
 */
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { action, limit } = await request.json()

    if (!action) {
      return NextResponse.json(
        { success: false, error: "Action required" },
        { status: 400 }
      )
    }

    // Map action to endpoint
    const endpoints: Record<string, string> = {
      nba: "/api/scrape/nba",
      historical: "/api/scrape/historical",
      full: "/api/scrape/full",
    }

    const endpoint = endpoints[action]
    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: "Invalid action" },
        { status: 400 }
      )
    }

    // Call Python scraper
    const response = await fetch(`${SCRAPER_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": SCRAPER_API_KEY,
      },
      body: JSON.stringify({ limit: limit || 100 }),
    })

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("Scraper trigger error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to trigger scraper" 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Check scraper health
    const response = await fetch(`${SCRAPER_URL}/health`, {
      headers: {
        "X-API-Key": SCRAPER_API_KEY,
      },
    })

    const data = await response.json()

    return NextResponse.json({
      success: true,
      scraper: data,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Scraper not reachable",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}







