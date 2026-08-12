import { chromium } from 'playwright'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const P = 3266
const email = `grader4${Date.now()}@example.com`
const b = await chromium.launch()
const ctx = await b.newContext({ viewport:{width:393,height:852}, deviceScaleFactor:2, hasTouch:true })
const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${P}/signup`,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(1200)
await p.fill('[data-testid="signup-first-name"]','G'); await p.fill('[data-testid="signup-last-name"]','R')
await p.fill('[data-testid="signup-email"]',email)
await p.fill('[data-testid="signup-password"]','GraderPass123!'); await p.fill('[data-testid="signup-confirm-password"]','GraderPass123!')
await p.check('[data-testid="signup-agree"]'); await p.click('[data-testid="signup-submit"]')
await p.waitForTimeout(3500)
console.log('URL', p.url())

// hrefs / hit targets
const info = await p.evaluate(()=>{
  const q = s=>document.querySelector(s)
  const r = e=>{const b=e.getBoundingClientRect(); return [+b.x.toFixed(1),+b.y.toFixed(1),+b.width.toFixed(1),+b.height.toFixed(1)]}
  const out = {}
  for (const tid of ['verify-help-1','verify-help-2','verify-help-3','verify-open-mail','verify-different-email','verify-back','verify-settings','verify-resend']) {
    const e = q(`[data-testid="${tid}"]`)
    out[tid] = e ? { href: e.getAttribute('href'), rect: r(e) } : 'MISSING'
  }
  return out
})
console.log(JSON.stringify(info,null,1))

// click help row 1
await p.locator('[data-testid="verify-help-1"]').filter({visible:true}).first().click()
await p.waitForTimeout(2000)
console.log('after help1 click:', p.url())
const y = await p.evaluate(()=>{const e=document.getElementById('email-spam'); return e? e.getBoundingClientRect().top : 'NO TARGET'})
console.log('#email-spam top after nav:', y)
await p.goBack(); await p.waitForTimeout(2000)
console.log('back to:', p.url())

// back affordance
await p.locator('[data-testid="verify-back"]').filter({visible:true}).first().click()
await p.waitForTimeout(2500)
console.log('after back button:', p.url())
await b.close(); await prisma.$disconnect()
