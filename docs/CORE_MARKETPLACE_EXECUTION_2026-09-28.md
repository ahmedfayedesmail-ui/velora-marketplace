# Core Marketplace Execution Evidence — 2026-09-28

Work package: Master Execution Plan — Message 2/11
Environment: Restore-Test (arlaxqmhtvjwjbjinjfw) only
Production: frozen / not modified

## Execution result

### 10 — Cart
OBSERVED FACT:
- Canonical server cart is carts + cart_items.
- Current Restore-Test snapshot has cart rows and cart-item rows.
- carts.customer_id is unique.
- cart_items has unique constraints preventing duplicate logical lines, including a partial unique index for product-only lines.
- RLS policies restrict carts/cart_items to the authenticated owner.
- Existing canonical cart RPCs are present: velora_upsert_cart_item and velora_upsert_cart_item_variant.

DECISION:
- No cart rewrite performed.
- No duplicate cart engine introduced.

### 11 — Routine -> Cart
OBSERVED FACT:
- src/scripts/62-s1-c-routine-cart.js exposes window.veloraRoutineCart.addAll.
- It reads the authenticated server cart before adding routine lines.
- It uses the canonical cart RPCs and synchronizes the legacy visible cart state.
- It does not silently duplicate an existing line.

DECISION:
- No routine-cart rewrite performed.

### 12–14 — Checkout
OBSERVED FACT:
- Canonical checkout is src/scripts/13-payments.js.
- src/scripts/57-s2-checkout-e2e.js is a compatibility/delegation adapter and does not implement a second order-creation path.
- window.placeOrder uses a stable checkout reference and an in-flight submit guard.
- Canonical order creation is velora_create_order_with_commercials.
- Canonical flow binds the selected payment method via velora_set_order_payment_method.
- COD exits through the canonical order path; non-COD starts the provider payment flow.
- velora_create_order_with_commercials first calls velora_create_order, then applies coupon/best promotion and optional gift card.

DECISION:
- No second checkout state machine introduced.

### 15 — Shipping
OBSERVED FACT:
- Current shipping schema uses store_shipping_zones + store_shipping_rates; there is no standalone shipping_zones table in the current Restore-Test schema.
- Active zone: Egypt — E2E Test Zone, country EG.
- Active carrier: velora_manual — Velora Manual Fulfillment (No external carrier).
- Active EGP store rate: 30.0000, estimated 2–5 days.
- The checkout shipping quote function is velora_quote_cart_shipping.
- Current shipping_quotes has no persisted rows in the current snapshot; shipping is calculated through the quote path.

DECISION:
- No new carrier/network added.
- No persistent quote fabrication added.

### 16 — Legacy shipping display formula
OBSERVED FACT:
- Legacy checkout display code still contains a local shipping formula in 00-localization.js.
- Canonical checkout recomputes/validates server shipping through velora_quote_cart_shipping.

DECISION:
- No change made because the handoff explicitly requires a current user-visible regression before touching this legacy display formula.

### 17 — Order / Inventory state
OBSERVED FACT:
- Order creation validates approved product/seller and checks stock.
- Variant checkout requires an active selected variant and decrements both variant stock and parent product aggregate stock.
- Variant cancellation/payment-failure release restores both.
- OOS is represented through stock; lifecycle status remains separate.

### 18 — Variant reconciliation
OBSERVED FACT:
- Current Restore-Test contains one product_variants row, but it is inactive.
- There are currently zero active variants and zero active stocked variants.
- Therefore current live variant runtime testing is limited by the available active variant fixture.
- The stored variant is linked to Test Vitamin C Serum and remains inactive, so it is not current purchasable variant inventory.

DECISION:
- No fake active variant was created just to manufacture evidence.

### 19 — Payment failure release
OBSERVED FACT:
- Trigger trg_velora_release_inventory_after_failed_payment exists on payment_attempts.
- Function private.velora_release_inventory_after_failed_marketplace_payment() handles marketplace payment attempts transitioning to failed.
- It locks the order, restores variant/product inventory where applicable, reverses pending commissions, cancels/fails the order, fails the pending payment row, and writes payment_failed_inventory_released.

NEGATIVE-PATH DB TRANSACTION TEST:
- Test subject: Order 68 / payment attempt dd223161-93e3-4770-9de4-d58c8abc0cce.
- Before: order pending/pending, product stock 13.
- Inside transaction after setting payment attempt to failed: order became cancelled/failed; product stock became 14; one order line was present.
- Transaction was rolled back.
- After rollback: order returned to pending/pending; payment attempt returned to pending; failure code was cleared; product stock returned to 13.

CLASSIFICATION:
- OBSERVED FACT: DB trigger behavior verified in a rolled-back transaction.
- NOT EVIDENCED: Browser behavior for this exact current SHA.
- NOT EVIDENCED: Provider settlement/webhook end-to-end.
- NOT EVIDENCED: Production behavior.

### 20 — Historical cancellation contract bug
OBSERVED FACT:
- Current public.order_items does NOT contain an status column.
- Current live velora_cancel_order(uuid) does NOT update order_items.status.
- Repository history contains the reconciliation migration followed by 20260928083318_fix_order_cancellation_inventory_contract.sql, whose current source matches the live no-order-items-status contract.

DECISION:
- No new order_items.status column added.
- No rollback to the earlier broken contract.

### 21 — DB failure evidence
OBSERVED FACT:
- The current rolled-back transaction reproduced the intended inventory-release transition and proved rollback cleanliness.
- This is DB transaction evidence only.

## Message 2 status

CART: CLOSED-DONE at current contract/source level.
ROUTINE -> CART: CLOSED-DONE at current source/contract level.
CHECKOUT: CLOSED-DONE at canonical source/contract level.
CHECKOUT IDEMPOTENCY: CLOSED-DONE at current source/contract level.
SHIPPING: CLOSED-DONE at current Restore-Test configuration level.
LEGACY SHIPPING DISPLAY: OPEN only if a current user-visible regression is reproduced; otherwise leave unchanged.
ORDER / INVENTORY: CLOSED-DONE at current contract level.
VARIANT RUNTIME: NOT EVIDENCED beyond contract because no active variant fixture is currently available.
PAYMENT-FAILURE INVENTORY RELEASE: CLOSED-DONE at DB trigger/transaction evidence level; Browser/Provider/Production remain unproven.
HISTORICAL ORDER-ITEM STATUS BUG: CLOSED-DONE in current live contract; no schema column added.

## Do not claim

This work package does not claim:
- current Vercel Browser PASS
- live Paymob settlement PASS
- live provider webhook PASS
- Production PASS
- production infrastructure PASS
- backup/rollback PASS

## Action Flow

For the payment-failure inventory path, the implemented chain is:

EVENT: payment attempt becomes failed
-> GUARD: marketplace-order purpose + attached order
-> VALIDATION: order still pending/confirmed and payment pending
-> STATE TRANSITION: release inventory + reverse pending commission + cancel/fail order
-> SIDE EFFECT: fail pending payment row + audit log
-> NEXT EVENT: order/payment automation and notification triggers
-> RETRY/DEDUPE: state guards prevent repeating release after terminal state
-> HUMAN EXCEPTION: provider ambiguity remains outside the DB auto-release contract.
