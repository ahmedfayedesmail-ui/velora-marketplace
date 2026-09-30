import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { loadBusinessTruthContractsObject } from './business-truth.js';

const SCHEMA = 'witness-business-truth-drafts.v1';
const CONTRACT_SCHEMA = 'witness-business-truth.v1';
const DEFAULT_VERIFICATION = { pollAttempts: 3, pollIntervalMs: 300 };
const BUSINESS_PATH_TOKENS = [
  'order', 'payment', 'checkout', 'cart', 'product', 'inventory',
  'subscription', 'seller', 'vendor', 'customer', 'user', 'profile',
  'shipping', 'refund', 'return', 'account'
];

function asArray(value) { return value == null ? [] : Array.isArray(value) ? value : [value]; }

function pathOf(value = '') {
  try { return new URL(String(value)).pathname; }
  catch { return String(value || '').split('?')[0].split('#')[0]; }
}

function cleanPath(value = '') {
  const raw = String(value || '').trim();
  if (!raw || raw.includes('${') || raw.includes(' ') || /^data:/i.test(raw)) return null;
  if (raw.startsWith('/')) return raw;
  try {
    const parsed = new URL(raw);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.pathname : null;
  } catch {
    return null;
  }
}

function tokensFor(value = '') {
  const normalized = String(value || '').toLowerCase();
  return BUSINESS_PATH_TOKENS.filter(token => normalized.includes(token));
}

function stableId(value) {
  return 'btd-' + crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16);
}

function unique(values) { return [...new Set(values.filter(Boolean))]; }

function runtimeNetwork(result) {
  const rows = [];
  for (const page of asArray(result?.pages)) {
    for (const transition of asArray(page?.transitions)) {
      for (const network of asArray(transition?.network)) {
        if (!network?.url) continue;
        rows.push({
          page: page.url || null,
          persona: page.persona || null,
          action: transition.action?.text || transition.action?.aria || transition.action?.label || null,
          url: network.url,
          path: pathOf(network.url),
          method: String(network.method || 'GET').toUpperCase(),
          status: network.status ?? null,
          resourceType: network.resourceType || null
        });
      }
    }
    for (const network of asArray(page?.failedRequests)) {
      if (!network?.url) continue;
      rows.push({
        page: page.url || null,
        persona: page.persona || null,
        action: null,
        url: network.url,
        path: pathOf(network.url),
        method: String(network.method || 'GET').toUpperCase(),
        status: network.status ?? null,
        resourceType: network.resourceType || null,
        error: network.error || null
      });
    }
  }
  return rows;
}

function sourceApiCandidates(repository = {}) {
  return unique(asArray(repository.api).map(cleanPath))
    .filter(Boolean)
    .slice(0, 250);
}

function routeCandidates(repository = {}, result = {}, apiPath) {
  const routes = unique([
    ...asArray(repository.routes).map(cleanPath),
    ...asArray(result?.pages).map(page => cleanPath(page.url))
  ]);
  const apiTokens = tokensFor(apiPath);
  const scored = routes.map(route => {
    const routeTokens = tokensFor(route);
    const overlap = apiTokens.filter(token => routeTokens.includes(token));
    return { route, score: overlap.length, overlap };
  }).filter(row => row.score > 0 || apiTokens.length === 0);
  return scored.sort((a, b) => b.score - a.score || a.route.localeCompare(b.route)).slice(0, 8).map(row => row.route);
}

function runtimeMatches(runtime, apiPath) {
  return runtime.filter(item => pathOf(item.url) === apiPath).slice(0, 20);
}

function candidateStateSignals(repository = {}) {
  return unique(asArray(repository.states).map(v => String(v).toLowerCase()))
    .filter(value => /^(pending|loading|success|error|failed|empty|active|inactive|draft|published|approved|rejected|expired|cancelled|paid|unpaid|open|closed)$/.test(value));
}

function buildDraft({ apiPath, repository, result, runtime, existingContracts }) {
  const matches = runtimeMatches(runtime, apiPath);
  const routes = routeCandidates(repository, result, apiPath);
  const tokens = tokensFor(apiPath);
  const observedStatuses = unique(matches.map(item => item.status == null ? null : String(item.status))).filter(Boolean);
  const observedPersonas = unique(matches.map(item => item.persona));
  const relevantFiles = asArray(repository.files)
    .filter(file => {
      const text = `${file.path || ''} ${asArray(file.tags).join(' ')}`.toLowerCase();
      return tokens.some(token => text.includes(token));
    })
    .slice(0, 12)
    .map(file => ({ path: file.path, tags: file.tags || [] }));

  const linkedContracts = asArray(existingContracts)
    .filter(contract => {
      const contractPath = contract?.when?.pathPattern || '';
      return routes.some(route => new RegExp(String(contractPath || '').replace(/[.*+?^{}$()|[\\]\\]/g, '\\\\$&'), 'i').test(route));
    })
    .map(contract => contract.id);

  const confidence = matches.length ? 'medium' : 'low';
  const reasons = [
    'The API path is derived from WITNESS repository understanding.',
    matches.length
      ? `The same API path was observed during runtime evidence ${matches.length} time(s).`
      : 'No runtime request for this exact API path was found in the supplied result.',
    'No business-state assertion is promoted automatically because current evidence does not retain full API response bodies.',
    tokens.length
      ? `Candidate domain tokens observed in the path: ${tokens.join(', ')}. These are hints, not business semantics.`
      : 'No business-domain token was inferred from the API path.'
  ];

  return {
    id: stableId({ apiPath, routes, repositoryHead: repository?.git?.head || null, runId: result?.runId || null }),
    schema: SCHEMA,
    status: 'DRAFT',
    generatedAt: new Date().toISOString(),
    sourceEvidence: {
      repository: {
        schema: repository?.schema || null,
        head: repository?.git?.head || null,
        branch: repository?.git?.branch || null,
        apiPath,
        candidateRoutes: routes,
        relevantFiles
      },
      runtime: {
        runId: result?.runId || null,
        exactMatches: matches,
        observedPersonas,
        observedStatuses
      },
      existingContracts: linkedContracts
    },
    candidate: {
      businessEntityTokens: tokens,
      browser: {
        pathPattern: routes[0] || null,
        additionalPathPatterns: routes.slice(1),
        successPattern: null,
        mustContain: [],
        mustNotContain: []
      },
      api: {
        method: 'GET',
        path: apiPath,
        expectStatus: null,
        assertions: []
      },
      state: {
        candidateStateVocabulary: candidateStateSignals(repository),
        assertions: []
      }
    },
    rationale: 'Deterministic draft scaffold from source/runtime evidence. Human review must define and approve the actual business-state assertion(s) before this can be enforced.',
    assumptions: [
      'The API path is a candidate read-only state source, not yet an authoritative business truth source.',
      'The candidate route is only a correlation hint and may not be the UI surface whose claim should be verified.',
      'Business meaning, state fields, expected values, and success wording are intentionally left unapproved.'
    ],
    confidence: {
      level: confidence,
      reasons
    },
    suggestedAssertion: {
      description: 'Define the exact browser claim and the read-only API/state assertion that must agree.',
      requiredHumanInput: {
        browser: ['successPattern or mustContain'],
        api: ['path', 'optional expectStatus', 'optional assertions'],
        state: ['at least one concrete assertion when API status alone is insufficient']
      }
    },
    suggestedFailurePath: {
      browserClaimsSuccessButStateDisagrees: true,
      boundedVerification: DEFAULT_VERIFICATION
    },
    reviewer: {
      status: 'pending',
      reviewer: null,
      reviewedAt: null,
      approvedContract: null
    },
    advisory: {
      status: 'available-for-advisory-enrichment',
      provider: null,
      generated: false,
      note: 'An AI/advisory layer may add wording or rationale later; it must not mutate the candidate semantics or bypass human review.'
    }
  };
}

export function generateBusinessTruthDrafts({ repository = {}, result = null, contracts = [] } = {}) {
  if (repository?.schema && repository.schema !== 'witness-repository.v1') {
    throw new Error('Unsupported WITNESS repository schema.');
  }

  const apiPaths = sourceApiCandidates(repository);
  const runtime = runtimeNetwork(result);
  const runtimeOnlyPaths = unique(runtime.map(item => cleanPath(item.path)).filter(Boolean));
  const candidatePaths = unique([
    ...apiPaths.filter(pathValue => tokensFor(pathValue).length > 0),
    ...runtimeOnlyPaths.filter(pathValue => tokensFor(pathValue).length > 0 && pathValue.startsWith('/'))
  ]).slice(0, 50);

  const drafts = candidatePaths.map(apiPath => buildDraft({
    apiPath,
    repository,
    result,
    runtime,
    existingContracts: contracts
  }));

  return {
    schema: SCHEMA,
    generatedAt: new Date().toISOString(),
    source: {
      repositorySchema: repository?.schema || null,
      repositoryHead: repository?.git?.head || null,
      runId: result?.runId || null
    },
    policy: {
      authoritative: false,
      reviewerRequired: true,
      aiAdvisoryOnly: true,
      noSpeculativeBusinessSemantics: true,
      readOnlyMethods: ['GET', 'HEAD'],
      maxVerification: DEFAULT_VERIFICATION
    },
    summary: {
      candidateApiPaths: candidatePaths.length,
      drafts: drafts.length,
      runtimeLinkedDrafts: drafts.filter(d => d.sourceEvidence.runtime.exactMatches.length > 0).length,
      pendingReview: drafts.length,
      approved: 0
    },
    drafts
  };
}

export async function writeBusinessTruthDrafts(file, document) {
  if (!document || document.schema !== SCHEMA) throw new Error('Unsupported WITNESS business-truth draft schema.');
  await fs.mkdir(path.dirname(path.resolve(file)), { recursive: true });
  await fs.writeFile(path.resolve(file), JSON.stringify(document, null, 2), { mode: 0o600 });
  return file;
}

function validateApprovedContract(draft) {
  const approved = draft?.reviewer?.approvedContract;
  if (!approved || approved.schema !== CONTRACT_SCHEMA) throw new Error(`Draft ${draft?.id || 'unknown'} has no approved witness-business-truth.v1 contract.`);
  loadBusinessTruthContractsObject(approved);
  return approved;
}

export function promoteBusinessTruthDraftsObject(document, { ids = null } = {}) {
  if (!document || document.schema !== SCHEMA) throw new Error('Unsupported WITNESS business-truth draft schema.');

  const selected = ids?.length
    ? document.drafts.filter(draft => ids.includes(draft.id))
    : document.drafts;

  if (!selected.length) throw new Error('No business-truth drafts selected for promotion.');

  const missing = selected.filter(draft => draft?.reviewer?.status !== 'approved' || !draft?.reviewer?.reviewer || !draft?.reviewer?.reviewedAt);
  if (missing.length) throw new Error(`Human review required before promotion: ${missing.map(draft => draft.id).join(', ')}`);

  const contracts = selected.map(validateApprovedContract).flatMap(contract => contract.checks);
  const normalized = loadBusinessTruthContractsObject({ schema: CONTRACT_SCHEMA, checks: contracts });

  return {
    schema: CONTRACT_SCHEMA,
    generatedAt: new Date().toISOString(),
    checks: normalized,
    promotion: {
      sourceSchema: SCHEMA,
      sourceDraftIds: selected.map(draft => draft.id),
      promotedAt: new Date().toISOString(),
      policy: 'human-approved deterministic contract'
    }
  };
}

export async function promoteBusinessTruthDrafts(inputFile, outputFile, options = {}) {
  const document = JSON.parse(await fs.readFile(path.resolve(inputFile), 'utf8'));
  const promoted = promoteBusinessTruthDraftsObject(document, options);
  await fs.mkdir(path.dirname(path.resolve(outputFile)), { recursive: true });
  await fs.writeFile(path.resolve(outputFile), JSON.stringify(promoted, null, 2), { mode: 0o600 });
  return promoted;
}
