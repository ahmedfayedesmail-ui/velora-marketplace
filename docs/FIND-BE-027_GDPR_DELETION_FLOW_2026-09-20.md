# Velora — FIND-BE-027
## GDPR Deletion Flow — 2026-09-20

**Priority:** Before Production GO  
**Status:** OPEN / PRE-LAUNCH  
**Environment:** Documentation only; no Production changes

### Finding

Cascade deletion on Beauty personalization tables provides database-level cleanup for Beauty-owned records, but it does not by itself establish GDPR compliance.

### Scope

The future deletion/retention work must audit:

- account deletion entry point
- authenticated identity deletion
- Beauty Passport deletion
- recommendation history deletion
- Beauty feedback retention/deletion
- linkage to order history that may have separate legal/retention requirements
- backups/exported data
- storage and logs if Beauty-related data is copied there
- audit trail treatment
- retention periods
- user deletion request workflow
- verification/evidence of completed deletion

### Current database behavior

Approved Beauty cascades:

- `profiles → beauty_profiles`: CASCADE
- `beauty_profiles → beauty_recommendation_runs`: CASCADE
- `beauty_recommendation_runs → beauty_recommendation_items`: CASCADE
- `profiles → beauty_feedback`: CASCADE
- `order_items → beauty_feedback.order_item_id`: SET NULL
- `products → Beauty records`: RESTRICT
- `product_variants → Beauty references`: SET NULL

These are database referential actions, not a complete privacy process.

### Production gate

This finding remains OPEN until a documented deletion + retention workflow is implemented, tested, and evidenced.

**No Production GO is implied by this finding.**
