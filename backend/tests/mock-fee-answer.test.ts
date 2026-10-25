import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mockFeeAnswer} from '../src/mock-fee-answer.js';
import type {FeeRuleEvidence} from '../src/fee-rules.js';
import {WebChat} from '../src/web-chat.js';
import {Repository} from '../src/repository.js';
import {LocalStorage} from '../src/storage.js';
const evidence:FeeRuleEvidence={status:'READY',orderAt:'2026-10-25',application:'REFERENCE_ONLY_RECORDED_RULES_UNCHANGED',matches:[{id:'shopee',platform:'SHOPEE',title:'Commission',sourceFile:'Shopee.md',sourceLine:22,sourceSha256:'0'.repeat(64),sourceUrls:['https://example.com/reference'],asOf:'2026-10-24',effectiveFrom:null,effectiveTo:null,verification:'USER_SUPPLIED_RESEARCH',calculationEligible:false,cautions:[],kind:'FEE_RULE',excerpt:'MOCK commission 5% excluding VAT. VAT 7% additional.',score:.9,applicability:'UNVERIFIED'}]};
test('mock references answer using exact cited quotes without promoting the corpus',async()=>{
 const result=await mockFeeAnswer(async()=>JSON.stringify({quotes:[{id:'shopee',quote:evidence.matches[0].excerpt}]}),'ค่าคอมเท่าไร',[],[evidence]);
 assert.ok(result.includes('5%'));assert.ok(result.includes('ข้อมูลจำลอง (MOCK)'));assert.ok(result.includes('Shopee.md:22'));assert.ok(result.includes('2026-10-24'));assert.ok(result.includes('วันที่มีผลยังไม่ยืนยัน'));assert.equal(evidence.matches[0].calculationEligible,false);
});
test('unsupported rates/model failure fall back to source passages, not generated claims',async()=>{
 for(const model of [async()=>JSON.stringify({quotes:[{id:'shopee',quote:'commission 99%'}]}),async()=>{throw Error('timeout');}]){
  const result=await mockFeeAnswer(model,'ค่าคอม',[],[evidence]);assert.ok(result.includes('5%'));assert.ok(!result.includes('99%'));
 }
 assert.ok((await mockFeeAnswer(async()=>{throw Error('must not call');},'ค่าคอม',[],[])).includes('ยังไม่พบข้อมูล'));
});
test('mock reference authorization is a server-only argument; default REAL retains verification gate',async()=>{
 const repo=new Repository(new LocalStorage());
 const request={mode:'chat',message:'Shopee ค่าคอมเท่าไร',history:[],context:{start:'2026-10-01',end:'2026-10-25',sku:null}};
 const make=()=>{let calls=0;return new WebChat(repo,async()=>++calls===1?JSON.stringify({route:'FEE_PIPELINE',confidence:.95,reason:'fee',detected_platforms:['SHOPEE'],needs_calculation:false}):calls===2?JSON.stringify({tool:'fee_lookup',operation:'policy',discountPct:null}):JSON.stringify({quotes:[{id:'shopee',quote:evidence.matches[0].excerpt}]}),{retrieve:async()=>evidence},async()=>{},()=>{});};
 const real=await make().answer('A',request);assert.ok(!real.answer.includes('5%'));assert.ok(real.answer.includes('ยังไม่มีอัตรา'));
 const mock=await make().answer('A',request,true);assert.ok(mock.answer.includes('5%'));assert.ok(mock.answer.includes('ข้อมูลจำลอง'));assert.equal(mock.result,undefined);assert.equal(mock.calculation,undefined);
 await assert.rejects(make().answer('A',{...request,mockReferences:true}));
});
