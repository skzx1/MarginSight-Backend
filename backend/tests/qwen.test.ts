import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AI} from '../src/ai.js';
import {Repository} from '../src/repository.js';
import {LocalStorage} from '../src/storage.js';
import {seed} from '../src/seed.js';
import {QWEN_32B,NOVA_LITE,modelConfig} from '../src/model-runtime.js';

const question={message:'ลดราคา 15% ยังไหวไหม',sku:'SKU-DEMO-01',month:'2026-10'};
async function fixture(responses:any[]){
 process.env.AI_ENABLED='true';process.env.BEDROCK_REGION='us-east-1';process.env.BEDROCK_MODEL_ID=NOVA_LITE;
 process.env.ASSISTANT_MODEL_ID=QWEN_32B;process.env.AI_DAILY_CALL_LIMIT='30';
 const repo=new Repository(new LocalStorage());await seed(repo);const requests:any[]=[];
 const ai=new AI(repo,{send:async(command,options)=>{
  requests.push(command.input);assert.ok(options?.abortSignal);const next=responses.shift();if(next instanceof Error)throw next;
  return {output:{message:{role:'assistant',content:next}}};
 }});return {ai,requests};
}
const tool={toolUse:{toolUseId:'qwen-discount',name:'simulateDiscount',input:{sku:'SKU-DEMO-01',discountPct:15}}};
test('Qwen selects a bounded tool once; only the engine renders money and model narration is ignored',async()=>{
 const {ai,requests}=await fixture([[{text:'กำไร 9999 บาท'},tool],new Error('A second generation must not be called')]);
 const result=await ai.assistant('DEMO-001',question);
 assert.equal(result.provider,'bedrock-tools');assert.equal(result.model,QWEN_32B);
 assert.equal(result.result?.profitSatang,-1410);assert.equal(result.result?.marginPct,-8.29);
 assert.equal(requests.length,1);for(const r of requests){assert.equal(r.modelId,QWEN_32B);assert.equal(r.inferenceConfig.maxTokens,500);assert.deepEqual(r.additionalModelRequestFields,{enable_thinking:false});}
 assert.ok(result.answer.includes('14.10'));assert.ok(!result.answer.includes('9999'));
});
test('Qwen wrong SKU, wrong discount, narration without a tool and provider failure use checked fallback',async()=>{
 for(const [responses,reason] of [
  [[[{toolUse:{...tool.toolUse,input:{sku:'OTHER',discountPct:15}}}]],'SKU_CONTEXT_MISMATCH'],
  [[[{toolUse:{...tool.toolUse,input:{discountPct:5}}}]],'DISCOUNT_CONTEXT_MISMATCH'],
  [[[{text:'กำไร 9999 บาท'}]],'MODEL_NO_TOOL_RESULT'],
  [[new Error('provider error')],'MODEL_UNAVAILABLE']
 ] as [any[],string][]){
  const f=await fixture(responses);const result=await f.ai.assistant('DEMO-001',question);
  assert.equal((result as any).reason,reason);assert.equal(result.model,null);assert.equal(result.result?.profitSatang,-1410);
 }
});
test('Qwen is assistant-only and cannot use profile IDs or any Region other than approved us-east-1',async()=>{
 await fixture([]);assert.deepEqual(modelConfig(),{model:QWEN_32B,region:'us-east-1',transport:'converse'});
 assert.equal(modelConfig('receipt').model,NOVA_LITE);
 for(const region of ['us-east-2','us-west-2','ap-southeast-1']){process.env.BEDROCK_REGION=region;assert.throws(()=>modelConfig(),/MODEL_REGION_NOT_APPROVED/);}
 process.env.BEDROCK_REGION='us-east-1';process.env.ASSISTANT_MODEL_ID='us.'+QWEN_32B;assert.throws(()=>modelConfig(),/MODEL_NOT_APPROVED/);
});
