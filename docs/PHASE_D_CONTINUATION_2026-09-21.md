# Velora — Phase D Continuation
## D1 Seller Onboarding Schema + D2 Gap Register + D3 Legal Placeholder
### 2026-09-21

**Status:** SPECIFICATION ONLY  
**Production:** FROZEN  
**Browser Gate:** LOCKED  
**No schema/UI implementation authorized**

## D1 — Seller Onboarding Schema

### 1. Boundary

Keep `public.sellers` as the canonical operational seller identity.

Use a separate onboarding-case record for the evidence/review lifecycle rather than overloading the seller's core identity row.

Proposed table: `public.seller_onboarding_cases`

### 2. Fields

| Field | Type | Rule |
|---|---|---|
| id | uuid | PK, gen_random_uuid() |
| seller_id | uuid | NOT NULL, UNIQUE FK → sellers.id |
| application_status | text | draft / submitted / in_review / approved / rejected |
| identity_status | text | pending / in_review / verified / rejected |
| authenticity_status | text | pending / in_review / verified / rejected / not_required |
| catalog_status | text | pending / in_review / approved / rejected |
| sla_status | text | pending / accepted / rejected |
| pilot_status | text | not_started / active / passed / failed |
| legal_name | text | optional until legal onboarding requirements finalized |
| business_name | text | seller-facing registered business/store name |
| contact_name | text | operational contact |
| contact_channel | text | email / phone / whatsapp / other |
| evidence_refs | jsonb | references to retained onboarding evidence; no secrets |
| review_notes | text | internal reviewer notes |
| reviewer_user_id | uuid | nullable internal reviewer |
| submitted_at | timestamptz | nullable |
| reviewed_at | timestamptz | nullable |
| activated_at | timestamptz | nullable |
| rejected_at | timestamptz | nullable |
| rejection_reason | text | nullable |
| created_at | timestamptz | now() |
| updated_at | timestamptz | now() |

### 3. Lifecycle

`draft → submitted → in_review → approved → pilot active → passed`

Exception:
`in_review → rejected`

Suspension belongs to the existing seller operational state and must not be duplicated as a second hidden seller-status machine.

### 4. D1 acceptance gate

Seller is Beta-ready only when:
- identity verified;
- authenticity process complete;
- catalog review passed;
- SLA accepted;
- operational contact recorded;
- legal acceptance state is available after counsel approval.

Commercial terms stay outside this schema until Owner decides them.

---

## D2 — Fulfillment Gap Register

Existing planning confirms:
- Curated Sellers is the MVP model;
- order_items / shipments / shipment_items already exist;
- split shipments are allowed conceptually;
- shipping-provider identity remains intentionally unselected.

### Still missing before Beta

1. **Carrier/provider decision**
   - contracted provider;
   - commercial terms;
   - service coverage.

2. **SLA thresholds**
   - seller acceptance;
   - preparation;
   - dispatch;
   - exception response.

3. **Cost allocation**
   - customer shipping charge;
   - seller contribution;
   - Velora subsidy;
   - return shipping treatment.

4. **Exception ownership**
   - late dispatch;
   - lost parcel;
   - seller cancellation;
   - partial delivery;
   - one-seller-fails / another-succeeds.

5. **Reverse logistics**
   - pickup/drop-off model;
   - seller inspection;
   - refund/replacement routing.

6. **Status normalization**
   - provider → Velora shipment status map;
   - customer-safe status copy.

7. **Operational evidence**
   - timestamps;
   - tracking references;
   - dispute evidence retention.

8. **Beta SOP**
   - who monitors queues;
   - escalation window;
   - customer communication template;
   - seller remediation workflow.

D2 is therefore not blocked by a missing base table; it is blocked by operating decisions and final provider/process inputs.

---

## D3 — Legal Placeholder Pack

This is a handoff skeleton for local legal counsel.

### Required documents

1. Terms of Service
2. Privacy Policy
3. Refund / Return Policy
4. Seller Agreement
5. Recommendation Disclaimer
6. Authenticity Policy

### Per-document metadata

```
document_id:
title:
owner:
version:
status: placeholder | legal_review | approved | superseded
effective_date:
last_reviewed:
jurisdiction:
notes:
```

### Placeholder questions for counsel

#### Terms
- Define Velora's role in marketplace transactions.
- Define seller obligations.
- Define order formation/payment.
- Define complaint/dispute process.
- Define suspension/termination.

#### Privacy
- Inventory collected customer data.
- Confirm lawful basis / notices required for Beauty Passport data.
- Confirm seller/carrier/service-provider sharing.
- Confirm retention/deletion and customer rights.

#### Recommendation Disclaimer
- State that Beauty Passport is shopping/product-selection guidance.
- Explicitly separate from medical diagnosis/treatment.
- Confirm wording for escalation to professional advice.

#### Authenticity
- Seller responsibility;
- accepted evidence;
- audit/complaint handling;
- temporary product suspension;
- customer remedy path.

#### Returns/Refunds
- Eligibility and statutory exceptions;
- defective product handling;
- split-shipment implications;
- refund timing/method;
- shipping-cost treatment.

#### Seller Agreement
- identity and onboarding;
- product truthfulness;
- authenticity;
- stock accuracy;
- order SLA;
- returns/refunds;
- complaints;
- commercial terms;
- suspension/termination.

### D3 handoff rule

Engineering may implement approved text/versioning later.

Engineering must not:
- invent legal clauses;
- decide legal liability;
- decide statutory obligations;
- decide refund economics;
- encode legal policy inside the Routine Engine.

---

## Exit state for this document

D1 = schema ready for review.  
D2 = missing-decision register complete.  
D3 = counsel placeholder pack ready.

No Production, SQL migration, or source change is part of this document.
