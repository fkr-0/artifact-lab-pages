import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile('.github/workflows/pages.yml', 'utf8');
const script = await readFile('app-hub-v11/build-artifacts-order.js', 'utf8');

assert.ok(workflow.includes('fetch-depth: 0'), 'workflow fetches full git history');
assert.ok(workflow.includes('build-artifacts-order.js --source .artifacts.source.ci.json --out .artifacts.source.ci.json'), 'workflow refreshes artifact order');
assert.ok(script.includes("'git'"), 'ordering invokes git');
assert.ok(script.includes("'--format=%ct'"), 'ordering reads git commit timestamps');

console.log('app-hub v11 Pages workflow contract OK');
