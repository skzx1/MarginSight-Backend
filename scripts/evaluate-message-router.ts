import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {BedrockRuntimeClient,ConverseCommand} from '@aws-sdk/client-bedrock-runtime';
import {defaultProvider} from '@aws-sdk/credential-provider-node';
import {routeMessage,routes,ROUTER_VERSION} from '../backend/src/message-router.js';
import {routerCases} from '../backend/tests/fixtures/router-cases.js';
if(!process.argv.includes('--invoke-aws')){console.log(`Plan: ${routerCases.length} synthetic cases; --invoke-aws runs real Qwen and incurs inference charges. No merchant messages.`);process.exit(0);}
execFileSync(process.env.ROUTER_PYTHON??'python',['scripts/qwen-preflight.py'],{stdio:'inherit'});
const credentials=await defaultProvider()();
const client=new BedrockRuntimeClient({region:'us-east-1',credentials,maxAttempts:1});let calls=0,inputTokens=0,outputTokens=0,errors=0;
const results=[];
for(const c of routerCases){
 const start=Date.now();
 const decision=await routeMessage(async(system,payload)=>{
  if(++calls>routerCases.length)throw Error('Evaluation call limit');
  try{
   const r=await client.send(new ConverseCommand({modelId:'qwen.qwen3-32b-v1:0',system:[{text:system}],messages:[{role:'user',content:[{text:JSON.stringify(payload)}]}],additionalModelRequestFields:{enable_thinking:false},inferenceConfig:{maxTokens:350,temperature:0}}),{abortSignal:AbortSignal.timeout(8000)});
   inputTokens+=r.usage?.inputTokens??0;outputTokens+=r.usage?.outputTokens??0;
   if(r.stopReason!=='end_turn'||r.output?.message?.content?.some(b=>b.toolUse))throw Error('Non-text response');
   return (r.output?.message?.content??[]).map(b=>b.text??'').join('');
  }catch{errors++;throw Error('ROUTER_MODEL_FAILURE');}
 },c.message,c.history);
 results.push({id:c.id,group:c.group,expected:c.expected,predicted:decision.route,confidence:decision.confidence,reason:decision.reason,platforms:decision.detected_platforms,needsCalculation:decision.needs_calculation,latencyMs:Date.now()-start,correct:decision.route===c.expected});
 console.log(JSON.stringify(results.at(-1)));
}
const byRoute=Object.fromEntries(routes.map(route=>{
 const expected=results.filter(r=>r.expected===route),predicted=results.filter(r=>r.predicted===route),correct=expected.filter(r=>r.correct).length;
 return [route,{expected:expected.length,correct,recall:correct/expected.length,precision:predicted.length?correct/predicted.length:null}];
}));
const latencies=results.map(r=>r.latencyMs).sort((a,b)=>a-b);
const report={checkedAt:new Date().toISOString(),scope:'real operator Qwen classification on a developer-authored synthetic challenge set; not independent/production accuracy or probability calibration',model:'qwen.qwen3-32b-v1:0',promptVersion:ROUTER_VERSION,calls,inputTokens,outputTokens,transportErrors:errors,invalidOutputs:results.filter(r=>r.reason==='ROUTER_UNAVAILABLE').length,total:results.length,accuracy:results.filter(r=>r.correct).length/results.length,byRoute,p50Ms:latencies[Math.floor(latencies.length*.5)],p95Ms:latencies[Math.min(latencies.length-1,Math.floor(latencies.length*.95))],failures:results.filter(r=>!r.correct),results};
await mkdir('tmp/message-router',{recursive:true});await writeFile('tmp/message-router/evaluation.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,results:undefined}));
