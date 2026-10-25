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


## 25 October existing-stack update and verification

Fresh STS confirmed109991964227/Singapore. BudgetHackathon-Team10 read preflight06:23:58UTC, review/execute/publish and finalappearance readback:350USDlimit/laggedActualSpend0.033USD, LastUpdated04:22:10UTC. One reviewed existingstack code update:7Lambdas plus unchanged HttpApi dynamic reference refresh; no added capacity/resources/IAM. Verified backend with two isolatedMOCK API sessions, bounded simulations and one Qwen question; browser one additionalMOCK session and one Qwen question. Later frontend/Cognito appearance publish used one furtherMOCK screen-only session, no extra inference. No REALmerchant write, OCR, LINE, training or Marketplace action. Standard API/inference/storage/CDN/build traffic may accrue; no measured final charge/current remaining-credit claim. Total350/trial25 unchanged. Backups /tmp/marginshot-release-20261025-a0nn9bsd ephemeral.


## Product listing release — 25 October 2026

Fresh account109991964227/Singapore/budget gates before build, SAM preparation, review/execute and publication; final read07:41:21UTC: team cap350USD, laggedActualSpend0.033USD, LastUpdated04:22:10UTC, trial target25USD unchanged. First prepare failed before SAM upload on live FeeRules parameter drift; recovered existing source/template and preserved all values rather than dropping settings. One reviewed existing-stack code update, static publish and8path invalidation; no new resources/IAM/capacity, model switch, index rebuild, training or Marketplace action. Two API MOCK sessions plus one browser MOCK session for bounded catalog/cost edits and reads; no REALmerchant writes/model inference/OCR/LINE action. Read-only Qwen metadata gate is not inference. Standard build/API/storage/Lambda/CDN charges may accrue; this is not a final measured cost or current remaining-credit claim. Backups /tmp/marginshot-listing-20261025-15_tvv_j ephemeral; previous sources and recovered pre-price live code retained in Git for reviewed rollback without deleting merchant data.


## Application usage quotas removed — 25 October 2026

User requested all app usage limits removed: no 2-hour guest lifetime, daily/session/write/AI/import/receipt quotas, 100-chat or 200-turn caps. Guest records no longer receive 24-hour TTL; legacy rows read by the app have TTL removed conditionally without changing financial values/version. Opaque guest tokens remain MOCK-only, origin/tenant-bound, revocable and stored in sessionStorage; Cognito remains unchanged. File/content validation, per-request deadlines/token/context bounds, native browser/provider quotas and the $350 team budget remain. Local verification and AWS release evidence follow; deployment is pending at this source commit. No cloud charges from these local tests. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS unchanged.


## 25 October 2026 quota/catalog/campaign release

Verified account109991964227, Singapore, team BudgetLimit350USD; fresh reads at preflight/review/execute/publication. Reported lagged ActualSpend0.033USD, budget LastUpdated04:22:10UTC. This is not a current remaining-credit guarantee or final measured release cost. Existing operator target25USD and350USD total guard remain. User explicitly removed app usage quotas; usage can therefore accrue beyond the former per-user counts, while provider/account constraints still apply.

One reviewed existing-stack code update; seven Lambda modifications plus unchanged generated API references,18static objects and8path invalidation. No new resources, IAM, reserved capacity, training, model switch, fee-index rebuild or Marketplace subscription. AWS verification created isolated synthetic shops and bounded catalog/cost edits only; zero REALmerchant writes and zero model/OCR inference. Pre-release session attempt returned old global daily429; post-release two API test shops and one browser shop succeeded. Keep normal operational cost monitoring; no unused new services were created. Ephemeral backup `/tmp/marginshot-catalog-scenarios-20261025-d1t2140d/pre-release`; rollback source pinned in prepared evidence. Never restore a backup by deleting merchant data.


## 25 October 2026 answer-card/subtotal deployment

Fresh preflight09:12:53UTC and review/execute/publication gates: account109991964227 / ap-southeast-1; team cap350USD, lagged ActualSpend0.033USD, budget LastUpdated04:22:10UTC. Not a final cost or current remaining-credit claim. Existing25USD operator target preserved. One executed existing-stack code update,18static object hashes and8path invalidation. No new services/IAM/capacity, training, model switch, Marketplace or REALstore writes. Two API MOCK sessions plus existing browser shop used; zero AI/OCR inference. Ephemeral backup `/tmp/marginshot-summary-cards-20261025-_y4q47w2/pre-release`; rollback restores code only and preserves merchant data.


## 25 October 2026 general conversation deployment/inference

Fresh preflight09:38:31UTC and review/execute/publication gates confirmed account109991964227 / ap-southeast-1, BudgetLimit350USD, lagged ActualSpend0.033USD with LastUpdated04:22:10UTC. This is not the current remaining credit or final measured inference cost. Existing25USD operator target retained. One executed existing-stack code update,18object hash checks and8path invalidation; no new services/capacity/IAM/model subscription, embedding/index rebuild or training.

Two scripted real general Qwen calls plus one agent-entered browser greeting were executed; an additional user-entered five-greeting browser request was observed. These are scoped test observations, not total account usage. Financial preflight does not generate model output. General inference uses one call/no automatic retries, existing500-token per-request output bound and approved direct us-east-1 runtime. User's removal of daily/session quotas remains in force; provider/account/budget constraints still apply. MOCK-only catalog test mutations, no REALmerchant writes or customer data sent. Ephemeral paired code/static backup `/tmp/marginshot-general-chat-20261025-f8xq1sox/pre-release`; rollback preserves all merchant data.


## 25 October 2026 merchant question library/ranking deployment

Fresh preflight10:11:35UTC plus review/execute/publication gates verified account109991964227 / Singapore, BudgetLimit350USD, lagged ActualSpend0.033USD with LastUpdated04:22:10UTC. Not a current remaining-credit or final measured release cost. Existing25USD operator target unchanged. One executed existing-stack code update,18static object checks and8path invalidation. No new services/roles/capacity/model subscriptions, training or embedding/index rebuild.

100question intent cases run locally/CI without model generation. Choosing a question drafts it; it does not call AI or submit automatically. Live API made one general Qwen generation for the creative discount-reply boundary; browser financial rank2/rank3 used no model generation. MOCK-only shops/catalog test writes; zero REALmerchant writes. User's prior removal of daily/session quotas remains. Ephemeral paired backup `/tmp/marginshot-merchant-questions-20261025-lj1pa4yj/pre-release`; rollback code/static assets together without deleting merchant data.

## Fee-rule RAG/Titan — 25 October 2026

Re-read STS/account109991964227 and Hackathon-Team10 before indexing, preparation, execution and smoke. Budget limit350USD; laggedActualSpend0.033USD, LastUpdated2026-10-25T04:22:10.530UTC. This is not real-time remaining credit; trial target25USD/team350USD unchanged. No new stack/role/OpenSearch/vector-service capacity/reserved capacity/training/Marketplace subscription. Two existing runtime roles received only the explicitly user-approved additive Titan/index-read policy. Existing stack updated once for RAG; the obsolete first change set was not executed after its guard detected the concurrent storefront release.

Index build:134 successful direct Titan Embed v2 calls/24607input tokens. Official us-east-1 price-list observed25Oct, effective1Oct2026, SKU EDNQYEHQ3XQ8N7EY On-demand InvokeModelInference USD0.00002 per1000input tokens: index token-only estimate USD0.00049214, not an observed bill or total AWS cost. Stored3075273bytes of research JSON/vectors on existing private S3 plus SAM artifacts/backups. Four successful operator query embeddings consumed254input tokens; one earlier credential cold-start attempt timed out, invocation/billing status not established. Post-deployment smoke used3 assistant requests with runtime Titan retrieval and bounded Qwen tool invocations. No final token/bill estimate claimed for Qwen, retries/timeouts or total cloud operations.

Verification created1 isolated MOCK store, imported2 tiny synthetic CSVs (1order/3fees), settled/reconciled1order and checked3 financial assistant answers plus auth/tenant reads. No REAL/personal-store data write, live OCR or LINE message. Standard S3/SQS/DynamoDB/Lambda/API/Bedrock/log traffic may accrue. Indexing and successful deployed inference are separate from fee-research verification. Local source/build and audit do not establish cloud billing. Retained historical resources/indexes still count toward usage; no permanent resource/data deletion in this feature.

## Website message router — 25 October 2026

Existing account109991964227, Qwen directus-east-1, regional stackSingapore. Repeated read-only STS/model/budget gates before model evaluations, prepares and executes. Latest preflight08:35UTC: team350USD/trial25USD, laggedActualSpend0.033USD LastUpdated04:22:10.530UTC; not real-time remaining credit. Three development evaluations:68+68+66actual Qwen calls; input50629+64025+62121/output3770+3835+3825 tokens. Additional bounded synthetic operator diagnostics and API smoke used model/Titan calls; no complete token or final bill estimate claimed. Existing daily model/session/store quotas unchanged.

Three reviewed code-only existing-stack updates during router debugging, one76file frontend publish and one7path invalidation. No new IAM/resources/capacity/vector DB, RAG reindex, training, Marketplace or real merchant writes. Existing private index reused. API smoke created isolated MOCK sessions until DEMO_DAILY_LIMIT; stopped and attempted user-offered active tab, which also showed exhausted daily openings. No quota expansion or auth bypass. Standard model/API/Lambda/DynamoDB/S3/CDN/log charges may accrue; retained artifacts/backups remain billable. Evidence ignored tmp/message-router; never publish auth caches.

## Upstream/router local merge — 25 October 2026

User requested pull/merge and later chose local-only completion. Read-only STS/budget/model metadata/live ZIP/template backups plus two SAM preparation uploads were performed before that choice; no new change set executed or frontend published by this merge task. Concurrent releases made the prepared change sets obsolete and guards stopped. No model inference, API test-session creation, reindex/training/IAM or REALmerchant write in this merge round. Budget metadata remained lagged0.033USD (updated04:22:10.530UTC), team350/trial25 unchanged; not current remaining credit. Artifact/S3/CloudFormation/read traffic may accrue. Browser action was denied by automatic approval review due to tool usage limits; no browser-policy bypass. After user selected local-only, no further cloud actions.

## Commit/push/deploy preflight — 25 October 2026

User explicitly authorized publishing this release. Fresh STS109991964227 and Qwen metadata gate12:09:24UTC: budget350USD, laggedActualSpend0.034USD, last updated18:46:19.853+07. Trial25USD unchanged; not final/current remaining credit. Read-only live ZIP/config/template backup matches upstream4a4dca4 source; current codeqG6y/7frojYIlM5zBJV1FGHXG+d0oplqCZ4GOUbc4QE=. SAM code-only preparation on existing stack; no new IAM/capacity/index rebuild/model switch/training or merchant write. Clean local installs audited0vulnerabilities. Final deployment/API usage recorded after execution; existing artifact traffic may accrue.

## Committed router live release and acceptance — 25 October 2026

Fresh account/budget/code/config gates before prepare/review/execute/publish. One executed code-only existing-stack update12:18UTC, one76file static publication and7path invalidation. No new IAM/role/resource/paid capacity/model switch/index rebuild/training/Marketplace operation. Reused pinned private134chunk index. API acceptance created2isolatedMOCK stores and made8assistant requests; one further browserMOCK store and2ranking/follow-up requests. No REALmerchant write/live OCR/LINE message. Standard Bedrock/API/Lambda/DynamoDB/S3/CDN/log charges may accrue; no total token or final bill estimate claimed.

Final metadata12:24:40UTC: team350USD/trial25USD unchanged; laggedActualSpend0.034USD, updated18:46:19.853+07. This is not real-time remaining credit or measured final charges. Source/verification commits pushed in separate batches; auth caches/signed URLs/tokens/private evidence remain ignored. Browser denial was transient and access resumed after its stated retry time, through the original browser surface; no bypass used.


## MOCK reference answers — 25 October 2026

Reused existing Qwen/Titan model, private pinned134chunk index and stack; two code-only updates, no IAM/resource/index rebuild/training/paid capacity changes. Created two isolated MOCK tenants and made eight live assistant requests (four initial discovery, four final exact-source checks). Qwen/Titan/API/Lambda/DynamoDB/log/storage usage may accrue. Read-only preflight13:02:13UTC: laggedActualSpend0.034USD, budget350USD/trial25USD unchanged, budget timestamp18:46:19.853+07. Not real-time remaining credit or a measured final bill. No REAL merchant write or frontend publication.


## 25 October 2026 frontend redesign publication

Fresh STS109991964227 / ap-southeast-1 and budget gates before publication13:10:31UTC: cap350USD total, existing operator trial25USD; laggedActualSpend0.034USD, LastUpdated11:46:19.853UTC. Not current remaining credit or final measured deployment cost.

Frontend-only74file publication and one wildcardCloudFrontinvalidation, with privateS3readback and old-static backup in ephemeralCloudShelltmp. Existing backend was concurrently updated by another release and deliberately preserved after source verification. No new IAM/resources/paidcapacity/model switch/indexrebuild/training/Marketplace action or REALmerchant write. One isolatedMOCK browser session; zero model generations/OCR/LINE calls from this release. Build/static/API/storage/CDN/log usage may accrue; ordinary operational monitoring remains necessary.


## Plain Thai fee answers — 25 October 2026

Two code-only updates to existing stack; reused Qwen/Titan/private index and existing IAM/settings. Eight assistant requests on two isolated MOCK tenants; reference-summary call bounded to500 output tokens, router/planner350, existing deadlines retained. No reindex/training/resource creation/REAL data mutation/frontend publication. Metadata gate13:21:32UTC: laggedActualSpend0.034USD, budget350USD/trial25USD, last budget update18:46:19.853+07. Not final charges or realtime remaining credit. Standard model/API/storage charges may accrue.


## R2 static publication — 25 October 2026

Verified account109991964227 / ap-southeast-1, total team cap350USD and existing trial target25USD. Fresh budget gates; reported laggedActualSpend0.034USD, LastUpdated2026-10-25 11:46:19.853000+00:00; not real-time remaining credit or final release bill. One74file publication and one wildcardCloudFrontinvalidation, plus private readback and old-static backup in ephemeralCloudShelltmp. No new resources/IAM/paidcapacity/model switch/index rebuild/training/Marketplace or backend overwrite. One isolatedMOCK browser shop and one financial assistant request; actualmodel calls/tokens not measured. No REALmerchant writes/OCR/LINE operations. Ordinary build/API/Lambda/Bedrock/DynamoDB/S3/CDN/log usage can accrue.
