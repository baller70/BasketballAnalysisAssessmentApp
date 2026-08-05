/**
 * sweep-run.mjs — evaluate many CSS candidates for ONE run in a single page
 * load, scoring each by the band's mean |d| against canonical.
 *
 * WHY THE BAND MEAN AND NOT THE EDGES. Solving 004's display run, two
 * estimators disagreed about the same parameter: the sub-pixel advance
 * crossings preferred tx=-0.2226 (mean edge error 0.309 vs 0.434), while the
 * per-pixel band mean preferred tx=0 (15.67 vs 17.14). Both are correct about
 * what they measure. The advance looks at four numbers — the outermost ink
 * crossings of the whole run — and is blind to where the thirteen glyphs sit
 * between them; the band mean integrates every pixel. Fidelity is the band
 * mean, so that is the objective here. Use the crossings to UNDERSTAND a
 * defect (they told us the advance ratio was 1.1928 and the height ratio
 * 1.0009, which is what identified horizontal scale as the cause); use the
 * band mean to CHOOSE between candidates that are already close.
 *
 * Same caveat as probe-run.mjs: injected CSS is not the built artefact. Solve
 * here, write the numbers into the recipe, rebuild, re-capture, report from
 * the capture.
 *
 *   PORT=3181 ONLY=004 RUN=display BAND=148,220,0,853 \
 *     CANDIDATES=/path/candidates.json OUT=/path/out node docs/shotiq/sweep-run.mjs
 *
 * `candidates.json` is `[{"label":"...", "css":"..."}, ...]`. Each is applied
 * as its own stylesheet, screenshotted, then removed, so candidates cannot
 * contaminate one another.
 */
import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const PORT = process.env.PORT || 3181
const ONLY = process.env.ONLY || '004'
const RUN = process.env.RUN
const OUT = process.env.OUT
const CAND = process.env.CANDIDATES
if (!RUN || !OUT || !CAND) throw new Error('RUN, OUT and CANDIDATES are required')

const HERE = path.dirname(new URL(import.meta.url).pathname)
const map = JSON.parse(fs.readFileSync(path.join(HERE, 'ios-route-map.json'), 'utf8'))
const row = map.screens.find((r) => r.canonical.startsWith(ONLY))
if (!row) throw new Error(`no screen matches ONLY=${ONLY}`)
const candidates = JSON.parse(fs.readFileSync(CAND, 'utf8'))
fs.mkdirSync(OUT, { recursive: true })

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
await p.mouse.move(2, 2)

const index = []
for (const [i, c] of candidates.entries()) {
  // `css` is either a string applied to every run in RUN, or a per-run map
  // {runName: cssString}. Two runs in one band usually SHARE their type
  // (solve jointly, rule 14) but almost never share their position: 004's two
  // lede lines needed the same size and scale and different placements, and
  // one shared rule cannot express that.
  const perRun = typeof c.css === 'string'
    ? Object.fromEntries(RUN.split(',').map((r) => [r.trim(), c.css]))
    : c.css
  const imp = (css) => css.split(';').map((s) => s.trim()).filter(Boolean)
    .map((d) => (d.includes('!important') ? d : `${d} !important`)).join(';')
  const decls = Object.fromEntries(Object.entries(perRun).map(([k, v]) => [k, imp(v)]))
  // RUN may name several runs ("lede1,lede2"). A band that holds two runs set
  // at one size must be solved JOINTLY (ledger rule 14): fitting each line on
  // its own lets two different sizes both look locally plausible while the
  // block reads wrong, which is how 004's five micro-cap labels were solved.
  await p.evaluate(({ decls }) => {
    let el = document.getElementById('__sweep')
    if (!el) { el = document.createElement('style'); el.id = '__sweep'; document.head.appendChild(el) }
    el.textContent = Object.entries(decls)
      .map(([r, d]) => `.s4 [data-s4="${r}"]{${d}}`).join('\n')
  }, { decls })
  await p.waitForTimeout(220)

  // READ THE CANDIDATE BACK BEFORE BELIEVING THE SHOT.
  //
  // A sweep of 81 monogram candidates returned 9.5756 for the winner, and
  // six DIFFERENT (left, top) inputs all returned that same number to four
  // decimals. Re-run on its own, the same CSS reproduced 20.9480 four times —
  // worse than the unmodified baseline. The first figure was not a measurement
  // of anything; it was the page in some other state, and it happened to look
  // like an improvement, which is the direction that gets acted on.
  //
  // So each candidate now records the element's own post-injection geometry.
  // A scorer can assert that the geometry actually CHANGED between candidates
  // that were supposed to differ, and identical geometry across different
  // inputs is proof the run is not measuring what it claims.
  const applied = await p.evaluate((runs) => {
    const out = {}
    for (const r of runs) {
      const el = document.querySelector(`[data-s4="${r}"]`)
      if (!el) { out[r] = null; continue }
      const b = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      out[r] = { x: +b.x.toFixed(3), y: +b.y.toFixed(3),
                 w: +b.width.toFixed(3), h: +b.height.toFixed(3),
                 fontSize: cs.fontSize, transform: cs.transform }
    }
    return out
  }, RUN.split(',').map((s) => s.trim()).filter(Boolean))

  const file = path.join(OUT, `c${String(i).padStart(3, '0')}.png`)
  await p.screenshot({ path: file })
  index.push({ label: c.label, css: c.css, file, applied })
}
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 2))
console.log(`${index.length} candidates -> ${OUT}`)
await b.close()
