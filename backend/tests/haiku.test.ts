import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {ConverseCommand} from '@aws-sdk/client-bedrock-runtime';
import {AI} from '../src/ai.js';
import {Repository} from '../src/repository.js';
import {LocalStorage} from '../src/storage.js';
import {seed} from '../src/seed.js';
import {CLAUDE_HAIKU,NOVA_LITE,HaikuRuntime,mantleRequest,modelConfig,createHaikuClient} from '../src/model-runtime.js';

const question={message:'ลดราคา 15% ยังไหวไหม',sku:'SKU-DEMO-01',month:'2026-10'};
function configure(){process.env.AI_ENABLED='true';process.env.ASSISTANT_MODEL_ID=CLAUDE_HAIKU;process.env.BEDROCK_REGION='us-east-1';process.env.BEDROCK_MODEL_ID=NOVA_LITE;process.env.AI_DAILY_CALL_LIMIT='30'}
async function fixture(responses:any[]){
 configure();const repo=new Repository(new LocalStorage());await seed(repo);const requests:any[]=[];
 const runtime=new HaikuRuntime({messages:{create:async(request:any)=>{requests.push(request);const next=responses.shift();if(next instanceof Error)throw next;return next}}} as any);
 return {repo,requests,ai:new AI(repo,runtime)};
}
const tool={type:'tool_use',id:'call-1',name:'simulateDiscount',input:{sku:'SKU-DEMO-01',discountPct:15}};
test('Haiku native tool round trip retains IDs/schema and exact satang results',async()=>{
 const {ai,requests}=await fixture([{content:[tool]},{content:[{type:'text',text:'ลดราคา 15% จาก 200 บาท ขาดทุน 14.10 บาท'}]}]);
 const reply=await ai.assistant('DEMO-001',question);
 assert.equal(reply.provider,'bedrock-tools');assert.equal(reply.model,CLAUDE_HAIKU);
 assert.equal(reply.result?.profitSatang,-1410);assert.equal(reply.result?.marginPct,-8.29);
 assert.equal(requests.length,2);assert.equal(requests[0].max_tokens,500);
 assert.equal(requests[0].model,CLAUDE_HAIKU);assert.equal(requests[0].stream,false);
 assert.deepEqual(requests[0].tools.map((t:any)=>t.name),['getProfit','simulateDiscount','getBreakEven','getCalculationEvidence']);
 assert.equal(requests[0].tools[0].input_schema.additionalProperties,false);
 assert.deepEqual(requests[1].messages[1].content,[tool]);
 const result=requests[1].messages[2].content[0];assert.equal(result.type,'tool_result');assert.equal(result.tool_use_id,'call-1');
 assert.equal(JSON.parse(result.content[0].text).profitSatang,-1410);
});
test('Haiku cannot override selected SKU, invent profit, change discount or invoke unknown tools',async()=>{
 for(const [content,reason] of [
  [[{...tool,input:{sku:'OTHER',discountPct:15}}],'SKU_CONTEXT_MISMATCH'],
  [[{...tool,input:{discountPct:5}}],'DISCOUNT_CONTEXT_MISMATCH'],
  [[{...tool,name:'readAnotherStore'}],'UNKNOWN_TOOL']
 ] as const){
  const f=await fixture([{content}]);const result=await f.ai.assistant('DEMO-001',question);
  assert.equal((result as any).reason,reason);assert.equal(result.model,null);assert.equal(result.result?.profitSatang,-1410);
 }
 const f=await fixture([{content:[tool]},{content:[{type:'text',text:'กำไร 9999 บาท'}]}]);
 const result=await f.ai.assistant('DEMO-001',question);assert.equal((result as any).reason,'MODEL_NUMBERS_REJECTED');assert.equal(result.result?.profitSatang,-1410);
});
test('Haiku access errors return safe financial fallback and do not impose a daily attempted-call quota',async()=>{
 const secret=Object.assign(new Error('private provider error body'),{status:403});
 const f=await fixture([secret,secret]);const result=await f.ai.assistant('DEMO-001',question);
 assert.equal((result as any).reason,'MODEL_ACCESS_DENIED');assert.equal(result.model,null);
 assert.equal(result.result?.profitSatang,-1410);assert.ok(!JSON.stringify(result).includes('private provider'));
 process.env.AI_DAILY_CALL_LIMIT='0';const second=await f.ai.assistant('DEMO-001',question);
 assert.equal((second as any).reason,'MODEL_ACCESS_DENIED');assert.equal(f.requests.length,2);
});
test('configuration rejects cross-Region profiles and disallowed Regions before any model request',()=>{
 configure();assert.equal(modelConfig().transport,'mantle-messages');assert.equal(modelConfig('receipt').model,NOVA_LITE);
 for(const id of ['us.anthropic.claude-haiku-4-5-20251001-v1:0','global.anthropic.claude-haiku-4-5-20251001-v1:0','arbitrary']){
  process.env.ASSISTANT_MODEL_ID=id;assert.throws(()=>modelConfig(),/MODEL_NOT_APPROVED/);
 }
 process.env.ASSISTANT_MODEL_ID=CLAUDE_HAIKU;for(const region of ['us-west-2','ap-southeast-1']){
  process.env.BEDROCK_REGION=region;assert.throws(()=>modelConfig(),/MODEL_REGION_NOT_APPROVED/);
 }
 configure();delete process.env.ASSISTANT_MODEL_ID;assert.equal(modelConfig().model,NOVA_LITE);
});
test('Haiku adapter rejects excessive context/tokens and unsupported content without a network call',()=>{
 const base={modelId:CLAUDE_HAIKU,messages:[{role:'user' as const,content:[{text:'hello'}]}],inferenceConfig:{maxTokens:500}};
 assert.throws(()=>mantleRequest({...base,inferenceConfig:{maxTokens:501}}),/INVALID_AI_TOKEN_LIMIT/);
 assert.throws(()=>mantleRequest({...base,messages:[{role:'user',content:[{text:'x'.repeat(65537)}]}]}),/MODEL_CONTEXT_TOO_LARGE/);
 assert.throws(()=>mantleRequest({...base,messages:[{role:'user',content:[{image:{format:'png',source:{bytes:Buffer.alloc(1)}}}]}]}),/UNSUPPORTED_MODEL_CONTENT/);
});
test('OCR keeps Nova independently of the selected assistant model',async()=>{
 configure();const repo=new Repository(new LocalStorage());await seed(repo);let seenModel='';
 const ai=new AI(repo,{send:async(command)=>{seenModel=command.input.modelId!;return {output:{message:{content:[{text:JSON.stringify({date:null,items:[],totalTHB:null})}]}}}}});
 const image=await readFile(new URL('../../fixtures/mock-v1/receipt-thai-mock.png',import.meta.url));
 const draft=await ai.receipt('DEMO-001',image,'image/png');assert.equal(seenModel,NOVA_LITE);assert.equal(draft.requiresConfirmation,true);
});
test('official SDK pins SigV4 to Mantle us-east-1, ignores endpoint/key overrides and does not retry',async()=>{
 configure();let calls=0;process.env.ANTHROPIC_BEDROCK_MANTLE_BASE_URL='https://untrusted.example';process.env.AWS_BEARER_TOKEN_BEDROCK='test-only-bearer';
 const sdk=createHaikuClient({
  providerChainResolver:async()=>async()=>({accessKeyId:'test-access',secretAccessKey:randomUUID()}),
  fetch:async(input,init)=>{calls++;const request=new Request(input,init);assert.equal(request.url,'https://bedrock-mantle.us-east-1.api.aws/anthropic/v1/messages');
   assert.equal(request.redirect,'error');assert.match(request.headers.get('authorization')!,/us-east-1\/bedrock-mantle\/aws4_request/);
   assert.equal(request.headers.get('x-api-key'),null);const body=await request.json() as any;assert.equal(body.model,CLAUDE_HAIKU);assert.equal(body.service_tier,'default');
   return new Response(JSON.stringify({type:'error',error:{type:'overloaded_error',message:'Unavailable'}}),{status:503,headers:{'content-type':'application/json'}});
  }});
 await assert.rejects(new HaikuRuntime(sdk).send(new ConverseCommand({modelId:CLAUDE_HAIKU,messages:[{role:'user',content:[{text:'test'}]}],inferenceConfig:{maxTokens:100}})),/MODEL_UNAVAILABLE/);
 assert.equal(calls,1);delete process.env.ANTHROPIC_BEDROCK_MANTLE_BASE_URL;delete process.env.AWS_BEARER_TOKEN_BEDROCK;
});
