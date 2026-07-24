import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const html = await readFile('app-hub/v9-portal.html', 'utf8');

const markupWithoutScripts = html.replace(/<script\b[\s\S]*?<\/script>/gi, '');
const inlineHandlerMatches = [
  ...markupWithoutScripts.matchAll(/\son[a-z]+(?:-[a-z]+)?\s*=/gi),
].map((match) => match[0].trim());
assert.equal(
  inlineHandlerMatches.length,
  0,
  `v9 portal should not contain inline event handler attributes: ${inlineHandlerMatches.join(', ')}`,
);

const inlineScripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(([, attrs]) => !/\bsrc\s*=/i.test(attrs));

assert.ok(inlineScripts.length > 0, 'v9 portal should contain inline scripts to syntax-check');

const stringLiteralMatches = [];
const stringLiteralPattern =
  /`(?:[^`\\]|\\[\s\S])*`|'(?:[^'\\]|\\[\s\S])*'|"(?:[^"\\]|\\[\s\S])*"/g;
for (const [, , body] of inlineScripts) {
  for (const token of body.match(stringLiteralPattern) || []) {
    if (/\son[a-z]+(?:-[a-z]+)?\s*=/i.test(token)) {
      stringLiteralMatches.push(token.trim());
    }
  }
}
assert.equal(
  stringLiteralMatches.length,
  0,
  `v9 inline scripts should not generate inline event handler attributes in strings: ${stringLiteralMatches.join(' | ')}`,
);

const tmpRoot = await mkdtemp(join(tmpdir(), 'app-hub-v9-inline-'));

try {
  for (const [index, [, , body]] of inlineScripts.entries()) {
    const scriptPath = join(tmpRoot, `inline-${index}.mjs`);
    await writeFile(scriptPath, `${body.trim()}\n`, 'utf8');
    const result = spawnSync(process.execPath, ['--check', scriptPath], {
      encoding: 'utf8',
    });
    assert.equal(
      result.status,
      0,
      `inline script #${index} failed syntax check:\n${result.stdout || ''}${result.stderr || ''}`,
    );
  }
} finally {
  await rm(tmpRoot, { recursive: true, force: true });
}

console.log('app-hub v9 inline handler contract OK');
