import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../sprite-fan/src/workflow-core.js', import.meta.url), 'utf8');
const context = vm.createContext({});
context.globalThis = context;
vm.runInContext(source, context, { filename: 'workflow-core.js' });
const workflow = context.SpriteFanWorkflowCore;

assert.ok(workflow, 'workflow core should install itself in a classic-script context');

{
  const empty = workflow.buildWorkflowModel();
  assert.equal(empty.hasImage, false);
  assert.equal(empty.hasFrames, false);
  assert.equal(empty.steps[0].active, true);
  assert.equal(empty.steps[3].blocked, true);
  assert.equal(Object.isFrozen(empty), true);
  assert.equal(Object.isFrozen(empty.steps), true);
}

{
  const review = workflow.buildWorkflowModel({
    hasImage: true,
    cleaned: true,
    frameCount: 16,
    issueCount: 3,
    manifestName: 'camus',
  });
  assert.equal(review.hasFrames, true);
  assert.equal(review.issues, 3);
  assert.equal(review.exported, true);
  assert.equal(review.steps.find((step) => step.wf === 'repair').active, true);
  assert.equal(review.steps.at(-1).active, false);
}

assert.deepEqual(
  { ...workflow.resolveWorkflowRequest('cleanup', { hasFrames: true, hasSheet: true }) },
  { workflow: 'repair', notice: null, redirected: true },
);
assert.deepEqual(
  { ...workflow.resolveWorkflowRequest('repair', { hasFrames: false, hasSheet: true }) },
  { workflow: 'import', notice: 'Slice frames first', redirected: true },
);
assert.deepEqual(
  { ...workflow.resolveWorkflowRequest('align', { hasFrames: false, hasSheet: false }) },
  { workflow: 'cleanup', notice: 'Slice frames first', redirected: true },
);
assert.deepEqual(
  { ...workflow.resolveWorkflowRequest('unknown', { hasFrames: false, hasSheet: false }) },
  { workflow: 'import', notice: 'Unknown workflow; showing Import', redirected: true },
);

assert.equal(workflow.workflowEnabled('align', { hasFrames: false }), false);
assert.equal(workflow.workflowEnabled('repair', { hasFrames: true }), true);
assert.equal(workflow.workflowEnabled('cleanup', { hasFrames: false }), true);
assert.equal(workflow.workflowEnabled('unknown', { hasFrames: true }), false);

console.log('sprite fan workflow core contract OK');
