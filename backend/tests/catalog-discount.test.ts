import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LocalStorage} from '../src/storage.js';
import {Repository,pk} from '../src/repository.js';
import {createContext} from '../src/context.js';
import {localSession} from '../src/auth.js';
import {route} from '../src/api.js';
import {catalogDiscount,discountPercent} from '../src/catalog-discount.js';
import {seed} from '../src/seed.js';
process.env.LOCAL_MODE='true';process.env.AI_ENABLED='false';
const at='2026-10-25T10:00:00.000Z';
function fixture(){const db=new LocalStorage(),repo=new Repository(db),ctx=createContext(repo,{} as any,{send:async()=>{}});const call=(path:string,body?:unknown,user='demo-a')=>route(ctx,{method:body===undefined?'GET':'POST',path,body,authorization:'Bearer '+localSession(user),query:{month:'2026-10'}});return {db,repo,call};}
async function productFixture(){const f=fixture(),store=(await f.call('/me/store',{name:'ร้านทดสอบราคาก่อนขาย'})).id,base='/stores/'+store;await f.call(base+'/products',{sku:'ASAW',name:'สินค้า ASAW',unit:'ชิ้น',sellingPriceSatang:25000,quantity:7});await f.call(base+'/products/ASAW/cost-versions',{sku:'ASAW',unitCostSatang:12000,effectiveFrom:'2026-01-01T00:00:00.000Z',sourceRef:'merchant test input',dataOrigin:'REAL',method:'MERCHANT_CONFIRMED_UNIT_COST'});return {...f,store,base};}
test('discount without any order uses current catalog price/cost and exposes only a pre-expense difference, never invented net profit',async()=>{
 const {call,db,base,store}=await productFixture(),before=structuredClone(db.data);
 const answer=await call(base+'/assistant/catalog-discount',{sku:'ASAW',message:'ถ้าลดราคา 20% จะเหลือกำไรเท่าไร',locale:'th'}),r=answer.catalogScenario;
 assert.equal(r.store,store);assert.equal(r.originalPriceSatang,25000);assert.equal(r.discountedPriceSatang,20000);assert.equal(r.unitCostSatang,12000);assert.equal(r.differenceBeforeExpensesSatang,8000);assert.equal(r.netProfitSatang,null);assert.equal(r.quantity,1);assert.equal(r.dataOrigin,'REAL');assert.equal(r.notSaved,true);
 assert.ok(r.missingFields.includes('platformFees'));assert.ok(answer.answer.includes('ยังไม่ใช่กำไรสุทธิ'));assert.equal(answer.result,undefined);
 assert.deepEqual(db.data,before);assert.equal((await call(base+'/orders')).items.length,0);
});
test('catalog price and current effective cost win over historical sale inputs while monthly order profit stays unchanged',async()=>{
 const {repo,call,db}=fixture();await seed(repo);const base='/stores/DEMO-001';
 await call(base+'/products/SKU-DEMO-01/listing',{sellingPriceSatang:30000,quantity:4,expectedListingVersion:0});
 await call(base+'/products/SKU-DEMO-01/cost-versions',{sku:'SKU-DEMO-01',unitCostSatang:14000,effectiveFrom:'2026-10-20T00:00:00.000Z',sourceRef:'new current supplier cost',dataOrigin:'MOCK',method:'MERCHANT_CONFIRMED_UNIT_COST'});
 const before=await call(base+'/dashboard'),ledger=structuredClone(db.data.ledger);
 const r=(await catalogDiscount(repo,'DEMO-001',{sku:'SKU-DEMO-01',message:'ลดราคา 20%'},at)).catalogScenario;
 assert.equal(r.originalPriceSatang,30000);assert.equal(r.discountedPriceSatang,24000);assert.equal(r.unitCostSatang,14000);assert.equal(r.differenceBeforeExpensesSatang,10000);
 assert.equal(before.profitSatang,900);assert.deepEqual(await call(base+'/dashboard'),before);assert.deepEqual(db.data.ledger,ledger);
});
test('missing and zero catalog values remain distinct; a future cost is not current and absent cost never becomes zero',async()=>{
 const {repo,call,store,base}=await productFixture();
 await call(base+'/products',{sku:'NO-PRICE',name:'No price',unit:'ชิ้น'});
 const missing=await catalogDiscount(repo,store,{sku:'NO-PRICE',message:'ลดราคา 20%'},at);assert.ok(missing.catalogScenario.missingFields.includes('sellingPriceSatang'));assert.ok(missing.answer.includes('ไม่จำเป็นต้องมีออเดอร์'));
 await call(base+'/products',{sku:'NO-COST',name:'Unknown cost',unit:'ชิ้น',sellingPriceSatang:10000});
 await call(base+'/products/NO-COST/cost-versions',{sku:'NO-COST',unitCostSatang:1000,effectiveFrom:'2027-01-01T00:00:00.000Z',sourceRef:'future cost',dataOrigin:'REAL',method:'MERCHANT_CONFIRMED_UNIT_COST'});
 const unknown=(await catalogDiscount(repo,store,{sku:'NO-COST',message:'ลดราคา 20%'},at)).catalogScenario;assert.equal(unknown.discountedPriceSatang,8000);assert.equal(unknown.unitCostSatang,null);assert.equal(unknown.differenceBeforeExpensesSatang,null);assert.equal(unknown.netProfitSatang,null);
 await call(base+'/products',{sku:'FREE',name:'Known zero',unit:'ชิ้น',sellingPriceSatang:0});await call(base+'/products/FREE/cost-versions',{sku:'FREE',unitCostSatang:0,effectiveFrom:'2026-01-01T00:00:00.000Z',sourceRef:'confirmed zero',dataOrigin:'REAL',method:'MERCHANT_CONFIRMED_UNIT_COST'});
 const zero=(await catalogDiscount(repo,store,{sku:'FREE',message:'ลดราคา 20%'},at)).catalogScenario;assert.equal(zero.discountedPriceSatang,0);assert.equal(zero.differenceBeforeExpensesSatang,0);assert.equal(zero.netProfitSatang,null);
});
test('discount rounding is exact to satang, ambiguous percentages ask back, and invalid/forged inputs are rejected',async()=>{
 const {repo,call,store,base}=await productFixture();await call(base+'/products/ASAW/listing',{sellingPriceSatang:30,expectedListingVersion:1});await call(base+'/products/ASAW/cost-versions',{sku:'ASAW',unitCostSatang:10,effectiveFrom:'2026-10-20T00:00:00.000Z',sourceRef:'decimal rounding case',dataOrigin:'REAL',method:'MERCHANT_CONFIRMED_UNIT_COST'});
 const r=(await catalogDiscount(repo,store,{sku:'ASAW',message:'ลดราคา 15%'},at)).catalogScenario;assert.equal(r.discountedPriceSatang,26);assert.equal(r.differenceBeforeExpensesSatang,16);
 assert.equal(discountPercent('ลดราคา สิบห้าเปอร์'),15);assert.equal(discountPercent('ลดราคา 0%'),0);assert.equal(discountPercent('discount 100%'),100);assert.equal(discountPercent('ไม่ลดราคาแต่เข้าแคมเปญ'),0);assert.equal(discountPercent('ลดราคา 10% หรือ ลดราคา 20%'),undefined);
 const unclear=await catalogDiscount(repo,store,{sku:'ASAW',message:'ลดราคาเท่าไรดี'},at);assert.deepEqual(unclear.catalogScenario.missingFields,['discountPct']);
 for(const message of ['ลดราคา -1%','ลดราคา 101%'])await assert.rejects(()=>catalogDiscount(repo,store,{sku:'ASAW',message},at),/INVALID_DISCOUNT/);
 await assert.rejects(()=>call(base+'/assistant/catalog-discount',{sku:'ASAW',message:'ลดราคา 20%',sellingPriceSatang:999999}));
});
test('catalog discount enforces membership, read-only access and SKU ownership on every API path',async()=>{
 const {repo,call,store,base}=await productFixture();const body={sku:'ASAW',message:'ลดราคา 20%'};
 await assert.rejects(()=>call(base+'/assistant/catalog-discount',body,'demo-b'),/FORBIDDEN/);
 await repo.db.put('memberships',{PK:'USER#demo-b',SK:pk(store),version:1,value:{role:'VIEWER',dataOrigin:'REAL'}},0);
 await assert.rejects(()=>call(base+'/assistant/catalog-discount',body,'demo-b'),/FORBIDDEN/);
 await assert.rejects(()=>call(base+'/assistant/catalog-discount',{...body,sku:'OTHER-TENANT-SKU'}),/PRODUCT_NOT_FOUND/);
});

const campaign={platform:'shopee',category:'general',sellerType:'NON_MALL',campaigns:['shopee-prime'],commissionRateBps:1000,commissionVat:'INCLUDED',paymentRateBps:300,paymentBase:'REVENUE',buyerShippingSatang:0,fixedFeeExempt:false,growthTier:'STANDARD',primeElectronicsRateBps:null,liveRateBps:null,confirmed:true};
test('selected Playground campaigns use catalog prices and exact platform fee rules without a prior order or monthly mutation',async()=>{
 const {call,base,db}=await productFixture(),before=structuredClone(db.data);
 const answer=await call(base+'/assistant/catalog-discount',{sku:'ASAW',message:'ลดราคา 20%',scenario:campaign}),r=answer.catalogScenario;
 // 200 THB after discount: commission20 + payment6 + fixed1.07 + PRIME17.12 =44.19.
 assert.equal(r.knownPlatformFeeSatang,4419);assert.equal(r.differenceAfterKnownFeesBeforeOtherExpensesSatang,3581);assert.equal(r.platformFeeSatang,4419);assert.equal(r.knownCampaignFeeSatang,1712);assert.equal(r.differenceBeforeExpensesSatang,8000);assert.equal(r.differenceAfterPlatformFeesBeforeOtherExpensesSatang,3581);assert.equal(r.netProfitSatang,null);assert.deepEqual(r.campaigns,['shopee-prime']);
 assert.ok(answer.answer.includes('35.81'));assert.ok(answer.answer.includes('ไม่สมัครแคมเปญ'));assert.deepEqual(db.data,before);
 const original=(await call(base+'/assistant/catalog-discount',{sku:'ASAW',message:'แคมเปญนี้เหลือเท่าไร',scenario:campaign})).catalogScenario;assert.equal(original.discountPct,0);assert.equal(original.originalPriceSatang,25000);
});
test('unknown base fees remain unknown despite a selected campaign; invalid participation cannot enter calculations',async()=>{
 const {call,base}=await productFixture();
 const answer=await call(base+'/assistant/catalog-discount',{sku:'ASAW',message:'ลดราคา 20%',scenario:{...campaign,commissionRateBps:null,commissionVat:'UNKNOWN'}}),r=answer.catalogScenario;
 assert.equal(r.knownPlatformFeeSatang,2419);assert.equal(r.differenceAfterKnownFeesBeforeOtherExpensesSatang,5581);assert.match(answer.answer,/55.81/);assert.ok(!answer.answer.includes('ค่าบริการพื้นฐานยังไม่มีข้อมูลยืนยัน'));
 assert.equal(r.knownCampaignFeeSatang,1712);assert.equal(r.platformFeeSatang,null);assert.equal(r.differenceAfterPlatformFeesBeforeOtherExpensesSatang,null);assert.equal(r.netProfitSatang,null);assert.ok(r.missingFields.includes('platformFees'));
 await assert.rejects(()=>call(base+'/assistant/catalog-discount',{sku:'ASAW',message:'ลดราคา 20%',scenario:{...campaign,confirmed:false}}));
 await assert.rejects(()=>call(base+'/assistant/catalog-discount',{sku:'ASAW',message:'ลดราคา 20%',scenario:{...campaign,platform:'lazada'}}));
});
