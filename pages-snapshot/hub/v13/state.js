export function createInitialState({ collection = { permitted: false, ids: [] }, peer } = {}) {
  return {
    catalogStatus: 'loading',
    catalog: { items: [], sourceSummary: {}, build: {}, generatedAt: null, sourceUrl: null },
    catalogError: null,
    filters: { query: '', kind: '', availability: '', collectedOnly: false, sort: 'recent' },
    collection: { permitted: collection.permitted === true, ids: [...(collection.ids || [])] },
    peer: peer || { state: 'disabled', connected: false, label: 'Disabled by default', proof: null },
    selectedId: null,
  };
}

export function hubReducer(state, action) {
  switch (action.type) {
    case 'catalog.loaded':
      return { ...state, catalogStatus: 'ready', catalog: action.catalog, catalogError: null };
    case 'catalog.failed':
      return { ...state, catalogStatus: 'error', catalogError: String(action.error || 'Catalog unavailable') };
    case 'filter.patch':
      return { ...state, filters: { ...state.filters, ...action.patch } };
    case 'filter.reset':
      return { ...state, filters: { query: '', kind: '', availability: '', collectedOnly: false, sort: 'recent' } };
    case 'collection.changed':
      return { ...state, collection: { permitted: action.collection.permitted === true, ids: [...(action.collection.ids || [])] } };
    case 'peer.changed':
      return { ...state, peer: action.peer };
    case 'inspect':
      return { ...state, selectedId: action.id || null };
    default:
      return state;
  }
}
