import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Historical filename retained as the Pages migration regression.
const workflow = await readFile('.github/workflows/pages.yml', 'utf8');

assert.match(workflow, /fetch-depth:\s*0/, 'workflow should retain full git provenance');
assert.match(workflow, /Materialize native V13 publication stage/);
assert.match(workflow, /build-publication-site\.mjs --out \.artifacts-pages-stage/);
assert.match(workflow, /Install dependencies \(revealive\)[\s\S]*pnpm install --frozen-lockfile[\s\S]*working-directory: revealive/);
assert.match(workflow, /stage-compiled-publication\.mjs --stage \.artifacts-pages-stage --id revealive/);
assert.match(workflow, /upload-pages-artifact@v5[\s\S]*path: \.artifacts-pages-stage/);
assert.doesNotMatch(workflow, /app-hub-v11|build-artifacts-order|generate-build-stats|\.artifacts\.source\.ci\.json/);
assert.match(workflow, /Run Hyperblast release gate/, 'Hyperblast release gate is a publication prerequisite after V13.5 promotion');

const installIndex = workflow.indexOf('Install dependencies (revealive)');
const materializeIndex = workflow.indexOf('Materialize native V13 publication stage');
const compileIndex = workflow.indexOf('Stage explicitly compiled Revealive release');
assert.ok(installIndex < materializeIndex && materializeIndex < compileIndex, 'Revealive must be prepared before its explicit post-V13 compile stage');

console.log('V13 Pages workflow contract OK');
