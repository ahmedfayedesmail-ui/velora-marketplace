import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(path, 'utf8');

const notifications = read('src/scripts/55-s2e-notifications.js');
const push = read('src/scripts/68-s1-d-mobile-push.js');
const serviceWorker = read('src/sw.js');
const index = read('src/index.html');
const fn = read('supabase/functions/velora-send-push-test/index.ts');

assert.match(notifications, /function syncPushUi\(\)/);
assert.match(notifications, /window\.VELORA_PUSH_UI_SYNC/);
assert.match(notifications, /syncPushUi\(\);/);

assert.match(push, /window\.VELORA_PUSH_UI_SYNC\s*=\s*syncPushUi/);
assert.doesNotMatch(push, /MutationObserver/);
assert.doesNotMatch(push, /\.observe\(document\.body/);
assert.match(push, /document\.addEventListener\('DOMContentLoaded', syncPushUi/);
assert.match(push, /velora_register_push_subscription/);
assert.match(push, /velora_unregister_push_subscription/);
assert.match(push, /navigator\.serviceWorker\.register\('\/sw\.js'/);
assert.match(push, /Notification\.requestPermission\(\)/);
assert.match(push, /userVisibleOnly:\s*true/);

assert.match(serviceWorker, /self\.addEventListener\('push'/);
assert.match(serviceWorker, /self\.registration\.showNotification/);
assert.match(serviceWorker, /self\.addEventListener\('notificationclick'/);

assert.match(index, /scripts\/55-s2e-notifications\.js/);
assert.match(index, /scripts\/68-s1-d-mobile-push\.js\?v=push-v3/);

assert.match(fn, /withSupabase\(\{ auth: "user" \}/);
assert.match(fn, /velora_get_push_sender_config/);
assert.match(fn, /push_subscriptions/);
assert.match(fn, /webpush\.sendNotification/);
assert.match(fn, /velora_mark_push_delivery/);

console.log('✅ Notification/Web Push contract passed');
