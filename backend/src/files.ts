import {mkdir,readFile,writeFile,stat} from 'node:fs/promises';
import {resolve,dirname,sep} from 'node:path';
import {S3Client,GetObjectCommand,PutObjectCommand,HeadObjectCommand} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {SQSClient,SendMessageCommand} from '@aws-sdk/client-sqs';
import {AppError,demand} from './errors.js';
export interface Files {put(key:string,bytes:Uint8Array,type:string):Promise<void>;get(key:string,max?:number):Promise<Buffer>;head(key:string):Promise<{size:number;type:string}>;uploadUrl(key:string,type:string):Promise<string>;downloadUrl(key:string):Promise<string>}
export class LocalFiles implements Files {
 constructor(private root:string,private base='http://localhost:4051'){}
 path(key:string){demand(!key.includes('..')&&!key.startsWith('/')&&!key.includes('\\'),'INVALID_OBJECT_KEY');const p=resolve(this.root,key);demand(p.startsWith(resolve(this.root)+sep),'INVALID_OBJECT_KEY');return p}
 async put(key:string,bytes:Uint8Array,type:string){const p=this.path(key);await mkdir(dirname(p),{recursive:true});await writeFile(p,bytes);await writeFile(p+'.type',type)}
 async get(key:string,max=5*1024*1024){const p=this.path(key);demand((await stat(p)).size<=max,'FILE_TOO_LARGE',413);return readFile(p)}
 async head(key:string){const p=this.path(key);return {size:(await stat(p)).size,type:await readFile(p+'.type','utf8')}}
 async uploadUrl(key:string){return this.base+'/dev/files/'+encodeURIComponent(key)}
 async downloadUrl(key:string){return this.base+'/dev/files/'+encodeURIComponent(key)}
}
export class AwsFiles implements Files {
 private client=new S3Client({});private bucket=process.env.UPLOADS_BUCKET!;
 async put(key:string,bytes:Uint8Array,type:string){await this.client.send(new PutObjectCommand({Bucket:this.bucket,Key:key,Body:bytes,ContentType:type}))}
 async get(key:string,max=5*1024*1024){const out=await this.client.send(new GetObjectCommand({Bucket:this.bucket,Key:key}));demand((out.ContentLength??Infinity)<=max,'FILE_TOO_LARGE',413);const b=Buffer.from(await out.Body!.transformToByteArray());demand(b.length<=max,'FILE_TOO_LARGE',413);return b}
 async head(key:string){const out=await this.client.send(new HeadObjectCommand({Bucket:this.bucket,Key:key}));return {size:out.ContentLength??0,type:out.ContentType??''}}
 async uploadUrl(key:string,type:string){return getSignedUrl(this.client,new PutObjectCommand({Bucket:this.bucket,Key:key,ContentType:type}),{expiresIn:300})}
 async downloadUrl(key:string){return getSignedUrl(this.client,new GetObjectCommand({Bucket:this.bucket,Key:key}),{expiresIn:120})}
}
export type Task={kind:'IMPORT'|'CHUNK'|'OCR'|'LINE';store:string;jobId:string;chunk?:number;event?:any};
export interface Queue {send(task:Task):Promise<void>}
export class AwsQueue implements Queue {private client=new SQSClient({});async send(task:Task){const url=task.kind==='OCR'?process.env.OCR_QUEUE_URL:task.kind==='LINE'?process.env.LINE_QUEUE_URL:process.env.IMPORT_QUEUE_URL;demand(url,'QUEUE_NOT_CONFIGURED',503);await this.client.send(new SendMessageCommand({QueueUrl:url,MessageBody:JSON.stringify(task)}))}}
