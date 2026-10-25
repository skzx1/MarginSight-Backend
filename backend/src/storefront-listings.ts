import {hash,pk,type Repository} from './repository.js';
import type {Row} from './storage.js';

export const STOREFRONT_FIXTURE_SOURCE='mock-v1:independently-checked-fixture';
export const STOREFRONT_LISTING_VERSION='mock-storefront-listings-v1';
// Explicit synthetic catalog values, independent of recorded sales and stock movements.
const listings=new Map<string,{sellingPriceSatang:number;quantity:number}>([
 ['BAG-001',{sellingPriceSatang:20000,quantity:24}],
 ['BAG-002',{sellingPriceSatang:19900,quantity:18}],
 ['CUP-003',{sellingPriceSatang:29900,quantity:20}],
 ['CASE-004',{sellingPriceSatang:12900,quantity:40}],
 ['CAP-005',{sellingPriceSatang:15900,quantity:30}],
 ['BOOK-006',{sellingPriceSatang:8900,quantity:50}],
 ['KEY-007',{sellingPriceSatang:5900,quantity:60}]
]);
export function storefrontListing(sku:string){
 const defaults=listings.get(sku);
 return defaults?{...defaults,listingVersion:1,listingDefaultsVersion:STOREFRONT_LISTING_VERSION}:{};
}

// Bounded, idempotent migration on an already-authorized guest catalog read. Never seed a REAL store.
export async function completeStorefrontListings(repo:Repository,store:string,membership:{guest?:boolean;personal?:boolean;dataOrigin?:string;role?:string},rows:Row[]):Promise<Row[]>{
 if(!/^DEMO-GUEST-[a-f0-9-]{36}$/.test(store)||membership.guest!==true||membership.personal===true||membership.dataOrigin!=='MOCK'||membership.role!=='OWNER')return rows;
 return Promise.all(rows.map(async row=>{
  const product=row.value,defaults=listings.get(product.sku);
  if(!defaults||row.PK!==pk(store)||row.SK!=='PRODUCT#'+product.sku||product.dataOrigin!=='MOCK'||product.sourceRef!==STOREFRONT_FIXTURE_SOURCE)return row;
  const missing={...(product.sellingPriceSatang==null?{sellingPriceSatang:defaults.sellingPriceSatang}:{}),...(product.quantity==null?{quantity:defaults.quantity}:{})};
  if(!Object.keys(missing).length)return row;
  const value={...product,...missing,listingVersion:(product.listingVersion??0)+1,listingDefaultsVersion:STOREFRONT_LISTING_VERSION,listingDefaultedAt:new Date().toISOString()};
  const updated={...row,version:row.version+1,value,hash:hash(value)};
  if(await repo.db.put('catalog',updated,row.version))return updated;
  // A simultaneous merchant edit wins. Return current data without overwriting it.
  return await repo.db.get('catalog',row.PK,row.SK)??row;
 }));
}
