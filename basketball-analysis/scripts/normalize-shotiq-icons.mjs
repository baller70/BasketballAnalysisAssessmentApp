import fs from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const iconDir = path.join(process.cwd(), "public", "shotiq", "icons", "approved")
const CANVAS = 512
const TARGET_MAX = 408
const ALPHA_THRESHOLD = 8
const WHITE_THRESHOLD = 246

function isInkLike(r, g, b, a) {
  if (a <= ALPHA_THRESHOLD) return false
  return r < WHITE_THRESHOLD || g < WHITE_THRESHOLD || b < WHITE_THRESHOLD
}

async function visualBounds(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let minX = info.width
  let minY = info.height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const i = (y * info.width + x) * 4
      if (!isInkLike(data[i], data[i + 1], data[i + 2], data[i + 3])) continue
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  }

  if (maxX < minX || maxY < minY) return null
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
}

async function normalize(file) {
  const bounds = await visualBounds(file)
  if (!bounds) return { file, skipped: true }

  const scale = TARGET_MAX / Math.max(bounds.width, bounds.height)
  const width = Math.max(1, Math.round(bounds.width * scale))
  const height = Math.max(1, Math.round(bounds.height * scale))
  const left = Math.round((CANVAS - width) / 2)
  const top = Math.round((CANVAS - height) / 2)

  const icon = await sharp(file)
    .ensureAlpha()
    .extract(bounds)
    .resize(width, height, { fit: "contain", kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer()

  await sharp({
    create: {
      width: CANVAS,
      height: CANVAS,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    },
  })
    .composite([{ input: icon, left, top }])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(file)

  return { file, width, height }
}

const entries = await fs.readdir(iconDir)
const pngs = entries.filter((entry) => entry.endsWith(".png")).sort()
const results = []

for (const name of pngs) {
  results.push(await normalize(path.join(iconDir, name)))
}

const normalized = results.filter((result) => !result.skipped)
console.log(`Normalized ${normalized.length} approved ShotIQ icons to a ${TARGET_MAX}px visual max on ${CANVAS}px canvases.`)
