import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('src/scripts/00-localization.js', 'utf8');

const required = [
  'db.auth.signInWithPassword',
  'db.auth.signUp',
  'db.auth.resetPasswordForEmail',
  'db.auth.updateUser',
  "event === 'PASSWORD_RECOVERY'",
  "openAuthModal('forgot')",
  "openAuthModal('recovery')",
  'velora_ensure_own_profile',
  'registerAuthListenerOnce()',
  'If an account exists for that email',
];

for (const token of required) {
  assert.ok(source.includes(token), `Missing auth lifecycle contract: ${token}`);
}

assert.ok(
  source.includes('emailRedirectTo: authRedirect'),
  'Signup must retain an explicit email confirmation redirect contract'
);

assert.ok(
  source.includes('const recoveryHint = /(?:^|&)type=recovery'),
  'Recovery redirect must have a deterministic URL fallback'
);

assert.ok(
  !source.includes('localStorage.setItem(\'password\''),
  'Passwords must never be persisted in localStorage'
);

assert.ok(
  source.includes('loadOrBootstrapAuthProfile(authUser)'),
  'Authenticated session hydration must use the canonical profile bootstrap path'
);

assert.ok(
  source.includes(".from('profiles')"),
  'Auth bootstrap must verify the canonical profiles row'
);

assert.ok(
  source.includes('if (!profile || !canonicalResult.data)'),
  'Missing legacy/canonical profile state must trigger governed bootstrap'
);

assert.ok(
  source.indexOf('profile = await loadOrBootstrapAuthProfile(authUser);') !==
    source.lastIndexOf('profile = await loadOrBootstrapAuthProfile(authUser);'),
  'Initial session and auth-state listener must both use the bootstrap path'
);


const helperStart = source.indexOf('async function loadOrBootstrapAuthProfile');
const helperEnd = source.indexOf('\\nasync function initializeSupabaseAuth', helperStart);
assert.ok(helperStart >= 0 && helperEnd > helperStart, 'Auth profile bootstrap helper must be extractable');

const helperSandbox = {
  rpcCalls: 0,
  window: {
    mahaSupabase: {
      from(table) {
        return {
          select() { return this; },
          eq() { return this; },
          maybeSingle: async () => ({ data: null, error: null })
        };
      },
      rpc: async () => {
        helperSandbox.rpcCalls += 1;
        return {
          data: {
            id: 'bootstrap-user',
            name: 'Bootstrap User',
            email: 'bootstrap@example.com',
            phone: null,
            role: 'customer'
          },
          error: null
        };
      }
    }
  }
};

const helperSourceForTest =
  source.slice(helperStart, helperEnd) +
  '\\nglobalThis.testLoadOrBootstrapAuthProfile = loadOrBootstrapAuthProfile;';

vm.runInNewContext(helperSourceForTest, helperSandbox);

const mockAuthUser = {
  id: 'bootstrap-user',
  email: 'bootstrap@example.com',
  user_metadata: { name: 'Bootstrap User', phone: null }
};

const firstResults = await Promise.all([
  helperSandbox.testLoadOrBootstrapAuthProfile(mockAuthUser),
  helperSandbox.testLoadOrBootstrapAuthProfile(mockAuthUser)
]);

assert.equal(firstResults[0]?.id, 'bootstrap-user', 'Missing profile state must return the bootstrapped user');
assert.equal(firstResults[1]?.id, 'bootstrap-user', 'Concurrent callers must receive the same bootstrapped user');
assert.equal(helperSandbox.rpcCalls, 1, 'Concurrent auth hydration must dedupe the profile bootstrap RPC');

console.log('AUTH_LIFECYCLE_CONTRACT_PASS');
