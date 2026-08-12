import { chromium } from 'playwright'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const P = 3266
const email = `grader2${Date.now()}@example.com`
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

// --- countdown ticks?
const c1 = await p.locator('[data-testid="verify-cooldown"]').first().textContent()
await p.waitForTimeout(3000)
const c2 = await p.locator('[data-testid="verify-cooldown"]').first().textContent()
console.log('countdown', c1, '->', c2, c1!==c2 ? 'TICKS' : 'FROZEN')

// --- resend disabled while counting?
const rb = p.locator('[data-testid="verify-resend"]').filter({visible:true}).first()
console.log('resend disabled during countdown:', await rb.isDisabled())

// --- wrong code -> error + focus restored + boxes cleared
for (let i=0;i<6;i++){ await p.locator(`[data-testid="verify-code-${i}"]`).filter({visible:true}).first().fill('0'); await p.waitForTimeout(80) }
await p.waitForTimeout(2500)
const err = await p.locator('[data-testid="verify-error"]').first().textContent().catch(()=>'NO ERROR ELEMENT')
const active = await p.evaluate(()=>({tid:document.activeElement?.getAttribute?.('data-testid'), tag:document.activeElement?.tagName}))
const vals = await p.evaluate(()=>[...document.querySelectorAll('[data-testid^="verify-code-"]')].map(i=>i.value))
console.log('wrong code error:', JSON.stringify(err))
console.log('activeElement after reject:', JSON.stringify(active))
console.log('box values after reject:', JSON.stringify(vals))
// is error visible on phone canvas?
const errBox = await p.evaluate(()=>{const e=document.querySelector('[data-testid="verify-error"]'); if(!e) return null; const r=e.getBoundingClientRect(); const cs=getComputedStyle(e); return {rect:[r.x,r.y,r.width,r.height], color:cs.color, fs:cs.fontSize}})
console.log('error box:', JSON.stringify(errBox))
await p.screenshot({path:'/tmp/claude-0/-home-user-BasketballAnalysisAssessmentApp/63064ba4-0062-5f81-bef3-a4203e4bce1c/scratchpad/g/error.png'})

// --- paste grouped code
const user = await prisma.user.findUnique({where:{email},select:{id:true}})
const tok = await prisma.verificationToken.findFirst({where:{userId:user.id,type:'email_verify_code'}})
const code = tok.token.split(':')[1]
console.log('code', code)
await p.locator('[data-testid="verify-code-2"]').filter({visible:true}).first().click()
await p.evaluate((c)=>navigator.clipboard.writeText(c), code.slice(0,3)+' '+code.slice(3)).catch(e=>console.log('clip err',e.message))
await ctx.grantPermissions(['clipboard-read','clipboard-write']).catch(()=>{})
await p.keyboard.press('Control+V')
await p.waitForTimeout(2500)
console.log('after paste URL/body:', (await p.locator('body').innerText()).replace(/\n+/g,' | ').slice(0,160))
await b.close(); await prisma.$disconnect()
