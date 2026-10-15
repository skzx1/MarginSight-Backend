import assert from 'node:assert/strict';
const base=process.env.SMOKE_API_URL,token=process.env.SMOKE_ACCESS_TOKEN,store=process.env.SMOKE_STORE_ID;
assert.ok(base&&token&&store,'Set SMOKE_API_URL, SMOKE_ACCESS_TOKEN, SMOKE_STORE_ID through your authenticated session; do not save tokens in files');
const response=await fetch(base+'/health');assert.equal(response.status,200);const unauthorized=await fetch(base+'/me/stores');assert.equal(unauthorized.status,401);
for(const path of ['/me/stores','/stores/'+store+'/products','/stores/'+store+'/dashboard?month=2026-10']){const r=await fetch(base+path,{headers:{authorization:'Bearer '+token}});assert.equal(r.status,200,path);const value=await r.json();if(path.includes('dashboard'))assert.equal(value.profitSatang,900)}
console.log('PASS AWS core API smoke. Browser/import/OCR/LINE checks are separate gates.');
