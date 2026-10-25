# Storefront listing fixtures — 25 October 2026

Explicit MOCK catalog values requested by the user; quantities are synthetic current counts, not an inventory ledger. Prices do not replace historical order revenue.

| SKU | Selling price THB | Quantity |
|---|---:|---:|
| BAG-001 | 200.00 | 24 |
| BAG-002 | 199.00 | 18 |
| CUP-003 | 299.00 | 20 |
| CASE-004 | 129.00 | 40 |
| CAP-005 | 159.00 | 30 |
| BOOK-006 | 89.00 | 50 |
| KEY-007 | 59.00 | 60 |

New isolated guest stores seed these fields. Existing authorized OWNER guest MOCK stores receive only missing listing fields during catalog reads, on at most seven known fixture rows. The row must belong to that tenant and retain the fixture's exact MOCK provenance. Conditional row versions protect simultaneous merchant edits; zero and already-entered values are preserved. No update repeats once fields are present. Personal, REAL, VIEWER, non-guest stores and merchant-created rows are excluded.

No costs, orders, fee rules, settlements, calculated profit or merchant-created products are changed. KEY-007 still has unknown cost and no sale; adding a catalog price is not evidence of profit. Browser pricing/import contracts and the domain financial engine are unchanged.

Local verification: Backend73 tests, including fresh guest defaults, upgrade/idempotence, unknown-cost preservation, unchanged ledger/costs, zero/edited values, REAL/personal/viewer/non-guest exclusion, and a simultaneous merchant-write race. AWS verification is recorded separately in verification.md.
