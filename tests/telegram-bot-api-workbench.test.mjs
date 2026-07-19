import assert from 'node:assert/strict';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const artifactPath = new URL('../telegram-bot-api-workbench/index.html', import.meta.url);
const html = await readFile(artifactPath, 'utf8');

function inlineScript(source) {
  const matches = [...source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
  assert.equal(matches.length, 1, 'artifact should contain exactly one inline script');
  return matches[0][1];
}

test('artifact is self-contained and has hardened document policy', () => {
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /connect-src https:\/\/api\.telegram\.org/);
  assert.match(html, /object-src 'none'/);
  assert.match(html, /base-uri 'none'/);
  assert.match(html, /name="referrer" content="no-referrer"/);
  assert.match(html, /Permissions-Policy/);
  assert.doesNotMatch(html, /<script[^>]+src=/i);
  assert.doesNotMatch(html, /<link[^>]+rel=["']stylesheet/i);
  assert.doesNotMatch(html, /https?:\/\/[^\s"']+\.(?:js|css)(?:[?"'])/i);
});

test('all element IDs are unique', () => {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert.deepEqual([...new Set(duplicates)], []);
  assert.ok(ids.length > 80, 'expected a substantial interactive workbench');
});

test('inline JavaScript parses successfully', async () => {
  const temporary = new URL('../.telegram-workbench-script-check.mjs', import.meta.url);
  await writeFile(temporary, inlineScript(html), 'utf8');
  try {
    const result = spawnSync(process.execPath, ['--check', temporary.pathname], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  } finally {
    await rm(temporary, { force: true });
  }
});

test('token handling and logs are intentionally constrained', () => {
  assert.match(html, /sessionStorage\.setItem\("telegram-workbench-token"/);
  assert.doesNotMatch(html, /localStorage/);
  assert.match(html, /token\|secret\|password\|authorization/i);
  assert.match(html, /\[REDACTED_TOKEN\]/);
  assert.match(html, /autocomplete="off"/);
  assert.doesNotMatch(html, /value="\d+:[A-Za-z0-9_-]{20,}"/);
  assert.match(html, /profileSelectors/);
  assert.doesNotMatch(html.match(/const profileSelectors = \[[\s\S]*?\];/)?.[0] || '', /#token|#hook-secret/);
});

test('request wrapper supports browser-friendly forms, cancellation, and rate-limit details', () => {
  assert.match(html, /new URLSearchParams\(\)/);
  assert.match(html, /new FormData\(\)/);
  assert.match(html, /activeControllers: new Set\(\)/);
  assert.match(html, /AbortController/);
  assert.match(html, /retry_after/);
  assert.match(html, /migrate_to_chat_id/);
  assert.match(html, /Network request failed\. Check connectivity/);
});

test('core Telegram workflows are represented', () => {
  for (const method of [
    'getMe',
    'getWebhookInfo',
    'setWebhook',
    'deleteWebhook',
    'sendMessage',
    'editMessageText',
    'deleteMessage',
    'answerCallbackQuery',
    'getUpdates',
    'getMyCommands',
    'setMyCommands',
    'deleteMyCommands',
    'getChat',
    'getChatMember'
  ]) {
    assert.match(html, new RegExp(`\\b${method}\\b`), `missing ${method}`);
  }
});

test('clipboard fallback works for file URLs and non-secure contexts', () => {
  assert.match(html, /navigator\.clipboard\?\.writeText/);
  assert.match(html, /window\.isSecureContext/);
  assert.match(html, /document\.execCommand\("copy"\)/);
});
