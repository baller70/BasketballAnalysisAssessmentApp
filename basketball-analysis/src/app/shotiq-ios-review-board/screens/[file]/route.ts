import { readFile } from "node:fs/promises"
import path from "node:path"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const PNG_FILE = /^\d{3}-[a-z0-9-]+\.png$/i

export async function GET(
  _request: Request,
  { params }: { params: { file: string } },
) {
  const file = params.file
  if (!PNG_FILE.test(file)) {
    return new Response("Not found", { status: 404 })
  }

  try {
    const image = await readFile(
      path.join(process.cwd(), "public/shotiq-ios-review-board/screens", file),
    )
    return new Response(image, {
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=3600",
      },
    })
  } catch {
    return new Response("Not found", { status: 404 })
  }
}
