# Velora — Sprint 1 Phase B
## B5 Recommendation Read Hardening — Evidence — 2026-09-20

**Branch:** `sprint-2-s2d-admin`  
**Target:** Restore-Test (`arlaxqmhtvjwjbjinjfw`)  
**Production:** **FROZEN**  
**Status:** **PASS — Restore-Test/source gate**  
**Browser:** Not required for engineering PASS; remains a later browser gate.

## 1. Source Investigation

Existing B2 persistence tables were RLS-protected for customer ownership, but their raw schemas included internal fields:

- `beauty_recommendation_runs.user_id`
- `beauty_recommendation_runs.input_snapshot`
- `beauty_recommendation_runs.input_fingerprint`

The existing authenticated table grants also included direct INSERT/UPDATE/DELETE privileges, although RLS prevented unauthorized row operations.

Decision:

- keep RLS as the row-ownership boundary;
- add a sanitized authenticated read RPC;
- remove direct application write privileges;
- restrict readable run columns to the minimum required persisted read data.

## 2. Implementation Delivered

Canonical RPC:

`public.velora_get_beauty_recommendation_history(p_limit integer default 10)`

Implementation properties:

- SECURITY INVOKER
- authenticated EXECUTE only
- anonymous EXECUTE disabled
- no owner UUID input
- limit clamped to 1–10
- safe output contract: `beauty-recommendation-read.v1`
- returns persisted runs and recommendation items with canonical catalog hydration
- does not create or mutate recommendation runs
- does not interact with B2 cache or rate-limit state

Privilege hardening:

- INSERT/UPDATE/DELETE revoked from `anon` and `authenticated` on recommendation runs/items.
- Authenticated SELECT on recommendation runs limited to:
  `id, user_id, ruleset_version, catalog_revision, created_at`.
- Internal `input_snapshot` and `input_fingerprint` are not SELECT-readable by the authenticated role.
- Authenticated SELECT on recommendation items limited to the persisted recommendation fields required by the read contract.
- Anonymous SELECT on recommendation runs/items revoked.

## 3. Migration History

B5 Restore-Test chain:

1. `20260920204458 / s1_b5_beauty_recommendation_read_contract`
2. `20260920204600 / s1_b5_beauty_recommendation_read_privilege_hardening`

Both migrations applied successfully on Restore-Test.

## 4. Runtime Verification

### B5-01 — Canonical read response

Transaction-scoped fixtures created one run for the authenticated test customer and one run for another user.

The authenticated read operation returned only the current user's run and its recommendation item.

Observed contract version:

`beauty-recommendation-read.v1`

The result contained:

- run identity
- ruleset version
- catalog revision
- creation timestamp
- recommendation position
- canonical product/variant IDs
- score
- reason codes
- canonical product display data
- canonical variant display data where available

## 5. RLS Isolation

With the session identity set to the test customer:

- own visible recommendation runs = **1**
- another user's filtered recommendation runs = **0**

The read RPC therefore relies on the existing row-level ownership boundary rather than accepting an owner UUID from the browser.

## 6. Internal Field Protection

Column privilege verification:

- `user_id` SELECT = allowed for policy evaluation
- `input_snapshot` SELECT = **false**
- `input_fingerprint` SELECT = **false**

The sanitized RPC response contains neither `input_snapshot` nor `input_fingerprint`.

## 7. Direct Write Protection

After hardening:

- authenticated INSERT on recommendation runs = denied by privilege
- authenticated UPDATE on recommendation runs = denied by privilege
- authenticated DELETE on recommendation runs = denied by privilege
- same write privileges denied for recommendation items

B2 remains the authoritative server-side writer.

## 8. Function Security Verification

`public.velora_get_beauty_recommendation_history(integer)`:

- authenticated EXECUTE = **true**
- anonymous EXECUTE = **false**
- SECURITY DEFINER = **false**

No owner/customer UUID argument exists.

## 9. Advisor Check

Security Advisor was run after B5 changes.

No B5-specific security warning was introduced.

Performance Advisor continues to report existing unused-index INFO notices on Beauty recommendation item indexes; no new B5-specific performance defect was identified.

## 10. Fixture Hygiene

All runtime fixtures were transaction-scoped and rolled back.

Final Beauty recommendation tables remain clean after the test run.

## 11. Production Control

No Production DB migration, data change, deployment, provider configuration, or credential change was performed.

**B5 = PASS on Restore-Test/source gate.**

Next step:

**B6 — Regression + Phase B Close.**
