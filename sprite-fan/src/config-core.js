(function installSpriteFanConfigCore(root) {
  'use strict';

  function finiteNumber(value, fallback, minimum = -Infinity, maximum = Infinity) {
    const number = Number(value);
    return Number.isFinite(number)
      ? Math.max(minimum, Math.min(maximum, number))
      : fallback;
  }

  function finiteInt(value, fallback, minimum = -Infinity, maximum = Infinity) {
    const number = finiteNumber(value, fallback, minimum, maximum);
    return Number.isFinite(number) ? Math.round(number) : fallback;
  }

  function cleanText(value, maximumLength = 500) {
    return String(value ?? '').slice(0, Math.max(0, Number(maximumLength) || 0));
  }

  function cleanAnchor(anchor, fallback = { x: 0, y: 0 }) {
    return {
      x: finiteNumber(anchor?.x, fallback.x, -4096, 4096),
      y: finiteNumber(anchor?.y, fallback.y, -4096, 4096),
    };
  }

  function cleanTotals(totals = {}) {
    const source = totals && typeof totals === 'object' ? totals : {};
    return {
      pixels: finiteInt(source.pixels, 0, 0, 1e9),
      soft: finiteInt(source.soft, 0, 0, 1e9),
      strayPixels: finiteInt(source.strayPixels, 0, 0, 1e9),
      pinholePixels: finiteInt(source.pinholePixels, 0, 0, 1e9),
      jitterFrames: finiteInt(source.jitterFrames, 0, 0, 1e6),
      issueFrames: finiteInt(source.issueFrames, 0, 0, 1e6),
    };
  }

  function cleanBatchHistory(history) {
    if (!Array.isArray(history)) return [];
    return history.slice(-10).map((entry) => ({
      kind: cleanText(entry?.kind || 'batch', 80),
      at: cleanText(entry?.at || '', 80),
      before: cleanTotals(entry?.before),
      after: cleanTotals(entry?.after),
      delta: {
        issueFrames: finiteInt(entry?.delta?.issueFrames, 0, -1e6, 1e6),
        strayPixels: finiteInt(entry?.delta?.strayPixels, 0, -1e9, 1e9),
        pinholePixels: finiteInt(entry?.delta?.pinholePixels, 0, -1e9, 1e9),
        jitterFrames: finiteInt(entry?.delta?.jitterFrames, 0, -1e6, 1e6),
      },
    }));
  }

  function cleanSpecGuide(guide) {
    if (!guide || typeof guide !== 'object') return null;
    const items = Array.isArray(guide.items)
      ? guide.items.slice(0, 64).map((item) => ({
          id: cleanText(item?.id, 80),
          label: cleanText(item?.label, 200),
          done: Boolean(item?.done),
          action: cleanText(item?.action, 300),
        }))
      : [];
    return {
      version: finiteInt(guide.version, 1, 1, 10),
      source: cleanText(guide.source || 'sprite-fan/reqs/animation.yml', 300),
      prompt: cleanText(guide.prompt, 4000),
      checkedAt: cleanText(guide.checkedAt || '', 80),
      summary: { done: items.filter((item) => item.done).length, total: items.length },
      items,
    };
  }

  function cleanFrameMeta(meta, anchorFallback = { x: 0, y: 0 }) {
    if (!Array.isArray(meta)) return [];
    return meta.slice(0, 512).map((item, index) => ({
      index: finiteInt(item?.index, index, 0, 511),
      label: cleanText(item?.label, 160),
      notes: cleanText(item?.notes, 2000),
      anchor: cleanAnchor(item?.anchor, anchorFallback),
    }));
  }

  function cleanViewState(viewState) {
    if (!viewState || typeof viewState !== 'object') return null;
    return {
      zoom: finiteNumber(viewState.zoom, 1, 0.1, 16),
      panX: finiteNumber(viewState.panX, 0, -100000, 100000),
      panY: finiteNumber(viewState.panY, 0, -100000, 100000),
      ready: Boolean(viewState.ready),
      initialized: Boolean(viewState.initialized),
    };
  }

  function cleanViewStates(viewStates) {
    return viewStates && typeof viewStates === 'object'
      ? { source: cleanViewState(viewStates.source), frame: cleanViewState(viewStates.frame) }
      : undefined;
  }

  function cleanLayout(layout, defaults) {
    if (!layout || typeof layout !== 'object') return undefined;
    const fallback = defaults || { leftWidth: 272, rightWidth: 256, timelineHeight: 80 };
    return {
      leftWidth: finiteInt(layout.leftWidth, fallback.leftWidth, 180, 520),
      rightWidth: finiteInt(layout.rightWidth, fallback.rightWidth, 180, 560),
      timelineHeight: finiteInt(layout.timelineHeight, fallback.timelineHeight, 48, 240),
    };
  }

  function cleanConfig(config, options = {}) {
    if (!config || typeof config !== 'object') return {};
    const anchorFallback = options.anchorFallback || { x: 0, y: 0 };
    const layoutDefaults = options.layoutDefaults;
    return {
      frameW: finiteInt(config.frameW, undefined, 1, 4096),
      frameH: finiteInt(config.frameH, undefined, 1, 4096),
      gridOx: finiteInt(config.gridOx, undefined, 0, 4096),
      gridOy: finiteInt(config.gridOy, undefined, 0, 4096),
      anchor: config.anchor ? cleanAnchor(config.anchor, anchorFallback) : undefined,
      tolerance: finiteNumber(config.tolerance, undefined, 0, 255),
      maxSaturation: finiteNumber(config.maxSaturation, undefined, 0, 255),
      alphaThreshold: finiteNumber(config.alphaThreshold, undefined, 0, 255),
      mergeDistance: finiteNumber(config.mergeDistance, undefined, 0, 4096),
      straySize: finiteInt(config.straySize, undefined, 1, 4096),
      jitterThresh: finiteNumber(config.jitterThresh, undefined, 0, 4096),
      outlineRadius: finiteInt(config.outlineRadius, undefined, 0, 64),
      softenRadius: finiteInt(config.softenRadius, undefined, 0, 64),
      alphaErode: finiteInt(config.alphaErode, undefined, 0, 64),
      alphaDilate: finiteInt(config.alphaDilate, undefined, 0, 64),
      exportCols: finiteInt(config.exportCols, undefined, 1, 64),
      exportPad: finiteInt(config.exportPad, undefined, 0, 512),
      noPad: config.noPad === undefined ? undefined : Boolean(config.noPad),
      manifestName: config.manifestName === undefined ? undefined : cleanText(config.manifestName, 120),
      manifestFps: finiteNumber(config.manifestFps, undefined, 1, 120),
      manifestLoop: finiteInt(config.manifestLoop, undefined, 0, 1000000),
      specGuide: cleanSpecGuide(config.specGuide),
      showOnionSkin: config.showOnionSkin === undefined ? undefined : Boolean(config.showOnionSkin),
      onionOpacity: finiteNumber(config.onionOpacity, undefined, 0, 1),
      autoFitFrames: config.autoFitFrames === undefined ? undefined : Boolean(config.autoFitFrames),
      maxAutoFitZoom: finiteNumber(config.maxAutoFitZoom, undefined, 1, 16),
      viewMode: config.viewMode === 'frame' ? 'frame' : config.viewMode === 'source' ? 'source' : undefined,
      zoom: finiteNumber(config.zoom, undefined, 0.1, 16),
      panX: finiteNumber(config.panX, undefined, -100000, 100000),
      panY: finiteNumber(config.panY, undefined, -100000, 100000),
      viewStates: cleanViewStates(config.viewStates),
      layout: cleanLayout(config.layout, layoutDefaults),
      frameMeta: Array.isArray(config.frameMeta)
        ? cleanFrameMeta(config.frameMeta, anchorFallback)
        : undefined,
      batchHistory: Array.isArray(config.batchHistory)
        ? cleanBatchHistory(config.batchHistory)
        : undefined,
    };
  }

  root.SpriteFanConfigCore = Object.freeze({
    finiteNumber,
    finiteInt,
    cleanText,
    cleanAnchor,
    cleanTotals,
    cleanBatchHistory,
    cleanSpecGuide,
    cleanFrameMeta,
    cleanViewState,
    cleanViewStates,
    cleanLayout,
    cleanConfig,
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
