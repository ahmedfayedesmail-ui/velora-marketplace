# Velora — Phase C Foundation Migration Evidence — 2026-09-21

**Environment:** Restore-Test `arlaxqmhtvjwjbjinjfw`  
**Branch:** `sprint-2-s2d-admin`  
**Production:** **FROZEN**  
**Owner Review Gate:** **APPROVED — 2026-09-21**

## 1. Applied Migrations

1. `20260921022410_phase_c_data_contract_v2_foundation`
2. `20260921022602_phase_c_routine_acl_hardening`

The second migration was required because this project carries broad default grants for `authenticated` on public tables. Routine tables are intentionally client-read-only, so their effective client grant is SELECT only.

## 2. Data Contract Verification

`public.beauty_profiles` now contains:

- `skin_type`
- `routine_budget`

Controlled values are enforced by database CHECK constraints:

- `skin_type`: `oily`, `dry`, `combination`, `normal`, `unknown`
- `routine_budget`: `under_500`, `500_1000`, `1000_2000`, `over_2000`, `unknown`

Both fields remain nullable during the transition so the existing Phase-B / Quiz v1 contract is not broken by the foundation migration. Quiz v2 persistence will make them required for v2 writes.

## 3. Routine Tables

Created and verified:

- `public.beauty_routine_runs`
- `public.beauty_routine_steps`

The database enforces:

- Routine contract version `beauty-routine.v1`
- Ruleset version `beauty-rules.v2`
- Routine status `complete | partial | no_matches`
- Step order 1–6
- Step type `cleanse | treat | moisturize | protect`
- Selection status `selected | unavailable | not_needed`
- One row per `routine_run_id + step_order`
- Selected step requires a product and non-empty reason codes
- Unavailable / not-needed steps cannot carry a product
- Product FK = RESTRICT
- Variant FK = SET NULL
- Run/step ownership chain = CASCADE from `beauty_profiles`

## 4. RLS / ACL Verification

RLS is enabled on both Routine tables.

Policies:

- `beauty_routine_runs_own_read`
- `beauty_routine_steps_own_read`

Behavioral tests using Supabase JWT claim simulation:

- Customer test identity sees only its own Routine run.
- Seller test identity sees only its own Routine run.
- Customer test identity sees only its own Routine steps.
- No test Routine rows persist after transaction rollback.

Effective table grants:

- `authenticated`: SELECT only on both Routine tables.
- `anon`: no table grant.
- No client INSERT / UPDATE / DELETE / TRUNCATE / REFERENCES / TRIGGER access.

## 5. Advisor Check

Security advisor check: no new Beauty Routine security finding detected.

Performance advisor check: no new Routine foreign-key indexing finding detected. Newly-created product/variant indexes can appear as unused while the Routine tables contain no persistent runtime data; this is expected at foundation stage and is not treated as a defect.

## 6. Scope Boundary

Implemented now:

- Passport v2 foundation columns
- Routine run/step schema
- constraints
- indexes
- RLS
- client ACL hardening

Not implemented yet:

- Quiz v2 writer RPC
- Rules Engine v2 calculation RPC
- Routine cache/rate-limit operation
- Routine read contract
- Routine UX
- Sprint 1 UI

Phase-B Recommendation remains unchanged.

## 7. Status

**Phase C Foundation = VERIFIED**

**Owner Review Gate = APPROVED**

**Routine Verification = NEXT GATE**

**Production = FROZEN**

