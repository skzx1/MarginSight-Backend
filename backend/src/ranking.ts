import type {HistoryMessage} from './message-router.js';
const words:Record<string,number>={หนึ่ง:1,สอง:2,สาม:3,สี่:4,ห้า:5,หก:6,เจ็ด:7,แปด:8,เก้า:9,สิบ:10,first:1,second:2,third:3,fourth:4,fifth:5};
const normalize=(s:string)=>s.replace(/[๐-๙]/g,c=>String('๐๑๒๓๔๕๖๗๘๙'.indexOf(c)));
export function requestedRank(message:string){
 const q=normalize(message),matches=[...q.matchAll(/(?:อันดับ|ลำดับ|rank)\s*(?:ที่)?\s*(\d+|หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า|สิบ)/ig)];
 const token=matches.at(-1)?.[1]??q.match(/\b(first|second|third|fourth|fifth)\s+(?:highest|lowest|most|least)/i)?.[1];
 return token===undefined?1:words[token.toLowerCase()]??Number(token);
}
export const isRankingQuestion=(q:string)=>/สินค้าไหน|สินค้าตัวไหน|which product|most profit|least profit|กำไรดี|กำไรน้อย|กำไร.*(?:อันดับ|ลำดับ)|(?:อันดับ|ลำดับ).*กำไร/i.test(q);
// Uses only the bounded conversation supplied to the router; no hidden chat memory.
export function rankingContext(message:string,history:HistoryMessage[]){
 let active:string|undefined;
 for(const text of [...history.filter(m=>m.role==='user').map(m=>m.text),message]){
  if(isRankingQuestion(text)){active=text;continue;}
  const short=normalize(text).replace(/[?!.,？]/g,'');
  if(active&&/^(?:(?:แล้ว|ขอ|ดู|เอา|อันดับ|ลำดับ|ที่|ล่ะ|ครับ|ค่ะ|นะ|หน่อย|ที|ตัว|สินค้า|รองลงมา|ถัดไป|next|one|and|rank|first|second|third|fourth|fifth|หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า|สิบ|\d+)|\s)+$/i.test(short)){
   const rank=/รองลงมา|ถัดไป|ตัวถัด|next one/i.test(text)?requestedRank(active)+1:requestedRank(text);
   active=active.split('\n')[0]+'\nอันดับ '+rank;
  }else active=undefined;
 }
 return active;
}
