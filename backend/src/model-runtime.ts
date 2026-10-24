import {AnthropicBedrockMantle,type BedrockMantleClientOptions} from '@anthropic-ai/bedrock-sdk';
import {BedrockRuntimeClient,ConverseCommand} from '@aws-sdk/client-bedrock-runtime';
import {AppError,demand} from './errors.js';

export const NOVA_LITE='amazon.nova-lite-v1:0';
export const CLAUDE_HAIKU='anthropic.claude-haiku-4-5';
export interface ModelConfig {model:string;region:string;transport:'converse'|'mantle-messages'}
export interface ModelRuntime {send(command:ConverseCommand,options?:{abortSignal?:AbortSignal}):Promise<any>}

export function modelConfig(purpose:'assistant'|'receipt'='assistant'):ModelConfig {
 const model=(purpose==='assistant'?process.env.ASSISTANT_MODEL_ID:undefined)??process.env.BEDROCK_MODEL_ID??NOVA_LITE;
 const region=process.env.BEDROCK_REGION??'us-east-1';
 demand(['us-east-1','ap-southeast-1','ap-southeast-7'].includes(region),'MODEL_REGION_NOT_APPROVED',503);
 if(model===CLAUDE_HAIKU&&purpose==='assistant') {
  demand(region==='us-east-1','MODEL_REGION_NOT_APPROVED',503);
  return {model,region,transport:'mantle-messages'};
 }
 demand(model===NOVA_LITE,'MODEL_NOT_APPROVED',503);
 return {model,region,transport:'converse'};
}

// Translate only the application's bounded text/tool protocol. Never enable
// server-side tools, URL fetching, cross-Region profiles, or external endpoints.
export function mantleRequest(input:ConverseCommand['input']) {
 demand(input.modelId===CLAUDE_HAIKU,'MODEL_NOT_APPROVED',503);
 const maxTokens=input.inferenceConfig?.maxTokens;
 demand(typeof maxTokens==='number'&&Number.isInteger(maxTokens)&&maxTokens>0&&maxTokens<=500,'INVALID_AI_TOKEN_LIMIT',503);
 const content=(block:any):any=>{
  if(typeof block.text==='string')return {type:'text',text:block.text};
  if(block.toolUse)return {type:'tool_use',id:block.toolUse.toolUseId,name:block.toolUse.name,input:block.toolUse.input};
  if(block.toolResult)return {type:'tool_result',tool_use_id:block.toolResult.toolUseId,
   content:block.toolResult.content.map((item:any)=>{
    if('json' in item)return {type:'text',text:JSON.stringify(item.json)};
    demand(typeof item.text==='string','UNSUPPORTED_MODEL_CONTENT');return {type:'text',text:item.text};
   }),...(block.toolResult.status==='error'?{is_error:true}:{})};
  throw new AppError('UNSUPPORTED_MODEL_CONTENT');
 };
 const messages=(input.messages??[]).map(m=>({role:m.role,content:(m.content??[]).map(content)}));
 const tools=input.toolConfig?.tools?.map(t=>{
  demand(t.toolSpec?.name&&t.toolSpec.inputSchema?.json,'UNSUPPORTED_MODEL_TOOL');
  return {name:t.toolSpec.name,description:t.toolSpec.description,input_schema:t.toolSpec.inputSchema.json};
 });
 const request={model:CLAUDE_HAIKU,max_tokens:maxTokens,temperature:0,service_tier:'default',stream:false as const,
  system:(input.system??[]).map(s=>{demand(typeof s.text==='string','UNSUPPORTED_MODEL_CONTENT');return s.text}).join('\n'),
  messages,...(tools?.length?{tools}:{})};
 demand(Buffer.byteLength(JSON.stringify(request))<=65536,'MODEL_CONTEXT_TOO_LARGE',413);
 return request;
}

export function createHaikuClient(options:Pick<BedrockMantleClientOptions,'fetch'|'providerChainResolver'>={}) {
 return new AnthropicBedrockMantle({
  awsRegion:'us-east-1',baseURL:'https://bedrock-mantle.us-east-1.api.aws/anthropic',
  apiKey:null,maxRetries:0,timeout:16000,logLevel:'off',fetchOptions:{redirect:'error'},...options
 });
}
export class HaikuRuntime implements ModelRuntime {
 constructor(private client:Pick<AnthropicBedrockMantle,'messages'>=createHaikuClient()){}
 async send(command:ConverseCommand,options?:{abortSignal?:AbortSignal}) {
  const request=mantleRequest(command.input);
  let response:any;
  try {
   response=await this.client.messages.create(request as any,{signal:options?.abortSignal});
  }catch(e:any){
   // Provider error bodies may contain request data. Return safe codes only.
   throw new AppError(e?.status===401||e?.status===403?'MODEL_ACCESS_DENIED':e?.status===429?'MODEL_RATE_LIMITED':'MODEL_UNAVAILABLE',503);
  }
  demand(Array.isArray(response.content),'EMPTY_MODEL_RESPONSE',502);
  const content=response.content.map((block:any)=>{
   if(block.type==='text'&&typeof block.text==='string')return {text:block.text};
   if(block.type==='tool_use'&&typeof block.id==='string'&&typeof block.name==='string')return {toolUse:{toolUseId:block.id,name:block.name,input:block.input}};
   throw new AppError('UNSUPPORTED_MODEL_RESPONSE',502);
  });
  return {output:{message:{role:'assistant',content}}};
 }
}

export function createModelRuntime(config:ModelConfig):ModelRuntime {
 return config.transport==='mantle-messages'?new HaikuRuntime():new BedrockRuntimeClient({region:config.region,maxAttempts:1});
}
