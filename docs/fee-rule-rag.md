# Fee-rule RAG + Titan Embed v2

25 October 2026. This extends the assistant at the user's explicit request. Financial formulas and seller fee records remain owned by the deterministic engine.

## Runtime

1. Authenticate and authorize the store through the existing API path.
2. Derive platform and order date from that store's selected SKU/order; the model cannot select another store.
3. Read the immutable, SHA-256-pinned JSON index from the existing private uploads bucket in Singapore. Cache the public research index for five minutes in the Lambda execution environment; never cache merchant queries/results across stores.
4. Reserve one existing per-store AI call before invoking `amazon.titan-embed-text-v2:0` directly in `us-east-1`, requesting 1024 normalized float dimensions. Attempted embedding calls consume quota even on failure.
5. Compute cosine similarity over the small in-memory index; filter by platform, exclude worked-example chunks, return at most three matches with citations and caveats. No OpenSearch, provisioned vector database, extra stack, or paid idle capacity is added.
6. Supply that evidence as untrusted reference data to the existing Qwen assistant. `lookupFeeRules` is the fifth bounded tool when RAG is configured. Retrieval runs before a calculation tool, even if the model does not request lookup separately.
7. Calculate using the existing recorded fees/rules/costs. Source text cannot introduce rates, mutate enrollments or write the fee catalog. The response includes `feeRuleEvidence` and visible source references. If lookup fails, mark it `UNAVAILABLE` and clearly state that calculation uses recorded store data.

`AI_ENABLED=false` also prevents query embeddings. `FEE_RULES_ENABLED=false` disables retrieval alone. Each new assistant question normally uses an embedding invocation plus a Qwen invocation; the existing 30-call daily limit counts both, rather than silently increasing model usage.

The RAG path is the standard `/assistant` request with a selected SKU and a recognized platform on its recorded order. An unknown platform (including the normal `mock-market` demo fixture) returns `NO_MATCH` without an embedding call. A request without a SKU does not invent an order/platform. The separate `/assistant-scenarios` route remains a deterministic hypothetical calculator using explicitly confirmed inputs; it does not run Qwen or RAG. This release does not add native marketplace connectivity or independently verify a research tariff.

## Research corpus and validity

The four supplied 24 October 2026 Markdown research files are preserved in `knowledge/fee-rules/sources/`. `npm run fees:corpus` builds 134 logical chunks, including individual fee-table rows, with source filename/line, source hash, original URLs, platform and caveats. `npm run verify` rejects corpus drift.

Every chunk is `USER_SUPPLIED_RESEARCH`, `calculationEligible:false`; the code does not independently certify source links merely because the research document says “official.” Worked examples, provisional rates, inaccessible category tables and conflicting sources remain explicit. Effective dates are preserved in the original text but not automatically normalized into a production financial rule. Search results therefore report `applicability:UNVERIFIED`; historical orders also receive a warning when the research snapshot is later than the order.

Known conflicts include Shopee Mall VAT, incomplete/secondary Lazada tariffs, LINE bank-transfer promotion dates, and unknown category-specific/program/refund details. LINE MyShop, LINE SHOPPING, OA and MINI Eats are distinct products; amounts in their source document must not be applied across products. Settlement and tax invoices remain the operational source of truth.

This is a searchable research layer, not a newly verified full marketplace tariff. Promoting a rate into `VERIFIED_FOR_ESTIMATE` requires category/tier/payment/enrollment/date/base/VAT/refund verification and reconciliation, through the existing fee-rule workflow.

## Index build and activation

Use the existing authorized team account `109991964227`, Singapore stack `marginsight`, and temporary SSO/console CLI credentials. No permanent access keys. Commands below are operator commands; do not put credentials into scripts or source control.

```bash
npm ci
npm run verify
python3 -m unittest discover -s scripts/tests
npm run fees:index                         # offline plan, no AWS calls
npm run fees:index -- --invoke-bedrock --publish
```

Before inference, the builder verifies account, the USD350 team budget and spend below the USD25 trial target, Titan account/Region availability, and the current official us-east-1 price list. It indexes public research only, one chunk at a time; a failure stops and saves a checkpoint under ignored `tmp/fee-rules/`. Resume with `--resume`. The script reports actual input token counts and a token-price estimate, distinct from total AWS bills. `--publish` uses a conditional S3 write and read-back checksum. Keep previous index objects for rollback; never overwrite them in place.

The index is ordinary JSON vectors on private S3, not an S3 Vectors service index. The object key and SHA-256 are in `tmp/fee-rules/build-report.json`. Runtime accepts only `fee-rules/v1/<64-hex>/index.json`; the operator role publishes it, runtime roles only read it.

Render and inspect the additive runtime policy using the actual existing UploadsBucket:

```bash
node scripts/fee-rules-runtime-policy.mjs <EXISTING_UPLOADS_BUCKET> > /tmp/fee-rules-policy.json
aws iam put-role-policy --role-name marginsight-assistant --policy-name MarginSightFeeRuleRag20261025 --policy-document file:///tmp/fee-rules-policy.json
aws iam put-role-policy --role-name marginsight-lineworker --policy-name MarginSightFeeRuleRag20261025 --policy-document file:///tmp/fee-rules-policy.json
python3 scripts/prepare-update.py --fee-rules-index-key <INDEX_KEY> --fee-rules-index-sha256 <SHA256>
```

The policy adds only InvokeModel for the exact Titan model in `us-east-1` and GetObject for `fee-rules/v1/*/index.json` in the existing bucket. Preserve existing Qwen/Nova policies and trust relationships. External roles are managed separately from the stack; no new role is created. Capture previous templates/parameters/code hashes and policies before any update.

`prepare-update.py` prepares only; inspect the new change set before execution. Expected changes are existing Lambda code and Assistant/LineWorker environment variables. Reject deletes, resource replacements, new roles, data-schema changes, or unexpected resources. Preserve Qwen, Nova OCR, all auth/tenant settings and other live parameters.

After executing the reviewed change set and checking read-back hashes/configuration:

```bash
npm run fees:smoke -- --invoke-aws
```

This creates one newly isolated MOCK store, uploads two tiny synthetic CSVs through the existing import/SQS path and settles a Shopee-labelled MOCK order. It then makes three bounded assistant requests, checking Qwen + Titan retrieval plus unchanged financial golden values, exact payout reconciliation, unauthenticated401 and cross-tenant403. Synthetic platform labels and posted amounts are not native marketplace data or official fees. It is not a Cognito/browser/LINE or real-merchant verification. Do not print/store the temporary demo token or signed upload URLs. Test Thai cross-language relevance on real Titan output; local stub vectors do not establish retrieval quality.

## Rollback

Prepare the current full external-roles template with `python3 scripts/prepare-update.py --disable-fee-rules`, review and execute. This preserves the index key/hash and recorded store data while stopping embeddings/retrieval. A prior code release can be restored through a separately reviewed stack update using the captured original template/artifact. Do not delete old evidence objects, merchant records, or revert authentication/IAM wholesale.

## Primary technical sources

- [Titan request/response parameters](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-titan-embed-text.html): `inputText`, `dimensions`, `normalize`, embedding output.
- [Titan model limits and multilingual caveats](https://docs.aws.amazon.com/bedrock/latest/userguide/titan-embedding-models.html): model identifier and logical chunk guidance; multilingual retrieval needs evaluation.
- [AWS us-east-1 Bedrock price list](https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonBedrock/current/us-east-1/index.json): observed25Oct2026, on-demand InvokeModel price effective1Oct2026 USD0.00002/1K input tokens; batch pricing is not used.

See `docs/verification.md`, `docs/status.md`, and `docs/cost-log.md` for the actual local/AWS verification state. Source changes alone are not a deployment claim.
