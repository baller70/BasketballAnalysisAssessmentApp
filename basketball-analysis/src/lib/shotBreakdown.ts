export interface ShotFrame {
  id: string
  url: string
  label: string
  confidence: number
  wristHeight: number
  wristAngle?: number
  kneeBend?: number
}

function toId() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `shot-${Date.now()}-${Math.random()}`
}

export async function analyzeShotFrames(urls: string[]): Promise<ShotFrame[]> {
  // Simple frame creation without pose detection
  return urls.map((url, index) => ({
    id: toId(),
    url,
    label: "Frame",
    confidence: 1,
    wristHeight: index / Math.max(urls.length - 1, 1), // Spread evenly 0-1
  }))
}

export function pickTeaserFrames(frames: ShotFrame[], count = 3): ShotFrame[] {
  if (frames.length === 0) return []
  const sorted = [...frames].sort((a, b) => a.wristHeight - b.wristHeight)
  const picked: ShotFrame[] = []

  // Ensure we cover low/mid/high wrist positions if possible
  if (sorted.length >= 1) picked.push(sorted[0])
  if (sorted.length >= 2) picked.push(sorted[Math.floor(sorted.length / 2)])
  if (sorted.length >= 3) picked.push(sorted[sorted.length - 1])

  const unique = Array.from(new Map(picked.map((f) => [f.id, f])).values())
  return unique.slice(0, count)
}

export function pickFullFrames(frames: ShotFrame[], max = 7): ShotFrame[] {
  if (frames.length === 0) return []
  // Prefer original order but ensure diversity by wrist height buckets
  const byOrder = [...frames]
  if (byOrder.length <= max) return byOrder

  const sortedByWrist = [...frames].sort((a, b) => a.wristHeight - b.wristHeight)
  const lowest = sortedByWrist[0]
  const highest = sortedByWrist[sortedByWrist.length - 1]
  const mid = sortedByWrist[Math.floor(sortedByWrist.length / 2)]

  const seed = new Map<string, ShotFrame>()
  seed.set(lowest.id, lowest)
  seed.set(mid.id, mid)
  seed.set(highest.id, highest)

  for (const frame of byOrder) {
    if (seed.size >= max) break
    if (!seed.has(frame.id)) {
      seed.set(frame.id, frame)
    }
  }

  return Array.from(seed.values()).slice(0, max)
}

export function labelFrames(frames: ShotFrame[]): ShotFrame[] {
  const labels = ["Load", "Set", "Release", "Hold", "Follow", "Balance", "Finish"]
  return frames.map((frame, idx) => ({
    ...frame,
    label: labels[idx] || `Frame ${idx + 1}`,
  }))
}










