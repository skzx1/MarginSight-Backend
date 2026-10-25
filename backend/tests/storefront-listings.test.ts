import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Repository,pk} from '../src/repository.js';
import {LocalStorage} from '../src/storage.js';
import {seed} from '../src/seed.js';
import {createContext} from '../src/context.js';
import {route} from '../src/api.js';
import {localSession} from '../src/auth.js';
import {completeStorefrontListings} from '../src/storefront-listings.js';
process.env.LOCAL_MODE='true';process.env.AI_ENABLED='false';
const store='DEMO-GUEST-11111111-1111-4111-8111-111111111111';
const member={role:'OWNER',guest:true,dataOrigin:'MOCK'};
const expected=[['BAG-001',20000,24],['BAG-002',19900,18],['CUP-003',29900,20],['CASE-004',12900,40],['CAP-005',15900,30],['BOOK-006',8900,50],['KEY-007',5900,60]] as const;
async function fixture(){
 const db=new LocalStorage(),repo=new Repository(db);await seed(repo,[{sub:'demo-a',store}],{storefrontIds:true});
 const membership=await db.get('memberships','USER#demo-a',pk(store));await db.put('memberships',{...membership!,version:2,value:member},1);
 for(const row of (await db.query('catalog',pk(store),'PRODUCT#')).items){const value={...row.value};delete value.sellingPriceSatang;delete value.quantity;delete value.listingVersion;delete value.listingDefaultsVersion;await db.put('catalog',{...row,version:row.version+1,value},row.version);}
 const ctx=createContext(repo,{} as any,{send:async()=>{}});
 const read=()=>route(ctx,{method:'GET',path:'/stores/'+store+'/products',authorization:'Bearer '+localSession('demo-a'),query:{}});
 return {repo,db,read};
}
test('authorized old MOCK catalog receives seven explicit prices/quantities once without changing ledger, costs or unknown profit',async()=>{
 const {repo,db,read}=await fixture();
 const ledger=structuredClone(db.data.ledger),costs=await repo.catalog(store,'COST#');
 const first=await read();assert.equal(first.items.length,7);
 for(const [sku,price,quantity] of expected){const p=first.items.find((p:any)=>p.sku===sku);assert.equal(p.sellingPriceSatang,price);assert.equal(p.quantity,quantity);assert.equal(p.dataOrigin,'MOCK');assert.equal(p.profitSatang,undefined);}
 assert.equal(first.items.find((p:any)=>p.sku==='KEY-007').cost,null);
 const catalog=structuredClone(db.data.catalog);assert.deepEqual(await read(),first);assert.deepEqual(db.data.catalog,catalog);
 assert.deepEqual(db.data.ledger,ledger);assert.deepEqual(await repo.catalog(store,'COST#'),costs);
});
test('MOCK backfill preserves merchant zero/changed values, ignores merchant-created products and never writes a REAL/personal/viewer/non-guest store',async()=>{
 const {repo,db,read}=await fixture();
 const row=await db.get('catalog',pk(store),'PRODUCT#BAG-001');await db.put('catalog',{...row!,version:row!.version+1,value:{...row!.value,sellingPriceSatang:0,quantity:0,listingVersion:7}},row!.version);
 await repo.writeCatalog(store,'PRODUCT#CUSTOM',{sku:'CUSTOM',name:'Merchant item',unit:'ชิ้น',dataOrigin:'MOCK',sourceRef:'merchant-entry'},true);
 const rows=(await db.query('catalog',pk(store),'PRODUCT#')).items,before=structuredClone(db.data.catalog);
 for(const invalid of [{...member,dataOrigin:'REAL'},{...member,personal:true},{...member,guest:false},{...member,role:'VIEWER'}])assert.deepEqual(await completeStorefrontListings(repo,store,invalid,rows),rows);
 assert.deepEqual(await completeStorefrontListings(repo,'REAL-SHOP',member,rows),rows);assert.deepEqual(db.data.catalog,before);
 const actual=await read(),saved=actual.items.find((p:any)=>p.sku==='BAG-001');assert.equal(saved.sellingPriceSatang,0);assert.equal(saved.quantity,0);assert.equal(saved.listingVersion,7);
 const custom=actual.items.find((p:any)=>p.sku==='CUSTOM');assert.equal(custom.sellingPriceSatang,undefined);assert.equal(custom.quantity,undefined);
});
test('a simultaneous merchant listing edit wins over the default backfill',async()=>{
 const {repo,db}=await fixture(),row=(await db.get('catalog',pk(store),'PRODUCT#BAG-001'))!,put=db.put.bind(db);let raced=false;
 db.put=async(table,next,version)=>{if(table==='catalog'&&next.SK===row.SK&&!raced){raced=true;await put(table,{...row,version:row.version+1,value:{...row.value,sellingPriceSatang:32109,quantity:3,listingVersion:1}},row.version);}return put(table,next,version);};
 const [result]=await completeStorefrontListings(repo,store,member,[row]);assert.equal(result.value.sellingPriceSatang,32109);assert.equal(result.value.quantity,3);assert.equal(result.value.listingVersion,1);
 const stored=(await db.get('catalog',pk(store),row.SK))!;assert.deepEqual(result,stored);
});
