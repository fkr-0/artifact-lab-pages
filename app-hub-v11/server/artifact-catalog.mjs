import { cp, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, posix } from 'node:path';
import { pathToFileURL } from 'node:url';

export function defaultArtifactOperations() {
  return {
    validate: {
      description: 'Validate required fields and source availability before indexing.',
      async run(item, context) { return validateArtifact(item, context); },
    },
    copy: {
      description: 'Copy local artifact files into the hub deployment tree so they become hub-based.',
      async run(item, context) { return copyArtifact(item, context); },
    },
    index: {
      description: 'Keep item in the clean compiled artifact list for menu/search/launch use.',
      async run(item) { return { ...item, deploy: { ...(item.deploy || {}), include: item.deploy?.include !== false } }; },
    },
  };
}

export async function compileArtifactCollection(source, options = {}) {
  const operations = options.operations || defaultArtifactOperations();
  const rootDir = options.rootDir || process.cwd();
  const outDir = options.outDir || join(rootDir, 'app-hub-v11', 'data');
  await mkdir(outDir, { recursive: true });

  const compiled = [];
  for (const original of source.items || []) {
    let item = normalizeArtifact(original);
    for (const opName of item.operations || ['validate', 'index']) {
      const op = operations[opName];
      if (!op) throw new Error(`Unknown artifact operation: ${opName}`);
      item = await op.run(item, { rootDir, outDir, source, operations });
    }
    compiled.push(item);
  }

  const output = {
    collection: source.collection || { id: 'app-hub-v11', title: 'App Hub v11' },
    generatedAt: new Date().toISOString(),
    deploy: source.deploy || {},
    operations: summarizeOperations(operations),
    summary: summarize(compiled),
    items: compiled,
  };
  await writeFile(join(outDir, 'artifact-collection.json'), JSON.stringify(output, null, 2));
  return output;
}

export async function compileArtifactCollectionFile(sourcePath, options = {}) {
  const source = JSON.parse(await readFile(sourcePath, 'utf8'));
  return compileArtifactCollection(source, {
    rootDir: options.rootDir || dirname(sourcePath),
    outDir: options.outDir,
    operations: options.operations || defaultArtifactOperations(),
  });
}

function normalizeArtifact(item) {
  if (!item?.id || !item?.title) throw new Error('Artifact item requires id and title');
  return {
    kind: 'info',
    tags: [],
    operations: ['validate', 'index'],
    launch: { modes: ['inline', 'newWindow'] },
    ...item,
  };
}

async function validateArtifact(item, { rootDir }) {
  if (item.kind === 'external-link' && !/^https?:\/\//.test(item.href || '')) {
    throw new Error(`${item.id}: external-link requires http(s) href`);
  }
  if (item.kind === 'html-path' && !item.source && !item.href && !item.hubHref) {
    throw new Error(`${item.id}: html-path requires source, href, or hubHref`);
  }
  if (item.source) await stat(join(rootDir, item.source));
  return item;
}

async function copyArtifact(item, { rootDir, outDir, source }) {
  if (!item.source) return item;
  const copyRoot = source.deploy?.copyRoot || 'compiled';
  const sourcePath = join(rootDir, item.source);
  const fileName = item.source.endsWith('/') ? 'index.html' : item.source.split('/').pop();
  const hubHref = posix.join(copyRoot, item.id, fileName);
  const targetPath = join(outDir, hubHref);
  await mkdir(dirname(targetPath), { recursive: true });
  await cp(sourcePath, targetPath, { recursive: true });
  return { ...item, hubHref, deploy: { ...(item.deploy || {}), include: true } };
}

function summarize(items) {
  const byKind = {};
  const byTag = {};
  for (const item of items) {
    byKind[item.kind] = (byKind[item.kind] || 0) + 1;
    for (const tag of item.tags || []) byTag[tag] = (byTag[tag] || 0) + 1;
  }
  return { total: items.length, byKind, byTag };
}

function summarizeOperations(operations) {
  return Object.fromEntries(Object.entries(operations).map(([id, op]) => [id, { description: op.description || id }]));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const sourcePath = process.argv[2] || 'app-hub-v11/artifacts.source.json';
  const outDir = process.argv[3] || 'app-hub-v11/data';
  const result = await compileArtifactCollectionFile(sourcePath, { rootDir: process.cwd(), outDir });
  console.log(`Compiled ${result.summary.total} artifacts to ${outDir}/artifact-collection.json`);
}
