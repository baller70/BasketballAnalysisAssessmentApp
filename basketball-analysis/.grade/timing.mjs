import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const P='http://127.0.0.1:3266'
const N = Number(process.env.N || 60)
// make N unverified accounts
const exist=[], absent=[]
for (let i=0;i<N;i++){
  const e = `tex${Date.now()}_${i}@example.com`
  await prisma.user.create({ data:{ email:e, password:"x" } }).catch(async(err)=>{
    // fall back: discover required fields
    console.log('create err', err.message.split('\n').slice(-3).join(' ')); process.exit(1)
  })
  exist.push(e); absent.push(`nope${Date.now()}_${i}@example.com`)
}
async function csrf(){ const r=await fetch(P+'/api/auth/csrf'); const j=await r.json(); return {t:j.csrfToken,c:r.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ')} }
const {t,c} = await csrf()
async function hit(email){
  const t0=process.hrtime.bigint()
  const r=await fetch(P+'/api/auth/resend-verification',{method:'POST',headers:{'content-type':'application/json','x-csrf-token':t,cookie:c},body:JSON.stringify({email})})
  await r.text()
  return Number(process.hrtime.bigint()-t0)/1e6
}
// warm up
for (let i=0;i<5;i++) await hit('warm@example.com')
const A=[],B=[]
for (let i=0;i<N;i++){
  if (i%2===0){ A.push(await hit(exist[i])); B.push(await hit(absent[i])) }
  else { B.push(await hit(absent[i])); A.push(await hit(exist[i])) }
}
const med=a=>{const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length/2)]}
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length
const sd=a=>{const m=mean(a);return Math.sqrt(a.reduce((s,x)=>s+(x-m)**2,0)/(a.length-1))}
console.log(`existing  n=${A.length} median ${med(A).toFixed(2)} mean ${mean(A).toFixed(2)} sd ${sd(A).toFixed(2)} min ${Math.min(...A).toFixed(2)}`)
console.log(`absent    n=${B.length} median ${med(B).toFixed(2)} mean ${mean(B).toFixed(2)} sd ${sd(B).toFixed(2)} min ${Math.min(...B).toFixed(2)}`)
const z=(mean(A)-mean(B))/Math.sqrt(sd(A)**2/A.length+sd(B)**2/B.length)
console.log('welch z =', z.toFixed(2))
// negative control: absent vs absent
const C=[],D=[]
for (let i=0;i<N;i++){ if(i%2===0){C.push(await hit(`c1${Date.now()}_${i}@example.com`));D.push(await hit(`c2${Date.now()}_${i}@example.com`))} else {D.push(await hit(`d2${Date.now()}_${i}@example.com`));C.push(await hit(`d1${Date.now()}_${i}@example.com`))} }
const z2=(mean(C)-mean(D))/Math.sqrt(sd(C)**2/C.length+sd(D)**2/D.length)
console.log(`control absent-vs-absent medians ${med(C).toFixed(2)} / ${med(D).toFixed(2)}  z = ${z2.toFixed(2)}`)
await prisma.user.deleteMany({ where:{ email:{ in: exist } } })
await prisma.$disconnect()
