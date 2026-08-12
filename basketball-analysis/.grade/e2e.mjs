import { chromium } from 'playwright'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const P = 3266
const email = `grader${Date.now()}@example.com`
const b = await chromium.launch()
const ctx = await b.newContext({ viewport:{width:393,height:852}, deviceScaleFactor:2, isMobile:false, hasTouch:true })
const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${P}/signup`, { waitUntil:'domcontentloaded' })
await p.waitForTimeout(1500)
await p.fill('[data-testid="signup-first-name"]','Grade')
await p.fill('[data-testid="signup-last-name"]','Er')
await p.fill('[data-testid="signup-email"]',email)
await p.fill('[data-testid="signup-password"]','GraderPass123!')
await p.fill('[data-testid="signup-confirm-password"]','GraderPass123!')
await p.check('[data-testid="signup-agree"]')
const btn = await p.evaluate(()=>[...document.querySelectorAll('button')].map(x=>({t:x.textContent.trim().slice(0,30),tid:x.getAttribute('data-testid'),type:x.type})))
console.log('buttons',JSON.stringify(btn))
await p.click('[data-testid="signup-submit"]').catch(async()=>{ await p.click('button[type=submit]') })
await p.waitForTimeout(4000)
console.log('URL after signup:', p.url())
console.log('address shown:', await p.locator('[data-testid="verify-address"]').first().textContent().catch(e=>'MISSING'))
console.log('cooldown shown:', await p.locator('[data-testid="verify-cooldown"]').first().textContent().catch(e=>'none'))
const row = await prisma.verificationToken.findFirst({ where:{ type:'email_verify_code', user:{ } , }, orderBy:{ createdAt:'desc'} }).catch(()=>null)
const user = await prisma.user.findUnique({ where:{ email }, select:{id:true, emailVerified:true} })
console.log('user', JSON.stringify(user))
const tok = await prisma.verificationToken.findMany({ where:{ userId:user.id } })
console.log('tokens', tok.map(t=>({type:t.type, token:t.token.slice(0,40), exp:t.expiresAt.toISOString(), created:t.createdAt.toISOString()})))
const code = (tok.find(t=>t.type==='email_verify_code')||{}).token.split(':')[1]
console.log('CODE', code)
// type it
for (let i=0;i<6;i++){ await p.locator(`[data-testid="verify-code-${i}"]`).filter({visible:true}).first().fill(code[i]); await p.waitForTimeout(120) }
await p.waitForTimeout(2500)
console.log('after code URL:', p.url())
console.log('body snippet:', (await p.locator('body').innerText()).replace(/\n+/g,' | ').slice(0,300))
const u2 = await prisma.user.findUnique({ where:{ email }, select:{emailVerified:true} })
console.log('emailVerified now:', u2.emailVerified)
const cont = await p.locator('[data-testid="verify-continue"]').count()
console.log('continue control count:', cont)
if (cont) { console.log('continue href:', await p.locator('[data-testid="verify-continue"]').first().getAttribute('href')) }
await p.screenshot({path:'/tmp/claude-0/-home-user-BasketballAnalysisAssessmentApp/63064ba4-0062-5f81-bef3-a4203e4bce1c/scratchpad/g/verified.png'})
await b.close(); await prisma.$disconnect()
