import { readFile } from "node:fs/promises"
import path from "node:path"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const html = await readFile(
    path.join(process.cwd(), "public/shotiq-ios-review-board/index.html"),
    "utf8",
  )

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  })
}
