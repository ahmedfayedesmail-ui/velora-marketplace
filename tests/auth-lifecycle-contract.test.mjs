import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('src/scripts/00-localization.js', 'utf8');
const stage8Source = fs.readFileSync('src/scripts/12-localization.js', 'utf8');

const required = [
  'db.auth.signInWithPassword',
  'db.auth.signUp',
  'db.auth.resetPasswordForEmail',
  'db.auth.updateUser',
  'db.auth.signInWithOtp',
  'db.auth.resend',
  "event === 'PASSWORD_RECOVERY'",
  "openAuthModal('forgot')",
  "openAuthModal('magiclink')",
  "openAuthModal('resend')",
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
  source.includes("mode === 'magiclink'"),
  'Auth modal must expose the canonical email-link sign-in path'
);

assert.ok(
  source.includes("mode === 'resend'"),
  'Auth modal must expose the canonical confirmation resend path'
);

assert.ok(
  source.includes('db.auth.signInWithOtp({'),
  'Passwordless sign-in must use Supabase signInWithOtp'
);

assert.ok(
  source.includes("db.auth.resend({"),
  'Confirmation resend must use Supabase resend'
);

assert.ok(
  source.includes("type: 'signup'"),
  'Confirmation resend must use the signup resend contract'
);

assert.ok(
  source.includes('handleMagicLinkRequest(event)') &&
  source.includes('handleResendConfirmation(event)'),
  'Passwordless auth forms must bind to the canonical handlers'
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
  source.includes('authCallbackHint') &&
  source.includes('__mahaAuthCallbackHydrationRetries < 5') &&
  source.includes('setTimeout(() => initializeSupabaseAuth(), 300)'),
  'Auth callback session recovery must have a bounded retry path'
);

assert.ok(
  source.includes('(code|access_token|refresh_token|type)'),
  'Callback hydration retry must only target recognized auth callback URL fields'
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

assert.ok(
  stage8Source.includes('db.auth.onAuthStateChange((_event,session)=>'),
  'Stage 8 role sync must observe the canonical auth lifecycle'
);

assert.ok(
  !stage8Source.includes('db.auth.onAuthStateChange(async'),
  'Stage 8 must not await Supabase work directly inside the auth callback'
);

const stage8AuthSyncStart = stage8Source.indexOf('db.auth.onAuthStateChange((_event,session)=>');
const stage8AuthSyncSnippet = stage8Source.slice(stage8AuthSyncStart, stage8AuthSyncStart + 1800);
assert.ok(
  stage8AuthSyncSnippet.includes('setTimeout(async()=>'),
  'Stage 8 auth role sync must defer Supabase queries outside the auth lock'
);


const helperStart = source.indexOf('async function loadOrBootstrapAuthProfile');
const helperEnd = source.indexOf('\nasync function initializeSupabaseAuth', helperStart);
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
  'let __mahaAuthProfileBootstrap = null;\n' +
  source.slice(helperStart, helperEnd) +
  '\nglobalThis.testLoadOrBootstrapAuthProfile = loadOrBootstrapAuthProfile;';

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
