import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mockFeeAnswer} from '../src/mock-fee-answer.js';
import type {FeeRuleEvidence,FeeIndex} from '../src/fee-rules.js';
import {WebChat} from '../src/web-chat.js';
import {Repository} from '../src/repository.js';
import {LocalStorage} from '../src/storage.js';
import {readFileSync} from 'node:fs';
import {selectFeeEvidence,TITAN_EMBED_V2} from '../src/fee-rules.js';
const evidence:FeeRuleEvidence={status:'READY',orderAt:'2026-10-25',application:'REFERENCE_ONLY_RECORDED_RULES_UNCHANGED',matches:[{id:'shopee',platform:'SHOPEE',title:'Commission',sourceFile:'Shopee.md',sourceLine:22,sourceSha256:'0'.repeat(64),sourceUrls:['https://example.com/reference'],asOf:'2026-10-24',effectiveFrom:null,effectiveTo:null,verification:'USER_SUPPLIED_RESEARCH',calculationEligible:false,cautions:[],kind:'FEE_RULE',excerpt:'MOCK commission 5% excluding VAT. VAT 7% additional.',score:.9,applicability:'UNVERIFIED'}]};
test('mock reference answers use short Thai prose and citations without exposing raw source',async()=>{
 const result=await mockFeeAnswer(async()=>JSON.stringify({sentences:[{text:'ค่าคอมมิชชันในตัวอย่างคือ 5% ยังไม่รวม VAT 7% ครับ',sourceIds:['shopee']}]}),'ค่าคอมเท่าไร',[],[evidence]);
 assert.ok(result.includes('5%'));assert.ok(result.includes('ข้อมูลจำลอง (MOCK)'));assert.ok(result.includes('SHOPEE'));assert.ok(result.includes('2026-10-24'));assert.ok(!/[|*`]/.test(result));assert.equal(evidence.matches[0].calculationEligible,false);
});
test('unsupported rates/model failure never fall back to raw documents',async()=>{
 for(const model of [async()=>JSON.stringify({sentences:[{text:'ค่าคอมมิชชัน 99% ครับ',sourceIds:['shopee']}]}),async()=>{throw Error('timeout');}]){
  const result=await mockFeeAnswer(model,'มีค่าใช้จ่ายอะไรบ้าง',[],[evidence]);assert.ok(!result.includes('99%'));assert.ok(!result.includes('MOCK commission'));assert.ok(!/[|*`]/.test(result));
 }
 assert.ok((await mockFeeAnswer(async()=>{throw Error('must not call');},'ค่าคอม',[],[])).includes('ยังไม่พบข้อมูล'));
});
test('raw tables, Markdown and fabricated citations are rejected even with supported numbers',async()=>{
 for(const sentence of [{text:'| ค่าคอมมิชชัน | 5% |',sourceIds:['shopee']},{text:'**ค่าคอมมิชชัน 5%**',sourceIds:['shopee']},{text:'ค่าคอมมิชชัน 5% ครับ',sourceIds:['missing']}]){
  const result=await mockFeeAnswer(async()=>JSON.stringify({sentences:[sentence]}),'ค่าคอม',[],[evidence]);
  assert.ok(!result.includes('5%'));assert.ok(!/[|*`]/.test(result));assert.ok(result.includes('ข้อมูลจำลอง'));
 }
});
test('additional VAT is never described as already included and additional simultaneously',async()=>{
 const result=await mockFeeAnswer(async()=>JSON.stringify({sentences:[{text:'ค่าคอมมิชชัน 5% รวม VAT 7% เพิ่มเติมครับ',sourceIds:['shopee']}]}),'ค่าคอม',[],[evidence]);
 assert.ok(result.includes('ยังไม่รวม VAT 7%'));assert.ok(!result.includes('VAT 7% เพิ่มเติม'));
});
test('actual corpus matches the requested fee type even when all semantic scores tie',()=>{
 const corpus=JSON.parse(readFileSync(new URL('../../knowledge/fee-rules/corpus.json',import.meta.url),'utf8'));
 const vector=Array(1024).fill(1),index:FeeIndex={schemaVersion:1,modelId:TITAN_EMBED_V2,dimensions:1024,corpusVersion:corpus.version,createdAt:'2026-10-25T00:00:00.000Z',chunks:corpus.chunks.map((c:any)=>({...c,embedding:vector}))};
 for(const [platform,text,lines] of [['SHOPEE','Shopee คิดค่าคอมมิชชันเท่าไหร่',[25,26]],['TIKTOK','TikTok Shop คิดค่าคอมมิชชันเท่าไหร่',[21]],['LAZADA','Lazada มีค่าธรรมเนียมการชำระเงินเท่าไหร่',[24]]] as const){
  const result=selectFeeEvidence(index,{platform,text,orderAt:'2026-10-25'},vector);
  assert.deepEqual(result.matches.map(m=>m.sourceLine).sort((a,b)=>a-b),[...lines]);
 }
});
test('mock reference authorization is a server-only argument; default REAL retains verification gate',async()=>{
 const repo=new Repository(new LocalStorage());
 const request={mode:'chat',message:'Shopee ค่าคอมเท่าไร',history:[],context:{start:'2026-10-01',end:'2026-10-25',sku:null}};
 const make=()=>{let calls=0;return new WebChat(repo,async()=>++calls===1?JSON.stringify({route:'FEE_PIPELINE',confidence:.95,reason:'fee',detected_platforms:['SHOPEE'],needs_calculation:false}):calls===2?JSON.stringify({tool:'fee_lookup',operation:'policy',discountPct:null}):JSON.stringify({sentences:[{text:'ค่าคอมมิชชันในตัวอย่างคือ 5% ยังไม่รวม VAT 7% ครับ',sourceIds:['shopee']}]}),{retrieve:async()=>evidence},async()=>{},()=>{});};
 const real=await make().answer('A',request);assert.ok(!real.answer.includes('5%'));assert.ok(real.answer.includes('ยังไม่มีอัตรา'));
 const mock=await make().answer('A',request,true);assert.ok(mock.answer.includes('5%'));assert.ok(mock.answer.includes('ข้อมูลจำลอง'));assert.equal(mock.result,undefined);assert.equal(mock.calculation,undefined);
 await assert.rejects(make().answer('A',{...request,mockReferences:true}));
});
