## Qwen3 32B บนเว็บจริง — 24 ตุลาคม 2026

**VERIFIED_LOCAL / VERIFIED_AWS สำหรับการเปลี่ยน assistant; สถานะรวม PARTIAL_WITH_EXTERNAL_BLOCKERS.** ผู้ใช้เลือก Qwen3 32B แทน Haikuที่บัญชียังเปิดไม่ได้. Runtime source `db42a835acb05624c460ba967d9e10948f5b07bd` deployแล้วใน stack `marginsight` / บัญชี109991964227 / ap-southeast-1. อ่านกลับ24ต.ค.16:31UTC: UPDATE_COMPLETE, assistant `qwen.qwen3-32b-v1:0` direct Converse us-east-1; OCRยัง `amazon.nova-lite-v1:0`.

Qwenเลือกเครื่องมือที่จำกัดสิทธิ์/ตรวจ SKUและส่วนลด แล้วแอปตอบจาก deterministic engineทันที ไม่มีรอบสรุปตัวเลขจากโมเดล. ไม่มี training/fine-tuningหรือการเปลี่ยนสูตร margin-v1.1.0. คำถามยอดรวมที่ Frontendสรุปจาก APIยังใช้ flowเดิม ไม่จำเป็นต้องเรียกโมเดลทุกคำถาม.

ทดสอบ60ข้อและPythonparameter6ข้อผ่าน; CloudShellNode24ผ่านverify/SAMlint. Deployed API Gateway/Lambda/DynamoDB/Bedrock บนร้านMOCKแยกผ่าน3กรณี โดย responseเป็น `bedrock-tools`/modelQwenจริง: กำไร9.00บาท/margin4.5%, ลด15%ขาดทุน14.10บาท/-8.29%, ราคาคุ้มทุนต่ำสุด188.31บาท. หน้าเว็บMOCKถามส่วนลดแล้วแสดงผลเดียวกันและไม่มีbrowserconsoleerror. Protected APIไม่มีtokenยัง401; ข้ามguesttenantและoriginผิด403. ดูรายละเอียดใน verification.md และคำสั่ง/rollbackใน AWS-HANDOFF.md.

LINEมีconfig/IAMรองรับแต่ยังไม่มีchannelจริง; nativeplatform/บิลจริงพร้อมเฉลย/ครบflowสองบัญชีCognitoยังเป็นblockerเดิม จึงไม่อ้าง FULL_SCOPE_VERIFIED. Frontendไม่มี source/build/deploy ใหม่รอบนี้ เพราะใช้ API contractเดิม.

> ส่วน Haikuด้านล่างเป็นประวัติก่อนเลือกและdeploy Qwen ไม่ใช่สถานะโมเดลปัจจุบัน.

## เปลี่ยนผู้ช่วยเป็น Claude Haiku4.5 — 24 ตุลาคม 2026

**VERIFIED_LOCAL / BLOCKED_EXTERNAL; ยังไม่เปลี่ยนโมเดลเว็บจริง.** โค้ดรองรับ Haikuผ่าน Mantle us-east-1 พร้อม bounded tools/quotas/SigV4/fallback และแยก OCRที่ยังใช้Nova. ทดสอบ Backend57ข้อ+Pythonparameter migration5ข้อผ่าน; typecheck/bundled handlers/contracts/IaCstructure/packagingผ่าน. CloudShellSAMlintผ่าน2templates; ทดสอบpreparegateจริงหยุดก่อนอัปโหลดเมื่อCountTokens403. AWSแจ้งว่าโมเดลไม่เปิดให้บัญชี109991964227; foundation model metadataมี agreementAvailabilityNOT_AVAILABLE. ไม่สร้าง agreement/subscribe/แก้IAM/preparechangeset/deploy/inference. อ่านLambdaenvกลับยืนยันRuntimeเดิมยังNovaLite. ดู [วิธีเปิดและร่างข้อความให้ผู้จัด](haiku-migration.md). สถานะรวมยัง PARTIAL_WITH_EXTERNAL_BLOCKERS; liveHaiku/tool/browserยังไม่ผ่านและไม่ใช้ localstubsแทนหลักฐานจริง.

## จัด repository — 18 ตุลาคม 2026

นำภาพและบันทึก Frontend อ้างอิง3ไฟล์ออกจาก tracked tree ตาม [reference policy](reference-policy.md); ต้นฉบับและสำเนาสำรอง SHA-256 ยังอยู่ในเครื่อง. Clean snapshot ที่ไม่มีไฟล์เหล่านี้ผ่าน `npm ci` / `npm run verify` (50tests, typecheck, bundled Lambda checks, browser contract, infrastructure policy, packaging). Runtime/สูตร/fixtures/contracts/IaC/CIไม่เปลี่ยน และไม่มี AWS deployment รอบนี้. สถานะโครงการยัง PARTIAL_WITH_EXTERNAL_BLOCKERS.

> บันทึกด้านล่างก่อนหัวข้อ Repository split เป็นประวัติจาก monorepo; ignored evidence อยู่เครื่องต้นทางและไม่ได้เผยแพร่ตามไฟล์ลิงก์เหล่านั้น ดู AWS-HANDOFF.md สำหรับคำสั่งปัจจุบัน.

# สถานะ MarginSight — 15 ตุลาคม 2026 (งานเริ่ม14ตุลาคม)

**PARTIAL_WITH_EXTERNAL_BLOCKERS** บัญชี109991964227 / stack `marginsight` / ap-southeast-1; Bedrock direct us-east-1 ตามผู้ใช้อนุญาต

เว็บ https://d2y04qc334m0rd.cloudfront.net

ยังไม่อ้าง CORE_AWS_VERIFIED หรือ FULL_SCOPE_VERIFIED: มี Cognito user ที่ยืนยันอีเมลและผูก MOCK DEMO-001 แล้วหนึ่งบัญชี แต่ยังต้องตรวจ workflow ร้านผ่านบัญชีนี้/สองผู้ใช้สองร้าน และยังไม่มี LINE channel

| งาน | สถานะและขอบเขต |
|---|---|
| สูตรกำไร / margin / fee ratio / TTR | VERIFIED_LOCAL; golden15/9/-14.10บาท, exact satang, VAT/caps/allocation/refunds/history; engineเดียว |
| CSV/XLSX / import1000rows | VERIFIED_LOCAL; VERIFIED_AWS สำหรับ CSV operator smoke ผ่าน privateS3/SQS/Lambda/DynamoDB รวมซ้ำ/ซ้อน/conflict; positive browser importยังไม่ได้ทดสอบ |
| Review / revision / retry | VERIFIED_LOCAL; AWS conflictพักรายงานและรักษายอดเดิม; UIเปรียบเทียบ คงเดิมหรือใช้ใหม่พร้อมrevision/เหตุผล |
| Infrastructure / worker | VERIFIED_AWS stack UPDATE_COMPLETE, health/import/OCR; ดู docs/evidence/aws |
| Auth / tenant | VERIFIED_LOCAL สองผู้ใช้สองร้าน; VERIFIED_AWS_BROWSER บัญชีจริงสร้างร้านส่วนตัว/เปิดร้านว่างได้; AWSสองผู้ใช้และworkflowครบยังไม่ทดสอบ |
| เว็บ | DEPLOYED_UNVERIFIED สำหรับ workflowร้าน; VERIFIED_AWS public MOCK preview + Cognito form; อ่านอย่างเดียวใช้สูตรจริงในbrowser ไม่อ่านฐานข้อมูลร้าน |
| ต้นทุน / rules / enrollment / reconciliation / export | VERIFIED_LOCAL; authenticatedAWS workflow BLOCKED_EXTERNAL; ยังไม่ใช่ REAL platform adapter |
| ผู้ช่วยไทย | VERIFIED_LOCAL orchestration/เลขผิด/provider error/tool bounds; directConverseเรียกสำเร็จ; VERIFIED_AWS operator service: model2calls/toolsจริง + guardedfallbackตรง-14.10บาท; web/Cognitoassistantendpointยังไม่ได้ทดสอบ |
| OCR / confirm | VERIFIED_LOCAL confirm/units/tenant; VERIFIED_AWS extraction1ภาพสังเคราะห์ จำนวน6 ยอด780.00ตรง แต่ชื่อ/หน่วยผิด ต้องตรวจด้วยคน |
| LINE | VERIFIED_LOCAL HMAC/atomic expiring single-use link/event dedup; handlers/queues deployแล้ว; live BLOCKED_EXTERNAL |
| Deploy / cost | VERIFIED_AWS infrastructure และ scopedroles7; Budget350USD total; actual billing snapshotยังล่าช้า |

## สิ่งที่ต้องมีเพื่อปิดงานจริง

1. ทดสอบข้อมูลร้านจริงผ่านauthenticated workflowครบ และบัญชีที่สองสำหรับAWS isolation; การสร้าง/เปิดร้านว่างของบัญชีจริงผ่านแล้ว. เจ้าของกรอกรหัสผ่านในหน้าล็อกอินเอง ไม่ส่งในแชท
2. LINE channel secret/access tokenใน Secrets Manager ที่อนุญาต ตั้ง secretARNและสิทธิ์อ่านเฉพาะARNให้ webhook/worker พร้อม LINE userสำหรับlink/live reply
3. รายงานสินค้า/ออเดอร์/การเงินและ schemaที่ร้านอนุญาต ต้นทุนพร้อมหน่วย หลักฐานเข้าแคมเปญ/กฎจริง เพื่อทำ REAL adapterและกระทบยอด ห้ามอ้าง mock-v1เป็นรายงานแพลตฟอร์มจริง
4. ภาพบิลจริงที่ได้รับอนุญาตพร้อมเฉลย เพื่อประเมินชื่อสินค้า/หน่วย/ยอดมากกว่าภาพสังเคราะห์หนึ่งภาพ

เพดาน prototype: import50files/ร้าน/วัน receipt20files/ร้าน/วัน AI30calls/ร้าน/วัน output500tokens toolไม่เกิน4/รอบ ไม่เกิน3รอบ ไม่ใช่ hard budget cap ดู docs/verification.md และ docs/cost-log.md


รุ่นปัจจุบัน: margin-v1.1.0 / backend39testsผ่าน; ล่าสุด AWS import1000แถวผ่าน transaction-based worker และคำนวณ1000รายการใน5357msด้วยoperatorIAM. เว็บแก้การสลับเมนูแล้ว ตรวจ10เมนูในlocal และยืนยันค่าบริการหลังอ่าน3รายการจริงจากMOCKreportได้. เงินหักใหม่ทำให้ต้องตรวจยืนยันใหม่; แก้ต้นทุนเก็บเวอร์ชันเดิม. ดูรายละเอียด/ขอบเขตหลักฐานในverification ไม่ยกผลoperatorมาแทนCognitoE2E.

แก้ Failed to fetch: OPTIONS preflight204/bodyว่างสำหรับoriginเว็บที่อนุญาต, GETข้อมูลร้านไม่มีtokenยัง401 และoriginอื่นไม่มีACAO. ยืนยันCognitoหนึ่งบัญชี CONFIRMED/email_verified และผูก OWNERเฉพาะMOCK DEMO-001 โดยไม่อ่าน/เปลี่ยนรหัสผ่าน. หลังแก้การเชื่อมต่อและผูกสิทธิ์ ผู้ใช้ยืนยันวันที่15ตุลาคม2026ว่าเข้าสู่ร้านได้แล้ว (USER_CONFIRMED). ยังไม่แทนการทดสอบทุกworkflowหรือสองผู้ใช้สองร้านโดยagent.

USER_CONFIRMED 15ตุลาคม2026: เจ้าของแจ้งว่า “เข้าสู่ร้านได้แล้ว” หลังล็อกอินใหม่. ปิดปัญหา Failed to fetch/เข้าร้านสำหรับบัญชีนี้; คงสถานะ PARTIAL_WITH_EXTERNAL_BLOCKERS สำหรับscopeอื่นตามตาราง.


## Self-service — 15 October 2026

VERIFIED_LOCAL: 39tests/typecheck/build/bundledhandlers/staticexport. เพิ่มauthenticated POST /me/store หนึ่งร้านส่วนตัวว่างต่อsubjectแบบatomic; ไม่รับowner/storeIDจากclient; retriesไม่เพิ่มร้านซ้ำ. เพิ่มmanualproductและmerchant-v1 REALcanonicalimportพร้อมownershipack/requiredmoney/unitvalidation. ตัวเชื่อมnativeplatformยังไม่เปิดเมื่อไม่มีsample/mapping.

VERIFIED_AWS_BROWSER: deployรุ่นใหม่แล้ว และสร้าง TonnamShop ผ่านบัญชีที่ล็อกอินจริงได้ เห็นหน้าเริ่มใช้ร้านว่างพร้อมปุ่มสินค้า/นำเข้า. ไม่เติมสินค้า/ออเดอร์/อัตราจำลองในร้านนี้. [ภาพ](evidence/aws-tonnamshop-self-service.png). ยังไม่อ้าง signupใหม่โดยagentหรือทุกworkflowการเงินจริงบนAWS; ผู้ใช้ตั้ง/กรอกรหัสผ่านเอง. ขอบเขตอื่นยัง PARTIAL_WITH_EXTERNAL_BLOCKERS ตามหลักฐาน.

AWS read-backผ่าน: TonnamShopมีPROFILE+OWNERmembershipตรงกัน, CognitoCONFIRMED/emailverified, catalog0/order0 และPOSTสร้างร้านไม่มีtoken401. [หลักฐาน](evidence/aws/self-service-store-evidence.json). ไม่ต้องมีoperatorผูกร้านสำหรับบัญชีใหม่แล้ว.


## Separate full app demo — 15 October 2026

เตรียมบัญชีCognitoเดโมและร้านMOCKเฉพาะDEMO-FULL-20261015แล้ว พร้อมสินค้า/ต้นทุน/กฎ/โปรแกรม/ออเดอร์/เงินหัก13records. VERIFIED_AWS_OPERATOR atomicwrite/read-back; VERIFIED_LOCAL fixtureengineกำไร9บาทและไม่ให้subjectเข้าร้านเดโมอื่น. รอเจ้าของตั้งรหัสผ่านเองและทดสอบล็อกอินใหม่ จึงยังไม่อ้างว่าเข้าใช้งานบัญชีใหม่นี้สำเร็จ. ไม่แก้ระบบauthหรือสิทธิ์ร้านส่วนตัว. LINE/nativeplatform/OCRgroundtruthและexternalblockersอื่นคงตามตารางเดิม.


## One-click guest demo — 15 October 2026

VERIFIED_LOCAL: เพิ่มปุ่มเข้าเดโมระบบเต็ม สร้างร้านMOCKใหม่ต่อรอบโดยไม่ใช้รหัสผ่าน; sameengine/API/domain, tokenhash+expiry/storebinding, ปิดREAL/personalstore/LINElink, quotasและTTL. 43tests/typecheck/fullbuild/bundledhandlersผ่าน; localbrowserกดปุ่มเข้าdashboardกำไร9บาทและสลับ10เมนูไม่พบruntimeerror. AWSdeployment/guestbrowserE2EยังPENDINGในขณะบันทึกนี้. ดูdocs/demo.md.


## One-click demo AWS read-back — 15 October 2026

Stack marginsight UPDATE_COMPLETE หลัง execute change set samcli-deploy1792042662 (source a2aaeb0), LastUpdatedTime 2026-10-15T05:42:09.587Z. ส่ง web/out ไป private web bucket และ CloudFront; health ผ่าน. Change set ไม่มี Remove/IAM resource ใหม่/definite replacement; table keys และ Cognito route security คงเดิม.

VERIFIED_AWS_BROWSER: กด “เข้าเดโมระบบเต็ม” โดยไม่ใช้อีเมล/รหัสผ่าน ได้ร้าน MOCK เฉพาะ session เห็นรายรับ200 กำไร9 margin4.5% TTR28%; จำลองลด15% ได้รายรับ170 ค่าบริการ39.10 กำไร-14.10 ราคาที่ตรวจแล้วไม่ขาดทุน188.31บาท. เปิด10เมนูได้. ผู้ช่วยจากหน้าเว็บคืน MODEL_NUMBERS_REJECTED แล้วใช้ deterministic fallback แสดง-14.10ถูกต้อง; ไม่อ้างว่าคำตอบโมเดลผ่าน numerical validation. LINE แสดงไม่มีChannelและปิดปุ่มlink.

VERIFIED_AWS_HTTP 05:46:47Z: ออก guest capability สองรอบ ได้คนละร้าน, dashboard900สตางค์, scenario-1410สตางค์; cross-store403, guesttokenบนnormalCognito route401, ไม่มีtoken401. ไม่บันทึกtokenหรือรหัสผ่าน. [ภาพเดโม](evidence/aws-oneclick-demo.jpg), [HTTP evidence](evidence/aws/guest-demo-live-evidence.json).

ยังไม่ใช้ผลguestแทนสองบัญชีCognito/ข้อมูลร้านจริง; import/OCR/review/confirm/exportทุกขั้นผ่านguest browserยังไม่ตรวจครบ. Local43testsและผลoperatorเดิมมีขอบเขตตามส่วนก่อนหน้า. สถานะทั้งโครงการ PARTIAL_WITH_EXTERNAL_BLOCKERS; LINE/nativeplatform/realreceipt groundtruth ยังต้องมีข้อมูลภายนอก.


## UI redesign — 15 October 2026

VERIFIED_LOCAL: ดีไซน์ใหม่หน้าเริ่มต้น/onboarding/preview, 10เมนู, error/404; CSS/SVGร่วมกันและresponsive drawer. ตรวจครบ10เมนูบนคอม/390px ไม่มีpageoverflow, Escapeคืนfocus, XLSXรับ1และไฟล์ซ้ำduplicate1, เพิ่มสินค้า/ต้นทุน154.50/หลักฐานแคมเปญผ่านUI. Golden9และ-14.10บาทตรงเดิม. 43tests/typecheck/policy/bundledhandlers/build/packageผ่าน; error/404ที่เพิ่มท้ายรันwebbuildผ่านซ้ำ.

VERIFIED_AWS_BROWSER: เผยแพร่staticจากad7bb9fบนS3/CloudFrontเดิมและhealthผ่าน; เข้าguestMOCK, เปิด10เมนู, dashboard9บาท, simulation15%=-14.10บาท. นำเข้าorders.xlsxผ่านbrowserจริงสำเร็จรับ1/ซ้ำ0/ผิด0/conflict0. Cognitoclassicbrandingจาก26ad3e6อ่านกลับCSSตรง/มีlogo, ตรวจหน้าsignup/signinจริงโดยไม่submitcredentialsหรือสร้างบัญชีใหม่. ไม่อ้างว่าได้ทดสอบทุกmutation, liveOCR, LINEหรือสองบัญชีCognitoครบflowในรอบนี้.

ดูการออกแบบและขอบเขตผลตรวจ (ไฟล์อ้างอิงเฉพาะเครื่อง: `docs/ui-design.md`), ภาพAWS MOCK (ไฟล์อ้างอิงเฉพาะเครื่อง: `docs/design/marginsight-desktop.jpg`). การเปลี่ยนรอบนี้เป็นwebstaticและCognitoappearance ไม่มีIAMroles/บริการใหม่/การเปลี่ยนสูตร. คงPARTIAL_WITH_EXTERNAL_BLOCKERSตามรายการข้อมูลและintegrationเดิม.


## Repository split — 15 October 2026

VERIFIED_LOCAL: standalone install/build/test completed for both repositories. Backend43 tests and bundled handlers pass; Frontend5 golden/artifact checks, TypeScript and Next static export pass. No new AWS deployment or resources in this split. Project remains PARTIAL_WITH_EXTERNAL_BLOCKERS. See AWS-HANDOFF.md for current runbook.

## Assistant platform/campaign selection — 18 October 2026

VERIFIED_LOCAL / VERIFIED_AWS for this feature slice: Frontend f7dcc060b6a5d885f864da9ae42659eb5874d4ef and Backend 5fb6ed2d1a5f139678e48d89db9df36461088278 are deployed. Assistant supports Shopee PRIME/LiveXtra, Lazada Premium and TikTok BCD/Flash Sales with merchant-confirmed base fees, VAT, category and exemptions. Deterministic engine margin-v1.1.0 calculates hypothetical selected-SKU scenarios, discount, break-even and comparison without changing actual orders or joining campaigns. Unknown rates remain incomplete. Local/CloudShell verification: Backend50 and Frontend21 tests pass, builds and packaging pass. Actual AWS browser tested all three platform calculations and TikTok exclusivity at1440/390px; no horizontal overflow. See assistant-marketplace.md and verification.md for boundaries/evidence. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS remains; existing LINE/native-platform/real-OCR/two-Cognito-user full workflow evidence is unchanged.


## Product name — 23 October 2026

MarginShot is the current user-facing product name. VERIFIED_AWS branding source Frontend330cf09/Backend4405954 includes website, assistant/export copy and Cognito logo. Existing GitHub repository names/AWS identities/API health identifier remain compatible. Local/CloudShell53+50 tests and published name checks pass; see verification.md/cost-log.md. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS and prior external integration limitations remain.


## Expanded storefront catalog — 25 October 2026

VERIFIED_LOCAL only: fresh guest sessions seed seven products (five added), keep MOCK provenance, use ordinary shop/product labels and readable identifiers; legacy fixtures remain supported. Backend verification passed 61 tests/build; see verification.md. Existing AWS sessions/data are unchanged. No commit, push or deployment. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS remains.


## Assistant scenario repair — 25 October 2026

VERIFIED_LOCAL: five added SKUs now have linked single-SKU MOCK orders/posted fees. Local startup upgrades eligible guest sessions without resetting chat; no REAL/personal migration. Backend62 tests plus6 Python tests pass; CAP-005 browser retry returned28.12THB after15% discount. Expanded storefront dashboard is1075THB revenue/268THB profit across6orders; legacy BAG-001 goldens unchanged. User authorized pushing the current changes; no AWS deployment. See verification.md. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS remains.


## Expanded storefront verified live — 25 October 2026

VERIFIED_AWS: Backend031467b deployed through reviewed existing-stack update; freshMOCK sessions have7products/6orders and all five added SKUs support discount scenarios. API and browser Qwen CAP-00515% returned28.12THB/20.81%.62tests+Python6pass; no auth/IAM/data replacement. Frontend2bc06b9 theme/Sign-in follow-up is live without another Backend update. See verification.md. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS unchanged.


## Product listing persistence — 25 October 2026

VERIFIED_LOCAL; AWS pending at this commit. Manual/CSV creation saves price and entered quantity. Existing products have an edit form with conflict protection; unknown remains unknown and historic finance is unchanged. See product-listing.md and verification.md. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS remains.
