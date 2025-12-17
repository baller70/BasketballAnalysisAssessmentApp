import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/create-visualization
 * 
 * Create annotated visualization using ShotStack API.
 * Generates skeleton overlays, angle indicators, and comparison images.
 */

interface KeypointData {
  name: string
  x: number
  y: number
  confidence: number
}

interface AngleData {
  elbow: number
  knee: number
  wrist: number
  shoulder: number
  hip: number
  release: number
}

interface VisualizationRequest {
  imageUrl: string
  keypoints: KeypointData[]
  angles: AngleData
  feedback?: {
    strengths?: string[]
    improvements?: string[]
    overallScore?: number
  }
  comparisonImageUrl?: string
  outputFormat?: "image" | "video"
}

// Optimal angle ranges for color coding
const OPTIMAL_RANGES = {
  elbow: { min: 85, max: 95 },
  knee: { min: 110, max: 130 },
  wrist: { min: 45, max: 90 },
  shoulder: { min: 0, max: 10 },
  hip: { min: 155, max: 175 },
  release: { min: 48, max: 58 },
}

// Color based on how close to optimal
function getAngleColor(angle: number, type: keyof typeof OPTIMAL_RANGES): string {
  const range = OPTIMAL_RANGES[type]
  if (angle >= range.min && angle <= range.max) {
    return "#22c55e" // Green - optimal
  }
  const deviation = angle < range.min 
    ? range.min - angle 
    : angle - range.max
  if (deviation <= 10) {
    return "#eab308" // Yellow - close
  }
  return "#ef4444" // Red - needs work
}

// Skeleton connections for drawing lines between keypoints
const SKELETON_CONNECTIONS = [
  ["right_shoulder", "right_elbow"],
  ["right_elbow", "right_wrist"],
  ["left_shoulder", "left_elbow"],
  ["left_elbow", "left_wrist"],
  ["right_shoulder", "left_shoulder"],
  ["right_shoulder", "right_hip"],
  ["left_shoulder", "left_hip"],
  ["right_hip", "left_hip"],
  ["right_hip", "right_knee"],
  ["right_knee", "right_ankle"],
  ["left_hip", "left_knee"],
  ["left_knee", "left_ankle"],
]

export async function POST(request: NextRequest) {
  try {
    const body: VisualizationRequest = await request.json()
    const { imageUrl, keypoints, angles, feedback, outputFormat = "image" } = body
    // Note: comparisonImageUrl support planned for split-screen feature

    // Validate required fields
    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: "imageUrl is required" },
        { status: 400 }
      )
    }

    if (!keypoints || keypoints.length === 0) {
      return NextResponse.json(
        { success: false, error: "keypoints array is required" },
        { status: 400 }
      )
    }

    const apiKey = process.env.SHOTSTACK_API_KEY || process.env.SHOTSTACK_SANDBOX_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "ShotStack API key not configured" },
        { status: 500 }
      )
    }

    // Determine environment
    const isSandbox = !process.env.SHOTSTACK_API_KEY
    const baseUrl = isSandbox 
      ? "https://api.shotstack.io/stage"
      : "https://api.shotstack.io/v1"

    // Build ShotStack edit payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clips: any[] = []
    const timeline = { tracks: [] as { clips: typeof clips }[] }

    // Track 1: Base image
    clips.push({
      asset: {
        type: "image",
        src: imageUrl,
      },
      start: 0,
      length: outputFormat === "video" ? 5 : 1,
      fit: "contain",
    })
    timeline.tracks.push({ clips: [...clips] })
    clips.length = 0

    // Track 2: Skeleton lines
    const keypointMap = new Map(keypoints.map(kp => [kp.name, kp]))
    
    for (const [startName, endName] of SKELETON_CONNECTIONS) {
      const start = keypointMap.get(startName)
      const end = keypointMap.get(endName)
      
      if (start && end && start.confidence > 0.3 && end.confidence > 0.3) {
        // Create line element (using HTML overlay)
        clips.push({
          asset: {
            type: "html",
            html: `<div style="position:absolute;width:3px;height:${Math.hypot(end.x - start.x, end.y - start.y)}px;background:#3b82f6;transform:rotate(${Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI}deg);transform-origin:top left;"></div>`,
            width: 1920,
            height: 1080,
          },
          start: 0,
          length: outputFormat === "video" ? 5 : 1,
          position: "topLeft",
          offset: {
            x: start.x / 100,
            y: start.y / 100,
          },
        })
      }
    }
    
    // Track 3: Keypoint markers
    for (const kp of keypoints) {
      if (kp.confidence > 0.3) {
        clips.push({
          asset: {
            type: "html",
            html: `<div style="width:12px;height:12px;border-radius:50%;background:#3b82f6;border:2px solid white;"></div>`,
            width: 20,
            height: 20,
          },
          start: 0,
          length: outputFormat === "video" ? 5 : 1,
          position: "topLeft",
          offset: {
            x: (kp.x - 1) / 100,
            y: (kp.y - 1) / 100,
          },
        })
      }
    }
    timeline.tracks.push({ clips: [...clips] })
    clips.length = 0

    // Track 4: Angle indicators
    if (angles) {
      const angleLabels = [
        { name: "Elbow", value: angles.elbow, type: "elbow" as const, x: 0.7, y: 0.3 },
        { name: "Knee", value: angles.knee, type: "knee" as const, x: 0.7, y: 0.7 },
        { name: "Release", value: angles.release, type: "release" as const, x: 0.85, y: 0.2 },
      ]

      for (const label of angleLabels) {
        if (label.value) {
          const color = getAngleColor(label.value, label.type)
          clips.push({
            asset: {
              type: "html",
              html: `<div style="background:rgba(0,0,0,0.8);padding:8px 12px;border-radius:8px;border-left:4px solid ${color};font-family:Arial;color:white;font-size:14px;"><strong>${label.name}</strong><br/>${label.value.toFixed(1)}°</div>`,
              width: 150,
              height: 60,
            },
            start: 0,
            length: outputFormat === "video" ? 5 : 1,
            position: "topLeft",
            offset: {
              x: label.x,
              y: label.y,
            },
          })
        }
      }
    }
    timeline.tracks.push({ clips: [...clips] })
    clips.length = 0

    // Track 5: Feedback overlay
    if (feedback?.overallScore !== undefined) {
      const scoreColor = feedback.overallScore >= 80 ? "#22c55e" : 
                         feedback.overallScore >= 60 ? "#eab308" : "#ef4444"
      
      clips.push({
        asset: {
          type: "html",
          html: `<div style="background:rgba(0,0,0,0.9);padding:16px;border-radius:12px;font-family:Arial;color:white;text-align:center;"><div style="font-size:32px;font-weight:bold;color:${scoreColor};">${feedback.overallScore}</div><div style="font-size:14px;opacity:0.8;">Overall Score</div></div>`,
          width: 120,
          height: 80,
        },
        start: 0,
        length: outputFormat === "video" ? 5 : 1,
        position: "topRight",
        offset: {
          x: -0.05,
          y: 0.05,
        },
      })
    }
    timeline.tracks.push({ clips: [...clips] })

    // Build full edit payload
    const editPayload = {
      timeline,
      output: {
        format: outputFormat === "video" ? "mp4" : "jpg",
        resolution: "hd",
        aspectRatio: "16:9",
        quality: "high",
      },
    }

    // Submit to ShotStack
    const renderResponse = await fetch(`${baseUrl}/render`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(editPayload),
    })

    if (!renderResponse.ok) {
      const errorData = await renderResponse.json().catch(() => ({}))
      throw new Error(`ShotStack API error: ${renderResponse.status} - ${JSON.stringify(errorData)}`)
    }

    const renderResult = await renderResponse.json()
    const renderId = renderResult.response?.id

    if (!renderId) {
      throw new Error("No render ID returned from ShotStack")
    }

    // Poll for completion (with timeout)
    let outputUrl: string | null = null
    const maxAttempts = 30
    const pollInterval = 2000

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval))

      const statusResponse = await fetch(`${baseUrl}/render/${renderId}`, {
        headers: { "x-api-key": apiKey },
      })

      if (!statusResponse.ok) continue

      const statusResult = await statusResponse.json()
      const status = statusResult.response?.status

      if (status === "done") {
        outputUrl = statusResult.response?.url
        break
      } else if (status === "failed") {
        throw new Error(`Render failed: ${statusResult.response?.error || "Unknown error"}`)
      }
    }

    if (!outputUrl) {
      // Return render ID for async polling if not ready
      return NextResponse.json({
        success: true,
        status: "processing",
        renderId,
        message: "Visualization is being rendered. Poll /api/create-visualization/status with renderId.",
      })
    }

    return NextResponse.json({
      success: true,
      status: "complete",
      outputUrl,
      renderId,
    })
  } catch (error) {
    console.error("Visualization error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Visualization failed" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/create-visualization?renderId=xxx
 * 
 * Check render status
 */
export async function GET(request: NextRequest) {
  const renderId = request.nextUrl.searchParams.get("renderId")

  if (!renderId) {
    return NextResponse.json(
      { success: false, error: "renderId parameter required" },
      { status: 400 }
    )
  }

  const apiKey = process.env.SHOTSTACK_API_KEY || process.env.SHOTSTACK_SANDBOX_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "ShotStack API key not configured" },
      { status: 500 }
    )
  }

  const isSandbox = !process.env.SHOTSTACK_API_KEY
  const baseUrl = isSandbox 
    ? "https://api.shotstack.io/stage"
    : "https://api.shotstack.io/v1"

  try {
    const response = await fetch(`${baseUrl}/render/${renderId}`, {
      headers: { "x-api-key": apiKey },
    })

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`)
    }

    const result = await response.json()
    const status = result.response?.status

    return NextResponse.json({
      success: true,
      status,
      outputUrl: status === "done" ? result.response?.url : null,
      error: status === "failed" ? result.response?.error : null,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Status check failed" },
      { status: 500 }
    )
  }
}





