import { chromium } from 'playwright'
import { PrismaClient } from '@prisma/client'
const P = process.env.PORT||3271, base=`http://127.0.0.1:${P}`
const prisma=new PrismaClient()
const email=`grader2${Date.now()}@example.com`
const b=await chromium.launch()
async function newPage(){ const ctx=await b.newContext({viewport:{width:393,height:852},deviceScaleFactor:2,hasTouch:true}); const p=await ctx.newPage(); return {ctx,p} }
// make an unverified account via API
const {ctx,p}=await newPage()
await p.goto(base+'/signup',{waitUntil:'domcontentloaded'}); await p.waitForTimeout(1000)
await p.fill('[data-testid=signup-first-name]','G'); await p.fill('[data-testid=signup-last-name]','B')
await p.fill('[data-testid=signup-email]',email)
await p.fill('[data-testid=signup-password]','Str0ngPassw0rd!23'); await p.fill('[data-testid=signup-confirm-password]','Str0ngPassw0rd!23')
try{await p.locator('[data-testid=signup-agree]').check({timeout:2000})}catch{}
await p.click('[data-testid=signup-submit]'); await p.waitForTimeout(3500)
console.log('signup landed:', p.url())
const u=await prisma.user.findUnique({where:{email},select:{id:true}})
const row=await prisma.verificationToken.findFirst({where:{userId:u.id,type:'email_verify_code'}})
const code=row.token.split(':')[1]
console.log('code', code)

// --- WRONG CODE path
for(let i=0;i<6;i++){ await p.locator(`[data-testid=verify-code-${i}]`).filter({visible:true}).first().fill('0'); await p.waitForTimeout(100) }
await p.waitForTimeout(2500)
console.log('error text:', await p.locator('[data-testid=verify-error]').innerText().catch(()=>'NONE'))
console.log('boxes after reject:', await p.$$eval('[data-testid^=verify-code-]', els=>els.map(e=>e.value)))
console.log('activeElement:', await p.evaluate(()=>document.activeElement?.getAttribute('data-testid')||document.activeElement?.tagName))

// --- countdown / resend
console.log('cooldown text:', await p.locator('[data-testid=verify-cooldown]').innerText().catch(()=>'NONE'))
console.log('resend disabled:', await p.locator('[data-testid=verify-resend]').isDisabled())
const c1=await p.locator('[data-testid=verify-cooldown]').innerText().catch(()=>null)
await p.waitForTimeout(2200)
const c2=await p.locator('[data-testid=verify-cooldown]').innerText().catch(()=>null)
console.log('countdown ticks:', c1, '->', c2)
// clear the sent-at pin and reload so resend is live
await p.evaluate(()=>{sessionStorage.removeItem('shotiq-verify-sent-at')})
await p.reload({waitUntil:'domcontentloaded'}); await p.waitForTimeout(2500)
console.log('after reload resend disabled:', await p.locator('[data-testid=verify-resend]').isDisabled())
console.log('resend label text:', await p.locator('[data-s5=resendLab]').innerText().catch(()=>'NONE'))
const t0=Date.now()
await p.locator('[data-testid=verify-resend]').click()
await p.waitForTimeout(2500)
console.log('resend latency ms', Date.now()-t0, 'label now:', await p.locator('[data-s5=resendLink]').innerText())
console.log('cooldown after resend:', await p.locator('[data-testid=verify-cooldown]').innerText().catch(()=>'NONE'))
const row2=await prisma.verificationToken.findFirst({where:{userId:u.id,type:'email_verify_code'}})
console.log('code after resend (should be same):', row2.token.split(':')[1], 'same:', row2.token.split(':')[1]===code)

// --- hrefs of all controls
const hrefs=await p.evaluate(()=>{
  const out={}
  for(const t of ['verify-open-mail','verify-different-email','verify-help-1','verify-help-2','verify-help-3','verify-settings'])
    { const e=document.querySelector(`[data-testid=${t}]`); out[t]= e? (e.getAttribute('href')||e.tagName):'MISSING' }
  return out })
console.log('hrefs:', JSON.stringify(hrefs,null,0))

// --- back affordance (signup handoff -> forward)
await p.locator('[data-testid=verify-back]').click(); await p.waitForTimeout(2500)
console.log('back from signup-handoff ->', p.url())

// --- back affordance without handoff
const {p:p2}=await newPage()
await p2.goto(base+'/verify-email?email=marcus%40example.com',{waitUntil:'domcontentloaded'}); await p2.waitForTimeout(2200)
await p2.locator('[data-testid=verify-back]').click(); await p2.waitForTimeout(2500)
console.log('back with no handoff ->', p2.url())

// --- guide anchors
const {p:p3}=await newPage()
for (const a of ['email-spam','email-delay']) {
  await p3.goto(base+'/guide#'+a,{waitUntil:'domcontentloaded'}); await p3.waitForTimeout(1500)
  console.log('guide anchor',a,'present:', await p3.locator('#'+a).count())
}
await b.close(); await prisma.$disconnect()
