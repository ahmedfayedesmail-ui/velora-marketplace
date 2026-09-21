# Velora — Unified Browser Gate Owner Checklist
## Owner Pre-Read / Execution Layer — 2026-09-21

**Status:** LOCKED — OWNER APPROVED — 2026-09-21  
**Parent spec:** `docs/UNIFIED_BROWSER_GATE_EXECUTION_PLAN_2026-09-21.md`  
**Branch:** `sprint-2-s2d-admin`  
**Source baseline at checklist drafting:** `8d35d7c74c148c3f76087630baf5af3d276d375b`  
**Production:** **FROZEN**

> This checklist is designed for execution in a real browser. Checking a box means the observation was actually made in the browser; it is not a source/SQL assertion.

---

## How to use this checklist

For each gate:

**Do → Expect → Record → Decide**

Use:
- ✅ = observed and passed
- ❌ = observed failure
- ⏭️ = blocked/not executable
- 🔎 = needs investigation

Never skip a failed step just to continue the flow.

### Evidence placeholder

- Screenshot: `[ ]`
- Console excerpt: `[ ]`
- Network request/response: `[ ]`
- DB correlation (when required): `[ ]`
- Lifecycle: `Observed / Fixed / Browser Verified / Closed`

---

# BG-01 — Console / Network Foundation

### Open app
- [ ] Open the intended local/Preview build.
- [ ] Wait for page/network idle.
- [ ] Capture initial console.
- [ ] Capture unexpected 4xx/5xx requests.

**Expect:** no unexplained runtime exception and no unexplained request failure.

### Login baseline
- [ ] Perform one customer login.
- [ ] Capture Auth-related requests.
- [ ] Check console again.

**Expect:** no unexplained 400/401 and no duplicate listener symptoms.

**STOP when:** an unexplained error appears on the primary path. Record it before continuing.

---

# BG-02 — Auth / Session Sanity

## Customer
- [ ] Login as the dedicated customer test identity.
- [ ] Confirm authenticated state.
- [ ] Refresh.
- [ ] Navigate Home → Shop → Account.
- [ ] Confirm identity remains coherent.
- [ ] Sign out.

**Expect:** no silent redirect, no identity mismatch.

## Seller
- [ ] Login as seller test identity.
- [ ] Confirm Seller Center opens.
- [ ] Refresh.
- [ ] Sign out.

## Staff/Admin
- [ ] Login as staff test identity.
- [ ] Confirm Staff/Admin platform opens.
- [ ] Refresh.
- [ ] Sign out.

**Evidence:** record identity label only; never record passwords.

---

# BG-03 — Cart Foundation

## 03A Manual Base Product
- [ ] Login as customer.
- [ ] Open Shop.
- [ ] Open canonical approved EGP product.
- [ ] Add once.
- [ ] Open Cart.
- [ ] Refresh.
- [ ] Inspect quantity and price.

**Expect:** one correct canonical Cart line, quantity 1, current catalog price, persists after refresh.

## 03B Manual Variant
- [ ] Open a product with active variants.
- [ ] Select a specific variant.
- [ ] Add once.
- [ ] Open Cart.
- [ ] Inspect variant name/attributes/SKU/price.

**Expect:** exact variant line; no conversion to base line.

## 03C Routine → Cart
- [ ] Use a completed v2 Passport.
- [ ] Open Routine.
- [ ] Inspect AM/PM steps.
- [ ] Click **اطلبي الروتين كله**.
- [ ] Open Cart.

**Expect:** selected Routine items are appended; unavailable selections are skipped and explained.

## 03D De-dup / Idempotency
- [ ] Record current Cart quantities.
- [ ] Return to the same Routine.
- [ ] Click **اطلبي الروتين كله** again.
- [ ] Re-open Cart.

**Expect:** exact existing lines are not incremented; no duplicate exact product+variant lines.

## 03E Mixed Availability
- [ ] Use a controlled Restore-Test fixture.
- [ ] Make one selected item unavailable.
- [ ] Click Routine → Cart.
- [ ] Inspect Routine feedback.
- [ ] Inspect Cart.

**Expect:** available items added; unavailable item skipped; reason visible; no whole-routine failure.

**STOP when:** Cart visible state disagrees with canonical cloud state.

---

# BG-04 — Checkout / FIND-BE-015

- [ ] Start from a non-empty Cart.
- [ ] Open Checkout.
- [ ] Confirm Cart contents match.
- [ ] Fill required shipping fields.
- [ ] Select Cash on Delivery.
- [ ] Click Place Order.
- [ ] Inspect Network for canonical checkout RPC.
- [ ] Inspect response.
- [ ] Inspect resulting UI.
- [ ] Re-open Cart.

**Expect:**
- checkout renders the same items;
- canonical `velora_create_order` request occurs;
- response is successful with an order number;
- no silent navigation;
- Cart clears only after successful order creation.

**STOP when:** order creation fails silently or Cart is cleared before success.

---

# BG-05 — Orders / Seller / Admin Consequence

## Customer
- [ ] Open My Orders.
- [ ] Find the newly created order.
- [ ] Compare total, currency, product/variant, quantity.

## Seller
- [ ] Open Seller Orders.
- [ ] Find same order.
- [ ] Compare quantity and order-item representation.

## Staff/Admin
- [ ] Open Admin Orders.
- [ ] Find same order.
- [ ] Open order detail.
- [ ] Verify expected order items.
- [ ] Verify allowed order status controls.

**Expect:** same canonical order is visible according to each role's permissions.

---

# BG-06 — Routine UX / Quiz v2 / Returning User

## New / incomplete Passport
- [ ] From Home click **اعرفي روتينك**.
- [ ] Answer all 3 questions.
- [ ] Select explicit **مش عارفة** where appropriate.
- [ ] Save/build routine.

**Expect:** v2 save succeeds; Routine opens only after successful save.

## Routine presentation
- [ ] Verify AM section.
- [ ] Verify PM section when available.
- [ ] Verify product + variant.
- [ ] Verify reason text.
- [ ] Verify total/currency.
- [ ] Check for internal metadata leakage.

## Returning user
- [ ] Refresh/re-enter Home with v2-complete Passport.
- [ ] Confirm CTA becomes **شوفي روتينك**.
- [ ] Click it.

**Expect:** Routine opens directly; Quiz is not forced.

## Edit answers
- [ ] Open Routine.
- [ ] Click **عدّلي إجاباتك**.
- [ ] Change an answer.
- [ ] Save.
- [ ] Re-open Routine.

**Expect:** updated Passport drives the next Routine.

---

# BG-07 — Sprint 2 Residuals

- [ ] F-003 Desktop Scroll check.
- [ ] F-004 Screen Consistency check.
- [ ] FIND-BE-020 Dark Mode check.
- [ ] S2-D Admin residual checks.

For every residual:
- [ ] Reproduce.
- [ ] Capture evidence.
- [ ] Record lifecycle state.

---

# BG-08 — Presentation Regression

## Desktop
- [ ] Home
- [ ] Shop
- [ ] Product
- [ ] Cart
- [ ] Checkout
- [ ] Routine
- [ ] Admin where applicable

## Mobile
- [ ] Repeat critical customer flow at narrow width.
- [ ] Check horizontal overflow.
- [ ] Check modal/form clipping.

## Dark mode
- [ ] Repeat core customer surfaces.
- [ ] Check contrast/readability.
- [ ] Check Routine + Cart feedback.

## EN / AR
- [ ] Switch language.
- [ ] Repeat key customer flow.
- [ ] Check language consistency.
- [ ] Check currency display.

**Expect:** no new console/network errors and no customer-visible state regression.

---

# BG-09 — Data Protection / Deletion Readiness

**This is primarily a launch/compliance gate, not a browser-only gate.**

- [ ] Confirm approved deletion workflow exists.
- [ ] Confirm target identity/ownership.
- [ ] Capture pre-test data state.
- [ ] Execute deletion only in Restore-Test.
- [ ] Capture resulting state.
- [ ] Verify no cross-user deletion.
- [ ] Verify retention exceptions are handled separately where applicable.
- [ ] Verify backups/logs/storage/exported copies have a documented treatment.

**Production:** never test deletion in Production.

---

# Stop Conditions

Stop and classify before continuing when:

- [ ] unexplained 400/401 appears;
- [ ] authenticated identity changes unexpectedly;
- [ ] Cart UI disagrees with server Cart;
- [ ] Checkout fails silently;
- [ ] order creation and UI diverge;
- [ ] cross-user data appears;
- [ ] Routine fabricates an unavailable item;
- [ ] a security regression is observed.

---

# Session Closeout

- [ ] Every failed item has an evidence record.
- [ ] Every PASS has browser evidence.
- [ ] No Browser PASS was inferred from SQL/source.
- [ ] All test data is cleaned from Restore-Test.
- [ ] Production remains FROZEN.
- [ ] Lifecycle states updated:
  - [ ] Observed
  - [ ] Fixed
  - [ ] Browser Verified
  - [ ] Closed

## Report paste template

`TEST-ID:`  
`Environment:`  
`Actor:`  
`Precondition:`  
`Action:`  
`Expected:`  
`Observed:`  
`Console:`  
`Network:`  
`DB correlation:`  
`Evidence:`  
`Lifecycle:`

---

**Approval state:** OWNER APPROVED — LOCKED

Owner checklist review before the browser session is for familiarization only; it is not a technical re-review of the parent execution plan.
