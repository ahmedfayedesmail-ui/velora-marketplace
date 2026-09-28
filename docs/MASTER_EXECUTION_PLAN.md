# VELORA — MASTER EXECUTION PLAN / ONE SOURCE OF TRUTH

Status: ACTIVE
Execution model: continuous platform audit + hardening + automation + governance + readiness
Environment policy: Restore-Test only for current work; Production is frozen.

## 0. Non-negotiable operating rules

### Rule 1 — Complete master execution
This file is the single continuous execution track. Nothing is silently dropped when work moves between tracks, phases, waves, or messages. Open, blocked, pending, not-evidenced, security, RBAC, owner-governance, payments/provider, legal, backup/rollback, browser/provider evidence, and cross-system items remain tracked until explicitly closed.

### Rule 2 — Research first / reuse first / build only when needed
Sequence:
Existing Contract -> Research -> Observed Gap -> Actual Need -> Smallest Safe Change

Do not create duplicate systems, engines, RPCs, business logic, or speculative schema. Do not build merely for the sake of building. Prefer proven prior art and patterns that fit Velora. Existing canonical paths remain authoritative.

### Rule 3 — Action Flow runs in parallel
Every material workflow is evaluated as:
EVENT -> GUARD/AUTHORIZATION -> VALIDATION -> STATE TRANSITION -> AUTOMATIC SIDE EFFECT -> NEXT EVENT -> AUDIT -> RETRY/IDEMPOTENCY/DEDUPE -> HUMAN EXCEPTION

Normal paths should be end-to-end automatic. Owner/Staff intervention is reserved for seller approval, legal publication, fraud decisions, exceptional refunds, suspension, irreversible governance, provider ambiguity, and release control.

## 1. Project identity

Product: Velora Marketplace
Vision: Beauty-first Marketplace / Personal Beauty Operating System

## 2. Business model / positioning

- Multi-vendor marketplace
- Beauty-first
- Commission model
- Seller subscriptions
- Seller advertising
- COD support
- Arabic-first
- Beauty Passport
- Routine discovery
- Deterministic personalization
- Product intelligence
- Routine -> Cart

## 3. Complete platform model

Customer:
Account -> Beauty Passport -> Current Context -> Routine -> Recommendations -> Product -> Cart -> Checkout -> Payment -> Order -> Fulfillment -> Outcome -> Feedback -> Replenishment -> Future personalization

Seller:
Onboarding -> Store -> Product creation -> Moderation -> Lifecycle -> Inventory -> Orders -> Shipping -> Subscription -> Advertising -> Earnings -> Commission -> Payout

Owner/Governance:
Users -> Sellers -> Product moderation -> Orders -> Payments -> Refund exceptions -> Subscriptions -> Advertising -> Commissions -> Payout governance -> Promotions -> Gift Cards -> Legal -> Fraud/Trust -> Suspension -> Audit -> Reconciliation -> Launch control

## 4. Technical baseline

Repository: ahmedfayedesmail-ui/velora-marketplace
Current audited continuation branch: audit/runtime-parity-2026-09-28
Current observed branch HEAD at plan creation: a3e78a7010dbad8b6b5e16ed4b9784ecd637bb77
Current HEAD commit message: docs: restore variant stock reconciliation source provenance

Historical branch supplied in an earlier handoff:
audit/full-gate-2026-09-25
Its current observed HEAD is 6391ee605fdf8936f0e3d26f89319f80bc9ce582.
Do not roll back to historical SHAs merely because they appear in older handoff text.

## 5. Supabase

Production:
name: maha-beauty
ref: cogplqokzxqaedvjxbwu
region: eu-central-1
status at baseline verification: ACTIVE_HEALTHY
Policy: FROZEN — DO NOT MODIFY during audit/hardening.

Restore-Test:
name: velora-restore-test
ref: arlaxqmhtvjwjbjinjfw
region: eu-central-1
status at baseline verification: ACTIVE_HEALTHY
Use this environment for current testing and controlled schema/function changes.

## 6. Vercel

Project ID: prj_cDGSF8k6DPAOwZduQl1UG9ZZOKVY
Team ID: team_OVPYuZ9zuxZDGlCxgNq0FQ2i
Root Directory: src

Known earlier READY deployment references from historical evidence must remain historical unless re-verified. Current branch-to-current-preview parity is not assumed without deployment and browser evidence.

## 7. CI / audit evidence

Historical CI successes do not automatically prove current Preview, Browser, Provider, or Production state.

Required distinctions:
- source/CI success
- Preview availability
- Browser behavior
- provider settlement/webhook evidence
- production infrastructure
- backup/rollback proof

Never collapse them into one PASS.

## 8. Evidence hierarchy

L1 Source
L2 DB
L3 Contract / ACL / RLS
L4 Negative Path
L5 CI
L6 Preview
L7 Browser
L8 Provider
L9 Production

Never promote lower-level evidence into a higher-level PASS.

## 9. Status language

CLOSED-DONE
OPEN
BLOCKED
PENDING
NOT EVIDENCED
INFERRED
HYPOTHESIS

Every conclusion should use one of these classifications where applicable.

## 10. Safety / authority guardrails

- Production remains frozen.
- Existing canonical business logic is the source of truth.
- No duplicate engine when a canonical engine exists.
- No speculative schema mutation.
- No fake feature claims.
- No claim of Browser PASS without Browser evidence.
- No claim of live provider settlement PASS without provider evidence.
- No SQL happy-path simulation presented as Browser/Production proof.
- Owner/Staff-only governance stays explicit.
- Human exceptions are deliberate, auditable, and minimal.

## 11. Continuous execution requirement

All future Master Handoff messages extend this same file/track. They must be reconciled into the same execution model; no parallel “Part B” becomes the operative source of truth.

For each new work package:
1. Preserve all prior open/blocked/pending/not-evidenced items.
2. Inspect the actual current source and DB state.
3. Research before deciding to build.
4. Reuse canonical paths where possible.
5. Implement the smallest justified change.
6. Verify source + DB/ACL/negative paths.
7. Deploy Preview when code changed.
8. Run Browser Gate where behavior changed.
9. Record evidence and classification.
10. Carry unresolved items forward explicitly.

## 12. Message execution rule

Messages 1/11 through 11/11 are treated as execution work packages, not passive notes. A message is not considered complete merely because its requirements have been written down; it is complete only when the applicable implementation and evidence gates are satisfied or the item is explicitly classified as OPEN/BLOCKED/PENDING/NOT EVIDENCED with the reason and next required evidence.



# Execution Ledger — Message 2/11 and Message 3/11

## Message 2/11 — Core Marketplace

CLOSED-DONE:
- Canonical server cart and canonical Routine -> Cart adapter retained; no cart rewrite and no duplicate cart engine.
- Canonical checkout retained in src/scripts/13-payments.js with compatibility delegation only in 57-s2-checkout-e2e.js.
- Checkout idempotency uses the existing stable checkout reference and in-flight submit guard.
- Shipping uses the current store_shipping_zones/store_shipping_rates contract and velora_manual.
- Current Restore-Test shipping fixture: Egypt — E2E Test Zone / EG / 30 EGP / 2–5 days.
- Variant inventory contract exists: selected variant and parent aggregate stock are reconciled.
- Payment failure trigger releases inventory, reverses pending commissions, fails payment, cancels the order, and audits the event.
- A rolled-back DB negative-path test on Order 68 verified pending/pending + stock 13 -> cancelled/failed + stock 14, then rollback restored the original state.
- The historical order_items.status bug is not present in the current order_items contract; no status column was added.

OPEN / NOT EVIDENCED:
- Legacy local checkout shipping display formula remains untouched until a current user-visible regression is reproduced.
- Active variant Browser runtime is not evidenced because Restore-Test currently has zero active variants.
- Browser / Provider / Production evidence remains separate gates.

## Message 3/11 — Product Lifecycle + Seller Products + Cross-System

CLOSED-DONE:
- Product lifecycle enum verified as pending / approved / rejected / inactive.
- Current code now uses canonical seller product RPCs for create/update/stock:
  velora_seller_create_product_full
  velora_seller_update_product_full
  velora_seller_update_product
- Seller availability UI now uses velora_seller_set_product_availability with approved <-> inactive actions.
- Seller hard-delete UI was removed from the canonical Seller Products screen.
- Restore-Test seller hard-delete contract was closed by migration 20260928132247_enforce_seller_product_lifecycle_no_delete.sql: DELETE policy dropped and DELETE privilege revoked for authenticated/anon.
- Canonical seller RPC ACL verified: anon=false, authenticated=true, service_role=true.
- Direct authenticated table DML on products is not permitted; current code path no longer uses direct product insert/update/delete for Seller Product operations.
- Existing product status notification architecture is retained.
- Product lifecycle authority remains staff-governed for status transitions.
- Ads visibility function enforces campaign timing, approved product/seller/store, active package, and current positive inventory.
- Temporary transaction test proved an active ad is visible with stock available and becomes invisible when the product is changed to OOS; transaction rolled back and no campaign data persisted.
- Existing order-item product snapshots and purchase-linked beauty feedback remain separate historical context; no lifecycle delete cascade was introduced.

PRODUCT IMAGES — RESEARCH COMPLETED:
- Supabase current documentation confirms Storage uploads require Storage RLS policies and recommends treating storage schema metadata as read-only and using the Storage API for file operations. citeturn238850search1turn238850search13
- Medusa's current architecture similarly separates file upload/storage from product image URL persistence; product records store image URLs after the file upload layer provides them. citeturn238850search2turn238850search4
- Shopify's current documentation describes CDN-hosted MediaImage objects for product media. citeturn238850search14
- Velora currently has zero Storage buckets and zero product_images rows, while the canonical full seller-product RPC already accepts an HTTPS image URL into products.images.
- Decision: do not invent a new image service, Base64 scheme, or parallel media engine. Keep the existing HTTPS URL contract as the smallest current path. A real upload/storage implementation remains a later justified change only when an actual storage/upload requirement and ACL contract are established.

BROWSER GATE:
- A current Preview deployment exists for the exact post-change source commit, state READY.
- Browser verification was attempted against that Preview but the available browser automation provider was unavailable because its wallet balance was insufficient. Therefore no Browser PASS is claimed.

CLASSIFICATION:
- OBSERVED FACT: source/DB changes above exist and were verified.
- INFERRED: the Seller Products UI is now aligned with the intended lifecycle architecture.
- NOT EVIDENCED: end-to-end Browser behavior for the current commit.
- NOT EVIDENCED: provider settlement or Production behavior.
