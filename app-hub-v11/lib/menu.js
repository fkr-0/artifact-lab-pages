export function textForArtifact(item) {
  return [item.id, item.title, item.kind, item.description, item.note, ...(item.tags || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function filterArtifacts(items, query = '') {
  const terms = String(query).trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [...items];
  return items.filter((item) => {
    const haystack = textForArtifact(item);
    return terms.every((term) => haystack.includes(term));
  });
}

export function buildMenuGroups(items, { groupBy = 'tags' } = {}) {
  const groups = new Map();
  for (const item of items) {
    const keys = groupBy === 'kind' ? [item.kind || 'other'] : (item.tags?.length ? item.tags : [item.kind || 'other']);
    for (const key of keys) {
      if (!groups.has(key)) groups.set(key, { id: key, title: titleize(key), items: [] });
      groups.get(key).items.push(item);
    }
  }
  return [...groups.values()].sort((a, b) => a.title.localeCompare(b.title));
}

function titleize(value) {
  return String(value).replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}
