const aliases = new Map([
  ['popup', 'newWindow'],
  ['new-window', 'newWindow'],
  ['window', 'newWindow'],
  ['tab', 'tabbed'],
  ['dock', 'inline'],
]);

export function normalizeLaunchMode(mode = 'inline') {
  const normalized = aliases.get(mode) || mode;
  return ['inline', 'floating', 'tabbed', 'fullscreen', 'newWindow'].includes(normalized) ? normalized : 'inline';
}

export function artifactHref(item) {
  return item.hubHref || item.href || item.source || '#';
}

export function launchUrlForMode(item, mode = 'inline', action = null) {
  const normalized = normalizeLaunchMode(mode);
  const href = artifactHref(item);
  if (!href || href === '#') return '#';
  if (!['inline', 'floating', 'fullscreen'].includes(normalized)) return href;
  if (/^https?:\/\//.test(href)) return href;
  const params = ['embedded=true'];
  if (action?.multiplayer) params.push('multiplayer=true');
  if (action?.targetPeerId) params.push(`targetPeerId=${encodeURIComponent(action.targetPeerId)}`);
  if (action?.spectate || action?.observe) params.push('spectate=true', 'observe=true');
  if (action?.mode) params.push(`mode=${encodeURIComponent(action.mode)}`);
  if (action?.session) params.push(`session=${encodeURIComponent(action.session)}`);
  const glue = href.includes('?') ? '&' : '?';
  return `${href}${glue}${params.join('&')}`;
}

export function launchArtifact(item, mode = 'inline', runtime = globalThis, action = null) {
  const normalized = normalizeLaunchMode(mode);
  const url = launchUrlForMode(item, normalized, action);
  if (normalized === 'newWindow' || normalized === 'tabbed') {
    runtime.open?.(url, '_blank', 'noopener,noreferrer');
    return { mode: normalized, url, handledByBrowser: true, action };
  }
  return { mode: normalized, url, handledByBrowser: false, action };
}

export function createInlineTabDeck({ deck, tabs, body, runtime = globalThis, onChange = () => {} } = {}) {
  if (!deck || !tabs || !body) throw new Error('createInlineTabDeck requires deck, tabs, and body elements');
  const documentRef = runtime.document;
  const openApps = new Map();
  let activeAppId = null;
  let nextAppId = 1;

  const setActive = (appId) => {
    const appData = openApps.get(appId);
    if (!appData) return;
    activeAppId = appId;
    for (const [id, data] of openApps) {
      data.tab.classList?.toggle('active', id === appId);
      data.panel.classList?.toggle('active', id === appId);
    }
    deck.classList?.add('active');
    onChange({ type: 'switch', activeAppId, openApps });
  };

  const close = (appId) => {
    const appData = openApps.get(appId);
    if (!appData) return;
    appData.tab.remove?.();
    appData.panel.remove?.();
    openApps.delete(appId);
    if (activeAppId === appId) {
      const next = openApps.keys().next().value;
      if (next) setActive(next);
      else {
        activeAppId = null;
        deck.classList?.remove('active');
        onChange({ type: 'empty', activeAppId, openApps });
      }
    } else {
      onChange({ type: 'close', activeAppId, openApps });
    }
  };

  const open = (artifact, launch = {}) => {
    if (openApps.has(artifact.id)) {
      setActive(artifact.id);
      return openApps.get(artifact.id);
    }
    const instanceId = `${artifact.id}-${nextAppId++}`;
    const tab = documentRef.createElement('button');
    tab.className = 'app-deck-tab';
    tab.dataset.appId = artifact.id;
    tab.dataset.instanceId = instanceId;
    const title = documentRef.createElement('span');
    title.textContent = artifact.title || artifact.name || artifact.id;
    const closeButton = documentRef.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'app-deck-tab-close';
    closeButton.dataset.close = artifact.id;
    closeButton.textContent = '✕';
    closeButton.onclick = (event) => { event?.stopPropagation?.(); close(artifact.id); };
    tab.closeButton = closeButton;
    tab.append(title, closeButton);
    tab.onclick = () => setActive(artifact.id);

    const panel = documentRef.createElement('section');
    panel.className = 'app-deck-panel';
    panel.dataset.appId = artifact.id;
    panel.dataset.instanceId = instanceId;
    if (launch.url === '#') {
      panel.innerHTML = `<div class="app-deck-empty">No launchable content for ${escapeHtml(artifact.title || artifact.id)}</div>`;
    } else {
      panel.innerHTML = `<iframe class="app-deck-inline-frame" src="${escapeHtml(launch.url || artifactHref(artifact))}" title="${escapeHtml(artifact.title || artifact.id)}" allow="autoplay; fullscreen"></iframe>`;
    }

    tabs.appendChild(tab);
    body.appendChild(panel);
    deck.classList?.add('active');
    const appData = { artifact, instanceId, tab, panel, launch };
    openApps.set(artifact.id, appData);
    setActive(artifact.id);
    onChange({ type: 'open', activeAppId, openApps });
    return appData;
  };

  return { open, close, switchTo: setActive, activeId: () => activeAppId, openApps };
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
  })[char]);
}

export function createFloatingPanel({ title, url }, runtime = globalThis) {
  const documentRef = runtime.document;
  if (!documentRef) throw new Error('createFloatingPanel requires a document runtime');

  documentRef.querySelector?.('.floating')?.remove();
  const panel = documentRef.createElement('section');
  panel.className = 'floating';
  panel.innerHTML = `<header><strong>${escapeHtml(title)}</strong><button type="button">close</button></header><iframe src="${escapeHtml(url)}" title="${escapeHtml(title)}"></iframe>`;
  const closeButton = panel.querySelector('button');
  if (closeButton) closeButton.onclick = () => panel.remove();
  (runtime.body || documentRef.body)?.append(panel);
  return panel;
}
