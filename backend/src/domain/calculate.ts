import {Decimal} from 'decimal.js';
import {allocate,cents,percent} from './money.js';
import type {CalculationInput,Rule,Item,Cost} from './model.js';
export const FORMULA_VERSION='margin-v1.1.0';
const platformFeeTypes=new Set(['COMMISSION','TRANSACTION','PROGRAM','SERVICE','AFFILIATE','PAYMENT','PROCESSING','COMMERCE_GROWTH','PLATFORM_FEE']);
export function active(from:string,to:string|undefined,at:string){return from<=at&&(!to||at<to)}
export function selectCost(costs:Cost[],sku:string,at:string){return costs.filter(c=>c.sku===sku&&active(c.effectiveFrom,c.effectiveTo,at)&&!!c.verifiedBy).sort((a,b)=>b.effectiveFrom.localeCompare(a.effectiveFrom)||(b.createdAt??'').localeCompare(a.createdAt??'')||b.version.localeCompare(a.version))[0]}
function ruleAmount(rule:Rule,items:Item[]):number{
  const amount=(base:number,q=1)=>{
    let d=new Decimal(base).mul(rule.rateBps).div(10000).add(rule.fixedSatang);
    if(rule.minSatang!==undefined)d=Decimal.max(d,rule.minSatang);if(rule.maxSatang!==undefined)d=Decimal.min(d,rule.maxSatang);
    if(rule.vat==='EXCLUDED')d=d.mul('1.07');return cents(d)*q;
  };
  const base=(i:Item)=>rule.base==='REVENUE'?i.revenueSatang:i.buyerPaymentSatang+i.platformDiscountSatang+(rule.base==='BUYER_PLUS_PLATFORM_PLUS_SHIPPING'?(i.buyerShippingSatang??0):0);
  if(rule.scope==='PER_ORDER')return amount(items.reduce((n,i)=>n+base(i),0));
  return items.reduce((n,i)=>{if(base(i)%i.quantity!==0)throw new Error('UNIT_FEE_BASE_REQUIRES_ALLOCATION');return n+amount(base(i)/i.quantity,i.quantity)},0);
}
export function eligibleRules(input:CalculationInput){
  const at=input.order.orderAt;
  const versions=new Map<string,Rule>();for(const r of input.rules.filter(r=>active(r.effectiveFrom,r.effectiveTo,at))){const old=versions.get(r.id);if(!old||r.effectiveFrom>old.effectiveFrom||(r.effectiveFrom===old.effectiveFrom&&((r.createdAt??'')>(old.createdAt??'')||((r.createdAt??'')===(old.createdAt??'')&&r.version>old.version))))versions.set(r.id,r)}
  const selected=[...versions.values()].filter(r=>!r.programId||input.enrollments.some(e=>e.programId===r.programId&&!!e.verifiedBy&&active(e.effectiveFrom,e.effectiveTo,at)&&(e.skus.length===0||input.items.some(i=>e.skus.includes(i.sku)))));
  return selected.filter(r=>!selected.some(replacement=>replacement.replacesType===r.type&&replacement.id!==r.id&&(!replacement.sku||replacement.sku===r.sku)));
}
export function calculate(input:CalculationInput){
  const {order,items,costs}=input;if(!items.length)throw new Error('EMPTY_ORDER');
  const missing:string[]=[],excluded:string[]=[],selectedRules=eligibleRules(input);
  const actual=order.feesConfirmed&&order.settlementStatus==='SETTLED'&&!input.simulation;
  const unmappedCharges:typeof input.fees=[];
  let feeLines:{id:string;type:string;amountSatang:number;sourceRef:string;sku?:string}[]=[];
  if(actual){for(const f of input.fees){if(f.scope==='PER_MONTH'){excluded.push('monthly:'+f.feeId);continue;}if(!platformFeeTypes.has(f.type.toUpperCase())){unmappedCharges.push(f);missing.push('cash_deduction_requires_classification:'+f.feeId);continue;}feeLines.push({id:f.feeId,type:f.type,amountSatang:f.amountSatang,sourceRef:f.sourceRef,sku:f.sku})}}
  else{
    if(!selectedRules.some(r=>!r.programId))missing.push('base_fee_rules');
    for(const r of selectedRules){
      if(r.scope==='PER_MONTH'){excluded.push('monthly:'+r.id);continue;}
      if(!['MOCK','VERIFIED_FOR_ESTIMATE'].includes(r.status)||r.vat==='UNKNOWN'){missing.push('rule:'+r.id);continue;}
      let matches=items.filter(i=>!r.sku||r.sku===i.sku);
      if(r.programId)matches=matches.filter(i=>input.enrollments.some(e=>e.programId===r.programId&&active(e.effectiveFrom,e.effectiveTo,order.orderAt)&&!!e.verifiedBy&&(!e.skus.length||e.skus.includes(i.sku))));
      if(matches.length)feeLines.push({id:r.id+'@'+r.version,type:r.type,amountSatang:ruleAmount(r,matches),sourceRef:r.sourceRef,sku:r.sku});
    }
  }
  const adjustments=input.adjustments??[],revenue=items.reduce((n,i)=>n+i.revenueSatang,0)+adjustments.reduce((n,a)=>n+a.revenueDeltaSatang,0);
  const fees=feeLines.reduce((n,f)=>n+f.amountSatang,0),ads=items.reduce((n,i)=>n+i.adsSatang,0),packaging=items.reduce((n,i)=>n+i.packagingSatang,0),shipping=items.reduce((n,i)=>n+i.sellerShippingSatang,0);
  const allocated=items.map(()=>0);
  for(const f of feeLines){const targets=items.map((i,n)=>({i,n})).filter(x=>!f.sku||x.i.sku===f.sku);if(!targets.length){missing.push('unallocatable_fee:'+f.id);continue;}const parts=allocate(f.amountSatang,targets.map(x=>Math.max(0,x.i.revenueSatang)));targets.forEach((x,n)=>allocated[x.n]+=parts[n]);}
  const costsUsed=items.map(i=>{const c=selectCost(costs,i.sku,order.orderAt);if(!c)missing.push('cost:'+i.sku);return c});
  const cogs=costsUsed.some(c=>!c)?null:costsUsed.reduce((n,c,k)=>n+c!.unitCostSatang*items[k].quantity,0)+adjustments.reduce((n,a)=>n+a.cogsDeltaSatang,0);
  const profit=missing.length||cogs===null?null:revenue-fees-cogs-packaging-ads-shipping;
  if([revenue,fees,ads,packaging,shipping,cogs,profit].some(n=>n!==null&&!Number.isSafeInteger(n)))throw new Error('MONEY_OUT_OF_RANGE');
  const rawCashDeductions=fees+unmappedCharges.reduce((n,f)=>n+f.amountSatang,0);
  if(!Number.isSafeInteger(rawCashDeductions))throw new Error('MONEY_OUT_OF_RANGE');
  const payoutReconciled=order.payoutSatang===undefined||!actual?null:order.payoutSatang===revenue-rawCashDeductions;
  const origin=([order,...items,...costsUsed.filter(Boolean),...selectedRules,...input.fees,...adjustments] as {dataOrigin?:string}[]).some(x=>x.dataOrigin==='MOCK')?'MOCK':'REAL';
  return {formulaVersion:FORMULA_VERSION,orderId:order.orderId,platform:order.platform,orderAt:order.orderAt,dataOrigin:origin,
    status:missing.length?'INCOMPLETE':actual?'ACTUAL_FEES_CONFIRMED_COST':'ESTIMATED',feeStatus:actual?'ACTUAL':'ESTIMATED',
    costMethod:'MERCHANT_CONFIRMED_UNIT_COST',scope:'recorded contribution before fixed overhead and income tax',
    revenueBasis:'seller item receivable after seller discount; excludes buyer shipping',revenueSatang:revenue,feeSatang:fees,cogsSatang:cogs,packagingSatang:packaging,adsSatang:ads,sellerShippingSatang:shipping,
    profitSatang:profit,marginPct:profit===null?null:percent(profit,revenue),platformFeeRatioPct:missing.some(x=>x.startsWith('rule')||x.startsWith('cash_deduction_requires_classification')||x==='base_fee_rules')?null:percent(fees,revenue),
    ttr:{basisSatang:revenue,numeratorSatang:fees+ads,percent:missing.length?null:percent(fees+ads,revenue),included:['posted platform fees','recorded attributable ads'],excluded:['COGS','packaging','fixed overhead'],status:'DECLARED_SCOPE'},
    netItemSettlementSatang:revenue-rawCashDeductions,rawCashDeductionSatang:actual?rawCashDeductions:null,unmappedCharges,payoutBasis:actual?'item receivable minus posted item/order cash deductions, including UNMAPPED; excludes monthly charges and buyer shipping; not full bank settlement':'hypothetical item receivable minus estimated fees; not an actual payout',payoutReconciled,missingFields:[...new Set(missing)],excludedCharges:excluded,
    costCoverage:{items:costsUsed.filter(Boolean).length,totalItems:items.length},
    feeLines,items:items.map((i,k)=>({...i,allocatedFeeSatang:allocated[k],costVersion:costsUsed[k]?.version??null,unitCostSatang:costsUsed[k]?.unitCostSatang??null})),
    evidence:[order.sourceRef,...items.map(i=>i.sourceRef),...costsUsed.flatMap(c=>c?[c.sourceRef]:[]),...feeLines.map(f=>f.sourceRef),...unmappedCharges.map(f=>f.sourceRef),...adjustments.map(a=>a.sourceRef)]};
}
export function simulate(input:CalculationInput,priceSatang:number){
  if(input.items.length!==1)throw new Error('SIMULATION_REQUIRES_ONE_SKU');
  if(!Number.isSafeInteger(priceSatang)||priceSatang<0||priceSatang>1e10)throw new Error('INVALID_PRICE');
  const item=input.items[0];return calculate({...input,simulation:true,order:{...input.order,settlementStatus:'UNSETTLED',feesConfirmed:false,payoutSatang:undefined},items:[{...item,revenueSatang:priceSatang*item.quantity,buyerPaymentSatang:priceSatang*item.quantity,platformDiscountSatang:0}],adjustments:[]});
}
export function breakEven(input:CalculationInput){
  if(input.items.length!==1)throw new Error('BREAK_EVEN_REQUIRES_ONE_SKU');
  const rules=eligibleRules(input);const slopes=rules.filter(r=>r.scope!=='PER_MONTH').reduce((n,r)=>n+r.rateBps*(r.vat==='EXCLUDED'?1.07:1),0);
  if(slopes>=10000)throw new Error('NON_MONOTONIC_BREAK_EVEN_UNSUPPORTED');
  let low=0,high=10000,probe=simulate(input,high);if(probe.profitSatang===null)throw new Error('INCOMPLETE_CALCULATION');
  while(probe.profitSatang!<0&&high<1e8){high*=2;probe=simulate(input,high)}
  if(probe.profitSatang!<0)throw new Error('BREAK_EVEN_OUT_OF_RANGE');
  while(low<high){const middle=Math.floor((low+high)/2),p=simulate(input,middle).profitSatang!;if(p>=0)high=middle;else low=middle+1}
  // Individual-line rounding can create small local oscillations. Check a bounded neighbourhood.
  const start=Math.max(0,low-100);for(let p=start;p<=low+100;p++)if(simulate(input,p).profitSatang!>=0)return {priceSatang:p,calculation:simulate(input,p),method:'bounded search with line-rounding neighbourhood',rangeChecked:[start,p]};
  throw new Error('BREAK_EVEN_ROUNDING_UNSUPPORTED');
}
