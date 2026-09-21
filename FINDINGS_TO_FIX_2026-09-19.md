# Velora — FINDINGS TO FIX — 2026-09-19

## Handoff / Control

**Project:** Velora Marketplace  
**Environment for repair/testing:** Restore-Test + local development only  
**Production:** **FROZEN — DO NOT MODIFY**  
**GitHub repo:** `ahmedfayedesmail-ui/velora-marketplace`  
**Current repair branch:** `sprint-2-s2d-admin`  
**Frontend stack:** Vanilla JS + static HTML/CSS  
**Backend:** Supabase  
**Vercel root directory:** `src`

### Scope decision

- Sprint 2 Wave 2 is **CLOSED / STOPPED** pending local developer repair.
- S2-A Variants is **DEFERRED to Sprint 2.5**.
- Do not run more remote/browser fix loops from this handoff.
- Freelancer should reproduce locally, fix, run local E2E/browser checks, then prepare deployment.
- Production remains untouched until Owner gives final Production GO.

---

# Findings

## FIND-BE-015 — Checkout submit does not create an order

### Severity
**P1 / Release blocker**

### Status
**OPEN — observed repeatedly in Browser E2E**

### Reproduction

1. Open the Sprint 2 preview or local app.
2. Login as customer using the dedicated E2E customer account.
3. Open **Shop**.
4. Open **Test Vitamin C Serum**.
5. Add the product to Cart.
6. Confirm Cart contains the product and price is **EGP 250**.
7. Open Checkout.
8. Complete Shipping Information:
   - Name
   - Phone
   - City
   - Address
   - Country/Region
9. Select **Cash on Delivery**.
10. Press **Place Order**.

### Actual result

- Browser returns to Home.
- No new order appears in My Orders.
- Cart still contains the item.
- No useful checkout error is shown to the user.
- In one observed attempt the notification badge changed, but no corresponding order existed.

### Expected result

- Canonical Supabase order is created.
- Order number is returned.
- Cart is cleared **only after successful order creation**.
- Customer is routed to My Orders / success state.
- Any RPC failure is surfaced clearly instead of silent navigation.

### Backend evidence already verified

The canonical RPC is:

`public.velora_create_order(...)`

A direct authenticated Restore-Test invocation using the correct E2E customer UUID + the approved EGP product succeeded and returned:

- `ok = true`
- subtotal = 250
- total = 250
- currency = EGP
- order created successfully

The same RPC with an invalid USD conversion path returned `FX_RATE_UNAVAILABLE`.

Therefore the remaining problem is primarily in the **frontend submit path / runtime wiring**, not proof that the canonical order RPC itself is fundamentally broken.

### Important E2E fixture note

The authoritative customer UUID must be resolved from Auth/email during local testing. Prior handoff notes contained a UUID typo. The current Restore-Test Auth user for `customer-test@velora.local` must be treated as the source of truth.

### Files to inspect first

- `src/scripts/00-localization.js`
  - legacy `renderCheckoutPage()`
  - legacy `placeOrder()`
  - Supabase/Auth initialization
  - canonical checkout wrapper
  - cart synchronization
- `src/scripts/57-s2-checkout-e2e.js`
  - current checkout interception/hardening
  - submit event handling
  - currency resolution
  - `velora_create_order` caller
- `src/index.html`
  - exact script load order
  - cache-busting/version of `57-s2-checkout-e2e.js`
- Also inspect any later script that can overwrite `window.placeOrder` or bind another checkout submit handler.

### Local developer acceptance test

Run in a real browser locally:

`Login → Shop → Product → Add to Cart → Checkout → fill shipping → COD → Place Order`

Verify:

- no navigation to Home on failure
- no silent failure
- browser Network tab shows Supabase RPC request
- request is `velora_create_order`
- RPC payload uses EGP for the EGP fixture
- successful response contains `ok=true` and an order number
- Cart becomes empty only after success
- new row exists in `public.orders`
- new `public.order_items` row exists
- payment row exists
- My Orders shows the same order

---

## FIND-BE-008 — Variant UI missing from Seller Edit Modal

### Severity
**High — deferred**

### Status
**DEFERRED TO SPRINT 2.5**

### Reproduction

1. Login as seller.
2. Open Seller Center.
3. Open Products.
4. Open Edit for an existing seller product.
5. Inspect the Edit Product modal.

### Actual result

- Variant editor / Variants section is not visible.
- This remained true after multiple integration attempts and after the isolated Variant Lab passed.

### Expected result

- Edit Product modal exposes a Variants section.
- Seller can add/read/update/retire variants.
- Variant operations use canonical Supabase RPCs.

### Important observation

The isolated S2-A Variant Lab passed the backend CRUD path. The failure is therefore concentrated in the **legacy Seller Modal ↔ S2-A frontend integration boundary**.

### Files to inspect

- `src/scripts/52-s2a-variants.js`
- `src/scripts/00-localization.js`
  - `openAddProductModal()`
  - `editSellerProduct()`
  - `handleAddProduct()`
  - legacy seller product storage/rendering
- `src/styles/velora.css`
  - Variant/editor styles if needed

### Decision

Do **not** keep looping on this in Sprint 2. Fix locally under Sprint 2.5 later.

---

## FIND-BE-009 — Mobile overflow

### Severity
Medium

### Status
OPEN

### Reproduction

1. Open the application in a narrow mobile viewport.
2. Test Home, Shop, Checkout, Seller Center, and modals.
3. Inspect horizontal scrolling / clipped controls.

### Actual result

- Some layouts/controls can overflow horizontally or become cramped on mobile.

### Expected result

- No unintended horizontal page scrolling.
- Header actions, forms, tables, modals, seller UI, and checkout remain usable at mobile width.

### Files to inspect

- `src/styles/velora.css`
- `src/index.html`
- Any component/script that generates fixed-width inline styles.

### Existing relevant CSS

There are existing mobile hardening rules near the end of `velora.css`, including:

- `html, body { max-width: 100%; overflow-x: hidden; }`
- mobile header/action constraints
- modal width constraints

The developer should test behavior instead of assuming these rules are sufficient.

---

## FIND-BE-010 — “Discover More” duplicated

### Severity
Medium

### Status
OPEN

### Reproduction

1. Open Home.
2. Observe the hero/title area.
3. Change language and return to English.
4. Repeat a refresh/navigation cycle.

### Actual result

- “Discover More” / hero translation content can appear duplicated.

### Expected result

- Hero content renders exactly once.
- Language changes replace the existing text instead of appending another copy.

### Files to inspect

- `src/scripts/00-localization.js`
- `src/scripts/50-localization.js`
- `src/scripts/51-localization.js`

### Relevant code areas

`51-localization.js` contains the hero-specific translation/runtime logic, including `__veloraFixHeroCore()`.

---

## FIND-BE-011 — Reviews UUID syntax / invalid product IDs

### Severity
High

### Status
OPEN

### Reproduction

1. Open a product/reviews flow.
2. Use a legacy/demo product ID such as `sk-001`.
3. Attempt to use the S2-C review path.

### Actual result

- S2-C expects a canonical UUID in Supabase.
- Legacy IDs such as `sk-001` can reach UUID-only RPC paths and produce an invalid UUID error.

### Expected result

- Review UI must operate only on canonical UUID products.
- Legacy/demo IDs must not be sent to UUID-only RPCs.
- UI should either map to a canonical product or avoid opening the canonical review flow.

### Files to inspect

- `src/scripts/53-s2c-reviews.js`
- `src/scripts/00-localization.js`
- canonical catalog/product mapping in the Stage 7/7.3 sections of `00-localization.js`

---

## FIND-BE-012 — US$ displayed instead of EGP

### Severity
High

### Status
OPEN

### Reproduction

1. Login with the E2E customer.
2. Open the canonical EGP product:
   **Test Vitamin C Serum — 250 EGP**
3. Add to Cart.
4. Open Checkout.
5. Inspect currency in product/cart/checkout/summary.

### Actual result

- Some UI paths can show USD / “US$” instead of EGP.

### Expected result

- EGP product/Cart/Checkout stays consistently in **EGP**.
- Checkout RPC must receive `p_currency='EGP'` for the EGP fixture.
- No silent fallback to USD for an EGP cart.

### Files to inspect

- `src/scripts/00-localization.js`
  - `VELORA_CURRENCY_META`
  - `detectVeloraCurrency()`
  - `setVeloraCurrency()`
  - `formatPrice()`
  - Stage 7 market context/currency logic
- `src/scripts/50-localization.js`
- `src/scripts/51-localization.js`
- `src/scripts/57-s2-checkout-e2e.js`

---

## FIND-BE-013 — es-EG locale combination

### Severity
Medium

### Status
OPEN

### Reproduction

1. Open localization/language settings.
2. Use Spanish language with an Egypt regional context.
3. Inspect `document.documentElement.lang`, date/number formatting, and currency behavior.

### Actual result

- A Spanish + Egypt context can produce an `es-EG` locale combination that may not be the intended business formatting contract.

### Expected result

- Language, country, currency, and date/number locale should be independently controlled.
- A language choice must not unexpectedly force an incompatible region/currency formatting decision.

### Files to inspect

- `src/scripts/50-localization.js`
- `src/scripts/51-localization.js`
- `src/scripts/00-localization.js`

---

## FIND-BE-014 — “Your cart is empty” appears inside Checkout

### Severity
High

### Status
OPEN / related to cart synchronization

### Reproduction

1. Login as customer.
2. Add canonical EGP product to Cart.
3. Navigate to Checkout immediately.
4. Observe the checkout form/summary.
5. Repeat after hard refresh.

### Actual result

- Checkout can render the empty-cart branch even though the customer has just added an item or the cart badge shows an item.
- This creates inconsistent cart state between the visible UI and Checkout.

### Expected result

- Checkout reads one authoritative cart state.
- If Cart has one item, Checkout must render the item.
- If Cart is actually empty, the empty state is correct.
- Hard refresh should follow the documented persistence contract rather than showing contradictory mixed states.

### Files to inspect

- `src/scripts/00-localization.js`
  - `STATE.cart` initialization
  - `renderCheckoutPage()`
  - `addToCart()`
  - Stage 7.3 cloud-cart sync
- `src/scripts/54-s2b-wishlist.js` only if cart/wishlist shared hooks are touched
- `src/scripts/57-s2-checkout-e2e.js`

---

## FIND-BE-016 — Staff login failed

### Severity
High

### Status
OPEN

### Reproduction

1. Open Login.
2. Enter the dedicated staff E2E credentials.
3. Submit Login.
4. Attempt to enter Staff/Admin platform.
5. Repeat after refresh.

### Actual result

- Staff login / staff platform access has previously failed during Browser E2E.

### Expected result

- Staff Auth session succeeds.
- Public user/profile is resolved.
- Staff/admin role is recognized.
- Admin/Staff platform opens.
- Staff can access the required operational order controls.

### Files to inspect

- `src/scripts/00-localization.js`
  - `openAuthModal()`
  - legacy `handleLogin()`
  - `initializeSupabaseAuth()`
  - `onAuthStateChange`
- `src/scripts/56-s2d-admin.js`
- Any later script that reads `STATE.user.role`, `STATE.user.roles`, or admin identity.

### Important architecture note

The current frontend contains two authentication-era paths:

1. Legacy localStorage/hash-password login behavior in `handleLogin()`
2. Supabase Auth session initialization in `initializeSupabaseAuth()`

The developer should trace which path the actual UI uses and eliminate contradictory authority. Do not assume the existence of an Auth user automatically means the legacy `getUsers()` flow will work.

---

## FIND-BE-030 — Base Cart Stock Guard gap

### Severity
**High — Cart correctness / commerce safety**

### Status
**RESOLVED / VERIFIED — Restore-Test**

### Finding

The base-product Cart writer, public.velora_upsert_cart_item(...), did not enforce:
existing Cart quantity + requested quantity <= product stock.

This allowed a base product to be added to Cart beyond available stock, violating the agreed **No add-then-fail** Cart principle.

### Remediation

Cart hardening migrations:

- supabase/migrations/20260921120000_cart_base_product_stock_guard.sql
- supabase/migrations/20260921123000_cart_base_product_stock_guard_null_existing_fix.sql

The second migration corrected a verification-discovered NULL case where PL/pgSQL SELECT INTO returned NULL when no existing Cart row was present.

Final behavior:

- product row locked with FOR UPDATE;
- empty Cart quantity normalized to 0;
- existing + requested compared to product.stock;
- over-capacity rejected with INSUFFICIENT_STOCK;
- requested increment is atomic;
- product inventory is not decremented at Cart Add.

### Verification

Restore-Test transaction-scoped verification passed:

- request above stock rejected;
- valid add succeeded;
- existing quantity + requested quantity above stock rejected without modifying existing quantity;
- exact remaining capacity succeeded;
- full Cart + one more rejected without modification;
- product stock unchanged;
- test Cart state cleaned.

Evidence:
docs/FIND-BE-030_BASE_CART_STOCK_GUARD_EVIDENCE_2026-09-21.md

### Boundary

No Checkout, Order Creation, Price, Currency, Routine, or Production changes were made.

---

# Shared developer checklist

## Before changing code

1. Run the app locally with a real local HTTP server.
2. Use the **Restore-Test** Supabase project for testing.
3. Verify the test users by email in `auth.users`; do not rely on copied UUIDs from old notes.
4. Confirm the canonical fixture:
   - **Test Vitamin C Serum**
   - status = approved
   - price = 250
   - currency = EGP
   - stock > 0
5. Record the exact browser console error and Network request for every failed path.

## Checkout debugging rule

Do not patch blindly.

For Place Order, first prove the chain:

`DOM submit → handler → session → cart mapping → currency → RPC request → RPC response → UI success/navigation`

A fix is not considered valid until every link is observed working locally.

## Authentication debugging rule

Use Supabase Auth as the identity source for canonical commerce operations.

Do not allow legacy localStorage user state to silently disagree with the active Supabase session.

## Acceptance after local repair

The developer must be able to demonstrate locally:

- Customer login
- canonical product discovery
- Add to Cart
- Checkout
- COD
- Order creation
- Customer My Orders
- Seller order visibility
- Staff order workflow
- S2-C Reviews
- S2-B Wishlist
- S2-E Notifications
- S2-D Admin
- mobile sanity test
- EN/AR/ES localization sanity test

## Production rule

**NO PRODUCTION DB MIGRATIONS, NO PRODUCTION DATA CHANGES, NO PRODUCTION DEPLOYMENT until Owner explicitly approves GO.**
