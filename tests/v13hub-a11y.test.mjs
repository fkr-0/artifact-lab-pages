import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { healthEvidence } from '../src/v13hub/contracts.js';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const [html, css, app, view] = await Promise.all([
  read('src/v13hub/index.html'),
  read('src/v13hub/styles.css'),
  read('src/v13hub/app.js'),
  read('src/v13hub/view.js'),
]);

function cssToken(name) {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i'));
  assert.ok(match, `missing --${name} token`);
  return match[1];
}

function relativeLuminance(hex) {
  const channels = hex.slice(1).match(/../g).map((pair) => Number.parseInt(pair, 16) / 255);
  const [r, g, b] = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(foreground, background) {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

function compositeHex(foreground, background, alpha) {
  const foregroundChannels = foreground.slice(1).match(/../g).map((pair) => Number.parseInt(pair, 16));
  const backgroundChannels = background.slice(1).match(/../g).map((pair) => Number.parseInt(pair, 16));
  const channels = foregroundChannels.map((channel, index) => Math.round(alpha * channel + (1 - alpha) * backgroundChannels[index]));
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

test('meaningful dim text clears WCAG AA against every V13 surface it occupies', () => {
  const dim = cssToken('dim');
  const surfaces = ['ground', 'panel', 'panel-raised'];
  for (const surface of surfaces) {
    const ratio = contrastRatio(dim, cssToken(surface));
    assert.ok(ratio >= 4.5, `--dim contrast on --${surface} is ${ratio.toFixed(2)}:1; expected >= 4.5:1`);
  }

  for (const selector of ['.hero-metrics small', '.rail-index', '.catalog-tools label', '.facet', '.changed-at', '.fact dt', '.tag', '.site-footer']) {
    assert.match(css, new RegExp(`${selector.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}[^}]*var\\(--dim\\)`, 's'), `${selector} must remain governed by the qualified dim token`);
  }

  const disabledOpacity = Number(css.match(/\.button:disabled\s*\{[^}]*opacity:\s*([0-9.]+)/s)?.[1]);
  assert.ok(Number.isFinite(disabledOpacity), 'disabled button opacity must be explicit');
  for (const surface of surfaces) {
    const background = cssToken(surface);
    const disabledText = compositeHex(cssToken('ink'), background, disabledOpacity);
    assert.ok(contrastRatio(disabledText, background) >= 4.5, `disabled text contrast on --${surface} must remain >= 4.5:1`);
    const disabledPrimaryText = compositeHex('#06100c', background, disabledOpacity);
    const disabledPrimaryBackground = compositeHex(cssToken('mint'), background, disabledOpacity);
    assert.ok(contrastRatio(disabledPrimaryText, disabledPrimaryBackground) >= 4.5, `disabled primary contrast on --${surface} must remain >= 4.5:1`);
  }
});

test('skip, status, error, and collection state semantics are explicit', () => {
  assert.match(html, /<a class="skip-link" href="#catalog">Skip to artifacts<\/a>/);
  assert.match(html, /<section id="catalog"[^>]*tabindex="-1"/);
  assert.match(html, /id="result-summary"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(html, /id="collection-summary"[^>]*role="status"[^>]*aria-live="polite"[^>]*aria-atomic="true"/);
  assert.match(html, /id="empty-state"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(html, /id="catalog-error"[^>]*role="alert"/);
  assert.match(html, /<dialog id="inspector"[^>]*aria-labelledby="inspector-title"/);
  assert.match(view, /setAttribute\('aria-pressed',/);
  assert.match(view, /\.disabled\s*=\s*!/);
  assert.match(app, /inspector\.addEventListener\('close', restoreInspectorFocus\)/);
  assert.match(app, /target\.focus\(\{ preventScroll: true \}\)/);
});

test('focus, touch-target, reflow, and reduced-motion contracts are durable CSS rules', () => {
  assert.match(css, /\.button\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.button-small\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.icon-button\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px/s);
  assert.match(css, /catalog-tools input\[type="search"\][^}]*min-height:\s*44px/s);
  assert.match(css, /\.toggle-field\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.button:focus-visible[^}]*outline:\s*2px solid var\(--mint\)/s);
  assert.match(css, /catalog-tools input:focus-visible[^}]*outline:\s*2px solid var\(--mint\)/s);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.catalog-tools\s*\{[^}]*grid-template-columns:\s*1fr/);
  assert.match(css, /@media \(max-width: 420px\)[\s\S]*\.card-facts, \.inspector-facts\s*\{[^}]*grid-template-columns:\s*1fr/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*scroll-behavior:\s*auto/);
  assert.match(css, /\.inspector\s*\{[^}]*overflow:\s*auto/s);
});

test('evidence meaning is exposed in text rather than color alone', () => {
  const examples = [
    { availability: 'verified', receipt: { files: 3 } },
    { availability: 'provisional', receipt: null },
    { availability: 'external', receipt: null },
    { availability: 'unknown', receipt: null },
  ];
  const labels = examples.map((item) => healthEvidence(item).label);
  assert.equal(new Set(labels).size, labels.length);
  assert.ok(labels.every((label) => label.length > 0));
  assert.match(view, /chip\.textContent = health\.label; chip\.dataset\.level = health\.level/);
});
