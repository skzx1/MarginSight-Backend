import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AI} from '../src/ai.js';
import {Repository} from '../src/repository.js';
import {LocalStorage} from '../src/storage.js';
import {seed} from '../src/seed.js';
async function setup(messages:any[]){const repo=new Repository(new LocalStorage());await seed(repo);let calls=0;const client={send:async()=>{calls++;const result=messages.shift();if(result instanceof Error)throw result;return {output:{message:{role:'assistant',content:result}}}}};return {ai:new AI(repo,client as any),calls:()=>calls}}
const question={message:'ลดราคา 15% ยังไหวไหม',sku:'SKU-DEMO-01',month:'2026-10'};
test('model intent uses deterministic simulation tools; invented profit triggers checked fallback',async()=>{
 process.env.AI_ENABLED='true';const {ai,calls}=await setup([[{toolUse:{toolUseId:'t1',name:'simulateDiscount',input:{sku:'SKU-DEMO-01',discountPct:15}}}],[{text:'กำไร 9999 บาท'}]]);
 const result=await ai.assistant('DEMO-001',question);assert.ok(result.result);assert.ok('reason' in result);assert.equal(result.reason,'MODEL_NUMBERS_REJECTED');assert.equal(result.result.profitSatang,-1410);assert.equal(result.result.marginPct,-8.29);assert.equal(calls(),2);assert.ok(!result.answer.includes('9999'));process.env.AI_ENABLED='false';
});
test('model failure and excessive tool batch remain bounded and preserve correct financial fallback',async()=>{
 process.env.AI_ENABLED='true';const {ai,calls}=await setup([Array.from({length:5},(_,n)=>({toolUse:{toolUseId:String(n),name:'getProfit',input:{}}}))]);const result=await ai.assistant('DEMO-001',question);assert.ok(result.result);assert.ok('reason' in result);assert.equal(result.reason,'TOOL_CALL_LIMIT');assert.equal(result.result.profitSatang,-1410);assert.equal(calls(),1);
 const failing=await setup([new Error('provider unavailable')]);const fallback=await failing.ai.assistant('DEMO-001',question);assert.ok(fallback.result);assert.ok('reason' in fallback);assert.equal(fallback.reason,'MODEL_UNAVAILABLE');assert.equal(fallback.result.profitSatang,-1410);process.env.AI_ENABLED='false';
});
test('validated discount and loss amounts are accepted; model cannot change the requested percentage',async()=>{
 process.env.AI_ENABLED='true';const good=await setup([[{toolUse:{toolUseId:'t1',name:'simulateDiscount',input:{discountPct:15}}}],[{text:'ลดราคา 15% จาก 200 บาท ขาดทุน 14.10 บาท'}]]);
 const result=await good.ai.assistant('DEMO-001',question);assert.equal(result.provider,'bedrock-tools');assert.equal(result.result?.profitSatang,-1410);
 const wrong=await setup([[{toolUse:{toolUseId:'t2',name:'simulateDiscount',input:{discountPct:5}}}]]);const fallback=await wrong.ai.assistant('DEMO-001',question);assert.ok('reason' in fallback);assert.equal(fallback.reason,'DISCOUNT_CONTEXT_MISMATCH');assert.equal(fallback.result?.profitSatang,-1410);process.env.AI_ENABLED='false';
});
