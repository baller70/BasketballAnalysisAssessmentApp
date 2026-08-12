import { chromium } from 'playwright'
const PORT = process.env.PORT || 3271
const OUT = process.env.OUT
const ROUTE = process.env.ROUTE || '/verify-email?email=marcus%40example.com'
const STEPS = [['verify-code-0','2'],['verify-code-1','8'],['verify-code-2','4'],['verify-code-3','7']]
const b = await chromium.launch({ args: ['--font-render-hinting=none','--disable-lcd-text'] })
const ctx = await b.newContext({ viewport:{width:393,height:852}, deviceScaleFactor:2.170483, isMobile:false, hasTouch:true })
await ctx.addInitScript(() => { const s=document.createElement('style'); s.textContent='*, *::before, *::after { caret-color: transparent !important; }'; if(document.head) document.head.appendChild(s); else document.addEventListener('DOMContentLoaded',()=>document.head.appendChild(s),{once:true}) })
await ctx.addInitScript(() => { try { sessionStorage.setItem('shotiq-verify-cooldown','42') } catch {} })
const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${PORT}${ROUTE}`, { waitUntil:'domcontentloaded' })
await p.waitForTimeout(2600)
for (const [tid,v] of STEPS) { await p.locator(`[data-testid="${tid}"]`).filter({visible:true}).first().fill(v,{timeout:8000}); await p.waitForTimeout(250) }
await p.locator('[data-testid="verify-code-4"]').filter({visible:true}).first().click({timeout:8000})
await p.waitForTimeout(900)
await p.mouse.move(2,2)
await p.evaluate(()=>{window.scrollTo(0,0)})
await p.screenshot({ path: OUT })
console.log('wrote', OUT)
await b.close()
