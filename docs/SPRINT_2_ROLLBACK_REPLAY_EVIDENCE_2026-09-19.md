# Velora — Sprint 2 Rollback Replay Evidence
## 2026-09-19

Environment: Restore-Test only  
Production: **FROZEN**

## RG-06 decision

**RG-06 = CLOSED WITH DOCUMENTED CONTROL EXCEPTIONS**

All executable Sprint 2 rollback SQL artifacts were replayed inside isolated transactions on Restore-Test. Each transaction was rolled back after verification, so rollback testing did not persist state.

## Replay matrix

| Migration | Rollback | Replay result | Notes |
|---|---|---|---|
| 20260918194021 | S2_ROLLBACK_01 reference | CONTROLLED EXCEPTION | Historical SQL body is not exposed by Supabase migration history; inverse depends on the captured preflight function snapshot. Guessing an inverse would violate Evidence > Assertion. |
| 20260918194243 | S2_ROLLBACK_01A reference | CONTROLLED EXCEPTION | Same preflight-snapshot dependency; reference is the exact recorded inverse target, not a self-contained guessed SQL script. |
| 20260918195034 | S2_ROLLBACK_01B reference | CONTROLLED EXCEPTION | Same principle; exact pre-01B function definition is required before executing inverse. |
| 20260918210859 | hotfix 1 rollback | PASS | SECURITY INVOKER state verified inside transaction. |
| 20260918211152 | hotfix 2 rollback | PASS | SECURITY INVOKER state verified inside transaction. |
| 20260918211212 | hotfix 3 rollback | PASS | SECURITY INVOKER state verified inside transaction. |
| 20260918211242 | hotfix 4 rollback | PASS-AS-GUARD | Intentionally blocked by `orders.order_number` GENERATED ALWAYS. This is the documented safety guard. |
| 20260918211301 | hotfix 5 rollback | PASS | `v_existing_currency` removed in transaction and state verified. |
| 20260918211313 | hotfix 6 rollback | PASS-AS-GUARD | Intentionally blocked because `public.products.sku` does not exist in the current schema. |
| 20260919053023 | S2-C authoritative rollback | PASS | Feature functions/indexes/trigger removed inside transaction. |
| 20260919053229 | S2-C security rollback | PASS | Five review read functions restored to SECURITY DEFINER in transaction. |
| 20260919053354 | S2-C feed rollback | PASS | Published feed function/index removed in transaction. |
| 20260919053811 | S2-C RLS rollback | PASS | Previous review policy shape recreated and verified in transaction. |
| 20260919054924 | S2-B no-op rollback | PASS | Migration itself is a documented no-op marker; rollback is intentionally no-op. |
| 20260919055000 | S2-B authoritative-path rollback | PASS | Previous wishlist policy/grant/function shape recreated in transaction. |
| 20260919055525 | S2-B privilege rollback | PASS | Direct insert privilege to anon was absent while authenticated select remained present, matching rollback intent. |
| 20260919060045 | S2-E notifications rollback | PASS | Previous FK/policy/function/trigger direction replayed in transaction. Rollback artifact was corrected to drop the actual six-argument notification writer. |
| 20260919061938 | S2-D dashboard rollback | PASS | Dashboard RPC dropped in transaction and absence verified. |

## Rollback artifact correction

One real rollback defect was found before final closure:

`private.velora_create_notification` has six parameters, but the original S2-E rollback artifact attempted to drop a zero-argument function.

Corrected statement:
`drop function if exists private.velora_create_notification(uuid,text,text,text,text,uuid);`

This was a rollback-control artifact correction only; it is not a production schema change and does not require a runtime migration.

## Why the three S2-A core references were not executed as guessed SQL

The Restore-Test migration ledger stores version/name, not the original SQL body. The original pre-migration function definitions are required for the inverse of 20260918194021/194243/195034. The repository now contains the rollback references and explicit instructions to restore those preflight snapshots.

That is a controlled exception, not a fake PASS.

## Safety

Every executable replay was wrapped in `BEGIN ... ROLLBACK`. Production was never targeted.
