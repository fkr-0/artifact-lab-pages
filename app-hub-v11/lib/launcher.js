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
