import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import {dirname} from 'node:path';
import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient,GetCommand,PutCommand,QueryCommand,UpdateCommand,TransactWriteCommand} from '@aws-sdk/lib-dynamodb';
import {AppError,demand} from './errors.js';
export type Table='memberships'|'catalog'|'ledger'|'jobs';
export interface Row {PK:string;SK:string;version:number;value:any;hash?:string;GSI1PK?:string;GSI1SK?:string;expiresAt?:number}
// User-authorized removal of guest lifetime limits. Security-code TTLs remain unchanged.
export function demoExpiry(row:Row):Row{if(/^(?:STORE#DEMO-GUEST-|USER#guest-|DEMOSESSION#)/.test(row.PK)&&!row.SK.startsWith('AIUSAGE#')){const {expiresAt,...persistent}=row;return persistent}return row}
export interface Page {items:Row[];next?:string}
export interface Storage {get(t:Table,PK:string,SK:string):Promise<Row|undefined>;put(t:Table,row:Row,expectedVersion?:number):Promise<boolean>;transact(t:Table,items:{row:Row;expectedVersion:number}[]):Promise<boolean>;query(t:Table,PK:string,prefix?:string,limit?:number,cursor?:string,index?:boolean,descending?:boolean):Promise<Page>;reserve(PK:string,day:string,limit:number):Promise<boolean>;flush():Promise<void>}
function decode(cursor:string|undefined){if(!cursor)return undefined;try{return JSON.parse(Buffer.from(cursor,'base64url').toString())}catch{throw new AppError('INVALID_CURSOR')}}
export class LocalStorage implements Storage {
  data:Record<Table,Record<string,Row>>={memberships:{},catalog:{},ledger:{},jobs:{}};
  constructor(private file?:string){}
  async init(){if(this.file)try{this.data=JSON.parse(await readFile(this.file,'utf8'))}catch(e:any){if(e.code!=='ENOENT')throw e}return this}
  private key(PK:string,SK:string){return JSON.stringify([PK,SK])}
  async get(t:Table,PK:string,SK:string){const r=this.data[t][this.key(PK,SK)];if(r)this.data[t][this.key(PK,SK)]=demoExpiry(r);return r?structuredClone(demoExpiry(r)):undefined}
  async put(t:Table,row:Row,expectedVersion?:number){row=demoExpiry(row);const k=this.key(row.PK,row.SK),old=this.data[t][k];if(expectedVersion===0&&old||expectedVersion!==undefined&&expectedVersion!==0&&old?.version!==expectedVersion)return false;this.data[t][k]=structuredClone(row);return true}
  async transact(t:Table,items:{row:Row;expectedVersion:number}[]){for(const {row,expectedVersion} of items){const old=this.data[t][this.key(row.PK,row.SK)];if(expectedVersion===0?!!old:old?.version!==expectedVersion)return false}for(const {row} of items)this.data[t][this.key(row.PK,row.SK)]=structuredClone(demoExpiry(row));return true}
  async query(t:Table,PK:string,prefix='',limit=100,cursor?:string,index=false,descending=false){
    const c=decode(cursor);if(c)demand(c.PK===PK&&c.index===index&&(c.descending??false)===descending,'INVALID_CURSOR');
    const rows=Object.values(this.data[t]).filter(r=>(index?r.GSI1PK:r.PK)===PK&&(index?r.GSI1SK??'':r.SK).startsWith(prefix)).sort((a,b)=>{const x=index?a.GSI1SK!:a.SK,y=index?b.GSI1SK!:b.SK;return x<y?-1:x>y?1:0});
    if(descending)rows.reverse();const remaining=c?rows.filter(r=>descending?(index?r.GSI1SK!:r.SK)<c.key:(index?r.GSI1SK!:r.SK)>c.key):rows,items=remaining.slice(0,limit);
    return {items:structuredClone(items.map(row=>{const clean=demoExpiry(row);this.data[t][this.key(row.PK,row.SK)]=clean;return clean})),next:remaining.length>limit?Buffer.from(JSON.stringify({PK,index,descending,key:index?items.at(-1)!.GSI1SK:items.at(-1)!.SK})).toString('base64url'):undefined};
  }
  async reserve(PK:string,day:string,limit:number):Promise<boolean>{const k=this.key(PK,'AIUSAGE#'+day),n=this.data.jobs[k]?.value.count??0;if(n>=limit)return false;this.data.jobs[k]=demoExpiry({PK,SK:'AIUSAGE#'+day,version:n+1,value:{count:n+1},expiresAt:Math.floor(Date.now()/1000)+172800});return true}
  private pending=Promise.resolve();
  async flush(){if(!this.file)return;const snapshot=JSON.stringify(this.data),file=this.file;this.pending=this.pending.catch(()=>{}).then(async()=>{await mkdir(dirname(file),{recursive:true});await writeFile(file+'.new',snapshot);await rename(file+'.new',file)});await this.pending;}
}
export class AwsStorage implements Storage {
  private db=DynamoDBDocumentClient.from(new DynamoDBClient({}),{marshallOptions:{removeUndefinedValues:true}});
  private tables:Record<Table,string>={memberships:process.env.MEMBERSHIPS_TABLE!,catalog:process.env.CATALOG_TABLE!,ledger:process.env.LEDGER_TABLE!,jobs:process.env.JOBS_TABLE!};
  private async retain(t:Table,row:Row){const clean=demoExpiry(row);if(row.expiresAt!==undefined&&clean.expiresAt===undefined){try{await this.db.send(new UpdateCommand({TableName:this.tables[t],Key:{PK:row.PK,SK:row.SK},UpdateExpression:'REMOVE expiresAt',ConditionExpression:'#v = :v',ExpressionAttributeNames:{'#v':'version'},ExpressionAttributeValues:{':v':row.version}}))}catch(e:any){if(e.name!=='ConditionalCheckFailedException')throw e}}return clean}
  async get(t:Table,PK:string,SK:string){const row=(await this.db.send(new GetCommand({TableName:this.tables[t],Key:{PK,SK},ConsistentRead:true}))).Item as Row|undefined;return row?this.retain(t,row):undefined}
  async put(t:Table,row:Row,expectedVersion?:number){try{await this.db.send(new PutCommand({TableName:this.tables[t],Item:demoExpiry(row),ConditionExpression:expectedVersion===undefined?undefined:expectedVersion===0?'attribute_not_exists(PK)':'#v = :version',ExpressionAttributeNames:expectedVersion&&expectedVersion>0?{'#v':'version'}:undefined,ExpressionAttributeValues:expectedVersion&&expectedVersion>0?{':version':expectedVersion}:undefined}));return true}catch(e:any){if(e.name==='ConditionalCheckFailedException')return false;throw e}}
  async transact(t:Table,items:{row:Row;expectedVersion:number}[]){try{await this.db.send(new TransactWriteCommand({TransactItems:items.map(({row,expectedVersion})=>({Put:{TableName:this.tables[t],Item:demoExpiry(row),ConditionExpression:expectedVersion===0?'attribute_not_exists(PK)':'#v = :v',ExpressionAttributeNames:expectedVersion>0?{'#v':'version'}:undefined,ExpressionAttributeValues:expectedVersion>0?{':v':expectedVersion}:undefined}}))}));return true}catch(e:any){if(e.name==='TransactionCanceledException')return false;throw e}}
  async query(t:Table,PK:string,prefix='',limit=100,cursor?:string,index=false,descending=false){const key=decode(cursor);if(key)demand((index?key.GSI1PK:key.PK)===PK,'INVALID_CURSOR');const out=await this.db.send(new QueryCommand({TableName:this.tables[t],IndexName:index?'ByStoreMonth':undefined,KeyConditionExpression:prefix?'#p = :p AND begins_with(#s, :s)':'#p = :p',ExpressionAttributeNames:prefix?{'#p':index?'GSI1PK':'PK','#s':index?'GSI1SK':'SK'}:{'#p':index?'GSI1PK':'PK'},ExpressionAttributeValues:prefix?{':p':PK,':s':prefix}:{':p':PK},Limit:limit,ScanIndexForward:!descending,ExclusiveStartKey:key,ConsistentRead:!index}));return {items:await Promise.all(((out.Items??[]) as Row[]).map(row=>this.retain(t,row))),next:out.LastEvaluatedKey?Buffer.from(JSON.stringify(out.LastEvaluatedKey)).toString('base64url'):undefined}}
  async reserve(PK:string,day:string,limit:number):Promise<boolean>{try{await this.db.send(new UpdateCommand({TableName:this.tables.jobs,Key:{PK,SK:'AIUSAGE#'+day},UpdateExpression:'SET #v = if_not_exists(#v, :zero) + :one, #value.#n = if_not_exists(#value.#n, :zero) + :one',ConditionExpression:'#value.#n < :lim',ExpressionAttributeNames:{'#v':'version','#value':'value','#n':'count'},ExpressionAttributeValues:{':zero':0,':one':1,':lim':limit}}));return true}catch(e:any){if(e.name!=='ConditionalCheckFailedException'&&e.name!=='ValidationException')throw e;return this.reserveNew(PK,day,limit)}}
  private async reserveNew(PK:string,day:string,limit:number):Promise<boolean>{if(limit<1)return false;const row={PK,SK:'AIUSAGE#'+day,version:1,value:{count:1},expiresAt:Math.floor(Date.now()/1000)+172800};if(await this.put('jobs',row,0))return true;const current=await this.get('jobs',PK,row.SK);if((current?.value.count??0)>=limit)return false;return this.reserve(PK,day,limit)}
  async flush(){}
}
