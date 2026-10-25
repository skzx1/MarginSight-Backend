import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

// The uploaded research is evidence, never executable instructions or approved tariffs.
const sources=[['SHOPEE','Shopee_Thailand_Fee_Spec_2026-10-24.md'],['LAZADA','Lazada_Thailand_Fee_Spec_2026-10-24.md'],['TIKTOK','TikTok_Shop_Thailand_Fee_Spec_2026-10-24.md'],['LINE','LINE_Thailand_Commerce_Fee_Spec_2026-10-24.md']];
const sha=text=>createHash('sha256').update(text).digest('hex');
const chunks=[],documents=[];
for(const [platform,file] of sources){
 const raw=readFileSync('knowledge/fee-rules/sources/'+file,'utf8').replace(/\r\n/g,'\n');
 const sourceSha256=sha(raw),lines=raw.split('\n');let section='',tableHeader='',paragraph=[],start=1;
 documents.push({file,platform,sha256:sourceSha256,asOf:'2026-10-24',provenance:'USER_SUPPLIED_RESEARCH'});
 const add=(text,line)=>{
  if(!text.trim())return;
  // Split deterministically without dropping the beginning of long paragraphs.
  const pieces=Array.from({length:Math.ceil(text.length/5500)},(_,i)=>text.slice(i*5500,(i+1)*5500));
  for(const part of pieces){
   const body=part.trim();if(!body)continue;
   const sourceUrls=[...new Set([...body.matchAll(/https:\/\/[^\s)\]>]+/g)].map(m=>m[0].replace(/[.,;]+$/,'')))];
   const cautions=['RESEARCH_NOT_INDEPENDENTLY_VERIFIED','NOT_APPROVED_FOR_CALCULATION'];
   if(/conflict|ขัดแย้ง|typo/i.test(body))cautions.push('CONFLICTING_EVIDENCE');
   if(/UNVERIFIED|not found|not verified|inaccessible|secondary|hypothetical|illustrat|provisional/i.test(body))cautions.push('UNCERTAIN_OR_ILLUSTRATIVE');
   const id=platform.toLowerCase()+'-'+sha(section+'\n'+body).slice(0,16);
   if(chunks.some(c=>c.id===id))continue;
   chunks.push({id,platform,title:section||file,text:body,sourceFile:file,sourceLine:line,sourceSha256,sourceUrls,
    asOf:'2026-10-24',effectiveFrom:null,effectiveTo:null,verification:'USER_SUPPLIED_RESEARCH',calculationEligible:false,cautions,
    kind:/example|worked|illustrat/i.test(section)?'ILLUSTRATION':/ledger|register/i.test(section)?'FEE_RULE':'CONTEXT'});
  }
 };
 const flush=()=>{add(paragraph.join('\n'),start);paragraph=[];};
 lines.forEach((line,i)=>{
  if(/^#{1,4}\s/.test(line)){flush();section=line.replace(/^#+\s*/,'');tableHeader='';return;}
  if(/^\|/.test(line)){
   flush();if(/^\|\s*:?-{2,}/.test(line))return;
   if(!tableHeader){tableHeader=line;return;}
   add(tableHeader+'\n'+line,i+1);return;
  }
  if(!line.trim()){flush();tableHeader='';return;}
  if(!paragraph.length)start=i+1;paragraph.push(line);
 });flush();
}
assert(chunks.length>0&&chunks.length<=400,'Unexpected corpus size');
assert(chunks.every(c=>c.text.length<=6000),'Oversized knowledge chunk');
const content={schemaVersion:1,documents,chunks};
const corpus={...content,version:sha(JSON.stringify(content))};
const rendered=JSON.stringify(corpus,null,2)+'\n',target='knowledge/fee-rules/corpus.json';
if(process.argv.includes('--check'))assert.equal(readFileSync(target,'utf8').replace(/\r\n/g,'\n'),rendered,'Fee corpus drift: run npm run fees:corpus');
else writeFileSync(target,rendered);
console.log(JSON.stringify({corpusVersion:corpus.version,documents:documents.length,chunks:chunks.length,calculationEligible:0}));
