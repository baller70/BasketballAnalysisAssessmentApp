import { chromium } from 'playwright'
const base=`http://127.0.0.1:${process.env.PORT||3271}`
const b=await chromium.launch()
for (const r of ['/signin','/signup','/verify-email','/dashboard']) {
  const ctx=await b.newContext({viewport:{width:1440,height:900}})
  const p=await ctx.newPage()
  await p.goto(base+r,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(1800)
  const o=await p.evaluate(()=>({
    url:location.pathname,
    sidebars:[...document.querySelectorAll('[data-testid=region-sidebar]')].length,
    testids:[...document.querySelectorAll('[data-testid^=region-]')].map(e=>e.getAttribute('data-testid')),
    sh:document.documentElement.scrollHeight, sw:document.documentElement.scrollWidth }))
  console.log(r, JSON.stringify(o))
  await ctx.close()
}
await b.close()
