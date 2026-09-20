# VELORA — Wave 3 E2E Evidence
Date: 2026-09-20
Branch: sprint-2-s2d-admin
Environment: Restore-Test / Staging
Production: FROZEN

## Scope
- Reviews E2E
- Wishlist E2E
- Notifications E2E

## Reviews E2E — PASS
1. Delivered seed verified:
   - Order #100001 = delivered
   - Payment = paid
   - Customer = customer-test
   - Product = Test Vitamin C Serum
   - Order item exists
2. Customer eligibility = eligible.
3. Review modal opens.
4. Rating selection = 4/5.
5. Review submitted successfully.
6. DB review created with:
   - rating = 4
   - title = Good
   - verified purchase = true
   - status = pending
7. Admin moderation queue displayed the pending review.
8. Moderation RPC security-context issue was fixed on Restore-Test:
   - SECURITY DEFINER
   - search_path = public
   - authenticated EXECUTE retained
   - no private-schema grant added to authenticated
9. Admin published the review.
10. Public Product Details displayed:
    - average rating = 4.0
    - 1 published review
    - review content visible
    - verified purchase visible

## Wishlist E2E — PASS
1. Initial wishlist empty.
2. Test Vitamin C Serum added via heart control.
3. Wishlist badge incremented to 1.
4. Product appeared in /favorites.
5. Refresh persistence verified.
6. Product removed.
7. Wishlist returned to empty.
8. DB verification after removal: matching wishlist item count = 0.

## Notifications E2E — PASS
1. Notification bell opened the dropdown.
2. Six customer notifications were displayed.
3. Order #51 notification chain visible:
   - order received
   - confirmed
   - processing
   - shipped
   - delivered
   - refunded
4. Single notification click marked one item read.
5. DB verification: 6 total notifications, 1 read, 5 unread.
6. Mark all read completed.
7. UI unread badge disappeared.
8. DB verification after Mark all read: 6 total, 0 unread.

## UI Fixes Applied During E2E
- Added canonical E2E review product to the local Shop catalog.
- Fixed S2-C Admin Reviews navigation hook.
- Made Reviews admin navigation robust against Admin shell timing.
- Fixed Notifications dropdown reopening during async notification load.

## Deferred / Backlog
- F-001 Search
- F-002 Mobile layout
- F-003 Desktop horizontal scrolling
- F-004 General screen consistency
- F-005 Localization mixing
- F-006 Duplicate Discover More
- F-007 Admin gross vs seller net display clarification
- F-008 Currency consistency
- F-009 Seller subscriptions
- F-010 Owner revenue model documentation

## Closure
Wave 3 functional E2E scope is CLOSED.
Production remains FROZEN.
