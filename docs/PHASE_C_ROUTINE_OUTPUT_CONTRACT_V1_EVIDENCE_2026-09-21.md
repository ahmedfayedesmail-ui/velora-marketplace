# Velora — Routine Output Contract v1 Evidence
## 2026-09-21

**Branch:** `sprint-2-s2d-admin`  
**Environment:** Restore-Test (`velora-restore-test`)  
**Production:** **FROZEN**  
**Status:** **VERIFIED**

## Contract

Root response:

- `contract_version`: `beauty-routine.v1`
- `status`: `complete | partial | no_matches`
- `steps[]`
- `total_cost`
- `currency`

Each emitted step contains:

- `step_order`
- `step_type`
- `time_of_day`
- `selection_status`
- `product`
- `variant`
- `reason_codes`

Internal routine metadata is not part of the client contract.

Explicitly not exposed:

- `input_fingerprint`
- `catalog_revision`
- `ruleset_version`
- internal `run` object
- internal routine persistence fields not listed above

## Implementation

The existing response builder `private.beauty_build_routine_response(uuid)` was narrowed to the customer-safe v1 contract and now calculates `total_cost` from the selected product/variant price.

The builder is explicitly non-callable by `public`, `anon`, and `authenticated`. It is only used internally by the routine operation.

The public RPC `public.velora_generate_beauty_routine()` keeps the existing server-side routine generation and now guarantees that successful responses use only the three contracted statuses.

An incomplete Passport is treated as a precondition failure:

- SQLSTATE: `22023`
- message: `PASSPORT_INCOMPLETE`

It is not represented as a Routine result status.

## Verification Results

### Complete

Fixture with six eligible Beauty products:

- status = `complete`
- steps = 6
- AM + PM sequence preserved
- variant returned on the SPF step
- total_cost = `565`
- currency = `EGP`
- reason_codes present for selected steps
- no fingerprint / catalog revision / ruleset / run object exposed

### Partial

Fixture with required catalog gap:

- status = `partial`
- selected-product cost = `270`
- unavailable required steps carry no product
- no fabricated replacement
- currency = `EGP`

### No matches

Valid v2 Passport against the clean Restore-Test catalog:

- status = `no_matches`
- steps = 0
- total_cost = `0`
- currency = `EGP`

### Security / ACL

Verified:

- `anon` EXECUTE on `public.velora_generate_beauty_routine()` = **false**
- `authenticated` EXECUTE = **true**
- `anon` EXECUTE on private response builder = **false**
- `authenticated` EXECUTE on private response builder = **false**

## Cleanup

All contract test fixtures were removed.

Verified clean state after testing:

- `beauty_profiles` = 0
- `beauty_routine_runs` = 0
- `beauty_routine_steps` = 0
- temporary test products = 0

## Supabase Platform Note

Supabase has announced that new `public` tables will require explicit Data API grants as the platform rollout reaches existing projects on **2026-10-30**. The Routine tables already use explicit ACL hardening from the Phase-C foundation, so this contract work did not rely on implicit table exposure.

## Out of Scope

- Routine UX
- Quiz v2 frontend
- commercial logic
- subscriptions
- seller operations
- fulfillment provider selection
- Production deployment

## Next

**Routine Verification → Routine UX → Sprint 1 UI**

Production remains **FROZEN**.
