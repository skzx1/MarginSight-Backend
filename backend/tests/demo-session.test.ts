import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {LocalStorage} from '../src/storage.js';
import {Repository,pk} from '../src/repository.js';
import {seed} from '../src/seed.js';
import {demoSession} from '../src/demo.js';
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
 assert.equal((await inStore(a,'/products')).items.length,8);assert.deepEqual(await inStore(b,'/products'),before);
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
 assert.equal(dashboard.profitSatang,26800);assert.equal(dashboard.revenueSatang,107500);assert.equal(dashboard.feeSatang,22100);assert.equal(dashboard.marginPct,24.93);assert.equal(dashboard.completeOrders,6);
 const simulation=await inStore(s,'/simulations',{sku:'BAG-001',discountPct:15});assert.equal(simulation.scenario.profitSatang,-1410);
 assert.equal((await inStore(s,'/fee-rules')).items.length,3);assert.equal((await inStore(s,'/enrollments')).items.length,1);
 assert.equal((await inStore(s,'/reconciliation')).items.length,6);
 assert.match((await inStore(s,'/reports/export')).downloadUrl,/^private:/);
 const orders=await inStore(s,'/orders'),evidence=await inStore(s,'/orders/'+orders.items[0].key+'/calculation');assert.equal(evidence.postedFees.length,3);assert.equal(evidence.profitSatang,900);
 assert.equal((await inStore(s,'/integrations')).line.configured,false);
 await assert.rejects(inStore(s,'/line/link',{}),/DEMO_LINE_NOT_CONNECTED/);
});
test('storefront has seven products, five added costs, readable labels and repeatable seeding',async()=>{
 const {start,inStore,repo,call}=fixture(),s=await start();
 const stores=await call(s.accessToken,'/demo/api/me/stores');
 assert.equal(stores.items[0].name,'ร้าน MarginShot');
 const before=await inStore(s,'/products');
 assert.equal(before.items.length,7);
 assert.equal(before.items.every((p:any)=>p.dataOrigin==='MOCK'&&!/demo|เดโม|สาธิต/i.test(p.name+' '+p.sku)),true);
 const expected=[['BAG-002',9500],['CUP-003',14500],['CASE-004',4500],['CAP-005',7000],['BOOK-006',3800]] as const;
 for(const [sku,amount] of expected){const product=before.items.find((p:any)=>p.sku===sku);assert.equal(product.cost.unitCostSatang,amount);assert.equal(product.cost.dataOrigin,'MOCK');assert.equal(product.profitSatang,undefined)}
 const listings=[['BAG-001',20000,24],['BAG-002',19900,18],['CUP-003',29900,20],['CASE-004',12900,40],['CAP-005',15900,30],['BOOK-006',8900,50],['KEY-007',5900,60]] as const;
 for(const [sku,price,quantity] of listings){const product=before.items.find((p:any)=>p.sku===sku);assert.equal(product.sellingPriceSatang,price);assert.equal(product.quantity,quantity);assert.equal(product.listingVersion,1);}
 assert.equal(before.items.find((p:any)=>p.sku==='KEY-007').cost,null);
 // Reseeding the same tenant must not duplicate products/costs or change the ledger.
 const session=await demoSession(repo,'Bearer '+s.accessToken);
 await seed(repo,[{sub:session.subject,store:s.store}],{storefrontIds:true});
 assert.deepEqual(await inStore(s,'/products'),before);
 assert.equal((await inStore(s,'/orders')).items[0].orderId,'ORDER-001');
 assert.equal((await inStore(s,'/dashboard')).profitSatang,26800);
 assert.equal((await inStore(s,'/enrollments')).items[0].programId,'STORE-PROGRAM');
});
test('every added product has a reconciled single-SKU order and assistant discount result; missing data stays unknown',async()=>{
 const {start,inStore,ctx,repo}=fixture(),s=await start();
 // Independently checked: discounted revenue minus 20% fees, cost, packaging and ads.
 const cases=[['BAG-002','ORDER-002',3032],['CUP-003','ORDER-003',4132],['CASE-004','ORDER-004',3472],['CAP-005','ORDER-005',2812],['BOOK-006','ORDER-006',1952]] as const;
 for(const [sku,orderId,expected] of cases){
  const reply=await ctx.ai.assistant(s.store,{message:'ถ้าลดราคา 15% จะเหลือกำไรเท่าไร',sku,month:'2026-10'});
  assert.equal(reply.result?.profitSatang,expected);assert.equal(reply.provider,'deterministic-fallback');assert.equal(reply.result?.dataOrigin,'MOCK');
  const order=await repo.input(s.store,'mock-market',orderId);
  assert.equal(order.items.length,1);assert.equal(order.items[0].sku,sku);assert.equal(order.order.feesConfirmed,true);
 }
 const reconciled=await inStore(s,'/reconciliation');assert.equal(reconciled.items.length,6);assert.equal(reconciled.items.every((x:any)=>x.payoutReconciled===true),true);
 await assert.rejects(ctx.ai.assistant(s.store,{message:'ลดราคา 15%',sku:'KEY-007',month:'2026-10'}),/SKU_HAS_NO_ORDER/);
 await assert.rejects(ctx.ai.assistant(s.store,{message:'ลดราคา 15%',sku:'CAP-005',month:'2026-09'}),/SKU_HAS_NO_ORDER/);
});
test('guest input cannot claim REAL provenance; imported jobs remain tenant-bound and bounded',async()=>{
 const {start,inStore,repo,files,tasks,ctx,db}=fixture(),a=await start(),b=await start();
 for(const endpoint of ['/imports','/receipts','/fee-rules','/enrollments','/products/BAG-001/cost-versions'])await assert.rejects(inStore(a,endpoint,{dataOrigin:'REAL'}),/DEMO_REQUIRES_MOCK_DATA/);
 await assert.rejects(inStore(a,'/imports',{adapter:'merchant-v1',dataOrigin:'MOCK'}),/DEMO_REQUIRES_MOCK_DATA/);
 for(const kind of ['products','orders','fees']){
  const result=await inStore(a,'/imports',{kind,fileName:kind+'.csv',adapter:'mock-v1',dataOrigin:'MOCK'}),job=await repo.job(a.store,result.id);
  const sample=await readFile(new URL('../../fixtures/mock-v1/'+kind+'.csv',import.meta.url),'utf8');
  await files.put(job.value.objectKey,Buffer.from(sample.replaceAll('SKU-DEMO-01','BAG-001').replaceAll('O-DEMO-001','ORDER-001').replaceAll('DEMO-PROGRAM','STORE-PROGRAM')),'text/csv');
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
 assert.equal((await inStore(b,'/orders')).items.length,6);
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
