# Claude Haiku 4.5 — สถานะและวิธีเปิดใช้งาน

> บันทึกทางเลือกเดิมก่อนQwenrollout: ผู้ใช้เลือกและdeploy Qwen3 32Bแทนแล้วเมื่อ24ต.ค.2026. ดู [สถานะปัจจุบัน](status.md) และ [ผลตรวจ](verification.md). เอกสารนี้ไม่ใช่คำสั่งให้เปลี่ยนโมเดลกลับเป็นHaiku.

อัปเดต 24 ตุลาคม 2026 (ไทย)

**สถานะ: VERIFIED_LOCAL / BLOCKED_EXTERNAL สำหรับการเปิดบน AWS.** ผู้ใช้เลือกเปลี่ยนแชตบอตเป็น Claude Haiku 4.5 แล้ว แต่ AWS CountTokens ตอบ HTTP403 ว่า `anthropic.claude-haiku-4-5 is not available for this account` ในบัญชี109991964227 ผ่าน Mantle us-east-1. เว็บจริงจึงยังใช้ Nova Lite รุ่นเดิม; ยังไม่ได้ deploy โค้ด/ตั้งค่าใหม่หรือแก้ IAM. ห้ามเรียกการทดสอบ stub ว่าเรียก Claude จริงสำเร็จ.

## สิ่งที่เปลี่ยนในโค้ด

- ผู้ช่วยเว็บและ LINE เลือก `ASSISTANT_MODEL_ID=anthropic.claude-haiku-4-5` ได้ผ่าน SDK ทางการ `@anthropic-ai/bedrock-sdk` ที่ pin1.1.0 และ lock dependencies.
- เรียกเฉพาะ `https://bedrock-mantle.us-east-1.api.aws/anthropic/v1/messages` ด้วย SigV4 ของ Lambda role; ไม่สร้าง API key. ปิด SDK retries, redirect และ SDK logs; timeout16วินาทีต่อรอบ, outputไม่เกิน500tokens, รวม orchestration20วินาที/3รอบ/ไม่เกิน4toolsต่อรอบ. จำกัด serialized context64KiB. โควตารายวันและ guest quota เดิมยังบังคับก่อนเรียก; attempted calls รวมในโควตา.
- แปลง text/tool_use/tool_result ไปกลับกับ protocol เดิมเท่านั้น. Toolsยังมี4ตัว: getProfit, simulateDiscount, getBreakEven, getCalculationEvidence. ไม่มี server tools/web search/URL fetch/model training.
- ตัวเลขและข้อความสรุปการเงินยังมาจาก deterministic engine. ตรวจ SKU/ส่วนลด/ตัวเลขโมเดล และ fallback เมื่อ providerผิดพลาดหรือสิทธิ์ไม่ผ่าน. Response `model=null` เมื่อใช้ deterministic fallback ไม่อ้างว่า Claude ตอบสำเร็จ.
- OCRใช้ `BEDROCK_MODEL_ID=amazon.nova-lite-v1:0` แยกจาก assistant. เปลี่ยนแชตไม่เปลี่ยนโมเดลอ่านบิล; OCRยังเป็น draft ที่ต้องตรวจยืนยัน.
- `/integrations` แสดง assistant model/region/transport จาก configเดียวกับ runtime ทั้งร้านจริงและ guestที่ผ่านสิทธิ์. เป็น configured model ไม่ใช่ model access health check.

## Region และสิทธิ์

ตาม [AWS Haiku model card](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-haiku-4-5.html) Haikuบน bedrock-runtime ใช้ geo/global inference profile; US profileอาจส่งไป us-east-2/us-west-2 ซึ่งอยู่นอก Regionการแข่งขัน. โค้ดจึง rejectทั้ง profile IDs และ Haikuที่ไม่ได้ตั้ง us-east-1.

ใช้ bare Mantle ID `anthropic.claude-haiku-4-5` สำหรับ single-Region ตามเอกสาร [Messages API](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-messages-api.html). สิทธิ์ของ endpointนี้คือ `bedrock-mantle:CreateInference` ไม่ใช่การเพิ่ม foundation-model ARN ให้ `bedrock:InvokeModel` อย่างเดียว. ดู [AWS endpoint comparison](https://docs.aws.amazon.com/bedrock/latest/userguide/endpoints.html) และ [service authorization](https://docs.aws.amazon.com/service-authorization/latest/reference/list_bedrock-mantle.html).

เตรียม policy proposal ที่ `scripts/haiku-runtime-policy.json`: จำกัดบัญชีเดิม/us-east-1/project resource/model Haiku/default tier. **ยังไม่ได้ apply**; ห้ามแก้ SSO role/องค์กร/สมัคร Marketplace เพื่อผ่านข้อจำกัด. ผู้ดูแลต้องตรวจทั้ง model access, SCP และ runtime role permissionตามกติกากิจกรรม. IAMอย่างเดียวไม่แก้ข้อผิดพลาด account availability.

## ขั้นตอนหลังผู้จัดเปิดให้ใช้งาน

1. บน CloudShell ของบัญชี109991964227 รัน `python3 scripts/haiku-preflight.py`. ตรวจ STS, งบ350USDรวมทีม/เป้าทดลอง25USD และ CountTokensในus-east-1. สคริปต์นี้ไม่ inference, subscribe, create agreement/project/key หรือแก้ IAM. ถ้า403ให้หยุดและส่งข้อความผิดพลาดให้ผู้จัด. CountTokens200ยังไม่พิสูจน์ inferenceหรือLambda role.
2. ผู้ดูแลตรวจ/ให้ scoped policyจากไฟล์ proposal กับ roleเดิม `marginsight-assistant` และ `marginsight-lineworker` เฉพาะเมื่อใช้ LINE. ไม่ต้องให้ OCR/Api/Seed หรือสร้าง roleใหม่; ห้ามขยาย SSO. `template.yaml` เตรียม policyแบบมี condition สำหรับ deploymentใหม่ แต่บัญชีนี้ใช้ `template-external-roles.yaml` ซึ่งไม่จัดการ role policiesแทน operator.
3. `npm ci && npm run verify`; รัน `python3 -m unittest discover -s scripts/tests -v`; ตรวจ local build ก่อนอัปโหลด. ประเมินราคาล่าสุดที่ [Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/) สำหรับ workload/tokenจริงก่อน inference. ราคา Novaเดิมใช้แทน Haikuไม่ได้; ไม่เปิด provisioned/reserved capacity. Budgetมี lagและไม่ใช่ hard cap.
4. เตรียม updateเท่านั้นด้วย `python3 scripts/prepare-update.py --assistant-model anthropic.claude-haiku-4-5`. เพิ่ม parameter `AssistantModelId` อย่างตั้งใจ โดยรักษาค่าอื่นจาก stack. คำสั่งแบบไม่มี flagรักษาโมเดลเดิม; stackเก่าที่ไม่มี parameterจะใช้ Nova เพื่อไม่ให้ releaseอื่นเปิด Haikuเอง.
5. อ่าน change setใหม่: existing stackในSingaporeเท่านั้น, ไม่เพิ่ม resource/role, ไม่มี replacement/deletion, `AIRegion=us-east-1`, OCRยังNova, auth/tenantยังเดิม. เมื่อผ่านจึง executeตาม deployment authorization ของ sessionและ runbookหลัก.
6. อ่าน Lambda env/IAMกลับ, ใช้ isolated MOCK tenantทดสอบคำถามปกติ/ลด15%/คุ้มทุน/ต้นทุนขาด/โมเดลล้มเหลว/ขอข้าม SKU. ต้องมี real Haiku request และ tool round trip, response modelตรง, engineเฉลย -14.10บาท/margin-8.29%, browser errorว่าง และ logไม่บันทึก payload/credentials. ไม่ถือว่า fallbackกำไรถูกอย่างเดียวเป็น proofว่าClaudeทำงาน.
7. บันทึก source commit, change set/time, model/token usage, costsnapshotและผลจริงใน status/verification/cost-log. เกณฑ์ LINE/real OCR/native platform/สองบัญชีเดิมยังต้องตรวจแยก.

## ย้อนกลับ

เตรียม code/config updateด้วย `python3 scripts/prepare-update.py --assistant-model amazon.nova-lite-v1:0` แล้ว review/executechange setใหม่ตาม runbook. หรือใช้ `AIEnabled=false` เพื่อให้ผลการเงิน fallback โดยไม่มี inference. ไม่ลบข้อมูลร้าน/เปลี่ยน Cognito/ลบ stack. ขณะนี้ไม่มี live migration จึงไม่ต้องทำ rollback.

## ข้อความส่งให้ผู้จัด

> ทีม10 บัญชี109991964227 ต้องการใช้ Claude Haiku4.5 ผ่าน Bedrock Mantle แบบ in-Region us-east-1 เพื่อให้ตรง Regionที่อนุญาต. วันที่24ต.ค.2026 CountTokens endpointตอบ403: “anthropic.claude-haiku-4-5 is not available for this account”. กรุณาตรวจ model availability/entitlementและสิทธิ์ที่บัญชีการแข่งขันใช้ได้ โดยทีมจะไม่สมัคร Marketplaceหรือแก้ข้อจำกัดองค์กรเอง. ไม่ขอเปิด geo/global cross-Region profilesที่ส่งข้อมูลไป Regionอื่น.

ข้อความนี้เป็นร่างให้ผู้ใช้ส่งเอง ยังไม่ได้ส่งถึงผู้จัด.
