import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LocalStorage} from '../src/storage.js';
import {Repository,pk} from '../src/repository.js';
import {createContext} from '../src/context.js';
import {route} from '../src/api.js';
import {localSession} from '../src/auth.js';
import {seed} from '../src/seed.js';
import {calculate} from '../src/domain/calculate.js';
process.env.LOCAL_MODE='true';process.env.AI_ENABLED='false';
async function fixture(){
 const db=new LocalStorage(),repo=new Repository(db),ctx=createContext(repo,{} as any,{send:async()=>{}});
 const call=(path:string,body?:unknown,user='demo-a')=>route(ctx,{path,method:body===undefined?'GET':'POST',authorization:'Bearer '+localSession(user),query:{month:'2026-10'},body});
 await seed(repo,[{sub:'demo-a',store:'SHOP-A'},{sub:'demo-b',store:'SHOP-B'}]);
 return {repo,db,call,base:'/stores/SHOP-A'};
}
test('merchant price and quantity survive independent API reads, including zero; legacy unknown remains unknown',async()=>{
 const {repo,call,base}=await fixture();
 const created=await call(base+'/products',{sku:'NEW',name:'สินค้าใหม่',unit:'ชิ้น',sellingPriceSatang:24999,quantity:42});
 assert.equal(created.dataOrigin,'MOCK');assert.equal(created.listingVersion,1);
 const read=async()=> (await call(base+'/products')).items.find((p:any)=>p.sku==='NEW');
 assert.equal((await read()).sellingPriceSatang,24999);assert.equal((await read()).quantity,42);
 await call(base+'/products/NEW/listing',{sellingPriceSatang:0,quantity:0,expectedListingVersion:1});
 const zero=await read();assert.equal(zero.sellingPriceSatang,0);assert.equal(zero.quantity,0);assert.equal(zero.listingVersion,2);assert.equal(zero.profitSatang,undefined);
 const legacy=(await call(base+'/products')).items.find((p:any)=>p.sku==='SKU-DEMO-01');
 assert.equal(legacy.sellingPriceSatang,undefined);assert.equal(legacy.quantity,undefined);
 await call(base+'/products/SKU-DEMO-01/listing',{sellingPriceSatang:31000,expectedListingVersion:0});
 const old=await repo.db.get('catalog',pk('SHOP-A'),'PRODUCT#SKU-DEMO-01');
 assert.equal(old!.value.sellingPriceSatang,31000);assert.equal(old!.value.quantity,undefined);assert.equal(old!.value.dataOrigin,'MOCK');
});
test('price edits cannot change past sales, historical cost, ledger versions or deterministic profit',async()=>{
 const {repo,call,base}=await fixture();
 const before=await repo.input('SHOP-A','mock-market','O-DEMO-001');
 const result=calculate(before),costs=await repo.catalog('SHOP-A','COST#');
 await call(base+'/products/SKU-DEMO-01/listing',{sellingPriceSatang:999999,quantity:120,expectedListingVersion:0});
 assert.deepEqual(await repo.input('SHOP-A','mock-market','O-DEMO-001'),before);
 assert.deepEqual(await repo.catalog('SHOP-A','COST#'),costs);
 assert.deepEqual(calculate(await repo.input('SHOP-A','mock-market','O-DEMO-001')),result);
 assert.equal(result.profitSatang,900);
});
test('tenant, read-only membership, strict metadata validation and stale versions protect product updates',async()=>{
 const {repo,call,base}=await fixture();
 await call(base+'/products',{sku:'SAFE',name:'Safe',unit:'ชิ้น',sellingPriceSatang:20000,quantity:10});
 const path=base+'/products/SAFE/listing';
 await assert.rejects(()=>call(path,{quantity:1,expectedListingVersion:1},'demo-b'),/FORBIDDEN/);
 await repo.db.put('memberships',{PK:'USER#demo-b',SK:pk('SHOP-A'),version:1,value:{role:'VIEWER',dataOrigin:'MOCK'}},0);
 await assert.rejects(()=>call(path,{quantity:1,expectedListingVersion:1},'demo-b'),/FORBIDDEN/);
 for(const patch of [{sellingPriceSatang:-1},{sellingPriceSatang:1.5},{sellingPriceSatang:1e12+1},{quantity:0.5},{quantity:-1},{quantity:1e6+1},{sellingPriceSatang:null},{quantity:null},{dataOrigin:'REAL'},{profitSatang:100},{}]){
  await assert.rejects(()=>call(path,{...patch,expectedListingVersion:1}));
 }
 await assert.rejects(()=>call(path,{quantity:1}),/expectedListingVersion/);
 await assert.rejects(()=>call(base+'/products',{sku:'BAD',name:'Bad',unit:'ชิ้น',sellingPriceSatang:1.5}));
 await call(path,{quantity:0,expectedListingVersion:1});
 await assert.rejects(()=>call(path,{quantity:99,expectedListingVersion:1}),/PRODUCT_CHANGED_REFRESH/);
 const item=(await call(base+'/products')).items.find((p:any)=>p.sku==='SAFE');
 assert.equal(item.quantity,0);assert.equal(item.sellingPriceSatang,20000);
 await assert.rejects(()=>call(base+'/products/MISSING/listing',{quantity:1,expectedListingVersion:0}),/PRODUCT_NOT_FOUND/);
});
test('concurrent listing saves cannot both overwrite the same observed version',async()=>{
 const {call,base}=await fixture();
 await call(base+'/products',{sku:'RACE',name:'Race',unit:'ชิ้น'});
 const results=await Promise.allSettled([call(base+'/products/RACE/listing',{sellingPriceSatang:100,expectedListingVersion:1}),call(base+'/products/RACE/listing',{quantity:4,expectedListingVersion:1})]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 assert.equal(results.filter(r=>r.status==='rejected'&&r.reason.message==='PRODUCT_CHANGED_REFRESH').length,1);
});

test('new personal stores persist REAL listing values without mock data or invented stock/profit',async()=>{
 const {call}=await fixture();
 const store=(await call('/me/store',{name:'ร้านส่วนตัวสำหรับตรวจสอบ'})).id,base='/stores/'+store;
 assert.equal((await call(base+'/products')).items.length,0);
 await call(base+'/products',{sku:'REAL-PRICE',name:'สินค้าจริงที่ร้านกรอก',unit:'ชิ้น',sellingPriceSatang:10001});
 const [product]=(await call(base+'/products')).items;
 assert.equal(product.dataOrigin,'REAL');assert.equal(product.sellingPriceSatang,10001);assert.equal(product.quantity,undefined);assert.equal(product.profitSatang,undefined);assert.equal(product.cost,null);
 await assert.rejects(()=>call(base+'/products/REAL-PRICE/listing',{quantity:0,expectedListingVersion:1},'demo-b'),/FORBIDDEN/);
});
