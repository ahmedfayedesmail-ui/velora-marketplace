# S2-C Reviews + Ratings — Regression Evidence

Environment: Restore-Test (velora-restore-test)
Project ref: arlaxqmhtvjwjbjinjfw

## Result

DB/RLS regression PASS.

The gate includes the final review RLS-policy consolidation. Restore-Test review SELECT now has one policy for `anon` and one consolidated policy for `authenticated`, avoiding same-role duplicate permissive SELECT policies.

Covered:
- eligibility requires delivered purchase;
- authenticated customer review submission;
- verified-purchase flag is server derived;
- default moderation state is pending;
- duplicate review blocked per order item;
- staff moderation publishes the review;
- public reads expose only published reviews;
- product average/count aggregate recalculation;
- seller average/count aggregate recalculation;
- seller read path;
- seller notification creation;
- anonymous execution privilege is restricted;
- non-purchaser and invalid-rating rejection paths;
- published review feed RPC;
- read-path security hardening to SECURITY INVOKER.

The regression used PostgreSQL session JWT simulation and rolled back the fixture transaction at the end.

Browser E2E: NOT TESTED.
Production: FROZEN and untouched.
