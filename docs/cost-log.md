## Qwen3 32B rollout — 24 October 2026

อ่านBudgetHackathon-Team10ก่อนinference/prepareและก่อนexecute: limit350USD; snapshotหลังตรวจยังActualSpend0.028USD/LastUpdated2026-10-24T11:22:14.710Z. เป็นbillingล่าช้า ไม่ใช่ยอดคงเหลือปัจจุบัน. งบทดลอง25USD/เครดิต350USDรวมทีมยังเดิม.

ตรวจ [AWS regional Bedrock Price List us-east-1](https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonBedrock/current/us-east-1/index.json): Qwen3 32B standardon-demand input0.00015USD/1Ktokens และoutput0.0006USD/1Ktokens (0.15/0.60USDต่อ1M). ไม่ใช้ราคาSydney/priority/flex/MantleแทนdirectConverseus-east-1. Finaloperator3callsใช้2367input+94outputtokens คิดเฉพาะinferenceประมาณ0.00041145USD; ไม่ใช่ค่าใช้จ่ายรวมการทดสอบหรือยอดbillจริง. มีprobe/รอบแก้/การทดสอบLambdaและbrowserเพิ่มเติม; กันประมาณการAIสำหรับverificationต่ำกว่า0.25USD ไม่ใช่hardbillingcap.

ใช้existingLambda7/on-demandDynamoDB/S3/API/Bedrock ไม่มีtrainingjob/GPU/provisionedcapacity/NAT/EC2/stackใหม่. เตรียม/execute2change sets มีSAMartifactZIPประมาณ15.3MBต่อรุ่นในbucketเดิมและtemplate; ค่าstorage/logs/requestsคิดตามจริง. สำรองรุ่นก่อนหน้าในCloudShellเพื่อrollback; ไม่ลบข้อมูลเดิม. เพิ่มexactmodelInvokepolicyให้2rolesเดิมเท่านั้น. ไม่สมัครMarketplace/สร้างagreement/ออกองค์กร. Frontendไม่publish/CDNไม่invalidateรอบนี้.

Qwenปิดthinking/outputไม่เกิน500tokensและปิดSDKretry; ตอบจากengineหลังvalidtoolแรก ทำให้goldenหนึ่งคำถามเหลือ1inferenceแทน2. Attemptedcallquota/guestexpiry/tenantguardsเดิมยังบังคับ และไม่ใช่เพดานค่าใช้จ่ายจริง. OCRยังNovaและไม่ได้เรียกในงานนี้. Kill switchยังAIEnabled=falseผ่านreviewedstackupdate; storage/logsยังคิดเงิน.

> ส่วน Haikuด้านล่างเป็นประวัติก่อนQwenrollout.

## Haiku4.5 preparation — 24 October 2026

ตรวจ STSบัญชี109991964227/stackเดิม และ BudgetHackathon-Team10ก่อนprobe: limit350USD; ActualSpend0.028USD, LastUpdated2026-10-24T11:22:14.710Z. เป็นยอดbillingที่ล่าช้า ไม่ใช่เครดิตคงเหลือทันที. งบทดลอง25USD/เครดิต350USDรวมทีมยังเดิม. ทำ read-onlymetadataและ CountTokens2ครั้งด้วยข้อความสังเคราะห์ Hello ผ่าน Mantle us-east-1 (probeแรกและทดสอบpreparegate); ทั้งคู่ได้403accountavailability. ตรวจSAMlint2templatesและอ่านLambdaenvเฉพาะmodel/region/AIflagกลับ. ไม่มี inference/modeltraining/Marketplaceagreementหรือsubscription/IAMchange/SAMupload/changeset/deployment/CDNinvalidation/paidcapacity/merchantwrite. Localnpmติดตั้งSDKและtests/buildไม่ใช่การใช้AWSinference. เตรียมadapter/config/policyproposal/runbookไว้ในGit; ยังไม่เปิด HaikuแทนNovaบนเว็บจริง. ต้องตรวจราคาของHaikuและงบใหม่ก่อน realinferenceเมื่อผู้จัดเปิด access.

## Repository cleanup — 18 October 2026

จัดไฟล์อ้างอิงใน Git เท่านั้น ทดสอบ clean snapshot ในเครื่อง ไม่มี AWS API/deploy/invalidation/model call หรือทรัพยากรใหม่. ค่า billing ด้านล่างเป็นผลตรวจรอบก่อน ไม่ใช่การอ่านงบใหม่ของงานจัดไฟล์นี้.

> บันทึกด้านล่างก่อนหัวข้อ Repository split เป็นประวัติจาก monorepo; ignored evidence อยู่เครื่องต้นทางและไม่ได้เผยแพร่ตามไฟล์ลิงก์เหล่านั้น ดู AWS-HANDOFF.md สำหรับคำสั่งปัจจุบัน.

# Cost log — 14–15 October 2026

บัญชี109991964227 / ap-southeast-1; directAIus-east-1ตามผู้ใช้อนุญาต ไม่มีMarketplace/ออกองค์กร/แก้SSOpermissions

Budget Hackathon-Team10 limitUSD350 total / ANNUALLY. ActualSpend0.008USD LastUpdated2026-10-15T03:55:27.194000Z จาก inventoryรอบแก้login15ตุลาคม ยอดยังล่าช้า จึงไม่รับรองว่านี่คือค่าใช้จ่ายปัจจุบันหรือเหลือ350เต็ม Creditspage0ไม่แทนเครดิตองค์กร

งบทดลองเป้าหมาย25USD; [rough estimate](cost-estimate.md)1–5USD/monthสำหรับworkloadเล็ก. AWSCalculatorLambda0.25USD/monthเป็นเพียงLambda ไม่ใช่ราคาทั้งระบบ. ค่าใช้จ่ายจริงตรวจBills/CostExplorerหลังอัปเดต

สร้างstackmarginsight: CloudFront/staticweb + protectedAPI, Cognito, on-demandDynamoDB4, privateS3สองbucket, Lambda7, SQS/DLQ3, logs7days และSAMartifactbucket. [รายการจริง](evidence/aws/aws-deployment-evidence.json)

Lambdaaccountconcurrency10; ไม่reserveเพราะขั้นต่ำ100unreserved คิวworker max2/batch1/visibility360s/timeout60s ไม่ใช้provisioned/EC2/NAT/RDS/GPU

AI30calls/ร้าน/วัน output500tokens/round/timebounds; import50files/ร้าน/วัน receipt20files/ร้าน/วัน CSVXLSX5MB/1000rows image3MB/20MP. Failedattemptsนับด้วย ไม่ใช่ hardfinancialcap. Kill switch AIEnabled=false และpauseeventmappingsตามrunbook

ทดลองMOCKimport1000rows/overlap/conflict/OCR1image และmodelcallsปริมาณเล็ก ข้อมูลสังเคราะห์ยังเก็บเพื่อตรวจหลักฐาน คิดstorageตามจริง

## Retained resources จาก rollback

DELETE_SKIPPED; ไม่ได้ลบหรือถือว่าstorageฟรี ต้องตรวจจำนวน/ขนาดและขออนุญาตก่อนลบถาวร

- marginsight-demo-Catalog-KAHQ7RFX7KK5
- marginsight-demo-Jobs-1IC9LFAVI5ZR6
- marginsight-demo-Ledger-GASBWU5GT3BK
- marginsight-demo-Memberships-89V12HT7I5UV
- marginsight-demo-uploadsbucket-dxd0qamvvx2x
- marginsight-demo-webbucket-sjcknej1cgqr

IAMroles7ของstackใหม่สร้างแยกจากCloudFormation ต้องจัดการแยกเมื่อได้รับอนุญาตteardown

ตรวจ2026-10-14T17:01:29Z (15ตุลาคมเวลาไทย): retainedDynamo approximatecount/size0 และS3emptyAtChecktrue; LINEqueuepollerDisabledเมื่อsecretว่างผ่านIaC ไม่ลบdata [storageevidence](evidence/aws/aws-storage-inventory.json). การเรียกAIserviceรอบสุดท้าย2callsพร้อมtoolsและguardedfallbackเป็นMOCK ไม่ใช่training.


รอบส่งมอบ15ตุลาคม: อัปเดตโค้ด Lambda7ตัวและไฟล์เว็บบนทรัพยากรชุดเดิม ไม่เพิ่มบริการ/roles/paid capacity. ทำ MOCK import1000อีก1ชุด พร้อมoverlap5/conflict1 และอ่าน/คำนวณ/เก็บsynthetic snapshots1000รายการ benchmark5357ms. เก็บรายงานตามstore IDsเพื่อแยกการทดสอบ. ภาพบิลและข้อมูลทดสอบยังมี storage cost; LINEpollerยังDisabled. ไม่มีการฝึกโมเดล.

รอบแก้login: อัปเดตAPI route/permissionเฉพาะOPTIONS และhandler204 พร้อม invoke seedสำหรับverified Cognito userหนึ่งบัญชีในMOCK DEMO-001. ไม่มีmodelcalls/บริการคำนวณใหม่/paid capacity. Public financial APIsยังprotected.

Self-service15ตุลาคม: deployโค้ดLambda/เว็บบนบริการเดิม ไม่มีIAMroleหรือบริการใหม่; เพิ่มprivatePROFILE/OWNERmembershipของTonnamShop2rowsและอ่านตรวจร้านว่าง. ไม่มีmodeltraining/modelcallsจากflowนี้. Budgetอ่าน04:49ZยังActualSpendUSD0.008 timestamp03:55:27.194Z จึงไม่ใช้เป็นยอดreal-time. หนึ่งร้านส่วนตัวต่อบัญชีและimport/AIlimitsยังใช้เดิม.


15ตุลาคม2026 12:16น.ไทย: ตรวจบัญชี109991964227และBudget Hackathon-Team10ซ้ำก่อนเตรียมเดโม. limit350USD; ActualSpendยัง0.008USDจากsnapshot03:55:27.194Zเดิม ยอดล่าช้าไม่ใช่ยอดคงเหลือทันที. สร้างCognitoเดโม1บัญชีและMOCK13recordsในDynamoDBตารางเดิม ไม่มีstack/role/paidcapacityใหม่ ไม่เรียกAIหรือส่งอีเมลในรอบเตรียม. รอตั้งรหัสโดยผู้ใช้และทดสอบCognito/browser; เมื่อทดลองAI/OCRยังอยู่ภายใต้limiterเดิม.


15ตุลาคม2026 รอบone-clickdemo: อัปเดตstack/7Lambdaบนบริการเดิม ไม่เพิ่มIAMrole/paidcapacity/trainingjob. เปิดDemoEnabled พร้อมTTL4ตาราง/lifecycleS3guest1วันและglobal/sessionquotas. ทดสอบguest3sessions (browser1+HTTP2), จำลองราคา2ครั้ง และผู้ช่วยผ่านbrowser1request; อาจมีหลายmodelcallsภายใต้orchestrationlimit จึงไม่อ้าง1request=1inference. ทำCloudFrontinvalidation3paths. Budgetก่อนเริ่มยังActualSpend0.008USDจากsnapshot03:55:27.194Z ไม่ใช่ยอดreal-time. กำหนดเป้าหมายทดลอง25USDภายใต้เครดิตทีม350USDรวม; ไม่รับรองhardcapจากBudgets.


15ตุลาคม2026 รอบUIredesign: ตรวจBudgetHackathon-Team10ก่อนpublish limit350USD; ActualSpendยัง0.008USD snapshot03:55:27.194Z จึงไม่รับรองยอดปัจจุบัน. BuildในCloudShellและอัปเดตไฟล์S3/CloudFrontเดิมจากad7bb9f, invalidation4paths IWA6VTMIP623AYBMJGS8C50GH. ปรับCognitoappearanceของappclientเดิมด้วย26ad3e6 ไม่มีนโยบายauthใหม่/roleใหม่/paidcapacity/trainingjob. ทดสอบAWSguest1รอบ/จำลองราคา1request/XLSX1ไฟล์1แถว และเปิดเมนูอ่านข้อมูล; ไม่มีAI/OCRinferenceในรอบUIนี้. การทดสอบlocalไม่คิดเป็นAWSverificationหรือAWSmodelusage. เพดานทีม350USDรวม/เป้าหมายทดลอง25USDและquotasเดิมยังใช้.


## Repository split — 15 October 2026

15 October 2026 repository split: local installs/builds/tests and GitHub source publication only; no AWS API/model/deploy/resource actions performed in this slice. No new spend/credit reading claimed. Team total cap350USD and trial target25USD remain; re-read billing before the next cloud operation.

## Assistant platform/campaign release — 18 October 2026 (Bangkok)

Before preparation: STS109991964227, marginsight Singapore UPDATE_COMPLETE; BudgetHackathon-Team10 limit350USD/ActualSpend0.02USD, lastUpdated2026-10-17T02:23:35.531Z (lagged, not current remaining credit). Trial target25USD and total350USD unchanged. Built both repos in CloudShell/tmp; SAM prepared then executed reviewed code-only existing-resource update, published static frontend once and one7-path CloudFront invalidation. No new resources, IAM roles, regional service, model capacity or training. All scenario calculations use the existing API deterministic engine; no inference/OCR/LINE call. Verification created two isolated MOCK sessions (API/browser) with bounded scenario posts and reads, no real merchant writes. Standard CloudShell/S3/Lambda/DynamoDB/CDN usage may accrue; no estimate is represented as actual spend. Existing retained services still count toward budget.

Frontend rollback snapshots: /tmp/marginsight-campaign-kybr58m0/pre-release in the current ephemeral CloudShell. Durable prior frontend release5c769793245d1ce3adb5d59f6435642c31d41fd4 and backend parent22872bf remain in Git; rebuild/review/redeploy preserved parameters to roll back, never delete store data. Current runtime Frontendf7dcc06/Backend5fb6ed2; later docs-only commits do not change published release markers.


## MarginShot branding release — 23 October 2026

Re-read STS109991964227 and BudgetHackathon-Team10 before preparation: limit350USD/ActualSpend0.026USD, LastUpdated2026-10-23T12:43:59.593Z (lagged, not current remaining credit). Existing Singapore stack only; team total350USD/trial target25USD unchanged. One reviewed code-only stack update, one static publish/7-path invalidation, and presentation-only Cognito logo customization. No new resource/role/reserved capacity/training/inference/OCR/LINE message or new demo seeding. Standard CloudShell/S3/Lambda/CDN/API usage may accrue. Previous release backup and logs in /tmp/marginshot-brand-20261023-pmmu_rmz are ephemeral; prior source Frontend3219d16/Backendeb7e7f9 remains in Git for reviewed rollback. Do not delete store data or change OAuth/resource identities to roll back branding.


## Storefront seed change — 25 October 2026

Local API/fixtures/tests/build only; AI_ENABLED=false locally. No AWS resource/API/deployment/model/training action in this slice. No new cloud spend from these operations; existing retained resources may still accrue charges. No fresh credit/spend read performed.
