# Velora — Phase C
## Quiz v2 Save RPC Evidence — 2026-09-21

**Branch:** `sprint-2-s2d-admin`  
**Target:** Restore-Test (`arlaxqmhtvjwjbjinjfw`)  
**Production:** **FROZEN**  
**Status:** **VERIFIED — Restore-Test/DB gate**  
**Browser:** Not part of this gate.

## 1. Contract Decisions

### v1 → v2 migration strategy
- Existing `beauty-quiz.v1` rows remain valid.
- No bulk/automatic upgrade is performed.
- First successful v2 save transitions that user's Passport row to `beauty-quiz.v2`.
- Existing optional legacy fields are preserved during that transition.

### v2 requiredness
- `skin_type` is required for `beauty-quiz.v2`.
- `routine_budget` is required for `beauty-quiz.v2`.
- `unknown` is the explicit value for a user who does not know the answer.
- `concern` is nullable because it is an optional follow-up in the approved three-question path; no value is fabricated.

### Save semantics
- Upsert by the canonical Passport primary key `user_id`.
- v2 is a core-field update: `quiz_version`, `goal`, `skin_type`, `routine_budget`, `updated_at`.
- Existing optional fields are not cleared by a v2 core save.

## 2. RPC Contract

`public.velora_save_beauty_passport_v2(p_skin_type text, p_goal text, p_routine_budget text)`

- `SECURITY INVOKER`
- ownership from `(select auth.uid())`
- no client `user_id` argument
- supported skin values only:
  `oily`, `dry`, `combination`, `normal`, `unknown`
- supported budget values only:
  `under_500`, `500_1000`, `1000_2000`, `over_2000`, `unknown`
- goal is normalized and required; no undocumented goal whitelist was invented
- anonymous EXECUTE revoked
- authenticated EXECUTE granted
- server-generated `updated_at`

## 3. Backward Compatibility

The original B1 RPC remains version-specific to `beauty-quiz.v1`.

Quiz v2 does not rewrite or reinterpret the B1 contract. A legacy row can remain v1 until that user completes the v2 path.

The only schema compatibility change is making legacy `concern` nullable so the approved three-question v2 minimum path does not invent a concern.

## 4. Verification Results

A transaction-scoped test created a v1 profile, upgraded it through the v2 RPC, created a separate v2 profile for another user, then rolled back all data.

Observed:

| Check | Result |
|---|---|
| v1 row valid before upgrade | PASS |
| v2 upgrade | PASS |
| v2 fields persisted | PASS |
| existing concern preserved | PASS |
| second user sees own row | PASS |
| cross-user SELECT visibility | PASS — 0 rows |
| A unchanged by B save | PASS |
| invalid skin_type | PASS — `INVALID_SKIN_TYPE` |
| invalid routine_budget | PASS — `INVALID_ROUTINE_BUDGET` |
| anonymous RPC | PASS — denied |
| profile notification side effect | PASS — count unchanged (6 → 6 in test session) |
| final data cleanup | PASS |

Final clean-state verification:

- `beauty_profiles = 0`
- `beauty_routine_runs = 0`
- `beauty_routine_steps = 0`

## 5. Security Verification

Final function inspection:

- `security_definer = false`
- `search_path = public, pg_catalog`
- `anon_execute = false`
- `authenticated_execute = true`

v2-required constraints are present:

- `beauty_profiles_v2_skin_type_required`
- `beauty_profiles_v2_routine_budget_required`

No v2-specific Security Advisor issue was identified. The project still has unrelated pre-existing advisor findings outside this scope.

## 6. Notifications Boundary

No notification write is performed by the RPC. The verification session showed no change in the user's notification count.

## 7. Engineering Boundary

Not implemented in this gate:

- Quiz v2 frontend UI
- Routine Output Contract
- Routine UX
- browser E2E

Production remains frozen.
