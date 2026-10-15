import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LocalStorage} from '../src/storage.js';
import {Repository} from '../src/repository.js';
import {seed} from '../src/seed.js';
import {demoFixture} from '../src/domain/demo-fixture.js';
import {createContext} from '../src/context.js';
import {route} from '../src/api.js';
import {localSession} from '../src/auth.js';
test('251-order dashboard aggregates every order, shows latest 50 and loads each catalog once per tenant request',async()=>{
 process.env.LOCAL_MODE='true';const db=new LocalStorage(),repo=new Repository(db);await seed(repo);const input=demoFixture();
 for(let n=0;n<250;n++){const orderId='BATCH-'+n;await repo.mergeLedger('DEMO-001','mock-market',orderId,'HEADER',{...input.order,orderId});await repo.mergeLedger('DEMO-001','mock-market',orderId,'ITEM#1',input.items[0])}
 let catalogReads=0;const query=db.query.bind(db);db.query=async(...args)=>{if(args[0]==='catalog')catalogReads++;return query(...args)};
 const ctx=createContext(repo,{} as any,{send:async()=>{}}),auth='Bearer '+localSession('demo-a');
 const result=await route(ctx,{method:'GET',path:'/stores/DEMO-001/dashboard',authorization:auth,query:{month:'2026-10'}});
 assert.equal(result.totalOrders,251);assert.equal(result.completeOrders,251);assert.equal(result.profitSatang,225900);assert.equal(result.revenueSatang,5020000);assert.equal(result.results.length,50);assert.equal(result.resultsLimit,50);assert.equal(catalogReads,3);
 await assert.rejects(()=>route(ctx,{method:'GET',path:'/stores/DEMO-002/dashboard',authorization:auth,query:{month:'2026-10'}}),/FORBIDDEN/);
});
