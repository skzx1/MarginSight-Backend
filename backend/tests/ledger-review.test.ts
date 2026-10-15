import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LocalStorage} from '../src/storage.js';
import {Repository,orderKey} from '../src/repository.js';
import {seed} from '../src/seed.js';
import {createContext} from '../src/context.js';
import {route} from '../src/api.js';
import {localSession} from '../src/auth.js';
import {Importer} from '../src/importer.js';
test('changed financial ledger reopens confirmation and rejects a stale reviewed snapshot',async()=>{
 process.env.LOCAL_MODE='true';const repo=new Repository(new LocalStorage());await seed(repo);const ctx=createContext(repo,{} as any,{send:async()=>{}}),path='/stores/DEMO-001/orders/'+orderKey('mock-market','O-DEMO-001'),authorization='Bearer '+localSession('demo-a');
 const call=(suffix:string,body?:any)=>route(ctx,{method:body?'POST':'GET',path:path+suffix,authorization,query:{},body});
 const reviewed=await call('/calculation');assert.equal(reviewed.postedFees.length,3);assert.equal(reviewed.feeStatus,'ACTUAL');
 await repo.mergeLedger('DEMO-001','mock-market','O-DEMO-001','FEE#supplement',{feeId:'supplement',type:'PLATFORM_FEE',scope:'PER_ORDER',amountSatang:100,dataOrigin:'MOCK',sourceRef:'supplemental statement',effectiveAt:'2026-10-14T05:00:00.000Z'});
 const changed=await repo.input('DEMO-001','mock-market','O-DEMO-001');assert.equal(changed.order.feesConfirmed,false);
 await assert.rejects(()=>repo.confirmFees('DEMO-001','mock-market','O-DEMO-001',reviewed.ledgerVersion),/LEDGER_CHANGED_REVIEW_AGAIN/);
 await assert.rejects(()=>call('/settle',{confirmAllFeeLines:true,expectedInputHash:reviewed.inputHash}),/ORDER_CHANGED_REVIEW_AGAIN/);
 const current=await call('/calculation');assert.equal(current.postedFees.length,4);assert.equal(current.payoutReconciled,null);
 const confirmed=await call('/settle',{confirmAllFeeLines:true,expectedInputHash:current.inputHash,payoutSatang:15300});assert.equal(confirmed.feeStatus,'ACTUAL');assert.equal(confirmed.profitSatang,800);assert.equal(confirmed.payoutReconciled,true);
});
test('transient database failure stays retryable and does not become a rejected data row',async()=>{
 const db=new LocalStorage(),repo=new Repository(db),tasks:any[]=[],objects=new Map<string,Buffer>();const files={get:async(k:string)=>objects.get(k)!,put:async(k:string,b:Buffer)=>{objects.set(k,b)}} as any;
 const job=await repo.createJob('TEST',{kind:'orders',fileName:'orders.csv',objectKey:'TEST/orders.csv',status:'QUEUED'});objects.set('TEST/orders.csv',Buffer.from('platform,order_id,line_id,order_at,sku,quantity,revenue_thb\nmock,O1,L1,2026-10-14,A,1,200.00\n'));
 const importer=new Importer(repo,files,{send:async t=>{tasks.push(t)}});await importer.run({kind:'IMPORT',store:'TEST',jobId:job.id});
 const transact=db.transact.bind(db);db.transact=async()=>{throw new Error('temporary service unavailable')};await assert.rejects(()=>importer.run(tasks[0]),/temporary service unavailable/);assert.equal((await repo.job('TEST',job.id)).value.status,'PROCESSING');
 await assert.rejects(()=>repo.input('TEST','mock','O1'),/ORDER_IMPORT_REQUIRES_REVIEW/);
 db.transact=transact;await importer.run(tasks[0]);const result=(await repo.job('TEST',job.id)).value;assert.equal(result.status,'COMPLETED');assert.equal(result.rejected,0);assert.equal(result.accepted,1);assert.equal((await repo.input('TEST','mock','O1')).items.length,1);
});
test('seed recovers missing fixture records without overwriting values or reconfirming changed orders',async()=>{
 const repo=new Repository(new LocalStorage());await repo.writeCatalog('DEMO-001','PRODUCT#SKU-DEMO-01',{sku:'SKU-DEMO-01',name:'Preserve existing name',unit:'piece'},true);
 await repo.mergeLedger('DEMO-001','mock-market','O-DEMO-001','HEADER',{platform:'mock-market',orderId:'O-DEMO-001',orderAt:'2026-10-14T05:00:00.000Z',settlementStatus:'UNSETTLED',feesConfirmed:false,dataOrigin:'MOCK',sourceRef:'partial bootstrap'});
 await seed(repo);const input=await repo.input('DEMO-001','mock-market','O-DEMO-001');assert.equal(input.items.length,1);assert.equal(input.fees.length,3);assert.equal(input.costs.length,1);assert.equal(input.order.feesConfirmed,false);
 assert.equal((await repo.db.get('catalog','STORE#DEMO-001','PRODUCT#SKU-DEMO-01'))?.value.name,'Preserve existing name');
 await repo.confirmFees('DEMO-001','mock-market','O-DEMO-001');await seed(repo);assert.equal((await repo.input('DEMO-001','mock-market','O-DEMO-001')).order.feesConfirmed,true);
});
