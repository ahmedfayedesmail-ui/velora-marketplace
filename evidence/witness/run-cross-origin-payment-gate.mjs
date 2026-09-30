import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import process from 'node:process';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const {
  loadBusinessTruthContracts,
  runBusinessTruthChecks
} = await import(process.env.WITNESS_ENGINE_FILE);

const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_PUBLISHABLE_KEY = String(process.env.SUPABASE_PUBLISHABLE_KEY || '');
const E2E_EMAIL = String(process.env.E2E_EMAIL || '');
const E2E_PASSWORD = String(process.env.E2E_PASSWORD || '');
const LOCAL_URL = String(process.env.VELORA_LOCAL_URL || 'http://127.0.0.1:4173/');

for (const [name, value] of Object.entries({
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  E2E_EMAIL,
  E2E_PASSWORD
})) {
  if (!value) throw new Error(name + ' is required');
}

async function jsonRequest(method, url, body = undefined, headers = {}) {
  const init = { method, headers: { ...headers } };
  if (body !== undefined) {
    init.headers['content-type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const response = await fetch(url, init);
  const raw = await response.text();
  let json = null;
  try { json = raw ? JSON.parse(raw) : null; } catch {}
  if (!response.ok) {
    throw new Error(`${method} ${url} returned HTTP ${response.status}: ${raw.slice(0, 500)}`);
  }
  return { status: response.status, json };
}

const auth = await jsonRequest(
  'POST',
  `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
  { email: E2E_EMAIL, password: E2E_PASSWORD },
  { apikey: SUPABASE_PUBLISHABLE_KEY }
);

const accessToken = String(auth.json?.access_token || '');
const userId = String(auth.json?.user?.id || '');
if (!accessToken || !userId) throw new Error('E2E authentication did not return an authenticated user');

const authHeader = `Bearer ${accessToken}`;
const orderQuery = new URLSearchParams({
  customer_id: `eq.${userId}`,
  status: 'eq.confirmed',
  payment_status: 'eq.paid',
  select: 'id,order_number',
  order: 'created_at.desc',
  limit: '1'
});
const orderResponse = await jsonRequest(
  'GET',
  `${SUPABASE_URL}/rest/v1/orders?${orderQuery.toString()}`,
  undefined,
  { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: authHeader }
);

const order = Array.isArray(orderResponse.json) ? orderResponse.json[0] : null;
if (!order?.id) throw new Error('No authenticated customer-owned confirmed+paid order is available');
const orderId = String(order.id);

const contractFile = path.resolve('evidence/witness/velora-payment-business-truth.v1.json');
const contracts = await loadBusinessTruthContracts(contractFile);

const session = {
  access_token: accessToken,
  refresh_token: String(auth.json?.refresh_token || ''),
  expires_in: auth.json?.expires_in,
  expires_at: auth.json?.expires_at,
  token_type: String(auth.json?.token_type || 'bearer'),
  user: auth.json.user
};

const storageKey = 'sb-arlaxqmhtvjwjbjinjfw-auth-token';
const targetUrl = new URL(LOCAL_URL);
targetUrl.searchParams.set('velora_order_id', orderId);

process.env.WITNESS_VELORA_SUPABASE_PUBLISHABLE_KEY = SUPABASE_PUBLISHABLE_KEY;
process.env.WITNESS_VELORA_SUPABASE_AUTHORIZATION = authHeader;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
context.addInitScript(
  `localStorage.setItem(${JSON.stringify(storageKey)}, ${JSON.stringify(JSON.stringify(session))});`
);
const page = await context.newPage();

const consoleErrors = [];
page.on('console', message => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(String(error)));

await page.goto(targetUrl.toString(), {
  waitUntil: 'domcontentloaded',
  timeout: 45000
});

let visibleText = '';
for (let attempt = 0; attempt < 24; attempt += 1) {
  visibleText = await page.locator('body').innerText();
  if (/Payment successful/i.test(visibleText)) break;
  await new Promise(resolve => setTimeout(resolve, 1000));
}

assert.match(
  visibleText,
  /Payment successful/i,
  'Velora browser success claim was not rendered'
);

const browserSnapshot = {
  url: page.url(),
  text: visibleText,
  state: 'payment-success',
  persona: 'customer'
};

const result = await runBusinessTruthChecks({
  page,
  browserSnapshot,
  after: browserSnapshot,
  persona: 'customer',
  checks: contracts
});

const observation = result.observations.find(
  item => item.checkId === 'velora-payment-return-order-truth'
);
const consistent = observation?.verdict === 'CONSISTENT';
const contradictions = result.findings.filter(
  finding => finding.code === 'BUSINESS-TRUTH-001'
);

const gate = {
  schema: 'witness-cross-origin-payment-gate.v1',
  witnessPackageVersion: '0.9.1',
  browserClaim: {
    observed: true,
    text: 'Payment successful'
  },
  businessTruth: {
    checksObserved: result.observations.length,
    consistent: consistent ? 1 : 0,
    contradictions: contradictions.length,
    observationMode: observation?.api?.observation?.mode || null,
    allowedOrigin: observation?.api?.observation?.allowedOrigin || false,
    apiStatus: observation?.api?.status ?? null,
    apiUrlOrigin: observation?.api?.url ? new URL(observation.api.url).origin : null,
    stateAssertions: observation?.state?.assertions || []
  },
  browserDiagnostics: {
    consoleErrors: consoleErrors.length,
    pageErrors: pageErrors.length
  },
  passed: Boolean(
    consistent &&
    contradictions.length === 0 &&
    observation?.api?.observation?.mode === 'cross-origin' &&
    observation?.api?.observation?.allowedOrigin === true
  ),
  safety: {
    productionTouched: false,
    realMoneyMoved: false,
    destructiveBrowserActions: false,
    authStorageStatesUploaded: false
  }
};

await fs.mkdir(path.dirname('evidence/witness/cross-origin-browser-gate.json'), { recursive: true });
await fs.writeFile(
  'evidence/witness/cross-origin-browser-gate.json',
  JSON.stringify(gate, null, 2) + '\n',
  'utf8'
);
await fs.writeFile(
  'evidence/witness/cross-origin-business-truth-observation.json',
  JSON.stringify(
    {
      schema: 'witness-cross-origin-observation.v1',
      checkId: observation?.checkId || null,
      verdict: observation?.verdict || null,
      browser: {
        visibleClaim: observation?.browser?.visibleClaim || false,
        state: observation?.browser?.state || null
      },
      api: {
        status: observation?.api?.status ?? null,
        bodyHash: observation?.api?.bodyHash || null,
        jsonValid: Boolean(observation?.api?.jsonValid),
        observation: observation?.api?.observation || null
      },
      state: observation?.state || null
    },
    null,
    2
  ) + '\n',
  'utf8'
);
await fs.writeFile(
  'evidence/witness/browser-claim-proof.json',
  JSON.stringify(
    {
      schema: 'witness-browser-claim-proof.v1',
      ownedPaidConfirmedOrderFound: true,
      browserSuccessClaimObserved: true,
      successText: 'Payment successful'
    },
    null,
    2
  ) + '\n',
  'utf8'
);

await browser.close();
console.log(JSON.stringify(gate, null, 2));

if (!gate.passed) {
  throw new Error('WITNESS cross-origin payment truth gate failed');
}
