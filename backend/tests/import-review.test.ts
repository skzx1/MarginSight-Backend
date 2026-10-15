import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LocalStorage} from '../src/storage.js';
import {Repository,pk,orderPk} from '../src/repository.js';
import {Importer} from '../src/importer.js';
import {ruleSchema} from '../src/schemas.js';
import {demoFixture} from '../src/domain/demo-fixture.js';
const importer=(repo:Repository)=>new Importer(repo,{} as any,{send:async()=>{}});
test('partial imports stay out of financial inputs until explicit audited review',async()=>{
 const repo=new Repository(new LocalStorage()),job=await repo.createJob('TEST',{status:'PARTIAL',kind:'costs',errors:[{row:3,code:'INVALID_AMOUNT'}]});
 await repo.mergeCatalog('TEST','COST#SKU-DEMO-01#v1',{...demoFixture().costs[0],importId:job.id});
 assert.equal((await repo.catalog('TEST','COST#')).length,0);
 await importer(repo).review('TEST',job.id,'owner','Checked original receipt; excluded invalid row 3');
 assert.equal((await repo.catalog('TEST','COST#')).length,1);
 const reviewed=(await repo.job('TEST',job.id)).value;assert.equal(reviewed.hadImportErrors,true);assert.equal(reviewed.review.excludedRows[0].row,3);
});
test('conflicting transaction revision requires review, preserves original and is idempotent',async()=>{
 const repo=new Repository(new LocalStorage()),job=await repo.createJob('TEST',{status:'PARTIAL',errors:[]}),key='FEE#F1';
 const original={feeId:'F1',amountSatang:100,dataOrigin:'MOCK',sourceRef:'old'};
 await repo.mergeLedger('TEST','mock','O1',key,original);await repo.mergeLedger('TEST','mock','O1',key,{...original,amountSatang:101,sourceRef:'new',importId:job.id});
 await assert.rejects(()=>importer(repo).review('TEST',job.id,'owner','Checked all report rows'),/UNRESOLVED_IMPORT_CONFLICTS/);
 const conflict=(await repo.conflicts('TEST'))[0];await repo.resolveConflict('TEST',conflict.id,'owner','USE_INCOMING','Verified corrected statement amount of 1.01');
 await repo.resolveConflict('TEST',conflict.id,'owner','USE_INCOMING','Repeated request is safe');
 const current=await repo.db.get('ledger',orderPk('TEST','mock','O1'),key);assert.equal(current?.value.amountSatang,101);assert.equal(current?.version,2);
 const audit=await repo.db.get('ledger',orderPk('TEST','mock','O1'),'REVISION#FEE#F1#1');assert.equal(audit?.value.original.amountSatang,100);
 await importer(repo).review('TEST',job.id,'owner','Checked corrected statement and all rows');
 assert.equal(await repo.mergeLedger('TEST','mock','O1',key,{...original,amountSatang:101,sourceRef:'overlap',importId:job.id}),'duplicate');
 assert.equal((await repo.db.get('jobs',pk('TEST'),'CONFLICT#'+conflict.id))?.value.resolution.choice,'USE_INCOMING');
});
test('mock rule cannot be presented as real and reversed effective date is rejected',()=>{
 const r=demoFixture().rules[0];assert.equal(ruleSchema.safeParse({...r,dataOrigin:'REAL',status:'MOCK'}).success,false);
 assert.equal(ruleSchema.safeParse({...r,effectiveTo:'2000-01-01T00:00:00.000Z'}).success,false);
});
test('cost correction creates a distinct immutable version and repeated report is duplicate',async()=>{
 const repo=new Repository(new LocalStorage()),key='COST#SKU-DEMO-01#original',cost=demoFixture().costs[0];
 await repo.mergeCatalog('TEST',key,cost);await repo.mergeCatalog('TEST',key,{...cost,unitCostSatang:14000});
 const conflict=(await repo.conflicts('TEST'))[0];await repo.resolveConflict('TEST',conflict.id,'owner','USE_INCOMING','Verified corrected original supplier cost');
 assert.equal((await repo.db.get('catalog',pk('TEST'),key))?.value.unitCostSatang,13000);
 const versions=await repo.catalog<any>('TEST','COST#');assert.equal(versions.length,2);assert.equal(new Set(versions.map(c=>c.version)).size,2);assert.equal(versions.find(c=>c.resolutionId===conflict.id)?.unitCostSatang,14000);
 assert.equal(await repo.mergeCatalog('TEST',key,{...cost,unitCostSatang:14000,sourceRef:'overlapping report'}),'duplicate');
});
