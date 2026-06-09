import assert from 'node:assert/strict';
import {
  escapeHtml,
  safeCssColor,
  renderAchievementToast,
  renderStoryMessage,
} from '../hyperblast-shooter/js/render-safe.js';

const payload = '<img src=x onerror="globalThis.__pwned=1"> & "quotes"';

assert.equal(
  escapeHtml(payload),
  '&lt;img src=x onerror=&quot;globalThis.__pwned=1&quot;&gt; &amp; &quot;quotes&quot;',
  'escapeHtml should encode HTML metacharacters and quotes',
);

assert.equal(safeCssColor('#0cf'), '#0cf', 'safeCssColor should allow simple hex colors');
assert.equal(safeCssColor('rgba(10, 20, 30, 0.4)'), 'rgba(10, 20, 30, 0.4)', 'safeCssColor should allow rgba colors');
assert.equal(safeCssColor('url(javascript:alert(1))'), '#8cf', 'safeCssColor should reject CSS url/script values');

const story = renderStoryMessage({
  speakerName: payload,
  speakerColor: 'url(javascript:alert(1))',
  role: '<svg onload=alert(1)>',
  text: payload,
});
assert.doesNotMatch(story, /<img|<svg|javascript:/i, 'story message should not contain executable markup or scriptable CSS');
assert.match(story, /&lt;img src=x/, 'story message should preserve escaped text content');
assert.match(story, /\[&lt;svg/, 'story role should be escaped text');
assert.match(story, /color: #8cf/, 'unsafe speaker color should fall back to a safe color');

const toast = renderAchievementToast({
  name: payload,
  description: '<script>alert(1)</script>',
  xp: '<img onerror=alert(1)>',
});
assert.doesNotMatch(toast, /<script|<img/i, 'achievement toast should not contain executable markup');
assert.match(toast, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/, 'achievement description should be escaped');
assert.match(toast, /\+0 XP/, 'non-numeric XP should be coerced to safe numeric text');

console.log('hyperblast render safety smoke checks passed');
