(function installSpriteFanUiNavigation(root) {
  'use strict';

  function nextEnabledIndex(enabledItems, startIndex, direction) {
    if (!Array.isArray(enabledItems) || enabledItems.length === 0) return -1;
    if (direction !== 1 && direction !== -1) {
      throw new RangeError('direction must be 1 or -1');
    }
    const length = enabledItems.length;
    const start = Number.isInteger(startIndex) ? startIndex : 0;
    for (let step = 1; step <= length; step += 1) {
      const index = (start + direction * step + length) % length;
      if (Boolean(enabledItems[index])) return index;
    }
    return -1;
  }

  function tabPresentation(tabId, activeId) {
    const active = tabId === activeId;
    return Object.freeze({ active, ariaSelected: active ? 'true' : 'false', tabIndex: active ? 0 : -1 });
  }

  function trappedFocusDecision({ key, shiftKey = false, currentIndex = -1, count = 0 }) {
    if (key === 'Escape') return Object.freeze({ action: 'close' });
    if (key !== 'Tab') return Object.freeze({ action: 'allow' });
    if (count <= 0) return Object.freeze({ action: 'prevent' });
    if (currentIndex < 0) return Object.freeze({ action: 'focus', index: 0 });
    if (shiftKey && currentIndex === 0) return Object.freeze({ action: 'focus', index: count - 1 });
    if (!shiftKey && currentIndex === count - 1) return Object.freeze({ action: 'focus', index: 0 });
    return Object.freeze({ action: 'allow' });
  }

  root.SpriteFanUiNavigation = Object.freeze({
    nextEnabledIndex,
    tabPresentation,
    trappedFocusDecision,
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
