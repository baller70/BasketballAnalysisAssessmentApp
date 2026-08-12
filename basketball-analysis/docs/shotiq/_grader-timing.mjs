import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const base = `http://127.0.0.1:${process.env.PORT||3271}`
const N = Number(process.env.N||60)
const ROUTE = process.env.ROUTE || '/api/auth/resend-verification'
const tag = Date.now()
// CSRF
const cr = await fetch(base+'/api/auth/csrf')
const cj = await cr.json()
const token = cj.token || cj.csrfToken
const cookie = cr.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ')
if(!token) { console.log('no csrf token', JSON.stringify(cj)); process.exit(1) }

// make N unverified users
const existing=[]
for (let i=0;i<N;i++){
  const e=`tm${tag}x${i}@example.com`
  await prisma.user.create({data:{email:e, firstName:'T', password:'x'}})
  existing.push(e)
}
const absent = Array.from({length:N},(_,i)=>`tm${tag}z${i}@nowhere-absent.example.com`)

async function hit(email, extra){
  const t=process.hrtime.bigint()
  const r=await fetch(base+ROUTE,{method:'POST',headers:{'content-type':'application/json','x-csrf-token':token,cookie},body:JSON.stringify({email, ...extra})})
  await r.text()
  return [Number(process.hrtime.bigint()-t)/1e6, r.status]
}
const A=[],B=[]
const extra = ROUTE.includes('verify-email-code') ? {code:'000000'} : {}
// warm
await hit('warm'+tag+'@example.com',extra)
for(let i=0;i<N;i++){
  if(i%2===0){ A.push((await hit(existing[i],extra))[0]); B.push((await hit(absent[i],extra))[0]) }
  else { B.push((await hit(absent[i],extra))[0]); A.push((await hit(existing[i],extra))[0]) }
}
const med=a=>{const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length/2)]}
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length
const sd=a=>{const m=mean(a);return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1))}
const z=(mean(A)-mean(B))/Math.sqrt(sd(A)**2/A.length+sd(B)**2/B.length)
console.log(ROUTE)
console.log(`existing n=${A.length} median ${med(A).toFixed(2)} mean ${mean(A).toFixed(2)} sd ${sd(A).toFixed(2)} min ${Math.min(...A).toFixed(2)} max ${Math.max(...A).toFixed(2)}`)
console.log(`absent   n=${B.length} median ${med(B).toFixed(2)} mean ${mean(B).toFixed(2)} sd ${sd(B).toFixed(2)} min ${Math.min(...B).toFixed(2)} max ${Math.max(...B).toFixed(2)}`)
console.log(`delta median ${(med(A)-med(B)).toFixed(2)} ms   Welch z ${z.toFixed(2)}`)
// negative control: absent vs absent
const C=[],D=[]
for(let i=0;i<N;i++){ C.push((await hit(`tm${tag}c${i}@nowhere-absent.example.com`,extra))[0]); D.push((await hit(`tm${tag}d${i}@nowhere-absent.example.com`,extra))[0]) }
const zc=(mean(C)-mean(D))/Math.sqrt(sd(C)**2/C.length+sd(D)**2/D.length)
console.log(`control absent-vs-absent delta median ${(med(C)-med(D)).toFixed(2)} ms  z ${zc.toFixed(2)}`)
await prisma.user.deleteMany({where:{email:{in:existing}}})
await prisma.$disconnect()
