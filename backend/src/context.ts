import {AwsStorage,LocalStorage} from './storage.js';
import {Repository} from './repository.js';
import {AwsFiles,LocalFiles,AwsQueue,type Queue,type Task} from './files.js';
import {Importer} from './importer.js';
import {AI} from './ai.js';
import {Line} from './line.js';
import {Receipts} from './receipts.js';
export function createContext(repo:Repository,files:AwsFiles|LocalFiles,queue:Queue){const ai=new AI(repo),importer=new Importer(repo,files,queue),line=new Line(repo,ai,queue),receipts=new Receipts(repo,files,queue,ai);const run=async(t:Task)=>{if(t.kind==='OCR')await receipts.run(t);else if(t.kind==='LINE')await line.run(t);else await importer.run(t);await repo.db.flush()};return {repo,files,queue,ai,importer,line,receipts,run}}
export type Context=ReturnType<typeof createContext>;
let cloud:Context|undefined;
export function cloudContext(){return cloud??=createContext(new Repository(new AwsStorage()),new AwsFiles(),new AwsQueue())}
export async function localContext(root:string){const db=await new LocalStorage(root+'/db.json').init();let ctx:Context;let pending=Promise.resolve();const queue:Queue={send:async task=>{pending=pending.then(async()=>{try{await ctx.run(task)}catch(e){console.error(JSON.stringify({kind:task.kind,jobId:task.jobId,error:'LOCAL_WORKER_FAILURE'}))}});}};ctx=createContext(new Repository(db),new LocalFiles(root+'/files'),queue);return ctx}
