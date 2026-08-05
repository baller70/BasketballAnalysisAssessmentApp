#!/usr/bin/env node
/**
 * ShotIQ imagery pipeline — OpenAI gpt-image-2 via Replicate.
 *
 * The token is read from the environment and is never written to disk or
 * committed. Run with:  REPLICATE_API_TOKEN=... node scripts/imagegen/gen.mjs <spec.json>
 *
 * A spec is a JSON array of { out, prompt, size?, background? }. `out` is a path
 * relative to basketball-analysis/public. Anything already on disk is skipped
 * unless FORCE=1, so a re-run only fills gaps and costs nothing for what exists.
 */
import fs from "node:fs/promises"
import path from "node:path"

const TOKEN = process.env.REPLICATE_API_TOKEN
if (!TOKEN) { console.error("REPLICATE_API_TOKEN not set"); process.exit(1) }

const MODEL = "openai/gpt-image-2"
const ROOT = path.resolve(import.meta.dirname, "../../basketball-analysis/public")

/**
 * House style. Every prompt gets this appended so the set reads as one system.
 * Derived from the canonical designs actually shipped: near-black ink (4,5,5),
 * ShotIQ orange (253,57,1), paper white, and a flat editorial-athletic look with
 * no gradients, no glow and no 3D — the canonical screens have none of those.
 */
const HOUSE =
  "Flat editorial sports-graphic style. Strictly limited palette: near-black #050505, " +
  "pure white #FFFFFF, and a single accent of vivid orange-red #FD3701. No gradients, " +
  "no drop shadows, no glow, no bevel, no 3D rendering, no lens flare. Crisp geometric " +
  "line work with even stroke weight. Clean uncluttered composition with generous negative " +
  "space. No text, no lettering, no words, no numbers, no watermark, no signature."

async function generate(spec) {
  const res = await fetch(`https://api.replicate.com/v1/models/${MODEL}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      Prefer: "wait",
    },
    body: JSON.stringify({
      input: {
        prompt: `${spec.prompt}\n\n${HOUSE}`,
        size: spec.size || "1024x1024",
        output_format: "png",
      },
    }),
  })
  // Replicate throttles prediction creation hard (6/min) while the account is
  // under $5 of credit, and answers 429 with the seconds to wait. Respect it.
  if (res.status === 429) {
    const body = await res.json().catch(() => ({}))
    const wait = ((body.retry_after ?? 10) + 2) * 1000
    await new Promise((r) => setTimeout(r, wait))
    return generate(spec)
  }
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  let pred = await res.json()

  // `Prefer: wait` returns early on longer renders, so poll to completion.
  const deadline = Date.now() + 5 * 60 * 1000
  while (["starting", "processing"].includes(pred.status) && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2500))
    const poll = await fetch(`https://api.replicate.com/v1/predictions/${pred.id}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    })
    if (!poll.ok) throw new Error(`poll ${poll.status}`)
    pred = await poll.json()
  }
  if (pred.status !== "succeeded") {
    throw new Error(`status=${pred.status} ${pred.error || ""}`.trim())
  }
  return pred
}

async function cutout(file) {
  const { execFile } = await import("node:child_process")
  const { promisify } = await import("node:util")
  await promisify(execFile)("python3", ["-c", `
import sys
from PIL import Image
import numpy as np
f = sys.argv[1]
im = Image.open(f).convert("RGBA")
a = np.array(im).astype(int)
rgb = a[:, :, :3]
# White-ish and low-saturation pixels become transparent; alpha ramps over the
# antialiased edge so strokes keep their shape instead of going hard-edged.
lum = rgb.mean(axis=2)
sat = rgb.max(axis=2) - rgb.min(axis=2)
alpha = np.clip((246 - lum) / 26 * 255, 0, 255)
alpha[sat > 26] = 255
a[:, :, 3] = alpha.astype(int)
Image.fromarray(a.astype("uint8")).save(f)
`, file])
}

const specPath = process.argv[2]
if (!specPath) { console.error("usage: gen.mjs <spec.json>"); process.exit(1) }
const specs = JSON.parse(await fs.readFile(specPath, "utf8"))

let made = 0, skipped = 0, failed = 0
for (const spec of specs) {
  const dest = path.join(ROOT, spec.out)
  if (!process.env.FORCE) {
    try { await fs.access(dest); console.log(`skip   ${spec.out}`); skipped++; continue } catch {}
  }
  try {
    const pred = await generate(spec)
    const url = Array.isArray(pred.output) ? pred.output[0] : pred.output
    if (!url) throw new Error(`no output: ${JSON.stringify(pred).slice(0, 300)}`)
    const img = await fetch(url)
    if (!img.ok) throw new Error(`fetch image ${img.status}`)
    await fs.mkdir(path.dirname(dest), { recursive: true })
    await fs.writeFile(dest, Buffer.from(await img.arrayBuffer()))
    // gpt-image-2 cannot render a transparent background, so flat icon art comes
    // back on white. `cutout` knocks that back out afterwards.
    if (spec.cutout) await cutout(dest)
    const { size } = await fs.stat(dest)
    console.log(`made   ${spec.out}  ${(size / 1024).toFixed(0)}KB${spec.cutout ? " (cutout)" : ""}`)
    made++
  } catch (e) {
    console.error(`FAIL   ${spec.out}  ${e.message}`)
    failed++
  }
}
console.log(`\nmade ${made}, skipped ${skipped}, failed ${failed}`)
