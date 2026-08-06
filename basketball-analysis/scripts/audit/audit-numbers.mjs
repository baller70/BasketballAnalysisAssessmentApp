/**
 * The differential audit — numeric half.
 *
 * Load every route twice, signed out and signed in, and extract data-shaped
 * tokens. A value that is byte-identical in both states is a CANDIDATE
 * constant, because real data cannot survive signing in unchanged.
 *
 *   RT='/dashboard,/media' node scripts/audit/audit-numbers.mjs
 *   PHONE=1 RT='/results/demo' node scripts/audit/audit-numbers.mjs
 *
 * Batches of ~5 routes; more than that exceeds a typical tool timeout.
 *
 * THIS LIVED IN A SCRATCHPAD AND KEPT DYING WITH THE CONTAINER. The ledger
 * cites it by name as the tool that found most of the constants in the feature
 * log, and it was rebuilt from scratch three times. It is project tooling; it
 * belongs in the repo.
 *
 * KNOWN BLIND SPOTS, each learned the hard way — see the ledger's method rules:
 *  - F15: a route that redirects when signed out can never produce an identical
 *    token, so it always reads clean. Same for a route whose empty state
 *    renders no data at all. Those need the signed-in render checked against
 *    the canonical constant by hand.
 *  - F17: a viewport is a filter. Everything behind a responsive switch is
 *    invisible at the other breakpoint. Run it at both.
 *  - F19: this matches NUMERIC shapes only. Categorical constants — "Make",
 *    "Right", a status word — walk straight through. See audit-words.mjs.
 *  - The settle must be at least 5s. At 1.6s it reported two correct screens as
 *    defective because the history fetch had not resolved yet.
 */

import { chromium } from "playwright"

const BASE = process.env.BASE || "http://localhost:3000"
const ROUTES = (process.env.RT || "").split(",").filter(Boolean)
const EMAIL = process.env.EMAIL || "khouston721@gmail.com"
const PASSWORD = process.env.PASSWORD || "hunterrr"
const SETTLE = Number(process.env.SETTLE || 5600)

if (!ROUTES.length) {
  console.error("Set RT to a comma-separated route list, e.g. RT='/dashboard,/media'")
  process.exit(1)
}

/**
 * Percentages, clock times, dates, degrees — the shapes real data takes here.
 *
 * F25: THIS PATTERN USED TO END IN `\b` AND THAT MADE IT BLIND TO ITS OWN TWO
 * MOST COMMON CASES. `%` and `°` are non-word characters, so a trailing word
 * boundary can only match if a WORD character follows them — and in rendered
 * text a percentage or an angle is almost always at the end of its line. For
 * the whole life of this detector it matched clock times and dates and nothing
 * else, which is why every degree and percentage constant in the feature log
 * was found by eye or by reading source instead. The alternation now anchors
 * only where an anchor helps.
 */
const DATA = /(\d{1,3}\.\d%|\d{1,3}%|\b\d{1,2}:\d{2}\b|[A-Z][a-z]{2} \d{1,2}, 20\d\d|\d{2,4}°|\b\d+'\d+")/g

const browser = await chromium.launch()

async function grab(signedIn, viewport) {
  const context = await browser.newContext({
    viewport,
    ...(viewport.width < 500 ? { isMobile: true, hasTouch: true } : {}),
  })
  const page = await context.newPage()
  if (signedIn) {
    await page.goto(`${BASE}/signin`, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(1600)
    await page.locator('input[type="email"]').first().fill(EMAIL)
    await page.locator('input[type="password"]').first().fill(PASSWORD)
    await page.locator('button[type="submit"]').first().click()
    await page.waitForTimeout(5000)
  }
  const out = {}
  for (const route of ROUTES) {
    try {
      await page.goto(BASE + route, { waitUntil: "domcontentloaded" })
      await page.waitForTimeout(SETTLE)
      out[route] = { text: await page.evaluate(() => document.body.innerText), url: page.url() }
    } catch {
      out[route] = { text: "", url: "" }
    }
  }
  await context.close()
  return out
}

const viewport = process.env.PHONE ? { width: 393, height: 852 } : { width: 1440, height: 1000 }
const signedOut = await grab(false, viewport)
const signedIn = await grab(true, viewport)

console.log(`route${" ".repeat(26)}| identical data tokens (candidate constants)`)
for (const route of ROUTES) {
  const a = new Set((signedOut[route].text.match(DATA)) || [])
  const b = new Set((signedIn[route].text.match(DATA)) || [])
  const both = [...a].filter((t) => b.has(t))
  // F15: no comparison is possible when one state redirected or rendered nothing.
  const weak = !signedOut[route].text.trim() || signedOut[route].url.includes("/signin")
  if (both.length) {
    console.log(route.padEnd(30), "|", both.slice(0, 9).join(" "), weak ? "  [F15: weak signal]" : "")
  }
}
await browser.close()
