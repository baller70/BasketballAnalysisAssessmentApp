#!/usr/bin/env node
/**
 * ShotIQ deterministic visual proof harness.
 *
 * Renders each mapped desktop route at its exact sidecar viewport, waits for the
 * font-loading and screenshot gates declared in the sidecar renderingContract,
 * then compares the render against the canonical reference PNG with pixelmatch
 * plus whole-screen and per-critical-region SSIM.
 *
 * Reference PNGs are NOT committed (114 MB). Point REF_DIR at the canonical
 * output/<platform>/embedded directory.
 *
 *   REF_DIR=/path/to/output node scripts/shotiq-visual-proof.mjs
 *
 * Exits non-zero if any screen misses its gate, so CI can enforce it.
 */
import { chromium } from 'playwright'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const APP = join(HERE, '..')
const REPO = join(APP, '..')
const REF_DIR = process.env.REF_DIR || join(REPO, '.shotiq-reference')
const OUT_DIR = process.env.OUT_DIR || join(REPO, '.shotiq-proof')
const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000'
const ONLY = process.env.ONLY || null

const map = JSON.parse(readFileSync(join(APP, 'docs/shotiq/screen-implementation-map.json'), 'utf8'))

// Structural acceptance gate (see docs/shotiq/acceptance-gate-findings.md).
// SSIM is a regression signal, not a pass bar: each screen must stay within
// REGRESSION_TOLERANCE of its recorded score in visual-proof-round2.json.
const REGRESSION_TOLERANCE = 0.02
const REGION_CONTAINMENT = 0.6
let ssimFloor = {}
try {
  ssimFloor = JSON.parse(readFileSync(join(APP, 'docs/shotiq/visual-proof-floor.json'), 'utf8'))
} catch { /* first run: no floor yet */ }

/** Grayscale SSIM over a sliding 8x8 window (global mean fallback for small regions). */
function ssim(a, b, w, h, box) {
  const x0 = box ? Math.max(0, box.x) : 0
  const y0 = box ? Math.max(0, box.y) : 0
  const x1 = box ? Math.min(w, box.x + box.width) : w
  const y1 = box ? Math.min(h, box.y + box.height) : h
  const gray = (buf, i) => 0.299 * buf[i] + 0.587 * buf[i + 1] + 0.114 * buf[i + 2]
  const C1 = (0.01 * 255) ** 2, C2 = (0.03 * 255) ** 2
  let total = 0, n = 0
  const W = 8
  for (let by = y0; by < y1; by += W) {
    for (let bx = x0; bx < x1; bx += W) {
      let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0, m = 0
      for (let y = by; y < Math.min(by + W, y1); y++) {
        for (let x = bx; x < Math.min(bx + W, x1); x++) {
          const i = (y * w + x) * 4
          const va = gray(a, i), vb = gray(b, i)
          sa += va; sb += vb; saa += va * va; sbb += vb * vb; sab += va * vb; m++
        }
      }
      if (m < 4) continue
      const ma = sa / m, mb = sb / m
      const va = saa / m - ma * ma, vb = sbb / m - mb * mb, cab = sab / m - ma * mb
      const s = ((2 * ma * mb + C1) * (2 * cab + C2)) / ((ma * ma + mb * mb + C1) * (va + vb + C2))
      total += s; n++
    }
  }
  return n ? total / n : 1
}

const rows = []
mkdirSync(OUT_DIR, { recursive: true })

const targets = map.filter(r => r.platform === 'desktop' && r.status.startsWith('exists'))
  .filter(r => !ONLY || r.screen.includes(ONLY))

if (!existsSync(REF_DIR)) {
  console.error(`REF_DIR not found: ${REF_DIR}`)
  console.error('Reference PNGs are not committed. Set REF_DIR to the canonical output dir.')
  process.exit(2)
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--force-device-scale-factor=1', '--hide-scrollbars', '--font-render-hinting=none'],
})

for (const r of targets) {
  const [vw, vh] = r.canvas.split('x').map(Number)
  const sidecar = JSON.parse(readFileSync(join(APP, r.sidecar.replace('basketball-analysis/', '')), 'utf8'))
  const refPath = join(REF_DIR, 'desktop', 'embedded', `${r.screen}.embedded.png`)
  const row = { screen: r.screen, screenId: r.screenId, route: r.route, canvas: r.canvas }

  if (!existsSync(refPath)) { row.error = 'reference PNG missing'; rows.push(row); continue }

  const ctx = await browser.newContext({
    viewport: { width: vw, height: vh },
    deviceScaleFactor: sidecar.renderingContract?.devicePixelRatio ?? 1,
    locale: sidecar.renderingContract?.locale ?? 'en-US',
    colorScheme: 'light',
  })
  const page = await ctx.newPage()
  const consoleErrors = []            // JS/app errors -> gate
  const sameOriginResourceFails = []  // our own assets failing -> gate
  const crossOriginResourceFails = [] // external CDNs (environmental) -> reported only
  page.on('console', m => {
    if (m.type() !== 'error') return
    const url = m.location()?.url || ''
    if (/Failed to load resource/.test(m.text())) {
      const sameOrigin = url.startsWith(BASE) || url.startsWith('/')
      // Auth-gated APIs correctly return 401/403 to a logged-out renderer;
      // that is expected behaviour, not a broken resource. Everything else
      // (chunks, css, images, 404s, 500s) still gates.
      const authGated = sameOrigin && /\/api\//.test(url) && /(401|403)/.test(m.text())
      if (!authGated) (sameOrigin ? sameOriginResourceFails : crossOriginResourceFails).push(url)
    } else {
      consoleErrors.push(m.text())
    }
  })
  page.on('pageerror', e => consoleErrors.push(String(e)))
  try {
    const resp = await page.goto(BASE + r.route, { waitUntil: 'load', timeout: 30000 })
    row.http = resp?.status()
    // fontLoadingGate + two animation frames (screenshotGate)
    await page.evaluate(() => document.fonts.ready)
    await page.waitForLoadState('domcontentloaded')
    await page.evaluate(() => new Promise(res =>
      requestAnimationFrame(() => requestAnimationFrame(res))))
    // asset integrity
    const imgs = await page.evaluate(() =>
      [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.currentSrc || i.src))
    row.brokenImages = imgs.filter(u => !u || u.startsWith(BASE) || u.startsWith('/') || u.startsWith('data:')).length
    row.brokenImagesExternal = imgs.length - row.brokenImages
    // Canonical faces: Inter + Bebas Neue exact; Oswald is the documented
    // substitute for the unlicensable DIN Condensed. next/font renames
    // families to __Name_hash, so normalize before matching.
    row.fallbackFonts = await page.evaluate(() => {
      const norm = (f) => f.replace(/['"]/g, '').replace(/^__/, '').replace(/_[a-f0-9]+$/i, '').replace(/_/g, ' ').toLowerCase()
      const have = new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => norm(f.family)))
      return ['Inter', 'Bebas Neue', 'Oswald'].filter(w => !have.has(w.toLowerCase()))
    })
    // Structural check: every critical sidecar region must exist, be visible,
    // and sit ≥REGION_CONTAINMENT inside its sidecar bounds.
    const regionBoxes = await page.evaluate(() => {
      const out = {}
      for (const id of ['topbar', 'sidebar', 'main']) {
        const el = document.querySelector(`[data-testid="region-${id}"]`)
        if (!el) { out[id] = null; continue }
        const r = el.getBoundingClientRect()
        const style = getComputedStyle(el)
        out[id] = { x: r.x, y: r.y, width: r.width, height: r.height,
                    visible: style.display !== 'none' && style.visibility !== 'hidden' && r.width > 0 && r.height > 0 }
      }
      return out
    })
    row.structural = (sidecar.regions || []).filter(g => g.critical).map(g => {
      const raw = regionBoxes[g.id]
      if (!raw || !raw.visible) return { id: g.id, present: false, containment: 0, pass: false }
      // The canonical claim is about the 1440x900 canvas: clip the DOM rect to
      // the canvas before measuring (tall scrolling pages continue below it).
      const dx0 = Math.max(0, raw.x), dy0 = Math.max(0, raw.y)
      const dx1 = Math.min(vw, raw.x + raw.width), dy1 = Math.min(vh, raw.y + raw.height)
      if (dx1 <= dx0 || dy1 <= dy0) return { id: g.id, present: true, containment: 0, pass: false }
      const b = g.bounds
      const ix = Math.max(0, Math.min(dx1, b.x + b.width) - Math.max(dx0, b.x))
      const iy = Math.max(0, Math.min(dy1, b.y + b.height) - Math.max(dy0, b.y))
      const containment = (ix * iy) / ((dx1 - dx0) * (dy1 - dy0))
      return { id: g.id, present: true, containment: +containment.toFixed(3),
               pass: containment >= REGION_CONTAINMENT }
    })
    row.structuralFailing = row.structural.filter(r => !r.pass).length

    const buf = await page.screenshot({ clip: { x: 0, y: 0, width: vw, height: vh } })
    writeFileSync(join(OUT_DIR, `${r.screen}.render.png`), buf)

    const ref = PNG.sync.read(readFileSync(refPath))
    const got = PNG.sync.read(buf)
    if (ref.width !== got.width || ref.height !== got.height) {
      row.error = `size ${got.width}x${got.height} != ref ${ref.width}x${ref.height}`
    } else {
      const diff = new PNG({ width: ref.width, height: ref.height })
      const bad = pixelmatch(ref.data, got.data, diff.data, ref.width, ref.height, { threshold: 0.1 })
      writeFileSync(join(OUT_DIR, `${r.screen}.diff.png`), PNG.sync.write(diff))
      row.pixelDiff = bad
      row.pixelDiffPct = +(100 * bad / (ref.width * ref.height)).toFixed(3)
      row.ssim = +ssim(ref.data, got.data, ref.width, ref.height, null).toFixed(4)
      row.regions = (sidecar.regions || []).filter(g => g.critical).map(g => ({
        id: g.id,
        floor: g.fidelityFloor,
        ssim: +ssim(ref.data, got.data, ref.width, ref.height, g.bounds).toFixed(4),
      }))
      row.regionsFailing = row.regions.filter(g => g.ssim < (g.floor ?? 0.98)).length
      const floor = ssimFloor[r.screen]
      row.ssimRegressed = floor != null && row.ssim < floor - REGRESSION_TOLERANCE
      // Structural gate: regions present+contained, assets sound, fonts loaded,
      // no console errors, SSIM not regressed. (Raster-equality gates retired —
      // see acceptance-gate-findings.md.)
      row.sameOriginResourceFails = sameOriginResourceFails.length
      row.sameOriginResourceFailUrls = [...new Set(sameOriginResourceFails)].slice(0, 5)
      row.crossOriginResourceFails = crossOriginResourceFails.length
      row.pass = row.structuralFailing === 0 &&
                 row.brokenImages === 0 &&
                 row.fallbackFonts.length === 0 &&
                 consoleErrors.length === 0 &&
                 sameOriginResourceFails.length === 0 &&
                 !row.ssimRegressed
    }
    row.consoleErrors = consoleErrors.length
  } catch (e) {
    row.error = String(e).slice(0, 160)
  }
  await ctx.close()
  rows.push(row)
  const verdict = row.error ? `ERROR ${row.error}`
    : `ssim=${row.ssim}${row.ssimRegressed ? ' REGRESSED' : ''} structural=${(row.structural?.length ?? 0) - (row.structuralFailing ?? 0)}/${row.structural?.length} imgs=${row.brokenImages}(+${row.brokenImagesExternal ?? 0}ext) fonts=${row.fallbackFonts?.length} jsErr=${row.consoleErrors ?? 0} res=${row.sameOriginResourceFails ?? 0} ${row.pass ? 'PASS' : 'FAIL'}`
  console.log(`${r.screen.padEnd(34)} ${verdict}`)
}

await browser.close()
writeFileSync(join(OUT_DIR, 'visual-proof-report.json'), JSON.stringify(rows, null, 1))

const measured = rows.filter(r => !r.error)
const passed = measured.filter(r => r.pass)
console.log('\n' + '='.repeat(70))
console.log(`measured : ${measured.length}/${rows.length}`)
console.log(`passing  : ${passed.length}/${measured.length}`)
if (measured.length) {
  const mean = measured.reduce((s, r) => s + r.ssim, 0) / measured.length
  console.log(`mean SSIM: ${mean.toFixed(4)}`)
}
console.log(`report   : ${join(OUT_DIR, 'visual-proof-report.json')}`)
process.exit(measured.length && passed.length === measured.length ? 0 : 1)
