# ไฟล์อ้างอิงที่เก็บเฉพาะเครื่อง

ตั้งแต่ 18 ตุลาคม 2026 นำภาพใน `docs/design/` และบันทึก Frontend รุ่นเก่า `docs/ui-design.md` ออกจากไฟล์ที่ติดตามใน repo Backend. โค้ด API/domain tests fixtures contracts IaC scripts CI คู่มือใช้งาน/ขึ้นระบบ และหลักฐานการตรวจแบบข้อความคงอยู่.

ไฟล์เดิมยังอ่านได้ในเครื่องเจ้าของที่ path เดิม และมีสำเนาสำรองนอกสอง repo ใน `.local/repo-reference-archive/2026-10-18/` ภายใต้ workspace พร้อม manifest SHA-256. `.gitignore` กันนำกลับขึ้น Git โดยไม่ตั้งใจ. เครื่องที่ clone ใหม่ไม่ต้องมีไฟล์เหล่านี้เพื่อ build/test/deploy; ห้ามใช้เป็น dependency ของ scripts.

บันทึกเก่าอาจกล่าวถึงภาพ/รายละเอียดที่เก็บเฉพาะเครื่อง ดู [verification](verification.md), [สถานะ](status.md), [งบ](cost-log.md) และ [runbook](../AWS-HANDOFF.md) สำหรับขอบเขตหลักฐานที่เผยแพร่. การจัดไฟล์นี้ไม่เปลี่ยน runtime/AWS และไม่ลบประวัติ Git เดิม.
