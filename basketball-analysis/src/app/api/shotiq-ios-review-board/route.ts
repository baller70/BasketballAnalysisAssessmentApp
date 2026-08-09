import { NextResponse } from "next/server"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type ReviewBoardPayload = {
  notes?: Record<string, unknown>
}

const MAX_BODY_BYTES = 30 * 1024 * 1024

function dataFile() {
  const dir = process.env.SHOTIQ_REVIEW_BOARD_DATA_DIR
    || path.join(process.cwd(), ".shotiq-review-board")
  return {
    dir,
    file: path.join(dir, "ios-72-review-notes.json"),
  }
}

export async function GET() {
  const { file } = dataFile()
  try {
    const raw = await readFile(file, "utf8")
    return NextResponse.json(JSON.parse(raw))
  } catch {
    return NextResponse.json({
      updatedAt: null,
      notes: {},
    })
  }
}

export async function POST(request: Request) {
  const raw = await request.text()
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "Review board payload is too large. Export notes and reduce image attachment size." },
      { status: 413 },
    )
  }

  let payload: ReviewBoardPayload
  try {
    payload = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 })
  }

  const notes = payload.notes && typeof payload.notes === "object" ? payload.notes : {}
  const saved = {
    updatedAt: new Date().toISOString(),
    notes,
  }
  const { dir, file } = dataFile()
  await mkdir(dir, { recursive: true })
  await writeFile(file, JSON.stringify(saved, null, 2), "utf8")
  return NextResponse.json({ ok: true, updatedAt: saved.updatedAt })
}
