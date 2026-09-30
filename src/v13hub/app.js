import { loadCatalog } from './catalog.js';
import { createPeerJsNetLobby } from './peer-lobby.js';
import { createLocalCollectionStore } from './collection.js';
import { readPeerSnapshot } from './peer-boundary.js';
import { createInitialState, hubReducer } from './state.js';
import { renderHub } from './view.js';

const pageUrl = window.location.href;
const collectionStore = createLocalCollectionStore();
const initialCollection = collectionStore.snapshot();
let state = createInitialState({
  collection: initialCollection,
  peer: readPeerSnapshot(window.__V13HUB_PEER_ADAPTER__),
});
let peerLobby = null;

const collectionFeedback = document.createElement('p');
collectionFeedback.id = 'collection-feedback';
collectionFeedback.className = 'proof-line';
collectionFeedback.setAttribute('role', 'status');
collectionFeedback.setAttribute('aria-live', 'polite');
collectionFeedback.hidden = true;
document.querySelector('#collection-summary').insertAdjacentElement('afterend', collectionFeedback);

function dispatch(action) {
  state = hubReducer(state, action);
  renderHub(document, state, { pageUrl });
}

function collectionFailureMessage(result, persisted) {
  if (!persisted.available || result.reason === 'storage-unavailable') {
    return 'Browser storage is unavailable, so V13Hub cannot verify or change the local collection state.';
  }
  if (result.reason === 'ids-clear-failed') {
    return persisted.permitted
      ? 'Could not clear the stored collection IDs. The collection remains enabled and persisted IDs were not reported as cleared.'
      : 'Could not clear previously persisted collection IDs, so the collection was not enabled. Those browser-local bytes were not reported as cleared.';
  }
  if (result.reason === 'permission-clear-failed') {
    return 'Stored collection IDs were cleared, but browser permission could not be disabled. The collection remains enabled.';
  }
  if (result.reason === 'permission-write-failed') {
    return 'Browser-local collection permission could not be persisted. Collection remains disabled.';
  }
  if (result.reason === 'ids-write-failed') {
    return 'The collection change could not be persisted. The displayed collection was restored from browser storage.';
  }
  if (result.reason === 'permission-required') return 'Enable the browser-local collection before changing stored IDs.';
  return 'The collection change could not be verified. The displayed state reflects the latest readable browser storage.';
}

function reportCollectionResult(result, persisted) {
  if (result.ok) {
    collectionFeedback.textContent = '';
    collectionFeedback.hidden = true;
    return;
  }
  collectionFeedback.textContent = collectionFailureMessage(result, persisted);
  collectionFeedback.hidden = false;
}

function refreshCollection(result) {
  // Never render a requested mutation result directly. Re-read persisted bytes
  // and update UI state only when the browser storage snapshot is observable.
  const persisted = collectionStore.snapshot();
  if (persisted.available) {
    dispatch({ type: 'collection.changed', collection: { permitted: persisted.permitted, ids: persisted.ids } });
  }
  reportCollectionResult(result, persisted);
}

let inspectorReturnFocus = null;
let inspectorReturnArtifactId = null;

function openInspector(id, trigger) {
  inspectorReturnFocus = trigger instanceof HTMLElement ? trigger : document.activeElement;
  inspectorReturnArtifactId = id;
  dispatch({ type: 'inspect', id });
  const dialog = document.querySelector('#inspector');
  if (!dialog.open) dialog.showModal();
}

function restoreInspectorFocus() {
  const direct = inspectorReturnFocus;
  const artifactId = inspectorReturnArtifactId;
  inspectorReturnFocus = null;
  inspectorReturnArtifactId = null;
  const fallback = artifactId
    ? [...document.querySelectorAll('[data-action="inspect"]')].find((control) => control.dataset.artifactId === artifactId)
    : null;
  const target = direct?.isConnected ? direct : fallback;
  if (target?.focus) queueMicrotask(() => target.focus({ preventScroll: true }));
}

for (const [id, event, patch] of [
  ['search', 'input', (node) => ({ query: node.value })],
  ['kind-filter', 'change', (node) => ({ kind: node.value })],
  ['availability-filter', 'change', (node) => ({ availability: node.value })],
  ['sort-order', 'change', (node) => ({ sort: node.value })],
  ['collected-only', 'change', (node) => ({ collectedOnly: node.checked })],
]) {
  document.querySelector(`#${id}`).addEventListener(event, (eventObject) => dispatch({ type: 'filter.patch', patch: patch(eventObject.currentTarget) }));
}

document.querySelector('#catalog-tools').addEventListener('submit', (event) => event.preventDefault());

document.querySelector('#clear-filters').addEventListener('click', () => {
  dispatch({ type: 'filter.reset' });
  document.querySelector('#search').focus();
});

document.addEventListener('click', (event) => {
  const control = event.target.closest('[data-action]');
  if (!control) return;
  const action = control.dataset.action;
  const artifactId = control.dataset.artifactId || control.closest('[data-artifact-id]')?.dataset.artifactId;
  if (action === 'inspect' && artifactId) openInspector(artifactId, control);
  else if (action === 'close-inspector') document.querySelector('#inspector').close();
  else if (action === 'enable-collection') refreshCollection(collectionStore.grant());
  else if (action === 'reset-collection') refreshCollection(collectionStore.reset());
  else if (action === 'revoke-collection') refreshCollection(collectionStore.revoke());
  else if (action === 'toggle-collection' && artifactId) refreshCollection(collectionStore.toggle(artifactId));
  else if (action === 'peer-connect') {
    if (peerLobby) peerLobby.disconnect();
    peerLobby = createPeerJsNetLobby({
      lobbyId: document.querySelector('#peer-lobby-id').value,
    });
    peerLobby.addEventListener('health', (peerEvent) => {
      dispatch({ type: 'peer.changed', peer: readPeerSnapshot({ health: () => peerEvent.detail }) });
    });
    peerLobby.addEventListener('peers', () => {
      document.querySelector('#peer-list').textContent = `Peers: ${peerLobby.peers().join(', ') || 'none'}`;
    });
    peerLobby.connect().then((health) => dispatch({ type: 'peer.changed', peer: readPeerSnapshot({ health: () => health }) }));
  }
  else if (action === 'peer-disconnect') {
    peerLobby?.disconnect();
    peerLobby = null;
    dispatch({ type: 'peer.changed', peer: readPeerSnapshot(null) });
    document.querySelector('#peer-list').textContent = 'Peers: none';
  }
  else if (action === 'open-external' && control.dataset.url) {
    const approved = window.confirm(`Open this external destination?\n\n${control.dataset.url}\n\nV13Hub has not verified or fetched this content.`);
    if (approved) window.open(control.dataset.url, '_blank', 'noopener,noreferrer');
  }
});

const inspector = document.querySelector('#inspector');
inspector.addEventListener('click', (event) => {
  if (event.target === event.currentTarget) event.currentTarget.close();
});
inspector.addEventListener('close', restoreInspectorFocus);

renderHub(document, state, { pageUrl });
if (!initialCollection.available) reportCollectionResult({ ok: false, reason: 'storage-unavailable' }, initialCollection);

try {
  const catalog = await loadCatalog({ pageUrl });
  dispatch({ type: 'catalog.loaded', catalog });
} catch (error) {
  dispatch({ type: 'catalog.failed', error: error?.message || error });
}
