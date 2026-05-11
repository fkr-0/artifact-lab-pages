import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { compileArtifactCollection } from './artifact-catalog.mjs';

async function compileSourceCatalog() {
  const source = JSON.parse(await readFile(new URL('../artifacts.source.json', import.meta.url), 'utf8'));
  const outDir = await mkdtemp(join(tmpdir(), 'v11-catalog-'));
  try {
    return await compileArtifactCollection(source, { rootDir: new URL('..', import.meta.url).pathname, outDir });
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }
}

test('ports legacy text editors and calculator into the v11 launch catalog', async () => {
  const compiled = await compileSourceCatalog();
  const byId = new Map(compiled.items.map((item) => [item.id, item]));

  const expected = [
    ['v9-quick-notepad', 'legacy-tools.html?tool=v9-notepad', ['editor', 'v9']],
    ['v9-sci-fi-calculator', 'legacy-tools.html?tool=v9-calculator', ['calculator', 'v9']],
    ['v10-local-first-notepad', 'legacy-tools.html?tool=v10-notepad', ['editor', 'v10']],
    ['v10-shared-text-pad', 'legacy-tools.html?tool=v10-shared-pad', ['editor', 'collaborative', 'v10']],
    ['v8-collab-code-editor', '../app-hub/collab-editor.html', ['editor', 'collaborative', 'monaco']],
    ['v8-collab-pad-lite', '../app-hub/collab-editor-lite.html', ['editor', 'collaborative', 'textarea']],
    ['root-multitext-viewer', '../index_multitext.html', ['editor', 'viewer']],
    ['v4-console-notes', 'legacy-tools.html?tool=v4-console-notes', ['editor', 'v4', 'console']],
  ];

  for (const [id, href, tags] of expected) {
    const item = byId.get(id);
    assert.ok(item, `${id} should be present`);
    assert.equal(item.href, href);
    assert.equal(item.kind, 'html-path');
    assert.deepEqual(item.operations, ['validate', 'index']);
    assert.ok(item.launch?.modes?.includes('inline'), `${id} should support inline launch`);
    assert.ok(item.launch?.modes?.includes('newWindow'), `${id} should support newWindow launch`);
    for (const tag of tags) assert.ok(item.tags.includes(tag), `${id} should include ${tag} tag`);
  }
});
