const P='http://127.0.0.1:3266'
async function csrf(){
  const r = await fetch(P+'/api/auth/csrf')
  const j = await r.json()
  const c = r.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ')
  return { t:j.csrfToken, c }
}
async function post(path, body, extra={}){
  const {t,c} = await csrf()
  const t0=process.hrtime.bigint()
  const r = await fetch(P+path,{method:'POST',headers:{'content-type':'application/json','x-csrf-token':t,cookie:c,...extra},body:JSON.stringify(body)})
  const ms = Number(process.hrtime.bigint()-t0)/1e6
  const txt = await r.text()
  return {status:r.status, ms, body:txt.slice(0,200)}
}
// 1. CSRF enforcement
for (const path of ['/api/auth/verify-email-code','/api/auth/resend-verification','/api/auth/forgot-password']) {
  const r = await fetch(P+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code:'123456',email:'x@y.com'})})
  console.log('NO-CSRF', path, r.status, (await r.text()).slice(0,60))
}
console.log()
// 2. verify-email-code shapes
const EXIST='grader1786563021354@example.com'   // verified account from earlier
console.log('verified acct wrong code  ', JSON.stringify(await post('/api/auth/verify-email-code',{code:'000000',email:EXIST})))
console.log('absent acct wrong code    ', JSON.stringify(await post('/api/auth/verify-email-code',{code:'000000',email:'nobody-'+Date.now()+'@example.com'})))
console.log('short code                ', JSON.stringify(await post('/api/auth/verify-email-code',{code:'12',email:EXIST})))
console.log()
console.log('resend absent  ', JSON.stringify(await post('/api/auth/resend-verification',{email:'nobody-'+Date.now()+'@example.com'})))
console.log('resend verified', JSON.stringify(await post('/api/auth/resend-verification',{email:EXIST})))
console.log('resend no body ', JSON.stringify(await post('/api/auth/resend-verification',{})))
