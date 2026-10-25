import {createServer} from 'node:http';
import {resolve} from 'node:path';
import {localContext} from './context.js';
import {route,safeError} from './api.js';
import {subject} from './auth.js';
import {demoSession} from './demo.js';
import {id} from './repository.js';
import {demand} from './errors.js';
import {seed} from './seed.js';
import {LocalStorage} from './storage.js';
process.env.DEMO_ENABLED='true';process.env.DEMO_WEB_ORIGIN='http://localhost:4050';process.env.LOCAL_MODE='true';process.env.AI_ENABLED='false';
const ctx=await localContext(resolve('../.local'));await seed(ctx.repo);
// Upgrade only local, isolated MOCK sessions so an open chat can use new fixtures.
if(ctx.repo.db instanceof LocalStorage)for(const row of Object.values(ctx.repo.db.data.memberships)){
 if(row.PK.startsWith('USER#guest-')&&row.SK.startsWith('STORE#DEMO-GUEST-')&&row.value.guest===true&&row.value.dataOrigin==='MOCK'&&await ctx.repo.db.get('catalog',row.SK,'PRODUCT#BAG-001'))await seed(ctx.repo,[{sub:row.PK.slice(5),store:row.SK.slice(6)}],{storefrontIds:true});
}
await ctx.repo.db.flush();
createServer(async(req,res)=>{const origin=req.headers.origin;const cors=origin==='http://localhost:4050'?{'access-control-allow-origin':origin,'access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,POST,PUT,OPTIONS'}:{};if(req.method==='OPTIONS'){res.writeHead(204,cors);res.end();return}try{const url=new URL(req.url??'/','http://localhost:4051'),buffers=[];let size=0;for await(const chunk of req){size+=chunk.length;demand(size<=5*1024*1024,'BODY_TOO_LARGE',413);buffers.push(chunk)}const bytes=Buffer.concat(buffers);if(url.pathname.startsWith('/dev/files/')){const key=decodeURIComponent(url.pathname.slice(11)),user=req.headers.authorization?.startsWith('Bearer demo.')?(await demoSession(ctx.repo,req.headers.authorization)).subject:await subject(req.headers.authorization),store=id(key.split('/')[0]);await ctx.repo.member(user,store,req.method==='PUT');if(req.method==='PUT'){await ctx.files.put(key,bytes,String(req.headers['content-type']??''));res.writeHead(200,cors);res.end('{}');return}if(req.method==='GET'){const meta=await ctx.files.head(key);res.writeHead(200,{...cors,'content-type':meta.type});res.end(await ctx.files.get(key,20*1024*1024));return}}
 const output=await route(ctx,{method:req.method??'GET',path:url.pathname,authorization:req.headers.authorization,origin,query:Object.fromEntries(url.searchParams),body:bytes.length?JSON.parse(bytes.toString()):undefined});await ctx.repo.db.flush();res.writeHead(200,{...cors,'content-type':'application/json'});res.end(JSON.stringify(output));}catch(e){const error=safeError(e);res.writeHead(error.status,{...cors,'content-type':'application/json'});res.end(JSON.stringify(error.body))}}).listen(4051,'127.0.0.1',()=>console.log('MarginShot local API: http://localhost:4051'));
