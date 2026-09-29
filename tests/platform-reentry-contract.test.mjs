import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(path, 'utf8');

const canonical = read('src/scripts/12-localization.js');
const router = read('src/scripts/63-platform-router.js');
const admin = read('src/scripts/56-s2d-admin.js');

assert.match(canonical, /let sellerPlatformOperation\s*=\s*0/);
assert.match(canonical, /const operation=\+\+sellerPlatformOperation/);
assert.match(canonical, /document\.getElementById\('sellerContent'\)!==c/);
assert.match(canonical, /platform\.classList\.contains\('active'\)/);
assert.match(canonical, /invalidateSellerPlatformOperations\(\)/);
assert.match(canonical, /invalidateAdminPlatformOperations\(\)/);
assert.match(canonical, /window\.closeSellerPlatform=window\.VELORA_CLOSE_SELLER/);
assert.match(canonical, /window\.closeAdminPlatform=window\.VELORA_CLOSE_ADMIN/);
assert.match(canonical, /p\.hidden=true/);

assert.match(canonical, /let adminPlatformOperation\s*=\s*0/);
assert.match(canonical, /const operation=\+\+adminPlatformOperation/);
assert.match(canonical, /document\.getElementById\('adminContent'\)!==c/);

assert.match(router, /VELORA_INVALIDATE_SELLER_PLATFORM/);
assert.match(router, /VELORA_INVALIDATE_ADMIN_PLATFORM/);

assert.match(admin, /var expectedContent=document\.getElementById\('adminContent'\)/);
assert.match(admin, /document\.getElementById\('adminContent'\)===expectedContent/);
assert.match(admin, /document\.getElementById\('adminContent'\)!==c/);

const browserGate = read('.github/workflows/velora-seller-admin-reentry-browser-gate.yml');

assert.match(browserGate, /seller-admin-reentry-browser\.v2/);
assert.match(browserGate, /first_open_document_id/);
assert.match(browserGate, /second_open_document_id/);
assert.match(browserGate, /closed_without_refresh = bool/);
assert.match(browserGate, /reentry_active_without_refresh = bool/);
assert.match(browserGate, /seller-first-open\.png/);
assert.match(browserGate, /seller-closed\.png/);
assert.match(browserGate, /seller-second-open\.png/);

assert.match(canonical, /const \[products,orders\]=await Promise\.all\(\[sellerProducts\(seller\.id\),sellerOrders\(seller\.id\)\]\);[\s\S]*?if\(operation!==sellerPlatformOperation/);
assert.match(canonical, /async function renderCanonicalAdminDashboard\(expectedOperation\)/);
assert.match(canonical, /expectedOperation!==adminPlatformOperation[\s\S]*?document\.getElementById\('adminContent'\)!==c/);

console.log('✅ Platform re-entry stale-operation contract passed');
