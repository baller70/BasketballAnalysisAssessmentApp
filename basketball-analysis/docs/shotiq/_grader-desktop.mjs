import { chromium } from 'playwright'
const base=`http://127.0.0.1:${process.env.PORT||3271}`
const b=await chromium.launch()
const ctx=await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1})
const p=await ctx.newPage()
await p.goto(base+'/verify-email?email=marcus%40example.com',{waitUntil:'domcontentloaded'})
await p.waitForTimeout(2500)
const info=await p.evaluate(()=>{
  const sidebars=[...document.querySelectorAll('[data-testid=region-sidebar],aside,nav[aria-label*=side i]')]
  const de=document.documentElement
  const imgs=[...document.querySelectorAll('image,img,use')].map(e=>e.getAttribute('href')||e.getAttribute('xlink:href')||e.getAttribute('src'))
  const per={}
  for(const t of ['verify-open-mail','verify-different-email','verify-help-1','verify-help-2','verify-help-3','verify-settings','verify-back']){
    const e=document.querySelector(`[data-testid=${t}]`); if(!e){per[t]='MISSING';continue}
    const im=e.querySelector('image,img'); per[t]= im ? (im.getAttribute('href')||im.getAttribute('xlink:href')||im.getAttribute('src')) : (e.querySelector('svg')?'inline-svg':'none')
  }
  const shield=document.querySelector('[data-s5=safe1]')?.closest('div')?.parentElement
  return {sidebars:sidebars.length, sidebarTestids:sidebars.map(s=>s.getAttribute('data-testid')||s.tagName),
    scrollW:de.scrollWidth, clientW:de.clientWidth, scrollH:de.scrollHeight, clientH:de.clientHeight, per, nImgs:imgs.length}
})
console.log(JSON.stringify(info,null,1))
await p.screenshot({path:'/tmp/claude-0/-home-user-BasketballAnalysisAssessmentApp/63064ba4-0062-5f81-bef3-a4203e4bce1c/scratchpad/grade/desktop.png'})
// reflow
for (const w of [393,375,360,320]) {
  const c2=await b.newContext({viewport:{width:w,height:852},deviceScaleFactor:2})
  const q=await c2.newPage()
  await q.goto(base+'/verify-email?email=marcus%40example.com',{waitUntil:'domcontentloaded'}); await q.waitForTimeout(2000)
  const r=await q.evaluate(()=>{
    const de=document.documentElement
    const out=[]
    for(const e of document.querySelectorAll('[data-testid],button,a,input')){
      const b=e.getBoundingClientRect()
      if(b.width===0&&b.height===0) continue
      if(b.right>de.clientWidth+0.5||b.left<-0.5) out.push([e.getAttribute('data-testid')||e.tagName, +b.left.toFixed(1), +b.right.toFixed(1)])
    }
    return {scrollW:de.scrollWidth, clientW:de.clientWidth, out}
  })
  console.log(`w=${w} scrollW=${r.scrollW} clientW=${r.clientW} offscreen=${r.out.length}`, JSON.stringify(r.out))
  await c2.close()
}
await b.close()
