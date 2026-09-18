# S2-A Hotfix Regression Evidence

Environment: Restore-Test (`velora-restore-test`)
Project ref: `arlaxqmhtvjwjbjinjfw`
Date: 2026-09-19

## Regression result

**PASS — S2-A HOTFIX REGRESSION PASS**

The final regression was executed in one transaction with rollback at the end, so the regression fixtures left no persistent business data.

The test covered:
- authenticated seller session simulation;
- variant create;
- variant update;
- variant retire/lifecycle;
- authenticated customer variant read;
- cart add;
- cart quantity update;
- cart removal;
- checkout using a selected variant;
- order creation;
- variant snapshot in `order_items`;
- variant stock decrement;
- checkout idempotency replay.

Representative successful assertions:
- 2 active variants + 1 retired variant after lifecycle operations;
- customer saw exactly 2 active variants;
- Red/M cart quantity reached 2 and Blue/M was removed;
- checkout total = EGP 240;
- Red/M stock changed from 5 to 3;
- order item retained variant name `Red / M` and attributes `{"color":"red","size":"M"}`;
- idempotency replay returned the same order with `idempotent=true`.

The final SQL result was exactly:
`S2-A HOTFIX REGRESSION PASS`

## Versioned migrations

The six migration versions already exist in the Restore-Test migration history:

1. `20260918210859` — `s2a_variant_writer_rls_hotfix`
2. `20260918211152` — `s2a_cart_variant_writer_rls_hotfix`
3. `20260918211212` — `s2a_cart_quantity_rls_hotfix`
4. `20260918211242` — `s2a_checkout_identity_column_hotfix`
5. `20260918211301` — `s2a_checkout_currency_lookup_hotfix`
6. `20260918211313` — `s2a_checkout_product_sku_hotfix`

The GitHub migration files use these same version identifiers.

## Security / release note

The three SECURITY DEFINER fixes do not remove caller-side ownership checks; they move the internal write path into the controlled function security context required by the existing RLS model.

Browser E2E remains a residual and is not represented as PASS.

Production remains FROZEN.
