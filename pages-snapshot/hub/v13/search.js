function normalized(value) {
  return String(value || '').trim().toLocaleLowerCase();
}

function timestamp(value) {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? parsed : 0;
}

const searchTextCache = new WeakMap();

function searchableText(item) {
  const cached = searchTextCache.get(item);
  if (cached) return cached;
  const value = normalized([
    item.id,
    item.title,
    item.description,
    item.kind,
    item.status,
    item.sourceKind,
    item.gitMode,
    item.buildMode,
    item.releaseKind,
    item.availability,
    item.git?.basis,
    item.git?.path,
    item.git?.revision,
    item.receipt?.version,
    ...(item.tags || []),
  ].join(' '));
  searchTextCache.set(item, value);
  return value;
}

export function deriveFacets(items) {
  const count = (field) => [...items.reduce((map, item) => {
    const value = item[field] || 'unknown';
    map.set(value, (map.get(value) || 0) + 1);
    return map;
  }, new Map()).entries()].sort(([left], [right]) => left.localeCompare(right));
  return { kinds: count('kind'), availability: count('availability') };
}

export function filterArtifacts(items, filters = {}, collectionIds = []) {
  const query = normalized(filters.query);
  const tokens = query ? query.split(/\s+/).filter(Boolean) : [];
  const collected = new Set(collectionIds);
  const matching = items.filter((item) => {
    if (filters.kind && item.kind !== filters.kind) return false;
    if (filters.availability && item.availability !== filters.availability) return false;
    if (filters.collectedOnly && !collected.has(item.id)) return false;
    if (!tokens.length) return true;
    const haystack = searchableText(item);
    return tokens.every((token) => haystack.includes(token));
  });
  if (filters.sort === 'title') return matching.toSorted((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
  return matching.toSorted((a, b) => timestamp(b.changedAt) - timestamp(a.changedAt) || a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
}
