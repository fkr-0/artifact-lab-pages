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

export function collectTagStats(items = []) {
  const counts = new Map();
  for (const item of items) for (const tag of item.tags || []) counts.set(tag, (counts.get(tag) || 0) + 1);
  return [...counts.entries()].map(([tag, count]) => ({ tag, count })).sort((a, b) => a.tag.localeCompare(b.tag));
}

export function createTagFilterState(activeTags = [], mode = 'OR') {
  return { activeTags: new Set(activeTags), mode: mode === 'AND' ? 'AND' : 'OR' };
}

export function tagColorStyle(tag = '') {
  let hash = 0;
  for (const char of String(tag)) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  const hue = Math.abs(hash) % 360;
  return `--tag-hue:${hue};--tag-border:hsl(${hue} 92% 58%);--tag-bg:hsl(${hue} 92% 18% / .36);`;
}

export function toggleTagFilter(state, tag) {
  state.activeTags.has(tag) ? state.activeTags.delete(tag) : state.activeTags.add(tag);
  return state;
}

export function filterArtifactsWithTags(items, state = createTagFilterState()) {
  const tags = [...(state.activeTags || [])];
  if (!tags.length) return [...items];
  return items.filter((item) => {
    const itemTags = new Set(item.tags || []);
    return state.mode === 'AND' ? tags.every((tag) => itemTags.has(tag)) : tags.some((tag) => itemTags.has(tag));
  });
}

export function filterArtifactsAdvanced(items, { query = '', tagState = createTagFilterState() } = {}) {
  return filterArtifacts(filterArtifactsWithTags(items, tagState), query);
}

export function renderTagFilterControls(items, state = createTagFilterState()) {
  return collectTagStats(items).map(({ tag, count }) => {
    const active = state.activeTags?.has(tag) ? ' active' : '';
    return `<button type="button" class="tag-button${active}" data-tag="${escapeHtml(tag)}" style="${tagColorStyle(tag)}">${escapeHtml(tag)} (${count})</button>`;
  }).join('');
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

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[char]);
}
