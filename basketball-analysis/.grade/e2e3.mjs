import { chromium } from 'playwright'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const P = 3266
const email = `grader3${Date.now()}@example.com`
const b = await chromium.launch()
const ctx = await b.newContext({ viewport:{width:393,height:852}, deviceScaleFactor:2, hasTouch:true,
  permissions:['clipboard-read','clipboard-write'] })
const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${P}/signup`,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(1200)
await p.fill('[data-testid="signup-first-name"]','G'); await p.fill('[data-testid="signup-last-name"]','R')
await p.fill('[data-testid="signup-email"]',email)
await p.fill('[data-testid="signup-password"]','GraderPass123!'); await p.fill('[data-testid="signup-confirm-password"]','GraderPass123!')
await p.check('[data-testid="signup-agree"]'); await p.click('[data-testid="signup-submit"]')
await p.waitForTimeout(3500)
const user = await prisma.user.findUnique({where:{email},select:{id:true}})
const tok = await prisma.verificationToken.findFirst({where:{userId:user.id,type:'email_verify_code'}})
const code = tok.token.split(':')[1]
const grouped = code.slice(0,3)+' '+code.slice(3)
console.log('grouped paste value:', JSON.stringify(grouped))
await p.locator('[data-testid="verify-code-2"]').filter({visible:true}).first().click()
await p.evaluate((c)=>navigator.clipboard.writeText(c), grouped)
await p.keyboard.press('Control+V')
await p.waitForTimeout(3000)
const txt = (await p.locator('body').innerText()).replace(/\n+/g,' | ')
console.log('PASTE RESULT:', txt.slice(0,120))
const u = await prisma.user.findUnique({where:{email},select:{emailVerified:true}})
console.log('emailVerified:', u.emailVerified)
await b.close(); await prisma.$disconnect()
