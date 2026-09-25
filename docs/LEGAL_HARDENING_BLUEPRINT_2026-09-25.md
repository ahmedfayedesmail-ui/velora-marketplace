# Velora — Legal & Trust Hardening Blueprint
## Date: 2026-09-25
## Scope: Restore-Test / staging design only; Production remains frozen

> This document is a product/legal-engineering blueprint, not legal advice and not a substitute for review by an Egyptian lawyer before launch. It is intentionally written as a launch gate.

## 1. Legal posture

Velora must not rely on a Terms & Conditions clause to waive mandatory consumer rights. Egypt's Consumer Protection Law No. 181/2018 contains mandatory obligations, and Article 28 invalidates terms that reduce or exempt the supplier from obligations imposed by the law or its executive regulations.

The platform must therefore be designed around compliance-by-operation, not disclaimer-by-text.

## 2. Marketplace role

Before production launch, counsel must document Velora's legal role for each flow:
- marketplace/operator
- payment facilitator or merchant-of-record arrangement, if applicable
- seller-facing subscription provider
- advertising/promotion platform
- customer support / dispute-routing layer

Terms must state clearly which party sells the product, which party issues the applicable invoice/receipt, which party controls fulfillment, and when Velora is acting only as a marketplace technology/service layer.

Do not publish a blanket "Velora is never responsible for sellers" clause. The legal effect of such wording depends on the actual transaction structure and mandatory law.

## 3. Customer-facing legal documents

Create a versioned Legal Center with Arabic as a supported legal language and English as a secondary language.

Required documents:
1. Terms of Use / Customer Terms
2. Seller Terms & Marketplace Agreement
3. Privacy Policy
4. Cookie / Tracking Notice where applicable
5. Returns & Refunds Policy
6. Shipping & Delivery Policy
7. Cancellation Policy
8. Promotions / Coupons / Gift Cards Terms
9. Seller Subscription Terms
10. Commission & Payout Terms
11. Acceptable Use / Prohibited Products Policy
12. Dispute Resolution / Complaints process
13. Beauty Advisor / AI disclaimer
14. Product authenticity / seller verification policy
15. Copyright / IP / takedown procedure
16. Contact / legal notice with the operating entity's real legal name and contact details

## 4. Mandatory remote-sale disclosures

For customer checkout and product pages, the system should make the legally relevant information visible before contract formation, including:
- seller legal identity and contact details
- commercial registration / tax details where applicable
- manufacturer/importer information where applicable
- product source, essential characteristics, use instructions, and known risks
- full price and additional amounts such as taxes and shipping charges
- offer duration
- warranty and after-sales service where applicable
- delivery date/place and delivery charges
- return/withdrawal rules and applicable period
- contract information that will be delivered after purchase

The platform should store the exact legal/purchase presentation shown to the customer for the completed order.

## 5. Arabic-first legal rendering

Important customer-facing legal disclosures should not depend only on runtime translation. Store a versioned canonical Arabic legal document and a corresponding English document.

Checkout should block completion when mandatory legal acknowledgement is required but the current legal version has not been accepted.

Persist:
- document key
- version
- locale
- effective_at
- hash / immutable content reference
- accepted_at
- user_id
- order_id / subscription_id / seller_id where relevant
- acceptance source (checkout, seller onboarding, subscription purchase, etc.)

## 6. Seller protection and seller accountability

Every seller should pass an onboarding gate before selling:
- verified identity/business information
- commercial registration / tax information when applicable
- real business address and contact details
- bank/payout destination verification
- product-source / authenticity evidence for controlled categories
- acceptance of Seller Terms and Commission/Payout Terms
- prohibited-product acknowledgement
- shipping/fulfillment obligations acknowledgement

Seller-facing UI must show that seller-provided information is their responsibility and must remain accurate.

## 7. Product and beauty-safety controls

For beauty products, require structured product data and seller declarations where relevant:
- ingredients
- usage
- warnings / contraindications supplied by the manufacturer
- country of origin
- manufacturer/importer
- authenticity/source evidence where applicable
- expiry/batch information when applicable

The Beauty Advisor / routine engine must carry a prominent limitation:
- informational/personalization purpose
- not a diagnosis
- not a substitute for a dermatologist/doctor/pharmacist
- no guarantee of outcome
- user should follow product/manufacturer directions and seek qualified care for adverse reactions or medical concerns

## 8. Promotion / coupon / gift-card legal controls

Promotions must be backend-authoritative.

Every promotion/coupon/gift card record should be auditable with:
- issuer (Velora or seller)
- exact rule
- eligibility
- start/end
- usage limit
- redemption count
- customer restrictions
- eligible products/stores
- stacking rules
- refund/reversal behaviour
- displayed terms at the moment of redemption

Never let a client-side/localStorage discount become the final source of truth.

## 9. Money, commission and payouts

The canonical financial model should separate:
- customer gross amount
- discounts funded by Velora
- discounts funded by seller
- shipping charged to customer
- taxes
- payment-provider fees
- marketplace commission
- seller net earnings
- refunds/chargebacks
- payout eligibility
- payout amount
- payout status

Every financial mutation must be server-side and idempotent.

Seller balances should not be presented as "available" until the business rules say the funds are eligible for payout (for example after delivery/return/chargeback windows as defined by the final Seller Terms).

## 10. Payments and settlement

A payment option may only be shown as active when its provider integration is actually configured and verified for the relevant country/currency/environment.

Paymob callback verification must remain server-side and signed. Provider secrets must never appear in browser source.

The production launch gate must separately verify:
- provider account ownership
- merchant settlement account
- currencies/countries
- live credentials
- webhook signature verification
- refunds
- chargebacks/disputes
- settlement/reconciliation
- tax/invoice handling

## 11. Shipping and liability boundaries

For every order, persist:
- selected shipping service
- quoted price
- carrier (when used)
- tracking reference
- delivery estimate
- shipment status history
- delivery proof where applicable
- failed-delivery / return-to-sender event
- responsibility for loss/damage under the final shipping policy

A real carrier integration must not be implied by an empty carrier registry. Until integrated, manual tracking is the explicit fallback.

## 12. Returns, refunds and complaints

Build a governed workflow instead of a mailto-only or placeholder link.

The customer must be able to:
- start a return/refund request
- select a reason
- attach evidence where allowed
- see eligibility and deadlines
- see request status
- receive a decision
- receive refund status
- escalate to support

The system should preserve an audit trail for every decision and status transition.

## 13. Privacy and data protection

Velora should treat Egyptian Personal Data Protection Law No. 151/2020 as a launch dependency.

Implement:
- documented data-controller / processor roles
- purpose limitation and minimization
- consent records where consent is the legal basis
- withdrawal path
- privacy requests workflow
- retention schedule
- deletion/anonymization workflow
- access controls
- processor/vendor inventory
- cross-border transfer assessment and required approvals/consents where applicable
- breach/incident response procedure
- designated privacy responsibility / DPO assessment with counsel

The current Privacy Center and GDPR-style deletion workflow are useful foundations but do not by themselves prove legal compliance.

## 14. Tax and invoicing

Egyptian Tax Authority materials state that e-commerce activity is handled under the applicable income-tax and VAT framework and that electronic invoice/receipt obligations apply according to the taxpayer's status and the applicable mandatory phases.

Before launch:
- determine Velora's tax registration position
- determine each seller's obligations
- determine whether Velora issues invoices/receipts or sellers do
- define treatment of marketplace commissions
- define treatment of shipping and discounts
- connect the required e-invoice/e-receipt process where mandatory
- preserve tax evidence for every transaction

Do not hard-code a generic tax rate into the marketplace without tax counsel/accounting confirmation.

## 15. Contract evidence

For every legally meaningful user action, preserve an auditable event:
- registration acceptance
- seller onboarding acceptance
- legal-document version accepted
- subscription purchase/renewal
- promotion/coupon redemption
- order confirmation
- cancellation
- return/refund request
- dispute
- privacy request
- account enforcement action

Use immutable/versioned records and timestamps. Avoid relying on a mutable front-end checkbox alone.

## 16. Security and abuse

Keep the current source-hardening posture:
- no service-role keys in browser
- no Paymob secrets in browser
- no VAPID private key in browser
- server-side authorization for privileged actions
- RLS on customer/seller data
- audit logging for privileged mutations
- rate limiting / abuse protection
- replay protection for external webhooks
- controlled staff/owner access

## 17. Required launch gate

Do not mark legal readiness as PASS until all are true:
1. Final legal documents reviewed by Egyptian counsel.
2. Real operating entity/legal identifiers inserted.
3. Seller agreement finalized.
4. Customer remote-sale disclosures implemented in UI.
5. Privacy/data map reviewed.
6. Tax/invoicing model confirmed.
7. Returns/refunds workflow operational.
8. Promotion/coupon/gift-card terms implemented.
9. Seller KYC/business onboarding enforced.
10. Payment settlement and payout structure documented.
11. Carrier/shipping responsibility documented.
12. Contract acceptance/version evidence retained.
13. Complaint/dispute escalation path documented.
14. Beauty/AI safety wording reviewed.
15. Arabic legal content is canonical and reviewed.

## 18. Source basis checked on 2026-09-25

- Egypt Consumer Protection Agency: Consumer Protection Law No. 181/2018 and e-commerce guidance.
- Egyptian Tax Authority: e-commerce taxation guidance and electronic invoice/receipt requirements.
- ITIDA: Electronic Signature Law No. 15/2004 and e-signature regulatory framework.
- Egypt Personal Data Protection Law No. 151/2020.

External legal counsel remains the final authority for the exact contract language, liability allocation, tax treatment, licensing/registration, privacy roles, cross-border issues, and dispute forum for Velora's actual operating structure.
