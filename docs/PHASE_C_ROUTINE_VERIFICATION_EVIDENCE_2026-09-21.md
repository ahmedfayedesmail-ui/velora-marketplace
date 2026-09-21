# Velora — Phase C Routine Verification Evidence
## 2026-09-21

**Branch:** `sprint-2-s2d-admin`  
**Environment:** Restore-Test (`velora-restore-test`)  
**Production:** **FROZEN**  
**Status:** **VERIFIED / PHASE C ROUTINE VERIFICATION CLOSED**

## Scope

Verified:

- complete / partial / no_matches
- deterministic repeat
- all four budget bands
- variant selection
- required unavailable → partial
- optional unavailable → omitted
- no product reuse
- reason_codes evidence
- no internal metadata leak
- RLS / cross-user isolation
- clean rollback

## Key Finding and Remediation

Verification exposed a real step-eligibility bug: the previous matcher allowed generic goal/concern metadata such as `brightening` in tags/benefits to make a moisturizer eligible for the `treat` step.

This violated the approved step-specific eligibility boundary.

Remediation:

- migration: `20260921033114_phase_c_routine_step_match_hardening`
- generic goal/concern tokens remain valid evidence for matching within the step-specific field model;
- generic tags/benefits no longer define `treat` by themselves;
- treatment tags/benefits must use explicit treatment semantics;
- equivalent explicit matching remains for cleanse, moisturize, and protect.

Focused unit verification:

- moisturizer as treat = **false**
- moisturizer as moisturize = **true**
- explicit treat product as treat = **true**

## Complete

Verified with six eligible Beauty fixtures:

- status = `complete`
- steps = 6
- total_cost = **565 EGP**
- currency = `EGP`
- AM/PM sequence preserved
- Protect step returned a selected active variant
- selected products = 6
- distinct selected products = 6
- selected steps with empty reason codes = 0
- deterministic repeat = **true**
- internal metadata leakage = **none**

Explicitly absent from client response:

- `input_fingerprint`
- `catalog_revision`
- `ruleset_version`
- internal `run`

## Budget Bands

Same catalog, profile budget changed per case:

| Budget | Result | Total |
|---|---|---:|
| `under_500` | complete | 465 EGP |
| `500_1000` | complete | 565 EGP |
| `1000_2000` | complete | 565 EGP |
| `over_2000` | complete | 565 EGP |

Every generated total remained within its deterministic cap.

## Optional Unavailable

PM cleanser and PM treat candidates were removed from eligibility.

Verified:

- status = `complete`
- steps = 4
- step orders 5 and 6 were omitted
- no fabricated optional rows

This confirms current approved behavior: optional unavailable candidates are omitted rather than returned as fake selections.

## Required Unavailable

Protect product stock and active variant stock were both set to zero.

Verified:

- status = `partial`
- selected required products remained available
- Protect step = `unavailable`
- Protect product = null
- total selected cost = **270 EGP**
- no fabricated replacement

## No Matches

All temporary Beauty fixtures were removed from eligibility.

Verified:

- status = `no_matches`
- steps = 0
- total_cost = 0
- currency = `EGP`

## No Product Reuse

Complete case:

- selected steps = 6
- distinct selected product IDs = 6

No product was reused across Routine steps.

## Reason Evidence

Every selected step contained non-empty structured `reason_codes`.

Current allowed evidence codes remain:

- `goal_match`
- `concern_match`
- `skin_type_match`
- `step_match`
- `availability_match`
- `budget_fit`

No free-form AI explanation is stored in the Routine response.

## RLS / Cross-User Isolation

Verified as `authenticated` user A:

- visible runs = 1
- own runs = 1
- other-user runs = 0
- visible steps = 1
- own steps = 1
- other-user steps = 0

The existing ownership policies therefore prevented cross-user Routine visibility.

## Public RPC / Private Builder ACL

Previously verified and retained:

- anonymous EXECUTE on `public.velora_generate_beauty_routine()` = false
- authenticated EXECUTE = true
- private response builder is not executable by anonymous/authenticated callers

## Clean Rollback

After transaction-scoped verification:

- `beauty_profiles` = 0
- `beauty_routine_runs` = 0
- `beauty_routine_steps` = 0
- temporary verification products = 0

No verification fixture remains.

## Supabase Security Advisor

Project-wide unrelated advisor findings remain elsewhere in the project (legacy SECURITY DEFINER/public exposure and other pre-existing findings).

No new Routine-specific security issue was introduced by the hardening migration.

## Production Control

No Production DB change, data change, credential change, or deployment was performed.

## Result

**Routine Verification = CLOSED**

The Routine engine is now verified against the approved Phase-C behavioral contract.

## Next

**Routine UX → Quiz v2 UI → Sprint 1 integration**

Phase D continues independently with operations/trust/economics planning.
