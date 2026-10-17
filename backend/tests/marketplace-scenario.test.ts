import {test} from 'node:test';
import assert from 'node:assert/strict';
import {marketplaceInput,marketplaceScenarioSchema,type MarketplaceScenario} from '../src/marketplace-scenario.js';
import {calculate} from '../src/domain/calculate.js';
import {demoFixture} from '../src/domain/demo-fixture.js';
import {AI} from '../src/ai.js';
import {LocalStorage} from '../src/storage.js';
import {Repository} from '../src/repository.js';
import {seed} from '../src/seed.js';
import {route} from '../src/api.js';
import {localSession} from '../src/auth.js';
import {LocalFiles} from '../src/files.js';
import {createContext} from '../src/context.js';
import {tmpdir} from 'node:os';
const choice=(patch:Partial<MarketplaceScenario>={}):MarketplaceScenario=>({platform:'shopee',category:'general',sellerType:'NON_MALL',campaigns:['shopee-prime'],commissionRateBps:1200,commissionVat:'INCLUDED',paymentRateBps:321,paymentBase:'BUYER_PLUS_PLATFORM_PLUS_SHIPPING',buyerShippingSatang:0,fixedFeeExempt:false,growthTier:'STANDARD',primeElectronicsRateBps:null,liveRateBps:null,confirmed:true,...patch});
test('Shopee hypothetical PRIME uses chosen base fees, excludes posted/old rules, and preserves source ledger',()=>{
 const source=demoFixture();source.order.settlementStatus='SETTLED';source.order.feesConfirmed=true;source.fees=[{...source.order,feeId:'posted',type:'COMMISSION',amountSatang:4600,scope:'PER_ORDER',effectiveAt:source.order.orderAt}];
 const before=structuredClone(source),out=marketplaceInput(source,choice()),result=calculate(out.input);
 // 200*12% + 200*3.21% + 1.07 + 200*8%*1.07 = 48.61
 assert.equal(result.feeSatang,4861);assert.equal(result.profitSatang,639);assert.equal(result.feeStatus,'ESTIMATED');assert.equal(result.platform,'shopee');assert.equal(result.dataOrigin,'MOCK');assert.deepEqual(source,before);assert.equal(out.context.notSaved,true);
 assert.equal(result.feeLines.filter(f=>f.type==='PROGRAM').length,1);assert.equal(out.input.fees.length,0);
});
test('Lazada package replaces separate FSS/voucher charges and adds VAT once per unit',()=>{
 const input=demoFixture();Object.assign(input.items[0],{revenueSatang:50000,buyerPaymentSatang:50000,packagingSatang:0,adsSatang:0});input.costs[0].unitCostSatang=20000;
 const result=calculate(marketplaceInput(input,choice({platform:'lazada',campaigns:['lazada-premium'],commissionRateBps:1000})).input);
 assert.equal(result.feeLines.find(f=>f.type==='PROGRAM')!.amountSatang,4280);assert.equal(result.feeSatang,10885);assert.equal(result.profitSatang,19115);assert.equal(result.feeLines.length,3);
});
test('TikTok campaign is additional to mandatory growth and fixed fee; no campaign does not waive growth',()=>{
 const s=choice({platform:'tiktok',campaigns:['tiktok-bcd']});
 const result=calculate(marketplaceInput(demoFixture(),s).input);
 assert.equal(result.feeSatang,5397);assert.equal(result.profitSatang,103);assert.equal(result.feeLines.find(f=>f.type==='COMMERCE_GROWTH')!.amountSatang,1606);
 const none=calculate(marketplaceInput(demoFixture(),{...s,campaigns:[]}).input);assert.equal(none.feeSatang,4755);
 const shipping=calculate(marketplaceInput(demoFixture(),{...s,buyerShippingSatang:1000}).input);assert.equal(shipping.feeLines.find(f=>f.type==='TRANSACTION')!.amountSatang,674);assert.equal(shipping.feeLines.find(f=>f.type==='PROGRAM')!.amountSatang,642);
 const input=demoFixture();Object.assign(input.items[0],{quantity:2,revenueSatang:1000000,buyerPaymentSatang:1000000});
 assert.equal(calculate(marketplaceInput(input,s).input).feeLines.find(f=>f.type==='COMMERCE_GROWTH')!.amountSatang,39800);
 const small=calculate(marketplaceInput(demoFixture(),{...s,growthTier:'SMALL'}).input);assert.equal(small.feeLines.find(f=>f.type==='COMMERCE_GROWTH')!.amountSatang,1498);
});
test('unknown merchant commission/VAT, program rate and unsupported date never become zero-profit completeness',()=>{
 for(const s of [choice({commissionRateBps:null}),choice({commissionVat:'UNKNOWN'}),choice({category:'electronics'}),choice({campaigns:['shopee-live']})]){
  const result=calculate(marketplaceInput(demoFixture(),s).input);assert.equal(result.profitSatang,null);assert.ok(result.missingFields.some(f=>f.startsWith('rule:')));
 }
 const old=demoFixture();old.order.orderAt='2026-07-01T00:00:00.000Z';const result=calculate(marketplaceInput(old,choice({platform:'lazada',campaigns:['lazada-premium']})).input);assert.equal(result.profitSatang,null);
 assert.throws(()=>marketplaceScenarioSchema.parse(choice({platform:'lazada',campaigns:['shopee-prime']})));
 assert.throws(()=>marketplaceScenarioSchema.parse(choice({platform:'tiktok',campaigns:['tiktok-bcd','tiktok-flash']})));
 assert.throws(()=>marketplaceScenarioSchema.parse({...choice(),confirmed:false}));
 assert.throws(()=>marketplaceScenarioSchema.parse(choice({platform:'tiktok',campaigns:[],sellerType:'MALL',growthTier:'SMALL'})));
});
test('Live eligibility rate and order fee rounding use the correct scopes',()=>{
 const input=demoFixture();Object.assign(input.items[0],{quantity:2,revenueSatang:202,buyerPaymentSatang:202,buyerShippingSatang:0});
 const out=marketplaceInput(input,choice({campaigns:['shopee-live'],liveRateBps:200,paymentRateBps:250}));
 const result=calculate(out.input);assert.equal(result.feeLines.find(f=>f.type==='TRANSACTION')!.amountSatang,5);assert.equal(result.feeLines.find(f=>f.type==='PROGRAM')!.amountSatang,4);
});
test('assistant scenario uses server engine without model calls, handles missing evidence, discount and break-even',async()=>{
 const repo=new Repository(new LocalStorage());await seed(repo);let calls=0;const ai=new AI(repo,{send:async()=>{calls++;throw Error('must not call model')}} as any);
 const body={sku:'SKU-DEMO-01',month:'2026-10',message:'คำนวณกำไร',scenario:choice()};
 const result=await ai.platformScenario('DEMO-001',body);assert.equal(result.result?.profitSatang,639);assert.equal(result.result?.store,'DEMO-001');assert.equal(result.provider,'deterministic-engine');
 const discounted=await ai.platformScenario('DEMO-001',{...body,message:'ลดราคา 15%'});assert.equal(discounted.result?.revenueSatang,17000);assert.equal(discounted.result?.feeSatang,4148);assert.equal(discounted.result?.profitSatang,-1648);
 const incomplete=await ai.platformScenario('DEMO-001',{...body,message:'ราคาคุ้มทุน',scenario:choice({commissionRateBps:null})});assert.equal(incomplete.result?.profitSatang,null);
 const be=await ai.platformScenario('DEMO-001',{...body,message:'ราคาคุ้มทุน'});assert.ok(be.result?.profitSatang!==null&&be.result!.profitSatang!>=0);assert.equal(calls,0);
});
test('scenario options and calculations still enforce tenant membership; reject forged context fields',async()=>{
 process.env.LOCAL_MODE='true';const repo=new Repository(new LocalStorage());await seed(repo);const ctx=createContext(repo,new LocalFiles(tmpdir()),{send:async()=>{}}),auth='Bearer '+localSession('demo-b');
 for(const rest of ['/assistant-options','/assistant-scenarios'])await assert.rejects(route(ctx,{method:rest.endsWith('options')?'GET':'POST',path:'/stores/DEMO-001'+rest,query:{},authorization:auth,body:{}}),/FORBIDDEN/);
 await assert.rejects(ctx.ai.platformScenario('DEMO-001',{sku:'SKU-DEMO-01',month:'2026-10',message:'กำไร',scenario:{...choice(),store:'DEMO-002'}}));
});
