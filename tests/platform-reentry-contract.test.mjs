import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(path, 'utf8');

const canonical = read('src/scripts/12-localization.js');
const router = read('src/scripts/63-platform-router.js');
const admin = read('src/scripts/56-s2d-admin.js');
const sellerSubscriptionDomain = read('src/scripts/35-seller.js');

assert.match(canonical, /let sellerPlatformOperation\s*=\s*0/);
assert.match(canonical, /const operation=\+\+sellerPlatformOperation/);
assert.match(canonical, /document\.getElementById\('sellerContent'\)!==c/);
assert.match(canonical, /platform\.classList\.contains\('active'\)/);
assert.match(canonical, /invalidateSellerPlatformOperations\(\)/);
assert.match(canonical, /invalidateAdminPlatformOperations\(\)/);
assert.match(canonical, /window\.closeSellerPlatform=window\.VELORA_CLOSE_SELLER/);
assert.match(canonical, /window\.closeAdminPlatform=window\.VELORA_CLOSE_ADMIN/);
assert.match(canonical, /p\.hidden=true/);
assert.match(canonical, /data-section="subscription"[\s\S]*VELORA_CANONICAL_SELLER_SECTION\('subscription',this\)/);
assert.match(canonical, /section==='subscription'[\s\S]*VELORA_RENDER_SELLER_SUBSCRIPTION/);
assert.match(canonical, /id="veloraCanonicalSellerSubscription"/);
assert.match(sellerSubscriptionDomain, /async function v39LoadSubscription\(target\)/);
assert.match(sellerSubscriptionDomain, /window\.VELORA_RENDER_SELLER_SUBSCRIPTION=v39LoadSubscription/);
assert.match(sellerSubscriptionDomain, /velora-subscription-paymob-checkout-restore-test/);
assert.match(sellerSubscriptionDomain, /Seller subscription terms are not published yet\./);

assert.match(canonical, /let adminPlatformOperation\s*=\s*0/);
assert.match(canonical, /const operation=\+\+adminPlatformOperation/);
assert.match(canonical, /document\.getElementById\('adminContent'\)!==c/);

assert.match(router, /VELORA_INVALIDATE_SELLER_PLATFORM/);
assert.match(router, /VELORA_INVALIDATE_ADMIN_PLATFORM/);

assert.match(admin, /window\.openAdminPlatform=function\(\)\{\s*return originalOpen\.apply\(this,arguments\);\s*\};/);
assert.match(admin, /window\.VELORA_CANONICAL_ADMIN_SECTION=async function\(section,btn\)/);
assert.match(admin, /if\(prevCanonical\) return prevCanonical\.apply\(this,arguments\)/);
assert.match(admin, /if\(document\.getElementById\('adminContent'\)===c && platform\.classList\.contains\('active'\)\)/);

const browserGate = read('.github/workflows/velora-seller-admin-reentry-browser-gate.yml');

assert.match(browserGate, /seller-admin-reentry-browser\.v[0-9]+/);
assert.match(browserGate, /["']first_open_document_id["']/);
assert.match(browserGate, /["']second_open_document_id["']/);
assert.match(browserGate, /["']closed_without_refresh["']\]\s*=\s*bool/);
assert.match(browserGate, /["']reentry_active_without_refresh["']\]\s*=\s*bool/);
assert.match(browserGate, /seller-first-open\.png/);
assert.match(browserGate, /seller-closed\.png/);
assert.match(browserGate, /seller-second-open\.png/);

assert.match(canonical, /const \[products,orders\]=await Promise\.all\(\[sellerProducts\(seller\.id\),sellerOrders\(seller\.id\)\]\);[\s\S]*?if\(operation!==sellerPlatformOperation/);
assert.match(canonical, /async function renderCanonicalAdminDashboard\(expectedOperation\)/);
assert.match(canonical, /async function renderCanonicalOwnerGovernance\(expectedOperation\)/);
assert.match(canonical, /db\.rpc\('velora_get_launch_control_plane'\)/);
assert.match(canonical, /db\.rpc\('velora_get_launch_readiness'\)/);
assert.match(canonical, /db\.rpc\('velora_get_reconciliation_dashboard'\)/);
assert.match(canonical, /id="ownerGovernanceContent"/);
assert.match(canonical, /document\.getElementById\('ownerGovernanceContent'\)!==c/);
assert.match(canonical, /expectedOperation!==adminPlatformOperation[\s\S]*?renderCanonicalOwnerGovernance\(expectedOperation\)/);
assert.match(canonical, /expectedOperation!==adminPlatformOperation[\s\S]*?document\.getElementById\('adminContent'\)!==c/);

console.log('✅ Platform re-entry stale-operation contract passed');

const releaseDomain = read('src/scripts/11-admin.js');
assert.match(releaseDomain, /window\.VELORA_CREATE_RELEASE_UI/);
assert.match(releaseDomain, /window\.VELORA_SET_RELEASE_STATUS/);
assert.match(releaseDomain, /window\.VELORA_RENDER_RELEASES/);
assert.doesNotMatch(releaseDomain, /window\.VELORA_CANONICAL_ADMIN_SECTION\s*=/);
assert.doesNotMatch(releaseDomain, /window\.VELORA_OPEN_ADMIN\s*=/);
assert.match(canonical, /releaseControl:'Release Control'/);
assert.match(canonical, /section==='releaseControl'[\s\S]*?window\.VELORA_RENDER_RELEASES/);
console.log('✅ Owner release control consolidation contract passed');

const payoutMigration = read('supabase/migrations/20260930073000_owner_payout_control_plane_read.sql');
assert.match(payoutMigration, /create or replace function public\.velora_get_payout_control_plane/);
assert.match(payoutMigration, /not public\.velora_is_staff\(\)/);
assert.match(payoutMigration, /paid_missing_ledger_count/);
assert.match(payoutMigration, /revoke all on function public\.velora_get_payout_control_plane\(\)/);
assert.match(payoutMigration, /grant execute on function public\.velora_get_payout_control_plane\(\) to authenticated/);
assert.match(canonical, /async function renderCanonicalPayoutControl\(expectedOperation\)/);
assert.match(canonical, /data-payout-control="true"/);
assert.match(canonical, /velora_get_payout_control_plane/);
assert.match(canonical, /velora_record_payout_execution/);
assert.match(canonical, /Record execution/);
const subscriptionMigration = read('supabase/migrations/20260930081000_owner_subscription_control_plane_read.sql');
assert.match(subscriptionMigration, /create or replace function public\.velora_get_subscription_control_plane/);
assert.match(subscriptionMigration, /not public\.velora_is_staff\(\)/);
assert.match(subscriptionMigration, /seller_subscription_renewal_jobs/);
assert.match(subscriptionMigration, /revoke all on function public\.velora_get_subscription_control_plane\(\)/);
assert.match(subscriptionMigration, /grant execute on function public\.velora_get_subscription_control_plane\(\) to authenticated/);
assert.match(canonical, /subscriptionControl:'Subscription Control'/);
assert.match(canonical, /section==='subscriptionControl'[\s\S]*?renderCanonicalSubscriptionControl\(operation\)/);
assert.match(canonical, /data-subscription-control="true"/);
assert.match(canonical, /velora_get_subscription_control_plane/);
assert.match(canonical, /VELORA_RENDER_SUBSCRIPTION_CONTROL/);
assert.match(canonical, /read-only visibility over the existing seller subscription/);
console.log('✅ Owner subscription control-plane source contract passed');

console.log('✅ Payout control-plane source contract passed');

const sellerAdMigration = read('supabase/migrations/20260930090000_owner_seller_ad_control_plane_read.sql');
assert.match(sellerAdMigration, /create or replace function public\.velora_get_seller_ad_control_plane/);
assert.match(sellerAdMigration, /not public\.velora_is_staff\(\)/);
assert.match(sellerAdMigration, /seller_ad_campaigns/);
assert.match(sellerAdMigration, /payment_attempts/);
assert.match(sellerAdMigration, /revoke all on function public\.velora_get_seller_ad_control_plane\(\)/);
assert.match(sellerAdMigration, /grant execute on function public\.velora_get_seller_ad_control_plane\(\) to authenticated/);
assert.match(canonical, /sellerAdControl:'Seller Advertising'/);
assert.match(canonical, /section==='sellerAdControl'[\s\S]*?renderCanonicalSellerAdControl\(operation\)/);
assert.match(canonical, /data-seller-ad-control="true"/);
assert.match(canonical, /velora_get_seller_ad_control_plane/);
assert.match(canonical, /VELORA_RENDER_SELLER_AD_CONTROL/);
console.log('✅ Owner seller advertising control-plane source contract passed');

const finopsDomain = read('src/scripts/04-payments.js');
assert.match(finopsDomain, /window\.VELORA_CAPTURE_FINOPS/);
assert.match(finopsDomain, /window\.VELORA_RENDER_FINOPS/);
assert.doesNotMatch(finopsDomain, /window\.VELORA_CANONICAL_ADMIN_SECTION\s*=/);
assert.doesNotMatch(finopsDomain, /window\.VELORA_OPEN_ADMIN\s*=/);
assert.match(canonical, /finops:'FinOps & Economics'/);
assert.match(canonical, /section==='finops'[\s\S]*?window\.VELORA_RENDER_FINOPS/);
console.log('✅ FinOps canonical route consolidation contract passed');
