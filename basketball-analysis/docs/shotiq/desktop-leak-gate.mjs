/**
 * DESKTOP LEAK GATE — is any phone-only rule reachable at desktop width?
 *
 * WHY THIS EXISTS. The cycle verifies a phone round against the desktop set by
 * comparing captures to `$SCRATCH/verify-desktop`. That baseline was lost to a
 * container rollback (the ledger records it), so from round 13 on the guard has
 * been established by CONSTRUCTION instead: every `.s5` / `[data-s5` selector in
 * the SERVED stylesheet sits inside `@media (max-width: 767.98px)`, therefore a
 * phone round cannot reach desktop.
 *
 * That was measured ONCE, by hand, in round 13 — "0 of 19,186 chars" — and every
 * round from 14 to 31 changed `phone-005.ts` without re-running it. Rule 92's
 * fourth clause is explicit that an estimator which licensed a claim has to be
 * re-run against the artefact it produced, and this one never was. So it is a
 * gate now, and it runs in the same breath as markup-gate and csrf-gate.
 *
 * WHAT IT CHECKS, and each probe is a different failure mode:
 *
 *   1. CSS SCOPE. Brace-walk the served inline CSS and find every rule whose
 *      selector mentions `.s5` or `[data-s5`. Each must be nested inside the
 *      phone media query. Parsed from the SERVED page rather than from the
 *      template literal in source — `PHONE_CSS` contains nested quotes and
 *      comment text, and a regex over the source has already been fooled once.
 *   2. THE MEDIA QUERY ITSELF. Exactly one `@media (max-width: 767.98px)` block,
 *      at the width the invariant names. A second block, or a drifted breakpoint,
 *      would satisfy probe 1 while breaking the guarantee it stands for.
 *   3. PAINTED GEOMETRY AT 900. Every `[data-s5-mark]` and the overlay root must
 *      compute to `display:none` at desktop width. Probe 1 proves the RULES are
 *      scoped; this proves nothing paints anyway through a path that does not
 *      need them — an ungated in-flow SVG would render unstyled, which is a
 *      visible artefact rather than a subtle one.
 *
 *      IT DOES NOT ASSERT THAT `[data-s5]` IS HIDDEN, and the first version of
 *      this file did. That version reported FAIL with 28 visible, and the defect
 *      was the assertion: `data-s5-mark` tags a DRAWN phone-only mark, while a
 *      bare `data-s5` tags a text run or a hit target — `wordmark`, `display`,
 *      `code0`-`code5`, `gear`, `back` — which is real content and real
 *      interaction that MUST paint on desktop. A gate that fails on correct
 *      behaviour trains you to ignore it, which is worse than not having it.
 *   4. THE DESKTOP SIBLINGS ARE PRESENT. Each `data-s5-off` element must be
 *      visible at 900. A phone mark and its desktop icon are a pair, and round 14
 *      found `diffBtn` with only the `md:hidden` half — the phone was right and
 *      desktop drew nothing at all, which no phone-side probe can see.
 *
 * Probes 1 and 2 are the guard the ledger has been claiming. Probes 3 and 4 are
 * the two ways that claim could be true and still not mean what it says.
 *
 *   SCREEN=005 PORT=3289 node docs/shotiq/desktop-leak-gate.mjs
 */
import { chromium } from 'playwright'

const PORT = process.env.PORT || 3181
const ROUTE = process.env.ROUTE || '/verify-email?email=marcus%40example.com'
const BREAKPOINT = process.env.BREAKPOINT || 'max-width: 767.98px'
const base = 'http://localhost:' + PORT

let pass = 0
let fail = 0
const say = (ok, name, detail) => {
  if (ok) { pass++; console.log(`PASS  ${name} — ${detail}`) }
  else { fail++; console.log(`FAIL  ${name} — ${detail}`) }
}

/** Walk `css` and return every top-level block as {prelude, body, start, end}. */
function blocks(css) {
  const out = []
  let depth = 0, preludeStart = 0, bodyStart = -1
  for (let i = 0; i < css.length; i++) {
    const c = css[i]
    if (c === '{') {
      if (depth === 0) bodyStart = i
      depth++
    } else if (c === '}') {
      depth--
      if (depth === 0) {
        out.push({
          prelude: css.slice(preludeStart, bodyStart).trim(),
          body: css.slice(bodyStart + 1, i),
        })
        preludeStart = i + 1
      }
      if (depth < 0) return out   // unbalanced; bail rather than mis-attribute
    }
  }
  return out
}

const PHONE_SEL = /\.s5\b|\[data-s5/

/** Every phone selector in `css`, tagged with whether it is inside the query. */
function phoneRules(css, insideQuery = false) {
  const out = []
  for (const b of blocks(css)) {
    const isMedia = b.prelude.startsWith('@media')
    const isPhoneQuery = isMedia && b.prelude.includes(BREAKPOINT)
    if (isMedia || b.prelude.startsWith('@supports')) {
      out.push(...phoneRules(b.body, insideQuery || isPhoneQuery))
    } else if (PHONE_SEL.test(b.prelude)) {
      out.push({ selector: b.prelude.replace(/\s+/g, ' ').slice(0, 90), insideQuery })
    }
  }
  return out
}

const browser = await chromium.launch()
try {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 1440 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  const res = await page.goto(base + ROUTE, { waitUntil: 'domcontentloaded' })
  if (!res || !res.ok()) throw new Error(`GET ${ROUTE} -> ${res && res.status()}`)
  await page.waitForTimeout(2000)

  // --- 1 + 2: the served stylesheet -----------------------------------------
  const css = (await page.evaluate(() =>
    Array.from(document.querySelectorAll('style')).map((s) => s.textContent || '').join('\n')
  ))
  const rules = phoneRules(css)
  const leaked = rules.filter((r) => !r.insideQuery)
  say(leaked.length === 0, 'css scope (every .s5 / [data-s5 rule inside the phone query)',
    `${rules.length} phone rules, ${leaked.length} outside, over ${css.length} chars of inline CSS` +
    (leaked.length ? `\n      LEAKED: ${leaked.slice(0, 6).map((r) => r.selector).join(' | ')}` : ''))

  const queries = blocks(css).filter((b) => b.prelude.startsWith('@media') && b.prelude.includes(BREAKPOINT))
  const otherWidths = Array.from(new Set(
    (css.match(/@media\s*\([^)]*max-width:\s*[\d.]+px[^)]*\)/g) || [])
      .filter((q) => !q.includes(BREAKPOINT))
  ))
  say(queries.length === 1, `exactly one @media (${BREAKPOINT}) block`,
    `found ${queries.length}` + (otherWidths.length ? `; other max-width queries present (fine, but listed): ${otherWidths.slice(0, 4).join(' ')}` : ''))

  // --- 3 + 4: what actually paints at 900 -----------------------------------
  const dom = await page.evaluate(() => {
    const vis = (el) => {
      const cs = getComputedStyle(el), bb = el.getBoundingClientRect()
      return cs.display !== 'none' && cs.visibility !== 'hidden' && bb.width > 0 && bb.height > 0
    }
    const list = (sel) => Array.from(document.querySelectorAll(sel))
    const label = (el) => el.getAttribute('data-s5') || `<${el.tagName.toLowerCase()}>`
    return {
      marks: list('[data-s5-mark]').length,
      marksVisible: list('[data-s5-mark]').filter(vis).map(label),
      overlayVisible: list('[data-s5="overlay"]').filter(vis).length,
      // reported, not asserted — see the header note on why these must paint
      contentVisible: list('[data-s5]:not([data-s5-mark])').filter(vis).length,
      off: list('[data-s5-off]').length,
      offHidden: list('[data-s5-off]').filter((e) => !vis(e)).map((e) => e.tagName + '.' + (e.className || '').toString().slice(0, 30)),
    }
  })

  say(dom.marksVisible.length === 0 && dom.overlayVisible === 0,
    'no drawn phone mark and no overlay paints at 900',
    `${dom.marks} marks present, ${dom.marksVisible.length} visible, overlay visible ${dom.overlayVisible}; ` +
    `${dom.contentVisible} text runs / hit targets visible, which is correct and is reported not asserted` +
    (dom.marksVisible.length ? `\n      VISIBLE: ${dom.marksVisible.slice(0, 8).join(', ')}` : ''))

  say(dom.off > 0 && dom.offHidden.length === 0,
    'every data-s5-off desktop sibling is visible at 900',
    `${dom.off} siblings, ${dom.offHidden.length} hidden` +
    (dom.offHidden.length ? `\n      HIDDEN: ${dom.offHidden.slice(0, 6).join(', ')}` : ''))

  // --- LIVE SELF-TESTS ------------------------------------------------------
  // A gate that cannot fail is decoration. Each probe is shown a defect it is
  // supposed to catch, in the live page, and must catch it. This runs last so a
  // real failure above is never masked by the injected one.
  const selftest = await page.evaluate(() => {
    const out = {}
    const st = document.createElement('style')
    st.textContent = '.s5 [data-s5="__selftest"]{color:red}'
    document.head.appendChild(st)
    out.css = Array.from(document.querySelectorAll('style')).map((s) => s.textContent || '').join('\n')
    st.remove()

    const mark = document.querySelector('[data-s5-mark]')
    const prev = mark ? mark.style.cssText : null
    if (mark) mark.style.cssText = 'display:inline-block;width:8px;height:8px'
    const vis = (el) => {
      const cs = getComputedStyle(el), bb = el.getBoundingClientRect()
      return cs.display !== 'none' && cs.visibility !== 'hidden' && bb.width > 0 && bb.height > 0
    }
    out.markCaught = !!mark && vis(mark)
    if (mark) mark.style.cssText = prev

    const off = document.querySelector('[data-s5-off]')
    const prevOff = off ? off.style.cssText : null
    if (off) off.style.cssText = 'display:none'
    out.offCaught = !!off && !vis(off)
    if (off) off.style.cssText = prevOff
    return out
  })

  const injected = phoneRules(selftest.css).filter((r) => !r.insideQuery)
  say(injected.length === 1 && injected[0].selector.includes('__selftest'),
    'SELF-TEST probe 1 catches an unscoped phone rule',
    `injected one rule outside the query; detected ${injected.length}`)
  say(selftest.markCaught === true, 'SELF-TEST probe 3 catches a mark forced visible',
    `forced the first [data-s5-mark] visible; detected ${selftest.markCaught}`)
  say(selftest.offCaught === true, 'SELF-TEST probe 4 catches a hidden desktop sibling',
    `forced the first [data-s5-off] hidden; detected ${selftest.offCaught}`)

  await ctx.close()
} finally {
  await browser.close()
}

console.log(`\n${pass}/${pass + fail} probes passed`)
process.exit(fail ? 1 : 0)
