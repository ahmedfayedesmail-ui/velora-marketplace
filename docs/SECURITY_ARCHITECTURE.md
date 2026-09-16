# Velora Security Architecture

## Audit Discipline

During security audit:
- Functions classified as WRITE or CONDITIONAL_WRITE must NOT be executed.
- Classification is performed via body inspection + recursive helper tracing only.
- Actual execution is deferred until after audit closure.

## Classification Rules (Authoritative)

Side-effect classification must NOT rely on:
- Function name (`get_*` may have side effects in legacy code)
- `provolatile` (`VOLATILE` is not a write indicator)
- `SECURITY DEFINER` (not an indicator of writes)
- `EXECUTE` grants (not an indicator of writes)

Side-effect classification MUST rely on:
1. Body inspection (`INSERT`/`UPDATE`/`DELETE`/mutation helper calls)
2. Recursive helper tracing
3. Terminal side-effect boundary identification
4. `pg_depend` as supporting evidence only; it is not sufficient for runtime function-call tracing

Examples:
- `velora_get_automation_control_plane`: VOLATILE + SECURITY DEFINER + staff-gated -> READ-ONLY
- `velora_get_e2e_readiness`: `get_*` name -> WRITE (confirmed)
- `velora_get_admin_analytics`: HIGH sensitivity + READ-ONLY

## Dependency Types

| Type | Definition | Detection |
|---|---|---|
| EXECUTED_CALL | Actual function invocation | Body inspection shows call syntax; verify it is not inside a string/comment |
| STATIC_REFERENCE | Name/string mention, no invocation | String literal or comment/reference without call syntax |
| CATALOG_EXISTENCE_CHECK | Capability existence test | `pg_proc`/`pg_class` lookup such as `WHERE proname = '...'` |
| UNKNOWN_EXTERNAL | Potential client outside repository/database visibility | Not verifiable from DB/code |

### Detection Rules

A dependency is `EXECUTED_CALL` only when body inspection confirms executable call syntax outside string literals/comments. `pg_depend`, where useful, is corroborating evidence rather than the authoritative source for runtime function-to-function calls.

## Why Dependency Tracing is Manual

PostgreSQL does not provide a complete authoritative graph of runtime function-to-function calls in `pg_depend`. Therefore:
- No automatic runtime dependency graph is sufficient for this audit.
- Body inspection is authoritative for `EXECUTED_CALL` classification.
- Dynamic SQL and string-based capability checks require separate review.
- Automated tooling can assist discovery but cannot replace manual confirmation.

### Implications

- Dependency validation for this class is inherently inspection-driven.
- The four-type dependency model (`EXECUTED_CALL` / `STATIC_REFERENCE` / `CATALOG_EXISTENCE_CHECK` / `UNKNOWN_EXTERNAL`) is authoritative for this audit.

## Dependency Fields

| Field | Values |
|---|---|
| Reference subtype | EXECUTED_CALL / STATIC_REFERENCE / CATALOG_EXISTENCE_CHECK / UNKNOWN_EXTERNAL |
| Direct callers | Count + list |
| Recursive callers | Count + chain; traversal may be bounded operationally |
| Traversal status | complete / pending / unknown |
| Internal caller confidence | confirmed / partial / unknown |
| External caller confidence | confirmed / partial / unknown |

A recursion safety bound may be used for tooling. If the traversal exceeds the bound, record `deep chain - needs separate analysis`; do not treat truncation as proof of zero additional callers.

## Confirmed Naming Violations

| Function | Declared | Actual | Severity | Operational Risk |
|---|---|---|---|---|
| `velora_get_e2e_readiness` | get | WRITE | High | Any monitoring/dashboard caller can mutate `e2e_readiness_runs` and `e2e_readiness_checks`. |
| `velora_get_growth_intelligence` | get | CONDITIONAL WRITE | Medium | First call when no current snapshot exists triggers a snapshot write. |
| `velora_get_security_attack_surface_audit` | get | CONDITIONAL WRITE | Medium | Ops dashboards can inadvertently trigger a security audit when no prior run exists. |

## Cleared (Regex False Positives)

| Function | Classification |
|---|---|
| `velora_get_product_activation_control_plane` | READ-ONLY |
| `velora_get_launch_readiness` | READ-ONLY |
| `velora_get_security_diagnostics` | READ-ONLY |

## Regex Scan Limitations

Function-name matching does not prove execution. `pg_proc` checks, string literals, and comments can create false positives. Body inspection plus recursive helper tracing is authoritative.

## Naming Violation Remediation Plan (Deferred to Wave 3)

### Phase 1: Preparation (after audit closure)
- Verify no external callers appeared during audit.
- Create rename mapping table.

### Phase 2: Add new functions (no breaking changes)
- Create the correctly named function.
- Delegate the old name to the new name via wrapper where compatibility is required.
- Preserve the existing execute grants during migration.

### Phase 3: Update callers
- Update confirmed internal callers.
- Update documentation.
- Update monitoring/dashboards and other known clients.

### Phase 4: Deprecate old names
- Observe a stable period of at least 30 days.
- Remove old wrappers in a controlled migration.
- Record removal in the migration history.

### Rename Contract

A new function MUST preserve:
- Same EXECUTE grants
- Same SECURITY DEFINER / INVOKER mode
- Same search_path
- Same volatility
- Same authorization model
- Same side-effect class
- Same return type structure
- Same error messages

Regression testing must compare old and new behavior at the write boundary where the semantics are intentionally preserved.

## Pending Table Reviews (Post-Audit)

| Triggered by | Table / View | Why |
|---|---|---|
| `velora_get_admin_analytics` | `orders`, `order_items` | Financial aggregates via SECURITY DEFINER |
| `velora_get_admin_analytics` | `fraud_risk_events` | Risk data via SECURITY DEFINER |
| `velora_get_admin_analytics` | `disputes` | Dispute data via SECURITY DEFINER |
| `velora_get_marketplace_catalog` | `velora_marketplace_catalog` | Anon-accessible catalog; verify published-only semantics |
| `velora_get_localized_content` | `product_translations` | Anon-accessible localization surface; verify visibility semantics |
