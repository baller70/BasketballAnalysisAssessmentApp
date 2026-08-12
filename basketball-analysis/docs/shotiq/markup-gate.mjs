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
/** Every run carrying a registration mechanism. ONE list, shared by select,
 *  translate and read, so a run cannot be covered by one probe and invisible to
 *  another — which is how `user-select:none` on lede2 passed a 10/10. */
const RUNS = ['lede1', 'lede2', 'oneacct', 'terms', 'display']

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

// ------------------------------------------------------------- SELF-TEST ---
// THE GATE SHIPS WITH ITS OWN SHOULD-FAIL CASES, because rule 69 applies to the
// gate before it applies to anything the gate looks at, and because an audit
// found four regressions this file returned 10/10 on. Every one of those is
// reproduced here. `MUTATE=<name>` breaks the page in a specific way; the
// corresponding probe MUST go red. `MUTATE=all` lists them.
//
//   ariaLabel    strip the h1's aria-label      -> read (heading named)
//   labels       strip every label's `for`      -> read (controls named)
//   selectLede2  user-select:none on lede2      -> select
//   selectH1     user-select:none on display    -> select
//   deleteRun    remove lede2 from the DOM      -> translate, find
//
// Verify the gate after ANY change to it:
//   for m in ariaLabel labels selectLede2 selectH1 deleteRun; do
//     MUTATE=$m node docs/shotiq/markup-gate.mjs >/dev/null || echo "$m caught"
//   done
const MUTATE = process.env.MUTATE || ''
if (MUTATE === 'all') {
  console.log('mutations: ariaLabel labels selectLede2 selectH1 deleteRun')
  process.exit(0)
}
if (MUTATE) {
  await p.evaluate((m) => {
    const css = (sel, decl) => {
      const st = document.createElement('style')
      st.textContent = `${sel}{${decl}}`
      document.body.appendChild(st)
    }
    if (m === 'ariaLabel') document.querySelector('h1[data-s4="display"]')?.removeAttribute('aria-label')
    if (m === 'labels') document.querySelectorAll('label[for]').forEach((l) => l.removeAttribute('for'))
    if (m === 'selectLede2') css('[data-s4="lede2"]', 'user-select:none;-webkit-user-select:none')
    if (m === 'selectH1') css('[data-s4="display"]', 'user-select:none;-webkit-user-select:none')
    if (m === 'deleteRun') document.querySelector('[data-s4="lede2"]')?.remove()
  }, MUTATE)
  await p.waitForTimeout(400)
  console.log(`MUTATION ACTIVE: ${MUTATE} — the matching probe must FAIL\n`)
}

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
  // ALL FIVE declared runs. It used to list three, so `user-select:none` on
  // lede2 or on the headline emptied the selection and the gate passed.
  for (const s of RUNS.map((n) => `[data-s4="${n}"]`)) {
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
  const tree = (await cdp.send('Accessibility.getFullAXTree')).nodes
  const h1 = tree.find((n) => n.role?.value === 'heading')
  // `.trim()`, and it is not a nicety. Strip the h1's aria-label and its name
  // becomes "  " — every glyph span is aria-hidden, so the label is its ONLY
  // name source. `!!"  "` is true, so this probe PRINTED `h1 accessible name
  // "  "` on its passing line. It rendered the evidence of its own failure and
  // called it PASS, which is the exact rule-69 failure this file's header warns
  // about, in the probe that had no negative control.
  rec('read (heading named)', !!h1?.name?.value?.trim(),
      `h1 accessible name ${JSON.stringify(h1?.name?.value ?? null)}`)

  // G4 — form controls. Nothing covered the highest-stakes a11y surface on a
  // signup screen: strip every `label for=` and all five textboxes fall back to
  // their PLACEHOLDERS as accessible names ("Jordan", "Ellis",
  // "jordan.ellis@example.com"), which reads as pre-filled data rather than as a
  // prompt, and disappears the moment the user types.
  const placeholders = await p.$$eval('input[placeholder]', (els) =>
    els.map((e) => e.getAttribute('placeholder')))
  const fields = tree.filter((n) => ['textbox', 'checkbox'].includes(n.role?.value))
  const unnamed = fields.filter((n) => !n.name?.value?.trim())
  const placeholderNamed = fields.filter((n) => placeholders.includes(n.name?.value?.trim()))
  rec('read (controls named)', fields.length > 0 && unnamed.length === 0 && placeholderNamed.length === 0,
      `${fields.length} controls, ${unnamed.length} unnamed, ${placeholderNamed.length} named from a placeholder`)
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
  const t = await p.evaluate((runs) => {
    const countNodes = (el) => {
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      let c = 0
      while (w.nextNode()) if (w.currentNode.nodeValue.trim()) c++
      return c
    }
    const out = {}
    for (const n of runs) {
      const el = document.querySelector(`[data-s4="${n}"]`)
      // A VANISHED RUN IS DRIFT, not something to skip. `continue` meant a
      // deleted run printed a shorter table and passed; only `find` caught it,
      // and only because that run happened to have a phrase in the list.
      if (!el) { out[n] = { live: null, control: null, missing: true }; continue }
      const clone = el.cloneNode(true)
      // the control: unwrap every registration span, keep everything else
      for (const sp of Array.from(clone.querySelectorAll('span.s4w')))
        sp.replaceWith(document.createTextNode(sp.textContent))
      clone.normalize()
      out[n] = { live: countNodes(el), control: countNodes(clone) }
    }
    return out
  }, RUNS)
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
  // mechanism buys 0.1480 of whole-screen fidelity on the four per-word runs and
  // 0.2437 on the headline. If the app is ever localised, this is the first
  // thing to revisit, and the fix is to drop the per-word layer on the body runs
  // and keep it on the headline.
  // TWO recorded numbers per run, and BOTH enter the verdict. The first version
  // computed `control`, printed it, and never put it in the boolean — a
  // hardcoded snapshot wearing a control's clothes. A mutation that moved
  // control 1 -> 2 fired nothing.
  const ACCEPTED = {
    lede1: { live: 7, control: 1 },
    lede2: { live: 4, control: 1 },
    oneacct: { live: 6, control: 1 },
    terms: { live: 11, control: 5 },
    display: { live: 13, control: 1 },
  }
  const bad = []
  for (const [k, want] of Object.entries(ACCEPTED)) {
    const got = t[k]
    if (!got || got.missing) { bad.push(`${k} MISSING`); continue }
    if (got.live !== want.live) bad.push(`${k} live ${got.live}!=${want.live}`)
    if (got.control !== want.control) bad.push(`${k} control ${got.control}!=${want.control}`)
  }
  for (const k of Object.keys(t)) if (!ACCEPTED[k]) bad.push(`${k} UNDECLARED`)
  rec('translate (no drift)', bad.length === 0,
      Object.entries(t).map(([k, v]) => `${k} ${v.missing ? 'MISSING' : v.live + '/' + v.control}`).join(' ') +
      (bad.length ? ` — ${bad.join(', ')}` : ' (live/unwrapped-control, both at the recorded values)'))
}

// -------------------------------------------------------------- 6. REFLOW ---
// THE WIDTH AXIS IS THE ONE THAT MATTERS, and the first version pinned it. It
// held width at 393 — the single width where the known live defect cannot
// appear — and swept DPR instead, so a probe named "reflow" could never observe
// the screen's actual reflow defect. Now it sweeps both, at widths real hardware
// has: iPhone SE and the minis are 375pt.
//
// The 375/360/320 failures are EXPECTED and recorded, because the phone recipe
// pins .s4{width:393px} inside a max-width query — a canvas delivered below 768
// rather than a responsive layout. Listing them makes the probe report the true
// state and fail on any CHANGE to it, instead of being blind to it.
{
  const EXPECTED_SCROLL = new Set([375, 360, 320])
  const bad = []
  const seen = []
  for (const dpr of [2, 3]) {
    for (const width of [393, 375, 360, 320]) {
      const c2 = await b.newContext({ viewport: { width, height: 852 }, deviceScaleFactor: dpr, hasTouch: true })
      const p2 = await c2.newPage()
      await p2.goto(URL_)
      await p2.waitForTimeout(1200)
      const m = await p2.evaluate(() => ({
        w: document.documentElement.scrollWidth,
        h: document.documentElement.scrollHeight,
        iw: window.innerWidth,
        ih: window.innerHeight,
      }))
      await c2.close()
      const scrolls = m.w > m.iw
      if (dpr === 2) seen.push(`${width}${scrolls ? ' SCROLLS' : ' ok'}`)
      if (scrolls !== EXPECTED_SCROLL.has(width))
        bad.push(`DPR${dpr} w${width} scroll=${scrolls}, expected ${EXPECTED_SCROLL.has(width)}`)
      if (m.h > m.ih + 1) bad.push(`DPR${dpr} w${width} vertical ${m.h}>${m.ih}`)
    }
  }
  rec('reflow (width x DPR)', bad.length === 0,
      bad.length ? bad.join(' | ') : seen.join('  ') + '  — matches the recorded class-level state')
}

await b.close()

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} probes passed`)
if (failed.length) {
  console.log('FAILED: ' + failed.map((f) => f.probe).join(', '))
  process.exit(1)
}
