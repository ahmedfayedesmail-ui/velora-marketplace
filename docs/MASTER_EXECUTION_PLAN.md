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
Current observed branch HEAD: d6a57dd5004c60f2ede656cc75fef1f5df645e47
Current HEAD commit message: fix: harden Beauty Passport V2 value contract

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

## Message 5/11 — Promotions / Gift Cards / Returns / Notifications

### 37. Promotions / Coupons
CLASSIFICATION: CANONICAL ENGINE CLOSED / POLICY + CONTROL-SURFACE GAPS OPEN

OBSERVED FACT:
- Restore-Test currently has 1 coupon (WELCOME20), 0 coupon_redemptions, 0 promotions, and 0 promotion_redemptions.
- WELCOME20 is currently percentage 20%, EGP, minimum order 200 EGP, maximum discount 500 EGP, global usage limit 1000, customer usage limit 1, first_order_only=true, platform-funded, active, no expiry.
- Canonical coupon validation enforces authentication, active window, currency, minimum subtotal, global/customer usage limits, first-order-only, and percentage/fixed calculation with maximum discount cap.
- Canonical coupon application is customer-owned-order locked, idempotent per coupon/order, records redemption, increments used_count, recalculates order total, and audits.
- Canonical automatic promotion selection enforces active window, currency, global scope, minimum order and usage limits, then chooses by priority/creation order. It does not stack multiple promotions.
- Canonical promotion creation and activation are Staff/Owner governed through RPCs and auditable. Creation supports percentage/fixed only and hard-sets stackable=false.
- The DB coupons constraint still permits discount_type='free_shipping', while canonical coupon validate/apply reject unsupported types. This is a real contract mismatch and remains OPEN pending business decision; do not silently implement free-shipping semantics or remove the allowed type without policy.
- Coupon/promotion creation from the current canonical Admin Center was not previously exposed. The smallest justified UI change was to surface the existing control planes rather than build a new engine.
- Current canonical checkout integrates exactly one coupon OR the automatic best promotion, followed by an optional gift card as tender.
- Negative-path DB probes verified WELCOME20 below minimum -> COUPON_MINIMUM_ORDER_NOT_MET, wrong currency -> COUPON_CURRENCY_MISMATCH, no active automatic promotion -> no promotion applied, and unauthorised promotion creation -> STAFF_ONLY.
- No seller-owned coupon/promotion creation contract is currently evidenced. Current promotion scope is global.

OPEN:
- free_shipping contract decision
- whether stacking/combination policy should ever change from current non-stackable MVP
- exact promotion targeting policy beyond current global scope
- seller-funded vs platform-funded coupon economics
- reversal/refund treatment of coupon/promotion redemptions
- abuse/rate-limit strategy beyond current usage/customer limits
- coupon writer/management semantics if business requires changing the existing single WELCOME20 record

### 38. Gift Cards
CLASSIFICATION: SERVER FOUNDATION CLOSED / REFUND ACCOUNTING + RUNTIME EVIDENCE OPEN

OBSERVED FACT:
- Current Restore-Test gift_cards=0 and gift_card_transactions=0 after rollback.
- velora_issue_gift_card is explicitly OWNER_ONLY, requires positive amount, active currency, future expiry if supplied, unique code, creates active card and issue transaction, and writes an audit record.
- Gift-card constraints enforce initial_amount > 0, balance between 0 and initial, allowed statuses active/exhausted/expired/disabled, unique code, and restricted deletion.
- velora_quote_gift_card supports partial balance application.
- velora_apply_gift_card_to_order locks the customer order and gift card, protects against duplicate redemption, validates active/expiry/currency, applies up to remaining order total, can make the order paid when fully covered, writes a redeem transaction with idempotency key, updates card balance/status, creates a gift-card payment record, and audits.
- No separate function was evidenced that automatically credits/reverses a gift card when an order is cancelled/refunded. Refund/cancellation-to-gift-card interaction is therefore OPEN.
- No dedicated gift-card expiry scheduler was evidenced; expired cards are detected during use and marked expired on that path.
- There is no independent gift-card ledger engine; current architecture uses gift_card_transactions plus the canonical payments row for an order fully/partially covered by gift card.
- The smallest justified UI hardening was to expose the existing gift-card control plane in the canonical Admin Center and enforce an explicit Owner-role gate before rendering it. The underlying Owner-only RPC remains authoritative.

OPEN:
- gift-card refund/cancellation credit policy
- accounting/reconciliation policy
- expiry lifecycle policy beyond on-use expiry detection
- issuance amount business limits beyond >0
- fraud/abuse controls beyond unique codes, ownership and transaction idempotency
- Browser/runtime evidence

### 39. Customer Returns
CLASSIFICATION: BACKEND FOUNDATION CLOSED / CUSTOMER UX + REFUND ACCOUNTING POLICY OPEN

OBSERVED FACT:
- Current returns=0 and return_items=0.
- velora_request_return is already split-aware by store and item: customer ownership, delivered order, settled payment, valid store membership, per-item delivery proof, quantity validation, duplicate-return protection, per-line refund calculation, and audit.
- Current returns status contract is requested / approved / rejected / in_transit / received / refunded / cancelled.
- return_items protects order-item ownership via foreign keys and unique(return_id,order_item_id).
- Current velora_resolve_return has two overloaded signatures with incompatible contracts:
  1. legacy (uuid,text,text) allows requested/approved/rejected/received/refunded/closed without transition validation.
  2. transition-aware (uuid,text,text,text,text,text) allows requested/approved/rejected/in_transit/received/refunded/cancelled, validates transitions, and requires refund evidence when moving to refunded.
- Canonical Trust & Compliance UI in src/scripts/70-s1-d-trust-operations.js uses the transition-aware 6-argument resolver.
- No automatic provider refund call was evidenced; the resolver records external refund evidence/reference.
- Current partial-return refund calculation is unit_price * returned quantity and does not show explicit allocation of order-level coupon/promotion discount. This is an OPEN business/accounting policy gap.
- No return-window enforcement is currently evidenced in the request function.
- No new customer return UI was built in Message 5; the correct next step remains research + policy before any UX/contract expansion.

RESEARCH-FIRST:
- Prior-art review indicates modern commerce systems treat return eligibility, return state, and refund processing as related but distinct workflows. This supports retaining Velora's existing split-aware contract and avoiding a second return engine.

OPEN:
- return window
- discount allocation on partial returns
- shipping/tax refund policy
- restocking policy
- seller/customer vs staff resolution authority
- actual refund provider integration
- legacy 3-argument resolver retirement/compatibility decision
- customer-facing return UX

### 40. Notifications / Push
CLASSIFICATION: ARCHITECTURE CLOSED / BROWSER DELIVERY EVIDENCE OPEN

OBSERVED FACT:
- Current Restore-Test has 38 notifications, 6 push-delivery records with delivered_at timestamps, and 3 push subscriptions (1 active, 2 inactive).
- All notification/push/lifecycle tables have RLS enabled.
- src/scripts/55-s2e-notifications.js is the authoritative public notification UI; it reads through canonical RPCs and does not treat localStorage as notification truth.
- src/scripts/68-s1-d-mobile-push.js requires authenticated user/browser permission, registers /sw.js, subscribes through the existing VAPID key, persists via velora_register_push_subscription, and unregisters through the matching RPC.
- trg_velora_notification_push_dispatch invokes the existing private push dispatcher on notification insert. The dispatcher calls the existing velora-dispatch-notification Edge Function using the internal secret.
- Notification lifecycle processing is handled by the existing canonical lifecycle function and one active cron job: velora-notification-lifecycle / * * * * * / velora_process_notification_lifecycle(100).
- No second notification engine, scheduler framework, or ad-hoc cron was added.
- Endpoint ownership is protected by the hardened push-subscription contract.
- Browser push end-to-end PASS is still NOT EVIDENCED.

OPEN:
- Browser proof of notification bell/read state
- Browser proof of push enable/disable and actual device delivery
- provider/service-worker delivery edge cases
- stale subscription cleanup is implemented in the dispatcher but full browser evidence is pending

### Message 5 implementation actually made
OBSERVED FACT:
- src/scripts/12-localization.js now exposes the existing commercial control planes in the canonical Admin Center: Promotions, Coupons, Gift Cards.
- Gift Cards are explicitly Owner-gated before the existing issue/list UI is rendered.
- These controls reuse existing RPCs and existing legacy rendering functions; no second promotion, coupon or gift-card engine was created.
- Commit: 81096861caf5d09de87f1ed751d0668ff0432ee2.
- Vercel created a READY Preview deployment for exactly this commit: deployment dpl_C1PCNHCU2pdtijx5mTMmxiznJFZT, URL https://velora-marketplace-8rgtwyi3m-ahmedconccc-7063.vercel.app.
- Preview HTTP fetch returned 200 OK and served the updated deployment.
- Browser Gate was attempted against this exact deployment but could not start because the TinyFish wallet balance was -$0.07. Therefore Browser PASS is NOT claimed and the attempt is not retryable until the wallet is funded.

INFERRED:
- The canonical Admin commercial control surface is now aligned with the existing backend authority for the surfaces exposed in Message 5.
- The backend remains the source of truth for Owner/Staff authorization.

HYPOTHESIS / OPEN:
- The legacy overloaded 3-argument return resolver may be dead compatibility code, but no deletion/contract change is justified until usage and business policy are established.
- Partial-return refund allocation may require a future policy/contract change once real commercial discount behavior is confirmed.

### Message 5 Action Flow
The Action Flow remains parallel:
- Promotions: detect checkout/promotion request -> validate eligibility -> apply once -> record redemption -> audit -> later reversal/reconciliation if policy permits.
- Gift Cards: detect issuance/redeem -> Owner/customer authorization -> validate balance/expiry/currency -> lock/apply -> record transaction/payment -> audit -> exception/reconciliation.
- Returns: detect request -> validate order/store/item delivery -> create split return -> staff transition -> external refund evidence -> record refund -> audit -> reconcile/escalate.
- Notifications: detect event -> create notification -> push dispatch -> delivery/disable stale endpoint -> lifecycle job when due -> audit/recover.
No new automation framework or scheduler was introduced.


## Message 6/11 — Beauty Passport / Customer Intelligence

### 41. Beauty Passport — First-Class Track
CLASSIFICATION: CLOSED-DONE FOUNDATION / BROWSER EVIDENCE OPEN

OBSERVED FACT:
- Beauty Passport remains a first-class Customer Intelligence track and was not abandoned.
- The product model is explicitly:
  Passport = Memory / Identity
  Routine / Advisor = Current Decision
  Catalog / Cart / Orders = Commerce
  Feedback = Learning
- The intended loop remains:
  Customer <-> Beauty Profile <-> Products <-> Routine <-> Purchases <-> Outcomes <-> Time
- No parallel Passport, routine, feedback, or recommendation engine was introduced.

RESEARCH-FIRST:
- Current beauty-commerce prior art reviewed before expanding the contract includes Clinique, Sephora, Ulta, and academic skincare-recommendation work.
- The recurring useful dimensions are skin type, goals/concerns, preferences, budget/routine context, and purchase/experience signals.
- The current lightweight V2 three-question design is therefore retained rather than expanding prematurely into vision/AI or a large questionnaire.
- V2 remains intentionally narrower until an observed product need and contract mapping justify additional dimensions.

### 42-46. Current Beauty Passport V2
CLASSIFICATION: CLOSED-DONE AT SOURCE / DB / ACL; BROWSER NOT EVIDENCED

OBSERVED FACT:
- Customer-facing implementation: src/scripts/61-s1-c-quiz-v2.js.
- V2 version token: beauty-quiz.v2.
- Current questions:
  skin_type
  goal
  routine_budget
- Current frontend option tokens:
  skin_type = oily / dry / combination / normal / sensitive / unknown
  goal = brightening / hydration / acne / anti-aging / oil
  routine_budget = under_500 / 500_1000 / 1000_2000 / over_2000 / unknown
- The frontend uses the existing canonical RPC:
  velora_save_beauty_passport_v2(p_skin_type,p_goal,p_routine_budget)- The V2 frontend is bilingual Arabic/English and mobile-oriented.
- On successful save it emits velora:passport-v2-updated and opens the existing canonical Routine UX.
- When editing the Passport, the frontend reads authoritative persisted V2 values first so unchanged answers are not silently overwritten.
- No MutationObserver was added and no separate client-side persistence engine was introduced.
- Source proof is not Browser proof.

CONTRACT HARDENING EXECUTED:
- Restore-Test V2 save RPC was hardened so goal must be one of:
  brightening / hydration / acne / anti-aging / oil
- Existing whitelist validation for skin_type and routine_budget remains enforced.
- beauty_profiles direct authenticated INSERT/UPDATE policies were hardened to require the same exact V2 token sets, preventing Data API writes from bypassing the V2 value contract.
- No new columns or questions were introduced.
- Invalid RPC probe returned SQLSTATE 22023 / INVALID_GOAL.
- Invalid direct Data API-style UPDATE probe was blocked with SQLSTATE 42501 / row-level security policy violation.
- Persisted contract scan found 0 invalid existing profiles.
- Migration file committed:
  supabase/migrations/20260928152000_harden_beauty_passport_v2_value_contract.sql
- Commit: d6a57dd5004c60f2ede656cc75fef1f5df645e47.

DOCUMENTATION TOKEN NOTE:
- The handoff text described the acne goal as acne-blemish-prone, but the actual current frontend token is acne and the existing catalog/routine vocabulary uses acne-compatible matching.
- Do not change the stored token merely to mirror a label. Keep acne as the current canonical machine token and use the user-facing label "Blemish-prone skin care".
- Revisit only if a real contract-wide rename is required and can be migrated safely.

### 47-48. Beauty Profile Data Model / Restore-Test Snapshot
CLASSIFICATION: CLOSED-DONE FOUNDATION / QA DATA NOT PRODUCTION USAGE

OBSERVED FACT:
- beauty_profiles columns currently include:
  user_id / quiz_version / goal / concern / texture_preference / effect_preference /
  avoidance_preferences / shopping_priority / updated_at / skin_type / routine_budget
- V2 save intentionally writes the V2 subset:
  quiz_version / goal / skin_type / routine_budget
- Current Restore-Test snapshot:
  beauty_profiles = 2
  v2_profiles = 2
  v1_profiles = 0
  profiles_with_concern = 0
  beauty_routine_runs = 425
  beauty_routine_steps = 2044
  beauty_recommendation_runs = 0
  beauty_recommendation_items = 0
  beauty_feedback = 2
- Earlier handoff counts of routine_runs=416 and routine_steps=1999 are historical and have been superseded by current QA data.
- Both currently observed profiles are V2; no V1 profile exists in Restore-Test.
- Routine-run volume is QA/test-driven and must not be interpreted as production usage.

### 49. V1 Beauty Passport
CLASSIFICATION: CLOSED-DONE RUNTIME RETIREMENT / FILE RETAINED FOR HISTORY

OBSERVED FACT:
- Legacy source remains at src/scripts/58-s1-b1-beauty-passport.js with beauty-quiz.v1 persistence.
- Current loaded runtime does NOT include the legacy 58 script; src/index.html loads the V2 path and not 58.
- Current branch contains:
  supabase/migrations/20260928141000_retire_v1_beauty_passport_runtime.sql
- That migration revokes authenticated EXECUTE on the legacy velora_save_beauty_profile(...) contract.
- Current V2 beauty_profiles RLS policies require quiz_version='beauty-quiz.v2'.
- The V1 file remains in repository history/source inventory, but it is not a supported runtime path.
- NON-NEGOTIABLE: never resurrect the V1 customer UX as a shortcut.
- If a remaining subsystem depends on a V1-shaped field, reconcile that dependency to V2 rather than reviving V1.

### 50-51. Beauty Recommendation Integration
CLASSIFICATION: BACKEND CONTRACT CLOSED-DONE / BROWSER + CUSTOMER UX NOT EVIDENCED

OBSERVED FACT:
- The current public recommendation RPC is:
  velora_get_beauty_recommendations()
- It now calls:
  private.velora_beauty_recommendation_operation_v2()
- Current V2 operation contract:
  reads beauty-quiz.v2 only
  requires skin_type + goal + routine_budget
  uses beauty-recommendation.v2
  fingerprints the V2 inputs with EG / EGP market context
  caches identical inputs for 24 hours
  rate-limits at 5 calls per 10 minutes per user
  requires approved EGP Beauty products with positive availability
  applies budget filtering
  incorporates the existing beauty feedback signal
  returns up to 5 results
  records runs/items using the existing beauty_recommendation_runs / beauty_recommendation_items tables
- Current backend source migration:
  supabase/migrations/20260928133000_canonical_v2_beauty_recommendation.sql
- This replaces the previous V1 recommendation dependency without reviving V1.

ACL/runtime issue found and fixed:
- Initial V2 public wrapper was callable by authenticated but ran as SECURITY INVOKER while the private V2 intelligence function had direct EXECUTE revoked.
- Authenticated runtime probe therefore failed with permission denied for private.velora_beauty_recommendation_operation_v2().
- Smallest safe fix was to make ONLY the public customer wrapper SECURITY DEFINER with an explicit auth.uid() guard; the private intelligence functions remain non-executable directly.
- Restore-Test ACL now shows:
  public.velora_get_beauty_recommendations = SECURITY DEFINER; anon execute=false; authenticated execute=true
  private.velora_beauty_recommendation_operation_v2 = SECURITY DEFINER; anon execute=false; authenticated execute=false
- Authenticated transactional runtime probe returned:
  contract_version = beauty-recommendation.v2
  status = success
  recommendation count = 5
- The test transaction was rolled back, so persistent recommendation_runs/items remain 0.
- Migration file committed:
  supabase/migrations/20260928151000_fix_beauty_recommendation_v2_public_wrapper_acl.sql
- Commit: 71877779d573b016d23c6729d875844416e61ab2.

CUSTOMER-SURFACE FINDING:
- src/scripts/59-s1-b2-beauty-recommendations.js is only a client RPC/API wrapper; it does not mount a customer recommendation presentation.
- Current source/code search found no other caller of veloraBeautyRecommendations or velora_get_beauty_recommendations in the inspected branch.
- Therefore backend recommendation integration is CLOSED-DONE, but a customer-facing Recommendation UX is NOT EVIDENCED / remains an OPEN product-surface question.
- Do not build a new recommendation UI before confirming the intended existing customer surface and researching prior art.

### 52-55. Routine
CLASSIFICATION: CLOSED-DONE FOUNDATION / BROWSER EVIDENCE OPEN

OBSERVED FACT:
- Canonical current-routine entry is velora_get_current_beauty_routine().
- It requires the V2 Passport state:
  quiz_version='beauty-quiz.v2'
  skin_type
  goal
  routine_budget
- Deterministic routine operation remains the existing private.velora_beauty_routine_operation() behind velora_generate_beauty_routine().
- Current routine fingerprint includes:
  beauty-passport.v2
  beauty-context.v2
  quiz_version
  EG / EGP
  skin_type
  goal
  concern
  routine_budget
  texture_preference
  effect_preference
  avoidance_preferences
  shopping_priority
  approved_feedback_revision
  purchase_revision
  context
- Current ruleset is beauty-rules.v5.
- Regeneration is driven by profile/context/catalog/ruleset changes.
- No second routine engine was introduced.
- Current routine output rows are labeled with contract_version='beauty-routine.v1', but this is the routine response contract name and must NOT be interpreted as the retired V1 Beauty Passport.

ROUTINE QA SNAPSHOT:
- Current Restore-Test routine runs = 425 and steps = 2044.
- Grouped current runs:
  beauty-rules.v5 = 406 complete
  beauty-rules.v2 = 17 complete
  beauty-rules.v4 = 2 complete
- Current product catalog has 5 approved, stocked EGP Beauty products used as QA fixtures.
- This is test evidence only, not production usage evidence.

### 56-58. Beauty Journey / Replenishment / Feedback
CLASSIFICATION: FOUNDATION CLOSED-DONE / BROWSER DELIVERY EVIDENCE OPEN

OBSERVED FACT:
- src/scripts/64-s1-d-beauty-journey.js uses:
  velora_get_current_beauty_routine()
  velora_get_replenishment_signals()
- Beauty Journey presents Passport memory (Skin / Goal / Budget), current routine, season/context, ruleset, routine history, and replenishment signals.
- src/scripts/65-s1-d-beauty-feedback.js uses purchase-linked feedback through velora_submit_beauty_feedback.
- Current purchase feedback is only eligible for delivered/completed customer orders with matching order item/product/variant.
- Existing private.velora_beauty_feedback_signal() returns -1 / 0 / +1 and is reused by canonical routine/recommendation logic.
- Routine input fingerprint incorporates approved feedback revision.
- Replenishment remains the canonical velora_get_replenishment_signals() engine using delivered/completed orders and deterministic product-subcategory intervals.
- No parallel replenishment, AI-feedback, or learning engine was introduced.
- Feedback, journey, and replenishment browser behavior is still NOT EVIDENCED.

### 59. Future Passport Dimensions
CLASSIFICATION: OPEN / RESEARCH-FIRST EVOLUTION POLICY

OBSERVED FACT:
- beauty_profiles already contains optional fields for concern, texture_preference, effect_preference, avoidance_preferences, shopping_priority.
- They are not currently part of the three-question V2 customer write surface.
- No new Passport dimensions were added in Message 6.

OPEN:
- whether concern should become a first-class V2 question
- sensory preference question design
- ingredient/tag avoidance model
- shopping-priority model
- how each new field would affect routine ranking
- how each new field would affect recommendation ranking
- validation, migration, privacy/UX implications
- whether the customer gets value commensurate with additional questionnaire friction

RULE:
Research -> contract mapping -> question design -> validation -> persistence -> routine impact -> recommendation impact.
No speculative field additions.

### Message 6 Action Flow — Runs in Parallel
Passport lifecycle:
Detect customer entering/editing Passport
-> authenticate
-> validate exact V2 tokens
-> save canonical profile
-> emit velora:passport-v2-updated
-> regenerate/refresh deterministic routine when needed
-> expose Recommendation V2 through the canonical public wrapper
-> use approved feedback signal when available
-> derive replenishment signals from completed purchases
-> feed future context/purchase outcomes back into the next deterministic decision
-> audit/retry/recover where the underlying canonical workflow supports it.

Normal operation should be automatic. Human intervention is limited to genuinely necessary policy decisions, exceptional data/privacy concerns, provider ambiguity, moderation/governance, and release control.

### Message 6 Research / Build Gate Summary
OBSERVED FACT:
- No new database columns were required.
- No second routine/recommendation/feedback/replenishment engine was introduced.
- Two minimal contract fixes were justified by actual evidence:
  1. Beauty Recommendation public wrapper SECURITY DEFINER + explicit auth guard because authenticated runtime was blocked by private EXECUTE revocation.
  2. Beauty Passport V2 exact-token enforcement for goal and the direct Data API write policies because the frontend/DB value contract was previously broader than the stated V2 option set.
- Both fixes were applied on Restore-Test only and verified with transaction-safe SQL probes.

NOT EVIDENCED:
- Browser Gate for current Message 6.
- Customer-facing Recommendation presentation/UX.
- Provider/Production behavior for this track.

CARRY-FORWARD:
- All unresolved items from Messages 2/11 through 5/11 remain active and are NOT deleted by completion of Message 6.
- Browser/provider/production evidence remains a separate evidence layer.
- The current TinyFish/browser-provider wallet block remains active until the provider becomes usable.

### Message 6 Master Conditions — Non-Negotiable
1. HANDOFF COMPLETENESS:
   Continue the full Master Handoff with every item, detail, open item, blocked item, not-evidenced item, dependency, permission, evidence level, and previous decision preserved. Nothing may disappear when moving to Message 7/11 or later.
2. RESEARCH BEFORE BUILD:
   Do not build for the sake of building. Research existing products, documentation, implementations, community/industry practice, and prior art at whatever breadth is justified, then reuse the strongest fitting canonical pattern for Velora. Build new only where a real observed gap remains and no suitable existing contract/path covers it. Never create duplicate engines.
3. ACTION FLOW IN PARALLEL:
   For every system, continue:
   Detect -> Decide -> Execute -> Verify -> Recover/Escalate
   Normal platform operation should run automatically end-to-end wherever the canonical architecture supports it. Human intervention is reserved for genuine exceptions: business-policy decisions, seller approval/suspension, legal publication, fraud/trust cases, exceptional refunds, provider ambiguity, payout/provider settlement, and release control.


## Message 7/11 — Beauty Question Design + Product State + AI

### 60. Beauty Question Design
CLASSIFICATION: DECISION CLOSED FOR CURRENT V2 / FUTURE EVOLUTION OPEN

RESEARCH OBSERVED:
- Clinique currently demonstrates that a short three-question skincare quiz can be used to key recommendations to skin type and concern rather than requiring a long intake. urlClinique skincare services and 3-question quizhttps://www.clinique.com/services
- Current skincare recommendation research also shows that richer recommendation systems may incorporate ingredient analysis and skin-condition/goal signals, but this does not prove that every available dimension should become a mandatory customer question. urlPubMed — deep learning skincare product recommendation and ingredient analysishttps://pubmed.ncbi.nlm.nih.gov/38411029/
- A 2026 dermatology intake study found most surveyed patients preferred focusing on one or two concerns rather than expanding the first interaction into a large set of concerns. This supports minimizing questionnaire burden, while recognizing that the study is clinical-intake research and not a Velora ecommerce experiment. urlPubMed — 4-question patient-centered dermatology intake studyhttps://pubmed.ncbi.nlm.nih.gov/42459240/
- Egyptian 2026 dermocosmetic consensus work supports context-specific ingredient selection and explicitly reports substantial uncertainty across ingredient/scenario combinations; this reinforces that Velora should not let an LLM invent ingredient suitability or medical-style conclusions. urlPubMed — Egyptian National Consensus on Dermocosmetic Ingredient Selectionhttps://pubmed.ncbi.nlm.nih.gov/41537948/

DECISION:
- Keep the current V2 customer entry at three questions:
  skin_type
  goal
  routine_budget
- Do not add concern, texture, effect, avoidance, shopping-priority, age, photo analysis, ingredient intolerance, or other fields merely because the database has optional columns.
- The existing optional profile fields remain available only as future controlled evolution points.
- A future question is justified only when evidence shows it has high signal, cannot be safely inferred, changes routine/product selection materially, and provides enough durable customer value to offset extra friction.

QUESTION EVOLUTION RULE:
Research -> signal value -> inferability -> decision impact -> persistence value -> privacy/UX review -> contract mapping -> implementation -> verification.
No speculative questionnaire expansion.

### 61. Product State × Beauty
CLASSIFICATION: CURRENT-STATE SAFETY CLOSED / BROWSER EVIDENCE OPEN

OBSERVED FACT:
- Canonical V2 recommendation requires approved Beauty products, EGP currency, positive availability, and budget fit.
- Canonical routine applies the same core approved/current-availability guard and can mark required steps unavailable instead of fabricating replacement products.
- Historical purchase/feedback is stored separately and is reused as historical learning context; current recommendation availability is not treated as historical memory.
- Transaction-safe negative-path tests on Restore-Test verified:
  inactive product -> excluded from Recommendation
  rejected product -> excluded from Recommendation
  product with base stock=0 and no active stocked variant -> excluded from Recommendation
  OOS product in Routine -> not selected; routine returned partial where that product was a required slot
- An initial OOS probe was corrected because the test temporarily restored stock before calling the Routine. The corrected probe confirmed the intended current-state behavior.
- Variant-aware interpretation remains important: base product stock=0 is not commercially OOS when an active stocked variant exists. The canonical engine correctly treats a stocked variant as current availability.

CORE RULE:
CURRENT AVAILABILITY != HISTORICAL MEMORY.
No future AI or recommendation layer may bypass canonical product state, approval, inventory, currency, or budget guards.

### 62. AI Status
CLASSIFICATION: CUSTOMER BEAUTY AI NOT DONE / GOVERNANCE AI-ASSISTED FOUNDATION EXISTS

OBSERVED FACT:
- Restore-Test currently has tables:
  ai_decision_runs
  ai_decision_signals
- Current counts are:
  ai_decision_runs=0
  ai_decision_signals=0
  proposed=0
  requires_human_approval=0
  executed=0
- Current repository has no OpenAI/LLM/GPT/Anthropic/Gemini implementation in the inspected application/runtime source.
- Current AI-named governance functions are rule-assisted decision tooling, not a customer beauty LLM:
  velora_generate_ai_signals
  velora_get_ai_decision_center
  velora_update_ai_decision
- velora_generate_ai_signals currently scans deterministic platform conditions such as open reconciliation findings, recent payment failures, and shipment exceptions and creates review signals.
- Therefore do NOT label current deterministic recommendation/routine code as AI and do NOT claim Beauty AI is implemented.

### 63. AI Architecture
CLASSIFICATION: ROADMAP / NOT IMPLEMENTED

RESEARCH / ARCHITECTURE DECISION:
- The preferred future boundary remains:
  Customer input -> AI interpretation -> structured candidate intent -> canonical validation -> deterministic recommendation/routine -> AI explanation -> Customer.
- This aligns with current OpenAI guidance that structured outputs constrain model data flow and that function calling is appropriate when a model bridges to tools/data/functions. urlOpenAI — Structured Outputshttps://developers.openai.com/api/docs/guides/structured-outputs urlOpenAI — agent safety and structured outputshttps://developers.openai.com/api/docs/guides/agent-builder-safety
- The LLM must never own the product catalog, inventory, monetary state, seller governance, refund decision, or order mutation boundary.
- No AI implementation is justified in Message 7 because the canonical deterministic V2 recommendation/routine path exists and the observed customer-AI runtime is absent.

### 64. AI Must Never
CLASSIFICATION: POLICY CLOSED / IMPLEMENTATION NOT YET REQUIRED

Non-negotiable future constraints:
- never invent products, ingredients, availability, pricing, or catalog facts
- never make unsupported medical claims
- never bypass approval, stock, budget, currency, or canonical eligibility
- never mutate orders, payments, commissions, payouts, gift-card balances, refunds, seller status, fraud decisions, or irreversible governance
- never replace canonical DB/business rules
- never create a second unexplained reason-code system

### 65. AI Failure Model
CLASSIFICATION: ROADMAP / NOT IMPLEMENTED

Required future safe handling:
- AI unavailable -> deterministic fallback
- invalid structured output -> discard
- canonical constraint violation -> canonical rejection
- timeout -> bounded safe retry
- ambiguous interpretation -> deterministic/safe path
- provider/model uncertainty -> do not mutate durable commerce state

No live AI fallback path exists today because no customer AI runtime exists.

### 66. AI Explainability
CLASSIFICATION: CONTRACT DIRECTION CLOSED / AI IMPLEMENTATION OPEN

OBSERVED CANONICAL REASON CODES:
- goal_match
- concern_match
- texture_match
- effect_match
- preference_match
- availability_match
- existing V2 routine also uses skin_type_match, step_match, budget_fit, feedback_positive, and seasonal_fit where applicable.

RULE:
- Reuse canonical reason codes and underlying rule evidence.
- AI explanation may translate/explain existing evidence but may not invent evidence or a parallel opaque score/reason taxonomy.
- Truthful product labels must distinguish:
  deterministic
  rule-based
  AI-assisted
  AI-driven
- Current V2 recommendation/routine are deterministic/rule-based, not AI-driven.

### 67. Beauty Browser Gate — Future
CLASSIFICATION: NOT EVIDENCED

Required Browser Gate remains:
guest -> auth
incomplete Passport -> questions
complete Passport -> edit
change one field -> preserve other saved answers
save -> routine
reasons visible
Arabic -> English
Account -> Beauty Journey
refresh persistence
mobile quiz
mobile results
mobile routine
product cards
Add All
purchase-linked feedback

Current blocker:
- Browser verification for the current branch is not evidenced; the previously used browser automation provider had an insufficient wallet balance. Do not convert source/DB/CI results into Browser PASS.

### Message 7 Action Flow — Parallel
Beauty customer flow:
Detect Passport entry/change
-> authenticate
-> validate canonical V2 contract
-> persist profile
-> emit profile-updated event
-> refresh deterministic routine when fingerprint changes
-> derive current recommendations through canonical V2 eligibility
-> use historical feedback/purchase signals only as contextual inputs
-> enforce product state and availability
-> present explainable rule evidence
-> add selected routine items through the existing Routine -> Cart adapter
-> checkout remains canonical
-> failure/recovery remains bounded and auditable.

AI future flow:
Detect intent
-> AI interpretation (future)
-> strict structured candidate intent
-> canonical validation
-> deterministic product/routine selection
-> optional AI explanation grounded only in returned evidence
-> safe fallback on any AI failure
-> human escalation only for genuine governance/policy/provider exceptions.

### Message 7 Execution / Research Gate
OBSERVED FACT:
- No speculative Passport question expansion was made.
- Product state safeguards were verified with transaction-safe negative paths.
- AI audit found a small existing rule-assisted governance foundation, but no customer beauty LLM runtime.
- No duplicate recommendation/routine/feedback/replenishment engine was introduced.
- No OpenAI/LLM dependency was added.
- Two Message 6 fixes remain the current source/DB baseline:
  1. canonical Recommendation V2 public wrapper ACL/runtime fix
  2. canonical Beauty Passport V2 exact token contract hardening

NOT EVIDENCED:
- Browser behavior for Passport/Routine/Recommendation/Feedback.
- Customer-facing Recommendation UX.
- Actual customer AI runtime.
- Provider/Production behavior.

CARRY-FORWARD:
- All OPEN/BLOCKED/PENDING/NOT EVIDENCED items from Messages 2 through 6 remain active and are not removed by Message 7 completion.
- Production remains frozen.
- Browser/provider evidence remains a separate gate.

### Message 7 Master Conditions — Non-Negotiable
1. HANDOFF COMPLETENESS:
   Continue the same Master Handoff with every prior item, dependency, policy gap, ACL/RLS detail, evidence layer, blocked item, and carry-forward item preserved.
2. RESEARCH BEFORE BUILD:
   Do not build merely because a feature can be built. Search proven prior art/documentation/implementations and reuse canonical contracts first. Build only where an observed gap remains and no suitable existing path covers it.
3. ACTION FLOW IN PARALLEL:
   Continue Detect -> Decide -> Execute -> Verify -> Recover/Escalate across the whole platform. Normal paths must operate automatically wherever the current architecture supports it; human input is reserved for real business-policy, governance, provider, fraud/trust, exceptional refund, payout, and release-control boundaries.

## Message 8/11 — Payments + Webhook / Current Active Execution Lane

### 68. Current Lane Authority
CLASSIFICATION: ACTIVE EXECUTION LANE

OBSERVED FACT:
- Payments + Webhook remains the current active execution lane.
- Beauty Passport and Owner/Governance were added to this same Master Plan and did not replace or pause the payment/webhook lane.
- Current work remains Restore-Test only. Production is frozen.

NON-NEGOTIABLE MASTER CONDITIONS:
1. HANDOFF COMPLETENESS — continue the full Master Handoff with every prior item, dependency, policy gap, ACL/RLS detail, evidence layer, blocked item, pending item, and NOT EVIDENCED item preserved. Nothing disappears when execution moves between messages.
2. RESEARCH BEFORE BUILD — Existing Contract -> Research -> Observed Gap -> Actual Need -> Smallest Safe Change. Research prior art/documentation/implementations first; reuse canonical Velora paths; build only where a real observed gap remains. No duplicate payment/webhook engine.
3. ACTION FLOW IN PARALLEL — Detect -> Decide -> Execute -> Verify -> Recover/Escalate. Normal platform operation should complete automatically wherever the canonical architecture supports it. Human intervention is limited to true exceptions such as provider ambiguity, fraud/trust, exceptional refunds, governance, payout/provider settlement, legal publication, and release control.

### 69. Payment Route
OBSERVED FACT:
- Restore-Test payment route is Paymob test/Card for EG/EGP and COD for EG/EGP.
- Other providers are inactive for the current execution scope.

### 70. Canonical Payment RPCs
OBSERVED FACT:
- velora_create_payment_attempt is authenticated-only for customer use; anon EXECUTE is false.
- velora_get_payment_route is authenticated-only; anon EXECUTE is false.
- velora_set_order_payment_method is authenticated-only and enforces authenticated ownership/payment-state constraints.
- Current payment-attempt contract enforces authentication, allowed purpose, idempotency-key bounds, country validation, order ownership, payable-order state, positive amount, and route resolution.
- Current set-payment-method contract requires the owned order, pending payment status, active payment method, and an operational route; current Restore-Test operational allowance is COD or Paymob card/test.

ACL OBSERVATION:
- Current Restore-Test also has velora_attach_payment_provider_session 3-arg and 4-arg overloads; both are SECURITY DEFINER with anon=false, authenticated=true, service_role=true.

### 71. Payment / Order RLS
OBSERVED FACT:
- orders RLS is enabled. Customer SELECT is limited to customer_id = auth.uid(); staff SELECT is allowed through the staff guard.
- payment_attempts RLS is enabled. Customer SELECT is limited to own user_id, with staff access.
- payments RLS is enabled. Customer SELECT is limited to payments belonging to their own orders, with staff access.
- No RLS weakening was introduced for payment testing.

### 72. Provider Session Binding
OBSERVED FACT:
- Canonical 4-argument binding function is velora_attach_payment_provider_session(uuid,text,text,text).
- It requires auth.uid(), locks the owned payment attempt/order relationship, validates provider/session fields, requires provider_order_id for Paymob, stores provider_session_id/provider_payment_id and metadata.paymob_order_id, and writes payment_provider_session_attached audit evidence.
- The current Paymob checkout runtime uses the 4-argument form, not the weaker 3-argument overload.
- A server-authoritative recovery function exists separately: velora_recover_paymob_provider_session(uuid,text,text), with authenticated EXECUTE explicitly revoked and service_role EXECUTE only.

### 73. Provider-Start Failure Gap — CURRENT STATE AFTER HARDENING
CLASSIFICATION: SOURCE/DB CONTRACT GAP CLOSED; LIVE PROVIDER EVIDENCE OPEN

OBSERVED FACT:
- Current Git source contains supabase/functions/velora-paymob-checkout/index.ts.
- Current Restore-Test deployment velora-paymob-checkout is ACTIVE version 16 with verify_jwt=true.
- Direct comparison of deployed runtime content and the Git branch source showed exact content parity for index.ts (12,519 bytes in both), so the earlier source/runtime parity concern is now superseded at the current runtime level.
- Current checkout sequence remains: authenticated payment-attempt creation -> Paymob POST /v1/intention/ -> provider-session binding -> Unified Checkout URL.
- Current implementation explicitly compensates provider-start failures by calling velora_mark_marketplace_payment_initialization_failed(...).
- If Paymob intention creation returns non-2xx, the function records a local marketplace payment-attempt failure and returns a controlled failure response instead of intentionally leaving the attempt pending.
- If the intention response lacks required identifiers, the same canonical initialization-failure path is used.
- If client_secret is missing after a valid intention, the runtime invokes the server-authoritative Paymob session recovery path; if recovery fails, it returns manual_reconciliation_required rather than inventing a second payment engine.
- If provider-session binding fails, the runtime retries the canonical bind once and then invokes the same server-authoritative recovery function; unrecovered ambiguity returns manual_reconciliation_required.

CURRENT SUPPORTING MIGRATIONS:
- 20260928093030_marketplace_payment_initialization_failure_contract_20260928
- 20260928093550_recover_paymob_provider_session_20260928
- Existing downstream failure recovery remains canonical through trg_velora_release_inventory_after_failed_payment -> private.velora_release_inventory_after_failed_marketplace_payment().

### 74. Payment Action-Failure Cases A-E

#### Case A — Attempt created -> provider intention fails
CLASSIFICATION: CLOSED-DONE AT L1-L4 / PROVIDER RUNTIME EVIDENCE OPEN

OBSERVED FACT:
- velora_mark_marketplace_payment_initialization_failed is authenticated-only; anon=false; authenticated=true; service_role=true.
- The function only operates on an owned marketplace-order payment attempt and is idempotent for terminal states.
- Controlled Restore-Test transactional probe on Order #68 / payment attempt dd223161-93e3-4770-9de4-d58c8abc0cce produced:
  attempt pending -> failed
  order pending -> cancelled
  order payment_status pending -> failed
  pending payment read-model -> failed
  payment_failed_inventory_released audit count -> 1
- The same probe was rolled back. Follow-up read verified the attempt/order/payment state returned to pending/pending.
- Trigger definition observed: AFTER UPDATE OF status on payment_attempts WHEN new.status='failed', executing private.velora_release_inventory_after_failed_marketplace_payment().
- Therefore provider-start failure compensation and the downstream inventory/order/payment failure path are one canonical chain; no second failure engine is required.

#### Case B — Provider intention exists -> local provider-session binding fails
CLASSIFICATION: BACKEND RECOVERY CONTRACT CLOSED / AMBIGUOUS LIVE PROVIDER EVENT OPEN

OBSERVED FACT:
- velora_recover_paymob_provider_session is service_role-only and validates Paymob purpose, terminal state, existing provider_order_id conflicts, and existing provider_session_id conflicts.
- A controlled Restore-Test recovery attempt with a mismatched provider order ID correctly raised PAYMOB_RECOVERY_PROVIDER_ORDER_CONFLICT. This proves conflict protection is active.
- A controlled same-binding recovery on a pending Paymob attempt preserved the existing session/order binding and returned the expected pending state. The transaction was rolled back.
- Runtime code uses the recovery path after canonical binding fails and returns a retry or manual reconciliation outcome rather than silently proceeding with an unbound external intention.

#### Case C — Session ready -> payment/customer failure
CLASSIFICATION: BACKEND PATH CLOSED / BROWSER + LIVE PROVIDER EVIDENCE NOT EVIDENCED

OBSERVED FACT:
- Current Paymob webhook v27 maps provider transaction state into the canonical payment_attempt status using a monotonic transition function.
- Marketplace captured -> order payment_status paid, and a pending order becomes confirmed on the captured transition.
- Failed/refunded states are propagated to payment/order read models through the existing webhook reconciliation path.
- The downstream failed-payment path remains the same canonical inventory/order/payment path rather than introducing another engine.

NOT EVIDENCED:
- real customer/browser sandbox completion on the current runtime
- live provider settlement
- Production behavior

#### Case D — Webhook failure
CLASSIFICATION: OPEN / NOT EVIDENCED OPERATIONAL RECOVERY POLICY

OBSERVED FACT:
- Current webhook records a provider event, processes the canonical payment/subscription/seller-ad branch, and marks the webhook event processed only after successful handling.
- Current provider_webhook_events records retain payload hash, signature verification, status, failure_reason, received_at, processed_at, and retry_count fields.
- The current implementation does not justify creation of a second internal webhook retry engine.

OPEN:
- end-to-end evidence for downstream processing failure followed by a successful replay/retry
- explicit provider retry/replay behavior under a genuine failed callback
- operational reconciliation path for an externally completed payment whose callback remains unprocessed

RULE:
Do not invent a second scheduler/queue here. Reuse provider retry behavior and existing provider_webhook_events state; add a Velora replay helper only if an observed operational gap proves it is needed.

#### Case E — Duplicate webhook
CLASSIFICATION: CLOSED-DONE AT WEBHOOK CONTRACT

OBSERVED FACT:
- Current webhook derives eventId from transaction ID (or a deterministic fallback), computes a payload SHA-256 hash, and checks provider_webhook_events before processing.
- An already-processed event with the same payload hash is returned as duplicate=true with state_change='none'.
- A same-event payload mismatch is rejected with WEBHOOK_EVENT_PAYLOAD_MISMATCH.
- Payment status transitions are monotonic: captured stays captured unless refund arrives; failed/cancelled remain terminal; authorized/requires_action can move only through allowed forward/terminal states.
- Restore-Test currently contains processed Paymob webhook events with signature_verified=true and status=processed.

### 75. Paymob Webhook Security / Runtime
OBSERVED FACT:
- velora-paymob-webhook-restore-test is ACTIVE version 27 and verify_jwt=false.
- verify_jwt=false is intentional because this external provider callback is authenticated inside the function using Paymob HMAC verification.
- Current webhook uses HMAC-SHA512 with constant-time comparison and correlates the Paymob order ID to Velora's payment_attempts metadata/paymob_order_id relationship.
- Current source also preserves subscription and seller-ad payment branches instead of creating a separate marketplace-only webhook engine.
- Direct comparison of deployed runtime and Git source showed exact content parity for the current webhook index.ts (15,078 bytes in both).

RESEARCH-FIRST SUPPORTING EVIDENCE:
- Paymob's current Create Intention documentation specifies POST /v1/intention/, secret-key Token authorization, amount in cents, matching currency/integration requirements, and response identifiers including intention_order_id, id, and client_secret. It also describes notification_url and redirection_url behavior. 
  Source: https://developers.paymob.com/paymob-docs/intention-apis/create-intention
- Paymob's current Transaction Callback documentation describes server-side POST callbacks and says order.id is used to correlate the received transaction with the order bound during intention creation. 
  Source: https://developers.paymob.com/paymob-docs/manage-callback/transaction-callbacks
- Paymob's current HMAC documentation describes HMAC-based callback verification, consistent with treating the webhook as publicly reachable at the HTTP layer while enforcing provider authenticity inside the handler. 
  Source: https://developers.paymob.com/paymob-docs/developers/webhook-callbacks-and-hmac/hmac/hmac-for-card-tokens
- Paymob provides a webhook testing tool for inspecting success/failure/refund/void/capture callbacks before production. 
  Source: https://developers.paymob.com/paymob-docs/developers/webhook-callbacks-and-hmac/webhook-testing-tool
- Adyen's current idempotency documentation describes safe retries with idempotency keys and asynchronous server-to-server webhooks as a resilience pattern for missing responses/timeouts. 
  Source: https://docs.adyen.com/development-resources/api-idempotency
- Stripe's current webhook/idempotency documentation remains useful prior art for asynchronous event handling and safe retry semantics; Velora should reuse those principles without introducing provider-specific copies of the same canonical state machine. 
  Sources: https://docs.stripe.com/webhooks and https://docs.stripe.com/api/idempotent_requests

### 76. Restore-Test Webhook Evidence
CLASSIFICATION: OBSERVED RESTORE-TEST EVIDENCE / NOT LIVE SETTLEMENT PROOF

OBSERVED FACT:
- Current Restore-Test contains two processed Paymob webhook records with signature_verified=true, status=processed, retry_count=0.
- Historical processed events included one event moving a payment attempt to captured and the corresponding order payment_status to paid.
- This proves Restore-Test webhook processing occurred; it does not prove live Paymob settlement or Production delivery.

### 77. Paymob Sandbox Evidence Workflow
CLASSIFICATION: CI EVIDENCE PATH EXISTS / CURRENT FULL PASS NOT EVIDENCED

OBSERVED FACT:
- .github/workflows/velora-paymob-sandbox-evidence.yml implements the intended path:
  Auth -> fixture/pending order -> velora-paymob-checkout -> Paymob intention -> sandbox payment/browser drill -> DB payment attempt/webhook polling -> final order/payment state -> evidence artifact.
- Workflow expects captured payment_attempt, processed verified webhook, order payment_status paid, and order status confirmed before declaring the run passed.
- The latest previously confirmed Run #4 (36296512312, 2026-09-27 05:12 UTC, SHA fe339f2c...) is historical evidence against the older runtime state. It failed because checkout returned HTTP 400 without a checkout URL; no Paymob intention or sandbox payment path was confirmed. The current v16 deployment happened later and must be judged independently.
### 78. Current Source / Runtime Parity Reconciliation
CLASSIFICATION: CLOSED-DONE FOR CURRENT CHECKOUT + WEBHOOK SOURCE PARITY / HISTORICAL NOTE RETAINED

OBSERVED FACT:
- The earlier provenance note said GitHub code search could not locate a matching checkout source. Direct current Git fetch resolved this as a code-search/index visibility problem rather than evidence that the source was absent.
- Current Git contains both:
  supabase/functions/velora-paymob-checkout/index.ts
  supabase/functions/velora-paymob-checkout/deno.json
  supabase/functions/velora-paymob-webhook-restore-test/index.ts
  supabase/functions/velora-paymob-webhook-restore-test/deno.json
- Current deployed versions are checkout v16 and webhook v27, and their deployed index.ts contents exactly match the Git branch files.
- Therefore the earlier runtime/source parity gap is SUPERSEDED for the current runtime. The historical provenance document docs/audit/PAYMOB_RUNTIME_PROVENANCE_2026-09-28.md must remain as historical evidence and must not be treated as the current version record.

### 79. Current Payment Evidence Snapshot
OBSERVED FACT:
- Restore-Test currently reports 13 orders, 36 payment_attempts, 11 payments, and 2 processed Paymob webhook events.
- Several pending marketplace payment attempts for Order #62 currently have provider_session_id/provider_payment_id values already attached; this is test-state evidence, not settlement proof.
- Multiple pending attempts remain from earlier evidence drills. This reinforces the previously carried OPEN policy/automation question for abandoned pending orders. Do not solve that policy by inventing a TTL during Message 8.

### 80. Launch Gates — Payment/Provider
STATUS:
- payment_provider -> BLOCKED / REQUIRED
- webhook_verification -> BLOCKED / REQUIRED
- production_infra -> PENDING / REQUIRED
- rollback_backup -> PENDING / REQUIRED
- shipping_provider -> BLOCKED / NOT REQUIRED (manual fulfillment accepted)

REASON:
- Backend/source/DB contracts are substantially hardened, but the current record still lacks the required current Browser + provider-level settlement evidence and Production-readiness evidence.
- No claim of live Paymob settlement PASS is permitted.

### 81. Message 8 Action Flow — Parallel
Detect provider-start attempt
-> authenticate customer
-> validate canonical order/payment route/idempotency
-> create canonical payment_attempt
-> call Paymob Intention API
-> if provider-start fails: mark marketplace initialization failed
-> trigger canonical downstream inventory/order/payment/commission recovery
-> if intention succeeds: bind provider session
-> if bind fails: recover provider session server-authoritatively or escalate manual reconciliation
-> present provider checkout
-> receive HMAC-verified webhook
-> dedupe by provider event + payload hash
-> apply monotonic payment transition
-> synchronize canonical order/payment read models
-> audit
-> retry/reconcile only through existing provider/event-state mechanisms
-> human exception only for genuine provider ambiguity, fraud/trust, exceptional refund, payout/settlement, or release control.

NO DUPLICATE ENGINE RULE:
- Payment failure recovery remains the existing payment_attempt trigger/helper.
- Provider-session recovery remains the existing service-role recovery function.
- Webhook handling remains the existing Paymob webhook function plus provider_webhook_events.
- Do not add a parallel payment failure engine, webhook scheduler, or separate reconciliation model without a new observed gap.

### 82. Message 8 Execution Classification
CLOSED-DONE:
- Current Paymob checkout source/runtime parity.
- Authenticated-only canonical payment RPC ACL baseline.
- Payment/order/payments RLS baseline.
- Provider session binding owner gate and Paymob order binding guard.
- Case A provider-start failure compensation at source/DB, including downstream inventory/order/payment recovery, with rollback proof.
- Case B provider-session recovery contract, conflict protection, and service-role-only ACL.
- Case E duplicate/monotonic webhook contract.

OPEN / NOT EVIDENCED:
- Case C current Browser/real sandbox payment completion.
- Case D full operational webhook-failure replay/reconciliation evidence.
- Current customer Browser Gate for payment UI.
- Current provider settlement evidence.
- Production infrastructure/backup/rollback evidence.
- Abandoned pending-order/reservation business policy remains carried forward.

BLOCKED:
- payment_provider launch gate until provider-level evidence is obtained.
- webhook_verification launch gate until current verified provider evidence is obtained.
- Browser/provider automation remains unavailable when its external provider/tooling is not usable; do not convert this into a source/DB PASS.

INFERRED:
- The current payment-start architecture now has a coherent single canonical compensation chain for the observed provider-start failure cases, while remaining intentionally conservative about external-provider ambiguity.

HYPOTHESIS / DISALLOWED CLAIM:
- Do not infer the exact historical HTTP 400 root cause from Run #4. The historical root cause remains unresolved because available logs did not prove it.
- Do not blame credentials, RLS, provider outage, account configuration, or browser cache without new evidence.

### Message 8 Evidence Discipline
- L1 Source: current Git checkout/webhook sources and workflow inspected.
- L2 DB: current RPC/function definitions, RLS, payment tables, and webhook event records inspected.
- L3 ACL/RLS: payment functions and tables verified.
- L4 Negative Path: Case A transactional failure compensation and Case B session recovery/conflict tested with rollback.
- L5 CI: historical sandbox workflow failure retained; current v16 must be independently re-run to establish new CI evidence.
- L6 Preview: no current Message 8 payment UI Preview PASS claimed merely from source changes.
- L7 Browser: NOT EVIDENCED.
- L8 Provider: NOT EVIDENCED for current full settlement chain.
- L9 Production: NOT EVIDENCED; Production remains frozen.

### Message 8 Carry-Forward
- All unresolved items from Messages 2/11 through 7/11 remain active and are NOT deleted by Message 8.
- Seller Dashboard re-entry remains Browser-gated.
- Seller post-approval re-review policy, abandoned pending-order/reservation policy, and legacy order-item status contract remain open.
- Subscription commercial policy/runtime/browser gaps remain open.
- Ads reporting/attribution/pricing/provider evidence remain open.
- Commission policy/refund treatment remains open.
- Payout provider execution/reconciliation evidence remains open.
- Promotions free_shipping/stacking/targeting/economics/reversal policy gaps remain open.
- Gift-card refund/cancel accounting/expiry policy and Browser evidence remain open.
- Returns customer UX/refund allocation/provider refund/window policy remain open.
- Notifications Browser push/delivery evidence remains open.
- Beauty Passport/Routine/Recommendation browser evidence and customer Recommendation UX remain open.
- Customer Beauty AI remains NOT DONE / ROADMAP; no AI engine is to be introduced here.
- Production infrastructure and rollback/backup remain PENDING and outside Restore-Test changes.


## Message 9/11 — Legal + Owner Dashboard / Governance Control Plane

### Message 9 master conditions
1. HANDOFF COMPLETENESS — Message 9 is appended to the same Master Execution Plan. Nothing from Messages 2/11 through 8/11 is deleted, overwritten, or considered closed merely because execution moved to Legal/Owner. All prior OPEN / BLOCKED / PENDING / NOT EVIDENCED items remain carry-forward.
2. RESEARCH BEFORE BUILD — do not invent a second Owner dashboard engine, permission engine, legal engine, audit engine, release engine, or governance scheduler. Reuse existing canonical contracts and UI surfaces whenever the observed gap can be closed by connecting them. Research prior art first; implement only a concrete observed need.
3. ACTION FLOW IN PARALLEL — Detect -> Decide -> Execute -> Verify -> Recover/Escalate remains active across Legal, Owner, Seller, Commerce, Payments, Trust, Release, and all other platform domains. Normal flows should self-complete through canonical contracts; human intervention remains for genuine governance/legal/provider/fraud/trust/refund/payout/release exceptions.

### 82. Legal — Current Contract and Environment State
CLASSIFICATION: BACKEND GOVERNANCE FOUNDATION CLOSED / PUBLISHABLE LEGAL CONTENT NOT PRESENT / RUNTIME EVIDENCE OPEN

OBSERVED FACT:
- Existing architecture includes legal_documents, versioning fields, content hashes, publication/effective-date state, legal_acceptances, server-side legal helpers, and RLS.
- The historical handoff snapshot reported legal_documents = 0. That is a historical baseline and must be preserved as historical evidence only.
- CURRENT Restore-Test database audit now shows legal_documents = 4 and legal_acceptances = 4.
- CURRENT legal_documents status distribution is 4 retired, 0 published.
- All four current rows are Restore-Test QA fixtures from 2026-09-27. They are not valid current production legal content.
- CURRENT legal_acceptances are checkout acceptances tied to those retired QA versions. Acceptance records exist as evidence of the test flow; they do not create a currently published legal document.
- Current RLS allows public/anonymous and authenticated reads only for documents that are published and effective, while staff can read all legal documents. legal_acceptances read is limited to the authenticated user's own records or staff.
- Checkout remains fail-closed because there is no currently published applicable legal document. The established failure contract remains LEGAL_DOCUMENTS_NOT_PUBLISHED.
- docs/legal/VELORA_EGYPT_LEGAL_DRAFT_PACK_2026-09-26.md remains DRAFT — DO NOT PUBLISH.
- No legal publication is to be simulated, seeded as a fake proof, or inferred from retired QA rows.

CURRENT LEGAL RPC CONTRACTS:
- velora_upsert_legal_document(...) is authenticated + staff governed. It validates type/locale/version/title/body/status, computes the SHA-256 body hash server-side, validates any supplied client hash against the server hash, and requires Owner authority for approved/published/retired statuses.
- velora_publish_legal_document(p_document_id,p_effective_from) is authenticated + explicit Owner role required. It requires the selected version to be approved, retires a prior published version for the same document_type + locale, publishes the selected version, and writes a legal_document_published audit event.
- Legal Owner authority is therefore enforced server-side; UI visibility is not the authorization boundary.
- No unpublish/rollback/legal-retire UI contract was newly invented. Existing retirement behavior must be treated as the canonical state transition until a separate observed policy/contract justifies another action.

LEGAL UI OBSERVATION:
- Existing renderAdminLegal()/loadAdminLegalFromDb() already use the canonical legal RPCs and already hide the Publish action unless the loaded UI role set contains owner and the row is approved.
- Before Message 9, this existing Legal UI was not reachable from the current canonical Admin navigation.
- Therefore the concrete observed gap was control-surface reachability, not absence of a legal backend.

### 83. Owner Dashboard — First-Class Canonical Track
CLASSIFICATION: OPEN / PARTIALLY CONNECTED

OWNER PURPOSE:
- Owner = governance + exception control.
- Owner is NOT intended to be a human operator for every normal automated flow.
- Normal customer/seller/operations paths should remain server-authoritative and automated.
- Owner should enter where policy, high-impact exception, legal approval, fraud/trust review, settlement/reconciliation, launch control, or other explicitly governed action requires privileged intervention.

CURRENT OWNER UI OBSERVATION:
- The current canonical control surface is a shared Admin/Owner operations shell in src/scripts/12-localization.js.
- Existing canonical sections include Dashboard, Sellers, Products, Orders, Users, Audit Logs, Seller Applications, Seller Onboarding, Promotions, Coupons, Gift Cards, and Trust & Compliance.
- Gift Cards already has an explicit Owner-only UI guard; the server-side issuance RPC independently enforces Owner-only access.
- Existing Release Control is added to the same Admin control surface by src/scripts/11-admin.js and uses the existing release control-plane RPCs.
- A legacy owner analytics/audit implementation remains inside 00-localization.js, but there is no active legacy owner shell/DOM or canonical Owner state machine there. It must not be revived as a second Owner platform.
- The current Owner dashboard is therefore NOT evidenced as fully closed for the complete governance scope.

OWNER DASHBOARD STATUS:
- OWNER DASHBOARD = OPEN.
- Owner entry route + canonical Owner authorization preflight are now source-connected.
- Legal is now reachable from the canonical admin/owner navigation through the existing Legal UI and canonical legal RPCs.
- Full Owner governance completeness, action coverage, per-surface authority, end-to-end auditability, exception tooling, failure recovery, notification behavior, and Owner browser verification remain OPEN / NOT EVIDENCED where applicable.

### 84. Owner Scope Audit Matrix
RULE:
- This is a working audit matrix, not proof that every row is currently granted.
- Only actual DB/code evidence may promote a capability from NOT EVIDENCED.
- Do not invent permission names or create a granular permission engine merely to fill this table.

| Area / Action | Customer | Seller | Staff/Admin | Owner | Service Role |
|---|---|---|---|---|---|
| Own profile | contract-defined | contract-defined | limited / governance where supported | governance | backend only |
| Seller product create | No | own seller scope via canonical seller RPCs | moderation/ops only where contract permits | governance | backend |
| Product approval | No | No self-approval | staff via canonical product-status RPC | owner inherits current staff guard | backend |
| Product deactivate/reactivate | No | own approved product availability contract | moderation where supported | governance | backend |
| Own order read | yes | seller-scoped order visibility where contract exists | ops/staff where supported | governance | backend |
| Own payment read | yes | seller-relevant scope only where supported | ops where supported | governance | backend |
| Gift-card issuance | No | No | No direct grant evidenced | OWNER-ONLY | backend execution |
| Legal drafting/version write | No | No | staff write for draft/in_review path | governance / approval authority | backend |
| Legal publish | No | No | NOT GRANTED by current publish RPC | OWNER-ONLY | backend |
| Seller suspension | No | No self-governance | staff via canonical seller-status RPC | owner currently satisfies staff guard | backend |
| Promotion governance | No | seller-owned promotion writer NOT EVIDENCED | staff via canonical promotion contracts | owner currently satisfies staff guard | backend |
| Payout request | own eligibility/request where supported | own seller scope | ops where supported | governance | backend |
| Payout execution | No | No direct execution grant | staff via canonical execution RPC | owner currently satisfies staff guard | backend |
| Release / launch control | No | No | staff control-plane access currently evidenced | governance through current staff contract | backend |
| Trust / returns / disputes | customer-owned request paths where supported | own scoped paths where supported | staff governance where canonical contracts exist | owner currently satisfies current staff guards | backend |
| User account governance | No | No | staff via canonical account-action contract where supported | owner currently satisfies current staff guard | backend |
| Service-role operations | No | No | No | No frontend privilege | service/backend only |

IMPORTANT AUTHORIZATION OBSERVATIONS:
- Current role enum is exactly: customer, seller, admin, owner.
- private.velora_has_role(required_role) is SECURITY DEFINER and checks user_roles for auth.uid().
- private.velora_is_staff() is SECURITY DEFINER and currently evaluates to admin OR owner.
- Therefore Owner currently inherits any function protected only by velora_is_staff(). This is an OBSERVED FACT about the current control model, not a statement that it is the final desired governance policy.
- There is currently no independently evidenced fine-grained permission catalog. Do not invent one.
- Service-role execution remains a backend/service identity, not a frontend convenience privilege.

### 85. Canonical Owner Entry / Route Gap and Smallest Safe Fix
CLASSIFICATION: OBSERVED GAP CLOSED AT SOURCE LEVEL / BROWSER PROOF OPEN

OBSERVED PRE-FIX GAP:
- src/scripts/63-platform-router.js declared owner as a platform route and captured originalOpenOwner from window.openOwnerPlatform.
- Prior to this fix, src/scripts/00-localization.js did not contain a real active Owner platform implementation. Its fallback window.openOwnerPlatform routed to window.switchPlatform('owner'), while the legacy switchPlatform('owner') only displayed “Owner Center (coming next)” and did not open a real Owner surface.
- This created a concrete route-to-no-op path: the router could recognize #owner while the captured opener did not provide a real Owner control surface.
- The canonical Admin/Owner implementation already existed in 12-localization.js and correctly authenticated Admin/Owner roles.

SMALLEST SAFE CHANGE IMPLEMENTED:
- openCanonicalAdmin(requiredRole=null) now accepts an optional role requirement.
- openCanonicalOwner() calls the existing canonical Admin shell with requiredRole='owner'.
- Existing platform switch behavior now distinguishes admin and owner instead of treating both identically.
- window.openOwnerPlatform is assigned to the canonical Owner opener before the platform router loads, so 63-platform-router.js captures a real Owner function rather than the legacy no-op fallback.
- window.closeOwnerPlatform is mapped to the existing canonical Admin close surface.
- Canonical navigation now labels the Dashboard as Owner Dashboard when the authenticated role set contains owner.
- Existing Legal UI is exposed as a canonical Legal section and routes to renderAdminLegal(), reusing existing Legal RPCs and controls.
- No new database table, enum, permission string, scheduler, analytics engine, audit engine, legal engine, or Owner engine was introduced.

IMPLEMENTATION COMMIT:
- c4fe4dfdb817a7ca46dbfe2a664a8fea2f9350a8
- file changed: src/scripts/12-localization.js
- no Production change

### 86. Legal + Owner Authorization Evidence
CLASSIFICATION: L1-L4 BACKEND CONTRACT EVIDENCE / UI EVIDENCE OPEN

OBSERVED FACT:
- velora_issue_gift_card is explicitly OWNER-ONLY and has anon EXECUTE false.
- velora_publish_legal_document has anon EXECUTE false, authenticated EXECUTE true, service_role EXECUTE true, and an explicit Owner check inside the function.
- velora_upsert_legal_document has authenticated execution plus staff guard, with explicit Owner requirement for approved/published/retired status.
- velora_set_seller_status, velora_set_product_status, velora_admin_update_order_status, velora_create_platform_promotion, velora_set_platform_promotion_active, velora_resolve_return, velora_record_payout_execution, velora_resolve_dispute, velora_resolve_privacy_request, velora_account_action, and velora_moderate_beauty_feedback are currently protected primarily by the existing staff guard. Their exact business rules remain authoritative.
- Legal and governance writes are audited where the inspected function definitions explicitly insert audit_logs.
- audit_logs itself is readable by staff only through the current RLS policy.
- No RLS relaxation was made as part of Message 9.

NOT EVIDENCED:
- a complete Owner-only action catalog
- a complete matrix separating Admin vs Owner for every high-impact operation
- a complete browser proof that every privileged button is present only where intended
- a complete negative-path matrix proving each unauthorized role is denied at runtime for every Owner-sensitive action.

### 87. Owner Privileged-Action Standard
For every privileged action, the audit checklist remains:

Owner identity
-> authorization
-> input validation
-> state transition
-> side effects
-> audit event
-> failure handling
-> idempotency where applicable
-> notification if an existing canonical notification contract supports it
-> final Browser proof whenever the action is UI-facing

This checklist must be applied to:
- Seller approval/suspension/moderation exceptions.
- Product approval/rejection/deactivate/reactivate.
- Order exception/cancellation/refund governance.
- Payment attempt/capture/failure/provider-reference exception handling.
- Refund/return resolution.
- Subscription lifecycle and billing exceptions.
- Advertising governance and billing exceptions.
- Commission correction/reconciliation.
- Payout execution/settlement/reconciliation.
- Promotion creation/activation and later policy controls.
- Gift-card issuance and exception handling.
- Legal version creation, approval, publication, and acceptance evidence.
- User account governance.
- Fraud/trust decisions.
- Platform setting changes.
- Audit access.
- Release/launch control.
- Backup/rollback readiness controls.

### 88. Release / Launch / Backup Governance Carry-Forward
OBSERVED FACT:
- Existing release control is already a separate control-plane surface and does not itself deploy code.
- velora_run_launch_gate_audit() is staff-only and explicitly preserves payment_provider=blocked, webhook_verification=blocked, production_infra=pending, rollback_backup=pending, and shipping_provider=blocked/not-required according to the current evidence model.
- The new Owner route does not override these launch-gate states.
- Owner visibility of release/launch/backup state is therefore partially present through existing control-plane paths, but full Owner-specific browser evidence and end-to-end governance proof remain OPEN.
- No backup/rollback claim is made from database structure alone.

### 89. Legal / Owner Action Flow — Parallel
LEGAL:
Detect missing/changed legal requirement
-> determine required document/version/jurisdiction/locale from canonical contract
-> draft/review through existing legal workflow
-> validate content + server-side SHA-256 hash
-> require Owner approval for approved/published state
-> publish exactly one applicable current version per document type + locale through canonical publisher
-> record audit evidence
-> expose only published/effective documents publicly
-> force applicable commercial actions to fail closed when required legal documents are absent
-> monitor acceptance/reacceptance requirements
-> recover through legal version rollback/retirement only where the existing contract supports it
-> escalate to Owner/Legal human decision for actual legal approval/content policy.

OWNER / GOVERNANCE:
Detect operational signal or exception
-> determine whether canonical automation already handles the normal path
-> if normal path exists, execute through the existing automation and do not involve Owner
-> if privileged governance is required, authenticate user and resolve actual role(s)
-> authorize using the existing canonical function guard
-> validate action inputs/state transition
-> execute canonical writer
-> apply existing side effects/triggers
-> write/read audit evidence
-> retry only through existing idempotent mechanism where supported
-> notify through existing notification contract when supported
-> recover through existing canonical compensation/workflow
-> escalate only when provider ambiguity, fraud/trust, exceptional refund, payout settlement, legal approval, release control, or other true governance exception remains.

NO DUPLICATE ENGINE RULE:
- Legal uses legal_documents/legal_acceptances + existing legal RPCs.
- Owner operations use the canonical Admin/Owner control surface + existing domain RPCs.
- Audit uses existing audit_logs and existing canonical audit/read paths.
- Release uses existing release control plane.
- Trust/returns/disputes use existing trust contracts.
- Payments/webhooks use their existing canonical chain.
- Do not create a second Owner engine, generic action dispatcher, generic permissions engine, or generic governance database without a new observed contract gap.

### 90. Research-First Owner / Legal Prior Art
RESEARCHED PATTERNS:
- OWASP authorization guidance emphasizes least privilege, deny-by-default, explicit authorization checks, and logging authorization events.
- Supabase documentation/security guidance distinguishes database grants from RLS policies and supports explicit review/testing of authorization behavior.
- Microsoft Entra RBAC guidance emphasizes role-based access, privileged role separation, access review, and limiting sensitive operations.
- Contentful's environment/permission model is useful prior art for separating environments and limiting privileged changes.
- Existing marketplace/control-plane patterns reviewed in earlier messages (including Shopify/GitHub role models) reinforce using role-scoped administrative surfaces and keeping high-impact actions behind server-authoritative controls.

VELORA DECISION:
- Reuse these principles, not their product-specific permission names.
- Keep Production protected.
- Keep role determination in canonical user_roles / role helpers.
- Keep authorization inside server-side contracts.
- Keep auditability close to privileged state transitions.
- Avoid inventing a new permission taxonomy unless the existing role model proves insufficient for a concrete observed requirement.
- Avoid making Owner a manual approval step for automated routine flows.

### 91. Message 9 Browser / Preview Evidence
CLASSIFICATION: SOURCE PASS / DEPLOYMENT SIGNAL PRESENT / BROWSER PASS NOT EVIDENCED

OBSERVED:
- The Message 9 code change is committed as c4fe4dfdb817a7ca46dbfe2a664a8fea2f9350a8.
- GitHub combined commit status reports Vercel = success for the commit.
- Exact-commit GitHub workflow-run lookup returned no workflow runs for c4fe4dfdb817a7ca46dbfe2a664a8fea2f9350a8.
- Vercel success is deployment/platform status, not Browser Gate proof.
- TinyFish/browser automation has historically been unavailable in this track due to the external wallet/tool limitation; therefore no Browser PASS is claimed.

BROWSER TARGETS REMAIN OPEN:
- owner authentication: customer denied, seller denied, admin behavior as designed, owner succeeds
- owner open -> close -> reopen without refresh
- #owner route entry/re-entry after leaving other platforms
- Owner Dashboard shell and navigation
- Sellers moderation and suspension actions
- Products moderation
- Orders exception surface
- Users governance surface
- Audit Logs visibility
- Promotions/Coupons/Gift Cards
- Trust & Compliance
- Legal section visibility and Owner-only Publish button
- non-Owner cannot publish legal
- Owner cannot bypass legal backend requirements
- refresh/mobile/Arabic-English behavior
- Release Control + launch-gate visibility where exposed

### 92. Message 9 Execution Classification
CLOSED-DONE:
- Legal backend architecture and server-side hash/publication controls, subject to the absence of approved current legal content.
- Current legal public read RLS shape for published/effective documents.
- Explicit Owner-only server authorization for legal publication.
- Existing Owner-only server authorization for gift-card issuance.
- Current role enum discovery: customer / seller / admin / owner.
- Current staff guard discovery: admin OR owner.
- Concrete Owner route no-op gap at source level.
- Canonical Owner opener wiring at source level.
- Existing Legal UI made reachable from canonical Admin/Owner navigation at source level.
- No duplicate governance/legal/permission engine introduced.

OPEN / NOT EVIDENCED:
- FULL OWNER DASHBOARD.
- Complete Admin-vs-Owner privilege separation policy for every high-impact operation.
- Full Owner browser gate.
- Full legal Browser flow.
- Current published legal content approved by Legal/Owner for any real launch.
- Any claim that the DRAFT legal pack is publishable.
- Complete owner notification/exception workflow coverage.
- Full privileged-action audit matrix including negative tests for each role.
- Unpublish/legal rollback UX if later business/legal policy requires it.
- Payment/provider/production and all Message 8 carry-forward items.

PENDING:
- Production infrastructure and backup/rollback readiness remain pending.
- Owner/legal release-readiness remains dependent on real legal approval and launch-control evidence.
- Current provider settlement and Browser tooling evidence remain pending/blocked per Message 8.

BLOCKED:
- payment_provider remains BLOCKED / REQUIRED.
- webhook_verification remains BLOCKED / REQUIRED.
- shipping_provider remains BLOCKED / NOT REQUIRED.
- Browser/provider evidence may remain blocked by external test tooling; do not convert that into code failure or browser pass.

INFERRED:
- The safest immediate Owner/Legal move is to strengthen reachability around already-canonical contracts rather than create a parallel Owner platform.
- The current Owner role naturally acts as the governance superset of Admin because velora_is_staff() currently includes owner; whether selected actions should eventually be Owner-only is a policy decision, not a code assumption.

HYPOTHESIS / DISALLOWED CLAIMS:
- Do not claim that every staff action should be Owner-only.
- Do not claim the current shared Admin/Owner shell constitutes a complete Owner dashboard.
- Do not claim legal publication is ready merely because the publish RPC exists.
- Do not claim the historical legal_documents=0 snapshot is still the current DB state.
- Do not claim Browser PASS from Vercel success or source inspection.
- Do not claim Production safety from Restore-Test DB evidence.

### Message 9 Carry-Forward — Nothing Dropped
The following remain active from earlier Messages and must continue into Message 10/11 and beyond:
- canonical cart + legacy visible cart adapter; no cart rewrite.
- routine -> cart canonical adapter and Browser evidence where still applicable.
- checkout canonical path and stale visual shipping calculation observation.
- manual shipping; no required external carrier integration.
- variant inventory reconciliation and failed-payment release.
- legacy order_items.status contract mismatch; do not add a status column casually.
- abandoned pending-order/reservation policy remains OPEN; do not invent a TTL.
- seller product lifecycle; seller delete remains prohibited.
- seller post-approval re-review policy remains OPEN.
- Seller Dashboard re-entry remains Browser-gated.
- seller subscription lifecycle/UI/provider/browser policy gaps.
- seller advertising reporting/attribution/pricing/provider/browser gaps.
- commission policy/refund treatment.
- payout execution/provider/reconciliation evidence.
- promotion free_shipping/stacking/targeting/economics/reversal policy.
- gift-card refund/cancel accounting/expiry/browser evidence.
- returns customer UX/refund allocation/provider refund/return-window policy.
- notifications browser delivery/push evidence.
- Beauty Passport V2 / Routine / Recommendation browser evidence.
- customer Recommendation UX.
- customer Beauty AI remains NOT DONE / roadmap; do not introduce AI engine here.
- Paymob Case C browser/live sandbox completion.
- Paymob Case D webhook-failure replay/reconciliation.
- payment_provider and webhook_verification launch gates remain blocked.
- production_infra and rollback_backup remain pending.
- Production remains frozen.
- research before build remains mandatory.
- Action Flow remains parallel across the entire platform.

### Message 9 Evidence Ledger
L1 SOURCE:
- current canonical Admin/Owner source in src/scripts/12-localization.js
- platform routing source in src/scripts/63-platform-router.js
- existing Legal UI in src/scripts/00-localization.js
- existing Release Control in src/scripts/11-admin.js

L2 DB:
- current Restore-Test legal documents, legal acceptances, audit logs, role counts, role helper definitions, function definitions, RLS policies.

L3 ACL/RLS:
- user_roles role model and RLS
- Legal read policies
- audit_logs staff-read policy
- Owner-only legal publish contract
- Owner-only gift-card issuance contract
- staff-protected governance writers

L4 NEGATIVE / TRANSACTION PATH:
- Message 9 did not fabricate a new mutation test where no new DB contract required it.
- Existing backend contract checks remain the source of authority.
- Dedicated unauthorized-role negative browser/DB tests are OPEN where not yet evidenced.

L5 CI:
- no workflow run attached to commit c4fe4dfdb817a7ca46dbfe2a664a8fea2f9350a8.

L6 PREVIEW/DEPLOYMENT:
- GitHub combined Vercel status = success for c4fe4dfdb817a7ca46dbfe2a664a8fea2f9350a8.
- This is deployment signal only.

L7 BROWSER:
- NOT EVIDENCED.

L8 PROVIDER:
- not applicable to Legal/Owner UI itself; payment/provider evidence remains carried from Message 8 and is still open/blocked.

L9 PRODUCTION:
- NOT EVIDENCED; Production remains frozen.

### Message 9 Next Execution Order
1. Continue the full Master Handoff rather than treating Message 9 as a reset.
2. Keep Owner Dashboard = OPEN until the complete governance surface is audited.
3. Continue auditing existing canonical control surfaces before adding anything new.
4. For every Owner-sensitive action, build the actual role/guard matrix from code + DB first.
5. Research any missing control-plane pattern before implementing a gap.
6. Use Browser Gate only for claims that require UI/runtime evidence.
7. Keep Legal fail-closed until real approved/published legal content exists.
8. Continue Message 8 payment/provider lane in parallel; Message 9 does not supersede it.


## Message 10/11 — Security + Auth + Localization + Operations

### Message 10 master conditions
1. HANDOFF COMPLETENESS — Message 10 is appended to the same Master Execution Plan. Nothing from Messages 2/11 through 9/11 is removed, reset, silently reclassified, or forgotten. All prior OPEN / BLOCKED / PENDING / NOT EVIDENCED items remain carry-forward.
2. RESEARCH BEFORE BUILD — use targeted remediation only. Inspect actual contracts, prior art, Supabase guidance, and real runtime evidence before changing security/auth/localization/operations. Do not build a new security engine, permission engine, notification service, accounting ledger, shipping backend, or localization engine merely to make a checklist look complete.
3. ACTION FLOW IN PARALLEL — Detect -> Decide -> Execute -> Verify -> Recover/Escalate stays active across security, authentication, localization, legal, seller, commerce, payments, trust, financial operations, and release control. Normal operation should remain automated wherever canonical contracts support it; Owner/Staff intervention is reserved for genuine policy, fraud/trust, legal, financial exception, provider, or release boundaries.

### 90. Security / RBAC — Current Targeted Advisor Audit
CLASSIFICATION: OPEN SECURITY HARDENING / NO BLANKET REVOCATION JUSTIFIED

CURRENT SUPABASE SECURITY ADVISOR OBSERVED FACTS (Restore-Test, 2026-09-28):
- rls_enabled_no_policy: 6 findings.
  - private.beauty_catalog_revision
  - private.beauty_recommendation_rate_events
  - public.billing_instruments
  - public.paymob_card_tokenization_sessions
  - public.regional_pricing
  - public.seller_subscription_renewal_jobs
- extension_in_public: 1 WARN for pg_net installed in public schema.
- anon_security_definer_function_executable: 7 WARNs for public read-style SECURITY DEFINER functions.
- authenticated_security_definer_function_executable: 215 WARNs.
- auth_leaked_password_protection: 1 WARN — leaked password protection is disabled.

TARGETED EXPOSURE CHECK:
- Current direct table grants for anon and authenticated are FALSE for:
  - billing_instruments
  - paymob_card_tokenization_sessions
  - regional_pricing
  - seller_subscription_renewal_jobs
- RLS is enabled on all four of those public tables.
- Therefore the Advisor warning about RLS enabled with no policy does NOT by itself establish public Data API exposure for these four tables.
- Do not add blanket policies or blanket revocations simply to remove the lint warning. Review each table's intended access model first.

SECURITY DEFINER SYSTEM-WIDE OBSERVATION:
- Current Restore-Test has 251 public SECURITY DEFINER functions in total.
- 215 are executable by authenticated.
- 7 are executable by anon.
- 0 of the 251 definitions are missing an explicit SET search_path according to the targeted metadata check.
- A heuristic identified 16 authenticated-executable functions without an obvious auth.uid / velora_is_staff / velora_has_role token. This is a review queue, not proof of vulnerability: some are intentionally public-style reads or wrappers that delegate to guarded canonical functions.
- Therefore classification remains TARGETED REMEDIATION, not "251 vulnerabilities."

TARGETED SENSITIVE FUNCTION REVIEW:
- Inspected current definitions for payment, cart, legal, seller, product, payout, release, integration, AI-governance, localization, and order-state control functions.
- The reviewed SECURITY DEFINER functions use pinned search_path settings and explicit authentication/role checks where their action is privileged.
- High-impact writers such as seller/product/order governance, payout execution, release control, integration control, AI decision review, and legal publication include staff/owner guards as appropriate to their current contracts.
- Current payment RPCs remain authenticated-only at the Data API privilege layer where previously hardened.
- velora_publish_legal_document remains explicit Owner-only.
- velora_issue_gift_card remains explicit Owner-only.
- No second permission engine was introduced.

INTENTIONAL PUBLIC-STYLE SECURITY DEFINER CANDIDATES:
The current Advisor's seven anon-executable SECURITY DEFINER functions are all read-oriented in the inspected definitions:
- velora_get_active_seller_ads
- velora_get_fx_rate
- velora_get_i18n_catalog
- velora_get_localized_content
- velora_get_marketplace_catalog
- velora_get_required_legal_documents
- velora_list_active_promotions

OBSERVED:
- These functions are STABLE/read-style in the inspected definitions, use pinned search_path, and do not contain the normal write verbs identified by the targeted scan.
- Some are expected public marketplace reads by design (catalog, FX, active ads, active published legal documents, promotions, localization).

OPEN SECURITY REVIEW QUEUE:
- Explicitly determine whether velora_get_commission_rate(target_seller_id) should be callable by any authenticated user because it currently has auth EXECUTE without a direct auth/role guard in its definition.
- Explicitly review the small set of "no obvious auth token" authenticated functions that are not clearly public reads or guarded wrappers.
- Review the pg_net public-schema warning before any extension move; do not relocate an extension without compatibility/dependency proof.
- Review the six no-policy tables against their actual service/data-access contract before choosing a targeted policy or leaving them intentionally service-only.
- Do not treat the Advisor's raw count as the number of actionable vulnerabilities.

RESEARCH-FIRST BASIS:
- Current Supabase documentation recommends least-privilege execution grants, careful review of SECURITY DEFINER functions, pinned search paths, and RLS for exposed tables. citeturn206077search0turn206077search2turn206077search5
- Supabase security guidance explicitly describes revoking function EXECUTE case-by-case rather than default blanket revocation when public functions are intentional. citeturn206077search0turn206077search8
- OWASP authorization guidance emphasizes least privilege and deny-by-default rather than permissive defaults. citeturn206077search1

### 91. Authentication Configuration
CLASSIFICATION: OPEN FINAL READINESS ITEM

OBSERVED FACT:
- Supabase Security Advisor currently reports auth_leaked_password_protection as WARN: leaked password protection is disabled.
- Current Supabase password-auth guidance describes leaked-password protection as a security control for password-based authentication. citeturn206077search4turn206077search9
- Current project metadata confirms Restore-Test is ACTIVE_HEALTHY on PostgreSQL 17.6.1.166, but it does not expose every hosted Auth configuration switch required for final readiness review.
- Therefore final Auth configuration is NOT fully evidenced.

OPEN:
- leaked-password protection enablement/review.
- final email verification/session/password policy review.
- any final production Auth settings, redirect/origin, recovery, and sensitive-session controls required by the actual production deployment model.
- No production-readiness claim until the final Auth configuration is explicitly verified.

RULE:
- Do not infer production Auth readiness from successful login tests alone.
- Do not enable a risky production-facing Auth change on Restore-Test without understanding its user-impact contract.

### 92. Localization — Script Authority
OBSERVED FACT:
Current intended script order remains:00-localization.js -> 10-localization.js -> 12-localization.js -> 50-localization.js -> 51-localization.js -> 56-s2d-admin.js -> 63-platform-router.js

Current roles:
- 00-localization.js: legacy locale API/state and compatibility layer.
- 50-localization.js: global locale/country/currency/timezone state wrapper and server context persistence.
- 51-localization.js: V5 i18n kernel and current language mutation authority.

### 93. Localization — Current Runtime Contract
CLASSIFICATION: SOURCE-LEVEL HARDENING PRESENT / BROWSER PARITY OPEN

OBSERVED FACT:
- 51-localization.js exposes window.VELORA_V5_SET_LANGUAGE.
- Its setLang(code) validates the locale, calls paintLocale(locale) immediately, and only then starts asynchronous persistence (persistLocale) and catalog loading (loadDbCatalog).
- paintLocale() synchronously commits locale state, localStorage, document language, direction, translation rendering, and the existing locale-change events.
- Therefore the source currently satisfies the key "do not await before changing what the user sees" invariant.
- 50-localization.js loadContext() explicitly avoids calling the legacy language setter and preserves a locally chosen valid locale instead of allowing server context to overwrite a newer local choice.
- 50-localization.js still contains a compatibility setVeloraLanguage wrapper, but 51-localization.js loads after it and then assigns window.setVeloraLanguage = setLang. Thus the final loaded browser API is V5's synchronous setter.
- Existing 51-localization.js still contains a MutationObserver and render-capture compatibility mechanism. This predates Message 10; do not add another MutationObserver or refactor this architecture blindly.

IMPORTANT STATUS:
- Source-level V5 authority is OBSERVED.
- Browser/re-entry/mobile/Arabic-English runtime behavior is NOT EVIDENCED.
- The earlier proposed V5-authoritative direction should therefore be treated as "implemented at source level, Browser proof still required", not as a Browser PASS.
- Do not claim the race is fully closed until the current Browser Gate proves locale persistence and re-render behavior under realistic navigation/renders.

TARGETED BROWSER TESTS:
- EN -> AR -> EN -> refresh.
- locale switch during active Seller/Admin/Owner surfaces.
- locale switch followed by platform close/reopen.
- locale switch while dynamic HTML is rendered.
- country/currency/date locale persistence after refresh.
- language selection with signed-out and signed-in states.
- mobile/RTL layout behavior.
- no stale server-context overwrite after a new local user choice.

### 94. Season Engine
CLASSIFICATION: CLOSED-DETERMINISTIC / BROWSER BEHAVIOR OPEN

OBSERVED FACT:
- Canonical season helper is private.beauty_season_for_date(p_date).
- It maps Dec/Jan/Feb -> winter, Mar/Apr/May -> spring, Jun/Jul/Aug -> summer, Sep/Oct/Nov -> autumn.
- Current project date is 2026-09-28, so the deterministic calendar currently resolves to autumn.
- private.velora_beauty_context() uses Africa/Cairo as its time zone and derives the season from this calendar helper.
- Season is deterministic context; it is not an AI-generated output.
- No new season engine is justified.

### 95. QA Catalog
CLASSIFICATION: OBSERVED RESTORE-TEST SNAPSHOT

CURRENT approved EGP QA products:
- Test Vitamin C Serum — stock 23 — EGP 140
- QA Seed Cleanser — stock 13 — EGP 100
- QA Seed Barrier Moisturizer — stock 19 — EGP 120
- QA Seed Anti-Aging Treatment — stock 18 — EGP 160
- QA Seed SPF 50 Protect — stock 19 — EGP 100

CURRENT OBSERVED FACT:
- Exactly five approved EGP products were returned by the current QA query.
- This is a test-environment snapshot and must NOT be interpreted as the intended production catalog size or commercial assortment.

### 96. Product Image / Storage
CLASSIFICATION: OPEN / NOT EVIDENCED

CURRENT Restore-Test:
- product_images = 0
- storage.buckets = 0
- No proven canonical product-image upload RPC.

DECISION:
- Do not build Base64 storage, an arbitrary image service, a random upload API, or a second product-media model.
- Keep current HTTPS image URL contract.
- Revisit only when a real seller/customer upload requirement and a concrete Storage/RLS contract are evidenced.

### 97. Seller Shipping
CLASSIFICATION: CANONICAL FOUNDATION PRESENT

CURRENT Restore-Test:
- store shipping zones = 1
- store shipping rates = 1
- shipping carriers = 1
- shipping quotes = 0
- manual rates = 1
- Current carrier model remains velora_manual.
- Manual fulfillment is accepted as the launch model; no new carrier backend is justified by the current evidence.
- Maintain seller ownership rules and existing shipping page/RPCs.

### 98. Notifications
CLASSIFICATION: EXISTING CANONICAL SYSTEM / BROWSER DELIVERY OPEN

CURRENT Restore-Test snapshot:
- notifications = 38
- notification lifecycle jobs = 0
- push deliveries = 6
- push subscriptions = 3

RULE:
- Reuse existing notification lifecycle + push dispatcher architecture.
- Do not build another notification service or scheduler.
- Remaining Browser evidence for bell/read/push lifecycle/device behavior stays OPEN.

### 99. Financial Model
CLASSIFICATION: CANONICAL CROSS-SYSTEM CHAIN PRESENT / FULL E2E RECONCILIATION OPEN

Required conceptual chain:
Order -> Payment -> Commission -> Seller Earnings -> Payout Request -> Provider Execution -> Settlement -> Reconciliation

OBSERVED CURRENT SNAPSHOT:
- orders = 13
- payment_attempts = 36
- payments = 11
- commissions = 15
- payouts = 0
- seller_payout_items = 0
- ledger_entries = 2

RULES:
- Every stage retains its own state.
- "Payout eligible" is NOT equivalent to "paid."
- "Payment captured" is NOT equivalent to external settlement unless provider evidence proves settlement.
- Existing commission, payout, payment, ledger and webhook contracts remain authoritative.
- No new general-purpose ledger engine is justified.

OPEN:
- full browser/provider settlement proof.
- provider execution evidence for payouts.
- reconciliation drill across captured payment -> commission -> eligibility -> payout -> external execution -> ledger.
- refund/cancellation effects across financial objects.
- exceptions where provider state and local state disagree.

### 100. Promotion / Gift Card / Payment Interactions
CLASSIFICATION: CROSS-SYSTEM TESTING OPEN

Required future negative/positive matrix:
Promotion:
order creation -> discount calculation -> payment -> cancellation/refund -> redemption reversal rules

Gift Card:
redeem -> balance decrement -> payment-state relation -> cancellation/refund -> balance restoration if contract requires

Payment failure:
provider-start failure -> payment-attempt failure -> canonical inventory/order/payment/commission recovery

CURRENT SNAPSHOT:
- promotions = 0
- promotion_redemptions = 0
- gift_cards = 0
- gift_card_transactions = 0

RULE:
- Existing canonical RPC contracts define current behavior.
- Do not invent refund/reversal/accounting semantics merely to make the interaction matrix appear complete.
- Cross-system evidence must include failure handling and idempotency where applicable.
- Action Flow should automatically execute normal cross-system paths; Owner/Staff only enters genuine exceptions.

### 101. Legal / Checkout
CLASSIFICATION: CLOSED-FAIL-CLOSED CONTRACT / CONTENT READINESS OPEN

OBSERVED FACT:
- Normal checkout requires Terms of Service and Privacy Policy.
- Current applicable published legal set is absent because current legal rows are retired QA fixtures.
- Therefore checkout fails closed with the existing LEGAL_DOCUMENTS_NOT_PUBLISHED contract.
- This is intentional safety behavior, not a bug to be bypassed.
- No fake publication or "temporary" legal acceptance should be introduced.

### 102. Fraud / Trust
CLASSIFICATION: NORMAL AUTOMATED PATH + GOVERNED EXCEPTIONS

Owner/Staff human intervention is appropriate for:
- suspected fraud
- exceptional financial cases
- exceptional refunds
- account restrictions
- irreversible governance decisions

Normal transaction handling remains automated through canonical order/payment/trust/workflow contracts.

### 103. Auditability
CLASSIFICATION: ARCHITECTURE PRESENT / COVERAGE DRILL OPEN

High-impact state changes expected to remain auditable where the architecture already provides events:
- product status
- product availability
- payment transitions
- provider session binding
- webhook processing
- seller governance
- gift-card issuance
- legal publication
- financial exceptions
- suspension/account actions
- release control

OBSERVED:
- Multiple reviewed functions write explicit audit_logs records.
- audit_logs is staff-readable through the existing RLS policy.
- Do not add a second generic audit system.
- Remaining task is coverage verification: identify any high-impact canonical writer without an appropriate audit event and fix only when a real gap is proven.

### 104. Seller Advertising Accounting
CLASSIFICATION: OPEN POLICY / ACCOUNTING EVIDENCE

Still requires explicit classification of:
- campaign spend
- amount payable
- captured amount
- platform revenue
- seller earnings
- refund/reversal amount
- attribution metrics

RULE:
- Do not introduce a ledger schema just to populate a dashboard.
- Research prior marketplace advertising accounting models and inspect existing Velora payment/commission/ledger contracts first.
- Build only the smallest missing contract if an actual operational gap is proven.
- Do not assume ad campaign active means payment settled or recognized revenue.

### 105. Message 10 Action Flow — Parallel

SECURITY:
Detect Advisor finding
-> identify exposed object / intended audience
-> inspect grants
-> inspect RLS
-> inspect SECURITY DEFINER + search_path
-> inspect authorization checks
-> inspect side effects/audit
-> research current Supabase guidance
-> choose targeted remediation OR explicitly document intentional exposure
-> test
-> re-run Advisor
-> Browser Gate when UI-facing
-> recover/escalate for unresolved sensitive boundary

AUTH:
Detect auth configuration drift/readiness issue
-> compare current hosted configuration to required launch policy
-> apply only approved configuration change
-> verify login/signup/recovery/session behavior
-> verify negative/authz paths
-> record readiness evidence
-> escalate only for actual account/security policy decision

LOCALIZATION:
Detect locale change/request
-> resolve V5 locale state synchronously
-> paint locale + direction
-> persist asynchronously
-> load canonical translation catalog
-> refresh active surface
-> verify state survives navigation/refresh
-> recover to known locale without page-reload dependency

OPERATIONS:
Detect lifecycle signal
-> decide whether existing canonical automation already handles it
-> execute existing Action Flow / RPC / scheduler
-> verify resulting state
-> recover through existing idempotent path
-> Owner/Staff only on policy/financial/fraud/provider/release exception

FINANCIAL:
Detect order/payment/commercial transition
-> validate canonical order/payment state
-> apply existing promotion/gift-card/commission contracts
-> create/update payment state
-> propagate cancellation/failure/refund side effects through existing triggers
-> calculate payout eligibility only from finalized governed state
-> record payout execution only when external execution evidence exists
-> reconcile
-> escalate provider/financial mismatch to human governance

NO DUPLICATE ENGINE RULE:
- Security uses Supabase Advisor + existing DB ACL/RLS.
- Auth uses Supabase Auth + existing session/role model.
- Localization uses V5 kernel + existing global-context layer.
- Notifications use existing lifecycle/push system.
- Financials use existing order/payment/commission/payout/ledger contracts.
- Shipping uses existing manual carrier foundation.
- Promotions/gift cards use existing canonical commercial engines.
- Do not create parallel infrastructure merely to "complete" the checklist.

### Message 10 Evidence Ledger
L1 SOURCE:
- current security-sensitive database function definitions
- 50-localization.js and 51-localization.js
- current operational scripts/control surfaces

L2 DB:
- current Security Advisor findings
- public-table grants/RLS checks
- current QA catalog
- season helper
- storage/product-images state
- shipping state
- notifications state
- financial counts

L3 ACL/RLS:
- targeted SECURITY DEFINER review
- authenticated/anon EXECUTE review
- no-policy table grant review
- existing role/staff/Owner guards
- Legal/Owner and payment control boundaries carried forward

L4 NEGATIVE / TRANSACTION:
- Message 10 added no speculative mutation.
- Previous Message 8 negative-path evidence remains authoritative and carried forward.
- New unauthorized-role drills for the remaining security review queue remain OPEN.

L5 CI:
- no dedicated Message 10 CI run is claimed.
- Existing Vercel status from the Message 9 source change remains deployment signal only.

L6 PREVIEW:
- Message 9 code commit has a successful Vercel combined status.
- No new Message 10 Preview PASS is claimed because no new code change was required.

L7 BROWSER:
- NOT EVIDENCED for Security/Auth/Localization/Operations current gates.
- Browser Gate remains mandatory before claiming current runtime parity.

L8 PROVIDER:
- Payment settlement/provider evidence remains OPEN/BLOCKED from Message 8.
- Seller ad accounting/provider evidence remains OPEN.

L9 PRODUCTION:
- NOT EVIDENCED; Production Supabase remains FROZEN.
- Final Auth configuration, infrastructure, backup/rollback remain readiness work.

### Message 10 Execution Classification
CLOSED-DONE / VERIFIED:
- Targeted Security Advisor inventory established.
- No missing SET search_path found in the 251 public SECURITY DEFINER functions reviewed by the metadata heuristic.
- Known public-style anon SECURITY DEFINER candidates were inspected and are read-oriented with pinned search_path.
- Four flagged public tables have RLS enabled and no anon/authenticated table grants, so no immediate Data API exposure was established by the targeted check.
- Current V5 localization source already commits locale before awaits.
- Deterministic season engine confirmed.
- Current five-product QA EGP snapshot confirmed.
- Current zero-image/zero-bucket Storage snapshot confirmed.
- Manual shipping foundation confirmed.
- Existing notification system and current counts confirmed.
- Current financial object counts confirmed.
- Legal checkout fail-closed behavior confirmed.

OPEN / NOT EVIDENCED:
- final Auth configuration/readiness
- leaked password protection enablement/review
- targeted review of the 16 "no obvious auth guard" SECURITY DEFINER candidates
- decision for velora_get_commission_rate exposure scope
- pg_net public-schema warning review
- six no-policy table contracts
- complete high-impact audit coverage
- current Browser localization race/runtime proof
- Browser proof for Security/Auth/Operations surfaces
- seller ad accounting classification
- financial cross-system reconciliation drill
- promotion/gift-card/payment interaction drills

BLOCKED / PENDING:
- payment_provider remains BLOCKED / REQUIRED
- webhook_verification remains BLOCKED / REQUIRED
- production_infra remains PENDING / REQUIRED
- rollback_backup remains PENDING / REQUIRED
- Browser/provider tooling limitations remain carried forward

INFERRED:
- Current security posture is better treated as a finite targeted-remediation queue than as a blanket "SECURITY DEFINER = vulnerability" condition.
- The current Localization architecture already reflects the intended V5-before-await invariant at source level, but runtime/browser evidence is still needed to close the operational claim.
- The least disruptive operational path remains reuse of canonical Action Flow and existing control-plane components.

HYPOTHESIS / DISALLOWED:
- Do not claim the 251 SECURITY DEFINER warnings are 251 vulnerabilities.
- Do not claim the six no-policy tables are exposed without a grant.
- Do not claim leaked-password protection is enabled.
- Do not claim the locale race is Browser-resolved.
- Do not claim payment capture equals external settlement.
- Do not claim payout eligibility equals payout execution.
- Do not claim the QA catalog is the production assortment.
- Do not claim Product Image upload exists.
- Do not claim Browser PASS from source/DB/Vercel evidence.

### Message 10 Carry-Forward
Everything from Messages 2/11 through 9/11 remains active:
- cart canonical/legacy adapter; no cart rewrite.
- routine-to-cart adapter and Browser evidence status.
- checkout canonical path and stale visual shipping formula observation.
- manual shipping accepted; no required external carrier integration.
- inventory/variant reconciliation and failed-payment release.
- legacy order_items.status mismatch; no casual status column addition.
- abandoned pending-order/reservation policy open; no invented TTL.
- seller product lifecycle; Seller Delete prohibited.
- post-approval seller re-review policy open.
- Seller Dashboard re-entry Browser-gated.
- subscription policy/runtime/provider/browser gaps.
- ads reporting/attribution/pricing/provider/accounting gaps.
- commission policy/refund treatment.
- payout provider execution/reconciliation.
- promotions free_shipping/stacking/targeting/economics/reversal.
- gift-card refund/cancel accounting/expiry/Browser.
- returns UX/refund allocation/provider refund/window.
- notifications Browser push/delivery.
- Beauty Passport V2 / Routine / Recommendation browser evidence.
- customer Recommendation UX.
- customer Beauty AI NOT DONE / roadmap.
- Paymob Case C Browser/live sandbox completion.
- Paymob Case D webhook-failure replay/reconciliation.
- Owner Dashboard complete governance/browser/negative-path coverage.
- Legal approved/published content readiness and Browser flow.
- payment_provider and webhook_verification blocked.
- production_infra and rollback_backup pending.
- Production remains frozen.
- Research-before-build remains mandatory.
- Action Flow remains parallel.

---

# MESSAGE 11 — PAYMENTS / PAYMOB CURRENT EXECUTION STATUS
Date: 2026-09-28
Status: CONTINUE — DO NOT DECLARE LAUNCH READY

## Git / Repository Truth
- Execution branch: `audit/full-gate-2026-09-25`
- Actual remote branch HEAD: `6391ee605fdf8936f0e3d26f89319f80bc9ce582`
- Handoff-referenced SHA: `0829b58557fd551dfb9fea705f30538634234aec`
- Remote comparison: HEAD is 5 commits ahead, 0 behind.
- Those 5 commits changed only:
  - `.github/workflows/velora-paymob-sandbox-evidence.yml`
  - `evidence/paymob-sandbox-evidence.trigger`
- `CURRENT.md` on the execution branch is stale and must not be used as repository HEAD truth.
- The execution branch did not contain `docs/MASTER_EXECUTION_PLAN.md`; this copy synchronizes the canonical plan from commit `ef152646b64ed862d99459bd20a242505721f8a4` onto the execution branch rather than creating a second plan.

## Paymob Source / Runtime Reconciliation
### Checkout
- Supabase Restore-Test function: `velora-paymob-checkout`
- Runtime: ACTIVE, version 16, verify_jwt=true
- Runtime checksum: `e7e40a2ca314cbd3db765bcf71770dff8e23a78de7a481789ef7a650e4da4386`
- Runtime source length: 12,519 bytes
- Provenance snapshot source:
  `audit/runtime-parity-2026-09-28:supabase/functions/velora-paymob-checkout/index.ts`
- Snapshot blob SHA: `793df778d41fcd2af0b086dafcbc55ec289622e0`
- Exact source comparison against runtime v16: normalized source equal; no line-diff sample.
- Current execution branch does NOT contain the checkout source path.
- Classification:
  - Runtime ↔ provenance snapshot: CLOSED-DONE at L1 provenance level.
  - Current execution branch ↔ runtime parity: OPEN / NOT EVIDENCED.

### Webhook
- Supabase Restore-Test function: `velora-paymob-webhook-restore-test`
- Runtime: ACTIVE, version 27, verify_jwt=false
- Runtime checksum: `0cf2bace769549fb6184c54419a9a947487e766a47303f4a23f303cee995d1d1`
- Current execution-branch source blob: `d2271e2300283313b9a48a9d4e5ac1f41b6888f3`
- Runtime source length: 15,078 bytes
- Current execution-branch source length: 14,212 bytes
- Normalized source comparison: NOT equal.
- Runtime contains additional marketplace-order reconciliation/audit logic absent from current execution branch source, including:
  - `paymob_transaction_reconciled` audit insertion
  - current order status read before confirmation
- Classification: OPEN / NOT EVIDENCED.

## HTTP 400 RCA — CURRENT EVIDENCE
- Restore-Test `velora-paymob-checkout` logs for 2026-09-28 show 7 POST invocations, all HTTP 200.
- No HTTP 400 event for this function was found in the inspected current-day log window.
- Current exact-HEAD GitHub Actions Paymob run:
  - Run ID: `36404882172`
  - Workflow SHA: `6391ee605fdf8936f0e3d26f89319f80bc9ce582`
  - auth_http_200: true
  - authenticated_user: true
  - pending_order_found: true
  - checkout_function_http_200: true
  - paymob_intention_created: true
  - sandbox_payment_path_executed: true
  - Paymob Checkout page HTTP 200
  - payment_attempt_found: true
  - provider_payment_id_present: true
  - attempt_status: pending
  - signed_webhook_verified: false
  - processed_webhook_present: false
  - passed: false
- The final workflow failure is therefore NOT evidence of an HTTP 400. The failed gate is the missing signed/processed webhook completion evidence.
- The latest successful provider-start path created a pending Paymob session and returned a unified checkout URL.
- The current checkout source returns HTTP 502 for direct Paymob non-2xx responses; HTTP 400 in this function is reserved for request validation or the catch-all exception path (plus explicit unsupported-order/country validation). Therefore an observed frontend HTTP 400 must be tied to an exact request/body/response before root cause is assigned.
- Classification:
  - OBSERVED FACT: current Restore-Test checkout path is producing provider-start HTTP 200.
  - INFERRED: the previously reported HTTP 400 is historical/stale or belongs to a different invocation path; this is not yet proven until a concrete 400 request is captured.
  - HYPOTHESIS: none adopted as root cause.

## Paymob Provider Contract
Current checkout payload already includes the main Intention API contract fields:
- amount
- currency
- payment_methods
- items with name/amount/description/quantity
- billing_data including phone_number
- extras
- special_reference
- expiration
- notification_url
- redirection_url
Exact current-run evidence shows this payload is accepted by Paymob sandbox, so a stale/missing-field hypothesis is not supported by current evidence.

## Canonical Provider-Start Failure Action Flow
EVENT: Customer starts Paymob payment
AUTH / ROLE: authenticated customer
GUARD: EG + EGP + active card method routed to Paymob
VALIDATION: valid order + idempotency key + positive total
CANONICAL STATE: payment_attempt created/pending
AUTOMATIC SIDE EFFECTS:
- Paymob intention creation
- provider identifiers persisted/bound
- provider-start failure calls `velora_mark_marketplace_payment_initialization_failed`
- existing inventory release / commission reversal failure chain remains canonical
RECOVERY:
- successful intention + local bind/recovery issue -> existing provider-session recovery contract
- unrecoverable local binding/recovery -> pending state + reconciliation/manual exception path according to existing contract
NEXT EVENT: provider/customer completion -> webhook
WEBHOOK:
- HMAC-SHA512 verification
- correlation
- dedupe
- monotonic transition
- order/payment synchronization
- audit
No duplicate payment engine, release engine, or scheduler.

## Evidence Workflow Status
- Workflow: `.github/workflows/velora-paymob-sandbox-evidence.yml`
- Historical syntax error is no longer present in current exact-HEAD execution.
- Current exact-HEAD workflow executes through provider start and uploads evidence successfully.
- Current gate remains red only because the provider/customer completion webhook evidence is absent.
- Classification: OPEN / NOT EVIDENCED for full sandbox completion.

## Vercel Current-SHA Status
- Latest listed deployment is on `audit/runtime-parity-2026-09-28` at `ef152646b64ed862d99459bd20a242505721f8a4`, not current execution SHA `6391ee605fdf8936f0e3d26f89319f80bc9ce582`.
- No current-SHA Vercel Preview deployment was present in the latest deployment set inspected.
- Classification: PENDING / NOT EVIDENCED.

## Immediate Next Actions
1. Do not patch Paymob checkout based on the old HTTP 400 report; current evidence shows provider-start success.
2. Close current source/runtime provenance drift by choosing one canonical source path/commit and preserving the runtime v27 webhook logic before any deployment.
3. Tie any future HTTP 400 to an exact request ID/body/status/response before RCA closure.
4. Validate provider-start failure and compensation negative paths using the existing contracts.
5. Run exact-SHA CI after any source/provenance change.
6. Obtain current-SHA Preview and Browser evidence.
7. Complete signed webhook / provider completion evidence.
8. Reconcile payment/order/commission/inventory/audit after provider outcome.
9. Update launch gates only with evidence-layer-correct claims.
10. Production remains FROZEN. Supabase Pro is NOT a Paymob debugging fix and must remain a later Production Infrastructure / Backup / Rollback readiness step.

---

# MESSAGE 11.1 — PAYMOB SOURCE PARITY CLOSURE UPDATE
Recorded after source synchronization on 2026-09-28.

## Proven Source/Runtime Parity
- `velora-paymob-checkout`
  - Runtime v16
  - runtime checksum `e7e40a2ca314cbd3db765bcf71770dff8e23a78de7a481789ef7a650e4da4386`
  - branch source blob `793df778d41fcd2af0b086dafcbc55ec289622e0`
  - exact source parity verified against deployed runtime.
- `velora-paymob-webhook-restore-test`
  - Runtime v27
  - runtime checksum `0cf2bace769549fb6184c54419a9a947487e766a47303f4a23f303cee995d1d1`
  - branch source blob `8d98214fa7170c7ff1d1b7e70c655b63f3b22d74`
  - exact source parity verified against deployed runtime.
- Shared webhook HMAC helper remained unchanged and matched runtime/provenance source.
- No Supabase Edge Function was redeployed by this source-parity synchronization.

## Current Branch Changes
- Added missing canonical checkout source and `deno.json` from the verified Restore-Test runtime.
- Updated webhook source to the verified Restore-Test v27 runtime source.
- Updated the Master Plan on the execution branch.
- Added a trigger-only commit to run the Paymob sandbox evidence workflow against the synchronized source branch.

## Evidence Classification
- Source/runtime parity: CLOSED-DONE at L1 provenance level.
- Provider-start: OBSERVED successful on prior exact-HEAD run; current provider completion run remains OPEN until run `36447221162` finishes.
- Sandbox payment completion/webhook: NOT EVIDENCED.
- Current Vercel Preview for the latest execution SHA: PENDING because Vercel reports a `build-rate-limit` check failure and the latest READY deployment is `d62be049...`.
- Current local-source Browser Gate at SHA `6e79d0e...`: PASS, including authenticated source-browser checks with no console/page errors.

---

# MESSAGE 12 — THREE GOVERNING CONDITIONS + CURRENT PAYMOB EVIDENCE
Recorded 2026-09-28.

## THREE MASTER GOVERNING CONDITIONS
These remain mandatory for every Track / Phase / Gap / Research task / Fix / Verification / Future chat:

### CONDITION 1 — COMPLETE MASTER HANDOFF
Execute the entire Master Handoff from beginning to end.
No item may be forgotten, silently removed, skipped, reset, or replaced without evidence.
Closed/open/blocked/pending/not-evidenced items, dependencies, evidence requirements, policies, architectural constraints, research findings, unresolved questions, Action Flow, owners/responsibilities, historical fixes, security findings, and runtime findings remain in the Master until explicitly closed or superseded with evidence.
When an item closes: update status, preserve evidence, move to the next unresolved item.
When a new discovery appears: classify it, assign Track, record impact, owner/responsibility, evidence required, and continue the current execution lane unless genuinely blocked.

### CONDITION 2 — RESEARCH / REUSE FIRST
Do not build merely to build.
For every gap:
FIND → RESEARCH → COMPARE → REUSE / ADAPT → PROVE GAP → DEFINE CONTRACT → BUILD ONLY IF NECESSARY.
Search broadly when warranted, including prior Velora source/history, DB/RPCs/UI/runtime/deployments, official provider documentation, established marketplace patterns, engineering posts, GitHub implementations, security guidance, and relevant real-world patterns.
Prefer proven compatible approaches; adapt only what Velora actually needs.
No duplicate engines, speculative architecture, casual schema/contract changes, or rebuilds of working canonical flows.

### CONDITION 3 — ACTION FLOW IN PARALLEL
Every capability is reviewed together with its Action Flow:
EVENT → AUTH/ROLE → GUARD → VALIDATION → CANONICAL STATE TRANSITION → AUTOMATIC SIDE EFFECTS → AUDIT → RETRY/IDEMPOTENCY/DEDUPE → NEXT EVENT → RECOVER/ESCALATE ONLY WHEN NECESSARY.
Normal platform operation must be automatic.
Owner/Staff human intervention is reserved for governance, legal decisions, fraud/trust, policy decisions, financial/irreversible exceptions, provider disputes, release decisions, and genuine anomalies.

## CURRENT PAYMOB RCA UPDATE
- Run `36447221162`, SHA `b3ab770b32d2a19d69003177cdc78996dc9fb1fe`, failed only because the final completion conditions were not met.
- Observed:
  - authenticated user = true
  - pending order = true
  - checkout function HTTP 200 = true
  - Paymob intention created = true
  - sandbox payment path executed = true
  - Paymob checkout HTTP 200 = true
  - payment attempt exists and provider payment id exists
  - attempt remains pending
  - webhook count = 0
  - signed webhook verified = false
  - processed webhook = false
  - completion text = false
- The captured Paymob checkout screenshot shows the provider at: "Redirecting you to your bank for verification".
- Therefore the current failure is consistent with the automation reaching a 3DS/bank-verification step but not completing the authentication flow; this is an evidence/automation completion gap, not evidence of an Intention API 400.
- Paymob provider-start remains OBSERVED SUCCESSFUL.
- Full provider completion remains OPEN / NOT EVIDENCED.
- Do not change the payment engine or webhook engine merely to make this test green. First determine the correct current Paymob sandbox authentication/test path and whether the evidence workflow can execute it using supported test credentials/flow.

## NEXT PAYMOB ACTION
1. Research the current official Paymob sandbox 3DS/test-card completion path.
2. Compare it with the evidence workflow's current Playwright interaction.
3. Change the workflow only if a concrete test-flow mismatch is proven.
4. Re-run exact SHA evidence.
5. Verify webhook receipt, HMAC verification, monotonic state transition, order/payment synchronization, audit, inventory/commission side effects where applicable.
6. Keep all results classified by evidence layer.

---

# PAYMOB 3DS RESEARCH CLOSURE NOTE — 2026-09-28
- Official Paymob test-credentials reference confirms the workflow's Mastercard test card `5123456789012346`, expiry `01/39`, CVV `123`, is a valid sandbox card and is also the supported test path for 3DS.
- Official Paymob testing guidance states that for custom Unified Checkout, the test completes only after the backend callback is received, HMAC verifies, and the order updates; opening checkout alone is insufficient.
- Official guidance also recommends a Transaction Inquiry fallback for callback-missed/stuck-pending cases.
- Current Velora run `36447221162` reached Paymob Unified Checkout successfully and the captured page showed a bank-verification/3DS handoff.
- No signed webhook was received during the run, so the end-to-end gate remains OPEN / NOT EVIDENCED.
- No product payment code change is justified by this evidence.
- The next safe action is to improve or replace only the payment evidence harness interaction after a concrete automation mismatch is established, while preserving the canonical Velora payment/webhook engines.

---

# MESSAGE 12.1 — PAYMOB EVIDENCE-HARNESS EVENT-ID MISMATCH FINDING
Recorded 2026-09-28.

## OBSERVED FACT
The synchronized webhook source defines eventId = tx || eventType + ':' + attemptId, where tx = obj.id from the Paymob transaction callback.
The current evidence workflow post-payment poll instead takes provider_payment_id from payment_attempts and queries provider_webhook_events.event_id = provider_payment_id.
The current checkout/RPC contract populates provider_payment_id at provider-session attachment time with the Paymob Intention/session identifier when it is initially empty. The Restore-Test attempt inspected for run 36447221162 has:
- payment attempt status: pending
- provider session id: pi_test_d5e5ed2a64a243848a5399668a7bdf03
- provider payment id: pi_test_d5e5ed2a64a243848a5399668a7bdf03
- Paymob order id metadata: 620173370

Therefore the evidence workflow is not guaranteed to find a future webhook even after Paymob successfully sends one, because the workflow is filtering on the session/intention identifier while the webhook handler records the transaction identifier as event_id.

## DB CROSS-CHECK
For the run-time window inspected (2026-09-28 15:40:00Z through 16:20:00Z), Restore-Test contained zero Paymob provider_webhook_events.
Therefore this mismatch does NOT explain the absence of a webhook in run 36447221162; there was no webhook row to discover in that window.

## CLASSIFICATION
- Evidence-harness correlation bug: OPEN / VERIFIED AT L1+L2.
- Root cause of the current missing webhook: NOT ESTABLISHED.
- Provider-start failure: NOT INDICATED.
- Product payment engine change: NOT JUSTIFIED.

## ACTION FLOW IMPACT
After a real provider callback arrives, evidence polling must correlate through the canonical payment-attempt/provider-order relationship or the actual transaction identifier recorded by the webhook handler. It must not assume payment_attempts.provider_payment_id is the callback event_id.

The canonical payment state machine remains unchanged:
EVENT → AUTH → GUARD → VALIDATION → payment_attempt=pending → Paymob Intention → provider session binding → customer/3DS → webhook → HMAC → correlation/dedupe → monotonic transition → order/payment sync → audit → financial/inventory side effects.

## NEXT SAFE STEP
Change only the evidence harness correlation logic, after preserving the canonical product/payment/webhook contracts. The harness should first identify the payment attempt by the known attempt id/provider-order correlation, then inspect relevant webhook events and bind a callback transaction id only after receipt.

Do not use a newly green test as proof by itself; re-verify DB state, HMAC, order/payment transition, audit, and downstream side effects at the appropriate evidence layers.

---

# MESSAGE 12.2 — PAYMOB RECONCILIATION / PREVIEW STATUS UPDATE
Recorded 2026-09-28.

## Transaction Inquiry / Reconciliation Research
- Current official Paymob guidance requires a Transaction Inquiry fallback for callbacks that are missed and for pending transactions/reconciliation.
- Restore-Test public function inventory shows generic reconciliation infrastructure and transaction-loop functions, but no clearly dedicated Paymob Transaction Inquiry function/API adapter was found by name.
- Existing legacy function velora_process_paymob_transaction_internal already performs server-side Paymob transaction reconciliation from a callback payload, but the active v27 webhook handler currently performs its own callback reconciliation path.
- Classification: operational reconciliation fallback = OPEN / NOT EVIDENCED as a complete live Paymob inquiry flow.
- Do not create a second reconciliation engine. First determine whether the generic reconciliation infrastructure can be adapted to Paymob Transaction Inquiry, then implement only the missing adapter if a real gap is proven.

## Legacy Payment Processor Boundary
- velora_process_paymob_transaction_internal is service_role-only and has no trigger dependency that calls it in the inspected Restore-Test database.
- It is therefore a legacy/orphaned processor path relative to the active webhook handler, not a second path to activate casually.
- Classification: OPEN / LEGACY REVIEW.
- Action: dependency/reachability review and retirement decision remain open; do not delete or revive it merely for test purposes.

## Vercel Preview
- Vercel has a READY deployment for execution-branch SHA 59cae3fc97ff02ff2277ea0858ffd9e360aa6d43.
- The latest documentation/evidence update is commit 6b4fd6f925a5f70a88372feafa5185811ffa282d, which has not yet been verified by a current-SHA Vercel deployment.
- Classification: current-SHA Preview = PENDING / NOT EVIDENCED.
- The existence of the READY 59ca deployment does not promote it to current-SHA evidence.

## Governing Conditions Remain Unchanged
- Complete Master Handoff: mandatory.
- Research / Reuse First: mandatory.
- Action Flow in parallel: mandatory.
- Production remains FROZEN.

---

# MESSAGE 12.3 — PAYMOB INQUIRY / RECONCILIATION GAP CONFIRMED
Recorded 2026-09-28.

## Official Paymob Research
- Current official Paymob documentation (Last Updated August 4, 2026) states that Transaction Inquiry APIs retrieve transaction details by transaction ID, Paymob order ID, or merchant order ID and are intended as a secondary mechanism alongside callbacks.
- Official Paymob integration guidance requires Transaction Inquiry as a fallback for pending orders whose callback did not arrive, for periodic reconciliation, and for support/admin lookups.
- Inquiry uses the legacy API-key -> short-lived auth-token flow, distinct from the Intention API Secret Key flow.
- Official guidance warns that the exact merchant-order-id query shape may vary by region/account and should be confirmed from the merchant API Explorer before hardcoding.

## Velora Restore-Test Inventory
- Generic reconciliation infrastructure exists in the database: reconciliation_runs, reconciliation_findings, automation_events and related reconciliation helpers.
- Restore-Test currently has 0 reconciliation_runs, 0 open reconciliation_findings, 0 reconciliation automation_events, 0 transaction_updates, and 0 transaction_messages.
- A Paymob-specific Transaction Inquiry adapter/function was not identified in the inspected public function inventory by a dedicated Paymob inquiry/reconciliation name.
- Legacy service_role-only function velora_process_paymob_transaction_internal exists, but it is callback-payload processing rather than an Inquiry API adapter and has no inspected trigger dependency invoking it.

## Classification
- Paymob Transaction Inquiry capability: OPEN / NOT EVIDENCED.
- Existing generic reconciliation framework: PRESENT but operational execution is NOT EVIDENCED in Restore-Test.
- Need for a new scheduler: NOT PROVEN and therefore DO NOT BUILD yet.
- Need for a small Paymob Inquiry adapter: LIKELY GAP, but exact API request shape must be confirmed from the merchant account/API Explorer before contract design.

## Action Flow
Primary: customer payment -> Paymob checkout -> verified webhook -> canonical payment/order transition.
Fallback: pending payment beyond defined reconciliation window -> existing automation/reconciliation trigger -> Paymob Inquiry -> normalize provider outcome -> apply the SAME canonical payment transition contract -> audit -> idempotent downstream side effects -> close/recover finding.
Manual intervention is reserved for genuine provider/API ambiguity, financial exception, or irreversible dispute.

## Next Research / Reuse Step
Before any code or schema work, inspect the current Paymob merchant/API Explorer request shape available to the account and map its response fields onto the existing canonical payment transition logic. Do not create a second payment-status engine or scheduler.

---

# MESSAGE 12.4 — PAYMOB INQUIRY CREDENTIAL + AUTOMATION EXECUTION STATUS
Recorded 2026-09-28.

## Paymob Inquiry Credential Contract
- Official Paymob Transaction Inquiry uses API Key -> 60-minute Bearer token, separate from the Secret Key used for Intention API. The official collection explicitly identifies API_KEY/auth_token for Transaction Inquiry and instructs merchants to retrieve API Key from Paymob Dashboard -> Settings -> Account Info; the API key is the same for Test and Live mode.
- Velora source/runtime inspected for the canonical Paymob checkout path currently references PAYMOB_SECRET_KEY, PAYMOB_PUBLIC_KEY and PAYMOB_INTEGRATION_ID. No PAYMOB_API_KEY reference was found in the inspected execution-branch source/workflow search.
- Therefore the Paymob Inquiry credential is currently NOT EVIDENCED as configured in the Velora runtime.
- Do not ask the owner to paste any key into chat or commit it to GitHub. Paymob's official collection warns against committing API keys/secrets in files.

## Automation Runtime Status
- Restore-Test has exactly one active cron job: velora-notification-lifecycle (`* * * * *`, running velora_process_notification_lifecycle(100)).
- No cron job currently invokes velora_process_automation_queue, reconciliation processing, or a Paymob inquiry operation.
- Existing functions velora_process_automation_queue and velora_reconcile_automation_event are present, but automatic worker execution is NOT EVIDENCED.
- Therefore the Action Flow design is present, but the asynchronous reconciliation execution leg is NOT yet operationally proven.

## Classification
- Action Flow primary payment path: PRESENT and provider-start observed.
- Webhook completion path: OPEN / NOT EVIDENCED.
- Reconciliation automation worker: OPEN / NOT EVIDENCED.
- Paymob Inquiry API credential: BLOCKED BY CONFIGURATION / OWNER ACTION REQUIRED.
- New scheduler: NOT BUILD YET. First reuse the existing automation queue if its semantics fit; only add scheduling after proving the gap and defining ownership/idempotency/limits.

## ONLY OWNER INPUT CURRENTLY NEEDED
Do not send the Paymob API key in chat. The owner only needs to add the Paymob API Key as a secure Restore-Test Edge Function secret (for example PAYMOB_API_KEY) through the Supabase secret-management path, then report only that the secret has been added. The value itself must never be pasted into the repository, workflow, or conversation.

## Next Execution Sequence
1. Once the secret is configured, verify its presence indirectly through a safe authenticated Inquiry test; do not expose the secret.
2. Define the minimum Paymob Inquiry adapter contract against the official endpoint and existing payment-attempt identifiers.
3. Reuse the existing reconciliation/automation data model where possible.
4. Prove the reconciliation trigger/worker semantics before creating any cron job.
5. Add the smallest scheduling/adapter change only if the existing infrastructure cannot deliver the required automatic recovery.
6. Re-run Paymob evidence with corrected webhook correlation and verify the full Action Flow at each evidence layer.


---

# MESSAGE 12.5 — PAYMOB INQUIRY ADAPTER / CREDENTIAL CONFIGURATION UPDATE
Recorded 2026-09-28.

## Owner Configuration
- OWNER INPUT: COMPLETE.
- The owner confirmed that `PAYMOB_API_KEY` was added to the Restore-Test Supabase Edge Function secret store.
- The secret value is not stored in GitHub, workflow source, or this plan and must never be pasted into chat.
- Because the available Supabase management surface exposes deployment details but no secret-value listing or Edge Function invocation primitive, secret runtime validity is not yet promoted to a provider-auth PASS.

## Research / Reuse Result
- Official Paymob documentation confirms the secondary Transaction Inquiry flow uses API Key -> short-lived bearer token, followed by transaction inquiry by Paymob order ID or merchant order ID.
- The canonical Velora checkout already persists Paymob's order identifier in `payment_attempts.metadata.paymob_order_id`.
- Existing generic reconciliation tables/functions exist, but the active webhook currently owns the canonical provider-callback transition and the older `velora_process_paymob_transaction_internal` is a legacy service-role-only path with materially different event/audit/read-model behavior.
- Therefore no scheduler, second payment-state engine, or legacy processor revival was justified at this stage.

## Smallest Safe Build
- Added `supabase/functions/velora-paymob-inquiry-restore-test/index.ts`.
- Added `supabase/functions/velora-paymob-inquiry-restore-test/deno.json`.
- The adapter is deployed in Restore-Test as `velora-paymob-inquiry-restore-test`, version 1, ACTIVE, `verify_jwt=true`.
- GET performs a non-secret-bearing Paymob credential/auth-token smoke check and returns only redacted status metadata.
- POST requires an authenticated user and a customer-owned marketplace payment attempt, resolves the existing `paymob_order_id`, obtains a Paymob bearer token from `PAYMOB_API_KEY`, and calls the documented `/api/ecommerce/orders/transaction_inquiry` endpoint.
- The current adapter is intentionally READ-ONLY at this stage: it proves the Paymob Inquiry transport/credential contract without duplicating the payment state machine.

## Classification
- Owner secret configuration: CLOSED-DONE as owner action; provider credential validity = NOT EVIDENCED until the deployed adapter is invoked successfully.
- Paymob Inquiry adapter: SOURCE/DEPLOYMENT PRESENT; provider execution = NOT EVIDENCED.
- Canonical inquiry -> payment state transition integration: OPEN / REUSE-FIRST DESIGN GAP.
- Reconciliation worker / pending-payment automatic trigger: OPEN / NOT EVIDENCED.
- New scheduler: NOT YET JUSTIFIED AS A CODE CHANGE until the queue/detection contract and automatic execution window are defined.

## Action Flow — Current State
Primary:
EVENT -> AUTH -> GUARD -> VALIDATION -> payment_attempt=pending -> Paymob Intention -> provider session -> customer/3DS -> HMAC webhook -> dedupe -> monotonic transition -> order/payment sync -> audit -> financial/inventory side effects.

Fallback under construction:
PENDING PAYMENT BEYOND A DEFINED RECONCILIATION WINDOW -> identify canonical payment attempt / Paymob order ID -> Transaction Inquiry -> normalize provider result -> APPLY THE SAME CANONICAL PAYMENT TRANSITION -> audit/idempotent side effects -> close/recover -> human escalation only for provider ambiguity or financial exception.

No automatic fallback trigger is claimed yet.

## Evidence
- L1 source: inquiry adapter committed on the execution branch.
- L1/L2 deployment: Restore-Test Edge Function version 1 ACTIVE, `verify_jwt=true`.
- Provider/L8 inquiry execution: NOT EVIDENCED because the current tool surface has no direct Edge Function invocation and network access from the local execution environment is unavailable.
- Production: unchanged and FROZEN.

## Next Safe Execution Order
1. Preserve the inquiry adapter and do not let it become a second reconciliation engine.
2. Consolidate/identify a single reusable Paymob transaction-state applicator so both verified webhook and inquiry fallback can use the same state transition semantics.
3. Reuse the existing automation/reconciliation tables and trigger model; prove exactly which events are already immediate versus which require periodic detection.
4. Define the stale-pending reconciliation window, bounded batch size, idempotency/dedupe behavior, and service identity before adding any scheduler.
5. Only then add the smallest automatic worker/schedule needed to close the proven gap.
6. Rerun the Paymob sandbox evidence path with corrected webhook correlation and verify L1-L8 separately.


---

# MESSAGE 12.6 — PAYMOB SHARED TRANSACTION APPLICATOR + EVIDENCE HARNESS STATUS
Recorded 2026-09-28.

## Shared Canonical Transaction Transition
CLASSIFICATION: L1/L2 SOURCE + DB CONTRACT CLOSED; LIVE PROVIDER EVIDENCE OPEN

OBSERVED FACT:
- A single service-role-only DB function now exists:
  `public.velora_apply_paymob_marketplace_transaction(uuid,text,text,text)`
- The function validates:
  - service-role execution
  - marketplace_order payment purpose
  - Paymob provider binding
  - existing Paymob order correlation
  - allowed normalized transaction states
- It applies a monotonic payment transition:
  pending / requires_action / authorized / captured / failed / refunded / cancelled
- It synchronizes the canonical marketplace order/payment read models and preserves the existing failed-payment trigger chain.
- Repeated same-state/same-transaction application returns `changed=false` and does not create a second reconciliation audit event.
- Migration:
  `supabase/migrations/20260928195500_paymob_marketplace_transaction_applicator.sql`
- Restore-Test migration application succeeded.
- Migration source is committed on the execution branch.

## Webhook Reuse
OBSERVED FACT:
- Restore-Test Paymob webhook is now deployed as version 29 and calls the shared applicator for the `marketplace_order` domain.
- Subscription and seller-ad branches remain on their existing canonical paths.
- Exact Git source/runtime comparison for webhook version 29 is equal:
  - Git source bytes: 12,862
  - deployed runtime bytes: 12,862
  - exact content equality: true
  - runtime remains `verify_jwt=false` because Paymob HMAC authenticates the external callback inside the function.

## L4 Transaction-Safe Verification
OBSERVED FACT:
- Captured simulation on a pending Paymob marketplace attempt changed the order to:
  - status = confirmed
  - payment_status = paid
- Failed simulation changed:
  - payment_attempt = failed
  - order = cancelled
  - order payment_status = failed
- Failed simulation also exercised the existing inventory-release trigger:
  - product stock 18 -> 19 inside the transaction
- Duplicate captured application returned:
  - status = captured
  - changed = false
- Every mutation test was performed inside a transaction and rolled back.
- Follow-up database read confirmed the real Restore-Test state returned to:
  - payment_attempt = pending
  - original Paymob provider_payment_id preserved
  - order = pending / payment pending

CLASSIFICATION:
- Shared transition contract: CLOSED-DONE at L1-L4.
- Provider settlement: NOT EVIDENCED.
- Production: FROZEN.

## Evidence Harness Correlation
OBSERVED FACT:
- The previous harness incorrectly correlated webhook events by `payment_attempts.provider_payment_id`, which initially stores the Paymob Intention/session identifier.
- The active webhook records `event_id` from the Paymob transaction identifier.
- A targeted workflow patch was attempted, but the intermediate version introduced malformed duplicated Python indentation/code.
- That malformed workflow was immediately replaced with the last known valid workflow version before any green-result claim was made.
- Current execution branch therefore has a VALID workflow, but the original event-id correlation behavior remains OPEN and is not yet promoted to fixed evidence-harness behavior.
- No product payment runtime was weakened or changed to accommodate the CI harness.

## Vercel / Preview
OBSERVED FACT:
- The latest execution-branch commits currently report a Vercel `build-rate-limit` failure status.
- Latest READY deployment currently observed is still for commit `37f110c532973260136d4a64d8fa86ffb52321eb`, the earlier Inquiry-adapter source commit.
- No current READY Vercel deployment for the latest execution-branch commit is evidenced at this point.
- This is deployment/platform evidence, not Browser evidence and not proof that the payment backend is broken.

## Paymob Inquiry Status
OBSERVED FACT:
- `PAYMOB_API_KEY` was configured as a Restore-Test Edge Function secret by Owner action.
- Inquiry adapter exists and is ACTIVE version 1 with `verify_jwt=true`.
- The available tool surface cannot directly invoke the deployed Edge Function and the local runtime environment has no outbound DNS/network path, so provider-auth/inquiry HTTP execution is NOT EVIDENCED.
- No secret value was exposed.

## Action Flow — Updated
PRIMARY:
EVENT -> AUTH -> GUARD -> VALIDATION -> payment_attempt=pending -> Paymob Intention -> provider binding -> customer/3DS -> verified HMAC webhook -> dedupe -> shared transaction applicator -> order/payment synchronization -> audit -> existing financial/inventory side effects.

FALLBACK:
PENDING BEYOND DEFINED RECONCILIATION WINDOW -> identify payment_attempt + Paymob order ID -> Transaction Inquiry -> normalize provider result -> SAME shared transaction applicator -> audit/idempotent side effects -> close/recover -> Owner/Staff only for genuine provider ambiguity/financial exception.

AUTOMATION:
- Immediate trigger/reconciliation actions already occur for relevant payment/reconciliation events.
- Periodic stale-pending detection is still NOT EVIDENCED.
- No scheduler has been added.
- The next step is to define the reconciliation window and prove the existing automation execution contract before any scheduler change.

## Current Classification
CLOSED-DONE:
- Owner secret configuration action complete.
- Paymob Inquiry adapter source/deployment foundation.
- Shared marketplace transaction-state applicator.
- Webhook runtime uses shared applicator.
- L4 captured/failed/duplicate transition behavior with rollback.
- Existing failed-payment inventory recovery remains canonical.

OPEN / NOT EVIDENCED:
- Current provider Inquiry HTTP success/auth evidence.
- Full customer 3DS/browser completion.
- Current CI webhook-correlation fix.
- Periodic stale-pending detector and automatic reconciliation worker.
- Full cross-system payment -> commission -> inventory -> audit reconciliation after a real provider outcome.
- Current-SHA Vercel READY Preview.
- Browser Gate.

BLOCKED / PENDING:
- `payment_provider` launch gate = BLOCKED / REQUIRED.
- `webhook_verification` launch gate = BLOCKED / REQUIRED.
- `production_infra` = PENDING / REQUIRED.
- `rollback_backup` = PENDING / REQUIRED.
- Browser automation provider/tooling limitations remain carried forward.

NEXT EXECUTION ORDER:
1. Preserve the valid workflow and do not claim its correlation bug is fixed until a clean commit can be produced and CI proves it.
2. Complete a real Provider/L8 Inquiry execution path using the configured secret, without exposing the secret.
3. Research and define the stale-pending reconciliation window from the existing Paymob checkout expiration/callback contract and established reconciliation practice.
4. Prove the existing automation worker semantics and service identity.
5. Only if a concrete scheduling gap remains, implement the smallest automatic scheduler/worker.
6. Re-run the Paymob sandbox path and verify Browser/provider/database/audit/financial effects separately.
7. Keep all earlier Master Handoff items active in parallel; nothing in Messages 2/11 through 12.5 is removed by this message.

## THREE MASTER GOVERNING CONDITIONS
1. COMPLETE MASTER HANDOFF — unchanged and mandatory.
2. RESEARCH / REUSE FIRST — unchanged and mandatory.
3. ACTION FLOW IN PARALLEL — unchanged and mandatory.


---

# MESSAGE 12.7 — PAYMOB APPLICATOR ACL HARDENING + CURRENT RUNTIME CHECK
Recorded 2026-09-28.

## New Security Finding
CLASSIFICATION: OBSERVED FACT -> CLOSED-DONE

OBSERVED FACT:
- Initial ACL verification of the new shared Paymob transaction applicator reported EXECUTE=true for anon/authenticated despite the explicit revoke from those roles.
- Root cause was grant inheritance from PostgreSQL PUBLIC; revoking only from anon/authenticated did not remove PUBLIC execute.
- No customer-facing runtime invocation of the applicator was promoted from this intermediate state.
- The concrete fix was:
  `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated`
  followed by:
  `GRANT EXECUTE ... TO service_role`
- Hardening migration:
  `supabase/migrations/20260928200000_harden_paymob_transaction_applicator_execute.sql`
- Restore-Test migration application succeeded.
- Final ACL verification:
  - PUBLIC execute = false
  - anon execute = false
  - authenticated execute = false
  - service_role execute = true
- SECURITY DEFINER remains enabled with pinned search_path.

## Security / Action Flow Impact
Authorization:
EVENT -> backend service invocation -> service-role guard -> input validation -> canonical transaction transition -> order/payment synchronization -> existing triggers -> audit.

The browser/customer roles cannot execute the internal applicator directly.
No new permission engine was introduced.

## Runtime / Evidence Check
OBSERVED FACT:
- Paymob webhook runtime version 29 remains ACTIVE and its deployed index.ts exactly matches the execution-branch source.
- The shared applicator transaction tests remain rollback-only:
  - captured -> confirmed/paid
  - failed -> cancelled/failed
  - failed-payment inventory release exercised
  - duplicate -> changed=false
- Provider/L8 execution remains NOT EVIDENCED.
- Current Inquiry Edge Function invocation remains NOT EVIDENCED.
- Function log query for the latest checked window returned no invocation rows for the Inquiry or v29 webhook functions.

## Evidence Harness Status
- Current workflow source has been restored to the last known valid version after the intermediate malformed correlation patch was reverted.
- The known correlation issue remains OPEN: the valid workflow still historically filters webhook evidence by `provider_payment_id`, while the webhook event_id is transaction-based.
- No green CI claim is made from the attempted patch.
- Vercel still does not show a current execution-branch READY deployment in the latest inspected list and reports `build-rate-limit` failure status for current-branch checks.

## Next Safe Execution
1. Keep the shared applicator as the sole marketplace state-transition contract.
2. Use the configured Inquiry adapter only as a read/fallback boundary until Provider/L8 invocation evidence exists.
3. Resolve the CI correlation mismatch with a clean, validated workflow source change before relying on the evidence gate.
4. Define stale-pending reconciliation timing and worker semantics from the existing checkout expiration/callback contract and prior art.
5. Only then implement an automatic reconciliation worker/schedule if the existing infrastructure cannot satisfy the Action Flow.
6. Continue every Master Handoff item in parallel.

## THREE MASTER GOVERNING CONDITIONS
1. COMPLETE MASTER HANDOFF — every prior item remains active unless explicitly closed with evidence.
2. RESEARCH / REUSE FIRST — find, research, compare, reuse/adapt, prove the gap, then build only what is justified.
3. ACTION FLOW IN PARALLEL — normal operation automatic; human intervention only for genuine governance/legal/fraud/trust/provider/financial/release exceptions.


---

# MESSAGE 12.8 — PAYMOB FALLBACK WINDOW RESEARCH + AUTOMATION BOUNDARY
Recorded 2026-09-28.

## External / Prior-Art Research
OBSERVED FACT:
- Paymob's current documentation states:
  - Transaction Processed Callbacks are the primary server-side mechanism for transaction updates.
  - Transaction Inquiry APIs are for manual checks or as a fallback when a callback is missed.
  - Callback payloads expose `id` as the transaction ID and `order.id` as the Paymob order identifier used for correlation.
- Official Paymob API collections expose Transaction Inquiry by transaction ID, order ID, or merchant order ID.
- Current Velora checkout sends `expiration: 3600` when creating the Paymob intention, meaning the payment intention lifetime is 1 hour unless otherwise changed.
- Independent established payment-platform documentation similarly treats webhooks as the normal real-time path and secondary reconciliation/status APIs as gap detection/recovery tools; this supports the architecture choice but does not establish a Paymob callback SLA.

## Restore-Test Data Evidence
OBSERVED FACT:
- Current Restore-Test has 37 Paymob marketplace payment attempts in `pending/requires_action/authorized`.
- 36 are older than 60 minutes.
- 35 are older than 70 minutes.
- The oldest currently active pending-like attempt is from 2026-09-27 05:46:31 UTC.
- These records include historical test activity, so they are NOT safe to mass-process merely because they are old.

## Proposed Eligibility Contract — NOT YET ACTIVE
INFERRED / DESIGN PROPOSAL:
- Candidate window should begin only after the existing Paymob intention expiration (60 minutes) plus a small operational grace period.
- A 70-minute threshold is currently a design proposal, not a provider SLA.
- Candidate eligibility should additionally require:
  - marketplace_order purpose
  - active Paymob provider
  - order still payment_pending
  - Paymob order ID bound in payment metadata
  - payment attempt still in a non-terminal state
  - no already-processed matching provider webhook
  - bounded batch size
  - deterministic idempotency / lease semantics
- Historical Restore-Test fixtures should be excluded from any first automatic-run cohort unless explicitly marked as eligible by the new contract.

## Existing Automation Infrastructure
OBSERVED FACT:
- Restore-Test already has `pg_cron` 1.6.4, `pg_net` 0.20.4, and Vault available.
- Exactly one active cron job currently exists:
  `velora-notification-lifecycle` every minute.
- No Paymob reconciliation cron or worker currently exists.
- Existing `automation_events`, `automation_alerts`, reconciliation tables, and immediate trigger paths remain in place.
- The current automation queue processor is staff-only and is therefore not a suitable unattended worker boundary without a deliberate service-identity design.

## Architectural Decision
CLOSED-DONE:
- Do not create another queue framework.
- Do not revive the legacy `velora_process_paymob_transaction_internal` callback processor.
- Do not create a duplicate payment state machine.
- Keep the shared marketplace transaction applicator as the canonical state-transition boundary.

OPEN:
- Define automatic worker identity and secure provider-credential access.
- Define candidate leasing/bounded processing and retry semantics.
- Define whether the existing cron can safely host the new worker or whether a dedicated cron entry is required.
- Define financial/inventory side-effect ordering for inquiry-driven state changes.
- Obtain actual Provider/L8 Inquiry execution evidence.

## Security Boundary
OBSERVED FACT:
- The shared applicator is now service-role-only:
  PUBLIC=false, anon=false, authenticated=false, service_role=true.
- Its security-definer search path is pinned.
- The existing webhook runtime v29 exactly matches the execution-branch source.

## Action Flow — Fallback
EVENT:
payment remains non-terminal after intention expiry + grace.

AUTH/ROLE:
internal reconciliation worker only.

GUARD:
marketplace purpose + Paymob provider + payment-pending order + bound Paymob order ID + non-terminal attempt + no processed matching callback.

VALIDATION:
provider inquiry response must correlate to the same Paymob order/reference and return a recognized provider state.

CANONICAL STATE TRANSITION:
shared `velora_apply_paymob_marketplace_transaction`.

AUTOMATIC SIDE EFFECTS:
existing order/payment model sync + existing payment-failure inventory automation + existing audit/event triggers.

AUDIT:
record reconciliation source as inquiry and preserve provider transaction identifier.

RETRY/IDEMPOTENCY:
same state/reference must be safe to repeat; terminal states must not regress.

NEXT EVENT:
captured/failed/refunded/terminalized -> downstream commerce/financial events; unresolved/ambiguous -> controlled alert/escalation.

RECOVER/ESCALATE:
human involvement only for provider ambiguity, financial mismatch, fraud/trust concern, or repeated provider failure.

## Current Status After Message 12.8
CLOSED-DONE:
- Paymob Inquiry transport foundation.
- Shared payment transition contract.
- Webhook uses shared marketplace applicator.
- Applicator ACL hardening.
- L4 transaction-safe transition and inventory side-effect tests.

OPEN / NOT EVIDENCED:
- Provider/L8 Inquiry invocation.
- Automatic stale-pending worker.
- Secure unattended worker identity.
- Exact callback-correlation fix in the sandbox evidence harness.
- Current-SHA Vercel READY deployment.
- Full browser/provider payment completion.

BLOCKED / PENDING:
- Paymob provider launch gate BLOCKED / REQUIRED.
- Webhook verification gate BLOCKED / REQUIRED.
- Production infrastructure PENDING / REQUIRED.
- Rollback/backup PENDING / REQUIRED.
- Browser automation funding/tooling limitation carried forward.

## THREE MASTER GOVERNING CONDITIONS
1. COMPLETE MASTER HANDOFF — nothing is dropped or silently superseded.
2. RESEARCH / REUSE FIRST — no build without a proven gap and contract.
3. ACTION FLOW IN PARALLEL — automation is the default; Owner/Staff only handle genuine exceptions and governance decisions.


---

# MESSAGE 12.9 — INTERNAL CRON PRIOR ART + AUTH PLAN DEPENDENCY
Recorded 2026-09-28.

## Velora Existing Automation Prior Art
OBSERVED FACT:
- `src/api/cron/notifications.js` is an existing Vercel server-side cron handler.
- It authenticates requests with `Authorization: Bearer <CRON_SECRET>`.
- It uses `SUPABASE_SERVICE_ROLE_KEY` only on the server to call canonical Supabase RPCs.
- This is the established Velora pattern for unattended server-side execution and should be reused as the reference contract for any future automated payment reconciliation worker.

## Vercel Cron Topology
OBSERVED FACT:
- `src/vercel.json` currently declares one Vercel cron:
  `/api/cron/notifications` at `0 5 * * *`.
- Restore-Test Supabase currently has a separate Postgres cron:
  `velora-notification-lifecycle` every minute.
- These schedules are environment-specific and therefore are not treated as a bug without deployment/environment mapping evidence.
- A new Paymob reconciliation schedule should not be added to Vercel merely because an existing cron exists; the payment recovery cadence needs to be aligned with the Paymob intention expiry contract.

## Current Platform Constraint
OBSERVED FACT:
- Supabase organization backing Restore-Test is on the Free plan.
- Supabase's current documentation states leaked password protection is available on Pro and above.
- Therefore the existing `auth_leaked_password_protection` advisor warning is a plan-gated Owner action, not a code defect.
- Production infrastructure and rollback/backup planning already require a future plan decision in the Master.

## Automation Architecture Decision
INFERRED / DESIGN:
- For the eventual Paymob fallback worker, reuse the existing unattended-auth pattern rather than creating a new queue framework:
  - scheduled invocation
  - server-only credential
  - bounded candidate selection
  - Transaction Inquiry
  - canonical shared transaction applicator
  - audit/idempotent side effects
  - explicit retry/ambiguity path
- Supabase Cron is a technically suitable scheduler because the platform supports Postgres cron jobs and Edge Function invocation via pg_net; current Restore-Test already has both pg_cron and pg_net installed. citeturn688447search0turn688447search1turn688447search9
- A final scheduler choice is still OPEN because the provider credential currently exists as an Edge Function secret while unattended scheduler credentials would need a secure server/Vault boundary.

## Provider Contract
OBSERVED FACT:
- Paymob explicitly states Transaction Processed Callbacks are the primary mechanism and Transaction Inquiry is the fallback for a missed callback. citeturn456428search0turn456428search1
- Velora's checkout intention currently uses `expiration: 3600`, so one hour is the concrete provider-side lifetime currently encoded in source. citeturn456428search2
- A 70-minute fallback threshold remains a proposal only; it is not a Paymob SLA.

## Current Status
CLOSED-DONE:
- Internal automated-auth prior art identified.
- Supabase Cron/pg_net capability verified in Restore-Test.
- Provider expiry and fallback roles documented.
- Leaked-password protection dependency classified as Owner/plan-gated.

OPEN:
- Secure unattended worker credential boundary.
- Exact stale-pending threshold/grace.
- Candidate lease/idempotency semantics.
- Final scheduler placement.
- CI webhook correlation fix.
- Provider/L8 Inquiry execution.
- Browser/3DS completion evidence.
- Current-SHA Vercel deployment.

## THREE MASTER GOVERNING CONDITIONS
1. COMPLETE MASTER HANDOFF — no dropped item and no silent supersession.
2. RESEARCH / REUSE FIRST — existing Velora automation/auth and proven provider patterns are preferred before new implementation.
3. ACTION FLOW IN PARALLEL — every new worker must close the complete event/state/audit/retry/recovery loop automatically, with human intervention limited to genuine exceptions.


---

# MESSAGE 12.10 — SECURITY ADVISOR SAMPLE CLASSIFICATION
Recorded 2026-09-28.

OBSERVED FACT:
- The current Supabase Security Advisor still reports:
  - 6 RLS-enabled tables without policies.
  - pg_net installed in public schema.
  - 7 anon-callable SECURITY DEFINER functions.
  - 215 authenticated-callable SECURITY DEFINER functions.
  - leaked-password protection disabled.
- A targeted sample of the 7 anon-callable functions is read-oriented:
  `velora_get_active_seller_ads`,
  `velora_get_fx_rate`,
  `velora_get_i18n_catalog`,
  `velora_get_localized_content`,
  `velora_get_marketplace_catalog`,
  `velora_get_required_legal_documents`,
  `velora_list_active_promotions`.
- A targeted sample of write-capable SECURITY DEFINER functions is not anon-executable and contains staff/owner authorization checks:
  `velora_admin_update_order_status`,
  `velora_record_payout_execution`,
  `velora_set_seller_status`,
  `velora_set_store_status`,
  `velora_update_automation_alert`,
  `velora_upsert_legal_document`.
- Therefore the advisor count is not being treated as proof that all 222 exposed SECURITY DEFINER functions are vulnerabilities.

CLASSIFICATION:
- Public read SECURITY DEFINER sample: INTENDED / KEEP UNDER REVIEW.
- Privileged write sample: GUARDED / KEEP; no bulk revoke.
- Remaining SECURITY DEFINER inventory: OPEN / requires function-by-function contract review, not mechanical remediation.
- RLS no-policy findings: OPEN; determine whether tables are intentionally private/internal before changing policies.
- pg_net-in-public: OPEN; do not move because existing cron/network behavior depends on it until a safe migration path is proven.
- leaked-password protection: BLOCKED BY CURRENT SUPABASE FREE PLAN; Owner/plan action later.

THREE MASTER GOVERNING CONDITIONS:
1. COMPLETE MASTER HANDOFF.
2. RESEARCH / REUSE FIRST.
3. ACTION FLOW IN PARALLEL.


---

# MESSAGE 12.11 — PAYMOB AUTOMATED RECONCILIATION WORKER LIVE IN RESTORE-TEST
Recorded 2026-09-28.

## Implemented Contract
CLOSED-DONE:
- Added internal reconciliation state table: \`private.paymob_reconciliation_state\`.
- Added service-role-only secret validation wrapper using Vault.
- Added private claim/lease function plus public service-role-only RPC wrapper.
- Added private result/retry function plus public service-role-only RPC wrapper.
- Added explicit \`paymob_reconciliation_eligible=true\` metadata only when a NEW marketplace payment attempt is routed to Paymob.
- Historical attempts without this marker remain excluded from automatic reconciliation.
- Claim window is 70 minutes after attempt creation. This remains a Velora design contract, not a Paymob SLA.
- Maximum batch is 5 at worker runtime; database contract caps at 10.
- Lease is 10 minutes.
- Retry policy is bounded to 3 inquiries with 15m, then 30m delays; exhausted cases create an existing \`reconciliation_finding\` automation event and existing automation alert path.
- Terminal provider states use the existing canonical \`velora_apply_paymob_marketplace_transaction\` applicator. No second payment state machine was created.
- Provider correlation requires Paymob response \`order.id\` to equal the locally bound Paymob order ID.
- Terminal state requires a provider transaction ID; otherwise the result is treated as ambiguous.

## Scheduler / Secrets
CLOSED-DONE:
- Restore-Test Vault now contains \`velora_paymob_reconciliation_secret\`; the actual value is never committed or logged.
- Restore-Test pg_cron job \`velora-paymob-reconciliation\` runs every 5 minutes and invokes the Edge Function through pg_net.
- Edge Function \`velora-paymob-reconciliation-restore-test\` is ACTIVE, current version 4, custom-secret protected (\`verify_jwt=false\` because authentication is deliberately implemented by the worker secret + service-role validation).
- Runtime checksum for current v4 is \`825c60777db0271d4138b8236dbba546cf6940770e17a966bd9c6e04a943e9c2\`.

## Runtime Evidence
OBSERVED FACT:
- A real pg_net invocation reached Edge Function v4 successfully after the claim-wrapper fix and returned HTTP 200 with:
  \`ok=true, claimed=0, processed=0\`.
- Restore-Test currently has 0 marketplace attempts carrying the new eligibility marker, so no historical fixture was processed.
- A prior worker v1/v2/v3 series produced real 500s; the issue was isolated to the claim RPC contract and corrected. These are historical failed attempts, not current worker status.
- Unauthorized negative test request was sent but its response was not linked to the final request ID in the captured window; therefore unauthorized rejection is NOT EVIDENCED yet.
- Provider/L8 Inquiry execution for an eligible candidate is still NOT EVIDENCED because there is currently no eligible Restore-Test candidate.

## Action Flow
EVENT:
non-terminal Paymob marketplace attempt beyond the 70-minute reconciliation window.

AUTH:
internal worker secret -> service-role DB client.

GUARD:
explicit eligibility marker + Paymob provider + marketplace purpose + payment pending + bound Paymob order ID + no processed callback + bounded retry state.

VALIDATION:
Inquiry response HTTP success + exact Paymob order correlation + recognized provider state + transaction ID for terminal transitions.

CANONICAL STATE TRANSITION:
\`velora_apply_paymob_marketplace_transaction\`.

AUTOMATIC SIDE EFFECTS:
existing order/payment synchronization, existing failure/inventory trigger chain, existing audit/event automation.

AUDIT:
every inquiry result is recorded in \`audit_logs\`; exhausted ambiguity/failure emits existing reconciliation automation event/alert.

RETRY/DEDUPE:
per-attempt lease, unique reconciliation state, bounded 3-attempt retry, terminal states no-op/regression-safe through canonical applicator.

NEXT EVENT:
terminal result -> normal downstream order/payment/financial flow.
still pending/ambiguous -> delayed retry.
exhausted/ambiguous provider state -> automated alert for genuine exception.

## Remaining OPEN / NOT EVIDENCED
- L8 live provider Inquiry on a NEW eligible candidate.
- Unauthorized worker negative-path response tied to a request ID.
- Current-SHA Vercel READY deployment.
- Browser/3DS completion.
- Exact CI sandbox webhook correlation fix.

## Governing Conditions
1. COMPLETE MASTER HANDOFF — every closed/open/blocked/pending/not-evidenced item remains in this single Master.
2. RESEARCH / REUSE FIRST — existing Velora cron/auth/automation/applicator patterns are reused.
3. ACTION FLOW IN PARALLEL — normal reconciliation is automatic; Owner/Staff intervene only for provider ambiguity, financial mismatch, fraud/trust, or genuine anomalies.


---

# MESSAGE 12.12 — PAYMOB RECONCILIATION WORKER PARITY + NEGATIVE AUTH VERIFIED
Recorded 2026-09-28.

## Runtime / Source Parity
CLOSED-DONE:
- \`velora-paymob-reconciliation-restore-test\` is ACTIVE, version 5.
- Runtime checksum: \`6e664d4a9c45bc0818d4dc908d334c5ecca53190e5d4bb85f7714ad1ea0316d2\`.
- Git source and deployed runtime \`index.ts\` are now byte-for-byte equal:
  Git blob SHA \`76c22dc0404ba07c0e552daf9a71873fed554a81\`;
  Git length = runtime length = 6,954 bytes;
  exact_source_equal = true.
- The prior runtime/source formatting mismatch was corrected by syncing the committed source to the actual deployed runtime bytes. Logic was not redesigned.

## Runtime / Negative Path Evidence
CLOSED-DONE:
- Real pg_net request 112 using the Vault-backed worker secret returned HTTP 200:
  \`{"ok":true,"claimed":0,"processed":0,"results":[]}\`.
- Real pg_net request 113 using an invalid secret returned HTTP 401:
  \`{"ok":false,"code":"UNAUTHORIZED"}\`.
- Both results were verified using their exact \`net._http_response.id\` values in a separate transaction after pg_net asynchronous processing.
- This proves the worker's scheduler transport, secret authentication, claim path, and no-candidate safe exit in Restore-Test.
- This is NOT L8 provider evidence because no newly-created eligible payment attempt currently exists.

## Safety / Historical Fixture Protection
CLOSED-DONE:
- Current Restore-Test eligible-attempt count is 0.
- Historical Paymob attempts without \`paymob_reconciliation_eligible=true\` are not selected by the worker.
- A rollback-only canonical payment-attempt creation test left 0 rows with the test idempotency key after rollback.

## Security Advisor
CLOSED-DONE:
- Latest targeted Security Advisor scan did not identify the new reconciliation worker functions as a finding.

## Remaining OPEN / NOT EVIDENCED
- Create one genuinely NEW Paymob marketplace payment attempt through the real checkout route so the eligibility marker and Paymob order ID exist naturally.
- Run the automated worker against that fresh eligible candidate and capture L8 Provider Inquiry evidence.
- Retain Browser/3DS completion as separate evidence; current worker runtime pass does not imply payment completion.
- Exact CI sandbox webhook-correlation correction remains OPEN.
- Current-SHA Vercel READY deployment remains OPEN.

## Governing Conditions
1. COMPLETE MASTER HANDOFF — no dropped item.
2. RESEARCH / REUSE FIRST — existing Velora scheduler/auth/automation/applicator patterns are reused.
3. ACTION FLOW IN PARALLEL — normal payment reconciliation is automatic; humans handle only genuine provider/financial/fraud/governance exceptions.


---

# MESSAGE 12.13 — PAYMOB E2E CORRELATION FIX + REAL FRESH ATTEMPTS
Recorded 2026-09-28.

## Run #31 RCA
OBSERVED FACT:
- Paymob sandbox evidence Run #31 = \`36457496683\`, workflow SHA \`73f498d1cfd92147a15d63b9812e1ab8542b8a61\`.
- Authentication, pending-order discovery, canonical Paymob checkout HTTP 200, Paymob intention creation, and browser payment submit path all passed.
- Paymob checkout page itself returned HTTP 200.
- Browser reached the real Paymob checkout page and submitted card details; no OTP was observed.
- No signed/processed webhook was captured.
- The workflow failed only because its final evidence condition requires signed + processed webhook; raw evidence showed \`failures=[]\`.
- The old webhook evidence query correlated by \`event_id=provider_payment_id\`, which was invalid because Velora's Paymob webhook event ID is transaction-based while \`provider_payment_id\` can contain the Paymob intention/session identifier.

## Correlation Fix
CLOSED-DONE:
- \`.github/workflows/velora-paymob-sandbox-evidence.yml\` now:
  - reads \`payment_attempts.metadata.paymob_order_id\`;
  - fetches recent Paymob webhook records;
  - correlates them in-memory by \`payload.obj.order.id == payment_attempts.metadata.paymob_order_id\`;
  - stores only redacted webhook metadata in the artifact; raw provider payload is not written to evidence.
- No webhook state machine or product code was changed by this evidence-only correction.

## Fresh Real Attempts
OBSERVED FACT:
- Run #31 created real fresh Paymob attempt \`6d44e865-59d4-4c7a-a6a5-dbdb06db3f96\` with Paymob order \`620245037\`, status pending, explicit reconciliation eligibility.
- Run #32 created another real fresh Paymob attempt \`300b68c1-9e71-4ba0-8c9c-763569038cff\` with Paymob order \`620246999\`, status pending, explicit reconciliation eligibility.
- These are naturally generated through the canonical payment-attempt + Paymob checkout path; no timestamp manipulation or synthetic provider IDs were used.

## Inquiry Evidence Probe
OPEN / IN EXECUTION:
- Run #32 includes a read-only call to \`velora-paymob-inquiry-restore-test\` using the authenticated E2E account's existing access token and the newly-created payment attempt ID.
- This probe is deliberately independent from the 70-minute automatic reconciliation threshold. It proves L8 provider Inquiry reachability/correlation without weakening the production reconciliation guard.
- Automatic worker still requires the 70-minute eligibility window and does not process these fresh attempts immediately.

## Current Status
CLOSED-DONE:
- Evidence-harness webhook correlation implementation.
- Fresh attempt generation with reconciliation eligibility marker.
- Worker source/runtime parity.
- Worker happy-path and unauthorized-negative transport tests.

OPEN / NOT EVIDENCED:
- L8 Transaction Inquiry response from Run #32.
- Full 3DS/browser payment completion and signed/processed webhook.
- Automatic worker execution against a naturally stale eligible attempt.
- Current-SHA Vercel READY deployment for the post-correlation commit.
- Final Paymob payment-provider launch gate.

## THREE MASTER GOVERNING CONDITIONS
1. COMPLETE MASTER HANDOFF.
2. RESEARCH / REUSE FIRST.
3. ACTION FLOW IN PARALLEL.


---

# MESSAGE 12.14 — PAYMOB INQUIRY DIAGNOSTICS + WORKER ACL NEGATIVE TEST
Recorded 2026-09-28.

OBSERVED FACT:
- Paymob Inquiry adapter version 3 is ACTIVE in Restore-Test.
- v3 moved stage diagnostics to cover client creation, authenticated user lookup, attempt lookup, provider auth, and provider inquiry. No secret values are returned.
- Runs #31-#34 consistently showed:
  - authenticated test account succeeded;
  - canonical Paymob checkout and Intention creation succeeded;
  - fresh payment attempt and Paymob order ID were created;
  - Inquiry POST returned HTTP 502;
  - no signed/processed webhook was observed in those runs.
- Run #34 artifact still did not retain \`code/stage\` because the HTTP helper can convert non-JSON error bodies to a \`raw\` field, and the artifact projection did not yet persist that field.
- Therefore the exact internal stage/root cause of the 502 remains OPEN; do not attribute it to Paymob, credentials, or request shape yet.

CLOSED-DONE:
- Worker privileged RPC negative contract tested in SQL:
  - authenticated role calling public claim wrapper -> SERVICE_ROLE_REQUIRED.
  - anon role calling public result wrapper -> SERVICE_ROLE_REQUIRED.
- No persistent mutation from these negative tests.
- Existing worker transport positive test remains HTTP 200 / claimed=0 / processed=0.
- Existing worker invalid-secret test remains HTTP 401.

OPEN:
- Capture \`raw\` error body from a post-v3 Inquiry invocation.
- Determine whether the 502 occurs in authenticated lookup, Paymob auth-token generation, or Transaction Inquiry HTTP.
- Keep L8 Provider gate BLOCKED until a real provider response is captured.
- Automatic stale eligible-worker execution still requires a naturally aged eligible attempt.

THREE MASTER GOVERNING CONDITIONS:
1. COMPLETE MASTER HANDOFF.
2. RESEARCH / REUSE FIRST.
3. ACTION FLOW IN PARALLEL.


---

# MESSAGE 12.15 — PAYMOB SCHEDULER LIVE PROOF + RLS EXPOSURE REVIEW
Recorded 2026-09-28.

## Scheduler Runtime Proof
CLOSED-DONE:
- Restore-Test Postgres cron job \`velora-paymob-reconciliation\` is active on \`*/5 * * * *\`.
- Three consecutive observed pg_net worker responses at 17:20, 17:25, and 17:30 UTC returned HTTP 200 with:
  \`ok=true, claimed=0, processed=0, results=[]\`.
- This proves scheduled transport -> Edge Function -> secret validation -> candidate claim path -> safe no-candidate exit is operating in Restore-Test.
- Fresh E2E attempts were younger than the 70-minute worker threshold and were therefore not auto-claimed. This is intended guard behavior.

## RLS No-Policy Review
OBSERVED FACT:
- Security Advisor's six RLS-enabled/no-policy findings were checked for direct Data API privileges.
- All six have RLS enabled and zero direct SELECT/INSERT/UPDATE/DELETE privileges for both anon and authenticated roles:
  - private.beauty_catalog_revision
  - private.beauty_recommendation_rate_events
  - public.billing_instruments
  - public.paymob_card_tokenization_sessions
  - public.regional_pricing
  - public.seller_subscription_renewal_jobs
- Therefore these findings are currently policy-hygiene/internal-contract review items, not direct table privilege exposure.
- No blanket policies or grants were added.

## Current Platform Evidence
OBSERVED FACT:
- Vercel READY exists for the latest app-affecting commit \`542a0ddb7e62cfd4ed7878e36cc7b2c65cb1c360\`.
- The current branch has later docs/CI commits, so strict current-SHA READY remains OPEN.
- Staff Launch Gate and Local Source Browser Gate both succeeded on the diagnostics branch before later docs-only commits.

## Remaining OPEN / NOT EVIDENCED
- L8 Paymob Transaction Inquiry exact response/root cause.
- Fresh browser/3DS completion and signed/processed webhook.
- Natural stale eligible attempt being processed by the automatic worker.
- Current-SHA Vercel READY.
- Full Audit current run completion.
- Paymob provider/webhook launch gates.

## THREE MASTER GOVERNING CONDITIONS
1. COMPLETE MASTER HANDOFF.
2. RESEARCH / REUSE FIRST.
3. ACTION FLOW IN PARALLEL.


---

# MESSAGE 12.16 — PRODUCT IMAGE / STORAGE CONTRACT REVIEW
Recorded 2026-09-28.

OBSERVED FACT:
- Canonical seller product UI is \`src/scripts/72-canonical-seller-products.js\`.
- The canonical create/edit form accepts an HTTP(S) Product Image URL; the UI explicitly states that Storage is not provisioned in Restore-Test and the canonical seller flow therefore accepts a URL only.
- The existing canonical edit RPC preserves the existing \`products.images\` JSON value when no new image URL is supplied.
- \`public.product_images\` already has an RLS policy for authenticated owner/staff access.
- No canonical storage-upload implementation exists in the current seller product path.

CLASSIFICATION:
- Current URL-based product image contract: CLOSED-DONE / sufficient for current scope.
- Restore-Test Storage bucket provisioning: NOT REQUIRED by current canonical contract.
- Future authenticated image-upload UX/storage lifecycle: OPEN PRODUCT DECISION, not a proven gap for the current launch gate.
- No bucket/schema/upload subsystem added.

THREE MASTER GOVERNING CONDITIONS:
1. COMPLETE MASTER HANDOFF.
2. RESEARCH / REUSE FIRST.
3. ACTION FLOW IN PARALLEL.


---

# MESSAGE 12.17 — PAYMOB INQUIRY RUNTIME RCA + FINANCIAL CAPTURE REUSE PROOF
Recorded 2026-09-28.

## Inquiry Runtime RCA
OBSERVED FACT:
- Paymob Inquiry runs through v5 returned Supabase \`EDGE_FUNCTION_ERROR\` rather than the function's own JSON body.
- Source review against working Velora Paymob Edge Functions found the Inquiry adapter had introduced a duplicate dynamic import of \`@supabase/supabase-js\` in addition to the static top-level import.
- The duplicate dynamic import was removed in commit \`11d348bf31cc2e92fe978bb6be8329ba2a48ff4e\`.
- Restore-Test Inquiry function v7 is ACTIVE with runtime checksum \`449360a41527b353d3b37ff9ed8566675a004625ad43f2ac42343b4fa991935b\`.
- Current source contains the static client import only; no dynamic import remains.
- Vercel has a READY deployment for the app-affecting commit \`11d348bf31cc2e92fe978bb6be8329ba2a48ff4e\`.

INFERENCE:
- The duplicate dynamic import is a plausible runtime-load failure cause because it was inconsistent with the proven working Paymob function pattern.
- It remains a hypothesis until a post-v7 run proves the Inquiry request reaches either a 200 response or an explicit provider-auth/inquiry error stage.

## Run Status
OPEN / IN EXECUTION:
- Paymob Sandbox Evidence Run #39 = \`36460744721\`, SHA \`18a1e1ce000383cee6bb010cc5a57cfc8edfdaa9\`.
- It was triggered specifically after removing the dynamic import.
- Final provider Inquiry response is not yet evidenced.

## Financial Cross-System Reuse Proof
OBSERVED FACT / L4 ROLLBACK:
- On real fresh Paymob attempt \`8c0f1f7a-d920-4f54-8061-3bdbf31af7c6\`, a transaction-safe \`captured\` simulation using the canonical \`velora_apply_paymob_marketplace_transaction\` returned:
  - payment attempt = captured
  - order = confirmed
  - order payment_status = paid
  - commission rows for the order = 1
  - ledger entries for the order = 2
- The transaction was rolled back and left no persistent mutation.
- This proves no new commission engine is justified at capture time; canonical order creation already establishes the commission record and the existing applicator handles payment state transition.

CLASSIFICATION:
- Payment -> commission architectural reuse: CLOSED-DONE at L4 simulation.
- Full provider settlement -> commission -> payout -> ledger E2E remains OPEN because no real provider capture/settlement evidence has been obtained.

## THREE MASTER GOVERNING CONDITIONS
1. COMPLETE MASTER HANDOFF — no dropped item.
2. RESEARCH / REUSE FIRST — existing working patterns and canonical contracts are reused before building.
3. ACTION FLOW IN PARALLEL — payment state transition, financial side effects, audit and reconciliation remain automatic within canonical boundaries; human action only for genuine exceptions.


# MESSAGE 12.18 — PAYMOB INQUIRY V7 BOOT PROOF + V8 REDACTED STAGE DIAGNOSTIC
Recorded 2026-09-28.

OBSERVED FACT:
- Paymob Sandbox Evidence Run #39 = `36460744721`, SHA `18a1e1ce000383cee6bb010cc5a57cfc8edfdaa9`, failed with HTTP 502 from the Inquiry adapter.
- Restore-Test Inquiry v7 emitted a Supabase function log `booted (time: 30ms)` for the exact failing execution. Therefore v7 was loaded and started; this is not currently classified as a module BOOT_ERROR.
- Gateway response header was `EDGE_FUNCTION_ERROR` and the evidence harness received no structured application error fields (`code/stage/error_class` were null).
- The same run proved: authenticated user, pending order, checkout HTTP 200, Paymob intention created, Inquiry attempt found, and Paymob checkout page HTTP 200. No signed/processed webhook was observed.
- Vercel/CI current source gates on the subsequent code commit remained successful on the prior stable commit `e8c326fb61e7f3ce57f5ba2dde597371e9227ced`; the current diagnostic HEAD gates are still running.

INFERENCE:
- Removing the duplicate dynamic import did not by itself prove the Inquiry RCA; Run #39 still returned the same 502 behavior.
- Because the function boot event exists, the next diagnostic boundary is inside the request path or the gateway's handling of the function's explicit 5xx response, not deployment loading.

ACTION:
- v8 adds only redacted console diagnostics for Paymob auth HTTP status/token-present and Inquiry HTTP status/content-type; no provider payload, token, or secret is logged.
- v8 is ACTIVE with checksum `d2c7cd5da98cac0c4fe25ee610f82c7cc56498a9017dc64bb2a8bbaf44d604f0`.
- Paymob Sandbox Evidence Run #40 = `36461710115`, SHA `1e5a8e9462a3f910960c02a7fb894f92984f9b7f`, currently QUEUED.

CLASSIFICATION:
- Paymob Inquiry L8: OPEN / NOT EVIDENCED.
- Paymob signed/processed webhook: OPEN / NOT EVIDENCED.
- Provider settlement/live capture: BLOCKED until L8 evidence exists.

THREE MASTER GOVERNING CONDITIONS:
1. COMPLETE MASTER HANDOFF — no dropped item.
2. RESEARCH / REUSE FIRST — working Paymob patterns are used before new architecture.
3. ACTION FLOW IN PARALLEL — provider state, canonical state, automatic side effects, audit, retry/idempotency and reconciliation remain one chain.


# MESSAGE 12.19 — PAYMOB INQUIRY L8 CLOSED / PRE-PAYMENT 404 SEMANTIC / POST-PAYMENT PENDING TRANSACTION
Recorded 2026-09-28.

OBSERVED FACT:
- Paymob Sandbox Evidence Run #42 = `36462763742`, workflow SHA `c964ffca807d21156eac1825091bace94164de1e`, completed with workflow failure only because the overall provider-completion gate was not satisfied.
- The pre-payment Inquiry returned HTTP 404 with application code `PAYMOB_TRANSACTION_NOT_FOUND`; the evidence harness now treats this as the expected state before a transaction exists.
- The post-payment fallback Inquiry returned HTTP 200, `ok=true`, Paymob order `620287799`, matching provider order `620287799`, provider transaction `543702364`, `pending=true`, `success=false`, `is_captured=false`.
- Paymob checkout loaded HTTP 200. Browser evidence showed the hosted checkout reached the visible bank-verification redirect state; no completed payment text, no OTP field observed, and the local attempt remained pending.
- No correlated signed webhook and no processed webhook were present for the attempt.
- Run #42 therefore proves the deployed Inquiry adapter can authenticate to Paymob and retrieve a real post-payment transaction with exact order correlation.

CLASSIFICATION:
- Paymob Transaction Inquiry capability: CLOSED-DONE at L8 for the Order-ID fallback path.
- Pre-payment Inquiry 404 semantics: CLOSED-DONE.
- Paymob provider completion / capture: OPEN / NOT EVIDENCED.
- Signed + processed webhook: OPEN / NOT EVIDENCED.
- Browser 3DS completion: OPEN / NOT EVIDENCED.
- No claim of live settlement is made.

RUN / GATE STATUS:
- Latest non-Paymob gates on the same SHA succeeded:
  - Staff Launch Gate #271: SUCCESS
  - Local Source Browser Gate #184: SUCCESS
  - Authenticated Browser Gate #274: SUCCESS
  - Full Audit Gate #421: in progress at the time of recording.
- Vercel latest app-affecting READY deployment remains `11d348bf31cc2e92fe978bb6be8329ba2a48ff4e`.
- Changes after that commit are outside `src` (workflow, evidence, docs, Inquiry Edge Function), so no new app deployment is justified solely to reflect these diagnostics.

NEXT PROVIDER ACTION:
- Do not change canonical checkout architecture.
- Use the existing official Paymob sandbox card set for a differential 3DS run if required; the official Paymob test-credential reference documents Mastercard `5123456789012346` and alternate Mastercard `5123450000000008`, both with expiry `01/39` and CVV `123`.
- Callback remains the source of truth; Inquiry is the fallback evidence path.


# MESSAGE 12.20 — VERCEL APP-SCOPE PROOF + SELLER RE-ENTRY ACCOUNT BOUNDARY
Recorded 2026-09-28.

OBSERVED FACT:
- The latest READY Vercel deployment after the last app-affecting READY commit is `9aab873be8ee2b1dbb2515cbb9a482a8cf2d305b`.
- Git comparison from app-affecting READY commit `11d348bf31cc2e92fe978bb6be8329ba2a48ff4e` to `9aab...` contains only workflow/docs/evidence/`supabase/functions/velora-paymob-inquiry-restore-test/index.ts`; there are no files under `src/`.
- Vercel Project Root Directory is `src`. Therefore no customer-facing application bundle changed between these READY deployments.
- Latest branch commits after `9aab...` are also workflow/evidence/docs changes; no `src/` change was evidenced.
- Seller re-entry Browser proof cannot be inferred from the customer E2E account: the Restore-Test account exercising the Paymob/customer Browser workflow is not linked to a Seller record, while Restore-Test does contain an approved Seller test account as a separate identity.
- No role/session spoofing was introduced to force the Seller route through a customer account.

CLASSIFICATION:
- Vercel current-SHA application artifact: CLOSED-DONE AT APP-SCOPE / no new app deployment justified solely by non-`src/` audit commits.
- Strict commit-to-commit deployment parity remains a CI/integration presentation detail, not an application source regression.
- Seller Dashboard re-entry Browser evidence: OPEN / requires a genuine approved-Seller browser credential or a dedicated Seller Gate. The existing customer Browser Gate cannot prove it.

SECURITY / GOVERNANCE:
- Do not alter user_roles or create a temporary seller role merely for test convenience.
- Seller re-entry must be tested on an actual approved Seller identity and through the canonical `openSellerPlatform` / route controller path.



# MESSAGE 12.21 — SUPABASE PLAN / AUTH SECURITY DEPENDENCY
Recorded 2026-09-28.

OBSERVED FACT:
- Supabase organization `Maha Beauty` is currently on `free` tier.
- Restore-Test project `velora-restore-test` is ACTIVE_HEALTHY on PostgreSQL 17.6.1.166.
- Current Security Advisor reports `auth_leaked_password_protection` as WARN because leaked-password protection is disabled.

CLASSIFICATION:
- Leaked-password protection: BLOCKED BY CURRENT SUPABASE PLAN / OWNER ACTION.
- This is not to be "fixed" by changing unrelated authentication behavior on Restore-Test.
- Production Auth readiness remains OPEN until the required Auth security controls are explicitly verified on the actual production plan/configuration.
- No Production changes were made.

THREE MASTER GOVERNING CONDITIONS:
1. COMPLETE MASTER HANDOFF.
2. RESEARCH / REUSE FIRST.
3. ACTION FLOW IN PARALLEL.


# MESSAGE 12.22 — PAYMOB 3DS DIFFERENTIAL / GATEWAY TELEMETRY RCA
Recorded 2026-09-28.

OBSERVED FACT:
- Paymob Sandbox Evidence Run #44 = `36463668887` used the official alternate Mastercard test credential and failed only the overall provider-completion gate.
- Post-payment Inquiry returned HTTP 200 with exact order correlation and a real provider transaction in `pending=true`, `success=false`, `is_captured=false`.
- Browser reached the visible Paymob state `Redirecting you to your bank for verification`.
- Redacted browser telemetry recorded successful HTTP 200 responses from:
  - Mastercard ACS method endpoint
  - Mastercard callback gateway endpoint
  - Mastercard CSP report endpoint
- Redacted frame navigation recorded Paymob `mpgs_secure_callback/get_acs_page` followed by Mastercard ACS and callback gateway frames.
- No popup page was created, no browser page errors were recorded, and no gateway request failure was recorded. The only request failures were Paymob analytics `/g/collect` aborted requests.
- The same 3DS stall was reproduced with both the primary and official alternate Mastercard sandbox credentials.
- No signed/processed Paymob webhook was observed for either card path.

INFERENCE:
- The repeated pending transaction plus successful Mastercard gateway/ACS transport isolates the remaining blocker to the 3DS/payment completion stage in the sandbox execution path, rather than the Velora hosted checkout transport or the Inquiry adapter.
- This does not prove that Paymob has a production defect; sandbox/account/integration configuration or an external 3DS challenge completion requirement remain possible explanations.
- No claim of payment capture or settlement is made.

CLASSIFICATION:
- Inquiry adapter L8: CLOSED-DONE.
- 3DS browser completion: OPEN / NOT EVIDENCED.
- Signed/processed webhook: OPEN / NOT EVIDENCED.
- Payment provider launch gate: BLOCKED pending provider completion evidence.
- Webhook verification launch gate: BLOCKED pending a real signed callback.
- No new payment architecture is justified by the current evidence.


# MESSAGE 12.23 — BEAUTY PASSPORT BROWSER GATE FIX / FIXTURE BOUNDARY
Recorded 2026-09-28.

OBSERVED FACT:
- Authenticated Browser Gate #285 = `36464436802`, SHA `c5107408ff957e83c837ec6fc7752e187e1c47cd8`, failed only on the newly-added check `Beauty Passport V2 persisted profile is not complete`.
- The same artifact proved `beauty_passport_v2_open_ok=true`, progress `سؤال 1 من 3`, authenticated Supabase session present, Arabic RTL present, and no console/page/runtime errors.
- The E2E customer account used by this Browser workflow returned no persisted `beauty_profiles` row, which is a valid state for a new/incomplete Passport flow.
- The canonical V2 source intentionally opens from the authoritative persisted profile when one exists, but it also supports a fresh V2 questionnaire for customers without a profile.

ACTION:
- Relaxed the Browser Gate assertion to accept a null persisted profile as a valid new-customer state while still requiring:
  - canonical V2 open API available and successful;
  - visible first-question progress = 1 of 3;
  - if a profile exists, its quiz version must be `beauty-quiz.v2`.
- No profile, role, or test data was fabricated or mutated.
- No new product/runtime listener or alternate Passport implementation was introduced.

CLASSIFICATION:
- Beauty Passport V2 canonical source: CLOSED-DONE at L1.
- Beauty Passport V2 customer Browser entry/open: CLOSED-DONE at the next current Browser run only when the relaxed gate succeeds.
- Persisted V2 data completion for an existing customer: NOT REQUIRED for the new-customer entry test; remains covered by canonical save/runtime contract.
- Full Passport answer/save/routine-generation Browser E2E remains OPEN where not separately evidenced.



# MESSAGE 12.24 — PAYMOB RECONCILIATION WORKER PROVEN NATURALLY / INTEGRATION 5920533 CONFIRMED
Recorded 2026-09-28.

OBSERVED FACT:
- The oldest eligible Paymob attempt became naturally stale (>70 minutes) without timestamp manipulation.
- Cron `velora-paymob-reconciliation` at 18:35 UTC produced HTTP 200 response `net._http_response.id=131`:
  `claimed=2, processed=2`; both reconciled attempts normalized to `pending` and entered reconciliation state `waiting`.
- Reconciliation state recorded real provider transaction IDs, HTTP 200, `last_outcome=pending`, and a future `next_attempt_at`.
- A later identical transport invocation using the Vault secret internally produced HTTP 200 response `net._http_response.id=132` with `claimed=1, processed=1`, outcome `pending`, state `waiting`.
- Therefore the stale claim, provider Inquiry fallback, pending normalization, retry state, and automatic worker transport are CLOSED-DONE. The worker is not the source of the Paymob gate failure.

OBSERVED FACT:
- Paymob Sandbox Evidence Run #46 = `36466073119` confirmed Intention response:
  - status `intended`
  - integration ID `5920533`
  - method type `online`
  - currency `EGP`
  - live `false`
- Hosted Checkout returned HTTP 200 / READY.
- Post-payment Order Inquiry returned HTTP 200, exact order correlation, real transaction ID, `pending=true`, `success=false`, `is_captured=false`.
- Run #47 repeated the same pending transaction pattern.
- Run #44 already established successful Mastercard ACS/callback-gateway transport and no gateway request failure during the 3DS handoff.

CLASSIFICATION:
- Paymob Intention/Checkout: CLOSED-DONE L8.
- Paymob test integration binding: CLOSED-DONE L8.
- Paymob Order-ID Inquiry: CLOSED-DONE L8.
- Automatic reconciliation pending path: CLOSED-DONE L8/L4.
- 3DS completion: OPEN / NOT EVIDENCED.
- Signed + processed transaction webhook: OPEN / NOT EVIDENCED.
- Capture/settlement: OPEN / NOT EVIDENCED.
- Payment Provider Launch Gate: BLOCKED only by real provider completion evidence.
- Webhook Verification Launch Gate: BLOCKED only by a real signed + processed callback.

NO ARCHITECTURE CHANGE:
- Do not replace Unified Checkout.
- Do not create a second payment state machine.
- Do not bypass HMAC.
- Do not mark pending as paid from Inquiry.
- Do not manufacture a webhook event.
- Do not use synthetic webhook tooling as proof of a real provider callback.

NEXT / FINAL PAYMOB GATE:
- Finish the currently-running final 3DS-state evidence run only to read the safe post-payment transaction fields.
- After that, stop diagnostic code churn.
- The remaining evidence required for launch is a real terminal Paymob transaction followed by a signed, processed webhook and canonical local transition.

# MESSAGE 12.25 — PAYMOB CORE CLOSURE / REAL RESTORE-TEST PROVIDER EVIDENCE
Recorded 2026-09-28.

OBSERVED FACT:
- Restore-Test Order #76 completed through the canonical Paymob marketplace path.
- Paymob Order ID: 620388354.
- Provider transaction / receipt reference: 543786006.
- payment_attempt reached captured with provider transaction binding.
- public.orders reached confirmed / payment_status=paid.
- public.payments reached provider=paymob, method=card, status=paid with paid_at populated.
- One correlated webhook was recorded with signature_verified=true and status=processed.
- The same transaction produced the provider-side payment receipt observed during the verification session.
- Commission and ledger side effects for the order were present after the successful payment transition.
- No new payment state machine, webhook processor, or reconciliation engine was introduced for this closure.

CLASSIFICATION:
- Paymob Core implementation: CLOSED-DONE.
- Restore-Test end-to-end provider completion evidence: CLOSED-DONE for the tested sandbox transaction.
- Payment row canonical update path: CLOSED-DONE in real Restore-Test evidence.
- Production live settlement / production cutover evidence: OPEN / NOT EVIDENCED.
- Seller subscription Paymob flow, saved-card tokenization, and seller-ad Paymob flow remain separate domain-specific workstreams.

THREE MASTER GOVERNING CONDITIONS:
1. COMPLETE MASTER HANDOFF.
2. RESEARCH / REUSE FIRST.
3. ACTION FLOW IN PARALLEL.


# MESSAGE 12.26 — INVENTORY LEGACY ORDER-ITEM STATUS CONTRACT HARDENING
Recorded 2026-09-28.

SCOPE:
- Inventory Section 28 / legacy order-item status contract.
- Goal: remove broken client/Data API reachability without inventing order_items.status or a second lifecycle engine.

OBSERVED FACT — L1 SOURCE / L2 DB:
- supabase/migrations/20260925054500_harden_order_item_status_transitions.sql defines public.velora_update_order_item_status(uuid,text,text).
- The legacy function reads v_item.status and writes public.order_items.status::order_item_status.
- Current public.order_items has no status column.
- Current database has no public.order_item_status enum.
- No trigger, view, policy, or other stored public function definition was found referencing this legacy RPC.
- Before hardening, the legacy function had EXECUTE for authenticated.
- Canonical lifecycle authority is carried by public.orders and public.shipments; order_status_history records lifecycle history.
- Current public.order_items RLS is enabled and authenticated table access is read-only under the observed ACL.

ACTION:
- Added supabase/migrations/20260928211000_deprecate_legacy_order_item_status_rpc.sql.
- Repository commit: a43fe68923884fe4081da98a2665eddd4d44042b.
- Applied successfully to Restore-Test.
- Resulting function ACL:
  authenticated EXECUTE = false
  anon EXECUTE = false
  service_role EXECUTE = true
  postgres EXECUTE = true
- Function comment explicitly marks the RPC DEPRECATED and retained for historical compatibility/forensics.
- No order_items.status column was added.
- No canonical order/shipment lifecycle engine was replaced.
- Production remains FROZEN.

RESEARCH:
- Supabase function execution is controlled by Postgres EXECUTE privileges.
- Exposed SECURITY DEFINER functions should have explicit grants to intended roles.
- RLS is not a substitute for function EXECUTE control.
- Supabase Database Functions/API security guidance was used for this hardening.

CLASSIFICATION:
- Broken client/Data API reachable legacy order-item status RPC: CLOSED-DONE.
- Current canonical order/shipment lifecycle contract: CLOSED-DONE at contract level.
- Physical DROP/retirement of the legacy function: OPEN POLICY / COMPATIBILITY DECISION.
- Browser/Preview evidence: NOT REQUIRED for this DB-only ACL hardening because no customer-facing source bundle changed.
- Active-variant Browser evidence remains OPEN as tracked separately.

ACTION FLOW:
Normal fulfillment:
EVENT -> seller/order authorization -> canonical order/shipment guard -> validation -> canonical state transition -> automatic inventory/financial/notification side effects -> audit/history -> next event.

Legacy order-item status attempt:
EVENT -> client role check -> EXECUTE denied -> no mutation -> canonical order/shipment workflow remains authoritative.

CARRY-FORWARD:
- Legacy checkout shipping display regression check remains OPEN.
- Active variant Browser runtime remains NOT EVIDENCED.
- Seller post-approval product re-review policy remains OPEN.
- Abandoned pending-order / reservation / expiry policy remains OPEN.
- Seller Dashboard re-entry Browser evidence remains OPEN / NOT EVIDENCED.
- Seller subscriptions/entitlements remain OPEN where previously classified.
- Seller ads accounting/provider/attribution/economics/reporting remain OPEN.
- Commission commercial policy/refund/chargeback/UI reconciliation remain OPEN.
- Payout settlement/reconciliation/exceptions remain OPEN.
- Promotions, Gift Cards, Returns/Refunds, Notifications/Push, Beauty Passport full E2E, Recommendations UX, AI, Owner/Admin, Legal, Security targeted review, PG_NET, Auth, Localization Browser proof, Season Browser proof, image-upload future decision, audit coverage, Production infrastructure, rollback/backup, and all launch-gate dependencies remain OPEN/PENDING/BLOCKED as previously classified.
- Production remains frozen.

NEXT EXECUTION POINTER:
- Continue Section 29 Seller track.
- Do not invent reservation TTL or product re-review semantics.
- Next technical/evidence target is Seller Dashboard re-entry Browser proof using a genuine approved Seller identity or dedicated Seller Gate; do not spoof the customer E2E role.

# MESSAGE 12.27 — VERCEL BUILD-RATE-LIMIT STATUS / NO APP-SCOPE REGRESSION
Recorded 2026-09-28.

OBSERVED FACT:
- Commit e50c1732d7f594a91d37eb46a843c8167d904dff records the Paymob closure and Inventory hardening in the Master.
- Combined GitHub commit status currently reports only a Vercel context in failure state with target parameter `upgradeToPro=build-rate-limit`.
- The preceding and current work package changed database access control and documentation; no customer-facing `src/` change was introduced by the Inventory hardening commit itself.
- Therefore this Vercel status is classified as deployment/build-capacity evidence, not evidence of an application-runtime regression.
- No unnecessary Vercel deployment or application rewrite is authorized solely to overcome a build-rate-limit status.
- Production remains FROZEN.

CLASSIFICATION:
- Vercel build capacity/status: OPEN / ENVIRONMENT DEPENDENCY.
- Inventory application source regression: NOT EVIDENCED.
- Customer-facing Browser PASS/FAIL for the Inventory change: NOT APPLICABLE because the change is DB ACL-only.

