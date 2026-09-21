# Velora — Browser Verification Pack
## Unified Gate Execution Layer — 2026-09-21

**Branch:** `sprint-2-s2d-admin`  
**Production:** FROZEN  
**Browser Gate:** LOCKED until a real browser session is available  
**Preferred environment:** local HTTP server; Vercel Preview fallback  
**Restore-Test:** `arlaxqmhtvjwjbjinjfw`

## 1. Purpose

This pack converts the approved Unified Browser Gate into an execution-ready runbook.

It does not claim any Browser PASS.

Lifecycle remains:

**Observed → Fixed → Browser Verified → Closed**

Source inspection, SQL verification, Vercel deployment success, and static checks are supporting evidence only.

## 2. First-session rule

When Chrome/browser access becomes available, run the critical transaction chain first:

`BG-01 → BG-02 → BG-03 → BG-04`

Only continue to BG-05/BG-06 after the primary chain is coherent.

BG-09 remains a parallel launch/compliance workstream.

## 3. Target environments

### Primary
Local branch build served over HTTP from:

`sprint-2-s2d-admin`

### Fallback
Current Vercel Preview for the same branch/commit, only if local browser execution is unavailable.

Before testing, record:
- URL;
- branch;
- commit SHA;
- Restore-Test ref;
- browser;
- viewport.

Never use Production for destructive or mutation testing.

## 4. Actors

Use the existing dedicated test identities already defined by the project.

Record:
- Customer / Seller / Staff label;
- successful/failed authentication;
- resulting role surface.

Never record passwords or private credentials in evidence.

## 5. Required browser instrumentation

Before the first click:
1. Open DevTools Console.
2. Open Network.
3. Enable Preserve Log.
4. Clear Console and Network.
5. Disable cache only when useful for a controlled reload.
6. Keep Network filters available for `fetch/xhr`.

For each unexpected 4xx/5xx, capture:
- request URL;
- method;
- status;
- request payload shape;
- response body;
- auth state;
- preceding UI action.

Do not classify a console line without correlating the underlying request where applicable.

## 6. Evidence naming

Recommended naming:

`BG-<gate>-<test-id>-<short-description>`

Example:

`BG-06-SENS-01-sensitive-passport`

For each test record:
- Test ID
- Environment
- Actor
- Preconditions
- Steps
- Expected
- Observed
- Console
- Network
- DB correlation when required
- Screenshot when visually meaningful
- Lifecycle state

## 7. Gate execution

### BG-01 — Console / Network Foundation

**Tests**
- BG-01-01 Initial page load
- BG-01-02 Customer login
- BG-01-03 First Home → Shop transition
- BG-01-04 First canonical product request

**Pass conditions**
- no unexplained uncaught exceptions;
- no unexplained 400/401;
- no duplicate listener symptom;
- failed requests have an identified owner/disposition.

**Stop**
Any unexplained failure on the primary path.

---

### BG-02 — Authentication / Session

Run for:
- Customer
- Seller
- Staff/Admin

For each:
1. open login;
2. authenticate;
3. verify intended platform;
4. refresh;
5. navigate away and back;
6. verify session;
7. sign out.

**Pass conditions**
- correct role;
- no identity contradiction;
- refresh-safe session;
- no silent redirect.

---

### BG-03 — Cart Foundation

#### BG-03-01 Manual base product
`Login → Shop → approved canonical product → Add → Cart → Refresh`

Expected:
- exact canonical product;
- quantity 1;
- current price;
- persistence after refresh.

#### BG-03-02 Manual variant
`Product with active variants → choose variant → Add → Cart`

Expected:
- exact variant;
- variant attributes/name;
- live variant price;
- no base-line substitution.

#### BG-03-03 Routine → Cart
`Completed Passport → Routine → اطلبي الروتين كله → Cart`

Expected:
- selected items append;
- exact duplicates not incremented;
- unavailable items skipped with truthful explanation.

#### BG-03-04 Routine idempotency
Repeat the whole-routine CTA.

Expected:
- no duplicate exact product+variant line;
- no quantity inflation.

#### BG-03-05 Mixed availability
Use Restore-Test controlled fixture.

Expected:
- available selections added;
- unavailable selection skipped;
- no fabricated replacement;
- remaining items still succeed.

---

### BG-04 — Checkout / FIND-BE-015

Flow:

`Non-empty Cart → Checkout → Shipping → COD → Place Order`

Required proof:
- Cart and Checkout agree;
- canonical `velora_create_order` request occurs;
- response contains successful result/order number;
- Cart clears only after successful creation;
- resulting My Orders state is correct.

**Failure rule**
Any silent failure or premature Cart clear stops this batch.

---

### BG-05 — Order Consequence Chain

Use the order created in BG-04 when possible.

Customer:
- My Orders contains order;
- total/currency match;
- items/variant/quantity match.

Seller:
- same order visible under seller permissions;
- quantity/financial semantics coherent.

Staff/Admin:
- order visible;
- detail shows expected order items;
- allowed status transition control is available.

---

### BG-06 — Routine / Quiz v2 / Returning User

#### BG-06-01 New Passport
`Home → اعرفي روتينك`

Verify:
- exactly 3 questions;
- skin type;
- goal;
- routine budget;
- explicit unknown option where available.

#### BG-06-02 Save + Routine
Verify:
- v2 save succeeds;
- Routine opens after save;
- AM/PM structure;
- product + variant;
- reason text;
- total/currency;
- no internal metadata leakage.

#### BG-06-03 Returning user
With a v2-complete profile:

Expected:
`شوفي روتينك` opens Routine directly.

#### BG-06-04 Edit answers
Expected:
`عدّلي إجاباتك` returns to Quiz v2; saving a changed answer changes the next Routine.

#### BG-06-05 Mixed availability
Expected:
- added/already/skipped feedback is truthful;
- no fabricated replacement.

---

### BG-07 — Sprint 2 Residuals

Run only after the primary flow is stable:
- F-003 Desktop Scroll
- F-004 Screen Consistency
- FIND-BE-020 Dark Mode
- S2-D Admin residuals

---

### BG-08 — Presentation Regression

Run critical paths on:
- Desktop
- Mobile
- Light
- Dark
- EN
- AR

Check:
- no horizontal overflow;
- no clipping;
- no mixed-language leakage in tested flow;
- currency remains consistent;
- no new console/network failures.

---

### BG-09 — Launch Compliance / Data Protection

Technical browser portion only where a user-facing deletion workflow exists.

Restore-Test only.

Verify:
- intended authenticated owner;
- no cross-user deletion;
- approved deletion semantics;
- retention exceptions handled separately;
- post-test cleanup verified.

Production deletion testing is prohibited by this runbook.

## 8. Universal pass/fail rule

A Browser PASS requires:
1. browser action performed;
2. expected state observed;
3. relevant console/network evidence captured;
4. no unexplained critical side-effect;
5. lifecycle updated to Browser Verified.

No Browser PASS may be inferred from:
- SQL;
- source;
- deployment;
- screenshots without the underlying interaction.

## 9. Session closeout

Before ending a browser session:
- every failed test has an evidence record;
- every PASS has browser evidence;
- all temporary Restore-Test data is cleaned;
- Production remains FROZEN;
- unresolved items are classified;
- no unrelated source changes are introduced during verification.

## 10. Owner / Engineer boundary

Engineer can execute:
- browser tests;
- Console/Network correlation;
- Restore-Test test fixtures;
- source debugging after an observed defect;
- technical evidence capture.

Owner-only:
- Production GO;
- legal/entity decisions;
- commission/subscription/refund economics;
- commercial carrier selection;
- production credentials/provider decisions.

## 11. Ready state

This pack is **READY FOR EXECUTION**.

The remaining dependency is not documentation. It is real browser access.

