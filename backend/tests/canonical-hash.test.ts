import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {hash,Repository,orderPk} from '../src/repository.js';
import {LocalStorage} from '../src/storage.js';
test('unordered database maps and legacy hashes do not create duplicate financial records or conflicts',async()=>{
 assert.equal(hash({a:1,b:{c:2,d:3}}),hash({b:{d:3,c:2},a:1}));
 const db=new LocalStorage(),repo=new Repository(db),original={feeId:'F1',amountSatang:100,dataOrigin:'MOCK',sourceRef:'old'};
 await db.put('ledger',{PK:orderPk('TEST','mock','O1'),SK:'FEE#F1',version:1,value:{sourceRef:'old',dataOrigin:'MOCK',amountSatang:100,feeId:'F1'},hash:createHash('sha256').update(JSON.stringify(original)).digest('hex')},0);
 assert.equal(await repo.mergeLedger('TEST','mock','O1','FEE#F1',{...original,sourceRef:'overlap'}),'duplicate');
 await repo.mergeCatalog('TEST','PRODUCT#A',{sku:'A',name:'MOCK',unit:'piece',dataOrigin:'MOCK',sourceRef:'one'});
 assert.equal(await repo.mergeCatalog('TEST','PRODUCT#A',{unit:'piece',name:'MOCK',sku:'A',sourceRef:'two',dataOrigin:'MOCK'}),'duplicate');
 assert.equal((await repo.conflicts('TEST')).length,0);
 const header={platform:'mock',orderId:'O2',orderAt:'2026-10-14T00:00:00.000Z',settlementStatus:'UNSETTLED',feesConfirmed:false,dataOrigin:'MOCK'};
 await db.put('ledger',{PK:orderPk('TEST','mock','O2'),SK:'HEADER',version:2,value:{...header,settlementStatus:'SETTLED',feesConfirmed:true,payoutSatang:100},hash:createHash('sha256').update(JSON.stringify(header)).digest('hex')},0);
 assert.equal(await repo.mergeLedger('TEST','mock','O2','HEADER',header),'duplicate');
 assert.equal((await db.get('ledger',orderPk('TEST','mock','O2'),'HEADER'))?.value.feesConfirmed,true);
 assert.equal(hash(Buffer.from('abc')),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
