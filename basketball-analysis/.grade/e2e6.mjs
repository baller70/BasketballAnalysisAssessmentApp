import { chromium } from 'playwright'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const P = 3266
const email = `grader6${Date.now()}@example.com`
const b = await chromium.launch()
const ctx = await b.newContext({ viewport:{width:393,height:852}, deviceScaleFactor:2.170483, hasTouch:true })
const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${P}/signup`,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(1200)
await p.fill('[data-testid="signup-first-name"]','G'); await p.fill('[data-testid="signup-last-name"]','R')
await p.fill('[data-testid="signup-email"]',email)
await p.fill('[data-testid="signup-password"]','GraderPass123!'); await p.fill('[data-testid="signup-confirm-password"]','GraderPass123!')
await p.check('[data-testid="signup-agree"]'); await p.click('[data-testid="signup-submit"]')
await p.waitForTimeout(3500)
await p.evaluate(()=>{ sessionStorage.removeItem('shotiq-verify-sent-at') })
await p.reload({waitUntil:'domcontentloaded'}); await p.waitForTimeout(2500)
const m = await p.evaluate(()=>{
  const e=document.querySelector('[data-s5="resendLab"]'); const r=e.getBoundingClientRect()
  const a=document.querySelector('[data-testid="verify-address"]'); const ra=a.getBoundingClientRect()
  return {resendLab:[r.left,r.right,r.width], text:e.textContent, addr:[ra.left,ra.right,ra.width], addrText:a.textContent, canvas:393}
})
console.log(JSON.stringify(m,null,1))
await p.screenshot({path:'/tmp/claude-0/-home-user-BasketballAnalysisAssessmentApp/63064ba4-0062-5f81-bef3-a4203e4bce1c/scratchpad/g/nocooldown.png'})
await b.close(); await prisma.$disconnect()
