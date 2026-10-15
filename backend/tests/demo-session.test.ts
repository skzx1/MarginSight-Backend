import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {LocalStorage} from '../src/storage.js';
import {Repository,pk} from '../src/repository.js';
import {createContext} from '../src/context.js';
import {route} from '../src/api.js';
import {localSession} from '../src/auth.js';
import type {Task} from '../src/files.js';
process.env.LOCAL_MODE='true';process.env.AI_ENABLED='false';process.env.DEMO_ENABLED='true';process.env.DEMO_WEB_ORIGIN='https://demo.example.test';
function fixture(){
 const db=new LocalStorage(),repo=new Repository(db),objects=new Map<string,{bytes:Buffer;type:string}>(),tasks:Task[]=[];
 const files:any={uploadUrl:async(k:string)=>'private:'+k,downloadUrl:async(k:string)=>'private:'+k,put:async(k:string,bytes:Buffer,type:string)=>{objects.set(k,{bytes,type})},get:async(k:string)=>objects.get(k)!.bytes,head:async(k:string)=>({size:objects.get(k)!.bytes.length,type:objects.get(k)!.type})};
 const ctx=createContext(repo,files,{send:async t=>{tasks.push(t)}});
 const call=(token:string|undefined,path:string,body?:unknown,origin=process.env.DEMO_WEB_ORIGIN)=>route(ctx,{path,method:body===undefined?'GET':'POST',authorization:token?'Bearer '+token:undefined,origin,query:{month:'2026-10'},body});
 const start=()=>call(undefined,'/demo/session',{});
 const inStore=(s:any,path:string,body?:unknown)=>call(s.accessToken,'/demo/api/stores/'+s.store+path,body);
 return {db,repo,ctx,call,start,inStore,files,tasks};
}
test('one-click sessions seed separate MOCK tenants; no static password or access to Cognito/private paths',async()=>{
 const {db,call,start,inStore}=fixture(),a=await start(),b=await start();
 assert.notEqual(a.accessToken,b.accessToken);assert.notEqual(a.store,b.store);
 assert.equal(JSON.stringify(db.data).includes(a.accessToken),false);
 const stores=await call(a.accessToken,'/demo/api/me/stores');assert.equal(stores.items.length,1);assert.equal(stores.items[0].id,a.store);assert.equal(stores.items[0].guest,true);
 const before=await inStore(b,'/products');await inStore(a,'/products',{sku:'ONLY-A',name:'ข้อมูลจำลอง',unit:'ชิ้น'});
 assert.equal((await inStore(a,'/products')).items.length,3);assert.deepEqual(await inStore(b,'/products'),before);
 for(const path of ['/products','/jobs','/reports/export','/orders','/integrations'])await assert.rejects(call(a.accessToken,'/demo/api/stores/'+b.store+path),/FORBIDDEN/);
 await assert.rejects(call(a.accessToken,'/demo/api/me/store',{name:'Forbidden personal store'}),/FORBIDDEN/);
 await assert.rejects(call(a.accessToken,'/me/stores'),/UNAUTHORIZED/);
 await assert.rejects(call(localSession('demo-a'),'/demo/api/me/stores'),/UNAUTHORIZED/);
 await assert.rejects(call(undefined,'/demo/api/me/stores'),/UNAUTHORIZED/);
 await assert.rejects(call(a.accessToken,'/demo/api/me/stores',undefined,'https://wrong.example'),/DEMO_ORIGIN_NOT_ALLOWED/);
 const row=await db.get('jobs','DEMOSESSION#'+createHash('sha256').update(a.accessToken).digest('hex'),'SESSION');assert(row);row.value.expiresAt=1;await db.put('jobs',row);
 await assert.rejects(inStore(a,'/products'),/DEMO_SESSION_EXPIRED/);
});
test('full demo uses shared financial engine, evidence, simulation, rules, reconciliation and export',async()=>{
 const {start,inStore}=fixture(),s=await start(),dashboard=await inStore(s,'/dashboard');
 assert.equal(dashboard.profitSatang,900);assert.equal(dashboard.revenueSatang,20000);assert.equal(dashboard.feeSatang,4600);assert.equal(dashboard.marginPct,4.5);
 const simulation=await inStore(s,'/simulations',{sku:'SKU-DEMO-01',discountPct:15});assert.equal(simulation.scenario.profitSatang,-1410);
 assert.equal((await inStore(s,'/fee-rules')).items.length,3);assert.equal((await inStore(s,'/enrollments')).items.length,1);
 assert.equal((await inStore(s,'/reconciliation')).items.length,1);
 assert.match((await inStore(s,'/reports/export')).downloadUrl,/^private:/);
 const orders=await inStore(s,'/orders'),evidence=await inStore(s,'/orders/'+orders.items[0].key+'/calculation');assert.equal(evidence.postedFees.length,3);assert.equal(evidence.profitSatang,900);
 assert.equal((await inStore(s,'/integrations')).line.configured,false);
 await assert.rejects(inStore(s,'/line/link',{}),/DEMO_LINE_NOT_CONNECTED/);
});
test('guest input cannot claim REAL provenance; imported jobs remain tenant-bound and bounded',async()=>{
 const {start,inStore,repo,files,tasks,ctx,db}=fixture(),a=await start(),b=await start();
 for(const endpoint of ['/imports','/receipts','/fee-rules','/enrollments','/products/SKU-DEMO-01/cost-versions'])await assert.rejects(inStore(a,endpoint,{dataOrigin:'REAL'}),/DEMO_REQUIRES_MOCK_DATA/);
 await assert.rejects(inStore(a,'/imports',{adapter:'merchant-v1',dataOrigin:'MOCK'}),/DEMO_REQUIRES_MOCK_DATA/);
 for(const kind of ['products','orders','fees']){
  const result=await inStore(a,'/imports',{kind,fileName:kind+'.csv',adapter:'mock-v1',dataOrigin:'MOCK'}),job=await repo.job(a.store,result.id);
  await files.put(job.value.objectKey,await readFile(new URL('../../fixtures/mock-v1/'+kind+'.csv',import.meta.url)),'text/csv');
  await assert.rejects(inStore(b,'/imports/'+result.id),/JOB_NOT_FOUND/);
  await inStore(a,'/imports/'+result.id+'/complete',{});while(tasks.length)await ctx.run(tasks.shift()!);
  if(kind==='products'){
   assert.equal((await repo.job(a.store,result.id)).value.status,'PARTIAL');
   const conflicts=await inStore(a,'/conflicts');assert.equal(conflicts.items.length,1);
   await inStore(a,'/conflicts/'+conflicts.items[0].id+'/resolve',{choice:'KEEP_EXISTING',reason:'Keep the independently seeded MOCK description'});
   await inStore(a,'/imports/'+result.id+'/review',{acknowledgeExcludedRows:true,reason:'Reviewed synthetic product description conflict'});
  }
  assert.equal((await repo.job(a.store,result.id)).value.status,'COMPLETED');
 }
 await assert.rejects(inStore(a,'/imports',{kind:'orders',fileName:'again.csv',adapter:'mock-v1',dataOrigin:'MOCK'}),/DEMO_IMPORT_LIMIT/);
 assert.equal((await inStore(b,'/orders')).items.length,1);
 for(const table of ['memberships','catalog','ledger','jobs'] as const)for(const row of Object.values(db.data[table]))if(row.PK.startsWith(pk(a.store))||row.PK.startsWith('USER#guest-'))assert(row.expiresAt&&row.expiresAt<=Math.floor(Date.now()/1000)+86400);
 for(let i=0;i<3;i++)await inStore(b,'/receipts',{fileName:'mock.png',dataOrigin:'MOCK'});
 await assert.rejects(inStore(b,'/receipts',{fileName:'mock.png',dataOrigin:'MOCK'}),/DEMO_AI_LIMIT/);
});
test('session creation is origin-bound and has a global daily limit; clients cannot choose identities',async()=>{
 const {start,call}=fixture();
 await assert.rejects(call(undefined,'/demo/session',{},'https://wrong.example'),/DEMO_ORIGIN_NOT_ALLOWED/);
 await assert.rejects(call(undefined,'/demo/session',{store:'PRIVATE',subject:'victim'}),/INVALID_DEMO_REQUEST/);
 for(let i=0;i<20;i++)await start();
 await assert.rejects(start(),/DEMO_DAILY_LIMIT/);
});
