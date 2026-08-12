import { chromium } from 'playwright'
const b = await chromium.launch({ args:['--font-render-hinting=none','--disable-lcd-text'] })
const ctx = await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:1 })
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:3266/verify-email?email=marcus%40example.com',{waitUntil:'domcontentloaded'})
await p.waitForTimeout(2500)
const info = await p.evaluate(() => {
  const root = document.querySelector('[data-testid="screen-desktop-web-verify-email"]')
  const r = root.getBoundingClientRect()
  const sidebars = document.querySelectorAll('[data-testid*="sidebar"], aside, nav')
  return {
    root:[r.x,r.y,r.width,r.height],
    docScrollW: document.documentElement.scrollWidth,
    docScrollH: document.documentElement.scrollHeight,
    innerW: innerWidth, innerH: innerHeight,
    sidebars: [...sidebars].map(e=>({tag:e.tagName, tid:e.getAttribute('data-testid'), cls:(e.className+'').slice(0,60), rect:[...['x','y','width','height'].map(k=>e.getBoundingClientRect()[k])]})),
  }
})
console.log(JSON.stringify(info,null,1))
await p.screenshot({ path:'/tmp/claude-0/-home-user-BasketballAnalysisAssessmentApp/63064ba4-0062-5f81-bef3-a4203e4bce1c/scratchpad/g/desktop.png' })
await b.close()
