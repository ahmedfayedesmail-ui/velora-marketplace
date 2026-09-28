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
  velora_save_beauty_passport_v2(p_skin_type,p_goal,p_routine_budget)
- The V2 frontend is bilingual Arabic/English and mobile-oriented.
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
