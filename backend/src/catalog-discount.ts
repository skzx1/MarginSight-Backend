import {z} from 'zod';
import {Decimal} from 'decimal.js';
import {calculate,selectCost,FORMULA_VERSION} from './domain/calculate.js';
import {cents,thb} from './domain/money.js';
import type {CalculationInput,Cost,Origin} from './domain/model.js';
import {demand} from './errors.js';
import {pk,hash,type Repository} from './repository.js';

const schema=z.object({sku:z.string().regex(/^[A-Za-z0-9_.-]{1,100}$/),message:z.string().trim().min(1).max(1500),locale:z.enum(['th','en']).default('th')}).strict();
export interface CatalogDiscountScenario {
 basis:'CATALOG';store:string;at:string;sku:string;productName:string;unit:string;quantity:number;dataOrigin:Origin;notSaved:boolean;
 formulaVersion:string;listingVersion:number;costVersion:string|null;netProfitSatang:null;missingFields:string[];
 discountPct?:number;originalPriceSatang?:number;discountedPriceSatang?:number;unitCostSatang?:number|null;differenceBeforeExpensesSatang?:number|null;scope?:string;inputHash?:string;
}
export function discountPercent(message:string):number|undefined{
 const targeted=[...message.matchAll(/(?:ลด(?:ราคา)?|discount(?:\s+of)?)\s*(-?\d+(?:\.\d+)?)\s*(?:%|เปอร์(?:เซ็นต์)?|percent)/ig)].map(m=>m[1]);
 const raw=targeted.length?targeted:[...message.matchAll(/(-?\d+(?:\.\d+)?)\s*(?:%|เปอร์(?:เซ็นต์)?|percent)/ig)].map(m=>m[1]);
 if(!raw.length&&/ลด(?:ราคา)?\s*สิบห้าเปอร์/.test(message))raw.push('15');
 if(!raw.length||new Set(raw.map(v=>new Decimal(v).toString())).size!==1)return;
 const value=new Decimal(raw[0]);demand(value.gte(0)&&value.lte(100),'INVALID_DISCOUNT');return value.toNumber();
}

export async function catalogDiscount(repo:Repository,store:string,body:unknown,at=new Date().toISOString()):Promise<{provider:'deterministic-engine';answer:string;catalogScenario:CatalogDiscountScenario}>{
 const s=schema.parse(body),th=s.locale==='th',row=await repo.db.get('catalog',pk(store),'PRODUCT#'+s.sku);
 demand(row,'PRODUCT_NOT_FOUND',404);
 const p=row.value,price=z.number().int().min(0).max(1e12).safeParse(p.sellingPriceSatang);
 const pct=discountPercent(s.message),cost=selectCost(await repo.catalog<Cost>(store,'COST#'),s.sku,at);
 const context={basis:'CATALOG' as const,store,at,sku:s.sku,productName:p.name,unit:p.unit,quantity:1,dataOrigin:p.dataOrigin as Origin,notSaved:true,formulaVersion:FORMULA_VERSION,listingVersion:p.listingVersion??0,costVersion:cost?.version??null,netProfitSatang:null};
 if(pct===undefined)return {provider:'deterministic-engine',answer:th?'ต้องการลดกี่เปอร์เซ็นต์ครับ เช่น “ลดราคา 20%” ระบุส่วนลดครั้งละค่าเดียวได้เลย':'What percentage discount would you like? For example, “discount 20%”. Use one percentage at a time.',catalogScenario:{...context,missingFields:['discountPct']}};
 if(!price.success)return {provider:'deterministic-engine',answer:th?`สินค้า ${p.name} ยังไม่มีราคาขายที่บันทึกครับ เปิดรายละเอียดสินค้าแล้วกรอกราคาขายก่อน ไม่จำเป็นต้องมีออเดอร์ขาย`:`${p.name} has no recorded selling price. Enter a price in product details first; a sales order is not required.`,catalogScenario:{...context,discountPct:pct,missingFields:['sellingPriceSatang',...(!cost?['unitCostSatang']:[])]}};
 const discountedPriceSatang=cents(new Decimal(price.data).mul(new Decimal(100).sub(pct)).div(100));
 let differenceBeforeExpensesSatang:number|null=null;
 if(cost){
  const evidence={dataOrigin:p.dataOrigin as Origin,sourceRef:'hypothetical:catalog-discount:'+s.sku};
  // Explicit pre-expense comparison only. The zero-rate line excludes expenses from this measure;
  // it never asserts the store/platform has zero fees and is never saved as a fee rule or order.
  const input:CalculationInput={simulation:true,order:{...evidence,orderId:'CATALOG-COMPARISON',platform:'catalog',orderAt:at,settlementStatus:'UNSETTLED',feesConfirmed:false},
   items:[{...evidence,lineId:'1',sku:s.sku,quantity:1,revenueSatang:discountedPriceSatang,buyerPaymentSatang:discountedPriceSatang,platformDiscountSatang:0,sellerDiscountSatang:price.data-discountedPriceSatang,packagingSatang:0,adsSatang:0,sellerShippingSatang:0}],costs:[cost],fees:[],enrollments:[],
   rules:[{...evidence,id:'EXCLUDED_EXPENSES_FOR_COMPARISON_ONLY',version:'1',type:'COMPARISON_ONLY',scope:'PER_ITEM',base:'REVENUE',rateBps:0,fixedSatang:0,vat:'INCLUDED',status:'VERIFIED_FOR_ESTIMATE',effectiveFrom:at,sourceUrl:'comparison://expenses-explicitly-excluded'}]};
  differenceBeforeExpensesSatang=calculate(input).profitSatang;
 }
 const missingFields=[...(!cost?['unitCostSatang']:[]),'platformFees','packaging','advertising','sellerShipping'];
 const result={...context,discountPct:pct,originalPriceSatang:price.data,discountedPriceSatang,unitCostSatang:cost?.unitCostSatang??null,differenceBeforeExpensesSatang,missingFields,
  scope:'one unit at current catalog price/cost; difference excludes all platform fees, packaging, ads, seller shipping, overhead and taxes; not monthly sales or net profit',
  inputHash:hash({store,sku:s.sku,at,priceSatang:price.data,listingVersion:context.listingVersion,cost,pct,measure:'PRE_EXPENSE_COMPARISON',formulaVersion:FORMULA_VERSION})};
 const answer=th?`สินค้า ${p.name} · ใช้ราคากับต้นทุนสินค้าปัจจุบันต่อ 1 ${p.unit}\nลด ${pct}%: จาก ${thb(price.data)} เหลือ ${thb(discountedPriceSatang)} บาท\n`+(cost?`ต้นทุน ${thb(cost.unitCostSatang)} บาท · ส่วนต่างก่อนค่าใช้จ่ายอื่น ${thb(differenceBeforeExpensesSatang!)} บาท\n`:'ยังไม่ระบุต้นทุน จึงยังหาส่วนต่างไม่ได้\n')+'ยังไม่ใช่กำไรสุทธิ: ยังไม่รวมค่าธรรมเนียมแพลตฟอร์ม แพ็ก โฆษณา ค่าส่ง ค่าใช้จ่ายประจำและภาษี ข้อมูลที่ไม่มียังไม่ถือเป็นศูนย์\nเป็นการลองราคาสินค้า ไม่เปลี่ยนราคาจริง และไม่รวมเป็นกำไรเดือนนี้'
  :`${p.name} · current catalog price and cost for one ${p.unit}\n${pct}% discount: THB ${thb(price.data)} → ${thb(discountedPriceSatang)}\n`+(cost?`Cost THB ${thb(cost.unitCostSatang)} · difference before other expenses THB ${thb(differenceBeforeExpensesSatang!)}\n`:'Cost is missing, so the difference is unknown.\n')+'This is not net profit: platform fees, packaging, advertising, seller shipping, overhead and taxes are excluded; unknown expenses are not zero.\nThis price comparison does not change the listed price or monthly recorded sales.';
 return {provider:'deterministic-engine',answer,catalogScenario:result};
}
