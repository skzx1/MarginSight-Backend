# MarginShot Backend

Backend repository ที่ติดตั้ง/ทดสอบ/build ได้ด้วยตัวเอง แยกจาก [MarginSight-Frontend](https://github.com/skzx1/MarginSight-Frontend).
ต้นทางและประวัติเดิมอยู่ [NTT-DATA](https://github.com/skzx1/NTT-DATA) ดู [SOURCE.md](SOURCE.md).

## เริ่มใช้งาน

ใช้ Node.js 24:

```bash
npm ci
npm run dev
npm run verify
```

Local API อยู่ http://localhost:4051 ข้อมูลสังเคราะห์บันทึก .local/ โดย dev server; เปิด Frontend อีก terminal ที่ http://localhost:4050 เพื่อใช้หน้าจอ. npm run smoke:local ใช้ seed local ที่ยังไม่ถูกแก้ และไม่ใช่การทดสอบ AWS.

`npm run build` สร้าง `backend/dist/`; `npm run package:deploy` เตรียม `artifacts/deploy/` (ไม่ใช่การ deploy).

## โครงสร้างและขอบเขต

- `backend/src/`: API, domain engine, repository/adapters, assistant/OCR/LINE และ worker
- `backend/tests/`: financial, import, auth/tenant/security, integration tests
- `fixtures/mock-v1/`: ข้อมูลสังเคราะห์ ไม่ใช่ rate/report ของแพลตฟอร์มจริง
- `template*.yaml`: SAM/CloudFormation รวม hosting/auth/storage; `backend/dist/` เป็น Lambda build output
- `contracts/browser-preview/`: JS/types/manifest ที่ export ให้ Frontend
- `scripts/prepare-update.py`: เตรียม update ของ stack เดิมและรักษา parameters (ไม่ execute)

## ขึ้น AWS / ส่งต่อให้ AI

เริ่มที่ [AWS-HANDOFF.md](AWS-HANDOFF.md): target/config, build, change set, publish, acceptance, rollback และ prompt พร้อมส่งให้ AI.
บัญชีเดิม 109991964227 / ap-southeast-1 / stack marginsight; AI direct us-east-1.
Backend เป็นเจ้าของ AWS stack ทั้งชุด Frontend publish ไฟล์เข้า bucket เดิม ไม่มี stack ที่สอง.
ไม่ต้อง deploy AWS เพียงเพราะแยก repo. บัญชีใหม่ต้องตรวจ guard/config/สิทธิ์ก่อนตามคู่มือ.

## สัญญาระหว่าง repo และหลักฐาน

- [วิธีแยก repo / sync สูตร / ownership](docs/repository-split.md)
- [รูปแบบไฟล์](docs/data-contracts.md), [นโยบายคำนวณ](docs/calculation-policy.md), [วิธีใช้](docs/usage.md)
- [สถานะ](docs/status.md), [ผลตรวจ](docs/verification.md), [งบ](docs/cost-log.md)
- [แผนทั้งระบบ](plan.md), [ข้อกำหนด agent](AGENT.md)
- [นโยบายภาพ/บันทึกอ้างอิงที่เก็บเฉพาะเครื่อง](docs/reference-policy.md)

สถานะทั้งโครงการยัง **PARTIAL_WITH_EXTERNAL_BLOCKERS** ตามข้อจำกัด LINE/native platform/real OCR ground truth และการตรวจครบ flow ด้วยสองบัญชี Cognito. เว็บจริงยังใช้โมเดลสำเร็จรูป Nova Lite และไม่ได้ fine-tune; สูตรการเงินมาจาก deterministic engine. ผู้ใช้เลือก Claude Haiku4.5 แล้วและโค้ดรองรับ แต่การสลับ AWSยังถูกบล็อกด้วย account availability403 ดู [สถานะ/วิธีเปิด Haiku](docs/haiku-migration.md). OCRยังใช้ Novaแยกจากแชต.
เอกสารประวัติที่คัดมามีผลตรวจ monorepo ก่อนแยก และอาจอ้างหลักฐานที่เก็บเฉพาะเครื่องต้นทาง ไม่ได้ส่งข้อมูลส่วนตัว/ignored evidence เข้า repo นี้. ผลตรวจ repo ที่แยกอยู่ท้าย docs/verification.md.
