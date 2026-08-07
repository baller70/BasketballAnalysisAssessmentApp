/**
 * Canonical iOS capture harness — the 72 phone screens at 393x852pt.
 *
 * Mirrors capture-web.mjs: a signed-out context for the screens that a session
 * would redirect away from, a signed-in context for everything else, and an md5
 * sweep at the end that fails loudly if two files come out identical.
 *
 * 001-007 MUST be shot in the anonymous context. `/signin` and `/signup` are in
 * middleware's AUTH_PAGES and redirect a signed-in user to `/`, and `/` then
 * routes a signed-in, profile-complete user on to /results/demo. Capturing them
 * authenticated silently produces the wrong screen — that has already happened
 * once on the web side (077 came out byte-identical to 083) and earned an F.
 * The md5 check at the end is what catches a redirect eating a screen.
 *
 * ---------------------------------------------------------------- viewport
 * 393x852 CSS pt at deviceScaleFactor 2.170483, so one output pixel is one
 * canonical pixel and the file lands 853 wide.
 *
 * `isMobile: false` is deliberate and counter-intuitive. Chromium's
 * `isMobile: true` is Android wide-viewport / overview mode: it widens the
 * LAYOUT viewport to content width (measured innerWidth 1450 on /signin) and
 * zooms out to fit, which makes `window.scrollTo` inert and puts controls
 * outside the visual viewport. iOS WKWebView does not do this — it keeps the
 * layout viewport at device-width. With `isMobile: false` + `hasTouch: true`,
 * innerWidth is 393, scrolling works, and `pointer: coarse` / `hover: none`
 * still match, so the app's own phone gates fire. Screenshots taken under both
 * settings were verified pixel-identical.
 *
 * `--font-render-hinting=none` is the shipping rasteriser. A bare launch hints
 * stems and shifts advances, which produced a false advance defect earlier.
 *
 * Before every shot the mouse is parked at (2,2) and `caret-color` is forced
 * transparent: a stray hover once baked a false "highlighted row" defect into a
 * screenshot, and a blinking caret is a nondeterministic pixel.
 */
import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const S = process.env.S
const OUT = process.env.OUT
const PORT = process.env.PORT || 3181
const APP = process.env.APP || '/home/user/BasketballAnalysisAssessmentApp/basketball-analysis'
const SETTLE = Number(process.env.SETTLE || 2600)

/**
 * THE ROUTE MAP IS READ FROM THIS SCRIPT'S OWN DIRECTORY — the committed file —
 * never from `S`.
 *
 * It used to be `S + '/ios-route-map.json'`, and that silently invalidated
 * every capture whose screen needed steps. `S` is the scratchpad: it does not
 * survive a container restart, nothing keeps it in step with the repo, and a
 * copy left there on one day drives the harness on the next. On 004 the
 * scratchpad copy was six hours stale and carried **no steps at all**, so the
 * fill/click/blur sequence that puts the form into canonical's FILLED state
 * never ran. The harness then reported `step fails 0` — truthfully, because
 * there were no steps to fail — and the screenshot was an empty form measured
 * against a filled canonical. That is a null presented as data, which is
 * exactly what ledger rule 30 forbids; the failure mode is worse than a crash
 * because every downstream number looks real.
 *
 * `S` stays what its name says: scratch. Outputs go to `OUT`. Inputs come from
 * the repo, so what runs is what was reviewed and committed.
 */
const HERE = path.dirname(fileURLToPath(import.meta.url))
const MAP_PATH = process.env.ROUTE_MAP || path.join(HERE, 'ios-route-map.json')
const map = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'))
console.log(`map   ${MAP_PATH}`)

/**
 * A screen whose canonical is a non-default state declares steps. If the map
 * says a selected screen has none, say so loudly rather than shooting whatever
 * the route happens to render: "no steps" and "steps ran" are indistinguishable
 * in the output image, and only one of them is a valid capture.
 */
const stepless = (rows) => rows.filter((r) => !(r.steps || []).length).map((r) => r.canonical)

/**
 * `ONLY=003` (or `ONLY=003,004`) shoots just those screens. The project works
 * one screen at a time, and a full 72-screen sweep to re-check the single
 * screen in progress costs minutes per iteration.
 *
 * The duplicate and gap checks are the reason this is a filter rather than a
 * separate script — they are what caught 072 coming back byte-identical to 048.
 * They still run and still hard-fail, but only across the screens selected, so
 * a one-screen run cannot detect a collision with a screen it did not shoot.
 * A filtered run therefore does NOT overwrite IOS-CAPTURE-LATEST.json, which
 * would otherwise erase the evidence that the full set was once clean, and it
 * says so in its closing line rather than printing a clean bill of health.
 */
const ONLY = (process.env.ONLY || '').split(',').map((s) => s.trim()).filter(Boolean)
const wanted = (r) => !ONLY.length || ONLY.some((o) => r.canonical.startsWith(o))
if (ONLY.length) {
  const rows = map.screens.filter(wanted)
  const hit = rows.map((r) => r.canonical)
  if (!hit.length) throw new Error(`ONLY=${ONLY.join(',')} matched no screen`)
  console.log(`ONLY  ${hit.join(', ')}`)
  for (const r of rows) {
    console.log(`steps ${r.canonical}: ${(r.steps || []).length}`)
  }
  const none = stepless(rows)
  if (none.length) {
    console.log(`NOTE  no steps declared for ${none.join(', ')} — if that screen's` +
                ' canonical is a non-default state, this capture is invalid.')
  }
}
const base = 'http://localhost:' + PORT
fs.mkdirSync(OUT, { recursive: true })

const VIEWPORT = { width: 393, height: 852 }
const CONTEXT = {
  viewport: VIEWPORT,
  deviceScaleFactor: 2.170483,
  isMobile: false,
  hasTouch: true,
}

/** Kill the caret and any transition on every document this context loads. */
const NO_CARET = () => {
  const css = '*, *::before, *::after { caret-color: transparent !important; }'
  const inject = () => {
    const s = document.createElement('style')
    s.setAttribute('data-harness', 'no-caret')
    s.textContent = css
    document.head.appendChild(s)
  }
  if (document.head) inject()
  else document.addEventListener('DOMContentLoaded', inject, { once: true })
}

const b = await chromium.launch({ args: ['--font-render-hinting=none'] })

async function newPage(sessionSeed) {
  const ctx = await b.newContext(CONTEXT)
  await ctx.addInitScript(NO_CARET)
  if (sessionSeed) {
    await ctx.addInitScript((kv) => {
      try {
        for (const k of Object.keys(kv)) sessionStorage.setItem(k, kv[k])
      } catch (e) { /* opaque origin */ }
    }, sessionSeed)
  }
  const p = await ctx.newPage()
  return p
}

/** Park the pointer, kill the caret again (in case of a client-side nav that
 *  replaced <head>), and put every scroller back at the top. */
async function quiesce(p) {
  await p.mouse.move(2, 2)
  await p.addStyleTag({ content: '*, *::before, *::after { caret-color: transparent !important; }' })
    .catch(() => {})
  await p.evaluate(() => {
    window.scrollTo(0, 0)
    document.querySelectorAll('*').forEach((el) => {
      if (el.scrollTop) el.scrollTop = 0
      if (el.scrollLeft) el.scrollLeft = 0
    })
  })
}

const meta = {}
const failures = []

async function shoot(p, row) {
  const name = row.canonical
  await p.mouse.move(2, 2)
  await p.goto(base + row.route, { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(SETTLE)

  const landed = new URL(p.url()).pathname + new URL(p.url()).search
  const wanted = row.route
  if (new URL(p.url()).pathname !== new URL(base + wanted).pathname) {
    failures.push(`${name}: asked for ${wanted}, landed on ${landed}`)
  }

  for (const step of row.steps || []) {
    try {
      if (step.action === 'click') {
        // Several testids exist on BOTH the phone tree and the hidden 1440pt
        // tree on the same route (the desktop one is display:none below md, not
        // unmounted), so a bare selector is ambiguous under strict mode. Take
        // the visible one — the control the player can actually tap.
        await p.locator(step.selector).filter({ visible: true }).first()
          .click({ timeout: 8000 })
      } else if (step.action === 'fill') {
        // Some canonical screens are captured in a FILLED state, not an empty
        // one. 003-sign-in is: it draws a typed address, a masked password, a
        // green ring and two validation lines, none of which exist before the
        // player types. Typing is the real user path to that state and it is
        // deterministic, so it is a step rather than a rendering default.
        await p.locator(step.selector).filter({ visible: true }).first()
          .fill(step.value, { timeout: 8000 })
      } else if (step.action === 'blur') {
        // A filled field is still focused, and a focus ring is a state the
        // canonical render does not show. Blur before the shot.
        await p.evaluate(() => {
          const el = document.activeElement
          if (el instanceof HTMLElement) el.blur()
        })
      } else if (step.action === 'setInputFiles') {
        await p.setInputFiles(step.selector, path.join(APP, step.file), { timeout: 8000 })
      } else {
        throw new Error('unknown step action ' + step.action)
      }
      await p.waitForTimeout(1400)
    } catch (e) {
      failures.push(`${name}: step ${step.action} ${step.selector} failed — ${e.message.split('\n')[0]}`)
    }
  }

  await quiesce(p)
  await p.screenshot({ path: `${OUT}/${name}.png` })

  meta[name] = {
    route: row.route,
    context: row.context,
    landed,
    steps: (row.steps || []).length,
    innerWidth: await p.evaluate(() => window.innerWidth),
    scrollWidth: await p.evaluate(() => document.documentElement.scrollWidth),
  }
}

// --- signed out: 001-007 ----------------------------------------------------
// A separate context means a separate cookie jar, so nothing this run does in
// the authenticated context can leak a session into these seven.
const anonRows = map.screens.filter((r) => r.context === 'anon' && wanted(r))
for (const row of anonRows) {
  const anon = await newPage(row.sessionStorage)
  await shoot(anon, row)
  await anon.context().close()
}

// --- signed in: 008-072 -----------------------------------------------------
// Skipped entirely when ONLY selects nothing here, so a one-screen run of an
// anon screen does not need Postgres up to succeed.
const authRows = map.screens.filter((r) => r.context === 'auth' && wanted(r))
if (authRows.length) {
  const p = await newPage()
  await p.goto(base + '/signin')
  await p.waitForTimeout(1600)
  await p.fill('[data-testid="signin-email"]', map.credentials.email)
  await p.fill('[data-testid="signin-password"]', map.credentials.password)
  await p.click('[data-testid="signin-submit"]')
  await p.waitForTimeout(4000)
  if (new URL(p.url()).pathname === '/signin') {
    throw new Error('sign-in did not take — still on /signin. Is Postgres up on 5433?')
  }
  for (const row of authRows) await shoot(p, row)
}
await b.close()

// --- verification -----------------------------------------------------------
const expected = map.screens.filter(wanted).map((r) => r.canonical + '.png').sort()
const got = fs.readdirSync(OUT).filter((f) => f.endsWith('.png')).sort()
const gaps = expected.filter((f) => !got.includes(f))

const seen = new Map()
const dupes = []
for (const f of got) {
  const h = crypto.createHash('md5').update(fs.readFileSync(`${OUT}/${f}`)).digest('hex')
  if (seen.has(h)) dupes.push(`${f} == ${seen.get(h)}`)
  else seen.set(h, f)
}

const wide = Object.entries(meta).filter(([, v]) => v.scrollWidth > 393 || v.innerWidth !== 393)

if (!ONLY.length) {
  fs.writeFileSync(S + '/IOS-CAPTURE-LATEST.json', JSON.stringify(
    { out: OUT, captured: got.length, distinct: seen.size, gaps, dupes, wide, failures, meta }, null, 1))
}

console.log(`captured   ${got.length} / ${expected.length}`)
console.log(`distinct   ${seen.size} md5s`)
console.log(`gaps       ${gaps.length}${gaps.length ? ' — ' + gaps.join(', ') : ''}`)
console.log(`step fails ${failures.length}${failures.length ? '\n  ' + failures.join('\n  ') : ''}`)
console.log(`wider>393  ${wide.length}${wide.length ? ' — ' + JSON.stringify(wide) : ''}`)

if (dupes.length) {
  throw new Error(`DUPLICATE CAPTURE:\n  ${dupes.join('\n  ')}\n— a redirect ate a screen`)
}
if (gaps.length) throw new Error(`MISSING ${gaps.length}: ${gaps.join(', ')}`)
console.log(ONLY.length
  ? `\nOK — ${got.length} screen(s). NOTE: a filtered run proves nothing about the other ${map.screens.length - got.length}.`
  : '\nOK — 72 screens, all hashes distinct.')
