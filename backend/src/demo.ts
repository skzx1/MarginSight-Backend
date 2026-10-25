import {createHash,randomBytes,randomUUID} from 'node:crypto';
import type {Repository} from './repository.js';
import {seed} from './seed.js';
import {demand} from './errors.js';

const digest=(token:string)=>createHash('sha256').update(token).digest('hex');
type Session={subject:string;store:string;expiresAt?:number;revoked?:boolean};
type DemoRequest={method:string;path:string;authorization?:string;origin?:string;body?:any};
function enabled(){demand(process.env.DEMO_ENABLED==='true','DEMO_DISABLED',503)}
function allowedOrigin(origin:string|undefined){demand(!!process.env.DEMO_WEB_ORIGIN&&origin===process.env.DEMO_WEB_ORIGIN,'DEMO_ORIGIN_NOT_ALLOWED',403)}

export async function createDemoSession(repo:Repository,request:DemoRequest){
 enabled();allowedOrigin(request.origin);
 demand(request.method==='POST'&&(!request.body||typeof request.body==='object'&&!Array.isArray(request.body)&&Object.keys(request.body).length===0),'INVALID_DEMO_REQUEST');
 const suffix=randomUUID(),subject='guest-'+suffix,store='DEMO-GUEST-'+suffix;
 // Token is returned once. Only its SHA-256 digest is stored; no static credential.
 const token='demo.'+randomBytes(32).toString('base64url');
 await seed(repo,[{sub:subject,store}],{storefrontIds:true});
 const member=await repo.db.get('memberships','USER#'+subject,'STORE#'+store);
 demand(member,'DEMO_SEED_FAILED',503);
 member.value.name='ร้าน MarginShot';member.value.guest=true;
 await repo.db.put('memberships',member);
 await repo.db.put('jobs',{PK:'DEMOSESSION#'+digest(token),SK:'SESSION',version:1,value:{subject,store}},0);
 return {accessToken:token,nonExpiring:true,store,dataOrigin:'MOCK',mode:'ISOLATED_FULL_APP_DEMO'};
}

export async function demoSession(repo:Repository,authorization:string|undefined):Promise<Session>{
 enabled();demand(authorization?.startsWith('Bearer demo.'),'UNAUTHORIZED',401);
 const token=authorization!.slice(7);demand(/^demo\.[A-Za-z0-9_-]{43}$/.test(token),'UNAUTHORIZED',401);
 const row=await repo.db.get('jobs','DEMOSESSION#'+digest(token),'SESSION'),value=row?.value;
 demand(value&&value.revoked!==true,'DEMO_SESSION_REVOKED',401);
 if(row?.expiresAt!==undefined||value.expiresAt!==undefined){delete row!.expiresAt;delete value.expiresAt;await repo.db.put('jobs',row!,row!.version);}
 demand(/^guest-[a-f0-9-]{36}$/.test(value.subject)&&/^DEMO-GUEST-[a-f0-9-]{36}$/.test(value.store),'UNAUTHORIZED',401);
 return value;
}

export async function authorizeDemo(repo:Repository,request:DemoRequest){
 allowedOrigin(request.origin);
 const session=await demoSession(repo,request.authorization);
 const path=request.path.replace(/\/$/,'');
 if(request.method==='GET'&&path==='/me/stores')return session;
 const match=path.match(/^\/stores\/([^/]+)(\/.*)?$/);
 demand(match&&decodeURIComponent(match[1])===session.store,'FORBIDDEN',403);
 const rest=match[2]??'';
 demand(!rest.startsWith('/line/'),'DEMO_LINE_NOT_CONNECTED',409);
 if(request.method==='POST'){
  demand(request.body?.dataOrigin===undefined||request.body.dataOrigin==='MOCK','DEMO_REQUIRES_MOCK_DATA',403);
  if(rest==='/imports')demand(request.body?.adapter==='mock-v1'&&request.body?.dataOrigin==='MOCK','DEMO_REQUIRES_MOCK_DATA',403);

 }
 return session;
}
