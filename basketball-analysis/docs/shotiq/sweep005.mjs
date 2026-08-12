/**
 * In-page sweeper for 005-verify-email.
 *
 * Same contract as `sweep-run.mjs` and the same three defences, because all
 * three were learned the hard way on 004:
 *
 *   rule 40  EVERY run carries a CONTROL candidate at the recipe's own values.
 *            It must reproduce the built capture's band figure; if it does not,
 *            nothing else in the run is trustworthy.
 *   rule 55  the injected sheet is appended to the END OF <body>, after the
 *            recipe's own <style>, because PHONE_CSS marks some runs
 *            `!important` and equal specificity + equal importance is decided
 *            by document order.
 *   rule 40  each candidate's post-injection computed style is READ BACK and
 *            printed, so "these two candidates differed" is checkable rather
 *            than assumed.
 *
 * The page is driven through the SAME steps the route map declares, so the
 * sweep measures the state canonical is in rather than an empty form.
 *
 *   PORT=3209 SPEC=spec.json OUT=dir node docs/shotiq/sweep005.mjs
 *
 * SPEC is { "band": "display", "sel": "[data-s5=\\"display\\"]",
 *           "candidates": [ {"name":"control","css":{...}}, ... ] }
 */
import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const PORT = process.env.PORT || 3209
const SPEC = JSON.parse(fs.readFileSync(process.env.SPEC, 'utf8'))
const OUT = process.env.OUT || '/tmp/sweep005'
const ROUTE = process.env.ROUTE || '/verify-email?email=marcus%40example.com'
fs.mkdirSync(OUT, { recursive: true })

const STEPS = [
  ['verify-code-0', '2'], ['verify-code-1', '8'], ['verify-code-2', '4'], ['verify-code-3', '7'],
]

const b = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text'] })
const index = []
for (const cand of SPEC.candidates) {
  const ctx = await b.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2.170483,
    isMobile: false,
    hasTouch: true,
  })
  await ctx.addInitScript(() => {
    const s = document.createElement('style')
    s.textContent = '*, *::before, *::after { caret-color: transparent !important; }'
    if (document.head) document.head.appendChild(s)
    else document.addEventListener('DOMContentLoaded', () => document.head.appendChild(s), { once: true })
  })
  await ctx.addInitScript(() => { try { sessionStorage.setItem('shotiq-verify-cooldown', '42') } catch { /* opaque */ } })
  const p = await ctx.newPage()
  await p.goto(`http://localhost:${PORT}${ROUTE}`, { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(2600)
  for (const [tid, v] of STEPS) {
    await p.locator(`[data-testid="${tid}"]`).filter({ visible: true }).first().fill(v, { timeout: 8000 })
    await p.waitForTimeout(250)
  }
  await p.locator('[data-testid="verify-code-4"]').filter({ visible: true }).first().click({ timeout: 8000 })
  await p.waitForTimeout(900)

  const decls = Object.entries(cand.css).map(([k, v]) => `${k}:${v} !important`).join(';')
  const readback = await p.evaluate(({ sel, decls, sels }) => {
    const st = document.createElement('style')
    st.setAttribute('data-sweep', '1')
    st.textContent = `${sel}{${decls}}`
    document.body.appendChild(st)   // END of body: it must win the cascade
    const targets = (sels || [sel]).map((s) => document.querySelector(s)).filter(Boolean)
    return targets.map((el) => {
      const cs = getComputedStyle(el)
      const r = el.getBoundingClientRect()
      return {
        fontFamily: cs.fontFamily, fontSize: cs.fontSize, fontWeight: cs.fontWeight,
        transform: cs.transform, letterSpacing: cs.letterSpacing, wordSpacing: cs.wordSpacing,
        rect: [+r.x.toFixed(3), +r.y.toFixed(3), +r.width.toFixed(3), +r.height.toFixed(3)],
      }
    })
  }, { sel: SPEC.sel, decls, sels: SPEC.sels })
  await p.mouse.move(2, 2)
  await p.evaluate(() => { window.scrollTo(0, 0) })
  await p.screenshot({ path: path.join(OUT, `${cand.name}.png`) })
  await ctx.close()
  index.push({ name: cand.name, css: cand.css, readback })
  console.log(`${cand.name.padEnd(22)} ${JSON.stringify(readback[0])}`)
}
await b.close()
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 1))
console.log(`\n${index.length} candidates -> ${OUT}`)
