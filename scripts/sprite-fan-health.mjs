#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = new URL('..', import.meta.url);
const rel = (path) => new URL(path, ROOT);
const read = (path) => readFile(rel(path), 'utf8');

function ok(label) {
  console.log(`ok  - ${label}`);
}

function fail(label, error) {
  console.error(`fail - ${label}`);
  console.error(error?.stack || error?.message || String(error));
  process.exitCode = 1;
}

async function check(label, fn) {
  try {
    await fn();
    ok(label);
  } catch (error) {
    fail(label, error);
  }
}

const html = await read('sprite-fan/atlas-studio.html');
const shell = await read('sprite-fan/src/atlas-studio.html');
const cssSource = await read('sprite-fan/src/studio.css');
const jsSource = await read('sprite-fan/src/studio.js');
const script = html.match(/<script>([\s\S]*)<\/script>/)?.[1] ?? '';

await check('atlas-studio has no duplicate DOM ids', () => {
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  assert.deepEqual(duplicates, []);
});

await check('atlas-studio avoids dynamic non-empty innerHTML assignments', () => {
  const unsafeAssignments = [...script.matchAll(/\.innerHTML\s*=\s*([^;]+)/g)]
    .map((match) => match[1].trim())
    .filter((rhs) => rhs !== "''" && rhs !== '""');
  assert.deepEqual(unsafeAssignments, []);
});

await check('source split rebuilds the checked-in standalone artifact', () => {
  assert.match(shell, /\{\{SPRITE_FAN_CSS\}\}/);
  assert.match(shell, /\{\{SPRITE_FAN_JS\}\}/);
  assert.equal(shell.replace('{{SPRITE_FAN_CSS}}', cssSource).replace('{{SPRITE_FAN_JS}}', jsSource), html);
});

await check('sprite-fan UX hooks are present', () => {
  for (const expectedId of ['left-resizer', 'right-resizer', 'timeline-resizer', 'canvas-container']) {
    assert.match(html, new RegExp(`id="${expectedId}"`), `missing #${expectedId}`);
  }
  for (const expectedCode of ['startLayoutResize', 'applyLayout', 'cleanConfig', 'cleanViewStates', 'loadObjectUrlImage']) {
    assert.match(script, new RegExp(expectedCode), `missing ${expectedCode}`);
  }
});

await check('sprite-fan docs reflect current GIF and split-plan state', async () => {
  const architecture = await read('sprite-fan/architecture.md');
  const splitPlan = await read('sprite-fan/source-split-plan.md');
  assert.match(architecture, /Focused GIF export is now merged/i);
  assert.match(architecture, /does not by itself trigger a split/i);
  assert.match(splitPlan, /single browser-loadable HTML file/i);
  assert.match(splitPlan, /config sanitization/i);
});

await check('inline atlas-studio script parses in node', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sprite-fan-health-'));
  const out = join(dir, 'atlas-studio-script.js');
  try {
    await writeFile(out, script);
    const result = spawnSync(process.execPath, ['--check', out], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

if (process.exitCode) {
  console.error('\nsprite-fan health check failed');
  process.exit(process.exitCode);
}

console.log('\nsprite-fan health check passed');
