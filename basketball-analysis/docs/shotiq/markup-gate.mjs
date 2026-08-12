/**
 * THE MARKUP GATE — method rule 70, as a script instead of a good intention.
 *
 * Three consecutive rounds on screen 004 shipped a markup mechanism that broke
 * something no band mean could see:
 *
 *     round 10   display:inline-block   broke FIND
 *     round 11   51 per-glyph spans     broke READ  (accessibility tree)
 *     round 12   an sr-only duplicate   broke COPY  (sentence copied twice)
 *
 * Rule 66 wrote the enumeration after the first. Rule 68 recorded that writing
 * it had not been enough after the second. The third happened anyway, to the
 * same person, one round after writing rule 68 — and it happened while FIXING
 * the second. That is three data points saying the same thing: choosing which
 * checks to run, from memory, in the moment, selects the wrong three every
 * time, because the ones you skip are the ones you are confident about.
 *
 * Two of those three regressions made the PIXELS BETTER. A screen optimised
 * against a per-pixel objective drifts toward whatever that objective cannot
 * see; that is not carelessness, it is what optimisation does. So the check
 * cannot be chosen by the optimiser.
 *
 * Run this before any markup change ships on a live surface, and record the
 * output. It is not clever and it is not slow.
 *
 *   PORT=3212 ROUTE=/signup node docs/shotiq/markup-gate.mjs
 *
 * EVERY PROBE CARRIES A NEGATIVE CONTROL (rule 69). A pass from an instrument
 * with no case that should fail is a claim about the instrument, not the page —
 * round 11 reported find-in-page "verified" on a probe returning `scrollY > 0`
 * for a screen that cannot scroll, and it could not have failed.
 */
import { chromium } from 'playwright'

const PORT = process.env.PORT || 3212
const ROUTE = process.env.ROUTE || '/signup'
const URL_ = `http://127.0.0.1:${PORT}${ROUTE}`

/** Runs whose text is wrapped by a registration mechanism, and a phrase from
 *  each that spans at least one wrap boundary — the case that breaks. */
const PHRASES = [
  'I agree to the',        // terms, per-word, crosses a <Link> boundary
  'your ShotIQ',           // lede1, per-word
  'goals, and progress',   // lede2, per-word
  'web and iOS',           // oneacct, per-word
  'CREATE ACCOUNT',        // display, per-glyph
]
/** Unwrapped text on the same page: if these fail, the PROBE is broken. */
const POSITIVE = ['Use at least 8 characters', 'Repeat your password']
/** Not on the page at all: if these pass, the probe cannot discriminate. */
const NEGATIVE = ['zebra quantum sandwich', 'flibbertigibbet']

const results = []
const rec = (probe, ok, detail) => {
  results.push({ probe, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${probe.padEnd(28)} ${detail}`)
}

const b = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text'] })
const ctx = await b.newContext({
  viewport: { width: 393, height: 852 },
  deviceScaleFactor: 2.170483,
  isMobile: false,
  hasTouch: true,
  permissions: ['clipboard-read', 'clipboard-write'],
})
const p = await ctx.newPage()
await p.goto(URL_)
await p.waitForTimeout(1800)

// ---------------------------------------------------------------- 1. FIND ---
// window.find() is Blink's own text traversal. The text-fragment probe
// (`#:~:text=`) does NOT work headless — it returned false for unwrapped text
// and for a phrase that was not on the page, i.e. it discriminated nothing.
const find = (s) => p.evaluate((q) => {
  window.getSelection().removeAllRanges()
  return window.find(q, false, false, true, false, true, false)
}, s)
{
  const pos = []
  for (const s of POSITIVE) pos.push(await find(s))
  const neg = []
  for (const s of NEGATIVE) neg.push(await find(s))
  const hit = []
  for (const s of PHRASES) hit.push(await find(s))
  const controlsOk = pos.every(Boolean) && neg.every((v) => !v)
  rec('find (controls)', controlsOk, `positive ${pos.filter(Boolean).length}/${pos.length}, negative ${neg.filter(Boolean).length}/${neg.length} (want 0)`)
  rec('find (wrapped runs)', controlsOk && hit.every(Boolean),
      `${hit.filter(Boolean).length}/${hit.length} phrases found`)
}

// -------------------------------------------------------------- 2. SELECT ---
const selectRun = (sel) => p.evaluate((s) => {
  const el = document.querySelector(s)
  if (!el) return null
  const r = document.createRange()
  r.selectNodeContents(el)
  const g = window.getSelection()
  g.removeAllRanges()
  g.addRange(r)
  return { sel: g.toString().replace(/\s+/g, ' ').trim(), text: (el.innerText || '').replace(/\s+/g, ' ').trim() }
}, sel)   // <- THE ARGUMENT. Omitting it made `s` undefined, so every run came
          // back "missing" and the copy probe measured whatever the find probe
          // had left selected. The gate's own first run failed rule 69 — two of
          // its four failures were the instrument, not the page. Kept as a
          // comment because a gate that can report a false FAIL is as useless as
          // one that can only report PASS.
{
  const bad = []
  for (const s of ['[data-s4="lede1"]', '[data-s4="terms"]', '[data-s4="oneacct"]']) {
    const r = await selectRun(s)
    if (!r) { bad.push(`${s} missing`); continue }
    if (r.sel !== r.text) bad.push(`${s}: selection ${JSON.stringify(r.sel)} != innerText ${JSON.stringify(r.text)}`)
  }
  rec('select', bad.length === 0, bad.length ? bad.join(' | ') : 'selection matches innerText on every wrapped run')
}

// ---------------------------------------------------------------- 3. COPY ---
// The CLIPBOARD, not the Selection — they differ, and the difference is exactly
// what round 12 shipped: an sr-only duplicate is excluded from innerText but
// was included in the copy, so the lede came out twice.
{
  await selectRun('[data-s4="lede1"]')
  await p.keyboard.press('Control+C')
  await p.waitForTimeout(300)
  const clip = (await p.evaluate(() => navigator.clipboard.readText().catch(() => ''))).replace(/\s+/g, ' ').trim()
  const once = 'Create your ShotIQ account to save analyses,'
  const n = clip.split('save analyses,').length - 1
  rec('copy (no duplication)', n <= 1, `phrase appears ${n}x in the clipboard: ${JSON.stringify(clip.slice(0, 90))}`)
  rec('copy (fidelity)', clip.includes(once.slice(0, 30)), 'clipboard carries the run text')
}

// ---------------------------------------------------------------- 4. READ ---
// Node counts against an unwrapped control BUILT ON THIS PAGE, not against a
// remembered number: the control is the same DOM with the wrapping stripped.
{
  const cdp = await ctx.newCDPSession(p)
  await cdp.send('Accessibility.enable')
  const count = async () => {
    const { nodes } = await cdp.send('Accessibility.getFullAXTree')
    const st = nodes.filter((n) => n.role?.value === 'StaticText').map((n) => n.name?.value ?? '')
    return { total: st.length, single: st.filter((v) => v.trim().length === 1).length, names: st }
  }
  const live = await count()
  rec('read (no glyph shrapnel)', live.single <= 6,
      `${live.single} single-character StaticText nodes (the round-11 defect was 54)`)
  // The bar is that the run's TEXT survives in order, not that it is one node.
  // Per-WORD spans give one node per word and two graders accepted that; it is
  // the per-GLYPH shrapnel above that broke reading. Checking for a single
  // contiguous node would fail a configuration that is known good.
  const joined = live.names.join(' ').replace(/\s+/g, ' ')
  const wanted = 'Create your ShotIQ account to save analyses,'
  const inOrder = wanted.split(' ').every((w, i, a) =>
    joined.indexOf(w) >= 0 && (i === 0 || joined.indexOf(w) > joined.indexOf(a[i - 1])))
  rec('read (run text intact)', inOrder,
      inOrder ? 'lede words present and in order in the AX tree' : 'LEDE TEXT MISSING OR REORDERED')
  const h1 = (await cdp.send('Accessibility.getFullAXTree')).nodes.find((n) => n.role?.value === 'heading')
  rec('read (heading named)', !!h1?.name?.value, `h1 accessible name ${JSON.stringify(h1?.name?.value ?? null)}`)
}

// ----------------------------------------------------------- 5. TRANSLATE ---
// A translation engine works on text nodes, so the observable is how many the
// wrapping creates. The threshold is NOT a word count — that flagged `terms`
// for its trailing "." , which is a bare text node after </Link> that an
// unwrapped version has too. Declaring an exception for it would be the first
// step to a gate that passes by construction.
//
// Instead the probe builds its OWN control, in the page: clone the run, replace
// every registration span with its text, and count again. That is the node
// count the markup would have had without the mechanism, measured rather than
// assumed, so the comparison is exact and needs no tolerance.
{
  const t = await p.evaluate(() => {
    const countNodes = (el) => {
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      let c = 0
      while (w.nextNode()) if (w.currentNode.nodeValue.trim()) c++
      return c
    }
    const out = {}
    for (const n of ['lede1', 'lede2', 'oneacct', 'terms', 'display']) {
      const el = document.querySelector(`[data-s4="${n}"]`)
      if (!el) continue
      const clone = el.cloneNode(true)
      // the control: unwrap every registration span, keep everything else
      for (const sp of Array.from(clone.querySelectorAll('span.s4w')))
        sp.replaceWith(document.createTextNode(sp.textContent))
      clone.normalize()
      out[n] = { live: countNodes(el), control: countNodes(clone) }
    }
    return out
  })
  // THIS IS A REGRESSION GATE, NOT A QUALITY GATE, and the distinction matters.
  //
  // Every registration mechanism fragments text nodes — that is what it is. The
  // per-word runs go 1 node to 7, and `display` goes 1 to 13. There is no
  // threshold that calls the first acceptable and the second not without simply
  // encoding somebody's opinion, and a gate whose exceptions are chosen until it
  // passes has stopped being evidence.
  //
  // So the accepted state is RECORDED, and the gate fails on any DEVIATION from
  // it. Changing these numbers is allowed; changing them silently is not.
  //
  // The accepted cost, stated plainly so it is a decision and not an oversight:
  // machine translation sees seven fragments where it should see one sentence,
  // and engines translate fragments independently — word order and agreement
  // suffer in languages that reorder. The app ships English only today. The
  // mechanism buys 0.1302 of whole-screen fidelity on the four per-word runs and
  // 0.2437 on the headline. If the app is ever localised, this is the first
  // thing to revisit, and the fix is to drop the per-word layer on the body runs
  // and keep it on the headline.
  const ACCEPTED = { lede1: 7, lede2: 4, oneacct: 6, terms: 11, display: 13 }
  const drift = Object.entries(t).filter(([k, v]) => ACCEPTED[k] !== undefined && v.live !== ACCEPTED[k])
  const undeclared = Object.entries(t).filter(([k]) => ACCEPTED[k] === undefined)
  rec('translate (no drift)', drift.length === 0 && undeclared.length === 0,
      Object.entries(t).map(([k, v]) => `${k} ${v.live}/${v.control}`).join(' ') +
      (drift.length ? ` — DRIFT from accepted: ${drift.map(([k, v]) => `${k} ${v.live}!=${ACCEPTED[k]}`).join(', ')}` : '') +
      (undeclared.length ? ` — UNDECLARED run: ${undeclared.map(([k]) => k).join(',')}` : ' (live/unwrapped-control, all at the recorded values)'))
}

// -------------------------------------------------------------- 6. REFLOW ---
// The size invariant, at BOTH device pixel ratios the app actually meets.
{
  const bad = []
  for (const dpr of [2, 3]) {
    const c2 = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: dpr, hasTouch: true })
    const p2 = await c2.newPage()
    await p2.goto(URL_)
    await p2.waitForTimeout(1500)
    const m = await p2.evaluate(() => ({
      w: document.documentElement.scrollWidth,
      h: document.documentElement.scrollHeight,
      iw: window.innerWidth,
      ih: window.innerHeight,
    }))
    if (m.w > m.iw || m.h > m.ih + 1) bad.push(`DPR${dpr} ${m.w}x${m.h} vs ${m.iw}x${m.ih}`)
    await c2.close()
  }
  rec('reflow (DPR 2 and 3)', bad.length === 0, bad.length ? bad.join(' | ') : 'no overflow at either DPR')
}

await b.close()

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} probes passed`)
if (failed.length) {
  console.log('FAILED: ' + failed.map((f) => f.probe).join(', '))
  process.exit(1)
}
