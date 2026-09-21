# Velora — FIND-BE-030 Evidence
## Base Cart Stock Guard — 2026-09-21

**Finding:** FIND-BE-030 — Base Cart Stock Guard gap
**Scope:** Cart hardening only
**Environment:** Restore-Test (arlaxqmhtvjwjbjinjfw)
**Production:** **FROZEN**
**Browser:** Not part of this gate
**Status:** **RESOLVED / VERIFIED — Restore-Test**

## 1. Finding Definition

The canonical base-product Cart writer:
public.velora_upsert_cart_item(uuid, integer, text)

previously verified only that the product was approved. It did not enforce:
existing_cart_quantity + requested_quantity <= product.stock
before the Cart upsert.

That violated the agreed Cart principle:
**No add-then-fail.**

## 2. Required Behavior

Base-product Cart Add must:
1. authenticate using auth.uid();
2. validate quantity;
3. lock the canonical product row with FOR UPDATE;
4. read the authenticated customer's existing base-product Cart quantity;
5. treat a missing Cart row as quantity 0;
6. reject when existing + requested > stock with INSUFFICIENT_STOCK;
7. otherwise perform the existing append/increment upsert.

The Cart operation must not decrement inventory.

## 3. Implementation

### Initial migration

supabase/migrations/20260921120000_cart_base_product_stock_guard.sql

Applied to Restore-Test.

The first implementation used a scalar SELECT ... INTO for the existing Cart quantity.

### Verification-discovered correction

The first transaction harness exposed a real implementation defect:
- no existing Cart row caused PL/pgSQL SELECT ... INTO to assign NULL;
- the comparison 23 < (NULL + 24) evaluated to NULL;
- the guard therefore did not reject the request.

This was **not counted as PASS**.

Correction migration:
supabase/migrations/20260921123000_cart_base_product_stock_guard_null_existing_fix.sql

The corrected implementation uses:
select coalesce(max(ci.quantity), 0) into v_existing
so the empty-Cart case is explicitly zero.

## 4. Final Verification — Restore-Test

Authoritative fixture:
- Product: Test Vitamin C Serum
- Product ID: 21d977a0-111b-4bb4-9736-0f2994294d48
- Status: approved
- Stock: 23
- Currency: EGP
- Active variants: 0

Authenticated test identity:
83f3f4a6-451c-416f-96ba-1aab66beeccc

Transaction-scoped results:

| Test | Result |
|---|---|
| Empty Cart + request 24 > stock 23 | **PASS** — INSUFFICIENT_STOCK, Cart qty remained 0 |
| Add 2 | **PASS** — Cart qty = 2 |
| Existing 2 + request 22 > stock | **PASS** — INSUFFICIENT_STOCK, Cart qty remained 2 |
| Existing 2 + request 21 = stock | **PASS** — Cart qty = 23 |
| Existing 23 + request 1 > stock | **PASS** — INSUFFICIENT_STOCK, Cart qty remained 23 |
| Product stock during Cart Add | **PASS** — remained 23 |

All test-created Cart state was removed after verification.

Final clean-state check:
- test user carts = 0
- test product Cart items = 0
- product stock = 23

## 5. Security / Function Contract

Final Base Cart function inspection:
- SECURITY DEFINER = true — retained from the existing Cart writer security model;
- anon EXECUTE = false;
- authenticated EXECUTE = true;
- product row uses FOR UPDATE;
- identity is derived from auth.uid();
- no client owner UUID argument exists.

Variant Cart writer symmetry was also inspected:
- variant path uses FOR UPDATE;
- base and variant use distinct semantic errors:
  - base = INSUFFICIENT_STOCK
  - variant = INSUFFICIENT_VARIANT_STOCK.

## 6. Atomicity Principle

The implementation does not partially add a requested quantity.

Examples verified:
- 2 existing + 22 requested → rejected, remains 2;
- 23 existing + 1 requested → rejected, remains 23.

The Cart write is therefore **all-or-nothing for the requested increment**.

## 7. Boundaries Preserved

No changes were made to:
- Cart schema;
- Checkout;
- Order creation;
- Price model;
- Currency model / F-008;
- Routine Engine;
- Production.

## 8. Browser Gate

This finding is SQL/source-level only.
Browser verification remains separate and is not inferred from this evidence.

## 9. Status

**FIND-BE-030 = RESOLVED / VERIFIED — Restore-Test**

Next engineering dependency:
**Routine → Cart Integration**
