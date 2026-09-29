import assert from 'node:assert/strict';
import fs from 'node:fs';

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

console.log('AUTH_LIFECYCLE_CONTRACT_PASS');
