import assert from 'node:assert/strict';
import test from 'node:test';
import { loadCatalog } from '../src/v13hub/catalog.js';
import {
  evidenceAxes,
  healthEvidence,
  receiptEvidence,
  resolveCatalogUrl,
  targetPolicy,
  validateCatalog,
} from '../src/v13hub/contracts.js';
import { readPeerSnapshot, reviewRemoteOffer } from '../src/v13hub/peer-boundary.js';

const schemaVersion = 'artifacts.fkr.dev/catalog-v1';
const pageUrl = 'https://artifacts.example/deploy/hub/v13/index.html';

function rawCatalog(items = []) {
  return { schemaVersion, generatedAt: '2026-09-15T00:00:00.000Z', items };
}

function localArtifact(overrides = {}) {
  return {
    id: 'local-tool',
    version: '1.0.0',
    title: 'Local Tool',
    kind: 'application',
    status: 'active',
    sourceKind: 'directory',
    gitMode: 'root',
    buildMode: 'none',
    releaseKind: 'directory',
    availability: 'verified',
    url: '/artifacts/local-tool/1.0.0/index.html',
    git: { basis: 'source', revision: 'abc', path: 'local-tool' },
    receipt: { version: '1.0.0', files: 3, generatedAt: '2026-09-15T00:00:00.000Z' },
    ...overrides,
  };
}

function okResponse(url, body, overrides = {}) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    redirected: false,
    url,
    json: async () => body,
    ...overrides,
  };
}

test('catalog loader rejects cross-origin final response URLs before parsing payloads', async () => {
  const calls = [];
  let untrustedJsonReads = 0;
  const catalog = await loadCatalog({
    pageUrl,
    candidates: ['./redirected.json', './catalog.json'],
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      if (url.endsWith('/redirected.json')) {
        return okResponse('https://untrusted.example/catalog.json', rawCatalog(), {
          redirected: true,
          json: async () => { untrustedJsonReads += 1; return rawCatalog(); },
        });
      }
      return okResponse('https://artifacts.example/deploy/hub/v13/catalog.json', rawCatalog());
    },
  });

  assert.equal(untrustedJsonReads, 0);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].options.credentials, 'same-origin');
  assert.equal(calls[0].options.redirect, 'error');
  assert.equal(catalog.sourceUrl, 'https://artifacts.example/deploy/hub/v13/catalog.json');
  assert.equal(catalog.requestedUrl, 'https://artifacts.example/deploy/hub/v13/catalog.json');
});

test('catalog loader rejects a successful response when its final URL cannot be verified', async () => {
  await assert.rejects(
    loadCatalog({
      pageUrl,
      candidates: ['./catalog.json'],
      fetchImpl: async () => okResponse('', rawCatalog()),
    }),
    (error) => error instanceof AggregateError
      && error.errors.some((entry) => /catalog response URL cannot be verified/.test(entry.message)),
  );
});

test('catalog loader never fetches malformed, credential-bearing, unsupported, or cross-origin candidates', async () => {
  const calls = [];
  const result = await loadCatalog({
    pageUrl,
    candidates: [
      'http://[::1',
      'https://user:secret@artifacts.example/catalog.json',
      'javascript:alert(1)',
      '//untrusted.example/catalog.json',
      './catalog.json',
    ],
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return okResponse(url, rawCatalog());
    },
  });

  assert.deepEqual(calls.map((entry) => entry.url), ['https://artifacts.example/deploy/hub/v13/catalog.json']);
  assert.equal(result.items.length, 0);
});

test('catalog loader fails closed across malformed JSON, wrong schemas, and duplicate IDs without invented entries', async () => {
  let call = 0;
  await assert.rejects(
    loadCatalog({
      pageUrl,
      candidates: ['./bad-json.json', './wrong-schema.json', './duplicates.json'],
      fetchImpl: async (url) => {
        call += 1;
        if (call === 1) return okResponse(url, null, { json: async () => { throw new SyntaxError('bad json'); } });
        if (call === 2) return okResponse(url, { schemaVersion: 'other', items: [] });
        const duplicate = localArtifact({ availability: 'source-only', receipt: null });
        return okResponse(url, rawCatalog([duplicate, duplicate]));
      },
    }),
    (error) => error instanceof AggregateError && error.errors.length === 3 && /No authoritative V13 catalog/.test(error.message),
  );
  assert.equal(call, 3);
});

test('catalog validation rejects malformed, unsupported-protocol, and credential-bearing artifact destinations', () => {
  for (const url of [
    'javascript:alert(1)',
    'data:text/html,boom',
    'https://user:secret@artifacts.example/private',
    'https://artifacts.example@evil.example/deceptive',
    'http://[::1',
    '',
  ]) {
    assert.throws(
      () => validateCatalog(rawCatalog([localArtifact({ availability: 'source-only', receipt: null, url })])),
      /artifact URL/,
      url,
    );
  }
  const external = validateCatalog(rawCatalog([localArtifact({
    availability: 'external',
    receipt: null,
    sourceKind: 'external',
    url: 'https://example.org/repo',
  })])).items[0];
  assert.equal(external.url, 'https://example.org/repo');
});

test('receipt health requires coherent configured receipt evidence and keeps independent axes unknown when catalog v1 cannot prove them', () => {
  const verified = validateCatalog(rawCatalog([localArtifact()])).items[0];
  assert.equal(receiptEvidence(verified).state, 'verified');
  assert.equal(healthEvidence(verified).level, 'verified');

  const axes = evidenceAxes(verified);
  assert.equal(axes.sourceOwnership.state, 'reported');
  assert.equal(axes.validation.state, 'unknown');
  assert.equal(axes.receipt.state, 'verified');
  assert.equal(axes.runtime.state, 'unknown');
  assert.equal(axes.network.state, 'unknown');

  const claimOnly = { ...verified, receipt: null, status: 'active', url: '/exists.html' };
  assert.equal(receiptEvidence(claimOnly).state, 'unknown');
  assert.equal(healthEvidence(claimOnly).level, 'unknown');
  assert.throws(
    () => validateCatalog(rawCatalog([localArtifact({ receipt: null })])),
    /verified availability requires complete receipt evidence/,
  );
  assert.throws(
    () => validateCatalog(rawCatalog([localArtifact({ receipt: { version: '1.0.0', files: -1, generatedAt: 'not-a-date' } })])),
    /receipt evidence is malformed/,
  );
  assert.throws(
    () => validateCatalog(rawCatalog([localArtifact({ receipt: { version: '2.0.0', files: 3, generatedAt: '2026-09-15T00:00:00.000Z' } })])),
    /verified availability requires complete receipt evidence/,
  );
});

test('target policy preserves deployment-base resolution and blocks unsafe destinations while keeping external links review-only', () => {
  const local = validateCatalog(rawCatalog([localArtifact()])).items[0];
  assert.equal(resolveCatalogUrl(local.url, pageUrl), 'https://artifacts.example/deploy/artifacts/local-tool/1.0.0/index.html');
  assert.equal(targetPolicy(local, pageUrl).mode, 'local');

  for (const url of ['data:text/html,boom', 'https://user:secret@artifacts.example/private', 'https://artifacts.example@evil.example/deceptive']) {
    const policy = targetPolicy({ ...local, url }, pageUrl);
    assert.equal(policy.mode, 'blocked');
    assert.equal(policy.allowed, false);
  }

  const external = targetPolicy({ ...local, url: 'https://example.org/repo' }, pageUrl);
  assert.equal(external.mode, 'external-review');
  assert.equal(external.allowed, false);
  assert.equal(external.requiresExplicitApproval, true);

  assert.equal(resolveCatalogUrl('//untrusted.example/deceptive', pageUrl), 'https://untrusted.example/deceptive');
  const networkPath = targetPolicy({ ...local, url: '//untrusted.example/deceptive' }, pageUrl);
  assert.equal(networkPath.mode, 'external-review');
  assert.equal(networkPath.allowed, false);
});

test('peer health remains a diagnostic runtime/network axis and requires an explicit connectivity boolean', () => {
  const missing = readPeerSnapshot({ health: () => ({ state: 'hosting', peerCount: 2 }) });
  assert.equal(missing.state, 'unproven');
  assert.equal(missing.connected, false);
  assert.equal(missing.releaseHealth, 'unknown');

  const connected = readPeerSnapshot({ health: () => ({ state: 'hosting', connected: true, peerCount: 2, myId: 'peer-a' }) });
  assert.equal(connected.connected, true);
  assert.equal(connected.axis, 'runtime-network');
  assert.equal(connected.authority, 'diagnostic-only');
  assert.equal(connected.releaseHealth, 'unknown');
});

test('peer offers fail closed on replay-like evidence and stage only sanitized metadata without catalog or collection authority', () => {
  const offer = {
    offerId: 'offer-1',
    token: 'cap-1',
    expiresAt: '2026-09-16T00:00:00.000Z',
    artifact: {
      id: 'remote-one',
      title: 'Remote One',
      description: 'peer metadata',
      version: '1.2.3',
      url: 'https://untrusted.example/run',
      availability: 'verified',
      status: 'active',
      receipt: { version: '1.2.3', files: 1, generatedAt: '2026-09-15T00:00:00.000Z' },
    },
  };
  const now = Date.parse('2026-09-15T12:00:00.000Z');

  assert.equal(reviewRemoteOffer(offer, { now }).reason, 'explicit-review-required');
  assert.equal(reviewRemoteOffer(offer, { userApproved: true, seenOfferIds: new Set(['offer-1']), now }).reason, 'replay-detected');
  assert.equal(reviewRemoteOffer(offer, { userApproved: true, seenCapabilityTokens: new Set(['cap-1']), now }).reason, 'replay-detected');
  assert.equal(reviewRemoteOffer({ ...offer, token: '  cap-1  ' }, { userApproved: true, seenCapabilityTokens: new Set(['cap-1']), now }).reason, 'replay-detected');
  assert.equal(reviewRemoteOffer({ ...offer, expiresAt: '2026-09-15T11:00:00.000Z' }, { userApproved: true, now }).reason, 'offer-expired');

  const accepted = reviewRemoteOffer(offer, { userApproved: true, now });
  assert.equal(accepted.state, 'staged-for-review');
  assert.deepEqual(accepted.artifact, {
    id: 'remote-one',
    title: 'Remote One',
    description: 'peer metadata',
    version: '1.2.3',
  });
  assert.deepEqual(accepted.authority, { catalog: false, collection: false, release: false });
  assert.equal('url' in accepted.artifact, false);
  assert.equal('receipt' in accepted.artifact, false);
  assert.equal('availability' in accepted.artifact, false);
});
