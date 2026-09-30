const CATALOG_SCHEMA = 'artifacts.fkr.dev/catalog-v1';
const SAFE_PROTOCOLS = new Set(['http:', 'https:']);
const KINDS = new Set(['application', 'document', 'download', 'link', 'text', 'legacy']);
const ARTIFACT_ID = /^[a-z0-9][a-z0-9._-]*$/;

function string(value, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function nullableString(value) {
  return typeof value === 'string' && value ? value : null;
}

function safeTags(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((entry) => typeof entry === 'string' && entry.trim()).map((entry) => entry.trim()))];
}

function validateDestinationSyntax(value, id) {
  if (value == null) return null;
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${id}: artifact URL must be a non-empty string or null`);
  let parsed;
  try { parsed = new URL(value, 'https://catalog.invalid/'); } catch { throw new TypeError(`${id}: artifact URL is malformed`); }
  if (!SAFE_PROTOCOLS.has(parsed.protocol)) throw new TypeError(`${id}: artifact URL protocol is not allowed`);
  if (parsed.username || parsed.password) throw new TypeError(`${id}: artifact URL credentials are not allowed`);
  return value;
}

function normalizeReceipt(raw, id) {
  if (raw == null) return null;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new TypeError(`${id}: receipt must be an object or null`);
  const version = nullableString(raw.version);
  const files = Number.isInteger(raw.files) && raw.files >= 0 ? raw.files : null;
  const generatedAt = nullableString(raw.generatedAt);
  if (!version || files === null || !generatedAt || Number.isNaN(Date.parse(generatedAt))) {
    throw new TypeError(`${id}: receipt evidence is malformed`);
  }
  return { version, files, generatedAt };
}

export function normalizeArtifact(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new TypeError('artifact must be an object');
  const id = string(raw.id).trim();
  const title = string(raw.title).trim();
  if (!id || !ARTIFACT_ID.test(id)) throw new TypeError('artifact has an invalid id');
  if (!title) throw new TypeError(`${id}: artifact title is required`);
  const url = validateDestinationSyntax(raw.url, id);
  const kind = KINDS.has(raw.kind) ? raw.kind : 'legacy';
  return {
    id,
    version: nullableString(raw.version),
    title,
    description: string(raw.description || raw.text),
    kind,
    status: string(raw.status, 'unknown'),
    required: raw.required === true,
    tags: safeTags(raw.tags),
    sourceKind: string(raw.sourceKind, 'unknown'),
    gitMode: string(raw.gitMode, 'unknown'),
    buildMode: string(raw.buildMode, 'unknown'),
    releaseKind: string(raw.releaseKind, 'unknown'),
    availability: string(raw.availability, 'unknown'),
    url,
    launch: raw.launch && typeof raw.launch === 'object' && !Array.isArray(raw.launch) ? { ...raw.launch } : {},
    changedAt: nullableString(raw.changedAt),
    git: raw.git && typeof raw.git === 'object' && !Array.isArray(raw.git) ? {
      basis: nullableString(raw.git.basis),
      revision: nullableString(raw.git.revision),
      path: nullableString(raw.git.path),
    } : { basis: null, revision: null, path: null },
    receipt: normalizeReceipt(raw.receipt, id),
  };
}

export function receiptEvidence(item) {
  const receipt = item?.receipt;
  const complete = Boolean(
    receipt
      && typeof receipt.version === 'string'
      && receipt.version
      && Number.isInteger(receipt.files)
      && receipt.files >= 0
      && typeof receipt.generatedAt === 'string'
      && receipt.generatedAt
      && !Number.isNaN(Date.parse(receipt.generatedAt)),
  );
  const versionMatches = complete && (!item?.version || receipt.version === item.version);
  if (item?.availability === 'verified' && versionMatches) {
    return {
      state: 'verified',
      evidence: 'receipt',
      detail: `${receipt.files} release files recorded by receipt ${receipt.version}`,
    };
  }
  if (item?.availability === 'verified') {
    return {
      state: 'unknown',
      evidence: complete ? 'receipt-version-mismatch' : 'incomplete-receipt',
      detail: complete
        ? 'Catalog claims verified availability, but the receipt version does not match the artifact version.'
        : 'Catalog claims verified availability, but complete receipt evidence is absent.',
    };
  }
  if (complete && !versionMatches) {
    return {
      state: 'unknown',
      evidence: 'receipt-version-mismatch',
      detail: 'Receipt metadata is present, but its version does not match the artifact version.',
    };
  }
  if (complete) {
    return {
      state: 'reported',
      evidence: 'receipt',
      detail: 'Receipt metadata is present, but the catalog does not assert verified availability.',
    };
  }
  return {
    state: 'unknown',
    evidence: 'none',
    detail: 'No configured release receipt evidence is present.',
  };
}

export function evidenceAxes(item) {
  const sourceReported = Boolean(
    (item?.sourceKind && item.sourceKind !== 'unknown')
      || (item?.gitMode && item.gitMode !== 'unknown')
      || item?.git?.basis
      || item?.git?.revision
      || item?.git?.path,
  );
  return {
    sourceOwnership: {
      state: sourceReported ? 'reported' : 'unknown',
      evidence: sourceReported ? 'catalog-metadata' : 'none',
      detail: sourceReported
        ? 'Source/Git ownership metadata is reported by the catalog; validation is a separate axis.'
        : 'Source ownership metadata is not available.',
    },
    validation: {
      state: 'unknown',
      evidence: 'catalog-v1-does-not-expose-validator-results',
      detail: 'Catalog v1 does not carry manifest or ownership-validation results.',
    },
    receipt: receiptEvidence(item),
    runtime: {
      state: 'unknown',
      evidence: 'not-a-catalog-axis',
      detail: 'Runtime reachability is not release evidence.',
    },
    network: {
      state: 'unknown',
      evidence: 'not-a-catalog-axis',
      detail: 'Network or peer reachability is not release evidence.',
    },
  };
}

export function validateCatalog(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new TypeError('catalog must be an object');
  if (raw.schemaVersion !== CATALOG_SCHEMA) throw new TypeError(`unsupported catalog schema: ${string(raw.schemaVersion, 'missing')}`);
  if (!Array.isArray(raw.items)) throw new TypeError('catalog items must be an array');
  const items = raw.items.map(normalizeArtifact);
  const ids = new Set();
  for (const item of items) {
    if (ids.has(item.id)) throw new TypeError(`duplicate artifact id: ${item.id}`);
    ids.add(item.id);
    if (item.availability === 'verified' && receiptEvidence(item).state !== 'verified') {
      throw new TypeError(`${item.id}: verified availability requires complete receipt evidence`);
    }
  }
  return {
    schemaVersion: CATALOG_SCHEMA,
    generatedAt: nullableString(raw.generatedAt),
    build: raw.build && typeof raw.build === 'object' && !Array.isArray(raw.build) ? { ...raw.build } : {},
    sourceSummary: raw.summary && typeof raw.summary === 'object' && !Array.isArray(raw.summary) ? { ...raw.summary } : {},
    items,
  };
}

export function healthEvidence(item) {
  const axes = evidenceAxes(item);
  if (axes.receipt.state === 'verified') {
    return { level: 'verified', label: 'Receipt verified', detail: axes.receipt.detail, evidence: 'receipt', axes };
  }
  if (item?.availability === 'verified') {
    return { level: 'unknown', label: 'Verification unknown', detail: axes.receipt.detail, evidence: axes.receipt.evidence, axes };
  }
  if (item?.availability === 'provisional') return { level: 'provisional', label: 'Provisional', detail: 'Catalog record exists; verified release evidence is absent.', evidence: 'manifest', axes };
  if (item?.availability === 'source-only') return { level: 'source', label: 'Source only', detail: 'Source metadata exists; no staged release receipt is attached.', evidence: 'source', axes };
  if (item?.availability === 'external') return { level: 'external', label: 'External record', detail: 'Destination is external and is not verified by this hub.', evidence: 'external', axes };
  if (item?.availability === 'inline') return { level: 'inline', label: 'Catalog only', detail: 'The record is informational and has no launchable release.', evidence: 'catalog', axes };
  return { level: 'unknown', label: 'Unknown', detail: 'No recognized release-health evidence is present.', evidence: 'none', axes };
}

export function provenance(item) {
  return {
    sourceKind: item.sourceKind,
    gitMode: item.gitMode,
    gitBasis: item.git?.basis || 'unknown',
    revision: item.git?.revision || null,
    path: item.git?.path || null,
    changedAt: item.changedAt || null,
    receiptVersion: item.receipt?.version || null,
    receiptGeneratedAt: item.receipt?.generatedAt || null,
    axes: evidenceAxes(item),
  };
}

export function resolveCatalogUrl(value, pageUrl) {
  if (!value) return null;
  let page;
  try { page = new URL(pageUrl); } catch { return null; }
  try {
    const text = String(value);
    if (!text.startsWith('/') || /^\/{2,}/.test(text)) return new URL(text, page).href;
    const marker = '/hub/v13/';
    const markerIndex = page.pathname.indexOf(marker);
    const deploymentBase = markerIndex >= 0 ? page.pathname.slice(0, markerIndex + 1) : '/';
    return new URL(`${deploymentBase}${text.replace(/^\/+/, '')}`, page.origin).href;
  } catch {
    return null;
  }
}

export function targetPolicy(item, pageUrl) {
  if (!item?.url) return { mode: 'blocked', allowed: false, reason: 'release-not-staged', url: null };
  const resolved = resolveCatalogUrl(item.url, pageUrl);
  if (!resolved) return { mode: 'blocked', allowed: false, reason: 'invalid-url', url: null };
  let target;
  let page;
  try {
    target = new URL(resolved);
    page = new URL(pageUrl);
  } catch {
    return { mode: 'blocked', allowed: false, reason: 'invalid-url', url: null };
  }
  if (!SAFE_PROTOCOLS.has(page.protocol) || page.username || page.password) {
    return { mode: 'blocked', allowed: false, reason: 'invalid-page-url', url: null };
  }
  if (!SAFE_PROTOCOLS.has(target.protocol) || target.username || target.password) {
    return { mode: 'blocked', allowed: false, reason: 'unsafe-url', url: null };
  }
  const external = target.origin !== page.origin || item.sourceKind === 'external' || item.availability === 'external';
  if (external) return { mode: 'external-review', allowed: false, requiresExplicitApproval: true, reason: 'external-content', url: target.href };
  return { mode: 'local', allowed: true, requiresExplicitApproval: false, reason: 'same-origin-release', url: target.href };
}

export { ARTIFACT_ID, CATALOG_SCHEMA };
