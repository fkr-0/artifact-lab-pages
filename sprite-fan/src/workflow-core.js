(function installSpriteFanWorkflowCore(root) {
  'use strict';

  const WORKFLOWS = Object.freeze(['import', 'align', 'cleanup', 'repair', 'export']);

  function buildWorkflowModel({
    hasImage = false,
    cleaned = false,
    frameCount = 0,
    issueCount = 0,
    manifestName = '',
  } = {}) {
    const normalizedFrameCount = Math.max(0, Number(frameCount) || 0);
    const normalizedIssueCount = Math.max(0, Number(issueCount) || 0);
    const hasFrames = normalizedFrameCount > 0;
    const exported = hasFrames && String(manifestName).trim().length > 0;
    return Object.freeze({
      hasImage: Boolean(hasImage),
      cleaned: Boolean(cleaned),
      hasFrames,
      issues: hasFrames ? normalizedIssueCount : 0,
      exported,
      steps: Object.freeze([
        Object.freeze({ wf: 'import', label: 'Image', done: Boolean(hasImage), active: !hasImage }),
        Object.freeze({
          wf: 'cleanup',
          label: 'Alpha',
          done: Boolean(cleaned),
          active: Boolean(hasImage) && !cleaned && !hasFrames,
        }),
        Object.freeze({
          wf: 'import',
          label: 'Slice',
          done: hasFrames,
          active: Boolean(hasImage) && !hasFrames,
        }),
        Object.freeze({
          wf: 'repair',
          label: 'Review',
          done: hasFrames && normalizedIssueCount === 0,
          active: hasFrames && normalizedIssueCount > 0,
          blocked: !hasFrames,
        }),
        Object.freeze({
          wf: 'export',
          label: 'Export',
          done: false,
          active: hasFrames && normalizedIssueCount === 0,
          blocked: !hasFrames,
        }),
      ]),
    });
  }

  function resolveWorkflowRequest(requested, { hasFrames = false, hasSheet = false } = {}) {
    const requestedWorkflow = WORKFLOWS.includes(requested) ? requested : 'import';
    if (requestedWorkflow === 'cleanup' && hasFrames) {
      return Object.freeze({ workflow: 'repair', notice: null, redirected: true });
    }
    if ((requestedWorkflow === 'align' || requestedWorkflow === 'repair') && !hasFrames) {
      return Object.freeze({
        workflow: hasSheet ? 'import' : 'cleanup',
        notice: 'Slice frames first',
        redirected: true,
      });
    }
    return Object.freeze({
      workflow: requestedWorkflow,
      notice: requestedWorkflow === requested ? null : 'Unknown workflow; showing Import',
      redirected: requestedWorkflow !== requested,
    });
  }

  function workflowEnabled(workflow, { hasFrames = false } = {}) {
    if (!WORKFLOWS.includes(workflow)) return false;
    return !((workflow === 'align' || workflow === 'repair') && !hasFrames);
  }

  root.SpriteFanWorkflowCore = Object.freeze({
    WORKFLOWS,
    buildWorkflowModel,
    resolveWorkflowRequest,
    workflowEnabled,
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
