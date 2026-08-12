import { PrismaClient } from '@prisma/client'
const prisma=new PrismaClient()
const base=`http://127.0.0.1:${process.env.PORT||3271}`
const ROUTE=process.env.ROUTE||'/api/auth/forgot-password'
const N=Number(process.env.N||90), CONC=Number(process.env.CONC||60)
const tag=Date.now()
const cr=await fetch(base+'/api/auth/csrf'); const cj=await cr.json()
const token=cj.token||cj.csrfToken
const cookie=cr.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ')
const existing=[]
for(let i=0;i<N;i++){const e=`cc${tag}x${i}@example.com`; await prisma.user.create({data:{email:e,firstName:'T',password:'x'}}); existing.push(e)}
const absent=Array.from({length:N},(_,i)=>`cc${tag}z${i}@nowhere-absent.example.com`)
const extra = ROUTE.includes('verify-email-code')?{code:'000000'}:{}
async function hit(email){const t=process.hrtime.bigint()
 const r=await fetch(base+ROUTE,{method:'POST',headers:{'content-type':'application/json','x-csrf-token':token,cookie},body:JSON.stringify({email,...extra})})
 await r.text(); return {ms:Number(process.hrtime.bigint()-t)/1e6, status:r.status}}
// build interleaved job list
function run(listA,listB){
  const jobs=[]
  for(let i=0;i<listA.length;i++){jobs.push(['A',listA[i]]);jobs.push(['B',listB[i]])}
  const A=[],B=[]
  let idx=0
  const workers=Array.from({length:CONC},async()=>{
    while(true){const k=idx++; if(k>=jobs.length)break
      const [c,e]=jobs[k]; const r=await hit(e); (c==='A'?A:B).push(r)}})
  return Promise.all(workers).then(()=>[A,B])
}
const med=a=>{const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length/2)]}
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length
const sd=a=>{const m=mean(a);return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1))}
function rep(name,A,B){
 const a=A.map(r=>r.ms), b=B.map(r=>r.ms)
 const z=(mean(a)-mean(b))/Math.sqrt(sd(a)**2/a.length+sd(b)**2/b.length)
 console.log(`${name}: A n=${a.length} med ${med(a).toFixed(2)} | B n=${b.length} med ${med(b).toFixed(2)} | delta ${(med(a)-med(b)).toFixed(2)} ms  z ${z.toFixed(2)}  statuses A ${[...new Set(A.map(r=>r.status))]} B ${[...new Set(B.map(r=>r.status))]}`)
}
const [A,B]=await run(existing,absent); rep(`${ROUTE} conc=${CONC} existing-vs-absent`,A,B)
const c1=Array.from({length:N},(_,i)=>`cc${tag}c${i}@nowhere-absent.example.com`)
const c2=Array.from({length:N},(_,i)=>`cc${tag}d${i}@nowhere-absent.example.com`)
const [C,D]=await run(c1,c2); rep(`${ROUTE} conc=${CONC} CONTROL absent-vs-absent`,C,D)
await prisma.user.deleteMany({where:{email:{in:existing}}})
await prisma.$disconnect()
