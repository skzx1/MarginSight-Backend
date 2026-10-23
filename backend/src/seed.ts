import type {Repository} from './repository.js';
import {pk} from './repository.js';
export const mockEvidence={dataOrigin:'MOCK' as const,sourceRef:'mock-v1:independently-checked-fixture'};
export function mockRules(){return [
 {id:'commission',type:'COMMISSION',rateBps:1200}, {id:'transaction',type:'TRANSACTION',rateBps:800}, {id:'campaign',type:'PROGRAM',rateBps:300,programId:'DEMO-PROGRAM'}
].map(r=>({...mockEvidence,...r,version:'2026-01-01-v1',scope:'PER_ITEM' as const,base:'REVENUE' as const,fixedSatang:0,vat:'INCLUDED' as const,status:'MOCK' as const,effectiveFrom:'2026-01-01T00:00:00.000Z',sourceUrl:'mock://not-a-marketplace-rate'}))}
export async function seed(repo:Repository,users=[{sub:'demo-a',store:'DEMO-001'},{sub:'demo-b',store:'DEMO-002'}]){
 const ensure=async(store:string,key:string,value:any)=>{if(await repo.db.get('catalog',pk(store),key))return;try{await repo.writeCatalog(store,key,value,true)}catch(e){if(!await repo.db.get('catalog',pk(store),key))throw e}};
 const ensureLedger=async(store:string,platform:string,orderId:string,key:string,value:any)=>{if(!await repo.db.get('ledger',pk(store)+'#ORDER#'+platform+'#'+orderId,key))await repo.mergeLedger(store,platform,orderId,key,value)};
 for(const u of users){await repo.db.put('memberships',{PK:'USER#'+u.sub,SK:pk(u.store),version:1,value:{role:'OWNER',name:u.store==='DEMO-001'?'ร้านสาธิต MarginShot':'ร้านทดสอบสิทธิ์ B',dataOrigin:'MOCK'}},0);
  await ensure(u.store,'PRODUCT#SKU-DEMO-01',{...mockEvidence,sku:'SKU-DEMO-01',name:'กระเป๋าผ้า รุ่นสาธิต',unit:'ชิ้น'});
  await ensure(u.store,'PRODUCT#SKU-MISSING-COST',{...mockEvidence,sku:'SKU-MISSING-COST',name:'สินค้าที่ยังไม่มีต้นทุน',unit:'ชิ้น'});
  await ensure(u.store,'COST#SKU-DEMO-01#2026-01-01T00:00:00.000Z#v1',{...mockEvidence,sourceRef:'mock supplier bill: 6 units / 780 THB',sku:'SKU-DEMO-01',version:'2026-01-01-v1',unitCostSatang:13000,effectiveFrom:'2026-01-01T00:00:00.000Z',verifiedBy:u.sub,method:'MERCHANT_CONFIRMED_UNIT_COST'});
  for(const r of mockRules())await ensure(u.store,'RULE#'+r.id+'#'+r.version,r);
  await ensure(u.store,'ENROLL#DEMO-PROGRAM#v1',{...mockEvidence,id:'enrollment-v1',programId:'DEMO-PROGRAM',effectiveFrom:'2026-01-01T00:00:00.000Z',skus:['SKU-DEMO-01'],verifiedBy:u.sub});
  const platform='mock-market',orderId='O-DEMO-001',at='2026-10-14T05:00:00.000Z';
  const initialHeader=await repo.db.get('ledger',pk(u.store)+'#ORDER#'+platform+'#'+orderId,'HEADER');
  await ensureLedger(u.store,platform,orderId,'HEADER',{...mockEvidence,platform,orderId,orderAt:at,settlementStatus:'SETTLED',feesConfirmed:true,payoutSatang:15400});
  await ensureLedger(u.store,platform,orderId,'ITEM#1',{...mockEvidence,lineId:'1',sku:'SKU-DEMO-01',quantity:1,revenueSatang:20000,buyerPaymentSatang:20000,platformDiscountSatang:0,sellerDiscountSatang:0,packagingSatang:500,adsSatang:1000,sellerShippingSatang:0});
  for(const [feeId,type,amount] of [['c1','COMMISSION',2400],['t1','TRANSACTION',1600],['p1','PROGRAM',600]] as const)await ensureLedger(u.store,platform,orderId,'FEE#'+feeId,{...mockEvidence,feeId,type,amountSatang:amount,scope:'PER_ITEM',sku:'SKU-DEMO-01',effectiveAt:at});
  if(!initialHeader)await repo.confirmFees(u.store,platform,orderId);
 }
 await repo.db.flush();
}
