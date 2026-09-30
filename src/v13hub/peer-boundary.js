const ARTIFACT_ID = /^[a-z0-9][a-z0-9._-]*$/;
const OFFER_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

function cleanHealth(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return {
    state: typeof raw.state === 'string' && raw.state ? raw.state : 'unknown',
    connected: typeof raw.connected === 'boolean' ? raw.connected : null,
    role: typeof raw.role === 'string' ? raw.role : null,
    myId: typeof raw.myId === 'string' && raw.myId ? raw.myId : null,
    peerCount: Number.isInteger(raw.peerCount) && raw.peerCount >= 0 ? raw.peerCount : null,
    changedAt: Number.isFinite(raw.changedAt) ? raw.changedAt : null,
    lastError: raw.lastError == null ? null : String(raw.lastError),
  };
}

function seenContains(values, candidate) {
  if (!values) return false;
  if (typeof values.has === 'function') return values.has(candidate);
  if (Array.isArray(values)) return values.includes(candidate);
  return false;
}

function sanitizeRemoteArtifact(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  if (!id || !ARTIFACT_ID.test(id)) return null;
  return {
    id,
    title: typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : null,
    description: typeof raw.description === 'string' ? raw.description : null,
    version: typeof raw.version === 'string' && raw.version ? raw.version : null,
  };
}

export function readPeerSnapshot(adapter) {
  const base = { axis: 'runtime-network', authority: 'diagnostic-only', releaseHealth: 'unknown' };
  if (!adapter || typeof adapter.health !== 'function') {
    return { ...base, state: 'disabled', connected: false, label: 'Disabled by default', proof: null };
  }
  try {
    const health = cleanHealth(adapter.health());
    if (!health) return { ...base, state: 'unproven', connected: false, label: 'Adapter returned no health evidence', proof: null };
    if (health.connected === null) {
      return { ...base, state: 'unproven', connected: false, label: 'Adapter omitted explicit connectivity evidence', proof: health };
    }
    if (health.connected !== true) return { ...base, state: 'offline', connected: false, label: `Adapter ${health.state}`, proof: health };
    return { ...base, state: 'connected', connected: true, label: `Connected · ${health.peerCount ?? 'unknown'} peers`, proof: health };
  } catch (error) {
    return { ...base, state: 'error', connected: false, label: 'Adapter health check failed', proof: { error: String(error?.message || error) } };
  }
}

export function reviewRemoteOffer(raw, {
  userApproved = false,
  seenOfferIds = null,
  seenCapabilityTokens = null,
  now = Date.now(),
} = {}) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { accepted: false, reason: 'invalid-offer' };
  const offerId = typeof raw.offerId === 'string' ? raw.offerId.trim() : '';
  const token = typeof raw.token === 'string' ? raw.token.trim() : '';
  if (!OFFER_ID.test(offerId) || !token || token.length > 4096) {
    return { accepted: false, reason: 'capability-evidence-required' };
  }
  if (seenContains(seenOfferIds, offerId) || seenContains(seenCapabilityTokens, token)) {
    return { accepted: false, reason: 'replay-detected' };
  }
  let expiresAt = null;
  if (raw.expiresAt != null) {
    const parsedExpiry = Date.parse(raw.expiresAt);
    if (!Number.isFinite(parsedExpiry)) return { accepted: false, reason: 'invalid-expiry' };
    if (parsedExpiry <= now) return { accepted: false, reason: 'offer-expired' };
    expiresAt = new Date(parsedExpiry).toISOString();
  }
  const artifact = sanitizeRemoteArtifact(raw.artifact);
  if (!artifact) return { accepted: false, reason: 'artifact-metadata-required' };
  if (!userApproved) return { accepted: false, reason: 'explicit-review-required' };
  return {
    accepted: true,
    state: 'staged-for-review',
    offerId,
    expiresAt,
    artifact,
    authority: {
      catalog: false,
      collection: false,
      release: false,
    },
  };
}
