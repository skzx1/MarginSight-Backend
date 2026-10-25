import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {needsRecordedData} from '../src/general-chat.js';
test('all 100 curated merchant questions keep the declared general or recorded-data boundary',async()=>{
 const bank=JSON.parse(await readFile(new URL('../../fixtures/merchant-questions-v1.json',import.meta.url),'utf8'));
 assert.equal(bank.questions.length,100);assert.equal(new Set(bank.questions.map((q:any)=>q.id)).size,100);assert.equal(new Set(bank.questions.map((q:any)=>q.text)).size,100);
 for(const q of bank.questions)assert.equal(needsRecordedData(q.text)?'STORE_DATA':'GENERAL',q.expectedMode,q.id+' '+q.text);
});
