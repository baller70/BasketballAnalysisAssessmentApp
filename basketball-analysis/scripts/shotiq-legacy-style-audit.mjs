#!/usr/bin/env node
/**
 * Legacy-style audit — finds OLD design language still rendering anywhere.
 *
 * The canonical system uses the ShotIQ tokens (#FF5A1F orange, #D9D9D4 rules,
 * ink/graphite text, 6/8px radii). The legacy app used #FF6B35 orange,
 * slate-* grays, rounded-xl/2xl cards and gradients. This audit walks every
 * route signed-in and counts legacy markers in the *rendered* DOM, so a page
 * that merely sits inside the new shell but keeps old-styled content is
 * caught — exactly the "settings looks old" class of bug.
 *
 *   SUFFIX=$RANDOM node scripts/shotiq-legacy-style-audit.mjs
 */
import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000'
const SUFFIX = process.env.SUFFIX || String(process.pid)

const ROUTES = [
  '/signin', '/signup', '/onboarding', '/dashboard', '/analyze', '/media',
  '/profile', '/settings', '/upload', '/video-analysis', '/video-analysis/upload',
  '/training/drills', '/training/calendar', '/training/drills/quick-release-builder',
  '/elite-shooters', '/elite-shooters/stephen-curry', '/results/demo',
  '/results/demo/analysis', '/results/demo/biomechanics', '/results/demo/flaws',
  '/results/demo/compare', '/results/demo/history', '/results/demo/player',
  '/results/demo/training', '/results/demo/goals', '/points', '/badges',
  '/guide', '/terms', '/privacy', '/forgot-password', '/reset-password',
  '/verify-email',
]

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
})
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await context.grantPermissions(['camera'])
const page = await context.newPage()

await page.goto(BASE + '/signup', { waitUntil: 'load' })
await page.getByTestId('signup-email').fill(`style-${SUFFIX}@shotiq.test`)
await page.getByTestId('signup-password').fill('audit-pass-1234')
await page.getByTestId('signup-confirm-password').fill('audit-pass-1234')
await page.getByTestId('signup-agree').check()
await page.getByTestId('signup-submit').click()
await page.waitForURL('**/onboarding', { timeout: 15000 })

const report = []
for (const route of ROUTES) {
  await page.goto(BASE + route, { waitUntil: 'load' }).catch(() => {})
  await page.waitForTimeout(500)
  const counts = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'))
    const cls = (el) => (typeof el.className === 'string' ? el.className : '')
    const count = (re) => all.filter((el) => re.test(cls(el))).length
    return {
      legacyOrange: count(/FF6B35|E55A2B|FF8C5A|FF4500/),
      slate: count(/(^|[\s:])(bg|text|border|divide)-slate-/),
      legacyGray: count(/(^|[\s:])(bg|text|border)-gray-\d/),
      bigRadius: count(/rounded-(xl|2xl|3xl)(\s|$)/),
      gradients: count(/bg-gradient-to-/),
      legacyDark: count(/#1a1a1a|#2a2a2a|#0a0a0a|#2C2C2C|#030303/),
    }
  })
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  report.push({ route, total, ...counts })
  const detail = Object.entries(counts).filter(([, v]) => v > 0)
    .map(([k, v]) => `${k}=${v}`).join(' ')
  console.log(`${route.padEnd(42)} legacy=${String(total).padStart(3)}  ${detail}`)
}
await browser.close()
writeFileSync('docs/shotiq/legacy-style-audit.json', JSON.stringify(report, null, 1))
const total = report.reduce((s, r) => s + r.total, 0)
console.log(`\nTOTAL legacy-style elements: ${total}`)
