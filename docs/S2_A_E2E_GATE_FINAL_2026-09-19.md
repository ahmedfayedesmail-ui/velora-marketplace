# S2-A E2E Gate — Final Evidence (2026-09-19)

Environment: Restore-Test only (`velora-restore-test`, ref `arlaxqmhtvjwjbjinjfw`).
Production ref: `cogplqokzxqaedvjxbwu` — FROZEN.

## Verdict

S2-A SQL-level authenticated E2E: PASS.
Browser/UI E2E: NOT TESTED (residual).

Authentication/RLS simulation used:
- request.jwt.claims
- SET LOCAL ROLE authenticated

## PASS coverage

Seller: authenticated variant create, update, retire, and read.
Customer: authenticated variant read, cart add, quantity update, remove, checkout, order read, order-item snapshot read.
Financial/inventory: variant stock decrement 5 -> 3; order total 240 EGP; variant snapshot preserved Red / M + {"size":"M","color":"red"}; idempotent replay returned the same order.
Security: customer attempt to mutate the seller variant was rejected with APPROVED_SELLER_REQUIRED.
Cleanup: seller/store/product/variants/order/cart/test public profile/test public user fixtures all returned to 0.

## Restore-Test defects found and corrected during E2E

- Variant writer/retire audit-log writes required SECURITY DEFINER with ownership checks under authenticated RLS.
- Cart variant upsert required SECURITY DEFINER because the authenticated customer cannot see the seller row needed by the availability join.
- Cart quantity update used SELECT ... FOR UPDATE and therefore required update visibility; moved to SECURITY DEFINER with auth.uid ownership checks.
- velora_create_order previously inserted an explicit value into orders.order_number even though it is GENERATED ALWAYS.
- velora_create_order idempotency lookup could overwrite p_currency with NULL when the lookup found no row.
- velora_create_order referenced products.sku although the current products schema has no sku column; variant SKU remains authoritative.

These fixes were applied to Restore-Test only and require versioned migration/rollback capture before any Production consideration.

## Production verification after E2E

products=1
product_variants=0
orders=1
order_items=1

No S2-A E2E fixture data was added to Production.
