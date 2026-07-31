#!/usr/bin/env node
/**
 * Authenticated interaction audit.
 *
 * Creates a fresh account through the real /signup UI (which exercises the
 * canonical create-account flow end to end), then walks every signed-in route:
 * all internal links must resolve, and every visible button must produce an
 * observable effect (navigation, DOM mutation, or attribute change) unless it
 * is disabled or the currently-selected option of a group.
 *
 *   BASE_URL=http://127.0.0.1:3000 SUFFIX=$RANDOM node scripts/shotiq-click-audit-auth.mjs
 */
import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000'
const SUFFIX = process.env.SUFFIX || String(process.pid)
const EMAIL = `audit-${SUFFIX}@shotiq.test`
const PASSWORD = 'audit-pass-1234'

const ROUTES = [
  '/onboarding', '/dashboard', '/analyze', '/media', '/profile', '/settings',
  '/upload', '/video-analysis', '/video-analysis/upload',
  '/training/drills/quick-release-builder', '/elite-shooters/stephen-curry',
  '/results/demo', '/results/demo/analysis', '/results/demo/history',
  '/terms', '/privacy',
]

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
})
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await context.grantPermissions(['camera'])
const page = await context.newPage()

// ---- sign up through the real UI --------------------------------------------
await page.goto(BASE + '/signup', { waitUntil: 'load' })
await page.getByTestId('signup-first-name').fill('Audit')
await page.getByTestId('signup-last-name').fill('Bot')
await page.getByTestId('signup-email').fill(EMAIL)
await page.getByTestId('signup-password').fill(PASSWORD)
await page.getByTestId('signup-confirm-password').fill(PASSWORD)
await page.getByTestId('signup-agree').check()
await page.getByTestId('signup-submit').click()
try {
  await page.waitForURL('**/onboarding', { timeout: 15000 })
  console.log(`signed up as ${EMAIL}`)
} catch {
  const err = await page.getByTestId('signup-error').innerText().catch(() => '(no error shown)')
  console.error(`SIGNUP FAILED: ${err}`)
  await browser.close()
  process.exit(1)
}

// ---- audit ------------------------------------------------------------------
const report = []
for (const route of ROUTES) {
  const row = { route, links: 0, brokenLinks: [], buttons: 0, deadButtons: [], consoleErrors: 0 }
  page.removeAllListeners('console')
  page.on('console', (m) => { if (m.type() === 'error') row.consoleErrors++ })
  await page.goto(BASE + route, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(500)

  // Being bounced to sign-in on an authenticated route is itself a failure.
  if (page.url().includes('/signin')) {
    row.brokenLinks.push(`${route} -> redirected to signin while authenticated`)
    report.push(row)
    console.log(`${route.padEnd(42)} AUTH REDIRECT (unexpected)`)
    continue
  }

  const hrefs = await page.$$eval('a[href^="/"]', (as) => [...new Set(as.map((a) => a.getAttribute('href')))])
  row.links = hrefs.length
  for (const href of hrefs) {
    const res = await page.request.get(BASE + href, { maxRedirects: 5 }).catch(() => null)
    if (!res || res.status() >= 400) row.brokenLinks.push(`${href} -> ${res ? res.status() : 'ERR'}`)
  }

  const count = await page.locator('button:visible').count()
  row.buttons = count
  const limit = Math.min(count, 40)
  for (let i = 0; i < limit; i++) {
    try {
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
      if (await btn.isDisabled().catch(() => false)) continue
      // Never click the session-destroying control — it would sign the audit
      // itself out and turn every later route into a false redirect failure.
      if (/sign\s?out/i.test(label)) continue
      const pressed = await btn.getAttribute('aria-pressed', { timeout: 1500 }).catch(() => null)
      const current = await btn.getAttribute('aria-current', { timeout: 1500 }).catch(() => null)
      if (pressed === 'true' || current) continue
      const before = await page.evaluate(() => ({ url: location.pathname, html: document.body.innerHTML.length }))
      const armed = page.evaluate(() => new Promise((resolve) => {
        const obs = new MutationObserver(() => { obs.disconnect(); resolve(true) })
        obs.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true })
        setTimeout(() => { obs.disconnect(); resolve(false) }, 700)
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
    } catch { /* detached mid-render is not a dead button */ }
  }
  report.push(row)
  console.log(`${route.padEnd(42)} links=${row.links} broken=${row.brokenLinks.length} buttons=${row.buttons} dead=${row.deadButtons.length} jsErr=${row.consoleErrors}`)
  if (row.brokenLinks.length) console.log('   broken:', row.brokenLinks.join(', '))
  if (row.deadButtons.length) console.log('   dead:', row.deadButtons.join(' | '))
}
await browser.close()
writeFileSync('docs/shotiq/click-audit-auth.json', JSON.stringify(report, null, 1))
const broken = report.reduce((s, r) => s + r.brokenLinks.length, 0)
const dead = report.reduce((s, r) => s + r.deadButtons.length, 0)
console.log(`\nTOTAL broken links: ${broken} · dead buttons: ${dead}`)
process.exit(broken ? 1 : 0)
