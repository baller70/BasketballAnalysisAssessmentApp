import { chromium } from 'playwright'
const b = await chromium.launch({args:['--font-render-hinting=none','--disable-lcd-text']})
const ctx = await b.newContext({ viewport:{width:393,height:852}, deviceScaleFactor:2.170483, hasTouch:true })
const p = await ctx.newPage()
const addr = 'marcus.alexander.thompson.jr@sportsperformancelab.example.com'
await p.goto(`http://127.0.0.1:3266/verify-email?email=${encodeURIComponent(addr)}`,{waitUntil:'domcontentloaded'})
await p.waitForTimeout(2500)
const m = await p.evaluate(()=>{
  const out={}
  for (const s of ['lede1','lede2','resendLab','display','safe1','safe2','help1','help2','help3','plateLab','diffLab','didnt']) {
    const e=document.querySelector(`[data-s5="${s}"]`); if(!e) {out[s]='missing';continue}
    const r=e.getBoundingClientRect(); out[s]=[+r.left.toFixed(1),+r.right.toFixed(1)]
  }
  out.docScrollW = document.documentElement.scrollWidth
  return out
})
console.log(JSON.stringify(m,null,1))
await p.screenshot({path:'/tmp/claude-0/-home-user-BasketballAnalysisAssessmentApp/63064ba4-0062-5f81-bef3-a4203e4bce1c/scratchpad/g/long.png'})
await b.close()
