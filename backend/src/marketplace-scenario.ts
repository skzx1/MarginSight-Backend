import {z} from 'zod';
import type {CalculationInput,Rule} from './domain/model.js';
import {demand} from './errors.js';

const shopee='https://shopee.co.th/m/PRIME-Seller-Program';
const lazada='https://university.lazada.co.th/course/learn?id=42106&type=article';
const tiktok='https://seller-th.tiktok.com/university/essay?knowledge_id=';
export const marketplaceOptions={version:'marketplace-scenario-2026-10-18',reviewedAt:'2026-10-18',platforms:[
 {id:'shopee',name:'Shopee',categories:[{id:'general',name:'แฟชั่น / ไลฟ์สไตล์ / อุปโภคบริโภค / อื่น ๆ'},{id:'electronics',name:'อิเล็กทรอนิกส์ — ยืนยันอัตราหมวดย่อย'},{id:'investment_metals',name:'แพลทินัมและทองเพื่อการลงทุน'},{id:'fine_jewelry',name:'เครื่องประดับที่มีมูลค่า'}],campaigns:[
  {id:'shopee-prime',name:'PRIME Seller / ร้านโค้ดคุ้ม',sourceUrl:shopee,note:'6–8% ก่อน VAT ตามหมวด; อิเล็กทรอนิกส์ต้องยืนยัน 7% หรือ 8%',effectiveFrom:'2026-03-03'},
  {id:'shopee-live',name:'LiveXtra',sourceUrl:'https://help.shopee.co.th/portal/4/article/178713',note:'เงื่อนไขเผยแพร่ 29 พ.ค. 2568: 2% หรือ 3% ก่อน VAT ตามสิทธิ์ ต้องยืนยันกับร้าน',effectiveFrom:'2025-05-29'}]},
 {id:'lazada',name:'Lazada',categories:[{id:'general',name:'ใช้หมวดและอัตราคอมมิชชั่นที่ร้านยืนยัน'}],campaigns:[
  {id:'lazada-premium',name:'Premium Package',sourceUrl:lazada,note:'8% ก่อน VAT; รวมส่งฟรีพิเศษและคูปองแคมเปญแล้ว ไม่บวกซ้ำ',effectiveFrom:'2026-08-01'}]},
 {id:'tiktok',name:'TikTok Shop',categories:[{id:'general',name:'สินค้านอกกลุ่มอิเล็กทรอนิกส์'},{id:'electronics',name:'อิเล็กทรอนิกส์'}],campaigns:[
  {id:'tiktok-bcd',name:'Brand Crazy Deals',sourceUrl:tiktok+'7498481985029905&lang=en',note:'3.21% รวม VAT; สินค้าชิ้นเดียวเลือก BCD หรือ Flash Sale อย่างใดอย่างหนึ่ง',effectiveFrom:'2025-01-01'},
  {id:'tiktok-flash',name:'Flash Sales',sourceUrl:tiktok+'7498481985029905&lang=en',note:'3.21% รวม VAT; ไม่คิดซ้ำกับ BCD ในสินค้าชิ้นเดียว',effectiveFrom:'2025-01-01'}]}
]};
const rate=z.number().int().min(0).max(10000).nullable();
export const marketplaceScenarioSchema=z.object({
 platform:z.enum(['shopee','lazada','tiktok']),category:z.enum(['general','electronics','investment_metals','fine_jewelry']),
 sellerType:z.enum(['NON_MALL','MALL']),campaigns:z.array(z.string().max(40)).max(3),
 commissionRateBps:rate,commissionVat:z.enum(['INCLUDED','EXCLUDED','UNKNOWN']),
 paymentRateBps:rate,paymentBase:z.enum(['REVENUE','BUYER_PLUS_PLATFORM','BUYER_PLUS_PLATFORM_PLUS_SHIPPING']),
 buyerShippingSatang:z.number().int().min(0).max(10000000),fixedFeeExempt:z.boolean(),
 growthTier:z.enum(['STANDARD','SMALL','WAIVED']),primeElectronicsRateBps:z.union([z.literal(700),z.literal(800)]).nullable(),
 liveRateBps:z.union([z.literal(200),z.literal(300)]).nullable(),
 confirmed:z.literal(true)
}).strict().superRefine((s,ctx)=>{
 const p=marketplaceOptions.platforms.find(p=>p.id===s.platform)!;
 if(!p.categories.some(c=>c.id===s.category))ctx.addIssue({code:'custom',message:'CATEGORY_PLATFORM_MISMATCH'});
 if(new Set(s.campaigns).size!==s.campaigns.length||s.campaigns.some(id=>!p.campaigns.some(c=>c.id===id)))ctx.addIssue({code:'custom',message:'CAMPAIGN_PLATFORM_MISMATCH'});
 if(s.campaigns.includes('tiktok-bcd')&&s.campaigns.includes('tiktok-flash'))ctx.addIssue({code:'custom',message:'BCD_FLASH_MUTUALLY_EXCLUSIVE'});
 if(s.sellerType==='MALL'&&s.growthTier==='SMALL')ctx.addIssue({code:'custom',message:'SMALL_SELLER_REQUIRES_NON_MALL'});
});
export type MarketplaceScenario=z.infer<typeof marketplaceScenarioSchema>;

/** A temporary scenario, never persisted as enrollment, ledger or platform access. */
export function marketplaceInput(source:CalculationInput,selection:MarketplaceScenario){
 const s=marketplaceScenarioSchema.parse(selection),input=structuredClone(source),at=input.order.orderAt;
 demand(input.items.length===1,'SIMULATION_REQUIRES_ONE_SKU');
 demand(Number.isSafeInteger(input.items[0].quantity)&&input.items[0].quantity>0&&input.items[0].revenueSatang>=0,'SCENARIO_REQUIRES_POSITIVE_QUANTITY');
 const originalPlatform=input.order.platform;
 input.order={...input.order,platform:s.platform,settlementStatus:'UNSETTLED',feesConfirmed:false,payoutSatang:undefined};
 input.simulation=true;input.fees=[];input.adjustments=[];input.rules=[];input.enrollments=[];
 input.items[0].buyerShippingSatang=s.buyerShippingSatang;
 const manual='merchant-confirmed scenario assumption; not a verified platform rate';
 const add=(id:string,type:string,bps:number|null,vat:Rule['vat'],base:Rule['base'],url:string,from:string,program=false,fixed=0,max?:number)=>{
  const supported=at.slice(0,10)>=from&&bps!==null&&vat!=='UNKNOWN';
  input.rules.push({id:'scenario-'+id,version:marketplaceOptions.version,type,rateBps:bps??0,fixedSatang:fixed,scope:['fixed','payment','shopee-live'].includes(id)?'PER_ORDER':'PER_ITEM',base,vat,status:supported?'VERIFIED_FOR_ESTIMATE':'UNVERIFIED',effectiveFrom:at,sourceRef:(program?'program rate / hypothetical participation: ':'merchant-confirmed scenario base fee: ')+url,sourceUrl:url,dataOrigin:input.order.dataOrigin,...(program?{programId:id}:{}),...(max===undefined?{}:{maxSatang:max})});
  if(program)input.enrollments.push({id:'scenario-'+id,programId:id,effectiveFrom:at,skus:[input.items[0].sku],verifiedBy:'merchant-confirmed hypothetical choice',sourceRef:'not saved; does not join platform program',dataOrigin:input.order.dataOrigin});
 };
 const policy=s.platform==='shopee'?'https://help.shopee.co.th/portal/4/article/77254':s.platform==='lazada'?lazada:tiktok+'6837808312370945&lang=en';
 add('commission','COMMISSION',s.commissionRateBps,s.commissionVat,'REVENUE',policy+'#merchant-assumption','0000-01-01');
 add('payment','TRANSACTION',s.paymentRateBps,'INCLUDED',s.paymentBase,policy+'#merchant-payment-assumption','0000-01-01');
 if(s.platform!=='lazada')add('fixed','PLATFORM_FEE',0,'INCLUDED','REVENUE',s.platform==='shopee'?'https://help.shopee.co.th/portal/4/article/77254':tiktok+'4832028500215569&lang=en','2025-10-01',false,s.fixedFeeExempt?0:107);
 if(s.platform==='tiktok'){
  const growth=s.growthTier==='WAIVED'?0:s.growthTier==='SMALL'?(s.category==='electronics'?642:749):(s.category==='electronics'?696:803);
  add('growth','COMMERCE_GROWTH',growth,'INCLUDED','REVENUE',tiktok+'4831419884979969&lang=en','2026-05-06',false,0,19900);
 }
 for(const id of s.campaigns){
  const campaign=marketplaceOptions.platforms.flatMap(p=>p.campaigns).find(c=>c.id===id)!;
  const bps=id==='shopee-prime'?(s.category==='electronics'?s.primeElectronicsRateBps:s.category==='investment_metals'?600:s.category==='fine_jewelry'?700:800):id==='shopee-live'?s.liveRateBps:id==='lazada-premium'?800:321;
  add(id,'PROGRAM',bps,id.startsWith('tiktok-')?'INCLUDED':'EXCLUDED',id==='shopee-live'?'BUYER_PLUS_PLATFORM_PLUS_SHIPPING':'REVENUE',campaign.sourceUrl,campaign.effectiveFrom,true);
 }
 return {input,context:{version:marketplaceOptions.version,platform:s.platform,category:s.category,campaigns:s.campaigns,sourcePlatform:originalPlatform,sourceOrderId:source.order.orderId,sourceOrderAt:at,assumption:manual,selection:s,notSaved:true,scope:'hypothetical sale of selected SKU using its latest single-SKU order in selected month; not actual platform enrollment or payout'}};
}
