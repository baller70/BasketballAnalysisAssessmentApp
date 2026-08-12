import { chromium } from 'playwright'
const b = await chromium.launch()
for (const w of [320,360,375,390,393,414,430]) {
  const ctx = await b.newContext({ viewport:{width:w,height:852}, deviceScaleFactor:2, hasTouch:true })
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:3266/verify-email?email=marcus%40example.com',{waitUntil:'domcontentloaded'})
  await p.waitForTimeout(2200)
  const m = await p.evaluate((vw)=>{
    const ids=['verify-code-0','verify-code-5','verify-open-mail','verify-different-email','verify-help-1','verify-help-2','verify-help-3','verify-resend','verify-back','verify-settings']
    const clipped=[]
    for (const t of ids){ const e=document.querySelector(`[data-testid="${t}"]`); if(!e) continue
      const r=e.getBoundingClientRect(); if (r.right>vw+0.5 || r.left<-0.5) clipped.push([t,+r.left.toFixed(1),+r.right.toFixed(1)]) }
    const s5=document.querySelector('.s5').getBoundingClientRect()
    return { scrollW: document.documentElement.scrollWidth, s5:[+s5.left.toFixed(1),+s5.right.toFixed(1)], clipped }
  }, w)
  console.log(`w=${String(w).padEnd(4)} scrollW=${String(m.scrollW).padEnd(5)} s5=[${m.s5}] hScroll=${m.scrollW>w?'YES':'no '} clipped=${m.clipped.length} ${m.clipped.map(c=>c[0]).join(',')}`)
  await ctx.close()
}
await b.close()
