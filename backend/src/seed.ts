import type {Repository} from './repository.js';
import {pk} from './repository.js';
export const mockEvidence={dataOrigin:'MOCK' as const,sourceRef:'mock-v1:independently-checked-fixture'};
export function mockRules(){return [
 {id:'commission',type:'COMMISSION',rateBps:1200}, {id:'transaction',type:'TRANSACTION',rateBps:800}, {id:'campaign',type:'PROGRAM',rateBps:300,programId:'DEMO-PROGRAM'}
].map(r=>({...mockEvidence,...r,version:'2026-01-01-v1',scope:'PER_ITEM' as const,base:'REVENUE' as const,fixedSatang:0,vat:'INCLUDED' as const,status:'MOCK' as const,effectiveFrom:'2026-01-01T00:00:00.000Z',sourceUrl:'mock://not-a-marketplace-rate'}))}
export const storefrontProducts=[
 {sku:'BAG-002',name:'กระเป๋าสะพายผ้าแคนวาส',unit:'ใบ',unitCostSatang:9500},
 {sku:'CUP-003',name:'แก้วเก็บความเย็น 600 มล.',unit:'ใบ',unitCostSatang:14500},
 {sku:'CASE-004',name:'เคสโทรศัพท์ใสกันกระแทก',unit:'ชิ้น',unitCostSatang:4500},
 {sku:'CAP-005',name:'หมวกแก๊ปผ้าคอตตอน',unit:'ใบ',unitCostSatang:7000},
 {sku:'BOOK-006',name:'สมุดโน้ตปกแข็ง A5',unit:'เล่ม',unitCostSatang:3800}
] as const;
// Posted synthetic sales/fees, independently specified in satang; not marketplace rates.
const storefrontSales=[
 {sku:'BAG-002',orderId:'ORDER-002',day:'15',revenueSatang:19900,commission:2388,transaction:1592,packagingSatang:500,adsSatang:500},
 {sku:'CUP-003',orderId:'ORDER-003',day:'16',revenueSatang:29900,commission:3588,transaction:2392,packagingSatang:700,adsSatang:1000},
 {sku:'CASE-004',orderId:'ORDER-004',day:'17',revenueSatang:12900,commission:1548,transaction:1032,packagingSatang:300,adsSatang:500},
 {sku:'CAP-005',orderId:'ORDER-005',day:'18',revenueSatang:15900,commission:1908,transaction:1272,packagingSatang:500,adsSatang:500},
 {sku:'BOOK-006',orderId:'ORDER-006',day:'19',revenueSatang:8900,commission:1068,transaction:712,packagingSatang:300,adsSatang:0}
] as const;
export async function seed(repo:Repository,users=[{sub:'demo-a',store:'DEMO-001'},{sub:'demo-b',store:'DEMO-002'}],options:{storefrontIds?:boolean}={}){
 // Friendly identifiers for new guest stores; legacy fixtures remain compatible.
 const sku=options.storefrontIds?'BAG-001':'SKU-DEMO-01',programId=options.storefrontIds?'STORE-PROGRAM':'DEMO-PROGRAM';
 const ensure=async(store:string,key:string,value:any)=>{if(await repo.db.get('catalog',pk(store),key))return;try{await repo.writeCatalog(store,key,value,true)}catch(e){if(!await repo.db.get('catalog',pk(store),key))throw e}};
 const ensureLedger=async(store:string,platform:string,orderId:string,key:string,value:any)=>{if(!await repo.db.get('ledger',pk(store)+'#ORDER#'+platform+'#'+orderId,key))await repo.mergeLedger(store,platform,orderId,key,value)};
 for(const u of users){await repo.db.put('memberships',{PK:'USER#'+u.sub,SK:pk(u.store),version:1,value:{role:'OWNER',name:u.store==='DEMO-002'?'ร้านสาขา B':'ร้าน MarginShot',dataOrigin:'MOCK'}},0);
  await ensure(u.store,'PRODUCT#'+sku,{...mockEvidence,sku,name:'กระเป๋าผ้าแคนวาส',unit:'ชิ้น'});
  const pendingSku=options.storefrontIds?'KEY-007':'SKU-MISSING-COST';
  await ensure(u.store,'PRODUCT#'+pendingSku,{...mockEvidence,sku:pendingSku,name:'พวงกุญแจผ้าทอ',unit:'ชิ้น'});
  await ensure(u.store,'COST#'+sku+'#2026-01-01T00:00:00.000Z#v1',{...mockEvidence,sourceRef:'mock supplier bill: 6 units / 780 THB',sku,version:'2026-01-01-v1',unitCostSatang:13000,effectiveFrom:'2026-01-01T00:00:00.000Z',verifiedBy:u.sub,method:'MERCHANT_CONFIRMED_UNIT_COST'});
  for(const product of storefrontProducts){
   const {unitCostSatang,...details}=product;
   await ensure(u.store,'PRODUCT#'+product.sku,{...mockEvidence,...details});
   await ensure(u.store,'COST#'+product.sku+'#2026-01-01T00:00:00.000Z#v1',{...mockEvidence,sourceRef:'mock-catalog-cost:'+product.sku,sku:product.sku,version:'2026-01-01-v1',unitCostSatang,effectiveFrom:'2026-01-01T00:00:00.000Z',verifiedBy:u.sub,method:'MERCHANT_CONFIRMED_UNIT_COST'});
  }
  for(const rule of mockRules()){const r=rule.programId?{...rule,programId}:rule;await ensure(u.store,'RULE#'+r.id+'#'+r.version,r)}
  await ensure(u.store,'ENROLL#'+programId+'#v1',{...mockEvidence,id:'enrollment-v1',programId,effectiveFrom:'2026-01-01T00:00:00.000Z',skus:[sku],verifiedBy:u.sub});
  const platform='mock-market',orderId=options.storefrontIds?'ORDER-001':'O-DEMO-001',at='2026-10-14T05:00:00.000Z';
  const initialHeader=await repo.db.get('ledger',pk(u.store)+'#ORDER#'+platform+'#'+orderId,'HEADER');
  await ensureLedger(u.store,platform,orderId,'HEADER',{...mockEvidence,platform,orderId,orderAt:at,settlementStatus:'SETTLED',feesConfirmed:true,payoutSatang:15400});
  await ensureLedger(u.store,platform,orderId,'ITEM#1',{...mockEvidence,lineId:'1',sku,quantity:1,revenueSatang:20000,buyerPaymentSatang:20000,platformDiscountSatang:0,sellerDiscountSatang:0,packagingSatang:500,adsSatang:1000,sellerShippingSatang:0});
  for(const [feeId,type,amount] of [['c1','COMMISSION',2400],['t1','TRANSACTION',1600],['p1','PROGRAM',600]] as const)await ensureLedger(u.store,platform,orderId,'FEE#'+feeId,{...mockEvidence,feeId,type,amountSatang:amount,scope:'PER_ITEM',sku,effectiveAt:at});
  if(!initialHeader)await repo.confirmFees(u.store,platform,orderId);
  if(options.storefrontIds)for(const sale of storefrontSales){
   const orderAt=`2026-10-${sale.day}T05:00:00.000Z`,evidence={...mockEvidence,sourceRef:'mock-storefront-sale:'+sale.orderId};
   const existing=await repo.db.get('ledger',pk(u.store)+'#ORDER#'+platform+'#'+sale.orderId,'HEADER');
   await ensureLedger(u.store,platform,sale.orderId,'HEADER',{...evidence,platform,orderId:sale.orderId,orderAt,settlementStatus:'SETTLED',feesConfirmed:true,payoutSatang:sale.revenueSatang-sale.commission-sale.transaction});
   await ensureLedger(u.store,platform,sale.orderId,'ITEM#1',{...evidence,lineId:'1',sku:sale.sku,quantity:1,revenueSatang:sale.revenueSatang,buyerPaymentSatang:sale.revenueSatang,platformDiscountSatang:0,sellerDiscountSatang:0,packagingSatang:sale.packagingSatang,adsSatang:sale.adsSatang,sellerShippingSatang:0});
   for(const [feeId,type,amountSatang] of [['commission','COMMISSION',sale.commission],['transaction','TRANSACTION',sale.transaction]] as const)await ensureLedger(u.store,platform,sale.orderId,'FEE#'+feeId,{...evidence,feeId,type,amountSatang,scope:'PER_ITEM',sku:sale.sku,effectiveAt:orderAt});
   if(!existing)await repo.confirmFees(u.store,platform,sale.orderId);
  }
 }
 await repo.db.flush();
}
