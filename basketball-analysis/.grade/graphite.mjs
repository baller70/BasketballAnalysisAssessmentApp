import { chromium } from 'playwright'
const P=3266
const cands = [
  ['control', null],
  ['g_3B3D47', '#3B3D47'],
  ['g_383A44', '#383A44'],
  ['g_34363F', '#34363F'],
  ['g_303239', '#303239'],
]
const b = await chromium.launch({args:['--font-render-hinting=none','--disable-lcd-text']})
for (const [name, val] of cands) {
  const ctx = await b.newContext({viewport:{width:393,height:852},deviceScaleFactor:2.170483,isMobile:false,hasTouch:true})
  await ctx.addInitScript(()=>{const s=document.createElement('style');s.textContent='*, *::before, *::after{caret-color:transparent !important}';
    if(document.head)document.head.appendChild(s);else document.addEventListener('DOMContentLoaded',()=>document.head.appendChild(s),{once:true})})
  await ctx.addInitScript(()=>{try{sessionStorage.setItem('shotiq-verify-cooldown','42')}catch{}})
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${P}/verify-email?email=marcus%40example.com`,{waitUntil:'domcontentloaded'})
  await p.waitForTimeout(2600)
  for (const [t,v] of [['verify-code-0','2'],['verify-code-1','8'],['verify-code-2','4'],['verify-code-3','7']]) {
    await p.locator(`[data-testid="${t}"]`).filter({visible:true}).first().fill(v,{timeout:8000}); await p.waitForTimeout(250)
  }
  await p.locator('[data-testid="verify-code-4"]').filter({visible:true}).first().click(); await p.waitForTimeout(900)
  if (val) await p.evaluate((v)=>{const s=document.createElement('style');s.textContent=`.s5{--s5-graphite:${v} !important}`;document.body.appendChild(s)},val)
  await p.waitForTimeout(200)
  await p.mouse.move(2,2); await p.evaluate(()=>scrollTo(0,0))
  await p.screenshot({path:`/tmp/claude-0/-home-user-BasketballAnalysisAssessmentApp/63064ba4-0062-5f81-bef3-a4203e4bce1c/scratchpad/g/gr_${name}.png`})
  await ctx.close()
  console.log('shot', name, val)
}
await b.close()
