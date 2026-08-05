/**
 * probe-run.mjs — measure one positioned run in the LIVE page, with optional
 * CSS overrides, without rebuilding.
 *
 * WHY THIS EXISTS. Every number in a phone recipe is solved by rendering,
 * measuring and correcting. Going through `next build` for each candidate costs
 * minutes per iteration, which pushes a builder towards changing several
 * numbers at once and then being unable to say which one moved the result —
 * the exact habit ledger rule 24 warns about. This applies a candidate as an
 * injected stylesheet, so a solve is seconds and each parameter can be moved on
 * its own.
 *
 * IT IS A SOLVER, NOT A VERIFIER. Injected CSS is not the built artefact: the
 * cascade order differs, and `!important` in the recipe interacts with an
 * appended sheet differently than with the page's own. Nothing measured here
 * may be reported as a result. Solve here, write the numbers into the recipe,
 * rebuild, re-capture with `capture-ios.mjs`, and report only from that.
 *
 * The steps come from the committed `ios-route-map.json`, so the screen is put
 * into the same state the real capture uses (rule: 004's canonical is FILLED).
 *
 *   PORT=3181 ONLY=004 RUN=display node docs/shotiq/probe-run.mjs
 *   PORT=3181 ONLY=004 RUN=display CSS='transform:scaleX(1.0185)' node ...
 *
 * Prints the run's sub-pixel ink box in CANONICAL DEVICE PIXELS (the shot is
 * taken at deviceScaleFactor 2.170483, so image px are canonical px), plus the
 * element's own border-box origin, which is what `dx`/`dy` are measured from.
 */
import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const PORT = process.env.PORT || 3181
const ONLY = process.env.ONLY || '004'
const RUN = process.env.RUN
const CSS = process.env.CSS || ''
const OUT = process.env.OUT || ''
if (!RUN) throw new Error('RUN=<data-s4 name> is required')

const HERE = path.dirname(new URL(import.meta.url).pathname)
const map = JSON.parse(fs.readFileSync(path.join(HERE, 'ios-route-map.json'), 'utf8'))
const row = map.screens.find((r) => r.canonical.startsWith(ONLY))
if (!row) throw new Error(`no screen matches ONLY=${ONLY}`)

const base = 'http://localhost:' + PORT
const b = await chromium.launch({ args: ['--font-render-hinting=none'] })
const ctx = await b.newContext({
  viewport: { width: 393, height: 852 },
  deviceScaleFactor: 2.170483,
  isMobile: false,
  hasTouch: true,
})
await ctx.addInitScript(() => {
  const s = document.createElement('style')
  s.textContent = '*, *::before, *::after { caret-color: transparent !important; }'
  document.addEventListener('DOMContentLoaded', () => document.head.appendChild(s), { once: true })
})
const p = await ctx.newPage()
await p.goto(base + row.route, { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(Number(process.env.SETTLE || 2600))

for (const step of row.steps || []) {
  if (step.action === 'click') {
    await p.locator(step.selector).filter({ visible: true }).first().click({ timeout: 8000 })
  } else if (step.action === 'fill') {
    await p.locator(step.selector).filter({ visible: true }).first().fill(step.value, { timeout: 8000 })
  } else if (step.action === 'blur') {
    await p.evaluate(() => { const e = document.activeElement; if (e instanceof HTMLElement) e.blur() })
  }
  await p.waitForTimeout(400)
}

if (CSS) {
  // Appended last and marked !important so it beats the recipe's own
  // !important on size/leading. This is the part that is NOT the built
  // artefact — see the header.
  const decls = CSS.split(';').map((s) => s.trim()).filter(Boolean)
    .map((d) => (d.includes('!important') ? d : `${d} !important`)).join(';')
  await p.addStyleTag({ content: `.s4 [data-s4="${RUN}"]{${decls}}` })
  await p.waitForTimeout(300)
}

await p.mouse.move(2, 2)
const box = await p.evaluate((name) => {
  const el = document.querySelector(`[data-s4="${name}"]`)
  if (!el) return null
  const r = el.getBoundingClientRect()
  const cs = getComputedStyle(el)
  return { x: r.x, y: r.y, w: r.width, h: r.height, transform: cs.transform,
           fontSize: cs.fontSize, letterSpacing: cs.letterSpacing, wordSpacing: cs.wordSpacing }
}, RUN)
if (!box) throw new Error(`no element with data-s4="${RUN}"`)

const shot = OUT || `/tmp/probe-${RUN}.png`
await p.screenshot({ path: shot })
const S = 2.170483
console.log(JSON.stringify({
  run: RUN,
  css: CSS || null,
  boxCanonical: { x: box.x * S, y: box.y * S, w: box.w * S, h: box.h * S },
  computed: { transform: box.transform, fontSize: box.fontSize,
              letterSpacing: box.letterSpacing, wordSpacing: box.wordSpacing },
  shot,
}, null, 2))
await b.close()
