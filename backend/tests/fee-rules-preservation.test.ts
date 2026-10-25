import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {selectFeeEvidence,S3FeeRuleRetriever,TITAN_EMBED_V2,type FeeChunk,type FeeIndex} from '../src/fee-rules.js';
import {AI} from '../src/ai.js';
import {Repository} from '../src/repository.js';
import {LocalStorage} from '../src/storage.js';
import {seed} from '../src/seed.js';
import {QWEN_32B} from '../src/model-runtime.js';
const vector=Array.from({length:1024},(_,i)=>i===0?1:0);
const chunk:FeeChunk={id:'test-rule',platform:'SHOPEE',title:'Synthetic research reference',text:'Research numbers are not approved financial rules.',sourceFile:'synthetic-test.md',sourceLine:1,sourceSha256:'1'.repeat(64),sourceUrls:['https://example.test/research'],asOf:'2026-10-24',effectiveFrom:null,effectiveTo:null,verification:'USER_SUPPLIED_RESEARCH',calculationEligible:false,cautions:[],kind:'FEE_RULE'};
const index:FeeIndex={schemaVersion:1,modelId:TITAN_EMBED_V2,dimensions:1024,corpusVersion:'2'.repeat(64),createdAt:'2026-10-25T00:00:00.000Z',chunks:[{...chunk,embedding:vector},{...chunk,id:'illustration',kind:'ILLUSTRATION',embedding:vector},{...chunk,id:'other-platform',platform:'LAZADA',embedding:vector}]};
test('preserved fee retrieval filters platform/illustrations and never upgrades uncertain research into calculation rules',()=>{
 const result=selectFeeEvidence(index,{platform:'Shopee',orderAt:'2026-10-20T00:00:00.000Z'},vector);
 assert.equal(result.status,'READY');assert.deepEqual(result.matches.map(m=>m.id),['test-rule']);
 assert.equal(result.matches[0].calculationEligible,false);assert.equal(result.matches[0].applicability,'UNVERIFIED');
 assert.ok(result.matches[0].cautions.includes('RESEARCH_AS_OF_AFTER_ORDER'));
 assert.equal(selectFeeEvidence(index,{platform:'unknown',orderAt:'2026-10-25T00:00:00.000Z'},vector).status,'NO_MATCH');
});
test('preserved fee index checksum rejects corruption before any embedding quota or model attempt',async()=>{
 const body=Buffer.from(JSON.stringify(index));let attempts=0;
 const retriever=new S3FeeRuleRetriever(async()=>Buffer.concat([body,Buffer.from(' ')]),createHash('sha256').update(body).digest('hex'),{embed:async()=>{attempts++;return {embedding:vector,inputTokens:1}}});
 await assert.rejects(()=>retriever.retrieve({platform:'SHOPEE',orderAt:'2026-10-25T00:00:00.000Z',text:'commission'},async()=>{attempts++}),/FEE_INDEX_HASH_MISMATCH/);
 assert.equal(attempts,0);
});
test('preserved research evidence does not mutate engine inputs or profit when the language model fails',async()=>{
 process.env.AI_ENABLED='true';process.env.BEDROCK_REGION='us-east-1';process.env.ASSISTANT_MODEL_ID=QWEN_32B;process.env.AI_DAILY_CALL_LIMIT='30';
 const repo=new Repository(new LocalStorage());await seed(repo);
 const before=await repo.input('DEMO-001','mock-market','O-DEMO-001');
 const evidence=selectFeeEvidence(index,{platform:'SHOPEE',orderAt:before.order.orderAt},vector);
 const ai=new AI(repo,{send:async()=>{throw Error('synthetic provider outage')}},{retrieve:async()=>evidence});
 const reply=await ai.assistant('DEMO-001',{message:'กำไรเท่าไร',sku:'SKU-DEMO-01',month:'2026-10'});
 assert.equal(reply.provider,'deterministic-fallback');assert.equal(reply.result?.profitSatang,900);
 assert.equal(reply.feeRuleEvidence?.application,'REFERENCE_ONLY_RECORDED_RULES_UNCHANGED');
 assert.ok(reply.answer.includes('ยังไม่ยืนยัน'));assert.deepEqual(await repo.input('DEMO-001','mock-market','O-DEMO-001'),before);
});
