# Velora S2-E Notifications — Regression Evidence
Date: 2026-09-19
Environment: Restore-Test (`arlaxqmhtvjwjbjinjfw`)
Production: FROZEN

## Migration
- `20260919060045_s2e_notifications_foundation.sql`
- Rollback: `docs/rollback/20260919060045_s2e_notifications_foundation.rollback.sql`

## Regression result
**PASS**

### Security / RLS
- notifications FK -> `public.users(id)`: PASS
- RLS enabled: PASS
- exactly one notification SELECT policy: PASS
- anon direct table SELECT denied: PASS
- authenticated direct INSERT denied: PASS
- authenticated direct UPDATE denied: PASS
- private notification writer not executable by anon/authenticated: PASS
- read RPCs SECURITY INVOKER + empty search_path: PASS
- mark-read RPCs SECURITY DEFINER + empty search_path: PASS
- public RPC execute grants: PASS
- anon runtime read RPC denied: PASS
- cross-user mark-read blocked: PASS

### Behavioral
- own-notification read isolation: PASS
- unread count 2 -> 1 -> 0: PASS
- mark-one-read + read_at: PASS
- mark-all-read count: PASS
- direct DML runtime denied: PASS
- new-user welcome notification trigger: PASS
- order insert notification: PASS
- order status notification: PASS
- S2-C review -> seller notification integration: PASS
- seller approval notification trigger: PASS
- product approval notification trigger: PASS

Status-transition triggers were tested as DB-owner with a staff JWT context so existing seller/product RLS could not silently convert the update into a zero-row operation. This isolates trigger behavior from pre-existing moderation RLS.

## Static verification
- `src/scripts/55-s2e-notifications.js` syntax compile: PASS
- Script length: 9,242 chars
- Manifest entry order 55: PASS
- `src/index.html` order: script 53 -> 54 -> 55: PASS

## Restore-Test residue
After the transactional regression, rollback restored the business fixtures.
- notifications: 0
- S2-E test orders: 0
- S2-E test users: 0
- reviews: 0

## Production freeze verification
Production ref `cogplqokzxqaedvjxbwu`:
- S2-E migration `20260919060045` not present in migration history.
- production notifications: 0
- production profile/user identity gap for notification recipients: 0
- no Production migration executed.

## Residual
Browser E2E was not invocable through the available tool surface and remains a launch residual, consistent with the Sprint 2 release-gate convention used for S2-A/S2-C.
