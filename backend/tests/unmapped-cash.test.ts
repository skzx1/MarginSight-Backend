import {test} from 'node:test';
import assert from 'node:assert/strict';
import {demoFixture} from '../src/domain/demo-fixture.js';
import {calculate} from '../src/domain/calculate.js';
test('unclassified WHT is preserved for exact cash reconciliation and never treated as operating expense',()=>{
 const input=demoFixture();input.order={...input.order,feesConfirmed:true,settlementStatus:'SETTLED',payoutSatang:15300};
 input.fees=[{feeId:'f1',type:'PLATFORM_FEE',scope:'PER_ORDER',amountSatang:4600,effectiveAt:input.order.orderAt,dataOrigin:'MOCK',sourceRef:'posted fees'},{feeId:'w1',type:'WHT',scope:'PER_ORDER',amountSatang:100,effectiveAt:input.order.orderAt,dataOrigin:'MOCK',sourceRef:'unclassified withholding statement'}];
 const result=calculate(input);assert.equal(result.feeSatang,4600);assert.equal(result.rawCashDeductionSatang,4700);assert.equal(result.netItemSettlementSatang,15300);assert.equal(result.payoutReconciled,true);
 assert.equal(result.profitSatang,null);assert.equal(result.marginPct,null);assert.equal(result.platformFeeRatioPct,null);assert.equal(result.ttr.percent,null);assert.equal(result.status,'INCOMPLETE');assert.equal(result.unmappedCharges[0].feeId,'w1');assert.ok(result.missingFields.includes('cash_deduction_requires_classification:w1'));assert.ok(result.evidence.includes('unclassified withholding statement'));
 assert.equal(calculate({...input,order:{...input.order,payoutSatang:15301}}).payoutReconciled,false);
});
