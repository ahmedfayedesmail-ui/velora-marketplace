# Velora — Unified Browser Gate Execution Plan
## 2026-09-21

**Branch:** `sprint-2-s2d-admin`  
**HEAD at plan:** `18a8a0e6f1e4ffe04c8196932d4a028ff451dbcf`  
**Preferred environment:** local HTTP server; Vercel Preview may be used when required  
**Restore-Test:** `arlaxqmhtvjwjbjinjfw`  
**Production:** **FROZEN — no production mutation or GO**  
**Browser execution status:** **NOT AVAILABLE IN CURRENT AGENT RUNTIME**; execute when Owner has Chrome/browser access.

---

## 1. Gate Discipline

Every item follows:

**Observed → Fixed → Browser Verified → Closed**

Definitions:

- **Observed:** browser evidence shows a failure/behavior.
- **Fixed:** source/database remediation exists.
- **Browser Verified:** the exact user flow passes in a real browser with console/network evidence.
- **Closed:** acceptance criteria and evidence are complete.

Never infer Browser PASS from:
- source inspection;
- SQL PASS;
- Vercel deployment success;
- static syntax checks.

---

## 2. Execution Order

The batch is dependency-ordered:

### BG-01 — Console / Network Foundation
**Finding:** FIND-BE-023

Goal:
- establish a clean baseline before testing feature flows;
- correlate browser console errors with Network and Supabase activity.

Flow:
1. Open target build.
2. Wait for network idle.
3. Capture initial console.
4. Capture Network requests for page load.
5. Login.
6. Repeat after major page transitions.

Expected:
- no unexplained 400/401 requests;
- no uncaught runtime exceptions;
- no duplicate listener behavior;
- failed requests, if any, have an explainable source and expected authorization context.

Evidence:
- console capture;
- Network request/response details for every unexpected 4xx/5xx;
- screenshot only when UI state is relevant.

**Exit:** FIND-BE-023 can move from Open only when the observed errors are classified and dispositioned.

---

### BG-02 — Authentication / Session Sanity

Roles:
- Customer
- Seller
- Staff/Admin

For each:
1. open login;
2. authenticate with the dedicated test identity;
3. verify session;
4. verify role-specific landing/platform;
5. refresh;
6. navigate away and back;
7. verify session remains coherent;
8. sign out.

Expected:
- correct Supabase Auth identity;
- no contradictory legacy/localStorage identity;
- correct role behavior;
- no silent redirect on success;
- refresh does not break identity.

Do not record or place credentials/passwords in evidence.

---

### BG-03 — Cart Foundation

This is the commerce foundation before Checkout.

#### BG-03A — Manual base product

Flow:
`Login → Shop → canonical product → Add to Cart → Cart`

Expected:
- correct canonical product;
- current catalog price;
- correct quantity;
- no duplicate line;
- cart persistence after refresh.

#### BG-03B — Manual variant

Flow:
`Login → canonical product with variants → choose variant → Add to Cart → Cart`

Expected:
- exact variant line;
- variant name/attributes shown;
- live variant price shown;
- correct quantity;
- no accidental conversion to base line.

#### BG-03C — Routine → Cart

Flow:
`Completed Passport → See my routine → Routine → Order the whole routine → Cart`

Expected:
- selected Routine items are appended;
- existing exact item is not incremented;
- base and variant keys remain distinct;
- unavailable items are skipped and explained;
- successful items remain;
- Cart shows current catalog representation.

#### BG-03D — Idempotency

Repeat `Order the whole routine`.

Expected:
- no duplicate exact lines;
- existing quantities are not incremented by the Routine button;
- Cart remains stable.

#### BG-03E — Live catalog / race semantics

Where feasible in Restore-Test:
1. open Routine;
2. alter test stock/variant availability through a controlled test fixture;
3. trigger Routine → Cart;
4. observe skip behavior.

Expected:
- preflight detects obvious unavailability;
- server RPC remains authoritative for races;
- `INSUFFICIENT_STOCK` / `INSUFFICIENT_VARIANT_STOCK` becomes skip + explanation;
- no partial quantity;
- no whole-routine failure.

Do not change production data.

---

### BG-04 — Checkout Blocker

**Finding:** FIND-BE-015

Canonical flow:

`Login → Shop → Product → Add to Cart → Checkout → Shipping → COD → Place Order`

Expected:
1. Cart is non-empty.
2. Checkout renders the same Cart.
3. Shipping fields persist.
4. COD selection persists.
5. Place Order sends the canonical `velora_create_order` RPC.
6. RPC succeeds.
7. Order number is returned.
8. Cart clears only after successful order creation.
9. User reaches the intended success/My Orders state.

Network proof required:
- request goes to the canonical checkout RPC;
- payload currency matches the Cart/product;
- response contains `ok=true` and order number.

Failure proof:
- no silent Home navigation;
- no Cart clearing on failed order;
- no hidden RPC failure.

---

### BG-05 — Orders / Seller / Admin Consequence Chain

This validates the downstream effects of BG-04.

#### Customer
- My Orders contains the newly created order.
- order total/currency matches checkout.
- order items match purchased product/variant and quantity.

#### Seller
- seller order list contains the same order.
- item quantity and financial fields are internally consistent.

#### Staff/Admin
- order appears in Admin Orders.
- order detail exposes the expected items.
- authorized order-state transition behavior is available.

This gate should use the order created in BG-04 whenever the test fixture permits it, avoiding unnecessary duplicate fixtures.

---

### BG-06 — Routine UX + Quiz v2 + Returning User

#### BG-06A — New / incomplete Passport

Expected:
`اعرفي روتينك` → Quiz v2.

Minimum:
- three questions;
- skin type;
- goal;
- routine budget;
- explicit unknown values remain selectable/valid.

#### BG-06B — Save + Routine

Expected:
- v2 save succeeds;
- Routine opens only after successful save;
- Routine displays AM/PM structure;
- product + variant display;
- explanation is customer-safe;
- no internal metadata visible.

#### BG-06C — Returning user

With a v2-complete Passport:

Expected:
`شوفي روتينك` → Routine directly.

No forced repeat of Quiz.

#### BG-06D — Edit answers

Expected:
Routine → `عدّلي إجاباتك` → Quiz v2.

Saving changes should regenerate from the new Passport state.

#### BG-06E — Mixed availability feedback

Expected:
- inline feedback identifies added/already/skipped;
- skipped reasons are readable;
- missing step is understandable;
- no fabricated replacement.

---

### BG-07 — Sprint 2 Residuals

Order after the commerce chain is stable:

- F-003 Desktop Scroll
- F-004 Screen Consistency
- FIND-BE-020 Dark Mode
- S2-D Admin residuals

These are regression checks, not blockers that should be allowed to obscure the primary commerce chain.

---

### BG-08 — Final Presentation Regression

Run the agreed core flows at:

**Desktop**
- normal viewport

**Mobile**
- narrow viewport

**Theme**
- light
- dark

**Language**
- EN
- AR

Check:
- no horizontal overflow;
- no clipped modal/form controls;
- no duplicated hero/CTA/listener behavior;
- no mixed language strings in the tested flow;
- currency display remains consistent with the current Phase-1 EGP-first contract.

ES is a sanity check only where the existing UI exposes it; it does not reopen F-008.

---

### BG-09 — GDPR / Launch Prerequisite

**Finding:** FIND-BE-027

This is a release-readiness prerequisite, not a reason to mutate Production during the browser gate.

Test only against Restore-Test / approved test identity.

Expected:
- deletion flow requires the intended authenticated user;
- correct ownership is enforced;
- deleted user data follows the approved deletion contract;
- no cross-user deletion;
- authorization failures are explicit.

Evidence must include:
- pre-test identity/data state;
- deletion request/result;
- post-test cleanup verification.

Production remains untouched.

---

## 3. Cross-Gate Network Checklist

For every critical transition record:

**UI action → request → endpoint/RPC → payload → response → resulting UI state**

Priority requests:
- Auth/session calls
- canonical Cart RPCs
- canonical checkout RPC
- Routine generation RPC
- Passport v2 save RPC
- any failing Supabase REST request
- any Admin order-status RPC

When a 400/401 appears, capture:
- HTTP status;
- request URL;
- method;
- payload shape;
- response body;
- authenticated/anonymous state;
- preceding UI action.

Do not classify an error from the console line alone.

---

## 4. Browser Evidence Format

Each completed test gets one evidence record:

### Test ID
Example: `BG-03C-R2C-01`

### Environment
- local or Preview URL
- branch
- build/commit
- Restore-Test ref

### Actor
- Customer / Seller / Staff
- test identity label only, never password

### Preconditions
- exact required state

### Steps
Numbered browser actions.

### Expected
Concrete acceptance criteria.

### Observed
Concrete UI behavior.

### Console
- clean / specific errors

### Network
- relevant request(s)
- status
- response outcome

### Database Correlation
Only when required:
- order exists;
- order_items exists;
- payment exists;
- Cart state;
- relevant security/RLS result.

### Screenshots
Only for visually meaningful state or defect proof.

### Lifecycle
`Observed / Fixed / Browser Verified / Closed`

---

## 5. Stop Conditions

Stop the batch and repair before continuing when:

- authentication identity is inconsistent;
- unexplained 400/401 errors appear on the tested chain;
- Cart state differs between visible UI and canonical cloud state;
- Checkout fails silently;
- an order is created but Cart is not handled according to contract;
- an unavailable Routine item is fabricated/replaced;
- an Admin/Seller view exposes cross-user data;
- a security regression appears.

Do not patch while simultaneously continuing unrelated browser tests.

---

## 6. Owner / Engineer Boundary

### Engineer can execute autonomously
- source debugging;
- local reproduction;
- Restore-Test SQL;
- browser execution when browser access exists;
- evidence capture;
- non-commercial UI/technical fixes within approved scope.

### Owner-only
- Production GO;
- commercial terms;
- legal/entity decisions;
- commission/subscription/refund policy;
- carrier/commercial fulfillment selection;
- any production credential/provider decision;
- the five existing Owner decisions.

---

## 7. Recommended First Browser Session

When Chrome becomes available, do **not** start with cosmetic checks.

Run exactly:

`BG-01 → BG-02 → BG-03 → BG-04`

Reason:
this establishes the complete runtime chain before spending browser time on downstream views and presentation regression.

After BG-04 succeeds, continue:

`BG-05 → BG-06 → BG-07 → BG-08 → BG-09`

---

## 8. Current Status

At plan creation:

- FIND-BE-030: **Resolved / Verified — Restore-Test**
- FIND-BE-031: **Investigated / Deferred**
- Routine → Cart: **Source Complete / Browser Pending**
- Phase C: **Source Complete / Browser Pending**
- Phase D: **Planning Complete**
- FIND-BE-015: **Open**
- FIND-BE-023: **Open**
- FIND-BE-027: **Open**
- Production: **FROZEN**

**This document is an execution plan, not a Browser PASS.**
