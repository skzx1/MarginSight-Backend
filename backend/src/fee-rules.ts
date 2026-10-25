import {createHash} from 'node:crypto';
import {BedrockRuntimeClient,InvokeModelCommand} from '@aws-sdk/client-bedrock-runtime';
import {S3Client,GetObjectCommand} from '@aws-sdk/client-s3';
import {z} from 'zod';
import {demand} from './errors.js';

export const TITAN_EMBED_V2='amazon.titan-embed-text-v2:0';
export const EMBEDDING_DIMENSIONS=1024;
const sha=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
const checksum=z.string().regex(/^[a-f0-9]{64}$/);
const sourceUrl=z.string().url().refine(v=>v.startsWith('https://'));
export const feeChunkSchema=z.object({
 id:z.string().max(100),platform:z.enum(['SHOPEE','LAZADA','TIKTOK','LINE']),title:z.string().max(500),text:z.string().min(1).max(6000),
 sourceFile:z.string().max(150),sourceLine:z.number().int().positive(),sourceSha256:checksum,sourceUrls:z.array(sourceUrl).max(30),
 asOf:z.literal('2026-10-24'),effectiveFrom:z.null(),effectiveTo:z.null(),verification:z.literal('USER_SUPPLIED_RESEARCH'),
 calculationEligible:z.literal(false),cautions:z.array(z.string().max(100)).max(10),kind:z.enum(['FEE_RULE','CONTEXT','ILLUSTRATION'])
}).strict();
export type FeeChunk=z.infer<typeof feeChunkSchema>;
const vectorSchema=z.array(z.number().finite()).length(EMBEDDING_DIMENSIONS).refine(v=>v.some(n=>n!==0));
export const feeIndexSchema=z.object({schemaVersion:z.literal(1),modelId:z.literal(TITAN_EMBED_V2),dimensions:z.literal(EMBEDDING_DIMENSIONS),
 corpusVersion:checksum,createdAt:z.string().datetime(),chunks:z.array(feeChunkSchema.extend({embedding:vectorSchema})).min(1).max(400)}).strict();
export type FeeIndex=z.infer<typeof feeIndexSchema>;
export interface FeeRuleEvidence {
 status:'READY'|'NO_MATCH'|'UNAVAILABLE'|'DISABLED';corpusVersion?:string;embeddingModel?:string;orderAt:string;
 application:'REFERENCE_ONLY_RECORDED_RULES_UNCHANGED';matches:Array<Omit<FeeChunk,'text'> & {excerpt:string;score:number;applicability:'UNVERIFIED'}>;
}
export interface FeeRuleRetriever {retrieve(query:{platform:string;orderAt:string;text:string},beforeEmbedding:()=>Promise<void>):Promise<FeeRuleEvidence>}
export const emptyFeeEvidence=(orderAt:string,status:FeeRuleEvidence['status']):FeeRuleEvidence=>({status,orderAt,application:'REFERENCE_ONLY_RECORDED_RULES_UNCHANGED',matches:[]});
export function feePlatform(value:string):FeeChunk['platform']|undefined {
 const normalized=value.trim().toUpperCase().replace(/[ _-]/g,'');
 const names:Record<string,FeeChunk['platform']>={SHOPEE:'SHOPEE',LAZADA:'LAZADA',TIKTOK:'TIKTOK',TIKTOKSHOP:'TIKTOK',LINE:'LINE',LINESHOP:'LINE',LINESHOPPING:'LINE',MYSHOP:'LINE'};
 return names[normalized];
}
export function cosine(a:number[],b:number[]){
 demand(a.length===EMBEDDING_DIMENSIONS&&b.length===a.length,'INVALID_FEE_VECTOR');let dot=0,aa=0,bb=0;
 for(let i=0;i<a.length;i++){demand(Number.isFinite(a[i])&&Number.isFinite(b[i]),'INVALID_FEE_VECTOR');dot+=a[i]*b[i];aa+=a[i]**2;bb+=b[i]**2;}
 demand(aa>0&&bb>0,'INVALID_FEE_VECTOR');return dot/Math.sqrt(aa*bb);
}
type EmbedClient={send(command:InvokeModelCommand,options?:{abortSignal:AbortSignal}):Promise<{body:Uint8Array}>};
export class TitanEmbedder {
 constructor(private client:EmbedClient=new BedrockRuntimeClient({region:'us-east-1',maxAttempts:1})){}
 async embed(text:string){
  demand(text.trim().length>0&&text.length<=16000,'INVALID_EMBEDDING_INPUT');
  const result=await this.client.send(new InvokeModelCommand({modelId:TITAN_EMBED_V2,contentType:'application/json',accept:'application/json',
   body:JSON.stringify({inputText:text,dimensions:EMBEDDING_DIMENSIONS,normalize:true})}),{abortSignal:AbortSignal.timeout(5000)});
  demand(result.body.byteLength<=100000,'EMBEDDING_RESPONSE_TOO_LARGE');
  const output=JSON.parse(Buffer.from(result.body).toString('utf8'));
  return {embedding:vectorSchema.parse(output.embedding),inputTokens:z.number().int().nonnegative().parse(output.inputTextTokenCount)};
 }
}
const aliases={SHOPEE:'Shopee ช้อปปี้',LAZADA:'Lazada ลาซาด้า',TIKTOK:'TikTok Shop ติ๊กต๊อก',LINE:'LINE MyShop LINE SHOPPING ไลน์'};
const glossary:Array<[RegExp,string]>=[[/คอมมิช|commission/i,'commission'],[/ชำระ|ธุรกรรม|transaction|payment/i,'transaction payment fee'],[/ภาษี|vat|wht/i,'VAT tax inclusive exclusive withholding'],[/ส่ง|shipping/i,'shipping logistics'],[/ลด|คูปอง|discount|voucher/i,'seller funded discount platform voucher fee base'],[/คืน|ยกเลิก|refund|cancel/i,'refund return cancellation fee reversal'],[/กำไร|คุ้มทุน|profit|break.even/i,'seller fee calculation basis']];
export const embeddingText=(chunk:FeeChunk)=>`${aliases[chunk.platform]}\n${chunk.title}\n${chunk.text}`;
export function selectFeeEvidence(index:FeeIndex,query:{platform:string;orderAt:string},vector:number[]):FeeRuleEvidence {
 const platform=feePlatform(query.platform);demand(!Number.isNaN(Date.parse(query.orderAt)),'INVALID_FEE_QUERY_DATE');
 const output:FeeRuleEvidence={...emptyFeeEvidence(query.orderAt,'NO_MATCH'),corpusVersion:index.corpusVersion,embeddingModel:index.modelId};
 if(!platform)return output;
 // Illustrative amounts never compete with policy evidence. Unknown validity stays explicit.
 const candidates=index.chunks.filter(c=>c.platform===platform&&c.kind!=='ILLUSTRATION')
  .map(c=>({chunk:c,score:cosine(vector,c.embedding)})).filter(c=>c.score>=.25).sort((a,b)=>b.score-a.score||a.chunk.id.localeCompare(b.chunk.id)).slice(0,3);
 output.matches=candidates.map(({chunk,score})=>{const {embedding,text,...metadata}=chunk;return {...metadata,
  cautions:[...metadata.cautions,'EFFECTIVE_DATE_NOT_NORMALIZED',...(query.orderAt.slice(0,10)<chunk.asOf?['RESEARCH_AS_OF_AFTER_ORDER']:[])],
  excerpt:text,score:Math.round(score*10000)/10000,applicability:'UNVERIFIED' as const};});
 output.status=output.matches.length?'READY':'NO_MATCH';return output;
}
export class S3FeeRuleRetriever implements FeeRuleRetriever {
 private index?:Promise<FeeIndex>;private expires=0;
 constructor(private load:()=>Promise<Buffer>,private expectedSha256:string,private embedder:Pick<TitanEmbedder,'embed'>=new TitanEmbedder()){}
 private async read(){
  if(!this.index||Date.now()>=this.expires){this.expires=Date.now()+300000;this.index=(async()=>{const body=await this.load();demand(body.length<=8*1024*1024,'FEE_INDEX_TOO_LARGE');
   demand(checksum.safeParse(this.expectedSha256).success&&sha(body)===this.expectedSha256,'FEE_INDEX_HASH_MISMATCH');
   const index=feeIndexSchema.parse(JSON.parse(body.toString('utf8')));demand(new Set(index.chunks.map(c=>c.id)).size===index.chunks.length,'DUPLICATE_FEE_CHUNK');return index;})();
  }
  try{return await this.index;}catch(e){this.index=undefined;throw e;}
 }
 async retrieve(query:{platform:string;orderAt:string;text:string},beforeEmbedding:()=>Promise<void>){
  const platform=feePlatform(query.platform);if(!platform)return emptyFeeEvidence(query.orderAt,'NO_MATCH');
  demand(query.text.trim().length>0&&query.text.length<=1500&&!Number.isNaN(Date.parse(query.orderAt)),'INVALID_FEE_QUERY');
  const index=await this.read();
  if(!index.chunks.some(c=>c.platform===platform&&c.kind!=='ILLUSTRATION'))return emptyFeeEvidence(query.orderAt,'NO_MATCH');
  // Charge attempted embedding calls to the existing per-store AI limiter, even on failure.
  const terms=glossary.filter(([pattern])=>pattern.test(query.text)).map(([,term])=>term).join('; ');
  await beforeEmbedding();const vector=await this.embedder.embed(`${aliases[platform]} Thailand seller fee rules\n${query.text}\n${terms}`);
  return selectFeeEvidence(index,query,vector.embedding);
 }
}
export function feeRuleRetrieverFromEnv():FeeRuleRetriever|undefined {
 if(process.env.FEE_RULES_ENABLED!=='true')return;
 const s3=new S3Client({region:'ap-southeast-1',maxAttempts:1}),bucket=process.env.UPLOADS_BUCKET,key=process.env.FEE_RULES_INDEX_KEY;
 return new S3FeeRuleRetriever(async()=>{
  demand(!!bucket&&!!key&&/^fee-rules\/v1\/[a-f0-9]{64}\/index\.json$/.test(key),'FEE_INDEX_NOT_CONFIGURED');
  const response=await s3.send(new GetObjectCommand({Bucket:bucket,Key:key}),{abortSignal:AbortSignal.timeout(5000)});
  demand(!!response.Body&&(response.ContentLength??Infinity)<=8*1024*1024,'FEE_INDEX_TOO_LARGE');
  const parts:Buffer[]=[];let length=0;for await(const part of response.Body as AsyncIterable<Uint8Array>){length+=part.length;demand(length<=8*1024*1024,'FEE_INDEX_TOO_LARGE');parts.push(Buffer.from(part));}
  return Buffer.concat(parts);
 },process.env.FEE_RULES_INDEX_SHA256??'');
}
