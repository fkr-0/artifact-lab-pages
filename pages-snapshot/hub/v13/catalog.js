import { validateCatalog } from './contracts.js';

const CATALOG_PROTOCOLS = new Set(['http:', 'https:']);

function pageAuthority(pageUrl) {
  let page;
  try { page = new URL(pageUrl); } catch { throw new TypeError('page URL is invalid'); }
  if (!CATALOG_PROTOCOLS.has(page.protocol) || page.username || page.password) {
    throw new TypeError('page URL is outside the catalog network policy');
  }
  return page;
}

function authoritativeCatalogUrl(value, page) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError('catalog candidate must be a non-empty URL string');
  let resolved;
  try { resolved = new URL(value, page); } catch { throw new TypeError('catalog candidate URL is malformed'); }
  if (!CATALOG_PROTOCOLS.has(resolved.protocol)) throw new TypeError('catalog candidate protocol is not allowed');
  if (resolved.username || resolved.password) throw new TypeError('catalog candidate credentials are not allowed');
  if (resolved.origin !== page.origin) throw new TypeError('cross-origin catalog candidate is not allowed');
  return resolved;
}

function finalCatalogUrl(response, requested, page) {
  if (response?.redirected === true && !response.url) {
    throw new TypeError('catalog redirect cannot be verified');
  }
  if (!response?.url) return requested;
  let final;
  try { final = new URL(response.url); } catch { throw new TypeError('catalog response URL is malformed'); }
  if (!CATALOG_PROTOCOLS.has(final.protocol)) throw new TypeError('catalog response protocol is not allowed');
  if (final.username || final.password) throw new TypeError('catalog response credentials are not allowed');
  if (final.origin !== page.origin) throw new TypeError('cross-origin catalog response is not allowed');
  return final;
}

export function catalogCandidates(pageUrl) {
  const pathname = pageAuthority(pageUrl).pathname;
  if (pathname.includes('/hub/v13/')) return ['../../catalog/catalog.json', './catalog.json'];
  return ['../../registry/generated/catalog.json', './catalog.json'];
}

export async function loadCatalog({ fetchImpl = globalThis.fetch, pageUrl = globalThis.location?.href, candidates } = {}) {
  if (typeof fetchImpl !== 'function') throw new TypeError('catalog fetch implementation is unavailable');
  if (!pageUrl) throw new TypeError('page URL is required');
  const attempts = [];
  const page = pageAuthority(pageUrl);
  const candidateList = candidates ?? catalogCandidates(pageUrl);
  if (!Array.isArray(candidateList)) throw new TypeError('catalog candidates must be an array');
  for (const candidate of candidateList) {
    try {
      const requested = authoritativeCatalogUrl(candidate, page);
      const response = await fetchImpl(requested.href, {
        cache: 'no-store',
        credentials: 'same-origin',
        redirect: 'error',
      });
      if (!response?.ok) throw new Error(`${response?.status || 'network'} ${response?.statusText || 'error'}`);
      const final = finalCatalogUrl(response, requested, page);
      const parsed = validateCatalog(await response.json());
      return { ...parsed, sourceUrl: final.href, requestedUrl: requested.href };
    } catch (error) {
      attempts.push(error);
    }
  }
  throw new AggregateError(attempts, `No authoritative V13 catalog could be loaded (${attempts.length} candidate${attempts.length === 1 ? '' : 's'} rejected)`);
}
