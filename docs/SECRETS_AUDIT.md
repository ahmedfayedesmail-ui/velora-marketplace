# Velora Secrets Audit — RC2

**Status: BLOCKED pending provider-side rotation and Supabase project access verification.**

## Security rule
The GitHub repository `ahmedfayedesmail-ui/velora-marketplace` is public. Any credential that ever appeared in reachable Git history must be treated as compromised until the provider credential is rotated/revoked.

## Provider checklist
| Provider / credential | Repository evidence | Rotation status | Evidence required |
|---|---|---|---|
| Supabase service_role | Historical status unverified | **NOT CONFIRMED** | Supabase API settings screenshot + rotation timestamp |
| Supabase JWT secret | Historical status unverified | **NOT CONFIRMED** | Supabase API settings screenshot + rotation timestamp |
| Supabase anon/publishable key | Historical status unverified | **NOT CONFIRMED** | Supabase API settings screenshot + rotation timestamp |
| Stripe secret key | Historical status unverified | **NOT CONFIRMED** | Stripe API-key roll evidence |
| Stripe webhook signing secret | Historical status unverified | **NOT CONFIRMED** | Stripe webhook secret roll evidence |
| SendGrid / mail API key | Historical status unverified | **NOT CONFIRMED** | Provider API-key rotation evidence |
| GitHub PATs | No provider-side confirmation available here | **NOT CONFIRMED** | Developer Settings PAT inventory/revocation evidence |
| DB connection strings / private keys | Historical status unverified | **NOT CONFIRMED** | Provider rotation/revocation evidence |

## Important limitation
The connected Supabase account currently exposes a project named `maha-beauty`, not a Velora-named project. No Supabase mutation or audit query was executed because acting on the wrong project would be unsafe.

## CI evidence
Run #12 failed at the current-tree scanner before historical Gitleaks or Playwright. Therefore its result cannot establish historical-secret safety.

## Required completion evidence
1. Provider rotation/revocation timestamps for every credential class that ever appeared in Git history.
2. Updated environment variables in every deployment environment that uses the rotated values.
3. Supabase API/Auth audit-log review covering the exposure window.
4. Auth user inventory review and storage activity review.
5. Full-history Gitleaks result after the scanner/CI fixes.

**No credential values are stored in this document.**
