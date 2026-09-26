# Velora — Authenticated Browser Gate Evidence — 2026-09-26

Environment: Restore-Test + isolated Vercel Preview. Production: FROZEN.

## Browser Run

- Workflow: `Velora Authenticated Browser Evidence`
- Run: `36266943249`
- Attempt: `2`
- Conclusion: **SUCCESS**
- Evidence branch: `evidence/auth-cart-checkout-2026-09-26`
- Test commit: `bec5528e9840b04128ed3f01c657daec65a1cf12`
- Artifact: `10913674576`

## Observed Facts

The authenticated Chromium run proved:

- HTTP 200
- Supabase password-login token response 200
- Authenticated Supabase session present
- Authenticated user id present
- `STATE.user` present
- Arabic locale entrypoint succeeded
- `html.lang=ar`
- `html.dir=rtl`
- Canonical cloud cart sync returned true
- Test product present in cart
- Checkout rendered the test product
- Checkout rendered Arabic shipping, payment, order-summary and place-order labels
- Checkout did not render an empty-cart state
- Authenticated session survived checkout navigation
- No page errors
- No unexpected console errors
- No HTTP 403/406 residuals in the run

## Root Cause Closure

The previous run recorded two 403 responses for:

- `velora_get_unread_notification_count`
- `velora_get_notifications`

Restore-Test inspection showed:

- `public.notifications` direct SELECT for `authenticated` = false
- both read RPCs had `SECURITY DEFINER=false`

A minimal Restore-Test-only migration changed both read RPCs to `SECURITY DEFINER`, retained `auth.uid()` ownership filtering, and preserved direct table SELECT denial.

Migration commit on the evidence branch:

`7f05ee438192bb337db4e8de578c414f6219754f`

Post-change DB verification:

- `velora_get_notifications(integer,integer)`: SECURITY DEFINER = true
- `velora_get_unread_notification_count()`: SECURITY DEFINER = true
- authenticated EXECUTE = true
- authenticated direct table SELECT = false

## Gate Classification

**OBSERVED FACT:** Authenticated Login -> Cart -> Checkout + Arabic render gate is PASS on the isolated Preview.

**INFERRED:** The former notification 403s were caused by the mismatch between the RPC security context and the intentionally revoked direct `notifications` table access.

**NOT PROVEN:** This is not a full live payment settlement proof, not a Production browser proof, and not a complete end-to-end order-placement proof. Production remains frozen.

## 2026-09-26 Evidence Provenance Hardening

The earlier successful Browser artifact is retained as historical evidence, but it is not used as the canonical Launch Gate input because its workflow commit and fixed Preview deployment were not independently identical.

A new manual workflow was added:
- .github/workflows/velora-authenticated-browser-gate.yml
- It runs only on workflow_dispatch.
- It pins the exact known-good Preview deployment:
  https://velora-marketplace-atzotfrna-ahmedconccc-7063.vercel.app/
- That Preview is the Vercel deployment created from tested Preview SHA:
  0d0eed6a56c3fe2775bc8c32a81a7df1c37a022f
- The artifact records both tested_preview_sha and the workflow SHA separately.
- The artifact is ingested only through the service-role-only browser evidence RPC.
- No Browser PASS is recorded until the workflow actually runs successfully.

This removes the earlier provenance ambiguity between "workflow source revision" and "Preview code revision."
