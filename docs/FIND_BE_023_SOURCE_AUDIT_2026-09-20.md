# Velora — FIND-BE-023 Source Audit
## 400 / 401 / Listener Error Investigation — 2026-09-20

**Branch:** `sprint-2-s2d-admin`  
**Environment:** Restore-Test + source inspection  
**Production:** FROZEN

## Objective

Investigate the reported Browser Console/Network 400/401/listener errors without relying on an interactive browser session.

## Source Findings

### 1. Checkout RPC is session-gated

`src/scripts/57-s2-checkout-e2e.js` calls `velora_create_order` only after `client.auth.getSession()` resolves to a user session.

This is intentionally not changed.

### 2. Notifications are user-gated

`src/scripts/55-s2e-notifications.js` checks `getUser()` before loading the notification feed/read-state RPCs.

This is intentionally not changed.

### 3. Language preference/catalog paths are available to public roles in Restore-Test

The following public functions were inspected in Restore-Test:

- `velora_get_i18n_catalog`
- `velora_get_language_preference`
- `velora_set_language_preference`
- `velora_get_marketplace_catalog`
- `velora_get_relevant_checkout_currencies`

All five have EXECUTE privilege for both `anon` and `authenticated` in Restore-Test.

The first four relevant functions are SECURITY DEFINER except `velora_get_relevant_checkout_currencies`, which is INVOKER.

Therefore, a generic “missing EXECUTE grant” explanation for the reported 401 cannot be established from the current source/database state.

### 4. Localization boot contains public calls by design

`src/scripts/51-localization.js` loads the i18n catalog during locale boot.

`src/scripts/00-localization.js` also contains the legacy/fallback language preference and translation-override paths.

The current V5 runtime is authoritative when available, while the V4 fallback remains dormant unless V5 fails.

A blind removal of these calls could break language initialization or fallback behavior.

## Decision

**FIND-BE-023 remains OPEN.**

No speculative suppression, retry loop, or listener removal was applied.

The exact 400/401 request must still be correlated in an authenticated Browser Network trace before changing behavior.

## Browser Gate Needed

Capture one failing request with:

- full request URL/path
- HTTP status
- method
- request payload/query parameters
- response body
- initiator script
- timestamp relative to login/navigation

Also capture whether the error repeats on:
- initial boot
- login
- language change
- checkout
- notification open

## Listener Check

The source contains explicit `auth.onAuthStateChange` listeners in commerce/auth and notifications paths.

Because the reported error includes the word “listener”, browser-level correlation is required before deleting or consolidating any listener. Multiple listeners can be legitimate when they own separate UI state.

## Conclusion

The source audit reduces the search space but does not prove the runtime 400/401 root cause.

**Status: OPEN / Browser evidence required.**
