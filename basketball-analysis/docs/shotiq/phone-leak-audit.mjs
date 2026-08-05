/* Audit: at DESKTOP width, is any 393pt phone panel painting over the page?
   PhoneShell portals into <body> as `position:fixed; z-index:60; max-width:393px`,
   so a `md:hidden` wrapper cannot hide it — the portal is not a descendant of
   the wrapper. This walks the app signed in at 1512x900 and reports every route
   where such a panel is visible. */
import { chromium } from 'playwright'
const PORT = process.env.PORT || 3192
const base = 'http://localhost:' + PORT
const ROUTES = (process.env.ROUTES || [
  '/dashboard','/dashboard?view=basic','/dashboard?view=standard','/dashboard?view=professional',
  '/analyze','/upload','/video-upload','/video-analysis','/video-analysis/upload','/live-capture',
  '/results/demo','/results/demo/training','/results/demo/goals',
  '/training','/training/drills','/calendar','/goals','/media','/elite-shooters',
  '/achievements','/badges','/profile','/settings','/onboarding','/player-card','/history',
].join(',')).split(',')

const b = await chromium.launch()
const p = await (await b.newContext({ viewport:{ width:1512, height:900 } })).newPage()
await p.goto(base + '/signin'); await p.waitForTimeout(1500)
await p.fill('[data-testid="signin-email"]','khouston721@gmail.com').catch(()=>{})
await p.fill('[data-testid="signin-password"]','hunterrr').catch(()=>{})
await p.click('[data-testid="signin-submit"]').catch(()=>{})
await p.waitForTimeout(4500)

const leaks = []
for (const r of ROUTES) {
  try {
    await p.goto(base + r, { waitUntil:'domcontentloaded' }); await p.waitForTimeout(2600)
    const hit = await p.evaluate(() => {
      const out = []
      for (const e of document.querySelectorAll('body > *')) {
        const cs = getComputedStyle(e), bb = e.getBoundingClientRect()
        if (cs.position === 'fixed' && bb.width > 0 && bb.width <= 420 && bb.height > 300 && cs.display !== 'none') {
          out.push({ cls:(e.className||'').toString().slice(0,60), w:Math.round(bb.width), h:Math.round(bb.height), z:cs.zIndex })
        }
        for (const d of e.querySelectorAll(':scope > .shotiq-canonical')) {
          const c2 = getComputedStyle(d), b2 = d.getBoundingClientRect()
          if (c2.position === 'fixed' && b2.width > 0 && c2.display !== 'none')
            out.push({ cls:'nested .shotiq-canonical', w:Math.round(b2.width), h:Math.round(b2.height), z:c2.zIndex })
        }
      }
      return out
    })
    if (hit.length) { leaks.push({ route:r, hit }); console.log('LEAK', r, JSON.stringify(hit)) }
    else console.log('ok  ', r)
  } catch (e) { console.log('ERR ', r, e.message.split('\n')[0]) }
}
await b.close()
console.log('\n=== ' + leaks.length + ' route(s) leaking a phone panel onto desktop ===')
for (const l of leaks) console.log('  ' + l.route)
process.exit(leaks.length ? 1 : 0)
