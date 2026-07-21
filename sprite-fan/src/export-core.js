(function installSpriteFanExportCore(root) {
  'use strict';

  function positiveInt(value, fallback, maximum = 1000000) {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return fallback;
    return Math.min(maximum, Math.round(number));
  }

  function nonNegativeInt(value, fallback = 0, maximum = 1000000) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) return fallback;
    return Math.min(maximum, Math.round(number));
  }

  function safeFileStem(value, maximumLength = 96) {
    const limit = positiveInt(maximumLength, 96, 512);
    const normalized = String(value ?? '')
      .trim()
      .replace(/[^A-Za-z0-9._-]+/g, '_')
      .replace(/^[._-]+|[._-]+$/g, '')
      .slice(0, limit)
      .replace(/[._-]+$/g, '');
    return normalized || 'sprite';
  }

  function displayName(value) {
    const normalized = String(value ?? '').trim();
    return normalized || 'sprite';
  }

  function buildSheetLayout({
    frameCount,
    columns,
    padding = 0,
    frameWidth,
    frameHeight,
  }) {
    const count = nonNegativeInt(frameCount, 0);
    const cols = positiveInt(columns, 1, 64);
    const pad = nonNegativeInt(padding, 0, 512);
    const width = nonNegativeInt(frameWidth, 0, 4096);
    const height = nonNegativeInt(frameHeight, 0, 4096);
    const rows = count > 0 ? Math.ceil(count / cols) : 0;
    const cellWidth = width + pad * 2;
    const cellHeight = height + pad * 2;
    return {
      columns: cols,
      rows,
      padding: pad,
      frameWidth: width,
      frameHeight: height,
      cellWidth,
      cellHeight,
      sheetWidth: cellWidth * cols,
      sheetHeight: cellHeight * rows,
    };
  }

  function layoutFrameReviews(frameReviews, layout) {
    if (!Array.isArray(frameReviews)) return [];
    return frameReviews.filter(Boolean).map((review, index) => {
      const frameIndex = Number.isInteger(review.index) ? review.index : index;
      const col = frameIndex % layout.columns;
      const row = Math.floor(frameIndex / layout.columns);
      return {
        ...review,
        col,
        row,
        sheetRect: {
          x: col * layout.cellWidth + layout.padding,
          y: row * layout.cellHeight + layout.padding,
          w: layout.frameWidth,
          h: layout.frameHeight,
        },
      };
    });
  }

  function summarizeFrameReviews(frameReviews) {
    return (Array.isArray(frameReviews) ? frameReviews : []).reduce(
      (totals, review) => {
        if (!review) return totals;
        totals.pixels += nonNegativeInt(review.pixels, 0, 1e9);
        totals.soft += nonNegativeInt(review.soft, 0, 1e9);
        totals.strayPixels += nonNegativeInt(review.strayPixels, 0, 1e9);
        totals.pinholePixels += nonNegativeInt(review.pinholePixels, 0, 1e9);
        const issues = Array.isArray(review.issues) ? review.issues : [];
        totals.jitterFrames += issues.some((issue) => String(issue).startsWith('jitter ')) ? 1 : 0;
        totals.issueFrames += issues.length > 0 ? 1 : 0;
        return totals;
      },
      {
        pixels: 0,
        soft: 0,
        strayPixels: 0,
        pinholePixels: 0,
        jitterFrames: 0,
        issueFrames: 0,
      },
    );
  }

  function buildReviewReport({
    name,
    selectedFrame = -1,
    frameWidth = 0,
    frameHeight = 0,
    columns = 1,
    padding = 0,
    settings = {},
    batchHistory = [],
    frameReviews = [],
  }) {
    const layout = buildSheetLayout({
      frameCount: frameReviews.length,
      columns,
      padding,
      frameWidth,
      frameHeight,
    });
    const frames = layoutFrameReviews(frameReviews, layout);
    return {
      version: 1,
      name: displayName(name),
      frameCount: frames.length,
      selectedFrame: Number.isInteger(selectedFrame) ? selectedFrame : -1,
      sheetLayout: layout,
      settings: { ...settings },
      totals: summarizeFrameReviews(frames),
      batchHistory: Array.isArray(batchHistory) ? batchHistory.slice(-10) : [],
      frames,
    };
  }

  function buildContractPagePlan({ name, contract, frameCount }) {
    if (!contract || !positiveInt(contract.pageSize, 0)) {
      throw new TypeError('a paged target contract is required');
    }
    const count = nonNegativeInt(frameCount, 0);
    const pageSize = positiveInt(contract.pageSize, 1, 4096);
    const stem = safeFileStem(name);
    const pages = [];
    for (let startFrame = 0; startFrame < count; startFrame += pageSize) {
      const pageIndex = pages.length;
      pages.push({
        pageIndex,
        startFrame,
        frameCount: Math.min(pageSize, count - startFrame),
        file: `${stem}_${contract.id}_p${String(pageIndex + 1).padStart(2, '0')}.png`,
        columns: contract.cols,
        rows: contract.rows,
      });
    }
    return {
      name: displayName(name),
      fileStem: stem,
      pageSize,
      pageCount: pages.length,
      manifestFile: `${stem}_${contract.id}_manifest.json`,
      pages,
    };
  }

  function buildExportFilePlan({ name, contract, frameCount, columns = 1 }) {
    const stem = safeFileStem(name);
    if (contract?.pageSize) {
      const plan = buildContractPagePlan({ name, contract, frameCount });
      return [...plan.pages.map((page) => page.file), plan.manifestFile];
    }
    positiveInt(columns, 1, 64);
    return [`${stem}_sheet.png`, `${stem}_sprites.json`];
  }

  function normalizeAnimation({ name, frameCount, fps, loopCount, anchor, tags }) {
    const count = nonNegativeInt(frameCount, 0);
    const normalizedFps = positiveInt(fps, 12, 120);
    const normalizedLoopCount = nonNegativeInt(loopCount, 0, 1000000);
    const frameDurationMs = Math.round(1000 / normalizedFps);
    const order = Array.from({ length: count }, (_, index) => index);
    return {
      id: displayName(name),
      frames: count,
      fps: normalizedFps,
      frameDurationMs,
      frameDurationsMs: Array.from({ length: count }, () => frameDurationMs),
      order,
      loop: normalizedLoopCount === 0,
      loopCount: normalizedLoopCount,
      anchor: { x: Number(anchor?.x) || 0, y: Number(anchor?.y) || 0 },
      tags: Array.isArray(tags) ? [...tags] : [],
      events: [],
      hitboxes: [],
      hurtboxes: [],
    };
  }

  function manifestFrames({ frameMeta, frameReviews, layout }) {
    const reviews = layoutFrameReviews(frameReviews, layout);
    return reviews.map((review, index) => {
      const meta = frameMeta[index] || {};
      return {
        index,
        col: review.col,
        row: review.row,
        sheetRect: review.sheetRect,
        anchor: meta.anchor || { x: 0, y: 0 },
        label: meta.label || '',
        notes: meta.notes || '',
        hash: review.hash,
        bbox: review.bbox,
        alphaPixels: review.pixels,
        softAlphaPixels: review.soft,
        strayPixels: review.strayPixels,
        pinholePixels: review.pinholePixels,
        issues: Array.isArray(review.issues) ? [...review.issues] : [],
      };
    });
  }

  function buildGenericManifest({
    name,
    fps = 12,
    loopCount = 0,
    columns = 1,
    padding = 0,
    frameWidth = 0,
    frameHeight = 0,
    anchor = { x: 0, y: 0 },
    specGuide = null,
    frameMeta = [],
    frameReviews = [],
  }) {
    const normalizedName = displayName(name);
    const layout = buildSheetLayout({
      frameCount: frameReviews.length,
      columns,
      padding,
      frameWidth,
      frameHeight,
    });
    const animation = normalizeAnimation({
      name: normalizedName,
      frameCount: frameReviews.length,
      fps,
      loopCount,
      anchor,
      tags: ['sprite-fan', 'postprocessed', 'atlas-grid'],
    });
    const sharedAnimation = {
      frames: animation.frames,
      fps: animation.fps,
      frameDurationMs: animation.frameDurationMs,
      frameDurationsMs: animation.frameDurationsMs,
      order: animation.order,
      loop: animation.loop,
      loopCount: animation.loopCount,
      anchor: animation.anchor,
      tags: animation.tags,
      events: [],
      hitboxes: [],
      hurtboxes: [],
    };
    return {
      name: normalizedName,
      fps: animation.fps,
      frameWidth: layout.frameWidth,
      frameHeight: layout.frameHeight,
      columns: layout.columns,
      rows: layout.rows,
      frameCount: frameReviews.length,
      padding: layout.padding,
      totalFrames: frameReviews.length,
      generationContract: {
        source: 'sprite-fan/reqs/animation.yml',
        gridVsIndividual: 'atlas-grid',
        maxPromptGrid: { columns: 4, rows: 4, frames: 16 },
        transparentBackground: true,
        stableFrameSize: true,
        metadataPolicy: 'export-grid-animations-order-loop-anchor-empty-gameplay-slots',
      },
      specGuide,
      grid: layout,
      animation,
      animations: { [normalizedName]: sharedAnimation },
      sheetLayout: { ...layout },
      anchor: animation.anchor,
      frames: manifestFrames({ frameMeta, frameReviews, layout }),
    };
  }

  function buildContractManifest({
    name,
    contract,
    fps = 12,
    loopCount = 0,
    frameWidth = 0,
    frameHeight = 0,
    anchor = { x: 0, y: 0 },
    frameMeta = [],
    frameReviews = [],
    pagePlan,
  }) {
    if (!contract?.pageSize) throw new TypeError('a paged target contract is required');
    const normalizedName = displayName(name);
    const plan = pagePlan || buildContractPagePlan({
      name: normalizedName,
      contract,
      frameCount: frameReviews.length,
    });
    const animation = normalizeAnimation({
      name: normalizedName,
      frameCount: frameReviews.length,
      fps,
      loopCount,
      anchor,
      tags: [],
    });
    const stableFrameSize = frameMeta.every((meta) => (
      Number(meta?.width ?? frameWidth) === Number(frameWidth)
      && Number(meta?.height ?? frameHeight) === Number(frameHeight)
    ));
    return {
      name: normalizedName,
      target: contract.id,
      targetLabel: contract.label,
      namespace: contract.namespace,
      gridKey: contract.gridKey,
      grid: {
        columns: contract.cols,
        rows: contract.rows,
        framesPerPage: contract.pageSize,
        padding: 0,
        frameWidth,
        frameHeight,
      },
      transparentBackground: true,
      stableFrameSize,
      pageCount: plan.pageCount,
      totalFrames: frameReviews.length,
      order: animation.order,
      pages: plan.pages.map((page) => ({ ...page })),
      animations: {
        [normalizedName]: {
          frames: animation.frames,
          fps: animation.fps,
          order: animation.order,
          loop: animation.loop,
          loopCount: animation.loopCount,
          anchor: animation.anchor,
          events: [],
          hitboxes: [],
          hurtboxes: [],
        },
      },
      frames: frameReviews.map((review, index) => {
        const meta = frameMeta[index] || {};
        const page = Math.floor(index / contract.pageSize);
        const local = index % contract.pageSize;
        const col = local % contract.cols;
        const row = Math.floor(local / contract.cols);
        return {
          index,
          page,
          col,
          row,
          sheetRect: { x: col * frameWidth, y: row * frameHeight, w: frameWidth, h: frameHeight },
          anchor: meta.anchor || animation.anchor,
          label: meta.label || '',
          notes: meta.notes || '',
          hash: review?.hash,
          issues: Array.isArray(review?.issues) ? [...review.issues] : [],
        };
      }),
      compatibility: {
        badgerRunner: contract.id === 'badger-runner',
        ethicBrawl: contract.id.startsWith('ethic-brawl'),
        hyperblastShooter: contract.id === 'hyperblast-ship-clip',
        arcadeRuntime: contract.id === 'arcade-runtime-4x4',
        maxPromptGrid: `${contract.cols}x${contract.rows}`,
      },
    };
  }

  root.SpriteFanExportCore = Object.freeze({
    positiveInt,
    nonNegativeInt,
    safeFileStem,
    displayName,
    buildSheetLayout,
    layoutFrameReviews,
    summarizeFrameReviews,
    buildReviewReport,
    buildContractPagePlan,
    buildExportFilePlan,
    normalizeAnimation,
    buildGenericManifest,
    buildContractManifest,
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
