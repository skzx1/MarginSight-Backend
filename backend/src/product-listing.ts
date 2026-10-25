import {z} from 'zod';
import {demand} from './errors.js';
import {hash,pk,type Repository} from './repository.js';

// Current merchant-entered catalog metadata, never historical order revenue/stock movements.
const fields={sellingPriceSatang:z.number().int().min(0).max(1e12).optional(),quantity:z.number().int().min(0).max(1e6).optional()};
export const productSchema=z.object({sku:z.string().regex(/^[A-Za-z0-9_.-]{1,100}$/),name:z.string().trim().min(1).max(200),unit:z.string().trim().min(1).max(40),...fields}).strict();
const listingSchema=z.object({...fields,expectedListingVersion:z.number().int().min(0).max(Number.MAX_SAFE_INTEGER)}).strict().refine(v=>v.sellingPriceSatang!==undefined||v.quantity!==undefined,{message:'LISTING_FIELDS_REQUIRED'});
export async function updateProductListing(repo:Repository,store:string,sku:string,user:string,body:unknown){
 const {expectedListingVersion,...input}=listingSchema.parse(body);
 const old=await repo.db.get('catalog',pk(store),'PRODUCT#'+sku);
 demand(old,'PRODUCT_NOT_FOUND',404);
 demand((old.value.listingVersion??0)===expectedListingVersion,'PRODUCT_CHANGED_REFRESH',409);
 const value={...old.value,...input,listingVersion:expectedListingVersion+1,listingUpdatedBy:user,listingUpdatedAt:new Date().toISOString()};
 demand(await repo.db.put('catalog',{...old,version:old.version+1,value,hash:hash(value)},old.version),'PRODUCT_CHANGED_REFRESH',409);
 return value;
}
