/**
 * Scraper Trigger API
 * Triggers the Python scraper on Render/Railway from Next.js
 */

import { NextRequest, NextResponse } from "next/server"

const SCRAPER_URL = process.env.PYTHON_SCRAPER_URL || "http://localhost:5000"
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || ""

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


