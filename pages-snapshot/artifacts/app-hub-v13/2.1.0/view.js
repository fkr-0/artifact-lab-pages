import { healthEvidence, provenance, receiptEvidence, targetPolicy } from './contracts.js';
import { arcadeCapabilitySummary } from './arcade-tools.js';
import { deriveFacets, filterArtifacts } from './search.js';

function dateLabel(value) {
  if (!value || Number.isNaN(Date.parse(value))) return 'date unknown';
  return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit' }).format(new Date(value));
}

function renderArcadeTools(document, state, pageUrl) {
  const summary = arcadeCapabilitySummary(state.catalog.items || []);
  const root = document.querySelector('#arcade-tools');
  document.querySelector('#arcade-summary').textContent = `${summary.available}/${summary.total} catalog-backed surfaces available`;
  const cards = summary.tools.map((tool) => {
    const card = node(document, 'article', 'arcade-tool');
    card.append(
      node(document, 'p', 'card-kind', tool.capability),
      node(document, 'h3', '', tool.label),
      node(document, 'p', 'card-description', tool.description),
      node(document, 'p', 'proof-line', `catalog: ${tool.availability}`),
    );
    if (tool.artifact) {
      const policy = targetPolicy(tool.artifact, pageUrl);
      if (policy.mode === 'local' && policy.url) {
        const link = node(document, 'a', 'button button-small', 'Open tool');
        link.href = policy.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        card.append(link);
      } else {
        const inspect = node(document, 'button', 'button button-small button-quiet', 'Inspect catalog record');
        inspect.type = 'button';
        inspect.dataset.action = 'inspect';
        inspect.dataset.artifactId = tool.artifact.id;
        card.append(inspect);
      }
    }
    return card;
  });
  root.replaceChildren(...cards);
}

function node(document, name, className, text) {
  const element = document.createElement(name);
  if (className) element.className = className;
  if (text != null) element.textContent = text;
  return element;
}

function fact(document, label, value) {
  const wrapper = node(document, 'div', 'fact');
  wrapper.append(node(document, 'dt', '', label), node(document, 'dd', '', value || 'unknown'));
  return wrapper;
}

function fillSelect(document, select, entries, firstLabel) {
  const current = select.value;
  const first = document.createElement('option');
  first.value = '';
  first.textContent = firstLabel;
  const options = entries.map(([value, count]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = `${value} · ${count}`;
    return option;
  });
  select.replaceChildren(first, ...options);
  select.value = [...select.options].some((option) => option.value === current) ? current : '';
}

function updateCollectionControl(control, itemId, collectionIds, permitted) {
  control.dataset.artifactId = itemId;
  control.textContent = collectionIds.has(itemId) ? 'Collected' : 'Collect';
  control.disabled = !permitted;
  control.setAttribute('aria-pressed', collectionIds.has(itemId) ? 'true' : 'false');
  control.title = permitted ? '' : 'Enable the local collection first';
}

function createArtifactCard(document, template, item) {
  const card = template.content.firstElementChild.cloneNode(true);
  card.dataset.artifactId = item.id;
  const health = healthEvidence(item);
  const chip = card.querySelector('.health-chip'); chip.textContent = health.label; chip.dataset.level = health.level;
  card.querySelector('.changed-at').textContent = dateLabel(item.changedAt);
  card.querySelector('.card-kind').textContent = `${item.kind} / ${item.sourceKind}`;
  card.querySelector('h3').textContent = item.title;
  card.querySelector('.card-description').textContent = item.description || 'No description supplied by the catalog.';
  card.querySelector('.card-facts').append(
    fact(document, 'status', item.status),
    fact(document, 'build', item.buildMode),
    fact(document, 'Git', item.git?.basis || item.gitMode),
    fact(document, 'release', item.receipt?.version || item.availability),
  );
  card.querySelector('.card-tags').replaceChildren(...item.tags.slice(0, 7).map((tag) => node(document, 'span', 'tag', `#${tag}`)));
  card.querySelector('[data-action="inspect"]').dataset.artifactId = item.id;
  return card;
}

function renderCatalogCards(document, items, visible, collectionIds, permitted) {
  const catalog = document.querySelector('#catalog');
  const template = document.querySelector('#artifact-card-template');
  const liveIds = new Set(items.map((item) => item.id));
  const cache = catalog.__v13CardCache || new Map();
  catalog.__v13CardCache = cache;
  for (const id of cache.keys()) if (!liveIds.has(id)) cache.delete(id);

  const cards = visible.map((item) => {
    const cached = cache.get(item.id);
    let card = cached?.item === item ? cached.card : null;
    if (!card) {
      card = createArtifactCard(document, template, item);
      cache.set(item.id, { item, card });
    }
    updateCollectionControl(card.querySelector('[data-action="toggle-collection"]'), item.id, collectionIds, permitted);
    return card;
  });
  const current = [...catalog.children];
  const orderChanged = current.length !== cards.length || current.some((card, index) => card !== cards[index]);
  if (orderChanged) catalog.replaceChildren(...cards);
  return cards;
}

function renderCollection(document, state) {
  const summary = document.querySelector('#collection-summary');
  const actions = document.querySelector('#collection-actions');
  if (!state.collection.permitted) {
    summary.textContent = 'Nothing is stored until you enable a browser-local collection.';
    const enable = node(document, 'button', 'button button-small', 'Enable local collection');
    enable.type = 'button';
    enable.dataset.action = 'enable-collection';
    actions.replaceChildren(enable);
    return;
  }
  summary.textContent = `${state.collection.ids.length} artifact${state.collection.ids.length === 1 ? '' : 's'} stored as IDs in this browser. No catalog payload or peer data is copied.`;
  const reset = node(document, 'button', 'button button-small button-quiet', 'Clear IDs');
  reset.type = 'button'; reset.dataset.action = 'reset-collection';
  const revoke = node(document, 'button', 'button button-small button-quiet', 'Disable & clear');
  revoke.type = 'button'; revoke.dataset.action = 'revoke-collection';
  actions.replaceChildren(reset, revoke);
}

function renderPeer(document, state) {
  document.querySelector('#peer-summary').textContent = `${state.peer.label}. PeerJSNet is explicit opt-in and remains diagnostic-only; peer state never upgrades release evidence.`;
  const connect = document.querySelector('[data-action="peer-connect"]');
  const disconnect = document.querySelector('[data-action="peer-disconnect"]');
  if (connect) connect.disabled = state.peer.connected;
  if (disconnect) disconnect.disabled = !state.peer.connected;
  const proof = document.querySelector('#peer-proof');
  if (state.peer.connected && state.peer.proof) {
    proof.textContent = `Evidence: state=${state.peer.proof.state} · peerCount=${state.peer.proof.peerCount ?? 'unknown'} · local peer id ${state.peer.proof.myId || 'not reported'}`;
  } else if (state.peer.proof?.lastError) {
    proof.textContent = `Adapter report: ${state.peer.proof.lastError}`;
  } else {
    proof.textContent = 'No network proof is asserted.';
  }
}

function renderInspector(document, item, pageUrl, collected) {
  const content = document.querySelector('#inspector-content');
  if (!item) { content.replaceChildren(); return; }
  const health = healthEvidence(item);
  const source = provenance(item);
  const policy = targetPolicy(item, pageUrl);
  const heading = node(document, 'div', 'inspector-heading');
  const title = node(document, 'h2', '', item.title); title.id = 'inspector-title';
  heading.append(node(document, 'p', 'inspector-kind', `${item.kind} · ${health.label}`), title, node(document, 'p', 'inspector-description', item.description || 'No description supplied by the catalog.'));

  const evidence = node(document, 'section', 'inspector-section');
  evidence.append(node(document, 'h3', '', 'Health evidence'), node(document, 'p', '', health.detail));
  const healthFacts = node(document, 'dl', 'inspector-facts');
  healthFacts.append(
    fact(document, 'availability', item.availability),
    fact(document, 'status', item.status),
    fact(document, 'receipt', source.receiptVersion || 'none'),
  );
  evidence.append(healthFacts);

  const provenanceSection = node(document, 'section', 'inspector-section');
  provenanceSection.append(node(document, 'h3', '', 'Provenance'));
  const provenanceFacts = node(document, 'dl', 'inspector-facts');
  provenanceFacts.append(
    fact(document, 'source', source.sourceKind),
    fact(document, 'Git ownership', source.gitMode),
    fact(document, 'Git date basis', source.gitBasis),
    fact(document, 'revision', source.revision ? source.revision.slice(0, 12) : 'not reported'),
    fact(document, 'changed', dateLabel(source.changedAt)),
  );
  provenanceSection.append(provenanceFacts);

  const actions = node(document, 'section', 'inspector-section inspector-actions');
  actions.append(node(document, 'h3', '', 'Publication boundary'));
  const collect = node(document, 'button', 'button button-primary', collected ? 'Remove from collection' : 'Collect locally');
  collect.type = 'button'; collect.dataset.action = 'toggle-collection'; collect.dataset.artifactId = item.id;
  collect.setAttribute('aria-pressed', collected ? 'true' : 'false');
  collect.disabled = !document.documentElement.dataset.collectionEnabled;
  actions.append(collect);
  if (policy.mode === 'local' && policy.url) {
    const link = node(document, 'a', 'button button-quiet', item.kind === 'download' ? 'Open local download' : 'Open local release');
    link.href = policy.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
    actions.append(link);
  } else if (policy.mode === 'external-review' && policy.url) {
    const external = node(document, 'button', 'button button-danger', 'Review external destination');
    external.type = 'button'; external.dataset.action = 'open-external'; external.dataset.url = policy.url;
    actions.append(external, node(document, 'p', 'permission-note', 'External content is never fetched for previews. Opening it requires this explicit action and a confirmation.'));
  } else {
    actions.append(node(document, 'p', 'permission-note', 'No launchable release is evidenced by this catalog record.'));
  }
  content.replaceChildren(heading, evidence, provenanceSection, actions);
}

export function renderHub(document, state, { pageUrl } = {}) {
  const catalog = state.catalog;
  const items = catalog.items || [];
  const visible = filterArtifacts(items, state.filters, state.collection.ids);
  const verified = items.filter((item) => receiptEvidence(item).state === 'verified').length;
  document.documentElement.dataset.collectionEnabled = state.collection.permitted ? 'true' : '';
  document.querySelector('#metric-total').textContent = state.catalogStatus === 'ready' ? String(items.length) : '—';
  document.querySelector('#metric-verified').textContent = state.catalogStatus === 'ready' ? String(verified) : '—';
  document.querySelector('#metric-collected').textContent = String(state.collection.ids.length);
  document.querySelector('#metric-catalog-state').textContent = state.catalogStatus === 'ready' ? 'authoritative records loaded' : state.catalogStatus;
  document.querySelector('#build-header').textContent = state.catalogStatus === 'ready'
    ? `portfolio ${catalog.build?.portfolioVersion || 'dev'} · ${catalog.build?.generator || 'catalog'} · peer opt-in`
    : 'portfolio loading · peer opt-in';
  document.querySelector('#catalog-source').textContent = catalog.sourceUrl ? `catalog ${new URL(catalog.sourceUrl).pathname}` : 'catalog unavailable';
  document.querySelector('#footer-counts').textContent = state.catalogStatus === 'ready'
    ? `${items.length} total · ${verified} verified · ${visible.length} shown`
    : 'counts pending';
  document.querySelector('#runtime-state').textContent = state.peer.connected ? 'peer adapter evidenced' : 'local-only runtime';

  renderCollection(document, state);
  renderPeer(document, state);
  renderArcadeTools(document, state, pageUrl);

  const facets = deriveFacets(items);
  fillSelect(document, document.querySelector('#kind-filter'), facets.kinds, 'All products');
  fillSelect(document, document.querySelector('#availability-filter'), facets.availability, 'All evidence');
  document.querySelector('#search').value = state.filters.query;
  document.querySelector('#sort-order').value = state.filters.sort;
  document.querySelector('#collected-only').checked = state.filters.collectedOnly;

  const strip = document.querySelector('#facet-strip');
  strip.replaceChildren(...facets.availability.map(([value, count]) => node(document, 'span', `facet facet-${value}`, `${value} ${count}`)));
  document.querySelector('#result-summary').textContent = state.catalogStatus === 'ready'
    ? `${visible.length} shown · ${items.length} catalog records`
    : state.catalogStatus === 'loading' ? 'Loading catalog…' : 'Catalog unavailable';

  const collectionIds = new Set(state.collection.ids);
  const cards = state.catalogStatus === 'ready'
    ? renderCatalogCards(document, items, visible, collectionIds, state.collection.permitted)
    : [];
  if (state.catalogStatus === 'loading') {
    const loading = node(document, 'div', 'catalog-loading', 'Loading authoritative catalog…');
    loading.setAttribute('role', 'status');
    document.querySelector('#catalog').replaceChildren(loading);
  } else if (state.catalogStatus === 'error') {
    document.querySelector('#catalog').replaceChildren();
  }
  document.querySelector('#empty-state').hidden = state.catalogStatus !== 'ready' || cards.length !== 0;
  const error = document.querySelector('#catalog-error');
  error.hidden = state.catalogStatus !== 'error';
  document.querySelector('#catalog-error-message').textContent = state.catalogError || '';
  renderInspector(document, items.find((item) => item.id === state.selectedId), pageUrl, collectionIds.has(state.selectedId));
  return { visibleCount: visible.length, totalCount: items.length };
}
