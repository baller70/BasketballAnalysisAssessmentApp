#!/usr/bin/env node
/**
 * Affordance audit — finds everything that LOOKS clickable but is not wired.
 *
 * The click audits verify real <button>/<a> elements. Users, however, click
 * anything with a visual affordance: chevrons, three-dot icons, "View all"
 * text, thumbnails, table rows. This audit walks every route (signed in) and
 * flags elements that carry an affordance signal but have no interactive
 * ancestor (a[href], button, [role=button], summary, label[for], input/select).
 *
 * Signals:
 *  - lucide/svg icons outside interactive elements (excluding aria-hidden
 *    decorations inside plain text blocks is impossible mechanically, so
 *    icon findings are listed for human triage rather than failed on)
 *  - action text: view all|see all|show more|load more|more|edit|manage|"›"|"…"
 *  - elements styled cursor-pointer without an interactive ancestor
 *
 *   SUFFIX=$RANDOM node scripts/shotiq-affordance-audit.mjs
 */
import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000'
const SUFFIX = process.env.SUFFIX || String(process.pid)

const ROUTES = [
  '/signin', '/signup', '/onboarding', '/dashboard', '/analyze', '/media',
  '/profile', '/settings', '/upload', '/video-analysis', '/video-analysis/upload',
  '/training/drills/quick-release-builder', '/elite-shooters',
  '/elite-shooters/stephen-curry', '/results/demo', '/results/demo/analysis',
  '/results/demo/biomechanics', '/results/demo/flaws', '/results/demo/compare',
  '/results/demo/history', '/results/demo/player', '/results/demo/training',
  '/results/demo/goals', '/points', '/guide', '/terms', '/privacy',
]

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
})
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await context.grantPermissions(['camera'])
const page = await context.newPage()

// sign up so authenticated routes render their real content
await page.goto(BASE + '/signup', { waitUntil: 'load' })
await page.getByTestId('signup-email').fill(`afford-${SUFFIX}@shotiq.test`)
await page.getByTestId('signup-password').fill('audit-pass-1234')
await page.getByTestId('signup-confirm-password').fill('audit-pass-1234')
await page.getByTestId('signup-agree').check()
await page.getByTestId('signup-submit').click()
await page.waitForURL('**/onboarding', { timeout: 15000 })

const report = []
for (const route of ROUTES) {
  await page.goto(BASE + route, { waitUntil: 'load' }).catch(() => {})
  await page.waitForTimeout(600)
  const rows = await page.evaluate(() => {
    const INTERACTIVE = 'a[href], button, [role="button"], summary, label, input, select, textarea, [onclick]'
    const out = []
    const seen = new Set()
    const push = (kind, el, note) => {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) return
      const text = (el.getAttribute('aria-label') || el.textContent || note || '')
        .trim().replace(/\s+/g, ' ').slice(0, 60)
      const key = `${kind}|${text}|${Math.round(r.x)}x${Math.round(r.y)}`
      if (seen.has(key)) return
      seen.add(key)
      out.push({ kind, text: text || note, tag: el.tagName.toLowerCase() })
    }
    // 1) action-text outside interactive elements
    const ACTION = /^(view all( \w+)*|see all|show more|load more|view details|view full \w+|manage|edit|\.\.\.|…|›|‹|\+\d+)$/i
    for (const el of document.querySelectorAll('span, div, p')) {
      if (el.children.length > 0) continue
      const t = (el.textContent || '').trim()
      if (!t || t.length > 30 || !ACTION.test(t)) continue
      if (el.closest(INTERACTIVE)) continue
      push('action-text', el)
    }
    // 2) svg icons outside interactive elements (skip aria-hidden decorations
    //    that sit inside text blocks — keep standalone ones)
    for (const svg of document.querySelectorAll('svg.lucide, svg[class*="lucide"]')) {
      if (svg.closest(INTERACTIVE)) continue
      const parent = svg.parentElement
      if (!parent) continue
      const siblingsText = (parent.textContent || '').trim()
      // an icon with no accompanying text is a pure affordance
      if (siblingsText === '') push('bare-icon', parent, svg.getAttribute('class') || 'svg')
    }
    // 3) cursor-pointer without interactive ancestor
    for (const el of document.querySelectorAll('[class*="cursor-pointer"]')) {
      if (el.closest(INTERACTIVE)) continue
      if (el.querySelector(INTERACTIVE)) continue
      push('pointer-style', el)
    }
    return out
  })
  report.push({ route, findings: rows })
  console.log(`${route.padEnd(42)} findings=${rows.length}`)
  for (const f of rows) console.log(`   [${f.kind}] <${f.tag}> ${f.text}`)
}
await browser.close()
writeFileSync('docs/shotiq/affordance-audit.json', JSON.stringify(report, null, 1))
const total = report.reduce((s, r) => s + r.findings.length, 0)
console.log(`\nTOTAL affordance findings: ${total}`)
