/**
 * The differential audit — categorical half (ledger rule F19).
 *
 * `audit-numbers.mjs` matches numeric shapes only, so a constant that is a WORD
 * survives every sweep. `/api/media` served `result: "Make"` and `hand: "Right"`
 * as hardcoded literals and was swept clean twice before this existed. This runs
 * the same signed-out/signed-in comparison over the app's data VOCABULARY.
 *
 *   RT='/media,/badges' node scripts/audit/audit-words.mjs
 *   PHONE=1 RT='/results/demo' node scripts/audit/audit-words.mjs
 *
 * IT IS NOISY AND CONFIRMING BY HAND IS NOT OPTIONAL. Matching is by substring,
 * so this vocabulary also appears in nav links ("Elite Shooters"), prose
 * ("Review and track your shooting performance"), column headings ("Make
 * percentage") and filter-rail options — all chrome, all identical by design.
 * Of the first five hits it ever produced, three were collisions of exactly
 * that kind and two were catalog names the account genuinely lacked. Acting on
 * the raw output would have "fixed" five correct screens.
 *
 * A canonical value present in BOTH states is also NOT a defect when the
 * signed-in account genuinely has no such data — check that the data exists
 * before calling anything a constant.
 */

import { chromium } from "playwright"

const BASE = process.env.BASE || "http://localhost:3000"
const ROUTES = (process.env.RT || "").split(",").filter(Boolean)
const EMAIL = process.env.EMAIL || "khouston721@gmail.com"
const PASSWORD = process.env.PASSWORD || "hunterrr"
const SETTLE = Number(process.env.SETTLE || 5600)

if (!ROUTES.length) {
  console.error("Set RT to a comma-separated route list, e.g. RT='/media,/badges'")
  process.exit(1)
}

/** Words this app uses as DATA rather than as chrome. */
const VOCAB = [
  "Make", "Miss", "Right Hand", "Left Hand", "Right-handed", "Left-handed",
  "iOS Capture", "Web Upload",
  "Analyzed", "Not analyzed", "Review", "Failed", "Processing",
  "Catch & Shoot", "Off the Dribble", "Pull-Up Jumper", "Spot-Up Three",
  "Transition Pull-Up", "Mid-Range Work", "Free Throw",
  "Beginner", "Intermediate", "Advanced", "Elite",
  "EXCELLENT", "GOOD", "FAIR", "NEEDS WORK", "NOT SCORED",
  "improving", "declining", "stable",
  "Right Corner", "Left Corner", "Top of Key", "Wing",
  "Jordan Ellis", "Klay Thompson", "Trae Young", "Stephen Curry",
  "Quick Release Builder", "Elbow Stack Holds", "Footwork Into Release",
]

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

const words = (t) => new Set(VOCAB.filter((w) => (t || "").includes(w)))

console.log(`route${" ".repeat(26)}| categorical tokens in BOTH states (confirm each by hand)`)
for (const route of ROUTES) {
  const a = words(signedOut[route].text)
  const b = words(signedIn[route].text)
  const both = [...a].filter((w) => b.has(w))
  const weak = !signedOut[route].text.trim() || signedOut[route].url.includes("/signin")
  if (both.length) {
    console.log(route.padEnd(30), "|", both.join(" · "), weak ? "  [F15: weak signal]" : "")
  }
}
await browser.close()
