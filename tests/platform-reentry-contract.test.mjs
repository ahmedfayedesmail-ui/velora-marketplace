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

assert.match(canonical, /let adminPlatformOperation\s*=\s*0/);
assert.match(canonical, /const operation=\+\+adminPlatformOperation/);
assert.match(canonical, /document\.getElementById\('adminContent'\)!==c/);

assert.match(router, /VELORA_INVALIDATE_SELLER_PLATFORM/);
assert.match(router, /VELORA_INVALIDATE_ADMIN_PLATFORM/);

assert.match(admin, /var expectedContent=document\.getElementById\('adminContent'\)/);
assert.match(admin, /document\.getElementById\('adminContent'\)===expectedContent/);
assert.match(admin, /document\.getElementById\('adminContent'\)!==c/);

console.log('✅ Platform re-entry stale-operation contract passed');
