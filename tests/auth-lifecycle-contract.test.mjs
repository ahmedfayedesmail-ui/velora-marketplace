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

console.log('AUTH_LIFECYCLE_CONTRACT_PASS');
