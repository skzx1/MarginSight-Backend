import {parse} from 'csv-parse/sync';
import ExcelJS from 'exceljs';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {normalizeDate} from './domain/date.js';
import {satang} from './domain/money.js';
import {Repository,id,pk} from './repository.js';
import {AppError,demand} from './errors.js';
import type {Files,Queue,Task} from './files.js';
import {inflateRawSync} from 'node:zlib';
export const importTypes=['products','costs','orders','fees','adjustments'] as const;
export type ImportType=typeof importTypes[number];
const date=normalizeDate;
const schema=z.object({kind:z.enum(importTypes),fileName:z.string().min(1).max(120).regex(/^[^\/\\\u0000-\u001f\u007f]+\.(csv|xlsx)$/i),adapter:z.enum(['mock-v1','merchant-v1']).default('mock-v1'),dataOrigin:z.enum(['MOCK','REAL']).default('MOCK'),acknowledgeOwnership:z.boolean().optional()});
export async function createImport(repo:Repository,files:Files,store:string,body:unknown,user?:string){
 const input=schema.parse(body);demand((input.adapter==='mock-v1'&&input.dataOrigin==='MOCK')||(input.adapter==='merchant-v1'&&input.dataOrigin==='REAL'),'REAL_ADAPTER_REQUIRES_VERIFIED_SCHEMA');if(input.dataOrigin==='REAL')demand(!!user&&input.acknowledgeOwnership===true,'MERCHANT_INPUT_ACKNOWLEDGEMENT_REQUIRED');
 demand(await repo.db.reserve(pk(store)+'#IMPORT',new Date().toISOString().slice(0,10),50),'IMPORT_DAILY_LIMIT_REACHED',429);
 const type=input.fileName.toLowerCase().endsWith('.xlsx')?'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':'text/csv';
 const job=await repo.createJob(store,{...input,createdBy:user,type,status:'UPLOADED',objectKey:'',chunks:0});const objectKey=`${store}/imports/${job.id}/${input.fileName}`;
 await repo.updateJob(store,job.id,{objectKey});return {id:job.id,uploadUrl:await files.uploadUrl(objectKey,type),contentType:type};
}
/** Inspect ZIP central directory sizes before ExcelJS decompresses an XLSX. */
export function checkXlsxArchive(b:Buffer){
 let end=-1;for(let i=b.length-22;i>=Math.max(0,b.length-65557);i--)if(b.readUInt32LE(i)===0x06054b50){end=i;break}
 demand(end>=0,'INVALID_XLSX');const count=b.readUInt16LE(end+10),start=b.readUInt32LE(end+16);demand(count>0&&count<2000&&start<b.length,'XLSX_ARCHIVE_LIMIT');let p=start,total=0;
 for(let n=0;n<count;n++){demand(p+46<=b.length&&b.readUInt32LE(p)===0x02014b50,'INVALID_XLSX');const flags=b.readUInt16LE(p+8),compressed=b.readUInt32LE(p+20),size=b.readUInt32LE(p+24),nameLen=b.readUInt16LE(p+28),extra=b.readUInt16LE(p+30),comment=b.readUInt16LE(p+32);demand(!(flags&1)&&size!==0xffffffff&&size<=20*1024*1024,'XLSX_ARCHIVE_LIMIT');total+=size;demand(total<=20*1024*1024&&(compressed===0?size===0:size/compressed<1000),'XLSX_ARCHIVE_LIMIT');const name=b.subarray(p+46,p+46+nameLen).toString();demand(!name.includes('vbaProject')&&!name.includes('externalLinks/'),'XLSX_ACTIVE_CONTENT_REJECTED');p+=46+nameLen+extra+comment}
 // Independently bound decompression; central-directory declared sizes alone are not trusted.
 p=start;let inflated=0;for(let n=0;n<count;n++){const compressed=b.readUInt32LE(p+20),declared=b.readUInt32LE(p+24),offset=b.readUInt32LE(p+42),method=b.readUInt16LE(p+10);demand(offset+30<=b.length&&b.readUInt32LE(offset)===0x04034b50,'INVALID_XLSX');const dataStart=offset+30+b.readUInt16LE(offset+26)+b.readUInt16LE(offset+28);demand(dataStart+compressed<=start&&[0,8].includes(method),'INVALID_XLSX');const zipped=b.subarray(dataStart,dataStart+compressed);const data=method===8?inflateRawSync(zipped,{maxOutputLength:20*1024*1024-inflated}):zipped;demand(data.length===declared,'XLSX_SIZE_MISMATCH');inflated+=data.length;demand(inflated<=20*1024*1024,'XLSX_ARCHIVE_LIMIT');p+=46+b.readUInt16LE(p+28)+b.readUInt16LE(p+30)+b.readUInt16LE(p+32)}
}
export async function parseFile(bytes:Buffer,fileName:string):Promise<Record<string,string>[]>{
 demand(bytes.length<=5*1024*1024,'FILE_TOO_LARGE',413);
 if(fileName.toLowerCase().endsWith('.xlsx')){checkXlsxArchive(bytes);const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(bytes as any);demand(workbook.worksheets.length===1,'XLSX_ONE_SHEET_REQUIRED');const sheet=workbook.worksheets[0];demand(sheet.rowCount<=1001&&sheet.columnCount<=40,'IMPORT_ROW_LIMIT');const headers=(sheet.getRow(1).values as any[]).slice(1).map(x=>String(x??'').trim());demand(new Set(headers).size===headers.length&&!headers.includes(''),'INVALID_HEADERS');const rows:Record<string,string>[]=[];for(let n=2;n<=sheet.rowCount;n++){const record:Record<string,string>={};headers.forEach((h,k)=>{const cell=sheet.getRow(n).getCell(k+1);demand(cell.type!==ExcelJS.ValueType.Formula,'XLSX_FORMULA_REJECTED');record[h]=cell.text});if(Object.values(record).some(v=>v.trim()))rows.push(record)}return rows;}
 demand(fileName.toLowerCase().endsWith('.csv'),'INVALID_FILE_TYPE');const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);const rows=parse(text,{columns:(headers:string[])=>{demand(new Set(headers).size===headers.length&&headers.every(h=>h.trim().length>0)&&headers.length<=40,'INVALID_HEADERS');return headers},bom:true,skip_empty_lines:true,trim:true,max_record_size:16384}) as Record<string,string>[];demand(rows.length<=1000,'IMPORT_ROW_LIMIT');return rows;
}
function required(row:Record<string,string>,key:string){demand(row[key]!==undefined&&row[key]!==''&&row[key].length<500,'MISSING_'+key);return row[key]}
function number(row:Record<string,string>,key:string,defaultValue='0',negative=false){return satang(row[key]??defaultValue,negative)}
export function normalize(kind:ImportType,row:Record<string,string>,ref:string,origin:'MOCK'|'REAL'='MOCK',verifiedBy='merchant-mock-fixture'){
 const evidence={dataOrigin:origin,sourceRef:ref};
 if(origin==='REAL'){const fields=kind==='orders'?['buyer_payment_thb','buyer_shipping_thb','platform_discount_thb','seller_discount_thb','packaging_thb','ads_thb','seller_shipping_thb']:kind==='adjustments'?['revenue_delta_thb','cogs_delta_thb']:[];for(const field of fields)required(row,field);if(kind==='fees'&&row.scope==='PER_ITEM')required(row,'sku');if(kind==='fees')required(row,'scope');if(kind==='costs')required(row,'unit');}
 if(kind==='products')return {key:'PRODUCT#'+id(required(row,'sku')),value:{...evidence,sku:row.sku,name:required(row,'name'),unit:required(row,'unit')}};
 if(kind==='costs'){const at=date(required(row,'effective_from'));return {key:'COST#'+id(required(row,'sku'))+'#'+at+'#import',value:{...evidence,sku:row.sku,version:at+'-import',unitCostSatang:satang(required(row,'cost_thb')),effectiveFrom:at,verifiedBy,inputUnit:row.unit,method:'MERCHANT_CONFIRMED_UNIT_COST'}}}
 const platform=id(required(row,'platform')),orderId=id(required(row,'order_id'));
 if(kind==='orders'){const at=date(required(row,'order_at')),quantity=Number(required(row,'quantity'));demand(Number.isSafeInteger(quantity)&&quantity>0&&quantity<=10000,'INVALID_QUANTITY');const revenue=satang(required(row,'revenue_thb'));return {platform,orderId,header:{...evidence,platform,orderId,orderAt:at,settlementStatus:'UNSETTLED',feesConfirmed:false},key:'ITEM#'+id(required(row,'line_id')),value:{...evidence,lineId:row.line_id,sku:id(required(row,'sku')),quantity,revenueSatang:revenue,buyerPaymentSatang:number(row,'buyer_payment_thb',row.revenue_thb),buyerShippingSatang:number(row,'buyer_shipping_thb'),platformDiscountSatang:number(row,'platform_discount_thb'),sellerDiscountSatang:number(row,'seller_discount_thb'),packagingSatang:number(row,'packaging_thb'),adsSatang:number(row,'ads_thb'),sellerShippingSatang:number(row,'seller_shipping_thb')}};}
 if(kind==='fees'){const scope=row.scope??'PER_ORDER';demand(['PER_ITEM','PER_ORDER','PER_MONTH'].includes(scope),'INVALID_FEE_SCOPE');return {platform,orderId,key:'FEE#'+id(required(row,'fee_id')),value:{...evidence,feeId:row.fee_id,type:required(row,'fee_type'),scope,amountSatang:satang(required(row,'amount_thb'),true),effectiveAt:date(required(row,'effective_at')),sku:row.sku||undefined}};}
 return {platform,orderId,key:'ADJ#'+id(required(row,'transaction_id')),value:{...evidence,transactionId:row.transaction_id,revenueDeltaSatang:number(row,'revenue_delta_thb','0',true),cogsDeltaSatang:number(row,'cogs_delta_thb','0',true),reason:required(row,'reason'),effectiveAt:date(required(row,'effective_at'))}};
}
export class Importer {
 constructor(private repo:Repository,private files:Files,private queue:Queue){}
 async retry(store:string,jobId:string){const j=await this.repo.job(store,jobId);demand(['QUEUED','PROCESSING'].includes(j.value.status),'RETRY_REQUIRES_PENDING_IMPORT');await this.queue.send({kind:'IMPORT',store,jobId});return j.value}
 async review(store:string,jobId:string,user:string,reason:string){const j=await this.repo.job(store,jobId);demand(j.value.status==='PARTIAL','REVIEW_REQUIRES_PARTIAL_IMPORT');const unresolved=(await this.repo.conflicts(store)).filter(c=>c.incoming.importId===jobId&&!c.resolution);demand(!unresolved.length,'UNRESOLVED_IMPORT_CONFLICTS',409);return this.repo.updateJob(store,jobId,{status:'COMPLETED',review:{reviewedBy:user,reviewedAt:new Date().toISOString(),reason,excludedRows:j.value.errors,policy:'publish accepted rows; rejected rows explicitly excluded; originals preserved'},hadImportErrors:true})}
 async complete(store:string,jobId:string){const job=await this.repo.job(store,jobId);if(job.value.status==='QUEUED'){await this.queue.send({kind:'IMPORT',store,jobId});return job.value}if(job.value.status!=='UPLOADED')return job.value;const meta=await this.files.head(job.value.objectKey);demand(meta.size>0&&meta.size<=5*1024*1024,'FILE_TOO_LARGE',413);demand(meta.type===job.value.type,'CONTENT_TYPE_MISMATCH');await this.repo.updateJob(store,jobId,{status:'QUEUED'});await this.queue.send({kind:'IMPORT',store,jobId});return this.repo.job(store,jobId).then(j=>j.value)}
 async run(task:Task){const {store,jobId}=task;const row=await this.repo.job(store,jobId),job=row.value;
  if(['COMPLETED','PARTIAL','FAILED'].includes(job.status))return;
  if(task.kind==='IMPORT'){
   const sourceBytes=await this.files.get(job.objectKey);let rows:Record<string,string>[];try{rows=await parseFile(sourceBytes,job.fileName)}catch(e:any){await this.repo.updateJob(store,jobId,{status:'FAILED',error:e instanceof AppError?e.code:'INVALID_FILE'});return}
   const total=Math.ceil(rows.length/100);await this.repo.updateJob(store,jobId,{status:'PROCESSING',totalRows:rows.length,chunks:total});
   if(total===0){await this.repo.updateJob(store,jobId,{status:'COMPLETED',accepted:0,rejected:0,duplicate:0,conflict:0});return}
   for(let c=0;c<total;c++){const key=`${store}/imports/${jobId}/chunk-${c}.json`;await this.files.put(key,Buffer.from(JSON.stringify(rows.slice(c*100,(c+1)*100))),'application/json');await this.queue.send({kind:'CHUNK',store,jobId,chunk:c});}return;
  }
  demand(task.chunk!==undefined,'MISSING_CHUNK');const chunkKey='JOB#'+jobId+'#CHUNK#'+task.chunk;const old=await this.repo.db.get('jobs',pk(store),chunkKey);
  if(old){await this.summarize(store,jobId);return;}
  const rows=JSON.parse((await this.files.get(`${store}/imports/${jobId}/chunk-${task.chunk}.json`)).toString()) as Record<string,string>[];
  const counts={accepted:0,rejected:0,duplicate:0,conflict:0};const errors:{row:number;code:string}[]=[];
  for(let n=0;n<rows.length;n++){try{const normalized=normalize(job.kind,rows[n],`${job.adapter??'mock-v1'}:${job.fileName}:row:${task.chunk*100+n+2}`,job.dataOrigin??'MOCK',job.dataOrigin==='REAL'?job.createdBy:'merchant-mock-fixture');
   if(job.kind==='products'||job.kind==='costs'){if(job.kind==='costs'&&job.dataOrigin==='REAL'){const product=await this.repo.db.get('catalog',pk(store),'PRODUCT#'+rows[n].sku);demand(product&&product.value.unit===rows[n].unit,'COST_UNIT_MISMATCH');}const result=await this.repo.mergeCatalog(store,normalized.key,{...normalized.value,importId:jobId});counts[result]++;if(result==='conflict')errors.push({row:task.chunk*100+n+2,code:'CATALOG_CONFLICT'});}
   else{if('header' in normalized&&normalized.header){const headerResult=await this.repo.mergeLedger(store,normalized.platform!,normalized.orderId!,'HEADER',{...normalized.header,importId:jobId});if(headerResult==='conflict'){counts.conflict++;errors.push({row:task.chunk*100+n+2,code:'ORDER_HEADER_CONFLICT'});continue}}const result=await this.repo.mergeLedger(store,normalized.platform!,normalized.orderId!,normalized.key,{...normalized.value,importId:jobId});counts[result]++;if(result==='conflict')errors.push({row:task.chunk*100+n+2,code:'LEDGER_CONFLICT'});}
  }catch(e:any){const validation=(e instanceof AppError&&e.status<500&&!e.code.startsWith('CONCURRENT_'))||e instanceof z.ZodError||(e instanceof Error&&['INVALID_MONEY','MONEY_OUT_OF_RANGE','INVALID_DATE'].includes(e.message));if(!validation)throw e;counts.rejected++;errors.push({row:task.chunk*100+n+2,code:e instanceof AppError?e.code:'INVALID_ROW'})}}
  // Chunk completion is a single conditional record. Progress is derived, never incremented per delivery.
  await this.repo.db.put('jobs',{PK:pk(store),SK:chunkKey,version:1,value:{...counts,errors}},0);await this.summarize(store,jobId);
 }
 private async summarize(store:string,jobId:string){for(let attempt=0;attempt<8;attempt++){const job=await this.repo.job(store,jobId);if(['COMPLETED','PARTIAL','FAILED'].includes(job.value.status))return;const chunks=await this.repo.all('jobs',pk(store),'JOB#'+jobId+'#CHUNK#');const totals={accepted:0,rejected:0,duplicate:0,conflict:0};for(const c of chunks)for(const k of Object.keys(totals) as (keyof typeof totals)[])totals[k]+=c.value[k]??0;const complete=chunks.length===job.value.chunks;const next={...job,version:job.version+1,value:{...job.value,...totals,completedChunks:chunks.length,status:complete?(totals.rejected||totals.conflict?'PARTIAL':'COMPLETED'):'PROCESSING',errors:chunks.flatMap(c=>c.value.errors??[])}};if(await this.repo.db.put('jobs',next,job.version))return;}throw new AppError('CONCURRENT_JOB_UPDATE',409)}
}
