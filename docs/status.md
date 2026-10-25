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


## Fee Rules preservation before listing release — 25 October 2026

Recovered already-deployed Fee Rules source/template omitted from Git before continuing product-price deployment. Backend70 local tests now pass, Frontend56 unchanged; no removed live parameter/IAM/region/model/index change. See verification.md. Deployment pending; PARTIAL_WITH_EXTERNAL_BLOCKERS remains.


## Product prices live — 25 October 2026

VERIFIED_AWS for product listing persistence and corrections. Frontendf9bc84e/Backend5b61c6a deployed and checked; local/CloudShell56+70tests/Python6. Price and merchant-entered quantity survive create/edit/refresh; cost/history unaffected; zero/missing and tenant/version guards pass. Existing Fee Rules runtime/parameters preserved. Old discarded inputs require one manual re-entry. See latest verification.md and product-listing.md. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS remains.


## Seven MOCK product listings — 25 October 2026

VERIFIED_LOCAL Backend73 tests/build/bundled handlers/unchanged contract. All seven guest fixtures have explicit MOCK price/quantity; existing guest catalogs fill only missing fixture fields using conditional writes. No REAL/personal/custom/edited values or historical finance changed. See storefront-listings.md. AWS deployment pending at this commit; PARTIAL_WITH_EXTERNAL_BLOCKERS remains.


## Application usage quotas removed — 25 October 2026

User requested all app usage limits removed: no 2-hour guest lifetime, daily/session/write/AI/import/receipt quotas, 100-chat or 200-turn caps. Guest records no longer receive 24-hour TTL; legacy rows read by the app have TTL removed conditionally without changing financial values/version. Opaque guest tokens remain MOCK-only, origin/tenant-bound, revocable and stored in sessionStorage; Cognito remains unchanged. File/content validation, per-request deadlines/token/context bounds, native browser/provider quotas and the $350 team budget remain. Local verification and AWS release evidence follow; deployment is pending at this source commit. No cloud charges from these local tests. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS unchanged.


## AWS verified: app usage quotas and catalog campaign chat — 25 October 2026

Deployed and verified account109991964227 / ap-southeast-1. Runtime Frontend `a8bcfa0f1909b6097631d4b7c4626766f06f8fda`, Backend `83200ebf9c5b46d18fd1d5c508c3a8e105b0d326`. Existing stack UPDATE_COMPLETE; change set `samcli-deploy1792918702` executed08:59:49UTC; frontend published09:01:23UTC; CloudFront invalidation `I8Y1M6P0CYSESHNDP7MOCQTYCY` Completed. Seven Lambda code hashes and18 published object hashes verified. No infrastructure/config/IAM/resource replacement or new services.

Removed app-imposed 2-hour session lifetime and daily/session/write/AI/import/receipt quotas plus100-chat/200-turn caps. Existing global daily quota demonstrably rejected pre-release creation; post-release new sessions succeed with nonExpiring:true. AWS test backdated the old expiry on an agent-owned MOCK session and verified continued access plus removal of obsolete TTL. Origin/tenant binding, revocation, Cognito, payload validation and bounded individual requests remain. Tokens remain in sessionStorage; closing the browser session can still end local access. AWS service quotas and actual team budget remain.

Seven MOCK fixtures have prices/quantities; catalog discounts work without orders. Campaign popup is checkbox/radio-only, with shared Playground rules, seller options and no numeric/select/details form. Unknown base fees stay unknown. Browser BAG-001200→160/cost130 gives30 before expenses; selected Lazada Premium known fee13.70, no fabricated net profit. Monthly all-SKU answer remains268 from6 recorded orders, independent of selected hypothetical campaign. API no-order ASAW-QA250→200/cost120 yields80 before expenses, netProfit:null; historical dashboard/catalog unchanged. No REAL store writes or model/OCR inference in this release verification.

Status remains PARTIAL_WITH_EXTERNAL_BLOCKERS for the previously recorded real receipt/OCR evaluation, LINE live credentials/message, native platform evidence and two real Cognito-account acceptance gates. These feature-specific checks do not claim full-system/live-merchant verification.


## Requested answer cards and listed-fee subtotal — local verification

Frontend70 and Backend81 tests/builds pass. Catalog answers now include a separate summary card with original/discounted price, cost, calculated fees and backend-owned remaining-after-known-fees subtotal. Monthly result cards remain actual-order measures. Removed the requested long base-fee warning; the numeric subtotal explicitly deducts only calculated fee lines, while missingFields and netProfit:null remain unchanged. Unknown fees/costs are not converted to zero or described as complete net profit. Verified hypothetical200THB discounted price,120cost,24.19known fees gives55.81remaining; complete44.19fees gives35.81. No financial history or campaign enrollment mutation. Deployment pending at this source commit.


## AWS verified: numeric answer cards and listed-fee subtotal — 25 October 2026

Runtime Frontend `d2f12d52433ecae3b2ccafbffd4a6fd7c91ca7ed`, Backend `8ee733d91fa95af292fbf63d621c9a6f9ff48195`. Reviewed exact logged change set `samcli-deploy1792919770` executed09:17:57UTC; stack UPDATE_COMPLETE, seven Lambda hashes match reviewed bundle. Frontend published09:19:53UTC,18object hashes verified; invalidation `I78F5Y93IWBFWO9FPFJ046THQ6` Completed, public release commit matches. No resource/parameter/IAM changes.

AWS API09:21:06UTC: catalog250→200, cost120, known Lazada fees17.12, remaining62.88. Full platform fee total and net profit remain null when base rates/other expenses are missing; no zero substitution or financial-history writes. Requested long warning removed from new answers, replaced with numeric subtotal and a clear listed-deductions scope. Browser existing session survives reload; BAG-001200→160, cost130, fees13.70, card remaining16.30. Card has per-unit scope, rows and collapsed calculation detail; monthly recorded268/6orders unchanged. Old historical replies remain unchanged; ask again or regenerate to see the new card.

All earlier usage-quota removals remain active. PARTIAL_WITH_EXTERNAL_BLOCKERS unchanged for external acceptance inputs previously listed.


## General conversation — local verification, 25 October 2026

Frontend75 / Backend87 tests and builds pass. User-authorized general conversation uses existing Qwen3 32B direct us-east-1, no new model/training/service/role. Existing /assistant POST accepts strict mode:chat; server classifies actual shop calculations without generation, which continue to the deterministic catalog/order adapters. General text generation has no tools, retrieval, SKU, store records or live web access. Only four completed general exchanges are sent as bounded untrusted context, with per-request size/deadline limits. General answers have separate provenance, no fake financial card/monthly reference. Provider failure is an honest retry notice; membership/origin isolation unchanged. AWS deployment and real inference pending at this source commit. PARTIAL_WITH_EXTERNAL_BLOCKERS remains for existing external integrations.


## AWS verified: general Qwen conversation — 25 October 2026

Runtime Frontend `4855e61665991fbe9f7ff9a7f35928598fb962b7`, Backend `8c3708d017d39be6be14d594559ab3cd984e5bd3`. Account109991964227/Singapore. Exact logged change set `samcli-deploy1792921559` executed09:47:01UTC, stack UPDATE_COMPLETE. Seven Lambda code hashes verified; static publication09:48:57UTC,18object hashes match. Invalidation `I2V29V9UJ7J9LEM3AOEIK7N13S` Completed; public release commit matches. No new resources/roles, parameter/route/model changes or training.

Real AWS API09:50:32UTC: Qwen3 32B directly generated a Thai greeting and an English follow-up using conversational context. Both provider=bedrock-chat/model=qwen.qwen3-32b-v1:0, no financial result/card or attached tools/shop data. Financial question returns STORE_DATA without generation; existing catalog subtotal62.88 and monthly268/6orders remain exact. API tenant/origin/no-auth/private-S3/spoofed-input checks still pass. Browser asks general questions without selecting a SKU; actual greeting and five-example answer display AI-only provenance and no fake financial card. Previous general replies are retained; only general conversation text is sent as model context. General advice/creative requests are separate from actual shop amount queries.

User-requested AWS Lambda Environment variables page opened and filtered to ASSISTANT_MODEL_ID; visible actual value qwen.qwen3-32b-v1:0, with BEDROCK_REGION=us-east-1 separately verified. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS unchanged for previously documented external acceptance inputs. See general-chat.md for usage/boundaries.


## Ranking correction and 100 merchant questions — local verified

Frontend82 / Backend88 tests pass, including all100 curated intent cases. Corrected requested rank2/3 instead of always selecting first place; Thai ordinals/digits, lowest rank, unknown/mixed exclusions, stable ties, out-of-range notices and follow-ups are covered. Added100 distinct questions in10 categories as a searchable draft picker; selection does not send/infer automatically. No-discount campaign wording explicitly maps to0percent. Question fixture copies have matching SHA; this is content/routing validation, not training or100 live-model evaluations. AWS deployment pending at this source commit.


## AWS verified: 100 merchant questions and ordinal ranking — 25 October 2026

Runtime Frontend `04527bafd537a8809e187bfb4124b62c9eaff126`, Backend `c68b3b4a0a2f1854dcdf5ca26a757a0216c75617`. Account109991964227 / ap-southeast-1. Exact logged change set `samcli-deploy1792923276` executed10:18:18UTC; stack UPDATE_COMPLETE, seven Lambda hashes match reviewed bundle. Frontend published10:20:22UTC,18object hashes verified; invalidation `IA1BKDQTG1EAOARJW0KQPMINDF` Completed, public release commit matches. No resource/role/model/parameter changes, replacement or training.

Added100 distinct merchant questions in10 categories, searchable and selectable as an editable draft. Browser verified100buttons/count100,10categories, no horizontal overflow, search ordinal2 finds2questions and selection does not send automatically. Ranking now respects requested2/3 rather than always selecting first place; live browser rank2 BAG-002profit54.20, follow-up rank3 CASE-004profit50.20. Financial ranking remains complete single-SKU recorded orders with stable SKU ties; unknown and mixed baskets excluded. Out-of-range ranks return notices; follow-ups do not accumulate oversized hidden prompts.

100-question fixture routing benchmark passes; this is not fine-tuning or100 live-model evaluations. Campaign no-discount wording correctly means0percent; missing campaign choice prompts selection; recorded-loss questions use actual amounts. Existing general chat/model page and all prior quota removals remain available. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS unchanged for earlier realOCR/LINE/nativeplatform/two-real-Cognito acceptance inputs.

## Fee-rule RAG and Titan Embed v2 — 25 October 2026

VERIFIED_LOCAL / VERIFIED_AWS for this feature: indexed the four user-supplied research documents (134 chunks) with `amazon.titan-embed-text-v2:0`, normalized1024 dimensions in us-east-1; SHA-256-pinned JSON index is on the existing private Singapore uploads bucket. Standard selected-SKU `/assistant` retrieves platform-scoped evidence before Qwen/calculation and exposes a fifth `lookupFeeRules` tool. All research stays unverified/reference-only; no tariff is automatically promoted or written into the fee catalog. The deterministic scenario endpoint remains separate. Unknown/mock-market platforms do not embed.

User explicitly approved additive policy `MarginSightFeeRuleRag20261025` on the existing Assistant/LineWorker roles. Execution of the initially prepared change set was stopped by a live-code guard: another release had updated the storefront. Fast-forwarded the cleanly nonoverlapping GitHub changes to base66b857a, proved deployed storefront sources match, then rebuilt/reviewed replacement change set `samcli-deploy1792912386`. It preserves all newer storefront changes and modifies only AI/RAG source plus three environment settings. Executed07:15:13UTC; stack UPDATE_COMPLETE/readback07:16:07UTC. All7 Lambda code hashes match the reviewed artifact; prior model/auth/OCR/config preserved. No resource addition, removal or replacement.

VERIFIED_AWS_API07:17:04UTC: one isolated MOCK store, synthetic Shopee-labelled order/fee CSV imports via S3/SQS, exact payout reconciliation, then3 Qwen/Titan requests all evidenceREADY: profit900satang,15%discount−1410satang,break-even0satang. No-token401/cross-tenant403. This is not native marketplace/Cognito/browser/live-LINE verification. Local68tests plusPython9 pass. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS remains; details/limitations in verification.md and fee-rule-rag.md. RAG source changes are currently uncommitted on base66b857a, identified on AWS by the reviewed artifact hash.

## Website message router — 25 October 2026

VERIFIED_LOCAL / DEPLOYED; live browser acceptance PARTIAL. User clarified website chat (not LINE), existing AWS/Qwen (not Bun/pgvector), and explicitly approved publish + real tests. Router sends each message with last5messages to NORMAL_CHAT / FEE_PIPELINE / CLARIFY, threshold0.7. Tools remain tenant-bound; deterministic engine owns money. Research134chunks stays unverified/reference-only. See docs/message-router/README.md for architecture, prompt/schema, 68-case evaluation and limitations.

Backend86tests/build/package pass; Frontend57tests/typecheck/static build pass including a clean npm-ci snapshot. Latest development-set Qwen result61/68=89.71% (FEE28/31, NORMAL19/23, CLARIFY14/14), all7errors excess clarification; not held-out production accuracy. Final server additionally fixes explicit channel scope and context in retrieval, tested locally.

Final reviewed code-only change set samcli-deploy1792917385 executed08:38:09UTC. UPDATE_COMPLETE/readback08:38:37UTC; all7Lambda SHA256 2w+JsdfaYTcW/Qbfyy2BoRNlV5qe643aGWOQhCYcXkU=. All existing parameters/environment/private index checksum preserved, no IAM/resource replacement. Frontend message-router-v3 published08:40:48UTC from base5bc3b9d + uncommitted feature source hashes. Preserved deployed product listing source; did not apply unrelated undeployed catalog seed changes. No commit/push in this slice.

Pre-final-fix live API proved normal answer and Shopee RAG READY; follow-up reached FEE but needed the final context fix. Financial browser checks on the final release remain UNVERIFIED: new-session smoke hit DEMO_DAILY_LIMIT, and user-offered existing tab also displayed exhausted daily openings rather than an active shop. No quotas raised, no credentials extracted. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS remains.

## Local merge completion — 25 October 2026

LOCAL_MERGED / VERIFIED_LOCAL / NOT_DEPLOYED for the combined router release: Backend8ee733d + preserved local RAG/router; Frontendd2f12d5 + local router/campaign serialization/catalog summary integration.100Backend and71Frontend tests pass with full builds. All merge conflicts resolved, quota removal and latest campaign/catalog/answer-card features retained. User explicitly chose local pull/merge only after concurrent deploys superseded prepared change sets; no merged-release publish, commit or push. See latest verification.md; prior AWS/router measurements above must not be presented as verification of this merged release.

## Routed assistant release prepared — 25 October 2026

READY_FOR_DEPLOY after explicit user commit/push/deploy request. Upstream4a4dca4 integrated; source5f3c19f plus corpusa0a273b pushed in separate batches.108Backend tests/full build, clean install and9Python parameter tests pass; Frontend83tests/source95ca8fb. General-chat compatibility, ordinal ranking and100-question UI preserved. Current measured router-v3 classifier benchmark remains61/68development cases, not final-answer accuracy. Final AWS/API/browser evidence must be checked separately below.

## Website router release verified — 25 October 2026

VERIFIED_AWS_API + VERIFIED_BROWSER_MOCK after user-approved commit/push/deploy. Source5f3c19f + corpusa0a273b/deploymentdocsa60f393, Frontend4c6880d published. Existing stack UPDATE_COMPLETE, reviewed7function hashes match, config/private research index/IAM preserved. API8/8plus401/403pass; browser rank2/3follow-up correct.108Backend/83Frontend/9Python tests and clean installs pass. Classifier development benchmark61/68 remains a separate known limitation; research134chunks are not approved tariff rules. See latest verification.md and deployment report. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS unchanged.


## AWS verified: latest main and frontend redesign — 25 October 2026

Frontend runtime 8a6a954375f4ed4fdad2c9ef3804b985f1db3a37 published13:10:32UTC (20:10:32Bangkok),74S3objects SHA256 verified, invalidation IE4416BDKY8FOT5NN9C3JNXU8T Completed. Pulled Backend43531e3 including the concurrent cited MOCK fee-answer corrections; deployed API source maps normalize to the same35runtime sources/fingerprint50ed624d0bd7b97cbdeef2624885964690d9fce3cf8d12b967b6e01096a4f007. Existing7Lambda code hash gLZBGYg1m8qxTK8lu/hp/k05ZDv6AliRhHZpdciqyM0= observed after concurrent backend publication. This operation published Frontend only; did not overwrite that backend release or execute CloudFormation.

Browser on a newly opened isolatedMOCK shop: landing/login configuration, enter shop, overview1075THBsales/268THBrecordedprofit/6completeorders,7products with prices and assistant navigation/composer pass. Frontend196/Backend112 tests andPython9 pass. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS unchanged: real receipt evaluation, liveLINE, native marketplace mapping, two-real-Cognito-user acceptance. Ignored evidence .local/redesign-release-20261025/release-verification.json; screenshots in Frontend evidence directory.
