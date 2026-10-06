import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Historical filename retained as the Pages migration regression.
const workflow = await readFile('.github/workflows/pages.yml', 'utf8');

assert.match(workflow, /fetch-depth:\s*0/, 'workflow should retain full git provenance');
assert.match(workflow, /Install dependencies \(revealive\)[\s\S]*pnpm install --frozen-lockfile[\s\S]*working-directory: revealive/);
assert.match(workflow, /upload-pages-artifact@v5[\s\S]*path: \.artifacts-pages-stage/);
assert.doesNotMatch(workflow, /app-hub-v11|build-artifacts-order|generate-build-stats|\.artifacts\.source\.ci\.json/);
assert.match(workflow, /Run Hyperblast release gate/, 'Hyperblast release gate is a publication prerequisite after V13.5 promotion');
assert.match(workflow, /Materialize verified V13\.5 Pages stage/, 'V13.5 stage is the publication source');
assert.match(workflow, /Verify staged publication receipt/, 'receipt verification gates the upload');
assert.doesNotMatch(workflow, /build-publication-site\.mjs --out \.artifacts-pages-stage/, 'verified V13.5 stage must not be destroyed by a post-verification native rebuild');

const v13_5StageIndex = workflow.indexOf('Materialize verified V13.5 Pages stage');
const receiptIndex = workflow.indexOf('Verify staged publication receipt');
const uploadIndex = workflow.indexOf('Upload Pages artifact');
assert.ok(v13_5StageIndex < receiptIndex && receiptIndex < uploadIndex, 'V13.5 stage -> receipt verification -> upload must be the terminal pipeline');

console.log('V13 Pages workflow contract OK');
