import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
if(!process.argv.includes('--invoke-aws')){console.log('Plan only. Pass --invoke-aws after deployment to create one isolated MOCK session and make three assistant requests. No real merchant data is modified.');process.exit(0);}
const aws=(service,operation,args=[],region='ap-southeast-1')=>JSON.parse(execFileSync(process.env.AWS_CLI??'aws',[service,operation,...args,'--region',region,'--output','json','--no-cli-pager'],{encoding:'utf8'}));
assert.equal(aws('sts','get-caller-identity').Account,'109991964227');
const budget=aws('budgets','describe-budget',['--account-id','109991964227','--budget-name','Hackathon-Team10'],'us-east-1').Budget;
assert.equal(budget.BudgetLimit.Unit,'USD');assert.equal(Number(budget.BudgetLimit.Amount),350);assert.ok(Number(budget.CalculatedSpend.ActualSpend.Amount)<25);
const stack=aws('cloudformation','describe-stacks',['--stack-name','marginsight']).Stacks[0];assert.equal(stack.StackStatus,'UPDATE_COMPLETE');
const outputs=Object.fromEntries(stack.Outputs.map(o=>[o.OutputKey,o.OutputValue]));
assert.match(outputs.ApiUrl,/^https:\/\/[a-z0-9]+\.execute-api\.ap-southeast-1\.amazonaws\.com$/);
assert.match(outputs.WebUrl,/^https:\/\/[a-z0-9]+\.cloudfront\.net\/?$/);
const origin=outputs.WebUrl.replace(/\/$/,'');
const request=async(path,body,token)=>{
 const response=await fetch(outputs.ApiUrl+path,{method:body===undefined?'GET':'POST',headers:{origin,...(body===undefined?{}:{'content-type':'application/json'}),...(token?{authorization:'Bearer '+token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(30000)});
 const data=await response.json();assert.equal(response.status,200,`Unexpected HTTP ${response.status}`);return data;
};
const session=await request('/demo/session',{});assert.equal(session.dataOrigin,'MOCK');assert.match(session.store,/^DEMO-GUEST-/);
const root='/demo/api/stores/'+session.store;const observations=[];
// The ordinary fixture is mock-market, deliberately outside the research whitelist.
// Import an explicitly MOCK Shopee-labelled order through the public import flow;
// it is synthetic financial evidence, never an official Shopee rate or merchant file.
const imports=[];
for(const [kind,csv] of [
 ['orders','platform,order_id,line_id,sku,quantity,order_at,revenue_thb,buyer_payment_thb,packaging_thb,ads_thb\nShopee,RAG-SMOKE-001,1,BAG-001,1,2026-10-25,200.00,200.00,5.00,10.00\n'],
 ['fees','platform,order_id,fee_id,fee_type,scope,amount_thb,effective_at\nShopee,RAG-SMOKE-001,c1,COMMISSION,PER_ORDER,24.00,2026-10-25\nShopee,RAG-SMOKE-001,t1,TRANSACTION,PER_ORDER,16.00,2026-10-25\nShopee,RAG-SMOKE-001,p1,PROGRAM,PER_ORDER,6.00,2026-10-25\n']
]){
 const job=await request(root+'/imports',{kind,fileName:'rag-smoke-'+kind+'.csv',adapter:'mock-v1',dataOrigin:'MOCK'},session.accessToken);
 const upload=new URL(job.uploadUrl);assert.equal(upload.protocol,'https:');assert.match(upload.hostname,/^marginsight-uploadsbucket-[a-z0-9]+\.s3[.-]ap-southeast-1\.amazonaws\.com$/);
 const put=await fetch(upload,{method:'PUT',headers:{'content-type':job.contentType},body:csv,signal:AbortSignal.timeout(30000)});assert.equal(put.status,200,'MOCK upload failed');
 await request(root+'/imports/'+job.id+'/complete',{},session.accessToken);
 let result;for(let attempt=0;attempt<30;attempt++){
  result=await request(root+'/imports/'+job.id,undefined,session.accessToken);
  if(['COMPLETED','FAILED','PARTIAL'].includes(result.status))break;
  await new Promise(resolve=>setTimeout(resolve,2000));
 }
 assert.equal(result.status,'COMPLETED');assert.equal(result.rejected,0);assert.equal(result.conflict,0);
 imports.push({kind,status:result.status,accepted:result.accepted});
}
const orderKey=Buffer.from(JSON.stringify(['Shopee','RAG-SMOKE-001'])).toString('base64url');
const calculation=await request(root+'/orders/'+orderKey+'/calculation',undefined,session.accessToken);
const settled=await request(root+'/orders/'+orderKey+'/settle',{confirmAllFeeLines:true,expectedInputHash:calculation.inputHash,payoutSatang:15400},session.accessToken);
assert.equal(settled.profitSatang,900);assert.equal(settled.payoutReconciled,true);
for(const [message,expected] of [['กำไรสินค้าตัวนี้เท่าไร คำนวณด้วย getProfit',900],['ลดราคา 15% ยังไหวไหม คำนวณด้วย simulateDiscount',-1410],['ราคาคุ้มทุนเท่าไร คำนวณด้วย getBreakEven',0]]){
 const started=Date.now(),data=await request(root+'/assistant',{message,sku:'BAG-001',month:'2026-10'},session.accessToken);
 assert.equal(data.provider,'bedrock-tools');assert.equal(data.model,'qwen.qwen3-32b-v1:0');assert.equal(data.result.profitSatang,expected);
 assert.equal(data.feeRuleEvidence.status,'READY');assert.equal(data.feeRuleEvidence.embeddingModel,'amazon.titan-embed-text-v2:0');
 assert.ok(data.feeRuleEvidence.matches.length>0&&data.feeRuleEvidence.matches.length<=3);
 assert.ok(data.feeRuleEvidence.matches.every(m=>m.calculationEligible===false&&m.applicability==='UNVERIFIED'));
 assert.ok(data.feeRuleEvidence.matches.every(m=>m.platform==='SHOPEE'));
 observations.push({provider:data.provider,model:data.model,profitSatang:data.result.profitSatang,evidenceStatus:data.feeRuleEvidence.status,corpusVersion:data.feeRuleEvidence.corpusVersion,chunkIds:data.feeRuleEvidence.matches.map(m=>m.id),durationMs:Date.now()-started});
}
const denied=await fetch(outputs.ApiUrl+'/me/stores');assert.equal(denied.status,401);
const cross=await fetch(outputs.ApiUrl+'/demo/api/stores/PRIVATE/products',{headers:{origin,authorization:'Bearer '+session.accessToken}});assert.equal(cross.status,403);
const report={checkedAt:new Date().toISOString(),scope:'deployed API Gateway/Lambda/S3/SQS/DynamoDB/Bedrock using an isolated MOCK store and synthetic Shopee-labelled imports; not native marketplace/Cognito/browser/LINE proof',store:session.store,imports,payoutReconciled:settled.payoutReconciled,observations,unauthenticatedStatus:denied.status,crossTenantStatus:cross.status};
await mkdir('tmp/fee-rules',{recursive:true});await writeFile('tmp/fee-rules/aws-smoke.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
