# Velora — Sprint 2 Consolidated Integration Evidence
## 2026-09-19

Environment: Restore-Test only  
Restore-Test project ref: `arlaxqmhtvjwjbjinjfw`  
Production project ref: `cogplqokzxqaedvjxbwu`  
Production status: **FROZEN**

## Verdict

**FULL CHAIN INTEGRATION: PASS**

The chain was executed in one PostgreSQL transaction on Restore-Test:

`Variants -> Reviews -> Wishlist -> Notifications -> Admin`

The transaction completed all stage assertions successfully, then issued `ROLLBACK`.

A separate post-rollback residue query returned zero fixture rows.

## Fixture / safety model

The transaction created dedicated synthetic users, seller/store/product and used deterministic identifiers. Existing governance triggers were bypassed only during fixture seeding with transaction-local `session_replication_role = replica`; it was immediately restored to `origin`.

The actual feature runtime paths were then exercised under authenticated seller/customer contexts.

Staff-controlled review moderation and admin dashboard reads were executed under the database-owner context because the connector session's authenticated role cannot directly traverse the project's private schema. Separate S2-C/S2-D authorization evidence already proves the authenticated staff gate. No application authorization was weakened for this test.

## Stage results

| Stage | Result | Evidence |
|---|---|---|
| S2-A Variant create | PASS | Authenticated seller created variant; variant id returned |
| S2-A Variant read | PASS | Authenticated customer read the created active variant |
| S2-B Wishlist | PASS | Customer toggle/read returned the approved product |
| S2-A Cart | PASS | Variant-bound cart item persisted at quantity 2 |
| S2-A Checkout / Order | PASS | Order created for customer |
| S2-A Variant snapshot | PASS | Order item retained variant id + `Red / Medium` snapshot |
| Review eligibility | PASS | Delivered-order eligibility returned true |
| S2-C Review submit | PASS | Verified-purchase review entered pending state |
| S2-C Review publish | PASS | Staff moderation changed review to published |
| S2-E Seller notification | PASS | Seller notification count increased |
| S2-E Customer notifications | PASS | Customer notification count = 3 in test transaction |
| S2-E Mark all read | PASS | Unread count reached 0 |
| S2-D Admin | PASS | Admin dashboard returned chain-consistent counts |

The final transaction-level assertion returned:

`all_pass = true`

Observed chain facts included:
- variant created: true
- variant read: true
- wishlist: true
- cart variant binding: true
- order created: true
- order item variant snapshot: true
- review eligibility: true
- review submitted/published/verified: true
- seller notifications present: true
- customer notifications present: true
- admin dashboard chain counts: true

## Rollback / residue

The integration test itself ended with `ROLLBACK`; it did not commit any fixture data.

A separate residue verification after the rollback returned:

`variant_residue = 0`
`product_fixture_residue = 0`
`seller_fixture_residue = 0`
`store_fixture_residue = 0`
`order_residue = 0`
`review_residue = 0`
`role_residue = 0`
`user_residue = 0`
`profile_residue = 0`

## Production isolation

Restore-Test migration history contains the Sprint 2 feature migrations.

Production migration history contains none of the Sprint 2 feature migration versions:
- 20260918194021
- 20260918194243
- 20260918195034
- 20260918210859
- 20260918211152
- 20260918211212
- 20260918211242
- 20260918211301
- 20260918211313
- 20260919053023
- 20260919053229
- 20260919053354
- 20260919053811
- 20260919054924
- 20260919055000
- 20260919055525
- 20260919060045
- 20260919061938

No Production migration, Edge Function deployment, provider credential change, or backfill was performed by this integration gate.

## Interpretation

This evidence closes the consolidated Sprint 2 integration requirement at the database/RPC level. It does not claim Browser/UI E2E coverage.

Browser E2E remains a separate launch-gate residual because this environment has no genuine interactive browser session.
