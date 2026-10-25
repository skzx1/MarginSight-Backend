import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {S3Client,PutObjectCommand,GetObjectCommand} from '@aws-sdk/client-s3';
import {feeChunkSchema,feeIndexSchema,TitanEmbedder,embeddingText,TITAN_EMBED_V2,EMBEDDING_DIMENSIONS} from '../backend/src/fee-rules.js';
import {z} from 'zod';

const account='109991964227',region='us-east-1',stackRegion='ap-southeast-1';
const sha=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
const corpusSchema=z.object({schemaVersion:z.literal(1),documents:z.array(z.object({file:z.string(),platform:z.string(),sha256:z.string(),asOf:z.string(),provenance:z.literal('USER_SUPPLIED_RESEARCH')})),chunks:z.array(feeChunkSchema).min(1).max(400),version:z.string()}).strict();
const corpus=corpusSchema.parse(JSON.parse(await readFile('knowledge/fee-rules/corpus.json','utf8')));
const {version,...content}=corpus;
if(sha(JSON.stringify(content))!==version)throw new Error('CORPUS_HASH_MISMATCH');
const key=`fee-rules/v1/${version}/index.json`,texts=corpus.chunks.map(embeddingText);
const args=new Set(process.argv.slice(2));
if([...args].some(a=>!['--invoke-bedrock','--publish','--resume'].includes(a)))throw new Error('Unsupported argument');
const plan={account,region,model:TITAN_EMBED_V2,dimensions:EMBEDDING_DIMENSIONS,corpusVersion:version,chunks:corpus.chunks.length,
 inputCharacters:texts.reduce((sum,text)=>sum+text.length,0),s3Key:key,automaticRateApproval:false};
console.log(JSON.stringify({mode:args.has('--invoke-bedrock')?'BUILD':'PLAN',...plan}));
if(!args.has('--invoke-bedrock')){if(args.has('--publish')||args.has('--resume'))throw new Error('Explicit --invoke-bedrock required');process.exit(0);}

const aws=(service:string,operation:string,params:string[]=[],awsRegion=region)=>JSON.parse(execFileSync(process.env.AWS_CLI??'aws',[service,operation,...params,'--region',awsRegion,'--output','json','--no-cli-pager'],{encoding:'utf8'}));
if(aws('sts','get-caller-identity').Account!==account)throw new Error('WRONG_ACCOUNT');
const budget=aws('budgets','describe-budget',['--account-id',account,'--budget-name','Hackathon-Team10']).Budget;
const actual=budget.CalculatedSpend.ActualSpend,limit=budget.BudgetLimit;
if(limit.Unit!=='USD'||actual.Unit!=='USD'||Number(limit.Amount)!==350||Number(actual.Amount)>=25)throw new Error('BUDGET_REVIEW_REQUIRED');
const access=aws('bedrock','get-foundation-model-availability',['--model-id',TITAN_EMBED_V2]);
if(access.authorizationStatus!=='AUTHORIZED'||access.entitlementAvailability!=='AVAILABLE'||access.regionAvailability!=='AVAILABLE'||access.agreementAvailability?.status!=='AVAILABLE')throw new Error('TITAN_ACCESS_NOT_AVAILABLE_DO_NOT_SUBSCRIBE');
// Read the current regional primary price list. Do not silently assume a historic price.
const priceUrl='https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonBedrock/current/us-east-1/index.json';
const priceResponse=await fetch(priceUrl,{signal:AbortSignal.timeout(30000)});if(!priceResponse.ok)throw new Error('PRICE_CHECK_FAILED');
const prices:any=await priceResponse.json(),rateCards:any[]=[];
for(const [sku,product] of Object.entries(prices.products) as [string,any][]){
 if(!/TitanEmbeddingV2|Titan.*Embedding.*V2/i.test(JSON.stringify(product))||product.attributes?.operation!=='InvokeModelInference'||product.attributes?.regionCode!==region)continue;
 for(const term of Object.values(prices.terms.OnDemand[sku]??{}) as any[])for(const dim of Object.values(term.priceDimensions??{}) as any[]){
  rateCards.push({sku,description:dim.description,unit:dim.unit,USD:dim.pricePerUnit?.USD,effectiveDate:term.effectiveDate});
 }
}
if(rateCards.length!==1||rateCards[0].unit!=='1K tokens'||!Number.isFinite(Number(rateCards[0].USD))||Number(rateCards[0].USD)<=0)throw new Error('TITAN_PRICE_NOT_FOUND_REVIEW_CURRENT_PRICE_LIST');
const upperTokenCostUSD=texts.reduce((sum,text)=>sum+Buffer.byteLength(text),0)/1000*Number(rateCards[0].USD);
if(upperTokenCostUSD>.05)throw new Error('INDEX_ESTIMATE_EXCEEDS_FIVE_CENTS_REVIEW_BEFORE_INFERENCE');
console.log(JSON.stringify({budgetLimit:limit,laggedActualSpend:actual,budgetUpdatedAt:budget.LastUpdatedTime,priceUrl,pricePublicationDate:prices.publicationDate,rateCards}));
// Bounded, resumable indexing: only public research is sent, never merchant uploads.
await mkdir('tmp/fee-rules',{recursive:true});
const checkpoint=`tmp/fee-rules/${version}.checkpoint.json`;
let completed:Array<{id:string;embedding:number[];inputTokens:number}>=[];
if(args.has('--resume')){
 const saved=JSON.parse(await readFile(checkpoint,'utf8'));
 if(saved.corpusVersion!==version||saved.modelId!==TITAN_EMBED_V2)throw new Error('CHECKPOINT_MISMATCH');
 completed=z.array(z.object({id:z.string(),embedding:z.array(z.number().finite()).length(EMBEDDING_DIMENSIONS),inputTokens:z.number().int().nonnegative()})).parse(saved.completed);
 if(new Set(completed.map(c=>c.id)).size!==completed.length||completed.some(c=>!corpus.chunks.some(chunk=>chunk.id===c.id)))throw new Error('INVALID_CHECKPOINT');
}
const embedder=new TitanEmbedder();
for(const chunk of corpus.chunks){
 if(completed.some(c=>c.id===chunk.id))continue;
 const result=await embedder.embed(embeddingText(chunk));completed.push({id:chunk.id,...result});
 await writeFile(checkpoint,JSON.stringify({corpusVersion:version,modelId:TITAN_EMBED_V2,completed}));
 // One invocation at a time, 250ms spacing; stop immediately on provider errors.
 console.log(JSON.stringify({indexed:completed.length,total:corpus.chunks.length,chunkId:chunk.id}));
 await new Promise(resolve=>setTimeout(resolve,250));
}
const index=feeIndexSchema.parse({schemaVersion:1,modelId:TITAN_EMBED_V2,dimensions:EMBEDDING_DIMENSIONS,corpusVersion:version,createdAt:new Date().toISOString(),
 chunks:corpus.chunks.map(chunk=>({...chunk,embedding:completed.find(c=>c.id===chunk.id)!.embedding}))});
const bytes=Buffer.from(JSON.stringify(index)+'\n'),indexSha256=sha(bytes);
if(bytes.length>8*1024*1024)throw new Error('INDEX_TOO_LARGE');
await writeFile('tmp/fee-rules/index.json',bytes);
const report={...plan,indexSha256,indexBytes:bytes.length,inputTokens:completed.reduce((sum,c)=>sum+c.inputTokens,0),embeddingPriceUSDPer1000Tokens:Number(rateCards[0].USD),estimatedEmbeddingUSD:completed.reduce((sum,c)=>sum+c.inputTokens,0)/1000*Number(rateCards[0].USD),published:false,bucket:''};
if(args.has('--publish')){
 const stack=aws('cloudformation','describe-stacks',['--stack-name','marginsight'],stackRegion).Stacks[0];
 if(!['CREATE_COMPLETE','UPDATE_COMPLETE'].includes(stack.StackStatus))throw new Error('STACK_NOT_STABLE');
 const bucket=stack.Outputs.find((o:any)=>o.OutputKey==='UploadsBucket')?.OutputValue;
 if(typeof bucket!=='string'||!bucket.startsWith('marginsight-uploadsbucket-'))throw new Error('WRONG_BUCKET');
 const s3=new S3Client({region:stackRegion,maxAttempts:1});
 // Conditional write makes this corpus version immutable. Never overwrite prior evidence.
 await s3.send(new PutObjectCommand({Bucket:bucket,Key:key,Body:bytes,ContentType:'application/json',ServerSideEncryption:'AES256',IfNoneMatch:'*',Metadata:{'corpus-version':version,'index-sha256':indexSha256}}));
 const readback=await s3.send(new GetObjectCommand({Bucket:bucket,Key:key}));
 if(sha(Buffer.from(await readback.Body!.transformToByteArray()))!==indexSha256)throw new Error('INDEX_READBACK_MISMATCH');
 report.published=true;report.bucket=bucket;
}
await writeFile('tmp/fee-rules/build-report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
