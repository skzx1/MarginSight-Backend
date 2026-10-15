import {z} from 'zod';
import {Repository,hash,pk} from './repository.js';
import {demand} from './errors.js';
const personalStoreSchema=z.object({name:z.string().trim().min(2).max(80).refine(v=>!/[\u0000-\u001f\u007f]/u.test(v),'INVALID_STORE_NAME')}).strict();
/** One private personal store per authenticated subject; retries never create extra tenants. */
export async function createPersonalStore(repo:Repository,user:string,body:unknown){
 const {name}=personalStoreSchema.parse(body),store='SHOP-'+hash(user),key={PK:'USER#'+user,SK:pk(store)};
 for(let attempt=0;attempt<4;attempt++){
  const existing=await repo.db.get('memberships',key.PK,key.SK);
  if(existing){demand(existing.value.personal===true&&existing.value.role==='OWNER','STORE_CREATION_CONFLICT',409);return {id:store,...existing.value}}
  const createdAt=new Date().toISOString(),value={name:name.normalize('NFC'),role:'OWNER',dataOrigin:'REAL',personal:true,createdAt};
  if(await repo.db.transact('memberships',[{row:{...key,version:1,value},expectedVersion:0},{row:{PK:pk(store),SK:'PROFILE',version:1,value:{name:value.name,owner:user,dataOrigin:'REAL',createdAt}},expectedVersion:0}]))return {id:store,...value};
 }
 throw new Error('STORE_CREATION_RETRY_REQUIRED');
}
