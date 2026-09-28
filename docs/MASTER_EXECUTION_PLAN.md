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


## Message 4/11 — Seller Track: Status / Dashboard / Subscriptions / Ads / Commission / Payout

### 30. Seller Status
CLASSIFICATION: OPEN WITH CLOSED FOUNDATION

OBSERVED FACT:
- Seller lifecycle is server-side and seller status remains staff/owner governed; no seller self-service status mutation is being introduced.
- Current Restore-Test seller enum is pending / approved / rejected / suspended. Current count: 1 approved seller.
- Product edit-after-approval still has no explicit business rule that identifies which edits require re-review. This remains OPEN POLICY. Do not auto-reset product status without an approved policy.
- Abandoned pending-order handling remains OPEN POLICY + IMPLEMENTATION GAP. Current checkout/order creation decrements inventory immediately; no reservation/TTL table or dedicated expiry job was evidenced. Existing payment-failure inventory release remains the proven recovery path. Do not invent TTL semantics.
- The legacy public function velora_update_order_item_status(p_order_item_id,p_new_status,p_note) still exists and its current definition references v_item.status and updates public.order_items.status::order_item_status.
- Current public.order_items has NO status column. Current enum inspection also did not show order_item_status. The function therefore remains a broken legacy contract unless/until the business contract is explicitly decided.
- A direct SQL execution probe of that function from the unauthenticated DB tool stopped at its AUTH_REQUIRED guard, so the missing-column failure was not executed in that probe. Source + schema inspection independently establishes the contract mismatch. Do not add order_items.status casually.

INFERRED:
- The order-item status function is legacy/dead or drifted relative to the canonical current order/status model, but this is not yet a business-policy conclusion.
- Pending-order abandonment cannot be safely closed by choosing an arbitrary timeout; the correct behavior depends on inventory reservation and payment policy.

REQUIRED NEXT EVIDENCE:
- business decision for post-approval product re-review
- business/operations decision for abandoned pending orders and reservation semantics
- decision whether order item status is a supported contract, deprecated compatibility function, or replaced by shipment/order-level status

### 31. Seller Dashboard Re-entry Bug
CLASSIFICATION: OPEN / NOT EVIDENCED

OBSERVED FACT:
- The historical user journey remains: Seller Dashboard -> leave -> re-entry fails -> refresh makes it work.
- Current source inspection does NOT reproduce the previous hypothesis that the router captures the legacy seller opener.
- Current src/scripts/12-localization.js explicitly assigns window.openSellerPlatform=openCanonicalSeller.
- Current src/scripts/63-platform-router.js captures window.openSellerPlatform after that canonical assignment in the known script order, so its originalOpenSeller currently resolves to the canonical seller opener.
- 63-platform-router.js still owns hash route activation, returnHash, close/reopen sequencing, hashchange/popstate sync, and an initial auth wait loop. These are investigation targets, not proven root causes.
- Browser reproduction is still unavailable. Do not classify source inspection, Preview readiness, or SQL as Browser PASS.
- Do not blame browser cache, rewrite routing blindly, add MutationObserver, or add arbitrary listeners.

HISTORICAL HYPOTHESIS STATUS:
- Previous hypothesis "63-platform-router captures legacy seller opener" is SUPERSEDED/INVALIDATED by current source inspection.
- The user-visible bug itself remains OPEN until Browser evidence identifies the exact failure path.

ACTION FLOW:
Detect route/re-entry failure -> verify current hash/auth/session state -> execute canonical seller activation -> verify visible seller shell/auth -> recover by controlled route re-sync or escalate only when session/auth is genuinely missing.
No new routing engine.

### 32. Seller Subscriptions
CLASSIFICATION: PARTIALLY CLOSED FOUNDATION / OPEN RUNTIME + COMMERCIAL POLICY

OBSERVED FACT:
- Current Restore-Test counts: seller_subscriptions=0; seller_subscription_renewal_jobs=0; subscription payment attempts=0. Therefore no persistent subscription runtime proof exists.
- Current subscription foundation includes:
  velora_start_subscription_purchase
  velora_resolve_subscription_price
  velora_sync_subscription_state
  velora_run_renewal_batch
  velora_create_subscription_renewal_payment_attempt_internal
  velora_record_renewal_result
  velora_mark_subscription_payment_initialization_failed
  velora_schedule_subscription_expiry_notification_jobs
- Purchase requires authenticated approved seller/store, store-country match, active plan, legal acceptance for seller agreement/subscription/commission, canonical regional price resolution, card payment method, idempotency, and pending state with pending_expires_at.
- Subscription state sync covers pending capture -> active, pending expiry -> cancelled, active expiry -> past_due when uncaptured, past_due capture -> active, and past_due grace expiry -> expired.
- Renewal batching uses queued/in_progress/failed retry work with leases and a capped attempt count; internal payment-attempt creation is service-role controlled.
- Current subscription payment-initialization failure helper fails the payment attempt, can expire a pending subscription, calls canonical state sync, and audits.
- Country/currency binding is enforced against the canonical store country.
- No dedicated cancel / upgrade / downgrade / replacement seller-subscription RPC was found in the current public function inventory.
- Existing notification/action-flow infrastructure already includes seller subscription lifecycle/expiry processing through the canonical notification lifecycle. Current cron evidence has one active job: velora-notification-lifecycle, every minute, executing velora_process_notification_lifecycle(100). Do not add another scheduler for the same lifecycle.
- Current code does not expose subscription-management UI in src/scripts/12-localization.js; the canonical Seller Center currently covers dashboard/products/inventory/orders/settings only.

OPEN:
- cancel semantics
- upgrade/downgrade semantics
- replacement semantics
- proration/deferral/refund policy
- entitlement application and removal
- provider charge/capture evidence
- browser runtime evidence
- failure/recovery evidence beyond source/DB contracts
- notification delivery/browser evidence

RESEARCH:
- Shopify's current subscription documentation shows that subscription changes can involve replacement semantics, with cancellation/replacement and potential proration/deferral behavior. This reinforces the requirement for explicit Velora policy before implementing cancel/upgrade/downgrade/replacement rather than guessing semantics. (Research source captured during Message 4 web review.)
- No new subscription engine should be built; existing canonical state machine remains authoritative.

ACTION FLOW:
Detect renewal/expiry/payment result -> validate subscription/payment binding -> sync state -> create retry job or activate/expire -> schedule/cancel notifications -> audit -> retry/escalate provider ambiguity.
Human input only for explicit commercial policy and provider/governance exceptions.

### 33. Subscription Entitlements
CLASSIFICATION: PARTIAL / OPEN FEATURE POLICY

OBSERVED FACT:
- Current subscription_plans has exactly four active plans: Free, Basic, Pro, Enterprise.
- Numeric contract currently is:
  Free: USD 0 monthly / 0 yearly, commission 12.5%, max_products 25
  Basic: USD 9.99 / 99.99, commission 10%, max_products 250
  Pro: USD 29.99 / 299.99, commission 7.5%, max_products 2500
  Enterprise: USD 99.99 / 999.99, commission 5%, max_products NULL (unlimited in current numeric contract).
- Current plans all have features = {}. Therefore no named feature-entitlement matrix is currently contractually populated in Restore-Test.
- regional_pricing exists and currently has active EG rows:
  Free 0/0 EGP
  Basic 199/1990 EGP
  Pro 499/4990 EGP
  Enterprise 1499/14990 EGP
  with additional regional rows for AE/BH/JO/KW/MA/OM/QA/SA and inactive ZZ fallback data.
- Do not copy the stale legacy SELLER_PLANS values from 00-localization.js into the canonical business model. That legacy object currently contains materially different prices, commissions, product limits, and ad-feature claims.

OPEN:
- business-approved feature entitlements
- whether ads/analytics/support/placement/etc. are true plan entitlements
- effective-date/versioning policy for entitlements
- UI presentation of plans using canonical DB values
- whether and how a plan change affects existing products, ads, commission rate, and seller access

RESEARCH-FIRST DECISION:
- No feature build is justified while the canonical features object is empty and business entitlements are unspecified.
- Keep numeric and regional pricing contracts as current observed DB state; do not invent a new plan matrix.

### 34. Seller Advertising
CLASSIFICATION: FOUNDATION CLOSED / PAYMENT SETTLEMENT + ANALYTICS OPEN

OBSERVED FACT:
- Current active ad packages:
  product_boost_3d = 99 EGP / 3 days / shop_sponsored
  featured_product_7d = 199 EGP / 7 days / shop_sponsored
  home_spotlight_7d = 499 EGP / 7 days / home_spotlight
- These prices remain PROVISIONAL and NOT MARKET VALIDATED.
- velora_start_seller_ad_purchase is the canonical purchase path. It requires approved seller/store, Egypt country alignment, legal acceptance, active EGP package, approved seller-owned product, idempotency, and creates a pending_payment campaign plus canonical seller-ad payment attempt.
- velora_sync_seller_ad_campaign handles pending_payment capture/failure/refund, activation, product approval guard, duration expiry -> completed, auditing, and seller notifications.
- velora_process_seller_ad_lifecycle expires active campaigns and delegates to the canonical sync function.
- Existing notification lifecycle infrastructure is sufficient to run this automatically; no second scheduler or ad engine is justified.
- Current seller_ad_campaigns=0 and seller-ad payment attempts=0, so no persistent runtime/capture evidence exists.
- Current architecture is fixed-price, fixed-duration packages; CPC auction / advanced targeting is NOT currently part of the proven Velora contract.

RESEARCH:
- Amazon Ads current official material confirms Sponsored Products are CPC/auction-based and reports metrics such as impressions, clicks, average CPC, cost, attributed sales and ROAS. This is useful prior art for future analytics vocabulary but does NOT establish Velora policy or justify introducing a CPC auction model now.
- Decision: preserve Velora's existing package model; do not build CPC/auction/advanced targeting merely because another marketplace uses it.

OPEN:
- live provider capture/settlement
- refund/accounting treatment
- reporting/analytics persistence and definitions
- attributed-order methodology
- seller-facing ad management UI
- market validation of package pricing

ACTION FLOW:
Detect package purchase/expiry/payment outcome -> validate package/product/store/legal -> create/attach payment attempt -> provider result -> activate/fail/refund/complete -> notify/audit -> retry/escalate provider ambiguity.

### 35. Commission
CLASSIFICATION: ENGINE CLOSED / COMMERCIAL POLICY OPEN

OBSERVED FACT:
- commissions currently contain 13 pending, 1 finalized, and 1 reversed row in Restore-Test.
- Canonical velora_get_commission_rate resolves an active non-Free paid subscription's commission rate first, otherwise seller-plan rate, otherwise the 12.5 fallback.
- Current subscription plan commission rates are 12.5 / 10 / 7.5 / 5 by Free / Basic / Pro / Enterprise.
- The 12.5 value remains an observed current fallback/default, not a user-approved final commercial policy.
- Historical legacy seller-plan UI in 00-localization.js advertises different commission values and must not be treated as canonical.

OPEN:
- final commercial commission policy
- exact fee basis (gross, discounted amount, shipping, taxes, seller-funded promotions, platform-funded promotions)
- effect of plan changes on already-created orders/commissions
- refund/chargeback treatment beyond the current reversal engine
- seller-facing presentation

No new commission engine is justified.

### 36. Payouts
CLASSIFICATION: CALCULATION / REQUEST / RECORDING CLOSED; PROVIDER SETTLEMENT OPEN

OBSERVED FACT:
- Current payout count is 0.
- Canonical velora_request_seller_payout:
  requires authenticated approved seller/store,
  prevents duplicate pending/processing payouts,
  calculates only finalized commissions for paid+delivered orders with shipment delivered at least 7 days ago,
  excludes order items already included in seller_payout_items,
  creates a pending payout plus itemized payout rows,
  and audits the request.
- Canonical velora_record_payout_execution is staff-governed; it moves pending/processing -> paid, requires method/reference, is idempotent for an already-paid matching reference, writes a conflict-safe payout ledger entry, and audits.
- Current cron inventory did not show a dedicated payout processor. This is consistent with the current contract where execution is explicit staff/provider-side action rather than an autonomous external settlement engine.
- Actual provider transfer/settlement is NOT evidenced.
- Do not equate payout eligibility, payout request, or recorded execution with money actually transferred.

ACTION FLOW:
Detect payout eligibility -> calculate/validate -> seller requests -> create pending payout -> staff/provider execution -> record execution -> ledger/audit -> reconcile or escalate provider ambiguity.
Human involvement remains necessary at the external settlement boundary unless a real provider contract is later established.

### Cross-cutting Message 4 conclusion
CLOSED-DONE / FOUNDATION:
- Seller status authority remains server-side.
- Current canonical seller route source is aligned to canonical opener; previous router-captures-legacy hypothesis is invalidated by current source.
- Subscription state/renewal/action-flow foundation exists.
- Numeric plan entitlement fields and regional pricing are verified.
- Seller ad package/purchase/state/action-flow foundation exists.
- Commission calculation engine exists.
- Payout eligibility/request/execution-recording foundation exists.

OPEN / NOT EVIDENCED:
- Seller dashboard Browser reproduction.
- Post-approval product re-review policy.
- Pending-order reservation/abandonment policy and implementation.
- Order-item status contract decision; current legacy function is incompatible with current order_items schema.
- Subscription cancel/upgrade/downgrade/replacement policy + implementation.
- Subscription feature entitlements; current features objects are empty.
- Subscription/ad provider capture and settlement.
- Seller ad reporting/attribution analytics.
- Payout provider settlement.
- Current runtime/browser proof for subscriptions, ads, and payouts.
- Stale legacy Seller Plans dependency in 00-localization.js remains an OPEN legacy-surface audit item; do not copy or silently treat it as canonical.

### Message 4 Action Flow Carry-Forward
The Action Flow continues in parallel with all later handoff messages:
Detect -> Decide -> Execute -> Verify -> Recover/Escalate.
For seller systems, automatic normal-path actions should be driven by existing canonical RPCs/jobs/triggers; human intervention remains restricted to seller approval, commercial-policy decisions, legal/provider ambiguity, refunds/exceptions, payout execution, suspension, and release control.
