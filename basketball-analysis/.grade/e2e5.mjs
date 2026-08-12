import { chromium } from 'playwright'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const P = 3266
const email = `grader5${Date.now()}@example.com`
const b = await chromium.launch()
const ctx = await b.newContext({ viewport:{width:393,height:852}, deviceScaleFactor:2, hasTouch:true })
const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${P}/signup`,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(1200)
await p.fill('[data-testid="signup-first-name"]','G'); await p.fill('[data-testid="signup-last-name"]','R')
await p.fill('[data-testid="signup-email"]',email)
await p.fill('[data-testid="signup-password"]','GraderPass123!'); await p.fill('[data-testid="signup-confirm-password"]','GraderPass123!')
await p.check('[data-testid="signup-agree"]'); await p.click('[data-testid="signup-submit"]')
await p.waitForTimeout(3500)
// clear the sent-at pin so cooldown is 0
await p.evaluate(()=>{ sessionStorage.removeItem('shotiq-verify-sent-at') })
await p.reload({waitUntil:'domcontentloaded'}); await p.waitForTimeout(2500)
const label = await p.locator('[data-s5="resendLab"]').first().textContent()
console.log('resend label with no cooldown:', JSON.stringify(label))
const rb = p.locator('[data-testid="verify-resend"]').filter({visible:true}).first()
console.log('resend disabled:', await rb.isDisabled())
const reqs = []
p.on('response', r=>{ if (r.url().includes('/api/auth/')) reqs.push([r.request().method(), r.url().split('/api/auth/')[1], r.status()]) })
await rb.click()
await p.waitForTimeout(3000)
console.log('api calls:', JSON.stringify(reqs))
console.log('resend button text now:', await rb.textContent())
console.log('cooldown now:', await p.locator('[data-testid="verify-cooldown"]').first().textContent().catch(()=>'none'))
console.log('resend disabled now:', await rb.isDisabled())
await b.close(); await prisma.$disconnect()
