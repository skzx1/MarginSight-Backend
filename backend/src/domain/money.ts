import {Decimal} from 'decimal.js';
Decimal.set({precision:30,rounding:Decimal.ROUND_HALF_UP});
export function satang(text:unknown,allowNegative=false):number {
  const s=String(text??'').trim();
  if(!(allowNegative?/^-?\d+(\.\d{1,2})?$/:/^\d+(\.\d{1,2})?$/).test(s))throw new Error('INVALID_MONEY');
  const n=new Decimal(s).mul(100).toNumber();
  if(!Number.isSafeInteger(n)||Math.abs(n)>1e12)throw new Error('MONEY_OUT_OF_RANGE');return n;
}
export function cents(n:Decimal.Value):number {const v=new Decimal(n).toDecimalPlaces(0).toNumber();if(!Number.isSafeInteger(v)||Math.abs(v)>1e12)throw new Error('MONEY_OUT_OF_RANGE');return v;}
export function percent(n:number,d:number):number|null{return d===0?null:new Decimal(n).div(d).mul(100).toDecimalPlaces(2).toNumber();}
export function thb(n:number):string{return new Decimal(n).div(100).toFixed(2);}
/** Largest remainders: total preserves sign and reconciles exactly; ties are input order. */
export function allocate(total:number,weights:number[]):number[]{
  if(!Number.isSafeInteger(total)||weights.some(w=>!Number.isSafeInteger(w)||w<0))throw new Error('INVALID_ALLOCATION');
  if(!weights.length){if(total)throw new Error('NO_ALLOCATION_TARGET');return []}
  const w=weights.some(x=>x>0)?weights:weights.map(()=>1);const sum=w.reduce((a,b)=>a+b,0),sign=total<0?-1:1;
  const shares=w.map((x,i)=>{const exact=new Decimal(Math.abs(total)).mul(x).div(sum);return {i,n:exact.floor().toNumber(),r:exact.mod(1)}});
  let remain=Math.abs(total)-shares.reduce((a,b)=>a+b.n,0);
  for(const share of [...shares].sort((a,b)=>b.r.cmp(a.r)||a.i-b.i)){if(remain--<=0)break;share.n++}
  return shares.map(x=>x.n*sign);
}
