import test from 'node:test';
import assert from 'node:assert/strict';
import { isSafeRelativePath, resolveInside, validateManifest, validateUniqueIds } from '../src/core.mjs';

const base = {
  schemaVersion: 'artifacts.fkr.dev/v1',
  id: 'example',
  title: 'Example',
  kind: 'application',
  status: 'experimental',
  required: true,
  source: { kind: 'file', path: 'index.html', git: { mode: 'root' } },
  build: { mode: 'none' },
  release: { kind: 'file', entrypoint: 'index.html' },
  launch: { default: 'newWindow', modes: ['newWindow'] },
};

test('contained paths reject traversal and absolute paths', () => {
  assert.equal(isSafeRelativePath('apps/demo/index.html'), true);
  assert.equal(isSafeRelativePath('../secret'), false);
  assert.equal(isSafeRelativePath('/etc/passwd'), false);
  assert.throws(() => resolveInside('/tmp/root', '../escape'));
});

test('link and text contracts are first-class', async () => {
  const link = await validateManifest({
    ...base,
    id: 'docs-link',
    kind: 'link',
    required: false,
    source: { kind: 'external', url: 'https://example.net/docs', git: { mode: 'none' } },
    build: { mode: 'external' },
    release: { kind: 'external', url: 'https://example.net/docs' },
    launch: { default: 'newWindow', modes: ['newWindow'] },
  }, { checkExistence: false });
  assert.equal(link.ok, true, JSON.stringify(link));

  const text = await validateManifest({
    ...base,
    id: 'notice',
    kind: 'text',
    required: false,
    source: { kind: 'inline', text: 'Migration in progress.', format: 'plain', git: { mode: 'none' } },
    build: { mode: 'none' },
    release: { kind: 'inline' },
    launch: { default: 'none', modes: ['none'] },
  }, { checkExistence: false });
  assert.equal(text.ok, true, JSON.stringify(text));
});

test('markdown publication requires document assembly', async () => {
  const result = await validateManifest({
    ...base,
    id: 'guide',
    kind: 'document',
    source: { kind: 'file', path: 'guide.md', git: { mode: 'root' } },
    build: { mode: 'assemble', renderer: 'markdown-html' },
    release: { kind: 'file', entrypoint: 'index.html' },
  }, { checkExistence: false });
  assert.equal(result.ok, true, JSON.stringify(result));
});

test('compile commands are argv and provisional shell commands cannot be active', async () => {
  const result = await validateManifest({
    ...base,
    source: { kind: 'project', path: 'project', git: { mode: 'root' } },
    build: { mode: 'compile', provisionalShellCommand: 'npm run build' },
    release: { kind: 'directory', entrypoint: 'index.html' },
    status: 'active',
  }, { checkExistence: false });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((entry) => entry.code === 'build.command'));
});

test('duplicate IDs are rejected independently of source location', () => {
  const errors = validateUniqueIds([{ id: 'same', __manifestPath: 'a.json' }, { id: 'same', __manifestPath: 'b.json' }]);
  assert.equal(errors.length, 1);
  assert.deepEqual(errors[0].paths, ['a.json', 'b.json']);
});
