const HTML_ESCAPE = new Map([
  ['&', '&amp;'],
  ['<', '&lt;'],
  ['>', '&gt;'],
  ['"', '&quot;'],
  ["'", '&#39;'],
]);

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPE.get(char));
}

export function safeCssColor(value, fallback = '#8cf') {
  const text = String(value ?? '').trim();
  if (/^#[0-9a-f]{3,8}$/i.test(text)) return text;
  if (/^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i.test(text)) return text;
  if (/^[a-z]+$/i.test(text) && ['white', 'black', 'red', 'green', 'blue', 'cyan', 'magenta', 'yellow', 'orange'].includes(text.toLowerCase())) return text;
  return fallback;
}

export function safeInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : fallback;
}

export function prependHtml(container, html) {
  if (!container) return;
  const template = document.createElement('template');
  template.innerHTML = String(html ?? '').trim();
  container.prepend(template.content);
}

export function renderStoryMessage(message = {}) {
  const speakerColor = safeCssColor(message.speakerColor, '#8cf');
  const speakerName = escapeHtml(message.speakerName ?? message.speaker ?? 'Signal');
  const role = message.role
    ? `<span style="opacity: 0.6; font-size: 11px;">[${escapeHtml(message.role)}]</span>`
    : '';
  const text = escapeHtml(message.text ?? '');

  return `
    <div style="opacity: 0.92; margin: 2px 0;">
      <span style="opacity: 0.45; color: ${speakerColor}">${speakerName}&gt;</span>
      ${role}
      <span style="margin-left: 4px;">${text}</span>
    </div>
  `;
}

export function renderAchievementToast(achievement = {}) {
  const name = escapeHtml(achievement.name ?? 'Achievement');
  const description = escapeHtml(achievement.description ?? '');
  const xp = safeInteger(achievement.xp, 0);

  return `
    <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,140,0,0.1)); border: 2px solid rgba(255,215,0,0.3); border-radius: 8px; margin-bottom: 8px;">
      <div style="font-size: 24px;">🏆</div>
      <div style="flex: 1;">
        <div style="color: #ffd700; font-weight: bold; font-size: 14px;">${name}</div>
        <div style="color: #fff; font-size: 12px; opacity: 0.8;">${description}</div>
        <div style="color: #8f8; font-size: 11px;">+${xp} XP</div>
      </div>
    </div>
  `;
}
