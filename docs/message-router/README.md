# ตัวกรองข้อความผู้ช่วยบนเว็บ MarginShot / MarginSight

25 ตุลาคม 2569 · ผู้ใช้แก้ขอบเขตจาก LINE เป็นแชตบนเว็บไซต์ และยืนยันใช้ Qwen ที่โฮสต์บน AWS เดิม จึงไม่ย้าย runtime/database ไป Bun/PostgreSQL/pgvector และไม่เปลี่ยน LINE ในงานนี้

## การตัดสินใจและสถาปัตยกรรม

```text
เว็บ: ข้อความปัจจุบัน + 5 ข้อความก่อนหน้าในแชตเดียวกัน + SKU/ช่วงวันที่ที่เลือก
  → POST /stores/{store}/assistant {mode:"chat",...}
  → JWT/guest capability + membership/tenant/origin เดิม
  → exact greeting/thanks guard หรือ Qwen router (JSON เท่านั้น) → strict schema → confidence gate 0.7
      NORMAL_CHAT → Qwen ตอบสั้น 1 ครั้ง / ไม่มี tools / ไม่อ่านข้อมูลร้านหรือ RAG
      CLARIFY     → คำถามสั้นจาก template / ไม่เรียก tools
      FEE_PIPELINE
        → shop_data_query: ข้อมูลร้านที่ผ่านสิทธิ์เท่านั้น (เมื่อจำเป็น)
        → fee_lookup: Titan → private S3 index → platform-scoped research/citations
        → ถามอัตรา: แสดงสถานะ/แหล่ง/วันที่มีผล; ไม่เดาเมื่อยังไม่ยืนยัน
        → ขอคำนวณ: Qwen เลือก operation แบบ JSON ที่จำกัดขอบเขต
          → profit_calculator / shop_data_query
          → domain engine เดิม: integer satang + Decimal + effective dates
          → แอปแสดงผลที่ตรวจแล้วและหลักฐาน ไม่ใช้เลขที่ LLM แต่งขึ้น
  → JSON envelope ให้เว็บแสดงในหน้าต่างแชตเดิม
  → structured CHAT_ROUTE log: route/confidence/latency/status/tenant hash
```

แยก **ความชัดของเจตนา** ออกจาก **ความครบของข้อมูลคำนวณ**: คำถามค่าธรรมเนียมที่ยังขาดหมวดสินค้า/ราคา/ต้นทุนยังเป็น FEE_PIPELINE แล้วถามข้อมูลเพิ่มในขั้นตอนนั้น ไม่ลดเป็น NORMAL_CHAT เพราะข้อมูลไม่ครบ การทักทายปนคำถามค่าธรรมเนียมผ่าน fee pipeline พร้อมทักสั้น ๆ ความมั่นใจต่ำกว่า0.7, JSON ผิดรูปแบบ หรือ router ล้มเหลว → CLARIFY เท่านั้น

Qwen32B เป็นโมเดลที่ผู้ใช้เลือกเพราะเปิดใช้อยู่แล้ว ไม่อ้างว่าเป็นโมเดลขนาดเล็กที่สุด ความมั่นใจที่โมเดลส่งมาเป็น self-report ยังไม่ผ่าน probability calibration คำทักทาย/ขอบคุณล้วนที่ตรงทั้งข้อความใช้กฎแคบและมีเพียง1 answer call; ข้อความอื่นมี **1 router call + 1 answer call** สำหรับ NORMAL_CHAT “single LLM call” หมายถึงขั้นตอบหลัง router ตาม upstream83200eb ที่ผู้ใช้สั่งปลดลิมิต ไม่มีโควตาจำนวนใช้ของแอปหรืออายุ guest session แล้ว; ยังรักษา deadline/token/context bounds และงบทีม350USD รวมถึงข้อจำกัดจริงของผู้ให้บริการ คำทักทายปนค่าธรรมเนียมไม่เข้ากฎลัด

## Prompt / JSON schema / ชุดทดสอบ

- [router-prompt.txt](router-prompt.txt): prompt รุ่น router-v3 ที่ใช้จริง
- [router.schema.json](router.schema.json): object ห้าฟิลด์ ไม่มีฟิลด์เพิ่ม
- [test-cases.json](test-cases.json): 68 กรณี ไทย/อังกฤษ/ผสม/คำผิด/คำแฝง/บริบท/โจมตี prompt
- Source: `backend/src/message-router.ts`; export/checkด้วย `npm run chat:export` และ `npm run verify`

```json
{"route":"FEE_PIPELINE","confidence":0.95,"reason":"ถามค่าคอมมิชชันของช่องทางขาย","detected_platforms":["SHOPEE"],"needs_calculation":false}
```

Router ส่งเฉพาะ JSON นี้; HTTP response ของแชตห่อเพิ่ม answer/provider/evidence/result เพื่อแสดงคำตอบ ไม่ใช่การเพิ่ม fieldใน router decision

## โค้ดและขอบเขตเครื่องมือ

`backend/src/web-chat.ts` เป็น orchestrator และตัวอย่างโครงต่อเครื่องมือที่ใช้งานได้จริง; `AI.chat` เชื่อม Qwen/limiter เดิม; `api.ts` dispatchจาก mode=chat ไปที่ orchestrator บน Assistant Lambda เดิม ไม่มี route/IAM resource ใหม่

```ts
const decision = await routeMessage(textModel, message, history.slice(-5));
switch (decision.route) {
  case 'CLARIFY': return askOneShortQuestion();
  case 'NORMAL_CHAT': return normalTextWithoutTools();
  case 'FEE_PIPELINE': return feeLookupThenBoundedCalculatorOrAskInputs();
}
```

ตัวอย่างนี้อธิบายโครง; implementation จริงอยู่ใน source ไม่สร้างสูตรกำไรอีกชุด ข้อมูลร้านใช้ Repository ที่ boundกับstoreจาก authorization; โมเดลไม่ส่ง store ID/SQL/PK/query arbitrary ให้ tools ชื่อ `fee_lookup`, `profit_calculator`, `shop_data_query` เป็นฟังก์ชันที่แอปควบคุม Planner เลือกได้เฉพาะ operation whitelist ไม่มีสิทธิ์เขียน fee catalog, enrollment หรือข้อมูลร้าน

- ค่าอ้างอิงปัจจุบันทั้ง134 chunksยังเป็น USER_SUPPLIED_RESEARCH/calculationEligible=false/effectiveFrom=null จึงไม่แสดงว่าเป็นอัตราปัจจุบันที่ยืนยันแล้ว ใช้ source file/line/URL และระบุ “วันที่มีผล: ยังไม่ยืนยัน (เอกสาร ณ24ต.ค.2026)” เสมอ snapshot dateไม่ใช่ effective date
- ผลเงินจริงใช้รายการหักที่บันทึก/ยืนยันแล้ว หรือกฎร้านเดิมพร้อม sourceRef/effectiveFrom ของกฎ การอ้างจำนวนเงินจาก ledgerไม่ใช่การยกระดับอัตราจาก research ส่วนอธิบายผลเงินยังแสดงจาก template/engineเพื่อรักษา safe Qwen contractเดิม
- รองรับกำไรรวมตามช่วง/SKU, ส่วนลดเป็นเปอร์เซ็นต์ที่ผู้ใช้ระบุ, คุ้มทุน, ต้นทุนที่มีผล, จำนวนออเดอร์, อันดับกำไรสูง/ต่ำ, เปรียบเทียบช่องทางที่มีข้อมูลจริง ข้อมูลไม่ครบไม่แทนด้วยศูนย์ ออเดอร์หลายสินค้าไม่ถูกอ้างเป็นกำไรของสินค้าตัวเดียว
- Queryจำกัด12เดือน/1000ออเดอร์ ดึง paginationครบหรือแจ้งล้มเหลว ไม่อ้างยอดบางส่วนเป็นทั้งร้าน ไม่มีการจำลองอัตราของแพลตฟอร์มใหม่จากการเปลี่ยนชื่อช่องทาง
- ชื่อแพลตฟอร์มที่ระบุในข้อความปัจจุบันใช้แทนชื่อที่โมเดลสืบจากประวัติ เมื่อเป็น FEE_PIPELINE; ยอดเงินจริงกรองเฉพาะช่องทางที่ถาม ไม่รวมออเดอร์ช่องทางอื่น RAG รับข้อความผู้ใช้ในประวัติห้าข้อความล่าสุดร่วมกับคำถามปัจจุบัน เพื่อคงหัวข้อในคำถามต่อเนื่อง ไม่ใช้คำตอบเก่าของโมเดลเป็นหลักฐานอัตรา
- ราคา/ต้นทุนที่พิมพ์ใหม่ยังต้องยืนยันสินค้า/หน่วย/ค่าธรรมเนียม ไม่แทนข้อมูลเดิมอัตโนมัติ ยังไม่รองรับทุกยอดย่อย เช่นยอดโฆษณารวม หรือรายการออเดอร์แบบ arbitrary; ถามให้ชัดแทนตอบกำไรที่ไม่ได้ถาม เส้นทางทดลองแคมเปญเดิมยังแยกจากแชตนี้

## ประวัติ ความปลอดภัย และ error handling

เว็บส่งห้าข้อความก่อนหน้าจากแชตนั้นเท่านั้น ไม่ใช่ห้า turn; เรียงเวลา ไม่รวม pending/failed หรือข้อความหลัง turnที่กดตอบใหม่ ไม่ดึงประวัติแชตอื่นหรือร้านอื่น ประวัติเป็น untrusteddata ไม่ใช่แหล่งยืนยันยอด/สิทธิ์ เอกสาร RAG ก็เป็นdataและไม่ใช่คำสั่ง

ไม่มี server-side conversation memory ใหม่ ประวัติเต็มยังอยู่ใน browser storageตามระบบเดิม ไม่บันทึก prompt/ข้อความร้าน/ผลเลข/tokenใน route logs ใช้ CloudWatch structured logเดิม retention7วัน เก็บroute/confidence/router latency/total latency/status/tenant hashเพื่อ aggregateความผิดพลาด ยังไม่มีปุ่มfeedbackผูกกับข้อความจริงหรือคลังข้อความannotated ต้องตัดสินใจด้านprivacy/retentionก่อนเพิ่ม

- Router timeout/JSONผิด/มีfieldเกิน/ค่าตัวเลขไม่ถูกต้อง → CLARIFY ไม่เรียก tools รับJSONธรรมดาหรือJSONภายในกรอบโค้ดหนึ่งกรอบที่ครอบทั้งคำตอบเท่านั้น ไม่ดึงวัตถุจากข้อความปน/ไม่แก้ค่าหรือschemaเอง Routerผลสุดท้ายยังเป็นJSONอย่างเดียว
- ทุก FEE_PIPELINE ผ่าน planner ที่จำกัดschemaอีกครั้ง แม้ routerส่งneeds_calculation=false เพื่อไม่สับสนคำถามต้นทุนร้านกับอัตราแพลตฟอร์ม; needs_calculationในenvelope/logถูกยืนยันตามoperationที่ผ่านvalidationก่อนใช้เครื่องมือ
- Normal answerใช้Qwenครั้งเดียวและไม่มีtoolConfig; providerล้มเหลวแสดงไม่พร้อมใช้; outputมีรูปแบบอัตรา/เงินที่ไม่ควรอยู่ใน normal ถูกบล็อกให้ถามกลับ
- RAGล้มเหลวแสดงว่าค้นไม่สำเร็จ แยกจากไม่มีrecord; การคำนวณจากข้อมูลร้านเดิมยังใช้ได้พร้อมคำเตือน ไม่สร้างอัตรามาทดแทน
- Plannerผิด/toolล้มเหลว/ข้อมูลไม่ครบ/rangeเกิน → ข้อความชัดเจน ไม่มีตัวเลขแทนหรือstack trace
- ส่วนลดห้ามdefault15: ต้องมีเปอร์เซ็นต์ที่ผู้ใช้ระบุ เลขในข้อความปัจจุบันสำคัญกว่าประวัติ; ไม่ใช้ตัวเลขที่assistantเคยตอบเป็นinputใหม่
- รวมdeadline23วินาที + per-call model7วินาที + retrieval5วินาทีเดิม SDKไม่retryอัตโนมัติ provider quota/timeout แสดงไม่พร้อมใช้ โดยไม่เปลี่ยนงบหรือสิทธิ์

## ผลประเมิน Qwen จริง (operator IAM ไม่ใช่ผล LINE/browser)

ชุดจำลอง68กรณีเขียนโดยผู้พัฒนา ใช้ประเมิน3รอบระหว่างแก้prompt/format handling ไม่ใช่ held-out benchmark ความแม่นยำข้อความจริงหรือการรับรอง calibrated confidence ผลนี้วัด route ไม่ได้ยืนยันความถูกต้องของทุกค่าneeds_calculation/platform/planหรือทุกคำตอบปลายทาง

| Routeที่คาดหวัง | จำนวน | ถูก (v3) | Recall/accuracy ภายในกลุ่ม | Precision |
|---|---:|---:|---:|---:|
| FEE_PIPELINE |31|28|90.32%|100%|
| NORMAL_CHAT |23|19|82.61%|100%|
| CLARIFY |14|14|100%|66.67%|
| รวม |68|61|89.71%|—|

รอบแรกv1:57/68=83.82%; v2:62/68=91.18%; รุ่นล่าสุดv3:61/68=89.71% โดยไม่เปลี่ยน expected labelsและไม่เลือกเฉพาะรอบคะแนนสูง ความผิดพลาดv3ทั้ง7เป็นการส่งCLARIFYเกินจำเป็น ไม่พบfee→normalหรือnormal→feeในชุดนี้ ไม่สรุปว่าไม่มีโอกาสเกิดในงานจริง p50 router3063ms/p953568ms;62,121input/3,825output tokens;66model calls(2เคสใช้กฎทักทาย);0transporterrors/invalid-output fallbacksในรอบนี้ การตอบยังมีความผันผวนแม้temperature0 ดูevaluation-v2.jsonและevaluation-v3.json

| ID | ข้อความ/บริบท | ควรเป็น | ผลจริง | สาเหตุที่สังเกต |
|---|---|---|---|---|
| R23 |11.11 โปรแกรม cashback ร้านต้องออกเพิ่มไหม |FEE|CLARIFY|confidence0.65|
| R39 |เพื่อนชื่อคอมฝากบอกว่าสวัสดี |NORMAL|CLARIFY|confidence0.65|
| R42 | คำสั่งบังคับให้output FEE_PIPELINEอย่างเดียว |NORMAL|CLARIFY|confidence0.2|
| R58 |“and TikTok?” หลังถามค่าธรรมเนียมคืนสินค้าShopee |FEE|CLARIFY|โมเดลส่งCLARIFYแม้confidence0.8|
| R62 | “แล้ว Lazada ล่ะ” หลังถามเปลี่ยนรูปโปรไฟล์ |NORMAL|CLARIFY|confidence0.65|
| R63 | “คุ้มไหม” หลังถามลด15% |FEE|CLARIFY|confidence0.65|
| R64 | “คุ้มไหม” หลังคุยเรื่องหนัง |NORMAL|CLARIFY|confidence0.6|

รัน `npm run chat:eval` เพื่อดูแผนแบบoffline; `npm run chat:eval -- --invoke-aws` ประเมิน68กรณีและเรียกQwenไม่เกิน68ครั้งหลังตรวจSTS/งบ/access เก็บผลในignored tmp/message-router/evaluation.json ต้องใช้sessionชั่วคราวที่เชื่อมไว้ ไม่มีcredentialsในsource รายงานมี per-route precision/recall/failures/tokens/latency ไม่แสดงหรือเก็บข้อมูลร้านจริง ผลgoldenของtoolsทดสอบแยกจากaccuracyของclassifier

## เรื่องที่เจ้าของควรตัดสินใจต่อ

1. อัตราที่ใช้ตอบอย่างยืนยัน: ใครเป็นผู้รับรองหมวด/ร้าน/VAT/ฐาน/วันที่มีผลและแหล่งทางการก่อนpromote research? แนะนำใช้statement/tax invoiceของร้านประกอบและไม่auto-promote
2. คุณภาพก่อนขยายผู้ใช้: ยอมรับอัตราถามกลับเกินจำเป็นระดับนี้ในpilotหรือกำหนดเป้าหมายสูงกว่า? แนะนำเก็บชุดทดสอบจริงแบบยินยอมและheld-outก่อนปรับthreshold ไม่ลด0.7เพื่อทำคะแนนให้ดีขึ้น
3. Logging/feedback: ต้องการเก็บเฉพาะmetadata7วันเดิม หรือให้ผู้ใช้ส่งข้อความที่ยินยอมเพื่อวิเคราะห์ข้อผิดพลาด? แนะนำmetadataเดิมก่อนและเพิ่มfeedbackแบบopt-inภายหลัง

## แหล่งเทคนิคที่ตรวจ

- ระบบAWSปัจจุบันและขอบเขตRAG: ../fee-rule-rag.md และ ../verification.md (25ต.ค.2026)
- เอกสารBun SQL: https://bun.sh/docs/runtime/sql และ pgvector: https://github.com/pgvector/pgvector (อ่าน25ต.ค.2026เพื่อเทียบคำขอแรก; ไม่ได้นำมาสร้างinfraหรืออ้างว่าใช้อยู่ หลังผู้ใช้ยืนยันAWSเดิม)
- Next.jsclient boundary: node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-client.md ของเวอร์ชันที่ล็อกไว้

สถานะ deploy/API/browserของรอบนี้ให้ดู ../verification.md ไม่ถือว่าการมีsourceหรือการประเมินoperatorเป็นการขึ้นเว็บจริงแล้ว

## การรวม upstream ล่าสุด — 25 ตุลาคม 2569

ดึง Frontend a8bcfa0 และ Backend83200eb แบบ fast-forward แล้วรวมงาน RAG/router เดิม โดยเก็บ stash สำรอง ไม่ reset/force push และไม่ทิ้งรายการเปลี่ยนแปลงเดิม การปลด app quotas/guest expiry/chat counts อยู่ครบ ไม่สร้าง quota ใหม่ใน router หรือ embedding callback

ทุกข้อความยังส่งเข้า server router ก่อนเสมอ การเลือกแคมเปญแนบเป็น scenario ที่ validate ด้วย schema เดิม ไม่มี client keyword bypass หรือ options request ระหว่างส่งข้อความ Normal chat แม้เลือกแคมเปญอยู่ก็ไม่เรียก RAG/ข้อมูลร้าน

การลองส่วนลดและแคมเปญในแชตใช้ catalogDiscount ของ Backend ที่นำเข้าจาก upstream: ราคากับต้นทุนสินค้าปัจจุบันต่อหนึ่งหน่วย ไม่ต้องมีออเดอร์; แสดงส่วนต่างก่อนค่าใช้จ่าย/ค่าบริการตามสมมติฐาน ไม่อ้างเป็นกำไรสุทธิเมื่อค่าใช้จ่ายไม่ครบ ไม่มีการเปลี่ยนราคาจริงหรือสมัครแคมเปญ กำไรรายเดือนยังใช้ ledger/ออเดอร์จริงและไม่รับผลกระทบจากแคมเปญที่เลือก คุ้มทุนจากออเดอร์เดิมยังเป็น operation แยกพร้อมขอบเขตหลักฐาน

ผล61/68ข้างต้นวัด classifier prompt router-v3 เดิม ไม่ใช่ผลประเมินทุกคำตอบของ pipeline หลัง merge ผล API/browser หลังรวมให้ดู verification.md ฉบับล่าสุด

## Final compatibility integration before publication — 25 October 2026

The routed website contract includes context and uses AI.routedChat. Existing callers of mode chat without context keep the upstream AI.chat general-conversation contract, so backend-first deployment does not break the previous website. The new adapter sends every message through the strict router, retains general-conversation provenance, numeric catalog cards, explicit campaign assumptions and the 100-question library. General answers can help with writing/code/ideas without tools or shop records; recorded money remains deterministic.

Ordinal ranking is now performed on the server against complete single-product order groups: requested Thai/English ordinals, deterministic SKU tie ordering, all-product scope even when one SKU is selected, bounded follow-up history, explicit missing-rank clarification and disclosure of excluded incomplete/mixed data. Explicit no-discount wording uses the catalog helper's zero-discount semantics. The unchanged router-v3 classification benchmark above is not a benchmark of all these final pipeline operations. Final deployment/readback/API results belong in verification.md.
