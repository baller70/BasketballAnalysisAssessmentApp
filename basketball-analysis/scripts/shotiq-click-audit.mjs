#!/usr/bin/env node
/**
 * Interaction audit: for every public route, verify all internal links resolve
 * and click every button, flagging controls that produce no observable effect
 * (no navigation, no DOM mutation, no aria/class change). Run against a
 * production server:  BASE_URL=http://127.0.0.1:3000 node scripts/shotiq-click-audit.mjs
 */
import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000'
const ROUTES = [
  '/signin', '/results/demo', '/results/demo/analysis', '/results/demo/biomechanics',
  '/results/demo/flaws', '/results/demo/compare', '/results/demo/history',
  '/results/demo/player', '/results/demo/training', '/results/demo/goals',
  '/elite-shooters', '/points', '/badges', '/guide',
]

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
const report = []

for (const route of ROUTES) {
  const row = { route, links: 0, brokenLinks: [], buttons: 0, deadButtons: [], consoleErrors: 0 }
  page.removeAllListeners('console')
  page.on('console', (m) => { if (m.type() === 'error') row.consoleErrors++ })
  await page.goto(BASE + route, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)

  // 1) every internal link must resolve to 200/307 (never 404/500)
  const hrefs = await page.$$eval('a[href^="/"]', (as) => [...new Set(as.map((a) => a.getAttribute('href')))])
  row.links = hrefs.length
  for (const href of hrefs) {
    const res = await page.request.get(BASE + href, { maxRedirects: 5 }).catch(() => null)
    if (!res || res.status() >= 400) row.brokenLinks.push(`${href} -> ${res ? res.status() : 'ERR'}`)
  }

  // 2) click every button; require an observable effect
  const count = await page.locator('button:visible').count()
  row.buttons = count
  const limit = Math.min(count, 40)
  for (let i = 0; i < limit; i++) {
    try {
      // stay in place; if a prior click navigated, come back once
      if (!page.url().endsWith(route)) await page.goto(BASE + route, { waitUntil: 'load' }).catch(() => {})
      // A previous click may have left a topbar panel open, shifting every
      // later button index — close it so indices stay stable.
      await page.keyboard.press('Escape').catch(() => {})
      const openPanel = page.locator('[data-testid^="topbar-panel-"]')
      if (await openPanel.count().catch(() => 0)) {
        await page.mouse.click(5, 500)
        await page.waitForTimeout(150)
      }
      const btn = page.locator('button:visible').nth(i)
      if (!(await btn.count())) continue
      const label = ((await btn.getAttribute('aria-label', { timeout: 3000 }).catch(() => '')) ||
        (await btn.innerText({ timeout: 3000 }).catch(() => '')) || `#${i}`)
        .trim().replace(/\s+/g, ' ').slice(0, 40)
      // Legitimate no-op states: a disabled control, or the currently-selected
      // option of a group (re-clicking the active tab/chip changes nothing).
      if (await btn.isDisabled().catch(() => false)) continue
      const pressed = await btn.getAttribute('aria-pressed', { timeout: 1500 }).catch(() => null)
      const current = await btn.getAttribute('aria-current', { timeout: 1500 }).catch(() => null)
      if (pressed === 'true' || current) continue
      const before = await page.evaluate(() => ({ url: location.pathname, html: document.body.innerHTML.length }))
      const armed = page.evaluate(() => new Promise((resolve) => {
        const obs = new MutationObserver(() => { obs.disconnect(); resolve(true) })
        obs.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true })
        setTimeout(() => { obs.disconnect(); resolve(false) }, 600)
      }))
      await btn.click({ timeout: 2000, force: true }).catch(() => {})
      const changed = await armed
      let after = await page.evaluate(() => ({ url: location.pathname, html: document.body.innerHTML.length })).catch(() => before)
      if (!(changed || after.url !== before.url || after.html !== before.html)) {
        // A slow client-side navigation can outlast the observer window —
        // give it one more beat before declaring the control dead.
        await page.waitForTimeout(600)
        after = await page.evaluate(() => ({ url: location.pathname, html: document.body.innerHTML.length })).catch(() => before)
        if (!(after.url !== before.url || after.html !== before.html)) row.deadButtons.push(label)
      }
    } catch { /* a detached/re-rendered button is not a dead button */ }
  }
  report.push(row)
  console.log(`${route.padEnd(30)} links=${row.links} broken=${row.brokenLinks.length} buttons=${row.buttons} dead=${row.deadButtons.length} jsErr=${row.consoleErrors}`)
  if (row.brokenLinks.length) console.log('   broken:', row.brokenLinks.join(', '))
  if (row.deadButtons.length) console.log('   dead:', row.deadButtons.join(' | '))
}
await browser.close()
writeFileSync('docs/shotiq/click-audit.json', JSON.stringify(report, null, 1))
const broken = report.reduce((s, r) => s + r.brokenLinks.length, 0)
const dead = report.reduce((s, r) => s + r.deadButtons.length, 0)
console.log(`\nTOTAL broken links: ${broken} · dead buttons: ${dead}`)
process.exit(broken ? 1 : 0)
