## Qwen3 32B rollout — 24 October 2026

VERIFIED_LOCAL: `npm run verify` ผ่าน60tests/typecheck/build/bundledhandlers/contracts/IaC/package ทั้งWindowsNode24และCloudShellNode24.19.0. Pythonparameter tests6ข้อและSAMexternal-roles lintผ่าน. Qwentestsตรวจ directConverse/thinkingoff/tokenbounds, ใช้toolครั้งเดียวแล้วตอบด้วยengine, ไม่แสดงเลขแต่งในmodelnarration, wrongSKU/discount/no-tool/providerfailurefallback และmodel/Region/profileallowlist. GuardของNova/Haikuยังทดสอบแยก. สูตร/contract margin-v1.1.0ไม่เปลี่ยน. Secret heuristic auditก่อนrolloutพบ0candidates; ไม่รับรองsecretทุกชนิด.

AWS_OPERATOR_OBSERVED: STS109991964227; QwenmetadataAUTHORIZED/entitlementAVAILABLE/regionAVAILABLE/agreementAVAILABLE, directON_DEMAND. NativeConverseรับ `enable_thinking:false` และเรียกsimulateDiscountถูกSKU/15%. ผลoperatorรอบสุดท้ายใช้in-memoryMOCK repoและBedrockจริง: getProfit/simulateDiscount/getBreakEven ผ่าน3คำถาม/3inferences, 2367input/94outputtokens, ~1.0–1.2วินาทีต่อคำถาม. นี่ไม่ใช้แทนLambda/browserproofด้านล่าง.

พบและแก้ระหว่างทดสอบ: รุ่นที่ให้โมเดลสรุปรอบสองใช้numericfallbackบางครั้งทั้งoperatorและLambda แม้engineคำนวณถูก. รุ่นสุดท้ายให้Qwenเลือกtool แล้วแสดงเฉพาะengineanswerทันที ไม่ส่งmodelnarrationและไม่ใช้รอบสอง; ไม่ผ่อนSKU/discount/tenantguards. ค่าexpectedbreak-evenในoperator scriptแก้จาก188.32เป็นขั้นต่ำ188.31: feesปัดทีละรายการ22.60+15.06+5.65=43.31; 188.31−43.31−130−5−10=0; ราคา188.30ขาดทุน0.01. ค่า188.32ก็ได้profit0แต่ไม่ใช่ราคาต่ำสุด. Domain engineไม่ได้แก้.

VERIFIED_AWS: runtime source `db42a835acb05624c460ba967d9e10948f5b07bd`; stackmarginsight/account109991964227/ap-southeast-1 UPDATE_COMPLETE. Firstchange set `samcli-deploy1792859033` เพิ่มAssistantModelIdQwenและcode; correctivechange set `samcli-deploy1792859407` execute2026-10-24T16:30:51.913504Z, stackLastUpdated16:30:51.847Z. ทั้งคู่มี7existingLambdaModify/noAdd/Remove/replacement; HttpApiBodyเทียบprocessedtemplateเท่ากันทุกค่า. Parameterอื่นคงเดิม; รอบแก้parametersทุกค่าคงเดิม. ไม่เปลี่ยนCognito/CORS/data schema/CloudFront.

IAMเพิ่มinlinepolicy `MarginShotQwen32B20261024` แบบadditiveให้เฉพาะexistingroles marginsight-assistant/marginsight-lineworker: bedrock:InvokeModel exactQwenfoundation-modelARNในus-east-1พร้อมRequestedRegioncondition ตาม scripts/qwen-runtime-policy.json. ไม่สร้างrole/แก้trust/SSO/สมัครMarketplaceหรือสร้างagreement. อ่านกลับ16:31:29Z: Lambdaทั้ง7Active/Successful, codeSHA256ตรงSAMuploadedartifact `U3qP0QQEAM2ckVm72YMt9OqrJqZ1lmZDhcbvqlQho+4=`; configassistantQwen/OCRNova/us-east-1ตรงกัน. ก่อนupdateเก็บtemplate/parameters/functionhashesและcodeZIPที่ตรวจhashไว้สำหรับrollbackในCloudShelltemporarydirectory.

DEPLOYED_API_OBSERVED16:31:38Z: API Gateway→Lambda(runtimeIAM)→DynamoDB/Bedrock บนisolatedMOCKstoresจริงผ่าน3responses HTTP200/providerbedrock-tools/modelQwen: profit900satang/margin4.5%, discount15%−1410satang/−8.29%, break-evenrevenue18831satang/profit0. Latency3270/1229/1360msตามลำดับ. /integrationsแสดงQwen/converse/us-east-1; health200, protected/me/storesไม่มีtoken401, guestข้ามtenant403และoriginผิด403. ไม่ใช่Cognitoสองร้านE2E.

AGENT_OBSERVED_AWS_BROWSER: freshisolatedMOCKsessionที่เว็บ https://d2y04qc334m0rd.cloudfront.net/login/#assistant เลือกSKU-DEMO-01 ถาม “ลดราคา 15% ยังไหวไหม”; แสดงคำตอบจากผู้ช่วย ขาดทุน14.10บาท/margin−8.29%/รายรับ170.00/fees39.10 และcontextตุลาคม2026. Cardปัดmarginเพื่อแสดงหนึ่งตำแหน่งเป็น−8.3%; JSONและข้อความยัง−8.29%. Browsererrorlogว่าง. ไม่ใช้รหัสผ่านเดโม/ข้อมูลร้านจริง และไม่ทดสอบLINEหรือOCRรอบนี้. ผลรวมยัง PARTIAL_WITH_EXTERNAL_BLOCKERS.

หลักฐานlocal-only: `.local/qwen-20261024/aws-verification.json` (ไม่มีtokens), `browser-qwen.png`; CloudShell `/tmp/marginshot-qwen-20261024-lokebxao` เป็นephemeral. ไม่เผยแพร่private/rawlogsหรืออ้างว่าไฟล์เหล่านี้ต้องมีในcloneใหม่. Frontendใช้รุ่นเดิม; ไม่ได้publishหรือinvalidateCDNในงานนี้. [GitHub Actions Verifyของruntimecommit](https://github.com/skzx1/MarginSight-Backend/actions/runs/40111729432) completed/success; อ่านผลจากGitHubAPIจริง. Finalheuristicsecret auditยัง0candidates.

> Haikuด้านล่างเป็นประวัติก่อนQwenrollout.

## Haiku4.5 migration preparation — 24 October 2026

VERIFIED_LOCAL: `npm ci --ignore-scripts --no-audit --no-fund` และ `npm run verify` ผ่าน57tests/TypeScript/build/bundledhandlers/browsercontract/infrastructurestructure/package. เพิ่ม7testsสำหรับ native Haiku tool roundtrip, fixedfinancialanswer(-1410satang/-8.29%), wrongSKU/discount/unknown tool/inventedprofit, 403safe fallback/quota, model/Region/profile allowlist, context/token/content bounds, OCRยังNova และ SDKจริงที่ใช้ intercepted fetchพิสูจน์ signed endpoint/no retry/no redirect/ไม่รับ envendpointหรือbearerkey. Providerresponsesเป็น stubsทั้งชุดนี้ ไม่ใช่ realClaude inference. สูตร/contractmargin-v1.1.0ไม่เปลี่ยน.

`python -m unittest discover -s scripts/tests -v` ผ่าน5tests: migrationรักษาNovaของstackเก่า/ค่าparameterอื่น, preservemodelที่มีแล้ว, explicitswitch/rollback, unknownschema/modelและRegionผิดต้องreject. `py_compile`สองoperator scriptsและ `git diff --check`ผ่าน. Localheuristic secret auditพบ0candidates; ไม่ใช้ผลscanนี้รับรองว่าไม่มีsecretได้ทุกชนิด.

AWS_BROWSER_OBSERVED: STSบัญชี109991964227, marginsight Singapore UPDATE_COMPLETE, AIEnabled/DemoEnabledtrue, AIRegionus-east-1, LineSecretArnว่าง. `get_foundation_model_availability` ของ Haiku4.5ได้ AUTHORIZED/entitlementAVAILABLE/regionAVAILABLEแต่agreementNOT_AVAILABLE. Signed POSTไป Mantle us-east-1 `/anthropic/v1/messages/count_tokens` (ข้อความสังเคราะห์ Hello) ตอบ403permission_error: modelไม่เปิดให้บัญชีนี้, request_id `req_2w6mhonx7yus34i3ecn7vhwfwrond4lmw7k2xhrzgs3h5biwq6kq`. ไม่ส่งข้อมูลร้าน/ภาพบิล, ไม่ inference/สร้างagreement/สมัครMarketplace/แก้IAM/preparechangeset/deploy. **BLOCKED_EXTERNAL** สำหรับ liveHaiku, scopedLambdaIAMและbrowsertoolflow. เว็บจริงยังNova; localผ่านไม่แทนAWSผ่าน. ดู [migration runbook](haiku-migration.md).

CloudShellตรวจ sourcecommit `d02b48f46cfc320cf716d604ed5d9f32e8263295` จากGitHubที่pinSHA: `sam validate --lint` ผ่านทั้ง template.yamlและtemplate-external-roles.yaml. รันprepare-update.pyพร้อมexplicitHaikuจริงแล้ว CountTokens403อีกครั้งที่2026-10-24T15:55:19.443180Z; gateหยุดก่อนSAMdeploy/upload/change setตามต้องการ. อ่านLambda `marginsight-assistant` และ `marginsight-ocrworker`กลับแล้วทั้งคู่ยัง BEDROCK_MODEL_IDNovaLite/ไม่มีASSISTANT_MODEL_ID/BEDROCK_REGIONus-east-1/AI_ENABLEDtrue. ไม่เปลี่ยนlive. ไฟล์ตรวจใน `/tmp/marginshot-haiku-check-20261024-7wtatd36` เป็นephemeral; ไม่มีclouddeploymentหรือinferenceในงานนี้. CIเพิ่มPythonparameter testsควบคู่Nodeverification; ผลCIต้องตรวจแยกจากlocalpass.

## Repository cleanup — 18 October 2026

VERIFIED_LOCAL: staged tracked-only snapshot exported with `git checkout-index`; ไม่มี3ไฟล์อ้างอิงที่นำออก. `npm ci` และ `npm run verify` ผ่าน50tests, TypeScript, bundled Lambda handlers/health/preflight/protected rejection/empty queue, browser contract export, infrastructure structure policyและpackaging. ตรวจ34ลิงก์เอกสารหลักรวมสองrepoผ่าน; ไม่มีลิงก์ Markdown ที่เหลือชี้ไฟล์ที่นำออก. ต้นฉบับและbackup22ไฟล์รวมสองrepo hashตรงmanifest. ไม่มีruntime/source/fixtures/contracts/IaCเปลี่ยนและไม่ได้deployAWSใหม่. ดู [reference policy](reference-policy.md).

> บันทึกด้านล่างก่อนหัวข้อ Repository split เป็นประวัติจาก monorepo; ignored evidence อยู่เครื่องต้นทางและไม่ได้เผยแพร่ตามไฟล์ลิงก์เหล่านั้น ดู AWS-HANDOFF.md สำหรับคำสั่งปัจจุบัน.

# Verification — 14–15 October 2026

สถานะ PARTIAL_WITH_EXTERNAL_BLOCKERS; ไม่อ้าง CORE_AWS_VERIFIED/FULL_SCOPE_VERIFIED

## VERIFIED_LOCAL

node scripts/verify.mjs ผ่าน35tests, backend/web TypeScript, browser secret-pattern check, bundled Lambda imports/health/empty-worker, Next16.4.0 static exportและdeployment packaging

35testsครอบคลุม golden15/9/-14.10บาท, missing/zero, history/caps/VAT/rounding/refunds/allocation/exactpayout, Bangkokdate/month, descending150orders, CSV/XLSX validation/1000rows/retry/overlap/conflict, audited partialreview/revision, tenant isolation, Thai fallback, model orchestration/invented-profit rejection/providererror/toolbounds, OCRconfirm/unitmapping, LINEHMAC/atomic single-use linking, atomic AIcounter

Local HTTP smokeหลังแก้review/limits PASS: login/API/two-store403/dashboard900satang/discount15%=-1410satang/Thaifallback/real XLSXexport/privatefile403. Local browserdashboard/simulationตรวจในรอบก่อน ไม่แทน CognitoAWS E2E

Production dependency auditหลังuuid11.1.1 fix: zero vulnerabilitiesในการตรวจครั้งนั้น ไม่อ้างว่าปลอดช่องโหว่ทั้งหมด

## VERIFIED_AWS / ขอบเขตหลักฐาน

CloudShell STS109991964227/SAM1.166.2; stack marginsight ap-southeast-1 UPDATE_COMPLETE, scopedroles7, Node24arm64. [Raw inventory](evidence/aws/aws-deployment-evidence.json)

- /health200, /me/storesไม่มีtoken401, privateuploadsS3bucket403, directwebS3index403, CloudFrontHTTPS200
- Real privateS3/SQS/Lambda/DynamoDB: 1000rowsพร้อมduplicated IMPORTmessages/10chunks complete. accepted1000+duplicate0=1000 ในผลสรุป jobล่าสุด; ส่งซ้ำไม่เพิ่ม canonical orders; overlapping5rowsซ้ำทั้งหมดไม่เพิ่มยอด; changedrevenue PARTIAL/conflict1/คง20000satangเดิม. [Raw import](evidence/aws/import-smoke-result.json)
- Real LambdaOCR -> S3 -> directBedrockus-east-1 -> DynamoDBREVIEW: ภาพสังเคราะห์MOCK1ภาพ จำนวน6 line780.00 total780.00 totalsMatchtrue date14/10/2026; **FAILชื่อสินค้าและหน่วย** ชื่ออ่านเป็นข้อความผิด หน่วยอ่านว่าใน่แทนชิ้น. ไม่ได้confirmต้นทุน. [Raw OCR](evidence/aws/receipt-smoke-result.json), [ภาพ](../../fixtures/mock-v1/receipt-thai-mock.png)
- BasicConverseus-east-1สำเร็จในการpreflight; SingaporemodelmetadataมีเฉพาะINFERENCE_PROFILEและไม่ใช้profileนั้น. [Service smokeจริง](evidence/aws/assistant-smoke-result.json): exactbundle serviceในCloudShell + DynamoDB/Bedrock, modelCalls2/toolNames simulateDiscountและgetCalculationEvidence. Guard DISCOUNT_TOOL_REQUIREDใช้deterministicfallbackตอบขาดทุน14.10บาท/margin-8.29%ตรง. เป็นoperatorIAMscope ไม่ใช่Cognito/Lambdaassistantendpoint E2E

## Failure / remediation

marginsight-demo ROLLBACK_COMPLETE: SSOไม่มีiam:GetRolePolicy. Retained4tables/2buckets inventoried; two-phase foundation + exact scopedroles + SAMexternalroleARN deployสำเร็จ ไม่เปลี่ยนSSO/org

AWSoperator assistant smokeพบDynamoDBValidationExceptionจากbegins_with(sortKey,empty-string)ที่localไม่พบ แก้AwsStorageให้งดsort-keyconditionเมื่อprefixว่าง local35tests/buildผ่านหลังแก้; AWSretestผ่าน: อ่านGSI/ledger/catalogและเรียกtoolได้จริง. [AWS Query contract](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.KeyConditionExpressions.html)

## BLOCKED_EXTERNAL / NOT VERIFIED

PositiveCognitologin/logout/callback/verifiedmembership, tworealusers/stores และ deployed browser CSV/XLSX/review/OCRconfirm/rules/calc/simulation/reconciliation/export/assistant. ผู้ใช้เลือกmockก่อน Agentไม่ได้ตั้งCognito password. LINEchannel/live messageยังขาด. AuthorizedREALplatform/settlementsและmerchantOCRaccuracyยังขาด

OperatorIAMsmokeพิสูจน์เฉพาะservicesที่ระบุ ไม่พิสูจน์browserauth/tenantE2E. Localmodelstubsไม่ใช่หลักฐานinferenceจริง

หลังAWStestพบและแก้Thaifallbackคำว่า “ลดราคา 15%” เพิ่มvalidateddiscount/contextและlossamount whitelist โดยคำตอบการเงินยังสร้างจากengineเสมอ ไม่แสดงmodelmathเป็นผลหลัก.

## Browser HTTPS

เว็บCloudFrontเปิดได้และไม่มีlocal-demo-loginบนAWS; publicMOCKpreviewใช้engineclientแบบอ่านอย่างเดียว: ราคา170/โปรแกรม3% -> profit-14.10/margin-8.29/TTR28.88; ราคา200ไม่เข้าโปรแกรม -> profit15/margin7.5/TTR25; ราคา200เข้าโปรแกรม -> profit9/margin4.5/TTR28. ปุ่มloginถึงCognitoemail/password formที่client/scopes/PKCE/callbackถูกบัญชี ไม่มีการใส่password/signup/positivecallback. [Preview screenshot](evidence/aws-web-preview.png), [Cognito form](evidence/aws-cognito-login.png)

[Storage inventory](evidence/aws/aws-storage-inventory.json): canonicalordercount1000, retainedDynamo4tables approximateItemCount/size0 และretainedS3สองbucketemptyAtChecktrue; LINEeventmappingDisabledหลังCFupdateตามHasLineSecret condition.

## Browser local XLSX review

อัปโหลดไฟล์XLSXจริงสองแถวผ่านUI: รับ1/ผิด1(quantity0), PARTIALทำให้dashboardคง9บาทและแสดงorderไม่ทราบกำไร หลังระบุเหตุผล/ยืนยันรับเฉพาะแถวถูกต้อง -> jobCOMPLETEDพร้อมexcluded-rowaudit, dashboard18บาท/2orders/ไม่มีunknownเพิ่มยอดผิด [ภาพ](evidence/local-xlsx-review.png). ไม่ใช่browserAWS positiveCognitotest. Localdbมีสองordersหลังทดสอบนี้; smoke-localเดิมสมมติinitialseed1orderจึงไม่ควรรันซ้ำโดยคาดยอด9บาทจนแยกtestfixture.

margin-v1.1.0: เพิ่มindependentgoldenWHT100satang + knownplatformfee4600 => rawcash4700/itemcash15300/reconcileexact แต่profit/margin/TTR/feeratiounknown ไม่หักWHTเป็นexpense. เพิ่มunordered-map/legacyhashduplicate regression และrawSHA256abcgolden. SnapshotkeysรวมformulaVersion.

## AWS failure / DLQ recovery

[Raw DLQ result](evidence/aws/dlq-smoke-result.json): actualLambda partial-batch failure, SQSredriveผ่านreceivecounts3/4/5และmatchedDLQ. Operatorขับreceivesเพื่อไม่รอautomatic360sครบทุกครั้ง ทดสอบรอบแรกFAILเพราะpollerที่ยังin-flightรับข้อความก่อนmanualreceive กู้ข้อความทดสอบนั้นสำเร็จ ลบเฉพาะgeneratedpoisonตามmarkerhash และคืนImporteventmappingEnabled ไม่มีapplicationrowsเปลี่ยน ไม่อ้างfullautomatic30-minute retry timing. Scriptfirstattemptแก้ให้รอpollerdrain25sก่อนsendและปล่อยvisibilityผ่านreceiptของข้อความตัวเอง

35testsincludes251-orderdashboard: whole-monthprofit225900satangจาก251orders แต่ตอบlatest50รายการพร้อมscope/total ลดcatalogqueriesเหลือ3ต่อrequest ไม่cacheข้ามtenant/request. Hashlegacyheaderที่ปิดค่าบริการแล้วนำเข้าซ้ำไม่resetstatus.


## รุ่นส่งมอบ 15 ตุลาคม 2026

35 backend tests ผ่าน พร้อม web TypeScript/static build หลังแก้หน้า UI. เพิ่มกรณี ledger transaction/reconfirm, infrastructure transient retry, partial seed recovery และประวัติต้นทุนแบบ immutable. เมื่อมี financial ledger row ใหม่/แก้ conflict ระบบเปิดสถานะค่าบริการให้ตรวจใหม่แบบ atomic; settle ต้องใช้ hash ของข้อมูลที่ตรวจล่าสุดและ CAS header version. ต้นทุนแก้ไขสร้าง correction version เก็บต้นฉบับ; seed เติมเฉพาะรายการขาด ไม่ reset หลักฐานร้านเดิม.

AWS รุ่นนี้ทดสอบใหม่ 2026-10-15T03:32Z: worker รับ 1000แถว/10chunks, ซ้อน5แถว duplicateทั้งหมด, conflict1ไม่เปลี่ยนยอด20000satang; canonical1000orders. ยืนยัน transaction-based import ทำงานด้วย IAM roles เดิม. Benchmark exact bundle + DynamoDB inputs/calculation/synthetic snapshot1000รายการ ใช้5357ms catalogqueries3/concurrency8, รายรับ20000000satang กำไร-100000satangตามเฉลยอิสระ. เป็น operator service test ไม่ใช่เวลาตอบผ่าน Cognito/API Gateway หรือ browser. [ผลดิบ](evidence/aws/backend-1000-smoke.json)

Local browserพบและแก้ runtime crash จาก shared data คนละรูปแบบระหว่างสลับเมนู เพิ่ม optional shape guard, ล้างค่าตอนเปลี่ยนหน้า และไม่รับ refresh response ของ contextเก่า. ตรวจครบ10เมนูแล้วไม่พบ runtime error. หน้าค่าบริการ O-BROWSER-001 ซ่อนปุ่มยืนยันก่อนเปิดหลักฐาน; เมื่อเปิดเห็น3รายการ24+16+6บาท พร้อมsource refs แล้วกดยืนยันได้ ผลกำไร9บาท/margin4.5/TTR28 เปลี่ยนเป็น ACTUAL. [ภาพ](evidence/local-fee-review.png) เป็น local MOCK workflow ไม่ใช่ AWS authenticated E2E.

OCR unitsPerPack เริ่มว่าง ต้องกรอกตามหลักฐานเอง. rawCashDeductionSatang เป็น null หากยังประมาณการ ไม่มีการเรียก estimated cash ว่า posted actual. เว็บแจ้งการเก็บภาพ Singapore30วันและประมวลผล us-east-1 ก่อนอัปโหลด.

รอบ Bedrock ส่งมอบเรียก2ครั้ง/tools simulateDiscount+getCalculationEvidence; ระบบเลือก deterministic fallback ด้วย DISCOUNT_TOOL_REQUIRED ให้ผล-14.10/-8.29ตรง. ผล model-generated explanation ยังไม่ถือว่าผ่านเต็ม จึงแสดงที่มาว่าสูตรคำนวณโดยตรง; ไม่อ้างว่าโมเดลตอบถูกเอง.

หลังตรวจเมนูแก้ React row key ของ fee rules เป็น ruleId+version เพราะกฎหลายประเภทใช้ version เดียวกันได้; TypeScript/static build ผ่านหลังแก้.


## Login failure investigation — 15 October 2026

ผู้ใช้สมัครแล้วพบ Failed to fetch. Read-only HTTP diagnosticพบ OPTIONS /me/stores พร้อม OriginและAccess-Control-Request-Headers:authorization ได้401จาก JWT route ANY /{proxy+}; Cognito token endpointตอบ400 invalid_grantพร้อมCORSถูกต้องสำหรับdummy code. จึงระบุสาเหตุเป็น preflightถูกauthก่อนส่งGETจริง ไม่สรุปว่ารหัสผ่านผิด.

แก้templateและgeneratorเพิ่ม OPTIONS /{proxy+} แยก Authorizer:NONE สำหรับpreflightเท่านั้น; GET/POSTข้อมูลร้านและassistantคงJWT/scopes/tenant membership. อ้างอิง [AWS HTTP API CORS](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-cors.html). ผลหลังdeployและbrowserจะบันทึกด้านล่างเมื่อทดสอบจริง.

เพิ่มเติม: หลังแยก OPTIONS route แล้ว Gatewayส่งถึงLambda แต่handlerยังบังคับsubjectและตอบ401 จึงเพิ่ม early204/bodyว่างเฉพาะOPTIONSก่อนสร้างcloudContextหรืออ่านข้อมูล. Built artifact checksผ่าน OPTIONSสามpath/bodyว่าง และ GET /me/storesไม่มีtokenยัง401. backendTypeScript/buildผ่าน ไม่เปลี่ยนสูตรการเงิน.


ผลหลังแก้จริง: stack UPDATE_COMPLETE; GET/POST preflight204, originเว็บได้ACAOตรงoriginเดียว, originอื่นไม่มีACAO; GET /me/storesไม่มีtoken401 และ protected ANY/assistantยังJWT. [ก่อนแก้](evidence/aws/auth-diagnosis-before.json), [หลังแก้](evidence/aws/auth-diagnosis.json). Built-handler checkครอบคลุมOPTIONS3paths/bodyว่างและGETไม่มีtoken401.

Operatorตรวจอีเมลที่เจ้าของระบุพบหนึ่งบัญชี CONFIRMED/Enabled/email_verified=true แล้วinvoke seedผูก OWNERเฉพาะMOCK DEMO-001; อ่านmembershipกลับจากDynamoตรง; ไม่อ่าน/เปลี่ยนรหัสผ่าน ไม่เก็บemail/subในหลักฐาน. [รายงานยืนยันแบบไม่ระบุตัวตน](evidence/aws/verified-demo-membership.json). Browserเดิมผ่าน APIหลังแก้แล้ว แต่แสดงไม่มีร้านหลังreload จึงให้เจ้าของล็อกอินใหม่ ยังไม่อ้างdashboardของบัญชีที่ผูกสำเร็จจนเห็นผลจริง.


USER_CONFIRMED — 15 October 2026: ผู้ใช้ตอบ “เข้าสู่ร้านได้แล้ว” หลังล็อกอินใหม่ด้วยบัญชีที่ผูกMOCK DEMO-001. เป็นหลักฐานยืนยันจากผู้ใช้หนึ่งบัญชี ไม่ใช่ agent-observed screenshot และไม่ขยายเป็นผลผ่านสองผู้ใช้/สองร้านหรือทุกauthenticated workflow. ปิดissue Failed to fetch/ไม่เห็นร้านสำหรับบัญชีนี้.


## Self-service implementation — 15 October 2026

39 local testsผ่าน รวม15concurrentcreate/oneprivateemptytenant, spoofedowner/storeIDreject, no-auth/cross-tenant/privateuploaddeny, transactionfailureไม่มีorphan, REALcanonicalimportexplicitmoney/units/ownership, independentprofit35บาท/margin35/TTR10จากรายรับ100ต้นทุน50แพ็ก5เงินหัก10. ข้อมูลทดสอบทั้งหมดสังเคราะห์ ใช้ทดสอบเส้นทางREAL ไม่ใช่ข้อมูลร้านจริง/ความแม่นยำplatformadapter.

Local browser: สร้างร้านใหม่จากร้านdemo → เพิ่มสินค้าLOCAL-BAG-1 → ต้นทุน50บาท/ชิ้นวันที่1ตุลาคม → CSVออเดอร์100แพ็ก5 → CSVเงินหัก10 → เปิดหลักฐานก่อนยืนยัน (กำไร/ค่าบริการไม่ทราบเมื่อไม่มีกฎ) → ยืนยันpostedfeesแล้วกำไร35/margin35/TTR10ตรง. เปลี่ยนไฟล์จะresetownershipack. [ภาพ](evidence/local-self-service-ledger.png). AWSรุ่นใหม่นี้รอdeploy/verification ไม่ถือผลlocalเป็นผลAWS.


AWS deploymentของself-service: local39tests/buildผ่านก่อนอัปเดต; เปลี่ยนชื่อinternalschema variableเพื่อหลีกเลี่ยงชื่อชนกันตอนbundle แล้วbuild/built-handlersเช็คผ่านอีกครั้ง (ไม่เปลี่ยนพฤติกรรม). ขึ้น Lambdaรุ่นใหม่และstaticwebผ่านSAM/publishเดิม ไม่มีบริการหรือIAMroleใหม่.

Agent-observed browser: บัญชีCognitoที่มีเซสชันอยู่เปิดหน้าสร้างร้าน กรอก TonnamShop แล้ว POST /me/store สำเร็จ → GET /me/stores/ภาพรวมร้านสำเร็จ เห็นร้านว่างและขั้นตอนเริ่มใช้. [ภาพAWS](evidence/aws-tonnamshop-self-service.png). ไม่มีการกรอก/อ่านpassword/tokenโดยagent. ไม่เอาlocalfixtureมาปนในTonnamShop และไม่อ้างว่าได้ทดสอบสดmerchantfilesหรือfreshregistrationด้วยสองบัญชีแล้ว.

AWSread-back2026-10-15T04:49Z: ตรวจsubjectเจ้าของจากstoreprofileพบCognitoบัญชีจริงCONFIRMED/email_verified=true; PROFILE/membershipOWNER/personal/nameตรงกันและร้านcatalog0/order0. POST /me/storeไม่มีtoken401; GET/POSTpreflight204และforeignoriginไม่มีACAO. StackUPDATE_COMPLETE/Lambda7Successful/privateS3ยัง403. [ผลร้าน](evidence/aws/self-service-store-evidence.json), [inventory](evidence/aws/aws-deployment-evidence.json). หลักฐานไม่บันทึกemail/sub/password/token.


## Full-system demo identity — 15 October 2026

User requested a separate full app demo without a contact email. VERIFIED_LOCAL: generated 13 MOCK seed rows with the existing seed/repository engine; independent assertions revenue20000/fee4600/profit900satang; subject denied membership in DEMO-001 and DEMO-002. VERIFIED_AWS_OPERATOR: dedicated Cognito alias under reserved .invalid domain, SUPPRESS invitation, isolated DEMO-FULL-20261015 tenant; atomic 13-row insert and exact consistent read-back; subject has only this demo membership. No real merchant data or personal-store membership copied. Account currently FORCE_CHANGE_PASSWORD; password activation is handed to user via hidden interactive input. New demo Cognito/browser workflow is NOT_TESTED until password/login completes. No authentication bypass or public write route added. [Evidence](evidence/aws/full-demo-account.json). Overall remains PARTIAL_WITH_EXTERNAL_BLOCKERS.


## One-click full app demo — local verification

43backendtestsผ่านพร้อมtsc/policy/build/staticexport/bundledhandlers. เพิ่ม4testsอิสระ: sessionแต่ละรอบแยกร้าน/hashไม่เก็บtokenplaintext/normalCognitopathdeny/expiry; goldenprofit9บาทและdiscount15%ขาดทุน14.10บาท/evidence/rules/reconciliation/export; MOCK-only/tenant-boundCSVworker/conflictreview/TTL/AIandimportcaps; originboundcreation/global20sessioncap. Localbrowserlocalhost4050กดปุ่มจริงแล้วเห็นdashboard9บาทและทั้ง10เมนูโดยไม่มีruntimeerror. AWSguestflowยังต้องตรวจหลังdeploy.


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

VERIFIED_LOCAL (15 October 2026): npm ci independently installed Backend249 packages / Frontend29 packages from their own pruned workspace lockfiles. Backend npm run verify passed: TypeScript,43 tests,4 built handler loads/auth rejection checks, browser contract export, local template structural checks and deploy packaging. Frontend npm run verify passed: SHA-256 contract check, TypeScript, browser secret policy,5 independently expected financial/artifact checks, Next16.4 static export and packaging. Declaration-only cleanup/portable file URL change passed Frontend tests/typecheck again. SAM/live AWS verification was not run for this source-only split. Previous AWS results above are historical; external blockers remain. Files .local/output/private evidence were excluded.

GitHub Actions VERIFIED (15 October 2026): clean Ubuntu checkout/npm ci/npm run verify completed successfully for initial split commit ac4a325. This independently verifies no sibling monorepo/dependencies are required. Run: https://github.com/skzx1/MarginSight-Backend/actions/runs/38744536925 . This is CI/local build evidence, not AWS deployment evidence.

Local mocked operator check passed for prepare-update.py: preserves all four parameters including empty LineSecretArn, no-execute mode and exact stack; wrong account rejects before subprocess. No AWS calls.

## Assistant platform/campaign selection — 18 October 2026 (Bangkok)

Source: Backend5fb6ed2d1a5f139678e48d89db9df36461088278, Frontendf7dcc060b6a5d885f864da9ae42659eb5874d4ef. Full npm run verify passed locally and in Singapore CloudShell using Node24.19.0: Backend50tests, Frontend21tests, TypeScript, handler smoke checks, generated-contract integrity, policy/static export/package. Canonical formula margin-v1.1.0 unchanged. Local unprivileged Windows build first hit EPERM creating a Next output folder; the authorized rerun passed. No build failure is counted as a pass.

Existing stackmarginsight/account109991964227/ap-southeast-1 updated via reviewed change setsamcli-deploy1792262055; UPDATE_COMPLETE. Seven existing Lambda code updates only; API Body was marked Modify but processed Body compared exactly equal. All live stack parameters equal; no additions, replacements, deletions, IAM/auth/Cognito changes. SAM validate --lint passed. Frontend published2026-10-17T18:36:23.195295Z. Four local/S3 SHA256 read-backs matched index.html, login/index.html, config.json, release.json. InvalidationI2LECRHXRN46HIR82SX9RT46GY (7paths) Completed; public release commit matched. API artifact S3 SHA256 equals deployed Lambda CodeSha256. Readback18:39:10.842463Z: health200, no-token options401, root/login200, private direct-S3403.

Actual AWS API with a fresh isolated MOCK session and commission12% including VAT/payment3.21%/buyer shipping0: source order200THB revenue,130THB cost,15THB recorded expenses. Shopee PRIME fee48.61/profit6.39; Lazada Premium fee47.54/profit7.46; TikTok BCD + standard Growth fee53.97/profit1.03. Shopee15% discount profit-16.48; unknown commission gives null profit; break-even returns nonnegative profit. Foreign store options403; wrong-platform campaign, BCD+Flash and unconfirmed payload400. No token printed/stored in evidence. API test did not use Bedrock.

AGENT-OBSERVED AWS_BROWSER: a separate fresh MOCK session selected SKU-DEMO-01 and all three platforms, filled12% commission/included VAT and selected their campaigns; each displayed the same API goldens. Shopee breakdown24.00commission/6.42payment/1.07fixed/17.12PRIME. Switching platforms reset assumptions/history; TikTok BCD→Flash deselected BCD, and BCD again deselected Flash. Controls/results inspected at1440x1000; at390x844 page scrollWidth375/clientWidth375, no horizontal overflow. Mobile campaign checkboxes and desktop screenshot visually reviewed. Screenshot docs/design/assistant-marketplace-20261018.png contains MOCK data only; result/mobile evidence retained under excluded.local/assistant-marketplace. Viewport override reset. No real merchant data, fresh Cognito login/signup, real OCR, LINE messages or native platform enrollment was exercised. This verifies this feature slice, not FULL_SCOPE.


## Product rename to MarginShot — 23 October 2026

VERIFIED_LOCAL / VERIFIED_AWS for branding: Frontend330cf092062f0894c9c2dc41a6a25eb07c665523 and Backend4405954bcb9eec00d3155a6c70f9cd84bf6954f3. Updated visible product names, metadata, assistant/Playground labels, client CSV names, backend XLSX sheet name/assistant prompt/LINE linking copy, README/product design titles and Cognito SVG/PNG logo. Preserved repository URLs, AWS resource identities, OAuth scope, browser storage keys, generated financial contract and legacy health-service identifier for compatibility. No formula or financial policy change.

Local and clean CloudShell npm run verify passed Frontend53 and Backend50 tests, TypeScript, bundled handlers/integrity/policy checks, static export and packages under Node24.19.0; SAM validate --lint passed during preparation. Stackmarginsight updated with reviewed samcli-deploy1792770100; UPDATE_COMPLETE. Seven existing Lambda code updates only; HttpApi Body compared exactly equal and parameters preserved. No additions, removals, replacements, IAM or auth policy changes. API Lambda CodeSha256 matches the uploaded SAM code artifact.

Frontend published2026-10-23T15:46:08.146093Z. S3 read-back matches index/login/config/release. Cognito presentation applied/read back; hosted logo SHA-256 equals the renamed PNG; CSSVersion20261023154606. InvalidationI3DU8YUUDB01V9YILGTXHX1LP6 (7paths) Completed. Public read-back15:47:30.3489132Z: web/login/health200, no-token stores401, direct private S3403, release marker330cf09.

AGENT-OBSERVED AWS_BROWSER: landing brand and title MarginShot with no MarginSight visible in its body. Login shows MarginShot/MARGINSHOT. Reused the existing isolated MOCK session; overview still shows9THB profit/4.5% margin and assistant heading/title says MarginShot with no old brand visible. Browser error log empty; no question/model invocation, OCR, LINE message or real merchant write. Cognito logo confirmed by image hash, not a new credential-entry/signup test. Existing shop names and saved historical conversations were not rewritten. Evidence screenshots/public-readback.json are local-only under Frontend.local/marginshot-rename-20261023; CloudShell logs/backups under /tmp/marginshot-brand-20261023-pmmu_rmz are ephemeral. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS remains.


## Expanded guest catalog/storefront labels — 25 October 2026 (local only)

VERIFIED_LOCAL: added five synthetic products with explicit MOCK cost versions (BAG-002 95 THB, CUP-003 145 THB, CASE-004 45 THB, CAP-005 70 THB, BOOK-006 38 THB). Fresh isolated guest stores contain seven products, six known costs and one missing cost; no price/stock/profit is fabricated. Ordinary shop/product names replace demonstration labels. Guest sessions call seed with readable BAG-001 / KEY-007 / ORDER-001 / STORE-PROGRAM identifiers; legacy fixture IDs remain compatible for existing contracts. No migration of existing merchant data.

Final npm run verify passed 61 tests, TypeScript, bundled Lambda loading/auth/queue checks, unchanged browser-domain export, infrastructure structure checks and packaging. New checks cover seven records, each new cost, provenance, no Demo in product names/SKUs, reseed idempotence and unchanged 9 THB baseline. Existing session/tenant/expiry/quota/import tests passed after aligning import-test SKU references with the fresh storefront. Initial run exposed the old fixture reference; corrected it before final verification. Frontend local 53 tests/build and browser one-click/catalog/financial baseline observed. No AWS/model/OCR/LINE call, commit, push or deployment. Evidence stored locally in sibling Frontend .local/storefront-20261025. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS remains.


## Assistant scenario regression fixed — 25 October 2026

The earlier catalog-only expansion left five new SKUs without any order, causing SKU_HAS_NO_ORDER. Added five settled, single-SKU MOCK sales with independently specified posted fees/payouts, packaging/ads and effective costs. storefrontIds=false keeps legacy golden fixture order sets unchanged. Fresh guest storefront now has6 complete orders: revenue107500satang, fees22100, profit26800, margin24.93%; the original BAG-001 order still earns900satang and loses1410satang at15% discount. KEY-007 remains missing cost/order and cannot invent a result. No catalog price/stock/profit metadata is inferred from these orders.

local.ts upgrades only local guest memberships with MOCK origin and BAG-001 on startup; it preserves session/chat and existing edited records/fee confirmation. Lambda does not run this local repair; a future deployment needs a fresh guest session to get the fixture expansion. No migration or bulk reseed of personal/REAL stores.

Final npm run verify passed62 tests and all build/bundle/contract/IaC-structure/package gates. Added scenario tests independently assert15%-discount profits3032/4132/3472/2812/1952satang for BAG-002/CUP-003/CASE-004/CAP-005/BOOK-006, six reconciled payouts and missing-data/wrong-month rejection. Python update-parameter tests6passed. Heuristic secret audit0candidates (not exhaustive). Browser in existing local CAP-005 chat clicked retry and displayed28.12THB profit/20.81% margin/revenue135.15/fees27.03, error log empty. LocalAI disabled: deterministic-fallback only, not a live Qwen test. Screenshot in sibling Frontend .local/storefront-20261025/assistant-fixed.png. User subsequently authorized pushing all current work. No new AWS/model/OCR/LINE operation; overall PARTIAL_WITH_EXTERNAL_BLOCKERS remains.


## Storefront assistant deployment — 25 October 2026

VERIFIED_AWS: runtime031467b57c9447ccbecc59af968696e5e2941b6b deployed to existing marginsight/account109991964227/ap-southeast-1. Reviewed samcli-deploy1792909584 (176eb845-1f7d-4217-99e1-dcbe510f6b91), execute06:28:44.434948UTC; stack UPDATE_COMPLETE. Seven LambdaCode changes plus dynamic HttpApi Body reference refresh only. Processed HttpApi properties, all non-Code Lambda properties and parameters compared exactly equal; no Add/Remove/Replacement/IAM change. Deployed7function code hashes match SAMartifact. Qwen directus-east-1 and separate NovaOCR unchanged.

Clean CloudShell Node24.19.0 verify62 tests/bundle/domaincontract/IaCstructure/package plus Python6tests pass. Deployed API check06:31:30UTC: fresh isolatedMOCK store has7products/6completeorders/revenue107500satang/profit26800; all6discount goldens pass (new5plusBAG-001). Qwen providerbedrock-tools/modelqwen.qwen3-32b-v1:0 for CAP-00515% returnsprofit2812satang/margin20.81%. Reconciliation6payouts exact; tenant/origin403, missingSKU404, guestnormalroute/noauth401 and privateS3403. Browser selectedCAP-005 then pressed15% suggestion; answer28.12THB/margin20.81% visible, prior missing-order error absent. These are realBedrock/API/browser checks on MOCK data, not live merchant/OCR/LINE/twoCognito acceptance.

Initial frontend9f3edfe followed by appearance-only2bc06b9 (cream/ink/terracotta + Cognito logo/CSS) now live; no second Backend deploy for theme. Final appearance readback06:49:40UTC is in Frontend evidence. CloudShell backups /tmp/marginshot-release-20261025-a0nn9bsd; local safe reports/screenshots in sibling Frontend .local/aws-release-20261025/evidence and .local/theme-20261025. Backup template/parameters/LambdaZIP hashes are ephemeral; runtimeparents remain in Git for reviewed rollback. No REAL/personal-store seed/migration; existing guest sessions need a fresh session for the expanded dataset. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS remains.


## Product price/quantity persistence — 25 October 2026

VERIFIED_LOCAL: fixed dropped form/CSV listing values end to end. See product-listing.md for API limits, zero/missing behavior, partial saves and optimistic concurrency. Frontend56/Backend67 tests plus Python6 pass; builds/bundled handlers/unchanged domain contract pass. Local browser MOCK create249.99THB/42units, refresh and edit0/0 pass. Historical engine inputs/profit unchanged; cross-tenant/read-only/stale/invalid writes rejected. No personal-store values inferred or rewritten. AWS publication pending at this source commit. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS remains.


## Preserve deployed Fee Rules during product fix — 25 October 2026

Deployment preparation failed closed before SAM upload: the live stack had FeeRulesEnabled/FeeRulesIndexKey/FeeRulesIndexSha256 absent from Git. Read-only backup/source-map comparison found deployed ai.ts plus fee-rules.ts; api.ts otherwise matched the pre-price source. Recovered and reviewed those exact existing runtime sources and normalized the live original external-roles template (only restore local CodeUri and remove generated SamResourceId metadata). Kept the price fix; did not remove live parameters, create IAM access, alter research index or switch model/Region. Fee retrieval remains Titan Embed Text v2 direct us-east-1, immutable S3 index SHA, bounded/quota-limited, platform-filtered, reference-only and never approved calculation rates. Recovered source has no dataset/training operation. Existing foundation bootstrap templates remain unchanged; this release updates the existing external-roles stack only.

Reverification passed Backend70 tests including platform/illustration exclusion, corrupt-index rejection before any embedding attempt, and model-failure fallback preserving profit900satang/historical inputs; Frontend56/Python6 unchanged. No inference was called for this verification. AWS update still pending at this commit; retain overall PARTIAL_WITH_EXTERNAL_BLOCKERS.


## Product listing fix deployed and verified — 25 October 2026

VERIFIED_AWS for this feature. Runtime Frontend f9bc84e4e30015bdde1077a3dfa892cafa709e56 / Backend 5b61c6ae15b12a520e244c85585f6a270d42097f. Backend includes recovered already-live Fee Rules source/template so this update preserves existing functionality. Local and clean CloudShell verification: Frontend56 / Backend70 / Python6; unchanged financial contract margin-v1.1.0.

Reviewed samcli-deploy1792913610 (5dd6d3a0-ca45-4562-8116-8fd6daa29c78) executed2026-10-25T07:35:05.298265UTC; stack UPDATE_COMPLETE. Seven existing Lambda Code updates plus dynamic HttpApi reference refresh only; no add/remove/replacement, parameters all preserved including FeeRules trio, processed HttpApi properties and non-Code Lambda configuration equal. Additional gate compared current original template and seven Lambda hashes to the backup before prepare/execute. Deployed Lambda hashes match the reviewed artifact. Frontend published07:36:22UTC;18S3object readbacks match;8path invalidation IBU2J29N5JZGJS9TBRD107BM7G Completed. No Cognito appearance/auth change in this release.

Deployed API check07:38:51UTC used two isolated MOCK tenants: create24999satang/42units, independent GET, separate cost12050satang, zero price/stock, edit29999satang while omitted quantity stays0, legacy version0 edit, cost preserved and no fabricated profit. Historical dashboard/result inputs unchanged at26800satang profit. Stale409, fractional money400, tenant/origin403, guest-normal/noauth401, privateS3403. Six public entry/config/release/brand files200 with matching build hashes. No REALmerchant write or model inference in these checks.

Browser live MOCK manual form: create249.99THB/42units, refresh retains both; edit299.50THB/7units and refresh retains both; cost120.50THB unchanged. No horizontal overflow or console errors. Evidence in Frontend .local/product-listing-20261025/aws-final-report.json, browser-verification.json, evidence/products-live.png; CloudShell backup /tmp/marginshot-listing-20261025-15_tvv_j is ephemeral. Existing prices/quantities discarded by the old form were never stored: users must enter them once through product details → แก้ไขราคาขายและจำนวน. No inferred prices or REAL-store seeding.

Overall PARTIAL_WITH_EXTERNAL_BLOCKERS remains for prior realOCR/LINE/nativeplatform/two-Cognito workflows. This feature's checks do not represent FULL_SCOPE_VERIFIED or live merchant adoption.


## Catalog discount routing and seven fixture listings — 25 October 2026

VERIFIED_LOCAL: user-requested current-product discount path now works without sales; monthly profit still uses recorded orders. Pre-expense difference is explicitly separate from unknown net profit; no client money inputs, order creation or price mutations. Product-reference timestamp survives history/copy. All seven MOCK fixtures have price/quantity, with conditional missing-only upgrade for old authorized guest catalogs; REAL/personal/custom/edited/zero values preserved. Frontend61/Backend78 tests and builds pass, financial contract unchanged. See Backend docs/catalog-discount.md and docs/storefront-listings.md. AWS pending at this source commit; PARTIAL_WITH_EXTERNAL_BLOCKERS remains.


## Checkbox-only assistant campaigns — 25 October 2026

VERIFIED_LOCAL Frontend65/Backend80 tests, typecheck/build/static export/bundled handlers and unchanged financial contract. Added composer campaign button with native accessible dialog: platform pills, campaign checkboxes, seller/category/eligibility radios and checkboxes; cancel/clear/apply. No text/number fields, select elements or details section remain. Manual base fee values are explicitly removed when applying this checkbox-only preset. Playground options and the existing server marketplace rule engine supply program rates; missing base commissions/payment rates remain unknown, never zero or fabricated. The current-product endpoint returns known campaign charges and, only when all platform rules are known, the difference after platform fees; net profit remains unknown where other expenses are absent. Campaign assumptions are snapshotted per turn/history and ignored by monthly recorded-order totals. Local browser observed selection forwarding and calculated campaign fee13.70THB for160THB after discount, plus no manual controls/overflow. AWS release pending at this source commit. PARTIAL_WITH_EXTERNAL_BLOCKERS remains.



## Application usage quotas removed — 25 October 2026

User requested all app usage limits removed: no 2-hour guest lifetime, daily/session/write/AI/import/receipt quotas, 100-chat or 200-turn caps. Guest records no longer receive 24-hour TTL; legacy rows read by the app have TTL removed conditionally without changing financial values/version. Opaque guest tokens remain MOCK-only, origin/tenant-bound, revocable and stored in sessionStorage; Cognito remains unchanged. File/content validation, per-request deadlines/token/context bounds, native browser/provider quotas and the $350 team budget remain. Local verification and AWS release evidence follow; deployment is pending at this source commit. No cloud charges from these local tests. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS unchanged.


## 25 October 2026 quota/catalog/campaign release evidence

- Fresh clean Git clones in CloudShell: Frontend66 tests, Backend81 tests, Python operator6; typechecks, static export, all bundled handlers and unchanged margin-v1.1.0 contract passed. Local logs `.local/no-usage-limits-verify.log`.
- Quota regression:22 session creations,55 imports,24 receipts; old app reserve function made to throw if called. Financial baseline26800satang unchanged; legacy guest row TTL removed without changing content/version;101chats/201turns restore. Old model daily limit0 does not suppress provider invocation. Cross-tenant/origin and revoked session checks still reject.
- AWS API at09:02:25UTC: nonExpiring new session, backdated old expiry accepted/cleared; repeated reads and merchant0/edited metadata preserved; custom no-order product discount exact; no saved scenario. Spoofed price400, tenant403, origin403, normal no-auth401, private S3403. Existing legacy fixture backfill was VERIFIED_LOCAL; pre-release legacy-session creation was blocked by the old global quota, so do not claim that backfill was tested on an old live tenant this release. Fresh seven-row listings verified live.
- AWS browser: one-click entry succeeds; seven price/quantity rows; no2-hour/3-import/3-AI quota copy. Campaign dialog inputs checkbox/radio only,0selects/0details. Lazada Premium selection applied to catalog discount; monthly268 from6orders with campaign excluded from actual totals. Screenshots in Frontend `.local/catalog-scenarios-20261025/evidence/`.
- Safe machine-readable proof (ignored, no raw capability): `.local/catalog-scenarios-20261025/aws-final-report.json` and `browser-verification.json`. Runtime commits, stack/change-set/invalidation IDs in status.md. Do not commit raw sessions/backups/merchant records.


## 25 October 2026 answer-card/subtotal verification

Frontend70 / Backend81 tests and Python6 operator tests pass in CloudShell, plus typechecks/static export/bundled handlers/domain contract. Tests cover exact complete-vs-partial known fees, zero, missing cost, negative subtotal display, no invented net profit, persistence and malformed stored summary rejection. Frontend only displays backend satang fields.

AWS/API: known fee17.12 and subtotal62.88 under incomplete base-rate assumptions; obsolete warning absent; actual monthly268 and6orders unchanged, tenant/origin403, spoofed-price400, no-auth401/privateS3403. Non-expiring guest session and backdated old expiry checks still pass. Browser card16.30 after13.70knownfees, calculation details collapsed, prior session/history survived refresh. No REAL merchant writes or model/OCR inference. Evidence ignored under `.local/summary-cards-20261025/aws-final-report.json`, `browser-verification.json`; Frontend screenshots `evidence/aws-card.png` and `evidence/aws-assistant.png`.

Preparation encountered two available change sets; no arbitrary/latest selection was executed. Selected only the exact ARN printed in the current SAM preparation log, then independently reviewed it and rechecked live drift/budget before execution. The other available change set was not executed.


## 25 October 2026 general conversation verification

Fresh CloudShell clones: Frontend75 tests, Backend87 tests, Python6; typechecks, static export, bundled handler smoke, unchanged domain contract and SAM lint pass. Local logs `.local/general-chat-verify.log`. New tests cover general vs financial intent, sales advice/code/translation, no tools/retrieval/catalog loads, bounded alternating history, rejected role/field injection, honest model failure, tenant/origin isolation, and accurate UI provenance/persistence. Financial adapter tests explicitly mock only the new routing preflight; separate tests exercise the actual preflight and continuation.

Live API proof: two successful real Qwen general generations (Thai greeting then English follow-up), financial routing marker without model output, unknown fee totals remain null while known-fee subtotal62.88 stays exact, monthly268 from6orders unchanged. Strict unknown SKU in chat mode400; spoofed financial input400, cross-tenant403, origin403, no-auth401, privateS3403. Guest non-expiry/backdated-expiry regression still passes. Browser actual general replies display no recorded amount/card or dated ledger reference. No REALmerchant records read into the model or written. No OCR/LINE inference/operation in this release.

Ignored evidence `.local/general-chat-20261025/aws-final-report.json` and `browser-verification.json`; Frontend `evidence/aws-general-chat.png` plus `evidence/aws-model.png`. Live financial results remain domain-owned; generated knowledge/examples are not merchant finance verification.


## 25 October 2026 100-question/ranking verification

Fresh CloudShell verification: Frontend82, Backend88 tests; Python6 operator tests; typecheck, static export, bundled Lambda smoke, unchanged domain SHA/version and SAM lint pass. The100 curated intent cases are checked individually inside the backend suite;82+88=170 test cases is the suite count, not170 model generations. Canonical Backend fixture and shipped Frontend JSON byte-identical SHA256 `2da873c30f3b1e1c00fc96a4fb1901092126bc4b4ac551e7084a3254c7bd09b6`.

Ranking regression covers user-reported rank2 vs first place, rank3, lowest rank2, Thai ordinals/digits, stable ties, selected-SKU scope, unknown/mixed exclusion and invalid/out-of-range ranks.250successive follow-ups keep bounded hidden request length. Loss question reads negative recorded profit; unspecified campaign asks for explicit choice.

Live browser:100questions/10categories, search ordinal2 gives2matches, draft-only selection, actual rank2=54.20 and follow-up rank3=50.20. Live API10:22:36UTC: one successful general Qwen response to a merchant discount-reply writing request, financial routing marker without model generation, current catalog discount and monthly268/6orders unchanged. No-discount Lazada scenario250.00minus120.00costminus21.40knownfees=108.60subtotal, netProfit remainsnull. Prior tenant/origin403, spoofed-input400, no-auth401/private-S3403 and guest expiry regressions still pass. No REALmerchant writes or OCR/LINE operation.

Ignored proof `.local/merchant-questions-20261025/aws-final-report.json`, `browser-verification.json`; Frontend screenshots `evidence/aws-question-bank.png`, `aws-rank-2.png`, `aws-rank-3.png`. A readable100-question handout is outside both repos at D:/NTT/output/MarginShot-merchant-questions-100.md. See merchant-questions.md for usage and fixture ownership.

## Fee-rule RAG + Titan Embed v2 — 25 October 2026

### Local evidence

`npm ci` completed; final `npm run verify` passed68 tests, TypeScript (including the index operator), bundled Lambda/auth/queue gates, unchanged margin-v1.1.0 browser contract, IaC structure and deployment packaging. Python migration tests9/9 pass, including preserving quoted empty SAM parameters. SAM validate --lint passed for the deployment template. Git diff --check passed. Publication-scoped heuristic audit scanned144 Git-tracked/nonignored candidate files plus Lambda dist:0 candidates,1 image skipped; not an exhaustive privacy/security certificate. The earlier whole-workspace audit was cancelled because it included ignored credential/tool caches; it is not reported as a passing full audit.

New tests cover research provenance, source/date/platform boundaries, illustrative-example exclusion, exact Titan payload, vector/index size/checksum/schema validation, cache/quota reservations, fifth-tool bounds, safe failure, and injected source instructions not changing financial golden values or the fee catalog. Four supplied Markdown files produce134 logical chunks. All are USER_SUPPLIED_RESEARCH/calculationEligible=false; effective dates are not normalized into approved rules.

### Real indexing and retrieval

Official model access was AVAILABLE/AUTHORIZED. Indexed134 chunks using direct Titan Embed v2 in us-east-1,1024 normalized dimensions. Corpus version `d9004663dc7a494f7deb039ded393b35c1172d19bf626072312506014b3e37a8`; existing bucket `marginsight-uploadsbucket-gtlcnblgbxoy`; key `fee-rules/v1/d9004663dc7a494f7deb039ded393b35c1172d19bf626072312506014b3e37a8/index.json`; body3075273bytes; SHA-256 `b0a22b6bb82f02d62b3318a97ae9bd0ac9d50556cae0cdfc37fc9afe69fd9d50`. Conditional publish and GET/readback matched; AES256 encryption and all bucket public-access blocks confirmed. This is an ordinary private S3 JSON index, not OpenSearch or the S3 Vectors service.

Operator semantic check06:55:16UTC: four Thai queries, one per platform, produced real Titan embeddings with platform-scoped policy matches in the top3;254 input tokens. First cold credential startup attempt timed out; no passing/billing claim for it. Generic snapshot chunks sometimes outranked detailed policy rows, so this is a bounded relevance check, not a retrieval-quality certificate or validation of official rates. Shopee Mall VAT, Lazada category tariffs, LINE promotion dates and category/program/refund gaps remain unresolved research caveats.

### Approved IAM, concurrent-release preservation and deployment

Automatic approval review initially rejected the IAM mutation because explicit access-change approval was missing. User then explicitly approved the two roles, exact Titan/index-read permissions and activation. Added/read back only policy `MarginSightFeeRuleRag20261025` on `marginsight-assistant` and `marginsight-lineworker`: exact Titan InvokeModel/us-east-1 plus GetObject on this bucket's fee-rules/v1/*/index.json/ap-southeast-1. Existing policies/trust were preserved; no new role.

Initially prepared `samcli-deploy1792911515` was never executed: pre-execution code guard found the newer storefront deployment Qg95+n6pO5OSygWI3iLDzcxdAZ6kSFC/QLO1OQDDeb8=. Downloaded/hash-checked its ZIP and compared first-party source maps; only demo.ts/seed.ts differed from the original backup. Fetched/fast-forwarded base66b857a and proved those source files match the live artifact. New change set `arn:aws:cloudformation:ap-southeast-1:109991964227:changeSet/samcli-deploy1792912386/14cb81bf-0971-438c-b40c-cdb0cb717b23` preserves that deployed work. Reviewed artifact source delta against the newer live ZIP is only ai.ts plus new fee-rules.ts; all other first-party source content matches. Reviewed processed template changes are7 code updates and only3 RAG environment variables on Assistant/LineWorker; HttpApi/non-Lambda properties identical; no Add/Remove/Replacement; previous parameters and all prior Lambda environment variables preserved.

Executed07:15:13UTC after fresh code/config/policy/budget guards. Stack UPDATE_COMPLETE, LastUpdated07:15:14.627UTC. Readback07:16:07UTC: all7 Lambda CodeSha256 match `hhyBKI5W4/kaQM4XypSZu1k52xrnp4Awr0kTbiSbP1U=`; RAG enabled only Assistant/LineWorker. Qwen directus-east-1 and separate NovaOCR unchanged. Runtime source is base66b857a plus currently uncommitted RAG changes; no claim that base commit alone contains this feature.

### Deployed API result and scope

Smoke completed07:17:04.179UTC. Created one isolated MOCK guest store, uploaded two synthetic CSVs through signed S3 upload/import/SQS routes (1order,3fees accepted; no rejected/conflict), settled with15400satang payout and exact reconciliation. The Shopee label is test metadata, not a native Shopee export or official tariff. Existing storefront fixture/golden costs and merchant rules remain intact.

Three protected assistant requests returned providerbedrock-tools/modelqwen.qwen3-32b-v1:0, Titan modelamazon.titan-embed-text-v2:0, evidenceREADY/platformSHOPEE/max3matches, all UNVERIFIED/calculationEligiblefalse. Engine profits:900satang baseline,−1410satang at15%discount,0satang at break-even. Durations5481/2826/2658ms including retrieval/model/API. No-token401 and foreign-store403 passed. These prove deployed API Gateway/Lambda/S3/SQS/DynamoDB/Bedrock on MOCK data, not new browser/Cognito/native-platform/live-LINE/real-merchant acceptance. No auth token or signed URL was saved in the evidence report.

Safe reports/backups are local-only under tmp/fee-rules/ (initial pre-release, concurrent-release, build-report, semantic-evaluation, change-set-review-current, execute-current-report, aws-readback, aws-smoke). CLI login cache is ignored/separate; never publish it. Rollback: prepare/review full external-roles update with --disable-fee-rules, preserving store records/index history; previous live ZIP is backed up. See fee-rule-rag.md. Project remains PARTIAL_WITH_EXTERNAL_BLOCKERS.

## Website router deployment and verification — 25 October 2026

User explicitly approved existing website AWS publication and real tests. Sources/docs: docs/message-router/README.md, router-prompt.txt, router.schema.json, test-cases.json, evaluation-v3.json; backend/src/message-router.ts and web-chat.ts; scripts/evaluate-message-router.ts. No LINE migration or Bun/PostgreSQL infrastructure.

Local Backend verification86/86tests, TypeScript, bundled-handler invocation, domain preview margin-v1.1.0, IaC structure and deployment package passed. Frontend57tests/typecheck/static export/secret checks passed after fast-forward to5bc3b9d; clean isolated tracked-source snapshot npm ci + verify also passed. Final additional unit cases ensure explicit current channel overrides inherited context, totals exclude other platforms, and a Lazada follow-up retains prior fee topic in RAG. Publication-scoped heuristic scan161files/0credential candidates (not an exhaustive audit).

Three bounded actual Qwen development evaluations: v1 57/68, v2 62/68, latest v3 61/68=89.7059%. v3 FEE recall28/31=90.32%/precision100%; NORMAL19/23=82.61%/precision100%; CLARIFY14/14=100%/precision66.67%. Seven failures listed in README/evaluation-v3; all excess clarification, no cross fee/normal error observed in this dataset. 66modelcalls, 62121input/3825output tokens, p50 3063ms/p95 3568ms, no transport/invalid-output errors in that run. Not held-out, calibrated confidence, platform/plan accuracy or full-answer acceptance.

Concurrent-release guard detected newer deployed product listing Vw2tpfqiAwqSDLqKaeoYNS4f7qRLMn2leI0pllpyfhk=. Preserved exact deployed api/product-listing source from5b61c6a, not unrelated undeployed8b291a4 seed changes. Backups under ignored tmp/message-router/current-live. Initial code-only router update08:03UTC (K1YGi8riNFVZ7SeWzvwISxhXNxJo8WkHifQ4vDk3gMs=) exposed model markdown-wrapper/planner issues; fixed strict full-response JSON-wrapper handling/planner schema. Intermediate08:21UTC O+X4CfEvXY/YrvmrjOrfzgUu3QB7DOJDeRiNQJkSyMI= passed live normal-chat and Shopee fee-reference/RAG READY; follow-up reached FEE but planner clarified. Further fixed explicit platform + retrieval history + financial channel filtering.

Final change set arn:aws:cloudformation:ap-southeast-1:109991964227:changeSet/samcli-deploy1792917385/2d41aa1c-5427-43bb-8868-6bcf7d77a101 reviewed against intermediate ZIP: first-party source delta only web-chat.ts. All non-Code Lambda properties, non-Lambda properties, resource sets and previous parameters identical;7code modifications + unchanged HttpApi dynamic-reference refresh; no add/remove/replacement/IAM change. Executed08:38:09.606UTC, UPDATE_COMPLETE LastUpdated08:38:11.203UTC. Readback08:38:37.685UTC all7functions Active/Successful, reviewed CodeSha256 2w+JsdfaYTcW/Qbfyy2BoRNlV5qe643aGWOQhCYcXkU=, prior Qwen/NovaOCR/env unchanged; private S3 index body/checksum/AES256/public-access blocks verified. Sources are dirty base66b857a plus preserved deployed listings/RAG/router, not a claim that base alone contains release.

Frontend76files published08:40:48.963UTC; readback root/login/config/release matched. Release manifest message-router-v3 records dirty base5bc3b9d and4feature source hashes, formula margin-v1.1.0. Invalidation I6JOA5X1H1P25YL7IFJS0ICNCA. No Cognito/auth/IAM changes. Public CloudFront checks recorded separately in ignored tmp/message-router/public-web-check.json.

Acceptance boundaries: initial six-case live smoke had failures and is retained as aws-smoke-initial-failures.json. Intermediate run normal NORMAL_CHAT/conf1 and Shopee FEE/conf.95/RAG READY passed; Lazada follow-up reached FEE/conf.95/RAG READY but final answer needed fix. Creating second test session then returned429 DEMO_DAILY_LIMIT, so discount/cost final live checks were not completed. Earlier financial engine/RAG goldens are prior-version evidence, not final browser proof. User chose an existing MOCK tab rather than quota expansion. Browser inspected login details: daily shop openings exhausted, no accessible active MOCK chat. No quota changes, token extraction or replacement sessions. Final financial chat/desktop-mobile acceptance remains pending; screenshot FE .local/message-router/demo-quota-blocker.png. Structured CHAT_ROUTE metadata confirmed in existing CloudWatch logs without exporting message text/tenant IDs. No claim of new live LINE/native marketplace/real merchant/two-Cognito acceptance.

## Pull/merge latest upstream with website router — 25 October 2026

VERIFIED_LOCAL / NOT_DEPLOYED for this merged release. User requested pull/merge after removing app limits, then explicitly chose to finish local pull/merge only because another task was deploying the same stack repeatedly. Backend fast-forwarded to8ee733d (includes83200eb usage-quota removal and latest catalog remaining-amount changes); Frontend to d2f12d5 (includesa8bcfa0 quota removal, campaign selector and numeric answer cards). Local RAG/router work was preserved in recoverable stashes and merged; no reset/force push, commit or push. Existing historical deployment entries above are prior releases, not proof that this merged router is live now.

Local Backend100tests/full verification pass; Frontend71tests/full static build pass. Before the final answer-card follow-up, isolated clean npm-ci Frontend verification also passed67tests; final71-test root verification includes the added summary cases. Router still gates every message, normal chat has no RAG/data tools even with a campaign selected; catalog discounts use current product price/cost through the existing backend calculator; selected campaign assumptions never change recorded monthly order profit. Numeric catalog summaries/reference dates/history survive. App quotas are not reintroduced; provider/budget/deadline/payload/tenant/origin safeguards remain.

Prepared/reviewed earlier code-only change sets were superseded by concurrent stack releases; guards prevented execution. Latest prepared samcli-deploy1792920228 became obsolete before review, and was not executed by this task. No new merged-release frontend upload or model/API acceptance run. Earlier live source was read-only backed up and compared with upstream to avoid overwriting unrelated work. Browser inspection also hit an automatic approval-review usage limit, separate from removed application quotas; no workaround attempted. User then selected local-only completion. AWS/browser verification of the merged release remains pending.

## Commit/push/deploy authorization — 25 October 2026

User explicitly requested commit, push and deploy after the earlier local-only stop. Integrated upstream4a4dca4 (general conversation and merchant question corpus) with local RAG/router. Source commits are a0a273b (reproducible fee corpus/tooling) and5f3c19f (routed pipeline, compatibility, server ranking, fixtures/evaluation and preservation gates), pushed in separate batches. Legacy AI.chat and mode-chat callers without context remain compatible; new website context requests use AI.routedChat. Existing data/formulas/quota removal/model/private index retained. Current local verification108tests/full Backend build and9Python parameter tests pass; isolated npm-ci verification also108passes/0audit vulnerabilities. Frontend source95ca8fb retains latestda63091 UI, 100questions, campaigns and numeric cards;83tests/full build pass. Deployment is being prepared, not yet verified by this paragraph; follow later AWS evidence.

## Committed website router deployed — 25 October 2026

VERIFIED_LOCAL / VERIFIED_AWS_API / VERIFIED_BROWSER_MOCK for this feature slice. User explicitly requested commit, push and deploy. Source/tooling published in batches a0a273b and5f3c19f; deployment documentation a60f393. Frontend implementation95ca8fb/publication4c6880d. Latest general conversation, 100questions, campaign selection, numeric cards and ordinal ranking preserved; app quotas remain removed. Clean npm-ci/full verification passed on both isolated source snapshots: Backend108tests/Frontend83tests; Python9parameter tests passed. No financial formula version change (margin-v1.1.0).

Reviewed change set samcli-deploy1792930578 executed12:18:54UTC; UPDATE_COMPLETE/readback12:20:06UTC. All7Lambda CodeSha256 M2AnVYW1jTPZY/Lxg9L85eBUZ+dyxFDg673id7q/GOk= match reviewed artifact. Only router/API integration source changed from the exact backed-up live upstream; prior environment/parameters/IAM/private index preserved. No data/resource replacement. Frontend76files published12:22:37UTC with clean committed release manifest; key S3 readbacks match. CloudFront invalidationCompleted confirmed12:24:40UTC.

AWS protected API8/8MOCK acceptance cases passed: normal no RAG, Shopee research READY, Lazada fee follow-up READY, ambiguous confidence0.6→CLARIFY, catalog15%discount200→170THB/pre-expense difference40THB/netProfitunknown, CAP-005cost70THB, selected campaign20%discount/known campaign fee13.70THB/unknown full fee total, and recorded monthly profit268THB unaffected by campaign selection. No-token401/foreign-store403 pass. This eight-case acceptance is separate from the unchanged classifier development score61/68; no production accuracy claim.

Browser access resumed after the prior transient tool-usage denial. Opened one fresh isolatedMOCK store without daily-limit failure, observed latest question/campaign controls and intro, then asked rank2→BAG-00254.20THB and follow-up rank3→CASE-00450.20THB. Both cards/coverage/context correct. Screenshot1280x720 at Frontend .local/message-router/deployed-chat.png (local-only); final response includes proof. This is not new mobile/real-merchant/Cognito/native marketplace/LINE acceptance. Four research documents remain unverified/reference-only. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS remains for unrelated original project gates. Sanitized reproducible report: docs/message-router/deployment-2026-10-25.json. Rollback uses the backed-up prior artifact/full reviewed external-roles update without deleting merchant data.


## Owner-approved MOCK document answers — 25 October 2026

Runtime source43531e3 (preceded by66d1cec) deployed to existing AWS stack. All four supplied documents are approved for cited MOCK reference answers. Server-trusted membership.dataOrigin=MOCK controls access; REAL retains verification gate. Corpus/Titan/S3 checksum/IAM/environment/financial catalogs/formula remain unchanged. Explicit fee-label matching prevents commission/payment substitution.

Local112/112 tests and standalone build/package/structure checks passed. Final live isolated-MOCK API4/4 passed with expected commission rows Shopee25/26, TikTok21, payment Lazada24, LINE33/34. Initial live answers exposed topic mismatches and were corrected before final acceptance. Evidence: docs/message-router/mock-reference-release-2026-10-25.json. This does not verify official tariffs, missing numeric rates, real merchant data, native integrations or the browser presentation. Overall project remains PARTIAL_WITH_EXTERNAL_BLOCKERS.
