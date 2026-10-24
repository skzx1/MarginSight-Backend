// Explicit operator-only real inference. Uses in-memory MOCK data, never shop data.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {BedrockRuntimeClient} from '@aws-sdk/client-bedrock-runtime';
import {AI} from '../backend/src/ai.js';
import {Repository} from '../backend/src/repository.js';
import {LocalStorage} from '../backend/src/storage.js';
import {seed} from '../backend/src/seed.js';
import {QWEN_32B,NOVA_LITE} from '../backend/src/model-runtime.js';

assert.equal(process.env.QWEN_EVALUATE_REAL,'true','Explicit QWEN_EVALUATE_REAL=true required; this script incurs inference cost');
assert.equal(execFileSync('aws',['sts','get-caller-identity','--region','us-east-1','--query','Account','--output','text'],{encoding:'utf8'}).trim(),'109991964227','Wrong evaluation account');
Object.assign(process.env,{BEDROCK_REGION:'us-east-1',BEDROCK_MODEL_ID:NOVA_LITE,ASSISTANT_MODEL_ID:QWEN_32B,AI_ENABLED:'true',AI_OUTPUT_TOKENS:'500',AI_DAILY_CALL_LIMIT:'12'});
const repo=new Repository(new LocalStorage());await seed(repo);
const client=new BedrockRuntimeClient({region:'us-east-1',maxAttempts:1});
let calls=0;const tools:string[]=[],usage:{inputTokens:number;outputTokens:number}[]=[];
const ai=new AI(repo,{send:async(command,options)=>{
 assert.ok(calls<12,'Evaluation inference limit');calls++;
 assert.equal(command.input.modelId,QWEN_32B);
 const response=await client.send(command,options);
 if(response.usage)usage.push({inputTokens:response.usage.inputTokens??0,outputTokens:response.usage.outputTokens??0});
 for(const c of response.output?.message?.content??[])if(c.toolUse?.name)tools.push(c.toolUse.name);
 return response;
}});
const cases=[
 {name:'profit',message:'สินค้านี้เหลือกำไรเท่าไร',sku:'SKU-DEMO-01',profit:900},
 {name:'discount',message:'ลดราคา 15% ยังไหวไหม',sku:'SKU-DEMO-01',profit:-1410}
];
const results=[];
for(const c of cases){
 const before=calls,start=Date.now();const result=await ai.assistant('DEMO-001',{message:c.message,sku:c.sku,month:'2026-10'});
 const row={name:c.name,provider:result.provider,model:result.model,reason:(result as any).reason??null,
  profitSatang:result.result?.profitSatang,marginPct:result.result?.marginPct,calls:calls-before,elapsedMs:Date.now()-start};
 results.push(row);console.log('QWEN_EVAL_CASE',JSON.stringify(row));assert.equal(row.profitSatang,c.profit);
 assert.equal(row.provider,'bedrock-tools','A deterministic fallback does not prove the model round trip');assert.equal(row.model,QWEN_32B);
}
console.log('QWEN_EVAL_PASS',JSON.stringify({scope:'operator IAM; real Bedrock + in-memory MOCK repository; not Lambda/browser/LINE proof',region:'us-east-1',model:QWEN_32B,calls,tools,usage,results}));
