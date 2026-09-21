# Velora — FIND-BE-027 Data Protection / Deletion Readiness Prep
## Owner / Legal Pre-Read — 2026-09-21

**Finding:** FIND-BE-027  
**Current status:** OPEN / PRE-LAUNCH  
**Environment for technical testing:** Restore-Test only  
**Production:** **FROZEN**

> This document is engineering/compliance preparation, not a legal opinion. Final legal applicability, entity/controller/processor roles, retention periods, notices, licensing, and cross-border requirements require Owner/legal review.

## 1. Terminology correction

The existing finding is named “GDPR Deletion Flow,” but Velora's current approved product direction is Egypt-first.

For the pre-launch review, the broader working title should be:

**Data Protection / Deletion Readiness**

The primary framework to assess for the Egypt-first operation is Egypt's Personal Data Protection Law No. 151 of 2020 and its Executive Regulations No. 816 of 2025. The Egyptian PDPC states that the Executive Regulations were published in the Official Gazette on 1 November 2025 and that a one-year compliance period begins from their effective date. The PDPC FAQ is the current official reference: https://www.pdpc.gov.eg/faq

GDPR should be treated as a separate applicability assessment. Article 3 of the GDPR covers, among other cases, processing by a non-EU controller/processor connected to offering goods/services to people in the EU or monitoring their behavior in the EU. The EDPB notes that the mere presence of a person in the EU is not by itself sufficient; the targeting criterion matters. References: EUR-Lex GDPR Article 3: https://eur-lex.europa.eu/eli/reg/2016/679/ojv ; EDPB territorial-scope guidance: https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-32018-territorial-scope-gdpr_en

## 2. Data inventory to prepare

Map every personal-data class used by Velora:

### Account / identity
- authentication identity;
- email;
- profile identifiers;
- customer/seller/staff role associations.

### Commerce
- customer name;
- phone;
- email;
- city;
- address;
- order history;
- payment-related records;
- seller/order relationships.

### Beauty / personalization
- beauty profile;
- skin-type selection;
- cosmetic goal;
- routine budget;
- recommendation runs/items;
- beauty feedback.

Do not classify every Beauty field as “health data” automatically. The exact legal classification and purpose should be reviewed with counsel.

## 3. Processing map

For every dataset record:

- purpose;
- source;
- controller;
- processor/subprocessor;
- storage location;
- access roles;
- retention period;
- deletion behavior;
- legal basis;
- cross-border transfer path;
- backup/log/storage copies.

The PDPC states that the Egyptian framework regulates collection, processing, storage, use, and transfer of electronic personal data, and identifies controller, processor, data holder, and DPO roles. Official PDPC reference: https://www.pdpc.gov.eg/

## 4. Deletion workflow questions

Owner/legal must decide:

1. What exactly can the customer request to delete?
2. Which account/profile records are deleted immediately?
3. Which transaction/order records must be retained?
4. Which legal or accounting records are retained despite an account deletion request?
5. What happens to Beauty Passport, Routine, recommendation history, and feedback?
6. What happens to backups?
7. What happens to application logs and audit records?
8. What happens to uploaded/exported copies?
9. What confirmation is returned to the user?
10. Who is authorized to execute the deletion?

## 5. Technical verification target

After the policy is approved, the engineering acceptance test should prove:

`Authenticated request → ownership check → deletion workflow → allowed retention exceptions → post-delete verification`

Technical testing must occur on Restore-Test only.

The existing database cascade behavior is useful but is not sufficient by itself to prove a complete privacy/deletion process.

## 6. Rights / notice preparation

The PDPC identifies data-subject rights including information, access, withdrawal, rectification, erasure, and breach notification. The final user-facing privacy notice and request workflow should be mapped to the actual processing model rather than copied from a generic GDPR template. Official PDPC FAQ: https://www.pdpc.gov.eg/faq

## 7. Breach readiness

The PDPC FAQ currently states a 72-hour notification period to the PDPC after becoming aware of a breach and notification to affected data subjects within 3 working days from the PDPC notification, subject to the law/regulations and applicable exceptions. This should be verified against the final legal assessment and incident process before launch. Official PDPC FAQ: https://www.pdpc.gov.eg/faq

## 8. Cross-border readiness

The PDPC FAQ states that cross-border transfer of personal data outside Egypt requires the applicable prior license/permit or an applicable exception under the law. This matters for any external hosting, analytics, messaging, support, payment, or other subprocessors whose processing/transfer falls within the framework. Official PDPC FAQ: https://www.pdpc.gov.eg/faq

## 9. DPO / licensing checkpoint

The PDPC states that the framework includes DPO registration and licensing/permit categories for controller/processor activity and cross-border data transfer. The Owner/legal workstream must determine which registrations, licenses, permits, or accredited roles actually apply to Velora's legal entity and processing activities. Official PDPC reference: https://www.pdpc.gov.eg/

## 10. Owner decision list

### Owner / Legal decision required
- [ ] Legal entity and role(s) under the Egyptian framework
- [ ] Controller / Processor relationships
- [ ] DPO requirement / registration
- [ ] Applicable licenses/permits
- [ ] Legal bases for each processing purpose
- [ ] Retention schedule
- [ ] Order/accounting retention exceptions
- [ ] Privacy notice content
- [ ] Direct-marketing consent model, if marketing is enabled
- [ ] Cross-border transfer assessment
- [ ] Subprocessor contracts / DPAs
- [ ] Deletion confirmation standard
- [ ] GDPR applicability for any EU-targeted operation

### Engineering preparation
- [ ] Build complete data inventory
- [ ] Map FK cascade / SET NULL / RESTRICT behavior
- [ ] Map Auth identity deletion path
- [ ] Map storage/log/backup copies
- [ ] Document audit-log treatment
- [ ] Prepare Restore-Test deletion harness
- [ ] Prepare post-delete verification queries
- [ ] Keep Production untouched

## 11. Current status

**FIND-BE-027 = OPEN / PREP**

No deletion implementation is authorized by this document.

No Production data should be deleted or modified.

The purpose of this pre-read is to convert the open finding into a precise Owner/legal decision set before engineering implementation.
