import { chromium } from 'playwright'
import { PrismaClient } from '@prisma/client'
const P = process.env.PORT || 3271
const base = `http://127.0.0.1:${P}`
const prisma = new PrismaClient()
const email = `grader${Date.now()}@example.com`
const b = await chromium.launch()
const ctx = await b.newContext({ viewport:{width:393,height:852}, deviceScaleFactor:2, hasTouch:true })
const p = await ctx.newPage()
const errs=[]
p.on('pageerror', e=>errs.push('PAGEERROR '+e.message))
const t0=Date.now()
await p.goto(base+'/signup', {waitUntil:'domcontentloaded'})
await p.waitForTimeout(1200)
await p.fill('[data-testid=signup-first-name]','Grader')
await p.fill('[data-testid=signup-last-name]','Bot')
await p.fill('[data-testid=signup-email]',email)
await p.fill('[data-testid=signup-password]','Str0ngPassw0rd!23')
await p.fill('[data-testid=signup-confirm-password]','Str0ngPassw0rd!23')
const agree = p.locator('[data-testid=signup-agree]')
if (await agree.count()) { try { await agree.check({timeout:3000}) } catch { await agree.click({force:true}) } }
await p.click('[data-testid=signup-submit]')
await p.waitForTimeout(4000)
console.log('URL after signup:', p.url())
const u = await prisma.user.findUnique({where:{email}, select:{id:true,emailVerified:true}})
console.log('user row:', JSON.stringify(u))
const toks = u ? await prisma.verificationToken.findMany({where:{userId:u.id}, select:{type:true,token:true,expiresAt:true,createdAt:true}}) : []
console.log('tokens:', JSON.stringify(toks))
const codeRow = toks.find(t=>t.type==='email_verify_code')
const code = codeRow ? codeRow.token.split(':')[1] : null
console.log('CODE:', code)
// screenshot of state
await p.screenshot({path:'/tmp/claude-0/-home-user-BasketballAnalysisAssessmentApp/63064ba4-0062-5f81-bef3-a4203e4bce1c/scratchpad/grade/after-signup.png'})
// pending email sessionStorage
console.log('sessionStorage:', JSON.stringify(await p.evaluate(()=>({...sessionStorage}))))
if (code && p.url().includes('verify-email')) {
  for (let i=0;i<6;i++){ await p.locator(`[data-testid=verify-code-${i}]`).filter({visible:true}).first().fill(code[i]); await p.waitForTimeout(120) }
  await p.waitForTimeout(3000)
  console.log('after code URL:', p.url())
  console.log('body has verified text:', await p.locator('text=Your email is verified').count())
  const u2 = await prisma.user.findUnique({where:{email}, select:{emailVerified:true}})
  console.log('emailVerified now:', u2?.emailVerified)
  console.log('continue href:', await p.locator('[data-testid=verify-continue]').getAttribute('href').catch(()=>null))
  await p.screenshot({path:'/tmp/claude-0/-home-user-BasketballAnalysisAssessmentApp/63064ba4-0062-5f81-bef3-a4203e4bce1c/scratchpad/grade/after-code.png'})
}
console.log('errors:', JSON.stringify(errs))
console.log('elapsed', Date.now()-t0)
await b.close(); await prisma.$disconnect()
