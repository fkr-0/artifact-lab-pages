import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = JSON.parse(await readFile('app-hub-v11/artifacts.source.json', 'utf8'));
const workflow = await readFile('.github/workflows/pages.yml', 'utf8');
const badger = source.items.find((item) => item.id === 'badger-sprawl-runner');

assert.ok(badger?.deploy?.build, 'badger-sprawl-runner must be built by the Pages materializer');
assert.match(
  badger.deploy.build.command,
  /\bpnpm\b/,
  'badger-sprawl-runner currently depends on pnpm for its materialized build command',
);

const corepackIndex = workflow.indexOf('corepack enable');
const installIndex = workflow.indexOf('Install dependencies (badger-sprawl-runner)');
const buildIndex = workflow.indexOf('Build (badger-sprawl-runner)');
const stageIndex = workflow.indexOf('Materialize verified V13.5 Pages stage');

assert.notEqual(corepackIndex, -1, 'Pages workflow must enable Corepack before invoking pnpm-based artifact builds');
assert.notEqual(installIndex, -1, 'Pages workflow must install badger-sprawl-runner dependencies before materialization');
assert.notEqual(buildIndex, -1, 'Pages workflow must compile and publish badger-sprawl-runner/dist before materialization');
assert.notEqual(stageIndex, -1, 'Pages workflow must materialize the V13.5 Pages stage');
assert.ok(corepackIndex < installIndex, 'Corepack must be enabled before the badger pnpm install step');
assert.ok(installIndex < buildIndex, 'badger build must follow its dependency installation');
assert.ok(buildIndex < stageIndex, 'badger dist output must exist before V13.5 publication staging');
assert.match(workflow.slice(buildIndex, stageIndex), /run: pnpm run build\s+working-directory: badger-sprawl-runner/, 'badger build step must invoke pnpm build in its own directory');
assert.match(workflow, /working-directory:\s+badger-sprawl-runner/);
assert.match(workflow, /pnpm install --frozen-lockfile/);
