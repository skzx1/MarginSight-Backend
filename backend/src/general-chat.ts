import {z} from 'zod';
export const generalChatSchema=z.object({mode:z.literal('chat'),message:z.string().trim().min(1).max(1500),locale:z.enum(['th','en']).default('th'),history:z.array(z.object({role:z.enum(['user','assistant']),text:z.string().trim().min(1).max(1500)}).strict()).max(8).default([]).refine(rows=>rows.length%2===0&&rows.every((row,i)=>row.role===(i%2?'assistant':'user')),'INVALID_CHAT_HISTORY')}).strict();
// This only selects a path. Financial amounts still come exclusively from the domain engine.
export function needsRecordedData(message:string){
 const measure=/กำไร|ขาดทุน|ยอดขาย|รายรับ|รายจ่าย|ยอดเงิน|ออเดอร์|คำสั่งซื้อ|สต็อก|คงเหลือ|ต้นทุน|ราคาขาย|มาร์จิ้น|margin|profit|revenue|sales|payout|inventory|stock|orders?/i;
 const period=/เดือนนี้|เดือนที่แล้ว|สัปดาห์นี้|สัปดาห์ที่แล้ว|วันนี้|เมื่อวาน|this month|last month|this week|last week|today|yesterday|20\d{2}-\d{2}/i;
 const amount=/เท่าไร|เท่าไหร่|กี่|เหลือ|มากที่สุด|น้อยที่สุด|สูงสุด|ต่ำสุด|สินค้าไหน|สินค้าตัวไหน|how much|how many|which product|most|least|highest|lowest/i;
 if(/เขียนโค้ด|ตัวอย่างโค้ด|write.{0,20}code|ช่วยแต่ง|เขียนแคปชั่น|แคปชั่น/i.test(message)&&!period.test(message)&&!/ของร้าน|ร้านฉัน|my (?:shop|store)/i.test(message))return false;
 if(measure.test(message)&&(period.test(message)||amount.test(message)||/คำนวณ|calculate|compute|ของร้าน|ร้านฉัน|my shop|my store|our store/i.test(message)))return true;
 if(/(?:แคมเปญ|โปรแกรม|campaign).*(?:เหลือ|เท่าไร|เท่าไหร่|คุ้ม|กำไร)/i.test(message))return true;
 const concept=/คืออะไร|หมายถึง|แปลว่า|ต่างกัน|อธิบาย|สอน|ยกตัวอย่าง|วิธีคิด|what (?:is|are)|explain|meaning|difference between|how (?:does|do)/i;
 if(concept.test(message))return false;
 return /ลดราคา|ลด\s*(?:-?\d|สิบ|ยี่สิบ)|ส่วนลด|discount|คุ้มทุน|break.?even/i.test(message)||measure.test(message);
}
