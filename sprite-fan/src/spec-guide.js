(function installSpriteFanSpecGuide(root) {
  'use strict';

  const REQUIREMENTS = Object.freeze([
    Object.freeze({ id: 'prompt', label: 'Prompt/goals captured', action: 'Write the intended sprite or animation prompt.' }),
    Object.freeze({ id: 'frames', label: 'Frames sliced from atlas', action: 'Load an atlas and slice frames.' }),
    Object.freeze({ id: 'grid', label: 'Target contract export is page-safe', action: 'Choose a game/runtime target to split larger sets into strict target pages, or keep generic exports within one 4x4.' }),
    Object.freeze({ id: 'stable-size', label: 'Stable frame size present', action: 'Slice or repack so every frame has the same dimensions.' }),
    Object.freeze({ id: 'anchor', label: 'Anchor metadata present', action: 'Set an anchor before slicing or apply anchors through config.' }),
    Object.freeze({ id: 'review', label: 'No unresolved review issues', action: 'Use cleanup/review tools until issueFrames is zero.' }),
    Object.freeze({ id: 'animation', label: 'Animation timing metadata exportable', action: 'Set sprite name, FPS, and loop metadata.' }),
    Object.freeze({ id: 'preview', label: 'Animation preview subset selected or all-frame preview available', action: 'Use timeline preview; optionally mark frames with M or Ctrl/Meta-click.' }),
  ]);

  function finiteInt(value, fallback = 0, minimum = 0, maximum = 1000000) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(minimum, Math.min(maximum, Math.round(number)));
  }

  function normalizeSnapshot(snapshot = {}) {
    const frameCount = finiteInt(snapshot.frameCount, 0);
    const exportColumns = finiteInt(snapshot.exportColumns, 1, 1, 64);
    const targetColumns = finiteInt(snapshot.targetColumns, 0, 0, 64);
    const targetPageSize = finiteInt(snapshot.targetPageSize, 0, 0, 4096);
    return {
      prompt: String(snapshot.prompt ?? ''),
      frameCount,
      exportColumns,
      exportPadding: finiteInt(snapshot.exportPadding, 0, 0, 512),
      noPadding: Boolean(snapshot.noPadding),
      targetColumns,
      targetPageSize,
      stableFrameSize: Boolean(snapshot.stableFrameSize),
      anchorsPresent: Boolean(snapshot.anchorsPresent),
      issueFrames: finiteInt(snapshot.issueFrames, frameCount, 0, 1000000),
      animationName: String(snapshot.animationName ?? ''),
      animationFps: Number(snapshot.animationFps),
      previewAvailable: Boolean(snapshot.previewAvailable),
    };
  }

  function pageSafe(snapshot) {
    if (snapshot.frameCount === 0) return false;
    if (snapshot.targetPageSize > 0) {
      return snapshot.exportColumns === snapshot.targetColumns
        && (snapshot.noPadding || snapshot.exportPadding === 0);
    }
    return snapshot.frameCount <= 16
      && snapshot.exportColumns <= 4
      && Math.ceil(snapshot.frameCount / snapshot.exportColumns) <= 4;
  }

  function requirementState(id, snapshot) {
    switch (id) {
      case 'prompt': return snapshot.prompt.trim().length > 0;
      case 'frames': return snapshot.frameCount > 0;
      case 'grid': return pageSafe(snapshot);
      case 'stable-size': return snapshot.frameCount > 0 && snapshot.stableFrameSize;
      case 'anchor': return snapshot.frameCount > 0 && snapshot.anchorsPresent;
      case 'review': return snapshot.frameCount > 0 && snapshot.issueFrames === 0;
      case 'animation': return snapshot.frameCount > 0
        && Number.isFinite(snapshot.animationFps)
        && snapshot.animationFps > 0
        && snapshot.animationName.trim().length > 0;
      case 'preview': return snapshot.frameCount > 0 && snapshot.previewAvailable;
      default: return false;
    }
  }

  function evaluateSpecGuide(snapshot, options = {}) {
    const normalized = normalizeSnapshot(snapshot);
    const items = REQUIREMENTS.map((requirement) => ({
      id: requirement.id,
      label: requirement.label,
      done: requirementState(requirement.id, normalized),
      action: requirement.action,
    }));
    const done = items.filter((item) => item.done).length;
    const checkedAt = options.checkedAt === undefined
      ? new Date().toISOString()
      : String(options.checkedAt);
    return {
      version: 1,
      source: 'sprite-fan/reqs/animation.yml',
      prompt: normalized.prompt,
      checkedAt,
      summary: { done, total: items.length },
      items,
    };
  }

  function guideSummary(guide) {
    const items = Array.isArray(guide?.items) ? guide.items : [];
    if (!items.length) return 'Spec: not checked';
    return `Spec: ${items.filter((item) => item?.done).length}/${items.length} done`;
  }

  function guideLines(guide) {
    const items = Array.isArray(guide?.items) ? guide.items : [];
    return items.map((item) => (
      `${item?.done ? '✓ ' : '□ '}${String(item?.label ?? '')}`
      + (item?.done ? '' : ` — ${String(item?.action ?? '')}`)
    ));
  }

  root.SpriteFanSpecGuide = Object.freeze({
    REQUIREMENTS,
    normalizeSnapshot,
    pageSafe,
    requirementState,
    evaluateSpecGuide,
    guideSummary,
    guideLines,
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
